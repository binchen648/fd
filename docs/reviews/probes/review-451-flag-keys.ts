import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(head, 'bdfa753c46d5e0a1edf6ed428c7b793acc87f5f1');
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const results = [];
for (const key of ['normal', '__proto__', 'constructor', 'toString']) {
  const effect = { type: 'set_player_flag', target: 'controller', key, value: true };
  const ability = { id: 'setter', kind: 'forced_trigger', printedClause: 'review fixture',
    activation: { trigger: 'game_start' }, conditions: [], targets: [], effects: [effect], cost: [],
    ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] } };
  const archive = { schemaVersion: 'fd-card-authoring-v1', id: 'review.fixture', name: 'review fixture',
    cards: [{ id: 'review.flag', name: 'review flag', cardType: 'master_skill', cardFace: {},
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [ability] }] };
  const pack = rules.loadAuthoringJson(archive);
  assert.deepEqual(pack.report, []);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{ instanceId: 'fixture', definitionId: 'review.flag', ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone: 'field', visibility: { scope: 'public' } }];
  rules.initializeAbilityRuntime(state, pack, { seed: 451 });
  rules.resolveEffect(state, { controllerId: 'p1', sourceCardId: 'fixture', abilityId: 'setter', variables: {}, selections: {} }, effect);
  const flags = state.abilityRuntime.structuredPlayerFlagsByPlayer.p1;
  results.push({ key, loaderIssues: pack.report.length, ownStoredValue: Object.hasOwn(flags, key) ? flags[key] : null,
    expected: true, pass: Object.hasOwn(flags, key) && flags[key] === true });
}
console.log(JSON.stringify({ head, results }, null, 2));
process.exitCode = results.some((result) => !result.pass) ? 1 : 0;
