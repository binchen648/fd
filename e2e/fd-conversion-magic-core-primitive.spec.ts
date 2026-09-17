import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';

test('routes Conversion Magic through browser, WS revision, actual movedCount binding, projection, reconnect, and stale rejection', async ({ page, request }) => {
  const roomId = `fd-conversion-magic-${Date.now()}`;
  const room = await restoreAdvancePhaseConversionMagicRoom(request, roomId);
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
  await expect(workbench).toContainText('master.irisviel');
  await expect(page.getByLabel('实战阶段流程')).toContainText('移动阶段');
  await expect(workbench).toContainText('手牌 · 2 张');

  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(4);
  const initialProjection = receivedProjections.at(-1);
  const expectedRevision = initialProjection?.match?.view.revision;
  expect(expectedRevision).toEqual(expect.any(Number));
  expect(initialProjection?.match?.view.legalActions).toContainEqual(expect.objectContaining({
    type: 'activate_ability',
    cardInstanceId: 'p2-master.irisviel.skill.conversion-magic',
    abilityId: 'conversion-magic.preparation',
  }));

  await page.getByRole('button', { name: /检视 master\.irisviel\.skill\.conversion-magic/ }).click();
  await expect(page.getByRole('dialog', { name: 'master.irisviel.skill.conversion-magic' })).toBeVisible();
  await page.getByRole('button', { name: /发动能力 conversion-magic\.preparation/ }).click();

  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(6);
  const command = sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'activate_ability' &&
    message.command.abilityId === 'conversion-magic.preparation');
  expect(command).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision,
    command: {
      type: 'activate_ability',
      cardInstanceId: 'p2-master.irisviel.skill.conversion-magic',
      abilityId: 'conversion-magic.preparation',
    },
  });

  const projectedAfterCommand = receivedProjections.find((projection) => latestSelfPlayer([projection])?.mana === 6);
  expect(projectedAfterCommand?.match?.zones.find((zone) => zone.id === 'hand')?.count).toBe(0);
  expect(projectedAfterCommand?.match?.zones.find((zone) => zone.id === 'discard')?.count).toBe(2);
  expect(projectedCardZone(projectedAfterCommand, 'p2-basic.agility.5-1')).toBe('discard');
  expect(projectedCardZone(projectedAfterCommand, 'p2-basic.luck-1')).toBe('discard');
  expect(projectedCardZone(projectedAfterCommand, 'p2-basic.agility.2-1')).toBe('field');
  expect(projectedAfterCommand?.match?.logs).toContainEqual(expect.objectContaining({
    type: 'dispatch_ok',
    payload: expect.objectContaining({
      events: expect.arrayContaining([
        expect.objectContaining({
          type: 'cards_moved',
          playerId: 'p2',
          sourceCardId: 'p2-master.irisviel.skill.conversion-magic',
          abilityId: 'conversion-magic.preparation',
          resultId: expect.stringContaining('.cards_moved'),
          revision: expectedRevision,
        }),
        expect.objectContaining({
          type: 'mana_adjusted',
          sourceAbilityId: 'conversion-magic.preparation',
          controllerId: 'p2',
          resource: 'mana',
          delta: 2,
          before: 4,
          after: 6,
          resultId: expect.any(String),
          revision: expectedRevision,
        }),
      ]),
    }),
  }));

  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(6);
  expect(receivedProjections.at(-1)?.match?.zones.find((zone) => zone.id === 'hand')?.count).toBe(0);
  expect(receivedProjections.at(-1)?.match?.zones.find((zone) => zone.id === 'discard')?.count).toBe(2);

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
  await expect.poll(() => latestSelfPlayer(receivedProjections)?.mana).toBe(6);
  expect(receivedProjections.at(-1)?.match?.zones.find((zone) => zone.id === 'discard')?.count).toBe(2);
  expect(projectedCardZone(receivedProjections.at(-1), 'p2-basic.agility.5-1')).toBe('discard');
  expect(projectedCardZone(receivedProjections.at(-1), 'p2-basic.luck-1')).toBe('discard');
  expect(projectedCardZone(receivedProjections.at(-1), 'p2-basic.agility.2-1')).toBe('field');
});

async function restoreAdvancePhaseConversionMagicRoom(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const snapshot = buildAdvancePhaseConversionMagicSnapshot(roomId);
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, {
    data: { snapshot },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

function buildAdvancePhaseConversionMagicSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom } from '@fd/rules';
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: 'host-conversion-magic', hostName: '房主', seed: 20260909 });
    room.selectSeat('host-conversion-magic', 2);
    room.startMatch('host-conversion-magic');
    const session = room.session;
    session.state.round.activePhase = 'advance';
    session.state.round.prioritySeat = 2;
    session.state.abilityRuntime.hostRequests = [];
    session.state.abilityRuntime.responseWindows = [];
    delete session.state.abilityRuntime.pendingDecision;
    const player = session.state.players.find((candidate) => candidate.id === 'p2');
    player.mana = 4;
    const source = session.state.cards.find((card) => card.controllerPlayerId === 'p2' && card.definitionId === 'master.irisviel.skill.conversion-magic');
    const candidates = session.state.cards.filter((card) => card.controllerPlayerId === 'p2' && card.instanceId !== source.instanceId);
    for (const card of candidates) {
      card.zone = 'deck';
      card.visibility = { scope: 'owner_only', ownerPlayerId: 'p2' };
    }
    const movable = [
      candidates.find((card) => card.instanceId === 'p2-basic.agility.5-1'),
      candidates.find((card) => card.instanceId === 'p2-basic.luck-1'),
    ];
    const decoy = candidates.find((card) => card.instanceId === 'p2-basic.agility.2-1');
    if (movable.some((card) => !card) || !decoy) throw new Error('Conversion Magic E2E fixture cards not found');
    for (const card of movable) {
      card.zone = 'hand';
      card.visibility = { scope: 'owner_only', ownerPlayerId: 'p2' };
    }
    decoy.zone = 'field';
    decoy.visibility = { scope: 'public' };
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
  return projections.at(-1)?.match?.view.players.find((player) => player.id === 'p2');
}

function projectedCardZone(projection: MatchRoomProjection | undefined, instanceId: string): string | undefined {
  return projection?.match?.view.cards.find((card) => card.instanceId === instanceId)?.zone;
}
