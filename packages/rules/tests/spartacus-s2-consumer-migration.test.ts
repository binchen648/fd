import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { AbilityEvent } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'servant.spartacus';
const ID = 'servant.spartacus.skill.sc-spartacus-2';
const SOURCE = 'spartacus-s2-source';
const ABILITY = 'wounded-beast-roar-reward';
const TEXT = '受虐之荣光-战斗阶段：战斗后获得X点战果，X为与你交战的任意一名对手的合计威力的五分之一（向下取整）。';
const TEXT_SHA = 'cc5be3d123f96a8199e6c07bdae9161b93829c7b52cab2e838cb2a19b592996e';
const hash = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');
function rawArchive(): any { return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.spartacus.json'), 'utf8')); }
function setup(mana = 8): GameState {
  const pack = rules.loadAuthoringJson(rawArchive()); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{ instanceId: SOURCE, definitionId: ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  for (const player of state.players) player.locationId = 'shinto';
  state.players[0]!.mana = mana; rules.initializeAbilityRuntime(state, pack, { seed: 10048 }); return state;
}
function play(state: GameState) { return rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: SOURCE }); }
function rootEvent(state: GameState, powers: Record<string, number> = { p1: 7, p2: 14, p3: 24 }, battlefieldId = 'shinto'): AbilityEvent {
  const phaseId = `battle-phase:${state.round.roundNumber}`; const battleId = `${phaseId}:battle:${battlefieldId}:1`; const resultId = `${battleId}:result`;
  return { id: resultId, type: 'after_battle_result_determined', battlePhaseResolutionId: phaseId, battleId, resultId, battlefieldId, battleParticipantIds: ['p1', 'p2', 'p3'], battleParticipantPowers: { ...powers }, battleResult: { winners: ['p3'], loserIds: ['p1', 'p2'] } };
}
function choose(state: GameState, playerId: string) { const decision = rules.projectAbilityState(state, 'p1').pendingDecision!; return rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [playerId] }); }
function authoringJsonFiles(dir: string): string[] { return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => { const full = join(dir, entry.name); return entry.isDirectory() ? authoringJsonFiles(full) : entry.name.endsWith('.json') ? [full] : []; }); }

describe('P3 S R100 Spartacus s2 consumer migration', () => {
  it('authors exactly the frozen identity, accepted F1 evidence, and locked static metadata', () => {
    const raw = rawArchive(); expect(raw).toMatchObject({ schemaVersion:'fd-card-authoring-v1',archiveType:'servant_skill_card_archive',id:OWNER,name:'斯巴达克斯',class:'Berserker',sourcePolicy:{phase3EvidenceCommit:'80aaa029ff20448b92afc4fd115080cd3f34a60c',referenceMetadataCommit:'b2f9fa15fba07c63530bbf4612b03b8b704755f9'} });
    expect(raw.cards).toHaveLength(1); const card=raw.cards[0];
    expect(card).toMatchObject({ id:ID,aliases:['sc_spartacus_2'],legacyId:'sc_spartacus_2',name:'伤兽的咆哮',cardType:'servant_skill',owner:{type:'servant',id:OWNER},cardFace:{typeLabel:'宝具',attributes:['宝具'],cost:3,basePower:4},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[{type:'skill_zone_mana_at_least',value:8}],phase3Evidence:{f1Commit:'80aaa029ff20448b92afc4fd115080cd3f34a60c',f1AuditCommit:'4961de83468716cc748f16faf9f03212c47a8713',f1ReviewCommit:'9d92b036332fc22df07ccb8f26af0bc69c066b34',f1FullPrintedTextSha256:TEXT_SHA,referenceStaticMetadata:{commit:'b2f9fa15fba07c63530bbf4612b03b8b704755f9',legacySkillId:'sc_spartacus_2',class:'Berserker',cost:3,basePower:4,legacyRequirement:8,typeLabel:'宝具',attributes:['宝具']},canonicalSkillZoneManaRequirement:{value:8,authority:'final_rules_9.4'}} });
    expect(card.printedText).toBe(TEXT); expect(card.abilities).toHaveLength(1); expect(card.abilities[0].id).toBe(ABILITY); expect(card.abilities[0].printedClause).toBe(TEXT); expect(hash(card.printedText)).toBe(TEXT_SHA); expect(hash(card.abilities[0].printedClause)).toBe(TEXT_SHA); expect(card.phase3Evidence.f1ClauseSources[0].sha256).toBe(TEXT_SHA);
  });
  it('loads blocker-free through exactly the accepted FB2-48 whole-ability envelope', () => {
    const pack=rules.loadAuthoringJson(rawArchive()); expect(pack.report).toEqual([]); const card=pack.cards[ID]!; expect(card.mode).toBe('automatic'); expect(card.abilities).toHaveLength(1); expect(rules.isAcceptedCombatOpponentPowerVpRewardAbility(card.abilities[0]!,'compiled')).toBe(true); expect(card.abilities[0]).toMatchObject({id:ABILITY,kind:'residual',activation:{trigger:'after_battle_result_determined',requiresSourceState:'active'},conditions:[{type:'source_active'},{type:'event_location_equals_controller'}],effects:[{type:rules.COMBAT_OPPONENT_POWER_VP_REWARD_EFFECT}],lifecycle:{duration:'while_active'},execution:{mode:'automatic'}});
  });
  it('enforces 8 mana in skill zone and charges printed cost 3 on real play', () => {
    const low=setup(7); expect(play(low).ok).toBe(false); expect(low.players[0]!.mana).toBe(7); expect(low.cards[0]!.zone).toBe('skill');
    const state=setup(8); expect(play(state).ok).toBe(true); expect(state.players[0]!.mana).toBe(5); expect(state.cards[0]!.zone).toBe('attack_area'); expect(state.abilityRuntime!.cardState[SOURCE]).toMatchObject({active:true,faceDown:false,playedRound:state.round.roundNumber});
  });
  it('uses exactly one frozen combat opponent and floors the selected power divided by five', () => {
    const p2=setup(); expect(play(p2).ok).toBe(true); p2.round.activePhase='battle'; p2.players[0]!.vp=1; rules.processAbilityEvent(p2,rootEvent(p2)); expect(rules.projectAbilityState(p2,'p1').pendingDecision).toMatchObject({min:1,max:1,candidates:['p2','p3'],visibility:'owner_only',cancelPolicy:'forbidden'}); expect(choose(p2,'p2').ok).toBe(true); expect(p2.players[0]!.vp).toBe(3);
    const p3=setup(); expect(play(p3).ok).toBe(true); p3.round.activePhase='battle'; p3.players[0]!.vp=1; rules.processAbilityEvent(p3,rootEvent(p3)); expect(choose(p3,'p3').ok).toBe(true); expect(p3.players[0]!.vp).toBe(5);
  });
  it('keeps trigger-time power authoritative and exact root replay idempotent', () => {
    const state=setup(); expect(play(state).ok).toBe(true); state.round.activePhase='battle'; state.players[0]!.vp=2; const root=rootEvent(state,{p1:9,p2:19,p3:31}); rules.processAbilityEvent(state,root); state.players[1]!.locationId='recon'; expect(choose(state,'p2').ok).toBe(true); expect(state.players[0]!.vp).toBe(5); const once=JSON.stringify({vp:state.players[0]!.vp,events:state.abilityRuntime!.events,processed:state.abilityRuntime!.processedEvents}); rules.processAbilityEvent(state,root); expect(state.abilityRuntime!.pendingDecision).toBeUndefined(); expect(JSON.stringify({vp:state.players[0]!.vp,events:state.abilityRuntime!.events,processed:state.abilityRuntime!.processedEvents})).toBe(once);
  });
  it('does not trigger for inactive source, wrong controller battlefield, or malformed frozen powers', () => {
    const inactive=setup(); expect(play(inactive).ok).toBe(true); inactive.round.activePhase='battle'; inactive.abilityRuntime!.cardState[SOURCE]!.active=false; rules.processAbilityEvent(inactive,rootEvent(inactive)); expect(inactive.abilityRuntime!.pendingDecision).toBeUndefined();
    const moved=setup(); expect(play(moved).ok).toBe(true); moved.round.activePhase='battle'; moved.players[0]!.locationId='miyama_town'; rules.processAbilityEvent(moved,rootEvent(moved)); expect(moved.abilityRuntime!.pendingDecision).toBeUndefined();
    const malformed=setup(); expect(play(malformed).ok).toBe(true); malformed.round.activePhase='battle'; const bad=rootEvent(malformed); delete bad.battleParticipantPowers; rules.processAbilityEvent(malformed,bad); expect(malformed.abilityRuntime!.pendingDecision).toBeUndefined();
  });
  it('receives frozen participant powers from the real post-scoring game-loop producer on the played card', () => {
    const state=setup(); expect(play(state).ok).toBe(true); state.round.activePhase='battle'; const result=rules.stepGameLoop(state); expect(result.transition).toEqual({from:'battle',to:'battle'}); const decision=result.nextState.abilityRuntime!.pendingDecision!; expect(decision.interaction).toMatchObject({kind:'combat_opponent_power_vp_reward_v1',battlefieldId:'shinto',opponentIds:['p2','p3'],participantPowers:expect.objectContaining({p1:4,p2:0,p3:0})}); const root=result.nextState.abilityRuntime!.trustedBattleResultSnapshots?.[decision.interaction!.resultId as string]; expect(root?.battleParticipantPowers).toEqual(expect.objectContaining({p1:4,p2:0,p3:0}));
  });
  it('stays outside product/generated outputs and is the exact sole +1 frozen material addition', () => {
    const manifest=readFileSync(resolve(ROOT,'data/packs/fd-playtest-v1/pack.json'),'utf8'); const generated=readFileSync(resolve(ROOT,'data/generated/fd-playtest-v1.content-library.json'),'utf8'); expect(manifest).not.toContain(ID); expect(generated).not.toContain(ID);
    const inventory=JSON.parse(readFileSync(resolve(ROOT,'data/phase3/full-roster-ability-inventory.json'),'utf8')); const frozen=new Set<string>([...inventory.staticSkills.map((x:any)=>x.canonicalAbilityId),...inventory.dynamicSkills.map((x:any)=>x.canonicalAbilityId)]); const counts=new Map<string,number>(); for(const file of authoringJsonFiles(resolve(ROOT,'data/authoring'))){const archive=JSON.parse(readFileSync(file,'utf8').replace(/^\uFEFF/,'')); for(const card of archive.cards??[]) counts.set(card.id,(counts.get(card.id)??0)+1);} const duplicateFrozen=[...counts.entries()].filter(([id,count])=>frozen.has(id)&&count>1); const overlap=[...counts.keys()].filter(id=>frozen.has(id)); expect(frozen.size).toBe(944); expect(duplicateFrozen).toEqual([]); expect(counts.get(ID)).toBe(1); expect(overlap).toHaveLength(146);
  });
});
