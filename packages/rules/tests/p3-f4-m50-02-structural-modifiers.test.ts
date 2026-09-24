import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { classifyM50AdditiveCardModifier, m50AdditiveCardAdjustment } from '../src/ability/m50-structural-card-modifiers';
import type { AuthoringAbility, AuthoringCard, RuleNode } from '../src/ability/types';
import { createSeededGameState } from '../src/tools/seeded-state';

function ability(modifier: RuleNode): AuthoringAbility {
  return {
    id: 'm50-structural', kind: 'passive', markers: ['m50_structured_v1'], conditions: [{ type: 'source_owned' }],
    targets: [], effects: [], cost: [], ruleModifiers: [modifier], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  } as AuthoringAbility;
}
function modifier(rule: 'card_power' | 'card_cost', cards: RuleNode, value: number): RuleNode {
  return { id: `m-${rule}`, operation: 'add', rule, scope: { subject: 'controller', cards }, value, lifecycle: { duration: 'permanent' } };
}
function sourceCard(abilities: AuthoringAbility[]): AuthoringCard {
  return {
    id: 'master.fixture.skill.m50', name: 'fixture source', cardType: 'master_skill', owner: { type: 'master', id: 'master.fixture' },
    cardFace: { cost: 0, basePower: 0, attributes: [] }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities, mode: 'automatic',
  } as AuthoringCard;
}
function setup(abilities: AuthoringAbility[]) {
  const raw = { schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: 'master.fixture', name: 'fixture', class: 'Master', cards: [sourceCard(abilities)] };
  const pack: any = rules.loadAuthoringJson(raw); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{ instanceId: 'source', definitionId: 'master.fixture.skill.m50', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  rules.initializeAbilityRuntime(state, pack, { seed: 5202 });
  const runtimePack: any = state.abilityRuntime!.pack;
  runtimePack.cards['fixture.basic.strength'] = { id: 'fixture.basic.strength', name: 'basic', cardType: 'basic_attack', cardFace: { cost: 2, basePower: 3, attributes: ['力量'] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic', playKind: 'attack', destinationZone: 'attack_area' };
  runtimePack.cards['fixture.basic.magic'] = { ...runtimePack.cards['fixture.basic.strength'], id: 'fixture.basic.magic', cardFace: { cost: 2, basePower: 3, attributes: ['魔术'] } };
  state.cards.push(
    { instanceId: 'strength', definitionId: 'fixture.basic.strength', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'magic', definitionId: 'fixture.basic.magic', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'enemy', definitionId: 'fixture.basic.strength', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } },
  );
  for (const id of ['strength','magic','enemy']) state.abilityRuntime!.cardState[id] = { active: false, faceDown: false };
  return state;
}

describe('M50 identity-free additive card modifiers', () => {
  it('classifies only the exact marked source-owned permanent additive envelope', () => {
    const m = modifier('card_power', { basic: true, attributesAny: ['力量'] }, 4);
    expect(classifyM50AdditiveCardModifier(ability(m), m)).toMatchObject({ rule: 'card_power', amount: 4, sourceRequirement: 'owned', basic: true, attributesAny: ['力量'] });
    const unmarked = { ...ability(m), markers: [] } as AuthoringAbility;
    expect(classifyM50AdditiveCardModifier(unmarked, m)).toBeUndefined();
    expect(classifyM50AdditiveCardModifier(ability({ ...m, operation: 'multiply' }), { ...m, operation: 'multiply' })).toBeUndefined();
    expect(classifyM50AdditiveCardModifier(ability({ ...m, lifecycle: { duration: 'this_round' } }), { ...m, lifecycle: { duration: 'this_round' } })).toBeUndefined();
  });

  it('gates additive basic-card modifiers on the authoritative structured player flag store', () => {
    const conditional = (rule: 'card_power' | 'card_cost', value: number): AuthoringAbility => ({
      ...ability({ id: `flag-${rule}`, operation: 'add', rule, scope: { subject: 'controller', cards: { basic: true } }, value }),
      id: `flag-${rule}`,
      conditions: [{ type: 'player_flag_equals', key: 'moonPrincessThirstActive', value: true }],
    } as AuthoringAbility);
    const state = setup([conditional('card_power', 2), conditional('card_cost', 1)]);
    expect(m50AdditiveCardAdjustment(state, 'strength')).toEqual({ power: 0, cost: 0 });
    state.abilityRuntime!.structuredPlayerFlagsByPlayer = { p1: { moonPrincessThirstActive: true } };
    expect(m50AdditiveCardAdjustment(state, 'strength')).toEqual({ power: 2, cost: 1 });
    expect(m50AdditiveCardAdjustment(state, 'magic')).toEqual({ power: 2, cost: 1 });
    expect(m50AdditiveCardAdjustment(state, 'enemy')).toEqual({ power: 0, cost: 0 });
    state.abilityRuntime!.structuredPlayerFlagsByPlayer.p1!.moonPrincessThirstActive = false;
    expect(m50AdditiveCardAdjustment(state, 'strength')).toEqual({ power: 0, cost: 0 });
    const malformed = conditional('card_power', 2);
    malformed.conditions = [{ type: 'player_flag_equals', key: 'moonPrincessThirstActive', value: true, extra: true }];
    expect(classifyM50AdditiveCardModifier(malformed, malformed.ruleModifiers[0]!)).toBeUndefined();
  });

  it('applies matching power/cost selectors without crossing attributes or controller ownership', () => {
    const state = setup([
      ability(modifier('card_power', { basic: true, attributesAny: ['力量'] }, 4)),
      { ...ability(modifier('card_cost', { definitionIds: ['fixture.basic.strength'] }, 3)), id: 'm50-cost' },
    ]);
    expect(m50AdditiveCardAdjustment(state, 'strength')).toEqual({ power: 4, cost: 3 });
    expect(m50AdditiveCardAdjustment(state, 'magic')).toEqual({ power: 0, cost: 0 });
    expect(m50AdditiveCardAdjustment(state, 'enemy')).toEqual({ power: 0, cost: 0 });
  });
});
