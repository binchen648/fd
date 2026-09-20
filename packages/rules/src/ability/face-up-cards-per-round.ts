import type { GameState } from '../schema/game';
import { getEnabledLocations } from '../core/map-engine';
import { isActiveCardSource } from '../core/card-source-state';
import { hostOperations, type AuthoringAbility, type RuleNode } from './types';

function node(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function str(value: unknown): string { return typeof value === 'string' ? value : ''; }
function exactKeys(value: RuleNode, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

/** FB2-44 exact identity-free same-battlefield face-up play cap selector. */
export function isAcceptedFaceUpCardsPerRoundModifier(modifier: RuleNode): boolean {
  const scope = node(modifier.scope);
  const lifecycle = node(modifier.lifecycle);
  const priority = node(modifier.priority);
  if (str(modifier.id).length === 0 || str(modifier.printedClause).length === 0) return false;
  if (modifier.type !== 'card_play_rule_override' || modifier.operation !== 'set' || modifier.rule !== 'face_up_cards_per_round') return false;
  if (!Number.isSafeInteger(modifier.value) || modifier.value !== 1) return false;
  if (!exactKeys(scope, ['subject']) || scope.subject !== 'players_at_source_battlefield') return false;
  if (!exactKeys(lifecycle, ['duration']) || lifecycle.duration !== 'while_active') return false;
  if (!exactKeys(priority, ['tier', 'specificity']) || priority.tier !== 'card_text' || priority.specificity !== 'specific') return false;
  if (modifier.conflictPolicy !== 'host_required') return false;
  return exactKeys(modifier, [
    'id', 'printedClause', 'type', 'operation', 'rule', 'scope', 'value', 'lifecycle', 'priority', 'conflictPolicy',
  ]);
}

export function isAcceptedStaticFaceUpCardsPerRoundAbility(
  ability: AuthoringAbility | RuleNode,
  form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw = ability as RuleNode;
  if (raw.kind !== 'residual') return false;
  if (Object.keys(node(raw.activation)).length !== 0) return false;
  if (nodes(raw.conditions).length !== 0 || nodes(raw.targets).length !== 0 || nodes(raw.effects).length !== 0 ||
      nodes(raw.cost).length !== 0 || nodes(raw.creates).length !== 0) return false;
  const modifiers = nodes(raw.ruleModifiers);
  if (modifiers.length !== 1 || !isAcceptedFaceUpCardsPerRoundModifier(modifiers[0]!)) return false;
  const lifecycle = node(raw.lifecycle);
  if (!exactKeys(lifecycle, ['duration']) || lifecycle.duration !== 'while_active') return false;
  if (Object.keys(node(raw.limit)).length !== 0 || Object.keys(node(raw.visibility)).length !== 0) return false;

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

export function hasLiveFaceUpCardsPerRoundLimit(state: GameState, playerId: string): boolean {
  const runtime = state.abilityRuntime;
  const target = state.players.find((candidate) => candidate.id === playerId && candidate.status === 'active');
  if (!runtime || !target?.locationId) return false;
  const battlefield = getEnabledLocations(state.map, state.locationConfig)
    .find((location) => location.id === target.locationId && location.tags.includes('battlefield'));
  if (!battlefield) return false;

  return state.cards.some((source) => {
    if (!isActiveCardSource(state, source.instanceId)) return false;
    const sourceController = state.players.find((candidate) => candidate.id === source.controllerPlayerId && candidate.status === 'active');
    if (!sourceController || sourceController.locationId !== target.locationId) return false;
    const definition = runtime.pack.cards[source.definitionId];
    return definition?.abilities.some((ability) => isAcceptedStaticFaceUpCardsPerRoundAbility(ability, 'compiled')) === true;
  });
}

export function faceUpCardsPlayedThisRound(state: GameState, playerId: string): number {
  const counters = state.abilityRuntime?.playCounters;
  if (!counters || counters.round !== state.round.roundNumber) return 0;
  const value = counters.faceUpCardsPlayedByPlayer?.[playerId] ?? 0;
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function faceUpCardPlayLimitReached(state: GameState, playerId: string, additionalFaceUpCards = 1): boolean {
  if (!Number.isSafeInteger(additionalFaceUpCards) || additionalFaceUpCards < 0) return true;
  return hasLiveFaceUpCardsPerRoundLimit(state, playerId) &&
    faceUpCardsPlayedThisRound(state, playerId) + additionalFaceUpCards > 1;
}

export function recordCompletedFaceUpCardPlay(state: GameState, playerId: string): void {
  const counters = state.abilityRuntime?.playCounters;
  if (!counters) throw new Error('Face-up play counter requires initialized ability runtime');
  if (counters.round !== state.round.roundNumber) {
    counters.round = state.round.roundNumber;
    counters.cardsPlayedByPlayer = {};
    counters.faceUpCardsPlayedByPlayer = {};
    counters.attacksDeclaredByPlayer = {};
  }
  counters.faceUpCardsPlayedByPlayer ??= {};
  counters.faceUpCardsPlayedByPlayer[playerId] = (counters.faceUpCardsPlayedByPlayer[playerId] ?? 0) + 1;
}
