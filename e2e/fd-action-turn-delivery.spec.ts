import { expect, test, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import type { MatchRoomProjection, ClientRoomMessage, ServerRoomMessage } from '@fd/rules';

let fixtureProcess: ChildProcess | undefined;
type Fixture = { roomId: string; httpBase: string; wsBase: string; cwd: string; sourceHead: string; pid: number; clients: { clientId: string; reconnectToken: string }[] };

test.afterEach(async () => {
  const child = fixtureProcess;
  fixtureProcess = undefined;
  if (child && child.exitCode === null && child.signalCode === null) await new Promise<void>(resolve => { child.once('exit', () => resolve()); child.kill(); });
});

test('seven human seats finish authoritative move/skip and simultaneous play through browser and WS', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const fixture = await startFixture();
  expect(fixture.cwd.replaceAll('\\', '/')).toBe(process.cwd().replaceAll('\\', '/'));
  await testInfo.attach('source-and-service-identity', { body: JSON.stringify(fixture), contentType: 'application/json' });
  const projections: MatchRoomProjection[] = [];
  const commands: ClientRoomMessage[] = [];
  const errors: Extract<ServerRoomMessage, { type: 'server:error' }>[] = [];
  page.on('websocket', socket => {
    socket.on('framesent', frame => { const m = JSON.parse(String(frame.payload)); if (m.type === 'client:dispatch_command' || m.type === 'client:end_turn') commands.push(m); });
    socket.on('framereceived', frame => { const m = JSON.parse(String(frame.payload)); if (m.type === 'server:projection') projections.push(m.projection); if (m.type === 'server:error') errors.push(m); });
  });
  const latest = () => projections.at(-1)!;
  const results = [];
  for (let seat = 1; seat <= 7; seat++) {
    await openRoom(page, fixture, seat);
    await expect.poll(() => latest()?.viewer.playerId).toBe(`p${seat}`);
    await expect.poll(() => latest()?.match?.priorityPlayerId).toBe(`p${seat}`);
    await expect(page.getByLabel('行动回合进度')).toContainText('先常规移动');
    await expect(page.locator('.decision-panel__confirm')).toBeDisabled();
    const beforeMana = latest().match!.view.players.find(p => p.id === `p${seat}`)!.mana;
    if (seat === 1) {
      await page.getByRole('button', { name: '常规移动至 侦察 · 5 魔力', exact: true }).click();
      await expect.poll(() => latest()?.match?.view.actionTurn?.movement).toBe('moved');
      expect(latest().match!.view.players.find(p => p.id === 'p1')!.mana).toBe(beforeMana - 5);
      await page.reload();
      await expect(page.getByLabel('行动回合进度')).toContainText('移动已完成');
      expect(latest().match!.view.legalActions.some(a => a.type === 'normal_move')).toBe(false);
    } else {
      await page.getByRole('button', { name: '不进行常规移动', exact: true }).click();
      await expect.poll(() => latest()?.match?.view.actionTurn?.movement).toBe('skipped');
    }
    for (let index = 0; index < 2; index++) {
      const action = latest().match!.view.legalActions.find(a => a.type === 'stage_attack_card' && !a.faceDown)!;
      expect(action?.type).toBe('stage_attack_card');
      if (action.type !== 'stage_attack_card') throw new Error('Expected stage action');
      const card = latest().match!.view.cards.find(c => c.instanceId === action.cardInstanceId)!;
      await page.getByRole('button', { name: `检视 ${card.definitionId}`, exact: true }).first().click();
      await page.getByRole('button', { name: '加入待确认攻击', exact: true }).click();
      await expect.poll(() => latest()?.match?.view.stagedAttacks?.find(s => s.playerId === `p${seat}`)?.cards.length).toBe(index + 1);
      await page.getByRole('button', { name: '关闭卡牌检视' }).click();
      if (seat === 1 && index === 0) {
        await page.reload();
        await expect.poll(() => latest()?.match?.view.stagedAttacks?.[0]?.cards.length).toBe(1);
        await expect(page.getByRole('button', { name: '确认打出攻击区', exact: true })).toHaveCount(0);
      }
    }
    await page.getByRole('button', { name: '确认打出攻击区', exact: true }).click();
    await expect.poll(() => latest()?.match?.view.actionTurn?.regularPlay).toBe('complete');
    expect(latest().match!.view.playSummary?.attacksDeclaredThisRound).toBe(2);
    expect(latest().match!.view.players.find(p => p.id === `p${seat}`)?.totalPower).toEqual(expect.any(Number));
    if (seat === 1) {
      await page.reload();
      await expect(page.getByLabel('行动回合进度')).toContainText('常规出牌已完成');
      const stableView = structuredClone(latest().match!.view);
      const replay = commands.find(m => m.type === 'client:dispatch_command' && m.command.type === 'normal_move')!;
      const errorCount = errors.length;
      await sendRaw(page, fixture, seat, replay);
      await expect.poll(() => errors.length).toBeGreaterThan(errorCount);
      expect(errors.at(-1)?.message).toContain('Stale command revision');
      expect(latest().match!.view).toEqual(stableView);
    }
    results.push({ seat, revision: latest().match!.view.revision, actionTurn: latest().match!.view.actionTurn, power: latest().match!.view.players.find(p => p.id === `p${seat}`)?.totalPower });
    await page.locator('.decision-panel__confirm').click();
    if (seat < 7) await expect.poll(() => latest()?.match?.priorityPlayerId).toBe(`p${seat + 1}`);
  }
  await expect.poll(() => latest()?.match?.phase).toBe('battle');
  expect(errors.filter(error => !error.message.includes('Stale command revision'))).toEqual([]);
  expect(results).toHaveLength(7);
  expect(commands.filter(m => m.type === 'client:end_turn')).toHaveLength(7);
  await testInfo.attach('seven-seat-results', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  await page.screenshot({ path: testInfo.outputPath('seven-seats-action-complete.png'), fullPage: true });
});

async function openRoom(page: Page, fixture: Fixture, seat: number) {
  const client = fixture.clients[seat - 1]!;
  const params = new URLSearchParams({ remote: '1', roomId: fixture.roomId, clientId: client.clientId, token: client.reconnectToken, http: fixture.httpBase, ws: fixture.wsBase });
  await page.goto(`/?${params}`);
  await expect(page.getByLabel('远程对局房间')).toContainText('running');
}

test('local room shows public zero power after ordinary play and keeps the next undecided player private', async ({ page }, testInfo) => {
  await page.goto('/');
  const roomStrip = page.getByLabel('对局房间', { exact: true });
  await expect(roomStrip).toContainText('实战进行中');
  const saveState = async () => {
    await roomStrip.getByRole('button', { name: '保存', exact: true }).click();
    return page.evaluate(() => JSON.parse(localStorage.getItem('fd.local.match-room.snapshot')!).session.state);
  };
  const endDecision = async () => {
    await expect(page.locator('.decision-panel__confirm')).toBeEnabled();
    await page.locator('.decision-panel__confirm').click();
    const reminder = page.getByRole('alertdialog', { name: '可选能力提醒' });
    if (await reminder.isVisible()) await reminder.getByRole('button', { name: '仍然结束', exact: true }).click();
    await expect(reminder).toHaveCount(0);
  };
  let state = await saveState();
  for (let step = 0; step < 30 && state.round.activePhase !== 'action'; step++) {
    const phase = state.round.activePhase;
    expect(['preparation', 'advance']).toContain(phase);
    const current = state.players.find((player: { seat: number }) => player.seat === state.round.prioritySeat);
    if (phase === 'advance' && !current.locationId) {
      const name = current.seat === 1 ? '部署到 魔术工房' : '部署到 深山町';
      await page.getByRole('button', { name, exact: true }).click();
    } else {
      await endDecision();
    }
    const next = await saveState();
    expect(JSON.stringify([next.round.activePhase, next.round.prioritySeat, next.players.map((player: { locationId?: string }) => player.locationId)])).not.toBe(
      JSON.stringify([state.round.activePhase, state.round.prioritySeat, state.players.map((player: { locationId?: string }) => player.locationId)]),
    );
    state = next;
  }
  expect(state.round).toMatchObject({ activePhase: 'action', prioritySeat: 1 });
  await expect(page.getByLabel('行动回合进度')).toContainText('先常规移动');
  await expect(page.getByLabel('当前公开合计威力')).toHaveCount(0);
  await page.getByRole('button', { name: '不进行常规移动', exact: true }).click();
  for (let index = 0; index < 2; index++) {
    await page.locator('.workbench__zone--hand').getByRole('button').first().click();
    await page.getByRole('button', { name: '加入待确认盖放', exact: true }).click();
    await page.getByRole('button', { name: '关闭卡牌检视', exact: true }).click();
  }
  await page.getByRole('button', { name: '确认打出攻击区', exact: true }).click();
  await expect(page.getByLabel('行动回合进度')).toContainText('常规出牌已完成');
  await expect(page.getByLabel('当前公开合计威力')).toHaveText('合计威力 0');
  await page.screenshot({ path: testInfo.outputPath('local-zero-public-power.png'), fullPage: true });
  await endDecision();
  await expect(page.getByLabel('行动回合进度')).toContainText('先常规移动');
  await expect(page.getByLabel('当前公开合计威力')).toHaveCount(0);
  state = await saveState();
  expect(state.round).toMatchObject({ activePhase: 'action', prioritySeat: 2 });
  await testInfo.attach('local-browser-evidence', { body: JSON.stringify({ localRoom: true, priorPlayerPublicPower: 0, currentSeat: state.round.prioritySeat, usedRemoteTransport: false }), contentType: 'application/json' });
});
async function sendRaw(page: Page, fixture: Fixture, seat: number, message: ClientRoomMessage) {
  await page.evaluate(async ({ fixture, seat, message }) => {
    const client = fixture.clients[seat - 1]!;
    await new Promise<void>(resolve => {
      const socket = new WebSocket(`${fixture.wsBase}/rooms/${fixture.roomId}?clientId=${client.clientId}&reconnectToken=${client.reconnectToken}`);
      socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
      socket.addEventListener('message', event => { if (JSON.parse(String(event.data)).type === 'server:error') { socket.close(); resolve(); } });
    });
  }, { fixture, seat, message });
}
async function startFixture(): Promise<Fixture> {
  const child = spawn(process.execPath, ['--import', 'tsx', 'e2e/support/start-action-turn-fixture-server.ts'], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
  fixtureProcess = child;
  return new Promise((resolve, reject) => {
    let output = ''; let errors = '';
    child.stderr!.on('data', chunk => { errors += String(chunk); });
    child.once('error', reject);
    child.once('exit', () => reject(new Error(`Action fixture exited before readiness: ${errors}`)));
    child.stdout!.on('data', chunk => { output += String(chunk); if (output.includes('\n')) { try { resolve(JSON.parse(output.split('\n')[0]!)); } catch (error) { reject(error); } } });
  });
}
