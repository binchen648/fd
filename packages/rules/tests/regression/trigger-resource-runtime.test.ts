import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { stepGameLoop } from '../../src/core/game-loop';
import { createSeededGameState } from '../../src/tools/seeded-state';

const shinjiRaw = JSON.parse(readFileSync('data/authoring/masters/master.shinji.json', 'utf8'));
const ereshRaw = JSON.parse(readFileSync('data/authoring/servants/servant.ereshkigal.json', 'utf8'));

function setup(raw = shinjiRaw): { state: GameState; sourceId: string } {
  const pack = rules.loadAuthoringJson(raw);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.masterCardId = shinjiRaw.id;
  state.players[0]!.mana = 4;
  state.players[0]!.locationId = 'magic_workshop';
  state.players[1]!.locationId = 'recon';
  rules.initializeAbilityRuntime(state, pack, { seed: 11 });
  const sourceId = 'trigger-resource-source';
  state.cards.push({
    instanceId: sourceId,
    definitionId: raw.cards[0]?.id === 'master.shinji.skill.useless-person'
      ? 'master.shinji.skill.drain-command'
      : raw.cards.find((card: { id: string }) => card.id === 'master.shinji.skill.drain-command')?.id ?? raw.cards[0].id,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  return { state, sourceId };
}

function shinjiAbility(): AuthoringAbility {
  const pack = rules.loadAuthoringJson(shinjiRaw);
  return structuredClone(pack.cards['master.shinji.skill.drain-command']!.abilities[0]!);
}

function processEnter(state: GameState, id: string, locationId?: string): void {
  rules.processAbilityEvent(state, {
    id,
    type: 'after_controller_enters_location',
    playerId: 'p1',
    ...(locationId ? { locationId } : {}),
  });
}

describe('P3-TO-11 trigger resource runtime', () => {
  it('classifies by semantic shape rather than card or ability identity', () => {
    const renamed = shinjiAbility();
    renamed.id = 'renamed-location-resource-trigger';
    expect(rules.isResourceNumericTriggerSemantic(renamed)).toBe(true);

    const wrongLocationEvent = structuredClone(renamed);
    delete wrongLocationEvent.activation.eventLocationId;
    expect(rules.isResourceNumericTriggerSemantic(wrongLocationEvent)).toBe(false);

    const wrongTrigger = structuredClone(renamed);
    wrongTrigger.activation.trigger = 'after_controller_loses_battle';
    expect(rules.isResourceNumericTriggerSemantic(wrongTrigger)).toBe(false);

    const extraEffect = structuredClone(renamed);
    extraEffect.effects.push({ type: 'adjust_victory_points', amount: 1 });
    expect(rules.isResourceNumericTriggerSemantic(extraEffect)).toBe(false);
  });

  it('rejects event-location metadata on a trigger without location payload semantics', () => {
    const malformed = structuredClone(shinjiRaw);
    const rawAbility = malformed.cards
      .find((card: { id: string }) => card.id === 'master.shinji.skill.drain-command')
      .abilities[0];
    rawAbility.activation.trigger = 'after_controller_loses_battle';
    const loaded = rules.loadAuthoringJson(malformed);
    expect(loaded.report).toContainEqual(expect.objectContaining({
      abilityId: 'drain-command.enter-miyama',
      path: 'activation.eventLocationId',
      status: 'unsupported',
      reason: 'Event location requires a supported location-bearing trigger',
    }));
  });
  it('does not silently absorb the Ereshkigal deployment trigger without a source battlefield anchor', () => {
    const pack = rules.loadAuthoringJson(ereshRaw);
    const ability = pack.cards['servant.ereshkigal.skill.sc-ereshkigal-2']!.abilities
      .find((candidate) => candidate.id === 'sc-ereshkigal-2.gain-mana-on-deploy')!;
    expect(rules.isResourceNumericTriggerSemantic(ability)).toBe(false);
  });

  it('routes a trusted Miyama enter event through typed mana resolution and dedupes replay', () => {
    const { state, sourceId } = setup();
    const revisionBefore = state.abilityRuntime!.revision;
    processEnter(state, 'enter-miyama-1', 'miyama_town');

    expect(state.players[0]!.mana).toBe(5);
    expect(state.abilityRuntime!.revision).toBe(revisionBefore + 1);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'mana_adjusted',
      playerId: 'p1',
      sourceCardId: sourceId,
      abilityId: 'drain-command.enter-miyama',
      resource: 'mana',
      delta: 1,
      before: 4,
      after: 5,
    }));
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved',
      sourceCardId: sourceId,
      abilityId: 'drain-command.enter-miyama',
    }));

    const afterFirst = JSON.stringify(state);
    processEnter(state, 'enter-miyama-1', 'miyama_town');
    expect(JSON.stringify(state)).toBe(afterFirst);
  });

  it('requires the trusted event destination and ignores missing or wrong locations', () => {
    const missing = setup().state;
    processEnter(missing, 'enter-missing');
    expect(missing.players[0]!.mana).toBe(4);

    const wrong = setup().state;
    processEnter(wrong, 'enter-shinto', 'shinto');
    expect(wrong.players[0]!.mana).toBe(4);
    expect(wrong.abilityRuntime!.events.some((event) => event.type === 'mana_adjusted')).toBe(false);
  });

  it('uses typed resource cap and gain-block policy instead of legacy mutation', () => {
    const capped = setup().state;
    capped.players[0]!.mana = 12;
    processEnter(capped, 'enter-at-cap', 'miyama_town');
    expect(capped.players[0]!.mana).toBe(12);
    expect(capped.abilityRuntime!.events.some((event) => event.type === 'mana_adjusted')).toBe(false);
    expect(capped.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved',
      abilityId: 'drain-command.enter-miyama',
    }));

    const blocked = setup().state;
    blocked.abilityRuntime!.manaGainBlocked.push('p1');
    processEnter(blocked, 'enter-blocked', 'miyama_town');
    expect(blocked.players[0]!.mana).toBe(4);
    expect(blocked.abilityRuntime!.events.some((event) => event.type === 'mana_adjusted')).toBe(false);
  });

  it('fails a recognized malformed trigger-resource candidate atomically without legacy fallback', () => {
    const malformed = structuredClone(shinjiRaw);
    const rawAbility = malformed.cards
      .find((card: { id: string }) => card.id === 'master.shinji.skill.drain-command')
      .abilities[0];
    rawAbility.effects.push({ type: 'adjust_victory_points', amount: 1 });
    const pack = rules.loadAuthoringJson(malformed);
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [{
      instanceId: 'malformed-trigger-source',
      definitionId: 'master.shinji.skill.drain-command',
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    }];
    state.players[0]!.mana = 4;
    rules.initializeAbilityRuntime(state, pack, { seed: 12 });
    const before = JSON.stringify(state);

    expect(() => processEnter(state, 'malformed-enter', 'miyama_town'))
      .toThrow('Unsupported trigger resource semantic shape');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('produces the trusted location event from a real normal movement action', () => {
    const { state } = setup();
    state.players[0]!.mana = 5;
    const result = stepGameLoop(state, {
      action: {
        type: 'move',
        playerId: 'p1',
        to: 'miyama_town',
        movementKind: 'normal',
      },
    });

    expect(result.nextState.players[0]).toMatchObject({ locationId: 'miyama_town', mana: 4 });
    expect(result.nextState.log).toContainEqual(expect.objectContaining({
      type: 'movement',
      payload: expect.objectContaining({ manaSpent: 2 }),
    }));
    expect(result.nextState.abilityRuntime!.processedEvents.some((eventId) => eventId.startsWith('enter-location-'))).toBe(true);
    expect(result.nextState.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'mana_adjusted',
      abilityId: 'drain-command.enter-miyama',
      delta: 1,
      before: 3,
      after: 4,
    }));
  });

  it('does not trigger Shinji when a real movement ends at a different location', () => {
    const { state } = setup();
    state.players[0]!.locationId = 'miyama_town';
    state.players[0]!.mana = 5;
    const result = stepGameLoop(state, {
      action: {
        type: 'move',
        playerId: 'p1',
        to: 'shinto',
        movementKind: 'normal',
      },
    });

    expect(result.nextState.players[0]).toMatchObject({ locationId: 'shinto', mana: 3 });
    expect(result.nextState.abilityRuntime!.events.some((event) =>
      event.type === 'mana_adjusted' && event.abilityId === 'drain-command.enter-miyama')).toBe(false);
  });
});


