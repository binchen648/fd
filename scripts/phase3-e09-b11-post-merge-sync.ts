import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import { buildCoverageFromArchives, loadAuthoringArchives } from './phase3-coverage';

const MAIN = '219d47c8dcc2b8118f2d3f6b37f51ce465e737cb';
const BASE = '1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce';
const CARRIER = '1ce0b406ecf1e7389886bd2962e9e28f0d7d444b';
const HEAD = '3ec8b5393118b2b250eacd044dfd18ec098662cb';
const SYNC = 'c3119f0571af097e3d4401d0e542f86e19b875e5';
const RA = 'b3e3d5c1091a9d66654965dbdf01e32624a7db11';
const G = 'af319c36cbf9cc977cbb7b0aeea5bee7ed101307';
const RUNTIME = '0f62210a2e007a15e28f945c546ccd00c345942a';
const OUT = 'artifacts/phase3-e09-b11-post-merge-sync.json';
const REPORT = 'docs/reports/2026-10-13-p3-e09-b11-post-merge-sync.md';
const sha256 = (input: string | Buffer) => createHash('sha256').update(input).digest('hex').toUpperCase();
const json = (input: unknown) => `${JSON.stringify(input, null, 2)}\n`;
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
const text = (...args: string[]) => git(...args).toString('utf8').trim();
const at = (commit: string, path: string) => git('show', `${commit}:${path}`);
const parseAt = (commit: string, path: string) => JSON.parse(at(commit, path).toString('utf8'));

export function validateAccounting(ids: string[], universe: string[]): void {
  assert.equal(ids.length, 111);
  assert.equal(new Set(ids).size, 111);
  assert.equal(universe.length, 944);
  assert.equal(new Set(universe).size, 944);
  assert.ok(ids.every((id) => universe.includes(id)));
}

export function validateChecks(runs: { name: string; headSha: string; conclusion: string; status: string }[]): void {
  assert.deepEqual(runs.map((run) => run.name).sort(), ['Build', 'Deploy', 'Phase 3 Pre-Review Gate', 'Test']);
  for (const run of runs) {
    assert.equal(run.headSha, MAIN);
    assert.equal(run.conclusion, 'success');
    assert.equal(run.status, 'completed');
  }
}

export function validateTestLog(log: string): void {
  const plain = stripVTControlCharacters(log);
  assert.match(plain, /Test Files\s+194 passed\s+\(194\)/);
  assert.match(plain, /Tests\s+1606 passed\s*\|\s*1 skipped\s+\(1607\)/);
}

async function main(): Promise<void> {
  if (process.argv.includes('--capture-github')) {
    const gh = (...args: string[]) => execFileSync('gh', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 }).toString('utf8');
    const pr = JSON.parse(gh('pr', 'view', '559', '--repo', 'binchen648/fd', '--json', 'url,state,mergedAt,mergeCommit,headRefOid,baseRefOid,headRefName'));
    const runs = JSON.parse(gh('run', 'list', '--repo', 'binchen648/fd', '--commit', MAIN, '--json', 'databaseId,headSha,name,status,conclusion,url', '--limit', '15'));
    const testLog = gh('run', 'view', '38347534732', '--repo', 'binchen648/fd', '--log');
    writeFileSync(resolve(root, 'artifacts/phase3-e09-b11-post-merge-github-observations.json'), json({
      observedAt: new Date().toISOString(), transport: 'gh API', observedMainSha: MAIN, pr, runs, testLog,
    }));
    return;
  }
  const baselineRoot = process.argv[process.argv.indexOf('--baseline-root') + 1];
  assert.ok(process.argv.includes('--baseline-root') && baselineRoot, 'exact baseline checkout required');
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: baselineRoot }).toString().trim(), BASE);
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: baselineRoot }).toString(), '');
  const lineage = [BASE, RUNTIME, CARRIER, RA, G, SYNC, HEAD].map((commit) => {
    git('cat-file', '-e', `${commit}^{commit}`);
    git('merge-base', '--is-ancestor', commit, MAIN);
    return { commit, ancestorOfObservedMain: true };
  });
  assert.equal(text('show', '-s', '--format=%P', MAIN), `${BASE} ${HEAD}`);
  assert.equal(text('show', '-s', '--format=%P', RA), CARRIER);
  assert.equal(text('show', '-s', '--format=%P', G), RA);
  const paths = ['packages/rules/src', 'packages/content/src', 'apps/client/src', 'apps/server/src',
    'e2e', 'data/authoring', 'data/generated', 'data/packs', 'package.json', 'package-lock.json',
    'playwright.config.ts', 'scripts/phase3-coverage.ts'];
  const sourceEquivalence = paths.map((path) => {
    const objects = [CARRIER, HEAD, MAIN].map((commit) => ({ commit, object: text('rev-parse', `${commit}:${path}`) }));
    assert.equal(new Set(objects.map((entry) => entry.object)).size, 1, `source drift: ${path}`);
    return { path, objects, equivalent: true };
  });
  const governance = parseAt(MAIN, 'docs/agents/manifests/governance/P3-E09-B11-PROMOTION-GOVERNANCE-INPUTS.json');
  const references = [governance.newIntegrationRa, governance.integrationPacket, governance.integrationReport,
    governance.sourceInputs.find((input: { type: string }) => input.type === 'runtimeRb')];
  const evidenceBindings = references.map((ref) => {
    assert.ok(ref && ref.path && ref.sha256, 'missing reference');
    const sourceCommit = ref.commit ?? CARRIER;
    const source = at(sourceCommit, ref.path);
    assert.equal(sha256(source), ref.sha256);
    assert.equal(sha256(at(MAIN, ref.path)), ref.sha256);
    return { commit: sourceCommit, path: ref.path, sha256: ref.sha256, unchangedOnMain: true };
  });
  for (const path of ['docs/reviews/phase3/P3-E09-B11-promotion-attestation.json',
    'docs/agents/manifests/governance/P3-E09-B11-PROMOTION-GOVERNANCE-INPUTS.json',
    'docs/reports/2026-10-12-p3-e09-b11-promotion-attestation.md']) {
    const hash = sha256(at(G, path));
    assert.equal(sha256(at(MAIN, path)), hash);
    evidenceBindings.push({ commit: G, path, sha256: hash, unchangedOnMain: true });
  }
  const preservedControls = governance.preservedMainControlObjects.map((ref: { path: string; sha256: string }) => {
    assert.equal(sha256(at(BASE, ref.path)), ref.sha256);
    assert.equal(sha256(at(MAIN, ref.path)), ref.sha256);
    return ref;
  });
  const generatedAt = text('show', '-s', '--format=%cI', MAIN);
  const before = buildCoverageFromArchives(loadAuthoringArchives(baselineRoot), { workspaceRoot: baselineRoot, generatedAt });
  // Read current material only after confirming it matches the immutable observed main.
  for (const path of ['data/authoring', 'scripts/phase3-coverage.ts', 'packages/rules/src']) {
    assert.equal(text('rev-parse', `HEAD:${path}`), text('rev-parse', `${MAIN}:${path}`));
    assert.equal(text('diff', 'HEAD', '--', path), '');
  }
  const after = buildCoverageFromArchives(loadAuthoringArchives(root), { workspaceRoot: root, generatedAt });
  const scopedConsumers = [
    { cardId: 'master.irisviel.skill.conversion-magic', abilityId: 'conversion-magic.preparation' },
    { cardId: 'servant.kintoki.skill.sc-kintoki-3', abilityId: 'sc-kintoki-3.golden-eater' },
  ].map((identity) => {
    const matches = after.semanticAxes.filter((row) => row.cardId === identity.cardId && row.abilityId === identity.abilityId);
    assert.equal(matches.length, 1);
    assert.equal(matches[0]!.runtimeRoute, 'NEW_RUNTIME_SEMANTIC_ROUTED');
    return matches[0]!;
  });
  const counts = (coverage: typeof after) => ({ new: coverage.runtimeRouting.newRuntimeConsumers.after,
    legacyResolve: coverage.runtimeRouting.legacyResolveEffectConsumers.after,
    legacyExecute: coverage.runtimeRouting.legacyExecuteAbilityConsumers.after,
    dual: coverage.runtimeRouting.dualRuntimeConsumers.after, notClassifiable: coverage.runtimeRouting.notClassifiable.after });
  assert.deepEqual(counts(before), { new: 22, legacyResolve: 144, legacyExecute: 3, dual: 0, notClassifiable: 112 });
  assert.deepEqual(counts(after), { new: 23, legacyResolve: 144, legacyExecute: 3, dual: 0, notClassifiable: 111 });
  const { loadPlaytestContentPack, validateLoadedPlaytestPack, compileLoadedPlaytestPack } = await import('../packages/content/src/playtest-pack-loader');
  const { compileExecutableCardPack } = await import('../packages/rules/src/ability/executable-card-pack');
  const pack = loadPlaytestContentPack(resolve(root, 'data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: root });
  const issues = validateLoadedPlaytestPack(pack, { workspaceRoot: root });
  const library = compileLoadedPlaytestPack(pack, issues).library;
  const compiled = compileExecutableCardPack(library);
  assert.equal(issues.filter((issue) => issue.blocking).length, 0);
  const frozenPath = 'artifacts/phase3-e04-current-main-accepted-111-execution-matrix.json';
  const denominatorPath = 'data/phase3/full-roster-ability-inventory.json';
  for (const path of [frozenPath, denominatorPath, 'artifacts/phase3-e06-a-post-merge-setup-create-to-skill-recount.json']) {
    assert.equal(sha256(at(BASE, path)), sha256(at(MAIN, path)), `frozen accounting changed: ${path}`);
  }
  const frozen = parseAt(MAIN, frozenPath);
  const ids = frozen.identities.map((identity: { canonicalIdentityId: string }) => identity.canonicalIdentityId);
  assert.equal(ids.length, 111);
  assert.equal(new Set(ids).size, 111);
  const inventory = parseAt(MAIN, denominatorPath);
  const universe = [...inventory.staticSkills, ...inventory.dynamicSkills].map((row: { canonicalAbilityId: string }) => row.canonicalAbilityId);
  validateAccounting(ids, universe);
  const official = parseAt(MAIN, 'artifacts/phase3-e06-a-post-merge-setup-create-to-skill-recount.json').formalAccounting;
  assert.equal(official.acceptedCurrentMainIdentities, ids.length);
  const observationsPath = 'artifacts/phase3-e09-b11-post-merge-github-observations.json';
  const observations = JSON.parse(readFileSync(resolve(root, observationsPath), 'utf8'));
  assert.equal(observations.pr.state, 'MERGED');
  assert.equal(observations.pr.mergeCommit.oid, MAIN);
  assert.equal(observations.pr.headRefOid, HEAD);
  assert.equal(observations.pr.baseRefOid, BASE);
  validateChecks(observations.runs);
  validateTestLog(observations.testLog);
  const artifact = {
    taskId: 'P3-E09-B11-POST-MERGE-SYNC', controlEpoch: 'FD-P3-2026-09-23-09', generatedAt,
    observedMainSha: MAIN, previousMainSha: BASE, promotionHead: HEAD, synchronizationSha: SYNC,
    status: 'READY_FOR_REVIEW_POST_MERGE_SCOPE_ONLY', lineage, sourceEquivalence, evidenceBindings, preservedControls,
    githubObservation: { path: observationsPath, sha256: sha256(readFileSync(resolve(root, observationsPath))),
      requiredChecks: observations.runs, test: { filesPassed: 194, testsPassed: 1606, testsSkipped: 1, totalTests: 1607 } },
    coverage: { beforeMain: BASE, afterMain: MAIN, before: counts(before), after: counts(after),
      rawDelta: { new: 1, legacyResolve: 0, legacyExecute: 0, dual: 0, notClassifiable: -1 },
      beforeSnapshot: before, afterSnapshot: after, scopedConsumers,
      classifierSha256: sha256(at(MAIN, 'scripts/phase3-coverage.ts')) },
    compiledPack: { definitionHash: compiled.definitionHash, cards: Object.keys(compiled.cards).length,
      characters: Object.keys(compiled.characters).length, blockingIssues: 0 },
    accounting: { accepted: ids.length, denominator: universe.length, remaining: universe.length - ids.length,
      duplicates: 0, acceptedIds: ids, frozenIdentitySource: { path: frozenPath, sha256: sha256(at(MAIN, frozenPath)),
        usage: 'FROZEN_IDENTITY_LIST_ONLY; NO_A111_EXECUTION_VERDICT_INHERITED' },
      mainCoverageCreditDelta: 0, migrationCreditDelta: 0, denominatorDelta: 0,
      explanation: 'Raw routing +1 is not new canonical acceptance credit; immutable formal ledger unchanged.' },
    boundaries: { scopedImplementationMerged: true, globalGateC: 'NOT_VERIFIED',
      sourceAssets: '93_MISSING_IMAGE_RETAINED_NOT_REAUDITED', longTermStability: 'NOT_VERIFIED',
      historicalFailedReceipts: 'PRESERVED_UNCHANGED_IN_SOURCE_PACKET', fullCiLocallyRerun: false,
      runtimeReimplementedOrRereviewed: false, reservationReleased: false, nextOwner: 'Reviewer A, then Planner' },
    localValidation: { evidenceOrigin: 'A_TOOL_EXECUTION_TRANSCRIPT_NOT_NEW_RAW_LOCAL_CI_RECEIPTS',
      commands: [
        { command: 'npm ci', exitCode: 0, note: '239 packages; 12 dependency audit findings retained; no audit fix' },
        { command: 'npx vitest run scripts/tests/phase3-e09-b11-post-merge-sync.test.ts', exitCode: 0, files: 1, tests: 6 },
        { command: 'npm run typecheck', exitCode: 0 },
        { command: 'git diff --check', exitCode: 0 },
      ],
      producerDevelopmentFailures: ['Git blob exceeded default execFileSync buffer; bounded 32 MiB read added',
        'Raw ANSI log did not match plain summary; stripVTControlCharacters added while preserving raw log'],
      repeatability: 'FULL_ARTIFACT_AND_REPORT_BYTE_COMPARISON_WITH_FIXED_MAIN_TIMESTAMP_AND_COMMITTED_OBSERVATIONS' },
  };
  const artifactText = json(artifact);
  const report = `# B11 Post-Merge Synchronization\n\nObserved main: ${MAIN}\nPR: https://github.com/binchen648/fd/pull/559\nPromotion head: ${HEAD}\n\nArtifact: ${OUT}\nArtifact SHA-256: ${sha256(artifactText)}\n\nStatus: READY_FOR_REVIEW_POST_MERGE_SCOPE_ONLY\n\n- Actual merge parents, candidate/RA/G/sync ancestry, exact evidence hashes and preserved Epoch 09 controls verified.\n- Accepted carrier, promotion head and observed main have identical runtime/client/server/content/config source objects.\n- Fresh read-only coverage: 22/144/3/0/112 -> 23/144/3/0/111 (new/legacyResolve/legacyExecute/dual/notClassifiable). Raw +1 is NOT new formal credit.\n- Frozen identity list and accounting artifacts unchanged: 111/944; remaining 833; duplicates 0. A111/A112 execution verdicts are not inherited.\n- Executable pack compilation: ${Object.keys(compiled.cards).length} cards, ${Object.keys(compiled.characters).length} characters, 0 blocking issues; hash ${compiled.definitionHash}.\n- GitHub post-merge Test: 194 files; 1606 passed, 1 skipped (1607 total). Build, policy and deploy succeeded at the exact observed main. Raw API responses and full test log are hash-bound in ${observationsPath}.\n- No local full CI/browser rerun, no new runtime semantic acceptance.\n- Main coverage/migration/denominator credit deltas: 0/0/0.\n- Historical failures remain unchanged. Global Gate C NOT_VERIFIED; 93 missing-image Release blockers retained, not reaudited; long-term stability unverified.\n- No reservation release by A. Reviewer A reviews this synchronization before Planner closes B11.\n\nReproduction: run this script with --baseline-root pointing to a clean detached ${BASE} checkout. --validate compares complete artifact/report bytes using committed GitHub observations; no moving origin/main requirement.\n`;
  if (process.argv.includes('--validate')) {
    assert.equal(readFileSync(resolve(root, OUT), 'utf8'), artifactText);
    assert.equal(readFileSync(resolve(root, REPORT), 'utf8'), report);
  } else {
    writeFileSync(resolve(root, OUT), artifactText);
    writeFileSync(resolve(root, REPORT), report);
  }
  console.log(`POST_MERGE_SYNC ${process.argv.includes('--validate') ? 'REPRODUCIBLE' : 'GENERATED'} ${sha256(artifactText)}`);
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
}
