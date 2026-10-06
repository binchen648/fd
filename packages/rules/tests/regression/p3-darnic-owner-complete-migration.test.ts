import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { DOUBLE_CONTROLLER_TERRAIN_EFFECT, isAcceptedDoubleControllerTerrainAbility } from '../../src/ability/terrain-fortification-extra-play-capability';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.darnic';
const PATH = 'data/authoring/masters/master.darnic.json';
const S1 = `${ROOT}.skill.s1`;
const S1A = `${ROOT}.skill.s1a`;
const ASC = `${ROOT}.skill.ascension`;
const IDS = [S1, S1A, ASC];

const raw = JSON.parse(readFileSync(PATH, 'utf8'));
const loaded = rules.loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;

function addSkill(state: GameState, definitionId: string) {
  const instanceId = `darnic:${definitionId.split('.').at(-1)}:${state.cards.length}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = {
    active: false,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return instanceId;
}

function setup(activeSeats = [1, 2, 3]) {
  for (const definition of Object.values(loaded.cards) as any[]) definition.ownerId = ROOT;
  const state = createSeededGameState({ activeSeats });
  state.cards = [];
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261007 });
  state.players[0]!.masterCardId = ROOT;
  return state;
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

describe('P3 Darnic owner-complete migration', () => {
  it('materializes exactly the frozen 3/3 scope with locked metadata and printed behavior', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('达尼克·普雷斯通');
    expect(raw.publicInformation).toEqual({ type: 'master_package', initialMana: 4 });
    expect(raw.cards.map((entry: any) => entry.id)).toEqual(IDS);
    expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);

    expect(card(S1).cardFace).toMatchObject({ typeLabel: '被动', cost: 0, basePower: 0, attributes: [] });
    expect(card(S1A).cardFace).toMatchObject({ typeLabel: '被动', cost: 0, basePower: 0, attributes: [] });
    expect(card(ASC).cardFace).toMatchObject({ typeLabel: '力量', cost: 8, basePower: 9, attributes: ['力量'] });
    expect(raw.cards.find((entry: any) => entry.id === ASC).initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry: any) => entry.id === ASC).playRequirements)
      .toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);

    expect(raw.cards.find((entry: any) => entry.id === S1).printedText)
      .toBe('你战场上未被占领的地利将属于你。');
    expect(raw.cards.find((entry: any) => entry.id === S1A).printedText)
      .toBe('当你赢得一场战斗后，你可以将你的魔力设为4点。\n回合结束时，若你的魔力小于等于2，失去2点战果。');
    expect(raw.cards.find((entry: any) => entry.id === ASC).printedText)
      .toBe('（将此牌加入你的技能区）\n焦土作战-被动：与你位于同一战场的对手的行动阶段开始时必须花费2点战果维持地利，否则其失去地利。\n空中支援-行动阶段：将你的地利翻倍。');
  });

  it('routes the complete consumer scope through accepted identity-free readiness semantics', () => {
    expect(rules.isAcceptedUnclaimedTerrainUpkeepAbility(card(S1).abilities[0]!)).toBe(true);
    expect(rules.isAcceptedUnclaimedTerrainUpkeepAbility(card(ASC).abilities[0]!)).toBe(true);
    expect(isAcceptedDoubleControllerTerrainAbility(card(ASC).abilities[1]!)).toBe(true);

    expect(card(S1).abilities[0]!.effects[0]).toEqual({
      type: rules.UNCLAIMED_BATTLEFIELD_TERRAIN_BONUS_EFFECT,
    });
    expect(card(ASC).abilities[0]!.effects[0]).toEqual({
      type: rules.SAME_BATTLEFIELD_TERRAIN_UPKEEP_EFFECT,
      victoryPointCost: 2,
    });
    expect(card(ASC).abilities[1]!.effects[0]).toEqual({
      type: DOUBLE_CONTROLLER_TERRAIN_EFFECT,
      multiplier: 2,
      duration: 'this_round',
    });
    expect(card(S1A).abilities.map((ability) => ability.effects[0]?.type)).toEqual([
      'set_mana',
      'adjust_victory_points',
    ]);
  });

  it('executes canonical Domain and Soul Eater through the migrated definitions', () => {
    const state = setup([1, 2]);
    addSkill(state, S1);
    const soul = addSkill(state, S1A);
    state.players[0]!.locationId = 'miyama_town';

    expect(rules.unclaimedBattlefieldTerrainBonus(state, 'p1', 'miyama_town')).toBe(4);
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(4);

    state.players[0]!.mana = 1;
    state.players[0]!.vp = 5;
    rules.processAbilityEvent(state, {
      id: 'darnic-soul-win',
      type: 'after_controller_wins_battle',
      playerId: 'p1',
      battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1', 'p2'],
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
    const response = rules.getLegalActions(state, 'p1').find((entry) =>
      entry.type === 'resolve_response' &&
      entry.cardInstanceId === soul &&
      entry.abilityId === 'darnic.s1a.soul-eater-win');
    expect(response).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', response!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4);

    state.players[0]!.mana = 2;
    rules.processAbilityEvent(state, { id: 'darnic-round-end', type: 'round_end' });
    expect(state.players[0]!.vp).toBe(3);
  });

  it('executes canonical Scorched Earth and Air Support with preserved terrain-slot authority', () => {
    const state = setup([1, 2]);
    const asc = addSkill(state, ASC);
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';

    const mode = terrainMode(state);
    mode.terrainAssignments!.miyama_town = ['p1', 'p2'];
    mode.terrainAssignmentSlots!.miyama_town = { p1: 0, p2: 1 };
    state.players[1]!.vp = 1;
    state.round.activePhase = 'action';

    expect(rules.settleSameBattlefieldTerrainUpkeepForPriorityPlayer(state, 'p2')).toBe(1);
    expect(rules.playerHasAssignedTerrain(state, 'p2', 'miyama_town')).toBe(false);
    expect(terrainMode(state).terrainAssignments!.miyama_town).toEqual(['p1']);
    expect(terrainMode(state).terrainAssignmentSlots!.miyama_town).toEqual({ p1: 0 });

    state.round.prioritySeat = state.players[0]!.seat;
    const action = rules.getLegalActions(state, 'p1').find((entry) =>
      entry.type === 'activate_ability' &&
      entry.cardInstanceId === asc &&
      entry.abilityId === 'darnic.ascension.air-support');
    expect(action).toBeDefined();
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(3);
    expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(6);
  });

  it('registers Darnic exactly once immediately after Dan and emits all identities in generated content', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    const index = pack.authoringMasterFiles.indexOf(PATH);
    expect(pack.authoringMasterFiles[index - 1]).toBe('data/authoring/masters/master.dan.json');

    const generated = readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8');
    for (const id of [ROOT, ...IDS]) expect(generated).toContain(id);
  });

  it('keeps production runtime authority free of Darnic identity and printed-name branches', () => {
    const production = [
      'packages/rules/src/ability/unclaimed-terrain-upkeep-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/core/terrain-advantage.ts',
      'packages/rules/src/core/combat-resolver.ts',
      'packages/rules/src/match-session.ts',
    ].map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();

    for (const needle of ['master.darnic', '达尼克·普雷斯通', '领地', '噬魂者', '老相识', '焦土作战', '空中支援', 'core.darnic-']) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });
});
