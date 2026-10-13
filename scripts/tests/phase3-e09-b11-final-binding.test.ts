import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setImmediate as yieldToEventLoop } from 'node:timers/promises';
import { buildE09FinalBinding, validateE09FinalBinding, validateE09RawStreams, buildE09IntegrationBinding, validateE09IntegrationBinding, runPreflight,
  buildE09ClosureProducerBinding, buildE09IntegrationReviewReference, validateE09IntegrationClosure, type E09ClosureInputs } from '../phase3-preflight';
import { hash } from '../phase3-tooling-common';
import { assertSameEvidence, buildSnapshotAtCheckout } from '../phase3-e08-b11-coverage-sync';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
let input: ReturnType<typeof buildE09FinalBinding>;
let directory: string;
const gitProbe = (...args: string[]) => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: 'pipe' });
const prepareGitFixture = (name: string, prepare: () => void) => async () => {
  const started = performance.now();
  try { prepare(); }
  finally {
    console.info('FD_EVIDENCE_FIXTURE_TIMING', JSON.stringify({ file: 'phase3-e09-b11-final-binding.test.ts', name, durationMs: Math.round(performance.now() - started) }));
    await yieldToEventLoop();
  }
};
afterEach(async () => { await yieldToEventLoop(); });
beforeAll(prepareGitFixture('shared historical objects and transport binding', () => {
  input = buildE09FinalBinding(root);
  directory = mkdtempSync(join(tmpdir(), 'fd-e09-evidence-negative-'));
  execFileSync('git', ['clone', '--shared', '--no-checkout', '--', root, directory], { stdio: 'pipe' });
  gitProbe('checkout', '--detach', '086a86a24f5cf0991b3743ceb28b34a767252070');
}), 30_000);

describe('candidate -> independent RA -> G -> synchronization -> actual final HEAD closure', () => {
  let producer: ReturnType<typeof buildE09ClosureProducerBinding>;
  let producerHead: string;
  let current: E09ClosureInputs;
  let positive: ReturnType<typeof validateE09IntegrationClosure>;
  let historical: ReturnType<typeof validateE09IntegrationClosure>;
  let reviewPacketHash: string;
  let review: ReturnType<typeof buildE09IntegrationReviewReference>;
  let g: string;
  const write = (path: string, value: unknown) => writeFileSync(join(directory, path), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
  const commit = (message: string, empty = false) => {
    gitProbe('add', '-f', 'artifacts/phase3-e09-b11-integration-evidence-binding.json', 'docs/reviews/phase3', 'docs/agents/manifests/governance', 'docs/reports/2026-10-12-p3-e09-b11-promotion-attestation.md');
    gitProbe('-c', 'user.name=Test-only evidence fixture', '-c', 'user.email=fixture@example.invalid', 'commit', ...(empty ? ['--allow-empty'] : []), '-m', message);
    return gitProbe('rev-parse', 'HEAD').trim();
  };
  beforeAll(prepareGitFixture('frozen producer and contract binding', () => {
    producer = buildE09ClosureProducerBinding(root, true);
    gitProbe('checkout', '--detach', execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim());
    write('artifacts/phase3-e09-b11-integration-evidence-binding.json', { taskId: producer.taskId, producerBinding: producer, testOnlySyntheticProof: true });
    producerHead = commit('test-only frozen producer');
  }), 30_000);
  beforeAll(prepareGitFixture('independent exact review fixture', () => {
    const reviewPath = 'docs/reviews/phase3/DIFFERENT-NAME-closure-proof.json';
    reviewPacketHash = hash(readFileSync(join(directory, 'artifacts/phase3-e09-b11-integration-evidence-binding.json')));
    write(reviewPath, { schemaVersion: 'fd-phase3-reviewer-a-integration-closure-review-v1', taskId: producer.taskId,
      controlEpoch: producer.controlEpoch, reviewer: 'Reviewer A', candidateSha: producerHead, reviewedSha: producerHead,
      boundMainSha: producer.technicalBinding.observedMainSha, runtimeCandidateSha: producer.technicalBinding.technical.candidateSha,
      acceptedScope: 'EXACT_INTEGRATION_CLOSURE_REFERENCE_CONTRACT_AND_FINAL_ASSEMBLY_EVIDENCE_ONLY', finalVerdict: 'PASS', conclusion: 'REVIEW_ACCEPTED',
      boundPacket: { path: 'artifacts/phase3-e09-b11-integration-evidence-binding.json', sha256: reviewPacketHash }, testOnlySyntheticProof: true });
    const reviewCommit = commit('test-only independent differently named RA artifact');
    review = buildE09IntegrationReviewReference(directory, reviewCommit, reviewPath);
  }), 30_000);
  beforeAll(prepareGitFixture('three exact governance outputs', () => {
    write('docs/reviews/phase3/P3-E09-B11-promotion-attestation.json', { schemaVersion: 'fd-phase3-review-attestation-v1', taskId: 'P3-E09-I-B11-FINAL-PROMOTION', reviewer: 'github:test-fixture', reviewThread: 'https://github.com/binchen648/fd/pull/0#issuecomment-0', candidateSha: producerHead, conclusion: 'REVIEW_ACCEPTED', testOnlySyntheticProof: true });
    write('docs/agents/manifests/governance/P3-E09-B11-PROMOTION-GOVERNANCE-INPUTS.json', {
      schemaVersion: 'fd-p3-promotion-governance-inputs-v1', taskId: 'P3-E09-B11-PROMOTION-ATTESTATION-BRIDGE', controlEpoch: producer.controlEpoch, effectiveMain: producer.technicalBinding.observedMainSha,
      newIntegrationRa: { ...review, candidateSha: producerHead }, integrationPacket: { sha256: reviewPacketHash }, testOnlySyntheticProof: true });
    write('docs/reports/2026-10-12-p3-e09-b11-promotion-attestation.md', '# Test-only synthetic G proof; never published\n');
    g = commit('test-only three G outputs');
  }), 30_000);
  beforeAll(prepareGitFixture('synchronization and actual final HEAD', () => {
    const synchronizationSha = commit('test-only synchronization', true);
    const finalHeadSha = commit('test-only final HEAD', true);
    current = { stage: 'ASSEMBLED', producerCandidateSha: producerHead, reviewReferences: [review], synchronizationSha, finalHeadSha,
      governanceReferences: ['docs/reviews/phase3/P3-E09-B11-promotion-attestation.json', 'docs/agents/manifests/governance/P3-E09-B11-PROMOTION-GOVERNANCE-INPUTS.json', 'docs/reports/2026-10-12-p3-e09-b11-promotion-attestation.md'].map(path => ({ commit: g, path, sha256: hash(gitProbe('show', `${g}:${path}`)) })) };
  }), 30_000);
  beforeAll(prepareGitFixture('complete new candidate RA G final proof', () => { positive = validateE09IntegrationClosure(directory, producer, current); }), 60_000);
  beforeAll(prepareGitFixture('complete real rejected historical proof', () => { historical = validateE09IntegrationClosure(root, producer, { stage: 'PRODUCER', producerCandidateSha: null, reviewReferences: [], governanceReferences: [], synchronizationSha: null, finalHeadSha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim() }); }), 60_000);
  it('validates the real formerly rejected RA and G/synchronization/final historical assembly without accepting changed code', () => {
    const result = historical;
    expect(result.historicalAssembly.finalHeadSha).toBe('9dbeef07d6bf8a9b956d2291e768b5369f09803b');
    expect(result.currentReviewStatus).toBe('PENDING_NEW_INDEPENDENT_REVIEW');
    expect(result.acceptanceGranted).toBe(false);
    expect(JSON.parse(readFileSync(join(root, 'scripts/fixtures/phase3-e09-b11-integration-binding.json'), 'utf8'))).toEqual(producer);
  });
  it('validates the full differently named next-candidate review and actual post-G final HEAD, not only the producer', () => {
    expect(positive.currentAssembly?.finalHeadSha).toBe(current.finalHeadSha);
    expect(positive.currentReviewStatus).toBe('EXACT_CURRENT_REFERENCE_BOUND_NOT_PROMOTION');
    expect(positive.promotionAllowed).toBe(false);
  });
  it.each(['missing-review', 'duplicate-review', 'forged-pass', 'bad-review-hash', 'wrong-candidate', 'unknown-schema', 'broad-scope', 'stale-main', 'old-G', 'missing-G', 'duplicate-G', 'bad-G-hash', 'wrong-sync', 'wrong-head', 'unrelated-review'])('rejects %s in the assembled closure', mode => {
    const bad: any = structuredClone(current);
    const source: any = structuredClone(producer);
    if (mode === 'missing-review') bad.reviewReferences = [];
    if (mode === 'duplicate-review') bad.reviewReferences.push(bad.reviewReferences[0]);
    if (mode === 'forged-pass') bad.reviewReferences[0].verdict = 'ACCEPTED';
    if (mode === 'bad-review-hash') bad.reviewReferences[0].sha256 = '0'.repeat(64);
    if (mode === 'wrong-candidate') bad.reviewReferences[0].reviewedCandidateSha = producer.frozenAssemblySha;
    if (mode === 'unknown-schema') bad.reviewReferences[0].schemaVersion = 'invented-review';
    if (mode === 'broad-scope') bad.reviewReferences[0].acceptedScope = 'FULL_ROSTER';
    if (mode === 'stale-main') source.technicalBinding.observedMainSha = source.technicalBinding.previousMainSha;
    if (mode === 'old-G') bad.governanceReferences = producer.historicalGovernance;
    if (mode === 'missing-G') bad.governanceReferences.pop();
    if (mode === 'duplicate-G') bad.governanceReferences.push(bad.governanceReferences[0]);
    if (mode === 'bad-G-hash') bad.governanceReferences[0].sha256 = '0'.repeat(64);
    if (mode === 'wrong-sync') bad.synchronizationSha = producerHead;
    if (mode === 'wrong-head') bad.finalHeadSha = bad.synchronizationSha;
    if (mode === 'unrelated-review') bad.reviewReferences = [producer.historicalReviews[0]];
    expect(() => validateE09IntegrationClosure(directory, source, bad)).toThrow();
  }, 30_000);
  it('rejects actual final review blob tampering even if the original source hash remains valid', () => {
    const path = join(directory, current.reviewReferences[0].path); const bytes = readFileSync(path);
    try { writeFileSync(path, Buffer.concat([bytes, Buffer.from('\n// forged\n')])); expect(() => validateE09IntegrationClosure(directory, producer, current)).toThrow('Dirty review artifact'); }
    finally { writeFileSync(path, bytes); }
  }, 30_000);
  it.each(['runtime', 'unknown'])('rejects committed final %s changes rather than accepting a reviewed ancestor', mode => {
    try {
      const path = mode === 'runtime' ? 'packages/rules/src/match-room.ts' : 'docs/reviews/phase3/UNBOUND-EXTRA.json';
      write(path, '// unapproved final delta\n'); gitProbe('add', path);
      gitProbe('-c', 'user.name=Test-only fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'invalid assembled delta');
      const bad = { ...current, finalHeadSha: gitProbe('rev-parse', 'HEAD').trim() };
      expect(() => validateE09IntegrationClosure(directory, producer, bad)).toThrow('Unauthorized post-candidate delta');
    } finally { gitProbe('checkout', '--detach', current.finalHeadSha); }
  }, 30_000);
});
afterAll(() => { if (directory) rmSync(directory, { recursive: true, force: true }); });

describe('B11 current transport evidence is distinct from immutable history', () => {
  beforeAll(prepareGitFixture('restore exact transport fixture', () => { gitProbe('checkout', '--detach', '086a86a24f5cf0991b3743ceb28b34a767252070'); }), 30_000);
  it('recomputes current coverage separately without rewriting the historical artifact or classifier', async () => {
    const result = await buildSnapshotAtCheckout(root, input.candidateSha);
    const bytes = readFileSync(join(root, 'artifacts/phase3-e09-b11-final-coverage.json'));
    assertSameEvidence(JSON.parse(bytes.toString()), result.coverage);
    expect(result.sync.candidateLocalRouting.after).toEqual({ new: 23, legacyResolve: 144, legacyExecute: 3, dual: 0, notClassifiable: 111 });
    expect(result.sync.formalCredit).toEqual({ mainCoverageCreditDelta: 0, migrationCreditDelta: 0, denominatorDelta: 0, promotedOnMain: false });
    for (const [cardId, abilityId] of [['master.irisviel.skill.conversion-magic', 'conversion-magic.preparation'], ['servant.kintoki.skill.sc-kintoki-3', 'sc-kintoki-3.golden-eater']]) {
      const rows = result.coverage.semanticAxes.filter(row => row.cardId === cardId && row.abilityId === abilityId);
      expect(rows).toHaveLength(1); expect(rows[0].runtimeRoute).toBe('NEW_RUNTIME_SEMANTIC_ROUTED');
    }
  }, 30_000);
  it('binds scoped RB, all raw bytes, current provider and later transport authorization without inheriting CI PASS', () => {
    const result = validateE09FinalBinding(directory, input);
    expect(result.rawStreams).toBe(26);
    expect(result.review.verdict).toBe('PASS');
    expect(result.authenticHistoricalCi.exitCode).toBe(1);
    expect(result.status).toBe('BLOCKED');
    expect(result.issues.map(row => row.code)).toContain('ROOM_ID_REPAIR_AUTHORITY_UNBOUND');
    expect(result.acceptanceGranted).toBe(false);
    expect(result.creditDelta).toBe(0);
    const fixture = JSON.parse(readFileSync(join(root, 'scripts/fixtures/phase3-e09-b11-final-binding.json'), 'utf8'));
    expect(fixture).toEqual(input);
  });
  it.each(['missing-authorization', 'forged-authorization', 'unknown-schema-key', 'stale-candidate', 'stale-review', 'source-object', 'historical-pass'])('rejects %s even if the rest of the record is unchanged', mode => {
    const bad: any = structuredClone(input);
    if (mode === 'missing-authorization') bad.references.splice(1, 1);
    if (mode === 'forged-authorization') bad.references[1].sha256 = '0'.repeat(64);
    if (mode === 'unknown-schema-key') bad.allowlist = ['**'];
    if (mode === 'stale-candidate') bad.candidateSha = '9a4f4c6ee2723eb7f546341f3c18a1f0a29c3bc1';
    if (mode === 'stale-review') bad.references[0].commit = 'f2da26c56cc8c5e2b8ffe35d9802051a2e3d7540';
    if (mode === 'source-object') bad.sourceObjects.packages = '0'.repeat(40);
    if (mode === 'historical-pass') bad.historicalAcceptanceInherited = true;
    expect(() => validateE09FinalBinding(directory, bad)).toThrow();
  });
  it('rejects tampered/missing raw payload without interpreting a preserved failure as success', () => {
    const bytes = Buffer.from('actual failure\n');
    const row = { encoding: 'base64', raw: bytes.toString('base64'), bytes: bytes.length, sha256: hash(bytes).toLowerCase(), exitCode: 1 };
    expect(validateE09RawStreams(row)).toBe(1);
    expect(() => validateE09RawStreams({ ...row, raw: Buffer.from('PASS\n').toString('base64') })).toThrow('Tampered raw receipt');
    expect(() => validateE09RawStreams({ ...row, bytes: row.bytes + 1 })).toThrow();
    expect(validateE09RawStreams({ ...row, raw: undefined })).toBe(0);
  });
  it('rejects current dirty source while the historical contract remains pinned', () => {
    const path = join(directory, 'packages/rules/src/match-room.ts');
    const original = readFileSync(path);
    try {
      writeFileSync(path, Buffer.concat([original, Buffer.from('\n// drift\n')]));
      expect(() => validateE09FinalBinding(directory, input)).toThrow('Dirty current provider');
    } finally { writeFileSync(path, original); }
  });
  it('rejects committed unknown paths without expanding the historical allowlist', () => {
    mkdirSync(join(directory, 'unknown'), { recursive: true }); writeFileSync(join(directory, 'unknown/change.txt'), 'not authorized\n');
    gitProbe('add', 'unknown/change.txt'); gitProbe('-c', 'user.name=Evidence Test', '-c', 'user.email=evidence@example.invalid', 'commit', '-m', 'unknown delta probe');
    expect(() => validateE09FinalBinding(directory, input)).toThrow('Unexpected evidence delta');
  });
});

describe('integration binds preserved main control without broadening historical acceptance', () => {
  let integration: ReturnType<typeof buildE09IntegrationBinding>;
  const currentHead = 'a09fe2d62ad7be07fdfaa9edfef2ab2803a0e2da';
  beforeAll(prepareGitFixture('immutable integration contract and checkout', () => { integration = buildE09IntegrationBinding(root); gitProbe('checkout', '--detach', currentHead); }), 30_000);
  let checked: ReturnType<typeof runPreflight>;
  beforeAll(prepareGitFixture('complete preserved main and technical preflight', () => { checked = runPreflight(directory, integration, currentHead, integration.observedMainSha, hash(JSON.stringify(integration))); }), 60_000);
  const commitProbe = () => {
    gitProbe('add', '.'); gitProbe('-c', 'user.name=Evidence Test', '-c', 'user.email=evidence@example.invalid', 'commit', '-m', 'integration drift probe');
  };
  it('validates all six actual Epoch 09 main files, scoped technical artifacts and exact prospective adoption', () => {
    const result = checked;
    expect(result.preservedControlFiles).toHaveLength(6);
    expect(result.acceptedRawStreams).toBe(24);
    expect(result.technical.rawStreams).toBe(26);
    expect(result.effectiveRoomIdAdoption).toBe('EXACT_PROSPECTIVE_AUTHORITY_BOUND_NOT_HISTORICAL_PROOF');
    expect(result.status).toBe('BLOCKED'); expect(result.acceptanceGranted).toBe(false); expect(result.creditDelta).toBe(0);
    expect(result.technical.authenticHistoricalCi.exitCode).toBe(1);
    expect(result.technical.issues.map(row => row.code)).toContain('ROOM_ID_REPAIR_AUTHORITY_UNBOUND');
    expect(JSON.parse(readFileSync(join(root, 'scripts/fixtures/phase3-e09-b11-integration-binding.json'), 'utf8')).technicalBinding).toEqual(integration);
  });
  it.each(['main', 'candidate', 'control-blob', 'control-hash', 'review', 'adoption', 'scope', 'unknown-key', 'promotion-path', 'promotion-source'])('rejects forged/stale %s binding', mode => {
    const bad: any = structuredClone(integration);
    if (mode === 'main') bad.observedMainSha = integration.previousMainSha;
    if (mode === 'candidate') bad.technical.candidateSha = integration.technicalCarrierSha;
    if (mode === 'control-blob') bad.preservedControlFiles[0].gitBlob = '0'.repeat(40);
    if (mode === 'control-hash') bad.preservedControlFiles[0].sha256 = '0'.repeat(64);
    if (mode === 'review') bad.finalReviewerA.commit = integration.technicalCarrierSha;
    if (mode === 'adoption') bad.preservedControlFiles[3].commit = integration.previousMainSha;
    if (mode === 'scope') bad.acceptanceGranted = true;
    if (mode === 'unknown-key') bad.controlDirectoryWaiver = true;
    if (mode === 'promotion-path') bad.promotionEvidence = [{ commit: currentHead, path: 'docs/reviews/phase3/arbitrary.json', sha256: '0'.repeat(64) }];
    if (mode === 'promotion-source') bad.promotionEvidence = [{ commit: integration.technicalCarrierSha, path: 'docs/reviews/phase3/P3-E09-B11-promotion-attestation.json', sha256: '0'.repeat(64) }];
    expect(() => validateE09IntegrationBinding(directory, bad)).toThrow();
  });
  it('rejects actual dirty runtime rather than trusting claimed source equivalence', () => {
    const path = join(directory, 'packages/rules/src/match-room.ts'); const original = readFileSync(path);
    try {
      writeFileSync(path, Buffer.concat([original, Buffer.from('\n// dirty provider\n')]));
      expect(() => validateE09IntegrationBinding(directory, integration)).toThrow('Dirty current provider');
    } finally { writeFileSync(path, original); }
  });
  it('rejects a committed tampered main control blob', () => {
    const path = join(directory, integration.preservedControlFiles[0].path);
    try {
      writeFileSync(path, Buffer.concat([readFileSync(path), Buffer.from('\nunauthorized\n')])); commitProbe();
      expect(() => validateE09IntegrationBinding(directory, integration)).toThrow('Preserved main blob drift');
    } finally { gitProbe('checkout', '--detach', currentHead); }
  });
  it('rejects new control files even under the existing governance directory', () => {
    try {
      writeFileSync(join(directory, 'docs/agents/manifests/governance/UNKNOWN.json'), '{}\n'); commitProbe();
      expect(() => validateE09IntegrationBinding(directory, integration)).toThrow('Unknown integration delta');
    } finally { gitProbe('checkout', '--detach', currentHead); }
  });
  it('rejects committed runtime drift rather than treating candidate ancestry as source equivalence', () => {
    try {
      const path = join(directory, 'packages/rules/src/match-room.ts');
      writeFileSync(path, Buffer.concat([readFileSync(path), Buffer.from('\n// committed drift\n')])); commitProbe();
      expect(() => validateE09IntegrationBinding(directory, integration)).toThrow('Unknown integration delta');
    } finally { gitProbe('checkout', '--detach', currentHead); }
  });
  it('rejects a rewritten accepted Reviewer A artifact instead of inheriting its old PASS', () => {
    try {
      const path = join(directory, integration.finalReviewerA.path);
      writeFileSync(path, JSON.stringify({ finalVerdict: 'PASS', acceptedScope: 'WHOLE_BRANCH' })); commitProbe();
      expect(() => validateE09IntegrationBinding(directory, integration)).toThrow('Accepted technical artifact drift');
    } finally { gitProbe('checkout', '--detach', currentHead); }
  }, 30_000);
});
