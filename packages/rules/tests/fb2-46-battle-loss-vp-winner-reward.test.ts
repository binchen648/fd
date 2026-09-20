import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityEvent, RuleNode } from '../src/ability/types';
import type { GameState } from '../src/schema/game';

const CARD_ID = 'test.fb2-46.source';
const ABILITY_ID = 'test.fb2-46.reward';
const EFFECT_TYPE = rules.BATTLE_LOSS_VP_WINNER_REWARD_EFFECT;

function ability(): RuleNode {
  return {
    id: ABILITY_ID,
    kind: 'forced_trigger',
    printedClause: 'synthetic identity-free FB2-46',
    activation: { trigger: 'after_controller_loses_battle' },
    conditions: [{ type: 'event_player_is_controller' }],
    targets: [],
    effects: [{ type: EFFECT_TYPE, lossAmount: 2, winnerRewardAmount: 2 }],
    cost: [],
    creates: [],
    ruleModifiers: [],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic' },
  };
}

function archive(rawAbility: RuleNode = ability()) {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'servant_skill_card_archive',
    id: 'test.fb2-46',
    name: 'FB2-46 synthetic',
    class: 'Test',
    cards: [{
      id: CARD_ID,
      name: 'FB2-46 source',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: 'test.fb2-46' },
      printedText: 'synthetic',
      cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [rawAbility],
    }],
  };
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.round.activePhase = 'battle';
  state.players[0]!.vp = 5;
  state.players[1]!.vp = 1;
  state.players[2]!.vp = 4;
  state.cards = [{
    instanceId: 'fb2-46-source',
    definitionId: CARD_ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  rules.initializeAbilityRuntime(state, pack, { seed: 4601 });
  return state;
}

function resultEvent(
  state: GameState,
  winners: string[] = ['p2'],
  losers: string[] = ['p1'],
  participants: string[] = [...winners, ...losers],
): AbilityEvent {
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  const battleId = `${phaseId}:battle:miyama_town:1`;
  const resultId = `${battleId}:result`;
  return {
    id: resultId,
    type: 'after_battle_result_determined',
    battlePhaseResolutionId: phaseId,
    battleId,
    resultId,
    battlefieldId: 'miyama_town',
    battleParticipantIds: [...new Set(participants)],
    battleResult: { winners, loserIds: losers },
  };
}

function lossEvent(state: GameState): AbilityEvent {
  const root = resultEvent(state);
  return {
    ...root,
    id: `${root.resultId}:lose:p1`,
    type: 'after_controller_loses_battle',
    playerId: 'p1',
  };
}

function gatewayReport(rawAbility: RuleNode) {
  return rules.loadAuthoringJson(archive(rawAbility)).report;
}

function expectGatewayReject(rawAbility: RuleNode): void {
  expect(gatewayReport(rawAbility)).toEqual(expect.arrayContaining([
    expect.objectContaining({
      abilityId: ABILITY_ID,
      path: 'battleLossVpWinnerReward.gateway',
      status: 'unsupported',
    }),
  ]));
}

describe('P3-FB2-46 battle-loss VP then same-result winners reward', () => {
  it('admits only the exact dedicated identity-free authoring and compiled envelope', () => {
    expect(rules.isBattleLossVpWinnerRewardCandidate(ability())).toBe(true);
    expect(rules.isAcceptedBattleLossVpWinnerRewardAbility(ability(), 'authoring')).toBe(true);

    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report).toEqual([]);
    const compiled = loaded.cards[CARD_ID]!.abilities[0]!;
    expect(compiled.execution.mode).toBe('automatic');
    expect(rules.isAcceptedBattleLossVpWinnerRewardAbility(compiled, 'compiled')).toBe(true);
    expect(rules.battleLossVpWinnerRewardAmounts(compiled)).toEqual({ lossAmount: 2, winnerRewardAmount: 2 });
  });

  it('fails closed through one gateway for malformed envelopes, containers, amounts, and forbidden raw vocabulary', () => {
    const malformed: RuleNode[] = [];

    const wrongTrigger = structuredClone(ability());
    (wrongTrigger.activation as RuleNode).trigger = 'after_controller_wins_battle';
    malformed.push(wrongTrigger);

    const extraCondition = structuredClone(ability());
    (extraCondition.conditions as RuleNode[]).push({ type: 'source_active' });
    malformed.push(extraCondition);

    const extraEffect = structuredClone(ability());
    (extraEffect.effects as RuleNode[]).push({ type: 'noop' });
    malformed.push(extraEffect);

    const extraEffectKey = structuredClone(ability());
    (extraEffectKey.effects as RuleNode[])[0]!.extra = true;
    malformed.push(extraEffectKey);

    const extraTopLevelKey = structuredClone(ability());
    extraTopLevelKey.unexpectedSemanticPayload = true;
    malformed.push(extraTopLevelKey);

    for (const [field, value] of [
      ['targets', {}], ['targets', 'bad'],
      ['cost', {}], ['cost', 'bad'],
      ['creates', {}], ['creates', 'bad'],
      ['ruleModifiers', {}], ['ruleModifiers', 'bad'],
      ['lifecycle', []], ['lifecycle', 'bad'],
      ['responseWindow', []], ['responseWindow', 'bad'],
      ['limit', []], ['limit', 'bad'],
      ['visibility', []], ['visibility', 'bad'],
    ] as const) {
      const changed = structuredClone(ability());
      changed[field] = value;
      malformed.push(changed);
    }

    for (const value of [0, -1, 1.5, '2', null]) {
      const loss = structuredClone(ability());
      (loss.effects as RuleNode[])[0]!.lossAmount = value;
      malformed.push(loss);
      const reward = structuredClone(ability());
      (reward.effects as RuleNode[])[0]!.winnerRewardAmount = value;
      malformed.push(reward);
    }

    const rawHistorical = structuredClone(ability());
    rawHistorical.effects = [{
      type: 'lose_victory_points',
      amount: 2,
      thenIfAnyLost: [{
        type: 'gain_victory_points',
        target: { scope: 'event_combat_winners' },
        amount: 2,
      }],
    }];
    malformed.push(rawHistorical);

    const forbiddenNested = structuredClone(ability());
    forbiddenNested.effects = [{ type: 'noop' }];
    forbiddenNested.creates = [{ type: EFFECT_TYPE, lossAmount: 2, winnerRewardAmount: 2 }];
    malformed.push(forbiddenNested);

    for (const raw of malformed) expectGatewayReject(raw);
  });

  it('deducts exactly two VP from the losing controller and rewards the same frozen battle winner by two', () => {
    const state = setup();
    rules.processAbilityEvent(state, resultEvent(state));

    expect(state.players[0]!.vp).toBe(3);
    expect(state.players[1]!.vp).toBe(3);
    expect(state.players[2]!.vp).toBe(4);

    const events = state.abilityRuntime!.events.filter((event) => event.abilityId === ABILITY_ID && event.type === 'victory_points_adjusted');
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      playerId: 'p1', resource: 'victory_points', delta: -2, requestedDelta: -2, before: 5, after: 3,
      battlePhaseResolutionId: 'battle-phase:1', battleId: 'battle-phase:1:battle:miyama_town:1',
      resultId: 'battle-phase:1:battle:miyama_town:1:result', battlefieldId: 'miyama_town',
    });
    expect(events[1]).toMatchObject({ playerId: 'p2', delta: 2, requestedDelta: 2, before: 1, after: 3 });
    expect(events.every((event) => event.triggerEventId === 'battle-phase:1:battle:miyama_town:1:result:lose:p1')).toBe(true);
  });

  it('uses actual loss only as the reward gate: 1 -> 0 still gives the fixed reward, while 0 -> 0 gives none', () => {
    const one = setup();
    one.players[0]!.vp = 1;
    rules.processAbilityEvent(one, resultEvent(one));
    expect(one.players[0]!.vp).toBe(0);
    expect(one.players[1]!.vp).toBe(3);
    expect(one.abilityRuntime!.events.filter((event) => event.abilityId === ABILITY_ID && event.type === 'victory_points_adjusted')).toEqual([
      expect.objectContaining({ playerId: 'p1', delta: -1, requestedDelta: -2, before: 1, after: 0 }),
      expect.objectContaining({ playerId: 'p2', delta: 2, requestedDelta: 2, before: 1, after: 3 }),
    ]);

    const zero = setup();
    zero.players[0]!.vp = 0;
    rules.processAbilityEvent(zero, resultEvent(zero));
    expect(zero.players[0]!.vp).toBe(0);
    expect(zero.players[1]!.vp).toBe(1);
    expect(zero.abilityRuntime!.events.filter((event) => event.abilityId === ABILITY_ID && event.type === 'victory_points_adjusted')).toEqual([
      expect.objectContaining({ playerId: 'p1', delta: 0, requestedDelta: -2, before: 0, after: 0 }),
    ]);
  });

  it('rewards every shared winner once and never rewards another losing participant', () => {
    const state = setup();
    state.players[1]!.vp = 7;
    state.players[2]!.vp = 9;
    rules.processAbilityEvent(state, resultEvent(state, ['p2', 'p3'], ['p1'], ['p1', 'p2', 'p3']));
    expect(state.players.slice(0, 3).map((player) => player.vp)).toEqual([3, 9, 11]);

    const anotherLoser = setup();
    anotherLoser.players[2]!.vp = 9;
    rules.processAbilityEvent(anotherLoser, resultEvent(anotherLoser, ['p2'], ['p1', 'p3'], ['p1', 'p2', 'p3']));
    expect(anotherLoser.players.slice(0, 3).map((player) => player.vp)).toEqual([3, 3, 9]);
  });

  it('validates exact server-owned loss-event provenance and rejects malformed battle facts', () => {
    const state = setup();
    const valid = lossEvent(state);
    expect(rules.trustedBattleLossVpWinnerRewardFacts(state, 'p1', valid)).toEqual({
      winnerPlayerIds: ['p2'],
      battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:miyama_town:1',
      resultId: 'battle-phase:1:battle:miyama_town:1:result',
      battlefieldId: 'miyama_town',
    });

    const mutations: Array<(event: AbilityEvent) => void> = [
      (event) => { event.type = 'after_controller_wins_battle'; },
      (event) => { event.playerId = 'p2'; },
      (event) => { delete event.battlePhaseResolutionId; },
      (event) => { event.battlePhaseResolutionId = 'battle-phase:2'; },
      (event) => { delete event.battleId; },
      (event) => { event.battleId = 'battle-phase:1:battle:miyama_town:0'; },
      (event) => { delete event.resultId; },
      (event) => { event.resultId = 'wrong-result'; },
      (event) => { delete event.battlefieldId; },
      (event) => { event.battlefieldId = 'magic_workshop'; },
      (event) => { event.battleParticipantIds = ['p1', 'p1']; },
      (event) => { event.battleParticipantIds = ['p1', 'p2', 'p3']; },
      (event) => { event.battleResult = { winners: [], loserIds: ['p1'] }; },
      (event) => { event.battleResult = { winners: ['p2', 'p2'], loserIds: ['p1'] }; },
      (event) => { event.battleResult = { winners: ['p3'], loserIds: ['p1'] }; },
      (event) => { event.battleResult = { winners: ['p2'], loserIds: ['p2', 'p1'] }; },
      (event) => { event.battleResult = { winners: ['p2'], loserIds: ['p3'] }; },
      (event) => { event.battleResult = { winners: ['p1'], loserIds: ['p2'] }; },
      (event) => { event.id = 'wrong-loss-id'; },
    ];

    for (const mutate of mutations) {
      const malformed = structuredClone(valid);
      mutate(malformed);
      expect(rules.trustedBattleLossVpWinnerRewardFacts(state, 'p1', malformed)).toBeUndefined();
    }
  });

  it('fails malformed provenance atomically when the matching trigger reaches the dedicated transaction', () => {
    const state = setup();
    const malformed = lossEvent(state);
    delete malformed.resultId;
    const before = JSON.stringify(state);
    expect(() => rules.processAbilityEvent(state, malformed)).toThrow('trusted same-battle result provenance');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('is idempotent at the authoritative event boundary', () => {
    const state = setup();
    const event = resultEvent(state);
    rules.processAbilityEvent(state, event);
    const once = JSON.stringify({
      vp: state.players.map((player) => player.vp),
      events: state.abilityRuntime!.events,
      processed: state.abilityRuntime!.processedEvents,
    });
    rules.processAbilityEvent(state, event);
    const twice = JSON.stringify({
      vp: state.players.map((player) => player.vp),
      events: state.abilityRuntime!.events,
      processed: state.abilityRuntime!.processedEvents,
    });
    expect(twice).toBe(once);
  });

  it('respects the existing effect-prevention barrier without paying either side of the transaction', () => {
    const state = setup();
    state.abilityRuntime!.preventEffects = true;
    rules.processAbilityEvent(state, resultEvent(state));
    expect(state.players.slice(0, 3).map((player) => player.vp)).toEqual([5, 1, 4]);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_prevented', playerId: 'p1', sourceCardId: 'fb2-46-source', abilityId: ABILITY_ID,
    }));
  });
});
