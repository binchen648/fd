import type { GameState } from '../schema/game';
import type { AbilityEvent, PlayerId, RuleNode } from './types';

const CONDITION_TYPE = 'player_flag_number_not_current_round';
const COMBAT_LOSS_ROUND_KEY = 'combatLossRound';

function exactStringArray(actual: unknown, expected: string[]): boolean {
  return Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function exactStringSet(actual: unknown, expected: string[]): boolean {
  if (!Array.isArray(actual) || actual.some((value) => typeof value !== 'string')) return false;
  return actual.length === expected.length && new Set(actual).size === actual.length && actual.every((value) => expected.includes(value));
}

export function isAcceptedCurrentRoundCombatLossAbsenceCondition(condition: RuleNode): boolean {
  return condition.type === CONDITION_TYPE && condition.key === COMBAT_LOSS_ROUND_KEY &&
    Object.keys(condition).length === 2 && Object.keys(condition).every((key) => key === 'type' || key === 'key');
}

export function currentRoundCombatLossAbsent(
  state: GameState,
  controllerId: PlayerId,
  event: AbilityEvent | undefined,
): boolean {
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  if (!event || event.type !== 'after_battle_ended' || event.id !== `${phaseId}:after_battle_ended` ||
      event.battlePhaseResolutionId !== phaseId) return false;

  const results = state.battleResults;
  const expectedBattleIds = results.map((result, index) => `${phaseId}:battle:${result.battlefieldId}:${index + 1}`);
  const expectedResultIds = expectedBattleIds.map((battleId) => `${battleId}:result`);
  const expectedScoringReceiptIds = results.map((result) => `${phaseId}:score:${result.battlefieldId}`);
  const expectedParticipants = [...new Set(results.flatMap((result) => result.participantBreakdowns.map((participant) => participant.playerId)))];

  if (!exactStringArray(event.battleIds, expectedBattleIds) ||
      !exactStringArray(event.resultIds, expectedResultIds) ||
      !exactStringArray(event.scoringReceiptIds, expectedScoringReceiptIds) ||
      !exactStringSet(event.battleParticipantIds, expectedParticipants) ||
      !Array.isArray(event.battleOutcomes) || event.battleOutcomes.length !== results.length) return false;

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index]!;
    const outcome = event.battleOutcomes[index];
    if (!outcome || outcome.battlefieldId !== result.battlefieldId ||
        !exactStringSet(outcome.winnerPlayerIds, [...new Set(result.winnerPlayerIds)])) return false;
  }

  return !results.some((result) =>
    result.participantBreakdowns.some((participant) => participant.playerId === controllerId) &&
    !result.winnerPlayerIds.includes(controllerId));
}
