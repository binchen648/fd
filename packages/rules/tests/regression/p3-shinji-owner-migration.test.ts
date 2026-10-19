import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';
import { createMatchSession } from '../../src/match-session';
import { seedIncludingMaster } from './deterministic-character-fixture';

const ROOT = 'master.shinji';
const IDS = ['ascension', 's1', 's2', 's3', 's4'].map((skill) => `${ROOT}.skill.${skill}`);
const LEGACY_IDS = ['drain-command', 'useless-person', 'clown', 'false-attendant-book'].map((skill) => `${ROOT}.skill.${skill}`);
const PATH = 'data/authoring/masters/master.shinji.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const generated = JSON.parse(readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8')) as any;
const evidence = JSON.parse(readFileSync('data/generated/fd-playtest-v1.evidence-report.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

describe('P3 Shinji owner migration boundary', () => {
  it('preserves all five canonical identities, exact text/line breaks, legacy locators, and six clause hashes', () => {
    const canonicalCards = archive.cards.filter((card: any) => card.compatibilityOnly !== true);
    expect(canonicalCards.map((card: any) => card.id)).toEqual(IDS);
    expect(IDS.every((id) => Object.prototype.hasOwnProperty.call(loaded.cards, id))).toBe(true);
    const rows = [...inventory.staticSkills, ...inventory.dynamicSkills]
      .filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(rows).toHaveLength(5);
    let clauseCount = 0;
    for (const entry of rows) {
      const card = canonicalCards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.owner).toEqual({ type: 'master', id: ROOT });
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId])
        .toBe(`legacy-content.json#master/master.shinji/${entry.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of entry.clauses) {
        clauseCount += 1;
        expect(archive.sourcePolicy.sourceLocators.generated[entry.canonicalAbilityId])
          .toContain(`sha256=${clause.source.sha256}`);
      }
    }
    expect(clauseCount).toBe(6);
    expect(canonicalCards.find((card: any) => card.id === `${ROOT}.skill.s4`).printedText.split('\n'))
      .toHaveLength(2);
  });

  it('retains legacy Shinji IDs as compatibility-only automatic cards', () => {
    expect(LEGACY_IDS.every((id) => archive.cards.some((card: any) => card.id === id && card.compatibilityOnly === true))).toBe(true);
    expect(loaded.cards['master.shinji.skill.drain-command'].abilities[0]).toMatchObject({
      id: 'drain-command.enter-miyama',
      activation: { trigger: 'after_controller_enters_location', eventLocationId: 'miyama_town' },
      execution: { mode: 'automatic' },
    });
    expect(loaded.cards['master.shinji.skill.clown'].abilities[0]).toMatchObject({
      id: 'clown.lose-command-seal',
      activation: { trigger: 'after_controller_loses_battle' },
      execution: { mode: 'automatic' },
    });
  });

  it('keeps shared and specific handler boundaries reference-only and host-adjudicated', () => {
    for (const handler of [
      'core.shinji-book (shared_handler)',
      'core.enter-location-gain-mana (specific_handler)',
      'core.defeat-lose-command-seal (specific_handler)',
    ]) expect(archive.sourcePolicy.note).toContain(handler);
    expect(archive.sourcePolicy.note).toMatch(/reference handler/);
    const canonicalCards = archive.cards.filter((card: any) => card.compatibilityOnly !== true);
    expect(canonicalCards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(canonicalCards.every((card: any) => card.abilities.every((ability: any) => ability.execution.mode === 'host_adjudicated'))).toBe(true);
    expect(canonicalCards.every((card: any) => card.abilities.every((ability: any) =>
      ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
    expect(Object.values(loaded.cards).filter((card: any) => !LEGACY_IDS.includes(card.id)).every((card: any) => card.mode === 'host_adjudicated')).toBe(true);
  });

  it('registers canonical generated cards, evidence, and source-map entries exactly once', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    expect(generated.masters.find((master: any) => master.id === ROOT)?.capability.status).toBe('HOST_ADJUDICATED');
    expect(generated.cards.filter((card: any) => IDS.includes(card.id))).toHaveLength(5);
    for (const id of IDS) expect(generated.rules.sourceMap[id]).toMatchObject({ archiveId: ROOT });
    expect(evidence.entities.find((entity: any) => entity.entityId === ROOT)?.capabilityStatus).toBe('HOST_ADJUDICATED');
    expect(evidence.entities.filter((entity: any) => IDS.includes(entity.entityId))).toHaveLength(5);
    for (const id of IDS) expect(generated.rules.cards[id].mode).toBe('host_adjudicated');
    expect(generated.rules.cards['master.shinji.skill.s1'].abilities.map((ability: any) => ability.id))
      .not.toContain('drain-command.enter-miyama');
    expect(generated.rules.cards['master.shinji.skill.s3'].abilities.map((ability: any) => ability.id))
      .not.toContain('clown.lose-command-seal');
    expect(generated.rules.cards['master.shinji.skill.drain-command'].mode).toBe('automatic');
    expect(generated.rules.cards['master.shinji.skill.clown'].mode).toBe('automatic');
  });

  it('keeps canonical initial Shinji skills host-only while explicit legacy instances remain automatic', () => {
    const session = createMatchSession({
      seed: seedIncludingMaster(ROOT, 'p1'),
      humanPlayerId: 'p1',
      humanPlayerIds: ['p1'],
    });
    const owned = session.state.cards.filter((card) => card.ownerPlayerId === 'p1');
    expect(owned.find((card) => card.definitionId === `${ROOT}.skill.s1`)).toBeDefined();
    expect(owned.find((card) => card.definitionId === `${ROOT}.skill.s3`)).toBeDefined();
    expect(owned.find((card) => card.definitionId === `${ROOT}.skill.drain-command`)).toBeUndefined();
    expect(owned.find((card) => card.definitionId === `${ROOT}.skill.clown`)).toBeUndefined();
    const entered = rules.collectTriggeredAbilities(session.state, {
      id: 'shinji-compat-enter',
      type: 'after_controller_enters_location',
      playerId: 'p1',
      locationId: 'miyama_town',
    });
    expect(entered.filter((ability) => ability.abilityId === 'drain-command.enter-miyama')).toHaveLength(0);
    expect(entered.some((ability) => ability.abilityId === 'shinji.enter-miyama-gain-mana')).toBe(false);

    session.state.cards.push({
      instanceId: 'p1-explicit-legacy-drain',
      definitionId: `${ROOT}.skill.drain-command`,
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    const legacyEntered = rules.collectTriggeredAbilities(session.state, {
      id: 'shinji-explicit-legacy-enter',
      type: 'after_controller_enters_location',
      playerId: 'p1',
      locationId: 'miyama_town',
    });
    expect(legacyEntered.filter((ability) => ability.abilityId === 'drain-command.enter-miyama')).toHaveLength(1);
  });
});
