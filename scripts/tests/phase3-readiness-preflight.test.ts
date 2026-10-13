import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setImmediate as yieldToEventLoop } from 'node:timers/promises';
import { assertFinalTaskCheck, buildFinalTaskCheck, buildContinuationTaskCheck, runPreflight, buildE09IntegrationBinding, buildE09ClosureProducerBinding, validateE09IntegrationClosure, e09PreReviewFixtureSha, type E09ClosureInputs } from '../phase3-preflight';
import { git, gitText, hash, InputError } from '../phase3-tooling-common';
import { publicationSha, reference } from '../phase3-b11-tooling-inputs';
import { buildContinuationBinding, validateContinuationBinding, validateContinuationReceiptReference, createHistoricalEvidenceSnapshot, type ContinuationReceipt, type ReceiptReference } from '../phase3-e08-b11-coverage-sync';

const snapshot = createHistoricalEvidenceSnapshot(resolve(fileURLToPath(new URL('../..', import.meta.url))));
const root = snapshot.root;
const currentRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
afterAll(snapshot.cleanup);
const taskId = 'P3-E08-B11-RESULT-BINDING-CURRENT-MAIN-REPLAY';
const manifestPath = `docs/agents/manifests/tasks/${taskId}.json`;
const sourcePath = 'packages/rules/src/ability/resolution-dataflow.ts';
const rulesPath = 'docs/rules/FD-Game-Rules-Final.md';
const directories: string[] = [];

function fixture(mode: 'normal' | 'delete' | 'rename') {
  const cwd = mkdtempSync(join(tmpdir(), 'fd-readiness-test-')); directories.push(cwd);
  git(cwd, ['init']); git(cwd, ['config', 'user.name', 'Automation Fixture']); git(cwd, ['config', 'user.email', 'fixture@example.invalid']);
  const common = resolve(root, gitText(root, ['rev-parse', '--git-common-dir']));
  writeFileSync(join(cwd, '.git/objects/info/alternates'), `${join(common, 'objects').replaceAll('\\', '/')}\n`);
  const write = (path: string, text: string) => { mkdirSync(dirname(join(cwd, path)), { recursive: true }); writeFileSync(join(cwd, path), text); };
  write(sourcePath, 'base\n'); write(rulesPath, '# Fixture canonical rules\n'); write('apps/client/outside.txt', 'outside\n');
  git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'base']); const base = gitText(cwd, ['rev-parse', 'HEAD']);
  write(sourcePath, 'candidate\n');
  write(manifestPath, JSON.stringify({ taskId, owner: 'Codex B', baseCommit: base }));
  if (mode === 'delete') rmSync(join(cwd, 'apps/client/outside.txt'));
  if (mode === 'rename') {
    git(cwd, ['mv', sourcePath, 'apps/client/renamed.txt']);
  }
  git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'candidate']); const candidate = gitText(cwd, ['rev-parse', 'HEAD']);
  write('review.json', JSON.stringify({ schemaVersion: 'fd-p3-task-review-v1', taskId, controlEpoch: 'FD-P3-2026-09-23-08', reviewedSha: candidate, verdict: 'PASS', reviewer: 'Codex Reviewer B' }));
  write('execution.json', JSON.stringify({ schemaVersion: 'fd-p3-execution-check-v1', testedSha: candidate, command: 'fixture-check', exitCode: 0, producer: 'test fixture only' }));
  git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'fixture review and execution']); const review = gitText(cwd, ['rev-parse', 'HEAD']);
  const input = {
    schemaVersion: 'fd-p3-task-check-v1', taskId: 'P3-E08-B11-COMBINATION-READINESS', controlEpoch: 'FD-P3-2026-09-23-08', baseSha: base, candidateSha: candidate,
    contract: reference(cwd, publicationSha, 'docs/agents/P3-E08-B11-TOOLING-MINIMUM-CONTRACT.md', '## phase3:preflight'),
    segments: [{ adapter: 'b11-v1', role: 'B', taskId, scope: 'RESULT_BINDING_B11', baseSha: base, candidateSha: candidate,
      authorizedPaths: [sourcePath, manifestPath], record: reference(cwd, candidate, manifestPath),
      references: [reference(cwd, candidate, rulesPath, '# Fixture canonical rules')],
      dependencies: [{ taskId, candidateSha: candidate, state: 'ACCEPTED', review: reference(cwd, review, 'review.json') }],
    }],
    checks: [{ id: 'fixture-check', command: 'fixture-check', state: 'EXECUTED', testedSha: candidate, evidence: reference(cwd, review, 'execution.json') }],
  };
  return { cwd, base, candidate, review, input };
}

let normal: ReturnType<typeof fixture>;
let deleted: ReturnType<typeof fixture>;
let renamed: ReturnType<typeof fixture>;
let finalTask: ReturnType<typeof buildFinalTaskCheck>;
let continuationTask: ReturnType<typeof buildContinuationTaskCheck>;
let currentResult: ReturnType<typeof runPreflight>;
let unauthorized: string;
let invalidCommand: string;
let receiptFixture: { binding: ReturnType<typeof buildContinuationBinding>; receipts: ContinuationReceipt[]; reference: ReceiptReference };
const evaluate = (context: ReturnType<typeof fixture>, input: unknown = context.input, candidate = context.candidate) => runPreflight(context.cwd, input, candidate, context.base, hash(JSON.stringify(input)));

describe('integration preflight does not inherit historical readiness', () => {
  it('requires the actual final SHA and rejects unsupported external closure fields', () => {
    const producer = buildE09ClosureProducerBinding(currentRoot, true);
    expect(() => runPreflight(currentRoot, producer, producer.technicalBinding.technicalCarrierSha, producer.technicalBinding.observedMainSha, hash(JSON.stringify(producer)))).toThrow('Closure CLI SHA mismatch');
    const head = gitText(currentRoot, ['rev-parse', 'HEAD']);
    expect(() => runPreflight(currentRoot, { schemaVersion: 'fd-p3-e09-integration-closure-check-v1', producerBinding: producer, temporal: {}, waiveMissingReview: true }, head, producer.technicalBinding.observedMainSha, '0'.repeat(64))).toThrow('unknown field');
  });
  it('rejects stale CLI identity before evaluation and requires the integration schema', () => {
    const input = buildE09IntegrationBinding(currentRoot);
    expect(() => runPreflight(currentRoot, input, input.technicalCarrierSha, input.observedMainSha, hash(JSON.stringify(input)))).toThrow('Integration CLI SHA mismatch');
    expect(() => runPreflight(currentRoot, { ...input, schemaVersion: 'fd-p3-e09-unrecognized' }, input.assemblySha, input.observedMainSha, '0'.repeat(64))).toThrow();
  });
});

describe('exact Planner stability authorization continuation', () => {
  let cwd: string;
  let candidate: string;
  let producer: ReturnType<typeof buildE09ClosureProducerBinding>;
  const temporal = (): E09ClosureInputs => ({ stage: 'PRODUCER', producerCandidateSha: null, reviewReferences: [], governanceReferences: [], synchronizationSha: null, finalHeadSha: gitText(cwd, ['rev-parse', 'HEAD']) });
  beforeAll(async () => {
    cwd = mkdtempSync(join(tmpdir(), 'fd-stability-authority-'));
    git(currentRoot, ['clone', '--shared', '--no-checkout', '--', currentRoot, cwd]);
    git(cwd, ['checkout', '--detach', e09PreReviewFixtureSha]);
    const path = 'scripts/tests/phase3-contract-parity.test.ts';
    writeFileSync(join(cwd, path), readFileSync(join(cwd, path), 'utf8') + '\n// test-only exact authorized delta\n');
    git(cwd, ['add', path]);
    git(cwd, ['-c', 'user.name=Evidence fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'test-only authorized parity delta']);
    candidate = gitText(cwd, ['rev-parse', 'HEAD']);
    producer = buildE09ClosureProducerBinding(cwd, true);
    await yieldToEventLoop();
  }, 30_000);
  afterEach(async () => { await yieldToEventLoop(); });
  afterAll(() => { if (cwd) rmSync(cwd, { recursive: true, force: true }); });
  it('admits the exact authorized parity delta without granting acceptance', () => {
    const result = validateE09IntegrationClosure(cwd, producer, temporal());
    expect(producer.authorizationContinuation?.authority.commit).toBe('bd0dabe80c40cdc3bae024303b68851d11f980b2');
    expect(producer.authorizationContinuation?.supplement.commit).toBe('4ecae8e9097d28d401df5a2cf0eec96be28ebe08');
    expect(producer.authorizationContinuation?.authorizedTestPaths).toEqual([
      'scripts/tests/phase3-e09-b11-final-binding.test.ts', 'scripts/tests/phase3-readiness-preflight.test.ts', 'scripts/tests/phase3-contract-parity.test.ts',
    ]);
    expect(result.acceptanceGranted).toBe(false);
    expect(result.promotionAllowed).toBe(false);
  }, 60_000);
  it('rejects the parity delta when exact continuation authority is absent', () => {
    expect(() => validateE09IntegrationClosure(cwd, buildE09ClosureProducerBinding(cwd), temporal())).toThrow('Unknown integration delta');
  }, 30_000);
  it.each(['hash', 'commit', 'task', 'paths', 'lineage'])('rejects forged or mismatched %s authorization', mode => {
    const bad = structuredClone(producer);
    const continuation = bad.authorizationContinuation!;
    if (mode === 'hash') continuation.authority.sha256 = '0'.repeat(64);
    if (mode === 'commit') continuation.authority.commit = continuation.supplement.commit;
    if (mode === 'task') continuation.taskId = 'ARBITRARY_TASK';
    if (mode === 'paths') continuation.authorizedTestPaths.push('scripts/tests/unknown.test.ts');
    if (mode === 'lineage') continuation.failedCarrierSha = producer.frozenAssemblySha;
    expect(() => validateE09IntegrationClosure(cwd, bad, temporal())).toThrow();
  }, 15_000);
  it('rejects an actual extra test file instead of admitting a tests directory', () => {
    const path = 'scripts/tests/UNAUTHORIZED-STABILITY.test.ts';
    try {
      writeFileSync(join(cwd, path), '// unknown test path\n'); git(cwd, ['add', path]);
      git(cwd, ['-c', 'user.name=Evidence fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'test-only forbidden path']);
      expect(() => validateE09IntegrationClosure(cwd, producer, temporal())).toThrow(`Unknown integration delta: ${path}`);
    } finally { git(cwd, ['checkout', '--detach', candidate]); }
  }, 30_000);
});

describe('readiness preflight, independent from promotion policy', () => {
  // Synchronous Git diagnostics must let Vitest deliver queued RPC updates between cases.
  afterEach(async () => { await yieldToEventLoop(); });
  beforeAll(() => {
    normal = fixture('normal'); deleted = fixture('delete'); renamed = fixture('rename');
    const input = JSON.parse(readFileSync(join(root, 'scripts/fixtures/phase3-b11-task-check.json'), 'utf8'));
    finalTask = buildFinalTaskCheck(root, input.finalBinding.sourceSha);
    continuationTask = buildContinuationTaskCheck(root, input.finalBinding.sourceSha);
    currentResult = runPreflight(root, input, input.candidateSha, input.baseSha, hash(JSON.stringify(input)));
    for (const mode of ['unauthorized', 'invalidCommand']) {
      const cwd = mkdtempSync(join(tmpdir(), 'fd-continuation-delta-')); directories.push(cwd);
      git(cwd, ['init']); git(cwd, ['config', 'user.name', 'Automation Fixture']); git(cwd, ['config', 'user.email', 'fixture@example.invalid']);
      const common = resolve(root, gitText(root, ['rev-parse', '--git-common-dir']));
      writeFileSync(join(cwd, '.git/objects/info/alternates'), `${join(common, 'objects').replaceAll('\\', '/')}\n`);
      git(cwd, ['checkout', '--detach', input.finalBinding.sourceSha]);
      if (mode === 'unauthorized') { writeFileSync(join(cwd, 'unauthorized.txt'), 'not authorized\n'); unauthorized = cwd; }
      else {
        const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
        pkg.scripts['test:ci'] += ' --testTimeout=15000'; writeFileSync(join(cwd, 'package.json'), JSON.stringify(pkg)); invalidCommand = cwd;
      }
      git(cwd, ['add', '.']); git(cwd, ['commit', '-m', `adversarial ${mode}`]);
    }
    const binding = buildContinuationBinding(unauthorized, input.finalBinding.sourceSha);
    const receipt: ContinuationReceipt = { command: 'npm run test:ci', sourceSha: binding.sourceSha, testedSha: binding.sourceSha,
      startedAt: '2026-10-10T00:00:00.000Z', durationMs: 0, exitCode: 1, stdout: 'SYNTHETIC_UNIT_FIXTURE_NOT_EXECUTION_EVIDENCE', stderr: '',
      outputSha256: hash('SYNTHETIC_UNIT_FIXTURE_NOT_EXECUTION_EVIDENCE\n') };
    const packetPath = 'artifacts/phase3-e08-b11-final-combination-evidence.json';
    const bytes = JSON.stringify({ schemaVersion: 'fd-p3-final-combination-evidence-v2', taskId: binding.taskId,
      controlEpoch: binding.controlEpoch, sourceSha: binding.sourceSha, implementationSha: binding.sourceSha,
      commands: [receipt], sourceObjects: binding.sourceObjects, authorizationContinuation: binding });
    writeFileSync(join(unauthorized, packetPath), bytes); git(unauthorized, ['add', '-f', packetPath]); git(unauthorized, ['commit', '-m', 'synthetic receipt integrity fixture']);
    const commit = gitText(unauthorized, ['rev-parse', 'HEAD']);
    receiptFixture = { binding, receipts: [receipt], reference: { commit, path: packetPath,
      blob: gitText(unauthorized, ['rev-parse', `${commit}:${packetPath}`]), sha256: hash(bytes) } };
  }, 60_000);
  afterAll(() => { for (const path of directories) rmSync(path, { recursive: true, force: true }); });
  it('binds every original uncovered path without converting registration into acceptance', () => {
    expect(finalTask.provenance).toHaveLength(40);
    expect(new Set(finalTask.provenance.map(row => row.path)).size).toBe(40);
    for (const row of finalTask.provenance) {
      expect(row.introducingSha).toMatch(/^[0-9a-f]{40}$/);
      expect(row.introducingDelta.sha256).toMatch(/^[0-9A-F]{64}$/);
      expect(row.finalContent.sha256).toMatch(/^[0-9A-F]{64}$/);
      expect(row.acceptedScope).toBe('NOT_ACCEPTED_WHOLESALE');
      expect(row.finalReviewState).toBe('PENDING_RA_RB_FINAL_COMBINATION');
      if (row.role === 'B') expect(row.originalAuthorization).toBeNull();
    }
    assertFinalTaskCheck(finalTask, structuredClone(finalTask));
  });
  it('keeps exact current continuation observations separate from missing original authority and final review', () => {
    const result = currentResult;
    expect(result.status).toBe('FAIL');
    expect(result.issues.filter(issue => issue.code === 'ORIGINAL_AUTHORIZATION_UNPROVEN')).toHaveLength(7);
    expect(result.issues.some(issue => issue.code === 'FINAL_RA_RB_REVIEW_PENDING')).toBe(true);
    expect(result.issues.some(issue => issue.code === 'UNCOVERED_CHANGED_PATH')).toBe(false);
    expect(result.acceptanceGranted).toBe(false);
  });
  it.each(['unauthorized', 'invalidCommand'])('rejects actual committed %s deltas, not only caller claims', mode => {
    const cwd = mode === 'unauthorized' ? unauthorized : invalidCommand;
    const task = JSON.parse(readFileSync(join(root, 'scripts/fixtures/phase3-b11-task-check.json'), 'utf8'));
    const binding = buildContinuationBinding(cwd, task.finalBinding.sourceSha);
    expect(() => validateContinuationBinding(cwd, binding)).toThrow();
  });
  it('rejects output tampering even after a caller recomputes the receipt hash', () => {
    const { binding, receipts, reference: ref } = receiptFixture;
    validateContinuationReceiptReference(unauthorized, ref, receipts, binding);
    const bad = structuredClone(receipts); bad[0].stdout = 'forged'; bad[0].outputSha256 = hash(`${bad[0].stdout}\n${bad[0].stderr}`);
    expect(() => validateContinuationReceiptReference(unauthorized, ref, bad, binding)).toThrow();
  }, 30_000);
  it.each(['schema', 'receipt', 'history', 'scope', 'pending'])('fails closed for invalid current %s inputs', mode => {
    const bad: any = structuredClone(continuationTask);
    if (mode === 'schema') bad.schemaVersion = 'fd-p3-task-check-v999';
    if (mode === 'receipt') bad.execution.receipts = [{ command: 'npm run test:ci', exitCode: 0, trusted: true }];
    if (mode === 'history') bad.historicalInputSha256 = '0'.repeat(64);
    if (mode === 'scope') bad.execution.reviews[0].scope = 'FINAL_ACCEPTANCE';
    if (mode === 'pending') bad.execution.finalReviewState = 'PASS';
    expect(() => runPreflight(root, bad, bad.candidateSha, bad.baseSha, hash(JSON.stringify(bad)))).toThrow();
  }, 15_000);
  it('rejects altered introducing SHA, hashes, original authority, scope, checks and credit', () => {
    for (const mutate of [
      (v: any) => { v.provenance[0].introducingSha = '0'.repeat(40); },
      (v: any) => { v.provenance[0].finalContent.sha256 = '0'.repeat(64); },
      (v: any) => { v.provenance[0].originalAuthorization = v.authorization; },
      (v: any) => { v.provenance[0].acceptedScope = 'ACCEPTED'; },
      (v: any) => { v.provenance.pop(); },
      (v: any) => { v.provenance[0].path = 'packages/rules/src/**'; },
      (v: any) => { v.checks[0].state = 'PASS'; },
      (v: any) => { v.formalCredit.mainCoverageCreditDelta = 1; },
    ]) {
      const actual = structuredClone(finalTask); mutate(actual);
      expect(() => assertFinalTaskCheck(actual, finalTask)).toThrow('Final provenance evidence mismatch');
    }
  });
  it('verifies exact committed input, role-scoped paths, review and execution binding', () => {
    const result = evaluate(normal);
    expect(result.status).toBe('PASS'); expect(result.issues).toEqual([]);
    expect(result.acceptanceGranted).toBe(false); expect(result.reviewReadyChanged).toBe(false);
  }, 15_000);
  it.each(['stale candidate', 'pending dependency', 'missing dependency evidence'])('rejects %s independently', mode => {
    if (mode === 'stale candidate') {
      expect(evaluate(normal, normal.input, normal.review).issues.map(issue => issue.code)).toContain('EXACT_SHA_MISMATCH');
    } else if (mode === 'pending dependency') {
      const pending = structuredClone(normal.input) as any;
      pending.segments[0].dependencies[0] = { taskId, candidateSha: normal.candidate, state: 'PENDING' };
      expect(evaluate(normal, pending).issues.map(issue => issue.code)).toContain('DEPENDENCY_PENDING');
    } else {
      const missing = structuredClone(normal.input);
      missing.segments[0].dependencies[0].review.path = 'missing.json';
      expect(evaluate(normal, missing).issues.map(issue => issue.code)).toContain('REFERENCE_BINDING_FAILED');
    }
  }, 15_000);
  it('rejects unauthorized deleted and renamed paths, not just surviving files', () => {
    expect(evaluate(deleted).issues.some(issue => issue.code === 'UNAUTHORIZED_CHANGED_PATH' && issue.path === 'apps/client/outside.txt')).toBe(true);
    const result = evaluate(renamed);
    expect(result.changedPaths).toContain(sourcePath);
    expect(result.issues.some(issue => issue.code === 'UNAUTHORIZED_CHANGED_PATH' && issue.path === 'apps/client/renamed.txt')).toBe(true);
  }, 15_000);
  it('rejects unsupported schemas, arbitrary adapter shapes and role expansion', () => {
    expect(() => evaluate(normal, { ...normal.input, schemaVersion: 'contractVersion=1' })).toThrow(InputError);
    const bad = structuredClone(normal.input); bad.segments[0].adapter = '__proto__';
    expect(() => evaluate(normal, bad)).toThrow(InputError);
    const expanded = structuredClone(normal.input); expanded.segments[0].role = 'A';
    expect(evaluate(normal, expanded).issues.map(issue => issue.code)).toContain('ADAPTER_OWNER_SCOPE_MISMATCH');
  }, 15_000);
  it('rejects digest drift and never treats the dirty working tree as the tested commit', () => {
    const input = structuredClone(normal.input); input.segments[0].record.sha256 = '0'.repeat(64);
    expect(evaluate(normal, input).issues.map(issue => issue.code)).toContain('REFERENCE_BINDING_FAILED');
    writeFileSync(join(normal.cwd, 'dirty.txt'), 'dirty\n');
    const result = evaluate(normal); expect(result.worktree.dirty).toBe(true); expect(result.worktree.inspectedWorkingTree).toBe(false);
    expect(readFileSync(join(normal.cwd, sourcePath), 'utf8')).toBe('candidate\n');
  }, 15_000);
});
