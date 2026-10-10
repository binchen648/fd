import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HEAD = '3fefa0cdb02cf9ff81cec64732cb67e5d6513549';
const BASE = '819f88e84148513d87766cf39db7ae8d1c0c995f';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const gateway = await import(pathToFileURL(resolve('packages/rules/src/ability/batch-card-play-combat-event-burst-rules.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const read = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const mozart = read('data/authoring/servants/servant.mozart.json');
const amakusa = read('data/authoring/servants/servant.amakusa.json');
const selected = raw => raw.cards.find(card => card.id === (raw.id === 'servant.mozart' ? 'servant.mozart.skill.sc-mozart-2' : 'servant.amakusa.skill.sc-amakusa-1'));
const results = []; const locatorDifferences = [];
function check(name, fn) {
  try { fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
function setup(raw = amakusa) {
  const loaded = rules.loadAuthoringJson(raw); const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  for (const player of state.players) { player.mana = 30; player.vp = 10; player.military = 20; player.locationId = player.id === 'p1' ? 'shinto' : 'miyama_town'; }
  state.cards = [{ instanceId: 'source', definitionId: selected(raw).id, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  state.eventPlacements = [{ locationId: 'miyama_town', eventCardId: 'review.public', victoryPoints: 2, visibility: { scope: 'public' } },
    { locationId: 'shinto', eventCardId: 'review.hidden', victoryPoints: 4, visibility: { scope: 'hidden_until_trigger' } }];
  state.eventOutsideGame = []; state.eventDiscardPile = [];
  rules.initializeAbilityRuntime(state, { cards: loaded.cards, eventCatalog: {
    'review.public': { id: 'review.public', tags: [], eventSetIds: ['review'], printedReward: 2 },
    'review.hidden': { id: 'review.hidden', tags: [], eventSetIds: ['review'], printedReward: 4 }
  } }, { seed: 439 });
  state.abilityRuntime.cardState.source = { active: false, faceDown: false, playedRound: 1 };
  return { state, loaded };
}
check('Positive: full texts/clause hashes match frozen evidence; locator differences are separate', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json'); const rows = [...inventory.staticSkills, ...inventory.dynamicSkills];
  const hash = text => createHash('sha256').update(text).digest('hex');
  for (const raw of [mozart, amakusa]) {
    const card = selected(raw); const row = rows.find(row => row.canonicalAbilityId === card.id);
    assert.equal(card.printedText, row.printedText); assert.equal(hash(card.printedText), card.phase3Evidence.f1FullPrintedTextSha256);
    for (const clause of row.clauses) {
      assert.equal(hash(clause.text), clause.source.sha256);
      assert.ok(card.phase3Evidence.f1ClauseSources.some(source => source.sha256 === clause.source.sha256));
      assert.ok(card.abilities.some(ability => ability.printedClause === clause.text));
      if (!card.phase3Evidence.f1ClauseSources.some(source => source.locator === clause.source.locator && source.sha256 === clause.source.sha256)) {
        locatorDifferences.push({ identity: card.id, frozenLocator: clause.source.locator,
          candidateLocators: card.phase3Evidence.f1ClauseSources.filter(source => source.sha256 === clause.source.sha256).map(source => source.locator) });
      }
    }
  }
});
check('Positive: material163->165 exactly two additions,no frozen removals/duplicates', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json');
  const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId)); assert.equal(frozen.size, 944);
  const baseFiles = git('ls-tree', '-r', '--name-only', BASE, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
  const before = baseFiles.flatMap(path => (JSON.parse(git('show', `${BASE}:${path}`).replace(/^\uFEFF/, '')).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  function files(path) { return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(path, entry.name)) : entry.name.endsWith('.json') ? [join(path, entry.name)] : []); }
  const after = files('data/authoring').flatMap(path => (read(path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  assert.equal(before.length, 163); assert.equal(new Set(before).size, 163); assert.equal(after.length, 165); assert.equal(new Set(after).size, 165);
  assert.deepEqual(before.filter(id => !after.includes(id)), []);
  assert.deepEqual(after.filter(id => !before.includes(id)).sort(), ['servant.amakusa.skill.sc-amakusa-1', 'servant.mozart.skill.sc-mozart-2']);
});
check('Positive: burst removes public only,retains X after event return,expires and rejects altered root amount', () => {
  const { state, loaded } = setup(); assert.deepEqual(loaded.report, []);
  rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'source' }]); assert.equal(rules.calculateCardPower(state, 'source').value, 4);
  assert.deepEqual(state.eventPlacements.map(event => event.eventCardId), ['review.hidden']); assert.deepEqual(state.eventOutsideGame, ['review.public']);
  const tampered = structuredClone(state); const receipt = tampered.abilityRuntime.b06EventBurstBonuses[0]; receipt.amount += 2; tampered.log[receipt.logIndex].payload.amount = receipt.amount;
  assert.throws(() => rules.calculateCardPower(tampered, 'source'), /B06_EVENT_BURST_STATE_INVALID/);
  const candidate = rules.listEventRuleCandidates(state, state.abilityRuntime.pack, ['event_outside_game']).find(entry => entry.eventCardId === 'review.public');
  rules.moveEventRuleCandidates(state, state.abilityRuntime.pack, [candidate.token], 'event_battlefield', { locationId: 'miyama_town', visibility: 'public' });
  assert.equal(rules.calculateCardPower(state, 'source').value, 4);
  rules.advanceAbilityPhase(state, 'preparation', 2); assert.equal(rules.calculateCardPower(state, 'source').value, 0);
});
check('Positive: real standard battle penalizes remote loser and fabricated nonparticipant fails before VP mutation', () => {
  const { state } = setup(mozart); rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'source' }]);
  state.round.activePhase = 'battle'; const resolved = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town', participants: [
    { playerId: 'p2', totalPower: 9 }, { playerId: 'p3', totalPower: 2 }
  ] }).nextState;
  const battles = structuredClone(resolved.battleResults); const logLength = resolved.log.length; const scored = rules.applyBattleScoring(resolved).nextState;
  const session = rules.createMatchSession({ seed: 439, humanPlayerIds: ['p1', 'p2'] }); session.state = scored;
  session.queuePostScoringBattleEvents(battles, scored.log.slice(logLength)); const queued = structuredClone(session.state);
  const before = session.state.players.find(player => player.id === 'p3').vp; session.flushPostScoringBattleEvents();
  assert.equal(session.state.players.find(player => player.id === 'p3').vp, Math.max(0, before - 2));
  const tamperedSession = rules.createMatchSession({ seed: 439, humanPlayerIds: ['p1', 'p2'] }); tamperedSession.state = queued;
  const snapshot = Object.values(queued.abilityRuntime.b06BattleEventVpSnapshots)[0]; snapshot.battleParticipantIds.push('p1'); snapshot.loserIds.push('p1');
  queued.log[snapshot.snapshotLogIndex].payload.battleParticipantIds = structuredClone(snapshot.battleParticipantIds);
  queued.log[snapshot.snapshotLogIndex].payload.loserIds = structuredClone(snapshot.loserIds);
  const balances = queued.players.map(player => player.vp);
  assert.throws(() => tamperedSession.flushPostScoringBattleEvents(), /B06_BATTLE_EVENT_VP_STATE_INVALID/);
  assert.deepEqual(tamperedSession.state.players.map(player => player.vp), balances);
});
for (const [family, field, value] of [['burst', 'lifecycle', true], ['burst', 'lifecycle', []], ['burst', 'responseWindow', true], ['burst', 'responseWindow', []], ['arm', 'limit', true], ['arm', 'limit', []]]) {
  check(`Malformed ${family} ${field}=${JSON.stringify(value)} must reject`, () => {
    const raw = structuredClone(family === 'burst' ? amakusa : mozart); const ability = selected(raw).abilities[0]; ability[field] = value;
    const accepts = family === 'burst' ? gateway.isAcceptedB06EventBurstAbility : gateway.isAcceptedB06RoundArmAbility;
    const rawAccepted = accepts(ability); const checked = rules.loadAuthoringJson(raw); const compiledAccepted = accepts(checked.cards[selected(raw).id].abilities[0]);
    if (!rawAccepted && !compiledAccepted && checked.report.some(issue => issue.status === 'unsupported')) return;
    const { state, loaded } = setup(raw); rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'source' }]);
    const applied = family === 'burst' ? state.eventOutsideGame.includes('review.public') && rules.calculateCardPower(state, 'source').value === 4 : state.abilityRuntime.b06RoundPunishmentArms?.length === 1;
    assert.ok(!rawAccepted && !compiledAccepted && loaded.report.some(issue => issue.status === 'unsupported') && !applied,
      `raw=${rawAccepted}; compiled=${compiledAccepted}; issues=${loaded.report.length}; applied=${applied}`);
  });
}
console.log(JSON.stringify({ head: HEAD, base: BASE, locatorDifferences, results }, null, 2));
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
