import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { AuthoringAbility } from '../../src/ability/types';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.artoriac.json', 'utf8'));
const FAMILY_IDS = [
  'sc-artoriac-4.unique-passive-luck-on-win',
  'sc-artoriac-5.unique-passive-luck-on-win',
  'sc-artoriac-6.unique-passive-luck-on-win',
];
const SOURCE_DEFS = [
  'servant.artoriac.skill.sc-artoriac-4',
  'servant.artoriac.skill.sc-artoriac-5',
  'servant.artoriac.skill.sc-artoriac-6',
];

function synthetic(): AuthoringAbility {
  return {
    id: 'synthetic.unique-win-create',
    kind: 'optional_trigger',
    printedClause: 'synthetic',
    activation: { trigger: 'after_controller_wins_battle', opens: 'post_battle_optional_trigger_window' },
    conditions: [{ type: 'source_card_in_zone', zone: 'hand', owner: 'controller' }],
    targets: [],
    cost: [{
      type: 'move_source_card',
      from: { zone: 'hand', owner: 'controller' },
      to: { zone: 'removed_from_game', owner: 'controller' },
    }],
    creates: [{
      type: 'create_card', cardId: 'synthetic.reward',
      to: { zone: 'deck', owner: 'controller' },
      then: [{ type: 'shuffle_deck', owner: 'controller' }],
    }],
    ruleModifiers: [], lifecycle: {},
    responseWindow: {
      opens: 'post_battle_optional_trigger_window',
      eligiblePlayers: ['controller'], order: 'turn_order', passBehavior: 'decline_this_window',
    },
    limit: {
      type: 'unique', scope: 'unique_keyword_group', groupId: 'synthetic-win-group',
      window: 'trigger_window', conflictPolicy: 'only_one_effect_may_activate_per_window',
    },
    visibility: {}, effects: [],
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function setup(archive = raw) {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'battle';
  state.players[0]!.servantCardId = archive.id;
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(archive), { seed: 2020 });
  return state;
}

function addFamily(state: ReturnType<typeof setup>) {
  return SOURCE_DEFS.map((definitionId, index) => {
    const instanceId = `b20-source-${index + 1}`;
    state.cards.push({
      instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    return instanceId;
  });
}

function winEvent(id = 'b20-result', winners = ['p1'], participants = ['p1', 'p2']) {
  return {
    id,
    type: 'after_battle_result_determined' as const,
    battlePhaseResolutionId: 'battle-phase:1',
    battleId: 'battle-phase:1:battle:shinto:1',
    resultId: id,
    battleParticipantIds: participants,
    battlefieldId: 'shinto',
    battleResult: { winners, loserIds: participants.filter((playerId) => !winners.includes(playerId)) },
  };
}

function responses(state: ReturnType<typeof setup>) {
  return rules.getLegalActions(state, 'p1').filter((candidate) => candidate.type === 'resolve_response');
}

describe('P3-B20 unique win -> exile source + create/shuffle reward family', () => {
  it('classifies the exact structural family without depending on ability, group, or created-card identity', () => {
    const ability = synthetic();
    expect(rules.isUniqueWinCreateCardTriggerSemantic(ability)).toBe(true);
    const renamed = structuredClone(ability);
    renamed.id = 'renamed.ability';
    renamed.limit.groupId = 'renamed-group';
    renamed.creates[0]!.cardId = 'renamed.reward';
    expect(rules.isUniqueWinCreateCardTriggerSemantic(renamed)).toBe(true);

    const wrongTrigger = structuredClone(ability); wrongTrigger.activation.trigger = 'after_controller_loses_battle';
    expect(rules.isUniqueWinCreateCardTriggerSemantic(wrongTrigger)).toBe(false);
    const wrongSource = structuredClone(ability); (wrongSource.cost[0]!.from as Record<string, unknown>).zone = 'skill';
    expect(rules.isUniqueWinCreateCardTriggerSemantic(wrongSource)).toBe(false);
    const wrongDestination = structuredClone(ability); (wrongDestination.cost[0]!.to as Record<string, unknown>).zone = 'discard';
    expect(rules.isUniqueWinCreateCardTriggerSemantic(wrongDestination)).toBe(false);
    const missingShuffle = structuredClone(ability); delete missingShuffle.creates[0]!.then;
    expect(rules.isUniqueWinCreateCardTriggerSemantic(missingShuffle)).toBe(false);
    const wrongPolicy = structuredClone(ability); wrongPolicy.limit.conflictPolicy = 'all_effects_may_activate';
    expect(rules.isUniqueWinCreateCardTriggerSemantic(wrongPolicy)).toBe(false);
  });

  it('offers one three-choice unique window and settles exactly one chosen source/reward through the semantic route', () => {
    const state = setup();
    const sourceIds = addFamily(state);
    rules.processAbilityEvent(state, winEvent());

    const legal = responses(state);
    expect(legal).toHaveLength(3);
    expect(legal.map((candidate) => candidate.type === 'resolve_response' ? candidate.abilityId : '')).toEqual(FAMILY_IDS);
    expect(rules.projectAbilityState(state, 'p1').responseWindow).toMatchObject({ kind: 'choose_unique_trigger' });
    expect(rules.projectAbilityState(state, 'p2').responseWindow).toBeUndefined();
    expect(rules.getLegalActions(state, 'p2')).toEqual([]);

    const selected = legal[1]!;
    const result = rules.dispatchAbilityCommand(state, 'p1', selected);
    expect(result.ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === sourceIds[1])!.zone).toBe('removed_from_game');
    expect(state.cards.filter((card) => card.definitionId === 'card.luck' && card.ownerPlayerId === 'p1' && card.zone === 'deck')).toHaveLength(1);
    expect(state.cards.filter((card) => sourceIds.includes(card.instanceId) && card.zone === 'removed_from_game')).toHaveLength(1);
    expect(responses(state)).toHaveLength(0);
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'source_card_removed_from_game', abilityId: FAMILY_IDS[1], cardInstanceId: sourceIds[1], fromZone: 'hand', toZone: 'removed_from_game', movedCount: 1 }),
      expect.objectContaining({ type: 'card_created', abilityId: FAMILY_IDS[1], toZone: 'deck' }),
      expect.objectContaining({ type: 'deck_shuffled', abilityId: FAMILY_IDS[1], playerId: 'p1' }),
    ]));
    expect(state.abilityRuntime!.events.some((event) => event.type === 'effect_resolved' && event.abilityId === FAMILY_IDS[1])).toBe(false);

    rules.processAbilityEvent(state, winEvent());
    expect(state.cards.filter((card) => card.definitionId === 'card.luck')).toHaveLength(1);
    expect(state.cards.filter((card) => sourceIds.includes(card.instanceId) && card.zone === 'removed_from_game')).toHaveLength(1);
  });

  it('declines without mutation and can offer again on a later stable win event', () => {
    const state = setup();
    addFamily(state);
    rules.processAbilityEvent(state, winEvent('b20-decline'));
    const beforeCards = JSON.stringify(state.cards);
    const decline = rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'decline_this_window');
    expect(decline).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', decline!).ok).toBe(true);
    expect(JSON.stringify(state.cards)).toBe(beforeCards);

    rules.processAbilityEvent(state, {
      id: 'b20-later-win', type: 'after_controller_wins_battle', playerId: 'p1',
      battlePhaseResolutionId: 'battle-phase:2', battleId: 'battle-phase:2:battle:shinto:1',
      resultId: 'b20-later-win', battleParticipantIds: ['p1', 'p2'], battlefieldId: 'shinto',
    });
    expect(responses(state)).toHaveLength(3);
  });

  it('does not offer the family for an unrelated or losing battle result', () => {
    const unrelated = setup(); addFamily(unrelated);
    rules.processAbilityEvent(unrelated, winEvent('b20-unrelated', ['p5'], ['p5', 'p6']));
    expect(responses(unrelated)).toHaveLength(0);

    const loss = setup(); addFamily(loss);
    rules.processAbilityEvent(loss, winEvent('b20-loss', ['p2'], ['p1', 'p2']));
    expect(responses(loss)).toHaveLength(0);
  });

  it('fails closed atomically for a malformed same-family create shape instead of using legacy executeAbility', () => {
    const malformed = structuredClone(raw);
    const source = malformed.cards.find((card: { id: string }) => card.id === SOURCE_DEFS[0]);
    const ability = source.abilities.find((candidate: { id: string }) => candidate.id === FAMILY_IDS[0]);
    ability.creates[0].then = [];
    const state = setup(malformed);
    addFamily(state);
    rules.processAbilityEvent(state, winEvent('b20-malformed'));
    const choice = responses(state).find((candidate) => candidate.type === 'resolve_response' && candidate.abilityId === FAMILY_IDS[0]);
    expect(choice).toBeTruthy();
    rules.projectAbilityState(state, 'p1');
    const before = JSON.stringify(state);
    const result = rules.dispatchAbilityCommand(state, 'p1', choice!);
    expect(result.ok).toBe(false);
    expect(result.rejection).toMatchObject({ code: 'resolution_failed', message: 'Unsupported unique win create-card semantic shape' });
    expect(JSON.stringify(state)).toBe(before);
  });
});
