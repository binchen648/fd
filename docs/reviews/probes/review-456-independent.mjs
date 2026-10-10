import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const HEAD = '83cac6ef2a1334b823e37c873d0a1a2c8e819cb9';
const BASE = '3b2d78ae931a0ded23f98ec1e513768dea9c78de';
const R1 = '10a22583f5e911ae4f812e82417b866006d6eaab';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 30000000 }).trim();
const json = (sha, path) => JSON.parse(git('show', `${sha}:${path}`).replace(/^\uFEFF/, ''));
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { compileExecutableCardPack } = await import(pathToFileURL(resolve('packages/rules/src/ability/executable-card-pack.ts')).href);
const { compileLoadedPlaytestPack, loadPlaytestContentPack } = await import(pathToFileURL(resolve('packages/content/src/index.ts')).href);
const source = compileLoadedPlaytestPack(loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: resolve('.') })).library;
const original = compileExecutableCardPack(source);
function fixture(kind = 'servant') {
  const input = structuredClone(source);
  const archive = input.rules.archives.find(archive => archive.id.startsWith(`${kind}.`) && archive.cards.some(card => card.cardType === `${kind}_skill`));
  assert.ok(archive); const card = archive.cards.find(card => card.cardType === `${kind}_skill`);
  card.initialPlacement = 'outside_game'; return { input, archive, card };
}
const results = [];
function check(name, fn) { try { results.push({ name, pass: true, observations: fn() }); } catch(error) { results.push({ name, pass: false, detail: String(error) }); } }
check('Exact servant owner accepted,deferred definition retained,no other executable definition changed', () => {
  const { input, archive, card } = fixture(); const before = structuredClone(input);
  assert.deepEqual(card.owner, { type: 'servant', id: archive.id });
  const loaded = rules.loadAuthoringJson(archive); assert.deepEqual(loaded.report, []);
  assert.equal(loaded.cards[card.id].initialPlacement, 'outside_game');
  const compiled = compileExecutableCardPack(input);
  assert.equal(compiled.cards[card.id].ownerId, archive.id);
  assert.equal(compiled.cards[card.id].initialPlacement, 'outside_game');
  assert.equal(compiled.cards[card.id].initialZone, undefined);
  const expected = structuredClone(original.cards[card.id]); expected.initialPlacement = 'outside_game'; delete expected.initialZone;
  assert.deepEqual(compiled.cards[card.id], expected);
  for (const id of Object.keys(original.cards)) if (id !== card.id) assert.deepEqual(compiled.cards[id], original.cards[id]);
  assert.deepEqual(input, before);
  return { deferredDefinitionsRetained: 1, initialSkillZoneAssigned: false, compilerInputMutated: false, otherDefinitionsChanged: 0 };
});
check('Ordinary servant and legacy owned-master placement preserved', () => {
  const { archive, card } = fixture(); const plain = original.cards[card.id];
  assert.equal(plain.initialPlacement, undefined); assert.equal(plain.initialZone, 'skill');
  const master = fixture('master'); const loaded = rules.loadAuthoringJson(master.archive);
  assert.deepEqual(loaded.report, []); const compiled = compileExecutableCardPack(master.input);
  assert.equal(compiled.cards[master.card.id].initialPlacement, 'outside_game');
  assert.equal(compiled.cards[master.card.id].initialZone, undefined);
  assert.equal(compiled.cards[master.card.id].ownerId, master.archive.id);
  return { ordinaryServantZone: 'skill', masterDeferralPreserved: true, ordinaryOwnerUnchanged: archive.id === plain.ownerId };
});
check('Eleven malformed servant owner variants fail at both loader and compiler', () => {
  const owners = [undefined, null, false, [], {}, { type: 'master', id: 'master.fixture' }, { type: 'servant', id: 'servant.other' },
    { type: 'servant' }, { id: 'servant.fixture' }, 'servant.fixture', { type: 'servant', id: 1 }];
  for (const owner of owners) {
    const { input, archive, card } = fixture(); card.owner = owner;
    const loaded = rules.loadAuthoringJson(archive);
    assert.ok(loaded.report.some(issue => issue.path === 'initialPlacement'));
    assert.equal(loaded.cards[card.id].initialPlacement, undefined);
    assert.throws(() => compileExecutableCardPack(input), /owner-matching servant_skill/);
  }
  return { rejectedOwners: owners.length, loaderCompilerAgree: true };
});
check('R1 extra-owner-field reproduction now rejects exact matching type/id plus extra data', () => {
  const { input, archive, card } = fixture(); card.owner = { type: 'servant', id: archive.id, extra: 'near-match' };
  const pack = rules.loadAuthoringJson(archive); assert.ok(pack.report.some(issue => issue.path === 'initialPlacement'));
  assert.equal(pack.cards[card.id].mode, 'unsupported');
  assert.throws(() => compileExecutableCardPack(input), /owner-matching servant_skill/);
  return { matchingOwnerWithExtraFieldAccepted: false, r1Candidate: R1 };
});
check('Malformed placement literals/types rejected for servant and master', () => {
  const values = ['skill', '', null, 1, true, [], {}];
  for (const kind of ['servant', 'master']) for (const value of values) {
    const { input, archive, card } = fixture(kind); card.initialPlacement = value;
    assert.ok(rules.loadAuthoringJson(archive).report.some(issue => issue.path === 'initialPlacement'));
    assert.throws(() => compileExecutableCardPack(input), /initialPlacement/);
  }
  return { invalidPlacements: values.length * 2 };
});
check('Wrong type/namespace combinations cannot acquire outside-game placement', () => {
  for (const [kind, type] of [['servant', 'master_skill'], ['servant', 'command_spell'], ['master', 'servant_skill']]) {
    const { input, archive, card } = fixture(kind); card.cardType = type;
    assert.ok(rules.loadAuthoringJson(archive).report.some(issue => issue.path === 'initialPlacement'));
    assert.throws(() => compileExecutableCardPack(input), /initialPlacement/);
  }
  return { mismatchedTypeNamespaces: 3 };
});
check('Exact task/scope and revision ancestry,not false direct-child claim', () => {
  assert.equal(git('merge-base', BASE, HEAD), BASE);
  assert.equal(git('rev-parse', `${HEAD}^`), R1);
  assert.equal(git('rev-parse', `${R1}^`), BASE);
  assert.equal(git('rev-list', '--count', `${BASE}..${HEAD}`), '2');
  assert.deepEqual(git('diff', '--name-only', BASE, HEAD).split('\n').sort(), [
    'docs/reports/2026-09-26-p3-b-main-replay-outside-game-owned-servant-skill-result.md',
    'packages/rules/src/ability/executable-card-pack.ts', 'packages/rules/src/ability/loader.ts',
    'packages/rules/tests/regression/fb2-explicit-outside-game-initial-placement.test.ts',
  ]);
  const task = git('show', `${BASE}:docs/agents/PHASE3-TASK-INDEX.md`);
  assert.ok(task.includes('## TASK P3-B-MAIN-REPLAY-OUTSIDE-GAME-OWNED-SERVANT-SKILL'));
  assert.equal(git('diff', '--name-only', BASE, HEAD, '--', 'data', 'apps'), ''); git('diff', '--check', BASE, HEAD);
  return { currentTaskBound: true, changedPaths: 4, commitsAboveBase: 2, directParent: R1, authoringProductChanges: 0 };
});
check('Complete frozen recount unchanged112/944,zero credit', () => {
  const inventory = json(BASE, 'data/phase3/full-roster-ability-inventory.json');
  const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId)); assert.equal(frozen.size, 944);
  function material(sha) {
    const paths = git('ls-tree', '-r', '--name-only', sha, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
    const ids = paths.flatMap(path => (json(sha, path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id)).sort();
    assert.equal(ids.length, 112); assert.equal(new Set(ids).size, 112); return ids;
  }
  assert.deepEqual(material(BASE), material(HEAD));
  return { material: 112, frozen: 944, additions: 0, removals: 0, duplicates: 0, formalAcceptanceRecomputed: false };
});
process.stdout.write(`${JSON.stringify({ pr: 456, targetSha: HEAD, results }, null, 2)}\n`);
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
