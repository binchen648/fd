import type { GameState } from '../schema/game';
import type { PendingOpponentCloseToOne } from './types';

/**
 * Server-only authority for the exact FB2-49 compound transaction.
 * This intentionally lives outside GameState/AbilityRuntime so forged or stale serialized
 * queue/interaction metadata cannot rewrite the originally frozen continuation.
 */
export interface OpponentCloseToOneServerAuthoritySnapshot {
  nextIndex: number;
  entries: PendingOpponentCloseToOne[];
}

const authorityByState = new WeakMap<GameState, OpponentCloseToOneServerAuthoritySnapshot>();

function cloneAuthority(value: OpponentCloseToOneServerAuthoritySnapshot): OpponentCloseToOneServerAuthoritySnapshot {
  return structuredClone(value);
}

export function installOpponentCloseToOneServerAuthority(
  state: GameState,
  entries: PendingOpponentCloseToOne[],
): void {
  if (entries.length === 0) {
    authorityByState.delete(state);
    return;
  }
  authorityByState.set(state, { nextIndex: 0, entries: structuredClone(entries) });
}

export function getOpponentCloseToOneServerAuthority(
  state: GameState,
): OpponentCloseToOneServerAuthoritySnapshot | undefined {
  return authorityByState.get(state);
}

export function advanceOpponentCloseToOneServerAuthority(state: GameState): void {
  const authority = authorityByState.get(state);
  if (!authority) return;
  authority.nextIndex += 1;
  if (authority.nextIndex >= authority.entries.length) authorityByState.delete(state);
}

export function clearOpponentCloseToOneServerAuthority(state: GameState): void {
  authorityByState.delete(state);
}

/** Copy hidden authority alongside the interpreter's transactional GameState clone. */
export function copyOpponentCloseToOneServerAuthority(from: GameState, to: GameState): void {
  const authority = authorityByState.get(from);
  if (authority) authorityByState.set(to, cloneAuthority(authority));
  else authorityByState.delete(to);
}

/** Trusted server persistence hook; never included in player GameState/projection. */
export function exportOpponentCloseToOneServerAuthority(
  state: GameState,
): OpponentCloseToOneServerAuthoritySnapshot | undefined {
  const authority = authorityByState.get(state);
  return authority ? cloneAuthority(authority) : undefined;
}

/** Trusted server restore hook paired with exportOpponentCloseToOneServerAuthority. */
export function restoreOpponentCloseToOneServerAuthority(
  state: GameState,
  snapshot: OpponentCloseToOneServerAuthoritySnapshot | undefined,
): void {
  if (snapshot) authorityByState.set(state, cloneAuthority(snapshot));
  else authorityByState.delete(state);
}
