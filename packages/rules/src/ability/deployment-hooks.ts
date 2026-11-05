import type { GameState } from '../schema/game';
import type { PlayerId } from './types';
import { isStatusActive, statusesOf } from './status';

/**
 * B-DEPLOYMENT-HOOK-CONTRACT: deployment-phase rule interface.
 *
 * The hook is deliberately *not* a status side effect: deployment asks the hook for the
 * usable terrain slots before assigning one. Purely computational here — the payment
 * input (player choice) belongs to the command contract, see the contract doc.
 */
export interface DeploymentContext {
  state: GameState;
  playerId: PlayerId;
  locationId: string;
  /** VP the deploying player is willing to pay for this deployment (0..maxBid). */
  bid: number;
}

export interface DeploymentHook {
  statusId: string;
  /** Upper bound of the bid the rule allows. */
  maxBid: number;
  /** Terrain slot indexes (0-based) the player may use after paying `bid`. */
  availableSlots(context: DeploymentContext, terrainSlotCount: number): number[];
  /** Human-readable reason for a blocked deployment (empty when allowed). */
  blockedReason?: (context: DeploymentContext) => string;
}

const hooks = new Map<string, DeploymentHook>();

export function registerDeploymentHook(hook: DeploymentHook): void {
  hooks.set(hook.statusId, hook);
}
export function getDeploymentHook(statusId: string): DeploymentHook | undefined {
  return hooks.get(statusId);
}
export function listDeploymentHooks(): DeploymentHook[] {
  return [...hooks.values()];
}

/** Active hooks whose status applies to `playerId` at `locationId`. */
export function deploymentHooksFor(state: GameState, _playerId: PlayerId, locationId: string): DeploymentHook[] {
  return statusesOf(state)
    .filter((status) => status.locationId === undefined || status.locationId === locationId)
    .map((status) => hooks.get(status.id))
    .filter((hook): hook is DeploymentHook => !!hook)
    .filter((hook) => isStatusActive(state, hook.statusId));
}

export interface DeploymentSlots {
  usableSlotIndexes: number[];
  maxBid: number;
  blockedReason?: string;
}

/**
 * Resolve usable terrain slots for a deployment.
 * Base terrain number of slot `index` is `index + 1`; a slot is unusable when its base
 * number exceeds the paid bid ("基础地利数高于其支付战果数的地利位置视为已被占据").
 */
export function deploymentSlots(state: GameState, playerId: PlayerId, locationId: string,
  terrainSlotCount_: number, bid = 0): DeploymentSlots {
  const active = deploymentHooksFor(state, playerId, locationId);
  if (active.length === 0) {
    return { usableSlotIndexes: Array.from({ length: terrainSlotCount_ }, (_, index) => index), maxBid: 0 };
  }
  const maxBid = Math.max(...active.map((hook) => hook.maxBid));
  let usable = Array.from({ length: terrainSlotCount_ }, (_, index) => index);
  for (const hook of active) {
    if (hook.statusId !== 'inferno_fire') continue;
    const paid = Math.max(0, Math.min(bid, hook.maxBid));
    usable = usable.filter((index) => index + 1 <= paid);
  }
  const blockedReason = usable.length === 0
    ? '所有地利槽的基础地利数高于支付战果数，视为已被占据'
    : undefined;
  return { usableSlotIndexes: usable, maxBid, ...(blockedReason ? { blockedReason } : {}) };
}

/** Inferno fire: opponents deploying here may pay up to 5 VP to unlock slots 1..bid. */
registerDeploymentHook({
  statusId: 'inferno_fire',
  maxBid: 5,
  availableSlots: (context, count) => deploymentSlots(context.state, context.playerId, context.locationId, count, context.bid).usableSlotIndexes,
  blockedReason: (context) => deploymentSlots(context.state, context.playerId, context.locationId, 5, context.bid).blockedReason ?? '',
});
