import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { AbilityDefinitionPack, AuthoringCard } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ARC = 'master.arcueid.skill.s3';
const TWICE = 'master.twice.skill.ascension';
const MARBLE = 'master.arcueid.skill.s2';
const BASIC = 'fixture.b02.basic';
const OTHER = 'fixture.b02.other';

function raw(file: string) { return JSON.parse(readFileSync(file, 'utf8')); }
function loaded(file: string) {
  const pack = rules.loadAuthoringJson(raw(file));
  expect(pack.report).toEqual([]);
  return pack;
}
function fixtureCard(id: string, cardType: string, cost: number, power: number, abilities: any[] = []): AuthoringCard {
  return {
    id, name: id, cardType,
    cardFace: { typeLabel: 'fixture', cost, basePower: power, attributes: cardType === 'basic_attack' ? ['力量'] : [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities,
    mode: 'automatic',
  };
}
function actionAbility() {
  return {
    id: 'fixture.action', kind: 'phase_action', printedClause: 'fixture',
    activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [], targets: [], effects: [], cost: [],
    ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}
function pack(): AbilityDefinitionPack {
  const arc = loaded('data/authoring/masters/master.arcueid.json');
  const twice = loaded('data/authoring/masters/master.twice.json');
  return { cards: {
    ...arc.cards, ...twice.cards,
    [MARBLE]: fixtureCard(MARBLE, 'master_skill', 0, 0, [actionAbility()]),
    [BASIC]: fixtureCard(BASIC, 'basic_attack', 1, 3),
    [OTHER]: fixtureCard(OTHER, 'servant_attack', 2, 4),
  } };
}
function physical(instanceId: string, definitionId: string, controller = 'p1', zone = 'skill') {
  return { instanceId, definitionId, ownerPlayerId: controller, controllerPlayerId: controller, zone, visibility: { scope: zone === 'hand' || zone === 'skill' ? 'owner_only' as const : 'public' as const, ...(zone === 'hand' || zone === 'skill' ? { ownerPlayerId: controller } : {}) } };
}
function stateWith(cards: GameState['cards'], seats: number[] = [1, 2, 3]) {
  const state = createSeededGameState({ activeSeats: seats });
  state.cards = cards;
  state.round.activePhase = 'action';
  for (const p of state.players) { p.locationId = 'shinto'; p.mana = 20; }
  rules.initializeAbilityRuntime(state, pack(), { seed: 20260923 });
  for (const c of cards) state.abilityRuntime!.cardState[c.instanceId] = {
    active: c.zone === 'attack_area' || c.zone === 'field', faceDown: false, playedRound: state.round.roundNumber,
  };
  return state;
}
function battleResult(playerId: string, delta: number): GameState['battleResults'][number] {
  return {
    battlefieldId: 'shinto', winnerPlayerIds: [], tied: false, winnerPlayerId: null, margin: Math.abs(delta), vpReward: 0,
    militaryAdjustments: [{ playerId, delta }], participantBreakdowns: [],
  };
}
function allMaterialIds() {
  const ids: string[] = [];
  for (const root of ['data/authoring/masters', 'data/authoring/servants']) {
    for (const file of readdirSync(root).filter((entry) => entry.endsWith('.json'))) {
      for (const card of raw(join(root, file)).cards ?? []) ids.push(card.id);
    }
  }
  return ids;
}

describe('P3 F4 B02 source-owned passive/modifier migration batch', () => {
  it('loads both real migrated definitions blocker-free and preserves exact frozen text hashes', () => {
    const arc = raw('data/authoring/masters/master.arcueid.json').cards[0];
    const twice = raw('data/authoring/masters/master.twice.json').cards[0];
    expect(loaded('data/authoring/masters/master.arcueid.json').cards[ARC]).toBeDefined();
    expect(loaded('data/authoring/masters/master.twice.json').cards[TWICE]).toBeDefined();
    const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
    expect(hash(arc.printedText)).toBe('ec1d31fc8a03410b65ebfb1d740a036a88908f6c4a603ab4ee312398c3c4eced');
    expect(arc.abilities.map((a: any) => hash(a.printedClause))).toEqual([
      'bc966891179694ca54403bcda1794b419e27b6764a115f639f6fc4cc36a44aec',
      'b2269b7e3a92724d14cd850c33cef96200c06dc1aa643f6ed386c5a163704d7a',
      'a09444dfc4fed4ad286034f9b8486780a2a61ce6c447d973a022956c05865025',
    ]);
    expect(hash(twice.printedText)).toBe('b9755caf9b308f865e1a49f0ed0d0764d6b893a738cee40a8f15990cbb971e2b');
    expect(twice.abilities.map((a: any) => hash(a.printedClause))).toEqual([
      'd3d645d77030cab67a7014375c03635eb02d2cabf0be2eb4cc6917cbb1a5c7f8',
      '8ecb762f99c38bb995a2665d5923c3f169a080598d4f64346b74739160ba365b',
    ]);
  });

  it('applies Arcueid basic-attack +1 cost/+2 power and exact Marble forbid from an owned source', () => {
    const state = stateWith([
      physical('arc-source', ARC), physical('basic', BASIC, 'p1', 'hand'), physical('other', OTHER, 'p1', 'hand'), physical('marble', MARBLE),
    ]);
    expect(rules.calculateCardPower(state, 'basic').value).toBe(5);
    expect(rules.calculateCardPower(state, 'other').value).toBe(4);
    expect(rules.getLegalActions(state, 'p1').some((a) => a.type === 'activate_ability' && a.cardInstanceId === 'marble')).toBe(false);
    const mana = state.players[0]!.mana;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'basic' }]);
    expect(state.players[0]!.mana).toBe(mana - 2);
    expect(state.abilityRuntime!.cardState.basic!.paidManaOnPlay).toBe(2);
  });

  it('stops Arcueid continuous rules after the source leaves an owned zone', () => {
    const state = stateWith([
      physical('arc-source', ARC), physical('basic', BASIC, 'p1', 'hand'), physical('marble', MARBLE),
    ]);
    state.cards.find((c) => c.instanceId === 'arc-source')!.zone = 'removed_from_game';
    expect(rules.calculateCardPower(state, 'basic').value).toBe(3);
    expect(rules.getLegalActions(state, 'p1').some((a) => a.type === 'activate_ability' && a.cardInstanceId === 'marble')).toBe(true);
  });

  it('settles Arcueid round-end -2 VP through the authoritative event path only while source-owned', () => {
    const state = stateWith([physical('arc-source', ARC)]);
    state.players[0]!.vp = 3;
    rules.advanceAbilityPhase(state, 'round_end');
    expect(state.players[0]!.vp).toBe(1);

    const removed = stateWith([physical('arc-source', ARC)]);
    removed.players[0]!.vp = 3;
    removed.cards[0]!.zone = 'removed_from_game';
    rules.advanceAbilityPhase(removed, 'round_end');
    expect(removed.players[0]!.vp).toBe(3);
  });

  it('adds Twice +12 combat power for a tied lowest living player without changing card power', () => {
    const state = stateWith([
      physical('twice-source', TWICE), physical('p1-basic', BASIC, 'p1', 'attack_area'), physical('p2-basic', BASIC, 'p2', 'attack_area'),
    ], [1, 2]);
    state.players[0]!.vp = 1; state.players[1]!.vp = 1;
    expect(rules.calculateCardPower(state, 'p1-basic').value).toBe(3);
    const battle = rules.resolveBattlefield(state, { battlefieldId: 'shinto' }).nextState.battleResults.at(-1)!;
    expect(battle.participantBreakdowns.find((p) => p.playerId === 'p1')!.effectivePower).toBe(15);
    expect(rules.calculateCardPower(state, 'p1-basic').value).toBe(3);
  });

  it('does not add Twice +12 when controller is not lowest or after the source is removed', () => {
    const state = stateWith([
      physical('twice-source', TWICE), physical('p1-basic', BASIC, 'p1', 'attack_area'), physical('p2-basic', BASIC, 'p2', 'attack_area'),
    ], [1, 2]);
    state.players[0]!.vp = 2; state.players[1]!.vp = 1;
    let battle = rules.resolveBattlefield(state, { battlefieldId: 'shinto' }).nextState.battleResults.at(-1)!;
    expect(battle.participantBreakdowns.find((p) => p.playerId === 'p1')!.effectivePower).toBe(3);
    state.players[0]!.vp = 1; state.cards.find((c) => c.instanceId === 'twice-source')!.zone = 'removed_from_game';
    battle = rules.resolveBattlefield(state, { battlefieldId: 'shinto' }).nextState.battleResults.at(-1)!;
    expect(battle.participantBreakdowns.find((p) => p.playerId === 'p1')!.effectivePower).toBe(3);
  });

  it('consumes Twice to replace the first military-threshold elimination, then eliminates normally on the next attempt', () => {
    const state = stateWith([physical('twice-source', TWICE)], [1, 2]);
    state.players[0]!.militaryResult = -7;
    state.battleResults = [battleResult('p1', -1)];
    const first = rules.applyBattleScoring(state).nextState;
    expect(first.players[0]).toMatchObject({ status: 'active', militaryResult: -8 });
    expect(first.cards.find((c) => c.instanceId === 'twice-source')).toMatchObject({ zone: 'removed_from_game', visibility: { scope: 'public' } });
    expect(first.abilityRuntime!.cardState['twice-source']).toMatchObject({ active: false, faceDown: true });
    first.battleResults = [battleResult('p1', -1)];
    const second = rules.applyBattleScoring(first).nextState;
    expect(second.players[0]).toMatchObject({ status: 'eliminated', militaryResult: -9, eliminationOrder: 1 });
  });

  it('fails closed on duplicate elimination replacements and widened B02 reserved envelopes', () => {
    const conflict = stateWith([physical('twice-a', TWICE), physical('twice-b', TWICE)], [1, 2]);
    conflict.players[0]!.militaryResult = -7; conflict.battleResults = [battleResult('p1', -1)];
    expect(() => rules.applyBattleScoring(conflict)).toThrow(/B02_ELIMINATION_REPLACEMENT_CONFLICT/);

    const arc = raw('data/authoring/masters/master.arcueid.json');
    arc.cards[0].abilities[0].ruleModifiers[1].value = 3;
    expect(rules.loadAuthoringJson(arc).report.some((r) => r.path.includes('batchOwnedPassive.gateway') || r.path.includes('batchPassive.gateway'))).toBe(true);
    const twice = raw('data/authoring/masters/master.twice.json');
    twice.cards[0].abilities[0].conditions[1].extra = true;
    expect(rules.loadAuthoringJson(twice).report.some((r) => r.path.includes('batchOwnedPassive.gateway') || r.reason.includes('Lowest-VP'))).toBe(true);
  });

  it('adds exactly the two B02 frozen identities to material without duplicates', () => {
    const ids = allMaterialIds();
    expect(ids.filter((id) => id === ARC)).toHaveLength(1);
    expect(ids.filter((id) => id === TWICE)).toHaveLength(1);
    expect(ids.length - new Set(ids).size).toBe(0);
  });
});
