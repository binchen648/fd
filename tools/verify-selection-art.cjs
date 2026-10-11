const assert=require('node:assert/strict'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('../../binchen648_fd/work/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const click=async s=>{await page.locator(s).click();await page.waitForTimeout(950)};
 const shot=async(n,w)=>page.screenshot({path:path.resolve('ui-preview/design-review/'+n+'-wide-'+w+'.png')});
 for(const width of [1280,1920]){
  await page.setViewportSize({width,height:width===1280?720:1080});await page.goto(pathToFileURL(path.resolve('index.html')).href);await page.locator('.legal-screen.is-ready').waitFor({timeout:60000});await click('[data-legal-continue]');await page.waitForTimeout(1200);
  assert.ok((await page.locator('.splash>.bg').evaluate(e=>getComputedStyle(e).filter)).includes('brightness(1)'));await shot('splash-bright',width);await click('.press-any');
  assert.ok((await page.locator('.home-screen>.bg').evaluate(e=>getComputedStyle(e).filter)).includes('brightness(1)'));await shot('home-bright',width);
  await click('[data-nav="single"]');await click('[data-mode="free"]');assert.equal(await page.locator('.ow-roster').evaluate(e=>getComputedStyle(e).scrollbarWidth),'thin');
  assert.equal(await page.locator('.press-any').count(),0);
  await page.locator('[data-roster-search]').fill('肯尼斯');assert.equal(await page.locator('.ow-roster .pick-card:visible').count(),1);
  await page.locator('[data-roster-search]').fill('不存在的角色');assert.equal(await page.locator('.ow-roster .pick-card:visible').count(),0);assert.ok(await page.locator('[data-roster-empty]').isVisible());
  await page.locator('[data-roster-search]').fill('');assert.equal(await page.locator('.ow-roster .pick-card:visible').count(),8);
  const layout=await page.locator('.ow-roster-grid').evaluate(grid=>{const originals=[...grid.children];for(let i=8;i<90;i++){const card=originals[i%8].cloneNode(true);card.dataset.layoutProbe='true';grid.append(card)}const overflow=grid.scrollWidth>grid.clientWidth+1,columns=getComputedStyle(grid).gridTemplateColumns.split(' ').length;grid.querySelectorAll('[data-layout-probe]').forEach(x=>x.remove());return {columns,overflow}});assert.ok(layout.columns>=(width===1280?5:7),JSON.stringify(layout));assert.equal(layout.overflow,false);
  await shot('selection-rail',width);await page.locator('[data-roster-search]').fill('肯 尼斯');assert.equal(await page.locator('.ow-roster .pick-card:visible').count(),1);await click('[data-roster-clear]');assert.equal(await page.locator('.ow-roster .pick-card:visible').count(),8);await page.locator('[data-roster-search]').fill('肯尼斯');await click('[data-pick-master="肯尼斯"]');await shot('selection-detail',width);await click('[data-standard-next]');await page.locator('[data-roster-search]').fill('卫宫');assert.equal(await page.locator('.ow-roster .pick-card:visible').count(),1);await click('[data-pick-class="Lancer"]');assert.equal(await page.locator('.ow-roster .pick-card:visible').count(),0);await click('[data-pick-class="Archer"]');assert.equal(await page.locator('.ow-roster .pick-card:visible').count(),1);
  await page.locator('[data-roster-search]').fill('不存在');await click('[data-roster-reset]');assert.equal(await page.locator('.ow-roster .pick-card:visible').count(),8);assert.equal(await page.locator('[data-pick-class="全部"]').getAttribute('class'),'active');await page.keyboard.press('Escape');await page.waitForTimeout(950);assert.equal(await page.locator('[data-roster-search]').inputValue(),'肯尼斯');assert.equal(await page.locator('.ow-roster .pick-card:visible').count(),1);await page.keyboard.press('Escape');await page.waitForTimeout(950);
  await click('[data-mode="3x"]');
  assert.ok(await page.locator('[data-threex-ban]').evaluateAll(nodes=>nodes.every(e=>{const r=e.getBoundingClientRect(),p=e.closest('.ow-roster').getBoundingClientRect();return r.top>=p.top&&r.bottom<=p.bottom+1})), 'All eight ban cards fit without scrolling');
  assert.ok(await page.locator('.ow-phase-head').evaluate(e=>e.getBoundingClientRect().bottom<=document.querySelector('.threex-ban-board').getBoundingClientRect().top+1),'Heading and participant strip do not overlap');
  await click('[data-threex-ban="间桐慎二"]');assert.equal(await page.locator('.ban-target-state').innerText(),'待确认禁用');await shot('ban-target',width);
  await click('[data-threex-confirm-ban]');assert.equal(await page.locator('.ban-target-state').innerText(),'禁用已锁定');assert.equal(await page.locator('.pick-card.banned').count(),7);await shot('ban-results',width);
  await click('[data-threex-finish-ban]');assert.ok(await page.locator('.ow-current-choice').evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('.threex-ban-summary').getBoundingClientRect().bottom),'Choice is separate from ban results');await shot('master-after-bans',width);
 }
 assert.deepEqual(errors,[]);console.log('Passed: bright splash/home, 5/7-column searchable roster, 90-card overflow simulation, class filtering, and 3X ban layout at 1280 and 1920.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
