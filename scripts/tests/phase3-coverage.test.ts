import { describe, expect, it } from 'vitest';

import {
  buildCoverageFromArchives,
  classifyAbilityForCoverage,
  type AuthoringArchiveLike,
} from '../phase3-coverage';

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
});
