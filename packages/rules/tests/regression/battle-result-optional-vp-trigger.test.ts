import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { AuthoringAbility } from '../../src/ability/types';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.artoria-alt.json', 'utf8'));
const SOURCE_ID = 'b18-artoria-alt-resistance';
const ABILITY_ID = 'sc-artoria-alt-3.noble-bloom';

function synthetic(): AuthoringAbility {
  return {
    id: 'synthetic.optional-post-result-vp',
    kind: 'optional_trigger',
    printedClause: 'synthetic',
    activation: { phase: 'combat', trigger: 'after_battle_result_determined' },
    conditions: [{ type: 'controller_played_highest_cost_noble_phantasm_in_battle_this_round' }],
    targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {},
    responseWindow: { opens: 'after_battle_result_determined' }, limit: {}, visibility: {},
    effects: [{ type: 'adjust_victory_points', player: 'controller', amount: 1 }],
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function setup(cost = 3, archive = raw) {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'battle';
  state.players[0]!.servantCardId = archive.id;
  state.players[0]!.vp = 4;
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(archive), { seed: 1818 });
  state.cards.push({
    instanceId: SOURCE_ID,
    definitionId: 'servant.artoria-alt.skill.sc-artoria-alt-3',
    ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  state.abilityRuntime!.noblePhantasmCostsThisRound.p1 = cost > 0 ? [{ cardId: 'b18-np', cost }] : [];
  return state;
}

function resultEvent(id = 'b18-result') {
  return {
    id,
    type: 'after_battle_result_determined' as const,
    battlePhaseResolutionId: 'battle-phase:1',
    battleId: 'battle-phase:1:battle:shinto:1',
    resultId: id,
    battleParticipantIds: ['p1', 'p2'],
    battlefieldId: 'shinto',
    battleResult: { winners: ['p1'], loserIds: ['p2'] },
  };
}

function responseAction(state: ReturnType<typeof setup>) {
  return rules.getLegalActions(state, 'p1').find((action) =>
    action.type === 'resolve_response' && action.abilityId === ABILITY_ID);
}

function addCard(
  session: ReturnType<typeof rules.createMatchSession>,
  instanceId: string,
  definitionId: string,
  ownerPlayerId: string,
  zone: 'skill' | 'attack_area',
): void {
  session.state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId,
    controllerPlayerId: ownerPlayerId,
    zone,
    visibility: zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId },
  });
  session.state.abilityRuntime!.cardState[instanceId] = {
    active: zone === 'attack_area',
    faceDown: false,
    playedRound: session.state.round.roundNumber,
  };
}

function twoBattlefieldOptionalSession() {
  const session = rules.createMatchSession({ seed: 20260904, humanPlayerId: 'p1', humanPlayerIds: ['p1'] });
  const state = session.state;
  state.round.activePhase = 'battle';
  state.eventPlacements = [];
  state.currentSituationModifiers = [];
  state.battleResults = [];
  state.abilityRuntime!.hostRequests = [];
  state.abilityRuntime!.responseWindows = [];
  state.abilityRuntime!.pendingPostBattleEvents = [];
  delete state.abilityRuntime!.pendingDecision;
  const active = new Set(['p1', 'p2', 'p5', 'p6']);
  for (const player of state.players) {
    player.status = active.has(player.id) ? 'active' : 'eliminated';
    player.vp = 0;
    player.militaryResult = 0;
    if (player.id === 'p1' || player.id === 'p2') player.locationId = 'shinto';
    else if (player.id === 'p5' || player.id === 'p6') player.locationId = 'miyama_town';
    else delete player.locationId;
  }
  state.players.find((player) => player.id === 'p1')!.servantCardId = raw.id;
  for (const card of state.cards) {
    if (card.zone === 'field' || card.zone === 'attack_area') {
      card.zone = 'discard';
      card.visibility = { scope: 'owner_only', ownerPlayerId: card.ownerPlayerId };
      if (state.abilityRuntime!.cardState[card.instanceId]) state.abilityRuntime!.cardState[card.instanceId]!.active = false;
    }
  }
  addCard(session, SOURCE_ID, 'servant.artoria-alt.skill.sc-artoria-alt-3', 'p1', 'skill');
  addCard(session, 'b18-shinto-p1', 'basic.strength.5', 'p1', 'attack_area');
  addCard(session, 'b18-shinto-p2', 'basic.strength.2', 'p2', 'attack_area');
  addCard(session, 'b18-miyama-p5', 'basic.strength.2', 'p5', 'attack_area');
  addCard(session, 'b18-miyama-p6', 'basic.strength.5', 'p6', 'attack_area');
  state.abilityRuntime!.noblePhantasmCostsThisRound.p1 = [{ cardId: 'b18-np-record', cost: 3 }];
  return session;
}

function resolveProductionBattle(session: ReturnType<typeof rules.createMatchSession>): void {
  (session as unknown as { resolveBattlePhase: () => void }).resolveBattlePhase();
}

describe('P3-B18 optional post-result +1 VP trigger', () => {
  it('classifies only the exact identity-free semantic and excludes the sibling extra-VP shape', () => {
    const ability = synthetic();
    expect(rules.isOptionalBattleResultVpTriggerSemantic(ability)).toBe(true);
    const renamed = structuredClone(ability); renamed.id = 'totally-renamed';
    expect(rules.isOptionalBattleResultVpTriggerSemantic(renamed)).toBe(true);

    const wrongTrigger = structuredClone(ability); wrongTrigger.activation.trigger = 'after_controller_wins_battle';
    expect(rules.isOptionalBattleResultVpTriggerSemantic(wrongTrigger)).toBe(false);
    const wrongWindow = structuredClone(ability); wrongWindow.responseWindow.opens = 'post_battle_optional_trigger_window';
    expect(rules.isOptionalBattleResultVpTriggerSemantic(wrongWindow)).toBe(false);
    const wrongAmount = structuredClone(ability); wrongAmount.effects[0]!.amount = 2;
    expect(rules.isOptionalBattleResultVpTriggerSemantic(wrongAmount)).toBe(false);
    const wrongPlayer = structuredClone(ability); wrongPlayer.effects[0]!.player = 'target';
    expect(rules.isOptionalBattleResultVpTriggerSemantic(wrongPlayer)).toBe(false);
    const extraCondition = structuredClone(ability);
    extraCondition.conditions.push({ type: 'highest_cost_noble_phantasm_cost_at_least', value: 4 });
    expect(rules.isOptionalBattleResultVpTriggerSemantic(extraCondition)).toBe(false);
  });

  it('opens the controller-only optional response and resolves typed +1 VP exactly once', () => {
    const state = setup(3);
    const event = resultEvent();
    rules.processAbilityEvent(state, event);
    expect(state.players[0]!.vp).toBe(4);
    expect(responseAction(state)).toBeTruthy();
    expect(rules.getLegalActions(state, 'p2')).toEqual([]);

    const resolved = rules.dispatchAbilityCommand(state, 'p1', responseAction(state)!);
    expect(resolved.ok).toBe(true);
    expect(state.players[0]!.vp).toBe(5);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'victory_points_adjusted', playerId: 'p1', abilityId: ABILITY_ID,
      resource: 'victory_points', delta: 1, before: 4, after: 5,
    }));

    rules.processAbilityEvent(state, event);
    expect(state.players[0]!.vp).toBe(5);
    expect(responseAction(state)).toBeUndefined();
  });

  it('declines with no VP change and exposes no response when the qualifying condition is false', () => {
    const declined = setup(3);
    rules.processAbilityEvent(declined, resultEvent('b18-decline'));
    const decline = rules.getLegalActions(declined, 'p1').find((action) => action.type === 'decline_this_window');
    expect(decline).toBeTruthy();
    expect(rules.dispatchAbilityCommand(declined, 'p1', decline!).ok).toBe(true);
    expect(declined.players[0]!.vp).toBe(4);

    const notQualified = setup(0);
    rules.processAbilityEvent(notQualified, resultEvent('b18-no-condition'));
    expect(responseAction(notQualified)).toBeUndefined();
    expect(notQualified.players[0]!.vp).toBe(4);
  });

  it('does not open the optional response for a different battlefield result the controller did not participate in', () => {
    const state = setup(3);
    rules.processAbilityEvent(state, {
      id: 'b18-unrelated-result',
      type: 'after_battle_result_determined',
      battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:miyama:1',
      resultId: 'b18-unrelated-result',
      battleParticipantIds: ['p5', 'p6'],
      battlefieldId: 'miyama_town',
      battleResult: { winners: ['p5'], loserIds: ['p6'] },
    });

    expect(responseAction(state)).toBeUndefined();
    expect(state.players[0]!.vp).toBe(4);
  });

  it('fails closed atomically for a malformed same-family amount instead of using the legacy effect path', () => {
    const malformed = structuredClone(raw);
    const source = malformed.cards.find((card: { id: string }) => card.id === 'servant.artoria-alt.skill.sc-artoria-alt-3');
    const ability = source.abilities.find((candidate: { id: string }) => candidate.id === ABILITY_ID);
    ability.effects[0].amount = 2;
    const state = setup(3, malformed);
    rules.processAbilityEvent(state, resultEvent('b18-malformed'));
    const action = responseAction(state);
    expect(action).toBeTruthy();
    rules.projectAbilityState(state, 'p1');
    const before = JSON.stringify(state);
    const result = rules.dispatchAbilityCommand(state, 'p1', action!);
    expect(result.ok).toBe(false);
    expect(result.rejection).toMatchObject({ code: 'resolution_failed', message: 'Unsupported optional battle-result VP semantic shape' });
    expect(JSON.stringify(state)).toBe(before);
    expect(state.players[0]!.vp).toBe(4);
    expect(state.abilityRuntime!.events.some((event) => event.type === 'victory_points_adjusted')).toBe(false);
  });

  it('opens the production optional response only after both battlefield scoring receipts cross the phase-wide barrier', () => {
    const session = twoBattlefieldOptionalSession();
    let receiptsAtBarrier = -1;
    let windowsAtBarrier = -1;
    let windowsAtResultDispatch = -1;
    const originalRecord = (session as unknown as {
      record: (type: string, message: string, payload?: Record<string, unknown>) => void;
    }).record.bind(session);
    (session as unknown as {
      record: (type: string, message: string, payload?: Record<string, unknown>) => void;
    }).record = (type, message, payload) => {
      if (type === 'battle_post_scoring_barrier_open') {
        receiptsAtBarrier = session.state.log.filter((entry) => entry.type === 'battle_scored').length;
        windowsAtBarrier = session.state.abilityRuntime!.responseWindows.length;
      }
      if (type === 'battle_result_event_dispatched' && session.state.abilityRuntime!.responseWindows.length > 0) {
        windowsAtResultDispatch = session.state.abilityRuntime!.responseWindows.length;
      }
      originalRecord(type, message, payload);
    };

    resolveProductionBattle(session);

    expect(receiptsAtBarrier).toBe(2);
    expect(windowsAtBarrier).toBe(0);
    expect(windowsAtResultDispatch).toBe(1);
    expect(session.logs.findIndex((entry) => entry.type === 'battle_result_event_dispatched')).toBeGreaterThan(
      session.logs.findIndex((entry) => entry.type === 'battle_post_scoring_barrier_open'),
    );
    const action = rules.getLegalActions(session.state, 'p1').find((candidate) =>
      candidate.type === 'resolve_response' && candidate.abilityId === ABILITY_ID);
    expect(action).toBeTruthy();
    expect(session.state.players.find((player) => player.id === 'p1')!.vp).toBeGreaterThanOrEqual(0);
  });
});
