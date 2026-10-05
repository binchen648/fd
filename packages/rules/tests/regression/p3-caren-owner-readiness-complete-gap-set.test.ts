import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { loadAuthoringJson } from '../../src/ability/loader';
import {
  advanceAbilityPhase,
  dispatchAbilityCommand,
  initializeAbilityRuntime,
  isCanonicalGenericPendingDecisionForRestore,
  isDeferredAbilityRuntimeProvenanceValidForRestore,
  processAbilityEvent,
} from '../../src/ability/interpreter';
import { movePlayer } from '../../src/core/movement';
import { spendMana } from '../../src/core/rule-overrides';
import { resolveExtendedEffect } from '../../src/ability/extended-effects';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ROOT = 'master.fixture-definition-resource';
const S1 = `${ROOT}.skill.s1`;
const S1A = `${ROOT}.skill.s1a`;
const S2 = `${ROOT}.skill.s2`;
const S3 = `${ROOT}.skill.s3`;
const ASC = `${ROOT}.skill.ascension`;
const OPP_SKILL = 'servant.fixture-source.skill.s1';
const OPP_BASIC = 'basic.fixture-source';

const S1_PROVISION = 'fixture.definition-resource.game-start-provision';
const S1_REMOVE = 'fixture.definition-resource.first-mana-crossing';
const S1A_PROVISION = 'fixture.definition-resource.first-reveal-provision';
const S2_CONVERT = 'fixture.definition-resource.vp-convert';
const S3_BIND = 'fixture.definition-resource.bind';
const ASC_PROVISION = 'fixture.definition-resource.ascension-provision';
const ASC_REWARD = 'fixture.definition-resource.ascension-win-reward';
const OPP_GAIN = 'fixture.opponent.gain-vp';

function base(id: string, kind = 'passive') {
  return {
    id, kind, printedClause: id, activation: {}, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [],
    lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}
function forced(id: string, trigger: string, effect: any) {
  const ability = base(id, 'forced_trigger'); ability.activation = { trigger }; ability.effects = [effect]; return ability;
}
function action(id: string, effect: any) {
  const ability = base(id, 'phase_action'); ability.activation = { phase: 'action', opens: 'controller_action_window' }; ability.effects = [effect]; return ability;
}
function card(id: string, abilities: any[]) {
  return {
    id, name: id, cardType: 'master_skill', owner: { type: 'master', id: ROOT },
    cardFace: { attributes: [], cost: 0, basePower: 0 }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities, verification: { implementationStatus: 'complete' },
  };
}
function archive() {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: ROOT,
    cards: [
      card(S1, [
        forced(S1_PROVISION, 'game_start', { type: 'provision_definition_skill', definitionId: S2, destination: 'skill', createIfMissing: true }),
        forced(S1_REMOVE, 'mana_adjusted', { type: 'remove_definition_skill_on_first_mana_crossing', definitionId: S2, threshold: 1, firstCrossing: true, destination: 'removed_from_game' }),
      ]),
      card(S1A, [forced(S1A_PROVISION, 'servant_package_revealed', { type: 'provision_definition_skill', definitionId: S3, destination: 'skill', createIfMissing: true })]),
      card(S2, [forced(S2_CONVERT, 'victory_points_adjusted', {
        type: 'reactive_opponent_vp_mana_conversion', requireSameLocation: true,
        qualifyingSourceCardTypes: ['servant_skill', 'command_spell', 'master_ascension'], vpRounding: 'floor_half_gain',
        controllerManaLossPerPreventedVp: 1, controllerVpPerActualManaLost: 1,
      })]),
      card(S3, [action(S3_BIND, {
        type: 'bind_engaged_opponent_round_rule', minimumPowerPenalty: 1, maximumPowerPenalty: 5,
        blockOwnTurnMovement: true, removeSourceIfTargetLosesThisRound: true,
      })]),
      card(ASC, [
        forced(ASC_PROVISION, 'after_master_ascension_unlocked', { type: 'provision_definition_skill', definitionId: S3, destination: 'skill', createIfMissing: true }),
        forced(ASC_REWARD, 'after_battle_result_determined', { type: 'grant_opponent_battle_winners_vp', amount: 3 }),
      ]),
    ],
  } as any;
}
function add(state: GameState, definitionId: string, owner = 'p1', zone = 'skill') {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field','attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function installOpponentSource(state: GameState, definitionId: string, cardType: 'servant_skill' | 'basic_attack') {
  const template = structuredClone(state.abilityRuntime!.pack.cards[S2]!) as any;
  template.id = definitionId; template.name = definitionId; template.cardType = cardType; template.ownerId = 'servant.fixture-source';
  template.abilities = [action(OPP_GAIN, { type: 'adjust_victory_points', amount: 3 })];
  state.abilityRuntime!.pack.cards[definitionId] = template;
  return add(state, definitionId, 'p2', 'skill');
}
function setup() {
  const pack = loadAuthoringJson(archive());
  expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] }); state.cards = [];
  initializeAbilityRuntime(state, pack, { seed: 20261005 });
  const p1 = state.players[0]!; const p2 = state.players[1]!; const p3 = state.players[2]!;
  p1.masterCardId = ROOT; p1.mana = 4; p1.vp = 0; p1.locationId = 'miyama_town';
  p2.masterCardId = 'master.fixture-opponent'; p2.mana = 4; p2.vp = 0; p2.locationId = 'miyama_town';
  p3.locationId = 'magic_workshop';
  const s1 = add(state, S1); const s1a = add(state, S1A);
  processAbilityEvent(state, { id: 'fixture-game-start', type: 'game_start', playerId: 'p1' });
  return { state, pack, s1, s1a };
}
function provisionS3ByReveal(state: GameState) {
  processAbilityEvent(state, { id: `fixture-reveal-${state.abilityRuntime!.sequence}`, type: 'servant_package_revealed', playerId: 'p1' });
  return state.cards.find((entry) => entry.ownerPlayerId === 'p1' && entry.definitionId === S3 && entry.zone === 'skill')!;
}

describe('P3 Caren owner-readiness complete identity-free gap set', () => {
  it('accepts the complete exact capability shapes and fails closed on widened privileged shape', () => {
    const good = loadAuthoringJson(archive());
    expect(good.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const bad = archive();
    bad.cards.find((entry: any) => entry.id === S3).abilities[0].effects[0].maximumPowerPenalty = 6;
    const loaded = loadAuthoringJson(bad);
    expect(loaded.cards[S3]!.abilities.find((entry) => entry.id === S3_BIND)!.execution.mode).toBe('unsupported');
    expect(loaded.report.some((entry) => entry.reason.includes('Definition/resource/bound-opponent'))).toBe(true);
  });

  it('provisions the definition-bound skill at game start and removes it only on the first >1 to <=1 mana crossing', () => {
    const { state } = setup();
    const first = state.cards.filter((entry) => entry.ownerPlayerId === 'p1' && entry.definitionId === S2);
    expect(first).toHaveLength(1); expect(first[0]).toMatchObject({ zone: 'skill', controllerPlayerId: 'p1' });
    spendMana(state, 'p1', 1);
    expect(state.players[0]!.mana).toBe(3); expect(first[0]!.zone).toBe('skill');
    spendMana(state, 'p1', 2);
    expect(state.players[0]!.mana).toBe(1); expect(first[0]!.zone).toBe('removed_from_game');
    first[0]!.zone = 'skill'; state.players[0]!.mana = 3;
    spendMana(state, 'p1', 2);
    expect(first[0]!.zone).toBe('skill');
  });

  it('observes an authoritative specialized mana-loss transaction instead of requiring a particular event name', () => {
    const { state } = setup();
    const s2 = state.cards.find((entry) => entry.ownerPlayerId === 'p1' && entry.definitionId === S2)!;
    state.players[0]!.mana = 1;
    processAbilityEvent(state, {
      id: 'fixture-specialized-mana-loss',
      type: 'controller_mana_lost_for_round_power',
      playerId: 'p1',
      resource: 'mana',
      requestedDelta: -3,
      delta: -3,
      before: 4,
      after: 1,
    });
    expect(state.cards.find((entry) => entry.instanceId === s2.instanceId)!.zone).toBe('removed_from_game');
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'definition_skill_removed_on_first_mana_crossing', playerId: 'p1', before: 4, after: 1,
    }));
  });

  it('observes the legacy direct set-mana route through the shared authoritative mana-adjustment notifier', () => {
    const { state, s1 } = setup();
    const s2 = state.cards.find((entry) => entry.ownerPlayerId === 'p1' && entry.definitionId === S2)!;
    resolveExtendedEffect(state, 'p1', { type: 'set_mana', amount: 1 } as any, {
      sourceCardId: s1,
      abilityId: S1_REMOVE,
    });
    expect(state.players[0]!.mana).toBe(1);
    expect(s2.zone).toBe('removed_from_game');
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'mana_adjusted', playerId: 'p1', delta: -3, before: 4, after: 1 }),
      expect.objectContaining({ type: 'definition_skill_removed_on_first_mana_crossing', playerId: 'p1' }),
    ]));
  });

  it('provisions the bound skill on the servant reveal route without duplicating the physical card', () => {
    const { state } = setup();
    const first = provisionS3ByReveal(state);
    expect(first).toMatchObject({ definitionId: S3, zone: 'skill', ownerPlayerId: 'p1' });
    first.zone = 'removed_from_game';
    processAbilityEvent(state, { id: 'fixture-reveal-repeat', type: 'servant_package_revealed', playerId: 'p1' });
    expect(state.cards.filter((entry) => entry.ownerPlayerId === 'p1' && entry.definitionId === S3)).toHaveLength(1);
    expect(state.cards.find((entry) => entry.instanceId === first.instanceId)!.zone).toBe('removed_from_game');
  });

  it('halves a same-location opponent positive VP gain from an accepted source class, pays mana, and gains equal VP', () => {
    const { state } = setup(); const sourceCardId = installOpponentSource(state, OPP_SKILL, 'servant_skill');
    state.players[1]!.vp = 3;
    processAbilityEvent(state, { id: 'fixture-opponent-vp', type: 'victory_points_adjusted', playerId: 'p2', sourceCardId,
      abilityId: OPP_GAIN, resource: 'victory_points', delta: 3, before: 0, after: 3 });
    expect(state.players[1]!.vp).toBe(1);
    expect(state.players[0]!).toMatchObject({ mana: 2, vp: 2 });
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'mana_adjusted', playerId: 'p1', delta: -2 }),
      expect.objectContaining({ type: 'victory_points_adjusted', playerId: 'p1', delta: 2 }),
    ]));
  });

  it('fails closed for wrong location or non-qualifying source and caps the conversion by actual mana available', () => {
    const { state } = setup(); const sourceCardId = installOpponentSource(state, OPP_SKILL, 'servant_skill');
    state.players[1]!.locationId = 'shinto'; state.players[1]!.vp = 4;
    processAbilityEvent(state, { id: 'fixture-wrong-location', type: 'victory_points_adjusted', playerId: 'p2', sourceCardId,
      abilityId: OPP_GAIN, resource: 'victory_points', delta: 4, before: 0, after: 4 });
    expect(state.players[1]!.vp).toBe(4); expect(state.players[0]!).toMatchObject({ mana: 4, vp: 0 });

    state.players[1]!.locationId = 'miyama_town'; const basicId = installOpponentSource(state, OPP_BASIC, 'basic_attack'); state.players[1]!.vp = 4;
    processAbilityEvent(state, { id: 'fixture-basic-source', type: 'victory_points_adjusted', playerId: 'p2', sourceCardId: basicId,
      abilityId: OPP_GAIN, resource: 'victory_points', delta: 4, before: 0, after: 4 });
    expect(state.players[1]!.vp).toBe(4); expect(state.players[0]!).toMatchObject({ mana: 4, vp: 0 });

    state.players[0]!.mana = 1; state.players[1]!.vp = 4;
    processAbilityEvent(state, { id: 'fixture-low-mana', type: 'victory_points_adjusted', playerId: 'p2', sourceCardId,
      abilityId: OPP_GAIN, resource: 'victory_points', delta: 4, before: 0, after: 4 });
    expect(state.players[1]!.vp).toBe(2); expect(state.players[0]!).toMatchObject({ mana: 0, vp: 1 });
  });

  it('rejects malformed resource provenance and a face-down provider without changing the observed gain', () => {
    const { state } = setup(); const sourceCardId = installOpponentSource(state, OPP_SKILL, 'servant_skill');
    const provider = state.cards.find((entry) => entry.ownerPlayerId === 'p1' && entry.definitionId === S2)!;
    state.players[1]!.vp = 3;
    processAbilityEvent(state, { id: 'fixture-malformed-vp', type: 'victory_points_adjusted', playerId: 'p2', sourceCardId,
      abilityId: OPP_GAIN, resource: 'victory_points', delta: 3, before: 1, after: 3 });
    expect(state.players[1]!.vp).toBe(3); expect(state.players[0]!).toMatchObject({ mana: 4, vp: 0 });
    state.abilityRuntime!.cardState[provider.instanceId]!.faceDown = true;
    processAbilityEvent(state, { id: 'fixture-facedown-provider', type: 'victory_points_adjusted', playerId: 'p2', sourceCardId,
      abilityId: OPP_GAIN, resource: 'victory_points', delta: 3, before: 0, after: 3 });
    expect(state.players[1]!.vp).toBe(3); expect(state.players[0]!).toMatchObject({ mana: 4, vp: 0 });
  });

  it('binds one engaged opponent with a 1..5 choice, blocks only normal movement, and removes the source when that target loses', () => {
    const { state } = setup(); const source = provisionS3ByReveal(state);
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source.instanceId, abilityId: S3_BIND }).ok).toBe(true);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toEqual(expect.arrayContaining(['p2::penalty:1','p2::penalty:5']));
    expect(isCanonicalGenericPendingDecisionForRestore(state, decision)).toBe(true);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['p2::penalty:4'] }).ok).toBe(true);
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments).toContainEqual(expect.objectContaining({ playerId: 'p2', amount: -4, sourceCardId: source.instanceId, abilityId: S3_BIND }));
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    expect(movePlayer(state, { playerId: 'p2', to: 'shinto', movementKind: 'normal' })).toMatchObject({ moved: false, reason: 'movement_locked' });
    expect(movePlayer(state, { playerId: 'p2', to: 'shinto', movementKind: 'effect' })).toMatchObject({ moved: true });
    state.players[1]!.locationId = 'miyama_town';
    processAbilityEvent(state, { id: 'fixture-target-loss', type: 'after_battle_result_determined', playerId: 'p1', battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1','p2'], battleResult: { winners: ['p1'], loserIds: ['p2'] } });
    expect(state.cards.find((entry) => entry.instanceId === source.instanceId)!.zone).toBe('removed_from_game');
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments?.some((entry) => entry.sourceCardId === source.instanceId && entry.amount === -4)).toBe(true);
    expect(movePlayer(state, { playerId: 'p2', to: 'shinto', movementKind: 'normal' })).toMatchObject({ moved: false, reason: 'movement_locked' });
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
  });

  it('expires bound-opponent authority on the next round and rejects forged restore provenance', () => {
    const { state } = setup(); const source = provisionS3ByReveal(state);
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source.instanceId, abilityId: S3_BIND }).ok).toBe(true);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['p2::penalty:2'] }).ok).toBe(true);
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    const bag = state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p2!;
    const bindingKey = Object.keys(bag).find((key) => key.includes('definition_resource_binding:bound:'))!;
    const clean = bag[bindingKey]; bag[bindingKey] = '{"controllerId":"p1","round":1,"penalty":5}';
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(false); bag[bindingKey] = clean!;
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    advanceAbilityPhase(state, 'preparation', 2, 1);
    expect(Object.keys(state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p2!).some((key) => key.includes('definition_resource_binding:bound:'))).toBe(false);
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments?.some((entry) => entry.sourceCardId === source.instanceId)).toBe(false);
  });

  it('provisions from ascension unlock and grants opponent battle winners +3 VP, then composes with the VP conversion', () => {
    const { state } = setup(); const asc = add(state, ASC);
    processAbilityEvent(state, { id: 'fixture-ascension-unlocked', type: 'after_master_ascension_unlocked', playerId: 'p1', sourceCardId: asc });
    expect(state.cards.filter((entry) => entry.ownerPlayerId === 'p1' && entry.definitionId === S3 && entry.zone === 'skill')).toHaveLength(1);
    processAbilityEvent(state, { id: 'fixture-opponent-wins', type: 'after_battle_result_determined', playerId: 'p1', battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1','p2'], battleResult: { winners: ['p2'], loserIds: ['p1'] } });
    expect(state.players[1]!.vp).toBe(1);
    expect(state.players[0]!).toMatchObject({ mana: 2, vp: 2 });
  });

  it('keeps production capability routing identity- and text-free', () => {
    const paths = [
      'packages/rules/src/ability/definition-resource-binding-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/core/movement.ts',
      'packages/rules/src/core/rule-overrides.ts',
    ];
    for (const path of paths) {
      const text = readFileSync(path, 'utf8').toLowerCase();
      expect(text).not.toContain('master.caren');
      expect(text).not.toContain('卡莲');
      expect(text).not.toContain('被虐灵媒体质');
      expect(text).not.toContain('抹大拉的圣骸布');
    }
  });
});
