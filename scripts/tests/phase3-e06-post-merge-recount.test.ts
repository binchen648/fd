import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const recountPath = resolve(root, 'artifacts/phase3-e06-a-post-merge-setup-create-to-skill-recount.json');
const coveragePath = resolve(root, 'artifacts/phase3-skill-coverage.json');

describe('P3-E06 post-merge setup/create-to-skill recount', () => {
  it('binds the immutable observed main, runtime lineage, unchanged accounting, and fresh coverage', () => {
    const recount = JSON.parse(readFileSync(recountPath, 'utf8')) as any;
    const coverage = JSON.parse(readFileSync(coveragePath, 'utf8')) as any;
    const coverageSha = createHash('sha256').update(readFileSync(coveragePath)).digest('hex').toUpperCase();

    const observedMainSha = recount.main.observedMainSha;
    expect(execFileSync('git', ['rev-parse', '--verify', `${observedMainSha}^{commit}`], { encoding: 'utf8' }).trim()).toBe(observedMainSha);
    expect(execFileSync('git', ['merge-base', '--is-ancestor', recount.runtimePromotion.candidateSha, observedMainSha], { encoding: 'utf8' })).toBe('');
    expect(execFileSync('git', ['merge-base', '--is-ancestor', recount.main.promotionHead, observedMainSha], { encoding: 'utf8' })).toBe('');
    expect(recount.promotionCompatibility).toEqual({
      status: 'CONTROL_ONLY_DRIFT',
      authority: 'PROMOTION_PREFLIGHT_POLICY',
      movingRef: 'origin/main',
      recountRule: 'OBSERVED_MAIN_SHA_ONLY; DO_NOT_REQUIRE_MOVING_REF_EQUALITY',
    });
    expect(coverageSha).toBe(recount.coverage.artifactSha256);
    expect(coverage.counts.totalArchives).toBe(127);
    expect(coverage.counts.totalCards).toBe(169);
    expect(coverage.counts.totalAbilities).toBe(281);
    expect(coverage.runtimeRouting.newRuntimeConsumers.after).toBe(22);
    expect(coverage.runtimeRouting.legacyResolveEffectConsumers.after).toBe(144);
    expect(coverage.runtimeRouting.legacyExecuteAbilityConsumers.after).toBe(3);
    expect(coverage.runtimeRouting.dualRuntimeConsumers.after).toBe(0);
    expect(coverage.runtimeRouting.notClassifiable.after).toBe(112);
    expect(coverage.runtimeRouting.semanticRouteCounts['SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL']).toBe(3);
    expect(recount.formalAccounting).toEqual({
      frozenDenominator: 944,
      acceptedCurrentMainIdentities: 111,
      remainingIdentities: 833,
      duplicateAcceptedIds: 0,
      mainCoverageCreditDelta: 0,
      mainDenominatorDelta: 0,
      migrationCreditDelta: 0,
      runtimePromotionDelta: 3,
      promotedOnMain: true,
      canonicalNumeratorChanged: false,
    });
    expect(recount.runtimePromotion.currentMainState).toBe('PROMOTED_ON_MAIN_RECOUNTED');
    expect(recount.runtimePromotion.gateCStatus).toBe('NOT_VERIFIED');
  });
});
