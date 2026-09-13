import { describe, expect, it } from 'vitest';

import { createMatchSession } from '../../src/match-session';
import {
  advanceAbilityPhase,
  isResultBindingProductionBridgeSemantic,
} from '../../src/ability/interpreter';
import type { AuthoringAbility } from '../../src/ability/types';

const allPlayers = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];

function prepareGoldenEater(options: { mana?: number; battlefield?: boolean } = {}) {
  const session = createMatchSession({ seed: 20260914, humanPlayerIds: allPlayers });
  const pairing = session.pairings.find((candidate) => candidate.servant.id === 'servant.kintoki')!;
  const player = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
  const eater = session.state.cards.find((candidate) =>
    candidate.controllerPlayerId === player.id &&
    candidate.definitionId === 'servant.kintoki.skill.sc-kintoki-3')!;
  const impacts = [
    'servant.kintoki.skill.sc-kintoki-1',
    'servant.kintoki.skill.sc-kintoki-2',
  ].map((definitionId) => session.state.cards.find((candidate) =>
    candidate.controllerPlayerId === player.id && candidate.definitionId === definitionId)!).filter(Boolean);

  player.mana = options.mana ?? 14;
  player.locationId = options.battlefield === false ? 'magic_workshop' : 'miyama_town';
  session.state.round.activePhase = 'action';
  session.state.round.prioritySeat = player.seat;
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;

  expect(session.dispatchPlayerAction(player.id, {
    type: 'play_card',
    cardInstanceId: eater.instanceId,
  }).ok).toBe(true);
  const resolutionMana = session.state.players.find((candidate) => candidate.id === player.id)!.mana;

  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;
  for (const impact of impacts) {
    const authoritative = session.state.cards.find((candidate) => candidate.instanceId === impact.instanceId)!;
    authoritative.zone = 'removed_from_game';
    authoritative.visibility = { scope: 'public' };
  }
  session.state.round.activePhase = 'battle';
  session.state.round.prioritySeat = player.seat;
  advanceAbilityPhase(session.state, 'battle', session.state.round.roundNumber);
  // Full-roster MatchSession can open unrelated combat response windows. They are
  // outside B11; clear them after the trusted phase hook so this fixture isolates
  // the Golden Eater production dispatch path.
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];

  return {
    session,
    playerId: player.id,
    eaterId: eater.instanceId,
    firstImpactId: impacts[0]!.instanceId,
    secondImpactId: impacts[1]!.instanceId,
    resolutionMana,
  };
}

function activateGoldenEater(fixture: ReturnType<typeof prepareGoldenEater>) {
  const { session, playerId, eaterId } = fixture;
  const action = session.getPlayerView(playerId).legalActions.find((candidate) =>
    candidate.type === 'activate_ability' &&
    candidate.cardInstanceId === eaterId &&
    candidate.abilityId === 'sc-kintoki-3.golden-eater');
  expect(action).toBeTruthy();
  const result = session.dispatchPlayerAction(playerId, {
    type: 'activate_ability',
    cardInstanceId: eaterId,
    abilityId: 'sc-kintoki-3.golden-eater',
  });
  expect(result.ok).toBe(true);
}

function choosePending(
  fixture: ReturnType<typeof prepareGoldenEater>,
  selectedIds: string[],
) {
  const { session, playerId } = fixture;
  const pending = session.getPlayerView(playerId).pendingDecision!;
  expect(pending).toBeTruthy();
  return session.dispatchPlayerAction(playerId, {
    type: 'choose_target',
    decisionId: pending.id,
    selectedIds,
  });
}

function renamedGoldenEater(): AuthoringAbility {
  return {
    id: 'renamed-staged-result-binding',
    kind: 'phase_action',
    printedClause: '',
    activation: {
      phase: 'combat',
      opens: 'controller_combat_action_window',
      requiresSourceState: 'active',
    },
    conditions: [],
    targets: [
      {
        id: 'firstCard',
        type: 'card_instance',
        scope: { zone: 'removed_from_game', owner: 'controller' },
        constraints: [{ type: 'has_card_id', cardId: 'fixture.first' }],
        count: { min: 1, max: 1 },
        visibility: 'private_to_controller',
      },
      {
        id: 'secondCard',
        type: 'card_instance',
        scope: { zone: 'removed_from_game', owner: 'controller' },
        constraints: [{ type: 'has_card_id', cardId: 'fixture.second' }],
        count: { min: 0, max: 1 },
        conditions: [{ type: 'controller_mana_at_least', value: 7 }],
        visibility: 'private_to_controller',
      },
    ],
    effects: [
      {
        type: 'move_card',
        target: 'firstCard',
        to: { zone: 'skill' },
        resultVar: 'cards_moved_this_resolution',
      },
      {
        type: 'move_card',
        target: 'secondCard',
        to: { zone: 'skill' },
        optionalCost: { type: 'pay_mana', amount: 7 },
        resultVar: 'cards_moved_this_resolution',
      },
      {
        type: 'branch',
        branches: [{
          if: { type: 'controller_at_battlefield' },
          then: [{
            type: 'adjust_victory_points',
            player: 'controller',
            amount: {
              op: 'multiply',
              args: [
                { var: 'cards_moved_this_resolution' },
                { op: 'const', value: 2 },
              ],
            },
          }],
        }],
      },
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
}

describe('RESULT_BINDING_PRODUCTION_BRIDGE', () => {
  it('classifies the staged binding graph by semantic axes rather than card or ability id', () => {
    const valid = renamedGoldenEater();
    const wrongTargetRef = structuredClone(valid);
    wrongTargetRef.effects[0]!.target = 'missingTarget';
    const wrongPayment = structuredClone(valid);
    wrongPayment.effects[1]!.optionalCost.amount = 6;
    const wrongBinding = structuredClone(valid);
    wrongBinding.effects[1]!.resultVar = 'different_binding';
    const wrongPhase = structuredClone(valid);
    wrongPhase.activation.phase = 'action';

    expect(isResultBindingProductionBridgeSemantic(valid)).toBe(true);
    expect(isResultBindingProductionBridgeSemantic(wrongTargetRef)).toBe(false);
    expect(isResultBindingProductionBridgeSemantic(wrongPayment)).toBe(false);
    expect(isResultBindingProductionBridgeSemantic(wrongBinding)).toBe(false);
    expect(isResultBindingProductionBridgeSemantic(wrongPhase)).toBe(false);
  });

  it('commits the first Golden Eater move before staging the optional second target', () => {
    const fixture = prepareGoldenEater();
    activateGoldenEater(fixture);
    const revisionBeforeFirstChoice = fixture.session.state.abilityRuntime!.revision;

    const result = choosePending(fixture, [fixture.firstImpactId]);

    expect(result.ok).toBe(true);
    expect(fixture.session.state.cards.find((card) => card.instanceId === fixture.firstImpactId)?.zone).toBe('skill');
    expect(fixture.session.state.cards.find((card) => card.instanceId === fixture.secondImpactId)?.zone).toBe('removed_from_game');
    expect(fixture.session.state.players.find((player) => player.id === fixture.playerId)!.mana).toBe(fixture.resolutionMana);
    expect(fixture.session.state.players.find((player) => player.id === fixture.playerId)!.vp).toBe(0);
    expect(fixture.session.state.abilityRuntime!.revision).toBe(revisionBeforeFirstChoice + 1);
    expect(fixture.session.getPlayerView(fixture.playerId).pendingDecision).toEqual(expect.objectContaining({
      candidates: [fixture.secondImpactId],
      min: 0,
      max: 1,
    }));
    expect(fixture.session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'cards_moved',
      sourceCardId: fixture.eaterId,
      abilityId: 'sc-kintoki-3.golden-eater',
    }));
  });

  it('continues from the server-owned first-stage result and pays/moves/awards from actual movedCount', () => {
    const fixture = prepareGoldenEater();
    activateGoldenEater(fixture);
    expect(choosePending(fixture, [fixture.firstImpactId]).ok).toBe(true);
    const revisionBeforeSecondChoice = fixture.session.state.abilityRuntime!.revision;

    const result = choosePending(fixture, [fixture.secondImpactId]);

    expect(result.ok).toBe(true);
    expect(fixture.session.state.cards.find((card) => card.instanceId === fixture.firstImpactId)?.zone).toBe('skill');
    expect(fixture.session.state.cards.find((card) => card.instanceId === fixture.secondImpactId)?.zone).toBe('skill');
    expect(fixture.session.state.players.find((player) => player.id === fixture.playerId)!.mana).toBe(fixture.resolutionMana - 7);
    expect(fixture.session.state.players.find((player) => player.id === fixture.playerId)!.vp).toBe(4);
    expect(fixture.session.state.abilityRuntime!.revision).toBe(revisionBeforeSecondChoice + 1);
    expect(fixture.session.getPlayerView(fixture.playerId).pendingDecision).toBeUndefined();
  });

  it('uses actual first-stage movedCount when the optional second target is declined', () => {
    const fixture = prepareGoldenEater();
    activateGoldenEater(fixture);
    expect(choosePending(fixture, [fixture.firstImpactId]).ok).toBe(true);

    const result = choosePending(fixture, []);

    expect(result.ok).toBe(true);
    expect(fixture.session.state.cards.find((card) => card.instanceId === fixture.firstImpactId)?.zone).toBe('skill');
    expect(fixture.session.state.cards.find((card) => card.instanceId === fixture.secondImpactId)?.zone).toBe('removed_from_game');
    expect(fixture.session.state.players.find((player) => player.id === fixture.playerId)!.mana).toBe(fixture.resolutionMana);
    expect(fixture.session.state.players.find((player) => player.id === fixture.playerId)!.vp).toBe(2);
  });

  it('preserves the committed first stage when typed payment fails in the second dispatch', () => {
    const fixture = prepareGoldenEater();
    activateGoldenEater(fixture);
    expect(choosePending(fixture, [fixture.firstImpactId]).ok).toBe(true);
    const player = fixture.session.state.players.find((candidate) => candidate.id === fixture.playerId)!;
    player.mana = 6;
    // Simulate a server-side race after the optional candidate was staged. The trusted
    // continuation still has to reach typed payment and roll back only this dispatch.
    fixture.session.state.abilityRuntime!.pendingDecision!.target.conditions = [];
    const snapshot = structuredClone(fixture.session.state);

    const result = choosePending(fixture, [fixture.secondImpactId]);

    expect(result.ok).toBe(false);
    expect(result.rejection).toEqual(expect.objectContaining({ code: 'resolution_failed' }));
    expect(fixture.session.state).toEqual(snapshot);
    expect(fixture.session.state.cards.find((card) => card.instanceId === fixture.firstImpactId)?.zone).toBe('skill');
    expect(fixture.session.state.cards.find((card) => card.instanceId === fixture.secondImpactId)?.zone).toBe('removed_from_game');
  });

  it('does not trust client variables as a result-binding continuation', () => {
    const fixture = prepareGoldenEater();
    const snapshot = structuredClone(fixture.session.state);

    const result = fixture.session.dispatchPlayerAction(fixture.playerId, {
      type: 'activate_ability',
      cardInstanceId: fixture.eaterId,
      abilityId: 'sc-kintoki-3.golden-eater',
      variables: { golden_impact_cards_added_this_resolution: 99 },
    });

    expect(result.ok).toBe(false);
    expect(result.rejection).toEqual(expect.objectContaining({ code: 'invalid_variable' }));
    expect(fixture.session.state).toEqual(snapshot);
  });

  it('fails a malformed near-match as resolution_failed instead of retrying legacy resolveEffect', () => {
    const fixture = prepareGoldenEater();
    const ability = fixture.session.state.abilityRuntime!.pack.cards['servant.kintoki.skill.sc-kintoki-3']!.abilities
      .find((candidate) => candidate.id === 'sc-kintoki-3.golden-eater')!;
    ability.effects[0]!.target = 'missingTarget';
    const snapshot = structuredClone(fixture.session.state);

    const result = fixture.session.dispatchPlayerAction(fixture.playerId, {
      type: 'activate_ability',
      cardInstanceId: fixture.eaterId,
      abilityId: 'sc-kintoki-3.golden-eater',
    });

    expect(result.ok).toBe(false);
    expect(result.rejection).toEqual(expect.objectContaining({ code: 'resolution_failed' }));
    expect(fixture.session.state).toEqual(snapshot);
  });
});
