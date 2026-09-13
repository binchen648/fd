import { createHash } from 'node:crypto';
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

  const authoringCards = [
    {
      id: skills[0].id,
      printedText: [
        '选择一项：获得1点魔力。',
        '当战斗结束后，抽一张牌。',
        '残留：持续至回合结束。',
        '生成一张衍生牌并将其加入技能区。',
      ].join('\n'),
      abilities: [
        { id: 'fixture.choice', printedClause: '选择一项：获得1点魔力。' },
        { id: 'fixture.trigger', printedClause: '当战斗结束后，抽一张牌。' },
        { id: 'fixture.lifecycle', printedClause: '残留：持续至回合结束。' },
        { id: 'fixture.derived-card', printedClause: '生成一张衍生牌并将其加入技能区。' },
      ],
    },
  ];
  skills[0].text = authoringCards[0].printedText;
  skills[1].text = '第一行原文。\n第二行原文。';

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
    authoringCards,
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

  it('preserves every static printed text as provenance-bearing clauses or an explicit source-evidence block', () => {
    const inventory = JSON.parse(readFileSync(committedInventoryPath, 'utf8'));

    assertFullRosterInventory(inventory);
    for (const entry of inventory.staticSkills) {
      const hasClauses = Array.isArray(entry.clauses) && entry.clauses.length > 0;
      expect(hasClauses || entry.blockedBy.includes('SOURCE_EVIDENCE_REQUIRED')).toBe(true);

      for (const clause of entry.clauses ?? []) {
        expect(clause.text.length).toBeGreaterThan(0);
        expect(clause.source.document.length).toBeGreaterThan(0);
        expect(clause.source.locator.length).toBeGreaterThan(0);
        expect(clause.source.sha256).toBe(createHash('sha256').update(clause.text).digest('hex'));
      }
    }
  });

  it('prefers V2 printedClause records and keeps choice, trigger, lifecycle, and derived-card text source-grounded', () => {
    const inventory = buildFullRosterInventoryFromSourceData(makeSyntheticSourceData());
    const entry = inventory.staticSkills.find((candidate) => candidate.reference.skillId === 'master.fixture.skill.s001');

    expect(entry?.clauses).toHaveLength(4);
    expect(entry?.clauses.map((clause) => clause.text)).toEqual([
      '选择一项：获得1点魔力。',
      '当战斗结束后，抽一张牌。',
      '残留：持续至回合结束。',
      '生成一张衍生牌并将其加入技能区。',
    ]);
    expect(entry?.clauses.every((clause) => clause.classification === 'SOURCE_GROUNDED')).toBe(true);
    expect(entry?.clauses.every((clause) => clause.derivation === 'v2_printed_clause')).toBe(true);
    expect(entry?.clauses[0].source.locator).toContain('abilities[0].printedClause');
  });

  it('uses only explicit line boundaries for mechanical clause discovery instead of guessing semantics from punctuation', () => {
    const inventory = buildFullRosterInventoryFromSourceData(makeSyntheticSourceData());
    const entry = inventory.staticSkills.find((candidate) => candidate.reference.skillId === 'master.fixture.skill.s002');

    expect(entry?.clauses.map((clause) => clause.text)).toEqual(['第一行原文。', '第二行原文。']);
    expect(entry?.clauses.every((clause) => clause.classification === 'DISCOVERED')).toBe(true);
    expect(entry?.clauses.every((clause) => clause.derivation === 'mechanical_line_split')).toBe(true);
  });

  it('marks the known dynamic identity as source-evidence blocked when no printed text exists', () => {
    const inventory = buildFullRosterInventoryFromSourceData(makeSyntheticSourceData());

    expect(inventory.dynamicSkills[0].clauses).toEqual([]);
    expect(inventory.dynamicSkills[0].blockedBy).toContain('SOURCE_EVIDENCE_REQUIRED');
  });
});
