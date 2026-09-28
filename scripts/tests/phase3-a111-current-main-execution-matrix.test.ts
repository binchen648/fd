import { describe, expect, it } from 'vitest';

import { buildA111Matrix, classifyBatchDuplicates, serializeMatrix } from '../phase3-a111-current-main-execution-matrix';

describe('P3-E04-A111 current-main execution matrix', () => {
  it('recomputes the frozen 111/944 accounting and separates allowed batch overlap from illegal duplicates', () => {
    const matrix = buildA111Matrix({ generatedAt: '2026-09-27T00:00:00.000Z' });

    expect(matrix.frozenDenominator).toBe(944);
    expect(matrix.acceptedIdentityCount).toBe(111);
    expect(matrix.remainingIdentityCount).toBe(833);
    expect(matrix.duplicateAcceptedIds).toEqual([]);
    expect(matrix.acceptedBatchOverlapIds).toEqual([
      'servant.drake.skill.sc-drake-1',
      'servant.tomoe.skill.sc-tomoe-1',
    ]);
    expect(matrix.allowedBatchOverlapIds).toEqual(matrix.acceptedBatchOverlapIds);
    expect(matrix.missingAcceptedIds).toEqual([]);
    expect(matrix.missingGeneratedRegistryIds).toHaveLength(87);
    expect(matrix.gateCPendingIdentityCount).toBe(111);
    expect(matrix.identities).toHaveLength(111);
    expect(matrix.identities.some((identity) => identity.canonicalIdentityId === 'master.tiamat.card.life-sea')).toBe(false);
  });

  it('fails closed when an unapproved cross-batch duplicate is introduced', () => {
    const diagnostics = classifyBatchDuplicates({
      'servant.drake.skill.sc-drake-1': ['baseline', 'FM01'],
      'servant.tomoe.skill.sc-tomoe-1': ['baseline', 'FM04'],
      'servant.synthetic.skill.duplicate': ['FM01', 'FM02'],
    });

    expect(diagnostics.acceptedBatchOverlapIds).toEqual([
      'servant.drake.skill.sc-drake-1',
      'servant.synthetic.skill.duplicate',
      'servant.tomoe.skill.sc-tomoe-1',
    ]);
    expect(diagnostics.allowedBatchOverlapIds).toEqual([
      'servant.drake.skill.sc-drake-1',
      'servant.tomoe.skill.sc-tomoe-1',
    ]);
    expect(diagnostics.duplicateAcceptedIds).toEqual(['servant.synthetic.skill.duplicate']);
  });

  it('does not hide current-main material outside the accepted numerator', () => {
    const matrix = buildA111Matrix({ generatedAt: '2026-09-27T00:00:00.000Z' });

    expect(matrix.unexpectedMaterialIds.length).toBeGreaterThan(0);
    expect(matrix.unexpectedMaterialIds).not.toContain('master.tiamat.card.life-sea');
    for (const identity of matrix.unexpectedMaterialIds) {
      expect(matrix.identities.map((row) => row.canonicalIdentityId)).not.toContain(identity);
    }
  });

  it('does not promote family names or unbound reports to identity execution evidence', () => {
    const matrix = buildA111Matrix({ generatedAt: '2026-09-27T00:00:00.000Z' });
    const altera = matrix.identities.find((identity) => identity.canonicalIdentityId === 'servant.altera.skill.sc-altera-3');

    expect(altera).toBeDefined();
    expect(altera?.acceptedRuntimeContracts).not.toContain(altera?.acceptedFamilyId);
    expect(altera?.generatedRegistryPresent).toBe(false);
    expect(altera?.currentMainStatus).toBe('EVIDENCE_BINDING_GAP');
    expect(altera?.acceptanceEvidence.every((evidence) => evidence.sha256MatchesExpected)).toBe(true);
    expect(altera?.acceptanceEvidence.some((evidence) => evidence.validForIdentity)).toBe(false);
    expect(altera?.blockingReasons).toContain('GENERATED_REGISTRY_MISSING');
    expect(altera?.blockingReasons).toContain('ACCEPTANCE_EVIDENCE_IDENTITY_MISSING');
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
