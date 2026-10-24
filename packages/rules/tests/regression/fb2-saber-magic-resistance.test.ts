import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.artoria-alt.json', 'utf8')) as any;
const sourceDefinitionId = 'servant.artoria-alt.skill.sc-artoria-alt-3';
const abilityId = 'sc-artoria-alt-3.magic-resistance';

function setup() {
  const pack = rules.loadAuthoringJson(structuredClone(raw));
  (pack.cards as any)['fixture.magic-attack'] = {
    id: 'fixture.magic-attack', name: 'Fixture Magic Attack', cardType: 'servant_attack',
    cardFace: { attributes: ['魔术'], cost: 0, basePower: 7 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
  };
  const state = createSeededGameState();
  state.cards = [];
  state.round.activePhase = 'battle';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  rules.initializeAbilityRuntime(state, pack, { seed: 42 });
  const sourceId = 'fixture-source';
  state.cards.push({ instanceId: sourceId, definitionId: sourceDefinitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState[sourceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  const attackId = 'fixture-opponent-magic';
  state.cards.push({ instanceId: attackId, definitionId: 'fixture.magic-attack', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
  return { state, sourceId, attackId };
}

function ability(state: ReturnType<typeof setup>['state']) {
  return state.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.find((candidate) => candidate.id === abilityId)!;
}

describe('FB2-10 Saber Magic Resistance narrow Power route', () => {
  it('classifies a renamed exact modifier shape without identity routing', () => {
    const s = setup();
    const renamed = structuredClone(ability(s.state));
    renamed.id = 'renamed.magic-resistance';
    expect(rules.isCombatMagicResistanceModifierSemantic(renamed)).toBe(true);
  });

  it('exposes only in combat while active, installs once, and sets same-battlefield Magic attack Power to zero', () => {
    const s = setup();
    expect(rules.getLegalActions(s.state, 'p1')).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'activate_ability', cardInstanceId: s.sourceId, abilityId }),
    ]));
    const result = rules.dispatchAbilityCommand(s.state, 'p1', { type: 'activate_ability', cardInstanceId: s.sourceId, abilityId });
    expect(result.ok).toBe(true);
    expect(rules.calculateCardPower(s.state, s.attackId)).toMatchObject({ value: 0 });
    expect(rules.calculateCardPower(s.state, s.attackId).lines.map((line) => line.value)).toContain(0);
    expect(s.state.abilityRuntime!.ongoingEffects).toHaveLength(1);
    expect(rules.getLegalActions(s.state, 'p1').some((action) => action.type === 'activate_ability' && action.abilityId === abilityId)).toBe(false);
  });

  it('keeps own, non-Magic, and other-battlefield attacks unchanged', () => {
    const s = setup();
    const own = 'fixture-own';
    s.state.cards.push({ instanceId: own, definitionId: 'fixture.magic-attack', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
    const nonMagic = 'fixture-opponent-nonmagic';
    (s.state.abilityRuntime!.pack.cards as any)['fixture.nonmagic'] = { ...(s.state.abilityRuntime!.pack.cards as any)['fixture.magic-attack'], id: 'fixture.nonmagic', cardFace: { attributes: ['特殊'], cost: 0, basePower: 7 } };
    s.state.cards.push({ instanceId: nonMagic, definitionId: 'fixture.nonmagic', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
    const other = 'fixture-other';
    s.state.cards.push({ instanceId: other, definitionId: 'fixture.magic-attack', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
    s.state.players[1]!.locationId = 'shinto';
    const beforeOwn = rules.calculateCardPower(s.state, own).value;
    const beforeNonMagic = rules.calculateCardPower(s.state, nonMagic).value;
    const beforeOther = rules.calculateCardPower(s.state, other).value;
    s.state.players[1]!.locationId = 'miyama_town';
    expect(rules.dispatchAbilityCommand(s.state, 'p1', { type: 'activate_ability', cardInstanceId: s.sourceId, abilityId }).ok).toBe(true);
    expect(rules.calculateCardPower(s.state, own).value).toBe(beforeOwn);
    expect(rules.calculateCardPower(s.state, nonMagic).value).toBe(beforeNonMagic);
    s.state.players[1]!.locationId = 'shinto';
    expect(rules.calculateCardPower(s.state, other).value).toBe(beforeOther);
  });

  it('expires at the next round boundary', () => {
    const s = setup();
    expect(rules.dispatchAbilityCommand(s.state, 'p1', { type: 'activate_ability', cardInstanceId: s.sourceId, abilityId }).ok).toBe(true);
    expect(rules.calculateCardPower(s.state, s.attackId).value).toBe(0);
    rules.advanceAbilityPhase(s.state, 'action', s.state.round.roundNumber + 1);
    expect(s.state.abilityRuntime!.ongoingEffects).toHaveLength(0);
    expect(rules.calculateCardPower(s.state, s.attackId).value).toBe(7);
  });

  it.each([
    ['wrong phase', (a: any) => { a.activation.phase = 'action'; }],
    ['wrong window', (a: any) => { a.activation.opens = 'controller_action_window'; }],
    ['wrong source state', (a: any) => { a.activation.requiresSourceState = 'inactive'; }],
    ['wrong modifier type', (a: any) => { a.ruleModifiers[0].type = 'power_modifier'; }],
    ['wrong operation', (a: any) => { a.ruleModifiers[0].operation = 'add'; }],
    ['wrong rule', (a: any) => { a.ruleModifiers[0].rule = 'card.currentPower'; }],
    ['wrong controller scope', (a: any) => { a.ruleModifiers[0].scope.controller = 'controller'; }],
    ['wrong object scope', (a: any) => { a.ruleModifiers[0].scope.object = 'source_card'; }],
    ['wrong attribute', (a: any) => { a.ruleModifiers[0].scope.constraints[0].attribute = '特殊'; }],
    ['wrong value', (a: any) => { a.ruleModifiers[0].value = 1; }],
    ['wrong duration', (a: any) => { a.ruleModifiers[0].lifecycle.duration = 'while_active'; }],
    ['extra modifier', (a: any) => { a.ruleModifiers.push(structuredClone(a.ruleModifiers[0])); }],
    ['extra effect', (a: any) => { a.effects.push({ type: 'adjust_mana', amount: 1, player: 'controller' }); }],
  ])('fails closed for %s before generic installation', (_label, mutate) => {
    const s = setup();
    mutate(ability(s.state));
    const before = JSON.stringify({
      cards: s.state.cards, players: s.state.players, ongoingEffects: s.state.abilityRuntime!.ongoingEffects,
      events: s.state.abilityRuntime!.events, revision: s.state.abilityRuntime!.revision,
    });
    expect(rules.getLegalActions(s.state, 'p1').some((action) => action.type === 'activate_ability' && action.abilityId === abilityId)).toBe(false);
    const result = rules.dispatchAbilityCommand(s.state, 'p1', { type: 'activate_ability', cardInstanceId: s.sourceId, abilityId });
    expect(result.ok).toBe(false);
    expect(JSON.stringify({
      cards: s.state.cards, players: s.state.players, ongoingEffects: s.state.abilityRuntime!.ongoingEffects,
      events: s.state.abilityRuntime!.events, revision: s.state.abilityRuntime!.revision,
    })).toBe(before);
  });

  it('keeps accepted B18/B19 optional VP routes available through the same pack', () => {
    const s = setup();
    const source = ability(s.state);
    expect(source.kind).toBe('phase_action');
    expect(s.state.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.some((a) => a.id.endsWith('noble-bloom'))).toBe(true);
    expect(s.state.abilityRuntime!.pack.cards[sourceDefinitionId]!.abilities.some((a) => a.id.endsWith('noble-bloom-extra-vp'))).toBe(true);
  });
});
