import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(head, '8e3570d753a42683d3d69751a51900f5daeaefee');
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
function setup() {
  const ability = { id: 'review.close', kind: 'phase_action', printedClause: 'review fixture', markers: ['m50_structured_v1'],
    activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
    conditions: [{ type: 'target_count_equals', scope: 'same_battlefield_opponents', count: 1 }], targets: [],
    effects: [{ type: 'opponent_close_one_non_residual' }], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] } };
  const card = (id, abilities) => ({ id, name: id, cardType: 'basic_attack', cardFace: { cost: 0, basePower: 1 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities });
  const pack = rules.loadAuthoringJson({ schemaVersion: 'fd-card-authoring-v1', id: 'review.fixture', name: 'review fixture',
    cards: [card('review.source', [ability]), card('review.attack', [])] });
  assert.deepEqual(pack.report, []);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.players.forEach((player) => { player.locationId = 'miyama_town'; });
  state.round.activePhase = 'battle'; state.round.prioritySeat = 1;
  state.cards = [['source', 'review.source', 'p1'], ['a', 'review.attack', 'p2'], ['b', 'review.attack', 'p2']].map(([instanceId, definitionId, playerId]) =>
    ({ instanceId, definitionId, ownerPlayerId: playerId, controllerPlayerId: playerId, zone: 'attack_area', visibility: { scope: 'public' } }));
  rules.initializeAbilityRuntime(state, pack, { seed: 450 });
  for (const card of state.cards) state.abilityRuntime.cardState[card.instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  assert.equal(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId: ability.id }).ok, true);
  return state;
}
const results = [];
function check(name, fn) { try { fn(); results.push({ name, pass: true }); } catch (error) { results.push({ name, pass: false, detail: String(error) }); } }
const command = (state, selectedIds = ['a']) => ({ type: 'choose_target', decisionId: state.abilityRuntime.pendingDecision.id, selectedIds });
check('Exactly one closes, mandatory owner chooser, terminal replay rejected atomically', () => {
  const state = setup(); const chosen = command(state);
  assert.equal(state.abilityRuntime.pendingDecision.controllerId, 'p2');
  assert.equal(rules.dispatchAbilityCommand(state, 'p2', chosen).ok, true);
  assert.equal(state.abilityRuntime.cardState.a.active, false); assert.equal(state.abilityRuntime.cardState.b.active, true);
  const before = JSON.stringify(state); assert.equal(rules.dispatchAbilityCommand(state, 'p2', chosen).ok, false);
  assert.equal(JSON.stringify(state), before);
});
for (const [name, mutate, chooser, selected] of [
  ['Wrong chooser', () => {}, 'p1', ['a']],
  ['Multiple selection', () => {}, 'p2', ['a', 'b']],
  ['Unknown selection', () => {}, 'p2', ['forged']],
  ['Source leaves active zone', (state) => { state.cards[0].zone = 'skill'; }, 'p2', ['a']],
  ['Unselected candidate ownership drift', (state) => { state.cards[2].ownerPlayerId = 'p1'; }, 'p2', ['a']],
  ['Opponent leaves battlefield', (state) => { state.players[1].locationId = 'shinto'; }, 'p2', ['a']],
  ['Forged created revision', (state) => { state.abilityRuntime.pendingDecision.interaction.createdRevision--; }, 'p2', ['a']],
  ['Widened interaction metadata', (state) => { state.abilityRuntime.pendingDecision.interaction.extra = true; }, 'p2', ['a']],
]) check(`${name} rejects whole state atomically`, () => {
  const state = setup(); mutate(state); const selectedCommand = command(state, selected); const before = JSON.stringify(state);
  assert.equal(rules.dispatchAbilityCommand(state, chooser, selectedCommand).ok, false);
  assert.equal(JSON.stringify(state), before);
});
console.log(JSON.stringify({ head, results }, null, 2));
process.exitCode = results.some((result) => !result.pass) ? 1 : 0;
