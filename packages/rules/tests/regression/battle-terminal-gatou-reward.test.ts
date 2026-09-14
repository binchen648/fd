import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { AuthoringAbility, GameState } from '../../src/ability/types';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/masters/master.gatou.json', 'utf8'));
const SOURCE_DEFINITION_ID = 'master.gatou.skill.seeker';
const ABILITY_ID = 'seeker.battle-end-reward';
const SOURCE_ID = 'b22-seeker';

function loadedAbility(archive = raw): AuthoringAbility {
  const pack = rules.loadAuthoringJson(archive);
  const ability = pack.cards[SOURCE_DEFINITION_ID]?.abilities.find((candidate) => candidate.id === ABILITY_ID);
  if (!ability) throw new Error('Missing Gatou battle-end reward fixture ability');
  return ability;
}

function setup(archive = raw): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.cards = [];
  state.round.activePhase = 'battle';
  state.players[0]!.masterCardId = archive.id;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'miyama_town';
  state.players[3]!.locationId = 'shinto';
  state.players[0]!.mana = 4;
  state.players[0]!.vp = 2;
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(archive), { seed: 20260922 });
  state.cards.push({
    instanceId: SOURCE_ID,
    definitionId: SOURCE_DEFINITION_ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  state.abilityRuntime!.cardState[SOURCE_ID] = { active: false, faceDown: false, playedRound: 1 };
  return state;
}

function movement(state: GameState, playerId: string, from: string, to: string, roundNumber = state.round.roundNumber): void {
  state.log.push({
    type: 'movement',
    message: `player:${playerId}:normal_move:${from}->${to}`,
    payload: { playerId, from, to, movementKind: 'normal', manaSpent: 1, roundNumber },
  });
}

function terminalEvent(id = 'battle-phase:1:after_battle_ended', winnersAtMiyama = ['p2'], participants = ['p1', 'p2', 'p3']) {
  return {
    id,
    type: 'after_battle_ended' as const,
    battlePhaseResolutionId: 'battle-phase:1',
    battleIds: ['battle-phase:1:battle:miyama_town:1'],
    resultIds: ['battle-phase:1:battle:miyama_town:1:result'],
    scoringReceiptIds: ['battle-phase:1:score:miyama_town'],
    battleParticipantIds: participants,
    battleOutcomes: [{ battlefieldId: 'miyama_town', winnerPlayerIds: winnersAtMiyama }],
  };
}

function rewardEvents(state: GameState) {
  return state.abilityRuntime!.events.filter((event) => event.abilityId === ABILITY_ID);
}

describe('P3-B22 Gatou phase-terminal mobile-player reward', () => {
  it('classifies only the exact identity-free directive semantic', () => {
    const ability = loadedAbility();
    expect(rules.isBattleEndMobilePlayersRewardSemantic(ability)).toBe(true);

    const renamed = structuredClone(ability);
    renamed.id = 'renamed.battle-end-reward';
    expect(rules.isBattleEndMobilePlayersRewardSemantic(renamed)).toBe(true);

    const wrongDirective = structuredClone(ability);
    wrongDirective.effects[0]!.directive = 'unrelated_directive';
    expect(rules.isBattleEndMobilePlayersRewardSemantic(wrongDirective)).toBe(false);

    const wrongTrigger = structuredClone(ability);
    wrongTrigger.activation.trigger = 'after_battle_result_determined';
    expect(rules.isBattleEndMobilePlayersRewardSemantic(wrongTrigger)).toBe(false);

    const extraCondition = structuredClone(ability);
    extraCondition.conditions.push({ type: 'controller_won_battle' });
    expect(rules.isBattleEndMobilePlayersRewardSemantic(extraCondition)).toBe(false);
  });

  it('awards mana once per qualifying other player and dedupes movement records', () => {
    const state = setup();
    movement(state, 'p2', 'shinto', 'miyama_town');
    movement(state, 'p2', 'recon', 'miyama_town');
    movement(state, 'p3', 'magic_workshop', 'miyama_town');
    movement(state, 'p1', 'shinto', 'miyama_town');

    const event = terminalEvent();
    rules.processAbilityEvent(state, event);

    expect(state.players[0]!.mana).toBe(6);
    expect(rewardEvents(state)).toContainEqual(expect.objectContaining({
      type: 'battle_end_mobile_players_reward_settled',
      playerId: 'p1',
      resource: 'mana',
      requestedDelta: 2,
      delta: 2,
      before: 4,
      after: 6,
      qualifyingPlayerIds: ['p2', 'p3'],
      battlePhaseResolutionId: 'battle-phase:1',
      battlefieldId: 'miyama_town',
      rewardBranch: 'mana',
    }));
    expect(rewardEvents(state)).toContainEqual(expect.objectContaining({
      type: 'mana_adjusted', resource: 'mana', delta: 2, before: 4, after: 6,
    }));

    const snapshot = JSON.stringify(state);
    rules.processAbilityEvent(state, event);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('uses authoritative movement provenance and excludes stale/deployment/moved-away players', () => {
    const state = setup();
    movement(state, 'p2', 'shinto', 'miyama_town', 0);
    movement(state, 'p3', 'shinto', 'miyama_town');
    state.players[2]!.locationId = 'shinto';
    // p2 is still colocated but its only movement record is stale; p4 is colocated by placement only.
    state.players[3]!.locationId = 'miyama_town';

    rules.processAbilityEvent(state, terminalEvent('b22-provenance', ['p2'], ['p1', 'p2', 'p3', 'p4']));

    expect(state.players[0]!.mana).toBe(4);
    expect(rewardEvents(state)).toContainEqual(expect.objectContaining({
      type: 'battle_end_mobile_players_reward_settled', requestedDelta: 0, delta: 0, qualifyingPlayerIds: [],
    }));
    expect(rewardEvents(state).some((event) => event.type === 'mana_adjusted')).toBe(false);
  });

  it('switches to VP for a shared winner at the controller current battlefield', () => {
    const state = setup();
    movement(state, 'p2', 'shinto', 'miyama_town');
    movement(state, 'p3', 'shinto', 'miyama_town');

    rules.processAbilityEvent(state, terminalEvent('b22-win', ['p1', 'p2']));

    expect(state.players[0]!.mana).toBe(4);
    expect(state.players[0]!.vp).toBe(4);
    expect(rewardEvents(state)).toContainEqual(expect.objectContaining({
      type: 'victory_points_adjusted', resource: 'victory_points', delta: 2, before: 2, after: 4,
    }));
    expect(rewardEvents(state)).toContainEqual(expect.objectContaining({
      type: 'battle_end_mobile_players_reward_settled', resource: 'victory_points', rewardBranch: 'victory_points', requestedDelta: 2, delta: 2,
    }));
  });

  it('reports actual mana delta at the cap and does not fabricate resource gain', () => {
    const state = setup();
    state.players[0]!.mana = 11;
    movement(state, 'p2', 'shinto', 'miyama_town');
    movement(state, 'p3', 'shinto', 'miyama_town');

    rules.processAbilityEvent(state, terminalEvent('b22-cap'));

    expect(state.players[0]!.mana).toBe(12);
    expect(rewardEvents(state)).toContainEqual(expect.objectContaining({
      type: 'battle_end_mobile_players_reward_settled', resource: 'mana', requestedDelta: 2, delta: 1, before: 11, after: 12,
    }));
  });

  it('does not trigger for an unrelated active controller outside the frozen participant set', () => {
    const state = setup();
    movement(state, 'p2', 'shinto', 'miyama_town');
    rules.processAbilityEvent(state, terminalEvent('b22-unrelated', ['p2'], ['p2', 'p3']));
    expect(state.players[0]!.mana).toBe(4);
    expect(rewardEvents(state)).toHaveLength(0);
  });


  it('settles through the production phase-terminal path after scoring', () => {
    const session = rules.createMatchSession({ seed: 20260922, humanPlayerId: 'p1', humanPlayerIds: ['p1'] });
    const state = session.state;
    state.round.activePhase = 'battle';
    state.eventPlacements = [];
    state.currentSituationModifiers = [];
    state.battleResults = [];
    state.abilityRuntime!.hostRequests = [];
    state.abilityRuntime!.responseWindows = [];
    state.abilityRuntime!.pendingPostBattleEvents = [];
    delete state.abilityRuntime!.pendingDecision;
    for (const player of state.players) {
      player.status = ['p1', 'p2'].includes(player.id) ? 'active' : 'eliminated';
      player.locationId = ['p1', 'p2'].includes(player.id) ? 'miyama_town' : 'recon';
      player.militaryResult = 0;
      player.vp = 0;
    }
    state.players.find((player) => player.id === 'p1')!.mana = 4;
    state.cards = [];
    state.abilityRuntime!.cardState = {};
    state.log.push({ type: 'movement', message: 'player:p2:normal_move:shinto->miyama_town', payload: { playerId: 'p2', from: 'shinto', to: 'miyama_town', movementKind: 'normal', manaSpent: 1, roundNumber: state.round.roundNumber } });
    state.cards.push({ instanceId: 'b22-session-seeker', definitionId: SOURCE_DEFINITION_ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
    state.abilityRuntime!.cardState['b22-session-seeker'] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
    const attack = { instanceId: 'b22-p1-attack', definitionId: 'basic.strength.5', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area' as const, visibility: { scope: 'public' as const } };
    state.cards.push(attack);
    state.abilityRuntime!.cardState[attack.instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };

    (session as unknown as { resolveBattlePhase: () => void }).resolveBattlePhase();

    const reward = state.abilityRuntime!.events.find((event) => event.type === 'battle_end_mobile_players_reward_settled' && event.abilityId === ABILITY_ID);
    expect(reward).toMatchObject({ playerId: 'p1', resource: 'victory_points', requestedDelta: 1, delta: 1, qualifyingPlayerIds: ['p2'], battlefieldId: 'miyama_town' });
    const barrierIndex = session.logs.findIndex((entry) => entry.type === 'battle_post_scoring_barrier_open');
    const terminalIndex = session.logs.findIndex((entry) => entry.type === 'battle_terminal_event_dispatched');
    expect(barrierIndex).toBeGreaterThanOrEqual(0);
    expect(terminalIndex).toBeGreaterThan(barrierIndex);
    expect(session.logs[terminalIndex]?.payload).toMatchObject({ battlePhaseResolutionId: 'battle-phase:1' });
  });

  it('fails closed atomically for a malformed same-family directive shape', () => {
    const malformed = structuredClone(raw);
    const source = malformed.cards.find((card: { id: string }) => card.id === SOURCE_DEFINITION_ID);
    const ability = source.abilities.find((candidate: { id: string }) => candidate.id === ABILITY_ID);
    ability.conditions = [{ type: 'controller_won_battle' }];
    const state = setup(malformed);
    const loaded = state.abilityRuntime!.pack.cards[SOURCE_DEFINITION_ID]!.abilities.find((candidate) => candidate.id === ABILITY_ID)!;
    expect(rules.isBattleEndMobilePlayersRewardSemantic(loaded)).toBe(false);

    const before = JSON.stringify(state);
    expect(() => rules.executeAbility(state, {
      controllerId: 'p1', sourceCardId: SOURCE_ID, abilityId: ABILITY_ID, variables: {}, selections: {}, event: terminalEvent('b22-malformed'),
    })).toThrow();
    expect(JSON.stringify(state)).toBe(before);
  });
});
