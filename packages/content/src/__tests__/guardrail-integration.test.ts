import { beforeEach, describe, expect, it } from 'vitest';
import type { GuardrailResponse } from '@fd/contracts';
import { GuardrailIntegrationManager } from '../guardrail-integration';
import type { MasterIdentityCard } from '../chm-card-types';

function makeCard(overrides: Partial<MasterIdentityCard> = {}): MasterIdentityCard {
  return {
    id: 'master-001',
    name: 'Master',
    language: 'zh-CN',
    sourceSet: 'master',
    namespace: 'master',
    approvedAt: '2026-04-14T00:00:00.000Z',
    guardrailJobId: 'job-approved-001',
    tags: ['master'],
    cardType: 'master_identity',
    initialMana: 4,
    commandSpells: 3,
    ...overrides,
  };
}

function makeResponse(overrides: Partial<GuardrailResponse> = {}): GuardrailResponse {
  return {
    jobId: 'job-approved-001',
    artifactVersion: 'guardrail-response-v1',
    status: 'approve',
    schemaOk: true,
    engineOk: true,
    decision: 'approve',
    ambiguityLevel: 'low',
    coverageReport: {
      sourceClauses: 10,
      mappedClauses: 10,
      unmappedClauses: 0,
      originalClauses: 10,
      missingClauses: 0,
    },
    issues: [],
    requiredHumanReview: false,
    smokeTests: [],
    source: {
      structureJobId: 'structured-job-001',
      provider: 'test',
      model: 'test-model',
    },
    ...overrides,
  };
}

describe('GuardrailIntegrationManager', () => {
  let manager: GuardrailIntegrationManager;

  beforeEach(() => {
    manager = new GuardrailIntegrationManager({
      structuredDataPath: 'data/staged/structured',
      guardrailDataPath: 'data/staged/guardrail',
      outputLibraryPath: 'packages/content/library',
    });
  });

  it('approves cards when response and card payload match', async () => {
    const report = await manager.processGuardrailResponses([makeResponse()], [makeCard()]);

    expect(report.cardsProcessed).toBe(1);
    expect(report.cardsApproved).toBe(1);
    expect(report.cardsRejected).toBe(0);
    expect(report.details).toEqual([
      {
        cardId: 'master-001',
        status: 'approved',
        guardrailDecision: 'approve',
      },
    ]);
  });

  it('rejects approved responses when the approved card payload is missing', async () => {
    const report = await manager.processGuardrailResponses([makeResponse()], []);

    expect(report.cardsProcessed).toBe(1);
    expect(report.cardsRejected).toBe(1);
    expect(report.details[0]).toEqual({
      cardId: 'structured-job-001',
      status: 'rejected',
      reason: 'Approved card payload not found',
      guardrailDecision: 'approve',
    });
  });

  it('rejects invalid approved cards and keeps the validation reason', async () => {
    const report = await manager.processGuardrailResponses(
      [makeResponse()],
      [makeCard({ initialMana: 5 })]
    );

    expect(report.cardsApproved).toBe(0);
    expect(report.cardsRejected).toBe(1);
    expect(report.details[0]?.reason).toBe('Master initial mana must be 4');
  });

  it('tracks review and reject decisions in the detail list', async () => {
    const report = await manager.processGuardrailResponses(
      [
        makeResponse({
          jobId: 'job-review-001',
          decision: 'review',
          status: 'review',
          source: { structureJobId: 'structured-job-002', provider: 'test', model: 'test-model' },
        }),
        makeResponse({
          jobId: 'job-reject-001',
          decision: 'reject',
          status: 'reject',
          source: { structureJobId: 'structured-job-003', provider: 'test', model: 'test-model' },
        }),
      ],
      []
    );

    expect(report.cardsProcessed).toBe(2);
    expect(report.cardsRejected).toBe(1);
    expect(report.details.map((detail) => detail.status)).toEqual(['review_required', 'rejected']);
  });

  it('returns a text summary and an isolated full report snapshot', async () => {
    await manager.processGuardrailResponses([makeResponse()], [makeCard()]);

    const summary = manager.getReportSummary();
    const fullReport = manager.getFullReport();
    const firstDetail = fullReport.details[0];
    expect(firstDetail).toBeDefined();
    if (!firstDetail) {
      throw new Error('Expected report detail');
    }
    firstDetail.cardId = 'mutated';

    expect(summary).toContain('Cards Approved: 1');
    expect(summary).toContain('Approval Rate: 100.00%');
    expect(manager.getFullReport().details[0]?.cardId).toBe('master-001');
    expect(manager.getConfig().outputLibraryPath).toBe('packages/content/library');
  });
});
