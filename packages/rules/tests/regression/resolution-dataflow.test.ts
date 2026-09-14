import { describe, expect, it } from 'vitest';

import type { GameState } from '../../src/schema/game';
import type { LocationId } from '../../src/schema/location';
import {
  DataFlowValidationError,
  ResolutionRuntimeError,
  executeResolution,
  listResolutionPrimitiveTypes,
  normalizeResolutionDataFlowNodes,
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

function expectRawDataFlowIssue(effects: unknown[], code: DataFlowValidationError['issues'][number]['code']): void {
  expect(() => normalizeResolutionDataFlowNodes(effects)).toThrow(DataFlowValidationError);
  try {
    normalizeResolutionDataFlowNodes(effects);
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
    case 'move_all_remaining':
      return { id: `produce-${binding}`, type: 'move_all_remaining', owner: 'controller', from: 'hand', to: 'discard', bind: binding };
    case 'draw_cards':
      return { id: `produce-${binding}`, type: 'draw_cards', player: 'controller', count: 0, bind: binding };
    case 'play_selected_cards':
      return { id: `produce-${binding}`, type: 'play_selected_cards', target: 'selected_cards', face: 'face_down', bind: binding };
    case 'adjust_victory_points':
      return { id: `produce-${binding}`, type: 'adjust_victory_points', player: 'controller', amount: 1, bind: binding };
    case 'adjust_mana':
      return { id: `produce-${binding}`, type: 'adjust_mana', player: 'controller', amount: 1, bind: binding };
    case 'pay_mana':
      return { id: `produce-${binding}`, type: 'pay_mana', player: 'controller', amount: 0, bind: binding };
    case 'adjust_command_seals':
      return { id: `produce-${binding}`, type: 'adjust_command_seals', player: 'controller', amount: 0, bind: binding };
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
      'adjust_mana',
      'pay_mana',
      'adjust_command_seals',
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
      payload: { playerId: 'P1', before: 0, after: 2, amount: 2 },
    });
  });

  it('applies typed resource numeric primitives with before/after result envelopes', () => {
    const state = baseState() as GameState & { players: Array<GameState['players'][number] & { commandSpells?: number }> };
    state.players[0]!.mana = 9;
    state.players[0]!.commandSpells = 3;

    const result = executeResolution({
      state,
      controllerId: 'P1',
      sourceCardId: 'synthetic-source',
      abilityId: 'resource-core',
      effects: [
        { id: 'gain-mana', type: 'adjust_mana', player: 'controller', amount: 4, bind: 'manaGain' },
        { id: 'pay-mana', type: 'pay_mana', player: 'controller', amount: 2, bind: 'manaPayment' },
        { id: 'spend-seal', type: 'adjust_command_seals', player: 'controller', amount: -1, directive: 'spend_command_spell', bind: 'sealSpend' },
        { id: 'gain-vp', type: 'adjust_victory_points', player: 'controller', amount: 3, bind: 'vpGain' },
      ],
    });

    expect(result.nextState.players[0]).toMatchObject({ mana: 10, vp: 3, commandSpells: 2 });
    expect(result.results.map((entry) => entry.effectType)).toEqual([
      'adjust_mana',
      'pay_mana',
      'adjust_command_seals',
      'adjust_victory_points',
    ]);
    expect(result.results[0]).toMatchObject({
      status: 'applied',
      payload: { requestedAmount: 4, actualAmount: 3, before: 9, after: 12 },
    });
    expect(result.results[1]).toMatchObject({
      payload: { requestedAmount: 2, actualAmount: 2, before: 12, after: 10 },
    });
    expect(result.results[2]).toMatchObject({
      payload: { requestedAmount: -1, actualAmount: -1, before: 3, after: 2, directive: 'spend_command_spell' },
    });
    expect(result.emittedEvents).toContainEqual(expect.objectContaining({
      type: 'mana_adjusted',
      sourceAbilityId: 'resource-core',
      controllerId: 'P1',
      resource: 'mana',
      delta: 3,
      before: 9,
      after: 12,
      resultId: expect.stringContaining('gain-mana.mana_adjusted'),
    }));
  });

  it('fails closed when command seal adjustment would underflow', () => {
    const state = baseState() as GameState & { players: Array<GameState['players'][number] & { commandSpells?: number }> };
    state.players[0]!.commandSpells = 0;

    expect(() => executeResolution({
      state,
      controllerId: 'P1',
      sourceCardId: 'synthetic-source',
      abilityId: 'resource-core',
      effects: [{ id: 'spend-seal', type: 'adjust_command_seals', player: 'controller', amount: -1 }],
    })).toThrow(ResolutionRuntimeError);
    expect(state.players[0]!.commandSpells).toBe(0);
  });

  it('draws from recycled discard when the controller deck is empty', () => {
    const state = baseState();
    state.abilityRuntime = {
      pack: { cards: {} },
      revision: 0,
      sequence: 0,
      randomState: 20260909,
      cardState: {},
      ongoingEffects: [],
      responseWindows: [],
      usedAbilities: {},
      processedEvents: [],
      revealedServants: [],
      events: [],
      calculations: [],
      preventEffects: false,
      manaCaps: {},
      manaGainBlocked: [],
      hostRequests: [],
      roomMode: 'standard',
      abilityUsage: {},
      noblePhantasmCostsThisRound: {},
      consecutivePlayRounds: {},
      movementDistanceThisRound: {},
      battlefieldsPassedOrStayedThisRound: {},
      playRulesVersion: 'explicit-v1',
      playCounters: { round: 1, cardsPlayedByPlayer: {}, attacksDeclaredByPlayer: {} },
    };
    state.cards = [{
      instanceId: 'discarded-card',
      definitionId: 'basic.strength.1',
      ownerPlayerId: 'P1',
      controllerPlayerId: 'P1',
      zone: 'discard',
      visibility: { scope: 'owner_only', ownerPlayerId: 'P1' },
    }];

    const result = executeResolution({
      state,
      controllerId: 'P1',
      sourceCardId: 'synthetic-source',
      abilityId: 'draw-core',
      effects: [{ id: 'draw-one', type: 'draw_cards', player: 'controller', count: 1 }],
    });

    expect(result.nextState.cards[0]).toMatchObject({ instanceId: 'discarded-card', zone: 'hand' });
    expect(result.results[0]).toMatchObject({
      effectType: 'draw_cards',
      payload: { requestedCount: 1, actualCount: 1, movedCardIds: ['discarded-card'] },
    });
  });

  it('fails closed for unsupported payments and invalid resource amounts', () => {
    expectRawDataFlowIssue([
      { id: 'fractional-mana', type: 'adjust_mana', player: 'controller', amount: 1.5 },
    ], 'invalid_resolution_node');
    expectRawDataFlowIssue([
      { id: 'bad-mana', type: 'adjust_mana', player: 'controller', amount: { op: 'add', args: [1, 2] } },
    ], 'invalid_resolution_node');
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
          selections: { selected_cards: [] },
          hooks: { playSelectedCards: ({ cardInstanceIds }) => ({ playedCount: cardInstanceIds.length }) },
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
