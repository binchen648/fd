import { describe, expect, it } from 'vitest';

import { createMatchSession } from '../../src/match-session';
import {
  advanceAbilityPhase,
  getLegalActions,
  isActivateCardByIdTrigger,
  processAbilityEvent,
} from '../../src/ability/interpreter';
import type { AuthoringAbility } from '../../src/ability/types';

function prepareOlga(session: ReturnType<typeof createMatchSession>) {
  const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.olga-marie')!;
  expect(pairing).toBeTruthy();
  const astronomy = session.state.cards.find((card) =>
    card.controllerPlayerId === pairing.playerId && card.definitionId === 'master.olga-marie.skill.astronomical-science')!;
  let trismegistus = session.state.cards.find((card) =>
    card.ownerPlayerId === pairing.playerId && card.definitionId === 'master.olga-marie.skill.trismegistus-grief');
  if (!trismegistus) {
    trismegistus = {
      instanceId: `${pairing.playerId}-master.olga-marie.skill.trismegistus-grief`,
      definitionId: 'master.olga-marie.skill.trismegistus-grief',
      ownerPlayerId: pairing.playerId,
      controllerPlayerId: pairing.playerId,
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: pairing.playerId },
    };
    session.state.cards.push(trismegistus);
  }
  expect(astronomy).toBeTruthy();
  astronomy.zone = 'skill';
  trismegistus.zone = 'skill';
  trismegistus.controllerPlayerId = pairing.playerId;
  trismegistus.visibility = { scope: 'owner_only', ownerPlayerId: pairing.playerId };
  session.state.abilityRuntime!.cardState[trismegistus.instanceId] = {
    active: false,
    faceDown: false,
    playedRound: session.state.round.roundNumber,
  };
  session.state.abilityRuntime!.pendingDelayedActivations = [];
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;
  return { playerId: pairing.playerId, astronomy, trismegistus };
}

function firstLoss(session: ReturnType<typeof createMatchSession>, playerId: string): void {
  processAbilityEvent(session.state, {
    id: `fixture-first-loss-${playerId}`,
    type: 'after_controller_first_loses_battle',
    playerId,
    battlefieldId: 'miyama_town',
    lossOrdinal: 1,
  });
}

describe('CARD_ACTION_SEMANTICS_MINIMAL_ACTIVATE recovery', () => {
  it('stages Olga first-loss and activates Trismegistus only on formal round_end', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, astronomy, trismegistus } = prepareOlga(session);

    expect(getLegalActions(session.state, playerId)).not.toContainEqual(expect.objectContaining({
      type: 'play_card',
      cardInstanceId: trismegistus.instanceId,
    }));

    firstLoss(session, playerId);

    expect(trismegistus).toMatchObject({
      zone: 'skill',
      controllerPlayerId: playerId,
    });
    expect(session.state.abilityRuntime!.pendingDelayedActivations).toEqual([
      expect.objectContaining({
        controllerId: playerId,
        sourceCardId: astronomy.instanceId,
        abilityId: 'astronomical-science.first-loss',
        definitionId: 'master.olga-marie.skill.trismegistus-grief',
        round: session.state.round.roundNumber,
      }),
    ]);
    expect(session.state.abilityRuntime!.events).not.toContainEqual(expect.objectContaining({ type: 'card_activated' }));

    advanceAbilityPhase(session.state, 'round_end', session.state.round.roundNumber);

    const activatedTrismegistus = session.state.cards.find((card) => card.instanceId === trismegistus.instanceId)!;
    expect(activatedTrismegistus).toMatchObject({
      zone: 'field',
      controllerPlayerId: playerId,
      visibility: { scope: 'public' },
    });
    expect(session.state.abilityRuntime!.cardState[trismegistus.instanceId]).toMatchObject({
      active: true,
      faceDown: false,
    });
    expect(session.state.abilityRuntime!.pendingDelayedActivations).toEqual([]);
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'card_activated',
      playerId,
      sourceCardId: astronomy.instanceId,
      abilityId: 'astronomical-science.first-loss',
    }));
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved',
      playerId,
      sourceCardId: astronomy.instanceId,
      abilityId: 'astronomical-science.first-loss',
      resultId: expect.any(String),
    }));
  });

  it('fails closed at round_end and preserves the staged state when the target leaves skill', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, trismegistus } = prepareOlga(session);
    firstLoss(session, playerId);
    const currentTrismegistus = session.state.cards.find((card) => card.instanceId === trismegistus.instanceId)!;
    currentTrismegistus.zone = 'hand';
    currentTrismegistus.visibility = { scope: 'owner_only', ownerPlayerId: playerId };
    const beforeRevision = session.state.abilityRuntime!.revision;
    const beforeEvents = structuredClone(session.state.abilityRuntime!.events);

    expect(() => advanceAbilityPhase(session.state, 'round_end', session.state.round.roundNumber)).toThrow(/must be in skill/);

    expect(session.state.round.activePhase).not.toBe('round_end');
    expect(session.state.abilityRuntime!.revision).toBe(beforeRevision);
    expect(session.state.abilityRuntime!.events).toEqual(beforeEvents);
    expect(session.state.abilityRuntime!.pendingDelayedActivations).toHaveLength(1);
    expect(currentTrismegistus).toMatchObject({ zone: 'hand', controllerPlayerId: playerId });
  });

  it('does not duplicate the same delayed activation within one round', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId } = prepareOlga(session);
    firstLoss(session, playerId);
    processAbilityEvent(session.state, {
      id: `fixture-second-first-loss-${playerId}`,
      type: 'after_controller_first_loses_battle',
      playerId,
      battlefieldId: 'miyama_town',
      lossOrdinal: 1,
    });
    expect(session.state.abilityRuntime!.pendingDelayedActivations).toHaveLength(1);
  });

  it('rejects malformed first-loss events without staging delayed activation', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId } = prepareOlga(session);
    const before = structuredClone(session.state);

    expect(() => processAbilityEvent(session.state, {
      id: `fixture-malformed-first-loss-${playerId}`,
      type: 'after_controller_first_loses_battle',
      playerId,
    })).toThrow(/authoritative battle identity and first-loss ordinal/);

    expect(session.state).toEqual(before);
  });

  it('fails closed when activation target definition is ambiguous', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, trismegistus } = prepareOlga(session);
    firstLoss(session, playerId);
    session.state.cards.push({
      ...structuredClone(trismegistus),
      instanceId: `${trismegistus.instanceId}-duplicate`,
    });
    const before = structuredClone(session.state);

    expect(() => advanceAbilityPhase(session.state, 'round_end', session.state.round.roundNumber)).toThrow(/ambiguous/);

    expect(session.state).toEqual(before);
  });

  it('fails closed when the owned activation target is controlled by another player', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, trismegistus } = prepareOlga(session);
    firstLoss(session, playerId);
    const authoritativeTarget = session.state.cards.find((card) => card.instanceId === trismegistus.instanceId)!;
    authoritativeTarget.controllerPlayerId = session.state.players.find((candidate) => candidate.id !== playerId)!.id;
    const before = structuredClone(session.state);

    expect(() => advanceAbilityPhase(session.state, 'round_end', session.state.round.roundNumber)).toThrow(/controlled by another player/);

    expect(session.state).toEqual(before);
  });

  it('queues authoritative first-loss once from MatchSession battle history behind the post-scoring barrier', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId } = prepareOlga(session);
    const firstBattle = {
      battlefieldId: 'miyama_town',
      winnerPlayerIds: ['p1'],
      militaryAdjustments: [{ playerId, delta: -3 }],
    } as (typeof session.state.battleResults)[number];
    const secondBattle = {
      battlefieldId: 'shinto',
      winnerPlayerIds: ['p2'],
      militaryAdjustments: [{ playerId, delta: -2 }],
    } as (typeof session.state.battleResults)[number];
    const bridge = session as unknown as {
      queuePostScoringBattleEvents(
        battles: typeof session.state.battleResults,
        freshScoringLogs: typeof session.state.log,
      ): void;
    };

    bridge.queuePostScoringBattleEvents([firstBattle], [{
      type: 'battle_scored',
      message: 'scored:miyama_town',
      payload: { battlefieldId: 'miyama_town' },
    }]);
    expect(session.state.abilityRuntime!.pendingDelayedActivations).toHaveLength(0);
    expect(session.state.abilityRuntime!.pendingPostBattleEvents?.filter((event) =>
      event.type === 'after_controller_first_loses_battle' && event.playerId === playerId)).toHaveLength(1);

    bridge.queuePostScoringBattleEvents([secondBattle], [{
      type: 'battle_scored',
      message: 'scored:shinto',
      payload: { battlefieldId: 'shinto' },
    }]);
    expect(session.state.abilityRuntime!.pendingPostBattleEvents?.filter((event) =>
      event.type === 'after_controller_first_loses_battle' && event.playerId === playerId)).toHaveLength(1);
  });
  it('classifies the exact activation semantic shape without card or ability ids', () => {
    const activation: AuthoringAbility = {
      id: 'renamed-delayed-activation',
      kind: 'forced_trigger',
      printedClause: '',
      activation: { trigger: 'after_controller_first_loses_battle' },
      conditions: [],
      targets: [],
      effects: [{ type: 'activate_card_by_id', definitionId: 'fixture.skill.delayed' }],
      cost: [],
      ruleModifiers: [],
      creates: [],
      lifecycle: {},
      responseWindow: {},
      limit: {},
      visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    };
    const wrongTrigger = structuredClone(activation);
    wrongTrigger.activation.trigger = 'round_end';
    const withTarget = structuredClone(activation);
    withTarget.targets = [{ id: 'target', type: 'player' }];
    const wrongEffect = structuredClone(activation);
    wrongEffect.effects = [{ type: 'noop', reason: 'not activate' }];

    expect(isActivateCardByIdTrigger(activation)).toBe(true);
    expect(isActivateCardByIdTrigger(wrongTrigger)).toBe(false);
    expect(isActivateCardByIdTrigger(withTarget)).toBe(false);
    expect(isActivateCardByIdTrigger(wrongEffect)).toBe(false);
  });
});
