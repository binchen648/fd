import { hostOperations, type AuthoringAbility, type RuleNode } from './types';

function isRuleNode(value: unknown): value is RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function node(value: unknown): RuleNode {
  return isRuleNode(value) ? value : {};
}
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function str(value: unknown): string { return typeof value === 'string' ? value : ''; }
function exactKeys(value: RuleNode, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export function isPreBattleDefeatCandidate(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode;
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (!value || typeof value !== 'object') return false;
    const current = node(value);
    if (current.type === 'defeat_player' || current.type === 'no_attack_played_this_round_with_attribute') return true;
    return Object.values(current).some(visit);
  };
  return visit(raw);
}

/** FB2-45 exact identity-free action-phase pre-battle defeat semantic shape. */
export function isAcceptedPreBattleDefeatAbility(
  ability: AuthoringAbility | RuleNode,
  form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw = ability as RuleNode;
  if (raw.kind !== 'phase_action') return false;
  const activation = node(raw.activation);
  if (!exactKeys(activation, ['phase', 'opens']) || activation.phase !== 'action' || activation.opens !== 'controller_action_window') return false;

  const conditions = nodes(raw.conditions);
  if (conditions.length !== 1 || conditions[0]!.type !== 'source_active' || !exactKeys(conditions[0]!, ['type'])) return false;
  for (const key of ['targets', 'cost', 'creates', 'ruleModifiers']) {
    const value = raw[key];
    if (value !== undefined && (!Array.isArray(value) || value.length !== 0)) return false;
  }

  const effects = nodes(raw.effects);
  if (effects.length !== 1) return false;
  const effect = effects[0]!;
  if (effect.type !== 'defeat_player' || !exactKeys(effect, ['type', 'target'])) return false;
  const target = node(effect.target);
  if (target.scope !== 'engaged_opponents' || !exactKeys(target, ['scope', 'where'])) return false;
  const where = nodes(target.where);
  if (where.length !== 1) return false;
  const predicate = where[0]!;
  const attribute = str(predicate.attribute).trim();
  if (predicate.type !== 'no_attack_played_this_round_with_attribute' || !attribute || !exactKeys(predicate, ['type', 'attribute'])) return false;

  for (const key of ['lifecycle', 'limit']) {
    const value = raw[key];
    if (value !== undefined && (!isRuleNode(value) || Object.keys(value).length !== 0)) return false;
  }
  const rawVisibility = raw.visibility;
  if (rawVisibility !== undefined && !isRuleNode(rawVisibility)) return false;
  const visibility = node(rawVisibility);
  const emptyVisibility = Object.keys(visibility).length === 0;
  const exactTrueNameReveal = exactKeys(visibility, ['revealsTrueName', 'revealTiming', 'revealScope']) &&
    visibility.revealsTrueName === true && visibility.revealTiming === 'on_use_declared' && visibility.revealScope === 'servant_package';
  if (!emptyVisibility && !exactTrueNameReveal) return false;

  const rawResponse = raw.responseWindow;
  if (form === 'authoring') {
    if (rawResponse !== undefined && (!isRuleNode(rawResponse) || Object.keys(rawResponse).length !== 0)) return false;
  } else {
    if (!isRuleNode(rawResponse)) return false;
    if (!(rawResponse.order === 'turn_order' && rawResponse.passBehavior === 'decline_this_window' &&
        exactKeys(rawResponse, ['order', 'passBehavior']))) return false;
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

export function preBattleDefeatAttribute(ability: AuthoringAbility | RuleNode): string | undefined {
  if (!isAcceptedPreBattleDefeatAbility(ability, 'compiled')) return undefined;
  const effect = nodes((ability as RuleNode).effects)[0]!;
  return str(nodes(node(effect.target).where)[0]!.attribute).trim() || undefined;
}