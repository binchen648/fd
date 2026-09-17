import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility } from '../../src/ability/types';
import { executeResolution } from '../../src/ability/resolution-dataflow';
import { createSeededGameState } from '../../src/tools/seeded-state';

type Effect = AuthoringAbility['effects'][number];

function sealEffect(amount: number, directive?: string, explicit = false): Effect {
  return {
    type: 'adjust_command_seals',
    amount,
    ...(explicit ? { player: 'controller' } : {}),
    ...(directive === undefined ? {} : { directive }),
  } as Effect;
}

function baseAbility(effect: Effect): AuthoringAbility {
  return {
    id: 'renamed-command-seal-parent',
    kind: 'phase_action',
    printedClause: '',
    activation: { phase: 'action', opens: 'controller_action_window' },
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

function commandSeals(state: ReturnType<typeof createSeededGameState>): number {
  return Number((state.players[0] as typeof state.players[number] & { commandSpells?: number }).commandSpells ?? 3);
}

function setCommandSeals(state: ReturnType<typeof createSeededGameState>, value: number): void {
  (state.players[0] as typeof state.players[number] & { commandSpells: number }).commandSpells = value;
}

describe('P3-FB2-04 fixed controller command-seal adjustment component', () => {
  it('classifies only fixed non-zero controller deltas and preserves optional directive metadata', () => {
    expect(rules.isFixedControllerCommandSealAdjustmentComponent(sealEffect(1))).toBe(true);
    expect(rules.isFixedControllerCommandSealAdjustmentComponent(sealEffect(-1, 'spend_command_spell', true))).toBe(true);
    expect(rules.isFixedControllerCommandSealAdjustmentComponent(sealEffect(3, 'second_contract'))).toBe(true);

    for (const candidate of [
      { type: 'adjust_command_seals', amount: 0 },
      { type: 'adjust_command_seals', amount: 1.5 },
      { type: 'adjust_command_seals', amount: { var: 'X' } },
      { type: 'adjust_command_seals', player: 'target', amount: -1 },
      { type: 'adjust_command_seals', amount: 1, directive: '' },
      { type: 'adjust_command_seals', amount: 1, directive: 7 },
      { type: 'adjust_command_seals', amount: -1, subject: 'all_opponents' },
      { type: 'adjust_command_seals', amount: 3, operation: 'restore_all' },
      { type: 'adjust_mana', amount: 1 },
    ]) {
      expect(rules.isFixedControllerCommandSealAdjustmentComponent(candidate as never)).toBe(false);
    }
  });

  it('is reused by accepted direct-action and B13 parents without granting an unsupported parent route', () => {
    const direct = baseAbility(sealEffect(-1, 'spend_command_spell'));
    expect(rules.isFixedControllerCommandSealAdjustmentComponent(direct.effects[0]!)).toBe(true);
    expect(rules.isResourceNumericDirectActionSemantic(direct)).toBe(true);

    const battleLoss = baseAbility(sealEffect(-1, 'lose_command_seal_after_battle_loss'));
    battleLoss.kind = 'forced_trigger';
    battleLoss.activation = { trigger: 'after_controller_loses_battle' };
    expect(rules.isFixedControllerCommandSealAdjustmentComponent(battleLoss.effects[0]!)).toBe(true);
    expect(rules.isBattleLossResourceTriggerSemantic(battleLoss)).toBe(true);

    const unsupported = baseAbility(sealEffect(1));
    unsupported.kind = 'passive';
    unsupported.activation = {};
    expect(rules.isFixedControllerCommandSealAdjustmentComponent(unsupported.effects[0]!)).toBe(true);
    expect(rules.isResourceNumericDirectActionSemantic(unsupported)).toBe(false);
    expect(rules.isBattleLossResourceTriggerSemantic(unsupported)).toBe(false);

    const malformedDirect = baseAbility({ type: 'adjust_command_seals', amount: { var: 'X' } } as never);
    expect(rules.isResourceNumericDirectActionSemantic(malformedDirect)).toBe(false);
  });

  it('uses the existing typed primitive for positive and negative deltas', () => {
    const state = createSeededGameState({ activeSeats: [1, 2] });
    setCommandSeals(state, 2);
    const controllerId = state.players[0]!.id;
    const result = executeResolution({
      state,
      controllerId,
      sourceCardId: 'component-source',
      abilityId: 'renamed-command-seal-component',
      effects: [
        { id: 'gain', type: 'adjust_command_seals', player: 'controller', amount: 2, directive: 'gain_fixture' },
        { id: 'lose', type: 'adjust_command_seals', player: 'controller', amount: -1, directive: 'loss_fixture' },
      ],
    });

    expect(commandSeals(state)).toBe(2);
    expect(commandSeals(result.nextState as ReturnType<typeof createSeededGameState>)).toBe(3);
    expect(result.results).toEqual(expect.arrayContaining([
      expect.objectContaining({
        effectType: 'adjust_command_seals',
        payload: expect.objectContaining({ requestedAmount: 2, actualAmount: 2, before: 2, after: 4, directive: 'gain_fixture' }),
      }),
      expect.objectContaining({
        effectType: 'adjust_command_seals',
        payload: expect.objectContaining({ requestedAmount: -1, actualAmount: -1, before: 4, after: 3, directive: 'loss_fixture' }),
      }),
    ]));
    expect(result.emittedEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'command_seals_adjusted', resource: 'command_seals', delta: 2, before: 2, after: 4 }),
      expect.objectContaining({ type: 'command_seals_adjusted', resource: 'command_seals', delta: -1, before: 4, after: 3 }),
    ]));
  });

  it('rolls the whole resolution back when a later fixed delta would underflow', () => {
    const state = createSeededGameState({ activeSeats: [1, 2] });
    setCommandSeals(state, 1);
    const controllerId = state.players[0]!.id;
    const eventCount = state.abilityRuntime?.events.length ?? 0;

    expect(() => executeResolution({
      state,
      controllerId,
      sourceCardId: 'component-source',
      abilityId: 'renamed-command-seal-underflow',
      effects: [
        { id: 'first-loss', type: 'adjust_command_seals', player: 'controller', amount: -1 },
        { id: 'second-loss', type: 'adjust_command_seals', player: 'controller', amount: -1 },
      ],
    })).toThrow();

    expect(commandSeals(state)).toBe(1);
    expect(state.abilityRuntime?.events.length ?? 0).toBe(eventCount);
  });
});
