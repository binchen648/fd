import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(head, '59d930f9e5a0202e0d1b3d9358e0d35ca3a0d029');
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
function setup() {
  const raw = { id: 'review.suppress', kind: 'phase_action', printedClause: 'review fixture',
    activation: { phase: 'combat', opens: 'controller_combat_action_window' },
    conditions: [{ type: 'source_active' }, { type: 'at_battlefield' }], targets: [],
    effects: [{ type: 'suppress_next_round_situation_benefits', target: { scope: 'same_battlefield_opponents',
      where: [{ type: 'does_not_control_card_definition', definitionIds: ['card.cardluck'], zones: ['attack'], activeOnly: true, face: 'up' }] },
      roundOffset: 1, benefits: ['situation_mana_gain', 'situation_power_bonus'] }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic' } };
  const loaded = rules.loadAuthoringJson({ schemaVersion: 'fd-card-authoring-v1', id: 'master.review', name: 'review fixture',
    cards: [{ id: 'review.source', name: 'review source', cardType: 'master_skill', cardFace: { typeLabel: 'attack', cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [raw] }] });
  assert.deepEqual(loaded.report, []);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{ instanceId: 'source', definitionId: 'review.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } }];
  state.round.activePhase = 'battle'; state.round.prioritySeat = state.players[0].seat;
  state.players[0].locationId = 'miyama_town'; state.players[1].locationId = 'miyama_town'; state.players[2].locationId = 'shinto';
  rules.initializeAbilityRuntime(state, loaded, { seed: 428 });
  state.abilityRuntime.cardState.source = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}
const activate = (state) => rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId: 'review.suppress' });
const grant = (state, source = 'situation') => rules.grantMana(state, 'p2', 2, { source }).actualAmount;
const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
check('Positive: current/next/following round and non-situation mana remain correctly bounded', () => {
  const state = setup(); assert.equal(activate(state).ok, true);
  assert.deepEqual(state.abilityRuntime.situationBenefitsSuppressedRoundByPlayer, { p2: 2 });
  state.players[1].mana = 0; assert.equal(grant(state), 2);
  rules.advanceAbilityPhase(state, 'battle', 2); state.players[1].mana = 0;
  assert.equal(grant(state), 0); assert.equal(grant(state, 'event'), 2);
  rules.advanceAbilityPhase(state, 'battle', 3); state.players[1].mana = 0; assert.equal(grant(state), 2);
});
for (const marker of [[], true, false, 7, '']) check(`Malformed marker map ${JSON.stringify(marker)} rejects atomically`, () => {
  const state = setup(); state.abilityRuntime.situationBenefitsSuppressedRoundByPlayer = marker;
  const before = JSON.stringify(state); const result = activate(state);
  assert.equal(result.ok, false, `accepted malformed map, normalized to ${JSON.stringify(state.abilityRuntime.situationBenefitsSuppressedRoundByPlayer)}`);
  assert.equal(JSON.stringify(state), before);
});
check('Positive: malformed marker value and unknown-player entry reject atomically', () => {
  for (const marker of [{ p2: -1 }, { ghost: 2 }]) {
    const state = setup(); state.abilityRuntime.situationBenefitsSuppressedRoundByPlayer = marker;
    const before = JSON.stringify(state); assert.equal(activate(state).ok, false); assert.equal(JSON.stringify(state), before);
  }
});
check('Consecutive accepted activations must not erase already-current suppression', () => {
  const state = setup(); assert.equal(activate(state).ok, true);
  rules.advanceAbilityPhase(state, 'battle', 2); state.players[1].mana = 0;
  assert.equal(grant(state), 0); assert.equal(activate(state).ok, true);
  assert.equal(grant(state), 0, `round2 suppression erased by future marker ${JSON.stringify(state.abilityRuntime.situationBenefitsSuppressedRoundByPlayer)}`);
});
console.log(JSON.stringify({ head, results }, null, 2));
process.exitCode = results.some((result) => !result.pass) ? 1 : 0;
