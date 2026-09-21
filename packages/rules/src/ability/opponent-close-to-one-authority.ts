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

/**
 * Serialized snapshots carry only this opaque server-issued capability. The frozen
 * authority itself never crosses the client-controlled persistence boundary.
 */
export interface OpponentCloseToOneServerAuthorityHandle {
  token: string;
}

const AUTHORITY_TOKEN_PREFIX = 'fb2-49-authority:';
const authorityByState = new WeakMap<GameState, OpponentCloseToOneServerAuthoritySnapshot>();
interface PersistedOpponentCloseToOneAuthorityRecord {
  authority: OpponentCloseToOneServerAuthoritySnapshot;
  stateBinding: string;
}
const persistedAuthorityByToken = new Map<string, PersistedOpponentCloseToOneAuthorityRecord>();

function exactStateBinding(state: GameState): string {
  // This string never leaves the server registry. Exact JSON equality is deliberately
  // stricter than semantic equality: any client-side snapshot rewrite invalidates the
  // capability instead of being normalized back into a trusted transaction.
  return JSON.stringify(state);
}

function createAuthorityToken(): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error('Secure random source unavailable for FB2-49 authority persistence');
  const bytes = new Uint8Array(24);
  cryptoApi.getRandomValues(bytes);
  return AUTHORITY_TOKEN_PREFIX + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function isExactAuthorityHandle(value: unknown): value is OpponentCloseToOneServerAuthorityHandle {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 1 && Object.prototype.hasOwnProperty.call(record, 'token') &&
    typeof record.token === 'string' && /^fb2-49-authority:[0-9a-f]{48}$/.test(record.token);
}

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

/** Internal inspection helper; never serialize this object across an untrusted boundary. */
export function exportOpponentCloseToOneServerAuthority(
  state: GameState,
): OpponentCloseToOneServerAuthoritySnapshot | undefined {
  const authority = authorityByState.get(state);
  return authority ? cloneAuthority(authority) : undefined;
}

/**
 * Persist only an opaque capability. The registry value remains server-private, so a
 * forged MatchSessionSnapshot cannot rewrite the authority it is meant to be checked against.
 */
export function persistOpponentCloseToOneServerAuthority(
  state: GameState,
): OpponentCloseToOneServerAuthorityHandle | undefined {
  const authority = authorityByState.get(state);
  if (!authority) return undefined;
  const token = createAuthorityToken();
  persistedAuthorityByToken.set(token, {
    authority: cloneAuthority(authority),
    stateBinding: exactStateBinding(state),
  });
  return { token };
}

/**
 * Restore only from a server-issued opaque capability. Invalid/missing/expired handles
 * never install attacker-controlled authority; pending FB2-49 settlement then rejects
 * through its ordinary RuleRejection boundary because no matching authority exists.
 */
export function restoreOpponentCloseToOneServerAuthority(
  state: GameState,
  handle: unknown,
): boolean {
  authorityByState.delete(state);
  if (handle === undefined) return true;
  if (!isExactAuthorityHandle(handle)) return false;
  const record = persistedAuthorityByToken.get(handle.token);
  if (!record || record.stateBinding !== exactStateBinding(state)) return false;
  authorityByState.set(state, cloneAuthority(record.authority));
  return true;
}
