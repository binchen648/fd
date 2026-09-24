import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { AuthoringCard } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SOURCE_DEF = 'fixture.jeanne.lord';
const LUCK_DEF = 'fixture.jeanne.luck';
const SOURCE = 'jeanne-source';
const GRANT = 'lord-luck-combat-play';

function grantedCombatPlay(): any {
  return {
    id: GRANT, kind: 'phase_action', printedClause: 'combat: play this card',
    activation: { phase: 'combat', opens: 'controller_combat_action_window' },
    conditions: [], targets: [], cost: [], effects: [{ type: 'play_source_card', face: 'face_up' }], creates: [], ruleModifiers: [],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}
function luckField(): any {
  return {
    id: 'lord-luck-field', kind: 'passive', printedClause: 'fixture luck field', markers: ['m50_structured_v1'],
    activation: { requiresSourceState: 'active' },
    conditions: [{ type: 'source_active' }, { type: 'phase_is', phase: 'combat' }], targets: [], effects: [], cost: [], creates: [],
    ruleModifiers: [{
      id: 'face-up-luck-total-power', operation: 'add', rule: 'combat_power', scope: { subject: 'controller' },
      value: { type: 'formula', op: 'multiply', args: [{ type: 'constant', value: 2 }, { type: 'metric', metric: 'face_up_definition_count', source: 'all_players', key: LUCK_DEF }] },
      lifecycle: { duration: 'while_active' },
    }],
    transforms: [{
      id: 'grant-luck-combat-play', printedClause: 'all Luck may be played during combat', type: 'card',
      target: { subject: 'all_players', cards: { definitionIds: [LUCK_DEF] } }, grantAbilities: [grantedCombatPlay()], lifecycle: { duration: 'while_active' },
    }],
    lifecycle: { duration: 'while_active' }, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}
function drawAll(): any {
  return {
    id: 'lord-draw-all', kind: 'phase_action', printedClause: 'all players draw one', markers: ['m50_structured_v1'],
    activation: { phase: 'action', requiresSourceState: 'active', opens: 'controller_action_window' }, conditions: [{ type: 'source_active' }], targets: [], cost: [],
    effects: [{ type: 'draw_cards', target: 'all_players', amount: 1 }], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}
function sourceCard(field: any = luckField()): any {
  return {
    id: SOURCE_DEF, name: 'fixture lord', cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.fixture-jeanne' },
    cardFace: { cost: 0, basePower: 0, attributes: ['fixture-np'] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [field, drawAll()], mode: 'automatic',
  };
}
function archive(card: any = sourceCard()): any {
  return { schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.fixture-jeanne', name: 'fixture', class: 'Ruler', cards: [card] };
}
function luckDefinition(): AuthoringCard {
  return { id: LUCK_DEF, name: 'fixture luck', cardType: 'basic_attack', cardFace: { cost: 3, basePower: 1, attributes: ['fixture-luck'] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
}
function loadedPack(): any {
  const pack = rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]); pack.cards[LUCK_DEF] = luckDefinition(); return pack;
}
function setup(): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] }); state.cards = [];
  state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'shinto';
  state.round.activePhase = 'battle'; state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, loadedPack(), { seed: 20260924 });
  state.cards.push({ instanceId: SOURCE, definitionId: SOURCE_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState[SOURCE] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}
function addCard(state: GameState, playerId: string, zone: 'hand' | 'deck' | 'attack_area', faceDown = false, active = zone === 'attack_area'): string {
  const id = `luck-${playerId}-${zone}-${state.cards.length}`;
  state.cards.push({ instanceId: id, definitionId: LUCK_DEF, ownerPlayerId: playerId, controllerPlayerId: playerId, zone, visibility: zone === 'attack_area' && !faceDown ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: playerId } });
  state.abilityRuntime!.cardState[id] = { active, faceDown, playedRound: state.round.roundNumber };
  return id;
}
function grantAction(state: GameState, playerId: string, instanceId: string) {
  return rules.getLegalActions(state, playerId).find((action) => action.type === 'activate_ability' && action.cardInstanceId === instanceId && action.abilityId === GRANT);
}

describe('P3 F4 M50-02 Jeanne Luck field', () => {
  it('accepts only the exact global-Luck transform/combat-power envelope', () => {
    const pack = rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]);
    expect(rules.isAcceptedM50GrantedCardAbilitySource(pack.cards[SOURCE_DEF]!.abilities[0]!)).toBe(true);
    const widened = luckField(); widened.transforms[0].target.subject = 'opponents';
    expect(rules.loadAuthoringJson(archive(sourceCard(widened))).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ abilityId: 'lord-luck-field', path: 'copies/transforms', status: 'unsupported' }),
    ]));
  });

  it('adds +2 controller combat power per active face-up Luck across all players and updates continuously', () => {
    const state = setup(); addCard(state, 'p1', 'attack_area'); const enemy = addCard(state, 'p2', 'attack_area'); const remote = addCard(state, 'p3', 'attack_area');
    const hidden = addCard(state, 'p3', 'attack_area', true, true);
    expect(rules.m50GrantedCombatPowerAdjustment(state, 'p1')).toBe(6);
    expect(rules.m50GrantedCombatPowerAdjustment(state, 'p2')).toBe(0);
    const p1 = rules.deriveBattleParticipantsFromState(state, 'miyama_town').find((entry) => entry.playerId === 'p1')!;
    expect(p1.totalPower).toBe(7);
    state.abilityRuntime!.cardState[enemy]!.active = false;
    expect(rules.m50GrantedCombatPowerAdjustment(state, 'p1')).toBe(4);
    state.abilityRuntime!.cardState[hidden]!.faceDown = false;
    expect(rules.m50GrantedCombatPowerAdjustment(state, 'p1')).toBe(6);
    state.abilityRuntime!.cardState[remote]!.active = false;
    expect(rules.m50GrantedCombatPowerAdjustment(state, 'p1')).toBe(4);
    state.abilityRuntime!.cardState[SOURCE]!.active = false;
    expect(rules.m50GrantedCombatPowerAdjustment(state, 'p1')).toBe(0);
  });

  it('grants another player a paid real combat-window Luck play without consuming the regular attack quota', () => {
    const state = setup(); const luck = addCard(state, 'p2', 'hand', false, false); const p2 = state.players[1]!;
    state.round.prioritySeat = p2.seat;
    const grants = rules.m50GrantedAbilitiesForCard(state, luck);
    expect(grants.map((ability) => ability.id)).toContain(GRANT);
    expect(rules.isAcceptedM50FreeSourceCardCombatPlayAbility(grants.find((ability) => ability.id === GRANT)!)).toBe(true);
    expect(rules.classifyAbilityInteraction(grants.find((ability) => ability.id === GRANT)!)).toMatchObject({ kind: 'phase_activation', phase: 'combat' });
    p2.mana = 2;
    expect(grantAction(state, 'p2', luck)).toBeUndefined();
    p2.mana = 3;
    const action = grantAction(state, 'p2', luck); expect(action).toBeTruthy();
    const beforeSnapshots = Object.keys(state.abilityRuntime!.trustedCardPlaySnapshots ?? {}).length;
    const beforeAttacks = state.abilityRuntime!.playCounters?.attacksDeclaredByPlayer?.p2 ?? 0;
    expect(rules.dispatchAbilityCommand(state, 'p2', action!)).toMatchObject({ ok: true });
    expect(state.players.find((player) => player.id === 'p2')!.mana).toBe(0);
    expect(state.cards.find((card) => card.instanceId === luck)).toMatchObject({ zone: 'attack_area' });
    expect(state.abilityRuntime!.cardState[luck]).toMatchObject({ active: true, faceDown: false, playedRound: state.round.roundNumber, paidManaOnPlay: 3 });
    expect(state.abilityRuntime!.playCounters?.cardsPlayedByPlayer?.p2).toBe(1);
    expect(state.abilityRuntime!.playCounters?.faceUpCardsPlayedByPlayer?.p2).toBe(1);
    expect(state.abilityRuntime!.playCounters?.attacksDeclaredByPlayer?.p2 ?? 0).toBe(beforeAttacks);
    const snapshots = Object.values(state.abilityRuntime!.trustedCardPlaySnapshots ?? {});
    expect(snapshots).toHaveLength(beforeSnapshots + 1);
    expect(snapshots).toContainEqual(expect.objectContaining({ playerId: 'p2', sourceCardId: luck, round: state.round.roundNumber, faceDown: false }));
  });

  it('removes the granted Luck combat-play ability immediately when the source stops being active', () => {
    const state = setup(); const luck = addCard(state, 'p2', 'hand', false, false); const p2 = state.players[1]!; p2.mana = 10; state.round.prioritySeat = p2.seat;
    expect(grantAction(state, 'p2', luck)).toBeTruthy();
    state.abilityRuntime!.cardState[SOURCE]!.active = false;
    expect(grantAction(state, 'p2', luck)).toBeUndefined();
  });

  it('keeps the existing action ability: every living player draws one card', () => {
    const state = setup(); state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
    const living = state.players.filter((player) => player.status === 'active');
    for (const player of living) addCard(state, player.id, 'deck', false, false);
    const beforeHands = Object.fromEntries(living.map((player) => [player.id, state.cards.filter((card) => card.ownerPlayerId === player.id && card.zone === 'hand').length]));
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: 'lord-draw-all' })).toMatchObject({ ok: true });
    for (const player of living) {
      expect(state.cards.filter((card) => card.ownerPlayerId === player.id && card.zone === 'hand').length).toBe(beforeHands[player.id]! + 1);
    }
  });
});
