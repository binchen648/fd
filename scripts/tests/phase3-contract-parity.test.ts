import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildParityInput, combinationSha, fixturePath } from '../phase3-b11-tooling-inputs';
import { compareObservations, parseFixtures, parseParityInput, runParity } from '../phase3-contract-parity';
import { collectCandidateObservations } from '../phase3-contract-parity-worker';
import { gitText, hash, InputError, type Issue } from '../phase3-tooling-common';

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
    expect(result.results).toHaveLength(10);
    for (const row of result.results) {
      expect(row.executedInputSha256).toMatch(/^[0-9A-F]{64}$/);
      expect(row.apiCalls.compiler).toEqual(['compileExecutableCardPack']);
      expect(row.apiCalls.coverage).toEqual(['classifyAbilityForCoverage']);
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
  }, 15_000);
});
