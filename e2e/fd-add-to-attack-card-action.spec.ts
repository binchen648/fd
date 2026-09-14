import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';
const supportShotInstanceId = 'created-4';

test('routes Maiya add-to-attack through browser, target selection, projection, reconnect, and stale rejection', async ({ page, request }) => {
  const roomId = `fd-add-to-attack-${Date.now()}`;
  const room = await restoreAdvancePhaseMaiyaRoom(request, roomId);
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
  await expect(workbench).toContainText('master.maiya');
  await expect(page.getByLabel('实战阶段流程')).toContainText('移动阶段');
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(6);

  const initialProjection = receivedProjections.at(-1);
  const expectedRevision = initialProjection?.match?.view.revision;
  expect(expectedRevision).toEqual(expect.any(Number));
  expect(initialProjection?.match?.view.legalActions).toContainEqual(expect.objectContaining({
    type: 'activate_ability',
    cardInstanceId: 'p5-master.maiya.skill.military',
    abilityId: 'military.attach-support-shot',
  }));

  await page.getByRole('button', { name: /检视 master\.maiya\.skill\.military/ }).click();
  await expect(page.getByRole('dialog', { name: 'master.maiya.skill.military' })).toBeVisible();
  await page.getByRole('button', { name: /发动能力 military\.attach-support-shot/ }).click();

  await expect.poll(() => latestPendingDecision(receivedProjections)?.candidates).toContain('p2');
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(4);
  const pendingProjection = receivedProjections.at(-1);
  const pendingRevision = pendingProjection?.match?.view.revision;
  expect(pendingRevision).toEqual(expect.any(Number));

  const activationCommand = sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'activate_ability' &&
    message.command.abilityId === 'military.attach-support-shot');
  expect(activationCommand).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision,
    command: {
      type: 'activate_ability',
      cardInstanceId: 'p5-master.maiya.skill.military',
      abilityId: 'military.attach-support-shot',
    },
  });

  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => latestPendingDecision(receivedProjections)?.candidates).toContain('p2');
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(4);
  expect(projectedCardZone(receivedProjections.at(-1), supportShotInstanceId)).toBe('skill');

  const targetWindow = page.getByRole('article').filter({ hasText: '选择目标' });
  await expect(targetWindow).toBeVisible();
  await targetWindow.getByRole('button', { name: /Seat 2/ }).click();
  await targetWindow.getByRole('button', { name: 'choose_target' }).click();

  await expect.poll(() => latestPendingDecision(receivedProjections)).toBeUndefined();
  await expect.poll(() => projectedCardZone(receivedProjections.at(-1), supportShotInstanceId)).toBe('attack_area');
  await expect.poll(() => latestAttackAddedEvent(receivedProjections)?.playerId).toBe('p2');
  const targetCommand = sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'choose_target' &&
    message.command.selectedIds.includes('p2'));
  expect(targetCommand).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision: pendingRevision,
    command: {
      type: 'choose_target',
      selectedIds: ['p2'],
    },
  });
  expect(receivedProjections.at(-1)?.match?.logs).toContainEqual(expect.objectContaining({
    type: 'dispatch_ok',
    payload: expect.objectContaining({
      events: expect.arrayContaining([
        expect.objectContaining({
          type: 'attack_added',
          playerId: 'p2',
          sourceCardId: 'p5-master.maiya.skill.military',
          abilityId: 'military.attach-support-shot',
          resultId: expect.stringContaining('.attack_added'),
          revision: pendingRevision,
        }),
      ]),
    }),
  }));

  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => projectedCardZone(receivedProjections.at(-1), supportShotInstanceId)).toBe('attack_area');
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(4);

  const staleErrorCount = serverErrors.length;
  await page.evaluate(({ roomId: targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, {
    roomId,
    clientId: room.clientId,
    token: room.reconnectToken,
    message: targetCommand!,
  });

  await expect.poll(() => serverErrors.length).toBeGreaterThan(staleErrorCount);
  expect(serverErrors.at(-1)).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('Stale command revision'),
  });
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(4);
  expect(projectedCardZone(receivedProjections.at(-1), supportShotInstanceId)).toBe('attack_area');
  expect(countAttackAddedEvents(receivedProjections.at(-1))).toBe(1);
});

async function restoreAdvancePhaseMaiyaRoom(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const snapshot = buildAdvancePhaseMaiyaSnapshot(roomId);
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, {
    data: { snapshot },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

function buildAdvancePhaseMaiyaSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom } from '@fd/rules';
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: 'host-add-to-attack', hostName: '房主', seed: 20260909 });
    room.selectSeat('host-add-to-attack', 5);
    room.startMatch('host-add-to-attack');
    const session = room.session;
    session.state.round.activePhase = 'advance';
    session.state.round.prioritySeat = 5;
    session.state.abilityRuntime.hostRequests = [];
    session.state.abilityRuntime.responseWindows = [];
    delete session.state.abilityRuntime.pendingDecision;
    const player = session.state.players.find((candidate) => candidate.id === 'p5');
    player.locationId = 'recon';
    player.mana = 6;
    const military = session.state.cards.find((card) => card.controllerPlayerId === 'p5' && card.definitionId === 'master.maiya.skill.military');
    const supportShot = session.state.cards.find((card) => card.controllerPlayerId === 'p5' && card.definitionId === 'master.maiya.deck.support-shot');
    if (!military || !supportShot) throw new Error('Maiya add-to-attack E2E fixture cards not found');
    supportShot.zone = 'skill';
    supportShot.ownerPlayerId = 'p5';
    supportShot.controllerPlayerId = 'p5';
    supportShot.visibility = { scope: 'public' };
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

function latestPendingDecision(projections: MatchRoomProjection[]) {
  return projections.at(-1)?.match?.view.pendingDecision;
}

function projectedCardZone(projection: MatchRoomProjection | undefined, instanceId: string): string | undefined {
  return projection?.match?.view.cards.find((card) => card.instanceId === instanceId)?.zone;
}

function latestAttackAddedEvent(projections: MatchRoomProjection[]) {
  const logs = projections.at(-1)?.match?.logs ?? [];
  return logs
    .flatMap((entry) => entry.type === 'dispatch_ok' ? (entry.payload?.events ?? []) : [])
    .filter((event): event is { type: 'attack_added'; playerId: string } => event?.type === 'attack_added')
    .at(-1);
}

function countAttackAddedEvents(projection: MatchRoomProjection | undefined): number {
  const logs = projection?.match?.logs ?? [];
  return logs
    .flatMap((entry) => entry.type === 'dispatch_ok' ? (entry.payload?.events ?? []) : [])
    .filter((event) => event?.type === 'attack_added')
    .length;
}
