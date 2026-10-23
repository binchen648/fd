import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { expect, test, type Page, type WebSocket as PlaywrightWebSocket } from '@playwright/test';
import type { ClientRoomMessage, MatchRoomProjection, RoomHttpResponse, ServerRoomMessage } from '@fd/rules';

type Fixture = RoomHttpResponse & { httpBase: string; wsBase: string };
let fixtureProcess: ChildProcessWithoutNullStreams | undefined;
let fixture: Fixture;

test.beforeAll(async () => {
  fixtureProcess = spawn(process.execPath, ['--import', 'tsx', 'e2e/support/start-gatou-battle-end-reward-fixture-server.ts'], { cwd: process.cwd() });
  fixture = await new Promise<Fixture>((resolve, reject) => {
    const rl = createInterface({ input: fixtureProcess!.stdout });
    rl.once('line', (line) => { rl.close(); resolve(JSON.parse(line) as Fixture); });
    fixtureProcess!.stderr.on('data', (chunk) => { if (String(chunk).includes('Error')) reject(new Error(String(chunk))); });
    fixtureProcess!.once('exit', (code) => { if (code) reject(new Error(`B22 fixture exited ${code}`)); });
  });
});
test.afterAll(() => { fixtureProcess?.kill('SIGTERM'); });

test('settles Gatou mobile-player reward at the phase terminal and survives reconnect/stale replay', async ({ page }) => {
  const projections: MatchRoomProjection[] = [];
  const serverErrors: ServerRoomMessage[] = [];
  page.on('websocket', (socket: PlaywrightWebSocket) => socket.on('framereceived', (frame) => {
    const parsed = parseJson(frame.payload);
    if (parsed?.type === 'server:projection') projections.push((parsed as Extract<ServerRoomMessage, { type: 'server:projection' }>).projection);
    if (parsed?.type === 'server:error') serverErrors.push(parsed as ServerRoomMessage);
  }));
  await openRemoteRoom(page, fixture);
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect(page.getByRole('button', { name: '结束行动', exact: true })).toBeVisible();
  await expect.poll(() => latestMatch(projections)?.priorityPlayerId).toBe('p6');
  await expect.poll(() => vpOf(projections, 'p1')).toBe(0);
  const beforeRevision = latestMatch(projections)!.view.revision;
  const staleEndTurn: ClientRoomMessage = { type: 'client:end_turn', expectedRevision: beforeRevision };
  await sendRoomMessage(page, fixture, staleEndTurn);
  await expect.poll(() => latestMatch(projections)!.view.revision).toBeGreaterThan(beforeRevision);
  await expect.poll(() => vpOf(projections, 'p1')).toBe(4);
  const settled = latestMatch(projections)!;
  const settledRevision = settled.view.revision;
  const barrierIndex = settled.logs.findIndex((entry) => entry.type === 'battle_post_scoring_barrier_open');
  const terminalIndex = settled.logs.findIndex((entry) => entry.type === 'battle_terminal_event_dispatched');
  expect(barrierIndex).toBeGreaterThanOrEqual(0);
  expect(terminalIndex).toBeGreaterThan(barrierIndex);
  expect(settled.logs[terminalIndex]?.payload).toMatchObject({ battlePhaseResolutionId: 'battle-phase:1', battleParticipantIds: expect.arrayContaining(['p1', 'p2']) });
  expect(settled.battleBreakdowns).toEqual(expect.arrayContaining([expect.objectContaining({ battlefieldId: 'miyama_town', winnerPlayerIds: ['p1'] })]));
  const projectionCountBeforeReconnect = projections.length;
  await page.goto('about:blank');
  await page.waitForTimeout(100);
  await openRemoteRoom(page, fixture);
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
  await expect.poll(() => projections.length).toBeGreaterThan(projectionCountBeforeReconnect);
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(vpOf(projections, 'p1')).toBe(4);
  const errorCount = serverErrors.length;
  await sendRoomMessage(page, fixture, staleEndTurn);
  await expect.poll(() => serverErrors.length).toBeGreaterThan(errorCount);
  expect(serverErrors.at(-1)).toMatchObject({ type: 'server:error', code: 'command_failed', message: expect.stringContaining('Stale command revision') });
  await expect.poll(() => latestMatch(projections)?.view.revision).toBe(settledRevision);
  expect(vpOf(projections, 'p1')).toBe(4);
});

async function sendRoomMessage(page: Page, room: Fixture, message: ClientRoomMessage): Promise<void> {
  await page.evaluate(({ roomId, clientId, token, wsBase, payload }) => new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(`${wsBase}/rooms/${encodeURIComponent(roomId)}?clientId=${encodeURIComponent(clientId)}&reconnectToken=${encodeURIComponent(token)}`);
    socket.addEventListener('error', () => reject(new Error('room websocket failed')));
    socket.addEventListener('open', () => { socket.send(JSON.stringify(payload)); setTimeout(() => { socket.close(); resolve(); }, 50); });
  }), { roomId: room.roomId, clientId: room.clientId, token: room.reconnectToken, wsBase: room.wsBase, payload: message });
}

async function openRemoteRoom(page: Page, room: Fixture): Promise<void> {
  const params = new URLSearchParams({ remote: '1', roomId: room.roomId, clientId: room.clientId, token: room.reconnectToken, http: room.httpBase, ws: room.wsBase });
  await page.goto(`/?${params.toString()}`);
}
function parseJson(payload: string | Buffer): Record<string, unknown> | undefined { try { return JSON.parse(String(payload)) as Record<string, unknown>; } catch { return undefined; } }
function latestMatch(projections: MatchRoomProjection[]) { return projections.at(-1)?.match; }
function vpOf(projections: MatchRoomProjection[], playerId: string): number | undefined { return latestMatch(projections)?.view.players.find((player) => player.id === playerId)?.vp; }
