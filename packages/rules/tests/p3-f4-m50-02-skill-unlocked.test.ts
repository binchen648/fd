import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const ARM='master.fixture.skill.arm';
const TARGET='master.fixture.skill.target';
const OTHER='master.fixture.skill.other';
const archive:any={schemaVersion:'fd-card-authoring-v1',archiveType:'master_skill_card_archive',id:'master.fixture',name:'fixture',class:'Master',cards:[
 {id:ARM,name:'arm',cardType:'master_skill',owner:{type:'master',id:'master.fixture'},cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[{id:'unlock-target',kind:'phase_action',printedClause:'fixture',markers:['m50_structured_v1'],activation:{phase:'action',opens:'controller_action_window'},conditions:[],targets:[],cost:[],effects:[{type:'activate_owned_skill_card',definitionId:TARGET}],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}},{id:'unlock-target-again',kind:'phase_action',printedClause:'fixture',markers:['m50_structured_v1'],activation:{phase:'action',opens:'controller_action_window'},conditions:[],targets:[],cost:[],effects:[{type:'activate_owned_skill_card',definitionId:TARGET}],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}}]},
 {id:TARGET,name:'target',cardType:'master_skill',owner:{type:'master',id:'master.fixture'},cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[{id:'on-unlock',kind:'forced_trigger',printedClause:'fixture',markers:['m50_structured_v1'],activation:{trigger:'m50_skill_unlocked'},conditions:[],targets:[],cost:[],effects:[{type:'gain_mana',target:'controller',amount:2}],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}}]},
 {id:OTHER,name:'other',cardType:'master_skill',owner:{type:'master',id:'master.fixture'},cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[{id:'other-on-unlock',kind:'forced_trigger',printedClause:'fixture',markers:['m50_structured_v1'],activation:{trigger:'m50_skill_unlocked'},conditions:[],targets:[],cost:[],effects:[{type:'gain_mana',target:'controller',amount:50}],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}}]}
]};

function setup(){
 const pack=rules.loadAuthoringJson(archive); expect(pack.report).toEqual([]);
 const state=createSeededGameState({activeSeats:[1,2]}); state.round.activePhase='action'; state.round.prioritySeat=state.players[0]!.seat;
 state.players[0]!.mana=1;
 state.cards=[
  {instanceId:'arm-i',definitionId:ARM,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}},
  {instanceId:'target-i',definitionId:TARGET,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}},
  {instanceId:'other-i',definitionId:OTHER,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}},
 ];
 rules.initializeAbilityRuntime(state,pack,{seed:20260924});
 state.abilityRuntime!.cardState['arm-i']={active:true,faceDown:false,playedRound:1};
 state.abilityRuntime!.cardState['target-i']={active:false,faceDown:false,playedRound:1};
 state.abilityRuntime!.cardState['other-i']={active:false,faceDown:false,playedRound:1};
 return state;
}

describe('P3 F4 M50-02 generic skill-unlocked trigger',()=>{
 it('fires exactly once on false->true and only for the unlocked physical skill',()=>{
  const state=setup();
  const first=rules.dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:'arm-i',abilityId:'unlock-target'}); expect(first.ok).toBe(true);
  expect(state.abilityRuntime!.cardState['target-i']!.active).toBe(true); expect(state.players[0]!.mana).toBe(3);
  const second=rules.dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:'arm-i',abilityId:'unlock-target-again'}); expect(second.ok).toBe(true);
  expect(state.players[0]!.mana).toBe(3);
 });
});
