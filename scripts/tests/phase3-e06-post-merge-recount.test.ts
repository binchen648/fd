import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';
import { buildCoverageFromArchives, loadAuthoringArchives } from '../phase3-coverage';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const recountPath = resolve(root, 'artifacts/phase3-e06-a-post-merge-setup-create-to-skill-recount.json');
const coveragePath = resolve(root, 'artifacts/phase3-skill-coverage.json');
const historicalCoverageCommit = '9a1689d2ec5b56b67d1483d2593b4ab809d6c15c';
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

function gitAt(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: gitEnvironment,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

describe('P3-E06 post-merge setup/create-to-skill recount', () => {
  it('binds the immutable observed main, runtime lineage, unchanged accounting, and fresh coverage', () => {
    const recount = JSON.parse(readFileSync(recountPath, 'utf8')) as any;
    assertCommitObject(historicalCoverageCommit, 'A3 merged coverage carrier');
    assertAncestor(recount.reconciliation.observedCurrentMainSha, historicalCoverageCommit, 'reconciliation base precedes merged coverage');
    assertAncestor(historicalCoverageCommit, git(['rev-parse', 'HEAD']), 'merged coverage precedes this carrier');
    const historicalCoverage = execFileSync('git', ['show', `${historicalCoverageCommit}:artifacts/phase3-skill-coverage.json`], {
      cwd: root, env: gitEnvironment, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const coverage = JSON.parse(historicalCoverage.toString('utf8')) as any;
    const coverageSha = createHash('sha256').update(historicalCoverage).digest('hex').toUpperCase();

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

  it('recalculates coverage and binds current main without rewriting historical failures or credit', async () => {
    const recount = JSON.parse(readFileSync(recountPath, 'utf8')) as any;
    const coverage = JSON.parse(readFileSync(coveragePath, 'utf8')) as any;
    const fresh = buildCoverageFromArchives(loadAuthoringArchives(root), {
      workspaceRoot: root, generatedAt: coverage.generatedAt,
    });
    const { loadPlaytestContentPack, validateLoadedPlaytestPack, compileLoadedPlaytestPack } =
      await import('../../packages/content/src/playtest-pack-loader');
    const { compileExecutableCardPack } = await import('../../packages/rules/src/ability/executable-card-pack');
    const pack = loadPlaytestContentPack(resolve(root, 'data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: root });
    const issues = validateLoadedPlaytestPack(pack, { workspaceRoot: root });
    const library = compileLoadedPlaytestPack(pack, issues).library;
    const compiled = compileExecutableCardPack(library);
    expect({ ...fresh, compiledDefinitions: {
      packId: library.pack.id, version: library.pack.version,
      definitionHash: compiled.definitionHash, compiledCards: Object.keys(compiled.cards).length,
      compiledCharacters: Object.keys(compiled.characters).length,
      blockingIssues: issues.filter(issue => issue.blocking).length,
    } }).toEqual(coverage);
    expect(recount.controlEpoch).toBe('FD-P3-2026-09-23-08');
    expect(recount.taskId).toBe('P3-E08-RP-00-A3-RECONCILIATION');
    const current = recount.reconciliation.observedCurrentMainSha;
    const historicalCoverage = JSON.parse(git(['show', `${current}:artifacts/phase3-skill-coverage.json`])) as any;
    expect(current).toBe('fefcf4f7f5bd66ed7693889fb99391e6e7321016');
    assertCommitObject(current, 'reconciliation observed current main');
    assertAncestor(recount.main.observedMainSha, current, 'historical main precedes reconciliation main');
    assertAncestor(current, git(['rev-parse', 'HEAD']), 'reconciliation base precedes this carrier');
    for (const path of ['data/authoring', 'data/packs', 'packages/content/src', 'packages/rules/src', 'scripts/phase3-coverage.ts']) {
      expect(git(['rev-parse', `${current}:${path}`])).toBe(git(['rev-parse', `${recount.main.observedMainSha}:${path}`]));
    }
    expect(recount.reconciliation.ciStabilityPr).toBe(554);
    expect(recount.reconciliation.ciStabilityMergeSha).toBe(current);
    expect(recount.reconciliation.before).toEqual(recount.reconciliation.after);
    expect(recount.reconciliation.after).toEqual({
      new: historicalCoverage.runtimeRouting.newRuntimeConsumers.after,
      legacyResolve: historicalCoverage.runtimeRouting.legacyResolveEffectConsumers.after,
      legacyExecute: historicalCoverage.runtimeRouting.legacyExecuteAbilityConsumers.after,
      dual: historicalCoverage.runtimeRouting.dualRuntimeConsumers.after,
      notClassifiable: historicalCoverage.runtimeRouting.notClassifiable.after,
    });
    expect(Object.values(recount.reconciliation.delta)).toEqual([0, 0, 0, 0, 0]);
    for (const field of ['coverageCreditDelta', 'migrationCreditDelta', 'denominatorDelta', 'runtimePromotionDelta']) {
      expect(recount.reconciliation[field]).toBe(0);
    }
    const consumers = recount.reconciliation.consumers;
    expect(consumers.map((row: any) => row.abilityId)).toEqual(recount.runtimePromotion.authorizedAbilities);
    for (const consumer of consumers) {
      const matches = fresh.semanticAxes.filter(row =>
        row.cardId === consumer.cardId && row.abilityId === consumer.abilityId);
      expect(matches).toHaveLength(1);
      expect(matches[0].runtimeRoute).toBe(consumer.runtimeRoute);
      expect(matches[0].semanticRoutes).toEqual([consumer.semanticRoute]);
    }
    expect(recount.historicalEvidence.sourceStatus).toBe('REVIEW_RECONCILIATION_REQUIRED');
    expect(recount.historicalEvidence.validation.testCi.failureClass).toBe('FULL_SUITE_TIMEOUT_AT_5000MS');
    expect(recount.historicalEvidence.validation.testCi.summary).toBe('183 files passed / 1 failed; 1410 tests passed / 1 failed');
    expect(recount.runtimePromotion.gateCStatus).toBe('NOT_VERIFIED');
    for (const [path, hash] of [
      [recount.runtimePromotion.reviewerB.artifactPath, recount.runtimePromotion.reviewerB.artifactSha256],
      [recount.runtimePromotion.reviewerA.bindingArtifactPath, recount.runtimePromotion.reviewerA.bindingArtifactSha256],
      [recount.runtimePromotion.governance.attestationPath, recount.runtimePromotion.governance.attestationSha256],
    ]) {
      expect(createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex').toUpperCase()).toBe(hash);
    }
  }, 15_000);

  it('requires full-history CI checkout and proves shallow recovery before ancestry checks', () => {
    const workflow = readFileSync(resolve(root, '.github/workflows/test.yml'), 'utf8');
    expect(workflow).toMatch(/uses: actions\/checkout@v4\s+with:\s+fetch-depth: 0/);

    const source = mkdtempSync(join(tmpdir(), 'fd-phase3-lineage-source-'));
    const shallow = mkdtempSync(join(tmpdir(), 'fd-phase3-lineage-shallow-'));
    try {
      gitAt(source, ['init', '--initial-branch=main']);
      gitAt(source, ['config', 'user.email', 'phase3-test@example.invalid']);
      gitAt(source, ['config', 'user.name', 'Phase 3 Test']);
      writeFileSync(join(source, 'lineage.txt'), 'base\n');
      gitAt(source, ['add', 'lineage.txt']);
      gitAt(source, ['commit', '-m', 'base']);
      const base = gitAt(source, ['rev-parse', 'HEAD']);
      writeFileSync(join(source, 'lineage.txt'), 'candidate\n');
      gitAt(source, ['commit', '-am', 'candidate']);
      const candidate = gitAt(source, ['rev-parse', 'HEAD']);
      writeFileSync(join(source, 'lineage.txt'), 'promotion\n');
      gitAt(source, ['commit', '-am', 'promotion']);
      const promotion = gitAt(source, ['rev-parse', 'HEAD']);

      const sourceUrl = pathToFileURL(source).href;
      gitAt(resolve(source, '..'), ['clone', '--depth=1', sourceUrl, shallow]);
      expect(() => gitAt(shallow, ['rev-parse', '--verify', `${base}^{commit}`])).toThrow();
      expect(() => gitAt(shallow, ['merge-base', '--is-ancestor', candidate, promotion])).toThrow();

      gitAt(shallow, ['fetch', '--unshallow']);
      expect(gitAt(shallow, ['rev-parse', '--verify', `${base}^{commit}`])).toBe(base);
      expect(() => gitAt(shallow, ['merge-base', '--is-ancestor', candidate, promotion])).not.toThrow();
    } finally {
      rmSync(source, { recursive: true, force: true });
      rmSync(shallow, { recursive: true, force: true });
    }
  }, 15_000);
});
