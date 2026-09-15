import { describe, expect, it } from 'vitest';

import {
  DataFlowValidationError,
  ResolutionRuntimeError,
  executeResolution,
  normalizeResolutionDataFlowNodes,
} from '../../src/ability/resolution-dataflow';
import { isFixedControllerSourceRemovalComponent } from '../../src/ability/interpreter';
import { createSeededGameState } from '../../src/tools/seeded-state';

function initializeRuntime(state: ReturnType<typeof createSeededGameState>): void {
  state.abilityRuntime = {
    pack: { cards: {} }, revision: 0, sequence: 0, randomState: 20260916,
    cardState: {}, ongoingEffects: [], responseWindows: [], usedAbilities: {}, processedEvents: [], revealedServants: [],
    events: [], calculations: [], preventEffects: false, manaCaps: {}, manaGainBlocked: [], hostRequests: [],
    roomMode: 'standard', abilityUsage: {}, noblePhantasmCostsThisRound: {}, consecutivePlayRounds: {},
    movementDistanceThisRound: {}, battlefieldsPassedOrStayedThisRound: {}, playRulesVersion: 'explicit-v1',
    playCounters: { round: 1, cardsPlayedByPlayer: {}, attacksDeclaredByPlayer: {} },
  };
}

function stateWithSource(zone: 'skill' | 'field' | 'attack_area' | 'removed_from_game' = 'skill', owner = 'p1') {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  initializeRuntime(state);
  state.cards = [{
    instanceId: 'source-card', definitionId: 'fixture.source', ownerPlayerId: owner, controllerPlayerId: owner,
    zone, visibility: zone === 'removed_from_game' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner },
  }];
  state.abilityRuntime!.cardState['source-card'] = { active: true, faceDown: false, playedRound: 1 };
  return state;
}

const removeEffect = { type: 'move_source_card', to: { zone: 'removed_from_game', owner: 'controller' } } as const;

describe('P3-FB2-07 fixed controller source-card removal component', () => {
  it('normalizes the new removal destination without broadening unsupported source destinations', () => {
    expect(normalizeResolutionDataFlowNodes([
      { id: 'remove-source', ...removeEffect },
    ])).toEqual([
      { id: 'remove-source', type: 'move_source_card', to: 'removed_from_game' },
    ]);

    expect(normalizeResolutionDataFlowNodes([
      { id: 'return-source', type: 'move_source_card', to: { zone: 'skill', owner: 'controller' } },
    ])).toEqual([
      { id: 'return-source', type: 'move_source_card', to: 'skill' },
    ]);

    expect(() => normalizeResolutionDataFlowNodes([
      { id: 'wrong-owner', type: 'move_source_card', to: { zone: 'removed_from_game', owner: 'target' } },
    ])).toThrow(DataFlowValidationError);
    expect(() => normalizeResolutionDataFlowNodes([
      { id: 'wrong-zone', type: 'move_source_card', to: { zone: 'discard', owner: 'controller' } },
    ])).toThrow(DataFlowValidationError);
  });

  it('classifies only the exact identity-free controller source-removal component', () => {
    expect(isFixedControllerSourceRemovalComponent(removeEffect as never)).toBe(true);
    expect(isFixedControllerSourceRemovalComponent({ type: 'move_source_card', to: { zone: 'removed_from_game' } } as never)).toBe(true);

    for (const rejected of [
      { type: 'move_source_card', to: { zone: 'skill', owner: 'controller' } },
      { type: 'move_source_card', to: { zone: 'removed_from_game', owner: 'target' } },
      { type: 'move_source_card', to: { zone: 'removed_from_game', owner: 'controller', face: 'up' } },
      { type: 'move_source_card', to: { zone: 'removed_from_game', owner: 'controller' }, reason: 'extra' },
      { type: 'move_card', target: 'this_card', to: { zone: 'removed_from_game', owner: 'controller' } },
    ]) expect(isFixedControllerSourceRemovalComponent(rejected as never)).toBe(false);
  });

  it('moves a controller-owned source to public removed_from_game and marks it inactive', () => {
    const state = stateWithSource('skill');
    const result = executeResolution({
      state, controllerId: 'p1', sourceCardId: 'source-card', abilityId: 'renamed-removal',
      effects: [{ id: 'remove-source', type: 'move_source_card', to: 'removed_from_game' }],
    });

    expect(state.cards[0]!.zone).toBe('skill');
    expect(result.nextState.cards[0]).toMatchObject({
      instanceId: 'source-card', zone: 'removed_from_game', controllerPlayerId: 'p1', visibility: { scope: 'public' },
    });
    expect(result.nextState.abilityRuntime!.cardState['source-card']?.active).toBe(false);
    expect(result.results[0]).toMatchObject({
      effectType: 'move_source_card', status: 'applied',
      payload: { cardInstanceId: 'source-card', fromZone: 'skill', toZone: 'removed_from_game', movedCount: 1 },
    });
    expect(result.emittedEvents).toContainEqual(expect.objectContaining({
      type: 'source_card_moved', sourceCardId: 'source-card', abilityId: 'renamed-removal',
      fromZone: 'skill', toZone: 'removed_from_game', movedCount: 1,
    }));
  });

  it('fails closed for wrong controller and already-removed source', () => {
    const wrongOwner = stateWithSource('skill', 'p2');
    expect(() => executeResolution({
      state: wrongOwner, controllerId: 'p1', sourceCardId: 'source-card', abilityId: 'wrong-controller',
      effects: [{ id: 'remove-source', type: 'move_source_card', to: 'removed_from_game' }],
    })).toThrow(ResolutionRuntimeError);
    expect(wrongOwner.cards[0]!.zone).toBe('skill');

    const alreadyRemoved = stateWithSource('removed_from_game');
    expect(() => executeResolution({
      state: alreadyRemoved, controllerId: 'p1', sourceCardId: 'source-card', abilityId: 'duplicate-remove',
      effects: [{ id: 'remove-source', type: 'move_source_card', to: 'removed_from_game' }],
    })).toThrow('already removed from game');
    expect(alreadyRemoved.cards[0]!.zone).toBe('removed_from_game');
  });

  it('rolls the removal back when a later typed node fails', () => {
    const state = stateWithSource('skill');
    expect(() => executeResolution({
      state, controllerId: 'p1', sourceCardId: 'source-card', abilityId: 'rollback-removal',
      effects: [
        { id: 'remove-source', type: 'move_source_card', to: 'removed_from_game' },
        { id: 'fail-later', type: 'fail_invariant', message: 'rollback proof' },
      ],
    })).toThrow(ResolutionRuntimeError);
    expect(state.cards[0]).toMatchObject({ zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
    expect(state.abilityRuntime!.cardState['source-card']?.active).toBe(true);
    expect(state.abilityRuntime!.events).toEqual([]);
  });

  it('preserves the existing B15 active-board gate for source return to skill', () => {
    const board = stateWithSource('attack_area');
    board.cards[0]!.visibility = { scope: 'public' };
    const result = executeResolution({
      state: board, controllerId: 'p1', sourceCardId: 'source-card', abilityId: 'battle-end-return',
      effects: [{ id: 'return-source', type: 'move_source_card', to: 'skill' }],
    });
    expect(result.nextState.cards[0]).toMatchObject({ zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
    expect(result.nextState.abilityRuntime!.cardState['source-card']?.active).toBe(false);

    const offBoard = stateWithSource('skill');
    expect(() => executeResolution({
      state: offBoard, controllerId: 'p1', sourceCardId: 'source-card', abilityId: 'invalid-b15-return',
      effects: [{ id: 'return-source', type: 'move_source_card', to: 'skill' }],
    })).toThrow('active on the board');
  });
});
