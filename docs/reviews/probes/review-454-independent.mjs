import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const HEAD = '5d120f6a667ba1809e4c63a60018da781780ebda';
const BASE = 'ea25b1dac6a6138c0995a709e3283e4d3b49ce02';
const MATERIAL_SOURCE = '8b26c9d0aa294c065ae6c7f3a2b062f19cdff196';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 30000000 }).trim();
const json = (sha, path) => JSON.parse(git('show', `${sha}:${path}`).replace(/^\uFEFF/, ''));
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const TYPES = ['event_player_is_controller', 'event_player_is_opponent'];
const results = [];
function check(name, fn) { try { results.push({ name, pass: true, observations: fn() }); } catch(error) { results.push({ name, pass: false, detail: String(error) }); } }
function archive() {
  return { schemaVersion: 'fd-card-authoring-v1', id: 'master.fixture', name: 'fixture', cards: TYPES.map((type, i) => ({
    id: `fixture.${i}`, name: 'fixture', cardType: 'master_skill', cardFace: { basePower: 0, cost: 0, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [{ id: 'relation', kind: 'forced_trigger', printedClause: 'fixture', activation: { trigger: 'after_battle_ended' },
      conditions: [{ type }], effects: [{ type: 'adjust_mana', player: 'controller', amount: 1 }], targets: [], cost: [], creates: [],
      ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic' } }],
  })) };
}
function setup() {
  const pack = rules.loadAuthoringJson(archive()); assert.deepEqual(pack.report, []);
  const s = createSeededGameState({ activeSeats: [1, 2, 3, 4, 5, 6, 7] });
  s.cards = TYPES.map((_, i) => ({ instanceId: `source-${i}`, definitionId: `fixture.${i}`, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }));
  rules.initializeAbilityRuntime(s, pack, { seed: 454 }); return s;
}
function event(playerId, id = 'probe') { return { id, type: 'after_battle_ended', ...(playerId === undefined ? {} : { playerId }) }; }
check('Known controller/opponent exact comparison,seven-player read-only collection', () => {
  const s = setup(), before = structuredClone(s);
  assert.deepEqual(rules.collectTriggeredAbilities(s, event('p1')).map(t => t.cardInstanceId), ['source-0']);
  for (const actor of ['p2', 'p7']) assert.deepEqual(rules.collectTriggeredAbilities(s, event(actor)).map(t => t.cardInstanceId), ['source-1']);
  assert.deepEqual(s, before); return { seats: 7, ownMatches: 1, otherMatches: 1, mutation: false };
});
check('Missing,empty,unknown and malformed actor IDs fail closed without mutation', () => {
  const s = setup(), before = structuredClone(s);
  const actors = [undefined, null, '', 'unknown', 'P1', ' p1', 1, true, {}, [], ['p1']];
  for (const actor of actors) assert.deepEqual(rules.collectTriggeredAbilities(s, event(actor)), []);
  assert.deepEqual(s, before); return { invalidActors: actors.length, noTriggers: true };
});
check('Trusted backend event actually applies exactly one matching effect,duplicate event id is idempotent', () => {
  for (const actor of ['p1', 'p2']) {
    const s = setup(), before = s.players[0].mana;
    rules.processAbilityEvent(s, event(actor)); assert.equal(s.players[0].mana, before + 1);
    const completed = structuredClone(s); rules.processAbilityEvent(s, event(actor)); assert.deepEqual(s, completed);
  }
  return { actualEffectCountPerActor: 1, duplicateEventReapplied: false, callerIsTrustedBackend: true };
});
check('Payload-bearing nodes rejected by loader and transactional runtime event hook', () => {
  for (const type of TYPES) {
    const raw = archive(); raw.cards[0].abilities[0].conditions = [{ type, player: 'controller' }];
    const loaded = rules.loadAuthoringJson(raw); assert.ok(loaded.report.length > 0);
    assert.equal(loaded.cards['fixture.0'].abilities[0].execution.mode, 'unsupported');
    const s = setup(); s.abilityRuntime.pack.cards['fixture.0'].abilities[0].conditions = [{ type, player: 'controller' }];
    const before = structuredClone(s); assert.throws(() => rules.processAbilityEvent(s, event('p1')), /event-player relation condition shape/i);
    assert.deepEqual(s, before);
  }
  return { malformedConditions: 2, loaderDisabled: true, backendRollback: true };
});
check('Nested,target and modifier condition placements disabled', () => {
  const variants = [
    raw => { raw.cards[0].abilities[0].conditions = [{ type: 'and', conditions: [{ type: TYPES[0] }] }]; },
    raw => { raw.cards[0].abilities[0].targets = [{ id: 'who', type: 'player', conditions: [{ type: TYPES[0] }], constraints: [], count: { min: 0, max: 1 } }]; },
    raw => { raw.cards[0].abilities[0].ruleModifiers = [{ operation: 'add', rule: 'card.currentPower', value: 1, conditions: [{ type: TYPES[0] }], lifecycle: { duration: 'this_round' }, scope: {} }]; },
  ];
  for (const mutate of variants) {
    const raw = archive(); mutate(raw); const loaded = rules.loadAuthoringJson(raw);
    assert.ok(loaded.report.some(issue => issue.reason === 'Event-player relation condition is supported only as a direct ability condition'));
    assert.equal(loaded.cards['fixture.0'].abilities[0].execution.mode, 'unsupported');
  }
  return { disabledCarriers: 3 };
});
check('Accepted relation does not admit a new activation trigger', () => {
  const raw = archive(); raw.cards[0].abilities[0].activation.trigger = 'unaccepted_fixture_trigger';
  const pack = rules.loadAuthoringJson(raw);
  assert.ok(pack.report.some(issue => issue.reason === 'Unmapped trigger'));
  assert.equal(pack.cards['fixture.0'].abilities[0].execution.mode, 'unsupported');
  return { triggerWidening: false };
});
check('Frozen R123 material has27 direct relation occurrences,not27 new migrations', () => {
  const found = [];
  function walk(value, path, file) {
    if (Array.isArray(value)) return value.forEach((child, i) => walk(child, `${path}[${i}]`, file));
    if (!value || typeof value !== 'object') return;
    if (TYPES.includes(value.type)) found.push({ path, file });
    for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`, file);
  }
  for (const path of git('ls-tree', '-r', '--name-only', MATERIAL_SOURCE, 'data/authoring').split('\n').filter(path => path.endsWith('.json'))) walk(json(MATERIAL_SOURCE, path), '$', path);
  assert.equal(found.length, 27); assert.ok(found.every(row => /\.abilities\[\d+\]\.conditions\[\d+\]$/.test(row.path)));
  return { materialSource: MATERIAL_SOURCE, sourceOccurrences: 27, nonDirect: 0, historicalAcceptanceRevalidated: false };
});
check('Exact scope and unchanged112/944 frozen material,not acceptance credit', () => {
  assert.deepEqual(git('diff', '--name-only', BASE, HEAD).split('\n').sort(), [
    'docs/reports/2026-09-26-p3-b-main-replay-fb2-31-event-player-relation-result.md',
    'packages/rules/src/ability/interpreter.ts', 'packages/rules/src/ability/loader.ts',
    'packages/rules/tests/fb2-31-event-player-relation-current-main.test.ts',
  ]);
  const inventory = json(BASE, 'data/phase3/full-roster-ability-inventory.json');
  const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId)); assert.equal(frozen.size, 944);
  function material(sha) {
    const paths = git('ls-tree', '-r', '--name-only', sha, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
    const ids = paths.flatMap(path => (json(sha, path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id)).sort();
    assert.equal(ids.length, 112); assert.equal(new Set(ids).size, 112); return ids;
  }
  assert.deepEqual(material(BASE), material(HEAD)); git('diff', '--check', BASE, HEAD);
  return { frozen: 944, material: 112, additions: 0, removals: 0, duplicates: 0, formalAcceptanceRecomputed: false };
});
process.stdout.write(`${JSON.stringify({ pr: 454, targetSha: HEAD, results }, null, 2)}\n`);
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
