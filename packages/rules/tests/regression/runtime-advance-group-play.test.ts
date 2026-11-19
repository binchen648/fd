import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {createMatchSession} from '../../src/match-session';
import {loadAuthoringJson} from '../../src/ability/loader';
import {initializeAbilityRuntime,advanceAbilityPhase,executeAbility} from '../../src/ability/interpreter';
import {restoreTrustedAuthoringFixtureSession} from '../trusted-authoring-fixture';
const frozen=JSON.parse(readFileSync('packages/rules/tests/fixtures/b-euryale-771ae323.json','utf8'));
const src='group-source',target='group-companion',aid='sc-euryale-2.prelude';
function raw(){
 const source=structuredClone(frozen.cards.find((c:any)=>c.id.endsWith('sc-euryale-2')));
 const companion=structuredClone(frozen.cards.find((c:any)=>c.id.endsWith('sc-euryale-1')));
 // Exact group head and printed card data; replacement/scheduler are separately unsupported prerequisites.
 source.abilities=source.abilities.filter((a:any)=>a.id===aid);
 source.abilities[0].effects=source.abilities[0].effects.slice(0,1);
 return {schemaVersion:'fd-card-authoring-v1',id:'fixture.group-component',name:'group component',cards:[source,companion]};
}
function setup(mana=10,zone='skill',mutate?:(p:ReturnType<typeof raw>)=>void){
 const session=createMatchSession({seed:20260907}),s=session.state,canonical=s.abilityRuntime!.pack,pack=raw();mutate?.(pack);
 const loaded=loadAuthoringJson(pack);expect(loaded.report).toEqual([]);delete s.abilityRuntime;initializeAbilityRuntime(s,{...canonical,cards:{...canonical.cards,...loaded.cards}});
 advanceAbilityPhase(s,'advance');s.round.prioritySeat=1;s.eventPlacements=[];s.currentSituationModifiers=[];
 for(const p of s.players){p.locationId='magic_workshop';p.mana=10;}s.players.find(p=>p.id==='p7')!.mana=mana;
 for(const c of s.cards)if(c.controllerPlayerId==='p7'&&['hand','skill'].includes(c.zone))c.zone='deck';
 s.cards.push({instanceId:src,definitionId:pack.cards[0].id,ownerPlayerId:'p7',controllerPlayerId:'p7',zone,visibility:{scope:'owner_only',ownerPlayerId:'p7'}},{instanceId:target,definitionId:pack.cards[1].id,ownerPlayerId:'p7',controllerPlayerId:'p7',zone,visibility:{scope:'owner_only',ownerPlayerId:'p7'}});
 for(const id of [src,target])s.abilityRuntime!.cardState[id]={active:false,faceDown:false,playedRound:0};return session;
}
const action=(s:ReturnType<typeof setup>)=>s.dispatchPlayerAction('p7',{type:'activate_ability',cardInstanceId:src,abilityId:aid});
const choose=(s:ReturnType<typeof setup>,ids=[target])=>s.dispatchPlayerAction('p7',{type:'choose_target',decisionId:s.getPlayerView('p7').pendingDecision!.id,selectedIds:ids});
describe('approved advance grouped native play',()=>{
 it('fixture preflight: grouped source, companion, payment, owner, zones, round and phase are complete',()=>{
  const session=setup(),s=session.state,ids=new Set(s.players.map(p=>p.id));
  expect(s.round.activePhase).toBe('advance');expect(s.round.prioritySeat).toBe(1);expect(s.eventPlacements).toEqual([]);expect(s.currentSituationModifiers).toEqual([]);
  for(const id of [src,target]){const c=s.cards.find(c=>c.instanceId===id)!;expect(c).toMatchObject({ownerPlayerId:'p7',controllerPlayerId:'p7',zone:'skill'});expect(ids.has(c.ownerPlayerId)).toBe(true);expect(s.abilityRuntime!.cardState[id]).toMatchObject({active:false,faceDown:false,playedRound:0});}
  expect(s.players.find(p=>p.id==='p7')!.mana).toBe(10);
 });
 it('admits the exact frozen group component only',()=>expect(loadAuthoringJson(raw()).report).toEqual([]));
 it.each(['phase','includeSource','ignorePriority','ignoreRequirements','count'] as const)('rejects malformed %s',key=>{
  const p=raw(),a=p.cards[0].abilities[0],e=a.effects[0];
  if(key==='count')a.targets[0].count.max=2;else e[key]=key==='phase'?'action':key==='ignoreRequirements'?['skill_zone_mana_at_least']:false;
  expect(loadAuthoringJson(p).report.length).toBeGreaterThan(0);
 });
 it('plays both cards out of priority, waiving only the first-half restriction, and charges actual printed cost once',()=>{
  const session=setup();const before=session.getState();expect(session.getPlayerView('p7').legalActions).toContainEqual(expect.objectContaining({type:'activate_ability',cardInstanceId:src,abilityId:aid}));expect(session.getState()).toEqual(before);
  expect(action(session).ok).toBe(true);expect(session.getPlayerView('p7').pendingDecision!.candidates).toEqual([target]);expect(choose(session).ok).toBe(true);
  expect(session.state.players.find(p=>p.id==='p7')!.mana).toBe(6);expect(session.state.round.prioritySeat).toBe(1);
  for(const id of [src,target])expect(session.state.cards.find(c=>c.instanceId===id)!.zone).toBe('attack_area');
  expect(session.state.abilityRuntime!.cardState[src]!.paidManaOnPlay).toBe(4);expect(session.state.abilityRuntime!.cardState[target]!.paidManaOnPlay).toBe(0);
  for(const id of [src,target])expect(session.state.abilityRuntime!.cardState[id]).toMatchObject({active:true,faceDown:false,playedRound:session.state.round.roundNumber});
  expect(session.getPlayerView('p7').playSummary!.cardsPlayedThisRound).toBe(2);
  const end=session.getState();expect(action(session).ok).toBe(false);expect(session.getState()).toEqual(end);
 });
 it.each([0,2,7])('does not open a forced choice when skill-zone mana is %i',mana=>{
  const session=setup(mana);const before=session.getState();expect(action(session).ok).toBe(false);expect(session.getPlayerView('p7').pendingDecision).toBeUndefined();expect(session.getState()).toEqual(before);
 });
 it('preflights total cost even when each card is individually affordable',()=>{
  const session=setup(8,'hand',p=>{p.cards[0].cardFace.cost=5;p.cards[1].cardFace.cost=4;});const before=session.getState();expect(action(session).ok).toBe(false);expect(session.getState()).toEqual(before);
 });
 it('keeps the two-card cost snapshot fixed before the source activates its aura',()=>{
  const session=setup(8,'skill',p=>{const aura=structuredClone(frozen.cards.find((c:any)=>c.id.endsWith('sc-euryale-2')).abilities[0]);p.cards[0].abilities.unshift(aura);});
  expect(action(session).ok).toBe(true);expect(choose(session).ok).toBe(true);expect(session.state.players.find(p=>p.id==='p7')!.mana).toBe(4);
 });
 it('allows a mandatory target snapshot to restore, rejects cancellation and pays only after valid selection',()=>{
  const session=setup();expect(action(session).ok).toBe(true);const before=session.getState();expect(choose(session,[]).ok).toBe(false);expect(session.getState()).toEqual(before);
  const restored=restoreTrustedAuthoringFixtureSession(session.serializeSession());expect(choose(restored).ok).toBe(true);expect(restored.state.players.find(p=>p.id==='p7')!.mana).toBe(6);
 });
 it.each(['mana','zone','controller','phase'])('rechecks changed %s at actual group dispatch',changed=>{
  const session=setup();expect(action(session).ok).toBe(true);const s=session.state;
  if(changed==='mana')s.players.find(p=>p.id==='p7')!.mana=2;
  if(changed==='zone')s.cards.find(c=>c.instanceId===target)!.zone='discard';
  if(changed==='controller')s.cards.find(c=>c.instanceId===target)!.controllerPlayerId='p2';
  if(changed==='phase')s.round.activePhase='action';
  const before=session.getState();expect(choose(session).ok).toBe(false);expect(session.getState()).toEqual(before);
 });
 it('keeps ordinary card commands subject to normal phase and priority',()=>{
  const session=setup();const before=session.getState();expect(session.dispatchPlayerAction('p7',{type:'play_card',cardInstanceId:target}).ok).toBe(false);expect(session.getState()).toEqual(before);
 });
 it('rolls back a native preselected group when its suffix fails',()=>{
  const session=setup(10,'skill',p=>p.cards[0].abilities[0].effects.push({type:'pay_mana',amount:99}));const before=session.getState();expect(()=>executeAbility(session.state,{controllerId:'p7',sourceCardId:src,abilityId:aid,selections:{companion:[target]},variables:{}})).toThrow();expect(session.getState()).toEqual(before);
 });
 it('projects the full two-card payment as the companion choice budget, privately',()=>{
  const session=setup();expect(action(session).ok).toBe(true);
  expect(session.getPlayerView('p7').pendingDecision!.playBudget).toEqual({mana:10,costs:{[target]:4}});
  expect(session.getPlayerView('p1').pendingDecision).toBeUndefined();
 });
 it('rejects a nested group from an unrelated phase action instead of whitelisting an unconsumed exception',()=>{
  const p=raw(),a=p.cards[0].abilities[0];a.kind='phase_action';a.activation={phase:'action',opens:'controller_action_window'};
  a.effects=[{type:'branch',branches:[{else:true,then:a.effects}]}];expect(loadAuthoringJson(p).report.length).toBeGreaterThan(0);
 });
});
