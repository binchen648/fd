import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { AuthoringAbility } from '../../src/ability/types';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.achilles.json', 'utf8'));
const CARD_ID = 'servant.achilles.skill.sc-achilles-1';
const ABILITY_ID = 'sc-achilles-1.achilles-heel';
const SOURCE_ID = 'b16-achilles-skill';

function synthetic(): AuthoringAbility {
  return {
    id: 'synthetic.battle-loss-reveal',
    kind: 'forced_trigger',
    printedClause: 'synthetic',
    activation: { trigger: 'after_controller_loses_battle' },
    conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    effects: [{ type: 'reveal_information', scope: 'servant_package', subject: 'controller.servant' }],
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function manualState() {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'battle';
  state.players[0]!.servantCardId = raw.id;
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), { seed: 1616 });
  state.cards.push({
    instanceId: SOURCE_ID,
    definitionId: CARD_ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  state.abilityRuntime!.cardState[SOURCE_ID] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function lossEvent(id = 'battle-phase:1:battle:miyama_town:1:loss:p1') {
  return {
    id,
    type: 'after_controller_loses_battle' as const,
    playerId: 'p1',
    battlePhaseResolutionId: 'battle-phase:1',
    battleId: 'battle-phase:1:battle:miyama_town:1',
    resultId: 'battle-phase:1:battle:miyama_town:1:result',
    battlefieldId: 'miyama_town',
    battleParticipantIds: ['p1', 'p2'],
    battleResult: { winners: ['p2'], loserIds: ['p1'] },
  };
}

function activateAttack(session: ReturnType<typeof rules.createMatchSession>, ownerPlayerId: string, definitionId = 'basic.strength.5'): void {
  const card = session.state.cards.find((candidate) => candidate.ownerPlayerId === ownerPlayerId && ['hand', 'deck'].includes(candidate.zone));
  if (!card) throw new Error(`Missing attack fixture card for ${ownerPlayerId}`);
  card.definitionId = definitionId;
  card.zone = 'attack_area';
  card.visibility = { scope: 'public' };
  session.state.abilityRuntime!.cardState[card.instanceId] = { active: true, faceDown: false, playedRound: session.state.round.roundNumber };
}

function productionSession() {
  const session = rules.createMatchSession({ seed: 20260904, humanPlayerId: 'p3', humanPlayerIds: ['p3'] });
  const achillesId = session.pairings.find((pairing) => pairing.servant.id === 'servant.achilles')?.playerId;
  if (!achillesId) throw new Error('Production fixture must contain servant.achilles');
  const opponentId = session.state.players.find((player) => player.id !== achillesId)?.id;
  if (!opponentId) throw new Error('Production fixture requires an Achilles opponent');
  session.state.round.activePhase = 'battle';
  session.state.eventPlacements = [];
  session.state.currentSituationModifiers = [];
  session.state.battleResults = [];
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  session.state.abilityRuntime!.pendingPostBattleEvents = [];
  session.state.abilityRuntime!.revealedServants = session.state.abilityRuntime!.revealedServants.filter((id) => id !== achillesId);
  delete session.state.abilityRuntime!.pendingDecision;
  const active = new Set([achillesId, opponentId]);
  for (const player of session.state.players) {
    player.status = active.has(player.id) ? 'active' : 'eliminated';
    player.vp = 0;
    player.militaryResult = 0;
    if (active.has(player.id)) player.locationId = 'shinto';
    else delete player.locationId;
  }
  for (const card of session.state.cards) {
    if (card.zone === 'field' || card.zone === 'attack_area') {
      card.zone = 'discard';
      card.visibility = { scope: 'owner_only', ownerPlayerId: card.ownerPlayerId };
      if (session.state.abilityRuntime!.cardState[card.instanceId]) session.state.abilityRuntime!.cardState[card.instanceId]!.active = false;
    }
  }
  expect(session.state.cards.some((card) => card.ownerPlayerId === achillesId && card.definitionId === CARD_ID)).toBe(true);
  activateAttack(session, opponentId);
  return { session, achillesId, opponentId };
}

function resolveProductionBattle(session: ReturnType<typeof rules.createMatchSession>): void {
  (session as unknown as { resolveBattlePhase: () => void }).resolveBattlePhase();
}

describe('P3-B16 battle-loss servant reveal', () => {
  it('classifies only the identity-free forced loss reveal shape', () => {
    const classify = (rules as unknown as { isBattleLossServantRevealSemantic?: (ability: AuthoringAbility) => boolean }).isBattleLossServantRevealSemantic;
    expect(typeof classify).toBe('function');
    const ability = synthetic();
    expect(classify!(ability)).toBe(true);
    const renamed = structuredClone(ability); renamed.id = 'renamed-loss-reveal';
    expect(classify!(renamed)).toBe(true);
    const wrongTrigger = structuredClone(ability); wrongTrigger.activation.trigger = 'after_controller_wins_battle';
    expect(classify!(wrongTrigger)).toBe(false);
    const wrongScope = structuredClone(ability); (wrongScope.effects[0] as any).scope = 'event';
    expect(classify!(wrongScope)).toBe(false);
    const wrongSubject = structuredClone(ability); (wrongSubject.effects[0] as any).subject = 'target.servant';
    expect(classify!(wrongSubject)).toBe(false);
    const extra = structuredClone(ability); extra.conditions.push({ type: 'controller_won_battle' });
    expect(classify!(extra)).toBe(false);
  });

  it('routes the loss reveal through typed dataflow with stable reveal evidence and dedupes replay', () => {
    const state = manualState();
    const event = lossEvent();
    rules.processAbilityEvent(state, event as any);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'servant_package_revealed',
      playerId: 'p1',
      sourceCardId: SOURCE_ID,
      abilityId: ABILITY_ID,
      resultId: expect.any(String),
    }));
    const revealEvents = () => state.abilityRuntime!.events.filter((entry) => entry.type === 'servant_package_revealed' && entry.playerId === 'p1');
    expect(revealEvents()).toHaveLength(1);
    const snapshot = JSON.stringify(state);
    rules.processAbilityEvent(state, event as any);
    expect(JSON.stringify(state)).toBe(snapshot);
    expect(revealEvents()).toHaveLength(1);
  });

  it('supports an idempotent typed servant-package reveal primitive without duplicating events', () => {
    const state = manualState();
    const effect = { id: 'b16-reveal', type: 'reveal_servant_package' } as any;
    const first = rules.executeResolution({
      state,
      controllerId: 'p1',
      sourceCardId: SOURCE_ID,
      abilityId: ABILITY_ID,
      effects: [effect],
      resolutionId: 'b16-reveal-resolution-1',
      causationId: 'b16-loss-1',
    });
    expect(first.results[0]).toMatchObject({ effectType: 'reveal_servant_package', status: 'applied', payload: { revealedCount: 1 } });
    expect(first.emittedEvents).toContainEqual(expect.objectContaining({ type: 'servant_package_revealed', playerId: 'p1' }));

    const second = rules.executeResolution({
      state: first.nextState,
      controllerId: 'p1',
      sourceCardId: SOURCE_ID,
      abilityId: ABILITY_ID,
      effects: [effect],
      resolutionId: 'b16-reveal-resolution-2',
      causationId: 'b16-loss-2',
    });
    expect(second.results[0]).toMatchObject({ effectType: 'reveal_servant_package', status: 'no_op', payload: { revealedCount: 0 } });
    expect(second.emittedEvents).toHaveLength(0);
  });

  it('fails malformed same-family reveal semantics closed without mutating caller state', () => {
    for (const mutate of [
      (ability: AuthoringAbility) => { (ability.effects[0] as any).scope = 'event'; },
      (ability: AuthoringAbility) => { (ability.effects[0] as any).subject = 'target.servant'; },
    ]) {
      const state = manualState();
      const ability = state.abilityRuntime!.pack.cards[CARD_ID]!.abilities.find((candidate) => candidate.id === ABILITY_ID)!;
      mutate(ability);
      const before = JSON.stringify(state);
      expect(() => rules.processAbilityEvent(state, lossEvent(`b16-malformed-${Math.random()}`) as any)).toThrow();
      expect(JSON.stringify(state)).toBe(before);
    }

    const conditioned = manualState();
    conditioned.abilityRuntime!.pack.cards[CARD_ID]!.abilities.find((candidate) => candidate.id === ABILITY_ID)!.conditions.push({ type: 'controller_won_battle' });
    rules.processAbilityEvent(conditioned, lossEvent('b16-extra-condition') as any);
    expect(conditioned.abilityRuntime!.revealedServants).not.toContain('p1');
    expect(conditioned.abilityRuntime!.events.some((entry) => entry.type === 'servant_package_revealed')).toBe(false);
  });

  it('rejects a mismatched source/controller atomically in typed Visibility', () => {
    const state = manualState();
    const before = JSON.stringify(state);
    expect(() => rules.executeResolution({
      state,
      controllerId: 'p2',
      sourceCardId: SOURCE_ID,
      abilityId: ABILITY_ID,
      effects: [{ id: 'b16-wrong-controller', type: 'reveal_servant_package' } as any],
      resolutionId: 'b16-wrong-controller-resolution',
      causationId: 'b16-wrong-controller-causation',
    })).toThrow();
    expect(JSON.stringify(state)).toBe(before);
  });

  it('reveals Achilles only after a real post-scoring loss and keeps the loss trigger before phase-terminal work', () => {
    const { session, achillesId } = productionSession();
    expect(session.state.abilityRuntime!.revealedServants).not.toContain(achillesId);
    resolveProductionBattle(session);

    expect(session.state.abilityRuntime!.revealedServants).toContain(achillesId);
    const revealEvent = session.state.abilityRuntime!.events.find((entry) => entry.type === 'servant_package_revealed' && entry.playerId === achillesId);
    expect(revealEvent).toMatchObject({ sourceCardId: expect.any(String), abilityId: ABILITY_ID, resultId: expect.any(String) });
    const barrierIndex = session.logs.findIndex((entry) => entry.type === 'battle_post_scoring_barrier_open');
    const resultIndex = session.logs.findIndex((entry) => entry.type === 'battle_result_event_dispatched' && entry.payload?.battlefieldId === 'shinto');
    const terminalIndex = session.logs.findIndex((entry) => entry.type === 'battle_terminal_event_dispatched');
    expect(barrierIndex).toBeGreaterThanOrEqual(0);
    expect(resultIndex).toBeGreaterThan(barrierIndex);
    expect(terminalIndex).toBeGreaterThan(resultIndex);
  });

  it('does not reveal Achilles when he wins instead of losing', () => {
    const { session, achillesId, opponentId } = productionSession();
    activateAttack(session, achillesId, 'basic.strength.5');
    const opponentAttack = session.state.cards.find((card) => card.ownerPlayerId === opponentId && card.zone === 'attack_area')!;
    opponentAttack.definitionId = 'basic.strength.2';
    resolveProductionBattle(session);
    expect(session.state.abilityRuntime!.revealedServants).not.toContain(achillesId);
    expect(session.state.abilityRuntime!.events.some((entry) => entry.type === 'servant_package_revealed' && entry.playerId === achillesId)).toBe(false);
  });

  it('preserves frozen loss-trigger eligibility when scoring eliminates Achilles and does not duplicate on re-entry', () => {
    const { session, achillesId } = productionSession();
    session.state.players.find((player) => player.id === achillesId)!.militaryResult = -7;
    resolveProductionBattle(session);
    expect(session.state.players.find((player) => player.id === achillesId)?.status).toBe('eliminated');
    expect(session.state.abilityRuntime!.revealedServants).toContain(achillesId);
    const count = () => session.state.abilityRuntime!.events.filter((entry) => entry.type === 'servant_package_revealed' && entry.playerId === achillesId).length;
    expect(count()).toBe(1);
    session.state.round.activePhase = 'battle';
    resolveProductionBattle(session);
    expect(count()).toBe(1);
  });
});
