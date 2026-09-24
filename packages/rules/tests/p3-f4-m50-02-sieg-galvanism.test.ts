import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SIEG_DEF = 'master.fixture.sieg.ascension';
const SIEG_SOURCE = 'sieg-galvanism-source';
const SPENDER_DEF = 'fixture.sieg.spender';
const SPENDER = 'sieg-spender';
const STRENGTH_DEF = 'fixture.sieg.strength';
const QUICK_DEF = 'fixture.sieg.quick';

function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'master_skill_card_archive',
    id: 'master.fixture.sieg',
    name: 'fixture',
    class: 'Master',
    cards: [
      {
        id: SIEG_DEF,
        name: 'Galvanism',
        cardType: 'master_skill',
        owner: { type: 'master', id: 'master.fixture.sieg' },
        cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [
          {
            id: 'galvanism-recover-seal',
            kind: 'forced_trigger',
            printedClause: 'same-location opponent spending 4+ mana recovers one seal',
            markers: ['m50_structured_v1'],
            activation: { trigger: 'm50_player_mana_spent' },
            conditions: [
              { type: 'source_owned_live' },
              { type: 'event_player_is_opponent' },
              { type: 'event_player_same_location_as_controller' },
              { type: 'event_mana_spent_at_least', amount: 4 },
            ],
            targets: [], cost: [],
            effects: [{ type: 'adjust_command_seals', player: 'controller', amount: 1, directive: 'recover_command_seal' }],
            creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
            execution: { mode: 'automatic', allowedOperations: [] },
          },
          {
            id: 'galvanism-transformed-strength',
            kind: 'passive',
            printedClause: 'transformed this round: basic Strength +3',
            markers: ['m50_structured_v1'],
            activation: {},
            conditions: [{ type: 'source_owned' }, { type: 'player_flag_number_current_round', key: 'transformedRound' }],
            targets: [], effects: [], cost: [], creates: [],
            ruleModifiers: [{
              id: 'galvanism-transformed-strength-power', operation: 'add', rule: 'card_power',
              scope: { subject: 'controller', cards: { basic: true, attributesAny: ['力量'] } },
              value: 3, lifecycle: { duration: 'permanent' },
            }],
            lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
          },
        ],
      },
      {
        id: SPENDER_DEF,
        name: 'spender',
        cardType: 'master_skill',
        owner: { type: 'master', id: 'master.fixture.spender' },
        cardFace: { typeLabel: 'action', cost: 0, basePower: 0, attributes: [] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [
          {
            id: 'spend-four', kind: 'phase_action', activation: { phase: 'action', opens: 'controller_action_window' },
            conditions: [], targets: [], cost: [{ type: 'pay_mana', amount: 4 }], effects: [], creates: [], ruleModifiers: [],
            lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
          },
          {
            id: 'spend-three', kind: 'phase_action', activation: { phase: 'action', opens: 'controller_action_window' },
            conditions: [], targets: [], cost: [{ type: 'pay_mana', amount: 3 }], effects: [], creates: [], ruleModifiers: [],
            lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
          },
        ],
      },
      {
        id: STRENGTH_DEF, name: 'strength', cardType: 'basic_attack', cardFace: { cost: 0, basePower: 2, attributes: ['力量'] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
      {
        id: QUICK_DEF, name: 'quick', cardType: 'basic_attack', cardFace: { cost: 0, basePower: 2, attributes: ['迅捷'] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
    ],
  };
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [
    { instanceId: SIEG_SOURCE, definitionId: SIEG_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: SPENDER, definitionId: SPENDER_DEF, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } },
    { instanceId: 'strength', definitionId: STRENGTH_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'quick', definitionId: QUICK_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
  ];
  state.round.activePhase = 'action';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[0]!.mana = 10;
  state.players[1]!.mana = 10;
  (state.players[0] as any).commandSpells = 1;
  state.round.prioritySeat = state.players[1]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  return state;
}

function activate(state: GameState, abilityId: string) {
  return rules.dispatchAbilityCommand(state, 'p2', { type: 'activate_ability', cardInstanceId: SPENDER, abilityId });
}

describe('P3 F4 M50-02 Sieg Galvanism', () => {
  it('recovers one command seal after an authoritative same-location opponent spends four mana', () => {
    const state = setup();
    expect(activate(state, 'spend-four')).toMatchObject({ ok: true });
    expect(state.players[1]!.mana).toBe(6);
    expect((state.players[0] as any).commandSpells).toBe(2);
    expect(Object.values(state.abilityRuntime!.trustedManaSpentSnapshots ?? {})).toContainEqual(expect.objectContaining({ playerId: 'p2', amount: 4, locationId: 'miyama_town' }));
  });

  it('does not recover for a sub-threshold payment or for an opponent at another location', () => {
    const state = setup();
    expect(activate(state, 'spend-three')).toMatchObject({ ok: true });
    expect((state.players[0] as any).commandSpells).toBe(1);

    state.players[1]!.locationId = 'shinto';
    state.round.prioritySeat = state.players[1]!.seat;
    expect(activate(state, 'spend-four')).toMatchObject({ ok: true });
    expect((state.players[0] as any).commandSpells).toBe(1);
  });

  it('requires an owned live Galvanism source and rejects forged external mana-spent events', () => {
    const state = setup();
    state.cards.find((card) => card.instanceId === SIEG_SOURCE)!.zone = 'removed_from_game';
    expect(activate(state, 'spend-four')).toMatchObject({ ok: true });
    expect((state.players[0] as any).commandSpells).toBe(1);

    const forged = structuredClone(state);
    expect(() => rules.processAbilityEvent(forged, {
      id: 'forged-mana-spend', type: 'm50_player_mana_spent', playerId: 'p2', resource: 'mana', amount: 4,
      locationId: 'miyama_town', roundNumber: forged.round.roundNumber,
    })).toThrow(/provenance/i);
  });

  it('adds +3 only to controller basic Strength while transformedRound equals the current round', () => {
    const state = setup();
    state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1 = { transformedRound: state.round.roundNumber };
    expect(rules.calculateCardPower(state, 'strength').value).toBe(5);
    expect(rules.calculateCardPower(state, 'quick').value).toBe(2);

    state.round.roundNumber += 1;
    expect(rules.calculateCardPower(state, 'strength').value).toBe(2);
  });

  it('fails closed for widened Galvanism structured predicates', () => {
    const mutated = archive();
    mutated.cards[0].abilities[0].conditions[3].amount = 3;
    expect(rules.loadAuthoringJson(mutated).report).toEqual([]);
    // The generic threshold primitive may represent other cards, but it must retain exact shape.
    mutated.cards[0].abilities[0].conditions[3].extra = true;
    expect(rules.loadAuthoringJson(mutated).report.length).toBeGreaterThan(0);

    const roundFlag = archive();
    roundFlag.cards[0].abilities[1].conditions[1].extra = true;
    expect(rules.loadAuthoringJson(roundFlag).report.length).toBeGreaterThan(0);
  });
});
