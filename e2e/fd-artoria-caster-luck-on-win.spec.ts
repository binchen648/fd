import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';
const hostClientId = 'host-b20-artoriac-luck';
const playerId = 'p1';
const sources = [
  ['b20-pilgrim-4', 'servant.artoriac.skill.sc-artoriac-4', 'sc-artoriac-4.unique-passive-luck-on-win'],
  ['b20-pilgrim-5', 'servant.artoriac.skill.sc-artoriac-5', 'sc-artoriac-5.unique-passive-luck-on-win'],
  ['b20-pilgrim-6', 'servant.artoriac.skill.sc-artoriac-6', 'sc-artoriac-6.unique-passive-luck-on-win'],
] as const;

test('resolves one Artoria Caster unique Luck-on-win response across reconnect and rejects stale replay', async ({ page, request }) => {
  const roomId = `fd-b20-artoriac-luck-${Date.now()}`;
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
  await expect.poll(() => responseAbilities(projections)).toEqual(sources.map((source) => source[2]));
  expect(latestMatch(projections)?.view.responseWindow).toMatchObject({ kind: 'choose_unique_trigger' });

  const pendingRevision = latestMatch(projections)!.view.revision;
  const countBeforeReload = projections.length;
  await page.reload();
  await expect.poll(() => projections.length).toBeGreaterThan(countBeforeReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(pendingRevision);
  await expect.poll(() => responseAbilities(projections)).toEqual(sources.map((source) => source[2]));
  await expect(page.getByText('Client is disconnected', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'resolve_response', exact: true }).first().click();
  await expect.poll(() => latestMatch(projections)?.view.responseWindow).toBeUndefined();
  await expect.poll(() => responseAbilities(projections)).toEqual([]);
  const settled = latestMatch(projections)!;
  const settledRevision = settled.view.revision;

  const command = sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'resolve_response' &&
    sources.some((source) => source[0] === message.command.cardInstanceId && source[2] === message.command.abilityId));
  expect(command).toBeTruthy();
  expect(command).toMatchObject({ type: 'client:dispatch_command', expectedRevision: pendingRevision });

  const countBeforeSettledReload = projections.length;
  await page.reload();
  await expect.poll(() => projections.length).toBeGreaterThan(countBeforeSettledReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(responseAbilities(projections)).toEqual([]);

  const errorCount = serverErrors.length;
  await page.evaluate(({ targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, { targetRoomId: roomId, clientId: room.clientId, token: room.reconnectToken, message: command! });

  await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount);
  expect(serverErrors.at(-1)).toMatchObject({
    type: 'server:error', code: 'command_failed', message: expect.stringContaining('Stale command revision'),
  });
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(responseAbilities(projections)).toEqual([]);
});

async function restoreRoom(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, { data: { snapshot: buildSnapshot(roomId) } });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

function buildSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom, processAbilityEvent } from '@fd/rules';
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: ${JSON.stringify(hostClientId)}, hostName: 'Host', seed: 202620 });
    room.selectSeat(${JSON.stringify(hostClientId)}, 1);
    room.startMatch(${JSON.stringify(hostClientId)});
    const session = room.session; const state = session.state;
    state.round = { roundNumber: 1, activePhase: 'battle', prioritySeat: 1 };
    session.stopReason = undefined; session.logs = [];
    state.abilityRuntime.hostRequests = []; state.abilityRuntime.responseWindows = []; state.abilityRuntime.pendingPostBattleEvents = [];
    delete state.abilityRuntime.pendingDecision;
    state.players.find((player) => player.id === ${JSON.stringify(playerId)}).servantCardId = 'servant.artoriac';
    const sources = ${JSON.stringify(sources)};
    for (const [instanceId, definitionId] of sources) {
      const existing = state.cards.find((card) => card.instanceId === instanceId);
      if (existing) {
        existing.definitionId = definitionId; existing.ownerPlayerId = ${JSON.stringify(playerId)}; existing.controllerPlayerId = ${JSON.stringify(playerId)};
        existing.zone = 'hand'; existing.visibility = { scope: 'owner_only', ownerPlayerId: ${JSON.stringify(playerId)} };
      } else {
        state.cards.push({ instanceId, definitionId, ownerPlayerId: ${JSON.stringify(playerId)}, controllerPlayerId: ${JSON.stringify(playerId)}, zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: ${JSON.stringify(playerId)} } });
      }
      state.abilityRuntime.cardState[instanceId] = { active: false, faceDown: false, playedRound: 0 };
    }
    processAbilityEvent(state, {
      id: 'b20-browser-win', type: 'after_controller_wins_battle', playerId: 'p1',
      battlePhaseResolutionId: 'battle-phase:20', battleId: 'battle-phase:20:battle:shinto:1', resultId: 'b20-browser-result',
      battleParticipantIds: ['p1', 'p2'], battlefieldId: 'shinto', battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
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

function latestMatch(projections: MatchRoomProjection[]) {
  return projections.at(-1)?.match ?? undefined;
}

function responseAbilities(projections: MatchRoomProjection[]): string[] {
  return latestMatch(projections)?.view.legalActions
    .filter((action) => action.type === 'resolve_response')
    .map((action) => action.type === 'resolve_response' ? action.abilityId : '') ?? [];
}
