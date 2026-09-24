import { hostOperations, type AuthoringAbility, type RuleNode } from './types';

export const OPPONENT_CLOSE_NON_RESIDUAL_TO_ONE_EFFECT = 'opponent_close_non_residual_to_one';
export const OPPONENT_CLOSE_ONE_NON_RESIDUAL_EFFECT = 'opponent_close_one_non_residual';

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

/** Reserve the FB2-49 compound token and the two historical generic spellings so near misses fail closed. */
export function isOpponentCloseToOneCandidate(ability: AuthoringAbility | RuleNode): boolean {
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (!value || typeof value !== 'object') return false;
    const current = node(value);
    if (current.type === OPPONENT_CLOSE_NON_RESIDUAL_TO_ONE_EFFECT || current.type === OPPONENT_CLOSE_ONE_NON_RESIDUAL_EFFECT ||
        current.type === 'choose_each_player_cards' || current.type === 'choose-each-player-cards' ||
        current.type === 'close_matching_cards_except_selected' || current.type === 'close-matching-cards-except-selected') return true;
    return Object.values(current).some(visit);
  };
  return visit(ability as RuleNode);
}

/** Exact FB2-49 combat phase-action envelope. No generic each-player/card-close authoring is admitted. */
export function isAcceptedOpponentCloseToOneAbility(
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
  if (!exactKeys(activation, ['phase', 'opens']) || activation.phase !== 'combat' ||
      activation.opens !== 'controller_combat_action_window') return false;

  const conditions = nodes(raw.conditions);
  if (conditions.length !== 2 || conditions[0]!.type !== 'source_owned' || conditions[1]!.type !== 'at_battlefield' ||
      !exactKeys(conditions[0]!, ['type']) || !exactKeys(conditions[1]!, ['type'])) return false;

  for (const key of ['targets', 'cost', 'creates', 'ruleModifiers']) if (!exactEmptyArray(raw, key)) return false;
  const effects = nodes(raw.effects);
  if (effects.length !== 1 || effects[0]!.type !== OPPONENT_CLOSE_NON_RESIDUAL_TO_ONE_EFFECT ||
      !exactKeys(effects[0]!, ['type'])) return false;

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

/** Exact M50 single-opponent close-one phase-action envelope. */
export function isAcceptedOpponentCloseOneNonResidualAbility(
  ability: AuthoringAbility | RuleNode,
  form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw = ability as RuleNode;
  const allowedRootKeys = [
    'id', 'kind', 'printedClause', 'markers', 'activation', 'conditions', 'targets', 'effects', 'cost', 'creates',
    'ruleModifiers', 'lifecycle', 'responseWindow', 'limit', 'visibility', 'execution',
  ];
  if (Object.keys(raw).length !== allowedRootKeys.length || !exactKeys(raw, allowedRootKeys) || raw.kind !== 'phase_action') return false;
  if (!Array.isArray(raw.markers) || raw.markers.length !== 1 || raw.markers[0] !== 'm50_structured_v1') return false;

  const activation = node(raw.activation);
  if (Object.keys(activation).length !== 3 || !exactKeys(activation, ['phase', 'opens', 'requiresSourceState']) ||
      activation.phase !== 'combat' || activation.opens !== 'controller_combat_action_window' || activation.requiresSourceState !== 'active') return false;

  const conditions = nodes(raw.conditions);
  if (conditions.length !== 2) return false;
  const phase = conditions[0]!; const opponentCount = conditions[1]!;
  if (Object.keys(phase).length !== 2 || !exactKeys(phase, ['type', 'phase']) || phase.type !== 'phase_is' || phase.phase !== 'combat') return false;
  if (Object.keys(opponentCount).length !== 3 || !exactKeys(opponentCount, ['type', 'scope', 'count']) ||
      opponentCount.type !== 'target_count_equals' || opponentCount.scope !== 'same_battlefield_opponents' || opponentCount.count !== 1) return false;

  for (const key of ['targets', 'cost', 'creates', 'ruleModifiers']) if (!exactEmptyArray(raw, key)) return false;
  const effects = nodes(raw.effects);
  if (effects.length !== 1 || Object.keys(effects[0]!).length !== 1 || effects[0]!.type !== OPPONENT_CLOSE_ONE_NON_RESIDUAL_EFFECT) return false;
  for (const key of ['lifecycle', 'limit', 'visibility']) if (!exactEmptyObject(raw, key)) return false;

  if (form === 'authoring') {
    if (!exactEmptyObject(raw, 'responseWindow')) return false;
  } else {
    const response = node(raw.responseWindow);
    if (Object.keys(response).length !== 2 || !exactKeys(response, ['order', 'passBehavior']) ||
        response.order !== 'turn_order' || response.passBehavior !== 'decline_this_window') return false;
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
