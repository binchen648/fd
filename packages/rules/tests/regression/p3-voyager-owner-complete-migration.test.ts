import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const OWNER='servant.voyager';
const SC1=`${OWNER}.skill.sc-voyager-1`;
const SC2=`${OWNER}.skill.sc-voyager-2`;
const SC3=`${OWNER}.skill.sc-voyager-3`;
const SC4=`${OWNER}.skill.sc-voyager-4`;
const OTHER='fixture.voyager.other';
function archive(){ return JSON.parse(readFileSync('data/authoring/servants/servant.voyager.json','utf8')); }
function loaded(){ return rules.loadAuthoringJson(archive()); }
function add(state:GameState, definitionId:string, owner:string, zone:string, active=false, generatedBy?:string){
  const instanceId=`${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({instanceId,definitionId,ownerPlayerId:owner,controllerPlayerId:owner,zone,
    visibility:['attack_area','field'].includes(zone)?{scope:'public'}:{scope:'owner_only',ownerPlayerId:owner}, ...(generatedBy?{generatedBy}:{})} as any);
  state.abilityRuntime!.cardState[instanceId]={active,faceDown:false,playedRound:state.round.roundNumber};
  return instanceId;
}
function setup(){
  const pack=loaded(); const state=createSeededGameState({activeSeats:[1,2,3]}); state.cards=[]; state.round.prioritySeat=1;
  state.players[0]!.servantCardId=OWNER; state.players.forEach((p)=>{p.mana=20;p.vp=5;});
  rules.initializeAbilityRuntime(state,pack,{seed:20260930});
  state.abilityRuntime!.pack.cards[OTHER]={id:OTHER,name:OTHER,cardType:'servant_attack',cardFace:{attributes:['力量'],cost:1,basePower:5},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],playKind:'attack',destinationZone:'attack_area',abilities:[],mode:'automatic'} as any;
  return state;
}
function activate(state:GameState, playerId:string, source:string, abilityId:string){
  const a=rules.getLegalActions(state,playerId).find((x)=>x.type==='activate_ability'&&x.cardInstanceId===source&&x.abilityId===abilityId);
  expect(a).toBeDefined(); const out=rules.dispatchAbilityCommand(state,playerId,a!); expect(out,JSON.stringify(out)).toMatchObject({ok:true});
}
function choose(state:GameState,playerId:string,selectedIds:string[]){
  const d=state.abilityRuntime!.pendingDecision!; expect(d).toBeDefined();
  const out=rules.dispatchAbilityCommand(state,playerId,{type:'choose_target',decisionId:d.id,selectedIds}); expect(out,JSON.stringify(out)).toMatchObject({ok:true});
}

describe('P3 Voyager owner-complete migration',()=>{
  it('loads exact frozen sc1+sc2+sc3 plus outside-game sc4 and exact 12-card deck',()=>{
    const raw=archive(); const pack=loaded(); expect(pack.report.filter((e)=>e.status==='unsupported')).toEqual([]);
    const skills=raw.cards.filter((c:any)=>c.cardType==='servant_skill'); expect(skills.map((c:any)=>c.id)).toEqual([SC1,SC2,SC3,SC4]);
    expect(skills.filter((c:any)=>c.initialPlacement!=='outside_game').map((c:any)=>c.id)).toEqual([SC1,SC2,SC3]);
    expect(raw.cards.find((c:any)=>c.id===SC4).initialPlacement).toBe('outside_game');
    expect(raw.deck).toEqual([{cardId:'card.cardq1'},{cardId:'card.cardq2',count:2},{cardId:'card.cardq3',count:3},{cardId:'card.carda2',count:2},{cardId:'card.carda3'},{cardId:'card.cardluck'},{cardId:'card.cardsurveil',count:2}]);
    for(const id of [SC1,SC2,SC3,SC4]) expect(pack.cards[id]!.playRequirements).toEqual([{type:'skill_zone_mana_at_least',value:8}]);
  });

  it('executes sc1 exact entering-player provisioning then private reveal +2 through accepted generic authority',()=>{
    const state=setup(); const s1=add(state,SC1,'p1','attack_area',true);
    rules.processAbilityEvent(state,{id:'voyager-formal-enter-recon',type:'after_controller_enters_location',playerId:'p2',previousLocationId:'shinto',locationId:'recon',movementKind:'normal'});
    const copies=state.cards.filter((c)=>c.ownerPlayerId==='p2'&&c.definitionId===SC4&&c.zone==='hand'); expect(copies).toHaveLength(2); expect(copies.every((c)=>c.generatedBy===s1)).toBe(true);
    state.round.activePhase='action'; const before=state.players[1]!.vp; activate(state,'p1',s1,'sc-voyager-1.hope-reveal');
    expect(state.abilityRuntime!.pendingDecision!.controllerId).toBe('p2'); choose(state,'p2',[copies[0]!.instanceId]); expect(state.players[1]!.vp).toBe(before+2);
  });

  it('executes sc2 bounded matching/face-down extra-play and combat matching-player attack suppression',()=>{
    const state=setup(); const s2=add(state,SC2,'p1','attack_area',true); const m1=add(state,SC4,'p1','hand',false,s2); const m2=add(state,SC4,'p1','hand',false,s2); const o1=add(state,OTHER,'p1','hand'); const o2=add(state,OTHER,'p1','hand');
    state.round.activePhase='action'; activate(state,'p1',s2,'sc-voyager-2.peace-action'); choose(state,'p1',[m1,m2]); choose(state,'p1',[o1,o2]);
    expect(state.cards.find((c)=>c.instanceId===m1)!.zone).toBe('attack_area'); expect(state.abilityRuntime!.cardState[o1]!.faceDown).toBe(true);
    state.round.activePhase='combat'; const p2match=add(state,SC4,'p2','hand',false,s2); const p2attack=add(state,OTHER,'p2','attack_area',true); expect(p2match).toBeTruthy(); expect(rules.calculateCardPower(state,p2attack).value).toBe(5);
    activate(state,'p1',s2,'sc-voyager-2.peace-combat'); expect(rules.calculateCardPower(state,p2attack).value).toBe(0);
  });

  it('executes sc3 opponent discard reveal, all-or-none free matching play, and conditional 2 VP transfer',()=>{
    const state=setup(); const s3=add(state,SC3,'p1','attack_area',true); const generator=add(state,SC1,'p1','skill'); const a=add(state,SC4,'p2','discard',false,generator); const b=add(state,SC4,'p2','discard',false,generator); add(state,OTHER,'p2','discard');
    state.round.activePhase='action'; const p1=state.players[0]!.vp,p2=state.players[1]!.vp; activate(state,'p1',s3,'sc-voyager-3.pale-blue-dot'); choose(state,'p1',['p2']); choose(state,'p1',['play_all']);
    expect(state.cards.find((c)=>c.instanceId===a)!.controllerPlayerId).toBe('p1'); expect(state.cards.find((c)=>c.instanceId===b)!.zone).toBe('attack_area'); expect(state.players[0]!.vp).toBe(p1+2); expect(state.players[1]!.vp).toBe(p2-2);
  });

  it('executes outside-game sc4 exact dual-recipient +6 provenance and returns to Voyager owner discard after battle',()=>{
    const state=setup(); const generator=add(state,SC1,'p1','skill'); const sc4=add(state,SC4,'p2','hand',false,generator); state.round.activePhase='action'; state.round.prioritySeat=2;
    expect(rules.playAbilityCardBatch(state,'p2',[{cardInstanceId:sc4}])).toBeUndefined();
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments).toEqual(expect.arrayContaining([
      expect.objectContaining({playerId:'p2',amount:6,sourceCardId:sc4,abilityId:'sc-voyager-4.outer-god-life-power'}),
      expect.objectContaining({playerId:'p1',amount:6,sourceCardId:sc4,abilityId:'sc-voyager-4.outer-god-life-power'}),
    ])); expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    rules.processAbilityEvent(state,{id:'voyager-formal-battle-end',type:'after_battle_ended',battleParticipantIds:['p1','p2']}); const physical=state.cards.find((c)=>c.instanceId===sc4)!;
    expect(physical.zone).toBe('discard'); expect(physical.ownerPlayerId).toBe('p1'); expect(physical.controllerPlayerId).toBe('p1'); expect(state.abilityRuntime!.cardState[sc4]!.generatedCardReturnAfterBattle).toBeUndefined();
  });

  it('integrates Voyager exactly once immediately after Vlad while production runtime stays identity-free',()=>{
    const manifest=JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json','utf8')); const entry='data/authoring/servants/servant.voyager.json'; expect(manifest.authoringServantFiles.filter((x:string)=>x===entry)).toHaveLength(1);
    const i=manifest.authoringServantFiles.indexOf('data/authoring/servants/servant.vlad.json'); expect(manifest.authoringServantFiles[i+1]).toBe(entry);
    const prod=['packages/rules/src/ability/interpreter.ts','packages/rules/src/ability/loader.ts','packages/rules/src/ability/matching-definition-card-capability.ts'].map((p)=>readFileSync(p,'utf8')).join('\n');
    for(const needle of ['servant.voyager','sc-voyager','讯息：希望','讯息：和平','遥远的蓝色星球啊','领域外生命','core.voyager-']) expect(prod).not.toContain(needle);
  });
});
