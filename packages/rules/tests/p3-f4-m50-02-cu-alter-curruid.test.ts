import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CURRUID = 'servant.fixture.cu-alter.curruid';
const CURRUID_SOURCE = 'cu-alter-curruid-source';
const ATTACKER = 'servant.fixture.effect-defeat';
const ATTACKER_SOURCE = 'effect-defeat-source';
const BASIC = 'fixture.basic.attack';

function curruidAbilities(): any[] {
  return [
    {
      id: 'protection-from-arrows', kind: 'passive', printedClause: 'fixture', markers: ['m50_structured_v1'], activation: {},
      conditions: [{ type: 'source_owned' }], targets: [], effects: [], cost: [], creates: [],
      ruleModifiers: [{ id: 'opponent-defeat-cost-three', operation: 'add', rule: 'defeat_cost', scope: { subject: 'controller' }, value: 3, lifecycle: { duration: 'permanent' } }],
      lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
    },
    {
      id: 'curruid-combat-attrition', kind: 'forced_trigger', printedClause: 'fixture', markers: ['m50_structured_v1'], activation: { trigger: 'after_battle_ended' },
      conditions: [{ type: 'source_owned_live' }], targets: [], cost: [], creates: [], ruleModifiers: [],
      effects: [{ type: 'battle_terminal_active_attack_vp_attrition', offset: -1, maxAmount: 3 }],
      lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
    },
  ];
}

function armAbility(): any {
  return {
    id: 'arm', kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
    activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [{ type: 'source_active' }], targets: [], cost: [], creates: [], ruleModifiers: [],
    effects: [{ type: 'set_player_flag', target: 'controller', key: 'fixtureDefeatRound', value: { type: 'current_round' }, lifecycle: { duration: 'this_round' } }],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function defeatAbility(): any {
  return {
    id: 'defeat', kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
    activation: { phase: 'combat', opens: 'controller_combat_action_window' }, conditions: [{ type: 'source_active' }, { type: 'player_flag_number_current_round', key: 'fixtureDefeatRound' }], targets: [], cost: [], creates: [], ruleModifiers: [],
    effects: [{ type: 'choose_players', candidateTarget: 'engaged_opponents', minCount: 1, maxCount: 1, payloadKey: 'targetPlayerId', then: [{ type: 'defeat_player', target: 'targetPlayerId' }] }],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.fixture.cu-alter', name: 'fixture', class: 'Berserker',
    cards: [
      { id: CURRUID, name: 'Curruid', cardType: 'servant_skill', cardFace: { typeLabel: 'skill', cost: 0, basePower: 0, attributes: [] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: curruidAbilities() },
      { id: ATTACKER, name: 'defeat source', cardType: 'servant_skill', cardFace: { typeLabel: 'skill', cost: 0, basePower: 0, attributes: [] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [armAbility(), defeatAbility()] },
      { id: BASIC, name: 'attack', cardType: 'basic_attack', cardFace: { cost: 0, basePower: 1, attributes: ['力量'] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [] },
    ],
  };
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.cards = [
    { instanceId: CURRUID_SOURCE, definitionId: CURRUID, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } },
    { instanceId: ATTACKER_SOURCE, definitionId: ATTACKER, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } },
  ];
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'miyama_town';
  state.players[3]!.locationId = 'shinto';
  state.players[0]!.mana = 10;
  state.players[1]!.vp = 10;
  state.players[2]!.vp = 10;
  state.players[3]!.vp = 10;
  state.round.activePhase = 'battle';
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  state.abilityRuntime!.cardState[ATTACKER_SOURCE] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function addActiveAttack(state: GameState, playerId: string, instanceId: string, faceDown = false): void {
  state.cards.push({ instanceId, definitionId: BASIC, ownerPlayerId: playerId, controllerPlayerId: playerId, zone: 'attack_area', visibility: faceDown ? { scope: 'owner_only', ownerPlayerId: playerId } : { scope: 'public' } });
  state.abilityRuntime!.cardState[instanceId] = { active: !faceDown, faceDown, playedRound: state.round.roundNumber };
}

function terminalEvent(state: GameState) {
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  return {
    id: `${phaseId}:after_battle_ended`, type: 'after_battle_ended', battlePhaseResolutionId: phaseId,
    battleIds: [`${phaseId}:miyama_town`, `${phaseId}:shinto`], resultIds: ['r1', 'r2'], scoringReceiptIds: ['s1', 's2'],
    battleParticipantIds: ['p1', 'p2', 'p3', 'p4'],
    battleOutcomes: [
      { battlefieldId: 'miyama_town', participantPlayerIds: ['p1', 'p2', 'p3'], winnerPlayerIds: ['p1'] },
      { battlefieldId: 'shinto', participantPlayerIds: ['p4'], winnerPlayerIds: ['p4'] },
    ],
  } as any;
}

function stageDefeat(state: GameState): ReturnType<typeof rules.dispatchAbilityCommand> {
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  const armed = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: ATTACKER_SOURCE, abilityId: 'arm' });
  if (!armed.ok) return armed;
  state.round.activePhase = 'battle';
  state.round.prioritySeat = state.players[0]!.seat;
  const opened = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: ATTACKER_SOURCE, abilityId: 'defeat' });
  if (!opened.ok) return opened;
  const pending = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: ['p2'] });
}

describe('P3 F4 M50-02 Cu Alter Curruid', () => {
  it('accepts only the exact defeat-cost and terminal attrition envelopes', () => {
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);
    const widenedCost = archive(); widenedCost.cards[0].abilities[0].ruleModifiers[0].value = 4;
    expect(rules.loadAuthoringJson(widenedCost).report.length).toBeGreaterThan(0);
    const widenedAttrition = archive(); widenedAttrition.cards[0].abilities[1].effects[0].maxAmount = 4;
    expect(rules.loadAuthoringJson(widenedAttrition).report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: expect.stringMatching(/attrition/i) })]));
  });

  it('charges the opposing effect controller three mana before staging defeat and skips it when unaffordable', () => {
    const state = setup();
    expect(stageDefeat(state).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(7);
    expect(state.abilityRuntime!.pendingPreBattleDefeats).toEqual([expect.objectContaining({ controllerId: 'p1', targetPlayerIds: ['p2'] })]);

    const poor = setup(); poor.players[0]!.mana = 2;
    expect(stageDefeat(poor).ok).toBe(true);
    expect(poor.players[0]!.mana).toBe(2);
    expect(poor.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
  });

  it('removes the defeat tax immediately when the Curruid source is no longer live-owned', () => {
    const state = setup();
    state.cards.find((card) => card.instanceId === CURRUID_SOURCE)!.zone = 'removed_from_game';
    expect(stageDefeat(state).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(10);
    expect(state.abilityRuntime!.pendingPreBattleDefeats).toEqual([expect.objectContaining({ targetPlayerIds: ['p2'] })]);
  });

  it('uses frozen same-battlefield participants and caps active face-up attack attrition at three VP', () => {
    const state = setup();
    state.cards.find((card) => card.instanceId === CURRUID_SOURCE)!.ownerPlayerId = 'p1';
    state.cards.find((card) => card.instanceId === CURRUID_SOURCE)!.controllerPlayerId = 'p1';
    for (let i = 0; i < 5; i += 1) addActiveAttack(state, 'p2', `p2-a${i}`);
    addActiveAttack(state, 'p2', 'p2-facedown', true);
    addActiveAttack(state, 'p3', 'p3-a0');
    for (let i = 0; i < 5; i += 1) addActiveAttack(state, 'p4', `p4-a${i}`);
    rules.processAbilityEvent(state, terminalEvent(state));
    expect(state.players[1]!.vp).toBe(7);
    expect(state.players[2]!.vp).toBe(10);
    expect(state.players[3]!.vp).toBe(10);
  });

  it('does not apply terminal attrition after the source leaves a live-owned zone', () => {
    const state = setup();
    state.cards.find((card) => card.instanceId === CURRUID_SOURCE)!.ownerPlayerId = 'p1';
    state.cards.find((card) => card.instanceId === CURRUID_SOURCE)!.controllerPlayerId = 'p1';
    state.cards.find((card) => card.instanceId === CURRUID_SOURCE)!.zone = 'removed_from_game';
    for (let i = 0; i < 4; i += 1) addActiveAttack(state, 'p2', `p2-a${i}`);
    rules.processAbilityEvent(state, terminalEvent(state));
    expect(state.players[1]!.vp).toBe(10);
  });
});
