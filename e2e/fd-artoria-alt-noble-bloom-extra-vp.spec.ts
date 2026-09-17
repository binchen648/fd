import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';
const hostClientId = 'host-b19-noble-bloom-extra';
const playerId = 'p1';
const sourceInstanceId = 'b19-artoria-alt-resistance';
const sourceDefinitionId = 'servant.artoria-alt.skill.sc-artoria-alt-3';
const baseAbilityId = 'sc-artoria-alt-3.noble-bloom';
const extraAbilityId = 'sc-artoria-alt-3.noble-bloom-extra-vp';

test('keeps Noble Bloom base and extra VP as independent remote responses with reconnect and stale safety', async ({ page, request }) => {
  const roomId = `fd-b19-noble-bloom-extra-${Date.now()}`;
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
  await expect.poll(() => hasAction(projections, baseAbilityId)).toBe(true);
  expect(hasAction(projections, extraAbilityId)).toBe(false);
  expect(vpOf(projections)).toBe(2);

  await page.getByRole('button', { name: 'resolve_response', exact: true }).click();
  await expect.poll(() => vpOf(projections)).toBe(3);
  await expect.poll(() => hasAction(projections, extraAbilityId)).toBe(true);
  expect(countVpEvents(latestMatch(projections)!, baseAbilityId)).toBe(1);
  expect(countVpEvents(latestMatch(projections)!, extraAbilityId)).toBe(0);

  const extraPending = latestMatch(projections)!;
  const extraRevision = extraPending.view.revision;
  const countBeforePendingReload = projections.length;
  await page.reload();
  await expect.poll(() => projections.length).toBeGreaterThan(countBeforePendingReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(extraRevision);
  await expect.poll(() => hasAction(projections, extraAbilityId)).toBe(true);
  expect(vpOf(projections)).toBe(3);

  await page.getByRole('button', { name: 'resolve_response', exact: true }).click();
  await expect.poll(() => latestResponseWindow(projections)).toBeUndefined();
  await expect.poll(() => vpOf(projections)).toBe(4);

  const settled = latestMatch(projections)!;
  const settledRevision = settled.view.revision;
  expect(countVpEvents(settled, baseAbilityId)).toBe(1);
  expect(countVpEvents(settled, extraAbilityId)).toBe(1);

  const extraCommand = sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'resolve_response' &&
    message.command.cardInstanceId === sourceInstanceId &&
    message.command.abilityId === extraAbilityId);
  expect(extraCommand).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision: extraRevision,
    command: { type: 'resolve_response', cardInstanceId: sourceInstanceId, abilityId: extraAbilityId },
  });

  const countBeforeSettledReload = projections.length;
  await page.reload();
  await expect.poll(() => projections.length).toBeGreaterThan(countBeforeSettledReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(vpOf(projections)).toBe(4);
  expect(countVpEvents(latestMatch(projections)!, baseAbilityId)).toBe(1);
  expect(countVpEvents(latestMatch(projections)!, extraAbilityId)).toBe(1);

  const errorCount = serverErrors.length;
  await page.evaluate(({ targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, {
    targetRoomId: roomId,
    clientId: room.clientId,
    token: room.reconnectToken,
    message: extraCommand!,
  });

  await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount);
  expect(serverErrors.at(-1)).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('Stale command revision'),
  });
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(vpOf(projections)).toBe(4);
  expect(countVpEvents(latestMatch(projections)!, extraAbilityId)).toBe(1);
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
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: ${JSON.stringify(hostClientId)}, hostName: 'Host', seed: 20260914 });
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
    state.abilityRuntime.noblePhantasmCostsThisRound[${JSON.stringify(playerId)}] = [{ cardId: 'b19-browser-np', cost: 4 }];
    processAbilityEvent(state, {
      id: 'b19-browser-result',
      type: 'after_battle_result_determined',
      battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:shinto:1',
      resultId: 'b19-browser-result',
      battleParticipantIds: ['p1', 'p2'],
      battlefieldId: 'shinto',
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
    process.stdout.write(JSON.stringify(room.serializeRoom()));
  `;
  return JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '--eval', script], {
    cwd: process.cwd(), encoding: 'utf8',
  })) as MatchRoomSnapshot;
}

async function openRemoteRoom(page: Page, response: RoomHttpResponse): Promise<void> {
  const params = new URLSearchParams({
    remote: '1', roomId: response.roomId, clientId: response.clientId,
    token: response.reconnectToken, http: httpBase, ws: wsBase,
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

function hasAction(projections: MatchRoomProjection[], abilityId: string): boolean {
  return latestMatch(projections)?.view.legalActions.some((candidate) =>
    candidate.type === 'resolve_response' && candidate.cardInstanceId === sourceInstanceId && candidate.abilityId === abilityId) ?? false;
}

function countVpEvents(match: NonNullable<MatchRoomProjection['match']>, abilityId: string): number {
  return match.logs
    .flatMap((entry) => entry.type === 'dispatch_ok' ? (entry.payload?.events ?? []) : [])
    .filter((entry) =>
      entry?.type === 'victory_points_adjusted' &&
      entry.playerId === playerId &&
      entry.abilityId === abilityId &&
      entry.delta === 1)
    .length;
}
