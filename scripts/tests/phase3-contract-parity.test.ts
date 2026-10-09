import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildParityInput, combinationSha, fixturePath } from '../phase3-b11-tooling-inputs';
import { adapterClosurePaths, compareObservations, parseFixtures, parseParityInput, runParity, verifyAdapterClosure } from '../phase3-contract-parity';
import { collectCandidateObservations } from '../phase3-contract-parity-worker';
import { git, gitText, hash, InputError, type Issue } from '../phase3-tooling-common';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
let input: ReturnType<typeof buildParityInput>;
let fixtures: ReturnType<typeof parseFixtures>;
let result: Awaited<ReturnType<typeof runParity>>;

describe('B11 real API contract parity diagnostics', () => {
  beforeAll(async () => {
    input = buildParityInput(root, gitText(root, ['rev-parse', 'HEAD']));
    fixtures = parseFixtures(JSON.parse(readFileSync(resolve(root, fixturePath), 'utf8')));
    result = await runParity(root, input, combinationSha, hash(JSON.stringify(input)));
  }, 120_000);
  it('executes candidate APIs in an isolated snapshot with canonical input and fixture hashes', () => {
    expect(result.executionMethod).toBe('ISOLATED_SHARED_GIT_CLONE_REAL_API_SUBPROCESS');
    expect(result.executionPerformed).toBe(true);
    expect(result.executionAdapter.commit).toBe(input.executionAdapter[0].commit);
    expect(result.executionAdapter.files.map(file => file.path)).toEqual(adapterClosurePaths);
    expect(result.results).toHaveLength(10);
    for (const row of result.results) {
      expect(row.executedInputSha256).toMatch(/^[0-9A-F]{64}$/);
      expect(row.apiCalls.compiler).toEqual(['compileExecutableCardPack']);
      expect(row.apiCalls.coverage).toEqual(['classifyAbilityForCoverage']);
      expect(row.observations.inventory.evaluationStatus).toBe('NOT_EVALUATED');
      expect(row.observations.coverage.evaluationStatus).toBe('NOT_EVALUATED_EXACT_ELIGIBILITY_RAW_CLASSIFICATION_RETAINED');
    }
    for (const id of ['golden-positive', 'golden-renamed-identities', 'conversion-positive', 'conversion-renamed-identities']) {
      const row = result.results.find(row => row.fixtureId === id)!;
      expect(row.observations.runtime.exactEligible).toBe(true);
      expect(row.observations.compiler.compileOutcome).toBe('ACCEPT');
    }
  });
  it('executes owned malformed and outside-scope fixtures without inheriting positive eligibility', () => {
    for (const row of result.results.filter(row => row.category === 'owned-malformed')) {
      expect(row.observations.runtime.exactEligible).toBe(false);
      expect(row.observations.compiler.compileOutcome).toBe('REJECT');
    }
    for (const row of result.results.filter(row => row.category === 'outside-scope')) expect(row.observations.runtime.exactEligible).toBe(false);
  });
  it('fails readiness when expectations lack independent review or required API observations are unavailable', () => {
    expect(result.status).toBe('FAIL');
    expect(result.issues.map(issue => issue.code)).toContain('EXPECTATIONS_NOT_INDEPENDENTLY_REVIEWED');
    expect(result.issues.some(issue => issue.code === 'REQUIRED_OBSERVATION_NOT_EVALUATED' && issue.path.includes(':inventory.'))).toBe(true);
    expect(result.issues.some(issue => issue.code === 'REQUIRED_OBSERVATION_NOT_EVALUATED' && issue.path.includes(':coverage.'))).toBe(true);
    expect(result.acceptanceGranted).toBe(false);
  });
  it('never exempts missing Conversion runtime ownership when all other observations agree', () => {
    const conversion = fixtures.fixtures.filter((fixture: any) => fixture.family === 'conversion-magic');
    const observed = conversion.map((fixture: any) => ({ fixtureId: fixture.id,
      fixtureSha256: hash(`${JSON.stringify(fixture)}\n`), observations: structuredClone(fixture.expected) }));
    for (const row of observed) row.observations.runtime.routeCandidate = null;
    const issues: Issue[] = []; compareObservations({ fixtures: conversion }, observed, issues);
    expect(issues).toHaveLength(4);
    expect(issues.every(issue => issue.code === 'REQUIRED_OBSERVATION_NOT_EVALUATED' && issue.path.endsWith(':runtime.routeCandidate'))).toBe(true);
    const missing = structuredClone(fixtures); delete missing.fixtures.find((fixture: any) => fixture.family === 'conversion-magic').expected.runtime.routeCandidate;
    expect(() => parseFixtures(missing)).toThrow(InputError);
  });
  it('rejects local drift in both worker and its tooling dependency even with unchanged candidate APIs', () => {
    const temporary = mkdtempSync(resolve(tmpdir(), 'fd-parity-binding-test-'));
    try {
      git(root, ['clone', '--shared', '--no-checkout', '--', root, temporary]);
      git(temporary, ['checkout', input.executionAdapter[0].commit, '--', ...adapterClosurePaths]);
      expect(verifyAdapterClosure(temporary, input.executionAdapter, []).commit).toBe(input.executionAdapter[0].commit);
      for (const path of adapterClosurePaths) {
        const original = readFileSync(resolve(temporary, path));
        writeFileSync(resolve(temporary, path), Buffer.concat([original, Buffer.from('\n// unbound local change\n')]));
        const issues: Issue[] = []; verifyAdapterClosure(temporary, input.executionAdapter, issues);
        expect(issues.some(issue => issue.code === 'EXECUTION_ADAPTER_DRIFT' && issue.path === path)).toBe(true);
        writeFileSync(resolve(temporary, path), original);
      }
      expect(() => verifyAdapterClosure(temporary, input.executionAdapter.slice(0, 1), [])).toThrow(InputError);
    } finally { rmSync(temporary, { recursive: true, force: true }); }
  }, 15_000);
  it('detects a real API disagreement rather than equating hand-filled owner values', async () => {
    const altered = structuredClone(fixtures);
    altered.fixtures = [altered.fixtures.find((fixture: any) => fixture.id === 'golden-positive')];
    altered.fixtures[0].expected.runtime.exactEligible = false;
    const actual = await collectCandidateObservations(root, altered);
    expect(actual[0].observations.runtime.exactEligible).toBe(true);
    const issues: Issue[] = [];
    compareObservations(altered, actual, issues);
    expect(issues.some(issue => issue.code === 'API_EXPECTATION_DISAGREEMENT' && issue.path === 'golden-positive:runtime.exactEligible')).toBe(true);
  }, 30_000);
  it('rejects unsupported/stale/spoofed inputs and incomplete fixture scope', async () => {
    expect(() => parseParityInput({ ...input, schemaVersion: 'legacy-self-reported-parity' })).toThrow(InputError);
    expect(() => parseParityInput({ ...input, observations: { runtime: true, compiler: true } })).toThrow(InputError);
    expect(() => parseFixtures({ ...fixtures, fixtures: fixtures.fixtures.filter((fixture: any) => fixture.category !== 'owned-malformed') })).toThrow(InputError);
    const stale = await runParity(root, { ...input, candidateSha: '0'.repeat(40) }, combinationSha, 'test');
    expect(stale.issues.map(issue => issue.code)).toContain('EXACT_SHA_MISMATCH'); expect(stale.results).toEqual([]);
    expect(stale.executionPerformed).toBe(false); expect(stale.executionMethod).toBe('NOT_EXECUTED_INPUT_REJECTED');
  }, 15_000);
});
