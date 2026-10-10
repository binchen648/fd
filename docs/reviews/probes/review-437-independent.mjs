import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HEAD = 'aebb2581b7172ca213371580e30c0c7e958606f8';
const BASE = 'c75ff0a7e8f514c529c08a7c214b4cd989ea0b00';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const gateway = await import(pathToFileURL(resolve('packages/rules/src/ability/batch-event-source-power-rules.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const read = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const albion = read('data/authoring/servants/servant.albion.json');
const ozy = read('data/authoring/servants/servant.ozymandias.json');
const selected = raw => raw.cards.find(card => card.id === (raw.id === 'servant.albion' ? 'servant.albion.skill.sc-albion-2' : 'servant.ozymandias.skill.sc-ozymandias-2'));
const double = raw => selected(raw).abilities.find(ability => ability.id === 'hot-sand-double-power');
const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
function setup(raw = ozy, zone = 'skill') {
  const loaded = rules.loadAuthoringJson(raw);
  const state = createSeededGameState({ activeSeats: [1, 2] }); state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  for (const player of state.players) { player.mana = 20; player.locationId = 'shinto'; }
  state.cards = [{ instanceId: 'source', definitionId: selected(raw).id, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
    visibility: zone === 'skill' ? { scope: 'owner_only', ownerPlayerId: 'p1' } : { scope: 'public' } }];
  rules.initializeAbilityRuntime(state, loaded, { seed: 437 });
  state.abilityRuntime.cardState.source = { active: zone === 'attack_area', faceDown: false, playedRound: 1 };
  return { state, loaded };
}
check('Positive: exact full texts and clauses match local frozen evidence', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json'); const rows = [...inventory.staticSkills, ...inventory.dynamicSkills];
  const hash = text => createHash('sha256').update(text).digest('hex');
  for (const raw of [albion, ozy]) {
    const card = selected(raw); const row = rows.find(row => row.canonicalAbilityId === card.id);
    assert.equal(card.printedText, row.printedText); assert.equal(hash(card.printedText), card.phase3Evidence.f1FullPrintedTextSha256);
    for (const clause of row.clauses) {
      assert.equal(hash(clause.text), clause.source.sha256);
      assert.equal(card.phase3Evidence.f1ClauseSources.find(source => source.locator === clause.source.locator).sha256, clause.source.sha256);
      assert.ok(card.abilities.some(ability => ability.printedClause === clause.text));
    }
  }
});
check('Positive: material159->161 exactly two additions, no frozen removals/duplicates', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json');
  const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId)); assert.equal(frozen.size, 944);
  const baseFiles = git('ls-tree', '-r', '--name-only', BASE, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
  const before = baseFiles.flatMap(path => (JSON.parse(git('show', `${BASE}:${path}`).replace(/^\uFEFF/, '')).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  function files(path) { return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(path, entry.name)) : entry.name.endsWith('.json') ? [join(path, entry.name)] : []); }
  const after = files('data/authoring').flatMap(path => (read(path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  assert.equal(before.length, 159); assert.equal(new Set(before).size, 159); assert.equal(after.length, 161); assert.equal(new Set(after).size, 161);
  assert.deepEqual(before.filter(id => !after.includes(id)), []);
  assert.deepEqual(after.filter(id => !before.includes(id)).sort(), ['servant.albion.skill.sc-albion-2', 'servant.ozymandias.skill.sc-ozymandias-2']);
});
check('Positive: actual play doubles for one round and retiming rejects', () => {
  const { state, loaded } = setup(); assert.deepEqual(loaded.report, []);
  rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'source' }]); assert.equal(rules.calculateCardPower(state, 'source').value, 8);
  rules.advanceAbilityPhase(state, 'preparation', 2); assert.equal(rules.calculateCardPower(state, 'source').value, 4);
  state.abilityRuntime.b04RoundSourcePowerBonuses[0].round = 2;
  assert.throws(() => rules.calculateCardPower(state, 'source'), /B04_ROUND_POWER_STATE_INVALID/);
});
check('Positive: real movement accumulates once and coordinated inflation rejects', () => {
  let { state, loaded } = setup(albion, 'attack_area'); assert.deepEqual(loaded.report, []);
  state.players[0].locationId = 'magic_workshop'; delete state.players[1].locationId;
  state = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p1', to: 'miyama_town', movementKind: 'normal' } }).nextState;
  assert.equal(rules.calculateCardPower(state, 'source').value, 8);
  state.round.activePhase = 'action'; state.players[0].mana = 20;
  state = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p1', to: 'shinto', movementKind: 'normal' } }).nextState;
  assert.equal(rules.calculateCardPower(state, 'source').value, 8); assert.equal(state.abilityRuntime.b04FirstMovementSourcePowerReceipts.length, 1);
  const receipt = state.abilityRuntime.b04FirstMovementSourcePowerReceipts[0]; const movement = state.abilityRuntime.b04MovementEventReceipts[receipt.rootEventId];
  movement.distance += 5; movement.cumulativeDistance += 5; receipt.amount += 5;
  assert.throws(() => rules.calculateCardPower(state, 'source'), /B04_MOVEMENT_RECEIPT_STATE_INVALID/);
});
for (const [field, value] of [['visibility', true], ['visibility', []], ['lifecycle', true], ['lifecycle', []], ['limit', true], ['responseWindow', true]]) {
  check(`Malformed source-play ${field}=${JSON.stringify(value)} must reject`, () => {
    const raw = structuredClone(ozy); double(raw)[field] = value;
    const rawAccepted = gateway.isAcceptedB04SourcePlayRoundDoubleAbility(double(raw));
    const checked = rules.loadAuthoringJson(raw);
    const compiledAccepted = gateway.isAcceptedB04SourcePlayRoundDoubleAbility(checked.cards[selected(raw).id].abilities.find(ability => ability.id === double(raw).id));
    if (!rawAccepted && !compiledAccepted && checked.report.some(issue => issue.status === 'unsupported')) return;
    const { state, loaded } = setup(raw); rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'source' }]);
    const power = rules.calculateCardPower(state, 'source').value;
    assert.ok(!rawAccepted && !compiledAccepted && loaded.report.some(issue => issue.status === 'unsupported') && power === 4,
      `raw=${rawAccepted}; compiled=${compiledAccepted}; issues=${loaded.report.length}; power=${power}`);
  });
}
console.log(JSON.stringify({ head: HEAD, base: BASE, results }, null, 2));
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
