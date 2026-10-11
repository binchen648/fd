const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../../binchen648_fd/work/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{if(!localStorage.getItem('fd-player-profile'))localStorage.setItem('fd-player-profile',JSON.stringify({name:'御主',totalGames:3,topFour:2,wins:1,progression:{xp:150,earnedByMode:{standard:150}},modes:{standard:{games:3,topFour:2,wins:1}}}))});
 const entry=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
 await page.goto(entry);await page.locator('.legal-screen.is-ready').waitFor({timeout:60000});
 const click=async selector=>{await page.locator(selector).click();await page.waitForTimeout(850)};
 await click('[data-legal-continue]');await page.waitForTimeout(650);await click('.press-any');
 const profile=await page.evaluate(async()=>{
  const before=window.FDPlayerStats.getProfile();
  const reward=window.FDPlayerStats.recordMatch('肯尼斯','巴御前',{id:'classic-check',mode:'classic',placement:1});
  const duplicate=window.FDPlayerStats.recordMatch('肯尼斯','巴御前',{id:'classic-check',mode:'classic',placement:1});
  const code=await window.FDPlayerStats.exportProfileCode();await window.FDPlayerStats.importProfileCode(code);
  return {before,reward,duplicate,after:window.FDPlayerStats.getProfile()};
 });
 assert.equal(profile.before.progression.xp,150);assert.equal(profile.reward.xpGained,60);assert.equal(profile.duplicate.duplicate,true);
 assert.equal(profile.after.progression.xp,210);assert.equal(profile.after.progression.earnedByMode.classic,60);
 assert.equal(profile.after.modes.classic.games,1);assert.equal(profile.after.modes.standard.games,3);assert.equal(profile.after.matches[0].mode,'classic');
 await click('[data-profile]');await click('[data-profile-mode="classic"]');
 assert.equal(await page.locator('[data-profile-mode]').count(),4);
 assert.ok((await page.locator('.profile-rank-progress footer').innerText()).includes('经典 60'));
 assert.notEqual(await page.locator('[data-profile-mode="classic"]').evaluate(e=>getComputedStyle(e).color),await page.locator('[data-profile-mode="standard"]').evaluate(e=>getComputedStyle(e).color),'Selected mode must be distinct');
 assert.equal(await page.locator('[data-save-profile]').evaluate(e=>getComputedStyle(e).clipPath),'none');
 await page.screenshot({path:path.resolve(__dirname,'../.tmp-button-art-profile.png')});
 await page.locator('.player-profile-page').evaluate(e=>e.scrollTop=e.scrollHeight);
 for(const selector of ['[data-profile-export]','[data-profile-import]'])assert.equal(await page.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth}),true,'Transfer action must be fully visible');
 await page.screenshot({path:path.resolve(__dirname,'../.tmp-button-art-transfer.png')});
 await click('.back');await click('[data-nav="codex"]');
 assert.equal(await page.locator('[data-codex-section="characters"]').evaluate(e=>getComputedStyle(e).clipPath),'none');
 assert.notEqual(await page.locator('[data-tab="all"]').evaluate(e=>getComputedStyle(e).color),await page.locator('[data-tab="master"]').evaluate(e=>getComputedStyle(e).color),'Selected filter must be distinct');
 await page.screenshot({path:path.resolve(__dirname,'../.tmp-button-art-codex.png')});
 await click('.back');await click('[data-nav="multi"]');
 for(const viewport of [{width:1280,height:720},{width:1920,height:1080}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(300);
  assert.equal(await page.locator('.mode-card').count(),4);
  for(const card of await page.locator('.mode-card').all())assert.equal(await card.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}),true,'Multiplayer mode clipped');
  await page.screenshot({path:path.resolve(__dirname,`../.tmp-button-art-multi-${viewport.width}.png`)});
 }
 await click('.back');await click('[data-nav="single"]');await click('[data-mode="free"]');await click('[data-pick-master="肯尼斯"]');await click('[data-standard-next]');await click('[data-pick-servant="巴御前"]');await click('[data-standard-next]');
 assert.equal(await page.locator('.ready-enter-preview').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth}),true,'Confirm action must be fully visible');
 await page.screenshot({path:path.resolve(__dirname,'../.tmp-button-art-ready.png')});
 await click('[data-enter-battle-preview]');
 await page.waitForFunction(()=>{const r=document.querySelector('.battle-host')?.shadowRoot;return r&&r.querySelector('#open-log')});
 await page.waitForFunction(()=>window.fdCurrentBattleUI?.isPreviewReady(),{},{timeout:20000});
 await page.screenshot({path:path.resolve(__dirname,'../.tmp-button-art-battle.png')});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,classicExperience:60,duplicatePrevented:true,profileRoundTrip:true,artwork:true,multiplayer:true}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
