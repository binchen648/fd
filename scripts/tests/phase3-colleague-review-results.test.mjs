import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bindReviews } from '../phase3-colleague-review-results.mjs';

const inventory = { mainSha: 'main', counts: {}, prs: [
  { pr: 1, headSha: 'head', baseSha: 'base', technicalReview: { state: 'PENDING' } },
  { pr: 2, headSha: 'other', baseSha: 'base', technicalReview: { state: 'PENDING' } },
] };
const review = { pr: 1, headSha: 'head', baseSha: 'base', verdict: 'PASS', producer: 'independent-reviewer',
  scope: 'historical-candidate', evidence: [{ kind: 'TEST', producer: 'independent-reviewer', command: 'focused',
    targetSha: 'head', result: 'PASS', artifactIdentity: 'unit-fixture-only' }],
  runtimeAcceptanceGranted: false, promotionAuthorized: false, creditDelta: 0 };
const batch = (reviews = [review]) => ({ mainSha: 'main', reviews });

test('binds only the reviewed PR without mutating input or granting gates', () => {
  const result = bindReviews(inventory, batch(), 'review.json');
  assert.equal(result.counts.reviewed, 1);
  assert.equal(result.counts.pending, 1);
  assert.equal(inventory.prs[0].technicalReview.state, 'PENDING');
});
test('rejects revised head, base or main', () => {
  for (const field of ['headSha', 'baseSha']) assert.throws(() => bindReviews(inventory, batch([{ ...review, [field]: 'new' }]), 'review.json'));
  assert.throws(() => bindReviews(inventory, { ...batch(), mainSha: 'new' }, 'review.json'));
});
test('rejects unregistered and duplicate reviews', () => {
  assert.throws(() => bindReviews(inventory, batch([{ ...review, pr: 3 }]), 'review.json'));
  assert.throws(() => bindReviews(inventory, batch([review, review]), 'review.json'));
});
test('blocked or not verified does not count as completed technical review', () => {
  for (const verdict of ['BLOCKED', 'NOT_VERIFIED']) {
    const result = bindReviews(inventory, batch([{ ...review, verdict }]), 'review.json');
    assert.equal(result.counts.reviewed, 0);
    assert.equal(result.counts.pending, 1);
  }
});
test('rejects missing provenance and forbidden credit', () => {
  for (const change of [{ producer: '' }, { evidence: [] }, { promotionAuthorized: true }, { runtimeAcceptanceGranted: true }, { creditDelta: 1 }]) {
    assert.throws(() => bindReviews(inventory, batch([{ ...review, ...change }]), 'review.json'));
  }
});
test('rejects tests attributed to a different candidate or missing producer', () => {
  for (const change of [{ targetSha: 'other' }, { producer: '' }, { artifactIdentity: '' }]) {
    assert.throws(() => bindReviews(inventory, batch([{ ...review, evidence: [{ ...review.evidence[0], ...change }] }]), 'review.json'));
  }
});
