import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { git, gitText, hash } from '../phase3-tooling-common';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const main = 'a42b5e1c517141b90f3407773958b0d8afe63264';
const candidate = '540abe6c8cadc015fe7ad4030673091405a61063';
const reviewCommit = '9d2854d241bfdb5eefc426b3ec854b802062e4ca';
const reviewPath = 'docs/reviews/phase3/P3-EFP-K03-B-540abe6-reviewer-b.json';
const packetPath = 'artifacts/phase3-efp-k03-static-reward-guard.json';
const reviewHash = '0214eccc3f2b5701752d2461085bb10c01c02ac7d35a2bcc0f3209726bfad119';
const scope = 'CURRENT_MAIN_STATIC_REWARD_COMPILED_ENVELOPE_GUARD: activation/lifecycle/limit/visibility only';
const objects = {
  'packages/rules/src': '7e2086aef86ffde917bd6b12e994b2360a2e8a55',
  'packages/rules/tests': '5c0d26f74648c16fe359fb9235c12c5dacefe08a',
};
const files = [
  { path: 'packages/rules/src/ability/loader.ts', baseBlob: 'e3ce053f95f6b635b5c2f3fc8ae08d3d360f63e5',
    candidateBlob: 'bbaf57a4e23b2a038d45745826a987484eb332fd', sha256: '74788600fd72fb6c7d63727584d2e2ef1b010b5ffd8adcc2921bc4e51fad81cc' },
  { path: 'packages/rules/tests/fb2-34-combat-reward-distribution.test.ts', baseBlob: 'be3c2dcb6ba6ee6f19ae96d430aa97e72749be9e',
    candidateBlob: '7f91ec3762daec7ce7ed414985e75fbbfa4f9691', sha256: '30019f597d94890dd0bf7541c9c3ac02ca384bd227a81d89a0c53374bd50386c' },
];
const binding = { candidate, reviewCommit, reviewPath, reviewHash, objects, files };
let fixture: string;
let outerFixture: string;
beforeAll(() => {
  fixture = mkdtempSync(join(tmpdir(), 'fd-k03-frozen-review-'));
  git(root, ['clone', '--shared', '--no-checkout', '--', root, fixture]);
  git(fixture, ['checkout', '--detach', reviewCommit]);
  outerFixture = mkdtempSync(join(tmpdir(), 'fd-k03-different-outer-'));
  git(root, ['clone', '--shared', '--no-checkout', '--', root, outerFixture]);
  git(outerFixture, ['checkout', '--detach', main]);
}, 30_000);
afterAll(() => {
  if (fixture) rmSync(fixture, { recursive: true, force: true });
  if (outerFixture) rmSync(outerFixture, { recursive: true, force: true });
});

// This test-only binding reuses RB solely for byte-identical K03 source, never promotion.
function checkBinding(input: typeof binding, context: string, observed = {
  objects: Object.fromEntries(Object.keys(objects).map(path => [path, gitText(context, ['rev-parse', `HEAD:${path}`])])),
  files: files.map(file => ({ ...file, sha256: hash(readFileSync(resolve(context, file.path))).toLowerCase() })),
}) {
  expect(input).toEqual(binding);
  for (const sha of [candidate, reviewCommit]) git(context, ['merge-base', '--is-ancestor', sha, 'HEAD']);
  expect(gitText(context, ['rev-parse', `${reviewCommit}^`])).toBe(candidate);
  expect(gitText(context, ['diff', '--name-only', candidate, reviewCommit])).toBe(reviewPath);
  const reviewBytes = git(context, ['show', `${input.reviewCommit}:${input.reviewPath}`]);
  expect(hash(reviewBytes).toLowerCase()).toBe(input.reviewHash);
  expect(git(context, ['show', `HEAD:${reviewPath}`])).toEqual(reviewBytes);
  const review = JSON.parse(reviewBytes.toString());
  expect(review).toMatchObject({ schemaVersion: 'fd-independent-scoped-review-v1', taskId: 'P3-EFP-K03-B',
    reviewedSha: candidate, reviewerIdentity: 'Codex Reviewer B', verdict: 'PASS', scope,
    overallReadiness: 'BLOCKED', grants: { promotion: false, main: false, creditDelta: 0 } });
  const packetBytes = git(context, ['show', `${candidate}:${packetPath}`]);
  expect(hash(packetBytes).toLowerCase()).toBe(review.packet.sha256);
  expect(git(context, ['show', `HEAD:${packetPath}`])).toEqual(packetBytes);
  const packet = JSON.parse(packetBytes.toString());
  expect(packet.sourceBinding.files).toEqual(input.files);
  expect(packet.testedImplementationSha).toBe(review.testedImplementationSha);
  for (const [path, object] of Object.entries(input.objects)) {
    for (const sha of [candidate, reviewCommit, review.testedImplementationSha]) {
      expect(gitText(context, ['rev-parse', `${sha}:${path}`])).toBe(object);
    }
    expect(observed.objects[path]).toBe(object);
  }
  expect(observed.files).toEqual(input.files);
  expect(gitText(context, ['diff', 'HEAD', '--', ...Object.keys(objects), reviewPath, packetPath])).toBe('');
  expect(gitText(context, ['ls-files', '--others', '--exclude-standard', '--', ...Object.keys(objects)])).toBe('');
  for (const file of input.files) {
    expect(gitText(context, ['rev-parse', `${main}:${file.path}`])).toBe(file.baseBlob);
    expect(gitText(context, ['rev-parse', `${candidate}:${file.path}`])).toBe(file.candidateBlob);
    expect(hash(git(context, ['show', `${candidate}:${file.path}`])).toLowerCase()).toBe(file.sha256);
  }
  expect(gitText(context, ['diff', '--name-only', main, candidate, '--', ...Object.keys(objects)]).split('\n')).toEqual(input.files.map(file => file.path));
  expect(gitText(context, ['rev-parse', `${main}:packages/rules/src`])).not.toBe(input.objects['packages/rules/src']);
  return 'FIXTURE_SOURCE_EQUALS_EXACT_RB_CANDIDATE; MAIN_IS_PRE_GUARD_HISTORY; NO_ACCEPTANCE_GRANTED';
}

describe('K03 exact source and scoped RB evidence remain separate from B11 history', () => {
  it('binds frozen source/test objects to exact RB while classifying baseline as pre-guard history', () => {
    expect(checkBinding(binding, fixture)).toBe('FIXTURE_SOURCE_EQUALS_EXACT_RB_CANDIDATE; MAIN_IS_PRE_GUARD_HISTORY; NO_ACCEPTANCE_GRANTED');
  });
  it('verifies frozen K03 independently of a different outer runtime, test and report HEAD', () => {
    for (const path of [...Object.keys(objects), 'scripts', 'docs/reports']) {
      expect(gitText(outerFixture, ['rev-parse', `HEAD:${path}`])).not.toBe(gitText(fixture, ['rev-parse', `HEAD:${path}`]));
    }
    expect(() => checkBinding(binding, fixture)).not.toThrow();
    expect(() => checkBinding(binding, outerFixture)).toThrow();
  });
  it.each(['source-object', 'test-object', 'file-hash', 'unknown-path', 'candidate', 'review', 'review-hash'])('rejects tampered or unbound %s', mode => {
    const bad = structuredClone(binding);
    if (mode === 'source-object') bad.objects['packages/rules/src'] = '0'.repeat(40);
    if (mode === 'test-object') bad.objects['packages/rules/tests'] = '0'.repeat(40);
    if (mode === 'file-hash') bad.files[0].sha256 = '0'.repeat(64);
    if (mode === 'unknown-path') bad.files[0].path = 'packages/rules/src/UNKNOWN.ts';
    if (mode === 'candidate') bad.candidate = main;
    if (mode === 'review') bad.reviewCommit = candidate;
    if (mode === 'review-hash') bad.reviewHash = '0'.repeat(64);
    expect(() => checkBinding(bad, fixture)).toThrow();
  });
  it.each(['source', 'test', 'bytes'])('rejects observed current %s drift despite valid historical RB', mode => {
    const observed = { objects: { ...objects }, files: structuredClone(files) };
    if (mode === 'source') observed.objects['packages/rules/src'] = '0'.repeat(40);
    if (mode === 'test') observed.objects['packages/rules/tests'] = '0'.repeat(40);
    if (mode === 'bytes') observed.files[0].sha256 = '0'.repeat(64);
    expect(() => checkBinding(binding, fixture, observed)).toThrow();
  });
  it('rejects actual committed fixture runtime drift despite unchanged accepted RB', () => {
    try {
      const path = files[0].path;
      writeFileSync(resolve(fixture, path), Buffer.concat([readFileSync(resolve(fixture, path)), Buffer.from('\n// unreviewed fixture drift\n')]));
      git(fixture, ['add', path]);
      git(fixture, ['-c', 'user.name=Test-only K03 fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'test-only unreviewed K03 drift']);
      expect(() => checkBinding(binding, fixture)).toThrow();
    } finally { git(fixture, ['checkout', '--detach', reviewCommit]); }
  });
});
