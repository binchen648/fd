import type { GameState } from '../schema/game';
import { getEnabledLocations } from '../core/map-engine';
import { hostOperations, type AbilityEvent, type AuthoringAbility, type PlayerId, type RuleNode } from './types';

export const COMBAT_OPPONENT_POWER_VP_REWARD_EFFECT = 'combat_opponent_power_vp_reward';
export const COMBAT_OPPONENT_POWER_VP_REWARD_DIVISOR = 5;

function isRuleNode(value: unknown): value is RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function node(value: unknown): RuleNode { return isRuleNode(value) ? value : {}; }
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function exactKeys(value: RuleNode, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
function exactEmptyArray(raw: RuleNode, key: string): boolean {
  const value = raw[key];
  return value === undefined || (Array.isArray(value) && value.length === 0);
}
function exactEmptyObject(raw: RuleNode, key: string): boolean {
  const value = raw[key];
  return value === undefined || (isRuleNode(value) && Object.keys(value).length === 0);
}
function isDenseStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) return false;
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index) || typeof value[index] !== 'string' || value[index].length === 0) return false;
  }
  return true;
}
function exactStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/** Reserve the exact FB2-48 compound token and the historical generic spellings so malformed siblings fail closed. */
export function isCombatOpponentPowerVpRewardCandidate(ability: AuthoringAbility | RuleNode): boolean {
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (!value || typeof value !== 'object') return false;
    const current = node(value);
    if (current.type === COMBAT_OPPONENT_POWER_VP_REWARD_EFFECT || current.type === 'choose_players' ||
        current.scope === 'event_combat_opponents' || current.type === 'selected_player_event_combat_power' ||
        current.metric === 'selected_player_event_combat_power' || current.op === 'floor_divide') return true;
    return Object.values(current).some(visit);
  };
  return visit(ability as RuleNode);
}

/** Exact FB2-48 post-battle frozen-opponent-power reward envelope. */
export function isAcceptedCombatOpponentPowerVpRewardAbility(
  ability: AuthoringAbility | RuleNode,
  form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw = ability as RuleNode;
  if (!exactKeys(raw, [
    'id', 'kind', 'printedClause', 'markers', 'activation', 'conditions', 'targets', 'effects', 'cost', 'creates',
    'ruleModifiers', 'lifecycle', 'responseWindow', 'limit', 'visibility', 'execution',
  ]) || raw.kind !== 'residual') return false;
  if (!exactEmptyArray(raw, 'markers')) return false;

  const activation = node(raw.activation);
  if (!exactKeys(activation, ['trigger', 'requiresSourceState']) ||
      activation.trigger !== 'after_battle_result_determined' || activation.requiresSourceState !== 'active') return false;

  const conditions = nodes(raw.conditions);
  if (conditions.length !== 2 || conditions[0]!.type !== 'source_active' || conditions[1]!.type !== 'event_location_equals_controller' ||
      !exactKeys(conditions[0]!, ['type']) || !exactKeys(conditions[1]!, ['type'])) return false;

  for (const key of ['targets', 'cost', 'creates', 'ruleModifiers']) {
    if (!exactEmptyArray(raw, key)) return false;
  }
  const effects = nodes(raw.effects);
  if (effects.length !== 1 || effects[0]!.type !== COMBAT_OPPONENT_POWER_VP_REWARD_EFFECT ||
      !exactKeys(effects[0]!, ['type'])) return false;

  const lifecycle = node(raw.lifecycle);
  if (!exactKeys(lifecycle, ['duration']) || lifecycle.duration !== 'while_active') return false;
  for (const key of ['limit', 'visibility']) if (!exactEmptyObject(raw, key)) return false;

  if (form === 'authoring') {
    if (!exactEmptyObject(raw, 'responseWindow')) return false;
  } else {
    const response = node(raw.responseWindow);
    if (!exactKeys(response, ['order', 'passBehavior']) || response.order !== 'turn_order' || response.passBehavior !== 'decline_this_window') return false;
  }

  const execution = node(raw.execution);
  if (execution.mode !== 'automatic' || !exactKeys(execution, ['mode', 'hostOps', 'allowedOperations'])) return false;
  for (const key of ['hostOps', 'allowedOperations']) {
    if (!Object.prototype.hasOwnProperty.call(execution, key)) continue;
    const value = execution[key];
    if (!Array.isArray(value)) return false;
    if (form === 'authoring' && value.length !== 0) return false;
    if (form === 'compiled') {
      const exactEmpty = value.length === 0;
      const exactDefault = value.length === hostOperations.length && hostOperations.every((operation, index) => value[index] === operation);
      if (!exactEmpty && !exactDefault) return false;
    }
  }
  return true;
}

export interface TrustedCombatOpponentPowerRewardFacts {
  battlePhaseResolutionId: string;
  battleId: string;
  resultId: string;
  battlefieldId: string;
  participantIds: PlayerId[];
  participantPowers: Record<PlayerId, number>;
  opponentIds: PlayerId[];
}

/** Validate the exact authoritative root and freeze battle-local powers; never derive them from current board state. */
export function trustedCombatOpponentPowerRewardFacts(
  state: GameState,
  controllerId: PlayerId,
  event: AbilityEvent | undefined,
): TrustedCombatOpponentPowerRewardFacts | undefined {
  if (!event || state.round.activePhase !== 'battle' || !Number.isSafeInteger(state.round.roundNumber) || state.round.roundNumber < 1) return undefined;
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  const battlefieldId = event.battlefieldId;
  const battleId = event.battleId;
  const resultId = event.resultId;
  if (event.type !== 'after_battle_result_determined' || event.id !== resultId || event.battlePhaseResolutionId !== phaseId ||
      typeof battlefieldId !== 'string' || !battlefieldId || typeof battleId !== 'string' || typeof resultId !== 'string' ||
      resultId !== `${battleId}:result`) return undefined;
  if (!state.abilityRuntime?.processedEvents.includes(resultId)) return undefined;
  const frozenRoot = state.abilityRuntime.trustedBattleResultSnapshots?.[resultId];
  if (!frozenRoot) return undefined;

  const closedLocations = new Set(
    ((state as unknown as { modeState?: { closedLocations?: unknown } }).modeState?.closedLocations instanceof Array
      ? (state as unknown as { modeState: { closedLocations: unknown[] } }).modeState.closedLocations
      : []).filter((locationId): locationId is string => typeof locationId === 'string'),
  );
  const knownBattlefieldIds = new Set<string>(getEnabledLocations(state.map, state.locationConfig)
    .filter((location) => !closedLocations.has(location.id))
    .filter((location) => location.tags.includes('battlefield') || location.rewardHooks.includes('battle_rewards'))
    .map((location) => location.id));
  if (!knownBattlefieldIds.has(battlefieldId)) return undefined;

  const controller = state.players.find((candidate) => candidate.id === controllerId);
  if (!controller || controller.locationId !== battlefieldId) return undefined;

  const prefix = `${phaseId}:battle:${battlefieldId}:`;
  const ordinal = battleId.startsWith(prefix) ? battleId.slice(prefix.length) : '';
  if (!/^[1-9]\d*$/.test(ordinal) || !Number.isSafeInteger(Number(ordinal))) return undefined;

  const participantIds = event.battleParticipantIds;
  const powers = event.battleParticipantPowers;
  const winners = event.battleResult?.winners;
  const losers = event.battleResult?.loserIds;
  const knownPlayers = new Set(state.players.map((player) => player.id));
  if (!isDenseStringArray(participantIds) || participantIds.length < 2 || new Set(participantIds).size !== participantIds.length ||
      participantIds.some((id) => !knownPlayers.has(id)) || !participantIds.includes(controllerId) ||
      !isRuleNode(powers) || Object.keys(powers).length !== participantIds.length ||
      Object.keys(powers).some((id) => !participantIds.includes(id)) ||
      participantIds.some((id) => typeof powers[id] !== 'number' || !Number.isSafeInteger(powers[id]) || Number(powers[id]) < 0) ||
      !isDenseStringArray(winners) || winners.length === 0 || new Set(winners).size !== winners.length ||
      !isDenseStringArray(losers) || new Set(losers).size !== losers.length ||
      winners.some((id) => !participantIds.includes(id) || losers.includes(id)) || losers.some((id) => !participantIds.includes(id))) return undefined;
  if (frozenRoot.battlePhaseResolutionId !== phaseId || frozenRoot.battleId !== battleId || frozenRoot.resultId !== resultId ||
      frozenRoot.battlefieldId !== battlefieldId || !exactStringArray(frozenRoot.battleParticipantIds, participantIds) ||
      !exactStringArray(frozenRoot.winners, winners) || !exactStringArray(frozenRoot.loserIds, losers) ||
      !frozenRoot.battleParticipantPowers || Object.keys(frozenRoot.battleParticipantPowers).length !== participantIds.length ||
      participantIds.some((id) => frozenRoot.battleParticipantPowers?.[id] !== powers[id])) return undefined;

  const participantPowers = Object.fromEntries(participantIds.map((id) => [id, Number(powers[id])])) as Record<PlayerId, number>;
  return {
    battlePhaseResolutionId: phaseId,
    battleId,
    resultId,
    battlefieldId,
    participantIds: [...participantIds],
    participantPowers,
    opponentIds: participantIds.filter((id) => id !== controllerId),
  };
}
