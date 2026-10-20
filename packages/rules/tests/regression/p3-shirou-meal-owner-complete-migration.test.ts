import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.shirou-meal';
const ASC = `${ROOT}.skill.ascension`;
const S1 = `${ROOT}.skill.s1`;
const S2 = `${ROOT}.skill.s2`;
const PATH = 'data/authoring/masters/master.shirou-meal.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

function add(state: GameState, definitionId: string, zone: 'skill' | 'field' | 'deck' | 'discard' = 'skill', active = false): string {
  const instanceId = `shirou-meal:${definitionId.split('.').at(-1)}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
    visibility: zone === 'field' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

function setup(): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.masterCardId = ROOT;
  state.players[0]!.locationId = 'shinto';
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261020 });
  (state as any).modeState = {
    terrainAssignments: { shinto: ['p1'] },
    cardAttributes: {
      'event.strength': ['力量', '特殊'],
      'event.magic': ['魔术', '宝具'],
      'situation.speed': ['迅捷'],
      'foreign.special': ['特殊'],
    },
  };
  state.eventPlacements = [{
    locationId: 'shinto', eventCardId: 'event.strength', visibility: { scope: 'public' },
  }, {
    locationId: 'shinto', eventCardId: 'event.magic', visibility: { scope: 'public' },
  }] as any;
  state.currentSituationCardId = 'situation.speed';
  return state;
}

describe('P3 Shirou Meal owner-complete migration', () => {
  it('preserves all three frozen cards, exact text, eight clause hashes, source image locator, and canonical pack placement', () => {
    expect(archive.id).toBe(ROOT);
    expect(archive.cards.map((entry: any) => entry.id)).toEqual([ASC, S1, S2]);
    expect(Object.keys(loaded.cards).sort()).toEqual([ASC, S1, S2].sort());
    const rows = [...inventory.staticSkills, ...inventory.dynamicSkills].filter((entry: any) =>
      [ASC, S1, S2].includes(entry.canonicalAbilityId));
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      const card = archive.cards.find((entry: any) => entry.id === row.canonicalAbilityId);
      expect(card.printedText).toBe(row.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[row.canonicalAbilityId])
        .toBe(`legacy-content.json#master/master.shirou-meal/${row.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of row.clauses) {
        expect(archive.sourcePolicy.sourceLocators.generated[row.canonicalAbilityId])
          .toContain(`sha256=${clause.source.sha256}`);
        expect(archive.sourcePolicy.clauseEvidence).toContainEqual(expect.objectContaining({
          abilityId: row.canonicalAbilityId, sha256: clause.source.sha256, text: clause.text,
        }));
      }
    }
    expect(archive.sources[0].imageOrder).toEqual(['images/masters/卫宫士郎（今天的饭）.png']);
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    const generated = JSON.parse(readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8')) as any;
    const evidence = JSON.parse(readFileSync('data/generated/fd-playtest-v1.evidence-report.json', 'utf8')) as any;
    expect(generated.rules.sourceMap[ASC]).toMatchObject({ archiveId: ROOT });
    expect(generated.rules.sourceMap[`${S1}#shirou-meal.procurement`]).toMatchObject({ archiveId: ROOT });
    for (const id of [ASC, S1, S2]) expect(evidence.entities.find((entry: any) => entry.entityId === id)).toBeDefined();
  });

  it('charges one food for ascension play, grants per-food attribute power, and discards deck top once at round end', () => {
    const state = setup();
    const ascension = add(state, ASC);
    const insufficient = setup();
    const unpaidAscension = add(insufficient, ASC);
    expect(rules.getLegalActions(insufficient, 'p1').some((action) => action.type === 'play_card' && action.cardInstanceId === unpaidAscension)).toBe(false);
    expect(rules.dispatchAbilityCommand(insufficient, 'p1', { type: 'play_card', cardInstanceId: unpaidAscension }).ok).toBe(false);
    add(state, 'test.deck.top', 'deck');
    const foodBefore = rules.shirouMealFood(state, 'p1');
    rules.grantShirouMealFood(state, 'p1', '肉', 2);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: ascension }).ok).toBe(true);
    expect(rules.shirouMealFood(state, 'p1')).toEqual({ 肉: foodBefore.肉 + 1, 蔬菜: 0, 鱼: 0 });
    expect(state.cards.find((entry) => entry.instanceId === ascension)?.zone).toBe('field');
    expect(rules.shirouMealAscensionPowerBonus(state, ascension, ['力量', '魔术'])).toBe(1);
    const foreignAscension = add(state, ASC, 'field', true);
    state.cards.find((entry) => entry.instanceId === foreignAscension)!.ownerPlayerId = 'p2';
    state.cards.find((entry) => entry.instanceId === foreignAscension)!.controllerPlayerId = 'p2';
    expect(rules.shirouMealAscensionPowerBonus(state, foreignAscension, ['力量'])).toBe(0);
    rules.processAbilityEvent(state, { id: 'shirou-meal-round-end', type: 'round_end', playerId: 'p1' });
    expect(state.cards.find((entry) => entry.definitionId === 'test.deck.top')?.zone).toBe('discard');
    const discarded = state.abilityRuntime!.events.filter((event) => event.type === 'shirou_meal_ascension_discard_top');
    expect(discarded).toHaveLength(1);
    rules.processAbilityEvent(state, { id: 'shirou-meal-round-end', type: 'round_end', playerId: 'p1' });
    expect(state.abilityRuntime!.events.filter((event) => event.type === 'shirou_meal_ascension_discard_top')).toHaveLength(1);
  });

  it('filters procurement to positive terrain and non-special/non-noble attributes, and is once per attribute per round', () => {
    const state = setup();
    const source = add(state, S1, 'field', true);
    expect(rules.canShirouMealProcurement(state, 'p1')).toBe(true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'shirou-meal.procurement' }).ok).toBe(true);
    expect(rules.shirouMealFood(state, 'p1')).toEqual({ 肉: 1, 蔬菜: 1, 鱼: 1 });
    expect(rules.canShirouMealProcurement(state, 'p1')).toBe(false);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'shirou-meal.procurement' }).ok).toBe(false);
    state.round.roundNumber += 1;
    state.round.prioritySeat = 1;
    expect(rules.canShirouMealProcurement(state, 'p1')).toBe(true);
    expect(rules.shirouMealProcurement(state, 'p1', source, 'shirou-meal.procurement')).toBe(true);
    expect(rules.shirouMealFood(state, 'p1')).toEqual({ 肉: 2, 蔬菜: 2, 鱼: 2 });
    (state as any).modeState.terrainAssignments = {};
    state.round.roundNumber += 1;
    expect(rules.canShirouMealProcurement(state, 'p1')).toBe(false);
  });

  it('uses remaining attributes for a later same-round S1 activation', () => {
    const state = setup();
    const source = add(state, S1, 'field', true);
    state.eventPlacements = [{ locationId: 'shinto', eventCardId: 'event.strength', visibility: { scope: 'public' } }] as any;
    state.currentSituationCardId = undefined;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'shirou-meal.procurement' }).ok).toBe(true);
    expect(rules.shirouMealFood(state, 'p1')).toEqual({ 肉: 1, 蔬菜: 0, 鱼: 0 });
    state.currentSituationCardId = 'situation.speed';
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'shirou-meal.procurement' }).ok).toBe(true);
    expect(rules.shirouMealFood(state, 'p1')).toEqual({ 肉: 1, 蔬菜: 1, 鱼: 0 });
  });

  it('requires three food, resolves same/different menu branches, and protects exactly the next automatic recycle', () => {
    const state = setup();
    const source = add(state, S2, 'field', true);
    rules.grantShirouMealFood(state, 'p1', '肉', 3);
    const beforeVp = state.players[0]!.vp;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'shirou-meal.menu' }).ok).toBe(true);
    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(decision.candidates).toEqual(['肉,肉,肉']);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['肉,肉,肉'] }).ok).toBe(true);
    expect(rules.shirouMealFood(state, 'p1')).toEqual({ 肉: 0, 蔬菜: 0, 鱼: 0 });
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments).toContainEqual(expect.objectContaining({ playerId: 'p1', amount: 6 }));
    add(state, 'test.deck.one', 'deck');
    state.players[0]!.vp = 5;
    rules.shuffleOwnedDeckForShirouMeal(state, 'p1', source, 'shirou-meal.menu');
    expect(state.players[0]!.vp).toBe(5);
    add(state, 'test.discard.one', 'discard');
    rules.shuffleOwnedDeckForShirouMeal(state, 'p1', source, 'shirou-meal.menu');
    expect(state.players[0]!.vp).toBe(2);
    expect(beforeVp).toBe(0);

    rules.grantShirouMealFood(state, 'p1', '肉', 1);
    rules.grantShirouMealFood(state, 'p1', '蔬菜', 1);
    rules.grantShirouMealFood(state, 'p1', '鱼', 1);
    expect(rules.shirouMealMenuChoices(state, 'p1')).toEqual(['肉,蔬菜,鱼']);
    expect(rules.resolveShirouMealAbility(state, {
      controllerId: 'p1', sourceCardId: source, abilityId: 'shirou-meal.menu', selections: { food_selection: ['肉,蔬菜,鱼'] },
    }, loaded.cards[S2]!.abilities[0]!, () => false)).toBe(true);
    expect(state.players[0]!.mana).toBe(8);
    expect(rules.shirouMealFood(state, 'p1')).toEqual({ 肉: 0, 蔬菜: 0, 鱼: 0 });
  });

  it('accumulates every same-food S2 payment and keeps prior bonuses after a mixed payment', () => {
    const state = setup();
    const source = add(state, S2, 'field', true);
    rules.grantShirouMealFood(state, 'p1', '肉', 6);
    for (let index = 0; index < 2; index++) {
      expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'shirou-meal.menu' }).ok).toBe(true);
      const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
      expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['肉,肉,肉'] }).ok).toBe(true);
    }
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments?.filter((entry) => entry.sourceCardId === source && entry.amount === 6)).toHaveLength(2);
    rules.grantShirouMealFood(state, 'p1', '肉', 1);
    rules.grantShirouMealFood(state, 'p1', '蔬菜', 1);
    rules.grantShirouMealFood(state, 'p1', '鱼', 1);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'shirou-meal.menu' }).ok).toBe(true);
    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['肉,蔬菜,鱼'] }).ok).toBe(true);
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments?.filter((entry) => entry.sourceCardId === source && entry.amount === 6)).toHaveLength(2);
  });

  it('rejects a foreign-owner exact-shape menu before spending food', () => {
    const state = setup();
    const source = add(state, S2, 'field', true);
    const physical = state.cards.find((entry) => entry.instanceId === source)!;
    physical.ownerPlayerId = 'p2';
    physical.controllerPlayerId = 'p2';
    rules.grantShirouMealFood(state, 'p1', '肉', 3);
    const before = rules.shirouMealFood(state, 'p1');
    expect(() => rules.resolveShirouMealAbility(state, {
      controllerId: 'p1', sourceCardId: source, abilityId: 'shirou-meal.menu', selections: { food_selection: ['肉,肉,肉'] },
    }, loaded.cards[S2]!.abilities[0]!, () => false)).toThrow('INVALID_SOURCE_OWNER');
    expect(rules.shirouMealFood(state, 'p1')).toEqual(before);
  });

  it('distinguishes authored draw recycle from automatic recycle keep continuation', () => {
    const state = setup();
    const drawDefinition = structuredClone(loaded.cards[S1]!);
    drawDefinition.id = 'test.authored-draw';
    drawDefinition.abilities = [structuredClone(drawDefinition.abilities[0]!)];
    drawDefinition.abilities[0]!.id = 'test.authored-draw.ability';
    drawDefinition.abilities[0]!.effects = [{ type: 'draw_cards', count: 1 }];
    state.abilityRuntime!.pack.cards[drawDefinition.id] = drawDefinition;
    const drawSource = add(state, drawDefinition.id, 'field', true);
    const discard = add(state, 'test.authored-discard', 'discard');
    void discard;
    const meal = add(state, S2, 'field', true);
    state.players[0]!.vp = 5;
    state.abilityRuntime!.shirouMealProtectedNextShuffleByPlayer = { p1: { sourceCardId: meal, abilityId: 'shirou-meal.menu' } };
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: drawSource, abilityId: drawDefinition.abilities[0]!.id }).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(5);
    expect(state.abilityRuntime!.shirouMealProtectedNextShuffleByPlayer?.p1).toBeDefined();

    const providerDefinition = structuredClone(loaded.cards[S1]!);
    providerDefinition.id = 'test.recycle-provider';
    providerDefinition.abilities = [structuredClone(providerDefinition.abilities[0]!)];
    providerDefinition.abilities[0]!.id = 'test.recycle-provider.ability';
    providerDefinition.abilities[0]!.kind = 'passive';
    providerDefinition.abilities[0]!.activation = {};
    providerDefinition.abilities[0]!.effects = [{ type: 'automatic_recycle_keep_gain_counter', counterKey: 'test:counter', keepMax: 3, gain: 1, reason: 'automatic_recycle' }];
    state.abilityRuntime!.pack.cards[providerDefinition.id] = providerDefinition;
    add(state, providerDefinition.id, 'skill');
    add(state, 'test.recycle-discard-a', 'discard');
    add(state, 'test.recycle-discard-b', 'discard');
    const drawSource2 = add(state, drawDefinition.id, 'field', true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: drawSource2, abilityId: drawDefinition.abilities[0]!.id }).ok).toBe(true);
    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('automatic_recycle_keep_v1');
    // The authored draw above intentionally stages the same interaction with
    // provenance=false. Exercise the automatic-recycle continuation branch
    // through the real command resolver after authenticating that provenance.
    (state.abilityRuntime!.pendingDecision!.interaction as any).chargeShirouMealGluttony = true;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [decision.candidates[0]!] }).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(5);
    expect(state.abilityRuntime!.shirouMealProtectedNextShuffleByPlayer?.p1).toBeUndefined();
  });

  it('rejects widened or foreign owner-specific mechanics at the loader gateway', () => {
    const malformed = structuredClone(archive);
    malformed.cards[1].abilities[0].effects[0].foreign = true;
    expect(rules.loadAuthoringJson(malformed).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ cardId: S1, abilityId: 'shirou-meal.procurement', path: 'shirouMeal.gateway', status: 'unsupported' }),
    ]));
    const foreignArchive = structuredClone(archive);
    foreignArchive.cards[1].owner = { type: 'master', id: 'master.foreign' };
    expect(rules.loadAuthoringJson(foreignArchive).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ cardId: S1, abilityId: 'shirou-meal.procurement', path: 'shirouMeal.owner', status: 'unsupported' }),
    ]));
    const foreign = structuredClone(archive.cards[1].abilities[0]);
    foreign.effects[0].type = 'shirou_meal_menu';
    foreign.effects[0].foodCost = 4;
    expect(rules.isAcceptedShirouMealAbility(foreign)).toBe(false);
  });
});
