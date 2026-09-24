import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SOURCE_DEF = 'master.fixture.amakusa.s1a';
const SOURCE = 'amakusa-source';
const COPIED_DEF = 'servant.fixture.revealed-skill';
const OTHER_DEF = 'servant.fixture.other-skill';
const COPIED = 'god-servant-skill';
const OTHER = 'god-servant-other';
const ABILITY = 'absolute-punishment';

function ability(): any {
  return {
    id: ABILITY, kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
    activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [{ type: 'source_owned' }], targets: [], cost: [],
    effects: [
      { type: 'choose_cards', target: { scope: 'players_with_status', status: 'role:god-servant' }, zone: 'servant-skills', face: 'up', minCount: 1, maxCount: 1, payloadKey: 'selectedInstanceIds' },
      { type: 'remove_status', target: { scope: 'selected_card_owners', payloadKey: 'selectedInstanceIds' }, status: 'role:god-servant' },
      { type: 'install_ability_rule_modifier', abilityId: ABILITY, modifierId: 'forbid-copied-original', target: { scope: 'selected_card_owners', payloadKey: 'selectedInstanceIds' }, payloadKey: 'selectedInstanceIds' },
      { type: 'copy_selected_card', id: 'temporary-servant-skill-copy', source: 'selected_card', payloadKey: 'selectedInstanceIds', zone: 'servant-skills', target: 'controller', face: 'up', active: false, residual: false, temporary: true, lifecycle: { duration: 'this_round', cleanup: 'remove_from_game' } },
    ],
    ruleModifiers: [{ id: 'forbid-copied-original', printedClause: 'fixture', installation: 'effect', operation: 'forbid', rule: 'skill_use', scope: { subject: 'controller', skillDefinitionIdsFromSelectedCard: true }, lifecycle: { duration: 'this_round' } }],
    creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}
function skillCard(id: string): any { return { id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.fixture' }, cardFace: { typeLabel: '魔术', attributes: ['魔术'], cost: 0, basePower: 1 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [] }; }
function archive(copyPatch: Record<string, unknown> = {}): any { const a=ability(); Object.assign(a.effects[3],copyPatch); return { schemaVersion:'fd-card-authoring-v1', archiveType:'master_skill_card_archive', id:'master.fixture', name:'fixture', class:'Master', cards:[{ id:SOURCE_DEF,name:'absolute punishment',cardType:'master_skill',owner:{type:'master',id:'master.fixture'},cardFace:{typeLabel:'行动',attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[a]},skillCard(COPIED_DEF),skillCard(OTHER_DEF)]}; }
function setup(): GameState { const pack=rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]); const s=createSeededGameState({activeSeats:[1,2]}); s.cards=[{instanceId:SOURCE,definitionId:SOURCE_DEF,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}},{instanceId:COPIED,definitionId:COPIED_DEF,ownerPlayerId:'p2',controllerPlayerId:'p2',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p2'}},{instanceId:OTHER,definitionId:OTHER_DEF,ownerPlayerId:'p2',controllerPlayerId:'p2',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p2'}}]; s.round.activePhase='action'; s.round.prioritySeat=s.players[0]!.seat; s.players[0]!.mana=10; s.players[1]!.mana=10; rules.initializeAbilityRuntime(s,pack,{seed:20260924}); s.abilityRuntime!.cardState[COPIED]={active:false,faceDown:false,playedRound:0}; s.abilityRuntime!.cardState[OTHER]={active:false,faceDown:false,playedRound:0}; s.abilityRuntime!.playerStatusKeysByPlayer={p1:[],p2:['role:god-servant']}; return s; }
function activate(s:GameState){return rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:ABILITY});}
function choose(s:GameState,id:string){const d=s.abilityRuntime!.pendingDecision!;return rules.dispatchAbilityCommand(s,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[id]});}

describe('P3 F4 M50-02 Amakusa absolute punishment owner bundle',()=>{
  it('copies the revealed skill temporarily, removes God-Servant, and forbids only the original definition for this round',()=>{
    const s=setup(); expect(activate(s).ok).toBe(true); expect(s.abilityRuntime!.pendingDecision?.candidates).toEqual(expect.arrayContaining([COPIED,OTHER])); const resolved=choose(s,COPIED); expect(resolved.ok).toBe(true);
    expect(s.abilityRuntime!.playerStatusKeysByPlayer!.p2).not.toContain('role:god-servant');
    const copies=s.cards.filter(c=>c.instanceId!==COPIED&&c.definitionId===COPIED_DEF&&c.ownerPlayerId==='p1'); expect(copies).toHaveLength(1); const copy=copies[0]!;
    expect(copy).toMatchObject({controllerPlayerId:'p1',zone:'skill',generatedBy:SOURCE,createdByPlayerId:'p1',derivedFromInstanceId:COPIED}); expect(copy.visibility).toEqual({scope:'owner_only',ownerPlayerId:'p1'}); expect(s.abilityRuntime!.cardState[copy.instanceId]).toMatchObject({active:false,faceDown:false}); expect(s.abilityRuntime!.structuredTemporaryGeneratedCards).toContainEqual(expect.objectContaining({instanceId:copy.instanceId,sourceCardId:SOURCE}));
    s.round.prioritySeat=s.players[1]!.seat; let view=rules.projectAbilityState(s,'p2'); expect(view.legalActions).not.toContainEqual(expect.objectContaining({type:'play_card',cardInstanceId:COPIED})); expect(view.legalActions).toContainEqual(expect.objectContaining({type:'play_card',cardInstanceId:OTHER})); const blocked=rules.dispatchAbilityCommand(s,'p2',{type:'play_card',cardInstanceId:COPIED}); expect(blocked.ok).toBe(false); expect(blocked.rejection?.code).toBe('play_forbidden');
    rules.advanceAbilityPhase(s,'action',s.round.roundNumber+1); expect(s.cards.find(c=>c.instanceId===copy.instanceId)?.zone).toBe('removed_from_game'); s.round.prioritySeat=s.players[1]!.seat; view=rules.projectAbilityState(s,'p2'); expect(view.legalActions).toContainEqual(expect.objectContaining({type:'play_card',cardInstanceId:COPIED}));
  });
  it('fails transactionally when the selected skill leaves its authoritative skill zone before resolution',()=>{ const s=setup(); expect(activate(s).ok).toBe(true); s.cards.find(c=>c.instanceId===COPIED)!.zone='attack_area'; const before=structuredClone(s.abilityRuntime!.playerStatusKeysByPlayer); expect(choose(s,COPIED).ok).toBe(false); expect(s.abilityRuntime!.playerStatusKeysByPlayer).toEqual(before); expect(s.cards.filter(c=>c.instanceId!==COPIED&&c.definitionId===COPIED_DEF&&c.ownerPlayerId==='p1')).toHaveLength(0); expect(s.abilityRuntime!.ongoingEffects.filter(o=>o.policyKey==='m50-effect-installed-skill-use-forbid-v1')).toHaveLength(0); });
  it('rejects a widened temporary-copy lifecycle at load time',()=>{ const pack=rules.loadAuthoringJson(archive({lifecycle:{duration:'this_round',cleanup:'remain_active'}})); expect(pack.report).toEqual(expect.arrayContaining([expect.objectContaining({abilityId:ABILITY,path:'effects[3]',reason:'Structured selected-card copy requires an exact accepted permanent-attack or temporary-skill shape'})])); });
});
