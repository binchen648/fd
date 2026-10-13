import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateAccounting, validateChecks, validateTestLog } from '../phase3-e09-b11-post-merge-sync';

const observations = JSON.parse(readFileSync(resolve('artifacts/phase3-e09-b11-post-merge-github-observations.json'), 'utf8'));
const universe = Array.from({ length: 944 }, (_, index) => `identity-${index}`);
const ids = universe.slice(0, 111);

describe('B11 immutable observed-main post-merge evidence', () => {
  it('accepts the frozen accounting with no new identities', () => {
    expect(() => validateAccounting(ids, universe)).not.toThrow();
  });
  it('rejects duplicate accepted identities', () => {
    expect(() => validateAccounting([...ids.slice(0, 110), ids[0]!], universe)).toThrow();
  });
  it('rejects unbound identities and denominator drift', () => {
    expect(() => validateAccounting([...ids.slice(0, 110), 'recovery-only'], universe)).toThrow();
    expect(() => validateAccounting(ids, universe.slice(1))).toThrow();
  });
  it('requires all four successful checks at the exact immutable main', () => {
    expect(() => validateChecks(observations.runs)).not.toThrow();
    expect(() => validateChecks(observations.runs.slice(1))).toThrow();
    const changed = structuredClone(observations.runs);
    changed[0].headSha = 'different-main';
    expect(() => validateChecks(changed)).toThrow();
  });
  it('rejects failed checks instead of inheriting another successful run', () => {
    const changed = structuredClone(observations.runs);
    changed[0].conclusion = 'failure';
    expect(() => validateChecks(changed)).toThrow();
  });
  it('parses the original ANSI log without hiding skipped tests', () => {
    expect(() => validateTestLog(observations.testLog)).not.toThrow();
    expect(() => validateTestLog('Test Files 194 passed (194)\nTests 1607 passed (1607)')).toThrow();
  });
});
