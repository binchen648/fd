import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const HEAD = '509a027a3b5487259b2c3f6d3c7722710031c046';
const BASE = '7c2ee773a8ca36fde7cc2812c86e9cb20cdb83e2';
const SOURCE = '110257b76a957a5bba39ea1822f7861cecf288a9';
const PATH = 'data/authoring/servants/servant.astolfo.json';
const ID = 'servant.astolfo.skill.sc-astolfo-1';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 30000000 }).trim();
const json = (sha, path) => JSON.parse(git('show', `${sha}:${path}`).replace(/^\uFEFF/, ''));
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const raw = json(HEAD, PATH); const ability = raw.cards[0].abilities[0];
const results = [];
function check(name, fn) { try { results.push({ name, pass: true, observations: fn() }); } catch(error) { results.push({ name, pass: false, detail: String(error) }); } }
function setup(mana = 8) {
  const pack = rules.loadAuthoringJson(raw); assert.deepEqual(pack.report, []);
  for (const [id, type] of [['fixture.normal', 'servant_attack'], ['fixture.skill', 'servant_skill']]) pack.cards[id] = {
    id, name: id, cardType: type, mode: 'automatic', cardFace: { basePower: 1, cost: 0, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
  };
  const s = createSeededGameState({ activeSeats: [1, 2, 3] });
  s.round.activePhase = 'action'; s.round.prioritySeat = 1;
  for (const p of s.players) p.locationId = 'miyama_town';
  s.players[0].servantCardId = 'servant.astolfo'; s.players[0].mana = mana;
  s.cards = [{ instanceId: 'source', definitionId: ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  rules.initializeAbilityRuntime(s, pack, { seed: 446 });
  return s;
}
function play(s) { return rules.dispatchAbilityCommand(s, 'p1', { type: 'play_card', cardInstanceId: 'source' }); }
function activate(s) { return rules.dispatchAbilityCommand(s, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId: ability.id }); }
function battle() {
  const s = setup(); assert.equal(play(s).ok, true); s.round.activePhase = 'battle';
  for (const [id, definitionId] of [['keep', 'fixture.normal'], ['close-skill', 'fixture.skill']]) {
    s.cards.push({ instanceId: id, definitionId, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
    s.abilityRuntime.cardState[id] = { active: true, faceDown: false, playedRound: s.round.roundNumber };
  }
  assert.equal(activate(s).ok, true); return s;
}
check('Exact F1 inventory binds printed text,clause locator/hash and source references', () => {
  const inventory = json(raw.cards[0].phase3Evidence.f1Commit, 'data/phase3/full-roster-ability-inventory.json');
  const row = inventory.staticSkills.find(row => row.canonicalAbilityId === ID); assert.ok(row);
  assert.equal(row.printedText, raw.cards[0].printedText);
  assert.equal(row.clauses[0].text, ability.printedClause);
  assert.equal(row.clauses[0].sourceAbilityId, ability.id);
  assert.deepEqual(row.clauses[0].source, {
    document: raw.cards[0].phase3Evidence.f1ClauseSources[0].document,
    locator: raw.cards[0].phase3Evidence.f1ClauseSources[0].locator,
    sha256: raw.cards[0].phase3Evidence.f1ClauseSources[0].sha256,
  });
  assert.deepEqual(row.sources, raw.cards[0].phase3Evidence.f1SourceReferences);
  return { f1IdentityAndClauseBound: true, sourceReferencesBound: true, externalOriginalVerified: false };
});
check('Exact source-card replay, source hashes and inherited runtime scope', () => {
  const original = json(SOURCE, PATH);
  original.cards[0].phase3Evidence.acceptedContracts.opponentCloseToOne = raw.cards[0].phase3Evidence.acceptedContracts.opponentCloseToOne;
  assert.deepEqual(raw, original);
  const hash = value => createHash('sha256').update(value, 'utf8').digest('hex');
  assert.equal(hash(raw.cards[0].printedText), raw.cards[0].phase3Evidence.f1FullPrintedTextSha256);
  assert.equal(hash(ability.printedClause), raw.cards[0].phase3Evidence.f1ClauseSources[0].sha256);
  assert.equal(git('diff', '--name-only', BASE, HEAD, '--', 'packages/rules/src', 'apps', 'data/packs', 'data/generated'), '');
  assert.deepEqual(git('diff', '--name-only', BASE, HEAD).split('\n').sort(), [PATH,
    'docs/reports/2026-09-25-p3-s-main-replay-astolfo-s1-consumer-result.md', 'packages/rules/tests/astolfo-s1-consumer-migration.test.ts']);
  git('diff', '--check', BASE, HEAD);
  return { historicalWholeCardEqualExceptContractBinding: true, runtimeChanged: false, originalExternalSourceVerified: false };
});
check('Actual play boundary and exact printed cost, no action-phase combat activation', () => {
  const low = setup(7); rules.getLegalActions(low, 'p1'); const before = structuredClone(low);
  assert.equal(play(low).ok, false); assert.deepEqual(low, before);
  const s = setup(); assert.equal(play(s).ok, true); assert.equal(s.players[0].mana, 4);
  const played = structuredClone(s); assert.equal(activate(s).ok, false); assert.deepEqual(s, played);
  return { sevenManaRejected: true, eightManaPaysFour: true, combatOnly: true };
});
check('Private keep-one decision and forged actor/selection rejection are atomic', () => {
  const s = battle(); const d = s.abilityRuntime.pendingDecision;
  assert.deepEqual(d.candidates, ['keep', 'close-skill']); assert.equal(d.controllerId, 'p2');
  assert.equal(rules.projectAbilityState(s, 'p1').pendingDecision, undefined);
  assert.equal(rules.projectAbilityState(s, 'p3').pendingDecision, undefined);
  assert.ok(rules.projectAbilityState(s, 'p2').pendingDecision);
  for (const [actor, selectedIds] of [['p1', ['keep']], ['p2', ['outsider']], ['p2', ['keep', 'close-skill']]]) {
    const before = structuredClone(s);
    assert.equal(rules.dispatchAbilityCommand(s, actor, { type: 'choose_target', decisionId: d.id, selectedIds }).ok, false);
    assert.deepEqual(s, before);
  }
  return { privateDecision: true, rejectedForgedCommands: 3 };
});
check('Reproduction: real Astolfo closes a skill face-up but hides it from every non-owner', () => {
  const s = battle(); const d = s.abilityRuntime.pendingDecision;
  const result = rules.dispatchAbilityCommand(s, 'p2', { type: 'choose_target', decisionId: d.id, selectedIds: ['keep'] });
  assert.equal(result.ok, true);
  const closed = s.cards.find(card => card.instanceId === 'close-skill');
  assert.equal(closed.zone, 'skill'); assert.equal(closed.visibility.scope, 'owner_only');
  assert.deepEqual({ active: s.abilityRuntime.cardState['close-skill'].active, faceDown: s.abilityRuntime.cardState['close-skill'].faceDown }, { active: false, faceDown: false });
  assert.ok(rules.projectAbilityState(s, 'p2').cards.some(card => card.instanceId === 'close-skill'));
  for (const viewer of ['p1', 'p3']) assert.ok(!rules.projectAbilityState(s, viewer).cards.some(card => card.instanceId === 'close-skill' || card.definitionId === 'fixture.skill'));
  assert.equal(s.abilityRuntime.pendingDecision, undefined);
  assert.equal(s.abilityRuntime.cardState.keep.active, true);
  return { settleAccepted: true, returnedFaceUp: true, ownerSeesCard: true, nonOwnersSeeCard: false, runtimeInheritedFromBase: true };
});
check('Whole frozen recount: exactly one dispatched ID,111->112,no duplicate/removal', () => {
  const inventory = json(BASE, 'data/phase3/full-roster-ability-inventory.json');
  const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId)); assert.equal(frozen.size, 944);
  function material(sha) {
    const paths = git('ls-tree', '-r', '--name-only', sha, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
    return paths.flatMap(path => (json(sha, path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id)).sort();
  }
  const before = material(BASE), after = material(HEAD);
  assert.equal(before.length, 111); assert.equal(after.length, 112);
  assert.equal(new Set(before).size, 111); assert.equal(new Set(after).size, 112);
  assert.deepEqual(after.filter(id => !before.includes(id)), [ID]); assert.deepEqual(before.filter(id => !after.includes(id)), []);
  assert.ok(!git('show', `${HEAD}:data/packs/fd-playtest-v1/pack.json`).includes(PATH));
  return { frozen: 944, before: 111, after: 112, added: ID, formalCreditGranted: false };
});
process.stdout.write(`${JSON.stringify({ pr: 446, targetSha: HEAD, results }, null, 2)}\n`);
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
