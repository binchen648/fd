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
    return a.id === 'hakuno-m.yomi' && a.kind === 'phase_action' &&
      a.activation.phase === 'combat' && a.activation.opens === 'controller_combat_action_window' &&
      nodes(a.targets).length === 1 && nodes(a.targets)[0]!.id === 'opponent' &&
      nodes(a.targets)[0]!.type === 'player' &&
      exact(effect, ['type', 'mode', 'target']) && effect.mode === 'analysis' && effect.target === 'opponent';
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
  return a.id === 'hakuno-m.dead-face-transfer' && a.kind === 'phase_action' &&
    a.activation.phase === 'action' && a.activation.opens === 'controller_action_window' &&
    nodes(a.targets).length === 2 && nodes(a.targets)[0]!.id === 'analysis' &&
    nodes(a.targets)[0]!.type === 'card_instance' && nodes(a.targets)[1]!.id === 'recipient' &&
    nodes(a.targets)[1]!.type === 'player' && a.cost.length === 1 && a.cost[0]!.type === 'pay_mana' &&
    exact(effect, ['type', 'source', 'target']) && effect.source === 'analysis' && effect.target === 'recipient';
}

