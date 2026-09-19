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

function terminalEvent(state: ReturnType<typeof setup>): AbilityEvent {
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  const results = state.battleResults;
  const battleIds = results.map((r, i) => `${phaseId}:battle:${r.battlefieldId}:${i + 1}`);
  return {
    id: `${phaseId}:after_battle_ended`, type: 'after_battle_ended', battlePhaseResolutionId: phaseId,
    battleIds, resultIds: battleIds.map((id) => `${id}:result`),
    scoringReceiptIds: results.map((r) => `${phaseId}:score:${r.battlefieldId}`),
    battleParticipantIds: [...new Set(results.flatMap((r) => r.participantBreakdowns.map((p) => p.playerId)))],
    battleOutcomes: results.map((r) => ({ battlefieldId: r.battlefieldId, winnerPlayerIds: [...r.winnerPlayerIds] })),
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

  it('fails closed for stale, malformed, non-terminal, or runtime near-match contexts', () => {
    const state = setup();
    state.battleResults = [result('miyama_town', ['p1', 'p2'], ['p1'])];
    const good = terminalEvent(state);
    expect(trigger(state, { ...good, battlePhaseResolutionId: 'battle-phase:999' })).toEqual([]);
    expect(trigger(state, { ...good, resultIds: [] })).toEqual([]);
    expect(trigger(state, { ...good, type: 'after_battle_result_determined' })).toEqual([]);

    const malformed = setup({ ...exact(), extra: true });
    malformed.battleResults = [result('miyama_town', ['p1', 'p2'], ['p1'])];
    expect(() => trigger(malformed)).toThrow(/combat-loss absence condition shape/i);
  });
});
