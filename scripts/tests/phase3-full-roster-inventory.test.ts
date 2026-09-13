import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  assertOutputOutsideReference,
  buildFullRosterInventory,
  buildFullRosterInventoryFromSourceData,
  serializeFullRosterInventory,
  type FullRosterSourceData,
} from '../phase3-reference/build-full-roster-inventory';
import { assertFullRosterInventory } from '../phase3-reference/inventory-schema';

const committedInventoryPath = resolve('data/phase3/full-roster-ability-inventory.json');
const temporaryDirectories: string[] = [];

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function createExecutableReferenceFixture() {
  const root = mkdtempSync(join(tmpdir(), 'fd-phase3-intake-reference-'));
  temporaryDirectories.push(root);
  const repository = 'https://github.com/example/intake-reference.git';

  git(root, 'init');
  git(root, 'config', 'user.email', 'phase3-test@example.invalid');
  git(root, 'config', 'user.name', 'Phase 3 Test');
  git(root, 'remote', 'add', 'origin', repository);

  const skills = Array.from({ length: 943 }, (_, index) => {
    const suffix = String(index + 1).padStart(3, '0');
    return {
      id: `master.fixture.skill.s${suffix}`,
      name: `Fixture ${suffix}`,
      text: `Fixture printed text ${suffix}`,
      sourceRefs: [],
    };
  });

  writeJson(root, 'docs/skill-audit.json', {
    staticSkillCount: 943,
    runtimeSkillCount: 944,
    dynamicRuntimeSkills: ['master.fixture.card.dynamic'],
  });
  writeJson(root, 'docs/skill-rule-programs.json', {
    totalSkills: 943,
    programs: skills.map((skill) => ({ skillId: skill.id, resolution: 'deterministic', nodes: [] })),
  });
  writeJson(root, 'src/content/authoring/cards.json', { skillCards: [] });
  writeJson(root, 'src/content/generated/legacy-content.json', {
    masters: [{ id: 'master.fixture', name: 'Fixture Master', skills }],
    servants: [],
  });

  const dependencyPath = join(root, 'src/content/override-dependency.ts');
  mkdirSync(dirname(dependencyPath), { recursive: true });
  writeFileSync(dependencyPath, 'export const fixtureOverride = {};\n', 'utf8');
  writeFileSync(
    join(root, 'src/content/confirmed-skill-overrides.ts'),
    "import { fixtureOverride } from './override-dependency.ts';\nexport const confirmedSkillOverrides = { 'master.fixture.skill.s001': fixtureOverride };\n",
    'utf8',
  );

  git(root, 'add', '.');
  git(root, 'commit', '-m', 'intake fixture');

  return {
    root,
    lock: {
      repository,
      commit: git(root, 'rev-parse', 'HEAD'),
      requiredFiles: [
        'docs/skill-audit.json',
        'docs/skill-rule-programs.json',
        'src/content/confirmed-skill-overrides.ts',
        'src/content/authoring/cards.json',
        'src/content/generated/legacy-content.json',
      ],
    },
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

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
        'docs/skill-audit.json',
        'docs/skill-rule-programs.json',
        'src/content/confirmed-skill-overrides.ts',
        'src/content/authoring/cards.json',
        'src/content/generated/legacy-content.json',
      ],
      inputDigests: {
        'docs/skill-audit.json': 'e'.repeat(64),
        'docs/skill-rule-programs.json': 'a'.repeat(64),
        'src/content/confirmed-skill-overrides.ts': 'b'.repeat(64),
        'src/content/authoring/cards.json': 'c'.repeat(64),
        'src/content/generated/legacy-content.json': 'd'.repeat(64),
      },
    },
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
  it('a checkout that passes FS00 verification is directly consumable by FS01 intake', async () => {
    const { root, lock } = createExecutableReferenceFixture();

    const inventory = await buildFullRosterInventory(root, lock);

    expect(inventory.summary.staticSkillCount).toBe(943);
    expect(inventory.summary.dynamicSkillCount).toBe(1);
    expect(inventory.provenance.inputDigests['src/content/override-dependency.ts']).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects output at the Reference root or any direct child', () => {
    const root = mkdtempSync(join(tmpdir(), 'fd-phase3-output-guard-'));
    temporaryDirectories.push(root);

    expect(() => assertOutputOutsideReference(root, root)).toThrow(/read-only reference/i);
    expect(() => assertOutputOutsideReference(root, join(root, 'output.json'))).toThrow(/read-only reference/i);
    expect(() => assertOutputOutsideReference(root, join(dirname(root), 'outside.json'))).not.toThrow();
  });

  it.runIf(process.platform === 'win32')('rejects Windows path casing variants that resolve inside Reference', () => {
    const root = mkdtempSync(join(tmpdir(), 'fd-phase3-output-case-'));
    temporaryDirectories.push(root);
    const caseVariant = root.replace(/[A-Za-z]/, (value) =>
      value === value.toLowerCase() ? value.toUpperCase() : value.toLowerCase(),
    );

    expect(() => assertOutputOutsideReference(root, join(caseVariant, 'output.json'))).toThrow(/read-only reference/i);
  });

  it('rejects output through a junction or symlink that resolves inside Reference', () => {
    const parent = mkdtempSync(join(tmpdir(), 'fd-phase3-output-link-'));
    temporaryDirectories.push(parent);
    const root = join(parent, 'reference');
    const alias = join(parent, 'reference-alias');
    mkdirSync(root, { recursive: true });
    symlinkSync(root, alias, process.platform === 'win32' ? 'junction' : 'dir');

    expect(() => assertOutputOutsideReference(root, join(alias, 'output.json'))).toThrow(/read-only reference/i);
  });

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
