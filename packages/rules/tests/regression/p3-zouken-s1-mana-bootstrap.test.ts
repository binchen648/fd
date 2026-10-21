import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ACTIVE_ARCHIVE_PATH = 'data/authoring/masters/master.zouken.json';
const S1_ID = 'master.zouken.skill.s1';
const S1_INSTANCE_ID = 'p1-master.zouken.skill.s1';

function readArchive(): any {
  return JSON.parse(readFileSync(ACTIVE_ARCHIVE_PATH, 'utf8'));
}

function addS1(state: GameState): void {
  state.players[0]!.masterCardId = 'master.zouken';
  state.cards.push({
    instanceId: S1_INSTANCE_ID,
    definitionId: S1_ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
}

function directS1State(): { state: GameState; ability: ReturnType<typeof rules.loadAuthoringJson>['cards'][string]['abilities'][number] } {
  const pack = rules.loadAuthoringJson(readArchive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.mana = 4;
  addS1(state);
  rules.initializeAbilityRuntime(state, pack, { seed: 20261022 });
  return { state, ability: pack.cards[S1_ID]!.abilities[0]! };
}

describe('P3 Zouken s1 game-start mana bootstrap', () => {
  it('sets controller mana to 10, installs cap 16, and caps later gains', () => {
    const { state, ability } = directS1State();
    expect(rules.isZoukenManaBootstrapSemantic(ability)).toBe(true);

    rules.processAbilityEvent(state, { id: 'zouken-s1-game-start', type: 'game_start' });
    expect(state.players[0]!.mana).toBe(10);
    expect(state.abilityRuntime!.manaCaps.p1).toBe(16);

    expect(rules.grantMana(state, 'p1', 20, { source: 'generic' })).toMatchObject({
      requestedAmount: 20,
      actualAmount: 6,
      before: 10,
      after: 16,
      overflowAmount: 14,
    });
    expect(state.players[0]!.mana).toBe(16);
  });

  it('keeps cap state across trusted restore and duplicate game-start replay', () => {
    const { state } = directS1State();
    rules.processAbilityEvent(state, { id: 'zouken-s1-game-start', type: 'game_start' });
    const restored = JSON.parse(JSON.stringify(state)) as GameState;
    expect(restored.abilityRuntime!.manaCaps.p1).toBe(16);
    const beforeMana = restored.players[0]!.mana;
    rules.processAbilityEvent(restored, { id: 'zouken-s1-game-start', type: 'game_start' });
    expect(restored.abilityRuntime!.manaCaps.p1).toBe(16);
    expect(restored.players[0]!.mana).toBe(beforeMana);
    expect(restored.abilityRuntime!.processedEvents.filter((id) => id === 'zouken-s1-game-start')).toHaveLength(1);
  });

  it('rejects malformed cap fields in the loader and malformed parent shapes semantically', () => {
    const malformedCap = readArchive();
    malformedCap.cards[0].abilities[0].effects[1].amount = 15;
    const loaderRejected = rules.loadAuthoringJson(malformedCap);
    expect(loaderRejected.report).toContainEqual(expect.objectContaining({
      abilityId: 'zouken.dead-in-great-cavern',
      status: 'unsupported',
    }));
    expect(loaderRejected.cards[S1_ID]!.abilities[0]!.execution.mode).toBe('unsupported');

    const malformedParent = rules.loadAuthoringJson(readArchive());
    const ability = malformedParent.cards[S1_ID]!.abilities[0]!;
    ability.effects = [ability.effects[1]!];
    expect(rules.isZoukenManaBootstrapCandidate(ability)).toBe(true);
    expect(rules.isZoukenManaBootstrapSemantic(ability)).toBe(false);
  });
});
