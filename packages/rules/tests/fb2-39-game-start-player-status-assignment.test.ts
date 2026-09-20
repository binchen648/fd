import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { AuthoringAbility, RuleNode } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SOURCE_DEFINITION = 'fixture.status-source';
const SOURCE_INSTANCE = 'fixture-status-source-instance';

const controllerEffect = (status = 'opaque.controller.key'): RuleNode => ({
  type: 'add_status', target: 'controller', status,
});

const nextPlayerEffect = (status = 'opaque.next.key'): RuleNode => ({
  type: 'add_status', target: { scope: 'turn_order_next_player' }, status,
});

function ability(effects: RuleNode[] = [controllerEffect(), nextPlayerEffect()]): AuthoringAbility {
  return {
    id: 'renamed.synthetic.status-assignment', kind: 'forced_trigger', printedClause: 'synthetic opaque assignment',
    activation: { trigger: 'game_start' }, conditions: [{ type: 'source_owned' }], targets: [], effects,
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function card(sourceAbility: AuthoringAbility = ability()) {
  return {
    id: SOURCE_DEFINITION, name: 'Synthetic source', cardType: 'master_skill',
    cardFace: { typeLabel: 'special', attributes: [], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [sourceAbility],
  };
}

function archive(sourceAbility: AuthoringAbility = ability()) {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: 'fixture.status-owner', name: 'Synthetic owner', class: 'Master',
    cards: [card(sourceAbility)],
  };
}

function setup(
  effects: RuleNode[] = [controllerEffect(), nextPlayerEffect()],
  controllerId = 'p2',
  activeSeats: number[] = [1, 2, 3, 4, 5, 6, 7],
): GameState {
  const pack = rules.loadAuthoringJson(archive(ability(effects)));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats });
  state.cards = [{
    instanceId: SOURCE_INSTANCE, definitionId: SOURCE_DEFINITION,
    ownerPlayerId: controllerId, controllerPlayerId: controllerId, zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: controllerId },
  }];
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
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

describe('P3-FB2-39 exact game-start player-status assignment', () => {
  it('classifies and loads only the exact identity-free envelope and effects', () => {
    expect(rules.isExactGameStartPlayerStatusAssignmentEffect(controllerEffect())).toBe(true);
    expect(rules.isExactGameStartPlayerStatusAssignmentEffect(nextPlayerEffect())).toBe(true);
    expect(rules.isGameStartPlayerStatusAssignmentSemantic(ability())).toBe(true);
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report).toEqual([]);
    expect(loaded.cards[SOURCE_DEFINITION]!.abilities[0]!.execution.allowedOperations).toEqual([]);
    expect(rules.isGameStartPlayerStatusAssignmentSemantic(loaded.cards[SOURCE_DEFINITION]!.abilities[0]!)).toBe(true);
  });

  it('rejects wrong trigger, missing or widened condition, invalid status, invalid target, extra fields, and unrelated effects', () => {
    const cases: AuthoringAbility[] = [
      malformed((candidate) => { candidate.activation = { trigger: 'while_active' }; }),
      malformed((candidate) => { candidate.conditions = []; }),
      malformed((candidate) => { candidate.conditions = [{ type: 'source_owned', owner: 'controller' }]; }),
      malformed((candidate) => { candidate.effects = [controllerEffect('')]; }),
      malformed((candidate) => { candidate.effects = [controllerEffect('   ')]; }),
      malformed((candidate) => { candidate.effects = [{ type: 'add_status', target: 'controller', status: 1 }]; }),
      malformed((candidate) => { candidate.effects = [{ type: 'add_status', target: 'other_player', status: 'opaque' }]; }),
      malformed((candidate) => { candidate.effects = [{ type: 'add_status', target: { scope: 'turn_order_next_player', extra: true }, status: 'opaque' }]; }),
      malformed((candidate) => { candidate.effects = [{ ...controllerEffect(), extra: true }]; }),
      malformed((candidate) => { candidate.effects.push({ type: 'noop' }); }),
      malformed((candidate) => { candidate.effects = [{ type: 'branch', branches: [{ then: [controllerEffect()] }] }]; }),
      malformed((candidate) => { candidate.effects = []; candidate.creates = [controllerEffect()]; }),
      malformed((candidate) => { candidate.responseWindow = { order: 'turn_order' }; }),
    ];
    for (const candidate of cases) {
      expect(rules.isGameStartPlayerStatusAssignmentSemantic(candidate)).toBe(false);
      expect(rules.loadAuthoringJson(archive(candidate)).report).toEqual(expect.arrayContaining([
        expect.objectContaining({ status: 'unsupported' }),
      ]));
    }
  });

  it('assigns an opaque controller status without changing PlayerState.status', () => {
    const state = setup([controllerEffect('opaque.controller/a')]);
    const playerStatuses = state.players.map((player) => player.status);
    start(state);
    expect(rules.playerStatusKeys(state, 'p2')).toEqual(['opaque.controller/a']);
    expect(rules.playerHasStatus(state, 'p2', 'opaque.controller/a')).toBe(true);
    expect(state.players.map((player) => player.status)).toEqual(playerStatuses);
  });

  it('uses circular authoritative seat order and skips eliminated players independently of array order', () => {
    const state = setup([nextPlayerEffect('opaque.circular')], 'p2', [2, 4, 7]);
    state.players = [state.players[6]!, state.players[3]!, state.players[1]!, state.players[0]!, state.players[5]!, state.players[2]!, state.players[4]!];
    start(state);
    expect(rules.playerStatusKeys(state, 'p4')).toEqual(['opaque.circular']);
    expect(rules.playerStatusKeys(state, 'p3')).toEqual([]);
    expect(rules.playerStatusKeys(state, 'p7')).toEqual([]);
  });

  it('wraps once from the final seat to the first active non-controller player', () => {
    const state = setup([nextPlayerEffect('opaque.wrap')], 'p7', [1, 4, 7]);
    start(state);
    expect(rules.playerStatusKeys(state, 'p1')).toEqual(['opaque.wrap']);
    expect(rules.turnOrderNextActivePlayerId(state, 'p7')).toBe('p1');
  });

  it('fails closed atomically when there is no valid other player or seat topology is ambiguous', () => {
    const onlySelf = setup([controllerEffect('opaque.self'), nextPlayerEffect('opaque.other')], 'p2', [2]);
    expect(rules.collectTriggeredAbilities(onlySelf, { id: 'probe', type: 'game_start' })).toEqual([]);
    start(onlySelf);
    expect(onlySelf.abilityRuntime!.playerStatusKeysByPlayer).toEqual({});

    const ambiguous = setup([nextPlayerEffect('opaque.ambiguous')], 'p2', [2, 4]);
    ambiguous.players.find((player) => player.id === 'p4')!.seat = 2;
    expect(rules.turnOrderNextActivePlayerId(ambiguous, 'p2')).toBeUndefined();
    start(ambiguous, 'ambiguous-game-start');
    expect(ambiguous.abilityRuntime!.playerStatusKeysByPlayer).toEqual({});
  });

  it('preserves multiple keys and deduplicates repeated assignments per player across distinct events', () => {
    const state = setup([
      nextPlayerEffect('opaque.first'), nextPlayerEffect('opaque.second'), nextPlayerEffect('opaque.first'),
    ], 'p2', [2, 4]);
    start(state);
    start(state, 'second-trusted-game-start');
    expect(rules.playerStatusKeys(state, 'p4')).toEqual(['opaque.first', 'opaque.second']);
  });

  it('preserves existing game-start handlers alongside the new exact route', () => {
    const statusAbility = ability([controllerEffect('opaque.composed')]);
    const manaAbility: AuthoringAbility = {
      ...ability([]), id: 'existing.game-start-set-mana', conditions: [],
      effects: [{ type: 'set_mana', player: 'controller', amount: 6 }],
    };
    const raw = archive(statusAbility);
    raw.cards[0]!.abilities.push(manaAbility);
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [{
      instanceId: SOURCE_INSTANCE, definitionId: SOURCE_DEFINITION,
      ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    }];
    state.players[0]!.mana = 2;
    rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
    start(state);
    expect(state.players[0]!.mana).toBe(6);
    expect(rules.playerStatusKeys(state, 'p1')).toEqual(['opaque.composed']);
  });
});
