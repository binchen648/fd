const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const {chromium}=require('../../binchen648_fd/work/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const click=async selector=>{await page.locator(selector).click();await page.waitForTimeout(850)};
 const fit=async selector=>assert.ok(await page.locator(selector).evaluate(node=>{const r=node.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1}),selector+' fits viewport');
 const screenshots=path.resolve('ui-preview/design-review/archive');fs.mkdirSync(screenshots,{recursive:true});
 await page.goto(pathToFileURL(path.resolve('index.html')).href);await page.locator('.legal-screen.is-ready').waitFor({timeout:120000});await click('[data-legal-continue]');await page.waitForTimeout(1200);await click('.press-any');await click('[data-nav="codex"]');
 for(const size of [{width:1280,height:720},{width:1920,height:1080},{width:844,height:390},{width:740,height:360}]){
  await page.setViewportSize(size);await click('[data-codex-section="masters"]');
  await fit('.codex-toolbar');await fit('.codex-grid');await fit('[data-codex-search]');
  await page.locator('[data-codex-search]').fill('远 坂凛');assert.equal(await page.locator('.codex-card:visible').count(),1);await click('[data-entry="远坂凛"]');await fit('.codex-detail-page');await click('.back');assert.equal(await page.locator('[data-codex-search]').inputValue(),'远 坂凛');assert.equal(await page.locator('.codex-card:visible').count(),1);
  await click('[data-codex-clear]');assert.equal(await page.locator('.codex-card:visible').count(),8);
  await page.mouse.move(0,0);await page.screenshot({path:path.join(screenshots,'roles-'+size.width+'.png')});
  for(const section of ['servants','basic','situation','event']){
   await click('[data-codex-section="'+section+'"]');await page.locator('[data-codex-search]').fill('不存在的卡牌');assert.equal(await page.locator('.codex-card:visible').count(),0);assert.ok(await page.locator('[data-codex-search-empty]').isVisible());await click('[data-codex-reset]');assert.ok(await page.locator('.codex-card:visible').count()>0);
   const first=page.locator('.codex-card:visible').first(),name=await first.locator('.codex-name').innerText();await page.locator('[data-codex-search]').fill(name);assert.equal(await page.locator('.codex-card:visible').count(),1);await click('.codex-card:visible');assert.ok(await page.locator(section==='servants'?'.archive-detail-screen':'.archive-detail-screen.board-dossier').isVisible());await fit('.codex-detail-page');await page.locator('.codex-detail-art').hover();await page.waitForTimeout(200);assert.ok(await page.locator('.codex-image-preview.active').isVisible());await page.mouse.move(0,0);await page.waitForTimeout(200);assert.equal(await page.locator('.codex-image-preview.active').count(),0);await page.screenshot({path:path.join(screenshots,section+'-detail-'+size.width+'.png')});await click('.back');assert.equal(await page.locator('[data-codex-search]').inputValue(),name);await click('[data-codex-clear]');
  }
 }
 assert.deepEqual(errors,[]);console.log('Passed: all five archive categories, search/reset/return state, unified details, and desktop/landscape bounds at 1280, 1920, 844 and 740.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
