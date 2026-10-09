// Review-only artifact. Run from the exact candidate worktree with node --import tsx.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = '40eaf45a64ecca0ddb6efe62a8bed35652420707';
const HEAD = '7f83a0cfba2cd7f781ab0c0491c9ed2607db02d6';
const MAIN = '9a1689d2ec5b56b67d1483d2593b4ab809d6c15c';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 30e6 }).trimEnd();
const emit = (value) => console.log(JSON.stringify(value));
const source = (sha, file) => git('show', `${sha}:${file}`);
let failedGates = 0;

function evidence(finding, file, patterns) {
  assert.equal(source(BASE, file), source(HEAD, file), `Base/candidate runtime drift: ${file}`);
  for (const sha of [BASE, HEAD, MAIN]) {
    const lines = source(sha, file).split('\n');
    const excerpts = patterns.map((pattern) => {
      const index = lines.findIndex((line) => pattern.test(line));
      assert.ok(index >= 0, `Missing static anchor ${pattern} at ${sha}:${file}`);
      return { line: index + 1, text: lines[index].trim() };
    });
    emit({ kind: 'static_evidence', finding, sha, file, baseCandidateFileIdentical: true, excerpts });
  }
}

function gate(finding, owner, actual, expected, passed) {
  emit({ kind: 'canonical_gate', finding, owner, status: passed ? 'PASS' : 'FAILED', actual, expected });
  if (!passed) failedGates++;
}

async function run() {
  assert.equal(git('rev-parse', 'HEAD'), HEAD, 'Must execute at the exact historical candidate');
  emit({ kind: 'binding', pr: 361, base: BASE, candidate: HEAD, main: MAIN });
  const sessionFile = 'packages/rules/src/match-session.ts';
  evidence('P1_WORKSHOP_TRIGGER_NOT_PRODUCED', sessionFile, [
    /if \(deployedLocation\?\.tags\.includes\('battlefield'\)\)/,
    /processAbilityEvent\(this.state, .*after_player_deployed_to_battlefield/,
  ]);
  const mapFile = 'packages/rules/src/data/maps/default-7p-map.json';
  for (const sha of [BASE, HEAD, MAIN]) {
    const map = JSON.parse(source(sha, mapFile));
    const location = map.locations.find((entry) => entry.id === 'magic_workshop');
    assert.ok(location.tags.includes('support_location'));
    assert.ok(!location.tags.includes('battlefield'));
    const lines = source(sha, mapFile).split('\n');
    emit({ kind: 'static_evidence', finding: 'P1_WORKSHOP_TRIGGER_NOT_PRODUCED', sha,
      file: mapFile, line: lines.findIndex((line) => line.includes('"id": "magic_workshop"')) + 1,
      workshopTags: location.tags });
  }
  evidence('P1_RESIDUAL_NOT_RETAINED', sessionFile, [
    /private discardRoundAttackAreaCards/, /ability.kind === 'residual' &&/,
    /if \(shouldRemainActive\) continue;/, /card.zone = 'discard';/,
  ]);
  evidence('P2_SOURCE_ACTIVATION_NOT_REQUIRED', 'packages/rules/src/ability/interpreter.ts', [
    /function canActivate\(/,
    /if \(a.activation.requiresSourceState === 'active' && !active\(s, sourceId\)\)/,
    /for \(const c of s.cards\)/,
  ]);

  const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
  const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
  const { createMatchSession } = await import(pathToFileURL(resolve(sessionFile)).href);
  for (const owner of ['servant.gilles', 'servant.medea']) {
    const file = `data/authoring/servants/${owner}.json`;
    const raw = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(source(HEAD, file), source(MAIN, file), 'Consumer authoring differs on supplied main');
    const definitionId = raw.cards[0].id;
    const loaded = rules.loadAuthoringJson(raw);
    assert.deepEqual(loaded.report, []);
    const setup = (mode = 'active') => {
      const state = createSeededGameState({ activeSeats: [1, 2] });
      state.cards = [];
      state.players[0].servantCardId = owner;
      state.players[0].mana = 4;
      state.players[0].vp = 1;
      rules.initializeAbilityRuntime(state, loaded, { seed: 20261009 });
      state.cards.push({ instanceId: 'review-source', definitionId,
        ownerPlayerId: 'p1', controllerPlayerId: 'p1',
        zone: mode === 'active' ? 'attack_area' : mode === 'removed' ? 'removed_from_game' : 'skill',
        visibility: { scope: 'public' } });
      if (mode !== 'unplayed') state.abilityRuntime.cardState['review-source'] = {
        active: mode === 'active', faceDown: mode === 'faceDown', playedRound: 1,
      };
      return state;
    };
    const event = { id: 'deploy:1:p1', type: 'after_player_deployed_to_battlefield',
      playerId: 'p1', locationId: 'magic_workshop' };

    const formula = setup();
    for (const [round, power] of [[1, 14], [4, 8], [7, 2], [8, 0]]) {
      formula.round.roundNumber = round;
      assert.equal(rules.calculateCardPower(formula, 'review-source').value, power);
    }
    for (const patch of [{ locationId: 'shinto' }, { playerId: 'p2' },
      { type: 'after_controller_enters_location' }]) {
      const state = setup();
      rules.processAbilityEvent(state, { ...event, ...patch });
      assert.equal(state.players[0].mana, 4);
      assert.equal(state.players[0].vp, 1);
    }
    const replay = setup();
    rules.processAbilityEvent(replay, event);
    assert.equal(replay.players[0].mana, 5);
    assert.equal(replay.players[0].vp, 3);
    const replaySnapshot = JSON.stringify(replay);
    rules.processAbilityEvent(replay, event);
    assert.equal(JSON.stringify(replay), replaySnapshot);
    const malformed = setup();
    malformed.abilityRuntime.pack.cards[definitionId].abilities[1].effects[1].amount = 0;
    const before = JSON.stringify(malformed);
    assert.throws(() => rules.processAbilityEvent(malformed, event), /Unsupported deployment resource reward/);
    assert.equal(JSON.stringify(malformed), before);
    emit({ kind: 'positive_controls', owner, status: 'PASS',
      checks: ['formula 14/8/2/0', 'location/player/movement negatives', 'valid hook reward', 'replay', 'malformed rollback'] });

    // Inject only review fixture state; call the unchanged production dispatch method.
    const session = createMatchSession({ humanPlayerIds: ['p1', 'p2'] });
    const deployed = setup();
    deployed.players.forEach((player) => { delete player.locationId; });
    deployed.round.activePhase = 'advance';
    deployed.round.prioritySeat = 1;
    session.state = deployed;
    session.rawCards.set(definitionId, loaded.cards[definitionId]);
    const result = session.dispatchPlayerAction('p1', { type: 'deploy_player', locationId: 'magic_workshop' });
    assert.equal(result.ok, true);
    const actual = { mana: session.state.players[0].mana, vp: session.state.players[0].vp,
      processedEvents: session.state.abilityRuntime.processedEvents };
    gate('P1_WORKSHOP_TRIGGER_NOT_PRODUCED', owner, actual, { mana: 7, vp: 3 },
      actual.mana === 7 && actual.vp === 3);

    // Direct production cleanup invocation is a lifecycle unit probe, not full-match acceptance.
    session.state = setup();
    session.discardRoundAttackAreaCards();
    const cleaned = { zone: session.state.cards[0].zone,
      active: session.state.abilityRuntime.cardState['review-source'].active };
    gate('P1_RESIDUAL_NOT_RETAINED', owner, cleaned, { zone: 'attack_area', active: true },
      cleaned.zone === 'attack_area' && cleaned.active);

    const inactive = [];
    for (const mode of ['unplayed', 'closed', 'removed']) {
      const state = setup(mode);
      rules.processAbilityEvent(state, event);
      inactive.push({ mode, mana: state.players[0].mana, vp: state.players[0].vp });
    }
    gate('P2_SOURCE_ACTIVATION_NOT_REQUIRED', owner, inactive, 'Every inactive source remains mana=4, vp=1',
      inactive.every((entry) => entry.mana === 4 && entry.vp === 1));
  }
  emit({ kind: 'verdict', pr: 361, verdict: failedGates ? 'FAIL' : 'PASS', failedGates,
    baseEvidence: 'Identical relevant runtime files; new consumers are absent at base, so no base consumer execution is claimed',
    mainEvidence: 'Static anchors and identical consumer authoring only; main runtime not executed',
    runtimeAcceptanceCredit: false, mainCredit: false });
  process.exitCode = failedGates ? 1 : 0;
}

run().catch((error) => {
  emit({ kind: 'probe_error', message: error.message, stack: error.stack });
  process.exitCode = 2;
});
