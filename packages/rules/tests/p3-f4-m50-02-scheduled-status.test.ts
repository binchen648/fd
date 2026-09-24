import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD='master.fixture.skill.scheduled-status';
const SOURCE='scheduled-status-source';

function archive(): any {
  return {
    schemaVersion:'fd-card-authoring-v1', archiveType:'master_skill_card_archive', id:'master.fixture', name:'fixture', class:'Master',
    cards:[{
      id:CARD, name:'fixture', cardType:'master_skill', owner:{type:'master',id:'master.fixture'},
      cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0}, playTiming:{phase:'action',window:'controller_play_card_window'}, playRequirements:[],
      abilities:[
        {
          id:'arm', kind:'phase_action', printedClause:'fixture', markers:['m50_structured_v1'],
          activation:{phase:'action',opens:'controller_action_window'}, conditions:[], targets:[], cost:[],
          effects:[{type:'choose_players',candidateTarget:'all_opponents',minCount:1,maxCount:1,payloadKey:'targetPlayerId',then:[
            {type:'schedule_effect',abilityId:'resolve',triggerEventType:'round.started',triggerRoundOffset:1,expiresAfterRoundOffset:1,once:true,capturePayloadKeys:['targetPlayerId']},
          ]}], ruleModifiers:[], creates:[], lifecycle:{}, responseWindow:{}, limit:{}, visibility:{},
          execution:{mode:'automatic',allowedOperations:[]},
        },
        {
          id:'resolve', kind:'passive', printedClause:'fixture', markers:['m50_structured_v1'],
          activation:{trigger:'m50_round_started'}, conditions:[{type:'scheduled_payload_present'}], targets:[], cost:[],
          effects:[
            {type:'add_status',target:'selected_player',status:'role:god-servant'},
            {type:'add_status',target:'selected_player',status:'history:god-servant'},
          ], ruleModifiers:[], creates:[], lifecycle:{}, responseWindow:{}, limit:{}, visibility:{},
          execution:{mode:'automatic',allowedOperations:[]},
        },
      ],
    }],
  };
}

function setup(): GameState {
  const pack=rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]);
  const state=createSeededGameState({activeSeats:[1,2,3]});
  state.cards=[{instanceId:SOURCE,definitionId:CARD,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}}];
  state.round.activePhase='action'; state.round.prioritySeat=state.players[0]!.seat;
  rules.initializeAbilityRuntime(state,pack,{seed:20260924});
  return state;
}
function armForP2(state:GameState){
  expect(rules.dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:'arm'}).ok).toBe(true);
  const d=state.abilityRuntime!.pendingDecision!;
  expect(d.candidates).toContain('p2');
  expect(rules.dispatchAbilityCommand(state,'p1',{type:'choose_target',decisionId:d.id,selectedIds:['p2']}).ok).toBe(true);
}

describe('P3 F4 M50-02 scheduled selected-player payload',()=>{
  it('captures targetPlayerId and resolves statuses exactly once next round',()=>{
    const state=setup(); armForP2(state);
    expect(state.abilityRuntime!.structuredScheduledEffects).toHaveLength(1);
    expect(state.abilityRuntime!.structuredScheduledEffects![0]).toMatchObject({targetAbilityId:'resolve',triggerRound:state.round.roundNumber+1,selections:{targetPlayerId:['p2']}});
    state.round.roundNumber+=1;
    rules.processAbilitySystemEvent(state,'m50-test-round-start',{type:'m50_round_started'} as any);
    expect(state.abilityRuntime!.playerStatusKeysByPlayer!.p2).toEqual(expect.arrayContaining(['role:god-servant','history:god-servant']));
    expect(state.abilityRuntime!.structuredScheduledEffects).toEqual([]);
  });

  it('fails closed when the captured selected player is eliminated before settlement',()=>{
    const state=setup(); armForP2(state);
    state.players[1]!.status='eliminated';
    state.round.roundNumber+=1;
    expect(()=>rules.processAbilitySystemEvent(state,'m50-test-round-start',{type:'m50_round_started'} as any)).toThrow();
    expect(state.abilityRuntime!.playerStatusKeysByPlayer!.p2 ?? []).not.toContain('role:god-servant');
  });
});
