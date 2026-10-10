import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const HEAD = '6c18b429172ac671f918e4ae2c9291f347d3ee6b';
const BASE = '830934876e0805b4bf21c45dd73e7ac57e2be065';
const SOURCE = '19ff09ed65e34f241d332250e1cc1370071ecf75';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 30000000 }).trim();
const json = (sha, path) => JSON.parse(git('show', `${sha}:${path}`).replace(/^\uFEFF/, ''));
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const { stepGameLoop } = await import(pathToFileURL(resolve('packages/rules/src/core/game-loop.ts')).href);
const TYPE = 'event_location_equals_controller';
const full = () => [{ type: 'source_active' }, { type: 'controller_servant_revealed' }, { type: 'at_battlefield' },
  { type: 'event_player_is_opponent' }, { type: TYPE }];
const results = [];
function check(name, fn) { try { results.push({ name, pass: true, observations: fn() }); } catch(error) { results.push({ name, pass: false, detail: String(error) }); } }
function archive(conditions = full(), trigger = 'after_controller_enters_location') {
  return { schemaVersion: 'fd-card-authoring-v1', id: 'fixture', name: 'fixture', cards: [{ id: 'fixture.source', name: 'fixture',
    cardType: 'servant_skill', cardFace: { cost: 0, basePower: 0, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [{
      id: 'observe-movement', kind: 'forced_trigger', printedClause: 'fixture', activation: { trigger }, conditions,
      effects: [{ type: 'adjust_mana', player: 'controller', amount: 2 }], targets: [], cost: [], creates: [],
      ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic' },
    }] }] };
}
function setup(conditions = full(), trigger) {
  const pack = rules.loadAuthoringJson(archive(conditions, trigger)); assert.deepEqual(pack.report, []);
  const s = createSeededGameState({ activeSeats: [1, 2, 3, 4, 5, 6, 7] }); s.round.activePhase = 'action';
  s.players[0].locationId = 'miyama_town'; s.players[1].locationId = 'magic_workshop'; s.players[1].mana = 5;
  s.cards = [{ instanceId: 'source', definitionId: 'fixture.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } }];
  rules.initializeAbilityRuntime(s, pack, { seed: 455 }); s.abilityRuntime.cardState.source = { active: true, faceDown: false };
  s.abilityRuntime.revealedServants.push('p1'); return s;
}
const event = (locationId = 'miyama_town', playerId = 'p2', type = 'after_controller_enters_location') => ({ id: 'probe', type, locationId, playerId });
check('Exact helper comparison and malformed context rejection are read-only', () => {
  const s = setup(), before = structuredClone(s);
  assert.equal(rules.eventLocationEqualsController(s, 'p1', event()), true);
  for (const location of [undefined, null, '', 1, {}, [], 'shinto', 'not-a-location']) {
    assert.equal(rules.eventLocationEqualsController(s, 'p1', { ...event(), locationId: location }), false);
  }
  assert.equal(rules.eventLocationEqualsController(s, 'absent', event()), false);
  assert.equal(rules.eventLocationEqualsController(s, 'p1', undefined), false);
  assert.equal(rules.eventLocationEqualsController(s, 'p1', event('miyama_town', 'p2', 'after_battle_ended')), false);
  assert.deepEqual(s, before); return { malformedLocations: 6, otherLocations: 2, wrongEventRejected: true, mutation: false };
});
check('Actor relationship remains separate from helper location comparison', () => {
  const s = setup(); assert.equal(rules.eventLocationEqualsController(s, 'p1', event('miyama_town', 'p1')), true);
  assert.equal(rules.eventLocationEqualsController(s, 'p1', { id: 'no-actor', type: 'after_controller_enters_location', locationId: 'miyama_town' }), true);
  assert.deepEqual(rules.collectTriggeredAbilities(s, event('miyama_town', 'p1')), []);
  assert.deepEqual(rules.collectTriggeredAbilities(s, { ...event(), playerId: undefined }), []);
  return { helperDoesNotInferOpponent: true, composedActorCheckFailsClosed: true };
});
check('Actual core movement producer triggers composed reward once without mutating input', () => {
  const s = setup(), before = structuredClone(s), mana = s.players[0].mana;
  const result = stepGameLoop(s, { action: { type: 'move', playerId: 'p2', to: 'miyama_town', movementKind: 'normal' } });
  assert.equal(result.nextState.players[1].locationId, 'miyama_town');
  assert.equal(result.nextState.players[0].mana, mana + 2);
  assert.ok(result.nextState.abilityRuntime.processedEvents.some(id => id.startsWith('enter-location-')));
  assert.deepEqual(s, before); return { actualMoveSucceeded: true, reward: 2, inputUnchanged: true };
});
check('Full composition rejects elsewhere,unrevealed,inactive,face-down,non-battlefield source context', () => {
  const changes = [s => { s.players[0].locationId = 'shinto'; }, s => { s.abilityRuntime.revealedServants = []; },
    s => { s.abilityRuntime.cardState.source.active = false; }, s => { s.abilityRuntime.cardState.source.faceDown = true; },
    s => { s.players[0].locationId = 'magic_workshop'; }];
  for (const change of changes) { const s = setup(); change(s); const before = structuredClone(s); assert.deepEqual(rules.collectTriggeredAbilities(s, event()), []); assert.deepEqual(s, before); }
  return { compositionNegatives: changes.length };
});
check('Only exact opponent movement opts out of implicit controller scope', () => {
  const ownOnly = setup([{ type: TYPE }]);
  assert.deepEqual(rules.collectTriggeredAbilities(ownOnly, event()), []);
  assert.equal(rules.collectTriggeredAbilities(ownOnly, event('miyama_town', 'p1')).length, 1);
  const unrelated = setup([{ type: 'event_player_is_opponent' }], 'after_controller_loses_all_command_seals');
  assert.deepEqual(rules.collectTriggeredAbilities(unrelated, event('miyama_town', 'p2', 'after_controller_loses_all_command_seals')), []);
  return { implicitControllerScopePreserved: true, unrelatedTriggerOpponentOptIn: false };
});
check('Malformed payload nodes disabled and backend rejection rolled back', () => {
  const raw = archive([{ type: TYPE, location: 'controller' }]); const pack = rules.loadAuthoringJson(raw);
  assert.ok(pack.report.some(issue => issue.reason === 'Event-location relation condition must contain only type'));
  assert.equal(pack.cards['fixture.source'].abilities[0].execution.mode, 'unsupported');
  const s = setup(); s.abilityRuntime.pack.cards['fixture.source'].abilities[0].conditions = [{ type: TYPE, location: 'controller' }];
  const before = structuredClone(s); assert.throws(() => rules.processAbilityEvent(s, event()), /event-location relation condition shape/i);
  assert.deepEqual(s, before); return { loaderDisabled: true, runtimeRollback: true };
});
check('Nested,effect,target,modifier placements and new trigger remain disabled', () => {
  const mutations = [
    raw => { raw.cards[0].abilities[0].conditions = [{ type: 'and', conditions: [{ type: TYPE }] }]; },
    raw => { raw.cards[0].abilities[0].conditions = []; raw.cards[0].abilities[0].effects = [{ type: TYPE }]; },
    raw => { raw.cards[0].abilities[0].targets = [{ id: 't', type: 'player', conditions: [{ type: TYPE }], constraints: [], count: { min: 0, max: 1 } }]; },
    raw => { raw.cards[0].abilities[0].ruleModifiers = [{ operation: 'add', rule: 'card.currentPower', value: 1, scope: {}, lifecycle: { duration: 'this_round' }, conditions: [{ type: TYPE }] }]; },
    raw => { raw.cards[0].abilities[0].activation.trigger = 'future_unaccepted_trigger'; },
  ];
  for (const mutate of mutations) { const raw = archive(); mutate(raw); const pack = rules.loadAuthoringJson(raw); assert.ok(pack.report.length > 0); assert.equal(pack.cards['fixture.source'].abilities[0].execution.mode, 'unsupported'); }
  return { disabledVariants: mutations.length };
});
check('Historical helper exact parity,current dispatch and four production/two evidence paths', () => {
  const path = 'packages/rules/src/ability/event-location-equals-controller.ts';
  assert.equal(git('show', `${HEAD}:${path}`), git('show', `${SOURCE}:${path}`));
  const dispatch = git('show', `${BASE}:docs/reports/2026-09-26-p3-a-main-replay-fb2-31-event-player-relation-acceptance-synchronization.md`);
  assert.ok(dispatch.includes('Dispatch `P3-B-MAIN-REPLAY-FB2-43-EVENT-LOCATION-EQUALS-CONTROLLER`')); assert.ok(dispatch.includes(SOURCE));
  assert.deepEqual(git('diff', '--name-only', BASE, HEAD).split('\n').sort(), [
    'docs/reports/2026-09-26-p3-b-main-replay-fb2-43-event-location-equals-controller-result.md', path,
    'packages/rules/src/ability/interpreter.ts', 'packages/rules/src/ability/loader.ts', 'packages/rules/src/index.ts',
    'packages/rules/tests/fb2-43-event-location-equals-controller-current-main.test.ts',
  ]);
  git('diff', '--check', BASE, HEAD); return { helperSourceEqual: true, currentTaskDispatched: true, paths: 6 };
});
check('Unchanged112/944 frozen material,zero migration delta', () => {
  const inventory = json(BASE, 'data/phase3/full-roster-ability-inventory.json');
  const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId)); assert.equal(frozen.size, 944);
  function material(sha) {
    const paths = git('ls-tree', '-r', '--name-only', sha, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
    const ids = paths.flatMap(path => (json(sha, path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id)).sort();
    assert.equal(ids.length, 112); assert.equal(new Set(ids).size, 112); return ids;
  }
  assert.deepEqual(material(BASE), material(HEAD));
  return { material: 112, frozen: 944, additions: 0, removals: 0, duplicates: 0, creditGranted: false };
});
process.stdout.write(`${JSON.stringify({ pr: 455, targetSha: HEAD, results }, null, 2)}\n`);
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
