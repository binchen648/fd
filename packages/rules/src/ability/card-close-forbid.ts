import type { GameState } from '../schema/game';
import { isActiveCardSource } from '../core/card-source-state';
import type { RuleNode } from './types';

function node(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function str(value: unknown): string { return typeof value === 'string' ? value : ''; }

/**
 * FB2-42: one exact, identity-free close-forbid selector.
 *
 * Definition sets are normalized as multiple modifiers, each with one structural
 * has_card_id constraint. This deliberately does not admit wildcard, list,
 * attribute, relationship, or non-round close immunity.
 */
export function isAcceptedControlledCardCloseForbidModifier(modifier: RuleNode): boolean {
  if (modifier.operation !== 'forbid' || modifier.rule !== 'card_close') return false;
  const scope = node(modifier.scope);
  const constraints = nodes(scope.constraints);
  const lifecycle = node(modifier.lifecycle);
  if (str(scope.controller) !== 'self' ||
    !Object.keys(scope).every((key) => ['controller', 'constraints'].includes(key))) return false;
  if (constraints.length !== 1) return false;
  const constraint = constraints[0]!;
  if (constraint.type !== 'has_card_id' || !str(constraint.cardId) ||
    !Object.keys(constraint).every((key) => ['type', 'cardId'].includes(key))) return false;
  if (lifecycle.duration !== 'this_round' ||
    !Object.keys(lifecycle).every((key) => key === 'duration')) return false;
  return Object.keys(modifier).every((key) =>
    ['id', 'printedClause', 'operation', 'rule', 'scope', 'lifecycle'].includes(key));
}

/** Server-owned runtime query used immediately before a close-source mutation. */
export function isCardCloseForbidden(state: GameState, cardInstanceId: string): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return false;
  const target = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  if (!target) return false;
  const currentRound = state.round.roundNumber;
  if (!Number.isSafeInteger(currentRound) || currentRound < 1) return false;

  for (const ongoing of runtime.ongoingEffects) {
    if (ongoing.duration !== 'this_round' || ongoing.startRound !== currentRound ||
      ongoing.expiresAtRound !== currentRound + 1) continue;
    if (ongoing.sourceMustRemainActive !== false && !isActiveCardSource(state, ongoing.sourceCardId)) continue;
    if (ongoing.sourceValidityPolicyId) continue;
    if (ongoing.controllerId !== target.controllerPlayerId) continue;
    for (const installed of ongoing.ruleModifiers) {
      const modifier = installed.definition;
      if (!isAcceptedControlledCardCloseForbidModifier(modifier)) continue;
      const constraint = nodes(node(modifier.scope).constraints)[0]!;
      if (str(constraint.cardId) === target.definitionId) return true;
    }
  }
  return false;
}