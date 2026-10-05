import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.caules-yggdmillennia';
const ASC = `${ROOT}.skill.ascension`;
const S1 = `${ROOT}.skill.s1`;
const S1A = `${ROOT}.skill.s1a`;
const S2 = `${ROOT}.skill.s2`;
const S3 = `${ROOT}.skill.s3`;
const IDS = [ASC, S1, S1A, S2, S3];
const PATH = 'data/authoring/masters/master.caules-yggdmillennia.json';
const BASIC = 'fixture.caules-formal.basic';
const OPP_STR = 'fixture.caules-formal.opponent-strength';
const OPP_MAG = 'fixture.caules-formal.opponent-magic';
const OPP_NONBASIC = 'fixture.caules-formal.opponent-nonbasic';
const DECK = [
  'card.cardb3','card.cardb3','card.cardb4','card.cardb4','card.cardb4','card.carda3','card.carda3',
  'card.carda4','card.carda4','card.carda4','card.cardluck','card.cardsurveil',
];

const raw = JSON.parse(readFileSync(PATH, 'utf8'));
const loaded = rules.loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;
const effectTypes = (id: string) => card(id).abilities.flatMap((ability) => ability.effects.map((effect) => effect.type));

function installDefinition(state: GameState, id: string, cardType: string, attributes: string[], basePower = 3) {
  const template = structuredClone(state.abilityRuntime!.pack.cards[S3]!) as any;
  template.id = id;
  template.name = id;
  template.cardType = cardType;
  template.cardFace = { cost: 0, basePower, attributes };
  template.playRequirements = [];
  template.abilities = [];
  template.playKind = 'attack';
  template.destinationZone = 'attack_area';
  state.abilityRuntime!.pack.cards[id] = template;
}

function add(state: GameState, definitionId: string, owner = 'p1', zone = 'skill', active = false) {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: owner,
    controllerPlayerId: owner,
    zone,
    visibility: ['field','attack_area','removed_from_game'].includes(zone)
      ? { scope: 'public' }
      : { scope: 'owner_only', ownerPlayerId: owner },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

function setup() {
  const state = createSeededGameState({ activeSeats: [1,2,3] });
  state.cards = [];
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261005 });
  const [p1,p2,p3] = state.players;
  p1!.masterCardId = ROOT; p1!.mana = 6; p1!.locationId = 'miyama_town';
  p2!.mana = 6; p2!.locationId = 'miyama_town';
  p3!.mana = 6; p3!.locationId = 'shinto';
  installDefinition(state, BASIC, 'basic_attack', ['迅捷'], 2);
  installDefinition(state, OPP_STR, 'basic_attack', ['力量'], 5);
  installDefinition(state, OPP_MAG, 'basic_attack', ['魔术'], 4);
  installDefinition(state, OPP_NONBASIC, 'servant_skill', ['力量'], 6);
  for (const id of new Set(DECK)) installDefinition(state, id, 'basic_attack', ['迅捷'], 1);
  const ids = {
    s1: add(state, S1),
    s1a: add(state, S1A),
    s2: add(state, S2, 'p1', 'outside_game'),
    s3: add(state, S3, 'p1', 'outside_game'),
    asc: add(state, ASC, 'p1', 'outside_game'),
  };
  rules.processAbilityEvent(state, { id: 'caules-formal-game-start', type: 'game_start', playerId: 'p1' });
  return { state, ids };
}

function deployEvent(state: GameState, type: 'after_player_deployed_to_location' | 'after_player_deployed_to_battlefield', locationId: string) {
  rules.processAbilityEvent(state, { id: `caules-formal-${type}-${state.abilityRuntime!.sequence}`, type, playerId: 'p1', locationId });
}

describe('P3 Caules Yggdmillennia owner-complete migration', () => {
  it('materializes exactly the complete frozen five-identity owner scope', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('考列斯·千界树');
    expect(raw.publicInformation.initialMana).toBe(4);
    expect(raw.cards.map((entry: any) => entry.id).sort()).toEqual([...IDS].sort());
    expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  });

  it('preserves frozen names, text, placements, and Thunder static metadata', () => {
    expect(raw.cards.map((entry: any) => [entry.id, entry.name])).toEqual([
      [S1, '电气魔术'], [S1A, '电流术理'], [S2, '巴格达电池'], [S3, '绞首刑之雷'], [ASC, '最后的叙述者'],
    ]);
    expect(card(S3).cardFace).toMatchObject({ typeLabel: '魔术', attributes: ['魔术'], cost: 5, basePower: 6 });
    expect(card(S3).playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 5 }]);
    expect(raw.cards.find((entry: any) => entry.id === S2).initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry: any) => entry.id === S3).initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry: any) => entry.id === ASC).initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry: any) => entry.id === ASC).printedText).toContain('力量4x2 力量5x3 魔术4x2 魔术5x3 幸运x1 侦查x1');
  });

  it('consumes exactly the accepted identity-free declaration/deck capability family', () => {
    expect(effectTypes(S1)).toEqual(['provision_definition_skill', 'provision_definition_skill']);
    expect(effectTypes(S1A)).toEqual(['set_owned_definition_skill_active', 'set_owned_definition_skill_active']);
    expect(effectTypes(S2)).toEqual(['deployment_battery_choice', 'set_owned_definition_skill_active']);
    expect(effectTypes(S3)).toEqual([
      'append_only_rule', 'declared_attribute_required_additional_play_rule', 'zero_matching_same_battlefield_opponent_basic_attacks',
    ]);
    expect(effectTypes(ASC)).toEqual([
      'rewrite_definition_declaration_secret_until_combat', 'schedule_exact_deck_rebuild_after_unlock_round', 'reveal_secret_definition_declarations',
    ]);
  });

  it('integrates Caules Yggdmillennia exactly once after Caren in the canonical playtest master sequence', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    const index = pack.authoringMasterFiles.indexOf(PATH);
    expect(pack.authoringMasterFiles[index - 1]).toBe('data/authoring/masters/master.caren.json');
  });

  it('provisions Battery and Thunder at game start, resets Thunder at round end, and activates it on battlefield deployment', () => {
    const { state, ids } = setup();
    expect(state.cards.find((entry) => entry.instanceId === ids.s2)?.zone).toBe('skill');
    expect(state.cards.find((entry) => entry.instanceId === ids.s3)?.zone).toBe('skill');
    expect(state.abilityRuntime!.cardState[ids.s3]!.active).toBe(false);
    state.players[0]!.locationId = 'miyama_town';
    deployEvent(state, 'after_player_deployed_to_battlefield', 'miyama_town');
    expect(state.abilityRuntime!.cardState[ids.s3]!.active).toBe(true);
    rules.processAbilityEvent(state, { id: 'caules-formal-round-end', type: 'round_end', playerId: 'p1' });
    expect(state.abilityRuntime!.cardState[ids.s3]!.active).toBe(false);
  });

  it('offers the canonical Workshop battery choice with +1 mana or paid current-round defeat ignore', () => {
    const { state } = setup();
    state.round.activePhase = 'advance'; state.players[0]!.locationId = 'magic_workshop'; state.players[0]!.mana = 5;
    deployEvent(state, 'after_player_deployed_to_location', 'magic_workshop');
    let decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toEqual(['gain_mana','ignore_defeat']);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['gain_mana'] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(6);
    state.players[0]!.mana = 2;
    deployEvent(state, 'after_player_deployed_to_location', 'magic_workshop');
    decision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['ignore_defeat'] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(0);
    expect(state.abilityRuntime!.battleLossIgnoreRoundByPlayer!.p1).toBe(1);
  });

  it('enforces active append-only declaration play and game-long pre-ascension declaration uniqueness', () => {
    const { state, ids } = setup();
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
    const basic = add(state, BASIC, 'p1', 'hand');
    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: basic }, { cardInstanceId: ids.s3, declaredAttribute: '力量' }])).toThrow();
    state.abilityRuntime!.cardState[ids.s3]!.active = true;
    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: basic }, { cardInstanceId: ids.s3, declaredAttribute: '力量' }])).not.toThrow();
    expect(state.abilityRuntime!.declaredAttributesByPlayerDefinition!.p1![S3]).toEqual(['力量']);
    const s3 = state.cards.find((entry) => entry.instanceId === ids.s3)!;
    s3.zone = 'skill'; s3.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
    state.players[0]!.mana = 6;
    state.abilityRuntime!.cardState[ids.s3] = { active: true, faceDown: false, playedRound: 0 };
    const basic2 = add(state, BASIC, 'p1', 'hand');
    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: basic2 }, { cardInstanceId: ids.s3, declaredAttribute: '力量' }])).toThrow();
  });

  it('zeros only matching same-battlefield opponent basic attacks from the revealed declaration', () => {
    const { state, ids } = setup();
    const s3 = state.cards.find((entry) => entry.instanceId === ids.s3)!;
    s3.zone = 'attack_area'; s3.visibility = { scope: 'public' };
    state.abilityRuntime!.cardState[ids.s3] = { active: true, faceDown: false, playedRound: 1, declaredAttribute: '力量', declaredAttributeRevealed: true };
    const matching = add(state, OPP_STR, 'p2', 'attack_area', true);
    const magic = add(state, OPP_MAG, 'p2', 'attack_area', true);
    const nonbasic = add(state, OPP_NONBASIC, 'p2', 'attack_area', true);
    const remote = add(state, OPP_STR, 'p3', 'attack_area', true);
    state.round.activePhase = 'battle'; state.round.prioritySeat = state.players[0]!.seat;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: ids.s3, abilityId: 'caules-yggdmillennia.s3.electromancy' }).ok).toBe(true);
    expect(rules.calculateCardPower(state, matching).value).toBe(0);
    expect(rules.calculateCardPower(state, magic).value).toBe(4);
    expect(rules.calculateCardPower(state, nonbasic).value).toBe(6);
    expect(rules.calculateCardPower(state, remote).value).toBe(5);
  });

  it('keeps ascension declarations owner-private through staged projection, reveals at combat, and schedules the exact deck rebuild', () => {
    const { state, ids } = setup();
    const asc = state.cards.find((entry) => entry.instanceId === ids.asc)!; asc.zone = 'skill';
    const publicAttack = add(state, BASIC, 'p1', 'attack_area', true);
    state.abilityRuntime!.cardState[ids.s3]!.active = true;
    state.abilityRuntime!.declaredAttributesByPlayerDefinition = { p1: { [S3]: ['力量'] } };
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
    const basic = add(state, BASIC, 'p1', 'hand');
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: basic }).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: ids.s3, declaredAttribute: '力量' }).ok).toBe(true);
    const ownerStaged = rules.projectAbilityState(state, 'p1').stagedAttacks?.find((entry) => entry.playerId === 'p1')?.cards.find((entry) => entry.cardInstanceId === ids.s3);
    const opponentStaged = rules.projectAbilityState(state, 'p2').stagedAttacks?.find((entry) => entry.playerId === 'p1')?.cards.find((entry) => entry.cardInstanceId === ids.s3);
    expect(ownerStaged).toMatchObject({ declaredAttribute: '力量' });
    expect(opponentStaged).not.toHaveProperty('declaredAttribute');
    expect(publicAttack).toBeTruthy();

    state.abilityRuntime!.stagedAttacks = {};
    const basicPlay = add(state, BASIC, 'p1', 'hand');
    state.players[0]!.mana = 6;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: basicPlay }, { cardInstanceId: ids.s3, declaredAttribute: '力量' }]);
    expect(state.abilityRuntime!.cardState[ids.s3]!.declaredAttributeRevealed).toBe(false);
    expect(rules.projectAbilityState(state, 'p2').cards.find((entry) => entry.instanceId === ids.s3)?.declaredAttribute).toBeUndefined();
    state.round.activePhase = 'battle';
    rules.processAbilityEvent(state, { id: 'caules-formal-combat-window', type: 'controller_combat_action_window', playerId: 'p1' });
    expect(rules.projectAbilityState(state, 'p2').cards.find((entry) => entry.instanceId === ids.s3)?.declaredAttribute).toBe('力量');

    rules.processAbilityEvent(state, { id: 'caules-formal-asc-unlock', type: 'after_master_ascension_unlocked', playerId: 'p1', sourceCardId: ids.asc });
    expect(state.abilityRuntime!.pendingExactDeckRebuilds).toHaveLength(1);
    expect(state.abilityRuntime!.pendingExactDeckRebuilds![0]!.definitionIds).toEqual(DECK);
  });

  it('adds no Caules identity or printed-text routing to production runtime', () => {
    const files = [
      'packages/rules/src/ability/definition-declaration-deck-capability.ts',
      'packages/rules/src/ability/deterministic-deck-order.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/match-session.ts',
    ];
    const production = files.map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();
    for (const needle of ['master.caules-yggdmillennia', '考列斯·千界树', '绞首刑之雷', '巴格达电池', 'core.caules-yggdmillennia']) {
      expect(production).not.toContain(needle);
    }
  });
});
