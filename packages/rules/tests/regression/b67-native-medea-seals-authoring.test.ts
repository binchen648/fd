import { resolveBattlefield } from '../../src/core/combat-resolver';
import {beforeAll,afterAll,describe,expect,it,vi} from 'vitest';
import {loadPlaytestContentPack,compileLoadedPlaytestPack} from '../../../content/src/playtest-pack-loader';
import {compileExecutableCardPack} from '../../src/ability/executable-card-pack';
import {advanceAbilityPhase,initializeActionTurns} from '../../src/ability/interpreter';
import {effectDefeatedPlayerIds} from '../../src/ability/effect-defeat';
import type {MatchSession} from '../../src/match-session';
const library=compileLoadedPlaytestPack(loadPlaytestContentPack('packages/rules/tests/fixtures/b-medea-rule-breaker-pack.json',{workspaceRoot:process.cwd()})).library;const rules=compileExecutableCardPack(library);let create:(c:any)=>MatchSession;let restore:(s:any)=>MatchSession;
beforeAll(async()=>{vi.doMock('../../../../data/generated/fd-playtest-v1.content-library.json',()=>({default:{...library,rules}}));const m=await import('../../src/match-session');create=m.createMatchSession;restore=m.restoreMatchSession;});
afterAll(()=>vi.doUnmock('../../../../data/generated/fd-playtest-v1.content-library.json'));
const use=(id:string)=>({type:'activate_ability',cardInstanceId:id,abilityId:'sc-medea-np.rule-breaker'} as const);
function finishInitialRevealWindows(session:MatchSession){for(let i=0;i<20;i++){const w=session.state.abilityRuntime!.responseWindows[0];if(!w)break;const r=session.dispatchPlayerAction(w.controllerId,{type:'decline_this_window',windowId:w.id});expect(r.ok,JSON.stringify(r.rejection)).toBe(true);}expect(session.state.abilityRuntime!.responseWindows).toEqual([]);}
function fixture(seals=1){const session=create({seed:131,humanPlayerIds:Array.from({length:7},(_,i)=>`p${i+1}`)});finishInitialRevealWindows(session);const s=session.state;const actor=s.players.find(p=>p.servantCardId==='servant.medea')!.id;const target=s.players.find(p=>p.id!==actor&&p.masterCardId!=='master.shinji')!.id;const source=s.cards.find(c=>c.ownerPlayerId===actor&&c.definitionId==='servant.medea.skill.sc-medea-np')!;const companion=s.cards.find(c=>c.ownerPlayerId===actor&&c.zone==='hand'&&typeof rules.cards[c.definitionId]!.cardFace.cost==='number'&&rules.cards[c.definitionId]!.cardFace.cost===0)!;expect(source.zone).toBe('skill');expect(companion).toBeDefined();expect(s.abilityRuntime!.pendingDecision).toBeUndefined();expect(s.abilityRuntime!.responseWindows).toEqual([]);expect(s.abilityRuntime!.hostRequests).toEqual([]);
 // Controlled action start; actual constructor cards, definitions and roles stay untouched.
 s.players.forEach(p=>{p.mana=8;p.vp=0;p.locationId=[actor,target].includes(p.id)?'shinto':'magic_workshop';});s.players.find(p=>p.id===target)!.commandSpells=seals;s.eventPlacements=[];s.currentSituationModifiers=[];s.modeState={...s.modeState,masterDirectives:[],cardPlayForbids:[],closedLocations:[],terrainAssignments:{},eventBattleRules:[],participationEvents:[]};advanceAbilityPhase(s,'action',3);initializeActionTurns(s);for(let i=0;i<7&&session.projectToClientState().priorityPlayerId!==actor;i++){const r=session.passPriority(session.projectToClientState().priorityPlayerId);expect(r.ok,JSON.stringify(r.rejection)).toBe(true);}expect(session.projectToClientState().priorityPlayerId).toBe(actor);return {session,actor,target,id:source.instanceId,companion:companion.instanceId};}
function ready(seals=1){const f=fixture(seals),{session,actor,id,companion}=f;expect(session.dispatchPlayerAction(actor,{type:'skip_normal_move'}).ok).toBe(true);for(const cardInstanceId of [id,companion]){const r=session.dispatchPlayerAction(actor,{type:'stage_attack_card',cardInstanceId,faceDown:false});expect(r.ok,JSON.stringify(r.rejection)).toBe(true);}let r;try{r=session.dispatchPlayerAction(actor,{type:'confirm_staged_attack'});}catch(error){throw new Error('Actual native confirm threw; observed state '+JSON.stringify({actor,mana:session.state.players.find(p=>p.id===actor)!.mana,sourceZone:session.state.cards.find(c=>c.instanceId===id)!.zone,paid:session.state.abilityRuntime!.cardState[id]?.paidManaOnPlay,pending:session.state.abilityRuntime!.pendingDecision?.id,error:String(error)}),{cause:error});}expect(r.ok,JSON.stringify(r.rejection)).toBe(true);expect(session.state.players.find(p=>p.id===actor)!.mana).toBe(5);expect(session.state.abilityRuntime!.cardState[id]!.paidManaOnPlay).toBe(3);expect(session.dispatchPlayerAction(actor,use(id)).ok).toBe(true);const d=session.state.abilityRuntime!.pendingDecision!;expect(d.candidates).toContain(f.target);return {...f,decisionId:d.id};}
describe('Actual A native Rule Breaker typed ledger from isolated B Rule Breaker',()=>{
 it.each([0,1,2])('settles originalseals=%i through a restored actual target decision',seals=>{const {session,actor,target,id,decisionId}=ready(seals);const restored=restore(JSON.parse(JSON.stringify(session.serializeSession())));let before=restored.getState();expect(restored.dispatchPlayerAction(target,{type:'choose_target',decisionId,selectedIds:[target]}).ok).toBe(false);expect(restored.getState()).toEqual(before);const cmd={type:'choose_target',decisionId,selectedIds:[target]} as const;const r=restored.dispatchPlayerAction(actor,cmd);expect(r.ok,JSON.stringify(r.rejection)).toBe(true);expect(restored.state.players.find(p=>p.id===target)!.commandSpells).toBe(Math.max(0,seals-1));expect(effectDefeatedPlayerIds(restored.state,'shinto').includes(target)).toBe(seals<=1);const facts=restored.state.abilityRuntime!.effectDefeats??[];expect(facts.some(f=>f.sourceCardId===id&&f.targetPlayerIds.includes(target))).toBe(seals<=1);const modifiers=restored.state.abilityRuntime!.ongoingEffects.flatMap(e=>e.ruleModifiers).filter(m=>m.sourceCardId===id&&m.definition.rule==='battle.totalPower');expect(modifiers.map(m=>m.definition.value)).toEqual(seals===0?[10]:[]);before=restored.getState();expect(restored.dispatchPlayerAction(actor,cmd).ok).toBe(false);expect(restored.dispatchPlayerAction(actor,use(id)).ok).toBe(false);for(const viewer of [actor,target,'spectator'])expect(restored.getPlayerView(viewer).cards.find(c=>c.instanceId===id)!.definitionId).toBe('servant.medea.skill.sc-medea-np');expect(restored.getState()).toEqual(before);});
 it('projects and restores applied defeat, then excludes the higher-Power target from battle', () => {
  const { session, actor, target, decisionId } = ready(1);
  expect(session.dispatchPlayerAction(actor, { type: 'choose_target', decisionId, selectedIds: [target] }).ok).toBe(true);
  const restored = restore(JSON.parse(JSON.stringify(session.serializeSession())));
  expect(restored.getPlayerView(actor).players.find(player => player.id === target)?.effectDefeated).toBe(true);
  const result = resolveBattlefield(restored.state, {
    battlefieldId: 'shinto',
    participants: [{ playerId: actor, totalPower: 5 }, { playerId: target, totalPower: 30 }],
  }).nextState.battleResults.at(-1);
  expect(result?.winnerPlayerIds).toEqual([actor]);
  expect(result?.excludedPlayerIds).toContain(target);
  advanceAbilityPhase(restored.state, 'round_end');
  expect(restored.getPlayerView(actor).players.find(player => player.id === target)?.effectDefeated).toBeUndefined();
 });
 it('produces a zero-winner battle if every participant has an assigned defeat', () => {
  const { session, actor, target, decisionId } = ready(1);
  expect(session.dispatchPlayerAction(actor, { type: 'choose_target', decisionId, selectedIds: [target] }).ok).toBe(true);
  const result = resolveBattlefield(session.state, {
    battlefieldId: 'shinto',
    participants: [{ playerId: target, totalPower: 30 }],
  }).nextState.battleResults.at(-1);
  expect(result?.winnerPlayerIds).toEqual([]);
  expect(result?.excludedPlayerIds).toEqual([target]);
  expect(result?.margin).toBe(0);
 });
 it('refuses a now-distant target without touching real pending/ledger/resources',()=>{const {session,actor,target,decisionId}=ready();session.state.players.find(p=>p.id===target)!.locationId='miyama_town';const before=session.getState();expect(session.dispatchPlayerAction(actor,{type:'choose_target',decisionId,selectedIds:[target]}).ok).toBe(false);expect(session.getState()).toEqual(before);});
 it('refuses staging the skill below its eight-mana threshold before payment/source changes',()=>{const {session,actor,id}=fixture();session.state.players.find(p=>p.id===actor)!.mana=7;expect(session.dispatchPlayerAction(actor,{type:'skip_normal_move'}).ok).toBe(true);const before=session.getState();expect(session.dispatchPlayerAction(actor,{type:'stage_attack_card',cardInstanceId:id,faceDown:false}).ok).toBe(false);expect(session.getState()).toEqual(before);});
});
