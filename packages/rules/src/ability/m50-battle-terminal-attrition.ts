import type { AuthoringAbility, RuleNode } from './types';

export const M50_BATTLE_TERMINAL_ACTIVE_ATTACK_VP_ATTRITION = 'battle_terminal_active_attack_vp_attrition';

function record(value: unknown): RuleNode {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function nodes(value: unknown): RuleNode[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is RuleNode => !!entry && typeof entry === 'object' && !Array.isArray(entry))
    : [];
}
function exactKeys(value: RuleNode, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function emptyRecord(value: unknown): boolean {
  return value === undefined || (value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);
}
function emptyArray(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.length === 0);
}
function defaultResponse(value: unknown): boolean {
  const response = record(value);
  return Object.keys(response).length === 0 ||
    (exactKeys(response, ['order', 'passBehavior']) && response.order === 'turn_order' && response.passBehavior === 'decline_this_window');
}
function automatic(value: unknown): boolean {
  const execution = record(value);
  if (execution.mode !== 'automatic') return false;
  return Object.keys(execution).every((key) => ['mode', 'allowedOperations', 'hostOps'].includes(key)) &&
    (execution.allowedOperations === undefined || Array.isArray(execution.allowedOperations)) &&
    (execution.hostOps === undefined || Array.isArray(execution.hostOps));
}

/**
 * Identity-free exact envelope for battle-terminal attrition based on each frozen
 * same-battlefield opponent's still-active face-up attack count.
 */
export function isAcceptedM50BattleTerminalActiveAttackVpAttritionAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode;
  if (raw.kind !== 'forced_trigger' || !Array.isArray(raw.markers) || !raw.markers.includes('m50_structured_v1') ||
      !automatic(raw.execution) || !emptyArray(raw.targets) || !emptyArray(raw.cost) || !emptyArray(raw.creates) ||
      !emptyArray(raw.ruleModifiers) || !emptyRecord(raw.lifecycle) || !defaultResponse(raw.responseWindow) ||
      !emptyRecord(raw.limit) || !emptyRecord(raw.visibility) || raw.copies !== undefined || raw.transforms !== undefined) return false;
  const activation = record(raw.activation);
  if (!exactKeys(activation, ['trigger']) || activation.trigger !== 'after_battle_ended') return false;
  const conditions = nodes(raw.conditions);
  if (conditions.length !== 1 || !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_owned_live') return false;
  const effects = nodes(raw.effects);
  if (effects.length !== 1) return false;
  const effect = effects[0]!;
  return exactKeys(effect, ['type', 'offset', 'maxAmount']) &&
    effect.type === M50_BATTLE_TERMINAL_ACTIVE_ATTACK_VP_ATTRITION &&
    effect.offset === -1 && effect.maxAmount === 3;
}
