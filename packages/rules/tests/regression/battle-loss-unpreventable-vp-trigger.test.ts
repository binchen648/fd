import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { AuthoringAbility, GameState } from '../../src/ability/types';
import * as rules from '../../src/index';
import { createMatchSession } from '../../src/match-session';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.tomoe.json', 'utf8'));
const SOURCE_DEFINITION_ID = 'servant.tomoe.skill.sc-tomoe-1';
const ABILITY_ID = 'sc-tomoe-1.penalty-on-defeat';

function loadedAbility(archive = raw): AuthoringAbility {
  const pack = rules.loadAuthoringJson(archive);
  const ability = pack.cards[SOURCE_DEFINITION_ID]?.abilities.find((candidate) => candidate.id === ABILITY_ID);
  if (!ability) throw new Error('Missing Tomoe defeat-penalty fixture ability');
  return ability;
}

function setup(archive = raw, vp = 7): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'battle';
  state.players[0]!.servantCardId = archive.id;
  state.players[0]!.vp = vp;
  state.players[1]!.vp = 0;
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(archive), { seed: 20260914 });
  state.cards.push({
    instanceId: 'b21-source',
    definitionId: SOURCE_DEFINITION_ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState['b21-source'] = { active: true, faceDown: false, playedRound: 1 };
  return state;
}

function lossEvent(id = 'b21-result', winners = ['p2'], participants = ['p1', 'p2']) {
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

function activateAttack(session: ReturnType<typeof createMatchSession>, ownerPlayerId: string): void {
  const card = session.state.cards.find((candidate) =>
    candidate.ownerPlayerId === ownerPlayerId && ['hand', 'deck'].includes(candidate.zone));
  if (!card) throw new Error(`Missing attack fixture card for ${ownerPlayerId}`);
  card.definitionId = 'basic.strength.5';
  card.zone = 'attack_area';
  card.visibility = { scope: 'public' };
  session.state.abilityRuntime!.cardState[card.instanceId] = {
    active: true,
    faceDown: false,
    playedRound: session.state.round.roundNumber,
  };
}

function productionTwoBattlefieldSession(): ReturnType<typeof createMatchSession> {
  const session = createMatchSession({ seed: 20260921, humanPlayerId: 'p1', humanPlayerIds: ['p1'] });
  session.state.round.activePhase = 'battle';
  session.state.eventPlacements = [];
  session.state.currentSituationModifiers = [];
  for (const player of session.state.players) {
    player.militaryResult = 0;
    player.vp = 0;
    player.locationId = 'recon';
  }
  session.state.players.find((player) => player.id === 'p1')!.vp = 10;
  session.state.players.find((player) => player.id === 'p1')!.locationId = 'miyama_town';
  session.state.players.find((player) => player.id === 'p2')!.locationId = 'miyama_town';
  session.state.players.find((player) => player.id === 'p3')!.locationId = 'shinto';
  session.state.players.find((player) => player.id === 'p4')!.locationId = 'shinto';
  activateAttack(session, 'p2');
  activateAttack(session, 'p2');
  activateAttack(session, 'p2');
  activateAttack(session, 'p2');
  activateAttack(session, 'p4');
  expect(session.state.abilityRuntime!.pack.cards[SOURCE_DEFINITION_ID]).toBeTruthy();
  session.state.cards.push({
    instanceId: 'b21-session-source',
    definitionId: SOURCE_DEFINITION_ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  });
  session.state.abilityRuntime!.cardState['b21-session-source'] = {
    active: true,
    faceDown: false,
    playedRound: session.state.round.roundNumber,
  };
  session.state.abilityRuntime!.preventEffects = true;
  return session;
}

describe('P3-B21 unpreventable battle-loss VP trigger', () => {
  it('classifies only the exact structural prevention-exception family without identity routing', () => {
    const ability = loadedAbility();
    expect(rules.isBattleLossUnpreventableVpTriggerSemantic(ability)).toBe(true);

    const renamed = structuredClone(ability);
    renamed.id = 'renamed.loss-vp';
    renamed.ruleModifiers[0]!.id = 'renamed-prevention-exception';
    expect(rules.isBattleLossUnpreventableVpTriggerSemantic(renamed)).toBe(true);

    const wrongAmount = structuredClone(ability);
    wrongAmount.effects[0]!.amount = -4;
    expect(rules.isBattleLossUnpreventableVpTriggerSemantic(wrongAmount)).toBe(false);

    const wrongPlayer = structuredClone(ability);
    wrongPlayer.effects[0]!.player = 'opponent';
    expect(rules.isBattleLossUnpreventableVpTriggerSemantic(wrongPlayer)).toBe(false);

    const wrongPriority = structuredClone(ability);
    (wrongPriority.ruleModifiers[0]!.priority as Record<string, unknown>).tier = 'normal';
    expect(rules.isBattleLossUnpreventableVpTriggerSemantic(wrongPriority)).toBe(false);

    const extraModifier = structuredClone(ability);
    extraModifier.ruleModifiers.push(structuredClone(extraModifier.ruleModifiers[0]!));
    expect(rules.isBattleLossUnpreventableVpTriggerSemantic(extraModifier)).toBe(false);
  });

  it('bypasses ordinary prevention and emits typed unpreventable VP evidence exactly once', () => {
    const state = setup(raw, 7);
    state.abilityRuntime!.preventEffects = true;
    const event = lossEvent();

    rules.processAbilityEvent(state, event);

    expect(state.players[0]!.vp).toBe(2);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'victory_points_adjusted',
      playerId: 'p1',
      abilityId: ABILITY_ID,
      resource: 'victory_points',
      delta: -5,
      before: 7,
      after: 2,
      unpreventable: true,
    }));
    expect(state.abilityRuntime!.events.some((entry) => entry.type === 'effect_prevented' && entry.abilityId === ABILITY_ID)).toBe(false);

    const afterFirst = JSON.stringify(state);
    rules.processAbilityEvent(state, event);
    expect(JSON.stringify(state)).toBe(afterFirst);
  });

  it('preserves the VP floor and reports the actual typed delta', () => {
    const state = setup(raw, 3);
    state.abilityRuntime!.preventEffects = true;
    rules.processAbilityEvent(state, lossEvent('b21-floor'));

    expect(state.players[0]!.vp).toBe(0);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'victory_points_adjusted',
      abilityId: ABILITY_ID,
      delta: -3,
      before: 3,
      after: 0,
      unpreventable: true,
    }));
  });

  it('settles only after the production phase-wide post-scoring barrier', () => {
    const session = productionTwoBattlefieldSession();
    (session as unknown as { resolveBattlePhase: () => void }).resolveBattlePhase();

    expect(session.state.players.find((player) => player.id === 'p1')!.vp).toBe(5);
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'victory_points_adjusted',
      playerId: 'p1',
      abilityId: ABILITY_ID,
      delta: -5,
      before: 10,
      after: 5,
      unpreventable: true,
    }));

    const barrierIndex = session.logs.findIndex((entry) => entry.type === 'battle_post_scoring_barrier_open');
    const resultDispatchIndex = session.logs.findIndex((entry) =>
      entry.type === 'battle_result_event_dispatched' && entry.payload?.battlefieldId === 'miyama_town');
    expect(barrierIndex).toBeGreaterThanOrEqual(0);
    expect(resultDispatchIndex).toBeGreaterThan(barrierIndex);
    expect(session.logs[barrierIndex]?.payload).toMatchObject({
      battlePhaseResolutionId: 'battle-phase:1',
      scoredBattlefieldIds: expect.arrayContaining(['miyama_town', 'shinto']),
    });
  });

  it('does not fire for an unrelated battle result or for a controller victory', () => {
    const unrelated = setup(raw, 7);
    rules.processAbilityEvent(unrelated, lossEvent('b21-unrelated', ['p2'], ['p2']));
    expect(unrelated.players[0]!.vp).toBe(7);

    const win = setup(raw, 7);
    rules.processAbilityEvent(win, lossEvent('b21-win', ['p1'], ['p1', 'p2']));
    expect(win.players[0]!.vp).toBe(7);
  });

  it('fails closed atomically for a malformed same-family prevention exception instead of legacy fallback', () => {
    const malformed = structuredClone(raw);
    const source = malformed.cards.find((card: { id: string }) => card.id === SOURCE_DEFINITION_ID);
    const ability = source.abilities.find((candidate: { id: string }) => candidate.id === ABILITY_ID);
    ability.ruleModifiers[0].priority.tier = 'normal';
    const state = setup(malformed, 7);
    state.abilityRuntime!.preventEffects = true;
    const loaded = state.abilityRuntime!.pack.cards[SOURCE_DEFINITION_ID]!.abilities.find((candidate) => candidate.id === ABILITY_ID)!;
    expect(loaded.execution.mode).toBe('unsupported');
    expect(rules.isBattleLossUnpreventableVpTriggerSemantic(loaded)).toBe(false);

    const before = JSON.stringify(state);
    expect(() => rules.executeAbility(state, {
      controllerId: 'p1', sourceCardId: 'b21-source', abilityId: ABILITY_ID, variables: {}, selections: {},
      event: { ...lossEvent('b21-malformed'), id: 'b21-malformed:lose:p1', type: 'after_controller_loses_battle', playerId: 'p1' },
    })).toThrow('Ability requires an adapter or host ruling');
    expect(JSON.stringify(state)).toBe(before);

    expect(() => rules.processAbilityEvent(state, lossEvent('b21-malformed'))).not.toThrow();
    expect(state.players[0]!.vp).toBe(7);
    expect(state.abilityRuntime!.events.some((entry) => entry.abilityId === ABILITY_ID)).toBe(false);
  });
});
