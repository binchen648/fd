import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  assertFullRosterInventory,
  type FullRosterAbilityInventory,
  type InventoryClauseRecord,
  type InventoryOwnerType,
  type InventorySourceRef,
  type ReferenceExecutionRoute,
} from './inventory-schema';
import { verifyReferenceRoot, type VerifiedReference } from './verify-reference';

const AUDIT_PATH = 'docs/skill-audit.json';
const PROGRAMS_PATH = 'docs/skill-rule-programs.json';
const AUTHORING_CARDS_PATH = 'src/content/authoring/cards.json';
const OVERRIDES_PATH = 'src/content/confirmed-skill-overrides.ts';
const LEGACY_CONTENT_PATH = 'src/content/generated/legacy-content.json';

export interface FullRosterSourceSkill {
  id: string;
  legacyId?: string;
  name: string;
  text: string;
  clauses?: Array<string | { text?: string; printedClause?: string }>;
  sourceLocator?: string;
  sourceRefs: InventorySourceRef[];
}

export interface FullRosterAuthoringCardSource {
  id: string;
  printedText: string;
  sourceIndex?: number;
  abilities: Array<{
    id: string;
    printedClause: string;
  }>;
}

export interface FullRosterSourceOwner {
  ownerType: InventoryOwnerType;
  ownerId: string;
  ownerName: string;
  skills: FullRosterSourceSkill[];
}

export interface FullRosterProgramSource {
  skillId: string;
  resolution: 'handler' | 'deterministic';
  nodes: Array<{
    kind: string;
    handlerId?: string;
  }>;
}

export interface FullRosterSourceData {
  verifiedReference: VerifiedReference;
  auditDigest: string;
  owners: FullRosterSourceOwner[];
  programs: FullRosterProgramSource[];
  authoringSkillIds: string[];
  authoringCards?: FullRosterAuthoringCardSource[];
  confirmedOverrideSkillIds: string[];
  dynamicSkillIds: string[];
}

interface LegacyContentFile {
  masters: Array<{
    id: string;
    name: string;
    skills: FullRosterSourceSkill[];
  }>;
  servants: Array<{
    id: string;
    name: string;
    skills: FullRosterSourceSkill[];
  }>;
}

interface SkillProgramsFile {
  totalSkills: number;
  programs: FullRosterProgramSource[];
}

interface AuthoringCardsFile {
  skillCards: Array<{
    id: string;
    printedText: string;
    abilities: Array<{
      id: string;
      printedClause: string;
    }>;
  }>;
}

interface SkillAuditFile {
  staticSkillCount: number;
  runtimeSkillCount: number;
  dynamicRuntimeSkills: string[];
}

function compareIds(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function sha256Text(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function assertUnique(values: string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Duplicate ${label}: ${value}`);
    }
    seen.add(value);
  }
}

function assertSubset(values: string[], allowed: Set<string>, label: string): void {
  const unknown = values.filter((value) => !allowed.has(value));
  if (unknown.length > 0) {
    throw new Error(`${label} contains identities outside the 943 static roster: ${unknown.slice(0, 5).join(', ')}`);
  }
}

function staticIdentityMismatch(skillIds: string[], programIds: string[]): never {
  const skillSet = new Set(skillIds);
  const programSet = new Set(programIds);
  const missingPrograms = skillIds.filter((id) => !programSet.has(id));
  const missingSkills = programIds.filter((id) => !skillSet.has(id));
  throw new Error(
    `Static identity mismatch between legacy-content and skill-rule-programs; ` +
      `missingPrograms=${missingPrograms.slice(0, 5).join(',') || 'none'}; ` +
      `missingSkills=${missingSkills.slice(0, 5).join(',') || 'none'}`,
  );
}

function handlerIdFor(program: FullRosterProgramSource): string | undefined {
  const handlerIds = program.nodes
    .filter((node) => node.kind === 'handler')
    .map((node) => node.handlerId)
    .filter((handlerId): handlerId is string => typeof handlerId === 'string' && handlerId.length > 0);

  if (program.resolution === 'handler') {
    if (handlerIds.length !== 1) {
      throw new Error(`Handler program ${program.skillId} must expose exactly one structured handlerId.`);
    }
    return handlerIds[0];
  }

  if (handlerIds.length > 0) {
    throw new Error(`Deterministic program ${program.skillId} unexpectedly exposes a handlerId.`);
  }
  return undefined;
}

function referenceExecutionRoute(
  program: FullRosterProgramSource,
  handlerId: string | undefined,
  handlerUseCounts: Map<string, number>,
): ReferenceExecutionRoute {
  if (program.resolution === 'deterministic') return 'deterministic';
  if (!handlerId) throw new Error(`Missing handler identity for ${program.skillId}.`);
  return (handlerUseCounts.get(handlerId) ?? 0) > 1 ? 'shared_handler' : 'specific_handler';
}

function structuredClauseText(clause: string | { text?: string; printedClause?: string }): string | undefined {
  if (typeof clause === 'string') return clause.length > 0 ? clause : undefined;
  if (typeof clause.printedClause === 'string' && clause.printedClause.length > 0) return clause.printedClause;
  if (typeof clause.text === 'string' && clause.text.length > 0) return clause.text;
  return undefined;
}

function sourceLocatorFor(skill: FullRosterSourceSkill, owner: FullRosterSourceOwner): string {
  return skill.sourceLocator ?? `${owner.ownerType}s[${owner.ownerId}].skills[${skill.id}].text`;
}

function buildClauseRecords(
  owner: FullRosterSourceOwner,
  skill: FullRosterSourceSkill,
  authoringCard: FullRosterAuthoringCardSource | undefined,
): InventoryClauseRecord[] {
  if (Array.isArray(skill.clauses) && skill.clauses.length > 0) {
    return skill.clauses.flatMap((clause, index) => {
      const text = structuredClauseText(clause);
      if (!text) return [];
      return [{
        text,
        classification: 'SOURCE_GROUNDED' as const,
        derivation: 'reference_structured_clause' as const,
        source: {
          document: LEGACY_CONTENT_PATH,
          locator: `${sourceLocatorFor(skill, owner)}.clauses[${index}]`,
          sha256: sha256Text(text),
        },
      }];
    });
  }

  if (authoringCard) {
    if (authoringCard.printedText !== skill.text) {
      throw new Error(`Authoring printedText does not match legacy printed text for ${skill.id}.`);
    }
    const cardIndex = authoringCard.sourceIndex ?? 0;
    const structured = authoringCard.abilities.flatMap((ability, abilityIndex) => {
      if (typeof ability.printedClause !== 'string' || ability.printedClause.length === 0) return [];
      return [{
        text: ability.printedClause,
        classification: 'SOURCE_GROUNDED' as const,
        derivation: 'v2_printed_clause' as const,
        sourceAbilityId: ability.id,
        source: {
          document: AUTHORING_CARDS_PATH,
          locator: `skillCards[${cardIndex}].abilities[${abilityIndex}].printedClause`,
          sha256: sha256Text(ability.printedClause),
        },
      }];
    });
    if (structured.length > 0) return structured;
  }

  return skill.text
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line, lineIndex) => ({
      text: line,
      classification: 'DISCOVERED' as const,
      derivation: 'mechanical_line_split' as const,
      source: {
        document: LEGACY_CONTENT_PATH,
        locator: `${sourceLocatorFor(skill, owner)}#line=${lineIndex + 1}`,
        sha256: sha256Text(line),
      },
    }));
}

export function buildFullRosterInventoryFromSourceData(sourceData: FullRosterSourceData): FullRosterAbilityInventory {
  const flattenedSkills = sourceData.owners.flatMap((owner) =>
    owner.skills.map((skill) => ({ owner, skill })),
  );
  const staticSkillIds = flattenedSkills.map(({ skill }) => skill.id);
  const programIds = sourceData.programs.map((program) => program.skillId);

  assertUnique(staticSkillIds, 'static skill ID');
  assertUnique(programIds, 'skill-rule program ID');
  assertUnique(sourceData.authoringSkillIds, 'authoring skill-card ID');
  assertUnique(sourceData.confirmedOverrideSkillIds, 'confirmed override skill ID');
  assertUnique(sourceData.dynamicSkillIds, 'dynamic skill ID');

  const staticSet = new Set(staticSkillIds);
  const programSet = new Set(programIds);
  if (
    staticSkillIds.length !== programIds.length ||
    staticSkillIds.some((id) => !programSet.has(id)) ||
    programIds.some((id) => !staticSet.has(id))
  ) {
    staticIdentityMismatch(staticSkillIds, programIds);
  }

  assertSubset(sourceData.authoringSkillIds, staticSet, 'Authoring cards');
  assertSubset(sourceData.confirmedOverrideSkillIds, staticSet, 'Confirmed overrides');

  for (const dynamicId of sourceData.dynamicSkillIds) {
    if (staticSet.has(dynamicId)) {
      throw new Error(`Dynamic skill is duplicated in the static roster: ${dynamicId}`);
    }
  }

  const programsById = new Map(sourceData.programs.map((program) => [program.skillId, program]));
  const authoringSet = new Set(sourceData.authoringSkillIds);
  const authoringCardsById = new Map(
    (sourceData.authoringCards ?? []).map((card) => [card.id, card] as const),
  );
  const overrideSet = new Set(sourceData.confirmedOverrideSkillIds);
  const handlerUseCounts = new Map<string, number>();

  for (const program of sourceData.programs) {
    const handlerId = handlerIdFor(program);
    if (handlerId) {
      handlerUseCounts.set(handlerId, (handlerUseCounts.get(handlerId) ?? 0) + 1);
    }
  }

  const staticSkills = flattenedSkills
    .sort((left, right) => compareIds(left.skill.id, right.skill.id))
    .map(({ owner, skill }) => {
      const program = programsById.get(skill.id);
      if (!program) {
        throw new Error(`Static identity mismatch: no skill-rule program for ${skill.id}`);
      }
      const handlerId = handlerIdFor(program);
      const clauses = buildClauseRecords(owner, skill, authoringCardsById.get(skill.id));
      const blockedBy = clauses.length === 0 ? ['SOURCE_EVIDENCE_REQUIRED'] : [];
      const classification =
        clauses.length > 0 && clauses.every((clause) => clause.classification === 'SOURCE_GROUNDED')
          ? 'SOURCE_GROUNDED' as const
          : 'DISCOVERED' as const;
      const reference = {
        skillId: skill.id,
        ...(skill.legacyId ? { legacySkillId: skill.legacyId } : {}),
        ...(handlerId ? { handlerId } : {}),
        executionRoute: referenceExecutionRoute(program, handlerId, handlerUseCounts),
        hasAuthoringCard: authoringSet.has(skill.id),
        hasConfirmedOverride: overrideSet.has(skill.id),
        dynamic: false as const,
      };

      return {
        canonicalAbilityId: skill.id,
        canonicalCardId: skill.id,
        ownerId: owner.ownerId,
        ownerType: owner.ownerType,
        ownerName: owner.ownerName,
        skillName: skill.name,
        printedText: skill.text,
        clauses,
        sources: skill.sourceRefs.map((source) => ({ ...source })),
        reference,
        classification,
        blockedBy,
      };
    });

  const dynamicSkills = [...sourceData.dynamicSkillIds]
    .sort(compareIds)
    .map((skillId) => {
      const ownerMatches = sourceData.owners.filter(
        (owner) => skillId.startsWith(`${owner.ownerId}.`),
      );
      if (ownerMatches.length !== 1) {
        throw new Error(
          `Dynamic skill ${skillId} must map to exactly one stable roster owner; got ${ownerMatches.length}.`,
        );
      }
      const owner = ownerMatches[0];
      const auditIndex = sourceData.dynamicSkillIds.indexOf(skillId);

      return {
        canonicalAbilityId: skillId,
        canonicalCardId: skillId,
        ownerId: owner.ownerId,
        ownerType: owner.ownerType,
        ownerName: owner.ownerName,
        skillName: null,
        printedText: null,
        clauses: [],
        sources: [
          {
            kind: 'reference-audit',
            document: AUDIT_PATH,
            locator: `dynamicRuntimeSkills[${auditIndex}]`,
          },
        ],
        reference: {
          skillId,
          executionRoute: null,
          hasAuthoringCard: false as const,
          hasConfirmedOverride: false as const,
          dynamic: true as const,
        },
        classification: 'DISCOVERED' as const,
        blockedBy: ['SOURCE_EVIDENCE_REQUIRED'],
      };
    });

  const inventory: FullRosterAbilityInventory = {
    schemaVersion: 1,
    kind: 'phase3-full-roster-ability-inventory',
    provenance: {
      repository: sourceData.verifiedReference.repository,
      commit: sourceData.verifiedReference.commit,
      inputDigests: {
        ...sourceData.verifiedReference.inputDigests,
        [AUDIT_PATH]: sourceData.auditDigest,
      },
    },
    summary: {
      staticSkillCount: staticSkills.length,
      dynamicSkillCount: dynamicSkills.length,
      totalIdentityCount: staticSkills.length + dynamicSkills.length,
      authoringSkillCount: sourceData.authoringSkillIds.length,
      confirmedOverrideSkillCount: sourceData.confirmedOverrideSkillIds.length,
    },
    staticSkills,
    dynamicSkills,
  };

  assertFullRosterInventory(inventory);
  return inventory;
}

async function loadConfirmedOverrideSkillIds(referenceRoot: string): Promise<string[]> {
  const overridePath = resolve(referenceRoot, OVERRIDES_PATH);
  const module = (await import(pathToFileURL(overridePath).href)) as {
    confirmedSkillOverrides?: Record<string, unknown>;
  };
  if (!module.confirmedSkillOverrides || typeof module.confirmedSkillOverrides !== 'object') {
    throw new Error('Reference confirmed-skill-overrides.ts did not export confirmedSkillOverrides.');
  }
  return Object.keys(module.confirmedSkillOverrides);
}

export async function loadFullRosterSourceData(referenceRoot: string): Promise<FullRosterSourceData> {
  const verifiedReference = verifyReferenceRoot(referenceRoot);
  const legacy = readJson<LegacyContentFile>(resolve(referenceRoot, LEGACY_CONTENT_PATH));
  const programFile = readJson<SkillProgramsFile>(resolve(referenceRoot, PROGRAMS_PATH));
  const authoringCards = readJson<AuthoringCardsFile>(resolve(referenceRoot, AUTHORING_CARDS_PATH));
  const audit = readJson<SkillAuditFile>(resolve(referenceRoot, AUDIT_PATH));
  const confirmedOverrideSkillIds = await loadConfirmedOverrideSkillIds(referenceRoot);

  if (!Array.isArray(legacy.masters) || !Array.isArray(legacy.servants)) {
    throw new Error('Reference legacy-content.json is missing master/servant roster arrays.');
  }
  if (!Array.isArray(programFile.programs) || programFile.totalSkills !== programFile.programs.length) {
    throw new Error('Reference skill-rule-programs.json has an inconsistent totalSkills count.');
  }
  if (!Array.isArray(authoringCards.skillCards)) {
    throw new Error('Reference authoring cards.json is missing skillCards.');
  }
  for (const [cardIndex, card] of authoringCards.skillCards.entries()) {
    if (typeof card.printedText !== 'string' || !Array.isArray(card.abilities)) {
      throw new Error(`Reference authoring card at index ${cardIndex} is missing printedText or abilities.`);
    }
    for (const [abilityIndex, ability] of card.abilities.entries()) {
      if (
        typeof ability.id !== 'string' ||
        ability.id.length === 0 ||
        typeof ability.printedClause !== 'string' ||
        ability.printedClause.length === 0
      ) {
        throw new Error(`Reference authoring card ${card.id} has an invalid ability at index ${abilityIndex}.`);
      }
    }
  }
  if (!Array.isArray(audit.dynamicRuntimeSkills)) {
    throw new Error('Reference skill-audit.json is missing dynamicRuntimeSkills.');
  }
  if (audit.staticSkillCount !== programFile.programs.length) {
    throw new Error(
      `Reference audit static count ${audit.staticSkillCount} does not match program count ${programFile.programs.length}.`,
    );
  }
  if (audit.runtimeSkillCount !== audit.staticSkillCount + audit.dynamicRuntimeSkills.length) {
    throw new Error('Reference audit runtime count does not match static + dynamic identities.');
  }

  const owners: FullRosterSourceOwner[] = [
    ...legacy.masters.map((master, masterIndex) => ({
      ownerType: 'master' as const,
      ownerId: master.id,
      ownerName: master.name,
      skills: master.skills.map((skill, skillIndex) => ({
        ...skill,
        sourceLocator: `masters[${masterIndex}].skills[${skillIndex}].text`,
      })),
    })),
    ...legacy.servants.map((servant, servantIndex) => ({
      ownerType: 'servant' as const,
      ownerId: servant.id,
      ownerName: servant.name,
      skills: servant.skills.map((skill, skillIndex) => ({
        ...skill,
        sourceLocator: `servants[${servantIndex}].skills[${skillIndex}].text`,
      })),
    })),
  ];

  return {
    verifiedReference,
    auditDigest: sha256File(resolve(referenceRoot, AUDIT_PATH)),
    owners,
    programs: programFile.programs,
    authoringSkillIds: authoringCards.skillCards.map((card) => card.id),
    authoringCards: authoringCards.skillCards.map((card, sourceIndex) => ({ ...card, sourceIndex })),
    confirmedOverrideSkillIds,
    dynamicSkillIds: audit.dynamicRuntimeSkills,
  };
}

export async function buildFullRosterInventory(referenceRoot: string): Promise<FullRosterAbilityInventory> {
  return buildFullRosterInventoryFromSourceData(await loadFullRosterSourceData(referenceRoot));
}

export function serializeFullRosterInventory(inventory: FullRosterAbilityInventory): string {
  assertFullRosterInventory(inventory);
  return `${JSON.stringify(inventory, null, 2)}\n`;
}

function parseArgument(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (!value || value.startsWith('--')) return undefined;
  return value;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const referenceRootArgument = parseArgument(args, '--reference-root');
  if (!referenceRootArgument) {
    throw new Error('Usage: phase3:reference:intake -- --reference-root <clean-reference-checkout> [--output <inventory.json>]');
  }

  const referenceRoot = resolve(referenceRootArgument);
  const outputPath = resolve(
    parseArgument(args, '--output') ?? 'data/phase3/full-roster-ability-inventory.json',
  );
  const referencePrefix = referenceRoot.endsWith(sep) ? referenceRoot : `${referenceRoot}${sep}`;
  if (outputPath === referenceRoot || outputPath.startsWith(referencePrefix)) {
    throw new Error('Refusing to write generated inventory into the read-only Reference checkout.');
  }

  const inventory = await buildFullRosterInventory(referenceRoot);
  const serialized = serializeFullRosterInventory(inventory);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, 'utf8');

  process.stdout.write(
    `${JSON.stringify(
      {
        repository: inventory.provenance.repository,
        commit: inventory.provenance.commit,
        staticSkills: inventory.summary.staticSkillCount,
        dynamicSkills: inventory.summary.dynamicSkillCount,
        inventorySha256: createHash('sha256').update(serialized).digest('hex'),
      },
      null,
      2,
    )}\n`,
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
const modulePath = resolve(fileURLToPath(import.meta.url));

if (invokedPath === modulePath) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
