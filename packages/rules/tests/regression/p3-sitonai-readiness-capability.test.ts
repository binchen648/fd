import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import { dispatchAbilityCommand, getLegalActions, initializeAbilityRuntime, resolveEffect } from '../../src/ability/interpreter';
import { executeResolution } from '../../src/ability/resolution-dataflow';
import {
  controllerHasExactDistinctActiveAttackAttributePair,
  isManaGainSuppressed,
  isNormalCardDrawSuppressed,
} from '../../src/ability/timed-resource-suppression';
import { drawCard } from '../../src/core/card-play';
import { grantMana } from '../../src/core/rule-overrides';
import { createMatchSession, restoreMatchSession } from '../../src/match-session';
import type { AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-timed-suppression';
const PAIR = `${ROOT}.skill.pair`;
const BLOCK = `${ROOT}.skill.block`;
const DRAW = `${ROOT}.skill.draw`;

function baseAbility(id: string, kind = 'phase_action') {
  return {
    id, kind, printedClause: id,
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
    conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}

function archive() {
  const pair = baseAbility('fixture.exact-pair');
  pair.conditions = [{ type: 'controller_active_attacks_exact_distinct_attribute_pair', firstAttribute: '力量', secondAttribute: '魔术', distinctCards: true }];
  const drawBlock = baseAbility('fixture.draw-block');
  drawBlock.conditions = [{ type: 'source_reversed', negated: true }];
  drawBlock.effects = [{ type: 'suppress_all_active_players_resource_through_round', resource: 'normal_card_draw', roundsAfterCurrent: 1 }];
  const manaBlock = baseAbility('fixture.mana-block');
  manaBlock.conditions = [{ type: 'source_reversed' }];
  manaBlock.effects = [{ type: 'suppress_all_active_players_resource_through_round', resource: 'mana_gain', roundsAfterCurrent: 1 }];
  const draw = baseAbility('fixture.draw-one');
  draw.effects = [{ type: 'draw_cards', count: 1 }];
  const card = (id: string, abilities: any[]) => ({
    id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
    cardFace: { attributes: ['特殊'], cost: 0, basePower: 1 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities,
    verification: { implementationStatus: 'complete' },
  });
  return { schemaVersion: 'fd-card-authoring-v1', id: ROOT, cards: [card(PAIR, [pair]), card(BLOCK, [drawBlock, manaBlock]), card(DRAW, [draw])] } as any;
}

function setup() {
  const pack = loadAuthoringJson(archive());
  const state = createSeededGameState(); state.cards = [];
  state.players[0]!.servantCardId = ROOT; state.players[0]!.mana = 10; state.players[0]!.locationId = 'shinto';
  initializeAbilityRuntime(state, pack, { seed: 20260927 });
  state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  return { state, pack };
}
function add(state: GameState, definitionId: string, zone = 'skill', active = false, owner = 'p1') {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone, visibility: ['attack_area','field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return state.cards[state.cards.length - 1]!;
}
function addAttack(state: GameState, id: string, attributes: string[]) {
  const def: AuthoringCard = { id, name: id, cardType: 'basic_attack', cardFace: { attributes, cost: 0, basePower: 2 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
  state.abilityRuntime!.pack.cards[id] = def;
  return add(state, id, 'attack_area', true);
}
function pairCondition() { return { type: 'controller_active_attacks_exact_distinct_attribute_pair', firstAttribute: '力量', secondAttribute: '魔术', distinctCards: true }; }

describe('P3 bounded attack-pair and timed resource-suppression capability', () => {
  it('accepts only exact generic condition/effect shells and fails closed on widened or wrong-shell near matches', () => {
    expect(loadAuthoringJson(archive()).report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const mutations = [
      (raw: any) => { raw.cards[0].abilities[0].conditions[0].extra = true; },
      (raw: any) => { raw.cards[1].abilities[0].effects[0].extra = true; },
      (raw: any) => { raw.cards[1].abilities[0].kind = 'forced_trigger'; raw.cards[1].abilities[0].activation = { trigger: 'round_start' }; },
      (raw: any) => { raw.cards[1].abilities[1].conditions = [{ type: 'controller_mana_at_least', value: 0 }]; },
      (raw: any) => {
        raw.cards[1].abilities[0].effects = [{
          type: 'branch',
          branches: [{
            if: { type: 'can_adjust_mana', player: 'controller', amount: 1 },
            then: [{ type: 'suppress_all_active_players_resource_through_round', resource: 'normal_card_draw', roundsAfterCurrent: 1 }],
          }],
        }];
      },
    ];
    for (const mutate of mutations) {
      const raw = archive(); mutate(raw); const loaded = loadAuthoringJson(raw);
      expect(loaded.report.some((entry) => entry.status === 'unsupported')).toBe(true);
    }
  });

  it('requires exactly one carrier of each requested active attack attribute and two distinct physical cards', () => {
    const one = setup(); addAttack(one.state, 'basic.strength', ['力量']); addAttack(one.state, 'basic.magic', ['魔术']);
    expect(controllerHasExactDistinctActiveAttackAttributePair(one.state, 'p1', pairCondition())).toBe(true);
    const extra = addAttack(one.state, 'basic.extra-strength', ['力量']);
    expect(controllerHasExactDistinctActiveAttackAttributePair(one.state, 'p1', pairCondition())).toBe(false);
    one.state.abilityRuntime!.cardState[extra.instanceId]!.active = false;
    const neutral = addAttack(one.state, 'basic.neutral', ['特殊']);
    expect(controllerHasExactDistinctActiveAttackAttributePair(one.state, 'p1', pairCondition())).toBe(true);
    one.state.abilityRuntime!.cardState[neutral.instanceId]!.active = false;

    const dual = setup(); addAttack(dual.state, 'basic.dual', ['力量','魔术']);
    expect(controllerHasExactDistinctActiveAttackAttributePair(dual.state, 'p1', pairCondition())).toBe(false);
  });

  it('branches the exact global through-next-round suppression from physical reversal state and expires after that round', () => {
    const normal = setup(); const normalSource = add(normal.state, BLOCK, 'attack_area', true);
    expect(getLegalActions(normal.state, 'p1')).toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: normalSource.instanceId, abilityId: 'fixture.draw-block' }));
    expect(getLegalActions(normal.state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.abilityId === 'fixture.mana-block')).toBe(false);
    expect(dispatchAbilityCommand(normal.state, 'p1', { type: 'activate_ability', cardInstanceId: normalSource.instanceId, abilityId: 'fixture.draw-block' }).ok).toBe(true);
    for (const player of normal.state.players.filter((entry) => entry.status === 'active')) expect(isNormalCardDrawSuppressed(normal.state, player.id)).toBe(true);
    normal.state.round.roundNumber = 2; expect(isNormalCardDrawSuppressed(normal.state, 'p1')).toBe(true);
    normal.state.round.roundNumber = 3; expect(isNormalCardDrawSuppressed(normal.state, 'p1')).toBe(false);

    const reversed = setup(); const reversedSource = add(reversed.state, BLOCK, 'attack_area', true);
    reversed.state.abilityRuntime!.cardState[reversedSource.instanceId]!.reversed = true;
    expect(getLegalActions(reversed.state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.abilityId === 'fixture.draw-block')).toBe(false);
    expect(dispatchAbilityCommand(reversed.state, 'p1', { type: 'activate_ability', cardInstanceId: reversedSource.instanceId, abilityId: 'fixture.mana-block' }).ok).toBe(true);
    expect(isManaGainSuppressed(reversed.state, 'p1')).toBe(true);
    reversed.state.players[0]!.mana = 0;
    expect(grantMana(reversed.state, 'p1', 4).actualAmount).toBe(0);
    reversed.state.round.roundNumber = 2; expect(grantMana(reversed.state, 'p1', 4).actualAmount).toBe(0);
    reversed.state.round.roundNumber = 3; expect(grantMana(reversed.state, 'p1', 4).actualAmount).toBe(4);
  });

  it('blocks ordinary draw boundaries in interpreter, typed dataflow and core card draw without consuming deck cards', () => {
    const { state } = setup(); const blocker = add(state, BLOCK, 'attack_area', true); const drawSource = add(state, DRAW, 'attack_area', true);
    const deck = addAttack(state, 'basic.deck-card', ['力量']); deck.zone = 'deck'; deck.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' }; state.abilityRuntime!.cardState[deck.instanceId]!.active = false;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: blocker.instanceId, abilityId: 'fixture.draw-block' }).ok).toBe(true);
    const before = state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'deck').length;
    state.round.prioritySeat = 1;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: drawSource.instanceId, abilityId: 'fixture.draw-one' }).ok).toBe(true);
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'deck')).toHaveLength(before);
    expect(drawCard(state, 'p1').playedCardIds).toEqual([]);

    const typed = executeResolution({ state, controllerId: 'p1', sourceCardId: drawSource.instanceId, abilityId: 'fixture.typed-draw', resolutionId: 'fixture.typed-draw', effects: [{ id: 'draw', type: 'draw_cards', player: 'controller', count: 1 }] });
    expect(typed.results[0]).toMatchObject({ effectType: 'draw_cards', status: 'no_op', payload: { actualCount: 0, movedCardIds: [] } });
  });

  it('still rejects malformed draw counts while ordinary draw suppression is active', () => {
    const { state } = setup();
    const blocker = add(state, BLOCK, 'attack_area', true);
    const drawSource = add(state, DRAW, 'attack_area', true);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: blocker.instanceId, abilityId: 'fixture.draw-block' }).ok).toBe(true);
    const ability = state.abilityRuntime!.pack.cards[DRAW]!.abilities.find((entry) => entry.id === 'fixture.draw-one')!;
    ability.effects[0]!.count = -1;
    expect(() => resolveEffect(state, { sourceCardId: drawSource.instanceId, abilityId: ability.id, controllerId: 'p1', variables: {}, selections: {} }, ability.effects[0]!)).toThrow('Invalid draw count');
  });

  it('applies draw suppression to the real MatchSession round-start draw and authenticates the timed maps on restore', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const state = session.state; const runtime = state.abilityRuntime!;
    runtime.normalCardDrawBlockedThroughRoundByPlayer = { p1: 2 };
    const oneHand = state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'hand').slice(1);
    for (const card of oneHand) { card.zone = 'discard'; card.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' }; }
    const before = state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'hand').length;
    (session as unknown as { startRound: (round: number) => void }).startRound(2);
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'hand')).toHaveLength(before);
    const durable = session.serializeSession();
    expect(restoreMatchSession(durable).state.abilityRuntime?.normalCardDrawBlockedThroughRoundByPlayer).toEqual({ p1: 2 });
    const forged: any = structuredClone(durable); forged.state.abilityRuntime.normalCardDrawBlockedThroughRoundByPlayer = { forged_player: 99 };
    expect(() => restoreMatchSession(forged)).toThrow('Invalid MatchSession state container');
    (session as unknown as { startRound: (round: number) => void }).startRound(3);
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'hand')).toHaveLength(3);
  });

  it('rechecks the timed suppression whole-ability semantic at runtime after compiled pack corruption', () => {
    const { state } = setup(); const source = add(state, BLOCK, 'attack_area', true);
    const ability = state.abilityRuntime!.pack.cards[BLOCK]!.abilities.find((entry) => entry.id === 'fixture.draw-block')!;
    ability.conditions = [{ type: 'controller_mana_at_least', value: 0 }];
    expect(() => resolveEffect(state, { sourceCardId: source.instanceId, abilityId: ability.id, controllerId: 'p1', variables: {}, selections: {} }, ability.effects[0]!)).toThrow('Unsupported timed global resource suppression semantic');
  });
});
