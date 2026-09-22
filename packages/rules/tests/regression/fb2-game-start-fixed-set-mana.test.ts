import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility, RuleNode } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const OWNER = 'fixture.game-start-set-mana-owner';
const SOURCE = 'fixture.game-start-set-mana-source';
const SOURCE_INSTANCE = 'fixture-game-start-set-mana-source';

function ability(amount = 6): AuthoringAbility {
  return {
    id: 'renamed.synthetic.game-start-set-mana',
    kind: 'forced_trigger',
    printedClause: 'synthetic initial mana',
    activation: { trigger: 'game_start' },
    conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    effects: [{ type: 'set_mana', player: 'controller', amount }],
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function archive(sourceAbility = ability()) {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    id: OWNER,
    name: 'Renamed Synthetic Owner',
    class: 'Master',
    cards: [{
      id: SOURCE,
      name: 'Synthetic initial mana',
      cardType: 'master_skill',
      cardFace: { typeLabel: '特殊', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [sourceAbility],
    }],
  };
}

function setup(amount = 6): GameState {
  const pack = rules.loadAuthoringJson(archive(ability(amount)));
  expect(pack.report).toEqual([]);
  const loaded = pack.cards[SOURCE]!.abilities[0]!;
  expect(rules.isGameStartFixedControllerManaSetSemantic(loaded)).toBe(true);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.masterCardId = OWNER;
  state.players[0]!.mana = 2;
  state.players[1]!.mana = 7;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260918 });
  state.abilityRuntime!.manaCaps.p1 = 12;
  state.cards.push({
    instanceId: SOURCE_INSTANCE,
    definitionId: SOURCE,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  return state;
}

function start(state: GameState, id = 'trusted-game-start'): void {
  rules.processAbilityEvent(state, { id, type: 'game_start' });
}

function malformed(mutator: (candidate: AuthoringAbility) => void): AuthoringAbility {
  const candidate = ability();
  mutator(candidate);
  return candidate;
}

describe('P3-FB2-25 identity-free game-start fixed-controller set-mana semantic', () => {
  it('accepts only the exact fixed-controller literal parent envelope', () => {
    for (const amount of [3, 6]) {
      expect(rules.isGameStartFixedControllerManaSetSemantic(ability(amount))).toBe(true);
    }

    const cases: AuthoringAbility[] = [
      malformed((a) => { a.activation = { trigger: 'while_active' }; }),
      malformed((a) => { a.activation = { trigger: 'game_start', phase: 'action' }; }),
      malformed((a) => { a.conditions = [{ type: 'controller_mana_at_least', value: 1 }]; }),
      malformed((a) => { a.effects.push({ type: 'adjust_mana', player: 'controller', amount: 1 }); }),
      malformed((a) => { a.lifecycle = { duration: 'game' }; }),
      malformed((a) => { a.ruleModifiers = [{ operation: 'set', rule: 'mana_capacity', value: 16 }]; }),
      malformed((a) => { a.effects = [{ type: 'set_mana', player: 'target', amount: 6 }]; }),
      malformed((a) => { a.effects = [{ type: 'set_mana', player: 'controller', amount: -1 }]; }),
      malformed((a) => { a.effects = [{ type: 'set_mana', player: 'controller', amount: 1.5 }]; }),
      malformed((a) => { a.effects = [{ type: 'set_mana', player: 'controller', amount: { var: 'X' } } as RuleNode]; }),
      malformed((a) => { a.responseWindow = { opens: 'controller_action_window' }; }),
      malformed((a) => { a.execution.allowedOperations = ['adjust-mana']; }),
    ];
    for (const candidate of cases) expect(rules.isGameStartFixedControllerManaSetSemantic(candidate)).toBe(false);
  });

  it('sets controller mana to exact 6 and 3 targets through trusted game_start without touching another player', () => {
    for (const amount of [6, 3]) {
      const state = setup(amount);
      start(state, `game-start-${amount}`);
      expect(state.players[0]!.mana).toBe(amount);
      expect(state.players[1]!.mana).toBe(7);
      expect(state.abilityRuntime!.events.filter((event) => event.type === 'mana_adjusted')).toEqual([
        expect.objectContaining({
          playerId: 'p1', sourceCardId: SOURCE_INSTANCE,
          abilityId: 'renamed.synthetic.game-start-set-mana',
          delta: amount - 2, before: 2, after: amount,
        }),
      ]);
    }
  });

  it('is idempotent for duplicate trusted event replay and keeps same-value assignment a no-op', () => {
    const state = setup(6);
    start(state);
    const revision = state.abilityRuntime!.revision;
    const events = structuredClone(state.abilityRuntime!.events);
    start(state);
    expect(state.players[0]!.mana).toBe(6);
    expect(state.abilityRuntime!.revision).toBe(revision);
    expect(state.abilityRuntime!.events).toEqual(events);

    const same = setup(6);
    same.players[0]!.mana = 6;
    start(same, 'same-value-game-start');
    expect(same.players[0]!.mana).toBe(6);
    expect(same.abilityRuntime!.events.filter((event) => event.type === 'mana_adjusted')).toEqual([]);
  });

  it('fails closed before mutation for near-match parent shapes and preserves transaction rollback', () => {
    const invalid = setup(6);
    const compiled = invalid.abilityRuntime!.pack.cards[SOURCE]!.abilities[0]!;
    compiled.lifecycle = { duration: 'game' };
    expect(rules.isGameStartFixedControllerManaSetSemantic(compiled)).toBe(false);
    start(invalid, 'near-match-game-start');
    expect(invalid.players[0]!.mana).toBe(2);
    expect(invalid.abilityRuntime!.events.filter((event) => event.type === 'mana_adjusted')).toEqual([]);

    const direct = setup(6);
    const directAbility = direct.abilityRuntime!.pack.cards[SOURCE]!.abilities[0]!;
    directAbility.effects.push({ type: 'adjust_mana', player: 'controller', amount: 1 });
    expect(() => rules.executeAbility(direct, {
      controllerId: 'p1', sourceCardId: SOURCE_INSTANCE, abilityId: directAbility.id,
      variables: {}, selections: {},
    } as never)).toThrow(/Unsupported game-start fixed set-mana semantic shape/);
    expect(direct.players[0]!.mana).toBe(2);
  });

  it('retains FB2-05 cap semantics for the composed parent route', () => {
    const state = setup(6);
    state.abilityRuntime!.manaCaps.p1 = 4;
    expect(() => start(state, 'over-cap-game-start')).toThrow();
    expect(state.players[0]!.mana).toBe(2);
    expect(state.abilityRuntime!.processedEvents).toEqual([]);
    expect(state.abilityRuntime!.events.filter((event) => event.type === 'mana_adjusted')).toEqual([]);
  });
});
