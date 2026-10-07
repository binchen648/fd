import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const syncPath = resolve(process.cwd(), 'artifacts/phase3-p3-b11-current-main-result-binding-sync.json');

const counts = (artifact: any) => ({
  newRuntimeSemanticRouted: artifact.runtimeRouting.newRuntimeConsumers.after,
  legacyResolveEffect: artifact.runtimeRouting.legacyResolveEffectConsumers.after,
  legacyExecuteAbility: artifact.runtimeRouting.legacyExecuteAbilityConsumers.after,
  dualRuntime: artifact.runtimeRouting.dualRuntimeConsumers.after,
  notClassifiable: artifact.runtimeRouting.notClassifiable.after,
});

const routeFor = (artifact: any, abilityId: string) => artifact.semanticAxes.find((row: any) => row.abilityId === abilityId)?.runtimeRoute;

describe('P3-A03 B11 current-main evidence sync', () => {
  it('recomputes exact review, lineage, coverage, identity routes, and zero credit', () => {
    const sync = JSON.parse(readFileSync(syncPath, 'utf8')) as any;
    const reviewPath = resolve(process.cwd(), sync.source.reviewArtifactPath);
    const baselinePath = resolve(process.cwd(), sync.coverage.baseline.artifactPath);
    const candidatePath = resolve(process.cwd(), sync.coverage.candidate.artifactPath);
    const review = JSON.parse(readFileSync(reviewPath, 'utf8')) as any;
    const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as any;
    const candidate = JSON.parse(readFileSync(candidatePath, 'utf8')) as any;
    const reviewSha = createHash('sha256').update(readFileSync(reviewPath)).digest('hex').toUpperCase();
    const baselineSha = createHash('sha256').update(readFileSync(baselinePath)).digest('hex').toUpperCase();
    const candidateSha = createHash('sha256').update(readFileSync(candidatePath)).digest('hex').toUpperCase();

    const currentMainIsAncestor = execFileSync(
      'git', ['merge-base', '--is-ancestor', sync.source.currentMainSha, sync.source.candidateSha],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const candidateIsReviewParent = execFileSync(
      'git', ['merge-base', '--is-ancestor', sync.source.candidateSha, sync.source.reviewCommitSha],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );

    expect(reviewSha).toBe(sync.source.reviewArtifactSha256);
    expect(review.reviewer).toBe('github:binchen648');
    expect(review.baseSha).toBe(sync.source.currentMainSha);
    expect(review.candidateSha).toBe(sync.source.candidateSha);
    expect(review.reviewedSha).toBe(sync.source.candidateSha);
    expect(review.finalVerdict).toBe('PASS');
    expect(review.reviewThread).toBe('https://github.com/binchen648/fd/pull/542#issuecomment-6029576390');
    expect(sync.controlEpoch).toBe('FD-P3-2026-09-23-06');
    expect(sync.review.attestationControlEpoch).toBe(sync.controlEpoch);
    expect(sync.review.reviewCommentId).toBe('6029576390');
    expect(sync.review.reviewThread).toBe(review.reviewThread);
    expect(sync.review.reviewThread).toContain(`#issuecomment-${sync.review.reviewCommentId}`);
    expect(review.scope.authorizedAbilities).toEqual(sync.scope.authorizedAbilities);
    expect(currentMainIsAncestor).toBe('');
    expect(candidateIsReviewParent).toBe('');

    expect(baselineSha).toBe(sync.coverage.baseline.artifactSha256);
    expect(candidateSha).toBe(sync.coverage.candidate.artifactSha256);
    expect(counts(baseline)).toEqual(sync.coverage.baseline.counts);
    expect(counts(candidate)).toEqual(sync.coverage.candidate.counts);
    expect(counts(baseline)).toEqual({
      newRuntimeSemanticRouted: 22,
      legacyResolveEffect: 144,
      legacyExecuteAbility: 3,
      dualRuntime: 0,
      notClassifiable: 112,
    });
    expect(counts(candidate)).toEqual({
      newRuntimeSemanticRouted: 23,
      legacyResolveEffect: 144,
      legacyExecuteAbility: 3,
      dualRuntime: 0,
      notClassifiable: 111,
    });
    expect(routeFor(baseline, 'conversion-magic.preparation')).toBe('NEW_RUNTIME_SEMANTIC_ROUTED');
    expect(routeFor(baseline, 'sc-kintoki-3.golden-eater')).toBe('NOT_CLASSIFIABLE');
    expect(routeFor(candidate, 'conversion-magic.preparation')).toBe('NEW_RUNTIME_SEMANTIC_ROUTED');
    expect(routeFor(candidate, 'sc-kintoki-3.golden-eater')).toBe('NEW_RUNTIME_SEMANTIC_ROUTED');
    expect(sync.coverage.transition).toEqual({
      newRuntimeSemanticRouted: { before: 22, after: 23, delta: 1 },
      legacyResolveEffect: { before: 144, after: 144, delta: 0 },
      legacyExecuteAbility: { before: 3, after: 3, delta: 0 },
      dualRuntime: { before: 0, after: 0, delta: 0 },
      notClassifiable: { before: 112, after: 111, delta: -1 },
    });
    expect(sync.accounting).toEqual({
      mainCoverageCreditDelta: 0,
      mainDenominatorDelta: 0,
      migrationCreditDelta: 0,
      promotedOnMain: false,
    });
  });
});
