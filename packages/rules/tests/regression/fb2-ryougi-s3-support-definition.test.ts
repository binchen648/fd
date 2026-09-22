import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { isSameBattlefieldPrivateHandReturnInteractionSemantic } from '../../src/ability/interaction-gateway';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';
const APPEND_SHA = 'b8948b29606c56ee673f234c17afe98448ae3986ee1a6155b5b827e23096a239';
const ACTION_SHA = 'c3554f0f6f966f69aa14816bcba99bb291db64c13b4ca8f345a74fd4619c95c4';
const SOURCE = 'master.shiki-ryougi.skill.s3';
const INSTANCE = 'ryougi-s3';

function sha(text: string): string { return createHash('sha256').update(text, 'utf8').digest('hex'); }
function archive(): any { return JSON.parse(readFileSync('data/authoring/masters/master.shiki-ryougi.json', 'utf8')); }
function addCard(state: GameState, instanceId: string, ownerPlayerId: string, zone: string) {
  state.cards.push({ instanceId, definitionId: 'fixture.' + instanceId, ownerPlayerId, controllerPlayerId: ownerPlayerId, zone, visibility: { scope: 'owner_only', ownerPlayerId } } as any);
}
function setup() {
  const loaded = rules.loadAuthoringJson(archive());
  expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.masterCardId = 'master.shiki-ryougi';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'shinto';
  state.cards.push({ instanceId: INSTANCE, definitionId: SOURCE, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } } as any);
  addCard(state, 'p1-hand', 'p1', 'hand');
  addCard(state, 'p2-hand-a', 'p2', 'hand');
  addCard(state, 'p2-hand-b', 'p2', 'hand');
  addCard(state, 'p3-hand', 'p3', 'hand');
  addCard(state, 'p1-deck-a', 'p1', 'deck');
  addCard(state, 'p2-deck-a', 'p2', 'deck');
  addCard(state, 'p2-deck-b', 'p2', 'deck');
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260918 });
  state.abilityRuntime!.cardState[INSTANCE] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

describe('P3-FB2-24 recovery Ryougi s3 support definition', () => {
  it('keeps exact frozen provenance and target semantics inside the accepted mixed rules-only archive', () => {
    const raw = archive();
    expect(raw).toMatchObject({ schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_rule_definition_archive', id: 'master.shiki-ryougi', name: '两仪式', sourcePolicy: { phase3EvidenceCommit: F1_COMMIT, referenceMetadataCommit: REFERENCE_COMMIT } });
    expect(raw).not.toHaveProperty('publicInformation');
    expect(raw).not.toHaveProperty('deck');
    expect(raw.cards).toHaveLength(2);
    const card = raw.cards.find((candidate: any) => candidate.id === SOURCE);
    expect(card).toBeTruthy();
    expect(card).toMatchObject({ id: SOURCE, name: '死・紧握', owner: { type: 'master', id: 'master.shiki-ryougi' }, cardType: 'master_skill', initialPlacement: 'outside_game', cardFace: { typeLabel: '魔术', cost: 1, basePower: 0, attributes: ['魔术'] }, playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }] });
    expect(card.phase3Evidence.referenceStaticMetadata).toEqual({ commit: REFERENCE_COMMIT, legacySkillId: 's3', cost: 1, basePower: 0, legacyRequirement: 1, typeLabel: '魔术' });
    expect(card.phase3Evidence.canonicalSkillZoneManaRequirement).toMatchObject({ value: 8, authority: 'final_rules_9.4' });
    expect(card.phase3Evidence.f1ClauseSources.map((entry: any) => entry.sha256)).toEqual([APPEND_SHA, ACTION_SHA]);
    expect(card.abilities.map((ability: any) => sha(ability.printedClause))).toEqual([APPEND_SHA, ACTION_SHA]);
  });

  it('uses only accepted append-only and exact FB2-23 semantics', () => {
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const card = loaded.cards[SOURCE]!;
    expect(card).toMatchObject({ cardType: 'master_skill', initialPlacement: 'outside_game', playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }] });
    expect(card).not.toHaveProperty('initialZone');
    const append = card.abilities.find((ability) => ability.id === 'required-additional-play')!;
    expect(append.effects).toEqual([{ type: 'append_only_rule' }]);
    const action = card.abilities.find((ability) => ability.id === 'same-battlefield-private-hand-return')!;
    expect(isSameBattlefieldPrivateHandReturnInteractionSemantic(action)).toBe(true);
  });

  it('registers only through the accepted mixed master rule channel in the product pack', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterRuleFiles).toContain('data/authoring/masters/master.shiki-ryougi.json');
    expect(pack.authoringMasterSupportFiles).not.toContain('data/authoring/masters/master.shiki-ryougi.json');
    expect(pack.authoringMasterFiles).not.toContain('data/authoring/masters/master.shiki-ryougi.json');
  });

  it('enforces the final-rules eight-mana skill-zone gate before append-only staging', () => {
    const loaded = rules.loadAuthoringJson(archive());
    loaded.cards['fixture.ryougi-ordinary'] = {
      id: 'fixture.ryougi-ordinary', name: 'fixture ordinary', cardType: 'basic_attack',
      cardFace: { cost: 0, basePower: 1, attributes: ['fixture'] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [], abilities: [], mode: 'automatic',
    } as any;
    const state = createSeededGameState();
    state.cards = [];
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    state.players[0]!.masterCardId = 'master.shiki-ryougi';
    state.players[0]!.mana = 7;
    const ordinary = 'ryougi-ordinary';
    state.cards.push({ instanceId: ordinary, definitionId: 'fixture.ryougi-ordinary', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } } as any);
    state.cards.push({ instanceId: INSTANCE, definitionId: SOURCE, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } } as any);
    rules.initializeAbilityRuntime(state, loaded, { seed: 20260918 });

    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'stage_attack_card', cardInstanceId: ordinary }).ok).toBe(true);
    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual({ type: 'stage_attack_card', cardInstanceId: INSTANCE });
    state.players[0]!.mana = 8;
    expect(rules.getLegalActions(state, 'p1')).toContainEqual({ type: 'stage_attack_card', cardInstanceId: INSTANCE });
  });
  it('privately inspects a same-battlefield player and returns one selected card to that owner deck', () => {
    const state = setup();
    const opened = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: INSTANCE, abilityId: 'same-battlefield-private-hand-return' });
    expect(opened.ok).toBe(true);
    const first = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(first.candidates).toEqual(['p1', 'p2']);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: first.id, selectedIds: ['p2'] }).ok).toBe(true);
    const second = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(second).toMatchObject({ candidates: ['p2-hand-a', 'p2-hand-b'], min: 0, max: 1, visibility: 'owner_only' });
    expect(JSON.stringify(rules.projectAbilityState(state, 'p3'))).not.toContain('p2-hand-a');
    const p1DeckBefore = state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'deck').map((card) => card.instanceId);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: second.id, selectedIds: ['p2-hand-a'] }).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === 'p2-hand-a')!.zone).toBe('deck');
    expect(state.cards.find((card) => card.instanceId === 'p2-hand-a')!.ownerPlayerId).toBe('p2');
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'deck').map((card) => card.instanceId)).toEqual(p1DeckBefore);
  });

  it('preserves literal F1 self-selection instead of inventing opponent-only scope', () => {
    const state = setup();
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: INSTANCE, abilityId: 'same-battlefield-private-hand-return' }).ok).toBe(true);
    const first = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(first.candidates).toContain('p1');
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: first.id, selectedIds: ['p1'] }).ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p1').pendingDecision?.candidates).toEqual(['p1-hand']);
  });
});
