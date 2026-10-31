import {expect,test,type Page}from'@playwright/test';
import {spawn,type ChildProcess}from'node:child_process';
import {writeFileSync}from'node:fs';
import type {MatchRoomProjection,RoomHttpResponse,ServerRoomMessage}from'../packages/rules/src/index';
import {chooseFullMatchDecision}from'./support/full-seven-player-driver';
import {projectRemoteRoomFixture}from'../apps/client/src/state/remote-room-fixture';
let child:ChildProcess|undefined;
test.afterEach(async()=>{if(child&&child.exitCode===null)await new Promise<void>(resolve=>{child!.once('exit',()=>resolve());child!.kill();});child=undefined;});

test('seven real browser seats play from lobby through eleven rounds and reconnect midmatch',async({browser,request},info)=>{
 test.setTimeout(360_000); // New whole-match UI acceptance budget; original unit/CI timeouts are unchanged.
 const server:any=await new Promise((resolve,reject)=>{child=spawn(process.execPath,['--import','tsx','e2e/support/start-full-match-server.ts'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout!.on('data',b=>{out+=b.toString();const line=out.split('\n').find(l=>l.startsWith('{'));if(line)resolve(JSON.parse(line));});child.stderr!.on('data',b=>err+=b.toString());child.once('exit',c=>reject(new Error(`Server exited${c}:${err}`)));});
 const roomId=`whole-ui-${Date.now()}`;const credentials:RoomHttpResponse[]=[],pages:Page[]=[],latest:Array<Extract<ServerRoomMessage,{type:'server:projection'}>|undefined>=[],errors:string[]=[],trace:unknown[]=[];
 const context=await browser.newContext();
 try{
  for(let seat=1;seat<=7;seat++){
   const response=await request.post(server.httpBase+(seat===1?'/rooms':`/rooms/${roomId}/join`),{data:seat===1?{roomId,seed:20260904,hostClientId:'seat-1'}:{clientId:`seat-${seat}`,displayName:`Seat ${seat}`,role:'player'}});expect(response.ok()).toBe(true);credentials.push(await response.json());
   const index=seat-1,page=await context.newPage();pages.push(page);
   page.on('pageerror',e=>errors.push(`page${seat}:${e.message}`));
   page.on('websocket',ws=>ws.on('framereceived',event=>{const m=JSON.parse(event.payload.toString())as ServerRoomMessage;if(m.type==='server:projection')latest[index]=m;if(m.type==='server:error')errors.push(`seat${seat}:${m.message}`);}));
   const c=credentials[index]!;await page.goto('/?'+new URLSearchParams({remote:'1',roomId,clientId:c.clientId,token:c.reconnectToken,http:server.httpBase,ws:server.wsBase}));
   await expect(page.getByLabel('远程对局房间')).toContainText('lobby');
   await page.getByLabel('远程七人选座').locator('button').nth(index).click();
   await expect.poll(()=>latest[index]?.projection.viewer.playerId).toBe(`p${seat}`);
  }
  await pages[0]!.getByRole('button',{name:'开始',exact:true}).click();
  await expect.poll(()=>latest.filter(m=>m?.projection.status==='running').length).toBe(7);
  const rounds=new Set<number>();let reloaded=false;
  for(let step=0;step<1200;step++){
   const projections=latest.map(m=>m!.projection);const first=projections[0]!.match!;rounds.add(first.round);
   if(first.outcome)break;
   expect(errors,`step${step}`).toEqual([]);
   const {projection,command}=chooseFullMatchDecision(projections);const index=Number(projection.viewer.playerId!.slice(1))-1,page=pages[index]!,revision=projection.match!.view.revision;
   trace.push({step,round:first.round,phase:first.phase,player:projection.viewer.playerId,command:command??'end_turn'});
   if(command){
    const fixture=projectRemoteRoomFixture(projection)!;
    const action=fixture.availableActions.find(a=>JSON.stringify(a.backendCommand)===JSON.stringify(command));
    expect(action,JSON.stringify(command)).toBeDefined();
    if(action!.sourceCardInstanceId){
     const workbench=page.getByRole('region',{name:'本人操作台',exact:true});
     if(await workbench.locator('.workbench__toggle').getAttribute('aria-expanded')==='false')await workbench.locator('.workbench__toggle').click();
     const id=action!.sourceCardInstanceId;
     const hand=fixture.self.hand.filter(c=>!fixture.self.stagedAttackArea?.includes(c));
     const inHand=hand.indexOf(id),inSkills=fixture.self.skills.indexOf(id);
     const card=inHand>=0?workbench.locator('.workbench__zone--hand .card-surface').nth(inHand):workbench.locator('.workbench__zone--servant-skills .card-surface').nth(inSkills);
     expect(inHand>=0||inSkills>=0).toBe(true);await card.click();
     await page.getByRole('dialog').getByRole('button',{name:action!.label,exact:true}).click();
     await page.getByRole('button',{name:'关闭卡牌检视',exact:true}).click();
    }else await page.getByRole('button',{name:action!.label,exact:true}).first().click();
   }else{
    await page.locator('.decision-panel__confirm').click();
    const reminder=page.getByRole('alertdialog',{name:'可选能力提醒'});if(await reminder.isVisible())await reminder.getByRole('button',{name:'仍然结束',exact:true}).click();
   }
   await expect.poll(()=>latest.filter(m=>m?.projection.match&&m.projection.match.view.revision>revision).length).toBe(7);
   if(!reloaded&&first.round===4){reloaded=true;await page.reload();await expect(page.getByLabel('远程对局房间')).toContainText('running');await expect.poll(()=>latest[index]!.projection.match!.round).toBe(4);}
  }
  expect(reloaded).toBe(true);expect([...rounds]).toEqual([1,2,3,4,5,6,7,8,9,10,11]);expect(errors).toEqual([]);
  expect(latest[0]!.projection.status).toBe('ended');expect(latest[0]!.projection.match!.outcome).toBeDefined();
  await expect(pages[0]!.getByLabel('正式对局结果')).toBeVisible();
  const outcome=latest[0]!.projection.match!.outcome;await pages[0]!.reload();await expect(pages[0]!.getByLabel('正式对局结果')).toBeVisible();expect(latest[0]!.projection.match!.outcome).toEqual(outcome);
  writeFileSync(info.outputPath('whole-match-result.json'),JSON.stringify({roomId,seed:20260904,rounds:[...rounds],commands:trace.length,outcome,realSeats:7,setup:'HTTP create/join + UI seat/start',actions:'UI clicks only',stateInjection:false},null,2));
  await pages[0]!.screenshot({path:info.outputPath('whole-match-result.png')});
  await info.attach('whole-seven-player-ui-result',{body:JSON.stringify({roomId,seed:20260904,rounds:[...rounds],commands:trace.length,outcome,realSeats:7,setup:'HTTP create/join + UI seat/start',actions:'UI clicks only',stateInjection:false}),contentType:'application/json'});
  await info.attach('final-result',{body:await pages[0]!.screenshot(),contentType:'image/png'});
 }finally{
  writeFileSync(info.outputPath('whole-match-transcript.json'),JSON.stringify({trace,errors},null,2));
  await info.attach('full-ui-command-transcript',{body:JSON.stringify({trace,errors}),contentType:'application/json'});
  await context.close();
 }
});
