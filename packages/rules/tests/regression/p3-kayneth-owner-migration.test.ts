import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';

const ROOT = 'master.kayneth';
const IDS = ['ascension', 's1', 's2', 's3'].map((skill) => `${ROOT}.skill.${skill}`);
const PATH = 'data/authoring/masters/master.kayneth.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

describe('P3 Kayneth owner migration boundary', () => {
  it('materializes the four frozen identities and preserves inventory text/source SHA evidence', () => {
    expect(archive.id).toBe(ROOT);
    expect(archive.cards.slice(0, 4).map((card: any) => card.id)).toEqual(IDS);
    expect(Object.keys(loaded.cards).filter((id) => id.startsWith(ROOT)).sort()).toEqual([...IDS, 'master.kayneth.deck.volumen-hydrargyrum'].sort());
    const rows = [...inventory.staticSkills, ...inventory.dynamicSkills].filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(rows).toHaveLength(4);
    for (const entry of rows) {
      const card = archive.cards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.owner).toEqual({ type: 'master', id: ROOT });
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId]).toBe(`legacy-content.json#master/master.kayneth/${entry.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of entry.clauses) expect(archive.sourcePolicy.sourceLocators.generated[entry.canonicalAbilityId]).toContain(`sha256=${clause.source.sha256}`);
    }
  });

  it('keeps all four owner skills host-adjudicated and records unsupported boundaries', () => {
    expect(archive.cards.slice(0, 4).every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.slice(0, 4).every((card: any) => card.abilities.every((ability: any) => ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
    expect(archive.sourcePolicy.note).toMatch(/攻击牌残留/);
    expect(archive.sourcePolicy.note).toMatch(/从者牌库触发展示重抽/);
    expect(archive.sourcePolicy.note).toMatch(/独立牌库生命周期/);
    expect(archive.sourcePolicy.note).toMatch(/强制部署/);
  });

  it('preserves the existing Volumen deck card evidence and registers the archive once at pack tail', () => {
    const deck = archive.cards.find((card: any) => card.id === 'master.kayneth.deck.volumen-hydrargyrum');
    expect(deck.printedText).toContain('花费2点魔力');
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    expect(pack.authoringMasterFiles.at(-1)).toBe(PATH);
  });
});
