import { describe, expect, it } from 'vitest';

import { createMatchRoom, restoreMatchRoom } from '../src/match-room';

describe('MatchRoom product session layer', () => {
  it('keeps random credentials out of every public projection and rejects duplicate identities', () => {
    const room = createMatchRoom({ roomId: 'auth-room', hostClientId: 'host' });
    const hostToken = room.getIssuedCredential('host');
    const guest = room.joinRoom({ clientId: 'guest', displayName: 'Guest', role: 'spectator' });
    expect(hostToken).toMatch(/^reconnect-v2-[0-9a-f]{64}$/);
    expect(createMatchRoom({ roomId: 'auth-room', hostClientId: 'host' }).getIssuedCredential('host')).not.toBe(hostToken);
    for (const id of ['host', 'guest']) {
      const projection = JSON.stringify(room.getProjection(id));
      expect(projection).not.toContain('reconnectToken');
      expect(projection).not.toContain(hostToken);
      expect(projection).not.toContain(guest.reconnectToken);
    }
    const before = room.serializeRoom();
    expect(() => room.joinRoom({ clientId: 'host', displayName: 'Impersonated', role: 'host' })).toThrow('authenticated reconnect required');
    expect(() => room.joinRoom({ clientId: 'other', displayName: 'Other host', role: 'host' })).toThrow('Invalid new client');
    expect(room.serializeRoom()).toEqual(before);
    expect(() => room.authenticateClient('host', guest.reconnectToken)).toThrow('Invalid reconnect');
  });

  it('rejects legacy predictable persisted credentials without insecure adoption', () => {
    const room = createMatchRoom({ roomId: 'legacy-auth', hostClientId: 'host' });
    const snapshot = room.serializeRoom();
    snapshot.clients[0]!.reconnectToken = 'reconnect-predictable';
    expect(() => restoreMatchRoom(snapshot)).toThrow('Unsafe or invalid persisted client credentials');
  });
  it('creates a room, joins clients, selects seats, and starts a 7-seat match as host', () => {
    const room = createMatchRoom({ seed: 20260905, hostClientId: 'host-a' });
    room.joinRoom({ clientId: 'alice', displayName: 'Alice' });
    room.joinRoom({ clientId: 'bob', displayName: 'Bob' });
    room.selectSeat('alice', 1);
    room.selectSeat('bob', 3);

    expect(() => room.startMatch('alice')).toThrow('Host permission required');
    const match = room.startMatch('host-a');
    const aliceProjection = room.getProjection('alice');

    expect(match.view.players).toHaveLength(7);
    expect(aliceProjection.viewer).toMatchObject({ playerId: 'p1', role: 'player', isHost: false });
    expect(aliceProjection.seats.filter((seat) => seat.controller === 'human')).toHaveLength(2);
    expect(aliceProjection.match?.priorityPlayerId).toBe('p1');
  });

  it('projects spectators without player-owned legal actions or private self cards', () => {
    const room = createMatchRoom({ seed: 20260905, hostClientId: 'host-a' });
    room.joinRoom({ clientId: 'watcher', displayName: 'Watcher', role: 'spectator' });
    room.startMatch('host-a');

    const projection = room.getProjection('watcher');

    expect(projection.viewer.role).toBe('spectator');
    expect(projection.viewer.playerId).toBeUndefined();
    expect(projection.match?.view.legalActions).toEqual([]);
    expect(projection.match?.zones.find((zone) => zone.id === 'hand')?.count).toBe(0);
  });

  it('serializes, restores, reconnects, and keeps dispatch ownership', () => {
    const room = createMatchRoom({ seed: 20260905, hostClientId: 'host-a' });
    const alice = room.joinRoom({ clientId: 'alice', displayName: 'Alice' });
    room.selectSeat('alice', 1);
    room.startMatch('host-a');
    room.endClientTurn('alice');
    room.endClientTurn('alice');
    const before = room.getProjection('alice').match!;
    const action = before.view.legalActions.find((candidate) => candidate.type === 'play_card');
    expect(action).toBeDefined();

    const snapshot = room.serializeRoom();
    const restored = restoreMatchRoom(snapshot);
    restored.disconnect('alice');
    expect(restored.getProjection('alice').clients.find((client) => client.id === 'alice')?.connected).toBe(false);
    expect(() => restored.dispatchClientCommand('alice', action!)).toThrow('Client is disconnected');
    restored.reconnect(alice.reconnectToken);
    const result = restored.dispatchClientCommand('alice', action!);

    expect(result.ok).toBe(true);
    expect(restored.getProjection('alice').clients.find((client) => client.id === 'alice')?.connected).toBe(true);
  });

  it('ends the active local client decision and exposes the next human seat', () => {
    const room = createMatchRoom({ seed: 20260905, hostClientId: 'host-a' });
    room.joinRoom({ clientId: 'alice', displayName: 'Alice' });
    room.joinRoom({ clientId: 'bob', displayName: 'Bob' });
    room.selectSeat('alice', 1);
    room.selectSeat('bob', 2);
    room.startMatch('host-a');

    const result = room.endClientTurn('alice');

    expect(result.ok).toBe(true);
    expect(room.getProjection('bob').match?.priorityPlayerId).toBe('p2');
    expect(room.getProjection('bob').match?.stopReason).toBe('human_input');
  });

  it('lets the host consume directives and restore replay checkpoints', () => {
    const room = createMatchRoom({ seed: 20260905, hostClientId: 'host-a' });
    room.joinRoom({ clientId: 'alice', displayName: 'Alice' });
    room.selectSeat('alice', 1);
    room.startMatch('host-a');
    const session = room.session!;
    session.state.abilityRuntime!.hostRequests.push({
      controllerId: 'p1',
      sourceCardId: 'card.demo',
      abilityId: 'host.demo',
      allowedOperations: ['HOST_ADJUDICATED'],
    });

    expect(room.getProjection('host-a').match?.directives.some((directive) => directive.id === 'host:1')).toBe(true);
    expect(() => room.consumeDirective('alice', 'host:1')).toThrow('Host permission required');
    expect(room.consumeDirective('host-a', 'host:1')).toBe(true);
    expect(room.getProjection('host-a').match?.directives.some((directive) => directive.id === 'host:1')).toBe(false);

    const checkpointId = room.getProjection('host-a').match!.replay[0]!.id;
    expect(room.restoreToReplayCheckpoint('host-a', checkpointId)).toBe(true);
  });
});
