import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SOURCE = 'fixture.fb2-35.source';
const SOURCE_INSTANCE = 'fixture.fb2-35.source.instance';
const P1_ATTACK = 'fixture.fb2-35.p1-attack';
const P2_ATTACK = 'fixture.fb2-35.p2-attack';
const P3_ATTACK = 'fixture.fb2-35.p3-attack';

function modifier(overrides: Record<string, unknown> = {}) {
  return {
    id: 'highest-round-active-paid-cost-plus-six',
    operation: 'add',
    rule: 'combat_power',
    scope: {
      subject: 'players_at_source_battlefield',
      where: [{ type: 'round_active_attack_paid_cost_sum_is_highest' }],
    },
    value: { type: 'constant', value: 6 },
    lifecycle: { duration: 'permanent' },
    priority: { tier: 'card_text', specificity: 'specific' },
    conflictPolicy: 'higher_priority_wins',
    ...overrides,
  };
}

function sourceAbility(overrides: Record<string, unknown> = {}) {
  return {
    id: 'paid-cost-combat-power',
    kind: 'passive',
    printedClause: 'fixture',
    activation: {},
    conditions: [{ type: 'source_owned' }],
    targets: [], effects: [], cost: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    ruleModifiers: [modifier()],
    execution: { mode: 'automatic', allowedOperations: [] },
    ...overrides,
  };
}

function archive(ability: any = sourceAbility()) {
  const attack = (id: string, cost: number, basePower: number) => ({
    id, name: id, cardType: 'basic_attack',
    cardFace: { cost, basePower, attributes: ['力量'] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities: [],
  });
  return {
    schemaVersion: 'fd-card-authoring-v1', id: 'fixture.fb2-35', name: 'FB2-35 fixture', cards: [
      {
        id: SOURCE, name: 'source', cardType: 'servant_skill',
        cardFace: { cost: 0, basePower: 0, attributes: [] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [], abilities: [ability],
      },
      attack(P1_ATTACK, 3, 1),
      attack(P2_ATTACK, 2, 4),
      attack(P3_ATTACK, 0, 2),
    ],
  } as any;
}

function add(state: GameState, instanceId: string, definitionId: string, playerId: string, zone: 'hand' | 'skill' = 'hand') {
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: playerId, controllerPlayerId: playerId, zone,
    visibility: zone === 'skill' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: playerId },
  });
}

function setup() {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'miyama_town';
  state.players[0]!.mana = 20;
  state.players[1]!.mana = 20;
  state.players[2]!.mana = 20;
  add(state, SOURCE_INSTANCE, SOURCE, 'p1', 'skill');
  add(state, 'p1-attack', P1_ATTACK, 'p1');
  add(state, 'p2-attack', P2_ATTACK, 'p2');
  add(state, 'p3-attack', P3_ATTACK, 'p3');
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  return state;
}

function play(state: GameState, playerId: string, cardInstanceId: string, faceDown = false) {
  state.round.prioritySeat = state.players.find((candidate) => candidate.id === playerId)!.seat;
  rules.playAbilityCardBatch(state, playerId, [{ cardInstanceId, ...(faceDown ? { faceDown: true } : {}) }]);
}

function battle(state: GameState) {
  state.round.activePhase = 'battle';
  return rules.resolveBattlefield(state, { battlefieldId: 'miyama_town' }).nextState.battleResults.at(-1)!;
}

function power(result: GameState['battleResults'][number], playerId: string) {
  return result.participantBreakdowns.find((entry) => entry.playerId === playerId)!.effectivePower;
}

describe('P3-FB2-35 round active-attack paid-cost combat-power seam', () => {
  it('accepts only the exact identity-free authoring shape and preserves it through loader compilation', () => {
    const raw = sourceAbility();
    expect(rules.isAcceptedRoundActiveAttackPaidCostCombatPowerAbility(raw)).toBe(true);
    const loaded = rules.loadAuthoringJson(archive(raw));
    expect(loaded.report).toEqual([]);
    expect(rules.isAcceptedRoundActiveAttackPaidCostCombatPowerAbility(loaded.cards[SOURCE]!.abilities[0] as any, 'compiled')).toBe(true);

    const nearMatches = [
      sourceAbility({ conditions: [{ type: 'source_active' }] }),
      sourceAbility({ ruleModifiers: [modifier({ value: { type: 'constant', value: 12 } })] }),
      sourceAbility({ ruleModifiers: [modifier({ scope: { subject: 'controller' } })] }),
      sourceAbility({ ruleModifiers: [modifier({ lifecycle: { duration: 'this_round' } })] }),
      sourceAbility({ effects: [{ type: 'noop', reason: 'extra' }] }),
    ];
    for (const ability of nearMatches) {
      expect(rules.isAcceptedRoundActiveAttackPaidCostCombatPowerAbility(ability)).toBe(false);
      expect(rules.loadAuthoringJson(archive(ability)).report.length).toBeGreaterThan(0);
    }
  });

  it('records actual paid mana for normal and face-down plays and leaves failed plays mutation-free', () => {
    const state = setup();
    play(state, 'p1', 'p1-attack');
    expect(state.players[0]!.mana).toBe(17);
    expect(state.abilityRuntime!.cardState['p1-attack']).toMatchObject({
      active: true, faceDown: false, playedRound: state.round.roundNumber, paidManaOnPlay: 3,
    });

    play(state, 'p2', 'p2-attack', true);
    expect(state.players[1]!.mana).toBe(20);
    expect(state.abilityRuntime!.cardState['p2-attack']).toMatchObject({
      active: false, faceDown: true, playedRound: state.round.roundNumber, paidManaOnPlay: 0,
    });

    state.players[2]!.mana = 0;
    state.abilityRuntime!.pack.cards[P3_ATTACK]!.cardFace.cost = 5;
    state.round.prioritySeat = state.players[2]!.seat;
    const beforeMana = state.players[2]!.mana;
    const beforeZone = state.cards.find((card) => card.instanceId === 'p3-attack')!.zone;
    const beforeCounters = structuredClone(state.abilityRuntime!.playCounters);
    const rejected = rules.dispatchAbilityCommand(state, 'p3', { type: 'play_card', cardInstanceId: 'p3-attack' });
    expect(rejected.ok).toBe(false);
    expect(rejected.rejection?.code).toBe('insufficient_mana');
    expect(state.players[2]!.mana).toBe(beforeMana);
    expect(state.cards.find((card) => card.instanceId === 'p3-attack')!.zone).toBe(beforeZone);
    expect(state.abilityRuntime!.cardState['p3-attack']).toBeUndefined();
    expect(state.abilityRuntime!.playCounters).toEqual(beforeCounters);
  });

  it('adds +6 to the unique highest paid-cost participant before winner selection without changing card power', () => {
    const state = setup();
    play(state, 'p1', 'p1-attack');
    play(state, 'p2', 'p2-attack');
    expect(rules.calculateCardPower(state, 'p1-attack').value).toBe(1);
    const result = battle(state);
    expect(power(result, 'p1')).toBe(7);
    expect(power(result, 'p2')).toBe(4);
    expect(result.winnerPlayerIds).toEqual(['p1']);
    expect(rules.calculateCardPower(state, 'p1-attack').value).toBe(1);
  });

  it('preserves ties at the highest paid-cost sum and does not qualify a player merely because they have no attack', () => {
    const state = setup();
    state.abilityRuntime!.pack.cards[P2_ATTACK]!.cardFace.cost = 3;
    play(state, 'p1', 'p1-attack');
    play(state, 'p2', 'p2-attack');
    const result = battle(state);
    expect(power(result, 'p1')).toBe(7);
    expect(power(result, 'p2')).toBe(10);
    expect(power(result, 'p3')).toBe(0);
    expect(result.participantBreakdowns.find((entry) => entry.playerId === 'p3')!.totalModifier).toBe(0);
  });

  it('treats an actually paid zero-cost active attack as real provenance while excluding inactive, face-down, wrong-round, and malformed provenance', () => {
    const zero = setup();
    play(zero, 'p3', 'p3-attack');
    const zeroResult = battle(zero);
    expect(power(zeroResult, 'p3')).toBe(8);

    for (const mutate of [
      (state: GameState) => { state.abilityRuntime!.cardState['p1-attack']!.active = false; },
      (state: GameState) => { state.abilityRuntime!.cardState['p1-attack']!.faceDown = true; },
      (state: GameState) => { state.abilityRuntime!.cardState['p1-attack']!.playedRound = state.round.roundNumber - 1; },
      (state: GameState) => { (state.abilityRuntime!.cardState['p1-attack'] as any).paidManaOnPlay = '3'; },
    ]) {
      const state = setup();
      play(state, 'p1', 'p1-attack');
      mutate(state);
      const result = battle(state);
      expect(result.participantBreakdowns.find((entry) => entry.playerId === 'p1')!.totalModifier).toBe(0);
    }
  });

  it('fails closed when source ownership or source battlefield relation is not satisfied', () => {
    const wrongOwner = setup();
    play(wrongOwner, 'p1', 'p1-attack');
    wrongOwner.cards.find((card) => card.instanceId === SOURCE_INSTANCE)!.ownerPlayerId = 'p2';
    expect(power(battle(wrongOwner), 'p1')).toBe(1);

    const away = setup();
    play(away, 'p2', 'p2-attack');
    away.players[0]!.locationId = 'recon';
    expect(power(battle(away), 'p2')).toBe(4);
  });

  it('keeps the different Twice-style controller-only combat-power shape unsupported', () => {
    const twiceLike = sourceAbility({
      conditions: [],
      ruleModifiers: [modifier({
        scope: { subject: 'controller' },
        value: 12,
        lifecycle: undefined,
        priority: undefined,
        conflictPolicy: undefined,
      })],
    });
    expect(rules.isAcceptedRoundActiveAttackPaidCostCombatPowerAbility(twiceLike)).toBe(false);
    const loaded = rules.loadAuthoringJson(archive(twiceLike));
    expect(loaded.report.some((entry) => entry.status === 'unsupported')).toBe(true);
  });
});
