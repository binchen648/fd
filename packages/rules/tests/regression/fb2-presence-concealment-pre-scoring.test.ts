import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const definitionId = 'fixture.presence-concealment';
const abilityId = 'renamed.presence-concealment';
const sourceId = 'fixture-presence-source';

function exactAbility() {
  return {
    id: abilityId,
    kind: 'optional_trigger',
    printedClause: 'synthetic strict-second assassination',
    activation: { phase: 'combat', trigger: 'after_battle_power_calculated', requiresSourceState: 'active' },
    conditions: [{ type: 'controller_strict_second_battle_power' }],
    targets: [],
    effects: [{ type: 'defeat_highest_power_opponents' }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {},
    responseWindow: { opens: 'post_power_response', order: 'turn_order', passBehavior: 'decline_this_window' },
    limit: { type: 'per_round', uses: 1, scope: 'this_card' },
    visibility: {}, execution: { mode: 'automatic' },
  };
}

function rawArchive(abilityPatch: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    id: 'fixture.presence-owner',
    name: 'Presence Fixture',
    class: 'Assassin',
    cards: [{
      id: definitionId,
      name: 'Presence Concealment Fixture',
      cardType: 'servant_skill',
      cardFace: { typeLabel: '迅捷', attributes: ['迅捷'], cost: 3, basePower: 4 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      abilities: [{ ...exactAbility(), ...abilityPatch }],
    }],
  };
}

function compiledAbility(patch: Record<string, unknown> = {}): AuthoringAbility {
  const pack = rules.loadAuthoringJson(rawArchive(patch));
  expect(pack.report).toEqual([]);
  return pack.cards[definitionId]!.abilities[0]!;
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(rawArchive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'battle';
  state.round.prioritySeat = 1;
  for (const player of state.players.slice(0, 3)) player.locationId = 'shinto';
  rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
  state.cards.push({
    instanceId: sourceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'attack_area',
    visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState[sourceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function battle(state: GameState, powers: [number, number, number], battlefieldId: 'shinto' | 'miyama_town' = 'shinto') {
  return rules.resolveBattlefield(state, {
    battlefieldId,
    participants: [
      { playerId: 'p1', totalPower: powers[0] },
      { playerId: 'p2', totalPower: powers[1] },
      { playerId: 'p3', totalPower: powers[2] },
    ],
  }).nextState;
}

function responseAction(state: GameState) {
  return rules.getLegalActions(state, 'p1').find((action) =>
    action.type === 'resolve_response' && action.cardInstanceId === sourceId && action.abilityId === abilityId);
}

function declineAction(state: GameState) {
  return rules.getLegalActions(state, 'p1').find((action) => action.type === 'decline_this_window');
}

describe('P3-FB2-12 Presence Concealment pre-scoring response', () => {
  it('classifies only the exact identity-free response shape', () => {
    const accepted = compiledAbility();
    accepted.id = 'completely-renamed-presence';
    expect(rules.isPresenceConcealmentAssassinationSemantic(accepted)).toBe(true);

    const mutations: Array<(ability: AuthoringAbility) => void> = [
      (a) => { a.kind = 'forced_trigger'; },
      (a) => { a.activation.phase = 'action'; },
      (a) => { a.activation.trigger = 'after_battle_result_determined'; },
      (a) => { a.activation.requiresSourceState = 'inactive'; },
      (a) => { a.conditions[0]!.type = 'controller_won_battle'; },
      (a) => { a.targets.push({ type: 'choose_player' }); },
      (a) => { a.effects[0]!.type = 'adjust_victory_points'; },
      (a) => { a.responseWindow.opens = 'after_battle_result_determined'; },
      (a) => { a.responseWindow.order = 'simultaneous'; },
      (a) => { a.limit.type = 'per_game'; },
      (a) => { a.limit.uses = 2; },
      (a) => { a.cost.push({ type: 'pay_mana', amount: 1 }); },
    ];
    for (const mutate of mutations) {
      const candidate = structuredClone(accepted);
      mutate(candidate);
      expect(rules.isPresenceConcealmentAssassinationSemantic(candidate)).toBe(false);
    }
  });

  it('pauses before BattleResult/scoring and decline preserves the original tied highest winners without consuming use', () => {
    const state = setup();
    const pending = battle(state, [5, 10, 10]);
    expect(pending.battleResults).toHaveLength(0);
    expect(pending.abilityRuntime!.responseWindows).toHaveLength(1);
    expect(responseAction(pending)).toBeDefined();
    const decline = declineAction(pending)!;
    expect(rules.dispatchAbilityCommand(pending, 'p1', decline).ok).toBe(true);

    const settled = battle(pending, [5, 10, 10]);
    expect(settled.battleResults).toHaveLength(1);
    expect(settled.battleResults[0]!.winnerPlayerIds).toEqual(['p2', 'p3']);
    expect(settled.battleResults[0]!.presenceConcealmentDefeatedPlayerIds).toBeUndefined();

    // Declining does not consume the once-per-round use: a new battle identity can offer it again.
    for (const player of settled.players.slice(0, 3)) player.locationId = 'miyama_town';
    const secondPending = battle(settled, [5, 10, 10], 'miyama_town');
    expect(responseAction(secondPending)).toBeDefined();
  });

  it('resolves [5,10,10] from the frozen snapshot and promotes the strict-second controller through the same result builder', () => {
    const state = setup();
    const pending = battle(state, [5, 10, 10]);
    const action = responseAction(pending)!;
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(pending, 'p1', action).ok).toBe(true);
    expect(pending.abilityRuntime!.pendingPresenceConcealmentDefeats).toHaveLength(1);
    expect(pending.battleResults).toHaveLength(0);

    const settled = battle(pending, [5, 10, 10]);
    const result = settled.battleResults[0]!;
    expect(result.winnerPlayerIds).toEqual(['p1']);
    expect(result.excludedPlayerIds).toEqual(expect.arrayContaining(['p2', 'p3']));
    expect(result.presenceConcealmentDefeatedPlayerIds).toEqual(['p2', 'p3']);
    expect(result.margin).toBe(5);
    expect(settled.abilityRuntime!.pendingPresenceConcealmentDefeats).toEqual([]);
    expect(settled.log.filter((entry) => entry.type === 'presence_concealment_defeat_applied')).toHaveLength(2);
  });

  it('respects Basic Luck defeat-ignore per highest target before winner recomputation', () => {
    const state = setup();
    state.cards.push({
      instanceId: 'p2-luck', definitionId: 'basic.luck', ownerPlayerId: 'p2', controllerPlayerId: 'p2',
      zone: 'attack_area', visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState['p2-luck'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };

    const pending = battle(state, [5, 10, 10]);
    expect(rules.dispatchAbilityCommand(pending, 'p1', responseAction(pending)!).ok).toBe(true);
    const settled = battle(pending, [5, 10, 10]);
    const result = settled.battleResults[0]!;
    expect(result.winnerPlayerIds).toEqual(['p2']);
    expect(result.presenceConcealmentDefeatedPlayerIds).toEqual(['p3']);
    expect(result.excludedPlayerIds).not.toContain('p2');
    expect(settled.log).toContainEqual(expect.objectContaining({ type: 'presence_concealment_defeat_ignored' }));
  });

  it('does not open for two participants, a non-second controller, or a controller tied for highest', () => {
    const two = setup();
    const twoResult = rules.resolveBattlefield(two, {
      battlefieldId: 'shinto', participants: [{ playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 10 }],
    }).nextState;
    expect(twoResult.abilityRuntime!.responseWindows).toEqual([]);
    expect(twoResult.battleResults).toHaveLength(1);

    const intermediate = battle(setup(), [5, 10, 7]);
    expect(intermediate.abilityRuntime!.responseWindows).toEqual([]);
    expect(intermediate.battleResults[0]!.winnerPlayerIds).toEqual(['p2']);

    const topTie = battle(setup(), [10, 10, 5]);
    expect(topTie.abilityRuntime!.responseWindows).toEqual([]);
    expect(topTie.battleResults[0]!.winnerPlayerIds).toEqual(['p1', 'p2']);
  });

  it('allows equal strict-second peers and derives all highest opponents without target selection', () => {
    const state = setup();
    const pending = battle(state, [5, 10, 5]);
    const action = responseAction(pending)!;
    expect(action).toBeDefined();
    expect('selectedIds' in action).toBe(false);
    expect(rules.dispatchAbilityCommand(pending, 'p1', action).ok).toBe(true);
    expect(pending.abilityRuntime!.pendingPresenceConcealmentDefeats![0]!.targetPlayerIds).toEqual(['p2']);
    const settled = battle(pending, [5, 10, 5]);
    expect(settled.battleResults[0]!.winnerPlayerIds).toEqual(['p1', 'p3']);
  });

  it('feeds the recomputed winner into the existing scoring resolver instead of a second scoring path', () => {
    const state = setup();
    const pending = battle(state, [5, 10, 10]);
    expect(rules.dispatchAbilityCommand(pending, 'p1', responseAction(pending)!).ok).toBe(true);
    const settled = battle(pending, [5, 10, 10]);
    const before = Object.fromEntries(settled.players.slice(0, 3).map((player) => [player.id, { vp: player.vp, military: player.militaryResult }]));
    const scored = rules.applyBattleScoring(settled).nextState;
    const result = settled.battleResults[0]!;
    expect(result.winnerPlayerIds).toEqual(['p1']);
    for (const playerId of ['p1', 'p2', 'p3'] as const) {
      const index = Number(playerId.slice(1)) - 1;
      const vpFromWinner = result.winnerPlayerIds.includes(playerId) ? result.vpReward : 0;
      const vpFromAdjustments = (result.vpAdjustments ?? [])
        .filter((adjustment) => adjustment.playerId === playerId)
        .reduce((sum, adjustment) => sum + adjustment.delta, 0);
      const militaryDelta = result.militaryAdjustments.find((adjustment) => adjustment.playerId === playerId)?.delta ?? 0;
      expect(scored.players[index]!.vp).toBe(before[playerId]!.vp + vpFromWinner + vpFromAdjustments);
      expect(scored.players[index]!.militaryResult).toBe(before[playerId]!.military + militaryDelta);
    }
  });

  it('queues multiple eligible responders in turn order and deduplicates the same highest target deterministically', () => {
    const state = setup();
    state.cards.push({
      instanceId: 'p3-presence', definitionId, ownerPlayerId: 'p3', controllerPlayerId: 'p3',
      zone: 'attack_area', visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState['p3-presence'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    const pending = battle(state, [5, 10, 5]);
    expect(pending.abilityRuntime!.responseWindows.map((window) => window.controllerId)).toEqual(['p1', 'p3']);

    const p1Action = responseAction(pending)!;
    expect(rules.dispatchAbilityCommand(pending, 'p1', p1Action).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(pending, 'p1', p1Action).ok).toBe(false);
    expect(pending.battleResults).toHaveLength(0);
    const p3Action = rules.getLegalActions(pending, 'p3').find((action) => action.type === 'resolve_response')!;
    expect(rules.dispatchAbilityCommand(pending, 'p3', p3Action).ok).toBe(true);
    expect(pending.abilityRuntime!.pendingPresenceConcealmentDefeats).toHaveLength(2);

    const settled = battle(pending, [5, 10, 5]);
    expect(settled.battleResults[0]!.presenceConcealmentDefeatedPlayerIds).toEqual(['p2']);
    expect(settled.battleResults[0]!.winnerPlayerIds).toEqual(['p1', 'p3']);
    expect(settled.log.filter((entry) => entry.type === 'presence_concealment_defeat_applied')).toHaveLength(1);
  });

  it('fails closed if the authoritative frozen Power snapshot changes while the response is pending', () => {
    const state = setup();
    const pending = battle(state, [5, 10, 10]);
    expect(rules.dispatchAbilityCommand(pending, 'p1', responseAction(pending)!).ok).toBe(true);
    expect(() => battle(pending, [5, 11, 10])).toThrow('frozen battle Power snapshot changed');
    expect(pending.battleResults).toHaveLength(0);
  });

  it('consumes battle-local defeat markers and cannot leak them into a later battlefield', () => {
    const state = setup();
    const pending = battle(state, [5, 10, 10]);
    expect(rules.dispatchAbilityCommand(pending, 'p1', responseAction(pending)!).ok).toBe(true);
    const settled = battle(pending, [5, 10, 10]);
    expect(settled.abilityRuntime!.pendingPresenceConcealmentDefeats).toEqual([]);

    for (const player of settled.players.slice(0, 3)) player.locationId = 'miyama_town';
    // Once-per-round has now been consumed, so the second battlefield settles without a new Presence response.
    const later = battle(settled, [5, 10, 10], 'miyama_town');
    expect(later.abilityRuntime!.responseWindows).toEqual([]);
    expect(later.battleResults.at(-1)!.winnerPlayerIds).toEqual(['p2', 'p3']);
    expect(later.battleResults.at(-1)!.presenceConcealmentDefeatedPlayerIds).toBeUndefined();
  });
});