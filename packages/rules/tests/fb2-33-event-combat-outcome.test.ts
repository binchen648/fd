import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityDefinitionPack, AbilityEvent, AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../src/ability/types';

function outcomeAbility(condition: RuleNode): AuthoringAbility {
  return {
    id: 'outcome-check', kind: 'forced_trigger', printedClause: 'synthetic combat outcome proof',
    activation: { trigger: 'after_battle_ended' }, conditions: [condition], targets: [], effects: [], cost: [],
    ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function setup(condition: RuleNode) {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{
    instanceId: 'source', definitionId: 'skill.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  const card: ExecutableCardDefinition = {
    id: 'skill.source', name: 'synthetic', cardType: 'master_skill', ownerId: 'master.synthetic',
    cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] }, playTiming: {}, playRequirements: [],
    abilities: [outcomeAbility(condition)], mode: 'automatic', playKind: 'support', destinationZone: 'field',
  };
  const pack: AbilityDefinitionPack = { cards: { [card.id]: card } };
  rules.initializeAbilityRuntime(state, pack, { seed: 20260919 });
  return state;
}

function event(overrides: Partial<AbilityEvent> = {}): AbilityEvent {
  return {
    id: 'combat-event', type: 'after_battle_ended', playerId: 'p1',
    battleResult: { winners: ['p1'], loserIds: ['p2', 'p3'] }, ...overrides,
  };
}

function trigger(state: ReturnType<typeof setup>, overrides: Partial<AbilityEvent> = {}) {
  return rules.collectTriggeredAbilities(state, event(overrides));
}

function archive(condition: RuleNode, triggerName = 'after_battle_ended') {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: 'master.synthetic', name: 'synthetic', cards: [{
      id: 'skill.source', name: 'source', cardType: 'master_skill',
      cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [], requirement: { type: 'none' } },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [{ ...outcomeAbility(condition), activation: { trigger: triggerName } }],
    }],
  };
}

describe('P3-FB2-33 event combat outcome conditions', () => {
  it('recognizes only the two exact identity-free type-only shapes', () => {
    expect(rules.isEventCombatOutcomeCondition({ type: 'event_player_won_combat' })).toBe(true);
    expect(rules.isEventCombatOutcomeCondition({ type: 'event_player_lost_combat' })).toBe(true);
    expect(rules.isEventCombatOutcomeCondition({ type: 'event_player_won_combat', player: 'controller' })).toBe(false);
    expect(rules.isEventCombatOutcomeCondition({ type: 'controller_won_battle' })).toBe(false);
  });

  it('matches the known event player against trusted winners and losers without mutating state', () => {
    const won = setup({ type: 'event_player_won_combat' });
    const wonBefore = structuredClone(won);
    expect(trigger(won)).toEqual([{ cardInstanceId: 'source', abilityId: 'outcome-check', controllerId: 'p1' }]);
    expect(trigger(won, { playerId: 'p2' })).toEqual([]);
    expect(won).toEqual(wonBefore);

    const lost = setup({ type: 'event_player_lost_combat' });
    const lostBefore = structuredClone(lost);
    expect(trigger(lost, { playerId: 'p2' })).toEqual([{ cardInstanceId: 'source', abilityId: 'outcome-check', controllerId: 'p1' }]);
    expect(trigger(lost, { playerId: 'p1' })).toEqual([]);
    expect(lost).toEqual(lostBefore);
  });

  it('supports shared winners while keeping losers disjoint', () => {
    const won = setup({ type: 'event_player_won_combat' });
    expect(trigger(won, { playerId: 'p2', battleResult: { winners: ['p1', 'p2'], loserIds: ['p3'] } })).toHaveLength(1);
    const lost = setup({ type: 'event_player_lost_combat' });
    expect(trigger(lost, { playerId: 'p3', battleResult: { winners: ['p1', 'p2'], loserIds: ['p3'] } })).toHaveLength(1);
  });

  it('fails closed for missing/unknown actor or missing/malformed/contradictory outcome context', () => {
    for (const condition of [{ type: 'event_player_won_combat' }, { type: 'event_player_lost_combat' }]) {
      const state = setup(condition);
      expect(trigger(state, { playerId: undefined })).toEqual([]);
      expect(trigger(state, { playerId: 'not-a-player' })).toEqual([]);
      expect(trigger(state, { battleResult: undefined })).toEqual([]);
      expect(trigger(state, { battleResult: { winners: ['p1', 'p1'], loserIds: ['p2'] } })).toEqual([]);
      expect(trigger(state, { battleResult: { winners: ['p1'], loserIds: ['p1'] } })).toEqual([]);
      expect(trigger(state, { battleResult: { winners: ['not-a-player'], loserIds: ['p2'] } })).toEqual([]);
    }
  });

  it('rejects malformed runtime near-matches instead of silently evaluating them', () => {
    const state = setup({ type: 'event_player_won_combat', winner: true });
    const before = structuredClone(state);
    expect(() => trigger(state)).toThrow(/event combat outcome condition shape/i);
    expect(state).toEqual(before);
  });

  it('loader accepts exact nodes but rejects payload-bearing or non-condition placement', () => {
    expect(rules.loadAuthoringJson(archive({ type: 'event_player_won_combat' })).report).toEqual([]);
    expect(rules.loadAuthoringJson(archive({ type: 'event_player_lost_combat' })).report).toEqual([]);
    expect(rules.loadAuthoringJson(archive({ type: 'event_player_won_combat', player: 'controller' })).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Event combat outcome condition must contain only type' }),
    ]));

    const authored = archive({ type: 'event_player_won_combat' }) as any;
    authored.cards[0].abilities[0].conditions = [];
    authored.cards[0].abilities[0].effects = [{ type: 'event_player_lost_combat' }];
    const loaded = rules.loadAuthoringJson(authored);
    expect(loaded.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Event combat outcome condition is supported only under ability conditions' }),
    ]));
    expect(loaded.cards['skill.source']!.abilities[0]!.execution.mode).toBe('unsupported');
  });

  it('does not make an unaccepted trigger loadable merely because the condition is accepted', () => {
    const report = rules.loadAuthoringJson(archive({ type: 'event_player_won_combat' }, 'future_unaccepted_trigger')).report;
    expect(report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Unmapped trigger' })]));
  });
});
