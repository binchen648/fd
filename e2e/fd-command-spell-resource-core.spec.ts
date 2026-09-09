import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';

test('routes command spell gain mana through browser, required WS revision, projection, reconnect, and stale rejection', async ({ page, request }) => {
  const roomId = `fd-command-spell-${Date.now()}`;
  const room = await createRoom(request, roomId);
  const sentMessages: ClientRoomMessage[] = [];
  const receivedProjections: MatchRoomProjection[] = [];
  const serverErrors: ServerRoomMessage[] = [];

  page.on('websocket', (socket: PlaywrightWebSocket) => {
    socket.on('framesent', (frame) => {
      const parsed = parseJson(frame.payload);
      if (parsed?.type === 'client:dispatch_command' || parsed?.type === 'client:end_turn') sentMessages.push(parsed as ClientRoomMessage);
    });
    socket.on('framereceived', (frame) => {
      const parsed = parseJson(frame.payload);
      if (parsed?.type === 'server:projection') receivedProjections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection);
      if (parsed?.type === 'server:error') serverErrors.push(parsed as ServerRoomMessage);
    });
  });

  await openRemoteRoom(page, room);
  await expect(page.getByLabel('远程对局房间')).toContainText('lobby');
  await page.getByLabel('远程七人选座').locator('button').nth(4).click();
  await page.getByRole('button', { name: '开始' }).click();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');

  const workbench = page.getByRole('region', { name: '本人操作台', exact: true });
  await expect(workbench).toContainText('master.gatou');
  await expect(page.getByRole('button', { name: '完成准备' })).toBeVisible();
  await endCurrentDecision(page);
  await expect.poll(() => receivedProjections.at(-1)?.match?.phase).toBe('advance');
  await endCurrentDecision(page);
  await expect.poll(() => receivedProjections.at(-1)?.match?.phase).toBe('action');
  await expect(page.getByRole('button', { name: '结束行动', exact: true })).toBeVisible();
  await expect(workbench).toContainText('令咒区 · 1 张');

  const before = latestSelfPlayer(receivedProjections);
  expect(before?.commandSpells).toBe(3);
  expect(before?.mana).toEqual(expect.any(Number));
  const expectedMana = Math.min(12, before!.mana + 4);
  const actualManaDelta = expectedMana - before!.mana;
  const expectedRevision = receivedProjections.at(-1)?.match?.view.revision;
  expect(expectedRevision).toEqual(expect.any(Number));

  await page.getByRole('button', { name: /检视 master\.gatou\.command-spell/ }).click();
  await expect(page.getByRole('dialog', { name: 'master.gatou.command-spell' })).toBeVisible();
  await page.getByRole('button', { name: /发动能力 command-spell\.gain-mana/ }).click();

  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(expectedMana);
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.commandSpells).toBe(2);
  const command = sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'activate_ability' &&
    message.command.abilityId === 'command-spell.gain-mana');
  expect(command).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision,
    command: {
      type: 'activate_ability',
      cardInstanceId: 'p5-master.gatou.command-spell',
      abilityId: 'command-spell.gain-mana',
    },
  });

  const projectedAfterCommand = receivedProjections.find((projection) => latestSelfPlayer([projection])?.mana === expectedMana);
  expect(projectedAfterCommand?.match?.logs).toContainEqual(expect.objectContaining({
    type: 'dispatch_ok',
    payload: expect.objectContaining({
      events: expect.arrayContaining([
        expect.objectContaining({
          type: 'mana_adjusted',
          sourceAbilityId: 'command-spell.gain-mana',
          controllerId: 'p5',
          resource: 'mana',
          delta: actualManaDelta,
          before: before!.mana,
          after: expectedMana,
          resultId: expect.any(String),
          revision: expectedRevision,
        }),
        expect.objectContaining({
          type: 'command_seals_adjusted',
          sourceAbilityId: 'command-spell.gain-mana',
          controllerId: 'p5',
          resource: 'command_seals',
          delta: -1,
          before: 3,
          after: 2,
          resultId: expect.any(String),
          revision: expectedRevision,
        }),
      ]),
    }),
  }));

  const projectionCountBeforeReload = receivedProjections.length;
  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => receivedProjections.length).toBeGreaterThan(projectionCountBeforeReload);
  const reconnected = receivedProjections.at(-1);
  expect(reconnected?.match?.view.revision).toBeGreaterThan(Number(expectedRevision));
  expect(latestSelfPlayer([reconnected!])?.mana).toBe(expectedMana);
  expect(latestSelfPlayer([reconnected!])?.commandSpells).toBe(2);
  await page.getByRole('button', { name: /查看玩家 5/ }).click();
  const selfDossier = page.getByRole('dialog', { name: '你公开情报' });
  await expect(selfDossier).toContainText(`魔力${expectedMana}`);
  await expect(selfDossier).toContainText('令咒2');
  await page.getByRole('button', { name: '关闭玩家公开情报' }).click();

  const missingRevisionErrorCount = serverErrors.length;
  await sendRawWsMessage(page, {
    roomId,
    clientId: room.clientId,
    token: room.reconnectToken,
    message: { type: 'client:dispatch_command', command: command!.command },
  });
  await expect.poll(() => serverErrors.length).toBeGreaterThan(missingRevisionErrorCount);
  expect(serverErrors.at(-1)).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('missing_expected_revision'),
  });
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(expectedMana);
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.commandSpells).toBe(2);

  const staleErrorCount = serverErrors.length;
  await sendRawWsMessage(page, {
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
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(expectedMana);
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.commandSpells).toBe(2);
});

async function createRoom(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const response = await request.post(`${httpBase}/rooms`, {
    data: { roomId, hostClientId: 'host-command-spell', hostName: '房主', seed: 20260905 },
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

async function endCurrentDecision(page: Page) {
  await page.getByRole('button', { name: /^(完成准备|完成前哨|结束行动|完成战斗)$/ }).last().click();
  const forceEndButton = page.getByRole('button', { name: '仍然结束' });
  if (await forceEndButton.isVisible().catch(() => false)) await forceEndButton.click();
}

async function sendRawWsMessage(page: Page, input: { roomId: string; clientId: string; token: string; message: unknown }) {
  await page.evaluate(({ roomId: targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, input);
}

function parseJson(payload: string | Buffer): Record<string, unknown> | undefined {
  try {
    return JSON.parse(String(payload)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function latestSelfPlayer(projections: MatchRoomProjection[]) {
  return projections.at(-1)?.match?.view.players.find((player) => player.id === 'p5');
}
