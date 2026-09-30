import type { AuthoringAbility, RuleNode } from './types';

export const CREATE_EVENT_PLAYER_DEFINITION_COPIES_EFFECT = 'create_event_player_definition_copies' as const;
export const GLOBAL_OPTIONAL_DEFINITION_REVEAL_REWARD_EFFECT = 'global_optional_definition_reveal_reward' as const;
export const REVEAL_ALL_HANDS_ZERO_MATCHING_ATTACKS_EFFECT = 'reveal_all_hands_zero_matching_attacks' as const;
export const OPPONENT_DISCARD_FREE_PLAY_ALL_MATCHING_EFFECT = 'opponent_discard_free_play_all_matching' as const;
export const LINK_GENERATED_CARD_POWER_EFFECT = 'link_generated_card_round_power' as const;
export const RETURN_LINKED_GENERATED_CARD_AFTER_BATTLE_EFFECT = 'return_linked_generated_card_after_battle' as const;

function node(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function str(value: unknown): string { return typeof value === 'string' ? value : ''; }
function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function emptyObject(value: unknown): boolean { return Object.keys(node(value)).length === 0; }
function automatic(a: AuthoringAbility): boolean {
  return a.execution.mode === 'automatic' && Array.isArray(a.execution.allowedOperations) && a.execution.allowedOperations.length === 0;
}
function exactSourceCondition(a: AuthoringAbility, state: 'source_owned' | 'source_active'): boolean {
  return a.conditions.length === 1 && a.conditions[0]?.type === state && exactKeys(a.conditions[0]!, ['type']);
}
function exactCommonEmpty(a: AuthoringAbility): boolean {
  return a.cost.length === 0 && a.creates.length === 0 && a.ruleModifiers.length === 0 &&
    emptyObject(a.lifecycle) && emptyObject(a.limit) && emptyObject(a.visibility);
}
function validDefinitionId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256 && !/\s/.test(value);
}

export function isCreateEventPlayerDefinitionCopiesEffect(value: RuleNode): boolean {
  return value.type === CREATE_EVENT_PLAYER_DEFINITION_COPIES_EFFECT && validDefinitionId(value.definitionId) &&
    value.target === 'event_player' && value.toZone === 'hand' && value.count === 2 && value.provenance === 'source_card' &&
    exactKeys(value, ['type', 'definitionId', 'target', 'toZone', 'count', 'provenance']);
}
export function isGlobalOptionalDefinitionRevealRewardEffect(value: RuleNode): boolean {
  return value.type === GLOBAL_OPTIONAL_DEFINITION_REVEAL_REWARD_EFFECT && validDefinitionId(value.definitionId) &&
    value.rewardVp === 2 && value.revealMax === 1 && exactKeys(value, ['type', 'definitionId', 'rewardVp', 'revealMax']);
}
export function isRevealAllHandsZeroMatchingAttacksEffect(value: RuleNode): boolean {
  return value.type === REVEAL_ALL_HANDS_ZERO_MATCHING_ATTACKS_EFFECT && validDefinitionId(value.definitionId) &&
    value.power === 0 && value.duration === 'this_round' &&
    exactKeys(value, ['type', 'definitionId', 'power', 'duration']);
}
export function isOpponentDiscardFreePlayAllMatchingEffect(value: RuleNode): boolean {
  return value.type === OPPONENT_DISCARD_FREE_PLAY_ALL_MATCHING_EFFECT && validDefinitionId(value.definitionId) &&
    str(value.target) !== '' && value.transferVp === 2 && value.playCost === 0 && value.mode === 'all_or_none' &&
    exactKeys(value, ['type', 'target', 'definitionId', 'transferVp', 'playCost', 'mode']);
}
export function isLinkGeneratedCardPowerEffect(value: RuleNode): boolean {
  return value.type === LINK_GENERATED_CARD_POWER_EFFECT && value.amount === 6 && value.duration === 'this_round' &&
    value.generator === 'generated_by_source_card' && value.dedupeSamePlayer === true &&
    exactKeys(value, ['type', 'amount', 'duration', 'generator', 'dedupeSamePlayer']);
}
export function isReturnLinkedGeneratedCardAfterBattleEffect(value: RuleNode): boolean {
  return value.type === RETURN_LINKED_GENERATED_CARD_AFTER_BATTLE_EFFECT && value.destination === 'generator_owner_discard' &&
    value.generator === 'generated_by_source_card' && exactKeys(value, ['type', 'destination', 'generator']);
}

function targetCount(target: RuleNode, min: number, max: number): boolean {
  const count = node(target.count);
  return count.min === min && count.max === max && exactKeys(count, ['min', 'max']);
}
function controllerHandTarget(target: RuleNode, min: number, max: number): boolean {
  const scope = node(target.scope);
  return target.type === 'card_instance' && targetCount(target, min, max) &&
    scope.zone === 'hand' && scope.owner === 'controller' && scope.controller === 'self' &&
    exactKeys(scope, ['zone', 'owner', 'controller']);
}
function hasExactDefinitionConstraint(target: RuleNode, definitionId: string): boolean {
  const constraints = nodes(target.constraints);
  return constraints.length === 1 && constraints[0]?.type === 'has_card_id' && constraints[0]?.cardId === definitionId &&
    exactKeys(constraints[0]!, ['type', 'cardId']);
}

export function isAcceptedDefinitionProvisionAbility(a: AuthoringAbility): boolean {
  if (!automatic(a) || a.kind !== 'forced_trigger' || !exactSourceCondition(a, 'source_owned') || !exactCommonEmpty(a) || a.targets.length !== 0 || a.effects.length !== 1) return false;
  const effect = a.effects[0]!;
  return str(a.activation.trigger) === 'after_controller_enters_location' && !!str(a.activation.eventLocationId) &&
    Object.keys(a.activation).every((key) => ['trigger', 'eventLocationId'].includes(key)) &&
    isCreateEventPlayerDefinitionCopiesEffect(effect) &&
    (emptyObject(a.responseWindow) || (a.responseWindow.order === 'turn_order' && a.responseWindow.passBehavior === 'decline_this_window' &&
      Object.keys(a.responseWindow).every((key) => ['order', 'passBehavior'].includes(key))));
}

export function isAcceptedGlobalRevealRewardAbility(a: AuthoringAbility): boolean {
  if (!automatic(a) || a.kind !== 'phase_action' || !exactSourceCondition(a, 'source_active') || !exactCommonEmpty(a) || a.targets.length !== 0 || a.effects.length !== 1) return false;
  return a.activation.phase === 'action' && a.activation.opens === 'controller_action_window' && a.activation.requiresSourceState === 'active' &&
    Object.keys(a.activation).every((key) => ['phase', 'opens', 'requiresSourceState'].includes(key)) &&
    isGlobalOptionalDefinitionRevealRewardEffect(a.effects[0]!);
}

export function isAcceptedMatchingDefinitionExtraPlayAbility(a: AuthoringAbility): boolean {
  if (!automatic(a) || a.kind !== 'phase_action' || !exactSourceCondition(a, 'source_active') || !exactCommonEmpty(a) || a.targets.length !== 2 || a.effects.length !== 2) return false;
  if (a.activation.phase !== 'action' || a.activation.opens !== 'controller_action_window' || a.activation.requiresSourceState !== 'active' ||
      !Object.keys(a.activation).every((key) => ['phase', 'opens', 'requiresSourceState'].includes(key))) return false;
  const matching = a.targets[0]!; const hidden = a.targets[1]!;
  const matchingConstraint = nodes(matching.constraints)[0];
  const definitionId = str(matchingConstraint?.cardId);
  if (!validDefinitionId(definitionId) || !controllerHandTarget(matching, 0, 2) || !hasExactDefinitionConstraint(matching, definitionId)) return false;
  if (!controllerHandTarget(hidden, 0, 2) || nodes(hidden.constraints).length !== 0) return false;
  const first = a.effects[0]!; const second = a.effects[1]!;
  return first.type === 'play_selected_cards' && first.target === matching.id && first.face === 'face_up' &&
    exactKeys(first, ['type', 'target', 'face']) && second.type === 'play_selected_cards' && second.target === hidden.id &&
    second.face === 'face_down' && exactKeys(second, ['type', 'target', 'face']);
}

export function isAcceptedRevealAllHandsZeroMatchingAttacksAbility(a: AuthoringAbility): boolean {
  if (!automatic(a) || a.kind !== 'phase_action' || !exactSourceCondition(a, 'source_active') || !exactCommonEmpty(a) || a.targets.length !== 0 || a.effects.length !== 1) return false;
  return a.activation.phase === 'combat' && a.activation.opens === 'controller_combat_action_window' && a.activation.requiresSourceState === 'active' &&
    Object.keys(a.activation).every((key) => ['phase', 'opens', 'requiresSourceState'].includes(key)) &&
    isRevealAllHandsZeroMatchingAttacksEffect(a.effects[0]!);
}

export function isAcceptedOpponentDiscardPlayAllAbility(a: AuthoringAbility): boolean {
  if (!automatic(a) || a.kind !== 'phase_action' || !exactSourceCondition(a, 'source_active') || !exactCommonEmpty(a) || a.targets.length !== 1 || a.effects.length !== 1) return false;
  if (a.activation.phase !== 'action' || a.activation.opens !== 'controller_action_window' || a.activation.requiresSourceState !== 'active' ||
      !Object.keys(a.activation).every((key) => ['phase', 'opens', 'requiresSourceState'].includes(key))) return false;
  const target = a.targets[0]!; const constraints = nodes(target.constraints);
  return target.type === 'player' && targetCount(target, 1, 1) && constraints.length === 1 && constraints[0]?.type === 'not_controller' &&
    exactKeys(constraints[0]!, ['type']) && isOpponentDiscardFreePlayAllMatchingEffect(a.effects[0]!) && a.effects[0]!.target === target.id;
}

export function isAcceptedLinkedGeneratedCardPowerAbility(a: AuthoringAbility): boolean {
  if (!automatic(a) || a.kind !== 'forced_trigger' || !exactSourceCondition(a, 'source_active') || !exactCommonEmpty(a) || a.targets.length !== 0 || a.effects.length !== 1) return false;
  return a.activation.trigger === 'on_card_played' && a.activation.requiresSourceState === 'active' &&
    Object.keys(a.activation).every((key) => ['trigger', 'requiresSourceState'].includes(key)) && isLinkGeneratedCardPowerEffect(a.effects[0]!);
}
export function isAcceptedLinkedGeneratedCardReturnAbility(a: AuthoringAbility): boolean {
  if (!automatic(a) || a.kind !== 'forced_trigger' || !exactSourceCondition(a, 'source_active') || !exactCommonEmpty(a) || a.targets.length !== 0 || a.effects.length !== 1) return false;
  return a.activation.trigger === 'after_battle_ended' && a.activation.requiresSourceState === 'active' &&
    Object.keys(a.activation).every((key) => ['trigger', 'requiresSourceState'].includes(key)) && isReturnLinkedGeneratedCardAfterBattleEffect(a.effects[0]!);
}

export function isAcceptedMatchingDefinitionCapabilityAbility(a: AuthoringAbility): boolean {
  return isAcceptedDefinitionProvisionAbility(a) || isAcceptedGlobalRevealRewardAbility(a) ||
    isAcceptedMatchingDefinitionExtraPlayAbility(a) || isAcceptedRevealAllHandsZeroMatchingAttacksAbility(a) ||
    isAcceptedOpponentDiscardPlayAllAbility(a) || isAcceptedLinkedGeneratedCardPowerAbility(a) ||
    isAcceptedLinkedGeneratedCardReturnAbility(a);
}

export function containsMatchingDefinitionCapabilityNode(a: AuthoringAbility): boolean {
  const effects = Array.isArray(a.effects) ? a.effects : [];
  const creates = Array.isArray(a.creates) ? a.creates : [];
  const targets = Array.isArray(a.targets) ? a.targets : [];
  const custom = [...effects, ...creates].some((value) => [
    CREATE_EVENT_PLAYER_DEFINITION_COPIES_EFFECT,
    GLOBAL_OPTIONAL_DEFINITION_REVEAL_REWARD_EFFECT,
    REVEAL_ALL_HANDS_ZERO_MATCHING_ATTACKS_EFFECT,
    OPPONENT_DISCARD_FREE_PLAY_ALL_MATCHING_EFFECT,
    LINK_GENERATED_CARD_POWER_EFFECT,
    RETURN_LINKED_GENERATED_CARD_AFTER_BATTLE_EFFECT,
  ].includes(str(value.type) as never));
  const extraPlaySignature = effects.some((value) => value.type === 'play_selected_cards') &&
    targets.some((target) => nodes(target.constraints).some((constraint) => constraint.type === 'has_card_id'));
  return custom || extraPlaySignature;
}

export function matchingDefinitionCapabilityNodeIsWellFormed(value: RuleNode): boolean {
  switch (value.type) {
    case CREATE_EVENT_PLAYER_DEFINITION_COPIES_EFFECT: return isCreateEventPlayerDefinitionCopiesEffect(value);
    case GLOBAL_OPTIONAL_DEFINITION_REVEAL_REWARD_EFFECT: return isGlobalOptionalDefinitionRevealRewardEffect(value);
    case REVEAL_ALL_HANDS_ZERO_MATCHING_ATTACKS_EFFECT: return isRevealAllHandsZeroMatchingAttacksEffect(value);
    case OPPONENT_DISCARD_FREE_PLAY_ALL_MATCHING_EFFECT: return isOpponentDiscardFreePlayAllMatchingEffect(value);
    case LINK_GENERATED_CARD_POWER_EFFECT: return isLinkGeneratedCardPowerEffect(value);
    case RETURN_LINKED_GENERATED_CARD_AFTER_BATTLE_EFFECT: return isReturnLinkedGeneratedCardAfterBattleEffect(value);
    default: return true;
  }
}
