import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD = 'master.fixture.skill.status-seals';
const SOURCE = 'status-seals-source';
const FORMULA = { type: 'formula', op: 'add', args: [1, { type: 'metric', metric: 'players_with_status_count', source: 'controller', status: 'role:god-servant' }] };

function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: 'master.fixture', name: 'fixture', class: 'Master',
    cards: [{
      id: CARD, name: 'fixture', cardType: 'master_skill', owner: { type: 'master', id: 'master.fixture' },
      cardFace: { typeLabel: 'fixture', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [
        {
          id: 'vassalize-like', kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
          activation: { phase: 'action', opens: 'controller_action_window' },
          conditions: [
            { type: 'has_status', status: 'role:red-team-leader' },
            { type: 'command_seals_at_least', target: 'controller', value: FORMULA },
          ], targets: [], cost: [],
          effects: [{
            type: 'choose_players', candidateTarget: 'all_opponents', minCount: 1, maxCount: 1, payloadKey: 'targetPlayerId',
            candidateConditions: [
              { type: 'lacks_status', status: 'history:god-servant' },
              { type: 'command_seals_less_than_controller' },
            ],
            then: [
              { type: 'pay_command_seals', target: 'controller', amount: FORMULA },
              { type: 'gain_mana', target: 'targetPlayerId', amount: 2 },
            ],
          }], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          execution: { mode: 'automatic', allowedOperations: [] },
        },
        {
          id: 'overpay', kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
          activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [], targets: [], cost: [],
          effects: [{ type: 'pay_command_seals', target: 'controller', amount: 4 }], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          execution: { mode: 'automatic', allowedOperations: [] },
        },
      ],
    }],
  };
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{ instanceId: SOURCE, definitionId: CARD, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.commandSpells = 3; state.players[1]!.commandSpells = 1; state.players[2]!.commandSpells = 3;
  state.players[0]!.mana = 4; state.players[1]!.mana = 2; state.players[2]!.mana = 5;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  state.abilityRuntime!.playerStatusKeysByPlayer = {
    p1: ['role:red-team-leader'],
    p2: ['role:god-servant'],
    p3: [],
  };
  return state;
}

function activate(state: GameState, abilityId: string) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId });
}

describe('P3 F4 M50-02 structured status + command seals', () => {
  it('uses authoritative status/seal state to filter a target and pay the computed seal cost', () => {
    const state = setup();
    expect(activate(state, 'vassalize-like').ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p1', candidates: ['p2'], min: 1, max: 1 });
    const d = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: ['p2'] }).ok).toBe(true);
    expect(state.players[0]!.commandSpells).toBe(1); // 1 + one player carrying role:god-servant
    expect(state.players[1]!.mana).toBe(4);
    expect(state.players[2]!.mana).toBe(5);
  });

  it('fails closed without partially spending when command seals are insufficient', () => {
    const state = setup();
    expect(activate(state, 'overpay').ok).toBe(false);
    expect(state.players[0]!.commandSpells).toBe(3);
  });

  it('excludes a candidate that already has the forbidden history status', () => {
    const state = setup();
    state.abilityRuntime!.playerStatusKeysByPlayer!.p2!.push('history:god-servant');
    expect(activate(state, 'vassalize-like').ok).toBe(false);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.players[0]!.commandSpells).toBe(3);
  });
});
