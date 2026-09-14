import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, MatchRoomSnapshot, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';
const wsBase = 'ws://127.0.0.1:8787';
const hostClientId = 'host-artoria-close';
const playerId = 'p7';
const curseDefinitionId = 'servant.artoria-alt.skill.sc-artoria-alt-2';
const nobleDefinitionId = 'servant.artoria-alt.skill.sc-artoria-alt-1';
const curseInstanceId = `${playerId}-${curseDefinitionId}`;
const nobleInstanceId = `${playerId}-${nobleDefinitionId}`;

test('routes Artoria Alter noble play through CLOSE, projection, reconnect, and stale rejection', async ({ page, request }) => {
  const roomId = `fd-artoria-close-${Date.now()}`;
  const room = await restoreArtoriaCloseRoom(request, roomId);
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
  await expect.poll(() => latestMatch(projections)?.priorityPlayerId).toBe(playerId);
  await expect.poll(() => zoneOf(projections, curseInstanceId)).toBe('attack_area');
  await expect.poll(() => zoneOf(projections, nobleInstanceId)).toBe('skill');

  const before = latestMatch(projections)!;
  const beforeRevision = before.view.revision;
  expect(before.view.legalActions).toContainEqual(expect.objectContaining({
    type: 'play_card',
    cardInstanceId: nobleInstanceId,
  }));

  const playMessage: ClientRoomMessage = {
    type: 'client:dispatch_command',
    expectedRevision: beforeRevision,
    command: {
      type: 'play_card',
      cardInstanceId: nobleInstanceId,
    },
  };

  await page.evaluate(({ targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, {
    targetRoomId: roomId,
    clientId: room.clientId,
    token: room.reconnectToken,
    message: playMessage,
  });

  await expect.poll(() => latestMatch(projections)?.view.revision).toBeGreaterThan(beforeRevision);
  await expect.poll(() => zoneOf(projections, curseInstanceId)).toBe('skill');
  await expect.poll(() => zoneOf(projections, nobleInstanceId)).toBe('attack_area');

  const settled = latestMatch(projections)!;
  const settledRevision = settled.view.revision;
  expect(settled.view.cards.filter((card) => card.instanceId === curseInstanceId)).toHaveLength(1);
  expect(settled.view.cards.filter((card) => card.instanceId === nobleInstanceId)).toHaveLength(1);
  expect(settled.logs).toContainEqual(expect.objectContaining({
    type: 'dispatch_ok',
    payload: expect.objectContaining({
      events: expect.arrayContaining([
        expect.objectContaining({
          type: 'effect_resolved',
          playerId,
          sourceCardId: curseInstanceId,
          abilityId: 'sc-artoria-alt-2.angra-mainyu-embrace',
        }),
      ]),
    }),
  }));

  const projectionCountBeforeReload = projections.length;
  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => projections.length).toBeGreaterThan(projectionCountBeforeReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(zoneOf(projections, curseInstanceId)).toBe('skill');
  expect(zoneOf(projections, nobleInstanceId)).toBe('attack_area');

  const errorCount = serverErrors.length;
  await page.evaluate(({ targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, {
    targetRoomId: roomId,
    clientId: room.clientId,
    token: room.reconnectToken,
    message: playMessage,
  });

  await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount);
  expect(serverErrors.at(-1)).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('Stale command revision'),
  });
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(zoneOf(projections, curseInstanceId)).toBe('skill');
  expect(zoneOf(projections, nobleInstanceId)).toBe('attack_area');
  expect(countCloseEvents(latestMatch(projections))).toBe(1);
});

async function restoreArtoriaCloseRoom(request: APIRequestContext, roomId: string): Promise<RoomHttpResponse> {
  const snapshot = buildArtoriaCloseSnapshot(roomId);
  const response = await request.post(`${httpBase}/rooms/${encodeURIComponent(roomId)}/restore`, { data: { snapshot } });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

function buildArtoriaCloseSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom } from '@fd/rules';
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: ${JSON.stringify(hostClientId)}, hostName: '房主', seed: 20260907 });
    room.selectSeat(${JSON.stringify(hostClientId)}, 7);
    room.startMatch(${JSON.stringify(hostClientId)});
    const session = room.session;
    const state = session.state;
    state.round = { roundNumber: 1, activePhase: 'action', prioritySeat: 7 };
    session.stopReason = undefined;
    state.abilityRuntime.hostRequests = [];
    state.abilityRuntime.responseWindows = [];
    delete state.abilityRuntime.pendingDecision;
    state.modeState ??= {};
    state.modeState.stagedAttacks = {};

    const player = state.players.find((candidate) => candidate.id === ${JSON.stringify(playerId)});
    if (!player) throw new Error('Artoria Alter player not found');
    player.status = 'active';
    player.locationId = 'miyama_town';
    player.mana = 12;

    const curse = state.cards.find((card) => card.instanceId === ${JSON.stringify(curseInstanceId)});
    const noble = state.cards.find((card) => card.instanceId === ${JSON.stringify(nobleInstanceId)});
    if (!curse || !noble) throw new Error('Artoria Alter CLOSE fixture cards not found');

    curse.zone = 'attack_area';
    curse.ownerPlayerId = ${JSON.stringify(playerId)};
    curse.controllerPlayerId = ${JSON.stringify(playerId)};
    curse.visibility = { scope: 'public' };
    state.abilityRuntime.cardState[curse.instanceId] = { active: true, faceDown: false, playedRound: 1 };

    noble.zone = 'skill';
    noble.ownerPlayerId = ${JSON.stringify(playerId)};
    noble.controllerPlayerId = ${JSON.stringify(playerId)};
    noble.visibility = { scope: 'owner_only', ownerPlayerId: ${JSON.stringify(playerId)} };
    state.abilityRuntime.cardState[noble.instanceId] = { active: false, faceDown: false, playedRound: 0 };

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

function countCloseEvents(match: MatchRoomProjection['match'] | undefined): number {
  const logs = match?.logs ?? [];
  return logs
    .flatMap((entry) => entry.type === 'dispatch_ok' ? (entry.payload?.events ?? []) : [])
    .filter((event) =>
      event?.type === 'effect_resolved' &&
      event.abilityId === 'sc-artoria-alt-2.angra-mainyu-embrace')
    .length;
}
