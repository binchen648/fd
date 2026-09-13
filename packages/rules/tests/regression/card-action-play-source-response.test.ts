import { describe, expect, it } from 'vitest';

import { processAbilityEvent } from '../../src/ability/interpreter';
import { createMatchSession } from '../../src/match-session';
import { isPlaySourceCardWithCostResponse } from '../../src/ability/interpreter';
import type { AuthoringAbility } from '../../src/ability/types';

function prepareVolumenResponse(session: ReturnType<typeof createMatchSession>, options: { mana?: number; sourceZone?: string } = {}) {
  const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.kayneth')!;
  const player = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
  player.mana = options.mana ?? 5;
  session.state.round.activePhase = 'battle';
  session.state.round.prioritySeat = player.seat;
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;
  const volumen = session.state.cards.find((card) =>
    card.ownerPlayerId === pairing.playerId &&
    card.definitionId === 'master.kayneth.deck.volumen-hydrargyrum')!;
  volumen.zone = options.sourceZone ?? 'hand';
  volumen.controllerPlayerId = pairing.playerId;
  volumen.visibility = { scope: 'owner_only', ownerPlayerId: pairing.playerId };
  delete session.state.abilityRuntime!.cardState[volumen.instanceId];
  processAbilityEvent(session.state, { id: `volumen-window-${options.sourceZone ?? 'hand'}-${options.mana ?? 5}`, type: 'controller_combat_action_window' });
  return { playerId: pairing.playerId, volumen: volumen.instanceId };
}

function responseAction(session: ReturnType<typeof createMatchSession>, playerId: string, volumen: string) {
  return session.getPlayerView(playerId).legalActions.find((action) =>
    action.type === 'resolve_response' &&
    action.cardInstanceId === volumen &&
    action.abilityId === 'volumen.extra-play');
}

describe('CARD_ACTION_SEMANTICS_MINIMAL_PLAY_SOURCE_CARD_WITH_COST_RESPONSE', () => {
  it('routes Volumen response source-card play through data-flow', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, volumen } = prepareVolumenResponse(session);
    const action = responseAction(session, playerId, volumen);

    expect(action).toEqual(expect.objectContaining({
      type: 'resolve_response',
      cardInstanceId: volumen,
      abilityId: 'volumen.extra-play',
    }));

    const result = session.dispatchPlayerAction(playerId, action!);

    expect(result.ok).toBe(true);
    expect(session.state.players.find((player) => player.id === playerId)!.mana).toBe(3);
    expect(session.state.cards.find((card) => card.instanceId === volumen)).toMatchObject({
      ownerPlayerId: playerId,
      controllerPlayerId: playerId,
      zone: 'attack_area',
      visibility: { scope: 'public' },
    });
    expect(session.state.abilityRuntime!.cardState[volumen]).toMatchObject({
      active: true,
      faceDown: false,
      playedRound: session.state.round.roundNumber,
    });
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'source_card_played',
      playerId,
      sourceCardId: volumen,
      abilityId: 'volumen.extra-play',
    }));
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved',
      playerId,
      sourceCardId: volumen,
      abilityId: 'volumen.extra-play',
      resultId: expect.any(String),
    }));
  });

  it('does not offer Volumen when mana is insufficient or source card is no longer in hand', () => {
    const lowMana = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const lowManaSetup = prepareVolumenResponse(lowMana, { mana: 1 });
    expect(responseAction(lowMana, lowManaSetup.playerId, lowManaSetup.volumen)).toBeUndefined();

    const movedSource = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const movedSetup = prepareVolumenResponse(movedSource, { sourceZone: 'discard' });
    expect(responseAction(movedSource, movedSetup.playerId, movedSetup.volumen)).toBeUndefined();
  });

  it('revalidates source hand state at dispatch time without charging mana', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, volumen } = prepareVolumenResponse(session);
    const action = responseAction(session, playerId, volumen)!;
    session.state.cards.find((card) => card.instanceId === volumen)!.zone = 'discard';
    const eventCount = session.state.abilityRuntime!.events.length;

    const result = session.dispatchPlayerAction(playerId, action);

    expect(result.ok).toBe(false);
    expect(result.rejection).toEqual(expect.objectContaining({ code: 'illegal_response' }));
    expect(session.state.players.find((player) => player.id === playerId)!.mana).toBe(5);
    expect(session.state.cards.find((card) => card.instanceId === volumen)).toMatchObject({ zone: 'discard' });
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
  });

  it('classifies only the exact Volumen source-card response play shape without ability ids', () => {
    const ability: AuthoringAbility = {
      id: 'renamed-extra-play',
      kind: 'response',
      printedClause: '',
      activation: { trigger: 'controller_combat_action_window' },
      conditions: [],
      targets: [],
      effects: [{ type: 'play_source_card', face: 'face_up' }],
      cost: [{ type: 'pay_mana', amount: 2 }],
      ruleModifiers: [],
      creates: [],
      lifecycle: {},
      responseWindow: { opens: 'controller_combat_action_window' },
      limit: {},
      visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    };
    const wrongKind = structuredClone(ability);
    wrongKind.kind = 'phase_action';
    const wrongTrigger = structuredClone(ability);
    wrongTrigger.activation.trigger = 'on_card_played';
    const wrongWindow = structuredClone(ability);
    wrongWindow.responseWindow.opens = 'controller_action_window';
    const missingCost = structuredClone(ability);
    missingCost.cost = [];
    const wrongCost = structuredClone(ability);
    wrongCost.cost = [{ type: 'pay_mana', amount: 3 }];
    const faceDown = structuredClone(ability);
    faceDown.effects[0]!.face = 'face_down';
    const targeted = structuredClone(ability);
    targeted.targets = [{ id: 'card_to_play', type: 'card_instance' }];
    const creates = structuredClone(ability);
    creates.creates = [{ type: 'create_card', definitionId: 'x' }];

    expect(isPlaySourceCardWithCostResponse(ability)).toBe(true);
    expect(isPlaySourceCardWithCostResponse(wrongKind)).toBe(false);
    expect(isPlaySourceCardWithCostResponse(wrongTrigger)).toBe(false);
    expect(isPlaySourceCardWithCostResponse(wrongWindow)).toBe(false);
    expect(isPlaySourceCardWithCostResponse(missingCost)).toBe(false);
    expect(isPlaySourceCardWithCostResponse(wrongCost)).toBe(false);
    expect(isPlaySourceCardWithCostResponse(faceDown)).toBe(false);
    expect(isPlaySourceCardWithCostResponse(targeted)).toBe(false);
    expect(isPlaySourceCardWithCostResponse(creates)).toBe(false);
  });
});
