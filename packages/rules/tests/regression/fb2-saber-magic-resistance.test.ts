import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const definitionId = 'fixture.saber.magic-resistance';
const abilityId = 'renamed.magic-resistance';
const sourceId = 'fixture-magic-resistance-source';
const opponentMagicId = 'fixture-opponent-magic';
const opponentForceId = 'fixture-opponent-force';
const ownMagicId = 'fixture-own-magic';
const remoteMagicId = 'fixture-remote-magic';

function exactModifier() {
  return {
    id: 'renamed-modifier',
    printedClause: 'synthetic magic resistance',
    type: 'combat_power_modifier',
    operation: 'set',
    rule: 'attack.currentPower',
    scope: {
      controller: 'engaged_opponents_same_battlefield',
      object: 'attack_card',
      constraints: [{ type: 'has_attribute', attribute: '魔术' }],
    },
    value: 0,
    lifecycle: { duration: 'this_round' },
  };
}

function rawArchive(abilityPatch: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    id: 'fixture.saber-owner',
    name: 'Saber Fixture',
    class: 'Saber',
    cards: [
      {
        id: definitionId,
        name: 'Magic Resistance Fixture',
        cardType: 'servant_skill',
        cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [{
          id: abilityId,
          kind: 'phase_action',
          printedClause: 'synthetic magic resistance',
          activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
          conditions: [], targets: [], effects: [], cost: [], creates: [],
          ruleModifiers: [exactModifier()], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          execution: { mode: 'automatic' },
          ...abilityPatch,
        }],
      },
      {
        id: 'fixture.attack.magic', name: 'Magic Attack', cardType: 'basic_attack',
        cardFace: { typeLabel: '魔术', attributes: ['魔术'], cost: 0, basePower: 5 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
      {
        id: 'fixture.attack.force', name: 'Force Attack', cardType: 'basic_attack',
        cardFace: { typeLabel: '力量', attributes: ['力量'], cost: 0, basePower: 4 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
    ],
  };
}

function compiledAbility(patch: Record<string, unknown> = {}): AuthoringAbility {
  const pack = rules.loadAuthoringJson(rawArchive(patch));
  expect(pack.report).toEqual([]);
  return pack.cards[definitionId]!.abilities[0]!;
}

function setup(abilityPatch: Record<string, unknown> = {}) {
  const pack = rules.loadAuthoringJson(rawArchive(abilityPatch));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'battle';
  state.round.prioritySeat = 1;
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'miyama_town';
  rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });

  const add = (instanceId: string, defId: string, owner: string, zone: 'field' | 'attack_area') => {
    state.cards.push({
      instanceId, definitionId: defId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
      visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState[instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  };
  add(sourceId, definitionId, 'p1', 'field');
  add(opponentMagicId, 'fixture.attack.magic', 'p2', 'attack_area');
  add(opponentForceId, 'fixture.attack.force', 'p2', 'attack_area');
  add(ownMagicId, 'fixture.attack.magic', 'p1', 'attack_area');
  add(remoteMagicId, 'fixture.attack.magic', 'p3', 'attack_area');
  return state;
}

function action(state: GameState) {
  return rules.getLegalActions(state, 'p1').find((candidate) =>
    candidate.type === 'activate_ability' && candidate.cardInstanceId === sourceId && candidate.abilityId === abilityId);
}

function directContext() {
  return { controllerId: 'p1', sourceCardId: sourceId, abilityId, variables: {}, selections: {} };
}

describe('P3-FB2-10 Saber Magic Resistance power modifier', () => {
  it('classifies only the exact identity-free modifier shape', () => {
    const accepted = compiledAbility();
    accepted.id = 'completely-renamed-resistance';
    expect(rules.isMagicResistancePowerModifierCandidate(accepted)).toBe(true);
    expect(rules.isMagicResistancePowerModifierSemantic(accepted)).toBe(true);

    const nearMisses: Array<(ability: AuthoringAbility) => void> = [
      (a) => { a.activation.phase = 'action'; },
      (a) => { a.activation.opens = 'controller_action_window'; },
      (a) => { a.activation.requiresSourceState = 'inactive'; },
      (a) => { a.ruleModifiers[0]!.type = 'power_bonus'; },
      (a) => { a.ruleModifiers[0]!.operation = 'add'; },
      (a) => { a.ruleModifiers[0]!.rule = 'card.currentPower'; },
      (a) => { (a.ruleModifiers[0]!.scope as Record<string, unknown>).controller = 'self'; },
      (a) => { (a.ruleModifiers[0]!.scope as Record<string, unknown>).object = 'source_card'; },
      (a) => { ((a.ruleModifiers[0]!.scope as Record<string, unknown>).constraints as Array<Record<string, unknown>>)[0]!.attribute = '力量'; },
      (a) => { a.ruleModifiers[0]!.value = 1; },
      (a) => { (a.ruleModifiers[0]!.lifecycle as Record<string, unknown>).duration = 'while_active'; },
      (a) => { a.effects.push({ type: 'adjust_mana', player: 'controller', amount: 1 }); },
      (a) => { a.ruleModifiers.push(structuredClone(a.ruleModifiers[0]!)); },
    ];
    for (const mutate of nearMisses) {
      const candidate = structuredClone(accepted);
      mutate(candidate);
      expect(rules.isMagicResistancePowerModifierSemantic(candidate)).toBe(false);
    }
  });

  it('exposes only in combat while active and only once per round', () => {
    const state = setup();
    expect(action(state)).toBeDefined();
    state.round.activePhase = 'action';
    expect(action(state)).toBeUndefined();
    state.round.activePhase = 'battle';
    state.abilityRuntime!.cardState[sourceId]!.active = false;
    expect(action(state)).toBeUndefined();
    state.abilityRuntime!.cardState[sourceId]!.active = true;

    const first = action(state);
    expect(first).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', first!).ok).toBe(true);
    expect(action(state)).toBeUndefined();
  });

  it('sets only same-battlefield opponent Magic attacks to zero with deterministic trace', () => {
    const state = setup();
    expect(rules.calculateCardPower(state, opponentMagicId).value).toBe(5);
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state)!).ok).toBe(true);

    const affected = rules.calculateCardPower(state, opponentMagicId);
    expect(affected.value).toBe(0);
    expect(affected.lines).toContainEqual(expect.objectContaining({ label: 'synthetic magic resistance', value: 0 }));
    expect(rules.calculateCardPower(state, opponentForceId).value).toBe(4);
    expect(rules.calculateCardPower(state, ownMagicId).value).toBe(5);
    expect(rules.calculateCardPower(state, remoteMagicId).value).toBe(5);
  });

  it('expires the round-scoped modifier without leaking Power into the next round', () => {
    const state = setup();
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state)!).ok).toBe(true);
    expect(rules.calculateCardPower(state, opponentMagicId).value).toBe(0);
    const sourceZone = state.cards.find((card) => card.instanceId === sourceId)!.zone;

    rules.advanceAbilityPhase(state, 'action', state.round.roundNumber + 1);
    expect(rules.calculateCardPower(state, opponentMagicId).value).toBe(5);
    expect(state.cards.find((card) => card.instanceId === sourceId)!.zone).toBe(sourceZone);
  });

  it('fails a recognized malformed near-match closed before usage or modifier mutation', () => {
    const loaderReport = rules.loadAuthoringJson(rawArchive({ ruleModifiers: [{ ...exactModifier(), value: 1 }] })).report;
    expect(loaderReport).toContainEqual(expect.objectContaining({
      abilityId, path: 'ruleModifiers.lifecycle', status: 'unsupported',
    }));

    const state = setup();
    const ability = state.abilityRuntime!.pack.cards[definitionId]!.abilities[0]!;
    ability.ruleModifiers[0]!.value = 1;
    expect(rules.isMagicResistancePowerModifierCandidate(ability)).toBe(true);
    expect(rules.isMagicResistancePowerModifierSemantic(ability)).toBe(false);
    expect(action(state)).toBeUndefined();
    const before = JSON.stringify(state);
    expect(() => rules.executeAbility(state, directContext())).toThrow('Unsupported magic-resistance power modifier semantic shape');
    expect(JSON.stringify(state)).toBe(before);
  });
});
