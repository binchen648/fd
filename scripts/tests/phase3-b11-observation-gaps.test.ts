import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildGapPlan, decomposeObservations, parityPath, reviewedCarrier, reviewCommit, reviewPath, renderGapReport } from '../phase3-b11-observation-gaps';
import { git, hash } from '../phase3-tooling-common';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
function sources() {
  const parity = JSON.parse(git(root, ['show', `${reviewedCarrier}:${parityPath}`]).toString());
  const review = JSON.parse(git(root, ['show', `${reviewCommit}:${reviewPath}`]).toString());
  const fixtures = JSON.parse(git(root, ['show', `${parity.fixtureBinding.commit}:${parity.fixtureBinding.path}`]).toString());
  return { parity, review, fixtures };
}
describe('exact-reviewed B11 missing observation decomposition', () => {
  it('recomputes 34 field observations without treating them as new card migrations', () => {
    const plan = buildGapPlan(root);
    expect(plan.summary).toEqual({ missingObservations: 34, fixtureCases: 10, canonicalConsumers: 2, ownerCounts: { B: 4, A: 30 }, distinctApiTasks: 3, pendingFixtureReview: 1 });
    expect(plan.groups.map(group => group.count)).toEqual([4, 10, 10, 10]);
    expect(plan.readiness).toBe('FAIL_NO_WAIVER'); expect(plan.mainCoverageCreditDelta).toBe(0);
    expect(plan.promotedOnMain).toBe(false); expect(plan.fixtureReviewHandoff.state).toBe('PENDING');
  }, 15_000);
  it('rejects changed reviewer identity, epoch, scope or exact candidate', () => {
    for (const patch of [{ reviewer: 'Other' }, { reviewedSha: '0'.repeat(40) }, { controlEpoch: 'stale' }, { acceptedScope: 'FULL_ACCEPTANCE' }]) {
      const { parity, review, fixtures } = sources(); expect(() => decomposeObservations(parity, { ...review, ...patch }, fixtures)).toThrow();
    }
  });
  it('rejects duplicate gaps, unknown fields, missing rows and unbound fixture identity', () => {
    const { parity, review, fixtures } = sources();
    const duplicate = structuredClone(parity); duplicate.issues.push(duplicate.issues[1]);
    expect(() => decomposeObservations(duplicate, review, fixtures)).toThrow();
    const unknown = structuredClone(parity); unknown.issues[1].path = 'golden-positive:unknown.field';
    expect(() => decomposeObservations(unknown, review, fixtures)).toThrow();
    const missing = structuredClone(parity); missing.results.pop(); expect(() => decomposeObservations(missing, review, fixtures)).toThrow();
    const changed = structuredClone(fixtures); changed.fixtures[0].source.cardId = 'other'; expect(() => decomposeObservations(parity, review, changed)).toThrow();
  });
  it('does not manufacture gaps for available API observations', () => {
    const { parity, review, fixtures } = sources(); parity.results[0].observations.inventory.routeCandidate = true;
    expect(() => decomposeObservations(parity, review, fixtures)).toThrow();
    const omitted = sources(); omitted.parity.results[0].observations.runtime.exactEligible = null;
    expect(() => decomposeObservations(omitted.parity, omitted.review, omitted.fixtures)).toThrow();
  });
  it('renders identical evidence and report for exact immutable inputs', () => {
    const { parity, review, fixtures } = sources();
    const first = `${JSON.stringify(decomposeObservations(parity, review, fixtures), null, 2)}\n`;
    const second = `${JSON.stringify(decomposeObservations(parity, review, fixtures), null, 2)}\n`;
    expect(first).toBe(second);
    expect(renderGapReport(JSON.parse(first), hash(first))).toBe(renderGapReport(JSON.parse(second), hash(second)));
  });
});
