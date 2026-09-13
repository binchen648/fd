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

  it('requires revision and keeps private interaction failures/logs/replay fail-closed', () => {
    const hub = createMatchRoomHub();
    const created = hub.createRoom({ roomId: 'interaction-hub', seed: 20260914, hostClientId: 'host-interaction' });
    const roomId = created.roomId;
    hub.joinRoom(roomId, { clientId: 'observer-interaction', displayName: 'Observer' });
    hub.selectSeat(roomId, 'host-interaction', 1);
    hub.selectSeat(roomId, 'observer-interaction', 2);
    hub.startMatch(roomId, 'host-interaction');

    const room = hub.getRoom(roomId);
    const state = room.session!.state;
    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;
    state.abilityRuntime!.hostRequests = [];
    state.abilityRuntime!.responseWindows = [];
    delete state.abilityRuntime!.pendingDecision;
    const p1 = state.players.find((player) => player.id === 'p1')!;
    p1.mana = 12;
    p1.servantCardId = 'servant.drake';
    for (const card of state.cards) {
      if (card.ownerPlayerId !== 'p1') continue;
      if (card.zone === 'hand') {
        card.zone = 'deck';
        card.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
      }
      if (card.zone === 'field' || card.zone === 'attack_area') {
        card.zone = 'skill';
        card.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
        if (state.abilityRuntime!.cardState[card.instanceId]) state.abilityRuntime!.cardState[card.instanceId]!.active = false;
      }
    }
    const add = (instanceId: string, definitionId: string, zone: string) => state.cards.push({
      instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    add('p1-drake-riding', 'servant.drake.skill.sc-drake-1', 'skill');
    add('p1-private-preparation', 'basic.preparation', 'hand');
    add('p1-private-surveil', 'basic.surveil', 'hand');
    add('p1-private-luck', 'basic.luck', 'hand');

    let revision = hub.project(roomId, 'host-interaction').match!.view.revision;
    expect(hub.dispatchCommand(roomId, 'host-interaction', {
      type: 'play_card', cardInstanceId: 'p1-drake-riding',
    }, revision).result.ok).toBe(true);
    revision = hub.project(roomId, 'host-interaction').match!.view.revision;
    expect(hub.dispatchCommand(roomId, 'host-interaction', {
      type: 'activate_ability', cardInstanceId: 'p1-drake-riding', abilityId: 'sc-drake-1.mount-summon',
    }, revision).result.ok).toBe(true);

    const pending = hub.project(roomId, 'host-interaction').match!.view.pendingDecision!;
    revision = hub.project(roomId, 'host-interaction').match!.view.revision;
    const logsBefore = room.session!.logs.length;
    const replayBefore = room.session!.replay.length;
    const versionBefore = hub.version(roomId);

    expect(() => hub.dispatchCommand(roomId, 'host-interaction', {
      type: 'choose_target', decisionId: pending.id, selectedIds: ['p1-private-preparation'],
    })).toThrow(/missing_expected_revision/);
    expect(hub.project(roomId, 'host-interaction').match!.view.revision).toBe(revision);
    expect(room.session!.logs).toHaveLength(logsBefore);
    expect(room.session!.replay).toHaveLength(replayBefore);
    expect(hub.version(roomId)).toBe(versionBefore);

    const rejected = hub.dispatchCommand(roomId, 'host-interaction', {
      type: 'choose_target', decisionId: pending.id, selectedIds: ['p1-private-luck'],
    }, revision);
    expect(rejected.result.ok).toBe(false);
    expect(rejected.result.rejection?.code).toBe('illegal_target');
    expect(hub.project(roomId, 'host-interaction').match!.view.revision).toBe(revision);
    expect(room.session!.logs).toHaveLength(logsBefore);
    expect(room.session!.replay).toHaveLength(replayBefore);
    expect(hub.version(roomId)).toBe(versionBefore);
    expect(JSON.stringify(hub.project(roomId, 'observer-interaction'))).not.toContain('p1-private-luck');

    const accepted = hub.dispatchCommand(roomId, 'host-interaction', {
      type: 'choose_target', decisionId: pending.id, selectedIds: ['p1-private-preparation'],
    }, revision);
    expect(accepted.result.ok).toBe(true);
    const observerProjection = hub.project(roomId, 'observer-interaction').match!;
    expect(JSON.stringify(observerProjection.logs)).not.toContain('p1-private-preparation');
    expect(JSON.stringify(observerProjection.logs)).not.toContain('p1-private-surveil');
    expect(JSON.stringify(observerProjection.replay)).not.toContain('p1-private-preparation');
    expect(JSON.stringify(observerProjection)).not.toContain('continuationRef');
    const privateDispatchLog = [...room.session!.logs].reverse().find((entry) =>
      entry.type === 'dispatch_ok' && entry.message === 'p1:choose_target');
    expect(privateDispatchLog?.payload?.command).toEqual({ type: 'choose_target', privateSelection: 'redacted' });
  });
});
