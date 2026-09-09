import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildCoverageFromArchives,
  classifyAbilityForCoverage,
  type AuthoringArchiveLike,
} from '../phase3-coverage';
import {
  auditPromotionEvidence,
  buildP3A02AutomationAudit,
  summarizeLegacyOwners,
} from '../phase3-automation-audit';
import { buildReviewPacket, hotRuntimeTouchSummary, loadCoverage } from '../phase3-review-packet';

function archiveWithAbilities(abilities: unknown[]): AuthoringArchiveLike {
  return {
    id: 'test.archive',
    cards: [
      {
        id: 'test.card',
        abilities,
      },
    ],
  };
}

describe('phase3 coverage taxonomy drift protections', () => {
  it('changes ability totals automatically when source abilities change', () => {
    const base = buildCoverageFromArchives([archiveWithAbilities([
      { id: 'ability.one', kind: 'phase_action', activation: { phase: 'action' }, effects: [] },
    ])], { generatedAt: '2026-09-09T00:00:00.000Z' });
    const expanded = buildCoverageFromArchives([archiveWithAbilities([
      { id: 'ability.one', kind: 'phase_action', activation: { phase: 'action' }, effects: [] },
      { id: 'ability.two', kind: 'passive', activation: { trigger: 'while_active' }, effects: [] },
    ])], { generatedAt: '2026-09-09T00:00:00.000Z' });

    expect(base.counts.totalAbilities).toBe(1);
    expect(expanded.counts.totalAbilities).toBe(2);
  });

  it('does not classify phase_action as a domain trigger', () => {
    const row = classifyAbilityForCoverage(
      { id: 'test.archive' },
      { id: 'test.card' },
      { id: 'ability.phase', kind: 'phase_action', activation: { phase: 'action' }, effects: [] },
    );

    expect(row.abilityKind).toEqual(['PHASE_ACTION']);
    expect(row.domainEventTriggers).toEqual([]);
    expect(row.taxonomyWarnings).toContain('TAXONOMY_DRIFT_WARNING:phase_action_is_not_domain_trigger');
  });

  it('does not classify passive ability kind as a lifecycle policy', () => {
    const row = classifyAbilityForCoverage(
      { id: 'test.archive' },
      { id: 'test.card' },
      { id: 'ability.passive', kind: 'passive', activation: { trigger: 'while_active' }, effects: [] },
    );

    expect(row.abilityKind).toEqual(['PASSIVE']);
    expect(row.lifecyclePolicies).toEqual([]);
    expect(row.taxonomyWarnings).toContain('TAXONOMY_DRIFT_WARNING:passive_kind_is_not_lifecycle_policy');
  });

  it('does not classify on_card_played as an interaction without extra player input', () => {
    const row = classifyAbilityForCoverage(
      { id: 'test.archive' },
      { id: 'test.card' },
      {
        id: 'ability.played',
        kind: 'residual',
        activation: { trigger: 'on_card_played' },
        effects: [{ type: 'close_source_card' }],
      },
    );

    expect(row.domainEventTriggers).toEqual(['on_card_played']);
    expect(row.interactions).toEqual([]);
    expect(row.strictPendingInteractions).toEqual([]);
  });

  it('keeps unknown primitive classifications visible', () => {
    const coverage = buildCoverageFromArchives([archiveWithAbilities([
      {
        id: 'ability.unknown',
        kind: 'phase_action',
        activation: { phase: 'action' },
        effects: [{ type: 'future_primitive' }],
      },
    ])], { generatedAt: '2026-09-09T00:00:00.000Z' });

    expect(coverage.unclassifiedItems).toContainEqual(expect.objectContaining({
      abilityId: 'ability.unknown',
      reason: 'NOT_CLASSIFIABLE:unknown_effect_primitive:future_primitive',
    }));
    expect(coverage.primitiveCoverage.unknownPrimitiveCounts.future_primitive).toBe(1);
  });

  it('does not auto-misclassify unknown runtime routes as legacy/new/dual', () => {
    const coverage = buildCoverageFromArchives([archiveWithAbilities([
      {
        id: 'ability.unknown-route',
        kind: 'phase_action',
        activation: { phase: 'action' },
        effects: [{ type: 'future_primitive' }],
      },
    ])], { generatedAt: '2026-09-09T00:00:00.000Z' });

    expect(coverage.runtimeRouting.newRuntimeConsumers.after).toBe(0);
    expect(coverage.runtimeRouting.legacyResolveEffectConsumers.after).toBe(0);
    expect(coverage.runtimeRouting.dualRuntimeConsumers.after).toBe(0);
    expect(coverage.runtimeRouting.notClassifiable.after).toBe(1);
  });

  it('emits machine-readable Gate evidence metadata without promoting acceptance', () => {
    const coverage = buildCoverageFromArchives([archiveWithAbilities([
      {
        id: 'ability.resource',
        kind: 'phase_action',
        activation: { phase: 'action' },
        effects: [{ type: 'adjust_mana', amount: 1 }],
      },
    ])], { generatedAt: '2026-09-09T00:00:00.000Z' });

    expect(coverage.gateEvidenceMetadata).toEqual({
      authority: 'IMPLEMENTER_EVIDENCE_ONLY',
      allowedClaim: 'AUTOMATION_BASELINE_CANDIDATE',
      reviewerRequiredForPromotion: true,
      promotedStatuses: [],
    });
  });

  it('builds reviewer packets with explicit non-runtime ownership boundaries', () => {
    const coverage = buildCoverageFromArchives([archiveWithAbilities([
      {
        id: 'ability.resource',
        kind: 'phase_action',
        activation: { phase: 'action' },
        effects: [{ type: 'adjust_mana', amount: 1 }],
      },
    ])], { generatedAt: '2026-09-09T00:00:00.000Z' });
    const packet = buildReviewPacket(coverage, {
      task: 'P3-A01',
      batch: 'PHASE_3_COVERAGE_AND_EVIDENCE_AUTOMATION',
    });

    expect(packet.hotRuntimeFilesTouched.status).toBe('NO');
    expect(packet.claimedAcceptance).toBe('AUTOMATION_BASELINE_CANDIDATE');
    expect(packet.knownLimitations).toContain('Runtime routing classification is conservative static evidence, not a complete call graph.');
    expect(packet.areasNotVerified).toContain('Independent reviewer promotion.');
  });

  it('does not classify unknown primitives as new runtime only because data-flow syntax exists', () => {
    const coverage = buildCoverageFromArchives([archiveWithAbilities([
      {
        id: 'ability.unknown-dataflow',
        kind: 'phase_action',
        activation: { phase: 'action' },
        effects: [{ type: 'future_primitive', bind: 'futureResult' }],
      },
    ])], { generatedAt: '2026-09-09T00:00:00.000Z' });

    expect(coverage.runtimeRouting.newRuntimeConsumers.after).toBe(0);
    expect(coverage.runtimeRouting.notClassifiable.after).toBe(1);
    expect(coverage.unclassifiedItems).toContainEqual(expect.objectContaining({
      abilityId: 'ability.unknown-dataflow',
      reason: 'NOT_CLASSIFIABLE:unknown_effect_primitive:future_primitive',
    }));
  });

  it('reports hot runtime files from the reviewed diff file list', () => {
    expect(hotRuntimeTouchSummary([
      'scripts/phase3-coverage.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/match-session.ts',
    ])).toEqual({
      status: 'YES',
      files: [
        'packages/rules/src/ability/interpreter.ts',
        'packages/rules/src/match-session.ts',
      ],
    });

    expect(hotRuntimeTouchSummary([
      'scripts/phase3-coverage.ts',
      'docs/reports/result.md',
    ])).toEqual({ status: 'NO', files: [] });
  });

  it('regenerates review coverage from current authoring instead of stale artifact files', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'fd-phase3-coverage-'));
    try {
      mkdirSync(join(workspace, 'data/authoring/masters'), { recursive: true });
      mkdirSync(join(workspace, 'data/authoring/servants'), { recursive: true });
      mkdirSync(join(workspace, 'artifacts'), { recursive: true });
      writeFileSync(join(workspace, 'artifacts/phase3-skill-coverage.json'), JSON.stringify({
        schemaVersion: 'fd-phase3-skill-coverage-v1',
        sourceFingerprint: 'stale',
        counts: { totalAbilities: 99 },
      }));
      writeFileSync(join(workspace, 'data/authoring/masters/master.test.json'), JSON.stringify(archiveWithAbilities([
        { id: 'ability.current', kind: 'phase_action', activation: { phase: 'action' }, effects: [] },
      ])));

      const coverage = loadCoverage(workspace);

      expect(coverage.counts.totalAbilities).toBe(1);
      expect(coverage.sourceFingerprint).not.toBe('stale');
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('groups remaining legacy and unclassified consumers by owner for B planning', () => {
    const coverage = buildCoverageFromArchives([archiveWithAbilities([
      {
        id: 'ability.legacy-resource',
        kind: 'phase_action',
        activation: { phase: 'action' },
        effects: [{ type: 'move_card' }],
      },
      {
        id: 'ability.unknown',
        kind: 'phase_action',
        activation: { phase: 'action' },
        effects: [{ type: 'future_primitive' }],
      },
    ])], { generatedAt: '2026-09-09T00:00:00.000Z' });

    const report = summarizeLegacyOwners(coverage);

    expect(report.totals).toEqual({
      legacyResolveEffect: 1,
      legacyExecuteAbility: 0,
      notClassifiable: 1,
    });
    expect(report.owners).toContainEqual(expect.objectContaining({
      owner: 'primitive:move_card',
      runtimeRoute: 'LEGACY_RESOLVE_EFFECT',
      abilityCount: 1,
    }));
    expect(report.owners).toContainEqual(expect.objectContaining({
      owner: 'unclassified:unknown_effect_primitive:future_primitive',
      runtimeRoute: 'NOT_CLASSIFIABLE',
      abilityCount: 1,
    }));
  });

  it('flags Gate C report claims that reference missing E2E specs', () => {
    const audit = auditPromotionEvidence([
      {
        path: 'docs/reports/example.md',
        text: [
          '# Example',
          '## Gate C Evidence',
          '`e2e/fd-missing.spec.ts` covers browser, expectedRevision, reconnect, and stale replay.',
        ].join('\n'),
      },
    ], new Set(['e2e/fd-existing.spec.ts']));

    expect(audit.findings).toContainEqual({
      severity: 'BLOCKING',
      reportPath: 'docs/reports/example.md',
      finding: 'GATE_C_REFERENCES_MISSING_E2E_SPEC',
      reference: 'e2e/fd-missing.spec.ts',
    });
  });

  it('flags missing E2E specs when Gate C is declared outside a level-two section', () => {
    const audit = auditPromotionEvidence([
      {
        path: 'docs/reports/gate-c-title.md',
        text: [
          '# Time Alter Core Primitive Gate C Result',
          '',
          '- Gate C status: candidate evidence added.',
          '- Browser evidence: `e2e/fd-time-alter-core-primitive.spec.ts`.',
        ].join('\n'),
      },
      {
        path: 'docs/reports/inline-gate-c.md',
        text: [
          '# Artoria Caster Result',
          '',
          'Gate C implementer evidence:',
          '',
          '- `e2e/fd-artoriac-sword-modifier-lifecycle.spec.ts` covers reconnect.',
        ].join('\n'),
      },
    ], new Set());

    expect(audit.findings).toEqual(expect.arrayContaining([
      {
        severity: 'BLOCKING',
        reportPath: 'docs/reports/gate-c-title.md',
        finding: 'GATE_C_REFERENCES_MISSING_E2E_SPEC',
        reference: 'e2e/fd-time-alter-core-primitive.spec.ts',
      },
      {
        severity: 'BLOCKING',
        reportPath: 'docs/reports/inline-gate-c.md',
        finding: 'GATE_C_REFERENCES_MISSING_E2E_SPEC',
        reference: 'e2e/fd-artoriac-sword-modifier-lifecycle.spec.ts',
      },
    ]));
  });

  it('builds a P3-A02 automation packet without promoting Gate status', () => {
    const coverage = buildCoverageFromArchives([archiveWithAbilities([
      {
        id: 'ability.legacy',
        kind: 'phase_action',
        activation: { phase: 'action' },
        effects: [{ type: 'move_card' }],
      },
    ])], { generatedAt: '2026-09-09T00:00:00.000Z' });

    const packet = buildP3A02AutomationAudit(coverage, [], new Set());

    expect(packet.task).toBe('P3-A02');
    expect(packet.claimedAcceptance).toBe('AUTOMATION_BASELINE_CANDIDATE');
    expect(packet.gatePromotion).toEqual({
      promotedStatuses: [],
      reviewerRequiredForPromotion: true,
    });
    expect(packet.legacyOwnerReport.totals.legacyResolveEffect).toBe(1);
  });
});
