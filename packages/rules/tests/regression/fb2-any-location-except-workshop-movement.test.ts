import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const definitionId = 'fixture.any-location-except-workshop';
const abilityId = 'renamed.any-location-except-workshop';
const sourceId = 'fixture-any-location-except-workshop-source';

function rawArchive(abilityPatch: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    id: 'fixture.movement-owner',
    name: 'Movement Fixture',
    class: 'Lancer',
    cards: [{
      id: definitionId,
      name: 'Movement Fixture Skill',
      cardType: 'servant_skill',
      cardFace: { cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [{
        id: abilityId,
        kind: 'phase_action',
        printedClause: '',
        activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
        conditions: [],
        targets: [{
          id: 'destination',
          type: 'location',
          count: { min: 1, max: 1 },
          constraints: [
            { type: 'any_enabled_location' },
            { type: 'not_location_kind', locationKind: 'workshop' },
          ],
        }],
        effects: [{ type: 'move_player', player: 'controller', to: 'destination' }],
        cost: [],
        ruleModifiers: [],
        creates: [],
        lifecycle: {},
        responseWindow: {},
        limit: {},
        visibility: {},
        execution: { mode: 'automatic' },
        ...abilityPatch,
      }],
    }],
  };
}

function compiledAbility(patch: Record<string, unknown> = {}): AuthoringAbility {
  const pack = rules.loadAuthoringJson(rawArchive(patch));
  expect(pack.report).toEqual([]);
  return pack.cards[definitionId]!.abilities[0]!;
}

function setup(patch: Record<string, unknown> = {}) {
  const pack = rules.loadAuthoringJson(rawArchive(patch));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'magic_workshop';
  state.players[2]!.locationId = 'magic_workshop';
  rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
  state.cards.push({
    instanceId: sourceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState[sourceId] = {
    active: true,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return state;
}

function activation(state: GameState) {
  return rules.getLegalActions(state, 'p1').find((candidate) =>
    candidate.type === 'activate_ability' && candidate.cardInstanceId === sourceId && candidate.abilityId === abilityId);
}

function openDecision(state: GameState) {
  const action = activation(state);
  expect(action).toBeDefined();
  const result = rules.dispatchAbilityCommand(state, 'p1', action!);
  expect(result.ok).toBe(true);
  const decision = rules.projectAbilityState(state, 'p1').pendingDecision;
  expect(decision).toBeDefined();
  return decision!;
}

function directContext() {
  return { controllerId: 'p1', sourceCardId: sourceId, abilityId, variables: {}, selections: {} };
}

describe('P3-FB2-09 any-location-except-workshop movement', () => {
  it('classifies only the exact identity-free action movement shape', () => {
    const accepted = compiledAbility();
    accepted.id = 'completely-renamed-movement';
    expect(rules.isAnyLocationExceptWorkshopMovementCandidate(accepted)).toBe(true);
    expect(rules.isAnyLocationExceptWorkshopMovementSemantic(accepted)).toBe(true);

    const arrow = structuredClone(accepted);
    arrow.targets[0]!.constraints = [{ type: 'reachable_along_arrows', maxSteps: 1 }];
    expect(rules.isAnyLocationExceptWorkshopMovementCandidate(arrow)).toBe(false);
    expect(rules.isAnyLocationExceptWorkshopMovementSemantic(arrow)).toBe(false);

    const wrongPlayer = structuredClone(accepted);
    wrongPlayer.effects[0]!.player = 'target';
    expect(rules.isAnyLocationExceptWorkshopMovementCandidate(wrongPlayer)).toBe(true);
    expect(rules.isAnyLocationExceptWorkshopMovementSemantic(wrongPlayer)).toBe(false);
  });

  it('offers every enabled legal destination except current location and Magic Workshop', () => {
    const state = setup();
    const decision = openDecision(state);
    expect(decision.candidates).toEqual(expect.arrayContaining(['shinto', 'recon']));
    expect(decision.candidates).not.toContain('miyama_town');
    expect(decision.candidates).not.toContain('magic_workshop');
    expect(decision.candidates).not.toContain('moon_holy_grail');
  });

  it('settles through typed movement and preserves counters, movement log, enter event, and result identity', () => {
    const state = setup();
    const decision = openDecision(state);
    const eventsBefore = state.abilityRuntime!.events.length;
    const processedBefore = [...state.abilityRuntime!.processedEvents];

    const result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: ['shinto'],
    });
    expect(result.ok).toBe(true);
    expect(state.players[0]!.locationId).toBe('shinto');
    expect(state.abilityRuntime!.movementDistanceThisRound.p1).toBe(1);
    expect(state.abilityRuntime!.battlefieldsPassedOrStayedThisRound.p1).toBe(1);
    expect(state.log).toContainEqual(expect.objectContaining({
      type: 'movement',
      message: 'player:p1:effect_move:miyama_town->shinto',
      payload: expect.objectContaining({ playerId: 'p1', from: 'miyama_town', to: 'shinto', movementKind: 'effect', manaSpent: 0 }),
    }));
    expect(state.abilityRuntime!.processedEvents.length).toBeGreaterThan(processedBefore.length);
    expect(state.abilityRuntime!.events.slice(eventsBefore)).toContainEqual(expect.objectContaining({
      type: 'effect_resolved', sourceCardId: sourceId, abilityId, resultId: expect.stringContaining('.effects[0]'),
    }));
  });

  it('revalidates occupancy before settlement and leaves state unchanged on an illegal late target', () => {
    const state = setup();
    const decision = openDecision(state);
    expect(decision.candidates).toContain('recon');
    state.players[1]!.locationId = 'recon';
    const before = JSON.stringify(state);
    const result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: ['recon'],
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('illegal_target');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('respects disabled locations and an active movement lock before exposing the action', () => {
    const disabled = setup();
    disabled.map.locations.find((location) => location.id === 'recon')!.enabledByDefault = false;
    const disabledDecision = openDecision(disabled);
    expect(disabledDecision.candidates).not.toContain('recon');

    const locked = setup();
    const lockSourceId = 'fixture-movement-lock';
    locked.cards.push({
      instanceId: lockSourceId,
      definitionId,
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'field',
      visibility: { scope: 'public' },
    });
    locked.abilityRuntime!.cardState[lockSourceId] = { active: true, faceDown: false, playedRound: locked.round.roundNumber };
    locked.abilityRuntime!.ongoingEffects.push({
      id: 'movement-lock',
      sourceCardId: lockSourceId,
      abilityId: 'lock',
      controllerId: 'p1',
      starts: 'immediate',
      duration: 'while_active',
      startRound: locked.round.roundNumber,
      cleanup: 'remain_active',
      ruleModifiers: [{
        sourceCardId: lockSourceId,
        controllerId: 'p1',
        definition: { operation: 'forbid', rule: 'enter_or_leave_current_battlefield', scope: { subject: 'all_players' } },
      }],
      publicZones: [],
    });
    expect(activation(locked)).toBeUndefined();
  });

  it('fails a recognized malformed near-match closed before legacy movement or usage mutation', () => {
    const state = setup({
      targets: [{
        id: 'destination', type: 'location', count: { min: 1, max: 1 },
        constraints: [{ type: 'any_enabled_location' }],
      }],
    });
    const ability = state.abilityRuntime!.pack.cards[definitionId]!.abilities[0]!;
    expect(rules.isAnyLocationExceptWorkshopMovementCandidate(ability)).toBe(true);
    expect(rules.isAnyLocationExceptWorkshopMovementSemantic(ability)).toBe(false);
    expect(activation(state)).toBeUndefined();
    const before = JSON.stringify(state);
    expect(() => rules.executeAbility(state, directContext())).toThrow('Unsupported any-location-except-workshop movement semantic shape');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('does not absorb one-step arrow movement into the accepted contract', () => {
    const state = setup({
      targets: [{
        id: 'destination', type: 'location', count: { min: 1, max: 1 },
        constraints: [{ type: 'reachable_along_arrows', maxSteps: 1 }],
      }],
    });
    const ability = state.abilityRuntime!.pack.cards[definitionId]!.abilities[0]!;
    expect(rules.isAnyLocationExceptWorkshopMovementCandidate(ability)).toBe(false);
    expect(rules.isAnyLocationExceptWorkshopMovementSemantic(ability)).toBe(false);
  });
});
