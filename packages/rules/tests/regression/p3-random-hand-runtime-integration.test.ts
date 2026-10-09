import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const skill = 'fixture.master.random-skill';
const ability = { id: 'random-discard', kind: 'phase_action', printedClause: 'Discard a random hand card',
  activation: { phase: 'action', opens: 'controller_action_window' },
  conditions: [], targets: [], effects: [{ type:'discard_random_owned_hand' }], cost: [], creates: [],
  ruleModifiers: [], lifecycle: {}, responseWindow: { order:'turn_order',passBehavior:'decline_this_window' },
  limit: {}, visibility: {}, execution: { mode:'automatic',allowedOperations:[] } };
const archive = { schemaVersion:'fd-card-authoring-v1', id:'fixture.master',
  name:'Fixture', cards:[{ id:skill, name:'Random', cardType:'master_skill',
  owner:{ type:'master',id:'fixture.master' }, printedText:'Random hand discard',
  cardFace:{typeLabel:'技能',attributes:[],cost:0,basePower:0},
  playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],
  verification:{implementationStatus:'complete'},abilities:[ability]}] } as any;

describe('random discard loader fail-closed acceptance',()=>{
  it('rejects a forged client-chosen card identifier',()=>{
    const invalid=structuredClone(archive);
    invalid.cards[0].abilities[0].effects[0].cardInstanceId='forged';
    expect(rules.loadAuthoringJson(invalid).report.some((entry:any)=>entry.status==='unsupported')).toBe(true);
  });
  it('rejects extra effects or unexpected targets',()=>{
    const invalid=structuredClone(archive);
    invalid.cards[0].abilities[0].effects.push({type:'adjust_mana',target:'controller',amount:1});
    expect(rules.loadAuthoringJson(invalid).report.some((entry:any)=>entry.status==='unsupported')).toBe(true);
    const targeted=structuredClone(archive);
    targeted.cards[0].abilities[0].targets.push({id:'client-card',type:'card_instance',scope:{zone:'hand'}});
    expect(rules.loadAuthoringJson(targeted).report.some((entry:any)=>entry.status==='unsupported')).toBe(true);
  });
  it('rejects a nested random-discard effect as a hidden branch',()=>{
    const invalid=structuredClone(archive);
    invalid.cards[0].abilities[0].effects=[{type:'branch',condition:{type:'integer',value:1},
      then:[{type:'discard_random_owned_hand'}],else:[]}];
    expect(rules.loadAuthoringJson(invalid).report.some((entry:any)=>entry.status==='unsupported')).toBe(true);
  });
});

describe('CCC defeat VP penalty through existing forced-trigger engine',()=>{
  it('settles an exact ordinary one-VP battle-loss trigger once',()=>{
    const authored=structuredClone(archive);
    authored.cards[0].abilities[0].kind='forced_trigger';
    authored.cards[0].abilities[0].activation={trigger:'after_controller_loses_battle'};
    authored.cards[0].abilities[0].effects=[{type:'adjust_victory_points',player:'controller',amount:-1}];
    const loaded=rules.loadAuthoringJson(authored);
    expect(loaded.report).toEqual([]);
    const state=createSeededGameState({activeSeats:[1,2]});state.cards=[];
    state.players[0]!.vp=3;
    rules.initializeAbilityRuntime(state,loaded,{seed:900});
    state.cards.push({instanceId:'ccc',definitionId:skill,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',
      visibility:{scope:'owner_only',ownerPlayerId:'p1'}} as any);
    state.abilityRuntime!.cardState.ccc={active:false,faceDown:false,playedRound:state.round.roundNumber};
    const event={id:'lost-1',type:'after_controller_loses_battle',playerId:'p1'};
    rules.processAbilityEvent(state,event as any);
    expect(state.players[0]!.vp).toBe(2);
    rules.processAbilityEvent(state,event as any);
    expect(state.players[0]!.vp).toBe(2);
  });
});

describe('Extella authenticated battle-loss half-mana recovery',()=>{
  it('stages a private physical attack choice from a trusted loser result and grants ceil printed cost / 2',()=>{
    const authored=structuredClone(archive);
    authored.cards[0].abilities[0].kind='forced_trigger';
    authored.cards[0].abilities[0].activation={trigger:'after_controller_loses_battle'};
    authored.cards[0].abilities[0].effects=[{type:'mystic_code_battle_recovery'}];
    const loaded=rules.loadAuthoringJson(authored);expect(loaded.report).toEqual([]);
    (loaded.cards as any)['fixture.attack']={
      id:'fixture.attack',name:'Attack',cardType:'basic_attack',
      cardFace:{typeLabel:'基础攻击',attributes:['力量'],cost:5,basePower:2},
      playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],
      abilities:[],mode:'automatic'};
    const state=createSeededGameState({activeSeats:[1,2]});state.cards=[];
    state.round.activePhase='battle';state.players[0]!.locationId='miyama_town';
    state.players[1]!.locationId='miyama_town';state.players[0]!.mana=2;
    rules.initializeAbilityRuntime(state,loaded,{seed:6464});
    for(const [instanceId,definitionId,zone,active] of [
      ['code',skill,'skill',false],['attack','fixture.attack','attack_area',true]
    ] as const) {
      state.cards.push({instanceId,definitionId,ownerPlayerId:'p1',controllerPlayerId:'p1',zone,
        visibility:{scope:'public'}} as any);
      state.abilityRuntime!.cardState[instanceId]={active,faceDown:false,playedRound:state.round.roundNumber};
    }
    rules.processAbilityEvent(state,{
      id:'battle-result-1',type:'after_battle_result_determined',
      battlePhaseResolutionId:'battle-phase:1',battleId:'battle-1',resultId:'battle-result-1',
      battlefieldId:'miyama_town',battleParticipantIds:['p1','p2'],
      battleParticipantPowers:{p1:2,p2:6},battleResult:{winners:['p2'],loserIds:['p1']}
    });
    const pending=state.abilityRuntime!.pendingDecision!;
    expect(pending.interaction?.kind).toBe('mystic_code_battle_recovery_v1');
    expect(pending.candidates).toEqual(['attack']);
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,pending)).toBe(true);
    const session=rules.createMatchSession({humanPlayerId:'p1',humanPlayerIds:['p1','p2'],
      restorePackKind:'trusted_authoring_fixture'});
    session.state=state;session.logs=[];session.replay=[];session.replaySnapshots=[];session.battleHistory=[];
    const saved=JSON.parse(JSON.stringify(session.serializeSession()));
    const restored=rules.restoreMatchSession(saved,{restorePackKind:'trusted_authoring_fixture'});
    expect(restored.state.abilityRuntime?.pendingDecision?.interaction?.kind).toBe('mystic_code_battle_recovery_v1');
    expect(restored.getClientProjection('p2').view.pendingDecision).toBeUndefined();
    saved.state.abilityRuntime.pendingDecision.interaction.candidateIds=['forged'];
    expect(()=>rules.restoreMatchSession(saved,{restorePackKind:'trusted_authoring_fixture'})).toThrow();
    const before=state.players[0]!.mana;
    const decision=rules.dispatchAbilityCommand(state,'p1',{type:'choose_target',
      decisionId:pending.id,selectedIds:['attack']});
    expect(decision).toMatchObject({ok:true});
    expect(state.players[0]!.mana-before).toBe(3);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });
});

describe('event-bound Mystic Code expiration in production interpreter',()=>{
  it('requires exactly matching authoritative controller event and retires the physical source',()=>{
    const authored=structuredClone(archive);
    authored.cards[0].abilities[0].kind='forced_trigger';
    authored.cards[0].abilities[0].activation={trigger:'after_controller_wins_battle'};
    authored.cards[0].abilities[0].effects=[{type:'mystic_code_expire_on_event',when:'after_controller_wins_battle'}];
    const loaded=rules.loadAuthoringJson(authored);
    expect(loaded.report).toEqual([]);
    const state=createSeededGameState({activeSeats:[1,2]});state.cards=[];
    rules.initializeAbilityRuntime(state,loaded,{seed:900});
    state.cards.push({instanceId:'source',definitionId:skill,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',
      visibility:{scope:'owner_only',ownerPlayerId:'p1'}} as any);
    state.abilityRuntime!.cardState.source={active:false,faceDown:false,playedRound:state.round.roundNumber};
    const context={sourceCardId:'source',abilityId:'random-discard',controllerId:'p1',selections:{},variables:{}} as any;
    expect(()=>rules.executeAbility(state,{...context,event:{id:'bad',type:'after_controller_loses_battle',playerId:'p1'}})).toThrow();
    expect(state.cards[0]!.zone).toBe('skill');
    // A plain win label is not an authoritative victory. Publish the trusted
    // result and let the engine issue its real owner-win event.
    state.players[0]!.locationId='miyama_town';
    state.players[1]!.locationId='miyama_town';
    rules.processAbilityEvent(state,{
      id:'win-result-1',type:'after_battle_result_determined',
      battlePhaseResolutionId:'battle-phase:win-1',battleId:'battle-win-1',
      resultId:'win-result-1',battlefieldId:'miyama_town',
      battleParticipantIds:['p1','p2'],
      battleParticipantPowers:{p1:6,p2:2},
      battleResult:{winners:['p1'],loserIds:['p2']}
    });
    expect(state.cards[0]!.zone).toBe('removed_from_game');
  });
});

describe('out-of-game physical Mystic Code selection',()=>{
  it('randomly discards an owned hand card and installs exactly one chosen physical code',()=>{
    const authored=structuredClone(archive);
    authored.id='master.fixture';
    const defs=['extra','ccc','extella','link'].map(mode=>'master.fixture.skill.code.'+mode);
    authored.cards[0].abilities[0].activation.phase='preparation';
    authored.cards[0].abilities[0].effects=[{type:'mystic_code_switch',definitionIds:defs}];
    for(const id of defs) authored.cards.push({
      id,name:id,cardType:'master_skill',owner:{type:'master',id:'master.fixture'},initialPlacement:'outside_game',
      printedText:id,cardFace:{typeLabel:'技能',attributes:[],cost:0,basePower:0},
      playTiming:{phase:'action',window:'controller_play_card_window'},
      playRequirements:[],abilities:[],verification:{implementationStatus:'complete'}
    });
    const loaded=rules.loadAuthoringJson(authored);
    expect(loaded.report).toEqual([]);
    expect(loaded.cards[defs[0]!] as any).toMatchObject({cardType:'master_skill',initialPlacement:'outside_game'});
    const state=createSeededGameState({activeSeats:[1,2]});
    state.cards=[];state.round.activePhase='preparation';
    state.players[0]!.masterCardId='master.fixture';
    rules.initializeAbilityRuntime(state,loaded,{seed:4444});
    for(const [id,zone] of [['source','skill'],['h1','hand'],['h2','hand']] as const){
      state.cards.push({instanceId:id,definitionId:skill,ownerPlayerId:'p1',controllerPlayerId:'p1',zone,
        visibility:{scope:'owner_only',ownerPlayerId:'p1'}} as any);
      state.abilityRuntime!.cardState[id]={active:false,faceDown:false,playedRound:state.round.roundNumber};
    }
    rules.executeAbility(state,{sourceCardId:'source',abilityId:'random-discard',controllerId:'p1',selections:{},variables:{}} as any);
    state.abilityRuntime!.revision++;
    expect(state.cards.filter(c=>c.zone==='discard')).toHaveLength(1);
    const decision=state.abilityRuntime!.pendingDecision!;
    expect(decision.interaction?.kind).toBe('mystic_code_switch_v1');
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,decision)).toBe(true);
    const stale=structuredClone(state);
    stale.cards.find(c=>c.definitionId===defs[2])!.zone='hand';
    expect(rules.isCanonicalGenericPendingDecisionForRestore(stale,stale.abilityRuntime!.pendingDecision!)).toBe(false);
    expect(rules.projectAbilityState(state,'p2').pendingDecision).toBeUndefined();
    expect(rules.projectAbilityState(state,'p1').pendingDecision?.candidates).toEqual(decision.candidates);
    const session=rules.createMatchSession({humanPlayerId:'p1',humanPlayerIds:['p1','p2'],
      restorePackKind:'trusted_authoring_fixture'});
    session.state=state;session.logs=[];session.replay=[];session.replaySnapshots=[];session.battleHistory=[];
    const restored=rules.restoreMatchSession(JSON.parse(JSON.stringify(session.serializeSession())),
      {restorePackKind:'trusted_authoring_fixture'});
    expect(restored.state.abilityRuntime?.pendingDecision?.interaction?.kind).toBe('mystic_code_switch_v1');
    expect(restored.getClientProjection('p2').view.pendingDecision).toBeUndefined();
    const tampered=JSON.parse(JSON.stringify(session.serializeSession()));
    tampered.state.abilityRuntime.pendingDecision.interaction.codePhysicalIds[0]='forged';
    expect(()=>rules.restoreMatchSession(tampered,{restorePackKind:'trusted_authoring_fixture'})).toThrow();
    const chosen=state.cards.find(c=>c.definitionId===defs[2])!.instanceId;
    const result=rules.dispatchAbilityCommand(state,'p1',{type:'choose_target',decisionId:decision.id,selectedIds:[chosen]});
    expect(result).toMatchObject({ok:true});
    expect(state.cards.filter(c=>c.definitionId.startsWith('master.fixture.skill.code')&&c.zone==='skill').map(c=>c.definitionId)).toEqual([defs[2]]);
    expect(state.cards.filter(c=>c.definitionId.startsWith('master.fixture.skill.code')&&c.zone==='removed_from_game')).toHaveLength(3);
  });
});

describe('private battlefield deck-top game interaction',()=>{
  it('stages opponent choice, discards an arbitrary subset, and reorders survivors',()=>{
    const authored=structuredClone(archive);
    authored.cards[0].abilities[0].effects=[{type:'private_deck_top_choice',count:3}];
    const loaded=rules.loadAuthoringJson(authored);
    expect(loaded.report).toEqual([]);
    (loaded.cards as any)['fixture.opponent.basic']={
      id:'fixture.opponent.basic',name:'Opponent basic attack',cardType:'basic_attack',
      cardFace:{typeLabel:'基础攻击',attributes:['力量'],cost:1,basePower:2},
      playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[],mode:'automatic'
    };
    const state=createSeededGameState({activeSeats:[1,2]});
    state.cards=[];state.round.activePhase='action';
    state.players[0]!.locationId='miyama_town';state.players[1]!.locationId='miyama_town';
    rules.initializeAbilityRuntime(state,loaded,{seed:234});
    for(const id of ['source','a','b','c','d']){
      const owner=id==='source'?'p1':'p2', zone=id==='source'?'attack_area':'deck';
      state.cards.push({instanceId:id,definitionId:id==='source'?skill:'fixture.opponent.basic',ownerPlayerId:owner,controllerPlayerId:owner,zone,
        visibility:{scope:'owner_only',ownerPlayerId:owner}} as any);
      state.abilityRuntime!.cardState[id]={active:id==='source',faceDown:false,playedRound:state.round.roundNumber};
    }
    rules.executeAbility(state,{sourceCardId:'source',abilityId:'random-discard',controllerId:'p1',selections:{},variables:{}} as any);
    state.abilityRuntime!.revision++;
    const choose=(selectedIds:string[])=>{
      const pending=state.abilityRuntime!.pendingDecision!;
      const result=rules.dispatchAbilityCommand(state,'p1',{type:'choose_target',decisionId:pending.id,selectedIds});
      expect(result).toMatchObject({ok:true});
    };
    expect(state.abilityRuntime!.pendingDecision!.interaction?.kind).toBe('private_deck_top_choice_v1');
    choose(['p2']);
    expect(state.abilityRuntime!.pendingDecision!.candidates).toEqual(['a','b','c']);
    const stale=structuredClone(state);
    stale.cards.find(c=>c.instanceId==='a')!.zone='discard';
    expect(rules.isCanonicalGenericPendingDecisionForRestore(stale,stale.abilityRuntime!.pendingDecision!)).toBe(false);
    expect(rules.isCanonicalGenericPendingDecisionForRestore(state,state.abilityRuntime!.pendingDecision!)).toBe(true);
    const session=rules.createMatchSession({humanPlayerId:'p1',humanPlayerIds:['p1','p2'],restorePackKind:'trusted_authoring_fixture'});
    session.state=state;session.logs=[];session.replay=[];session.replaySnapshots=[];session.battleHistory=[];
    expect(session.getClientProjection('p1').view.pendingDecision?.candidates).toEqual(['a','b','c']);
    expect(session.getClientProjection('p2').view.pendingDecision).toBeUndefined();
    const snapshot=JSON.parse(JSON.stringify(session.serializeSession()));
    const restored=rules.restoreMatchSession(snapshot,{restorePackKind:'trusted_authoring_fixture'});
    expect(restored.state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('private_deck_top_choice_v1');
    expect(restored.getClientProjection('p2').view.pendingDecision).toBeUndefined();
    snapshot.state.abilityRuntime.pendingDecision.interaction.topCardIds[0]='forged';
    expect(()=>rules.restoreMatchSession(snapshot,{restorePackKind:'trusted_authoring_fixture'})).toThrow();
    choose(['b']);
    const reordered=rules.restoreMatchSession(JSON.parse(JSON.stringify(session.serializeSession())),
      {restorePackKind:'trusted_authoring_fixture'});
    expect(reordered.state.abilityRuntime?.pendingDecision?.interaction).toMatchObject({
      kind:'private_deck_top_choice_v1',stage:'reorder',keptCardIds:['a','c']});
    expect(reordered.getClientProjection('p2').view.pendingDecision).toBeUndefined();
    choose(['c','a']);
    expect(state.cards.filter(c=>c.ownerPlayerId==='p2' && c.zone==='discard').map(c=>c.instanceId)).toEqual(['b']);
    expect(state.cards.filter(c=>c.ownerPlayerId==='p2' && c.zone==='deck').map(c=>c.instanceId)).toEqual(['c','a','d']);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });
});

describe('CCC short-deck reshuffle integration',()=>{
  it('fills private top-three from owner discard using persisted server RNG',()=>{
    const authored=structuredClone(archive);
    authored.cards[0].abilities[0].effects=[{type:'private_deck_top_choice',count:3}];
    const loaded=rules.loadAuthoringJson(authored);expect(loaded.report).toEqual([]);
    (loaded.cards as any)['fixture.basic']={
      id:'fixture.basic',name:'Basic',cardType:'basic_attack',
      cardFace:{typeLabel:'攻击',attributes:['力量'],cost:0,basePower:1},
      playTiming:{phase:'action',window:'controller_play_card_window'},
      playRequirements:[],abilities:[],mode:'automatic'};
    const state=createSeededGameState({activeSeats:[1,2]});state.cards=[];
    state.round.activePhase='action';
    state.players[0]!.locationId='miyama_town';state.players[1]!.locationId='miyama_town';
    rules.initializeAbilityRuntime(state,loaded,{seed:6622});
    for(const [instanceId,owner,zone] of [
      ['source','p1','attack_area'],['a','p2','deck'],['b','p2','discard'],['c','p2','discard']
    ] as const){
      state.cards.push({instanceId,definitionId:owner==='p1'?skill:'fixture.basic',
        ownerPlayerId:owner,controllerPlayerId:owner,zone,visibility:{scope:'owner_only',ownerPlayerId:owner}} as any);
      state.abilityRuntime!.cardState[instanceId]={active:instanceId==='source',faceDown:false,playedRound:state.round.roundNumber};
    }
    rules.executeAbility(state,{sourceCardId:'source',abilityId:'random-discard',
      controllerId:'p1',selections:{},variables:{}} as any);
    state.abilityRuntime!.revision++;
    const decision=state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state,'p1',
      {type:'choose_target',decisionId:decision.id,selectedIds:['p2']})).toMatchObject({ok:true});
    expect(new Set(state.abilityRuntime!.pendingDecision!.candidates)).toEqual(new Set(['a','b','c']));
    expect(state.cards.filter(c=>c.ownerPlayerId==='p2'&&c.zone==='deck')).toHaveLength(3);
    expect(state.cards.filter(c=>c.ownerPlayerId==='p2'&&c.zone==='discard')).toHaveLength(0);
  });
});

describe('Link Power effect loader restriction',()=>{
  it('rejects non-action, extra-effect and widened-cap shapes',()=>{
    const base=structuredClone(archive);
    base.cards[0].abilities[0].effects=[{type:'grant_played_attacks_printed_mana_power',maximumBonus:3}];
    const widened=structuredClone(base);widened.cards[0].abilities[0].effects[0].maximumBonus=4;
    expect(rules.loadAuthoringJson(widened).report.some((x:any)=>x.status==='unsupported')).toBe(true);
    const extra=structuredClone(base);extra.cards[0].abilities[0].effects.push({type:'adjust_mana',target:'controller',amount:1});
    expect(rules.loadAuthoringJson(extra).report.some((x:any)=>x.status==='unsupported')).toBe(true);
    const wrongPhase=structuredClone(base);wrongPhase.cards[0].abilities[0].activation.phase='combat';
    expect(rules.loadAuthoringJson(wrongPhase).report.some((x:any)=>x.status==='unsupported')).toBe(true);
  });
});

describe('real attack-area printed-mana Power bonus integration',()=>{
  it('adds at most three Power based on physical attack printed face',()=>{
    const code=structuredClone(archive);
    code.cards[0].abilities[0].effects=[{type:'grant_played_attacks_printed_mana_power',maximumBonus:3}];
    const loaded=rules.loadAuthoringJson(code);
    expect(loaded.report).toEqual([]);
    (loaded.cards as any)['fixture.attack']={id:'fixture.attack',name:'Attack',cardType:'basic_attack',
      cardFace:{typeLabel:'攻击',attributes:['力量'],cost:5,basePower:2},playTiming:{phase:'action',window:'controller_play_card_window'},
      playRequirements:[],abilities:[],mode:'automatic'};
    const state=createSeededGameState({activeSeats:[1,2]});
    state.cards=[];state.round.activePhase='action';
    rules.initializeAbilityRuntime(state,loaded,{seed:123});
    for(const [instanceId,definitionId,zone] of [['code','fixture.master.random-skill','attack_area'],['attack','fixture.attack','attack_area']] as const){
      state.cards.push({instanceId,definitionId,ownerPlayerId:'p1',controllerPlayerId:'p1',zone,visibility:{scope:'public'}} as any);
      state.abilityRuntime!.cardState[instanceId]={active:true,faceDown:false,playedRound:state.round.roundNumber};
    }
    // A distinct accepted provider already granted a normal round card Power bonus.
    state.abilityRuntime!.cardState.attack!.roundPowerBonus={
      round:state.round.roundNumber,amount:2,sourceAbilityId:'other-ability'};
    const before=rules.calculateCardPower(state,'attack').value;
    rules.executeAbility(state,{sourceCardId:'code',abilityId:'random-discard',controllerId:'p1',selections:{},variables:{}} as any);
    expect(rules.calculateCardPower(state,'attack').value-before).toBe(3);
    delete state.abilityRuntime!.cardState.attack!.roundPowerBonus;
    const checkpointPower=rules.calculateCardPower(state,'attack').value;
    const session=rules.createMatchSession({humanPlayerId:'p1',humanPlayerIds:['p1','p2'],
      restorePackKind:'trusted_authoring_fixture'});
    session.state=state;session.logs=[];session.replay=[];session.replaySnapshots=[];session.battleHistory=[];
    const raw=JSON.parse(JSON.stringify(session.serializeSession()));
    const restored=rules.restoreMatchSession(raw,{restorePackKind:'trusted_authoring_fixture'});
    expect(rules.calculateCardPower(restored.state,'attack').value).toBe(checkpointPower);
    const forged=JSON.parse(JSON.stringify(raw));
    forged.state.abilityRuntime.cardState.attack.printedManaPowerBonus.amount=1;
    expect(()=>rules.restoreMatchSession(forged,{restorePackKind:'trusted_authoring_fixture'})).toThrow();
  });
});

describe('generic server-authoritative random discard operation',()=>{
  it('reproduces the same physical random discard after restoring identical state',()=>{
    const loaded=rules.loadAuthoringJson(archive);
    const state=createSeededGameState({activeSeats:[1,2]});
    state.cards=[];
    rules.initializeAbilityRuntime(state,loaded,{seed:121212});
    for(const id of ['source','first','second','third']){
      const zone=id==='source'?'skill':'hand';
      state.cards.push({instanceId:id,definitionId:skill,ownerPlayerId:'p1',controllerPlayerId:'p1',zone,
        visibility:{scope:'owner_only',ownerPlayerId:'p1'}} as any);
      state.abilityRuntime!.cardState[id]={active:false,faceDown:false,playedRound:state.round.roundNumber};
    }
    const copy=structuredClone(state);
    const ctx={sourceCardId:'source',abilityId:'random-discard',controllerId:'p1',selections:{},variables:{}} as any;
    rules.executeAbility(state,structuredClone(ctx));
    rules.executeAbility(copy,structuredClone(ctx));
    expect(state.cards.filter(c=>c.zone==='discard').map(c=>c.instanceId)).toEqual(copy.cards.filter(c=>c.zone==='discard').map(c=>c.instanceId));
    expect(state.abilityRuntime!.randomState).toBe(copy.abilityRuntime!.randomState);
  });
  it('loads canonical effect and executes against real card state and saved RNG',()=>{
    const loaded=rules.loadAuthoringJson(archive);
    expect(loaded.report).toEqual([]);
    const state=createSeededGameState({activeSeats:[1,2]});
    state.cards=[];
    rules.initializeAbilityRuntime(state,loaded,{seed:4455});
    for(const [id,zone] of [['skill-1','skill'],['hand-1','hand'],['hand-2','hand'],['other-1','hand']] as const){
      const owner=id==='other-1'?'p2':'p1';
      state.cards.push({instanceId:id,definitionId:skill,ownerPlayerId:owner,controllerPlayerId:owner,zone,
        visibility:{scope:'owner_only',ownerPlayerId:owner}} as any);
      state.abilityRuntime!.cardState[id]={active:false,faceDown:false,playedRound:state.round.roundNumber};
    }
    const oldSeed=state.abilityRuntime!.randomState;
    rules.executeAbility(state,{sourceCardId:'skill-1',abilityId:'random-discard',controllerId:'p1',selections:{},variables:{}} as any);
    expect(state.cards.filter(c=>c.ownerPlayerId==='p1'&&c.zone==='discard')).toHaveLength(1);
    expect(state.cards.find(c=>c.instanceId==='other-1')?.zone).toBe('hand');
    expect(state.abilityRuntime!.randomState).not.toBe(oldSeed);
  });
});
