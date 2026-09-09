import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createMatchSession, type RoomHttpResponse, type ServerRoomMessage } from '@fd/rules';

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
  it('rejects missing expectedRevision mutation commands before mutating a room', async () => {
    serverHandle = createMatchServer();
    const port = await serverHandle.listen();
    const httpBase = `http://127.0.0.1:${port}`;
    const wsBase = `ws://127.0.0.1:${port}`;

    const host = await postJson<RoomHttpResponse>(`${httpBase}/rooms`, {
      roomId: 'missing-revision-room',
      hostClientId: 'host-missing-revision',
      hostName: 'Host',
      seed: 20260905,
    });
    const hostSocket = await connectSocket(`${wsBase}/rooms/missing-revision-room?clientId=host-missing-revision&reconnectToken=${host.reconnectToken}`);
    await hostSocket.next((message) => message.type === 'server:projection');
    hostSocket.socket.send(JSON.stringify({ type: 'client:select_seat', seat: 5 }));
    await hostSocket.next((message) => message.type === 'server:projection' && message.projection.seats[4]?.clientId === 'host-missing-revision');
    hostSocket.socket.send(JSON.stringify({ type: 'client:start_match' }));
    let projection = await hostSocket.next((message) => message.type === 'server:projection' && message.projection.status === 'running');
    expect(projection.type).toBe('server:projection');
    if (projection.type !== 'server:projection') return;

    const preparationRevision = projection.projection.match?.view.revision;
    hostSocket.socket.send(JSON.stringify({ type: 'client:end_turn', requestId: 'missing-end' }));
    const missingEnd = await hostSocket.next((message) => message.type === 'server:error' && message.requestId === 'missing-end');
    expect(missingEnd.type).toBe('server:error');
    if (missingEnd.type === 'server:error') expect(missingEnd.message).toContain('missing_expected_revision');
    hostSocket.socket.send(JSON.stringify({ type: 'client:request_projection' }));
    projection = await hostSocket.next((message) => message.type === 'server:projection' && message.projection.match?.view.revision === preparationRevision);
    expect(projection.type).toBe('server:projection');

    hostSocket.socket.send(JSON.stringify({ type: 'client:end_turn', requestId: 'end-prep', expectedRevision: preparationRevision }));
    projection = await hostSocket.next((message) => message.type === 'server:projection' && message.projection.match?.phase === 'advance');
    expect(projection.type).toBe('server:projection');
    if (projection.type !== 'server:projection') return;
    hostSocket.socket.send(JSON.stringify({ type: 'client:end_turn', requestId: 'end-advance', expectedRevision: projection.projection.match?.view.revision }));
    projection = await hostSocket.next((message) => message.type === 'server:projection' && message.projection.match?.phase === 'action');
    expect(projection.type).toBe('server:projection');
    if (projection.type !== 'server:projection') return;
    const actionRevision = projection.projection.match?.view.revision;
    const beforePlayer = projection.projection.match?.view.players.find((player) => player.id === 'p5');
    const logCount = projection.projection.match?.logs.length ?? 0;

    hostSocket.socket.send(JSON.stringify({
      type: 'client:dispatch_command',
      requestId: 'missing-dispatch',
      command: {
        type: 'activate_ability',
        cardInstanceId: 'p5-master.gatou.command-spell',
        abilityId: 'command-spell.gain-mana',
      },
    }));
    const missingDispatch = await hostSocket.next((message) => message.type === 'server:error' && message.requestId === 'missing-dispatch');
    expect(missingDispatch.type).toBe('server:error');
    if (missingDispatch.type === 'server:error') expect(missingDispatch.message).toContain('missing_expected_revision');
    hostSocket.socket.send(JSON.stringify({ type: 'client:request_projection' }));
    const afterMissing = await hostSocket.next((message) =>
      message.type === 'server:projection' &&
      message.projection.match?.phase === 'action' &&
      message.projection.match?.view.revision === actionRevision);
    expect(afterMissing.type).toBe('server:projection');
    if (afterMissing.type === 'server:projection') {
      const afterPlayer = afterMissing.projection.match?.view.players.find((player) => player.id === 'p5');
      expect(afterPlayer?.mana).toBe(beforePlayer?.mana);
      expect(afterPlayer?.commandSpells).toBe(beforePlayer?.commandSpells);
      expect(afterMissing.projection.match?.logs).toHaveLength(logCount);
    }
    hostSocket.socket.close();
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
