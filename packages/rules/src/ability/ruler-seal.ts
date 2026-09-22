import type { GameState } from '../schema/game';
import type { AuthoringAbility, PlayerId, RuleNode, RulerSealBinding } from './types';

function node(value: unknown): RuleNode { return value && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {}; }
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.filter((entry): entry is RuleNode => !!entry && typeof entry === 'object' && !Array.isArray(entry)) : []; }
function str(value: unknown): string { return typeof value === 'string' ? value : ''; }
function keysAre(value: RuleNode, keys: string[]): boolean {
  const actual = Object.keys(value).sort(); const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function emptyResponse(ability: AuthoringAbility): boolean {
  return ability.responseWindow.order === 'turn_order' && ability.responseWindow.passBehavior === 'decline_this_window' &&
    Object.keys(ability.responseWindow).every((key) => ['order', 'passBehavior'].includes(key));
}
function exactActionActivation(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' && ability.activation.phase === 'action' && ability.activation.opens === 'controller_action_window' &&
    keysAre(ability.activation, ['phase', 'opens']);
}
function exactAutomaticAuthority(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}
function exactEmptyCommon(ability: AuthoringAbility): boolean {
  return ability.conditions.length === 0 && ability.cost.length === 0 && ability.creates.length === 0 && ability.ruleModifiers.length === 0 &&
    Object.keys(ability.lifecycle).length === 0 && Object.keys(ability.visibility).length === 0 && emptyResponse(ability);
}
function containsNodeType(value: unknown, types: Set<string>): boolean {
  if (Array.isArray(value)) return value.some((entry) => containsNodeType(entry, types));
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return types.has(str(record.type)) || Object.values(record).some((entry) => containsNodeType(entry, types));
}

const bindingReservedTypes = new Set(['grant_ruler_seals', 'ruler_copy_steal_guard', 'least_ruler_binding_count']);
const useReservedTypes = new Set(['use_ruler_seal', 'bound_by_controller_ruler_seal']);

export function isRulerSealBindingCandidate(ability: AuthoringAbility): boolean {
  return containsNodeType(ability, bindingReservedTypes);
}

export function isRulerSealBindingSemantic(ability: AuthoringAbility): boolean {
  if (!isRulerSealBindingCandidate(ability) || !exactActionActivation(ability) || !exactAutomaticAuthority(ability) || !exactEmptyCommon(ability)) return false;
  if (!keysAre(ability.limit, ['type', 'uses', 'scope']) || ability.limit.type !== 'per_game' || ability.limit.uses !== 3 || ability.limit.scope !== 'this_card') return false;
  if (ability.targets.length !== 1 || ability.effects.length !== 2) return false;
  const target = ability.targets[0]!; const count = node(target.count); const constraints = nodes(target.constraints);
  if (!keysAre(target, ['id', 'type', 'count', 'constraints']) || target.id !== 'bound_players' || target.type !== 'player' ||
    !keysAre(count, ['min', 'max']) || count.min !== 2 || count.max !== 2 || constraints.length !== 2 ||
    !keysAre(constraints[0]!, ['type']) || constraints[0]!.type !== 'not_controller' ||
    !keysAre(constraints[1]!, ['type']) || constraints[1]!.type !== 'least_ruler_binding_count') return false;
  const grant = ability.effects[0]!; const guard = ability.effects[1]!;
  return keysAre(grant, ['type', 'target']) && grant.type === 'grant_ruler_seals' && grant.target === 'bound_players' &&
    keysAre(guard, ['type', 'policy']) && guard.type === 'ruler_copy_steal_guard' && guard.policy === 'forbid_source_and_effects';
}

export function isRulerSealUseCandidate(ability: AuthoringAbility): boolean {
  return containsNodeType(ability, useReservedTypes);
}

export function isRulerSealUseSemantic(ability: AuthoringAbility): boolean {
  if (!isRulerSealUseCandidate(ability) || !exactActionActivation(ability) || !exactAutomaticAuthority(ability) || !exactEmptyCommon(ability)) return false;
  // Per-seal once-only use is enforced by consuming RulerSealBinding state, not by a source-card usage limit.
  if (Object.keys(ability.limit).length !== 0) return false;
  if (ability.targets.length !== 2 || ability.effects.length !== 1) return false;
  const option = ability.targets[0]!; const optionCount = node(option.count); const options = nodes(option.options);
  if (!keysAre(option, ['id', 'type', 'count', 'options']) || option.id !== 'ruler_seal_option' || option.type !== 'choice' ||
    !keysAre(optionCount, ['min', 'max']) || optionCount.min !== 1 || optionCount.max !== 1 || options.length !== 3 ||
    options.map((entry) => str(entry.id)).join('|') !== 'move|lock_movement|free_play_reward' || options.some((entry) => !keysAre(entry, ['id']))) return false;
  const target = ability.targets[1]!; const targetCount = node(target.count); const constraints = nodes(target.constraints);
  if (!keysAre(target, ['id', 'type', 'count', 'constraints']) || target.id !== 'bound_player' || target.type !== 'player' ||
    !keysAre(targetCount, ['min', 'max']) || targetCount.min !== 1 || targetCount.max !== 1 || constraints.length !== 1 ||
    !keysAre(constraints[0]!, ['type']) || constraints[0]!.type !== 'bound_by_controller_ruler_seal') return false;
  const effect = ability.effects[0]!; const destinations = Array.isArray(effect.moveDestinations) ? effect.moveDestinations : [];
  return keysAre(effect, ['type', 'target', 'option', 'moveDestinations', 'rewardVp']) && effect.type === 'use_ruler_seal' &&
    effect.target === 'bound_player' && effect.option === 'ruler_seal_option' && effect.rewardVp === 2 &&
    destinations.length === 2 && destinations.every((entry) => typeof entry === 'string' && entry.length > 0) && new Set(destinations).size === 2;
}

export function rulerSealBindingCount(state: GameState, issuerPlayerId: PlayerId, boundPlayerId: PlayerId): number {
  const value = state.abilityRuntime?.rulerSealBindingHistory?.[issuerPlayerId]?.[boundPlayerId] ?? 0;
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function legalRulerSealBindingPairs(state: GameState, issuerPlayerId: PlayerId): Array<[PlayerId, PlayerId]> {
  const opponents = state.players.filter((player) => player.status === 'active' && player.id !== issuerPlayerId);
  if (opponents.length < 2) return [];
  const counts = new Map(opponents.map((player) => [player.id, rulerSealBindingCount(state, issuerPlayerId, player.id)]));
  const firstMinimum = Math.min(...counts.values());
  const pairs: Array<[PlayerId, PlayerId]> = [];
  for (const first of opponents.filter((player) => counts.get(player.id) === firstMinimum)) {
    const simulated = new Map(counts);
    simulated.set(first.id, (simulated.get(first.id) ?? 0) + 1);
    const secondMinimum = Math.min(...simulated.values());
    for (const second of opponents) {
      if (second.id === first.id || simulated.get(second.id) !== secondMinimum) continue;
      pairs.push([first.id, second.id]);
    }
  }
  return pairs;
}

export function eligibleLeastBoundPlayerIds(state: GameState, issuerPlayerId: PlayerId, slots = 2): PlayerId[] {
  if (slots !== 2) return [];
  return [...new Set(legalRulerSealBindingPairs(state, issuerPlayerId).flat())];
}

export function isLeastBoundSelection(state: GameState, issuerPlayerId: PlayerId, selectedPlayerIds: PlayerId[], slots = 2): boolean {
  if (slots !== 2 || selectedPlayerIds.length !== 2 || new Set(selectedPlayerIds).size !== 2) return false;
  return legalRulerSealBindingPairs(state, issuerPlayerId).some((pair) =>
    pair[0] === selectedPlayerIds[0] && pair[1] === selectedPlayerIds[1]);
}

export function unspentRulerSealBindings(state: GameState, issuerPlayerId: PlayerId, boundPlayerId?: PlayerId): RulerSealBinding[] {
  return (state.abilityRuntime?.rulerSealBindings ?? []).filter((binding) => !binding.spent && binding.issuerPlayerId === issuerPlayerId &&
    (boundPlayerId === undefined || binding.boundPlayerId === boundPlayerId));
}
