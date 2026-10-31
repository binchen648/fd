import {describe,expect,it}from'vitest';
import {createMatchSession}from'../../src/match-session';
import {createMatchRoomHub}from'../../src/match-room-hub';
import {chooseFullMatchDecision}from'../../../../e2e/support/full-seven-player-driver';

describe('A-MATCH-03 preparation supplies',()=>{
 it('draws hand supply before situation mana and event placement',()=>{
  const session=createMatchSession({seed:20260904});
  const firstDraw=session.logs.findIndex(l=>l.type==='cards_drawn');
  const situation=session.logs.findIndex(l=>l.type==='situation_applied');
  const event=session.logs.findIndex(l=>l.type==='event_drawn');
  expect(firstDraw).toBeGreaterThanOrEqual(0);expect(firstDraw).toBeLessThan(situation);expect(situation).toBeLessThan(event);
 });
 it('increments the authoritative revision after workshop deployment',()=>{
  const hub=createMatchRoomHub(),roomId='deployment-revision';hub.createRoom({roomId,seed:20260904,hostClientId:'seat-1'});
  for(let seat=1;seat<=7;seat++){const id=`seat-${seat}`;if(seat>1)hub.joinRoom(roomId,{clientId:id,displayName:id,role:'player'});hub.selectSeat(roomId,id,seat);}
  hub.startMatch(roomId,'seat-1');
  for(let seat=1;seat<=7;seat++)hub.endTurn(roomId,`seat-${seat}`,hub.project(roomId,`seat-${seat}`).match!.view.revision);
  const before=hub.project(roomId,'seat-1').match!.view.revision;
  expect(hub.dispatchCommand(roomId,'seat-1',{type:'deploy_player',locationId:'magic_workshop'},before).result.ok).toBe(true);
  expect(hub.project(roomId,'seat-1').match!.view.revision).toBeGreaterThan(before);
  expect(()=>hub.endTurn(roomId,'seat-2',before)).toThrow(/Stale/);
 });
 it('uses remaining deck cards then recycles only its own discard and fills the rest',()=>{
  const session=createMatchSession({seed:20260904});
  const state=session.state,own=state.cards.filter(c=>c.ownerPlayerId==='p1'&&['hand','deck'].includes(c.zone));
  // Isolated depletion boundary fixture, not evidence of a full game played.
  own.forEach(c=>c.zone='discard');own[0]!.zone='deck';
  const other=state.cards.find(c=>c.ownerPlayerId==='p2'&&c.zone==='hand')!;other.zone='discard';
  const removed=own[1]!;removed.zone='removed_from_game';
  const beforeIds=state.cards.map(c=>c.instanceId).sort();
  (session as unknown as {drawToHandLimit(state:typeof state,id:string):void}).drawToHandLimit(state,'p1');
  const hand=state.cards.filter(c=>c.ownerPlayerId==='p1'&&c.zone==='hand');
  expect(hand).toHaveLength(3);expect(hand.some(c=>c.instanceId===own[0]!.instanceId)).toBe(true);
  expect(state.cards.find(c=>c.instanceId===other.instanceId)!.zone).toBe('discard');
  expect(state.cards.find(c=>c.instanceId===removed.instanceId)!.zone).toBe('removed_from_game');
  expect(state.cards.map(c=>c.instanceId).sort()).toEqual(beforeIds);
  expect(session.logs.some(l=>l.type==='player_deck_recycled'&&l.payload?.playerId==='p1')).toBe(true);
 });
});

for(const seed of [20260904,20260905])it(`plays a real seven-human room from round1 through a verified round11 outcome (${seed})`,()=>{
 const hub=createMatchRoomHub();const roomId=`full-match-${seed}`;
 hub.createRoom({roomId,seed,hostClientId:'seat-1'});
 for(let seat=1;seat<=7;seat++){const id=`seat-${seat}`;if(seat>1)hub.joinRoom(roomId,{clientId:id,displayName:id,role:'player'});hub.selectSeat(roomId,id,seat);}
 hub.startMatch(roomId,'seat-1');let room=hub.getRoom(roomId);let restored=false,checkedStale=false,moves=0,commands=0;const checkedRounds=new Set<number>();
 expect(room.seats.every(s=>s.controller==='human')).toBe(true);
 for(;commands<1200;commands++) {
  const projections=Array.from({length:7},(_,i)=>hub.project(roomId,`seat-${i+1}`));const match=projections[0]!.match!;
  if(match.outcome)break;
  expect(['state_loop','backend_rejection','no_legal_action','host_directive']).not.toContain(match.stopReason);
  if(match.phase==='preparation'&&!checkedRounds.has(match.round)){
   checkedRounds.add(match.round);
   for(const player of room.session!.state.players.filter(p=>p.status==='active')) {
    const own=room.session!.state.cards.filter(c=>c.ownerPlayerId===player.id);const total=own.filter(c=>['hand','deck','discard'].includes(c.zone)).length;
    expect(own.filter(c=>c.zone==='hand').length).toBeGreaterThanOrEqual(Math.min(3,total));
   }
   const current=room.session!.logs.filter(l=>l.round===match.round);
   const lastDraw=current.findLastIndex(l=>l.type==='cards_drawn');const situation=current.findIndex(l=>l.type==='situation_applied');
   if(lastDraw>=0)expect(lastDraw).toBeLessThan(situation);
  }
  const {projection,command}=chooseFullMatchDecision(projections);const client=projection.viewer.clientId,revision=projection.match!.view.revision;
  const result=command?hub.dispatchCommand(roomId,client,command,revision):hub.endTurn(roomId,client,revision);
  expect(result.result.ok,JSON.stringify({round:match.round,phase:match.phase,command,rejection:result.result.rejection})).toBe(true);
  if(command?.type==='normal_move')moves++;
  if(!checkedStale&&command?.type==='stage_attack_card'){
   checkedStale=true;const before=JSON.stringify(room.session!.state);const logCount=room.session!.logs.length,version=hub.version(roomId);
   expect(()=>hub.dispatchCommand(roomId,client,command,revision)).toThrow(/Stale/);
   expect(JSON.stringify(room.session!.state)).toBe(before);expect(room.session!.logs).toHaveLength(logCount);expect(hub.version(roomId)).toBe(version);
  }
  if(!restored&&match.round===4&&command?.type==='stage_attack_card'){
   restored=true;const before=JSON.stringify(room.session!.state);const snapshot=room.serializeRoom();
   hub.restoreRoom(roomId,snapshot);room=hub.getRoom(roomId);
   expect(JSON.stringify(room.session!.state)).toBe(before);
   for(const id of ['seat-1','seat-4']){hub.disconnect(roomId,id);expect(hub.reconnect(roomId,room.getIssuedCredential(id)).viewer.clientId).toBe(id);}
  }
 }
 const final=hub.project(roomId,'seat-1').match!;
 expect(commands).toBeLessThan(1200);expect(restored&&checkedStale).toBe(true);expect(moves).toBeGreaterThan(0);
 expect(final.round).toBe(11);expect(final.stopReason).toBe('match_complete');expect(final.outcome).toBeDefined();expect(room.status).toBe('ended');
 expect(room.session!.logs.filter(l=>l.type==='round_start').map(l=>l.round)).toEqual([1,2,3,4,5,6,7,8,9,10,11]);
 expect(room.session!.logs.filter(l=>l.type==='standard_round_end_resolved').map(l=>l.round)).toEqual([1,2,3,4,5,6,7,8,9,10,11]);
 expect(room.session!.logs.some(l=>l.type==='player_deck_recycled')).toBe(true);
 for(const round of [8,9,10])expect(room.session!.logs.filter(l=>l.round===round&&l.type==='standard_round_end_resolved')).toHaveLength(1);
 expect(final.battleBreakdowns.length).toBeGreaterThan(0);expect(final.logs.some(l=>l.type==='final_scoring')).toBe(true);
},30_000);
