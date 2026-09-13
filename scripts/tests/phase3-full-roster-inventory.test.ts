import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildFullRosterInventoryFromSourceData,
  serializeFullRosterInventory,
  type FullRosterSourceData,
} from '../phase3-reference/build-full-roster-inventory';
import { assertFullRosterInventory } from '../phase3-reference/inventory-schema';

const committedInventoryPath = resolve('data/phase3/full-roster-ability-inventory.json');

function makeSyntheticSourceData(): FullRosterSourceData {
  const skills = Array.from({ length: 943 }, (_, index) => {
    const suffix = String(index + 1).padStart(3, '0');
    return {
      id: `master.fixture.skill.s${suffix}`,
      legacyId: `s${suffix}`,
      name: `Fixture ${suffix}`,
      text: `Fixture printed text ${suffix}`,
      sourceRefs: [
        {
          kind: 'fixture',
          document: 'fixture.json',
          locator: `master.fixture/s${suffix}`,
        },
      ],
    };
  });

  return {
    verifiedReference: {
      repository: 'https://github.com/example/reference.git',
      commit: '1111111111111111111111111111111111111111',
      requiredFiles: [
        'docs/skill-rule-programs.json',
        'src/content/confirmed-skill-overrides.ts',
        'src/content/authoring/cards.json',
        'src/content/generated/legacy-content.json',
      ],
      inputDigests: {
        'docs/skill-rule-programs.json': 'a'.repeat(64),
        'src/content/confirmed-skill-overrides.ts': 'b'.repeat(64),
        'src/content/authoring/cards.json': 'c'.repeat(64),
        'src/content/generated/legacy-content.json': 'd'.repeat(64),
      },
    },
    auditDigest: 'e'.repeat(64),
    owners: [
      {
        ownerType: 'master',
        ownerId: 'master.fixture',
        ownerName: 'Fixture Master',
        skills,
      },
    ],
    programs: skills.map((skill, index) => ({
      skillId: skill.id,
      resolution: index < 2 ? 'deterministic' : 'handler',
      nodes:
        index < 2
          ? [{ kind: 'effect' }]
          : [{ kind: 'handler', handlerId: `core.fixture-${index % 7}` }],
    })),
    authoringSkillIds: skills.slice(0, 72).map((skill) => skill.id),
    confirmedOverrideSkillIds: skills.map((skill) => skill.id),
    dynamicSkillIds: ['master.fixture.card.dynamic'],
  };
}

describe('Phase 3 full-roster identity inventory', () => {
  it('the checked-in Reference inventory accounts for 943 unique static skills and one separate dynamic skill', () => {
    const inventory = JSON.parse(readFileSync(committedInventoryPath, 'utf8'));

    assertFullRosterInventory(inventory);

    expect(inventory.staticSkills).toHaveLength(943);
    expect(new Set(inventory.staticSkills.map((entry: { reference: { skillId: string } }) => entry.reference.skillId)).size).toBe(943);
    expect(new Set(inventory.staticSkills.map((entry: { canonicalAbilityId: string }) => entry.canonicalAbilityId)).size).toBe(943);
    expect(new Set(inventory.staticSkills.map((entry: { canonicalCardId: string }) => entry.canonicalCardId)).size).toBe(943);
    expect(inventory.dynamicSkills).toHaveLength(1);
    expect(inventory.dynamicSkills[0].reference.skillId).toBe('master.tiamat.card.life-sea');
    expect(inventory.staticSkills.some((entry: { reference: { skillId: string } }) => entry.reference.skillId === inventory.dynamicSkills[0].reference.skillId)).toBe(false);
  });

  it('uses the stable Reference skill ID directly instead of fabricating canonical IDs', () => {
    const inventory = JSON.parse(readFileSync(committedInventoryPath, 'utf8'));

    for (const entry of [...inventory.staticSkills, ...inventory.dynamicSkills]) {
      expect(entry.canonicalAbilityId).toBe(entry.reference.skillId);
      expect(entry.canonicalCardId).toBe(entry.reference.skillId);
      expect(entry.ownerId).toMatch(/^(master|servant)\./);
    }
  });

  it('is deterministically ordered and serializes identically across two builds', () => {
    const sourceData = makeSyntheticSourceData();
    const first = buildFullRosterInventoryFromSourceData(sourceData);
    const second = buildFullRosterInventoryFromSourceData(sourceData);

    expect(serializeFullRosterInventory(first)).toBe(serializeFullRosterInventory(second));
    expect(first.staticSkills.map((entry) => entry.reference.skillId)).toEqual(
      [...first.staticSkills.map((entry) => entry.reference.skillId)].sort(),
    );
    expect(first.staticSkills).toHaveLength(943);
    expect(first.dynamicSkills).toHaveLength(1);
  });

  it('rejects silent omissions and duplicate static identities', () => {
    const omitted = makeSyntheticSourceData();
    omitted.programs = omitted.programs.slice(1);
    expect(() => buildFullRosterInventoryFromSourceData(omitted)).toThrow(/static identity mismatch/i);

    const duplicated = makeSyntheticSourceData();
    duplicated.owners[0].skills.push({ ...duplicated.owners[0].skills[0] });
    expect(() => buildFullRosterInventoryFromSourceData(duplicated)).toThrow(/duplicate/i);
  });
});
