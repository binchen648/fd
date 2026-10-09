import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { buildCoverageFromArchives, loadAuthoringArchives, type AuthoringArchiveLike } from './phase3-coverage';

export const mainSha = '9a1689d2ec5b56b67d1483d2593b4ab809d6c15c';
export const candidateSha = '7868b82949e3e17e64218755e0efe3ed478ff778';
export const coveragePath = 'artifacts/phase3-skill-coverage.json';
export const syncPath = 'artifacts/phase3-e08-b11-coverage-sync.json';
export const reportPath = 'docs/reports/2026-10-09-p3-e08-b11-coverage-sync.md';
const manifestPath = 'docs/agents/manifests/tasks/P3-E08-B11-RESULT-BINDING-CURRENT-MAIN-REPLAY.json';
const sourcePaths = ['data/authoring', 'data/packs', 'data/generated', 'packages/content/src', 'packages/rules/src', 'scripts/phase3-coverage.ts'];

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

export async function buildSync(root: string) {
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
  const root = resolve('.');
  const { coverage, sync } = await buildSync(root);
  const outputs = { [coveragePath]: coverage, [syncPath]: sync };
  if (process.argv.includes('--validate')) {
    for (const [path, value] of Object.entries(outputs)) assertSameEvidence(JSON.parse(readFileSync(resolve(root, path), 'utf8')), value);
    assertSameEvidence(readFileSync(resolve(root, reportPath), 'utf8'), renderReport(sync));
  } else {
    for (const [path, value] of Object.entries(outputs)) writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`);
    writeFileSync(resolve(root, reportPath), renderReport(sync));
  }
  process.stdout.write(`${JSON.stringify(sync.candidateLocalRouting)}\n`);
}
