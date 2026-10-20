import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { resolveTokiomiEffect, tokiomiBurningPowerPenalty, tokiomiItemUsedThisRound } from '../../src/ability/tokiomi-capability';

const archive = JSON.parse(readFileSync('data/authoring/masters/master.tokiomi.json', 'utf8'));
function setup() {
  const pack = rules.loadAuthoringJson(archive); expect(pack.report.filter((entry: any) => entry.cardId !== 'master.tokiomi.skill.ascension')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] }); state.cards = [];
  state.players[0]!.masterCardId = 'master.tokiomi';
  rules.initializeAbilityRuntime(state, pack, { seed: 20261020 });
  return state;
}
function add(state: ReturnType<typeof setup>, definitionId: string, zone: 'skill' | 'field' = 'skill') {
  const id = `${definitionId}:source`;
  state.cards.push({ instanceId: id, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone, visibility: { scope: zone === 'field' ? 'public' : 'owner_only', ...(zone === 'skill' ? { ownerPlayerId: 'p1' } : {}) } as any });
  state.abilityRuntime!.cardState[id] = { active: zone === 'field', faceDown: false, playedRound: state.round.roundNumber };
  return id;
}
describe('P3 Tokiomi owner-complete migration', () => {
  it('materializes exactly the frozen three canonical identities with preserved text and hashes', () => {
    expect(archive.cards.filter((card: any) => card.id.startsWith('master.tokiomi.skill.'))).toHaveLength(3);
    expect(archive.cards.find((card: any) => card.id.endsWith('.ascension')).printedText).toBe('【火炎弹】+2魔力消耗与威力。\n【燃烧】印记更改为-3合计威力且移除时需额外花费2点魔力。');
    expect(archive.sourcePolicy.sourceLocators.generated['master.tokiomi.skill.s2']).toContain('4dcdbe858fe81e809aa7718fcce90844e4c3b122c04f3a745d982217e379d1d2');
  });
  it('runs the real game-start production paths for Elementalist and Careless Tutor', () => {
    const state = setup(); add(state, 'master.tokiomi.skill.s1'); add(state, 'master.tokiomi.skill.s2');
    rules.processAbilityEvent(state, { id: 'tokiomi-game-start', type: 'game_start', playerId: 'p1' });
    expect(state.cards.filter((card) => card.definitionId === 'master.tokiomi.generated.fireball' && card.ownerPlayerId === 'p1')).toHaveLength(1);
    expect(state.cards.filter((card) => card.definitionId === 'master.tokiomi.generated.item' && card.zone === 'hand')).toHaveLength(4);
  });
  it('resolves the ascension through the authenticated Tokiomi gateway', () => {
    const state = setup(); const source = add(state, 'master.tokiomi.skill.ascension', 'field');
    const ability = state.abilityRuntime!.pack.cards['master.tokiomi.skill.ascension']!.abilities[0]!;
    expect(resolveTokiomiEffect(state, { controllerId: 'p1', sourceCardId: source, abilityId: ability.id }, ability, ability.effects[0]!)).toBe(true);
    expect((state.abilityRuntime as any).tokiomi.crestByPlayer.p1).toBe(source);
  });
  it('applies fireball cost/power through the real play and calculation path', () => {
    const state = setup(); const source = add(state, 'master.tokiomi.skill.ascension', 'field');
    const ability = state.abilityRuntime!.pack.cards['master.tokiomi.skill.ascension']!.abilities[0]!;
    expect(resolveTokiomiEffect(state, { controllerId: 'p1', sourceCardId: source, abilityId: ability.id }, ability, ability.effects[0]!)).toBe(true);
    const fireball = add(state, 'master.tokiomi.generated.fireball', 'skill'); state.cards.find((card) => card.instanceId === fireball)!.zone = 'hand'; state.players[0]!.mana = 5; state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    expect(rules.effectiveCardPlayCost(state, 'p1', fireball)).toBe(4);
    expect(rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: fireball }])).toBeUndefined();
    expect(rules.calculateCardPower(state, fireball).value).toBe(4);
    state.cards.find((card) => card.instanceId === source)!.zone = 'skill';
    expect(rules.effectiveCardPlayCost(state, 'p1', fireball)).toBe(2);
    expect(rules.calculateCardPower(state, fireball).value).toBe(2);
    state.cards.find((card) => card.instanceId === source)!.zone = 'field';
    state.abilityRuntime!.cardState[source]!.active = false;
    expect(rules.effectiveCardPlayCost(state, 'p1', fireball)).toBe(2);
  });
  it('distributes items to the last two seats and consumes one item on the real play path', () => {
    const state = setup(); add(state, 'master.tokiomi.skill.s2'); rules.processAbilityEvent(state, { id: 'tokiomi-items', type: 'game_start', playerId: 'p1' });
    const p3Item = state.cards.find((card) => card.definitionId === 'master.tokiomi.generated.item' && card.ownerPlayerId === 'p3')!;
    expect(state.cards.filter((card) => card.definitionId === 'master.tokiomi.generated.item' && card.zone === 'hand').map((card) => card.ownerPlayerId)).toEqual(['p3', 'p2', 'p3', 'p2']);
    state.players[2]!.mana = 5; state.round.activePhase = 'action'; state.round.prioritySeat = state.players[2]!.seat;
    expect(rules.playAbilityCardBatch(state, 'p3', [{ cardInstanceId: p3Item.instanceId }])).toBeUndefined();
    expect(tokiomiItemUsedThisRound(state, 'p3')).toBe(false);
    const secondItem = state.cards.find((card) => card.definitionId === 'master.tokiomi.generated.item' && card.ownerPlayerId === 'p3' && card.zone === 'hand')!;
    expect(() => rules.playAbilityCardBatch(state, 'p3', [{ cardInstanceId: secondItem.instanceId }])).toThrow();
  });
  it('suppresses Tokiomi battle-result VP after item use in the real battlefield resolver', () => {
    const state = setup(); add(state, 'master.tokiomi.skill.s2'); rules.processAbilityEvent(state, { id: 'tokiomi-items-battle', type: 'game_start', playerId: 'p1' });
    state.players[2]!.masterCardId = 'master.tokiomi';
    const item = state.cards.find((card) => card.definitionId === 'master.tokiomi.generated.item' && card.ownerPlayerId === 'p3')!;
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[2]!.seat;
    rules.playAbilityCardBatch(state, 'p3', [{ cardInstanceId: item.instanceId }]);
    state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'miyama_town';
    state.abilityRuntime!.pack.cards['fixture.attack'] = { id: 'fixture.attack', name: 'fixture', cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower: 4 }, playTiming: { phase: 'battle', window: 'controller_combat_action_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any;
    for (const [index, playerId] of ['p2', 'p3'].entries()) { const id = `fixture-attack-${playerId}`; state.cards.push({ instanceId: id, definitionId: 'fixture.attack', ownerPlayerId: playerId, controllerPlayerId: playerId, zone: 'attack_area', visibility: { scope: 'public' } }); state.abilityRuntime!.cardState[id] = { active: true, faceDown: false, playedRound: state.round.roundNumber }; }
    const result = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town', revealHiddenEvents: false }).nextState.battleResults.at(-1)!;
    expect(result.winnerPlayerIds).toContain('p3');
    expect(result.vpAdjustments?.some((adjustment) => adjustment.playerId === 'p3')).toBe(false);
  });
  it('keeps non-Tokiomi item users eligible for both competition and location rewards', () => {
    const state = setup(); add(state, 'master.tokiomi.skill.s2'); rules.processAbilityEvent(state, { id: 'tokiomi-items-other', type: 'game_start', playerId: 'p1' });
    const item = state.cards.find((card) => card.definitionId === 'master.tokiomi.generated.item' && card.ownerPlayerId === 'p3')!;
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[2]!.seat;
    rules.playAbilityCardBatch(state, 'p3', [{ cardInstanceId: item.instanceId }]);
    state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'miyama_town';
    const location = state.map.locations.find((entry) => entry.id === 'miyama_town')!;
    location.vpRewardRules = { ...location.vpRewardRules, location: 1 };
    state.abilityRuntime!.pack.cards['fixture.attack'] = { id: 'fixture.attack', name: 'fixture', cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower: 4 }, playTiming: { phase: 'battle', window: 'controller_combat_action_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any;
    for (const playerId of ['p2', 'p3']) { const id = `fixture-other-${playerId}`; state.cards.push({ instanceId: id, definitionId: 'fixture.attack', ownerPlayerId: playerId, controllerPlayerId: playerId, zone: 'attack_area', visibility: { scope: 'public' } }); state.abilityRuntime!.cardState[id] = { active: true, faceDown: false, playedRound: state.round.roundNumber }; }
    const result = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town', revealHiddenEvents: false }).nextState.battleResults.at(-1)!;
    expect(result.vpAdjustments?.some((adjustment) => adjustment.playerId === 'p3' && adjustment.source === 'competition_vp')).toBe(true);
    expect(result.vpAdjustments?.some((adjustment) => adjustment.playerId === 'p3' && adjustment.source === 'location_vp')).toBe(true);
  });
  it('applies and removes burning through the production power/removal consumers', () => {
    const state = setup(); const crest = add(state, 'master.tokiomi.skill.ascension', 'field');
    const ability = state.abilityRuntime!.pack.cards['master.tokiomi.skill.ascension']!.abilities[0]!;
    expect(resolveTokiomiEffect(state, { controllerId: 'p1', sourceCardId: crest, abilityId: ability.id }, ability, ability.effects[0]!)).toBe(true);
    const attack = add(state, 'master.tokiomi.generated.fireball', 'field');
    state.abilityRuntime!.cardState[attack]!.markers = ['tokiomi.burning'];
    expect(tokiomiBurningPowerPenalty(state, attack)).toBe(-3);
    expect(rules.calculateCardPower(state, attack).value).toBe(1);
    expect(rules.calculateCardPower(state, attack).value).toBe(1);
  });
});
