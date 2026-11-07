import type { AuthoringAbility, RuleNode } from './types';
const n = (v: unknown): RuleNode => v && typeof v === 'object' && !Array.isArray(v) ? v as RuleNode : {};
const array = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
const only = (v: RuleNode, keys: string[]) => Object.keys(v).every(k => keys.includes(k));
export function isActualLossPowerCandidate(a: AuthoringAbility): boolean {
  return a.effects.some(e => e.type === 'create_modifier' && n(n(e.modifier).amount).expr === 'multiply' &&
    array(n(n(e.modifier).amount).args).some(arg => n(arg).expr === 'binding_field'));
}
/** Lower the bounded existing snapshot formula input to a typed primitive amount.
 * Compilation validates the symbolic sequence with zero; execution supplies the
 * authoritative, target-selected snapshot. The downstream result stays typed. */
export function lowerActualLossPower(a: AuthoringAbility, requestedAmount = 0): RuleNode[] | undefined {
  if (!isActualLossPowerCandidate(a) || a.kind !== 'phase_action' || a.execution.mode !== 'automatic' ||
      a.activation.phase !== 'combat' || a.activation.opens !== 'controller_combat_action_window' || a.activation.requiresSourceState !== 'active' ||
      !only(a.activation,['phase','opens','requiresSourceState']) || a.effects.length !== 2 || a.targets.length !== 1 ||
      (!only(a.responseWindow,['order','passBehavior']) || (a.responseWindow.order !== undefined && a.responseWindow.order !== 'turn_order') || (a.responseWindow.passBehavior !== undefined && a.responseWindow.passBehavior !== 'decline_this_window')) ||
      a.conditions.length || a.cost.length || a.creates.length || a.ruleModifiers.length || Object.keys(a.lifecycle).length || Object.keys(a.limit).length ||
      Object.keys(a.visibility).length || (a.bindings?.length ?? 0) !== 1 || requestedAmount > 0 || !Number.isSafeInteger(requestedAmount)) return undefined;
  const target = a.targets[0]!, loss = a.effects[0]!, gain = a.effects[1]!, modifier = n(gain.modifier);
  const snapshot = a.bindings![0]!;
  const formula = n(loss.amount), ceil = n(array(formula.args)[0]), divide = n(array(ceil.args)[0]);
  const variable = n(array(divide.args)[0]), divisor = array(divide.args)[1];
  const value = n(modifier.amount), binding = n(array(value.args)[0]);
  if (target.type !== 'player' || target.selector !== 'opponents_at_same_battlefield' || target.count !== 1 ||
      !only(target,['id','type','selector','count','constraints']) || JSON.stringify(target.constraints) !== JSON.stringify([{type:'not_controller'}]) ||
      loss.type !== 'adjust_mana' || loss.targetRef !== target.id || typeof loss.bind !== 'string' || !loss.bind ||
      typeof loss.id !== 'string' || !loss.id || !only(loss,['type','id','targetRef','bind','amount']) ||
      formula.op !== 'multiply' || array(formula.args).length !== 2 || array(formula.args)[1] !== -1 || !only(formula,['op','args']) ||
      ceil.op !== 'ceil' || array(ceil.args).length !== 1 || !only(ceil,['op','args']) ||
      divide.op !== 'divide' || array(divide.args).length !== 2 || !Number.isSafeInteger(divisor) || Number(divisor) <= 0 || !only(divide,['op','args']) ||
      variable.op !== 'var' || variable.var !== snapshot.id || snapshot.read !== 'target.mana' || !only(variable,['op','var']) ||
      gain.type !== 'create_modifier' || typeof gain.id !== 'string' || !gain.id || gain.id === loss.id || !only(gain,['type','id','modifier']) ||
      modifier.type !== 'power_bonus' || modifier.operation !== 'add' || modifier.duration !== 'this_round' ||
      JSON.stringify(modifier.scope) !== JSON.stringify({subject:'source_card'}) || !only(modifier,['type','operation','duration','amount','scope']) ||
      value.expr !== 'multiply' || array(value.args).length !== 2 || !Number.isSafeInteger(array(value.args)[1]) || Number(array(value.args)[1]) >= 0 || !only(value,['expr','args']) ||
      binding.expr !== 'binding_field' || binding.binding !== loss.bind || binding.field !== 'actualAmount' || binding.valueType !== 'number' ||
      !only(binding,['expr','binding','field','valueType'])) return undefined;
  return [{...loss,amount:requestedAmount},gain];
}
