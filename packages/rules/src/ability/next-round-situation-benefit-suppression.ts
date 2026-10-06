import type { GameState } from '../schema/game';
import { getEnabledLocations } from '../core/map-engine';
import { hostOperations, type AuthoringAbility, type PlayerId, type RuleNode } from './types';

export const NEXT_ROUND_SITUATION_BENEFIT_SUPPRESSION_EFFECT = 'suppress_next_round_situation_benefits';
export const SITUATION_SUPPRESSION_LUCK_PREDICATE = 'does_not_control_card_definition';
export const SITUATION_SUPPRESSION_AUTHORING_LUCK_ID = 'card.cardluck';
export const SITUATION_SUPPRESSION_RUNTIME_LUCK_ID = 'basic.luck';
export const SITUATION_SUPPRESSION_ROUND_OFFSET = 1;
export const SITUATION_SUPPRESSION_BENEFITS = ['situation_mana_gain', 'situation_power_bonus'] as const;

function isRuleNode(value: unknown): value is RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function node(value: unknown): RuleNode { return isRuleNode(value) ? value : {}; }
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function allowedKeys(value: RuleNode, keys: readonly string[]): boolean { return Object.keys(value).every((key) => keys.includes(key)); }
function exactKeys(value: RuleNode, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function exactEmptyArray(raw: RuleNode, key: string): boolean {
  const value = raw[key];
  return value === undefined || (Array.isArray(value) && value.length === 0);
}
function exactEmptyObject(raw: RuleNode, key: string): boolean {
  const value = raw[key];
  return value === undefined || (isRuleNode(value) && Object.keys(value).length === 0);
}

function exactLuckPredicate(value: unknown): boolean {
  const predicate = node(value);
  return predicate.type === SITUATION_SUPPRESSION_LUCK_PREDICATE &&
    Array.isArray(predicate.definitionIds) && predicate.definitionIds.length === 1 &&
    predicate.definitionIds[0] === SITUATION_SUPPRESSION_AUTHORING_LUCK_ID &&
    Array.isArray(predicate.zones) && predicate.zones.length === 1 && predicate.zones[0] === 'attack' &&
    predicate.activeOnly === true && predicate.face === 'up' &&
    exactKeys(predicate, ['type', 'definitionIds', 'zones', 'activeOnly', 'face']);
}

function exactTarget(value: unknown): boolean {
  const target = node(value);
  const where = nodes(target.where);
  return target.scope === 'same_battlefield_opponents' && where.length === 1 && exactLuckPredicate(where[0]) &&
    exactKeys(target, ['scope', 'where']);
}

function exactSuppressionEffect(value: unknown): boolean {
  const effect = node(value);
  const benefits = Array.isArray(effect.benefits) ? effect.benefits : [];
  return effect.type === NEXT_ROUND_SITUATION_BENEFIT_SUPPRESSION_EFFECT && exactTarget(effect.target) &&
    effect.roundOffset === SITUATION_SUPPRESSION_ROUND_OFFSET && benefits.length === 2 &&
    benefits[0] === SITUATION_SUPPRESSION_BENEFITS[0] && benefits[1] === SITUATION_SUPPRESSION_BENEFITS[1] &&
    exactKeys(effect, ['type', 'target', 'roundOffset', 'benefits']);
}

/** Reserve every FB2-52-specific token anywhere in an ability so misplaced vocabulary reaches the exact whole-envelope gateway. */
export function isNextRoundSituationBenefitSuppressionCandidate(ability: AuthoringAbility | RuleNode): boolean {
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (!value || typeof value !== 'object') return false;
    const current = node(value);
    if (current.type === NEXT_ROUND_SITUATION_BENEFIT_SUPPRESSION_EFFECT ||
        current.type === SITUATION_SUPPRESSION_LUCK_PREDICATE ||
        current.rule === 'situation_mana_gain' || current.rule === 'situation_power_bonus') return true;
    return Object.values(current).some(visit);
  };
  return visit(ability as RuleNode);
}

/** Exact identity-free FB2-52 combat phase-action envelope. */
export function isAcceptedNextRoundSituationBenefitSuppressionAbility(
  ability: AuthoringAbility | RuleNode,
  form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw = ability as RuleNode;
  if (!allowedKeys(raw, [
    'id', 'kind', 'printedClause', 'markers', 'activation', 'conditions', 'targets', 'effects', 'cost', 'creates',
    'ruleModifiers', 'lifecycle', 'responseWindow', 'limit', 'visibility', 'execution',
  ]) || raw.kind !== 'phase_action') return false;
  if (!exactEmptyArray(raw, 'markers')) return false;

  const activation = node(raw.activation);
  if (activation.phase !== 'combat' || activation.opens !== 'controller_combat_action_window' ||
      !exactKeys(activation, ['phase', 'opens'])) return false;

  const conditions = nodes(raw.conditions);
  if (conditions.length !== 2 || conditions[0]!.type !== 'source_active' || conditions[1]!.type !== 'at_battlefield' ||
      !exactKeys(conditions[0]!, ['type']) || !exactKeys(conditions[1]!, ['type'])) return false;

  for (const key of ['targets', 'cost', 'creates', 'ruleModifiers']) if (!exactEmptyArray(raw, key)) return false;
  const effects = nodes(raw.effects);
  if (effects.length !== 1 || !exactSuppressionEffect(effects[0])) return false;

  for (const key of ['lifecycle', 'limit', 'visibility']) if (!exactEmptyObject(raw, key)) return false;
  if (form === 'authoring') {
    if (!exactEmptyObject(raw, 'responseWindow')) return false;
  } else {
    const response = node(raw.responseWindow);
    if (!exactKeys(response, ['order', 'passBehavior']) || response.order !== 'turn_order' ||
        response.passBehavior !== 'decline_this_window') return false;
  }

  const execution = node(raw.execution);
  if (execution.mode !== 'automatic' || !Object.keys(execution).every((key) => ['mode', 'hostOps', 'allowedOperations'].includes(key))) return false;
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

function exactKnownSuppressionMarker(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new Error('Corrupt next-round situation-benefit suppression marker.');
  return Number(value);
}

function hasActiveFaceUpLuckAttack(state: GameState, playerId: PlayerId): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return false;
  return state.cards.some((candidate) => {
    if (candidate.controllerPlayerId !== playerId || candidate.definitionId !== SITUATION_SUPPRESSION_RUNTIME_LUCK_ID || candidate.zone !== 'attack_area') return false;
    const cardState = runtime.cardState[candidate.instanceId];
    return cardState?.active === true && cardState.faceDown !== true;
  });
}

export function nextRoundSituationSuppressionQualifyingOpponentIds(state: GameState, controllerId: PlayerId): PlayerId[] {
  const controller = state.players.find((candidate) => candidate.id === controllerId);
  if (!controller || controller.status !== 'active' || !controller.locationId) return [];
  const controllerAtBattlefield = getEnabledLocations(state.map, state.locationConfig)
    .some((location) => location.id === controller.locationId && location.tags.includes('battlefield'));
  if (!controllerAtBattlefield) return [];
  return state.players
    .filter((candidate) => candidate.id !== controllerId && candidate.status === 'active' && candidate.locationId === controller.locationId)
    .filter((candidate) => !hasActiveFaceUpLuckAttack(state, candidate.id))
    .sort((left, right) => left.seat - right.seat)
    .map((candidate) => candidate.id);
}

export function applyNextRoundSituationBenefitSuppression(state: GameState, controllerId: PlayerId): PlayerId[] {
  const runtime = state.abilityRuntime;
  if (!runtime) throw new Error('Ability runtime is required for next-round situation-benefit suppression.');
  const qualifying = nextRoundSituationSuppressionQualifyingOpponentIds(state, controllerId);
  if (!qualifying.length) throw new Error('No qualifying same-battlefield opponent for next-round situation-benefit suppression.');
  const nextRound = state.round.roundNumber + SITUATION_SUPPRESSION_ROUND_OFFSET;
  if (!Number.isSafeInteger(nextRound)) throw new Error('Next-round situation-benefit suppression round is invalid.');
  const current = runtime.situationBenefitsSuppressedRoundByPlayer ?? {};
  const knownPlayerIds = new Set(state.players.map((candidate) => candidate.id));
  for (const [playerId, marker] of Object.entries(current)) {
    if (!knownPlayerIds.has(playerId)) throw new Error('Corrupt next-round situation-benefit suppression player id.');
    exactKnownSuppressionMarker(marker);
  }
  runtime.situationBenefitsSuppressedRoundByPlayer = { ...current };
  for (const playerId of qualifying) runtime.situationBenefitsSuppressedRoundByPlayer[playerId] = nextRound;
  return qualifying;
}

export function situationBenefitsSuppressedForPlayer(state: GameState, playerId: PlayerId): boolean {
  const marker = exactKnownSuppressionMarker(state.abilityRuntime?.situationBenefitsSuppressedRoundByPlayer?.[playerId]);
  return marker !== undefined && marker === state.round.roundNumber;
}
