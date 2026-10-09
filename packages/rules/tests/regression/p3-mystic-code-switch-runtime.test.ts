import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const master='master.fixture-real-code-switch';
const definitions=[
  master+'.skill.link',master+'.skill.ccc',
  master+'.skill.extella',master+'.skill.extra',
];
const sourceId=master+'.skill.switch';
const handId=master+'.hand.basic';
const attackId=master+'.attack.basic';
const additionalOnly={
  id:'mystic-code-required-additional',kind:'passive',
  printedClause:'Mystic Codes are played in addition to the regular attack',
  activation:{trigger:'while_active'},
  conditions:[],targets:[],cost:[],effects:[{type:'append_only_rule'}],
  creates:[],ruleModifiers:[],lifecycle:{},
  responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},
  limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]},
};
const ability={
  id:'switch',kind:'phase_action',
  activation:{phase:'preparation',opens:'controller_action_window'},
  printedClause:'Discard one random owned hand card and choose one Code',
  conditions:[],targets:[],cost:[],
  effects:[{type:'mystic_code_switch',definitionIds:definitions}],
  creates:[],ruleModifiers:[],lifecycle:{},
  responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},
  limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]},
};
function authoredCard(id:string,abilities:unknown[]=[],outside=false) {
  return {
    id,name:id,cardType:'master_skill',owner:{type:'master',id:master},
    printedText:id,cardFace:{typeLabel:'技能',cost:0,basePower:0,attributes:[]},
    playTiming:{phase:'action',window:'controller_play_card_window'},
    playRequirements:[],verification:{implementationStatus:'complete'},
    ...(outside?{initialPlacement:'outside_game'}:{}),abilities,
  };
}
function setup(additionalModes=false) {
  const loaded=rules.loadAuthoringJson({
    id:master,schemaVersion:'fd-card-authoring-v1',name:'Real Mystic Code switch',
    cards:[authoredCard(sourceId,[ability]),...definitions.map(id=>authoredCard(id,additionalModes?[additionalOnly]:[],true)),
      authoredCard(handId),{
        ...authoredCard(attackId),cardType:'basic_attack',
        cardFace:{typeLabel:'攻击',cost:1,basePower:2,attributes:['力量']},
      }],
  } as any);
  expect(loaded.report).toEqual([]);
  const state=createSeededGameState({activeSeats:[1,2]});
  state.cards=[];
  state.players[0]!.masterCardId=master;
  state.round.activePhase='preparation';
  state.round.prioritySeat=1;
  rules.initializeAbilityRuntime(state,loaded,{seed:817});
  for(const [instanceId,definitionId,zone,playerId] of [
    ['source',sourceId,'skill','p1'],
    ['old-code',definitions[0],'skill','p1'],
    ['own-hand',handId,'hand','p1'],
    ['other-hand',handId,'hand','p2'],
  ] as const){
    state.cards.push({
      instanceId,definitionId,ownerPlayerId:playerId,
      controllerPlayerId:playerId,zone,
      visibility:{scope:'owner_only',ownerPlayerId:playerId},
    } as any);
    state.abilityRuntime!.cardState[instanceId]={
      active:false,faceDown:false,playedRound:state.round.roundNumber,
    };
  }
  return state;
}
describe('real preparation-phase Mystic Code switch and restore',()=>{
  it('requires each of four Mystic Codes to accompany, not replace, a paid ordinary attack',()=>{
    for(let index=0;index<definitions.length;index++){
      const state=setup(true);
      state.players[0]!.mana=20;
      expect(rules.dispatchAbilityCommand(state,'p1',{
        type:'activate_ability',cardInstanceId:'source',abilityId:'switch',
      })).toMatchObject({ok:true});
      const decision=state.abilityRuntime!.pendingDecision!;
      const chosen=decision.candidates[index]!;
      expect(rules.dispatchAbilityCommand(state,'p1',{
        type:'choose_target',decisionId:decision.id,selectedIds:[chosen],
      })).toMatchObject({ok:true});
      state.cards.push({
        instanceId:'normal-attack',definitionId:attackId,ownerPlayerId:'p1',
        controllerPlayerId:'p1',zone:'hand',
        visibility:{scope:'owner_only',ownerPlayerId:'p1'},
      } as any);
      state.round.activePhase='action';
      state.round.prioritySeat=1;
      expect(rules.dispatchAbilityCommand(state,'p1',{
        type:'play_card',cardInstanceId:chosen,
      }).rejection?.code).toBe('append_only');
      expect(rules.getLegalActions(state,'p1')).not.toContainEqual({
        type:'stage_attack_card',cardInstanceId:chosen,
      });
      expect(rules.dispatchAbilityCommand(state,'p1',{
        type:'stage_attack_card',cardInstanceId:'normal-attack',
      })).toMatchObject({ok:true});
      expect(rules.getLegalActions(state,'p1')).toContainEqual({
        type:'stage_attack_card',cardInstanceId:chosen,
      });
      expect(rules.dispatchAbilityCommand(state,'p1',{
        type:'stage_attack_card',cardInstanceId:chosen,
      })).toMatchObject({ok:true});
      expect(rules.dispatchAbilityCommand(state,'p1',{
        type:'confirm_staged_attack',
      })).toMatchObject({ok:true});
      expect(state.cards.find(c=>c.instanceId===chosen)?.zone).toBe('attack_area');
      expect(state.cards.find(c=>c.instanceId==='normal-attack')?.zone).toBe('attack_area');
      expect(rules.projectAbilityState(state,'p1').playSummary).toMatchObject({
        attacksDeclaredThisRound:1,attackAreaOccupancy:2,
      });
    }
  });
  it('reuses the same four physical Mystic Code cards on a later preparation round',()=>{
    const state=setup(true);
    const choose=(index:number)=>{
      const activated=rules.dispatchAbilityCommand(state,'p1',{
        type:'activate_ability',cardInstanceId:'source',abilityId:'switch',
      });
      expect(activated.ok,JSON.stringify(activated.rejection)).toBe(true);
      const d=state.abilityRuntime!.pendingDecision!;
      const candidate=d.candidates[index]!;
      expect(rules.dispatchAbilityCommand(state,'p1',{
        type:'choose_target',decisionId:d.id,selectedIds:[candidate],
      })).toMatchObject({ok:true});
      return candidate;
    };
    const first=choose(2);
    expect(state.cards.find(c=>c.instanceId==='source')).toMatchObject({definitionId:sourceId,zone:'skill'});
    expect(state.abilityRuntime!.pack.cards[sourceId]?.abilities.map(a=>a.id)).toContain('switch');
    const frozenPhysicalIds=state.cards.filter(c=>definitions.includes(c.definitionId))
      .map(c=>c.instanceId).sort();
    expect(state.cards.find(c=>c.instanceId===first)?.zone).toBe('skill');
    // Normal once-per-round restriction still applies even with a second
    // discarded-card candidate; do not accidentally bypass shared action gates.
    state.cards.push({instanceId:'same-round-discard',
      definitionId:handId,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'hand',
      visibility:{scope:'owner_only',ownerPlayerId:'p1'},
    } as any);
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'source',abilityId:'switch',
    }).ok).toBe(false);
    expect(state.cards.find(c=>c.instanceId==='same-round-discard')?.zone).toBe('hand');
    // The Reference promises the Code lasts until the next Dress Change,
    // not that the common once-per-round limit is lifted.
    state.round.roundNumber+=1;
    state.cards.push({instanceId:'second-discard',
      definitionId:handId,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'hand',
      visibility:{scope:'owner_only',ownerPlayerId:'p1'},
    } as any);
    const second=choose(0);
    expect(second).toBe('old-code');
    expect(state.cards.find(c=>c.instanceId===first)?.zone).toBe('removed_from_game');
    expect(state.cards.find(c=>c.instanceId===second)?.zone).toBe('skill');
    expect(state.cards.find(c=>c.instanceId==='second-discard')?.zone).toBe('discard');
    expect(state.cards.filter(c=>definitions.includes(c.definitionId))
      .map(c=>c.instanceId).sort()).toEqual(frozenPhysicalIds);
    expect(state.cards.filter(c=>definitions.includes(c.definitionId) && c.zone==='skill'))
      .toHaveLength(1);
  });
  it('discards exactly one own hand card, creates four physical codes, and restores owner-only choice',()=>{
    const state=setup();
    const action=rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'source',abilityId:'switch',
    });
    expect(action).toMatchObject({ok:true});
    expect(state.cards.find(c=>c.instanceId==='own-hand')?.zone).toBe('discard');
    expect(state.cards.find(c=>c.instanceId==='other-hand')?.zone).toBe('hand');
    const d=state.abilityRuntime!.pendingDecision!;
    expect(d.interaction?.kind).toBe('mystic_code_switch_v1');
    expect(d.candidates).toHaveLength(4);
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,d)).toBe(true);
    expect(state.cards.filter(c=>definitions.includes(c.definitionId))).toHaveLength(4);
    const beforeRejected=state.cards.map(c=>[c.instanceId,c.zone]);
    expect(rules.dispatchAbilityCommand(state,'p2',{
      type:'choose_target',decisionId:d.id,selectedIds:[d.candidates[2]!],
    }).ok).toBe(false);
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:['forged-code'],
    }).ok).toBe(false);
    expect(state.cards.map(c=>[c.instanceId,c.zone])).toEqual(beforeRejected);

    const session=rules.createMatchSession({
      humanPlayerId:'p1',humanPlayerIds:['p1','p2'],
      restorePackKind:'trusted_authoring_fixture',
    });
    session.state=state;
    session.logs=[];session.replay=[];session.replaySnapshots=[];session.battleHistory=[];
    const saved=JSON.parse(JSON.stringify(session.serializeSession()));
    const restored=rules.restoreMatchSession(saved,{restorePackKind:'trusted_authoring_fixture'});
    expect(restored.state.abilityRuntime?.pendingDecision?.interaction?.kind).toBe('mystic_code_switch_v1');
    expect(restored.getClientProjection('p2').view.pendingDecision).toBeUndefined();
    expect(restored.getClientProjection('p1').view.pendingDecision?.candidates).toEqual(d.candidates);

    const chosen=d.candidates[2]!;
    expect(rules.dispatchAbilityCommand(restored.state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:[chosen],
    })).toMatchObject({ok:true});
    expect(restored.state.cards.find(c=>c.instanceId==='old-code')?.zone).toBe('removed_from_game');
    expect(restored.state.cards.find(c=>c.instanceId===chosen)?.zone).toBe('skill');
    expect(restored.state.cards.filter(c=>definitions.includes(c.definitionId) && c.zone==='skill')).toHaveLength(1);
    expect(restored.state.abilityRuntime?.pendingDecision).toBeUndefined();
  });

  it('refuses the initial activation from a controlled but foreign-owned source without discarding',()=>{
    const state=setup();
    state.cards.find(c=>c.instanceId==='source')!.ownerPlayerId='p2';
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'source',abilityId:'switch',
    }).ok).toBe(false);
    expect(state.cards.find(c=>c.instanceId==='own-hand')?.zone).toBe('hand');
    expect(state.abilityRuntime?.pendingDecision).toBeUndefined();
  });

  it('rejects an unrelated duplicate physical ID before consuming the random hand discard',()=>{
    const state=setup();
    // The other-player deck card collides with the retained Link Code, not
    // with any chosen hand card. Activation must validate global identity
    // BEFORE committing random discard or opening an unresolvable lease.
    state.cards.push({
      instanceId:'old-code',definitionId:handId,
      ownerPlayerId:'p2',controllerPlayerId:'p2',zone:'deck',
      visibility:{scope:'owner_only',ownerPlayerId:'p2'},
    } as any);
    const before=JSON.stringify(state);
    const result=rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'source',abilityId:'switch',
    });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
    expect(state.abilityRuntime?.pendingDecision).toBeUndefined();
  });

  it('rejects duplicate physical identity during pending switch restoration',()=>{
    const state=setup();
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'source',abilityId:'switch',
    })).toMatchObject({ok:true});
    const d=state.abilityRuntime!.pendingDecision!;
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,d)).toBe(true);
    state.cards.push({
      ...state.cards.find(c=>c.instanceId===d.candidates[2])!,
      definitionId:handId,ownerPlayerId:'p2',controllerPlayerId:'p2',
      zone:'deck',
    });
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,d)).toBe(false);
  });

  it('refuses to restore a pending switch after its source loses owner provenance',()=>{
    const state=setup();
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'source',abilityId:'switch',
    })).toMatchObject({ok:true});
    const d=state.abilityRuntime!.pendingDecision!;
    state.cards.find(c=>c.instanceId==='source')!.ownerPlayerId='p2';
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,d)).toBe(false);
  });

  it('rejects a stale code-selection source after a physical move, without applying a choice',()=>{
    const state=setup();
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'activate_ability',cardInstanceId:'source',abilityId:'switch',
    })).toMatchObject({ok:true});
    const d=state.abilityRuntime!.pendingDecision!;
    state.cards.find(c=>c.instanceId==='source')!.zone='removed_from_game';
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,d)).toBe(false);
    const before=state.cards.map(c=>({id:c.instanceId,zone:c.zone}));
    expect(rules.dispatchAbilityCommand(state,'p1',{
      type:'choose_target',decisionId:d.id,selectedIds:[d.candidates[2]!],
    }).ok).toBe(false);
    expect(state.cards.map(c=>({id:c.instanceId,zone:c.zone}))).toEqual(before);
  });
});
