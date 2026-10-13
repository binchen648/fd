// Read-only Git provenance audit. Only its fixed lesson JSON output is written.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '../../..');
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const catalogBytes = readFileSync(resolve(directory, 'catalog.json'));
const catalog = JSON.parse(catalogBytes);
if (process.argv.slice(2).some(arg => arg !== '--validate') || process.argv.slice(2).length > 1) throw Error('Unsupported K01 audit arguments');
const main = '1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce';
if (catalog.observedMain !== main || catalog.taskId !== 'P3-EFP-K01' || catalog.knowledgeReview !== 'PENDING') throw Error('K01 control metadata mismatch');
if (new Set(catalog.entries.map(row => row.id)).size !== catalog.entries.length) throw Error('Duplicate case');
const seededCatalog = JSON.parse(git('show', `${catalog.dispatchCommit}:docs/engineering/lessons/catalog.json`));
if (seededCatalog.entries.length !== 5 || catalog.entries.length > 10) throw Error('Unexpected seeded/candidate case count');
for (const seed of seededCatalog.entries) {
  const current = catalog.entries.find(entry => entry.id === seed.id);
  if (!current || current.source.commit !== seed.source.commit || current.source.path !== seed.source.path || current.source.sha256 !== seed.source.sha256) throw Error('Seeded source identity replaced');
}
function bind(commit, path) {
  if (!/^[0-9a-f]{40}$/.test(commit) || path.includes('..') || path.startsWith('/')) throw Error('Unsafe exact reference');
  const bytes = git('show', `${commit}:${path}`);
  return { commit, path, sha256: hash(bytes), gitBlob: git('rev-parse', `${commit}:${path}`).toString().trim(), bytes: bytes.length };
}
function exists(commit, path) {
  git('cat-file', '-e', `${commit}^{commit}`);
  const tree = git('ls-tree', '-r', '--name-only', commit, '--', path).toString().trim().split('\n');
  return tree.includes(path);
}
function inspect(commit, path) {
  return exists(commit, path) ? { ...bind(commit, path), presence: 'PRESENT_STATIC_ONLY', execution: 'NOT_RUN_K01' } : { commit, path, presence: 'ABSENT_EXACT_TREE', execution: 'NOT_RUN_K01' };
}
const pointer = {
  'FD-SEC-001': '/blockingFindings/0', 'FD-REV-002': '/blockingFindings/1',
  'FD-EVID-005': '/preservedFailure', 'FD-FIXTURE-006': '/previousIntegrationFailure',
};
const titles = {
  'FD-SEC-001': ['blocks RB public-credential and duplicate HTTP identity impersonation without Golden Eater mutation', 'keeps random credentials out of every public projection and rejects duplicate identities', 'preserves credential-free private pending projections across authenticated Golden Eater reconnect'],
  'FD-REV-002': ['rejects raw WS missing/invalid/stale revisions for dispatch and end_turn without mutation or accepted broadcasts', 'rejects missing, invalid and stale revisions for both mutation commands without any side effects'],
  'FD-SHAPE-003': ['accepts only the exact identity-free whole-ability replacement shell', 'replaces normal tie splitting with full event, competition, and location rewards for every winner'],
  'FD-RESTORE-004': ['runs real sc3 Luck discard -> close/refund/draw -> turn-order exact drawn optional play with combat Action permission'],
};
const entries = catalog.entries.map(entry => {
  const ref = bind(entry.source.commit, entry.source.path);
  if (ref.sha256 !== entry.source.sha256) throw Error(`Source hash mismatch: ${entry.id}`);
  const text = git('show', `${entry.source.commit}:${entry.source.path}`).toString();
  let sourceReviewIdentity = null, rootCauseEvidence = 'SOURCE_STATIC_PLUS_REVIEW_OBSERVATION';
  if (entry.id === 'FD-SEC-001' || entry.id === 'FD-REV-002') {
    const review = JSON.parse(text);
    if (review.reviewedCarrierSha !== entry.reviewedSha || review.verdict !== 'FAILED' || review.testedImplementationSha !== '9a4f4c6ee2723eb7f546341f3c18a1f0a29c3bc1') throw Error('RB failure identity mismatch');
    sourceReviewIdentity = { reviewedSha: review.reviewedCarrierSha, testedSha: review.testedImplementationSha, verdict: review.verdict, reviewer: review.reviewer.identity, scope: review.scope, browserRerun: false, fullCiRerun: false };
  } else if (entry.id === 'FD-EVID-005') {
    const review = JSON.parse(text);
    if (review.reviewedSha !== entry.reviewedSha || review.preservedFailure.reviewedSha !== entry.failureSha || review.finalVerdict !== 'PASS') throw Error('Historical/current review identity conflation');
    sourceReviewIdentity = { reviewedSha: review.reviewedSha, implementationSha: review.implementationSha, verdict: review.finalVerdict, reviewer: review.reviewer, historicalFailureSha: review.preservedFailure.reviewedSha,
      scope: review.acceptedScope, actualFinalAssemblyVerified: review.boundaries.actualFinalAssemblyVerified };
    rootCauseEvidence = 'FULL_HOOK_RPC_CAUSE_UNKNOWN_SYNCHRONOUS_GIT_COST_HYPOTHESIS_ONLY';
  } else if (entry.id === 'FD-FIXTURE-006') {
    const packet = JSON.parse(text), failed = packet.previousIntegrationFailure;
    if (failed.candidateSha !== entry.failureSha || failed.receipt.head !== entry.failureSha || failed.receipt.exitCode !== 1) throw Error('I failure source identity mismatch');
    for (const stream of [failed.receipt.stdout, failed.receipt.stderr]) {
      const raw = Buffer.from(stream.raw, 'base64');
      if (raw.length !== stream.bytes || hash(raw) !== stream.sha256) throw Error('Prior I raw receipt corrupted');
    }
    const index = failed.originalIndex, bytes = Buffer.from(index.raw, 'base64');
    if (hash(bytes) !== index.sha256.toLowerCase() || bytes.length !== index.bytes) throw Error('Original I receipt index corrupted');
    if (entry.reviewedSha !== null || packet.acceptanceGranted !== false) throw Error('A receipt packet mislabelled independent acceptance');
    sourceReviewIdentity = { reviewedSha: null, verdict: 'NOT_REVIEWED_BY_K01', evidenceCarrier: entry.source.commit, implementationSha: packet.implementationSha, failedTestedSha: failed.receipt.head,
      rawFailureExit: failed.receipt.exitCode, repairClaim: packet.status, grants: 'NONE' };
  } else {
    if (!text.includes(`Candidate: \`${entry.reviewedSha}\``) || !text.includes('Verdict: FAILED')) throw Error('Technical review candidate binding missing');
    sourceReviewIdentity = { reviewedSha: entry.reviewedSha, verdict: 'FAILED_TECHNICAL_ONLY', reviewer: 'Codex Automation Review Owner', formalAcceptance: false, scope: entry.id === 'FD-SHAPE-003' ? 'TRUSTED_COMPILED_FIXTURE_FULL_REWARD_EACH_GATEWAY_NOT_RAW_LOADER_OR_CLIENT_EXPLOIT' : 'ACTUAL_SC3_LEGAL_NESTED_PAUSE_INHERITED_RUNTIME_EXPOSURE_NOT_NEW_AUTHORING_RUNTIME_DELTA' };
  }
  const tests = entry.tests.map(path => ({ path, sourceSnapshot: inspect(entry.testStatusAt, path), currentMain: inspect(main, path), role: path.startsWith('docs/reviews/probes/') ? 'REVIEWER_PROBE_NOT_ENFORCING_REGRESSION' : 'TEST_FILE_NOT_PROOF_OF_SPECIFIC_NEGATIVE_OR_EXECUTION' }));
  const selectors = (titles[entry.id] || []).map(title => {
    const matches = tests.filter(row => row.sourceSnapshot.presence.startsWith('PRESENT') && git('show', `${entry.testStatusAt}:${row.path}`).toString().includes(title)).map(row => row.path);
    if (!matches.length) throw Error(`Named test missing: ${entry.id} ${title}`);
    const currentMainMatches = entry.tests.filter(path => exists(main, path) && git('show', `${main}:${path}`).toString().includes(title));
    return { title, exactSha: entry.testStatusAt, paths: matches, observedMainSha: main, currentMainMatches, method: 'LITERAL_SOURCE_INSPECTION_NOT_TEST_EXECUTION' };
  });
  return { id: entry.id, source: ref, sourcePointer: pointer[entry.id] || 'Finding and Verification sections', sourceReviewIdentity,
    sourceCommitParent: git('rev-parse', `${entry.source.commit}^`).toString().trim(), extractionState: 'A_HASH_AND_IDENTITY_VERIFIED_DRAFT_RA_KNOWLEDGE_REVIEW_PENDING',
    rootCauseEvidence, runtimePathsAtMain: entry.files.map(path => inspect(main, path)), tests, namedHistoricalTestSelectors: selectors, currentMainSemanticCoverage: 'NOT_VERIFIED_NO_RUNTIME_EXECUTION_OR_ACCEPTANCE_INHERITANCE' };
});
const supplementary = [
  ['4d5b76be9d5459cc0c40e50fae8513bc59cd5d21', 'docs/reviews/phase3/P3-E09-B11-TRANSPORT-SECURITY-REPAIR-0f62210-reviewer-b.json'],
  ['27dab1ad5b64127dffd7c4108aa9c1c6d4b076dc', 'docs/agents/P3-E09-B11-INTEGRATION-CLOSURE-REPAIR.md'],
  ['6ea26f3bc12fc3bda37b6b2607fd6edda452eee3', 'docs/agents/P3-E09-B11-TEMPORAL-FIXTURE-FINALIZATION.md'],
  ['b22691ab5311cd31f60eb91d573416fea3c7cf98', 'docs/reviews/probes/review-474-independent.mjs'],
  ['7e65291a4fa10170e249bc492617ef337caf7f8a', 'docs/reviews/probes/review-475-independent.mjs'],
  [catalog.dispatchCommit, 'docs/agents/manifests/reservations/P3-E09-B11-TRANSPORT-SECURITY-REPAIR.json'],
  ['4dd8eca5746d63d72c7906716cb7118e2569872a', 'packages/rules/src/ability/combat-reward-distribution.ts'],
  ['fe4653d1013110555881585db3a447880dd463d3', 'packages/rules/src/ability/interpreter.ts'],
  ['1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce', 'data/authoring/servants/servant.stheno.json'],
  ['1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce', 'packages/rules/tests/fb2-34-combat-reward-distribution.test.ts'],
  ['1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce', 'packages/rules/tests/stheno-consumer-migration.test.ts'],
  ['487ab81a8e3fabf75eea5a73cd3582b37cf65520', 'scripts/tests/phase3-e09-b11-final-binding.test.ts'],
  ['487ab81a8e3fabf75eea5a73cd3582b37cf65520', 'scripts/tests/phase3-readiness-preflight.test.ts'],
].map(([commit, path]) => bind(commit, path));
const currentArchive = JSON.parse(git('show', `${main}:data/authoring/servants/servant.stheno.json`));
const currentArchiveText = JSON.stringify(currentArchive);
const sourceFootprints = {
  shape: { inspectedMainModule: inspect(main, 'packages/rules/src/ability/combat-reward-distribution.ts'), differentlyNamedMainTest: inspect(main, 'packages/rules/tests/fb2-34-combat-reward-distribution.test.ts'), applicability: 'CONTRACT_UNBOUND_DO_NOT_PORT_OLD_STACK_BY_NAME' },
  restore: { currentMainContainsSc3Ability: currentArchiveText.includes('sc-stheno-3.goddess-conceit'), currentMainContainsNamedTransaction: git('show', `${main}:packages/rules/src/ability/interpreter.ts`).toString().includes('pendingBattleCloseDrawPlayTransaction'), applicability: 'ACTUAL_HISTORICAL_CONSUMER_NOT_PRESENT_AT_OBSERVED_MAIN' },
  temporal: { failureSha: '487ab81a8e3fabf75eea5a73cd3582b37cf65520', failingSourceBound: true, currentMainProductionInclusion: 'ABSENT_EXACT_LISTED_PATHS_NOT_INFERRED' },
};
const branches = ['0f62210a2e007a15e28f945c546ccd00c345942a', '4dd8eca5746d63d72c7906716cb7118e2569872a', 'fe4653d1013110555881585db3a447880dd463d3', 'b5e68444f55ea9fc1a86a9eea0ea0bedce3de229', 'f1b3588b0b9eb4be943fa127ae24409e067566bf'];
const repairReview = JSON.parse(git('show', `${supplementary[0].commit}:${supplementary[0].path}`));
if (repairReview.reviewedSha !== branches[0] || repairReview.verdict !== 'PASS' || repairReview.overallReadiness !== 'BLOCKED' || repairReview.grants.migrationCreditDelta !== 0) throw Error('Scoped transport follow-up binding mismatch');
const ancestry = branches.map(candidate => {
  const result = spawnSync('git', ['merge-base', '--is-ancestor', candidate, main], { cwd: root });
  if (![0, 1].includes(result.status)) throw Error('Ancestry evaluation unavailable');
  return { candidate, observedMain: main, candidateIsMainAncestor: result.status === 0 };
});
const audit = { schemaVersion: 'fd-engineering-k01-source-audit-v1', taskId: 'P3-EFP-K01', controlEpoch: catalog.controlEpoch,
  dispatch: bind(catalog.dispatchCommit, 'docs/agents/P3-ENGINEERING-FAILURE-PREVENTION-MVP.md'), observedMainSha: main,
  seededCatalog: bind(catalog.dispatchCommit, 'docs/engineering/lessons/catalog.json'),
  catalogSha256: hash(catalogBytes), auditToolSha256: hash(readFileSync(fileURLToPath(import.meta.url))), entries,
  lessonDocumentDigests: [...catalog.entries.map(entry => entry.path), ...['INDEX.md', 'GUARDRAILS.md', 'HISTORICAL-FAILURE-PREFLIGHT.md', 'BATCH-TASK-TEMPLATE.md', 'K01-HANDOFF.md'].map(path => `docs/engineering/lessons/${path}`)].map(path => ({ path, sha256: hash(readFileSync(resolve(root, path))) })),
  scopedFollowUpReview: { source: supplementary[0], reviewedSha: repairReview.reviewedSha, testedSha: repairReview.combinationTestedSha, verdict: repairReview.verdict, acceptedScope: repairReview.verdictScope,
    overallReadiness: repairReview.overallReadiness, independentEvidence: repairReview.independentEvidence, limitations: repairReview.limitations, grants: repairReview.grants, knowledgeReview: 'NOT_GRANTED_BY_RUNTIME_REVIEW' },
  supplementarySources: supplementary, currentMainFootprints: sourceFootprints, candidateMainAncestry: ancestry, candidateTriage: catalog.candidateTriage,
  summary: { initialCases: 5, verifiedInitialSourceBindings: 5, addedSourceBackedDrafts: 1, cases: entries.length, unprovedCandidatesRetained: 4, independentKnowledgeAcceptance: 'PENDING_RA', runtimeTestsExecuted: 0, sourceAssetsMissing: 93, creditDelta: 0, denominatorDelta: 0, ledger: '111/944' },
  boundaries: { runtimeModified: false, runtimeAcceptanceGranted: false, gateOrPromotionGranted: false, sourceReviewReopened: false, heavyTestsExecuted: false, historicalFailuresRewritten: false, currentMainDynamicConformance: 'NOT_VERIFIED' } };
const output = JSON.stringify(audit, null, 2) + '\n';
if (process.argv.includes('--validate')) {
  if (readFileSync(resolve(directory, 'K01-SOURCE-AUDIT.json'), 'utf8') !== output) throw Error('Committed K01 audit is stale or altered');
} else writeFileSync(resolve(directory, 'K01-SOURCE-AUDIT.json'), output);
console.log(JSON.stringify({ status: 'SOURCE_BINDING_AUDIT_COMPLETE_KNOWLEDGE_REVIEW_PENDING', cases: entries.length, initialBindings: 5, auditSha256: hash(output), runtimeTestsExecuted: 0, creditDelta: 0 }, null, 2));
