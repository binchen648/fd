import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { expect, test, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const casterPlayerId = 'p1';
const hostPlayerId = 'p6';
let fixtureHttpBase = '';
let fixtureWsBase = '';
let fixtureProcess: ChildProcess | undefined;
let fixtureRoom: Pick<RoomHttpResponse, 'roomId' | 'clientId' | 'reconnectToken'>;

test.beforeAll(async () => {
  const script = resolve('e2e/support/start-artoria-caster-shared-victory-fixture-server.ts');
  fixtureProcess = spawn(process.execPath, ['--import', 'tsx', script], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
  const ready = await new Promise<{ httpBase: string; wsBase: string; roomId: string; clientId: string; reconnectToken: string }>((resolveReady, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`fixture server timeout: ${output}`)), 15_000);
    fixtureProcess?.stdout?.on('data', (chunk) => {
      output += String(chunk);
      const line = output.split(/\r?\n/).find((candidate) => candidate.trim().startsWith('{'));
      if (!line) return;
      clearTimeout(timer);
      resolveReady(JSON.parse(line) as typeof ready);
    });
    fixtureProcess?.stderr?.on('data', (chunk) => { output += String(chunk); });
    fixtureProcess?.once('error', (error) => { clearTimeout(timer); reject(error); });
    fixtureProcess?.once('exit', (code) => { if (code !== 0) { clearTimeout(timer); reject(new Error(`fixture server exited ${code}: ${output}`)); } });
  });
  fixtureHttpBase = ready.httpBase;
  fixtureWsBase = ready.wsBase;
  fixtureRoom = { roomId: ready.roomId, clientId: ready.clientId, reconnectToken: ready.reconnectToken };
});

test.afterAll(() => { fixtureProcess?.kill(); fixtureProcess = undefined; });

test('awards Artoria Caster shared-victory VP after scoring and preserves it across reconnect/stale replay', async ({ page }) => {
  const room = fixtureRoom;
  const projections: MatchRoomProjection[] = [];
  const serverErrors: ServerRoomMessage[] = [];
  page.on('websocket', (socket: PlaywrightWebSocket) => socket.on('framereceived', (frame) => {
    const parsed = parseJson(frame.payload);
    if (parsed?.type === 'server:projection') projections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection);
    if (parsed?.type === 'server:error') serverErrors.push(parsed as ServerRoomMessage);
  }));
  await openRemoteRoom(page, room);
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect(page.getByRole('button', { name: '结束行动', exact: true })).toBeVisible();
  await expect.poll(() => latestMatch(projections)?.priorityPlayerId).toBe(hostPlayerId);
  await expect.poll(() => vpOf(projections, casterPlayerId)).toBe(0);
  const beforeRevision = latestMatch(projections)!.view.revision;
  const staleEndTurn: ClientRoomMessage = { type: 'client:end_turn', expectedRevision: beforeRevision };
  await page.getByRole('button', { name: '结束行动', exact: true }).click();
  await expect.poll(() => latestMatch(projections)!.view.revision).toBeGreaterThan(beforeRevision);
  await expect.poll(() => vpOf(projections, casterPlayerId)).toBe(4);
  const settled = latestMatch(projections)!;
  const settledRevision = settled.view.revision;
  const result = settled.logs.find((entry) => entry.type === 'battle_result_event_dispatched' && entry.payload?.battlefieldId === 'shinto');
  expect(settled.battleBreakdowns.map((battle) => battle.battlefieldId)).toEqual(expect.arrayContaining(['shinto', 'miyama_town']));
  const barrierIndex = settled.logs.findIndex((entry) => entry.type === 'battle_post_scoring_barrier_open');
  const resultIndex = settled.logs.findIndex((entry) => entry.type === 'battle_result_event_dispatched' && entry.payload?.battlefieldId === 'shinto');
  expect(barrierIndex).toBeGreaterThanOrEqual(0);
  expect(resultIndex).toBeGreaterThan(barrierIndex);
  expect(settled.logs[barrierIndex]?.payload).toMatchObject({ scoredBattlefieldIds: expect.arrayContaining(['shinto', 'miyama_town']) });
  expect(result?.payload).toMatchObject({ battlePhaseResolutionId: 'battle-phase:1', battlefieldId: 'shinto', battleId: expect.stringContaining('battle-phase:1:battle:shinto'), resultId: expect.stringContaining(':result') });
  const identity = { phase: result?.payload?.battlePhaseResolutionId, battlefield: result?.payload?.battlefieldId, battle: result?.payload?.battleId, result: result?.payload?.resultId };
  const countBeforeReload = projections.length;
  await page.reload();
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => projections.length).toBeGreaterThan(countBeforeReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  await expect.poll(() => vpOf(projections, casterPlayerId)).toBe(4);
  expect(battleIdentity(latestMatch(projections)!)).toEqual(identity);
  const errorCount = serverErrors.length;
  await page.evaluate(({ base, targetRoomId, clientId, token, message }) => {
    const socket = new WebSocket(`${base}/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  }, { base: fixtureWsBase, targetRoomId: room.roomId, clientId: room.clientId, token: room.reconnectToken, message: staleEndTurn });
  await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount);
  expect(serverErrors.at(-1)).toMatchObject({ type: 'server:error', code: 'command_failed', message: expect.stringContaining('Stale command revision') });
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(vpOf(projections, casterPlayerId)).toBe(4);
  expect(battleIdentity(latestMatch(projections)!)).toEqual(identity);
});

async function openRemoteRoom(page: Page, response: RoomHttpResponse): Promise<void> {
  const params = new URLSearchParams({ remote: '1', roomId: response.roomId, clientId: response.clientId, token: response.reconnectToken, http: fixtureHttpBase, ws: fixtureWsBase });
  await page.goto(`/?${params.toString()}`);
}
function parseJson(payload: string | Buffer): Record<string, unknown> | undefined { try { return JSON.parse(String(payload)) as Record<string, unknown>; } catch { return undefined; } }
function latestMatch(projections: MatchRoomProjection[]) { return projections.at(-1)?.match ?? undefined; }
function vpOf(projections: MatchRoomProjection[], playerId: string): number | undefined { return latestMatch(projections)?.view.players.find((player) => player.id === playerId)?.vp; }
function battleIdentity(match: NonNullable<ReturnType<typeof latestMatch>>): Record<string, unknown> {
  const result = match.logs.find((entry) => entry.type === 'battle_result_event_dispatched' && entry.payload?.battlefieldId === 'shinto');
  return { phase: result?.payload?.battlePhaseResolutionId, battlefield: result?.payload?.battlefieldId, battle: result?.payload?.battleId, result: result?.payload?.resultId };
}
