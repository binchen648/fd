import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const phase3ManifestSchemaVersion = 'fd-phase3-promotion-manifest-v2';
export const phase3ReviewAttestationSchemaVersion = 'fd-phase3-review-attestation-v1';

export type Phase3Role = 'A' | 'B' | 'R' | 'S' | 'I' | 'G';
export type Phase3PrType = 'promotion' | 'stacked' | 'governance';

export interface Phase3TaskManifest {
  schemaVersion: typeof phase3ManifestSchemaVersion;
  role: Phase3Role;
  taskId: string;
  prType: Phase3PrType;
  base: {
    ref: string;
    sha: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  dependsOnPrs: number[];
  affectedAbilityIds: string[];
  runtimeBehaviorChanged: boolean;
  rules: {
    source: string;
    referenceCommit: string;
  };
  review: {
    sha: string;
    reviewer?: string;
    reviewThread?: string;
    evidencePath?: string;
    evidenceSha256?: string;
    conclusion: string;
    reviewedCandidateSha: string;
  };
  synchronization: {
    sha: string;
  };
  migrationCounts: {
    mainline: number;
    recovery: number;
    candidate: number;
  };
  tests: Array<{
    command: string;
    result: string;
  }>;
  uncoveredScenarios: string[];
  knownBlockers: string[];
  zeroMigrationCredit: boolean;
  reverifyOnUpstreamHeadChange: boolean;
}

export interface PullRequestContext {
  baseRef: string;
  baseSha: string;
  headRef: string;
  headSha: string;
  title?: string;
  body?: string;
  changedFiles?: string[];
}

export interface ValidationOptions {
  workspaceRoot?: string;
  verifyGitAncestry?: boolean;
}

export interface ValidationResult {
  status: 'passed' | 'skipped';
  messages: string[];
}

const shaPattern = /^[a-f0-9]{40}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const reviewerPattern = /^github:[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const reviewThreadPattern = /^https:\/\/github\.com\/binchen648\/fd\/pull\/\d+#(?:issuecomment|pullrequestreview)-\d+$/;
const reviewEvidencePathPattern = /^docs\/reviews\/phase3\/(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+\.json$/;
const roles = new Set<Phase3Role>(['A', 'B', 'R', 'S', 'I', 'G']);
const prTypes = new Set<Phase3PrType>(['promotion', 'stacked', 'governance']);
const acceptedReviewConclusions = new Set([
  'IMPLEMENTATION_ACCEPTED_CANDIDATE',
  'MIGRATION_ACCEPTED',
  'GATE_A_B_CANDIDATE_ACCEPTED',
  'REVIEW_ACCEPTED',
]);
const phase3StackedRoles = new Set<Phase3Role>(['A', 'B', 'R', 'S']);
const phase3ProtectedPathPatterns = [
  /^package(?:-lock)?\.json$/,
  /^\.github\//,
  /^packages\/rules\//,
  /^packages\/content\//,
  /^src\/content\//,
  /^data\/phase3\//,
  /^scripts\/(?:tests\/)?phase3(?:-|\/)/,
  /^docs\/(?:audits|plans|reports)\/.*(?:p3|phase-?3)/,
  /^docs\/governance\/phase3/,
];

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function assertSha(value: unknown, label: string): string {
  const sha = assertString(value, label).toLowerCase();
  if (!shaPattern.test(sha)) {
    throw new Error(`${label} must be an exact 40-character Git SHA.`);
  }
  return sha;
}

function assertPattern(value: unknown, label: string, pattern: RegExp, expectation: string): string {
  const text = assertString(value, label);
  if (!pattern.test(text)) {
    throw new Error(`${label} must ${expectation}.`);
  }
  return text;
}

function assertStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
    throw new Error(`${label} must be an array of non-empty strings.`);
  }
  return value;
}

function assertNonEmptyStringArray(value: unknown, label: string): string[] {
  const items = assertStringArray(value, label);
  if (items.length === 0) {
    throw new Error(`${label} must contain an explicit declaration.`);
  }
  return items;
}

function assertNumberArray(value: unknown, label: string): number[] {
  if (!Array.isArray(value) || value.some((item) => !Number.isInteger(item) || item <= 0)) {
    throw new Error(`${label} must be an array of positive PR numbers.`);
  }
  return value;
}

function assertBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be boolean.`);
  }
  return value;
}

function assertCount(value: unknown, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return value;
}

export function assertPhase3TaskManifest(value: unknown): asserts value is Phase3TaskManifest {
  assertRecord(value, 'Phase 3 task manifest');
  if (value.schemaVersion !== phase3ManifestSchemaVersion) {
    throw new Error(`schemaVersion must be ${phase3ManifestSchemaVersion}.`);
  }
  if (!roles.has(value.role as Phase3Role)) {
    throw new Error('role must be one of A, B, R, S, I, or G.');
  }
  if (!prTypes.has(value.prType as Phase3PrType)) {
    throw new Error('prType must be promotion, stacked, or governance.');
  }
  if (!/^P3-[A-Z0-9][A-Z0-9-]*$/.test(assertString(value.taskId, 'taskId'))) {
    throw new Error('taskId must start with P3-.');
  }

  assertRecord(value.base, 'base');
  assertString(value.base.ref, 'base.ref');
  assertSha(value.base.sha, 'base.sha');
  assertRecord(value.head, 'head');
  assertString(value.head.ref, 'head.ref');
  assertSha(value.head.sha, 'head.sha');
  assertNumberArray(value.dependsOnPrs, 'dependsOnPrs');
  assertStringArray(value.affectedAbilityIds, 'affectedAbilityIds');
  assertBoolean(value.runtimeBehaviorChanged, 'runtimeBehaviorChanged');

  assertRecord(value.rules, 'rules');
  assertString(value.rules.source, 'rules.source');
  assertSha(value.rules.referenceCommit, 'rules.referenceCommit');

  assertRecord(value.review, 'review');
  assertSha(value.review.sha, 'review.sha');
  assertString(value.review.conclusion, 'review.conclusion');
  assertSha(value.review.reviewedCandidateSha, 'review.reviewedCandidateSha');

  assertRecord(value.synchronization, 'synchronization');
  assertSha(value.synchronization.sha, 'synchronization.sha');

  assertRecord(value.migrationCounts, 'migrationCounts');
  assertCount(value.migrationCounts.mainline, 'migrationCounts.mainline');
  assertCount(value.migrationCounts.recovery, 'migrationCounts.recovery');
  assertCount(value.migrationCounts.candidate, 'migrationCounts.candidate');

  if (!Array.isArray(value.tests) || value.tests.length === 0) {
    throw new Error('tests must contain at least one command/result record.');
  }
  for (const [index, test] of value.tests.entries()) {
    assertRecord(test, `tests[${index}]`);
    assertString(test.command, `tests[${index}].command`);
    assertString(test.result, `tests[${index}].result`);
  }
  assertNonEmptyStringArray(value.uncoveredScenarios, 'uncoveredScenarios');
  assertNonEmptyStringArray(value.knownBlockers, 'knownBlockers');
  assertBoolean(value.zeroMigrationCredit, 'zeroMigrationCredit');
  if (value.reverifyOnUpstreamHeadChange !== true) {
    throw new Error('reverifyOnUpstreamHeadChange must be true.');
  }
}

export function isPhase3PullRequest(context: PullRequestContext): boolean {
  const haystack = [
    context.baseRef,
    context.headRef,
    context.title ?? '',
    ...(context.changedFiles ?? []),
  ].join('\n').toLowerCase();
  if (/\bp3-|phase ?3|phase3/.test(haystack)) {
    return true;
  }
  return (context.changedFiles ?? []).some((path) => {
    const normalizedPath = path.replaceAll('\\', '/').toLowerCase();
    return phase3ProtectedPathPatterns.some((pattern) => pattern.test(normalizedPath));
  });
}

export function extractManifestFromBody(body: string): unknown | undefined {
  const match = body.match(/`{3,}(?:json\s+)?phase3-task-manifest\s*\r?\n([\s\S]*?)\r?\n`{3,}/i);
  if (!match) {
    return undefined;
  }
  return JSON.parse(match[1]!);
}

function gitIsAncestor(workspaceRoot: string, ancestor: string, descendant: string): boolean {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd: workspaceRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function gitCommitExists(workspaceRoot: string, sha: string): boolean {
  try {
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], {
      cwd: workspaceRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function gitFileAtCommit(workspaceRoot: string, sha: string, path: string): string {
  try {
    return execFileSync('git', ['show', `${sha}:${path}`], {
      cwd: workspaceRoot,
      encoding: 'utf8',
    });
  } catch {
    throw new Error(`review evidence file ${path} does not exist at review.sha.`);
  }
}

function verifyReviewAttestation(
  workspaceRoot: string,
  manifest: Phase3TaskManifest,
): void {
  const evidence = gitFileAtCommit(workspaceRoot, manifest.review.sha, manifest.review.evidencePath!);
  const digest = createHash('sha256').update(evidence, 'utf8').digest('hex');
  if (digest !== manifest.review.evidenceSha256) {
    throw new Error('review evidence SHA-256 does not match the file at review.sha.');
  }

  let attestation: unknown;
  try {
    attestation = JSON.parse(evidence);
  } catch {
    throw new Error('review evidence must be valid JSON.');
  }
  assertRecord(attestation, 'review attestation');
  if (attestation.schemaVersion !== phase3ReviewAttestationSchemaVersion) {
    throw new Error(`review attestation schemaVersion must be ${phase3ReviewAttestationSchemaVersion}.`);
  }

  const expected = {
    taskId: manifest.taskId,
    reviewer: manifest.review.reviewer,
    reviewThread: manifest.review.reviewThread,
    candidateSha: manifest.review.reviewedCandidateSha,
    conclusion: manifest.review.conclusion,
  };
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (attestation[field] !== expectedValue) {
      throw new Error(`review attestation ${field} does not match the Promotion manifest.`);
    }
  }
}

function gitChangedFiles(workspaceRoot: string, baseSha: string, headSha: string): string[] {
  const output = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMR', baseSha, headSha],
    { cwd: workspaceRoot, encoding: 'utf8' },
  );
  return output.split(/\r?\n/).filter(Boolean);
}

export function validatePhase3Governance(
  context: PullRequestContext,
  manifest: unknown | undefined,
  options: ValidationOptions = {},
): ValidationResult {
  if (!isPhase3PullRequest(context) && manifest === undefined) {
    return { status: 'skipped', messages: ['No Phase 3 branch, title, or file signal detected.'] };
  }
  if (!manifest) {
    throw new Error('Phase 3 PRs must include a phase3-task-manifest fenced JSON block or manifest file.');
  }
  assertPhase3TaskManifest(manifest);

  const messages: string[] = [];
  if (manifest.base.ref !== context.baseRef) {
    throw new Error(`Manifest base.ref ${manifest.base.ref} does not match PR base ${context.baseRef}.`);
  }
  if (manifest.base.sha !== context.baseSha.toLowerCase()) {
    throw new Error(`Manifest base.sha ${manifest.base.sha} does not match PR base SHA ${context.baseSha}.`);
  }
  if (manifest.head.ref !== context.headRef) {
    throw new Error(`Manifest head.ref ${manifest.head.ref} does not match PR head ${context.headRef}.`);
  }
  if (manifest.head.sha !== context.headSha.toLowerCase()) {
    throw new Error(`Manifest head.sha ${manifest.head.sha} does not match PR head SHA ${context.headSha}.`);
  }

  if (context.baseRef === 'main') {
    if (manifest.prType !== 'promotion' && manifest.prType !== 'governance') {
      throw new Error('Phase 3 PRs targeting main must be promotion or governance PRs.');
    }
  } else if (manifest.prType !== 'stacked') {
    throw new Error('Phase 3 PRs targeting non-main branches must be marked prType=stacked.');
  }

  if (manifest.prType === 'promotion') {
    assertPattern(manifest.review.reviewer, 'review.reviewer', reviewerPattern, 'use github:<login>');
    assertPattern(
      manifest.review.reviewThread,
      'review.reviewThread',
      reviewThreadPattern,
      'identify a review comment or review on a binchen648/fd pull request',
    );
    assertPattern(
      manifest.review.evidencePath,
      'review.evidencePath',
      reviewEvidencePathPattern,
      'be a JSON file below docs/reviews/phase3',
    );
    assertPattern(
      manifest.review.evidenceSha256,
      'review.evidenceSha256',
      sha256Pattern,
      'be a lowercase SHA-256 digest',
    );
    if (manifest.role !== 'I') {
      throw new Error('Promotion PRs must use role I.');
    }
    if (manifest.base.ref !== 'main') {
      throw new Error('Promotion PRs must target main.');
    }
    if (!acceptedReviewConclusions.has(manifest.review.conclusion)) {
      throw new Error(`Promotion review conclusion is not accepted: ${manifest.review.conclusion}.`);
    }
    const reviewMustDifferFrom = new Set([
      manifest.base.sha,
      manifest.head.sha,
      manifest.review.reviewedCandidateSha,
      manifest.synchronization.sha,
    ]);
    if (reviewMustDifferFrom.has(manifest.review.sha)) {
      throw new Error('Promotion review.sha must be distinct from base, head, candidate, and synchronization SHAs.');
    }
    if (manifest.review.reviewedCandidateSha === manifest.head.sha
      || manifest.review.reviewedCandidateSha === manifest.synchronization.sha) {
      throw new Error('Promotion reviewed candidate must precede synchronization and head.');
    }
    if (manifest.synchronization.sha === manifest.head.sha) {
      throw new Error('Promotion synchronization must precede the integration head.');
    }
    if (manifest.tests.some((test) => !/^PASS\b/i.test(test.result.trim()))) {
      throw new Error('Promotion manifest test results must start with PASS.');
    }
    if (manifest.zeroMigrationCredit) {
      const { mainline, recovery, candidate } = manifest.migrationCounts;
      if (mainline !== 0 || recovery !== 0 || candidate !== 0) {
        throw new Error('zeroMigrationCredit requires all migration counts to be 0.');
      }
    }
  }

  if (manifest.prType === 'governance' && manifest.role !== 'G') {
    throw new Error('Governance PRs must use role G.');
  }
  if (manifest.role === 'G' && manifest.prType !== 'governance') {
    throw new Error('Role G manifests must use prType=governance.');
  }
  if (manifest.role === 'I' && manifest.prType !== 'promotion') {
    throw new Error('Role I manifests must use prType=promotion.');
  }
  if (manifest.prType === 'stacked' && !phase3StackedRoles.has(manifest.role)) {
    throw new Error('Stacked PRs must use role A, B, R, or S.');
  }

  if (options.verifyGitAncestry && options.workspaceRoot) {
    if (!gitCommitExists(options.workspaceRoot, manifest.review.sha)) {
      throw new Error('review.sha does not identify a fetched Git commit.');
    }
    if (manifest.prType === 'promotion') {
      verifyReviewAttestation(options.workspaceRoot, manifest);
    }
    if (manifest.prType === 'promotion'
      && !gitIsAncestor(
        options.workspaceRoot,
        manifest.review.reviewedCandidateSha,
        manifest.synchronization.sha,
      )) {
      throw new Error('Promotion reviewed candidate is not an ancestor of synchronization.sha.');
    }
    if (!gitIsAncestor(options.workspaceRoot, manifest.synchronization.sha, manifest.head.sha)) {
      throw new Error('synchronization.sha is not an ancestor of the PR head SHA.');
    }
  }

  messages.push(`Validated ${manifest.prType} manifest for ${manifest.taskId} role ${manifest.role}.`);
  return { status: 'passed', messages };
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseArgs(argv: string[]): Record<string, string | true> {
  const args: Record<string, string | true> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (!arg.startsWith('--')) {
      continue;
    }
    const next = argv[index + 1];
    args[arg] = next && !next.startsWith('--') ? next : true;
    if (args[arg] === next) {
      index += 1;
    }
  }
  return args;
}

function contextFromEvent(event: Record<string, unknown>): PullRequestContext {
  assertRecord(event.pull_request, 'pull_request event');
  const pr = event.pull_request;
  assertRecord(pr.base, 'pull_request.base');
  assertRecord(pr.head, 'pull_request.head');
  return {
    baseRef: assertString(pr.base.ref, 'pull_request.base.ref'),
    baseSha: assertSha(pr.base.sha, 'pull_request.base.sha'),
    headRef: assertString(pr.head.ref, 'pull_request.head.ref'),
    headSha: assertSha(pr.head.sha, 'pull_request.head.sha'),
    title: typeof pr.title === 'string' ? pr.title : undefined,
    body: typeof pr.body === 'string' ? pr.body : undefined,
    changedFiles: [],
  };
}

export function runPhase3GovernanceCli(argv = process.argv.slice(2), workspaceRoot = resolve('.')): void {
  const args = parseArgs(argv);
  const eventPath = typeof args['--event'] === 'string' ? args['--event'] : process.env.GITHUB_EVENT_PATH;
  const manifestPath = typeof args['--manifest'] === 'string' ? args['--manifest'] : undefined;

  let context: PullRequestContext;
  let manifest: unknown | undefined;
  if (eventPath) {
    const event = readJson(eventPath);
    assertRecord(event, 'GitHub event');
    context = contextFromEvent(event);
    context.changedFiles = gitChangedFiles(workspaceRoot, context.baseSha, context.headSha);
    manifest = context.body ? extractManifestFromBody(context.body) : undefined;
  } else {
    context = {
      baseRef: assertString(args['--base-ref'], '--base-ref'),
      baseSha: assertSha(args['--base-sha'], '--base-sha'),
      headRef: assertString(args['--head-ref'], '--head-ref'),
      headSha: assertSha(args['--head-sha'], '--head-sha'),
      title: typeof args['--title'] === 'string' ? args['--title'] : undefined,
    };
  }

  if (!manifest && manifestPath && existsSync(manifestPath)) {
    manifest = readJson(manifestPath);
  }

  const result = validatePhase3Governance(context, manifest, {
    workspaceRoot,
    verifyGitAncestry: args['--verify-git-ancestry'] === true,
  });

  process.stdout.write(`PHASE_3_GOVERNANCE_${result.status.toUpperCase()}\n`);
  for (const message of result.messages) {
    process.stdout.write(`${message}\n`);
  }
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : '';
if (currentFile === invokedFile) {
  runPhase3GovernanceCli();
}
