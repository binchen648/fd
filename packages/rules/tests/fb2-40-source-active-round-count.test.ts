import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SOURCE_ID = 'metric-source';
const DEF_ID = 'test.metric.source';

function archive(variable: string = 'source_card_active_round_count') {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'master_skill_card_archive',
    id: 'master.metric-test',
    name: 'metric test',
    class: 'Master',
    cards: [{
      id: DEF_ID,
      name: 'metric source',
      cardType: 'master_skill',
      owner: { type: 'master', id: 'master.metric-test' },
      cardFace: { typeLabel: '被动', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [{
        id: 'metric-ability',
        kind: 'passive',
        printedClause: 'metric',
        activation: {},
        conditions: [],
        targets: [],
        effects: [{ type: 'adjust_victory_points', player: 'controller', amount: { var: variable } }],
        cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
        execution: { mode: 'automatic' },
      }],
    }],
  };
}

function state(playedRound = 1, currentRound = 1): GameState {
  const compiled = rules.loadAuthoringJson(archive());
  expect(compiled.report).toEqual([]);
  const s = createSeededGameState({ activeSeats: [1, 2] });
  s.round.roundNumber = currentRound;
  s.cards = [{
    instanceId: SOURCE_ID,
    definitionId: DEF_ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  }];
  rules.initializeAbilityRuntime(s, compiled, { seed: 20260920 });
  s.abilityRuntime!.cardState[SOURCE_ID] = { active: true, faceDown: false, playedRound };
  return s;
}

function value(s: GameState): number {
  return rules.evaluateFormula({ var: 'source_card_active_round_count' }, s, 'p1', SOURCE_ID).value;
}

describe('P3 FB2-40 source-card active-round count metric', () => {
  it('admits exactly the controlled metric name while arbitrary near names remain unsupported', () => {
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);
    for (const near of [
      'source_card_active_round_counts',
      'source.card.active_round_count',
      'source_card.playedRound',
      'combatWinRound',
    ]) {
      const report = rules.loadAuthoringJson(archive(near)).report;
      expect(report).toContainEqual(expect.objectContaining({
        path: 'effects[0].amount.var',
        status: 'unsupported',
        reason: expect.stringContaining('Unbound server metric or variable'),
      }));
    }
  });

  it('returns one in the activation round and counts every later round inclusively', () => {
    expect(value(state(1, 1))).toBe(1);
    expect(value(state(1, 2))).toBe(2);
    expect(value(state(3, 7))).toBe(5);
  });

  it('fails closed for missing, inactive, face-down, or non-active-zone source state', () => {
    const cases: Array<(s: GameState) => void> = [
      (s) => { s.cards = []; },
      (s) => { delete s.abilityRuntime!.cardState[SOURCE_ID]; },
      (s) => { s.abilityRuntime!.cardState[SOURCE_ID]!.active = false; },
      (s) => { s.abilityRuntime!.cardState[SOURCE_ID]!.faceDown = true; },
      (s) => { s.cards[0]!.zone = 'skill'; },
    ];
    for (const mutate of cases) {
      const s = state(1, 3);
      const before = structuredClone(s);
      mutate(s);
      const expected = structuredClone(s);
      expect(() => value(s)).toThrow(/source_card_active_round_count requires a valid active source-card round state/);
      expect(s).toEqual(expected);
      expect(before.round.roundNumber).toBe(3);
    }
  });

  it('fails closed for corrupt, zero, negative, or future played-round provenance', () => {
    for (const playedRound of [0, -1, 4, 1.5, Number.NaN]) {
      const s = state(1, 3);
      s.abilityRuntime!.cardState[SOURCE_ID]!.playedRound = playedRound;
      expect(() => value(s)).toThrow(/source_card_active_round_count requires a valid active source-card round state/);
    }
  });

  it('does not alter existing controlled server metrics', () => {
    const s = state(2, 6);
    s.players.find((player) => player.id === 'p1')!.mana = 9;
    expect(rules.evaluateFormula({ var: 'game.round_number' }, s, 'p1', SOURCE_ID).value).toBe(6);
    expect(rules.evaluateFormula({ var: 'controller.availableMana' }, s, 'p1', SOURCE_ID).value).toBe(9);
    expect(value(s)).toBe(5);
  });
});
