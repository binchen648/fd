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
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    const persisted = JSON.parse(JSON.stringify(state)) as GameState;
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(persisted)).toBe(true);
    const forged = structuredClone(persisted);
    forged.cards.find((entry) => entry.instanceId === source)!.ownerPlayerId = 'p2';
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(forged)).toBe(false);
  });

  it('charges ascension food on a real waived-mana effect play, and rejects zero food atomically', () => {
    const state = setup();
    const reactionAbility = {
      id: 'fixture.play-hand-free', kind: 'phase_action', printedClause: 'fixture.play-hand-free',
      activation: { phase: 'combat', opens: 'controller_combat_action_window' }, conditions: [],
      targets: [{ id: 'hand_card', type: 'card_instance', scope: { zone: 'hand', owner: 'controller' }, count: { min: 1, max: 1 }, constraints: [{ type: 'effect_playable_face_up' }] }],
      effects: [{ type: 'spend_reaction_counter_play_hand_free', counterKey: 'test:shirou-food', amount: 7, sourceZone: 'hand', payCardCosts: false, target: 'hand_card' }],
      cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    } as any;
    const reactionDefinition = {
      id: 'fixture.shirou-waived-mana-source', name: 'fixture.shirou-waived-mana-source', cardType: 'master_skill',
      owner: { type: 'master', id: ROOT }, cardFace: { typeLabel: '', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'combat', window: 'controller_combat_action_window' }, playRequirements: [], abilities: [reactionAbility],
      verification: { implementationStatus: 'complete' }, mode: 'automatic',
    };
    state.abilityRuntime!.pack.cards[reactionDefinition.id] = reactionDefinition as any;
    const reaction = add(state, reactionDefinition.id);
    const ascension = add(state, ASC, 'hand');
    state.round.activePhase = 'combat';
    rules.setReactionCounterValue(state, 'p1', 'test:shirou-food', 7);
    const noFood = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: reaction, abilityId: reactionAbility.id });
    expect(noFood.ok).toBe(false);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    rules.grantShirouMealFood(state, 'p1', '肉', 1);
    const activation = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: reaction, abilityId: reactionAbility.id });
    expect(activation, JSON.stringify(activation)).toMatchObject({ ok: true });
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [ascension] }).ok).toBe(true);
    expect(rules.shirouMealFood(state, 'p1')).toEqual({ 肉: 0, 蔬菜: 0, 鱼: 0 });
    expect(rules.reactionCounterValue(state, 'p1', 'test:shirou-food')).toBe(0);
    expect(state.cards.find((entry) => entry.instanceId === ascension)?.zone).toBe('field');
  });

  it('routes normal attached-supply recycle through the real keep continuation with true gluttony provenance', () => {
    const state = setup();
    const shell = (id: string, kind: string, activation: Record<string, unknown>, effects: any[]) => ({
      id, kind, printedClause: id, activation, conditions: [], targets: [], effects, cost: [], ruleModifiers: [], creates: [],
      lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    });
    const seed = shell('fixture.seed', 'forced_trigger', { trigger: 'after_master_ascension_unlocked' }, [{
      type: rules.SEED_ATTACHED_SUPPLY_EFFECT, cards: [
        { definitionId: 'basic.preparation', count: 3 }, { definitionId: 'basic.surveil', count: 2 },
      ],
    }]);
    const play = shell('fixture.play-prep', 'phase_action', { phase: 'action', opens: 'controller_action_window' }, [{
      type: rules.PLAY_ATTACHED_SUPPLY_DEFINITION_EFFECT, definitionId: 'basic.preparation', drawAfterPlay: 1, maxPerRound: 1,
    }]);
    const provider = shell('fixture.recycle-provider', 'passive', {}, [{
      type: 'automatic_recycle_keep_gain_counter', counterKey: 'fixture:recycle', keepMax: 3, gain: 1, reason: 'automatic_recycle',
    }]);
    for (const definitionId of ['basic.preparation', 'basic.surveil']) {
      state.abilityRuntime!.pack.cards[definitionId] = {
        id: definitionId, name: definitionId, cardType: 'basic_attack', ownerId: 'fixture',
        cardFace: { typeLabel: 'fixture', cost: 0, basePower: 0, attributes: [] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
        mode: 'automatic', playKind: 'attack', destinationZone: 'attack_area',
      } as any;
    }
    const fixtureDefinition = structuredClone(state.abilityRuntime!.pack.cards[ASC]!);
    fixtureDefinition.id = 'fixture.attached-supply-provider';
    fixtureDefinition.abilities = [seed, play, provider] as any;
    state.abilityRuntime!.pack.cards[fixtureDefinition.id] = fixtureDefinition as any;
    const providerCard = add(state, fixtureDefinition.id, 'skill');
    rules.processAbilityEvent(state, { id: 'fixture-seed', type: 'after_master_ascension_unlocked', playerId: 'p1', sourceCardId: providerCard });

    const menu = add(state, S2, 'field', true);
    rules.grantShirouMealFood(state, 'p1', '肉', 3);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: menu, abilityId: 'shirou-meal.menu' }).ok).toBe(true);
    const menuDecision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: menuDecision.id, selectedIds: ['肉,肉,肉'] }).ok).toBe(true);

    state.cards = state.cards.filter((card) => card.ownerPlayerId !== 'p1' || !['deck', 'discard'].includes(card.zone));
    const discarded = add(state, 'fixture.normal-discard', 'discard');
    state.players[0]!.vp = 5;
    const playResult = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: providerCard, abilityId: play.id });
    expect(playResult, JSON.stringify(playResult)).toMatchObject({ ok: true });
    const pending = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(state.abilityRuntime!.pendingDecision!.interaction).toMatchObject({ kind: 'automatic_recycle_keep_v1', chargeShirouMealGluttony: true });
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [] }).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(5);
    expect(state.abilityRuntime!.shirouMealProtectedNextShuffleByPlayer?.p1).toBeUndefined();
    expect(state.cards.find((card) => card.instanceId === discarded)?.zone).toBe('hand');

    state.round.roundNumber += 1;
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
    const secondDiscard = add(state, 'fixture.normal-discard-2', 'discard');
    state.players[0]!.vp = 5;
    const second = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: providerCard, abilityId: play.id });
    expect(second, JSON.stringify(second)).toMatchObject({ ok: true });
    const secondPending = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(state.abilityRuntime!.pendingDecision!.interaction).toMatchObject({ kind: 'automatic_recycle_keep_v1', chargeShirouMealGluttony: true });
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: secondPending.id, selectedIds: [] }).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(2);
    expect(state.cards.find((card) => card.instanceId === secondDiscard)?.zone).toBe('hand');
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
    // The authored draw must carry its effect-driven provenance through the
    // real continuation; forged pending metadata is intentionally not used.
    expect(state.abilityRuntime!.pendingDecision!.interaction).toMatchObject({ chargeShirouMealGluttony: false });
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [decision.candidates[0]!] }).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(5);
    expect(state.abilityRuntime!.shirouMealProtectedNextShuffleByPlayer?.p1).toBeDefined();
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
