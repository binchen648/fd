import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { AuthoringAbility } from '../../src/ability/types';
import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.artoriac.json', 'utf8'));
const DEFINITIONS = [
  'servant.artoriac.skill.sc-artoriac-4',
  'servant.artoriac.skill.sc-artoriac-5',
  'servant.artoriac.skill.sc-artoriac-6',
] as const;
const ABILITY_IDS = [
  'sc-artoriac-4.unique-passive-luck-on-win',
  'sc-artoriac-5.unique-passive-luck-on-win',
  'sc-artoriac-6.unique-passive-luck-on-win',
] as const;

function sourceAbility(index = 0): AuthoringAbility {
  const card = raw.cards.find((candidate: { id: string }) => candidate.id === DEFINITIONS[index]);
  return structuredClone(card.abilities.find((candidate: { id: string }) => candidate.id === ABILITY_IDS[index]));
}

function add(state: GameState, definitionId: string, instanceId: string, zone: 'hand' | 'skill' = 'hand'): string {
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

function setup(archive = raw, zones: Array<'hand' | 'skill'> = ['hand', 'hand', 'hand']) {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'battle';
  state.round.prioritySeat = 1;
  state.players[0]!.servantCardId = archive.id;
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(archive), { seed: 202620 });
  DEFINITIONS.forEach((definitionId, index) => add(state, definitionId, `b20-pilgrim-${index + 4}`, zones[index] ?? 'hand'));
  return state;
}

function winEvent(id = 'b20-win', playerId = 'p1') {
  return {
    id,
    type: 'after_controller_wins_battle' as const,
    playerId,
    battlePhaseResolutionId: 'battle-phase:20',
    battleId: 'battle-phase:20:battle:shinto:1',
    resultId: `${id}:result`,
    battleParticipantIds: ['p1', 'p2'],
    battlefieldId: 'shinto',
    battleResult: { winners: [playerId], loserIds: [playerId === 'p1' ? 'p2' : 'p1'] },
  };
}

function responseActions(state: GameState) {
  return rules.getLegalActions(state, 'p1').filter((action) => action.type === 'resolve_response');
}

describe('P3-B20 unique Luck-on-win trigger family', () => {
  it('classifies the exact semantic structurally, independent of ability identity', () => {
    const ability = sourceAbility();
    expect(rules.isUniqueLuckOnBattleWinSemantic(ability)).toBe(true);
    ability.id = 'renamed.structural-luck-on-win';
    expect(rules.isUniqueLuckOnBattleWinSemantic(ability)).toBe(true);

    const wrongTrigger = sourceAbility();
    wrongTrigger.activation.trigger = 'after_controller_loses_battle';
    expect(rules.isUniqueLuckOnBattleWinSemantic(wrongTrigger)).toBe(false);
    const wrongCard = sourceAbility();
    wrongCard.creates[0]!.cardId = 'card.not-luck';
    expect(rules.isUniqueLuckOnBattleWinSemantic(wrongCard)).toBe(true);
    const wrongDestination = sourceAbility();
    (wrongDestination.creates[0]!.to as { zone: string }).zone = 'hand';
    expect(rules.isUniqueLuckOnBattleWinSemantic(wrongDestination)).toBe(false);
  });

  it('offers one unique window with three sibling choices and resolves exactly one remove-create-shuffle settlement', () => {
    const state = setup();
    const event = winEvent();
    rules.processAbilityEvent(state, event);

    const actions = responseActions(state);
    expect(actions).toHaveLength(3);
    expect(actions.map((action) => action.type === 'resolve_response' ? action.abilityId : '')).toEqual([...ABILITY_IDS]);
    expect(rules.projectAbilityState(state, 'p1').responseWindow).toMatchObject({ kind: 'choose_unique_trigger' });
    expect(rules.getLegalActions(state, 'p2')).toEqual([]);
    expect(state.cards.some((card) => card.definitionId === 'card.luck')).toBe(false);

    expect(rules.dispatchAbilityCommand(state, 'p1', actions[1]!).ok).toBe(true);
    expect(responseActions(state)).toHaveLength(0);
    expect(state.cards.find((card) => card.instanceId === 'b20-pilgrim-5')?.zone).toBe('removed_from_game');
    expect(state.cards.filter((card) => card.instanceId !== 'b20-pilgrim-5' && card.zone === 'removed_from_game')).toHaveLength(0);
    expect(state.cards.filter((card) => card.definitionId === 'card.luck' && card.ownerPlayerId === 'p1' && card.zone === 'deck')).toHaveLength(1);

    rules.processAbilityEvent(state, event);
    expect(responseActions(state)).toHaveLength(0);
    expect(state.cards.filter((card) => card.definitionId === 'card.luck')).toHaveLength(1);
  });

  it('declines with no mutation and excludes a sibling whose source is not in hand', () => {
    const state = setup(raw, ['hand', 'skill', 'hand']);
    rules.processAbilityEvent(state, winEvent('b20-decline'));
    expect(responseActions(state)).toHaveLength(2);
    expect(responseActions(state).map((action) => action.type === 'resolve_response' ? action.abilityId : '')).not.toContain(ABILITY_IDS[1]);
    const decline = rules.getLegalActions(state, 'p1').find((action) => action.type === 'decline_this_window');
    expect(decline).toBeTruthy();
    const before = JSON.stringify(state.cards);
    expect(rules.dispatchAbilityCommand(state, 'p1', decline!).ok).toBe(true);
    expect(JSON.stringify(state.cards)).toBe(before);
    expect(state.cards.some((card) => card.definitionId === 'card.luck')).toBe(false);
  });

  it('does not offer the family for another player win', () => {
    const state = setup();
    rules.processAbilityEvent(state, winEvent('b20-other-winner', 'p2'));
    expect(responseActions(state)).toHaveLength(0);
  });

  it('fails closed atomically for a malformed same-family Luck card instead of using the legacy executor', () => {
    const malformed = structuredClone(raw);
    const card = malformed.cards.find((candidate: { id: string }) => candidate.id === DEFINITIONS[0]);
    const ability = card.abilities.find((candidate: { id: string }) => candidate.id === ABILITY_IDS[0]);
    ability.creates[0].then = [];
    const state = setup(malformed, ['hand', 'skill', 'skill']);
    rules.processAbilityEvent(state, winEvent('b20-malformed'));
    const action = responseActions(state)[0];
    expect(action).toBeTruthy();
    rules.projectAbilityState(state, 'p1');
    const before = JSON.stringify(state);
    const result = rules.dispatchAbilityCommand(state, 'p1', action!);
    expect(result.ok).toBe(false);
    expect(result.rejection).toMatchObject({ code: 'resolution_failed', message: 'Unsupported unique win create-card semantic shape' });
    expect(JSON.stringify(state)).toBe(before);
  });
});
