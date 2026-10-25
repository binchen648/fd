import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { isRequiredAdditionalPlayMarker } from '../../src/ability/required-additional-play';
import type { AuthoringAbility, AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

type Archive = Parameters<typeof rules.loadAuthoringJson>[0];

const SUPPORT_ID = 'master.maiya.deck.support-shot';
const NORMAL_1 = 'fixture.fb2-16.normal-1';
const NORMAL_2 = 'fixture.fb2-16.normal-2';
const NORMAL_3 = 'fixture.fb2-16.normal-3';
const DRAW_ID = 'fixture.fb2-16.draw';
const MARKED_EFFECT_ID = 'fixture.fb2-16.marked-effect';
const EFFECT_SOURCE_ID = 'master.kiritsugu.skill.time-alter';

function archive(path: string): Archive {
  return JSON.parse(readFileSync(path, 'utf8')) as Archive;
}

function basicAttack(id: string, cost = 1, abilities: AuthoringAbility[] = []): AuthoringCard {
  return {
    id,
    name: id,
    cardType: 'basic_attack',
    cardFace: { cost, basePower: 1, attributes: ['fixture'] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [],
    abilities,
    mode: 'automatic',
  };
}

function canonicalMarker(): AuthoringAbility {
  const pack = rules.loadAuthoringJson(archive('data/authoring/masters/master.maiya.json'));
  return structuredClone(pack.cards[SUPPORT_ID]!.abilities.find((ability) =>
    ability.effects.some((effect) => effect.type === 'append_only_rule'))!);
}

function setup(options: { witness?: boolean; effectRoute?: boolean; malformedResponse?: boolean } = {}): GameState {
  const maiya = rules.loadAuthoringJson(archive('data/authoring/masters/master.maiya.json'));
  const pack = structuredClone(maiya);
  if (options.malformedResponse) {
    const marker = pack.cards[SUPPORT_ID]!.abilities.find((ability) =>
      ability.effects.some((effect) => effect.type === 'append_only_rule'))!;
    marker.responseWindow = { ...marker.responseWindow, priority: 'turn_order' };
  }
  pack.cards[NORMAL_1] = basicAttack(NORMAL_1);
  pack.cards[NORMAL_2] = basicAttack(NORMAL_2);
  pack.cards[NORMAL_3] = basicAttack(NORMAL_3);
  pack.cards[DRAW_ID] = basicAttack(DRAW_ID, 0);

  if (options.witness) {
    const drake = rules.loadAuthoringJson(archive('data/authoring/servants/servant.drake.json'));
    const draw = structuredClone(drake.cards['servant.drake.skill.sc-drake-1']!.abilities
      .find((ability) => ability.id === 'sc-drake-1.draw')!);
    pack.cards[SUPPORT_ID] = structuredClone(pack.cards[SUPPORT_ID]!);
    pack.cards[SUPPORT_ID]!.abilities.push(draw);
  }

  if (options.effectRoute) {
    const kiritsugu = rules.loadAuthoringJson(archive('data/authoring/masters/master.kiritsugu.json'));
    pack.cards[EFFECT_SOURCE_ID] = structuredClone(kiritsugu.cards[EFFECT_SOURCE_ID]!);
    pack.cards[MARKED_EFFECT_ID] = basicAttack(MARKED_EFFECT_ID, 0, [canonicalMarker()]);
  }

  const state = createSeededGameState();
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.mana = 20;
  state.players[0]!.locationId = 'recon';
  state.players[0]!.masterCardId = 'master.maiya';
  rules.initializeAbilityRuntime(state, pack, { seed: 42 });
  return state;
}

function add(state: GameState, definitionId: string, zone: 'hand' | 'skill' | 'deck' = 'hand'): string {
  const instanceId = `fb2-16-${state.cards.length}-${definitionId}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone,
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  return instanceId;
}

describe('P3-FB2-16 required additional-play marker', () => {
  it('recognizes only the exact structural marker independent of identity or printed text', () => {
    const marker = canonicalMarker();
    const renamed = structuredClone(marker);
    renamed.id = 'fixture.renamed-marker';
    renamed.printedClause = 'identity-independent fixture';
    expect(isRequiredAdditionalPlayMarker(renamed)).toBe(true);

    const foreignRule = structuredClone(marker);
    foreignRule.effects[0] = { type: 'append_only_rule', rule: 'ignore_battle_loss_effects' };
    expect(isRequiredAdditionalPlayMarker(foreignRule)).toBe(false);

    const extraField = structuredClone(marker);
    extraField.effects[0] = { type: 'append_only_rule', reason: 'extra' };
    expect(isRequiredAdditionalPlayMarker(extraField)).toBe(false);

    const wrongTrigger = structuredClone(marker);
    wrongTrigger.activation = { trigger: 'on_card_played' };
    expect(isRequiredAdditionalPlayMarker(wrongTrigger)).toBe(false);

    const extraResponseField = structuredClone(marker);
    extraResponseField.responseWindow = { ...extraResponseField.responseWindow, priority: 'turn_order' };
    expect(isRequiredAdditionalPlayMarker(extraResponseField)).toBe(false);
  });

  it('fails closed for a preserved response-window near-match instead of granting additional-play permission', () => {
    const state = setup({ malformedResponse: true });
    const ordinary = add(state, NORMAL_1);
    const malformed = add(state, SUPPORT_ID, 'skill');

    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: ordinary }).ok).toBe(true);
    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual(
      expect.objectContaining({ type: 'stage_attack_card', cardInstanceId: malformed }),
    );
    const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: malformed });
    expect(result.ok).toBe(false);
    expect(state.cards.find((card) => card.instanceId === malformed)?.zone).toBe('skill');
  });

  it('rejects standalone play but allows two ordinary attacks plus one required-additional card in one paid batch', () => {
    const state = setup({ witness: true });
    state.players[0]!.mana = 10;
    const first = add(state, NORMAL_1, 'hand');
    const second = add(state, NORMAL_2, 'hand');
    const additional = add(state, SUPPORT_ID, 'skill');
    const draw = add(state, DRAW_ID, 'deck');

    const standalone = rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: additional });
    expect(standalone.ok).toBe(false);
    expect(standalone.rejection?.code).toBe('append_only');

    rules.playAbilityCardBatch(state, 'p1', [
      { cardInstanceId: first },
      { cardInstanceId: second },
      { cardInstanceId: additional },
    ]);

    expect(state.players[0]!.mana).toBe(6);
    expect([first, second, additional].map((id) => state.cards.find((card) => card.instanceId === id)?.zone))
      .toEqual(['attack_area', 'attack_area', 'attack_area']);
    expect(state.cards.find((card) => card.instanceId === draw)?.zone).toBe('hand');
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'cards_drawn',
      sourceCardId: additional,
      abilityId: 'sc-drake-1.draw',
    }));
    expect(rules.projectAbilityState(state, 'p1').playSummary).toEqual({
      cardsPlayedThisRound: 3,
      attacksDeclaredThisRound: 2,
      attackAreaOccupancy: 3,
      attackAllowance: 2,
    });
  });

  it('allows multiple required-additional cards without consuming normal attack allowance', () => {
    const state = setup();
    const first = add(state, NORMAL_1);
    const second = add(state, NORMAL_2);
    const extraA = add(state, SUPPORT_ID, 'skill');
    const extraB = add(state, SUPPORT_ID, 'skill');

    expect(() => rules.playAbilityCardBatch(state, 'p1', [
      { cardInstanceId: first },
      { cardInstanceId: second },
      { cardInstanceId: extraA },
      { cardInstanceId: extraB },
    ])).not.toThrow();

    expect(rules.projectAbilityState(state, 'p1').playSummary).toMatchObject({
      cardsPlayedThisRound: 4,
      attacksDeclaredThisRound: 2,
      attackAreaOccupancy: 4,
      attackAllowance: 2,
    });
  });

  it('keeps aggregate payment atomic when an additional card makes the batch unaffordable', () => {
    const state = setup();
    state.players[0]!.mana = 3;
    const first = add(state, NORMAL_1);
    const second = add(state, NORMAL_2);
    const additional = add(state, SUPPORT_ID, 'skill');
    const before = JSON.stringify(state);

    expect(() => rules.playAbilityCardBatch(state, 'p1', [
      { cardInstanceId: first },
      { cardInstanceId: second },
      { cardInstanceId: additional },
    ])).toThrow(/aggregate batch cost/);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('lets staged normal play append the marked card but never exposes it as the first staged card', () => {
    const state = setup();
    const first = add(state, NORMAL_1);
    const second = add(state, NORMAL_2);
    const additional = add(state, SUPPORT_ID, 'skill');

    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual({
      type: 'stage_attack_card', cardInstanceId: additional,
    });
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'stage_attack_card', cardInstanceId: additional,
    }).rejection?.code).toBe('append_only');

    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: first }).ok).toBe(true);
    expect(rules.getLegalActions(state, 'p1')).toContainEqual({ type: 'stage_attack_card', cardInstanceId: additional });
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: additional }).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: second }).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'confirm_staged_attack' }).ok).toBe(true);

    expect(rules.projectAbilityState(state, 'p1').playSummary).toMatchObject({
      cardsPlayedThisRound: 3,
      attacksDeclaredThisRound: 2,
      attackAreaOccupancy: 3,
    });
  });

  it('fails closed for append-only-only batches and accepted effect-play routing', () => {
    const appendOnlyBatch = setup();
    const extraA = add(appendOnlyBatch, SUPPORT_ID, 'skill');
    const extraB = add(appendOnlyBatch, SUPPORT_ID, 'skill');
    expect(() => rules.playAbilityCardBatch(appendOnlyBatch, 'p1', [
      { cardInstanceId: extraA },
      { cardInstanceId: extraB },
    ])).toThrow(/regular attack/);

    const effectState = setup({ effectRoute: true });
    const source = add(effectState, EFFECT_SOURCE_ID, 'skill');
    const marked = add(effectState, MARKED_EFFECT_ID, 'hand');
    add(effectState, DRAW_ID, 'deck');
    const activation = rules.getLegalActions(effectState, 'p1').find((action) =>
      action.type === 'activate_ability' && action.cardInstanceId === source && action.abilityId === 'time-alter.action');
    expect(activation).toBeDefined();
    expect(rules.dispatchAbilityCommand(effectState, 'p1', activation!).ok).toBe(true);
    const pending = rules.projectAbilityState(effectState, 'p1').pendingDecision!;
    expect(pending.candidates).toContain(marked);
    const before = JSON.stringify(effectState);
    const result = rules.dispatchAbilityCommand(effectState, 'p1', {
      type: 'choose_target', decisionId: pending.id, selectedIds: [marked],
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('append_only');
    expect(JSON.stringify(effectState)).toBe(before);
  });

  it('keeps accepted extra regular-play allowance separate from additional-card accounting', () => {
    const state = setup();
    state.players[0]!.mana = 20;
    state.ruleOverrides = {
      ...state.ruleOverrides,
      extraAttackPlayAllowanceByManaByPlayer: { p1: { threshold: 11, amount: 1 } },
    };
    const first = add(state, NORMAL_1);
    const second = add(state, NORMAL_2);
    const third = add(state, NORMAL_3);
    const additional = add(state, SUPPORT_ID, 'skill');

    expect(() => rules.playAbilityCardBatch(state, 'p1', [
      { cardInstanceId: first },
      { cardInstanceId: second },
      { cardInstanceId: third },
      { cardInstanceId: additional },
    ])).not.toThrow();
    expect(rules.projectAbilityState(state, 'p1').playSummary).toMatchObject({
      cardsPlayedThisRound: 4,
      attacksDeclaredThisRound: 3,
      attackAllowance: 3,
    });
  });
});