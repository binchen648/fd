import { expect, it } from 'vitest';
import { createMatchRoomHub } from '../../src/match-room-hub';

it('offers identical sealed bytes for immediate server encoding without cloning immutable replay history', () => {
  const hub = createMatchRoomHub(); const id = 'encoding';
  hub.createRoom({ roomId: id, hostClientId: 'host' }); hub.selectSeat(id, 'host', 1); hub.startMatch(id, 'host');
  const room = hub.getRoom(id), original = JSON.stringify(room.session!.replaySnapshots);
  const copied = hub.serialize();
  const borrowed = hub.serialize(false);
  expect(borrowed.rooms[0]!.session!.replaySnapshots).toBe(room.session!.replaySnapshots);
  expect(copied.rooms[0]!.session!.replaySnapshots).not.toBe(room.session!.replaySnapshots);
  expect(JSON.stringify(borrowed)).toBe(JSON.stringify(copied));
  expect(JSON.stringify(room.session!.replaySnapshots)).toBe(original);
  // The public default remains an independent snapshot for callers that edit it.
  copied.rooms[0]!.session!.replaySnapshots[0]!.state.round.roundNumber = 99;
  expect(JSON.stringify(room.session!.replaySnapshots)).toBe(original);
});
