import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { expect, test, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';
import { ereshInstanceId } from './support/prepare-ereshkigal-battle-terminal-room';

const ereshPlayerId = 'p1';
const hostPlayerId = 'p1';
let fixtureHttpBase = '';
let fixtureWsBase = '';
let fixtureProcess: ChildProcess | undefined;
let fixtureRoom: Pick<RoomHttpResponse, 'roomId' | 'clientId' | 'reconnectToken'>;

test.beforeAll(async () => {
  const script = resolve('e2e/support/start-ereshkigal-battle-terminal-fixture-server.ts');
  fixtureProcess = spawn(process.execPath, ['--import', 'tsx', script], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
  const ready = await new Promise<{ httpBase: string; wsBase: string; roomId: string; clientId: string; reconnectToken: string }>((resolveReady, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`fixture server timeout: ${output}`)), 15_000);
    fixtureProcess?.stdout?.on('data', (chunk) => { output += String(chunk); const line = output.split(/\r?\n/).find((candidate) => candidate.trim().startsWith('{')); if (!line) return; clearTimeout(timer); resolveReady(JSON.parse(line) as typeof ready); });
    fixtureProcess?.stderr?.on('data', (chunk) => { output += String(chunk); });
    fixtureProcess?.once('error', (error) => { clearTimeout(timer); reject(error); });
    fixtureProcess?.once('exit', (code) => { if (code !== 0) { clearTimeout(timer); reject(new Error(`fixture server exited ${code}: ${output}`)); } });
  });
  fixtureHttpBase = ready.httpBase; fixtureWsBase = ready.wsBase;
  fixtureRoom = { roomId: ready.roomId, clientId: ready.clientId, reconnectToken: ready.reconnectToken };
});
test.afterAll(() => { fixtureProcess?.kill(); fixtureProcess = undefined; });

test('returns Eresh source at the battle terminal before cleanup and preserves it across reconnect/stale replay', async ({ page }) => {
  const room = fixtureRoom; const projections: MatchRoomProjection[] = []; const serverErrors: ServerRoomMessage[] = [];
  page.on('websocket', (socket: PlaywrightWebSocket) => socket.on('framereceived', (frame) => { const parsed = parseJson(frame.payload); if (parsed?.type === 'server:projection') projections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection); if (parsed?.type === 'server:error') serverErrors.push(parsed as ServerRoomMessage); }));
  await openRemoteRoom(page, room);
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect(page.getByRole('button', { name: '结束行动', exact: true })).toBeVisible();
  await expect.poll(() => latestMatch(projections)?.priorityPlayerId).toBe(hostPlayerId);
  await expect.poll(() => zoneOf(projections)).toBe('attack_area');
  const beforeRevision = latestMatch(projections)!.view.revision;
  const staleEndTurn: ClientRoomMessage = { type: 'client:end_turn', expectedRevision: beforeRevision };
  await page.getByRole('button', { name: '结束行动', exact: true }).click();
  await expect.poll(() => latestMatch(projections)!.view.revision).toBeGreaterThan(beforeRevision);
  await expect.poll(() => zoneOf(projections)).toBe('skill');
  const settled = latestMatch(projections)!; const settledRevision = settled.view.revision;
  expect(countTerminalEvents(settled)).toBe(1);
  const resultIndexes = settled.logs.map((entry, index) => ({ entry, index })).filter(({ entry }) => entry.type === 'battle_result_event_dispatched').map(({ index }) => index);
  const terminalIndex = settled.logs.findIndex((entry) => entry.type === 'battle_terminal_event_dispatched');
  expect(resultIndexes.length).toBeGreaterThanOrEqual(2); expect(terminalIndex).toBeGreaterThan(Math.max(...resultIndexes));
  expect(settled.logs[terminalIndex]?.payload).toMatchObject({ battlePhaseResolutionId: 'battle-phase:1', battleIds: expect.arrayContaining([expect.stringContaining('battle-phase:1:battle:miyama_town'), expect.stringContaining('battle-phase:1:battle:shinto')]), resultIds: expect.arrayContaining([expect.stringContaining(':result')]), scoringReceiptIds: expect.arrayContaining(['battle-phase:1:score:miyama_town', 'battle-phase:1:score:shinto']) });
  const terminalPayload = settled.logs[terminalIndex]?.payload;
  const identity = { phase: terminalPayload?.battlePhaseResolutionId, battleIds: terminalPayload?.battleIds, resultIds: terminalPayload?.resultIds, scoringReceiptIds: terminalPayload?.scoringReceiptIds };
  const countBeforeReload = projections.length;
  await page.reload(); await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => projections.length).toBeGreaterThan(countBeforeReload); await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision); expect(zoneOf(projections)).toBe('skill'); expect(countTerminalEvents(latestMatch(projections))).toBe(1); expect(terminalIdentity(latestMatch(projections)!)).toEqual(identity);
  const errorCount = serverErrors.length;
  await page.evaluate(({ base, targetRoomId, clientId, token, message }) => { const socket = new WebSocket(`${base}/rooms/${encodeURIComponent(targetRoomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`); socket.addEventListener('open', () => socket.send(JSON.stringify(message))); }, { base: fixtureWsBase, targetRoomId: room.roomId, clientId: room.clientId, token: room.reconnectToken, message: staleEndTurn });
  await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount); expect(serverErrors.at(-1)).toMatchObject({ type: 'server:error', code: 'command_failed', message: expect.stringContaining('Stale command revision') }); await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision); expect(zoneOf(projections)).toBe('skill'); expect(countTerminalEvents(latestMatch(projections))).toBe(1); expect(terminalIdentity(latestMatch(projections)!)).toEqual(identity);
});
async function openRemoteRoom(page: Page, response: RoomHttpResponse): Promise<void> { const params = new URLSearchParams({ remote: '1', roomId: response.roomId, clientId: response.clientId, token: response.reconnectToken, http: fixtureHttpBase, ws: fixtureWsBase }); await page.goto(`/?${params.toString()}`); }
function parseJson(payload: string | Buffer): Record<string, unknown> | undefined { try { return JSON.parse(String(payload)) as Record<string, unknown>; } catch { return undefined; } }
function latestMatch(projections: MatchRoomProjection[]) { return projections.at(-1)?.match ?? undefined; }
function zoneOf(projections: MatchRoomProjection[]): string | undefined { return latestMatch(projections)?.view.cards.find((card) => card.instanceId === ereshInstanceId)?.zone; }
function countTerminalEvents(match: MatchRoomProjection['match'] | undefined): number { return (match?.logs ?? []).filter((entry) => entry.type === 'battle_terminal_event_dispatched').length; }
function terminalIdentity(match: NonNullable<ReturnType<typeof latestMatch>>): Record<string, unknown> { const entry = match.logs.find((candidate) => candidate.type === 'battle_terminal_event_dispatched'); return { phase: entry?.payload?.battlePhaseResolutionId, battleIds: entry?.payload?.battleIds, resultIds: entry?.payload?.resultIds, scoringReceiptIds: entry?.payload?.scoringReceiptIds }; }
