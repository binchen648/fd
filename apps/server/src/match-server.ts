import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import {
  createMatchRoomHub,
  restoreMatchRoom,
  type ClientRoomMessage,
  type CreateRoomHttpRequest,
  type JoinRoomHttpRequest,
  type MatchRoomHub,
  type MatchRoomProjection,
  type PersistedRoomHttpRequest,
  type RoomHttpResponse,
  type ServerRoomMessage,
} from '@fd/rules';

interface ClientSocket {
  roomId: string;
  clientId: string;
  socket: WebSocket;
}

export interface MatchServerHandle {
  hub: MatchRoomHub;
  server: Server;
  wss: WebSocketServer;
  listen(port?: number): Promise<number>;
  close(): Promise<void>;
}

function readBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown);
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  response.end(JSON.stringify(payload));
}

function roomResponse(projection: MatchRoomProjection): RoomHttpResponse {
  const client = projection.clients.find((candidate) => candidate.id === projection.viewer.clientId);
  if (!client) throw new Error(`Projection is missing viewer client ${projection.viewer.clientId}`);
  return {
    roomId: projection.roomId,
    clientId: client.id,
    reconnectToken: client.reconnectToken,
    projection,
  };
}

function parseRoomPath(pathname: string): { roomId: string; action: 'join' | 'restore' } | undefined {
  const match = pathname.match(/^\/rooms\/([^/]+)\/(join|restore)$/);
  if (!match) return undefined;
  return { roomId: decodeURIComponent(match[1]!), action: match[2] as 'join' | 'restore' };
}

export function createMatchServer(input: { hub?: MatchRoomHub } = {}): MatchServerHandle {
  const hub = input.hub ?? createMatchRoomHub();
  const sockets = new Set<ClientSocket>();

  const broadcastRoom = (roomId: string, event: string) => {
    for (const clientSocket of sockets) {
      if (clientSocket.roomId !== roomId || clientSocket.socket.readyState !== WebSocket.OPEN) continue;
      const projection = hub.project(roomId, clientSocket.clientId);
      sendSocket(clientSocket.socket, {
        type: 'server:projection',
        roomId,
        version: hub.version(roomId),
        projection,
      });
      sendSocket(clientSocket.socket, {
        type: 'server:room_event',
        roomId,
        version: hub.version(roomId),
        event,
      });
    }
  };

  const server = createServer(async (request, response) => {
    try {
      if (request.method === 'OPTIONS') {
        sendJson(response, 204, {});
        return;
      }
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      if (request.method === 'GET' && requestUrl.pathname === '/health') {
        sendJson(response, 200, { ok: true });
        return;
      }
      if (request.method === 'POST' && requestUrl.pathname === '/rooms') {
        const body = await readBody(request) as CreateRoomHttpRequest;
        const projection = hub.createRoom({
          ...(body.roomId ? { roomId: body.roomId } : {}),
          ...(body.seed !== undefined ? { seed: body.seed } : {}),
          ...(body.hostClientId ? { hostClientId: body.hostClientId } : {}),
          ...(body.hostName ? { hostName: body.hostName } : {}),
        });
        sendJson(response, 201, roomResponse(projection));
        return;
      }
      const roomPath = parseRoomPath(requestUrl.pathname);
      if (request.method === 'POST' && roomPath?.action === 'join') {
        const body = await readBody(request) as JoinRoomHttpRequest;
        const projection = hub.joinRoom(roomPath.roomId, body);
        sendJson(response, 200, roomResponse(projection));
        broadcastRoom(roomPath.roomId, 'client_joined');
        return;
      }
      if (request.method === 'POST' && roomPath?.action === 'restore') {
        const body = await readBody(request) as PersistedRoomHttpRequest;
        const room = restoreMatchRoom(body.snapshot);
        hub.restore({ version: 1, rooms: [room.serializeRoom()] });
        const projection = hub.project(room.roomId, room.hostClientId);
        sendJson(response, 200, roomResponse(projection));
        broadcastRoom(room.roomId, 'room_restored');
        return;
      }
      sendJson(response, 404, { code: 'not_found', message: 'Unknown route' });
    } catch (error) {
      sendJson(response, 400, {
        code: 'bad_request',
        message: error instanceof Error ? error.message : 'Request failed',
      });
    }
  });

  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (request, socket, head) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const match = requestUrl.pathname.match(/^\/rooms\/([^/]+)$/);
      if (!match) throw new Error('Unknown websocket route');
      const roomId = decodeURIComponent(match[1]!);
      const clientId = requestUrl.searchParams.get('clientId');
      const reconnectToken = requestUrl.searchParams.get('reconnectToken');
      if (!clientId) throw new Error('clientId is required');
      if (reconnectToken) hub.reconnect(roomId, reconnectToken);
      hub.project(roomId, clientId);
      wss.handleUpgrade(request, socket, head, (websocket) => {
        wss.emit('connection', websocket, request, roomId, clientId);
      });
    } catch (error) {
      socket.write(`HTTP/1.1 401 Unauthorized\r\n\r\n${error instanceof Error ? error.message : 'Unauthorized'}`);
      socket.destroy();
    }
  });

  wss.on('connection', (socket: WebSocket, _request: IncomingMessage, roomId: string, clientId: string) => {
    const clientSocket = { roomId, clientId, socket };
    sockets.add(clientSocket);
    sendSocket(socket, {
      type: 'server:projection',
      roomId,
      version: hub.version(roomId),
      projection: hub.project(roomId, clientId),
    });

    socket.on('message', (raw) => {
      const message = parseSocketMessage(raw);
      if (!message) {
        sendSocket(socket, { type: 'server:error', roomId, code: 'bad_message', message: 'Invalid JSON message' });
        return;
      }
      try {
        handleClientMessage(hub, roomId, clientId, message);
        broadcastRoom(roomId, message.type);
      } catch (error) {
        sendSocket(socket, {
          type: 'server:error',
          ...(message.requestId ? { requestId: message.requestId } : {}),
          roomId,
          code: 'command_failed',
          message: error instanceof Error ? error.message : 'Command failed',
        });
      }
    });

    socket.on('close', () => {
      sockets.delete(clientSocket);
      try {
        hub.disconnect(roomId, clientId);
        broadcastRoom(roomId, 'client_disconnected');
      } catch {
        // The room may have been restored or removed while the socket was open.
      }
    });
  });

  return {
    hub,
    server,
    wss,
    listen(port = 0) {
      return new Promise((resolve) => {
        server.listen(port, '127.0.0.1', () => {
          const address = server.address();
          resolve(typeof address === 'object' && address ? address.port : port);
        });
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        for (const socket of sockets) socket.socket.close();
        wss.close((wssError) => {
          if (wssError) {
            reject(wssError);
            return;
          }
          server.close((serverError) => {
            if (serverError) reject(serverError);
            else resolve();
          });
        });
      });
    },
  };
}

function handleClientMessage(hub: MatchRoomHub, roomId: string, clientId: string, message: ClientRoomMessage): void {
  if (message.type === 'client:select_seat') {
    hub.selectSeat(roomId, clientId, message.seat);
    return;
  }
  if (message.type === 'client:start_match') {
    hub.startMatch(roomId, clientId);
    return;
  }
  if (message.type === 'client:dispatch_command') {
    hub.dispatchCommand(roomId, clientId, message.command);
    return;
  }
  if (message.type === 'client:consume_directive') {
    hub.consumeDirective(roomId, clientId, message.directiveId);
    return;
  }
  if (message.type === 'client:restore_replay') {
    hub.restoreReplay(roomId, clientId, message.checkpointId);
  }
}

function parseSocketMessage(raw: RawData): ClientRoomMessage | undefined {
  try {
    const text = Array.isArray(raw) ? Buffer.concat(raw).toString('utf8') : Buffer.from(raw as Buffer).toString('utf8');
    return JSON.parse(text) as ClientRoomMessage;
  } catch {
    return undefined;
  }
}

function sendSocket(socket: WebSocket, message: ServerRoomMessage): void {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}
