import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { AuthoringCard } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const KIRITSUGU = 'servant.kiritsugu.skill.sc-kiritsugu-2';
const SOURCE = 'kiritsugu-source';
const ABILITY = 'mystic-break-each-opponent';
const MODIFIER = 'mystic-break-no-mana';
const SPENDER = 'fixture.mana-spender';
const SPENDER_INSTANCE = 'p3-spender';
const PAID_ATTACK = 'fixture.paid-attack';
const PAID_ATTACK_INSTANCE = 'p3-paid-attack';

function mysticBreakAbility(): any {
  return {
    id: ABILITY, kind: 'phase_action', printedClause: 'each same-battlefield opponent chooses', markers: ['m50_structured_v1'],
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [
      { type: 'source_owned' },
      { type: 'at_battlefield' },
      { type: 'target_count_at_least', count: 1, target: { scope: 'same_battlefield_opponents' } },
    ],
    targets: [], cost: [], creates: [],
    ruleModifiers: [{
      id: MODIFIER, printedClause: 'cannot spend mana this round', installation: 'effect', operation: 'forbid', rule: 'mana_spending',
      scope: { subject: 'controller' }, lifecycle: { duration: 'this_round' },
    }],
    effects: [{
      type: 'choose_each_player_option', candidateTarget: { scope: 'same_battlefield_opponents' }, options: [
        { id: 'lose-vp', label: 'lose 3 VP', effects: [{ type: 'lose_victory_points', target: 'decision_player', amount: 3 }] },
        { id: 'no-mana', label: 'cannot spend mana', effects: [{ type: 'install_ability_rule_modifier', target: 'decision_player', abilityId: ABILITY, modifierId: MODIFIER }] },
      ],
    }],
    lifecycle: {}, responseWindow: {}, limit: {},
    visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function sourceCard(ability: any = mysticBreakAbility()): any {
  return {
    id: KIRITSUGU, name: 'Mystic Break fixture', cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.kiritsugu' },
    cardFace: { typeLabel: 'Quick/Noble Phantasm', cost: 1, basePower: 3, attributes: ['fixture-quick', 'fixture-np'], requirements: [{ type: 'skill_zone_mana_at_least', value: 8 }] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [ability], mode: 'automatic',
  };
}

function spenderCard(): any {
  return {
    id: SPENDER, name: 'spender', cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.fixture' },
    cardFace: { typeLabel: 'fixture', cost: 0, basePower: 0, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [
      {
        id: 'fixed-spend', kind: 'phase_action', printedClause: 'pay 1', activation: { phase: 'action', opens: 'controller_action_window' },
        conditions: [], targets: [], cost: [{ type: 'pay_mana', amount: 1 }], effects: [{ type: 'gain_victory_points', target: 'controller', amount: 1 }],
        creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
      },
      {
        id: 'effect-spend', kind: 'phase_action', printedClause: 'effect pays 1', activation: { phase: 'action', opens: 'controller_action_window' },
        conditions: [], targets: [], cost: [], effects: [{ type: 'pay_mana', target: 'controller', amount: 1 }],
        creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
      },
      {
        id: 'free-action', kind: 'phase_action', printedClause: 'free', activation: { phase: 'action', opens: 'controller_action_window' },
        conditions: [], targets: [], cost: [], effects: [{ type: 'gain_victory_points', target: 'controller', amount: 1 }],
        creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
      },
    ],
    mode: 'automatic',
  };
}

function archive(ability: any = mysticBreakAbility()): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.kiritsugu', name: 'fixture', class: 'Assassin',
    cards: [sourceCard(ability), spenderCard()],
  };
}

function paidAttackDefinition(): AuthoringCard {
  return {
    id: PAID_ATTACK, name: 'paid attack', cardType: 'basic_attack', owner: { type: 'master', id: 'fixture' },
    cardFace: { cost: 2, basePower: 1, attributes: ['fixture'] }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities: [], mode: 'automatic',
  };
}

function pack(): any {
  const loaded = rules.loadAuthoringJson(archive());
  expect(loaded.report).toEqual([]);
  loaded.cards[PAID_ATTACK] = paidAttackDefinition();
  return loaded;
}

function setup(): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.cards = [
    { instanceId: SOURCE, definitionId: KIRITSUGU, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: SPENDER_INSTANCE, definitionId: SPENDER, ownerPlayerId: 'p3', controllerPlayerId: 'p3', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p3' } },
    { instanceId: PAID_ATTACK_INSTANCE, definitionId: PAID_ATTACK, ownerPlayerId: 'p3', controllerPlayerId: 'p3', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p3' } },
  ];
  state.players.find((player) => player.id === 'p1')!.locationId = 'miyama_town';
  state.players.find((player) => player.id === 'p2')!.locationId = 'miyama_town';
  state.players.find((player) => player.id === 'p3')!.locationId = 'miyama_town';
  state.players.find((player) => player.id === 'p4')!.locationId = 'shinto';
  for (const player of state.players.filter((entry) => entry.status === 'active')) { player.mana = 10; player.vp = 5; }
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players.find((player) => player.id === 'p1')!.seat;
  rules.initializeAbilityRuntime(state, pack(), { seed: 20260924 });
  state.abilityRuntime!.cardState[SOURCE] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  state.abilityRuntime!.cardState[SPENDER_INSTANCE] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  state.abilityRuntime!.cardState[PAID_ATTACK_INSTANCE] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function activate(state: GameState) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ABILITY });
}
function choose(state: GameState, playerId: string, optionId: string) {
  const decision = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: decision.id, selectedIds: [optionId] });
}
function installForP3(state: GameState) {
  expect(activate(state).ok).toBe(true);
  expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p2', candidates: ['lose-vp', 'no-mana'] });
  expect(choose(state, 'p2', 'lose-vp').ok).toBe(true);
  expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p3', candidates: ['lose-vp', 'no-mana'] });
  expect(choose(state, 'p3', 'no-mana').ok).toBe(true);
}

describe('P3 F4 M50-02 Kiritsugu Mystic Break', () => {
  it('loads only the exact effect-installed this-round mana-spending modifier', () => {
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report).toEqual([]);
    expect(rules.isAcceptedEffectInstalledControllerManaSpendingForbidModifier(loaded.cards[KIRITSUGU]!.abilities[0]!.ruleModifiers[0]!)).toBe(true);
    const widened = mysticBreakAbility(); widened.ruleModifiers[0].scope.subject = 'all_players';
    expect(rules.loadAuthoringJson(archive(widened)).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ abilityId: ABILITY, path: 'ruleModifiers', status: 'unsupported' }),
    ]));
  });

  it('routes each same-battlefield opponent independently and installs the no-mana choice only on that chooser', () => {
    const state = setup(); installForP3(state);
    expect(state.players.find((player) => player.id === 'p2')!.vp).toBe(2);
    expect(state.players.find((player) => player.id === 'p3')!.vp).toBe(5);
    expect(rules.m50ManaSpendingForbidden(state, 'p2')).toBe(false);
    expect(rules.m50ManaSpendingForbidden(state, 'p3')).toBe(true);
    expect(rules.m50ManaSpendingForbidden(state, 'p4')).toBe(false);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.abilityRuntime!.pendingStructuredEachPlayerOption).toBeUndefined();
  });

  it('blocks positive voluntary ability/card mana spending while preserving zero-cost actions', () => {
    const state = setup(); installForP3(state);
    state.round.prioritySeat = state.players.find((player) => player.id === 'p3')!.seat;
    const legal = rules.getLegalActions(state, 'p3');
    expect(legal).not.toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: SPENDER_INSTANCE, abilityId: 'fixed-spend' }));
    expect(legal).toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: SPENDER_INSTANCE, abilityId: 'effect-spend' }));
    expect(legal).toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: SPENDER_INSTANCE, abilityId: 'free-action' }));
    expect(legal.some((action) => action.type === 'play_card' && action.cardInstanceId === PAID_ATTACK_INSTANCE && action.faceDown !== true)).toBe(false);
    expect(legal).toContainEqual(expect.objectContaining({ type: 'play_card', cardInstanceId: PAID_ATTACK_INSTANCE, faceDown: true }));

    const effectSpend = rules.dispatchAbilityCommand(state, 'p3', { type: 'activate_ability', cardInstanceId: SPENDER_INSTANCE, abilityId: 'effect-spend' });
    expect(effectSpend).toMatchObject({ ok: false, rejection: { code: 'mana_spending_forbidden' } });
    expect(state.players.find((player) => player.id === 'p3')!.mana).toBe(10);
    expect(rules.dispatchAbilityCommand(state, 'p3', { type: 'activate_ability', cardInstanceId: SPENDER_INSTANCE, abilityId: 'free-action' })).toMatchObject({ ok: true });
    expect(state.players.find((player) => player.id === 'p3')!.vp).toBe(6);
  });

  it('blocks paid normal movement but permits a zero-cost effect move', () => {
    const state = setup(); installForP3(state);
    state.players.find((player) => player.id === 'p3')!.locationId = 'magic_workshop';
    state.players.find((player) => player.id === 'p1')!.locationId = 'shinto';
    state.players.find((player) => player.id === 'p2')!.locationId = 'shinto';
    state.players.find((player) => player.id === 'p4')!.locationId = 'moon_holy_grail';
    const blocked = rules.movePlayer(state, { playerId: 'p3', to: 'recon', movementKind: 'normal' });
    expect(blocked).toMatchObject({ moved: false, reason: 'mana_spending_forbidden', manaSpent: 0 });
    expect(blocked.nextState.players.find((player) => player.id === 'p3')!.mana).toBe(10);
    const effect = rules.movePlayer(state, { playerId: 'p3', to: 'recon', movementKind: 'effect' });
    expect(effect).toMatchObject({ moved: true, manaSpent: 0 });
    expect(effect.nextState.players.find((player) => player.id === 'p3')!.mana).toBe(10);
  });

  it('persists after the source closes, expires next round, and then allows positive mana spending again', () => {
    const state = setup(); installForP3(state);
    state.cards.find((card) => card.instanceId === SOURCE)!.zone = 'removed_from_game';
    state.abilityRuntime!.cardState[SOURCE]!.active = false;
    expect(rules.m50ManaSpendingForbidden(state, 'p3')).toBe(true);
    const nextRound = state.round.roundNumber + 1;
    rules.advanceAbilityPhase(state, 'action', nextRound);
    expect(rules.m50ManaSpendingForbidden(state, 'p3')).toBe(false);
    state.round.prioritySeat = state.players.find((player) => player.id === 'p3')!.seat;
    expect(rules.getLegalActions(state, 'p3')).toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: SPENDER_INSTANCE, abilityId: 'fixed-spend' }));
    expect(rules.dispatchAbilityCommand(state, 'p3', { type: 'activate_ability', cardInstanceId: SPENDER_INSTANCE, abilityId: 'fixed-spend' })).toMatchObject({ ok: true });
    expect(state.players.find((player) => player.id === 'p3')!.mana).toBe(9);
  });
});
