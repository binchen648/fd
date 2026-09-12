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

  it('keeps B05 play-source response coverage aligned to the exact runtime contract', () => {
    const semanticRoute = 'CARD_ACTION_SEMANTICS_MINIMAL:PLAY_SOURCE_CARD_WITH_COST_RESPONSE';
    const exactAbility = {
      id: 'ability.play-source-response',
      kind: 'response',
      activation: { trigger: 'controller_combat_action_window' },
      responseWindow: { opens: 'controller_combat_action_window' },
      cost: [{ type: 'pay_mana', amount: 2 }],
      targets: [],
      creates: [],
      effects: [{ type: 'play_source_card', face: 'face_up' }],
    };

    expect(classifyAbilityForCoverage(
      { id: 'test.archive' },
      { id: 'test.card' },
      exactAbility,
    ).semanticRoutes).toContain(semanticRoute);

    const variants = [
      { name: 'wrong cost', patch: { cost: [{ type: 'pay_mana', amount: 1 }] } },
      { name: 'face-down source play', patch: { effects: [{ type: 'play_source_card', face: 'face_down' }] } },
      { name: 'targets present', patch: { targets: [{ type: 'player', id: 'target-player' }] } },
      { name: 'creates present', patch: { creates: [{ type: 'card', definitionId: 'created-card' }] } },
      { name: 'wrong trigger', patch: { activation: { trigger: 'on_card_played' } } },
      { name: 'wrong response window', patch: { responseWindow: { opens: 'controller_action_window' } } },
    ];

    for (const { name, patch } of variants) {
      const ability = { ...structuredClone(exactAbility), ...patch, id: `ability.play-source-response.${name}` };
      const row = classifyAbilityForCoverage({ id: 'test.archive' }, { id: 'test.card' }, ability);
      expect(row.semanticRoutes, name).not.toContain(semanticRoute);
    }
  });

  it('classifies only the accepted B10 setup create-to-skill semantic shape', () => {
    const semanticRoute = 'SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL';
    const exactAbility = {
      id: 'renamed.setup-create-to-skill',
      kind: 'forced_trigger',
      activation: { trigger: 'game_start' },
      conditions: [],
      targets: [],
      cost: [],
      creates: [],
      effects: [{ type: 'create_card', cardId: 'card.luck', to: { zone: 'skill' } }],
      execution: { mode: 'automatic' },
    };

    const exact = classifyAbilityForCoverage({ id: 'test.archive' }, { id: 'renamed.card' }, exactAbility);
    expect(exact.semanticRoutes).toContain(semanticRoute);
    expect(exact.runtimeRoute).toBe('NEW_RUNTIME_SEMANTIC_ROUTED');

    const variants = [
      { name: 'wrong kind', patch: { kind: 'optional_trigger' } },
      { name: 'wrong trigger', patch: { activation: { trigger: 'after_controller_wins_battle' } } },
      { name: 'condition present', patch: { conditions: [{ type: 'source_card_in_zone', zone: 'hand' }] } },
      { name: 'target present', patch: { targets: [{ id: 'target', type: 'player' }] } },
      { name: 'cost present', patch: { cost: [{ type: 'pay_mana', amount: 1 }] } },
      { name: 'creates present', patch: { creates: [{ type: 'create_card', cardId: 'other', to: { zone: 'skill' } }] } },
      { name: 'extra effect', patch: { effects: [...exactAbility.effects, { type: 'shuffle_deck' }] } },
      { name: 'missing card id', patch: { effects: [{ type: 'create_card', to: { zone: 'skill' } }] } },
      { name: 'wrong destination', patch: { effects: [{ type: 'create_card', cardId: 'card.luck', to: { zone: 'deck' } }] } },
      { name: 'owner override', patch: { effects: [{ type: 'create_card', cardId: 'card.luck', to: { zone: 'skill', owner: 'controller' } }] } },
      { name: 'nested then', patch: { effects: [{ type: 'create_card', cardId: 'card.luck', to: { zone: 'skill' }, then: [{ type: 'shuffle_deck' }] }] } },
      { name: 'wrong mode', patch: { execution: { mode: 'host_adjudicated' } } },
    ];

    for (const { name, patch } of variants) {
      const ability = { ...structuredClone(exactAbility), ...patch, id: `variant.${name}` };
      const row = classifyAbilityForCoverage({ id: 'test.archive' }, { id: 'test.card' }, ability);
      expect(row.semanticRoutes, name).not.toContain(semanticRoute);
    }
  });

  it('reports three exact B10 consumers without inheriting Artoria Caster Luck', () => {
    const exact = (id: string, cardId: string) => ({
      id,
      kind: 'forced_trigger',
      activation: { trigger: 'game_start' },
      conditions: [],
      targets: [],
      cost: [],
      creates: [],
      effects: [{ type: 'create_card', cardId, to: { zone: 'skill' } }],
      execution: { mode: 'automatic' },
    });
    const luck = (id: string) => ({
      id,
      kind: 'optional_trigger',
      activation: { trigger: 'after_controller_wins_battle', opens: 'post_battle_optional_trigger_window' },
      conditions: [{ type: 'source_card_in_zone', zone: 'hand', owner: 'controller' }],
      targets: [],
      cost: [{ type: 'move_source_card', from: { zone: 'hand', owner: 'controller' }, to: { zone: 'removed_from_game', owner: 'controller' } }],
      creates: [{ type: 'create_card', cardId: 'card.luck', to: { zone: 'deck', owner: 'controller' }, then: [{ type: 'shuffle_deck', owner: 'controller' }] }],
      effects: [],
      execution: { mode: 'automatic' },
    });
    const coverage = buildCoverageFromArchives([archiveWithAbilities([
      exact('military.has-support-shot', 'master.maiya.deck.support-shot'),
      exact('astronomical-science.has-chaldeas', 'master.olga-marie.skill.chaldeas'),
      exact('useless-person.setup', 'master.shinji.skill.false-attendant-book'),
      luck('sc-artoriac-4.unique-passive-luck-on-win'),
      luck('sc-artoriac-5.unique-passive-luck-on-win'),
      luck('sc-artoriac-6.unique-passive-luck-on-win'),
    ])], { generatedAt: '2026-09-12T00:00:00.000Z' });

    expect(coverage.runtimeRouting.semanticRouteCounts['SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL']).toBe(3);
    expect(coverage.runtimeRouting.newRuntimeConsumers.after).toBe(3);
    expect(coverage.runtimeRouting.legacyResolveEffectConsumers.after).toBe(0);
    expect(coverage.runtimeRouting.legacyExecuteAbilityConsumers.after).toBe(3);
    expect(coverage.runtimeRouting.notClassifiable.after).toBe(0);
    expect(coverage.runtimeRouting.dualRuntimeConsumers.after).toBe(0);
  });

  it('reconciles the accepted B06 add-to-attack classifier baseline', () => {
    const semanticRoute = 'CARD_ACTION_SEMANTICS_MINIMAL:ADD_TO_ATTACK';
    const exactAbility = {
      id: 'renamed.add-to-attack',
      kind: 'phase_action',
      activation: { phase: 'advance', opens: 'controller_action_window' },
      conditions: [{ type: 'not', condition: { type: 'controller_at_battlefield' } }],
      targets: [{ id: 'supported_player', type: 'player', constraints: [{ type: 'not_controller' }], count: { min: 1, max: 1 } }],
      cost: [{ type: 'pay_mana', amount: 2 }],
      creates: [],
      effects: [{
        type: 'attach_card_to_player_attack',
        cardId: 'master.maiya.deck.support-shot',
        target: 'supported_player',
        returnAtRoundEnd: true,
        controllerCannotWinStatus: 'maiya_cannot_win_battle_this_round',
      }],
    };

    expect(classifyAbilityForCoverage({ id: 'test.archive' }, { id: 'test.card' }, exactAbility).semanticRoutes)
      .toContain(semanticRoute);
    const wrongCard = structuredClone(exactAbility);
    wrongCard.effects[0]!.cardId = 'master.maiya.deck.other-card';
    expect(classifyAbilityForCoverage({ id: 'test.archive' }, { id: 'test.card' }, wrongCard).semanticRoutes)
      .not.toContain(semanticRoute);
  });

  it('reconciles accepted B07 and B08 exact classifier boundaries', () => {
    const activateRoute = 'CARD_ACTION_SEMANTICS_MINIMAL:ACTIVATE';
    const activate = {
      id: 'renamed.activate',
      kind: 'forced_trigger',
      activation: { trigger: 'after_controller_first_loses_battle' },
      targets: [],
      cost: [],
      creates: [],
      effects: [{ type: 'activate_card_by_id', definitionId: 'master.olga-marie.skill.trismegistus-grief' }],
    };
    const wrongDefinition = structuredClone(activate);
    wrongDefinition.effects[0]!.definitionId = 'master.olga-marie.skill.chaldeas';
    expect(classifyAbilityForCoverage({ id: 'test.archive' }, { id: 'test.card' }, activate).semanticRoutes)
      .toContain(activateRoute);
    expect(classifyAbilityForCoverage({ id: 'test.archive' }, { id: 'test.card' }, wrongDefinition).semanticRoutes)
      .not.toContain(activateRoute);

    const closeRoute = 'CARD_ACTION_SEMANTICS_MINIMAL:CLOSE';
    const close = {
      id: 'renamed.close',
      kind: 'residual',
      activation: { trigger: 'on_card_played', opens: 'immediate' },
      conditions: [
        { type: 'source_card_in_zone', zone: 'field' },
        { type: 'event_played_card_has_attribute', attribute: '宝具' },
      ],
      targets: [],
      cost: [],
      creates: [],
      lifecycle: { duration: 'while_card_active', cleanup: 'when_card_leaves_active_area' },
      effects: [{ type: 'close_source_card' }],
    };
    const missingSourceCondition = structuredClone(close);
    missingSourceCondition.conditions.shift();
    expect(classifyAbilityForCoverage({ id: 'test.archive' }, { id: 'test.card' }, close).semanticRoutes)
      .toContain(closeRoute);
    expect(classifyAbilityForCoverage({ id: 'test.archive' }, { id: 'test.card' }, missingSourceCondition).semanticRoutes)
      .not.toContain(closeRoute);
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
