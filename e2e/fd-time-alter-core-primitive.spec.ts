import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';
const timeAlterInstanceId = 'p6-master.kiritsugu.skill.time-alter';
const selectedAttackInstanceId = 'p6-basic.agility.4-1';
const drawnCardInstanceId = 'p6-basic.strength.5-2';

test('routes Time Alter through browser, target reconnect, face-down effect play, draw, and stale rejection', async ({ page, request }) => {
  const roomId = `fd-time-alter-${Date.now()}`;
  const room = await restoreActionPhaseTimeAlterRoom(request, roomId);
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
  await expect(workbench).toContainText('master.kiritsugu');
  await expect(page.getByLabel('实战阶段流程')).toContainText('行动阶段');
  await expect.poll(() => projectedCardZone(receivedProjections.at(-1), selectedAttackInstanceId)).toBe('hand');

  const initialProjection = receivedProjections.at(-1);
  const expectedRevision = initialProjection?.match?.view.revision;
  expect(expectedRevision).toEqual(expect.any(Number));
  expect(initialProjection?.match?.view.legalActions).toContainEqual(expect.objectContaining({
    type: 'activate_ability',
    cardInstanceId: timeAlterInstanceId,
    abilityId: 'time-alter.action',
  }));

  await page.getByRole('button', { name: /检视 master\.kiritsugu\.skill\.time-alter/ }).click();
  await expect(page.getByRole('dialog', { name: 'master.kiritsugu.skill.time-alter' })).toBeVisible();
  await page.getByRole('button', { name: /发动能力 time-alter\.action/ }).click();

  await expect.poll(() => latestPendingDecision(receivedProjections)?.candidates).toContain(selectedAttackInstanceId);
  const pendingProjection = receivedProjections.at(-1);
  const pendingRevision = pendingProjection?.match?.view.revision;
  expect(pendingRevision).toEqual(expect.any(Number));
  expect(projectedCardZone(pendingProjection, selectedAttackInstanceId)).toBe('hand');

  const activationCommand = sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'activate_ability' &&
    message.command.abilityId === 'time-alter.action');
  expect(activationCommand).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision,
    command: {
      type: 'activate_ability',
      cardInstanceId: timeAlterInstanceId,
      abilityId: 'time-alter.action',
    },
  });

  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => latestPendingDecision(receivedProjections)?.candidates).toContain(selectedAttackInstanceId);
  expect(projectedCardZone(receivedProjections.at(-1), selectedAttackInstanceId)).toBe('hand');

  const targetWindow = page.getByRole('article').filter({ hasText: '选择目标' });
  await expect(targetWindow).toBeVisible();
  await targetWindow.getByRole('button', { name: /敏捷攻击 4/ }).click();
  await targetWindow.getByRole('button', { name: 'choose_target' }).click();

  await expect.poll(() => latestPendingDecision(receivedProjections)).toBeUndefined();
  await expect.poll(() => projectedCardZone(receivedProjections.at(-1), selectedAttackInstanceId)).toBe('attack_area');
  await expect.poll(() => projectedCardZone(receivedProjections.at(-1), drawnCardInstanceId)).toBe('hand');
  expect(projectedCard(receivedProjections.at(-1), selectedAttackInstanceId)).toEqual(expect.objectContaining({
    instanceId: selectedAttackInstanceId,
    zone: 'attack_area',
    faceDown: true,
  }));

  const targetCommand = sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'choose_target' &&
    message.command.selectedIds.includes(selectedAttackInstanceId));
  expect(targetCommand).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision: pendingRevision,
    command: {
      type: 'choose_target',
      selectedIds: [selectedAttackInstanceId],
    },
  });
  expect(receivedProjections.at(-1)?.match?.logs).toContainEqual(expect.objectContaining({
    type: 'dispatch_ok',
    payload: expect.objectContaining({
      events: expect.arrayContaining([
        expect.objectContaining({
          type: 'effect_resolved',
          playerId: 'p6',
          sourceCardId: timeAlterInstanceId,
          abilityId: 'time-alter.action',
        }),
      ]),
    }),
  }));

  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => projectedCardZone(receivedProjections.at(-1), selectedAttackInstanceId)).toBe('attack_area');
  await expect.poll(() => projectedCardZone(receivedProjections.at(-1), drawnCardInstanceId)).toBe('hand');

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
  expect(projectedCardZone(receivedProjections.at(-1), selectedAttackInstanceId)).toBe('attack_area');
  expect(projectedCardZone(receivedProjections.at(-1), drawnCardInstanceId)).toBe('hand');
  expect(countTimeAlterEffectResolved(receivedProjections.at(-1))).toBe(2);
});

async function restoreActionPhaseTimeAlterRoom(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const snapshot = buildActionPhaseTimeAlterSnapshot(roomId);
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, {
    data: { snapshot },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

function buildActionPhaseTimeAlterSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom } from '@fd/rules';
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: 'host-time-alter', hostName: '房主', seed: 20260909 });
    room.selectSeat('host-time-alter', 6);
    room.startMatch('host-time-alter');
    const session = room.session;
    session.state.round.activePhase = 'action';
    session.state.round.prioritySeat = 6;
    session.state.abilityRuntime.hostRequests = [];
    session.state.abilityRuntime.responseWindows = [];
    delete session.state.abilityRuntime.pendingDecision;
    const player = session.state.players.find((candidate) => candidate.id === 'p6');
    player.mana = 6;
    const timeAlter = session.state.cards.find((card) => card.controllerPlayerId === 'p6' && card.definitionId === 'master.kiritsugu.skill.time-alter');
    const selectedAttack = session.state.cards.find((card) => card.instanceId === ${JSON.stringify(selectedAttackInstanceId)});
    const drawnCard = session.state.cards.find((card) => card.instanceId === ${JSON.stringify(drawnCardInstanceId)});
    if (!timeAlter || !selectedAttack || !drawnCard) throw new Error('Time Alter E2E fixture cards not found');
    for (const card of session.state.cards.filter((candidate) => candidate.ownerPlayerId === 'p6' && candidate.instanceId !== selectedAttack.instanceId && candidate.instanceId !== drawnCard.instanceId)) {
      if (card.definitionId === 'master.kiritsugu.skill.time-alter') continue;
      card.zone = 'discard';
      card.visibility = { scope: 'owner_only', ownerPlayerId: 'p6' };
    }
    selectedAttack.zone = 'hand';
    selectedAttack.visibility = { scope: 'owner_only', ownerPlayerId: 'p6' };
    drawnCard.zone = 'deck';
    drawnCard.visibility = { scope: 'owner_only', ownerPlayerId: 'p6' };
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

function latestPendingDecision(projections: MatchRoomProjection[]) {
  return projections.at(-1)?.match?.view.pendingDecision;
}

function projectedCard(projection: MatchRoomProjection | undefined, instanceId: string) {
  return projection?.match?.view.cards.find((card) => card.instanceId === instanceId);
}

function projectedCardZone(projection: MatchRoomProjection | undefined, instanceId: string): string | undefined {
  return projectedCard(projection, instanceId)?.zone;
}

function countTimeAlterEffectResolved(projection: MatchRoomProjection | undefined): number {
  const logs = projection?.match?.logs ?? [];
  return logs
    .flatMap((entry) => entry.type === 'dispatch_ok' ? (entry.payload?.events ?? []) : [])
    .filter((event) =>
      event?.type === 'effect_resolved' &&
      event.sourceCardId === timeAlterInstanceId &&
      event.abilityId === 'time-alter.action')
    .length;
}
