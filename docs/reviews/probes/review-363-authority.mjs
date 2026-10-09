import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(head, '0de67e5b5c4f403f04fa54868c6db09b980c90f8');
const rules = await import(pathToFileURL(resolve('packages/rules/src/index.ts')).href);
const { createSeededGameState } = await import(pathToFileURL(resolve('packages/rules/src/tools/seeded-state.ts')).href);
const results = [];
for (const owner of ['master.iliya', 'master.taiga']) {
  for (const variant of ['valid', 'client-authority', 'conflicting-host-ops']) {
    const archive = JSON.parse(readFileSync(`data/authoring/masters/${owner}.json`, 'utf8'));
    const card = archive.cards[0];
    if (variant === 'client-authority') card.abilities[0].execution.authority = 'client';
    if (variant === 'conflicting-host-ops') {
      card.abilities[0].execution.hostOps = [];
      card.abilities[0].execution.allowedOperations = ['adjust-mana'];
    }
    const pack = rules.loadAuthoringJson(archive);
    const semanticAccepted = rules.isGameStartFixedControllerManaSetSemantic(pack.cards[card.id].abilities[0]);
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [{ instanceId: 'fixture', definitionId: card.id, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
    state.players[0].masterCardId = owner;
    state.players[0].mana = 4;
    rules.initializeAbilityRuntime(state, pack, { seed: 363 });
    rules.processAbilityEvent(state, { id: `${owner}:${variant}`, type: 'game_start' });
    const executed = state.players[0].mana === card.abilities[0].effects[0].amount;
    const pass = variant === 'valid' ? pack.report.length === 0 && semanticAccepted && executed
      : pack.report.length > 0 && !semanticAccepted && !executed;
    results.push({ owner, variant, loaderIssues: pack.report.length, semanticAccepted, executed,
      mana: state.players[0].mana, pass });
  }
}
console.log(JSON.stringify({ head, results }, null, 2));
process.exitCode = results.some((result) => !result.pass) ? 1 : 0;
