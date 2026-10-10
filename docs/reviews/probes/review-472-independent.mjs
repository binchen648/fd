import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const root = process.cwd();
const rules = await import(pathToFileURL(path.join(root, 'packages/rules/src/index.ts')).href);
const { MatchSession, restoreMatchSession } = await import(pathToFileURL(path.join(root, 'packages/rules/src/match-session.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(path.join(root, 'packages/rules/src/tools/seeded-state.ts')).href);
const content = await import(pathToFileURL(path.join(root, 'packages/content/src/index.ts')).href);
const OWNER = 'servant.review-core';
const SOURCE = `${OWNER}.skill`;
const ABILITY = 'review.core';
const LUCK = '\u5e78\u8fd0';
const POWER = '\u529b\u91cf';
const shell = () => ({
  id: ABILITY, kind: 'phase_action', printedClause: 'review fixture',
  activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
  conditions: [], targets: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, limit: {}, visibility: {},
  effects: [{ type: 'resolve_battle_luck_close_draw_immediate_play', discardAttribute: LUCK,
    maxClosePerOpponent: 1, excludePerGame: true, refund: 'effective_play_cost', drawCount: 1,
    playDrawnCard: 'optional_turn_order', immediatePlayQuota: 'effect', actionAbilityPermission: 'this_round' }],
  responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
  execution: { mode: 'automatic', allowedOperations: [] },
});
function response() {
  return { id: 'review.response', kind: 'optional_trigger', printedClause: 'review response',
    activation: { trigger: 'on_card_played', requiresSourceState: 'active' }, conditions: [],
    targets: [{ id: 'review.choice', type: 'choice', options: [{ id: 'continue' }], count: { min: 1, max: 1 } }],
    effects: [{ type: 'adjust_mana', amount: 1 }], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
    responseWindow: { opens: 'on_card_played', order: 'turn_order', passBehavior: 'decline_this_window' },
    limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] } };
}
function definition(id, cost, attributes = [POWER], abilities = []) {
  return { id, name: id, cardType: 'basic_attack', cardFace: { typeLabel: 'attack', attributes, cost, basePower: cost || 1 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities, mode: 'automatic' };
}
function setup(nested = false, twoLuck = false) {
  const pack = rules.loadAuthoringJson({ schemaVersion: 'fd-card-authoring-v1', id: OWNER, name: 'Review', class: 'Assassin',
    cards: [{ id: SOURCE, name: SOURCE, cardType: 'servant_skill', owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: 'special', attributes: ['special'], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [shell()],
      verification: { implementationStatus: 'complete' } }] });
  assert.equal(pack.report.some(entry => entry.status === 'unsupported'), false);
  for (const [id, def] of Object.entries({
    luck: definition('luck', 0, [LUCK]), attack: definition('attack', 2), attack3: definition('attack3', 3),
    draw: definition('draw', 1, [POWER], nested ? [response()] : []), draw3: definition('draw3', 1),
  })) pack.cards[id] = def;
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4, 5, 6, 7] });
  state.map = structuredClone(state.map);
  state.cards = [];
  state.round.activePhase = 'battle'; state.round.prioritySeat = 1;
  state.players.forEach((p, i) => { p.locationId = i < 3 ? 'shinto' : 'recon'; p.mana = i === 0 ? 10 : 0; });
  rules.initializeAbilityRuntime(state, pack, { seed: 472 });
  function add(definitionId, owner, zone, active = false) {
    const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
    state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
      visibility: active ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } });
    if (active) state.abilityRuntime.cardState[instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    return instanceId;
  }
  const b = { source: add(SOURCE, 'p1', 'field', true), luck: add('luck', 'p1', 'hand'),
    attack: add('attack', 'p2', 'attack_area', true), attack3: add('attack3', 'p3', 'attack_area', true),
    draw: add('draw', 'p2', 'deck'), draw3: add('draw3', 'p3', 'deck') };
  if (twoLuck) b.luck2 = add('luck', 'p1', 'hand');
  return { state, b };
}
function command(state, who, value) {
  const result = rules.dispatchAbilityCommand(state, who, value);
  assert.equal(result.ok, true, JSON.stringify(result.rejection));
}
function activate(state, b) { command(state, 'p1', { type: 'activate_ability', cardInstanceId: b.source, abilityId: ABILITY }); }
function choose(state, who, ids) {
  command(state, who, { type: 'choose_target', decisionId: state.abilityRuntime.pendingDecision.id, selectedIds: ids });
}
function toPlay(state, b) {
  activate(state, b); choose(state, 'p1', [b.attack]); choose(state, 'p1', []);
  assert.equal(state.abilityRuntime.pendingDecision.interaction.kind, 'battle_drawn_card_optional_play_v1');
}
function roundTrip(state) {
  const session = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: state.players.map(p => p.id),
    restorePackKind: 'trusted_authoring_fixture' }, false);
  session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
  return restoreMatchSession(session.serializeSession(), { restorePackKind: 'trusted_authoring_fixture' });
}
let passed = 0;
function check(label, fn) { fn(); passed++; console.log(`PASS ${label}`); }

check('ordinary close/draw/optional-play stages and completed state round-trip', () => {
  const { state, b } = setup(); activate(state, b); roundTrip(state);
  choose(state, 'p1', [b.attack]); choose(state, 'p1', []); roundTrip(state);
  choose(state, 'p2', [b.draw]);
  assert.equal(state.players[1].mana, 1);
  assert.equal(state.abilityRuntime.battleCloseDrawImmediatePlayHistory.length, 1);
  assert.equal(state.abilityRuntime.pendingBattleCloseDrawPlayTransaction, undefined);
  roundTrip(state);
});
check('F1 legitimate nested response and nested generic decision each reject restore; continuation itself succeeds', () => {
  const { state, b } = setup(true); toPlay(state, b); roundTrip(state);
  choose(state, 'p2', [b.draw]);
  assert.ok(state.abilityRuntime.pendingBattleCloseDrawPlayTransaction);
  assert.equal(state.abilityRuntime.pendingDecision, undefined);
  const window = state.abilityRuntime.responseWindows[0]; assert.ok(window);
  assert.throws(() => roundTrip(state), /Invalid MatchSession state container/);
  command(state, 'p2', { type: 'resolve_response', windowId: window.id, cardInstanceId: b.draw, abilityId: 'review.response' });
  assert.deepEqual(state.abilityRuntime.pendingDecision.candidates, ['continue']);
  assert.ok(state.abilityRuntime.pendingBattleCloseDrawPlayTransaction);
  assert.throws(() => roundTrip(state), /Invalid MatchSession state container/);
  choose(state, 'p2', ['continue']);
  assert.equal(state.abilityRuntime.pendingBattleCloseDrawPlayTransaction, undefined);
  roundTrip(state);
});
check('ordinary real-loop round progression retires completed history and permission', () => {
  const fixture = setup(); toPlay(fixture.state, fixture.b); choose(fixture.state, 'p2', [fixture.b.draw]);
  let state = fixture.state;
  for (const phase of ['cleanup', 'round_end', 'round_start']) {
    state = rules.stepGameLoop(state).nextState; assert.equal(state.round.activePhase, phase); roundTrip(state);
  }
  assert.equal(state.round.roundNumber, 2);
  assert.deepEqual(state.abilityRuntime.battleCloseDrawImmediatePlayHistory, []);
  assert.equal(state.abilityRuntime.cardState[fixture.b.draw].actionAbilityAllowedInCombatRound, undefined);
});
check('same-round second activation cleanly restores and settles', () => {
  const { state, b } = setup(false, true);
  activate(state, b); choose(state, 'p1', [b.luck]); choose(state, 'p1', [b.attack]); choose(state, 'p1', []);
  choose(state, 'p2', [b.draw]); roundTrip(state);
  activate(state, b); roundTrip(state); choose(state, 'p1', []); roundTrip(state);
});
check('orphan authenticated draw and substituted exact drawn card fail closed', () => {
  const { state, b } = setup(); toPlay(state, b);
  const tx = structuredClone(state.abilityRuntime.pendingBattleCloseDrawPlayTransaction);
  const d = structuredClone(state.abilityRuntime.pendingDecision);
  delete state.abilityRuntime.pendingBattleCloseDrawPlayTransaction; delete state.abilityRuntime.pendingDecision;
  assert.throws(() => roundTrip(state), /Invalid or missing battle close\/draw\/play persisted authority/);
  state.abilityRuntime.pendingBattleCloseDrawPlayTransaction = tx; state.abilityRuntime.pendingDecision = d;
  roundTrip(state);
  state.cards.push({ instanceId: 'substitute', definitionId: 'draw', ownerPlayerId: 'p2', controllerPlayerId: 'p2',
    zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } });
  tx.rewards[0].drawnCardId = 'substitute'; d.candidates = ['substitute']; d.interaction.drawnCardId = 'substitute';
  assert.throws(() => roundTrip(state), /Invalid or missing battle close\/draw\/play persisted authority/);
});
check('compiled near-match shell fails atomically before discard', () => {
  const { state, b } = setup(); state.abilityRuntime.pack.cards[SOURCE].abilities[0].effects[0].drawCount = 2;
  const before = structuredClone(state);
  const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: b.source, abilityId: ABILITY });
  assert.equal(result.ok, false); assert.deepEqual(state, before);
});
check('strict generated discrepancy is isolated to absent nonblocking external images', () => {
  const loaded = content.loadPlaytestContentPack(path.resolve('data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: root });
  const fresh = content.compileLoadedPlaytestPack(loaded, content.validateLoadedPlaytestPack(loaded, { workspaceRoot: root })).evidenceReport;
  const old = JSON.parse(readFileSync('data/generated/fd-playtest-v1.evidence-report.json', 'utf8'));
  const missing = fresh.issues.filter(i => !old.issues.some(j => j.entityId === i.entityId && j.code === i.code));
  assert.equal(missing.length, 31);
  assert.ok(missing.every(i => i.code === 'SOURCE_ASSET_UNVERIFIED' && !i.blocking));
  const normalized = structuredClone(fresh);
  normalized.issues = normalized.issues.filter(i => !missing.some(m => m.entityId === i.entityId && m.code === i.code));
  for (const row of normalized.entities) if (missing.some(m => m.entityId === row.entityId))
    row.issueCodes = row.issueCodes.filter(code => code !== 'SOURCE_ASSET_UNVERIFIED');
  assert.deepEqual(normalized, old);
  console.log(`Generated issues: ${fresh.issues.length} local / ${old.issues.length} checked-in; strict verifier remains FAIL.`);
});
console.log(`${passed}/7 expected checks PASS; F1 records a real legal-state restore defect, not successful persistence.`);
