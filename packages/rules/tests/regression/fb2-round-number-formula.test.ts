import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

function territoryFormula() {
  return {
    printedExpression: 'X',
    formula: {
      op: 'add',
      args: [16, { op: 'multiply', args: [-2, { var: 'game.round_number' }] }],
    },
  };
}

function syntheticArchive() {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'servant_skill_card_archive',
    id: 'servant.synthetic-caster',
    name: 'Synthetic Caster',
    class: 'Caster',
    cards: [{
      id: 'servant.synthetic-caster.skill.territory',
      name: 'Renamed Territory Formula',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: 'servant.synthetic-caster' },
      printedText: 'fixture only',
      cardFace: { typeLabel: '魔术', attributes: ['魔术'], cost: 0, basePower: territoryFormula() },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      abilities: [{
        id: 'renamed-round-power',
        kind: 'continuous_formula',
        printedClause: 'fixture formula',
        activation: { trigger: 'on_card_played', requiresSourceState: 'active' },
        execution: { mode: 'automatic' },
      }],
    }],
  };
}

function formulaState(raw = syntheticArchive()) {
  const pack = rules.loadAuthoringJson(raw);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.servantCardId = raw.id;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
  const sourceId = 'round-formula-source';
  const definitionId = raw.cards[0]!.id;
  state.cards.push({
    instanceId: sourceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'attack_area',
    visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState[sourceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return { state, pack, sourceId };
}

describe('P3-FB2-11 trusted game round-number formula metric', () => {
  it('accepts only the trusted game.round_number server metric and keeps near names fail-closed', () => {
    const accepted = rules.loadAuthoringJson(syntheticArchive());
    expect(accepted.report).toEqual([]);

    for (const near of ['game.current_round', 'current_round', 'game.round']) {
      const raw = structuredClone(syntheticArchive());
      (raw.cards[0]!.cardFace.basePower.formula.args[1] as any).args[1].var = near;
      const pack = rules.loadAuthoringJson(raw);
      expect(pack.report).toContainEqual(expect.objectContaining({
        path: expect.stringContaining('cardFace.basePower'),
        status: 'unsupported',
      }));
    }
  });

  it('reads the authoritative round directly and evaluates the Territory expression deterministically', () => {
    const { state, sourceId } = formulaState();
    const expected = new Map([[1, 14], [4, 8], [7, 2], [8, 0]]);
    for (const [round, value] of expected) {
      state.round.roundNumber = round;
      expect(rules.evaluateFormula({ var: 'game.round_number' }, state, 'p1', sourceId).value).toBe(round);
      const power = rules.calculateCardPower(state, sourceId);
      expect(power.value).toBe(value);
      expect(power.lines.at(-1)).toMatchObject({ value });
    }
  });

  it('does not infer the round from priority seat, runtime revision, or another mutable counter', () => {
    const { state, sourceId } = formulaState();
    state.round.roundNumber = 7;
    state.round.prioritySeat = 2;
    state.abilityRuntime!.revision = 91;
    state.abilityRuntime!.consecutivePlayRounds[sourceId] = 44;
    expect(rules.evaluateFormula({ var: 'game.round_number' }, state, 'p1', sourceId).value).toBe(7);
    expect(rules.calculateCardPower(state, sourceId).value).toBe(2);
  });

  it('keeps existing Drake movement-distance formula behavior unchanged', () => {
    const drake = JSON.parse(readFileSync('data/authoring/servants/servant.drake.json', 'utf8'));
    const pack = rules.loadAuthoringJson(drake);
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.players[0]!.servantCardId = drake.id;
    rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
    const sourceId = 'drake-formula-source';
    state.cards.push({
      instanceId: sourceId,
      definitionId: 'servant.drake.skill.sc-drake-3',
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'attack_area',
      visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState[sourceId] = { active: true, faceDown: false, playedRound: 1 };
    state.abilityRuntime!.movementDistanceThisRound.p1 = 2;
    expect(rules.calculateCardPower(state, sourceId).value).toBe(8);
  });

  it('does not add a new formula operator or allow string expressions', () => {
    const { state, sourceId } = formulaState();
    expect(() => rules.evaluateFormula({ op: 'subtract', args: [16, 2] }, state, 'p1', sourceId)).toThrow(/Unsupported formula operation/);
    expect(() => rules.evaluateFormula('16 - round * 2', state, 'p1', sourceId)).toThrow(/Formula must be a controlled AST/);
  });
});
