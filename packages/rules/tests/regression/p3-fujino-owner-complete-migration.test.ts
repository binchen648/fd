import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.fujino';
const S1 = ROOT + '.skill.s1';
const S1A = ROOT + '.skill.s1a';
const S2 = ROOT + '.skill.s2';
const S3 = ROOT + '.skill.s3';
const S4 = ROOT + '.skill.s4';
const ASC = ROOT + '.skill.ascension';
const STATE_KEY = 'fujino.injury-warp';
const PATH = 'data/authoring/masters/master.fujino.json';

const raw = JSON.parse(readFileSync(PATH, 'utf8'));
const loaded = rules.loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;
const abilityById = (definitionId: string, abilityId: string) =>
  card(definitionId).abilities.find((ability) => ability.id === abilityId)!;

function setup(): GameState {
  for (const definition of Object.values(loaded.cards) as any[]) definition.ownerId = ROOT;
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.players[0]!.masterCardId = ROOT;
  state.players[0]!.locationId = 'miyama_town';
  state.players[0]!.mana = 12;
  state.players[0]!.vp = 3;
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'magic_workshop';
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261008 });
  add(state, S1);
  add(state, S1A);
  add(state, S2);
  add(state, S4);
  return state;
}

function add(state: GameState, definitionId: string, zone = 'skill', active = false): string {
  const instanceId = 'fujino-owner:' + definitionId.split('.').at(-1) + ':' + state.cards.length;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone,
    visibility: { scope: zone === 'attack_area' ? 'public' : 'owner_only', ...(zone === 'attack_area' ? {} : { ownerPlayerId: 'p1' }) },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = {
    active,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return instanceId;
}

function source(state: GameState, definitionId: string): string {
  return state.cards.find((entry) => entry.definitionId === definitionId)!.instanceId;
}

function ctx(sourceCardId: string, abilityId: string, event?: Record<string, unknown>) {
  return {
    controllerId: 'p1',
    sourceCardId,
    abilityId,
    variables: {},
    selections: {},
    ...(event ? { event: { id: 'fujino-owner-event', ...event } } : {}),
  } as any;
}

describe('P3 Fujino owner-complete migration', () => {
  it('materializes exact 6/6 owner scope, pack registration, static metadata, and accepted capability shapes', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('浅上藤乃');
    expect(raw.publicInformation).toEqual({ type: 'master_package', initialMana: 4 });
    expect(new Set(raw.cards.map((entry: any) => entry.id))).toEqual(new Set([S1, S1A, S2, S3, S4, ASC]));
    expect(Object.keys(loaded.cards).sort()).toEqual([S1, S1A, S2, S3, S4, ASC].sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);

    expect(raw.cards.find((entry: any) => entry.id === S3).initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry: any) => entry.id === ASC).initialPlacement).toBe('outside_game');
    expect(card(S3).cardFace).toMatchObject({ typeLabel: '魔术', attributes: ['魔术'], cost: 3, basePower: 4 });
    expect(card(S3).playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 3 }]);
    expect(card(S3).abilities[0]!.effects).toEqual([{ type: 'append_only_rule' }]);
    expect(card(S1).abilities[0]!.effects[0]).toEqual({
      type: 'provision_skill_cards',
      player: 'controller',
      targetDefinitionIds: [S3],
    });

    expect(rules.isAcceptedInjuryWarpAbility(card(S1A).abilities[0]!)).toBe(true);
    for (const repair of card(S2).abilities) {
      expect(rules.isAcceptedInjuryWarpAbility(repair)).toBe(true);
      expect(rules.isAcceptedInjuryWarpRepairAbility(repair)).toBe(true);
    }
    expect(rules.isAcceptedInjuryWarpAbility(abilityById(S3, 'fujino.s3.bend-space'))).toBe(true);
    for (const ability of card(S4).abilities) expect(rules.isAcceptedInjuryWarpAbility(ability)).toBe(true);
    expect(rules.isAcceptedInjuryWarpAbility(card(ASC).abilities[0]!)).toBe(true);

    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry.endsWith('/master.fujino.json'))).toHaveLength(1);
    expect(pack.authoringMasterFiles.at(-1)).toBe(PATH);
  });

  it('provisions Distortion at game start, activates warped topology, and repairs it out of turn in preparation', () => {
    const state = setup();
    const s1 = source(state, S1);
    rules.processAbilityEvent(state, { id: 'fujino-owner-game-start', type: 'game_start' });

    const distortion = state.cards.filter((entry) => entry.definitionId === S3);
    expect(distortion).toHaveLength(1);
    expect(distortion[0]).toMatchObject({
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'skill',
      generatedBy: s1,
    });

    distortion[0]!.zone = 'attack_area';
    distortion[0]!.visibility = { scope: 'public' };
    state.abilityRuntime!.cardState[distortion[0]!.instanceId]!.active = true;
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;

    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'activate_ability',
      cardInstanceId: distortion[0]!.instanceId,
      abilityId: 'fujino.s3.bend-space',
    }).ok).toBe(true);
    expect(rules.effectiveInjuryWarpMovementLinks(state, 'miyama_town', ['shinto'] as const)).toEqual(['recon']);

    const warp = source(state, S2);
    expect(state.abilityRuntime!.cardState[warp]!.active).toBe(true);
    state.round.activePhase = 'preparation';
    state.round.prioritySeat = state.players[1]!.seat;
    expect(rules.getLegalActions(state, 'p1')).toContainEqual({
      type: 'activate_ability',
      cardInstanceId: warp,
      abilityId: 'fujino.s2.repair.preparation',
    });
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'activate_ability',
      cardInstanceId: warp,
      abilityId: 'fujino.s2.repair.preparation',
    }).ok).toBe(true);
    expect(rules.effectiveInjuryWarpMovementLinks(state, 'miyama_town', ['shinto'] as const)).toEqual(['shinto']);
  });

  it('executes spinal conversion, ascension copy, Pain cost reduction, restore bound, and one-time +4 VP reward', () => {
    const state = setup();
    rules.processAbilityEvent(state, { id: 'fujino-owner-game-start-2', type: 'game_start' });
    const s4 = source(state, S4);
    const ruleset = abilityById(S4, 'fujino.s4.ruleset');
    expect(rules.resolveInjuryWarpEffect(state, ctx(s4, ruleset.id), ruleset)).toBe(true);

    const iw = state.abilityRuntime!.injuryWarpStates!['p1:' + STATE_KEY]!;
    iw.activeInjuries = ['head', 'shoulder', 'stomach', 'wrist', 'leg'];
    iw.deck = ['spinal'];
    state.round.activePhase = 'battle';
    state.round.prioritySeat = state.players[0]!.seat;
    state.players[0]!.locationId = 'miyama_town';

    const drawSource = source(state, S1A);
    const draw = card(S1A).abilities[0]!;
    expect(rules.resolveInjuryWarpEffect(
      state,
      ctx(drawSource, draw.id, { type: 'controller_combat_action_window', playerId: 'p1' }),
      draw,
    )).toBe(true);
    expect(iw.spinalOccurred).toBe(true);
    expect(iw.painCount).toBe(6);
    expect(iw.deck).toEqual([]);
    expect(iw.activeInjuries).toEqual([]);

    const distortion = state.cards.find((entry) => entry.definitionId === S3)!;
    expect(distortion.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[distortion.instanceId]!.active).toBe(true);
    expect(rules.effectiveCardPlayCost(state, 'p1', distortion.instanceId)).toBe(2);

    const ascensionSource = add(state, ASC);
    const ascension = card(ASC).abilities[0]!;
    expect(rules.resolveInjuryWarpEffect(
      state,
      ctx(ascensionSource, ascension.id, { type: 'after_master_ascension_unlocked', playerId: 'p1' }),
      ascension,
    )).toBe(true);
    expect(iw.ascensionUnlocked).toBe(true);
    expect(state.cards.filter((entry) => entry.definitionId === S3)).toHaveLength(2);
    expect(rules.isInjuryWarpRuntimeProvenanceValidForRestore(structuredClone(state))).toBe(true);

    const forged = structuredClone(state);
    forged.abilityRuntime!.injuryWarpStates!['p1:' + STATE_KEY]!.painCount = 999;
    expect(rules.isInjuryWarpRuntimeProvenanceValidForRestore(forged)).toBe(false);

    const pain = abilityById(S4, 'fujino.s4.pain-battle-end');
    const before = state.players[0]!.vp;
    for (let index = 0; index < 6; index++) {
      expect(rules.resolveInjuryWarpEffect(
        state,
        ctx(s4, pain.id, { type: 'after_battle_ended', playerId: 'p1', battlePhaseResolutionId: 'fujino-owner-battle' }),
        pain,
      )).toBe(true);
    }
    expect(iw.painCount).toBe(0);
    expect(iw.rewardGranted).toBe(true);
    expect(state.players[0]!.vp).toBe(before + 4);
    expect(rules.resolveInjuryWarpEffect(
      state,
      ctx(s4, pain.id, { type: 'after_battle_ended', playerId: 'p1', battlePhaseResolutionId: 'fujino-owner-battle-repeat' }),
      pain,
    )).toBe(false);
    expect(state.players[0]!.vp).toBe(before + 4);
  });

  it('keeps production runtime identity-free for Fujino consumers', () => {
    const production = [
      'packages/rules/src/ability/injury-warp-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/core/movement.ts',
      'packages/rules/src/match-session.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n').toLowerCase();

    for (const needle of [
      'master.fujino', '浅上藤乃', '痛觉残留', '浅神之嗣', '无痛症', '扭曲空间', '歪曲之魔眼', '创伤', 'core.fujino-',
    ]) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });
});
