import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';

const HEAD = '855ae96f509f9a9dccb243b3d276f4ccf1d67288';
const BASE = '8842186ca3653775d35dd07eff1965606532da66';
const HISTORICAL_MAIN = '4b52b3166ed2ba0efaa4569ee95c6513fd26ab2f';
const SOURCE_BASE = '822b5f9dfd05a64a5707fcb945b8b85eff2238e6';
const SOURCE = 'aa04a12e1647560374e09f7e2b6e62a5dccd0954';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 30000000 }).trim();
const read = (sha, path) => git('show', `${sha}:${path}`);
const json = (sha, path) => JSON.parse(read(sha, path).replace(/^\uFEFF/, ''));
const exists = (sha, path) => git('ls-tree', sha, path).length > 0;
const results = [];
function check(name, fn) {
  try { results.push({ name, pass: true, observations: fn() }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}

check('Exact lineage and docs-only scope', () => {
  assert.equal(git('rev-parse', `${HEAD}^`), BASE);
  assert.equal(git('merge-base', HISTORICAL_MAIN, BASE), HISTORICAL_MAIN);
  assert.deepEqual(git('diff', '--name-only', BASE, HEAD).split('\n').sort(), [
    'docs/agents/PHASE3-TASK-INDEX.md',
    'docs/reports/2026-09-25-p3-b-main-replay-fb2-49-blocked.md',
  ]);
  assert.equal(git('diff', '--name-only', BASE, HEAD, '--', 'packages', 'apps', 'data'), '');
  git('diff', '--check', BASE, HEAD);
  return { parent: BASE, historicalMainAncestor: true, changedDocs: 2, runtimeContentChanges: 0 };
});

check('Required close-forbid prerequisite is absent on replay lineage, present in source', () => {
  const path = 'packages/rules/src/ability/card-close-forbid.ts';
  for (const sha of [HISTORICAL_MAIN, BASE, HEAD]) assert.equal(exists(sha, path), false);
  for (const sha of [SOURCE_BASE, SOURCE]) assert.equal(exists(sha, path), true);
  const source = read(SOURCE, 'packages/rules/src/ability/interpreter.ts');
  assert.ok(source.includes("import { isCardCloseForbidden } from './card-close-forbid'"));
  const start = source.indexOf('const closeIds = meta.qualifyingCardIds.filter');
  const guard = source.indexOf('if (closeIds.some((instanceId) => isCardCloseForbidden(s, instanceId)))', start);
  const mutation = source.indexOf('for (const instanceId of closeIds) closeOpponentCardForCloseToOne', start);
  assert.ok(start >= 0 && guard > start && mutation > guard);
  assert.ok(source.slice(guard, mutation).includes("reject('resolution_failed'"));
  const result = read(SOURCE, 'docs/reports/2026-09-21-p3-b2-fb2-49-opponent-close-to-one-interaction-result.md');
  assert.match(result, /FB2-42/); assert.match(result, /card_close/);
  const baseInterpreter = read(BASE, 'packages/rules/src/ability/interpreter.ts');
  assert.ok(!baseInterpreter.includes('isCardCloseForbidden'));
  return { missingOnHistoricalReplayBase: true, sourcePreMutationGuard: true, fullRuntimeCorrectnessVerified: false };
});

check('Dispatch requires fail-closed stop; result preserves authorization boundaries', () => {
  const dispatch = read(BASE, 'docs/reports/2026-09-25-p3-a-main-replay-fb2-49-dispatch.md');
  assert.ok(dispatch.includes('If current main lacks a prerequisite required for faithful replay, B stops'));
  assert.ok(dispatch.includes('instead of widening the import'));
  for (const value of [SOURCE_BASE, SOURCE, '5775423822']) assert.ok(dispatch.includes(value));
  const oldIndex = read(BASE, 'docs/agents/PHASE3-TASK-INDEX.md');
  const newIndex = read(HEAD, 'docs/agents/PHASE3-TASK-INDEX.md');
  const start = oldIndex.indexOf('## TASK P3-B-MAIN-REPLAY-FB2-49');
  assert.ok(start >= 0);
  assert.equal(newIndex, oldIndex.slice(0, start) + oldIndex.slice(start).replace(
    'Status: `READY`\nBase: exact `P3-A-MAIN-REPLAY-FB2-49-DISPATCH` commit carrying this task block',
    'Status: `IMPLEMENTATION_BLOCKED`\nBase: exact A dispatch `8842186ca3653775d35dd07eff1965606532da66`\nBlocker report: `docs/reports/2026-09-25-p3-b-main-replay-fb2-49-blocked.md`\nResult: current main lacks the accepted FB2-42 `card_close` forbid prerequisite that the exact #422 FB2-49 accepted runtime checks before any close mutation. The replay therefore stops fail-closed without importing FB2-42 or any frontier consumer material. Next A action is a separate zero-credit current-main semantic replay of FB2-42, then re-dispatch FB2-49 from that synchronized capability lineage.',
  ));
  const report = read(HEAD, 'docs/reports/2026-09-25-p3-b-main-replay-fb2-49-blocked.md');
  for (const value of [BASE, HISTORICAL_MAIN, SOURCE_BASE, SOURCE]) assert.ok(report.includes(value));
  assert.ok(report.includes('migration credit: `0`'));
  assert.ok(report.includes('No fresh R is requested for this blocked B task'));
  return { result: 'IMPLEMENTATION_BLOCKED', newRuntimeAuthorization: false, credit: 0 };
});

check('Frozen material recount is unchanged at 111/944', () => {
  const path = 'data/phase3/full-roster-ability-inventory.json';
  const inventory = json(BASE, path);
  const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId));
  assert.equal(frozen.size, 944);
  function material(sha) {
    assert.deepEqual(json(sha, path), inventory);
    const paths = git('ls-tree', '-r', '--name-only', sha, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
    const ids = paths.flatMap(path => (json(sha, path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id)).sort();
    assert.equal(ids.length, 111); assert.equal(new Set(ids).size, 111); return ids;
  }
  const before = material(BASE);
  assert.deepEqual(material(HEAD), before);
  assert.deepEqual(material(HISTORICAL_MAIN), before);
  return { material: 111, frozen: 944, additions: 0, removals: 0, formalAcceptanceRecomputed: false };
});

if (process.argv.includes('--github')) check('Historical review correctly binds source, not this reviewer reruns', () => {
  const response = spawnSync('gh', ['api', 'repos/binchen648/fd/issues/comments/5775423822'], { encoding: 'utf8', maxBuffer: 2000000 });
  assert.equal(response.status, 0, response.stderr);
  const comment = JSON.parse(response.stdout);
  assert.equal(comment.html_url, 'https://github.com/binchen648/fd/pull/422#issuecomment-5775423822');
  assert.ok(comment.body.includes(`Base: ${SOURCE_BASE}`));
  assert.ok(comment.body.includes(`Candidate: ${SOURCE}`));
  assert.ok(comment.body.includes('verdict: IMPLEMENTATION_ACCEPTED_CANDIDATE'));
  return { sourcePr: 422, commentId: comment.id, sourceBinding: true, sourceTestsRerunHere: false };
});
process.stdout.write(`${JSON.stringify({ pr: 443, targetSha: HEAD, results }, null, 2)}\n`);
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
