import { describe, expect, it } from 'vitest';

import {
  DataFlowValidationError,
  ResolutionRuntimeError,
  executeResolution,
  listResolutionPrimitiveTypes,
  normalizeResolutionDataFlowNodes,
  resultSchemas,
} from '../../src/ability/resolution-dataflow';
import {
  isDeploymentResourceRewardSemantic,
  isFixedControllerManaSetComponent,
  isResourceNumericDirectActionSemantic,
  isResourceNumericTriggerSemantic,
} from '../../src/ability/interpreter';
import type { AuthoringAbility } from '../../src/ability/types';
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

function setAbility(effect: AuthoringAbility['effects'][number]): AuthoringAbility {
  return {
    id: 'renamed-set-mana-parent',
    kind: 'forced_trigger',
    printedClause: '',
    activation: { trigger: 'game_start' },
    conditions: [],
    targets: [],
    effects: [effect],
    cost: [],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

describe('P3-FB2-05 fixed controller set-mana primitive', () => {
  it('registers and normalizes only a fixed controller literal set node', () => {
    expect(listResolutionPrimitiveTypes()).toContain('set_mana');
    expect(resultSchemas.set_mana).toEqual(expect.objectContaining({
      before: 'number',
      after: 'number',
      targetAmount: 'number',
      actualDelta: 'number',
      status: 'status',
    }));

    expect(normalizeResolutionDataFlowNodes([
      { id: 'set-six', type: 'set_mana', player: 'controller', amount: 6 },
    ])).toEqual([
      { id: 'set-six', type: 'set_mana', player: 'controller', amount: 6 },
    ]);

    expect(() => normalizeResolutionDataFlowNodes([
      { id: 'set-expression', type: 'set_mana', player: 'controller', amount: { expr: 'binding_field', binding: 'x', field: 'after', valueType: 'number' } },
    ])).toThrow(DataFlowValidationError);
    expect(() => normalizeResolutionDataFlowNodes([
      { id: 'set-other', type: 'set_mana', player: 'target', amount: 6 },
    ])).toThrow(DataFlowValidationError);
    expect(() => normalizeResolutionDataFlowNodes([
      { id: 'set-fraction', type: 'set_mana', player: 'controller', amount: 1.5 },
    ])).toThrow(DataFlowValidationError);
  });

  it('classifies the fixed controller component without granting a parent route', () => {
    for (const amount of [0, 3, 6, 10]) {
      expect(isFixedControllerManaSetComponent({ type: 'set_mana', amount } as never)).toBe(true);
      expect(isFixedControllerManaSetComponent({ type: 'set_mana', player: 'controller', amount } as never)).toBe(true);
    }

    for (const candidate of [
      { type: 'set_mana', amount: -1 },
      { type: 'set_mana', amount: 1.5 },
      { type: 'set_mana', amount: { var: 'X' } },
      { type: 'set_mana', player: 'target', amount: 3 },
      { type: 'set_mana', amount: 3, directive: 'extra-semantics' },
      { type: 'adjust_mana', amount: 3 },
    ]) {
      expect(isFixedControllerManaSetComponent(candidate as never)).toBe(false);
    }

    const unsupported = setAbility({ type: 'set_mana', amount: 6 } as never);
    expect(isFixedControllerManaSetComponent(unsupported.effects[0]!)).toBe(true);
    expect(isResourceNumericDirectActionSemantic(unsupported)).toBe(false);
    expect(isResourceNumericTriggerSemantic(unsupported)).toBe(false);
    expect(isDeploymentResourceRewardSemantic(unsupported)).toBe(false);
  });

  it('sets mana exactly through typed dataflow even when mana gain is blocked', () => {
    const state = createSeededGameState({ activeSeats: [1, 2] });
    const player = state.players[0]!;
    initializeRuntime(state);
    player.mana = 2;
    state.abilityRuntime!.manaCaps[player.id] = 12;
    state.abilityRuntime!.manaGainBlocked.push(player.id);
    const eventCount = state.abilityRuntime!.events.length;

    const result = executeResolution({
      state,
      controllerId: player.id,
      sourceCardId: 'set-mana-source',
      abilityId: 'renamed-fixed-set-mana',
      effects: [{ id: 'set-six', type: 'set_mana', player: 'controller', amount: 6 }],
    });

    expect(player.mana).toBe(2);
    expect(result.nextState.players.find((candidate) => candidate.id === player.id)?.mana).toBe(6);
    expect(result.results[0]).toMatchObject({
      effectType: 'set_mana',
      status: 'applied',
      payload: { playerId: player.id, targetAmount: 6, actualDelta: 4, before: 2, after: 6 },
    });
    expect(result.emittedEvents).toContainEqual(expect.objectContaining({
      type: 'mana_adjusted',
      sourceAbilityId: 'renamed-fixed-set-mana',
      controllerId: player.id,
      resource: 'mana',
      delta: 4,
      before: 2,
      after: 6,
    }));
    expect(state.abilityRuntime!.events).toHaveLength(eventCount);
  });

  it('returns a no-op without a resource event when mana already equals the target', () => {
    const state = createSeededGameState({ activeSeats: [1, 2] });
    const player = state.players[0]!;
    initializeRuntime(state);
    player.mana = 3;
    state.abilityRuntime!.manaCaps[player.id] = 12;

    const result = executeResolution({
      state,
      controllerId: player.id,
      sourceCardId: 'set-mana-source',
      abilityId: 'same-fixed-set-mana',
      effects: [{ id: 'set-three', type: 'set_mana', player: 'controller', amount: 3 }],
    });

    expect(result.results[0]).toMatchObject({
      effectType: 'set_mana',
      status: 'no_op',
      affectedEntities: [],
      emittedEventIds: [],
      payload: { targetAmount: 3, actualDelta: 0, before: 3, after: 3 },
    });
    expect(result.emittedEvents).toEqual([]);
  });

  it('fails closed outside the authoritative mana interval', () => {
    const state = createSeededGameState({ activeSeats: [1, 2] });
    const player = state.players[0]!;
    initializeRuntime(state);
    player.mana = 2;
    state.abilityRuntime!.manaCaps[player.id] = 4;

    expect(() => executeResolution({
      state,
      controllerId: player.id,
      sourceCardId: 'set-mana-source',
      abilityId: 'over-cap-set-mana',
      effects: [{ id: 'set-five', type: 'set_mana', player: 'controller', amount: 5 }],
    })).toThrow(ResolutionRuntimeError);
    expect(player.mana).toBe(2);

    expect(() => executeResolution({
      state,
      controllerId: player.id,
      sourceCardId: 'set-mana-source',
      abilityId: 'negative-set-mana',
      effects: [{ id: 'set-negative', type: 'set_mana', player: 'controller', amount: -1 }],
    })).toThrow(ResolutionRuntimeError);
    expect(player.mana).toBe(2);
  });

  it('rolls back an earlier exact set when a later node fails', () => {
    const state = createSeededGameState({ activeSeats: [1, 2] });
    const player = state.players[0]!;
    initializeRuntime(state);
    player.mana = 1;
    state.abilityRuntime!.manaCaps[player.id] = 12;
    const eventCount = state.abilityRuntime!.events.length;

    expect(() => executeResolution({
      state,
      controllerId: player.id,
      sourceCardId: 'set-mana-source',
      abilityId: 'rollback-fixed-set-mana',
      effects: [
        { id: 'set-six', type: 'set_mana', player: 'controller', amount: 6 },
        { id: 'fail-later', type: 'fail_invariant', message: 'rollback proof' },
      ],
    })).toThrow(ResolutionRuntimeError);

    expect(player.mana).toBe(1);
    expect(state.abilityRuntime!.events).toHaveLength(eventCount);
  });
});
