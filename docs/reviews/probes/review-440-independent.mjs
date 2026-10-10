import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HEAD = 'f0e5554e3210e721ae98faa29fc5241b410c5b72';
const BASE = 'b4589eebbd09409458cf7b49d7fb7d9af6469f07';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const read = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const files = path => readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(path, entry.name)) : entry.name.endsWith('.json') ? [join(path, entry.name)] : []);
const results = [];
function check(name, fn) {
  try { results.push({ name, pass: true, observations: fn() }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
const chaos = read('data/authoring/masters/master.chaos.p3-m50-01.json');
const identity = 'master.chaos.skill.s12';
function setup(raw = chaos) {
  const pack = rules.loadAuthoringJson(raw); assert.deepEqual(pack.report, []);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  state.players[0].mana = 12; state.players[0].locationId = 'miyama_town';
  state.cards = [{ instanceId: 'source', definitionId: identity, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } }];
  rules.initializeAbilityRuntime(state, pack, { seed: 440 });
  state.abilityRuntime.cardState.source = { active: true, faceDown: false, playedRound: 1 };
  return state;
}
const activate = (state, x) => rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId: 'rush', ...(x === undefined ? {} : { variables: { x } }) });
check('Positive: exactly 50 new unique frozen identities, 41 archives, all load without report', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json');
  const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId)); assert.equal(frozen.size, 944);
  const batchFiles = files('data/authoring').filter(path => path.endsWith('.p3-m50-01.json')); assert.equal(batchFiles.length, 41);
  const ids = batchFiles.flatMap(path => {
    const raw = read(path); assert.deepEqual(rules.loadAuthoringJson(raw).report, []);
    assert.equal(raw.sourcePolicy.referenceMetadataCommit, 'b2f9fa15fba07c63530bbf4612b03b8b704755f9');
    return raw.cards.map(card => card.id);
  });
  assert.equal(ids.length, 50); assert.equal(new Set(ids).size, 50); assert.ok(ids.every(id => frozen.has(id)));
  const basePaths = git('ls-tree', '-r', '--name-only', BASE, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
  const before = basePaths.flatMap(path => (JSON.parse(git('show', `${BASE}:${path}`).replace(/^\uFEFF/, '')).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  const after = files('data/authoring').flatMap(path => (read(path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  assert.equal(before.length, 165); assert.equal(new Set(before).size, 165);
  assert.equal(after.length, 215); assert.equal(new Set(after).size, 215);
  assert.deepEqual(before.filter(id => !after.includes(id)), []);
  assert.deepEqual(after.filter(id => !before.includes(id)).sort(), ids.sort());
  assert.ok(!readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8').includes('.p3-m50-01.json'));
  return { before: 165, after: 215, added: 50, archives: 41, denominator: 944, runtimeAcceptance: false };
});
check('Reproduction: legal Chaos action cannot receive required X; printed and AST bounds also disagree', () => {
  const card = chaos.cards.find(card => card.id === identity);
  assert.ok(card.printedText.includes('1~8'));
  const ability = card.abilities.find(ability => ability.id === 'rush');
  assert.ok(ability.printedClause.includes('1 and 3')); assert.equal(ability.effects[0].maxForwardSteps.max, 3);
  const outcomes = [];
  for (const x of [undefined, 1, 3, 4, 8]) {
    const state = setup(); const before = structuredClone(state); const rejected = activate(state, x);
    assert.ok(rejected.view.legalActions.some(action => action.abilityId === 'rush'));
    assert.equal(rejected.ok, false); assert.deepEqual(state, before);
    if (x !== undefined) assert.equal(rejected.rejection.message, 'Unexpected variable');
    outcomes.push({ x: x ?? 'omitted', rejection: rejected.rejection });
  }
  return { outcomes, printedMaximum: 8, executableMaximum: 3, externalRuleAuthorityVerified: false };
});
check('Reproduction: new structured flag setter silently loses __proto__ while ordinary key succeeds', () => {
  const run = key => {
    const raw = structuredClone(chaos); raw.cards = raw.cards.filter(card => card.id === identity);
    const ability = raw.cards[0].abilities.find(ability => ability.id === 'rush');
    ability.effects = [{ type: 'set_player_flag', target: 'controller', key, value: true }];
    const state = setup(raw); const result = activate(state); assert.equal(result.ok, true, JSON.stringify(result));
    const flags = state.abilityRuntime.structuredPlayerFlagsByPlayer.p1;
    return { dispatchOk: result.ok, hasOwnKey: Object.hasOwn(flags, key), booleanValuePreserved: flags[key] === true };
  };
  const control = run('review_flag'); assert.equal(control.hasOwnKey, true); assert.equal(control.booleanValuePreserved, true);
  const reserved = run('__proto__'); assert.equal(reserved.hasOwnKey, false); assert.equal(reserved.booleanValuePreserved, false);
  return { ordinary: control, reserved, syntheticEnvelope: true, shippedReservedKeyConsumerClaimed: false };
});
process.stdout.write(`${JSON.stringify({ headSha: HEAD, baseSha: BASE, producer: 'Independent takeover reviewer', results }, null, 2)}\n`);
if (results.some(result => !result.pass)) process.exitCode = 1;
