import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadAuthoringJson } from '../../src/ability/loader';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { dispatchAbilityCommand, executeAbility, initializeAbilityRuntime, processAbilityEvent } from '../../src/ability/interpreter';

const ROOT='master.bazett';
const IDS=[
  'master.bazett.skill.ascension','master.bazett.skill.s1','master.bazett.skill.s1a','master.bazett.skill.s1b','master.bazett.skill.s1c',
  'master.bazett.skill.s1d','master.bazett.skill.s2','master.bazett.skill.s3','master.bazett.skill.s4','master.bazett.skill.s5',
];
const path='data/authoring/masters/master.bazett.json';
const raw=JSON.parse(readFileSync(path,'utf8'));
const loaded=loadAuthoringJson(raw);
const card=(id:string)=>loaded.cards[id]!;
const effectTypes=(id:string)=>card(id).abilities.flatMap((ability)=>ability.effects.map((effect)=>effect.type));
const PLAYED_PROBE='master.bazett.test.played-probe';
const PLAYED_PROBE_ABILITY='bazett.test.played-probe';

function actualBazettPlayedProbeState(){
  const withProbe=structuredClone(raw);
  withProbe.cards.push({
    id:PLAYED_PROBE,aliases:['test-played-probe'],legacyId:'test-played-probe',name:'Bazett played_this_round probe',cardType:'master_skill',
    owner:{type:'master',id:ROOT},printedText:'test-only provenance probe',cardFace:{typeLabel:'被动',attributes:[],cost:0,basePower:0},
    playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],
    abilities:[{
      id:PLAYED_PROBE_ABILITY,kind:'phase_action',printedClause:'test-only provenance probe',activation:{phase:'action',opens:'controller_action_window'},
      conditions:[],targets:[{id:'played-card',type:'card_instance',count:{min:1,max:1},scope:{zone:'attack_area',owner:'any',controller:'any'},constraints:[{type:'played_this_round'}]}],
      effects:[{type:'move_card',target:'played-card',to:{zone:'discard'}}],cost:[],creates:[],ruleModifiers:[],lifecycle:{},responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},limit:{},visibility:{},
      execution:{mode:'automatic',allowedOperations:[]},
    }],verification:{implementationStatus:'complete'},
  });
  const pack=loadAuthoringJson(withProbe);
  expect(pack.report.filter((entry)=>entry.status==='unsupported')).toEqual([]);
  const state=createSeededGameState({activeSeats:[1,2,3]}); state.cards=[];
  initializeAbilityRuntime(state,pack,{seed:20261005});
  const p1=state.players[0]!; p1.masterCardId=ROOT; p1.locationId='miyama_town'; p1.mana=20;
  const add=(definitionId:string,zone='skill',active=false)=>{
    const instanceId=`bazett-real:${definitionId}:${state.cards.length}`;
    state.cards.push({instanceId,definitionId,ownerPlayerId:'p1',controllerPlayerId:'p1',zone,visibility:['field','attack_area'].includes(zone)?{scope:'public'}:{scope:'owner_only',ownerPlayerId:'p1'}} as any);
    state.abilityRuntime!.cardState[instanceId]={active,faceDown:false,playedRound:state.round.roundNumber};
    return instanceId;
  };
  add('master.bazett.skill.s1a');
  const probe=add(PLAYED_PROBE);
  const currentRoundAttack=add('master.bazett.skill.s1b','attack_area',true);
  processAbilityEvent(state,{id:'bazett-real-game-start',type:'game_start',playerId:'p1'});
  processAbilityEvent(state,{id:'bazett-real-day2',type:'round_end',playerId:'p1'});
  processAbilityEvent(state,{id:'bazett-real-day3',type:'round_end',playerId:'p1'});
  const day3=state.cards.find((entry)=>entry.definitionId==='master.bazett.skill.s5'&&entry.ownerPlayerId==='p1')!;
  state.round.activePhase='action'; state.round.prioritySeat=p1.seat;
  executeAbility(state,{controllerId:'p1',sourceCardId:day3.instanceId,abilityId:'bazett.s5.join',variables:{},selections:{}});
  return {state,probe,currentRoundAttack,day3};
}

describe('P3 Bazett owner-complete migration',()=>{
  it('materializes exactly the frozen 10-identity owner scope with one historical preservation identity',()=>{
    expect(raw.id).toBe(ROOT); expect(raw.name).toBe('巴泽特·弗拉加·马克雷米兹'); expect(raw.publicInformation.initialMana).toBe(4);
    expect(raw.cards.map((entry:any)=>entry.id).sort()).toEqual([...IDS].sort());
    expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());
    expect(loaded.report.filter((entry)=>entry.status==='unsupported')).toEqual([]);
  });

  it('preserves the already-credited s1b clause and exact accepted game-start override',()=>{
    const s1b=raw.cards.find((entry:any)=>entry.id==='master.bazett.skill.s1b');
    expect(s1b.printedText).toBe('彷徨-你-2合计威力。');
    expect(s1b.abilities).toHaveLength(1);
    expect(s1b.abilities[0].effects).toEqual([{type:'install_rule_override',player:'controller',rule:'first_logical_day_total_power_adjustment',value:-2}]);
  });

  it('preserves frozen names and static Fragarach/Day3 metadata',()=>{
    expect(raw.cards.map((entry:any)=>[entry.id,entry.name])).toEqual([
      ['master.bazett.skill.s1','传承保菌者'],['master.bazett.skill.s1a','时间迷失'],['master.bazett.skill.s1b','第一天'],
      ['master.bazett.skill.s1c','第二天'],['master.bazett.skill.s1d','第四天'],['master.bazett.skill.s2','佛拉格拉克'],
      ['master.bazett.skill.s3','再启动'],['master.bazett.skill.s4','觉醒'],['master.bazett.skill.s5','第三天'],['master.bazett.skill.ascension','无懈可击'],
    ]);
    expect(card('master.bazett.skill.s2').cardFace).toMatchObject({attributes:['魔术'],cost:1,basePower:4});
    expect(card('master.bazett.skill.s2').playRequirements).toEqual([{type:'skill_zone_mana_at_least',value:8}]);
    expect(raw.cards.find((entry:any)=>entry.id==='master.bazett.skill.s2').initialPlacement).toBe('outside_game');
    expect(card('master.bazett.skill.s5').cardFace).toMatchObject({attributes:['力量'],cost:0,basePower:5});
    expect(raw.cards.find((entry:any)=>entry.id==='master.bazett.skill.s5').initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry:any)=>entry.id==='master.bazett.skill.s4').initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry:any)=>entry.id==='master.bazett.skill.ascension').initialPlacement).toBe('outside_game');
  });

  it('consumes the accepted complete logical-day/countermeasure readiness shapes exactly',()=>{
    expect(effectTypes('master.bazett.skill.s1')).toEqual(['provision_skill_cards']);
    expect(effectTypes('master.bazett.skill.s1a')).toEqual(['logical_day_cycle_initialize','logical_day_cycle_advance','logical_day_cycle_schedule_reset','adjust_victory_points']);
    expect(effectTypes('master.bazett.skill.s1c')).toEqual(['logical_day_definition_play_override','adjust_victory_points']);
    expect(effectTypes('master.bazett.skill.s1d')).toEqual(['logical_day_cycle_awaken']);
    expect(effectTypes('master.bazett.skill.s2')).toEqual(['arm_next_opponent_attribute_use_defeat']);
    expect(effectTypes('master.bazett.skill.s3')).toEqual(['logical_day_cycle_resolve_reset']);
    expect(effectTypes('master.bazett.skill.s4')).toEqual(['restore_command_seals_return_definition_to_skill']);
    expect(effectTypes('master.bazett.skill.s5')).toEqual(['join_source_skill_card_to_attack_zero_cost','adjust_victory_points']);
    expect(effectTypes('master.bazett.skill.ascension')).toEqual(['source_bound_definition_persistence_override']);
  });

  it('wires exact cycle stages, reset, Awake, and Day3 authority without per-card identity routing',()=>{
    const s1a=card('master.bazett.skill.s1a');
    expect(s1a.abilities[0]!.effects[0]).toEqual({type:'logical_day_cycle_initialize',cycleKey:'bazett.lost-in-time',initialDay:1,maxDay:4,stageDefinitionId:'master.bazett.skill.s5',stageDay:3,awakenDefinitionId:'master.bazett.skill.s4'});
    expect(s1a.abilities[1]!.effects[0]).toEqual({type:'logical_day_cycle_advance',cycleKey:'bazett.lost-in-time'});
    expect(s1a.abilities[2]!.effects[0]).toEqual({type:'logical_day_cycle_schedule_reset',cycleKey:'bazett.lost-in-time'});
    expect(card('master.bazett.skill.s3').abilities[0]!.effects[0]).toEqual({type:'logical_day_cycle_resolve_reset',cycleKey:'bazett.lost-in-time',rewardVp:1,closeDefinitionId:'master.bazett.skill.s2'});
    expect(card('master.bazett.skill.s1d').abilities[0]!.effects[0]).toEqual({type:'logical_day_cycle_awaken',cycleKey:'bazett.lost-in-time',day:4});
    expect(card('master.bazett.skill.s4').abilities[0]!.effects[0]).toEqual({type:'restore_command_seals_return_definition_to_skill',cycleKey:'bazett.lost-in-time',definitionId:'master.bazett.skill.s2',commandSeals:3});
    expect(card('master.bazett.skill.s5').abilities[0]!.effects[0]).toEqual({type:'join_source_skill_card_to_attack_zero_cost',cycleKey:'bazett.lost-in-time',day:3});
  });

  it('wires exact Fragarach Day2/Ascension/next-use semantics and per-game authority',()=>{
    expect(card('master.bazett.skill.s1').abilities[0]!.effects[0]).toEqual({type:'provision_skill_cards',player:'controller',targetDefinitionIds:['master.bazett.skill.s2']});
    expect(card('master.bazett.skill.s1c').abilities[0]!.effects[0]).toEqual({type:'logical_day_definition_play_override',cycleKey:'bazett.lost-in-time',day:2,targetDefinitionId:'master.bazett.skill.s2',requirementType:'skill_zone_mana_at_least',requirementValue:8,ignorePerGamePlayLimit:true});
    const counter=card('master.bazett.skill.s2');
    expect(counter.abilities[0]!.conditions).toEqual([{type:'source_active'},{type:'event_source_card_is_source'}]);
    expect(counter.abilities[0]!.effects[0]).toEqual({type:'arm_next_opponent_attribute_use_defeat',attribute:'宝具',requireSameLocation:true});
    expect(counter.abilities[1]!.limit).toEqual({type:'per_game',scope:'this_card',uses:1});
    expect(card('master.bazett.skill.ascension').abilities[0]!.effects[0]).toEqual({type:'source_bound_definition_persistence_override',targetDefinitionId:'master.bazett.skill.s2',ignorePerGamePlayLimit:true,grantResidual:true});
  });

  it('wires exact VP clauses including the climax penalty and day-specific rewards',()=>{
    const s1a=card('master.bazett.skill.s1a').abilities[3]!;
    expect(s1a.conditions).toEqual([{type:'round_is_climax'},{type:'logical_cycle_awake_is',cycleKey:'bazett.lost-in-time',expected:false}]);
    expect(s1a.effects[0]).toEqual({type:'adjust_victory_points',amount:-5});
    const day2=card('master.bazett.skill.s1c').abilities[1]!;
    expect(day2.conditions).toEqual([{type:'logical_day_is',cycleKey:'bazett.lost-in-time',day:2}]); expect(day2.effects[0]).toEqual({type:'adjust_victory_points',amount:2});
    const day3=card('master.bazett.skill.s5').abilities[1]!;
    expect(day3.conditions).toEqual([{type:'logical_day_is',cycleKey:'bazett.lost-in-time',day:3}]); expect(day3.effects[0]).toEqual({type:'adjust_victory_points',amount:3});
  });

  it('keeps the real Bazett Day3 join out of generic played_this_round consumers',()=>{
    const {state,probe,currentRoundAttack,day3}=actualBazettPlayedProbeState();
    expect(day3.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[day3.instanceId]).toMatchObject({active:true,faceDown:false,paidManaOnPlay:0});
    expect(state.abilityRuntime!.cardState[day3.instanceId]!.playedRound).not.toBe(state.round.roundNumber);
    expect(state.abilityRuntime!.cardState[currentRoundAttack]!.playedRound).toBe(state.round.roundNumber);

    const buggy=structuredClone(state);
    buggy.abilityRuntime!.cardState[day3.instanceId]!.playedRound=buggy.round.roundNumber;
    expect(dispatchAbilityCommand(buggy,'p1',{type:'activate_ability',cardInstanceId:probe,abilityId:PLAYED_PROBE_ABILITY}).ok).toBe(true);
    expect(buggy.abilityRuntime!.pendingDecision!.candidates).toContain(day3.instanceId);

    expect(dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:probe,abilityId:PLAYED_PROBE_ABILITY}).ok).toBe(true);
    const pending=state.abilityRuntime!.pendingDecision!;
    expect(pending.candidates).toContain(currentRoundAttack);
    expect(pending.candidates).not.toContain(day3.instanceId);
  });

  it('integrates Bazett exactly once in the canonical playtest master sequence',()=>{
    const pack=JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json','utf8'));
    expect(pack.authoringMasterFiles.filter((entry:string)=>entry===path)).toHaveLength(1);
  });

  it('adds no Bazett identity routing to production runtime source',()=>{
    const files=['packages/rules/src/ability/logical-day-countermeasure-capability.ts','packages/rules/src/ability/interpreter.ts','packages/rules/src/ability/loader.ts'];
    const production=files.map((file)=>readFileSync(file,'utf8')).join('\n');
    for(const needle of ['master.bazett','巴泽特','佛拉格拉克','时间迷失','core.bazett-']) expect(production).not.toContain(needle);
  });
});