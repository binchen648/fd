import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const rules = await import(pathToFileURL(path.resolve('packages/rules/src/index.ts')).href);
const { MatchSession, restoreMatchSession } = await import(pathToFileURL(path.resolve('packages/rules/src/match-session.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(path.resolve('packages/rules/src/tools/seeded-state.ts')).href);
const raw = JSON.parse(readFileSync('data/authoring/servants/servant.stheno.json', 'utf8'));
const SC2 = 'servant.stheno.skill.sc-stheno-2';
const SC3 = 'servant.stheno.skill.sc-stheno-3';
const BASE = '9fd9036c6d74427f88b3b268f9ef2916cf3f3beb';
const hash = v => createHash('sha256').update(v).digest('hex');
function response() {
  return { id: 'review.response', kind: 'optional_trigger', printedClause: 'review response',
    activation: { trigger: 'on_card_played', requiresSourceState: 'active' }, conditions: [],
    targets: [{ id: 'review.choice', type: 'choice', options: [{ id: 'continue' }], count: { min: 1, max: 1 } }],
    effects: [{ type: 'adjust_mana', amount: 1 }], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
    responseWindow: { opens: 'on_card_played', order: 'turn_order', passBehavior: 'decline_this_window' },
    limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] } };
}
function definition(id, cost, power, attributes = ['\u529b\u91cf'], abilities = []) {
  return { id, name: id, cardType: 'basic_attack', cardFace: { typeLabel: 'attack', attributes, cost, basePower: power },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities, mode: 'automatic' };
}
function setup(nested = false) {
  const loaded = rules.loadAuthoringJson(structuredClone(raw)); assert.deepEqual(loaded.report, []);
  Object.assign(loaded.cards, { luck: definition('luck', 0, 1, ['\u5e78\u8fd0']),
    attack: definition('attack', 2, 3), attack3: definition('attack3', 3, 1),
    draw: definition('draw', 1, 1, ['\u529b\u91cf'], nested ? [response()] : []) });
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4, 5, 6, 7] });
  state.map = structuredClone(state.map); state.cards = []; state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  state.players.forEach((p, i) => { p.locationId = i < 3 ? 'miyama_town' : 'recon'; p.mana = i ? 0 : 8; });
  rules.initializeAbilityRuntime(state, loaded, { seed: 475 });
  function add(definitionId, owner, zone, active = false) {
    const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
    state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
      visibility: active ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } });
    state.abilityRuntime.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
    return instanceId;
  }
  return { state, add };
}
function command(state, who, cmd) {
  const result = rules.dispatchAbilityCommand(state, who, cmd); assert.equal(result.ok, true, JSON.stringify(result.rejection));
}
function choose(state, who, ids) { command(state, who, { type: 'choose_target', decisionId: state.abilityRuntime.pendingDecision.id, selectedIds: ids }); }
function roundTrip(state) {
  const session = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: state.players.map(p => p.id),
    restorePackKind: 'trusted_authoring_fixture' }, false);
  session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
  return restoreMatchSession(session.serializeSession(), { restorePackKind: 'trusted_authoring_fixture' });
}
function sc3Board(nested) {
  const f = setup(nested); const source = f.add(SC3, 'p1', 'field', true);
  const luck = f.add('luck', 'p1', 'hand'); const attack = f.add('attack', 'p2', 'attack_area', true);
  f.add('attack3', 'p3', 'attack_area', true); const draw = f.add('draw', 'p2', 'deck');
  f.state.round.activePhase = 'battle';
  command(f.state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'sc-stheno-3.goddess-conceit' });
  assert.equal(f.state.cards.find(c => c.instanceId === luck).zone, 'discard');
  choose(f.state, 'p1', [attack]); choose(f.state, 'p1', []); roundTrip(f.state);
  choose(f.state, 'p2', [draw]); return { ...f, source, draw };
}
let checks = 0;
function check(name, fn) { fn(); checks++; console.log(`PASS ${name}`); }
check('sc1 exact base object preserved and all actual source text hashes bound', () => {
  const old = JSON.parse(execFileSync('git', ['show', `${BASE}:data/authoring/servants/servant.stheno.json`], { encoding: 'utf8' }));
  assert.deepEqual(raw.cards[0], old.cards[0]);
  assert.equal(hash(JSON.stringify(raw.cards[0])), '201bbac3a5181d19d4d162936bcc0b5bc422a0aef341657bb2ac028a2aa97229');
  for (const c of raw.cards) assert.equal(hash(c.printedText), c.phase3Evidence.sourceTextSha256);
  assert.deepEqual(raw.cards.map(c => c.id), ['servant.stheno.skill.sc-stheno-1', SC2, SC3]);
  assert.equal(execFileSync('git', ['diff', '--name-only', BASE, 'HEAD', '--', 'packages/rules/src'], { encoding: 'utf8' }), '');
});
check('exact two material additions with no duplicate frozen identity', () => {
  const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8'));
  const frozen = new Set([...inventory.staticSkills, ...(inventory.dynamicSkills ?? [])].map(r => r.canonicalAbilityId));
  assert.equal(frozen.size, 944);
  const counts = new Map();
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.json')) for (const c of JSON.parse(readFileSync(file, 'utf8')).cards ?? [])
        if (frozen.has(c.id)) counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
    }
  }
  walk('data/authoring'); assert.equal(counts.size, 142); assert.ok([...counts.values()].every(n => n === 1));
  assert.equal(execFileSync('git', ['diff', '--name-only', BASE, 'HEAD', '--', 'data/authoring'], { encoding: 'utf8' }).trim(),
    'data/authoring/servants/servant.stheno.json');
  const old = JSON.parse(execFileSync('git', ['show', `${BASE}:data/authoring/servants/servant.stheno.json`], { encoding: 'utf8' }));
  assert.deepEqual(old.cards.map(c => c.id), [raw.cards[0].id]);
  assert.equal(counts.size - (raw.cards.length - old.cards.length), 140);
});
check('sc2/sc3 real skill-zone seven/eight mana boundary and printed cost', () => {
  for (const [id, cost] of [[SC2, 0], [SC3, 2]]) for (const mana of [7, 8]) {
    const { state, add } = setup(); const source = add(id, 'p1', 'skill'); state.players[0].mana = mana;
    const before = structuredClone(state); const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: source });
    assert.equal(result.ok, mana === 8); if (mana === 7) assert.deepEqual(state, before);
    else assert.equal(state.players[0].mana, 8 - cost);
  }
});
check('actual sc2 real-loop tied reward and independent +1 trigger settle', () => {
  const { state, add } = setup(); const source = add(SC2, 'p1', 'skill');
  command(state, 'p1', { type: 'play_card', cardInstanceId: source });
  add('attack', 'p2', 'attack_area', true); add('attack3', 'p3', 'attack_area', true);
  const loc = state.map.locations.find(l => l.id === 'miyama_town');
  loc.rewardHooks = ['battle_rewards', 'competition_rewards', 'location_rewards']; loc.vpRewardRules = { battle: 2, competition: 3, location: 4 };
  state.eventPlacements = [{ locationId: 'miyama_town', eventCardId: 'review.event', victoryPoints: 2, visibility: { scope: 'public' } }];
  state.round.activePhase = 'battle';
  const next = rules.stepGameLoop(state).nextState;
  const result = next.log.find(e => e.type === 'battle_resolved' && e.message === 'battlefield:miyama_town')?.payload;
  assert.ok(result, 'authoritative battle log'); assert.deepEqual(result.winnerPlayerIds, ['p1', 'p2']);
  assert.equal(result.baseVpPerWinner, 5);
  console.log(`actual sc2 authoritative VP: ${next.players[0].vp}/${next.players[1].vp}`);
  assert.equal(next.players[0].vp, 10); assert.equal(next.players[1].vp, 9);
});
check('actual sc3 ordinary completion and round progression restores', () => {
  let { state, draw } = sc3Board(false); assert.equal(state.players[1].mana, 1); roundTrip(state);
  for (const phase of ['cleanup', 'round_end', 'round_start']) { state = rules.stepGameLoop(state).nextState; assert.equal(state.round.activePhase, phase); console.log(`sc3 restore phase: ${phase}`); roundTrip(state); }
  assert.equal(state.abilityRuntime.cardState[draw].actionAbilityAllowedInCombatRound, undefined);
});
check('F1 actual sc3 legal nested response/choice each cannot restore; settled continuation restores', () => {
  const { state, draw } = sc3Board(true); const window = state.abilityRuntime.responseWindows[0]; assert.ok(window);
  assert.throws(() => roundTrip(state), /Invalid MatchSession state container/);
  command(state, 'p2', { type: 'resolve_response', windowId: window.id, cardInstanceId: draw, abilityId: 'review.response' });
  assert.deepEqual(state.abilityRuntime.pendingDecision.candidates, ['continue']);
  assert.throws(() => roundTrip(state), /Invalid MatchSession state container/);
  choose(state, 'p2', ['continue']); roundTrip(state);
});
console.log(`${checks}/6 expected checks PASS; F1 is an actual consumer legal-state restore defect.`);
