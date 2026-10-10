import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { assertSameEvidence, buildSync, buildFinalSync, historicalCarrierSha, validateFinalBinding, coveragePath, renderReport, reportPath, sha256, syncPath,
  buildContinuationBinding, validateContinuationBinding, buildContinuationReviews, validateContinuationReviews,
  validateContinuationReceipt, type ContinuationReceipt } from '../phase3-e08-b11-coverage-sync';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
let expected: Awaited<ReturnType<typeof buildSync>>;
let finalSnapshot: Awaited<ReturnType<typeof buildFinalSync>>;

beforeAll(async () => {
  expected = await buildSync(root);
  const task = JSON.parse(readFileSync(resolve(root, 'scripts/fixtures/phase3-b11-task-check.json'), 'utf8'));
  buildContinuationBinding(root, task.finalBinding.sourceSha);
  buildContinuationReviews(root);
  finalSnapshot = await buildFinalSync(root);
}, 30_000);
const historicalBytes = (path: string) => execFileSync('git', ['show', `${historicalCarrierSha}:${path}`], { cwd: root, maxBuffer: 32 * 1024 * 1024 });

describe('B11 exact candidate coverage synchronization', () => {
  it('recomputes full baseline/candidate routing, compiler output, Git lineage and hashes', () => {
    const coverageBytes = historicalBytes(coveragePath);
    const syncBytes = historicalBytes(syncPath);
    assertSameEvidence(JSON.parse(coverageBytes.toString('utf8')), expected.coverage);
    assertSameEvidence(JSON.parse(syncBytes.toString('utf8')), expected.sync);
    expect(sha256(coverageBytes)).toBe(expected.sync.candidateCoverage.artifactSha256);
    expect(expected.sync.candidateLocalRouting.before).toEqual({ new: 22, legacyResolve: 144, legacyExecute: 3, dual: 0, notClassifiable: 112 });
    expect(expected.sync.candidateLocalRouting.after).toEqual({ new: 23, legacyResolve: 144, legacyExecute: 3, dual: 0, notClassifiable: 111 });
    expect(expected.sync.candidateLocalRouting.changedRoutes).toHaveLength(1);
    expect(expected.sync.candidateLocalRouting.changedRoutes[0].after).toBe('NEW_RUNTIME_SEMANTIC_ROUTED');
    for (const [cardId, abilityId] of [
      ['master.irisviel.skill.conversion-magic', 'conversion-magic.preparation'],
      ['servant.kintoki.skill.sc-kintoki-3', 'sc-kintoki-3.golden-eater'],
    ]) {
      const rows = expected.coverage.semanticAxes.filter(row => row.cardId === cardId && row.abilityId === abilityId);
      expect(rows).toHaveLength(1);
      expect(rows[0].runtimeRoute).toBe('NEW_RUNTIME_SEMANTIC_ROUTED');
    }
    expect(expected.sync.lineage.candidateInObservedMain).toBe(false);
    expect(expected.sync.formalCredit).toEqual({ mainCoverageCreditDelta: 0, migrationCreditDelta: 0, denominatorDelta: 0, promotedOnMain: false });
    expect(expected.sync.review.verdict).toBe('NOT_VERIFIED');
  });

  it('rejects altered counts, hashes, lineage, promotion, review claims and identity routes', () => {
    const mutations = [
      (value: typeof expected.sync) => { value.candidateLocalRouting.after.new += 1; },
      (value: typeof expected.sync) => { value.candidateLocalRouting.delta.new = 3; },
      (value: typeof expected.sync) => { value.candidateCoverage.artifactSha256 = '0'.repeat(64); },
      (value: typeof expected.sync) => { value.lineage.candidateParent = value.lineage.observedMainSha; },
      (value: typeof expected.sync) => { value.lineage.candidateInObservedMain = true; },
      (value: typeof expected.sync) => { value.formalCredit.mainCoverageCreditDelta = 1; },
      (value: typeof expected.sync) => { value.review.verdict = 'PASS'; },
      (value: typeof expected.sync) => { value.candidateLocalRouting.changedRoutes[0].abilityId = 'unrelated'; },
    ];
    for (const mutate of mutations) {
      const actual = structuredClone(expected.sync);
      mutate(actual);
      expect(() => assertSameEvidence(actual, expected.sync)).toThrow('Exact candidate coverage/evidence mismatch');
    }
  });

  it('binds the report to exact artifact bytes and regenerates deterministically', async () => {
    expect(historicalBytes(reportPath).toString('utf8')).toBe(renderReport(expected.sync));
    const second = await buildSync(root);
    expect(JSON.stringify(second)).toBe(JSON.stringify(expected));
    expect(renderReport(second.sync)).toBe(renderReport(expected.sync));
  }, 30_000);
});

describe('final source coverage is separate from immutable history', () => {
  it('admits only the pinned authorization continuation and exact concurrency delta', () => {
    const task = JSON.parse(readFileSync(resolve(root, 'scripts/fixtures/phase3-b11-task-check.json'), 'utf8'));
    const binding = buildContinuationBinding(root, task.finalBinding.sourceSha);
    expect(binding.authorizations).toHaveLength(3);
    expect(binding.changedPaths.find(row => row.path === 'package.json')?.authorization.commit).toBe('08e2f8cbf99b69ff1220b9dc1e933ec08fe57158');
    validateContinuationBinding(root, binding);
    expect(() => validateFinalBinding(root, task.finalBinding)).toThrow();
  });
  it.each(['missing', 'forged', 'unknown-key', 'unauthorized-path', 'wrong-epoch'])('rejects %s continuation evidence', mode => {
    const task = JSON.parse(readFileSync(resolve(root, 'scripts/fixtures/phase3-b11-task-check.json'), 'utf8'));
    const binding: any = structuredClone(task.finalBinding);
    if (mode === 'missing') binding.authorizations.pop();
    if (mode === 'forged') binding.authorizations[2].sha256 = '0'.repeat(64);
    if (mode === 'unknown-key') binding.allowlist = ['**'];
    if (mode === 'unauthorized-path') binding.changedPaths.push({ path: 'packages/rules/src/ability/interpreter.ts', authorization: binding.authorizations[2] });
    if (mode === 'wrong-epoch') binding.controlEpoch = 'FD-P3-2026-09-23-04';
    expect(() => validateContinuationBinding(root, binding)).toThrow();
  });
  it.each(['command', 'stdout', 'testedSha', 'unknown-key'])('rejects tampered %s receipt', mode => {
    const task = JSON.parse(readFileSync(resolve(root, 'scripts/fixtures/phase3-b11-task-check.json'), 'utf8'));
    const binding = task.finalBinding;
    const receipt: ContinuationReceipt = { command: 'npm run test:ci', testedSha: binding.sourceSha, sourceSha: binding.sourceSha,
      startedAt: '2026-10-10T00:00:00.000Z', durationMs: 0, exitCode: 1, stdout: 'UNIT_TEST_RECEIPT_NOT_REAL_EXECUTION', stderr: '',
      outputSha256: sha256('UNIT_TEST_RECEIPT_NOT_REAL_EXECUTION\n') };
    validateContinuationReceipt(root, receipt, binding);
    const bad: any = structuredClone(receipt);
    if (mode === 'command') bad.command += ' --testTimeout=15000';
    if (mode === 'stdout') bad.stdout = 'changed';
    if (mode === 'testedSha') bad.testedSha = historicalCarrierSha;
    if (mode === 'unknown-key') bad.accepted = true;
    expect(() => validateContinuationReceipt(root, bad, binding)).toThrow();
  });
  it.each(['scope', 'hash', 'reviewedSha', 'acceptance'])('rejects mismatched historical review %s without inheriting acceptance', mode => {
    const reviews = buildContinuationReviews(root);
    validateContinuationReviews(root, reviews);
    const bad: any = structuredClone(reviews);
    if (mode === 'scope') bad[0].scope = 'FULL_RUNTIME_ACCEPTANCE';
    if (mode === 'hash') bad[0].sha256 = '0'.repeat(64);
    if (mode === 'reviewedSha') bad[0].reviewedSha = historicalCarrierSha;
    if (mode === 'acceptance') bad[0].inheritedFinalAcceptance = true;
    expect(() => validateContinuationReviews(root, bad)).toThrow();
  });
  it('rejects historical snapshot drift independently of current continuation', () => {
    const original = historicalBytes(syncPath);
    const bad = JSON.parse(original.toString('utf8'));
    bad.candidateLocalRouting.after.new++;
    expect(() => assertSameEvidence(bad, expected.sync)).toThrow();
  });
  it('binds the full final source, compiler, unchanged counts and exact scan locations', async () => {
    const result = finalSnapshot;
    validateContinuationBinding(root, result.binding as ReturnType<typeof buildContinuationBinding>);
    const current = JSON.parse(readFileSync(resolve(root, coveragePath), 'utf8'));
    assertSameEvidence(current, result.coverage);
    expect(result.sync.candidateLocalRouting.after).toEqual({ new: 23, legacyResolve: 144, legacyExecute: 3, dual: 0, notClassifiable: 111 });
    expect(result.sync.formalCredit).toEqual({ mainCoverageCreditDelta: 0, migrationCreditDelta: 0, denominatorDelta: 0, promotedOnMain: false });
    expect(() => assertSameEvidence(current, JSON.parse(historicalBytes(coveragePath).toString('utf8')))).toThrow();
    expect(result.coverage.runtimeRouting.cardSpecificRuntimeHandlers).not.toEqual(expected.coverage.runtimeRouting.cardSpecificRuntimeHandlers);
  });
  it('rejects stale, mixed, tampered bindings and unavailable historical commit objects', () => {
    const input = JSON.parse(readFileSync(resolve(root, 'scripts/fixtures/phase3-b11-task-check.json'), 'utf8'));
    for (const mutate of [
      (b: any) => { b.sourceSha = historicalCarrierSha; },
      (b: any) => { b.sourceObjects['packages/rules/src'] = '0'.repeat(40); },
      (b: any) => { delete b.sourceObjects['data/authoring']; },
      (b: any) => { b.sourceSha = '0'.repeat(40); },
    ]) {
      const binding = structuredClone(input.finalBinding); mutate(binding);
      expect(() => validateFinalBinding(root, binding)).toThrow();
    }
    const missing = '0'.repeat(40);
    expect(() => execFileSync('git', ['show', `${missing}:${coveragePath}`], { cwd: root, stdio: 'pipe' })).toThrow();
  });
});
