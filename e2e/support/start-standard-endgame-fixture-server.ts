import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createMatchServer } from '../../apps/server/src/match-server';
const server=createMatchServer(); const port=await server.listen(0); const hub=server.hub;
const mode=process.argv[2] ?? 'winner'; const roomId=`endgame-${mode}-${process.pid}`;
hub.createRoom({roomId,hostClientId:'end-1',seed:20260904});
for(let seat=1;seat<=7;seat++) { const id=`end-${seat}`;if(seat!==1)hub.joinRoom(roomId,{clientId:id,displayName:id,role:'player'});hub.selectSeat(roomId,id,seat); }
hub.startMatch(roomId,'end-1'); const room=hub.getRoom(roomId); const session=room.session!;
// Bounded round11 fixture, not proof of a game played from round1. All subsequent commands use the real Session.
session.state.round.roundNumber=11;
for(const p of session.state.players) p.mana=12;
while(session.state.round.activePhase==='preparation') { const p=session.state.players.find(p=>p.seat===session.state.round.prioritySeat)!;assert.equal(session.passPriority(p.id).ok,true); }
while(session.state.round.activePhase==='advance') { const p=session.state.players.find(p=>p.seat===session.state.round.prioritySeat)!; assert.equal(session.dispatchPlayerCommand(p.id,{type:'deploy_player',locationId:p.seat<=2?'magic_workshop':p.seat%2?'miyama_town':'shinto'}).ok,true); }
// Neutral hand attacks keep this a flow/outcome test, not a claim about every character ability.
for(const c of session.state.cards.filter(c=>c.zone==='hand')) c.definitionId='basic.magecraft.2';
for(const p of session.state.players) {
 p.mana=12;
 assert.equal(session.dispatchPlayerCommand(p.id,{type:'skip_normal_move'}).ok,true);
 for(let guard=0;guard<5 && session.getPlayerView(p.id).actionTurn?.regularPlay!=='complete';guard++) {
  const actions=session.getPlayerView(p.id).legalActions;
  const next=actions.find(a=>a.type==='confirm_staged_attack')??actions.find(a=>a.type==='stage_attack_card'&&!a.faceDown)??actions.find(a=>a.type==='complete_empty_regular_play');
  assert.ok(next);assert.equal(session.dispatchPlayerCommand(p.id,next).ok,true);
 }
 assert.equal(session.passPriority(p.id).ok,true);
}
assert.equal(session.state.round.activePhase,'battle');
for(const p of session.state.players) p.vp=p.id==='p1'||mode==='overflow'&&p.id==='p2'?1000:0;
for(let seat=1;seat<7;seat++)assert.equal(session.passPriority(`p${seat}`).ok,true);
process.stdout.write(JSON.stringify({cwd:process.cwd(),sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),pid:process.pid,roomId,httpBase:`http://127.0.0.1:${port}`,wsBase:`ws://127.0.0.1:${port}`,clientId:'end-7',reconnectToken:room.getIssuedCredential('end-7')})+'\n');
const shutdown=async()=>{await server.close();process.exit(0)};process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
