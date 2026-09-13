import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

import { buildGoldenEaterSnapshot, type GoldenEaterSnapshotStage } from './support/build-golden-eater-snapshot';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';
const playerId = 'p4';
const eaterId = 'p4-servant.kintoki.skill.sc-kintoki-3';
const firstImpactId = 'p4-servant.kintoki.skill.sc-kintoki-1';
const secondImpactId = 'p4-servant.kintoki.skill.sc-kintoki-2';

function observeRoom(page: Page) {
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
  return { sentMessages, receivedProjections, serverErrors };
}

test('Golden Eater preserves staged typed result binding through browser, reconnect, and stale replay rejection', async ({ page, request }) => {
  const roomId = `fd-golden-eater-${Date.now()}`;
  const room = await restoreGoldenEaterRoom(request, roomId, 'ready');
  const observed = observeRoom(page);

  await openRemoteRoom(page, room);
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  const workbench = page.getByRole('region', { name: '本人操作台', exact: true });
  await expect(workbench).toContainText('servant.kintoki');
  await expect(page.getByLabel('实战阶段流程')).toContainText('战斗阶段');
  await expect.poll(() => latestSelfPlayer(observed.receivedProjections)?.mana).toBe(9);

  const initialProjection = observed.receivedProjections.at(-1);
  const initialRevision = initialProjection?.match?.view.revision;
  expect(initialRevision).toEqual(expect.any(Number));
  expect(initialProjection?.match?.view.legalActions).toContainEqual(expect.objectContaining({
    type: 'activate_ability',
    cardInstanceId: eaterId,
    abilityId: 'sc-kintoki-3.golden-eater',
  }));

  await page.getByRole('button', { name: /检视 servant\.kintoki\.skill\.sc-kintoki-3/ }).click();
  await expect(page.getByRole('dialog', { name: 'servant.kintoki.skill.sc-kintoki-3' })).toBeVisible();
  await page.getByRole('button', { name: /发动能力 sc-kintoki-3\.golden-eater/ }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'servant.kintoki.skill.sc-kintoki-3' })).toBeHidden();

  await expect.poll(() => latestPendingDecision(observed.receivedProjections)?.candidates).toEqual([firstImpactId, secondImpactId]);
  const activationCommand = observed.sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'activate_ability' &&
    message.command.abilityId === 'sc-kintoki-3.golden-eater');
  expect(activationCommand).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision: initialRevision,
    command: {
      type: 'activate_ability',
      cardInstanceId: eaterId,
      abilityId: 'sc-kintoki-3.golden-eater',
    },
  });

  const firstPendingRevision = observed.receivedProjections.at(-1)?.match?.view.revision;
  expect(firstPendingRevision).toEqual(expect.any(Number));
  let targetWindow = page.getByRole('article').filter({ hasText: '选择目标' });
  await expect(targetWindow).toBeVisible();
  await targetWindow.locator('.interaction-window__candidates button').first().click();
  await targetWindow.getByRole('button', { name: 'choose_target' }).click();

  await expect.poll(() => projectedCardZone(observed.receivedProjections.at(-1), firstImpactId)).toBe('skill');
  await expect.poll(() => latestPendingDecision(observed.receivedProjections)?.candidates).toEqual([secondImpactId]);
  await expect.poll(() => latestSelfPlayer(observed.receivedProjections)?.mana).toBe(9);
  await expect.poll(() => latestSelfPlayer(observed.receivedProjections)?.vp).toBe(0);
  expect(projectedCardZone(observed.receivedProjections.at(-1), secondImpactId)).toBe('removed_from_game');
  expect(JSON.stringify(observed.receivedProjections.at(-1))).not.toContain('__result_binding_moved_count');

  const firstTargetCommand = observed.sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'choose_target' &&
    message.command.selectedIds.includes(firstImpactId));
  expect(firstTargetCommand).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision: firstPendingRevision,
    command: {
      type: 'choose_target',
      selectedIds: [firstImpactId],
    },
  });

  const secondPendingRevision = observed.receivedProjections.at(-1)?.match?.view.revision;
  expect(secondPendingRevision).toEqual(expect.any(Number));
  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => latestPendingDecision(observed.receivedProjections)?.candidates).toEqual([secondImpactId]);
  await expect.poll(() => projectedCardZone(observed.receivedProjections.at(-1), firstImpactId)).toBe('skill');
  await expect.poll(() => latestSelfPlayer(observed.receivedProjections)?.mana).toBe(9);
  expect(JSON.stringify(observed.receivedProjections.at(-1))).not.toContain('__result_binding_moved_count');

  targetWindow = page.getByRole('article').filter({ hasText: '选择目标' });
  await expect(targetWindow).toBeVisible();
  await targetWindow.locator('.interaction-window__candidates button').first().click();
  await targetWindow.getByRole('button', { name: 'choose_target' }).click();

  await expect.poll(() => latestPendingDecision(observed.receivedProjections)).toBeUndefined();
  await expect.poll(() => projectedCardZone(observed.receivedProjections.at(-1), secondImpactId)).toBe('skill');
  await expect.poll(() => latestSelfPlayer(observed.receivedProjections)?.mana).toBe(2);
  await expect.poll(() => latestSelfPlayer(observed.receivedProjections)?.vp).toBe(4);

  const secondTargetCommand = observed.sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'choose_target' &&
    message.command.selectedIds.includes(secondImpactId));
  expect(secondTargetCommand).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision: secondPendingRevision,
    command: {
      type: 'choose_target',
      selectedIds: [secondImpactId],
    },
  });
  expect(allDispatchEvents(observed.receivedProjections.at(-1))).toEqual(expect.arrayContaining([
    expect.objectContaining({
      type: 'mana_paid',
      sourceAbilityId: 'sc-kintoki-3.golden-eater',
      delta: -7,
    }),
    expect.objectContaining({
      type: 'victory_points_adjusted',
      sourceAbilityId: 'sc-kintoki-3.golden-eater',
      delta: 4,
    }),
  ]));

  const staleErrorCount = observed.serverErrors.length;
  await page.evaluate(({ roomId: targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, {
    roomId,
    clientId: room.clientId,
    token: room.reconnectToken,
    message: secondTargetCommand!,
  });

  await expect.poll(() => observed.serverErrors.length).toBeGreaterThan(staleErrorCount);
  expect(observed.serverErrors.at(-1)).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('Stale command revision'),
  });
  await expect.poll(() => latestSelfPlayer(observed.receivedProjections)?.mana).toBe(2);
  await expect.poll(() => latestSelfPlayer(observed.receivedProjections)?.vp).toBe(4);
  expect(projectedCardZone(observed.receivedProjections.at(-1), firstImpactId)).toBe('skill');
  expect(projectedCardZone(observed.receivedProjections.at(-1), secondImpactId)).toBe('skill');
});

test('Golden Eater insufficient second-stage payment rolls back only the failing browser dispatch', async ({ page, request }) => {
  const roomId = `fd-golden-eater-low-mana-${Date.now()}`;
  const room = await restoreGoldenEaterRoom(request, roomId, 'second_pending_low_mana');
  const observed = observeRoom(page);

  await openRemoteRoom(page, room);
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => latestPendingDecision(observed.receivedProjections)?.candidates).toEqual([secondImpactId]);
  await expect.poll(() => latestSelfPlayer(observed.receivedProjections)?.mana).toBe(6);
  await expect.poll(() => latestSelfPlayer(observed.receivedProjections)?.vp).toBe(0);
  expect(projectedCardZone(observed.receivedProjections.at(-1), firstImpactId)).toBe('skill');
  expect(projectedCardZone(observed.receivedProjections.at(-1), secondImpactId)).toBe('removed_from_game');
  const beforeRevision = observed.receivedProjections.at(-1)?.match?.view.revision;

  const targetWindow = page.getByRole('article').filter({ hasText: '选择目标' });
  await expect(targetWindow).toBeVisible();
  await targetWindow.locator('.interaction-window__candidates button').first().click();
  await targetWindow.getByRole('button', { name: 'choose_target' }).click();

  await expect.poll(() => observed.receivedProjections.at(-1)?.match?.rejection?.code).toBe('resolution_failed');
  await expect.poll(() => latestSelfPlayer(observed.receivedProjections)?.mana).toBe(6);
  await expect.poll(() => latestSelfPlayer(observed.receivedProjections)?.vp).toBe(0);
  expect(observed.receivedProjections.at(-1)?.match?.view.revision).toBe(beforeRevision);
  expect(projectedCardZone(observed.receivedProjections.at(-1), firstImpactId)).toBe('skill');
  expect(projectedCardZone(observed.receivedProjections.at(-1), secondImpactId)).toBe('removed_from_game');
  expect(latestPendingDecision(observed.receivedProjections)?.candidates).toEqual([secondImpactId]);
});

async function restoreGoldenEaterRoom(
  request: APIRequestContext,
  roomId: string,
  stage: GoldenEaterSnapshotStage,
): Promise<RoomHttpResponse> {
  const snapshot = buildGoldenEaterSnapshot(roomId, stage);
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, {
    data: { snapshot },
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

function latestSelfPlayer(projections: MatchRoomProjection[]) {
  return projections.at(-1)?.match?.view.players.find((player) => player.id === playerId);
}

function latestPendingDecision(projections: MatchRoomProjection[]) {
  return projections.at(-1)?.match?.view.pendingDecision;
}

function projectedCardZone(projection: MatchRoomProjection | undefined, instanceId: string): string | undefined {
  return projection?.match?.view.cards.find((card) => card.instanceId === instanceId)?.zone;
}

function allDispatchEvents(projection: MatchRoomProjection | undefined) {
  const logs = projection?.match?.logs ?? [];
  return logs.flatMap((entry) => entry.type === 'dispatch_ok' ? (entry.payload?.events ?? []) : []);
}
