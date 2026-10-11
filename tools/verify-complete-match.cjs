const {chromium}=require('../../binchen648_fd/work/node_modules/playwright');
const path=require('path');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
 const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[],rounds=new Set(),steps=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const click=async s=>{await page.locator(s).click();await page.waitForTimeout(1000)};
 await page.goto('file:///'+path.resolve(__dirname,'../index.html').replaceAll('\\','/'));await page.locator('.legal-screen.is-ready').waitFor({timeout:60000});await click('[data-legal-continue]');await page.waitForTimeout(1200);await click('.press-any');await click('[data-nav="single"]');await click('[data-mode="free"]');await click('[data-pick-master="肯尼斯"]');await click('[data-standard-next]');await click('[data-pick-servant="巴御前"]');await click('[data-standard-next]');await click('[data-enter-battle-preview]');await page.locator('.battle-host').waitFor();
 const start=Date.now();let lastRevision=-1,lastChanged=Date.now(),finished=false;
 while(Date.now()-start<360000){
  const result=await page.evaluate(()=>{
   const runtime=window.fdCurrentBattleRuntime,s=runtime.snapshot(),root=document.querySelector('.battle-host').shadowRoot;
   const visible=b=>b&&!b.disabled&&b.getClientRects().length;const tap=b=>{if(!visible(b))return false;b.click();return true};
   if(s.victory.finished||runtime.app.state.status==='finished')return {finished:true,round:s.view.round,revision:runtime.app.state.revision,victory:s.victory,shown:!!root.querySelector('.settlement-demo.victory')};
   const next=root.querySelector('[data-settlement-next]');if(tap(next))return {round:s.view.round,revision:runtime.app.state.revision,operation:'settlement.next'};
   const decision=s.actions.find(a=>a.commandType==='decision.resolve');if(decision){for(const o of (decision.input?.options||[]).filter(o=>!o.disabled).slice(0,decision.input?.min??1))tap(root.querySelector(`[data-runtime-decision-option="${CSS.escape(o.id)}"]`));tap(root.querySelector('[data-runtime-decision]'));return {round:s.view.round,revision:runtime.app.state.revision,operation:'decision'}};
   const deploy=s.actions.find(a=>a.commandType==='player.deploy'&&a.payload?.locationId===(s.view.round%2?'workshop':'city'))||s.actions.find(a=>a.commandType==='player.deploy');
   if(deploy){tap(root.querySelector(`[data-runtime-map-action="${CSS.escape(deploy.id)}"]`));return {round:s.view.round,revision:runtime.app.state.revision,operation:'deploy'}};
   const commits=[...s.actions,...(s.draftAttackActions||[])].filter(a=>a.commandType==='player.attack.commit'&&a.payload?.faceUpInstanceIds?.length&&!a.payload?.faceDownInstanceIds?.length).sort((a,b)=>b.payload.faceUpInstanceIds.length-a.payload.faceUpInstanceIds.length);
   if(commits.length){const ids=commits[0].payload.faceUpInstanceIds;for(const c of root.querySelectorAll('.hand .card.selected'))if(!ids.includes(c.dataset.instanceId))c.click();for(const id of ids){const c=root.querySelector(`.hand .card[data-instance-id="${CSS.escape(id)}"]`);if(c&&!c.classList.contains('selected'))c.click()}tap(root.querySelector('#confirm-play'));return {round:s.view.round,revision:runtime.app.state.revision,operation:'play'}};
   for(const a of s.actions.filter(a=>['combat.resolve','combat.response.complete','phase.player.complete','round.end'].includes(a.commandType))){const b=root.querySelector(`[data-runtime-action="${CSS.escape(a.id)}"]`);if(tap(b))return {round:s.view.round,revision:runtime.app.state.revision,operation:a.commandType}};
   return {round:s.view.round,revision:runtime.app.state.revision,phase:s.view.phase,step:s.view.step,active:s.view.activePlayerId,actions:s.actions.map(a=>a.commandType)};
  });
  if(!rounds.has(result.round)){rounds.add(result.round);console.log('ROUND '+result.round)}
  if(result.operation)steps.push(result.operation);
  if(result.revision!==lastRevision){lastRevision=result.revision;lastChanged=Date.now()}
  if(result.finished){if(!result.shown)throw Error('终局结果未显示');finished=true;console.log(JSON.stringify({finished:true,rounds:[...rounds],operations:steps.length,elapsedMs:Date.now()-start,victory:result.victory}));break}
  if(Date.now()-lastChanged>20000)throw Error('对局卡住 '+JSON.stringify(result));
  await page.waitForTimeout(120);
 }
 if(!finished)throw Error('整局超时');if(errors.length)throw Error(errors.join('\n'));
 await page.screenshot({path:path.resolve(__dirname,'../.tmp-complete-match.png')});await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
