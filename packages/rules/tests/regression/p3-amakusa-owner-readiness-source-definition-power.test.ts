import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import { calculateCardPower, dispatchAbilityCommand, initializeAbilityRuntime, isDeferredAbilityRuntimeProvenanceValidForRestore, playAbilityCardBatch } from '../../src/ability/interpreter';
import { retireMasterAscensionSourceDefinitionPowerByTrigger } from '../../src/ability/master-ascension-event-power-capability';
import type { GameState } from '../../src/schema/game';

const ROOT='master.fixture-source-definition-power';
const SERVANT='servant.fixture-source-definition-power';
const ASC=`${ROOT}.skill.ascension`;
const UNLOCK=`${SERVANT}.skill.unlock`;
const TRIGGER=`${SERVANT}.skill.target`;
const OTHER_TRIGGER=`${SERVANT}.skill.other`;
const BASIC=`${SERVANT}.basic.one`;
const NON_BASIC=`${SERVANT}.attack.one`;
const UNLOCK_A='fixture.source-power.unlock';
const POWER_A='fixture.source-power.watch';

function base(id:string,kind='forced_trigger'){return {id,kind,printedClause:id,activation:{},conditions:[],targets:[],effects:[],cost:[],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}} as any;}
function archive(){
  const unlock=base(UNLOCK_A,'phase_action'); unlock.activation={phase:'action',opens:'controller_action_window'}; unlock.effects=[{type:'unlock_controller_master_ascension'}];
  const power=base(POWER_A); power.activation={trigger:'on_card_played',sourceDefinitionId:TRIGGER}; power.effects=[{type:'source_definition_basic_attack_power_bonus',amount:4,duration:'while_source_active'}];
  const card=(id:string,cardType:string,owner:any,abilities:any[],basePower=0,extra:any={})=>({id,name:id,cardType,owner,cardFace:{typeLabel:'fixture',attributes:['魔术'],cost:0,basePower},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities,verification:{implementationStatus:'complete'},...extra});
  return {schemaVersion:'fd-card-authoring-v1',archiveType:'master_skill_card_archive',id:ROOT,name:'Fixture source definition power',class:'Master',publicInformation:{type:'master_package',initialMana:4},cards:[
    card(UNLOCK,'servant_skill',{type:'servant',id:SERVANT},[unlock]),
    card(ASC,'master_skill',{type:'master',id:ROOT},[power],0,{initialPlacement:'outside_game'}),
    card(TRIGGER,'servant_skill',{type:'servant',id:SERVANT},[],1),
    card(OTHER_TRIGGER,'servant_skill',{type:'servant',id:SERVANT},[],1),
    card(BASIC,'basic_attack',{type:'servant',id:SERVANT},[],2),
    card(NON_BASIC,'servant_attack',{type:'servant',id:SERVANT},[],2),
  ]} as any;
}
function add(state:GameState,definitionId:string,owner='p1',zone:any='skill'){
  const instanceId=`${owner}:${definitionId}:${state.cards.length}`;
  state.cards.push({instanceId,definitionId,ownerPlayerId:owner,controllerPlayerId:owner,zone,visibility:zone==='attack_area'?{scope:'public'}:{scope:'owner_only',ownerPlayerId:owner}} as any);
  state.abilityRuntime!.cardState[instanceId]={active:zone==='attack_area',faceDown:false,playedRound:state.round.roundNumber};
  return instanceId;
}
function setup(){
  const pack=loadAuthoringJson(archive()); expect(pack.report.filter(x=>x.status==='unsupported')).toEqual([]);
  for(const def of Object.values(pack.cards))(def as any).ownerId=(def as any).cardType==='master_skill'?ROOT:SERVANT;
  const state=createSeededGameState({activeSeats:[1,2,3]}); state.cards=[]; state.players[0]!.masterCardId=ROOT; state.players[0]!.servantCardId=SERVANT;
  initializeAbilityRuntime(state,pack,{seed:20261001}); state.round.activePhase='action'; state.round.prioritySeat=state.players[0]!.seat; state.players[0]!.mana=20;
  const ids={unlock:add(state,UNLOCK),trigger:add(state,TRIGGER),otherTrigger:add(state,OTHER_TRIGGER),basic:add(state,BASIC,'p1','attack_area'),nonBasic:add(state,NON_BASIC,'p1','attack_area'),p2Basic:add(state,BASIC,'p2','attack_area')};
  expect(dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:ids.unlock,abilityId:UNLOCK_A}).ok).toBe(true);
  const asc=state.cards.find(c=>c.definitionId===ASC)!; expect(asc?.zone).toBe('skill');
  return {state,ids,asc};
}

describe('P3 Amakusa source-definition Power readiness follow-up',()=>{
  it('admits only the exact identity-free whole-ability shape and preserves the existing #515 gateway',()=>{
    const good=loadAuthoringJson(archive()); expect(good.report.filter(x=>x.status==='unsupported')).toEqual([]);
    const bad=archive(); (bad.cards[1].abilities[0].effects[0] as any).amount=5;
    const out=loadAuthoringJson(bad); expect(out.cards[ASC]!.abilities[0]!.execution.mode).toBe('unsupported');
    expect(out.report.some(x=>x.reason.includes('ascension event/seal'))).toBe(true);
  });
  it('binds authoritative on_card_played physical+definition provenance and grants exactly +4 only to controller basic attacks',()=>{
    const {state,ids}=setup(); expect(calculateCardPower(state,ids.basic).value).toBe(2);
    playAbilityCardBatch(state,'p1',[{cardInstanceId:ids.trigger}]);
    const record=state.abilityRuntime!.masterAscensionSourceDefinitionPowerByPlayer?.p1; expect(record?.sourceDefinitionId).toBe(TRIGGER); expect(record?.triggerCardInstanceId).toBe(ids.trigger); expect(record?.playCount).toBe(1);
    expect(calculateCardPower(state,ids.basic).value).toBe(6); expect(calculateCardPower(state,ids.nonBasic).value).toBe(2); expect(calculateCardPower(state,ids.p2Basic).value).toBe(2);
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
  });
  it('does not activate for a different played definition',()=>{
    const {state,ids}=setup(); playAbilityCardBatch(state,'p1',[{cardInstanceId:ids.otherTrigger}]);
    expect(state.abilityRuntime!.masterAscensionSourceDefinitionPowerByPlayer?.p1).toBeUndefined(); expect(calculateCardPower(state,ids.basic).value).toBe(2);
  });
  it('retires when the exact physical source closes and cannot revive from stale play provenance',()=>{
    const {state,ids}=setup(); playAbilityCardBatch(state,'p1',[{cardInstanceId:ids.trigger}]); expect(calculateCardPower(state,ids.basic).value).toBe(6);
    state.abilityRuntime!.cardState[ids.trigger]!.active=false; state.cards.find(c=>c.instanceId===ids.trigger)!.zone='skill'; retireMasterAscensionSourceDefinitionPowerByTrigger(state,ids.trigger);
    expect(state.abilityRuntime!.masterAscensionSourceDefinitionPowerByPlayer?.p1).toBeUndefined(); expect(calculateCardPower(state,ids.basic).value).toBe(2);
  });
  it('fails restore for play-count, trigger-controller, definition, and provider drift',()=>{
    const {state,ids,asc}=setup(); playAbilityCardBatch(state,'p1',[{cardInstanceId:ids.trigger}]); expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    const playCount=structuredClone(state); playCount.abilityRuntime!.cardPlayCountByInstance![ids.trigger]=2; expect(isDeferredAbilityRuntimeProvenanceValidForRestore(playCount)).toBe(false);
    const controller=structuredClone(state); controller.cards.find(c=>c.instanceId===ids.trigger)!.controllerPlayerId='p2'; expect(isDeferredAbilityRuntimeProvenanceValidForRestore(controller)).toBe(false);
    const definition=structuredClone(state); definition.cards.find(c=>c.instanceId===ids.trigger)!.definitionId=OTHER_TRIGGER; expect(isDeferredAbilityRuntimeProvenanceValidForRestore(definition)).toBe(false);
    const provider=structuredClone(state); provider.cards.find(c=>c.instanceId===asc.instanceId)!.generatedBy='forged'; expect(isDeferredAbilityRuntimeProvenanceValidForRestore(provider)).toBe(false);
  });
  it('contains no Amakusa, Shakespeare, printed-name, or legacy-handler production routing',()=>{
    const fs=require('node:fs'); const src=fs.readFileSync('packages/rules/src/ability/master-ascension-event-power-capability.ts','utf8');
    for(const needle of ['master.amakusa','servant.shakespeare','天草四郎','莎士比亚','开演之时已至','core.amakusa-'])expect(src).not.toContain(needle);
  });
});