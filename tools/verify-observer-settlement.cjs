const {chromium}=require('../../binchen648_fd/work/node_modules/playwright');
const path=require('path');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage();
  await page.goto('file:///'+path.resolve(__dirname,'../index.html').replaceAll('\\','/'));
  await page.waitForFunction(()=>Boolean(window.FDBattleRuntime));
  const result=await page.evaluate(()=>{
   const runtime=window.FDBattleRuntime.create({seed:1});
   const saved=JSON.parse(runtime.app.save());
   // Exercise an eliminated local spectator without waiting eight rounds.
   const state=saved.state;
   state.players.p1.eliminated=true;state.players.p1.locationId=null;
   state.turnOrder=state.turnOrder.filter(id=>id!=='p1');
   for(const id of Object.keys(state.board.locations))state.board.locations[id]=state.board.locations[id].filter(id=>id!=='p1');
   state.phase='combat';state.step='settlement';state.activePlayerId=null;state.resolvedCombats=[];
   runtime.app.restore(JSON.stringify(saved));
   const performed=[];
   for(let i=0;i<10;i++){
    const actions=runtime.snapshot().actions;
    if(actions.some(a=>!['combat.resolve','round.end'].includes(a.commandType)))throw Error('淘汰观察者暴露了玩家操作');
    const action=actions[0];if(!action)throw Error('淘汰观察者无法继续公共结算');
    runtime.dispatch(action.id);performed.push(action.commandType);
    if(action.commandType==='round.end')break;
   }
   if(runtime.app.state.round!==2||!runtime.app.state.players.p1.eliminated)throw Error('观察结算错误地复活玩家或未进入下一回合');
   return {passed:true,performed,nextRound:runtime.app.state.round};
  });
  console.log(JSON.stringify(result));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
