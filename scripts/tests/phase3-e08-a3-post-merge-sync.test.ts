import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const artifactPath = resolve(root, 'artifacts/phase3-e08-a3-post-merge-sync.json');
function readSync(): any { return JSON.parse(readFileSync(artifactPath, 'utf8')); }
function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function validate(sync: any): void {
  expect(sync.controlEpoch).toBe('FD-P3-2026-09-23-08');
  expect(sync.sourceTaskId).toBe('P3-E08-RP-00-A3-RECONCILIATION');
  for (const key of ['coverageCreditDelta', 'migrationCreditDelta', 'denominatorDelta', 'runtimePromotionDelta']) {
    if (sync.accounting[key] !== 0) throw new Error('Nonzero credit');
  }
  const observed = sync.main.observedMainSha;
  if (observed !== '9a1689d2ec5b56b67d1483d2593b4ab809d6c15c') throw new Error('Wrong observed main');
  if (sync.promotion.mergeCommit !== observed || sync.promotion.state !== 'MERGED') throw new Error('Wrong merge binding');
  expect(git('rev-parse', observed + '^{commit}')).toBe(observed);
  expect(git('show', '-s', '--format=%P', observed).split(' ')).toEqual([
    sync.main.previousMainSha, sync.promotion.promotionHeadSha,
  ]);
  for (const sha of [sync.promotion.implementationSha, sync.promotion.reviewedEvidenceCarrierSha,
    sync.review.commit, sync.promotion.synchronizationSha, sync.promotion.promotionHeadSha]) {
    git('merge-base', '--is-ancestor', sha, observed);
  }
  const raw = execFileSync('git', ['show', observed + ':' + sync.review.artifactPath], { cwd: root });
  const boundReview = execFileSync('git', ['show', sync.review.commit + ':' + sync.review.artifactPath], { cwd: root });
  expect(boundReview.equals(raw)).toBe(true);
  const review = JSON.parse(raw.toString('utf8'));
  if (createHash('sha256').update(raw).digest('hex').toUpperCase() !== sync.review.artifactSha256) {
    throw new Error('Review hash mismatch');
  }
  if (review.verdict !== 'PASS' || review.reviewer !== sync.review.reviewer ||
      review.reviewedSha !== sync.review.reviewedSha ||
      review.candidateSha !== sync.promotion.reviewedEvidenceCarrierSha ||
      review.implementationSha !== sync.promotion.implementationSha ||
      review.controlEpoch !== sync.controlEpoch || review.taskId !== sync.sourceTaskId ||
      review.reviewThread !== sync.review.reviewThread || sync.review.verdict !== 'PASS') {
    throw new Error('Review identity mismatch');
  }
  expect(git('rev-parse', sync.review.commit + '^')).toBe(review.reviewedSha);
  expect(sync.boundArtifacts).toEqual(review.boundArtifacts);
  for (const bound of sync.boundArtifacts) {
    const bytes = execFileSync('git', ['show', observed + ':' + bound.path], { cwd: root });
    expect(createHash('sha256').update(bytes).digest('hex').toUpperCase()).toBe(bound.sha256);
  }
  expect(sync.gitHubChecks.headSha).toBe(sync.promotion.promotionHeadSha);
  expect(sync.gitHubChecks.requiredNames).toEqual(['build', 'test', 'Phase 3 Promotion Lane / policy']);
  for (const name of sync.gitHubChecks.requiredNames) {
    const matching = sync.gitHubChecks.attempts.filter((check: any) => check.name === name)
      .sort((a: any, b: any) => b.completed_at.localeCompare(a.completed_at));
    if (!matching.length || matching[0].head_sha !== sync.promotion.promotionHeadSha ||
        matching[0].conclusion !== 'success') throw new Error('Latest required check not successful');
  }
  expect(sync.retainedGates.gateC).toBe('NOT_VERIFIED');
  expect(sync.retainedGates.missingImageBlockers).toBe(93);
}

describe('A3 immutable post-merge synchronization', () => {
  it('binds the actual merge, exact independent review, hashes and latest head checks', () => {
    validate(readSync());
  }, 15_000);

  it('binds frozen coverage, unchanged input objects and three consumers without requiring a moving HEAD', () => {
    const sync = readSync();
    for (const path of sync.coverageRecount.unchangedSourcePaths) {
      expect(git('rev-parse', sync.main.previousMainSha + ':' + path))
        .toBe(git('rev-parse', sync.main.observedMainSha + ':' + path));
    }
    const coverage = JSON.parse(git('show', sync.main.observedMainSha + ':artifacts/phase3-skill-coverage.json'));
    expect(coverage.compiledDefinitions.blockingIssues).toBe(0);
    const counts = {
      new: coverage.runtimeRouting.newRuntimeConsumers.after,
      legacyResolve: coverage.runtimeRouting.legacyResolveEffectConsumers.after,
      legacyExecute: coverage.runtimeRouting.legacyExecuteAbilityConsumers.after,
      dual: coverage.runtimeRouting.dualRuntimeConsumers.after,
      notClassifiable: coverage.runtimeRouting.notClassifiable.after,
    };
    expect(sync.coverageRecount.before).toEqual(counts);
    expect(sync.coverageRecount.after).toEqual(counts);
    expect(sync.coverageRecount.sourceFingerprint).toBe(coverage.sourceFingerprint);
    expect(sync.coverageRecount.archives).toBe(coverage.counts.totalArchives);
    expect(sync.coverageRecount.cards).toBe(coverage.counts.totalCards);
    expect(sync.coverageRecount.abilities).toBe(coverage.counts.totalAbilities);
    const consumers = coverage.semanticAxes.filter((row: any) => row.semanticRoutes.includes(sync.coverageRecount.semanticRoute));
    expect(consumers.map((row: any) => row.abilityKey).sort()).toEqual([...sync.coverageRecount.consumerKeys].sort());
    expect(consumers.every((row: any) => row.runtimeRoute === 'NEW_RUNTIME_SEMANTIC_ROUTED')).toBe(true);
    expect(sync.coverageRecount.delta).toEqual({ new: 0, legacyResolve: 0, legacyExecute: 0, dual: 0, notClassifiable: 0 });
    expect(sync.accounting.retainedAcceptedIdentities).toBe(111);
    expect(sync.accounting.retainedDenominator).toBe(944);
    expect(sync.accounting.retainedRemaining).toBe(833);
  }, 15_000);

  it('fails closed for nonzero credit, incorrect review identity or hash, and a later failed check', () => {
    const credit = readSync(); credit.accounting.coverageCreditDelta = 3;
    expect(() => validate(credit)).toThrow('Nonzero credit');
    const identity = readSync(); identity.review.reviewedSha = '0'.repeat(40);
    expect(() => validate(identity)).toThrow('Review identity mismatch');
    const hash = readSync(); hash.review.artifactSha256 = '0'.repeat(64);
    expect(() => validate(hash)).toThrow('Review hash mismatch');
    const check = readSync();
    check.gitHubChecks.attempts.push({ name: 'test', head_sha: check.promotion.promotionHeadSha,
      conclusion: 'failure', completed_at: '2099-01-01T00:00:00Z' });
    expect(() => validate(check)).toThrow('Latest required check not successful');
  }, 15_000);
});
