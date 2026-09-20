import { describe, expect, it } from 'vitest';

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
    review: {
      sha: reviewSha,
      conclusion: 'IMPLEMENTATION_ACCEPTED_CANDIDATE',
      reviewedCandidateSha: candidateSha,
    },
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
    expect(() => validatePhase3Governance(
      promotionContext(),
      promotionManifest({ review: { sha: reviewSha, conclusion: 'IMPLEMENTATION_ACCEPTED_CANDIDATE', reviewedCandidateSha: '9999999999999999999999999999999999999999' } }),
      { workspaceRoot: process.cwd(), verifyGitAncestry: true },
    )).toThrow(/review\.reviewedCandidateSha/);
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

  it('extracts the manifest from the PR template fenced block', () => {
    const body = [
      '## Phase 3 Task Manifest',
      '',
      '```json phase3-task-manifest',
      JSON.stringify(promotionManifest(), null, 2),
      '```',
    ].join('\n');

    expect(extractManifestFromBody(body)).toEqual(promotionManifest());
  });
});
