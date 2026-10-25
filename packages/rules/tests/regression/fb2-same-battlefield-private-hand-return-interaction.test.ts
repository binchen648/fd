import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import {
  isSameBattlefieldPrivateHandReturnInteractionCandidate,
  isSameBattlefieldPrivateHandReturnInteractionSemantic,
} from '../../src/ability/interaction-gateway';
import { MatchSession, restoreMatchSession } from '../../src/match-session';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const SOURCE_DEFINITION = 'fixture.private-hand-source';
const SOURCE_INSTANCE = 'fixture.private-hand-source-instance';
const ABILITY_ID = 'same-battlefield-private-hand-return';

function archive() {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'master_skill_card_archive',
    id: 'master.private-hand-probe',
    name: 'Private Hand Probe',
    cards: [{
      id: SOURCE_DEFINITION,
      name: 'Private Hand Probe Skill',
      cardType: 'master_skill',
      owner: { type: 'master', id: 'master.private-hand-probe' },
      cardFace: { typeLabel: '特殊', cost: 0, basePower: 0, attributes: ['特殊'] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
      abilities: [{
        id: ABILITY_ID,
        kind: 'phase_action',
        printedClause: 'fixture only',
        activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
        conditions: [],
        targets: [{
          id: 'selected_player',
          type: 'player',
          count: { min: 1, max: 1 },
          constraints: [{ type: 'same_battlefield_as_controller' }],
        }],
        effects: [{ type: 'inspect_target_hand_optional_return_one_to_owner_deck', target: 'selected_player' }],
        cost: [],
        ruleModifiers: [],
        creates: [],
        lifecycle: {},
        responseWindow: {},
        limit: {},
        visibility: {},
        execution: { mode: 'automatic' },
      }],
    }],
  };
}

function loadedAbility() {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  return pack.cards[SOURCE_DEFINITION]!.abilities[0]!;
}

function addCard(state: GameState, instanceId: string, ownerPlayerId: string, zone: string, definitionId = `fixture.${instanceId}`) {
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId,
    controllerPlayerId: ownerPlayerId,
    zone,
    visibility: { scope: 'owner_only', ownerPlayerId },
  } as any);
  return instanceId;
}

function setup() {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'shinto';
  state.cards.push({
    instanceId: SOURCE_INSTANCE,
    definitionId: SOURCE_DEFINITION,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  });
  const p1Hand = addCard(state, 'p1-hand', 'p1', 'hand');
  const p2HandA = addCard(state, 'p2-hand-a', 'p2', 'hand');
  const p2HandB = addCard(state, 'p2-hand-b', 'p2', 'hand');
  const p3Hand = addCard(state, 'p3-hand', 'p3', 'hand');
  const p1DeckA = addCard(state, 'p1-deck-a', 'p1', 'deck');
  const p1DeckB = addCard(state, 'p1-deck-b', 'p1', 'deck');
  const p2DeckA = addCard(state, 'p2-deck-a', 'p2', 'deck');
  const p2DeckB = addCard(state, 'p2-deck-b', 'p2', 'deck');
  rules.initializeAbilityRuntime(state, pack, { seed: 20260918 });
  state.abilityRuntime!.cardState[SOURCE_INSTANCE] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return { state, p1Hand, p2HandA, p2HandB, p3Hand, p1DeckA, p1DeckB, p2DeckA, p2DeckB };
}

function openPlayerChoice(state: GameState) {
  const result = rules.dispatchAbilityCommand(state, 'p1', {
    type: 'activate_ability', cardInstanceId: SOURCE_INSTANCE, abilityId: ABILITY_ID,
  });
  expect(result.ok).toBe(true);
  const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
  expect(decision).toBeTruthy();
  return decision;
}

function selectPlayer(state: GameState, playerId = 'p2') {
  const first = openPlayerChoice(state);
  const result = rules.dispatchAbilityCommand(state, 'p1', {
    type: 'choose_target', decisionId: first.id, selectedIds: [playerId],
  });
  expect(result.ok).toBe(true);
  const second = rules.projectAbilityState(state, 'p1').pendingDecision!;
  expect(second).toBeTruthy();
  return second;
}

function cardOrder(state: GameState, ownerPlayerId: string, zone: string) {
  return state.cards.filter((card) => card.ownerPlayerId === ownerPlayerId && card.zone === zone).map((card) => card.instanceId);
}

function expectRejectedMutationFree(state: GameState, playerId: string, command: any, code?: string) {
  const before = structuredClone(state);
  const result = rules.dispatchAbilityCommand(state, playerId, command);
  expect(result.ok).toBe(false);
  if (code) expect(result.rejection?.code).toBe(code);
  expect(state).toEqual(before);
}

describe('P3-FB2-23 same-battlefield private hand return interaction', () => {
  it('classifies the exact shape structurally and fails closed for supported near-matches', () => {
    const ability = loadedAbility();
    expect(isSameBattlefieldPrivateHandReturnInteractionCandidate(ability)).toBe(true);
    expect(isSameBattlefieldPrivateHandReturnInteractionSemantic(ability)).toBe(true);

    const renamed = structuredClone(ability);
    renamed.id = 'renamed-private-hand-return';
    expect(isSameBattlefieldPrivateHandReturnInteractionSemantic(renamed)).toBe(true);

    const wrongConstraint = archive();
    (wrongConstraint.cards[0]!.abilities[0]!.targets[0]!.constraints[0] as any).type = 'at_battlefield';
    expect(rules.loadAuthoringJson(wrongConstraint).report).toContainEqual(expect.objectContaining({
      path: 'interaction.gateway', status: 'unsupported',
    }));

    const extraOpponentRestriction = archive();
    (extraOpponentRestriction.cards[0]!.abilities[0]!.targets[0]!.constraints as any[]).push({ type: 'not_controller' });
    expect(rules.loadAuthoringJson(extraOpponentRestriction).report).toContainEqual(expect.objectContaining({
      path: 'interaction.gateway', status: 'unsupported',
    }));
    const typoConstraint = archive();
    (typoConstraint.cards[0]!.abilities[0]!.targets[0]!.constraints[0] as any).type = 'same_battlefield_as_controller_x';
    expect(rules.loadAuthoringJson(typoConstraint).report).toContainEqual(expect.objectContaining({ status: 'unsupported' }));

    const alternateEffect = archive();
    (alternateEffect.cards[0]!.abilities[0]!.effects[0] as any).type = 'move_player';
    expect(rules.loadAuthoringJson(alternateEffect).report).toContainEqual(expect.objectContaining({
      path: 'interaction.gateway', status: 'unsupported',
    }));
  });

  it('fails closed for every R48 exact-envelope adversarial mutation while reserved vocabulary remains present', () => {
    const cases: Array<[string, (ability: any) => void]> = [
      ['wrong kind', (ability) => { ability.kind = 'passive'; }],
      ['wrong phase', (ability) => { ability.activation.phase = 'combat'; }],
      ['wrong opens', (ability) => { ability.activation.opens = 'controller_combat_action_window'; }],
      ['wrong target type', (ability) => { ability.targets[0].type = 'choice'; }],
      ['extra effect', (ability) => { ability.effects.push({ type: 'adjust_mana', amount: { const: 1 } }); }],
      ['extra player target', (ability) => {
        ability.targets.push({
          id: 'second_player', type: 'player', count: { min: 1, max: 1 },
          constraints: [{ type: 'same_battlefield_as_controller' }],
        });
      }],
      ['extra activation trigger key', (ability) => { ability.activation.trigger = 'controller_action_window'; }],
      ['extra response-window field', (ability) => { ability.responseWindow.priority = 'turn_order'; }],
      ['extra ability visibility', (ability) => { ability.visibility.revealTiming = 'on_use_declared'; }],
    ];

    for (const [label, mutate] of cases) {
      const normalized = structuredClone(loadedAbility()) as any;
      mutate(normalized);
      expect(isSameBattlefieldPrivateHandReturnInteractionCandidate(normalized), label).toBe(true);
      expect(isSameBattlefieldPrivateHandReturnInteractionSemantic(normalized), label).toBe(false);

      const raw = archive();
      mutate(raw.cards[0]!.abilities[0] as any);
      const loaded = rules.loadAuthoringJson(raw);
      expect(loaded.report, label).toContainEqual(expect.objectContaining({
        path: 'interaction.gateway', status: 'unsupported',
      }));
      expect(loaded.cards[SOURCE_DEFINITION]!.abilities[0]!.execution.mode, label).toBe('unsupported');
    }
  });
  it('offers exactly active players at the same battlefield and does not invent an opponent-only rule', () => {
    const { state } = setup();
    const decision = openPlayerChoice(state);
    expect(decision.candidates).toEqual(['p1', 'p2']);
    expect(decision.candidates).not.toContain('p3');
  });
  it('allows literal same-battlefield self selection instead of inventing a not-controller rule', () => {
    const { state, p1Hand } = setup();
    const first = openPlayerChoice(state);
    const selected = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: first.id, selectedIds: ['p1'],
    });
    expect(selected.ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p1').pendingDecision?.candidates).toEqual([p1Hand]);
  });

  it('projects the selected player hand only to the ability controller and excludes unselected hands', () => {
    const { state, p2HandA, p2HandB, p3Hand } = setup();
    const decision = selectPlayer(state, 'p2');
    expect(decision).toMatchObject({ candidates: [p2HandA, p2HandB], min: 0, max: 1, visibility: 'owner_only' });
    expect(decision.candidates).not.toContain(p3Hand);

    const controllerView = rules.projectAbilityState(state, 'p1');
    expect(controllerView.cards).toContainEqual(expect.objectContaining({ instanceId: p2HandA, definitionId: `fixture.${p2HandA}`, ownerPlayerId: 'p2', zone: 'hand' }));
    expect(controllerView.cards).toContainEqual(expect.objectContaining({ instanceId: p2HandB, definitionId: `fixture.${p2HandB}`, ownerPlayerId: 'p2', zone: 'hand' }));

    const observerView = rules.projectAbilityState(state, 'p3');
    expect(observerView.pendingDecision).toBeUndefined();
    expect(observerView.waitingLabel).toBeTruthy();
    expect(JSON.stringify(observerView)).not.toContain(p2HandA);
    expect(JSON.stringify(observerView)).not.toContain(p2HandB);
  });

  it('allows zero selection without card/deck/random mutation', () => {
    const { state } = setup();
    const decision = selectPlayer(state, 'p2');
    const cardsBefore = structuredClone(state.cards);
    const randomBefore = state.abilityRuntime!.randomState;
    const result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [],
    });
    expect(result.ok).toBe(true);
    expect(state.cards).toEqual(cardsBefore);
    expect(state.abilityRuntime!.randomState).toBe(randomBefore);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });

  it('returns one selected card to its owner deck and shuffles that owner deck, not the controller deck', () => {
    const { state, p2HandA } = setup();
    const decision = selectPlayer(state, 'p2');
    const controllerDeckBefore = cardOrder(state, 'p1', 'deck');
    const result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [p2HandA],
    });
    expect(result.ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === p2HandA)!.zone).toBe('deck');
    expect(cardOrder(state, 'p1', 'deck')).toEqual(controllerDeckBefore);
    expect(cardOrder(state, 'p2', 'deck')).toContain(p2HandA);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'deck_shuffled', playerId: 'p2' }));
  });

  it('keeps the private snapshot and projection safe across MatchSession serialize/restore', () => {
    const { state, p2HandA, p2HandB } = setup();
    selectPlayer(state, 'p2');
    const session = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2', 'p3'] });
    session.state = structuredClone(state);
    const restored = restoreMatchSession(session.serializeSession());

    const controller = restored.getClientProjection('p1').view;
    const observer = restored.getClientProjection('p3').view;
    expect(controller.pendingDecision?.candidates).toEqual([p2HandA, p2HandB]);
    expect(controller.cards).toContainEqual(expect.objectContaining({ instanceId: p2HandA, definitionId: `fixture.${p2HandA}` }));
    expect(JSON.stringify(observer)).not.toContain(p2HandA);
    expect(JSON.stringify(observer)).not.toContain(p2HandB);
  });

  it('rejects late-added or departed snapshot cards mutation-free', () => {
    const late = setup();
    const lateDecision = selectPlayer(late.state, 'p2');
    const lateCard = addCard(late.state, 'p2-hand-late', 'p2', 'hand');
    expectRejectedMutationFree(late.state, 'p1', { type: 'choose_target', decisionId: lateDecision.id, selectedIds: [lateCard] }, 'illegal_target');

    const departed = setup();
    const departedDecision = selectPlayer(departed.state, 'p2');
    departed.state.cards.find((card) => card.instanceId === departed.p2HandA)!.zone = 'discard';
    expectRejectedMutationFree(departed.state, 'p1', { type: 'choose_target', decisionId: departedDecision.id, selectedIds: [departed.p2HandA] }, 'resolution_failed');
  });

  it('rejects wrong controller, duplicate selection, wrong owner, changed battlefield and forged metadata mutation-free', () => {
    const wrongController = setup();
    const decision = selectPlayer(wrongController.state, 'p2');
    expectRejectedMutationFree(wrongController.state, 'p3', { type: 'choose_target', decisionId: decision.id, selectedIds: [] }, 'illegal_decision');
    expectRejectedMutationFree(wrongController.state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [wrongController.p2HandA, wrongController.p2HandA] }, 'illegal_target');

    const wrongOwner = setup();
    const ownerDecision = selectPlayer(wrongOwner.state, 'p2');
    wrongOwner.state.cards.find((card) => card.instanceId === wrongOwner.p2HandA)!.ownerPlayerId = 'p3';
    expectRejectedMutationFree(wrongOwner.state, 'p1', { type: 'choose_target', decisionId: ownerDecision.id, selectedIds: [wrongOwner.p2HandA] }, 'resolution_failed');

    const movedPlayer = setup();
    const movedDecision = selectPlayer(movedPlayer.state, 'p2');
    movedPlayer.state.players[1]!.locationId = 'shinto';
    expectRejectedMutationFree(movedPlayer.state, 'p1', { type: 'choose_target', decisionId: movedDecision.id, selectedIds: [] }, 'illegal_target');

    for (const mutate of [
      (state: GameState) => { (state.abilityRuntime!.pendingDecision!.interaction as any).continuationRef = 'forged'; },
      (state: GameState) => { (state.abilityRuntime!.pendingDecision!.interaction as any).createdRevision += 1; },
      (state: GameState) => { (state.abilityRuntime!.pendingDecision!.interaction as any).selectedPlayerId = 'p3'; },
    ]) {
      const forged = setup();
      const forgedDecision = selectPlayer(forged.state, 'p2');
      mutate(forged.state);
      expectRejectedMutationFree(forged.state, 'p1', { type: 'choose_target', decisionId: forgedDecision.id, selectedIds: [] }, 'resolution_failed');
    }
  });

  it('commits once and rejects terminal replay without another mutation', () => {
    const { state, p2HandA } = setup();
    const decision = selectPlayer(state, 'p2');
    const committed = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [p2HandA],
    });
    expect(committed.ok).toBe(true);
    expectRejectedMutationFree(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [p2HandA] }, 'illegal_decision');
  });
});
