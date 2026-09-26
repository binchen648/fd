import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import {
  advanceAbilityPhase,
  dispatchAbilityCommand,
  initializeAbilityRuntime,
  processAbilityEvent,
  projectAbilityState,
} from '../../src/ability/interpreter';
import { deriveBattleParticipantsFromState } from '../../src/core/combat-resolver';
import type { AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { playerCombatTotalPowerAdjustment } from '../../src/ability/owner-self-mechanics';

const archivePath = 'data/authoring/servants/servant.siegfried.json';
const skill = (n: number) => `servant.siegfried.skill.sc-siegfried-${n}`;

function rawArchive() { return JSON.parse(readFileSync(archivePath, 'utf8')); }
function setup() {
  const raw = rawArchive();
  const pack = loadAuthoringJson(raw);
  const state = createSeededGameState();
  state.cards = [];
  state.players[0]!.servantCardId = 'servant.siegfried';
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'miyama_town';
  state.players[0]!.mana = 30;
  state.players[0]!.vp = 10;
  initializeAbilityRuntime(state, pack, { seed: 20260926 });
  return { raw, pack, state };
}
function addCard(state: GameState, definitionId: string, owner='p1', zone='skill', controller=owner, active=false) {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: controller, zone, visibility: ['attack_area','field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return state.cards[state.cards.length - 1]!;
}
function addHandCard(state: GameState, id: string, basePower: number) {
  const def: AuthoringCard = { id, name:id, cardType:'basic_attack', cardFace:{attributes:['力量'],cost:0,basePower}, playTiming:{phase:'action',window:'controller_play_card_window'}, playRequirements:[], abilities:[], mode:'automatic' };
  state.abilityRuntime!.pack.cards[id]=def;
  return addCard(state,id,'p1','hand','p1',false);
}
function addOpponentTargetAbility(state: GameState) {
  const id='fixture.opponent-target';
  const def: AuthoringCard = {
    id,name:id,cardType:'master_skill',cardFace:{attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],mode:'automatic',
    abilities:[{
      id:'fixture.target-player',kind:'phase_action',printedClause:'fixture',activation:{phase:'action',opens:'controller_action_window',requiresSourceState:'active'},conditions:[],
      targets:[{id:'target-player',type:'player',count:{min:1,max:1},constraints:[{type:'not_controller'}]}],
      effects:[{type:'adjust_selected_player_terrain',target:'target-player',add:2,multiply:2,duration:'this_round'}],cost:[],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]},
    }],
  };
  state.abilityRuntime!.pack.cards[id]=def;
  return addCard(state,id,'p2','attack_area','p2',true);
}

function addMassOpponentDiscardAbility(state: GameState) {
  const id='fixture.mass-opponent-discard';
  const def: AuthoringCard = {
    id,name:id,cardType:'master_skill',cardFace:{attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],mode:'automatic',
    abilities:[{id:'fixture.mass-discard',kind:'phase_action',printedClause:'fixture',activation:{phase:'action',opens:'controller_action_window',requiresSourceState:'active'},conditions:[],targets:[],effects:[{type:'opponents_random_discard',count:1}],cost:[],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}}],
  };
  state.abilityRuntime!.pack.cards[id]=def;
  return addCard(state,id,'p2','attack_area','p2',true);
}
function addOwnedHandCard(state: GameState, id: string, owner: string) {
  const def: AuthoringCard={id,name:id,cardType:'master_skill',cardFace:{attributes:[],cost:0,basePower:1},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[],mode:'automatic'};
  state.abilityRuntime!.pack.cards[id]=def;
  return addCard(state,id,owner,'hand',owner,false);
}

describe('P3 owner-complete Siegfried migration', () => {
  it('loads exactly all three frozen Siegfried skills with no unsupported mechanics', () => {
    const { pack }=setup();
    expect(pack.report.filter((entry)=>entry.status==='unsupported')).toEqual([]);
    expect([1,2,3].map((n)=>pack.cards[skill(n)]?.name)).toEqual(['隐身衣','恶龙之血铠','幻想大剑·天魔失坠']);
  });

  it('fails closed for every newly introduced owner-self/immunity primitive shape', () => {
    const cases:Array<{abilityId:string; mutate:(raw:any)=>void}>=[
      {abilityId:'sc-siegfried-1.play-vp-loss',mutate:(raw)=>{raw.cards[0].abilities[0].effects[0].extra='near-match';}},
      {abilityId:'sc-siegfried-1.invisibility-cloak',mutate:(raw)=>{raw.cards[0].abilities[1].effects[0].extra='near-match';}},
      {abilityId:'sc-siegfried-1.invisibility-cloak',mutate:(raw)=>{raw.cards[0].abilities[1].ruleModifiers[0].scope.extra='near-match';}},
      {abilityId:'sc-siegfried-3.reveal-hand-power',mutate:(raw)=>{raw.cards[2].abilities[1].effects[0].extra='near-match';}},
    ];
    for(const entry of cases){const raw=rawArchive();entry.mutate(raw);const pack=loadAuthoringJson(raw);expect(pack.report.some((issue)=>issue.abilityId===entry.abilityId&&issue.status==='unsupported')).toBe(true);}
  });

  it('charges Invisibility Cloak by physical play ordinal rather than retroactively or by round', () => {
    const { state }=setup(); const cloak=addCard(state,skill(1)); state.round.activePhase='action'; state.round.prioritySeat=1;
    expect(dispatchAbilityCommand(state,'p1',{type:'play_card',cardInstanceId:cloak.instanceId}).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(9);
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[cloak.instanceId]).toBe(1);
    const liveCloak=state.cards.find((card)=>card.instanceId===cloak.instanceId)!; liveCloak.zone='skill'; liveCloak.visibility={scope:'owner_only',ownerPlayerId:'p1'}; state.abilityRuntime!.cardState[cloak.instanceId]!.active=false;
    advanceAbilityPhase(state,'round_end'); advanceAbilityPhase(state,'preparation',state.round.roundNumber+1); advanceAbilityPhase(state,'action'); state.round.prioritySeat=1;
    expect(dispatchAbilityCommand(state,'p1',{type:'play_card',cardInstanceId:cloak.instanceId}).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(7);
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[cloak.instanceId]).toBe(2);
  });

  it('temporarily conceals true name, restores the prior reveal state, and blocks same-location opponent targeting', () => {
    const { state }=setup(); const cloak=addCard(state,skill(1),'p1','attack_area','p1',true); const hostile=addOpponentTargetAbility(state);
    state.abilityRuntime!.revealedServants.push('p1'); state.round.activePhase='action'; state.round.prioritySeat=1;
    expect(dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:cloak.instanceId,abilityId:'sc-siegfried-1.invisibility-cloak'}).ok).toBe(true);
    expect(state.abilityRuntime!.revealedServants).not.toContain('p1');
    expect(projectAbilityState(state,'p2').players.find((p)=>p.id==='p1')?.servantPackage).toBeUndefined();
    state.round.prioritySeat=2;
    expect(dispatchAbilityCommand(state,'p2',{type:'activate_ability',cardInstanceId:hostile.instanceId,abilityId:'fixture.target-player'}).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision?.candidates).not.toContain('p1');
    // Resolve the fixture decision so round-end can proceed.
    const d=state.abilityRuntime!.pendingDecision!; expect(d.candidates).toContain('p3');
    expect(dispatchAbilityCommand(state,'p2',{type:'choose_target',decisionId:d.id,selectedIds:['p3']}).ok).toBe(true);
    processAbilityEvent(state,{id:'round-end:siegfried-cloak',type:'round_end'});
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
  });

  it('also ignores untargeted same-location opponent abilities while the cloak is active', () => {
    const { state }=setup(); const cloak=addCard(state,skill(1),'p1','attack_area','p1',true); const hostile=addMassOpponentDiscardAbility(state);
    state.players[2]!.locationId='shinto'; const protectedHand=addOwnedHandCard(state,'fixture.protected-hand','p1'); const unprotectedHand=addOwnedHandCard(state,'fixture.unprotected-hand','p3');
    state.round.activePhase='action'; state.round.prioritySeat=1;
    expect(dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:cloak.instanceId,abilityId:'sc-siegfried-1.invisibility-cloak'}).ok).toBe(true);
    state.round.prioritySeat=2;
    expect(dispatchAbilityCommand(state,'p2',{type:'activate_ability',cardInstanceId:hostile.instanceId,abilityId:'fixture.mass-discard'}).ok).toBe(true);
    expect(state.cards.find((card)=>card.instanceId===protectedHand.instanceId)?.zone).toBe('hand');
    expect(state.cards.find((card)=>card.instanceId===unprotectedHand.instanceId)?.zone).toBe('discard');
  });

  it('keeps a previously hidden servant hidden after Invisibility Cloak expires', () => {
    const { state }=setup(); const cloak=addCard(state,skill(1),'p1','attack_area','p1',true); state.round.activePhase='action'; state.round.prioritySeat=1;
    expect(state.abilityRuntime!.revealedServants).not.toContain('p1');
    expect(dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:cloak.instanceId,abilityId:'sc-siegfried-1.invisibility-cloak'}).ok).toBe(true);
    processAbilityEvent(state,{id:'round-end:siegfried-hidden',type:'round_end'});
    expect(state.abilityRuntime!.revealedServants).not.toContain('p1');
  });

  it('reveals Armor of Fafnir on play and closes it only when an opponent moves onto the engaged battlefield', () => {
    const { state }=setup(); const armor=addCard(state,skill(2)); state.round.activePhase='action'; state.round.prioritySeat=1;
    expect(dispatchAbilityCommand(state,'p1',{type:'play_card',cardInstanceId:armor.instanceId}).ok).toBe(true);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(state.cards.find((c)=>c.instanceId===armor.instanceId)?.zone).toBe('attack_area');
    processAbilityEvent(state,{id:'move-away',type:'after_controller_enters_location',playerId:'p3',locationId:'miyama_town'});
    expect(state.cards.find((c)=>c.instanceId===armor.instanceId)?.zone).toBe('attack_area');
    state.players[2]!.locationId='shinto';
    processAbilityEvent(state,{id:'move-in',type:'after_controller_enters_location',playerId:'p3',locationId:'shinto'});
    expect(state.cards.find((c)=>c.instanceId===armor.instanceId)?.zone).toBe('skill');
    expect(state.abilityRuntime!.cardState[armor.instanceId]!.active).toBe(false);
  });

  it('reveals the current hand for one revision and grants +2 per base-power-4 card capped at +6 for this round', () => {
    const { state }=setup(); const sword=addCard(state,skill(3)); const h1=addHandCard(state,'fixture.power4',4); const h2=addHandCard(state,'fixture.power5',5); const h3=addHandCard(state,'fixture.power6',6); addHandCard(state,'fixture.power3',3);
    state.round.activePhase='action'; state.round.prioritySeat=1;
    expect(dispatchAbilityCommand(state,'p1',{type:'play_card',cardInstanceId:sword.instanceId}).ok).toBe(true);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(deriveBattleParticipantsFromState(state,'shinto').find((entry)=>entry.playerId==='p1')!.totalPower).toBe(9);
    expect(dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:sword.instanceId,abilityId:'sc-siegfried-3.reveal-hand-power'}).ok).toBe(true);
    expect(playerCombatTotalPowerAdjustment(state,'p1')).toBe(6);
    const opponentView=projectAbilityState(state,'p2');
    for(const card of [h1,h2,h3]) expect(opponentView.cards.some((entry)=>entry.instanceId===card.instanceId&&entry.definitionId===card.definitionId)).toBe(true);
    const participant=deriveBattleParticipantsFromState(state,'shinto').find((entry)=>entry.playerId==='p1')!;
    expect(participant.totalPower).toBe(15);
    processAbilityEvent(state,{id:'revision-after-hand-reveal',type:'fixture_noop'});
    const nextView=projectAbilityState(state,'p2');
    expect(nextView.cards.some((entry)=>entry.ownerPlayerId==='p1'&&entry.zone==='hand')).toBe(false);
    advanceAbilityPhase(state,'round_end');
    advanceAbilityPhase(state,'preparation',state.round.roundNumber+1);
    expect(playerCombatTotalPowerAdjustment(state,'p1')).toBe(0);
  });
});