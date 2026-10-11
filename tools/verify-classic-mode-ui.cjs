const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../../binchen648_fd/work/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:720}});
    const errors=[]; page.on('pageerror',error=>errors.push(error.message));
    const click=async selector=>{await page.locator(selector).click();await page.waitForTimeout(800)};
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    await page.locator('.legal-screen.is-ready').waitFor({timeout:60000});
    await click('[data-legal-continue]');await page.waitForTimeout(700);await click('.press-any');await click('[data-nav="single"]');
    for(const viewport of [{width:1280,height:720},{width:1920,height:1080}]) {
      await page.setViewportSize(viewport);
      assert.equal(await page.locator('[data-mode]').count(),3);
      assert.equal(await page.locator('[data-mode="classic"] img').evaluate(image=>image.complete&&image.naturalWidth>0),true);
      for(const card of await page.locator('[data-mode]').all()) assert.equal(await card.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}),true,'Mode card clipped');
      await click('[data-mode="classic"]');
      const rules=await page.locator('.classic-rules-panel').innerText();
      for(const text of ['自由选择御主','组成 8 人从者牌池','七个常规职介各随机选择一名','从所有非常规职介中再随机选择一名','每名玩家随机抽取一名从者','角色补齐后开放'])assert.ok(rules.includes(text));
      for(const className of ['Saber','Lancer','Archer','Rider','Caster','Assassin','Berserker','Ruler','Avenger','Shielder','Foreigner','Moon Cancer'])assert.ok(rules.includes(className));
      assert.ok(!/御主随机抽取|7 个不同职介|Alter Ego|Pretender/.test(rules));
      assert.equal(await page.locator('[data-classic-start]').isDisabled(),true);
      assert.equal(await page.locator('[data-classic-start]').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),true);
      assert.equal(await page.evaluate(()=>!!window.fdCurrentBattleRuntime),false,'Unavailable mode started a match');
      await page.screenshot({path:path.resolve(__dirname,`../.tmp-classic-${viewport.width}.png`)});
      await click('.back');assert.equal(await page.locator('[data-mode="classic"]').count(),1);
    }
    await click('[data-mode="free"]');assert.equal(await page.locator('[data-pick-master]').count(),8);await click('.back');
    await click('[data-mode="3x"]');assert.equal(await page.locator('[data-threex-ban]').count(),8);await click('.back');
    await page.emulateMedia({reducedMotion:'reduce'});await click('[data-mode="classic"]');await click('.back');
    await click('.back');await click('[data-nav="multi"]');
    assert.equal(await page.locator('[data-mode="classic"]').count(),1);
    assert.equal(await page.locator('[data-mode="classic"] img').getAttribute('src'),'../assets/ui/modes/classic.png');
    await click('[data-mode="classic"]');assert.ok((await page.locator('.sub-title').innerText()).includes('MULTIPLAYER'));
    await click('.back');assert.equal(await page.locator('[data-join-room]').count(),1);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,viewports:['1280x720','1920x1080'],classicRules:true,locked:true,existingModes:true,reducedMotion:true}));
  } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
