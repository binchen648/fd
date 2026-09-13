import { expect, test, type APIRequestContext, type Browser, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';
import {
  buildLifecycleSourceActiveSnapshot,
  lifecycleCloseAbilityId,
  lifecycleHostClientId,
  lifecycleObserverClientId,
  lifecyclePrivateDiscardId,
  lifecycleSourceCardId,
} from './support/build-lifecycle-source-active-snapshot';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';

test('persists source-active lifecycle across browser reconnect and removes public discard projection atomically on external close', async ({ browser, request }) => {
  const roomId = `fd-lifecycle-${Date.now()}`;
  const snapshot = buildLifecycleSourceActiveSnapshot(roomId);
  const host = await restoreLifecycleRoom(request, snapshot);
  const observer = responseForSnapshotClient(snapshot, lifecycleObserverClientId);
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const observerPage = await context.newPage();
  const hostProjections: MatchRoomProjection[] = [];
  const observerProjections: MatchRoomProjection[] = [];
  const hostErrors: ServerRoomMessage[] = [];
  observeRoomSocket(hostPage, hostProjections, hostErrors);
  observeRoomSocket(observerPage, observerProjections, []);

  await openRemoteRoom(hostPage, host);
  await openRemoteRoom(observerPage, observer);
  await expect.poll(() => latestMatch(hostProjections)?.phase).toBe('action');
  await expect.poll(() => latestMatch(observerProjections)?.phase).toBe('action');
  expect(hasProjectedCard(observerProjections, lifecyclePrivateDiscardId)).toBe(false);

  const playRevision = latestMatch(hostProjections)?.view.revision;
  expect(playRevision).toEqual(expect.any(Number));
  const playMessage: ClientRoomMessage = {
    type: 'client:dispatch_command',
    expectedRevision: playRevision,
    command: { type: 'play_card', cardInstanceId: lifecycleSourceCardId },
  };
  await sendRoomMessage(hostPage, roomId, host, playMessage);

  await expect.poll(() => hasProjectedCard(observerProjections, lifecyclePrivateDiscardId)).toBe(true);
  expect(projectedCard(observerProjections, lifecyclePrivateDiscardId)).toMatchObject({
    instanceId: lifecyclePrivateDiscardId,
    definitionId: 'basic.luck',
    zone: 'discard',
  });
  const revisionAfterPlay = latestMatch(hostProjections)?.view.revision;
  expect(revisionAfterPlay).toBeGreaterThan(playRevision!);

  await hostPage.reload();
  await observerPage.reload();
  await expect.poll(() => latestMatch(hostProjections)?.view.revision).toBe(revisionAfterPlay);
  await expect.poll(() => latestMatch(observerProjections)?.view.revision).toBe(revisionAfterPlay);
  await expect.poll(() => hasProjectedCard(observerProjections, lifecyclePrivateDiscardId)).toBe(true);

  const closeMessage: ClientRoomMessage = {
    type: 'client:dispatch_command',
    expectedRevision: revisionAfterPlay,
    command: {
      type: 'activate_ability',
      cardInstanceId: lifecycleSourceCardId,
      abilityId: lifecycleCloseAbilityId,
    },
  };
  await sendRoomMessage(hostPage, roomId, host, closeMessage);

  await expect.poll(() => latestMatch(hostProjections)?.view.revision).toBeGreaterThan(revisionAfterPlay!);
  await expect.poll(() => hasProjectedCard(observerProjections, lifecyclePrivateDiscardId)).toBe(false);
  await expect.poll(() => hasProjectedCard(observerProjections, lifecycleSourceCardId)).toBe(false);
  const revisionAfterClose = latestMatch(hostProjections)?.view.revision;

  const staleErrorCount = hostErrors.length;
  await sendRoomMessage(hostPage, roomId, host, closeMessage);
  await expect.poll(() => hostErrors.length).toBeGreaterThan(staleErrorCount);
  expect(hostErrors.at(-1)).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('Stale command revision'),
  });
  await expect.poll(() => latestMatch(hostProjections)?.view.revision).toBe(revisionAfterClose);
  expect(hasProjectedCard(observerProjections, lifecyclePrivateDiscardId)).toBe(false);

  await context.close();
});

async function restoreLifecycleRoom(request: APIRequestContext, snapshot: MatchRoomSnapshot): Promise<RoomHttpResponse> {
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(snapshot.roomId)}/restore`, { data: { snapshot } });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

function responseForSnapshotClient(snapshot: MatchRoomSnapshot, clientId: string): RoomHttpResponse {
  const client = snapshot.clients.find((candidate) => candidate.id === clientId);
  if (!client) throw new Error(`Missing snapshot client ${clientId}`);
  return { roomId: snapshot.roomId, clientId, reconnectToken: client.reconnectToken, projection: null as never };
}

function observeRoomSocket(page: Page, projections: MatchRoomProjection[], errors: ServerRoomMessage[]): void {
  page.on('websocket', (socket: PlaywrightWebSocket) => {
    socket.on('framereceived', (frame) => {
      const parsed = parseJson(frame.payload);
      if (parsed?.type === 'server:projection') projections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection);
      if (parsed?.type === 'server:error') errors.push(parsed as ServerRoomMessage);
    });
  });
}

async function sendRoomMessage(page: Page, roomId: string, client: Pick<RoomHttpResponse, 'clientId' | 'reconnectToken'>, message: ClientRoomMessage): Promise<void> {
  await page.evaluate(({ targetRoomId, clientId, token, payload }) => new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('error', () => reject(new Error('room websocket failed')));
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify(payload));
      setTimeout(() => { socket.close(); resolve(); }, 50);
    });
  }), { targetRoomId: roomId, clientId: client.clientId, token: client.reconnectToken, payload: message });
}

async function openRemoteRoom(page: Page, response: Pick<RoomHttpResponse, 'roomId' | 'clientId' | 'reconnectToken'>): Promise<void> {
  const params = new URLSearchParams({
    remote: '1', roomId: response.roomId, clientId: response.clientId, token: response.reconnectToken, http: httpBase, ws: wsBase,
  });
  await page.goto(`/?${params.toString()}`);
}

function parseJson(payload: string | Buffer): Record<string, unknown> | undefined {
  try { return JSON.parse(String(payload)) as Record<string, unknown>; } catch { return undefined; }
}

function latestMatch(projections: MatchRoomProjection[]) { return projections.at(-1)?.match; }
function projectedCard(projections: MatchRoomProjection[], instanceId: string) {
  return latestMatch(projections)?.view.cards.find((card) => card.instanceId === instanceId);
}
function hasProjectedCard(projections: MatchRoomProjection[], instanceId: string): boolean {
  return projectedCard(projections, instanceId) !== undefined;
}
