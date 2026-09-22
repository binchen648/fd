import type { GameState } from '../schema/game';
import { getEnabledLocations } from '../core/map-engine';
import type { AbilityEvent, PlayerId, RuleNode } from './types';

const CONDITION_TYPE = 'player_flag_number_not_current_round';
const COMBAT_WIN_ROUND_KEY = 'combatWinRound';

function isDenseStringArray(actual: unknown): actual is string[] {
  if (!Array.isArray(actual)) return false;
  for (let index = 0; index < actual.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(actual, index) || typeof actual[index] !== 'string') return false;
  }
  return true;
}


export function isAcceptedCurrentRoundCombatWinAbsenceCondition(condition: RuleNode): boolean {
  return condition.type === CONDITION_TYPE && condition.key === COMBAT_WIN_ROUND_KEY &&
    Object.keys(condition).length === 2 && Object.keys(condition).every((key) => key === 'type' || key === 'key');
}

/**
 * Record current-round winners from the exact authoritative battle-result envelope.
 * Invalid/stale envelopes fail closed before any runtime mutation.
 */
export function recordCurrentRoundCombatWinsFromBattleResult(state: GameState, event: AbilityEvent): boolean {
  if (!state.abilityRuntime || state.round.activePhase !== 'battle' ||
    !Number.isSafeInteger(state.round.roundNumber) || state.round.roundNumber < 1) return false;
  const round = state.round.roundNumber;
  const phaseId = `battle-phase:${round}`;
  if (event.type !== 'after_battle_result_determined' || event.battlePhaseResolutionId !== phaseId ||
    typeof event.battlefieldId !== 'string' || !event.battlefieldId ||
    typeof event.battleId !== 'string' || typeof event.resultId !== 'string' ||
    event.id !== event.resultId || event.resultId !== `${event.battleId}:result`) return false;

  const knownPlayerIds = new Set(state.players.map((player) => player.id));
  const participants = event.battleParticipantIds;
  const winners = event.battleResult?.winners;
  const losers = event.battleResult?.loserIds;
  if (!isDenseStringArray(participants) || participants.length === 0 || new Set(participants).size !== participants.length ||
    participants.some((playerId) => !playerId || !knownPlayerIds.has(playerId)) ||
    !isDenseStringArray(winners) || new Set(winners).size !== winners.length ||
    winners.some((playerId) => !playerId || !knownPlayerIds.has(playerId) || !participants.includes(playerId)) ||
    !isDenseStringArray(losers) || new Set(losers).size !== losers.length ||
    losers.some((playerId) => !playerId || !knownPlayerIds.has(playerId) || !participants.includes(playerId)) ||
    winners.some((playerId) => losers.includes(playerId))) return false;

  const closedLocations = new Set(
    ((state as unknown as { modeState?: { closedLocations?: unknown } }).modeState?.closedLocations instanceof Array
      ? (state as unknown as { modeState: { closedLocations: unknown[] } }).modeState.closedLocations
      : []).filter((locationId): locationId is string => typeof locationId === 'string'),
  );
  const knownBattlefieldIds = new Set<string>(getEnabledLocations(state.map, state.locationConfig)
    .filter((location) => !closedLocations.has(location.id))
    .filter((location) => location.tags.includes('battlefield') || location.rewardHooks.includes('battle_rewards'))
    .map((location) => location.id));
  if (!knownBattlefieldIds.has(event.battlefieldId)) return false;

  const battleIdPrefix = `${phaseId}:battle:${event.battlefieldId}:`;
  if (!event.battleId.startsWith(battleIdPrefix)) return false;
  const ordinal = event.battleId.slice(battleIdPrefix.length);
  if (!/^[1-9]\d*$/.test(ordinal) || !Number.isSafeInteger(Number(ordinal))) return false;

  const store = state.abilityRuntime.combatWinRoundByPlayer ??= {};
  for (const winnerId of winners) store[winnerId] = round;
  return true;
}

export function currentRoundCombatWinAbsent(
  state: GameState,
  controllerId: PlayerId,
  event: AbilityEvent | undefined,
): boolean {
  if (!state.abilityRuntime || state.round.activePhase !== 'round_end' || event?.type !== 'round_end' ||
    !state.players.some((player) => player.id === controllerId) ||
    !Number.isSafeInteger(state.round.roundNumber) || state.round.roundNumber < 1) return false;
  const recorded = state.abilityRuntime.combatWinRoundByPlayer?.[controllerId];
  if (recorded !== undefined && (!Number.isSafeInteger(recorded) || recorded < 1 || recorded > state.round.roundNumber)) return false;
  return recorded !== state.round.roundNumber;
}
