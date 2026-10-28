import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.artoria-alt.json', 'utf8')) as any;
const sourceDefinitionId = 'servant.artoria-alt.skill.sc-artoria-alt-3';
const abilityId = 'sc-artoria-alt-3.magic-resistance';

function setup() {
  const pack = rules.loadAuthoringJson(structuredClone(raw));
  (pack.cards as any)['fixture.magic'] = {
    id: 'fixture.magic', name: 'Magic', cardType: 'basic_attack',
    cardFace: { attributes: ['魔术'], cost: 0, basePower: 7 }, playRequirements: [], abilities: [],
  };
  const state = createSeededGameState(); state.cards = [];
  state.round.activePhase = 'battle'; state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town';
  rules.initializeAbilityRuntime(state, pack, { seed: 42 });
  state.cards.push({ instanceId: 'source', definitionId: sourceDefinitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState.source = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  state.cards.push({ instanceId: 'own-attack', definitionId: 'fixture.magic', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
  state.cards.push({ instanceId: 'attack', definitionId: 'fixture.magic', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState['own-attack'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  state.abilityRuntime!.cardState.attack = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

describe('FB2 Saber runtime prerequisite', () => {
  it('accepts only 魔术 and rejects 魔法 / 魔法/魔术 partitions and unrelated attributes', () => {
    const state = setup();
    const ability = state.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.find((a) => a.id === abilityId)!;
    expect(rules.isCombatMagicResistanceModifierSemantic(ability)).toBe(true);
    for (const attribute of ['魔术', '魔法', '魔法/魔术']) {
      const altered = structuredClone(ability);
      altered.ruleModifiers[0]!.scope = { ...altered.ruleModifiers[0]!.scope, constraints: [{ type: 'has_attribute', attribute }] };
      expect(rules.isCombatMagicResistanceModifierSemantic(altered)).toBe(true);
    }
    for (const attribute of ['力量', '特殊', '魔术/魔法', '魔法术']) {
      const altered = structuredClone(ability);
      altered.ruleModifiers[0]!.scope = { ...altered.ruleModifiers[0]!.scope, constraints: [{ type: 'has_attribute', attribute }] };
      expect(rules.isCombatMagicResistanceModifierSemantic(altered)).toBe(false);
    }
    for (const attribute of ['魔术', '魔法', '魔法/魔术']) {
      const partitionState = setup();
      const partitionAbility = partitionState.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.find((a) => a.id === abilityId)!;
      partitionAbility.ruleModifiers[0]!.scope = { ...partitionAbility.ruleModifiers[0]!.scope, constraints: [{ type: 'has_attribute', attribute }] };
      (partitionState.abilityRuntime!.pack.cards['fixture.magic'] as any).cardFace.attributes = [attribute];
      expect(rules.dispatchAbilityCommand(partitionState, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId }).ok).toBe(true);
      expect(rules.calculateCardPower(partitionState, 'attack').value).toBe(0);
    }
    const canonicalState = setup();
    (canonicalState.abilityRuntime!.pack.cards['fixture.magic'] as any).cardFace.attributes = ['magic'];
    expect(rules.dispatchAbilityCommand(canonicalState, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId }).ok).toBe(true);
    expect(rules.calculateCardPower(canonicalState, 'attack').value).toBe(0);
  });

  it('sets only an engaged same-battlefield opponent 魔术 attack to zero and expires safely', () => {
    const state = setup();
    const attack = state.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.find((a) => a.id === abilityId)!;
    expect(rules.getLegalActions(state, 'p1')).toEqual(expect.arrayContaining([expect.objectContaining({ abilityId })]));
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId }).ok).toBe(true);
    const affected = rules.calculateCardPower(state, 'attack');
    expect(affected.value).toBe(0);
    expect(affected.lines).toEqual(expect.arrayContaining([expect.objectContaining({ value: 0 })]));
    expect(state.abilityRuntime!.ongoingEffects).toHaveLength(1);
    state.players[1]!.locationId = 'shinto';
    expect(rules.calculateCardPower(state, 'attack').value).toBe(7);
    state.players[1]!.locationId = 'miyama_town';
    rules.advanceAbilityPhase(state, 'action', state.round.roundNumber + 1);
    expect(rules.calculateCardPower(state, 'attack').value).toBe(7);
    expect(attack.id).toBe(abilityId);
  });

  it('does not modify an inactive target when its controller has another active attack', () => {
    const state = setup();
    state.cards.push({ instanceId: 'attack-inactive', definitionId: 'fixture.magic', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['attack-inactive'] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId }).ok).toBe(true);
    expect(rules.calculateCardPower(state, 'attack').value).toBe(0);
    expect(rules.calculateCardPower(state, 'attack-inactive').value).toBe(7);
    expect(rules.calculateCardPower(state, 'attack-inactive').lines.some((line) => line.value === 0)).toBe(false);
  });

  it('rejects inactive, defeated, nonparticipant, and replayed engagement without mutating provenance', () => {
    const state = setup();
    state.players[1]!.status = 'eliminated';
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId }).ok).toBe(true);
    expect(rules.calculateCardPower(state, 'attack').value).toBe(7);
    expect(state.abilityRuntime!.ongoingEffects).toHaveLength(1);
    state.players[1]!.status = 'active';
    state.abilityRuntime!.cardState.attack!.active = false;
    expect(rules.calculateCardPower(state, 'attack').value).toBe(7);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId }).ok).toBe(false);
    state.abilityRuntime!.cardState.source!.active = false;
    expect(rules.calculateCardPower(state, 'attack').value).toBe(7);
  });

  it('fails closed for malformed, inactive, and nonparticipant sources while preserving Noble Bloom routes', () => {
    const state = setup();
    const ability = state.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.find((a) => a.id === abilityId)!;
    ability.ruleModifiers[0]!.value = 1;
    expect(rules.getLegalActions(state, 'p1').some((a) => a.type === 'activate_ability' && a.abilityId === abilityId)).toBe(false);
    expect(() => rules.executeAbility(state, { controllerId: 'p1', sourceCardId: 'source', abilityId, variables: {}, selections: {} })).toThrow(/Unsupported combat Magic Resistance/);
    const fresh = setup(); fresh.abilityRuntime!.cardState.source!.active = false;
    expect(fresh.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.find((a) => a.id === abilityId)).toBeDefined();
    expect(rules.getLegalActions(fresh, 'p1').some((a) => a.type === 'activate_ability' && a.abilityId === abilityId)).toBe(false);
    for (const mutate of [
      (a: any) => { a.ruleModifiers[0].scope.controller = 'controller'; },
      (a: any) => { a.ruleModifiers[0].lifecycle.duration = 'while_active'; },
    ]) {
      const malformed = setup(); const candidate = malformed.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.find((a) => a.id === abilityId)!;
      mutate(candidate);
      expect(rules.isCombatMagicResistanceModifierSemantic(candidate)).toBe(false);
    }
    expect(fresh.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.some((a) => a.id.endsWith('noble-bloom'))).toBe(true);
    expect(fresh.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.some((a) => a.id.endsWith('noble-bloom-extra-vp'))).toBe(true);
  });
});
