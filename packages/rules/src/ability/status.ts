import type { GameState } from '../schema/game';
import type { PlayerId } from './types';

/**
 * B-STATUS-LIFECYCLE-CONTRACT: a status may only exist if it declares who reads it.
 *  - reader   : the subsystem that consumes the status (required, auditable)
 *  - cleanup  : when the status disappears (round expiry / source leaving play / manual)
 *  - stacking : refresh (default) replaces, stack increments, ignore drops duplicates
 */
export type StatusCleanup = 'expire_at_round_end' | 'while_source_active' | 'manual';
export type StatusStacking = 'refresh' | 'stack' | 'ignore';

export interface StatusDefinition {
  id: string;
  reader: string;
  cleanup: StatusCleanup;
  stacking: StatusStacking;
  description: string;
}

export interface ActiveStatus {
  id: string;
  sourceControllerId: PlayerId;
  sourceCardId?: string;
  sourceAbilityId?: string;
  appliedRound: number;
  expiresAtRound?: number;
  locationId?: string;
  stacks: number;
}

export type StatusDuration = 'this_round' | 'next_round' | 'rounds' | 'while_source_active' | 'while_card_active';

const registry = new Map<string, StatusDefinition>();
/** Statuses whose producer exists in data but whose reader is scheduled by a later stage. */
const pendingReaders = new Map<string, { reason: string; stage: string; cleanup: StatusCleanup; stacking: StatusStacking }>();

export function registerPendingStatus(id: string, entry: { reason: string; stage: string; cleanup?: StatusCleanup; stacking?: StatusStacking }): void {
  pendingReaders.set(id, { cleanup: entry.cleanup ?? 'expire_at_round_end', stacking: entry.stacking ?? 'refresh', ...entry });
}
export function getPendingStatus(id: string): { reason: string; stage: string; cleanup: StatusCleanup; stacking: StatusStacking } | undefined {
  return pendingReaders.get(id);
}
export function listPendingStatuses(): Array<{ id: string; reason: string; stage: string; cleanup: StatusCleanup; stacking: StatusStacking }> {
  return [...pendingReaders.entries()].map(([id, entry]) => ({ id, ...entry }));
}
/** Lifecycle metadata exists even before a reader lands, so cleanup/stacking stay correct. */
function lifecycleOf(id: string): { cleanup: StatusCleanup; stacking: StatusStacking } | undefined {
  const registered = registry.get(id);
  if (registered) return { cleanup: registered.cleanup, stacking: registered.stacking };
  const pending = pendingReaders.get(id);
  return pending ? { cleanup: pending.cleanup, stacking: pending.stacking } : undefined;
}

export function registerStatus(definition: StatusDefinition): void {
  registry.set(definition.id, definition);
}
export function getStatusDefinition(id: string): StatusDefinition | undefined {
  return registry.get(id);
}
export function listStatusDefinitions(): StatusDefinition[] {
  return [...registry.values()];
}

type StatusCarrier = { activeStatuses?: unknown[] };

function carrier(state: GameState): Required<StatusCarrier> {
  const target = state as unknown as StatusCarrier;
  if (!Array.isArray(target.activeStatuses)) target.activeStatuses = [];
  return target as Required<StatusCarrier>;
}

/** Read-only: never initialises the status array. */
export function statusesOf(state: GameState): ActiveStatus[] {
  const list = (state as unknown as StatusCarrier).activeStatuses;
  if (!Array.isArray(list)) return [];
  return list.filter((entry): entry is ActiveStatus => !!entry && typeof entry === 'object' && typeof (entry as ActiveStatus).id === 'string')
    .map((entry) => ({ ...entry, stacks: Number(entry.stacks ?? 1) }));
}

function expiryFor(duration: StatusDuration, appliedRound: number, rounds?: number): number | undefined {
  switch (duration) {
    case 'this_round': return appliedRound + 1;
    case 'next_round': return appliedRound + 2;
    case 'rounds': return appliedRound + Math.max(1, Math.trunc(rounds ?? 1));
    default: return undefined;
  }
}

function sourceInPlay(state: GameState, sourceCardId: string): boolean {
  const card = state.cards.find((entry) => entry.instanceId === sourceCardId);
  if (!card) return false;
  if (!['field', 'attack_area', 'skill'].includes(card.zone)) return false;
  const state_ = (state as unknown as { abilityRuntime?: { cardState?: Record<string, { active?: boolean }> } }).abilityRuntime?.cardState?.[sourceCardId];
  return state_?.active !== false;
}

export interface InstallStatusInput {
  id: string;
  controllerId: PlayerId;
  duration?: StatusDuration | string;
  rounds?: number;
  sourceCardId?: string;
  sourceAbilityId?: string;
  locationId?: string;
}

export function installStatus(state: GameState, input: InstallStatusInput): void {
  const lifecycle = lifecycleOf(input.id);
  const duration = (input.duration ?? 'this_round') as StatusDuration;
  const appliedRound = state.round.roundNumber;
  const expiresAtRound = expiryFor(duration, appliedRound, input.rounds);
  const next: ActiveStatus = {
    id: input.id,
    sourceControllerId: input.controllerId,
    appliedRound,
    stacks: 1,
    ...(expiresAtRound !== undefined ? { expiresAtRound } : {}),
    ...(input.sourceCardId ? { sourceCardId: input.sourceCardId } : {}),
    ...(input.sourceAbilityId ? { sourceAbilityId: input.sourceAbilityId } : {}),
    ...(input.locationId ? { locationId: input.locationId } : {}),
  };

  const list = carrier(state).activeStatuses as ActiveStatus[];
  const existing = list.find((entry) => entry.id === next.id && entry.sourceControllerId === next.sourceControllerId &&
    (entry.locationId ?? '') === (next.locationId ?? ''));
  const policy = lifecycle?.stacking ?? 'refresh';
  if (!existing) { list.push(next); return; }
  if (policy === 'ignore') return;
  if (policy === 'stack') {
    existing.stacks = Number(existing.stacks ?? 1) + 1;
    if (next.expiresAtRound !== undefined) existing.expiresAtRound = next.expiresAtRound;
    else delete existing.expiresAtRound;
    return;
  }
  Object.assign(existing, next);
}

/** Defensive read: honours expiry and source liveness even before cleanup runs. */
export function isStatusActive(state: GameState, id: string, playerId?: PlayerId): boolean {
  const round = state.round.roundNumber;
  return statusesOf(state).some((status) => {
    if (status.id !== id) return false;
    if (playerId && status.sourceControllerId !== playerId) return false;
    if (status.expiresAtRound !== undefined && round >= status.expiresAtRound) return false;
    if (lifecycleOf(status.id)?.cleanup === 'while_source_active' && status.sourceCardId && !sourceInPlay(state, status.sourceCardId)) return false;
    return true;
  });
}

/** Round-boundary cleanup: expiry plus source-liveness pruning. */
export function cleanupStatuses(state: GameState): void {
  const list = (state as unknown as StatusCarrier).activeStatuses;
  if (!Array.isArray(list)) return;
  const round = state.round.roundNumber;
  const kept = (list as ActiveStatus[]).filter((status) => {
    if (!status || typeof status !== 'object') return false;
    if (status.expiresAtRound !== undefined && round >= status.expiresAtRound) return false;
    if (lifecycleOf(status.id)?.cleanup === 'while_source_active' && status.sourceCardId && !sourceInPlay(state, status.sourceCardId)) return false;
    return true;
  });
  (state as unknown as StatusCarrier).activeStatuses = kept;
}

// ---------- built-in registrations (each has a real reader) ----------
// 2026-11-02：`inferno_fire` 的读者已随部署钩子落地（deployment-hooks.ts#deploymentSlots），
// 从 pending 提升为正式注册；因此当前**没有任何** pending status。
registerStatus({
  id: 'inferno_fire',
  reader: 'packages/rules/src/ability/deployment-hooks.ts#deploymentSlots',
  cleanup: 'expire_at_round_end',
  stacking: 'refresh',
  description: '无间业火：对手在此部署前须支付战果才能使用 1..bid 号地利槽',
});

registerStatus({
  id: 'maiya_cannot_win_battle_this_round',
  reader: 'packages/rules/src/core/combat-resolver.ts#cannotWinBattleThisRound',
  cleanup: 'expire_at_round_end',
  stacking: 'refresh',
  description: '支援射击：本回合该玩家无法成为战斗胜者',
});