import { describe, expect, it } from 'vitest';

import { createMatchRoom, restoreMatchRoom } from '../src/match-room';

describe('MatchRoom product session layer', () => {
  it('places the selected master and servant on the requested player without duplicates', () => {
    const room = createMatchRoom({
      seed: 20260905,
      hostClientId: 'host-a',
      preferredPlayerIdentities: [{
        playerId: 'p1',
        masterId: 'master.kayneth',
        servantId: 'servant.artoriac',
      }],
      allowedMasterIds: [
        'master.kayneth', 'master.shinji', 'master.kiritsugu', 'master.maiya',
        'master.gatou', 'master.irisviel', 'master.olga-marie',
      ],
      allowedServantIds: [
        'servant.artoriac', 'servant.drake', 'servant.achilles', 'servant.artoria-alt',
        'servant.ereshkigal', 'servant.tomoe', 'servant.kintoki',
      ],
    });
    room.joinRoom({ clientId: 'alice', displayName: 'Alice' });
    room.selectSeat('alice', 1);
    room.startMatch('host-a');

    expect(room.session!.pairings.find((pairing) => pairing.playerId === 'p1')).toMatchObject({
      master: { id: 'master.kayneth' },
      servant: { id: 'servant.artoriac' },
    });
    expect(new Set(room.session!.pairings.map((pairing) => pairing.master.id)).size).toBe(7);
    expect(new Set(room.session!.pairings.map((pairing) => pairing.servant.id)).size).toBe(7);
    expect(room.session!.pairings.map((pairing) => pairing.master.id).sort()).toEqual([
      'master.gatou', 'master.irisviel', 'master.kayneth', 'master.kiritsugu',
      'master.maiya', 'master.olga-marie', 'master.shinji',
    ]);
    expect(room.session!.pairings.map((pairing) => pairing.servant.id).sort()).toEqual([
      'servant.achilles', 'servant.artoria-alt', 'servant.artoriac', 'servant.drake',
      'servant.ereshkigal', 'servant.kintoki', 'servant.tomoe',
    ]);
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

  it('lets the host continue a paused round_end into the next round', () => {
    const room = createMatchRoom({ seed: 20260905, hostClientId: 'host-a' });
    room.joinRoom({ clientId: 'alice', displayName: 'Alice' });
    room.selectSeat('alice', 1);
    room.startMatch('host-a');
    room.session!.state.round.activePhase = 'round_end';
    room.session!.state.round.roundNumber = 1;

    expect(() => room.continueAfterRoundEnd('alice')).toThrow('Host permission required');
    expect(room.continueAfterRoundEnd('host-a')).toBe('human_input');

    const match = room.getProjection('alice').match!;
    expect(match.round).toBe(2);
    expect(match.phase).toBe('preparation');
    expect(match.priorityPlayerId).toBe('p1');
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
