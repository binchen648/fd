import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(head, '532fc01f924555d97c4929db6774528648daf520');
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
function ability(visibility = {}) {
  return { id: 'review.copy', kind: 'phase_action', printedClause: 'review fixture',
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [{ type: 'source_active' }, { type: 'gt', left: { var: 'controller.deployment_bonus' }, right: 0 }],
    targets: [{ id: 'selected_attack', type: 'card_instance',
      scope: { zone: 'attack_area', owner: 'controller', controller: 'self' },
      constraints: [{ type: 'is_attack' }, { type: 'played_this_round' }, { type: 'not_source_card' }], count: { min: 1, max: 1 } }],
    effects: [{ type: 'create_selected_played_attack_temporary_copy', target: 'selected_attack' }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility,
    execution: { mode: 'automatic' } };
}
function setup(visibility = {}) {
  const raw = ability(visibility);
  const pack = rules.loadAuthoringJson({ schemaVersion: 'fd-card-authoring-v1', id: 'review.fixture', name: 'review fixture',
    cards: [{ id: 'review.source', name: 'review source', cardType: 'servant_skill', cardFace: { cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [raw] }] });
  pack.cards['review.attack'] = { id: 'review.attack', name: 'review attack', cardType: 'servant_attack',
    cardFace: { attributes: ['agility'], cost: 3, basePower: 5 }, playTiming: {}, playRequirements: [], mode: 'automatic', abilities: [] };
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0].seat;
  state.players[0].locationId = 'miyama_town'; state.players[1].locationId = 'shinto';
  state.modeState = { terrainAssignments: { miyama_town: ['p1'] } };
  state.cards = [
    { instanceId: 'source', definitionId: 'review.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } },
    { instanceId: 'attack', definitionId: 'review.attack', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } },
  ];
  rules.initializeAbilityRuntime(state, pack, { seed: 425 });
  state.abilityRuntime.cardState.source = { active: true, faceDown: false, playedRound: 0 };
  state.abilityRuntime.cardState.attack = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return { state, raw, pack };
}
function activate(state) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId: 'review.copy' });
}
function choose(state) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: state.abilityRuntime.pendingDecision.id, selectedIds: ['attack'] });
}
const results = [];
function check(name, fn) {
  try { const observed = fn(); results.push({ name, pass: true, ...(observed ? { observed } : {}) }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
check('Positive: exact envelope settles free non-played same-definition copy and refuses replay', () => {
  const { state } = setup(); const mana = state.players[0].mana;
  const counters = JSON.stringify(state.abilityRuntime.playCounters);
  assert.equal(activate(state).ok, true); const decisionId = state.abilityRuntime.pendingDecision.id;
  assert.equal(choose(state).ok, true);
  const copies = state.cards.filter((card) => card.generatedBy === 'source');
  assert.equal(copies.length, 1); assert.equal(copies[0].definitionId, 'review.attack');
  assert.deepEqual(state.abilityRuntime.cardState[copies[0].instanceId], { active: true, faceDown: false, playedRound: 0 });
  assert.equal(state.players[0].mana, mana); assert.equal(JSON.stringify(state.abilityRuntime.playCounters), counters);
  const before = JSON.stringify(state);
  assert.equal(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId, selectedIds: ['attack'] }).ok, false);
  assert.equal(JSON.stringify(state), before);
});
for (const visibility of ['invalid', [], false, 7]) check(`Negative: malformed visibility ${JSON.stringify(visibility)} must not enable automation`, () => {
  const { state, raw, pack } = setup(visibility);
  const observed = { rawAccepted: rules.isAcceptedSelectedPlayedAttackTemporaryCopyAbility(raw, 'authoring'),
    loaderIssues: pack.report.length,
    compiledAccepted: rules.isAcceptedSelectedPlayedAttackTemporaryCopyAbility(pack.cards['review.source'].abilities[0], 'compiled'),
    activated: activate(state).ok };
  assert.ok(!observed.rawAccepted && observed.loaderIssues > 0 && !observed.compiledAccepted && !observed.activated, JSON.stringify(observed));
});
check('Final rules 11.5: expired temporary attack must not enter removed_from_game or discard', () => {
  const { state } = setup(); assert.equal(activate(state).ok, true); assert.equal(choose(state).ok, true);
  const copyId = state.cards.find((card) => card.generatedBy === 'source').instanceId;
  rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
  const copy = state.cards.find((card) => card.instanceId === copyId);
  assert.ok(!copy || !['removed_from_game', 'discard'].includes(copy.zone), `Expired copy remains physical in ${copy?.zone}`);
});
check('Positive: forged pending effect rejects without any authoritative mutation', () => {
  const { state } = setup(); assert.equal(activate(state).ok, true);
  state.abilityRuntime.pendingDecision.remainingEffects = [{ type: 'adjust_victory_points', player: 'controller', amount: 99 }];
  const before = JSON.stringify(state); assert.equal(choose(state).ok, false); assert.equal(JSON.stringify(state), before);
});
console.log(JSON.stringify({ head, results }, null, 2));
process.exitCode = results.some((result) => !result.pass) ? 1 : 0;
