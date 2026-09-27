import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import { dispatchAbilityCommand, getLegalActions, initializeAbilityRuntime, resolveEffect } from '../../src/ability/interpreter';
import type { AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-source-skill-join';
const SOURCE = `${ROOT}.skill.join`;
const ABILITY = 'fixture.source-skill-join';

function ability() {
  return {
    id: ABILITY,
    kind: 'phase_action',
    printedClause: 'Pay 3 mana to join this skill card to your attack when the active attacks contain exactly one Strength and one Magic carrier.',
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [{
      type: 'controller_active_attacks_exact_distinct_attribute_pair',
      firstAttribute: '力量', secondAttribute: '魔术', distinctCards: true,
    }],
    targets: [],
    effects: [{ type: 'join_source_skill_card_to_attack' }],
    cost: [{ type: 'pay_mana', amount: 3 }],
    creates: [], ruleModifiers: [], lifecycle: {},
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
    limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}

function archive() {
  const card = {
    id: SOURCE, name: SOURCE, cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
    cardFace: { attributes: ['力量', '魔术'], cost: 1, basePower: 5 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
    abilities: [ability()], verification: { implementationStatus: 'complete' },
  };
  return { schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: ROOT, cards: [card] } as any;
}

function setup() {
  const pack = loadAuthoringJson(archive());
  const state = createSeededGameState();
  state.cards = [];
  state.players[0]!.servantCardId = ROOT;
  state.players[0]!.mana = 10;
  initializeAbilityRuntime(state, pack, { seed: 20260927 });
  state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  const source = add(state, SOURCE, 'skill', false);
  addAttack(state, 'basic.join-strength', ['力量']);
  addAttack(state, 'basic.join-magic', ['魔术']);
  return { state, pack, source };
}

function add(state: GameState, definitionId: string, zone = 'skill', active = false, owner = 'p1') {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner },
  });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return state.cards[state.cards.length - 1]!;
}

function addAttack(state: GameState, id: string, attributes: string[]) {
  const def: AuthoringCard = {
    id, name: id, cardType: 'basic_attack',
    cardFace: { attributes, cost: 0, basePower: 2 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
  };
  state.abilityRuntime!.pack.cards[id] = def;
  return add(state, id, 'attack_area', true);
}

describe('P3 bounded source skill-card attack-join capability', () => {
  it('accepts only the exact whole-ability shell and fails closed on widened or nested near matches', () => {
    expect(loadAuthoringJson(archive()).report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const mutations = [
      (raw: any) => { raw.cards[0].abilities[0].effects[0].extra = true; },
      (raw: any) => { raw.cards[0].abilities[0].activation.requiresSourceState = 'active'; },
      (raw: any) => { raw.cards[0].abilities[0].conditions.push({ type: 'source_owned' }); },
      (raw: any) => { raw.cards[0].abilities[0].cost[0].amount = 0; },
      (raw: any) => { raw.cards[0].abilities[0].effects = [{ type: 'branch', branches: [{ then: [{ type: 'join_source_skill_card_to_attack' }] }] }]; },
    ];
    for (const mutate of mutations) {
      const raw = archive(); mutate(raw);
      expect(loadAuthoringJson(raw).report.some((entry) => entry.status === 'unsupported')).toBe(true);
    }
  });

  it('joins an owned inactive skill-zone source as a face-up active attack for the ability mana cost without becoming a card play', () => {
    const { state, source } = setup();
    const beforeMana = state.players[0]!.mana;
    const beforeCardsPlayed = state.abilityRuntime!.playCounters?.cardsPlayedByPlayer.p1 ?? 0;
    const legal = getLegalActions(state, 'p1');
    expect(legal).toContainEqual({ type: 'activate_ability', cardInstanceId: source.instanceId, abilityId: ABILITY });
    expect(legal.some((entry) => entry.type === 'play_card' && entry.cardInstanceId === source.instanceId)).toBe(false);

    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source.instanceId, abilityId: ABILITY }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(beforeMana - 3);
    const joined = state.cards.find((card) => card.instanceId === source.instanceId)!;
    expect(joined.zone).toBe('attack_area');
    expect(joined.visibility).toEqual({ scope: 'public' });
    expect(state.abilityRuntime!.cardState[source.instanceId]).toMatchObject({ active: true, faceDown: false, paidManaOnPlay: 0 });
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[source.instanceId] ?? 0).toBe(0);
    expect(state.abilityRuntime!.playCounters?.cardsPlayedByPlayer.p1 ?? 0).toBe(beforeCardsPlayed);
  });

  it('requires the exact distinct active attribute pair, enough mana, and the source to remain in its owned skill zone', () => {
    const extra = setup(); addAttack(extra.state, 'basic.join-extra-strength', ['力量']);
    expect(getLegalActions(extra.state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.abilityId === ABILITY)).toBe(false);

    const broke = setup(); broke.state.players[0]!.mana = 2;
    expect(getLegalActions(broke.state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.abilityId === ABILITY)).toBe(false);
    expect(dispatchAbilityCommand(broke.state, 'p1', { type: 'activate_ability', cardInstanceId: broke.source.instanceId, abilityId: ABILITY }).ok).toBe(false);

    const wrongZone = setup(); wrongZone.source.zone = 'discard';
    expect(getLegalActions(wrongZone.state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.abilityId === ABILITY)).toBe(false);
  });

  it('rechecks the privileged whole-ability semantic at runtime after compiled-pack corruption', () => {
    const { state, source } = setup();
    const compiled = state.abilityRuntime!.pack.cards[SOURCE]!.abilities.find((entry) => entry.id === ABILITY)!;
    compiled.conditions.push({ type: 'source_owned' });
    expect(getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.abilityId === ABILITY)).toBe(false);
    expect(() => resolveEffect(state, {
      sourceCardId: source.instanceId, abilityId: ABILITY, controllerId: 'p1', variables: {}, selections: {},
    }, compiled.effects[0]!)).toThrow('Unsupported source skill-card attack-join semantic');
  });
});
