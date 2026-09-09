import { describe, expect, it } from 'vitest';

import { createMatchRoomHub } from '../src/match-room-hub';

describe('MatchRoomHub local multiplayer transport layer', () => {
  it('manages a room through create, join, seat, start, project, disconnect, reconnect, and restore', () => {
    const hub = createMatchRoomHub();
    const hostProjection = hub.createRoom({ seed: 20260905, hostClientId: 'host-a' });
    const roomId = hostProjection.roomId;
    const alice = hub.joinRoom(roomId, { clientId: 'alice', displayName: 'Alice' });
    hub.joinRoom(roomId, { clientId: 'bob', displayName: 'Bob' });
    hub.selectSeat(roomId, 'alice', 1);
    hub.selectSeat(roomId, 'bob', 2);
    hub.startMatch(roomId, 'host-a');

    expect(hub.project(roomId, 'alice').viewer.playerId).toBe('p1');
    expect(hub.project(roomId, 'bob').viewer.playerId).toBe('p2');
    expect(hub.version(roomId)).toBeGreaterThanOrEqual(5);

    hub.disconnect(roomId, 'alice');
    expect(hub.project(roomId, 'alice').clients.find((client) => client.id === 'alice')?.connected).toBe(false);
    hub.reconnect(roomId, alice.clients.find((client) => client.id === 'alice')!.reconnectToken);
    expect(hub.project(roomId, 'alice').clients.find((client) => client.id === 'alice')?.connected).toBe(true);

    const snapshot = hub.serialize();
    const restoredHub = createMatchRoomHub();
    restoredHub.restore(snapshot);
    expect(restoredHub.project(roomId, 'bob').viewer.playerId).toBe('p2');
  });

  it('rejects missing expectedRevision mutations before changing room state', () => {
    const hub = createMatchRoomHub();
    const hostProjection = hub.createRoom({ seed: 20260905, hostClientId: 'host' });
    const roomId = hostProjection.roomId;
    hub.selectSeat(roomId, 'host', 1);
    hub.startMatch(roomId, 'host');
    const beforeEnd = hub.project(roomId, 'host');
    const beforeVersion = hub.version(roomId);
    const beforeRevision = beforeEnd.match?.view.revision;
    const beforePhase = beforeEnd.match?.view.phase;
    const beforeLogCount = beforeEnd.match?.logs.length ?? 0;

    expect(() => hub.endTurn(roomId, 'host', undefined as never)).toThrow('missing_expected_revision');
    const afterEnd = hub.project(roomId, 'host');
    expect(hub.version(roomId)).toBe(beforeVersion);
    expect(afterEnd.match?.view.revision).toBe(beforeRevision);
    expect(afterEnd.match?.view.phase).toBe(beforePhase);
    expect(afterEnd.match?.logs).toHaveLength(beforeLogCount);

    expect(() => hub.dispatchCommand(roomId, 'host', {
      type: 'activate_ability',
      sourceCardId: 'missing-card',
      abilityId: 'missing-ability',
    }, undefined as never)).toThrow('missing_expected_revision');
    const afterDispatch = hub.project(roomId, 'host');
    expect(hub.version(roomId)).toBe(beforeVersion);
    expect(afterDispatch.match?.view.revision).toBe(beforeRevision);
    expect(afterDispatch.match?.view.phase).toBe(beforePhase);
    expect(afterDispatch.match?.logs).toHaveLength(beforeLogCount);
  });
});
