import { describe, expect, it } from 'vitest';

import { createMatchSession } from '../../src/match-session';
import { isCardZoneCoreDirectActionSemantic } from '../../src/ability/interpreter';
import type { AuthoringAbility } from '../../src/ability/types';

function preparePlayerForAdvance(session: ReturnType<typeof createMatchSession>, playerId: string): void {
  const player = session.state.players.find((candidate) => candidate.id === playerId)!;
  session.state.round.activePhase = 'advance';
  session.state.round.prioritySeat = player.seat;
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;
}

function sourceCard(session: ReturnType<typeof createMatchSession>, playerId: string, definitionId: string): string {
  return session.state.cards.find((card) =>
    card.controllerPlayerId === playerId && card.definitionId === definitionId)!.instanceId;
}

function putTwoControllerCardsInHand(session: ReturnType<typeof createMatchSession>, playerId: string, excluding: string): string[] {
  const candidates = session.state.cards.filter((card) => card.controllerPlayerId === playerId && card.instanceId !== excluding);
  for (const card of candidates) {
    card.zone = 'deck';
    card.visibility = { scope: 'owner_only', ownerPlayerId: playerId };
  }
  const cards = candidates.slice(0, 2);
  for (const card of cards) {
    card.zone = 'hand';
    card.visibility = { scope: 'owner_only', ownerPlayerId: playerId };
  }
  return cards.map((card) => card.instanceId);
}

describe('CARD_ZONE_CORE_DIRECT_ACTION', () => {
  it('routes Conversion Magic by executable semantic form and binds actual moved count', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.irisviel')!;
    preparePlayerForAdvance(session, pairing.playerId);
    const source = sourceCard(session, pairing.playerId, 'master.irisviel.skill.conversion-magic');
    const moved = putTwoControllerCardsInHand(session, pairing.playerId, source);
    session.state.players.find((candidate) => candidate.id === pairing.playerId)!.mana = 4;

    const result = session.dispatchPlayerAction(pairing.playerId, {
      type: 'activate_ability',
      cardInstanceId: source,
      abilityId: 'conversion-magic.preparation',
    });

    expect(result.ok).toBe(true);
    const player = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
    expect(player.mana).toBe(6);
    expect(moved.every((id) => session.state.cards.find((card) => card.instanceId === id)?.zone === 'discard')).toBe(true);
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'cards_moved',
      sourceCardId: source,
      abilityId: 'conversion-magic.preparation',
    }));
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'mana_adjusted',
      sourceAbilityId: 'conversion-magic.preparation',
      delta: 2,
      before: 4,
      after: 6,
    }));
  });

  it('fails closed without legacy fallback when a migrated Conversion Magic graph is corrupted', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.irisviel')!;
    preparePlayerForAdvance(session, pairing.playerId);
    const source = sourceCard(session, pairing.playerId, 'master.irisviel.skill.conversion-magic');
    const moved = putTwoControllerCardsInHand(session, pairing.playerId, source);
    session.state.players.find((candidate) => candidate.id === pairing.playerId)!.mana = 4;
    const ability = session.state.abilityRuntime!.pack.cards['master.irisviel.skill.conversion-magic']!.abilities
      .find((candidate) => candidate.id === 'conversion-magic.preparation')!;
    ability.effects[1]!.player = 'opponent';
    const eventCount = session.state.abilityRuntime!.events.length;

    const result = session.dispatchPlayerAction(pairing.playerId, {
      type: 'activate_ability',
      cardInstanceId: source,
      abilityId: 'conversion-magic.preparation',
    });

    expect(result.ok).toBe(false);
    expect(result.rejection).toEqual(expect.objectContaining({ code: 'resolution_failed' }));
    expect(session.state.players.find((candidate) => candidate.id === pairing.playerId)!.mana).toBe(4);
    expect(moved.every((id) => session.state.cards.find((card) => card.instanceId === id)?.zone === 'hand')).toBe(true);
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
  });

  it('fails closed when corrupted Conversion Magic no longer matches the Card/Zone semantic classifier', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.irisviel')!;
    preparePlayerForAdvance(session, pairing.playerId);
    const source = sourceCard(session, pairing.playerId, 'master.irisviel.skill.conversion-magic');
    const moved = putTwoControllerCardsInHand(session, pairing.playerId, source);
    session.state.players.find((candidate) => candidate.id === pairing.playerId)!.mana = 4;
    const ability = session.state.abilityRuntime!.pack.cards['master.irisviel.skill.conversion-magic']!.abilities
      .find((candidate) => candidate.id === 'conversion-magic.preparation')!;
    ability.effects[0]!.to = { zone: 'attack_area' };
    const eventCount = session.state.abilityRuntime!.events.length;

    const result = session.dispatchPlayerAction(pairing.playerId, {
      type: 'activate_ability',
      cardInstanceId: source,
      abilityId: 'conversion-magic.preparation',
    });

    expect(result.ok).toBe(false);
    expect(result.rejection).toEqual(expect.objectContaining({ code: 'resolution_failed' }));
    expect(session.state.players.find((candidate) => candidate.id === pairing.playerId)!.mana).toBe(4);
    expect(moved.every((id) => session.state.cards.find((card) => card.instanceId === id)?.zone === 'hand')).toBe(true);
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
  });

  it('classifies only the exact Conversion Magic Card/Zone shape without ability ids', () => {
    const conversion: AuthoringAbility = {
      id: 'renamed-conversion',
      kind: 'phase_action',
      printedClause: '',
      activation: { phase: 'advance', opens: 'controller_action_window' },
      conditions: [],
      targets: [],
      effects: [
        { type: 'move_all_remaining', from: 'hand', to: { zone: 'discard' }, resultVar: 'discarded' },
        { type: 'adjust_mana', amount: { var: 'discarded' } },
      ],
      cost: [],
      ruleModifiers: [],
      creates: [],
      lifecycle: {},
      responseWindow: {},
      limit: {},
      visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    };
    const timeAlter: AuthoringAbility = {
      ...structuredClone(conversion),
      id: 'renamed-time-alter',
      activation: { phase: 'action', opens: 'controller_action_window' },
      targets: [{
        id: 'card_to_play',
        type: 'card_instance',
        scope: { zone: 'hand', owner: 'controller' },
        count: { min: 1, max: 1 },
        constraints: [{ type: 'is_attack' }],
      }],
      effects: [
        { type: 'play_selected_cards', target: 'card_to_play', face: 'face_down' },
        { type: 'draw_cards', count: 1 },
      ],
    };
    const hiddenPlay = structuredClone(timeAlter);
    hiddenPlay.targets[0]!.scope = { zone: 'looked_cards', owner: 'controller' };
    const standaloneDraw = structuredClone(timeAlter);
    standaloneDraw.targets = [];
    standaloneDraw.effects = [{ type: 'draw_cards', count: 1 }];

    expect(isCardZoneCoreDirectActionSemantic(conversion)).toBe(true);
    expect(isCardZoneCoreDirectActionSemantic(timeAlter)).toBe(false);
    expect(isCardZoneCoreDirectActionSemantic(hiddenPlay)).toBe(false);
    expect(isCardZoneCoreDirectActionSemantic(standaloneDraw)).toBe(false);
  });
});
