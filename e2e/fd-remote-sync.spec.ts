import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import type { RoomHttpResponse } from '@fd/rules';

const httpBase = 'http://127.0.0.1:8787';

test('remote room syncs seat selection and match start across two browser pages', async ({ browser, request }) => {
  const roomId = `fd-e2e-${Date.now()}`;
  const host = await createRoom(request, roomId, 'host-e2e', '房主');
  const playerTwo = await joinRoom(request, roomId, 'client-2-e2e', '玩家 2');
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const p2Page = await context.newPage();
  const diagnostics: string[] = [];
  for (const page of [hostPage, p2Page]) {
    page.on('console', (message) => diagnostics.push(`${message.type()}:${message.text()}`));
    page.on('pageerror', (error) => diagnostics.push(`pageerror:${error.message}`));
  }

  await openRemoteRoom(hostPage, host);
  await openRemoteRoom(p2Page, playerTwo);

  try {
    await expect(hostPage.getByLabel('远程对局房间')).toContainText('lobby');
  } catch (error) {
    diagnostics.push(`body:${(await hostPage.locator('body').textContent())?.slice(0, 1000)}`);
    throw new Error(`${error instanceof Error ? error.message : String(error)}\nDiagnostics:\n${diagnostics.join('\n')}`);
  }
  await expect(p2Page.getByLabel('远程对局房间')).toContainText('lobby');

  await hostPage.getByLabel('远程七人选座').locator('button').nth(0).click();
  await expect(p2Page.getByLabel('远程七人选座')).toContainText('房主');

  await p2Page.getByLabel('远程七人选座').locator('button').nth(1).click();
  await expect(hostPage.getByLabel('远程七人选座')).toContainText('玩家 2');

  await hostPage.getByRole('button', { name: '开始' }).click();
  await expect(hostPage.getByLabel('远程对局房间')).toContainText('running');
  await expect(p2Page.getByLabel('远程对局房间')).toContainText('running');
  await expect(hostPage.getByLabel('中央地图')).toBeVisible();
  await expect(p2Page.getByLabel('中央地图')).toBeVisible();
  const hostWorkbench = hostPage.getByRole('region', { name: '本人操作台', exact: true });
  const p2Workbench = p2Page.getByRole('region', { name: '本人操作台', exact: true });
  await expect(hostWorkbench).toContainText('master.');
  await expect(p2Workbench).toContainText('master.');

  expect(await hostWorkbench.textContent()).not.toEqual(await p2Workbench.textContent());

  await context.close();
});

async function createRoom(request: APIRequestContext, roomId: string, hostClientId: string, hostName: string): Promise<RoomHttpResponse> {
  const response = await request.post(`${httpBase}/rooms`, {
    data: { roomId, hostClientId, hostName, seed: 20260905 },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

async function joinRoom(request: APIRequestContext, roomId: string, clientId: string, displayName: string): Promise<RoomHttpResponse> {
  const response = await request.post(`${httpBase}/rooms/${roomId}/join`, {
    data: { clientId, displayName, role: 'player' },
  });
  expect(response.ok()).toBe(true);
  return response.json() as Promise<RoomHttpResponse>;
}

async function openRemoteRoom(page: Page, response: RoomHttpResponse): Promise<void> {
  const params = new URLSearchParams({
    remote: '1',
    roomId: response.roomId,
    clientId: response.clientId,
    token: response.reconnectToken,
    http: httpBase,
    ws: 'ws://127.0.0.1:8787',
  });
  await page.goto(`/?${params.toString()}`);
}
