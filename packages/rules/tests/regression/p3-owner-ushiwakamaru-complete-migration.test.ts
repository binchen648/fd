import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import {
  isAcceptedCrossPhaseActionProviderAbility,
  isAcceptedOneShotUsedAttackAbilityReuseAbility,
  isAcceptedStrictPowerRedeploySwapAbility,
} from '../../src/ability/cross-phase-redeployment-capability';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ARCHIVE = 'data/authoring/servants/servant.ushiwakamaru.json';
const ROOT = 'servant.ushiwakamaru';
const SC1 = `${ROOT}.skill.sc-ushiwakamaru-1`;
const SC2 = `${ROOT}.skill.sc-ushiwakamaru-2`;
const SC3 = `${ROOT}.skill.sc-ushiwakamaru-3`;
const SC1_SHA = '1abe7f64ee84099ea56ec0affece666647869535b3853091cd0f0002081ae506';
const SC2_SHA = 'e4b6eba748dd03f9652507ce3b9e58014b15705aa6807e5b5f1731f83382ccc2';
const SC3_SHA = '0514b5cce67642f6c5215fe348f433ce3638806be3af558ac845d39310a3d2b1';
const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
function raw(): any { return JSON.parse(readFileSync(ARCHIVE, 'utf8')); }
function pack() { const loaded = rules.loadAuthoringJson(raw()); expect(loaded.report).toEqual([]); return loaded; }
function add(state: GameState, definitionId: string, owner: string, instanceId: string, zone = 'field', active = true) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field','attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function addAttack(state: GameState, id: string, owner: string, power: number, withAction = false) {
  state.abilityRuntime!.pack.cards[id] = {
    id, name: id, cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower: power },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], playKind: 'attack', destinationZone: 'attack_area',
    abilities: withAction ? [{ id: `${id}.action`, kind: 'phase_action', printedClause: 'gain mana', activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
      conditions: [], targets: [], effects: [{ type: 'adjust_mana', player: 'controller', amount: 1 }], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
      responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] } }] : [], mode: 'automatic',
  } as any;
  return add(state, id, owner, `${id}:${state.cards.length}`, 'attack_area');
}
function setup() {
  const loaded = pack(); const state = createSeededGameState({ activeSeats: [1,2,3] }); state.cards=[];
  state.players[0]!.servantCardId=ROOT; state.players[0]!.locationId='shinto'; state.players[1]!.locationId='miyama_town'; state.players[2]!.locationId='recon';
  state.players[0]!.mana=12; state.round.prioritySeat=1; state.round.activePhase='action'; rules.initializeAbilityRuntime(state, loaded, { seed: 20260930 });
  return state;
}

describe('P3 owner-complete Ushiwakamaru migration', () => {
  it('materializes exact frozen owner set, twelve-card deck, static metadata and accepted generic shapes', () => {
    const a=raw(); const loaded=pack();
    expect(a.cards.map((c:any)=>c.id)).toEqual([SC1,SC2,SC3]);
    expect(a.deck).toEqual([{cardId:'card.cardb1'},{cardId:'card.cardb2'},{cardId:'card.cardq1',count:2},{cardId:'card.cardq2',count:2},{cardId:'card.cardq3'},{cardId:'card.cardq4'},{cardId:'card.cardsurveil',count:2},{cardId:'card.cardpreparation',count:2}]);
    expect(a.cards.map((c:any)=>sha(c.printedText))).toEqual([SC1_SHA,SC2_SHA,SC3_SHA]);
    expect(a.cards.map((c:any)=>[c.cardFace.typeLabel,c.cardFace.cost,c.cardFace.basePower])).toEqual([['力量/迅捷',3,3],['迅捷/宝具',2,6],['特殊',3,0]]);
    for (const id of [SC1,SC2,SC3]) expect(loaded.cards[id]!.playRequirements).toEqual([{type:'skill_zone_mana_at_least',value:8}]);
    expect(loaded.cards[SC1]!.abilities.some(isAcceptedCrossPhaseActionProviderAbility)).toBe(true);
    expect(loaded.cards[SC1]!.abilities.some(isAcceptedOneShotUsedAttackAbilityReuseAbility)).toBe(true);
    expect(loaded.cards[SC2]!.abilities.some(isAcceptedStrictPowerRedeploySwapAbility)).toBe(true);
    expect(loaded.cards[SC3]!.abilities.map((x)=>x.id)).toEqual(['sc-ushiwakamaru-3.draw','sc-ushiwakamaru-3.mount-summon']);
  });

  it('reveals true name on normal sc1/sc2 skill-zone play and preserves the final 8-mana threshold', () => {
    for (const [id,cost] of [[SC1,3],[SC2,2]] as const) {
      const low=setup(); low.players[0]!.mana=7; const lowId=add(low,id,'p1',`${id}:low`,'skill',false);
      expect(rules.getLegalActions(low,'p1').some((x)=>x.type==='play_card'&&x.cardInstanceId===lowId)).toBe(false);
      const exact=setup(); exact.players[0]!.mana=8; const source=add(exact,id,'p1',`${id}:play`,'skill',false);
      const action=rules.getLegalActions(exact,'p1').find((x)=>x.type==='play_card'&&x.cardInstanceId===source)!;
      expect(action).toBeDefined(); expect(rules.dispatchAbilityCommand(exact,'p1',action).ok).toBe(true);
      expect(exact.players[0]!.mana).toBe(8-cost); expect(exact.abilityRuntime!.revealedServants).toContain('p1');
    }
  });

  it('runs real sc1 cross-phase permission and exactly one extra use without rewriting original usage', () => {
    const state=setup(); const source=add(state,SC1,'p1','ushi-sc1'); const attack=addAttack(state,'fixture.ushi.action','p1',3,true);
    const abilityId='fixture.ushi.action.action';
    const action=rules.getLegalActions(state,'p1').find((x)=>x.type==='activate_ability'&&x.cardInstanceId===attack&&x.abilityId===abilityId)!;
    expect(rules.dispatchAbilityCommand(state,'p1',action).ok).toBe(true); const usageKey=`${attack}:${abilityId}:round:${state.round.roundNumber}`; expect(state.abilityRuntime!.abilityUsage[usageKey]).toBe(1);
    state.round.activePhase='battle';
    const reuse=rules.getLegalActions(state,'p1').find((x)=>x.type==='activate_ability'&&x.cardInstanceId===source&&x.abilityId==='sc-ushiwakamaru-1.whirling-slashes')!;
    expect(rules.dispatchAbilityCommand(state,'p1',reuse).ok).toBe(true); const d=state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[attack]}).ok).toBe(true);
    const again=rules.getLegalActions(state,'p1').find((x)=>x.type==='activate_ability'&&x.cardInstanceId===attack&&x.abilityId===abilityId)!;
    expect(rules.dispatchAbilityCommand(state,'p1',again).ok).toBe(true); expect(state.abilityRuntime!.abilityUsage[usageKey]).toBe(1);
    expect(rules.getLegalActions(state,'p1').some((x)=>x.type==='activate_ability'&&x.cardInstanceId===attack&&x.abilityId===abilityId)).toBe(false);
  });

  it('runs real sc2 strict current-Power comparison and atomically swaps only on a strict win', () => {
    const state=setup(); const source=add(state,SC2,'p1','ushi-sc2'); addAttack(state,'fixture.ushi.high','p1',20); addAttack(state,'fixture.ushi.low','p2',1);
    const beforeP3=state.players[2]!.locationId;
    const action=rules.getLegalActions(state,'p1').find((x)=>x.type==='activate_ability'&&x.cardInstanceId===source&&x.abilityId==='sc-ushiwakamaru-2.eight-boat-leap')!;
    expect(rules.dispatchAbilityCommand(state,'p1',action).ok).toBe(true); const d=state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state,'p1',{type:'choose_target',decisionId:d.id,selectedIds:['p2']}).ok).toBe(true);
    expect(state.players[0]!.locationId).toBe('miyama_town'); expect(state.players[1]!.locationId).toBe('shinto'); expect(state.players[2]!.locationId).toBe(beforeP3);
  });

  it('wires Ushiwakamaru into canonical pack/generated library while production runtime stays identity-free', () => {
    const manifest=JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json','utf8')); expect(manifest.authoringServantFiles).toContain(ARCHIVE);
    const generated=readFileSync('data/generated/fd-playtest-v1.content-library.json','utf8'); for (const id of [ROOT,SC1,SC2,SC3]) expect(generated).toContain(id);
    const production=['packages/rules/src/ability/cross-phase-redeployment-capability.ts','packages/rules/src/ability/interpreter.ts','packages/rules/src/ability/loader.ts','packages/rules/src/ability/types.ts','packages/rules/src/core/atomic-redeployment.ts','packages/rules/src/core/combat-resolver.ts','packages/rules/src/match-session.ts'].map((x)=>readFileSync(x,'utf8')).join('\n');
    for (const needle of ['servant.ushiwakamaru','sc-ushiwakamaru','牛若丸','喜见城','坛之浦','core.ushiwakamaru','SkillLib']) expect(production).not.toContain(needle);
  });
});
