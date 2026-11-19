import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {createMatchSession} from '../../src/match-session';
import {loadAuthoringJson} from '../../src/ability/loader';
import {initializeAbilityRuntime,collectTriggeredAbilities} from '../../src/ability/interpreter';
import {stepGameLoop} from '../../src/core/game-loop';
import {restoreTrustedAuthoringFixtureSession} from '../trusted-authoring-fixture';

const archive=JSON.parse(readFileSync('packages/rules/tests/fixtures/b-siegfried-6d08f12b.json','utf8'));
const armor='servant.siegfried.skill.sc-siegfried-2';
function setup(engaged=false,revealed=true){
 const session=createMatchSession({seed:20260907}),s=session.state,canonical=s.abilityRuntime!.pack;
 const pack=loadAuthoringJson(archive);expect(pack.report).toEqual([]);
 s.cards=[];s.eventPlacements=[];s.currentSituationModifiers=[];
 for(const p of s.players){p.locationId='magic_workshop';p.mana=20;}
 s.players[0]!.locationId='miyama_town';if(engaged)s.players[2]!.locationId='miyama_town';
 delete s.abilityRuntime;initializeAbilityRuntime(s,{...canonical,cards:{...canonical.cards,...pack.cards}});
 s.cards.push({instanceId:'armor',definitionId:armor,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'attack_area',visibility:{scope:'public'}});
 s.abilityRuntime!.cardState.armor={active:true,faceDown:false,playedRound:1};
 if(revealed)s.abilityRuntime!.revealedServants.push('p1');
 s.round.activePhase='action';s.round.prioritySeat=2;
 return session;
}
const common={conditions:[],targets:[],effects:[],cost:[],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}};
function addFixture(session:ReturnType<typeof setup>,ability:any,owner='p2'){
 const id='fixture.preentry.'+ability.id;
 const loaded=loadAuthoringJson({schemaVersion:'fd-card-authoring-v1',id:'fixture.preentry',name:'explicit consumer probes',cards:[{id,name:id,cardType:'servant_skill',cardFace:{cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[{...common,...ability}]}]});expect(loaded.report).toEqual([]);
 Object.assign(session.state.abilityRuntime!.pack.cards,loaded.cards);
 session.state.cards.push({instanceId:id,definitionId:id,ownerPlayerId:owner,controllerPlayerId:owner,zone:'field',visibility:{scope:'public'}});
 session.state.abilityRuntime!.cardState[id]={active:true,faceDown:false,playedRound:1};return id;
}
const locationTarget={id:'destination',type:'location',count:{min:1,max:1},constraints:[{type:'any_enabled_location'},{type:'not_location_kind',locationKind:'workshop'}]};
const active=(session:ReturnType<typeof setup>)=>session.state.abilityRuntime!.cardState.armor!.active;
const move={type:'normal_move',locationId:'miyama_town'} as const;
describe('exact frozen Armor pre-entry engagement',()=>{
 it('strictly loads every card in the frozen archive',()=>{const loaded=loadAuthoringJson(archive);expect(loaded.report).toEqual([]);expect(Object.keys(loaded.cards)).toHaveLength(archive.cards.length);});
 it.each([false,true])('native MatchSession incoming move; prior engagement=%s',engaged=>{
  const session=setup(engaged),before=session.getState();session.getPlayerView('p2');expect(session.getState()).toEqual(before);
  const result=session.dispatchPlayerAction('p2',move);expect(result.ok,JSON.stringify(result.rejection)).toBe(true);
  expect(session.state.players[1]!.locationId).toBe('miyama_town');expect(active(session)).toBe(!engaged);
  const committed=session.getState();expect(session.dispatchPlayerAction('p2',move).ok).toBe(false);expect(session.getState()).toEqual(committed);
 });
 it.each([false,true])('core game-loop real movement; prior engagement=%s',engaged=>{
  const session=setup(engaged);const result=stepGameLoop(session.state,{action:{type:'move',playerId:'p2',to:'miyama_town',movementKind:'effect'}});
  expect(result.nextState.players[1]!.locationId).toBe('miyama_town');expect(result.nextState.abilityRuntime!.cardState.armor!.active).toBe(!engaged);
 });
 it('retains original reveal and active-source requirements',()=>{
  const hidden=setup(true,false);expect(hidden.dispatchPlayerAction('p2',move).ok).toBe(true);expect(active(hidden)).toBe(true);
  const closed=setup(true);closed.state.abilityRuntime!.cardState.armor!.active=false;expect(closed.dispatchPlayerAction('p2',move).ok).toBe(true);expect(active(closed)).toBe(false);
 });
 it('invalid move changes no state, ledger or processed events',()=>{
  const session=setup(true),before=session.getState();expect(session.dispatchPlayerAction('p2',{type:'normal_move',locationId:'not-a-location'}).ok).toBe(false);expect(session.getState()).toEqual(before);
 });
 it('movement permission to ignore engagement does not erase combat engagement',()=>{
  const session=setup(true);session.state.ruleOverrides={...session.state.ruleOverrides,ignoreEngagementForMovementPlayerIds:['p1']};
  expect(session.dispatchPlayerAction('p2',move).ok).toBe(true);expect(active(session)).toBe(false);
 });
 it('legacy events without snapshot fail closed for this new condition',()=>{
  const session=setup(true);expect(()=>collectTriggeredAbilities(session.state,{id:'historical',type:'after_controller_enters_location',playerId:'p2',locationId:'miyama_town'})).toThrow();
 });
 it('signed restore retains ability behavior before the native command',()=>{
  const session=restoreTrustedAuthoringFixtureSession(setup(true).serializeSession());expect(session.dispatchPlayerAction('p2',move).ok).toBe(true);expect(active(session)).toBe(false);
 });
 it.each(['extra-key','wrong-trigger','effect-position'])('rejects malformed new field: %s',variant=>{
  const input=structuredClone(archive),a=input.cards.find((c:any)=>c.id===armor).abilities.find((a:any)=>a.id.endsWith('close-on-entry'));
  const c=a.conditions.find((c:any)=>c.type==='event_controller_was_engaged_before_entry');
  if(variant==='extra-key')c.value=true;
  if(variant==='wrong-trigger')a.activation.trigger='round_end';
  if(variant==='effect-position'){a.conditions=a.conditions.filter((entry:any)=>entry!==c);a.effects.push({type:'event_controller_was_engaged_before_entry'});}
  expect(loadAuthoringJson(input).report.length).toBeGreaterThan(0);
 });
 it.each(['direct','resolution'])('native %s movement effect snapshots engagement before mutation',route=>{
  const session=setup(true),id=addFixture(session,{id:'move',kind:'phase_action',printedClause:'disclosed movement probe',activation:{phase:'action',opens:'controller_action_window',requiresSourceState:'active'},targets:route==='resolution'?[locationTarget]:[],effects:[{type:'move_player',player:'controller',to:route==='resolution'?'destination':'miyama_town'}]});
  const result=session.dispatchPlayerAction('p2',{type:'activate_ability',cardInstanceId:id,abilityId:'move'});expect(result.ok,JSON.stringify(result.rejection)).toBe(true);
  if(route==='resolution'){const d=session.state.abilityRuntime!.pendingDecision!;expect(d).toBeDefined();expect(session.dispatchPlayerAction('p2',{type:'choose_target',decisionId:d.id,selectedIds:['miyama_town']}).ok).toBe(true);}
  expect(session.state.players[1]!.locationId).toBe('miyama_town');expect(active(session)).toBe(false);
 });
 it('persists real movement snapshot through a pending choice and signed restore',()=>{
  const session=setup(true);
  addFixture(session,{id:'entry-choice',kind:'forced_trigger',printedClause:'disclosed event suspension',activation:{trigger:'after_controller_enters_location',requiresSourceState:'active'},conditions:[{type:'event_player_is_controller'}],targets:[{id:'beneficiary',type:'player',constraints:[{type:'not_controller'}],count:{min:1,max:1}}],effects:[{type:'adjust_victory_points',targetRef:'beneficiary',amount:1}]});
  expect(session.dispatchPlayerAction('p2',move).ok).toBe(true);
  const d=session.state.abilityRuntime!.pendingDecision!;expect(d).toBeDefined();
  expect(d.context.event).toMatchObject({type:'after_controller_enters_location',preEntryEngagedPlayerIds:['p1','p3']});
  const restored=restoreTrustedAuthoringFixtureSession(session.serializeSession()),snapshot=restored.getState();
  restored.getPlayerView('p2');expect(restored.getState()).toEqual(snapshot);
  expect(restored.dispatchPlayerAction('p2',{type:'choose_target',decisionId:d.id,selectedIds:['p3']}).ok).toBe(true);
  expect(active(restored)).toBe(false);
 });

 it('native Ruler seal command movement uses the same pre-entry engagement fact',()=>{
  const session=setup(true);session.state.round.prioritySeat=4;
  const parent=addFixture(session,{id:'ruler-bind',kind:'phase_action',printedClause:'disclosed existing Ruler binding',activation:{phase:'action',opens:'controller_action_window'},targets:[{id:'bound_players',type:'player',count:{min:2,max:2},constraints:[{type:'not_controller'},{type:'least_ruler_binding_count'}]}],effects:[{type:'grant_ruler_seals',target:'bound_players'},{type:'ruler_copy_steal_guard',policy:'forbid_source_and_effects'}],limit:{type:'per_game',uses:3,scope:'this_card'}},'p4');
  const use=addFixture(session,{id:'ruler-use',kind:'phase_action',printedClause:'disclosed existing Ruler move',activation:{phase:'action',opens:'controller_action_window'},targets:[{id:'ruler_seal_option',type:'choice',count:{min:1,max:1},options:[{id:'move'},{id:'lock_movement'},{id:'free_play_reward'}]},{id:'bound_player',type:'player',count:{min:1,max:1},constraints:[{type:'bound_by_controller_ruler_seal'}]}],effects:[{type:'use_ruler_seal',target:'bound_player',option:'ruler_seal_option',moveDestinations:['miyama_town','shinto'],rewardVp:2}]},'p4');
  const choose=(ids:string[])=>{const d=session.state.abilityRuntime!.pendingDecision!;expect(d).toBeDefined();const r=session.dispatchPlayerAction(d.controllerId,{type:'choose_target',decisionId:d.id,selectedIds:ids});expect(r.ok,JSON.stringify(r.rejection)).toBe(true);};
  expect(session.dispatchPlayerAction('p4',{type:'activate_ability',cardInstanceId:parent,abilityId:'ruler-bind'}).ok).toBe(true);choose(['p2','p5']);
  expect(session.dispatchPlayerAction('p4',{type:'activate_ability',cardInstanceId:use,abilityId:'ruler-use'}).ok).toBe(true);choose(['move']);choose(['p2']);choose(['miyama_town']);
  expect(session.state.players[1]!.locationId).toBe('miyama_town');expect(active(session)).toBe(false);
 });

 it('ignores client-supplied snapshot fields on movement commands',()=>{
  const session=setup(false);expect(session.dispatchPlayerAction('p2',{...move,preEntryEngagedPlayerIds:['p1']} as any).ok).toBe(true);expect(active(session)).toBe(true);
 });
 it('self movement and non-battlefield entry retain the original boundaries',()=>{
  const self=setup(false);self.state.round.prioritySeat=1;expect(self.dispatchPlayerAction('p1',{type:'normal_move',locationId:'shinto'}).ok).toBe(true);expect(active(self)).toBe(true);
  const workshop=setup(false);workshop.state.players[0]!.locationId='magic_workshop';expect(collectTriggeredAbilities(workshop.state,{id:'nonbattlefield-negative-probe',type:'after_controller_enters_location',playerId:'p2',locationId:'magic_workshop',preEntryEngagedPlayerIds:['p1']})).toEqual([]);expect(active(workshop)).toBe(true);
 });
 it('deployment into an already occupied battlefield is not a movement event',()=>{
  const session=setup(true);session.state.round.activePhase='advance';delete session.state.players[1]!.locationId;
  const result=session.dispatchPlayerAction('p2',{type:'deploy_player',locationId:'miyama_town'});expect(result.ok,JSON.stringify(result.rejection)).toBe(true);expect(active(session)).toBe(true);
 });
 it.each([null,['p1','p1'],['unknown-player'],['p1',2]])('rejects corrupt snapshot %j at signed pending restore',ids=>{
  const session=setup(true);addFixture(session,{id:'entry-choice',kind:'forced_trigger',printedClause:'disclosed event suspension',activation:{trigger:'after_controller_enters_location',requiresSourceState:'active'},conditions:[{type:'event_player_is_controller'}],targets:[{id:'beneficiary',type:'player',constraints:[{type:'not_controller'}],count:{min:1,max:1}}],effects:[{type:'adjust_victory_points',targetRef:'beneficiary',amount:1}]});
  expect(session.dispatchPlayerAction('p2',move).ok).toBe(true);const snapshot=session.serializeSession();(snapshot.state.abilityRuntime!.pendingDecision!.context.event as any).preEntryEngagedPlayerIds=ids;
  expect(()=>restoreTrustedAuthoringFixtureSession(snapshot)).toThrow();
 });

});
