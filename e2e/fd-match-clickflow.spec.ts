import { expect, type Page, test } from '@playwright/test';

async function endCurrentDecision(page: Page) {
  await page.getByRole('button', { name: /^(完成准备|完成前哨|结束行动|完成战斗)$/ }).last().click();
  const forceEndButton = page.getByRole('button', { name: '仍然结束' });
  if (await forceEndButton.isVisible().catch(() => false)) await forceEndButton.click();
}

test('submits payment, target, response, directive, and replay clicks from the match table', async ({ page }) => {
  await page.goto('/?e2e=interaction');

  await expect(page.getByLabel('交互窗口')).toContainText('支付窗口');
  await expect(page.getByLabel('交互窗口')).toContainText('选择目标');
  await expect(page.getByLabel('交互窗口')).toContainText('唯一触发选择');
  await expect(page.getByLabel('directive 面板')).toContainText('false_attendant_book_replacement');

  const xInput = page.getByRole('spinbutton').first();
  await xInput.fill('3');
  await page.getByRole('button', { name: '支付 X=1' }).click();
  await expect(page.locator('section[aria-label="e2e 提交记录"]')).toContainText('"variables":{"X":3}');

  const targetWindow = page.locator('article').filter({ hasText: '选择目标' }).first();
  await targetWindow.getByRole('button', { name: /星之开拓者/ }).click();
  await targetWindow.getByRole('button', { name: /对手/ }).click();
  await targetWindow.getByRole('button', { name: '确认目标' }).click();
  await expect(page.locator('section[aria-label="e2e 提交记录"]')).toContainText('"selectedIds":["self-card-1","player-2"]');

  await page.getByRole('button', { name: '发动响应' }).click();
  await expect(page.locator('section[aria-label="e2e 提交记录"]')).toContainText('"type":"resolve_response"');

  await page.getByRole('button', { name: '人工确认继续' }).click();
  await expect(page.locator('section[aria-label="e2e 提交记录"]')).toContainText('"consumedDirectives":["directive:e2e"]');

  await page.getByRole('button', { name: '暂停并保存现场' }).click();
  await expect(page.locator('section[aria-label="e2e 提交记录"]')).toContainText('"pausedDirectives":["directive:e2e"]');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('fd.local.match-room.pause-snapshot'))).toContain('directive:e2e');

  await page.getByRole('button', { name: /^本人操作台 ·/ }).click();
  await page.getByRole('button', { name: /round 1 start/ }).click();
  await expect(page.locator('section[aria-label="e2e 提交记录"]')).toContainText('"restoredCheckpoints":["checkpoint:e2e"]');
});

test('dispatches a real local MatchSession card action through the browser UI', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByLabel('对局房间')).toContainText('实战进行中');
  const workbench = page.getByRole('region', { name: '本人操作台', exact: true });
  await expect(workbench).toContainText('爱丽丝菲尔');
  await expect(page.getByLabel('实战阶段流程')).toContainText('准备阶段');
  await workbench.getByRole('button', { name: /^本人操作台 ·/ }).click();
  await expect(workbench).toContainText('手牌 · 3 张');
  await expect(workbench).toContainText('升华技');

  for (let seat = 1; seat <= 7; seat++) await endCurrentDecision(page);
  await expect(page.getByLabel('实战阶段流程')).toContainText('前哨阶段');
  await expect(page.getByLabel('对局房间')).toContainText('host · p1 · connected');

  await page.getByRole('button', { name: /检视 转换魔术/ }).click();
  await expect(page.getByRole('dialog', { name: '转换魔术' })).toBeVisible();
  await page.getByRole('button', { name: /发动能力 conversion-magic\.preparation/ }).click();

  await expect(page.getByLabel('日志与回放')).toContainText('dispatch_ok');
  await expect(page.getByLabel('游戏区域投影')).toContainText('弃牌');
});

test('ends a local tester decision and switches the active client to the next human seat', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByLabel('对局房间')).toContainText('host · p1 · connected');
  await endCurrentDecision(page);

  await expect(page.getByLabel('对局房间')).toContainText('player · p2 · connected');
  await expect(page.getByLabel('日志与回放')).toContainText('player_passed');

  await endCurrentDecision(page);

  await expect(page.getByLabel('对局房间')).toContainText('player · p3 · connected');
  const workbench = page.getByRole('region', { name: '本人操作台', exact: true });
  await workbench.getByRole('button', { name: /^本人操作台 ·/ }).click();
  await expect(workbench).toContainText('手牌 ·');
  await expect(workbench).toContainText('初始牌库构成');
});
