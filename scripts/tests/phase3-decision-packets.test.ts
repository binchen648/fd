import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assertPacketSeparation,
  buildDecisionPackets,
  renderRuleDecisionReport,
  renderRuntimeCapabilityReport,
} from '../phase3-reference/build-decision-packets';

function makeSourceRef(document: string, locator: string) {
  return { kind: 'fixture', document, locator };
}

function makeEntry(
  id: string,
  route: string,
  blockedBy: string[],
  options: { mapped?: boolean; capabilities?: string[] } = {},
) {
  return {
    canonicalAbilityId: id,
    canonicalCardId: id,
    ownerId: 'master.fixture',
    ownerType: 'master',
    ownerName: 'Fixture',
    skillName: id,
    printedText: `Printed ${id}`,
    clauses: [
      {
        text: `Printed ${id}`,
        classification: 'DISCOVERED',
        derivation: 'mechanical_line_split',
        source: {
          document: 'fixture/source.json',
          locator: `skills.${id}`,
          sha256: 'a'.repeat(64),
        },
      },
    ],
    sources: [makeSourceRef('fixture/source.json', `skills.${id}`)],
    reference: {
      skillId: id,
      handlerId: 'core.fixture-handler',
      executionRoute: 'specific_handler',
      hasAuthoringCard: false,
      hasConfirmedOverride: true,
      dynamic: false,
    },
    semanticNormalization: {
      status: options.mapped ? 'SOURCE_GROUNDED' : 'BLOCKED',
      source: options.mapped
        ? { document: 'src/content/authoring/cards.json', locator: 'skillCards[0]' }
        : null,
      axes: {
        timing: [],
        trigger: [],
        condition: [],
        cost: [],
        target: [],
        effect: options.mapped ? ['GAIN_MANA'] : [],
        interaction: [],
        lifecycle: [],
        modifier: [],
        visibility: [],
        binding: [],
        battle: [],
      },
      abilities: [],
      blocks: blockedBy,
      observedBehavior: {
        executionRoute: 'specific_handler',
        handlerId: 'core.fixture-handler',
      },
    },
    phase3: {
      mechanicFamilies: options.mapped ? ['RESOURCE_NUMERIC'] : [],
      requiredCapabilities: options.capabilities ?? [],
      currentRoute: 'none',
      referenceRoute: 'specific_handler',
      inheritedAcceptanceContracts: [],
      partialAcceptanceContracts: [],
      classificationRoute: route,
      mappingStatus: options.mapped ? 'CONTRACT_MAPPED' : 'EXPLICIT_BLOCK',
      blockedBy,
      routeEvidence: {
        currentAbilityIds: [],
        currentAcceptanceContracts: [],
        referenceHandlerId: 'core.fixture-handler',
      },
    },
  };
}

function makeInventory(entries: any[]) {
  return {
    schemaVersion: 1,
    kind: 'phase3-full-roster-ability-inventory',
    provenance: {
      repository: 'https://github.com/example/reference.git',
      commit: '1'.repeat(40),
      inputDigests: {},
    },
    capabilitySummary: {
      totalIdentityCount: entries.length,
      contractMappedCount: entries.filter((entry) => entry.phase3.mappingStatus === 'CONTRACT_MAPPED').length,
      explicitBlockCount: entries.filter((entry) => entry.phase3.mappingStatus === 'EXPLICIT_BLOCK').length,
      currentRouteCounts: { legacy: 0, new: 0, dual: 0, none: entries.length },
      referenceRouteCounts: { deterministic: 0, shared_handler: 0, specific_handler: entries.length, none: 0 },
      classificationRouteCounts: {},
      zeroSilentFallback: true,
    },
    staticSkills: entries,
    dynamicSkills: [],
  };
}

function makeCatalog() {
  return {
    schemaVersion: 1,
    kind: 'phase3-full-roster-capability-catalog',
    provenance: {
      referenceRepository: 'https://github.com/example/reference.git',
      referenceCommit: '1'.repeat(40),
      inventoryKind: 'phase3-full-roster-ability-inventory',
    },
    summary: {},
    capabilities: [
      {
        id: 'GENERIC_RESOURCE_NUMERIC',
        category: 'generic_request',
        mechanicFamily: 'RESOURCE_NUMERIC',
        input: ['controller', 'delta'],
        output: ['typed resource result'],
        events: ['resource mutation'],
        resultBinding: ['result envelope'],
        transactionBehavior: 'atomic fail-closed mutation',
        eligibilityAxes: ['RESOURCE_NUMERIC'],
        invalidatingAxes: ['battle'],
        representatives: [],
        acceptanceVehicle: 'Gate A/B/C representative',
        eligibleAbilities: ['master.fixture.skill.runtime'],
        partialAbilities: [],
        skippedAbilities: [],
      },
    ],
    coverage: {
      mappedAbilities: ['master.fixture.skill.runtime'],
      blockedAbilities: [],
      specialCandidates: [],
    },
  };
}

describe('Phase 3 full-roster decision/runtime packet generation', () => {
  it('groups identical user rule disputes and includes sources, options, recommendation, non-authoritative Reference behavior, and runtime impact', () => {
    const inventory = makeInventory([
      makeEntry('master.fixture.skill.rule-a', 'RULE_DECISION_REQUIRED', ['RULE_DECISION_REQUIRED:fixture-dispute']),
      makeEntry('master.fixture.skill.rule-b', 'RULE_DECISION_REQUIRED', ['RULE_DECISION_REQUIRED:fixture-dispute']),
    ]);
    const result = buildDecisionPackets(inventory as any, makeCatalog() as any);

    expect(result.ruleDecisions.decisionPackets).toHaveLength(1);
    const packet = result.ruleDecisions.decisionPackets[0];
    expect(packet.affectedAbilityIds).toEqual([
      'master.fixture.skill.rule-a',
      'master.fixture.skill.rule-b',
    ]);
    expect(packet.sourceReferences).toHaveLength(2);
    expect(packet.ambiguity.length).toBeGreaterThan(0);
    expect(packet.options.length).toBeGreaterThanOrEqual(2);
    expect(packet.recommendation.length).toBeGreaterThan(0);
    expect(packet.referenceBehavior.authority).toBe('NON_AUTHORITATIVE');
    expect(packet.runtimeImpact.length).toBeGreaterThan(0);
  });

  it('routes technical capability gaps to runtime requests instead of user rule-decision packets', () => {
    const inventory = makeInventory([
      makeEntry(
        'master.fixture.skill.runtime',
        'READY_GENERIC_EXTENSION',
        [],
        { mapped: true, capabilities: ['GENERIC_RESOURCE_NUMERIC'] },
      ),
    ]);
    const result = buildDecisionPackets(inventory as any, makeCatalog() as any);

    expect(result.ruleDecisions.decisionPackets).toEqual([]);
    expect(result.runtimeRequests.requests).toHaveLength(1);
    expect(result.runtimeRequests.requests[0].capabilityId).toBe('GENERIC_RESOURCE_NUMERIC');
    expect(result.runtimeRequests.requests[0].referenceBehavior.authority).toBe('NON_AUTHORITATIVE');
    expect(() => assertPacketSeparation(result.ruleDecisions, result.runtimeRequests)).not.toThrow();
  });

  it('keeps source-evidence blocks separate from user rule decisions and covers every blocked ID exactly once', () => {
    const inventory = makeInventory([
      makeEntry('master.fixture.skill.source-a', 'SOURCE_EVIDENCE_REQUIRED', ['SEMANTIC_SOURCE_REQUIRED']),
      makeEntry('master.fixture.skill.source-b', 'SOURCE_EVIDENCE_REQUIRED', ['SEMANTIC_SOURCE_REQUIRED']),
    ]);
    const result = buildDecisionPackets(inventory as any, makeCatalog() as any);

    expect(result.ruleDecisions.decisionPackets).toEqual([]);
    expect(result.ruleDecisions.sourceEvidencePackets).toHaveLength(1);
    expect(result.ruleDecisions.sourceEvidencePackets[0].affectedAbilityIds).toEqual([
      'master.fixture.skill.source-a',
      'master.fixture.skill.source-b',
    ]);
    expect(result.ruleDecisions.summary.uncoveredBlockedIdentityCount).toBe(0);
  });

  it('renders rule and runtime reports deterministically from the same packet summaries', () => {
    const inventory = makeInventory([
      makeEntry('master.fixture.skill.source-a', 'SOURCE_EVIDENCE_REQUIRED', ['SEMANTIC_SOURCE_REQUIRED']),
      makeEntry(
        'master.fixture.skill.runtime',
        'READY_GENERIC_EXTENSION',
        [],
        { mapped: true, capabilities: ['GENERIC_RESOURCE_NUMERIC'] },
      ),
    ]);
    const result = buildDecisionPackets(inventory as any, makeCatalog() as any);
    const decisions = renderRuleDecisionReport(result.ruleDecisions);
    const runtime = renderRuntimeCapabilityReport(result.runtimeRequests);

    expect(decisions).toContain('ruleDecisionPacketCount=0');
    expect(decisions).toContain('sourceEvidencePacketCount=1');
    expect(runtime).toContain('runtimeRequestCount=1');
  });

  it('keeps the checked-in full-roster outputs complete and separated', () => {
    const decisions = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-rule-decisions.json'), 'utf8'),
    );
    const runtime = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-runtime-capability-requests.json'), 'utf8'),
    );

    expect(decisions.summary.coveredBlockedIdentityCount).toBe(782);
    expect(decisions.summary.uncoveredBlockedIdentityCount).toBe(0);
    expect(decisions.summary.ruleDecisionPacketCount).toBe(0);
    expect(decisions.summary.sourceEvidencePacketCount).toBeGreaterThan(0);
    expect(runtime.summary.runtimeRequestCount).toBeGreaterThan(0);
    expect(runtime.summary.affectedIdentityCount).toBe(162);
    expect(() => assertPacketSeparation(decisions, runtime)).not.toThrow();
  });
});
