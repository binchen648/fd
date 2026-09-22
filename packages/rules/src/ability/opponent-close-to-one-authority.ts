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
  checkpointId: string | null;
  stateBinding: string;
  authority: OpponentCloseToOneServerAuthoritySnapshot;
  mac: string;
}

export interface OpponentCloseToOneReplayManifestEntry {
  checkpointId: string;
  checkpointDigest: string;
}

/** Host-authenticated replay lineage; the sealing secret and room scope remain outside snapshots. */
export interface OpponentCloseToOneReplayManifestSeal {
  version: 1;
  stateBinding: string;
  checkpoints: OpponentCloseToOneReplayManifestEntry[];
  mac: string;
}

const AUTHORITY_SECRET_PREFIX = 'fb2-49-persistence-secret:';
const AUTHORITY_SCOPE_PREFIX = 'fb2-49-persistence-scope:';
const AUTHORITY_TRANSACTION_PREFIX = 'fb2-49-transaction:';
const AUTHORITY_BROWSER_STORAGE_KEY = 'fd.rules.fb2-49.persistence-secret.v1';
const AUTHORITY_BROWSER_SCOPE_KEY_PREFIX = 'fd.rules.fb2-49.persistence-scope.v1:';
const AUTHORITY_BROWSER_TRANSACTION_KEY_PREFIX = 'fd.rules.fb2-49.transaction.v1:';
const AUTHORITY_BROWSER_REPLAY_TRANSACTION_KEY_PREFIX = 'fd.rules.fb2-49.replay-transactions.v1:';
const AUTHORITY_BROWSER_REPLAY_LINEAGE_KEY_PREFIX = 'fd.rules.fb2-49.replay-lineages.v1:';
const processPersistenceScopeByRoomKey = new Map<string, string>();
const processTransactionByScope = new Map<string, string>();
interface TrustedReplayBinding {
  transactionId: string | null;
  checkpointDigest: string;
}
const processReplayTransactionsByScope = new Map<string, Map<string, TrustedReplayBinding>>();
const processReplayLineagesByScope = new Map<string, Set<string>>();
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

function sealPayload(
  persistenceScope: string,
  transactionId: string,
  checkpointId: string | null,
  stateHash: string,
  authority: OpponentCloseToOneServerAuthoritySnapshot,
): string {
  return JSON.stringify({
    version: 1,
    persistenceScope,
    transactionId,
    checkpointId,
    stateBinding: stateHash,
    authority: normalizedAuthority(authority),
  });
}

function isCheckpointId(value: unknown): value is string {
  return typeof value === 'string' && /^checkpoint:\d+$/.test(value);
}

function isReplayManifestEntry(value: unknown): value is OpponentCloseToOneReplayManifestEntry {
  return isPlainRecord(value) && exactKeys(value, ['checkpointId', 'checkpointDigest']) &&
    isCheckpointId(value.checkpointId) && typeof value.checkpointDigest === 'string' && /^[0-9a-f]{64}$/.test(value.checkpointDigest);
}

function isExactReplayManifestEntries(value: unknown): value is OpponentCloseToOneReplayManifestEntry[] {
  return Array.isArray(value) && value.every(isReplayManifestEntry) &&
    new Set(value.map((entry) => entry.checkpointId)).size === value.length;
}

function replayManifestPayload(
  persistenceScope: string,
  stateHash: string,
  checkpoints: readonly OpponentCloseToOneReplayManifestEntry[],
): string {
  return JSON.stringify({ version: 1, persistenceScope, stateBinding: stateHash, checkpoints: checkpoints.map((entry) => ({ ...entry })) });
}

function isExactAuthoritySeal(value: unknown): value is OpponentCloseToOneServerAuthoritySeal {
  return isPlainRecord(value) && exactKeys(value, ['version', 'transactionId', 'checkpointId', 'stateBinding', 'authority', 'mac']) && value.version === 1 &&
    typeof value.transactionId === 'string' && /^fb2-49-transaction:[0-9a-f]{64}$/.test(value.transactionId) &&
    (value.checkpointId === null || isCheckpointId(value.checkpointId)) &&
    typeof value.stateBinding === 'string' && /^[0-9a-f]{64}$/.test(value.stateBinding) &&
    typeof value.mac === 'string' && /^[0-9a-f]{64}$/.test(value.mac) && isExactAuthoritySnapshot(value.authority);
}

function isExactReplayManifestSeal(value: unknown): value is OpponentCloseToOneReplayManifestSeal {
  return isPlainRecord(value) && exactKeys(value, ['version', 'stateBinding', 'checkpoints', 'mac']) && value.version === 1 &&
    typeof value.stateBinding === 'string' && /^[0-9a-f]{64}$/.test(value.stateBinding) &&
    isExactReplayManifestEntries(value.checkpoints) &&
    typeof value.mac === 'string' && /^[0-9a-f]{64}$/.test(value.mac);
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
      processPersistenceScopeByRoomKey.set(roomKey, created);
      return created;
    } catch {
      // Fall through to process-local host state when browser storage is unavailable.
    }
  }
  const existing = processPersistenceScopeByRoomKey.get(roomKey);
  if (existing) return existing;
  const created = createOpponentCloseToOnePersistenceScope();
  processPersistenceScopeByRoomKey.set(roomKey, created);
  return created;
}

/** Start a fresh room lifecycle even when the public room id is reused. */
export function rotateOpponentCloseToOnePersistenceScope(roomKey: string): string {
  if (!roomKey) throw new Error('FB2-49 persistence scope requires a non-empty room key');
  const created = createOpponentCloseToOnePersistenceScope();
  processPersistenceScopeByRoomKey.set(roomKey, created);
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      const key = AUTHORITY_BROWSER_SCOPE_KEY_PREFIX + sha256Hex(roomKey);
      storage.setItem(key, created);
    } catch {
      // Process-local lifecycle identity remains authoritative for this host session.
    }
  }
  return created;
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

function clearTrustedTransactionForScope(persistenceScope: string): void {
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      storage.setItem(transactionStorageKey(persistenceScope), '');
    } catch {
      // Process-private trust is still cleared below.
    }
  }
  processTransactionByScope.delete(persistenceScope);
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

function replayLineagesStorageKey(persistenceScope: string): string {
  return AUTHORITY_BROWSER_REPLAY_LINEAGE_KEY_PREFIX + sha256Hex(persistenceScope);
}

function replayLineageDigest(
  persistenceScope: string,
  state: GameState,
  checkpoints: readonly OpponentCloseToOneReplayManifestEntry[],
): string {
  return sha256Hex(replayManifestPayload(persistenceScope, stateBinding(state), checkpoints));
}

function readBrowserReplayLineages(persistenceScope: string): string[] {
  const storage = browserPersistenceStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(replayLineagesStorageKey(persistenceScope));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value));
  } catch {
    return [];
  }
}

function isTrustedReplayBinding(value: unknown): value is TrustedReplayBinding {
  return isPlainRecord(value) && exactKeys(value, ['transactionId', 'checkpointDigest']) &&
    (value.transactionId === null ||
      (typeof value.transactionId === 'string' && /^fb2-49-transaction:[0-9a-f]{64}$/.test(value.transactionId))) &&
    typeof value.checkpointDigest === 'string' && /^[0-9a-f]{64}$/.test(value.checkpointDigest);
}

function readBrowserReplayTransactions(persistenceScope: string): Record<string, TrustedReplayBinding> {
  const storage = browserPersistenceStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(replayTransactionsStorageKey(persistenceScope));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainRecord(parsed)) return {};
    const bindings: Record<string, TrustedReplayBinding> = {};
    for (const [checkpointId, binding] of Object.entries(parsed)) {
      if (isCheckpointId(checkpointId) && isTrustedReplayBinding(binding)) bindings[checkpointId] = binding;
    }
    return bindings;
  } catch {
    return {};
  }
}

function rememberTrustedReplayTransaction(persistenceScope: string, checkpointId: string, binding: TrustedReplayBinding): void {
  if (!isCheckpointId(checkpointId)) throw new Error('Invalid FB2-49 replay checkpoint id');
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      const bindings = readBrowserReplayTransactions(persistenceScope);
      bindings[checkpointId] = binding;
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
  bindings.set(checkpointId, binding);
}

function trustedReplayTransaction(persistenceScope: string, checkpointId: string): TrustedReplayBinding | undefined {
  const storage = browserPersistenceStorage();
  if (storage) {
    const value = readBrowserReplayTransactions(persistenceScope)[checkpointId];
    if (value) return value;
  }
  return processReplayTransactionsByScope.get(persistenceScope)?.get(checkpointId);
}

export function hasOpponentCloseToOneTrustedReplayAuthority(
  persistenceScope: string,
  checkpointIds: readonly string[],
): boolean {
  return checkpointIds.some((checkpointId) =>
    isCheckpointId(checkpointId) && trustedReplayTransaction(persistenceScope, checkpointId)?.transactionId !== null &&
    trustedReplayTransaction(persistenceScope, checkpointId)?.transactionId !== undefined);
}

export function verifyOpponentCloseToOneTrustedReplayCheckpoints(
  persistenceScope: string,
  checkpoints: readonly OpponentCloseToOneReplayManifestEntry[],
): boolean {
  for (const checkpoint of checkpoints) {
    if (!isReplayManifestEntry(checkpoint)) return false;
    const trusted = trustedReplayTransaction(persistenceScope, checkpoint.checkpointId);
    if (trusted && trusted.checkpointDigest !== checkpoint.checkpointDigest) return false;
  }
  return true;
}

export function hasOpponentCloseToOneOmittedTrustedReplayAuthority(
  persistenceScope: string,
  checkpointIds: readonly string[],
): boolean {
  const supplied = new Set(checkpointIds);
  const browserBindings = readBrowserReplayTransactions(persistenceScope);
  if (Object.entries(browserBindings).some(([checkpointId, binding]) =>
    !supplied.has(checkpointId) && binding.transactionId !== null)) return true;
  const processBindings = processReplayTransactionsByScope.get(persistenceScope);
  return Boolean(processBindings && [...processBindings.entries()].some(([checkpointId, binding]) =>
    !supplied.has(checkpointId) && binding.transactionId !== null));
}

export function rememberOpponentCloseToOneTrustedReplayLineage(
  persistenceScope: string,
  state: GameState,
  checkpoints: readonly OpponentCloseToOneReplayManifestEntry[],
): void {
  if (!isOpponentCloseToOnePersistenceScope(persistenceScope) || !isExactReplayManifestEntries(checkpoints)) return;
  const digest = replayLineageDigest(persistenceScope, state, checkpoints);
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      const lineages = readBrowserReplayLineages(persistenceScope).filter((value) => value !== digest);
      lineages.push(digest);
      storage.setItem(replayLineagesStorageKey(persistenceScope), JSON.stringify(lineages.slice(-128)));
    } catch {
      // Process-private lineage is recorded below as well.
    }
  }
  let lineages = processReplayLineagesByScope.get(persistenceScope);
  if (!lineages) {
    lineages = new Set<string>();
    processReplayLineagesByScope.set(persistenceScope, lineages);
  }
  lineages.delete(digest);
  lineages.add(digest);
  while (lineages.size > 128) lineages.delete(lineages.values().next().value!);
}

export function verifyOpponentCloseToOneTrustedReplayLineage(
  persistenceScope: string,
  state: GameState,
  checkpoints: readonly OpponentCloseToOneReplayManifestEntry[],
): boolean {
  if (!isOpponentCloseToOnePersistenceScope(persistenceScope) || !isExactReplayManifestEntries(checkpoints)) return false;
  const digest = replayLineageDigest(persistenceScope, state, checkpoints);
  if (readBrowserReplayLineages(persistenceScope).includes(digest)) return true;
  return processReplayLineagesByScope.get(persistenceScope)?.has(digest) === true;
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

/** Revoke all current and replay trust owned by one authoritative room/match scope. */
export function revokeOpponentCloseToOnePersistenceTrust(persistenceScope: string): void {
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      storage.setItem(transactionStorageKey(persistenceScope), '');
      storage.setItem(replayTransactionsStorageKey(persistenceScope), '{}');
      storage.setItem(replayLineagesStorageKey(persistenceScope), '[]');
    } catch {
      // Process-private trust is still revoked below.
    }
  }
  processTransactionByScope.delete(persistenceScope);
  processReplayTransactionsByScope.delete(persistenceScope);
  processReplayLineagesByScope.delete(persistenceScope);
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
  const normalized = normalizedAuthority(record.authority);
  const binding = stateBinding(state);
  const checkpointId = replayCheckpointId ?? null;
  const payload = sealPayload(persistenceScope, record.transactionId, checkpointId, binding, normalized);
  return {
    version: 1,
    transactionId: record.transactionId,
    checkpointId,
    stateBinding: binding,
    authority: normalized,
    mac: hmacSha256Hex(persistenceSecret, payload),
  };
}

export function persistOpponentCloseToOneReplayManifest(
  state: GameState,
  checkpoints: readonly OpponentCloseToOneReplayManifestEntry[],
  persistenceSecret: string,
  persistenceScope: string,
): OpponentCloseToOneReplayManifestSeal {
  if (!isOpponentCloseToOnePersistenceSecret(persistenceSecret)) throw new Error('Invalid FB2-49 persistence sealing secret');
  if (!isOpponentCloseToOnePersistenceScope(persistenceScope)) throw new Error('Invalid FB2-49 persistence scope');
  if (!isExactReplayManifestEntries(checkpoints)) throw new Error('Invalid FB2-49 replay checkpoint lineage');
  const binding = stateBinding(state);
  const normalized = checkpoints.map((entry) => ({ ...entry }));
  return {
    version: 1,
    stateBinding: binding,
    checkpoints: normalized,
    mac: hmacSha256Hex(persistenceSecret, replayManifestPayload(persistenceScope, binding, normalized)),
  };
}

export function verifyOpponentCloseToOneReplayManifest(
  state: GameState,
  checkpoints: readonly OpponentCloseToOneReplayManifestEntry[],
  seal: unknown,
  persistenceSecret: string,
  persistenceScope: string,
): boolean {
  if (!isOpponentCloseToOnePersistenceSecret(persistenceSecret) ||
      !isOpponentCloseToOnePersistenceScope(persistenceScope) || !isExactReplayManifestSeal(seal) ||
      !isExactReplayManifestEntries(checkpoints)) return false;
  if (seal.checkpoints.length !== checkpoints.length ||
      !seal.checkpoints.every((entry, index) => entry.checkpointId === checkpoints[index]?.checkpointId &&
        entry.checkpointDigest === checkpoints[index]?.checkpointDigest)) return false;
  const binding = stateBinding(state);
  if (seal.stateBinding !== binding) return false;
  return seal.mac === hmacSha256Hex(
    persistenceSecret,
    replayManifestPayload(persistenceScope, binding, checkpoints),
  );
}

export function rememberOpponentCloseToOneTrustedReplayCheckpoint(
  persistenceScope: string,
  checkpointId: string,
  checkpointDigest: string,
  seal: unknown,
): void {
  if (!isCheckpointId(checkpointId) || !/^[0-9a-f]{64}$/.test(checkpointDigest)) return;
  if (seal === undefined) {
    rememberTrustedReplayTransaction(persistenceScope, checkpointId, { transactionId: null, checkpointDigest });
    return;
  }
  if (!isExactAuthoritySeal(seal) || seal.checkpointId !== checkpointId) return;
  rememberTrustedReplayTransaction(persistenceScope, checkpointId, { transactionId: seal.transactionId, checkpointDigest });
}

export function synchronizeOpponentCloseToOneTrustedReplayCheckpoints(
  persistenceScope: string,
  checkpoints: readonly { checkpointId: string; checkpointDigest: string; seal?: unknown }[],
): void {
  const next: Record<string, TrustedReplayBinding> = {};
  for (const checkpoint of checkpoints) {
    if (!isCheckpointId(checkpoint.checkpointId) || !/^[0-9a-f]{64}$/.test(checkpoint.checkpointDigest)) continue;
    if (checkpoint.seal === undefined) {
      next[checkpoint.checkpointId] = { transactionId: null, checkpointDigest: checkpoint.checkpointDigest };
      continue;
    }
    if (!isExactAuthoritySeal(checkpoint.seal) || checkpoint.seal.checkpointId !== checkpoint.checkpointId) continue;
    next[checkpoint.checkpointId] = { transactionId: checkpoint.seal.transactionId, checkpointDigest: checkpoint.checkpointDigest };
  }
  const storage = browserPersistenceStorage();
  if (storage) {
    try {
      storage.setItem(replayTransactionsStorageKey(persistenceScope), JSON.stringify(next));
    } catch {
      // Process-private trust is synchronized below as well.
    }
  }
  if (Object.keys(next).length === 0) processReplayTransactionsByScope.delete(persistenceScope);
  else processReplayTransactionsByScope.set(persistenceScope, new Map(Object.entries(next)));
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
  replayCheckpointDigest?: string,
): boolean {
  const trustedReplay = replayCheckpointId
    ? trustedReplayTransaction(persistenceScope, replayCheckpointId)
    : undefined;
  if (replayCheckpointId && trustedReplay && trustedReplay.checkpointDigest !== replayCheckpointDigest) return false;
  const trustedTransaction = trustedReplay?.transactionId ??
    (replayCheckpointId ? undefined : trustedTransactionForScope(persistenceScope));
  if (seal === undefined) {
    if (trustedTransaction || hasSerializedLiveOpponentCloseToOneTransaction(state)) return false;
    authorityByState.delete(state);
    return true;
  }
  if (!isOpponentCloseToOnePersistenceSecret(persistenceSecret) ||
      !isOpponentCloseToOnePersistenceScope(persistenceScope) || !isExactAuthoritySeal(seal)) return false;
  if (seal.checkpointId !== (replayCheckpointId ?? null)) return false;
  if (trustedTransaction !== seal.transactionId) return false;
  const binding = stateBinding(state);
  if (seal.stateBinding !== binding) return false;
  const authority = normalizedAuthority(seal.authority);
  const expectedMac = hmacSha256Hex(
    persistenceSecret,
    sealPayload(persistenceScope, seal.transactionId, seal.checkpointId, binding, authority),
  );
  if (seal.mac !== expectedMac) return false;
  authorityByState.set(state, { authority: cloneAuthority(authority), transactionId: seal.transactionId, persistenceScope });
  return true;
}

/** Make the committed replay state the exact current trust owner for this scope. */
export function synchronizeOpponentCloseToOneCurrentTrust(state: GameState, persistenceScope: string): void {
  clearTrustedTransactionForScope(persistenceScope);
  const record = authorityByState.get(state);
  if (!record) return;
  record.persistenceScope = persistenceScope;
  rememberTrustedTransaction(persistenceScope, record.transactionId);
}
