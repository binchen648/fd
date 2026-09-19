import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityDefinitionPack, AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../src/ability/types';

function sourceStateAbility(condition: RuleNode): AuthoringAbility {
  return {
    id: 'source-state-check',
    kind: 'forced_trigger',
    printedClause: 'synthetic source-state proof',
    activation: { trigger: 'after_battle_ended' },
    conditions: [condition],
    targets: [], effects: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function setup(condition: RuleNode, ownerPlayerId = 'p1') {
  const state = createSeededGameState();
  state.cards = [{
    instanceId: 'source', definitionId: 'skill.source', ownerPlayerId, controllerPlayerId: 'p1', zone: 'field',
    visibility: { scope: 'public' },
  }];
  const card: ExecutableCardDefinition = {
    id: 'skill.source', name: 'synthetic', cardType: 'servant_skill',
    cardFace: { typeLabel: 'skill', cost: 0, basePower: 0, attributes: [] },
    playTiming: {}, playRequirements: [], abilities: [sourceStateAbility(condition)], mode: 'automatic', playKind: 'support', destinationZone: 'field',
  };
  const pack: AbilityDefinitionPack = { cards: { [card.id]: card } };
  rules.initializeAbilityRuntime(state, pack, { seed: 20260919 });
  state.abilityRuntime!.cardState.source = { active: true, faceDown: false };
  return state;
}

function trigger(state: ReturnType<typeof setup>) {
  return rules.collectTriggeredAbilities(state, { id: 'event', type: 'after_battle_ended' });
}

function archive(condition: RuleNode, triggerName = 'after_battle_ended') {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: 'servant.synthetic', name: 'synthetic', cards: [{
      id: 'skill.source', name: 'source', cardType: 'servant_skill',
      cardFace: { typeLabel: 'skill', cost: 0, basePower: 0, attributes: [], requirement: { type: 'none' } },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [{ ...sourceStateAbility(condition), activation: { trigger: triggerName } }],
    }],
  };
}

function context(): rules.EffectContext {
  return { controllerId: 'p1', sourceCardId: 'source', abilityId: 'source-state-check', variables: {}, selections: {} };
}

describe('P3-FB2-32 source-state conditions', () => {
  it('recognizes only the two exact identity-free type-only shapes', () => {
    expect(rules.isSourceStateCondition({ type: 'source_active' })).toBe(true);
    expect(rules.isSourceStateCondition({ type: 'source_owned' })).toBe(true);
    expect(rules.isSourceStateCondition({ type: 'source_active', active: true })).toBe(false);
    expect(rules.isSourceStateCondition({ type: 'source_owned', owner: 'controller' })).toBe(false);
    expect(rules.isSourceStateCondition({ type: 'source_reversed' })).toBe(false);
  });

  it('uses shared authoritative active-state semantics without mutating state', () => {
    const state = setup({ type: 'source_active' });
    const before = structuredClone(state);
    expect(trigger(state)).toEqual([{ cardInstanceId: 'source', abilityId: 'source-state-check', controllerId: 'p1' }]);
    expect(state).toEqual(before);

    state.abilityRuntime!.cardState.source = { active: false, faceDown: false };
    expect(trigger(state)).toEqual([]);
    state.abilityRuntime!.cardState.source = { active: true, faceDown: false };
    state.cards[0]!.zone = 'discard';
    expect(trigger(state)).toEqual([]);
  });

  it('matches physical source ownership only against the current controller', () => {
    const owned = setup({ type: 'source_owned' }, 'p1');
    const before = structuredClone(owned);
    expect(trigger(owned)).toEqual([{ cardInstanceId: 'source', abilityId: 'source-state-check', controllerId: 'p1' }]);
    expect(owned).toEqual(before);

    const notOwned = setup({ type: 'source_owned' }, 'p2');
    expect(trigger(notOwned)).toEqual([]);
  });

  it('rejects malformed runtime near-matches and missing source context before mutation', () => {
    const malformed = setup({ type: 'source_owned', owner: 'controller' });
    const malformedBefore = structuredClone(malformed);
    expect(() => trigger(malformed)).toThrow(/source-state condition shape/i);
    expect(malformed).toEqual(malformedBefore);

    const stale = setup({ type: 'source_owned' });
    stale.cards = [];
    const staleBefore = structuredClone(stale);
    expect(() => rules.executeAbility(stale, context())).toThrow();
    expect(stale).toEqual(staleBefore);
  });

  it('loader accepts exact nodes and reports payload-bearing siblings', () => {
    expect(rules.loadAuthoringJson(archive({ type: 'source_active' })).report).toEqual([]);
    expect(rules.loadAuthoringJson(archive({ type: 'source_owned' })).report).toEqual([]);
    expect(rules.loadAuthoringJson(archive({ type: 'source_owned', owner: 'controller' })).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Source-state condition must contain only type' }),
    ]));
  });

  it('does not make an unaccepted trigger loadable merely because the condition is accepted', () => {
    const report = rules.loadAuthoringJson(archive({ type: 'source_active' }, 'future_unaccepted_trigger')).report;
    expect(report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Unmapped trigger' })]));
  });
});
