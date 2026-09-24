import type { AuthoringAbility, RuleNode } from './types';

function node(value: unknown): RuleNode { return value && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {}; }
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function exactKeys(value: RuleNode, allowed: string[]): boolean { return Object.keys(value).every((key) => allowed.includes(key)); }
function exactEmpty(value: unknown): boolean { return value === undefined || (Array.isArray(value) ? value.length === 0 : !!value && typeof value === 'object' && Object.keys(value as object).length === 0); }
function exactPreLossCondition(value: unknown, type: 'target_command_seals_at_most' | 'target_command_seals_equals', expected: number, targetId: string): boolean {
  const condition = node(value);
  return condition.type === type && condition.value === expected && condition.target === targetId &&
    exactKeys(condition, ['type', 'target', 'value']);
}

/**
 * Exact identity-free envelope for: choose one same-battlefield player, lose one seal,
 * if pre-loss seals <=1 defeat that selected player, and if pre-loss seals ==0 grant
 * controller +10 total combat power for the round. The ability is once per game.
 */
export function isAcceptedCommandSealLossConditionalDefeatAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode;
  if (raw.kind !== 'phase_action' || !exactKeys(raw, [
    'id','kind','printedClause','markers','activation','conditions','targets','effects','cost','creates','ruleModifiers',
    'lifecycle','responseWindow','limit','visibility','execution',
  ])) return false;
  const activation = node(raw.activation);
  if (activation.phase !== 'action' || activation.opens !== 'controller_action_window' || activation.requiresSourceState !== 'active' ||
      !exactKeys(activation, ['phase','opens','requiresSourceState'])) return false;
  const conditions = nodes(raw.conditions);
  if (conditions.length !== 1 || conditions[0]!.type !== 'at_battlefield' || !exactKeys(conditions[0]!, ['type'])) return false;
  const targets = nodes(raw.targets);
  if (targets.length !== 1) return false;
  const target = targets[0]!; const targetId = typeof target.id === 'string' ? target.id : '';
  const constraints = nodes(target.constraints);
  if (!targetId || target.type !== 'player' || !exactKeys(target, ['id','type','constraints']) || constraints.length !== 1 ||
      constraints[0]!.type !== 'same_battlefield_as_controller' || !exactKeys(constraints[0]!, ['type'])) return false;
  if (!exactEmpty(raw.cost) || !exactEmpty(raw.creates) || !exactEmpty(raw.ruleModifiers) || !exactEmpty(raw.lifecycle) || !exactEmpty(raw.visibility)) return false;
  const limit = node(raw.limit);
  if (limit.type !== 'per_game' || limit.uses !== 1 || limit.scope !== 'this_card' || !exactKeys(limit, ['type','uses','scope'])) return false;
  const response = node(raw.responseWindow);
  if (Object.keys(response).length !== 0 && !(response.order === 'turn_order' && response.passBehavior === 'decline_this_window' && exactKeys(response, ['order','passBehavior']))) return false;
  const execution = node(raw.execution);
  if (execution.mode !== 'automatic' || !exactKeys(execution, ['mode','hostOps','allowedOperations'])) return false;
  for (const key of ['hostOps','allowedOperations']) {
    if (!Object.prototype.hasOwnProperty.call(execution, key)) continue;
    if (!Array.isArray(execution[key]) || (execution[key] as unknown[]).length !== 0) return false;
  }
  const effects = nodes(raw.effects);
  if (effects.length !== 1) return false;
  const loss = effects[0]!; const afterLoss = nodes(loss.then);
  if (loss.type !== 'lose_command_seals' || loss.amount !== 1 || loss.target !== targetId ||
      !exactKeys(loss, ['type','target','amount','then']) || afterLoss.length !== 2) return false;
  const defeatBranch = afterLoss[0]!; const defeatConditions = nodes(defeatBranch.conditions); const defeatEffects = nodes(defeatBranch.then);
  if (defeatBranch.type !== 'if_condition' || !exactKeys(defeatBranch, ['type','conditions','then']) ||
      defeatConditions.length !== 1 || !exactPreLossCondition(defeatConditions[0], 'target_command_seals_at_most', 1, targetId) ||
      defeatEffects.length !== 1 || defeatEffects[0]!.type !== 'defeat_player' || defeatEffects[0]!.target !== targetId ||
      !exactKeys(defeatEffects[0]!, ['type','target'])) return false;
  const powerBranch = afterLoss[1]!; const powerConditions = nodes(powerBranch.conditions); const powerEffects = nodes(powerBranch.then);
  if (powerBranch.type !== 'if_condition' || !exactKeys(powerBranch, ['type','conditions','then']) ||
      powerConditions.length !== 1 || !exactPreLossCondition(powerConditions[0], 'target_command_seals_equals', 0, targetId) ||
      powerEffects.length !== 1 || powerEffects[0]!.type !== 'combat_power_bonus' || powerEffects[0]!.amount !== 10 ||
      !exactKeys(powerEffects[0]!, ['type','amount'])) return false;
  return true;
}