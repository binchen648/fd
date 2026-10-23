import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { expect, test, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const olgaPlayerId = 'p4'; const opponentPlayerId = 'p1';
const sourceId = 'p4-master.olga-marie.skill.trismegistus-grief';
let child: ChildProcess | undefined;
let fixture: Pick<RoomHttpResponse, 'roomId' | 'clientId' | 'reconnectToken'> & { httpBase: string; wsBase: string };

test.beforeAll(async () => {
  child = spawn(process.execPath, ['--import', 'tsx', resolve('e2e/support/start-olga-loss-transform-fixture-server.ts')], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
  fixture = await new Promise((resolveReady, reject) => {
    let output = ''; const timer = setTimeout(() => reject(new Error(`fixture timeout: ${output}`)), 15_000);
    child?.stdout?.on('data', chunk => { output += String(chunk); const line = output.split(/\r?\n/).find(value => value.trim().startsWith('{')); if (!line) return; clearTimeout(timer); resolveReady(JSON.parse(line)); });
    child?.stderr?.on('data', chunk => { output += String(chunk); }); child?.once('error', reject);
    child?.once('exit', code => { if (code !== 0) reject(new Error(`fixture exited ${code}: ${output}`)); });
  }) as typeof fixture;
});
test.afterAll(() => { child?.kill('SIGTERM'); child = undefined; });

test('routes Olga active-source loss transform through remote battle, reconnect, and stale replay rejection', async ({ page }) => {
  const projections: MatchRoomProjection[] = []; const errors: ServerRoomMessage[] = [];
  page.on('websocket', (socket: PlaywrightWebSocket) => socket.on('framereceived', frame => { const value = parseJson(frame.payload); if (value?.type === 'server:projection') projections.push((value as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection); if (value?.type === 'server:error') errors.push(value as ServerRoomMessage); }));
  await openRoom(page); await expect(page.getByLabel('远程对局房间')).toContainText('running'); await expect(page.getByRole('button', { name: '结束行动', exact: true })).toBeVisible();
  await expect.poll(() => latest(projections)?.priorityPlayerId).toBe(olgaPlayerId); await expect.poll(() => sourceZone(projections)).toBe('field');
  const revision = latest(projections)!.view.revision; const stale: ClientRoomMessage = { type: 'client:end_turn', expectedRevision: revision }; await page.getByRole('button', { name: '结束行动', exact: true }).click();
  await expect.poll(() => latest(projections)!.view.revision).toBeGreaterThan(revision); const settled = latest(projections)!; const settledRevision = settled.view.revision;
  expect(settled.phase).toBe('round_end'); expect(sourceZone(projections)).toBe('field'); expect(settled.battleBreakdowns).toEqual(expect.arrayContaining([expect.objectContaining({ battlefieldId: 'miyama_town', winnerPlayerIds: [opponentPlayerId] })]));
  const barrier = settled.logs.findIndex(entry => entry.type === 'battle_post_scoring_barrier_open'); const dispatch = settled.logs.findIndex(entry => entry.type === 'battle_result_event_dispatched' && entry.payload?.battlefieldId === 'miyama_town'); expect(dispatch).toBeGreaterThan(barrier);
  await page.goto('about:blank'); await openRoom(page); await expect(page.getByLabel('远程对局房间')).toContainText('running'); await expect.poll(() => latest(projections)?.view.revision).toBe(settledRevision); expect(sourceZone(projections)).toBe('field');
  const errorCount = errors.length; await send(page, stale); await expect.poll(() => errors.length).toBeGreaterThan(errorCount); expect(errors.at(-1)).toMatchObject({ type: 'server:error', code: 'command_failed', message: expect.stringContaining('Stale command revision') }); await expect.poll(() => latest(projections)?.view.revision).toBe(settledRevision);
});

async function send(page: Page, payload: ClientRoomMessage): Promise<void> { await page.evaluate(({ base, roomId, clientId, token, payload }) => new Promise<void>((resolve, reject) => { const socket = new WebSocket(`${base}/rooms/${encodeURIComponent(roomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`); socket.addEventListener('error', () => reject(new Error('room websocket failed'))); socket.addEventListener('open', () => { socket.send(JSON.stringify(payload)); setTimeout(() => { socket.close(); resolve(); }, 50); }); }), { base: fixture.wsBase, roomId: fixture.roomId, clientId: fixture.clientId, token: fixture.reconnectToken, payload }); }
async function openRoom(page: Page): Promise<void> { const params = new URLSearchParams({ remote: '1', roomId: fixture.roomId, clientId: fixture.clientId, token: fixture.reconnectToken, http: fixture.httpBase, ws: fixture.wsBase }); await page.goto(`/?${params}`); }
function parseJson(value: string | Buffer): Record<string, unknown> | undefined { try { return JSON.parse(String(value)) as Record<string, unknown>; } catch { return undefined; } }
function latest(projections: MatchRoomProjection[]) { return projections.at(-1)?.match; }
function sourceZone(projections: MatchRoomProjection[]) { return latest(projections)?.view.cards.find(card => card.instanceId === sourceId)?.zone; }
