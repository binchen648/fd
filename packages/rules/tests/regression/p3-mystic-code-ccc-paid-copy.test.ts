import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

/** Covers authenticated CCC deck choice -> discard -> reorder -> paid copy.
 * Each executed run must be evidenced separately.
 */
const root='master.fixture-ccc-copy';
const names={
  extra:root+'.skill.extra',
  ccc:root+'.skill.ccc',
  extella:root+'.skill.extella',
  link:root+'.skill.link',
};
function ability(id:string,kind:string,activation:Record<string,unknown>,effects:any[]) {
  return {
    id,kind,printedClause:id,activation,conditions:[],targets:[],effects,cost:[],
    creates:[],ruleModifiers:[],lifecycle:{},
    responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},
    limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]},
  };
}
function cardDefinition(id:string,abilities:any[]=[],outside=false) {
  return {
    id,name:id,cardType:'master_skill',owner:{type:'master',id:root},
    printedText:id,cardFace:{typeLabel:'技能',cost:0,basePower:0,attributes:[]},
    playTiming:{phase:'action',window:'controller_play_card_window'},
    playRequirements:[],verification:{implementationStatus:'complete'},
    ...(outside?{initialPlacement:'outside_game'}:{}),abilities,
  };
}
function setup(originalPrintedCost=0, withBattleLossPenalty=false) {
  const archive={
    schemaVersion:'fd-card-authoring-v1',id:root,name:'CCC temporary copy fixture',
    cards:[
      cardDefinition(root+'.skill.ascension',[
        ability('regalia','passive',{trigger:'while_active'},
          [{type:'mystic_code_regalia',codeDefinitionIds:names}])
      ]),
      ...Object.entries(names).map(([mode,id])=>cardDefinition(
        id,mode==='ccc'?[
          ability('cc-hack','phase_action',
            {phase:'action',opens:'controller_action_window'},
            [{type:'private_deck_top_choice',count:3}]),
          ...(withBattleLossPenalty?[ability('ccc-loss-vp','forced_trigger',
            {trigger:'after_controller_loses_battle'},
            [{type:'mystic_code_battle_loss_vp',amount:-1}])]:[]),
        ]:[],true)),
    ],
  };
  const loaded=rules.loadAuthoringJson(archive as any);
  expect(loaded.report).toEqual([]);
  // The paid-copy effect must use the selected physical card's printed cost.
  (loaded.cards[names.extra]!.cardFace as { cost: number }).cost=originalPrintedCost;
  const state=createSeededGameState({activeSeats:[1,2]});
  state.cards=[];state.round.activePhase='action';state.round.prioritySeat=1;
  state.players[0]!.masterCardId=root;
  state.players[0]!.mana=10;
  state.players[0]!.locationId='miyama_town';
  state.players[1]!.locationId='miyama_town';
  rules.initializeAbilityRuntime(state,loaded,{seed:144});
  for(const [instanceId,definitionId,owner,zone,active] of [
    ['regalia',root+'.skill.ascension','p1','skill',false],
    ['code',names.ccc,'p1','attack_area',true],
    ['a',names.extra,'p2','deck',false],
    ['b',names.link,'p2','deck',false],
    ['c',names.extella,'p2','deck',false],
  ] as const){
    state.cards.push({instanceId,definitionId,ownerPlayerId:owner,controllerPlayerId:owner,
      zone,visibility:zone==='deck'?{scope:'owner_only',ownerPlayerId:owner}:{scope:'public'}} as any);
    state.abilityRuntime!.cardState[instanceId]={
      active,faceDown:false,playedRound:state.round.roundNumber};
  }
  return state;
}
describe('CCC source-bound private paid copy',()=>{
  it('charges one VP only for a trusted battle loss, never a forged loss or actual victory',()=>{
    const lost=setup(0,true);
    lost.players[0]!.vp=3;
    const spoof={sourceCardId:'code',abilityId:'ccc-loss-vp',controllerId:'p1',
      selections:{},variables:{},event:{
        id:'forged-loss',type:'after_controller_loses_battle',playerId:'p1',
      }} as any;
    expect(()=>rules.executeAbility(lost,spoof)).toThrow();
    expect(lost.players[0]!.vp).toBe(3);
    const makeResult=(state:ReturnType<typeof setup>,id:string,winner:string,loser:string)=>
      rules.processAbilityEvent(state,{
        id,type:'after_battle_result_determined',
        battlePhaseResolutionId:'ccc-phase-'+id,battleId:'ccc-battle-'+id,resultId:id,
        battlefieldId:'miyama_town',battleParticipantIds:['p1','p2'],
        battleParticipantPowers:{p1:winner==='p1'?6:2,p2:winner==='p2'?6:2},
        battleResult:{winners:[winner],loserIds:[loser]},
      });
    makeResult(lost,'ccc-trusted-loss','p2','p1');
    expect(lost.players[0]!.vp).toBe(2);
    makeResult(lost,'ccc-trusted-loss','p2','p1');
    expect(lost.players[0]!.vp).toBe(2);
    const won=setup(0,true);
    won.players[0]!.vp=3;
    makeResult(won,'ccc-trusted-win','p1','p2');
    expect(won.players[0]!.vp).toBe(3);
  });
  it('offers only this action discarded physical IDs, and generates a paid round copy',()=>{
    const state=setup(2);
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'code',abilityId:'cc-hack',
    }).ok).toBe(true);
    let d=state.abilityRuntime!.pendingDecision!;
    expect(d.interaction?.kind).toBe('private_deck_top_choice_v1');
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:['p2'],
    })).toMatchObject({ok:true});
    d=state.abilityRuntime!.pendingDecision!;
    expect(d.candidates).toEqual(['a','b','c']);
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:['a'],
    })).toMatchObject({ok:true});
    d=state.abilityRuntime!.pendingDecision!;
    expect(d.candidates).toEqual(['b','c']);
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:['c','b'],
    })).toMatchObject({ok:true});
    d=state.abilityRuntime!.pendingDecision!;
    expect(d.interaction?.kind).toBe('private_deck_top_choice_v1');
    expect(d.interaction).toMatchObject({
      kind:'private_deck_top_choice_v1',stage:'copy',discardedIds:['a'],
    });
    // The previous reorder stage's keptCardIds is not in the exact restore
    // schema of the new paid-copy lease.
    expect('keptCardIds' in (d.interaction ?? {})).toBe(false);
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,d)).toBe(true);
    const session=rules.createMatchSession({
      humanPlayerId:'p1',humanPlayerIds:['p1','p2'],
      restorePackKind:'trusted_authoring_fixture',
    });
    session.state=state;
    session.logs=[];session.replay=[];session.replaySnapshots=[];session.battleHistory=[];
    const serialized=JSON.parse(JSON.stringify(session.serializeSession()));
    const restored=rules.restoreMatchSession(serialized,{restorePackKind:'trusted_authoring_fixture'});
    expect(restored.state.abilityRuntime?.pendingDecision?.interaction?.stage).toBe('copy');
    expect(restored.getClientProjection('p2').view.pendingDecision).toBeUndefined();
    expect(restored.getClientProjection('p1').view.pendingDecision?.candidates).toEqual(['__fd_decline_ccc_copy__','a']);
    expect(d.candidates).toEqual(['__fd_decline_ccc_copy__','a']);
    const manaBeforeCopy=state.players[0]!.mana;
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:['a'],
    })).toMatchObject({ok:true});
    const created=state.cards.find(c=>c.generatedBy==='code' && c.ownerPlayerId==='p1');
    expect(created).toBeDefined();
    expect(created?.zone).toBe('attack_area');
    expect(state.players[0]!.mana).toBe(manaBeforeCopy-2);
    expect(state.abilityRuntime!.cardState[created!.instanceId]?.mysticCodePaidCopy).toMatchObject({
      originalInstanceId:'a',originalDefinitionId:names.extra,
    });
    expect(rules.isMysticCodePaidCopyStateValidForRestore(state)).toBe(true);
    const paidSession=rules.createMatchSession({
      humanPlayerId:'p1',humanPlayerIds:['p1','p2'],
      restorePackKind:'trusted_authoring_fixture',
    });
    paidSession.state=state;
    paidSession.logs=[];paidSession.replay=[];paidSession.replaySnapshots=[];paidSession.battleHistory=[];
    const paidSnapshot=JSON.parse(JSON.stringify(paidSession.serializeSession()));
    const paidRestored=rules.restoreMatchSession(paidSnapshot,{
      restorePackKind:'trusted_authoring_fixture',
    });
    expect(paidRestored.state.cards.find(c=>c.instanceId===created!.instanceId)?.zone).toBe('attack_area');
    expect(rules.isMysticCodePaidCopyStateValidForRestore(paidRestored.state)).toBe(true);
    const departedSource=structuredClone(state);
    departedSource.cards.find(c=>c.instanceId==='code')!.zone='removed_from_game';
    expect(rules.isMysticCodePaidCopyStateValidForRestore(departedSource)).toBe(true);
    const tampered=structuredClone(state);
    tampered.cards.find(c=>c.instanceId===created!.instanceId)!.generatedBy='forged-source';
    expect(rules.isMysticCodePaidCopyStateValidForRestore(tampered)).toBe(false);
    const wrongCapability=structuredClone(state);
    wrongCapability.cards.find(c=>c.instanceId===created!.instanceId)!.generatedBy='regalia';
    wrongCapability.abilityRuntime!.cardState[created!.instanceId]!.mysticCodePaidCopy!.sourceCardId='regalia';
    // The original, owner-held Regalia exists; it is NOT the CCC top-deck
    // authoring ability that could legally generate a temporary paid copy.
    expect(rules.isMysticCodePaidCopyStateValidForRestore(wrongCapability)).toBe(false);
    rules.processAbilityEvent(state,{id:'ccc-copy-round-end',type:'round_end'});
    expect(state.cards.find(c=>c.instanceId===created!.instanceId)?.zone).toBe('removed_from_game');
    expect(rules.isMysticCodePaidCopyStateValidForRestore(state)).toBe(true);
  });
  it('keeps the paid-copy decision intact when mana is insufficient and permits explicit decline',()=>{
    const state=setup(2);
    state.players[0]!.mana=1;
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'code',abilityId:'cc-hack',
    })).toMatchObject({ok:true});
    let d=state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:['p2'],
    })).toMatchObject({ok:true});
    d=state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:['a'],
    })).toMatchObject({ok:true});
    d=state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:['b','c'],
    })).toMatchObject({ok:true});
    d=state.abilityRuntime!.pendingDecision!;
    expect(d.interaction?.stage).toBe('copy');
    const before=state.cards.map(c=>c.instanceId);
    const beforeMana=state.players[0]!.mana;
    const rejected=rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:['a'],
    });
    expect(rejected.ok).toBe(false);
    expect(state.cards.map(c=>c.instanceId)).toEqual(before);
    expect(state.players[0]!.mana).toBe(beforeMana);
    expect(state.abilityRuntime?.pendingDecision?.id).toBe(d.id);
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:['__fd_decline_ccc_copy__'],
    })).toMatchObject({ok:true});
    expect(state.abilityRuntime?.pendingDecision).toBeUndefined();
    expect(state.cards.find(c=>c.instanceId==='a')?.zone).toBe('discard');
  });
  it('refuses a paid copy after its acquired ascension disappears, without partial payment',()=>{
    const state=setup(2);
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'code',abilityId:'cc-hack',
    })).toMatchObject({ok:true});
    let decision=state.abilityRuntime!.pendingDecision!;
    for(const selectedIds of [['p2'],['a'],['b','c']]){
      expect(rules.dispatchAbilityCommand(state,'p1',{
        type:'choose_target',decisionId:decision.id,selectedIds,
      })).toMatchObject({ok:true});
      decision=state.abilityRuntime!.pendingDecision!;
    }
    expect(decision.interaction?.stage).toBe('copy');
    state.cards.find(c=>c.instanceId==='regalia')!.zone='removed_from_game';
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,decision)).toBe(false);
    const money=state.players[0]!.mana;
    const physicalCount=state.cards.length;
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:decision.id,selectedIds:['a'],
    }).ok).toBe(false);
    expect(state.players[0]!.mana).toBe(money);
    expect(state.cards).toHaveLength(physicalCount);
    expect(state.abilityRuntime?.pendingDecision?.id).toBe(decision.id);
  });
});
