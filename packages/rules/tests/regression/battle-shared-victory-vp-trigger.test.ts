import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { AuthoringAbility } from '../../src/ability/types';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.artoriac.json', 'utf8'));
const SOURCE_ID = 'b14-artoria-caster-destiny';
const ABILITY_ID = 'sc-artoriac-6.gain-vp-if-not-sole-winner';

function synthetic(): AuthoringAbility {
  return {
    id: 'synthetic.shared-victory-vp',
    kind: 'forced_trigger',
    printedClause: 'synthetic',
    activation: { phase: 'combat', trigger: 'after_battle_result_determined', opens: 'immediate', requiresSourceState: 'active' },
    conditions: [
      { type: 'controller_won_battle' },
      { type: 'not', condition: { type: 'controller_sole_winner' } },
    ],
    targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    effects: [{ type: 'adjust_victory_points', player: 'controller', amount: 2 }],
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function setup(active = true) {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'battle';
  state.players[0]!.servantCardId = raw.id;
  state.players[0]!.vp = 4;
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), { seed: 1414 });
  state.cards.push({
    instanceId: SOURCE_ID,
    definitionId: 'servant.artoriac.skill.sc-artoriac-6',
    ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState[SOURCE_ID] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function resultEvent(id: string, winners: string[]) {
  return {
    id,
    type: 'after_battle_result_determined' as const,
    battlePhaseResolutionId: 'battle-phase:1',
    battleId: 'battle-phase:1:battle:shinto:1',
    resultId: id,
    battleParticipantIds: ['p1', 'p2', 'p3'],
    battlefieldId: 'shinto',
    battleResult: { winners, loserIds: ['p1', 'p2', 'p3'].filter((id) => !winners.includes(id)) },
  };
}

function twoBattlefieldSharedWinnerSession() {
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
    player.vp = 0; player.militaryResult = 0;
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
  const addAttack = (instanceId: string, definitionId: string, ownerPlayerId: string) => {
    state.cards.push({ instanceId, definitionId, ownerPlayerId, controllerPlayerId: ownerPlayerId, zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState[instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  };
  addAttack(SOURCE_ID, 'servant.artoriac.skill.sc-artoriac-6', 'p1');
  addAttack('b14-shared-opponent', 'servant.tomoe.skill.sc-tomoe-1', 'p2');
  addAttack('b14-second-5', 'basic.strength.2', 'p5');
  addAttack('b14-second-6', 'basic.strength.5', 'p6');
  return session;
}

function resolveProductionBattle(session: ReturnType<typeof rules.createMatchSession>): void {
  (session as unknown as { resolveBattlePhase: () => void }).resolveBattlePhase();
}

describe('P3-B14 shared-victory VP trigger', () => {
  it('classifies only the exact identity-free semantic shape', () => {
    const ability = synthetic();
    expect(rules.isSharedVictoryVpTriggerSemantic(ability)).toBe(true);
    const renamed = structuredClone(ability); renamed.id = 'totally-renamed';
    expect(rules.isSharedVictoryVpTriggerSemantic(renamed)).toBe(true);
    const soleOnly = structuredClone(ability); soleOnly.conditions = [{ type: 'controller_won_battle' }];
    expect(rules.isSharedVictoryVpTriggerSemantic(soleOnly)).toBe(false);
    const wrongAmount = structuredClone(ability); wrongAmount.effects[0]!.amount = 3;
    expect(rules.isSharedVictoryVpTriggerSemantic(wrongAmount)).toBe(false);
    const wrongState = structuredClone(ability); wrongState.activation.requiresSourceState = undefined;
    expect(rules.isSharedVictoryVpTriggerSemantic(wrongState)).toBe(false);
  });

  it('awards typed +2 VP exactly once for a shared winner', () => {
    const state = setup();
    const event = resultEvent('b14-shared', ['p1', 'p2']);
    rules.processAbilityEvent(state, event);
    expect(state.players[0]!.vp).toBe(6);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'victory_points_adjusted', playerId: 'p1', abilityId: ABILITY_ID,
      resource: 'victory_points', delta: 2, before: 4, after: 6,
    }));
    rules.processAbilityEvent(state, event);
    expect(state.players[0]!.vp).toBe(6);
  });

  it('does not reward a sole winner, loser, or inactive source', () => {
    const sole = setup(); rules.processAbilityEvent(sole, resultEvent('b14-sole', ['p1']));
    expect(sole.players[0]!.vp).toBe(4);
    const loss = setup(); rules.processAbilityEvent(loss, resultEvent('b14-loss', ['p2']));
    expect(loss.players[0]!.vp).toBe(4);
    const inactive = setup(false); rules.processAbilityEvent(inactive, resultEvent('b14-inactive', ['p1', 'p2']));
    expect(inactive.players[0]!.vp).toBe(4);
  });

  it('commits both battlefield scoring receipts before the production shared-winner +2 reward and dedupes re-entry', () => {
    const session = twoBattlefieldSharedWinnerSession();
    let scoringReceiptsAtBarrier = -1;
    let vpAtBarrier = -1;
    let vpAtSharedResultDispatch = -1;
    const originalRecord = (session as unknown as { record: (type: string, message: string, payload?: Record<string, unknown>) => void }).record.bind(session);
    (session as unknown as { record: (type: string, message: string, payload?: Record<string, unknown>) => void }).record = (type, message, payload) => {
      if (type === 'battle_post_scoring_barrier_open') {
        scoringReceiptsAtBarrier = session.state.log.filter((entry) => entry.type === 'battle_scored').length;
        vpAtBarrier = session.state.players.find((player) => player.id === 'p1')!.vp;
      }
      if (type === 'battle_result_event_dispatched' && payload?.battlefieldId === 'shinto') {
        vpAtSharedResultDispatch = session.state.players.find((player) => player.id === 'p1')!.vp;
      }
      originalRecord(type, message, payload);
    };

    resolveProductionBattle(session);

    expect(scoringReceiptsAtBarrier).toBe(2);
    expect(vpAtBarrier).toBe(2);
    expect(vpAtSharedResultDispatch).toBe(4);
    expect(session.state.players.find((player) => player.id === 'p1')!.vp).toBe(4);
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'victory_points_adjusted', playerId: 'p1', abilityId: ABILITY_ID,
      before: 2, after: 4, delta: 2,
    }));
    const firstEventCount = session.state.abilityRuntime!.events.filter((entry) =>
      entry.type === 'victory_points_adjusted' && entry.abilityId === ABILITY_ID).length;
    session.state.round.activePhase = 'battle';
    resolveProductionBattle(session);
    expect(session.state.players.find((player) => player.id === 'p1')!.vp).toBe(4);
    expect(session.state.abilityRuntime!.events.filter((entry) =>
      entry.type === 'victory_points_adjusted' && entry.abilityId === ABILITY_ID)).toHaveLength(firstEventCount);
  });
});
