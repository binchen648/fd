import {describe,expect,it} from 'vitest';
import * as rules from '../../src/index';
import {createSeededGameState} from '../../src/tools/seeded-state';

/** Zero-credit capability handshake: a single synthetic authoring package with
 * all SIX Hakuno-F skill families. This is not the canonical owner consumer. */
const root='master.fixture-hakuno-f-complete-readiness';
const ids={
  ascension:root+'.skill.ascension',
  s1:root+'.skill.s1',
  s2:root+'.skill.s2',
  s3:root+'.skill.s3',
  s4:root+'.skill.s4',
  s5:root+'.skill.s5',
};
const modeIds={link:ids.s2,ccc:ids.s3,extella:ids.s4,extra:ids.s5};
const attackId=root+'.attack.basic';
const handId=root+'.card.hand';
function ability(id:string,kind:string,activation:Record<string,unknown>,
                 effect:Record<string,unknown>,conditions:any[]=[]){
  return {id,kind,printedClause:id,activation,conditions,targets:[],cost:[],
    effects:[effect],creates:[],ruleModifiers:[],lifecycle:{},
    responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},
    limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}};
}
const passiveAppend=()=>ability('standard-additional','passive',{trigger:'while_active'},
  {type:'append_only_rule'});
function definition(id:string,abilities:unknown[],outside=false,type='master_skill'){
  return {id,name:id,cardType:type,owner:{type:'master',id:root},
    printedText:id,cardFace:{typeLabel:'技能',cost:0,basePower:0,attributes:[]},
    playTiming:{phase:'action',window:'controller_play_card_window'},
    playRequirements:[],verification:{implementationStatus:'complete'},
    ...(outside?{initialPlacement:'outside_game'}:{}),abilities};
}
function archive(){
  const regalia=ability('moon-cell-regalia','passive',{trigger:'while_active'},
    {type:'mystic_code_regalia',codeDefinitionIds:{
      extra:ids.s5,ccc:ids.s3,extella:ids.s4,link:ids.s2,
    }});
  const dressChange=ability('dress-change','phase_action',
    {phase:'preparation',opens:'controller_action_window'},
    {type:'mystic_code_switch',definitionIds:[ids.s2,ids.s3,ids.s4,ids.s5]});
  return {
    id:root,name:'Hakuno-F six-family readiness proof',schemaVersion:'fd-card-authoring-v1',
    cards:[
      definition(ids.ascension,[regalia]),
      definition(ids.s1,[dressChange]),
      definition(ids.s2,[passiveAppend(),
        ability('seal-rule','passive',{trigger:'while_active'},
          {type:'mystic_code_command_seal_limit'}),
        ability('cc-moon-drive','phase_action',{phase:'action',opens:'controller_action_window'},
          {type:'grant_played_attacks_printed_mana_power',maximumBonus:3})],true),
      definition(ids.s3,[passiveAppend(),
        ability('data-leak','forced_trigger',{trigger:'after_controller_loses_battle'},
          {type:'mystic_code_battle_loss_vp',amount:-1}),
        ability('cc-hack','phase_action',{phase:'action',opens:'controller_action_window'},
          {type:'private_deck_top_choice',count:3})],true),
      definition(ids.s4,[passiveAppend(),
        ability('channeled-cast','forced_trigger',{trigger:'after_controller_enters_location'},
          {type:'mystic_code_expire_on_event',when:'after_controller_enters_location'}),
        ability('cc-recovery','phase_action',
          {phase:'combat',opens:'controller_combat_action_window',requiresSourceState:'active'},
          {type:'mystic_code_battle_recovery'})],true),
      definition(ids.s5,[passiveAppend(),
        ability('emergency-protocol','forced_trigger',{trigger:'after_controller_wins_battle'},
          {type:'mystic_code_expire_on_event',when:'after_controller_wins_battle'}),
        ability('cc-backdoor','forced_trigger',{trigger:'after_controller_enters_location'},
          {type:'mystic_code_recon_escape'},[{type:'event_player_is_opponent'}])],true),
      definition(attackId,[],false,'basic_attack'),
      definition(handId,[]),
    ],
  };
}
function fixture(){
  const loaded=rules.loadAuthoringJson(archive() as any);
  expect(loaded.report).toEqual([]);
  const state=createSeededGameState({activeSeats:[1,2]});
  state.cards=[];
  state.players[0]!.masterCardId=root;
  state.players[0]!.mana=20;
  state.round.activePhase='preparation';
  state.round.prioritySeat=1;
  rules.initializeAbilityRuntime(state,loaded,{seed:2819});
  for(const [id,defId,owner,zone] of [
    ['ascension',ids.ascension,'p1','skill'],['dress',ids.s1,'p1','skill'],
    ['link',ids.s2,'p1','skill'],['hand-1',handId,'p1','hand'],
    ['enemy-hand',handId,'p2','hand'],
  ] as const){
    state.cards.push({instanceId:id,definitionId:defId,
      ownerPlayerId:owner,controllerPlayerId:owner,zone,
      visibility:{scope:'owner_only',ownerPlayerId:owner}} as any);
    state.abilityRuntime!.cardState[id]={
      active:false,faceDown:false,playedRound:state.round.roundNumber};
  }
  return state;
}
describe('Hakuno-F six-frozen-skill readiness integrated capability',()=>{
  it('loads one coherent 6-family archive with exact outside-game four-Code roster',()=>{
    const loaded=rules.loadAuthoringJson(archive() as any);
    expect(loaded.report).toEqual([]);
    expect(Object.values(ids).every(id=>!!loaded.cards[id])).toBe(true);
    for(const id of [ids.s2,ids.s3,ids.s4,ids.s5]){
      expect((loaded.cards[id] as any).initialPlacement).toBe('outside_game');
      expect(loaded.cards[id]!.abilities.map(a=>a.id)).toContain('standard-additional');
    }
    expect(loaded.cards[ids.ascension]!.abilities[0]?.effects[0]).toEqual({
      type:'mystic_code_regalia',
      codeDefinitionIds:{extra:ids.s5,ccc:ids.s3,extella:ids.s4,link:ids.s2},
    });
  });
  it('rejects an invalid shape in any one skill without blessing the owner batch',()=>{
    const original=archive();
    const corrupted=structuredClone(original) as any;
    corrupted.cards.find((c:any)=>c.id===ids.s3).abilities
      .find((a:any)=>a.id==='data-leak').effects[0].amount=-2;
    const loaded=rules.loadAuthoringJson(corrupted);
    expect(loaded.report.some(item=>item.status==='unsupported')).toBe(true);
    const denied=structuredClone(original) as any;
    denied.cards.find((c:any)=>c.id===ids.s5).abilities
      .find((a:any)=>a.id==='cc-backdoor').conditions=[];
    expect(rules.loadAuthoringJson(denied).report.some(item=>item.status==='unsupported')).toBe(true);
  });
  it('switches a real Code and preserves other six-skill authority in one runtime pack',()=>{
    const state=fixture();
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'dress',abilityId:'dress-change',
    })).toMatchObject({ok:true});
    expect(state.cards.find(c=>c.instanceId==='hand-1')?.zone).toBe('discard');
    expect(state.cards.find(c=>c.instanceId==='enemy-hand')?.zone).toBe('hand');
    const d=state.abilityRuntime!.pendingDecision!;
    expect(d.interaction?.kind).toBe('mystic_code_switch_v1');
    const ccc=d.candidates.find(id=>state.cards.find(c=>c.instanceId===id)?.definitionId===ids.s3);
    expect(ccc).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:[ccc!],
    })).toMatchObject({ok:true});
    expect(state.cards.find(c=>c.instanceId==='link')?.zone).toBe('removed_from_game');
    expect(state.cards.find(c=>c.instanceId===ccc)?.zone).toBe('skill');
    expect(state.cards.filter(c=>[ids.s2,ids.s3,ids.s4,ids.s5].includes(c.definitionId) &&
      c.zone==='skill')).toHaveLength(1);
    expect(rules.isMysticCodePaidCopyStateValidForRestore(state)).toBe(true);
    expect(rules.isMysticCodeReconCapacityStateValidForRestore(state)).toBe(true);
    const session=rules.createMatchSession({
      humanPlayerId:'p1',humanPlayerIds:['p1','p2'],
      restorePackKind:'trusted_authoring_fixture',
    });
    session.state=state;
    session.logs=[];session.replay=[];session.replaySnapshots=[];session.battleHistory=[];
    const restored=rules.restoreMatchSession(
      JSON.parse(JSON.stringify(session.serializeSession())),
      {restorePackKind:'trusted_authoring_fixture'});
    expect(restored.state.cards.find(c=>c.instanceId===ccc)?.zone).toBe('skill');
    expect(restored.state.cards.find(c=>c.instanceId==='link')?.zone).toBe('removed_from_game');
  });
  it('runs the CCC action from the same six-skill package after a real dress change and attack play',()=>{
    const state=fixture();
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'dress',abilityId:'dress-change',
    })).toMatchObject({ok:true});
    const d=state.abilityRuntime!.pendingDecision!;
    const ccc=d.candidates.find(id=>state.cards.find(c=>c.instanceId===id)?.definitionId===ids.s3)!;
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:[ccc],
    })).toMatchObject({ok:true});
    state.round.activePhase='action';state.round.prioritySeat=1;
    state.players[0]!.locationId='miyama_town';
    state.players[1]!.locationId='miyama_town';
    for(const [instanceId,definitionId,owner,zone] of [
      ['normal',attackId,'p1','hand'],['enemy-deck',handId,'p2','deck'],
    ] as const){
      state.cards.push({instanceId,definitionId,ownerPlayerId:owner,controllerPlayerId:owner,
        zone,visibility:{scope:'owner_only',ownerPlayerId:owner}} as any);
      state.abilityRuntime!.cardState[instanceId]={active:false,faceDown:false,
        playedRound:state.round.roundNumber};
    }
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'stage_attack_card',cardInstanceId:ccc,
    }).ok).toBe(false);
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'stage_attack_card',cardInstanceId:'normal',
    })).toMatchObject({ok:true});
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'stage_attack_card',cardInstanceId:ccc,
    })).toMatchObject({ok:true});
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'confirm_staged_attack',
    })).toMatchObject({ok:true});
    expect(state.cards.find(c=>c.instanceId===ccc)?.zone).toBe('attack_area');
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:ccc,abilityId:'cc-hack',
    })).toMatchObject({ok:true});
    expect(state.abilityRuntime?.pendingDecision?.interaction?.kind).toBe('private_deck_top_choice_v1');
  });
});
