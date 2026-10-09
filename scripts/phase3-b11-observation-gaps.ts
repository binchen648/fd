import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ancestor, git, gitText, hash, InputError, type Obj } from './phase3-tooling-common';

export const reviewedCarrier = '32eb054f49e2413d2f9891d6edbd665d7eb3c154';
export const reviewCommit = '75ce895c91f8af2ddd25b3c4fbb546bf107d3007';
export const reviewPath = 'docs/reviews/phase3/P3-E08-B11-tooling-repair-reviewer-a.json';
export const reviewHash = 'C409D84F52720146E42F4DFB919DB30417FB1B8A96EAE7543863F97A472B1FE4';
export const parityPath = 'artifacts/phase3-e08-b11-tooling-parity-review-fix.json';
export const parityHash = '3882243E538B542D62772A932130EC8231186DE619A9E460B6447B211AF694EA';
export const outputPath = 'artifacts/phase3-e08-b11-observation-gap-plan.json';
export const reportPath = 'docs/reports/2026-10-09-p3-e08-b11-observation-gap-plan.md';

const boundaries: Record<string, Obj> = {
  'runtime.routeCandidate': {
    owner: 'Codex B', count: 4, task: 'B11_CONVERSION_STRUCTURAL_CLASSIFICATION_API',
    smallestRepair: 'Expose the existing shared structural ownership classifier as a read-only API; preserve routing/primitive behavior. If ownership semantics must change, stop and request a separately scoped runtime contract.',
    reviewer: 'Reviewer B', dependencies: [],
    meaning: 'Structural ownership is distinct from exact eligibility. Owned malformed input must not masquerade as outside-scope.',
  },
  'inventory.routeCandidate': {
    owner: 'Codex A', count: 10, task: 'B11_INVENTORY_OBSERVATION_API',
    smallestRepair: 'Provide independently executable authoring inventory observations for B11; explicitly separate structural ownership and exact graph eligibility. Do not alias runtime/coverage values or copy an unrelated Card Zone CLI.',
    reviewer: 'Reviewer A tooling; Reviewer B semantic expectations', dependencies: ['FIXTURE_EXPECTATION_REVIEW'],
    meaning: 'Inventory ownership on canonical authoring input and owned malformed graph variants, not ability ID membership.',
  },
  'inventory.exactEligible': {
    owner: 'Codex A', count: 10, task: 'B11_INVENTORY_OBSERVATION_API',
    smallestRepair: 'Use the same narrow inventory task with a separate exactEligible result; report skipped shape/reason and raw normalized inputs. No KPI/taxonomy changes.',
    reviewer: 'Reviewer A tooling; Reviewer B semantic expectations', dependencies: ['FIXTURE_EXPECTATION_REVIEW'],
    meaning: 'Inventory exact eligibility is a semantic graph classification, not mere presence of binding syntax.',
  },
  'coverage.exactEligible': {
    owner: 'Codex A', count: 10, task: 'B11_COVERAGE_DIAGNOSTIC_EXACT_ELIGIBILITY',
    smallestRepair: 'Add an independently reviewable diagnostic-only eligibility observation alongside the unchanged coverage taxonomy. Preserve raw runtimeRoute and counters; do not reinterpret NEW_RUNTIME as eligibility or substitute another owner observation.',
    reviewer: 'Reviewer A tooling; Reviewer B semantic expectations', dependencies: ['FIXTURE_EXPECTATION_REVIEW'],
    meaning: 'Raw coverage taxonomy and exact graph eligibility answer different questions and must remain separate.',
  },
};

export function decomposeObservations(parity: Obj, review: Obj, fixtures: Obj) {
  if (review.schemaVersion !== 'fd-phase3-reviewer-a-tooling-repair-review-v1' || review.reviewedSha !== reviewedCarrier ||
      review.candidateSha !== reviewedCarrier || review.finalVerdict !== 'PASS' || review.reviewer !== 'Reviewer A' ||
      review.acceptedScope !== 'TWO_PRIOR_TOOLING_BLOCKER_REPAIRS_ONLY' || review.controlEpoch !== 'FD-P3-2026-09-23-08' ||
      review.readiness !== 'FAIL_NO_WAIVER' || review.runtimeAcceptanceGranted !== false || review.fixtureAcceptanceGranted !== false || review.promotionAllowed !== false) {
    throw new InputError('Reviewer identity/scope/verdict/epoch mismatch');
  }
  if (parity.schemaVersion !== 'fd-p3-contract-parity-result-v1' || parity.status !== 'FAIL' || !parity.executionPerformed ||
      parity.testedCandidateSha !== review.testedCombinationSha || parity.controlEpoch !== review.controlEpoch ||
      parity.results.length !== 10 || parity.acceptanceGranted !== false || review.independentChecks.freshParity.sha256 !== parityHash) {
    throw new InputError('Exact parity evidence mismatch');
  }
  const rows = new Map<string, Obj>(); const sources = new Map<string, Obj>();
  for (const fixture of fixtures.fixtures) {
    if (sources.has(fixture.id)) throw new InputError('Duplicate fixture source');
    sources.set(fixture.id, fixture);
  }
  for (const row of parity.results) {
    const fixture = sources.get(row.fixtureId);
    if (rows.has(row.fixtureId) || !fixture || row.fixtureSha256 !== hash(`${JSON.stringify(fixture)}\n`)) throw new InputError('Fixture execution binding mismatch');
    rows.set(row.fixtureId, row);
  }
  const grouped: Record<string, Obj[]> = {}; const seen = new Set<string>(); let pendingReview = 0;
  for (const issue of parity.issues) {
    if (issue.code === 'EXPECTATIONS_NOT_INDEPENDENTLY_REVIEWED') { pendingReview++; continue; }
    if (issue.code !== 'REQUIRED_OBSERVATION_NOT_EVALUATED') throw new InputError(`Unclassified issue ${issue.code}`);
    if (seen.has(issue.path)) throw new InputError('Duplicate missing-observation path'); seen.add(issue.path);
    const [fixtureId, field, ...extra] = issue.path.split(':');
    if (extra.length || !Object.hasOwn(boundaries, field)) throw new InputError(`Unsupported gap ${issue.path}`);
    const row = rows.get(fixtureId); const fixture = sources.get(fixtureId);
    const [owner, name] = field.split('.');
    if (!row || !fixture || row.observations[owner][name] !== null || row.observations[owner].unavailable[name] !== issue.message) throw new InputError('Gap does not match actual unavailable observation');
    (grouped[field] ??= []).push({ fixtureId, family: fixture.family, category: fixture.category,
      canonicalSource: fixture.source, actualCardId: row.actualCardId, actualAbilityId: row.actualAbilityId,
      issuePath: issue.path, reason: issue.message });
  }
  if (seen.size !== 34 || pendingReview !== 1) throw new InputError('Reviewed missing-observation accounting drift');
  for (const row of rows.values()) {
    for (const [owner, fields] of Object.entries({ runtime: ['routeCandidate', 'exactEligible'], compiler: ['compileOutcome'], inventory: ['routeCandidate', 'exactEligible'], coverage: ['exactEligible'] })) {
      for (const field of fields) {
        if (row.observations[owner]?.[field] == null && !seen.has(`${row.fixtureId}:${owner}.${field}`)) throw new InputError('Unavailable required observation missing from issue list');
      }
    }
  }
  const groups = Object.entries(boundaries).map(([field, boundary]) => {
    const observations = (grouped[field] ?? []).sort((a, b) => a.fixtureId.localeCompare(b.fixtureId));
    if (observations.length !== boundary.count) throw new InputError(`Gap group count drift: ${field}`);
    return { field, ...boundary, state: 'PROPOSED_OWNER_HANDOFF_NOT_DISPATCHED', observations };
  });
  const canonicalConsumers = new Set([...sources.values()].map(fixture => JSON.stringify([fixture.source.archiveId, fixture.source.cardId, fixture.source.abilityId]))).size;
  if (canonicalConsumers !== 2 || sources.size !== rows.size) throw new InputError('Canonical consumer/fixture scope drift');
  const ownerCounts = { B: 0, A: 0 };
  for (const group of groups) ownerCounts[group.owner === 'Codex B' ? 'B' : 'A'] += group.observations.length;
  return { schemaVersion: 'fd-p3-b11-observation-gap-plan-v1', taskId: 'P3-E08-B11-OBSERVATION-GAP-DECOMPOSITION',
    controlEpoch: review.controlEpoch, reviewedCarrier, testedCombinationSha: parity.testedCandidateSha,
    sources: { reviewer: { commit: reviewCommit, path: reviewPath, sha256: reviewHash, acceptedScope: review.acceptedScope },
      parity: { commit: reviewedCarrier, path: parityPath, sha256: parityHash }, fixtures: parity.fixtureBinding },
    summary: { missingObservations: seen.size, fixtureCases: rows.size, canonicalConsumers, ownerCounts,
      distinctApiTasks: new Set(groups.map(group => group.task)).size, pendingFixtureReview: pendingReview }, groups,
    fixtureReviewHandoff: { owner: 'Reviewer B', state: 'PENDING', contractId: 'B11_RESULT_BINDING_DIAGNOSTIC_V1',
      testedCandidateSha: parity.testedCandidateSha, reviewedFixtureCommit: parity.fixtureBinding.commit,
      fixtureArtifact: parity.fixtureBinding, executionAdapter: parity.executionAdapter, premiseSha256: parity.premiseSha256,
      inputContract: 'scripts/fixtures/phase3-b11-parity-contract.json', requiredArtifactSchema: 'fd-p3-parity-expectation-review-v1',
      requirements: 'Read canonical rules and consumer authoring. Independently decide positive, malformed, outside-scope, identity and binding expectations. Bind candidateSha, reviewedFixtureCommit, premiseSha256, reviewer and verdict; do not grant readiness from tool agreement. If expectations change, regenerate premise and review the new exact fixture identity.' },
    dependencyOrder: ['Reviewer B fixture expectation review and B read-only structural API task may proceed in parallel',
      'A inventory and coverage diagnostic tasks consume independently reviewed meanings, without changing taxonomy',
      'Freeze owner implementations and bind the new execution closure and fixture premise',
      'Reviewer A reviews tool changes; bind exact execution receipts and fresh owner reviews',
      'A reruns preflight/parity; readiness remains FAIL until all required observations and dependencies are satisfied'],
    runtimeDefectEstablished: false, readiness: 'FAIL_NO_WAIVER', mainCoverageCreditDelta: 0, migrationCreditDelta: 0,
    denominatorDelta: 0, promotedOnMain: false, reviewReadyChanged: false, claimedAcceptance: 'AUTOMATION_BASELINE_CANDIDATE' };
}

export function buildGapPlan(root: string) {
  const reviewBytes = git(root, ['show', `${reviewCommit}:${reviewPath}`]);
  const parityBytes = git(root, ['show', `${reviewedCarrier}:${parityPath}`]);
  if (hash(reviewBytes) !== reviewHash || hash(parityBytes) !== parityHash ||
      gitText(root, ['show', '-s', '--format=%P', reviewCommit]) !== reviewedCarrier || !ancestor(root, reviewedCarrier, reviewCommit) ||
      gitText(root, ['diff', '--name-only', reviewedCarrier, reviewCommit]) !== reviewPath) throw new InputError('Exact reviewer/artifact/lineage binding failed');
  const parity = JSON.parse(parityBytes.toString('utf8'));
  const fixtureBytes = git(root, ['show', `${parity.fixtureBinding.commit}:${parity.fixtureBinding.path}`]);
  if (hash(fixtureBytes) !== parity.fixtureBinding.sha256) throw new InputError('Fixture artifact hash mismatch');
  return decomposeObservations(parity, JSON.parse(reviewBytes.toString('utf8')), JSON.parse(fixtureBytes.toString('utf8')));
}

export function renderGapReport(plan: ReturnType<typeof buildGapPlan>, artifactHash: string) {
  return `# B11 Required Observation Gap Plan\n\nEpoch: ${plan.controlEpoch}\n\nStatus: PROPOSED_OWNER_HANDOFF_NOT_DISPATCHED; readiness FAIL_NO_WAIVER.\n\nTooling Reviewer A PASS applies only to two blocker repairs at ${reviewedCarrier}.\nReview commit: ${reviewCommit}; review SHA-256: ${reviewHash}.\n\nArtifact: ${outputPath}\nArtifact SHA-256: ${artifactHash}\n\n## Recomputed Gaps\n\n34 missing fields across 10 fixtures and 2 canonical consumers, not 34 cards.\n\n| Field | Observations | Owner | Smallest task |\n| --- | --- | --- | --- |\n${plan.groups.map(group => `| ${group.field} | ${group.count} | ${group.owner} | ${group.task} |`).join('\n')}\n\nInventory rows are two fields in one task, not two runtime slices. Compiler observations are present; no compiler repair is proposed.\n\n## Owner Boundaries\n\n${plan.groups.map(group => `### ${group.field}\n\n${group.smallestRepair}\n\nRequired reviewer: ${group.reviewer}.\n`).join('\n')}\n## Fixture Review Input\n\nReviewer B must independently review ${plan.fixtureReviewHandoff.fixtureArtifact.path} at ${plan.fixtureReviewHandoff.reviewedFixtureCommit}, digest ${plan.fixtureReviewHandoff.fixtureArtifact.sha256}.\n\nCandidate: ${plan.testedCombinationSha}\nAdapter: ${plan.fixtureReviewHandoff.executionAdapter.commit}\nPremise SHA-256: ${plan.fixtureReviewHandoff.premiseSha256}\nExpected review schema: fd-p3-parity-expectation-review-v1.\n\nThis plan does not impersonate Reviewer B, change expectations, or dispatch a runtime writer lock. The runtime ownership API requirement is a proposed B task; semantic changes require separate authorization.\n\n## Dependency Order\n\n${plan.dependencyOrder.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\nNo runtime defect was established. Source/API inspection confirms the existing Conversion structural helper is private, inventory CLI is a different contract, and coverage taxonomy is broader than exact graph validity. A may supply read-only diagnostic APIs under explicit reviewed meanings; it must not copy runtime outputs into inventory/coverage or change KPI to make agreement green.\n\nMain/migration/denominator delta: 0. All legacy runtime owners unchanged. Global Gate C and historical 93 image blockers remain unverified. No promotion permitted.\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const plan = buildGapPlan(resolve('.')); const bytes = `${JSON.stringify(plan, null, 2)}\n`;
    writeFileSync(outputPath, bytes); writeFileSync(reportPath, renderGapReport(plan, hash(bytes)));
    process.stdout.write(`missingObservations=34 fixtures=10 consumers=2 ownerB=4 ownerA=30 readiness=FAIL_NO_WAIVER\nartifact=${outputPath}\nsha256=${hash(bytes)}\n`);
  } catch (error) { process.stderr.write(`${String(error)}\n`); process.exitCode = 1; }
}
