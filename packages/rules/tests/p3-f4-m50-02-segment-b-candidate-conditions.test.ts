import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD = 'servant.fixture.skill.gift';
const LINKED = 'servant.fixture.skill.parasite';
const SOURCE = 'gift-source';
const ABILITY = 'irresistible-gift-fixture';

function archive(candidateConditions: any[] = [
  { type: 'lacks_linked_skill_card', linkedSkillId: LINKED, zones: ['attack'] },
  { type: 'victory_points_not_first' },
]): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.fixture', name: 'fixture', class: 'Caster',
    cards: [{
      id: CARD, name: 'fixture', cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.fixture' },
      cardFace: { typeLabel: 'fixture', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [{
        id: ABILITY, kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
        activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [], targets: [], cost: [],
        effects: [{
          type: 'choose_players', candidateTarget: 'same_location_opponents', candidateConditions,
          minCount: 1, maxCount: 1, payloadKey: 'targetPlayerId',
          then: [{ type: 'gain_victory_points', target: 'selected_player', amount: 1 }],
        }], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
        execution: { mode: 'automatic', allowedOperations: [] },
      }],
    }],
  };
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{ instanceId: SOURCE, definitionId: CARD, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  for (const player of state.players) player.locationId = 'miyama_town';
  state.players[0]!.vp = 5;
  state.players[1]!.vp = 2;
  state.players[2]!.vp = 5;
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  return state;
}

function activate(state: GameState) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ABILITY });
}

function choose(state: GameState, id: string) {
  const decision = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [id] });
}

describe('P3 F4 M50-02 Segment B structured player candidate conditions', () => {
  it('offers only a same-location player below the active-player first-place VP tier', () => {
    const state = setup();
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ candidates: ['p2'], min: 1, max: 1 });
    expect(choose(state, 'p2').ok).toBe(true);
    expect(state.players[1]!.vp).toBe(3);
  });

  it('treats tied highest VP as first place and therefore excludes it', () => {
    const state = setup();
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision!.candidates).not.toContain('p3');
  });

  it('excludes a candidate that controls the linked skill card in the declared attack zone', () => {
    const state = setup();
    state.cards.push({ instanceId: 'parasite', definitionId: LINKED, ownerPlayerId: 'p3', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
    const result = activate(state);
    expect(result.ok).toBe(false);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.players[1]!.vp).toBe(2);
  });

  it('filters candidates that cannot pay the declared mana amount', () => {
    const pack = rules.loadAuthoringJson(archive([{ type: 'can_pay_mana', amount: 2 }]));
    expect(pack.report).toEqual([]);
    const state = createSeededGameState({ activeSeats: [1, 2, 3] });
    state.cards = [{ instanceId: SOURCE, definitionId: CARD, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
    for (const player of state.players) player.locationId = 'miyama_town';
    state.players[1]!.mana = 1;
    state.players[2]!.mana = 2;
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision!.candidates).toEqual(['p3']);
  });

  it('fails closed at load time for malformed candidate condition shapes', () => {
    const malformedLinked = rules.loadAuthoringJson(archive([{ type: 'lacks_linked_skill_card', linkedSkillId: LINKED, zones: [] }]));
    expect(malformedLinked.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ abilityId: ABILITY, reason: 'Unsupported candidate linked-skill absence condition shape' }),
    ]));
    const malformedMana = rules.loadAuthoringJson(archive([{ type: 'can_pay_mana', amount: -1 }]));
    expect(malformedMana.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ abilityId: ABILITY, reason: 'Unsupported candidate mana-payment condition shape' }),
    ]));
    const malformedRank = rules.loadAuthoringJson(archive([{ type: 'victory_points_not_first', value: 1 }]));
    expect(malformedRank.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ abilityId: ABILITY, reason: 'Unsupported candidate victory-point rank condition shape' }),
    ]));
  });
});
