import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildA112Decomposition, serializeDecomposition } from '../phase3-a112-gap-decomposition';

describe('P3-E04-A112 accepted 111 gap decomposition', () => {
  it('keeps A111 accounting unchanged and distinguishes registry diagnosis', () => {
    const decomposition = buildA112Decomposition({ generatedAt: '2026-09-27T00:00:00.000Z' });

    expect(decomposition.acceptedIdentityCount).toBe(111);
    expect(decomposition.frozenDenominator).toBe(944);
    expect(decomposition.remainingIdentityCount).toBe(833);
    expect(decomposition.accounting.creditChange).toBe('NONE');
    expect(decomposition.accounting.mainCoverageCreditDelta).toBe(0);
    expect(decomposition.gapCounts.GENERATED_REGISTRY_MISSING).toBe(87);
    expect(decomposition.registryDiagnosisCounts.AUTHORING_SOURCE_NOT_FOUND).toBe(0);
    expect(decomposition.registryDiagnosisCounts.AUTHORING_PRESENT_BUT_NOT_REGISTERED_IN_ACTIVE_PLAYTEST_PACK).toBe(87);
    expect(decomposition.registryDiagnosisCounts.PACK_SOURCE_LISTED_BUT_NOT_EMITTED).toBe(0);
    expect(decomposition.registryDiagnosisCounts.RULES_ONLY_MASTER_RULE_ARCHIVE_NOT_REGISTERED_IN_PLAYTEST_PACK).toBeUndefined();
    expect(decomposition.registryDiagnosisNotEvaluated).toContain('RULES_ONLY_MASTER_RULE_ARCHIVE_NOT_REGISTERED_IN_PLAYTEST_PACK');
    expect(decomposition.registryDiagnosisNotEvaluated).toContain('AUTHORING_SHAPE_UNSUPPORTED');
    expect(decomposition.registryDiagnosisNotEvaluated).toContain('RUNTIME_CAPABILITY_MISSING');
    expect(decomposition.registryDiagnosisNotEvaluated).toContain('LEGACY_HANDLER_DEPENDENCY_ONLY');
    expect(decomposition.sourceMatrixSha256).toBe('34ce9258e94e9bf44243cdd76be223f599d4776c13e2ef623382ae44a2f4f965');
    expect(decomposition.familySummaries).toHaveLength(9);
    expect(decomposition.identities).toHaveLength(111);
  });

  it('does not authorize a batch from a gap classification', () => {
    const decomposition = buildA112Decomposition({ generatedAt: '2026-09-27T00:00:00.000Z' });

    expect(decomposition.identities.every((identity) => identity.gaps.length > 0)).toBe(true);
    expect(decomposition.identities.every((identity) => identity.gapDetails.every((detail) => detail.requiredReviewer.length > 0))).toBe(true);
    expect(decomposition.identities
      .filter((identity) => identity.acceptedFamilyId === 'GAME_START_RULE_OVERRIDES')
      .every((identity) => identity.registryStatus === 'PACK_SOURCE_EXCLUDED')).toBe(true);
    expect(decomposition.identities
      .filter((identity) => identity.acceptedFamilyId === 'GAME_START_RULE_OVERRIDES')
      .every((identity) => identity.gaps.includes('GENERATED_REGISTRY_MISSING'))).toBe(true);
  });

  it('fails closed for tampered or stale A111 source matrices with unchanged counts', () => {
    const sourcePath = 'artifacts/phase3-e04-current-main-accepted-111-execution-matrix.json';
    const source = JSON.parse(readFileSync(sourcePath, 'utf8')) as Record<string, unknown>;
    const tempRoot = mkdtempSync(join(tmpdir(), 'fd-a112-'));
    try {
      for (const [name, mutation] of [
        ['tampered', { mainSha: '0'.repeat(40) }],
        ['stale', { taskId: 'P3-E04-A111-OLD' }],
      ] as const) {
        const matrixPath = join(tempRoot, `${name}.json`);
        writeFileSync(matrixPath, JSON.stringify({ ...source, ...mutation }), 'utf8');
        expect(() => buildA112Decomposition({ matrixPath })).toThrow(/A111_SOURCE_MATRIX_MISMATCH/);
      }
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('is deterministic apart from generatedAt', () => {
    const first = buildA112Decomposition({ generatedAt: 'TIME_A' });
    const second = buildA112Decomposition({ generatedAt: 'TIME_B' });

    expect(serializeDecomposition({ ...first, generatedAt: '<normalized>' })).toBe(
      serializeDecomposition({ ...second, generatedAt: '<normalized>' }),
    );
  });
});
