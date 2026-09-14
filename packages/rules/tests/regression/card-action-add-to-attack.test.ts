import { describe, expect, it } from 'vitest';

import { createMatchSession } from '../../src/match-session';
import { isAddToAttackDirectAction } from '../../src/ability/interpreter';
import type { AuthoringAbility } from '../../src/ability/types';

function prepareMaiyaAdvance(session: ReturnType<typeof createMatchSession>): { playerId: string; military: string; supportShot: string } {
  const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.maiya')!;
  const player = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
  player.locationId = 'recon';
  player.mana = 6;
  session.state.round.activePhase = 'advance';
  session.state.round.prioritySeat = player.seat;
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;
  const military = session.state.cards.find((card) =>
    card.controllerPlayerId === pairing.playerId && card.definitionId === 'master.maiya.skill.military')!.instanceId;
  const supportShot = session.state.cards.find((card) =>
    card.ownerPlayerId === pairing.playerId && card.definitionId === 'master.maiya.deck.support-shot')!.instanceId;
  return { playerId: pairing.playerId, military, supportShot };
}

describe('CARD_ACTION_SEMANTICS_MINIMAL_ADD_TO_ATTACK', () => {
  it('routes Maiya Support Shot by executable semantic form through data-flow', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, military, supportShot } = prepareMaiyaAdvance(session);

    const activation = session.dispatchPlayerAction(playerId, {
      type: 'activate_ability',
      cardInstanceId: military,
      abilityId: 'military.attach-support-shot',
    });
    expect(activation.ok).toBe(true);
    const targetAction = session.getPlayerView(playerId).legalActions.find((action) =>
      action.type === 'choose_target' && action.candidates.includes('p2'));
    expect(targetAction).toEqual(expect.objectContaining({ min: 1, max: 1 }));

    const result = session.dispatchPlayerAction(playerId, {
      type: 'choose_target',
      decisionId: targetAction!.decisionId,
      selectedIds: ['p2'],
    });

    expect(result.ok).toBe(true);
    expect(session.state.players.find((candidate) => candidate.id === playerId)!.mana).toBe(4);
    expect(session.state.cards.find((card) => card.instanceId === supportShot)).toMatchObject({
      ownerPlayerId: playerId,
      controllerPlayerId: 'p2',
      zone: 'attack_area',
      visibility: { scope: 'public' },
    });
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'attack_added',
      playerId: 'p2',
      sourceCardId: military,
      abilityId: 'military.attach-support-shot',
    }));
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved',
      playerId,
      sourceCardId: military,
      abilityId: 'military.attach-support-shot',
      resultId: expect.any(String),
    }));
    expect((session.state as unknown as { modeState?: { supportShotAttachments?: Array<Record<string, unknown>> } }).modeState?.supportShotAttachments).toContainEqual(expect.objectContaining({
      sourceOwnerId: playerId,
      targetPlayerId: 'p2',
      cardInstanceId: supportShot,
      sourceCardId: military,
      abilityId: 'military.attach-support-shot',
      returnAtRoundEnd: true,
    }));
    expect((session.state as unknown as { activeStatuses?: Array<Record<string, unknown>> }).activeStatuses).toContainEqual(expect.objectContaining({
      id: 'maiya_cannot_win_battle_this_round',
      sourceControllerId: playerId,
    }));
  });

  it('fails closed without legacy fallback when a migrated Support Shot graph is corrupted', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, military, supportShot } = prepareMaiyaAdvance(session);
    const ability = session.state.abilityRuntime!.pack.cards['master.maiya.skill.military']!.abilities
      .find((candidate) => candidate.id === 'military.attach-support-shot')!;
    ability.effects[0]!.controllerCannotWinStatus = 'wrong_status';
    const eventCount = session.state.abilityRuntime!.events.length;

    const activation = session.dispatchPlayerAction(playerId, {
      type: 'activate_ability',
      cardInstanceId: military,
      abilityId: 'military.attach-support-shot',
    });

    expect(activation.ok).toBe(false);
    expect(activation.rejection).toEqual(expect.objectContaining({ code: 'resolution_failed' }));
    expect(session.state.players.find((candidate) => candidate.id === playerId)!.mana).toBe(6);
    expect(session.state.cards.find((card) => card.instanceId === supportShot)).toMatchObject({
      ownerPlayerId: playerId,
      controllerPlayerId: playerId,
      zone: 'skill',
    });
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
  });

  it('does not expose or execute add-to-attack when the canonical battlefield condition is missing', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, military, supportShot } = prepareMaiyaAdvance(session);
    session.state.players.find((candidate) => candidate.id === playerId)!.locationId = 'miyama_town';
    const ability = session.state.abilityRuntime!.pack.cards['master.maiya.skill.military']!.abilities
      .find((candidate) => candidate.id === 'military.attach-support-shot')!;
    ability.conditions = [];
    const eventCount = session.state.abilityRuntime!.events.length;

    expect(session.getPlayerView(playerId).legalActions).not.toContainEqual(expect.objectContaining({
      type: 'activate_ability',
      cardInstanceId: military,
      abilityId: 'military.attach-support-shot',
    }));

    const activation = session.dispatchPlayerAction(playerId, {
      type: 'activate_ability',
      cardInstanceId: military,
      abilityId: 'military.attach-support-shot',
    });

    expect(activation.ok).toBe(false);
    expect(activation.rejection).toEqual(expect.objectContaining({ code: 'illegal_action' }));
    expect(session.state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(session.state.players.find((candidate) => candidate.id === playerId)!.mana).toBe(6);
    expect(session.state.cards.find((card) => card.instanceId === supportShot)).toMatchObject({
      ownerPlayerId: playerId,
      controllerPlayerId: playerId,
      zone: 'skill',
    });
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
  });

  it.each(['hand', 'deck', 'discard', 'field'] as const)('fails closed before spending mana when Support Shot is in %s', (zone) => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, military, supportShot } = prepareMaiyaAdvance(session);
    const support = session.state.cards.find((card) => card.instanceId === supportShot)!;
    support.zone = zone;
    support.visibility = zone === 'hand' || zone === 'deck'
      ? { scope: 'owner_only', ownerPlayerId: playerId }
      : { scope: 'public' };
    const eventCount = session.state.abilityRuntime!.events.length;

    const activation = session.dispatchPlayerAction(playerId, {
      type: 'activate_ability',
      cardInstanceId: military,
      abilityId: 'military.attach-support-shot',
    });

    expect(activation.ok).toBe(false);
    expect(activation.rejection).toEqual(expect.objectContaining({ code: 'resolution_failed' }));
    expect(session.state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(session.state.players.find((candidate) => candidate.id === playerId)!.mana).toBe(6);
    expect(session.state.cards.find((card) => card.instanceId === supportShot)).toMatchObject({
      ownerPlayerId: playerId,
      controllerPlayerId: playerId,
      zone,
    });
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
  });

  it('does not offer add-to-attack when no legal non-controller player target remains', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, military, supportShot } = prepareMaiyaAdvance(session);
    for (const candidate of session.state.players) {
      if (candidate.id !== playerId) candidate.status = 'eliminated';
    }
    const eventCount = session.state.abilityRuntime!.events.length;
    const revision = session.state.abilityRuntime!.revision;

    expect(session.getPlayerView(playerId).legalActions).not.toContainEqual(expect.objectContaining({
      type: 'activate_ability',
      cardInstanceId: military,
      abilityId: 'military.attach-support-shot',
    }));

    const activation = session.dispatchPlayerAction(playerId, {
      type: 'activate_ability',
      cardInstanceId: military,
      abilityId: 'military.attach-support-shot',
    });

    expect(activation.ok).toBe(false);
    expect(activation.rejection).toEqual(expect.objectContaining({ code: 'illegal_action' }));
    expect(session.state.players.find((candidate) => candidate.id === playerId)!.mana).toBe(6);
    expect(session.state.cards.find((card) => card.instanceId === supportShot)).toMatchObject({ zone: 'skill' });
    expect(session.state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
    expect(session.state.abilityRuntime!.revision).toBe(revision);
  });

  it('rejects a target that becomes inactive after activation without rolling back the committed activation cost', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, military, supportShot } = prepareMaiyaAdvance(session);

    const activation = session.dispatchPlayerAction(playerId, {
      type: 'activate_ability',
      cardInstanceId: military,
      abilityId: 'military.attach-support-shot',
    });
    expect(activation.ok).toBe(true);
    const targetAction = session.getPlayerView(playerId).legalActions.find((action) =>
      action.type === 'choose_target' && action.candidates.includes('p2'));
    expect(targetAction).toBeDefined();
    const pendingId = session.state.abilityRuntime!.pendingDecision!.id;
    session.state.players.find((candidate) => candidate.id === 'p2')!.status = 'eliminated';
    const eventCount = session.state.abilityRuntime!.events.length;
    const revision = session.state.abilityRuntime!.revision;

    const result = session.dispatchPlayerAction(playerId, {
      type: 'choose_target',
      decisionId: targetAction!.decisionId,
      selectedIds: ['p2'],
    });

    expect(result.ok).toBe(false);
    expect(result.rejection).toEqual(expect.objectContaining({ code: 'illegal_target' }));
    expect(session.state.players.find((candidate) => candidate.id === playerId)!.mana).toBe(4);
    expect(session.state.cards.find((card) => card.instanceId === supportShot)).toMatchObject({
      ownerPlayerId: playerId,
      controllerPlayerId: playerId,
      zone: 'skill',
    });
    expect(session.state.abilityRuntime!.pendingDecision?.id).toBe(pendingId);
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
    expect(session.state.abilityRuntime!.revision).toBe(revision);
  });

  it('attaches beside an existing target attack without consuming normal play counters or printed card cost', () => {
    const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const { playerId, military, supportShot } = prepareMaiyaAdvance(session);
    const existingAttack = session.state.cards.find((card) =>
      card.controllerPlayerId === 'p2' &&
      session.state.abilityRuntime!.pack.cards[card.definitionId]?.cardType === 'basic_attack')!;
    existingAttack.zone = 'attack_area';
    existingAttack.visibility = { scope: 'public' };
    session.state.abilityRuntime!.cardState[existingAttack.instanceId] = {
      active: true,
      faceDown: false,
      playedRound: session.state.round.roundNumber,
    };
    const counters = session.state.abilityRuntime!.playCounters!;
    counters.cardsPlayedByPlayer[playerId] = 7;
    counters.attacksDeclaredByPlayer[playerId] = 5;
    counters.cardsPlayedByPlayer.p2 = 4;
    counters.attacksDeclaredByPlayer.p2 = 3;
    const countersBefore = structuredClone(counters);

    const activation = session.dispatchPlayerAction(playerId, {
      type: 'activate_ability',
      cardInstanceId: military,
      abilityId: 'military.attach-support-shot',
    });
    expect(activation.ok).toBe(true);
    const targetAction = session.getPlayerView(playerId).legalActions.find((action) =>
      action.type === 'choose_target' && action.candidates.includes('p2'))!;
    const result = session.dispatchPlayerAction(playerId, {
      type: 'choose_target',
      decisionId: targetAction.decisionId,
      selectedIds: ['p2'],
    });

    expect(result.ok).toBe(true);
    expect(session.state.players.find((candidate) => candidate.id === playerId)!.mana).toBe(4);
    expect(session.state.abilityRuntime!.playCounters).toEqual(countersBefore);
    expect(session.state.cards.find((card) => card.instanceId === existingAttack.instanceId)).toMatchObject({
      controllerPlayerId: 'p2',
      zone: 'attack_area',
    });
    expect(session.state.cards.find((card) => card.instanceId === supportShot)).toMatchObject({
      ownerPlayerId: playerId,
      controllerPlayerId: 'p2',
      zone: 'attack_area',
    });
    expect(session.state.cards.filter((card) => card.controllerPlayerId === 'p2' && card.zone === 'attack_area'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ instanceId: existingAttack.instanceId }),
        expect.objectContaining({ instanceId: supportShot }),
      ]));
  });

  it('classifies only the exact Maiya add-to-attack semantic shape without ability ids', () => {
    const addToAttack: AuthoringAbility = {
      id: 'renamed-add-to-attack',
      kind: 'phase_action',
      printedClause: '',
      activation: { phase: 'advance', opens: 'controller_action_window' },
      conditions: [{ type: 'not', condition: { type: 'controller_at_battlefield' } }],
      targets: [{
        id: 'supported_player',
        type: 'player',
        constraints: [{ type: 'not_controller' }],
        count: { min: 1, max: 1 },
      }],
      effects: [{
        type: 'attach_card_to_player_attack',
        cardId: 'master.maiya.deck.support-shot',
        target: 'supported_player',
        returnAtRoundEnd: true,
        controllerCannotWinStatus: 'maiya_cannot_win_battle_this_round',
      }],
      cost: [{ type: 'pay_mana', amount: 2 }],
      ruleModifiers: [],
      creates: [],
      lifecycle: {},
      responseWindow: {},
      limit: {},
      visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    };
    const missingReturn = structuredClone(addToAttack);
    missingReturn.effects[0]!.returnAtRoundEnd = false;
    const missingBattlefieldCondition = structuredClone(addToAttack);
    missingBattlefieldCondition.conditions = [];
    const playShape = structuredClone(addToAttack);
    playShape.effects = [{ type: 'play_selected_cards', target: 'card_to_play', face: 'face_down' }];

    expect(isAddToAttackDirectAction(addToAttack)).toBe(true);
    expect(isAddToAttackDirectAction(missingReturn)).toBe(false);
    expect(isAddToAttackDirectAction(missingBattlefieldCondition)).toBe(false);
    expect(isAddToAttackDirectAction(playShape)).toBe(false);
  });
});
