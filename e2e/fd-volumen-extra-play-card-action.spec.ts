import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';
const volumenInstanceId = 'kayneth-volumen-p7-1';

test('routes Volumen source-card response play through browser, reconnect, projection, and stale rejection', async ({ page, request }) => {
  const roomId = `fd-volumen-extra-play-${Date.now()}`;
  const room = await restoreCombatResponseVolumenRoom(request, roomId);
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
  await expect(workbench).toContainText('master.kayneth');
  await expect(page.getByLabel('实战阶段流程')).toContainText('战斗阶段');
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(5);
  await expect.poll(() => latestResponseWindow(receivedProjections)?.opens).toBe('controller_combat_action_window');
  await expect.poll(() => projectedCardZone(receivedProjections.at(-1), volumenInstanceId)).toBe('hand');

  const initialProjection = receivedProjections.at(-1);
  const expectedRevision = initialProjection?.match?.view.revision;
  expect(expectedRevision).toEqual(expect.any(Number));
  expect(initialProjection?.match?.view.legalActions).toContainEqual(expect.objectContaining({
    type: 'resolve_response',
    cardInstanceId: volumenInstanceId,
    abilityId: 'volumen.extra-play',
  }));

  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => latestResponseWindow(receivedProjections)?.opens).toBe('controller_combat_action_window');
  await expect.poll(() => projectedCardZone(receivedProjections.at(-1), volumenInstanceId)).toBe('hand');

  await page.getByLabel('交互窗口').getByRole('button', { name: 'resolve_response' }).click();

  await expect.poll(() => latestResponseWindow(receivedProjections)).toBeUndefined();
  await expect.poll(() => projectedCardZone(receivedProjections.at(-1), volumenInstanceId)).toBe('attack_area');
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(3);
  expect(projectedCard(receivedProjections.at(-1), volumenInstanceId)).toEqual(expect.objectContaining({
    instanceId: volumenInstanceId,
    zone: 'attack_area',
  }));

  const responseCommand = sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'resolve_response' &&
    message.command.cardInstanceId === volumenInstanceId &&
    message.command.abilityId === 'volumen.extra-play');
  expect(responseCommand).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision,
    command: {
      type: 'resolve_response',
      cardInstanceId: volumenInstanceId,
      abilityId: 'volumen.extra-play',
    },
  });
  expect(receivedProjections.at(-1)?.match?.logs).toContainEqual(expect.objectContaining({
    type: 'dispatch_ok',
    payload: expect.objectContaining({
      events: expect.arrayContaining([
        expect.objectContaining({
          type: 'source_card_played',
          playerId: 'p7',
          sourceCardId: volumenInstanceId,
          abilityId: 'volumen.extra-play',
        }),
      ]),
    }),
  }));

  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => latestResponseWindow(receivedProjections)).toBeUndefined();
  await expect.poll(() => projectedCardZone(receivedProjections.at(-1), volumenInstanceId)).toBe('attack_area');
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(3);

  const staleErrorCount = serverErrors.length;
  await page.evaluate(({ roomId: targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, {
    roomId,
    clientId: room.clientId,
    token: room.reconnectToken,
    message: responseCommand!,
  });

  await expect.poll(() => serverErrors.length).toBeGreaterThan(staleErrorCount);
  expect(serverErrors.at(-1)).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('Stale command revision'),
  });
  expect(projectedCardZone(receivedProjections.at(-1), volumenInstanceId)).toBe('attack_area');
  expect(latestSelfPlayer(receivedProjections)?.mana).toBe(3);
  expect(countSourceCardPlayedEvents(receivedProjections.at(-1))).toBe(1);
});

async function restoreCombatResponseVolumenRoom(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const snapshot = buildCombatResponseVolumenSnapshot(roomId);
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, {
    data: { snapshot },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

function buildCombatResponseVolumenSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom, processAbilityEvent } from '@fd/rules';
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: 'host-volumen', hostName: '房主', seed: 20260909 });
    room.selectSeat('host-volumen', 7);
    room.startMatch('host-volumen');
    const session = room.session;
    session.state.round.activePhase = 'battle';
    session.state.round.prioritySeat = 7;
    session.state.abilityRuntime.hostRequests = [];
    session.state.abilityRuntime.responseWindows = [];
    delete session.state.abilityRuntime.pendingDecision;
    const player = session.state.players.find((candidate) => candidate.id === 'p7');
    player.mana = 5;
    const volumen = session.state.cards.find((card) => card.instanceId === ${JSON.stringify(volumenInstanceId)});
    if (!volumen) throw new Error('Volumen E2E fixture card not found');
    volumen.zone = 'hand';
    volumen.ownerPlayerId = 'p7';
    volumen.controllerPlayerId = 'p7';
    volumen.visibility = { scope: 'owner_only', ownerPlayerId: 'p7' };
    delete session.state.abilityRuntime.cardState[volumen.instanceId];
    processAbilityEvent(session.state, { id: 'volumen-e2e-combat-window', type: 'controller_combat_action_window' });
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
  return projections.at(-1)?.match?.view.players.find((player) => player.id === 'p7');
}

function latestResponseWindow(projections: MatchRoomProjection[]) {
  return projections.at(-1)?.match?.view.responseWindow;
}

function projectedCard(projection: MatchRoomProjection | undefined, instanceId: string) {
  return projection?.match?.view.cards.find((card) => card.instanceId === instanceId);
}

function projectedCardZone(projection: MatchRoomProjection | undefined, instanceId: string): string | undefined {
  return projectedCard(projection, instanceId)?.zone;
}

function countSourceCardPlayedEvents(projection: MatchRoomProjection | undefined): number {
  const logs = projection?.match?.logs ?? [];
  return logs
    .flatMap((entry) => entry.type === 'dispatch_ok' ? (entry.payload?.events ?? []) : [])
    .filter((event) =>
      event?.type === 'source_card_played' &&
      event.sourceCardId === volumenInstanceId &&
      event.abilityId === 'volumen.extra-play')
    .length;
}
