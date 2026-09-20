import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityDefinitionPack, AbilityEvent, AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../src/ability/types';

const exact = (): RuleNode => ({ type: 'player_flag_number_not_current_round', key: 'combatLossRound' });

function ability(condition: RuleNode): AuthoringAbility {
  return {
    id: 'terminal-loss-check', kind: 'forced_trigger', printedClause: 'synthetic',
    activation: { trigger: 'after_battle_ended' }, conditions: [condition], targets: [], effects: [], cost: [],
    ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function setup(condition: RuleNode = exact()) {
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
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

function result(battlefieldId: string, participants: string[], winners: string[], suppressed: string[] = []) {
  return {
    battlefieldId, winnerPlayerIds: winners, tied: winners.length > 1, winnerPlayerId: winners.length === 1 ? winners[0]! : null,
    margin: 0, vpReward: 0, militaryAdjustments: [], lossEffectSuppressedPlayerIds: suppressed,
    participantBreakdowns: participants.map((playerId) => ({ playerId, basePower: 0, totalModifier: 0, effectivePower: 0, modifiers: [] })),
  } as any;
}

function terminalEvent(
  state: ReturnType<typeof setup>,
  results: ReturnType<typeof setup>['battleResults'] = state.battleResults,
  battleOrdinalOffset = 0,
): AbilityEvent {
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  const battleIds = results.map((r, i) => `${phaseId}:battle:${r.battlefieldId}:${battleOrdinalOffset + i + 1}`);
  return {
    id: `${phaseId}:after_battle_ended`, type: 'after_battle_ended', battlePhaseResolutionId: phaseId,
    battleIds, resultIds: battleIds.map((id) => `${id}:result`),
    scoringReceiptIds: results.map((r) => `${phaseId}:score:${r.battlefieldId}`),
    battleParticipantIds: [...new Set(results.flatMap((r) => r.participantBreakdowns.map((p) => p.playerId)))],
    battleOutcomes: results.map((r) => ({
      battlefieldId: r.battlefieldId,
      participantPlayerIds: [...new Set(r.participantBreakdowns.map((p) => p.playerId))],
      winnerPlayerIds: [...new Set(r.winnerPlayerIds)],
    })),
  };
}

function trigger(state: ReturnType<typeof setup>, event = terminalEvent(state)) {
  return rules.collectTriggeredAbilities(state, event);
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

describe('P3-FB2-38 current-round combat-loss absence condition', () => {
  it('classifies only the exact identity-free condition shape', () => {
    expect(rules.isAcceptedCurrentRoundCombatLossAbsenceCondition(exact())).toBe(true);
    expect(rules.isAcceptedCurrentRoundCombatLossAbsenceCondition({ type: 'player_flag_number_not_current_round', key: 'other' })).toBe(false);
    expect(rules.isAcceptedCurrentRoundCombatLossAbsenceCondition({ type: 'player_flag_number_not_current_round', key: ['combatLossRound'] })).toBe(false);
    expect(rules.isAcceptedCurrentRoundCombatLossAbsenceCondition({ ...exact(), value: 1 })).toBe(false);
  });

  it('loader admits exact condition only under conditions and fail-closes near matches', () => {
    expect(rules.loadAuthoringJson(archive(exact())).report).toEqual([]);
    expect(rules.loadAuthoringJson(archive({ ...exact(), extra: true })).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Unsupported current-round combat-loss absence condition shape' }),
    ]));
    expect(rules.loadAuthoringJson(archive(exact(), true)).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Current-round combat-loss absence condition is supported only under ability conditions' }),
    ]));
  });

  it('passes when controller never loses, including non-participation in another battlefield', () => {
    const state = setup();
    state.battleResults = [
      result('miyama_town', ['p1', 'p2'], ['p1']),
      result('shinto', ['p3', 'p4'], ['p3']),
    ];
    expect(trigger(state)).toEqual([{ cardInstanceId: 'source', abilityId: 'terminal-loss-check', controllerId: 'p1' }]);
  });

  it('fails when controller is a participant and non-winner in any phase battle', () => {
    const state = setup();
    state.battleResults = [result('miyama_town', ['p1', 'p2'], ['p2'])];
    expect(trigger(state)).toEqual([]);
  });

  it('treats shared winner membership as non-loss', () => {
    const state = setup();
    state.battleResults = [result('miyama_town', ['p1', 'p2', 'p3'], ['p1', 'p2'])];
    expect(trigger(state)).toHaveLength(1);
  });

  it('does not erase an actual loss when battle-loss effects are suppressed', () => {
    const state = setup();
    state.battleResults = [result('miyama_town', ['p1', 'p2'], ['p2'], ['p1'])];
    expect(rules.currentRoundCombatLossAbsent(state, 'p1', terminalEvent(state))).toBe(false);
    expect(trigger(state)).toEqual([]);
  });

  it('uses frozen terminal provenance after production scoring clears live battle results', () => {
    const winState = setup();
    const winSnapshot = [
      result('miyama_town', ['p1', 'p2'], ['p1']),
      result('shinto', ['p3', 'p4'], ['p3']),
    ];
    winState.battleResults = structuredClone(winSnapshot);
    const winTerminal = terminalEvent(winState, winSnapshot);
    const scoredWinState = rules.applyBattleScoring(winState).nextState;
    expect(scoredWinState.battleResults).toEqual([]);
    expect(rules.collectTriggeredAbilities(scoredWinState, winTerminal)).toEqual([
      { cardInstanceId: 'source', abilityId: 'terminal-loss-check', controllerId: 'p1' },
    ]);

    const lossState = setup();
    const lossSnapshot = [result('miyama_town', ['p1', 'p2'], ['p2'])];
    lossState.battleResults = structuredClone(lossSnapshot);
    const lossTerminal = terminalEvent(lossState, lossSnapshot);
    const scoredLossState = rules.applyBattleScoring(lossState).nextState;
    expect(scoredLossState.battleResults).toEqual([]);
    expect(rules.collectTriggeredAbilities(scoredLossState, lossTerminal)).toEqual([]);
  });

  it('accepts later-round MatchSession terminal provenance without reconstructing phase-local ordinals', () => {
    const session = rules.createMatchSession({
      seed: 20260920,
      humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'],
    });
    session.state.round.roundNumber = 3;
    session.state.battleResults = [];
    session.battleHistory = [result('shinto', ['p3', 'p4'], ['p3'])];
    const currentBattle = result('miyama_town', ['p1', 'p2'], ['p1']);
    (session as any).queuePostScoringBattleEvents(
      [currentBattle],
      [{ type: 'battle_scored', message: 'synthetic receipt', payload: { battlefieldId: 'miyama_town' } }],
    );
    const terminal = session.state.abilityRuntime!.pendingBattleTerminalEvent!;
    expect(terminal.battleIds).toEqual(['battle-phase:3:battle:miyama_town:2']);
    expect(terminal.battleOutcomes).toEqual([{
      battlefieldId: 'miyama_town', participantPlayerIds: ['p1', 'p2'], winnerPlayerIds: ['p1'],
    }]);
    expect(rules.currentRoundCombatLossAbsent(session.state, 'p1', terminal)).toBe(true);
  });

  it('requires multi-battle ordinals to be one contiguous increasing run while preserving history offsets', () => {
    const state = setup();
    const snapshot = [
      result('miyama_town', ['p1', 'p2'], ['p1']),
      result('shinto', ['p3', 'p4'], ['p3']),
    ];
    state.battleResults = structuredClone(snapshot);
    const good = terminalEvent(state, snapshot);
    const phaseId = `battle-phase:${state.round.roundNumber}`;
    const withOrdinals = (ordinals: number[]): AbilityEvent => {
      const battleIds = good.battleOutcomes!.map((outcome, index) =>
        `${phaseId}:battle:${outcome.battlefieldId}:${ordinals[index]}`);
      return { ...good, battleIds, resultIds: battleIds.map((id) => `${id}:result`) };
    };

    expect(trigger(state, withOrdinals([1, 2]))).toHaveLength(1);
    expect(trigger(state, withOrdinals([8, 9]))).toHaveLength(1);
    for (const ordinals of [[1, 1], [2, 1], [1, 3]]) {
      const malformed = withOrdinals(ordinals);
      expect(() => trigger(state, malformed)).not.toThrow();
      expect(trigger(state, malformed)).toEqual([]);
    }
  });
  it('fails closed for sparse terminal provenance through real trigger collection', () => {
    const state = setup();
    state.battleResults = [result('miyama_town', ['p1', 'p2'], ['p1'])];
    const good = terminalEvent(state);
    const sparseParticipants = Array(1) as string[];
    const sparseWinners = Array(1) as string[];
    const sparseAggregate = Array(1) as string[];
    const sparseOutcome = {
      ...good,
      battleParticipantIds: sparseAggregate,
      battleOutcomes: good.battleOutcomes!.map((outcome) => ({
        ...outcome,
        participantPlayerIds: sparseParticipants,
        winnerPlayerIds: sparseWinners,
      })),
    } as AbilityEvent;

    expect(() => trigger(state, sparseOutcome)).not.toThrow();
    expect(trigger(state, sparseOutcome)).toEqual([]);

    for (const key of ['battleIds', 'resultIds', 'scoringReceiptIds'] as const) {
      const sparseTopLevelIds = { ...good, [key]: Array(1) } as unknown as AbilityEvent;
      expect(() => trigger(state, sparseTopLevelIds)).not.toThrow();
      expect(trigger(state, sparseTopLevelIds)).toEqual([]);
    }
  });
  it('fails closed for stale, malformed, non-terminal, or runtime near-match contexts', () => {
    const state = setup();
    state.battleResults = [result('miyama_town', ['p1', 'p2'], ['p1'])];
    const good = terminalEvent(state);
    expect(trigger(state, { ...good, battlePhaseResolutionId: 'battle-phase:999' })).toEqual([]);
    expect(trigger(state, { ...good, resultIds: [] })).toEqual([]);
    expect(trigger(state, { ...good, type: 'after_battle_result_determined' })).toEqual([]);
    expect(trigger(state, {
      ...good,
      battleOutcomes: good.battleOutcomes!.map((outcome) => ({ ...outcome, participantPlayerIds: undefined })),
    })).toEqual([]);
    expect(trigger(state, { ...good, battleParticipantIds: ['p1'] })).toEqual([]);
    expect(trigger(state, terminalEvent(state, []))).toEqual([
      { cardInstanceId: 'source', abilityId: 'terminal-loss-check', controllerId: 'p1' },
    ]);
    for (const [participantPlayerIds, winnerPlayerIds] of [
      [[], []],
      [['p1', 'p2'], []],
    ] as const) {
      const malformedEmptyOutcome = {
        ...good,
        battleParticipantIds: [...participantPlayerIds],
        battleOutcomes: good.battleOutcomes!.map((outcome) => ({
          ...outcome,
          participantPlayerIds: [...participantPlayerIds],
          winnerPlayerIds: [...winnerPlayerIds],
        })),
      } as AbilityEvent;
      expect(() => trigger(state, malformedEmptyOutcome)).not.toThrow();
      expect(trigger(state, malformedEmptyOutcome)).toEqual([]);
    }
    for (const [participantPlayerIds, winnerPlayerIds] of [
      [['ghost', 'p2'], ['p2']],
      [['ghost', 'p2'], ['ghost']],
      [['', 'p2'], ['p2']],
    ] as const) {
      const malformedRosterProvenance = {
        ...good,
        battleParticipantIds: [...participantPlayerIds],
        battleOutcomes: good.battleOutcomes!.map((outcome) => ({
          ...outcome,
          participantPlayerIds: [...participantPlayerIds],
          winnerPlayerIds: [...winnerPlayerIds],
        })),
      } as AbilityEvent;
      expect(() => trigger(state, malformedRosterProvenance)).not.toThrow();
      expect(trigger(state, malformedRosterProvenance)).toEqual([]);
    }
    (state as unknown as { modeState?: { closedLocations?: string[] } }).modeState = { closedLocations: ['shinto'] };
    const closedBattleSnapshot = [result('shinto', ['p1', 'p2'], ['p1'])];
    const closedBattlefieldProvenance = terminalEvent(state, closedBattleSnapshot);
    expect(() => trigger(state, closedBattlefieldProvenance)).not.toThrow();
    expect(trigger(state, closedBattlefieldProvenance)).toEqual([]);
    (state as unknown as { modeState?: { closedLocations?: string[] } }).modeState = { closedLocations: [] };

    for (const malformedBattlefieldId of ['', 'ghost_battlefield', 'magic_workshop']) {
      const malformedBattleId = `battle-phase:${state.round.roundNumber}:battle:${malformedBattlefieldId}:1`;
      const malformedBattlefieldProvenance = {
        ...good,
        battleIds: [malformedBattleId],
        resultIds: [`${malformedBattleId}:result`],
        scoringReceiptIds: [`battle-phase:${state.round.roundNumber}:score:${malformedBattlefieldId}`],
        battleOutcomes: good.battleOutcomes!.map((outcome) => ({ ...outcome, battlefieldId: malformedBattlefieldId })),
      } as AbilityEvent;
      expect(() => trigger(state, malformedBattlefieldProvenance)).not.toThrow();
      expect(trigger(state, malformedBattlefieldProvenance)).toEqual([]);
    }
    for (const key of ['battleIds', 'resultIds', 'scoringReceiptIds'] as const) {
      const malformedIds = { ...good, [key]: [123] } as unknown as AbilityEvent;
      expect(() => trigger(state, malformedIds)).not.toThrow();
      expect(trigger(state, malformedIds)).toEqual([]);
    }
    const validBattleId = good.battleIds![0]!;
    const ordinalStart = validBattleId.lastIndexOf(':') + 1;
    const battleIdPrefix = validBattleId.slice(0, ordinalStart);
    for (const malformedOrdinal of ['not-an-ordinal', '0', '-1', '1:extra']) {
      const malformedBattleId = `${battleIdPrefix}${malformedOrdinal}`;
      const malformedTerminal = {
        ...good,
        battleIds: [malformedBattleId],
        resultIds: [`${malformedBattleId}:result`],
      };
      expect(() => trigger(state, malformedTerminal)).not.toThrow();
      expect(trigger(state, malformedTerminal)).toEqual([]);
    }

    const malformed = setup({ ...exact(), extra: true });
    malformed.battleResults = [result('miyama_town', ['p1', 'p2'], ['p1'])];
    expect(() => trigger(malformed)).toThrow(/combat-loss absence condition shape/i);
  });
});
