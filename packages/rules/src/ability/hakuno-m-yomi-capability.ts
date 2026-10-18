import type { AuthoringAbility, RuleNode } from './types';

/** Canonical effect names for the four frozen Hakuno-M cards. */
export const HAKUNO_M_YOMI_EFFECT = 'hakuno_m_yomi';
export const HAKUNO_M_CHALLENGE_RESULT_EFFECT = 'hakuno_m_challenge_result';
export const HAKUNO_M_ANALYSIS_EFFECT = 'hakuno_m_analysis';
export const HAKUNO_M_DEAD_FACE_EFFECT = 'hakuno_m_dead_face_transfer';
export const HAKUNO_M_ANALYSIS_DEFINITION = 'master.hakuno-m.skill.s3';

const EFFECTS = new Set([
  HAKUNO_M_YOMI_EFFECT,
  HAKUNO_M_CHALLENGE_RESULT_EFFECT,
  HAKUNO_M_ANALYSIS_EFFECT,
  HAKUNO_M_DEAD_FACE_EFFECT,
]);

function node(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function exact(value: RuleNode, keys: string[]): boolean {
  return Object.keys(value).sort().join('|') === [...keys].sort().join('|');
}
function exactCount(value: unknown): boolean {
  const count = node(value);
  return exact(count, ['min', 'max']) && count.min === 1 && count.max === 1;
}
function emptyEnvelope(a: AuthoringAbility, kind: string): boolean {
  return a.kind === kind && nodes(a.conditions).length === 0 && nodes(a.ruleModifiers).length === 0 &&
    nodes(a.creates).length === 0 && Object.keys(node(a.lifecycle)).length === 0 &&
    Object.keys(node(a.responseWindow)).length <= 2 && Object.keys(node(a.visibility)).length === 0 &&
    Object.keys(node(a.limit)).length === 0 && a.execution.mode === 'automatic';
}

/** True when this ability contains one of the dedicated Hakuno-M gateway nodes. */
export function containsHakunoMalePrivilegedNode(value: AuthoringAbility | RuleNode): boolean {
  return nodes((value as RuleNode).effects).some((effect) => EFFECTS.has(String(effect.type)));
}

/**
 * The gateway intentionally accepts only the four canonical whole-ability
 * shapes.  It is kept separate from text matching so a future archive cannot
 * silently widen the semantic contract.
 */
export function isAcceptedHakunoMaleAbility(a: AuthoringAbility): boolean {
  if (a.effects.length !== 1 || !emptyEnvelope(a, a.kind)) return false;
  const effect = a.effects[0]!;
  if (!EFFECTS.has(String(effect.type))) return false;
  if (effect.type === HAKUNO_M_YOMI_EFFECT) {
    const targets = nodes(a.targets);
    if (targets.length !== 1) return false;
    const opponentTarget = targets[0]!;
    const opponentCount = node(opponentTarget.count);
    const opponentConstraints = nodes(opponentTarget.constraints);
    return a.id === 'hakuno-m.yomi' && a.kind === 'phase_action' &&
      a.activation.phase === 'combat' && a.activation.opens === 'controller_combat_action_window' &&
      a.cost.length === 0 && exact(opponentTarget, ['id', 'type', 'count', 'constraints']) &&
      opponentTarget.id === 'opponent' && opponentTarget.type === 'player' && exactCount(opponentCount) &&
      opponentConstraints.length === 3 &&
      opponentConstraints.every((constraint, index) => exact(constraint, ['type']) && constraint.type === [
        'not_controller', 'same_location_as_controller', 'at_battlefield',
      ][index]) &&
      exact(effect, ['type', 'mode', 'target']) && effect.mode === 'analysis_or_challenge' && effect.target === 'opponent';
  }
  if (effect.type === HAKUNO_M_CHALLENGE_RESULT_EFFECT) {
    return a.id === 'hakuno-m.challenge-result' && a.kind === 'passive' &&
      (a.activation.trigger === 'while_active' || Object.keys(a.activation).length === 0) &&
      nodes(a.targets).length === 0 && exact(effect, ['type']);
  }
  if (effect.type === HAKUNO_M_ANALYSIS_EFFECT) {
    return a.id === 'hakuno-m.analysis' && a.kind === 'passive' &&
      (a.activation.trigger === 'while_active' || Object.keys(a.activation).length === 0) &&
      nodes(a.targets).length === 0 && exact(effect, ['type']);
  }
  const targets = nodes(a.targets);
  if (targets.length !== 2 || a.cost.length !== 1) return false;
  const analysisTarget = targets[0]!;
  const recipientTarget = targets[1]!;
  if (!exact(analysisTarget, ['id', 'type', 'scope', 'count', 'constraints']) ||
      !exact(recipientTarget, ['id', 'type', 'count', 'constraints'])) return false;
  const analysisScope = node(analysisTarget.scope);
  const analysisConstraint = nodes(analysisTarget.constraints)[0]!;
  const recipientConstraint = nodes(recipientTarget.constraints)[0]!;
  const cost = node(a.cost[0]);
  return a.id === 'hakuno-m.dead-face-transfer' && a.kind === 'phase_action' &&
    a.activation.phase === 'action' && a.activation.opens === 'controller_action_window' &&
    analysisTarget.id === 'analysis' && analysisTarget.type === 'card_instance' && exactCount(analysisTarget.count) &&
    exact(analysisScope, ['zone', 'owner', 'controller']) && analysisScope.zone === 'skill' &&
    analysisScope.owner === 'any' && analysisScope.controller === 'any' &&
    nodes(analysisTarget.constraints).length === 1 && exact(analysisConstraint, ['type', 'cardId']) &&
    analysisConstraint.type === 'has_card_id' && analysisConstraint.cardId === HAKUNO_M_ANALYSIS_DEFINITION &&
    exact(recipientTarget, ['id', 'type', 'count', 'constraints']) && recipientTarget.id === 'recipient' &&
    recipientTarget.type === 'player' && exactCount(recipientTarget.count) &&
    nodes(recipientTarget.constraints).length === 1 && exact(recipientConstraint, ['type']) &&
    recipientConstraint.type === 'not_controller' && a.cost.length === 1 && exact(cost, ['type', 'amount']) &&
    cost.type === 'pay_mana' && cost.amount === 1 &&
    exact(effect, ['type', 'source', 'target']) && effect.source === 'analysis' && effect.target === 'recipient';
}
