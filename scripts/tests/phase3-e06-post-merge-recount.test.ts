import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const recountPath = resolve(root, 'artifacts/phase3-e06-a-post-merge-setup-create-to-skill-recount.json');
const coveragePath = resolve(root, 'artifacts/phase3-skill-coverage.json');
const gitEnvironment = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_OPTIONAL_LOCKS: '0',
};

function git(args: string[]): string {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      env: gitEnvironment,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Git evidence verification failed for ${args.join(' ')}: ${message}`);
  }
}

function assertCommitObject(sha: string, label: string): void {
  expect(sha, `${label} must be a full commit SHA`).toMatch(/^[0-9a-f]{40}$/);
  expect(git(['rev-parse', '--verify', `${sha}^{commit}`]), `${label} must be a valid local commit object`).toBe(sha);
}

function assertAncestor(ancestor: string, descendant: string, label: string): void {
  expect(() => git(['merge-base', '--is-ancestor', ancestor, descendant]), label).not.toThrow();
}

describe('P3-E06 post-merge setup/create-to-skill recount', () => {
  it('binds the immutable observed main, runtime lineage, unchanged accounting, and fresh coverage', () => {
    const recount = JSON.parse(readFileSync(recountPath, 'utf8')) as any;
    const coverage = JSON.parse(readFileSync(coveragePath, 'utf8')) as any;
    const coverageSha = createHash('sha256').update(readFileSync(coveragePath)).digest('hex').toUpperCase();

    const observedMainSha = recount.main.observedMainSha;
    assertCommitObject(observedMainSha, 'observedMainSha');
    assertCommitObject(recount.runtimePromotion.candidateSha, 'runtime candidate');
    assertCommitObject(recount.main.promotionHead, 'promotion head');
    assertAncestor(recount.runtimePromotion.candidateSha, observedMainSha, 'runtime candidate must precede observedMainSha');
    assertAncestor(recount.main.promotionHead, observedMainSha, 'promotion head must precede observedMainSha');
    expect(recount.promotionCompatibility).toEqual({
      status: 'CONTROL_ONLY_DRIFT',
      authority: 'PROMOTION_PREFLIGHT_POLICY',
      movingRef: 'origin/main',
      recountRule: 'OBSERVED_MAIN_SHA_ONLY; DO_NOT_REQUIRE_MOVING_REF_EQUALITY',
      ciRule: 'BOUND_COMMIT_OBJECTS_ONLY; NO_REMOTE_REF_REQUIRED',
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
