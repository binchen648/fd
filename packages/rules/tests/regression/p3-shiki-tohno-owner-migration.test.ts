import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';

const ROOT = 'master.shiki-tohno';
const IDS = ['ascension', 's1', 's1a', 's2', 's3', 's4'].map((skill) => `${ROOT}.skill.${skill}`);
const PATH = 'data/authoring/masters/master.shiki-tohno.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const generated = JSON.parse(readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8')) as any;
const evidence = JSON.parse(readFileSync('data/generated/fd-playtest-v1.evidence-report.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

describe('P3 Shiki Tohno owner migration boundary', () => {
  it('preserves exactly six canonical cards, exact text, legacy locators, and all nine clause hashes', () => {
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    expect(archive.cards.map((card: any) => card.id)).toEqual(IDS);
    const rows = [...inventory.staticSkills, ...inventory.dynamicSkills]
      .filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(rows).toHaveLength(6);
    let clauseCount = 0;
    for (const entry of rows) {
      const card = archive.cards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId])
        .toBe(`legacy-content.json#master/master.shiki-tohno/${entry.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of entry.clauses) {
        clauseCount += 1;
        expect(archive.sourcePolicy.sourceLocators.generated[entry.canonicalAbilityId])
          .toContain(`sha256=${clause.source.sha256}`);
      }
    }
    expect(clauseCount).toBe(9);
    const s2 = archive.cards.find((card: any) => card.id === `${ROOT}.skill.s2`);
    expect(s2.cardFace).toMatchObject({ typeLabel: '迅捷', attributes: ['迅捷'], cost: 1, requirement: 1, basePower: 4 });
    expect(s2.abilities[0]).toMatchObject({ kind: 'phase_action', activation: { phase: 'combat', opens: 'controller_combat_action_window' } });
  });

  it('keeps both shared handler boundaries reference-only and host-adjudicated', () => {
    for (const handler of [
      'core.tohno-shiki-possession (shared_handler)',
      'core.game-start-add-skill (shared_handler)',
    ]) expect(archive.sourcePolicy.note).toContain(handler);
    expect(archive.sourcePolicy.note).toMatch(/reference handler/);
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) => ability.execution.mode === 'host_adjudicated'))).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) => ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
    expect(Object.values(loaded.cards).every((card: any) => card.mode === 'host_adjudicated')).toBe(true);
  });

  it('registers the canonical archive once and emits generated evidence/source-map metadata', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    expect(pack.authoringMasterFiles.at(-1)).toBe(PATH);
    expect(generated.masters.find((master: any) => master.id === ROOT)?.capability.status).toBe('HOST_ADJUDICATED');
    expect(generated.cards.filter((card: any) => IDS.includes(card.id))).toHaveLength(6);
    for (const id of IDS) expect(generated.rules.sourceMap[id]).toMatchObject({ archiveId: ROOT });
    expect(evidence.entities.find((entity: any) => entity.entityId === ROOT)?.capabilityStatus).toBe('HOST_ADJUDICATED');
  });
});
