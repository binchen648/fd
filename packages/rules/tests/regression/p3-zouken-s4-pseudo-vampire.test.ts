import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { buildBattleTerminalEvent } from '../../src/ability/battle-terminal';
import type { AbilityDefinitionPack, AbilityEvent } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import generatedContent from '../../../../data/generated/fd-playtest-v1.content-library.json';

const S4 = 'master.zouken.skill.s4';
const SOURCE = 'p1-master.zouken.skill.s4';
const ROUND = 'zouken.pseudo-vampire.round-end';
const BATTLE = 'zouken.pseudo-vampire.battle-end';
const MOVE = 'zouken.pseudo-vampire.bug-body';

function generatedPack(): AbilityDefinitionPack {
  return JSON.parse(readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8')).rules;
}

function setup(): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{ instanceId: SOURCE, definitionId: S4, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } }];
  state.players[0]!.masterCardId = 'master.zouken';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  rules.initializeAbilityRuntime(state, generatedPack(), { seed: 20261029 });
  state.abilityRuntime!.cardState[SOURCE] = { active: true, faceDown: false, playedRound: 1 };
  return state;
}

function appendAuthoritativeBattle(state: GameState): { event: AbilityEvent; battleId: string; resultId: string } {
  const battleId = 'battle-phase:1:battle:miyama_town:1';
  const resultId = `${battleId}:result`;
  const battle = {
    battlefieldId: 'miyama_town', winnerPlayerIds: ['p1'], tied: false, winnerPlayerId: 'p1', margin: 1, vpReward: 1,
    militaryAdjustments: [{ playerId: 'p2', delta: -1 }],
    participantBreakdowns: [
      { playerId: 'p1', basePower: 3, totalModifier: 0, effectivePower: 3, modifiers: [] },
      { playerId: 'p2', basePower: 1, totalModifier: 0, effectivePower: 1, modifiers: [] },
    ],
  };
  state.battleResults = [battle];
  state.scoringBreakdown = structuredClone(battle.participantBreakdowns);
  const receipt = {
    battlePhaseResolutionId: 'battle-phase:1', battleId, resultId, battlefieldId: 'miyama_town',
    battleParticipantIds: ['p1', 'p2'], winnerPlayerIds: ['p1'], loserIds: ['p2'],
    scoringParticipantIds: ['p1', 'p2'], scoringWinnerPlayerIds: ['p1'], battleOrdinal: 1,
  };
  state.abilityRuntime!.canonicalBattleScoringReceipts = { [resultId]: receipt };
  state.abilityRuntime!.processedEvents.push(resultId);
  state.log.push({ type: 'battle_scored', message: resultId, payload: { ...receipt } });
  state.log.push({ type: 'battle_scored_canonical', message: resultId, payload: { ...receipt } });
  const event: AbilityEvent = buildBattleTerminalEvent({
    battlePhaseResolutionId: 'battle-phase:1', battleIds: [battleId], resultIds: [resultId],
    scoringReceiptIds: ['battle-phase:1:score:miyama_town'], battleParticipantIds: ['p1', 'p2'],
    battleOutcomes: [{ battlefieldId: 'miyama_town', winnerPlayerIds: ['p1'] }],
  });
  return { event, battleId, resultId };
}

function realSevenPlayerS4Session(): ReturnType<typeof rules.createMatchSession> {
  const session = rules.createMatchSession({ seed: 20261029, humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
  const state = session.state;
  state.eventPlacements = [];
  state.currentSituationModifiers = [];
  for (const entry of state.players) {
    entry.locationId = ['p1', 'p2'].includes(entry.id) ? 'miyama_town' : ['p3', 'p4'].includes(entry.id) ? 'shinto' : 'recon';
    entry.vp = 0;
    entry.militaryResult = 0;
  }
  state.players[0]!.masterCardId = 'master.zouken';
  state.players[0]!.mana = 4;
  state.players[1]!.mana = 5;
  state.cards.push({
    instanceId: SOURCE,
    definitionId: S4,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState[SOURCE] = { active: true, faceDown: false, playedRound: 1 };
  for (const [playerId, definitionId] of [
    ['p1', 'basic.strength.5'], ['p3', 'basic.strength.5'],
    ['p2', 'basic.strength.2'], ['p4', 'basic.strength.2'],
  ] as const) {
    const attack = state.cards.find((card) => card.ownerPlayerId === playerId && ['hand', 'deck'].includes(card.zone));
    if (!attack) throw new Error(`Missing attack fixture card for ${playerId}`);
    attack.definitionId = definitionId;
    attack.zone = 'attack_area';
    attack.visibility = { scope: 'public' };
    state.abilityRuntime!.cardState[attack.instanceId] = { active: true, faceDown: false, playedRound: 1 };
  }
  state.round.activePhase = 'battle';
  return session;
}

describe('P3 Zouken s4 pseudo-vampire current-line contract', () => {
  it('is present in generated content and the live seven-player MatchSession', () => {
    expect(generatedContent.rules.cards[S4]).toBeDefined();
    const session = rules.createMatchSession({ seed: 20260904, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    expect(session.state.abilityRuntime!.pack.cards[S4]).toEqual(generatedContent.rules.cards[S4]);
    expect(session.rawCards.get(S4)).toEqual(generatedContent.rules.cards[S4]);
    expect(session.state.abilityRuntime!.pack.cards[S4]!.abilities.map((ability) => ability.id)).toEqual([ROUND, BATTLE, MOVE]);
  });

  it('loads the exact three source-bound clauses and rejects widened movement', () => {
    const state = setup();
    const abilities = state.abilityRuntime!.pack.cards[S4]!.abilities;
    expect(abilities.map((ability) => ability.id)).toEqual([ROUND, BATTLE, MOVE]);
    expect(abilities.every((ability) => rules.isZoukenS4Semantic(ability))).toBe(true);
    const widened = structuredClone(abilities[2]!);
    widened.cost[0]!.amount = 6;
    expect(rules.isZoukenS4MoveSemantic(widened)).toBe(false);
  });

  it('reads the authoritative round mana ledger, settles once, and restores the marker', () => {
    const state = setup();
    state.players[0]!.vp = 5;
    state.abilityRuntime!.manaGainedThisRound = { round: 1, byPlayer: { p1: 2 } };
    rules.processAbilityEvent(state, { id: 'phase-1', type: 'round_end' });
    expect(state.players[0]!.vp).toBe(3);
    const replay = structuredClone(state);
    rules.processAbilityEvent(replay, { id: 'phase-2', type: 'round_end' });
    expect(replay.players[0]!.vp).toBe(3);
    expect(replay.abilityRuntime!.events.filter((event) => event.type === 'zouken_s4_round_vp_loss_settled')).toHaveLength(1);
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(replay)).toBe(true);
  });

  it('transfers at most three mana from the authoritative true loser and is phase-idempotent', () => {
    const state = setup();
    const { event } = appendAuthoritativeBattle(state);
    state.players[0]!.mana = 4;
    state.players[1]!.mana = 5;
    rules.processAbilityEvent(state, event);
    expect(state.players[0]!.mana).toBe(7);
    expect(state.players[1]!.mana).toBe(2);
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'zouken_s4_battle_mana_settled', sourcePlayerId: 'p2', targetPlayerId: 'p1', delta: 3, resultId: 'battle-phase:1:battle:miyama_town:1:result' }),
    ]));
    rules.processAbilityEvent(state, event);
    expect(state.players[0]!.mana).toBe(7);
    expect(state.players[1]!.mana).toBe(2);
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(structuredClone(state))).toBe(true);
  });

  it('settles a real seven-player multi-battle terminal from per-battle receipts after scoring clears battleResults', () => {
    const session = realSevenPlayerS4Session();
    const state = session.state;
    (session as unknown as { resolveBattlePhase: () => void }).resolveBattlePhase();

    expect(state.battleResults).toEqual([]);
    const receipts = Object.values(state.abilityRuntime!.canonicalBattleScoringReceipts ?? {});
    expect(receipts.map((receipt) => receipt.battleId)).toEqual([
      'battle-phase:1:battle:miyama_town:1',
      'battle-phase:1:battle:shinto:2',
    ]);
    expect(receipts.map((receipt) => receipt.winnerPlayerIds)).toEqual([['p1'], ['p3']]);
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'zouken_s4_battle_mana_settled', playerId: 'p1', sourcePlayerId: 'p2', battleId: 'battle-phase:1:battle:miyama_town:1' }),
    ]));
    expect(state.abilityRuntime!.events.filter((event) => event.type === 'zouken_s4_battle_mana_settled')).toHaveLength(1);
    expect(state.players.find((player) => player.id === 'p1')!.mana).toBe(7);
    expect(state.players.find((player) => player.id === 'p2')!.mana).toBe(2);

    const restored = rules.restoreMatchSession(session.serializeSession());
    expect(restored.state.battleResults).toEqual([]);
    expect(restored.state.abilityRuntime!.events.filter((event) => event.type === 'zouken_s4_battle_mana_settled')).toHaveLength(1);
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(restored.state)).toBe(true);

    const forged = session.serializeSession();
    const firstResultId = receipts[0]!.resultId;
    forged.state.abilityRuntime!.canonicalBattleScoringReceipts![firstResultId]!.winnerPlayerIds = ['p2'];
    expect(() => rules.restoreMatchSession(forged)).toThrow(/Invalid deferred ability runtime provenance/);
  });

  it('uses the fixed three-mana fallback when at recon or no legal loser exists', () => {
    const state = setup();
    const { event } = appendAuthoritativeBattle(state);
    state.players[0]!.locationId = 'recon';
    state.players[0]!.mana = 4;
    state.players[1]!.mana = 5;
    rules.processAbilityEvent(state, event);
    expect(state.players[0]!.mana).toBe(7);
    expect(state.players[1]!.mana).toBe(5);
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'zouken_s4_battle_mana_settled', targetPlayerId: 'p1', requestedDelta: 3, qualifyingPlayerIds: [] }),
    ]));
  });

  it('rejects forged winner, participant, or missing receipt before transfer', () => {
    const forgedState = setup();
    const { event } = appendAuthoritativeBattle(forgedState);
    forgedState.players[0]!.mana = 4;
    forgedState.players[1]!.mana = 5;
    const forgedWinner = structuredClone(event);
    forgedWinner.battleOutcomes = [{ battlefieldId: 'miyama_town', winnerPlayerIds: ['p2'] }];
    expect(() => rules.processAbilityEvent(forgedState, forgedWinner)).toThrow();
    expect(forgedState.players[0]!.mana).toBe(4);
    expect(forgedState.players[1]!.mana).toBe(5);
    const forgedParticipants = structuredClone(event);
    forgedParticipants.battleParticipantIds = ['p1'];
    expect(() => rules.processAbilityEvent(forgedState, forgedParticipants)).toThrow();
    expect(forgedState.players[0]!.mana).toBe(4);
    const missingReceipt = setup();
    missingReceipt.battleResults = structuredClone(forgedState.battleResults);
    missingReceipt.players[0]!.mana = 4;
    expect(() => rules.processAbilityEvent(missingReceipt, event)).toThrow();
    expect(missingReceipt.players[0]!.mana).toBe(4);
  });

  it('validates movement before payment, pays exactly seven, and rolls back stale targets', () => {
    const state = setup();
    state.round.activePhase = 'battle';
    state.round.prioritySeat = 1;
    state.players[0]!.mana = 8;
    const action = rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'activate_ability' && candidate.abilityId === MOVE);
    expect(action?.type).toBe('activate_ability');
    if (!action || action.type !== 'activate_ability') return;
    expect(rules.dispatchAbilityCommand(state, 'p1', action).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(8);
    const pending = state.abilityRuntime!.pendingDecision!;
    const destination = pending.candidates.find((candidate) => candidate !== 'miyama_town')!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [destination] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(1);
    expect(state.players[0]!.locationId).toBe(destination);
    const paid = state.abilityRuntime!.events.findIndex((event) => event.type === 'mana_paid');
    const resolved = state.abilityRuntime!.events.findIndex((event) => event.type === 'effect_resolved' && event.abilityId === MOVE);
    expect(paid).toBeGreaterThanOrEqual(0);
    expect(resolved).toBeGreaterThan(paid);
    const stale = setup();
    stale.round.activePhase = 'battle'; stale.round.prioritySeat = 1; stale.players[0]!.mana = 8;
    const staleAction = rules.getLegalActions(stale, 'p1').find((candidate) => candidate.type === 'activate_ability' && candidate.abilityId === MOVE)!;
    rules.dispatchAbilityCommand(stale, 'p1', staleAction);
    const staleDecision = stale.abilityRuntime!.pendingDecision!;
    const staleDestination = staleDecision.candidates.find((candidate) => candidate !== 'miyama_town')!;
    stale.map.locations.find((location) => location.id === staleDestination)!.enabledByDefault = false;
    stale.locationConfig.enabledLocationIds = stale.locationConfig.enabledLocationIds.filter((location) => location !== staleDestination);
    const before = stale.players[0]!.mana;
    const rejected = rules.dispatchAbilityCommand(stale, 'p1', { type: 'choose_target', decisionId: staleDecision.id, selectedIds: [staleDestination] });
    expect(rejected.ok).toBe(false);
    expect(stale.players[0]!.mana).toBe(before);
  });
});
