import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const OWNER = 'servant.fixture.maxwell';
const SOURCE_DEF = 'servant.fixture.maxwell.skill.s2';
const SOURCE = 'maxwell-s2-source';

function seedAbility(): any {
  return {
    id: 'paradox-seed', kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
    conditions: [{ type: 'phase_is', phase: 'action' }], targets: [], cost: [],
    effects: [
      { type: 'gain_mana', target: { scope: 'same_location_players' }, amount: 2 },
      { type: 'add_player_flag_number', target: { scope: 'same_location_players' }, key: 'paradoxCount', amount: 1 },
    ],
    ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {},
    limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function collapseAbility(): any {
  return {
    id: 'paradox-collapse', kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
    activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
    conditions: [{ type: 'phase_is', phase: 'combat' }], targets: [], cost: [],
    effects: [{
      type: 'defeat_player',
      target: { scope: 'all_players', where: [{ type: 'player_flag_greater_than_mana_ratio', key: 'paradoxCount', numerator: 1, denominator: 2 }] },
    }],
    ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {},
    limit: { type: 'per_game', uses: 1, scope: 'this_card' },
    visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: OWNER, name: 'fixture', class: 'Caster',
    cards: [{
      id: SOURCE_DEF, name: 'Paradox', cardType: 'servant_skill', owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: 'skill', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [seedAbility(), collapseAbility()],
    }],
  };
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] }); state.cards = [];
  state.players[0]!.servantCardId = OWNER; state.players[0]!.mana = 2; state.players[1]!.mana = 3; state.players[2]!.mana = 4;
  state.players[0]!.locationId = 'city'; state.players[1]!.locationId = 'city'; state.players[2]!.locationId = 'mountain';
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  state.cards.push({ instanceId: SOURCE, definitionId: SOURCE_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState[SOURCE] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function action(state: GameState, abilityId: string) {
  return rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'activate_ability' && candidate.cardInstanceId === SOURCE && candidate.abilityId === abilityId);
}

describe('P3 F4 M50-02 Maxwell paradox structured family', () => {
  it('seed grants exactly +2 mana and +1 paradox to active same-location players only', () => {
    const state = setup();
    expect(action(state, 'paradox-seed')).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state, 'paradox-seed')!).ok).toBe(true);
    expect(state.players.find((player) => player.id === 'p1')?.mana).toBe(4);
    expect(state.players.find((player) => player.id === 'p2')?.mana).toBe(5);
    expect(state.players.find((player) => player.id === 'p3')?.mana).toBe(4);
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer?.p1?.paradoxCount).toBe(1);
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer?.p2?.paradoxCount).toBe(1);
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer?.p3?.paradoxCount).toBeUndefined();
  });

  it('seed is once per round but becomes legal again on a later round', () => {
    const state = setup();
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state, 'paradox-seed')!).ok).toBe(true);
    expect(action(state, 'paradox-seed')).toBeUndefined();
    rules.advanceAbilityPhase(state, 'preparation', 2); rules.advanceAbilityPhase(state, 'action', 2);
    state.round.prioritySeat = state.players[0]!.seat;
    expect(action(state, 'paradox-seed')).toBeTruthy();
  });

  it('collapse defeats exactly active players whose paradox count is strictly greater than half their mana and reveals true name', () => {
    const state = setup(); state.round.activePhase = 'battle';
    state.players[0]!.mana = 4; state.players[1]!.mana = 6; state.players[2]!.mana = 5;
    state.abilityRuntime!.structuredPlayerFlagsByPlayer = {
      p1: { paradoxCount: 3 }, // 3 > 2 -> defeated
      p2: { paradoxCount: 3 }, // 3 == 3 -> not defeated
      p3: { paradoxCount: 3 }, // 3 > 2.5 -> defeated
    };
    expect(action(state, 'paradox-collapse')).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state, 'paradox-collapse')!).ok).toBe(true);
    expect(state.abilityRuntime!.structuredDefeatRoundByPlayer).toMatchObject({ p1: state.round.roundNumber, p3: state.round.roundNumber });
    expect(state.abilityRuntime!.structuredDefeatRoundByPlayer?.p2).toBeUndefined();
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
  });

  it('collapse remains exhausted across rounds because its per-game limit overrides the source per-round default', () => {
    const state = setup(); state.round.activePhase = 'battle';
    state.abilityRuntime!.structuredPlayerFlagsByPlayer = { p2: { paradoxCount: 1 } };
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state, 'paradox-collapse')!).ok).toBe(true);
    rules.advanceAbilityPhase(state, 'preparation', 2); rules.advanceAbilityPhase(state, 'battle', 2); state.round.prioritySeat = state.players[0]!.seat;
    expect(action(state, 'paradox-collapse')).toBeUndefined();
  });

  it('fails closed when the physical source is inactive', () => {
    const state = setup(); state.abilityRuntime!.cardState[SOURCE]!.active = false;
    expect(action(state, 'paradox-seed')).toBeUndefined();
    const denied = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: 'paradox-seed' });
    expect(denied.ok).toBe(false); expect(state.players[0]!.mana).toBe(2);
  });

  it('rejects malformed or widened ratio-defeat envelopes instead of routing them through pre-battle defeat', () => {
    const zero = archive(); zero.cards[0].abilities[1].effects[0].target.where[0].denominator = 0;
    expect(rules.loadAuthoringJson(zero).report).toEqual(expect.arrayContaining([expect.objectContaining({ abilityId: 'paradox-collapse' })]));
    const widened = archive(); widened.cards[0].abilities[1].effects[0].target.where[0].extra = true;
    expect(rules.loadAuthoringJson(widened).report).toEqual(expect.arrayContaining([expect.objectContaining({ abilityId: 'paradox-collapse' })]));
  });
});