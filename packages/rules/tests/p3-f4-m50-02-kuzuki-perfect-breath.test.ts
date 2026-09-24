import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const OWNER = 'master.fixture.kuzuki';
const ASCENSION = 'master.kuzuki.skill.ascension';
const SNAKE = 'master.kuzuki.skill.s3';
const UNLOCKER = 'master.fixture.kuzuki.unlocker';
const QUICK = 'fixture.kuzuki.basic.quick';
const MAGIC = 'fixture.kuzuki.basic.magic';
const ASCENSION_I = 'kuzuki-ascension';
const UNLOCKER_I = 'kuzuki-unlocker';

function simpleCard(id: string, cardType: string, attributes: string[], basePower = 3): any {
  return {
    id, name: id, cardType, owner: { type: 'master', id: OWNER },
    cardFace: { typeLabel: 'fixture', attributes, cost: 0, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
  };
}

function ascension(): any {
  return {
    id: ASCENSION, name: 'Perfect Breath', cardType: 'master_skill', owner: { type: 'master', id: OWNER },
    cardFace: { typeLabel: 'ascension', attributes: [], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [
      {
        id: 'perfect-breath-on-unlock', kind: 'forced_trigger', printedClause: 'fixture', markers: ['m50_structured_v1'],
        activation: { trigger: 'm50_skill_unlocked' },
        conditions: [{ type: 'event_player_is_controller' }, { type: 'event_definition_is_self' }], targets: [], cost: [],
        effects: [
          { type: 'remove_cards_in_zone', target: 'controller', zone: 'deck', attributesAny: ['魔术'] },
          { type: 'remove_cards_in_zone', target: 'controller', zone: 'discard', attributesAny: ['魔术'] },
          { type: 'remove_cards_in_zone', target: 'controller', zone: 'hand', attributesAny: ['魔术'] },
        ],
        ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
      },
      {
        id: 'perfect-breath-continuous', kind: 'passive', printedClause: 'fixture', markers: ['m50_structured_v1'], activation: {},
        conditions: [{ type: 'source_owned' }], targets: [], effects: [], cost: [],
        ruleModifiers: [{
          id: 'quick-basic-power-plus-three', operation: 'add', rule: 'card_power',
          scope: { subject: 'controller', cards: { basic: true, attributesAny: ['迅捷'] } }, value: 3,
          lifecycle: { duration: 'permanent' },
        }],
        transforms: [{
          id: 'grant-snake-join', type: 'card', target: { subject: 'controller', cards: { definitionIds: [SNAKE] } },
          grantAbilities: [{
            id: 'perfect-breath-snake-join', kind: 'phase_action', printedClause: 'fixture',
            activation: { phase: 'combat', opens: 'controller_combat_action_window' }, conditions: [], targets: [],
            cost: [{ type: 'pay_mana', amount: 6 }], effects: [{ type: 'join_source_card_to_attack', allowedSourceZones: ['hand', 'skill'] }],
            creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
          }],
          lifecycle: { duration: 'permanent' },
        }],
        creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
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
      id: 'unlock-perfect-breath', kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
      activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [], targets: [], cost: [],
      effects: [{ type: 'activate_owned_skill_card', definitionId: ASCENSION }], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    }],
  };
}

function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: OWNER, name: 'fixture', class: 'Master',
    cards: [ascension(), unlocker(), simpleCard(SNAKE, 'master_skill', []), simpleCard(QUICK, 'basic_attack', ['迅捷']), simpleCard(MAGIC, 'basic_attack', ['魔术'])],
  };
}

function add(state: GameState, instanceId: string, definitionId: string, ownerPlayerId: 'p1' | 'p2', zone: 'hand' | 'deck' | 'discard' | 'skill' | 'attack_area'): void {
  state.cards.push({ instanceId, definitionId, ownerPlayerId, controllerPlayerId: ownerPlayerId, zone, visibility: zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId } });
  state.abilityRuntime!.cardState[instanceId] = { active: zone === 'attack_area', faceDown: false, playedRound: state.round.roundNumber };
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] }); state.cards = [];
  state.players[0]!.masterCardId = OWNER; state.players[0]!.mana = 10;
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  add(state, ASCENSION_I, ASCENSION, 'p1', 'skill'); add(state, UNLOCKER_I, UNLOCKER, 'p1', 'skill');
  state.abilityRuntime!.cardState[ASCENSION_I]!.active = true; state.abilityRuntime!.cardState[UNLOCKER_I]!.active = true;
  return state;
}

function snakeAction(state: GameState, instanceId: string) {
  return rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'activate_ability' && candidate.cardInstanceId === instanceId && candidate.abilityId === 'perfect-breath-snake-join');
}

describe('P3 F4 M50-02 Kuzuki Perfect Breath', () => {
  it('purges only controller Magic cards on the authoritative unlock edge', () => {
    const state = setup(); state.abilityRuntime!.cardState[ASCENSION_I]!.active = false;
    add(state, 'magic-hand', MAGIC, 'p1', 'hand'); add(state, 'magic-deck', MAGIC, 'p1', 'deck'); add(state, 'magic-discard', MAGIC, 'p1', 'discard');
    add(state, 'quick-hand', QUICK, 'p1', 'hand'); add(state, 'opp-magic', MAGIC, 'p2', 'hand');
    const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: UNLOCKER_I, abilityId: 'unlock-perfect-breath' });
    expect(result.ok).toBe(true);
    for (const id of ['magic-hand', 'magic-deck', 'magic-discard']) expect(state.cards.find((card) => card.instanceId === id)?.zone).toBe('removed_from_game');
    expect(state.cards.find((card) => card.instanceId === 'quick-hand')?.zone).toBe('hand');
    expect(state.cards.find((card) => card.instanceId === 'opp-magic')?.zone).toBe('hand');
  });

  it('adds exactly +3 to controller Quick basic attacks', () => {
    const state = setup(); add(state, 'quick', QUICK, 'p1', 'attack_area'); add(state, 'magic', MAGIC, 'p1', 'attack_area');
    expect(rules.calculateCardPower(state, 'quick').value).toBe(6); expect(rules.calculateCardPower(state, 'magic').value).toBe(3);
  });

  it('pays exactly 6 to join Snake from hand without consuming ordinary play counters or firing card-play semantics', () => {
    const state = setup(); add(state, 'snake-hand', SNAKE, 'p1', 'hand'); state.round.activePhase = 'battle';
    const before = structuredClone(state.abilityRuntime!.playCounters); const beforeEvents = state.abilityRuntime!.events.length;
    const action = snakeAction(state, 'snake-hand'); expect(action).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4);
    expect(state.cards.find((card) => card.instanceId === 'snake-hand')).toMatchObject({ zone: 'attack_area', visibility: { scope: 'public' } });
    expect(state.abilityRuntime!.cardState['snake-hand']).toMatchObject({ active: true, faceDown: false, playedRound: state.round.roundNumber });
    expect(state.abilityRuntime!.playCounters).toEqual(before);
    expect(state.abilityRuntime!.events.slice(beforeEvents).some((event) => event.type === 'on_card_played')).toBe(false);
  });

  it('can join an inactive Snake from the skill zone', () => {
    const state = setup(); add(state, 'snake-skill', SNAKE, 'p1', 'skill'); state.abilityRuntime!.cardState['snake-skill']!.active = false; state.round.activePhase = 'battle';
    const action = snakeAction(state, 'snake-skill'); expect(action).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === 'snake-skill')?.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState['snake-skill']?.active).toBe(true);
  });

  it('fails closed for insufficient mana and for a stale source-zone transition', () => {
    const poor = setup(); add(poor, 'snake-poor', SNAKE, 'p1', 'hand'); poor.players[0]!.mana = 5; poor.round.activePhase = 'battle';
    expect(snakeAction(poor, 'snake-poor')).toBeUndefined();
    const denied = rules.dispatchAbilityCommand(poor, 'p1', { type: 'activate_ability', cardInstanceId: 'snake-poor', abilityId: 'perfect-breath-snake-join' });
    expect(denied.ok).toBe(false); expect(poor.players[0]!.mana).toBe(5); expect(poor.cards.find((card) => card.instanceId === 'snake-poor')?.zone).toBe('hand');

    const stale = setup(); add(stale, 'snake-stale', SNAKE, 'p1', 'hand'); stale.round.activePhase = 'battle'; expect(snakeAction(stale, 'snake-stale')).toBeTruthy();
    stale.cards.find((card) => card.instanceId === 'snake-stale')!.zone = 'deck'; const mana = stale.players[0]!.mana;
    const result = rules.dispatchAbilityCommand(stale, 'p1', { type: 'activate_ability', cardInstanceId: 'snake-stale', abilityId: 'perfect-breath-snake-join' });
    expect(result.ok).toBe(false); expect(stale.players[0]!.mana).toBe(mana); expect(stale.cards.find((card) => card.instanceId === 'snake-stale')?.zone).toBe('deck');
  });

  it('rejects widened granted join metadata instead of enabling a near-match', () => {
    const badCost = archive(); badCost.cards[0].abilities[1].transforms[0].grantAbilities[0].cost[0].amount = 5;
    expect(rules.loadAuthoringJson(badCost).report).toEqual(expect.arrayContaining([expect.objectContaining({ abilityId: 'perfect-breath-continuous', path: 'copies/transforms' })]));
    const badZones = archive(); badZones.cards[0].abilities[1].transforms[0].grantAbilities[0].effects[0].allowedSourceZones = ['hand'];
    expect(rules.loadAuthoringJson(badZones).report).toEqual(expect.arrayContaining([expect.objectContaining({ abilityId: 'perfect-breath-continuous', path: 'copies/transforms' })]));
  });
});
