import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
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

// This test-only binding reuses RB solely for byte-identical K03 source, never promotion.
function checkBinding(input: typeof binding, observed = {
  objects: Object.fromEntries(Object.keys(objects).map(path => [path, gitText(root, ['rev-parse', `HEAD:${path}`])])),
  files: files.map(file => ({ ...file, sha256: hash(readFileSync(resolve(root, file.path))).toLowerCase() })),
}) {
  expect(input).toEqual(binding);
  for (const sha of [main, candidate, reviewCommit]) git(root, ['merge-base', '--is-ancestor', sha, 'HEAD']);
  expect(gitText(root, ['rev-parse', `${reviewCommit}^`])).toBe(candidate);
  expect(gitText(root, ['diff', '--name-only', candidate, reviewCommit])).toBe(reviewPath);
  const reviewBytes = git(root, ['show', `${input.reviewCommit}:${input.reviewPath}`]);
  expect(hash(reviewBytes).toLowerCase()).toBe(input.reviewHash);
  expect(git(root, ['show', `HEAD:${reviewPath}`])).toEqual(reviewBytes);
  const review = JSON.parse(reviewBytes.toString());
  expect(review).toMatchObject({ schemaVersion: 'fd-independent-scoped-review-v1', taskId: 'P3-EFP-K03-B',
    reviewedSha: candidate, reviewerIdentity: 'Codex Reviewer B', verdict: 'PASS', scope,
    overallReadiness: 'BLOCKED', grants: { promotion: false, main: false, creditDelta: 0 } });
  const packetBytes = git(root, ['show', `${candidate}:${packetPath}`]);
  expect(hash(packetBytes).toLowerCase()).toBe(review.packet.sha256);
  expect(git(root, ['show', `HEAD:${packetPath}`])).toEqual(packetBytes);
  const packet = JSON.parse(packetBytes.toString());
  expect(packet.sourceBinding.files).toEqual(input.files);
  expect(packet.testedImplementationSha).toBe(review.testedImplementationSha);
  for (const [path, object] of Object.entries(input.objects)) {
    for (const sha of [candidate, reviewCommit, review.testedImplementationSha]) {
      expect(gitText(root, ['rev-parse', `${sha}:${path}`])).toBe(object);
    }
    expect(observed.objects[path]).toBe(object);
  }
  expect(observed.files).toEqual(input.files);
  expect(gitText(root, ['diff', 'HEAD', '--', ...Object.keys(objects), reviewPath, packetPath])).toBe('');
  expect(gitText(root, ['ls-files', '--others', '--exclude-standard', '--', ...Object.keys(objects)])).toBe('');
  for (const file of input.files) {
    expect(gitText(root, ['rev-parse', `${main}:${file.path}`])).toBe(file.baseBlob);
    expect(gitText(root, ['rev-parse', `${candidate}:${file.path}`])).toBe(file.candidateBlob);
    expect(hash(git(root, ['show', `${candidate}:${file.path}`])).toLowerCase()).toBe(file.sha256);
  }
  expect(gitText(root, ['diff', '--name-only', main, candidate, '--', ...Object.keys(objects)]).split('\n')).toEqual(input.files.map(file => file.path));
  expect(gitText(root, ['rev-parse', `${main}:packages/rules/src`])).not.toBe(input.objects['packages/rules/src']);
  return 'CURRENT_SOURCE_EQUALS_EXACT_RB_CANDIDATE; MAIN_IS_PRE_GUARD_HISTORY; NO_ACCEPTANCE_GRANTED';
}

describe('K03 exact source and scoped RB evidence remain separate from B11 history', () => {
  it('binds unchanged current source/test objects to exact RB while classifying baseline as pre-guard history', () => {
    expect(checkBinding(binding)).toBe('CURRENT_SOURCE_EQUALS_EXACT_RB_CANDIDATE; MAIN_IS_PRE_GUARD_HISTORY; NO_ACCEPTANCE_GRANTED');
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
    expect(() => checkBinding(bad)).toThrow();
  });
  it.each(['source', 'test', 'bytes'])('rejects observed current %s drift despite valid historical RB', mode => {
    const observed = { objects: { ...objects }, files: structuredClone(files) };
    if (mode === 'source') observed.objects['packages/rules/src'] = '0'.repeat(40);
    if (mode === 'test') observed.objects['packages/rules/tests'] = '0'.repeat(40);
    if (mode === 'bytes') observed.files[0].sha256 = '0'.repeat(64);
    expect(() => checkBinding(binding, observed)).toThrow();
  });
});
