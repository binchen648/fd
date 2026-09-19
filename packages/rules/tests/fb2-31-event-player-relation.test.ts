import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityDefinitionPack, AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../src/ability/types';

function relationAbility(condition: RuleNode): AuthoringAbility {
  return {
    id: 'relation-check',
    kind: 'forced_trigger',
    printedClause: 'synthetic event-player relation proof',
    activation: { trigger: 'after_battle_ended' },
    conditions: [condition],
    targets: [],
    effects: [],
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

function setup(condition: RuleNode) {
  const state = createSeededGameState();
  state.cards = [{
    instanceId: 'source',
    definitionId: 'skill.source',
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  const card: ExecutableCardDefinition = {
    id: 'skill.source',
    name: 'synthetic',
    cardType: 'master_skill',
    ownerId: 'master.synthetic',
    cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] },
    playTiming: {},
    playRequirements: [],
    abilities: [relationAbility(condition)],
    mode: 'automatic',
    playKind: 'support',
    destinationZone: 'field',
  };
  const pack: AbilityDefinitionPack = { cards: { [card.id]: card } };
  rules.initializeAbilityRuntime(state, pack, { seed: 20260919 });
  return state;
}

function trigger(state: ReturnType<typeof setup>, playerId?: string) {
  return rules.collectTriggeredAbilities(state, {
    id: `event-${playerId ?? 'missing'}`,
    type: 'after_battle_ended',
    ...(playerId ? { playerId } : {}),
  });
}

function archive(condition: RuleNode, triggerName = 'after_battle_ended') {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    id: 'master.synthetic',
    name: 'synthetic',
    cards: [{
      id: 'skill.source',
      name: 'source',
      cardType: 'master_skill',
      cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [], requirement: { type: 'none' } },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [{ ...relationAbility(condition), activation: { trigger: triggerName } }],
    }],
  };
}

describe('P3-FB2-31 event-player relation conditions', () => {
  it('recognizes only the two exact identity-free structural shapes', () => {
    expect(rules.isEventPlayerRelationCondition({ type: 'event_player_is_controller' })).toBe(true);
    expect(rules.isEventPlayerRelationCondition({ type: 'event_player_is_opponent' })).toBe(true);
    expect(rules.isEventPlayerRelationCondition({ type: 'event_player_is_controller', player: 'controller' })).toBe(false);
    expect(rules.isEventPlayerRelationCondition({ type: 'event_player_is_opponent', ownerName: 'forbidden' })).toBe(false);
    expect(rules.isEventPlayerRelationCondition({ type: 'controller_won_battle' })).toBe(false);
  });

  it('matches the trusted event actor against the controller without mutating state', () => {
    const controllerState = setup({ type: 'event_player_is_controller' });
    const beforeController = structuredClone(controllerState);
    expect(trigger(controllerState, 'p1')).toEqual([
      { cardInstanceId: 'source', abilityId: 'relation-check', controllerId: 'p1' },
    ]);
    expect(trigger(controllerState, 'p2')).toEqual([]);
    expect(controllerState).toEqual(beforeController);

    const opponentState = setup({ type: 'event_player_is_opponent' });
    const beforeOpponent = structuredClone(opponentState);
    expect(trigger(opponentState, 'p2')).toEqual([
      { cardInstanceId: 'source', abilityId: 'relation-check', controllerId: 'p1' },
    ]);
    expect(trigger(opponentState, 'p1')).toEqual([]);
    expect(opponentState).toEqual(beforeOpponent);
  });

  it('fails closed for missing or unknown event actor identities', () => {
    for (const condition of [
      { type: 'event_player_is_controller' },
      { type: 'event_player_is_opponent' },
    ]) {
      const state = setup(condition);
      expect(trigger(state)).toEqual([]);
      expect(trigger(state, 'not-a-player')).toEqual([]);
    }
  });

  it('rejects malformed runtime near-matches instead of silently evaluating them', () => {
    const state = setup({ type: 'event_player_is_opponent', player: 'controller' });
    const before = structuredClone(state);
    expect(() => trigger(state, 'p2')).toThrow(/event-player relation condition shape/i);
    expect(state).toEqual(before);
  });

  it('loader accepts the exact nodes and reports malformed siblings', () => {
    expect(rules.loadAuthoringJson(archive({ type: 'event_player_is_controller' })).report).toEqual([]);
    expect(rules.loadAuthoringJson(archive({ type: 'event_player_is_opponent' })).report).toEqual([]);

    const malformed = rules.loadAuthoringJson(archive({ type: 'event_player_is_opponent', player: 'controller' })).report;
    expect(malformed).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Event-player relation condition must contain only type' }),
    ]));
  });

  it('does not make an unaccepted trigger loadable merely because the condition is accepted', () => {
    const report = rules.loadAuthoringJson(archive({ type: 'event_player_is_controller' }, 'future_unaccepted_trigger')).report;
    expect(report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Unmapped trigger' }),
    ]));
  });
});
