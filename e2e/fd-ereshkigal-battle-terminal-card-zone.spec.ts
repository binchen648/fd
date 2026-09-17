import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';
const hostClientId = 'host-b15-eresh-terminal';
const ereshPlayerId = 'p1';
const ereshDefinitionId = 'servant.ereshkigal.skill.sc-ereshkigal-2';
const ereshInstanceId = 'b15-eresh-netherworld';

test('returns Eresh source at the battle terminal before cleanup and preserves it across reconnect/stale replay', async ({ page, request }) => {
  const roomId = `fd-b15-eresh-terminal-${Date.now()}`;
  const room = await restoreRoom(request, roomId);
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
  await expect.poll(() => latestMatch(projections)?.priorityPlayerId).toBe(ereshPlayerId);
  await expect.poll(() => zoneOf(projections, ereshInstanceId)).toBe('attack_area');

  const beforeRevision = latestMatch(projections)!.view.revision;
  const staleEndTurn: ClientRoomMessage = { type: 'client:end_turn', expectedRevision: beforeRevision };
  await page.getByRole('button', { name: '结束行动', exact: true }).click();

  await expect.poll(() => latestMatch(projections)!.view.revision).toBeGreaterThan(beforeRevision);
  await expect.poll(() => zoneOf(projections, ereshInstanceId)).toBe('skill');
  const settled = latestMatch(projections)!;
  const settledRevision = settled.view.revision;
  expect(countTerminalEvents(settled)).toBe(1);
  const resultIndexes = settled.logs
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.type === 'battle_result_event_dispatched')
    .map(({ index }) => index);
  const terminalIndex = settled.logs.findIndex((entry) => entry.type === 'battle_terminal_event_dispatched');
  expect(resultIndexes.length).toBeGreaterThanOrEqual(2);
  expect(terminalIndex).toBeGreaterThan(Math.max(...resultIndexes));
  expect(settled.logs[terminalIndex]?.payload).toMatchObject({
    battlePhaseResolutionId: 'battle-phase:1',
    battleIds: expect.arrayContaining([
      expect.stringContaining('battle-phase:1:battle:miyama_town'),
      expect.stringContaining('battle-phase:1:battle:shinto'),
    ]),
    resultIds: expect.arrayContaining([expect.stringContaining(':result')]),
    scoringReceiptIds: expect.arrayContaining([
      'battle-phase:1:score:miyama_town',
      'battle-phase:1:score:shinto',
    ]),
  });

  const projectionCountBeforeReload = projections.length;
  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => projections.length).toBeGreaterThan(projectionCountBeforeReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(zoneOf(projections, ereshInstanceId)).toBe('skill');
  expect(countTerminalEvents(latestMatch(projections))).toBe(1);

  const errorCount = serverErrors.length;
  await page.evaluate(({ targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, { targetRoomId: roomId, clientId: room.clientId, token: room.reconnectToken, message: staleEndTurn });
  await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount);
  expect(serverErrors.at(-1)).toMatchObject({ type: 'server:error', code: 'command_failed', message: expect.stringContaining('Stale command revision') });
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(zoneOf(projections, ereshInstanceId)).toBe('skill');
  expect(countTerminalEvents(latestMatch(projections))).toBe(1);
});

async function restoreRoom(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, { data: { snapshot: buildSnapshot(roomId) } });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

function buildSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom } from '@fd/rules';
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: ${JSON.stringify(hostClientId)}, hostName: '房主', seed: 20260904 });
    room.selectSeat(${JSON.stringify(hostClientId)}, 1);
    room.startMatch(${JSON.stringify(hostClientId)});
    const session = room.session; const state = session.state;
    state.round = { roundNumber: 1, activePhase: 'action', prioritySeat: 1 };
    session.stopReason = undefined; session.logs = []; session.battleHistory = [];
    state.battleResults = []; state.eventPlacements = []; state.currentSituationModifiers = [];
    state.abilityRuntime.hostRequests = []; state.abilityRuntime.responseWindows = []; state.abilityRuntime.pendingPostBattleEvents = [];
    delete state.abilityRuntime.pendingBattleTerminalEvent; delete state.abilityRuntime.pendingDecision;
    state.modeState ??= {}; state.modeState.stagedAttacks = {};
    const active = new Set(['p1','p2','p5','p6']);
    for (const player of state.players) {
      player.status = active.has(player.id) ? 'active' : 'eliminated'; player.vp = 0; player.militaryResult = 0;
      if (player.id === 'p1' || player.id === 'p2') player.locationId = 'miyama_town';
      else if (player.id === 'p5' || player.id === 'p6') player.locationId = 'shinto'; else delete player.locationId;
    }
    state.players.find((player) => player.id === ${JSON.stringify(ereshPlayerId)}).servantCardId = 'servant.ereshkigal';
    for (const card of state.cards) {
      if (card.zone === 'field' || card.zone === 'attack_area') {
        card.zone = 'discard'; card.visibility = { scope: 'owner_only', ownerPlayerId: card.ownerPlayerId };
        if (state.abilityRuntime.cardState[card.instanceId]) state.abilityRuntime.cardState[card.instanceId].active = false;
      }
    }
    const addAttack = (instanceId, definitionId, ownerPlayerId) => {
      state.cards.push({ instanceId, definitionId, ownerPlayerId, controllerPlayerId: ownerPlayerId, zone: 'attack_area', visibility: { scope: 'public' } });
      state.abilityRuntime.cardState[instanceId] = { active: true, faceDown: false, playedRound: 1 };
    };
    addAttack(${JSON.stringify(ereshInstanceId)}, ${JSON.stringify(ereshDefinitionId)}, ${JSON.stringify(ereshPlayerId)});
    addAttack('b15-opponent-2', 'basic.strength.5', 'p2');
    addAttack('b15-second-5', 'basic.strength.2', 'p5');
    addAttack('b15-second-6', 'basic.strength.5', 'p6');
    process.stdout.write(JSON.stringify(room.serializeRoom()));
  `;
  return JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '--eval', script], { cwd: process.cwd(), encoding: 'utf8' })) as MatchRoomSnapshot;
}

async function openRemoteRoom(page: Page, response: RoomHttpResponse): Promise<void> {
  const params = new URLSearchParams({ remote: '1', roomId: response.roomId, clientId: response.clientId, token: response.reconnectToken, http: httpBase, ws: wsBase });
  await page.goto(`/?${params.toString()}`);
}

function parseJson(payload: string | Buffer): Record<string, unknown> | undefined {
  try { return JSON.parse(String(payload)) as Record<string, unknown>; } catch { return undefined; }
}
function latestMatch(projections: MatchRoomProjection[]) { return projections.at(-1)?.match ?? undefined; }
function zoneOf(projections: MatchRoomProjection[], instanceId: string): string | undefined {
  return latestMatch(projections)?.view.cards.find((card) => card.instanceId === instanceId)?.zone;
}
function countTerminalEvents(match: MatchRoomProjection['match'] | undefined): number {
  return (match?.logs ?? []).filter((entry) => entry.type === 'battle_terminal_event_dispatched').length;
}
