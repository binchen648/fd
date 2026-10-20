import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { terrainAdvantageAtLocation } from '../../src/ability/terrain-advantage-override';

const ROOT = 'master.shishigou';
const ASC = `${ROOT}.skill.ascension`;
const S1 = `${ROOT}.skill.s1`;
const S2 = `${ROOT}.skill.s2`;
const S3 = `${ROOT}.skill.s3`;
const PATH = 'data/authoring/masters/master.shishigou.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

function add(state: GameState, definitionId: string, zone: string, options: { active?: boolean; faceDown?: boolean; attributes?: string[] } = {}): string {
  const instanceId = `shishigou:${definitionId.split('.').at(-1)}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
    visibility: options.faceDown ? { scope: 'owner_only', ownerPlayerId: 'p1' } : { scope: zone === 'skill' ? 'owner_only' : 'public', ...(zone === 'skill' ? { ownerPlayerId: 'p1' } : {}) },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = { active: options.active ?? false, faceDown: options.faceDown ?? false, playedRound: state.round.roundNumber };
  if (options.attributes) (state.abilityRuntime!.pack.cards[definitionId]!.cardFace as any).attributes = options.attributes;
  return instanceId;
}

function fixture(state: GameState, id: string, cardType: string, attributes: string[], cost = 0): void {
  state.abilityRuntime!.pack.cards[id] = {
    id, name: id, cardType, ownerId: 'fixture',
    cardFace: { typeLabel: 'fixture', attributes, cost, basePower: 2 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
    mode: 'automatic', playKind: 'attack', destinationZone: 'attack_area',
  } as any;
}

function setup(): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.masterCardId = ROOT;
  state.players[0]!.locationId = 'shinto';
  state.players[0]!.mana = 10;
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261020 });
  (state as any).modeState = { terrainAssignments: { shinto: ['p1'] } };
  return state;
}

describe('P3 Shishigou owner-complete migration', () => {
  it('preserves frozen text/SHA evidence and generated source-map/evidence closure', () => {
    expect(archive.id).toBe(ROOT);
    expect(archive.cards.map((entry: any) => entry.id)).toEqual([ASC, S1, S2, S3]);
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const generated = JSON.parse(readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8')) as any;
    const evidence = JSON.parse(readFileSync('data/generated/fd-playtest-v1.evidence-report.json', 'utf8')) as any;
    for (const id of [ASC, S1, S2, S3]) {
      expect(generated.rules.sourceMap[id]).toMatchObject({ archiveId: ROOT });
      expect(evidence.entities.find((entry: any) => entry.entityId === id)).toBeDefined();
      expect(generated.cards.find((entry: any) => entry.id === id)?.capability).toMatchObject({ status: 'FULL' });
      expect(evidence.entities.find((entry: any) => entry.entityId === id)?.capabilityStatus).toBe('FULL');
    }
    expect(archive.cards[0].printedText).toBe('你所有的的基础牌得到效果："行动阶段：花费3点魔力，根据此牌属性激活【死灵魔术】。"');
    expect(archive.sourcePolicy.clauseEvidence.map((entry: any) => entry.sha256)).toEqual([
      '6818b3442e213f8c3f176b30427356c5531b3fc4358e2ae8635090ee2daaf521',
      '06b0b58708bc72a81654b9c13883d8c5273eddc797a8b56b23abce3d9c9145da',
      '99abce3e80d6143243bd0a3cb0a8959a4713fb5fea497803e6b8d7f275b4708b',
      '9d04c25feb7414294fc5ba4c3c6689d934d23584489433141ec846d4a0b64d61',
      '03ef82051f65cbc107031214a6d63342afad130ddfd918e6cb4042eeb18e5270',
      'ba0c8d77b066e624a6ec14e7eb153cae7b65a0b66cbbeec7b6e4ec1ffe520e91',
      'cbbc847b821813b4b02afcda8c3893f75a29d378a105fa8303b8e7a6cb3c0f95',
    ]);
  });

  it('grants the basic-card action, pays three mana, and routes by attribute to Strength Necromancy', () => {
    const state = setup();
    fixture(state, 'fixture.basic-power', 'basic_attack', ['力量']);
    const ascension = add(state, ASC, 'field', { active: true });
    const basic = add(state, 'fixture.basic-power', 'field', { active: true });
    const strength = add(state, S2, 'skill');
    expect(ascension).toBeTruthy();
    const activation = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: basic, abilityId: rules.SHISHIGOU_GENERATED_BASIC_ABILITY_ID });
    expect(activation.ok, JSON.stringify(activation)).toBe(true);
    expect(state.players[0]!.mana).toBe(7);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.candidates.length).toBeGreaterThan(0);
    const destination = pending.candidates.find((id) => id !== 'shinto') ?? pending.candidates[0]!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [destination] }).ok).toBe(true);
    expect(state.players[0]!.locationId).toBe(destination);
    expect(state.abilityRuntime!.usedAbilities[`${strength}:shishigou.necromancy.strength`]).toBe(state.round.roundNumber);
  });

  it('cold-stores face-down attacks and reveals each stored corpse at most once', () => {
    const state = setup();
    fixture(state, 'fixture.hidden-attack', 'basic_attack', ['力量']);
    const source = add(state, S1, 'skill');
    const attack = add(state, 'fixture.hidden-attack', 'attack_area', { faceDown: true });
    state.round.activePhase = 'battle';
    state.players[0]!.locationId = 'magic_workshop';
    const remove = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'shishigou.necromancy.corpse-remove' });
    expect(remove.ok, JSON.stringify(remove)).toBe(true);
    const removeDecision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: removeDecision.id, selectedIds: [attack] }).ok).toBe(true);
    expect(state.cards.find((entry) => entry.instanceId === attack)?.zone).toBe('removed_from_game');
    expect(state.abilityRuntime!.cardState[attack]!.faceDown).toBe(true);
    expect(state.cards.find((entry) => entry.instanceId === attack)?.visibility.scope).toBe('owner_only');
    state.round.activePhase = 'action';
    const reveal = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'shishigou.necromancy.corpse-reveal' });
    expect(reveal.ok, JSON.stringify(reveal)).toBe(true);
    const revealDecision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: revealDecision.id, selectedIds: [attack] }).ok).toBe(true);
    expect(state.abilityRuntime!.cardState[attack]!.faceDown).toBe(false);
    expect(state.cards.find((entry) => entry.instanceId === attack)?.visibility.scope).toBe('public');
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'shishigou.necromancy.corpse-reveal' }).ok).toBe(false);
  });

  it('executes Agility top-deck play and S3 Magic/Special handlers through shared runtime paths', () => {
    const state = setup();
    fixture(state, 'fixture.top-attack', 'basic_attack', ['迅捷'], 1);
    fixture(state, 'fixture.special-attack', 'basic_attack', ['力量'], 0);
    fixture(state, 'fixture.basic-speed', 'basic_attack', ['迅捷']);
    fixture(state, 'fixture.basic-strength', 'basic_attack', ['力量']);
    fixture(state, 'fixture.basic-magic', 'basic_attack', ['魔术']);
    fixture(state, 'fixture.basic-special', 'basic_attack', ['特殊']);
    add(state, ASC, 'field', { active: true });
    add(state, S2, 'skill');
    add(state, S3, 'skill');
    state.players[0]!.mana = 30;
    const top = add(state, 'fixture.top-attack', 'deck');
    const agilitySource = add(state, 'fixture.basic-speed', 'field', { active: true });
    const agility = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: agilitySource, abilityId: rules.SHISHIGOU_GENERATED_BASIC_ABILITY_ID });
    expect(agility.ok, JSON.stringify(agility)).toBe(true);
    expect(state.cards.find((entry) => entry.instanceId === top)?.zone).toBe('attack_area');
    expect(state.players[0]!.mana).toBe(26);
    const strengthSource = add(state, 'fixture.basic-strength', 'field', { active: true });
    const strength = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: strengthSource, abilityId: rules.SHISHIGOU_GENERATED_BASIC_ABILITY_ID });
    expect(strength.ok, JSON.stringify(strength)).toBe(true);
    const strengthDecision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: strengthDecision.id, selectedIds: ['miyama_town'] }).ok).toBe(true);
    expect(terrainAdvantageAtLocation(state, 'p1', 'miyama_town')).toBe(2);
    const magicSource = add(state, 'fixture.basic-magic', 'field', { active: true });
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: magicSource, abilityId: rules.SHISHIGOU_GENERATED_BASIC_ABILITY_ID }).ok).toBe(true);
    expect(terrainAdvantageAtLocation(state, 'p1', 'miyama_town')).toBe(4);
    const special = add(state, 'fixture.special-attack', 'attack_area', { active: true });
    const specialSource = add(state, 'fixture.basic-special', 'field', { active: true });
    const specialActivation = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: specialSource, abilityId: rules.SHISHIGOU_GENERATED_BASIC_ABILITY_ID });
    expect(specialActivation.ok, JSON.stringify(specialActivation)).toBe(true);
    const specialDecision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: specialDecision.id, selectedIds: [special] }).ok).toBe(true);
    expect(state.abilityRuntime!.cardState[special]!.basePowerMultiplier).toBe(2);
  });

  it('composes reverse-order and repeated same-round Strength/Magic terrain adjustments', () => {
    const reverse = setup();
    (reverse as any).modeState.terrainAssignments = { shinto: ['p1'] };
    const base = terrainAdvantageAtLocation(reverse, 'p1', 'shinto');
    expect(base).toBeGreaterThan(0);
    rules.resolveShishigouMagic(reverse, 'p1', 'shinto', 'magic-first');
    rules.resolveShishigouStrength(reverse, 'p1', 'shinto', () => undefined, 'strength-second');
    expect(terrainAdvantageAtLocation(reverse, 'p1', 'shinto')).toBe((base + 2) * 2);

    const repeated = setup();
    (repeated as any).modeState.terrainAssignments = {};
    rules.resolveShishigouStrength(repeated, 'p1', 'miyama_town', () => undefined, 'strength-one');
    rules.resolveShishigouStrength(repeated, 'p1', 'miyama_town', () => undefined, 'strength-two');
    expect(terrainAdvantageAtLocation(repeated, 'p1', 'miyama_town')).toBe(4);
    rules.resolveShishigouMagic(repeated, 'p1', 'miyama_town', 'magic-after-strength');
    expect(terrainAdvantageAtLocation(repeated, 'p1', 'miyama_town')).toBe(8);
  });

  it('rejects foreign owner archives and keeps corpse tracking isolated per runtime session', () => {
    const foreign = structuredClone(archive);
    foreign.id = 'master.foreign';
    const foreignReport = rules.loadAuthoringJson(foreign).report;
    expect(foreignReport).toContainEqual(expect.objectContaining({ path: 'shishigou.owner', status: 'unsupported' }));
    const first = setup();
    const second = setup();
    rules.markShishigouCorpseRemoval(first, 'first-session-card');
    expect(first.abilityRuntime!.shishigouCorpseRemovedCardIds).toEqual(['first-session-card']);
    expect(second.abilityRuntime!.shishigouCorpseRemovedCardIds).toEqual([]);
  });
});
