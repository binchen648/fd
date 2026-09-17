import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const shinjiRaw = JSON.parse(readFileSync('data/authoring/masters/master.shinji.json', 'utf8'));
const ereshRaw = JSON.parse(readFileSync('data/authoring/servants/servant.ereshkigal.json', 'utf8'));
const sourceDefinitionId = 'master.shinji.skill.drain-command';
const rewardAbilityId = 'renamed-deployment-resource-reward';

function rewardRaw(effects: unknown[]) {
  const raw = structuredClone(shinjiRaw);
  const card = raw.cards.find((candidate: { id: string }) => candidate.id === sourceDefinitionId)!;
  card.abilities[0] = {
    id: rewardAbilityId,
    kind: 'forced_trigger',
    printedClause: '',
    activation: {
      trigger: 'after_player_deployed_to_battlefield',
      eventLocationId: 'magic_workshop',
    },
    effects,
    execution: { mode: 'automatic' },
  };
  return raw;
}

function compiledReward(effects: unknown[]): AuthoringAbility {
  const pack = rules.loadAuthoringJson(rewardRaw(effects));
  return structuredClone(pack.cards[sourceDefinitionId]!.abilities.find((ability) => ability.id === rewardAbilityId)!);
}

function setupReward(effects: unknown[]): { state: GameState; sourceId: string } {
  const raw = rewardRaw(effects);
  const pack = rules.loadAuthoringJson(raw);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.masterCardId = raw.id;
  state.players[0]!.mana = 4;
  state.players[0]!.vp = 1;
  state.players[0]!.locationId = 'magic_workshop';
  state.players[1]!.locationId = 'shinto';
  rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
  const sourceId = 'fb2-deployment-resource-source';
  state.cards.push({
    instanceId: sourceId,
    definitionId: sourceDefinitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  return { state, sourceId };
}

function deployEvent(state: GameState, id: string, playerId = 'p1', locationId = 'magic_workshop'): void {
  rules.processAbilityEvent(state, {
    id,
    type: 'after_player_deployed_to_battlefield',
    playerId,
    locationId,
  });
}

describe('P3-FB2-02 deployment resource reward', () => {
  it('classifies the narrow semantic by shape rather than identity and rejects sibling shapes', () => {
    const single = compiledReward([{ type: 'adjust_mana', amount: 1 }]);
    single.id = 'completely-renamed-ability';
    expect(rules.isDeploymentResourceRewardSemantic(single)).toBe(true);

    const pair = compiledReward([
      { type: 'adjust_mana', player: 'controller', amount: 1 },
      { type: 'adjust_victory_points', player: 'controller', amount: 2 },
    ]);
    expect(rules.isDeploymentResourceRewardSemantic(pair)).toBe(true);

    const noLocation = structuredClone(pair);
    delete noLocation.activation.eventLocationId;
    expect(rules.isDeploymentResourceRewardSemantic(noLocation)).toBe(false);

    const wrongTrigger = structuredClone(pair);
    wrongTrigger.activation.trigger = 'after_controller_enters_location';
    expect(rules.isDeploymentResourceRewardSemantic(wrongTrigger)).toBe(false);

    for (const amount of [0, -1, 1.5]) {
      const invalid = structuredClone(pair);
      invalid.effects[0]!.amount = amount;
      expect(rules.isDeploymentResourceRewardSemantic(invalid)).toBe(false);
    }

    const expression = structuredClone(pair);
    expression.effects[0]!.amount = { var: 'X' };
    expect(rules.isDeploymentResourceRewardSemantic(expression)).toBe(false);

    const third = structuredClone(pair);
    third.effects.push({ type: 'adjust_mana', amount: 1 });
    expect(rules.isDeploymentResourceRewardSemantic(third)).toBe(false);

    const commandSeal = structuredClone(pair);
    commandSeal.effects[1] = { type: 'adjust_command_seals', amount: 1 };
    expect(rules.isDeploymentResourceRewardSemantic(commandSeal)).toBe(false);

    const movement = structuredClone(pair);
    movement.effects[1] = { type: 'move_player', to: 'shinto' };
    expect(rules.isDeploymentResourceRewardSemantic(movement)).toBe(false);

    const target = structuredClone(pair);
    target.targets.push({ id: 'target', type: 'choose_player' });
    expect(rules.isDeploymentResourceRewardSemantic(target)).toBe(false);
  });

  it('settles one or two fixed controller rewards through typed resource evidence', () => {
    const single = setupReward([{ type: 'adjust_mana', amount: 1 }]);
    deployEvent(single.state, 'deploy-single');
    expect(single.state.players[0]!.mana).toBe(5);
    expect(single.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'mana_adjusted',
      playerId: 'p1',
      sourceCardId: single.sourceId,
      abilityId: rewardAbilityId,
      resource: 'mana',
      delta: 1,
      before: 4,
      after: 5,
    }));

    const pair = setupReward([
      { type: 'adjust_mana', player: 'controller', amount: 1 },
      { type: 'adjust_victory_points', player: 'controller', amount: 2 },
    ]);
    deployEvent(pair.state, 'deploy-pair');
    expect(pair.state.players[0]).toMatchObject({ mana: 5, vp: 3 });
    expect(pair.state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'mana_adjusted', abilityId: rewardAbilityId, resource: 'mana', delta: 1, before: 4, after: 5,
      }),
      expect.objectContaining({
        type: 'victory_points_adjusted', abilityId: rewardAbilityId, resource: 'victory_points', delta: 2, before: 1, after: 3,
      }),
    ]));
  });

  it('requires both trusted controller and location provenance', () => {
    const wrongLocation = setupReward([
      { type: 'adjust_mana', amount: 1 },
      { type: 'adjust_victory_points', amount: 2 },
    ]).state;
    deployEvent(wrongLocation, 'deploy-wrong-location', 'p1', 'shinto');
    expect(wrongLocation.players[0]).toMatchObject({ mana: 4, vp: 1 });
    expect(wrongLocation.abilityRuntime!.events.some((event) =>
      event.abilityId === rewardAbilityId && ['mana_adjusted', 'victory_points_adjusted'].includes(event.type))).toBe(false);

    const otherPlayer = setupReward([
      { type: 'adjust_mana', amount: 1 },
      { type: 'adjust_victory_points', amount: 2 },
    ]).state;
    deployEvent(otherPlayer, 'deploy-other-player', 'p2', 'magic_workshop');
    expect(otherPlayer.players[0]).toMatchObject({ mana: 4, vp: 1 });
    expect(otherPlayer.abilityRuntime!.events.some((event) =>
      event.abilityId === rewardAbilityId && ['mana_adjusted', 'victory_points_adjusted'].includes(event.type))).toBe(false);
  });

  it('does not treat ordinary movement into the same location as deployment', () => {
    const { state } = setupReward([{ type: 'adjust_mana', amount: 1 }]);
    rules.processAbilityEvent(state, {
      id: 'ordinary-entry',
      type: 'after_controller_enters_location',
      playerId: 'p1',
      locationId: 'magic_workshop',
    });
    expect(state.players[0]!.mana).toBe(4);
    expect(state.abilityRuntime!.events.some((event) => event.abilityId === rewardAbilityId && event.type === 'mana_adjusted')).toBe(false);
  });

  it('dedupes stable deployment event ids exactly once', () => {
    const { state } = setupReward([
      { type: 'adjust_mana', amount: 1 },
      { type: 'adjust_victory_points', amount: 2 },
    ]);
    deployEvent(state, 'deploy-replay');
    const afterFirst = JSON.stringify(state);
    deployEvent(state, 'deploy-replay');
    expect(JSON.stringify(state)).toBe(afterFirst);
  });

  it('fails malformed recognized deployment reward shapes atomically before legacy fallback', () => {
    const { state } = setupReward([
      { type: 'adjust_mana', amount: 1 },
      { type: 'adjust_victory_points', amount: 0 },
    ]);
    const before = JSON.stringify(state);
    expect(() => deployEvent(state, 'deploy-malformed')).toThrow('Unsupported deployment resource reward semantic shape');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('does not narrow Ereshkigal existing any-player deployment trigger', () => {
    const pack = rules.loadAuthoringJson(ereshRaw);
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.players[0]!.servantCardId = ereshRaw.id;
    state.players[0]!.mana = 4;
    rules.initializeAbilityRuntime(state, pack, { seed: 20260917 });
    const sourceId = 'eresh-protection-source';
    state.cards.push({
      instanceId: sourceId,
      definitionId: 'servant.ereshkigal.skill.sc-ereshkigal-2',
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'field',
      visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState[sourceId] = {
      active: true,
      faceDown: false,
      playedRound: state.round.roundNumber,
    };

    const ereshAbility = pack.cards['servant.ereshkigal.skill.sc-ereshkigal-2']!.abilities
      .find((ability) => ability.id === 'sc-ereshkigal-2.gain-mana-on-deploy')!;
    expect(rules.isDeploymentResourceRewardSemantic(ereshAbility)).toBe(false);

    rules.processAbilityEvent(state, {
      id: 'other-player-deploys',
      type: 'after_player_deployed_to_battlefield',
      playerId: 'p2',
      locationId: 'shinto',
    });
    expect(state.players[0]!.mana).toBe(5);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved',
      sourceCardId: sourceId,
      abilityId: 'sc-ereshkigal-2.gain-mana-on-deploy',
    }));
  });
});