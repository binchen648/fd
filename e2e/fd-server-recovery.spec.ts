import { test, expect, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { RoomHttpResponse, ServerRoomMessage } from '../packages/rules/src/index';

test('seven browser seats reconnect to a fresh server process and continue the confirmed match', async ({ browser, request }, info) => {
  test.setTimeout(90_000); // Dedicated restart acceptance includes two process launches and seven pages.
  const directory = mkdtempSync(join(tmpdir(), 'fd-seven-restart-'));
  let child: ChildProcess | undefined;
  const errors: string[] = [];
  async function start(port = 0): Promise<number> {
    return new Promise((done, reject) => {
      const processChild = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
        cwd: resolve('apps/server'), env: { ...process.env, PORT: String(port), FD_STATE_FILE: join(directory, 'rooms.json') }, stdio: ['ignore', 'pipe', 'pipe'],
      });
      child = processChild; let output = '', stderr = '';
      processChild.stdout!.on('data', data => { output += data; const match = output.match(/listening on http:\/\/127\.0\.0\.1:(\d+)/); if (match) done(Number(match[1])); });
      processChild.stderr!.on('data', data => { stderr += data; });
      processChild.once('exit', code => reject(new Error(`Server exited ${code}: ${stderr}`)));
      processChild.once('error', reject);
    });
  }
  async function kill() {
    const current = child; child = undefined;
    if (current && current.exitCode === null) await new Promise<void>(done => { current.once('exit', () => done()); current.kill('SIGKILL'); });
  }
  const context = await browser.newContext();
  const pages: Page[] = [], credentials: RoomHttpResponse[] = [];
  const latest: Array<Extract<ServerRoomMessage, { type: 'server:projection' }> | undefined> = [];
  const projections = Array(7).fill(0) as number[];
  try {
    const port = await start(), http = `http://127.0.0.1:${port}`, ws = `ws://127.0.0.1:${port}`, roomId = `restart-${Date.now()}`;
    for (let seat = 1; seat <= 7; seat++) {
      const response = await request.post(http + (seat === 1 ? '/rooms' : `/rooms/${roomId}/join`), { data: seat === 1
        ? { roomId, seed: 20260904, hostClientId: 'seat-1' } : { clientId: `seat-${seat}`, displayName: `Seat ${seat}` } });
      expect(response.ok()).toBe(true); const credential: RoomHttpResponse = await response.json(); credentials.push(credential);
      const page = await context.newPage(); pages.push(page); const index = seat - 1;
      page.on('pageerror', error => errors.push(error.message));
      page.on('websocket', socket => socket.on('framereceived', frame => {
        const message = JSON.parse(frame.payload.toString()) as ServerRoomMessage;
        if (message.type === 'server:projection') { latest[index] = message; projections[index]++; }
        if (message.type === 'server:error') errors.push(message.message);
      }));
      await page.goto('/?' + new URLSearchParams({ remote: '1', roomId, clientId: credential.clientId, token: credential.reconnectToken, http, ws }));
      await page.getByLabel('远程七人选座').locator('button').nth(index).click();
      await expect.poll(() => latest[index]?.projection.viewer.playerId).toBe(`p${seat}`);
    }
    await pages[0]!.getByRole('button', { name: '开始', exact: true }).click();
    await expect.poll(() => latest.filter(p => p?.projection.status === 'running').length).toBe(7);
    const firstRevision = latest[0]!.projection.match!.view.revision;
    await pages[0]!.locator('.decision-panel__confirm').click();
    const optional = pages[0]!.getByRole('alertdialog', { name: '可选能力提醒' });
    if (await optional.isVisible()) await optional.getByRole('button', { name: '仍然结束', exact: true }).click();
    await expect.poll(() => latest.filter(p => p!.projection.match!.view.revision > firstRevision).length).toBe(7);
    const before = latest.map(p => ({ revision: p!.projection.match!.view.revision, round: p!.projection.match!.round, phase: p!.projection.match!.phase,
      priority: p!.projection.match!.priorityPlayerId, cards: p!.projection.match!.view.cards, legalActions: p!.projection.match!.view.legalActions }));
    const priorCounts = [...projections], originalPid = child!.pid;
    await kill(); await start(port); expect(child!.pid).not.toBe(originalPid);
    await expect.poll(() => projections.every((count, index) => count > priorCounts[index]!)).toBe(true);
    for (let index = 0; index < 7; index++) {
      const projection = latest[index]!.projection, match = projection.match!;
      expect({ revision: match.view.revision, round: match.round, phase: match.phase, priority: match.priorityPlayerId, cards: match.view.cards, legalActions: match.view.legalActions }).toEqual(before[index]);
      expect(JSON.stringify(projection)).not.toContain('reconnectToken'); expect(JSON.stringify(projection)).not.toContain('persistenceSecret');
      expect(projection.seats.filter(s => s.controller === 'human')).toHaveLength(7);
    }
    const actor = Number(latest[0]!.projection.match!.priorityPlayerId!.slice(1)) - 1;
    const revision = latest[actor]!.projection.match!.view.revision;
    await pages[actor]!.locator('.decision-panel__confirm').click();
    await expect.poll(() => latest.every(p => p!.projection.match!.view.revision > revision)).toBe(true);
    expect(errors).toEqual([]);
    await pages[0]!.screenshot({ path: info.outputPath('seven-player-recovered.png'), fullPage: true });
    writeFileSync(info.outputPath('server-recovery-result.json'), JSON.stringify({ actualBrowserSeats: 7, actualFreshProcess: true, samePort: true,
      recoveryWithoutReload: true, beforeRevision: before[0]!.revision, afterRevision: latest[0]!.projection.match!.view.revision,
      privateViewsAndLegalActionsPreserved: true, confirmedActionBeforeAndAfterRestart: true, errors }, null, 2));
  } finally { await context.close(); await kill(); rmSync(directory, { recursive: true, force: true }); }
});
