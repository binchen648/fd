import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility } from '../../src/ability/types';
import { executeResolution } from '../../src/ability/resolution-dataflow';
import { createSeededGameState } from '../../src/tools/seeded-state';

const shinjiRaw = JSON.parse(readFileSync('data/authoring/masters/master.shinji.json', 'utf8'));

type Effect = AuthoringAbility['effects'][number];

function effect(type: 'adjust_mana' | 'adjust_victory_points', amount: number, explicit = false): Effect {
  return {
    type,
    amount,
    ...(explicit ? { player: 'controller' } : {}),
  } as Effect;
}

function baseAbility(): AuthoringAbility {
  return {
    id: 'renamed-resource-parent',
    kind: 'phase_action',
    printedClause: '',
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [],
    targets: [],
    effects: [effect('adjust_mana', 1)],
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

function runtimeState() {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  const pack = rules.loadAuthoringJson(shinjiRaw);
  rules.initializeAbilityRuntime(state, pack, { seed: 20260918 });
  state.players[0]!.mana = 1;
  state.players[0]!.vp = 1;
  state.abilityRuntime!.manaCaps[state.players[0]!.id] = 12;
  return state;
}

describe('P3-FB2-03 fixed controller Mana/VP adjustment component', () => {
  it('classifies fixed signed Mana/VP deltas by shape and controller ownership', () => {
    for (const candidate of [
      effect('adjust_mana', 3),
      effect('adjust_mana', -3, true),
      effect('adjust_victory_points', 2),
      effect('adjust_victory_points', -2, true),
      effect('adjust_mana', 0),
    ]) {
      expect(rules.isFixedControllerResourceAdjustmentComponent(candidate)).toBe(true);
    }

    expect(rules.isFixedControllerResourceAdjustmentComponent({
      type: 'adjust_mana', player: 'target', amount: 1,
    } as never)).toBe(false);
    expect(rules.isFixedControllerResourceAdjustmentComponent({
      type: 'adjust_mana', amount: { var: 'X' },
    } as never)).toBe(false);
    expect(rules.isFixedControllerResourceAdjustmentComponent({
      type: 'adjust_command_seals', amount: 1,
    } as never)).toBe(false);
    expect(rules.isFixedControllerResourceAdjustmentComponent({
      type: 'pay_mana', amount: 1,
    } as never)).toBe(false);
    expect(rules.isFixedControllerResourceAdjustmentComponent({
      type: 'adjust_mana', amount: 1, condition: 'hidden-extra-semantic',
    } as never)).toBe(false);
  });

  it('is reused by accepted parent routes without making an unsupported parent routable', () => {
    const locationEntry = baseAbility();
    locationEntry.kind = 'forced_trigger';
    locationEntry.activation = {
      trigger: 'after_controller_enters_location',
      eventLocationId: 'miyama_town',
    };
    expect(rules.isFixedControllerResourceAdjustmentComponent(locationEntry.effects[0]!)).toBe(true);
    expect(rules.isResourceNumericTriggerSemantic(locationEntry)).toBe(true);

    const deployment = baseAbility();
    deployment.kind = 'forced_trigger';
    deployment.activation = {
      trigger: 'after_player_deployed_to_battlefield',
      eventLocationId: 'magic_workshop',
    };
    deployment.effects = [
      effect('adjust_mana', 1),
      effect('adjust_victory_points', 2, true),
    ];
    expect(deployment.effects.every(rules.isFixedControllerResourceAdjustmentComponent)).toBe(true);
    expect(rules.isDeploymentResourceRewardSemantic(deployment)).toBe(true);

    const unsupported = baseAbility();
    unsupported.kind = 'passive';
    unsupported.activation = {};
    expect(rules.isFixedControllerResourceAdjustmentComponent(unsupported.effects[0]!)).toBe(true);
    expect(rules.isResourceNumericTriggerSemantic(unsupported)).toBe(false);
    expect(rules.isDeploymentResourceRewardSemantic(unsupported)).toBe(false);
    expect(rules.isResourceNumericDirectActionSemantic(unsupported)).toBe(false);
  });

  it('keeps authoritative Mana cap and typed actual delta in Resolution Data-flow', () => {
    const state = runtimeState();
    state.players[0]!.mana = 11;
    const controllerId = state.players[0]!.id;
    const result = executeResolution({
      state,
      controllerId,
      sourceCardId: 'component-source',
      abilityId: 'renamed-component-gain',
      effects: [{ id: 'gain', type: 'adjust_mana', player: 'controller', amount: 5 }],
    });

    expect(result.nextState.players[0]!.mana).toBe(12);
    expect(result.results[0]).toMatchObject({
      effectType: 'adjust_mana',
      status: 'applied',
      payload: { requestedAmount: 5, actualAmount: 1, before: 11, after: 12 },
    });
    expect(result.emittedEvents).toContainEqual(expect.objectContaining({
      type: 'mana_adjusted',
      playerId: controllerId,
      resource: 'mana',
      delta: 1,
      before: 11,
      after: 12,
    }));
  });

  it('keeps Mana/VP floors and reports actual negative deltas', () => {
    const state = runtimeState();
    const controllerId = state.players[0]!.id;
    const result = executeResolution({
      state,
      controllerId,
      sourceCardId: 'component-source',
      abilityId: 'renamed-component-loss',
      effects: [
        { id: 'mana-loss', type: 'adjust_mana', player: 'controller', amount: -4 },
        { id: 'vp-loss', type: 'adjust_victory_points', player: 'controller', amount: -5 },
      ],
    });

    expect(result.nextState.players[0]).toMatchObject({ mana: 0, vp: 0 });
    expect(result.results[0]).toMatchObject({
      payload: { requestedAmount: -4, actualAmount: -1, before: 1, after: 0 },
    });
    expect(result.results[1]).toMatchObject({
      payload: { before: 1, after: 0, amount: -1 },
    });
    expect(result.emittedEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'mana_adjusted', delta: -1, before: 1, after: 0 }),
      expect.objectContaining({ type: 'victory_points_adjusted', delta: -1, before: 1, after: 0 }),
    ]));
  });

  it('keeps Mana gain-block policy as a typed no-op without mutating source state', () => {
    const state = runtimeState();
    const controllerId = state.players[0]!.id;
    state.players[0]!.mana = 4;
    state.abilityRuntime!.manaGainBlocked.push(controllerId);
    const result = executeResolution({
      state,
      controllerId,
      sourceCardId: 'component-source',
      abilityId: 'renamed-component-blocked',
      effects: [{ id: 'blocked-gain', type: 'adjust_mana', player: 'controller', amount: 2 }],
    });

    expect(state.players[0]!.mana).toBe(4);
    expect(result.nextState.players[0]!.mana).toBe(4);
    expect(result.results[0]).toMatchObject({
      status: 'no_op',
      payload: { requestedAmount: 2, actualAmount: 0, before: 4, after: 4 },
      emittedEventIds: [],
    });
    expect(result.emittedEvents.some((event) => event.type === 'mana_adjusted')).toBe(false);
  });
});