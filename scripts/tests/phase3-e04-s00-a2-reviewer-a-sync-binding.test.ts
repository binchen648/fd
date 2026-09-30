import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const bindingPath = resolve(process.cwd(), 'artifacts/phase3-e04-s00-a2-reviewer-a-sync-binding.json');
const syncArtifactPath = resolve(process.cwd(), 'artifacts/phase3-e04-s00-a2-current-candidate-sync.json');

describe('P3-E04-S00-A2 Reviewer A sync binding', () => {
  it('binds Reviewer A PASS to the exact A sync SHA and artifact hash', () => {
    const binding = JSON.parse(readFileSync(bindingPath, 'utf8')) as {
      reviewerA: {
        identity: string;
        verdict: string;
        reviewedSyncSha: string;
        syncArtifactSha256: string;
      };
      status: string;
      accounting: { mainCoverageCreditDelta: number; mainDenominatorDelta: number };
    };

    expect(binding.reviewerA.identity).toBe('Codex Reviewer A');
    expect(binding.reviewerA.verdict).toBe('PASS');
    expect(binding.reviewerA.reviewedSyncSha).toBe('00add371a1d32d09ed9c09ca3856490a1fa6ad6a');
    expect(binding.reviewerA.syncArtifactSha256).toBe(
      createHash('sha256').update(readFileSync(syncArtifactPath)).digest('hex').toUpperCase(),
    );
    expect(binding.status).toBe('REVIEWER_ACCEPTED_CANDIDATE');
    expect(binding.accounting.mainCoverageCreditDelta).toBe(0);
    expect(binding.accounting.mainDenominatorDelta).toBe(0);
  });
});
