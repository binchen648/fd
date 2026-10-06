import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { DOUBLE_CONTROLLER_TERRAIN_EFFECT, isAcceptedDoubleControllerTerrainAbility } from '../../src/ability/terrain-fortification-extra-play-capability';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'fixture.terrain-owner';
const LAND = 'fixture.terrain-owner.skill.land';
const SOUL = 'fixture.terrain-owner.skill.soul';
const ASC = 'fixture.terrain-owner.skill.ascension';

const standard = {
  conditions: [],
  targets: [],
  cost: [],
  ruleModifiers: [],
  creates: [],
  lifecycle: {},
  responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
  limit: {},
  visibility: {},
  execution: { mode: 'automatic', allowedOperations: [] },
};

const archive = {
  schemaVersion: 'fd-card-authoring-v1',
  archiveType: 'master_skill_card_archive',
  id: ROOT,
  name: 'Fixture Terrain Owner',
  class: 'Master',
  publicInformation: { type: 'master_package', initialMana: 4 },
  cards: [
    {
      id: LAND,
      name: 'Land',
      cardType: 'master_skill',
      owner: { type: 'master', id: ROOT },
      printedText: 'Unclaimed battlefield terrain belongs to you.',
      cardFace: { typeLabel: '被动', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [{
        id: 'fixture.land.unclaimed',
        kind: 'passive',
        printedClause: 'Unclaimed battlefield terrain belongs to you.',
        activation: {},
        effects: [{ type: rules.UNCLAIMED_BATTLEFIELD_TERRAIN_BONUS_EFFECT }],
        ...standard,
      }],
      verification: { implementationStatus: 'complete' },
    },
    {
      id: SOUL,
      name: 'Soul',
      cardType: 'master_skill',
      owner: { type: 'master', id: ROOT },
      printedText: 'After winning, you may set mana to 4. At round end with mana <=2, lose 2 VP.',
      cardFace: { typeLabel: '被动', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [
        {
          id: 'fixture.soul.win-set-mana',
          kind: 'optional_trigger',
          printedClause: 'After winning a battle, you may set your mana to 4.',
          activation: { trigger: 'after_controller_wins_battle' },
          conditions: [],
          targets: [],
          effects: [{ type: 'set_mana', amount: 4 }],
          cost: [],
          ruleModifiers: [],
          creates: [],
          lifecycle: {},
          responseWindow: { opens: 'after_controller_wins_battle', order: 'turn_order', passBehavior: 'decline_this_window' },
          limit: {},
          visibility: {},
          execution: { mode: 'automatic', allowedOperations: [] },
        },
        {
          id: 'fixture.soul.round-end-loss',
          kind: 'forced_trigger',
          printedClause: 'At round end, if mana <=2, lose 2 VP.',
          activation: { trigger: 'round_end' },
          conditions: [{ type: 'controller_mana_at_least', value: 3, negated: true }],
          targets: [],
          effects: [{ type: 'adjust_victory_points', player: 'controller', amount: -2 }],
          cost: [],
          ruleModifiers: [],
          creates: [],
          lifecycle: {},
          responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
          limit: {},
          visibility: {},
          execution: { mode: 'automatic', allowedOperations: [] },
        },
      ],
      verification: { implementationStatus: 'complete' },
    },
    {
      id: ASC,
      name: 'Old Acquaintances',
      cardType: 'master_skill',
      owner: { type: 'master', id: ROOT },
      printedText: 'Opponents at your battlefield pay 2 VP at action-turn start to retain terrain; action: double your terrain.',
      cardFace: { typeLabel: '力量', attributes: ['力量'], cost: 8, basePower: 9 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      abilities: [
        {
          id: 'fixture.asc.upkeep',
          kind: 'passive',
          printedClause: 'Opponents at your battlefield pay 2 VP at action-turn start to retain terrain or lose it.',
          activation: {},
          effects: [{ type: rules.SAME_BATTLEFIELD_TERRAIN_UPKEEP_EFFECT, victoryPointCost: 2 }],
          ...standard,
        },
        {
          id: 'fixture.asc.air-support',
          kind: 'phase_action',
          printedClause: 'Action: double your terrain.',
          activation: { phase: 'action', opens: 'controller_action_window' },
          conditions: [{ type: 'source_owned' }],
          targets: [],
          effects: [{ type: DOUBLE_CONTROLLER_TERRAIN_EFFECT, multiplier: 2, duration: 'this_round' }],
          cost: [],
          ruleModifiers: [],
          creates: [],
          lifecycle: {},
          responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
          limit: {},
          visibility: {},
          execution: { mode: 'automatic', allowedOperations: [] },
        },
      ],
      verification: { implementationStatus: 'complete' },
    },
  ],
  sources: [],
};

const loaded = rules.loadAuthoringJson(archive);
const ability = (definitionId: string, abilityId: string) =>
  loaded.cards[definitionId]!.abilities.find((entry) => entry.id === abilityId)!;

function setup(activeSeats = [1, 2, 3]): GameState {
  for (const definition of Object.values(loaded.cards) as any[]) definition.ownerId = ROOT;
  const state = createSeededGameState({ activeSeats });
  state.cards = [];
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261007 });
  return state;
}

function addSkill(state: GameState, playerId: string, definitionId: string) {
  const instanceId = `${playerId}:${definitionId.split('.').at(-1)}:${state.cards.length}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: playerId,
    controllerPlayerId: playerId,
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: playerId },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

function terrainMode(state: GameState) {
  const carrier = state as unknown as {
    modeState?: {
      terrainAssignments?: Record<string, string[]>;
      terrainAssignmentSlots?: Record<string, Record<string, number>>;
    };
  };
  carrier.modeState ??= {};
  carrier.modeState.terrainAssignments ??= {};
  carrier.modeState.terrainAssignmentSlots ??= {};
  return carrier.modeState;
}

describe('P3 Darnic owner readiness complete gap set', () => {
  it('accepts the complete identity-free gap set and rejects malformed privileged shapes', () => {
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    expect(rules.isAcceptedUnclaimedTerrainUpkeepAbility(ability(LAND, 'fixture.land.unclaimed'))).toBe(true);
    expect(rules.isAcceptedUnclaimedTerrainUpkeepAbility(ability(ASC, 'fixture.asc.upkeep'))).toBe(true);
    expect(isAcceptedDoubleControllerTerrainAbility(ability(ASC, 'fixture.asc.air-support'))).toBe(true);

    const malformed = structuredClone(ability(ASC, 'fixture.asc.upkeep'));
    (malformed.effects[0] as any).victoryPointCost = 1;
    expect(rules.isAcceptedUnclaimedTerrainUpkeepAbility(malformed)).toBe(false);
    expect(rules.containsUnclaimedTerrainUpkeepPrivilegedNode(malformed)).toBe(true);
  });

  it('adds all currently unclaimed printed battlefield terrain without identity routing', () => {
    const state = setup();
    addSkill(state, 'p1', LAND);
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';

    const mode = terrainMode(state);
    mode.terrainAssignments!.miyama_town = ['p1'];
    mode.terrainAssignmentSlots!.miyama_town = { p1: 0 };
    expect(rules.unclaimedBattlefieldTerrainBonus(state, 'p1', 'miyama_town')).toBe(1);
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(4);

    mode.terrainAssignments!.miyama_town = ['p1', 'p2'];
    mode.terrainAssignmentSlots!.miyama_town = { p1: 0, p2: 1 };
    expect(rules.unclaimedBattlefieldTerrainBonus(state, 'p1', 'miyama_town')).toBe(0);
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(3);

    delete mode.terrainAssignments!.miyama_town;
    delete mode.terrainAssignmentSlots!.miyama_town;
    expect(rules.unclaimedBattlefieldTerrainBonus(state, 'p1', 'miyama_town')).toBe(4);
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(4);
  });

  it('treats reserved multi-presence deployment terrain as occupied', () => {
    const state = setup();
    addSkill(state, 'p1', LAND);
    state.players[0]!.locationId = 'miyama_town';
    state.abilityRuntime!.extraPlayerPresences = [{
      id: 'p2:fixture.presence',
      playerId: 'p2',
      presenceKey: 'fixture.presence',
      locationId: 'shinto',
      deployedAtLocationId: 'miyama_town',
      terrainAdvantage: 3,
      sourceCardId: 'fixture-presence-source',
      sourceAbilityId: 'fixture-presence-ability',
      createdRound: 1,
      updatedRevision: 0,
    }];
    expect(rules.unclaimedBattlefieldTerrainBonus(state, 'p1', 'miyama_town')).toBe(1);
  });

  it('charges exactly 2 VP at an opponent action-turn start and is idempotent', () => {
    const state = setup([1, 2]);
    addSkill(state, 'p2', ASC);
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';
    state.players[0]!.vp = 5;
    const mode = terrainMode(state);
    mode.terrainAssignments!.miyama_town = ['p1', 'p2'];
    mode.terrainAssignmentSlots!.miyama_town = { p1: 0, p2: 1 };
    state.round.prioritySeat = 1;

    rules.advanceAbilityPhase(state, 'action');
    expect(state.players[0]!.vp).toBe(3);
    expect(rules.playerHasAssignedTerrain(state, 'p1', 'miyama_town')).toBe(true);
    expect(rules.settleSameBattlefieldTerrainUpkeepForPriorityPlayer(state, 'p1')).toBe(0);
    expect(state.players[0]!.vp).toBe(3);

    const restored = structuredClone(state);
    expect(rules.settleSameBattlefieldTerrainUpkeepForPriorityPlayer(restored, 'p1')).toBe(0);
    expect(restored.players[0]!.vp).toBe(3);
  });

  it('releases insufficient-VP terrain while preserving every retained explicit slot', () => {
    const state = setup([1, 2]);
    addSkill(state, 'p2', ASC);
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';
    state.players[0]!.vp = 1;
    const mode = terrainMode(state);
    mode.terrainAssignments!.miyama_town = ['p1', 'p2'];
    mode.terrainAssignmentSlots!.miyama_town = { p1: 0, p2: 1 };
    state.round.prioritySeat = 1;

    rules.advanceAbilityPhase(state, 'action');
    expect(state.players[0]!.vp).toBe(1);
    expect(rules.playerHasAssignedTerrain(state, 'p1', 'miyama_town')).toBe(false);
    const afterMode = terrainMode(state);
    expect(afterMode.terrainAssignments!.miyama_town).toEqual(['p2']);
    expect(afterMode.terrainAssignmentSlots!.miyama_town).toEqual({ p2: 1 });
    expect(rules.assignedTerrainSlotIndex(state, 'miyama_town', 'p2')).toBe(1);
    expect(rules.currentDeploymentBonus(state, 'p2')).toBe(1);
  });

  it('reuses the accepted generic zero-cost terrain-doubling action', () => {
    const state = setup([1, 2]);
    const asc = addSkill(state, 'p1', ASC);
    state.players[0]!.locationId = 'miyama_town';
    const mode = terrainMode(state);
    mode.terrainAssignments!.miyama_town = ['p1'];
    mode.terrainAssignmentSlots!.miyama_town = { p1: 0 };
    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;

    const action = rules.getLegalActions(state, 'p1').find((entry) =>
      entry.type === 'activate_ability' && entry.cardInstanceId === asc && entry.abilityId === 'fixture.asc.air-support');
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
    const afterMode = (state as unknown as { modeState?: { terrainMultipliers?: Array<Record<string, unknown>> } }).modeState;
    expect(afterMode?.terrainMultipliers).toContainEqual(expect.objectContaining({ playerId: 'p1', multiplier: 2, duration: 'this_round' }));
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(6);
  });

  it('proves Soul Eater through existing generic optional-set and round-end resource primitives', () => {
    const state = setup([1, 2]);
    const soul = addSkill(state, 'p1', SOUL);
    state.players[0]!.mana = 1;
    state.players[0]!.vp = 5;

    rules.processAbilityEvent(state, {
      id: 'fixture-soul-win',
      type: 'after_controller_wins_battle',
      playerId: 'p1',
      battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1', 'p2'],
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
    const response = rules.getLegalActions(state, 'p1').find((entry) =>
      entry.type === 'resolve_response' && entry.cardInstanceId === soul && entry.abilityId === 'fixture.soul.win-set-mana');
    expect(response).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', response!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4);

    state.players[0]!.mana = 2;
    rules.processAbilityEvent(state, { id: 'fixture-soul-round-end', type: 'round_end' });
    expect(state.players[0]!.vp).toBe(3);
  });

  it('projects unclaimed terrain into combat and keeps production authority identity-free', () => {
    const state = setup([1, 2]);
    addSkill(state, 'p1', LAND);
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';
    const mode = terrainMode(state);
    mode.terrainAssignments!.miyama_town = ['p2'];
    mode.terrainAssignmentSlots!.miyama_town = { p2: 0 };

    const battle = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town' }).nextState.battleResults.at(-1)!;
    const p1 = battle.participantBreakdowns.find((entry) => entry.playerId === 'p1')!;
    expect(p1.modifiers).toContainEqual(expect.objectContaining({
      source: 'location',
      label: 'miyama_town.unclaimed_terrain',
      value: 1,
    }));

    const production = [
      'packages/rules/src/ability/unclaimed-terrain-upkeep-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/core/terrain-advantage.ts',
      'packages/rules/src/core/combat-resolver.ts',
      'packages/rules/src/match-session.ts',
    ].map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();
    for (const needle of ['master.darnic', '达尼克·普雷斯通', '噬魂者', '焦土作战', 'core.darnic-']) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });
});
