import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const CARD = 'fixture.outer-god-life';
const ABILITY = 'outer-life-use';
const SERVANT = 'servant.fixture.outer-owner';

function ability() {
  return {
    id: ABILITY, kind: 'phase_action', printedClause: 'fixture',
    activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
    conditions: [], targets: [],
    effects: [
      { type: 'adjust_round_total_power', recipients: ['controller', 'source_servant_owner'], amount: 6, dedupe: true },
      { type: 'schedule_source_card_return', recipient: 'source_servant_owner' },
    ],
    cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', hostOps: [] },
  };
}
function archive(abilityValue: any = ability(), category: string = 'outer_god_life') {
  return { schemaVersion: 'fd-card-authoring-v1', id: SERVANT, name: 'fixture', cards: [{
    id: CARD, name: 'Outer Life', cardType: 'servant_skill',
    cardFace: { cost: 0, basePower: 0, attributes: [], semanticCategory: category },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [abilityValue],
  }] } as any;
}
function setup(controller = 'p1', servantOwner = 'p2', instance = 'outer-life-instance') {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  (pack.cards[CARD] as any).ownerId = SERVANT;
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{
    instanceId: instance, definitionId: CARD, ownerPlayerId: controller, controllerPlayerId: controller,
    zone: 'attack_area', visibility: { scope: 'public' },
  }];
  state.round.activePhase = 'battle'; state.round.prioritySeat = state.players.find((p) => p.id === controller)!.seat;
  state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'shinto';
  state.players.find((p) => p.id === servantOwner)!.servantCardId = SERVANT;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260919 });
  (state as any).modeState = { stagedAttacks: {} };
  state.abilityRuntime!.cardState[instance] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return { state, pack };
}
function activate(state: GameState, playerId = 'p1', instance = 'outer-life-instance') {
  return rules.dispatchAbilityCommand(state, playerId, { type: 'activate_ability', cardInstanceId: instance, abilityId: ABILITY });
}
function terminal(id = 'terminal-1') {
  return { id, type: 'after_battle_ended', battlePhaseResolutionId: 'phase-1', battleIds: ['b1'], resultIds: ['r1'], scoringReceiptIds: ['s1'], battleParticipantIds: ['p1', 'p2'], battleOutcomes: [{ battlefieldId: 'miyama_town', winnerPlayerIds: ['p1'] }] } as const;
}

describe('P3-FB2-29 Outer-God-Life structural family', () => {
  it('accepts only the exact structural marker and relational semantic envelope', () => {
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report).toEqual([]);
    expect(loaded.cards[CARD]!.cardFace.semanticCategory).toBe('outer_god_life');
    const wrongAmount = ability(); (wrongAmount.effects[0] as any).amount = 7;
    expect(rules.loadAuthoringJson(archive(wrongAmount)).report.some((entry) => entry.path === 'outerGodLife.gateway')).toBe(true);
    expect(rules.loadAuthoringJson(archive(ability(), 'outer-god-life')).report.some((entry) => entry.path === 'cardFace.semanticCategory')).toBe(true);
    const missingMarker = archive(); delete missingMarker.cards[0].cardFace.semanticCategory;
    expect(rules.loadAuthoringJson(missingMarker).report.some((entry) => entry.path === 'cardFace.semanticCategory')).toBe(true);
  });

  it('gives controller and source-servant owner +6 exactly once each, with same-player dedupe and production combat power', () => {
    const { state } = setup();
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.roundTotalPowerAdjustments.byPlayer).toEqual({ p1: 6, p2: 6 });
    expect(state.abilityRuntime!.roundTotalPowerAdjustments.byPlayer.p3).toBeUndefined();
    const battle = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town' }).nextState;
    const byId = Object.fromEntries(battle.battleResults.at(-1)!.participantBreakdowns.map((entry) => [entry.playerId, entry.effectivePower]));
    expect(byId.p1).toBe(6); expect(byId.p2).toBe(6);

    const same = setup('p1', 'p1');
    expect(activate(same.state).ok).toBe(true);
    expect(same.state.abilityRuntime!.roundTotalPowerAdjustments.byPlayer).toEqual({ p1: 6 });
  });

  it('stacks independent source uses and expires the ledger by round identity', () => {
    const { state, pack } = setup();
    state.cards.push({ instanceId: 'outer-life-instance-2', definitionId: CARD, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['outer-life-instance-2'] = { active: true, faceDown: false, playedRound: 1 };
    expect(activate(state).ok).toBe(true);
    expect(activate(state, 'p1', 'outer-life-instance-2').ok).toBe(true);
    expect(state.abilityRuntime!.roundTotalPowerAdjustments.byPlayer).toEqual({ p1: 12, p2: 12 });
    rules.advanceAbilityPhase(state, 'round_start', 2);
    expect(rules.roundTotalPowerAdjustment(state, 'p1')).toBe(0);
    expect(state.abilityRuntime!.roundTotalPowerAdjustments).toEqual({ round: 2, byPlayer: {} });
    expect(pack.cards[CARD]!.cardFace.semanticCategory).toBe('outer_god_life');
  });

  it('requires a unique live source-servant owner at use time but preserves an established return after later elimination', () => {
    const eliminatedAtUse = setup();
    eliminatedAtUse.state.players[1]!.status = 'eliminated';
    const beforeRejected = structuredClone(eliminatedAtUse.state);
    const rejected = activate(eliminatedAtUse.state);
    expect(rejected.ok).toBe(false);
    expect(rejected.rejection?.code).toBe('resolution_failed');
    expect(eliminatedAtUse.state).toEqual(beforeRejected);

    const established = setup();
    expect(activate(established.state).ok).toBe(true);
    expect(established.state.abilityRuntime!.pendingSourceCardReturns).toHaveLength(1);
    established.state.players[1]!.status = 'eliminated';
    rules.processAbilityEvent(established.state, terminal('terminal-after-owner-elimination'));
    expect(established.state.cards[0]).toMatchObject({
      ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'discard',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p2' },
    });
    expect(established.state.abilityRuntime!.pendingSourceCardReturns).toEqual([]);
  });
  it('returns the exact physical source to the source-servant owner at authoritative battle terminal and is replay-idempotent', () => {
    const { state } = setup();
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.pendingSourceCardReturns).toHaveLength(1);
    const beforeBad = structuredClone(state);
    expect(() => rules.processAbilityEvent(state, { id: 'bad-terminal', type: 'after_battle_ended' })).toThrow(/authoritative battle-terminal/);
    expect(state).toEqual(beforeBad);

    rules.processAbilityEvent(state, terminal());
    const source = state.cards[0]!;
    expect(source).toMatchObject({ ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'discard', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } });
    expect(state.abilityRuntime!.cardState[source.instanceId]).toMatchObject({ active: false, faceDown: false });
    expect(state.abilityRuntime!.pendingSourceCardReturns).toEqual([]);
    const snapshot = structuredClone(state);
    rules.processAbilityEvent(state, terminal());
    expect(state).toEqual(snapshot);
  });

  it('fails closed transactionally for missing source-owner relation, stale source state, and derived sources skip ordinary return scheduling', () => {
    const missing = setup();
    missing.state.players[1]!.servantCardId = 'different-servant';
    const beforeMissing = structuredClone(missing.state);
    const rejected = activate(missing.state);
    expect(rejected.ok).toBe(false); expect(rejected.rejection?.code).toBe('resolution_failed');
    expect(missing.state).toEqual(beforeMissing);

    const stale = setup(); stale.state.abilityRuntime!.cardState['outer-life-instance']!.active = false;
    expect(rules.getLegalActions(stale.state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === 'outer-life-instance')).toBe(false);

    const derived = setup(); derived.state.cards[0]!.generatedBy = 'another-source';
    expect(activate(derived.state).ok).toBe(true);
    expect(derived.state.abilityRuntime!.pendingSourceCardReturns).toEqual([]);
  });
});
