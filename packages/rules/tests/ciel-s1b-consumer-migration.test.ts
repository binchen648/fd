import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '@fd/content';
import * as rules from '../src/index';
import { compileExecutableCardPack } from '../src/ability/executable-card-pack';
import type { AbilityEvent } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ROOT = resolve('.');
const OWNER = 'master.ciel';
const ID = 'master.ciel.skill.s1b';
const TARGET = 'master.ciel.skill.s3';
const SOURCE = 'ciel-s1b-source';
const ABILITY = 'seventh-scripture-return';
const FULL_TEXT = '当一名对手于一回合内获得7点及以上的战果时，令【第七圣典】加入或返回你的技能区。';
const CLAUSE = '当一名对手于一回合内获得7点及以上的战果时，令【第七圣典】加入或返回你的技能区';
const FULL_SHA = '6ed54c1b75925d3b78f7bd89727b5363dc944cf571831c1a81618e788eb71e31';
const CLAUSE_SHA = '98a4becbbedd9d11ae2b93ea1b192b781a6943fb0ff62e1dbff4bb9697bbb6fc';
const hash = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(ROOT, 'data/authoring/masters/master.ciel.json'), 'utf8').replace(/^\uFEFF/, ''));
}

function setup(existingTarget = false): GameState {
  const loaded = loadPlaytestContentPack(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: ROOT });
  const executable = compileExecutableCardPack(compileLoadedPlaytestPack(loaded).library);
  const pack: any = { cards: executable.cards };
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{
    instanceId: SOURCE,
    definitionId: ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  if (existingTarget) {
    state.cards.push({
      instanceId: 'ciel-s3-existing',
      definitionId: TARGET,
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p2',
      zone: 'discard',
      visibility: { scope: 'public' },
    });
  }
  state.players[0]!.masterCardId = OWNER;
  rules.initializeAbilityRuntime(state, pack, { seed: 11001 });
  return state;
}

function acceptedEvent(state: GameState, id: string): AbilityEvent {
  const trusted = state.abilityRuntime!.trustedVictoryPointChanges![id]!;
  return { id, type: 'player.victory-points.changed', ...trusted };
}

function authoringJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? authoringJsonFiles(full) : entry.name.endsWith('.json') ? [full] : [];
  });
}

describe('P3 S R110 Ciel s1b consumer migration', () => {
  it('authors the exact frozen identity, source hashes, static metadata, and normalized FB2-51 envelope', () => {
    const raw = rawArchive();
    const matches = raw.cards.filter((card: any) => card.id === ID);
    expect(matches).toHaveLength(1);
    const card = matches[0];
    expect(card).toMatchObject({
      id: ID,
      aliases: ['s1b'],
      legacyId: 's1b',
      name: '外典',
      cardType: 'master_skill',
      owner: { type: 'master', id: OWNER },
      cardFace: { typeLabel: '被动', cost: 0, basePower: 0, attributes: [] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      phase3Evidence: {
        f1Commit: '59f145434695d29bdd17e4cb3adc887e84182377',
        f1ClauseSources: [{
          document: 'src/content/authoring/cards.json',
          locator: 'skillCards[15].abilities[0].printedClause',
          sha256: CLAUSE_SHA,
        }],
        f1FullPrintedTextSha256: FULL_SHA,
        referenceStaticMetadata: {
          commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
          legacySkillId: 's1b', class: 'Master', cost: 0, basePower: 0,
          legacyRequirement: null, typeLabel: '被动', attributes: [],
        },
      },
    });
    expect(card).not.toHaveProperty('initialPlacement');
    expect(card.printedText).toBe(FULL_TEXT);
    expect(hash(card.printedText)).toBe(FULL_SHA);
    expect(card.abilities).toHaveLength(1);
    expect(card.abilities[0].printedClause).toBe(CLAUSE);
    expect(hash(card.abilities[0].printedClause)).toBe(CLAUSE_SHA);
    expect(rules.isAcceptedOpponentRoundVpGainThresholdAbility(card.abilities[0], 'authoring')).toBe(true);

    const loaded: any = rules.loadAuthoringJson(raw);
    expect(loaded.report).toEqual([]);
    expect(rules.isAcceptedOpponentRoundVpGainThresholdAbility(loaded.cards[ID]!.abilities[0], 'compiled')).toBe(true);
  });

  it('compiles as an ordinary initial skill-zone master skill and keeps s3 as the exact deferred target', () => {
    const loaded = loadPlaytestContentPack(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: ROOT });
    const input = compileLoadedPlaytestPack(loaded).library;
    const executable = compileExecutableCardPack(input);
    expect(executable.cards[ID]).toMatchObject({
      id: ID,
      ownerId: OWNER,
      cardType: 'master_skill',
      initialZone: 'skill',
      mode: 'automatic',
      cardFace: { typeLabel: '被动', cost: 0, basePower: 0, attributes: [] },
      playRequirements: [],
    });
    expect(executable.cards[ID]).not.toHaveProperty('initialPlacement');
    expect(rules.isAcceptedOpponentRoundVpGainThresholdAbility(executable.cards[ID]!.abilities[0]!, 'compiled')).toBe(true);
    expect(executable.cards[TARGET]).toMatchObject({
      id: TARGET, ownerId: OWNER, cardType: 'master_skill', initialPlacement: 'outside_game',
    });
  });

  it('crosses on a real direct opponent +7 exactly once and creates the exact s3 definition', () => {
    const state = setup();
    rules.adjustVictoryPointsAuthoritatively(state, 'p2', 7);
    const targets = state.cards.filter((card) => card.definitionId === TARGET);
    expect(targets).toHaveLength(1);
    expect(targets[0]).toMatchObject({
      ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    rules.adjustVictoryPointsAuthoritatively(state, 'p2', 2);
    expect(state.cards.filter((card) => card.definitionId === TARGET)).toHaveLength(1);
    expect(state.abilityRuntime!.roundPositiveVictoryPointGain).toEqual({
      round: state.round.roundNumber, byPlayer: { p2: 9 },
    });
  });

  it('crosses split 3+4 only on the second event and ignores self, zero, loss, +6, and non-VP events', () => {
    const split = setup();
    rules.adjustVictoryPointsAuthoritatively(split, 'p2', 3);
    expect(split.cards.some((card) => card.definitionId === TARGET)).toBe(false);
    rules.adjustVictoryPointsAuthoritatively(split, 'p2', 4);
    expect(split.cards.some((card) => card.definitionId === TARGET)).toBe(true);

    const six = setup(); rules.adjustVictoryPointsAuthoritatively(six, 'p2', 6);
    expect(six.cards.some((card) => card.definitionId === TARGET)).toBe(false);
    const own = setup(); rules.adjustVictoryPointsAuthoritatively(own, 'p1', 7);
    expect(own.cards.some((card) => card.definitionId === TARGET)).toBe(false);
    for (const delta of [0, -3]) {
      const state = setup(); state.players[1]!.vp = 5;
      rules.adjustVictoryPointsAuthoritatively(state, 'p2', delta);
      expect(state.cards.some((card) => card.definitionId === TARGET)).toBe(false);
    }
    const nonVp = setup();
    rules.processAbilityEvent(nonVp, { id: 'mana', type: 'mana.changed', playerId: 'p2' });
    expect(nonVp.cards.some((card) => card.definitionId === TARGET)).toBe(false);
  });

  it('returns the same physical s3 after round reset rather than creating a duplicate', () => {
    const state = setup(true);
    rules.adjustVictoryPointsAuthoritatively(state, 'p2', 7);
    const target = state.cards.find((card) => card.instanceId === 'ciel-s3-existing')!;
    expect(target).toMatchObject({ definitionId: TARGET, controllerPlayerId: 'p1', zone: 'skill' });
    expect(state.cards.filter((card) => card.definitionId === TARGET)).toHaveLength(1);

    target.zone = 'discard';
    target.controllerPlayerId = 'p2';
    target.visibility = { scope: 'public' };
    rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
    expect(state.abilityRuntime!.roundPositiveVictoryPointGain).toEqual({ round: state.round.roundNumber, byPlayer: {} });
    rules.adjustVictoryPointsAuthoritatively(state, 'p2', 7);
    expect(state.cards.find((card) => card.instanceId === 'ciel-s3-existing')).toMatchObject({
      controllerPlayerId: 'p1', zone: 'skill',
    });
    expect(state.cards.filter((card) => card.definitionId === TARGET)).toHaveLength(1);
  });

  it('keeps duplicate event ids idempotent and forged provenance fail-closed on the real consumer', () => {
    const state = setup();
    const id = rules.adjustVictoryPointsAuthoritatively(state, 'p2', 3);
    const duplicate = acceptedEvent(state, id);
    const beforeDuplicate = structuredClone(state);
    rules.processAbilityEvent(state, duplicate);
    expect(state).toEqual(beforeDuplicate);

    const forged = { ...duplicate, id: 'forged-consumer-event' };
    const beforeForged = structuredClone(state);
    expect(() => rules.processAbilityEvent(state, forged)).toThrow(/authoritative provenance/i);
    expect(state).toEqual(beforeForged);
  });

  it('registers only in the existing rules-only surface and is the sole frozen 149-to-150 addition', () => {
    const manifest = JSON.parse(readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8'));
    expect(manifest.authoringMasterRuleFiles).toContain('data/authoring/masters/master.ciel.json');
    expect(JSON.stringify(manifest)).not.toContain(ID);

    const generated = JSON.parse(readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8'));
    expect(generated.cards.some((card: any) => card.id === ID)).toBe(false);
    expect(generated.masters.some((master: any) => master.id === OWNER)).toBe(false);
    expect(generated.rules.cards[ID]).toMatchObject({
      id: ID, ownerId: OWNER, cardType: 'master_skill', initialZone: 'skill', mode: 'automatic',
      cardFace: { typeLabel: '被动', cost: 0, basePower: 0, attributes: [] },
    });
    expect(generated.rules.characters[OWNER]).toBeUndefined();
    expect(generated.rules.decks[OWNER]).toBeUndefined();
    expect(generated.rules.fallbackCommandSpells[OWNER]).toBeUndefined();
    expect(generated.rules.sourceMap[ID]).toMatchObject({ archiveId: OWNER, cardIndex: 3 });

    const inventory = JSON.parse(readFileSync(resolve(ROOT, 'data/phase3/full-roster-ability-inventory.json'), 'utf8'));
    const frozen = new Set<string>([
      ...inventory.staticSkills.map((entry: any) => entry.canonicalAbilityId),
      ...inventory.dynamicSkills.map((entry: any) => entry.canonicalAbilityId),
    ]);
    const counts = new Map<string, number>();
    for (const file of authoringJsonFiles(resolve(ROOT, 'data/authoring'))) {
      const archive = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
      for (const card of archive.cards ?? []) counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    }
    const overlap = [...counts.keys()].filter((id) => frozen.has(id));
    const duplicateFrozen = [...counts.entries()].filter(([id, count]) => frozen.has(id) && count > 1);
    expect(frozen.size).toBe(944);

    expect(duplicateFrozen).toEqual([]);
    expect(counts.get(ID)).toBe(1);
    expect(counts.get(TARGET)).toBe(1);
  });
});
