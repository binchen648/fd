import type { GameState } from '../schema/game';
import { hmacSha256Hex, sha256Hex } from './portable-sha256';
import type { BattleCloseDrawImmediatePlayRecord, BattleCloseDrawPlayReward } from './types';

export interface BattleCloseDrawPlayDrawAuthorityRecord {
  transactionId: string;
  controllerId: string;
  sourceCardId: string;
  abilityId: string;
  round: number;
  playerId: string;
  closedCardId: string;
  refundMana: number;
  drawnCardId: string;
}

export interface BattleCloseDrawPlayImmediatePlayAuthorityRecord extends BattleCloseDrawImmediatePlayRecord {}

export interface BattleCloseDrawPlayServerAuthoritySnapshot {
  draws: BattleCloseDrawPlayDrawAuthorityRecord[];
  immediatePlays: BattleCloseDrawPlayImmediatePlayAuthorityRecord[];
}

export interface BattleCloseDrawPlayServerAuthoritySeal {
  version: 1;
  checkpointId: string | null;
  stateBinding: string;
  authority: BattleCloseDrawPlayServerAuthoritySnapshot;
  mac: string;
}

const authorityByState = new WeakMap<GameState, BattleCloseDrawPlayServerAuthoritySnapshot>();

function emptyAuthority(): BattleCloseDrawPlayServerAuthoritySnapshot {
  return { draws: [], immediatePlays: [] };
}

function authority(state: GameState): BattleCloseDrawPlayServerAuthoritySnapshot {
  let value = authorityByState.get(state);
  if (!value) {
    value = emptyAuthority();
    authorityByState.set(state, value);
  }
  return value;
}

function cloneAuthority(value: BattleCloseDrawPlayServerAuthoritySnapshot): BattleCloseDrawPlayServerAuthoritySnapshot {
  return structuredClone(value);
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value).sort();
  const target = [...expected].sort();
  return keys.length === target.length && keys.every((key, index) => key === target[index]);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isRound(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 1;
}

function isRefund(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isDrawRecord(value: unknown): value is BattleCloseDrawPlayDrawAuthorityRecord {
  return isPlainRecord(value) && exactKeys(value, [
    'transactionId', 'controllerId', 'sourceCardId', 'abilityId', 'round', 'playerId', 'closedCardId', 'refundMana', 'drawnCardId',
  ]) && typeof value.transactionId === 'string' && /^battle-close-draw-play-\d+$/.test(value.transactionId) && typeof value.controllerId === 'string' && typeof value.sourceCardId === 'string' && typeof value.abilityId === 'string' &&
    isRound(value.round) && typeof value.playerId === 'string' && typeof value.closedCardId === 'string' && isRefund(value.refundMana) &&
    typeof value.drawnCardId === 'string';
}

function isImmediatePlayRecord(value: unknown): value is BattleCloseDrawPlayImmediatePlayAuthorityRecord {
  return isPlainRecord(value) && exactKeys(value, [
    'controllerId', 'playerId', 'cardInstanceId', 'sourceCardId', 'abilityId', 'round',
  ]) && typeof value.controllerId === 'string' && typeof value.playerId === 'string' && typeof value.cardInstanceId === 'string' &&
    typeof value.sourceCardId === 'string' && typeof value.abilityId === 'string' && isRound(value.round);
}

function isAuthoritySnapshot(value: unknown): value is BattleCloseDrawPlayServerAuthoritySnapshot {
  if (!isPlainRecord(value) || !exactKeys(value, ['draws', 'immediatePlays']) ||
      !Array.isArray(value.draws) || !value.draws.every(isDrawRecord) ||
      !Array.isArray(value.immediatePlays) || !value.immediatePlays.every(isImmediatePlayRecord)) return false;
  const drawKeys = value.draws.map((entry) => `${entry.transactionId}:${entry.playerId}:${entry.closedCardId}`);
  const playKeys = value.immediatePlays.map((entry) => `${entry.controllerId}:${entry.sourceCardId}:${entry.abilityId}:${entry.round}:${entry.playerId}:${entry.cardInstanceId}`);
  return new Set(drawKeys).size === drawKeys.length && new Set(playKeys).size === playKeys.length;
}

function isCheckpointId(value: unknown): value is string {
  return typeof value === 'string' && /^checkpoint:\d+$/.test(value);
}

function isSeal(value: unknown): value is BattleCloseDrawPlayServerAuthoritySeal {
  return isPlainRecord(value) && exactKeys(value, ['version', 'checkpointId', 'stateBinding', 'authority', 'mac']) &&
    value.version === 1 && (value.checkpointId === null || isCheckpointId(value.checkpointId)) &&
    typeof value.stateBinding === 'string' && /^[0-9a-f]{64}$/.test(value.stateBinding) &&
    isAuthoritySnapshot(value.authority) && typeof value.mac === 'string' && /^[0-9a-f]{64}$/.test(value.mac);
}

function normalizedAuthority(value: BattleCloseDrawPlayServerAuthoritySnapshot): BattleCloseDrawPlayServerAuthoritySnapshot {
  return {
    draws: value.draws.map((entry) => ({ ...entry })),
    immediatePlays: value.immediatePlays.map((entry) => ({ ...entry })),
  };
}

function scopedAuthority(state: GameState): BattleCloseDrawPlayServerAuthoritySnapshot {
  const current = authorityByState.get(state) ?? emptyAuthority();
  const round = state.round.roundNumber;
  return {
    draws: current.draws.filter((entry) => entry.round === round).map((entry) => ({ ...entry })),
    immediatePlays: current.immediatePlays.filter((entry) => entry.round === round).map((entry) => ({ ...entry })),
  };
}

function hasSensitiveState(state: GameState): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return false;
  return !!runtime.pendingBattleCloseDrawPlayTransaction ||
    (runtime.battleCloseDrawImmediatePlayHistory?.length ?? 0) > 0 ||
    Object.values(runtime.cardState).some((entry) => entry.actionAbilityAllowedInCombatRound !== undefined);
}

function sealPayload(
  persistenceScope: string,
  checkpointId: string | null,
  stateBinding: string,
  snapshot: BattleCloseDrawPlayServerAuthoritySnapshot,
): string {
  return JSON.stringify({
    version: 1,
    persistenceScope,
    checkpointId,
    stateBinding,
    authority: normalizedAuthority(snapshot),
  });
}

export function rememberBattleCloseDrawPlayDrawAuthority(
  state: GameState,
  record: BattleCloseDrawPlayDrawAuthorityRecord,
): void {
  const value = authority(state);
  const key = `${record.transactionId}:${record.playerId}:${record.closedCardId}`;
  const existing = value.draws.find((entry) =>
    `${entry.transactionId}:${entry.playerId}:${entry.closedCardId}` === key);
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(record)) throw new Error('Conflicting battle close/draw authority');
    return;
  }
  value.draws.push({ ...record });
}

export function rememberBattleCloseDrawImmediatePlayAuthority(
  state: GameState,
  record: BattleCloseDrawPlayImmediatePlayAuthorityRecord,
): void {
  const value = authority(state);
  const key = `${record.controllerId}:${record.sourceCardId}:${record.abilityId}:${record.round}:${record.playerId}:${record.cardInstanceId}`;
  const existing = value.immediatePlays.find((entry) =>
    `${entry.controllerId}:${entry.sourceCardId}:${entry.abilityId}:${entry.round}:${entry.playerId}:${entry.cardInstanceId}` === key);
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(record)) throw new Error('Conflicting battle immediate-play authority');
    return;
  }
  value.immediatePlays.push({ ...record });
}

export function copyBattleCloseDrawPlayServerAuthority(from: GameState, to: GameState): void {
  const value = authorityByState.get(from);
  if (!value) {
    authorityByState.delete(to);
    return;
  }
  authorityByState.set(to, cloneAuthority(value));
}

export function retireBattleCloseDrawPlayDrawAuthorityForTransaction(state: GameState, transactionId: string): void {
  const value = authorityByState.get(state);
  if (!value) return;
  value.draws = value.draws.filter((entry) => entry.transactionId !== transactionId);
  if (value.draws.length === 0 && value.immediatePlays.length === 0) authorityByState.delete(state);
}

export function retireBattleCloseDrawPlayServerAuthorityBeforeRound(state: GameState, round: number): void {
  const value = authorityByState.get(state);
  if (!value) return;
  value.draws = value.draws.filter((entry) => entry.round >= round);
  value.immediatePlays = value.immediatePlays.filter((entry) => entry.round >= round);
  if (value.draws.length === 0 && value.immediatePlays.length === 0) authorityByState.delete(state);
}

export function persistBattleCloseDrawPlayServerAuthority(
  state: GameState,
  persistenceSecret: string,
  persistenceScope: string,
  checkpointId?: string,
): BattleCloseDrawPlayServerAuthoritySeal | undefined {
  const snapshot = scopedAuthority(state);
  if (!hasSensitiveState(state) && snapshot.draws.length === 0 && snapshot.immediatePlays.length === 0) return undefined;
  const normalizedCheckpointId = checkpointId ?? null;
  const stateBinding = sha256Hex(JSON.stringify(state));
  return {
    version: 1,
    checkpointId: normalizedCheckpointId,
    stateBinding,
    authority: normalizedAuthority(snapshot),
    mac: hmacSha256Hex(
      persistenceSecret,
      sealPayload(persistenceScope, normalizedCheckpointId, stateBinding, snapshot),
    ),
  };
}

export function restoreBattleCloseDrawPlayServerAuthority(
  state: GameState,
  seal: BattleCloseDrawPlayServerAuthoritySeal | undefined,
  persistenceSecret: string,
  persistenceScope: string,
  checkpointId?: string,
): boolean {
  if (!seal) {
    authorityByState.delete(state);
    return !hasSensitiveState(state);
  }
  if (!isSeal(seal)) return false;
  const expectedCheckpointId = checkpointId ?? null;
  if (seal.checkpointId !== expectedCheckpointId) return false;
  const stateBinding = sha256Hex(JSON.stringify(state));
  if (seal.stateBinding !== stateBinding) return false;
  const expectedMac = hmacSha256Hex(
    persistenceSecret,
    sealPayload(persistenceScope, expectedCheckpointId, stateBinding, seal.authority),
  );
  if (seal.mac !== expectedMac) return false;
  authorityByState.set(state, cloneAuthority(seal.authority));
  return true;
}

function exactRewardMatchesDraw(
  reward: BattleCloseDrawPlayReward,
  draw: BattleCloseDrawPlayDrawAuthorityRecord,
  controllerId: string,
  sourceCardId: string,
  abilityId: string,
  round: number,
): boolean {
  return reward.playerId === draw.playerId && reward.closedCardId === draw.closedCardId && reward.refundMana === draw.refundMana &&
    reward.drawnCardId === draw.drawnCardId && controllerId === draw.controllerId && sourceCardId === draw.sourceCardId &&
    abilityId === draw.abilityId && round === draw.round;
}

export function isBattleCloseDrawPlayServerAuthorityConsistent(state: GameState): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return true;
  const sensitive = hasSensitiveState(state);
  const value = authorityByState.get(state);
  if (!value) return !sensitive;
  const round = state.round.roundNumber;
  const draws = value.draws.filter((entry) => entry.round === round);
  const plays = value.immediatePlays.filter((entry) => entry.round === round);
  const tx = runtime.pendingBattleCloseDrawPlayTransaction;
  if (!tx) {
    if (draws.length > 0) return false;
  } else {
    const txDraws = draws.filter((entry) => entry.transactionId === tx.transactionId);
    if (txDraws.length !== draws.length) return false;
    const rewardDraws = tx.rewards.filter((entry) => entry.drawnCardId !== undefined);
    if (txDraws.length !== rewardDraws.length || rewardDraws.some((reward) =>
      !txDraws.some((entry) => exactRewardMatchesDraw(reward, entry, tx.controllerId, tx.sourceCardId, tx.abilityId, tx.round)))) return false;
  }
  const history = runtime.battleCloseDrawImmediatePlayHistory ?? [];
  for (const entry of history) {
    if (entry.round !== round) return false;
    if (!plays.some((candidate) => JSON.stringify(candidate) === JSON.stringify(entry))) return false;
  }
  for (const play of plays) {
    if (!history.some((entry) => JSON.stringify(entry) === JSON.stringify(play))) return false;
  }
  for (const [cardInstanceId, cardState] of Object.entries(runtime.cardState)) {
    const permissionRound = cardState.actionAbilityAllowedInCombatRound;
    if (permissionRound === undefined) continue;
    if (permissionRound !== round) return false;
    const cardEntry = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
    if (!cardEntry) return false;
    const matches = plays.filter((entry) => entry.cardInstanceId === cardInstanceId && entry.playerId === cardEntry.ownerPlayerId && entry.round === permissionRound);
    if (matches.length !== 1) return false;
  }
  return true;
}