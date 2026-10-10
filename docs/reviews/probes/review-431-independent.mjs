import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(head, 'c8fadf19c304a698e7f4c847e376a5ba6609c60e');
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
function setup() {
  const ability = { id: 'review.flip', kind: 'phase_action', printedClause: 'synthetic review',
    activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [],
    targets: [
      { id: 'strength_basic_attack', type: 'card_instance', scope: { zone: 'hand', controller: 'self' }, constraints: [{ type: 'basic_strength_attack' }], count: { min: 1, max: 1 } },
      { id: 'opponent_servant_skill', type: 'card_instance', scope: { zone: 'skill', controller: 'any' }, constraints: [{ type: 'same_location_opponent_face_up_servant_skill' }], count: { min: 1, max: 1 } },
    ], effects: [{ type: 'play_selected_cards', target: 'strength_basic_attack' }, { type: 'set_selected_card_face_down', target: 'opponent_servant_skill' }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic' } };
  const loaded = rules.loadAuthoringJson({ schemaVersion: 'fd-card-authoring-v1', id: 'servant.review', name: 'review', cards: [{
    id: 'review.source', name: 'review source', cardType: 'servant_skill', cardFace: { typeLabel: '\u88ab\u52a8', cost: 0, basePower: 0, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [ability],
  }] });
  assert.deepEqual(loaded.report, []);
  function definition(id, cardType, attributes = [], cost = 0) {
    return { id, name: id, cardType, cardFace: { typeLabel: 'test', cost, basePower: cardType === 'basic_attack' ? 1 : 0, attributes },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
      playKind: cardType === 'basic_attack' ? 'attack' : 'support', destinationZone: cardType === 'basic_attack' ? 'attack_area' : 'field' };
  }
  const pack = { cards: { ...loaded.cards, 'review.attack': definition('review.attack', 'basic_attack', ['\u529b\u91cf'], 2), 'review.target': definition('review.target', 'servant_skill') } };
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0].seat;
  state.players[0].mana = 5; state.players[0].locationId = 'miyama_town'; state.players[1].locationId = 'miyama_town';
  state.cards = [
    { instanceId: 'source', definitionId: 'review.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'attack', definitionId: 'review.attack', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'target', definitionId: 'review.target', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'skill', visibility: { scope: 'public' } },
  ];
  rules.initializeAbilityRuntime(state, pack, { seed: 431, playRulesVersion: 'explicit-v1' });
  for (const id of ['source', 'target']) state.abilityRuntime.cardState[id] = { active: true, faceDown: false, playedRound: 0 };
  assert.equal(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId: 'review.flip' }).ok, true);
  return state;
}
const choose = (state, id) => rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: state.abilityRuntime.pendingDecision.id, selectedIds: [id] });
const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
check('Positive: two-stage normal payment and physical face mutation', () => {
  const state = setup(); assert.equal(choose(state, 'attack').ok, true); assert.equal(state.players[0].mana, 3);
  assert.equal(state.cards.find(c => c.instanceId === 'attack').zone, 'attack_area');
  assert.equal(choose(state, 'target').ok, true);
  assert.equal(state.abilityRuntime.cardState.target.faceDown, true); assert.equal(state.abilityRuntime.cardState.target.active, false);
  assert.deepEqual(state.cards.find(c => c.instanceId === 'target'), { instanceId: 'target', definitionId: 'review.target', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } });
});
check('Positive: stale stage-two rejection preserves committed stage one', () => {
  const state = setup(); assert.equal(choose(state, 'attack').ok, true); state.players[1].locationId = 'shinto';
  const before = structuredClone(state); assert.equal(choose(state, 'target').ok, false); assert.deepEqual(state, before);
  assert.equal(state.players[0].mana, 3); assert.equal(state.cards.find(c => c.instanceId === 'attack').zone, 'attack_area');
});
for (const stage of [1, 2]) for (const field of ['context', 'remainingEffects']) for (const value of [null, undefined]) {
  check(`Stage ${stage}: ${field}=${String(value)} returns controlled rejection`, () => {
    const state = setup(); if (stage === 2) assert.equal(choose(state, 'attack').ok, true);
    state.abilityRuntime.pendingDecision[field] = value;
    const before = structuredClone(state);
    let result; let error;
    try { result = choose(state, stage === 1 ? 'attack' : 'target'); } catch (caught) { error = caught; }
    assert.deepEqual(state, before, 'command must not partially mutate');
    assert.ok(!error, `native exception escaped: ${String(error)}`);
    assert.equal(result.ok, false);
  });
}
console.log(JSON.stringify({ head, results }, null, 2));
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
