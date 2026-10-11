const {chromium}=require('../../binchen648_fd/work/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),sandbox={window:{}},checks=[];
const check=(ok,name)=>{if(!ok)throw Error(name);checks.push(name)};
vm.runInNewContext(fs.readFileSync(path.join(root,'ui-preview/tutorial-data.js'),'utf8'),sandbox);
const documents=sandbox.window.FDTutorialDocuments;
check(documents.length===7,'详细教程七章');
for(const doc of documents)check(doc.text===fs.readFileSync(path.join(root,'docs/tutorial-guide',doc.id+'.md'),'utf8'),`文案生成同步 ${doc.id}`);
check(documents.filter(doc=>doc.reference).length===5,'五份规则原文保留');
const flow=documents.find(doc=>doc.id==='flow').text,base=documents.find(doc=>doc.id==='base').text;
check(flow.includes('深山町放置一张明置事件牌')&&flow.includes('新都放置一张暗置事件牌'),'每回合两个战场的基础事件');
check(base.includes('工坊 → 深山町消耗 1 点')&&base.includes('深山町 → 新都消耗 2 点')&&base.includes('新都 → 侦察消耗 2 点'),'移动费用1、2、2');
check(flow.includes('获得 4 点魔力')&&flow.includes('合计威力增加 2')&&flow.includes('额外获得 2 点战果'),'令咒用途说明');
check(documents.find(doc=>doc.id==='common').text.includes('合计威力较低而没有获胜，与卡牌效果赋予的【败北】是两回事'),'普通失利与败北状态分开说明');

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const click=async selector=>{await page.locator(selector).click();await page.waitForTimeout(850)};
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.locator('.legal-screen.is-ready').waitFor({timeout:60000});await click('[data-legal-continue]');await page.waitForTimeout(500);await click('.press-any');await page.waitForTimeout(400);await click('[data-nav="tutorial"]');await click('[data-tutorial="新手教程"]');
  await page.locator('.tutorial-chapters').evaluate(e=>e.dataset.retained='yes');
  for(const viewport of [{width:1280,height:720},{width:1920,height:1080}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(300);
   check(await page.locator('.tutorial-reader-head h2').innerText()==='先认识你的主从',`新手标题 ${viewport.width}`);
   check(await page.locator('.tutorial-step-actions button:last-child').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),`新手下一步完整可见 ${viewport.width}`);
   await page.screenshot({path:path.join(root,`.tmp-tutorial-beginner-art-${viewport.width}.png`)});
  }
  await page.setViewportSize({width:1280,height:720});
  check(await page.locator('.tutorial-step-actions button').first().isDisabled(),'第一步禁止上一步');
  for(let step=0;step<6;step++){
   check((await page.locator('.tutorial-step-actions span').innerText())===`${step+1} / 6`,`新手进度 ${step+1}`);
   check(await page.locator('.tutorial-lesson-art').evaluate(async image=>{await image.decode();return image.naturalWidth>0}),`新手配图 ${step+1}`);
   if(step<5)await click('.tutorial-step-actions button:last-child');
  }
  check(await page.locator('[data-retained="yes"]').count()===1,'下一步保留页面与章节节点');
  check(await page.locator('.tutorial-chapters .active').evaluate(e=>e===document.activeElement),'下一步保留键盘焦点');
  await click('.tutorial-step-actions button:first-child');check((await page.locator('.tutorial-step-actions span').innerText())==='5 / 6','上一步返回正确');
  await page.locator('.tutorial-chapters [data-tutorial-step="5"]').focus();await page.keyboard.press('Enter');await page.waitForTimeout(500);check((await page.locator('.tutorial-step-actions span').innerText())==='6 / 6','键盘章节跳转');
  await click('.tutorial-step-actions [data-nav="single"]');check(await page.locator('[data-mode="free"]').count()===1,'完成新手教程进入选人模式');
  await click('.back');await page.waitForTimeout(400);await click('[data-nav="tutorial"]');await click('[data-tutorial="详细教程"]');
  await page.locator('.tutorial-chapters').evaluate(e=>e.dataset.retained='yes');
  for(const doc of documents){
   await click(`[data-tutorial-document="${doc.id}"]`);
   check(await page.locator('[data-retained="yes"]').count()===1,`章节切换不重建页面 ${doc.id}`);
   check(await page.locator(`[data-tutorial-document="${doc.id}"]`).evaluate(e=>e===document.activeElement),`章节焦点 ${doc.id}`);
   check(await page.locator('.tutorial-reader-head h2').innerText()===doc.title,`章节标题 ${doc.id}`);
   check(await page.locator('.tutorial-lesson-copy').evaluate(e=>e.scrollWidth<=e.clientWidth+1),`文案无横向溢出 ${doc.id}`);
   if(doc.reference){await click('.tutorial-reference summary');check(await page.locator('.tutorial-reference').evaluate(e=>e.open),`原文展开 ${doc.id}`);}
  }
  await click('[data-tutorial-document="flow"]');await page.locator('.tutorial-lesson-copy').evaluate(e=>e.scrollTop=240);const scroll=await page.locator('.tutorial-lesson-copy').evaluate(e=>e.scrollTop);
  await click('[data-tutorial-document="base"]');await click('[data-tutorial-document="flow"]');check(await page.locator('.tutorial-lesson-copy').evaluate(e=>e.scrollTop)===scroll,'返回章节恢复阅读位置');check(await page.locator('.tutorial-reference').evaluate(e=>e.open),'返回章节保留原文展开状态');
  await page.keyboard.press('Escape');await page.waitForTimeout(900);check(await page.locator('[data-tutorial="详细教程"]').count()===1,'Esc返回教程目录');await click('[data-tutorial="详细教程"]');check(await page.locator('.tutorial-lesson-copy').evaluate(e=>e.scrollTop)===scroll,'重新进入保留阅读位置');
  for(const viewport of [{width:1280,height:720},{width:1920,height:1080}]){
   await page.setViewportSize(viewport);check(await page.locator('.tutorial-page').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth}),`教程完整可见 ${viewport.width}`);
   await page.locator('.tutorial-lesson-copy').evaluate(e=>e.scrollTop=0);await page.waitForTimeout(300);
   await page.screenshot({path:path.join(root,`.tmp-tutorial-rules-art-${viewport.width}.png`)});
  }
  await page.screenshot({path:path.join(root,'.tmp-tutorial-module-final.png')});
  await page.emulateMedia({reducedMotion:'reduce'});await click('[data-tutorial-document="base"]');check(await page.locator('.tutorial-reader-head h2').innerText()==='地点、部署与移动','减少动画模式章节可用');
  check(errors.length===0,'无页面脚本错误');console.log(JSON.stringify({passed:checks.length,checks},null,2));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
