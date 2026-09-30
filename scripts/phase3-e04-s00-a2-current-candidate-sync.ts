import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const ARTIFACT_PATH = 'artifacts/phase3-e04-s00-a2-current-candidate-sync.json';
const EXACT_BINDING = 'EXACT_ARTIFACT_BOUND';
const EXACT_CLOSED = 'CLOSED_EXACT_ARTIFACT_BOUND';
const FORBIDDEN_UNBOUND = /NOT_EXACT_ARTIFACT_BOUND/;

type SyncArtifact = {
  review?: {
    reviewEvidenceBinding?: unknown;
    verdict?: unknown;
    reviewArtifactPath?: unknown;
    reviewArtifactSha256?: unknown;
  };
  scope?: {
    legacyFallbackStatus?: unknown;
  };
};

function isSha256(value: unknown): boolean {
  return typeof value === 'string' && /^[0-9A-Fa-f]{64}$/.test(value);
}

export function assertCurrentCandidateSyncConsistency(input: unknown): asserts input is SyncArtifact {
  const artifact = input as SyncArtifact;
  const binding = artifact.review?.reviewEvidenceBinding;
  const fallback = artifact.scope?.legacyFallbackStatus;

  if (typeof fallback === 'string' && FORBIDDEN_UNBOUND.test(fallback)) {
    throw new Error(`legacy fallback state is not exact-bound: ${fallback}`);
  }

  if (binding === EXACT_BINDING) {
    if (fallback !== EXACT_CLOSED) {
      throw new Error(
        `exact review binding requires ${EXACT_CLOSED}, received ${String(fallback)}`,
      );
    }
    if (artifact.review?.verdict !== 'PASS') {
      throw new Error('exact review binding requires a PASS verdict');
    }
    if (typeof artifact.review?.reviewArtifactPath !== 'string') {
      throw new Error('exact review binding requires a review artifact path');
    }
    if (!isSha256(artifact.review?.reviewArtifactSha256)) {
      throw new Error('exact review binding requires a 64-character artifact SHA-256');
    }
  } else if (fallback === EXACT_CLOSED) {
    throw new Error('exact-bound legacy fallback cannot exist without exact review binding');
  }
}

function main(): void {
  const artifactPath = resolve(process.cwd(), ARTIFACT_PATH);
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf8')) as unknown;
  assertCurrentCandidateSyncConsistency(artifact);
  console.log(`validated ${ARTIFACT_PATH}`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
