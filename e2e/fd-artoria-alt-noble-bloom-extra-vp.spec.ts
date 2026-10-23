import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { expect, test, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const SOURCE = 'b19-artoria-alt-resistance';
const BASE = 'sc-artoria-alt-3.noble-bloom';
const EXTRA = 'sc-artoria-alt-3.noble-bloom-extra-vp';
let httpBase = ''; let wsBase = ''; let fixtureProcess: ChildProcess | undefined;
let room: Pick<RoomHttpResponse, 'roomId' | 'clientId' | 'reconnectToken'>;

test.beforeAll(async () => {
  fixtureProcess = spawn(process.execPath, ['--import', 'tsx', resolve('e2e/support/start-artoria-alt-noble-bloom-extra-fixture-server.ts')], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
  const ready = await new Promise<{ httpBase: string; wsBase: string; roomId: string; clientId: string; reconnectToken: string }>((resolveReady, reject) => {
    let output = ''; const timer = setTimeout(() => reject(new Error(`fixture timeout: ${output}`)), 15_000);
    fixtureProcess?.stdout?.on('data', (chunk) => { output += String(chunk); const line = output.split(/\r?\n/).find((candidate) => candidate.trim().startsWith('{')); if (!line) return; clearTimeout(timer); resolveReady(JSON.parse(line) as typeof ready); });
    fixtureProcess?.stderr?.on('data', (chunk) => { output += String(chunk); }); fixtureProcess?.once('error', reject); fixtureProcess?.once('exit', (code) => { if (code !== 0) reject(new Error(`fixture exited ${code}: ${output}`)); });
  });
  httpBase = ready.httpBase; wsBase = ready.wsBase; room = { roomId: ready.roomId, clientId: ready.clientId, reconnectToken: ready.reconnectToken };
});
test.afterAll(() => { fixtureProcess?.kill(); fixtureProcess = undefined; });

test('keeps B18 base and B19 extra VP as independent remote responses with reconnect and stale safety', async ({ page }) => {
  const projections: MatchRoomProjection[] = []; const errors: ServerRoomMessage[] = []; const sent: ClientRoomMessage[] = [];
  page.on('websocket', (socket: PlaywrightWebSocket) => { socket.on('framesent', (frame) => { const p = json(frame.payload); if (p?.type === 'client:dispatch_command') sent.push(p as ClientRoomMessage); }); socket.on('framereceived', (frame) => { const p = json(frame.payload); if (p?.type === 'server:projection') projections.push((p as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection); if (p?.type === 'server:error') errors.push(p as ServerRoomMessage); }); });
  await connect(page); await expect.poll(() => latest(projections)?.view.revision).toEqual(expect.any(Number)); await expect.poll(() => action(projections, BASE)).toBe(true); expect(action(projections, EXTRA)).toBe(false); expect(vp(projections)).toBe(2);
  const baseCommand = command(latest(projections)!, BASE); const baseRevision = baseCommand.expectedRevision; await send(page, baseCommand); await expect.poll(() => vp(projections)).toBe(3); await expect.poll(() => action(projections, EXTRA)).toBe(true); expect(count(latest(projections)!, BASE)).toBe(1); expect(count(latest(projections)!, EXTRA)).toBe(0);
  const pending = latest(projections)!; const extraCommand = command(pending, EXTRA); const extraRevision = extraCommand.expectedRevision; const beforeReload = projections.length; await page.reload(); await connect(page); await expect.poll(() => projections.length).toBeGreaterThan(beforeReload); await expect.poll(() => latest(projections)?.view.revision).toBe(extraRevision); await expect.poll(() => action(projections, EXTRA)).toBe(true); expect(vp(projections)).toBe(3);
  await send(page, extraCommand); await expect.poll(() => latest(projections)?.view.responseWindow).toBeUndefined(); await expect.poll(() => vp(projections)).toBe(4); const settled = latest(projections)!; const settledRevision = settled.view.revision; expect(count(settled, BASE)).toBe(1); expect(count(settled, EXTRA)).toBe(1);
  const beforeSettledReload = projections.length; await page.reload(); await connect(page); await expect.poll(() => projections.length).toBeGreaterThan(beforeSettledReload); await expect.poll(() => latest(projections)?.view.revision).toBe(settledRevision); expect(vp(projections)).toBe(4); expect(count(latest(projections)!, EXTRA)).toBe(1);
  const beforeError = errors.length; await send(page, extraCommand); await expect.poll(() => errors.length).toBeGreaterThan(beforeError); expect(errors.at(-1)).toMatchObject({ type: 'server:error', code: 'command_failed', message: expect.stringContaining('Stale command revision') }); await expect.poll(() => latest(projections)?.view.revision).toBe(settledRevision); expect(vp(projections)).toBe(4); expect(count(latest(projections)!, EXTRA)).toBe(1);
});

function command(match: NonNullable<ReturnType<typeof latest>>, abilityId: string): ClientRoomMessage { const legal = match.view.legalActions.find((candidate) => candidate.type === 'resolve_response' && candidate.cardInstanceId === SOURCE && candidate.abilityId === abilityId); expect(legal).toBeTruthy(); return { type: 'client:dispatch_command', expectedRevision: match.view.revision, command: legal! }; }
async function connect(page: Page): Promise<void> { await page.goto(httpBase); await page.evaluate(({ base, roomId, clientId, token }) => new Promise<void>((resolveReady, reject) => { const socket = new WebSocket(`${base}/rooms/${encodeURIComponent(roomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`); (window as unknown as { b19Socket?: WebSocket }).b19Socket = socket; socket.addEventListener('open', () => resolveReady()); socket.addEventListener('error', () => reject(new Error('B19 fixture websocket failed'))); }), { base: wsBase, roomId: room.roomId, clientId: room.clientId, token: room.reconnectToken }); }
async function send(page: Page, message: ClientRoomMessage): Promise<void> { await page.evaluate(({ base, roomId, clientId, token, payload }) => new Promise<void>((resolveReady, reject) => { const socket = new WebSocket(`${base}/rooms/${encodeURIComponent(roomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`); socket.addEventListener('error', () => reject(new Error('B19 send websocket failed'))); socket.addEventListener('open', () => { socket.send(JSON.stringify(payload)); setTimeout(resolveReady, 50); }); }), { base: wsBase, roomId: room.roomId, clientId: room.clientId, token: room.reconnectToken, payload: message }); }
function json(payload: string | Buffer): Record<string, unknown> | undefined { try { return JSON.parse(String(payload)) as Record<string, unknown>; } catch { return undefined; } }
function latest(projections: MatchRoomProjection[]) { return projections.at(-1)?.match ?? undefined; }
function action(projections: MatchRoomProjection[], abilityId: string): boolean { return latest(projections)?.view.legalActions.some((candidate) => candidate.type === 'resolve_response' && candidate.cardInstanceId === SOURCE && candidate.abilityId === abilityId) ?? false; }
function vp(projections: MatchRoomProjection[]): number | undefined { return latest(projections)?.view.players.find((player) => player.id === 'p1')?.vp; }
function count(match: NonNullable<ReturnType<typeof latest>>, abilityId: string): number { return match.logs.flatMap((entry) => entry.type === 'dispatch_ok' ? (entry.payload?.events ?? []) : []).filter((event) => event?.type === 'victory_points_adjusted' && event.playerId === 'p1' && event.abilityId === abilityId && event.delta === 1).length; }
