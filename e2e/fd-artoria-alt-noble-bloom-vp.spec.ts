import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { expect, test, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';
import { artoriaAltAbilityId, artoriaAltSourceInstanceId } from './support/prepare-artoria-alt-noble-bloom-room';

let fixtureHttpBase = '';
let fixtureWsBase = '';
let fixtureProcess: ChildProcess | undefined;
let fixtureRoom: Pick<RoomHttpResponse, 'roomId' | 'clientId' | 'reconnectToken'>;

test.beforeAll(async () => {
  fixtureProcess = spawn(process.execPath, ['--import', 'tsx', resolve('e2e/support/start-artoria-alt-noble-bloom-fixture-server.ts')], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
  const ready = await new Promise<{ httpBase: string; wsBase: string; roomId: string; clientId: string; reconnectToken: string }>((resolveReady, reject) => {
    let output = ''; const timer = setTimeout(() => reject(new Error(`fixture server timeout: ${output}`)), 15_000);
    fixtureProcess?.stdout?.on('data', (chunk) => { output += String(chunk); const line = output.split(/\r?\n/).find((candidate) => candidate.trim().startsWith('{')); if (!line) return; clearTimeout(timer); resolveReady(JSON.parse(line) as typeof ready); });
    fixtureProcess?.stderr?.on('data', (chunk) => { output += String(chunk); });
    fixtureProcess?.once('error', (error) => { clearTimeout(timer); reject(error); });
    fixtureProcess?.once('exit', (code) => { if (code !== 0) { clearTimeout(timer); reject(new Error(`fixture server exited ${code}: ${output}`)); } });
  });
  fixtureHttpBase = ready.httpBase; fixtureWsBase = ready.wsBase;
  fixtureRoom = { roomId: ready.roomId, clientId: ready.clientId, reconnectToken: ready.reconnectToken };
});
test.afterAll(() => { fixtureProcess?.kill(); fixtureProcess = undefined; });

test('resolves Artoria Alter Noble Bloom through optional response, reconnect, and stale replay exactly once', async ({ page }) => {
  const projections: MatchRoomProjection[] = []; const serverErrors: ServerRoomMessage[] = []; const sentMessages: ClientRoomMessage[] = [];
  page.on('websocket', (socket: PlaywrightWebSocket) => {
    socket.on('framesent', (frame) => { const parsed = parseJson(frame.payload); if (parsed?.type === 'client:dispatch_command') sentMessages.push(parsed as ClientRoomMessage); });
    socket.on('framereceived', (frame) => { const parsed = parseJson(frame.payload); if (parsed?.type === 'server:projection') projections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection); if (parsed?.type === 'server:error') serverErrors.push(parsed as ServerRoomMessage); });
  });
  await openRemoteRoom(page, fixtureRoom);
  await expect.poll(() => latestMatch(projections)?.view.revision).toEqual(expect.any(Number));
  await expect.poll(() => latestResponseWindow(projections)?.opens).toBe('after_battle_result_determined');
  await expect.poll(() => vpOf(projections)).toBe(2);
  const initial = latestMatch(projections)!; const expectedRevision = initial.view.revision;
  expect(initial.view.legalActions).toContainEqual(expect.objectContaining({ type: 'resolve_response', cardInstanceId: artoriaAltSourceInstanceId, abilityId: artoriaAltAbilityId }));

  const beforeReload = projections.length; await page.reload();
  await expect.poll(() => projections.length).toBeGreaterThan(beforeReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(expectedRevision);
  await expect.poll(() => latestResponseWindow(projections)?.opens).toBe('after_battle_result_determined'); expect(vpOf(projections)).toBe(2);
  const legalResponse = latestMatch(projections)!.view.legalActions.find((action) => action.type === 'resolve_response' && action.cardInstanceId === artoriaAltSourceInstanceId && action.abilityId === artoriaAltAbilityId);
  expect(legalResponse).toBeTruthy();
  const responseCommand: ClientRoomMessage = { type: 'client:dispatch_command', expectedRevision, command: legalResponse! };
  const sentBeforeResolve = sentMessages.length; await sendRoomMessage(page, responseCommand); await expect.poll(() => sentMessages.length).toBeGreaterThan(sentBeforeResolve);
  await expect.poll(() => latestResponseWindow(projections)).toBeUndefined(); await expect.poll(() => vpOf(projections)).toBe(3);
  const settled = latestMatch(projections)!; const settledRevision = settled.view.revision;
  expect(sentMessages).toContainEqual(expect.objectContaining(responseCommand)); expect(countVpEvents(settled)).toBe(1);

  const beforeSettledReload = projections.length; await page.reload(); await expect.poll(() => projections.length).toBeGreaterThan(beforeSettledReload);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision); expect(latestResponseWindow(projections)).toBeUndefined(); expect(vpOf(projections)).toBe(3); expect(countVpEvents(latestMatch(projections)!)).toBe(1);
  const errorCount = serverErrors.length; await sendRoomMessage(page, responseCommand);
  await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount); expect(serverErrors.at(-1)).toMatchObject({ type: 'server:error', code: 'command_failed', message: expect.stringContaining('Stale command revision') });
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision); expect(vpOf(projections)).toBe(3); expect(countVpEvents(latestMatch(projections)!)).toBe(1);
});

async function sendRoomMessage(page: Page, message: ClientRoomMessage): Promise<void> {
  await page.evaluate(({ base, roomId, clientId, token, payload }) => new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(`${base}/rooms/${encodeURIComponent(roomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('error', () => reject(new Error('room websocket failed'))); socket.addEventListener('open', () => { socket.send(JSON.stringify(payload)); setTimeout(() => { socket.close(); resolve(); }, 50); });
  }), { base: fixtureWsBase, roomId: fixtureRoom.roomId, clientId: fixtureRoom.clientId, token: fixtureRoom.reconnectToken, payload: message });
}
async function openRemoteRoom(page: Page, response: Pick<RoomHttpResponse, 'roomId' | 'clientId' | 'reconnectToken'>): Promise<void> {
  const params = new URLSearchParams({ remote: '1', roomId: response.roomId, clientId: response.clientId, token: response.reconnectToken, http: fixtureHttpBase, ws: fixtureWsBase }); await page.goto(`/?${params.toString()}`);
}
function parseJson(payload: string | Buffer): Record<string, unknown> | undefined { try { return JSON.parse(String(payload)) as Record<string, unknown>; } catch { return undefined; } }
function latestMatch(projections: MatchRoomProjection[]) { return projections.at(-1)?.match ?? undefined; }
function latestResponseWindow(projections: MatchRoomProjection[]) { return latestMatch(projections)?.view.responseWindow; }
function vpOf(projections: MatchRoomProjection[]): number | undefined { return latestMatch(projections)?.view.players.find((player) => player.id === 'p1')?.vp; }
function countVpEvents(match: NonNullable<ReturnType<typeof latestMatch>>): number { return match.logs.flatMap((entry) => entry.type === 'dispatch_ok' ? (entry.payload?.events ?? []) : []).filter((event) => event?.type === 'victory_points_adjusted' && event.playerId === 'p1' && event.abilityId === artoriaAltAbilityId && event.delta === 1).length; }
