import type { GameState } from '../schema/game';

/**
 * D5 · 事件牌的移动限制运行时读点。
 *
 * 事件牌是最后一块不在 Canonical IR 上的内容：效果仍由 `match-session` 的事件表按类型
 * 消费。已接入的移动限制汇总到 `modeState`（session 在放置/揭示/回合结束时刷新），移动的候选
 * 生成与执行都读这里：
 * - `movementLocks`：无条件（怨灵结界 进+出、嵌合涡流 仅出）；
 */
export interface MovementLock {
  sourceId: string;
  locationId: string;
  blocksEntry: boolean;
  blocksExit: boolean;
}

export interface MovementLockState {
  blocksEntry: boolean;
  blocksExit: boolean;
}

const NO_LOCK: MovementLockState = { blocksEntry: false, blocksExit: false };

export function movementLocks(state: GameState): MovementLock[] {
  const modeState = (state as unknown as { modeState?: { movementLocks?: MovementLock[] } }).modeState;
  const locks = modeState?.movementLocks;
  return Array.isArray(locks) ? locks : [];
}

export function movementLockAt(state: GameState, locationId: string | undefined, _playerId?: string): MovementLockState {
  if (!locationId) return NO_LOCK;
  let blocksEntry = false;
  let blocksExit = false;
  for (const lock of movementLocks(state)) {
    if (lock.locationId !== locationId) continue;
    blocksEntry ||= lock.blocksEntry === true;
    blocksExit ||= lock.blocksExit === true;
  }
  return blocksEntry || blocksExit ? { blocksEntry, blocksExit } : NO_LOCK;
}

/** 该玩家此刻能否以移动离开所在地点（未部署 = 不构成"离开"）。 */
export function movementExitBlocked(state: GameState, playerId: string): boolean {
  const player = state.players.find((candidate) => candidate.id === playerId);
  return movementLockAt(state, player?.locationId, playerId).blocksExit;
}
