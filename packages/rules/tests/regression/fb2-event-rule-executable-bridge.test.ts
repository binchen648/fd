import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { loadAuthoringJson } from '../../src/ability/loader';
import type { AbilityDefinitionPack, AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const SOURCE = 'master.synthetic-event.skill.source';
const STATIC_A = 'event.synthetic.alpha';
const STATIC_B = 'event.synthetic.beta';
const NEUTRAL_RULE = 'event.synthetic.neutral-rule';
const ISSUER_RULE = 'event.synthetic.issuer-rule';

function ability(overrides: Record<string, unknown>) {
  return {
    id: 'ability', kind: 'forced_trigger', printedClause: 'synthetic', activation: {}, conditions: [], targets: [], effects: [],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
    ...overrides,
  } as any;
}

function eventRuleCard(id: string, abilities: any[]): AuthoringCard {
  return {
    id, name: id, cardType: 'event', cardFace: {}, playTiming: {}, playRequirements: [], abilities, mode: 'automatic',
  };
}

function sourceCard(): AuthoringCard {
  return {
    id: SOURCE,
    name: 'Synthetic Event Operator',
    cardType: 'master_skill',
    cardFace: { cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [],
    mode: 'automatic',
    abilities: [ability({
      id: 'move-events',
      kind: 'phase_action',
      activation: { phase: 'action', opens: 'controller_action_window' },
      targets: [{
        id: 'selected_events', type: 'event_card', scope: { zones: ['event_outside_game'] },
        constraints: [{ type: 'event_has_tag', tag: 'lostbelt' }], count: { min: 1, max: 2 },
      }],
      effects: [{
        type: 'move_event_card', target: 'selected_events',
        to: { zone: 'event_battlefield', location: 'controller', controller: 'controller', visibility: 'public' },
      }],
    })],
  };
}

function pack(): AbilityDefinitionPack {
  return {
    cards: { [SOURCE]: sourceCard() },
    eventRules: {
      [NEUTRAL_RULE]: eventRuleCard(NEUTRAL_RULE, [ability({
        id: 'neutral-deploy-tax',
        kind: 'forced_trigger',
        activation: { trigger: 'after_player_deployed_to_battlefield', eventController: 'event_player' },
        conditions: [{ type: 'event_location_is_source_event_battlefield' }],
        effects: [{ type: 'adjust_mana', player: 'controller', amount: -1 }],
      })]),
      [ISSUER_RULE]: eventRuleCard(ISSUER_RULE, [ability({
        id: 'issuer-entry-reward',
        kind: 'forced_trigger',
        activation: { trigger: 'after_controller_enters_location', eventController: 'placement_controller' },
        conditions: [{ type: 'event_location_is_source_event_battlefield' }],
        effects: [{ type: 'adjust_victory_points', player: 'controller', amount: 2 }],
      })]),
    },
    eventCatalog: {
      [STATIC_A]: {
        id: STATIC_A, tags: ['lostbelt'], eventSetIds: ['set.alpha'], printedReward: 3,
        battleModifiers: [{ sourceId: STATIC_A, targetTag: '力量', value: 2, condition: 'has_attribute' }],
        forbiddenAttributes: ['特殊'],
      },
      [STATIC_B]: { id: STATIC_B, tags: ['lostbelt', 'objective'], eventSetIds: ['set.beta'], printedReward: 1 },
      [NEUTRAL_RULE]: { id: NEUTRAL_RULE, tags: ['objective'], eventSetIds: ['set.rule'], printedReward: 0 },
      [ISSUER_RULE]: { id: ISSUER_RULE, tags: ['objective'], eventSetIds: ['set.rule'], printedReward: 4 },
    },
  };
}

function stateWith(packValue = pack()): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'shinto';
  state.cards = [{
    instanceId: 'event-operator-source', definitionId: SOURCE,
    ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  state.eventDeck = [];
  state.eventOutsideGame = [];
  state.eventDiscardPile = [];
  state.eventPlacements = [];
  rules.initializeAbilityRuntime(state, packValue, { seed: 20260919 });
  return state;
}

describe('P3-FB2-28 event-card lifecycle and executable-rule bridge', () => {
  it('accepts generic event-card target/move authoring without adapter downgrade', () => {
    const archive = {
      schemaVersion: 'fd-card-authoring-v1', id: 'master.synthetic-event', name: 'Synthetic Event Master',
      cards: [{
        id: SOURCE, name: 'Synthetic Event Operator', cardType: 'master_skill', printedText: 'move events',
        cardFace: { cost: 0, basePower: 0 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: sourceCard().abilities,
      }],
    };
    const loaded = loadAuthoringJson(archive);
    expect(loaded.report).toEqual([]);
    expect(loaded.cards[SOURCE]!.abilities[0]!.targets[0]).toMatchObject({ type: 'event_card' });
  });

  it('lists all authoritative event zones deterministically and rejects stale/invalid moves transactionally', () => {
    const p = pack();
    const state = stateWith(p);
    state.eventDeck = [STATIC_A];
    state.eventOutsideGame = [STATIC_B, STATIC_B];
    state.eventDiscardPile = [{ eventCardId: STATIC_A, visibility: { scope: 'public' }, victoryPoints: 3 }];
    state.eventPlacements = [{ locationId: 'miyama_town', eventCardId: STATIC_B, visibility: { scope: 'public' }, victoryPoints: 1 }];

    const listed = rules.listEventRuleCandidates(state, p, ['event_deck', 'event_outside_game', 'event_discard', 'event_battlefield']);
    expect(listed.map((entry) => [entry.zone, entry.eventCardId])).toEqual([
      ['event_deck', STATIC_A], ['event_outside_game', STATIC_B], ['event_outside_game', STATIC_B],
      ['event_discard', STATIC_A], ['event_battlefield', STATIC_B],
    ]);
    expect(listed[4]!.ruleInstanceId).toBeUndefined();

    const beforeInvalid = structuredClone(state);
    expect(() => rules.moveEventRuleCandidates(state, p, [listed[1]!.token, listed[2]!.token], 'event_battlefield', { locationId: 'not-a-location' }))
      .toThrow(/enabled event battlefield/);
    expect(state).toEqual(beforeInvalid);

    const moved = rules.moveEventRuleCandidates(state, p, [listed[1]!.token, listed[2]!.token], 'event_battlefield', {
      locationId: 'shinto', ruleControllerPlayerId: 'p1', visibility: 'public',
    });
    expect(moved).toHaveLength(2);
    expect(state.eventOutsideGame).toEqual([]);
    expect(state.eventPlacements.filter((entry) => entry.eventCardId === STATIC_B && entry.locationId === 'shinto')).toHaveLength(2);
    expect(state.abilityRuntime!.eventRuleZoneRevision).toBe(1);
    expect(() => rules.moveEventRuleCandidate(state, p, listed[0]!.token, 'event_discard')).toThrow(/Stale or illegal/);
  });

  it('restores static VP/modifier/forbid metadata when a catalog event is placed through the generic lifecycle', () => {
    const p = pack();
    const state = stateWith(p);
    state.eventDeck = [STATIC_A];
    const [candidate] = rules.listEventRuleCandidates(state, p, ['event_deck']);
    rules.moveEventRuleCandidate(state, p, candidate!.token, 'event_battlefield', { locationId: 'miyama_town', visibility: 'public' });

    expect(state.eventPlacements).toContainEqual(expect.objectContaining({
      eventCardId: STATIC_A, locationId: 'miyama_town', victoryPoints: 3,
      battleModifiers: [{ sourceId: STATIC_A, targetTag: '力量', value: 2, condition: 'has_attribute' }],
    }));
    const forbids = (state as any).modeState?.cardPlayForbids ?? [];
    expect(forbids).toContainEqual(expect.objectContaining({ sourceType: 'event', sourceId: STATIC_A, locationId: 'miyama_town', attribute: '特殊' }));
  });

  it('restores the saved battlefield location when a discarded event returns without an explicit override', () => {
    const p = pack();
    const state = stateWith(p);
    const savedModifier = { sourceId: STATIC_A, targetTag: 'strength', value: 2, condition: 'has_attribute' };
    state.eventPlacements = [{
      eventCardId: STATIC_A,
      locationId: 'miyama_town',
      visibility: { scope: 'hidden_until_trigger' },
      victoryPoints: 3,
      battleModifiers: [savedModifier],
    }];

    const [battlefield] = rules.listEventRuleCandidates(state, p, ['event_battlefield']);
    rules.moveEventRuleCandidate(state, p, battlefield!.token, 'event_discard');
    expect(state.eventDiscardPile).toEqual([expect.objectContaining({
      eventCardId: STATIC_A,
      locationId: 'miyama_town',
      visibility: { scope: 'hidden_until_trigger' },
      victoryPoints: 3,
      battleModifiers: [savedModifier],
    })]);

    const [discarded] = rules.listEventRuleCandidates(state, p, ['event_discard']);
    rules.moveEventRuleCandidate(state, p, discarded!.token, 'event_battlefield');
    expect(state.eventPlacements).toEqual([expect.objectContaining({
      eventCardId: STATIC_A,
      locationId: 'miyama_town',
      visibility: { scope: 'hidden_until_trigger' },
      victoryPoints: 3,
      battleModifiers: [savedModifier],
    })]);

    const [restored] = rules.listEventRuleCandidates(state, p, ['event_battlefield']);
    rules.moveEventRuleCandidate(state, p, restored!.token, 'event_discard');
    const [discardedAgain] = rules.listEventRuleCandidates(state, p, ['event_discard']);
    rules.moveEventRuleCandidate(state, p, discardedAgain!.token, 'event_battlefield', { locationId: 'shinto' });
    expect(state.eventPlacements[0]!.locationId).toBe('shinto');
  });

  it('lets an ordinary player skill select multiple tagged outside-game events and place them without identity routing', () => {
    const p = pack();
    const state = stateWith(p);
    state.eventOutsideGame = [STATIC_A, STATIC_B];

    const activated = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'activate_ability', cardInstanceId: 'event-operator-source', abilityId: 'move-events',
    });
    expect(activated.ok).toBe(true);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toHaveLength(2);

    const resolved = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [...decision.candidates],
    });
    expect(resolved.ok).toBe(true);
    expect(state.eventOutsideGame).toEqual([]);
    expect(state.eventPlacements.map((entry) => [entry.eventCardId, entry.locationId, entry.ruleControllerPlayerId])).toEqual([
      [STATIC_A, 'miyama_town', 'p1'], [STATIC_B, 'miyama_town', 'p1'],
    ]);
  });

  it('executes neutral and issuer-associated event rules from authoritative placement context and remains replay-idempotent', () => {
    const p = pack();
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.players[0]!.locationId = 'shinto';
    state.players[1]!.locationId = 'miyama_town';
    state.eventPlacements = [
      { locationId: 'miyama_town', eventCardId: NEUTRAL_RULE, visibility: { scope: 'public' } },
      { locationId: 'shinto', eventCardId: ISSUER_RULE, ruleControllerPlayerId: 'p1', visibility: { scope: 'public' } },
    ];
    rules.initializeAbilityRuntime(state, p, { seed: 20260919 });
    expect(state.eventPlacements[0]!.ruleControllerPlayerId).toBeUndefined();
    expect(state.eventPlacements.every((placement) => !!placement.ruleInstanceId)).toBe(true);

    const p2ManaBefore = state.players[1]!.mana;
    rules.processAbilityEvent(state, {
      id: 'neutral-deploy', type: 'after_player_deployed_to_battlefield', playerId: 'p2', locationId: 'miyama_town',
    });
    expect(state.players[1]!.mana).toBe(p2ManaBefore - 1);
    const revisionAfterFirst = state.abilityRuntime!.revision;
    rules.processAbilityEvent(state, {
      id: 'neutral-deploy', type: 'after_player_deployed_to_battlefield', playerId: 'p2', locationId: 'miyama_town',
    });
    expect(state.players[1]!.mana).toBe(p2ManaBefore - 1);
    expect(state.abilityRuntime!.revision).toBe(revisionAfterFirst);

    const p1VpBefore = state.players[0]!.vp;
    rules.processAbilityEvent(state, {
      id: 'issuer-entry', type: 'after_controller_enters_location', playerId: 'p1', locationId: 'shinto',
    });
    expect(state.players[0]!.vp).toBe(p1VpBefore + 2);

    rules.processAbilityEvent(state, {
      id: 'neutral-wrong-location', type: 'after_player_deployed_to_battlefield', playerId: 'p2', locationId: 'shinto',
    });
    expect(state.players[1]!.mana).toBe(p2ManaBefore - 1);
  });
});