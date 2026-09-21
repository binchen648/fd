import type { GameState } from '../schema/game';
import { hmacSha256Hex, sha256Hex } from './portable-sha256';
import type { PendingOpponentCloseToOne } from './types';

/** Server-only live authority for the exact FB2-49 compound transaction. */
export interface OpponentCloseToOneServerAuthoritySnapshot {
  nextIndex: number;
  entries: PendingOpponentCloseToOne[];
}

/** Authenticated durable envelope. The sealing secret is never part of this snapshot. */
export interface OpponentCloseToOneServerAuthoritySeal {
  version: 1;
  stateBinding: string;
  authority: OpponentCloseToOneServerAuthoritySnapshot;
  mac: string;
}

const AUTHORITY_SECRET_PREFIX = 'fb2-49-persistence-secret:';
const AUTHORITY_BROWSER_STORAGE_KEY = 'fd.rules.fb2-49.persistence-secret.v1';
const authorityByState = new WeakMap<GameState, OpponentCloseToOneServerAuthoritySnapshot>();
let processPersistenceSecret: string | undefined;

interface OpponentCloseToOneKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserPersistenceStorage(): OpponentCloseToOneKeyValueStorage | undefined {
  try {
    const candidate = (globalThis as typeof globalThis & { localStorage?: OpponentCloseToOneKeyValueStorage }).localStorage;
    if (!candidate || typeof candidate.getItem !== 'function' || typeof candidate.setItem !== 'function') return undefined;
    return candidate;
  } catch {
    return undefined;
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value).sort();
  const sorted = [...expected].sort();
  return actual.length === sorted.length && actual.every((key, index) => key === sorted[index]);
}

function exactStringList(value: unknown, minimum = 1): value is string[] {
  return Array.isArray(value) && value.length >= minimum && value.every((item) => typeof item === 'string' && item.length > 0) &&
    new Set(value).size === value.length;
}

function isExactOwnerMap(value: unknown, cardIds: string[]): value is Record<string, string> {
  if (!isPlainRecord(value) || !exactKeys(value, cardIds)) return false;
  return cardIds.every((cardId) => typeof value[cardId] === 'string' && (value[cardId] as string).length > 0);
}

function isExactAuthorityEntry(value: unknown): value is PendingOpponentCloseToOne {
  if (!isPlainRecord(value) || !exactKeys(value, [
    'initiatingControllerId', 'decisionPlayerId', 'sourceCardId', 'abilityId', 'battlefieldId',
    'qualifyingCardIds', 'qualifyingCardOwners', 'remainingDecisionPlayerIds',
  ])) return false;
  if (typeof value.initiatingControllerId !== 'string' || !value.initiatingControllerId ||
      typeof value.decisionPlayerId !== 'string' || !value.decisionPlayerId || value.decisionPlayerId === value.initiatingControllerId ||
      typeof value.sourceCardId !== 'string' || !value.sourceCardId || typeof value.abilityId !== 'string' || !value.abilityId ||
      typeof value.battlefieldId !== 'string' || !value.battlefieldId || !exactStringList(value.qualifyingCardIds, 2) ||
      !isExactOwnerMap(value.qualifyingCardOwners, value.qualifyingCardIds) || !exactStringList(value.remainingDecisionPlayerIds)) return false;
  return value.remainingDecisionPlayerIds[0] === value.decisionPlayerId;
}

function isExactAuthoritySnapshot(value: unknown): value is OpponentCloseToOneServerAuthoritySnapshot {
  if (!isPlainRecord(value) || !exactKeys(value, ['nextIndex', 'entries']) ||
      !Number.isSafeInteger(value.nextIndex) || (value.nextIndex as number) < 0 || !Array.isArray(value.entries) || value.entries.length < 1 ||
      !value.entries.every(isExactAuthorityEntry) || (value.nextIndex as number) >= value.entries.length) return false;
  const entries = value.entries as PendingOpponentCloseToOne[];
  const first = entries[0]!;
  const playerIds = entries.map((entry) => entry.decisionPlayerId);
  if (new Set(playerIds).size !== playerIds.length) return false;
  return entries.every((entry, index) =>
    entry.initiatingControllerId === first.initiatingControllerId && entry.sourceCardId === first.sourceCardId &&
    entry.abilityId === first.abilityId && entry.battlefieldId === first.battlefieldId &&
    entry.remainingDecisionPlayerIds.length === playerIds.length - index &&
    entry.remainingDecisionPlayerIds.every((playerId, suffixIndex) => playerId === playerIds[index + suffixIndex]));
}

function normalizedAuthority(value: OpponentCloseToOneServerAuthoritySnapshot): OpponentCloseToOneServerAuthoritySnapshot {
  return {
    nextIndex: value.nextIndex,
    entries: value.entries.map((entry) => ({
      initiatingControllerId: entry.initiatingControllerId,
      decisionPlayerId: entry.decisionPlayerId,
      sourceCardId: entry.sourceCardId,
      abilityId: entry.abilityId,
      battlefieldId: entry.battlefieldId,
      qualifyingCardIds: [...entry.qualifyingCardIds],
      qualifyingCardOwners: Object.fromEntries(entry.qualifyingCardIds.map((cardId) => [cardId, entry.qualifyingCardOwners[cardId]!])),
      remainingDecisionPlayerIds: [...entry.remainingDecisionPlayerIds],
    })),
  };
}

function cloneAuthority(value: OpponentCloseToOneServerAuthoritySnapshot): OpponentCloseToOneServerAuthoritySnapshot {
  return structuredClone(value);
}

function stateBinding(state: GameState): string {
  return sha256Hex(JSON.stringify(state));
}

function sealPayload(stateHash: string, authority: OpponentCloseToOneServerAuthoritySnapshot): string {
  return JSON.stringify({ version: 1, stateBinding: stateHash, authority: normalizedAuthority(authority) });
}

function isExactAuthoritySeal(value: unknown): value is OpponentCloseToOneServerAuthoritySeal {
  return isPlainRecord(value) && exactKeys(value, ['version', 'stateBinding', 'authority', 'mac']) && value.version === 1 &&
    typeof value.stateBinding === 'string' && /^[0-9a-f]{64}$/.test(value.stateBinding) &&
    typeof value.mac === 'string' && /^[0-9a-f]{64}$/.test(value.mac) && isExactAuthoritySnapshot(value.authority);
}

export function createOpponentCloseToOnePersistenceSecret(): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error('Secure random source unavailable for FB2-49 persistence sealing');
  const bytes = new Uint8Array(32);
  cryptoApi.getRandomValues(bytes);
  return AUTHORITY_SECRET_PREFIX + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function isOpponentCloseToOnePersistenceSecret(value: unknown): value is string {
  return typeof value === 'string' && /^fb2-49-persistence-secret:[0-9a-f]{64}$/.test(value);
}
/**
 * Host-owned persistence secret. In the browser it is stored separately from every room
 * snapshot so ordinary save/reload can resume without making the snapshot self-authenticating.
 * Non-browser hosts retain one process-private secret unless an explicit durable secret is injected.
 */
export function resolveOpponentCloseToOnePersistenceSecret(): string {
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      const existing = storage.getItem(AUTHORITY_BROWSER_STORAGE_KEY);
      if (isOpponentCloseToOnePersistenceSecret(existing)) return existing;
      const created = createOpponentCloseToOnePersistenceSecret();
      storage.setItem(AUTHORITY_BROWSER_STORAGE_KEY, created);
      return created;
    } catch {
      // Fall through to process-private authority if host storage is unavailable.
    }
  }
  processPersistenceSecret ??= createOpponentCloseToOnePersistenceSecret();
  return processPersistenceSecret;
}

export function installOpponentCloseToOneServerAuthority(state: GameState, entries: PendingOpponentCloseToOne[]): void {
  if (entries.length === 0) {
    authorityByState.delete(state);
    return;
  }
  authorityByState.set(state, { nextIndex: 0, entries: structuredClone(entries) });
}

export function getOpponentCloseToOneServerAuthority(state: GameState): OpponentCloseToOneServerAuthoritySnapshot | undefined {
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

/** Copy hidden live authority alongside the interpreter's transactional GameState clone. */
export function copyOpponentCloseToOneServerAuthority(from: GameState, to: GameState): void {
  const authority = authorityByState.get(from);
  if (authority) authorityByState.set(to, cloneAuthority(authority));
  else authorityByState.delete(to);
}

/** Internal inspection helper; never projects authority through a player view. */
export function exportOpponentCloseToOneServerAuthority(state: GameState): OpponentCloseToOneServerAuthoritySnapshot | undefined {
  const authority = authorityByState.get(state);
  return authority ? cloneAuthority(authority) : undefined;
}

/** Seal authority for durable persistence without any process-local token registry. */
export function persistOpponentCloseToOneServerAuthority(
  state: GameState,
  persistenceSecret: string,
): OpponentCloseToOneServerAuthoritySeal | undefined {
  const authority = authorityByState.get(state);
  if (!authority) return undefined;
  if (!isOpponentCloseToOnePersistenceSecret(persistenceSecret)) throw new Error('Invalid FB2-49 persistence sealing secret');
  const normalized = normalizedAuthority(authority);
  const binding = stateBinding(state);
  const payload = sealPayload(binding, normalized);
  return { version: 1, stateBinding: binding, authority: normalized, mac: hmacSha256Hex(persistenceSecret, payload) };
}

/**
 * Restore only from an authenticated durable seal. Snapshot-controlled state and authority
 * may be visible, but neither can be rewritten without the separately persisted/server-owned secret.
 */
export function restoreOpponentCloseToOneServerAuthority(
  state: GameState,
  seal: unknown,
  persistenceSecret: string,
): boolean {
  authorityByState.delete(state);
  if (seal === undefined) return true;
  if (!isOpponentCloseToOnePersistenceSecret(persistenceSecret) || !isExactAuthoritySeal(seal)) return false;
  const binding = stateBinding(state);
  if (seal.stateBinding !== binding) return false;
  const authority = normalizedAuthority(seal.authority);
  const expectedMac = hmacSha256Hex(persistenceSecret, sealPayload(binding, authority));
  if (seal.mac !== expectedMac) return false;
  authorityByState.set(state, cloneAuthority(authority));
  return true;
}
