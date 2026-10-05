import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { loadAuthoringJson } from '../../src/ability/loader';
import {
  dispatchAbilityCommand,
  initializeAbilityRuntime,
  isDeferredAbilityRuntimeProvenanceValidForRestore,
  processAbilityEvent,
} from '../../src/ability/interpreter';
import { movePlayer } from '../../src/core/movement';
import { spendMana } from '../../src/core/rule-overrides';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ROOT = 'master.caren';
const ASC = `${ROOT}.skill.ascension`;
const S1 = `${ROOT}.skill.s1`;
const S1A = `${ROOT}.skill.s1a`;
const S2 = `${ROOT}.skill.s2`;
const S3 = `${ROOT}.skill.s3`;
const IDS = [ASC, S1, S1A, S2, S3];
const PATH = 'data/authoring/masters/master.caren.json';
const OPP_SKILL = 'servant.fixture-caren-source.skill.s1';
const OPP_GAIN = 'fixture.caren.opponent.gain-vp';

const raw = JSON.parse(readFileSync(PATH, 'utf8'));
const loaded = loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;
const effectTypes = (id: string) => card(id).abilities.flatMap((ability) => ability.effects.map((effect) => effect.type));

function addPhysical(state: GameState, definitionId: string, zone = 'skill', owner = 'p1') {
  const instanceId = `caren:${owner}:${definitionId}:${state.cards.length}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: owner,
    controllerPlayerId: owner,
    zone,
    visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

function setup() {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  initializeAbilityRuntime(state, loaded, { seed: 20261005 });
  const p1 = state.players[0]!; const p2 = state.players[1]!; const p3 = state.players[2]!;
  p1.masterCardId = ROOT; p1.mana = 4; p1.vp = 0; p1.locationId = 'miyama_town';
  p2.masterCardId = 'master.fixture-opponent'; p2.mana = 4; p2.vp = 0; p2.locationId = 'miyama_town';
  p3.locationId = 'magic_workshop';
  state.round.activePhase = 'action'; state.round.prioritySeat = p1.seat;
  const ids = {
    s1: addPhysical(state, S1),
    s1a: addPhysical(state, S1A),
    s2: addPhysical(state, S2, 'outside_game'),
    s3: addPhysical(state, S3, 'outside_game'),
    asc: addPhysical(state, ASC, 'outside_game'),
  };
  processAbilityEvent(state, { id: 'caren-game-start', type: 'game_start', playerId: 'p1' });
  return { state, ids };
}

function installOpponentSource(state: GameState) {
  const template = structuredClone(state.abilityRuntime!.pack.cards[S2]!) as any;
  template.id = OPP_SKILL;
  template.name = OPP_SKILL;
  template.cardType = 'servant_skill';
  template.ownerId = 'servant.fixture-caren-source';
  template.abilities = [{
    id: OPP_GAIN,
    kind: 'phase_action',
    printedClause: OPP_GAIN,
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [], targets: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, limit: {}, visibility: {},
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
    execution: { mode: 'automatic', allowedOperations: [] },
    effects: [{ type: 'adjust_victory_points', amount: 3 }],
  }];
  state.abilityRuntime!.pack.cards[OPP_SKILL] = template;
  return addPhysical(state, OPP_SKILL, 'skill', 'p2');
}

describe('P3 Caren owner-complete migration', () => {
  it('materializes exactly the complete frozen five-identity owner scope', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('卡莲·奥尔黛西亚');
    expect(raw.publicInformation.initialMana).toBe(4);
    expect(raw.cards.map((entry: any) => entry.id).sort()).toEqual([...IDS].sort());
    expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  });

  it('preserves frozen names, text, and ascension static metadata', () => {
    expect(raw.cards.map((entry: any) => [entry.id, entry.name])).toEqual([
      [S1, '灵媒'], [S1A, '执行者'], [S2, '被虐灵媒体质'], [S3, '抹大拉的圣骸布'], [ASC, '瓦伦丁的圣骸布'],
    ]);
    expect(card(ASC).cardFace).toMatchObject({ cost: 1, basePower: 7, attributes: ['迅捷', '宝具'] });
    expect(card(ASC).playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
    expect(raw.cards.find((entry: any) => entry.id === S2).initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry: any) => entry.id === S3).initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry: any) => entry.id === ASC).initialPlacement).toBe('outside_game');
  });

  it('consumes only the accepted definition/resource/bound-opponent capability family', () => {
    expect(effectTypes(S1)).toEqual(['provision_definition_skill', 'remove_definition_skill_on_first_mana_crossing']);
    expect(effectTypes(S1A)).toEqual(['provision_definition_skill']);
    expect(effectTypes(S2)).toEqual(['reactive_opponent_vp_mana_conversion']);
    expect(effectTypes(S3)).toEqual(['bind_engaged_opponent_round_rule']);
    expect(effectTypes(ASC)).toEqual(['provision_definition_skill', 'grant_opponent_battle_winners_vp']);
    expect(card(S2).abilities[0]!.effects[0]).toEqual({
      type: 'reactive_opponent_vp_mana_conversion', requireSameLocation: true,
      qualifyingSourceCardTypes: ['servant_skill', 'command_spell', 'master_ascension'], vpRounding: 'floor_half_gain',
      controllerManaLossPerPreventedVp: 1, controllerVpPerActualManaLost: 1,
    });
  });

  it('integrates Caren exactly once after Bazett in the canonical playtest master sequence', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    expect(pack.authoringMasterFiles.slice(-2)).toEqual(['data/authoring/masters/master.bazett.json', PATH]);
  });

  it('provisions Spiritual Masochism and removes it on the first authoritative >1 to <=1 crossing', () => {
    const { state, ids } = setup();
    expect(state.cards.find((entry) => entry.instanceId === ids.s2)!.zone).toBe('skill');
    spendMana(state, 'p1', 1);
    expect(state.cards.find((entry) => entry.instanceId === ids.s2)!.zone).toBe('skill');
    spendMana(state, 'p1', 2);
    expect(state.players[0]!.mana).toBe(1);
    expect(state.cards.find((entry) => entry.instanceId === ids.s2)!.zone).toBe('removed_from_game');
  });

  it('provisions the Shroud on first reveal and drives its canonical round bind', () => {
    const { state, ids } = setup();
    processAbilityEvent(state, { id: 'caren-reveal', type: 'servant_package_revealed', playerId: 'p1' });
    expect(state.cards.find((entry) => entry.instanceId === ids.s3)!.zone).toBe('skill');
    const activation = dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: ids.s3, abilityId: 'caren.s3.bind-opponent' });
    expect(activation.ok).toBe(true);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toEqual(expect.arrayContaining(['p2::penalty:1', 'p2::penalty:5']));
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['p2::penalty:4'] }).ok).toBe(true);
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments).toContainEqual(expect.objectContaining({ playerId: 'p2', amount: -4 }));
    expect(movePlayer(state, { playerId: 'p2', to: 'shinto', movementKind: 'normal' })).toMatchObject({ moved: false, reason: 'movement_locked' });
    expect(movePlayer(state, { playerId: 'p2', to: 'shinto', movementKind: 'effect' })).toMatchObject({ moved: true });
    state.players[1]!.locationId = 'miyama_town';
    processAbilityEvent(state, {
      id: 'caren-bound-loss', type: 'after_battle_result_determined', playerId: 'p1', battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
    expect(state.cards.find((entry) => entry.instanceId === ids.s3)!.zone).toBe('removed_from_game');
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
  });

  it('applies the canonical same-location opponent VP conversion with actual mana loss', () => {
    const { state } = setup();
    const sourceCardId = installOpponentSource(state);
    state.players[1]!.vp = 3;
    processAbilityEvent(state, {
      id: 'caren-opponent-vp', type: 'victory_points_adjusted', playerId: 'p2', sourceCardId,
      abilityId: OPP_GAIN, resource: 'victory_points', delta: 3, before: 0, after: 3,
    });
    expect(state.players[1]!.vp).toBe(1);
    expect(state.players[0]!).toMatchObject({ mana: 2, vp: 2 });
  });

  it('unlocks the ascension Shroud provision and grants +3 VP to an opposing battle winner', () => {
    const { state, ids } = setup();
    state.cards.find((entry) => entry.instanceId === ids.asc)!.zone = 'skill';
    processAbilityEvent(state, { id: 'caren-asc-unlock', type: 'after_master_ascension_unlocked', playerId: 'p1', sourceCardId: ids.asc });
    expect(state.cards.find((entry) => entry.instanceId === ids.s3)!.zone).toBe('skill');
    processAbilityEvent(state, {
      id: 'caren-opponent-win', type: 'after_battle_result_determined', playerId: 'p1', battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p2'], loserIds: ['p1'] },
    });
    expect(state.players[1]!.vp).toBe(1);
    expect(state.players[0]!).toMatchObject({ mana: 2, vp: 2 });
  });

  it('adds no Caren identity or printed-text routing to production runtime', () => {
    const files = [
      'packages/rules/src/ability/definition-resource-binding-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/core/movement.ts',
      'packages/rules/src/core/rule-overrides.ts',
    ];
    const production = files.map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();
    for (const needle of ['master.caren', '卡莲', '被虐灵媒体质', '抹大拉的圣骸布', 'core.caren-']) expect(production).not.toContain(needle);
  });
});
