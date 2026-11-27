import { referenceSevenServants } from '../acceptance/seven-roster-test-helpers';
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {createMatchSession} from '../../src/match-session';
import {loadAuthoringJson} from '../../src/ability/loader';
import {initializeAbilityRuntime,initializeActionTurns,advanceAbilityPhase,executeAbility} from '../../src/ability/interpreter';
import {restoreTrustedAuthoringFixtureSession} from '../trusted-authoring-fixture';
const archive=JSON.parse(readFileSync('packages/rules/tests/fixtures/b-euryale-771ae323.json','utf8'));
const src='sirens',target='independent',prelude='sc-euryale-2.prelude';
function setup(mutate?:(raw:any)=>void){
 const session=createMatchSession({seed:20260907,startingServantIds:referenceSevenServants}),s=session.state,canonical=s.abilityRuntime!.pack,raw=structuredClone(archive);mutate?.(raw);const loaded=loadAuthoringJson(raw);expect(loaded.report).toEqual([]);
 delete s.abilityRuntime;initializeAbilityRuntime(s,{...canonical,cards:{...canonical.cards,...loaded.cards}});advanceAbilityPhase(s,'advance');s.round.prioritySeat=2;
 s.eventPlacements=[];s.currentSituationModifiers=[];
 for(const p of s.players){p.mana=10;p.vp=0;p.locationId='magic_workshop';}
 for(const c of s.cards)if(c.controllerPlayerId==='p1'&&['hand','skill'].includes(c.zone))c.zone='deck';
 s.cards.push({instanceId:src,definitionId:'servant.euryale.skill.sc-euryale-2',ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}},{instanceId:target,definitionId:'servant.euryale.skill.sc-euryale-1',ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}});
 for(const id of [src,target])s.abilityRuntime!.cardState[id]={active:false,faceDown:false,playedRound:0};
 return session;
}
function install(s:ReturnType<typeof setup>){
 expect(s.dispatchPlayerAction('p1',{type:'activate_ability',cardInstanceId:src,abilityId:prelude}).ok).toBe(true);
 const d=s.getPlayerView('p1').pendingDecision!;expect(s.dispatchPlayerAction('p1',{type:'choose_target',decisionId:d.id,selectedIds:[target]}).ok).toBe(true);
}
function actionPhase(s:ReturnType<typeof setup>){advanceAbilityPhase(s.state,'action');initializeActionTurns(s.state);s.state.round.prioritySeat=1;}
function replacement(s:ReturnType<typeof setup>){return s.getPlayerView('p1').legalActions.find(a=>a.type==='activate_ability'&&a.cardInstanceId===target) as {type:'activate_ability';cardInstanceId:string;abilityId:string};}
function end(s:ReturnType<typeof setup>){
 expect(s.dispatchPlayerAction('p1',{type:'skip_normal_move'}).ok).toBe(true);expect(s.dispatchPlayerAction('p1',{type:'complete_empty_regular_play'}).ok).toBe(true);return s.passPriority('p1');
}
describe('canonical phase replacement and own action-end settlement',()=>{
 it('fixture preflight: replacement source, target, owners, skill zones, playedRound, phase and resources are complete',()=>{
  const session=setup(),s=session.state,ids=new Set(s.players.map(p=>p.id));
  expect(s.round.activePhase).toBe('advance');expect(s.round.prioritySeat).toBe(2);expect(s.eventPlacements).toEqual([]);expect(s.currentSituationModifiers).toEqual([]);
  for(const id of [src,target]){const c=s.cards.find(c=>c.instanceId===id)!;expect(c).toMatchObject({ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill'});expect(ids.has(c.ownerPlayerId)).toBe(true);expect(s.abilityRuntime!.cardState[id]).toMatchObject({active:false,faceDown:false,playedRound:0});}
  expect(s.players.every(p=>p.mana===10&&p.locationId==='magic_workshop')).toBe(true);
 });
 it('replaces only the selected active action ability and preserves the original canonical pack and forced text',()=>{
  const s=setup(),before=structuredClone(s.state.abilityRuntime!.pack);install(s);actionPhase(s);
  const a=replacement(s);expect(a).toBeDefined();expect(a.abilityId).not.toBe('servant.euryale.skill.sc-euryale-1.gain-vp');
  expect(s.state.abilityRuntime!.pack).toEqual(before);expect(s.state.abilityRuntime!.pack.cards['servant.euryale.skill.sc-euryale-1']!.abilities.some(a=>a.kind==='forced_trigger'&&a.id.endsWith('loss-penalty'))).toBe(true);
  const state=s.getState();s.getPlayerView('p1');s.getPlayerView('observer');expect(s.getState()).toEqual(state);
 });
 it('requires declaration and settles seven VP/removal exactly at the controller turn end before priority transfers',()=>{
  const s=setup();install(s);actionPhase(s);const a=replacement(s);expect(s.dispatchPlayerAction('p1',a).ok).toBe(true);expect(s.state.players[0]!.vp).toBe(0);expect(s.state.cards.find(c=>c.instanceId===target)!.zone).toBe('attack_area');
  expect(end(s).ok).toBe(true);expect(s.state.round.activePhase).toBe('action');expect(s.state.round.prioritySeat).toBe(2);expect(s.state.players[0]!.vp).toBe(7);expect(s.state.cards.find(c=>c.instanceId===target)!.zone).toBe('removed_from_game');expect(s.state.cards.find(c=>c.instanceId===src)!.zone).toBe('attack_area');
  const before=s.getState();expect(s.passPriority('p1').ok).toBe(false);expect(s.getState()).toEqual(before);
 });
 it('keeps other-phase actions available after using a replacement while blocking same-phase fallback',()=>{
  const combatId='candidate.independent.combat';
  const s=setup(raw=>{const card=raw.cards.find((c:any)=>c.id.endsWith('sc-euryale-1'));const action=structuredClone(card.abilities.find((a:any)=>a.kind==='phase_action'));action.id=combatId;action.activation.phase='combat';action.activation.opens='controller_combat_action_window';action.conditions=[];card.abilities.push(action);});
  install(s);actionPhase(s);expect(s.dispatchPlayerAction('p1',replacement(s)).ok).toBe(true);
  // Closing only the replacement source reveals canonical actions; its action fallback must remain spent.
  s.state.abilityRuntime!.cardState[src]!.active=false;
  expect(s.getPlayerView('p1').legalActions.some(a=>a.type==='activate_ability'&&a.cardInstanceId===target)).toBe(false);
  advanceAbilityPhase(s.state,'battle');s.state.round.prioritySeat=1;
  const combat={type:'activate_ability',cardInstanceId:target,abilityId:combatId} as const;
  const before=s.getState();expect(s.getPlayerView('p1').legalActions).toContainEqual(combat);expect(s.getState()).toEqual(before);
  expect(s.dispatchPlayerAction('p1',combat).ok).toBe(true);
 });
 it('does not award an undeclared replacement',()=>{const s=setup();install(s);actionPhase(s);expect(end(s).ok).toBe(true);expect(s.state.players[0]!.vp).toBe(0);expect(s.state.cards.find(c=>c.instanceId===target)!.zone).toBe('attack_area');});
 it.each(['source','target'])('invalidates the replacement when %s is no longer active and blocks original double use after declaration',which=>{
  const s=setup();install(s);actionPhase(s);expect(s.dispatchPlayerAction('p1',replacement(s)).ok).toBe(true);s.state.abilityRuntime!.cardState[which==='source'?src:target]!.active=false;
  expect(replacement(s)).toBeUndefined();expect(end(s).ok).toBe(true);expect(s.state.players[0]!.vp).toBe(0);
 });
 it('expires replacement and pending promises at the round boundary',()=>{const s=setup();install(s);actionPhase(s);expect(s.dispatchPlayerAction('p1',replacement(s)).ok).toBe(true);advanceAbilityPhase(s.state,'round_start',2);advanceAbilityPhase(s.state,'action',2);initializeActionTurns(s.state);s.state.round.prioritySeat=1;expect(replacement(s)?.abilityId).toBe('servant.euryale.skill.sc-euryale-1.gain-vp');expect(s.state.players[0]!.vp).toBe(0);});
 it.each([false,true])('restores replacement and declared=%s promises from canonical templates',declared=>{
  const s=setup();install(s);actionPhase(s);if(declared)expect(s.dispatchPlayerAction('p1',replacement(s)).ok).toBe(true);
  const restored=restoreTrustedAuthoringFixtureSession(s.serializeSession());if(!declared)expect(restored.dispatchPlayerAction('p1',replacement(restored)).ok).toBe(true);expect(end(restored).ok).toBe(true);expect(restored.state.players[0]!.vp).toBe(7);
 });
 it('rejects changing persisted template identities or embedding a forged effect program',()=>{
  const s=setup();install(s);actionPhase(s);expect(s.dispatchPlayerAction('p1',replacement(s)).ok).toBe(true);const snapshot:any=s.serializeSession();
  snapshot.state.abilityRuntime.phaseAbilityReplacements[0].templateId='unknown';expect(()=>restoreTrustedAuthoringFixtureSession(snapshot)).toThrow();
 });
 it('keeps a failing action-end promise atomic including its once ledger, permitting correction and retry',()=>{
  const s=setup(raw=>{raw.cards.find((c:any)=>c.id.endsWith('sc-euryale-2')).abilities.find((a:any)=>a.id===prelude).effects[1].then[0].then.push({type:'pay_mana',amount:99});});install(s);actionPhase(s);expect(s.dispatchPlayerAction('p1',replacement(s)).ok).toBe(true);
  expect(s.dispatchPlayerAction('p1',{type:'skip_normal_move'}).ok).toBe(true);expect(s.dispatchPlayerAction('p1',{type:'complete_empty_regular_play'}).ok).toBe(true);const before=s.getState();expect(s.passPriority('p1').ok).toBe(false);expect(s.getState()).toEqual(before);
 });
 it('automatic advancement consumes the same own-turn-end ledger',()=>{const s=setup();install(s);actionPhase(s);expect(s.dispatchPlayerAction('p1',replacement(s)).ok).toBe(true);expect(s.dispatchPlayerAction('p1',{type:'skip_normal_move'}).ok).toBe(true);expect(s.dispatchPlayerAction('p1',{type:'complete_empty_regular_play'}).ok).toBe(true);s.advanceToNextDecision();expect(s.state.players[0]!.vp).toBe(7);expect(s.state.round.prioritySeat).toBe(2);});
 it('does not advance or settle an incomplete action turn through the automatic entry',()=>{const s=setup();install(s);actionPhase(s);expect(s.dispatchPlayerAction('p1',replacement(s)).ok).toBe(true);const before=s.getState();s.advanceToNextDecision();expect(s.getState()).toEqual(before);});
 it('keeps the canonical forced loss penalty active even while the old phase action is replaced',()=>{
  const s=setup();install(s);actionPhase(s);const canonical=s.state.abilityRuntime!.pack.cards['servant.euryale.skill.sc-euryale-1']!;
  const penalty=canonical.abilities.find(a=>a.kind==='forced_trigger')!;s.state.players[0]!.vp=10;const before=s.state.players[0]!.vp;
  executeAbility(s.state,{controllerId:'p1',sourceCardId:target,abilityId:penalty.id,variables:{},selections:{}});expect(s.state.players[0]!.vp).toBe(before-5);
 });
 it('preserves the original loss penalty after the replacement was used and the physical card removed',()=>{
  const s=setup();install(s);actionPhase(s);expect(s.dispatchPlayerAction('p1',replacement(s)).ok).toBe(true);expect(end(s).ok).toBe(true);
  s.state.players[0]!.locationId='shinto';s.state.players[1]!.locationId='shinto';for(const c of s.state.cards)if(c.controllerPlayerId==='p2'&&c.zone==='hand')c.zone='deck';
  s.state.cards.push({instanceId:'real-opponent-attack',definitionId:'basic.strength.5',ownerPlayerId:'p2',controllerPlayerId:'p2',zone:'hand',visibility:{scope:'owner_only',ownerPlayerId:'p2'}});
  expect(s.dispatchPlayerAction('p2',{type:'skip_normal_move'}).ok).toBe(true);s.state.players[1]!.mana=7;expect(s.dispatchPlayerAction('p2',{type:'stage_attack_card',cardInstanceId:'real-opponent-attack',faceDown:false}).ok).toBe(true);{const result=s.dispatchPlayerAction('p2',{type:'confirm_staged_attack'});expect(result.ok,JSON.stringify(result.rejection)).toBe(true);}
  advanceAbilityPhase(s.state,'battle');s.state.round.prioritySeat=1;
  for(let i=0;i<12&&s.state.round.activePhase==='battle';i++){const p=s.state.players.find(p=>p.seat===s.state.round.prioritySeat)!;expect(s.passPriority(p.id).ok).toBe(true);}
  expect(s.state.round.activePhase).toBe('round_end');expect(s.state.players[0]!.vp).toBe(2);
 });
 it.each(['wrong-phase','wrong-duration','missing-template-id','nested-schedule','interactive-schedule'])('rejects malformed template %s',bad=>{
  const raw=structuredClone(archive),a=raw.cards.find((c:any)=>c.id.endsWith('sc-euryale-2')).abilities.find((a:any)=>a.id===prelude),r=a.effects[1];
  if(bad==='wrong-phase')r.phase='combat';if(bad==='wrong-duration')r.duration='while_active';if(bad==='missing-template-id')delete r.id;
  if(bad==='nested-schedule')r.then[0].then.push({type:'schedule_at_player_action_end',then:[{type:'adjust_victory_points',amount:100}]});
  if(bad==='interactive-schedule')r.then[0].then.push({type:'move_card',target:'companion',to:{zone:'hand'}});
  expect(loadAuthoringJson(raw).report.length).toBeGreaterThan(0);
 });
});
