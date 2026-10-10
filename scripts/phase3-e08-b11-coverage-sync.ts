import { execFileSync, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { buildCoverageFromArchives, loadAuthoringArchives, type AuthoringArchiveLike } from './phase3-coverage';

export const mainSha = '9a1689d2ec5b56b67d1483d2593b4ab809d6c15c';
export const candidateSha = '7868b82949e3e17e64218755e0efe3ed478ff778';
export const coveragePath = 'artifacts/phase3-skill-coverage.json';
export const syncPath = 'artifacts/phase3-e08-b11-coverage-sync.json';
export const reportPath = 'docs/reports/2026-10-09-p3-e08-b11-coverage-sync.md';
const manifestPath = 'docs/agents/manifests/tasks/P3-E08-B11-RESULT-BINDING-CURRENT-MAIN-REPLAY.json';
const sourcePaths = ['data/authoring', 'data/packs', 'data/generated', 'packages/content/src', 'packages/rules/src', 'scripts/phase3-coverage.ts'];
export const historicalCarrierSha = '9eaa0e0c417486adf7b0449e3d32fb90b7d362f9';
export const implementationBaseSha = '46dbd031b06192e7e81479706678937064cdc1a3';
export const authorizationSha = '8eb752c181ea025ac54c53f425a89aa64238f575';
export const repairPaths = [
  'scripts/phase3-e08-b11-coverage-sync.ts', 'scripts/tests/phase3-e08-b11-coverage-sync.test.ts',
  'scripts/tests/phase3-e06-post-merge-recount.test.ts', coveragePath,
  'scripts/fixtures/phase3-b11-task-check.json', 'scripts/phase3-preflight.ts',
  'scripts/tests/phase3-readiness-preflight.test.ts',
  'artifacts/phase3-e08-b11-final-combination-evidence.json',
  'docs/reports/2026-10-10-p3-e08-b11-final-combination-evidence.md',
];
export const finalSourcePaths = [...sourcePaths, ...repairPaths.filter(path => path.endsWith('.ts')),
  'apps/server/src', 'apps/client/src', 'packages/rules/tests', 'e2e',
  'scripts/phase3-tooling-common.ts', 'scripts/phase3-b11-diagnostic-api.ts',
  'scripts/phase3-contract-parity.ts', 'scripts/phase3-contract-parity-worker.ts',
  'package.json', 'package-lock.json', 'playwright.config.ts', '.github/workflows/test.yml'];

export function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex').toUpperCase();
}

function git(root: string, args: string[]): Buffer {
  return execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

function text(root: string, args: string[]): string {
  return git(root, args).toString('utf8').trim();
}

function counts(coverage: ReturnType<typeof buildCoverageFromArchives>) {
  const routes = coverage.runtimeRouting;
  return {
    new: routes.newRuntimeConsumers.after,
    legacyResolve: routes.legacyResolveEffectConsumers.after,
    legacyExecute: routes.legacyExecuteAbilityConsumers.after,
    dual: routes.dualRuntimeConsumers.after,
    notClassifiable: routes.notClassifiable.after,
  };
}

function archivesAt(root: string, sha: string, paths: string[]): AuthoringArchiveLike[] {
  // One Git process avoids spawning a process for every archive under full-suite load.
  const output = execFileSync('git', ['cat-file', '--batch'], {
    cwd: root, input: `${paths.map(path => `${sha}:${path}`).join('\n')}\n`,
    maxBuffer: 32 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'],
  });
  let offset = 0;
  const archives = paths.map(path => {
    const newline = output.indexOf(10, offset);
    if (newline < 0) throw new Error(`Missing Git object header: ${path}`);
    const header = output.subarray(offset, newline).toString('utf8');
    const match = /^[0-9a-f]{40} blob (\d+)$/.exec(header);
    if (!match) throw new Error(`Invalid Git archive object: ${header}`);
    const end = newline + 1 + Number(match[1]);
    if (output[end] !== 10) throw new Error(`Truncated Git archive object: ${path}`);
    const archive = JSON.parse(output.subarray(newline + 1, end).toString('utf8')) as AuthoringArchiveLike;
    offset = end + 1;
    return archive;
  });
  if (offset !== output.length) throw new Error('Unexpected extra Git archive bytes');
  return archives;
}

export async function buildSnapshotAtCheckout(root: string, candidateSha: string) {
  for (const sha of [mainSha, candidateSha]) {
    if (text(root, ['rev-parse', '--verify', `${sha}^{commit}`]) !== sha) throw new Error('Invalid exact commit');
  }
  git(root, ['merge-base', '--is-ancestor', mainSha, candidateSha]);
  git(root, ['merge-base', '--is-ancestor', candidateSha, 'HEAD']);
  const candidateInObservedMain = (() => {
    try { git(root, ['merge-base', '--is-ancestor', candidateSha, mainSha]); return true; }
    catch (error) {
      if ((error as { status?: number }).status !== 1) throw error;
      return false;
    }
  })();
  const sourceObjects = Object.fromEntries(sourcePaths.map(path => {
    const object = text(root, ['rev-parse', `${candidateSha}:${path}`]);
    if (text(root, ['rev-parse', `HEAD:${path}`]) !== object) throw new Error(`Candidate source drift: ${path}`);
    return [path, object];
  }));
  if (text(root, ['diff', 'HEAD', '--', ...sourcePaths])) throw new Error('Dirty candidate inputs');
  if (text(root, ['ls-files', '--others', '--exclude-standard', '--', ...sourcePaths])) throw new Error('Untracked candidate inputs');
  if (text(root, ['rev-parse', `${mainSha}:scripts/phase3-coverage.ts`]) !== sourceObjects['scripts/phase3-coverage.ts']) {
    throw new Error('Classifier changed; baseline cannot use candidate classifier');
  }
  const generatedAt = text(root, ['show', '-s', '--format=%cI', candidateSha]);
  const archivePaths = text(root, ['ls-tree', '-r', '--name-only', mainSha, '--', 'data/authoring/masters', 'data/authoring/servants'])
    .split('\n').filter(path => path.endsWith('.json')).sort();
  const baseline = buildCoverageFromArchives(archivesAt(root, mainSha, archivePaths), {
    generatedAt, runtimeSourceText: git(root, ['show', `${mainSha}:packages/rules/src/ability/resolution-dataflow.ts`]).toString('utf8'),
  });
  const baselineBlob = git(root, ['show', `${mainSha}:${coveragePath}`]);
  const storedBaseline = JSON.parse(baselineBlob.toString('utf8'));
  if (!isDeepStrictEqual(counts(baseline), counts(storedBaseline)) || baseline.sourceFingerprint !== storedBaseline.sourceFingerprint) {
    throw new Error('Observed main coverage baseline drift');
  }
  const fresh = buildCoverageFromArchives(loadAuthoringArchives(root), { workspaceRoot: root, generatedAt });
  const { loadPlaytestContentPack, validateLoadedPlaytestPack, compileLoadedPlaytestPack } = await import('../packages/content/src/playtest-pack-loader');
  const { compileExecutableCardPack } = await import('../packages/rules/src/ability/executable-card-pack');
  const pack = loadPlaytestContentPack(resolve(root, 'data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: root });
  const issues = validateLoadedPlaytestPack(pack, { workspaceRoot: root });
  const library = compileLoadedPlaytestPack(pack, issues).library;
  const compiled = compileExecutableCardPack(library);
  const coverage = { ...fresh, compiledDefinitions: {
    packId: library.pack.id, version: library.pack.version, definitionHash: compiled.definitionHash,
    compiledCards: Object.keys(compiled.cards).length, compiledCharacters: Object.keys(compiled.characters).length,
    blockingIssues: issues.filter(issue => issue.blocking).length,
  } };
  const before = counts(baseline);
  const after = counts(fresh);
  const changedRoutes = fresh.semanticAxes.flatMap(row => {
    const previous = baseline.semanticAxes.find(item => item.abilityKey === row.abilityKey);
    if (!previous) throw new Error(`Unexpected new identity ${row.abilityKey}`);
    return previous.runtimeRoute === row.runtimeRoute && isDeepStrictEqual(previous.semanticRoutes, row.semanticRoutes) ? [] : [{
      cardId: row.cardId, abilityId: row.abilityId, abilityKey: row.abilityKey,
      before: previous.runtimeRoute, after: row.runtimeRoute, semanticRoutes: row.semanticRoutes,
    }];
  });
  if (baseline.semanticAxes.length !== fresh.semanticAxes.length) throw new Error('Identity denominator drift');
  const manifestBlob = git(root, ['show', `${candidateSha}:${manifestPath}`]);
  const manifest = JSON.parse(manifestBlob.toString('utf8'));
  if (manifest.baseCommit !== mainSha || manifest.reviewReady !== false) throw new Error('Unexpected candidate dispatch');
  const sync = {
    taskId: 'P3-E08-B11-COVERAGE-EVIDENCE-SYNC', controlEpoch: 'FD-P3-2026-09-23-08', generatedAt,
    status: 'AUTOMATION_BASELINE_CANDIDATE',
    lineage: { observedMainSha: mainSha, candidateSha,
      candidateParent: text(root, ['rev-parse', `${candidateSha}^`]), candidateInObservedMain,
      candidateBranch: 'codex/p3-e08-b11-current-main-replay-20261009',
      candidateTree: text(root, ['rev-parse', `${candidateSha}^{tree}`]), sourceObjects },
    baseline: { artifactPath: coveragePath, artifactCommit: mainSha, artifactSha256: sha256(baselineBlob), sourceFingerprint: baseline.sourceFingerprint },
    candidateCoverage: { artifactPath: coveragePath, artifactSha256: sha256(`${JSON.stringify(coverage, null, 2)}\n`),
      sourceFingerprint: fresh.sourceFingerprint, definitionHash: compiled.definitionHash, counts: fresh.counts },
    candidateLocalRouting: { before, after,
      delta: Object.fromEntries(Object.keys(before).map(key => [key, after[key as keyof typeof after] - before[key as keyof typeof before]])), changedRoutes },
    formalCredit: { mainCoverageCreditDelta: 0, migrationCreditDelta: 0, denominatorDelta: 0, promotedOnMain: false },
    review: { verdict: 'NOT_VERIFIED', evidenceBinding: 'REVIEW_ARTIFACT_NOT_SUPPLIED', gateA: 'NOT_VERIFIED', gateB: 'NOT_VERIFIED', gateC: 'NOT_VERIFIED' },
    candidateDispatch: { path: manifestPath, commit: candidateSha, sha256: sha256(manifestBlob),
      reportedVerification: manifest.freshVerification, blockers: manifest.blockers },
    automationVerification: {
      scope: 'A automation working tree on exact candidate; carrier identity supplied in handoff; no Reviewer acceptance',
      commands: [
        { command: 'npm ci', exitCode: 0, result: '239 packages added; audit reports 12 vulnerabilities' },
        { command: 'npx tsx scripts/phase3-e08-b11-coverage-sync.ts --validate', exitCode: 0, result: 'Full Git/coverage/compiler/artifact/report validation' },
        { command: 'npx vitest run scripts/tests/phase3-e08-b11-coverage-sync.test.ts scripts/tests/phase3-e06-post-merge-recount.test.ts scripts/tests/phase3-coverage.test.ts', exitCode: 0, result: '3 files / 28 tests' },
        { command: 'npm run test:ci', exitCode: 0, result: '186 files / 1429 tests' },
        { command: 'npm run typecheck', exitCode: 0, result: 'PASS' },
        { command: 'npm run content:validate', exitCode: 0, result: '7 masters / 7 servants / 20 events; 0 blocking' },
        { command: 'git diff --check', exitCode: 0, result: 'PASS' },
      ],
      initialFailure: 'First focused run: 5/6 passed; historical hash used pre-A3 coverage. Fixed by binding raw merged A3 Git blob; historical recount artifact unchanged.',
      notRun: ['Browser E2E by A', 'source-assets required validation', 'Global Gate C', 'GitHub required checks'],
    },
    retainedLimitations: ['93 MISSING_IMAGE historical Release blockers; not re-audited', 'Global Gate C NOT_VERIFIED',
      'B11 repeated browser socket lifecycle failure retained; no runtime repair by A', 'Unrelated legacy consumers retained'],
  };
  return { coverage, sync };
}

// Re-execute the unchanged historical producer inside its own exact Git checkout.
export async function buildSync(root: string) {
  git(root, ['rev-parse', '--verify', `${historicalCarrierSha}^{commit}`]);
  git(root, ['merge-base', '--is-ancestor', candidateSha, historicalCarrierSha]);
  const temporary = mkdtempSync(join(tmpdir(), 'fd-b11-historical-'));
  try {
    git(root, ['clone', '--shared', '--no-checkout', root, temporary]);
    git(temporary, ['checkout', '--detach', historicalCarrierSha]);
    if (sha256(readFileSync(join(root, 'package-lock.json'))) !== sha256(readFileSync(join(temporary, 'package-lock.json')))) throw new Error('Historical dependency lock drift');
    // Reuse installed external dependencies, but repoint all workspace links into the historical checkout.
    const modules = join(temporary, 'node_modules'); mkdirSync(modules);
    const linkType = process.platform === 'win32' ? 'junction' : 'dir';
    for (const entry of readdirSync(join(root, 'node_modules'), { withFileTypes: true })) {
      if (entry.name === '@fd') {
        const scope = join(modules, '@fd'); mkdirSync(scope);
        for (const name of readdirSync(join(root, 'node_modules/@fd'))) {
          const workspace = relative(root, realpathSync(join(root, 'node_modules/@fd', name)));
          if (workspace.startsWith('..') || !workspace.startsWith('packages') && !workspace.startsWith('apps')) throw new Error('Invalid historical workspace dependency');
          symlinkSync(join(temporary, workspace), join(scope, name), linkType);
        }
      } else if (entry.isDirectory() || entry.isSymbolicLink()) symlinkSync(join(root, 'node_modules', entry.name), join(modules, entry.name), linkType);
    }
    const driver = `const m = await import(${JSON.stringify(pathToFileURL(join(temporary, 'scripts/phase3-e08-b11-coverage-sync.ts')).href)}); console.log(JSON.stringify(await m.buildSync(process.cwd())));`;
    const bytes = execFileSync(process.execPath, ['--import', pathToFileURL(join(temporary, 'node_modules/tsx/dist/loader.mjs')).href,
      '--input-type=module', '--eval', driver], { cwd: temporary, timeout: 120_000, maxBuffer: 32 * 1024 * 1024 });
    const result = JSON.parse(bytes.toString('utf8')) as Awaited<ReturnType<typeof buildSnapshotAtCheckout>>;
    assertSameEvidence(JSON.parse(git(root, ['show', `${historicalCarrierSha}:${coveragePath}`]).toString('utf8')), result.coverage);
    assertSameEvidence(JSON.parse(git(root, ['show', `${historicalCarrierSha}:${syncPath}`]).toString('utf8')), result.sync);
    assertSameEvidence(git(root, ['show', `${historicalCarrierSha}:${reportPath}`]).toString('utf8'), renderReport(result.sync));
    return result;
  } finally {
    if (!resolve(temporary).startsWith(`${resolve(tmpdir())}/`) && !resolve(temporary).startsWith(`${resolve(tmpdir())}\\`)) throw new Error('Unsafe historical checkout cleanup');
    rmSync(temporary, { recursive: true, force: true });
  }
}

export function validateFinalBinding(root: string, binding: { sourceSha: string; sourceObjects: Record<string, string> }) {
  if (!/^[0-9a-f]{40}$/.test(binding.sourceSha)) throw new Error('Invalid final source SHA');
  git(root, ['rev-parse', '--verify', `${binding.sourceSha}^{commit}`]);
  git(root, ['merge-base', '--is-ancestor', implementationBaseSha, binding.sourceSha]);
  git(root, ['merge-base', '--is-ancestor', binding.sourceSha, 'HEAD']);
  const authorization = git(root, ['show', `${authorizationSha}:docs/agents/P3-E08-B11-FINAL-EVIDENCE-REPAIR-AUTHORIZATION.md`]).toString('utf8');
  for (const path of repairPaths) if (!authorization.includes(`- ${path}`)) throw new Error(`Unbound repair authorization: ${path}`);
  for (const path of text(root, ['diff', '--name-only', implementationBaseSha, 'HEAD']).split('\n').filter(Boolean)) {
    if (!repairPaths.includes(path)) throw new Error(`Unauthorized repair delta: ${path}`);
  }
  if (!isDeepStrictEqual(Object.keys(binding.sourceObjects).sort(), [...finalSourcePaths].sort())) throw new Error('Incomplete final source objects');
  const refs = [...finalSourcePaths.map(path => `${binding.sourceSha}:${path}`), ...finalSourcePaths.map(path => `HEAD:${path}`),
    ...sourcePaths.map(path => `7ec91bbc26be0f63332d5cc8421b2c7c014906c5:${path}`)];
  const objects = execFileSync('git', ['cat-file', '--batch-check=%(objectname)'], {
    cwd: root, input: `${refs.join('\n')}\n`, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
  }).trim().split('\n');
  for (const [index, path] of finalSourcePaths.entries()) {
    if (binding.sourceObjects[path] !== objects[index] || objects[index + finalSourcePaths.length] !== objects[index]) throw new Error(`Final source drift: ${path}`);
  }
  for (const [index, path] of sourcePaths.entries()) {
    if (objects[index + finalSourcePaths.length * 2] !== binding.sourceObjects[path]) throw new Error(`Unreviewed runtime/classifier source: ${path}`);
  }
  const evidenceOnly = [coveragePath, 'scripts/fixtures/phase3-b11-task-check.json', repairPaths[7], repairPaths[8]];
  const checkedPaths = ['.', ...evidenceOnly.map(path => `:(exclude)${path}`)];
  if (text(root, ['diff', 'HEAD', '--', ...checkedPaths])) throw new Error('Dirty final inputs');
  if (text(root, ['ls-files', '--others', '--exclude-standard', '--', ...checkedPaths])) throw new Error('Untracked final inputs');
  return binding;
}

export async function buildFinalSync(root: string) {
  const input = JSON.parse(readFileSync(resolve(root, 'scripts/fixtures/phase3-b11-task-check.json'), 'utf8'));
  if (input.schemaVersion !== 'fd-p3-task-check-v2' || input.controlEpoch !== 'FD-P3-2026-09-23-08' || input.candidateSha !== input.finalBinding?.sourceSha) throw new Error('Final task/source binding mismatch');
  const binding = validateFinalBinding(root, input.finalBinding);
  const result = await buildSnapshotAtCheckout(root, binding.sourceSha);
  return { ...result, binding };
}

export async function collectFinalPacket(root: string) {
  const testedSha = text(root, ['rev-parse', 'HEAD']);
  if (text(root, ['status', '--porcelain=v1', '--untracked-files=all'])) throw new Error('Freeze a clean combination before collecting evidence');
  const task = JSON.parse(readFileSync(resolve(root, 'scripts/fixtures/phase3-b11-task-check.json'), 'utf8'));
  const previous = JSON.parse(readFileSync(resolve(root, repairPaths[7]), 'utf8'));
  const { coverage, binding } = await buildFinalSync(root);
  assertSameEvidence(JSON.parse(readFileSync(resolve(root, coveragePath), 'utf8')), coverage);
  const commands = [
    'npx tsx scripts/phase3-e08-b11-coverage-sync.ts --validate',
    'npx tsx scripts/phase3-e08-b11-coverage-sync.ts --final --validate',
    'npx vitest run scripts/tests/phase3-e08-b11-coverage-sync.test.ts scripts/tests/phase3-e06-post-merge-recount.test.ts scripts/tests/phase3-readiness-preflight.test.ts',
    `npm run phase3:preflight -- --manifest scripts/fixtures/phase3-b11-task-check.json --candidate ${binding.sourceSha} --base ${mainSha}`,
    'npm run phase3:contract-parity -- --contract scripts/fixtures/phase3-b11-parity-contract.json --candidate 7ec91bbc26be0f63332d5cc8421b2c7c014906c5',
    'npm run test:ci', 'npm run typecheck', 'npm run content:validate', 'npm run verify:generated-content',
    'npx vitest run packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/regression/production-resolution-bridge.test.ts packages/rules/tests/regression/b11-conversion-classification-api.test.ts packages/rules/tests/regression/b11-conversion-binding-ownership.test.ts',
    'npm run test --workspace @fd/server -- src/match-server.test.ts',
    'npx playwright test e2e/fd-golden-eater-result-binding.spec.ts e2e/fd-conversion-magic-core-primitive.spec.ts --repeat-each=5',
    'npm run test:source-assets', `git diff --check ${mainSha}...HEAD`,
  ];
  const results = commands.map(command => {
    process.stdout.write(`START ${command}\n`);
    const startedAt = new Date().toISOString(); const start = Date.now();
    let stdout = ''; let stderr = ''; let exitCode = 0;
    try { stdout = execSync(command, { cwd: root, encoding: 'utf8', timeout: 600_000, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (error) {
      const failure = error as { status?: number; stdout?: Buffer | string; stderr?: Buffer | string; message?: string };
      exitCode = failure.status ?? -1; stdout = String(failure.stdout ?? ''); stderr = String(failure.stderr ?? failure.message ?? '');
    }
    if (text(root, ['rev-parse', 'HEAD']) !== testedSha) throw new Error('Tested checkout HEAD changed during diagnostics');
    validateFinalBinding(root, binding);
    const record = { command, exitCode, testedSha, sourceSha: binding.sourceSha, startedAt, durationMs: Date.now() - start,
      stdout, stderr, outputSha256: sha256(`${stdout}\n${stderr}`),
      scope: command.includes('contract-parity') ? 'FROZEN_REVIEWED_PREMISE_ON_7ec91bbc; FINAL_SOURCE_OBJECT_EQUIVALENCE_VERIFIED' : 'ACTUAL_FROZEN_COMBINATION_CHECKOUT' };
    process.stdout.write(`END exit=${exitCode} ${command}\n`);
    return record;
  });
  const preflight = results.find(row => row.command.includes('phase3:preflight'))!;
  const currentIssues = JSON.parse(preflight.stdout.slice(preflight.stdout.indexOf('{'))).issues;
  const packet = {
    schemaVersion: 'fd-p3-final-combination-evidence-v1', taskId: 'P3-E08-B11-FINAL-EVIDENCE-RECONCILIATION',
    controlEpoch: 'FD-P3-2026-09-23-08', generatedAt: text(root, ['show', '-s', '--format=%cI', testedSha]),
    status: 'CONSOLIDATED_REVIEW_PACKET_NOT_READINESS_ACCEPTANCE', observedMainSha: mainSha,
    frozenCombinationSha: testedSha, finalSourceSha: binding.sourceSha,
    evidenceCarrierSha: 'RESOLVE_FROM_GIT_HANDOFF_NOT_SELF_REFERENTIAL', sourceObjects: binding.sourceObjects,
    authorization: task.authorization, reservation: task.repairReservation,
    sourceMembership: ['7868b82949e3e17e64218755e0efe3ed478ff778', 'd13ab485dc54398581568a5a66bd696d4459862d',
      'c0db16ae65699b2e2789c7776c0aa4271b11e496', '7ec91bbc26be0f63332d5cc8421b2c7c014906c5',
      '7a9699efcca8e16467cd973a7c7dd522e5a230a9', implementationBaseSha].map(sha => {
        git(root, ['merge-base', '--is-ancestor', sha, testedSha]);
        return { sha, parent: text(root, ['rev-parse', `${sha}^`]), tree: text(root, ['rev-parse', `${sha}^{tree}`]), acceptance: 'MEMBERSHIP_ONLY; PRIOR_REVIEW_SCOPES_NOT_EXPANDED' };
      }),
    scopedReviews: [
      ['b81acf2b4749a09b1dfc0a6f292dda442b7fdbd5', 'docs/reviews/phase3/P3-E08-B11-premise-sync-reviewer-a.json'],
      ['31bad4ac87e728e5c80b9a9448f63c84f57a1d46', 'docs/reviews/phase3/P3-E08-B11-observation-repair-reviewer-a.json'],
      ['f2da26c56cc8c5e2b8ffe35d9802051a2e3d7540', 'docs/reviews/phase3/P3-E08-B11-fixture-premise-be7dd6b-review.json'],
    ].map(([commit, path]) => {
      const bytes = git(root, ['show', `${commit}:${path}`]);
      return { commit, path, sha256: sha256(bytes), parent: text(root, ['rev-parse', `${commit}^`]),
        exactOriginalArtifact: JSON.parse(bytes.toString('utf8')), finalAcceptanceInherited: false };
    }),
    provenance: task.provenance, overlappingSourceChanges: task.overlappingSourceChanges,
    coverage: { path: coveragePath, sha256: sha256(readFileSync(resolve(root, coveragePath))), sourceFingerprint: coverage.sourceFingerprint,
      counts: counts(coverage), definitionHash: coverage.compiledDefinitions.definitionHash },
    historicalEvidence: { carrierSha: historicalCarrierSha,
      artifacts: [syncPath, reportPath, 'artifacts/phase3-e06-a-post-merge-setup-create-to-skill-recount.json'].map(path => {
          const bytes = git(root, ['show', `${implementationBaseSha}:${path}`]);
          assertSameEvidence(bytes, readFileSync(resolve(root, path)));
          return { path, commit: implementationBaseSha, sha256: sha256(bytes), unchanged: true };
        }),
      diagnosedSha: implementationBaseSha, command: 'npm run test:ci', exitCode: 1,
      rawSummary: 'Test Files 2 failed | 191 passed (193); Tests 1 failed | 1499 passed | 3 skipped (1503)',
      explanation: 'One beforeAll source-binding failure skipped all three tests in its suite; the other suite had one failed assertion. File and test failure counts therefore differ.',
      failures: ['Candidate source drift: packages/rules/src', 'recount.test.ts:122 exact scan locations differ'],
      priorTimeoutRpcFailures: 'RETAINED_HISTORICAL_NOT_REPRODUCED_ON_46dbd031',
      repairRedRun: 'Uncommitted authorized source edits rejected Dirty final inputs; 13 passed / 2 failed. No dirty bypass added.',
    },
    previousAttempts: previous.schemaVersion === 'fd-p3-final-combination-evidence-v1' ?
      [...(previous.previousAttempts ?? []), { testedSha: previous.frozenCombinationSha, sourceSha: previous.finalSourceSha,
        artifactSha256: sha256(readFileSync(resolve(root, repairPaths[7]))), commands: previous.commands,
        disposition: 'All assertions passed; unhandled onTaskUpdate RPC timeout made focused and CI exit 1. Original outputs retained; no timeout/waiver change.' }] : [],
    commands: results, remainingBlockers: currentIssues,
    releaseBlocker: 'SOURCE_ASSETS_REQUIRED_RESULT_RECORDED_SEPARATELY; NO_POLICY_REDEFINITION',
    review: { reviewerA: 'PENDING_FINAL_EXACT_SHA', reviewerB: 'PENDING_FINAL_EXACT_SHA', readiness: 'NOT_GRANTED',
      globalGateC: 'NOT_VERIFIED', promotion: 'NOT_GRANTED' },
    formalAccounting: { accepted: 111, denominator: 944, remaining: 833, coverageCreditDelta: 0, migrationCreditDelta: 0,
      denominatorDelta: 0, promotedOnMain: false, basis: 'FROZEN_LEDGER_UNCHANGED; NOT_A_NEW_ACCEPTANCE_RECOUNT' },
    runtimeServerAuthoringDeltaByA: 'NONE', c01Dispatch: 'NOT_AUTHORIZED', promotionPr: 'NONE',
  };
  const artifactPath = repairPaths[7]; const report = repairPaths[8];
  const bytes = `${JSON.stringify(packet, null, 2)}\n`; writeFileSync(resolve(root, artifactPath), bytes);
  writeFileSync(resolve(root, report), `# B11 Final Combination Evidence\n\nTask: ${packet.taskId}\nEpoch: ${packet.controlEpoch}\n` +
    `Observed main: ${mainSha}\nFrozen combination: ${testedSha}\nFinal source: ${binding.sourceSha}\n` +
    `Artifact: ${artifactPath}\nSHA-256: ${sha256(bytes)}\n\n` +
    `One consolidated packet; no readiness, runtime, Gate or promotion PASS granted by A.\n` +
    `Forty prior uncovered paths and two overlapping changes have exact provenance. Registration is not authorization/acceptance; unresolved original scopes remain fail-visible.\n` +
    `Historical artifacts unchanged; original deterministic failures and timeout/RPC history retained in packet. Source objects and compiler outputs remain fully checked.\n\n` +
    `## Fresh commands\n${results.map(row => `- ${row.command}: exit ${row.exitCode}; tested SHA ${row.testedSha}; output SHA256 ${row.outputSha256}`).join('\n')}\n\n` +
    `## Remaining blockers\n${currentIssues.map((issue: { code: string; path: string }) => `- ${issue.code}: ${issue.path}`).join('\n')}\n\n` +
    `Raw diagnostic counts: ${Object.values(counts(coverage)).join('/')}. Formal ledger remains 111/944; all three credit deltas 0.\n` +
    `Source-assets output is separate from ordinary content validation; no Release waiver. Global Gate C NOT_VERIFIED.\n` +
    `Legacy consumers outside the scoped pair retained. A changed no runtime, socket, authoring, generated content, taxonomy, KPI, workflow or timeout.\n` +
    `Next: RA and RB independently review this frozen combination and its carrier in parallel. Planner disposes unproven original authorizations; I waits. No role PR or C01 dispatch.\n`);
  process.stdout.write(`PACKET ${artifactPath} SHA256=${sha256(bytes)} testedSha=${testedSha}\n`);
}

export function assertSameEvidence(actual: unknown, expected: unknown): void {
  if (!isDeepStrictEqual(actual, expected)) throw new Error('Exact candidate coverage/evidence mismatch');
}

export function renderReport(sync: Awaited<ReturnType<typeof buildSync>>['sync']): string {
  return `# B11 Coverage Evidence Sync\n\nTask: ${sync.taskId}\nEpoch: ${sync.controlEpoch}\n\n` +
    `Observed main: ${mainSha}\nCandidate: ${candidateSha}\nParent: ${sync.lineage.candidateParent}\n\n` +
    `Sync artifact: ${syncPath}\nSHA-256: ${sha256(`${JSON.stringify(sync, null, 2)}\n`)}\n` +
    `Coverage artifact: ${coveragePath}\nSHA-256: ${sync.candidateCoverage.artifactSha256}\n\n` +
    `Baseline (new/legacyResolve/legacyExecute/dual/notClassifiable): ${Object.values(sync.candidateLocalRouting.before).join('/')}\n` +
    `Candidate: ${Object.values(sync.candidateLocalRouting.after).join('/')}\n` +
    `Candidate-local delta: ${Object.values(sync.candidateLocalRouting.delta).join('/')}\n\n` +
    `Changed routes:\n${sync.candidateLocalRouting.changedRoutes.map(row => `- ${row.cardId} / ${row.abilityId}: ${row.before} -> ${row.after}`).join('\n')}\n\n` +
    `Main coverage/migration/denominator credit: 0/0/0. Not promoted.\n` +
    `No exact Reviewer artifact supplied. All Gates NOT_VERIFIED. Dispatch test results are B-reported, not A fresh verification.\n` +
    `Historical recount uses immutable Git blobs; current checkout coverage is independently recompiled and recomputed.\n\n` +
    `A verification (not Reviewer acceptance):\n${sync.automationVerification.commands.map(item => `- ${item.command}: exit ${item.exitCode}; ${item.result}`).join('\n')}\n\n` +
    `Initial failure retained: ${sync.automationVerification.initialFailure}\n\n` +
    `Retained blockers:\n${sync.retainedLimitations.map(item => `- ${item}`).join('\n')}\n\n` +
    `Reproduce: npx tsx scripts/phase3-e08-b11-coverage-sync.ts\n` +
    `Verify: npx vitest run scripts/tests/phase3-e08-b11-coverage-sync.test.ts scripts/tests/phase3-e06-post-merge-recount.test.ts\n` +
    `Next: Reviewer A reviews evidence; Runtime Owner fixes socket lifecycle; Reviewer B reviews exact runtime candidate.\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void (async () => {
  const root = resolve('.');
  if (process.argv.includes('--collect')) {
    await collectFinalPacket(root);
  } else if (process.argv.includes('--final')) {
    const { coverage, binding } = await buildFinalSync(root);
    if (process.argv.includes('--validate')) assertSameEvidence(JSON.parse(readFileSync(resolve(root, coveragePath), 'utf8')), coverage);
    else writeFileSync(resolve(root, coveragePath), `${JSON.stringify(coverage, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify({ sourceSha: binding.sourceSha, counts: counts(coverage), status: 'DIAGNOSTIC_ONLY_NOT_ACCEPTANCE' })}\n`);
  } else {
    const { sync } = await buildSync(root);
    process.stdout.write(`${JSON.stringify({ historicalCarrierSha, routing: sync.candidateLocalRouting, historicalArtifactsUnchanged: true })}\n`);
  }
  })().catch(error => { process.stderr.write(`${error instanceof Error ? error.stack : error}\n`); process.exitCode = 1; });
}
