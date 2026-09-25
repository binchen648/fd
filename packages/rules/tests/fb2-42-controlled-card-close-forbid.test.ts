import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const WARD_DEF = 'test.close-ward';
const TARGET_DEF = 'test.close-target';
const OTHER_DEF = 'test.close-other';
const WARD_ID = 'ward-instance';
const TARGET_ID = 'target-instance';

function exactModifier(cardId = TARGET_DEF): any {
  return {
    id: 'forbid-close-selected-definition',
    operation: 'forbid',
    rule: 'card_close',
    scope: { controller: 'self', constraints: [{ type: 'has_card_id', cardId }] },
    lifecycle: { duration: 'this_round' },
  };
}

function archive(modifier: any = exactModifier()): any {
  const card = (id: string, abilities: any[]) => ({
    id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.close-test' },
    cardFace: { typeLabel: 'test', attributes: [], cost: 0, basePower: 1 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities,
  });
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.close-test', name: 'close test', class: 'Berserker',
    cards: [
      card(WARD_DEF, [{
        id: 'install-close-ward', kind: 'phase_action', printedClause: 'ward',
        activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
        conditions: [], targets: [], effects: [], cost: [], creates: [],
        ruleModifiers: [modifier], lifecycle: { duration: 'this_round' }, responseWindow: {}, limit: {}, visibility: {},
        execution: { mode: 'automatic' },
      }]),
      card(TARGET_DEF, [{
        id: 'close-self', kind: 'residual', printedClause: 'close', activation: { trigger: 'round_end', requiresSourceState: 'active' },
        conditions: [], targets: [], effects: [{ type: 'close_source_card' }], cost: [], creates: [], ruleModifiers: [],
        lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic' },
      }]),
      card(OTHER_DEF, [{
        id: 'close-self', kind: 'residual', printedClause: 'close', activation: { trigger: 'round_end', requiresSourceState: 'active' },
        conditions: [], targets: [], effects: [{ type: 'close_source_card' }], cost: [], creates: [], ruleModifiers: [],
        lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic' },
      }]),
    ],
  };
}

function setup(targetDef = TARGET_DEF, targetController = 'p1'): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.roundNumber = 3;
  state.round.activePhase = 'action';
  state.cards = [
    { instanceId: WARD_ID, definitionId: WARD_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } },
    { instanceId: TARGET_ID, definitionId: targetDef, ownerPlayerId: targetController, controllerPlayerId: targetController, zone: 'field', visibility: { scope: 'public' } },
  ];
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  state.abilityRuntime!.cardState[WARD_ID] = { active: true, faceDown: false, playedRound: 1 };
  state.abilityRuntime!.cardState[TARGET_ID] = { active: true, faceDown: false, playedRound: 1 };
  return state;
}

function install(state: GameState): void {
  rules.executeAbility(state, { sourceCardId: WARD_ID, abilityId: 'install-close-ward', controllerId: 'p1', variables: {}, selections: {} });
}

function close(state: GameState): void {
  rules.executeAbility(state, { sourceCardId: TARGET_ID, abilityId: 'close-self', controllerId: state.cards.find((c) => c.instanceId === TARGET_ID)!.controllerPlayerId, variables: {}, selections: {} });
}

describe('P3 FB2-42 controlled card-close forbid', () => {
  it('admits exactly the bounded selector shape while near forms stay unsupported', () => {
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);
    const near: any[] = [];
    const wrongOperation = exactModifier(); wrongOperation.operation = 'add'; near.push(wrongOperation);
    const wrongRule = exactModifier(); wrongRule.rule = 'card_closes'; near.push(wrongRule);
    const emptyId = exactModifier(''); near.push(emptyId);
    const wrongController = exactModifier(); wrongController.scope.controller = 'opponent'; near.push(wrongController);
    const multipleConstraints = exactModifier(); multipleConstraints.scope.constraints.push({ type: 'has_card_id', cardId: OTHER_DEF }); near.push(multipleConstraints);
    const wrongDuration = exactModifier(); wrongDuration.lifecycle.duration = 'while_active'; near.push(wrongDuration);
    const extraScope = exactModifier(); extraScope.scope.attribute = 'test'; near.push(extraScope);
    const wildcardConstraint = exactModifier(); wildcardConstraint.scope.constraints = [{ type: 'has_attribute', attribute: 'test' }]; near.push(wildcardConstraint);
    for (const modifier of near) {
      const report = rules.loadAuthoringJson(archive(modifier)).report;
      expect(report.some((entry) => entry.status === 'unsupported' && entry.path.startsWith('ruleModifiers'))).toBe(true);
    }
    const wrongParentLifecycle = archive();
    wrongParentLifecycle.cards[0].abilities[0].lifecycle = { duration: 'while_active' };
    expect(rules.loadAuthoringJson(wrongParentLifecycle).report).toContainEqual(expect.objectContaining({
      path: 'ruleModifiers', status: 'unsupported', reason: 'Unmapped rule or operation',
    }));
    const hostParent = archive();
    hostParent.cards[0].abilities[0].execution = { mode: 'host_adjudicated' };
    expect(rules.loadAuthoringJson(hostParent).report).toContainEqual(expect.objectContaining({
      path: 'ruleModifiers', status: 'unsupported', reason: 'Unmapped rule or operation',
    }));
  });

  it('prevents a matching controller-owned source close atomically for the live round', () => {
    const state = setup();
    install(state);
    expect(rules.isCardCloseForbidden(state, TARGET_ID)).toBe(true);
    const before = structuredClone(state);
    expect(() => close(state)).toThrow(/forbidden by a live rule modifier/);
    expect(state).toEqual(before);
    expect(state.cards.find((card) => card.instanceId === TARGET_ID)!.zone).toBe('field');
    expect(state.abilityRuntime!.cardState[TARGET_ID]).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.events).not.toContainEqual(expect.objectContaining({ type: 'source_card_closed', sourceCardId: TARGET_ID }));
  });

  it('does not protect a different definition', () => {
    const state = setup(OTHER_DEF);
    install(state);
    expect(rules.isCardCloseForbidden(state, TARGET_ID)).toBe(false);
    close(state);
    expect(state.cards.find((card) => card.instanceId === TARGET_ID)!.zone).toBe('skill');
    expect(state.abilityRuntime!.cardState[TARGET_ID]!.active).toBe(false);
  });

  it('does not protect another controller even when the definition matches', () => {
    const state = setup(TARGET_DEF, 'p2');
    install(state);
    expect(rules.isCardCloseForbidden(state, TARGET_ID)).toBe(false);
    close(state);
    expect(state.cards.find((card) => card.instanceId === TARGET_ID)!.zone).toBe('skill');
  });

  it('expires exactly after the installation round', () => {
    const state = setup();
    install(state);
    expect(rules.isCardCloseForbidden(state, TARGET_ID)).toBe(true);
    state.round.roundNumber = 4;
    expect(rules.isCardCloseForbidden(state, TARGET_ID)).toBe(false);
    close(state);
    expect(state.cards.find((card) => card.instanceId === TARGET_ID)!.zone).toBe('skill');
  });

  it('ignores unrelated or widened ongoing modifier state', () => {
    const state = setup();
    install(state);
    const installed = state.abilityRuntime!.ongoingEffects[0]!.ruleModifiers[0]!.definition;
    installed.rule = 'skill_use';
    expect(rules.isCardCloseForbidden(state, TARGET_ID)).toBe(false);
    close(state);
    expect(state.cards.find((card) => card.instanceId === TARGET_ID)!.zone).toBe('skill');
  });

  it('does not alter ordinary card power while installing close protection', () => {
    const state = setup();
    expect(rules.calculateCardPower(state, TARGET_ID).value).toBe(1);
    install(state);
    expect(rules.calculateCardPower(state, TARGET_ID).value).toBe(1);
    expect(rules.isCardCloseForbidden(state, TARGET_ID)).toBe(true);
  });

  it('blocks the typed resolution-dataflow close transaction without mutating caller state', () => {
    const state = setup();
    install(state);
    const before = structuredClone(state);
    expect(() => rules.executeResolution({
      state,
      controllerId: 'p1',
      sourceCardId: TARGET_ID,
      abilityId: 'close-self',
      effects: [{ id: 'typed-close', type: 'close_source_card' }],
      resolutionId: 'fb2-42-typed-close',
      causationId: 'fb2-42-test',
    })).toThrow(/forbidden by a live rule modifier/);
    expect(state).toEqual(before);
  });

  it('stops protecting the target after the protection source closes through the typed path', () => {
    const state = setup();
    install(state);
    expect(rules.isCardCloseForbidden(state, TARGET_ID)).toBe(true);

    const wardClosed = rules.executeResolution({
      state,
      controllerId: 'p1',
      sourceCardId: WARD_ID,
      abilityId: 'install-close-ward',
      effects: [{ id: 'close-ward', type: 'close_source_card' }],
      resolutionId: 'fb2-42-close-ward',
      causationId: 'fb2-42-source-liveness',
    }).nextState;

    expect(wardClosed.cards.find((card) => card.instanceId === WARD_ID)!.zone).toBe('skill');
    expect(wardClosed.abilityRuntime!.cardState[WARD_ID]).toMatchObject({ active: false, faceDown: false });
    expect(wardClosed.abilityRuntime!.ongoingEffects).toHaveLength(1);
    expect(rules.isCardCloseForbidden(wardClosed, TARGET_ID)).toBe(false);

    const targetClosed = rules.executeResolution({
      state: wardClosed,
      controllerId: 'p1',
      sourceCardId: TARGET_ID,
      abilityId: 'close-self',
      effects: [{ id: 'close-target', type: 'close_source_card' }],
      resolutionId: 'fb2-42-close-target-after-ward',
      causationId: 'fb2-42-source-liveness',
    }).nextState;
    expect(targetClosed.cards.find((card) => card.instanceId === TARGET_ID)!.zone).toBe('skill');
    expect(targetClosed.abilityRuntime!.cardState[TARGET_ID]!.active).toBe(false);
  });
});
