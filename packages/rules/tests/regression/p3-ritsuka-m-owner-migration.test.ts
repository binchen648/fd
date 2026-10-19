import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';

const ROOT = 'master.ritsuka-m';
const IDS = ['ascension', 's1', 's2'].map((skill) => `${ROOT}.skill.${skill}`);
const PATH = 'data/authoring/masters/master.ritsuka-m.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

describe('P3 Ritsuka-M owner migration boundary', () => {
  it('materializes exactly three canonical identities and preserves exact text/source SHA evidence', () => {
    expect(archive.id).toBe(ROOT);
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    expect(archive.cards.map((card: any) => card.id)).toEqual(IDS);
    const rows = [...inventory.staticSkills, ...inventory.dynamicSkills].filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(rows).toHaveLength(3);
    for (const entry of rows) {
      const card = archive.cards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId]).toBe(`legacy-content.json#master/master.ritsuka-m/${entry.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of entry.clauses) expect(archive.sourcePolicy.sourceLocators.generated[entry.canonicalAbilityId]).toContain(`sha256=${clause.source.sha256}`);
    }
  });

  it('keeps all unresolved semantics host-adjudicated and reference-only', () => {
    expect(loaded.report.filter((entry) => entry.path === 'verification.implementationStatus').map((entry) => entry.cardId).sort()).toEqual(IDS.sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported').map((entry) => entry.cardId).sort()).toEqual(IDS.sort());
    for (const id of IDS) expect(loaded.cards[id]!.mode).toBe('host_adjudicated');
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) => ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) => ability.execution.mode === 'host_adjudicated'))).toBe(true);
    expect(archive.sourcePolicy.note).toMatch(/HOST_ADJUDICATED/);
    expect(archive.sourcePolicy.note).toMatch(/reference-only/);
  });

  it('registers the canonical archive exactly once at the end of the master pack', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    expect(pack.authoringMasterFiles.at(-1)).toBe(PATH);
    const generated = JSON.parse(readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8')) as any;
    expect(generated.cards.find((card: any) => card.id === 'master.ritsuka-m.overview')?.capability.status).toBe('HOST_ADJUDICATED');
  });
});
