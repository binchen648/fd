import {expect,test} from '@playwright/test';
import {spawn,type ChildProcess} from 'node:child_process';
let child:ChildProcess|undefined;
test.afterEach(async()=>{if(child&&child.exitCode===null)await new Promise<void>(resolve=>{child!.once('exit',()=>resolve());child!.kill();});child=undefined;});
for(const mode of ['winner','overflow'])test(`seven-seat real server ${mode} ends after last combat decision and reconnects`,async({page},info)=>{
 const fixture:any=await new Promise((resolve,reject)=>{
  child=spawn(process.execPath,['--import','tsx','e2e/support/start-standard-endgame-fixture-server.ts',mode],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
  let out='',err='';child.stdout!.on('data',b=>{out+=b.toString();const line=out.split('\n').find(l=>l.startsWith('{'));if(line)resolve(JSON.parse(line));});
  child.stderr!.on('data',b=>err+=b.toString());child.once('exit',code=>reject(new Error(`fixture exit${code}:${err}`)));
 });
 await info.attach('bounded-round11-fixture',{body:JSON.stringify(fixture),contentType:'application/json'});
 const params=new URLSearchParams({remote:'1',roomId:fixture.roomId,clientId:fixture.clientId,token:fixture.reconnectToken,http:fixture.httpBase,ws:fixture.wsBase});
 await page.goto(`/?${params}`);await expect(page.getByLabel('远程对局房间')).toContainText('running');
 await expect(page.getByLabel('正式对局结果')).toHaveCount(0);
 await page.locator('.decision-panel__confirm').click();
 const reminder=page.getByRole('alertdialog',{name:'可选能力提醒'});if(await reminder.isVisible())await reminder.getByRole('button',{name:'仍然结束',exact:true}).click();
 await expect(page.getByLabel('正式对局结果')).toContainText(mode==='winner'?'圣杯战争胜者':'圣杯溢出：全员失败');
 await page.reload();await expect(page.getByLabel('正式对局结果')).toContainText(mode==='winner'?'圣杯战争胜者':'圣杯溢出：全员失败');
 await info.attach('result',{body:await page.screenshot(),contentType:'image/png'});
});
