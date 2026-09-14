import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { AuthoringAbility, GameState } from '../../src/ability/types';
import * as rules from '../../src/index';
import { resolveBattlefield } from '../../src/core/combat-resolver';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/masters/master.olga-marie.json', 'utf8'));
const SOURCE_DEFINITION_ID = 'master.olga-marie.skill.trismegistus-grief';
const ABILITY_ID = 'trismegistus.loss-transform';
const SOURCE_ID = 'b23-trismegistus';

function loadedAbility(archive = raw): AuthoringAbility {
  const pack = rules.loadAuthoringJson(archive);
  const ability = pack.cards[SOURCE_DEFINITION_ID]?.abilities.find((candidate) => candidate.id === ABILITY_ID);
  if (!ability) throw new Error('Missing Olga loss-transform fixture ability');
  return ability;
}

function setup(options: { active?: boolean; archive?: typeof raw } = {}): GameState {
  const archive = options.archive ?? raw;
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.eventPlacements = [];
  state.round.activePhase = 'battle';
  state.players[0]!.masterCardId = archive.id;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(archive), { seed: 20260923 });
  state.cards.push({
    instanceId: SOURCE_ID,
    definitionId: SOURCE_DEFINITION_ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: options.active === false ? 'skill' : 'field',
    visibility: options.active === false
      ? { scope: 'owner_only', ownerPlayerId: 'p1' }
      : { scope: 'public' },
  });
  state.abilityRuntime!.cardState[SOURCE_ID] = {
    active: options.active !== false,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return state;
}

function lossEvent(id = 'battle-phase:1:battle:miyama_town:1:result:lose:p1') {
  return {
    id,
    type: 'after_controller_loses_battle' as const,
    playerId: 'p1',
    battlePhaseResolutionId: 'battle-phase:1',
    battleId: 'battle-phase:1:battle:miyama_town:1',
    resultId: 'battle-phase:1:battle:miyama_town:1:result',
    battleParticipantIds: ['p1', 'p2'],
    battlefieldId: 'miyama_town',
    battleResult: { winners: ['p2'], loserIds: ['p1'] },
  };
}

function transitionEvents(state: GameState) {
  return state.abilityRuntime!.events.filter((event) => event.type === 'battle_loss_state_transformed');
}

function transformedSources(state: GameState): string[] {
  return state.abilityRuntime!.transformedReturnSilenceSourceCardIds ?? [];
}

describe('P3-B23 Olga source-bound battle-loss state transform', () => {
  it('classifies only the exact identity-free transform semantic', () => {
    const ability = loadedAbility();
    expect(rules.isBattleLossStateTransformSemantic(ability)).toBe(true);

    const renamed = structuredClone(ability);
    renamed.id = 'renamed.loss-transform';
    expect(rules.isBattleLossStateTransformSemantic(renamed)).toBe(true);

    const wrongEffect = structuredClone(ability);
    wrongEffect.effects[0]!.type = 'return_silence_battle_start';
    expect(rules.isBattleLossStateTransformSemantic(wrongEffect)).toBe(false);

    const wrongTrigger = structuredClone(ability);
    wrongTrigger.activation.trigger = 'after_controller_wins_battle';
    expect(rules.isBattleLossStateTransformSemantic(wrongTrigger)).toBe(false);

    const extraCondition = structuredClone(ability);
    extraCondition.conditions.push({ type: 'controller_won_battle' });
    expect(rules.isBattleLossStateTransformSemantic(extraCondition)).toBe(false);
  });

  it('does not transform an inactive skill-zone source on the loss that precedes B17 delayed activation', () => {
    const state = setup({ active: false });
    rules.processAbilityEvent(state, lossEvent('b23-inactive-loss'));

    expect(transformedSources(state)).not.toContain(SOURCE_ID);
    expect(transitionEvents(state)).toHaveLength(0);
    expect(state.ruleOverrides?.mustDeployToBattlefieldPlayerIds ?? []).not.toContain('p1');
    expect(state.cards.find((card) => card.instanceId === SOURCE_ID)).toMatchObject({ zone: 'skill' });
  });

  it('runs Soul Drag before transform but cannot arm Return Silence prematurely', () => {
    const state = setup();
    rules.processAbilityEvent(state, { id: 'b23-pre-transform-passives', type: 'while_active' });

    expect(state.abilityRuntime!.ongoingEffects).toContainEqual(expect.objectContaining({
      sourceCardId: SOURCE_ID,
      controllerId: 'p1',
      ruleModifiers: expect.arrayContaining([
        expect.objectContaining({ definition: expect.objectContaining({ id: 'soul_drag_power_bonus' }) }),
      ]),
    }));
    expect(transformedSources(state)).not.toContain(SOURCE_ID);
    expect(state.ruleOverrides?.mustDeployToBattlefieldPlayerIds ?? []).not.toContain('p1');
  });

  it('transforms exactly once on an authoritative loss, removes Soul Drag, and records typed provenance', () => {
    const state = setup();
    rules.processAbilityEvent(state, { id: 'b23-install-soul-drag', type: 'while_active' });
    expect(state.abilityRuntime!.ongoingEffects.some((ongoing) => ongoing.sourceCardId === SOURCE_ID)).toBe(true);

    const event = lossEvent();
    rules.processAbilityEvent(state, event);

    expect(transformedSources(state)).toEqual([SOURCE_ID]);
    expect(state.abilityRuntime!.ongoingEffects.some((ongoing) =>
      ongoing.sourceCardId === SOURCE_ID &&
      ongoing.ruleModifiers.some((modifier) => modifier.definition.id === 'soul_drag_power_bonus'))).toBe(false);
    expect(state.ruleOverrides?.mustDeployToBattlefieldPlayerIds).toContain('p1');
    expect(transitionEvents(state)).toContainEqual(expect.objectContaining({
      playerId: 'p1',
      sourceCardId: SOURCE_ID,
      abilityId: ABILITY_ID,
      triggerEventId: event.id,
      battlePhaseResolutionId: event.battlePhaseResolutionId,
      battleId: event.battleId,
      resultId: event.resultId,
      battlefieldId: 'miyama_town',
      fromState: 'soul_drag',
      toState: 'return_silence',
    }));

    const afterFirst = structuredClone(state);
    rules.processAbilityEvent(state, event);
    expect(state).toEqual(afterFirst);

    rules.processAbilityEvent(state, lossEvent('b23-second-distinct-loss'));
    expect(transitionEvents(state)).toHaveLength(1);
    expect(transformedSources(state)).toEqual([SOURCE_ID]);
  });

  it('keeps Soul Drag disabled after transform while allowing only the transformed Return Silence passive', () => {
    const state = setup();
    rules.processAbilityEvent(state, { id: 'b23-first-passive', type: 'while_active' });
    rules.processAbilityEvent(state, lossEvent('b23-transform-for-passives'));
    expect(state.abilityRuntime!.ongoingEffects.some((ongoing) => ongoing.sourceCardId === SOURCE_ID)).toBe(false);

    rules.processAbilityEvent(state, { id: 'b23-post-transform-passives', type: 'while_active' });

    expect(state.abilityRuntime!.ongoingEffects.some((ongoing) =>
      ongoing.sourceCardId === SOURCE_ID &&
      ongoing.ruleModifiers.some((modifier) => modifier.definition.id === 'soul_drag_power_bonus'))).toBe(false);
    expect(state.ruleOverrides?.mustDeployToBattlefieldPlayerIds).toContain('p1');
  });

  it('does not transform for another player loss', () => {
    const state = setup();
    rules.processAbilityEvent(state, {
      ...lossEvent('b23-other-loss'),
      playerId: 'p2',
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
    expect(transformedSources(state)).toHaveLength(0);
    expect(transitionEvents(state)).toHaveLength(0);
  });

  it('transforms through the production post-scoring MatchSession loss-event lineage', () => {
    const session = rules.createMatchSession({ seed: 20260904, humanPlayerId: 'p1', humanPlayerIds: ['p1'] });
    const state = session.state;
    const controller = state.players.find((player) => player.masterCardId === raw.id);
    if (!controller) throw new Error('Expected Olga in deterministic match roster');
    const opponent = state.players.find((player) => player.id !== controller.id)!;
    state.round.activePhase = 'battle';
    state.eventPlacements = [];
    state.currentSituationModifiers = [];
    state.battleResults = [];
    state.abilityRuntime!.hostRequests = [];
    state.abilityRuntime!.responseWindows = [];
    state.abilityRuntime!.pendingPostBattleEvents = [];
    delete state.abilityRuntime!.pendingDecision;
    for (const player of state.players) {
      player.status = [controller.id, opponent.id].includes(player.id) ? 'active' : 'eliminated';
      player.locationId = [controller.id, opponent.id].includes(player.id) ? 'miyama_town' : 'recon';
      player.militaryResult = 0;
      player.vp = 0;
    }
    state.cards = [];
    state.abilityRuntime!.cardState = {};
    state.cards.push({
      instanceId: 'b23-session-trismegistus',
      definitionId: SOURCE_DEFINITION_ID,
      ownerPlayerId: controller.id,
      controllerPlayerId: controller.id,
      zone: 'field',
      visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState['b23-session-trismegistus'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    const attack = {
      instanceId: 'b23-opponent-attack', definitionId: 'basic.strength.5', ownerPlayerId: opponent.id,
      controllerPlayerId: opponent.id, zone: 'attack_area' as const, visibility: { scope: 'public' as const },
    };
    state.cards.push(attack);
    state.abilityRuntime!.cardState[attack.instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };

    (session as unknown as { resolveBattlePhase: () => void }).resolveBattlePhase();

    expect(state.abilityRuntime!.transformedReturnSilenceSourceCardIds).toContain('b23-session-trismegistus');
    expect(state.ruleOverrides?.mustDeployToBattlefieldPlayerIds).toContain(controller.id);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'battle_loss_state_transformed',
      playerId: controller.id,
      sourceCardId: 'b23-session-trismegistus',
      abilityId: ABILITY_ID,
      battlePhaseResolutionId: 'battle-phase:1',
      battlefieldId: 'miyama_town',
      fromState: 'soul_drag',
      toState: 'return_silence',
    }));
    const barrierIndex = session.logs.findIndex((entry) => entry.type === 'battle_post_scoring_barrier_open');
    const resultIndex = session.logs.findIndex((entry) => entry.type === 'battle_result_event_dispatched');
    expect(barrierIndex).toBeGreaterThanOrEqual(0);
    expect(resultIndex).toBeGreaterThan(barrierIndex);
  });

  it('removes the transformed source after Return Silence resolves and leaves no ghost battle/deployment state', () => {
    const state = setup();
    rules.processAbilityEvent(state, lossEvent('b23-transform-before-return-silence'));
    expect(transformedSources(state)).toEqual([SOURCE_ID]);
    expect(state.ruleOverrides?.mustDeployToBattlefieldPlayerIds).toContain('p1');

    const result = resolveBattlefield(state, {
      battlefieldId: 'miyama_town',
      participants: [
        { playerId: 'p1', totalPower: 1 },
        { playerId: 'p2', totalPower: 99 },
      ],
    });
    const next = result.nextState;

    expect(next.battleResults.at(-1)?.winnerPlayerIds).toEqual(['p1']);
    expect(next.cards.find((card) => card.instanceId === SOURCE_ID)).toMatchObject({ zone: 'removed_from_game' });
    expect(next.abilityRuntime!.cardState[SOURCE_ID]!.active).toBe(false);
    expect(next.abilityRuntime!.transformedReturnSilenceSourceCardIds ?? []).not.toContain(SOURCE_ID);
    expect(next.ruleOverrides?.mustDeployToBattlefieldPlayerIds ?? []).not.toContain('p1');

    const replayable = structuredClone(next);
    replayable.abilityRuntime!.processedEvents = replayable.abilityRuntime!.processedEvents.filter((id) => id !== 'battle:1:miyama_town');
    const ordinary = resolveBattlefield(replayable, {
      battlefieldId: 'miyama_town',
      participants: [
        { playerId: 'p1', totalPower: 1 },
        { playerId: 'p2', totalPower: 99 },
      ],
    });
    expect(ordinary.nextState.battleResults.at(-1)?.winnerPlayerIds).toEqual(['p2']);
  });

  it('fails closed atomically for a malformed same-family shape', () => {
    const malformed = structuredClone(raw);
    const source = malformed.cards.find((card: { id: string }) => card.id === SOURCE_DEFINITION_ID);
    const ability = source.abilities.find((candidate: { id: string }) => candidate.id === ABILITY_ID);
    ability.conditions = [{ type: 'controller_won_battle' }];
    const state = setup({ archive: malformed });
    const loaded = state.abilityRuntime!.pack.cards[SOURCE_DEFINITION_ID]!.abilities.find((candidate) => candidate.id === ABILITY_ID)!;
    expect(rules.isBattleLossStateTransformSemantic(loaded)).toBe(false);

    const before = JSON.stringify(state);
    expect(() => rules.executeAbility(state, {
      controllerId: 'p1',
      sourceCardId: SOURCE_ID,
      abilityId: ABILITY_ID,
      variables: {},
      selections: {},
      event: lossEvent('b23-malformed'),
    })).toThrow();
    expect(JSON.stringify(state)).toBe(before);
  });
});
