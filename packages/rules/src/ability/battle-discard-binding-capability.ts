import type { AuthoringAbility, RuleNode } from './types';

export const DUPLICATE_BASE_POWER_CLOSE_EFFECT = 'close_duplicate_base_power_non_residual_or_discard_top';
export const DISCARD_SHUFFLE_SOURCE_X_BINDING_EFFECT = 'discard_shuffle_source_x_binding';

function isRecord(value: unknown): value is RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function exactKeys(value: RuleNode, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function exactEmpty(value: unknown): boolean { return isRecord(value) && Object.keys(value).length === 0; }
function standardResponse(ability: AuthoringAbility): boolean {
  return exactKeys(ability.responseWindow, ['order', 'passBehavior']) && ability.responseWindow.order === 'turn_order' &&
    ability.responseWindow.passBehavior === 'decline_this_window';
}
function auto(ability: AuthoringAbility): boolean {
  return ability.execution?.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}

export function isDuplicateBasePowerCloseEffect(value: unknown): boolean {
  return isRecord(value) && value.type === DUPLICATE_BASE_POWER_CLOSE_EFFECT && value.scope === 'controller_battlefield' &&
    value.excludeSource === true && value.discardTop === 3 && exactKeys(value, ['type', 'scope', 'excludeSource', 'discardTop']);
}

export function isDiscardShuffleSourceXBindingEffect(value: unknown): boolean {
  return isRecord(value) && value.type === DISCARD_SHUFFLE_SOURCE_X_BINDING_EFFECT && value.base === 2 &&
    value.selectionZone === 'discard' && value.shuffleInto === 'deck' && value.upkeep === 'controller_battle' &&
    exactKeys(value, ['type', 'base', 'selectionZone', 'shuffleInto', 'upkeep']);
}

export function isAcceptedDuplicateBasePowerCloseAbility(ability: AuthoringAbility): boolean {
  const activation = ability.activation;
  return ability.kind === 'phase_action' && auto(ability) && isRecord(activation) &&
    activation.phase === 'combat' && activation.opens === 'controller_combat_action_window' && activation.requiresSourceState === 'active' &&
    exactKeys(activation, ['phase', 'opens', 'requiresSourceState']) &&
    ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 && ability.ruleModifiers.length === 0 &&
    ability.creates.length === 0 && ability.effects.length === 1 && isDuplicateBasePowerCloseEffect(ability.effects[0]) &&
    exactEmpty(ability.lifecycle) && standardResponse(ability) && exactEmpty(ability.limit) && exactEmpty(ability.visibility);
}

export function isAcceptedDiscardShuffleSourceXAbility(ability: AuthoringAbility): boolean {
  const activation = ability.activation;
  return ability.kind === 'residual' && auto(ability) && isRecord(activation) &&
    activation.trigger === 'on_card_played' && activation.opens === 'immediate' && activation.requiresSourceState === 'active' &&
    exactKeys(activation, ['trigger', 'opens', 'requiresSourceState']) &&
    ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 && ability.ruleModifiers.length === 0 &&
    ability.creates.length === 0 && ability.effects.length === 1 && isDiscardShuffleSourceXBindingEffect(ability.effects[0]) &&
    exactEmpty(ability.lifecycle) && standardResponse(ability) && exactEmpty(ability.limit) && exactEmpty(ability.visibility);
}

export function containsBattleDiscardBindingPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsBattleDiscardBindingPrivilegedNode);
  if (!isRecord(value)) return false;
  if (value.type === DUPLICATE_BASE_POWER_CLOSE_EFFECT || value.type === DISCARD_SHUFFLE_SOURCE_X_BINDING_EFFECT) return true;
  return Object.values(value).some(containsBattleDiscardBindingPrivilegedNode);
}

export function abilityHasAcceptedDiscardShuffleSourceX(abilities: readonly AuthoringAbility[]): AuthoringAbility | undefined {
  return abilities.find(isAcceptedDiscardShuffleSourceXAbility);
}
