import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HEAD = '156c66ce5f87038b139b2a0ad5916b4a4078f17a';
const BASE = '8e88fdb5290a6635cb4b9f8d887bb0921d5a3c1e';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const owned = await import(pathToFileURL(resolve('packages/rules/src/ability/batch-owned-passive-rules.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const read = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const arc = read('data/authoring/masters/master.arcueid.json');
const twice = read('data/authoring/masters/master.twice.json');
const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
function setup(raw = arc, duplicate = false) {
  const loaded = rules.loadAuthoringJson(raw); const sourceDefinitionId = raw.cards[0].id;
  const basic = { id: 'review.basic', name: 'basic', cardType: 'basic_attack', cardFace: { typeLabel: 'test', cost: 1, basePower: 3, attributes: ['\u529b\u91cf'] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic', playKind: 'attack', destinationZone: 'attack_area' };
  const state = createSeededGameState({ activeSeats: [1, 2] }); state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  for (const player of state.players) { player.locationId = 'shinto'; player.mana = 20; }
  state.cards = [{ instanceId: 'source', definitionId: sourceDefinitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'basic', definitionId: basic.id, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  if (duplicate) state.cards.push({ ...state.cards[0], instanceId: 'source.duplicate' });
  rules.initializeAbilityRuntime(state, { cards: { ...loaded.cards, [basic.id]: basic } }, { seed: 435 });
  for (const card of state.cards) state.abilityRuntime.cardState[card.instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return { state, loaded };
}
check('Positive: both full texts and all clauses match local pinned frozen inventory/hash evidence', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json'); const rows = [...inventory.staticSkills, ...inventory.dynamicSkills];
  const hash = text => createHash('sha256').update(text).digest('hex');
  for (const raw of [arc, twice]) {
    const card = raw.cards[0]; const row = rows.find(row => row.canonicalAbilityId === card.id);
    assert.equal(card.printedText, row.printedText); assert.equal(hash(card.printedText), card.phase3Evidence.f1FullPrintedTextSha256);
    for (const clause of row.clauses) {
      assert.equal(hash(clause.text), clause.source.sha256);
      assert.equal(card.phase3Evidence.f1ClauseSources.find(source => source.locator === clause.source.locator).sha256, clause.source.sha256);
      assert.ok(card.abilities.some(ability => ability.printedClause === clause.text));
    }
  }
});
check('Positive: material155->157, exactly two additions, no frozen removals or duplicates', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json'); const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId)); assert.equal(frozen.size, 944);
  const baseFiles = git('ls-tree', '-r', '--name-only', BASE, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
  const before = baseFiles.flatMap(path => (JSON.parse(git('show', `${BASE}:${path}`).replace(/^\uFEFF/, '')).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  function files(path) { return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(path, entry.name)) : entry.name.endsWith('.json') ? [join(path, entry.name)] : []); }
  const after = files('data/authoring').flatMap(path => (read(path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  assert.equal(before.length, 155); assert.equal(new Set(before).size, 155); assert.equal(after.length, 157); assert.equal(new Set(after).size, 157);
  assert.deepEqual(before.filter(id => !after.includes(id)), []);
  assert.deepEqual(after.filter(id => !before.includes(id)).sort(), ['master.arcueid.skill.s3', 'master.twice.skill.ascension']);
});
check('Positive: basic power/cost, source removal and authoritative round-end loss', () => {
  const { state, loaded } = setup(); assert.deepEqual(loaded.report, []);
  assert.equal(rules.calculateCardPower(state, 'basic').value, 5);
  rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'basic' }]); assert.equal(state.players[0].mana, 18); assert.equal(state.abilityRuntime.cardState.basic.paidManaOnPlay, 2);
  state.players[0].vp = 3; rules.advanceAbilityPhase(state, 'round_end'); assert.equal(state.players[0].vp, 1);
  state.cards[0].zone = 'removed_from_game'; assert.equal(rules.calculateCardPower(state, 'basic').value, 3);
  rules.advanceAbilityPhase(state, 'round_end', 2); assert.equal(state.players[0].vp, 1);
});
function threshold(state) {
  state.players[0].militaryResult = -7;
  state.battleResults = [{ battlefieldId: 'shinto', winnerPlayerIds: [], tied: false, winnerPlayerId: null, margin: 1, vpReward: 0,
    militaryAdjustments: [{ playerId: 'p1', delta: -1 }], participantBreakdowns: [] }];
}
check('Positive: military-threshold replacement consumes once and conflicts roll back original state', () => {
  const { state } = setup(twice); threshold(state); const before = structuredClone(state);
  const first = rules.applyBattleScoring(state).nextState; assert.deepEqual(state, before);
  assert.equal(first.players[0].status, 'active'); assert.equal(first.cards[0].zone, 'removed_from_game');
  threshold(first); assert.equal(rules.applyBattleScoring(first).nextState.players[0].status, 'eliminated');
  const conflict = setup(twice, true).state; threshold(conflict); const original = structuredClone(conflict);
  assert.throws(() => rules.applyBattleScoring(conflict), /B02_ELIMINATION_REPLACEMENT_CONFLICT/); assert.deepEqual(conflict, original);
});
for (const [field, value] of [['visibility', true], ['visibility', []], ['limit', true], ['limit', []], ['activation', 7], ['lifecycle', true], ['responseWindow', true]]) {
  check(`Malformed ${field}=${JSON.stringify(value)} cannot apply basic power/cost`, () => {
    const raw = structuredClone(arc); raw.cards[0].abilities = [raw.cards[0].abilities[0]]; raw.cards[0].abilities[0][field] = value;
    const rawAccepted = owned.isAcceptedB02OwnedBasicAttackRuleAbility(raw.cards[0].abilities[0]);
    const { state, loaded } = setup(raw); const compiledAccepted = owned.isAcceptedB02OwnedBasicAttackRuleAbility(loaded.cards[raw.cards[0].id].abilities[0]);
    const power = rules.calculateCardPower(state, 'basic').value;
    const adjustment = owned.b02OwnedBasicAttackAdjustment(state, 'basic');
    assert.ok(!rawAccepted && !compiledAccepted && loaded.report.some(issue => issue.status === 'unsupported') && power === 3 && adjustment.cost === 0,
      `raw=${rawAccepted}; compiled=${compiledAccepted}; issues=${loaded.report.length}; power=${power}; surcharge=${adjustment.cost}`);
  });
}
console.log(JSON.stringify({ head: HEAD, base: BASE, results }, null, 2));
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
