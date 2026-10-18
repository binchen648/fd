import {describe,expect,it} from 'vitest';
import * as rules from '../../src/index';
import {canOccupyLocation} from '../../src/core/map-engine';
import {createSeededGameState} from '../../src/tools/seeded-state';

const root='master.fixture-recon';
const codeId=root+'.skill.extra';
function trigger(id:string,event:string,effect:Record<string,unknown>,conditions:any[]=[]){
  return {id,kind:'forced_trigger',printedClause:id,
    activation:{trigger:event},conditions,targets:[],effects:[effect],
    cost:[],creates:[],ruleModifiers:[],lifecycle:{},
    responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},
    limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}};
}
function setup(){
  const archive={schemaVersion:'fd-card-authoring-v1',id:root,name:'Fixture',cards:[{
    id:codeId,name:'Extra Code',cardType:'master_skill',owner:{type:'master',id:root},
    printedText:'Move to Recon, do not count against Recon occupancy',
    cardFace:{typeLabel:'技能',attributes:[],cost:0,basePower:0},
    playTiming:{phase:'action',window:'controller_play_card_window'},
    playRequirements:[],verification:{implementationStatus:'complete'},
    abilities:[
      trigger('recon','after_controller_enters_location',{type:'mystic_code_recon_escape'},[{type:'event_player_is_opponent'}]),
      trigger('expiry','after_controller_wins_battle',
        {type:'mystic_code_expire_on_event',when:'after_controller_wins_battle'})
    ]
  }]};
  const loaded=rules.loadAuthoringJson(archive as any);
  expect(loaded.report).toEqual([]);
  const state=createSeededGameState({activeSeats:[1,2]});state.cards=[];
  state.round.activePhase='action';
  state.players[0]!.masterCardId=root;
  state.players[0]!.locationId='miyama_town';
  state.players[1]!.locationId='miyama_town';
  for (const id of ['miyama_town','recon']) {
    if (!state.locationConfig.enabledLocationIds.includes(id)) state.locationConfig.enabledLocationIds.push(id);
  }
  rules.initializeAbilityRuntime(state,loaded,{seed:477});
  state.cards.push({instanceId:'code',definitionId:codeId,ownerPlayerId:'p1',controllerPlayerId:'p1',
    zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}} as any);
  state.abilityRuntime!.cardState.code={active:false,faceDown:false,playedRound:state.round.roundNumber};
  return state;
}
function sessionFor(state:ReturnType<typeof setup>){
  const session=rules.createMatchSession({humanPlayerId:'p1',humanPlayerIds:['p1','p2'],
    restorePackKind:'trusted_authoring_fixture'});
  session.state=state;session.logs=[];session.replay=[];session.replaySnapshots=[];session.battleHistory=[];
  return session;
}
describe('Extra Mystic Code private Recon escape and zero-occupancy rule',()=>{
  it('triggers on opponent entry, offers owner-only optional move, and exempts physical holder',()=>{
    const state=setup();
    expect(()=>rules.restoreMatchSession(JSON.parse(JSON.stringify(sessionFor(state).serializeSession())),{restorePackKind:'trusted_authoring_fixture'})).not.toThrow();
    rules.processAbilityEvent(state,{id:'opponent-arrives',type:'after_controller_enters_location',
      playerId:'p2',previousLocationId:'shinto',locationId:'miyama_town',movementKind:'normal'});
    const pending=state.abilityRuntime!.pendingDecision!;
    expect(pending.interaction?.kind).toBe('mystic_code_recon_escape_v1');
    expect(pending.candidates).toEqual(['stay','recon']);
    expect(rules.projectAbilityState(state,'p2').pendingDecision).toBeUndefined();
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,pending)).toBe(true);
    const saved=JSON.parse(JSON.stringify(sessionFor(state).serializeSession()));
    expect(saved.state.map.playerCount).toBe(saved.state.players.length);
    const withoutPending=structuredClone(saved);
    delete withoutPending.state.abilityRuntime.pendingDecision;
    // This snapshot no longer matches its deferred-state integrity authority;
    // deleting a pending decision is tampering, not a legitimate restore.
    expect(()=>rules.restoreMatchSession(withoutPending,{restorePackKind:'trusted_authoring_fixture'})).toThrow();
    expect(rules.restoreMatchSession(saved,{restorePackKind:'trusted_authoring_fixture'})
      .state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('mystic_code_recon_escape_v1');
    const move=rules.dispatchAbilityCommand(state,'p1',
      {type:'choose_target',decisionId:pending.id,selectedIds:['recon']});
    expect(move).toMatchObject({ok:true});
    expect(state.players[0]!.locationId).toBe('recon');
    expect(state.ruleOverrides?.reconCapacityExemptPlayerIds).toContain('p1');
    expect(canOccupyLocation({map:state.map,config:state.locationConfig,
      locationId:'recon',movingPlayerId:'p2',occupyingPlayerIds:['p1'],
      ruleOverrides:state.ruleOverrides})).toBe(true);
    expect(rules.restoreMatchSession(
      JSON.parse(JSON.stringify(sessionFor(state).serializeSession())),
      {restorePackKind:'trusted_authoring_fixture'}).state.ruleOverrides?.reconCapacityExemptPlayerIds).toContain('p1');
    // An arbitrary win-labelled event cannot remove the Code. The engine
    // must first record a trusted battle result and derive the owner win.
    expect(()=>rules.processAbilityEvent(state,{
      id:'untrusted-win',type:'after_controller_wins_battle',playerId:'p1'
    })).toThrow();
    state.players[0]!.locationId='miyama_town';
    rules.processAbilityEvent(state,{
      id:'recon-win-result',type:'after_battle_result_determined',
      battlePhaseResolutionId:'recon-battle-phase:1',battleId:'recon-battle-1',
      resultId:'recon-win-result',battlefieldId:'miyama_town',
      battleParticipantIds:['p1','p2'],battleParticipantPowers:{p1:8,p2:2},
      battleResult:{winners:['p1'],loserIds:['p2']}
    });
    expect(state.cards.find(c=>c.instanceId==='code')?.zone).toBe('removed_from_game');
    expect(state.ruleOverrides?.reconCapacityExemptPlayerIds).not.toContain('p1');
  });
  it('does not stage on its controller entering a battlefield',()=>{
    const state=setup();
    rules.processAbilityEvent(state,{id:'self-arrives',type:'after_controller_enters_location',
      playerId:'p1',previousLocationId:'shinto',locationId:'miyama_town',movementKind:'normal'});
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });
  it('rejects a forged Recon capacity authority when the source loses opponent-only semantics',()=>{
    const state=setup();
    rules.processAbilityEvent(state,{
      id:'recon-opponent-authorized',type:'after_controller_enters_location',
      playerId:'p2',previousLocationId:'shinto',
      locationId:'miyama_town',movementKind:'normal',
    });
    const decision=state.abilityRuntime!.pendingDecision!;
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,decision)).toBe(true);
    const corruptPending=structuredClone(state);
    const sourceAbility=corruptPending.abilityRuntime!.pack.cards[codeId]!.abilities.find(a=>a.id==='recon')!;
    sourceAbility.conditions=[];
    expect(rules.isCanonicalGenericPendingDecisionForRestore(corruptPending,corruptPending.abilityRuntime!.pendingDecision!)).toBe(false);
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:decision.id,selectedIds:['recon'],
    })).toMatchObject({ok:true});
    expect(rules.isMysticCodeReconCapacityStateValidForRestore(state)).toBe(true);
    const corruptCapacity=structuredClone(state);
    corruptCapacity.abilityRuntime!.pack.cards[codeId]!.abilities.find(a=>a.id==='recon')!.conditions=[];
    expect(rules.isMysticCodeReconCapacityStateValidForRestore(corruptCapacity)).toBe(false);
  });
});