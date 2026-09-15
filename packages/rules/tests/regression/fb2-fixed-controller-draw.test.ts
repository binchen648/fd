import { describe, expect, it } from 'vitest';

import {
  dispatchAbilityCommand,
  executeAbility,
  getLegalActions,
  isFixedControllerAdvanceDrawActionSemantic,
  isFixedControllerDrawCardsComponent,
} from '../../src/ability/interpreter';
import { createMatchSession } from '../../src/match-session';
import type { AuthoringAbility, EffectContext } from '../../src/ability/types';

const definitionId = 'fixture.fixed-controller-draw';
const abilityId = 'renamed.advance-pay-draw';
const sourceId = 'fixture-fixed-controller-draw-source';

function fixedDrawAbility(): AuthoringAbility {
  return {
    id: abilityId,
    kind: 'phase_action',
    printedClause: '',
    activation: { phase: 'advance', opens: 'controller_action_window' },
    conditions: [],
    targets: [],
    effects: [{ type: 'draw_cards', player: 'controller', count: 2 }],
    cost: [{ type: 'pay_mana', player: 'controller', amount: 1 }],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function prepare(mana = 3, ability = fixedDrawAbility()) {
  const session = createMatchSession({ seed: 20260916, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
  const player = session.state.players[0]!;
  player.mana = mana;
  session.state.round.activePhase = 'advance';
  session.state.round.prioritySeat = player.seat;
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;

  session.state.abilityRuntime!.pack.cards[definitionId] = {
    id: definitionId,
    name: 'fixture fixed draw',
    cardType: 'master_skill',
    cardFace: { cost: 0, basePower: 0, attributes: [] },
    playTiming: { phase: 'advance', window: 'controller_play_card_window' },
    playRequirements: [],
    abilities: [ability],
    mode: 'automatic',
  } as never;
  session.state.cards.push({
    instanceId: sourceId,
    definitionId,
    ownerPlayerId: player.id,
    controllerPlayerId: player.id,
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: player.id },
  });
  return { session, player };
}

function context(playerId: string): EffectContext {
  return { controllerId: playerId, sourceCardId: sourceId, abilityId, variables: {}, selections: {} };
}

function activation(state: ReturnType<typeof prepare>['session']['state'], playerId: string) {
  return getLegalActions(state, playerId).find((candidate) =>
    candidate.type === 'activate_ability' && candidate.cardInstanceId === sourceId && candidate.abilityId === abilityId);
}

describe('P3-FB2-06 fixed controller draw component and advance route', () => {
  it('classifies only fixed positive controller ordinary-deck draw components', () => {
    expect(isFixedControllerDrawCardsComponent({ type: 'draw_cards', count: 1 } as never)).toBe(true);
    expect(isFixedControllerDrawCardsComponent({ type: 'draw_cards', player: 'controller', count: 3 } as never)).toBe(true);

    for (const rejected of [
      { type: 'draw_cards', count: 0 },
      { type: 'draw_cards', count: -1 },
      { type: 'draw_cards', count: 1.5 },
      { type: 'draw_cards', count: { var: 'X' } },
      { type: 'draw_cards', player: 'target', count: 1 },
      { type: 'draw_cards', count: 1, deck: 'beast' },
      { type: 'draw_cards', count: 1, when: 'source_played_with_one_base_attack' },
      { type: 'draw_cards', count: 1, operation: 'after_each_use_draw_one' },
      { type: 'draw_cards', count: 1, resultVar: 'drawnCardIds' },
    ]) expect(isFixedControllerDrawCardsComponent(rejected as never)).toBe(false);
  });

  it('accepts the identity-free advance pay-one draw-two route and rejects malformed near-matches', () => {
    const accepted = fixedDrawAbility();
    const renamed = structuredClone(accepted);
    renamed.id = 'completely-renamed-advance-draw';
    expect(isFixedControllerAdvanceDrawActionSemantic(accepted)).toBe(true);
    expect(isFixedControllerAdvanceDrawActionSemantic(renamed)).toBe(true);

    const wrongCount = structuredClone(accepted); wrongCount.effects = [{ type: 'draw_cards', player: 'controller', count: 1 }];
    const wrongCost = structuredClone(accepted); wrongCost.cost = [{ type: 'pay_mana', player: 'controller', amount: 2 }];
    const wrongPhase = structuredClone(accepted); wrongPhase.activation.phase = 'action';
    const target = structuredClone(accepted); target.targets = [{ id: 'x', type: 'player' }];
    const variable = structuredClone(accepted); variable.effects = [{ type: 'draw_cards', player: 'controller', count: { var: 'X' } }];
    for (const rejected of [wrongCount, wrongCost, wrongPhase, target, variable]) {
      expect(isFixedControllerAdvanceDrawActionSemantic(rejected)).toBe(false);
    }
  });

  it('does not grant a route merely because a fixed draw component matches', () => {
    const unsupported = fixedDrawAbility();
    unsupported.kind = 'forced_trigger';
    unsupported.activation = { trigger: 'on_card_played' };
    unsupported.cost = [];
    unsupported.effects = [{ type: 'draw_cards', player: 'controller', count: 1 }];
    expect(isFixedControllerDrawCardsComponent(unsupported.effects[0]!)).toBe(true);
    expect(isFixedControllerAdvanceDrawActionSemantic(unsupported)).toBe(false);
  });

  it('settles fixed payment and draw-two in one typed route without identity routing', () => {
    const { session, player } = prepare(3);
    const handBefore = session.state.cards.filter((card) => card.ownerPlayerId === player.id && card.zone === 'hand').length;
    const eventCount = session.state.abilityRuntime!.events.length;
    const action = activation(session.state, player.id);
    expect(action).toBeDefined();

    const result = dispatchAbilityCommand(session.state, player.id, action!);
    expect(result.ok).toBe(true);
    expect(session.state.players.find((candidate) => candidate.id === player.id)!.mana).toBe(2);
    expect(session.state.cards.filter((card) => card.ownerPlayerId === player.id && card.zone === 'hand')).toHaveLength(handBefore + 2);
    const emitted = session.state.abilityRuntime!.events.slice(eventCount);
    expect(emitted).toContainEqual(expect.objectContaining({
      type: 'mana_paid', playerId: player.id, sourceCardId: sourceId, abilityId, delta: -1, before: 3, after: 2,
    }));
    expect(emitted).toContainEqual(expect.objectContaining({
      type: 'cards_drawn', playerId: player.id, sourceCardId: sourceId, abilityId,
    }));
  });

  it('hides and rejects the route on insufficient Mana without draw, usage, or event mutation', () => {
    const { session, player } = prepare(0);
    const handBefore = session.state.cards.filter((card) => card.ownerPlayerId === player.id && card.zone === 'hand').length;
    const eventsBefore = session.state.abilityRuntime!.events.length;
    const usedBefore = structuredClone(session.state.abilityRuntime!.usedAbilities);
    expect(activation(session.state, player.id)).toBeUndefined();

    expect(() => executeAbility(session.state, context(player.id))).toThrow('Insufficient mana');
    expect(player.mana).toBe(0);
    expect(session.state.cards.filter((card) => card.ownerPlayerId === player.id && card.zone === 'hand')).toHaveLength(handBefore);
    expect(session.state.abilityRuntime!.events).toHaveLength(eventsBefore);
    expect(session.state.abilityRuntime!.usedAbilities).toEqual(usedBefore);
  });

  it('fails malformed same-family parents before legacy mutation and reuses discard recycling', () => {
    const malformed = fixedDrawAbility();
    malformed.effects = [{ type: 'draw_cards', player: 'controller', count: 1 }];
    const bad = prepare(3, malformed);
    const badEvents = bad.session.state.abilityRuntime!.events.length;
    expect(activation(bad.session.state, bad.player.id)).toBeUndefined();
    expect(() => executeAbility(bad.session.state, context(bad.player.id))).toThrow('Unsupported fixed controller advance-draw semantic shape');
    expect(bad.player.mana).toBe(3);
    expect(bad.session.state.abilityRuntime!.events).toHaveLength(badEvents);

    const good = prepare(3);
    const controllerCards = good.session.state.cards.filter((card) => card.ownerPlayerId === good.player.id && card.instanceId !== sourceId);
    for (const card of controllerCards) {
      if (card.zone === 'deck') card.zone = 'discard';
    }
    const handBefore = good.session.state.cards.filter((card) => card.ownerPlayerId === good.player.id && card.zone === 'hand').length;
    const discardBefore = good.session.state.cards.filter((card) => card.ownerPlayerId === good.player.id && card.zone === 'discard').length;
    expect(discardBefore).toBeGreaterThanOrEqual(2);
    const action = activation(good.session.state, good.player.id)!;
    expect(dispatchAbilityCommand(good.session.state, good.player.id, action).ok).toBe(true);
    expect(good.session.state.cards.filter((card) => card.ownerPlayerId === good.player.id && card.zone === 'hand')).toHaveLength(handBefore + 2);
  });
});
