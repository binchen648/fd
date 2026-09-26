import type { AuthoringAbility, RuleNode } from './types';

const exactKeys = (value: RuleNode, allowed: readonly string[]) => {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
};

export function isActivePlayerCountMinusRoundPlayCostModifier(value: RuleNode): boolean {
  return value.type === 'play_cost_formula' && value.operation === 'set' && value.rule === 'card.playCost' &&
    value.formula === 'active_player_count_minus_round' && value.min === 0 &&
    exactKeys(value, ['type', 'operation', 'rule', 'formula', 'min']);
}

export function activePlayerCountMinusRoundPlayCostAbility(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' &&
    ability.ruleModifiers.length === 1 && isActivePlayerCountMinusRoundPlayCostModifier(ability.ruleModifiers[0]!) &&
    ability.effects.length === 0 && ability.creates.length === 0;
}
