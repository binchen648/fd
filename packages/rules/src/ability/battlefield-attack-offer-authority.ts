import type { GameState } from '../schema/game';
import { hmacSha256Hex, sha256Hex } from './portable-sha256';
import type { BattlefieldAttackOfferSettlement, PendingBattlefieldAttackOfferTransaction } from './types';

export interface BattlefieldAttackOfferParticipationAuthorityRecord {
  playerId: string;
  cardInstanceId: string;
}

export interface BattlefieldAttackOfferTransactionAuthorityRecord {
  transactionId: string;
  controllerId: string;
  sourceCardId: string;
  abilityId: string;
  round: number;
  battlefieldId: string;
  orderPlayerIds: string[];
  nextIndex: number;
  completed: boolean;
  participations: BattlefieldAttackOfferParticipationAuthorityRecord[];
}

export interface BattlefieldAttackOfferServerAuthoritySnapshot {
  transactions: BattlefieldAttackOfferTransactionAuthorityRecord[];
}

export interface BattlefieldAttackOfferServerAuthoritySeal {
  version: 1;
  checkpointId: string | null;
  stateBinding: string;
  authority: BattlefieldAttackOfferServerAuthoritySnapshot;
  mac: string;
}

const authorityByState = new WeakMap<GameState, BattlefieldAttackOfferServerAuthoritySnapshot>();

function emptyAuthority(): BattlefieldAttackOfferServerAuthoritySnapshot { return { transactions: [] }; }
function cloneAuthority(value: BattlefieldAttackOfferServerAuthoritySnapshot): BattlefieldAttackOfferServerAuthoritySnapshot { return structuredClone(value); }
function authority(state: GameState): BattlefieldAttackOfferServerAuthoritySnapshot {
  let value = authorityByState.get(state);
  if (!value) { value = emptyAuthority(); authorityByState.set(state, value); }
  return value;
}
function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value).sort(); const target = [...expected].sort();
  return keys.length === target.length && keys.every((key, index) => key === target[index]);
}
function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every((entry) => typeof entry === 'string'); }
function isRound(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) >= 1; }
function isIndex(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) >= 0; }
function isTransactionId(value: unknown): value is string { return typeof value === 'string' && /^battlefield-attack-offer-tx-\d+$/.test(value); }
function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}
function isParticipation(value: unknown): value is BattlefieldAttackOfferParticipationAuthorityRecord {
  return isRecord(value) && exactKeys(value, ['playerId','cardInstanceId']) && typeof value.playerId === 'string' && typeof value.cardInstanceId === 'string';
}
function isTransaction(value: unknown): value is BattlefieldAttackOfferTransactionAuthorityRecord {
  if (!isRecord(value) || !exactKeys(value, [
    'transactionId','controllerId','sourceCardId','abilityId','round','battlefieldId','orderPlayerIds','nextIndex','completed','participations',
  ])) return false;
  if (!isTransactionId(value.transactionId) || typeof value.controllerId !== 'string' || typeof value.sourceCardId !== 'string' ||
      typeof value.abilityId !== 'string' || !isRound(value.round) || typeof value.battlefieldId !== 'string' || !isStringArray(value.orderPlayerIds) ||
      value.orderPlayerIds.length < 1 || new Set(value.orderPlayerIds).size !== value.orderPlayerIds.length || !isIndex(value.nextIndex) ||
      Number(value.nextIndex) > value.orderPlayerIds.length || typeof value.completed !== 'boolean' || !Array.isArray(value.participations) ||
      !value.participations.every(isParticipation)) return false;
  const participations = value.participations as BattlefieldAttackOfferParticipationAuthorityRecord[];
  const orderPlayerIds = value.orderPlayerIds as string[];
  const players = participations.map((entry) => entry.playerId);
  const cards = participations.map((entry) => entry.cardInstanceId);
  return new Set(players).size === players.length && new Set(cards).size === cards.length && players.every((id) => orderPlayerIds.includes(id));
}
function isAuthority(value: unknown): value is BattlefieldAttackOfferServerAuthoritySnapshot {
  if (!isRecord(value) || !exactKeys(value, ['transactions']) || !Array.isArray(value.transactions) || !value.transactions.every(isTransaction)) return false;
  const ids = value.transactions.map((entry) => entry.transactionId);
  return new Set(ids).size === ids.length;
}
function isCheckpointId(value: unknown): value is string { return typeof value === 'string' && /^checkpoint:\d+$/.test(value); }
function isSeal(value: unknown): value is BattlefieldAttackOfferServerAuthoritySeal {
  return isRecord(value) && exactKeys(value, ['version','checkpointId','stateBinding','authority','mac']) && value.version === 1 &&
    (value.checkpointId === null || isCheckpointId(value.checkpointId)) && typeof value.stateBinding === 'string' && /^[0-9a-f]{64}$/.test(value.stateBinding) &&
    isAuthority(value.authority) && typeof value.mac === 'string' && /^[0-9a-f]{64}$/.test(value.mac);
}
function normalizedAuthority(value: BattlefieldAttackOfferServerAuthoritySnapshot): BattlefieldAttackOfferServerAuthoritySnapshot {
  return { transactions: value.transactions.map((entry) => ({ ...entry, orderPlayerIds: [...entry.orderPlayerIds], participations: entry.participations.map((p) => ({ ...p })) })) };
}
function scopedAuthority(state: GameState): BattlefieldAttackOfferServerAuthoritySnapshot {
  const current = authorityByState.get(state) ?? emptyAuthority(); const round = state.round.roundNumber;
  return normalizedAuthority({ transactions: current.transactions.filter((entry) => entry.round === round) });
}
function hasSensitiveState(state: GameState): boolean {
  const runtime = state.abilityRuntime;
  return !!runtime && (!!runtime.pendingBattlefieldAttackOfferTransaction || (runtime.battlefieldAttackOfferSettlements?.length ?? 0) > 0);
}
function sealPayload(scope: string, checkpointId: string | null, stateBinding: string, snapshot: BattlefieldAttackOfferServerAuthoritySnapshot): string {
  return JSON.stringify({ version: 1, persistenceScope: scope, checkpointId, stateBinding, authority: normalizedAuthority(snapshot) });
}
function txMatchesAuthority(tx: PendingBattlefieldAttackOfferTransaction, record: BattlefieldAttackOfferTransactionAuthorityRecord): boolean {
  return tx.transactionId === record.transactionId && tx.controllerId === record.controllerId && tx.sourceCardId === record.sourceCardId &&
    tx.abilityId === record.abilityId && tx.round === record.round && tx.battlefieldId === record.battlefieldId &&
    sameStrings(tx.orderPlayerIds, record.orderPlayerIds) && tx.nextIndex === record.nextIndex &&
    sameStrings(tx.playedPlayerIds, record.participations.map((entry) => entry.playerId)) && record.completed === false;
}
function settlementMatchesAuthority(settlement: BattlefieldAttackOfferSettlement, record: BattlefieldAttackOfferTransactionAuthorityRecord): boolean {
  return settlement.transactionId === record.transactionId && settlement.controllerId === record.controllerId && settlement.sourceCardId === record.sourceCardId &&
    settlement.abilityId === record.abilityId && settlement.round === record.round && settlement.battlefieldId === record.battlefieldId && record.completed === true &&
    sameStrings(settlement.playedPlayerIds, record.participations.map((entry) => entry.playerId));
}

export function rememberBattlefieldAttackOfferStartAuthority(state: GameState, tx: PendingBattlefieldAttackOfferTransaction): void {
  const value = authority(state);
  if (value.transactions.some((entry) => entry.transactionId === tx.transactionId)) throw new Error('Duplicate battlefield attack-offer authority transaction');
  value.transactions.push({
    transactionId: tx.transactionId, controllerId: tx.controllerId, sourceCardId: tx.sourceCardId, abilityId: tx.abilityId,
    round: tx.round, battlefieldId: tx.battlefieldId, orderPlayerIds: [...tx.orderPlayerIds], nextIndex: tx.nextIndex,
    completed: false, participations: [],
  });
}
export function rememberBattlefieldAttackOfferProgressAuthority(state: GameState, tx: PendingBattlefieldAttackOfferTransaction): void {
  const record = authority(state).transactions.find((entry) => entry.transactionId === tx.transactionId);
  if (!record || record.completed || record.controllerId !== tx.controllerId || record.sourceCardId !== tx.sourceCardId ||
      record.abilityId !== tx.abilityId || record.round !== tx.round || record.battlefieldId !== tx.battlefieldId ||
      !sameStrings(record.orderPlayerIds, tx.orderPlayerIds)) throw new Error('Battlefield attack-offer authority progression mismatch');
  record.nextIndex = tx.nextIndex;
}
export function rememberBattlefieldAttackOfferParticipationAuthority(state: GameState, tx: PendingBattlefieldAttackOfferTransaction, playerId: string, cardInstanceId: string): void {
  const record = authority(state).transactions.find((entry) => entry.transactionId === tx.transactionId);
  if (!record || record.completed || !sameStrings(record.orderPlayerIds, tx.orderPlayerIds) || !record.orderPlayerIds.includes(playerId) ||
      record.participations.some((entry) => entry.playerId === playerId || entry.cardInstanceId === cardInstanceId)) {
    throw new Error('Battlefield attack-offer participation authority mismatch');
  }
  record.participations.push({ playerId, cardInstanceId });
}
export function rememberBattlefieldAttackOfferCompletedAuthority(state: GameState, tx: PendingBattlefieldAttackOfferTransaction): void {
  const record = authority(state).transactions.find((entry) => entry.transactionId === tx.transactionId);
  if (!record || record.completed || !sameStrings(record.orderPlayerIds, tx.orderPlayerIds) || record.nextIndex !== tx.nextIndex ||
      !sameStrings(tx.playedPlayerIds, record.participations.map((entry) => entry.playerId))) throw new Error('Battlefield attack-offer completion authority mismatch');
  record.completed = true;
}
export function retireBattlefieldAttackOfferAuthority(state: GameState, transactionId: string): void {
  const value = authorityByState.get(state); if (!value) return;
  value.transactions = value.transactions.filter((entry) => entry.transactionId !== transactionId);
  if (value.transactions.length === 0) authorityByState.delete(state);
}
export function retireBattlefieldAttackOfferAuthorityBeforeRound(state: GameState, round: number): void {
  const value = authorityByState.get(state); if (!value) return;
  value.transactions = value.transactions.filter((entry) => entry.round >= round);
  if (value.transactions.length === 0) authorityByState.delete(state);
}
export function copyBattlefieldAttackOfferServerAuthority(from: GameState, to: GameState): void {
  const value = authorityByState.get(from);
  if (!value) { authorityByState.delete(to); return; }
  authorityByState.set(to, cloneAuthority(value));
}
export function persistBattlefieldAttackOfferServerAuthority(state: GameState, secret: string, scope: string, checkpointId?: string): BattlefieldAttackOfferServerAuthoritySeal | undefined {
  const snapshot = scopedAuthority(state);
  if (!hasSensitiveState(state) && snapshot.transactions.length === 0) return undefined;
  const normalizedCheckpointId = checkpointId ?? null; const stateBinding = sha256Hex(JSON.stringify(state));
  return { version: 1, checkpointId: normalizedCheckpointId, stateBinding, authority: normalizedAuthority(snapshot),
    mac: hmacSha256Hex(secret, sealPayload(scope, normalizedCheckpointId, stateBinding, snapshot)) };
}
export function restoreBattlefieldAttackOfferServerAuthority(state: GameState, seal: BattlefieldAttackOfferServerAuthoritySeal | undefined, secret: string, scope: string, checkpointId?: string): boolean {
  if (!seal) { authorityByState.delete(state); return !hasSensitiveState(state); }
  if (!isSeal(seal)) return false;
  const expectedCheckpointId = checkpointId ?? null; if (seal.checkpointId !== expectedCheckpointId) return false;
  const stateBinding = sha256Hex(JSON.stringify(state)); if (seal.stateBinding !== stateBinding) return false;
  if (seal.mac !== hmacSha256Hex(secret, sealPayload(scope, expectedCheckpointId, stateBinding, seal.authority))) return false;
  authorityByState.set(state, cloneAuthority(seal.authority));
  return true;
}
export function isBattlefieldAttackOfferServerAuthorityConsistent(state: GameState): boolean {
  const runtime = state.abilityRuntime; if (!runtime) return true;
  const sensitive = hasSensitiveState(state); const value = authorityByState.get(state); if (!value) return !sensitive;
  const round = state.round.roundNumber; const records = value.transactions.filter((entry) => entry.round === round);
  const pending = runtime.pendingBattlefieldAttackOfferTransaction;
  if (pending) {
    const record = records.find((entry) => entry.transactionId === pending.transactionId);
    if (!record || !txMatchesAuthority(pending, record)) return false;
  }
  const settlements = runtime.battlefieldAttackOfferSettlements ?? [];
  for (const settlement of settlements) {
    const record = records.find((entry) => entry.transactionId === settlement.transactionId);
    if (!record || !settlementMatchesAuthority(settlement, record)) return false;
  }
  const sensitiveIds = new Set<string>([
    ...(pending ? [pending.transactionId] : []),
    ...settlements.map((entry) => entry.transactionId),
  ]);
  return records.every((record) => sensitiveIds.has(record.transactionId));
}
