import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'servant.leonidas';
const ID = 'servant.leonidas.skill.sc-leonidas-1';
const SOURCE = 'leonidas-thermopylae-source';
const BASIC_DEF = 'test.leonidas.basic';
const MOVE_DEF = 'test.leonidas.move-source';
const TEXT = '【真名解放】\n残留：当你移动时关闭此牌。你所在战场的所有玩家每回合只可打出1张正面牌。';
const TEXT_SHA = '0d2672d5170981de388f5f5d9f44ed5bff196c8c84c588f0f52becb64276a2d4';
const CLOSE_CLAUSE_SHA = '6eb9eb37e4bd20374395ec9cb2023eb3e1df8177f7628feabd880044fde53c5d';
const LIMIT_CLAUSE_SHA = '44a5359096c7cd6908fb65eda8cf4e229f054a29a00e52e31bdda619b8bdd61f';

function hash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.leonidas.json'), 'utf8'));
}

function probeArchive(): any {
  const archive = rawArchive();
  archive.cards.push({
    id: BASIC_DEF, name: 'Leonidas probe basic', cardType: 'basic_attack', owner: { type: 'servant', id: OWNER },
    cardFace: { typeLabel: '力量', attributes: ['力量'], cost: 0, basePower: 1 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
  });
  archive.cards.push({
    id: MOVE_DEF, name: 'Leonidas probe movement', cardType: 'servant_skill', owner: { type: 'servant', id: OWNER },
    cardFace: { typeLabel: '特殊', attributes: [], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [{
      id: 'leonidas-probe-move', kind: 'phase_action', printedClause: 'move',
      activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
      conditions: [],
      targets: [{
        id: 'destination', type: 'location', count: { min: 1, max: 1 },
        constraints: [{ type: 'any_enabled_location' }, { type: 'not_location_kind', locationKind: 'workshop' }], conditions: [],
      }],
      effects: [{ type: 'move_player', player: 'controller', to: 'destination' }],
      cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
      execution: { mode: 'automatic' },
    }],
  });
  return archive;
}

function setup(options: { sourceActive?: boolean } = {}) {
  const pack = rules.loadAuthoringJson(probeArchive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.round.activePhase = 'action';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'shinto';
  for (const player of state.players) player.mana = 20;
  state.round.prioritySeat = state.players[0]!.seat;
  state.cards = [
    {
      instanceId: SOURCE, definitionId: ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: options.sourceActive === false ? 'field' : 'skill',
      visibility: options.sourceActive === false ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' },
    },
    { instanceId: 'p1-move', definitionId: MOVE_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } },
    { instanceId: 'p2-move', definitionId: MOVE_DEF, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'field', visibility: { scope: 'public' } },
  ] as any;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  state.abilityRuntime!.cardState['p1-move'] = { active: true, faceDown: false, playedRound: 1 };
  state.abilityRuntime!.cardState['p2-move'] = { active: true, faceDown: false, playedRound: 1 };
  if (options.sourceActive === false) state.abilityRuntime!.cardState[SOURCE] = { active: false, faceDown: false, playedRound: 1 };
  return state;
}

function addBasic(state: ReturnType<typeof setup>, playerId: string): string {
  const id = `${playerId}-basic-${state.cards.length}`;
  state.cards.push({
    instanceId: id, definitionId: BASIC_DEF, ownerPlayerId: playerId, controllerPlayerId: playerId,
    zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: playerId },
  });
  return id;
}

function play(state: ReturnType<typeof setup>, playerId: string, cardInstanceId: string, faceDown = false) {
  state.round.prioritySeat = state.players.find((player) => player.id === playerId)!.seat;
  return rules.dispatchAbilityCommand(state, playerId, {
    type: 'play_card', cardInstanceId, ...(faceDown ? { faceDown: true } : {}),
  });
}

function authoringJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? authoringJsonFiles(full) : entry.name.endsWith('.json') ? [full] : [];
  });
}

describe('P3 S R92 Leonidas s1 consumer migration', () => {
  it('materializes exactly the frozen card with exact F1 hashes and Reference static metadata', () => {
    const raw = rawArchive();
    expect(raw).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: OWNER,
      name: '列奥尼达一世', class: 'Lancer',
      sourcePolicy: {
        phase3EvidenceCommit: '59f145434695d29bdd17e4cb3adc887e84182377',
        referenceMetadataCommit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
      },
    });
    expect(raw.cards.map((card: any) => card.id)).toEqual([ID]);
    const authored = raw.cards[0];
    expect(authored).toMatchObject({
      id: ID, aliases: ['sc_leonidas_1'], legacyId: 'sc_leonidas_1', name: '炎门守护者',
      cardType: 'servant_skill', owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '特殊/宝具', attributes: ['特殊', '宝具'], cost: 3, basePower: 1 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      phase3Evidence: {
        f1Commit: '59f145434695d29bdd17e4cb3adc887e84182377',
        f1ClauseSources: [{ sha256: CLOSE_CLAUSE_SHA }, { sha256: LIMIT_CLAUSE_SHA }],
        f1FullPrintedTextSha256: TEXT_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9', legacySkillId: 'sc_leonidas_1',
          class: 'Lancer', cost: 3, basePower: 1, legacyRequirement: 8, typeLabel: '特殊/宝具', attributes: ['特殊', '宝具'],
        },
        acceptedContracts: { faceUpCardsPerRound: 'P3-R92/FB2-44 exact same-battlefield face_up_cards_per_round=set(1)' },
      },
    });
    expect(authored.printedText).toBe(TEXT);
    expect(authored.abilities[0].markers).toEqual(['真名解放']);
    expect(hash(authored.printedText)).toBe(TEXT_SHA);
  });

  it('loads blocker-free as the exact all-automatic normalized whole-card composition', () => {
    const pack = rules.loadAuthoringJson(rawArchive());
    expect(pack.report).toEqual([]);
    const card = pack.cards[ID]!;
    expect(card.mode).toBe('automatic');
    expect(card.abilities.map((ability) => [ability.id, ability.execution.mode])).toEqual([
      ['thermopylae-true-name-release', 'automatic'],
      ['thermopylae-close-on-move', 'automatic'],
      ['thermopylae-face-up-limit', 'automatic'],
    ]);
    expect(card.abilities[0]).toMatchObject({
      kind: 'declaration_reveal', activation: { trigger: 'on_use_declared' },
      effects: [{ type: 'reveal_information', scope: 'servant_package', subject: 'controller.servant' }],
    });
    expect(card.abilities[1]).toMatchObject({
      kind: 'residual', activation: { trigger: 'after_controller_enters_location', requiresSourceState: 'active' },
      conditions: [{ type: 'source_active' }, { type: 'event_player_is_controller' }],
      effects: [{ type: 'close_source_card' }], lifecycle: { duration: 'while_active' },
    });
    expect(rules.definitionHasStructuralTrueNameRelease(card)).toBe(true);
    expect(rules.isAcceptedStaticFaceUpCardsPerRoundAbility(card.abilities[2]!, 'compiled')).toBe(true);
  });

  it('plays through the real card path, pays three mana, reveals true name, and counts itself as the first face-up play', () => {
    const state = setup();
    const result = play(state, 'p1', SOURCE);
    expect(result.ok).toBe(true);
    expect(state.players[0]!.mana).toBe(17);
    expect(state.cards.find((card) => card.instanceId === SOURCE)?.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[SOURCE]).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(rules.faceUpCardsPlayedThisRound(state, 'p1')).toBe(1);
    expect(rules.hasLiveFaceUpCardsPerRoundLimit(state, 'p1')).toBe(true);
    expect(rules.hasLiveFaceUpCardsPerRoundLimit(state, 'p2')).toBe(true);
    expect(rules.hasLiveFaceUpCardsPerRoundLimit(state, 'p3')).toBe(false);
  });

  it('enforces independent same-battlefield allowances, ignores face-down play, and leaves another location unaffected', () => {
    const state = setup();
    expect(play(state, 'p1', SOURCE).ok).toBe(true);
    const p1Second = play(state, 'p1', addBasic(state, 'p1'));
    expect(p1Second.ok).toBe(false);
    expect(p1Second.rejection?.code).toBe('face_up_card_play_limit_reached');

    const faceDownState = structuredClone(state);
    const p2FaceDown = play(faceDownState, 'p2', addBasic(faceDownState, 'p2'), true);
    expect(p2FaceDown.ok).toBe(true);
    expect(rules.faceUpCardsPlayedThisRound(faceDownState, 'p2')).toBe(0);

    const p2First = play(state, 'p2', addBasic(state, 'p2'));
    expect(p2First.ok).toBe(true);
    expect(rules.faceUpCardsPlayedThisRound(state, 'p2')).toBe(1);
    const p2Second = play(state, 'p2', addBasic(state, 'p2'));
    expect(p2Second.ok).toBe(false);
    expect(p2Second.rejection?.code).toBe('face_up_card_play_limit_reached');

    const p3First = play(state, 'p3', addBasic(state, 'p3'));
    expect(p3First.ok).toBe(true);
  });

  it('closes only on authoritative controller movement and removes the cap immediately', () => {
    const state = setup();
    expect(play(state, 'p1', SOURCE).ok).toBe(true);

    rules.executeAbility(state, {
      sourceCardId: 'p2-move', abilityId: 'leonidas-probe-move', controllerId: 'p2', variables: {}, selections: { destination: ['shinto'] },
    });
    expect(state.abilityRuntime!.cardState[SOURCE]?.active).toBe(true);
    expect(state.cards.find((card) => card.instanceId === SOURCE)?.zone).toBe('attack_area');

    rules.executeAbility(state, {
      sourceCardId: 'p1-move', abilityId: 'leonidas-probe-move', controllerId: 'p1', variables: {}, selections: { destination: ['shinto'] },
    });
    expect(state.players[0]!.locationId).toBe('shinto');
    expect(state.cards.find((card) => card.instanceId === SOURCE)?.zone).toBe('skill');
    expect(state.abilityRuntime!.cardState[SOURCE]?.active).toBe(false);
    expect(rules.hasLiveFaceUpCardsPerRoundLimit(state, 'p2')).toBe(false);
  });

  it('keeps an inactive Leonidas source from supplying the face-up cap', () => {
    const state = setup({ sourceActive: false });
    expect(rules.hasLiveFaceUpCardsPerRoundLimit(state, 'p1')).toBe(false);
    expect(rules.hasLiveFaceUpCardsPerRoundLimit(state, 'p2')).toBe(false);
  });

  it('stays standalone outside product pack/generated outputs', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain('data/authoring/servants/servant.leonidas.json');
    expect(manifest).not.toContain(ID);
    expect(generated).not.toContain(ID);
  });

  it('keeps Leonidas s1 authored exactly once with no duplicate frozen ids', () => {
    const inventory = JSON.parse(readFileSync(resolve(ROOT, 'data/phase3/full-roster-ability-inventory.json'), 'utf8'));
    const frozen = new Set<string>([
      ...inventory.staticSkills.map((skill: any) => skill.canonicalAbilityId),
      ...inventory.dynamicSkills.map((skill: any) => skill.canonicalAbilityId),
    ]);
    const counts = new Map<string, number>();
    for (const file of authoringJsonFiles(resolve(ROOT, 'data/authoring'))) {
      const archive = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
      for (const card of archive.cards ?? []) counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    }
    const duplicateFrozen = [...counts.entries()].filter(([id, count]) => frozen.has(id) && count > 1);
    expect(frozen.size).toBe(944);
    expect(duplicateFrozen).toEqual([]);
    expect(counts.get(ID)).toBe(1);
  });
});