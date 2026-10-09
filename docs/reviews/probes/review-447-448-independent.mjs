import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const supportedHeads = ['ac9ed4ac5b696402e9621992a9a4a9bfaba5ed04', 'f0d753f49f0b7541d14ca9a5446644cbdc751199'];
assert.ok(supportedHeads.includes(head), 'Run only from an exact reviewed candidate');
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const types = ['source_active', 'source_owned'];
if (head === supportedHeads[1]) types.push('event_player_won_combat', 'event_player_lost_combat');
function archive(type) {
  return { schemaVersion: 'fd-card-authoring-v1', id: 'review.fixture', name: 'review fixture', cards: [{
    id: 'review.card', name: 'review card', cardType: 'servant_skill', cardFace: { cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [{
      id: 'review.condition', kind: 'forced_trigger', printedClause: 'review fixture',
      activation: { trigger: 'after_battle_ended' }, conditions: [{ type }], targets: [], effects: [],
      cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    }],
  }] };
}
function setup(type) {
  const pack = rules.loadAuthoringJson(archive(type));
  assert.deepEqual(pack.report, []);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{ instanceId: 'source', definitionId: 'review.card', ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone: 'field', visibility: { scope: 'public' } }];
  rules.initializeAbilityRuntime(state, pack, { seed: 447 });
  state.abilityRuntime.cardState.source = { active: true, faceDown: false };
  return state;
}
function collect(state, overrides = {}) {
  const before = JSON.stringify(state);
  const result = rules.collectTriggeredAbilities(state, { id: 'review.event', type: 'after_battle_ended',
    playerId: 'p1', battleResult: { winners: ['p1'], loserIds: ['p2', 'p3'] }, ...overrides });
  assert.equal(JSON.stringify(state), before, 'Condition evaluation must be read-only');
  return result;
}
const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
for (const type of types) {
  check(`${type}: loader positive and payload rejection`, () => {
    assert.deepEqual(rules.loadAuthoringJson(archive(type)).report, []);
    for (const payload of [{ negated: true }, { owner: 'controller' }, { player: 'controller' }]) {
      const raw = archive(type);
      Object.assign(raw.cards[0].abilities[0].conditions[0], payload);
      assert.equal(rules.loadAuthoringJson(raw).cards['review.card'].abilities[0].execution.mode, 'unsupported');
    }
  });
  for (const route of ['effects', 'cost', 'creates', 'playRequirements', 'target.conditions', 'target.constraints',
    'modifier.conditions', 'modifier.value', 'modifier.scope.constraints']) {
    check(`${type}: forbidden ${route} carrier`, () => {
      const raw = archive(type), card = raw.cards[0], ability = card.abilities[0], token = { type };
      ability.conditions = [];
      if (route === 'playRequirements') card.playRequirements = [token];
      else if (route.startsWith('target.')) {
        ability.targets = [{ id: 'review.target', type: 'player', count: { min: 0, max: 1 }, [route.split('.')[1]]: [token] }];
      } else if (route.startsWith('modifier.')) {
        ability.lifecycle = { duration: 'this_round' };
        const modifier = { type: 'combat_power_modifier', rule: 'attack.currentPower', operation: 'add', value: 1,
          scope: { object: 'attack_card', controller: 'self', constraints: [] }, lifecycle: { duration: 'this_round' } };
        if (route === 'modifier.scope.constraints') modifier.scope.constraints = [token];
        else modifier[route.split('.')[1]] = route === 'modifier.value' ? token : [token];
        ability.ruleModifiers = [modifier];
      } else ability[route] = [token];
      const loaded = rules.loadAuthoringJson(raw);
      assert.ok(loaded.report.some((entry) => /supported only under ability conditions/.test(entry.reason)));
      if (route === 'playRequirements') assert.equal(loaded.cards['review.card'].mode, 'unsupported');
      else assert.equal(loaded.cards['review.card'].abilities[0].execution.mode, 'unsupported');
    });
  }
}
check('source_active: canonical zone/face-down/active matrix', () => {
  for (const zone of ['field', 'attack_area', 'hand', 'discard', 'removed_from_game', 'skill']) {
    for (const active of [false, true]) for (const faceDown of [false, true]) {
      const state = setup('source_active'); state.cards[0].zone = zone;
      state.abilityRuntime.cardState.source = { active, faceDown };
      const expected = ['field', 'attack_area'].includes(zone) && active && !faceDown;
      assert.equal(collect(state).length, expected ? 1 : 0);
    }
  }
});
check('source_owned: physical owner, not card controller', () => {
  const state = setup('source_owned');
  assert.equal(collect(state).length, 1);
  state.cards[0].ownerPlayerId = 'p2';
  assert.equal(collect(state).length, 0);
});
if (head === supportedHeads[1]) {
  for (const type of types.slice(2)) {
    check(`${type}: tied outcome distinguishes event player from controller`, () => {
      const state = setup(type);
      const battleResult = { winners: ['p2', 'p3'], loserIds: ['p1'] };
      assert.equal(collect(state, { playerId: 'p2', battleResult }).length, type.endsWith('won_combat') ? 1 : 0);
      assert.equal(collect(state, { playerId: 'p1', battleResult }).length, type.endsWith('lost_combat') ? 1 : 0);
    });
    check(`${type}: malformed/contradictory outcome matrix fails closed`, () => {
      const state = setup(type);
      for (const battleResult of [undefined, null, false, 'invalid', {},
        { winners: 'p1', loserIds: [] }, { winners: ['p1'], loserIds: null },
        { winners: ['p1', 'p1'], loserIds: [] }, { winners: [], loserIds: ['p1', 'p1'] },
        { winners: ['p1'], loserIds: ['p1'] }, { winners: ['unknown'], loserIds: ['p1'] },
        { winners: ['p1'], loserIds: [1] }, { winners: [], loserIds: [] }]) {
        assert.equal(collect(state, { battleResult }).length, 0);
      }
      for (const playerId of [undefined, '', 'unknown']) assert.equal(collect(state, { playerId }).length, 0);
    });
  }
}
console.log(JSON.stringify({ head, results }, null, 2));
process.exitCode = results.some((result) => !result.pass) ? 1 : 0;
