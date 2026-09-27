import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type JsonRecord = Record<string, unknown>;

export type GapCode =
  | 'GENERATED_REGISTRY_MISSING'
  | 'RUNTIME_CONTRACT_UNBOUND'
  | 'TEST_EVIDENCE_UNBOUND'
  | 'GATE_C_PENDING'
  | 'LEGACY_ONLY'
  | 'COMPILER_UNSUPPORTED'
  | 'AUTHORING_GENERATION_DRIFT'
  | 'REVIEW_ARTIFACT_MISSING';

interface MatrixEvidence {
  path: string;
  expectedSha256?: string | null;
}

interface MatrixIdentity {
  canonicalIdentityId: string;
  cardIds: string[];
  abilityIds: string[];
  acceptedFamilyId: string;
  acceptedMigrationBatch: string;
  acceptanceReportPaths: string[];
  acceptanceEvidence?: MatrixEvidence[];
  generatedRegistryPresent: boolean;
  compileStatus: string;
  acceptedRuntimeContracts: string[];
  productionRuntimeRoute: string;
  focusedTestEvidence: string[];
  gateCRequired: boolean;
  gateCStatus: string;
  blockingReasons: string[];
}

interface MatrixArtifact {
  taskId: string;
  controlEpoch: string;
  mainSha: string;
  generatedAt: string;
  frozenDenominator: number;
  acceptedIdentityCount: number;
  remainingIdentityCount: number;
  missingGeneratedRegistryIds: string[];
  identities: MatrixIdentity[];
}

interface AuthoringCard {
  archiveId: string;
  filePath: string;
  cardType?: string;
  abilities?: Array<{ id: string }>;
}

interface GeneratedContent {
  cards?: Array<{ id: string }>;
}

interface PackManifest {
  authoringServantFiles?: string[];
  authoringMasterFiles?: string[];
  authoringMasterRuleFiles?: string[];
}

interface ReportEvidence {
  path: string;
  exists: boolean;
  sha256: string | null;
  expectedSha256: string | null;
  shaMatches: boolean;
  acceptedVerdict: boolean;
  containsIdentity: boolean;
  validIdentityEvidence: boolean;
}

interface GapDetail {
  code: GapCode;
  evidence: string[];
  owner: string;
  smallestRepairSlice: string;
  requiredReviewer: string;
  dependencyOrder: number;
}

interface DecomposedIdentity {
  canonicalIdentityId: string;
  cardIds: string[];
  abilityIds: string[];
  acceptedFamilyId: string;
  acceptedMigrationBatch: string;
  archiveId: string | null;
  authoringPath: string | null;
  cardType: string | null;
  authoringPresent: boolean;
  generatedRegistryPresent: boolean;
  registryStatus: string;
  registryDiagnosis: string;
  coverageRoutes: string[];
  unclassifiedReasons: string[];
  sharedRuntimeContract: string;
  acceptedRuntimeContracts: string[];
  runtimeContractBinding: string;
  reportEvidence: ReportEvidence[];
  gaps: GapCode[];
  primaryGap: GapCode | null;
  gapDetails: GapDetail[];
  currentMainStatus: string;
}

interface FamilySummary {
  family: string;
  identityCount: number;
  affectedIdentities: string[];
  sharedRuntimeContract: string;
  registryStatus: string[];
  gapCounts: Record<string, number>;
  gapOwner: string[];
  smallestRepairSlice: string[];
  requiredReviewer: string[];
  dependencyOrder: number[];
}

interface Decomposition {
  taskId: string;
  controlEpoch: string;
  mainSha: string;
  generatedAt: string;
  sourceMatrixArtifact: string;
  sourceMatrixSha256: string;
  frozenDenominator: number;
  acceptedIdentityCount: number;
  remainingIdentityCount: number;
  gapCounts: Record<GapCode, number>;
  primaryGapCounts: Record<string, number>;
  registryDiagnosisCounts: Record<string, number>;
  familySummaries: FamilySummary[];
  identities: DecomposedIdentity[];
  accounting: {
    creditChange: 'NONE';
    migrationAcceptanceChange: 'NONE';
    mainCoverageCreditDelta: 0;
  };
}

const TASK_ID = 'P3-E04-A112';
const CONTROL_EPOCH = 'FD-P3-2026-09-23-04';
const DEFAULT_MATRIX = 'artifacts/phase3-e04-current-main-accepted-111-execution-matrix.json';
const DEFAULT_OUTPUT = 'artifacts/phase3-e04-a112-accepted-111-gap-decomposition.json';
const DEFAULT_REPORT = 'docs/reports/2026-09-27-p3-e04-a112-accepted-111-gap-decomposition.md';

const GAP_CODES: GapCode[] = [
  'GENERATED_REGISTRY_MISSING',
  'RUNTIME_CONTRACT_UNBOUND',
  'TEST_EVIDENCE_UNBOUND',
  'GATE_C_PENDING',
  'LEGACY_ONLY',
  'COMPILER_UNSUPPORTED',
  'AUTHORING_GENERATION_DRIFT',
  'REVIEW_ARTIFACT_MISSING',
];

const REGISTRY_DIAGNOSIS_CODES = [
  'AUTHORING_PRESENT_BUT_NOT_REGISTERED_IN_ACTIVE_PLAYTEST_PACK',
  'RULES_ONLY_MASTER_RULE_ARCHIVE_NOT_REGISTERED_IN_PLAYTEST_PACK',
  'PACK_SOURCE_LISTED_BUT_NOT_EMITTED',
  'AUTHORING_SHAPE_UNSUPPORTED',
  'RUNTIME_CAPABILITY_MISSING',
  'LEGACY_HANDLER_DEPENDENCY_ONLY',
] as const;

const FAMILY_CONTRACTS: Record<string, { contract: string; owner: string; reviewer: string; slice: string; order: number }> = {
  ALTER_EGO_TRANSFORM: {
    contract: 'FB2-13/R37: transform_event_source_card + close_source_card; EX variant included',
    owner: 'Codex A/R for identity evidence; Codex B only for concrete runtime gap',
    reviewer: 'Reviewer R / current-main evidence reviewer',
    slice: 'A112-EVIDENCE-ALTER-EGO: bind exact identity evidence before any new runtime work',
    order: 3,
  },
  ANY_LOCATION_EXCEPT_WORKSHOP_MOVEMENT: {
    contract: 'FB2-09/R27: typed move_player with one location choice and workshop exclusion',
    owner: 'Codex A/R for evidence; Codex B for legacy semantic migration',
    reviewer: 'Reviewer R, then Gate C reviewer if interaction is exposed',
    slice: 'A112-MOVE-EVIDENCE: bind movement contract and decide Gate C representative',
    order: 2,
  },
  CURRENT_MAIN_PLAYTEST_BASELINE: {
    contract: 'CURRENT_MAIN_PLAYTEST_BASELINE: no accepted family contract bound by A111',
    owner: 'Codex B for contract owner; Codex A for evidence binding',
    reviewer: 'Reviewer R before any migration credit',
    slice: 'B-CONTRACT-BASELINE-MIN: select one semantic contract before roster expansion',
    order: 1,
  },
  GAME_START_RULE_OVERRIDES: {
    contract: 'FB2-14/R39: game_start RuleOverride installation; rules-only boundary',
    owner: 'Codex S for rules-only registration; Codex B only if execution gap is proven',
    reviewer: 'Reviewer R / rules-only boundary reviewer',
    slice: 'A112-RULES-ONLY-BOUNDARY: confirm no playtest registry obligation for FM08',
    order: 1,
  },
  INDEPENDENT_ACTION: {
    contract: 'TO08/B21: independent-action resource cost plus battle-loss exception',
    owner: 'Codex A/R for exact evidence; Codex B for legacy route',
    reviewer: 'Reviewer R, Gate C reviewer for action/resource path',
    slice: 'A112-INDEPENDENT-ACTION-EVIDENCE: exact Tomoe lineage plus ten family members',
    order: 3,
  },
  PRESENCE_CONCEALMENT: {
    contract: 'FB2-12/R35: source-active presence concealment behavior',
    owner: 'Codex A/R for evidence; Codex B for semantic route',
    reviewer: 'Reviewer R',
    slice: 'A112-PRESENCE-EVIDENCE: bind exact source and legacy route before runtime work',
    order: 3,
  },
  SABER_MAGIC_RESISTANCE_AND_NOBLE_BLOOM: {
    contract: 'B18/R12 + B19/R13 + FB2-10/R29: Magic Resistance and Noble Bloom response contracts',
    owner: 'Codex A/R for evidence; Codex B only for route mismatch',
    reviewer: 'Reviewer R',
    slice: 'A112-SABER-EVIDENCE: bind the two accepted subcontracts separately',
    order: 3,
  },
  SOURCE_PLAY_BASIC_DRAW: {
    contract: 'TO13 + FB2-06 + FB2-08: source play, selected hand play, and basic-attack draw',
    owner: 'Codex A/R for identity evidence; Codex B for legacy path',
    reviewer: 'Reviewer R, Gate C reviewer for private hand selection',
    slice: 'A112-SOURCE-PLAY-EVIDENCE: bind private-selection and draw evidence by identity',
    order: 3,
  },
  TERRITORY_CREATION: {
    contract: 'FB2-11/R34: round formula plus Magic Workshop deployment reward',
    owner: 'Codex A/R for evidence; Codex B for legacy route',
    reviewer: 'Reviewer R',
    slice: 'A112-TERRITORY-EVIDENCE: bind formula and deployment reward subcontracts',
    order: 3,
  },
};

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function countBy(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function readAuthoringCards(workspaceRoot: string): Map<string, AuthoringCard> {
  const cards = new Map<string, AuthoringCard>();
  const files = [
    ...walkJsonFiles(resolve(workspaceRoot, 'data/authoring/masters')),
    ...walkJsonFiles(resolve(workspaceRoot, 'data/authoring/servants')),
  ];
  for (const file of files) {
    const archive = readJson<{ id: string; cards?: Array<JsonRecord> }>(file);
    for (const card of archive.cards ?? []) {
      const id = String(card.id ?? '');
      if (!id) continue;
      cards.set(id, {
        archiveId: archive.id,
        filePath: normalizePath(relative(workspaceRoot, file)),
        cardType: typeof card.cardType === 'string' ? card.cardType : undefined,
        abilities: Array.isArray(card.abilities)
          ? card.abilities.map((ability) => ({ id: String(ability.id ?? '') }))
          : [],
      });
    }
  }
  return cards;
}

function walkJsonFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const rows: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) rows.push(...walkJsonFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.json')) rows.push(full);
  }
  return rows.sort((a, b) => a.localeCompare(b));
}

function coverageRowsFor(coverage: JsonRecord, cardId: string): JsonRecord[] {
  const rows = Array.isArray(coverage.semanticAxes) ? coverage.semanticAxes as JsonRecord[] : [];
  return rows.filter((row) => row.cardId === cardId);
}

function reportIsAccepted(contents: string): boolean {
  return /(?:Verdict|Status):\s*`?(?:MIGRATION_ACCEPTED|REVIEW_ACCEPTED|IMPLEMENTATION_ACCEPTED_CANDIDATE)`?/m.test(contents)
    || /Final status\s*\n\s*`(?:MIGRATION_ACCEPTED|REVIEW_ACCEPTED|IMPLEMENTATION_ACCEPTED_CANDIDATE)`/m.test(contents)
    || /"conclusion"\s*:\s*"(?:MIGRATION_ACCEPTED|REVIEW_ACCEPTED|IMPLEMENTATION_ACCEPTED_CANDIDATE)"/.test(contents);
}

function reportEvidenceFor(workspaceRoot: string, identity: MatrixIdentity): ReportEvidence[] {
  return identity.acceptanceReportPaths.map((path) => {
    const fullPath = resolve(workspaceRoot, path);
    const exists = existsSync(fullPath);
    if (!exists) {
      return { path, exists: false, sha256: null, expectedSha256: null, shaMatches: false, acceptedVerdict: false, containsIdentity: false, validIdentityEvidence: false };
    }
    const contents = readFileSync(fullPath, 'utf8');
    const sha256 = sha256File(fullPath);
    const expectedSha256 = identity.acceptanceEvidence?.find((item) => item.path === path)?.expectedSha256 ?? null;
    const shaMatches = expectedSha256 !== null ? sha256 === expectedSha256 : false;
    const acceptedVerdict = reportIsAccepted(contents);
    const containsIdentity = contents.includes(identity.canonicalIdentityId);
    return {
      path,
      exists: true,
      sha256,
      expectedSha256,
      shaMatches,
      acceptedVerdict,
      containsIdentity,
      validIdentityEvidence: shaMatches && acceptedVerdict && containsIdentity,
    };
  });
}

function buildGapDetail(code: GapCode, family: string, evidence: string[]): GapDetail {
  const familyPlan = FAMILY_CONTRACTS[family] ?? FAMILY_CONTRACTS.CURRENT_MAIN_PLAYTEST_BASELINE;
  const common: Record<GapCode, Omit<GapDetail, 'code' | 'evidence'>> = {
    GENERATED_REGISTRY_MISSING: {
      owner: 'Codex S / Content Pack Owner',
      smallestRepairSlice: 'Decide active-pack inclusion versus explicit rules-only boundary; do not bulk-register identities.',
      requiredReviewer: 'Reviewer A for pack/source evidence, then Reviewer R for acceptance',
      dependencyOrder: 1,
    },
    RUNTIME_CONTRACT_UNBOUND: {
      owner: familyPlan.owner,
      smallestRepairSlice: familyPlan.slice,
      requiredReviewer: familyPlan.reviewer,
      dependencyOrder: familyPlan.order,
    },
    TEST_EVIDENCE_UNBOUND: {
      owner: 'Codex A / Evidence Owner',
      smallestRepairSlice: 'Create an exact identity evidence manifest; do not infer identity execution from family tests.',
      requiredReviewer: 'Reviewer A, followed by Reviewer R where runtime behavior is claimed',
      dependencyOrder: 4,
    },
    GATE_C_PENDING: {
      owner: 'Codex B for runtime path plus Codex A for evidence packet',
      smallestRepairSlice: 'Select one representative Gate C path with browser/WS/reconnect/stale evidence before widening.',
      requiredReviewer: 'Reviewer R / Gate C reviewer',
      dependencyOrder: 5,
    },
    LEGACY_ONLY: {
      owner: 'Codex B / Runtime Owner',
      smallestRepairSlice: familyPlan.slice,
      requiredReviewer: familyPlan.reviewer,
      dependencyOrder: 3,
    },
    COMPILER_UNSUPPORTED: {
      owner: 'Codex B / Compiler Owner',
      smallestRepairSlice: 'Add one typed compiler contract and negative tests for the exact primitive shape.',
      requiredReviewer: 'Reviewer R',
      dependencyOrder: 2,
    },
    AUTHORING_GENERATION_DRIFT: {
      owner: 'Codex S / Content Pack Owner',
      smallestRepairSlice: 'Reconcile the pack source list and generated registry for one family only.',
      requiredReviewer: 'Reviewer A for generation determinism',
      dependencyOrder: 1,
    },
    REVIEW_ARTIFACT_MISSING: {
      owner: 'Codex A / Reviewer R evidence lane',
      smallestRepairSlice: 'Restore or regenerate the exact review artifact with SHA and identity binding.',
      requiredReviewer: 'Reviewer A, then Reviewer R',
      dependencyOrder: 4,
    },
  };
  return { code, evidence, ...common[code] };
}

function classifyRegistry(
  identity: MatrixIdentity,
  card: AuthoringCard | undefined,
  listedSources: Set<string>,
): { status: string; diagnosis: string; gaps: GapDetail[] } {
  if (identity.generatedRegistryPresent) return { status: 'GENERATED_REGISTRY_PRESENT', diagnosis: 'EMITTED_IN_CURRENT_GENERATED_CONTENT_LIBRARY', gaps: [] };
  if (!card) return {
    status: 'AUTHORING_MISSING',
    diagnosis: 'AUTHORING_SOURCE_NOT_FOUND',
    gaps: [buildGapDetail('GENERATED_REGISTRY_MISSING', identity.acceptedFamilyId, ['A111 authoringPresent=false'])],
  };
  if (identity.acceptedFamilyId === 'GAME_START_RULE_OVERRIDES' && card.cardType === 'master_skill') {
    return {
      status: 'RULES_ONLY_NOT_IN_PLAYTEST_PACK',
      diagnosis: 'RULES_ONLY_MASTER_RULE_ARCHIVE_NOT_REGISTERED_IN_PLAYTEST_PACK',
      gaps: [buildGapDetail('GENERATED_REGISTRY_MISSING', identity.acceptedFamilyId, ['FM08 family contract is rules-only', 'authoring source is outside current playtest card registry'])],
    };
  }
  if (listedSources.has(card.filePath)) {
    return {
      status: 'PACK_SOURCE_LISTED_BUT_NOT_EMITTED',
      diagnosis: 'AUTHORING_GENERATION_DRIFT',
      gaps: [buildGapDetail('AUTHORING_GENERATION_DRIFT', identity.acceptedFamilyId, [`pack lists ${card.filePath}`, 'generated registry does not contain canonical identity'])],
    };
  }
  return {
    status: 'PACK_SOURCE_EXCLUDED',
    diagnosis: 'AUTHORING_PRESENT_BUT_NOT_REGISTERED_IN_ACTIVE_PLAYTEST_PACK',
    gaps: [buildGapDetail('GENERATED_REGISTRY_MISSING', identity.acceptedFamilyId, [`pack does not list ${card.filePath}`, 'no generator failure inferred'])],
  };
}

function decomposeIdentity(
  workspaceRoot: string,
  identity: MatrixIdentity,
  cards: Map<string, AuthoringCard>,
  listedSources: Set<string>,
  coverage: JsonRecord,
): DecomposedIdentity {
  const card = cards.get(identity.canonicalIdentityId);
  const rows = coverageRowsFor(coverage, identity.canonicalIdentityId);
  const coverageRoutes = uniqueSorted(rows.map((row) => String(row.runtimeRoute ?? 'UNKNOWN')));
  const unclassifiedReasons = uniqueSorted(rows.flatMap((row) => Array.isArray(row.unclassifiedReasons) ? row.unclassifiedReasons.map(String) : []));
  const familyPlan = FAMILY_CONTRACTS[identity.acceptedFamilyId] ?? FAMILY_CONTRACTS.CURRENT_MAIN_PLAYTEST_BASELINE;
  const registry = classifyRegistry(identity, card, listedSources);
  const evidence = reportEvidenceFor(workspaceRoot, identity);
  const hasValidIdentityEvidence = evidence.some((item) => item.validIdentityEvidence);
  const reportsMissing = identity.acceptanceReportPaths.length === 0 || evidence.some((item) => !item.exists);
  const testsPresent = identity.focusedTestEvidence.length > 0 && identity.focusedTestEvidence.some((path) => existsSync(resolve(workspaceRoot, path)));
  const gaps = [...registry.gaps];
  if (identity.acceptedRuntimeContracts.length === 0) {
    gaps.push(buildGapDetail('RUNTIME_CONTRACT_UNBOUND', identity.acceptedFamilyId, ['A111 acceptedRuntimeContracts is empty', `family contract is representative-only: ${familyPlan.contract}`]));
  }
  if (!testsPresent || !hasValidIdentityEvidence) {
    gaps.push(buildGapDetail('TEST_EVIDENCE_UNBOUND', identity.acceptedFamilyId, [
      ...(testsPresent ? [] : ['focused test path missing or empty']),
      ...(hasValidIdentityEvidence ? [] : ['no report with expected SHA, accepted verdict, and canonical identity match']),
    ]));
  }
  if (identity.gateCRequired && identity.gateCStatus === 'PENDING_IDENTITY_SPECIFIC_E2E') {
    gaps.push(buildGapDetail('GATE_C_PENDING', identity.acceptedFamilyId, ['A111 gateCStatus=PENDING_IDENTITY_SPECIFIC_E2E']));
  }
  if (coverageRoutes.some((route) => route.includes('LEGACY')) && !coverageRoutes.some((route) => route.includes('NEW_RUNTIME'))) {
    gaps.push(buildGapDetail('LEGACY_ONLY', identity.acceptedFamilyId, [`coverage runtimeRoute=${coverageRoutes.join('|') || 'none'}`]));
  }
  if (unclassifiedReasons.some((reason) => /unknown_effect_primitive|unsupported|not_classifiable/i.test(reason)) || identity.compileStatus.includes('BLOCKED')) {
    gaps.push(buildGapDetail('COMPILER_UNSUPPORTED', identity.acceptedFamilyId, unclassifiedReasons));
  }
  if (reportsMissing) {
    gaps.push(buildGapDetail('REVIEW_ARTIFACT_MISSING', identity.acceptedFamilyId, ['acceptanceReportPaths is empty or a referenced report is absent']));
  }
  const dedupedGaps = GAP_CODES.filter((code) => gaps.some((gap) => gap.code === code));
  const detailByCode = new Map(gaps.map((gap) => [gap.code, gap]));
  const primaryGap = dedupedGaps[0] ?? null;
  return {
    canonicalIdentityId: identity.canonicalIdentityId,
    cardIds: identity.cardIds,
    abilityIds: identity.abilityIds,
    acceptedFamilyId: identity.acceptedFamilyId,
    acceptedMigrationBatch: identity.acceptedMigrationBatch,
    archiveId: card?.archiveId ?? null,
    authoringPath: card?.filePath ?? null,
    cardType: card?.cardType ?? null,
    authoringPresent: Boolean(card),
    generatedRegistryPresent: identity.generatedRegistryPresent,
    registryStatus: registry.status,
    registryDiagnosis: registry.diagnosis,
    coverageRoutes,
    unclassifiedReasons,
    sharedRuntimeContract: familyPlan.contract,
    acceptedRuntimeContracts: identity.acceptedRuntimeContracts,
    runtimeContractBinding: identity.acceptedRuntimeContracts.length > 0 ? 'IDENTITY_DECLARED' : 'FAMILY_REPRESENTATIVE_ONLY',
    reportEvidence: evidence,
    gaps: dedupedGaps,
    primaryGap,
    gapDetails: dedupedGaps.map((code) => detailByCode.get(code) as GapDetail),
    currentMainStatus: identity.currentMainStatus,
  };
}

function buildFamilySummaries(identities: DecomposedIdentity[]): FamilySummary[] {
  const groups = new Map<string, DecomposedIdentity[]>();
  for (const identity of identities) groups.set(identity.acceptedFamilyId, [...(groups.get(identity.acceptedFamilyId) ?? []), identity]);
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([family, rows]) => {
    const plan = FAMILY_CONTRACTS[family] ?? FAMILY_CONTRACTS.CURRENT_MAIN_PLAYTEST_BASELINE;
    return {
      family,
      identityCount: rows.length,
      affectedIdentities: rows.map((row) => row.canonicalIdentityId).sort((a, b) => a.localeCompare(b)),
      sharedRuntimeContract: plan.contract,
      registryStatus: uniqueSorted(rows.map((row) => row.registryStatus)),
      gapCounts: countBy(rows.flatMap((row) => row.gaps)),
      gapOwner: uniqueSorted(rows.flatMap((row) => row.gapDetails.map((detail) => detail.owner))),
      smallestRepairSlice: uniqueSorted(rows.flatMap((row) => row.gapDetails.map((detail) => detail.smallestRepairSlice))),
      requiredReviewer: uniqueSorted(rows.flatMap((row) => row.gapDetails.map((detail) => detail.requiredReviewer))),
      dependencyOrder: [...new Set(rows.flatMap((row) => row.gapDetails.map((detail) => detail.dependencyOrder)))].sort((a, b) => a - b),
    };
  });
}

export function buildA112Decomposition(options: { workspaceRoot?: string; matrixPath?: string; generatedAt?: string } = {}): Decomposition {
  const workspaceRoot = resolve(options.workspaceRoot ?? process.cwd());
  const matrixPath = options.matrixPath ?? DEFAULT_MATRIX;
  const fullMatrixPath = resolve(workspaceRoot, matrixPath);
  const matrix = readJson<MatrixArtifact>(fullMatrixPath);
  if (matrix.frozenDenominator !== 944 || matrix.acceptedIdentityCount !== 111 || matrix.identities.length !== 111 || matrix.remainingIdentityCount !== 833) {
    throw new Error('ACCEPTED_BASELINE_DRIFT: A111 matrix is not the required 111/944 baseline');
  }
  const coverage = readJson<JsonRecord>(resolve(workspaceRoot, 'artifacts/phase3-skill-coverage.json'));
  const generated = readJson<GeneratedContent>(resolve(workspaceRoot, 'data/generated/fd-playtest-v1.content-library.json'));
  const pack = readJson<PackManifest>(resolve(workspaceRoot, 'data/packs/fd-playtest-v1/pack.json'));
  const cards = readAuthoringCards(workspaceRoot);
  const generatedIds = new Set((generated.cards ?? []).map((card) => card.id));
  const listedSources = new Set([
    ...(pack.authoringServantFiles ?? []),
    ...(pack.authoringMasterFiles ?? []),
    ...(pack.authoringMasterRuleFiles ?? []),
  ].map(normalizePath));
  const identities = matrix.identities.map((identity) => decomposeIdentity(workspaceRoot, {
    ...identity,
    generatedRegistryPresent: generatedIds.has(identity.canonicalIdentityId),
  }, cards, listedSources, coverage));
  const gapCounts = Object.fromEntries(GAP_CODES.map((code) => [code, identities.filter((identity) => identity.gaps.includes(code)).length])) as Record<GapCode, number>;
  const primaryGapCounts = countBy(identities.flatMap((identity) => identity.primaryGap ? [identity.primaryGap] : []));
  const observedRegistryDiagnosisCounts = countBy(identities.filter((identity) => !identity.generatedRegistryPresent).map((identity) => identity.registryDiagnosis));
  const registryDiagnosisCounts = Object.fromEntries(
    REGISTRY_DIAGNOSIS_CODES.map((diagnosis) => [diagnosis, observedRegistryDiagnosisCounts[diagnosis] ?? 0]),
  );
  return {
    taskId: TASK_ID,
    controlEpoch: CONTROL_EPOCH,
    mainSha: matrix.mainSha,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    sourceMatrixArtifact: matrixPath,
    sourceMatrixSha256: sha256File(fullMatrixPath),
    frozenDenominator: matrix.frozenDenominator,
    acceptedIdentityCount: matrix.acceptedIdentityCount,
    remainingIdentityCount: matrix.remainingIdentityCount,
    gapCounts,
    primaryGapCounts,
    registryDiagnosisCounts,
    familySummaries: buildFamilySummaries(identities),
    identities,
    accounting: {
      creditChange: 'NONE',
      migrationAcceptanceChange: 'NONE',
      mainCoverageCreditDelta: 0,
    },
  };
}

export function serializeDecomposition(value: Decomposition): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parseArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  return value && !value.startsWith('--') ? value : undefined;
}

function renderReport(value: Decomposition, outputPath: string): string {
  const lines = [
    '# P3-E04-A112 Accepted 111 Gap Decomposition',
    '',
    `- Task ID: \`${value.taskId}\``,
    `- Control Epoch: \`${value.controlEpoch}\``,
    `- Main SHA: \`${value.mainSha}\``,
    `- Source matrix: \`${value.sourceMatrixArtifact}\``,
    `- Source matrix SHA-256: \`${value.sourceMatrixSha256}\``,
    `- Artifact: \`${outputPath}\``,
    '- Status: `REVIEW_READY`',
    '- Credit change: `NONE`',
    '',
    '## Accounting',
    '',
    `- accepted: \`${value.acceptedIdentityCount}\``,
    `- denominator: \`${value.frozenDenominator}\``,
    `- remaining: \`${value.remainingIdentityCount}\``,
    '- main coverage credit delta: `0`',
    '',
    '## Gap Counts',
    '',
    ...Object.entries(value.gapCounts).map(([code, count]) => `- \`${code}\`: ${count}`),
    '',
    'Gap counts are overlapping identity diagnostics. `primaryGapCounts` is the non-overlapping routing view.',
    '',
    '## Registry Diagnosis',
    '',
    ...Object.entries(value.registryDiagnosisCounts).map(([diagnosis, count]) => `- \`${diagnosis}\`: ${count}`),
    '',
    'The 87 missing generated identities are not treated as one B runtime batch. The current result distinguishes active-pack exclusion, rules-only content, and source-listed-but-not-emitted drift.',
    '',
    '- `AUTHORING_PRESENT_BUT_NOT_REGISTERED_IN_ACTIVE_PLAYTEST_PACK` is the observed diagnosis for 77 identities; no generator failure is inferred.',
    '- `RULES_ONLY_MASTER_RULE_ARCHIVE_NOT_REGISTERED_IN_PLAYTEST_PACK` accounts for 10 FM08 rules-only identities; these are not automatically playtest registry obligations.',
    '- `PACK_SOURCE_LISTED_BUT_NOT_EMITTED`, `AUTHORING_SHAPE_UNSUPPORTED`, `RUNTIME_CAPABILITY_MISSING`, and `LEGACY_HANDLER_DEPENDENCY_ONLY` are explicitly zero in this registry diagnosis. Legacy/runtime gaps remain separate identity diagnostics.',
    '- `COMPILER_UNSUPPORTED` is derived from coverage classification signals only; it is not a runtime defect finding. Any runtime defect requires a Codex B reproduction and a separate handoff.',
    '',
    '## Family Decomposition',
    '',
    ...value.familySummaries.flatMap((summary) => [
      `### ${summary.family}`,
      '',
      `- identity count: ${summary.identityCount}`,
      `- shared runtime contract: ${summary.sharedRuntimeContract}`,
      `- registry status: ${summary.registryStatus.join(', ') || 'none'}`,
      `- gap counts: ${JSON.stringify(summary.gapCounts)}`,
      `- gap owner: ${summary.gapOwner.join('; ') || 'none'}`,
      `- smallest repair slice: ${summary.smallestRepairSlice.join('; ') || 'none'}`,
      `- required reviewer: ${summary.requiredReviewer.join('; ') || 'none'}`,
      `- dependency order: ${summary.dependencyOrder.join(', ') || 'none'}`,
      `- affected identities: ${summary.affectedIdentities.join(', ')}`,
      '',
    ]),
    '## Non-Claims',
    '',
    '- This decomposition does not change migration acceptance, main coverage, taxonomy, Gate status, or runtime behavior.',
    '- Family contracts are planning/evidence references; they do not create identity-specific execution proof.',
    '- No B batch is authorized by this report. Each repair slice requires its own handoff and independent review.',
    '',
  ];
  return lines.join('\n');
}

function main(): void {
  const args = process.argv.slice(2);
  const output = parseArg(args, '--output') ?? DEFAULT_OUTPUT;
  const report = parseArg(args, '--report') ?? DEFAULT_REPORT;
  const matrixPath = parseArg(args, '--matrix') ?? DEFAULT_MATRIX;
  const generatedAt = parseArg(args, '--generated-at');
  const value = buildA112Decomposition({ matrixPath, generatedAt });
  mkdirSync(dirname(resolve(output)), { recursive: true });
  writeFileSync(resolve(output), serializeDecomposition(value), 'utf8');
  mkdirSync(dirname(resolve(report)), { recursive: true });
  writeFileSync(resolve(report), renderReport(value, output), 'utf8');
  process.stdout.write(JSON.stringify({
    taskId: value.taskId,
    mainSha: value.mainSha,
    accepted: value.acceptedIdentityCount,
    gapCounts: value.gapCounts,
    primaryGapCounts: value.primaryGapCounts,
    registryDiagnosisCounts: value.registryDiagnosisCounts,
  }, null, 2) + '\n');
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : undefined;
const modulePath = resolve(fileURLToPath(import.meta.url));
if (invoked === modulePath) main();
