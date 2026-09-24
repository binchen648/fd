import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD = 'master.fixture.skill.twice-like';
const SOURCE = 'twice-like-source';
const PREP = 'game-winner-event-control__preparation';
const ACTION = 'game-winner-event-control__action';
const EVENT_A = 'event.fixture.a';
const EVENT_B = 'event.fixture.b';
const EVENT_C = 'event.fixture.c';
const EVENT_D = 'event.fixture.d';

const beforeTen = [
  { type: 'phase_is', phase: 'action' },
  { type: 'metric_compare', left: { type: 'metric', metric: 'round_number', source: 'controller' }, operator: 'lt', right: 10 },
];

function twiceAbility(phase: 'preparation' | 'action', id: string) {
  return {
    id,
    kind: 'phase_action',
    printedClause: 'fixture',
    markers: ['m50_structured_v1'],
    activation: { phase, opens: 'controller_action_window' },
    conditions: [
      { type: 'source_owned' },
      { type: 'or', conditions: [
        { type: 'event_count_at_least', sourceZone: 'current', value: 2 },
        { type: 'event_count_at_least', sourceZone: 'current', visibility: 'up', value: 1 },
      ] },
      { type: 'or', conditions: [
        { type: 'not', condition: { type: 'and', conditions: beforeTen } },
        { type: 'and', conditions: [{ type: 'command_seals_at_least', target: 'controller', value: 1 }] },
      ] },
    ],
    targets: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    effects: [
      { type: 'if_condition', conditions: beforeTen, then: [{ type: 'pay_command_seals', target: 'controller', amount: 1 }] },
      { type: 'choose_one', options: [
        {
          id: 'swap-events', label: 'swap', conditions: [{ type: 'event_count_at_least', sourceZone: 'current', value: 2 }],
          effects: [
            { type: 'choose_events', sourceZone: 'current', minCount: 2, maxCount: 2, payloadKey: 'twiceSwapEventIds' },
            { type: 'swap_selected_event_locations', payloadKey: 'twiceSwapEventIds' },
          ],
        },
        {
          id: 'replace-face-up-event', label: 'replace', conditions: [{ type: 'event_count_at_least', sourceZone: 'current', visibility: 'up', value: 1 }],
          effects: [
            { type: 'choose_events', sourceZone: 'current', visibility: 'up', minCount: 1, maxCount: 1, payloadKey: 'twiceReplaceEventIds' },
            { type: 'replace_selected_event_from_deck', payloadKey: 'twiceReplaceEventIds' },
          ],
        },
      ] },
    ],
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function archive() {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: 'master.fixture', name: 'fixture', class: 'Master',
    cards: [{
      id: CARD, name: 'fixture', cardType: 'master_skill', owner: { type: 'master', id: 'master.fixture' },
      cardFace: { cost: 0, basePower: 0, attributes: [] }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [], abilities: [twiceAbility('preparation', PREP), twiceAbility('action', ACTION)],
    }],
  } as any;
}

function eventCatalog() {
  return Object.fromEntries([EVENT_A, EVENT_B, EVENT_C, EVENT_D].map((id, index) => [id, {
    id, name: id, tags: [], eventSetIds: [], printedReward: index + 1,
  }]));
}

function setup(options: {
  phase?: 'preparation' | 'action'; round?: number; seals?: number; seed?: number;
  placements?: Array<{ eventCardId: string; locationId: 'miyama_town' | 'shinto'; visibility: 'public' | 'hidden_until_trigger' }>;
  deck?: string[];
} = {}): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  pack.eventCatalog = eventCatalog();
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{ instanceId: SOURCE, definitionId: CARD, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  state.round.activePhase = options.phase ?? 'action';
  state.round.roundNumber = options.round ?? 5;
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.commandSpells = options.seals ?? 1;
  state.eventPlacements = (options.placements ?? [
    { eventCardId: EVENT_A, locationId: 'miyama_town', visibility: 'public' },
    { eventCardId: EVENT_B, locationId: 'shinto', visibility: 'hidden_until_trigger' },
  ]).map((entry) => ({
    eventCardId: entry.eventCardId, locationId: entry.locationId, visibility: { scope: entry.visibility },
    victoryPoints: eventCatalog()[entry.eventCardId]!.printedReward,
  }));
  state.eventDeck = [...(options.deck ?? [EVENT_C, EVENT_D])];
  rules.initializeAbilityRuntime(state, pack, { seed: options.seed ?? 20260924 });
  return state;
}

function activate(state: GameState, abilityId: string) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId });
}
function choose(state: GameState, selectedIds: string[]) {
  const decision = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds });
}
function eventToken(state: GameState, eventCardId: string): string {
  const candidate = rules.listEventRuleCandidates(state, state.abilityRuntime!.pack, ['event_battlefield']).find((entry) => entry.eventCardId === eventCardId);
  if (!candidate) throw new Error(`missing event token ${eventCardId}`);
  return candidate.token;
}
function placement(state: GameState, eventCardId: string) {
  return state.eventPlacements.find((entry) => entry.eventCardId === eventCardId);
}

function settleReplace(state: GameState): void {
  expect(activate(state, state.round.activePhase === 'preparation' ? PREP : ACTION).ok).toBe(true);
  expect(state.abilityRuntime!.pendingDecision!.candidates).toContain('replace-face-up-event');
  expect(choose(state, ['replace-face-up-event']).ok).toBe(true);
  const decision = state.abilityRuntime!.pendingDecision!;
  expect(decision.candidates).toEqual([eventToken(state, EVENT_A)]);
  expect(choose(state, [decision.candidates[0]!]).ok).toBe(true);
}

describe('P3 F4 M50-02 Twice game-winner event control', () => {
  it('loads the normalized generic shape blocker-free and rejects invalid event visibility', () => {
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);
    const bad = archive();
    bad.cards[0].abilities[0].effects[1].options[1].effects[0].visibility = 'sideways';
    const report = rules.loadAuthoringJson(bad).report;
    expect(report).toEqual(expect.arrayContaining([expect.objectContaining({
      abilityId: PREP, reason: 'Structured event visibility must be up or down',
    })]));
  });

  it('requires one command seal only for action phase before round 10 and pays it before the mandatory choice', () => {
    const insufficient = setup({ phase: 'action', round: 5, seals: 0 });
    expect(rules.getLegalActions(insufficient, 'p1').some((entry) => entry.type === 'activate_ability' && entry.abilityId === ACTION)).toBe(false);
    const before = structuredClone(insufficient);
    expect(activate(insufficient, ACTION).ok).toBe(false);
    expect(insufficient).toEqual(before);

    const action = setup({ phase: 'action', round: 5, seals: 1 });
    expect(activate(action, ACTION).ok).toBe(true);
    expect(action.players[0]!.commandSpells).toBe(0);
    expect(action.abilityRuntime!.pendingDecision!.candidates).toEqual(['swap-events', 'replace-face-up-event']);

    const preparation = setup({ phase: 'preparation', round: 5, seals: 0 });
    expect(activate(preparation, PREP).ok).toBe(true);
    expect(preparation.players[0]!.commandSpells).toBe(0);

    const roundTen = setup({ phase: 'action', round: 10, seals: 0 });
    expect(activate(roundTen, ACTION).ok).toBe(true);
    expect(roundTen.players[0]!.commandSpells).toBe(0);
  });

  it('counts and selects face-up events strictly by authoritative placement visibility', () => {
    const hiddenOnly = setup({ seals: 1, placements: [
      { eventCardId: EVENT_A, locationId: 'miyama_town', visibility: 'hidden_until_trigger' },
      { eventCardId: EVENT_B, locationId: 'shinto', visibility: 'hidden_until_trigger' },
    ] });
    expect(activate(hiddenOnly, ACTION).ok).toBe(true);
    expect(hiddenOnly.abilityRuntime!.pendingDecision!.candidates).toEqual(['swap-events']);

    const onePublic = setup({ phase: 'preparation', seals: 0, placements: [
      { eventCardId: EVENT_A, locationId: 'miyama_town', visibility: 'public' },
      { eventCardId: EVENT_B, locationId: 'shinto', visibility: 'hidden_until_trigger' },
    ] });
    expect(activate(onePublic, PREP).ok).toBe(true);
    expect(choose(onePublic, ['replace-face-up-event']).ok).toBe(true);
    expect(onePublic.abilityRuntime!.pendingDecision!.candidates).toEqual([eventToken(onePublic, EVENT_A)]);
  });

  it('swaps exactly two selected current events without flipping either event', () => {
    const state = setup();
    const revision = state.abilityRuntime!.eventRuleZoneRevision;
    expect(activate(state, ACTION).ok).toBe(true);
    expect(choose(state, ['swap-events']).ok).toBe(true);
    const a = eventToken(state, EVENT_A); const b = eventToken(state, EVENT_B);
    expect(state.abilityRuntime!.pendingDecision!.candidates).toEqual([a, b]);
    expect(choose(state, [a, b]).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(placement(state, EVENT_A)).toMatchObject({ locationId: 'shinto', visibility: { scope: 'public' } });
    expect(placement(state, EVENT_B)).toMatchObject({ locationId: 'miyama_town', visibility: { scope: 'hidden_until_trigger' } });
    expect(state.abilityRuntime!.eventRuleZoneRevision).toBe(revision + 1);
  });

  it('returns the selected face-up event to the main deck, deterministically shuffles, and replaces it at the same public location', () => {
    const first = setup({ phase: 'preparation', seals: 0, seed: 7331, placements: [
      { eventCardId: EVENT_A, locationId: 'miyama_town', visibility: 'public' },
      { eventCardId: EVENT_B, locationId: 'shinto', visibility: 'hidden_until_trigger' },
    ], deck: [EVENT_C, EVENT_D] });
    const second = structuredClone(first);
    const initialMultiset = [EVENT_A, EVENT_C, EVENT_D].sort();
    settleReplace(first); settleReplace(second);
    const replacement1 = first.eventPlacements.find((entry) => entry.locationId === 'miyama_town')!;
    const replacement2 = second.eventPlacements.find((entry) => entry.locationId === 'miyama_town')!;
    expect(replacement1.visibility).toEqual({ scope: 'public' });
    expect(replacement1.eventCardId).toBe(replacement2.eventCardId);
    expect(first.eventDeck).toEqual(second.eventDeck);
    expect(first.abilityRuntime!.randomState).toBe(second.abilityRuntime!.randomState);
    expect([replacement1.eventCardId, ...(first.eventDeck ?? [])].sort()).toEqual(initialMultiset);
    expect(placement(first, EVENT_B)).toMatchObject({ locationId: 'shinto', visibility: { scope: 'hidden_until_trigger' } });
  });

  it('rejects forged event selections mutation-free', () => {
    const state = setup();
    expect(activate(state, ACTION).ok).toBe(true);
    expect(choose(state, ['swap-events']).ok).toBe(true);
    const before = structuredClone(state);
    const result = choose(state, ['event_battlefield:forged', eventToken(state, EVENT_B)]);
    expect(result.ok).toBe(false);
    expect(state).toEqual(before);
  });
});
