import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'fixture.ciel-readiness';
const MOVE = `${ROOT}.skill.movement`;
const ASC = `${ROOT}.skill.ascension`;
const TARGET = `${ROOT}.skill.target`;
const ATTACK = `${ROOT}.attack`;
const responseWindow = { order: 'turn_order', passBehavior: 'decline_this_window' };
const execution = { mode: 'automatic', allowedOperations: [] as string[] };
const empty = { conditions: [] as any[], targets: [] as any[], cost: [] as any[], ruleModifiers: [] as any[], creates: [] as any[], lifecycle: {}, responseWindow, limit: {}, visibility: {}, execution };
const passive = (id: string, effect: any) => ({ id, kind: 'passive', printedClause: id, activation: { trigger: 'while_active' }, ...empty, effects: [effect] });
const card = (id: string, cardType: string, abilities: any[], cost = 0, basePower = 0, attributes: string[] = []) => ({
  id, aliases: [id.split('.').at(-1)], legacyId: id.split('.').at(-1), name: id, cardType,
  owner: { type: 'master', id: ROOT }, printedText: id,
  cardFace: { typeLabel: attributes[0] ?? '被动', attributes, cost, basePower },
  playTiming: { phase: 'action', window: 'controller_play_card_window' },
  playRequirements: [], abilities, verification: { implementationStatus: 'complete' },
});

const movementAbility = {
  id: 'fixture.ciel.movement', kind: 'passive', printedClause: 'fixture.ciel.movement', activation: {},
  conditions: [], targets: [], effects: [{ type: 'regular_movement_ignore_source_controller_engagement' }],
  cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow, limit: {}, visibility: {}, execution,
};
const powerAbility = passive('fixture.ciel.power', {
  type: 'controller_attack_attribute_power_bonus', attribute: '力量', amount: 4,
});
const additionalAbility = passive('fixture.ciel.additional', {
  type: 'conditional_definition_additional_play', definitionId: TARGET, minimumControllerMana: 8, additionalManaCost: 2,
});

const raw = {
  schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive',
  id: ROOT, name: ROOT, class: 'Master', publicInformation: { type: 'master_package', initialMana: 4 },
  cards: [
    card(MOVE, 'master_skill', [movementAbility]),
    card(ASC, 'master_skill', [powerAbility, additionalAbility]),
    card(TARGET, 'master_skill', [], 1, 4, ['特殊']),
    card(ATTACK, 'basic_attack', [], 1, 3, ['力量']),
  ],
  sources: [],
};
const loaded = rules.loadAuthoringJson(raw);

function add(state: GameState, definitionId: string, zone: string, active: boolean) {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
    visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261006 });
  state.players[0]!.masterCardId = ROOT;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'shinto';
  state.players[0]!.mana = 8;
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  return state;
}

describe('P3 Ciel complete-owner readiness gap set', () => {
  it('admits the exact new movement / +4 Strength / mana-8 +2-cost additional-play envelopes and rejects widened siblings', () => {
    expect(rules.isAcceptedRegularMovementEngagementAbility(loaded.cards[MOVE]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedConditionalAdditionalPlayAbility(loaded.cards[ASC]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedConditionalAdditionalPlayAbility(loaded.cards[ASC]!.abilities[1]!)).toBe(true);
    for (const mutate of [
      (x: any) => { x.cards[1].abilities[0].effects[0].amount = 5; },
      (x: any) => { x.cards[1].abilities[1].effects[0].minimumControllerMana = 7; },
      (x: any) => { x.cards[1].abilities[1].effects[0].additionalManaCost = 1; },
    ]) {
      const bad = structuredClone(raw); mutate(bad);
      expect(rules.loadAuthoringJson(bad).report.some((entry) => entry.status === 'unsupported')).toBe(true);
    }
  });

  it('waives only the provider-controller engagement edge for regular movement', () => {
    const state = setup();
    const source = add(state, MOVE, 'skill', false);
    expect(rules.isAcceptedRegularMovementEngagementAbility((state.abilityRuntime!.pack.cards[MOVE] as any).abilities[0])).toBe(true);
    expect(state.abilityRuntime!.cardState[source]).toMatchObject({ faceDown: false });
    expect(rules.regularMovementEngagementIgnored(state, 'p1')).toBe(true);
    expect(rules.regularMovementEngagementIgnored(state, 'p2')).toBe(true);
    state.players[2]!.locationId = 'miyama_town';
    expect(rules.regularMovementEngagementIgnored(state, 'p2')).toBe(false);
  });

  it('adds exactly +4 to the controller Strength attack while the master-skill provider is active', () => {
    const state = setup();
    const asc = add(state, ASC, 'field', true);
    expect(state.abilityRuntime!.cardState[asc]).toMatchObject({ active: true, faceDown: false });
    const attack = add(state, ATTACK, 'attack_area', true);
    expect(rules.calculateCardPower(state, attack).value).toBe(7);
    state.abilityRuntime!.cardState[state.cards.find((entry) => entry.definitionId === ASC)!.instanceId]!.active = false;
    expect(rules.calculateCardPower(state, attack).value).toBe(3);
  });

  it('at 8+ mana permits the named definition only as an additional staged play, charges +2, and does not consume the ordinary attack slot', () => {
    const state = setup();
    add(state, ASC, 'field', true);
    const attack = add(state, ATTACK, 'hand', false);
    const target = add(state, TARGET, 'skill', false);
    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual(expect.objectContaining({ type: 'stage_attack_card', cardInstanceId: target }));
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: attack }).ok).toBe(true);
    expect(rules.getLegalActions(state, 'p1')).toContainEqual(expect.objectContaining({ type: 'stage_attack_card', cardInstanceId: target }));
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: target }).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'confirm_staged_attack' }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4);
    expect(state.cards.find((entry) => entry.instanceId === attack)?.zone).toBe('attack_area');
    expect(state.cards.find((entry) => entry.instanceId === target)?.zone).toBe('attack_area');
    expect(state.abilityRuntime!.playCounters?.attacksDeclaredByPlayer.p1).toBe(1);
  });

  it('with 7 mana does not expose the additional-play route and production runtime stays identity-free', () => {
    const state = setup();
    state.players[0]!.mana = 7;
    add(state, ASC, 'field', true);
    const attack = add(state, ATTACK, 'hand', false);
    const target = add(state, TARGET, 'skill', false);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: attack }).ok).toBe(true);
    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual(expect.objectContaining({ type: 'stage_attack_card', cardInstanceId: target }));
    const production = [
      'packages/rules/src/ability/conditional-additional-play-capability.ts',
      'packages/rules/src/ability/regular-movement-engagement-capability.ts',
      'packages/rules/src/ability/opponent-round-vp-gain-threshold.ts',
      'packages/rules/src/ability/next-round-situation-benefit-suppression.ts',
      'packages/rules/src/core/terrain-advantage.ts',
      'packages/rules/src/ability/interpreter.ts',
    ].map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();
    expect(production).not.toContain('master.ciel');
    expect(production).not.toContain('希耶尔');
    expect(production).not.toContain('第七圣典');
    expect(production).not.toContain('火葬式典');
  });
});
