import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityDefinitionPack, AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../src/ability/types';

function relationAbility(condition: RuleNode): AuthoringAbility {
  return {
    id: 'relation-check', kind: 'forced_trigger', printedClause: 'synthetic event-player relation proof',
    activation: { trigger: 'after_battle_ended' }, conditions: [condition], targets: [], effects: [], cost: [],
    ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}
function setup(condition: RuleNode) {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{ instanceId: 'source', definitionId: 'skill.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  const card: ExecutableCardDefinition = { id: 'skill.source', name: 'synthetic', cardType: 'master_skill', ownerId: 'master.synthetic',
    cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] }, playTiming: {}, playRequirements: [],
    abilities: [relationAbility(condition)], mode: 'automatic', playKind: 'support', destinationZone: 'field' };
  const pack: AbilityDefinitionPack = { cards: { [card.id]: card } };
  rules.initializeAbilityRuntime(state, pack, { seed: 20260926 });
  return state;
}
function trigger(state: ReturnType<typeof setup>, playerId?: string) {
  return rules.collectTriggeredAbilities(state, { id: `event-${playerId ?? 'missing'}`, type: 'after_battle_ended', ...(playerId ? { playerId } : {}) });
}
function archive(condition: RuleNode, triggerName = 'after_battle_ended') {
  return { schemaVersion: 'fd-card-authoring-v1', id: 'master.synthetic', name: 'synthetic', cards: [{
    id: 'skill.source', name: 'source', cardType: 'master_skill', cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [], requirement: { type: 'none' } },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [{ ...relationAbility(condition), activation: { trigger: triggerName } }],
  }] };
}

describe('P3 current-main FB2-31 event-player relation replay', () => {
  it('recognizes only exact type-only relation nodes', () => {
    expect(rules.isEventPlayerRelationCondition({ type: 'event_player_is_controller' })).toBe(true);
    expect(rules.isEventPlayerRelationCondition({ type: 'event_player_is_opponent' })).toBe(true);
    expect(rules.isEventPlayerRelationCondition({ type: 'event_player_is_controller', player: 'controller' })).toBe(false);
    expect(rules.isEventPlayerRelationCondition({ type: 'event_player_is_opponent', extra: true })).toBe(false);
  });

  it('matches only a known trusted event actor and is read-only', () => {
    const controller = setup({ type: 'event_player_is_controller' });
    const beforeController = structuredClone(controller);
    expect(trigger(controller, 'p1')).toEqual([{ cardInstanceId: 'source', abilityId: 'relation-check', controllerId: 'p1' }]);
    expect(trigger(controller, 'p2')).toEqual([]);
    expect(controller).toEqual(beforeController);

    const opponent = setup({ type: 'event_player_is_opponent' });
    const beforeOpponent = structuredClone(opponent);
    expect(trigger(opponent, 'p2')).toEqual([{ cardInstanceId: 'source', abilityId: 'relation-check', controllerId: 'p1' }]);
    expect(trigger(opponent, 'p1')).toEqual([]);
    expect(opponent).toEqual(beforeOpponent);
  });

  it('fails closed for missing and unknown event actors', () => {
    for (const condition of [{ type: 'event_player_is_controller' }, { type: 'event_player_is_opponent' }]) {
      const state = setup(condition);
      expect(trigger(state)).toEqual([]);
      expect(trigger(state, 'not-a-player')).toEqual([]);
    }
  });

  it('rejects malformed runtime near-matches', () => {
    const state = setup({ type: 'event_player_is_opponent', player: 'controller' });
    const before = structuredClone(state);
    expect(() => trigger(state, 'p2')).toThrow(/event-player relation condition shape/i);
    expect(state).toEqual(before);
  });

  it('loader accepts only direct ability.conditions exact nodes', () => {
    expect(rules.loadAuthoringJson(archive({ type: 'event_player_is_controller' })).report).toEqual([]);
    expect(rules.loadAuthoringJson(archive({ type: 'event_player_is_opponent' })).report).toEqual([]);
    const malformed = rules.loadAuthoringJson(archive({ type: 'event_player_is_opponent', player: 'controller' }));
    expect(malformed.report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Event-player relation condition must contain only type' })]));
    expect(malformed.cards['skill.source']!.abilities[0]!.execution.mode).toBe('unsupported');
  });

  it('keeps nested, target-condition, and rule-modifier carriers unsupported', () => {
    const nested = rules.loadAuthoringJson(archive({ type: 'and', conditions: [{ type: 'event_player_is_controller' }] }));
    expect(nested.report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Event-player relation condition is supported only as a direct ability condition' })]));

    const targetRoute: any = archive({ type: 'controller_won_battle' });
    targetRoute.cards[0].abilities[0].targets = [{ id: 'who', type: 'player', conditions: [{ type: 'event_player_is_controller' }], constraints: [], count: { min: 0, max: 1 } }];
    const targetLoaded = rules.loadAuthoringJson(targetRoute);
    expect(targetLoaded.report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Event-player relation condition is supported only as a direct ability condition' })]));
    expect(targetLoaded.cards['skill.source']!.abilities[0]!.execution.mode).toBe('unsupported');

    const modifierRoute: any = archive({ type: 'controller_won_battle' });
    modifierRoute.cards[0].abilities[0].ruleModifiers = [{ type: 'noop', conditions: [{ type: 'event_player_is_controller' }], lifecycle: { duration: 'this_round' }, scope: {} }];
    const modifierLoaded = rules.loadAuthoringJson(modifierRoute);
    expect(modifierLoaded.report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Event-player relation condition is supported only as a direct ability condition' })]));
    expect(modifierLoaded.cards['skill.source']!.abilities[0]!.execution.mode).toBe('unsupported');
  });

  it('does not widen the accepted trigger set', () => {
    const loaded = rules.loadAuthoringJson(archive({ type: 'event_player_is_controller' }, 'future_unaccepted_trigger'));
    expect(loaded.report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Unmapped trigger' })]));
    expect(loaded.cards['skill.source']!.abilities[0]!.execution.mode).toBe('unsupported');
  });
});
