import { describe, expect, it } from 'vitest';

import { buildA111Matrix, serializeMatrix } from '../phase3-a111-current-main-execution-matrix';

describe('P3-E04-A111 current-main execution matrix', () => {
  it('recomputes the frozen 111/944 accounting without duplicate or missing accepted IDs', () => {
    const matrix = buildA111Matrix({ generatedAt: '2026-09-27T00:00:00.000Z' });

    expect(matrix.frozenDenominator).toBe(944);
    expect(matrix.acceptedIdentityCount).toBe(111);
    expect(matrix.remainingIdentityCount).toBe(833);
    expect(matrix.duplicateAcceptedIds).toEqual([]);
    expect(matrix.missingAcceptedIds).toEqual([]);
    expect(matrix.identities).toHaveLength(111);
    expect(matrix.identities.some((identity) => identity.canonicalIdentityId === 'master.tiamat.card.life-sea')).toBe(false);
  });

  it('does not hide current-main material outside the accepted numerator', () => {
    const matrix = buildA111Matrix({ generatedAt: '2026-09-27T00:00:00.000Z' });

    expect(matrix.unexpectedMaterialIds.length).toBeGreaterThan(0);
    expect(matrix.unexpectedMaterialIds).not.toContain('master.tiamat.card.life-sea');
    for (const identity of matrix.unexpectedMaterialIds) {
      expect(matrix.identities.map((row) => row.canonicalIdentityId)).not.toContain(identity);
    }
  });

  it('uses only allowed currentMainStatus values and remains stable except for generatedAt', () => {
    const first = buildA111Matrix({ generatedAt: 'TIME_A' });
    const second = buildA111Matrix({ generatedAt: 'TIME_B' });
    const allowed = new Set([
      'MAIN_EXECUTABLE_VERIFIED',
      'MAIN_EXECUTABLE_GATE_C_NOT_REQUIRED',
      'MAIN_EXECUTABLE_GATE_C_PENDING',
      'RUNTIME_REGRESSION_FOUND',
      'EVIDENCE_BINDING_GAP',
    ]);

    for (const identity of first.identities) expect(allowed.has(identity.currentMainStatus)).toBe(true);
    expect(serializeMatrix({ ...first, generatedAt: '<normalized>' })).toBe(
      serializeMatrix({ ...second, generatedAt: '<normalized>' }),
    );
  });
});

