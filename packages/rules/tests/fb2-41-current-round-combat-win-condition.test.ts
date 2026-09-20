import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityDefinitionPack, AbilityEvent, AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../src/ability/types';

const exact = (): RuleNode => ({ type: 'player_flag_number_not_current_round', key: 'combatWinRound' });

function ability(condition: RuleNode): AuthoringAbility {
  return {
    id: 'round-end-win-check', kind: 'forced_trigger', printedClause: 'synthetic',
    activation: { trigger: 'round_end' }, conditions: [condition], targets: [], effects: [], cost: [],
    ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function setup(condition: RuleNode = exact()) {
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.round.activePhase = 'battle';
  state.cards = [{ instanceId: 'source', definitionId: 'skill.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } }];
  const card: ExecutableCardDefinition = {
    id: 'skill.source', name: 'synthetic', cardType: 'servant_skill', ownerId: 'servant.synthetic',
    cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [ability(condition)],
    mode: 'automatic', playKind: 'support', destinationZone: 'field',
  };
  const pack: AbilityDefinitionPack = { cards: { [card.id]: card } };
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  state.abilityRuntime!.cardState.source = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function battleEvent(
  state: ReturnType<typeof setup>,
  winners: string[],
  losers: string[],
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
    battleParticipantIds: [...winners, ...losers],
    battleResult: { winners: [...winners], loserIds: [...losers] },
  };
}

function roundEndEvent(): AbilityEvent {
  return { id: 'round-end-check', type: 'round_end' };
}

function triggerAtRoundEnd(state: ReturnType<typeof setup>) {
  state.round.activePhase = 'round_end';
  return rules.collectTriggeredAbilities(state, roundEndEvent());
}

function archive(condition: RuleNode, inEffects = false) {
  const a: any = ability(condition);
  if (inEffects) { a.conditions = []; a.effects = [condition]; }
  return {
    schemaVersion: 'fd-card-authoring-v1', id: 'servant.synthetic', name: 'synthetic', cards: [{
      id: 'skill.source', name: 'source', cardType: 'servant_skill', cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [a],
    }],
  };
}

describe('P3-FB2-41 current-round combat-win absence condition', () => {
  it('classifies only the exact combatWinRound condition shape', () => {
    expect(rules.isAcceptedCurrentRoundCombatWinAbsenceCondition(exact())).toBe(true);
    expect(rules.isAcceptedCurrentRoundCombatWinAbsenceCondition({ type: 'player_flag_number_not_current_round', key: 'combatLossRound' })).toBe(false);
    expect(rules.isAcceptedCurrentRoundCombatWinAbsenceCondition({ type: 'player_flag_number_not_current_round', key: ['combatWinRound'] })).toBe(false);
    expect(rules.isAcceptedCurrentRoundCombatWinAbsenceCondition({ ...exact(), extra: true })).toBe(false);
  });

  it('loader admits the exact condition only under ability conditions and fail-closes near matches', () => {
    expect(rules.loadAuthoringJson(archive(exact())).report).toEqual([]);
    expect(rules.loadAuthoringJson(archive({ ...exact(), extra: true })).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Unsupported current-round combat-win absence condition shape' }),
    ]));
    expect(rules.loadAuthoringJson(archive(exact(), true)).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Current-round combat-win absence condition is supported only under ability conditions' }),
    ]));
  });

  it('records an authoritative current-round winner and suppresses the round-end absence condition', () => {
    const state = setup();
    rules.processAbilityEvent(state, battleEvent(state, ['p1'], ['p2']));
    expect(state.abilityRuntime!.combatWinRoundByPlayer).toEqual({ p1: state.round.roundNumber });
    expect(triggerAtRoundEnd(state)).toEqual([]);
    expect(rules.currentRoundCombatWinAbsent(state, 'p1', roundEndEvent())).toBe(false);
  });

  it('records the real game-loop winner when the only loser has loss effects suppressed', () => {
    const state = setup();
    state.battleResults = [{
      battlefieldId: 'miyama_town',
      winnerPlayerIds: ['p1'],
      tied: false,
      lossEffectSuppressedPlayerIds: ['p2'],
      winnerPlayerId: 'p1',
      margin: 0,
      vpReward: 0,
      militaryAdjustments: [],
      participantBreakdowns: ['p1', 'p2'].map((playerId) => ({
        playerId, basePower: 0, totalModifier: 0, effectivePower: 0, modifiers: [],
      })),
    }];

    const advanced = rules.stepGameLoop(state).nextState;
    expect(advanced.abilityRuntime!.combatWinRoundByPlayer).toEqual({ p1: state.round.roundNumber });
  });

  it('treats a shared/tied winner as a win for every winner', () => {
    const state = setup();
    rules.processAbilityEvent(state, battleEvent(state, ['p1', 'p2'], ['p3']));
    expect(state.abilityRuntime!.combatWinRoundByPlayer).toEqual({ p1: 1, p2: 1 });
    state.round.activePhase = 'round_end';
    expect(rules.currentRoundCombatWinAbsent(state, 'p1', roundEndEvent())).toBe(false);
    expect(rules.currentRoundCombatWinAbsent(state, 'p2', roundEndEvent())).toBe(false);
  });

  it('leaves the absence condition true for a loss or non-participation', () => {
    const lost = setup();
    rules.processAbilityEvent(lost, battleEvent(lost, ['p2'], ['p1']));
    expect(lost.abilityRuntime!.combatWinRoundByPlayer).toEqual({ p2: 1 });
    expect(triggerAtRoundEnd(lost)).toEqual([
      { cardInstanceId: 'source', abilityId: 'round-end-win-check', controllerId: 'p1' },
    ]);

    const absent = setup();
    rules.processAbilityEvent(absent, battleEvent(absent, ['p3'], ['p4'], 'shinto'));
    expect(triggerAtRoundEnd(absent)).toHaveLength(1);
  });

  it('does not let a prior-round win suppress the current round-end absence condition', () => {
    const state = setup();
    rules.processAbilityEvent(state, battleEvent(state, ['p1'], ['p2']));
    expect(state.abilityRuntime!.combatWinRoundByPlayer?.p1).toBe(1);
    state.round.roundNumber = 2;
    expect(triggerAtRoundEnd(state)).toHaveLength(1);
  });

  it('fails closed and does not mutate the ledger for stale or malformed battle provenance', () => {
    for (const mutate of [
      (event: AbilityEvent) => ({ ...event, battlePhaseResolutionId: 'battle-phase:999' }),
      (event: AbilityEvent) => ({ ...event, resultId: `${event.resultId}:wrong` }),
      (event: AbilityEvent) => ({ ...event, battleParticipantIds: ['p1'] }),
      (event: AbilityEvent) => ({ ...event, battleResult: { winners: ['p1'], loserIds: ['p1'] } }),
      (event: AbilityEvent) => ({ ...event, battlefieldId: 'magic_workshop' }),
      (event: AbilityEvent) => ({ ...event, battleId: `${event.battlePhaseResolutionId}:battle:miyama_town:0`, resultId: `${event.battlePhaseResolutionId}:battle:miyama_town:0:result`, id: `${event.battlePhaseResolutionId}:battle:miyama_town:0:result` }),
    ]) {
      const state = setup();
      const malformed = mutate(battleEvent(state, ['p1'], ['p2']));
      expect(rules.recordCurrentRoundCombatWinsFromBattleResult(state, malformed)).toBe(false);
      expect(state.abilityRuntime!.combatWinRoundByPlayer).toBeUndefined();
    }
  });

  it('requires authoritative battle phase for recording and authoritative round_end for evaluation', () => {
    const state = setup();
    const event = battleEvent(state, ['p1'], ['p2']);
    state.round.activePhase = 'round_end';
    expect(rules.recordCurrentRoundCombatWinsFromBattleResult(state, event)).toBe(false);
    expect(state.abilityRuntime!.combatWinRoundByPlayer).toBeUndefined();
    state.round.activePhase = 'battle';
    expect(rules.currentRoundCombatWinAbsent(state, 'p1', roundEndEvent())).toBe(false);
  });

  it('fails closed on corrupt future ledger values instead of treating them as no win', () => {
    const state = setup();
    state.round.activePhase = 'round_end';
    state.abilityRuntime!.combatWinRoundByPlayer = { p1: state.round.roundNumber + 1 };
    expect(rules.currentRoundCombatWinAbsent(state, 'p1', roundEndEvent())).toBe(false);
  });
});
