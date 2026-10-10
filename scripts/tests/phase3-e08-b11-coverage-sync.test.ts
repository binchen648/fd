import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { assertSameEvidence, buildSync, buildFinalSync, historicalCarrierSha, validateFinalBinding, coveragePath, renderReport, reportPath, sha256, syncPath } from '../phase3-e08-b11-coverage-sync';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
let expected: Awaited<ReturnType<typeof buildSync>>;

beforeAll(async () => { expected = await buildSync(root); }, 30_000);
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
  it('binds the full final source, compiler, unchanged counts and exact scan locations', async () => {
    const result = await buildFinalSync(root);
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
