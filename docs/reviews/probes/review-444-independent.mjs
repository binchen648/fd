import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const HEAD = 'c820161a427de6b0e55c209b7e14e3f6fba36033';
const BASE = 'c6c5786cb48f6abc563aa8359e335fbd26c14c4f';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 30000000 }).trim();
assert.equal(git('rev-parse', 'HEAD'), HEAD);
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const results = [];
function check(name, fn) {
  try { results.push({ name, pass: true, observations: fn() }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
function modifier(cardId = 'fixture.target') {
  return { id: `protect-${cardId}`, operation: 'forbid', rule: 'card_close',
    scope: { controller: 'self', constraints: [{ type: 'has_card_id', cardId }] }, lifecycle: { duration: 'this_round' } };
}
function archive(modifiers = [modifier()]) {
  const ability = (id, effects, ruleModifiers) => ({ id, kind: 'phase_action', printedClause: 'fixture',
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
    effects, ruleModifiers, conditions: [], targets: [], cost: [], creates: [],
    lifecycle: id === 'protect' ? { duration: 'this_round' } : {},
    limit: {}, visibility: {}, responseWindow: {}, execution: { mode: 'automatic' } });
  const card = (id, abilities) => ({ id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: 'fixture' },
    cardFace: { typeLabel: 'fixture', cost: 0, basePower: 2, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities });
  return { schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'fixture', name: 'fixture', class: 'Caster',
    cards: [card('fixture.ward', [ability('protect', [], modifiers)]),
      card('fixture.target', [ability('close', [{ type: 'close_source_card' }], [])]),
      card('fixture.other', [ability('close', [{ type: 'close_source_card' }], [])])] };
}
function state(modifiers = [modifier()]) {
  const pack = rules.loadAuthoringJson(archive(modifiers)); assert.deepEqual(pack.report, []);
  const s = createSeededGameState({ activeSeats: [1, 2] });
  s.round.roundNumber = 7; s.round.activePhase = 'action';
  s.cards = ['ward', 'target', 'other'].map(id => ({ instanceId: id, definitionId: `fixture.${id}`,
    ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } }));
  rules.initializeAbilityRuntime(s, pack, { seed: 444 });
  for (const id of ['ward', 'target', 'other']) s.abilityRuntime.cardState[id] = { active: true, faceDown: false, playedRound: 1 };
  rules.executeAbility(s, { sourceCardId: 'ward', abilityId: 'protect', controllerId: 'p1', variables: {}, selections: {} });
  return s;
}
function interpreterClose(s, id = 'target') {
  rules.executeAbility(s, { sourceCardId: id, abilityId: 'close', controllerId: s.cards.find(card => card.instanceId === id).controllerPlayerId, variables: {}, selections: {} });
}
function typedClose(s, id = 'target') {
  return rules.executeResolution({ state: s, sourceCardId: id, controllerId: s.cards.find(card => card.instanceId === id).controllerPlayerId,
    abilityId: 'close', effects: [{ id: 'probe-close', type: 'close_source_card' }], resolutionId: `probe-${id}`, causationId: 'review-444' }).nextState;
}
check('Reproduction: direct phase-action close rejection consumes usage; typed close is atomic', () => {
  const s = state(); const before = structuredClone(s);
  assert.equal(rules.isCardCloseForbidden(s, 'target'), true);
  assert.equal(rules.calculateCardPower(s, 'target').value, 2);
  assert.throws(() => interpreterClose(s), /forbidden by a live rule modifier/);
  const expected = structuredClone(before);
  expected.abilityRuntime.usedAbilities['target:close'] = 7;
  assert.deepEqual(s, expected);
  assert.throws(() => typedClose(before), /forbidden by a live rule modifier/);
  assert.deepEqual(before, state());
  return { protected: true, directInterpreterAtomic: false, usedAbilityConsumed: true, typedAtomic: true, power: 2 };
});
check('Reproduction: authenticated dispatch forbids mandatory self close, but rolls back rejection', () => {
  const s = state();
  const legal = rules.getLegalActions(s, 'p1');
  assert.ok(legal.some(action => action.type === 'activate_ability' && action.cardInstanceId === 'target' && action.abilityId === 'close'));
  const before = structuredClone(s);
  const result = rules.dispatchAbilityCommand(s, 'p1', { type: 'activate_ability', cardInstanceId: 'target', abilityId: 'close' });
  assert.equal(result.ok, false);
  assert.equal(result.rejection.code, 'resolution_failed');
  assert.match(result.rejection.message, /forbidden by a live rule modifier/);
  assert.deepEqual(s, before);
  return { selfCloseRejected: true, dispatchRollback: true, explicitSelfCloseOverrideInFixture: false };
});
check('Multiple exact definition selectors work without protecting other controller', () => {
  const s = state([modifier(), modifier('fixture.other')]);
  assert.equal(rules.isCardCloseForbidden(s, 'target'), true);
  assert.equal(rules.isCardCloseForbidden(s, 'other'), true);
  s.cards.find(card => card.instanceId === 'other').controllerPlayerId = 'p2';
  assert.equal(rules.isCardCloseForbidden(s, 'other'), false);
  assert.equal(typedClose(s, 'other').cards.find(card => card.instanceId === 'other').zone, 'skill');
  return { independentSelectors: 2, otherControllerProtected: false };
});
check('Different definition remains closable through both routes', () => {
  const s = state(); assert.equal(rules.isCardCloseForbidden(s, 'other'), false);
  assert.equal(typedClose(s, 'other').cards.find(card => card.instanceId === 'other').zone, 'skill');
  interpreterClose(s, 'other'); assert.equal(s.cards.find(card => card.instanceId === 'other').zone, 'skill');
  return { ordinaryClosePreserved: true };
});
for (const [name, change] of [
  ['inactive source', s => { s.abilityRuntime.cardState.ward.active = false; }],
  ['face-down source', s => { s.abilityRuntime.cardState.ward.faceDown = true; }],
  ['source outside active area', s => { s.cards.find(card => card.instanceId === 'ward').zone = 'skill'; }],
  ['expired round', s => { s.round.roundNumber = 8; }],
  ['round before installation', s => { s.round.roundNumber = 6; }],
]) check(`Protection disappears: ${name}`, () => {
  const s = state(); change(s); assert.equal(rules.isCardCloseForbidden(s, 'target'), false);
  assert.equal(typedClose(s).cards.find(card => card.instanceId === 'target').zone, 'skill');
  interpreterClose(s); assert.equal(s.cards.find(card => card.instanceId === 'target').zone, 'skill');
  return { protected: false, bothClosesAllowed: true };
});
check('Malformed/widened modifier selectors are rejected by loader and live query', () => {
  const changes = [m => { m.scope.constraints = []; }, m => { m.scope.constraints = [null]; },
    m => { m.scope.constraints.push({ type: 'has_card_id', cardId: 'fixture.other' }); },
    m => { m.scope.constraints[0].cardId = 1; }, m => { m.scope.constraints[0].cardId = ''; },
    m => { m.scope.constraints[0].extra = true; }, m => { m.scope.controller = 'any'; },
    m => { m.scope.object = 'attack_card'; }, m => { m.operation = 'add'; },
    m => { m.lifecycle.duration = 'round_count'; }, m => { m.lifecycle.extra = true; },
    m => { m.value = 2; }];
  for (const change of changes) {
    const m = modifier(); change(m);
    assert.equal(rules.isAcceptedControlledCardCloseForbidModifier(m), false);
    assert.ok(rules.loadAuthoringJson(archive([m])).report.some(issue => issue.status === 'unsupported'));
    const s = state(); s.abilityRuntime.ongoingEffects[0].ruleModifiers[0].definition = m;
    assert.equal(rules.isCardCloseForbidden(s, 'target'), false);
  }
  return { rejectedNearForms: changes.length };
});
check('Parent lifecycle and execution bounds reject unsupported variants', () => {
  for (const [field, value] of [['lifecycle', { duration: 'while_active' }], ['execution', { mode: 'host_adjudicated' }]]) {
    const raw = archive(); raw.cards[0].abilities[0][field] = value;
    assert.ok(rules.loadAuthoringJson(raw).report.some(issue => issue.path === 'ruleModifiers' && issue.status === 'unsupported'));
  }
  return { unsupportedParents: 2 };
});
check('Full frozen material recount and authorized diff scope', () => {
  const read = (sha, path) => JSON.parse(git('show', `${sha}:${path}`).replace(/^\uFEFF/, ''));
  const inventory = read(BASE, 'data/phase3/full-roster-ability-inventory.json');
  const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId));
  assert.equal(frozen.size, 944);
  function material(sha) {
    const paths = git('ls-tree', '-r', '--name-only', sha, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
    const ids = paths.flatMap(path => (read(sha, path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id)).sort();
    assert.equal(ids.length, 111); assert.equal(new Set(ids).size, 111); return ids;
  }
  assert.deepEqual(material(BASE), material(HEAD));
  assert.equal(git('diff', '--name-only', BASE, HEAD, '--', 'data', 'apps'), '');
  assert.deepEqual(git('diff', '--name-only', BASE, HEAD).split('\n').sort(), [
    'docs/reports/2026-09-25-p3-b-main-replay-fb2-42-result.md', 'packages/rules/src/ability/card-close-forbid.ts',
    'packages/rules/src/ability/interpreter.ts', 'packages/rules/src/ability/loader.ts',
    'packages/rules/src/ability/resolution-dataflow.ts', 'packages/rules/src/core/card-source-state.ts',
    'packages/rules/src/index.ts', 'packages/rules/tests/fb2-42-controlled-card-close-forbid.test.ts',
  ]);
  git('diff', '--check', BASE, HEAD);
  return { frozen: 944, material: 111, additions: 0, removals: 0, duplicates: 0, authorizedPaths: 8 };
});
process.stdout.write(`${JSON.stringify({ pr: 444, targetSha: HEAD, results }, null, 2)}\n`);
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
