const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../../binchen648_fd/work/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--allow-file-access-from-files']});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../ui-preview/本地UI预览.html')).href);
    await page.waitForFunction(() => window.FDBattleRuntime?.isPrepared());
    const result = await page.evaluate(async () => {
      // Advance the real preparation window so computers have work queued.
      const runtime = window.FDBattleRuntime.create({seed: 42});
      let calls = 0;
      runtime.subscribe(() => calls++);
      const action = runtime.snapshot().actions.find(a => a.commandType === 'phase.player.complete');
      if (!action) throw Error('Preparation completion unavailable');
      runtime.dispatch(action.id);
      await new Promise(resolve => setTimeout(resolve, 70));
      const before = runtime.app.state.revision;
      const pendingActor = runtime.app.state.activePlayerId;
      runtime.dispose();
      runtime.dispose();
      const callsBefore = calls;
      let rejected = false;
      try { runtime.dispatch(action.id); } catch (error) { rejected = error.message === 'MATCH_CLOSED'; }
      runtime.subscribe(() => calls++);
      await new Promise(resolve => setTimeout(resolve, 1100));
      return {before, after: runtime.app.state.revision, callsBefore, callsAfter: calls, pendingActor, rejected};
    });
    assert.notEqual(result.pendingActor, 'p1', 'Test must exit during a computer turn');
    assert.equal(result.before, result.after, 'Closed match keeps advancing');
    assert.equal(result.callsBefore, result.callsAfter, 'Closed match keeps notifying the UI');
    assert.equal(result.rejected, true);
    const click = async selector => {await page.locator(selector).click(); await page.waitForTimeout(700);};
    await click('[data-legal-continue]'); await page.waitForTimeout(1200); await click('.press-any'); await page.waitForTimeout(600); await click('[data-nav="single"]'); await click('[data-mode="free"]');
    await click('[data-pick-master="肯尼斯"]'); await click('[data-standard-next]'); await click('[data-pick-servant="巴御前"]'); await click('[data-standard-next]');
    await page.locator('[data-enter-battle-preview]').click();
    await page.waitForFunction(() => !!window.fdCurrentBattleUI);
    await page.waitForTimeout(700);
    await page.evaluate(() => {window.__oldRuntime=window.fdCurrentBattleRuntime; window.__oldUI=window.fdCurrentBattleUI; const root=document.querySelector('.battle-host').shadowRoot; root.querySelector('#open-save').click(); root.querySelector('.save-actions .primary').click();});
    assert.equal(await page.evaluate(() => window.fdCurrentBattleRuntime===null && window.fdCurrentBattleUI===null), true);
    assert.equal(await page.evaluate(() => window.__oldUI.isPreviewReady()), false);
    await page.waitForTimeout(2500);
    assert.equal(await page.evaluate(() => window.__oldUI.isPreviewReady()), false, 'Opening animation revived a closed UI');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({passed:true, computerTurnExit:result, routeCleanup:true}));
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode=1;});
