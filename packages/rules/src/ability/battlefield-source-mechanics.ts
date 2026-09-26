import type { AuthoringAbility, RuleNode } from './types';

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function node(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function isEmptyRecord(value: unknown): boolean {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0;
}
function defaultResponseWindow(value: unknown): boolean {
  const r = node(value);
  return exactKeys(r, ['order', 'passBehavior']) && r.order === 'turn_order' && r.passBehavior === 'decline_this_window';
}
function automaticNoOps(value: AuthoringAbility): boolean {
  return value.execution.mode === 'automatic' && Array.isArray(value.execution.allowedOperations) && value.execution.allowedOperations.length === 0;
}

export const BATTLEFIELD_SOURCE_CARD_COST_AURA_TYPE = 'battlefield_source_card_play_cost_aura' as const;
export const PLACE_SOURCE_AT_BATTLEFIELD_EFFECT = 'place_source_card_at_battlefield' as const;
export const GRANT_BASIC_ATTACK_PER_GAME_LIMIT_EFFECT = 'grant_per_game_play_limit_to_active_basic_attacks_at_source_battlefield' as const;
export const GRANT_SOURCE_BATTLEFIELD_VP_EFFECT = 'grant_vp_to_players_at_source_battlefield' as const;
export const RETURN_SOURCE_TO_SKILL_EFFECT = 'return_source_card_to_skill' as const;
export const REMOVE_STARTING_DECK_FRACTION_EFFECT = 'remove_top_starting_deck_fraction_and_defeat_if_empty' as const;
export const ANY_BATTLEFIELD_CONSTRAINT = 'any_battlefield' as const;

export function isAnyBattlefieldConstraint(value: RuleNode): boolean {
  return value.type === ANY_BATTLEFIELD_CONSTRAINT && exactKeys(value, ['type']);
}

export function isPlaceSourceAtBattlefieldEffect(value: RuleNode): boolean {
  return value.type === PLACE_SOURCE_AT_BATTLEFIELD_EFFECT && typeof value.target === 'string' && value.target.length > 0 &&
    exactKeys(value, ['type', 'target']);
}

export function isGrantBasicAttackPerGameLimitEffect(value: RuleNode): boolean {
  return value.type === GRANT_BASIC_ATTACK_PER_GAME_LIMIT_EFFECT && exactKeys(value, ['type']);
}

export function isGrantSourceBattlefieldVpEffect(value: RuleNode): boolean {
  return value.type === GRANT_SOURCE_BATTLEFIELD_VP_EFFECT && value.amount === 1 && exactKeys(value, ['type', 'amount']);
}

export function isReturnSourceToSkillEffect(value: RuleNode): boolean {
  return value.type === RETURN_SOURCE_TO_SKILL_EFFECT && exactKeys(value, ['type']);
}

export function isRemoveStartingDeckFractionEffect(value: RuleNode): boolean {
  return value.type === REMOVE_STARTING_DECK_FRACTION_EFFECT && typeof value.target === 'string' && value.target.length > 0 &&
    value.numerator === 1 && value.denominator === 4 && value.rounding === 'ceil' &&
    value.destination === 'removed_from_game' && value.defeatIfEmpty === true &&
    exactKeys(value, ['type', 'target', 'numerator', 'denominator', 'rounding', 'destination', 'defeatIfEmpty']);
}

export function isBattlefieldSourceCardPlayCostAuraModifier(value: RuleNode): boolean {
  const scope = node(value.scope);
  return value.type === BATTLEFIELD_SOURCE_CARD_COST_AURA_TYPE && value.operation === 'add' && value.rule === 'card.playCost' && value.value === 2 &&
    scope.subject === 'other_players_at_source_battlefield' && scope.object === 'playable_card' &&
    Array.isArray(scope.zones) && scope.zones.length === 2 && scope.zones[0] === 'hand' && scope.zones[1] === 'skill' &&
    exactKeys(scope, ['subject', 'object', 'zones']) && exactKeys(value, ['type', 'operation', 'rule', 'scope', 'value']);
}

export function isBattlefieldSourceCardPlayCostAuraAbility(value: AuthoringAbility): boolean {
  return value.kind === 'passive' && isEmptyRecord(value.activation) && value.conditions.length === 0 &&
    value.targets.length === 0 && value.effects.length === 0 && value.cost.length === 0 && value.creates.length === 0 &&
    value.ruleModifiers.length === 1 && isBattlefieldSourceCardPlayCostAuraModifier(value.ruleModifiers[0]!) &&
    isEmptyRecord(value.lifecycle) && isEmptyRecord(value.limit) && isEmptyRecord(value.visibility) &&
    defaultResponseWindow(value.responseWindow) && automaticNoOps(value);
}

export function isBattlefieldSourceBattleEndRewardAbility(value: AuthoringAbility): boolean {
  return value.kind === 'forced_trigger' && value.activation.trigger === 'after_battle_ended' && value.activation.requiresSourceState === 'active' &&
    Object.keys(value.activation).every((key) => ['trigger', 'requiresSourceState'].includes(key)) &&
    value.conditions.length === 0 && value.targets.length === 0 && value.cost.length === 0 && value.ruleModifiers.length === 0 && value.creates.length === 0 &&
    value.effects.length === 1 && isGrantSourceBattlefieldVpEffect(value.effects[0]!) &&
    isEmptyRecord(value.lifecycle) && isEmptyRecord(value.limit) && isEmptyRecord(value.visibility) &&
    defaultResponseWindow(value.responseWindow) && automaticNoOps(value);
}

export function isBattlefieldSourceRoundCleanupAbility(value: AuthoringAbility): boolean {
  return value.kind === 'forced_trigger' && value.activation.trigger === 'round_end' && value.activation.requiresSourceState === 'active' &&
    Object.keys(value.activation).every((key) => ['trigger', 'requiresSourceState'].includes(key)) &&
    value.conditions.length === 0 && value.targets.length === 0 && value.cost.length === 0 && value.ruleModifiers.length === 0 && value.creates.length === 0 &&
    value.effects.length === 1 && isReturnSourceToSkillEffect(value.effects[0]!) &&
    isEmptyRecord(value.lifecycle) && isEmptyRecord(value.limit) && isEmptyRecord(value.visibility) &&
    defaultResponseWindow(value.responseWindow) && automaticNoOps(value);
}

export function isBattlefieldSourceGrantBasicLimitAbility(value: AuthoringAbility): boolean {
  return value.kind === 'forced_trigger' && value.activation.trigger === 'controller_combat_action_window' && value.activation.requiresSourceState === 'active' &&
    Object.keys(value.activation).every((key) => ['trigger', 'requiresSourceState'].includes(key)) &&
    value.conditions.length === 0 && value.targets.length === 0 && value.cost.length === 0 && value.ruleModifiers.length === 0 && value.creates.length === 0 &&
    value.effects.length === 1 && isGrantBasicAttackPerGameLimitEffect(value.effects[0]!) &&
    isEmptyRecord(value.lifecycle) && isEmptyRecord(value.limit) && isEmptyRecord(value.visibility) &&
    defaultResponseWindow(value.responseWindow) && automaticNoOps(value);
}

export function battlefieldSourceMechanicIsWellFormed(value: RuleNode): boolean {
  switch (value.type) {
    case ANY_BATTLEFIELD_CONSTRAINT: return isAnyBattlefieldConstraint(value);
    case PLACE_SOURCE_AT_BATTLEFIELD_EFFECT: return isPlaceSourceAtBattlefieldEffect(value);
    case GRANT_BASIC_ATTACK_PER_GAME_LIMIT_EFFECT: return isGrantBasicAttackPerGameLimitEffect(value);
    case GRANT_SOURCE_BATTLEFIELD_VP_EFFECT: return isGrantSourceBattlefieldVpEffect(value);
    case RETURN_SOURCE_TO_SKILL_EFFECT: return isReturnSourceToSkillEffect(value);
    case REMOVE_STARTING_DECK_FRACTION_EFFECT: return isRemoveStartingDeckFractionEffect(value);
    case BATTLEFIELD_SOURCE_CARD_COST_AURA_TYPE: return isBattlefieldSourceCardPlayCostAuraModifier(value);
    default: return true;
  }
}
