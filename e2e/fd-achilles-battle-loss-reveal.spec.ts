import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';
const hostClientId = 'host-b16-achilles-reveal';
const achillesPlayerId = 'p3';

test('reveals Achilles after a scored battle loss and preserves public projection across reconnect/stale replay', async ({ page, request }) => {
  const roomId = `fd-b16-achilles-reveal-${Date.now()}`;
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
  await expect.poll(() => latestMatch(projections)?.priorityPlayerId).toBe('p1');
  await expect.poll(() => servantPackageOf(projections, achillesPlayerId)).toBeUndefined();

  const beforeRevision = latestMatch(projections)!.view.revision;
  const staleEndTurn: ClientRoomMessage = { type: 'client:end_turn', expectedRevision: beforeRevision };
  await page.getByRole('button', { name: '结束行动', exact: true }).click();

  await expect.poll(() => latestMatch(projections)!.view.revision).toBeGreaterThan(beforeRevision);
  await expect.poll(() => servantPackageOf(projections, achillesPlayerId)?.id).toBe('servant.achilles');
  const settled = latestMatch(projections)!;
  const settledRevision = settled.view.revision;
  const barrierIndex = settled.logs.findIndex((entry) => entry.type === 'battle_post_scoring_barrier_open');
  const resultIndex = settled.logs.findIndex((entry) => entry.type === 'battle_result_event_dispatched' && entry.payload?.battlefieldId === 'shinto');
  const terminalIndex = settled.logs.findIndex((entry) => entry.type === 'battle_terminal_event_dispatched');
  expect(barrierIndex).toBeGreaterThanOrEqual(0);
  expect(resultIndex).toBeGreaterThan(barrierIndex);
  expect(terminalIndex).toBeGreaterThan(resultIndex);

  const projectionCountBeforeReload = projections.length;
  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => projections.length).toBeGreaterThan(projectionCountBeforeReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(servantPackageOf(projections, achillesPlayerId)?.id).toBe('servant.achilles');

  const errorCount = serverErrors.length;
  await page.evaluate(({ targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, { targetRoomId: roomId, clientId: room.clientId, token: room.reconnectToken, message: staleEndTurn });
  await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount);
  expect(serverErrors.at(-1)).toMatchObject({ type: 'server:error', code: 'command_failed', message: expect.stringContaining('Stale command revision') });
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(servantPackageOf(projections, achillesPlayerId)?.id).toBe('servant.achilles');
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
    const achillesPairing = session.pairings.find((pairing) => pairing.playerId === 'p3');
    if (achillesPairing?.servant.id !== 'servant.achilles') throw new Error('Seed fixture no longer maps p3 to Achilles');
    state.round = { roundNumber: 1, activePhase: 'action', prioritySeat: 1 };
    session.stopReason = undefined; session.logs = []; session.battleHistory = [];
    state.battleResults = []; state.eventPlacements = []; state.currentSituationModifiers = [];
    state.abilityRuntime.hostRequests = []; state.abilityRuntime.responseWindows = []; state.abilityRuntime.pendingPostBattleEvents = [];
    state.abilityRuntime.revealedServants = state.abilityRuntime.revealedServants.filter((id) => id !== 'p3');
    delete state.abilityRuntime.pendingBattleTerminalEvent; delete state.abilityRuntime.pendingDecision;
    state.modeState ??= {}; state.modeState.stagedAttacks = {};
    const active = new Set(['p1','p2','p3','p4']);
    for (const player of state.players) {
      player.status = active.has(player.id) ? 'active' : 'eliminated'; player.vp = 0; player.militaryResult = 0;
      if (player.id === 'p1' || player.id === 'p2') player.locationId = 'miyama_town';
      else if (player.id === 'p3' || player.id === 'p4') player.locationId = 'shinto'; else delete player.locationId;
    }
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
    addAttack('b16-miyama-winner', 'basic.strength.5', 'p2');
    addAttack('b16-achilles-opponent', 'basic.strength.5', 'p4');
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
function servantPackageOf(projections: MatchRoomProjection[], playerId: string): { id?: string } | undefined {
  const player = latestMatch(projections)?.view.players.find((candidate) => candidate.id === playerId) as ({ servantPackage?: { id?: string } } | undefined);
  return player?.servantPackage;
}
