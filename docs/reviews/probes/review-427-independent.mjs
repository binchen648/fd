import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(head, 'd3ed651db4ba6ca26f9a715a87840065f3db6fd7');
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
function ability() {
  return { id: 'review.threshold', kind: 'forced_trigger', printedClause: 'review fixture',
    activation: { trigger: 'player.victory-points.changed' },
    conditions: [{ type: 'event_player_is_opponent' }, { type: 'event_round_victory_points_gain_crosses', threshold: 7 }],
    targets: [], effects: [{ type: 'return_card_by_definition', target: 'controller', definitionId: 'review.target',
      destination: 'master-skills', createIfMissing: true, face: 'up', active: false }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] } };
}
function archive(raw = ability()) {
  return { schemaVersion: 'fd-card-authoring-v1', id: 'master.review', name: 'review fixture', cards: [{
    id: 'review.source', name: 'review source', cardType: 'master_skill', cardFace: { typeLabel: 'passive', cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [raw] }] };
}
function setup() {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.players[0].masterCardId = 'master.review';
  state.cards = [{ instanceId: 'source', definitionId: 'review.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  const definition = (id, abilities = []) => ({ id, name: id, cardType: 'master_skill', ownerId: 'master.review',
    cardFace: { typeLabel: 'passive', cost: 0, basePower: 0 }, playTiming: {}, playRequirements: [], abilities,
    mode: 'automatic', playKind: 'support', destinationZone: 'field' });
  rules.initializeAbilityRuntime(state, { cards: { 'review.source': definition('review.source', [ability()]),
    'review.target': definition('review.target') } }, { seed: 427 });
  return state;
}
const returned = (state) => state.cards.filter((card) => card.definitionId === 'review.target');
const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
check('Positive: exact raw/loader/compiled envelope', () => {
  const raw = ability(); assert.equal(rules.isAcceptedOpponentRoundVpGainThresholdAbility(raw, 'authoring'), true);
  const loaded = rules.loadAuthoringJson(archive(raw)); assert.deepEqual(loaded.report, []);
  assert.equal(rules.isAcceptedOpponentRoundVpGainThresholdAbility(loaded.cards['review.source'].abilities[0], 'compiled'), true);
});
for (const [label, mutate] of [
  ['null second condition', (raw) => { raw.conditions[1] = null; }],
  ['null first effect', (raw) => { raw.effects[0] = null; }],
  ['sparse second condition', (raw) => { delete raw.conditions[1]; }],
]) {
  check(`Classifier must return false without native exception: ${label}`, () => {
    const raw = ability(); mutate(raw);
    assert.equal(rules.isAcceptedOpponentRoundVpGainThresholdAbility(raw, 'authoring'), false);
  });
  check(`Loader must report unsupported without native exception: ${label}`, () => {
    const raw = ability(); mutate(raw); const loaded = rules.loadAuthoringJson(archive(raw));
    assert.ok(loaded.report.some((entry) => entry.path === 'opponentRoundVpGainThreshold.gateway'));
    assert.equal(loaded.cards['review.source'].abilities[0].execution.mode, 'unsupported');
  });
}
check('Positive: gain-loss-gain sums positive gains and does not retrigger after crossing', () => {
  const state = setup(); rules.adjustVictoryPointsAuthoritatively(state, 'p2', 3); assert.equal(returned(state).length, 0);
  rules.adjustVictoryPointsAuthoritatively(state, 'p2', -3);
  rules.adjustVictoryPointsAuthoritatively(state, 'p2', 4); assert.equal(returned(state).length, 1);
  assert.equal(state.abilityRuntime.roundPositiveVictoryPointGain.byPlayer.p2, 7);
  const target = returned(state)[0]; target.zone = 'discard';
  rules.adjustVictoryPointsAuthoritatively(state, 'p2', 1); assert.equal(returned(state)[0].zone, 'discard');
});
check('Positive: separate opponent ledgers and controller exclusion', () => {
  const state = setup(); rules.adjustVictoryPointsAuthoritatively(state, 'p1', 7); assert.equal(returned(state).length, 0);
  rules.adjustVictoryPointsAuthoritatively(state, 'p2', 3); rules.adjustVictoryPointsAuthoritatively(state, 'p3', 4);
  assert.equal(returned(state).length, 0); rules.adjustVictoryPointsAuthoritatively(state, 'p2', 4);
  assert.equal(returned(state).length, 1);
});
check('Positive: duplicate root event is mutation-free; next round permits same physical return', () => {
  const state = setup(); const id = rules.adjustVictoryPointsAuthoritatively(state, 'p2', 7);
  const target = returned(state)[0]; const physicalId = target.instanceId;
  const facts = state.abilityRuntime.trustedVictoryPointChanges[id];
  const { crossed: _crossed, ...eventFacts } = facts;
  const before = JSON.stringify(state);
  rules.processAbilityEvent(state, { id, type: 'player.victory-points.changed', ...eventFacts });
  assert.equal(JSON.stringify(state), before);
  target.zone = 'removed_from_game'; rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
  rules.adjustVictoryPointsAuthoritatively(state, 'p2', 7);
  assert.equal(returned(state).length, 1); assert.equal(returned(state)[0].instanceId, physicalId); assert.equal(returned(state)[0].zone, 'skill');
});
check('Positive: forged unstamped event rejects without state mutation', () => {
  const state = setup(); const before = JSON.stringify(state);
  assert.throws(() => rules.processAbilityEvent(state, { id: 'forged', type: 'player.victory-points.changed', playerId: 'p2',
    resource: 'victory_points', delta: 7, before: 0, after: 7, roundNumber: state.round.roundNumber }), /authoritative provenance/);
  assert.equal(JSON.stringify(state), before);
});
check('Positive: duplicate-target failure rolls back VP, provenance, ledger and cards together', () => {
  const state = setup(); for (const instanceId of ['a', 'b']) state.cards.push({ instanceId, definitionId: 'review.target',
    ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'discard', visibility: { scope: 'public' } });
  const before = JSON.stringify(state);
  assert.throws(() => rules.adjustVictoryPointsAuthoritatively(state, 'p2', 7), /duplicate controller-owned physical instances/);
  assert.equal(JSON.stringify(state), before);
});
console.log(JSON.stringify({ head, results }, null, 2));
process.exitCode = results.some((result) => !result.pass) ? 1 : 0;
