import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  extractManifestFromBody,
  isPhase3PullRequest,
  phase3ManifestSchemaVersion,
  validatePhase3Governance,
  type Phase3TaskManifest,
  type PullRequestContext,
} from '../phase3-governance';

const baseSha = '1111111111111111111111111111111111111111';
const headSha = '2222222222222222222222222222222222222222';
const reviewSha = '3333333333333333333333333333333333333333';
const candidateSha = '4444444444444444444444444444444444444444';
const syncSha = '5555555555555555555555555555555555555555';

interface GitFixture {
  root: string;
  base: string;
  candidate: string;
  synchronization: string;
  head: string;
  review: string;
  evidenceSha256: string;
}

let gitFixture: GitFixture;

function git(root: string, args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function createGitFixture(): GitFixture {
  const root = mkdtempSync(join(tmpdir(), 'fd-phase3-governance-'));
  git(root, ['init']);
  git(root, ['config', 'user.name', 'Phase 3 Governance Test']);
  git(root, ['config', 'user.email', 'phase3-governance@example.invalid']);
  git(root, ['config', 'core.autocrlf', 'false']);

  writeFileSync(join(root, 'evidence.txt'), 'base\n');
  git(root, ['add', 'evidence.txt']);
  git(root, ['commit', '-m', 'base']);
  const base = git(root, ['rev-parse', 'HEAD']);

  const chain: string[] = [];
  for (const label of ['candidate', 'synchronization', 'head']) {
    writeFileSync(join(root, 'evidence.txt'), `${label}\n`);
    git(root, ['add', 'evidence.txt']);
    git(root, ['commit', '-m', label]);
    chain.push(git(root, ['rev-parse', 'HEAD']));
  }
  const [candidate, synchronization, head] = chain as [string, string, string];

  git(root, ['checkout', '--detach', base]);
  const evidencePath = join(root, 'docs', 'reviews', 'phase3');
  mkdirSync(evidencePath, { recursive: true });
  const evidence = `${JSON.stringify({
    schemaVersion: 'fd-phase3-review-attestation-v1',
    taskId: 'P3-FB2-99',
    reviewer: 'github:binchen648',
    reviewThread: 'https://github.com/binchen648/fd/pull/499#issuecomment-123',
    candidateSha: candidate,
    conclusion: 'IMPLEMENTATION_ACCEPTED_CANDIDATE',
  }, null, 2)}\n`;
  writeFileSync(join(evidencePath, 'P3-FB2-99-review.json'), evidence);
  git(root, ['add', 'docs/reviews/phase3/P3-FB2-99-review.json']);
  git(root, ['commit', '-m', 'review attestation']);
  const review = git(root, ['rev-parse', 'HEAD']);
  git(root, ['checkout', '--detach', head]);

  return {
    root,
    base,
    candidate,
    synchronization,
    head,
    review,
    evidenceSha256: createHash('sha256').update(evidence).digest('hex'),
  };
}

function promotionReview(overrides: Partial<Phase3TaskManifest['review']> = {}): Phase3TaskManifest['review'] {
  return {
    sha: reviewSha,
    reviewer: 'github:binchen648',
    reviewThread: 'https://github.com/binchen648/fd/pull/499#issuecomment-123',
    evidencePath: 'docs/reviews/phase3/P3-FB2-99-review.json',
    evidenceSha256: '6666666666666666666666666666666666666666666666666666666666666666',
    conclusion: 'IMPLEMENTATION_ACCEPTED_CANDIDATE',
    reviewedCandidateSha: candidateSha,
    ...overrides,
  };
}

function fixturePromotionReview(
  overrides: Partial<Phase3TaskManifest['review']> = {},
): Phase3TaskManifest['review'] {
  return promotionReview({
    sha: gitFixture.review,
    evidenceSha256: gitFixture.evidenceSha256,
    reviewedCandidateSha: gitFixture.candidate,
    ...overrides,
  });
}

function promotionContext(overrides: Partial<PullRequestContext> = {}): PullRequestContext {
  return {
    baseRef: 'main',
    baseSha,
    headRef: 'codex/i-p3-fb2-99-integration',
    headSha,
    title: 'integrate(phase3): promote accepted FB2-99 recovery',
    changedFiles: ['packages/rules/src/ability/example.ts'],
    ...overrides,
  };
}

function promotionManifest(overrides: Partial<Phase3TaskManifest> = {}): Phase3TaskManifest {
  return {
    schemaVersion: phase3ManifestSchemaVersion,
    role: 'I',
    taskId: 'P3-FB2-99',
    prType: 'promotion',
    base: { ref: 'main', sha: baseSha },
    head: { ref: 'codex/i-p3-fb2-99-integration', sha: headSha },
    dependsOnPrs: [499],
    affectedAbilityIds: [],
    runtimeBehaviorChanged: true,
    rules: {
      source: 'docs/rules/FD-Game-Rules-Final.md',
      referenceCommit: baseSha,
    },
    review: promotionReview(),
    synchronization: { sha: syncSha },
    migrationCounts: { mainline: 0, recovery: 0, candidate: 0 },
    tests: [{ command: 'npm run test:ci', result: 'PASS 807/807' }],
    uncoveredScenarios: ['none recorded'],
    knownBlockers: ['none recorded'],
    zeroMigrationCredit: true,
    reverifyOnUpstreamHeadChange: true,
    ...overrides,
  };
}

describe('Phase 3 promotion governance preflight', () => {
  beforeAll(() => {
    gitFixture = createGitFixture();
  });

  afterAll(() => {
    rmSync(gitFixture.root, { recursive: true, force: true });
  });

  it('accepts a complete main Promotion PR manifest', () => {
    expect(validatePhase3Governance(promotionContext(), promotionManifest())).toEqual({
      status: 'passed',
      messages: ['Validated promotion manifest for P3-FB2-99 role I.'],
    });
  });

  it('requires a manifest for Phase 3 PRs', () => {
    expect(() => validatePhase3Governance(promotionContext(), undefined))
      .toThrow(/must include a phase3-task-manifest/);
  });

  it('requires machine-readable review attestation fields for Promotion PRs', () => {
    expect(() => validatePhase3Governance(
      promotionContext(),
      promotionManifest({ review: promotionReview({ reviewer: undefined }) }),
    )).toThrow(/review\.reviewer/);
  });

  it('rejects outdated base SHA evidence after upstream main changes', () => {
    expect(() => validatePhase3Governance(
      promotionContext({ baseSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }),
      promotionManifest(),
    )).toThrow(/base\.sha/);
  });

  it('rejects Promotion manifests with the wrong role', () => {
    expect(() => validatePhase3Governance(
      promotionContext(),
      promotionManifest({ role: 'B' }),
    )).toThrow(/Promotion PRs must use role I/);
  });

  it('rejects stale reviewer candidate evidence when ancestry verification is requested', () => {
    const context = promotionContext({ headSha: gitFixture.head });
    expect(() => validatePhase3Governance(
      context,
      promotionManifest({
        head: { ref: context.headRef, sha: gitFixture.head },
        review: fixturePromotionReview({
          reviewedCandidateSha: '9999999999999999999999999999999999999999',
        }),
        synchronization: { sha: gitFixture.synchronization },
      }),
      { workspaceRoot: gitFixture.root, verifyGitAncestry: true },
    )).toThrow(/attestation candidateSha/);
  });

  it('rejects a missing R review commit even when candidate and synchronization ancestry are current', () => {
    const context = promotionContext({ headSha: gitFixture.head });
    const manifest = promotionManifest({
      head: { ref: context.headRef, sha: gitFixture.head },
      review: fixturePromotionReview({
        sha: '9999999999999999999999999999999999999999',
      }),
      synchronization: { sha: gitFixture.synchronization },
    });

    expect(() => validatePhase3Governance(
      context,
      manifest,
      { workspaceRoot: gitFixture.root, verifyGitAncestry: true },
    )).toThrow(/review\.sha/);
  });

  it('rejects self-referential Promotion evidence', () => {
    expect(() => validatePhase3Governance(
      promotionContext(),
      promotionManifest({
        review: promotionReview({ sha: candidateSha }),
      }),
    )).toThrow(/review.sha must be distinct/);

    expect(() => validatePhase3Governance(
      promotionContext(),
      promotionManifest({
        review: promotionReview({ reviewedCandidateSha: headSha }),
      }),
    )).toThrow(/reviewed candidate must precede/);

    expect(() => validatePhase3Governance(
      promotionContext(),
      promotionManifest({ synchronization: { sha: headSha } }),
    )).toThrow(/synchronization must precede/);
  });

  it('requires the reviewed candidate to be an ancestor of A synchronization', () => {
    const context = promotionContext({ headSha: gitFixture.head });
    const manifest = promotionManifest({
      head: { ref: context.headRef, sha: gitFixture.head },
      review: fixturePromotionReview(),
      synchronization: { sha: gitFixture.base },
    });

    expect(() => validatePhase3Governance(
      context,
      manifest,
      { workspaceRoot: gitFixture.root, verifyGitAncestry: true },
    )).toThrow(/reviewed candidate is not an ancestor of synchronization.sha/);
  });

  it('rejects a tampered review evidence digest', () => {
    const context = promotionContext({ headSha: gitFixture.head });
    expect(() => validatePhase3Governance(
      context,
      promotionManifest({
        head: { ref: context.headRef, sha: gitFixture.head },
        review: fixturePromotionReview({ evidenceSha256: '7'.repeat(64) }),
        synchronization: { sha: gitFixture.synchronization },
      }),
      { workspaceRoot: gitFixture.root, verifyGitAncestry: true },
    )).toThrow(/evidence SHA-256/);
  });

  it('rejects review identity that does not match the committed attestation', () => {
    const context = promotionContext({ headSha: gitFixture.head });
    expect(() => validatePhase3Governance(
      context,
      promotionManifest({
        head: { ref: context.headRef, sha: gitFixture.head },
        review: fixturePromotionReview({ reviewer: 'github:fengling20011118-dotcom' }),
        synchronization: { sha: gitFixture.synchronization },
      }),
      { workspaceRoot: gitFixture.root, verifyGitAncestry: true },
    )).toThrow(/attestation reviewer/);
  });

  it('rejects a review evidence path absent from review.sha', () => {
    const context = promotionContext({ headSha: gitFixture.head });
    expect(() => validatePhase3Governance(
      context,
      promotionManifest({
        head: { ref: context.headRef, sha: gitFixture.head },
        review: fixturePromotionReview({ evidencePath: 'docs/reviews/phase3/missing.json' }),
        synchronization: { sha: gitFixture.synchronization },
      }),
      { workspaceRoot: gitFixture.root, verifyGitAncestry: true },
    )).toThrow(/does not exist at review.sha/);
  });

  it('accepts a stacked Phase 3 PR policy check without requiring main as base', () => {
    const context = promotionContext({
      baseRef: 'codex/a-p3-fb2-99-dispatch',
      headRef: 'codex/b2-p3-fb2-99-runtime',
      title: 'P3 FB2-99 runtime',
    });
    const manifest = promotionManifest({
      role: 'B',
      prType: 'stacked',
      base: { ref: context.baseRef, sha: baseSha },
      head: { ref: context.headRef, sha: headSha },
      affectedAbilityIds: ['test.ability'],
      zeroMigrationCredit: false,
      migrationCounts: { mainline: 0, recovery: 0, candidate: 1 },
    });

    expect(validatePhase3Governance(context, manifest).status).toBe('passed');
  });

  it('requires governance PRs to use role G', () => {
    expect(() => validatePhase3Governance(
      promotionContext(),
      promotionManifest({ role: 'A', prType: 'governance' }),
    )).toThrow(/Governance PRs must use role G/);
  });

  it('reserves role I for Promotion PRs', () => {
    const context = promotionContext({ baseRef: 'codex/a-p3-dispatch' });
    expect(() => validatePhase3Governance(
      context,
      promotionManifest({
        role: 'I',
        prType: 'stacked',
        base: { ref: context.baseRef, sha: baseSha },
      }),
    )).toThrow(/Role I manifests must use prType=promotion/);
  });

  it('rejects ambiguous review conclusions and non-pass test results', () => {
    expect(() => validatePhase3Governance(
      promotionContext(),
      promotionManifest({ review: promotionReview({ conclusion: 'ACCEPTED' }) }),
    )).toThrow(/review conclusion is not accepted/);

    expect(() => validatePhase3Governance(
      promotionContext(),
      promotionManifest({ tests: [{ command: 'npm run test:ci', result: 'NOT PASS - timeout' }] }),
    )).toThrow(/must start with PASS/);
  });

  it('requires explicit uncovered-scenario and blocker declarations', () => {
    expect(() => validatePhase3Governance(
      promotionContext(),
      promotionManifest({ uncoveredScenarios: [] }),
    )).toThrow(/uncoveredScenarios must contain/);

    expect(() => validatePhase3Governance(
      promotionContext(),
      promotionManifest({ knownBlockers: [] }),
    )).toThrow(/knownBlockers must contain/);
  });

  it('skips ordinary non-Phase 3 PRs', () => {
    expect(validatePhase3Governance({
      baseRef: 'main',
      baseSha,
      headRef: 'codex/docs-typo',
      headSha,
      title: 'docs: fix typo',
      changedFiles: ['README.md'],
    }, undefined)).toEqual({
      status: 'skipped',
      messages: ['No Phase 3 branch, title, or file signal detected.'],
    });
  });

  it('detects Phase 3 sensitive runtime paths without relying on branch or title naming', () => {
    expect(isPhase3PullRequest({
      baseRef: 'main',
      baseSha,
      headRef: 'codex/runtime-update',
      headSha,
      title: 'Update resolver behavior',
      changedFiles: ['packages/rules/src/effect-resolver.ts'],
    })).toBe(true);
  });

  it('detects governance bootstrap files that can redirect or suppress the gate', () => {
    for (const path of [
      'package.json',
      'package-lock.json',
      '.github/pull_request_template.md',
      '.github/workflows/test.yml',
    ]) {
      expect(isPhase3PullRequest({
        baseRef: 'main',
        baseSha,
        headRef: 'codex/tooling-update',
        headSha,
        title: 'Update repository tooling',
        changedFiles: [path],
      }), path).toBe(true);
    }
  });

  it('validates a supplied manifest even when the PR name lacks a Phase 3 marker', () => {
    const context = promotionContext({
      headRef: 'codex/integration',
      title: 'Integration update',
      changedFiles: [],
    });
    const manifest = promotionManifest({ head: { ref: context.headRef, sha: headSha } });

    expect(validatePhase3Governance(context, manifest).status).toBe('passed');
  });

  it('extracts the manifest from the PR template fenced block', () => {
    const body = [
      '## Phase 3 Task Manifest',
      '',
      '````json phase3-task-manifest',
      JSON.stringify(promotionManifest(), null, 2),
      '````',
    ].join('\n');

    expect(extractManifestFromBody(body)).toEqual(promotionManifest());
  });
});
