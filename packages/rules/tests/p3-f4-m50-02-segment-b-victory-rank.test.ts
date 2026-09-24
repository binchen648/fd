import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD = 'servant.fixture.skill.rank';
const SOURCE = 'rank-source';
const ABILITY = 'rank-action';

function archive(condition: any = { type: 'victory_points_is_first' }): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.fixture', name: 'fixture', class: 'Caster',
    cards: [{ id: CARD, name: 'fixture', cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.fixture' },
      cardFace: { typeLabel: 'fixture', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [{ id: ABILITY, kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
        activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [condition], targets: [], cost: [],
        effects: [{ type: 'gain_mana', target: 'controller', amount: 1 }], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
        execution: { mode: 'automatic', allowedOperations: [] },
      }],
    }],
  };
}

function setup(vp: [number, number, number]): GameState {
  const pack = rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{ instanceId: SOURCE, definitionId: CARD, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  state.players[0]!.vp = vp[0]; state.players[1]!.vp = vp[1]; state.players[2]!.vp = vp[2];
  state.players[0]!.mana = 2; state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 }); return state;
}

function activate(state: GameState) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ABILITY });
}

describe('P3 F4 M50-02 Segment B victory-point rank condition', () => {
  it('accepts a tied highest active player as first place, matching locked Reference', () => {
    const state = setup([5, 5, 2]);
    expect(activate(state).ok).toBe(true); expect(state.players[0]!.mana).toBe(3);
  });
  it('rejects activation when another active player has more victory points', () => {
    const state = setup([4, 5, 2]);
    expect(activate(state).ok).toBe(false); expect(state.players[0]!.mana).toBe(2);
  });
  it('rejects malformed rank conditions at load time', () => {
    const pack = rules.loadAuthoringJson(archive({ type: 'victory_points_is_first', value: 1 }));
    expect(pack.report).toEqual(expect.arrayContaining([expect.objectContaining({ abilityId: ABILITY, reason: 'Unsupported victory-point first-place condition shape' })]));
  });
});