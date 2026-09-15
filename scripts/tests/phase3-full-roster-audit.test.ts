import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  auditFullRosterArtifacts,
  renderAutomationAuditReport,
  type ReferenceAuditSnapshot,
} from '../phase3-reference/audit-full-roster';

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function fixture() {
  const staticId = 'master.fixture.skill.s1';
  const dynamicId = 'master.fixture.card.dynamic';
  const clause = 'Action phase: gain 1 mana.';
  const snapshot: ReferenceAuditSnapshot = {
    repository: 'https://github.com/example/reference.git',
    commit: '1'.repeat(40),
    staticSkills: [
      {
        id: staticId,
        ownerId: 'master.fixture',
        ownerType: 'master',
        ownerName: 'Fixture Master',
        skillName: 'Fixture Skill',
        printedText: clause,
        sourceRefs: [
          { kind: 'fixture', document: 'fixture.json', locator: 'masters[0].skills[0]' },
        ],
        expectedClauses: [
          {
            text: clause,
            derivation: 'v2_printed_clause',
            sourceAbilityId: 'fixture-action',
            source: {
              document: 'src/content/authoring/cards.json',
              locator: 'skillCards[0].abilities[0].printedClause',
              sha256: sha256(clause),
            },
          },
        ],
        authoringAbilityIds: ['fixture-action'],
      },
    ],
    dynamicSkillIds: [dynamicId],
    programIds: [staticId],
    authoringCardIds: [staticId],
    authoringAbilityCount: 1,
  };

  const emptyAxes = {
    timing: [], trigger: [], condition: [], cost: [], target: [], effect: ['GAIN_MANA'],
    interaction: [], lifecycle: [], modifier: [], visibility: [], binding: [], battle: [],
  };
  const inventory = {
    schemaVersion: 1,
    kind: 'phase3-full-roster-ability-inventory',
    provenance: { repository: snapshot.repository, commit: snapshot.commit, inputDigests: {} },
    semanticSummary: {
      totalIdentityCount: 2,
      sourceGroundedCount: 1,
      blockedCount: 1,
      unclassifiedCount: 0,
      structuredAbilityCount: 1,
    },
    capabilitySummary: {
      totalIdentityCount: 2,
      contractMappedCount: 1,
      explicitBlockCount: 1,
      currentRouteCounts: { legacy: 0, new: 0, dual: 0, none: 2 },
      referenceRouteCounts: { deterministic: 1, shared_handler: 0, specific_handler: 0, none: 1 },
      classificationRouteCounts: {
        READY_EXISTING_CONTRACT: 0,
        READY_GENERIC_EXTENSION: 1,
        SPECIAL_HANDLER_CANDIDATE: 0,
        RULE_DECISION_REQUIRED: 0,
        SOURCE_EVIDENCE_REQUIRED: 1,
        PHASE_DEPENDENCY_BLOCKED: 0,
        REFERENCE_RUNTIME_CONFLICT: 0,
      },
      zeroSilentFallback: true,
    },
    staticSkills: [
      {
        canonicalAbilityId: staticId,
        canonicalCardId: staticId,
        ownerId: 'master.fixture',
        ownerType: 'master',
        ownerName: 'Fixture Master',
        skillName: 'Fixture Skill',
        printedText: clause,
        clauses: [
          {
            text: clause,
            classification: 'SOURCE_GROUNDED',
            derivation: 'v2_printed_clause',
            sourceAbilityId: 'fixture-action',
            source: {
              document: 'src/content/authoring/cards.json',
              locator: 'skillCards[0].abilities[0].printedClause',
              sha256: sha256(clause),
            },
          },
        ],
        sources: [{ kind: 'fixture', document: 'fixture.json', locator: 'masters[0].skills[0]' }],
        reference: {
          skillId: staticId,
          executionRoute: 'deterministic',
          hasAuthoringCard: true,
          hasConfirmedOverride: true,
          dynamic: false,
        },
        classification: 'CONTRACT_MAPPED',
        blockedBy: [],
        semanticNormalization: {
          status: 'SOURCE_GROUNDED',
          source: { document: 'src/content/authoring/cards.json', locator: 'skillCards[0]' },
          axes: emptyAxes,
          abilities: [
            {
              sourceAbilityId: 'fixture-action',
              kind: 'PHASE_ACTION',
              source: { document: 'src/content/authoring/cards.json', locator: 'skillCards[0].abilities[0]' },
              axes: emptyAxes,
            },
          ],
          blocks: [],
          observedBehavior: { executionRoute: 'deterministic' },
        },
        phase3: {
          mechanicFamilies: ['RESOURCE_NUMERIC'],
          requiredCapabilities: ['GENERIC_RESOURCE_NUMERIC'],
          currentRoute: 'none',
          referenceRoute: 'deterministic',
          inheritedAcceptanceContracts: [],
          partialAcceptanceContracts: [],
          classificationRoute: 'READY_GENERIC_EXTENSION',
          mappingStatus: 'CONTRACT_MAPPED',
          blockedBy: [],
          routeEvidence: { currentAbilityIds: [], currentAcceptanceContracts: [] },
        },
      },
    ],
    dynamicSkills: [
      {
        canonicalAbilityId: dynamicId,
        canonicalCardId: dynamicId,
        ownerId: 'master.fixture',
        ownerType: 'master',
        ownerName: 'Fixture Master',
        skillName: null,
        printedText: null,
        clauses: [],
        sources: [{ kind: 'reference-audit', document: 'docs/skill-audit.json', locator: 'dynamicRuntimeSkills[0]' }],
        reference: {
          skillId: dynamicId,
          executionRoute: null,
          hasAuthoringCard: false,
          hasConfirmedOverride: false,
          dynamic: true,
        },
        classification: 'DISCOVERED',
        blockedBy: ['SOURCE_EVIDENCE_REQUIRED'],
        semanticNormalization: {
          status: 'BLOCKED',
          source: null,
          axes: { ...emptyAxes, effect: [] },
          abilities: [],
          blocks: ['SOURCE_EVIDENCE_REQUIRED', 'SEMANTIC_SOURCE_REQUIRED'],
          observedBehavior: { executionRoute: null },
        },
        phase3: {
          mechanicFamilies: [],
          requiredCapabilities: [],
          currentRoute: 'none',
          referenceRoute: 'none',
          inheritedAcceptanceContracts: [],
          partialAcceptanceContracts: [],
          classificationRoute: 'SOURCE_EVIDENCE_REQUIRED',
          mappingStatus: 'EXPLICIT_BLOCK',
          blockedBy: ['SOURCE_EVIDENCE_REQUIRED', 'SEMANTIC_SOURCE_REQUIRED'],
          routeEvidence: { currentAbilityIds: [], currentAcceptanceContracts: [] },
        },
      },
    ],
  };

  const catalog = {
    schemaVersion: 1,
    kind: 'phase3-full-roster-capability-catalog',
    provenance: {
      referenceRepository: snapshot.repository,
      referenceCommit: snapshot.commit,
      inventoryKind: inventory.kind,
    },
    summary: {
      ...inventory.capabilitySummary,
      capabilityCount: 1,
    },
    capabilities: [
      {
        id: 'GENERIC_RESOURCE_NUMERIC',
        category: 'generic_request',
        mechanicFamily: 'RESOURCE_NUMERIC',
        input: [], output: [], events: [], resultBinding: [],
        transactionBehavior: 'atomic', eligibilityAxes: [], invalidatingAxes: [], representatives: [],
        acceptanceVehicle: 'fixture',
        eligibleAbilities: [staticId],
        partialAbilities: [],
        skippedAbilities: [],
      },
    ],
    coverage: {
      mappedAbilities: [staticId],
      blockedAbilities: [
        { abilityId: dynamicId, route: 'SOURCE_EVIDENCE_REQUIRED', blockedBy: ['SOURCE_EVIDENCE_REQUIRED', 'SEMANTIC_SOURCE_REQUIRED'] },
      ],
      specialCandidates: [],
    },
  };

  const decisions = {
    schemaVersion: 1,
    kind: 'phase3-full-roster-rule-decisions',
    provenance: { referenceRepository: snapshot.repository, referenceCommit: snapshot.commit },
    summary: {
      blockedIdentityCount: 1,
      coveredBlockedIdentityCount: 1,
      uncoveredBlockedIdentityCount: 0,
      ruleDecisionPacketCount: 0,
      sourceEvidencePacketCount: 1,
      externalDependencyCount: 0,
    },
    decisionPackets: [],
    sourceEvidencePackets: [
      { packetId: 'source-1', affectedAbilityIds: [dynamicId] },
    ],
    externalDependencies: [],
  };

  const runtime = {
    schemaVersion: 1,
    kind: 'phase3-full-roster-runtime-capability-requests',
    provenance: { referenceRepository: snapshot.repository, referenceCommit: snapshot.commit },
    summary: {
      runtimeRequestCount: 1,
      genericCapabilityRequestCount: 1,
      reviewedSpecialRequestCount: 0,
      affectedIdentityCount: 1,
    },
    requests: [
      {
        capabilityId: 'GENERIC_RESOURCE_NUMERIC',
        requestType: 'GENERIC_CAPABILITY_REQUEST',
        affectedAbilityIds: [staticId],
      },
    ],
  };

  return { snapshot, inventory, catalog, decisions, runtime, staticId, dynamicId };
}

describe('Phase 3 independent full-roster automation audit', () => {
  it('reports exact agreement for independently consistent raw-reference and generated artifacts', () => {
    const f = fixture();
    const audit = auditFullRosterArtifacts(f.snapshot, f.inventory as any, f.catalog as any, f.decisions as any, f.runtime as any);

    expect(audit.status).toBe('EXACT_AGREEMENT');
    expect(audit.gaps).toEqual([]);
    expect(audit.recomputed).toMatchObject({
      staticSkillCount: 1,
      dynamicSkillCount: 1,
      totalIdentityCount: 2,
      authoringCardCount: 1,
      authoringAbilityCount: 1,
      clauseCount: 1,
      sourceGroundedCount: 1,
      explicitBlockCount: 1,
      contractMappedCount: 1,
    });
  });

  it('detects static identity drift instead of trusting generated totals', () => {
    const f = fixture();
    f.inventory.staticSkills[0].canonicalAbilityId = 'master.fixture.skill.WRONG';
    const audit = auditFullRosterArtifacts(f.snapshot, f.inventory as any, f.catalog as any, f.decisions as any, f.runtime as any);

    expect(audit.status).toBe('AUTOMATION_CLASSIFICATION_GAP');
    expect(audit.gaps.some((gap) => gap.code === 'STATIC_ID_SET_MISMATCH')).toBe(true);
  });

  it('detects clause drift against independently reconstructed Reference clauses', () => {
    const f = fixture();
    f.inventory.staticSkills[0].clauses[0].text = 'Wrong clause';
    const audit = auditFullRosterArtifacts(f.snapshot, f.inventory as any, f.catalog as any, f.decisions as any, f.runtime as any);

    expect(audit.gaps.some((gap) => gap.code === 'CLAUSE_MISMATCH' && gap.ids.includes(f.staticId))).toBe(true);
  });

  it('detects duplicate or missing blocked-packet coverage', () => {
    const f = fixture();
    f.decisions.sourceEvidencePackets.push({ packetId: 'source-2', affectedAbilityIds: [f.dynamicId] });
    const audit = auditFullRosterArtifacts(f.snapshot, f.inventory as any, f.catalog as any, f.decisions as any, f.runtime as any);

    expect(audit.gaps.some((gap) => gap.code === 'BLOCKED_PACKET_COVERAGE_MISMATCH')).toBe(true);
  });

  it('detects capability catalog membership drift', () => {
    const f = fixture();
    f.catalog.capabilities[0].eligibleAbilities = [];
    const audit = auditFullRosterArtifacts(f.snapshot, f.inventory as any, f.catalog as any, f.decisions as any, f.runtime as any);

    expect(audit.gaps.some((gap) => gap.code === 'CAPABILITY_MEMBERSHIP_MISMATCH')).toBe(true);
  });

  it('accepts allowlisted Wiki evidence but rejects unknown or non-Fandom overlay authority', () => {
    const f = fixture();
    const groundedId = f.staticId;
    f.snapshot.authoringCardIds = [];
    f.snapshot.authoringAbilityCount = 0;
    f.snapshot.staticSkills[0].authoringAbilityIds = [];
    f.inventory.staticSkills[0].semanticNormalization.source = {
      document: 'Fate/Domination Wiki',
      locator: 'Fixture#Cards/Test',
    };
    f.inventory.staticSkills[0].semanticNormalization.abilities = [
      {
        sourceAbilityId: 'fixture.external',
        kind: 'PASSIVE',
        source: { document: 'Fate/Domination Wiki', locator: 'Fixture#Cards/Test#ability-1' },
        axes: f.inventory.staticSkills[0].semanticNormalization.axes,
      },
    ];

    const overlay = [{
      id: groundedId,
      printedText: f.snapshot.staticSkills[0].printedText,
      referencePrintedTextSha256: sha256(f.snapshot.staticSkills[0].printedText),
      source: {
        authority: 'FATE_DOMINATION_WIKI',
        document: 'Fate/Domination Wiki',
        locator: 'Fixture#Cards/Test',
        url: 'https://fatedomination.fandom.com/wiki/Fixture',
      },
      abilities: [{ id: 'fixture.external' }],
    }];
    const accepted = auditFullRosterArtifacts(
      f.snapshot,
      f.inventory as any,
      f.catalog as any,
      f.decisions as any,
      f.runtime as any,
      overlay,
    );
    expect(accepted.gaps.some((gap) => gap.code.startsWith('SOURCE_EVIDENCE_OVERLAY_'))).toBe(false);

    const badAuthority = structuredClone(overlay);
    badAuthority[0].source.url = 'https://example.com/not-allowed';
    const rejected = auditFullRosterArtifacts(
      f.snapshot,
      f.inventory as any,
      f.catalog as any,
      f.decisions as any,
      f.runtime as any,
      badAuthority,
    );
    expect(rejected.gaps.some((gap) => gap.code === 'SOURCE_EVIDENCE_OVERLAY_AUTHORITY_MISMATCH')).toBe(true);

    const badReferenceBinding = structuredClone(overlay);
    badReferenceBinding[0].referencePrintedTextSha256 = '0'.repeat(64);
    const badReferenceAudit = auditFullRosterArtifacts(
      f.snapshot,
      f.inventory as any,
      f.catalog as any,
      f.decisions as any,
      f.runtime as any,
      badReferenceBinding,
    );
    expect(
      badReferenceAudit.gaps.some(
        (gap) => gap.code === 'SOURCE_EVIDENCE_OVERLAY_REFERENCE_BINDING_MISMATCH',
      ),
    ).toBe(true);

    const unknown = structuredClone(overlay);
    unknown[0].id = 'master.unknown.skill.s1';
    const unknownAudit = auditFullRosterArtifacts(
      f.snapshot,
      f.inventory as any,
      f.catalog as any,
      f.decisions as any,
      f.runtime as any,
      unknown,
    );
    expect(unknownAudit.gaps.some((gap) => gap.code === 'SOURCE_EVIDENCE_OVERLAY_UNKNOWN_ID')).toBe(true);
  });

  it('accepts hash-locked development-text snapshots and rejects mutated or non-allowlisted snapshots', () => {
    const f = fixture();
    const groundedId = f.staticId;
    const sourceText = f.snapshot.staticSkills[0].printedText;
    f.snapshot.authoringCardIds = [];
    f.snapshot.authoringAbilityCount = 0;
    f.snapshot.staticSkills[0].authoringAbilityIds = [];
    f.inventory.staticSkills[0].semanticNormalization.source = {
      document: 'Fate_Domination-开发版/data_masters.js',
      locator: 'm_fixture.skills[s1]#line=1',
    };
    f.inventory.staticSkills[0].semanticNormalization.abilities = [
      {
        sourceAbilityId: 'fixture.development',
        kind: 'PASSIVE',
        source: {
          document: 'Fate_Domination-开发版/data_masters.js',
          locator: 'm_fixture.skills[s1]#line=1#ability-1',
        },
        axes: f.inventory.staticSkills[0].semanticNormalization.axes,
      },
    ];

    const overlay = [{
      id: groundedId,
      printedText: sourceText,
      referencePrintedTextSha256: sha256(f.snapshot.staticSkills[0].printedText),
      source: {
        authority: 'DEVELOPMENT_TEXT',
        document: 'Fate_Domination-开发版/data_masters.js',
        locator: 'm_fixture.skills[s1]#line=1',
        sourceFileSha256: 'a'.repeat(64),
        sourceText,
        sourceTextSha256: sha256(sourceText),
      },
      abilities: [{ id: 'fixture.development' }],
    }];
    const accepted = auditFullRosterArtifacts(
      f.snapshot,
      f.inventory as any,
      f.catalog as any,
      f.decisions as any,
      f.runtime as any,
      overlay,
    );
    expect(accepted.gaps.some((gap) => gap.code.startsWith('SOURCE_EVIDENCE_OVERLAY_'))).toBe(false);

    const badHash = structuredClone(overlay);
    badHash[0].source.sourceTextSha256 = '0'.repeat(64);
    const badHashAudit = auditFullRosterArtifacts(
      f.snapshot,
      f.inventory as any,
      f.catalog as any,
      f.decisions as any,
      f.runtime as any,
      badHash,
    );
    expect(
      badHashAudit.gaps.some(
        (gap) => gap.code === 'SOURCE_EVIDENCE_OVERLAY_DEVELOPMENT_SNAPSHOT_MISMATCH',
      ),
    ).toBe(true);

    const badDocument = structuredClone(overlay);
    badDocument[0].source.document = 'Fate_Domination-开发版/SkillLib.js';
    const badDocumentAudit = auditFullRosterArtifacts(
      f.snapshot,
      f.inventory as any,
      f.catalog as any,
      f.decisions as any,
      f.runtime as any,
      badDocument,
    );
    expect(
      badDocumentAudit.gaps.some(
        (gap) => gap.code === 'SOURCE_EVIDENCE_OVERLAY_DEVELOPMENT_SNAPSHOT_MISMATCH',
      ),
    ).toBe(true);
  });

  it('renders the audit judgment and independent counts without changing classifications', () => {
    const f = fixture();
    const audit = auditFullRosterArtifacts(f.snapshot, f.inventory as any, f.catalog as any, f.decisions as any, f.runtime as any);
    const markdown = renderAutomationAuditReport(audit);

    expect(markdown).toContain('status=EXACT_AGREEMENT');
    expect(markdown).toContain('staticSkillCount=1');
    expect(markdown).toContain('totalIdentityCount=2');
  });

  it('keeps the checked-in real automation audit exact and independently recomputed', () => {
    const report = readFileSync(
      resolve('docs/reports/2026-09-15-phase3-full-roster-automation-audit.md'),
      'utf8',
    );

    expect(report).toContain('status=EXACT_AGREEMENT');
    expect(report).toContain('staticSkillCount=943');
    expect(report).toContain('dynamicSkillCount=1');
    expect(report).toContain('totalIdentityCount=944');
    expect(report).toContain('authoringCardCount=72');
    expect(report).toContain('authoringAbilityCount=117');
    expect(report).toContain('sourceEvidenceOverlayCount=617');
    expect(report).toContain('sourceEvidenceOverlayAbilityCount=850');
    expect(report).toContain('sourceGroundedCount=689');
    expect(report).toContain('semanticBlockedCount=255');
    expect(report).toContain('gapCount=0');
  });
});
