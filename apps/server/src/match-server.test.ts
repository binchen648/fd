import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';
import {
  createMatchSession,
  createSeededGameState,
  initializeAbilityRuntime,
  loadAuthoringJson,
  OPPONENT_CLOSE_NON_RESIDUAL_TO_ONE_EFFECT,
  type RoomHttpResponse,
  type ServerRoomMessage,
} from '@fd/rules';

import { createMatchServer, type MatchServerHandle } from './match-server';

let serverHandle: MatchServerHandle | undefined;

afterEach(async () => {
  if (serverHandle) {
    await serverHandle.close();
    serverHandle = undefined;
  }
});

function postJson<T>(url: string, body: unknown): Promise<T> {
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (response) => {
    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<T>;
  });
}

const FB249_SOURCE_DEF = 'test.server.fb2-49.source';
const FB249_SOURCE_ID = 'server-fb2-49-source-p1';
const FB249_ABILITY_ID = 'test.server.fb2-49.close-to-one';
const FB249_ATTACK_DEF = 'test.server.fb2-49.attack';

function createServerFb249State() {
  const archive: any = {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'servant_skill_card_archive',
    id: 'test.server.fb2-49',
    name: 'Server FB2-49 synthetic',
    class: 'Test',
    cards: [{
      id: FB249_SOURCE_DEF,
      name: 'Server FB2-49 source',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: 'test.server.fb2-49' },
      cardFace: { typeLabel: 'test', attributes: ['test'], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [{
        id: FB249_ABILITY_ID,
        kind: 'phase_action',
        printedClause: 'synthetic identity-free FB2-49',
        activation: { phase: 'combat', opens: 'controller_combat_action_window' },
        conditions: [{ type: 'source_owned' }, { type: 'at_battlefield' }],
        targets: [],
        effects: [{ type: OPPONENT_CLOSE_NON_RESIDUAL_TO_ONE_EFFECT }],
        cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {},
        visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
        execution: { mode: 'automatic' },
      }],
    }],
  };
  const loaded = loadAuthoringJson(archive);
  if (loaded.report.length) throw new Error(`Synthetic FB2-49 authoring rejected: ${JSON.stringify(loaded.report)}`);
  loaded.cards[FB249_ATTACK_DEF] = {
    id: FB249_ATTACK_DEF, name: 'Server FB2-49 attack', cardType: 'servant_attack',
    cardFace: { typeLabel: 'test', attributes: ['test'], cost: 0, basePower: 1 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], mode: 'automatic', abilities: [],
  } as any;
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [
    { instanceId: FB249_SOURCE_ID, definitionId: FB249_SOURCE_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'server-p2-a', definitionId: FB249_ATTACK_DEF, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } },
    { instanceId: 'server-p2-b', definitionId: FB249_ATTACK_DEF, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } },
  ];
  state.round.activePhase = 'battle';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  initializeAbilityRuntime(state, loaded, { seed: 4901 });
  state.abilityRuntime!.cardState[FB249_SOURCE_ID] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  state.abilityRuntime!.cardState['server-p2-a'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  state.abilityRuntime!.cardState['server-p2-b'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

interface SocketInbox {
  socket: WebSocket;
  next(predicate?: (message: ServerRoomMessage) => boolean): Promise<ServerRoomMessage>;
}

function connectSocket(url: string): Promise<SocketInbox> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const messages: ServerRoomMessage[] = [];
    socket.on('message', (raw: Buffer) => {
      messages.push(JSON.parse(raw.toString('utf8')) as ServerRoomMessage);
    });
    socket.once('open', () => resolve({
      socket,
      next(predicate: (message: ServerRoomMessage) => boolean = () => true) {
        return nextMessage(socket, messages, predicate);
      },
    }));
    socket.once('error', reject);
  });
}

function nextMessage(socket: WebSocket, messages: ServerRoomMessage[], predicate: (message: ServerRoomMessage) => boolean = () => true): Promise<ServerRoomMessage> {
  const queuedIndex = messages.findIndex(predicate);
  if (queuedIndex >= 0) return Promise.resolve(messages.splice(queuedIndex, 1)[0]!);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off('message', listener);
      reject(new Error('Timed out waiting for websocket message'));
    }, 1000);
    const listener = (raw: Buffer) => {
      const message = JSON.parse(raw.toString('utf8')) as ServerRoomMessage;
      if (!predicate(message)) return;
      clearTimeout(timeout);
      socket.off('message', listener);
      resolve(message);
    };
    socket.on('message', listener);
  });
}

describe('match websocket server', () => {
  it('rejects stale expectedRevision commands before mutating a room', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    const httpBase = `http://127.0.0.1:${port}`;
    const wsBase = `ws://127.0.0.1:${port}`;

    const host = await postJson<RoomHttpResponse>(`${httpBase}/rooms`, {
      roomId: 'stale-room',
      hostClientId: 'host-stale',
      hostName: 'Host',
      seed: 20260905,
    });
    const hostSocket = await connectSocket(`${wsBase}/rooms/stale-room?clientId=host-stale&reconnectToken=${host.reconnectToken}`);
    await hostSocket.next((message) => message.type === 'server:projection');
    hostSocket.socket.send(JSON.stringify({ type: 'client:select_seat', seat: 1 }));
    await hostSocket.next((message) => message.type === 'server:projection' && message.projection.seats[0]?.clientId === 'host-stale');
    hostSocket.socket.send(JSON.stringify({ type: 'client:start_match' }));
    const started = await hostSocket.next((message) => message.type === 'server:projection' && message.projection.status === 'running');
    expect(started.type).toBe('server:projection');
    if (started.type !== 'server:projection') return;
    const revision = started.projection.match?.view.revision;
    const logCount = started.projection.match?.logs.length ?? 0;

    hostSocket.socket.send(JSON.stringify({ type: 'client:end_turn', requestId: 'stale-end', expectedRevision: Number(revision) - 1 }));
    const stale = await hostSocket.next((message) => message.type === 'server:error' && message.requestId === 'stale-end');
    expect(stale.type).toBe('server:error');
    if (stale.type === 'server:error') expect(stale.message).toContain('Stale command revision');

    hostSocket.socket.send(JSON.stringify({ type: 'client:request_projection' }));
    const afterStale = await hostSocket.next((message) =>
      message.type === 'server:projection' &&
      message.projection.status === 'running' &&
      message.projection.match?.view.revision === revision);
    expect(afterStale.type).toBe('server:projection');
    if (afterStale.type === 'server:projection') {
      expect(afterStale.projection.match?.view.revision).toBe(revision);
      expect(afterStale.projection.match?.logs).toHaveLength(logCount);
    }
    hostSocket.socket.close();
  });

  it('routes HTTP room restore through the Hub trusted-context restore boundary', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    const httpBase = `http://127.0.0.1:${port}`;
    await postJson<RoomHttpResponse>(`${httpBase}/rooms`, {
      roomId: 'restore-room', hostClientId: 'restore-host', hostName: 'Host', seed: 20260905,
    });
    const snapshot = serverHandle.hub.getRoom('restore-room').serializeRoom();
    const restoreSpy = vi.spyOn(serverHandle.hub, 'restoreRoom');
    const restored = await postJson<RoomHttpResponse>(`${httpBase}/rooms/restore-room/restore`, { snapshot });
    expect(restoreSpy).toHaveBeenCalledTimes(1);
    expect(restoreSpy).toHaveBeenCalledWith('restore-room', snapshot);
    expect(restored.roomId).toBe('restore-room');
  });

  it('fails closed on historical FB2-49 replay erasure and malformed nested replay snapshots over HTTP', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    const httpBase = `http://127.0.0.1:${port}`;

    await postJson<RoomHttpResponse>(`${httpBase}/rooms`, {
      roomId: 'fb2-49-http-guard', hostClientId: 'host', hostName: 'Host', seed: 20260905,
    });
    const room = serverHandle.hub.getRoom('fb2-49-http-guard');
    room.session = createMatchSession({
      humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2'], ...room.getPersistenceContext(),
    });
    room.session.state = createServerFb249State();
    room.status = 'running';
    const olderPrefixRoom: any = structuredClone(room.serializeRoom());
    expect(room.session.dispatchPlayerAction('p1', {
      type: 'activate_ability', cardInstanceId: FB249_SOURCE_ID, abilityId: FB249_ABILITY_ID,
    }).ok).toBe(true);
    const liveId = room.session.replay.at(-1)!.id;
    const decisionId = room.session.state.abilityRuntime!.pendingDecision!.id;
    expect(room.session.dispatchPlayerAction('p2', {
      type: 'choose_target', decisionId, selectedIds: ['server-p2-a'],
    }).ok).toBe(true);

    const mixedPrefix: any = structuredClone(room.serializeRoom());
    mixedPrefix.session.replay = structuredClone(olderPrefixRoom.session.replay);
    mixedPrefix.session.replaySnapshots = structuredClone(olderPrefixRoom.session.replaySnapshots);
    delete mixedPrefix.session.opponentCloseToOneReplayManifest;
    const beforeRoom = serverHandle.hub.getRoom('fb2-49-http-guard');
    const beforeVersion = serverHandle.hub.version('fb2-49-http-guard');
    const beforeRoomSnapshot = structuredClone(beforeRoom.serializeRoom());
    const mixedResponse = await fetch(`${httpBase}/rooms/fb2-49-http-guard/restore`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snapshot: mixedPrefix }),
    });
    expect(mixedResponse.status).toBe(400);
    const mixedBody = await mixedResponse.json() as { code: string; message: string };
    expect(mixedBody).toEqual({ code: 'bad_request', message: 'Invalid FB2-49 replay checkpoint lineage' });
    expect(serverHandle.hub.getRoom('fb2-49-http-guard')).toBe(beforeRoom);
    expect(serverHandle.hub.version('fb2-49-http-guard')).toBe(beforeVersion);
    const forged: any = structuredClone(room.serializeRoom());
    const liveSnapshot = forged.session.replaySnapshots.find((entry: any) => entry.checkpointId === liveId);
    delete liveSnapshot.opponentCloseToOneServerAuthority;
    liveSnapshot.state.abilityRuntime.pendingOpponentCloseToOne = [];
    delete liveSnapshot.state.abilityRuntime.pendingDecision;
    delete forged.session.opponentCloseToOneReplayManifest;
    const erasedResponse = await fetch(`${httpBase}/rooms/fb2-49-http-guard/restore`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snapshot: forged }),
    });
    expect(erasedResponse.status).toBe(400);
    const erasedBody = await erasedResponse.json() as { code: string; message: string };
    expect(erasedBody.code).toBe('bad_request');
    expect(erasedBody.message).toContain('FB2-49 replay');
    expect(serverHandle.hub.getRoom('fb2-49-http-guard')).toBe(beforeRoom);
    expect(serverHandle.hub.version('fb2-49-http-guard')).toBe(beforeVersion);

    const malformed: any = structuredClone(beforeRoom.serializeRoom());
    malformed.session.replaySnapshots[0].state.players = [null];
    const malformedResponse = await fetch(`${httpBase}/rooms/fb2-49-http-guard/restore`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snapshot: malformed }),
    });
    expect(malformedResponse.status).toBe(400);
    const malformedBody = await malformedResponse.json() as { code: string; message: string };
    expect(malformedBody).toEqual({ code: 'bad_request', message: 'Invalid FB2-49 replay snapshot container' });
    expect(serverHandle.hub.getRoom('fb2-49-http-guard')).toBe(beforeRoom);
    expect(serverHandle.hub.version('fb2-49-http-guard')).toBe(beforeVersion);

    const malformedTopLevel: any = structuredClone(beforeRoom.serializeRoom());
    malformedTopLevel.session.state.players = [null];
    const malformedTopLevelResponse = await fetch(`${httpBase}/rooms/fb2-49-http-guard/restore`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snapshot: malformedTopLevel }),
    });
    expect(malformedTopLevelResponse.status).toBe(400);
    const malformedTopLevelBody = await malformedTopLevelResponse.json() as { code: string; message: string };
    expect(malformedTopLevelBody).toEqual({ code: 'bad_request', message: 'Invalid MatchSession state container' });
    expect(serverHandle.hub.getRoom('fb2-49-http-guard')).toBe(beforeRoom);
    expect(serverHandle.hub.getRoom('fb2-49-http-guard').serializeRoom()).toEqual(beforeRoomSnapshot);
    expect(serverHandle.hub.version('fb2-49-http-guard')).toBe(beforeVersion);
  });

  it('rejects a relabeled modified executable pack over HTTP without replacing the room', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    const httpBase = `http://127.0.0.1:${port}`;
    await postJson<RoomHttpResponse>(`${httpBase}/rooms`, {
      roomId: 'pack-http-guard', hostClientId: 'host', hostName: 'Host', seed: 20260905,
    });
    const room = serverHandle.hub.getRoom('pack-http-guard');
    room.session = createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1'], ...room.getPersistenceContext() });
    room.status = 'running';
    const beforeRoom = room;
    const beforeSnapshot = structuredClone(room.serializeRoom());
    const beforeVersion = serverHandle.hub.version('pack-http-guard');
    const malformed: any = structuredClone(beforeSnapshot);
    const physical = malformed.session.state.cards.find((card: any) => malformed.session.state.abilityRuntime.pack.cards[card.definitionId]);
    expect(physical).toBeDefined();
    malformed.session.state.abilityRuntime.pack.cards[physical.definitionId].cardFace.basePower = 999999;
    malformed.session.state.abilityRuntime.pack.schemaVersion = 'modified-pack-v1';

    const response = await fetch(`${httpBase}/rooms/pack-http-guard/restore`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snapshot: malformed }),
    });
    expect(response.status).toBe(400);
    const body = await response.json() as { code: string; message: string };
    expect(body).toEqual({ code: 'bad_request', message: 'Invalid MatchSession state container' });
    expect(serverHandle.hub.getRoom('pack-http-guard')).toBe(beforeRoom);
    expect(serverHandle.hub.getRoom('pack-http-guard').serializeRoom()).toEqual(beforeSnapshot);
    expect(serverHandle.hub.version('pack-http-guard')).toBe(beforeVersion);
  });

  it('syncs room projections across browser clients without leaking private hands', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    const httpBase = `http://127.0.0.1:${port}`;
    const wsBase = `ws://127.0.0.1:${port}`;

    const host = await postJson<RoomHttpResponse>(`${httpBase}/rooms`, {
      roomId: 'sync-room',
      hostClientId: 'host-a',
      hostName: 'Host',
      seed: 20260905,
    });
    const playerTwo = await postJson<RoomHttpResponse>(`${httpBase}/rooms/sync-room/join`, {
      clientId: 'client-2',
      displayName: 'Player 2',
    });

    const hostSocket = await connectSocket(`${wsBase}/rooms/sync-room?clientId=host-a&reconnectToken=${host.reconnectToken}`);
    const p2Socket = await connectSocket(`${wsBase}/rooms/sync-room?clientId=client-2&reconnectToken=${playerTwo.reconnectToken}`);
    await hostSocket.next((message) => message.type === 'server:projection');
    await p2Socket.next((message) => message.type === 'server:projection');

    hostSocket.socket.send(JSON.stringify({ type: 'client:select_seat', seat: 1 }));
    await hostSocket.next((message) => message.type === 'server:projection' && message.projection.seats[0]?.clientId === 'host-a');
    p2Socket.socket.send(JSON.stringify({ type: 'client:select_seat', seat: 2 }));
    await p2Socket.next((message) => message.type === 'server:projection' && message.projection.seats[1]?.clientId === 'client-2');

    hostSocket.socket.send(JSON.stringify({ type: 'client:start_match' }));
    const hostProjection = await hostSocket.next((message) => message.type === 'server:projection' && message.projection.status === 'running');
    const p2Projection = await p2Socket.next((message) => message.type === 'server:projection' && message.projection.status === 'running');

    expect(hostProjection.type).toBe('server:projection');
    expect(p2Projection.type).toBe('server:projection');
    if (hostProjection.type !== 'server:projection' || p2Projection.type !== 'server:projection') return;
    const localIdentity = createMatchSession({ seed: 20260905 }).projectToClientState('p1').contentPack;
    expect(hostProjection.projection.match?.contentPack).toEqual(localIdentity);
    expect(p2Projection.projection.match?.contentPack).toEqual(localIdentity);
    expect(hostProjection.projection.viewer.playerId).toBe('p1');
    expect(p2Projection.projection.viewer.playerId).toBe('p2');
    const hostPrivateCards = hostProjection.projection.match?.zones
      .filter((zone) => ['hand', 'master_skill', 'servant_skill', 'command_spell'].includes(zone.id))
      .flatMap((zone) => zone.cardIds) ?? [];
    const p2PrivateCards = p2Projection.projection.match?.zones
      .filter((zone) => ['hand', 'master_skill', 'servant_skill', 'command_spell'].includes(zone.id))
      .flatMap((zone) => zone.cardIds) ?? [];
    expect(hostPrivateCards.length).toBeGreaterThan(0);
    expect(p2PrivateCards.length).toBeGreaterThan(0);
    expect(hostPrivateCards).not.toEqual(p2PrivateCards);

    p2Socket.socket.send(JSON.stringify({ type: 'client:restore_replay', checkpointId: 'checkpoint:1' }));
    const rejection = await p2Socket.next((message) => message.type === 'server:error');
    expect(rejection.type).toBe('server:error');
    if (rejection.type === 'server:error') expect(rejection.message).toContain('Host permission required');

    p2Socket.socket.close();
    await new Promise((resolve) => p2Socket.socket.once('close', resolve));
    const reconnected = await connectSocket(`${wsBase}/rooms/sync-room?clientId=client-2&reconnectToken=${playerTwo.reconnectToken}`);
    const reconnectedProjection = await reconnected.next((message) => message.type === 'server:projection');
    expect(reconnectedProjection.type).toBe('server:projection');
    if (reconnectedProjection.type === 'server:projection') expect(reconnectedProjection.projection.viewer.playerId).toBe('p2');
    hostSocket.socket.close();
    reconnected.socket.close();
  });
});
