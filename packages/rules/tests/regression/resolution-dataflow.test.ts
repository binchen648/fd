import { describe, expect, it } from 'vitest';

import type { GameState } from '../../src/schema/game';
import type { LocationId } from '../../src/schema/location';
import {
  DataFlowValidationError,
  ResolutionRuntimeError,
  executeResolution,
  listResolutionPrimitiveTypes,
  resultSchemas,
  validateResolutionDataFlow,
  type ResolutionEffectNode,
} from '../../src/ability/resolution-dataflow';

type TerrainState = GameState & {
  modeState?: {
    terrainAssignments?: Partial<Record<LocationId, string[]>>;
  };
};

function baseState(): TerrainState {
  return {
    id: 'resolution-dataflow-fixture',
    round: { roundNumber: 1, activePhase: 'action', prioritySeat: 1 },
    players: [
      { id: 'P1', seat: 1, status: 'active', masterCardId: 'm1', servantCardId: 's1', locationId: 'miyama_town', vp: 0, militaryResult: 0, mana: 0 },
      { id: 'P2', seat: 2, status: 'active', masterCardId: 'm2', servantCardId: 's2', locationId: 'miyama_town', vp: 0, militaryResult: 0, mana: 0 },
      { id: 'P3', seat: 3, status: 'active', masterCardId: 'm3', servantCardId: 's3', locationId: 'miyama_town', vp: 0, militaryResult: 0, mana: 0 },
      { id: 'P4', seat: 4, status: 'active', masterCardId: 'm4', servantCardId: 's4', locationId: 'miyama_town', vp: 0, militaryResult: 0, mana: 0 },
    ],
    map: {
      id: 'phase3a-map',
      name: 'Phase 3A synthetic map',
      locations: [
        { id: 'miyama_town', name: '深山町', tags: ['battlefield'], capacity: null, terrainBonuses: [3, 1] },
      ],
      movementLinks: [],
    },
    locationConfig: { disabledLocationIds: [] },
    cards: [],
    eventPlacements: [],
    battleResults: [],
    effectStack: [],
    log: [],
    modeState: {
      terrainAssignments: {
        miyama_town: ['P2', 'P4'],
      },
    },
  };
}

function goldenEffects(): ResolutionEffectNode[] {
  return [
    {
      id: 'effect-a',
      type: 'remove_advantage_position',
      target: { expr: 'same_battlefield_opponents' },
      bind: 'removedAdvantages',
    },
    {
      id: 'effect-b',
      type: 'adjust_victory_points',
      player: 'controller',
      amount: {
        expr: 'binding_field',
        binding: 'removedAdvantages',
        field: 'removedCount',
        valueType: 'number',
      },
    },
  ];
}

function expectDataFlowIssue(effects: ResolutionEffectNode[], code: DataFlowValidationError['issues'][number]['code']): void {
  expect(() => validateResolutionDataFlow(effects)).toThrow(DataFlowValidationError);
  try {
    validateResolutionDataFlow(effects);
  } catch (error) {
    expect(error).toBeInstanceOf(DataFlowValidationError);
    expect((error as DataFlowValidationError).issues.map((issue) => issue.code)).toContain(code);
    return;
  }
  throw new Error(`Expected ${code}`);
}

function producerFor(effectType: keyof typeof resultSchemas, binding: string): ResolutionEffectNode {
  switch (effectType) {
    case 'remove_advantage_position':
      return { id: `produce-${binding}`, type: 'remove_advantage_position', target: { expr: 'same_battlefield_opponents' }, bind: binding };
    case 'adjust_victory_points':
      return { id: `produce-${binding}`, type: 'adjust_victory_points', player: 'controller', amount: 1, bind: binding };
    case 'noop':
      return { id: `produce-${binding}`, type: 'noop', reason: binding, bind: binding };
    case 'fail_invariant':
      return { id: `produce-${binding}`, type: 'fail_invariant', message: binding };
  }
}

function consumerFor(binding: string, field: string, valueType: string): ResolutionEffectNode {
  switch (valueType) {
    case 'number':
      return {
        id: `consume-${binding}-${field}`,
        type: 'adjust_victory_points',
        player: 'controller',
        amount: { expr: 'binding_field', binding, field, valueType: 'number' },
      };
    case 'player_ids':
      return {
        id: `consume-${binding}-${field}`,
        type: 'remove_advantage_position',
        target: { expr: 'binding_field', binding, field, valueType: 'player_ids' },
      };
    case 'status':
      return {
        id: `consume-${binding}-${field}`,
        type: 'branch',
        branches: [{
          if: { expr: 'binding_status', binding, status: 'applied' },
          then: [{ id: `status-${binding}-${field}`, type: 'noop', reason: 'status consumed' }],
        }],
      };
    default:
      throw new Error(`Unsupported test valueType ${valueType}`);
  }
}

describe('Phase 3A resolution data-flow infrastructure', () => {
  it('routes synthetic executable nodes through registered primitives', () => {
    expect(listResolutionPrimitiveTypes()).toEqual(expect.arrayContaining([
      'remove_advantage_position',
      'adjust_victory_points',
      'noop',
      'fail_invariant',
    ]));
  });

  it('binds actual primitive results so downstream effects use affected count, not target count', () => {
    const state = baseState();
    const result = executeResolution({
      state,
      controllerId: 'P1',
      sourceCardId: 'synthetic-source',
      abilityId: 'synthetic-ability',
      effects: goldenEffects(),
    });

    expect(state.players.find((player) => player.id === 'P1')?.vp).toBe(0);
    expect(result.nextState.players.find((player) => player.id === 'P1')?.vp).toBe(2);
    expect((result.nextState as TerrainState).modeState?.terrainAssignments?.miyama_town).toEqual([]);
    expect(result.results[0]).toMatchObject({
      effectType: 'remove_advantage_position',
      status: 'applied',
      payload: {
        affectedPlayerIds: ['P2', 'P4'],
        removedCount: 2,
      },
    });
    expect(result.results[1]).toMatchObject({
      effectType: 'adjust_victory_points',
      payload: { playerId: 'P1', amount: 2 },
    });
  });

  it('keeps exposed result schema fields consumable by runtime evaluators', () => {
    for (const [effectType, schema] of Object.entries(resultSchemas) as Array<[keyof typeof resultSchemas, typeof resultSchemas[keyof typeof resultSchemas]]>) {
      for (const [field, valueType] of Object.entries(schema)) {
        const binding = `${effectType}_${field}`;
        const effects = [
          producerFor(effectType, binding),
          consumerFor(binding, field, valueType),
        ];

        expect(() => validateResolutionDataFlow(effects)).not.toThrow();
        expect(() => executeResolution({
          state: baseState(),
          controllerId: 'P1',
          sourceCardId: 'synthetic-source',
          abilityId: 'synthetic-ability',
          effects,
        })).not.toThrow();
      }
    }
  });

  it('fails closed for an unknown binding', () => {
    expectDataFlowIssue([
      {
        id: 'effect-b',
        type: 'adjust_victory_points',
        player: 'controller',
        amount: { expr: 'binding_field', binding: 'missing', field: 'removedCount', valueType: 'number' },
      },
    ], 'unknown_binding');
  });

  it('fails closed for a future binding reference', () => {
    expectDataFlowIssue([
      {
        id: 'effect-b',
        type: 'adjust_victory_points',
        player: 'controller',
        amount: { expr: 'binding_field', binding: 'later', field: 'removedCount', valueType: 'number' },
      },
      {
        id: 'effect-a',
        type: 'remove_advantage_position',
        target: { expr: 'same_battlefield_opponents' },
        bind: 'later',
      },
    ], 'future_binding');
  });

  it('fails closed for duplicate binding ids on one resolution path', () => {
    expectDataFlowIssue([
      { id: 'effect-a', type: 'noop', reason: 'first', bind: 'duplicate' },
      { id: 'effect-b', type: 'noop', reason: 'second', bind: 'duplicate' },
    ], 'duplicate_binding');
  });

  it('fails closed for invalid result fields', () => {
    expectDataFlowIssue([
      {
        id: 'effect-a',
        type: 'remove_advantage_position',
        target: { expr: 'same_battlefield_opponents' },
        bind: 'removedAdvantages',
      },
      {
        id: 'effect-b',
        type: 'adjust_victory_points',
        player: 'controller',
        amount: { expr: 'binding_field', binding: 'removedAdvantages', field: 'targetCount', valueType: 'number' },
      },
    ], 'invalid_result_field');
  });

  it('fails closed for wrong expression types', () => {
    expectDataFlowIssue([
      {
        id: 'effect-a',
        type: 'remove_advantage_position',
        target: { expr: 'same_battlefield_opponents' },
        bind: 'removedAdvantages',
      },
      {
        id: 'effect-b',
        type: 'remove_advantage_position',
        target: { expr: 'binding_field', binding: 'removedAdvantages', field: 'removedCount', valueType: 'player_ids' },
      },
    ], 'wrong_expression_type');
  });

  it('fails closed for unsafe branch-only bindings', () => {
    expectDataFlowIssue([
      {
        id: 'branch-a',
        type: 'branch',
        branches: [
          {
            if: true,
            then: [{ id: 'effect-a', type: 'remove_advantage_position', target: { expr: 'same_battlefield_opponents' }, bind: 'branchOnly' }],
          },
          {
            if: false,
            then: [{ id: 'effect-other', type: 'noop', reason: 'does not bind branchOnly' }],
          },
        ],
      },
      {
        id: 'effect-b',
        type: 'adjust_victory_points',
        player: 'controller',
        amount: { expr: 'binding_field', binding: 'branchOnly', field: 'removedCount', valueType: 'number' },
      },
    ], 'unsafe_branch_binding');
  });

  it('rolls back the whole effect sequence when a later runtime invariant fails', () => {
    const state = baseState();
    const effects: ResolutionEffectNode[] = [
      ...goldenEffects(),
      { id: 'effect-c', type: 'fail_invariant', message: 'synthetic failure' },
    ];

    expect(() => executeResolution({
      state,
      controllerId: 'P1',
      sourceCardId: 'synthetic-source',
      abilityId: 'synthetic-ability',
      effects,
    })).toThrow(ResolutionRuntimeError);

    expect(state.players.find((player) => player.id === 'P1')?.vp).toBe(0);
    expect(state.modeState?.terrainAssignments?.miyama_town).toEqual(['P2', 'P4']);
  });
});
