import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { ExecutableCardDefinition } from '../src/ability/types';

const ROOT = resolve('.');
const OWNER = 'servant.helena';
const ID = 'servant.helena.skill.sc-helena-1';
const S3 = 'servant.helena.skill.sc-helena-3';
const SOURCE = 'helena-s1-source';
const ABILITY = 'colonel-olcott-action';
const TEXT = '被动/行动阶段：从手牌打出一张力量基础攻击，若如此做，将一名你所在地点的对手技能区明置的一张从者技能暗置。';
const TEXT_SHA = 'abc76e38254ac8688fa7caef5392e28a7b8baa507479231db743a638e9f3fc52';
const hash = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/servants/servant.helena.json'), 'utf8').replace(/^\uFEFF/, ''));
}

function def(id: string, cardType: string, attributes: string[] = [], cost = 0): ExecutableCardDefinition {
  return {
    id,
    name: id,
    cardType,
    cardFace: { typeLabel: 'test', cost, basePower: cardType.includes('attack') ? 1 : 0, attributes },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [],
    abilities: [],
    mode: 'automatic',
    playKind: cardType.includes('attack') ? 'attack' : 'support',
    destinationZone: cardType.includes('attack') ? 'attack_area' : 'field',
  } as ExecutableCardDefinition;
}

function setup() {
  const loaded = rules.loadAuthoringJson(rawArchive());
  expect(loaded.report).toEqual([]);
  const extras = [
    def('basic.strength', 'basic_attack', ['力量'], 2),
    def('basic.magic', 'basic_attack', ['魔术'], 1),
    def('servant.strength', 'servant_attack', ['力量'], 1),
    def('servant.skill.target', 'servant_skill'),
    def('servant.skill.remote', 'servant_skill'),
    def('servant.skill.self', 'servant_skill'),
    def('servant.skill.down', 'servant_skill'),
    def('master.skill.target', 'master_skill'),
  ];
  const pack = { cards: { ...loaded.cards, ...Object.fromEntries(extras.map((card) => [card.id, card])) } };
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.mana = 5;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'shinto';
  state.cards = [
    { instanceId: SOURCE, definitionId: ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'eligible', definitionId: 'basic.strength', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'magic', definitionId: 'basic.magic', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'servant-attack', definitionId: 'servant.strength', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'target', definitionId: 'servant.skill.target', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'skill', visibility: { scope: 'public' } },
    { instanceId: 'remote', definitionId: 'servant.skill.remote', ownerPlayerId: 'p3', controllerPlayerId: 'p3', zone: 'skill', visibility: { scope: 'public' } },
    { instanceId: 'self', definitionId: 'servant.skill.self', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'public' } },
    { instanceId: 'down', definitionId: 'servant.skill.down', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } },
    { instanceId: 'master', definitionId: 'master.skill.target', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'skill', visibility: { scope: 'public' } },
  ];
  rules.initializeAbilityRuntime(state, pack, { seed: 11301, playRulesVersion: 'explicit-v1' });
  for (const id of [SOURCE, 'target', 'remote', 'self', 'master']) state.abilityRuntime!.cardState[id] = { active: true, faceDown: false, playedRound: 0 };
  state.abilityRuntime!.cardState.down = { active: false, faceDown: true, playedRound: 0 };
  return state;
}

function activate(state: ReturnType<typeof setup>) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ABILITY });
}

function choose(state: ReturnType<typeof setup>, selectedIds: string[]) {
  const pending = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds });
}

function pendingCandidates(state: ReturnType<typeof setup>): string[] {
  const action = rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'choose_target');
  return action && action.type === 'choose_target' ? action.candidates : [];
}

function authoringFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? authoringFiles(full) : entry.name.endsWith('.json') ? [full] : [];
  });
}

describe('P3 S R113 Helena s1 consumer migration', () => {
  it('authors exactly the frozen S1 source/static metadata and normalized FB2-53 whole envelope', () => {
    const raw = rawArchive();
    expect(raw.cards.filter((card: any) => card.id === ID)).toHaveLength(1);
    expect(raw.cards.filter((card: any) => card.id === S3)).toHaveLength(1);
    const card = raw.cards.find((candidate: any) => candidate.id === ID);
    expect(card).toMatchObject({
      id: ID,
      aliases: ['sc_helena_1'],
      legacyId: 'sc_helena_1',
      name: '奥尔科特上校',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '被动', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      phase3Evidence: {
        f1Commit: '59f145434695d29bdd17e4cb3adc887e84182377',
        f1ClauseSources: [{ document: 'src/content/authoring/cards.json', locator: 'skillCards[31].abilities[0].printedClause', sha256: TEXT_SHA }],
        f1FullPrintedTextSha256: TEXT_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9', legacySkillId: 'sc_helena_1', class: 'Caster',
          cost: 0, basePower: 0, legacyRequirement: 0, typeLabel: '被动', attributes: [],
        },
      },
    });
    expect(card).not.toHaveProperty('initialPlacement');
    expect(card.printedText).toBe(TEXT);
    expect(hash(card.printedText)).toBe(TEXT_SHA);
    expect(card.abilities).toHaveLength(1);
    expect(card.abilities[0].printedClause).toBe(TEXT);
    expect(hash(card.abilities[0].printedClause)).toBe(TEXT_SHA);
    expect(rules.isAcceptedBasicStrengthOpponentSkillFaceDownAbility(card.abilities[0], 'authoring')).toBe(true);

    const loaded = rules.loadAuthoringJson(raw);
    expect(loaded.report).toEqual([]);
    expect(loaded.cards[ID]!.mode).toBe('automatic');
    expect(loaded.cards[ID]!.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
    expect(rules.isAcceptedBasicStrengthOpponentSkillFaceDownAbility(loaded.cards[ID]!.abilities[0]!, 'compiled')).toBe(true);
  });

  it('settles the real S1 stage-one normal play before opening the exact stage-two choice', () => {
    const state = setup();
    expect(activate(state).ok).toBe(true);
    expect(pendingCandidates(state)).toEqual(['eligible']);
    expect(choose(state, ['eligible']).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(3);
    expect(state.cards.find((card) => card.instanceId === 'eligible')).toMatchObject({ zone: 'attack_area', ownerPlayerId: 'p1', controllerPlayerId: 'p1' });
    expect(state.abilityRuntime!.cardState.eligible).toMatchObject({ active: true, faceDown: false, paidManaOnPlay: 2, playedRound: state.round.roundNumber });
    expect(pendingCandidates(state)).toEqual(['target']);
  });

  it('turns only the exact same-location opponent face-up servant skill down without moving or closing it', () => {
    const state = setup();
    expect(activate(state).ok).toBe(true);
    expect(choose(state, ['eligible']).ok).toBe(true);
    const before = { ...state.cards.find((card) => card.instanceId === 'target')! };
    expect(choose(state, ['target']).ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === 'target')).toMatchObject({
      instanceId: before.instanceId,
      definitionId: before.definitionId,
      ownerPlayerId: before.ownerPlayerId,
      controllerPlayerId: before.controllerPlayerId,
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p2' },
    });
    expect(state.abilityRuntime!.cardState.target).toMatchObject({ active: false, faceDown: true });
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'card_set_face_down', cardInstanceId: 'target', controllerId: 'p1', playerId: 'p2', sourceCardId: SOURCE, abilityId: ABILITY }),
    ]));
  });

  it('inherits the accepted frozen-snapshot boundary on the real S1 continuation', () => {
    const state = setup();
    expect(activate(state).ok).toBe(true);
    expect(choose(state, ['eligible']).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.candidates).toEqual(['target']);
    state.players[2]!.locationId = 'miyama_town';
    const newlyLive = state.cards.find((card) => card.instanceId === 'remote')!;
    const before = structuredClone(state);
    const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [newlyLive.instanceId] });
    expect(result.ok).toBe(false);
    expect(state).toEqual(before);
  });

  it('fails a stale stage-two target without undoing the already committed stage-one play', () => {
    const state = setup();
    expect(activate(state).ok).toBe(true);
    expect(choose(state, ['eligible']).ok).toBe(true);
    state.players[1]!.locationId = 'shinto';
    const before = structuredClone(state);
    const result = choose(state, ['target']);
    expect(result.ok).toBe(false);
    expect(state).toEqual(before);
    expect(state.players[0]!.mana).toBe(3);
    expect(state.cards.find((card) => card.instanceId === 'eligible')!.zone).toBe('attack_area');
  });

  it('preserves Helena S1/S3 exactly once against the pre-M50 material baseline', () => {
    const inventory = JSON.parse(readFileSync(resolve(ROOT, 'data/phase3/full-roster-ability-inventory.json'), 'utf8'));
    const frozen = new Set<string>();
    const collectFrozen = (value: any): void => {
      if (!value || typeof value !== 'object') return;
      if (typeof value.canonicalCardId === 'string') frozen.add(value.canonicalCardId);
      for (const child of Object.values(value)) if (child && typeof child === 'object') collectFrozen(child);
    };
    collectFrozen(inventory);
    const material: string[] = [];
    for (const file of authoringFiles(resolve(ROOT, 'data/authoring')).filter((entry) => !/\.p3-m50-\d+\.json$/.test(entry))) {
      const raw = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
      for (const card of raw.cards ?? []) if (frozen.has(card.id)) material.push(card.id);
    }
    const unique = new Set(material);
    expect(frozen.size).toBe(944);
    expect(unique.size).toBe(165);
    expect(material.length).toBe(unique.size);
    expect(material.filter((id) => id === ID)).toHaveLength(1);
    expect(material.filter((id) => id === S3)).toHaveLength(1);
  });

  it('keeps the standalone Helena archive outside product/generated registration', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    expect(manifest).not.toContain('data/authoring/servants/servant.helena.json');
    expect(generated).not.toContain(ID);
  });
});