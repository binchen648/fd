import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const HEAD = 'fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff';
const BASE = 'f688876fa11b86130e2b8999eaffb23cab79798a';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const read = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const files = path => readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(path, entry.name)) : entry.name.endsWith('.json') ? [join(path, entry.name)] : []);
const results = [];
function check(name, fn) { try { results.push({ name, pass: true, observations: fn() }); } catch(error) { results.push({ name, pass: false, detail: String(error) }); } }
check('Whole roster: 42 archives/50 unique frozen additions/215->265/no removals or duplicates', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json');
  const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId)); assert.equal(frozen.size, 944);
  const batchFiles = files('data/authoring').filter(path => path.endsWith('.p3-m50-02.json')); assert.equal(batchFiles.length, 42);
  const ids = batchFiles.flatMap(path => { const raw = read(path); assert.deepEqual(rules.loadAuthoringJson(raw).report, []); return raw.cards.map(card => card.id); });
  assert.equal(ids.length, 50); assert.equal(new Set(ids).size, 50); assert.ok(ids.every(id => frozen.has(id)));
  const paths = git('ls-tree', '-r', '--name-only', BASE, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
  const before = paths.flatMap(path => (JSON.parse(git('show', `${BASE}:${path}`).replace(/^\uFEFF/, '')).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  const after = files('data/authoring').flatMap(path => (read(path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  assert.equal(before.length, 215); assert.equal(new Set(before).size, 215); assert.equal(after.length, 265); assert.equal(new Set(after).size, 265);
  assert.deepEqual(before.filter(id => !after.includes(id)), []); assert.deepEqual(after.filter(id => !before.includes(id)).sort(), ids.sort());
  assert.ok(!readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8').includes('.p3-m50-02.json'));
  return { added: 50, archives: 42, before: 215, after: 265, runtimeAcceptance: false };
});
const ciel = read('data/authoring/masters/master.ciel.p3-m50-02.json');
const ASC = 'master.ciel.skill.ascension';
function apply(raw) {
  const loaded = rules.loadAuthoringJson(raw); assert.deepEqual(loaded.report, []);
  const ability = loaded.cards[ASC].abilities[0]; assert.equal(rules.isAcceptedM50GrantedCardAbilitySource(ability), true);
  const state = createSeededGameState({ activeSeats: [1, 2] }); state.round.activePhase = 'battle'; state.round.prioritySeat = 1;
  state.players[0].locationId = 'miyama_town'; state.players[1].locationId = 'miyama_town';
  loaded.cards['fixture.strength'] = { id: 'fixture.strength', name: 'fixture', cardType: 'basic_attack', cardFace: { cost: 0, basePower: 3, attributes: ['力量'] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
  state.cards = [{ instanceId: 'source', definitionId: ASC, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }, { instanceId: 'attack', definitionId: 'fixture.strength', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } }];
  rules.initializeAbilityRuntime(state, loaded, { seed: 441 }); state.abilityRuntime.cardState.attack = { active: true, faceDown: false, playedRound: 1 };
  assert.equal(rules.calculateCardPower(state, 'attack').value, 7);
  const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'attack', abilityId: 'expanded-soul-crush' });
  assert.equal(result.ok, true, JSON.stringify(result.rejection)); assert.equal(state.abilityRuntime.situationBenefitsSuppressedRoundByPlayer.p2, 2);
  return { issues: 0, compiledAccepted: true, dispatchOk: true, nextRoundSuppressed: true };
}
check('Positive: actual Ciel grant executes +4 and next-round suppression', () => apply(ciel));
for (const field of ['limit', 'lifecycle', 'responseWindow']) for (const value of [true, []]) {
  check(`Reproduction: malformed new grant ${field}=${JSON.stringify(value)} accepted and executed`, () => {
    const raw = structuredClone(ciel); const ability = raw.cards.find(card => card.id === ASC).abilities[0]; ability[field] = value;
    assert.equal(rules.isAcceptedM50GrantedCardAbilitySource(ability), true);
    return { rawAccepted: true, ...apply(raw) };
  });
}
process.stdout.write(`${JSON.stringify({ headSha: HEAD, baseSha: BASE, producer: 'Independent takeover reviewer', results }, null, 2)}\n`);
if (results.some(result => !result.pass)) process.exitCode = 1;
