import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityDefinitionPack, AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../src/ability/types';

function ability(condition: RuleNode | null, effects: RuleNode[] = []): AuthoringAbility {
  return {
    id: 'primitive-proof', kind: 'forced_trigger', printedClause: 'synthetic primitive proof',
    activation: { trigger: 'after_battle_result_determined' }, conditions: condition ? [condition] : [],
    targets: [], effects, cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function setup(a: AuthoringAbility) {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  const [p1, p2, p3] = state.players;
  p1!.locationId = 'miyama_town'; p2!.locationId = 'miyama_town'; p3!.locationId = 'shinto';
  p1!.vp = 2;
  state.cards = [{ instanceId: 'source', definitionId: 'skill.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  const card: ExecutableCardDefinition = {
    id: 'skill.source', name: 'synthetic', cardType: 'master_skill', ownerId: 'master.synthetic',
    cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] }, playTiming: {}, playRequirements: [],
    abilities: [a], mode: 'automatic', playKind: 'support', destinationZone: 'field',
  };
  const pack: AbilityDefinitionPack = { cards: { [card.id]: card } };
  rules.initializeAbilityRuntime(state, pack, { seed: 20260926 });
  return state;
}

function event(id = 'battle-result') {
  return { id, type: 'after_battle_result_determined', playerId: 'p1', battleResult: { winners: ['p1'], loserIds: ['p2'] } };
}

function archive(condition: RuleNode | null, effects: RuleNode[] = []) {
  return { schemaVersion: 'fd-card-authoring-v1', id: 'master.synthetic', name: 'synthetic', cards: [{
    id: 'skill.source', name: 'source', cardType: 'master_skill',
    cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [], requirement: { type: 'none' } },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [ability(condition, effects)],
  }] };
}

describe('P3 current-main M50-01 target-count / VP-per-target primitives', () => {
  it('recognizes only the exact Scathach-required structural shapes', () => {
    expect(rules.isTargetCountEqualsCondition({ type: 'target_count_equals', scope: 'same_battlefield_opponents', count: 1 })).toBe(true);
    expect(rules.isTargetCountEqualsCondition({ type: 'target_count_equals', scope: 'same_battlefield_opponents', count: 1, extra: true })).toBe(false);
    expect(rules.isTargetCountEqualsCondition({ type: 'target_count_equals', scope: 'all_players', count: 1 })).toBe(false);
    expect(rules.isGainVictoryPointsPerTargetEffect({ type: 'gain_victory_points_per_target', target: 'controller', countTarget: { scope: 'same_battlefield_opponents' }, amountPerTarget: 1 })).toBe(true);
    expect(rules.isGainVictoryPointsPerTargetEffect({ type: 'gain_victory_points_per_target', target: 'opponents', countTarget: { scope: 'same_battlefield_opponents' }, amountPerTarget: 1 })).toBe(false);
  });

  it('counts only active same-battlefield opponents and distinguishes valid zero from invalid controller context', () => {
    const state = setup(ability({ type: 'target_count_equals', scope: 'same_battlefield_opponents', count: 1 }));
    expect(rules.collectTriggeredAbilities(state, event())).toHaveLength(1);
    state.players[2]!.locationId = 'miyama_town';
    expect(rules.collectTriggeredAbilities(state, event('two'))).toEqual([]);
    state.players[1]!.locationId = 'shinto'; state.players[2]!.locationId = 'shinto';
    const zero = setup(ability({ type: 'target_count_equals', scope: 'same_battlefield_opponents', count: 0 }));
    zero.players[1]!.locationId = 'shinto'; zero.players[2]!.locationId = 'shinto';
    expect(rules.collectTriggeredAbilities(zero, event('zero'))).toHaveLength(1);
    zero.players[0]!.locationId = 'not-a-battlefield';
    expect(rules.collectTriggeredAbilities(zero, event('invalid'))).toEqual([]);
  });

  it('grants controller VP per authoritative same-battlefield opponent and emits the bounded VP event', () => {
    const effect = { type: 'gain_victory_points_per_target', target: 'controller', countTarget: { scope: 'same_battlefield_opponents' }, amountPerTarget: 2 };
    const state = setup(ability(null, [effect]));
    rules.processAbilityEvent(state, event('gain-one'));
    expect(state.players[0]!.vp).toBe(4);
    const vpEvents = state.abilityRuntime!.events.filter((entry) => entry.type === 'victory_points_adjusted');
    expect(vpEvents).toHaveLength(1);
    expect(vpEvents[0]).toEqual(expect.objectContaining({
      type: 'victory_points_adjusted', playerId: 'p1', controllerId: 'p1', sourceCardId: 'source',
      abilityId: 'primitive-proof', sourceAbilityId: 'primitive-proof', resource: 'victory_points',
      delta: 2, before: 2, after: 4, resultId: expect.stringMatching(/gain-victory-points-per-target-authoritative\.vp_adjusted$/),
    }));
    const resolved = state.abilityRuntime!.events.filter((entry) => entry.type === 'effect_resolved' && entry.abilityId === 'primitive-proof');
    expect(resolved).toHaveLength(1);
  });

  it('treats an authoritative zero opponent count as a legal zero gain', () => {
    const effect = { type: 'gain_victory_points_per_target', target: 'controller', countTarget: { scope: 'same_battlefield_opponents' }, amountPerTarget: 1 };
    const state = setup(ability(null, [effect])); state.players[1]!.locationId = 'shinto'; state.players[2]!.locationId = 'shinto';
    rules.processAbilityEvent(state, event('zero-gain'));
    expect(state.players[0]!.vp).toBe(2);
    const vpEvents = state.abilityRuntime!.events.filter((entry) => entry.type === 'victory_points_adjusted');
    expect(vpEvents).toHaveLength(1);
    expect(vpEvents[0]).toEqual(expect.objectContaining({
      type: 'victory_points_adjusted', playerId: 'p1', resource: 'victory_points', delta: 0, before: 2, after: 2,
      resultId: expect.stringMatching(/gain-victory-points-per-target-authoritative\.vp_adjusted$/),
    }));
  });

  it('fails closed for invalid battlefield context, malformed shapes, and overflow', () => {
    const exact = { type: 'gain_victory_points_per_target', target: 'controller', countTarget: { scope: 'same_battlefield_opponents' }, amountPerTarget: 1 };
    const invalidContext = setup(ability(null, [exact])); invalidContext.players[0]!.locationId = 'not-a-battlefield';
    expect(() => rules.processAbilityEvent(invalidContext, event('bad-context'))).toThrow(/requires an active controller at a battlefield/i);

    const malformed = setup(ability(null, [{ ...exact, amountPerTarget: -1 }]));
    expect(() => rules.processAbilityEvent(malformed, event('malformed'))).toThrow(/unsupported per-target victory-point gain shape/i);

    const overflow = setup(ability(null, [exact])); overflow.players[0]!.vp = Number.MAX_SAFE_INTEGER;
    expect(() => rules.processAbilityEvent(overflow, event('overflow'))).toThrow(/exceed safe integer range/i);
  });

  it('loader admits exact shapes and disables widened or wrong-route placements', () => {
    const cond = { type: 'target_count_equals', scope: 'same_battlefield_opponents', count: 1 };
    const gain = { type: 'gain_victory_points_per_target', target: 'controller', countTarget: { scope: 'same_battlefield_opponents' }, amountPerTarget: 1 };
    expect(rules.loadAuthoringJson(archive(cond, [gain])).report).toEqual([]);
    expect(rules.loadAuthoringJson(archive({ ...cond, count: -1 }, [gain])).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: expect.stringMatching(/nonnegative safe-integer count/) }),
    ]));
    expect(rules.loadAuthoringJson(archive(cond, [{ ...gain, target: 'opponents' }])).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: expect.stringMatching(/Per-target victory-point gain requires controller/) }),
    ]));

    const targetRoute = archive(null, []) as any;
    targetRoute.cards[0].abilities[0].targets = [{ id: 'who', type: 'player', conditions: [cond], constraints: [], count: { min: 0, max: 1 } }];
    const targetLoaded = rules.loadAuthoringJson(targetRoute);
    expect(targetLoaded.report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Exact target-count condition is supported only as a direct ability condition' })]));
    expect(targetLoaded.cards['skill.source']!.abilities[0]!.execution.mode).toBe('unsupported');


    const wrongEffectRoute = archive(gain, []) as any;
    const wrongLoaded = rules.loadAuthoringJson(wrongEffectRoute);
    expect(wrongLoaded.report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Per-target victory-point gain is supported only as a direct ability effect' })]));
    expect(wrongLoaded.cards['skill.source']!.abilities[0]!.execution.mode).toBe('unsupported');
  });
  it('rejects target_count_equals when nested under an existing logical condition', () => {
    const cond = { type: 'target_count_equals', scope: 'same_battlefield_opponents', count: 1 };
    const nestedLogicalRoute = archive({ type: 'and', conditions: [cond] }, []) as any;
    const nestedLoaded = rules.loadAuthoringJson(nestedLogicalRoute);
    expect(nestedLoaded.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Exact target-count condition is supported only as a direct ability condition' }),
    ]));
    expect(nestedLoaded.cards['skill.source']!.abilities[0]!.execution.mode).toBe('unsupported');
  });
});
