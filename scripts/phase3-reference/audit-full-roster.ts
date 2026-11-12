import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertOutputOutsideReference } from './build-full-roster-inventory';
import { verifyReferenceRoot } from './verify-reference';

const LEGACY_CONTENT_PATH = 'src/content/generated/legacy-content.json';
const AUTHORING_CARDS_PATH = 'src/content/authoring/cards.json';
const PROGRAMS_PATH = 'docs/skill-rule-programs.json';
const AUDIT_PATH = 'docs/skill-audit.json';
const DEFAULT_INVENTORY_PATH = 'data/phase3/full-roster-ability-inventory.json';
const DEFAULT_CATALOG_PATH = 'data/phase3/full-roster-capability-catalog.json';
const DEFAULT_DECISIONS_PATH = 'data/phase3/full-roster-rule-decisions.json';
const DEFAULT_RUNTIME_REQUESTS_PATH = 'data/phase3/full-roster-runtime-capability-requests.json';
const DEFAULT_REPORT_PATH = 'docs/reports/2026-09-15-phase3-full-roster-automation-audit.md';
const DEFAULT_SOURCE_EVIDENCE_OVERLAY_PATH = 'data/phase3/full-roster-source-evidence-overlays.json';

export interface ReferenceAuditExpectedClause {
  text: string;
  derivation: 'reference_structured_clause' | 'v2_printed_clause' | 'mechanical_line_split';
  sourceAbilityId?: string;
  source: { document: string; locator: string; sha256: string };
}

export interface ReferenceAuditStaticSkill {
  id: string;
  ownerId: string;
  ownerType: 'master' | 'servant';
  ownerName: string;
  skillName: string;
  printedText: string;
  sourceRefs: unknown[];
  expectedClauses: ReferenceAuditExpectedClause[];
  authoringAbilityIds: string[];
}

export interface ReferenceAuditSnapshot {
  repository: string;
  commit: string;
  staticSkills: ReferenceAuditStaticSkill[];
  dynamicSkillIds: string[];
  programIds: string[];
  authoringCardIds: string[];
  authoringAbilityCount: number;
  referenceConflicts?: Array<{ code: string; id: string; detail: string }>;
}

export interface AutomationAuditGap { code: string; ids: string[]; detail: string }
export interface AutomationAuditResult {
  status: 'EXACT_AGREEMENT' | 'AUTOMATION_CLASSIFICATION_GAP';
  provenance: { referenceRepository: string; referenceCommit: string };
  recomputed: Record<string, number>;
  categoryCounts: {
    currentRoute: Record<string, number>;
    referenceRoute: Record<string, number>;
    classificationRoute: Record<string, number>;
  };
  gaps: AutomationAuditGap[];
}

function sha256(text: string): string { return createHash('sha256').update(text).digest('hex'); }
function readJson<T>(path: string): T { return JSON.parse(readFileSync(path, 'utf8')) as T; }
function sorted(values: string[]): string[] { return [...values].sort((a, b) => a.localeCompare(b)); }
function uniq(values: string[]): string[] { return sorted([...new Set(values)]); }
function sameStrings(a: string[], b: string[]): boolean { return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b)); }
function countBy(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}
function countByDeclared(values: string[], declared: string[]): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(declared.map((key) => [key, 0]));
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
function pushGap(gaps: AutomationAuditGap[], code: string, ids: string[], detail: string): void { gaps.push({ code, ids: uniq(ids), detail }); }
function structuredClauseText(value: unknown): string | undefined {
  if (typeof value === 'string') return value || undefined;
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.printedClause === 'string' && record.printedClause) return record.printedClause;
  if (typeof record.text === 'string' && record.text) return record.text;
  return undefined;
}

export function recomputeReferenceSnapshot(referenceRoot: string): ReferenceAuditSnapshot {
  const verified = verifyReferenceRoot(referenceRoot);
  const legacy = readJson<any>(resolve(referenceRoot, LEGACY_CONTENT_PATH));
  const authoring = readJson<any>(resolve(referenceRoot, AUTHORING_CARDS_PATH));
  const programs = readJson<any>(resolve(referenceRoot, PROGRAMS_PATH));
  const audit = readJson<any>(resolve(referenceRoot, AUDIT_PATH));
  if (!Array.isArray(legacy.masters) || !Array.isArray(legacy.servants)) throw new Error('Raw Reference legacy content is missing owner arrays.');
  if (!Array.isArray(authoring.skillCards) || !Array.isArray(programs.programs) || !Array.isArray(audit.dynamicRuntimeSkills)) throw new Error('Raw Reference inputs are incomplete.');

  const authoringById = new Map<string, { card: any; index: number }>();
  let authoringAbilityCount = 0;
  for (const [index, card] of authoring.skillCards.entries()) {
    if (typeof card.id !== 'string' || !Array.isArray(card.abilities)) throw new Error(`Invalid raw authoring card at ${index}.`);
    if (authoringById.has(card.id)) throw new Error(`Duplicate raw authoring card ID: ${card.id}`);
    authoringById.set(card.id, { card, index });
    authoringAbilityCount += card.abilities.length;
  }

  const referenceConflicts: Array<{ code: string; id: string; detail: string }> = [];
  const staticSkills: ReferenceAuditStaticSkill[] = [];
  const groups: Array<{ ownerType: 'master' | 'servant'; owners: any[] }> = [
    { ownerType: 'master', owners: legacy.masters },
    { ownerType: 'servant', owners: legacy.servants },
  ];
  for (const group of groups) {
    for (const [ownerIndex, owner] of group.owners.entries()) {
      for (const [skillIndex, skill] of (owner.skills ?? []).entries()) {
        const baseLocator = `${group.ownerType}s[${ownerIndex}].skills[${skillIndex}].text`;
        const rawStructured = Array.isArray(skill.clauses) ? skill.clauses.map(structuredClauseText).filter(Boolean) as string[] : [];
        const authoringMatch = authoringById.get(String(skill.id));
        let expectedClauses: ReferenceAuditExpectedClause[] = [];
        let authoringAbilityIds: string[] = [];
        if (rawStructured.length > 0) {
          expectedClauses = rawStructured.map((text, index) => ({ text, derivation: 'reference_structured_clause', source: { document: LEGACY_CONTENT_PATH, locator: `${baseLocator}.clauses[${index}]`, sha256: sha256(text) } }));
        } else if (authoringMatch) {
          if (authoringMatch.card.printedText !== skill.text) referenceConflicts.push({ code: 'REFERENCE_AUTHORING_PRINTED_TEXT_CONFLICT', id: String(skill.id), detail: 'Raw authoring printedText differs from raw legacy skill text.' });
          authoringAbilityIds = authoringMatch.card.abilities.map((ability: any) => String(ability.id));
          expectedClauses = authoringMatch.card.abilities.map((ability: any, abilityIndex: number) => {
            const text = String(ability.printedClause ?? '');
            return { text, derivation: 'v2_printed_clause' as const, sourceAbilityId: String(ability.id), source: { document: AUTHORING_CARDS_PATH, locator: `skillCards[${authoringMatch.index}].abilities[${abilityIndex}].printedClause`, sha256: sha256(text) } };
          });
        } else {
          expectedClauses = String(skill.text ?? '').split(/\r?\n/).filter((line) => line.length > 0).map((text, lineIndex) => ({ text, derivation: 'mechanical_line_split' as const, source: { document: LEGACY_CONTENT_PATH, locator: `${baseLocator}#line=${lineIndex + 1}`, sha256: sha256(text) } }));
        }
        staticSkills.push({ id: String(skill.id), ownerId: String(owner.id), ownerType: group.ownerType, ownerName: String(owner.name), skillName: String(skill.name), printedText: String(skill.text ?? ''), sourceRefs: Array.isArray(skill.sourceRefs) ? skill.sourceRefs : [], expectedClauses, authoringAbilityIds });
      }
    }
  }
  const staticIds = staticSkills.map((skill) => skill.id);
  const programIds = programs.programs.map((program: any) => String(program.skillId));
  if (new Set(staticIds).size !== staticIds.length || new Set(programIds).size !== programIds.length) throw new Error('Raw Reference identity duplication detected.');
  return { repository: verified.repository, commit: verified.commit, staticSkills: staticSkills.sort((a,b) => a.id.localeCompare(b.id)), dynamicSkillIds: sorted(audit.dynamicRuntimeSkills.map(String)), programIds: sorted(programIds), authoringCardIds: sorted(authoring.skillCards.map((card: any) => String(card.id))), authoringAbilityCount, referenceConflicts };
}
function compareRaw(snapshot: ReferenceAuditSnapshot, inventory: any, gaps: AutomationAuditGap[], sourceEvidenceCards: any[] = []): void {
  const staticEntries = Array.isArray(inventory.staticSkills) ? inventory.staticSkills : [];
  const dynamicEntries = Array.isArray(inventory.dynamicSkills) ? inventory.dynamicSkills : [];
  const expectedStaticIds = snapshot.staticSkills.map((skill) => skill.id);
  const actualStaticIds = staticEntries.map((entry: any) => String(entry.canonicalAbilityId));
  const actualDynamicIds = dynamicEntries.map((entry: any) => String(entry.canonicalAbilityId));
  if (!sameStrings(expectedStaticIds, actualStaticIds)) pushGap(gaps, 'STATIC_ID_SET_MISMATCH', [...expectedStaticIds, ...actualStaticIds], 'Generated static IDs differ from raw Reference static IDs.');
  if (!sameStrings(snapshot.dynamicSkillIds, actualDynamicIds)) pushGap(gaps, 'DYNAMIC_ID_SET_MISMATCH', [...snapshot.dynamicSkillIds, ...actualDynamicIds], 'Generated dynamic IDs differ from raw Reference dynamicRuntimeSkills.');
  if (!sameStrings(snapshot.programIds, expectedStaticIds)) pushGap(gaps, 'REFERENCE_PROGRAM_ID_SET_MISMATCH', [...snapshot.programIds, ...expectedStaticIds], 'Raw skill-rule program IDs differ from raw static skill IDs.');

  const byId = new Map(staticEntries.map((entry: any) => [String(entry.canonicalAbilityId), entry] as const));
  const dynamicById = new Map(dynamicEntries.map((entry: any) => [String(entry.canonicalAbilityId), entry] as const));
  const authoringSet = new Set(snapshot.authoringCardIds);
  const expectedIdentitySet = new Set([...expectedStaticIds, ...snapshot.dynamicSkillIds]);
  const overlayById = new Map<string, any>();
  for (const card of sourceEvidenceCards) {
    const id = String(card?.id ?? '');
    if (!id || overlayById.has(id)) {
      pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_DUPLICATE', [id || '<missing>'], 'Source-evidence overlay IDs must be unique and non-empty.');
      continue;
    }
    overlayById.set(id, card);
    if (!expectedIdentitySet.has(id)) pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_UNKNOWN_ID', [id], 'Source-evidence overlay does not match a locked Reference canonical identity.');
    if (authoringSet.has(id)) pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_SHADOWS_REFERENCE', [id], 'Source-evidence overlay must not override an existing locked Reference authoring card.');
    const source = card?.source ?? {};
    if (typeof source.locator !== 'string' || source.locator.length === 0) {
      pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_PROVENANCE_MISMATCH', [id], 'External semantic evidence must carry a stable locator.');
    }
    if (source.authority === 'FATE_DOMINATION_WIKI') {
      let parsedUrl: URL | undefined;
      try { parsedUrl = new URL(String(source.url ?? '')); }
      catch { parsedUrl = undefined; }
      if (
        source.document !== 'Fate/Domination Wiki' ||
        parsedUrl?.protocol !== 'https:' ||
        parsedUrl.hostname !== 'fatedomination.fandom.com' ||
        !parsedUrl.pathname.startsWith('/wiki/')
      ) {
        pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_AUTHORITY_MISMATCH', [id], 'Wiki evidence must come from the allowlisted Fate/Domination Wiki.');
      }
    } else if (source.authority === 'DEVELOPMENT_TEXT') {
      const allowedDevelopmentDocuments = new Set([
        'Fate_Domination-开发版/data_masters.js',
        'Fate_Domination-开发版/data_servants.js',
        'Fate_Domination-开发版/batch_caster_assassin.js',
        'Fate_Domination-开发版/batch_berserker_extra.js',
        'Fate_Domination-开发版/index.html',
      ]);
      const sourceText = typeof source.sourceText === 'string' ? source.sourceText : '';
      const sourceTextHash = sourceText
        ? createHash('sha256').update(sourceText, 'utf8').digest('hex')
        : '';
      if (
        !allowedDevelopmentDocuments.has(String(source.document ?? '')) ||
        !/^[a-f0-9]{64}$/.test(String(source.sourceFileSha256 ?? '')) ||
        sourceText.length === 0 ||
        !/^[a-f0-9]{64}$/.test(String(source.sourceTextSha256 ?? '')) ||
        sourceTextHash !== source.sourceTextSha256 ||
        source.sourceText !== card.printedText ||
        source.sourceTextSha256 !== card.referencePrintedTextSha256
      ) {
        pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_DEVELOPMENT_SNAPSHOT_MISMATCH', [id], 'Development-text evidence must be an allowlisted, hash-locked source snapshot.');
      }
    } else {
      pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_AUTHORITY_MISMATCH', [id], 'External semantic evidence uses an unsupported authority.');
    }
    if (!Array.isArray(card?.abilities) || card.abilities.length === 0) {
      pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_EMPTY', [id], 'External semantic evidence must contain at least one structured ability.');
    }
  }
  for (const expected of snapshot.staticSkills) {
    const actual = byId.get(expected.id);
    if (!actual) continue;
    if (actual.ownerId !== expected.ownerId || actual.ownerType !== expected.ownerType || actual.ownerName !== expected.ownerName || actual.skillName !== expected.skillName || actual.printedText !== expected.printedText) {
      pushGap(gaps, 'IDENTITY_METADATA_MISMATCH', [expected.id], 'Generated identity metadata differs from raw Reference metadata.');
    }
    if (stable(actual.sources ?? []) !== stable(expected.sourceRefs)) pushGap(gaps, 'SOURCE_COVERAGE_MISMATCH', [expected.id], 'Generated source refs differ from raw Reference sourceRefs.');
    const normalizedClauses = (actual.clauses ?? []).map((clause: any) => ({ text: clause.text, derivation: clause.derivation, ...(clause.sourceAbilityId ? { sourceAbilityId: clause.sourceAbilityId } : {}), source: clause.source }));
    if (stable(normalizedClauses) !== stable(expected.expectedClauses)) pushGap(gaps, 'CLAUSE_MISMATCH', [expected.id], 'Generated clause text/provenance differs from independently reconstructed clauses.');
    const semantic = actual.semanticNormalization ?? {};
    const overlayCard = overlayById.get(expected.id);
    const shouldBeGrounded = authoringSet.has(expected.id) || Boolean(overlayCard);
    if ((shouldBeGrounded && semantic.status !== 'SOURCE_GROUNDED') || (!shouldBeGrounded && semantic.status !== 'BLOCKED')) pushGap(gaps, 'SEMANTIC_SOURCE_CATEGORY_MISMATCH', [expected.id], 'Generated semantic source category disagrees with accepted Reference/overlay evidence presence.');
    if (authoringSet.has(expected.id)) {
      const actualAbilityIds = (semantic.abilities ?? []).map((ability: any) => String(ability.sourceAbilityId));
      if (!sameStrings(expected.authoringAbilityIds, actualAbilityIds)) pushGap(gaps, 'AUTHORING_ABILITY_ID_SET_MISMATCH', [expected.id], 'Normalized subability IDs differ from raw authoring ability IDs.');
    } else if (overlayCard) {
      const source = overlayCard.source ?? {};
      const expectedReferenceHash = createHash('sha256').update(expected.printedText, 'utf8').digest('hex');
      if (overlayCard.referencePrintedTextSha256 !== expectedReferenceHash) {
        pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_REFERENCE_BINDING_MISMATCH', [expected.id], 'Source-evidence overlay is not bound to the exact locked Reference printed text.');
      }
      if (semantic.source?.document !== source.document || semantic.source?.locator !== source.locator) {
        pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_PROVENANCE_MISMATCH', [expected.id], 'Normalized semantic provenance differs from the accepted source-evidence overlay.');
      }
      const expectedAbilityIds = (overlayCard.abilities ?? []).map((ability: any) => String(ability.id));
      const actualAbilityIds = (semantic.abilities ?? []).map((ability: any) => String(ability.sourceAbilityId));
      if (!sameStrings(expectedAbilityIds, actualAbilityIds)) pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_ABILITY_ID_SET_MISMATCH', [expected.id], 'Normalized subability IDs differ from source-evidence overlay ability IDs.');
    }
  }
  for (const id of snapshot.dynamicSkillIds) {
    const actual = dynamicById.get(id);
    if (!actual) continue;
    const semantic = actual.semanticNormalization ?? {};
    const overlayCard = overlayById.get(id);
    const shouldBeGrounded = Boolean(overlayCard);
    if ((shouldBeGrounded && semantic.status !== 'SOURCE_GROUNDED') || (!shouldBeGrounded && semantic.status !== 'BLOCKED')) {
      pushGap(gaps, 'SEMANTIC_SOURCE_CATEGORY_MISMATCH', [id], 'Generated dynamic semantic source category disagrees with accepted overlay evidence presence.');
    }
    if (overlayCard) {
      const source = overlayCard.source ?? {};
      const sourceText = typeof source.sourceText === 'string' ? source.sourceText : '';
      const evidenceHash = sourceText ? createHash('sha256').update(sourceText, 'utf8').digest('hex') : '';
      if (overlayCard.referencePrintedTextSha256 !== evidenceHash) {
        pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_REFERENCE_BINDING_MISMATCH', [id], 'Dynamic source-evidence overlay is not bound to its exact locked source snapshot.');
      }
      if (semantic.source?.document !== source.document || semantic.source?.locator !== source.locator) {
        pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_PROVENANCE_MISMATCH', [id], 'Normalized dynamic semantic provenance differs from the accepted source-evidence overlay.');
      }
      const expectedAbilityIds = (overlayCard.abilities ?? []).map((ability: any) => String(ability.id));
      const actualAbilityIds = (semantic.abilities ?? []).map((ability: any) => String(ability.sourceAbilityId));
      if (!sameStrings(expectedAbilityIds, actualAbilityIds)) pushGap(gaps, 'SOURCE_EVIDENCE_OVERLAY_ABILITY_ID_SET_MISMATCH', [id], 'Normalized dynamic subability IDs differ from source-evidence overlay ability IDs.');
    }
  }  for (const conflict of snapshot.referenceConflicts ?? []) pushGap(gaps, conflict.code, [conflict.id], conflict.detail);
}

function compareSummaries(inventory: any, catalog: any, gaps: AutomationAuditGap[]) {
  const entries = [...(inventory.staticSkills ?? []), ...(inventory.dynamicSkills ?? [])];
  const sourceGroundedCount = entries.filter((entry: any) => entry.semanticNormalization?.status === 'SOURCE_GROUNDED').length;
  const semanticBlockedCount = entries.filter((entry: any) => entry.semanticNormalization?.status === 'BLOCKED').length;
  const structuredAbilityCount = entries.reduce((sum: number, entry: any) => sum + (entry.semanticNormalization?.abilities?.length ?? 0), 0);
  const contractMappedCount = entries.filter((entry: any) => entry.phase3?.mappingStatus === 'CONTRACT_MAPPED').length;
  const explicitBlockCount = entries.filter((entry: any) => entry.phase3?.mappingStatus === 'EXPLICIT_BLOCK').length;
  const currentRoute = countByDeclared(entries.map((entry: any) => String(entry.phase3?.currentRoute ?? 'MISSING')), ['legacy','new','dual','none']);
  const referenceRoute = countByDeclared(entries.map((entry: any) => String(entry.phase3?.referenceRoute ?? 'MISSING')), ['deterministic','shared_handler','specific_handler','none']);
  const classificationRoute = countByDeclared(entries.map((entry: any) => String(entry.phase3?.classificationRoute ?? 'MISSING')), ['READY_EXISTING_CONTRACT','READY_GENERIC_EXTENSION','SPECIAL_HANDLER_CANDIDATE','RULE_DECISION_REQUIRED','SOURCE_EVIDENCE_REQUIRED','PHASE_DEPENDENCY_BLOCKED','REFERENCE_RUNTIME_CONFLICT']);
  const semanticExpected = { totalIdentityCount: entries.length, sourceGroundedCount, blockedCount: semanticBlockedCount, unclassifiedCount: entries.length - sourceGroundedCount - semanticBlockedCount, structuredAbilityCount };
  if (stable(inventory.semanticSummary ?? {}) !== stable(semanticExpected)) pushGap(gaps, 'SEMANTIC_SUMMARY_MISMATCH', [], 'Stored semanticSummary differs from record-level recomputation.');
  const cap = inventory.capabilitySummary ?? {};
  if (cap.totalIdentityCount !== entries.length || cap.contractMappedCount !== contractMappedCount || cap.explicitBlockCount !== explicitBlockCount || stable(cap.currentRouteCounts ?? {}) !== stable(currentRoute) || stable(cap.referenceRouteCounts ?? {}) !== stable(referenceRoute) || stable(cap.classificationRouteCounts ?? {}) !== stable(classificationRoute) || cap.zeroSilentFallback !== true) pushGap(gaps, 'CAPABILITY_SUMMARY_MISMATCH', [], 'Stored capabilitySummary differs from record-level recomputation.');
  if ((catalog.summary?.capabilityCount ?? -1) !== (catalog.capabilities?.length ?? 0)) pushGap(gaps, 'CATALOG_SUMMARY_MISMATCH', [], 'Stored capability count differs from actual catalog records.');
  const allowedCurrent = new Set(['legacy','new','dual','none']);
  const allowedReference = new Set(['deterministic','shared_handler','specific_handler','none']);
  const bad = entries.filter((entry: any) => !allowedCurrent.has(entry.phase3?.currentRoute) || !allowedReference.has(entry.phase3?.referenceRoute)).map((entry: any) => String(entry.canonicalAbilityId));
  if (bad.length) pushGap(gaps, 'ROUTE_ENUM_MISMATCH', bad, 'Route value outside declared enums.');
  return { currentRoute, referenceRoute, classificationRoute };
}

function compareCatalog(inventory: any, catalog: any, gaps: AutomationAuditGap[]): void {
  const entries = [...(inventory.staticSkills ?? []), ...(inventory.dynamicSkills ?? [])];
  const mappedIds = entries.filter((entry: any) => entry.phase3?.mappingStatus === 'CONTRACT_MAPPED').map((entry: any) => String(entry.canonicalAbilityId));
  const blockedIds = entries.filter((entry: any) => entry.phase3?.mappingStatus === 'EXPLICIT_BLOCK').map((entry: any) => String(entry.canonicalAbilityId));
  if (!sameStrings(mappedIds, (catalog.coverage?.mappedAbilities ?? []).map(String))) pushGap(gaps, 'CATALOG_MAPPED_COVERAGE_MISMATCH', mappedIds, 'Catalog mapped coverage differs from inventory.');
  if (!sameStrings(blockedIds, (catalog.coverage?.blockedAbilities ?? []).map((row: any) => String(row.abilityId)))) pushGap(gaps, 'CATALOG_BLOCKED_COVERAGE_MISMATCH', blockedIds, 'Catalog blocked coverage differs from inventory.');
  const byId = new Map((catalog.capabilities ?? []).map((capability: any) => [String(capability.id), capability] as const));
  const referenced = new Set<string>();
  for (const entry of entries) for (const id of [...(entry.phase3?.requiredCapabilities ?? []), ...(entry.phase3?.inheritedAcceptanceContracts ?? []), ...(entry.phase3?.partialAcceptanceContracts ?? [])]) referenced.add(String(id));
  const missing = [...referenced].filter((id) => !byId.has(id));
  if (missing.length) pushGap(gaps, 'CAPABILITY_DECLARATION_MISSING', missing, 'Inventory references undeclared capability IDs.');
  const mismatch: string[] = [];
  for (const [id, capability] of byId) {
    const expectedEligible = entries.filter((entry: any) => (entry.phase3?.requiredCapabilities ?? []).includes(id) || (entry.phase3?.inheritedAcceptanceContracts ?? []).includes(id)).map((entry: any) => String(entry.canonicalAbilityId));
    const expectedPartial = entries.filter((entry: any) => (entry.phase3?.partialAcceptanceContracts ?? []).includes(id)).map((entry: any) => String(entry.canonicalAbilityId));
    if (!sameStrings(expectedEligible, (capability.eligibleAbilities ?? []).map(String)) || !sameStrings(expectedPartial, (capability.partialAbilities ?? []).map(String))) mismatch.push(id);
  }
  if (mismatch.length) pushGap(gaps, 'CAPABILITY_MEMBERSHIP_MISMATCH', mismatch, 'Catalog eligible/partial membership differs from inventory capability fields.');
}

function compareBlockedCoverage(inventory: any, decisions: any, gaps: AutomationAuditGap[]): number {
  const entries = [...(inventory.staticSkills ?? []), ...(inventory.dynamicSkills ?? [])];
  const blockedIds = entries.filter((entry: any) => entry.phase3?.mappingStatus === 'EXPLICIT_BLOCK').map((entry: any) => String(entry.canonicalAbilityId));
  const covered: string[] = [];
  for (const packet of decisions.decisionPackets ?? []) covered.push(...(packet.affectedAbilityIds ?? []).map(String));
  for (const packet of decisions.sourceEvidencePackets ?? []) covered.push(...(packet.affectedAbilityIds ?? []).map(String));
  for (const dep of decisions.externalDependencies ?? []) covered.push(String(dep.abilityId));
  const counts = countBy(covered);
  const duplicate = Object.entries(counts).filter(([,count]) => count !== 1).map(([id]) => id);
  if (duplicate.length || !sameStrings(blockedIds, covered)) pushGap(gaps, 'BLOCKED_PACKET_COVERAGE_MISMATCH', [...blockedIds, ...covered, ...duplicate], 'Each blocked identity must appear exactly once in decision/evidence/dependency packets.');
  const summary = decisions.summary ?? {};
  if (summary.blockedIdentityCount !== blockedIds.length || summary.coveredBlockedIdentityCount !== new Set(covered).size || summary.uncoveredBlockedIdentityCount !== blockedIds.filter((id) => !counts[id]).length || summary.ruleDecisionPacketCount !== (decisions.decisionPackets?.length ?? 0) || summary.sourceEvidencePacketCount !== (decisions.sourceEvidencePackets?.length ?? 0) || summary.externalDependencyCount !== (decisions.externalDependencies?.length ?? 0)) pushGap(gaps, 'DECISION_SUMMARY_MISMATCH', [], 'Decision summary differs from packet recomputation.');
  return new Set(covered).size;
}
function compareRuntime(catalog: any, runtime: any, gaps: AutomationAuditGap[]): void {
  const requests = runtime.requests ?? [];
  const expected = (catalog.capabilities ?? []).filter((capability: any) => capability.category !== 'existing_contract' && (capability.eligibleAbilities?.length ?? 0) > 0);
  if (!sameStrings(expected.map((capability: any) => String(capability.id)), requests.map((request: any) => String(request.capabilityId)))) pushGap(gaps, 'RUNTIME_REQUEST_SET_MISMATCH', [...expected.map((capability: any) => String(capability.id)), ...requests.map((request: any) => String(request.capabilityId))], 'Runtime request capability set differs from catalog technical gaps.');
  const requestById = new Map<string, any[]>();
  for (const request of requests) {
    const id = String(request.capabilityId);
    const group = requestById.get(id) ?? [];
    group.push(request);
    requestById.set(id, group);
  }
  const mismatch: string[] = [];
  for (const capability of expected) {
    const group = requestById.get(String(capability.id)) ?? [];
    if (group.length !== 1 || !sameStrings((capability.eligibleAbilities ?? []).map(String), (group[0]?.affectedAbilityIds ?? []).map(String))) mismatch.push(String(capability.id));
  }
  if (mismatch.length) pushGap(gaps, 'RUNTIME_REQUEST_MEMBERSHIP_MISMATCH', mismatch, 'Runtime request affected identities differ from catalog membership.');
  const affected = uniq(requests.flatMap((request: any) => (request.affectedAbilityIds ?? []).map(String)));
  const summary = runtime.summary ?? {};
  if (summary.runtimeRequestCount !== requests.length || summary.genericCapabilityRequestCount !== requests.filter((request: any) => request.requestType === 'GENERIC_CAPABILITY_REQUEST').length || summary.reviewedSpecialRequestCount !== requests.filter((request: any) => request.requestType === 'REVIEWED_SPECIAL_REQUEST').length || summary.affectedIdentityCount !== affected.length) pushGap(gaps, 'RUNTIME_REQUEST_SUMMARY_MISMATCH', [], 'Runtime request summary differs from request records.');
}

export function auditFullRosterArtifacts(snapshot: ReferenceAuditSnapshot, inventory: any, catalog: any, decisions: any, runtime: any, sourceEvidenceCards: any[] = []): AutomationAuditResult {
  const gaps: AutomationAuditGap[] = [];
  if (inventory.provenance?.repository !== snapshot.repository || inventory.provenance?.commit !== snapshot.commit) pushGap(gaps, 'INVENTORY_PROVENANCE_MISMATCH', [], 'Inventory provenance differs from independently verified Reference.');
  if (catalog.provenance?.referenceRepository !== snapshot.repository || catalog.provenance?.referenceCommit !== snapshot.commit) pushGap(gaps, 'CATALOG_PROVENANCE_MISMATCH', [], 'Catalog provenance differs from independently verified Reference.');
  compareRaw(snapshot, inventory, gaps, sourceEvidenceCards);
  const categoryCounts = compareSummaries(inventory, catalog, gaps);
  compareCatalog(inventory, catalog, gaps);
  const blockedPacketCoverageCount = compareBlockedCoverage(inventory, decisions, gaps);
  compareRuntime(catalog, runtime, gaps);

  const entries = [...(inventory.staticSkills ?? []), ...(inventory.dynamicSkills ?? [])];
  const recomputed = {
    staticSkillCount: snapshot.staticSkills.length,
    dynamicSkillCount: snapshot.dynamicSkillIds.length,
    totalIdentityCount: snapshot.staticSkills.length + snapshot.dynamicSkillIds.length,
    programCount: snapshot.programIds.length,
    authoringCardCount: snapshot.authoringCardIds.length,
    authoringAbilityCount: snapshot.authoringAbilityCount,
    sourceEvidenceOverlayCount: sourceEvidenceCards.length,
    sourceEvidenceOverlayAbilityCount: sourceEvidenceCards.reduce((sum: number, card: any) => sum + (card?.abilities?.length ?? 0), 0),
    clauseCount: (inventory.staticSkills ?? []).reduce((sum: number, entry: any) => sum + (entry.clauses?.length ?? 0), 0),
    sourceRefCount: entries.reduce((sum: number, entry: any) => sum + (entry.sources?.length ?? 0), 0),
    sourceGroundedCount: entries.filter((entry: any) => entry.semanticNormalization?.status === 'SOURCE_GROUNDED').length,
    semanticBlockedCount: entries.filter((entry: any) => entry.semanticNormalization?.status === 'BLOCKED').length,
    contractMappedCount: entries.filter((entry: any) => entry.phase3?.mappingStatus === 'CONTRACT_MAPPED').length,
    explicitBlockCount: entries.filter((entry: any) => entry.phase3?.mappingStatus === 'EXPLICIT_BLOCK').length,
    capabilityCount: catalog.capabilities?.length ?? 0,
    blockedPacketCoverageCount,
    runtimeRequestCount: runtime.requests?.length ?? 0,
  };
  return { status: gaps.length ? 'AUTOMATION_CLASSIFICATION_GAP' : 'EXACT_AGREEMENT', provenance: { referenceRepository: snapshot.repository, referenceCommit: snapshot.commit }, recomputed, categoryCounts, gaps: gaps.sort((a,b) => a.code.localeCompare(b.code) || a.detail.localeCompare(b.detail)) };
}

export function renderAutomationAuditReport(result: AutomationAuditResult): string {
  const lines: string[] = ['# Phase 3 Full-Roster Independent Automation Audit', '', '- Role: Codex A', '- Task: P3-FA01', '- Scope: independent recomputation only; no semantic/runtime repair and no Gate promotion.', '- Reference Inputs: raw legacy content, raw V2 authoring cards, raw skill-rule programs, raw dynamic skill audit, plus separately allowlisted source-evidence overlays.', '', `status=${result.status}`, `gapCount=${result.gaps.length}`, `referenceRepository=${result.provenance.referenceRepository}`, `referenceCommit=${result.provenance.referenceCommit}`, '', '## Independently Recomputed Totals', ''];
  for (const [key, value] of Object.entries(result.recomputed)) lines.push(`${key}=${value}`);
  lines.push('', '## Recomputed Categories', '');
  for (const [axis, counts] of Object.entries(result.categoryCounts)) {
    lines.push(`### ${axis}`, '');
    for (const [key, value] of Object.entries(counts)) lines.push(`- \`${key}\`: ${value}`);
    lines.push('');
  }
  lines.push('## Classification Gaps', '');
  if (!result.gaps.length) lines.push('None. Raw Reference inputs and generated full-roster artifacts agree under the independent recomputation contract.');
  else {
    lines.push('| Code | IDs | Detail |', '|---|---|---|');
    for (const gap of result.gaps) lines.push(`| \`${gap.code}\` | ${gap.ids.length ? gap.ids.map((id) => `\`${id}\``).join(', ') : '`NONE`'} | ${gap.detail} |`);
  }
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

function parseArgument(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  return value && !value.startsWith('--') ? value : undefined;
}

function main(): void {
  const args = process.argv.slice(2);
  const referenceArg = parseArgument(args, '--reference-root');
  if (!referenceArg) throw new Error('Usage: audit-full-roster --reference-root <clean-reference-checkout> [--output <audit.md>] [--source-evidence-overlay <overlay.json>]');
  const referenceRoot = resolve(referenceArg);
  const outputPath = resolve(parseArgument(args, '--output') ?? DEFAULT_REPORT_PATH);
  assertOutputOutsideReference(referenceRoot, outputPath);
  const snapshot = recomputeReferenceSnapshot(referenceRoot);
  const inventory = readJson<any>(resolve(parseArgument(args, '--inventory') ?? DEFAULT_INVENTORY_PATH));
  const catalog = readJson<any>(resolve(parseArgument(args, '--catalog') ?? DEFAULT_CATALOG_PATH));
  const decisions = readJson<any>(resolve(parseArgument(args, '--decisions') ?? DEFAULT_DECISIONS_PATH));
  const runtime = readJson<any>(resolve(parseArgument(args, '--runtime-requests') ?? DEFAULT_RUNTIME_REQUESTS_PATH));
  const overlayFile = readJson<any>(resolve(parseArgument(args, '--source-evidence-overlay') ?? DEFAULT_SOURCE_EVIDENCE_OVERLAY_PATH));
  if (overlayFile?.schemaVersion !== 1 || overlayFile?.kind !== 'phase3-full-roster-source-evidence-overlays' || !Array.isArray(overlayFile?.cards)) {
    throw new Error('Unsupported full-roster source-evidence overlay schema.');
  }
  const result = auditFullRosterArtifacts(snapshot, inventory, catalog, decisions, runtime, overlayFile.cards);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, renderAutomationAuditReport(result), 'utf8');
  process.stdout.write(`${JSON.stringify({ status: result.status, gapCount: result.gaps.length, recomputed: result.recomputed }, null, 2)}\n`);
  if (result.status !== 'EXACT_AGREEMENT') process.exitCode = 2;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
const modulePath = resolve(fileURLToPath(import.meta.url));
if (invokedPath === modulePath) {
  try { main(); }
  catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; }
}
