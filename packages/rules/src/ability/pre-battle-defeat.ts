import { hostOperations, type AuthoringAbility, type RuleNode } from './types';

function node(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
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
  if (nodes(raw.targets).length !== 0 || nodes(raw.cost).length !== 0 || nodes(raw.creates).length !== 0 || nodes(raw.ruleModifiers).length !== 0) return false;

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

  if (Object.keys(node(raw.lifecycle)).length !== 0 || Object.keys(node(raw.limit)).length !== 0) return false;
  const visibility = node(raw.visibility);
  const emptyVisibility = Object.keys(visibility).length === 0;
  const exactTrueNameReveal = exactKeys(visibility, ['revealsTrueName', 'revealTiming', 'revealScope']) &&
    visibility.revealsTrueName === true && visibility.revealTiming === 'on_use_declared' && visibility.revealScope === 'servant_package';
  if (!emptyVisibility && !exactTrueNameReveal) return false;

  const response = node(raw.responseWindow);
  if (form === 'authoring') {
    if (Object.keys(response).length !== 0) return false;
  } else if (!(response.order === 'turn_order' && response.passBehavior === 'decline_this_window' &&
      exactKeys(response, ['order', 'passBehavior']))) return false;

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