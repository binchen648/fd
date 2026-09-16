import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const SOURCE_DEF = 'fixture.alter-ego-source';
const SOURCE_ID = 'fixture-alter-ego-source';
const TARGET_DEF = 'fixture.alter-target';
const TARGET_ID = 'fixture-alter-target';
const REVERSE_DEF = 'fixture.reverse-target';
const REVERSE_ID = 'fixture-reverse-target';
const PROBE_DEF = 'fixture.attribute-probe';
const PROBE_ID = 'fixture-attribute-probe';
const ABILITY_ID = 'renamed.alter-ego-transform';

function ability(variant: 'regular' | 'ex'): Record<string, unknown> {
  return {
    id: ABILITY_ID,
    kind: 'optional_trigger',
    printedClause: variant === 'ex' ? 'synthetic alter ego ex' : 'synthetic alter ego',
    activation: { phase: 'action', trigger: 'on_card_played', requiresSourceState: 'active' },
    responseWindow: { opens: 'on_card_played' },
    conditions: [], targets: [], creates: [], ruleModifiers: [], lifecycle: {}, visibility: {},
    cost: variant === 'ex' ? [{ type: 'pay_mana', player: 'controller', amount: 3 }] : [],
    effects: variant === 'ex'
      ? [{ type: 'transform_event_source_card' }]
      : [{ type: 'transform_event_source_card' }, { type: 'close_source_card' }],
    limit: variant === 'ex' ? { type: 'per_round', uses: 1, scope: 'this_card' } : {},
    execution: { mode: 'automatic' },
  };
}

function archive(variant: 'regular' | 'ex') {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    id: 'fixture.alter-owner', name: 'Alter Owner', class: 'Alter Ego',
    cards: [
      {
        id: SOURCE_DEF, name: 'Alter Ego', cardType: 'servant_skill',
        cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: 2, basePower: 3 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [ability(variant)],
      },
      {
        id: TARGET_DEF, name: 'Mutable Target', cardType: 'servant_deck_card',
        cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: 0, basePower: 4 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [{
          id: 'target.cleanup', kind: 'phase_action', printedClause: 'cleanup probe',
          activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
          conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          effects: [{ type: 'move_card', target: 'this_card', to: { zone: 'discard' } }], execution: { mode: 'automatic' },
        }],
      },
      {
        id: REVERSE_DEF, name: 'Reverse Target', cardType: 'servant_deck_card',
        cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: 0, basePower: 4, hasReversalEffect: true, revealsTrueNameOnReverse: true },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [{
          id: 'reverse.observable', kind: 'phase_action', printedClause: 'reverse observer',
          activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
          conditions: [{ type: 'source_reversed' }], targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          effects: [{ type: 'noop' }], execution: { mode: 'automatic' },
        }],
      },
      {
        id: PROBE_DEF, name: 'Attribute Probe', cardType: 'master_skill',
        cardFace: { typeLabel: '特殊', attributes: [], cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [{
          id: 'probe.force-target', kind: 'phase_action', printedClause: 'probe effective force',
          activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
          conditions: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          targets: [{ id: 'force_card', type: 'card_instance', scope: { zone: 'attack_area', owner: 'controller' }, count: { min: 1, max: 1 }, constraints: [{ type: 'has_attribute', attribute: '力量' }] }],
          effects: [{ type: 'move_card', target: 'force_card', to: { zone: 'discard' } }], execution: { mode: 'automatic' },
        }],
      },
    ],
  };
}

function setup(variant: 'regular' | 'ex' = 'regular', target: 'mutable' | 'reverse' = 'mutable', mana = 10): GameState {
  const pack = rules.loadAuthoringJson(archive(variant));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.mana = mana;
  state.players[0]!.servantCardId = 'fixture.alter-owner';
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
  addActive(state, SOURCE_ID, SOURCE_DEF, 'attack_area');
  addActive(state, PROBE_ID, PROBE_DEF, 'field');
  addActive(state, target === 'reverse' ? REVERSE_ID : TARGET_ID, target === 'reverse' ? REVERSE_DEF : TARGET_DEF, 'attack_area');
  return state;
}

function addActive(state: GameState, instanceId: string, definitionId: string, zone: 'attack_area' | 'field') {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone, visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState[instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
}

function playEvent(state: GameState, targetId = TARGET_ID, options: { playerId?: string; faceDown?: boolean; id?: string } = {}) {
  return {
    id: options.id ?? `play-${targetId}-${state.abilityRuntime!.revision}`,
    type: 'on_card_played' as const,
    playerId: options.playerId ?? 'p1',
    sourceCardId: targetId,
    playedCards: [{
      instanceId: targetId,
      controllerId: options.playerId ?? 'p1',
      cardType: state.abilityRuntime!.pack.cards[state.cards.find((card) => card.instanceId === targetId)!.definitionId]!.cardType,
      faceDown: options.faceDown ?? false,
    }],
  };
}

function response(state: GameState) {
  return rules.getLegalActions(state, 'p1').find((action) => action.type === 'resolve_response' && action.cardInstanceId === SOURCE_ID && action.abilityId === ABILITY_ID);
}

function choose(state: GameState, selectedIds: string[]) {
  const action = rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'choose_target');
  expect(action).toBeDefined();
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: action!.decisionId, selectedIds });
}

function compiled(variant: 'regular' | 'ex'): AuthoringAbility {
  const pack = rules.loadAuthoringJson(archive(variant));
  expect(pack.report).toEqual([]);
  return pack.cards[SOURCE_DEF]!.abilities[0]!;
}

describe('P3-FB2-13 identity-free Alter Ego transform runtime', () => {
  it('accepts only the exact regular/EX structural variants and fails closed on near matches', () => {
    const regular = compiled('regular');
    const ex = compiled('ex');
    regular.id = 'renamed.regular';
    ex.id = 'renamed.ex';
    expect(rules.classifyAlterEgoTransformVariant(regular)).toBe('regular');
    expect(rules.classifyAlterEgoTransformVariant(ex)).toBe('ex');
    expect(rules.isAlterEgoTransformSemantic(regular)).toBe(true);
    expect(rules.isAlterEgoTransformSemantic(ex)).toBe(true);

    const mutations: Array<(a: AuthoringAbility) => void> = [
      (a) => { a.activation.phase = 'combat'; },
      (a) => { a.activation.trigger = 'after_battle_ended'; },
      (a) => { a.activation.requiresSourceState = 'inactive'; },
      (a) => { a.responseWindow.opens = 'post_power_response'; },
      (a) => { a.targets.push({ id: 'client-card', type: 'card_instance' }); },
      (a) => { a.creates.push({ type: 'create_card', cardId: 'x', to: { zone: 'hand' } }); },
      (a) => { a.effects.push({ type: 'noop' }); },
    ];
    for (const mutate of mutations) {
      const candidate = structuredClone(regular); mutate(candidate);
      expect(rules.isAlterEgoTransformSemantic(candidate)).toBe(false);
    }
    const regularCost = structuredClone(regular); regularCost.cost = [{ type: 'pay_mana', player: 'controller', amount: 3 }];
    expect(rules.isAlterEgoTransformSemantic(regularCost)).toBe(false);
    const missingClose = structuredClone(regular); missingClose.effects = [missingClose.effects[0]!];
    expect(rules.isAlterEgoTransformSemantic(missingClose)).toBe(false);
    const wrongExCost = structuredClone(ex); wrongExCost.cost[0]!.amount = 2;
    expect(rules.isAlterEgoTransformSemantic(wrongExCost)).toBe(false);
    const exCloses = structuredClone(ex); exCloses.effects.push({ type: 'close_source_card' });
    expect(rules.isAlterEgoTransformSemantic(exCloses)).toBe(false);
  });

  it('binds the trusted just-played face-up own attack card and stages attributes without early mutation/close', () => {
    const state = setup();
    rules.processAbilityEvent(state, playEvent(state));
    expect(response(state)).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', response(state)!).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ candidates: ['力量', '迅捷', '魔术'], min: 0, max: 3 });
    expect(state.cards.find((card) => card.instanceId === SOURCE_ID)!.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[TARGET_ID]!.attributeOverrides).toBeUndefined();

    expect(choose(state, ['力量', '魔术']).ok).toBe(true);
    expect(state.abilityRuntime!.cardState[TARGET_ID]).toMatchObject({ attributeOverrides: ['力量', '魔术'] });
    expect(state.cards.find((card) => card.instanceId === SOURCE_ID)!.zone).toBe('skill');
    expect(state.abilityRuntime!.cardState[SOURCE_ID]!.active).toBe(false);
    expect(rules.getEffectiveCardAttributes(state, TARGET_ID)).toEqual(['力量', '魔术']);
  });

  it('allows the empty replacement subset and exposes effective attributes to target constraints and combat tags', () => {
    const state = setup();
    rules.processAbilityEvent(state, playEvent(state));
    rules.dispatchAbilityCommand(state, 'p1', response(state)!);
    expect(choose(state, []).ok).toBe(true);
    expect(rules.getEffectiveCardAttributes(state, TARGET_ID)).toEqual([]);

    const second = setup();
    rules.processAbilityEvent(second, playEvent(second));
    rules.dispatchAbilityCommand(second, 'p1', response(second)!);
    expect(choose(second, ['力量']).ok).toBe(true);
    const probeAction = rules.getLegalActions(second, 'p1').find((a) => a.type === 'activate_ability' && a.cardInstanceId === PROBE_ID);
    expect(probeAction).toBeDefined();
    expect(rules.dispatchAbilityCommand(second, 'p1', probeAction!).ok).toBe(true);
    expect(second.abilityRuntime!.pendingDecision?.candidates).toContain(TARGET_ID);
    // Do not resolve the probe: inspect battle participant derivation on a clean clone without the pending decision.
    const battleState = structuredClone(second); delete battleState.abilityRuntime!.pendingDecision;
    expect(rules.deriveBattleParticipantsFromState(battleState, 'shinto').find((p) => p.playerId === 'p1')!.attackTags).toContain('力量');
    expect(rules.deriveBattleParticipantsFromState(battleState, 'shinto').find((p) => p.playerId === 'p1')!.attackTags).not.toContain('特殊');
  });

  it('reverses authored reversal targets directly, reveals true name, and makes source_reversed observable', () => {
    const state = setup('regular', 'reverse');
    rules.processAbilityEvent(state, playEvent(state, REVERSE_ID));
    expect(response(state)).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', response(state)!).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.abilityRuntime!.cardState[REVERSE_ID]).toMatchObject({ reversed: true });
    expect(state.abilityRuntime!.cardState[REVERSE_ID]!.attributeOverrides).toBeUndefined();
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(rules.getLegalActions(state, 'p1')).toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: REVERSE_ID, abilityId: 'reverse.observable' }));
    expect(rules.projectAbilityState(state, 'p1').cards.find((card) => card.instanceId === REVERSE_ID)).toMatchObject({ reversed: true });
  });

  it('EX defers payment/use until attribute choice, then pays exactly 3, stays active, and is once per round', () => {
    const state = setup('ex', 'mutable', 7);
    rules.processAbilityEvent(state, playEvent(state));
    expect(response(state)).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', response(state)!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(7);
    expect(state.cards.find((card) => card.instanceId === SOURCE_ID)!.zone).toBe('attack_area');
    expect(Object.keys(state.abilityRuntime!.abilityUsage)).toHaveLength(0);
    expect(choose(state, ['迅捷']).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4);
    expect(state.abilityRuntime!.cardState[TARGET_ID]!.attributeOverrides).toEqual(['迅捷']);
    expect(rules.getEffectiveCardAttributes(state, TARGET_ID)).toEqual(['迅捷']);
    expect(state.cards.find((card) => card.instanceId === SOURCE_ID)!.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[SOURCE_ID]!.active).toBe(true);
    expect(Object.values(state.abilityRuntime!.abilityUsage)).toContain(1);

    addActive(state, 'fixture-second-target', TARGET_DEF, 'attack_area');
    rules.processAbilityEvent(state, playEvent(state, 'fixture-second-target', { id: 'second-play' }));
    expect(response(state)).toBeUndefined();
  });

  it('decline and insufficient EX mana consume nothing, and invalid event provenance never opens', () => {
    const decline = setup();
    rules.processAbilityEvent(decline, playEvent(decline));
    const pass = rules.getLegalActions(decline, 'p1').find((a) => a.type === 'decline_this_window')!;
    expect(rules.dispatchAbilityCommand(decline, 'p1', pass).ok).toBe(true);
    expect(decline.cards.find((card) => card.instanceId === SOURCE_ID)!.zone).toBe('attack_area');
    expect(decline.abilityRuntime!.cardState[TARGET_ID]!.attributeOverrides).toBeUndefined();

    const low = setup('ex', 'mutable', 2);
    rules.processAbilityEvent(low, playEvent(low));
    expect(response(low)).toBeUndefined();
    expect(low.players[0]!.mana).toBe(2);

    const wrongPlayer = setup();
    rules.processAbilityEvent(wrongPlayer, playEvent(wrongPlayer, TARGET_ID, { playerId: 'p2' }));
    expect(response(wrongPlayer)).toBeUndefined();
    const faceDown = setup();
    rules.processAbilityEvent(faceDown, playEvent(faceDown, TARGET_ID, { faceDown: true }));
    expect(response(faceDown)).toBeUndefined();
    const stale = setup();
    stale.abilityRuntime!.cardState[TARGET_ID]!.playedRound--;
    rules.processAbilityEvent(stale, playEvent(stale));
    expect(response(stale)).toBeUndefined();
  });

  it('revalidates pending interaction atomically and clears transform state when the card leaves the board', () => {
    const state = setup('ex', 'mutable', 6);
    rules.processAbilityEvent(state, playEvent(state));
    rules.dispatchAbilityCommand(state, 'p1', response(state)!);
    const decision = rules.getLegalActions(state, 'p1').find((a) => a.type === 'choose_target')!;
    state.cards.find((card) => card.instanceId === TARGET_ID)!.zone = 'discard';
    const rejected = rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.decisionId, selectedIds: ['力量'] });
    expect(rejected.ok).toBe(false);
    expect(state.players[0]!.mana).toBe(6);
    expect(Object.keys(state.abilityRuntime!.abilityUsage)).toHaveLength(0);

    const cleanup = setup();
    rules.processAbilityEvent(cleanup, playEvent(cleanup));
    rules.dispatchAbilityCommand(cleanup, 'p1', response(cleanup)!);
    choose(cleanup, ['力量']);
    // Re-open source only so the generic probe can act; target transform remains live until the move resolves.
    const probeAction = rules.getLegalActions(cleanup, 'p1').find((a) => a.type === 'activate_ability' && a.cardInstanceId === PROBE_ID)!;
    rules.dispatchAbilityCommand(cleanup, 'p1', probeAction);
    const targetChoice = rules.getLegalActions(cleanup, 'p1').find((a) => a.type === 'choose_target')!;
    expect(rules.dispatchAbilityCommand(cleanup, 'p1', { type: 'choose_target', decisionId: targetChoice.decisionId, selectedIds: [TARGET_ID] }).ok).toBe(true);
    expect(cleanup.cards.find((card) => card.instanceId === TARGET_ID)!.zone).toBe('discard');
    expect(cleanup.abilityRuntime!.cardState[TARGET_ID]!.attributeOverrides).toBeUndefined();
    expect(cleanup.abilityRuntime!.cardState[TARGET_ID]!.reversed).toBeUndefined();
  });
});
