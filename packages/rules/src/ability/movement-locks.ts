import type { GameState } from '../schema/game';

/**
 * D5 · 事件牌的移动限制运行时读点。
 *
 * 事件牌是最后一块不在 Canonical IR 上的内容：效果仍由 `match-session` 的事件表按类型
 * 消费。两类限制都汇总到 `modeState`（session 在放置/揭示/回合结束时刷新），移动的候选
 * 生成与执行都读这里：
 * - `movementLocks`：无条件（怨灵结界 进+出、嵌合涡流 仅出）；
 * - `entryBlocks`：条件式入口锁（狭路相逢：非高潮回合且战场上已有 2+ 名玩家时，其他人不能进）。
 */
export interface MovementLock {
  sourceId: string;
  locationId: string;
  blocksEntry: boolean;
  blocksExit: boolean;
}

export interface EntryBlock {
  sourceId: string;
  locationId: string;
  /** 非高潮回合（第 1-8 回合）且该地点已有 2+ 名玩家时生效。 */
  condition: 'non_climax_and_two_players';
}

export interface MovementLockState {
  blocksEntry: boolean;
  blocksExit: boolean;
}

const NO_LOCK: MovementLockState = { blocksEntry: false, blocksExit: false };
const NON_CLIMAX_LAST_ROUND = 8;

export function movementLocks(state: GameState): MovementLock[] {
  const modeState = (state as unknown as { modeState?: { movementLocks?: MovementLock[] } }).modeState;
  const locks = modeState?.movementLocks;
  return Array.isArray(locks) ? locks : [];
}

export function entryBlocks(state: GameState): EntryBlock[] {
  const modeState = (state as unknown as { modeState?: { entryBlocks?: EntryBlock[] } }).modeState;
  const blocks = modeState?.entryBlocks;
  return Array.isArray(blocks) ? blocks : [];
}

function playersAt(state: GameState, locationId: string): number {
  return state.players.filter((player) => player.status === 'active' && player.locationId === locationId).length;
}

/**
 * 汇总某地点上生效的锁。`playerId` 给定时，条件式入口锁会跳过"本来就在这个地点"的玩家
 * （印文只说"其他玩家无法进入"，不限制已经在场上的人）。
 */
export function movementLockAt(state: GameState, locationId: string | undefined, playerId?: string): MovementLockState {
  if (!locationId) return NO_LOCK;
  let blocksEntry = false;
  let blocksExit = false;
  for (const lock of movementLocks(state)) {
    if (lock.locationId !== locationId) continue;
    blocksEntry ||= lock.blocksEntry === true;
    blocksExit ||= lock.blocksExit === true;
  }
  const alreadyThere = playerId ? state.players.find((player) => player.id === playerId)?.locationId === locationId : false;
  if (!alreadyThere) {
    for (const block of entryBlocks(state)) {
      if (block.locationId !== locationId) continue;
      if (block.condition !== 'non_climax_and_two_players') continue;
      const nonClimax = state.round.roundNumber <= NON_CLIMAX_LAST_ROUND;
      if (nonClimax && playersAt(state, locationId) >= 2) blocksEntry = true;
    }
  }
  return blocksEntry || blocksExit ? { blocksEntry, blocksExit } : NO_LOCK;
}

/** 该玩家此刻能否以移动离开所在地点（未部署 = 不构成"离开"）。 */
export function movementExitBlocked(state: GameState, playerId: string): boolean {
  const player = state.players.find((candidate) => candidate.id === playerId);
  return movementLockAt(state, player?.locationId, playerId).blocksExit;
}
