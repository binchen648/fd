import type { GameState } from '../schema/game';
import { getEffectiveCardAttributes } from './card-instance-state';
import type { AuthoringAbility, PlayerId, RuleNode } from './types';

export const EXACT_ACTIVE_ATTACK_ATTRIBUTE_PAIR_CONDITION = 'controller_active_attacks_exact_distinct_attribute_pair';
export const TIMED_GLOBAL_RESOURCE_SUPPRESSION_EFFECT = 'suppress_all_active_players_resource_through_round';
export type TimedResourceSuppressionKind = 'normal_card_draw' | 'mana_gain';

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}

function emptyRecord(value: RuleNode): boolean { return Object.keys(value).length === 0; }

export function isExactActiveAttackAttributePairCondition(value: RuleNode): boolean {
  return value.type === EXACT_ACTIVE_ATTACK_ATTRIBUTE_PAIR_CONDITION &&
    typeof value.firstAttribute === 'string' && value.firstAttribute.length > 0 &&
    typeof value.secondAttribute === 'string' && value.secondAttribute.length > 0 &&
    value.firstAttribute !== value.secondAttribute && value.distinctCards === true &&
    exactKeys(value, ['type', 'firstAttribute', 'secondAttribute', 'distinctCards']);
}

export function controllerHasExactDistinctActiveAttackAttributePair(
  state: GameState,
  controllerId: string,
  condition: RuleNode,
): boolean {
  if (!isExactActiveAttackAttributePairCondition(condition)) return false;
  const active = state.cards.filter((candidate) => {
    const runtimeState = state.abilityRuntime?.cardState[candidate.instanceId];
    return candidate.controllerPlayerId === controllerId && candidate.zone === 'attack_area' &&
      runtimeState?.active === true && runtimeState.faceDown !== true;
  });
  const first = active.filter((candidate) =>
    getEffectiveCardAttributes(state, candidate.instanceId).includes(String(condition.firstAttribute)));
  const second = active.filter((candidate) =>
    getEffectiveCardAttributes(state, candidate.instanceId).includes(String(condition.secondAttribute)));
  return first.length === 1 && second.length === 1 && first[0]!.instanceId !== second[0]!.instanceId;
}

export function isTimedGlobalResourceSuppressionEffect(value: RuleNode): boolean {
  return value.type === TIMED_GLOBAL_RESOURCE_SUPPRESSION_EFFECT &&
    (value.resource === 'normal_card_draw' || value.resource === 'mana_gain') &&
    value.roundsAfterCurrent === 1 &&
    exactKeys(value, ['type', 'resource', 'roundsAfterCurrent']);
}

/** Find any occurrence of the powerful suppression primitive, including nested wrapper nodes. */
export function containsTimedGlobalResourceSuppressionNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsTimedGlobalResourceSuppressionNode);
  if (value === null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record.type === TIMED_GLOBAL_RESOURCE_SUPPRESSION_EFFECT) return true;
  return Object.values(record).some(containsTimedGlobalResourceSuppressionNode);
}

function isExactSourceReversalCondition(value: RuleNode): boolean {
  if (value.type !== 'source_reversed') return false;
  if (value.negated === undefined) return exactKeys(value, ['type']);
  return value.negated === true && exactKeys(value, ['type', 'negated']);
}

export function isAcceptedTimedGlobalResourceSuppressionAbility(ability: AuthoringAbility): boolean {
  const activation = ability.activation;
  const response = ability.responseWindow;
  return ability.kind === 'phase_action' && ability.execution.mode === 'automatic' &&
    ability.execution.allowedOperations.length === 0 &&
    activation.phase === 'action' && activation.opens === 'controller_action_window' && activation.requiresSourceState === 'active' &&
    Object.keys(activation).length === 3 && Object.keys(activation).every((key) => ['phase', 'opens', 'requiresSourceState'].includes(key)) &&
    ability.conditions.length === 1 && isExactSourceReversalCondition(ability.conditions[0]!) &&
    ability.targets.length === 0 && ability.cost.length === 0 && ability.ruleModifiers.length === 0 && ability.creates.length === 0 &&
    emptyRecord(ability.lifecycle) && emptyRecord(ability.limit) && emptyRecord(ability.visibility) &&
    Object.keys(response).length === 2 && response.order === 'turn_order' && response.passBehavior === 'decline_this_window' &&
    ability.effects.length === 1 && isTimedGlobalResourceSuppressionEffect(ability.effects[0]!);
}

function throughRoundMap(state: GameState, resource: TimedResourceSuppressionKind): Record<PlayerId, number> {
  if (!state.abilityRuntime) throw new Error('Ability runtime is not initialized');
  if (resource === 'normal_card_draw') return state.abilityRuntime.normalCardDrawBlockedThroughRoundByPlayer ??= {};
  return state.abilityRuntime.manaGainBlockedThroughRoundByPlayer ??= {};
}

export function applyTimedGlobalResourceSuppression(
  state: GameState,
  effect: RuleNode,
): { resource: TimedResourceSuppressionKind; throughRound: number; playerIds: PlayerId[] } {
  if (!isTimedGlobalResourceSuppressionEffect(effect)) throw new Error('Unsupported timed resource suppression effect');
  const resource = effect.resource as TimedResourceSuppressionKind;
  const throughRound = state.round.roundNumber + Number(effect.roundsAfterCurrent);
  const map = throughRoundMap(state, resource);
  const playerIds = state.players.filter((candidate) => candidate.status === 'active').map((candidate) => candidate.id);
  for (const playerId of playerIds) map[playerId] = Math.max(map[playerId] ?? -1, throughRound);
  return { resource, throughRound, playerIds };
}

export function isNormalCardDrawSuppressed(state: GameState, playerId: string): boolean {
  const throughRound = state.abilityRuntime?.normalCardDrawBlockedThroughRoundByPlayer?.[playerId];
  return Number.isSafeInteger(throughRound) && Number(throughRound) >= state.round.roundNumber;
}

export function isManaGainSuppressed(state: GameState, playerId: string): boolean {
  if (state.abilityRuntime?.manaGainBlocked.includes(playerId)) return true;
  const throughRound = state.abilityRuntime?.manaGainBlockedThroughRoundByPlayer?.[playerId];
  return Number.isSafeInteger(throughRound) && Number(throughRound) >= state.round.roundNumber;
}

export function expireTimedResourceSuppressions(state: GameState): void {
  const runtime = state.abilityRuntime;
  if (!runtime) return;
  for (const map of [runtime.normalCardDrawBlockedThroughRoundByPlayer, runtime.manaGainBlockedThroughRoundByPlayer]) {
    if (!map) continue;
    for (const [playerId, throughRound] of Object.entries(map)) {
      if (!Number.isSafeInteger(throughRound) || throughRound < state.round.roundNumber) delete map[playerId];
    }
  }
}
