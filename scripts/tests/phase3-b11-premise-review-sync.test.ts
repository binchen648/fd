import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { bindReviewedParityInput, premiseReviewBindings, reviewedToolingCarrier, validatePremiseReviewBodies } from '../phase3-b11-tooling-inputs';
import { git, hash } from '../phase3-tooling-common';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const input = JSON.parse(git(root, ['show', `${reviewedToolingCarrier}:scripts/fixtures/phase3-b11-parity-contract.json`]).toString());
const review = (owner: 'a' | 'b') => {
  const ref = premiseReviewBindings[owner];
  return JSON.parse(git(root, ['show', `${ref.commit}:${ref.path}`]).toString());
};

describe('exact independently reviewed B11 premise binding', () => {
  it('binds both immutable review hashes and actual artifact-only direct parents', () => {
    for (const ref of Object.values(premiseReviewBindings)) {
      expect(hash(git(root, ['show', `${ref.commit}:${ref.path}`]))).toBe(ref.sha256);
      expect(git(root, ['rev-parse', `${ref.commit}^`]).toString().trim()).toBe(reviewedToolingCarrier);
      expect(git(root, ['diff', '--name-only', `${ref.commit}^`, ref.commit]).toString().trim()).toBe(ref.path);
    }
    expect(bindReviewedParityInput(root)).toEqual({ ...input, expectationReview: { state: 'ACCEPTED', artifact: premiseReviewBindings.b } });
  }, 15_000);
  it.each(['verdict', 'candidate', 'epoch', 'scope', 'fixture', 'premise', 'assessment', 'promotion'])('rejects tampered B %s even with a rehashed artifact', defect => {
    const b = review('b');
    if (defect === 'verdict') b.verdict = 'FAILED';
    if (defect === 'candidate') b.candidateSha = '0'.repeat(40);
    if (defect === 'epoch') b.controlEpoch = 'FD-P3-2026-09-23-04';
    if (defect === 'scope') b.scope.authorizedAbilities.push('unrelated');
    if (defect === 'fixture') b.fixtureSha256 = '0'.repeat(64);
    if (defect === 'premise') b.premiseSha256 = '0'.repeat(64);
    if (defect === 'assessment') b.fixtureAssessments[0].verdict = 'FAILED';
    if (defect === 'promotion') b.boundaries.mainPromotionGranted = true;
    expect(() => validatePremiseReviewBodies(root, input, review('a'), b)).toThrow('Exact premise review mismatch');
  });
  it.each(['carrier', 'scope', 'hash', 'credit'])('rejects tampered A %s', defect => {
    const a = review('a');
    if (defect === 'carrier') a.reviewedSha = '0'.repeat(40);
    if (defect === 'scope') a.acceptedScope = 'FULL_RUNTIME';
    if (defect === 'hash') a.boundArtifacts[0].sha256 = '0'.repeat(64);
    if (defect === 'credit') a.formalCredit.migrationCreditDelta = 1;
    expect(() => validatePremiseReviewBodies(root, input, a, review('b'))).toThrow('Exact premise review mismatch');
  });
  it('regenerates the same accepted input without changing the reviewed premise or old input', () => {
    const original = JSON.stringify(input);
    expect(JSON.stringify(bindReviewedParityInput(root))).toBe(JSON.stringify(bindReviewedParityInput(root)));
    expect(JSON.stringify(input)).toBe(original);
    expect(input.expectationReview.state).toBe('PENDING');
  }, 15_000);
});
