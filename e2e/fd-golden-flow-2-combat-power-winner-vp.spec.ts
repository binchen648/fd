import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';
import { buildGoldenFlow2Snapshot } from './support/build-golden-flow-2-snapshot';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';

test('runs Golden Flow 2 through browser end-turn, server battle/scoring, reconnect, and stale rejection', async ({ page, request }) => {
  const roomId = `fd-golden-flow-2-${Date.now()}`;
  const room = await restoreGoldenFlow2Room(request, roomId);
  const sentMessages: ClientRoomMessage[] = [];
  const projections: MatchRoomProjection[] = [];
  const serverErrors: ServerRoomMessage[] = [];

  page.on('websocket', (socket: PlaywrightWebSocket) => {
    socket.on('framesent', (frame) => {
      const parsed = parseJson(frame.payload);
      if (parsed?.type === 'client:end_turn') sentMessages.push(parsed as ClientRoomMessage);
    });
    socket.on('framereceived', (frame) => {
      const parsed = parseJson(frame.payload);
      if (parsed?.type === 'server:projection') {
        projections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection);
      }
      if (parsed?.type === 'server:error') serverErrors.push(parsed as ServerRoomMessage);
    });
  });

  await openRemoteRoom(page, room);
  await expect.poll(() => latestMatch(projections)?.phase).toBe('action');
  await expect.poll(() => latestMatch(projections)?.priorityPlayerId).toBe('p5');
  const expectedRevision = latestMatch(projections)?.view.revision;
  expect(expectedRevision).toEqual(expect.any(Number));
  expect(latestMatch(projections)?.battleBreakdowns).toEqual([]);

  const endButton = page.getByRole('button', { name: '结束行动', exact: true });
  await expect(endButton).toBeVisible();
  await endButton.click();
  const reminder = page.getByRole('alertdialog');
  if (await reminder.isVisible().catch(() => false)) {
    const forceEnd = reminder.getByRole('button', { name: /仍然结束/ });
    if (await forceEnd.isVisible().catch(() => false)) await forceEnd.click();
  }

  await expect.poll(() => latestMatch(projections)?.phase).toBe('round_end');
  const command = sentMessages.find((message): message is Extract<ClientRoomMessage, { type: 'client:end_turn' }> =>
    message.type === 'client:end_turn');
  expect(command).toMatchObject({ type: 'client:end_turn', expectedRevision });

  const settled = latestMatch(projections)!;
  expect(settled.battleBreakdowns).toHaveLength(1);
  expect(settled.battleBreakdowns[0]).toMatchObject({
    battlefieldId: 'miyama_town',
    winnerPlayerIds: ['p1'],
    tied: false,
    winnerPlayerId: 'p1',
    margin: 1,
    vpReward: 5,
    baseVpPerWinner: 7,
    eventVpPool: 5,
    competitionVpPool: 2,
    participantBreakdowns: [
      expect.objectContaining({ playerId: 'p1', basePower: 5, totalModifier: 0, effectivePower: 5 }),
      expect.objectContaining({ playerId: 'p2', basePower: 4, totalModifier: 0, effectivePower: 4 }),
    ],
  });
  expect(player(settled, 'p1')?.vp).toBe(7);
  expect(player(settled, 'p2')?.vp).toBe(0);
  const settledRevision = settled.view.revision;

  await page.reload();
  await expect.poll(() => latestMatch(projections)?.phase).toBe('round_end');
  await expect.poll(() => player(latestMatch(projections), 'p1')?.vp).toBe(7);
  expect(latestMatch(projections)?.battleBreakdowns).toHaveLength(1);
  expect(latestMatch(projections)?.view.revision).toBe(settledRevision);

  const staleErrorCount = serverErrors.length;
  await page.evaluate(({ roomId: targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, {
    roomId,
    clientId: room.clientId,
    token: room.reconnectToken,
    message: command!,
  });

  await expect.poll(() => serverErrors.length).toBeGreaterThan(staleErrorCount);
  expect(serverErrors.at(-1)).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('Stale command revision'),
  });
  await expect.poll(() => player(latestMatch(projections), 'p1')?.vp).toBe(7);
  expect(latestMatch(projections)?.battleBreakdowns).toHaveLength(1);
  expect(latestMatch(projections)?.view.revision).toBe(settledRevision);
});

async function restoreGoldenFlow2Room(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, {
    data: { snapshot: buildGoldenFlow2Snapshot(roomId) },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

async function openRemoteRoom(page: Page, response: RoomHttpResponse): Promise<void> {
  const params = new URLSearchParams({
    remote: '1',
    roomId: response.roomId,
    clientId: response.clientId,
    token: response.reconnectToken,
    http: httpBase,
    ws: wsBase,
  });
  await page.goto(`/?${params.toString()}`);
}

function parseJson(payload: string | Buffer): Record<string, unknown> | undefined {
  try {
    return JSON.parse(String(payload)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function latestMatch(projections: MatchRoomProjection[]) {
  return projections.at(-1)?.match;
}

function player(match: NonNullable<MatchRoomProjection['match']> | undefined, playerId: string) {
  return match?.view.players.find((candidate) => candidate.id === playerId);
}
