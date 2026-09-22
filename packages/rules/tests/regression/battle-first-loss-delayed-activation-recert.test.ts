import { describe, expect, it } from 'vitest';

import {
  advanceAbilityPhase,
  applyBattleScoring,
  createMatchSession,
  processAbilityEvent,
  restoreMatchSession,
  resolveBattlefield,
} from '../../src/index';

const OLGA_PLAYER_ID = 'p4';
const ASTRONOMY_ID = 'master.olga-marie.skill.astronomical-science';
const ASTRONOMY_ABILITY_ID = 'astronomical-science.first-loss';
const TRISMEGISTUS_ID = 'master.olga-marie.skill.trismegistus-grief';

type Session = ReturnType<typeof createMatchSession>;

function activateAttack(session: Session, ownerPlayerId: string, definitionId = 'basic.strength.5'): void {
  const card = session.state.cards.find((candidate) =>
    candidate.ownerPlayerId === ownerPlayerId && ['hand', 'deck'].includes(candidate.zone));
  if (!card) throw new Error(`Missing attack fixture card for ${ownerPlayerId}`);
  card.definitionId = definitionId;
  card.zone = 'attack_area';
  card.visibility = { scope: 'public' };
  session.state.abilityRuntime!.cardState[card.instanceId] = {
    active: true,
    faceDown: false,
    playedRound: session.state.round.roundNumber,
  };
}

function prepareBattleSession(): { session: Session; astronomyInstanceId: string; trismegistusInstanceId: string } {
  const session = createMatchSession({ seed: 20260904, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
  const pairing = session.pairings.find((candidate) => candidate.playerId === OLGA_PLAYER_ID);
  expect(pairing?.master.id).toBe('master.olga-marie');

  session.state.round.activePhase = 'battle';
  session.state.eventPlacements = [];
  session.state.currentSituationModifiers = [];
  session.state.battleResults = [];
  session.battleHistory = [];
  session.logs = [];
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  session.state.abilityRuntime!.pendingPostBattleEvents = [];
  session.state.abilityRuntime!.pendingDelayedActivations = [];
  delete session.state.abilityRuntime!.pendingBattleTerminalEvent;
  delete session.state.abilityRuntime!.pendingDecision;

  const active = new Set(['p1', 'p2', 'p3', OLGA_PLAYER_ID]);
  for (const player of session.state.players) {
    player.status = active.has(player.id) ? 'active' : 'eliminated';
    player.vp = 0;
    player.militaryResult = 0;
    if (player.id === 'p1' || player.id === 'p2') player.locationId = 'miyama_town';
    else if (player.id === 'p3' || player.id === OLGA_PLAYER_ID) player.locationId = 'shinto';
    else delete player.locationId;
  }

  for (const card of session.state.cards) {
    if (card.zone === 'field' || card.zone === 'attack_area') {
      card.zone = 'discard';
      card.visibility = { scope: 'owner_only', ownerPlayerId: card.ownerPlayerId };
      if (session.state.abilityRuntime!.cardState[card.instanceId]) {
        session.state.abilityRuntime!.cardState[card.instanceId]!.active = false;
      }
    }
  }

  const astronomy = session.state.cards.find((card) =>
    card.ownerPlayerId === OLGA_PLAYER_ID && card.definitionId === ASTRONOMY_ID);
  const trismegistus = session.state.cards.find((card) =>
    card.ownerPlayerId === OLGA_PLAYER_ID && card.definitionId === TRISMEGISTUS_ID);
  expect(astronomy).toBeTruthy();
  expect(trismegistus).toBeTruthy();
  astronomy!.zone = 'skill';
  astronomy!.controllerPlayerId = OLGA_PLAYER_ID;
  astronomy!.visibility = { scope: 'owner_only', ownerPlayerId: OLGA_PLAYER_ID };
  trismegistus!.zone = 'skill';
  trismegistus!.controllerPlayerId = OLGA_PLAYER_ID;
  trismegistus!.visibility = { scope: 'owner_only', ownerPlayerId: OLGA_PLAYER_ID };
  session.state.abilityRuntime!.cardState[trismegistus!.instanceId] = {
    active: false,
    faceDown: false,
    playedRound: 0,
  };

  activateAttack(session, 'p2');
  activateAttack(session, 'p3');
  return {
    session,
    astronomyInstanceId: astronomy!.instanceId,
    trismegistusInstanceId: trismegistus!.instanceId,
  };
}

function resolveAndScoreTwoBattles(session: Session) {
  const resolvedBattles: typeof session.state.battleResults = [];
  for (const battlefieldId of ['miyama_town', 'shinto']) {
    const before = session.state.battleResults.length;
    Object.assign(session.state, resolveBattlefield(session.state, { battlefieldId, revealHiddenEvents: true }).nextState);
    if (session.state.battleResults.length > before) {
      resolvedBattles.push(structuredClone(session.state.battleResults.at(-1)!));
    }
  }
  expect(resolvedBattles).toHaveLength(2);
  const scoringLogStart = session.state.log.length;
  Object.assign(session.state, applyBattleScoring(session.state).nextState);
  return {
    resolvedBattles,
    freshScoringLogs: session.state.log.slice(scoringLogStart),
  };
}

function battleBridge(session: Session) {
  return session as unknown as {
    queuePostScoringBattleEvents(
      battles: typeof session.state.battleResults,
      freshScoringLogs: typeof session.state.log,
    ): void;
    flushPostScoringBattleEvents(): void;
  };
}

function activatedCount(session: Session): number {
  return session.state.abilityRuntime!.events.filter((entry) =>
    entry.type === 'card_activated' &&
    entry.playerId === OLGA_PLAYER_ID &&
    entry.abilityId === ASTRONOMY_ABILITY_ID).length;
}

describe('P3-B17 Olga first-loss ACTIVATE TO14 recertification', () => {
  it('stages exactly once only after both scoring receipts, keeps full first-loss provenance, and activates only at round_end', () => {
    const { session, astronomyInstanceId, trismegistusInstanceId } = prepareBattleSession();
    const { resolvedBattles, freshScoringLogs } = resolveAndScoreTwoBattles(session);
    const bridge = battleBridge(session);

    expect(freshScoringLogs.filter((entry) => entry.type === 'battle_scored').map((entry) => entry.payload?.battlefieldId))
      .toEqual(expect.arrayContaining(['miyama_town', 'shinto']));
    expect(session.state.cards.find((card) => card.instanceId === trismegistusInstanceId)?.zone).toBe('skill');
    expect(activatedCount(session)).toBe(0);

    bridge.queuePostScoringBattleEvents(resolvedBattles, freshScoringLogs);

    const queuedRestored = restoreMatchSession(session.serializeSession());
    expect(queuedRestored.state.abilityRuntime!.pendingPostBattleEvents).toEqual(session.state.abilityRuntime!.pendingPostBattleEvents);
    expect(queuedRestored.state.abilityRuntime!.pendingBattleTerminalEvent).toEqual(session.state.abilityRuntime!.pendingBattleTerminalEvent);

    const firstLoss = session.state.abilityRuntime!.pendingPostBattleEvents!.find((event) =>
      event.type === 'after_controller_first_loses_battle' && event.playerId === OLGA_PLAYER_ID);
    expect(firstLoss).toMatchObject({
      id: 'battle-phase:1:battle:shinto:2:result:first-loss:p4',
      type: 'after_controller_first_loses_battle',
      battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:shinto:2',
      resultId: 'battle-phase:1:battle:shinto:2:result',
      battleParticipantIds: expect.arrayContaining(['p3', OLGA_PLAYER_ID]),
      battlefieldId: 'shinto',
      playerId: OLGA_PLAYER_ID,
      lossOrdinal: 1,
    });
    expect(session.state.abilityRuntime!.pendingDelayedActivations).toHaveLength(0);
    expect(activatedCount(session)).toBe(0);

    bridge.flushPostScoringBattleEvents();

    const barrierIndex = session.logs.findIndex((entry) => entry.type === 'battle_post_scoring_barrier_open');
    const firstLossIndex = session.logs.findIndex((entry) =>
      entry.type === 'battle_first_loss_event_dispatched' && entry.payload?.playerId === OLGA_PLAYER_ID);
    const terminalIndex = session.logs.findIndex((entry) => entry.type === 'battle_terminal_event_dispatched');
    expect(barrierIndex).toBeGreaterThanOrEqual(0);
    expect(firstLossIndex).toBeGreaterThan(barrierIndex);
    expect(terminalIndex).toBeGreaterThan(firstLossIndex);
    expect(session.logs[barrierIndex]?.payload).toMatchObject({
      battlePhaseResolutionId: 'battle-phase:1',
      scoredBattlefieldIds: expect.arrayContaining(['miyama_town', 'shinto']),
    });
    expect(session.logs[firstLossIndex]?.payload).toMatchObject({
      battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:shinto:2',
      resultId: 'battle-phase:1:battle:shinto:2:result',
      battlefieldId: 'shinto',
      playerId: OLGA_PLAYER_ID,
    });
    expect(session.state.abilityRuntime!.pendingDelayedActivations).toEqual([
      expect.objectContaining({
        controllerId: OLGA_PLAYER_ID,
        sourceCardId: astronomyInstanceId,
        abilityId: ASTRONOMY_ABILITY_ID,
        definitionId: TRISMEGISTUS_ID,
        triggerEventId: firstLoss!.id,
        round: 1,
      }),
    ]);
    expect(session.state.cards.find((card) => card.instanceId === trismegistusInstanceId)?.zone).toBe('skill');
    expect(activatedCount(session)).toBe(0);

    const stagedSnapshot = JSON.stringify(session.state.abilityRuntime!.pendingDelayedActivations);
    processAbilityEvent(session.state, structuredClone(firstLoss!));
    expect(JSON.stringify(session.state.abilityRuntime!.pendingDelayedActivations)).toBe(stagedSnapshot);
    expect(activatedCount(session)).toBe(0);

    advanceAbilityPhase(session.state, 'round_end', 1);
    expect(session.state.abilityRuntime!.pendingDelayedActivations).toEqual([]);
    expect(session.state.cards.find((card) => card.instanceId === trismegistusInstanceId)).toMatchObject({
      zone: 'field',
      controllerPlayerId: OLGA_PLAYER_ID,
      visibility: { scope: 'public' },
    });
    expect(activatedCount(session)).toBe(1);

    advanceAbilityPhase(session.state, 'round_end', 1);
    expect(activatedCount(session)).toBe(1);
  });

  it('keeps the scoring-eliminated Olga eligible to stage her same-battle first-loss activation', () => {
    const { session, trismegistusInstanceId } = prepareBattleSession();
    session.state.players.find((player) => player.id === OLGA_PLAYER_ID)!.militaryResult = -7;
    const { resolvedBattles, freshScoringLogs } = resolveAndScoreTwoBattles(session);
    expect(session.state.players.find((player) => player.id === OLGA_PLAYER_ID)?.status).toBe('eliminated');

    const bridge = battleBridge(session);
    bridge.queuePostScoringBattleEvents(resolvedBattles, freshScoringLogs);
    bridge.flushPostScoringBattleEvents();

    expect(session.state.abilityRuntime!.pendingDelayedActivations).toHaveLength(1);
    expect(session.state.abilityRuntime!.pendingDelayedActivations[0]).toMatchObject({
      controllerId: OLGA_PLAYER_ID,
      abilityId: ASTRONOMY_ABILITY_ID,
      definitionId: TRISMEGISTUS_ID,
      round: 1,
    });
    expect(session.state.cards.find((card) => card.instanceId === trismegistusInstanceId)?.zone).toBe('skill');
    expect(activatedCount(session)).toBe(0);
  });

  it('fails missing-target round_end atomically after a valid authoritative first-loss stage', () => {
    const { session, trismegistusInstanceId } = prepareBattleSession();
    const { resolvedBattles, freshScoringLogs } = resolveAndScoreTwoBattles(session);
    const bridge = battleBridge(session);
    bridge.queuePostScoringBattleEvents(resolvedBattles, freshScoringLogs);
    bridge.flushPostScoringBattleEvents();
    expect(session.state.abilityRuntime!.pendingDelayedActivations).toHaveLength(1);

    session.state.cards = session.state.cards.filter((card) => card.instanceId !== trismegistusInstanceId);
    const before = structuredClone(session.state);
    expect(() => advanceAbilityPhase(session.state, 'round_end', 1)).toThrow(/Missing owned activation target/);
    expect(session.state).toEqual(before);
  });
});
