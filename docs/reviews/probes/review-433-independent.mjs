import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(head, '420f54df880bbad4816166c9cc94f2922248308b');
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
function ability(variant = 'entry') {
  return { id: `review.${variant}`, kind: 'forced_trigger', printedClause: 'synthetic review',
    activation: { trigger: variant === 'entry' ? 'after_controller_enters_location' : 'after_controller_wins_battle' },
    conditions: variant === 'entry' ? [{ type: 'source_active' }, { type: 'event_player_is_opponent' }, { type: 'event_location_equals_controller' }]
      : [{ type: 'source_active' }, { type: 'event_location_equals_controller' }, { type: 'event_battle_opponent_count_equals', count: 0 }],
    targets: [], effects: variant === 'entry' ? [{ type: 'source_card_combat_power_bonus', amount: 2 }] : [{ type: 'adjust_victory_points', player: 'controller', amount: 4 }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic' } };
}
const archive = (raw) => ({ schemaVersion: 'fd-card-authoring-v1', id: 'servant.review', name: 'review', cards: [{
  id: 'review.source', name: 'source', cardType: 'servant_skill', cardFace: { typeLabel: 'test', cost: 0, basePower: 5, attributes: [] },
  playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [raw],
}] });
function setup(variant = 'entry', withClose = false) {
  const raw = archive(ability(variant));
  if (withClose) raw.cards[0].abilities.push({ id: 'review.close', kind: 'phase_action', printedClause: 'synthetic external close',
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' }, conditions: [], targets: [], effects: [{ type: 'close_source_card' }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic' } });
  const pack = rules.loadAuthoringJson(raw); assert.deepEqual(pack.report, []);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.players.forEach(player => { player.locationId = 'shinto'; }); state.round.activePhase = 'action';
  state.cards = [{ instanceId: 'source', definitionId: 'review.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } }];
  rules.initializeAbilityRuntime(state, pack, { seed: 433 });
  state.abilityRuntime.cardState.source = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}
const entry = (state, id) => rules.processAuthoritativeEntryAbilityEvent(state, { id, type: 'after_controller_enters_location', playerId: 'p2', locationId: 'shinto' });
const power = (state) => rules.calculateCardPower(state, 'source').value;
const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, detail: String(error) }); }
}
check('Positive: distinct roots stack, repeated root dedupes, live phase cleanup retains bindings', () => {
  const state = setup(); entry(state, 'entry.1'); entry(state, 'entry.2'); entry(state, 'entry.2'); assert.equal(power(state), 9);
  rules.advanceAbilityPhase(state, 'battle'); assert.equal(power(state), 9);
  assert.equal(Object.keys(state.abilityRuntime.fb254SourcePowerInstallReceipts).length, 2);
});
check('Positive: untrusted exact entry installs nothing and root without receipt fails closed', () => {
  const state = setup(); rules.processAbilityEvent(state, { id: 'untrusted', type: 'after_controller_enters_location', playerId: 'p2', locationId: 'shinto' });
  assert.equal(power(state), 5); assert.equal(state.abilityRuntime.ongoingEffects.length, 0);
  entry(state, 'trusted'); delete state.abilityRuntime.fb254SourcePowerInstallReceipts;
  assert.throws(() => power(state), /Malformed FB2-54/);
});
check('Positive: trusted solo winner earns exactly four VP and repeated result dedupes', () => {
  const state = setup('win'); const before = state.players[0].vp;
  const root = { id: 'review.result', type: 'after_battle_result_determined', battlePhaseResolutionId: 'review.phase', battleId: 'review.battle', resultId: 'review.result',
    battleParticipantIds: ['p1'], battleParticipantPowers: { p1: 5 }, battlefieldId: 'shinto', battleResult: { winners: ['p1'], loserIds: [] } };
  rules.processAbilityEvent(state, root); assert.equal(state.players[0].vp, before + 4);
  rules.processAbilityEvent(state, root); assert.equal(state.players[0].vp, before + 4);
});
check('Lifecycle: accepted close command leaves projection usable', () => {
  const state = setup('entry', true); entry(state, 'entry.close'); assert.equal(power(state), 7);
  const action = rules.getLegalActions(state, 'p1').find(action => action.type === 'activate_ability' && action.abilityId === 'review.close');
  assert.ok(action, 'normal close is legal before execution');
  const before = structuredClone(state);
  const result = rules.dispatchAbilityCommand(state, 'p1', action);
  if (!result.ok) assert.deepEqual(state, before, 'rejected close must not partially commit');
  assert.ok(result.ok, `legal close rejected: ${JSON.stringify(result.rejection)}`);
  assert.equal(state.cards[0].zone, 'skill'); assert.equal(state.abilityRuntime.ongoingEffects.length, 0);
  assert.doesNotThrow(() => rules.projectAbilityState(state, 'p1'));
});
for (const invalidation of ['inactive', 'face_down', 'invalid_zone']) check(`Lifecycle: ${invalidation} survives cleanup without orphan receipt`, () => {
  const state = setup(); entry(state, 'entry.lifecycle'); assert.equal(power(state), 7);
  if (invalidation === 'inactive') state.abilityRuntime.cardState.source.active = false;
  if (invalidation === 'face_down') state.abilityRuntime.cardState.source.faceDown = true;
  if (invalidation === 'invalid_zone') state.cards[0].zone = 'skill';
  const expectedPower = invalidation === 'face_down' ? 0 : 5;
  assert.equal(power(state), expectedPower, 'invalidation must immediately stop contribution');
  rules.advanceAbilityPhase(state, 'battle');
  assert.equal(state.abilityRuntime.ongoingEffects.length, 0);
  let value; let powerError; let projectionError;
  try { value = power(state); } catch (error) { powerError = String(error); }
  try { rules.projectAbilityState(state, 'p1'); } catch (error) { projectionError = String(error); }
  assert.ok(!powerError && !projectionError, `phase committed with zero ongoing and ${Object.keys(state.abilityRuntime.fb254SourcePowerInstallReceipts ?? {}).length} receipts; power=${powerError}; projection=${projectionError}`);
  assert.equal(value, expectedPower);
});
console.log(JSON.stringify({ head, results }, null, 2));
process.exitCode = results.some(result => !result.pass) ? 1 : 0;
