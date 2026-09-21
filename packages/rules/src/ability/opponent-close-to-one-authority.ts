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
  transactionId: string;
  stateBinding: string;
  authority: OpponentCloseToOneServerAuthoritySnapshot;
  mac: string;
}

const AUTHORITY_SECRET_PREFIX = 'fb2-49-persistence-secret:';
const AUTHORITY_SCOPE_PREFIX = 'fb2-49-persistence-scope:';
const AUTHORITY_TRANSACTION_PREFIX = 'fb2-49-transaction:';
const AUTHORITY_BROWSER_STORAGE_KEY = 'fd.rules.fb2-49.persistence-secret.v1';
const AUTHORITY_BROWSER_SCOPE_KEY_PREFIX = 'fd.rules.fb2-49.persistence-scope.v1:';
const AUTHORITY_BROWSER_TRANSACTION_KEY_PREFIX = 'fd.rules.fb2-49.transaction.v1:';
const AUTHORITY_BROWSER_REPLAY_TRANSACTION_KEY_PREFIX = 'fd.rules.fb2-49.replay-transactions.v1:';
const processTransactionByScope = new Map<string, string>();
const processReplayTransactionsByScope = new Map<string, Map<string, string>>();
interface OpponentCloseToOneServerAuthorityRecord {
  authority: OpponentCloseToOneServerAuthoritySnapshot;
  transactionId: string;
  persistenceScope?: string;
}
const authorityByState = new WeakMap<GameState, OpponentCloseToOneServerAuthorityRecord>();
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

function sealPayload(persistenceScope: string, transactionId: string, stateHash: string, authority: OpponentCloseToOneServerAuthoritySnapshot): string {
  return JSON.stringify({ version: 1, persistenceScope, transactionId, stateBinding: stateHash, authority: normalizedAuthority(authority) });
}

function isExactAuthoritySeal(value: unknown): value is OpponentCloseToOneServerAuthoritySeal {
  return isPlainRecord(value) && exactKeys(value, ['version', 'transactionId', 'stateBinding', 'authority', 'mac']) && value.version === 1 &&
    typeof value.transactionId === 'string' && /^fb2-49-transaction:[0-9a-f]{64}$/.test(value.transactionId) &&
    typeof value.stateBinding === 'string' && /^[0-9a-f]{64}$/.test(value.stateBinding) &&
    typeof value.mac === 'string' && /^[0-9a-f]{64}$/.test(value.mac) && isExactAuthoritySnapshot(value.authority);
}

function randomAuthorityHex(prefix: string): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error('Secure random source unavailable for FB2-49 persistence sealing');
  const bytes = new Uint8Array(32);
  cryptoApi.getRandomValues(bytes);
  return prefix + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function createOpponentCloseToOnePersistenceSecret(): string {
  return randomAuthorityHex(AUTHORITY_SECRET_PREFIX);
}

export function isOpponentCloseToOnePersistenceSecret(value: unknown): value is string {
  return typeof value === 'string' && /^fb2-49-persistence-secret:[0-9a-f]{64}$/.test(value);
}

export function createOpponentCloseToOnePersistenceScope(): string {
  return randomAuthorityHex(AUTHORITY_SCOPE_PREFIX);
}

export function isOpponentCloseToOnePersistenceScope(value: unknown): value is string {
  return typeof value === 'string' && /^fb2-49-persistence-scope:[0-9a-f]{64}$/.test(value);
}

/**
 * Room/match scope is host-owned and never serialized into a room/session snapshot. Browser
 * local-mode persists the scope under a separate host key so a page reload can resume the same
 * room while an equal-state snapshot from a different room receives a different trusted scope.
 */
export function resolveOpponentCloseToOnePersistenceScope(roomKey: string): string {
  if (!roomKey) throw new Error('FB2-49 persistence scope requires a non-empty room key');
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      const key = AUTHORITY_BROWSER_SCOPE_KEY_PREFIX + sha256Hex(roomKey);
      const existing = storage.getItem(key);
      if (isOpponentCloseToOnePersistenceScope(existing)) return existing;
      const created = createOpponentCloseToOnePersistenceScope();
      storage.setItem(key, created);
      return created;
    } catch {
      // Fall through to an in-memory scope when browser host storage is unavailable.
    }
  }
  return createOpponentCloseToOnePersistenceScope();
}

function transactionStorageKey(persistenceScope: string): string {
  return AUTHORITY_BROWSER_TRANSACTION_KEY_PREFIX + sha256Hex(persistenceScope);
}

function rememberTrustedTransaction(persistenceScope: string, transactionId: string): void {
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      storage.setItem(transactionStorageKey(persistenceScope), transactionId);
      return;
    } catch {
      // Fall through to process-private binding when host storage is unavailable.
    }
  }
  processTransactionByScope.set(persistenceScope, transactionId);
}

function trustedTransactionForScope(persistenceScope: string): string | undefined {
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      const value = storage.getItem(transactionStorageKey(persistenceScope));
      if (typeof value === 'string' && /^fb2-49-transaction:[0-9a-f]{64}$/.test(value)) return value;
    } catch {
      // Fall through to process-private binding when host storage is unavailable.
    }
  }
  return processTransactionByScope.get(persistenceScope);
}

function forgetTrustedTransaction(persistenceScope: string | undefined, transactionId: string): void {
  if (!persistenceScope) return;
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      const key = transactionStorageKey(persistenceScope);
      if (storage.getItem(key) === transactionId) storage.setItem(key, '');
    } catch {
      // Also clear process-private fallback below.
    }
  }
  if (processTransactionByScope.get(persistenceScope) === transactionId) processTransactionByScope.delete(persistenceScope);
}

function replayTransactionsStorageKey(persistenceScope: string): string {
  return AUTHORITY_BROWSER_REPLAY_TRANSACTION_KEY_PREFIX + sha256Hex(persistenceScope);
}

function readBrowserReplayTransactions(persistenceScope: string): Record<string, string> {
  const storage = browserPersistenceStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(replayTransactionsStorageKey(persistenceScope));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainRecord(parsed)) return {};
    const bindings: Record<string, string> = {};
    for (const [checkpointId, transactionId] of Object.entries(parsed)) {
      if (/^checkpoint:\d+$/.test(checkpointId) && typeof transactionId === 'string' && /^fb2-49-transaction:[0-9a-f]{64}$/.test(transactionId)) {
        bindings[checkpointId] = transactionId;
      }
    }
    return bindings;
  } catch {
    return {};
  }
}

function rememberTrustedReplayTransaction(persistenceScope: string, checkpointId: string, transactionId: string): void {
  if (!/^checkpoint:\d+$/.test(checkpointId)) throw new Error('Invalid FB2-49 replay checkpoint id');
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      const bindings = readBrowserReplayTransactions(persistenceScope);
      bindings[checkpointId] = transactionId;
      storage.setItem(replayTransactionsStorageKey(persistenceScope), JSON.stringify(bindings));
      return;
    } catch {
      // Fall through to process-private replay binding.
    }
  }
  let bindings = processReplayTransactionsByScope.get(persistenceScope);
  if (!bindings) {
    bindings = new Map();
    processReplayTransactionsByScope.set(persistenceScope, bindings);
  }
  bindings.set(checkpointId, transactionId);
}

function trustedReplayTransaction(persistenceScope: string, checkpointId: string): string | undefined {
  const storage = browserPersistenceStorage();
  if (storage) {
    const value = readBrowserReplayTransactions(persistenceScope)[checkpointId];
    if (value) return value;
  }
  return processReplayTransactionsByScope.get(persistenceScope)?.get(checkpointId);
}

export function pruneOpponentCloseToOneTrustedReplayTransactions(
  persistenceScope: string,
  checkpointIds: readonly string[],
): void {
  const keep = new Set(checkpointIds);
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      const bindings = readBrowserReplayTransactions(persistenceScope);
      const pruned = Object.fromEntries(Object.entries(bindings).filter(([checkpointId]) => keep.has(checkpointId)));
      storage.setItem(replayTransactionsStorageKey(persistenceScope), JSON.stringify(pruned));
    } catch {
      // Process-private fallback is pruned below as well.
    }
  }
  const processBindings = processReplayTransactionsByScope.get(persistenceScope);
  if (processBindings) {
    for (const checkpointId of processBindings.keys()) if (!keep.has(checkpointId)) processBindings.delete(checkpointId);
    if (processBindings.size === 0) processReplayTransactionsByScope.delete(persistenceScope);
  }
}

/** Release all host-owned FB2-49 trust when its authoritative room scope is removed. */
export function revokeOpponentCloseToOnePersistenceScope(persistenceScope: string): void {
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      storage.setItem(transactionStorageKey(persistenceScope), '');
      storage.setItem(replayTransactionsStorageKey(persistenceScope), '{}');
    } catch {
      // Process-private trust is still revoked below.
    }
  }
  processTransactionByScope.delete(persistenceScope);
  processReplayTransactionsByScope.delete(persistenceScope);
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

export function hasSerializedLiveOpponentCloseToOneTransaction(state: GameState): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return false;
  const queue: unknown = runtime.pendingOpponentCloseToOne;
  if (queue !== undefined && (!Array.isArray(queue) || queue.length > 0)) return true;
  const interaction: unknown = runtime.pendingDecision?.interaction;
  return isPlainRecord(interaction) && interaction.kind === 'opponent_close_non_residual_to_one_v1';
}

export function installOpponentCloseToOneServerAuthority(state: GameState, entries: PendingOpponentCloseToOne[]): void {
  if (entries.length === 0) {
    authorityByState.delete(state);
    return;
  }
  authorityByState.set(state, {
    authority: { nextIndex: 0, entries: structuredClone(entries) },
    transactionId: randomAuthorityHex(AUTHORITY_TRANSACTION_PREFIX),
  });
}

export function getOpponentCloseToOneServerAuthority(state: GameState): OpponentCloseToOneServerAuthoritySnapshot | undefined {
  return authorityByState.get(state)?.authority;
}

export function advanceOpponentCloseToOneServerAuthority(state: GameState): void {
  const record = authorityByState.get(state);
  if (!record) return;
  record.authority.nextIndex += 1;
  if (record.authority.nextIndex >= record.authority.entries.length) {
    forgetTrustedTransaction(record.persistenceScope, record.transactionId);
    authorityByState.delete(state);
  }
}

export function clearOpponentCloseToOneServerAuthority(state: GameState): void {
  const record = authorityByState.get(state);
  if (record) forgetTrustedTransaction(record.persistenceScope, record.transactionId);
  authorityByState.delete(state);
}

/** Copy hidden live authority alongside the interpreter's transactional GameState clone. */
export function copyOpponentCloseToOneServerAuthority(from: GameState, to: GameState): void {
  const record = authorityByState.get(from);
  if (record) authorityByState.set(to, { authority: cloneAuthority(record.authority), transactionId: record.transactionId, ...(record.persistenceScope ? { persistenceScope: record.persistenceScope } : {}) });
  else authorityByState.delete(to);
}

/** Internal inspection helper; never projects authority through a player view. */
export function exportOpponentCloseToOneServerAuthority(state: GameState): OpponentCloseToOneServerAuthoritySnapshot | undefined {
  const record = authorityByState.get(state);
  return record ? cloneAuthority(record.authority) : undefined;
}

/** Seal authority for durable persistence without any process-local authority-token registry. */
export function persistOpponentCloseToOneServerAuthority(
  state: GameState,
  persistenceSecret: string,
  persistenceScope: string,
  replayCheckpointId?: string,
): OpponentCloseToOneServerAuthoritySeal | undefined {
  const record = authorityByState.get(state);
  if (!record) return undefined;
  if (!isOpponentCloseToOnePersistenceSecret(persistenceSecret)) throw new Error('Invalid FB2-49 persistence sealing secret');
  if (!isOpponentCloseToOnePersistenceScope(persistenceScope)) throw new Error('Invalid FB2-49 persistence scope');
  if (record.persistenceScope && record.persistenceScope !== persistenceScope) throw new Error('FB2-49 authority scope changed during transaction');
  record.persistenceScope = persistenceScope;
  rememberTrustedTransaction(persistenceScope, record.transactionId);
  if (replayCheckpointId) rememberTrustedReplayTransaction(persistenceScope, replayCheckpointId, record.transactionId);
  const normalized = normalizedAuthority(record.authority);
  const binding = stateBinding(state);
  const payload = sealPayload(persistenceScope, record.transactionId, binding, normalized);
  return {
    version: 1,
    transactionId: record.transactionId,
    stateBinding: binding,
    authority: normalized,
    mac: hmacSha256Hex(persistenceSecret, payload),
  };
}

/**
 * Restore only from an authenticated durable seal. Invalid/missing seals never mutate existing
 * hidden authority. A serialized live FB2-49 transaction requires a valid seal at this boundary.
 */
export function restoreOpponentCloseToOneServerAuthority(
  state: GameState,
  seal: unknown,
  persistenceSecret: string,
  persistenceScope: string,
  replayCheckpointId?: string,
): boolean {
  const trustedTransaction = replayCheckpointId
    ? trustedReplayTransaction(persistenceScope, replayCheckpointId)
    : trustedTransactionForScope(persistenceScope);
  if (seal === undefined) {
    if (trustedTransaction || hasSerializedLiveOpponentCloseToOneTransaction(state)) return false;
    authorityByState.delete(state);
    return true;
  }
  if (!isOpponentCloseToOnePersistenceSecret(persistenceSecret) ||
      !isOpponentCloseToOnePersistenceScope(persistenceScope) || !isExactAuthoritySeal(seal)) return false;
  if (trustedTransaction !== seal.transactionId) return false;
  const binding = stateBinding(state);
  if (seal.stateBinding !== binding) return false;
  const authority = normalizedAuthority(seal.authority);
  const expectedMac = hmacSha256Hex(
    persistenceSecret,
    sealPayload(persistenceScope, seal.transactionId, binding, authority),
  );
  if (seal.mac !== expectedMac) return false;
  authorityByState.set(state, { authority: cloneAuthority(authority), transactionId: seal.transactionId, persistenceScope });
  return true;
}
