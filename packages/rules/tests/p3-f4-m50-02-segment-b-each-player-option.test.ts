import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD = 'servant.fixture.skill.each-player';
const SOURCE = 'each-player-source';
const ABILITY = 'each-player-fixture';

function archive(extra: Record<string, unknown> = {}): any {
  const choice: any = {
    type: 'choose_each_player_option',
    candidateTarget: { scope: 'same_location_opponents' },
    candidateConditions: [{ type: 'can_pay_mana', amount: 2 }],
    skipIfNoCandidates: true,
    options: [
      { id: 'pay', label: 'pay', effects: [
        { type: 'pay_mana', target: 'decision_player', amount: 2 },
        { type: 'add_status', target: 'decision_player', status: 'paid' },
      ] },
      { id: 'refuse', label: 'refuse', effects: [
        { type: 'lose_victory_points', target: 'decision_player', amount: 1 },
      ] },
    ],
    ...extra,
  };
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.fixture', name: 'fixture', class: 'Rider',
    cards: [{
      id: CARD, name: 'fixture', cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.fixture' },
      cardFace: { typeLabel: 'fixture', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [{
        id: ABILITY, kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
        activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [], targets: [], cost: [],
        effects: [choice], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
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
  for (const p of state.players) p.locationId = 'miyama_town';
  state.players[0]!.mana = 5; state.players[1]!.mana = 3; state.players[2]!.mana = 4;
  state.players[0]!.vp = 5; state.players[1]!.vp = 5; state.players[2]!.vp = 5;
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  return state;
}

function activate(state: GameState, playerId = 'p1') {
  return rules.dispatchAbilityCommand(state, playerId, { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ABILITY });
}
function choose(state: GameState, playerId: string, optionId: string) {
  const d = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: d.id, selectedIds: [optionId] });
}

describe('P3 F4 M50-02 structured each-player option', () => {
  it('routes each turn-order decision to that player and applies decision_player effects only to that chooser', () => {
    const state = setup();
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p2', candidates: ['pay', 'refuse'], min: 1, max: 1 });
    expect(choose(state, 'p1', 'pay').ok).toBe(false);
    expect(state.players[1]!.mana).toBe(3);
    expect(choose(state, 'p2', 'pay').ok).toBe(true);
    expect(state.players[1]!.mana).toBe(1);
    expect(state.abilityRuntime!.playerStatusKeysByPlayer?.p2).toContain('paid');
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p3', candidates: ['pay', 'refuse'] });
    expect(choose(state, 'p3', 'refuse').ok).toBe(true);
    expect(state.players[2]!.vp).toBe(4);
    expect(state.players[0]!.mana).toBe(5);
    expect(state.players[0]!.vp).toBe(5);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.abilityRuntime!.pendingStructuredEachPlayerOption).toBeUndefined();
  });

  it('skips players that fail the authoritative candidate condition', () => {
    const state = setup();
    state.players[1]!.mana = 1;
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p3' });
    expect(choose(state, 'p3', 'pay').ok).toBe(true);
    expect(state.players[2]!.mana).toBe(2);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });

  it('fails closed for nested choices and malformed option ids', () => {
    const nested = rules.loadAuthoringJson(archive({ options: [
      { id: 'a', effects: [{ type: 'choose_one', options: [{ id: 'x' }] }] },
      { id: 'b', effects: [] },
    ] }));
    expect(nested.report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Unsupported structured each-player option shape' })]));
    const duplicate = rules.loadAuthoringJson(archive({ options: [
      { id: 'same', effects: [] }, { id: 'same', effects: [] },
    ] }));
    expect(duplicate.report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Unsupported structured each-player option shape' })]));
  });
});