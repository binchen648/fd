import { describe, expect, it } from 'vitest';
import { createMatchSession } from '../../src/match-session';
import { loadAuthoringJson } from '../../src/ability/loader';
import { initializeAbilityRuntime, initializeActionTurns, cardManaCost, executeAbility, resolveEffect, advanceAbilityPhase } from '../../src/ability/interpreter';
import { restoreTrustedAuthoringFixtureSession } from '../trusted-authoring-fixture';
const scope={subject:'all_players',location:'source_location',zone:['hand','skill'],constraints:[{type:'is_attack'}]};
const modifier=(value=-1)=>({rule:'card.manaCost',operation:'add',value,scope});
function author(value=-1,declared=false){return {schemaVersion:'fd-card-authoring-v1',id:'fixture.aura',name:'controlled aura consumer',class:'Archer',cards:[
 {id:'fixture.aura',name:'aura',cardType:'servant_skill',cardFace:{cost:0,basePower:0,attributes:[]},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[{id:'aura',kind:declared?'phase_action':'passive',printedClause:'disclosed cost aura fixture',activation:declared?{phase:'action',opens:'controller_action_window',requiresSourceState:'active'}:{trigger:'while_active',requiresSourceState:'active'},conditions:[{type:'source_active'}],targets:[],effects:[],cost:[],creates:[],ruleModifiers:[modifier(value)],lifecycle:{duration:'this_round'},responseWindow:{},limit:{type:'per_round',uses:1,scope:'this_card'},visibility:{},execution:{mode:'automatic'}}]},
 ...['attack','support'].map(kind=>({id:'fixture.'+kind,name:kind,cardType:kind==='attack'?'servant_attack':'servant_skill',cardFace:{cost:2,basePower:4,attributes:['力量']},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[]}))
]};}
function setup(value=-1,declared=false){
 const session=createMatchSession({seed:20260907,humanPlayerIds:['p1','p2','p3','p4','p5','p6','p7']}),s=session.state,canonical=s.abilityRuntime!.pack;
 const loaded=loadAuthoringJson(author(value,declared));expect(loaded.report).toEqual([]);
 s.cards=[];s.modeState={};delete s.abilityRuntime;
 initializeAbilityRuntime(s,{...canonical,cards:{...canonical.cards,...loaded.cards,'fixture.attack':{...loaded.cards['fixture.attack']!,playKind:'attack',destinationZone:'attack_area'},'fixture.support':{...loaded.cards['fixture.support']!,playKind:'support',destinationZone:'field'}}});
 initializeActionTurns(s);s.round.activePhase='action';s.round.prioritySeat=1;s.eventPlacements=[];s.currentSituationModifiers=[];
 for(const p of s.players){p.locationId=['p1','p2'].includes(p.id)?'shinto':undefined;p.mana=10;p.vp=0;}
 for(const [id,def,owner,zone] of [['aura','fixture.aura','p2','field'],['a','fixture.attack','p1','hand'],['b','fixture.attack','p1','hand'],['support','fixture.support','p1','hand'],['skill','fixture.attack','p1','skill'],['deck','fixture.attack','p1','deck']])s.cards.push({instanceId:id!,definitionId:def!,ownerPlayerId:owner!,controllerPlayerId:owner!,zone:zone as any,visibility:zone==='field'?{scope:'public'}:{scope:'owner_only',ownerPlayerId:owner!}});
 s.abilityRuntime!.cardState.aura={active:true,faceDown:false,playedRound:1};return session;
}
const ctx={controllerId:'p2',sourceCardId:'aura',abilityId:'aura',variables:{},selections:{}};
describe('contracted continuous card mana cost consumer',()=>{
 it('fixture preflight: live source, targets, player positions, phase, resources and round are complete',()=>{
  const session=setup(),s=session.state,ids=new Set(s.players.map(p=>p.id));
  expect(s.round.activePhase).toBe('action');expect(s.round.prioritySeat).toBe(1);expect(s.eventPlacements).toEqual([]);expect(s.currentSituationModifiers).toEqual([]);
  for(const id of ['aura','a','b','support','skill','deck']){const c=s.cards.find(c=>c.instanceId===id)!;expect(ids.has(c.ownerPlayerId)).toBe(true);expect(ids.has(c.controllerPlayerId)).toBe(true);expect(c.zone).toBeDefined();}
  expect(s.abilityRuntime!.cardState.aura).toMatchObject({active:true,faceDown:false,playedRound:1});
  expect(s.players.find(p=>p.id==='p1')!.locationId).toBe('shinto');expect(s.players.find(p=>p.id==='p2')!.locationId).toBe('shinto');
 });
 it('quotes printed cost plus aura, clamps zero and keeps Query readonly',()=>{
  const session=setup(-3),s=session.state;const before=session.getState();
  expect(cardManaCost(s,'a')).toBe(0);expect(cardManaCost(s,'b')).toBe(0);expect(cardManaCost(s,'skill')).toBe(0);expect(cardManaCost(s,'support')).toBe(2);expect(cardManaCost(s,'deck')).toBe(2);
  expect(session.getPlayerView('p1').cards.find(c=>c.instanceId==='a')!.currentManaCost).toBe(cardManaCost(s,'a'));expect(session.getPlayerView('p2').cards.some(c=>c.instanceId==='a')).toBe(false);expect(session.getState()).toEqual(before);
 });
 it('evaluates live position, active source, face-down, source removal and target protection',()=>{
  const session=setup(),s=session.state;expect(cardManaCost(s,'a')).toBe(1);s.players[0]!.locationId='miyama_town';expect(cardManaCost(s,'a')).toBe(2);s.players[0]!.locationId='shinto';
  s.abilityRuntime!.cardState.aura!.faceDown=true;expect(cardManaCost(s,'a')).toBe(2);s.abilityRuntime!.cardState.aura!.faceDown=false;s.abilityRuntime!.cardState.aura!.active=false;expect(cardManaCost(s,'a')).toBe(2);s.abilityRuntime!.cardState.aura!.active=true;
  s.abilityRuntime!.pack.cards['fixture.protection']={...s.abilityRuntime!.pack.cards['fixture.aura']!,id:'fixture.protection',abilities:[{...s.abilityRuntime!.pack.cards['fixture.aura']!.abilities[0]!,ruleModifiers:[{rule:'opponent_ability_effects',operation:'ignore',scope:{subject:'controller'}}]}]};
  s.cards.push({instanceId:'protection',definitionId:'fixture.protection',ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'field',visibility:{scope:'public'}});s.abilityRuntime!.cardState.protection={active:true,faceDown:false};expect(cardManaCost(s,'a')).toBe(2);
  s.cards=s.cards.filter(c=>!['protection','aura'].includes(c.instanceId));expect(cardManaCost(s,'a')).toBe(2);
 });
 it('does not double-count an installed while-active passive, and stacks distinct sources',()=>{
  const session=setup(),s=session.state;executeAbility(s,ctx);expect(cardManaCost(s,'a')).toBe(1);
  s.cards.push({...s.cards.find(c=>c.instanceId==='aura')!,instanceId:'aura2'});s.abilityRuntime!.cardState.aura2={active:true,faceDown:false};expect(cardManaCost(s,'a')).toBe(0);
 });
 it('requires native declaration for phase aura and expires its installed record independently',()=>{
  const session=setup(-1,true),s=session.state;expect(cardManaCost(s,'a')).toBe(2);s.round.prioritySeat=2;
  expect(session.dispatchPlayerAction('p2',{type:'activate_ability',cardInstanceId:'aura',abilityId:'aura'}).ok).toBe(true);expect(cardManaCost(s,'a')).toBe(1);
  const restored=restoreTrustedAuthoringFixtureSession(session.serializeSession());expect(cardManaCost(restored.state,'a')).toBe(1);advanceAbilityPhase(restored.state,'round_start',2);expect(cardManaCost(restored.state,'a')).toBe(2);
 });
 it('quotes the whole native batch, rolls back underfunding, pays its ledger once and rejects repeat confirmation',()=>{
  const session=setup(2),s=session.state;s.players[0]!.mana=8;
  expect(session.dispatchPlayerAction('p1',{type:'skip_normal_move'}).ok).toBe(true);
  for(const id of ['a','b'])expect(session.dispatchPlayerAction('p1',{type:'stage_attack_card',cardInstanceId:id,faceDown:false}).ok).toBe(true);
  s.players[0]!.mana=6;const before=session.getState();expect(session.dispatchPlayerAction('p1',{type:'confirm_staged_attack'}).ok).toBe(false);expect(session.getState()).toEqual(before);
  s.players[0]!.mana=8;expect(session.dispatchPlayerAction('p1',{type:'confirm_staged_attack'}).ok).toBe(true);expect(s.players[0]!.mana).toBe(0);
  for(const id of ['a','b']){expect(s.abilityRuntime!.cardState[id]!.paidManaOnPlay).toBe(4);expect(cardManaCost(s,id)).toBe(2);}
  const paid=session.getState();expect(session.dispatchPlayerAction('p1',{type:'confirm_staged_attack'}).ok).toBe(false);expect(session.getState()).toEqual(paid);
 });
 it('preserves recursive attack filters and rejects corrupted filters at the shared quote reader',()=>{
  const session=setup(),s=session.state;
  const m=s.abilityRuntime!.pack.cards['fixture.aura']!.abilities[0]!.ruleModifiers[0]!;
  m.scope={...scope,constraints:[{type:'and',conditions:[{type:'is_attack'},{type:'not',condition:{type:'has_card_id',cardId:'never'}}]}]};
  expect(cardManaCost(s,'a')).toBe(1);expect(cardManaCost(s,'support')).toBe(2);
  m.scope={...scope,constraints:[{type:'and',conditions:{type:'is_attack'}}]};const before=session.getState();expect(()=>cardManaCost(s,'support')).toThrow();expect(session.getState()).toEqual(before);
 });
 it.each([{scope:{...scope,constraints:[{type:'and',conditions:{type:'is_attack'}}]}},{scope:{...scope,constraints:[{type:'not',condition:null}]}},{conditions:[{type:'and',conditions:{type:'source_active'}}]},{scope:{...scope,constraints:{type:'is_attack'}}},{scope:{...scope,constraints:[null]}},{constraints:[{type:'is_attack'}]},{conditions:{type:'source_active'}},{operation:'set'},{value:0.5},{value:Infinity},{scope:{...scope,zone:['deck']}},{scope:{...scope,location:'anywhere'}}])('rejects unsupported aura shape %j',bad=>{
  const raw=author();Object.assign(raw.cards[0]!.abilities[0]!.ruleModifiers[0]!,bad);expect(loadAuthoringJson(raw).report.length).toBeGreaterThan(0);
 });
});
