import type { GameState } from '../schema/game';
import type { AuthoringAbility, RuleNode } from './types';

export const COMBAT_REWARD_DISTRIBUTION_RULE = 'combat_reward_distribution' as const;
export const FULL_REWARD_EACH_MODE = 'full_reward_each' as const;

function node(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function emptyNode(value: unknown): boolean { return Object.keys(node(value)).length === 0; }
function emptyArray(value: unknown): boolean { return value === undefined || (Array.isArray(value) && value.length === 0); }

export function isAcceptedFullRewardEachModifier(value: unknown): boolean {
  const modifier = node(value);
  const scope = node(modifier.scope);
  if (modifier.operation !== 'replace' || modifier.rule !== COMBAT_REWARD_DISTRIBUTION_RULE) return false;
  if (!exactKeys(modifier, ['id', 'printedClause', 'operation', 'rule', 'scope'])) return false;
  return scope.subject === 'controller' && scope.whenControllerWins === true && scope.mode === FULL_REWARD_EACH_MODE &&
    Object.keys(scope).length === 3 && Object.keys(scope).every((key) => ['subject', 'whenControllerWins', 'mode'].includes(key));
}

/** Exact identity-free whole-ability gateway for the continuous full-reward-each replacement. */
export function isAcceptedFullRewardEachAbility(value: AuthoringAbility | RuleNode): boolean {
  const ability = value as unknown as RuleNode;
  if (ability.kind !== 'passive') return false;
  if (!emptyNode(ability.activation) || !emptyArray(ability.conditions) || !emptyArray(ability.targets) ||
      !emptyArray(ability.effects) || !emptyArray(ability.cost) || !emptyArray(ability.creates) ||
      !emptyNode(ability.lifecycle) || !emptyNode(ability.limit) || !emptyNode(ability.visibility)) return false;
  const response = node(ability.responseWindow);
  if (Object.keys(response).some((key) => !['order', 'passBehavior'].includes(key))) return false;
  if (response.order !== undefined && response.order !== 'turn_order') return false;
  if (response.passBehavior !== undefined && response.passBehavior !== 'decline_this_window') return false;
  const modifiers = nodes(ability.ruleModifiers);
  if (modifiers.length !== 1 || !isAcceptedFullRewardEachModifier(modifiers[0])) return false;
  const execution = node(ability.execution);
  if (execution.mode !== 'automatic' || !Object.keys(execution).every((key) => ['mode', 'allowedOperations'].includes(key))) return false;
  if (execution.allowedOperations !== undefined && (!Array.isArray(execution.allowedOperations) || execution.allowedOperations.length !== 0)) return false;
  return true;
}

function sourceCardIsLive(state: GameState, instanceId: string): boolean {
  const source = state.cards.find((card) => card.instanceId === instanceId);
  if (!source) return false;
  const sourceState = state.abilityRuntime?.cardState[instanceId];
  if (sourceState?.faceDown === true) return false;
  if (source.zone === 'skill' || source.zone === 'hand') return true;
  if (source.zone !== 'attack_area') return false;
  return sourceState?.active === true;
}

/**
 * Mirrors the locked Reference continuous-source contract without character identity routing:
 * passive skill/hand sources are live; attack-area sources must be active and face-up.
 */
export function shouldEachBattleWinnerReceiveFullReward(state: GameState, winnerPlayerIds: readonly string[]): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime || winnerPlayerIds.length === 0) return false;
  const winners = new Set(winnerPlayerIds);
  for (const source of state.cards) {
    if (!winners.has(source.controllerPlayerId) || source.ownerPlayerId !== source.controllerPlayerId) continue;
    const player = state.players.find((candidate) => candidate.id === source.controllerPlayerId);
    if (!player || player.status !== 'active' || !sourceCardIsLive(state, source.instanceId)) continue;
    const definition = runtime.pack.cards[source.definitionId];
    if (!definition) continue;
    if (definition.abilities.some((ability) => isAcceptedFullRewardEachAbility(ability))) return true;
  }
  return false;
}
