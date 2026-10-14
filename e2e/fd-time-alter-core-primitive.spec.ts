import { expect, test, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';
import { createMatchServer } from '../apps/server/src/match-server';

let httpBase = '';
let wsBase = '';
let fixtureServer: ReturnType<typeof createMatchServer> | undefined;
const timeAlterInstanceId = 'p6-master.kiritsugu.skill.time-alter';
const selectedAttackInstanceId = 'p6-basic.strength.5-2';
const drawnCardInstanceId = 'p6-basic.luck-1';

test.afterEach(async () => { await fixtureServer?.close(); fixtureServer = undefined; });

test('plays a genuinely replaced and drawn Origin Bullet through browser, reconnect, and stale rejection', async ({ page }) => {
  const roomId = `fd-time-alter-${Date.now()}`;
  const room = await createNaturalTimeAlterRoom(roomId);
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
  const priorEffectCount = countTimeAlterEffectResolved(initialProjection);
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
  await targetWindow.getByRole('button', { name: /起源弹/ }).click();
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
  await page.evaluate(({ wsBase: endpoint, roomId: targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`${endpoint}/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
    socket.addEventListener('message', () => socket.close());
  }, {
    wsBase,
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
  expect(countTimeAlterEffectResolved(receivedProjections.at(-1))).toBe(priorEffectCount + 2);
});

async function createNaturalTimeAlterRoom(roomId: string): Promise<RoomHttpResponse> {
  fixtureServer = createMatchServer();
  const port = await fixtureServer.listen(0);
  httpBase = `http://127.0.0.1:${port}`;
  wsBase = `ws://127.0.0.1:${port}`;
  const hub = fixtureServer.hub;
  const hostId = 'host-time-alter';
  hub.createRoom({ roomId, hostClientId: hostId, seed: 20260909 });
  hub.selectSeat(roomId, hostId, 6);
  for (const seat of [1, 2, 3, 4, 5, 7]) {
    const clientId = `time-alter-human-${seat}`;
    hub.joinRoom(roomId, { clientId, displayName: clientId, role: 'player' });
    hub.selectSeat(roomId, clientId, seat);
  }
  hub.startMatch(roomId, hostId);
  const room = hub.getRoom(roomId);
  const session = room.session!;
  const pass = () => {
    const player = session.state.players.find((entry) => entry.seat === session.state.round.prioritySeat)!;
    expect(session.passPriority(player.id).ok).toBe(true);
  };
  const reach = (phase: string) => {
    for (let step = 0; step < 30; step++) {
      if (session.state.round.activePhase === phase && session.state.round.prioritySeat === 6) return;
      pass();
    }
    throw new Error('Natural Time Alter setup did not reach the phase window');
  };
  const choose = (selected: string) => {
    const action = session.getPlayerView('p6').legalActions.find((entry) => entry.type === 'choose_target')!;
    expect(session.dispatchPlayerAction('p6', { type: 'choose_target', decisionId: action.decisionId, selectedIds: [selected] }).ok).toBe(true);
  };
  reach('preparation');
  expect(session.state.cards.find((card) => card.instanceId === selectedAttackInstanceId)!.zone).toBe('deck');
  expect(session.dispatchPlayerAction('p6', { type: 'activate_ability', cardInstanceId: 'p6-master.kiritsugu.skill.magus-killer', abilityId: 'magus-killer.setup' }).ok).toBe(true);
  choose(selectedAttackInstanceId);
  reach('action');
  expect(session.dispatchPlayerAction('p6', { type: 'activate_ability', cardInstanceId: timeAlterInstanceId, abilityId: 'time-alter.action' }).ok).toBe(true);
  const first = session.getPlayerView('p6').legalActions.find((entry) => entry.type === 'choose_target')!;
  choose(first.candidates[0]!);
  expect(session.state.cards.find((card) => card.instanceId === selectedAttackInstanceId)).toMatchObject({ definitionId: 'master.kiritsugu.deck.origin-bullet', zone: 'hand' });
  for (let step = 0; step < 30 && session.state.round.activePhase !== 'round_end'; step++) pass();
  expect(session.state.round.activePhase).toBe('round_end');
  session.runFullMatch({ maxRounds: 2 });
  reach('action');
  expect(session.state.round.roundNumber).toBe(2);
  expect(session.state.cards.find((card) => card.instanceId === drawnCardInstanceId)!.zone).toBe('deck');
  return { roomId, clientId: hostId, reconnectToken: room.getIssuedCredential(hostId), projection: hub.project(roomId, hostId) };
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
