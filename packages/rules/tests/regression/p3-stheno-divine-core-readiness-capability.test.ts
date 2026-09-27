import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { MatchSession, restoreMatchSession } from '../../src/match-session';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const OWNER = 'servant.fixture-divine-core';
const SOURCE = `${OWNER}.skill.core`;
const ABILITY = 'fixture.divine-core';
const LUCK = 'fixture.luck';
const P2_ATTACK = 'fixture.p2-attack';
const P2_ONCE = 'fixture.p2-once';
const P3_ATTACK = 'fixture.p3-attack';
const P2_DRAW = 'fixture.p2-draw';
const P3_DRAW = 'fixture.p3-draw';
const DRAW_ACTION = 'fixture.drawn.action';

function exactAbility() {
  return {
    id: ABILITY, kind: 'phase_action', printedClause: 'fixture',
    activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
    conditions: [], targets: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, limit: {}, visibility: {},
    effects: [{
      type: 'resolve_battle_luck_close_draw_immediate_play', discardAttribute: '幸运', maxClosePerOpponent: 1,
      excludePerGame: true, refund: 'effective_play_cost', drawCount: 1, playDrawnCard: 'optional_turn_order',
      immediatePlayQuota: 'effect', actionAbilityPermission: 'this_round',
    }],
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
    execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}
function archive(ability = exactAbility()) {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: OWNER, name: 'Fixture', class: 'Assassin',
    cards: [{
      id: SOURCE, name: 'Fixture Core', cardType: 'servant_skill', owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [ability],
      verification: { implementationStatus: 'complete' },
    }],
  } as any;
}
function simpleAbility(id: string, patch: any = {}) {
  return {
    id, kind: 'phase_action', printedClause: id,
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
    conditions: [], targets: [], effects: [{ type: 'adjust_mana', amount: 1 }], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
    responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] }, ...patch,
  } as any;
}
function definition(id: string, cost: number, attributes: string[] = ['力量'], abilities: any[] = []) {
  return {
    id, name: id, cardType: 'basic_attack', cardFace: { typeLabel: '攻击', attributes, cost, basePower: cost || 1 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities, mode: 'automatic',
  } as any;
}
function setup() {
  const loaded = rules.loadAuthoringJson(archive());
  expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.cards = [];
  state.round.activePhase = 'battle'; state.round.prioritySeat = 1;
  state.players[0]!.locationId = 'shinto'; state.players[1]!.locationId = 'shinto'; state.players[2]!.locationId = 'shinto'; state.players[3]!.locationId = 'recon';
  state.players[0]!.mana = 10; state.players[1]!.mana = 0; state.players[2]!.mana = 0;
  loaded.cards[LUCK] = definition(LUCK, 0, ['幸运']);
  loaded.cards[P2_ATTACK] = definition(P2_ATTACK, 2);
  loaded.cards[P3_ATTACK] = definition(P3_ATTACK, 3);
  loaded.cards[P2_ONCE] = definition(P2_ONCE, 5, ['力量'], [simpleAbility('fixture.once', { limit: { type: 'per_game', uses: 1, scope: 'this_card' } })]);
  loaded.cards[P2_DRAW] = definition(P2_DRAW, 1, ['魔术'], [simpleAbility(DRAW_ACTION)]);
  loaded.cards[P3_DRAW] = definition(P3_DRAW, 1);
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260928 });
  expect(rules.isAcceptedBattleLuckCloseDrawPlayAbility(state.abilityRuntime!.pack.cards[SOURCE]!.abilities[0]!),'compiled Divine Core shell').toBe(true);
  return state;
}
function add(state: GameState, definitionId: string, owner: string, zone: string, active = false) {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['attack_area','field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  if (active) state.abilityRuntime!.cardState[instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function sourceAndBoard(state: GameState, twoLuck = true) {
  const source = add(state, SOURCE, 'p1', 'field', true);
  const luckA = add(state, LUCK, 'p1', 'hand');
  const luckB = twoLuck ? add(state, LUCK, 'p1', 'hand') : undefined;
  const p2Attack = add(state, P2_ATTACK, 'p2', 'attack_area', true);
  const p2Once = add(state, P2_ONCE, 'p2', 'attack_area', true);
  const p3Attack = add(state, P3_ATTACK, 'p3', 'attack_area', true);
  const p2Draw = add(state, P2_DRAW, 'p2', 'deck');
  const p3Draw = add(state, P3_DRAW, 'p3', 'deck');
  return { source, luckA, luckB, p2Attack, p2Once, p3Attack, p2Draw, p3Draw };
}
function legal(state: GameState, playerId: string, source: string, abilityId: string) {
  return rules.getLegalActions(state, playerId).find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === abilityId);
}
function activate(state: GameState, source: string) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: ABILITY });
}
function choose(state: GameState, playerId: string, selectedIds: string[]) {
  const d = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: d.id, selectedIds });
}
function sessionFor(state: GameState) {
  const session = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1','p2','p3'], restorePackKind: 'trusted_authoring_fixture' }, false);
  session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
  return session;
}

describe('P3 Stheno Divine Core readiness capability', () => {
  it('accepts only the exact whole-ability privileged shell', () => {
    expect(rules.loadAuthoringJson(archive()).report.some((entry) => entry.status === 'unsupported')).toBe(false);
    const mutations = [
      (a: any) => { a.effects[0].maxClosePerOpponent = 2; },
      (a: any) => { a.effects[0].excludePerGame = false; },
      (a: any) => { a.effects[0].refund = 'printed_cost'; },
      (a: any) => { a.effects[0].drawCount = 2; },
      (a: any) => { a.effects[0].playDrawnCard = 'optional'; },
      (a: any) => { a.effects[0].extra = true; },
      (a: any) => { a.conditions.push({ type: 'can_adjust_mana' }); },
    ];
    for (const mutate of mutations) {
      const ability = structuredClone(exactAbility()); mutate(ability);
      expect(rules.loadAuthoringJson(archive(ability)).report.some((entry) => entry.status === 'unsupported')).toBe(true);
    }
  });

  it('requires an active battlefield source, an owned Luck card, and at least one engaged opponent', () => {
    const state = setup(); const { source, luckA } = sourceAndBoard(state, false);
    expect(legal(state, 'p1', source, ABILITY)).toBeTruthy();
    state.cards.find((card) => card.instanceId === luckA)!.zone = 'discard';
    expect(legal(state, 'p1', source, ABILITY)).toBeFalsy();
    state.cards.find((card) => card.instanceId === luckA)!.zone = 'hand';
    state.players[1]!.locationId = 'recon'; state.players[2]!.locationId = 'recon';
    expect(legal(state, 'p1', source, ABILITY)).toBeFalsy();
  });

  it('resolves multi-Luck, opponent turn order, per-game exclusion, refund/draw, skip, exact drawn play, and combat action permission', () => {
    const state = setup(); const b = sourceAndBoard(state, true);
    expect(activate(state, b.source).ok).toBe(true);
    let d = state.abilityRuntime!.pendingDecision!;
    expect(d.interaction?.kind).toBe('battle_luck_discard_choice_v1');
    expect(d.candidates).toEqual([b.luckA, b.luckB].sort());
    expect(choose(state, 'p1', [b.luckB!]).ok).toBe(true);
    expect(state.cards.find((c) => c.instanceId === b.luckB)!.zone).toBe('discard');

    d = state.abilityRuntime!.pendingDecision!;
    expect(d.interaction).toMatchObject({ kind: 'battle_opponent_close_reward_choice_v1', opponentId: 'p2' });
    expect(d.candidates).toEqual([b.p2Attack]);
    expect(d.candidates).not.toContain(b.p2Once);
    expect(choose(state, 'p1', [b.p2Attack]).ok).toBe(true);
    expect(state.players[1]!.mana).toBe(2);
    expect(state.cards.find((c) => c.instanceId === b.p2Draw)!.zone).toBe('hand');
    expect(state.abilityRuntime!.cardState[b.p2Attack]!.active).toBe(false);

    d = state.abilityRuntime!.pendingDecision!;
    expect(d.interaction).toMatchObject({ kind: 'battle_opponent_close_reward_choice_v1', opponentId: 'p3' });
    expect(choose(state, 'p1', []).ok).toBe(true);
    expect(state.cards.find((c) => c.instanceId === b.p3Draw)!.zone).toBe('deck');

    d = state.abilityRuntime!.pendingDecision!;
    expect(d.controllerId).toBe('p2');
    expect(d.interaction).toMatchObject({ kind: 'battle_drawn_card_optional_play_v1', playerId: 'p2', drawnCardId: b.p2Draw });
    expect(choose(state, 'p2', [b.p2Draw]).ok).toBe(true);
    expect(state.players[1]!.mana).toBe(1);
    expect(state.cards.find((c) => c.instanceId === b.p2Draw)!.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[b.p2Draw]!.actionAbilityAllowedInCombatRound).toBe(state.round.roundNumber);
    expect(state.abilityRuntime!.battleCloseDrawImmediatePlayHistory).toHaveLength(1);
    expect(state.abilityRuntime!.pendingBattleCloseDrawPlayTransaction).toBeUndefined();
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();

    state.round.prioritySeat = 2;
    expect(legal(state, 'p2', b.p2Draw, DRAW_ACTION)).toBeTruthy();
    state.round.roundNumber += 1;
    expect(legal(state, 'p2', b.p2Draw, DRAW_ACTION)).toBeFalsy();
  });

  it('auto-discards the only Luck card and permits skipping every closable opponent', () => {
    const state = setup(); const b = sourceAndBoard(state, false);
    expect(activate(state, b.source).ok).toBe(true);
    expect(state.cards.find((c) => c.instanceId === b.luckA)!.zone).toBe('discard');
    expect(state.abilityRuntime!.pendingDecision!.interaction).toMatchObject({ kind: 'battle_opponent_close_reward_choice_v1', opponentId: 'p2' });
    expect(choose(state, 'p1', []).ok).toBe(true);
    expect(choose(state, 'p1', []).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.abilityRuntime!.pendingBattleCloseDrawPlayTransaction).toBeUndefined();
    expect(state.players[1]!.mana).toBe(0); expect(state.players[2]!.mana).toBe(0);
  });

  it('round-trips a mid-transaction private close choice and rejects widened host-signed interaction metadata', () => {
    const state = setup(); const b = sourceAndBoard(state, true);
    expect(activate(state, b.source).ok).toBe(true); expect(choose(state, 'p1', [b.luckA]).ok).toBe(true);
    const restored = restoreMatchSession(sessionFor(state).serializeSession(), { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.pendingDecision).toEqual(state.abilityRuntime!.pendingDecision);
    expect(restored.state.abilityRuntime!.pendingBattleCloseDrawPlayTransaction).toEqual(state.abilityRuntime!.pendingBattleCloseDrawPlayTransaction);

    const corrupt = structuredClone(state);
    (corrupt.abilityRuntime!.pendingDecision!.interaction as any).extra = 'forged';
    expect(() => restoreMatchSession(sessionFor(corrupt).serializeSession(), { restorePackKind: 'trusted_authoring_fixture' })).toThrow(/Invalid MatchSession state container/);
  });

  it('rejects host-signed forged combat-action permission without exact immediate-play provenance', () => {
    const state = setup(); const b = sourceAndBoard(state, false);
    state.abilityRuntime!.cardState[b.p2Attack]!.actionAbilityAllowedInCombatRound = state.round.roundNumber;
    expect(() => restoreMatchSession(sessionFor(state).serializeSession(), { restorePackKind: 'trusted_authoring_fixture' })).toThrow(/Invalid MatchSession state container/);
  });

  it('round-trips completed exact immediate-play provenance and rejects a mismatched provenance source', () => {
    const state = setup(); const b = sourceAndBoard(state, false);
    expect(activate(state, b.source).ok).toBe(true);
    expect(choose(state, 'p1', [b.p2Attack]).ok).toBe(true);
    expect(choose(state, 'p1', []).ok).toBe(true);
    expect(choose(state, 'p2', [b.p2Draw]).ok).toBe(true);
    const restored = restoreMatchSession(sessionFor(state).serializeSession(), { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.cardState[b.p2Draw]!.actionAbilityAllowedInCombatRound).toBe(state.round.roundNumber);

    const corrupt = structuredClone(state);
    corrupt.abilityRuntime!.battleCloseDrawImmediatePlayHistory![0]!.sourceCardId = b.p2Attack;
    expect(() => restoreMatchSession(sessionFor(corrupt).serializeSession(), { restorePackKind: 'trusted_authoring_fixture' })).toThrow(/Invalid MatchSession state container/);
  });

  it('rejects compiled-pack widening transactionally before Luck discard or decision staging', () => {
    const state = setup(); const b = sourceAndBoard(state, true);
    const ability = state.abilityRuntime!.pack.cards[SOURCE]!.abilities.find((entry) => entry.id === ABILITY)!;
    (ability.effects[0] as any).drawCount = 2;
    const before = structuredClone(state);
    expect(activate(state, b.source).ok).toBe(false);
    expect(state).toEqual(before);
  });
});