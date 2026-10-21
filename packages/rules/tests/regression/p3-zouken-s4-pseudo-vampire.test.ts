import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ACTIVE_ARCHIVE_PATH = 'data/authoring/masters/master.zouken.json';
const S4_ID = 'master.zouken.skill.s4';
const S4_INSTANCE_ID = 'p1-master.zouken.skill.s4';

function setup(): { state: GameState; pack: ReturnType<typeof rules.loadAuthoringJson> } {
  const pack = rules.loadAuthoringJson(JSON.parse(readFileSync(ACTIVE_ARCHIVE_PATH, 'utf8')));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.masterCardId = 'master.zouken';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'shinto';
  state.cards.push({
    instanceId: S4_INSTANCE_ID, definitionId: S4_ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field',
    visibility: { scope: 'public' },
  });
  rules.initializeAbilityRuntime(state, pack, { seed: 20261022 });
  state.abilityRuntime!.cardState[S4_INSTANCE_ID] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return { state, pack };
}

function terminalEvent(withLoser = true): rules.AbilityEvent {
  return {
    id: 'battle-phase:1:after_battle_ended', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:1',
    battleIds: ['battle-phase:1:battle:miyama_town:1'], resultIds: ['battle-phase:1:battle:miyama_town:1:result'],
    scoringReceiptIds: ['battle-phase:1:score:miyama_town'], battleParticipantIds: withLoser ? ['p1', 'p2'] : ['p1'],
    battleOutcomes: [{ battlefieldId: 'miyama_town', winnerPlayerIds: ['p1'] }],
  };
}

function appendBattleResult(state: GameState, withLoser = true): void {
  state.battleResults = [{
    battlefieldId: 'miyama_town', winnerPlayerIds: ['p1'], tied: false, winnerPlayerId: 'p1', margin: 1, vpReward: 1,
    militaryAdjustments: withLoser ? [{ playerId: 'p2', delta: -1 }] : [],
    participantBreakdowns: withLoser ? [
      { playerId: 'p1', basePower: 1, totalModifier: 0, effectivePower: 2, modifiers: [] },
      { playerId: 'p2', basePower: 1, totalModifier: 0, effectivePower: 1, modifiers: [] },
    ] : [{ playerId: 'p1', basePower: 1, totalModifier: 0, effectivePower: 2, modifiers: [] }],
  }];
}

describe('P3 Zouken s4 pseudo-vampire source-specific contract', () => {
  it('loads all three exact source-bound clauses and rejects a widened movement shape', () => {
    const { pack } = setup();
    const abilities = pack.cards[S4_ID]!.abilities;
    expect(abilities).toHaveLength(3);
    expect(rules.isZoukenS4RoundEndSemantic(abilities[0]!)).toBe(true);
    expect(rules.isZoukenS4BattleEndSemantic(abilities[1]!)).toBe(true);
    expect(rules.isZoukenS4MoveSemantic(abilities[2]!)).toBe(true);
    const widened = structuredClone(abilities[2]!);
    widened.cost[0]!.amount = 6;
    expect(rules.isZoukenS4MoveSemantic(widened)).toBe(false);
  });

  it('settles the round-end ledger threshold once and survives JSON restore/replay', () => {
    const { state } = setup();
    state.players[0]!.vp = 5;
    state.abilityRuntime!.manaGainedThisRound.byPlayer.p1 = 2;
    rules.processAbilityEvent(state, { id: 'zouken-s4-round-end', type: 'round_end' });
    expect(state.players[0]!.vp).toBe(3);
    const restored = JSON.parse(JSON.stringify(state)) as GameState;
    rules.processAbilityEvent(restored, { id: 'zouken-s4-round-end-replay', type: 'round_end' });
    expect(restored.players[0]!.vp).toBe(3);
    expect(restored.abilityRuntime!.events.filter((event) => event.type === 'zouken_s4_round_vp_loss_settled')).toHaveLength(1);
  });

  it('atomically transfers at most three mana from the deterministic seat-first loser', () => {
    const { state } = setup();
    appendBattleResult(state);
    state.players[0]!.mana = 4;
    state.players[1]!.mana = 5;
    rules.processAbilityEvent(state, terminalEvent());
    expect(state.players[0]!.mana).toBe(7);
    expect(state.players[1]!.mana).toBe(2);
    const event = state.abilityRuntime!.events.find((entry) => entry.type === 'zouken_s4_battle_mana_settled');
    expect(event).toMatchObject({ sourcePlayerId: 'p2', targetPlayerId: 'p1', delta: 3, requestedDelta: 3 });
    const restored = JSON.parse(JSON.stringify(state)) as GameState;
    rules.processAbilityEvent(restored, { ...terminalEvent(), id: 'battle-phase:1:after_battle_ended-replay' });
    expect(restored.players[0]!.mana).toBe(7);
    expect(restored.players[1]!.mana).toBe(2);
  });

  it('uses the exact three-mana fallback with no other battle participant', () => {
    const { state } = setup();
    appendBattleResult(state, false);
    state.players[0]!.locationId = 'miyama_town';
    state.players[0]!.mana = 4;
    rules.processAbilityEvent(state, terminalEvent(false));
    expect(state.players[0]!.mana).toBe(7);
    expect(state.players[1]!.mana).toBe(4);
  });

  it('caps the absorbed transfer atomically and does not overdraw the loser', () => {
    const { state } = setup();
    appendBattleResult(state);
    state.players[0]!.mana = 11;
    state.players[1]!.mana = 5;
    rules.processAbilityEvent(state, terminalEvent());
    expect(state.players[0]!.mana).toBe(12);
    expect(state.players[1]!.mana).toBe(4);
  });

  it('opens a legal combat movement target and pays seven mana before moving', () => {
    const { state } = setup();
    state.round.activePhase = 'battle';
    state.round.prioritySeat = 1;
    state.players[0]!.mana = 8;
    const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.abilityId === 'zouken.pseudo-vampire.bug-body');
    expect(action?.type).toBe('activate_ability');
    if (!action || action.type !== 'activate_ability') return;
    rules.dispatchAbilityCommand(state, 'p1', action);
    const decision = state.abilityRuntime!.pendingDecision;
    expect(decision?.candidates.length).toBeGreaterThan(0);
    const destination = decision!.candidates[0]!;
    rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision!.id, selectedIds: [destination] });
    expect(state.players[0]!.mana).toBe(1);
    expect(state.players[0]!.locationId).toBe(destination);
    const paidIndex = state.abilityRuntime!.events.findIndex((event) => event.type === 'mana_paid');
    const resolvedIndex = state.abilityRuntime!.events.findIndex((event) => event.type === 'effect_resolved');
    expect(paidIndex).toBeGreaterThanOrEqual(0);
    expect(resolvedIndex).toBeGreaterThan(paidIndex);
  });

  it('does not expose the movement action when seven mana cannot be paid', () => {
    const { state } = setup();
    state.round.activePhase = 'battle';
    state.round.prioritySeat = 1;
    state.players[0]!.mana = 6;
    expect(rules.getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.abilityId === 'zouken.pseudo-vampire.bug-body')).toBe(false);
  });
});
