import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';

const ROOT = 'master.sakura';
const IDS = ['ascension', 's1', 's2', 's3', 's4'].map((skill) => `${ROOT}.skill.${skill}`);
const PATH = 'data/authoring/masters/master.sakura.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

describe('P3 Sakura owner migration boundary', () => {
  it('materializes all canonical identities and preserves exact text, locators, and all five source hashes', () => {
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    expect(archive.cards.map((card: any) => card.id)).toEqual(IDS);
    const rows = [...inventory.staticSkills, ...inventory.dynamicSkills].filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(rows).toHaveLength(5);
    let clauseCount = 0;
    for (const entry of rows) {
      const card = archive.cards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId]).toBe(`legacy-content.json#master/master.sakura/${entry.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of entry.clauses) {
        clauseCount += 1;
        expect(archive.sourcePolicy.sourceLocators.generated[entry.canonicalAbilityId]).toContain(`sha256=${clause.source.sha256}`);
      }
    }
    expect(clauseCount).toBe(5);
  });

  it('keeps specific/shared handler boundaries reference-only and host-adjudicated', () => {
    expect(archive.sourcePolicy.note).toMatch(/core\.sakura-corrosion \(specific_handler\)/);
    expect(archive.sourcePolicy.note).toMatch(/core\.sakura-corrupted-grail-trigger \(shared_handler\)/);
    expect(archive.sourcePolicy.note).toMatch(/core\.sakura-black-mud \(specific_handler\)/);
    expect(archive.sourcePolicy.note).toMatch(/core\.rule-marker \(shared_handler\)/);
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) => ability.execution.mode === 'host_adjudicated'))).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) => ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
    expect(Object.values(loaded.cards).every((card: any) => card.mode === 'host_adjudicated')).toBe(true);
  });

  it('registers the canonical archive exactly once in the master pack', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    expect(pack.authoringMasterFiles.at(-1)).toBe(PATH);
  });
});
