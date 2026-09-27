import { describe, expect, it } from 'vitest';

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
    expect(decomposition.registryDiagnosisCounts.AUTHORING_PRESENT_BUT_NOT_REGISTERED_IN_ACTIVE_PLAYTEST_PACK).toBe(77);
    expect(decomposition.registryDiagnosisCounts.RULES_ONLY_MASTER_RULE_ARCHIVE_NOT_REGISTERED_IN_PLAYTEST_PACK).toBe(10);
    expect(decomposition.registryDiagnosisCounts.PACK_SOURCE_LISTED_BUT_NOT_EMITTED).toBe(0);
    expect(decomposition.registryDiagnosisCounts.AUTHORING_SHAPE_UNSUPPORTED).toBe(0);
    expect(decomposition.registryDiagnosisCounts.RUNTIME_CAPABILITY_MISSING).toBe(0);
    expect(decomposition.registryDiagnosisCounts.LEGACY_HANDLER_DEPENDENCY_ONLY).toBe(0);
    expect(decomposition.sourceMatrixSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(decomposition.familySummaries).toHaveLength(9);
    expect(decomposition.identities).toHaveLength(111);
  });

  it('does not authorize a batch from a gap classification', () => {
    const decomposition = buildA112Decomposition({ generatedAt: '2026-09-27T00:00:00.000Z' });

    expect(decomposition.identities.every((identity) => identity.gaps.length > 0)).toBe(true);
    expect(decomposition.identities.every((identity) => identity.gapDetails.every((detail) => detail.requiredReviewer.length > 0))).toBe(true);
    expect(decomposition.identities.some((identity) => identity.registryStatus === 'RULES_ONLY_NOT_IN_PLAYTEST_PACK')).toBe(true);
    expect(decomposition.identities
      .filter((identity) => identity.registryStatus === 'RULES_ONLY_NOT_IN_PLAYTEST_PACK')
      .every((identity) => identity.gaps.includes('GENERATED_REGISTRY_MISSING'))).toBe(true);
  });

  it('is deterministic apart from generatedAt', () => {
    const first = buildA112Decomposition({ generatedAt: 'TIME_A' });
    const second = buildA112Decomposition({ generatedAt: 'TIME_B' });

    expect(serializeDecomposition({ ...first, generatedAt: '<normalized>' })).toBe(
      serializeDecomposition({ ...second, generatedAt: '<normalized>' }),
    );
  });
});
