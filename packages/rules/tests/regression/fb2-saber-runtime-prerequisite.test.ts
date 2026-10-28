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
  state.cards.push({ instanceId: 'attack', definitionId: 'fixture.magic', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
  return state;
}

describe('FB2 Saber runtime prerequisite', () => {
  it('accepts only 魔术 and rejects 魔法 / 魔法/魔术 partitions and unrelated attributes', () => {
    const state = setup();
    const ability = state.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.find((a) => a.id === abilityId)!;
    expect(rules.isCombatMagicResistanceModifierSemantic(ability)).toBe(true);
    for (const attribute of ['魔法', '魔法/魔术', '力量', '特殊']) {
      const altered = structuredClone(ability);
      altered.ruleModifiers[0]!.scope = { ...altered.ruleModifiers[0]!.scope, constraints: [{ type: 'has_attribute', attribute }] };
      expect(rules.isCombatMagicResistanceModifierSemantic(altered)).toBe(false);
    }
  });

  it('sets only an engaged same-battlefield opponent 魔术 attack to zero and expires safely', () => {
    const state = setup();
    const attack = state.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.find((a) => a.id === abilityId)!;
    expect(rules.getLegalActions(state, 'p1')).toEqual(expect.arrayContaining([expect.objectContaining({ abilityId })]));
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId }).ok).toBe(true);
    expect(rules.calculateCardPower(state, 'attack').value).toBe(0);
    expect(state.abilityRuntime!.ongoingEffects).toHaveLength(1);
    state.players[1]!.locationId = 'shinto';
    expect(rules.calculateCardPower(state, 'attack').value).toBe(7);
    state.players[1]!.locationId = 'miyama_town';
    rules.advanceAbilityPhase(state, 'action', state.round.roundNumber + 1);
    expect(rules.calculateCardPower(state, 'attack').value).toBe(7);
    expect(attack.id).toBe(abilityId);
  });

  it('fails closed for malformed, inactive, and nonparticipant sources while preserving Noble Bloom routes', () => {
    const state = setup();
    const ability = state.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.find((a) => a.id === abilityId)!;
    ability.ruleModifiers[0]!.value = 1;
    expect(rules.getLegalActions(state, 'p1').some((a) => a.type === 'activate_ability' && a.abilityId === abilityId)).toBe(false);
    expect(() => rules.executeAbility(state, { controllerId: 'p1', sourceCardId: 'source', abilityId, variables: {}, selections: {} })).toThrow(/Unsupported combat Magic Resistance/);
    const fresh = setup(); fresh.abilityRuntime!.cardState.source!.active = false;
    expect(fresh.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.some((a) => a.id.endsWith('noble-bloom'))).toBe(true);
    expect(fresh.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.some((a) => a.id.endsWith('noble-bloom-extra-vp'))).toBe(true);
  });
});
