import type { GameState } from '../schema/game';
import { getEnabledLocations } from '../core/map-engine';
import { hostOperations, type AbilityEvent, type AuthoringAbility, type PlayerId, type RuleNode } from './types';

export const CONTROLLER_DEFEATED_TRIGGER = 'after_controller_defeated';

function isRuleNode(value: unknown): value is RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function node(value: unknown): RuleNode {
  return isRuleNode(value) ? value : {};
}
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
function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}
function isDenseStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) return false;
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index) || typeof value[index] !== 'string' || value[index].length === 0) return false;
  }
  return true;
}

/** Raw candidate discovery prevents malformed defeated-trigger envelopes from normalizing into a runnable sibling. */
export function isControllerDefeatedVpRewardCandidate(ability: AuthoringAbility | RuleNode): boolean {
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (!value || typeof value !== 'object') return false;
    const current = node(value);
    if (current.trigger === CONTROLLER_DEFEATED_TRIGGER) return true;
    return Object.values(current).some(visit);
  };
  return visit(ability as RuleNode);
}

/** FB2-47 exact controller-defeated fact -> fixed controller VP reward envelope. */
export function isAcceptedControllerDefeatedVpRewardAbility(
  ability: AuthoringAbility | RuleNode,
  form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw = ability as RuleNode;
  if (!exactKeys(raw, [
    'id', 'kind', 'printedClause', 'markers', 'activation', 'conditions', 'targets', 'effects', 'cost', 'creates',
    'ruleModifiers', 'lifecycle', 'responseWindow', 'limit', 'visibility', 'execution',
  ]) || raw.kind !== 'forced_trigger') return false;
  if (!exactEmptyArray(raw, 'markers')) return false;

  const activation = node(raw.activation);
  if (!exactKeys(activation, ['trigger']) || activation.trigger !== CONTROLLER_DEFEATED_TRIGGER) return false;

  const conditions = nodes(raw.conditions);
  if (conditions.length !== 1 || conditions[0]!.type !== 'event_player_is_controller' ||
      !exactKeys(conditions[0]!, ['type'])) return false;

  for (const key of ['targets', 'cost', 'creates', 'ruleModifiers']) {
    if (!exactEmptyArray(raw, key)) return false;
  }

  const effects = nodes(raw.effects);
  if (effects.length !== 1) return false;
  const effect = effects[0]!;
  if (effect.type !== 'adjust_victory_points' || !exactKeys(effect, ['type', 'player', 'amount']) ||
      effect.player !== 'controller' || !isPositiveSafeInteger(effect.amount)) return false;

  for (const key of ['lifecycle', 'limit', 'visibility']) {
    if (!exactEmptyObject(raw, key)) return false;
  }

  const response = raw.responseWindow;
  if (form === 'authoring') {
    if (!exactEmptyObject(raw, 'responseWindow')) return false;
  } else if (!isRuleNode(response) || response.order !== 'turn_order' || response.passBehavior !== 'decline_this_window' ||
      !exactKeys(response, ['order', 'passBehavior'])) return false;

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

export function controllerDefeatedVpRewardAmount(ability: AuthoringAbility | RuleNode): number | undefined {
  if (!isAcceptedControllerDefeatedVpRewardAbility(ability, 'compiled')) return undefined;
  return Number(nodes((ability as RuleNode).effects)[0]!.amount);
}

export interface TrustedControllerDefeatedFacts {
  battlePhaseResolutionId: string;
  battleId: string;
  resultId: string;
  battlefieldId: string;
}

/** Validate only the stable server-derived actual-defeat fact from one frozen battle result. */
export function trustedControllerDefeatedFacts(
  state: GameState,
  controllerId: PlayerId,
  event: AbilityEvent | undefined,
): TrustedControllerDefeatedFacts | undefined {
  if (!event || state.round.activePhase !== 'battle' || !Number.isSafeInteger(state.round.roundNumber) || state.round.roundNumber < 1) return undefined;
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  const battlefieldId = event.battlefieldId;
  const battleId = event.battleId;
  const resultId = event.resultId;
  if (event.type !== CONTROLLER_DEFEATED_TRIGGER || event.playerId !== controllerId ||
      event.battlePhaseResolutionId !== phaseId || typeof battlefieldId !== 'string' || !battlefieldId ||
      typeof battleId !== 'string' || typeof resultId !== 'string' || resultId !== `${battleId}:result` ||
      event.id !== `${resultId}:defeat:${controllerId}`) return undefined;
  // A defeated fact is derived only while/after its trusted root result is already inside the server event transaction.
  if (!state.abilityRuntime?.processedEvents.includes(resultId)) return undefined;

  const closedLocations = new Set(
    ((state as unknown as { modeState?: { closedLocations?: unknown } }).modeState?.closedLocations instanceof Array
      ? (state as unknown as { modeState: { closedLocations: unknown[] } }).modeState.closedLocations
      : []).filter((locationId): locationId is string => typeof locationId === 'string'),
  );
  const knownBattlefieldIds = new Set<string>(getEnabledLocations(state.map, state.locationConfig)
    .filter((location) => !closedLocations.has(location.id))
    .filter((location) => location.tags.includes('battlefield') || location.rewardHooks.includes('battle_rewards'))
    .map((location) => location.id));
  if (!knownBattlefieldIds.has(battlefieldId)) return undefined;

  const prefix = `${phaseId}:battle:${battlefieldId}:`;
  const ordinal = battleId.startsWith(prefix) ? battleId.slice(prefix.length) : '';
  if (!/^[1-9]\d*$/.test(ordinal) || !Number.isSafeInteger(Number(ordinal))) return undefined;

  const knownPlayerIds = new Set(state.players.map((player) => player.id));
  const participants = event.battleParticipantIds;
  const winners = event.battleResult?.winners;
  const losers = event.battleResult?.loserIds;
  if (!isDenseStringArray(participants) || participants.length === 0 || new Set(participants).size !== participants.length ||
      participants.some((playerId) => !knownPlayerIds.has(playerId)) ||
      !isDenseStringArray(winners) || winners.length === 0 || new Set(winners).size !== winners.length ||
      winners.some((playerId) => !knownPlayerIds.has(playerId) || !participants.includes(playerId)) ||
      !isDenseStringArray(losers) || losers.length === 0 || new Set(losers).size !== losers.length ||
      losers.some((playerId) => !knownPlayerIds.has(playerId) || !participants.includes(playerId)) ||
      winners.some((playerId) => losers.includes(playerId)) ||
      !participants.includes(controllerId) || !losers.includes(controllerId) || winners.includes(controllerId)) return undefined;

  return { battlePhaseResolutionId: phaseId, battleId, resultId, battlefieldId };
}
