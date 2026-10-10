import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HEAD = '4589924f0cae86dc58bd75a4794e2b2caef0f3ec';
const BASE = '9cb15f78513bb2281fef03d5fa5ce172ee0ea4b6';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const gateway = await import(pathToFileURL(resolve('packages/rules/src/ability/batch-modifier-lifecycle-rules.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const read = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const mozart = read('data/authoring/servants/servant.mozart.json');
const edison = read('data/authoring/servants/servant.edison.json');
const selected = raw => raw.cards.find(card => card.id === (raw === edison || raw.id === 'servant.edison' ? 'servant.edison.skill.sc-edison-3' : 'servant.mozart.skill.sc-mozart-1'));
const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
function setup(raw = mozart) {
  const loaded = rules.loadAuthoringJson(raw);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  for (const player of state.players) { player.locationId = 'magic_workshop'; player.mana = 20; }
  const boostId = 'servant.mozart.skill.sc-mozart-2';
  const boost = { id: boostId, name: 'fixture', cardType: 'servant_attack', cardFace: { typeLabel: 'fixture', cost: 0, basePower: 4, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
  state.cards = [{ instanceId: 'source', definitionId: selected(raw).id, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } },
    { instanceId: 'boost', definitionId: boostId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  rules.initializeAbilityRuntime(state, { cards: { ...loaded.cards, [boostId]: boost } }, { seed: 436 });
  state.abilityRuntime.cardState.source = { active: true, faceDown: false, playedRound: 1 };
  state.abilityRuntime.cardState.boost = { active: false, faceDown: false, playedRound: 1 };
  return { state, loaded };
}
function activate(state, abilityId) {
  const action = rules.getLegalActions(state, 'p1').find(action => action.type === 'activate_ability' && action.cardInstanceId === 'source' && action.abilityId === abilityId);
  assert.ok(action); assert.equal(rules.dispatchAbilityCommand(state, 'p1', action).ok, true);
}
check('Positive: both full texts and clauses match local frozen inventory hashes', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json');
  const rows = [...inventory.staticSkills, ...inventory.dynamicSkills];
  const hash = text => createHash('sha256').update(text).digest('hex');
  for (const raw of [mozart, edison]) {
    const card = selected(raw); const row = rows.find(row => row.canonicalAbilityId === card.id);
    assert.equal(card.printedText, row.printedText); assert.equal(hash(card.printedText), card.phase3Evidence.f1FullPrintedTextSha256);
    for (const clause of row.clauses) {
      assert.equal(hash(clause.text), clause.source.sha256);
      assert.equal(card.phase3Evidence.f1ClauseSources.find(source => source.locator === clause.source.locator).sha256, clause.source.sha256);
      assert.ok(card.abilities.some(ability => ability.printedClause === clause.text));
    }
  }
});
check('Positive: material157->159 with exactly two additions and no removals/duplicates', () => {
  const inventory = read('data/phase3/full-roster-ability-inventory.json');
  const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId)); assert.equal(frozen.size, 944);
  const baseFiles = git('ls-tree', '-r', '--name-only', BASE, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
  const before = baseFiles.flatMap(path => (JSON.parse(git('show', `${BASE}:${path}`).replace(/^\uFEFF/, '')).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  function files(path) { return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(path, entry.name)) : entry.name.endsWith('.json') ? [join(path, entry.name)] : []); }
  const after = files('data/authoring').flatMap(path => (read(path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
  assert.equal(before.length, 157); assert.equal(new Set(before).size, 157); assert.equal(after.length, 159); assert.equal(new Set(after).size, 159);
  assert.deepEqual(before.filter(id => !after.includes(id)), []);
  assert.deepEqual(after.filter(id => !before.includes(id)).sort(), ['servant.edison.skill.sc-edison-3', 'servant.mozart.skill.sc-mozart-1']);
});
check('Positive: workshop lock survives closure and expires next round', () => {
  const { state, loaded } = setup(); assert.deepEqual(loaded.report, []);
  activate(state, 'lullaby-lock-workshop'); state.abilityRuntime.cardState.source.active = false;
  assert.equal(gateway.b03WorkshopExitForbidden(state, 'p2'), true);
  rules.advanceAbilityPhase(state, 'preparation', 2); assert.equal(gateway.b03WorkshopExitForbidden(state, 'p2'), false);
});
check('Positive: scheduled boost survives closure, lasts exactly next round and forged dueRound rolls back', () => {
  const { state } = setup(); activate(state, 'serenade-arm-next-round-requiem');
  state.cards[0].zone = 'skill'; state.abilityRuntime.cardState.source.active = false;
  rules.advanceAbilityPhase(state, 'preparation', 2); assert.equal(rules.calculateCardPower(state, 'boost').value, 7);
  rules.advanceAbilityPhase(state, 'preparation', 3); assert.equal(rules.calculateCardPower(state, 'boost').value, 4);
  const forged = setup().state; activate(forged, 'serenade-arm-next-round-requiem');
  forged.abilityRuntime.pendingB03CardPowerBoosts[0].dueRound = 3; const before = structuredClone(forged);
  assert.throws(() => rules.advanceAbilityPhase(forged, 'preparation', 2), /B03_SCHEDULE_STATE_INVALID/); assert.deepEqual(forged, before);
});
for (const [field, value] of [['limit', true], ['limit', []], ['responseWindow', true], ['responseWindow', []]]) {
  check(`Malformed lock ${field}=${JSON.stringify(value)} must be rejected`, () => {
    const raw = structuredClone(mozart); selected(raw).abilities[0][field] = value;
    const rawAccepted = gateway.isAcceptedB03WorkshopMovementLockAbility(selected(raw).abilities[0]);
    const checked = rules.loadAuthoringJson(raw);
    if (!rawAccepted && !gateway.isAcceptedB03WorkshopMovementLockAbility(checked.cards[selected(raw).id].abilities[0]) && checked.report.some(issue => issue.status === 'unsupported')) return;
    const { state, loaded } = setup(raw);
    const compiledAccepted = gateway.isAcceptedB03WorkshopMovementLockAbility(loaded.cards[selected(raw).id].abilities[0]);
    activate(state, 'lullaby-lock-workshop'); const locked = gateway.b03WorkshopExitForbidden(state, 'p2');
    assert.ok(!rawAccepted && !compiledAccepted && loaded.report.some(issue => issue.status === 'unsupported') && !locked,
      `raw=${rawAccepted}; compiled=${compiledAccepted}; issues=${loaded.report.length}; locked=${locked}`);
  });
}
for (const [field, value] of [['lifecycle', true], ['lifecycle', []]]) {
  check(`Malformed schedule ${field}=${JSON.stringify(value)} must be rejected`, () => {
    const raw = structuredClone(mozart); selected(raw).abilities[1][field] = value;
    const rawAccepted = gateway.isAcceptedB03NextRoundCardPowerScheduleAbility(selected(raw).abilities[1]);
    const checked = rules.loadAuthoringJson(raw);
    if (!rawAccepted && !gateway.isAcceptedB03NextRoundCardPowerScheduleAbility(checked.cards[selected(raw).id].abilities[1]) && checked.report.some(issue => issue.status === 'unsupported')) return;
    const { state, loaded } = setup(raw);
    const compiledAccepted = gateway.isAcceptedB03NextRoundCardPowerScheduleAbility(loaded.cards[selected(raw).id].abilities[1]);
    activate(state, 'serenade-arm-next-round-requiem'); rules.advanceAbilityPhase(state, 'preparation', 2);
    const power = rules.calculateCardPower(state, 'boost').value;
    assert.ok(!rawAccepted && !compiledAccepted && loaded.report.some(issue => issue.status === 'unsupported') && power === 4,
      `raw=${rawAccepted}; compiled=${compiledAccepted}; issues=${loaded.report.length}; power=${power}`);
  });
}
console.log(JSON.stringify({ head: HEAD, base: BASE, results }, null, 2));
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
