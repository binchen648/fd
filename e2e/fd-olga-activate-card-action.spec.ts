import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';
const hostClientId = 'host-olga-activate';
const olgaPlayerId = 'p4';
const trismegistusDefinitionId = 'master.olga-marie.skill.trismegistus-grief';
const trismegistusInstanceId = `${olgaPlayerId}-${trismegistusDefinitionId}`;

test('routes Olga first battle loss through server battle history, round-end activation, reconnect, and stale rejection', async ({ page, request }) => {
  const roomId = `fd-olga-activate-${Date.now()}`;
  const room = await restoreOlgaBattleRoom(request, roomId);
  const projections: MatchRoomProjection[] = [];
  const serverErrors: ServerRoomMessage[] = [];

  page.on('websocket', (socket: PlaywrightWebSocket) => {
    socket.on('framereceived', (frame) => {
      const parsed = parseJson(frame.payload);
      if (parsed?.type === 'server:projection') {
        projections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection);
      }
      if (parsed?.type === 'server:error') serverErrors.push(parsed as ServerRoomMessage);
    });
  });

  await openRemoteRoom(page, room);
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect(page.getByLabel('实战阶段流程')).toContainText('行动阶段');
  await expect(page.getByRole('button', { name: '结束行动', exact: true })).toBeVisible();
  await expect.poll(() => latestMatch(projections)?.priorityPlayerId).toBe(olgaPlayerId);
  await expect.poll(() => zoneOf(projections, trismegistusInstanceId)).toBe('skill');

  const beforeRevision = latestMatch(projections)!.view.revision;
  const endTurnMessage: ClientRoomMessage = {
    type: 'client:end_turn',
    expectedRevision: beforeRevision,
  };

  await page.getByRole('button', { name: '结束行动', exact: true }).click();

  await expect.poll(() => latestMatch(projections)!.view.revision).toBeGreaterThan(beforeRevision);
  await expect.poll(() => zoneOf(projections, trismegistusInstanceId)).toBe('field');
  const settled = latestMatch(projections)!;
  const settledRevision = settled.view.revision;
  expect(settled.logs.some((entry) => entry.type === 'battle_resolved')).toBe(true);
  expect(settled.logs.some((entry) => entry.type === 'round_end')).toBe(true);
  expect(settled.view.cards.filter((card) => card.instanceId === trismegistusInstanceId)).toHaveLength(1);

  const projectionCountBeforeReload = projections.length;
  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => projections.length).toBeGreaterThan(projectionCountBeforeReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(zoneOf(projections, trismegistusInstanceId)).toBe('field');
  expect(latestMatch(projections)!.view.cards.filter((card) => card.instanceId === trismegistusInstanceId)).toHaveLength(1);

  const errorCount = serverErrors.length;
  await page.evaluate(({ targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, {
    targetRoomId: roomId,
    clientId: room.clientId,
    token: room.reconnectToken,
    message: endTurnMessage,
  });

  await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount);
  expect(serverErrors.at(-1)).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('Stale command revision'),
  });
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(zoneOf(projections, trismegistusInstanceId)).toBe('field');
  expect(latestMatch(projections)!.view.cards.filter((card) => card.instanceId === trismegistusInstanceId)).toHaveLength(1);
});

async function restoreOlgaBattleRoom(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const snapshot = buildOlgaBattleSnapshot(roomId);
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, { data: { snapshot } });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

function buildOlgaBattleSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom } from '@fd/rules';
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: ${JSON.stringify(hostClientId)}, hostName: '房主', seed: 20260904 });
    room.selectSeat(${JSON.stringify(hostClientId)}, 4);
    room.startMatch(${JSON.stringify(hostClientId)});
    const session = room.session;
    const state = session.state;
    state.round = { roundNumber: 1, activePhase: 'action', prioritySeat: 4 };
    session.stopReason = undefined;
    session.battleHistory = [];
    state.battleResults = [];
    state.eventPlacements = [];
    state.currentSituationModifiers = [];
    state.abilityRuntime.hostRequests = [];
    state.abilityRuntime.responseWindows = [];
    state.abilityRuntime.pendingDelayedActivations = [];
    delete state.abilityRuntime.pendingDecision;
    state.modeState ??= {};
    state.modeState.stagedAttacks = {};

    for (const player of state.players) {
      player.status = ['p1', ${JSON.stringify(olgaPlayerId)}].includes(player.id) ? 'active' : 'eliminated';
      if (player.status === 'active') player.locationId = 'miyama_town';
      else delete player.locationId;
    }

    const p1Cards = state.cards.filter((card) => card.ownerPlayerId === 'p1');
    const attack = p1Cards
      .map((card) => ({ card, definition: state.abilityRuntime.pack.cards[card.definitionId] }))
      .filter((entry) => Number(entry.definition?.cardFace?.basePower ?? 0) > 0)
      .sort((left, right) => Number(right.definition.cardFace.basePower) - Number(left.definition.cardFace.basePower))[0].card;
    for (const card of p1Cards) {
      card.zone = 'discard';
      card.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
      if (state.abilityRuntime.cardState[card.instanceId]) state.abilityRuntime.cardState[card.instanceId].active = false;
    }
    attack.zone = 'attack_area';
    attack.visibility = { scope: 'public' };
    state.abilityRuntime.cardState[attack.instanceId] = { active: true, faceDown: false, playedRound: 1 };

    for (const card of state.cards.filter((candidate) => candidate.ownerPlayerId === ${JSON.stringify(olgaPlayerId)})) {
      if (card.definitionId === 'master.olga-marie.skill.astronomical-science' ||
          card.definitionId === ${JSON.stringify(trismegistusDefinitionId)} ||
          card.definitionId === 'master.olga-marie.skill.chaldeas') {
        card.zone = 'skill';
        card.visibility = { scope: 'owner_only', ownerPlayerId: ${JSON.stringify(olgaPlayerId)} };
        state.abilityRuntime.cardState[card.instanceId] = { active: false, faceDown: false, playedRound: 0 };
      } else if (card.zone === 'attack_area' || card.zone === 'field') {
        card.zone = 'discard';
        card.visibility = { scope: 'owner_only', ownerPlayerId: ${JSON.stringify(olgaPlayerId)} };
        if (state.abilityRuntime.cardState[card.instanceId]) state.abilityRuntime.cardState[card.instanceId].active = false;
      }
    }
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

function latestMatch(projections: MatchRoomProjection[]) {
  return projections.at(-1)?.match ?? undefined;
}

function zoneOf(projections: MatchRoomProjection[], instanceId: string): string | undefined {
  return latestMatch(projections)?.view.cards.find((card) => card.instanceId === instanceId)?.zone;
}
