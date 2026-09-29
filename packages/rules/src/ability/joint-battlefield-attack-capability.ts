import type { AuthoringAbility, AuthoringCard, RuleNode } from './types';

export const JOINT_OTHER_ATTACK_MODIFIER_EFFECT = 'joint_play_other_attacks_cost_power_modifier' as const;
export const SAME_BATTLEFIELD_TURN_ORDER_ATTACK_EFFECT = 'same_battlefield_turn_order_optional_attack_with_loss_vp' as const;
export const CARD_PLAY_COMMAND_SEAL_COST_EFFECT = 'card_play_command_seal_cost' as const;
export const DEFEAT_ALL_ENGAGED_OPPONENTS_EFFECT = 'defeat_all_engaged_opponents' as const;

const privilegedTypes = new Set<string>([
  JOINT_OTHER_ATTACK_MODIFIER_EFFECT,
  SAME_BATTLEFIELD_TURN_ORDER_ATTACK_EFFECT,
  CARD_PLAY_COMMAND_SEAL_COST_EFFECT,
  DEFEAT_ALL_ENGAGED_OPPONENTS_EFFECT,
]);

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function automatic(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) &&
    ability.execution.allowedOperations.length === 0;
}
function standardResponse(ability: AuthoringAbility): boolean {
  return exactKeys(ability.responseWindow, ['order', 'passBehavior']) && ability.responseWindow.order === 'turn_order' &&
    ability.responseWindow.passBehavior === 'decline_this_window';
}
function emptyShell(ability: AuthoringAbility, allowLimit = false): boolean {
  return ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 && empty(ability.lifecycle) &&
    (allowLimit || empty(ability.limit)) && empty(ability.visibility) && automatic(ability) && standardResponse(ability);
}
function perCardLimit(ability: AuthoringAbility, type: 'per_round' | 'per_game'): boolean {
  return exactKeys(ability.limit, ['type', 'uses', 'scope']) && ability.limit.type === type &&
    ability.limit.uses === 1 && ability.limit.scope === 'this_card';
}

export function isJointOtherAttackModifierEffect(value: RuleNode): boolean {
  return value.type === JOINT_OTHER_ATTACK_MODIFIER_EFFECT && value.manaCostIncrease === 2 && value.powerBonus === 1 &&
    exactKeys(value, ['type', 'manaCostIncrease', 'powerBonus']);
}
export function isSameBattlefieldTurnOrderAttackEffect(value: RuleNode): boolean {
  return value.type === SAME_BATTLEFIELD_TURN_ORDER_ATTACK_EFFECT && value.lossVp === 2 && value.rewardVp === 2 &&
    exactKeys(value, ['type', 'lossVp', 'rewardVp']);
}
export function isCardPlayCommandSealCostEffect(value: RuleNode): boolean {
  return value.type === CARD_PLAY_COMMAND_SEAL_COST_EFFECT && value.amount === 1 && exactKeys(value, ['type', 'amount']);
}
export function isDefeatAllEngagedOpponentsEffect(value: RuleNode): boolean {
  return value.type === DEFEAT_ALL_ENGAGED_OPPONENTS_EFFECT && exactKeys(value, ['type']);
}

export function isAcceptedJointOtherAttackModifierAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'passive' && exactKeys(ability.activation, ['trigger']) && ability.activation.trigger === 'while_active' &&
    ability.effects.length === 1 && isJointOtherAttackModifierEffect(ability.effects[0]!) && emptyShell(ability);
}
export function isAcceptedSameBattlefieldTurnOrderAttackAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' &&
    exactKeys(ability.activation, ['phase', 'opens', 'requiresSourceState']) && ability.activation.phase === 'action' &&
    ability.activation.opens === 'controller_action_window' && ability.activation.requiresSourceState === 'active' &&
    ability.effects.length === 1 && isSameBattlefieldTurnOrderAttackEffect(ability.effects[0]!) &&
    emptyShell(ability, true) && perCardLimit(ability, 'per_round');
}
export function isAcceptedCardPlayCommandSealCostAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'passive' && exactKeys(ability.activation, ['trigger']) && ability.activation.trigger === 'while_active' &&
    ability.effects.length === 1 && isCardPlayCommandSealCostEffect(ability.effects[0]!) &&
    emptyShell(ability, true) && perCardLimit(ability, 'per_game');
}
export function isAcceptedDefeatAllEngagedOpponentsAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' &&
    exactKeys(ability.activation, ['phase', 'opens', 'requiresSourceState']) && ability.activation.phase === 'combat' &&
    ability.activation.opens === 'controller_combat_action_window' && ability.activation.requiresSourceState === 'active' &&
    ability.effects.length === 1 && isDefeatAllEngagedOpponentsEffect(ability.effects[0]!) && emptyShell(ability);
}
export function isAcceptedJointBattlefieldAttackAbility(ability: AuthoringAbility): boolean {
  return isAcceptedJointOtherAttackModifierAbility(ability) || isAcceptedSameBattlefieldTurnOrderAttackAbility(ability) ||
    isAcceptedCardPlayCommandSealCostAbility(ability) || isAcceptedDefeatAllEngagedOpponentsAbility(ability);
}
export function containsJointBattlefieldAttackPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsJointBattlefieldAttackPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const current = value as RuleNode;
  if (privilegedTypes.has(String(current.type))) return true;
  return Object.values(current).some(containsJointBattlefieldAttackPrivilegedNode);
}

export function jointOtherAttackModifier(card: AuthoringCard | undefined): { manaCostIncrease: 2; powerBonus: 1; abilityId: string } | undefined {
  if (!card) return undefined;
  const matches = card.abilities.filter(isAcceptedJointOtherAttackModifierAbility);
  if (matches.length !== 1) return undefined;
  return { manaCostIncrease: 2, powerBonus: 1, abilityId: matches[0]!.id };
}
export function cardPlayCommandSealCost(card: AuthoringCard | undefined): { amount: 1; abilityId: string } | undefined {
  if (!card) return undefined;
  const matches = card.abilities.filter(isAcceptedCardPlayCommandSealCostAbility);
  if (matches.length !== 1) return undefined;
  return { amount: 1, abilityId: matches[0]!.id };
}
