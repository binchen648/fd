import { describe, expect, it } from 'vitest';

import { createMatchSession } from '../../src/match-session';
import { isPlayActionDirectAction } from '../../src/ability/interpreter';
import type { AuthoringAbility } from '../../src/ability/types';

function prepareKiritsuguAction(session: ReturnType<typeof createMatchSession>): {
  playerId: string;
  timeAlter: string;
  handAttack: string;
  deckTop: string;
} {
  const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.kiritsugu')!;
  const player = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
  player.mana = 6;
  session.state.round.activePhase = 'action';
  session.state.round.prioritySeat = player.seat;
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;
  const timeAlter = session.state.cards.find((card) =>
    card.controllerPlayerId === pairing.playerId && card.definitionId === 'master.kiritsugu.skill.time-alter')!.instanceId;
  const handAttack = session.state.cards.find((card) =>
    card.controllerPlayerId === pairing.playerId &&
    card.zone === 'hand' &&
    session.state.abilityRuntime!.pack.cards[card.definitionId]?.cardType === 'basic_attack')!.instanceId;
  const deckTop = session.state.cards.find((card) =>
    card.ownerPlayerId === pairing.playerId &&
    card.zone === 'deck')!.instanceId;
  return { playerId: pairing.playerId, timeAlter, handAttack, deckTop };
}

describe('CARD_ACTION_SEMANTICS_MINIMAL_PLAY', () => {
  it('routes Time Alter by executable semantic form through data-flow and shared playBatch', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, timeAlter, handAttack, deckTop } = prepareKiritsuguAction(session);

    const activation = session.dispatchPlayerAction(playerId, {
      type: 'activate_ability',
      cardInstanceId: timeAlter,
      abilityId: 'time-alter.action',
    });
    expect(activation.ok).toBe(true);
    const targetAction = session.getPlayerView(playerId).legalActions.find((action) =>
      action.type === 'choose_target' && action.candidates.includes(handAttack));
    expect(targetAction).toEqual(expect.objectContaining({ min: 1, max: 1 }));

    const result = session.dispatchPlayerAction(playerId, {
      type: 'choose_target',
      decisionId: targetAction!.decisionId,
      selectedIds: [handAttack],
    });

    expect(result.ok).toBe(true);
    expect(session.state.cards.find((card) => card.instanceId === handAttack)).toMatchObject({
      ownerPlayerId: playerId,
      controllerPlayerId: playerId,
      zone: 'attack_area',
      visibility: { scope: 'owner_only', ownerPlayerId: playerId },
    });
    expect(session.state.abilityRuntime!.cardState[handAttack]).toMatchObject({
      active: false,
      faceDown: true,
      playedRound: session.state.round.roundNumber,
    });
    expect(session.state.cards.find((card) => card.instanceId === deckTop)).toMatchObject({
      ownerPlayerId: playerId,
      controllerPlayerId: playerId,
      zone: 'hand',
    });
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved',
      playerId,
      sourceCardId: timeAlter,
      abilityId: 'time-alter.action',
      resultId: expect.any(String),
    }));
  });

  it('does not offer Time Alter when no controller hand attack is available', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, timeAlter } = prepareKiritsuguAction(session);
    for (const card of session.state.cards.filter((candidate) => candidate.ownerPlayerId === playerId && candidate.zone === 'hand')) {
      card.zone = 'deck';
      card.visibility = { scope: 'owner_only', ownerPlayerId: playerId };
    }
    const eventCount = session.state.abilityRuntime!.events.length;

    expect(session.getPlayerView(playerId).legalActions).not.toContainEqual(expect.objectContaining({
      type: 'activate_ability',
      cardInstanceId: timeAlter,
      abilityId: 'time-alter.action',
    }));

    const activation = session.dispatchPlayerAction(playerId, {
      type: 'activate_ability',
      cardInstanceId: timeAlter,
      abilityId: 'time-alter.action',
    });

    expect(activation.ok).toBe(false);
    expect(activation.rejection).toEqual(expect.objectContaining({ code: 'illegal_action' }));
    expect(session.state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
  });

  it('fails closed without legacy fallback when a migrated Time Alter graph is corrupted', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, timeAlter, handAttack, deckTop } = prepareKiritsuguAction(session);
    const ability = session.state.abilityRuntime!.pack.cards['master.kiritsugu.skill.time-alter']!.abilities
      .find((candidate) => candidate.id === 'time-alter.action')!;
    ability.effects[1]!.player = 'opponent';
    const eventCount = session.state.abilityRuntime!.events.length;

    const activation = session.dispatchPlayerAction(playerId, {
      type: 'activate_ability',
      cardInstanceId: timeAlter,
      abilityId: 'time-alter.action',
    });

    expect(activation.ok).toBe(false);
    expect(activation.rejection).toEqual(expect.objectContaining({ code: 'resolution_failed' }));
    expect(session.state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(session.state.cards.find((card) => card.instanceId === handAttack)).toMatchObject({ zone: 'hand' });
    expect(session.state.cards.find((card) => card.instanceId === deckTop)).toMatchObject({ zone: 'deck' });
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
  });

  it('classifies only the exact Time Alter play semantic shape without ability ids', () => {
    const play: AuthoringAbility = {
      id: 'renamed-time-alter',
      kind: 'phase_action',
      printedClause: '',
      activation: { phase: 'action', opens: 'controller_action_window' },
      conditions: [],
      targets: [{
        id: 'card_to_play',
        type: 'card_instance',
        scope: { zone: 'hand', owner: 'controller' },
        constraints: [{ type: 'is_attack' }],
        count: { min: 1, max: 1 },
      }],
      effects: [
        { type: 'play_selected_cards', target: 'card_to_play', face: 'face_down' },
        { type: 'draw_cards', count: 1 },
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
    const wrongPhase = structuredClone(play);
    wrongPhase.activation.phase = 'advance';
    const costed = structuredClone(play);
    costed.cost = [{ type: 'pay_mana', amount: 1 }];
    const missingDraw = structuredClone(play);
    missingDraw.effects = [missingDraw.effects[0]!];
    const faceUp = structuredClone(play);
    faceUp.effects[0]!.face = 'face_up';
    const deckTarget = structuredClone(play);
    deckTarget.targets[0]!.scope = { zone: 'deck', owner: 'controller' };
    const nonAttack = structuredClone(play);
    nonAttack.targets[0]!.constraints = [];
    const playSource = structuredClone(play);
    playSource.effects = [{ type: 'play_source_card', face: 'face_up' }, playSource.effects[1]!];
    const addToAttack = structuredClone(play);
    addToAttack.effects = [{ type: 'attach_card_to_player_attack', cardId: 'master.maiya.deck.support-shot', target: 'supported_player' }];

    expect(isPlayActionDirectAction(play)).toBe(true);
    expect(isPlayActionDirectAction(wrongPhase)).toBe(false);
    expect(isPlayActionDirectAction(costed)).toBe(false);
    expect(isPlayActionDirectAction(missingDraw)).toBe(false);
    expect(isPlayActionDirectAction(faceUp)).toBe(false);
    expect(isPlayActionDirectAction(deckTarget)).toBe(false);
    expect(isPlayActionDirectAction(nonAttack)).toBe(false);
    expect(isPlayActionDirectAction(playSource)).toBe(false);
    expect(isPlayActionDirectAction(addToAttack)).toBe(false);
  });
});
