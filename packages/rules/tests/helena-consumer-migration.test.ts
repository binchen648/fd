import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'servant.helena';
const ID = 'servant.helena.skill.sc-helena-3';
const CLAUSE_SHA = '827a73ca8ea48bda73c2a252c0cda060db3cbb22b9c34cdc529723085e3f5497';
const FULL_TEXT_SHA = 'ff3ff32a20b02a8a8504bcf2ddb2f3062c8a4ca091d6360f9897c60187bfc7a5';
const MASTER_SKILL = 'fixture.helena.master-skill';
const SERVANT_SKILL = 'fixture.helena.servant-skill';
const NON_SKILL = 'fixture.helena.event';

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.helena.json'), 'utf8'));
}

function targetCard(id: string, cardType: 'master_skill' | 'servant_skill' | 'event') {
  return {
    id,
    name: id,
    cardType,
    cardFace: { cost: 0, basePower: cardType === 'servant_skill' ? 1 : 0, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [],
    abilities: [],
  };
}

function runtimePack() {
  const real = rawArchive();
  const pack = rules.loadAuthoringJson({
    schemaVersion: 'fd-card-authoring-v1',
    id: 'fixture.helena.consumer-runtime',
    name: 'Helena consumer runtime fixture',
    cards: [
      real.cards[0],
      targetCard(MASTER_SKILL, 'master_skill'),
      targetCard(SERVANT_SKILL, 'servant_skill'),
      targetCard(NON_SKILL, 'event'),
    ],
  });
  expect(pack.report).toEqual([]);
  return pack;
}

function add(
  state: GameState,
  instanceId: string,
  definitionId: string,
  playerId: string,
  zone: 'skill' | 'attack_area' | 'hand' = 'skill',
  active = false,
  faceDown = false,
) {
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: playerId,
    controllerPlayerId: playerId,
    zone,
    visibility: zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: playerId },
  });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown, playedRound: state.round.roundNumber };
}

function setup() {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action';
  for (const player of state.players.slice(0, 3)) {
    player.locationId = 'miyama_town';
    player.mana = 20;
  }
  rules.initializeAbilityRuntime(state, runtimePack(), { seed: 20260920 });
  add(state, 'helena-source', ID, 'p1', 'attack_area', true, false);
  return state;
}

function activate(state: GameState) {
  state.round.prioritySeat = state.players.find((candidate) => candidate.id === 'p1')!.seat;
  const round = state.round.roundNumber;
  const result = rules.dispatchAbilityCommand(state, 'p1', {
    type: 'activate_ability',
    cardInstanceId: 'helena-source',
    abilityId: 'mana-synchronization',
  });
  expect(result.ok).toBe(true);
  expect(state.abilityRuntime!.ongoingEffects).toContainEqual(expect.objectContaining({
    sourceCardId: 'helena-source',
    abilityId: 'mana-synchronization',
    controllerId: 'p1',
    duration: 'this_round',
    startRound: round,
    expiresAtRound: round + 1,
  }));
}

function dispatchPlay(state: GameState, playerId: string, instanceId: string) {
  state.round.prioritySeat = state.players.find((candidate) => candidate.id === playerId)!.seat;
  return rules.dispatchAbilityCommand(state, playerId, { type: 'play_card', cardInstanceId: instanceId });
}

describe('P3 S R77 Helena consumer migration', () => {
  it('materializes exactly the frozen Helena card with F1 evidence, Reference metadata, and accepted FB2-36 semantics', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1',
      archiveType: 'servant_skill_card_archive',
      id: OWNER,
      name: '海伦娜·布拉瓦茨基',
      class: 'Caster',
      sourcePolicy: {
        phase3EvidenceCommit: '59f145434695d29bdd17e4cb3adc887e84182377',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards.map((card: any) => card.id)).toEqual([ID]);
    const authored = raw.cards[0];
    expect(authored).toMatchObject({
      id: ID,
      aliases: ['sc_helena_3'],
      legacyId: 'sc_helena_3',
      name: '金星神·火炎天主',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '魔术/宝具', attributes: ['魔术', '宝具'], cost: 3, basePower: 7 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      phase3Evidence: {
        f1ClauseSources: [{ sha256: CLAUSE_SHA }],
        f1FullPrintedTextSha256: FULL_TEXT_SHA,
        referenceStaticMetadata: {
          legacySkillId: 'sc_helena_3', class: 'Caster', cost: 3, basePower: 7, legacyRequirement: 8,
          typeLabel: '魔术/宝具', attributes: ['魔术', '宝具'],
        },
      },
    });
    expect(hash(authored.printedText)).toBe(FULL_TEXT_SHA);
    expect(authored.abilities).toHaveLength(1);
    expect(hash(authored.abilities[0].printedClause)).toBe(CLAUSE_SHA);

    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    const ability = card.abilities[0]!;
    expect(ability).toMatchObject({
      id: 'mana-synchronization',
      kind: 'phase_action',
      activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
      conditions: [{ type: 'source_active' }],
      lifecycle: { duration: 'this_round' },
      visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
      execution: { mode: 'automatic' },
    });
    expect(rules.classifyAcceptedSkillUseForbidModifier(ability.ruleModifiers[0]!)).toBe('same_location_opponent_facedown_skill');
    expect(rules.definitionHasStructuralTrueNameRelease(card)).toBe(true);
  });

  it('activates through the action window and blocks same-location opponent face-down master and servant skill use for this round', () => {
    for (const [definitionId, suffix] of [[MASTER_SKILL, 'master'], [SERVANT_SKILL, 'servant']] as const) {
      const state = setup();
      activate(state);
      add(state, `target-${suffix}`, definitionId, 'p2', 'skill', false, true);
      expect(dispatchPlay(state, 'p2', `target-${suffix}`)).toEqual(expect.objectContaining({
        ok: false,
        rejection: expect.objectContaining({ code: 'play_forbidden' }),
      }));
      expect(state.cards.find((entry) => entry.instanceId === `target-${suffix}`)!.zone).toBe('skill');
    }
  });

  it('does not match controller cards, face-up skills, non-skill cards, or different-location opponents', () => {
    const controller = setup();
    activate(controller);
    add(controller, 'controller-skill', SERVANT_SKILL, 'p1', 'skill', false, true);
    expect(dispatchPlay(controller, 'p1', 'controller-skill').ok).toBe(true);

    const faceUp = setup();
    activate(faceUp);
    add(faceUp, 'face-up', MASTER_SKILL, 'p2', 'skill', false, false);
    expect(dispatchPlay(faceUp, 'p2', 'face-up').ok).toBe(true);

    const nonSkill = setup();
    activate(nonSkill);
    add(nonSkill, 'event-card', NON_SKILL, 'p2', 'skill', false, true);
    expect(dispatchPlay(nonSkill, 'p2', 'event-card').ok).toBe(true);

    const away = setup();
    activate(away);
    away.players.find((candidate) => candidate.id === 'p2')!.locationId = 'recon';
    add(away, 'away-skill', MASTER_SKILL, 'p2', 'skill', false, true);
    expect(dispatchPlay(away, 'p2', 'away-skill').ok).toBe(true);
  });

  it('fails closed when the source stops being live after activation', () => {
    for (const mutate of [
      (state: GameState) => { state.abilityRuntime!.cardState['helena-source']!.active = false; },
      (state: GameState) => { state.abilityRuntime!.cardState['helena-source']!.faceDown = true; },
      (state: GameState) => { state.cards.find((card) => card.instanceId === 'helena-source')!.zone = 'skill'; },
    ]) {
      const state = setup();
      activate(state);
      mutate(state);
      add(state, 'target', MASTER_SKILL, 'p2', 'skill', false, true);
      expect(dispatchPlay(state, 'p2', 'target').ok).toBe(true);
    }
  });

  it('expires at the next round even if the source remains active', () => {
    const state = setup();
    activate(state);
    state.round.roundNumber += 1;
    add(state, 'target', SERVANT_SKILL, 'p2', 'skill', false, true);
    expect(dispatchPlay(state, 'p2', 'target').ok).toBe(true);
  });

  it('trusted batch play shares the same accepted play-eligibility gate and rejects mutation-free', () => {
    const state = setup();
    activate(state);
    add(state, 'target', MASTER_SKILL, 'p2', 'skill', false, true);
    const before = structuredClone(state);
    expect(() => rules.playAbilityCardBatch(state, 'p2', [{ cardInstanceId: 'target' }])).toThrow(/cannot be played/i);
    expect(state).toEqual(before);
  });

  it('keeps this standalone migration outside product pack/generated outputs', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain('data/authoring/servants/servant.helena.json');
    expect(generated).not.toContain(ID);
  });
});
