import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  collectAuthoredFrozenIds,
  compileGlobalReadiness,
  identitySetSha256,
  validateDispatchProposal,
  type AcceptedCapabilityEvidence,
  type AcceptedMigrationEvidence,
  type GlobalReadinessDecisionFile,
  type GlobalReadinessInventoryEntry,
} from '../phase3-global-readiness';

const baselineCommit = '1'.repeat(40);
const inventorySha256 = '2'.repeat(64);
const authoringFingerprint = '3'.repeat(64);

function entry(
  id: string,
  classificationRoute:
    | 'READY_GENERIC_EXTENSION'
    | 'SOURCE_EVIDENCE_REQUIRED'
    | 'SPECIAL_HANDLER_CANDIDATE',
): GlobalReadinessInventoryEntry {
  return {
    canonicalAbilityId: id,
    ownerId: id.split('.skill.')[0] ?? id,
    classificationRoute,
    mechanicFamilies: [],
    requiredCapabilities: [],
  };
}

function migrationEvidence(ids: string[], denominator = 3): AcceptedMigrationEvidence {
  return {
    schemaVersion: 'fd-phase3-accepted-migration-evidence-v1',
    baseline: {
      commit: baselineCommit,
      denominator,
      acceptedCount: ids.length,
      authoringFingerprint,
      identitySetSha256: identitySetSha256(ids),
    },
    entries: [],
  };
}

function capabilityEvidence(): AcceptedCapabilityEvidence {
  return {
    schemaVersion: 'fd-phase3-accepted-capability-evidence-v1',
    entries: [],
  };
}

function decisions(): GlobalReadinessDecisionFile {
  return {
    schemaVersion: 'fd-phase3-global-readiness-decisions-v1',
    baselineCommit,
    inventorySha256,
    authoringFingerprint,
    formalLedger: { accepted: 0, denominator: 3 },
    activeReservations: [],
    decisions: [],
    fm09TargetIds: [],
  };
}

describe('phase3 global readiness compiler', () => {
  it('emits one deterministic state for every identity', () => {
    const result = compileGlobalReadiness({
      baselineCommit,
      inventorySha256,
      authoringFingerprint,
      inventory: [
        entry('master.a.skill.s1', 'READY_GENERIC_EXTENSION'),
        entry('master.b.skill.s1', 'SOURCE_EVIDENCE_REQUIRED'),
        entry('servant.c.skill.s1', 'SPECIAL_HANDLER_CANDIDATE'),
      ],
      authoredFrozenIds: [],
      migrationEvidence: migrationEvidence([]),
      capabilityEvidence: capabilityEvidence(),
      decisions: decisions(),
    });

    expect(result.rows.map(({ id, state }) => [id, state])).toEqual([
      ['master.a.skill.s1', 'COMPLETE_CARD_PROBE_REQUIRED'],
      ['master.b.skill.s1', 'SOURCE_EVIDENCE_REQUIRED'],
      ['servant.c.skill.s1', 'SPECIAL_HANDLER_REVIEW'],
    ]);
    expect(result.summary.total).toBe(3);
    expect(result.summary.remaining).toBe(3);
  });

  it('fails closed on duplicate and unknown identities', () => {
    const base = {
      baselineCommit,
      inventorySha256,
      authoringFingerprint,
      authoredFrozenIds: [] as string[],
      migrationEvidence: migrationEvidence([]),
      capabilityEvidence: capabilityEvidence(),
      decisions: decisions(),
    };

    expect(() =>
      compileGlobalReadiness({
        ...base,
        inventory: [entry('master.a.skill.s1', 'READY_GENERIC_EXTENSION'), entry('master.a.skill.s1', 'READY_GENERIC_EXTENSION')],
      }),
    ).toThrow(/duplicate inventory identity/i);

    expect(() =>
      compileGlobalReadiness({
        ...base,
        inventory: [entry('master.a.skill.s1', 'READY_GENERIC_EXTENSION')],
        authoredFrozenIds: ['master.unknown.skill.s1'],
      }),
    ).toThrow(/unknown authored frozen identity/i);
  });

  it('requires the synchronized migration baseline to match authored material exactly', () => {
    expect(() =>
      compileGlobalReadiness({
        baselineCommit,
        inventorySha256,
        authoringFingerprint,
        inventory: [
          entry('master.a.skill.s1', 'READY_GENERIC_EXTENSION'),
          entry('master.b.skill.s1', 'READY_GENERIC_EXTENSION'),
        ],
        authoredFrozenIds: ['master.a.skill.s1'],
        migrationEvidence: migrationEvidence(['master.b.skill.s1'], 2),
        capabilityEvidence: capabilityEvidence(),
        decisions: decisions(),
      }),
    ).toThrow(/accepted baseline identities differ from authored frozen identities/i);
  });

  it('rejects duplicate migration credit and malformed evidence', () => {
    const migration = migrationEvidence(['master.a.skill.s1'], 1);
    migration.entries.push({
      identity: 'master.a.skill.s1',
      candidateCommit: '4'.repeat(40),
      reviewDecision: 'MIGRATION_ACCEPTED',
      reviewUrl: 'https://example.test/review/1',
      synchronizationCommit: '5'.repeat(40),
      creditDelta: 1,
    });

    expect(() =>
      compileGlobalReadiness({
        baselineCommit,
        inventorySha256,
        authoringFingerprint,
        inventory: [entry('master.a.skill.s1', 'READY_GENERIC_EXTENSION')],
        authoredFrozenIds: ['master.a.skill.s1'],
        migrationEvidence: migration,
        capabilityEvidence: capabilityEvidence(),
        decisions: decisions(),
      }),
    ).toThrow(/duplicate migration credit/i);
  });

  it('invalidates stale decisions instead of preserving readiness', () => {
    const decisionFile = decisions();
    decisionFile.authoringFingerprint = '9'.repeat(64);
    decisionFile.decisions.push({
      identity: 'master.a.skill.s1',
      state: 'S_READY_NOW',
      reasonCodes: ['COMPLETE_CARD_PROBE_PASS'],
      sourceSha256: '6'.repeat(64),
      runtimeEvidenceFingerprint: '7'.repeat(64),
      evidenceRefs: ['docs/reports/probe.md'],
      dependencyIds: [],
      completeCardProbe: {
        loaderReportEmpty: true,
        compilerReportEmpty: true,
        transitiveDefinitionsRegistered: true,
        positivePath: true,
        canonicalNegatives: true,
        malformedFailClosed: true,
      },
    });

    expect(() =>
      compileGlobalReadiness({
        baselineCommit,
        inventorySha256,
        authoringFingerprint,
        inventory: [entry('master.a.skill.s1', 'READY_GENERIC_EXTENSION')],
        authoredFrozenIds: [],
        migrationEvidence: migrationEvidence([], 1),
        capabilityEvidence: capabilityEvidence(),
        decisions: decisionFile,
      }),
    ).toThrow(/stale readiness decision file/i);
  });

  it('requires accepted capabilities before a row can become S_READY_NOW', () => {
    const decisionFile = decisions();
    decisionFile.formalLedger.denominator = 1;
    decisionFile.decisions.push({
      identity: 'master.a.skill.s1',
      state: 'S_READY_NOW',
      reasonCodes: ['COMPLETE_CARD_PROBE_PASS'],
      sourceSha256: '6'.repeat(64),
      runtimeEvidenceFingerprint: '7'.repeat(64),
      evidenceRefs: ['docs/reports/probe.md'],
      dependencyIds: [],
      completeCardProbe: {
        loaderReportEmpty: true,
        compilerReportEmpty: true,
        transitiveDefinitionsRegistered: true,
        positivePath: true,
        canonicalNegatives: true,
        malformedFailClosed: true,
      },
    });
    const candidate = entry('master.a.skill.s1', 'READY_GENERIC_EXTENSION');
    candidate.requiredCapabilities = ['CAPABILITY_X'];
    expect(() =>
      compileGlobalReadiness({
        baselineCommit,
        inventorySha256,
        authoringFingerprint,
        inventory: [candidate],
        authoredFrozenIds: [],
        migrationEvidence: migrationEvidence([], 1),
        capabilityEvidence: capabilityEvidence(),
        decisions: decisionFile,
      }),
    ).toThrow(/unaccepted capability dependencies/i);
  });

  it('ranks ready rows before bounded shared gaps without using FM09 membership', () => {
    const decisionFile = decisions();
    decisionFile.formalLedger.denominator = 3;
    decisionFile.fm09TargetIds = ['master.c.skill.s1'];
    decisionFile.decisions = [
      {
        identity: 'master.a.skill.s1',
        state: 'ONE_SHARED_GAP',
        reasonCodes: ['ONE_GAP'],
        sourceSha256: '4'.repeat(64),
        runtimeEvidenceFingerprint: '5'.repeat(64),
        evidenceRefs: ['docs/reports/a.md'],
        dependencyIds: [],
        missingCapabilityId: 'CAP_A',
        closureYield: 3,
      },
      {
        identity: 'master.b.skill.s1',
        state: 'S_READY_NOW',
        reasonCodes: ['PROBE_PASS'],
        sourceSha256: '6'.repeat(64),
        runtimeEvidenceFingerprint: '7'.repeat(64),
        evidenceRefs: ['docs/reports/b.md'],
        dependencyIds: [],
        completeCardProbe: {
          loaderReportEmpty: true,
          compilerReportEmpty: true,
          transitiveDefinitionsRegistered: true,
          positivePath: true,
          canonicalNegatives: true,
          malformedFailClosed: true,
        },
      },
    ];
    const result = compileGlobalReadiness({
      baselineCommit,
      inventorySha256,
      authoringFingerprint,
      inventory: [
        entry('master.a.skill.s1', 'READY_GENERIC_EXTENSION'),
        entry('master.b.skill.s1', 'READY_GENERIC_EXTENSION'),
        entry('master.c.skill.s1', 'READY_GENERIC_EXTENSION'),
      ],
      authoredFrozenIds: [],
      migrationEvidence: migrationEvidence([]),
      capabilityEvidence: capabilityEvidence(),
      decisions: decisionFile,
    });
    expect(result.rankedCandidates).toEqual([
      'master.b.skill.s1',
      'master.a.skill.s1',
      'master.c.skill.s1',
    ]);
  });

  it('rejects incomplete S-ready probes and additional gaps hidden behind ONE_SHARED_GAP', () => {
    const ready = decisions();
    ready.formalLedger.denominator = 1;
    ready.decisions.push({
      identity: 'master.a.skill.s1',
      state: 'S_READY_NOW',
      reasonCodes: ['PROBE_PASS'],
      sourceSha256: '4'.repeat(64),
      runtimeEvidenceFingerprint: '5'.repeat(64),
      evidenceRefs: ['docs/reports/a.md'],
      dependencyIds: [],
    });
    expect(() => compileGlobalReadiness({
      baselineCommit,
      inventorySha256,
      authoringFingerprint,
      inventory: [entry('master.a.skill.s1', 'READY_GENERIC_EXTENSION')],
      authoredFrozenIds: [],
      migrationEvidence: migrationEvidence([], 1),
      capabilityEvidence: capabilityEvidence(),
      decisions: ready,
    })).toThrow(/complete fail-closed card probe/i);

    const oneGap = decisions();
    oneGap.formalLedger.denominator = 1;
    oneGap.decisions.push({
      identity: 'master.a.skill.s1',
      state: 'ONE_SHARED_GAP',
      reasonCodes: ['ONE_GAP'],
      sourceSha256: '6'.repeat(64),
      runtimeEvidenceFingerprint: '7'.repeat(64),
      evidenceRefs: ['docs/reports/a.md'],
      dependencyIds: [],
      missingCapabilityId: 'CAP_A',
      closureYield: 1,
    });
    const candidate = entry('master.a.skill.s1', 'READY_GENERIC_EXTENSION');
    candidate.requiredCapabilities = ['CAP_A', 'CAP_B'];
    expect(() => compileGlobalReadiness({
      baselineCommit,
      inventorySha256,
      authoringFingerprint,
      inventory: [candidate],
      authoredFrozenIds: [],
      migrationEvidence: migrationEvidence([], 1),
      capabilityEvidence: capabilityEvidence(),
      decisions: oneGap,
    })).toThrow(/additional unaccepted capabilities/i);
  });

  it('rejects FM09 bulk tasks, unsafe batches, and inherited acceptance', () => {
    const fm09 = ['master.a.skill.s1', 'master.b.skill.s1'];
    expect(() => validateDispatchProposal({ taskId: 'complete-fm09', identities: ['master.a.skill.s1'], fm09TargetIds: fm09 })).toThrow(/complete-FM09/i);
    expect(() => validateDispatchProposal({ taskId: 'P3-S', identities: fm09, fm09TargetIds: fm09 })).toThrow(/bulk dispatch/i);
    expect(() => validateDispatchProposal({
      taskId: 'P3-S',
      identities: ['master.fujino.skill.s2', 'master.fujino.skill.s3'],
      fm09TargetIds: fm09,
      sameOwnerInseparableException: {
        documentedEvidenceRef: 'docs/reports/exception.md',
        ownerIds: {
          'master.fujino.skill.s2': 'master.fujino',
          'master.fujino.skill.s3': 'master.fujino',
        },
      },
    })).toThrow(/cannot absorb/i);
    expect(() => validateDispatchProposal({
      taskId: 'P3-S',
      identities: ['master.shiki-ryougi.skill.s2'],
      fm09TargetIds: fm09,
      inheritedAcceptance: [{ identity: 'master.shiki-ryougi.skill.s2', fromIdentity: 'master.shiki-ryougi.skill.s3' }],
    })).toThrow(/cannot inherit/i);
  });

  it('collects only canonical card IDs from authoring archives deterministically', () => {
    const root = mkdtempSync(join(tmpdir(), 'fd-global-readiness-'));
    try {
      mkdirSync(join(root, 'data/authoring/masters'), { recursive: true });
      mkdirSync(join(root, 'data/authoring/servants'), { recursive: true });
      writeFileSync(
        join(root, 'data/authoring/masters/master.fixture.json'),
        JSON.stringify({
          id: 'master.fixture',
          cards: [
            { id: 'master.a.skill.s1', abilities: [{ id: 'display-only-id' }] },
            { id: 'not-frozen' },
          ],
        }),
      );
      writeFileSync(
        join(root, 'data/authoring/servants/servant.fixture.json'),
        JSON.stringify({ id: 'servant.fixture', cards: [{ id: 'servant.c.skill.s1' }] }),
      );

      const first = collectAuthoredFrozenIds(
        root,
        new Set(['master.a.skill.s1', 'servant.c.skill.s1']),
      );
      const second = collectAuthoredFrozenIds(
        root,
        new Set(['master.a.skill.s1', 'servant.c.skill.s1']),
      );
      expect(first.ids).toEqual(['master.a.skill.s1', 'servant.c.skill.s1']);
      expect(first.fileCount).toBe(2);
      expect(first.fingerprint).toBe(second.fingerprint);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects duplicate canonical cards across authoring archives', () => {
    const root = mkdtempSync(join(tmpdir(), 'fd-global-readiness-'));
    try {
      mkdirSync(join(root, 'data/authoring/masters'), { recursive: true });
      mkdirSync(join(root, 'data/authoring/servants'), { recursive: true });
      const archive = JSON.stringify({ cards: [{ id: 'master.a.skill.s1' }] });
      writeFileSync(join(root, 'data/authoring/masters/a.json'), archive);
      writeFileSync(join(root, 'data/authoring/servants/b.json'), archive);
      expect(() =>
        collectAuthoredFrozenIds(root, new Set(['master.a.skill.s1'])),
      ).toThrow(/duplicate authored frozen identity/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
