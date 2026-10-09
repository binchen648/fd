import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(head, '9a2a273d67b59872f4589d2ec10cbf32b2e1cef5');
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
function setup(amount = 2) {
  const raw = { id: 'review.gain', kind: 'forced_trigger', printedClause: 'review fixture',
    activation: { trigger: 'game_start' }, conditions: [], targets: [],
    effects: [{ type: 'gain_victory_points_per_target', target: 'controller', countTarget: { scope: 'same_battlefield_opponents' }, amountPerTarget: amount }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] } };
  const pack = rules.loadAuthoringJson({ schemaVersion: 'fd-card-authoring-v1', id: 'review.fixture', name: 'review fixture',
    cards: [{ id: 'review.card', name: 'review card', cardType: 'master_skill', cardFace: { cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [raw] }] });
  assert.deepEqual(pack.report, []);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.players.forEach((player) => { player.locationId = 'miyama_town'; });
  state.players[0].vp = 2;
  state.cards = [{ instanceId: 'source', definitionId: 'review.card', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  rules.initializeAbilityRuntime(state, pack, { seed: 449 });
  return state;
}
const results = [];
function check(name, fn) { try { fn(); results.push({ name, pass: true }); } catch (error) { results.push({ name, pass: false, detail: String(error) }); } }
check('Two active opponents, canonical resource binding and event replay idempotency', () => {
  const state = setup();
  rules.processAbilityEvent(state, { id: 'probe', type: 'game_start' });
  assert.equal(state.players[0].vp, 6);
  const emitted = state.abilityRuntime.events.filter((event) => event.type === 'victory_points_adjusted');
  assert.equal(emitted.length, 1); assert.equal(emitted[0].delta, 4); assert.equal(emitted[0].sourceAbilityId, 'review.gain');
  const before = JSON.stringify(state);
  rules.processAbilityEvent(state, { id: 'probe', type: 'game_start' });
  assert.equal(JSON.stringify(state), before);
});
check('Inactive opponent and different battlefield excluded; valid zero remains legal', () => {
  const state = setup(); state.players[1].status = 'eliminated'; state.players[2].locationId = 'shinto';
  rules.processAbilityEvent(state, { id: 'zero', type: 'game_start' });
  assert.equal(state.players[0].vp, 2);
  assert.equal(state.abilityRuntime.events.find((event) => event.type === 'victory_points_adjusted').delta, 0);
});
for (const [name, mutate, amount] of [
  ['Balance overflow rejects without state/event/revision mutation', (state) => { state.players[0].vp = Number.MAX_SAFE_INTEGER; }, 2],
  ['Total multiplication overflow rejects without mutation', () => {}, Number.MAX_SAFE_INTEGER],
  ['Workshop is invalid controller context and rejects atomically', (state) => { state.players[0].locationId = 'magic_workshop'; }, 2],
]) check(name, () => {
  const state = setup(amount); mutate(state); const before = JSON.stringify(state);
  assert.throws(() => rules.processAbilityEvent(state, { id: name, type: 'game_start' }));
  assert.equal(JSON.stringify(state), before);
});
console.log(JSON.stringify({ head, results }, null, 2));
process.exitCode = results.some((result) => !result.pass) ? 1 : 0;
