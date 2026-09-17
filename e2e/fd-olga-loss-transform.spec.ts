import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';
const hostClientId = 'host-b23-olga-transform';
const olgaPlayerId = 'p4';
const opponentPlayerId = 'p1';
const trismegistusInstanceId = 'b23-trismegistus';

test('routes Olga active-source loss transform through remote battle, reconnect, and stale replay rejection', async ({ page, request }) => {
  const roomId = `fd-b23-olga-transform-${Date.now()}`;
  const room = await restoreBattleRoom(request, roomId);
  const projections: MatchRoomProjection[] = [];
  const serverErrors: ServerRoomMessage[] = [];

  page.on('websocket', (socket: PlaywrightWebSocket) => {
    socket.on('framereceived', (frame) => {
      const parsed = parseJson(frame.payload);
      if (parsed?.type === 'server:projection') projections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection);
      if (parsed?.type === 'server:error') serverErrors.push(parsed as ServerRoomMessage);
    });
  });

  await openRemoteRoom(page, room);
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect(page.getByRole('button', { name: '结束行动', exact: true })).toBeVisible();
  await expect.poll(() => latestMatch(projections)?.priorityPlayerId).toBe(olgaPlayerId);
  await expect.poll(() => zoneOf(projections, trismegistusInstanceId)).toBe('field');

  const beforeRevision = latestMatch(projections)!.view.revision;
  const staleEndTurn: ClientRoomMessage = { type: 'client:end_turn', expectedRevision: beforeRevision };
  await sendRoomMessage(page, roomId, room, staleEndTurn);

  await expect.poll(() => latestMatch(projections)!.view.revision).toBeGreaterThan(beforeRevision);
  const settled = latestMatch(projections)!;
  const settledRevision = settled.view.revision;
  expect(settled.phase).toBe('round_end');
  expect(zoneOf(projections, trismegistusInstanceId)).toBe('field');
  expect(settled.battleBreakdowns).toEqual(expect.arrayContaining([
    expect.objectContaining({
      battlefieldId: 'miyama_town',
      winnerPlayerIds: [opponentPlayerId],
      participantBreakdowns: expect.arrayContaining([
        expect.objectContaining({ playerId: olgaPlayerId }),
        expect.objectContaining({ playerId: opponentPlayerId }),
      ]),
    }),
  ]));
  const barrierIndex = settled.logs.findIndex((entry) => entry.type === 'battle_post_scoring_barrier_open');
  const lossDispatchIndex = settled.logs.findIndex((entry) =>
    entry.type === 'battle_result_event_dispatched' && entry.payload?.battlefieldId === 'miyama_town');
  expect(barrierIndex).toBeGreaterThanOrEqual(0);
  expect(lossDispatchIndex).toBeGreaterThan(barrierIndex);

  const projectionCountBeforeReconnect = projections.length;
  await page.goto('about:blank');
  await page.waitForTimeout(100);
  await openRemoteRoom(page, room);
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => projections.length).toBeGreaterThan(projectionCountBeforeReconnect);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(zoneOf(projections, trismegistusInstanceId)).toBe('field');
  expect(latestMatch(projections)?.battleBreakdowns).toHaveLength(settled.battleBreakdowns.length);

  const errorCount = serverErrors.length;
  await sendRoomMessage(page, roomId, room, staleEndTurn);

  await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount);
  expect(serverErrors.at(-1)).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('Stale command revision'),
  });
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(zoneOf(projections, trismegistusInstanceId)).toBe('field');
  expect(latestMatch(projections)?.battleBreakdowns).toHaveLength(settled.battleBreakdowns.length);
});

async function restoreBattleRoom(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, {
    data: { snapshot: buildBattleSnapshot(roomId) },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

function buildBattleSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom } from '@fd/rules';
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: ${JSON.stringify(hostClientId)}, hostName: '房主', seed: 20260904 });
    room.selectSeat(${JSON.stringify(hostClientId)}, 4);
    room.startMatch(${JSON.stringify(hostClientId)});
    const session = room.session; const state = session.state;
    state.round = { roundNumber: 1, activePhase: 'action', prioritySeat: 4 };
    session.stopReason = undefined; session.logs = []; session.battleHistory = [];
    state.battleResults = []; state.eventPlacements = []; state.currentSituationModifiers = [];
    state.abilityRuntime.hostRequests = []; state.abilityRuntime.responseWindows = []; state.abilityRuntime.pendingDelayedActivations = []; state.abilityRuntime.pendingPostBattleEvents = [];
    state.abilityRuntime.transformedReturnSilenceSourceCardIds = [];
    delete state.abilityRuntime.pendingBattleTerminalEvent; delete state.abilityRuntime.pendingDecision;
    state.modeState ??= {}; state.modeState.stagedAttacks = {};

    for (const player of state.players) {
      player.status = [${JSON.stringify(opponentPlayerId)}, ${JSON.stringify(olgaPlayerId)}].includes(player.id) ? 'active' : 'eliminated';
      player.vp = 0; player.militaryResult = 0;
      if (player.status === 'active') player.locationId = 'miyama_town';
      else delete player.locationId;
    }

    state.cards = [];
    state.abilityRuntime.cardState = {};
    state.abilityRuntime.ongoingEffects = [];
    state.cards.push({
      instanceId: ${JSON.stringify(trismegistusInstanceId)},
      definitionId: 'master.olga-marie.skill.trismegistus-grief',
      ownerPlayerId: ${JSON.stringify(olgaPlayerId)},
      controllerPlayerId: ${JSON.stringify(olgaPlayerId)},
      zone: 'field',
      visibility: { scope: 'public' },
    });
    state.abilityRuntime.cardState[${JSON.stringify(trismegistusInstanceId)}] = { active: true, faceDown: false, playedRound: 1 };
    state.cards.push({
      instanceId: 'b23-opponent-attack',
      definitionId: 'basic.strength.5',
      ownerPlayerId: ${JSON.stringify(opponentPlayerId)},
      controllerPlayerId: ${JSON.stringify(opponentPlayerId)},
      zone: 'attack_area',
      visibility: { scope: 'public' },
    });
    state.abilityRuntime.cardState['b23-opponent-attack'] = { active: true, faceDown: false, playedRound: 1 };

    process.stdout.write(JSON.stringify(room.serializeRoom()));
  `;
  return JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '--eval', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })) as MatchRoomSnapshot;
}

async function sendRoomMessage(page: Page, roomId: string, client: Pick<RoomHttpResponse, 'clientId' | 'reconnectToken'>, message: ClientRoomMessage): Promise<void> {
  await page.evaluate(({ targetRoomId, clientId, token, payload }) => new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('error', () => reject(new Error('room websocket failed')));
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify(payload));
      setTimeout(() => { socket.close(); resolve(); }, 50);
    });
  }), { targetRoomId: roomId, clientId: client.clientId, token: client.reconnectToken, payload: message });
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
function latestMatch(projections: MatchRoomProjection[]) { return projections.at(-1)?.match ?? undefined; }
function zoneOf(projections: MatchRoomProjection[], instanceId: string): string | undefined {
  return latestMatch(projections)?.view.cards.find((card) => card.instanceId === instanceId)?.zone;
}
