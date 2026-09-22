import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyAbilityForCoverage } from './phase3-coverage';

type JsonObject = Record<string, unknown>;

interface PackManifest {
  authoringMasterFiles?: string[];
  authoringServantFiles?: string[];
}

interface AuthoringAbility extends JsonObject {
  id: string;
  printedClause?: string;
}

interface AuthoringCard extends JsonObject {
  id: string;
  abilities?: AuthoringAbility[];
}

interface AuthoringArchive extends JsonObject {
  id: string;
  cards?: AuthoringCard[];
}

interface EvidenceRef {
  path: string;
  lines: number[];
  match: 'EXACT_CARD_AND_ABILITY' | 'ABILITY_TOKEN_ONLY' | 'ARCHIVE_AND_ABILITY';
}

const SCHEMA_VERSION = 'fd-phase3-ledger-92-v1';
const BASE_COMMIT = '4b52b3166ed2ba0efaa4569ee95c6513fd26ab2f';
const PACK_PATH = 'data/packs/fd-playtest-v1/pack.json';
const DEFAULT_OUTPUT = 'artifacts/phase3-ledger-92.json';
const EXPECTED = { archives: 14, cards: 46, abilities: 92 } as const;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizePath(path: string): string {
  return path.replaceAll('\\', '/');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as JsonObject)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

function walkFiles(root: string, relativeRoot: string, extensions: Set<string>): string[] {
  const absolute = resolve(root, relativeRoot);
  if (!existsSync(absolute)) return [];
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      if (statSync(path).isDirectory()) visit(path);
      else if ([...extensions].some((extension) => name.endsWith(extension))) files.push(normalizePath(relative(root, path)));
    }
  };
  visit(absolute);
  return files;
}

function matchingLines(text: string, token: string): number[] {
  if (!token) return [];
  const lines: number[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (line.includes(token)) lines.push(index + 1);
  });
  return lines;
}

function evidenceRefs(
  root: string,
  files: string[],
  archiveId: string,
  cardId: string,
  abilityId: string,
): EvidenceRef[] {
  const refs: EvidenceRef[] = [];
  for (const path of files) {
    const text = readFileSync(resolve(root, path), 'utf8');
    const abilityLines = matchingLines(text, abilityId);
    if (!abilityLines.length) continue;
    const cardLines = matchingLines(text, cardId);
    const archiveLines = matchingLines(text, archiveId);
    refs.push({
      path,
      lines: [...new Set([...abilityLines, ...cardLines, ...archiveLines])].sort((left, right) => left - right),
      match: cardLines.length
        ? 'EXACT_CARD_AND_ABILITY'
        : archiveLines.length
          ? 'ARCHIVE_AND_ABILITY'
          : 'ABILITY_TOKEN_ONLY',
    });
  }
  return refs;
}

function runtimeOwner(runtimeRoute: string, semanticRoutes: string[]): JsonObject {
  if (runtimeRoute === 'NEW_RUNTIME_SEMANTIC_ROUTED') {
    return {
      status: 'IDENTIFIED_FROM_SEMANTIC_CLASSIFIER',
      owner: 'resolution-dataflow -> interpreter production bridge',
      semanticRoutes,
    };
  }
  if (runtimeRoute === 'LEGACY_RESOLVE_EFFECT') {
    return {
      status: 'TRANSITIONAL_LEGACY_OWNER',
      owner: 'interpreter resolveEffect / extended-effects compatibility path',
      semanticRoutes,
    };
  }
  if (runtimeRoute === 'LEGACY_EXECUTE_ABILITY') {
    return {
      status: 'TRANSITIONAL_LEGACY_OWNER',
      owner: 'interpreter executeAbility compatibility path',
      semanticRoutes,
    };
  }
  if (runtimeRoute === 'DUAL_COMPATIBLE') {
    return {
      status: 'MULTIPLE_RUNTIME_OWNERS',
      owner: 'semantic data-flow plus legacy compatibility path',
      semanticRoutes,
    };
  }
  return { status: 'UNRESOLVED', owner: null, semanticRoutes };
}

function disposition(runtimeRoute: string, exactTests: EvidenceRef[]) {
  if (runtimeRoute === 'NEW_RUNTIME_SEMANTIC_ROUTED') {
    return {
      missingContract: ['INDEPENDENT_R_VERDICT_NOT_MACHINE_BOUND', 'GATE_STATUS_NOT_MACHINE_PROMOTED'],
      nextOwner: 'R',
      reason: exactTests.length ? 'Semantic route and exact test references exist, but the ledger cannot promote them.' : 'Semantic route exists without exact identity test references.',
    };
  }
  if (runtimeRoute === 'NOT_CLASSIFIABLE') {
    return {
      missingContract: ['RUNTIME_ROUTE_NOT_CLASSIFIABLE', 'EXACT_SEMANTIC_CONTRACT_REQUIRED'],
      nextOwner: 'B',
      reason: 'A preserves the classification gap; B owns any runtime/compiler semantic implementation.',
    };
  }
  if (runtimeRoute === 'DUAL_COMPATIBLE') {
    return {
      missingContract: ['SINGLE_RUNTIME_OWNER', 'LEGACY_FALLBACK_REMOVAL', 'INDEPENDENT_R_VERDICT_NOT_MACHINE_BOUND'],
      nextOwner: 'B',
      reason: 'Dual ownership blocks acceptance until the runtime owner is singular and independently reviewed.',
    };
  }
  return {
    missingContract: ['SEMANTIC_RUNTIME_MIGRATION', 'LEGACY_OWNER_REMOVAL', 'INDEPENDENT_R_VERDICT_NOT_MACHINE_BOUND'],
    nextOwner: 'B',
    reason: 'The ability remains owned by a legacy compatibility route.',
  };
}

function countBy(rows: JsonObject[], selector: (row: JsonObject) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = selector(row);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function assertBaseInputsUnchanged(root: string, sourcePaths: string[]): void {
  execFileSync('git', ['merge-base', '--is-ancestor', BASE_COMMIT, 'HEAD'], { cwd: root, stdio: 'pipe' });
  const checkedPaths = [PACK_PATH, 'scripts/phase3-coverage.ts', ...sourcePaths];
  try {
    execFileSync('git', ['diff', '--quiet', BASE_COMMIT, '--', ...checkedPaths], { cwd: root, stdio: 'pipe' });
  } catch {
    throw new Error(`Ledger inputs differ from required BaseCommit ${BASE_COMMIT}.`);
  }
}

export function buildLedger(root = resolve('.')) {
  const pack = JSON.parse(readFileSync(resolve(root, PACK_PATH), 'utf8')) as PackManifest;
  const sourcePaths = [...(pack.authoringMasterFiles ?? []), ...(pack.authoringServantFiles ?? [])];
  if (sourcePaths.length !== EXPECTED.archives) {
    throw new Error(`Expected ${EXPECTED.archives} manifest archives, got ${sourcePaths.length}.`);
  }
  if (new Set(sourcePaths).size !== sourcePaths.length) throw new Error('Pack manifest contains duplicate target archives.');
  assertBaseInputsUnchanged(root, sourcePaths);

  const testFiles = [
    ...walkFiles(root, 'packages/rules/tests', new Set(['.ts', '.tsx'])),
    ...walkFiles(root, 'scripts/tests', new Set(['.ts', '.tsx'])),
    ...walkFiles(root, 'e2e', new Set(['.ts', '.tsx'])),
  ];
  const reportFiles = walkFiles(root, 'docs/reports', new Set(['.md']));
  const archives = sourcePaths.map((path) => ({ path, archive: JSON.parse(readFileSync(resolve(root, path), 'utf8')) as AuthoringArchive }));
  const rows: JsonObject[] = [];

  for (const { path, archive } of archives) {
    for (let cardIndex = 0; cardIndex < (archive.cards ?? []).length; cardIndex += 1) {
      const card = archive.cards![cardIndex]!;
      for (let abilityIndex = 0; abilityIndex < (card.abilities ?? []).length; abilityIndex += 1) {
        const ability = card.abilities![abilityIndex]!;
        const classified = classifyAbilityForCoverage(archive, card, ability);
        const tests = evidenceRefs(root, testFiles, archive.id, card.id, ability.id);
        const exactTests = tests.filter((ref) => ref.match !== 'ABILITY_TOKEN_ONLY');
        const reports = evidenceRefs(root, reportFiles, archive.id, card.id, ability.id);
        const unitCandidates = exactTests.filter((ref) => !ref.path.startsWith('e2e/'));
        const browserCandidates = exactTests.filter((ref) => ref.path.startsWith('e2e/'));
        const next = disposition(classified.runtimeRoute, exactTests);
        rows.push({
          archiveId: archive.id,
          cardId: card.id,
          abilityId: ability.id,
          abilityKey: `${archive.id}/${card.id}/${ability.id}`,
          source: {
            path,
            jsonPointer: `/cards/${cardIndex}/abilities/${abilityIndex}`,
            printedClause: ability.printedClause ?? null,
            printedClauseSha256: sha256(ability.printedClause ?? ''),
          },
          runtimeOwner: runtimeOwner(classified.runtimeRoute, classified.semanticRoutes),
          route: {
            classification: classified.runtimeRoute,
            semanticRoutes: classified.semanticRoutes,
            exactEffectPrimitives: classified.exactEffectPrimitives,
            unclassifiedReasons: classified.unclassifiedReasons,
          },
          tests: {
            status: exactTests.length ? 'EXACT_IDENTITY_REFERENCES_FOUND' : tests.length ? 'ABILITY_TOKEN_ONLY' : 'NOT_FOUND',
            exactIdentityReferences: exactTests,
            ambiguousAbilityTokenReferences: tests.filter((ref) => ref.match === 'ABILITY_TOKEN_ONLY'),
          },
          gate: {
            policy: 'FAIL_CLOSED_NO_AUTOMATIC_PROMOTION',
            gateA: { status: 'NOT_VERIFIED', candidateReferences: unitCandidates },
            gateB: { status: 'NOT_VERIFIED', candidateReferences: unitCandidates },
            gateC: { status: 'NOT_VERIFIED', candidateReferences: browserCandidates },
            note: 'References are discovery inputs only; an independent structured verdict must bind exact evidence to a Gate.',
          },
          r: {
            status: 'NOT_MACHINE_VERIFIED',
            reportReferences: reports,
            note: 'Report text is discoverability evidence only and cannot promote an R verdict.',
          },
          main: {
            status: 'PRESENT_AT_REQUIRED_BASE_COMMIT',
            baseCommit: BASE_COMMIT,
            sourcePresent: true,
            routeClassifiedFromBaseInputs: true,
          },
          missingContract: next.missingContract,
          nextOwner: next.nextOwner,
          nextOwnerReason: next.reason,
        });
      }
    }
  }

  rows.sort((left, right) => String(left.abilityKey).localeCompare(String(right.abilityKey)));
  const totalCards = archives.reduce((total, item) => total + (item.archive.cards ?? []).length, 0);
  if (totalCards !== EXPECTED.cards || rows.length !== EXPECTED.abilities) {
    throw new Error(`Expected ${EXPECTED.cards} cards / ${EXPECTED.abilities} abilities, got ${totalCards} / ${rows.length}.`);
  }
  if (new Set(rows.map((row) => row.abilityKey)).size !== rows.length) throw new Error('Ledger contains duplicate ability keys.');

  const sourceFingerprint = sha256(stableStringify(sourcePaths.map((path) => ({ path, content: JSON.parse(readFileSync(resolve(root, path), 'utf8')) }))));
  return {
    schemaVersion: SCHEMA_VERSION,
    task: 'P3-A-LEDGER-92-RECALC',
    baseCommit: BASE_COMMIT,
    denominator: {
      authority: PACK_PATH,
      includedManifestFields: ['authoringMasterFiles', 'authoringServantFiles'],
      excludedManifestFields: ['authoringMasterSupportFiles'],
      archives: EXPECTED.archives,
      cards: EXPECTED.cards,
      abilities: EXPECTED.abilities,
    },
    evidencePolicy: {
      automaticIsAcceptance: false,
      fullCapabilityClaimIsAcceptance: false,
      reportClaimIsAcceptance: false,
      testReferenceIsAcceptance: false,
      independentStructuredRVerdictRequired: true,
    },
    sourceFingerprint,
    summary: {
      totalAbilities: rows.length,
      byRuntimeRoute: countBy(rows, (row) => String((row.route as JsonObject).classification)),
      byNextOwner: countBy(rows, (row) => String(row.nextOwner)),
      withExactTestReferences: rows.filter((row) => (row.tests as JsonObject).status === 'EXACT_IDENTITY_REFERENCES_FOUND').length,
      withGateAReferenceCandidates: rows.filter((row) => (((row.gate as JsonObject).gateA as JsonObject).candidateReferences as unknown[]).length > 0).length,
      withGateBReferenceCandidates: rows.filter((row) => (((row.gate as JsonObject).gateB as JsonObject).candidateReferences as unknown[]).length > 0).length,
      withGateCReferenceCandidates: rows.filter((row) => (((row.gate as JsonObject).gateC as JsonObject).candidateReferences as unknown[]).length > 0).length,
      gateAVerified: 0,
      gateBVerified: 0,
      gateCVerified: 0,
      machineVerifiedRVerdicts: 0,
    },
    abilities: rows,
  };
}

export function validateLedger(actual: ReturnType<typeof buildLedger>, expected: ReturnType<typeof buildLedger>): void {
  if (actual.schemaVersion !== SCHEMA_VERSION) throw new Error(`Unexpected schemaVersion ${actual.schemaVersion}.`);
  if (actual.sourceFingerprint !== expected.sourceFingerprint) throw new Error('Ledger sourceFingerprint is stale.');
  if (actual.abilities.length !== EXPECTED.abilities) throw new Error(`Ledger must contain ${EXPECTED.abilities} abilities.`);
  const required = ['archiveId', 'cardId', 'abilityId', 'source', 'runtimeOwner', 'route', 'tests', 'gate', 'r', 'main', 'missingContract', 'nextOwner'];
  for (const [index, row] of actual.abilities.entries()) {
    for (const field of required) {
      if (!(field in row)) throw new Error(`abilities[${index}] is missing ${field}.`);
    }
  }
  if (stableStringify(actual) !== stableStringify(expected)) throw new Error('Ledger differs from a fresh source recalculation.');
}

function parseArg(argv: string[], name: string, fallback: string): string {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] ? argv[index + 1]! : fallback;
}

export function runLedgerCli(argv = process.argv.slice(2), root = resolve('.')): void {
  const output = resolve(root, parseArg(argv, '--out', DEFAULT_OUTPUT));
  const expected = buildLedger(root);
  if (argv.includes('--validate')) {
    if (!existsSync(output)) throw new Error(`Ledger artifact does not exist: ${normalizePath(relative(root, output))}`);
    const actual = JSON.parse(readFileSync(output, 'utf8')) as ReturnType<typeof buildLedger>;
    validateLedger(actual, expected);
    process.stdout.write(`PHASE3_LEDGER_92_VALID abilities=${actual.abilities.length} fingerprint=${actual.sourceFingerprint}\n`);
    return;
  }
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(expected, null, 2)}\n`, 'utf8');
  process.stdout.write(`PHASE3_LEDGER_92_WRITTEN abilities=${expected.abilities.length} fingerprint=${expected.sourceFingerprint}\n`);
  process.stdout.write(`artifact=${normalizePath(relative(root, output))}\n`);
}

const currentFile = fileURLToPath(import.meta.url);
if (resolve(process.argv[1] ?? '') === resolve(currentFile)) runLedgerCli();
