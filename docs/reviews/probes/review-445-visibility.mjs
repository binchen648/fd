import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(head, '658849d1602bd4b705a924f6aa649e973d9d65ca');
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const results = [];
for (const visibility of [{}, 'invalid-visibility', [], false, 7]) {
  const raw = { id: 'review.close', kind: 'phase_action', printedClause: 'review fixture',
    activation: { phase: 'combat', opens: 'controller_combat_action_window' },
    conditions: [{ type: 'source_owned' }, { type: 'at_battlefield' }], targets: [],
    effects: [{ type: 'opponent_close_non_residual_to_one' }], cost: [], creates: [], ruleModifiers: [],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility, execution: { mode: 'automatic' } };
  const archive = { schemaVersion: 'fd-card-authoring-v1', id: 'review.fixture', name: 'review fixture',
    cards: [{ id: 'review.card', name: 'review card', cardType: 'servant_skill', cardFace: { cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [raw] }] };
  const rawAccepted = rules.isAcceptedOpponentCloseToOneAbility(raw, 'authoring');
  const pack = rules.loadAuthoringJson(archive);
  const compiledAccepted = rules.isAcceptedOpponentCloseToOneAbility(pack.cards['review.card'].abilities[0], 'compiled');
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'battle';
  state.round.prioritySeat = 1;
  state.players[0].locationId = 'miyama_town';
  state.players[1].locationId = 'miyama_town';
  state.cards = [{ instanceId: 'source', definitionId: 'review.card', ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  rules.initializeAbilityRuntime(state, pack, { seed: 445 });
  state.abilityRuntime.cardState.source = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  const activated = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: 'source', abilityId: raw.id }).ok;
  const valid = typeof visibility === 'object' && !Array.isArray(visibility);
  results.push({ visibility, rawAccepted, loaderIssues: pack.report.length, compiledAccepted, activated,
    pass: valid ? rawAccepted && compiledAccepted && activated : !rawAccepted && pack.report.length > 0 && !activated });
}
console.log(JSON.stringify({ head, results }, null, 2));
process.exitCode = results.some((result) => !result.pass) ? 1 : 0;
