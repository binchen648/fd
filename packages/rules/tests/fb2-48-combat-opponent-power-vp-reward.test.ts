import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { AbilityEvent, RuleNode } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD_ID = 'test.fb2-48.source';
const ABILITY_ID = 'test.fb2-48.reward';
const EFFECT = 'combat_opponent_power_vp_reward';

function ability(): RuleNode {
  return {
    id: ABILITY_ID,
    kind: 'residual',
    printedClause: 'synthetic identity-free FB2-48',
    activation: { trigger: 'after_battle_result_determined', requiresSourceState: 'active' },
    conditions: [{ type: 'source_active' }, { type: 'event_location_equals_controller' }],
    targets: [],
    effects: [{ type: EFFECT }],
    cost: [],
    creates: [],
    ruleModifiers: [],
    lifecycle: { duration: 'while_active' },
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic' },
  };
}

function archive(rawAbility: RuleNode = ability()) {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'servant_skill_card_archive',
    id: 'test.fb2-48',
    name: 'FB2-48 synthetic',
    class: 'Test',
    cards: [{
      id: CARD_ID,
      name: 'FB2-48 source',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: 'test.fb2-48' },
      printedText: 'synthetic',
      cardFace: { typeLabel: '宝具', attributes: ['宝具'], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [rawAbility],
    }],
  };
}

function setup(activeSeats: number[] = [1, 2, 3]): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats });
  state.cards = [];
  state.round.activePhase = 'battle';
  for (const player of state.players) player.locationId = 'miyama_town';
  rules.initializeAbilityRuntime(state, pack, { seed: 4801 });
  state.cards.push({
    instanceId: 'fb2-48-source-p1',
    definitionId: CARD_ID,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'attack_area',
    visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState['fb2-48-source-p1'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function rootEvent(
  state: GameState,
  powers: Record<string, number> = { p1: 7, p2: 14, p3: 24 },
  participants: string[] = ['p2', 'p3', 'p1'],
  battlefieldId = 'miyama_town',
): AbilityEvent {
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  const battleId = `${phaseId}:battle:${battlefieldId}:1`;
  const resultId = `${battleId}:result`;
  return {
    id: resultId,
    type: 'after_battle_result_determined',
    battlePhaseResolutionId: phaseId,
    battleId,
    resultId,
    battlefieldId,
    battleParticipantIds: [...participants],
    battleParticipantPowers: { ...powers },
    battleResult: { winners: ['p3'], loserIds: ['p2', 'p1'] },
  };
}

function choose(state: GameState, playerId: string): ReturnType<typeof rules.dispatchAbilityCommand> {
  const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [playerId] });
}

function expectRejectedMutationFree(state: GameState, selectedIds: string[], code: string): void {
  const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
  const before = structuredClone(state);
  const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds });
  expect(result.ok).toBe(false);
  expect(result.rejection?.code).toBe(code);
  expect(state).toEqual(before);
}

function gatewayReport(rawAbility: RuleNode) {
  return rules.loadAuthoringJson(archive(rawAbility)).report;
}

function expectGatewayReject(rawAbility: RuleNode): void {
  expect(gatewayReport(rawAbility)).toEqual(expect.arrayContaining([
    expect.objectContaining({ abilityId: ABILITY_ID, path: 'combatOpponentPowerVpReward.gateway', status: 'unsupported' }),
  ]));
}

describe('P3-FB2-48 frozen combat-opponent power VP reward', () => {
  it('admits only the exact raw and compiled whole-ability envelope', () => {
    expect(rules.isCombatOpponentPowerVpRewardCandidate(ability())).toBe(true);
    expect(rules.isAcceptedCombatOpponentPowerVpRewardAbility(ability(), 'authoring')).toBe(true);
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report).toEqual([]);
    const compiled = loaded.cards[CARD_ID]!.abilities[0]!;
    expect(rules.isAcceptedCombatOpponentPowerVpRewardAbility(compiled, 'compiled')).toBe(true);
  });

  it('fails closed for widened compound-token envelopes and historical generic vocabulary', () => {
    const malformed: RuleNode[] = [];
    const wrongKind = structuredClone(ability()); wrongKind.kind = 'forced_trigger'; malformed.push(wrongKind);
    const wrongTrigger = structuredClone(ability()); (wrongTrigger.activation as RuleNode).trigger = 'after_controller_wins_battle'; malformed.push(wrongTrigger);
    const noSourceState = structuredClone(ability()); delete (noSourceState.activation as RuleNode).requiresSourceState; malformed.push(noSourceState);
    const extraCondition = structuredClone(ability()); (extraCondition.conditions as RuleNode[]).push({ type: 'event_player_is_controller' }); malformed.push(extraCondition);
    const wrongLifecycle = structuredClone(ability()); wrongLifecycle.lifecycle = { duration: 'this_round' }; malformed.push(wrongLifecycle);
    const extraEffect = structuredClone(ability()); (extraEffect.effects as RuleNode[]).push({ type: 'noop' }); malformed.push(extraEffect);
    const effectPayload = structuredClone(ability()); (effectPayload.effects as RuleNode[])[0]!.divisor = 5; malformed.push(effectPayload);
    const historical = structuredClone(ability()); historical.effects = [{ type: 'choose_players', target: { scope: 'event_combat_opponents' } }, { type: 'gain_victory_points', amount: { type: 'formula', op: 'floor_divide', args: [{ type: 'selected_player_event_combat_power' }, 5] } }]; malformed.push(historical);
    for (const raw of malformed) expectGatewayReject(raw);
  });

  it('stages exactly one private non-cancellable opponent choice from a trusted frozen root', () => {
    const state = setup();
    rules.processAbilityEvent(state, rootEvent(state));
    const owner = rules.projectAbilityState(state, 'p1');
    expect(owner.pendingDecision).toMatchObject({ min: 1, max: 1, candidates: ['p2', 'p3'], template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden' });
    expect(rules.projectAbilityState(state, 'p2').pendingDecision).toBeUndefined();
    expect(state.abilityRuntime!.pendingDecision!.interaction).toMatchObject({
      kind: 'combat_opponent_power_vp_reward_v1',
      triggerEventId: expect.stringContaining(':result'),
      battlefieldId: 'miyama_town',
      participantIds: ['p2', 'p3', 'p1'],
      participantPowers: { p1: 7, p2: 14, p3: 24 },
      divisor: 5,
    });
  });

  it('uses the selected frozen opponent power and floors division by five', () => {
    const p2 = setup(); p2.players.find(p => p.id === 'p1')!.vp = 1; rules.processAbilityEvent(p2, rootEvent(p2));
    expect(choose(p2, 'p2').ok).toBe(true); expect(p2.players.find(p => p.id === 'p1')!.vp).toBe(3);
    const p3 = setup(); p3.players.find(p => p.id === 'p1')!.vp = 1; rules.processAbilityEvent(p3, rootEvent(p3));
    expect(choose(p3, 'p3').ok).toBe(true); expect(p3.players.find(p => p.id === 'p1')!.vp).toBe(5);
  });

  it('keeps the trigger-time power snapshot authoritative despite later board/location mutation', () => {
    const state = setup(); state.players.find(p => p.id === 'p1')!.vp = 2;
    rules.processAbilityEvent(state, rootEvent(state, { p1: 9, p2: 19, p3: 31 }));
    state.players.find(p => p.id === 'p1')!.locationId = 'shinto';
    state.players.find(p => p.id === 'p2')!.locationId = 'recon';
    state.cards.push({ instanceId: 'late-power-noise', definitionId: 'unrelated', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
    expect(choose(state, 'p2').ok).toBe(true);
    expect(state.players.find(p => p.id === 'p1')!.vp).toBe(5);
  });

  it('rejects malformed trusted roots before staging any decision', () => {
    const cases: AbilityEvent[] = [];
    const baseState = setup();
    const missingPowers = rootEvent(baseState); delete missingPowers.battleParticipantPowers; cases.push(missingPowers);
    const duplicate = rootEvent(baseState); duplicate.battleParticipantIds = ['p1', 'p2', 'p2']; cases.push(duplicate);
    const missingController = rootEvent(baseState, { p2: 14, p3: 24 }, ['p2', 'p3']); cases.push(missingController);
    const wrongBattlefield = rootEvent(baseState, { p1: 7, p2: 14, p3: 24 }, ['p2', 'p3', 'p1'], 'shinto'); cases.push(wrongBattlefield);
    const negativePower = rootEvent(baseState, { p1: 7, p2: -1, p3: 24 }); cases.push(negativePower);
    for (const event of cases) {
      const state = setup();
      rules.processAbilityEvent(state, event);
      expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
      expect(state.players.find(p => p.id === 'p1')!.vp).toBe(0);
    }
  });

  it('rejects outsider/empty/duplicate selections and forged pending provenance mutation-free', () => {
    for (const selected of [[], ['p4'], ['p2', 'p2']]) {
      const state = setup(); rules.processAbilityEvent(state, rootEvent(state));
      expectRejectedMutationFree(state, selected, selected.length === 1 && selected[0] === 'p4' ? 'resolution_failed' : 'resolution_failed');
    }
    const mutations: Array<(state: GameState) => void> = [
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).createdRevision += 1; },
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).continuationRef = 'forged'; },
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).triggerEventId = 'forged'; },
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).resultId = 'forged'; },
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).participantPowers.p2 = 999; },
    ];
    for (const mutate of mutations) {
      const state = setup(); rules.processAbilityEvent(state, rootEvent(state)); mutate(state);
      expectRejectedMutationFree(state, ['p2'], 'resolution_failed');
    }
  });

  it('receives participant powers from the real game-loop post-scoring root producer', () => {
    const state = setup();
    const result = rules.stepGameLoop(state);
    expect(result.transition).toEqual({ from: 'battle', to: 'battle' });
    const decision = result.nextState.abilityRuntime!.pendingDecision!;
    expect(decision.interaction).toMatchObject({
      kind: 'combat_opponent_power_vp_reward_v1',
      participantIds: ['p1', 'p2', 'p3'],
      participantPowers: { p1: 0, p2: 0, p3: 0 },
      opponentIds: ['p2', 'p3'],
    });
    const root = result.nextState.abilityRuntime!.trustedBattleResultSnapshots?.[decision.interaction!.resultId as string];
    expect(root?.battleParticipantPowers).toEqual({ p1: 0, p2: 0, p3: 0 });
  });

  it('serializes multiple exact sources from the same root instead of overwriting pending choice state', () => {
    const state = setup();
    state.cards.push({
      instanceId: 'fb2-48-source-p2', definitionId: CARD_ID, ownerPlayerId: 'p2', controllerPlayerId: 'p2',
      zone: 'attack_area', visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState['fb2-48-source-p2'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    rules.processAbilityEvent(state, rootEvent(state));
    expect(state.abilityRuntime!.pendingCombatOpponentPowerVpRewards).toHaveLength(2);
    expect(state.abilityRuntime!.pendingDecision?.controllerId).toBe('p1');
    const first = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: first.id, selectedIds: ['p2'] }).ok).toBe(true);
    expect(state.abilityRuntime!.pendingCombatOpponentPowerVpRewards).toHaveLength(1);
    expect(state.abilityRuntime!.pendingDecision?.controllerId).toBe('p2');
    expect(state.abilityRuntime!.pendingDecision?.candidates).toEqual(['p3', 'p1']);
    const second = rules.projectAbilityState(state, 'p2').pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: second.id, selectedIds: ['p3'] }).ok).toBe(true);
    expect(state.abilityRuntime!.pendingCombatOpponentPowerVpRewards).toEqual([]);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });

  it('allows zero reward, cleans the decision, and exact root replay never stages or rewards twice', () => {
    const state = setup(); state.players.find(p => p.id === 'p1')!.vp = 4;
    const root = rootEvent(state, { p1: 8, p2: 4, p3: 6 });
    rules.processAbilityEvent(state, root);
    expect(choose(state, 'p2').ok).toBe(true);
    expect(state.players.find(p => p.id === 'p1')!.vp).toBe(4);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    rules.processAbilityEvent(state, root);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.players.find(p => p.id === 'p1')!.vp).toBe(4);
  });
});
