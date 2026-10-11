import fs from 'node:fs';
import {buildStandardContent} from '../src/content/content-package.ts';
import {createGameState} from '../src/domain/state/createGameState.ts';
import {createOwnedCardInstance} from '../src/rules-core/decks.ts';
import {calculateCombatPower} from '../src/rules-core/combat-power.ts';
import {resolveCombat} from '../src/rules-core/combat.ts';
import {movePlayer} from '../src/rules-core/board.ts';
import {commitStandardAttack} from '../src/rules-core/card-play.ts';
import {gainMana,adjustVictoryPoints} from '../src/rules-core/resources.ts';
import {rewardFuyukiAfterCombat} from '../src/rules-core/fuyuki-objectives.ts';
import assert from 'node:assert/strict';
import {StandardMatchEngine} from '../src/match-engine/standard-match-engine.ts';
import {CommandType} from '../src/match-engine/commands.ts';
const raw=JSON.parse(fs.readFileSync(new URL('../src/content/generated/legacy-content.json',import.meta.url),'utf8'));
const content=buildStandardContent({...raw,masters:[],servants:[],cards:raw.cards.filter(c=>!c.isSkill&&c.cardType!=='skill'),eventGroups:raw.eventGroups.filter(g=>g.id==='event-group.fuyuki'),civilizationRuins:[]});
const cards={...content.cards,...Object.fromEntries(content.events.map(e=>[e.id,e]))};
const events=Object.fromEntries(content.events.map(e=>[e.id,e]));
function fixture(eventId,attribute='力量',powers=[2,3],terrain=0){
 const s=createGameState({gameInstanceId:'rule-audit',players:[{id:'p1',name:'一'},{id:'p2',name:'二'}],seed:1});
 s.status='playing';s.round=1;s.phase='combat';s.step='settlement';s.activePlayerId=null;
 s.players.p1.locationId='mountain';s.board.locations.mountain=['p1'];s.players.p1.mana=6;
 s.players.p1.flags.deploymentLocationId='mountain';s.players.p1.flags.deploymentBonusActive=true;s.players.p1.flags.deploymentBonus=terrain;
 s.board.currentEvents.mountain=eventId?[eventId]:[];
 powers.forEach((power,i)=>{
  const definitionId=`audit.${i}`;cards[definitionId]={id:definitionId,name:definitionId,cost:0,basePower:power,typeLabel:attribute,attributes:[attribute],basic:true};
  createOwnedCardInstance(s,'p1',{instanceId:`i${i}`,definitionId,zone:'attack',active:true,face:'up'});
 });
 return s;
}
const probes=[];
function power(id,expected,attribute='力量',powers=[2,3],terrain=0){
 const s=fixture(id,attribute,powers,terrain);
 probes.push({id,name:events[id].name,kind:'power',expected,actual:calculateCombatPower(s,s.players.p1,cards,'mountain')});
}
power('event.fuyuki.4',11,'魔术');power('event.fuyuki.5',11,'迅捷');power('event.fuyuki.6',11);
power('event.fuyuki.10',9);power('event.fuyuki.11',9,'魔术');power('event.fuyuki.12',9,'迅捷');
power('event.fuyuki.7',8);power('event.fuyuki.8',11,'力量',[2,3],3);power('event.fuyuki.9',5,'力量',[2,3],3);
power('event.fuyuki.13',11,'力量',[4,5]);power('event.fuyuki.14',10);power('event.fuyuki.15',10);power('event.fuyuki.16',9);
for(const id of ['event.fuyuki.2','event.fuyuki.3']){
 const s=fixture(id);s.players.p2.victoryPoints=10;
 probes.push({id,name:events[id].name,kind:'lastPlacePower',expected:17,actual:calculateCombatPower(s,s.players.p1,cards,'mountain')});
}
for(const id of ['event.fuyuki.1','event.fuyuki.19','event.fuyuki.20']){
 const s=fixture(id),before=s.players.p1.mana;resolveCombat(s,'mountain',cards,events);
 if (id !== 'event.fuyuki.1') {
   assert.equal(s.players.p1.mana, before, '地脉不能在战场获胜奖励中提前结算');
   rewardFuyukiAfterCombat(s,cards);
 }
 probes.push({id,name:events[id].name,kind:'rewardMana',expected:id.endsWith('.1')?0:2,actual:s.players.p1.mana-before});
}
const sealState=fixture('event.fuyuki.13');sealState.players.p1.commandSeals=2;resolveCombat(sealState,'mountain',cards,events);
probes.push({id:'event.fuyuki.13',kind:'restoreSeal',expected:3,actual:sealState.players.p1.commandSeals});
for(const id of ['event.fuyuki.17','event.fuyuki.18']){
 const s=fixture(id);s.phase='action';s.step='move-decision';s.activePlayerId='p1';let allowed=true;
 try{movePlayer(s,'p1','city',false,cards)}catch{allowed=false}
 probes.push({id,name:events[id].name,kind:'exitAllowed',expected:false,actual:allowed});
 const play=fixture(id,'特殊');play.phase='action';play.step='play-batch-draft';play.activePlayerId='p1';
 for(const instanceId of [...play.players.p1.attack]){play.players.p1.hand.push(instanceId);play.cards[instanceId].zone='hand';play.cards[instanceId].active=false;play.cards[instanceId].face='down'}
 play.players.p1.attack=[];let playable=true;
 try{commitStandardAttack(play,'p1',['i0','i1'],[],cards)}catch{playable=false}
 probes.push({id,kind:'specialAllowed',expected:false,actual:playable});
}
const mana=fixture(null);mana.players.p1.mana=12;gainMana(mana.players.p1,4);
probes.push({id:'base.mana-cap',kind:'resource',expected:12,actual:mana.players.p1.mana});
const vp=fixture(null);adjustVictoryPoints(vp.players.p1,-5);
probes.push({id:'base.vp-floor',kind:'resource',expected:0,actual:vp.players.p1.victoryPoints});
const engine=new StandardMatchEngine({...content,cards});
const complete=s=>engine.execute(s,{commandId:'audit-complete-'+s.revision,gameInstanceId:s.gameInstanceId,actorId:s.activePlayerId,expectedRevision:s.revision,type:CommandType.CompletePlayerWindow,payload:{}}).state;
const undeployed=fixture(null);undeployed.phase='outpost';undeployed.step='player-window';undeployed.activePlayerId='p1';undeployed.players.p1.locationId=null;undeployed.board.locations.mountain=[];
let accepted=true;try{complete(undeployed)}catch{accepted=false}
probes.push({id:'base.mandatory-deployment',kind:'canSkipUndeployed',expected:false,actual:accepted});
const unplayed=fixture(null);unplayed.phase='action';unplayed.step='play-batch-draft';unplayed.activePlayerId='p1';
unplayed.players.p1.hand=[...unplayed.players.p1.attack];unplayed.players.p1.attack=[];
for(const id of unplayed.players.p1.hand){unplayed.cards[id].zone='hand';unplayed.cards[id].active=false;unplayed.cards[id].face='down'}
accepted=true;try{complete(unplayed)}catch{accepted=false}
probes.push({id:'base.mandatory-attack',kind:'canSkipPlayablePair',expected:false,actual:accepted});
const defeated=fixture(null);defeated.phase='action';defeated.step='settlement';defeated.activePlayerId='p1';defeated.players.p2.defeated=true;
const combatStart=complete(defeated),combatAfterP1=complete(combatStart);
probes.push({id:'base.defeated-ability-window',kind:'combatWindowForDefeated',expected:'p2',actual:combatAfterP1.activePlayerId});
const ordinaryLoss=fixture(null);ordinaryLoss.players.p2.locationId='mountain';ordinaryLoss.board.locations.mountain.push('p2');resolveCombat(ordinaryLoss,'mountain',cards,events);
probes.push({id:'base.loss-is-not-defeat-status',kind:'ordinaryLoserDefeated',expected:false,actual:ordinaryLoss.players.p2.defeated});
console.log(JSON.stringify({probes,matching:probes.filter(p=>p.actual===p.expected).length,differing:probes.filter(p=>p.actual!==p.expected).length},null,2));
for (const probe of probes) assert.deepEqual(probe.actual, probe.expected, `${probe.id}: ${probe.kind}`);
