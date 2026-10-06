import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import contentLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';
import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.dan';
const PATH = 'data/authoring/masters/master.dan.json';
const S1 = `${ROOT}.skill.s1`;
const S1A = `${ROOT}.skill.s1a`;
const ASC = `${ROOT}.skill.ascension`;
const PREP = 'basic.preparation';
const DASH = 'basic.surveil';
const IDS = [S1, S1A, ASC];

const raw = JSON.parse(readFileSync(PATH, 'utf8'));
const loaded = rules.loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;

function addSkill(state: GameState, definitionId: string) {
  const instanceId = `dan:${definitionId.split('.').at(-1)}:${state.cards.length}`;
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

function setup() {
  for (const definition of Object.values(loaded.cards) as any[]) definition.ownerId = ROOT;
  const pack = {
    ...loaded,
    cards: {
      ...loaded.cards,
      [PREP]: (contentLibrary as any).rules.cards[PREP],
      [DASH]: (contentLibrary as any).rules.cards[DASH],
    },
  };
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.cards = [];
  rules.initializeAbilityRuntime(state, pack as any, { seed: 20261007 });
  state.players[0]!.masterCardId = ROOT;
  return state;
}

describe('P3 Dan owner-complete migration', () => {
  it('materializes exactly the frozen 3/3 scope with locked metadata', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('丹·布拉克莫尔');
    expect(raw.publicInformation).toEqual({ type: 'master_package', initialMana: 4 });
    expect(raw.cards.map((entry: any) => entry.id)).toEqual(IDS);
    expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);

    expect(card(S1).cardFace).toMatchObject({ typeLabel: '被动', cost: 0, basePower: 0, attributes: [] });
    expect(card(S1A).cardFace).toMatchObject({ typeLabel: '被动', cost: 0, basePower: 0, attributes: [] });
    expect(card(ASC).cardFace).toMatchObject({ typeLabel: '升华技', cost: 0, basePower: 0, attributes: [] });
    expect(raw.cards.find((entry: any) => entry.id === ASC).initialPlacement).toBe('outside_game');

    expect(raw.cards.find((entry: any) => entry.id === S1).printedText)
      .toBe('当你部署于魔术工房，本回合你于深山町获得3点地利且于新都获得5点地利。');
    expect(raw.cards.find((entry: any) => entry.id === S1A).printedText)
      .toBe('若你移动至一处移动时恰好有两名对手的战场并于此处获胜时，你无法获得该战场的竞争战果。');
    expect(raw.cards.find((entry: any) => entry.id === ASC).printedText)
      .toBe('从游戏外将3张远隔操作和2张急行放置于此牌上。每回合你至多可将其中的一张牌追加打出（回合结束时该牌进入你的弃牌堆）。若如此，抽1张牌并将该牌移除。');
  });

  it('routes all Dan consumers only through the accepted identity-free readiness gateway', () => {
    for (const ability of [
      card(S1).abilities[0]!,
      card(S1A).abilities[0]!,
      ...card(ASC).abilities,
    ]) {
      expect(rules.isAcceptedRoundLocationSupplyAbility(ability)).toBe(true);
    }
    expect(card(S1).abilities[0]!.effects[0]).toEqual({
      type: 'round_location_terrain_replacements',
      triggerLocationId: 'magic_workshop',
      replacements: [
        { locationId: 'miyama_town', value: 3 },
        { locationId: 'shinto', value: 5 },
      ],
    });
    expect(card(S1A).abilities[0]!.effects[0]).toEqual({
      type: 'arm_movement_competition_suppression',
      opponentCount: 2,
      suppresses: 'competition_vp',
    });
    expect(card(ASC).abilities[0]!.effects[0]).toEqual({
      type: 'seed_attached_supply',
      cards: [
        { definitionId: PREP, count: 3 },
        { definitionId: DASH, count: 2 },
      ],
    });
  });

  it('executes the migrated workshop terrain and Honor semantics', () => {
    const state = setup();
    addSkill(state, S1);
    addSkill(state, S1A);

    state.players[0]!.locationId = 'magic_workshop';
    rules.processAbilityEvent(state, {
      id: 'dan-deploy-workshop',
      type: 'after_player_deployed_to_location',
      playerId: 'p1',
      locationId: 'magic_workshop',
    });
    state.players[0]!.locationId = 'miyama_town';
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(3);
    state.players[0]!.locationId = 'shinto';
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(5);

    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';
    state.players[2]!.locationId = 'miyama_town';
    state.players[3]!.locationId = 'shinto';
    rules.processAbilityEvent(state, {
      id: 'dan-honor-move',
      type: 'after_controller_enters_location',
      playerId: 'p1',
      previousLocationId: 'magic_workshop',
      locationId: 'miyama_town',
      movementKind: 'normal',
    });
    expect(rules.movementCompetitionRewardSuppressed(state, 'p1', 'miyama_town')).toBe(true);
  });

  it('seeds the exact ascension supply and allows only one attached play per round', () => {
    const state = setup();
    const asc = addSkill(state, ASC);
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    state.players[0]!.mana = 3;

    state.cards.push({
      instanceId: 'dan-draw-card',
      definitionId: PREP,
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'deck',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    } as any);
    state.abilityRuntime!.cardState['dan-draw-card'] = {
      active: false,
      faceDown: false,
      playedRound: state.round.roundNumber,
    };

    rules.processAbilityEvent(state, {
      id: 'dan-ascension-unlocked',
      type: 'after_master_ascension_unlocked',
      playerId: 'p1',
      sourceCardId: asc,
    });

    const supply = rules.attachedSupplyStateForPlayer(state, 'p1')!;
    expect(supply.definitionIds.filter((id) => id === PREP)).toHaveLength(3);
    expect(supply.definitionIds.filter((id) => id === DASH)).toHaveLength(2);

    const legal = rules.getLegalActions(state, 'p1').filter((entry) => entry.type === 'activate_ability');
    expect(legal).toEqual(expect.arrayContaining([
      expect.objectContaining({ cardInstanceId: asc, abilityId: 'dan.ascension.play-preparation' }),
      expect.objectContaining({ cardInstanceId: asc, abilityId: 'dan.ascension.play-suveil' }),
    ]));

    const result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'activate_ability',
      cardInstanceId: asc,
      abilityId: 'dan.ascension.play-preparation',
    });
    expect(result.ok).toBe(true);
    expect(state.players[0]!.mana).toBe(2);
    expect(state.cards.filter((entry) => supply.cardInstanceIds.includes(entry.instanceId) && entry.definitionId === PREP && entry.zone === 'attack_area')).toHaveLength(1);
    expect(state.cards.find((entry) => entry.instanceId === 'dan-draw-card')!.zone).toBe('hand');
    expect(state.abilityRuntime!.playCounters.attacksDeclaredByPlayer.p1 ?? 0).toBe(0);
    expect(rules.getLegalActions(state, 'p1').some((entry) =>
      entry.type === 'activate_ability' &&
      entry.cardInstanceId === asc &&
      ['dan.ascension.play-preparation', 'dan.ascension.play-suveil'].includes(entry.abilityId))).toBe(false);
  });

  it('registers Dan exactly once after Ciel and emits all three identities in the generated library', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    const index = pack.authoringMasterFiles.indexOf(PATH);
    expect(pack.authoringMasterFiles[index - 1]).toBe('data/authoring/masters/master.ciel.json');

    const generated = readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8');
    for (const id of [ROOT, ...IDS]) expect(generated).toContain(id);
  });

  it('keeps production runtime authority free of Dan identity and printed-name branches', () => {
    const production = [
      'packages/rules/src/ability/round-location-supply-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/core/terrain-advantage.ts',
      'packages/rules/src/core/combat-resolver.ts',
    ].map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();

    for (const needle of ['master.dan', '丹·布拉克莫尔', '五朔节骑士', '可敬的狙击手', 'core.dan-']) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });
});
