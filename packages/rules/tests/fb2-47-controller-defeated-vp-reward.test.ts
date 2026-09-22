import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityEvent, RuleNode } from '../src/ability/types';
import type { GameState } from '../src/schema/game';

const CARD_ID = 'test.fb2-47.source';
const REWARD_ABILITY_ID = 'test.fb2-47.defeat-reward';
const LOSS_ABILITY_ID = 'test.fb2-47.loss-transaction';

function rewardAbility(amount = 3): RuleNode {
  return {
    id: REWARD_ABILITY_ID,
    kind: 'forced_trigger',
    printedClause: 'synthetic identity-free FB2-47',
    activation: { trigger: rules.CONTROLLER_DEFEATED_TRIGGER },
    conditions: [{ type: 'event_player_is_controller' }],
    targets: [],
    effects: [{ type: 'adjust_victory_points', player: 'controller', amount }],
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

function lossAbility(): RuleNode {
  return {
    id: LOSS_ABILITY_ID,
    kind: 'forced_trigger',
    printedClause: 'synthetic FB2-46 companion',
    activation: { trigger: 'after_controller_loses_battle' },
    conditions: [{ type: 'event_player_is_controller' }],
    targets: [],
    effects: [{ type: rules.BATTLE_LOSS_VP_WINNER_REWARD_EFFECT, lossAmount: 2, winnerRewardAmount: 2 }],
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

function rewardCard(abilities: RuleNode[] = [rewardAbility()]) {
  return {
    id: CARD_ID,
    name: 'FB2-47 source',
    cardType: 'servant_skill',
    owner: { type: 'servant', id: 'test.fb2-47' },
    printedText: 'synthetic',
    cardFace: { typeLabel: '力量', attributes: ['力量'], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [],
    abilities,
  };
}

function archive(abilities: RuleNode[] = [rewardAbility()], extraCards: any[] = []) {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'servant_skill_card_archive',
    id: 'test.fb2-47',
    name: 'FB2-47 synthetic',
    class: 'Test',
    cards: [rewardCard(abilities), ...extraCards],
  };
}

function setup(abilities: RuleNode[] = [rewardAbility()], activeSeats: number[] = [1, 2, 3]): GameState {
  const pack = rules.loadAuthoringJson(archive(abilities));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats });
  state.cards = [];
  state.round.activePhase = 'battle';
  for (const player of state.players) player.locationId = 'miyama_town';
  rules.initializeAbilityRuntime(state, pack, { seed: 4701 });
  addRewardSource(state, 'p1');
  return state;
}

function addRewardSource(state: GameState, playerId: string): string {
  const instanceId = `fb2-47-source-${playerId}`;
  state.cards.push({
    instanceId,
    definitionId: CARD_ID,
    ownerPlayerId: playerId,
    controllerPlayerId: playerId,
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: playerId },
  });
  return instanceId;
}

function resultEvent(
  state: GameState,
  winners: string[] = ['p2'],
  losers: string[] = ['p1'],
  participants: string[] = [...winners, ...losers],
  battlefieldId = 'miyama_town',
  ordinal = 1,
): AbilityEvent {
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  const battleId = `${phaseId}:battle:${battlefieldId}:${ordinal}`;
  const resultId = `${battleId}:result`;
  return {
    id: resultId,
    type: 'after_battle_result_determined',
    battlePhaseResolutionId: phaseId,
    battleId,
    resultId,
    battlefieldId,
    battleParticipantIds: [...participants],
    battleResult: { winners: [...winners], loserIds: [...losers] },
  };
}

function defeatedEvent(state: GameState, playerId = 'p1'): AbilityEvent {
  const root = resultEvent(state);
  return {
    ...root,
    id: `${root.resultId}:defeat:${playerId}`,
    type: rules.CONTROLLER_DEFEATED_TRIGGER,
    playerId,
  };
}

function rootFromBattleResult(state: GameState, result: GameState['battleResults'][number], ordinal = 1): AbilityEvent {
  const participants = result.participantBreakdowns.map((participant) => participant.playerId);
  const suppressed = new Set(result.lossEffectSuppressedPlayerIds ?? []);
  const losers = participants.filter((playerId) => !result.winnerPlayerIds.includes(playerId) && !suppressed.has(playerId));
  return resultEvent(state, [...result.winnerPlayerIds], losers, participants, result.battlefieldId, ordinal);
}

function gatewayReport(rawAbility: RuleNode) {
  return rules.loadAuthoringJson(archive([rawAbility])).report;
}

function expectGatewayReject(rawAbility: RuleNode): void {
  expect(gatewayReport(rawAbility)).toEqual(expect.arrayContaining([
    expect.objectContaining({
      abilityId: REWARD_ABILITY_ID,
      path: 'controllerDefeatedVpReward.gateway',
      status: 'unsupported',
    }),
  ]));
}

describe('P3-FB2-47 controller-defeated fixed VP reward', () => {
  it('admits only the exact identity-free authoring and compiled envelope', () => {
    expect(rules.isControllerDefeatedVpRewardCandidate(rewardAbility())).toBe(true);
    expect(rules.isAcceptedControllerDefeatedVpRewardAbility(rewardAbility(), 'authoring')).toBe(true);

    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report).toEqual([]);
    const compiled = loaded.cards[CARD_ID]!.abilities[0]!;
    expect(compiled.execution.mode).toBe('automatic');
    expect(rules.isAcceptedControllerDefeatedVpRewardAbility(compiled, 'compiled')).toBe(true);
    expect(rules.controllerDefeatedVpRewardAmount(compiled)).toBe(3);

    const explicitEmptyMarkers = structuredClone(rewardAbility());
    explicitEmptyMarkers.markers = [];
    expect(rules.isAcceptedControllerDefeatedVpRewardAbility(explicitEmptyMarkers, 'authoring')).toBe(true);
    expect(gatewayReport(explicitEmptyMarkers)).toEqual([]);
  });

  it('fails closed through one gateway for widened envelopes, raw containers, markers and non-fixed amounts', () => {
    const malformed: RuleNode[] = [];

    const activationPayload = structuredClone(rewardAbility());
    (activationPayload.activation as RuleNode).phase = 'battle';
    malformed.push(activationPayload);

    const extraCondition = structuredClone(rewardAbility());
    (extraCondition.conditions as RuleNode[]).push({ type: 'source_active' });
    malformed.push(extraCondition);

    const extraEffect = structuredClone(rewardAbility());
    (extraEffect.effects as RuleNode[]).push({ type: 'noop' });
    malformed.push(extraEffect);

    const extraEffectKey = structuredClone(rewardAbility());
    (extraEffectKey.effects as RuleNode[])[0]!.extra = true;
    malformed.push(extraEffectKey);

    const wrongEffect = structuredClone(rewardAbility());
    wrongEffect.effects = [{ type: 'adjust_mana', player: 'controller', amount: 3 }];
    malformed.push(wrongEffect);

    const wrongPlayer = structuredClone(rewardAbility());
    (wrongPlayer.effects as RuleNode[])[0]!.player = 'opponent';
    malformed.push(wrongPlayer);

    const extraTopLevelKey = structuredClone(rewardAbility());
    extraTopLevelKey.unexpectedSemanticPayload = true;
    malformed.push(extraTopLevelKey);

    const scalarMarkers = structuredClone(rewardAbility());
    scalarMarkers.markers = 'bad-scalar';
    malformed.push(scalarMarkers);

    const trueNameMarkers = structuredClone(rewardAbility());
    trueNameMarkers.markers = ['真名解放'];
    malformed.push(trueNameMarkers);

    const declaredAuthority = structuredClone(rewardAbility());
    (declaredAuthority.execution as RuleNode).hostOps = ['adjust-victory-points'];
    malformed.push(declaredAuthority);

    for (const [field, value] of [
      ['conditions', {}], ['conditions', 'bad'],
      ['targets', {}], ['targets', 'bad'],
      ['cost', {}], ['cost', 'bad'],
      ['creates', {}], ['creates', 'bad'],
      ['ruleModifiers', {}], ['ruleModifiers', 'bad'],
      ['lifecycle', []], ['lifecycle', 'bad'],
      ['responseWindow', []], ['responseWindow', 'bad'],
      ['limit', []], ['limit', 'bad'],
      ['visibility', []], ['visibility', 'bad'],
    ] as const) {
      const changed = structuredClone(rewardAbility());
      changed[field] = value;
      malformed.push(changed);
    }

    for (const value of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '3', null, { op: 'const', value: 3 }]) {
      const changed = structuredClone(rewardAbility());
      (changed.effects as RuleNode[])[0]!.amount = value;
      malformed.push(changed);
    }

    const nestedTrigger = structuredClone(rewardAbility());
    (nestedTrigger.activation as RuleNode).trigger = 'after_controller_wins_battle';
    nestedTrigger.creates = [{ type: 'noop', trigger: rules.CONTROLLER_DEFEATED_TRIGGER }];
    malformed.push(nestedTrigger);

    for (const raw of malformed) expectGatewayReject(raw);

    const historicalRaw = structuredClone(rewardAbility());
    historicalRaw.activation = {};
    historicalRaw.conditions = [
      { type: 'event_type_is', eventType: 'player.defeated' },
      { type: 'event_player_is_controller' },
    ];
    const historicalReport = rules.loadAuthoringJson(archive([historicalRaw])).report;
    expect(historicalReport).toEqual(expect.arrayContaining([
      expect.objectContaining({ abilityId: REWARD_ABILITY_ID, status: 'unsupported', path: expect.stringContaining('conditions') }),
    ]));
  });

  it('derives one trusted defeated fact from the root result and grants the fixed reward once', () => {
    const state = setup();
    state.players[0]!.vp = 5;
    rules.processAbilityEvent(state, resultEvent(state));

    expect(state.players[0]!.vp).toBe(8);
    expect(state.players[1]!.vp).toBe(0);
    const rewardEvents = state.abilityRuntime!.events.filter((event) =>
      event.abilityId === REWARD_ABILITY_ID && event.type === 'victory_points_adjusted');
    expect(rewardEvents).toEqual([
      expect.objectContaining({
        playerId: 'p1', delta: 3, requestedDelta: 3, before: 5, after: 8,
        triggerEventId: 'battle-phase:1:battle:miyama_town:1:result:defeat:p1',
        battlePhaseResolutionId: 'battle-phase:1', battleId: 'battle-phase:1:battle:miyama_town:1',
        resultId: 'battle-phase:1:battle:miyama_town:1:result', battlefieldId: 'miyama_town',
      }),
    ]);
    expect(state.abilityRuntime!.processedEvents).toContain('battle-phase:1:battle:miyama_town:1:result:defeat:p1');
  });

  it('routes multiple actual losers only to their own controller sources', () => {
    const state = setup();
    addRewardSource(state, 'p3');
    state.players[0]!.vp = 1;
    state.players[1]!.vp = 2;
    state.players[2]!.vp = 4;

    rules.processAbilityEvent(state, resultEvent(state, ['p2'], ['p1', 'p3'], ['p1', 'p2', 'p3']));
    expect(state.players.slice(0, 3).map((player) => player.vp)).toEqual([4, 2, 7]);
    expect(state.abilityRuntime!.events.filter((event) => event.abilityId === REWARD_ABILITY_ID && event.type === 'victory_points_adjusted'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ playerId: 'p1', triggerEventId: expect.stringContaining(':defeat:p1') }),
        expect.objectContaining({ playerId: 'p3', triggerEventId: expect.stringContaining(':defeat:p3') }),
      ]));
  });

  it('does not invent defeat for a winner, nonparticipant or loss-suppressed participant', () => {
    const winner = setup();
    winner.players[0]!.vp = 4;
    rules.processAbilityEvent(winner, resultEvent(winner, ['p1'], ['p2'], ['p1', 'p2']));
    expect(winner.players[0]!.vp).toBe(4);

    const suppressed = setup();
    suppressed.players[0]!.vp = 4;
    rules.processAbilityEvent(suppressed, resultEvent(suppressed, ['p2'], [], ['p1', 'p2']));
    expect(suppressed.players[0]!.vp).toBe(4);
    expect(suppressed.abilityRuntime!.processedEvents.some((id) => id.endsWith(':defeat:p1'))).toBe(false);

    const nonparticipant = setup();
    nonparticipant.players[0]!.vp = 4;
    rules.processAbilityEvent(nonparticipant, resultEvent(nonparticipant, ['p2'], ['p3'], ['p2', 'p3']));
    expect(nonparticipant.players[0]!.vp).toBe(4);
  });

  it('validates server-derived provenance and rejects standalone or malformed defeated facts', () => {
    const state = setup();
    const root = resultEvent(state);
    const valid = defeatedEvent(state);
    expect(rules.trustedControllerDefeatedFacts(state, 'p1', valid)).toBeUndefined();
    rules.processAbilityEvent(state, root);
    expect(rules.trustedControllerDefeatedFacts(state, 'p1', valid)).toEqual({
      battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:miyama_town:1',
      resultId: 'battle-phase:1:battle:miyama_town:1:result',
      battlefieldId: 'miyama_town',
    });

    const mutations: Array<(event: AbilityEvent) => void> = [
      (event) => { event.type = 'after_controller_loses_battle'; },
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
      (event) => { event.battleResult = { winners: [], loserIds: ['p1'] }; },
      (event) => { event.battleResult = { winners: ['p2', 'p2'], loserIds: ['p1'] }; },
      (event) => { event.battleResult = { winners: ['p3'], loserIds: ['p1'] }; },
      (event) => { event.battleResult = { winners: ['p2'], loserIds: ['p2', 'p1'] }; },
      (event) => { event.battleResult = { winners: ['p2'], loserIds: ['p3'] }; },
      (event) => { event.battleResult = { winners: ['p1'], loserIds: ['p2'] }; },
      (event) => { event.id = 'wrong-defeat-id'; },
    ];
    for (const mutate of mutations) {
      const malformed = structuredClone(valid);
      mutate(malformed);
      expect(rules.trustedControllerDefeatedFacts(state, 'p1', malformed)).toBeUndefined();
    }

    const standalone = setup();
    const forged = defeatedEvent(standalone);
    const before = JSON.stringify(standalone);
    expect(() => rules.processAbilityEvent(standalone, forged)).toThrow('trusted actual-defeat provenance');
    expect(JSON.stringify(standalone)).toBe(before);
  });

  it('rejects a contradictory defeated fact that reuses an already processed root result id', () => {
    const state = setup();
    state.players[0]!.vp = 4;
    const authoritativeRoot = resultEvent(state, ['p1'], ['p2'], ['p1', 'p2']);
    rules.processAbilityEvent(state, authoritativeRoot);
    expect(state.players[0]!.vp).toBe(4);

    const forged = {
      ...authoritativeRoot,
      id: `${authoritativeRoot.resultId}:defeat:p1`,
      type: rules.CONTROLLER_DEFEATED_TRIGGER,
      playerId: 'p1',
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    } satisfies AbilityEvent;

    expect(rules.trustedControllerDefeatedFacts(state, 'p1', forged)).toBeUndefined();
    const before = JSON.stringify(state);
    expect(() => rules.processAbilityEvent(state, forged)).toThrow('trusted actual-defeat provenance');
    expect(JSON.stringify(state)).toBe(before);
    expect(state.players[0]!.vp).toBe(4);
  });

  it('settles defeat reward before FB2-46 loss so zero starting VP still enables winner reward', () => {
    const state = setup([rewardAbility(), lossAbility()], [1, 2]);
    state.players[0]!.vp = 0;
    state.players[1]!.vp = 1;

    rules.processAbilityEvent(state, resultEvent(state, ['p2'], ['p1'], ['p1', 'p2']));
    expect(state.players[0]!.vp).toBe(1);
    expect(state.players[1]!.vp).toBe(3);

    const adjustments = state.abilityRuntime!.events.filter((event) => event.type === 'victory_points_adjusted');
    const defeatIndex = adjustments.findIndex((event) => event.abilityId === REWARD_ABILITY_ID);
    const lossIndex = adjustments.findIndex((event) => event.abilityId === LOSS_ABILITY_ID && event.playerId === 'p1');
    const winnerIndex = adjustments.findIndex((event) => event.abilityId === LOSS_ABILITY_ID && event.playerId === 'p2');
    expect(defeatIndex).toBeGreaterThanOrEqual(0);
    expect(lossIndex).toBeGreaterThan(defeatIndex);
    expect(winnerIndex).toBeGreaterThan(lossIndex);
    expect(adjustments[defeatIndex]).toMatchObject({ before: 0, after: 3, delta: 3, triggerEventId: expect.stringContaining(':defeat:p1') });
    expect(adjustments[lossIndex]).toMatchObject({ before: 3, after: 1, delta: -2, triggerEventId: expect.stringContaining(':lose:p1') });
    expect(adjustments[winnerIndex]).toMatchObject({ before: 1, after: 3, delta: 2, triggerEventId: expect.stringContaining(':lose:p1') });
  });

  it('bridges ordinary battle loss and Basic Luck suppression through the real resolver result', () => {
    const ordinary = setup([rewardAbility()], [1, 2]);
    ordinary.players[0]!.locationId = 'shinto';
    ordinary.players[1]!.locationId = 'shinto';
    ordinary.players[0]!.vp = 2;
    const ordinarySettled = rules.resolveBattlefield(ordinary, {
      battlefieldId: 'shinto',
      participants: [{ playerId: 'p1', totalPower: 2 }, { playerId: 'p2', totalPower: 5 }],
    }).nextState;
    const ordinaryResult = ordinarySettled.battleResults.at(-1)!;
    expect(ordinaryResult.winnerPlayerIds).toEqual(['p2']);
    rules.processAbilityEvent(ordinarySettled, rootFromBattleResult(ordinarySettled, ordinaryResult));
    expect(ordinarySettled.players[0]!.vp).toBe(5);

    const protectedState = setup([rewardAbility()], [1, 2]);
    protectedState.players[0]!.locationId = 'shinto';
    protectedState.players[1]!.locationId = 'shinto';
    protectedState.players[0]!.vp = 2;
    protectedState.cards.push({
      instanceId: 'p1-luck', definitionId: 'basic.luck', ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'attack_area', visibility: { scope: 'public' },
    });
    protectedState.abilityRuntime!.cardState['p1-luck'] = { active: true, faceDown: false, playedRound: protectedState.round.roundNumber };
    const protectedSettled = rules.resolveBattlefield(protectedState, {
      battlefieldId: 'shinto',
      participants: [{ playerId: 'p1', totalPower: 2 }, { playerId: 'p2', totalPower: 5 }],
    }).nextState;
    const protectedResult = protectedSettled.battleResults.at(-1)!;
    expect(protectedResult.lossEffectSuppressedPlayerIds).toContain('p1');
    rules.processAbilityEvent(protectedSettled, rootFromBattleResult(protectedSettled, protectedResult));
    expect(protectedSettled.players[0]!.vp).toBe(2);
    expect(protectedSettled.abilityRuntime!.processedEvents.some((id) => id.endsWith(':defeat:p1'))).toBe(false);
  });

  it('bridges the accepted FB2-45 pre-battle defeat settlement to the same defeated fact', () => {
    const preBattleCard = {
      id: 'fixture.fb2-47.prebattle',
      name: 'Pre-battle defeat source',
      cardType: 'servant_skill',
      cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [{
        id: 'prebattle-defeat-action', kind: 'phase_action', printedClause: 'synthetic FB2-45',
        activation: { phase: 'action', opens: 'controller_action_window' },
        conditions: [{ type: 'source_active' }], targets: [],
        effects: [{ type: 'defeat_player', target: { scope: 'engaged_opponents', where: [{ type: 'no_attack_played_this_round_with_attribute', attribute: '迅捷' }] } }],
        cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic' },
      }],
    };
    const raw = archive([rewardAbility()], [preBattleCard]);
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    let state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    state.players[0]!.locationId = 'shinto';
    state.players[1]!.locationId = 'shinto';
    state.players[1]!.vp = 0;
    rules.initializeAbilityRuntime(state, pack, { seed: 4702 });
    state.cards.push({
      instanceId: 'prebattle-source', definitionId: 'fixture.fb2-47.prebattle', ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'attack_area', visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState['prebattle-source'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    addRewardSource(state, 'p2');
    const action = rules.getLegalActions(state, 'p1').find((candidate) =>
      candidate.type === 'activate_ability' && candidate.cardInstanceId === 'prebattle-source' && candidate.abilityId === 'prebattle-defeat-action')!;
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', action).ok).toBe(true);
    expect(state.abilityRuntime!.pendingPreBattleDefeats).toEqual([
      expect.objectContaining({ targetPlayerIds: ['p2'] }),
    ]);

    state.round.activePhase = 'battle';
    state = rules.resolveBattlefield(state, {
      battlefieldId: 'shinto',
      participants: [{ playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 10 }],
    }).nextState;
    const result = state.battleResults.at(-1)!;
    expect(result.excludedPlayerIds).toContain('p2');
    expect(result.winnerPlayerIds).toEqual(['p1']);
    rules.processAbilityEvent(state, rootFromBattleResult(state, result));
    expect(state.players[1]!.vp).toBe(3);
    expect(state.abilityRuntime!.processedEvents).toContain('battle-phase:1:battle:shinto:1:result:defeat:p2');
  });

  it('bridges accepted Presence Concealment settlement to the same defeated fact', () => {
    const raw = JSON.parse(readFileSync('data/authoring/servants/servant.corday.json', 'utf8'));
    raw.cards.push(rewardCard());
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    let state = createSeededGameState({ activeSeats: [1, 2, 3] });
    state.cards = [];
    state.round.activePhase = 'battle';
    state.round.prioritySeat = 1;
    for (const player of state.players.slice(0, 3)) player.locationId = 'shinto';
    state.players[0]!.servantCardId = 'servant.corday';
    rules.initializeAbilityRuntime(state, pack, { seed: 4703 });
    const cordayId = 'servant.corday.skill.sc-corday-1';
    state.cards.push({
      instanceId: 'corday-presence', definitionId: cordayId, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'attack_area', visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState['corday-presence'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    addRewardSource(state, 'p2');
    addRewardSource(state, 'p3');

    state = rules.resolveBattlefield(state, {
      battlefieldId: 'shinto',
      participants: [{ playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 10 }, { playerId: 'p3', totalPower: 10 }],
    }).nextState;
    const response = rules.getLegalActions(state, 'p1').find((candidate) =>
      candidate.type === 'resolve_response' && candidate.cardInstanceId === 'corday-presence')!;
    expect(response).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', response).ok).toBe(true);
    state = rules.resolveBattlefield(state, {
      battlefieldId: 'shinto',
      participants: [{ playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 10 }, { playerId: 'p3', totalPower: 10 }],
    }).nextState;
    const result = state.battleResults.at(-1)!;
    expect(result.presenceConcealmentDefeatedPlayerIds).toEqual(['p2', 'p3']);
    expect(result.winnerPlayerIds).toEqual(['p1']);
    rules.processAbilityEvent(state, rootFromBattleResult(state, result));
    expect(state.players[1]!.vp).toBe(3);
    expect(state.players[2]!.vp).toBe(3);
  });

  it('is idempotent at the root and derived event boundaries', () => {
    const state = setup();
    const root = resultEvent(state);
    rules.processAbilityEvent(state, root);
    const once = JSON.stringify({
      vp: state.players.map((player) => player.vp),
      events: state.abilityRuntime!.events,
      processed: state.abilityRuntime!.processedEvents,
    });
    rules.processAbilityEvent(state, root);
    rules.processAbilityEvent(state, defeatedEvent(state));
    const twice = JSON.stringify({
      vp: state.players.map((player) => player.vp),
      events: state.abilityRuntime!.events,
      processed: state.abilityRuntime!.processedEvents,
    });
    expect(twice).toBe(once);
  });
});
