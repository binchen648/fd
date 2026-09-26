import type { GameState } from '../schema/game';
import { getEnabledLocations } from '../core/map-engine';
import type { AbilityEvent, PlayerId, RuleNode } from './types';

const CONDITION_TYPE = 'player_flag_number_not_current_round';
const COMBAT_LOSS_ROUND_KEY = 'combatLossRound';

function isDenseStringArray(actual: unknown): actual is string[] {
  if (!Array.isArray(actual)) return false;
  for (let index = 0; index < actual.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(actual, index) || typeof actual[index] !== 'string') return false;
  }
  return true;
}

function exactStringSet(actual: unknown, expected: string[]): boolean {
  if (!isDenseStringArray(actual)) return false;
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
  if (state.round.activePhase !== 'battle') return false;
  const knownPlayerIds = new Set(state.players.map((player) => player.id));
  const closedLocations = new Set(
    ((state as unknown as { modeState?: { closedLocations?: unknown } }).modeState?.closedLocations instanceof Array
      ? (state as unknown as { modeState: { closedLocations: unknown[] } }).modeState.closedLocations
      : []).filter((locationId): locationId is string => typeof locationId === 'string'),
  );
  const knownBattlefieldIds = new Set<string>(getEnabledLocations(state.map, state.locationConfig)
    .filter((location) => !closedLocations.has(location.id))
    .filter((location) => location.tags.includes('battlefield') || location.rewardHooks.includes('battle_rewards'))
    .map((location) => location.id));
  if (!knownPlayerIds.has(controllerId)) return false;
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  if (!event || event.type !== 'after_battle_ended' || event.id !== `${phaseId}:after_battle_ended` ||
      event.battlePhaseResolutionId !== phaseId) return false;

  const battleIds = event.battleIds;
  const resultIds = event.resultIds;
  const scoringReceiptIds = event.scoringReceiptIds;
  const outcomes = event.battleOutcomes;
  if (!isDenseStringArray(battleIds) || !isDenseStringArray(resultIds) || !isDenseStringArray(scoringReceiptIds) ||
      !Array.isArray(outcomes) ||
      battleIds.length !== outcomes.length || resultIds.length !== outcomes.length ||
      scoringReceiptIds.length !== outcomes.length || new Set(battleIds).size !== battleIds.length ||
      new Set(resultIds).size !== resultIds.length || new Set(scoringReceiptIds).size !== scoringReceiptIds.length) return false;

  const representedParticipants: PlayerId[] = [];
  let previousBattleOrdinal: number | undefined;
  for (let index = 0; index < outcomes.length; index += 1) {
    const outcome = outcomes[index];
    const battleId = battleIds[index];
    const participants = outcome?.participantPlayerIds;
    const winners = outcome?.winnerPlayerIds;
    const battleIdPrefix = `${phaseId}:battle:${outcome?.battlefieldId}:`;
    const battleOrdinal = battleId?.slice(battleIdPrefix.length);
    const battleOrdinalValue = battleOrdinal && /^[1-9]\d*$/.test(battleOrdinal) ? Number(battleOrdinal) : undefined;
    if (!outcome || typeof outcome.battlefieldId !== 'string' || !knownBattlefieldIds.has(outcome.battlefieldId) || !battleId ||
        !battleId.startsWith(battleIdPrefix) || battleOrdinalValue === undefined || !Number.isSafeInteger(battleOrdinalValue) ||
        (previousBattleOrdinal !== undefined && battleOrdinalValue !== previousBattleOrdinal + 1) ||
        resultIds[index] !== `${battleId}:result` ||
        scoringReceiptIds[index] !== `${phaseId}:score:${outcome.battlefieldId}` ||
        !isDenseStringArray(participants) || participants.length === 0 || participants.some((value) => value.length === 0 || !knownPlayerIds.has(value)) ||
        new Set(participants).size !== participants.length ||
        !isDenseStringArray(winners) || winners.length === 0 || winners.some((value) => value.length === 0 || !knownPlayerIds.has(value)) ||
        new Set(winners).size !== winners.length || winners.some((winnerId) => !participants.includes(winnerId))) return false;
    previousBattleOrdinal = battleOrdinalValue;
    representedParticipants.push(...participants);
  }

  if (!isDenseStringArray(event.battleParticipantIds) ||
      event.battleParticipantIds.some((value) => value.length === 0 || !knownPlayerIds.has(value)) ||
      !exactStringSet(event.battleParticipantIds, [...new Set(representedParticipants)])) return false;

  return !outcomes.some((outcome) => {
    const participants = outcome.participantPlayerIds;
    return Array.isArray(participants) && participants.includes(controllerId) && !outcome.winnerPlayerIds.includes(controllerId);
  });
}
