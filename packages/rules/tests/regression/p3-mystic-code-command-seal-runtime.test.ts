import {describe,expect,it} from 'vitest';
import * as rules from '../../src/index';
import {createSeededGameState} from '../../src/tools/seeded-state';

const root='master.fixture';
const codeId=root+'.skill.link';
const sealId=root+'.command-spell';
function ability(id:string,kind:string,activation:Record<string,unknown>,effects:any[]){
  return {id,kind,printedClause:id,activation,conditions:[],targets:[],effects,cost:[],
    creates:[],ruleModifiers:[],lifecycle:{},responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},
    limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}} as any;
}
function fixture(){
  const archive={schemaVersion:'fd-card-authoring-v1',id:root,name:'Fixture',cards:[{
    id:codeId,name:'Link Code',cardType:'master_skill',owner:{type:'master',id:root},
    printedText:'Seals for movement/payment only',cardFace:{typeLabel:'技能',attributes:[],cost:0,basePower:0},
    playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],
    verification:{implementationStatus:'complete'},
    abilities:[ability('code-seal-restriction','passive',{trigger:'while_active'},
      [{type:'mystic_code_command_seal_limit'}])]
  }]};
  const loaded=rules.loadAuthoringJson(archive as any);
  expect(loaded.report).toEqual([]);
  const commandSpell={
    id:sealId,name:'Command Spell',cardType:'command_spell',cardFace:{cost:0,basePower:0},
    playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],mode:'automatic',
    abilities:[
      ability('command-spell.gain-mana','phase_action',{phase:'action',opens:'controller_action_window'},
        [{type:'adjust_mana',amount:4},{type:'adjust_command_seals',amount:-1,directive:'spend_command_spell'}]),
      ability('command-spell.power-victory','phase_action',{phase:'action',opens:'controller_action_window'},
        [{type:'record_master_directive',directive:'gain_2_vp_if_win_this_round'},
         {type:'adjust_command_seals',amount:-1,directive:'spend_command_spell'}]),
      ability('command-spell.free-move','phase_action',{phase:'action',opens:'controller_action_window'},
        [{type:'record_master_directive',directive:'move_from_shinto_or_miyama_to_any_location_ignore_engagement'},
         {type:'adjust_command_seals',amount:-1,directive:'spend_command_spell'}])
    ]
  };
  (loaded.cards as any)[sealId]=commandSpell;
  const state=createSeededGameState({activeSeats:[1,2]});
  state.cards=[];state.round.activePhase='action';state.round.prioritySeat=1;
  state.players[0]!.masterCardId=root; state.players[0]!.locationId='miyama_town';
  rules.initializeAbilityRuntime(state,loaded,{seed:1424});
  for(const [instanceId,definitionId] of [['code',codeId],['seal',sealId]]){
    state.cards.push({instanceId,definitionId,ownerPlayerId:'p1',controllerPlayerId:'p1',
      zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}} as any);
    state.abilityRuntime!.cardState[instanceId]={active:false,faceDown:false,playedRound:state.round.roundNumber};
  }
  return state;
}
describe('Mystic Code Link Command Seal limitation',()=>{
  it('blocks power/victory seals at both legal-action discovery and execution',()=>{
    const state=fixture();
    const legal=rules.getLegalActions(state,'p1').filter((a:any)=>a.type==='activate_ability' && a.cardInstanceId==='seal');
    expect(legal.map((a:any)=>a.abilityId)).not.toContain('command-spell.power-victory');
    expect(legal.map((a:any)=>a.abilityId)).toContain('command-spell.gain-mana');
    expect(()=>rules.executeAbility(state,{sourceCardId:'seal',abilityId:'command-spell.power-victory',
      controllerId:'p1',selections:{},variables:{}} as any)).toThrow('Active Mystic Code forbids');
  });
  it('restores normal seal choices after the code physically leaves Skill',()=>{
    const state=fixture();
    state.cards.find(c=>c.instanceId==='code')!.zone='removed_from_game';
    const legal=rules.getLegalActions(state,'p1').filter((a:any)=>a.type==='activate_ability' && a.cardInstanceId==='seal');
    expect(legal.map((a:any)=>a.abilityId)).toContain('command-spell.power-victory');
  });
  it('rejects compound allowed operations that would spend one Seal twice over',()=>{
    for(const injected of [
      {type:'adjust_mana',amount:4},
      {type:'record_master_directive',directive:'move_from_shinto_or_miyama_to_any_location_ignore_engagement'},
      {type:'adjust_command_seals',amount:-1,directive:'spend_command_spell'},
    ]){
      const state=fixture();
      const seal=(state.abilityRuntime!.pack.cards[sealId] as any);
      seal.abilities.find((a:any)=>a.id==='command-spell.gain-mana').effects.push(injected);
      const legal=rules.getLegalActions(state,'p1').filter((a:any)=>
        a.type==='activate_ability' && a.cardInstanceId==='seal');
      expect(legal.map((a:any)=>a.abilityId)).not.toContain('command-spell.gain-mana');
      expect(()=>rules.executeAbility(state,{sourceCardId:'seal',abilityId:'command-spell.gain-mana',
        controllerId:'p1',selections:{},variables:{}} as any)).toThrow('Active Mystic Code forbids');
    }
  });
});