import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility, AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.fixture-definition-declaration';
const S1 = `${ROOT}.skill.s1`;
const S1A = `${ROOT}.skill.s1a`;
const S2 = `${ROOT}.skill.s2`;
const S3 = `${ROOT}.skill.s3`;
const ASC = `${ROOT}.skill.ascension`;
const BASIC = 'fixture.caules.basic';
const OPP_STR = 'fixture.caules.opponent-strength';
const OPP_MAG = 'fixture.caules.opponent-magic';
const OPP_NONBASIC = 'fixture.caules.opponent-nonbasic';
const DECK = [
  'card.cardb3','card.cardb3','card.cardb4','card.cardb4','card.cardb4','card.carda3','card.carda3',
  'card.carda4','card.carda4','card.carda4','card.cardluck','card.cardsurveil',
];

function base(id: string, kind = 'passive'): AuthoringAbility {
  return {
    id, kind, printedClause: id, activation: {}, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [],
    lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}
function forced(id: string, trigger: string, effect: any, targets: any[] = []): AuthoringAbility {
  const ability = base(id, 'forced_trigger'); ability.activation = { trigger }; ability.effects = [effect]; ability.targets = targets; return ability;
}
function passive(id: string, effect: any): AuthoringAbility {
  const ability = base(id); ability.activation = { trigger: 'while_active' }; ability.effects = [effect]; return ability;
}
function combatAction(id: string, effect: any): AuthoringAbility {
  const ability = base(id, 'phase_action');
  ability.activation = { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' };
  ability.effects = [effect]; return ability;
}
function card(id: string, abilities: AuthoringAbility[], cardFace: any = { attributes: [], cost: 0, basePower: 0 }): any {
  return {
    id, name: id, cardType: 'master_skill', owner: { type: 'master', id: ROOT }, cardFace,
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities,
    verification: { implementationStatus: 'complete' },
  };
}
function choiceTarget() {
  return { id: 'deployment_battery_mode', type: 'choice', options: [
    { id: 'gain_mana', label: 'gain' }, { id: 'ignore_defeat', label: 'ignore' },
  ], count: { min: 1, max: 1 } };
}
function archive() {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: ROOT,
    cards: [
      card(S1, [
        forced('fixture.caules.provision-s2', 'game_start', { type: 'provision_definition_skill', definitionId: S2, destination: 'skill', createIfMissing: true }),
        forced('fixture.caules.provision-s3', 'game_start', { type: 'provision_definition_skill', definitionId: S3, destination: 'skill', createIfMissing: true }),
      ]),
      card(S1A, [
        forced('fixture.caules.deactivate-start', 'game_start', { type: 'set_owned_definition_skill_active', definitionId: S3, active: false }),
        forced('fixture.caules.deactivate-round', 'round_end', { type: 'set_owned_definition_skill_active', definitionId: S3, active: false }),
      ]),
      card(S2, [
        forced('fixture.caules.battery', 'after_player_deployed_to_location', {
          type: 'deployment_battery_choice', workshopLocationId: 'magic_workshop', battlefieldDefinitionId: S3, manaGain: 1, ignoreDefeatManaCost: 2,
        }, [choiceTarget()]),
        forced('fixture.caules.activate-s3', 'after_player_deployed_to_battlefield', { type: 'set_owned_definition_skill_active', definitionId: S3, active: true }),
      ]),
      card(S3, [
        passive('fixture.caules.append', { type: 'append_only_rule' }),
        passive('fixture.caules.declare', {
          type: 'declared_attribute_required_additional_play_rule', allowedAttributes: ['力量','迅捷','魔术','特殊','宝具'], uniquePerGame: true, requiresActiveSkillSource: true,
        }),
        combatAction('fixture.caules.zero', { type: 'zero_matching_same_battlefield_opponent_basic_attacks', value: 0, sameBattlefield: true, basicOnly: true }),
      ], { attributes: ['特殊'], cost: 0, basePower: 0 }),
      card(ASC, [
        passive('fixture.caules.rewrite', { type: 'rewrite_definition_declaration_secret_until_combat', definitionId: S3, allowRepeat: true, visibility: 'secret_until_combat_start' }),
        forced('fixture.caules.deck', 'after_master_ascension_unlocked', { type: 'schedule_exact_deck_rebuild_after_unlock_round', definitionIds: DECK, targetRoundOffset: 1 }),
        forced('fixture.caules.reveal', 'controller_combat_action_window', { type: 'reveal_secret_definition_declarations', definitionId: S3 }),
      ]),
    ],
  } as any;
}
function installDefinition(state: GameState, id: string, cardType: string, attributes: string[], basePower = 3) {
  const template = structuredClone(state.abilityRuntime!.pack.cards[S3]!) as any;
  template.id = id; template.name = id; template.cardType = cardType; template.cardFace = { cost: 0, basePower, attributes };
  template.abilities = []; template.playKind = 'attack'; template.destinationZone = 'attack_area';
  state.abilityRuntime!.pack.cards[id] = template;
}
function add(state: GameState, definitionId: string, owner = 'p1', zone: string = 'skill', active = false) {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field','attack_area','removed_from_game'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1,2,3] }); state.cards = [];
  rules.initializeAbilityRuntime(state, pack, { seed: 20261005 });
  const [p1,p2,p3] = state.players; p1!.masterCardId = ROOT; p1!.mana = 6; p1!.locationId = 'miyama_town';
  p2!.locationId = 'miyama_town'; p2!.mana = 6; p3!.locationId = 'shinto';
  installDefinition(state, BASIC, 'basic_attack', ['迅捷'], 2);
  installDefinition(state, OPP_STR, 'basic_attack', ['力量'], 5);
  installDefinition(state, OPP_MAG, 'basic_attack', ['魔术'], 4);
  installDefinition(state, OPP_NONBASIC, 'servant_skill', ['力量'], 6);
  for (const id of new Set(DECK)) installDefinition(state, id, 'basic_attack', ['迅捷'], 1);
  const s1 = add(state, S1); const s1a = add(state, S1A);
  rules.processAbilityEvent(state, { id: 'fixture-caules-game-start', type: 'game_start', playerId: 'p1' });
  const s2 = state.cards.find((entry) => entry.definitionId === S2 && entry.ownerPlayerId === 'p1')!;
  const s3 = state.cards.find((entry) => entry.definitionId === S3 && entry.ownerPlayerId === 'p1')!;
  return { state, s1, s1a, s2, s3 };
}
function deployEvent(state: GameState, type: 'after_player_deployed_to_location' | 'after_player_deployed_to_battlefield', locationId: string) {
  rules.processAbilityEvent(state, { id: `deploy-${type}-${state.abilityRuntime!.sequence}`, type, playerId: 'p1', locationId });
}

describe('P3 Caules Yggdmillennia owner-readiness complete identity-free gap set', () => {
  it('accepts exact shapes and fails closed on widened privileged mechanics', () => {
    expect(rules.loadAuthoringJson(archive()).report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const bad = archive(); bad.cards.find((entry: any) => entry.id === S2).abilities[0].effects[0].manaGain = 2;
    const loaded = rules.loadAuthoringJson(bad);
    expect(loaded.cards[S2]!.abilities.find((ability) => ability.id === 'fixture.caules.battery')!.execution.mode).toBe('unsupported');
    expect(loaded.report.some((entry) => entry.reason.includes('Definition declaration/deck'))).toBe(true);
  });

  it('provisions both definition-bound skills inactive and resets the lightning skill at round end', () => {
    const { state, s2, s3 } = setup();
    expect(s2.zone).toBe('skill'); expect(s3.zone).toBe('skill');
    expect(state.abilityRuntime!.cardState[s3.instanceId]!.active).toBe(false);
    state.abilityRuntime!.cardState[s3.instanceId]!.active = true;
    rules.processAbilityEvent(state, { id: 'fixture-round-end', type: 'round_end', playerId: 'p1' });
    expect(state.abilityRuntime!.cardState[s3.instanceId]!.active).toBe(false);
  });

  it('offers the workshop battery choice, grants mana, and omits the paid branch when mana is insufficient', () => {
    const { state } = setup(); state.round.activePhase = 'advance'; state.players[0]!.locationId = 'magic_workshop'; state.players[0]!.mana = 5;
    deployEvent(state, 'after_player_deployed_to_location', 'magic_workshop');
    let decision = state.abilityRuntime!.pendingDecision!; expect(decision.candidates).toEqual(['gain_mana','ignore_defeat']);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['gain_mana'] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(6);
    state.players[0]!.mana = 1; deployEvent(state, 'after_player_deployed_to_location', 'magic_workshop');
    decision = state.abilityRuntime!.pendingDecision!; expect(decision.candidates).toEqual(['gain_mana']);
  });

  it('pays two mana to ignore battle-loss effects for the current round and activates lightning on battlefield deployment', () => {
    const { state, s3 } = setup(); state.round.activePhase = 'advance'; state.players[0]!.locationId = 'magic_workshop';
    deployEvent(state, 'after_player_deployed_to_location', 'magic_workshop');
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['ignore_defeat'] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4); expect(state.abilityRuntime!.battleLossIgnoreRoundByPlayer!.p1).toBe(1);
    state.players[0]!.locationId = 'miyama_town'; deployEvent(state, 'after_player_deployed_to_battlefield', 'miyama_town');
    expect(state.abilityRuntime!.cardState[s3.instanceId]!.active).toBe(true);
  });

  it('requires active append-only play, records one declaration per attribute, and rejects a repeated pre-ascension declaration', () => {
    const { state, s3 } = setup(); state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
    const basic = add(state, BASIC, 'p1', 'hand');
    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: basic }, { cardInstanceId: s3.instanceId, declaredAttribute: '力量' }])).toThrow();
    state.abilityRuntime!.cardState[s3.instanceId]!.active = true;
    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: basic }, { cardInstanceId: s3.instanceId, declaredAttribute: '力量' }])).not.toThrow();
    expect(state.abilityRuntime!.cardState[s3.instanceId]).toMatchObject({ declaredAttribute: '力量', declaredAttributeRevealed: true });
    expect(state.abilityRuntime!.declaredAttributesByPlayerDefinition!.p1![S3]).toEqual(['力量']);
    s3.zone = 'skill'; state.abilityRuntime!.cardState[s3.instanceId] = { active: true, faceDown: false, playedRound: 0 };
    const basic2 = add(state, BASIC, 'p1', 'hand');
    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: basic2 }, { cardInstanceId: s3.instanceId, declaredAttribute: '力量' }])).toThrow();
  });

  it('zeros only matching same-battlefield opponent basic attacks from the revealed declaration', () => {
    const { state, s3 } = setup(); state.abilityRuntime!.cardState[s3.instanceId] = { active: true, faceDown: false, playedRound: 1, declaredAttribute: '力量', declaredAttributeRevealed: true };
    s3.zone = 'attack_area'; s3.visibility = { scope: 'public' };
    const matching = add(state, OPP_STR, 'p2', 'attack_area', true);
    const magic = add(state, OPP_MAG, 'p2', 'attack_area', true);
    const nonbasic = add(state, OPP_NONBASIC, 'p2', 'attack_area', true);
    const remote = add(state, OPP_STR, 'p3', 'attack_area', true);
    state.round.activePhase = 'battle'; state.round.prioritySeat = state.players[0]!.seat;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: s3.instanceId, abilityId: 'fixture.caules.zero' }).ok).toBe(true);
    expect(rules.calculateCardPower(state, matching).value).toBe(0);
    expect(rules.calculateCardPower(state, magic).value).toBe(4);
    expect(rules.calculateCardPower(state, nonbasic).value).toBe(6);
    expect(rules.calculateCardPower(state, remote).value).toBe(5);
  });

  it('ascension allows repeated declarations, keeps them secret from opponents, and reveals them at combat start', () => {
    const { state, s3 } = setup(); const asc = add(state, ASC, 'p1', 'skill');
    state.abilityRuntime!.declaredAttributesByPlayerDefinition = { p1: { [S3]: ['力量'] } };
    state.abilityRuntime!.cardState[s3.instanceId]!.active = true;
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
    const basic = add(state, BASIC, 'p1', 'hand');
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: basic }, { cardInstanceId: s3.instanceId, declaredAttribute: '力量' }]);
    expect(state.abilityRuntime!.cardState[s3.instanceId]!.declaredAttributeRevealed).toBe(false);
    expect(rules.projectAbilityState(state, 'p1').cards.find((card) => card.instanceId === s3.instanceId)?.declaredAttribute).toBe('力量');
    expect(rules.projectAbilityState(state, 'p2').cards.find((card) => card.instanceId === s3.instanceId)?.declaredAttribute).toBeUndefined();
    state.round.activePhase = 'battle'; state.round.prioritySeat = state.players[0]!.seat;
    rules.processAbilityEvent(state, { id: 'fixture-combat-window', type: 'controller_combat_action_window', playerId: 'p1' });
    expect(state.abilityRuntime!.cardState[s3.instanceId]!.declaredAttributeRevealed).toBe(true);
    expect(rules.projectAbilityState(state, 'p2').cards.find((card) => card.instanceId === s3.instanceId)?.declaredAttribute).toBe('力量');
    expect(asc).toBeTruthy();
  });

  it('schedules and performs the exact next-round 12-card deck rebuild while preserving the skill zone', () => {
    const { state, s3 } = setup(); const asc = add(state, ASC, 'p1', 'skill');
    add(state, BASIC, 'p1', 'hand'); add(state, BASIC, 'p1', 'deck'); add(state, BASIC, 'p1', 'discard');
    rules.processAbilityEvent(state, { id: 'fixture-asc-unlock', type: 'after_master_ascension_unlocked', playerId: 'p1', sourceCardId: asc });
    expect(state.abilityRuntime!.pendingExactDeckRebuilds).toHaveLength(1);
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    rules.advanceAbilityPhase(state, 'preparation', 2, 1);
    const deck = state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'deck').map((card) => card.definitionId);
    expect(deck).toEqual(DECK); expect(deck).toHaveLength(12);
    expect(state.cards.find((card) => card.instanceId === s3.instanceId)?.zone).toBe('skill');
    expect(state.cards.find((card) => card.instanceId === asc)?.zone).toBe('skill');
    expect(state.abilityRuntime!.pendingExactDeckRebuilds).toEqual([]);
  });

  it('fails restore closed for forged declaration history or scheduled deck provenance', () => {
    const { state } = setup();
    state.abilityRuntime!.declaredAttributesByPlayerDefinition = { p1: { [S3]: ['力量'] } };
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    state.abilityRuntime!.declaredAttributesByPlayerDefinition.p1![S3] = ['力量','力量'];
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(false);
    state.abilityRuntime!.declaredAttributesByPlayerDefinition.p1![S3] = ['力量'];
    state.abilityRuntime!.pendingExactDeckRebuilds = [{ controllerId: 'p1', sourceCardId: 'forged', abilityId: 'fixture.caules.deck', targetRound: 2, definitionIds: [...DECK] }];
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(false);
  });

  it('keeps production capability routing identity- and text-free', () => {
    for (const path of ['packages/rules/src/ability/definition-declaration-deck-capability.ts','packages/rules/src/ability/interpreter.ts','packages/rules/src/ability/loader.ts']) {
      const text = readFileSync(path, 'utf8').toLowerCase();
      expect(text).not.toContain('master.caules-yggdmillennia'); expect(text).not.toContain('考列斯'); expect(text).not.toContain('绞首刑之雷');
    }
  });
});
