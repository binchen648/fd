import type { GameState } from '../schema/game';
import type { AuthoringAbility, PlayerId, RuleNode } from './types';

export type AcceptedGameStartPlayerStatusTarget =
  | 'controller'
  | { scope: 'turn_order_next_player' };

export interface GameStartPlayerStatusAssignment {
  playerId: PlayerId;
  status: string;
}

function record(value: unknown): RuleNode | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : undefined;
}

function hasExactKeys(value: RuleNode, expected: string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every((key) => expected.includes(key));
}

function isAcceptedTarget(value: unknown): value is AcceptedGameStartPlayerStatusTarget {
  if (value === 'controller') return true;
  const target = record(value);
  return target !== undefined && target.scope === 'turn_order_next_player' && hasExactKeys(target, ['scope']);
}

export function isExactGameStartPlayerStatusAssignmentEffect(effect: RuleNode): boolean {
  return effect.type === 'add_status' && typeof effect.status === 'string' && effect.status.trim().length > 0 &&
    isAcceptedTarget(effect.target) && hasExactKeys(effect, ['type', 'status', 'target']);
}

function containsAddStatus(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsAddStatus);
  const valueRecord = record(value);
  return valueRecord !== undefined &&
    (valueRecord.type === 'add_status' || Object.values(valueRecord).some(containsAddStatus));
}

export function isGameStartPlayerStatusAssignmentCandidate(ability: AuthoringAbility): boolean {
  return [ability.conditions, ability.targets, ability.effects, ability.cost, ability.ruleModifiers, ability.creates]
    .some(containsAddStatus);
}

export function isGameStartPlayerStatusAssignmentSemantic(ability: AuthoringAbility): boolean {
  if (!isGameStartPlayerStatusAssignmentCandidate(ability) || ability.kind !== 'forced_trigger' ||
    ability.execution.mode !== 'automatic' || !Array.isArray(ability.execution.allowedOperations) ||
    ability.execution.allowedOperations.length !== 0) return false;
  if (ability.activation.trigger !== 'game_start' || !hasExactKeys(ability.activation, ['trigger'])) return false;
  if (ability.conditions.length !== 1 || ability.conditions[0]!.type !== 'source_owned' ||
    !hasExactKeys(ability.conditions[0]!, ['type'])) return false;
  if (ability.effects.length === 0 || !ability.effects.every(isExactGameStartPlayerStatusAssignmentEffect)) return false;
  if (ability.targets.length || ability.cost.length || ability.creates.length || ability.ruleModifiers.length) return false;
  if (Object.keys(ability.lifecycle).length || Object.keys(ability.limit).length || Object.keys(ability.visibility).length) return false;
  const responseKeys = Object.keys(ability.responseWindow);
  const acceptedResponseWindow = responseKeys.length === 0 || (
    ability.responseWindow.order === 'turn_order' &&
    ability.responseWindow.passBehavior === 'decline_this_window' &&
    hasExactKeys(ability.responseWindow, ['order', 'passBehavior']));
  return acceptedResponseWindow &&
    hasExactKeys(ability.execution as unknown as RuleNode, ['mode', 'allowedOperations']);
}

/** Resolve the exact circular relation from authoritative seats. Invalid or ambiguous topology has no answer. */
export function turnOrderNextActivePlayerId(state: GameState, controllerId: PlayerId): PlayerId | undefined {
  if (state.players.length < 2) return undefined;
  if (new Set(state.players.map((player) => player.id)).size !== state.players.length) return undefined;
  if (state.players.some((player) => !Number.isSafeInteger(player.seat)) ||
    new Set(state.players.map((player) => player.seat)).size !== state.players.length) return undefined;
  const ordered = state.players.slice().sort((left, right) => left.seat - right.seat);
  const controllerIndex = ordered.findIndex((player) => player.id === controllerId);
  if (controllerIndex < 0) return undefined;
  for (let offset = 1; offset < ordered.length; offset += 1) {
    const candidate = ordered[(controllerIndex + offset) % ordered.length]!;
    if (candidate.id !== controllerId && candidate.status === 'active') return candidate.id;
  }
  return undefined;
}

export function gameStartPlayerStatusAssignments(
  state: GameState,
  controllerId: PlayerId,
  ability: AuthoringAbility,
): GameStartPlayerStatusAssignment[] | undefined {
  if (!isGameStartPlayerStatusAssignmentSemantic(ability) ||
    !state.players.some((player) => player.id === controllerId)) return undefined;
  const needsNextPlayer = ability.effects.some((effect) => effect.target !== 'controller');
  const nextPlayerId = needsNextPlayer ? turnOrderNextActivePlayerId(state, controllerId) : undefined;
  if (needsNextPlayer && !nextPlayerId) return undefined;
  return ability.effects.map((effect) => ({
    playerId: effect.target === 'controller' ? controllerId : nextPlayerId!,
    status: effect.status as string,
  }));
}

export function assignGameStartPlayerStatuses(
  state: GameState,
  controllerId: PlayerId,
  ability: AuthoringAbility,
): boolean {
  const assignments = gameStartPlayerStatusAssignments(state, controllerId, ability);
  if (!assignments || !state.abilityRuntime) return false;
  const store = state.abilityRuntime.playerStatusKeysByPlayer ??= {};
  for (const assignment of assignments) {
    const statuses = store[assignment.playerId] ??= [];
    if (!statuses.includes(assignment.status)) statuses.push(assignment.status);
  }
  return true;
}

/** Read-only copy for future generic status conditions and effects. */
export function playerStatusKeys(state: GameState, playerId: PlayerId): string[] {
  return [...(state.abilityRuntime?.playerStatusKeysByPlayer?.[playerId] ?? [])];
}

export function playerHasStatus(state: GameState, playerId: PlayerId, status: string): boolean {
  return typeof status === 'string' && status.trim().length > 0 && playerStatusKeys(state, playerId).includes(status);
}
