import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';

const ROOT = 'master.maiya';
const IDS = ['ascension', 's1', 's2'].map((skill) => `${ROOT}.skill.${skill}`);
const PATH = 'data/authoring/masters/master.maiya.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

describe('P3 Maiya owner migration boundary', () => {
  it('materializes canonical identities and preserves exact text/source SHA evidence', () => {
    expect(archive.id).toBe(ROOT);
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    expect(archive.cards.map((card: any) => card.id)).toEqual(IDS);
    const rows = [...inventory.staticSkills, ...inventory.dynamicSkills].filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(rows).toHaveLength(3);
    for (const entry of rows) {
      const card = archive.cards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId])
        .toBe(`legacy-content.json#master/master.maiya/${entry.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of entry.clauses) expect(archive.sourcePolicy.sourceLocators.generated[entry.canonicalAbilityId]).toContain(`sha256=${clause.source.sha256}`);
    }
  });

  it('keeps all canonical semantics host-adjudicated and blocks handler execution', () => {
    expect(loaded.report.filter((entry) => entry.path === 'verification.implementationStatus').map((entry) => entry.cardId).sort()).toEqual(IDS.sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported').map((entry) => entry.cardId).sort()).toEqual(IDS.sort());
    for (const id of IDS) expect(loaded.cards[id]!.mode).toBe('host_adjudicated');
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) => ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
  });

  it('preserves the old excluded-card and identity mapping evidence', () => {
    expect(archive.sourcePolicy.legacyArchiveEvidence.excludedCards).toEqual([{ id: 'master.maiya.skill.ascension', name: '甜品狂热者', reason: 'user_scope_excluded_ascension' }]);
    expect(archive.sourcePolicy.legacyArchiveEvidence.legacyIdentities).toEqual({ 'master.maiya.skill.s1': 'master.maiya.skill.military', 'master.maiya.skill.s2': 'master.maiya.deck.support-shot' });
  });

  it('registers the canonical archive exactly once in the master pack', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
  });
});
