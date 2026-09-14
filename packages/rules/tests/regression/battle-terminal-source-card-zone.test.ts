import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { AuthoringAbility } from '../../src/ability/types';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.ereshkigal.json', 'utf8'));
const CARD_ID = 'servant.ereshkigal.skill.sc-ereshkigal-2';
const ABILITY_ID = 'sc-ereshkigal-2.return-to-skill-zone';
const SOURCE_ID = 'b15-eresh-netherworld';

function synthetic(): AuthoringAbility {
  return {
    id: 'synthetic.terminal-source-return',
    kind: 'forced_trigger',
    printedClause: 'synthetic',
    activation: { phase: 'combat', trigger: 'after_battle_ended' },
    conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    effects: [{ type: 'move_card', target: 'this_card', to: { zone: 'skill', owner: 'controller' } }],
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function manualState(zone: 'field' | 'attack_area' | 'discard' = 'attack_area') {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'battle';
  state.players[0]!.servantCardId = raw.id;
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), { seed: 1515 });
  state.cards.push({
    instanceId: SOURCE_ID,
    definitionId: CARD_ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone,
    visibility: zone === 'discard' ? { scope: 'owner_only', ownerPlayerId: 'p1' } : { scope: 'public' },
  });
  state.abilityRuntime!.cardState[SOURCE_ID] = { active: zone !== 'discard', faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function terminalEvent(id = 'battle-phase:1:after_battle_ended') {
  return {
    id,
    type: 'after_battle_ended' as const,
    battlePhaseResolutionId: 'battle-phase:1',
    battleIds: ['battle-phase:1:battle:miyama_town:1', 'battle-phase:1:battle:shinto:2'],
    resultIds: ['battle-phase:1:battle:miyama_town:1:result', 'battle-phase:1:battle:shinto:2:result'],
    scoringReceiptIds: ['battle-phase:1:score:miyama_town', 'battle-phase:1:score:shinto'],
    battleParticipantIds: ['p1', 'p2', 'p3', 'p4'],
  };
}

function productionSession() {
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
    if (player.id === 'p1' || player.id === 'p2') player.locationId = 'miyama_town';
    else if (player.id === 'p5' || player.id === 'p6') player.locationId = 'shinto';
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
  addAttack(SOURCE_ID, CARD_ID, 'p1');
  addAttack('b15-opponent-2', 'basic.strength.2', 'p2');
  addAttack('b15-second-5', 'basic.strength.2', 'p5');
  addAttack('b15-second-6', 'basic.strength.5', 'p6');
  return session;
}

function resolveProductionBattle(session: ReturnType<typeof rules.createMatchSession>): void {
  (session as unknown as { resolveBattlePhase: () => void }).resolveBattlePhase();
}

describe('P3-B15 phase-terminal source-card Card Zone runtime', () => {
  it('classifies only the identity-free terminal source-card return shape', () => {
    const ability = synthetic();
    expect(rules.isBattleEndSourceReturnSemantic(ability)).toBe(true);
    const renamed = structuredClone(ability); renamed.id = 'renamed-terminal-source-return';
    expect(rules.isBattleEndSourceReturnSemantic(renamed)).toBe(true);
    const wrongTrigger = structuredClone(ability); wrongTrigger.activation.trigger = 'after_battle_result_determined';
    expect(rules.isBattleEndSourceReturnSemantic(wrongTrigger)).toBe(false);
    const wrongDestination = structuredClone(ability); (wrongDestination.effects[0] as any).to.zone = 'discard';
    expect(rules.isBattleEndSourceReturnSemantic(wrongDestination)).toBe(false);
    const extra = structuredClone(ability); extra.conditions.push({ type: 'controller_won_battle' });
    expect(rules.isBattleEndSourceReturnSemantic(extra)).toBe(false);
  });

  it('moves the source to owner skill through typed Card Zone and dedupes the stable terminal event', () => {
    const state = manualState();
    const event = terminalEvent();
    rules.processAbilityEvent(state, event as any);
    expect(state.cards.find((card) => card.instanceId === SOURCE_ID)).toMatchObject({
      zone: 'skill', controllerPlayerId: 'p1', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    expect(state.abilityRuntime!.cardState[SOURCE_ID]?.active).toBe(false);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'source_card_moved', sourceCardId: SOURCE_ID, abilityId: ABILITY_ID,
      fromZone: 'attack_area', toZone: 'skill', movedCount: 1,
    }));
    const snapshot = JSON.stringify(state);
    rules.processAbilityEvent(state, event as any);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('fails the typed primitive closed for an off-board source without mutating caller state', () => {
    const state = manualState('discard');
    const before = JSON.stringify(state);
    expect(() => rules.executeResolution({
      state,
      controllerId: 'p1',
      sourceCardId: SOURCE_ID,
      abilityId: ABILITY_ID,
      effects: [{ id: 'b15-move-source', type: 'move_source_card', to: 'skill' }],
      resolutionId: 'b15-off-board-resolution',
      causationId: 'b15-off-board-causation',
    })).toThrow();
    expect(JSON.stringify(state)).toBe(before);
  });

  it('fails closed for a wrong source controller without mutating caller state', () => {
    const state = manualState();
    state.cards.find((card) => card.instanceId === SOURCE_ID)!.controllerPlayerId = 'p2';
    const before = JSON.stringify(state);
    expect(() => rules.processAbilityEvent(state, terminalEvent('b15-wrong-controller') as any)).toThrow();
    expect(JSON.stringify(state)).toBe(before);
  });

  it('fails closed instead of falling through when the same-family destination is malformed', () => {
    const state = manualState();
    const definition = state.abilityRuntime!.pack.cards[CARD_ID]!;
    const ability = definition.abilities.find((candidate) => candidate.id === ABILITY_ID)!;
    (ability.effects[0] as any).to = { zone: 'discard', owner: 'controller' };
    const before = JSON.stringify(state);
    expect(() => rules.processAbilityEvent(state, terminalEvent('b15-invalid-destination') as any)).toThrow();
    expect(JSON.stringify(state)).toBe(before);
  });

  it('emits the same terminal semantic in the core game loop before cleanup even with no resolved battlefield', () => {
    const state = manualState();
    state.battleDeclarations = [];
    const result = rules.stepGameLoop(state);
    expect(result.transition).toMatchObject({ from: 'battle', to: 'cleanup' });
    expect(result.nextState.cards.find((card) => card.instanceId === SOURCE_ID)?.zone).toBe('skill');
    const terminalIndex = result.nextState.log.findIndex((entry) => entry.type === 'battle_terminal_event_dispatched');
    const cleanupTransitionIndex = result.nextState.log.findIndex((entry) => entry.type === 'phase_transition' && entry.message === 'battle -> cleanup');
    expect(terminalIndex).toBeGreaterThanOrEqual(0);
    expect(cleanupTransitionIndex).toBeGreaterThan(terminalIndex);
    expect(result.nextState.abilityRuntime!.processedEvents).toContain('battle-phase:1:after_battle_ended');
  });

  it('produces exactly one phase-terminal event after result dispatches and returns Eresh before cleanup', () => {
    const session = productionSession();
    resolveProductionBattle(session);

    const terminalLogs = session.logs.filter((entry) => entry.type === 'battle_terminal_event_dispatched');
    expect(terminalLogs).toHaveLength(1);
    const resultIndexes = session.logs
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => entry.type === 'battle_result_event_dispatched')
      .map(({ index }) => index);
    const terminalIndex = session.logs.findIndex((entry) => entry.type === 'battle_terminal_event_dispatched');
    expect(resultIndexes.length).toBeGreaterThanOrEqual(2);
    expect(terminalIndex).toBeGreaterThan(Math.max(...resultIndexes));
    expect(session.state.cards.find((card) => card.instanceId === SOURCE_ID)).toMatchObject({ zone: 'skill' });
    expect(session.state.abilityRuntime!.cardState[SOURCE_ID]?.active).toBe(false);

    session.state.round.activePhase = 'battle';
    resolveProductionBattle(session);
    expect(session.logs.filter((entry) => entry.type === 'battle_terminal_event_dispatched')).toHaveLength(1);
    expect(session.state.cards.find((card) => card.instanceId === SOURCE_ID)?.zone).toBe('skill');
  });
});
