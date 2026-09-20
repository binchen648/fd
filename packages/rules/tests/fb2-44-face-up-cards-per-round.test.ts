import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const LIMIT_DEF = 'test.fb2-44.limit-source';
const BASIC_DEF = 'test.fb2-44.basic';
const EFFECT_DEF = 'test.fb2-44.effect-source';
const SOURCE_PLAY_DEF = 'test.fb2-44.source-play';
const BRANCH_SOURCE_PLAY_DEF = 'test.fb2-44.branch-source-play';
const COST_MUTATED_BRANCH_SOURCE_PLAY_DEF = 'test.fb2-44.cost-mutated-branch-source-play';
const LIMIT_ID = 'limit-source-instance';
const EFFECT_ID = 'effect-source-instance';

function exactModifier(): any {
  return {
    id: 'same-battlefield-one-face-up-per-round',
    printedClause: 'while active, players here may play only one face-up card each round',
    type: 'card_play_rule_override',
    operation: 'set',
    rule: 'face_up_cards_per_round',
    scope: { subject: 'players_at_source_battlefield' },
    value: 1,
    lifecycle: { duration: 'while_active' },
    priority: { tier: 'card_text', specificity: 'specific' },
    conflictPolicy: 'host_required',
  };
}

function exactLimitAbility(modifier: any = exactModifier()): any {
  return {
    id: 'static-face-up-limit',
    kind: 'residual',
    printedClause: 'synthetic exact face-up play limit',
    activation: {},
    conditions: [],
    targets: [],
    effects: [],
    cost: [],
    ruleModifiers: [modifier],
    creates: [],
    lifecycle: { duration: 'while_active' },
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic' },
  };
}

function card(id: string, abilities: any[]): any {
  return {
    id,
    name: id,
    cardType: id === BASIC_DEF ? 'basic_attack' : 'servant_skill',
    owner: { type: 'servant', id: 'servant.synthetic-fb2-44' },
    cardFace: { typeLabel: 'test', attributes: id === BASIC_DEF ? ['力量'] : [], cost: 0, basePower: 1 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [],
    abilities,
  };
}

function pendingPaidEffectAbility(): any {
  return {
    id: 'pending-paid-effect-play-one-face-up',
    kind: 'phase_action',
    printedClause: 'pay 2 mana, choose one hand card, then play it face up',
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
    conditions: [{ type: 'source_active' }],
    targets: [{
      id: 'pending_selected_card', type: 'card_instance', scope: { zone: 'hand', owner: 'controller' },
      constraints: [], count: { min: 1, max: 1 }, conditions: [],
    }],
    effects: [{ type: 'play_selected_cards', target: 'pending_selected_card', face: 'face_up' }],
    cost: [{ type: 'pay_mana', amount: 2 }],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic' },
  };
}
function effectAbility(): any {
  return {
    id: 'effect-play-one-face-up',
    kind: 'phase_action',
    printedClause: 'play one selected hand card face up',
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
    conditions: [{ type: 'source_active' }],
    targets: [{
      id: 'selected_card', type: 'card_instance', scope: { zone: 'hand', owner: 'controller' },
      constraints: [], count: { min: 1, max: 1 }, conditions: [],
    }],
    effects: [{ type: 'play_selected_cards', target: 'selected_card', face: 'face_up' }],
    cost: [],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic' },
  };
}


function sourcePlayAbility(): any {
  return {
    id: 'play-self-face-up',
    kind: 'response',
    printedClause: 'pay 2 mana to play this source face up',
    activation: { trigger: 'controller_combat_action_window' },
    conditions: [],
    targets: [],
    effects: [{ type: 'play_source_card', face: 'face_up' }],
    cost: [{ type: 'pay_mana', amount: 2 }],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow: { opens: 'controller_combat_action_window' },
    limit: {},
    visibility: {},
    execution: { mode: 'automatic' },
  };
}

function branchSourcePlayAbility(): any {
  const ability = sourcePlayAbility();
  ability.id = 'branch-play-self-face-up';
  ability.printedClause = 'pay 2 mana to play this source face up through a branch';
  ability.effects = [{ type: 'branch', branches: [{ else: [{ type: 'play_source_card', face: 'face_up' }] }] }];
  return ability;
}

function costMutatedBranchSourcePlayAbility(): any {
  const ability = sourcePlayAbility();
  ability.id = 'cost-mutated-branch-play-self-face-up';
  ability.printedClause = 'pay 2 mana, then play this source face up only below 3 mana';
  ability.effects = [{
    type: 'branch',
    branches: [
      { if: { type: 'controller_mana_at_least', value: 3 }, then: [] },
      { else: [{ type: 'play_source_card', face: 'face_up' }] },
    ],
  }];
  return ability;
}
function archive(modifier: any = exactModifier()): any {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'servant_skill_card_archive',
    id: 'servant.synthetic-fb2-44',
    name: 'synthetic fb2-44',
    class: 'Lancer',
    cards: [
      card(LIMIT_DEF, [exactLimitAbility(modifier)]),
      card(BASIC_DEF, []),
      card(EFFECT_DEF, [effectAbility(), pendingPaidEffectAbility()]),
      card(SOURCE_PLAY_DEF, [sourcePlayAbility()]),
      card(BRANCH_SOURCE_PLAY_DEF, [branchSourcePlayAbility()]),
      card(COST_MUTATED_BRANCH_SOURCE_PLAY_DEF, [costMutatedBranchSourcePlayAbility()]),
    ],
  };
}

function setup(options: { sourceActive?: boolean; sourceControllerLocation?: string } = {}): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [
    {
      instanceId: LIMIT_ID, definitionId: LIMIT_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'field', visibility: { scope: 'public' },
    },
    {
      instanceId: EFFECT_ID, definitionId: EFFECT_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'field', visibility: { scope: 'public' },
    },
  ];
  state.round.activePhase = 'action';
  state.players[0]!.locationId = options.sourceControllerLocation ?? 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'shinto';
  for (const player of state.players) player.mana = 20;
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  state.abilityRuntime!.cardState[LIMIT_ID] = { active: options.sourceActive ?? true, faceDown: false, playedRound: 1 };
  state.abilityRuntime!.cardState[EFFECT_ID] = { active: true, faceDown: false, playedRound: 1 };
  return state;
}

function add(state: GameState, playerId: string, zone: 'hand' | 'skill' = 'hand'): string {
  const id = `${playerId}-basic-${state.cards.length}`;
  state.cards.push({
    instanceId: id,
    definitionId: BASIC_DEF,
    ownerPlayerId: playerId,
    controllerPlayerId: playerId,
    zone,
    visibility: { scope: 'owner_only', ownerPlayerId: playerId },
  });
  return id;
}

function play(state: GameState, playerId: string, cardInstanceId: string, faceDown = false) {
  state.round.prioritySeat = state.players.find((player) => player.id === playerId)!.seat;
  return rules.dispatchAbilityCommand(state, playerId, {
    type: 'play_card', cardInstanceId, ...(faceDown ? { faceDown: true } : {}),
  });
}

describe('P3-FB2-44 same-battlefield face-up cards-per-round seam', () => {
  it('admits only the exact fail-closed selector and parent ability envelope', () => {
    expect(rules.isAcceptedFaceUpCardsPerRoundModifier(exactModifier())).toBe(true);
    expect(rules.isAcceptedStaticFaceUpCardsPerRoundAbility(exactLimitAbility(), 'authoring')).toBe(true);
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);

    const nearMisses: Array<(modifier: any) => void> = [
      (m) => { m.value = 2; },
      (m) => { m.scope.subject = 'controller'; },
      (m) => { m.lifecycle.duration = 'this_round'; },
      (m) => { m.type = 'other_rule_override'; },
      (m) => { m.priority.tier = 'base_rule'; },
      (m) => { m.priority.specificity = 'general'; },
      (m) => { m.conflictPolicy = 'higher_priority_wins'; },
      (m) => { m.scope.extra = true; },
    ];
    for (const mutate of nearMisses) {
      const modifier = exactModifier();
      mutate(modifier);
      expect(rules.isAcceptedFaceUpCardsPerRoundModifier(modifier)).toBe(false);
      expect(rules.loadAuthoringJson(archive(modifier)).report).toContainEqual(expect.objectContaining({
        path: 'ruleModifiers', status: 'unsupported', reason: 'Unsupported face-up cards-per-round selector shape',
      }));
    }

    const wrongParent = archive();
    wrongParent.cards[0].abilities[0].conditions = [{ type: 'source_active' }];
    expect(rules.loadAuthoringJson(wrongParent).report).toContainEqual(expect.objectContaining({
      path: 'ruleModifiers', status: 'unsupported', reason: 'Unsupported face-up cards-per-round selector shape',
    }));
  });

  it('gives same-battlefield controller and opponent independent one-face-up allowances', () => {
    const state = setup();
    const p1a = add(state, 'p1');
    const p1b = add(state, 'p1');
    const p2a = add(state, 'p2');
    const p2b = add(state, 'p2');

    expect(rules.hasLiveFaceUpCardsPerRoundLimit(state, 'p1')).toBe(true);
    expect(rules.hasLiveFaceUpCardsPerRoundLimit(state, 'p2')).toBe(true);
    expect(play(state, 'p1', p1a).ok).toBe(true);
    expect(rules.faceUpCardsPlayedThisRound(state, 'p1')).toBe(1);

    state.round.prioritySeat = state.players[0]!.seat;
    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual(expect.objectContaining({
      type: 'play_card', cardInstanceId: p1b, faceDown: undefined,
    }));
    const deniedP1 = play(state, 'p1', p1b);
    expect(deniedP1.ok).toBe(false);
    expect(deniedP1.rejection?.code).toBe('face_up_card_play_limit_reached');

    expect(play(state, 'p2', p2a).ok).toBe(true);
    expect(rules.faceUpCardsPlayedThisRound(state, 'p2')).toBe(1);
    const deniedP2 = play(state, 'p2', p2b);
    expect(deniedP2.ok).toBe(false);
    expect(deniedP2.rejection?.code).toBe('face_up_card_play_limit_reached');
  });

  it('does not count face-down plays against the face-up allowance', () => {
    const state = setup();
    const hidden = add(state, 'p1');
    const visible = add(state, 'p1');

    expect(play(state, 'p1', hidden, true).ok).toBe(true);
    expect(rules.faceUpCardsPlayedThisRound(state, 'p1')).toBe(0);
    expect(play(state, 'p1', visible).ok).toBe(true);
    expect(rules.faceUpCardsPlayedThisRound(state, 'p1')).toBe(1);
  });

  it('does not affect players elsewhere and releases immediately for inactive or non-battlefield sources', () => {
    const elsewhere = setup();
    const p3a = add(elsewhere, 'p3');
    const p3b = add(elsewhere, 'p3');
    expect(rules.hasLiveFaceUpCardsPerRoundLimit(elsewhere, 'p3')).toBe(false);
    expect(play(elsewhere, 'p3', p3a).ok).toBe(true);
    expect(play(elsewhere, 'p3', p3b).ok).toBe(true);

    const inactive = setup({ sourceActive: false });
    const ia = add(inactive, 'p2');
    const ib = add(inactive, 'p2');
    expect(rules.hasLiveFaceUpCardsPerRoundLimit(inactive, 'p2')).toBe(false);
    expect(play(inactive, 'p2', ia).ok).toBe(true);
    expect(play(inactive, 'p2', ib).ok).toBe(true);

    const nonBattlefield = setup({ sourceControllerLocation: 'magic_workshop' });
    nonBattlefield.players[1]!.locationId = 'magic_workshop';
    const na = add(nonBattlefield, 'p2');
    const nb = add(nonBattlefield, 'p2');
    expect(rules.hasLiveFaceUpCardsPerRoundLimit(nonBattlefield, 'p2')).toBe(false);
    expect(play(nonBattlefield, 'p2', na).ok).toBe(true);
    expect(play(nonBattlefield, 'p2', nb).ok).toBe(true);
  });

  it('releases immediately when the active source closes or its controller leaves the battlefield', () => {
    const closed = setup();
    closed.cards.find((candidate) => candidate.instanceId === LIMIT_ID)!.zone = 'skill';
    closed.abilityRuntime!.cardState[LIMIT_ID] = { active: false, faceDown: false, playedRound: 1 };
    expect(rules.hasLiveFaceUpCardsPerRoundLimit(closed, 'p2')).toBe(false);

    const moved = setup();
    moved.players[0]!.locationId = 'shinto';
    expect(rules.hasLiveFaceUpCardsPerRoundLimit(moved, 'p2')).toBe(false);
  });

  it('resets the authoritative face-up count on round advance', () => {
    const state = setup();
    const first = add(state, 'p1');
    expect(play(state, 'p1', first).ok).toBe(true);
    expect(rules.faceUpCardsPlayedThisRound(state, 'p1')).toBe(1);

    rules.advanceAbilityPhase(state, 'action', state.round.roundNumber + 1);
    expect(rules.faceUpCardsPlayedThisRound(state, 'p1')).toBe(0);
    const second = add(state, 'p1');
    expect(play(state, 'p1', second).ok).toBe(true);
  });

  it('rejects a multi-face-up batch atomically before card or resource mutation', () => {
    const state = setup();
    const first = add(state, 'p1');
    const second = add(state, 'p1');
    const before = structuredClone(state);

    expect(() => rules.playAbilityCardBatch(state, 'p1', [
      { cardInstanceId: first }, { cardInstanceId: second },
    ])).toThrow(/face-up card play limit reached/i);
    expect(state).toEqual(before);
  });

  it('cannot bypass the cap through staged batch confirmation', () => {
    const state = setup();
    const first = add(state, 'p1');
    const second = add(state, 'p1');
    state.round.prioritySeat = state.players[0]!.seat;

    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: first }).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: second }).ok).toBe(true);
    const beforeConfirm = structuredClone(state);
    const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'confirm_staged_attack' });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('face_up_card_play_limit_reached');
    expect(state).toEqual(beforeConfirm);
  });

  it('cannot bypass the cap through trusted effect play', () => {
    const state = setup();
    const first = add(state, 'p1');
    const effectTarget = add(state, 'p1');
    expect(play(state, 'p1', first).ok).toBe(true);
    const before = structuredClone(state);

    expect(() => rules.executeAbility(state, {
      sourceCardId: EFFECT_ID,
      abilityId: 'effect-play-one-face-up',
      controllerId: 'p1',
      variables: {},
      selections: { selected_card: [effectTarget] },
    })).toThrow(/face-up card play limit reached/i);
    expect(state).toEqual(before);
  });
  it('rejects a loader-valid branch-contained trusted source play before any mutation', () => {
    const state = setup();
    const first = add(state, 'p1');
    const branchSource = add(state, 'p1');
    state.cards.find((candidate) => candidate.instanceId === branchSource)!.definitionId = BRANCH_SOURCE_PLAY_DEF;
    expect(play(state, 'p1', first).ok).toBe(true);
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);
    const before = structuredClone(state);

    expect(() => rules.executeAbility(state, {
      sourceCardId: branchSource,
      abilityId: 'branch-play-self-face-up',
      controllerId: 'p1',
      variables: {},
      selections: {},
    })).toThrow(/face-up card play limit reached/i);
    expect(state).toEqual(before);
  });
  it('preflights a cost-mutated branch on post-cost preview state before mutating the trusted caller', () => {
    const state = setup();
    const first = add(state, 'p1');
    const branchSource = add(state, 'p1');
    state.cards.find((candidate) => candidate.instanceId === branchSource)!.definitionId = COST_MUTATED_BRANCH_SOURCE_PLAY_DEF;
    state.players[0]!.mana = 3;
    expect(play(state, 'p1', first).ok).toBe(true);
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);
    const before = structuredClone(state);

    expect(() => rules.executeAbility(state, {
      sourceCardId: branchSource,
      abilityId: 'cost-mutated-branch-play-self-face-up',
      controllerId: 'p1',
      variables: {},
      selections: {},
    })).toThrow(/face-up card play limit reached/i);
    expect(state).toEqual(before);
  });

  it('rejects a required pending face-up selection before activation cost or pending-decision mutation', () => {
    const state = setup();
    const first = add(state, 'p1');
    add(state, 'p1');
    state.players[0]!.mana = 5;
    expect(rules.getLegalActions(state, 'p1')).toContainEqual(expect.objectContaining({
      type: 'activate_ability', cardInstanceId: EFFECT_ID, abilityId: 'pending-paid-effect-play-one-face-up',
    }));
    expect(play(state, 'p1', first).ok).toBe(true);
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);
    const before = structuredClone(state);

    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual(expect.objectContaining({
      type: 'activate_ability', cardInstanceId: EFFECT_ID, abilityId: 'pending-paid-effect-play-one-face-up',
    }));
    const denied = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'activate_ability', cardInstanceId: EFFECT_ID, abilityId: 'pending-paid-effect-play-one-face-up',
    });
    expect(denied.ok).toBe(false);
    expect(state).toEqual(before);

    const direct = structuredClone(state);
    expect(() => rules.executeAbility(direct, {
      sourceCardId: EFFECT_ID,
      abilityId: 'pending-paid-effect-play-one-face-up',
      controllerId: 'p1',
      variables: {},
      selections: {},
    })).toThrow(/face-up card play limit reached/i);
    expect(direct).toEqual(before);
  });
  it('counts a successful trusted source-card face-up effect before later play checks', () => {
    const state = setup();
    const sourcePlay = add(state, 'p1');
    state.cards.find((candidate) => candidate.instanceId === sourcePlay)!.definitionId = SOURCE_PLAY_DEF;
    const later = add(state, 'p1');

    expect(() => rules.executeAbility(state, {
      sourceCardId: sourcePlay,
      abilityId: 'play-self-face-up',
      controllerId: 'p1',
      variables: {},
      selections: {},
    })).not.toThrow();
    expect(state.cards.find((candidate) => candidate.instanceId === sourcePlay)!.zone).toBe('attack_area');
    expect(rules.faceUpCardsPlayedThisRound(state, 'p1')).toBe(1);
    const denied = play(state, 'p1', later);
    expect(denied.ok).toBe(false);
    expect(denied.rejection?.code).toBe('face_up_card_play_limit_reached');
  });

});
