import type { AuthoringAbility, AuthoringCard, RuleNode } from './types';

function isEmptyRecord(value: unknown): boolean {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0;
}

/**
 * Exact structural marker for a card whose own rule requires it to be played only
 * as an additional card in a regular play batch. Identity/text/handler data are
 * deliberately excluded from this classifier.
 */
export function isRequiredAdditionalPlayMarker(ability: AuthoringAbility): boolean {
  const activation = ability.activation as unknown as Record<string, unknown>;
  const response = ability.responseWindow as unknown as Record<string, unknown>;
  const effect = ability.effects[0] as RuleNode | undefined;
  return ability.kind === 'passive' &&
    activation.trigger === 'while_active' &&
    Object.keys(activation).every((key) => key === 'trigger') &&
    ability.conditions.length === 0 &&
    ability.targets.length === 0 &&
    ability.cost.length === 0 &&
    ability.creates.length === 0 &&
    ability.ruleModifiers.length === 0 &&
    isEmptyRecord(ability.lifecycle) &&
    isEmptyRecord(ability.limit) &&
    isEmptyRecord(ability.visibility) &&
    Object.keys(response).length === 2 &&
    Object.keys(response).every((key) => key === 'order' || key === 'passBehavior') &&
    response.order === 'turn_order' &&
    response.passBehavior === 'decline_this_window' &&
    ability.execution.mode === 'automatic' &&
    ability.effects.length === 1 &&
    !!effect &&
    effect.type === 'append_only_rule' &&
    Object.keys(effect).length === 1;
}

export function hasRequiredAdditionalPlayMarker(card: AuthoringCard | undefined): boolean {
  return !!card && card.abilities.some(isRequiredAdditionalPlayMarker);
}
