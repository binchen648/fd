import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HEAD = '2128ae7fc51cdaf0d9ae1a3cc37c46fe699b83b4';
const BASE = '27cc057893738e0c64a1db0148b9132c9b4429e2';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const batch = await import(pathToFileURL(resolve('packages/rules/src/ability/batch-passive-card-rules.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const read = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const gorgon = read('data/authoring/servants/servant.gorgon.json');
const hash = text => createHash('sha256').update(text).digest('hex');
const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
function stateFrom(pack) {
  const state = createSeededGameState({ activeSeats: [1, 2] }); state.round.activePhase = 'battle';
  for (const player of state.players) player.locationId = 'shinto';
  const id = Object.keys(pack.cards)[0];
  state.cards = [{ instanceId: 'source', definitionId: id, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } }];
  rules.initializeAbilityRuntime(state, pack, { seed: 434 });
  state.abilityRuntime.cardState.source = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}
function lossDelta(state) {
  const result = rules.resolveBattlefield(state, { battlefieldId: 'shinto', participants: [{ playerId: 'p1', totalPower: 1 }, { playerId: 'p2', totalPower: 5 }] }).nextState.battleResults.at(-1);
  return result.militaryAdjustments.find(entry => entry.playerId === 'p1').delta;
}
check('Positive: all four authoring texts and clause hashes match pinned local frozen inventory', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json'); const rows = [...inventory.staticSkills, ...inventory.dynamicSkills];
  for (const [owner, suffix] of [['atalanta', '1'], ['gorgon', '2'], ['mechaeli', '2'], ['ibaraki', '1']]) {
    const raw = read(`data/authoring/servants/servant.${owner}.json`);
    const id = `servant.${owner}.skill.sc-${owner}-${suffix}`; const card = raw.cards.find(card => card.id === id); const row = rows.find(row => row.canonicalAbilityId === id);
    assert.equal(card.printedText, row.printedText);
    assert.equal(hash(card.printedText), card.phase3Evidence.f1FullPrintedTextSha256 ?? card.phase3Evidence.sourceTextSha256);
    for (const clause of row.clauses) {
      assert.equal(hash(clause.text), clause.source.sha256);
      const evidence = card.phase3Evidence.f1ClauseSources.find(source => source.locator === clause.source.locator);
      assert.equal(evidence.sha256, clause.source.sha256);
      assert.ok(card.abilities.some(ability => ability.printedClause === clause.text));
    }
  }
});
check('Positive: exact material recount 151 to 155, four additions, no removals or frozen duplicates', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json'); const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId)); assert.equal(frozen.size, 944);
  const baseFiles = git('ls-tree', '-r', '--name-only', BASE, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
  const baseIds = baseFiles.flatMap(path => (JSON.parse(git('show', `${BASE}:${path}`).replace(/^\uFEFF/, '')).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  function files(path) { return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(path, entry.name)) : entry.name.endsWith('.json') ? [join(path, entry.name)] : []); }
  const currentIds = files('data/authoring').flatMap(path => (read(path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  assert.equal(baseIds.length, 151); assert.equal(new Set(baseIds).size, 151); assert.equal(currentIds.length, 155); assert.equal(new Set(currentIds).size, 155);
  assert.deepEqual(baseIds.filter(id => !currentIds.includes(id)), []);
  assert.deepEqual(currentIds.filter(id => !baseIds.includes(id)).sort(), ['servant.atalanta.skill.sc-atalanta-1', 'servant.gorgon.skill.sc-gorgon-2', 'servant.ibaraki.skill.sc-ibaraki-1', 'servant.mechaeli.skill.sc-mechaeli-2']);
});
check('Positive: Ibaraki is byte-identical historical material, not fresh credit', () => {
  assert.equal(git('rev-parse', `${HEAD}:data/authoring/servants/servant.ibaraki.json`), 'cf6564a62032cfc4d9f1d6580005305b96ecfad3');
  assert.equal(git('rev-parse', '78ab99ce3136f654e53ec922466c26d4751b1917:data/authoring/servants/servant.ibaraki.json'), 'cf6564a62032cfc4d9f1d6580005305b96ecfad3');
});
check('Positive: exact active defeat immunity, source invalidation and widened explicit modifier rejection', () => {
  const pack = rules.loadAuthoringJson(gorgon); assert.deepEqual(pack.report, []); const state = stateFrom(pack);
  assert.equal(lossDelta(state), 0); state.abilityRuntime.cardState.source.active = false; assert.ok(lossDelta(state) < 0);
  const raw = structuredClone(gorgon); raw.cards[0].abilities[1].ruleModifiers[0].scope.subject = 'all_players';
  assert.equal(batch.isAcceptedDefeatIgnoreAbility(raw.cards[0].abilities[1]), false);
  assert.ok(rules.loadAuthoringJson(raw).report.some(issue => issue.status === 'unsupported'));
});
for (const [field, value] of [['visibility', true], ['visibility', []], ['limit', true], ['limit', []], ['activation', 7], ['responseWindow', true]]) {
  check(`Malformed ${field}=${JSON.stringify(value)} cannot grant defeat immunity`, () => {
    const raw = structuredClone(gorgon); raw.cards[0].abilities = [raw.cards[0].abilities[1]];
    raw.cards[0].abilities[0][field] = value;
    const rawAccepted = batch.isAcceptedDefeatIgnoreAbility(raw.cards[0].abilities[0]);
    const pack = rules.loadAuthoringJson(raw); const compiledAccepted = batch.isAcceptedDefeatIgnoreAbility(pack.cards[raw.cards[0].id].abilities[0]);
    const delta = lossDelta(stateFrom(pack));
    assert.ok(!rawAccepted && !compiledAccepted && pack.report.some(issue => issue.status === 'unsupported') && delta < 0,
      `raw=${rawAccepted}; compiled=${compiledAccepted}; issues=${pack.report.length}; lossDelta=${delta}`);
  });
}
console.log(JSON.stringify({ head: HEAD, base: BASE, results }, null, 2));
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
