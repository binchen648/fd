import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL}from'node:url';
const imp=async f=>{const m=await import(pathToFileURL(path.resolve(f)).href);return {...m.default,...m};};
const {createMatchSession,restoreMatchSession}=await imp('packages/rules/src/match-session.ts');
const {advanceAbilityPhase,calculateCardPower}=await imp('packages/rules/src/ability/interpreter.ts');
const {resolveBattlefield}=await imp('packages/rules/src/core/combat-resolver.ts');
let wind=fs.readFileSync(new URL('./wind-production-source.mjs',import.meta.url),'utf8');
wind=wind.replace("import {createMatchSession} from './packages/rules/src/match-session.ts';","")
.replace("import {advanceAbilityPhase,calculateCardPower} from './packages/rules/src/ability/interpreter.ts';","")
.replace("import assert from 'node:assert/strict';","")
.replace('const session=createMatchSession','let session=createMatchSession')
.replace('const state=session.state','let state=session.state')
.replace("  const before=calculateCardPower(state,sourceId).value;","  session=restoreMatchSession(JSON.parse(JSON.stringify(session.serializeSession()))); state=session.state;\n  const before=calculateCardPower(state,sourceId).value;")
.replace("  session.discardRoundAttackAreaCards();","  const snapshot=JSON.stringify(state);const retry=session.dispatchPlayerCommand(player.id,command);assert.equal(retry.ok,false);assert.equal(JSON.stringify(state),snapshot);\n  session.discardRoundAttackAreaCards();");
eval(wind);
for(const roundtrip of [false,true]){
 let session=createMatchSession({seed:394});let s=session.state;const p=s.players.find(p=>p.servantCardId==='servant.achilles'),enemy=s.players.find(p=>p.id!==p.id);
 const targets=s.players.filter(x=>x.id!==p.id);s.eventPlacements=[];s.currentSituationModifiers=[];s.round.activePhase='action';s.round.prioritySeat=p.seat;
 for(const x of s.players)x.locationId='shinto';p.locationId=targets[0].locationId='miyama_town';p.mana=2;
 const source=s.cards.find(c=>c.ownerPlayerId===p.id&&c.definitionId==='servant.achilles.skill.sc-achilles-2');source.zone='attack_area';s.abilityRuntime.cardState[source.instanceId]={active:true,faceDown:false,playedRound:s.round.roundNumber};
 s.cards=s.cards.filter(c=>c.ownerPlayerId!==targets[0].id||c.zone!=='hand');
 s.cards.push({instanceId:'audit-hand',definitionId:'basic.strength.2',ownerPlayerId:targets[0].id,controllerPlayerId:targets[0].id,zone:'hand',visibility:{scope:'public'}});
 const activation={type:'activate_ability',cardInstanceId:source.instanceId,abilityId:'sc-achilles-2.blue-sky'};
 assert(session.dispatchPlayerCommand(p.id,activation).ok);
 const choice=session.getPlayerView(p.id).pendingDecision;assert(choice);
 if(roundtrip){fs.writeFileSync('../r-b-delivery-f6f8bfc7-blue-snapshot.json',JSON.stringify(session.serializeSession(),null,2)); session=restoreMatchSession(JSON.parse(JSON.stringify(session.serializeSession())));s=session.state;}
 const choose={type:'choose_target',decisionId:choice.id,selectedIds:['discard_hand']};
 assert(session.dispatchPlayerCommand(p.id,choose).ok);
 assert.equal(s.cards.find(c=>c.instanceId==='audit-hand').zone,'discard');
 const before=JSON.stringify(s);assert.equal(session.dispatchPlayerCommand(p.id,choose).ok,false);assert.equal(JSON.stringify(s),before);
 console.log(JSON.stringify({case:'blue-sky',roundtrip,discarded:true,duplicateRejected:true}));
}
for(const replay of [false,true]){
 let session=createMatchSession({seed:394});let s=session.state;const p=s.players.find(p=>p.servantCardId==='servant.achilles');const enemy=s.players.find(x=>x.id!==p.id);
 for(const x of s.players)x.locationId='recon';p.locationId=enemy.locationId='miyama_town';s.round.activePhase='battle';s.round.prioritySeat=p.seat;s.eventPlacements=[];s.currentSituationModifiers=[];
 s.cards=s.cards.filter(c=>c.ownerPlayerId!==enemy.id||c.zone!=='hand');
 const source=s.cards.find(c=>c.ownerPlayerId===p.id&&c.definitionId==='servant.achilles.skill.sc-achilles-1');
 const a={type:'activate_ability',cardInstanceId:source.instanceId,abilityId:'sc-achilles-1.gale-advance'};assert(session.dispatchPlayerCommand(p.id,a).ok);
 session=restoreMatchSession(JSON.parse(JSON.stringify(session.serializeSession())));s=session.state;
 const before=JSON.stringify(s);assert.equal(session.dispatchPlayerCommand(p.id,a).ok,false);assert.equal(JSON.stringify(s),before);
 const result=resolveBattlefield(s,{battlefieldId:'miyama_town',participants:[{playerId:p.id,totalPower:1},{playerId:enemy.id,totalPower:8,terrainSlotIndex:0}]});
 assert.equal(result.nextState.battleResults.at(-1).participantBreakdowns.find(x=>x.playerId===enemy.id).effectivePower,0);
 console.log(JSON.stringify({case:'gale',restored:true,duplicateRejected:true,enemyTotal:0}));
}




{
 let session=createMatchSession({seed:394});let s=session.state;const p=s.players.find(p=>p.servantCardId==='servant.tomoe');const enemy=s.players.find(x=>x.id!==p.id);
 for(const x of s.players)x.locationId='recon';p.locationId=enemy.locationId='miyama_town';p.mana=12;p.vp=10;s.round.activePhase='action';s.round.prioritySeat=p.seat;s.eventPlacements=[];s.currentSituationModifiers=[];
 const source=s.cards.find(c=>c.controllerPlayerId===p.id&&c.definitionId==='servant.tomoe.skill.sc-tomoe-1');
 const command=c=>{const r=session.dispatchPlayerCommand(p.id,c);assert(r.ok,JSON.stringify(r.rejection));};
 command({type:'skip_normal_move'});command({type:'stage_attack_card',cardInstanceId:source.instanceId});
 let acts=session.getPlayerView(p.id).legalActions;if(!acts.some(a=>a.type==='confirm_staged_attack'))command(acts.find(a=>a.type==='stage_attack_card'&&a.faceDown)??acts.find(a=>a.type==='stage_attack_card'));
 command({type:'confirm_staged_attack'});command({type:'activate_ability',cardInstanceId:source.instanceId,abilityId:'sc-tomoe-1.independent-action'});
 assert.equal(s.players.find(x=>x.id===p.id).vp,13);
 session=restoreMatchSession(JSON.parse(JSON.stringify(session.serializeSession())));s=session.state;
 s.round.activePhase='battle';s.cards.find(c=>c.instanceId===source.instanceId).zone='removed_from_game';s.abilityRuntime.cardState[source.instanceId].active=false;s.abilityRuntime.preventEffects=true;
 const attacks=s.cards.filter(c=>c.ownerPlayerId===enemy.id&&['hand','deck'].includes(c.zone)).slice(0,4);
 for(const c of attacks){c.definitionId='basic.strength.5';c.zone='attack_area';c.visibility={scope:'public'};s.abilityRuntime.cardState[c.instanceId]={active:true,faceDown:false,playedRound:s.round.roundNumber};}
 session.resolveBattlePhase();
 const penalties=s.abilityRuntime.events.filter(x=>x.type==='victory_points_adjusted'&&x.playerId===p.id&&x.abilityId==='sc-tomoe-1.penalty-on-defeat');
 assert.equal(penalties.length,1);assert.equal(penalties[0].delta,-5);assert.equal(penalties[0].unpreventable,true);
 console.log(JSON.stringify({case:'tomoe',normalPlayAndGain:true,restored:true,sourceRemoved:true,preventEffects:true,actualBattlePenalty:5,penalties:penalties.length,productionPhaseBarrier:true}));
}
