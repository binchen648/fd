import contentLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';
import type { GameState } from '../schema/game';

/** Movement restrictions derive from the latest authoritative public event placements.
 * modeState.movementLocks is a diagnostic snapshot, never authority: removal,
 * replacement, battle reveal and restore must take effect without another cache refresh.
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

const eventEffects = new Map((contentLibrary as unknown as {
  cards: Array<{ id: string; effects?: Array<Record<string, unknown>> }>;
}).cards.filter(card => card.id.startsWith('event.')).map(card => [card.id, card.effects ?? []]));

export function movementLocks(state: GameState): MovementLock[] {
  return (state.eventPlacements ?? []).filter(placement => placement.visibility.scope === 'public').flatMap(placement => {
    let blocksEntry = false;
    let blocksExit = false;
    for (const effect of eventEffects.get(placement.eventCardId) ?? []) {
      if (effect.type !== 'movement_lock') continue;
      const prevents = Array.isArray(effect.prevents) ? effect.prevents.map(String) : [];
      const prohibits = String(effect.prohibits ?? '');
      blocksEntry ||= prevents.includes('enter_by_movement') || prohibits.includes('into_this') || prohibits.includes('move_to');
      blocksExit ||= prevents.includes('leave_by_movement') || prohibits.includes('from_this') || prohibits.includes('move_from');
    }
    return blocksEntry || blocksExit
      ? [{ sourceId: placement.eventCardId, locationId: placement.locationId, blocksEntry, blocksExit }]
      : [];
  });
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
