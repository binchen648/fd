import { hostOperations, type AuthoringAbility, type RuleNode } from './types';

export const SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_EFFECT = 'create_selected_played_attack_temporary_copy';
export const SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_POLICY = 'selected_played_attack_temporary_copy_v1';

function isRuleNode(value: unknown): value is RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function node(value: unknown): RuleNode { return isRuleNode(value) ? value : {}; }
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function exactKeys(value: RuleNode, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
function exactEmptyArray(raw: RuleNode, key: string): boolean {
  const value = raw[key];
  return value === undefined || (Array.isArray(value) && value.length === 0);
}
function exactEmptyObject(raw: RuleNode, key: string): boolean {
  const value = raw[key];
  return value === undefined || (isRuleNode(value) && Object.keys(value).length === 0);
}
function exactTrueNameVisibility(value: unknown): boolean {
  const visibility = node(value);
  if (Object.keys(visibility).length === 0) return true;
  return visibility.revealsTrueName === true && visibility.revealTiming === 'on_use_declared' &&
    visibility.revealScope === 'servant_package' &&
    exactKeys(visibility, ['revealsTrueName', 'revealTiming', 'revealScope']);
}
function exactDeploymentBonusCondition(value: RuleNode): boolean {
  const left = node(value.left);
  return value.type === 'gt' && value.right === 0 && exactKeys(value, ['type', 'left', 'right']) &&
    left.var === 'controller.deployment_bonus' && exactKeys(left, ['var']);
}
function exactTarget(value: RuleNode): boolean {
  const scope = node(value.scope);
  const count = node(value.count);
  const constraints = nodes(value.constraints);
  return value.id === 'selected_attack' && value.type === 'card_instance' &&
    exactKeys(value, ['id', 'type', 'scope', 'constraints', 'count']) &&
    scope.zone === 'attack_area' && scope.owner === 'controller' && scope.controller === 'self' &&
    exactKeys(scope, ['zone', 'owner', 'controller']) &&
    count.min === 1 && count.max === 1 && exactKeys(count, ['min', 'max']) &&
    constraints.length === 3 &&
    constraints[0]!.type === 'is_attack' && exactKeys(constraints[0]!, ['type']) &&
    constraints[1]!.type === 'played_this_round' && exactKeys(constraints[1]!, ['type']) &&
    constraints[2]!.type === 'not_source_card' && exactKeys(constraints[2]!, ['type']);
}

/** Reserve FB2-50's exact compound token so malformed near-misses fail closed. */
export function isSelectedPlayedAttackTemporaryCopyCandidate(ability: AuthoringAbility | RuleNode): boolean {
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (!value || typeof value !== 'object') return false;
    const current = node(value);
    if (current.type === SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_EFFECT) return true;
    return Object.values(current).some(visit);
  };
  return visit(ability as RuleNode);
}

/** Exact identity-free FB2-50 envelope. It does not expose generic cloning. */
export function isAcceptedSelectedPlayedAttackTemporaryCopyAbility(
  ability: AuthoringAbility | RuleNode,
  form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw = ability as RuleNode;
  if (!exactKeys(raw, [
    'id', 'kind', 'printedClause', 'markers', 'activation', 'conditions', 'targets', 'effects', 'cost', 'creates',
    'ruleModifiers', 'lifecycle', 'responseWindow', 'limit', 'visibility', 'execution',
  ]) || raw.kind !== 'phase_action') return false;
  if (!exactEmptyArray(raw, 'markers')) return false;

  const activation = node(raw.activation);
  if (activation.phase !== 'action' || activation.opens !== 'controller_action_window' ||
      !exactKeys(activation, ['phase', 'opens'])) return false;

  const conditions = nodes(raw.conditions);
  if (conditions.length !== 2 || conditions[0]!.type !== 'source_active' ||
      !exactKeys(conditions[0]!, ['type']) || !exactDeploymentBonusCondition(conditions[1]!)) return false;

  const targets = nodes(raw.targets);
  if (targets.length !== 1 || !exactTarget(targets[0]!)) return false;
  for (const key of ['cost', 'creates', 'ruleModifiers']) if (!exactEmptyArray(raw, key)) return false;

  const effects = nodes(raw.effects);
  if (effects.length !== 1 || effects[0]!.type !== SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_EFFECT ||
      effects[0]!.target !== 'selected_attack' || !exactKeys(effects[0]!, ['type', 'target'])) return false;

  for (const key of ['lifecycle', 'limit']) if (!exactEmptyObject(raw, key)) return false;
  if (!exactTrueNameVisibility(raw.visibility)) return false;

  if (form === 'authoring') {
    if (!exactEmptyObject(raw, 'responseWindow')) return false;
  } else {
    const response = node(raw.responseWindow);
    if (!exactKeys(response, ['order', 'passBehavior']) || response.order !== 'turn_order' ||
        response.passBehavior !== 'decline_this_window') return false;
  }

  const execution = node(raw.execution);
  if (execution.mode !== 'automatic' || !exactKeys(execution, ['mode', 'hostOps', 'allowedOperations'])) return false;
  for (const key of ['hostOps', 'allowedOperations']) {
    if (!Object.prototype.hasOwnProperty.call(execution, key)) continue;
    const value = execution[key];
    if (!Array.isArray(value)) return false;
    if (form === 'authoring' && value.length !== 0) return false;
    if (form === 'compiled') {
      const exactEmpty = value.length === 0;
      const exactDefault = value.length === hostOperations.length && hostOperations.every((operation, index) => value[index] === operation);
      if (!exactEmpty && !exactDefault) return false;
    }
  }
  return true;
}