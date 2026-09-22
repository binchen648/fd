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

  it('keeps room identity, state, and Hub version unchanged when top-level restored GameState is malformed', () => {
    const hub = createMatchRoomHub();
    const roomId = hub.createRoom({ roomId: 'restore-atomic-room', seed: 20260905, hostClientId: 'host-a' }).roomId;
    hub.joinRoom(roomId, { clientId: 'alice', displayName: 'Alice' });
    hub.joinRoom(roomId, { clientId: 'bob', displayName: 'Bob' });
    hub.selectSeat(roomId, 'alice', 1);
    hub.selectSeat(roomId, 'bob', 2);
    hub.startMatch(roomId, 'host-a');

    const beforeRoom = hub.getRoom(roomId);
    const beforeSnapshot = structuredClone(beforeRoom.serializeRoom());
    const beforeVersion = hub.version(roomId);
    const malformed: any = structuredClone(beforeSnapshot);
    malformed.session.state.players = [null];

    expect(() => hub.restoreRoom(roomId, malformed)).toThrow('Invalid MatchSession state container');
    expect(hub.getRoom(roomId)).toBe(beforeRoom);
    expect(hub.getRoom(roomId).serializeRoom()).toEqual(beforeSnapshot);
    expect(hub.version(roomId)).toBe(beforeVersion);
  });

  it('rejects referentially invalid restored board state without replacing the room', () => {
    const hub = createMatchRoomHub();
    const roomId = hub.createRoom({ roomId: 'restore-reference-room', seed: 20260905, hostClientId: 'host-a' }).roomId;
    hub.joinRoom(roomId, { clientId: 'alice', displayName: 'Alice' });
    hub.joinRoom(roomId, { clientId: 'bob', displayName: 'Bob' });
    hub.selectSeat(roomId, 'alice', 1);
    hub.selectSeat(roomId, 'bob', 2);
    hub.startMatch(roomId, 'host-a');

    const beforeRoom = hub.getRoom(roomId);
    const beforeSnapshot = structuredClone(beforeRoom.serializeRoom());
    const beforeVersion = hub.version(roomId);
    const corruptions: Array<(snapshot: any) => void> = [
      snapshot => { snapshot.session.state.cards[0].definitionId = 'missing-definition'; },
      snapshot => { snapshot.session.state.cards[0].controllerPlayerId = 'ghost-player'; },
      snapshot => { snapshot.session.state.players[0].locationId = 'missing-location'; },
      snapshot => { snapshot.session.state.players[0].servantCardId = 'servant.missing'; },
      snapshot => { snapshot.session.state.players[0].masterCardId = snapshot.session.state.players[0].servantCardId; },
      snapshot => { snapshot.session.state.eventPlacements[0].eventCardId = 'event.missing'; },
      snapshot => { snapshot.session.state.map.playerCount = 999; },
      snapshot => { snapshot.session.state.players[0].seat = 999; },
      snapshot => {
        snapshot.session.state.abilityRuntime.pendingPreBattleDefeats = [{
          round: snapshot.session.state.round.roundNumber,
          battlefieldId: 'miyama_town',
          controllerId: 'ghost-player',
          sourceCardId: 'missing-card',
          abilityId: 'missing-ability',
          targetPlayerIds: ['p2'],
        }];
      },
      snapshot => {
        snapshot.session.state.abilityRuntime.pendingDelayedActivations = [{
          controllerId: 'p1',
          sourceCardId: 'missing-card',
          abilityId: 'missing-ability',
          definitionId: 'basic.strength.5',
          triggerEventId: 'forged-trigger',
          round: snapshot.session.state.round.roundNumber,
        }];
      },
    ];
    for (const corrupt of corruptions) {
      const malformed: any = structuredClone(beforeSnapshot);
      corrupt(malformed);
      expect(() => hub.restoreRoom(roomId, malformed)).toThrow('Invalid MatchSession state container');
      expect(hub.getRoom(roomId)).toBe(beforeRoom);
      expect(hub.getRoom(roomId).serializeRoom()).toEqual(beforeSnapshot);
      expect(hub.version(roomId)).toBe(beforeVersion);
    }
  });

  it('rejects malformed required AbilityRuntime and optional GameState containers before replacing the room', () => {
    const hub = createMatchRoomHub();
    const roomId = hub.createRoom({ roomId: 'restore-runtime-boundary-room', seed: 20260905, hostClientId: 'host-a' }).roomId;
    hub.joinRoom(roomId, { clientId: 'alice', displayName: 'Alice' });
    hub.selectSeat(roomId, 'alice', 1);
    hub.startMatch(roomId, 'host-a');

    const beforeRoom = hub.getRoom(roomId);
    const beforeSnapshot = structuredClone(beforeRoom.serializeRoom());
    const beforeVersion = hub.version(roomId);
    const corruptions: Array<(snapshot: any) => void> = [
      snapshot => { snapshot.session.state.abilityRuntime.processedEvents = null; },
      snapshot => { snapshot.session.state.abilityRuntime.roomMode = 'invalid-mode'; },
      snapshot => { snapshot.session.state.abilityRuntime.manaCaps = null; },
      snapshot => { snapshot.session.state.abilityRuntime.eventRuleZoneRevision = 'bad'; },
      snapshot => { snapshot.session.state.eventDeck = [123]; },
      snapshot => { snapshot.session.state.ruleOverrides = []; },
    ];
    for (const corrupt of corruptions) {
      const malformed: any = structuredClone(beforeSnapshot);
      corrupt(malformed);
      expect(() => hub.restoreRoom(roomId, malformed)).toThrow('Invalid MatchSession state container');
      expect(hub.getRoom(roomId)).toBe(beforeRoom);
      expect(hub.getRoom(roomId).serializeRoom()).toEqual(beforeSnapshot);
      expect(hub.version(roomId)).toBe(beforeVersion);
    }
  });

  it('keeps bulk Hub restore atomic for malformed session logs and event placements', () => {
    const hub = createMatchRoomHub();
    const roomId = hub.createRoom({ roomId: 'bulk-restore-atomic-room', seed: 20260905, hostClientId: 'host-a' }).roomId;
    hub.joinRoom(roomId, { clientId: 'alice', displayName: 'Alice' });
    hub.selectSeat(roomId, 'alice', 1);
    hub.startMatch(roomId, 'host-a');

    const beforeRoom = hub.getRoom(roomId);
    const beforeRoomSnapshot = structuredClone(beforeRoom.serializeRoom());
    const beforeHubSnapshot = structuredClone(hub.serialize());
    const beforeVersion = hub.version(roomId);

    const nullLogs: any = structuredClone(beforeHubSnapshot);
    nullLogs.rooms[0].session.logs = null;
    expect(() => hub.restore(nullLogs)).toThrow('Invalid MatchSession snapshot container');
    expect(hub.getRoom(roomId)).toBe(beforeRoom);
    expect(hub.getRoom(roomId).serializeRoom()).toEqual(beforeRoomSnapshot);
    expect(hub.version(roomId)).toBe(beforeVersion);

    const emptyPlacement: any = structuredClone(beforeHubSnapshot);
    emptyPlacement.rooms[0].session.state.eventPlacements = [{}];
    expect(() => hub.restore(emptyPlacement)).toThrow('Invalid MatchSession state container');
    expect(hub.getRoom(roomId)).toBe(beforeRoom);
    expect(hub.getRoom(roomId).serializeRoom()).toEqual(beforeRoomSnapshot);
    expect(hub.version(roomId)).toBe(beforeVersion);

    const missingHostClient: any = structuredClone(beforeHubSnapshot);
    missingHostClient.rooms[0].clients = [];
    expect(() => hub.restore(missingHostClient)).toThrow('Unknown client');
    expect(hub.getRoom(roomId)).toBe(beforeRoom);
    expect(hub.getRoom(roomId).serializeRoom()).toEqual(beforeRoomSnapshot);
    expect(hub.version(roomId)).toBe(beforeVersion);
  });

});
