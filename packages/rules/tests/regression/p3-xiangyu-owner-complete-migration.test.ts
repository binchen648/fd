import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const OWNER='servant.xiangyu';
const SC1=`${OWNER}.skill.sc-xiangyu-1`;
const SC2=`${OWNER}.skill.sc-xiangyu-2`;
const SC3=`${OWNER}.skill.sc-xiangyu-3`;
const ATTACK='fixture.xiangyu.attack';
function archive(){ return JSON.parse(readFileSync('data/authoring/servants/servant.xiangyu.json','utf8')); }
function loaded(){ return rules.loadAuthoringJson(archive()); }
function add(state:GameState, definitionId:string, owner='p1', zone='skill', active=false){
  const instanceId=`${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({instanceId,definitionId,ownerPlayerId:owner,controllerPlayerId:owner,zone,visibility:['attack_area','field'].includes(zone)?{scope:'public'}:{scope:'owner_only',ownerPlayerId:owner}} as any);
  state.abilityRuntime!.cardState[instanceId]={active,faceDown:false,playedRound:state.round.roundNumber};
  return instanceId;
}
function setup(){
  const pack=loaded(); const state=createSeededGameState({activeSeats:[1,2,3]}); state.cards=[]; state.round.prioritySeat=1;
  state.players[0]!.servantCardId=OWNER; state.players.forEach((p)=>{p.mana=20;p.vp=5;(p as any).commandSpells=3;});
  rules.initializeAbilityRuntime(state,pack,{seed:20260930});
  state.abilityRuntime!.pack.cards[ATTACK]={id:ATTACK,name:ATTACK,cardType:'servant_attack',cardFace:{attributes:['力量'],cost:2,basePower:4},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],playKind:'attack',destinationZone:'attack_area',abilities:[],mode:'automatic'} as any;
  return state;
}
function activate(state:GameState, source:string, abilityId:string, playerId='p1'){
  const a=rules.getLegalActions(state,playerId).find((x)=>x.type==='activate_ability'&&x.cardInstanceId===source&&x.abilityId===abilityId);
  expect(a).toBeDefined(); const out=rules.dispatchAbilityCommand(state,playerId,a!); expect(out,JSON.stringify(out)).toMatchObject({ok:true});
}

describe('P3 Xiang Yu owner-complete migration',()=>{
  it('loads exact frozen sc1+sc2+sc3 and exact 12-card deck',()=>{
    const raw=archive(); const pack=loaded(); expect(pack.report.filter((e)=>e.status==='unsupported')).toEqual([]);
    expect(raw.id).toBe(OWNER); expect(raw.class).toBe('Berserker'); expect(raw.cards.map((c:any)=>c.id)).toEqual([SC1,SC2,SC3]);
    expect(raw.cards.map((c:any)=>[c.cardFace.typeLabel,c.cardFace.cost,c.cardFace.basePower])).toEqual([['被动',0,0],['被动',0,0],['迅捷/宝具',6,7]]);
    expect(raw.deck).toEqual([{cardId:'card.cardb1'},{cardId:'card.cardb2'},{cardId:'card.cardb3'},{cardId:'card.cardb4'},{cardId:'card.cardb5',count:2},{cardId:'card.cardq1'},{cardId:'card.cardq2'},{cardId:'card.cardq5',count:2},{cardId:'card.cardluck'},{cardId:'card.cardsurveil'}]);
    for(const id of [SC1,SC2,SC3]) expect(pack.cards[id]!.playRequirements).toEqual([{type:'skill_zone_mana_at_least',value:8}]);
    expect(pack.cards[SC3]!.cardFace.attributes).toEqual(['迅捷','宝具']);
  });

  it('executes sc1 arm telemetry and exact battle-end ceil-half decay through accepted generic authority',()=>{
    const state=setup(); const s1=add(state,SC1); state.round.activePhase='action'; activate(state,s1,'sc-xiangyu-1.arm-matrix');
    state.round.prioritySeat=state.players.find((p)=>p.id==='p2')!.seat; const otherSkill=add(state,SC2,'p2','attack_area',true);
    rules.processAbilityEvent(state,{id:'xiangyu-formal-p2-skill',type:'on_card_played',playerId:'p2',sourceCardId:otherSkill,playedCards:[{instanceId:otherSkill,controllerId:'p2',cardType:'servant_skill',faceDown:false}]});
    expect(rules.reactionCounterValue(state,'p1','xiangyu.reaction')).toBe(1);
    rules.setReactionCounterValue(state,'p1','xiangyu.reaction',5); state.round.activePhase='combat';
    rules.processAbilityEvent(state,{id:'xiangyu-formal-battle-end',type:'after_battle_ended',battleParticipantIds:['p1','p2']});
    expect(rules.reactionCounterValue(state,'p1','xiangyu.reaction')).toBe(2);
  });

  it('executes repeatable sc2 reaction movement purchases and records movement distance',()=>{
    const state=setup(); const s2=add(state,SC2); state.round.activePhase='combat'; state.players[0]!.locationId='shinto'; rules.setReactionCounterValue(state,'p1','xiangyu.reaction',5);
    activate(state,s2,'sc-xiangyu-2.backward-one'); expect(state.players[0]!.locationId).toBe('miyama_town'); expect(rules.reactionCounterValue(state,'p1','xiangyu.reaction')).toBe(4);
    activate(state,s2,'sc-xiangyu-2.backward-one'); expect(state.players[0]!.locationId).toBe('magic_workshop'); expect(rules.reactionCounterValue(state,'p1','xiangyu.reaction')).toBe(3);
    activate(state,s2,'sc-xiangyu-2.forward-one'); expect(state.players[0]!.locationId).toBe('miyama_town'); expect(rules.reactionCounterValue(state,'p1','xiangyu.reaction')).toBe(1);
    expect(state.abilityRuntime!.movementDistanceThisRound.p1).toBe(3);
  });

  it('executes sc2 paid deck-top play and free hand play through ordinary play authority',()=>{
    const state=setup(); const s2=add(state,SC2); const top=add(state,ATTACK,'p1','deck'); const hand=add(state,ATTACK,'p1','hand'); state.round.activePhase='combat'; rules.setReactionCounterValue(state,'p1','xiangyu.reaction',11); const mana=state.players[0]!.mana;
    activate(state,s2,'sc-xiangyu-2.play-top'); expect(state.cards.find((c)=>c.instanceId===top)!.zone).toBe('attack_area'); expect(state.players[0]!.mana).toBe(mana-2); expect(rules.reactionCounterValue(state,'p1','xiangyu.reaction')).toBe(7);
    activate(state,s2,'sc-xiangyu-2.play-hand-free'); const d=state.abilityRuntime!.pendingDecision!; expect(d).toBeDefined(); const out=rules.dispatchAbilityCommand(state,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[hand]}); expect(out.ok).toBe(true);
    expect(state.cards.find((c)=>c.instanceId===hand)!.zone).toBe('attack_area'); expect(state.players[0]!.mana).toBe(mana-2); expect(rules.reactionCounterValue(state,'p1','xiangyu.reaction')).toBe(0);
  });

  it('executes sc3 1-mana to 2-reaction conversion and exact physical-source base-Power x2 after movement 3',()=>{
    const state=setup(); const s3=add(state,SC3); state.round.activePhase='action'; const mana=state.players[0]!.mana; activate(state,s3,'sc-xiangyu-3.gain-reaction'); expect(state.players[0]!.mana).toBe(mana-1); expect(rules.reactionCounterValue(state,'p1','xiangyu.reaction')).toBe(2);
    state.round.activePhase='combat'; const physical=state.cards.find((c)=>c.instanceId===s3)!; physical.zone='attack_area'; state.abilityRuntime!.cardState[s3]!.active=true; state.abilityRuntime!.movementDistanceThisRound.p1=3;
    expect(rules.calculateCardPower(state,s3).value).toBe(7); activate(state,s3,'sc-xiangyu-3.unstoppable-force'); expect(rules.calculateCardPower(state,s3).value).toBe(14); state.abilityRuntime!.cardState[s3]!.active=false; expect(rules.calculateCardPower(state,s3).value).toBe(7);
  });

  it('integrates Xiang Yu exactly once immediately after Voyager while production runtime remains identity-free',()=>{
    const manifest=JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json','utf8')); const entry='data/authoring/servants/servant.xiangyu.json'; expect(manifest.authoringServantFiles.filter((x:string)=>x===entry)).toHaveLength(1);
    const i=manifest.authoringServantFiles.indexOf('data/authoring/servants/servant.voyager.json'); expect(manifest.authoringServantFiles[i+1]).toBe(entry);
    const prod=['packages/rules/src/ability/interpreter.ts','packages/rules/src/ability/loader.ts','packages/rules/src/ability/reaction-counter-capability.ts'].map((x)=>readFileSync(x,'utf8')).join('\n');
    for(const needle of ['servant.xiangyu','sc-xiangyu','战术躯体','霸王之武','力拔山兮气盖世','core.xiangyu-']) expect(prod).not.toContain(needle);
  });
});