import {expect,test} from '@playwright/test';
import {spawn,type ChildProcess} from 'node:child_process';
let child:ChildProcess|undefined;
test.afterEach(async()=>{if(child&&child.exitCode===null)await new Promise<void>(resolve=>{child!.once('exit',()=>resolve());child!.kill();});child=undefined;});
test('seven-seat real room rotates from last combat decision to next-round seat2 and reconnects',async({page,context},info)=>{
 const fixture:any=await new Promise((resolve,reject)=>{
  child=spawn(process.execPath,['--import','tsx','e2e/support/start-round-transition-fixture-server.ts'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
  let out='',err='';child.stdout!.on('data',b=>{out+=b.toString();const line=out.split('\n').find(l=>l.startsWith('{'));if(line)resolve(JSON.parse(line));});child.stderr!.on('data',b=>err+=b.toString());child.once('exit',code=>reject(new Error(`fixture exit${code}:${err}`)));
 });
 await info.attach('bounded-round1-boundary',{body:JSON.stringify(fixture),contentType:'application/json'});
 const link=(index:number)=>'/?'+new URLSearchParams({remote:'1',roomId:fixture.roomId,...fixture.clients[index],http:fixture.httpBase,ws:fixture.wsBase});
 const seat2=await context.newPage();await seat2.goto(link(0));await page.goto(link(1));
 await expect(page.getByLabel('远程对局房间')).toContainText('running');
 await expect(page.locator('.decision-panel__metric')).toContainText('SEAT 7');
 await page.locator('.decision-panel__confirm').click();
 const reminder=page.getByRole('alertdialog',{name:'可选能力提醒'});if(await reminder.isVisible())await reminder.getByRole('button',{name:'仍然结束',exact:true}).click();
 await expect(seat2.locator('.decision-panel__metric')).toContainText('SEAT 2');
 await expect(seat2.locator('.decision-panel__confirm')).toBeEnabled();
 await expect(page.locator('.decision-panel__waiting')).toBeVisible();
 await seat2.reload();await expect(seat2.locator('.decision-panel__metric')).toContainText('SEAT 2');
 await expect(seat2.locator('.decision-panel__confirm')).toBeEnabled();
 await expect(seat2.getByLabel('正式对局结果')).toHaveCount(0);
 await info.attach('next-round-seat2',{body:await seat2.screenshot(),contentType:'image/png'});
});
