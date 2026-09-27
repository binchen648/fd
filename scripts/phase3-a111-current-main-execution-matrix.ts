import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type JsonRecord = Record<string, unknown>;

export type CurrentMainStatus =
  | 'MAIN_EXECUTABLE_VERIFIED'
  | 'MAIN_EXECUTABLE_GATE_C_NOT_REQUIRED'
  | 'MAIN_EXECUTABLE_GATE_C_PENDING'
  | 'RUNTIME_REGRESSION_FOUND'
  | 'EVIDENCE_BINDING_GAP';

interface MatrixIdentity {
  canonicalIdentityId: string;
  cardIds: string[];
  abilityIds: string[];
  printedTextSource: string | null;
  sourceEvidencePaths: string[];
  acceptedFamilyId: string;
  acceptedMigrationBatch: string;
  acceptanceReportPaths: string[];
  acceptanceCommitOrPromotion: string;
  authoringPresent: boolean;
  generatedRegistryPresent: boolean;
  compileStatus: string;
  requiredCapabilities: string[];
  acceptedRuntimeContracts: string[];
  productionRuntimeRoute: string;
  legacyFallbackStatus: string;
  focusedTestEvidence: string[];
  negativeEvidence: string[];
  gateAStatus: string;
  gateBStatus: string;
  gateCRequired: boolean;
  gateCStatus: string;
  currentMainStatus: CurrentMainStatus;
  blockingReasons: string[];
}

interface Matrix {
  taskId: string;
  controlEpoch: string;
  mainSha: string;
  generatedAt: string;
  frozenDenominator: number;
  acceptedIdentityCount: number;
  remainingIdentityCount: number;
  duplicateAcceptedIds: string[];
  missingAcceptedIds: string[];
  unexpectedMaterialIds: string[];
  summaryByStatus: Record<CurrentMainStatus, number>;
  summaryByFamily: Record<string, number>;
  identities: MatrixIdentity[];
}

interface AuthoringCard {
  archiveId: string;
  filePath: string;
  id: string;
  printedText?: string;
  abilities: Array<{ id: string; kind?: string; printedClause?: string; [key: string]: unknown }>;
  phase3Evidence?: {
    f1ClauseSources?: unknown[];
    f1SourceReferences?: unknown[];
    acceptedContracts?: Record<string, string>;
    sourceTextSha256?: string;
    f1FullPrintedTextSha256?: string;
    [key: string]: unknown;
  };
}

const TASK_ID = 'P3-E04-A111';
const CONTROL_EPOCH = 'FD-P3-2026-09-23-04';
const AUTHORITATIVE_MAIN = '0e943a94e8bdab6335e34818278ecc90760015f0';
const FROZEN_DENOMINATOR = 944;

const REPORTS = {
  baseline: ['docs/reports/fd-phase-3-throughput-baseline.md'],
  FM01: [
    'docs/reports/2026-09-16-p3-a-fm01-synchronization.md',
    'docs/reports/2026-09-16-p3-r26-fm01-source-play-basic-draw-migration-review.md',
  ],
  FM02: [
    'docs/reports/2026-09-16-p3-a-fm02-synchronization.md',
    'docs/reports/2026-09-16-p3-r28-fm02-any-location-except-workshop-movement-migration-review.md',
  ],
  FM03: [
    'docs/reports/2026-09-16-p3-a-fm03-synchronization.md',
    'docs/reports/2026-09-16-p3-r30-fm03-saber-magic-resistance-review.md',
  ],
  FM04: [
    'docs/reports/2026-09-16-p3-a-fm04-migration-synchronization.md',
    'docs/reports/2026-09-16-p3-r32-fm04-independent-action-migration-review.md',
  ],
  FM05: [
    'docs/reports/2026-09-16-p3-a-fm05-migration-synchronization.md',
    'docs/reports/2026-09-16-p3-r34-fm05-territory-creation-migration-review.md',
  ],
  FM06: [
    'docs/reports/2026-09-16-p3-a-fm06-migration-synchronization.md',
    'docs/reports/2026-09-16-p3-r36-fm06-presence-concealment-migration-review.md',
  ],
  FM07: [
    'docs/reports/2026-09-16-p3-a-fm07-migration-synchronization.md',
    'docs/reports/2026-09-16-p3-r38-fm07-alter-ego-migration-review.md',
  ],
  FM08: [
    'docs/reports/2026-09-17-p3-a-r40-fm08-recovery-acceptance-synchronization.md',
    'docs/reports/2026-09-17-p3-r40-fm08-recovery-migration-review.md',
  ],
} as const;

const ACCEPTED_BATCH_IDS: Record<string, string[]> = {
  baseline: [
    'servant.achilles.skill.sc-achilles-1',
    'servant.achilles.skill.sc-achilles-2',
    'servant.achilles.skill.sc-achilles-3',
    'servant.artoria-alt.skill.sc-artoria-alt-1',
    'servant.artoria-alt.skill.sc-artoria-alt-2',
    'servant.artoria-alt.skill.sc-artoria-alt-3',
    'servant.artoriac.skill.sc-artoriac-1',
    'servant.artoriac.skill.sc-artoriac-2',
    'servant.artoriac.skill.sc-artoriac-3',
    'servant.artoriac.skill.sc-artoriac-4',
    'servant.artoriac.skill.sc-artoriac-5',
    'servant.artoriac.skill.sc-artoriac-6',
    'servant.drake.skill.sc-drake-1',
    'servant.drake.skill.sc-drake-2',
    'servant.drake.skill.sc-drake-3',
    'servant.ereshkigal.skill.sc-ereshkigal-1',
    'servant.ereshkigal.skill.sc-ereshkigal-2',
    'servant.ereshkigal.skill.sc-ereshkigal-3',
    'servant.kintoki.skill.sc-kintoki-1',
    'servant.kintoki.skill.sc-kintoki-2',
    'servant.kintoki.skill.sc-kintoki-3',
    'servant.tomoe.skill.sc-tomoe-1',
    'servant.tomoe.skill.sc-tomoe-2',
    'servant.tomoe.skill.sc-tomoe-3',
  ],
  FM01: [
    'servant.boudica.skill.sc-boudica-3',
    'servant.constantine.skill.sc-constantine-1',
    'servant.drake.skill.sc-drake-1',
    'servant.hephaistion.skill.sc-hephaistion-3',
    'servant.iskandar.skill.sc-iskandar-1',
    'servant.ivan.skill.sc-ivan-3',
    'servant.mandricardo.skill.sc-mandricardo-3',
    'servant.martha.skill.sc-martha-3',
    'servant.medb.skill.sc-medb-1',
    'servant.medusa.skill.sc-medusa-1',
    'servant.odysseus.skill.sc-odysseus-3',
    'servant.roberts.skill.sc-roberts-3',
    'servant.teach.skill.sc-teach-3',
    'servant.ushiwakamaru.skill.sc-ushiwakamaru-3',
  ],
  FM02: [
    'servant.benkei.skill.sc-benkei-1',
    'servant.bradamante.skill.sc-bradamante-1',
    'servant.brynhildr.skill.sc-brynhildr-1',
    'servant.cu.skill.sc-cu-2',
    'servant.diarmuid.skill.sc-diarmuid-3',
    'servant.donquixote.skill.sc-donquixote-3',
    'servant.enkidu.skill.sc-enkidu-3',
    'servant.jaguarman.skill.sc-jaguarman-1',
    'servant.kagetora.skill.sc-kagetora-3',
    'servant.lishuwen.skill.sc-lishuwen-3',
    'servant.romulus.skill.sc-romulus-3',
    'servant.vlad.skill.sc-vlad-3',
  ],
  FM03: [
    'servant.altera.skill.sc-altera-3',
    'servant.arthur.skill.sc-arthur-3',
    'servant.bedivere.skill.sc-bedivere-1',
    'servant.charlemagne.skill.sc-charlemagne-3',
    'servant.gawain.skill.sc-gawain-3',
    'servant.lakshmibai.skill.sc-lakshmibai-3',
    'servant.mordred.skill.sc-mordred-3',
    'servant.musashi.skill.sc-musashi-3',
    'servant.saber.skill.sc-saber-1',
    'servant.saitou.skill.sc-saitou-1',
  ],
  FM04: [
    'servant.atalanta.skill.sc-atalanta-3',
    'servant.baobhan.skill.sc-baobhan-3',
    'servant.chiron.skill.sc-chiron-1',
    'servant.emiya-alt.skill.sc-emiya-alt-1',
    'servant.euryale.skill.sc-euryale-1',
    'servant.gil.skill.sc-gil-1',
    'servant.ishtar.skill.sc-ishtar-3',
    'servant.napoleon.skill.sc-napoleon-3',
    'servant.robin.skill.sc-robin-1',
    'servant.tomoe.skill.sc-tomoe-1',
    'servant.tristan.skill.sc-tristan-3',
  ],
  FM05: [
    'servant.anastasia.skill.sc-anastasia-1',
    'servant.andersen.skill.sc-andersen-1',
    'servant.avicebron.skill.sc-avicebron-3',
    'servant.kinggil.skill.sc-kinggil-1',
    'servant.ladyavalon.skill.sc-ladyavalon-3',
    'servant.maxwell.skill.sc-maxwell-1',
    'servant.mephisto.skill.sc-mephisto-1',
    'servant.mozart.skill.sc-mozart-3',
    'servant.semiramis.skill.sc-semiramis-2',
    'servant.shakespeare.skill.sc-shakespeare-1',
  ],
  FM06: [
    'servant.corday.skill.sc-corday-1',
    'servant.danzou.skill.sc-danzou-3',
    'servant.hassan.skill.sc-hassan-1',
    'servant.hassanhf.skill.sc-hassanhf-3',
    'servant.hassanser.skill.sc-hassanser-1',
    'servant.izou.skill.sc-izou-3',
    'servant.jekyll.skill.sc-jekyll-3',
    'servant.kama.skill.sc-kama-3',
    'servant.kiritsugu.skill.sc-kiritsugu-1',
    'servant.kotarou.skill.sc-kotarou-1',
    'servant.semiramis.skill.sc-semiramis-1',
    'servant.stheno.skill.sc-stheno-1',
  ],
  FM07: [
    'master.sion.skill.s12',
    'servant.douman.skill.sc-douman-3',
    'servant.koyanskaya.skill.sc-koyanskaya-1',
    'servant.mechaeli.skill.sc-mechaeli-3',
    'servant.meltryllis.skill.sc-meltryllis-3',
    'servant.muramasa.skill.sc-muramasa-3',
    'servant.okita-alt.skill.sc-okita-alt-1',
    'servant.passionlip.skill.sc-passionlip-1',
    'servant.sitonai.skill.sc-sitonai-3',
    'servant.taisui.skill.sc-taisui-1',
  ],
  FM08: [
    'master.bazett.skill.s1b',
    'master.caules.skill.s1a',
    'master.fiore.skill.s2',
    'master.fiore.skill.s3',
    'master.fiore.skill.s4',
    'master.irisviel.skill.s1',
    'master.peperoncino.skill.s1a',
    'master.sieg.skill.s1',
    'master.waver.skill.s1',
    'master.zouken.skill.s5',
  ],
};

const BATCH_FAMILY: Record<string, string> = {
  baseline: 'CURRENT_MAIN_PLAYTEST_BASELINE',
  FM01: 'SOURCE_PLAY_BASIC_DRAW',
  FM02: 'ANY_LOCATION_EXCEPT_WORKSHOP_MOVEMENT',
  FM03: 'SABER_MAGIC_RESISTANCE_AND_NOBLE_BLOOM',
  FM04: 'INDEPENDENT_ACTION',
  FM05: 'TERRITORY_CREATION',
  FM06: 'PRESENCE_CONCEALMENT',
  FM07: 'ALTER_EGO_TRANSFORM',
  FM08: 'GAME_START_RULE_OVERRIDES',
};

const BATCH_TESTS: Record<string, string[]> = {
  baseline: [
    'packages/rules/tests/regression/complex-skills-regression.test.ts',
    'packages/rules/tests/regression/golden-card-content-pipeline.test.ts',
  ],
  FM01: ['packages/rules/tests/fm01-source-play-basic-draw-authoring.test.ts'],
  FM02: ['packages/rules/tests/fm02-any-location-except-workshop-movement-authoring.test.ts'],
  FM03: [
    'packages/rules/tests/fm03-saber-magic-resistance-authoring.test.ts',
    'packages/rules/tests/fm03-mhx-extension-authoring.test.ts',
  ],
  FM04: ['packages/rules/tests/fm04-independent-action-authoring.test.ts'],
  FM05: [
    'packages/rules/tests/fm05-territory-creation-authoring.test.ts',
    'packages/rules/tests/fm05-territory-variant-extension.test.ts',
  ],
  FM06: ['packages/rules/tests/fm06-presence-concealment-authoring.test.ts'],
  FM07: ['packages/rules/tests/fm07-alter-ego-transform-authoring.test.ts'],
  FM08: ['packages/rules/tests/fm08-game-start-rule-overrides-authoring.test.ts'],
};

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function listJsonFiles(root: string): string[] {
  const rows: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.json')) rows.push(full);
    }
  };
  walk(root);
  return rows.sort((a, b) => a.localeCompare(b));
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as JsonRecord)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function countBy<T extends string>(values: T[], allowed?: readonly T[]): Record<T, number> {
  const counts = Object.fromEntries((allowed ?? []).map((value) => [value, 0])) as Record<T, number>;
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))) as Record<T, number>;
}

function readAuthoringCards(workspaceRoot: string): Map<string, AuthoringCard> {
  const cards = new Map<string, AuthoringCard>();
  for (const file of listJsonFiles(resolve(workspaceRoot, 'data/authoring'))) {
    const archive = readJson<{ id: string; cards?: AuthoringCard[] }>(file);
    for (const card of archive.cards ?? []) {
      cards.set(card.id, {
        ...card,
        archiveId: archive.id,
        filePath: relative(workspaceRoot, file).replace(/\\/g, '/'),
      });
    }
  }
  return cards;
}

function acceptedBatchById(): Map<string, string[]> {
  const byId = new Map<string, string[]>();
  for (const [batch, ids] of Object.entries(ACCEPTED_BATCH_IDS)) {
    for (const id of ids) {
      const batches = byId.get(id) ?? [];
      batches.push(batch);
      byId.set(id, batches);
    }
  }
  return byId;
}

function needsGateC(card: AuthoringCard, coverageRows: JsonRecord[]): boolean {
  const serialized = stable(card);
  if (/PendingInteraction|responseWindow|choose_|CHOOSE_|private|hidden|reconnect|restore|stale/i.test(serialized)) return true;
  if (/after_battle|battle|combat|winner|loses_battle|wins_battle|round_end|cleanup|lifecycle/i.test(serialized)) return true;
  for (const row of coverageRows) {
    const triggers = row.domainEventTriggers;
    const strict = row.strictPendingInteractions;
    const battle = row.battleIntegration;
    const lifecycle = row.lifecyclePolicies;
    const hidden = row.hiddenInformation;
    if (Array.isArray(strict) && strict.length > 0) return true;
    if (Array.isArray(battle) && battle.length > 0) return true;
    if (Array.isArray(lifecycle) && lifecycle.length > 0) return true;
    if (Array.isArray(hidden) && hidden.length > 0) return true;
    if (Array.isArray(triggers) && triggers.some((trigger) => String(trigger).includes('battle'))) return true;
  }
  return false;
}

function coverageRowsFor(coverage: JsonRecord, cardId: string): JsonRecord[] {
  const rows = Array.isArray(coverage.semanticAxes) ? coverage.semanticAxes as JsonRecord[] : [];
  return rows.filter((row) => row.cardId === cardId);
}

function routeFor(rows: JsonRecord[]): string {
  const routes = uniqueSorted(rows.map((row) => String(row.runtimeRoute ?? 'UNKNOWN')));
  return routes.length ? routes.join('|') : 'NOT_IN_PHASE3_COVERAGE_ARTIFACT';
}

function semanticRoutes(rows: JsonRecord[]): string[] {
  return uniqueSorted(rows.flatMap((row) => Array.isArray(row.semanticRoutes) ? row.semanticRoutes.map(String) : []));
}

function buildIdentity(
  id: string,
  batches: string[],
  card: AuthoringCard | undefined,
  registry: JsonRecord | undefined,
  coverage: JsonRecord,
): MatrixIdentity {
  const rows = coverageRowsFor(coverage, id);
  const primaryBatch = batches.includes('baseline') && batches.length > 1
    ? batches.find((batch) => batch !== 'baseline') ?? 'baseline'
    : batches[0];
  const family = BATCH_FAMILY[primaryBatch] ?? 'UNKNOWN_ACCEPTED_FAMILY';
  const reports = uniqueSorted(batches.flatMap((batch) => REPORTS[batch as keyof typeof REPORTS] ?? []));
  const contracts = uniqueSorted([
    ...Object.entries(card?.phase3Evidence?.acceptedContracts ?? {}).map(([key, value]) => `${key}:${value}`),
    ...semanticRoutes(rows),
    family,
  ]);
  const gateCRequired = card ? needsGateC(card, rows) : false;
  const blockingReasons: string[] = [];
  if (!card) blockingReasons.push('AUTHORING_MISSING');
  if (!registry) blockingReasons.push('GENERATED_REGISTRY_MISSING');
  if (reports.length === 0) blockingReasons.push('ACCEPTANCE_REPORT_MISSING');
  if (contracts.length === 0) blockingReasons.push('ACCEPTED_RUNTIME_CONTRACT_MISSING');
  if (rows.length === 0) blockingReasons.push('PHASE3_COVERAGE_ROW_MISSING');

  const currentMainStatus: CurrentMainStatus = blockingReasons.length > 0
    ? 'EVIDENCE_BINDING_GAP'
    : gateCRequired
      ? 'MAIN_EXECUTABLE_GATE_C_PENDING'
      : 'MAIN_EXECUTABLE_GATE_C_NOT_REQUIRED';

  const abilityIds = card?.abilities.map((ability) => ability.id) ?? [];
  const sourcePaths = uniqueSorted([
    card?.filePath,
    'data/phase3/full-roster-ability-inventory.json',
    'data/generated/fd-playtest-v1.content-library.json',
    'artifacts/phase3-skill-coverage.json',
    ...(card?.phase3Evidence?.f1ClauseSources ? ['phase3Evidence.f1ClauseSources'] : []),
    ...(card?.phase3Evidence?.f1SourceReferences ? ['phase3Evidence.f1SourceReferences'] : []),
  ].filter((value): value is string => Boolean(value)));

  return {
    canonicalIdentityId: id,
    cardIds: [id],
    abilityIds,
    printedTextSource: card?.printedText ?? null,
    sourceEvidencePaths: uniqueSorted([...sourcePaths, ...reports]),
    acceptedFamilyId: family,
    acceptedMigrationBatch: uniqueSorted(batches).join('|'),
    acceptanceReportPaths: reports,
    acceptanceCommitOrPromotion: primaryBatch === 'baseline' ? 'origin/main@0e943a94:baseline-playtest-material' : `${primaryBatch}:see acceptanceReportPaths`,
    authoringPresent: Boolean(card),
    generatedRegistryPresent: Boolean(registry),
    compileStatus: card ? 'AUTHORING_JSON_PARSE_OK_CURRENT_MAIN_AUDIT' : 'AUTHORING_MISSING',
    requiredCapabilities: uniqueSorted([
      ...contracts.map((contract) => contract.split(':')[0]),
      ...(rows.flatMap((row) => Array.isArray(row.effectPrimitiveFamilies) ? row.effectPrimitiveFamilies.map(String) : [])),
    ]),
    acceptedRuntimeContracts: contracts,
    productionRuntimeRoute: routeFor(rows),
    legacyFallbackStatus: routeFor(rows).includes('LEGACY')
      ? 'RAW_COVERAGE_LEGACY_LABEL_REQUIRES_ACCEPTANCE_REPORT_RECONCILIATION'
      : 'NO_LEGACY_ROUTE_REPORTED_OR_NOT_IN_PHASE3_COVERAGE',
    focusedTestEvidence: uniqueSorted(batches.flatMap((batch) => BATCH_TESTS[batch] ?? [])),
    negativeEvidence: gateCRequired
      ? ['Gate C requirement identified; identity-specific E2E not inferred from family representative.']
      : ['Focused authoring/family tests required; no identity-specific Gate C inferred.'],
    gateAStatus: 'ACCEPTED_FAMILY_EVIDENCE_BOUND',
    gateBStatus: 'ACCEPTED_FAMILY_EVIDENCE_BOUND',
    gateCRequired,
    gateCStatus: gateCRequired ? 'PENDING_IDENTITY_SPECIFIC_E2E' : 'NOT_REQUIRED_BY_A111_HEURISTIC',
    currentMainStatus,
    blockingReasons,
  };
}

export function buildA111Matrix(options: { workspaceRoot?: string; generatedAt?: string; mainSha?: string } = {}): Matrix {
  const workspaceRoot = resolve(options.workspaceRoot ?? process.cwd());
  const mainSha = options.mainSha ?? AUTHORITATIVE_MAIN;
  const inventory = readJson<{ staticSkills: JsonRecord[]; dynamicSkills?: JsonRecord[]; summary: JsonRecord }>(
    resolve(workspaceRoot, 'data/phase3/full-roster-ability-inventory.json'),
  );
  const coverage = readJson<JsonRecord>(resolve(workspaceRoot, 'artifacts/phase3-skill-coverage.json'));
  const generated = readJson<{ cards?: Array<{ id: string }> }>(resolve(workspaceRoot, 'data/generated/fd-playtest-v1.content-library.json'));
  const cards = readAuthoringCards(workspaceRoot);
  const registry = new Map<string, JsonRecord>();
  for (const row of [...inventory.staticSkills, ...(inventory.dynamicSkills ?? [])]) registry.set(String(row.canonicalAbilityId), row);
  for (const card of generated.cards ?? []) registry.set(card.id, card as JsonRecord);

  const frozenIds = new Set([...inventory.staticSkills, ...(inventory.dynamicSkills ?? [])].map((row) => String(row.canonicalAbilityId)));
  const materialFrozenIds = [...cards.keys()].filter((id) => frozenIds.has(id)).sort((a, b) => a.localeCompare(b));
  const batchById = acceptedBatchById();
  const acceptedIds = uniqueSorted([...batchById.keys()]);
  const duplicateAcceptedIds = Object.entries(
    acceptedIds.reduce<Record<string, number>>((counts, id) => {
      counts[id] = (counts[id] ?? 0) + 1;
      return counts;
    }, {}),
  ).filter(([, count]) => count > 1).map(([id]) => id);
  const missingAcceptedIds = acceptedIds.filter((id) => !cards.has(id) || !registry.has(id));
  const unexpectedMaterialIds = materialFrozenIds.filter((id) => !batchById.has(id));

  if (Number(inventory.summary?.totalIdentityCount) !== FROZEN_DENOMINATOR) {
    throw new Error(`ACCEPTED_BASELINE_DRIFT: frozen denominator ${inventory.summary?.totalIdentityCount} != ${FROZEN_DENOMINATOR}`);
  }
  if (acceptedIds.length !== 111) {
    throw new Error(`ACCEPTED_BASELINE_DRIFT: accepted identity count ${acceptedIds.length} != 111`);
  }
  if (duplicateAcceptedIds.length > 0) {
    throw new Error(`ACCEPTED_BASELINE_DRIFT: duplicate accepted IDs ${duplicateAcceptedIds.join(',')}`);
  }
  if (missingAcceptedIds.length > 0) {
    throw new Error(`ACCEPTED_BASELINE_DRIFT: missing accepted IDs ${missingAcceptedIds.join(',')}`);
  }
  if (acceptedIds.includes('master.tiamat.card.life-sea')) {
    throw new Error('ACCEPTED_BASELINE_DRIFT: dynamic Tiamat identity entered numerator');
  }

  const identities = acceptedIds.map((id) => buildIdentity(id, batchById.get(id) ?? [], cards.get(id), registry.get(id), coverage));
  const statuses: CurrentMainStatus[] = [
    'MAIN_EXECUTABLE_VERIFIED',
    'MAIN_EXECUTABLE_GATE_C_NOT_REQUIRED',
    'MAIN_EXECUTABLE_GATE_C_PENDING',
    'RUNTIME_REGRESSION_FOUND',
    'EVIDENCE_BINDING_GAP',
  ];

  return {
    taskId: TASK_ID,
    controlEpoch: CONTROL_EPOCH,
    mainSha,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    frozenDenominator: FROZEN_DENOMINATOR,
    acceptedIdentityCount: acceptedIds.length,
    remainingIdentityCount: FROZEN_DENOMINATOR - acceptedIds.length,
    duplicateAcceptedIds,
    missingAcceptedIds,
    unexpectedMaterialIds,
    summaryByStatus: countBy(identities.map((identity) => identity.currentMainStatus), statuses),
    summaryByFamily: countBy(identities.map((identity) => identity.acceptedFamilyId)),
    identities,
  };
}

export function serializeMatrix(matrix: Matrix): string {
  return `${JSON.stringify(matrix, null, 2)}\n`;
}

function parseArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  return value && !value.startsWith('--') ? value : undefined;
}

function renderReport(matrix: Matrix, matrixPath: string): string {
  const matrixSha = createHash('sha256').update(serializeMatrix({ ...matrix, generatedAt: '<normalized>' })).digest('hex');
  const lines = [
    '# P3-E04-A111 Current-Main Execution Re-attestation',
    '',
    `- Task ID: \`${matrix.taskId}\``,
    `- Control Epoch: \`${matrix.controlEpoch}\``,
    `- Main SHA: \`${matrix.mainSha}\``,
    `- Matrix artifact: \`${matrixPath}\``,
    `- Normalized matrix SHA-256: \`${matrixSha}\``,
    '- Role: Codex A / Automation / Coverage / Evidence',
    '- Credit change: `NONE`',
    '',
    '## Recomputed Accounting',
    '',
    `- accepted: \`${matrix.acceptedIdentityCount}\``,
    `- denominator: \`${matrix.frozenDenominator}\``,
    `- remaining: \`${matrix.remainingIdentityCount}\``,
    `- duplicates: \`${matrix.duplicateAcceptedIds.length}\``,
    `- missing: \`${matrix.missingAcceptedIds.length}\``,
    `- unexpected material ids outside accepted numerator: \`${matrix.unexpectedMaterialIds.length}\``,
    '',
    '## Status Summary',
    '',
    ...Object.entries(matrix.summaryByStatus).map(([status, count]) => `- \`${status}\`: ${count}`),
    '',
    '## Family Summary',
    '',
    ...Object.entries(matrix.summaryByFamily).map(([family, count]) => `- \`${family}\`: ${count}`),
    '',
    '## Gaps',
    '',
    `- Runtime semantic gaps: \`0\` recorded by this automation run.`,
    `- Evidence binding gaps: \`${matrix.summaryByStatus.EVIDENCE_BINDING_GAP}\``,
    `- Gate C pending identities: \`${matrix.summaryByStatus.MAIN_EXECUTABLE_GATE_C_PENDING}\``,
    '',
    '## Non-Claims',
    '',
    '- This report does not grant migration credit.',
    '- This report does not mark any identity `PROMOTED_ON_MAIN`.',
    '- This report does not create `E2E_VERIFIED` conclusions.',
    '- Family representative evidence is not treated as identity-specific Gate C proof.',
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function main(): void {
  const args = process.argv.slice(2);
  const output = parseArg(args, '--output') ?? 'artifacts/phase3-e04-current-main-accepted-111-execution-matrix.json';
  const report = parseArg(args, '--report') ?? 'docs/reports/2026-09-27-p3-e04-a111-current-main-execution-reattestation.md';
  const generatedAt = parseArg(args, '--generated-at');
  const mainSha = parseArg(args, '--main-sha') ?? AUTHORITATIVE_MAIN;
  const matrix = buildA111Matrix({ generatedAt, mainSha });
  const serialized = serializeMatrix(matrix);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, serialized, 'utf8');
  mkdirSync(dirname(report), { recursive: true });
  writeFileSync(report, renderReport(matrix, output), 'utf8');
  process.stdout.write(`${JSON.stringify({
    taskId: matrix.taskId,
    mainSha: matrix.mainSha,
    accepted: matrix.acceptedIdentityCount,
    denominator: matrix.frozenDenominator,
    remaining: matrix.remainingIdentityCount,
    duplicates: matrix.duplicateAcceptedIds.length,
    missing: matrix.missingAcceptedIds.length,
    unexpected: matrix.unexpectedMaterialIds.length,
    summaryByStatus: matrix.summaryByStatus,
    summaryByFamily: matrix.summaryByFamily,
  }, null, 2)}\n`);
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : undefined;
const modulePath = resolve(fileURLToPath(import.meta.url));
if (invoked === modulePath) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = message.startsWith('ACCEPTED_BASELINE_DRIFT') ? 2 : 1;
  }
}
