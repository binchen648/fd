import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';

const ROOT = 'master.kiara';
const IDS = ['ascension', 's1', 's1a', 's2', 's3', 's4', 's5', 's6'].map((skill) => `${ROOT}.skill.${skill}`);
const PATH = 'data/authoring/masters/master.kiara.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

describe('P3 Kiara owner migration boundary', () => {
  it('materializes exactly the eight frozen identities and preserves full inventory text/source evidence', () => {
    expect(archive.id).toBe(ROOT);
    expect(archive.cards.map((card: any) => card.id)).toEqual(IDS);
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    const rows = [...inventory.staticSkills, ...inventory.dynamicSkills].filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(rows).toHaveLength(8);
    for (const entry of rows) {
      const card = archive.cards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId]).toBe(`legacy-content.json#master/master.kiara/${entry.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of entry.clauses) expect(archive.sourcePolicy.sourceLocators.generated[entry.canonicalAbilityId]).toContain(`sha256=${clause.source.sha256}`);
    }
  });

  it('keeps every frozen skill host-adjudicated and directive-only', () => {
    expect(loaded.report.filter((entry) => entry.path === 'verification.implementationStatus').map((entry) => entry.cardId).sort()).toEqual(IDS.sort());
    for (const id of IDS) expect(loaded.cards[id]!.mode).toBe('host_adjudicated');
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) => ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
  });

  it('documents the unsupported dynamic and multi-stage boundaries', () => {
    expect(archive.sourcePolicy.note).toMatch(/秘密花园随机暗置\/展示/);
    expect(archive.sourcePolicy.note).toMatch(/多阶段天堂之孔/);
    expect(archive.sourcePolicy.note).toMatch(/事件替换/);
    expect(archive.sourcePolicy.note).toMatch(/抽牌\/手牌限制/);
    expect(archive.sourcePolicy.note).toMatch(/败北强制/);
    expect(archive.sourcePolicy.note).toMatch(/动态技能区/);
    expect(archive.sourcePolicy.note).toMatch(/HOST_ADJUDICATED/);
  });

  it('registers Kiara exactly once at the end of the canonical master pack', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    expect(pack.authoringMasterFiles.at(-1)).toBe(PATH);
  });
});
