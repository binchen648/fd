import { expect, test, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';
import {
  conversionMagicDecoyInstanceId,
  conversionMagicFirstMovedInstanceId,
  conversionMagicSecondMovedInstanceId,
  conversionMagicSourceInstanceId,
} from './support/prepare-conversion-magic-room';

let fixtureHttpBase = '';
let fixtureWsBase = '';
let fixtureProcess: ChildProcess | undefined;
let fixtureRoom: Pick<RoomHttpResponse, 'roomId' | 'clientId' | 'reconnectToken'>;

test.beforeAll(async () => {
  const script = resolve('e2e/support/start-conversion-magic-fixture-server.ts');
  fixtureProcess = spawn(process.execPath, ['--import', 'tsx', script], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const ready = await new Promise<{ httpBase: string; wsBase: string; roomId: string; clientId: string; reconnectToken: string }>((resolveReady, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Conversion Magic fixture server did not start: ${output}`)), 15_000);
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
      if (code !== null && code !== 0) reject(new Error(`Conversion Magic fixture server exited with ${code}: ${output}`));
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

test('routes Conversion Magic through browser, WS revision, actual movedCount binding, projection, reconnect, and stale rejection', async ({ page }) => {
  const room = fixtureRoom;
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
    cardInstanceId: conversionMagicSourceInstanceId,
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
      cardInstanceId: conversionMagicSourceInstanceId,
      abilityId: 'conversion-magic.preparation',
    },
  });

  const projectedAfterCommand = receivedProjections.find((projection) => latestSelfPlayer([projection])?.mana === 6);
  expect(projectedAfterCommand?.match?.zones.find((zone) => zone.id === 'hand')?.count).toBe(0);
  expect(projectedAfterCommand?.match?.zones.find((zone) => zone.id === 'discard')?.count).toBe(2);
  expect(projectedCardZone(projectedAfterCommand, conversionMagicFirstMovedInstanceId)).toBe('discard');
  expect(projectedCardZone(projectedAfterCommand, conversionMagicSecondMovedInstanceId)).toBe('discard');
  expect(projectedCardZone(projectedAfterCommand, conversionMagicDecoyInstanceId)).toBe('field');
  expect(projectedAfterCommand?.match?.logs).toContainEqual(expect.objectContaining({
    type: 'dispatch_ok',
    payload: expect.objectContaining({
      events: expect.arrayContaining([
        expect.objectContaining({
          type: 'cards_moved',
          playerId: 'p2',
          sourceCardId: conversionMagicSourceInstanceId,
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
  await page.evaluate(({ wsBase, roomId: targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`${wsBase}/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, {
    wsBase: fixtureWsBase,
    roomId: room.roomId,
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
  expect(projectedCardZone(receivedProjections.at(-1), conversionMagicFirstMovedInstanceId)).toBe('discard');
  expect(projectedCardZone(receivedProjections.at(-1), conversionMagicSecondMovedInstanceId)).toBe('discard');
  expect(projectedCardZone(receivedProjections.at(-1), conversionMagicDecoyInstanceId)).toBe('field');
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

function latestSelfPlayer(projections: MatchRoomProjection[]) {
  return projections.at(-1)?.match?.view.players.find((player) => player.id === 'p2');
}

function projectedCardZone(projection: MatchRoomProjection | undefined, instanceId: string): string | undefined {
  return projection?.match?.view.cards.find((card) => card.instanceId === instanceId)?.zone;
}
