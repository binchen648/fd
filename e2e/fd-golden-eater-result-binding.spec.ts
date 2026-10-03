import { expect, test, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';
import {
  goldenEaterFirstTargetInstanceId,
  goldenEaterSecondTargetInstanceId,
  goldenEaterSourceInstanceId,
} from './support/prepare-golden-eater-room';

const goldenEaterAbilityId = 'sc-kintoki-3.golden-eater';
const goldenEaterSourceDefinitionId = 'servant.kintoki.skill.sc-kintoki-3';
let fixtureHttpBase = '';
let fixtureWsBase = '';
let fixtureProcess: ChildProcess | undefined;
let fixtureRoom: Pick<RoomHttpResponse, 'roomId' | 'clientId' | 'reconnectToken'>;

test.beforeAll(async () => {
  const script = resolve('e2e/support/start-golden-eater-fixture-server.ts');
  fixtureProcess = spawn(process.execPath, ['--import', 'tsx', script], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const ready = await new Promise<{ httpBase: string; wsBase: string; roomId: string; clientId: string; reconnectToken: string }>((resolveReady, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Golden Eater fixture server did not start: ${output}`)), 15_000);
    fixtureProcess!.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString('utf8');
      const line = output.split(/\r?\n/).find((candidate) => candidate.trim().startsWith('{'));
      if (!line) return;
      clearTimeout(timer);
      try {
        resolveReady(JSON.parse(line) as { httpBase: string; wsBase: string; roomId: string; clientId: string; reconnectToken: string });
      } catch (error) {
        reject(error);
      }
    });
    fixtureProcess!.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString('utf8'); });
    fixtureProcess!.once('error', reject);
    fixtureProcess!.once('exit', (code) => {
      if (code !== null && code !== 0) reject(new Error(`Golden Eater fixture server exited with ${code}: ${output}`));
    });
  });
  fixtureHttpBase = ready.httpBase;
  fixtureWsBase = ready.wsBase;
  fixtureRoom = { roomId: ready.roomId, clientId: ready.clientId, reconnectToken: ready.reconnectToken };
});

test.afterAll(async () => {
  fixtureProcess?.kill();
  fixtureProcess = undefined;
});

test('routes Golden Eater through browser, staged pending reconnect, projection, and stale replay rejection', async ({ page }) => {
  const room = fixtureRoom;
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
      if (parsed?.type === 'server:projection') {
        projections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection);
      }
      if (parsed?.type === 'server:error') serverErrors.push(parsed as ServerRoomMessage);
    });
  });

  await openRemoteRoom(page, room);
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect(page.getByRole('region', { name: '本人操作台', exact: true })).toContainText('servant.kintoki');
  await expect.poll(() => latestSelfPlayer(projections)?.mana).toBe(12);

  const initial = projections.at(-1)?.match;
  const initialRevision = initial?.view.revision;
  expect(initialRevision).toEqual(expect.any(Number));
  expect(initial?.view.legalActions).toContainEqual(expect.objectContaining({
    type: 'activate_ability',
    cardInstanceId: goldenEaterSourceInstanceId,
    abilityId: goldenEaterAbilityId,
  }));

  await page.getByRole('button', { name: new RegExp(`检视 ${escapeRegExp(goldenEaterSourceDefinitionId)}`) }).click();
  await expect(page.getByRole('dialog', { name: goldenEaterSourceDefinitionId })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(`发动能力 ${escapeRegExp(goldenEaterAbilityId)}`) }).click();

  await expect.poll(() => latestPendingDecision(projections)?.candidates).toEqual([
    goldenEaterFirstTargetInstanceId,
    goldenEaterSecondTargetInstanceId,
  ]);
  const activationCommand = sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'activate_ability' &&
    message.command.abilityId === goldenEaterAbilityId,
  );
  expect(activationCommand).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision: initialRevision,
    command: {
      type: 'activate_ability',
      cardInstanceId: goldenEaterSourceInstanceId,
      abilityId: goldenEaterAbilityId,
    },
  });

  const firstPendingRevision = projections.at(-1)?.match?.view.revision;
  expect(firstPendingRevision).toEqual(expect.any(Number));
  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => latestPendingDecision(projections)?.candidates).toEqual([
    goldenEaterFirstTargetInstanceId,
    goldenEaterSecondTargetInstanceId,
  ]);
  expect(latestSelfPlayer(projections)?.mana).toBe(12);

  const firstTargetWindow = page.getByRole('article').filter({ hasText: '选择目标' });
  await expect(firstTargetWindow).toBeVisible();
  await firstTargetWindow.getByRole('button', { name: /黄金冲击/ }).first().click();
  await firstTargetWindow.getByRole('button', { name: 'choose_target' }).click();

  await expect.poll(() => latestPendingDecision(projections)?.candidates).toEqual([goldenEaterSecondTargetInstanceId]);
  await expect.poll(() => projectedCardZone(projections.at(-1), goldenEaterFirstTargetInstanceId)).toBe('skill');
  await expect.poll(() => latestSelfPlayer(projections)?.vp).toBe(2);
  expect(latestSelfPlayer(projections)?.mana).toBe(12);

  const secondPendingRevision = projections.at(-1)?.match?.view.revision;
  const secondDecisionId = latestPendingDecision(projections)?.id;
  expect(secondPendingRevision).toEqual(expect.any(Number));
  expect(secondDecisionId).toEqual(expect.any(String));
  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => latestPendingDecision(projections)?.candidates).toEqual([goldenEaterSecondTargetInstanceId]);
  const secondTargetWindow = page.getByRole('article').filter({ hasText: '选择目标' });
  await secondTargetWindow.getByRole('button', { name: /黄金冲击/ }).click();
  await secondTargetWindow.getByRole('button', { name: 'choose_target' }).click();

  const secondStageCommand = sentMessages.find((message) =>
    message.type === 'client:dispatch_command' &&
    message.command.type === 'choose_target' &&
    message.command.decisionId === secondDecisionId &&
    message.command.selectedIds.includes(goldenEaterSecondTargetInstanceId),
  );
  expect(secondStageCommand).toMatchObject({
    type: 'client:dispatch_command',
    expectedRevision: secondPendingRevision,
    command: {
      type: 'choose_target',
      decisionId: secondDecisionId,
      selectedIds: [goldenEaterSecondTargetInstanceId],
    },
  });

  await expect.poll(() => latestPendingDecision(projections)).toBeUndefined();
  await expect.poll(() => projectedCardZone(projections.at(-1), goldenEaterSecondTargetInstanceId)).toBe('skill');
  await expect.poll(() => latestSelfPlayer(projections)?.mana).toBe(5);
  await expect.poll(() => latestSelfPlayer(projections)?.vp).toBe(4);
  const settledRevision = projections.at(-1)?.match?.view.revision;
  const settledLogs = structuredClone(projections.at(-1)?.match?.logs ?? []);
  expect(settledRevision).toEqual(expect.any(Number));
  expect(secondPendingRevision).toEqual(expect.any(Number));

  const staleErrorCount = serverErrors.length;
  await page.evaluate(({ wsBase, roomId: targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`${wsBase}/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, {
    wsBase: fixtureWsBase,
    roomId: room.roomId,
    clientId: room.clientId,
    token: room.reconnectToken,
    message: secondStageCommand!,
  });
  await expect.poll(() => serverErrors.length).toBeGreaterThan(staleErrorCount);
  expect(serverErrors.at(-1)).toMatchObject({
    type: 'server:error',
    code: 'command_failed',
    message: expect.stringContaining('Stale command revision'),
  });
  await expect.poll(() => latestSelfPlayer(projections)?.mana).toBe(5);
  expect(latestSelfPlayer(projections)?.vp).toBe(4);
  expect(projectedCardZone(projections.at(-1), goldenEaterFirstTargetInstanceId)).toBe('skill');
  expect(projectedCardZone(projections.at(-1), goldenEaterSecondTargetInstanceId)).toBe('skill');
  expect(latestPendingDecision(projections)).toBeUndefined();
  expect(projections.at(-1)?.match?.view.revision).toBe(settledRevision);
  expect(projections.at(-1)?.match?.logs).toEqual(settledLogs);
});

async function openRemoteRoom(page: Page, response: Pick<RoomHttpResponse, 'roomId' | 'clientId' | 'reconnectToken'>): Promise<void> {
  const params = new URLSearchParams({
    remote: '1',
    roomId: response.roomId,
    clientId: response.clientId,
    token: response.reconnectToken,
    http: fixtureHttpBase,
    ws: fixtureWsBase,
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
  return projections.at(-1)?.match;
}

function latestSelfPlayer(projections: MatchRoomProjection[]) {
  return latestMatch(projections)?.view.players.find((player) => player.id === 'p1');
}

function latestPendingDecision(projections: MatchRoomProjection[]) {
  return latestMatch(projections)?.view.pendingDecision;
}

function projectedCardZone(projection: MatchRoomProjection | undefined, instanceId: string): string | undefined {
  return projection?.match?.view.cards.find((card) => card.instanceId === instanceId)?.zone;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}
