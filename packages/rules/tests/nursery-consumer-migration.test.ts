import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'servant.nursery';
const ID = 'servant.nursery.skill.sc-nursery-2';
const CLAUSE_SHA = '7858494efa94ff36bd0479163dfccaeac2c1208209cdc7ad90208d0f12a7c721';
const TRUE_NAME = 'fixture.nursery.true-name-skill';
const ORDINARY = 'fixture.nursery.ordinary-skill';

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.nursery.json'), 'utf8'));
}

function targetCard(id: string, trueName: boolean) {
  return {
    id,
    name: id,
    cardType: 'servant_skill',
    cardFace: { cost: 0, basePower: 1, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [],
    abilities: trueName ? [{
      id: 'structural-true-name', kind: 'passive', printedClause: 'fixture-only', activation: {},
      conditions: [], targets: [], effects: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {},
      responseWindow: {}, limit: {},
      visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
      execution: { mode: 'automatic' },
    }] : [],
  };
}

function runtimePack() {
  const real = rawArchive();
  const pack = rules.loadAuthoringJson({
    schemaVersion: 'fd-card-authoring-v1',
    id: 'fixture.nursery.consumer-runtime',
    name: 'Nursery consumer runtime fixture',
    cards: [real.cards[0], targetCard(TRUE_NAME, true), targetCard(ORDINARY, false)],
  });
  expect(pack.report).toEqual([]);
  return pack;
}

function add(state: GameState, instanceId: string, definitionId: string, playerId: string, zone: 'skill' | 'attack_area', active = false, faceDown = false) {
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: playerId, controllerPlayerId: playerId, zone,
    visibility: zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: playerId },
  });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown, playedRound: state.round.roundNumber };
}

function setup(source: { active?: boolean; faceDown?: boolean; zone?: 'skill' | 'attack_area' } = {}) {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action';
  for (const player of state.players.slice(0, 3)) {
    player.locationId = 'miyama_town';
    player.mana = 20;
  }
  rules.initializeAbilityRuntime(state, runtimePack(), { seed: 20260920 });
  add(state, 'nursery-source', ID, 'p1', source.zone ?? 'attack_area', source.active !== false, source.faceDown === true);
  return state;
}

function dispatchPlay(state: GameState, playerId: string, instanceId: string) {
  state.round.prioritySeat = state.players.find((candidate) => candidate.id === playerId)!.seat;
  return rules.dispatchAbilityCommand(state, playerId, { type: 'play_card', cardInstanceId: instanceId });
}

describe('P3 S R76 Nursery consumer migration', () => {
  it('materializes exactly the frozen Nursery card with F1 evidence, Reference metadata, and accepted FB2-36 semantics', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1',
      archiveType: 'servant_skill_card_archive',
      id: OWNER,
      name: '童谣',
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
      aliases: ['sc_nursery_2'],
      legacyId: 'sc_nursery_2',
      name: '无名森林',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '特殊/宝具', attributes: ['特殊', '宝具'], cost: 3, basePower: 5 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      phase3Evidence: {
        f1ClauseSources: [{ sha256: CLAUSE_SHA }],
        referenceStaticMetadata: {
          legacySkillId: 'sc_nursery_2', class: 'Caster', cost: 3, basePower: 5, legacyRequirement: 8,
          typeLabel: '特殊/宝具', attributes: ['特殊', '宝具'],
        },
      },
    });
    expect(authored.abilities).toHaveLength(1);
    expect(hash(authored.abilities[0].printedClause)).toBe(CLAUSE_SHA);

    const pack = rules.loadAuthoringJson(raw);
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities).toHaveLength(1);
    const ability = card.abilities[0]!;
    expect(ability).toMatchObject({
      id: 'memory-playground', kind: 'passive',
      conditions: [{ type: 'source_active' }],
      lifecycle: { duration: 'while_active' },
      visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
      execution: { mode: 'automatic' },
    });
    expect(rules.classifyAcceptedSkillUseForbidModifier(ability.ruleModifiers[0]!)).toBe('same_location_true_name_off_attack');
    expect(rules.isAcceptedStaticWhileActiveSkillUseForbidAbility(ability)).toBe(true);
    expect(rules.definitionHasStructuralTrueNameRelease(card)).toBe(true);
  });

  it('blocks same-location structural true-name skill use while the migrated source is active, including its controller', () => {
    for (const playerId of ['p1', 'p2'] as const) {
      const state = setup();
      add(state, `target-${playerId}`, TRUE_NAME, playerId, 'skill');
      expect(dispatchPlay(state, playerId, `target-${playerId}`)).toEqual(expect.objectContaining({
        ok: false, rejection: expect.objectContaining({ code: 'play_forbidden' }),
      }));
      expect(state.cards.find((entry) => entry.instanceId === `target-${playerId}`)!.zone).toBe('skill');
    }
  });

  it('uses structural visibility instead of printed text or identity and does not block an ordinary skill', () => {
    const state = setup();
    add(state, 'ordinary', ORDINARY, 'p2', 'skill');
    expect(rules.definitionHasStructuralTrueNameRelease(state.abilityRuntime!.pack.cards[ORDINARY])).toBe(false);
    expect(dispatchPlay(state, 'p2', 'ordinary').ok).toBe(true);
  });

  it('re-evaluates current location and source state and fails closed when the migrated source is not active', () => {
    const away = setup();
    add(away, 'away-target', TRUE_NAME, 'p2', 'skill');
    away.players[1]!.locationId = 'recon';
    expect(dispatchPlay(away, 'p2', 'away-target').ok).toBe(true);

    for (const source of [
      { active: false },
      { active: true, faceDown: true },
      { active: false, zone: 'skill' as const },
    ]) {
      const state = setup(source);
      add(state, 'target', TRUE_NAME, 'p2', 'skill');
      expect(dispatchPlay(state, 'p2', 'target').ok).toBe(true);
    }
  });

  it('does not apply the Nursery selector to a structural true-name card already in attack_area', () => {
    const state = setup();
    add(state, 'already-attacking', TRUE_NAME, 'p2', 'attack_area', true, false);
    const result = dispatchPlay(state, 'p2', 'already-attacking');
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).not.toBe('play_forbidden');
  });

  it('trusted batch play shares the same accepted play-eligibility gate and rejects mutation-free', () => {
    const state = setup();
    add(state, 'target', TRUE_NAME, 'p2', 'skill');
    const before = structuredClone(state);
    expect(() => rules.playAbilityCardBatch(state, 'p2', [{ cardInstanceId: 'target' }])).toThrow(/cannot be played/i);
    expect(state).toEqual(before);
  });

  it('keeps this standalone migration outside product pack/generated outputs', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain('data/authoring/servants/servant.nursery.json');
    expect(generated).not.toContain(ID);
  });
});
