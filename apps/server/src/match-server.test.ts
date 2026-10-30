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

function restoreRequest(snapshot: any) {
  const clientId = snapshot.hostClientId as string;
  return { snapshot, clientId, reconnectToken: serverHandle!.hub.getRoom(snapshot.roomId).getIssuedCredential(clientId) };
}

const goldenEaterSourceInstanceId = 'p1-golden-transport-test';
function prepareGoldenTransportRoom() {
  const hub = serverHandle!.hub;
  const roomId = hub.createRoom({ roomId: 'golden-transport', hostClientId: 'host' }).roomId;
  hub.selectSeat(roomId, 'host', 1);
  hub.startMatch(roomId, 'host');
  const room = hub.getRoom(roomId);
  const state = room.session!.state;
  state.round = { roundNumber: 4, activePhase: 'battle', prioritySeat: 1 };
  state.abilityRuntime!.hostRequests = [];
  state.abilityRuntime!.responseWindows = [];
  delete state.abilityRuntime!.pendingDecision;
  Object.assign(state.players.find(player => player.id === 'p1')!, { servantCardId: 'servant.kintoki', locationId: 'miyama_town', mana: 12, vp: 0 });
  for (const [instanceId, definitionId, zone] of [
    [goldenEaterSourceInstanceId, 'servant.kintoki.skill.sc-kintoki-3', 'attack_area'],
    ['golden-first', 'servant.kintoki.skill.sc-kintoki-1', 'removed_from_game'],
    ['golden-second', 'servant.kintoki.skill.sc-kintoki-2', 'removed_from_game'],
  ] as const) {
    state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone, visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState[instanceId] = { active: zone === 'attack_area', faceDown: false, playedRound: zone === 'attack_area' ? 4 : 1 };
  }
  return room;
}

function legacyToken(roomId: string, clientId: string): string {
  let hash = 2166136261;
  for (const char of `${roomId}:${clientId}`) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `reconnect-${(hash >>> 0).toString(36)}`;
}

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
  it('preserves DR-P01 authority through raw WS rejection, replay and authenticated durable restore', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen(0);
    const hub = serverHandle.hub;
    hub.createRoom({ roomId: 'dr-p01-transport', hostClientId: 'host', seed: 20260904 });
    hub.selectSeat('dr-p01-transport', 'host', 1);
    for (let seat = 2; seat <= 7; seat++) {
      hub.joinRoom('dr-p01-transport', { clientId: `human-${seat}`, displayName: `Human ${seat}`, role: 'player' });
      hub.selectSeat('dr-p01-transport', `human-${seat}`, seat);
    }
    hub.startMatch('dr-p01-transport', 'host');
    const room = hub.getRoom('dr-p01-transport');
    const session = room.session!;
    session.state.round.activePhase = 'action';
    session.state.round.prioritySeat = 1;
    for (const player of session.state.players) player.locationId = 'magic_workshop';
    session.state.players[0]!.mana = 10;
    const state = session.state as any;
    state.modeState.cardPlayForbids = [];
    state.modeState.closedLocations = [];
    const wsUrl = `ws://127.0.0.1:${port}/rooms/${room.roomId}?clientId=host&reconnectToken=${room.getIssuedCredential('host')}`;
    const inbox = await connectSocket(wsUrl);
    await inbox.next(message => message.type === 'server:projection');
    const revision = session.getPlayerView('p1').revision;
    for (const [index, invalid] of [null, { type: 'normal_move', locationId: 'magic_workshop' }, { type: 'confirm_staged_attack' }, { type: 'normal_move', locationId: 'invented' }].entries()) {
      const before = session.getState();
      const version = hub.version(room.roomId);
      const requestId = `invalid-${index}`;
      inbox.socket.send(JSON.stringify({ type: 'client:dispatch_command', requestId, expectedRevision: revision, command: invalid }));
      await inbox.next(message => message.type === 'server:error' && message.requestId === requestId);
      expect(session.getState()).toEqual(before);
      expect(hub.version(room.roomId)).toBe(version);
    }
    const move = { type: 'client:dispatch_command', requestId: 'move', expectedRevision: revision, command: { type: 'normal_move', locationId: 'recon', manaCost: 0 } };
    inbox.socket.send(JSON.stringify(move));
    await inbox.next(message => message.type === 'server:projection' && message.projection.match?.view.actionTurn?.movement === 'moved');
    expect(session.state.players[0]!.mana).toBe(5);
    const stable = session.getState();
    inbox.socket.send(JSON.stringify({ ...move, requestId: 'replayed-move' }));
    await inbox.next(message => message.type === 'server:error' && message.requestId === 'replayed-move');
    expect(session.getState()).toEqual(stable);
    const snapshot = room.serializeRoom();
    const forged: any = structuredClone(snapshot);
    forged.session.state.modeState.actionTurns.byPlayer.p1.movement = 'pending';
    const base = `http://127.0.0.1:${port}/rooms/${room.roomId}/restore`;
    const rejected = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(restoreRequest(forged)) });
    expect(rejected.status).toBe(400);
    expect(hub.getRoom(room.roomId)).toBe(room);
    const restored = await postJson<RoomHttpResponse>(base, restoreRequest(snapshot));
    expect(restored.projection.match?.view.actionTurn).toEqual({ movement: 'moved', regularPlay: 'pending' });
    const reconnected = await connectSocket(wsUrl);
    const projected = await reconnected.next(message => message.type === 'server:projection');
    expect(projected.type === 'server:projection' && projected.projection.match?.view.legalActions.some(action => action.type === 'normal_move')).toBe(false);
    inbox.socket.close();
    reconnected.socket.close();
  });
  it('rejects empty/default/invalid HTTP room IDs without replacing the running default room', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    const hub = serverHandle.hub;
    const roomId = hub.createRoom({ hostClientId: 'host' }).roomId;
    hub.selectSeat(roomId, 'host', 1);
    hub.startMatch(roomId, 'host');
    const room = hub.getRoom(roomId);
    const session = room.session;
    const snapshot = structuredClone(room.serializeRoom());
    const scope = room.getPersistenceContext().persistenceScope;
    const version = hub.version(roomId);
    const projection = structuredClone(hub.project(roomId, 'host'));
    for (const roomId of ['', undefined, 'fd-room-20260904', '   ', null, 42, {}, []]) {
      const response = await fetch(`http://127.0.0.1:${port}/rooms`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roomId, hostClientId: 'replacement-host' }),
      });
      expect(response.status).toBe(400);
      const body = await response.text();
      expect(body).not.toContain('reconnectToken');
      expect(body).not.toContain(room.getIssuedCredential('host'));
      expect(hub.getRoom(snapshot.roomId)).toBe(room);
      expect(room.session).toBe(session);
      expect(room.serializeRoom()).toEqual(snapshot);
      expect(room.getPersistenceContext().persistenceScope).toBe(scope);
      expect(hub.version(snapshot.roomId)).toBe(version);
      expect(hub.project(snapshot.roomId, 'host')).toEqual(projection);
    }
  });
  it('blocks RB public-credential and duplicate HTTP identity impersonation without Golden Eater mutation', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    const room = prepareGoldenTransportRoom();
    const base = `http://127.0.0.1:${port}`;
    const guest = await postJson<RoomHttpResponse>(`${base}/rooms/${room.roomId}/join`, { clientId: 'guest', displayName: 'Guest', role: 'spectator' });
    const before = structuredClone(room.serializeRoom());
    const version = serverHandle.hub.version(room.roomId);
    const hostToken = room.getIssuedCredential('host');
    expect(JSON.stringify(guest.projection)).not.toContain('reconnectToken');
    expect(JSON.stringify(guest.projection)).not.toContain(hostToken);
    expect(guest.projection.match?.view.legalActions).toEqual([]);
    const duplicate = await fetch(`${base}/rooms/${room.roomId}/join`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clientId: 'host', displayName: 'Impersonated host', role: 'host' }),
    });
    expect(duplicate.status).toBe(400);
    const duplicateBody = await duplicate.text();
    expect(duplicateBody).not.toContain(hostToken);
    expect(duplicateBody).not.toContain('reconnectToken');
    const recreated = await fetch(`${base}/rooms`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roomId: room.roomId, hostClientId: 'host' }),
    });
    expect(recreated.status).toBe(400);
    const other = await postJson<RoomHttpResponse>(`${base}/rooms`, { roomId: 'cross-room', hostClientId: 'host' });
    for (const token of [legacyToken(room.roomId, 'host'), guest.reconnectToken, other.reconnectToken]) {
      await expect(connectSocket(`ws://127.0.0.1:${port}/rooms/${room.roomId}?clientId=host&reconnectToken=${token}`)).rejects.toThrow('401');
    }
    expect(room.getIssuedCredential('host')).not.toBe(legacyToken(room.roomId, 'host'));
    expect(room.serializeRoom()).toEqual(before);
    expect(serverHandle.hub.version(room.roomId)).toBe(version);
    expect(room.session!.state.abilityRuntime!.pendingDecision).toBeUndefined();
  });

  it('requires authenticated host proof for HTTP restore and never issues credentials on rejection', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    const room = prepareGoldenTransportRoom();
    serverHandle.hub.joinRoom(room.roomId, { clientId: 'guest', displayName: 'Guest', role: 'spectator' });
    const snapshot = structuredClone(room.serializeRoom());
    const version = serverHandle.hub.version(room.roomId);
    for (const proof of [{}, { clientId: 'host', reconnectToken: legacyToken(room.roomId, 'host') }, { clientId: 'guest', reconnectToken: room.getIssuedCredential('guest') }]) {
      const response = await fetch(`http://127.0.0.1:${port}/rooms/${room.roomId}/restore`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snapshot, ...proof }),
      });
      expect(response.status).toBe(400);
      expect(await response.text()).not.toContain(room.getIssuedCredential('host'));
      expect(serverHandle.hub.getRoom(room.roomId)).toBe(room);
      expect(room.serializeRoom()).toEqual(snapshot);
      expect(serverHandle.hub.version(room.roomId)).toBe(version);
    }
  });

  it('rejects raw WS missing/invalid/stale revisions for dispatch and end_turn without mutation or accepted broadcasts', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    const room = prepareGoldenTransportRoom();
    const inbox = await connectSocket(`ws://127.0.0.1:${port}/rooms/${room.roomId}?clientId=host&reconnectToken=${room.getIssuedCredential('host')}`);
    await inbox.next(message => message.type === 'server:projection');
    const before = structuredClone(room.serializeRoom());
    const projection = structuredClone(serverHandle.hub.project(room.roomId, 'host'));
    const version = serverHandle.hub.version(room.roomId);
    const accepted: unknown[] = [];
    inbox.socket.on('message', raw => { const message = JSON.parse(String(raw)); if (message.type !== 'server:error') accepted.push(message); });
    let id = 0;
    for (const value of [undefined, null, '2', -1, 0.5, Number.MAX_SAFE_INTEGER + 1, projection.match!.view.revision - 1]) {
      for (const type of ['client:dispatch_command', 'client:end_turn']) {
        const requestId = `revision-negative-${++id}`;
        inbox.socket.send(JSON.stringify({ type, requestId, expectedRevision: value, command: { type: 'activate_ability', cardInstanceId: goldenEaterSourceInstanceId, abilityId: 'sc-kintoki-3.golden-eater' } }));
        const error = await inbox.next(message => message.type === 'server:error' && message.requestId === requestId);
        expect(error.type).toBe('server:error');
        expect(room.serializeRoom()).toEqual(before);
        expect(serverHandle.hub.project(room.roomId, 'host')).toEqual(projection);
        expect(serverHandle.hub.version(room.roomId)).toBe(version);
      }
    }
    expect(accepted).toEqual([]);
    inbox.socket.send(JSON.stringify({ type: 'client:end_turn', expectedRevision: projection.match!.view.revision }));
    await inbox.next(message => message.type === 'server:projection' && message.version > version);
    expect(room.session!.state.abilityRuntime!.revision).toBeGreaterThan(projection.match!.view.revision);
    inbox.socket.close();
  });

  it('preserves credential-free private pending projections across authenticated Golden Eater reconnect', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    const room = prepareGoldenTransportRoom();
    const guest = await postJson<RoomHttpResponse>(`http://127.0.0.1:${port}/rooms/${room.roomId}/join`, { clientId: 'guest', displayName: 'Guest', role: 'spectator' });
    const hostToken = room.getIssuedCredential('host');
    const hostUrl = `ws://127.0.0.1:${port}/rooms/${room.roomId}?clientId=host&reconnectToken=${hostToken}`;
    const host = await connectSocket(hostUrl);
    await host.next(message => message.type === 'server:projection');
    const spectator = await connectSocket(`ws://127.0.0.1:${port}/rooms/${room.roomId}?clientId=guest&reconnectToken=${guest.reconnectToken}`);
    await spectator.next(message => message.type === 'server:projection');
    host.socket.send(JSON.stringify({ type: 'client:dispatch_command', expectedRevision: room.session!.state.abilityRuntime!.revision,
      command: { type: 'activate_ability', cardInstanceId: goldenEaterSourceInstanceId, abilityId: 'sc-kintoki-3.golden-eater' } }));
    const pending = await host.next(message => message.type === 'server:projection' && !!message.projection.match?.interactionWindows.length);
    const publicPending = await spectator.next(message => message.type === 'server:projection');
    expect(JSON.stringify(publicPending)).not.toContain(hostToken);
    expect(JSON.stringify(publicPending)).not.toContain('reconnectToken');
    if (publicPending.type !== 'server:projection' || pending.type !== 'server:projection') throw new Error('Expected projections');
    expect(publicPending.projection.match?.view.legalActions).toEqual([]);
    expect(publicPending.projection.match?.interactionWindows).toEqual([]);
    const replacement = await connectSocket(hostUrl);
    const recovered = await replacement.next(message => message.type === 'server:projection');
    if (recovered.type !== 'server:projection') throw new Error('Expected recovered projection');
    expect(recovered.projection.match?.interactionWindows).toEqual(pending.projection.match?.interactionWindows);
    expect(JSON.stringify(recovered)).not.toContain('reconnectToken');
    host.socket.close();
    replacement.socket.close();
    spectator.socket.close();
  });
  it('keeps the replacement socket connected until the final same-client socket closes', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    serverHandle.hub.createRoom({ roomId: 'socket-race', hostClientId: 'host' });
    const token = serverHandle.hub.getRoom('socket-race').getIssuedCredential('host');
    const url = `ws://127.0.0.1:${port}/rooms/socket-race?clientId=host&reconnectToken=${token}`;
    const first = await connectSocket(url);
    await first.next((message) => message.type === 'server:projection');
    const second = await connectSocket(url);
    await second.next((message) => message.type === 'server:projection');
    const disconnect = vi.spyOn(serverHandle.hub, 'disconnect');
    const version = serverHandle.hub.version('socket-race');
    first.socket.close();
    await new Promise((resolve) => first.socket.once('close', resolve));
    second.socket.send(JSON.stringify({ type: 'client:request_projection' }));
    const projection = await second.next((message) => message.type === 'server:projection');
    expect(projection.type).toBe('server:projection');
    expect(disconnect).not.toHaveBeenCalled();
    expect(serverHandle.hub.version('socket-race')).toBe(version);
    expect(serverHandle.hub.project('socket-race', 'host').clients.find((client) => client.id === 'host')?.connected).toBe(true);
    second.socket.close();
    await vi.waitFor(() => expect(disconnect).toHaveBeenCalledTimes(1));
    expect(serverHandle.hub.project('socket-race', 'host').clients.find((client) => client.id === 'host')?.connected).toBe(false);
  });

  it('restores connection state if the old close occurs after upgrade validation', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    serverHandle.hub.createRoom({ roomId: 'upgrade-race', hostClientId: 'host' });
    const token = serverHandle.hub.getRoom('upgrade-race').getIssuedCredential('host');
    const handleUpgrade = serverHandle.wss.handleUpgrade.bind(serverHandle.wss);
    vi.spyOn(serverHandle.wss, 'handleUpgrade').mockImplementationOnce((request, socket, head, callback) => {
      serverHandle!.hub.disconnect('upgrade-race', 'host');
      handleUpgrade(request, socket, head, callback);
    });
    const socket = await connectSocket(`ws://127.0.0.1:${port}/rooms/upgrade-race?clientId=host&reconnectToken=${token}`);
    const projection = await socket.next((message) => message.type === 'server:projection');
    if (projection.type !== 'server:projection') throw new Error('Expected projection');
    expect(projection.projection.clients.find((client) => client.id === 'host')?.connected).toBe(true);
    socket.socket.close();
  });

  it.each(['missing', 'wrong-client'] as const)('rejects %s reconnect credentials before registration without mutation', async (variant) => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    serverHandle.hub.createRoom({ roomId: 'credential-race', hostClientId: 'host' });
    serverHandle.hub.joinRoom('credential-race', { clientId: 'guest', displayName: 'Guest' });
    const before = structuredClone(serverHandle.hub.project('credential-race', 'host'));
    const version = serverHandle.hub.version('credential-race');
    const upgrade = vi.spyOn(serverHandle.wss, 'handleUpgrade');
    const tokenQuery = variant === 'missing' ? '' : `&reconnectToken=${serverHandle.hub.getRoom('credential-race').getIssuedCredential('guest')}`;
    await expect(connectSocket(`ws://127.0.0.1:${port}/rooms/credential-race?clientId=host${tokenQuery}`)).rejects.toThrow('401');
    expect(upgrade).not.toHaveBeenCalled();
    expect(serverHandle.hub.project('credential-race', 'host')).toEqual(before);
    expect(serverHandle.hub.version('credential-race')).toBe(version);
  });

  it('disconnects once when all same-client sockets close simultaneously', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    serverHandle.hub.createRoom({ roomId: 'closing-race', hostClientId: 'host' });
    const token = serverHandle.hub.getRoom('closing-race').getIssuedCredential('host');
    const url = `ws://127.0.0.1:${port}/rooms/closing-race?clientId=host&reconnectToken=${token}`;
    const first = await connectSocket(url);
    await first.next((message) => message.type === 'server:projection');
    const second = await connectSocket(url);
    await second.next((message) => message.type === 'server:projection');
    const disconnect = vi.spyOn(serverHandle.hub, 'disconnect');
    const version = serverHandle.hub.version('closing-race');
    const closed = [first, second].map((inbox) => new Promise<void>((resolve) => inbox.socket.once('close', () => resolve())));
    for (const socket of serverHandle.wss.clients) socket.close();
    await Promise.all(closed);
    await vi.waitFor(() => expect(serverHandle!.wss.clients.size).toBe(0));
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(serverHandle.hub.version('closing-race')).toBe(version + 1);
    expect(serverHandle.hub.project('closing-race', 'host').clients.find((client) => client.id === 'host')?.connected).toBe(false);
    const reconnected = await connectSocket(url);
    await reconnected.next((message) => message.type === 'server:projection');
    expect(serverHandle.hub.project('closing-race', 'host').clients.find((client) => client.id === 'host')?.connected).toBe(true);
    reconnected.socket.close();
    await vi.waitFor(() => expect(disconnect).toHaveBeenCalledTimes(2));
  });

  it('does not count another room or client as a surviving connection', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    const firstRoom = serverHandle.hub.createRoom({ roomId: 'socket-scope-a', hostClientId: 'host' });
    const secondRoom = serverHandle.hub.createRoom({ roomId: 'socket-scope-b', hostClientId: 'host' });
    const guest = serverHandle.hub.joinRoom('socket-scope-a', { clientId: 'guest', displayName: 'Guest' });
    const connect = async (roomId: string, clientId: string, projection: typeof firstRoom) => {
      const token = serverHandle!.hub.getRoom(projection.roomId).getIssuedCredential(clientId);
      const inbox = await connectSocket(`ws://127.0.0.1:${port}/rooms/${roomId}?clientId=${clientId}&reconnectToken=${token}`);
      await inbox.next((message) => message.type === 'server:projection');
      return inbox;
    };
    const first = await connect('socket-scope-a', 'host', firstRoom);
    const second = await connect('socket-scope-b', 'host', secondRoom);
    const otherClient = await connect('socket-scope-a', 'guest', guest);
    first.socket.close();
    await vi.waitFor(() => expect(serverHandle!.hub.project('socket-scope-a', 'host').clients.find((client) => client.id === 'host')?.connected).toBe(false));
    expect(serverHandle.hub.project('socket-scope-b', 'host').clients.find((client) => client.id === 'host')?.connected).toBe(true);
    expect(serverHandle.hub.project('socket-scope-a', 'guest').clients.find((client) => client.id === 'guest')?.connected).toBe(true);
    second.socket.close();
    otherClient.socket.close();
  });

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
    const restored = await postJson<RoomHttpResponse>(`${httpBase}/rooms/restore-room/restore`, restoreRequest(snapshot));
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
      humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2'], ...room.getPersistenceContext(), restorePackKind: 'trusted_authoring_fixture',
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
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(restoreRequest(mixedPrefix)),
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
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(restoreRequest(forged)),
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
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(restoreRequest(malformed)),
    });
    expect(malformedResponse.status).toBe(400);
    const malformedBody = await malformedResponse.json() as { code: string; message: string };
    expect(malformedBody).toEqual({ code: 'bad_request', message: 'Invalid FB2-49 replay snapshot container' });
    expect(serverHandle.hub.getRoom('fb2-49-http-guard')).toBe(beforeRoom);
    expect(serverHandle.hub.version('fb2-49-http-guard')).toBe(beforeVersion);

    const malformedTopLevel: any = structuredClone(beforeRoom.serializeRoom());
    malformedTopLevel.session.state.players = [null];
    const malformedTopLevelResponse = await fetch(`${httpBase}/rooms/fb2-49-http-guard/restore`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(restoreRequest(malformedTopLevel)),
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
    for (const field of ['definitionHash', 'contentIdentity', 'decks', 'fallbackCommandSpells', 'sourceMap']) {
      delete malformed.session.state.abilityRuntime.pack[field];
    }

    const response = await fetch(`${httpBase}/rooms/pack-http-guard/restore`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(restoreRequest(malformed)),
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
    for (const projection of [hostProjection.projection, p2Projection.projection]) {
      expect(JSON.stringify(projection)).not.toContain('reconnectToken');
      expect(JSON.stringify(projection)).not.toContain(host.reconnectToken);
      expect(JSON.stringify(projection)).not.toContain(playerTwo.reconnectToken);
    }
    expect(hostPrivateCards.some(id => p2Projection.projection.match?.view.cards.some(card => card.instanceId === id))).toBe(false);
    expect(p2PrivateCards.some(id => hostProjection.projection.match?.view.cards.some(card => card.instanceId === id))).toBe(false);

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
