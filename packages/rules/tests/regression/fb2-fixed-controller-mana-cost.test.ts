import { describe, expect, it } from 'vitest';

import {
  executeAbility,
  isFixedControllerManaCostComponent,
  processAbilityEvent,
} from '../../src/ability/interpreter';
import { createMatchSession } from '../../src/match-session';
import type { AuthoringAbility, EffectContext } from '../../src/ability/types';

function fixedCostAbility(): AuthoringAbility {
  return {
    id: 'renamed-fixed-cost-probe',
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
}

function prepareMaiya() {
  const session = createMatchSession({ seed: 20260916, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
  const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.maiya')!;
  const player = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
  player.locationId = 'recon';
  player.mana = 6;
  session.state.round.activePhase = 'advance';
  session.state.round.prioritySeat = player.seat;
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;
  const military = session.state.cards.find((candidate) =>
    candidate.controllerPlayerId === pairing.playerId && candidate.definitionId === 'master.maiya.skill.military')!.instanceId;
  return { session, playerId: pairing.playerId, military };
}

function prepareVolumen(mana = 5) {
  const session = createMatchSession({ seed: 20260916, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
  const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.kayneth')!;
  const player = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
  player.mana = mana;
  session.state.round.activePhase = 'battle';
  session.state.round.prioritySeat = player.seat;
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;
  const volumen = session.state.cards.find((candidate) =>
    candidate.ownerPlayerId === pairing.playerId && candidate.definitionId === 'master.kayneth.deck.volumen-hydrargyrum')!;
  volumen.zone = 'hand';
  volumen.controllerPlayerId = pairing.playerId;
  volumen.visibility = { scope: 'owner_only', ownerPlayerId: pairing.playerId };
  delete session.state.abilityRuntime!.cardState[volumen.instanceId];
  processAbilityEvent(session.state, { id: `fb2-volumen-window-${mana}`, type: 'controller_combat_action_window' });
  return { session, playerId: pairing.playerId, volumen: volumen.instanceId };
}

function volumenContext(playerId: string, volumen: string): EffectContext {
  return {
    controllerId: playerId,
    sourceCardId: volumen,
    abilityId: 'volumen.extra-play',
    variables: {},
    selections: {},
  };
}

describe('P3-FB2-01 fixed controller mana cost component', () => {
  it('classifies only one positive safe-integer top-level pay_mana cost without using identity', () => {
    const ability = fixedCostAbility();
    const renamed = structuredClone(ability);
    renamed.id = 'totally-different-id';

    expect(isFixedControllerManaCostComponent(ability)).toBe(true);
    expect(isFixedControllerManaCostComponent(renamed)).toBe(true);

    const zero = structuredClone(ability);
    zero.cost = [{ type: 'pay_mana', amount: 0 }];
    const negative = structuredClone(ability);
    negative.cost = [{ type: 'pay_mana', amount: -1 }];
    const fractional = structuredClone(ability);
    fractional.cost = [{ type: 'pay_mana', amount: 1.5 }];
    const variable = structuredClone(ability);
    variable.cost = [{ type: 'pay_mana', amount: { var: 'X' } }];
    const expression = structuredClone(ability);
    expression.cost = [{ type: 'pay_mana', amount: { op: 'const', value: 2 } }];
    const thirdParty = structuredClone(ability);
    thirdParty.cost = [{ type: 'pay_mana', amount: 2, player: 'target_player' }];
    const extraCost = structuredClone(ability);
    extraCost.cost = [{ type: 'pay_mana', amount: 2 }, { type: 'move_source_card', from: { zone: 'hand' }, to: { zone: 'removed_from_game' } }];
    const nonMana = structuredClone(ability);
    nonMana.cost = [{ type: 'move_source_card', from: { zone: 'hand' }, to: { zone: 'removed_from_game' } }];
    const optionalEffectCost = structuredClone(ability);
    optionalEffectCost.effects = [{ type: 'move_card', target: 'second', to: { zone: 'skill' }, optionalCost: { type: 'pay_mana', amount: 7 } }];

    for (const rejected of [zero, negative, fractional, variable, expression, thirdParty, extraCost, nonMana, optionalEffectCost]) {
      expect(isFixedControllerManaCostComponent(rejected)).toBe(false);
    }
  });

  it('commits Maiya fixed payment as typed evidence before the accepted pending-target stage', () => {
    const { session, playerId, military } = prepareMaiya();
    const eventCount = session.state.abilityRuntime!.events.length;

    const activation = session.dispatchPlayerAction(playerId, {
      type: 'activate_ability',
      cardInstanceId: military,
      abilityId: 'military.attach-support-shot',
    });

    expect(activation.ok).toBe(true);
    expect(session.state.players.find((candidate) => candidate.id === playerId)!.mana).toBe(4);
    expect(session.state.abilityRuntime!.pendingDecision).toBeDefined();
    expect(session.state.abilityRuntime!.events.slice(eventCount)).toContainEqual(expect.objectContaining({
      type: 'mana_paid',
      playerId,
      controllerId: playerId,
      sourceCardId: military,
      abilityId: 'military.attach-support-shot',
      resource: 'mana',
      delta: -2,
      before: 6,
      after: 4,
      resultId: expect.any(String),
    }));

    const targetAction = session.getPlayerView(playerId).legalActions.find((action) =>
      action.type === 'choose_target' && action.candidates.includes('p2'))!;
    const eventsAfterActivation = session.state.abilityRuntime!.events.length;
    session.state.players.find((candidate) => candidate.id === 'p2')!.status = 'eliminated';

    const rejectedTarget = session.dispatchPlayerAction(playerId, {
      type: 'choose_target',
      decisionId: targetAction.decisionId,
      selectedIds: ['p2'],
    });

    expect(rejectedTarget.ok).toBe(false);
    expect(rejectedTarget.rejection).toEqual(expect.objectContaining({ code: 'illegal_target' }));
    expect(session.state.players.find((candidate) => candidate.id === playerId)!.mana).toBe(4);
    expect(session.state.abilityRuntime!.events).toHaveLength(eventsAfterActivation);
  });

  it('settles Kayneth fixed payment and source play in one typed resolution stage', () => {
    const { session, playerId, volumen } = prepareVolumen();
    const action = session.getPlayerView(playerId).legalActions.find((candidate) =>
      candidate.type === 'resolve_response' && candidate.cardInstanceId === volumen && candidate.abilityId === 'volumen.extra-play')!;
    const eventCount = session.state.abilityRuntime!.events.length;

    const result = session.dispatchPlayerAction(playerId, action);

    expect(result.ok).toBe(true);
    expect(session.state.players.find((candidate) => candidate.id === playerId)!.mana).toBe(3);
    expect(session.state.cards.find((candidate) => candidate.instanceId === volumen)).toMatchObject({ zone: 'attack_area' });
    expect(session.state.abilityRuntime!.events.slice(eventCount)).toContainEqual(expect.objectContaining({
      type: 'mana_paid',
      playerId,
      controllerId: playerId,
      sourceCardId: volumen,
      abilityId: 'volumen.extra-play',
      resource: 'mana',
      delta: -2,
      before: 5,
      after: 3,
    }));
    expect(session.state.abilityRuntime!.events.slice(eventCount)).toContainEqual(expect.objectContaining({
      type: 'source_card_played',
      playerId,
      sourceCardId: volumen,
      abilityId: 'volumen.extra-play',
    }));
  });

  it('rolls Kayneth payment back when the same typed stage fails after payment', () => {
    const { session, playerId, volumen } = prepareVolumen();
    session.state.cards.find((candidate) => candidate.instanceId === volumen)!.zone = 'discard';
    const eventCount = session.state.abilityRuntime!.events.length;

    expect(() => executeAbility(session.state, volumenContext(playerId, volumen)))
      .toThrow('Source card must still be in the controller hand.');

    expect(session.state.players.find((candidate) => candidate.id === playerId)!.mana).toBe(5);
    expect(session.state.cards.find((candidate) => candidate.instanceId === volumen)).toMatchObject({ zone: 'discard' });
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
  });

  it('fails closed on insufficient fixed mana without payment evidence or mutation', () => {
    const { session, playerId, volumen } = prepareVolumen(1);
    const eventCount = session.state.abilityRuntime!.events.length;

    expect(() => executeAbility(session.state, volumenContext(playerId, volumen))).toThrow('Cannot pay mana.');

    expect(session.state.players.find((candidate) => candidate.id === playerId)!.mana).toBe(1);
    expect(session.state.cards.find((candidate) => candidate.instanceId === volumen)).toMatchObject({ zone: 'hand' });
    expect(session.state.abilityRuntime!.events).toHaveLength(eventCount);
  });
});
