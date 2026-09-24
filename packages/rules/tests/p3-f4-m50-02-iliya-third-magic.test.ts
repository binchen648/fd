import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const OWNER = 'master.fixture.iliya';
const ASCENSION = 'master.iliya.skill.ascension';
const UNLOCKER = 'master.fixture.iliya.unlocker';
const MAGIC_BASIC = 'fixture.iliya.basic.magic';
const SPECIAL_BASIC = 'fixture.iliya.basic.special';
const STRENGTH_BASIC = 'fixture.iliya.basic.strength';
const MAGIC_SKILL = 'fixture.iliya.skill.magic';
const SOURCE = 'iliya-ascension-source';

function card(id: string, cardType: string, attributes: string[], basePower = 3): any {
  return {
    id, name: id, cardType, owner: { type: 'master', id: OWNER },
    cardFace: { typeLabel: 'fixture', attributes, cost: 0, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
  };
}

function ascension(): any {
  return {
    id: ASCENSION, name: 'Third Magic', cardType: 'master_skill', owner: { type: 'master', id: OWNER },
    cardFace: { typeLabel: 'ascension', attributes: [], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [
      {
        id: 'third-magic-on-unlock', kind: 'forced_trigger', printedClause: 'fixture', markers: ['m50_structured_v1'],
        activation: { trigger: 'm50_skill_unlocked' },
        conditions: [{ type: 'event_player_is_controller' }, { type: 'event_definition_is_self' }], targets: [], cost: [],
        effects: [
          { type: 'remove_cards_in_zone', target: 'controller', zone: 'hand', attributesAny: ['力量'] },
          { type: 'remove_cards_in_zone', target: 'controller', zone: 'deck', attributesAny: ['力量'] },
          { type: 'remove_cards_in_zone', target: 'controller', zone: 'discard', attributesAny: ['力量'] },
        ],
        ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
      },
      {
        id: 'third-magic-basic-power', kind: 'passive', printedClause: 'fixture', markers: ['m50_structured_v1'], activation: {},
        conditions: [{ type: 'source_owned' }], targets: [], cost: [], effects: [],
        ruleModifiers: [{
          id: 'magic-special-basic-plus-two', operation: 'add', rule: 'card_power',
          scope: { subject: 'controller', cards: { basic: true, attributesAny: ['魔术', '特殊'] } },
          value: 2, lifecycle: { duration: 'permanent' },
        }],
        creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
      },
      {
        id: 'third-magic-heavens-cup-victory', kind: 'passive', printedClause: 'fixture', markers: ['m50_structured_v1'],
        activation: { trigger: 'm50_round_started' }, conditions: [{ type: 'source_owned' }, { type: 'current_situation_id_is', situationId: 'situation.sit13' }],
        targets: [], cost: [], effects: [{ type: 'finish_game', target: { scope: 'all_players' }, reason: 'master.iliya.third-magic-heavens-cup' }],
        ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
      },
    ],
  };
}

function unlocker(): any {
  return {
    id: UNLOCKER, name: 'unlocker', cardType: 'master_skill', owner: { type: 'master', id: OWNER },
    cardFace: { typeLabel: 'fixture', attributes: [], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [{
      id: 'unlock-third-magic', kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
      activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [], targets: [], cost: [],
      effects: [{ type: 'activate_owned_skill_card', definitionId: ASCENSION }], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    }],
  };
}

function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: OWNER, name: 'fixture', class: 'Master',
    cards: [ascension(), unlocker(), card(MAGIC_BASIC, 'basic_attack', ['魔术']), card(SPECIAL_BASIC, 'basic_attack', ['特殊']), card(STRENGTH_BASIC, 'basic_attack', ['力量']), card(MAGIC_SKILL, 'master_skill', ['魔术'])],
  };
}

function add(state: GameState, instanceId: string, definitionId: string, ownerPlayerId: 'p1' | 'p2', zone: 'hand' | 'deck' | 'discard' | 'skill' | 'attack_area'): void {
  state.cards.push({ instanceId, definitionId, ownerPlayerId, controllerPlayerId: ownerPlayerId, zone, visibility: { scope: 'owner_only', ownerPlayerId } });
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.players[0]!.masterCardId = OWNER;
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  add(state, SOURCE, ASCENSION, 'p1', 'skill');
  add(state, 'iliya-unlocker', UNLOCKER, 'p1', 'skill');
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  state.abilityRuntime!.cardState[SOURCE] = { active: false, faceDown: false, playedRound: 1 };
  state.abilityRuntime!.cardState['iliya-unlocker'] = { active: true, faceDown: false, playedRound: 1 };
  return state;
}

describe('P3 F4 M50-02 Iliya Third Magic', () => {
  it('on the authoritative false->true unlock edge removes only controller Strength cards from hand, deck, and discard', () => {
    const state = setup();
    add(state, 'p1-strength-hand', STRENGTH_BASIC, 'p1', 'hand');
    add(state, 'p1-strength-deck', STRENGTH_BASIC, 'p1', 'deck');
    add(state, 'p1-strength-discard', STRENGTH_BASIC, 'p1', 'discard');
    add(state, 'p1-magic-hand', MAGIC_BASIC, 'p1', 'hand');
    add(state, 'p2-strength-hand', STRENGTH_BASIC, 'p2', 'hand');

    const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'iliya-unlocker', abilityId: 'unlock-third-magic' });
    expect(result.ok).toBe(true);
    expect(state.abilityRuntime!.cardState[SOURCE]!.active).toBe(true);
    for (const id of ['p1-strength-hand', 'p1-strength-deck', 'p1-strength-discard']) {
      expect(state.cards.find((candidate) => candidate.instanceId === id)?.zone).toBe('removed_from_game');
    }
    expect(state.cards.find((candidate) => candidate.instanceId === 'p1-magic-hand')?.zone).toBe('hand');
    expect(state.cards.find((candidate) => candidate.instanceId === 'p2-strength-hand')?.zone).toBe('hand');
  });

  it('keeps the unlock trigger edge-based so repeated activation does not re-run the purge', () => {
    const state = setup();
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'iliya-unlocker', abilityId: 'unlock-third-magic' }).ok).toBe(true);
    add(state, 'late-strength', STRENGTH_BASIC, 'p1', 'hand');
    const repeated = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'iliya-unlocker', abilityId: 'unlock-third-magic' });
    expect(repeated.ok).toBe(false);
    expect(state.cards.find((candidate) => candidate.instanceId === 'late-strength')?.zone).toBe('hand');
  });

  it('adds exactly +2 only to controller basic attacks with Magic or Special attributes while the ascension is owned', () => {
    const state = setup();
    add(state, 'magic-basic', MAGIC_BASIC, 'p1', 'attack_area');
    add(state, 'special-basic', SPECIAL_BASIC, 'p1', 'attack_area');
    add(state, 'strength-basic', STRENGTH_BASIC, 'p1', 'attack_area');
    add(state, 'magic-skill', MAGIC_SKILL, 'p1', 'attack_area');
    expect(rules.calculateCardPower(state, 'magic-basic').value).toBe(5);
    expect(rules.calculateCardPower(state, 'special-basic').value).toBe(5);
    expect(rules.calculateCardPower(state, 'strength-basic').value).toBe(3);
    expect(rules.calculateCardPower(state, 'magic-skill').value).toBe(3);
  });

  it('emits the trusted new-round trigger and awards Heaven’s Cup victory to every active, non-eliminated player', () => {
    const state = setup();
    (state as unknown as { modeState?: Record<string, unknown> }).modeState = { currentSituationId: 'situation.sit13' };
    state.players[2]!.status = 'eliminated';
    rules.advanceAbilityPhase(state, 'preparation', 2);
    expect(state.abilityRuntime!.structuredInstantVictory).toMatchObject({
      winnerIds: ['p1', 'p2'], reason: 'master.iliya.third-magic-heavens-cup', sourceCardId: SOURCE, abilityId: 'third-magic-heavens-cup-victory', round: 2,
    });
  });

  it('does not synthesize victory at round start when Heaven’s Cup is not the current situation', () => {
    const state = setup();
    (state as unknown as { modeState?: Record<string, unknown> }).modeState = { currentSituationId: 'situation.other' };
    rules.advanceAbilityPhase(state, 'preparation', 2);
    expect(state.abilityRuntime!.structuredInstantVictory).toBeUndefined();
  });
});
