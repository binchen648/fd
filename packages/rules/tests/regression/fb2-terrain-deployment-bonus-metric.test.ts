import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { currentDeploymentBonus } from '../../src/core/terrain-advantage';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

function metricArchive(variable = 'controller.deployment_bonus') {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'servant_skill_card_archive',
    id: 'servant.metric-probe',
    name: 'Metric Probe',
    class: 'Caster',
    cards: [{
      id: 'servant.metric-probe.skill.metric',
      name: 'Terrain Metric Probe',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: 'servant.metric-probe' },
      printedText: 'fixture only',
      cardFace: {
        typeLabel: '魔术',
        attributes: ['魔术'],
        cost: 0,
        basePower: { printedExpression: 'X', formula: { var: variable } },
      },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      abilities: [{
        id: 'metric-formula',
        kind: 'continuous_formula',
        printedClause: 'fixture formula',
        activation: { trigger: 'on_card_played', requiresSourceState: 'active' },
        execution: { mode: 'automatic' },
      }],
    }],
  };
}

function terrainState(): GameState {
  const raw = metricArchive();
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.servantCardId = raw.id;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'shinto';
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), { seed: 20260918 });
  (state as unknown as {
    modeState: {
      terrainAssignments: Record<string, string[]>;
      terrainMultipliers: Array<{ playerId: string; multiplier: number }>;
    };
  }).modeState = {
    terrainAssignments: {
      miyama_town: ['p1'],
      shinto: ['unused-slot', 'p2'],
    },
    terrainMultipliers: [],
  };
  return state;
}

function locationModifierValue(state: GameState, playerId: string, battlefieldId: 'miyama_town' | 'shinto', terrainSlotIndex: number) {
  const opponentId = playerId === 'p1' ? 'p2' : 'p1';
  const result = rules.resolveBattlefield(structuredClone(state), {
    battlefieldId,
    participants: [
      { playerId, totalPower: 1, terrainSlotIndex },
      { playerId: opponentId, totalPower: 0 },
    ],
  }).nextState.battleResults.at(-1);
  return result?.participantBreakdowns
    .find((entry) => entry.playerId === playerId)?.modifiers
    .find((modifier) => modifier.source === 'location')?.value;
}

function addPreparation(state: GameState, playerId = 'p1') {
  const instanceId = `${playerId}-preparation`;
  state.cards.push({
    instanceId,
    definitionId: 'basic.preparation',
    ownerPlayerId: playerId,
    controllerPlayerId: playerId,
    zone: 'attack_area',
    visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState[instanceId] = {
    active: true,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
}

function addTerrainSuppression(state: GameState, controllerId = 'p2', battlefieldId = 'miyama_town') {
  const sourceCardId = `${controllerId}-terrain-suppression`;
  state.players.find((player) => player.id === controllerId)!.locationId = battlefieldId;
  state.cards.push({
    instanceId: sourceCardId,
    definitionId: 'fixture.terrain-suppression',
    ownerPlayerId: controllerId,
    controllerPlayerId: controllerId,
    zone: 'field',
    visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState[sourceCardId] = {
    active: true,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  state.abilityRuntime!.ongoingEffects.push({
    id: 'terrain-suppression-effect',
    sourceCardId,
    abilityId: 'terrain-suppression',
    controllerId,
    starts: 'immediate',
    duration: 'this_round',
    startRound: state.round.roundNumber,
    cleanup: 'round_end',
    ruleModifiers: [{
      sourceCardId,
      controllerId,
      definition: {
        id: 'ignore-terrain',
        type: 'immunity',
        operation: 'ignore',
        rule: 'terrain_and_external_servant_or_npc_effects',
        scope: { subject: ['controller', 'single_opponent'] },
      },
    }],
    publicZones: ['field'],
  } as any);
}

describe('P3-FB2-21 shared terrain deployment-bonus metric', () => {
  it('accepts only exact controller.deployment_bonus and keeps near-match variables fail closed', () => {
    expect(rules.loadAuthoringJson(metricArchive()).report).toEqual([]);

    for (const near of [
      'controller.deploymentBonus',
      'controller.deployment_bonus_x',
      'deployment_bonus',
      'controller.terrain_bonus',
    ]) {
      const loaded = rules.loadAuthoringJson(metricArchive(near));
      expect(loaded.report).toContainEqual(expect.objectContaining({
        path: expect.stringContaining('cardFace.basePower'),
        status: 'unsupported',
      }));
    }
  });

  it('uses server-owned terrain assignments and evaluates independently for different controllers and locations', () => {
    const state = terrainState();

    expect(currentDeploymentBonus(state, 'p1')).toBe(3);
    expect(currentDeploymentBonus(state, 'p2')).toBe(1);
    expect(rules.evaluateFormula({ var: 'controller.deployment_bonus' }, state, 'p1', 'metric-source').value).toBe(3);
    expect(rules.evaluateFormula({ var: 'controller.deployment_bonus' }, state, 'p2', 'metric-source').value).toBe(1);
  });

  it('keeps combat and the metric on the same authored terrain value', () => {
    const state = terrainState();
    expect(currentDeploymentBonus(state, 'p1')).toBe(3);
    expect(locationModifierValue(state, 'p1', 'miyama_town', 0)).toBe(3);
  });

  it('applies authored terrain multipliers exactly once in both metric and combat', () => {
    const state = terrainState();
    (state as any).modeState.terrainMultipliers = [{ playerId: 'p1', multiplier: 2 }];

    expect(currentDeploymentBonus(state, 'p1')).toBe(6);
    expect(locationModifierValue(state, 'p1', 'miyama_town', 0)).toBe(6);
  });

  it('applies the existing Preparation remote-operation doubling exactly once', () => {
    const state = terrainState();
    addPreparation(state);

    expect(currentDeploymentBonus(state, 'p1')).toBe(6);
    expect(locationModifierValue(state, 'p1', 'miyama_town', 0)).toBe(6);
  });

  it('returns zero for authored terrain suppression, missing assignment, invalid slot, or non-battlefield location', () => {
    const suppressed = terrainState();
    suppressed.players[1]!.locationId = 'miyama_town';
    addTerrainSuppression(suppressed);
    expect(currentDeploymentBonus(suppressed, 'p1')).toBe(0);
    expect(locationModifierValue(suppressed, 'p1', 'miyama_town', 0)).toBeUndefined();

    const missing = terrainState();
    (missing as any).modeState.terrainAssignments = {};
    expect(currentDeploymentBonus(missing, 'p1')).toBe(0);

    const invalid = terrainState();
    (invalid as any).modeState.terrainAssignments.miyama_town = ['unused', 'unused-2', 'p1'];
    expect(currentDeploymentBonus(invalid, 'p1')).toBe(0);

    const supportLocation = terrainState();
    supportLocation.players[0]!.locationId = 'recon';
    supportLocation.map.locations.find((location) => location.id === 'recon')!.terrainBonuses = [9];
    (supportLocation as any).modeState.terrainAssignments.recon = ['p1'];
    expect(currentDeploymentBonus(supportLocation, 'p1')).toBe(0);
  });

  it('is a pure read: metric evaluation does not mutate state, events, counters, or runtime revision', () => {
    const state = terrainState();
    (state as any).modeState.terrainMultipliers = [{ playerId: 'p1', multiplier: 2 }];
    addPreparation(state);
    const before = structuredClone(state);

    expect(currentDeploymentBonus(state, 'p1')).toBe(12);
    expect(rules.evaluateFormula({ var: 'controller.deployment_bonus' }, state, 'p1', 'metric-source').value).toBe(12);
    expect(state).toEqual(before);
  });
});