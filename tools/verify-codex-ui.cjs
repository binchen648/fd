const {chromium}=require('../../binchen648_fd/work/node_modules/playwright');
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),data={window:{}};
for(const name of ['codex-detail-data.js','board-codex-data.js'])vm.runInNewContext(fs.readFileSync(path.join(root,'ui-preview',name),'utf8'),data);
const roles=data.window.FDCodexDetailData,board=data.window.FDBoardCodexData;
const passed=[];function check(value,name){if(!value)throw Error(name);passed.push(name)}
for(const card of [...Object.values(roles.masters),...Object.values(roles.servants),...board.situations,...board.events]){
 check(fs.existsSync(path.resolve(root,'ui-preview',card.image)),`主卡图存在 ${card.name}`);
 for(const child of [...(card.skills||[]),...(card.deck||[])]){
  check(Boolean(child.name&&child.text),`文案完整 ${card.name}/${child.name}`);
  if(child.image)check(fs.existsSync(path.resolve(root,'ui-preview',child.image)),`附属卡图存在 ${card.name}/${child.name}`);
  if(card.deck?.includes(child))check(Boolean(child.image),`卡组无空白卡图 ${card.name}/${child.name}`);
 }
}
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const click=async s=>{await page.locator(s).click();await page.waitForTimeout(850)};
const images=async selector=>{await page.locator(selector).evaluateAll(async items=>{await Promise.all(items.map(i=>i.decode().catch(()=>{})))});return page.locator(selector).evaluateAll(items=>items.length>0&&items.every(i=>i.naturalWidth>0))};
await page.goto('file:///'+path.join(root,'ui-preview/本地UI预览.html').replaceAll('\\','/'));await page.locator('.legal-screen.is-ready').waitFor({timeout:60000});await click('[data-legal-continue]');await page.waitForTimeout(1200);await click('.press-any');await page.locator('[data-nav="codex"]').waitFor();await click('[data-nav="codex"]');
check(await page.locator('.codex-card').count()===14,'十四个角色');check(await images('.codex-card img'),'角色列表卡图加载');
await page.mouse.move(0,0);await page.waitForTimeout(300);
check(await page.locator('.codex-portrait img').evaluateAll(items=>items.every(i=>{const p=i.parentElement.getBoundingClientRect(),r=i.getBoundingClientRect();return Math.abs(p.width-r.width)<1&&Math.abs(p.height-r.height)<1&&Math.abs(r.width/r.height-i.naturalWidth/i.naturalHeight)<.01})),'列表图片贴边且保持原比例');
for(const [kind,bucket] of [['master',roles.masters],['servant',roles.servants]])for(const card of Object.values(bucket)){
 await click(`[data-entry="${card.name}"]`);check(await page.locator('.codex-detail-id strong').innerText()===card.name,`详情角色 ${card.name}`);
 check(await images('.codex-detail-art img'),`详情图片 ${card.name}`);
 check(await page.locator('.codex-skill-item').count()===card.skills.length,`技能数量 ${card.name}`);
 const text=await page.locator('.codex-detail-content').innerText();check(card.skills.every(s=>text.includes(s.name)&&text.includes(s.text)),`技能文案 ${card.name}`);
 if(kind==='servant'){
  await click('[data-codex-detail-tab="deck"]');check(await page.locator('.codex-deck-card').count()===card.deck.length,`卡组种类 ${card.name}`);
  check(await images('.codex-deck-art img'),`卡组卡图 ${card.name}`);
  await page.locator('.codex-deck-art').first().hover();await page.waitForTimeout(200);check(await page.locator('.codex-image-preview.active').count()===1,`卡组放大预览 ${card.name}`);
  check((await page.locator('.codex-detail-section-head').innerText()).includes('共 '+card.deck.reduce((n,c)=>n+c.count,0)+' 张'),`卡组总数 ${card.name}`);
 }
 await click('.back');
}
await click('[data-tab="master"]');check(await page.locator('.codex-card').count()===7,'御主筛选');
for(const cls of ['Saber','Archer','Lancer','Rider','Caster','Berserker']){await click(`[data-class="${cls}"]`);check(await page.locator('.codex-card').count()===Object.values(roles.servants).filter(c=>c.class===cls).length,`职阶筛选 ${cls}`)}
await click('[data-tab="all"]');
for(const [section,cards] of [['situation',board.situations],['event',board.events]]){
 await click(`[data-codex-section="${section}"]`);check(await page.locator('.codex-card').count()===cards.length,`分类数量 ${section}`);check(await images('.codex-card img'),`分类卡图 ${section}`);
 for(const card of cards){await click(`[data-entry="${card.id}"]`);check((await page.locator('.codex-detail-content').innerText()).includes(card.text),`效果文案 ${card.id}`);check(await page.locator('.codex-detail-id strong').innerText()===card.name,`卡牌名称 ${card.id}`);check(await images('.codex-detail-art img'),`卡牌详情图片 ${card.id}`);await click('.back')}
 if(section==='situation')for(const [filter,climax] of [['normal',false],['climax',true]]){await click(`[data-board-filter="${filter}"]`);check(await page.locator('.codex-card').count()===cards.filter(c=>c.climax===climax).length,`局势筛选 ${filter}`)}
}
check(board.events.every(c=>c.group==='冬木'),'只含冬木事件');
await page.locator('.codex-grid').evaluate(g=>g.scrollTop=250);const before=await page.locator('.codex-grid').evaluate(g=>g.scrollTop);
const visible=await page.locator('.codex-card').evaluateAll(cs=>{const r=document.querySelector('.codex-grid').getBoundingClientRect();return cs.findIndex(c=>{const b=c.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom})});await click(`.codex-card >> nth=${visible}`);await click('.back');check(await page.locator('.codex-grid').evaluate(g=>g.scrollTop)===before,'详情返回保留滚动位置');
await page.screenshot({path:path.join(root,'.tmp-codex-acceptance.png')});await page.setViewportSize({width:1920,height:1080});await click('[data-codex-section="characters"]');check(await images('.codex-card img'),'1920角色卡图');
check(!errors.length,'无页面脚本错误');console.log(JSON.stringify({passed:passed.length,roles:14,situations:board.situations.length,eventTypes:board.events.length,eventCards:board.events.reduce((n,c)=>n+c.count,0),checks:passed},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
