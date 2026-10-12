import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildE09FinalBinding, validateE09FinalBinding, validateE09RawStreams, buildE09IntegrationBinding, validateE09IntegrationBinding, runPreflight } from '../phase3-preflight';
import { hash } from '../phase3-tooling-common';
import { assertSameEvidence, buildSnapshotAtCheckout } from '../phase3-e08-b11-coverage-sync';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const input = buildE09FinalBinding(root);
let directory: string;
const gitProbe = (...args: string[]) => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: 'pipe' });
beforeAll(() => {
  directory = mkdtempSync(join(tmpdir(), 'fd-e09-evidence-negative-'));
  execFileSync('git', ['clone', '--shared', '--no-checkout', '--', root, directory], { stdio: 'pipe' });
  gitProbe('checkout', '--detach', '086a86a24f5cf0991b3743ceb28b34a767252070');
});
afterAll(() => { if (directory) rmSync(directory, { recursive: true, force: true }); });

describe('B11 current transport evidence is distinct from immutable history', () => {
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
  });
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
  const integration = buildE09IntegrationBinding(root);
  const currentHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  beforeAll(() => { gitProbe('checkout', '--detach', currentHead); });
  const commitProbe = () => {
    gitProbe('add', '.'); gitProbe('-c', 'user.name=Evidence Test', '-c', 'user.email=evidence@example.invalid', 'commit', '-m', 'integration drift probe');
  };
  it('validates all six actual Epoch 09 main files, scoped technical artifacts and exact prospective adoption', () => {
    const result = runPreflight(root, integration, currentHead, integration.observedMainSha, hash(JSON.stringify(integration)));
    expect(result.preservedControlFiles).toHaveLength(6);
    expect(result.acceptedRawStreams).toBe(24);
    expect(result.technical.rawStreams).toBe(26);
    expect(result.effectiveRoomIdAdoption).toBe('EXACT_PROSPECTIVE_AUTHORITY_BOUND_NOT_HISTORICAL_PROOF');
    expect(result.status).toBe('BLOCKED'); expect(result.acceptanceGranted).toBe(false); expect(result.creditDelta).toBe(0);
    expect(result.technical.authenticHistoricalCi.exitCode).toBe(1);
    expect(result.technical.issues.map(row => row.code)).toContain('ROOM_ID_REPAIR_AUTHORITY_UNBOUND');
    expect(JSON.parse(readFileSync(join(root, 'scripts/fixtures/phase3-e09-b11-integration-binding.json'), 'utf8'))).toEqual(integration);
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
    expect(() => validateE09IntegrationBinding(root, bad)).toThrow();
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
  });
});
