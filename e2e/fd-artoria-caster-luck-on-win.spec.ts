import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { expect, test, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

const sources = ['sc-artoriac-4.unique-passive-luck-on-win', 'sc-artoriac-5.unique-passive-luck-on-win', 'sc-artoriac-6.unique-passive-luck-on-win'];
type Fixture = RoomHttpResponse & { httpBase: string; wsBase: string };
let fixtureProcess: ChildProcessWithoutNullStreams | undefined; let fixture: Fixture;
test.beforeAll(async () => {
  fixtureProcess = spawn(process.execPath, ['--import', 'tsx', 'e2e/support/start-artoria-caster-luck-on-win-fixture-server.ts'], { cwd: process.cwd() });
  fixture = await new Promise<Fixture>((resolve, reject) => { const rl = createInterface({ input: fixtureProcess!.stdout }); rl.once('line', (line) => { rl.close(); resolve(JSON.parse(line) as Fixture); }); fixtureProcess!.stderr.on('data', (chunk) => { if (String(chunk).includes('Error')) reject(new Error(String(chunk))); }); fixtureProcess!.once('exit', (code) => { if (code) reject(new Error(`B20 fixture exited ${code}`)); }); });
});
test.afterAll(() => { fixtureProcess?.kill('SIGTERM'); });

test('resolves one Artoria Caster unique Luck-on-win response across reconnect and rejects stale replay', async ({ page }) => {
  const sentMessages: ClientRoomMessage[] = []; const projections: MatchRoomProjection[] = []; const serverErrors: ServerRoomMessage[] = [];
  page.on('websocket', (socket: PlaywrightWebSocket) => { socket.on('framesent', (frame) => { const parsed = parseJson(frame.payload); if (parsed?.type === 'client:dispatch_command') sentMessages.push(parsed as ClientRoomMessage); }); socket.on('framereceived', (frame) => { const parsed = parseJson(frame.payload); if (parsed?.type === 'server:projection') projections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection); if (parsed?.type === 'server:error') serverErrors.push(parsed as ServerRoomMessage); }); });
  await openRemoteRoom(page, fixture); await expect.poll(() => latestMatch(projections)?.view.revision).toEqual(expect.any(Number)); await expect.poll(() => responseAbilities(projections)).toEqual(sources); expect(latestMatch(projections)?.view.responseWindow).toMatchObject({ kind: 'choose_unique_trigger' });
  const pendingRevision = latestMatch(projections)!.view.revision; const beforeReload = projections.length; await page.goto('about:blank'); await openRemoteRoom(page, fixture); await expect.poll(() => projections.length).toBeGreaterThan(beforeReload); await expect.poll(() => latestMatch(projections)?.view.revision).toBe(pendingRevision);
  const legal = latestMatch(projections)!.view.legalActions.find((action) => action.type === 'resolve_response' && sources.includes(action.abilityId)); expect(legal).toBeTruthy(); const command: ClientRoomMessage = { type: 'client:dispatch_command', expectedRevision: pendingRevision, command: legal! };
  await send(page, fixture, command); await expect.poll(() => latestMatch(projections)?.view.responseWindow).toBeUndefined(); await expect.poll(() => responseAbilities(projections)).toEqual([]); const settledRevision = latestMatch(projections)!.view.revision;
  await page.goto('about:blank'); await openRemoteRoom(page, fixture); await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision); const errorCount = serverErrors.length; await send(page, fixture, command); await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount); expect(serverErrors.at(-1)).toMatchObject({ type: 'server:error', code: 'command_failed', message: expect.stringContaining('Stale command revision') });
});
async function send(page: Page, room: Fixture, message: ClientRoomMessage): Promise<void> { await page.evaluate(({ roomId, clientId, token, wsBase, message }) => { const socket = new WebSocket(`${wsBase}/rooms/${encodeURIComponent(roomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`); socket.addEventListener('open', () => socket.send(JSON.stringify(message))); }, { roomId: room.roomId, clientId: room.clientId, token: room.reconnectToken, wsBase: room.wsBase, message }); }
async function openRemoteRoom(page: Page, room: Fixture): Promise<void> { const params = new URLSearchParams({ remote: '1', roomId: room.roomId, clientId: room.clientId, token: room.reconnectToken, http: room.httpBase, ws: room.wsBase }); await page.goto(`/?${params.toString()}`); }
function parseJson(payload: string | Buffer): Record<string, unknown> | undefined { try { return JSON.parse(String(payload)) as Record<string, unknown>; } catch { return undefined; } }
function latestMatch(projections: MatchRoomProjection[]) { return projections.at(-1)?.match; }
function responseAbilities(projections: MatchRoomProjection[]): string[] { return latestMatch(projections)?.view.legalActions.filter((action) => action.type === 'resolve_response').map((action) => action.abilityId) ?? []; }
