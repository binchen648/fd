import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD = 'master.fixture.skill.status-formula';
const SOURCE = 'status-formula-source';
const ABILITY = 'cleanup-and-ceil';

function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: 'master.fixture', name: 'fixture', class: 'Master',
    cards: [{ id: CARD, name: 'fixture', cardType: 'master_skill', owner: { type: 'master', id: 'master.fixture' },
      cardFace: { typeLabel: 'fixture', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [{ id: ABILITY, kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
        activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [], targets: [], cost: [],
        effects: [
          { type: 'remove_status', target: { scope: 'all_players' }, status: 'fixture-paid' },
          { type: 'gain_mana', target: 'controller', amount: { type: 'formula', op: 'ceil_divide', args: [5, 2] } },
        ], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
        execution: { mode: 'automatic', allowedOperations: [] },
      }],
    }],
  };
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{ instanceId: SOURCE, definitionId: CARD, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat; state.players[0]!.mana = 1;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  (state.abilityRuntime as any).playerStatusKeysByPlayer = { p1: ['fixture-paid', 'keep'], p2: ['fixture-paid'] };
  return state;
}

describe('P3 F4 M50-02 Segment B status cleanup and ceil formula', () => {
  it('removes the named status from all active targets and preserves unrelated status keys', () => {
    const state = setup();
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ABILITY }).ok).toBe(true);
    expect((state.abilityRuntime as any).playerStatusKeysByPlayer).toEqual({ p1: ['keep'], p2: [] });
  });
  it('evaluates ceil_divide through the controlled numeric AST', () => {
    const state = setup();
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ABILITY }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4);
  });
  it('rejects malformed remove_status authoring instead of widening the shape', () => {
    const bad = archive(); bad.cards[0].abilities[0].effects[0].extra = true;
    const pack = rules.loadAuthoringJson(bad);
    expect(pack.report).toEqual(expect.arrayContaining([expect.objectContaining({ abilityId: ABILITY, path: 'effects[0].extra', reason: 'Unmapped mechanic field' })]));
  });
});
