const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const {chromium}=require('../../binchen648_fd/work/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files']});try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const click=async selector=>{await page.locator(selector).click();await page.waitForTimeout(850)};
 const fit=async selector=>{const rect=await page.locator(selector).evaluate(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight}});assert.ok(rect.left>=-1&&rect.right<=rect.width+1&&rect.top>=-1&&rect.bottom<=rect.height+1,selector+' fits viewport '+JSON.stringify(rect))};
 const shots=path.resolve('ui-preview/design-review/tutorial');fs.mkdirSync(shots,{recursive:true});
 await page.goto(pathToFileURL(path.resolve('ui-preview/本地UI预览.html')).href);await page.locator('.legal-screen.is-ready').waitFor({timeout:120000});await click('[data-legal-continue]');await page.waitForTimeout(1200);await click('.press-any');await click('[data-nav="tutorial"]');
 for(const size of [{width:1280,height:720},{width:1920,height:1080},{width:844,height:390},{width:740,height:360}]){
  await page.setViewportSize(size);await page.mouse.move(0,0);await page.waitForTimeout(250);await fit('.tutorial-grid');await page.screenshot({path:path.join(shots,'directory-'+size.width+'.png')});
  await click('[data-tutorial="新手教程"]');await fit('.tutorial-page');await fit('.tutorial-step-actions');
  await click('.tutorial-chapters [data-tutorial-step="1"]');assert.match(await page.locator('.guide-diagram').innerText(),/深山町[\s\S]*每回合放 1 张明置事件[\s\S]*新都[\s\S]*每回合放 1 张暗置事件/);
  await click('.tutorial-chapters [data-tutorial-step="3"]');assert.deepEqual(await page.locator('.guide-route-arrow small').allTextContents(),['1 魔力','2 魔力','2 魔力']);
  assert.ok(await page.locator('.tutorial-lesson-copy').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.locator('.tutorial-lesson-copy').evaluate(e=>e.scrollTop=0);await page.screenshot({path:path.join(shots,'beginner-'+size.width+'.png')});
  await page.locator('.tutorial-lesson-copy').evaluate(e=>e.scrollTop=e.scrollHeight);await fit('.tutorial-step-actions');await click('.tutorial-step-actions button:last-child');assert.equal(await page.locator('.tutorial-step-actions span').innerText(),'5 / 6');
  await click('.back');await click('[data-tutorial="详细教程"]');await click('[data-tutorial-document="flow"]');await fit('.tutorial-page');
  const anchors=page.locator('[data-tutorial-anchor]');assert.ok(await anchors.count()>0);const target=await anchors.last().getAttribute('data-tutorial-anchor');await anchors.last().click();await page.waitForTimeout(700);
  assert.ok(await page.locator('#'+target).evaluate(e=>{const scroll=e.closest('.tutorial-lesson-copy'),r=e.getBoundingClientRect(),s=scroll.getBoundingClientRect();return r.top>=s.top-1&&r.top<s.bottom}),'outline jumps to selected heading');
  await page.locator('.tutorial-lesson-copy').evaluate(e=>{e.scrollTop=0;e.querySelector('.tutorial-outline>div').scrollLeft=0});await page.mouse.move(0,0);
  const lefts=await page.locator('.tutorial-lesson-copy').evaluate(e=>['.tutorial-outline','h3','p','.tutorial-rule-table'].map(s=>e.querySelector(s).getBoundingClientRect().left));assert.ok(Math.max(...lefts)-Math.min(...lefts)<=1,'headings, paragraphs, outline and tables share a reading column');
  await page.screenshot({path:path.join(shots,'rules-'+size.width+'.png')});
  for(const topic of ['flow','base','fqa','qa','keywords','common','three-x']){
   const chapter=page.locator('[data-tutorial-document="'+topic+'"]');if(await chapter.count()){await click('[data-tutorial-document="'+topic+'"]');assert.ok(await page.locator('.tutorial-lesson-copy').evaluate(e=>e.scrollWidth<=e.clientWidth+1));}
  }
  await click('.back');
 }
 assert.deepEqual(errors,[]);console.log('Passed: tutorial directory, fixed beginner navigation, event/movement diagrams, detailed heading jumps and landscape bounds at 1280, 1920, 844 and 740.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
