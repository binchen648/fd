import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';

test('routes command spell gain mana through browser, WS revision, server projection, reconnect, and stale rejection', async ({ page, request }) => {
  const roomId = `fd-command-spell-${Date.now()}`;
  const room = await restoreActionPhaseCommandSpellRoom(request, roomId);
  const sentMessages: ClientRoomMessage[] = [];
  const receivedProjections: MatchRoomProjection[] = [];
  const serverErrors: ServerRoomMessage[] = [];

  page.on('websocket', (socket: PlaywrightWebSocket) => {
    socket.on('framesent', (frame) => {
      const parsed = parseJson(frame.payload);
      if (parsed?.type === 'client:dispatch_command') sentMessages.push(parsed as ClientRoomMessage);
    });
    socket.on('framereceived', (frame) => {
      const parsed = parseJson(frame.payload);
      if (parsed?.type === 'server:projection') receivedProjections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection);
      if (parsed?.type === 'server:error') serverErrors.push(parsed as ServerRoomMessage);
    });
  });

  await openRemoteRoom(page, room);
  await expect(page.getByLabel('远程对局房间')).toContainText('running');

  const workbench = page.getByRole('region', { name: '本人操作台', exact: true });
  await expect(workbench).toContainText('master.gatou');
  await expect(page.getByLabel('实战阶段流程')).toContainText('行动阶段');
  await expect(page.getByRole('button', { name: '结束行动', exact: true })).toBeVisible();
  await expect(workbench).toContainText('令咒区 · 1 张');

  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(8);
  expect(latestSelfPlayer(receivedProjections)?.commandSpells).toBe(3);
  const expectedRevision = receivedProjections.at(-1)?.match?.view.revision;
  expect(expectedRevision).toEqual(expect.any(Number));

  await page.getByRole('button', { name: /检视 master\.gatou\.command-spell/ }).click();
  await expect(page.getByRole('dialog', { name: 'master.gatou.command-spell' })).toBeVisible();
  await page.getByRole('button', { name: /发动能力 command-spell\.gain-mana/ }).click();

  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(12);
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

  const projectedAfterCommand = receivedProjections.find((projection) => latestSelfPlayer([projection])?.mana === 12);
  expect(projectedAfterCommand?.match?.logs).toContainEqual(expect.objectContaining({
    type: 'dispatch_ok',
    payload: expect.objectContaining({
      events: expect.arrayContaining([
        expect.objectContaining({
          type: 'mana_adjusted',
          sourceAbilityId: 'command-spell.gain-mana',
          controllerId: 'p5',
          resource: 'mana',
          delta: 4,
          before: 8,
          after: 12,
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

  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(12);
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.commandSpells).toBe(2);

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
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(12);
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.commandSpells).toBe(2);
});

async function restoreActionPhaseCommandSpellRoom(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const snapshot = buildActionPhaseCommandSpellSnapshot(roomId);
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, {
    data: { snapshot },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

function buildActionPhaseCommandSpellSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom } from '@fd/rules';
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: 'host-command-spell', hostName: '房主', seed: 20260905 });
    room.selectSeat('host-command-spell', 5);
    room.startMatch('host-command-spell');
    const session = room.session;
    session.state.round.activePhase = 'action';
    session.state.round.prioritySeat = 5;
    session.state.abilityRuntime.hostRequests = [];
    session.state.abilityRuntime.responseWindows = [];
    delete session.state.abilityRuntime.pendingDecision;
    const gatou = session.state.players.find((player) => player.id === 'p5');
    gatou.mana = 8;
    gatou.commandSpells = 3;
    process.stdout.write(JSON.stringify(room.serializeRoom()));
  `;
  return JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '--eval', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })) as MatchRoomSnapshot;
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

function latestSelfPlayer(projections: MatchRoomProjection[]) {
  return projections.at(-1)?.match?.view.players.find((player) => player.id === 'p5');
}
