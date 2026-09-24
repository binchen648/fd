import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD = 'master.fixture.skill.segment-a-conditions';
const SOURCE = 'segment-a-condition-source';
const ABILITY = 'check-condition';

type Node = Record<string, unknown>;

function archive(condition: Node): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: 'master.fixture', name: 'fixture', class: 'Master',
    cards: [{
      id: CARD, name: 'fixture', cardType: 'master_skill', owner: { type: 'master', id: 'master.fixture' },
      cardFace: { typeLabel: 'fixture', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [{
        id: ABILITY, kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
        activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [condition], targets: [], cost: [],
        effects: [{ type: 'gain_mana', target: 'controller', amount: 1 }], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
        execution: { mode: 'automatic', allowedOperations: [] },
      }],
    }],
  };
}

function setup(condition: Node): GameState {
  const pack = rules.loadAuthoringJson(archive(condition));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{ instanceId: SOURCE, definitionId: CARD, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  state.players[0]!.locationId = 'magic_workshop';
  state.players[1]!.locationId = 'magic_workshop';
  state.players[2]!.locationId = 'shinto';
  state.players[0]!.mana = 4;
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  return state;
}

function activate(state: GameState) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ABILITY });
}

describe('P3 F4 M50-02 bounded generic Segment A conditions', () => {
  it('uses current controller mana for mana_at_least', () => {
    const state = setup({ type: 'mana_at_least', amount: 5 });
    expect(activate(state).ok).toBe(false);
    state.players[0]!.mana = 5;
    expect(activate(state).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(6);
  });

  it('normalizes the workshop location and checks the controller location', () => {
    const state = setup({ type: 'location_is', locationId: 'workshop' });
    expect(activate(state).ok).toBe(true);
    const elsewhere = setup({ type: 'location_is', locationId: 'workshop' });
    elsewhere.players[0]!.locationId = 'shinto';
    expect(activate(elsewhere).ok).toBe(false);
  });

  it('counts active players at the controller exact location including the controller', () => {
    const state = setup({ type: 'same_location_player_count_equals', value: 2 });
    expect(activate(state).ok).toBe(true);
    const alone = setup({ type: 'same_location_player_count_equals', value: 2 });
    alone.players[1]!.locationId = 'shinto';
    expect(activate(alone).ok).toBe(false);
  });

  it('reads only the current-round authoritative positive VP ledger', () => {
    const state = setup({ type: 'round_victory_points_gained_equals', value: 0 });
    state.abilityRuntime!.roundPositiveVictoryPointGain = { round: state.round.roundNumber, byPlayer: { p1: 0 } };
    expect(activate(state).ok).toBe(true);
    const gained = setup({ type: 'round_victory_points_gained_equals', value: 0 });
    gained.abilityRuntime!.roundPositiveVictoryPointGain = { round: gained.round.roundNumber, byPlayer: { p1: 1 } };
    expect(activate(gained).ok).toBe(false);
  });

  it('reads the existing face-up play counter and rejects malformed thresholds', () => {
    const state = setup({ type: 'face_up_cards_played_this_round_at_least', count: 2 });
    state.abilityRuntime!.playCounters = { round: state.round.roundNumber, cardsPlayedByPlayer: {}, faceUpCardsPlayedByPlayer: { p1: 2 }, attacksDeclaredByPlayer: {} };
    expect(activate(state).ok).toBe(true);
    const bad = rules.loadAuthoringJson(archive({ type: 'face_up_cards_played_this_round_at_least', count: -1 }));
    expect(bad.report).toEqual(expect.arrayContaining([expect.objectContaining({ abilityId: ABILITY, reason: 'Structured condition requires a nonnegative safe integer' })]));
  });

  it('reads the authoritative current situation id and rejects a mismatch', () => {
    const state = setup({ type: 'current_situation_id_is', situationId: 'situation.heavens-cup' });
    (state as unknown as { modeState?: Record<string, unknown> }).modeState = { currentSituationId: 'situation.heavens-cup' };
    expect(activate(state).ok).toBe(true);
    const mismatch = setup({ type: 'current_situation_id_is', situationId: 'situation.heavens-cup' });
    (mismatch as unknown as { modeState?: Record<string, unknown> }).modeState = { currentSituationId: 'situation.other' };
    expect(activate(mismatch).ok).toBe(false);
  });
});
