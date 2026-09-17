import { describe, expect, it } from 'vitest';

import { createMatchSession } from '../../src/match-session';
import { isResourceNumericDirectActionSemantic } from '../../src/ability/interpreter';
import type { AuthoringAbility } from '../../src/ability/types';

function commandSpells(player: object): number {
  return (player as { commandSpells?: number }).commandSpells ?? 3;
}

function preparePlayerForAction(session: ReturnType<typeof createMatchSession>, playerId: string): void {
  const player = session.state.players.find((candidate) => candidate.id === playerId)!;
  session.state.round.activePhase = 'action';
  session.state.round.prioritySeat = player.seat;
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;
}

describe('RESOURCE_NUMERIC_CORE_DIRECT_ACTION', () => {
  it('routes command spell gain mana by executable semantic form and emits typed resource evidence', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.gatou')!;
    preparePlayerForAction(session, pairing.playerId);

    const source = session.state.cards.find((card) =>
      card.controllerPlayerId === pairing.playerId &&
      session.rawCards.get(card.definitionId)?.cardType === 'command_spell')!;
    const player = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
    player.mana = 8;
    (player as { commandSpells: number }).commandSpells = 3;

    const result = session.dispatchPlayerAction(pairing.playerId, {
      type: 'activate_ability',
      cardInstanceId: source.instanceId,
      abilityId: 'command-spell.gain-mana',
    });

    expect(result.ok).toBe(true);
    const afterPlayer = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
    expect(afterPlayer.mana).toBe(12);
    expect(commandSpells(afterPlayer)).toBe(2);
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'mana_adjusted',
      sourceAbilityId: 'command-spell.gain-mana',
      controllerId: pairing.playerId,
      resource: 'mana',
      delta: 4,
      before: 8,
      after: 12,
      resultId: expect.stringContaining('mana_adjusted'),
    }));
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'command_seals_adjusted',
      sourceAbilityId: 'command-spell.gain-mana',
      resource: 'command_seals',
      delta: -1,
      before: 3,
      after: 2,
    }));
  });

  it('fails closed through MatchSession dispatch when migrated resource definitions are corrupted', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.gatou')!;
    preparePlayerForAction(session, pairing.playerId);

    const source = session.state.cards.find((card) =>
      card.controllerPlayerId === pairing.playerId &&
      session.rawCards.get(card.definitionId)?.cardType === 'command_spell')!;
    const player = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
    player.mana = 8;
    (player as { commandSpells: number }).commandSpells = 3;
    const eventCount = session.state.abilityRuntime!.events.length;
    const ability = session.state.abilityRuntime!.pack.cards[source.definitionId]!.abilities.find((candidate) =>
      candidate.id === 'command-spell.gain-mana')!;
    ability.effects[0] = { type: 'adjust_mana', amount: 'four' } as never;

    const result = session.dispatchPlayerAction(pairing.playerId, {
      type: 'activate_ability',
      cardInstanceId: source.instanceId,
      abilityId: 'command-spell.gain-mana',
    });

    expect(result.ok).toBe(false);
    expect(result.rejection).toEqual(expect.objectContaining({ code: 'resolution_failed' }));
    expect(player.mana).toBe(8);
    expect(commandSpells(player)).toBe(3);
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
  });

  it('routes Tomoe direct VP action from real compiled content without legacy fallback', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const pairing = session.pairings.find((candidate) => candidate.servant.id === 'servant.tomoe')!;
    preparePlayerForAction(session, pairing.playerId);
    const player = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
    const firstSeatPlayer = session.state.players.find((candidate) => candidate.seat === 1)!;
    firstSeatPlayer.seat = player.seat;
    player.seat = 1;
    session.state.round.prioritySeat = 1;

    const source = session.state.cards.find((card) =>
      card.controllerPlayerId === pairing.playerId &&
      card.definitionId === 'servant.tomoe.skill.sc-tomoe-1')!;
    source.zone = 'attack_area';
    source.visibility = { scope: 'public' };
    session.state.abilityRuntime!.cardState[source.instanceId] = {
      active: true,
      faceDown: false,
      playedRound: session.state.round.roundNumber,
    };
    player.vp = 1;

    const result = session.dispatchPlayerAction(pairing.playerId, {
      type: 'activate_ability',
      cardInstanceId: source.instanceId,
      abilityId: 'sc-tomoe-1.independent-action',
    });

    expect(result.ok).toBe(true);
    const afterPlayer = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
    expect(afterPlayer.vp).toBe(4);
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'victory_points_adjusted',
      sourceAbilityId: 'sc-tomoe-1.independent-action',
      controllerId: pairing.playerId,
      resource: 'victory_points',
      delta: 3,
      before: 1,
      after: 4,
    }));
  });

  it('classifies direct resource runtime by semantic shape, not ability id', () => {
    const direct: AuthoringAbility = {
      id: 'renamed-resource-action',
      kind: 'phase_action',
      printedClause: '',
      activation: { phase: 'action', opens: 'controller_action_window' },
      conditions: [],
      targets: [],
      effects: [{ type: 'adjust_mana', amount: 1 }],
      cost: [],
      ruleModifiers: [],
      creates: [],
      lifecycle: {},
      responseWindow: {},
      limit: {},
      visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    };
    const mixed = structuredClone(direct);
    mixed.effects = [{ type: 'adjust_mana', amount: 1 }, { type: 'move_player', to: 'destination' }];
    const unknown = structuredClone(direct);
    unknown.effects = [{ type: 'adjust_unknown_resource', amount: 1 }];

    expect(isResourceNumericDirectActionSemantic(direct)).toBe(true);
    expect(isResourceNumericDirectActionSemantic(mixed)).toBe(false);
    expect(isResourceNumericDirectActionSemantic(unknown)).toBe(false);
  });
});
