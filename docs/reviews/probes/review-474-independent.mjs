import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const rules = await import(pathToFileURL(path.resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(path.resolve('packages/rules/src/tools/seeded-state.ts')).href);
const ID = 'servant.review-full.skill';
const ability = () => ({ id: 'review.full', kind: 'passive', printedClause: 'fixture', activation: {},
  conditions: [], targets: [], effects: [], cost: [], creates: [], lifecycle: {}, limit: {}, visibility: {}, responseWindow: {},
  ruleModifiers: [{ id: 'review.replace', printedClause: 'fixture', operation: 'replace', rule: 'combat_reward_distribution',
    scope: { subject: 'controller', whenControllerWins: true, mode: 'full_reward_each' } }],
  execution: { mode: 'automatic', allowedOperations: [] } });
const archive = a => ({ schemaVersion: 'fd-card-authoring-v1', id: 'servant.review-full', name: 'review', class: 'Assassin',
  cards: [{ id: ID, name: ID, cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.review-full' },
    cardFace: { typeLabel: 'Passive', attributes: ['Passive'], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [a],
    verification: { implementationStatus: 'complete' } }] });
function setup(a = ability()) {
  const loaded = rules.loadAuthoringJson(archive(a));
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4, 5, 6, 7] });
  state.map = structuredClone(state.map); state.cards = [];
  state.round.activePhase = 'battle';
  state.players.forEach((p, i) => { p.locationId = i < 3 ? 'miyama_town' : 'recon'; });
  state.cards.push({ instanceId: 'provider', definitionId: ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
  const location = state.map.locations.find(l => l.id === 'miyama_town');
  location.rewardHooks = ['battle_rewards', 'competition_rewards', 'location_rewards'];
  location.vpRewardRules = { battle: 2, competition: 3, location: 4 };
  state.eventPlacements = [{ locationId: 'miyama_town', eventCardId: 'review.event', victoryPoints: 2, visibility: { scope: 'public' } }];
  state.battleResults = [];
  rules.initializeAbilityRuntime(state, loaded, { seed: 474 });
  return { state, loaded };
}
function resolve(state) {
  return rules.resolveBattlefield(state, { battlefieldId: 'miyama_town',
    participants: [{ playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 5 }, { playerId: 'p3', totalPower: 1 }] }).nextState;
}
let checks = 0;
function check(name, fn) { fn(); checks++; console.log(`PASS ${name}`); }
check('full component rewards and downstream reduction settle authoritatively', () => {
  const { state } = setup(); const resolved = resolve(state); const result = resolved.battleResults.at(-1);
  assert.equal(result.vpReward, 2); assert.equal(result.baseVpPerWinner, 5);
  assert.equal(result.vpAdjustments.find(e => e.playerId === 'p2' && e.source === 'competition_vp').delta, 3);
  assert.equal(result.vpAdjustments.find(e => e.playerId === 'p2' && e.source === 'location_vp').delta, 4);
  result.vpAdjustments.push({ playerId: 'p1', delta: -1, source: 'battle_vp', label: 'review.reduce' });
  const scored = rules.applyBattleScoring(resolved).nextState;
  assert.equal(scored.players[0].vp, 8); assert.equal(scored.players[1].vp, 9);
});
check('losing/foreign/face-down/inactive/nonboard sources retain ordinary split', () => {
  for (const mutation of [s => { s.cards[0].zone = 'discard'; },
    s => { s.cards[0].ownerPlayerId = 'p3'; s.cards[0].controllerPlayerId = 'p3'; },
    s => { s.cards[0].controllerPlayerId = 'p2'; },
    s => { s.abilityRuntime.cardState.provider = { active: false, faceDown: true }; },
    s => { s.cards[0].zone = 'attack_area'; s.abilityRuntime.cardState.provider = { active: false, faceDown: false }; }]) {
    const { state } = setup(); mutation(state); assert.equal(resolve(state).battleResults.at(-1).baseVpPerWinner, 3);
  }
});
check('genuine widened scope/execution rejected by loader', () => {
  for (const mutation of [a => { a.ruleModifiers[0].scope.mode = 'split'; }, a => { a.execution.allowedOperations = ['adjust-mana']; }]) {
    const a = ability(); mutation(a); assert.ok(rules.loadAuthoringJson(archive(a)).report.some(e => e.status === 'unsupported'));
  }
});
check('F1 compiled malformed nonempty envelope containers masquerade as empty and grant full rewards', () => {
  for (const key of ['activation', 'lifecycle', 'limit', 'visibility']) {
    const { state } = setup(); const a = state.abilityRuntime.pack.cards[ID].abilities[0];
    a[key] = ['unexpected-nonempty-shape'];
    assert.equal(rules.isAcceptedFullRewardEachAbility(a), true);
    assert.equal(resolve(state).battleResults.at(-1).baseVpPerWinner, 5);
  }
});
console.log(`${checks}/4 expected checks PASS; F1 is an unsupported compiled-shape admission defect, not a client exploit.`);
