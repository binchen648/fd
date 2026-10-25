import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

function territoryFormula() {
  return {
    printedExpression: 'X',
    formula: { op: 'add', args: [16, { op: 'multiply', args: [-2, { var: 'game.round_number' }] }] },
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
      id: 'servant.synthetic-caster.skill.territory', name: 'Renamed Territory Formula',
      cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.synthetic-caster' },
      printedText: 'fixture only',
      cardFace: { typeLabel: '魔术', attributes: ['魔术'], cost: 0, basePower: territoryFormula() },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      abilities: [{ id: 'renamed-round-power', kind: 'continuous_formula', printedClause: 'fixture formula',
        activation: { trigger: 'on_card_played', requiresSourceState: 'active' }, execution: { mode: 'automatic' } }],
    }],
  };
}

function formulaState(raw = syntheticArchive()) {
  const pack = rules.loadAuthoringJson(raw);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.servantCardId = raw.id;
  rules.initializeAbilityRuntime(state, pack, { seed: 20261025 });
  const sourceId = 'round-formula-source';
  state.cards.push({ instanceId: sourceId, definitionId: raw.cards[0]!.id, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone: 'attack_area', visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState[sourceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return { state, sourceId };
}

describe('P3-FB2-11 trusted game round-number formula metric', () => {
  it('accepts only game.round_number and rejects near names', () => {
    expect(rules.loadAuthoringJson(syntheticArchive()).report).toEqual([]);
    for (const near of ['game.current_round', 'current_round', 'game.round']) {
      const raw = structuredClone(syntheticArchive());
      (raw.cards[0]!.cardFace.basePower.formula.args[1] as any).args[1].var = near;
      expect(rules.loadAuthoringJson(raw).report).toContainEqual(expect.objectContaining({
        path: expect.stringContaining('cardFace.basePower'), status: 'unsupported',
      }));
    }
  });

  it('reads authoritative round and computes controlled Territory values deterministically', () => {
    const { state, sourceId } = formulaState();
    for (const [round, value] of [[1, 14], [4, 8], [7, 2], [8, 0]] as const) {
      state.round.roundNumber = round;
      expect(rules.evaluateFormula({ var: 'game.round_number' }, state, 'p1', sourceId).value).toBe(round);
      expect(rules.calculateCardPower(state, sourceId).value).toBe(value);
    }
  });

  it('does not infer round from unrelated mutable counters', () => {
    const { state, sourceId } = formulaState();
    state.round.roundNumber = 7; state.round.prioritySeat = 2; state.abilityRuntime!.revision = 91;
    state.abilityRuntime!.consecutivePlayRounds[sourceId] = 44;
    expect(rules.evaluateFormula({ var: 'game.round_number' }, state, 'p1', sourceId).value).toBe(7);
  });

  it('preserves existing Drake movement-distance formula behavior', () => {
    const drake = { schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.drake',
      name: 'Drake', class: 'Rider', cards: [{ id: 'servant.drake.skill.sc-drake-3', name: 'Drake', cardType: 'servant_skill',
        owner: { type: 'servant', id: 'servant.drake' }, printedText: 'fixture',
        cardFace: { typeLabel: '魔术', attributes: ['魔术'], cost: 0, basePower: { formula: { var: 'controller.movement_distance_this_round' } } },
        abilities: [] }] };
    const pack = rules.loadAuthoringJson(drake); const state = createSeededGameState({ activeSeats: [1, 2] }); state.cards = [];
    rules.initializeAbilityRuntime(state, pack, { seed: 20261025 });
    const sourceId = 'drake-formula-source'; state.cards.push({ instanceId: sourceId, definitionId: drake.cards[0]!.id,
      ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState[sourceId] = { active: true, faceDown: false, playedRound: 1 };
    state.abilityRuntime!.movementDistanceThisRound.p1 = 2;
    expect(rules.calculateCardPower(state, sourceId).value).toBe(2);
  });

  it('does not add subtraction or string formula evaluation', () => {
    const { state, sourceId } = formulaState();
    expect(() => rules.evaluateFormula({ op: 'subtract', args: [16, 2] }, state, 'p1', sourceId)).toThrow(/Unsupported formula operation/);
    expect(() => rules.evaluateFormula('16 - round * 2', state, 'p1', sourceId)).toThrow(/Formula must be a controlled AST/);
  });

  it('rejects a round metric combined with an operator before calculation can execute', () => {
    const raw = structuredClone(syntheticArchive());
    (raw.cards[0]!.cardFace.basePower as any) = { op: 'subtract', var: 'game.round_number', args: [16, 2] };
    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toContainEqual(expect.objectContaining({ status: 'unsupported' }));
    const { state, sourceId } = formulaState();
    state.round.roundNumber = 4;
    expect(() => rules.evaluateFormula({ op: 'subtract', var: 'game.round_number', args: [16, 2] }, state, 'p1', sourceId))
      .toThrow(/standalone read-only variable/);
  });

  it('rejects name-based and op-var aliases consistently in loader and evaluator', () => {
    for (const malformed of [{ name: 'game.round_number' }, { op: 'var', name: 'game.round_number' },
      { name: 'game.round_number', op: 'add', args: [2, 3] },
      { var: 'game.round_number', formula: 2 }, { name: 'game.round_number', formula: 2 },
      { var: 'controller.availableMana', name: 'game.round_number' }]) {
      const raw = structuredClone(syntheticArchive());
      (raw.cards[0]!.cardFace.basePower as any) = malformed;
      expect(rules.loadAuthoringJson(raw).report).toContainEqual(expect.objectContaining({ status: 'unsupported' }));
      const { state, sourceId } = formulaState(raw);
      expect(() => rules.evaluateFormula(malformed, state, 'p1', sourceId)).toThrow();
      expect(() => rules.calculateCardPower(state, sourceId)).toThrow();
    }
  });
});
