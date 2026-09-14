import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';
const hostClientId = 'host-b18-noble-bloom';
const playerId = 'p1';
const sourceInstanceId = 'b18-artoria-alt-resistance';
const sourceDefinitionId = 'servant.artoria-alt.skill.sc-artoria-alt-3';
const abilityId = 'sc-artoria-alt-3.noble-bloom';

test('resolves Artoria Alter Noble Bloom through remote optional response, reconnect, and stale replay exactly once', async ({ page, request }) => {
  const roomId = `fd-b18-noble-bloom-${Date.now()}`;
  const room = await restoreRoom(request, roomId);
  const sentMessages: ClientRoomMessage[] = [];
  const projections: MatchRoomProjection[] = [];
  const serverErrors: ServerRoomMessage[] = [];

  page.on('websocket', (socket: PlaywrightWebSocket) => {
    socket.on('framesent', (frame) => {
      const parsed = parseJson(frame.payload);
      if (parsed?.type === 'client:dispatch_command') sentMessages.push(parsed as ClientRoomMessage);
    });
    socket.on('framereceived', (frame) => {
      const parsed = parseJson(frame.payload);
      if (parsed?.type === 'server:projection') projections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection);
      if (parsed?.type === 'server:error') serverErrors.push(parsed as ServerRoomMessage);
    });
  });

  await openRemoteRoom(page, room);
  await expect.poll(() => latestMatch(projections)?.view.revision).toEqual(expect.any(Number));
  await expect.poll(() => latestResponseWindow(projections)?.opens).toBe('after_battle_result_determined');
  await expect.poll(() => vpOf(projections)).toBe(2);

  const initial = latestMatch(projections)!;
  const expectedRevision = initial.view.revision;
  expect(initial.view.legalActions).toContainEqual(expect.objectContaining({
    type: 'resolve_response',
    cardInstanceId: sourceInstanceId,
    abilityId,
  }));

  const countBeforePendingReload = projections.length;
  await page.goto('about:blank');
  await page.waitForTimeout(100);
  await openRemoteRoom(page, room);
  await expect.poll(() => projections.length).toBeGreaterThan(countBeforePendingReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(expectedRevision);
  await expect.poll(() => latestResponseWindow(projections)?.opens).toBe('after_battle_result_determined');
  expect(vpOf(projections)).toBe(2);

  const sentBeforeResolve = sentMessages.length;
  for (let attempt = 0; attempt < 3 && sentMessages.length === sentBeforeResolve; attempt++) {
    await expect(page.getByText('Client is disconnected', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'resolve_response', exact: true }).click();
    try {
      await expect.poll(() => sentMessages.length, { timeout: 3000 }).toBeGreaterThan(sentBeforeResolve);
    } catch {
      if (attempt === 2) throw new Error('resolve_response was not sent after reconnect retries');
    }
  }

  await expect.poll(() => latestResponseWindow(projections)).toBeUndefined();
  await expect.poll(() => vpOf(projections)).toBe(3);
  const settled = latestMatch(projections)!;
  const settledRevision = settled.view.revision;
  const responseCommand = sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'resolve_response' &&
    message.command.cardInstanceId === sourceInstanceId &&
    message.command.abilityId === abilityId);
  expect(responseCommand).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision,
    command: {
      type: 'resolve_response',
      cardInstanceId: sourceInstanceId,
      abilityId,
    },
  });
  expect(countVpEvents(settled)).toBe(1);

  const countBeforeSettledReload = projections.length;
  await page.goto('about:blank');
  await page.waitForTimeout(100);
  await openRemoteRoom(page, room);
  await expect.poll(() => projections.length).toBeGreaterThan(countBeforeSettledReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(latestResponseWindow(projections)).toBeUndefined();
  expect(vpOf(projections)).toBe(3);
  expect(countVpEvents(latestMatch(projections)!)).toBe(1);

  const errorCount = serverErrors.length;
  await page.evaluate(({ targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, {
    targetRoomId: roomId,
    clientId: room.clientId,
    token: room.reconnectToken,
    message: responseCommand!,
  });

  await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount);
  expect(serverErrors.at(-1)).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('Stale command revision'),
  });
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(vpOf(projections)).toBe(3);
  expect(countVpEvents(latestMatch(projections)!)).toBe(1);
});

async function restoreRoom(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, {
    data: { snapshot: buildSnapshot(roomId) },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

function buildSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom, processAbilityEvent } from '@fd/rules';
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: ${JSON.stringify(hostClientId)}, hostName: '鎴夸富', seed: 20260904 });
    room.selectSeat(${JSON.stringify(hostClientId)}, 1);
    room.startMatch(${JSON.stringify(hostClientId)});
    const session = room.session; const state = session.state;
    state.round = { roundNumber: 1, activePhase: 'battle', prioritySeat: 1 };
    session.stopReason = undefined; session.logs = [];
    state.abilityRuntime.hostRequests = []; state.abilityRuntime.responseWindows = []; state.abilityRuntime.pendingPostBattleEvents = [];
    delete state.abilityRuntime.pendingDecision;
    state.players.find((player) => player.id === ${JSON.stringify(playerId)}).servantCardId = 'servant.artoria-alt';
    state.players.find((player) => player.id === ${JSON.stringify(playerId)}).vp = 2;
    const existing = state.cards.find((card) => card.instanceId === ${JSON.stringify(sourceInstanceId)});
    if (existing) {
      existing.definitionId = ${JSON.stringify(sourceDefinitionId)};
      existing.ownerPlayerId = ${JSON.stringify(playerId)};
      existing.controllerPlayerId = ${JSON.stringify(playerId)};
      existing.zone = 'skill';
      existing.visibility = { scope: 'owner_only', ownerPlayerId: ${JSON.stringify(playerId)} };
    } else {
      state.cards.push({
        instanceId: ${JSON.stringify(sourceInstanceId)},
        definitionId: ${JSON.stringify(sourceDefinitionId)},
        ownerPlayerId: ${JSON.stringify(playerId)},
        controllerPlayerId: ${JSON.stringify(playerId)},
        zone: 'skill',
        visibility: { scope: 'owner_only', ownerPlayerId: ${JSON.stringify(playerId)} },
      });
    }
    state.abilityRuntime.cardState[${JSON.stringify(sourceInstanceId)}] = { active: false, faceDown: false, playedRound: 0 };
    state.abilityRuntime.noblePhantasmCostsThisRound[${JSON.stringify(playerId)}] = [{ cardId: 'b18-browser-np', cost: 3 }];
    processAbilityEvent(state, {
      id: 'b18-browser-result',
      type: 'after_battle_result_determined',
      battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:shinto:1',
      resultId: 'b18-browser-result',
      battleParticipantIds: ['p1', 'p2'],
      battlefieldId: 'shinto',
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
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
  try { return JSON.parse(String(payload)) as Record<string, unknown>; } catch { return undefined; }
}

function latestMatch(projections: MatchRoomProjection[]) {
  return projections.at(-1)?.match ?? undefined;
}

function latestResponseWindow(projections: MatchRoomProjection[]) {
  return latestMatch(projections)?.view.responseWindow;
}

function vpOf(projections: MatchRoomProjection[]): number | undefined {
  return latestMatch(projections)?.view.players.find((player) => player.id === playerId)?.vp;
}

function countVpEvents(match: NonNullable<MatchRoomProjection['match']>): number {
  return match.logs
    .flatMap((entry) => entry.type === 'dispatch_ok' ? (entry.payload?.events ?? []) : [])
    .filter((event) =>
      event?.type === 'victory_points_adjusted' &&
      event.playerId === playerId &&
      event.abilityId === abilityId &&
      event.delta === 1)
    .length;
}
