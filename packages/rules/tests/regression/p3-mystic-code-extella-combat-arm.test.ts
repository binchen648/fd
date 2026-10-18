import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

/** Executable recovery-arm regression: preserve separate per-run evidence.
 */
const master='master.fixture-extella-arm';
const codeId=master+'.skill.extella';
const attackId=master+'.card.attack';
const recovery={
  id:'cc-recovery',kind:'phase_action',printedClause:'Combat: if you lose regain half-up printed mana',
  activation:{phase:'combat',opens:'controller_combat_action_window',requiresSourceState:'active'},
  conditions:[],targets:[],effects:[{type:'mystic_code_battle_recovery'}],cost:[],
  creates:[],ruleModifiers:[],lifecycle:{},
  responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},
  limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]},
};
const expireOnMovement={
  id:'channeled-cast-expire',kind:'forced_trigger',
  printedClause:'When you move, remove this Mystic Code',
  activation:{trigger:'after_controller_enters_location'},
  conditions:[],targets:[],cost:[],
  effects:[{type:'mystic_code_expire_on_event',when:'after_controller_enters_location'}],
  creates:[],ruleModifiers:[],lifecycle:{},
  responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},
  limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]},
};
function fixture(includeMovementExpiry=false) {
  const archive={
    schemaVersion:'fd-card-authoring-v1',id:master,name:'Extella arm fixture',
    cards:[
      {id:codeId,name:'Extella',cardType:'master_skill',owner:{type:'master',id:master},
       printedText:'Combat recovery',cardFace:{typeLabel:'技能',cost:0,basePower:0,attributes:[]},
       playTiming:{phase:'action',window:'controller_play_card_window'},
       playRequirements:[],verification:{implementationStatus:'complete'},
       abilities:includeMovementExpiry?[recovery,expireOnMovement]:[recovery]},
      {id:attackId,name:'Attack',cardType:'basic_attack',owner:{type:'master',id:master},
       printedText:'Printed cost five',cardFace:{typeLabel:'攻击',cost:5,basePower:2,attributes:[]},
       playTiming:{phase:'action',window:'controller_play_card_window'},
       playRequirements:[],verification:{implementationStatus:'complete'},abilities:[]},
    ]};
  const loaded=rules.loadAuthoringJson(archive as any);
  expect(loaded.report).toEqual([]);
  const state=createSeededGameState({activeSeats:[1,2]});
  state.cards=[];state.round.activePhase='battle';
  state.players[0]!.masterCardId=master;
  state.players[0]!.locationId='miyama_town';
  rules.initializeAbilityRuntime(state,loaded,{seed:542});
  for(const [instanceId,definitionId] of [['code',codeId],['attack',attackId]]){
    state.cards.push({instanceId,definitionId,ownerPlayerId:'p1',controllerPlayerId:'p1',
      zone:'attack_area',visibility:{scope:'public'}} as any);
    state.abilityRuntime!.cardState[instanceId]={
      active:true,faceDown:false,playedRound:state.round.roundNumber};
  }
  return state;
}
describe('Extella combat-phase selection',()=>{
  it('retires its physical source after a genuine engine movement, not a stationary command',()=>{
    const state=fixture(true);
    state.round.activePhase='action';
    for(const id of ['miyama_town','shinto'])
      if(!state.locationConfig.enabledLocationIds.includes(id))
        state.locationConfig.enabledLocationIds.push(id);
    // movePlayer is a pure reducer; emit events against its returned state
    // using the actual movement receipt instead of inventing a transition.
    const still=rules.movePlayer(state,{
      playerId:'p1',to:'miyama_town',movementKind:'effect',
    });
    expect(still.moved).toBe(true);
    expect(still.nextState.players[0]?.locationId).toBe('miyama_town');
    const stationaryReceipt=still.nextState.log.at(-1)!.payload as {
      from:string;to:string;movementKind:'normal'|'effect';
    };
    const malformed=structuredClone(still.nextState);
    expect(()=>rules.processAbilityEvent(malformed,{
      id:'extella-stationary-receipt',type:'after_controller_enters_location',
      playerId:'p1',previousLocationId:stationaryReceipt.from,
      locationId:stationaryReceipt.to,movementKind:stationaryReceipt.movementKind,
    })).toThrow('Mystic Code expiration requires matched trusted owner event');
    expect(malformed.cards.find(c=>c.instanceId==='code')?.zone).toBe('attack_area');
    const actual=rules.movePlayer(still.nextState,{
      playerId:'p1',to:'shinto',movementKind:'effect',
    });
    expect(actual.moved).toBe(true);
    expect(actual.nextState.players[0]?.locationId).toBe('shinto');
    const receipt=actual.nextState.log.at(-1)!.payload as {
      from:string;to:string;movementKind:'normal'|'effect';
    };
    expect([receipt.from,receipt.to]).toEqual(['miyama_town','shinto']);
    rules.processAbilityEvent(actual.nextState,{
      id:'extella-real-movement-receipt',type:'after_controller_enters_location',
      playerId:'p1',previousLocationId:receipt.from,
      locationId:receipt.to,movementKind:receipt.movementKind,
    });
    expect(actual.nextState.cards.find(c=>c.instanceId==='code')?.zone).toBe('removed_from_game');
  });
  it('chooses an eligible printed attack before learning the battle result',()=>{
    const state=fixture();
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'code',abilityId:'cc-recovery',
    }).ok).toBe(true);
    const pending=state.abilityRuntime!.pendingDecision!;
    expect(pending.interaction?.kind).toBe('mystic_code_recovery_arm_v1');
    expect(pending.candidates).toContain('attack');
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,pending)).toBe(true);
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:pending.id,selectedIds:['attack'],
    })).toMatchObject({ok:true});
    expect(state.abilityRuntime!.mysticCodeRecoveryArms?.p1).toMatchObject({
      controllerId:'p1',attackInstanceId:'attack',printedCost:5,
      battlefieldId:'miyama_town',
    });
    expect(rules.isMysticCodeRecoveryArmsValidForRestore(state)).toBe(true);
    const tampered=structuredClone(state);
    (tampered.abilityRuntime!.mysticCodeRecoveryArms!.p1 as unknown as Record<string,unknown>).injected=true;
    expect(rules.isMysticCodeRecoveryArmsValidForRestore(tampered)).toBe(false);
  });
  it('grants ceil(printed cost / 2) only after a real loss and consumes its combat arm',()=>{
    const state=fixture();
    state.players[1]!.locationId='miyama_town';
    state.players[0]!.mana=2;
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'code',abilityId:'cc-recovery',
    })).toMatchObject({ok:true});
    const pending=state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:pending.id,selectedIds:['attack'],
    })).toMatchObject({ok:true});
    const before=state.players[0]!.mana;
    expect(state.abilityRuntime!.mysticCodeRecoveryArms?.p1?.printedCost).toBe(5);
    // Persist while the trusted combat arm is live, then resolve on restore.
    const session=rules.createMatchSession({
      humanPlayerId:'p1',humanPlayerIds:['p1','p2'],
      restorePackKind:'trusted_authoring_fixture',
    });
    session.state=state;
    session.logs=[];session.replay=[];session.replaySnapshots=[];session.battleHistory=[];
    const persisted=JSON.parse(JSON.stringify(session.serializeSession()));
    const restored=rules.restoreMatchSession(persisted,{
      restorePackKind:'trusted_authoring_fixture',
    });
    expect(restored.state.abilityRuntime?.mysticCodeRecoveryArms?.p1).toMatchObject({
      printedCost:5,battlefieldId:'miyama_town',
    });
    rules.processAbilityEvent(restored.state,{
      id:'extella-loss-result',type:'after_battle_result_determined',
      battlePhaseResolutionId:'extella-phase-1',
      battleId:'extella-battle-1',resultId:'extella-loss-result',
      battlefieldId:'miyama_town',battleParticipantIds:['p1','p2'],
      battleParticipantPowers:{p1:2,p2:6},
      battleResult:{winners:['p2'],loserIds:['p1']},
    });
    expect(restored.state.players[0]!.mana).toBe(before+3);
    expect(restored.state.abilityRuntime!.mysticCodeRecoveryArms?.p1).toBeUndefined();
    expect(rules.isMysticCodeRecoveryArmsValidForRestore(restored.state)).toBe(true);
  });
  it('consumes an armed selection after a real victory without granting loss-only mana',()=>{
    const state=fixture();
    state.players[1]!.locationId='miyama_town';
    state.players[0]!.mana=2;
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'code',abilityId:'cc-recovery',
    })).toMatchObject({ok:true});
    const pending=state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:pending.id,selectedIds:['attack'],
    })).toMatchObject({ok:true});
    const before=state.players[0]!.mana;
    rules.processAbilityEvent(state,{
      id:'extella-win-result',type:'after_battle_result_determined',
      battlePhaseResolutionId:'extella-phase-win',
      battleId:'extella-battle-win',resultId:'extella-win-result',
      battlefieldId:'miyama_town',battleParticipantIds:['p1','p2'],
      battleParticipantPowers:{p1:6,p2:2},
      battleResult:{winners:['p1'],loserIds:['p2']},
    });
    expect(state.players[0]!.mana).toBe(before);
    expect(state.abilityRuntime!.mysticCodeRecoveryArms?.p1).toBeUndefined();
  });
});
