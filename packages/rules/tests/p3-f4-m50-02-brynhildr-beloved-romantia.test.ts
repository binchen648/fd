import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const DEF = 'servant.fixture.brynhildr.skill.s3';
const SOURCE = 'brynhildr-s3-source';
const FLAG = 'belovedPlayerId';

function belovedAbility(): any {
  return {
    id: 'beloved-romantia',
    kind: 'passive',
    printedClause: 'linked-player same-battlefield card transformation fixture',
    markers: ['m50_structured_v1'],
    activation: {},
    conditions: [
      { type: 'source_owned' },
      { type: 'linked_player_flag_same_battlefield', key: FLAG },
    ],
    targets: [],
    effects: [],
    cost: [],
    creates: [],
    ruleModifiers: [
      {
        id: 'beloved-double-cost',
        operation: 'multiply',
        rule: 'card_cost',
        scope: { subject: 'controller', cards: { definitionIds: [DEF] } },
        value: 2,
        lifecycle: { duration: 'permanent' },
      },
      {
        id: 'beloved-double-base-power',
        operation: 'multiply',
        rule: 'card_base_power',
        scope: { subject: 'controller', cards: { definitionIds: [DEF] } },
        value: 2,
        lifecycle: { duration: 'permanent' },
      },
      {
        id: 'linked-player-same-battlefield-attributes',
        operation: 'replace',
        rule: 'card_attributes',
        scope: { subject: 'controller', cards: { definitionIds: [DEF] } },
        value: { removeAttributes: ['迅捷'], addAttributes: ['力量'] },
        lifecycle: { duration: 'permanent' },
      },
    ],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function archive(customAbility: any = belovedAbility()): any {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'servant_skill_card_archive',
    id: 'servant.fixture.brynhildr',
    name: 'fixture',
    class: 'Lancer',
    cards: [{
      id: DEF,
      name: 'Until Death Do Us Part',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: 'servant.fixture.brynhildr' },
      cardFace: { typeLabel: '特殊/迅捷', cost: 3, basePower: 5, attributes: ['特殊', '迅捷'] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [customAbility],
    }],
  };
}

function setup(linked = false): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{
    instanceId: SOURCE,
    definitionId: DEF,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[0]!.mana = 20;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  state.abilityRuntime!.cardState[SOURCE] = { active: false, faceDown: false, playedRound: 0 };
  if (linked) state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1 = { [FLAG]: 'p2' };
  return state;
}

function attributes(state: GameState): string[] {
  return rules.getEffectiveCardAttributes(state, SOURCE);
}

function canPlay(state: GameState): boolean {
  return rules.getLegalActions(state, 'p1').some((action) => action.type === 'play_card' && action.cardInstanceId === SOURCE);
}

describe('P3 F4 M50-02 Brynhildr beloved Romantia', () => {
  it('accepts only the exact linked-player same-battlefield multiplier + attribute bundle', () => {
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report).toEqual([]);
    expect(rules.isAcceptedM50LinkedPlayerSameBattlefieldCardAbility(loaded.cards[DEF]!.abilities[0]!)).toBe(true);

    const widened = belovedAbility();
    widened.ruleModifiers[0].scope.cards.definitionIds.push('servant.other.skill');
    expect(rules.loadAuthoringJson(archive(widened)).report.length).toBeGreaterThan(0);

    const overlapping = belovedAbility();
    overlapping.ruleModifiers[2].value.addAttributes = ['迅捷'];
    expect(rules.loadAuthoringJson(archive(overlapping)).report.length).toBeGreaterThan(0);

    const malformedCondition = belovedAbility();
    malformedCondition.conditions[1].extra = true;
    expect(rules.loadAuthoringJson(archive(malformedCondition)).report.length).toBeGreaterThan(0);
  });

  it('keeps printed cost, base Power, and attributes when no linked player is active', () => {
    const state = setup(false);
    expect(rules.calculateCardPower(state, SOURCE).value).toBe(5);
    expect(attributes(state)).toEqual(['特殊', '迅捷']);
    state.players[0]!.mana = 3;
    expect(canPlay(state)).toBe(true);
  });

  it('doubles cost/base Power and replaces Quick with Strength while the linked player shares a battlefield', () => {
    const state = setup(true);
    expect(rules.m50LinkedPlayerCardMultipliers(state, SOURCE)).toEqual({ basePower: 2, cost: 2 });
    expect(rules.calculateCardPower(state, SOURCE).value).toBe(10);
    expect(attributes(state)).toEqual(['特殊', '力量']);

    state.players[0]!.mana = 5;
    expect(canPlay(state)).toBe(false);
    state.players[0]!.mana = 6;
    expect(canPlay(state)).toBe(true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: SOURCE }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(0);
    expect(state.cards.find((card) => card.instanceId === SOURCE)!.zone).toBe('attack_area');
    expect(rules.calculateCardPower(state, SOURCE).value).toBe(10);
    expect(attributes(state)).toEqual(['特殊', '力量']);
  });

  it('reverts immediately when the linked relation no longer satisfies same-battlefield availability', () => {
    const state = setup(true);
    expect(rules.calculateCardPower(state, SOURCE).value).toBe(10);

    state.players[1]!.locationId = 'shinto';
    expect(rules.m50LinkedPlayerCardMultipliers(state, SOURCE)).toEqual({ basePower: 1, cost: 1 });
    expect(rules.calculateCardPower(state, SOURCE).value).toBe(5);
    expect(attributes(state)).toEqual(['特殊', '迅捷']);

    state.players[1]!.locationId = 'miyama_town';
    state.players[1]!.status = 'eliminated';
    expect(rules.calculateCardPower(state, SOURCE).value).toBe(5);
    expect(attributes(state)).toEqual(['特殊', '迅捷']);
  });

  it('does not treat a shared non-battlefield location or removed source as satisfying the continuous rule', () => {
    const state = setup(true);
    state.players[0]!.locationId = 'recon';
    state.players[1]!.locationId = 'recon';
    expect(rules.calculateCardPower(state, SOURCE).value).toBe(5);
    expect(attributes(state)).toEqual(['特殊', '迅捷']);

    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';
    state.cards.find((card) => card.instanceId === SOURCE)!.zone = 'removed_from_game';
    expect(rules.calculateCardPower(state, SOURCE).value).toBe(5);
    expect(attributes(state)).toEqual(['特殊', '迅捷']);
  });
});
