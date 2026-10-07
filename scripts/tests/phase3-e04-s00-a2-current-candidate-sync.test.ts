import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { assertCurrentCandidateSyncConsistency } from '../phase3-e04-s00-a2-current-candidate-sync';

const artifactPath = resolve(process.cwd(), 'artifacts/phase3-e04-s00-a2-current-candidate-sync.json');

describe('P3-E04-S00-A2 current candidate sync consistency', () => {
  it('accepts the exact-bound closed fallback state', () => {
    const artifact = JSON.parse(readFileSync(artifactPath, 'utf8')) as unknown;

    expect(() => assertCurrentCandidateSyncConsistency(artifact)).not.toThrow();
  });

  it('rejects exact review binding paired with the old unbound fallback state', () => {
    const artifact = JSON.parse(readFileSync(artifactPath, 'utf8')) as {
      review: { reviewEvidenceBinding: string };
      scope: { legacyFallbackStatus: string };
    };
    artifact.scope.legacyFallbackStatus = 'CLAIMED_CLOSED_NOT_EXACT_ARTIFACT_BOUND';

    expect(() => assertCurrentCandidateSyncConsistency(artifact)).toThrow(
      'legacy fallback state is not exact-bound',
    );
  });

  it('rejects exact-bound fallback without exact review binding', () => {
    const artifact = JSON.parse(readFileSync(artifactPath, 'utf8')) as {
      review: { reviewEvidenceBinding: string };
      scope: { legacyFallbackStatus: string };
    };
    artifact.review.reviewEvidenceBinding = 'MISSING_EXACT_CURRENT_CANDIDATE_ARTIFACT';

    expect(() => assertCurrentCandidateSyncConsistency(artifact)).toThrow(
      'exact-bound legacy fallback cannot exist without exact review binding',
    );
  });
});
