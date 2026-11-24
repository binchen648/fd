import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve, join } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

test('one production address hosts seven invited browsers and authenticated room gameplay', async ({ browser, request }, info) => {
  test.setTimeout(90_000);
  const directory = mkdtempSync(join(tmpdir(), 'fd-public-browser-'));
  let child: ChildProcess | undefined;
  const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
  const errors: string[] = [];
  try {
    const base = await new Promise<string>((done, reject) => {
      child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], { cwd: resolve('apps/server'), env: { ...process.env, PORT: '0', FD_CLIENT_DIST: resolve('apps/client/dist'), FD_STATE_FILE: join(directory, 'rooms.json') }, stdio: ['ignore', 'pipe', 'pipe'] });
      let text = '', stderr = '';
      child.stdout!.on('data', data => { text += data; const match = text.match(/listening on (http:\/\/127\.0\.0\.1:\d+)/); if (match) done(match[1]!); });
      child.stderr!.on('data', data => { stderr += data; }); child.once('exit', code => reject(new Error(`Server exited ${code}: ${stderr}`)));
    });
    const pages = [];
    for (let i = 0; i < 7; i++) { const context = await browser.newContext(); contexts.push(context); const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message)); pages.push(page); }
    await pages[0]!.goto(base);
    await expect(pages[0]!.getByLabel('联机大厅')).toBeVisible();
    await expect(pages[0]!.getByLabel('对局房间', { exact: true })).toHaveCount(0);
    await pages[0]!.getByRole('button', { name: '创建联机房间', exact: true }).click();
    await pages[0]!.getByRole('link', { name: '打开远程桌面' }).click();
    await expect(pages[0]!.getByLabel('远程七人选座').locator('button')).toHaveCount(7);
    const privateUrl = pages[0]!.url();
    const invite = await pages[0]!.getByRole('textbox', { name: '房间邀请链接' }).inputValue();
    expect(invite).toContain(base); expect(invite).toContain('join=');
    for (const part of ['token=', 'clientId=', 'remote=']) expect(invite).not.toContain(part);
    await pages[0]!.getByLabel('远程七人选座').locator('button').nth(0).click();
    const identities = [new URL(privateUrl).searchParams.get('clientId')];
    for (let i = 1; i < 7; i++) {
      await pages[i]!.goto(invite);
      await pages[i]!.getByRole('button', { name: '加入联机房间', exact: true }).click();
      await pages[i]!.getByRole('link', { name: '打开远程桌面' }).click();
      identities.push(new URL(pages[i]!.url()).searchParams.get('clientId'));
      await pages[i]!.getByLabel('远程七人选座').locator('button').nth(i).click();
    }
    expect(new Set(identities).size).toBe(7);
    await pages[0]!.getByRole('button', { name: '开始', exact: true }).click();
    for (const page of pages) await expect(page.getByLabel('远程对局房间')).toContainText('running');
    await pages[0]!.locator('.decision-panel__confirm').click();
    const reminder = pages[0]!.getByRole('alertdialog', { name: '可选能力提醒' });
    if (await reminder.isVisible()) await reminder.getByRole('button', { name: '仍然结束', exact: true }).click();
    await expect(pages[1]!.locator('.decision-panel__confirm')).toBeEnabled();
    await pages[1]!.reload(); await expect(pages[1]!.getByLabel('远程对局房间')).toContainText('running');
    for (const path of ['/.fd-server/rooms.json', '/.fd-server/rooms.json.key', '/package.json', '/src/index.ts']) expect((await request.get(base + path)).status()).toBe(404);
    expect(errors).toEqual([]);
    await pages[0]!.screenshot({ path: info.outputPath('public-seven-player.png'), fullPage: true });
    writeFileSync(info.outputPath('public-entry-result.json'), JSON.stringify({ classification: 'PASS', browserContexts: 7, uniqueIdentities: 7, singleProductionOrigin: true, builtClient: true, inviteWithoutCredentials: true, started: true, operationAndReload: true, privateFilesDenied: true, errors, liveSakuraTunnel: 'NOT_RUN_NO_ACCOUNT_NODE' }, null, 2));
  } finally {
    for (const context of contexts) await context.close();
    if (child && child.exitCode === null) await new Promise<void>(done => { child!.once('exit', () => done()); child!.kill(); });
    rmSync(directory, { recursive: true, force: true });
  }
});
