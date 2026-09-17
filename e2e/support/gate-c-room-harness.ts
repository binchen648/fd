import { expect, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type {
  ClientRoomMessage,
  MatchRoomProjection,
  MatchRoomSnapshot,
  RoomHttpResponse,
  ServerRoomMessage,
} from '@fd/rules';

export const gateCHttpBase = 'http://127.0.0.1:8787';
export const gateCWsBase = 'ws://127.0.0.1:8787';

export type GateCRoomClient = Pick<RoomHttpResponse, 'roomId' | 'clientId' | 'reconnectToken'>;
export type GateCServerError = Extract<ServerRoomMessage, { type: 'server:error' }>;

export interface GateCRoomTrace {
  sentMessages: ClientRoomMessage[];
  projections: MatchRoomProjection[];
  errors: GateCServerError[];
}

export interface GateCEndpoints {
  httpBase?: string;
  wsBase?: string;
}

export function observeGateCRoomSocket(page: Page): GateCRoomTrace {
  const trace: GateCRoomTrace = { sentMessages: [], projections: [], errors: [] };
  page.on('websocket', (socket: PlaywrightWebSocket) => {
    socket.on('framesent', (frame) => {
      const parsed = parseGateCJson(frame.payload);
      if (typeof parsed?.type === 'string' && parsed.type.startsWith('client:')) {
        trace.sentMessages.push(parsed as ClientRoomMessage);
      }
    });
    socket.on('framereceived', (frame) => {
      const parsed = parseGateCJson(frame.payload);
      if (parsed?.type === 'server:projection') {
        trace.projections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection);
      }
      if (parsed?.type === 'server:error') trace.errors.push(parsed as GateCServerError);
    });
  });
  return trace;
}

export async function restoreGateCRoomSnapshot(
  request: APIRequestContext,
  snapshot: MatchRoomSnapshot,
  endpoints: GateCEndpoints = {},
): Promise<RoomHttpResponse> {
  const httpBase = endpoints.httpBase ?? gateCHttpBase;
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(snapshot.roomId)}/restore`, {
    data: { snapshot },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

export function gateCClientFromSnapshot(snapshot: MatchRoomSnapshot, clientId: string): GateCRoomClient {
  const client = snapshot.clients.find((candidate) => candidate.id === clientId);
  if (!client) throw new Error(`Missing snapshot client ${clientId}`);
  return { roomId: snapshot.roomId, clientId, reconnectToken: client.reconnectToken };
}

export async function openGateCRemoteRoom(
  page: Page,
  client: GateCRoomClient,
  endpoints: GateCEndpoints = {},
): Promise<void> {
  const params = new URLSearchParams({
    remote: '1',
    roomId: client.roomId,
    clientId: client.clientId,
    token: client.reconnectToken,
    http: endpoints.httpBase ?? gateCHttpBase,
    ws: endpoints.wsBase ?? gateCWsBase,
  });
  await page.goto(`/?${params.toString()}`);
}

export async function sendGateCRoomMessage(
  page: Page,
  client: GateCRoomClient,
  message: ClientRoomMessage,
  endpoints: GateCEndpoints = {},
): Promise<void> {
  await page.evaluate(({ wsBase, roomId, clientId, token, payload }) => new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(`${wsBase}/rooms/${encodeURIComponent(roomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('error', () => reject(new Error('room websocket failed')));
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify(payload));
      setTimeout(() => {
        socket.close();
        resolve();
      }, 50);
    });
  }), {
    wsBase: endpoints.wsBase ?? gateCWsBase,
    roomId: client.roomId,
    clientId: client.clientId,
    token: client.reconnectToken,
    payload: message,
  });
}

export function latestGateCMatch(trace: GateCRoomTrace) {
  return trace.projections.at(-1)?.match;
}

export async function reloadGateCRoomAndWaitForRevision(
  page: Page,
  trace: GateCRoomTrace,
  expectedRevision: number,
): Promise<void> {
  const projectionCountBeforeReload = trace.projections.length;
  await page.reload();
  await expect.poll(() => trace.projections.length).toBeGreaterThan(projectionCountBeforeReload);
  await expect.poll(() => latestGateCMatch(trace)?.view.revision).toBe(expectedRevision);
}

export async function expectStaleGateCRoomMessageRejected(
  page: Page,
  client: GateCRoomClient,
  staleMessage: ClientRoomMessage,
  trace: GateCRoomTrace,
  authoritativeRevision: number,
  endpoints: GateCEndpoints = {},
): Promise<GateCServerError> {
  const before = trace.errors.length;
  await sendGateCRoomMessage(page, client, staleMessage, endpoints);
  await expect.poll(() => trace.errors.length).toBeGreaterThan(before);
  const error = trace.errors.at(-1);
  expect(error).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('Stale command revision'),
  });
  await expect.poll(() => latestGateCMatch(trace)?.view.revision).toBe(authoritativeRevision);
  return error!;
}

export function parseGateCJson(payload: string | Buffer): Record<string, unknown> | undefined {
  try {
    return JSON.parse(String(payload)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
