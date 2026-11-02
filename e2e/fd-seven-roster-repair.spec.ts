import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

for (const payment of [1, 3]) test(`Inferno payment ${payment} uses real HTTP/WS, rejects stale replay and survives a fresh server process`, async ({ page }, info) => {
  test.setTimeout(90_000);
  const directory = mkdtempSync(join(tmpdir(), 'fd-r3-accept-'));
  const roomId = `r3-paid-${Date.now()}`;
  let child: ChildProcess | undefined;
  const source = String.raw`
    import assert from 'node:assert/strict';
    import { existsSync } from 'node:fs';
    import { createMatchRoomHub, advanceAbilityPhase } from '@fd/rules';
    import { createMatchServer } from './apps/server/src/match-server.ts';
    const roomId=process.env.FD_R3_ROOM_ID, file=process.env.FD_R3_STATE;
    let hub,actorClientId=process.env.FD_R3_CLIENT;
    if(!existsSync(file)) {
      hub=createMatchRoomHub(); hub.createRoom({roomId,seed:20260907,hostClientId:'seat-1'});
      for(let seat=1;seat<=7;seat++){const id='seat-'+seat;if(seat>1)hub.joinRoom(roomId,{clientId:id,displayName:id,role:'player'});hub.selectSeat(roomId,id,seat);}
      hub.startMatch(roomId,'seat-1');const s=hub.getRoom(roomId).session,state=s.state;
      const card=state.cards.find(c=>c.definitionId==='servant.tomoe.skill.sc-tomoe-2'),owner=state.players.find(p=>p.id===card.controllerPlayerId);
      // Bounded Gate C start; actual production card/activation, not a natural full game.
      state.round.activePhase='action';state.round.prioritySeat=owner.seat;state.eventPlacements=[];state.currentSituationModifiers=[];
      state.modeState.cardPlayForbids=[];state.modeState.closedLocations=[];state.abilityRuntime.hostRequests=[];state.abilityRuntime.responseWindows=[];delete state.abilityRuntime.pendingDecision;
      for(const p of state.players){p.mana=12;p.locationId='magic_workshop';}owner.locationId='miyama_town';
      const send=c=>assert.equal(s.dispatchPlayerAction(owner.id,c).ok,true);
      send({type:'skip_normal_move'});send({type:'stage_attack_card',cardInstanceId:card.instanceId});
      send(s.getPlayerView(owner.id).legalActions.find(a=>a.type==='stage_attack_card'&&a.faceDown));send({type:'confirm_staged_attack'});
      send({type:'activate_ability',cardInstanceId:card.instanceId,abilityId:'sc-tomoe-2.inferno-fire'});
      advanceAbilityPhase(state,'advance',2);for(const p of state.players)delete p.locationId;
      state.modeState.terrainAssignments={};state.map.locations.find(l=>l.id==='miyama_town').terrainBonuses=[5,3,1];
      const actor=state.players.find(p=>p.id!==owner.id&&p.masterCardId!=='master.kayneth');actor.vp=8;state.round.prioritySeat=actor.seat;actorClientId='seat-'+actor.seat;
    }
    const server=createMatchServer({...(hub?{hub}:{}),stateFile:file});const port=await server.listen(Number(process.env.FD_R3_PORT||0));
    const room=server.hub.getRoom(roomId),projection=room.getProjection(actorClientId);
    console.log(JSON.stringify({port,roomId,clientId:actorClientId,token:room.getIssuedCredential(actorClientId),actorId:projection.viewer.playerId,pid:process.pid}));
    process.once('SIGTERM',async()=>{await server.close();process.exit(0);});
  `;
  async function start(port = 0, clientId?: string): Promise<{ port: number; roomId: string; clientId: string; token: string; actorId: string; pid: number }> {
    return new Promise((done, reject) => {
      const current = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', source], {
        cwd: resolve('.'), env: { ...process.env, FD_R3_ROOM_ID: roomId, FD_R3_STATE: join(directory, 'rooms.json'), FD_R3_PORT: String(port), ...(clientId ? { FD_R3_CLIENT: clientId } : {}) }, stdio: ['ignore', 'pipe', 'pipe'],
      });
      child = current; let output = '', stderr = '';
      current.stdout!.on('data', chunk => { output += chunk; for (const line of output.split('\n')) { try { const data = JSON.parse(line); if (data.port) done(data); } catch {} } });
      current.stderr!.on('data', chunk => { stderr += chunk; });
      current.once('error', reject); current.once('exit', code => reject(new Error(`Acceptance server exited ${code}: ${stderr}`)));
    });
  }
  async function kill() { const current = child; child = undefined; if (current && current.exitCode === null) await new Promise<void>(done => { current.once('exit', () => done()); current.kill('SIGKILL'); }); }
  const projections: any[] = [], errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('websocket', socket => socket.on('framereceived', frame => { const message=JSON.parse(frame.payload.toString()); if(message.type==='server:projection')projections.push(message.projection); }));
  try {
    const server = await start(), http = `http://127.0.0.1:${server.port}`, ws = `ws://127.0.0.1:${server.port}`;
    await page.goto('/?' + new URLSearchParams({ remote:'1', roomId, clientId:server.clientId, token:server.token, http, ws }));
    const latest = () => projections.at(-1)?.match;
    await expect(page.getByRole('button', { name:`部署至 深山町 · 支付 ${payment} 战果`, exact:true })).toBeVisible();
    const revision=latest().view.revision;
    await page.getByRole('button', { name:`部署至 深山町 · 支付 ${payment} 战果`, exact:true }).click();
    await expect.poll(()=>latest()?.view.players.find((p:any)=>p.id===server.actorId)?.vp).toBe(8-payment);
    await expect.poll(()=>latest()?.view.revision).toBeGreaterThan(revision);
    const slots=page.getByLabel('深山町',{exact:true}).locator('.location-node__slot-board--terrain').locator(':scope > span');
    await expect(slots).toHaveCount(3);
    await expect(slots.nth(0)).not.toHaveClass(/is-occupied/);
    await expect(slots.nth(payment===1?2:1)).toHaveClass(/is-occupied/);
    await expect(slots.nth(payment===1?2:1).locator('small')).toHaveText(`+${payment}`);
    const paidRevision=latest().view.revision;
    const duplicate = await page.evaluate(({ ws, roomId, clientId, token, revision, payment }) => new Promise<any>((done,reject)=>{
      const socket=new WebSocket(`${ws}/rooms/${roomId}?clientId=${clientId}&reconnectToken=${token}`);
      socket.addEventListener('open',()=>socket.send(JSON.stringify({type:'client:dispatch_command',expectedRevision:revision,command:{type:'deploy_player',locationId:'miyama_town',vpPayment:payment}})));
      socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.type==='server:error'){socket.close();done({code:m.code,message:m.message});}});socket.addEventListener('error',()=>reject(new Error('Replay socket failed')));
    }), { ws,roomId,clientId:server.clientId,token:server.token,revision,payment });
    expect(duplicate.message).toContain('Stale command revision');
    const count=projections.length;
    await kill();const restarted=await start(server.port,server.clientId);expect(restarted.pid).not.toBe(server.pid);
    await expect.poll(()=>projections.length).toBeGreaterThan(count);
    await expect.poll(()=>latest()?.view.revision).toBe(paidRevision);
    expect(latest().view.players.find((p:any)=>p.id===server.actorId)).toMatchObject({vp:8-payment,locationId:'miyama_town'});
    const reloadCount=projections.length;await page.reload();await expect.poll(()=>projections.length).toBeGreaterThan(reloadCount);
    await expect.poll(()=>latest()?.view.players.find((p:any)=>p.id===server.actorId)?.vp).toBe(8-payment);
    await expect(slots.nth(payment===1?2:1)).toHaveClass(/is-occupied/);
    expect(errors).toEqual([]);
    await page.screenshot({path:info.outputPath('inferno-paid-recovered.png'),fullPage:true});
    writeFileSync(info.outputPath('result.json'),JSON.stringify({boundedFixture:true,realProductionAbilityActivation:true,realHttpWs:true,actualFreshProcess:true,payment,beforeVp:8,afterVp:8-payment,authoritativeSlotPreserved:true,duplicateRejected:true,recoveredRevision:paidRevision,errors},null,2));
  } finally { await kill(); const safe=resolve(directory); if(!safe.startsWith(resolve(tmpdir())+sep+'fd-r3-accept-'))throw new Error('Unexpected test directory');rmSync(safe,{recursive:true,force:true}); }
});
