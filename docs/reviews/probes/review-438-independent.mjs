import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HEAD = '14aee956ac561c4460dd7923d6155b26b7ee822c';
const BASE = '1f5e929def8e2d51893ab5ad86041faed0a74a7e';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const gateway = await import(pathToFileURL(resolve('packages/rules/src/ability/batch-event-resource-lifecycle-rules.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const read = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const edison = read('data/authoring/servants/servant.edison.json');
const kama = read('data/authoring/servants/servant.kama.json');
const selected = raw => raw.cards.find(card => card.id === (raw.id === 'servant.edison' ? 'servant.edison.skill.sc-edison-2' : 'servant.kama.skill.sc-kama-2'));
const low = raw => selected(raw).abilities.find(ability => ability.id === 'mass-production-low-mana-close');
const physical = (instanceId, definitionId, zone = 'attack_area') => ({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
  visibility: zone === 'skill' ? { scope: 'owner_only', ownerPlayerId: 'p1' } : { scope: 'public' } });
const results = [];
const locatorDifferences = [];
function check(name, fn) {
  try { fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
function setup(raw = edison, zone = 'skill') {
  const loaded = rules.loadAuthoringJson(raw); const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  for (const player of state.players) { player.mana = 20; player.vp = 3; player.locationId = 'shinto'; }
  state.cards = [physical('source', selected(raw).id, zone)];
  rules.initializeAbilityRuntime(state, loaded, { seed: 438 });
  state.abilityRuntime.cardState.source = { active: zone === 'attack_area', faceDown: false, playedRound: 1 };
  return { state, loaded };
}
check('Positive: full texts and clause hashes match local frozen evidence; locator authority is separate', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json'); const rows = [...inventory.staticSkills, ...inventory.dynamicSkills];
  const hash = text => createHash('sha256').update(text).digest('hex');
  for (const raw of [edison, kama]) {
    const card = selected(raw); const row = rows.find(row => row.canonicalAbilityId === card.id);
    assert.equal(card.printedText, row.printedText); assert.equal(hash(card.printedText), card.phase3Evidence.f1FullPrintedTextSha256);
    for (const clause of row.clauses) {
      assert.equal(hash(clause.text), clause.source.sha256);
      assert.ok(card.phase3Evidence.f1ClauseSources.some(source => source.sha256 === clause.source.sha256));
      if (!card.phase3Evidence.f1ClauseSources.some(source => source.locator === clause.source.locator && source.sha256 === clause.source.sha256)) {
        locatorDifferences.push({ identity: card.id, frozenLocator: clause.source.locator,
          candidateLocators: card.phase3Evidence.f1ClauseSources.filter(source => source.sha256 === clause.source.sha256).map(source => source.locator) });
      }
      assert.ok(card.abilities.some(ability => ability.printedClause === clause.text));
    }
  }
});
check('Positive: material161->163 exactly two additions,no frozen removals/duplicates', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json');
  const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId)); assert.equal(frozen.size, 944);
  const baseFiles = git('ls-tree', '-r', '--name-only', BASE, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
  const before = baseFiles.flatMap(path => (JSON.parse(git('show', `${BASE}:${path}`).replace(/^\uFEFF/, '')).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  function files(path) { return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(path, entry.name)) : entry.name.endsWith('.json') ? [join(path, entry.name)] : []); }
  const after = files('data/authoring').flatMap(path => (read(path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  assert.equal(before.length, 161); assert.equal(new Set(before).size, 161); assert.equal(after.length, 163); assert.equal(new Set(after).size, 163);
  assert.deepEqual(before.filter(id => !after.includes(id)), []);
  assert.deepEqual(after.filter(id => !before.includes(id)).sort(), ['servant.edison.skill.sc-edison-2', 'servant.kama.skill.sc-kama-2']);
});
check('Positive: real play closes at mana1 but stays active at mana2', () => {
  for (const mana of [1, 2]) {
    const { state, loaded } = setup(); assert.deepEqual(loaded.report, []); state.players[0].mana = mana;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'source' }]);
    assert.equal(state.cards[0].zone, mana === 1 ? 'skill' : 'attack_area');
    assert.equal(state.abilityRuntime.cardState.source.active, mana === 2);
  }
});
check('Positive: actual MatchSession support deployment triggers only B05,not historical battlefield trigger', () => {
  const session = rules.createMatchSession({ seed: 438, humanPlayerIds: ['p1', 'p2'] }); const state = session.state;
  const loaded = rules.loadAuthoringJson(edison); const id = selected(edison).id; const historical = 'servant.ereshkigal.skill.sc-ereshkigal-2';
  assert.ok(state.abilityRuntime.pack.cards[historical]); state.abilityRuntime.pack.cards[id] = structuredClone(loaded.cards[id]);
  state.cards.push(physical('b05.source', id, 'field'), physical('historical.source', historical, 'field'));
  for (const id of ['b05.source', 'historical.source']) state.abilityRuntime.cardState[id] = { active: true, faceDown: false, playedRound: 1 };
  const p1 = state.players.find(player => player.id === 'p1'); const p2 = state.players.find(player => player.id === 'p2');
  p1.locationId = 'shinto'; p1.mana = 10; p1.vp = 4; delete p2.locationId; p2.mana = 5;
  state.round.activePhase = 'advance'; state.round.prioritySeat = p2.seat;
  assert.equal(session.dispatchPlayerAction('p2', { type: 'deploy_player', locationId: 'magic_workshop' }).ok, true);
  assert.ok(state.abilityRuntime.events.some(event => event.sourceCardId === 'b05.source' && event.abilityId === 'mass-production-workshop-deployment'));
  assert.ok(!state.abilityRuntime.events.some(event => event.sourceCardId === 'historical.source' && event.abilityId === 'sc-ereshkigal-2.gain-mana-on-deploy'));
});
check('Positive: backend deployment arm survives transient cleanup and duplicate round-close rolls back', () => {
  const { state } = setup(kama, 'attack_area'); state.players[1].locationId = 'miyama_town';
  const root = 'deploy:1:p2'; rules.processAuthoritativeEntryAbilityEvent(state, { id: root, type: 'after_player_deployed_to_battlefield', playerId: 'p2', locationId: 'miyama_town' });
  assert.equal(state.players[0].vp, 4); assert.equal(state.players[1].vp, 2); assert.equal(state.abilityRuntime.trustedEntryEventSnapshots?.[root], undefined);
  const duplicate = structuredClone(state); duplicate.abilityRuntime.b05RoundCloseArms.push(structuredClone(duplicate.abilityRuntime.b05RoundCloseArms[0]));
  const before = structuredClone(duplicate); assert.throws(() => rules.advanceAbilityPhase(duplicate, 'round_end'), /B05_ROUND_CLOSE_ARM_DUPLICATE/); assert.deepEqual(duplicate, before);
  rules.advanceAbilityPhase(state, 'round_end'); assert.equal(state.cards[0].zone, 'skill'); assert.deepEqual(state.abilityRuntime.b05RoundCloseArms, []);
});
for (const [field, value] of [['visibility', true], ['visibility', []], ['activation', true], ['activation', []], ['limit', true], ['responseWindow', true]]) {
  check(`Malformed low-mana ${field}=${JSON.stringify(value)} must reject`, () => {
    const raw = structuredClone(edison); low(raw)[field] = value;
    const rawAccepted = gateway.isAcceptedB05LowManaCloseAbility(low(raw)); const checked = rules.loadAuthoringJson(raw);
    const compiledAccepted = gateway.isAcceptedB05LowManaCloseAbility(checked.cards[selected(raw).id].abilities.find(ability => ability.id === low(raw).id));
    if (!rawAccepted && !compiledAccepted && checked.report.some(issue => issue.status === 'unsupported')) return;
    const { state, loaded } = setup(raw); state.players[0].mana = 1; rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'source' }]);
    const closed = state.cards[0].zone === 'skill' && state.abilityRuntime.cardState.source.active === false;
    assert.ok(!rawAccepted && !compiledAccepted && loaded.report.some(issue => issue.status === 'unsupported') && !closed,
      `raw=${rawAccepted}; compiled=${compiledAccepted}; issues=${loaded.report.length}; closed=${closed}`);
  });
}
console.log(JSON.stringify({ head: HEAD, base: BASE, locatorDifferences, results }, null, 2));
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
