import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { MatchSession } from '../../src/match-session';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const PARENT = 'fixture.ruler.parent';
const USE = 'fixture.ruler.use';
const FREE = 'fixture.ruler.free-card';
const BLOCKED = 'fixture.ruler.blocked-card';
const PARENT_INSTANCE = 'fixture.ruler.parent.instance';
const USE_INSTANCE = 'fixture.ruler.use.instance';
const OTHER_USE_INSTANCE = 'fixture.ruler.use.other';
const FREE_INSTANCE = 'fixture.ruler.free-card.instance';
const BLOCKED_INSTANCE = 'fixture.ruler.blocked-card.instance';
const PARENT_ABILITY = 'ruler-bind';
const USE_ABILITY = 'ruler-use';

function parentAbility() {
  return {
    id: PARENT_ABILITY,
    kind: 'phase_action',
    printedClause: 'fixture ruler binding',
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [],
    targets: [{
      id: 'bound_players', type: 'player', count: { min: 2, max: 2 },
      constraints: [{ type: 'not_controller' }, { type: 'least_ruler_binding_count' }],
    }],
    effects: [
      { type: 'grant_ruler_seals', target: 'bound_players' },
      { type: 'ruler_copy_steal_guard', policy: 'forbid_source_and_effects' },
    ],
    cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {},
    limit: { type: 'per_game', uses: 3, scope: 'this_card' }, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function useAbility() {
  return {
    id: USE_ABILITY,
    kind: 'phase_action',
    printedClause: 'fixture ruler seal use',
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [],
    targets: [
      { id: 'ruler_seal_option', type: 'choice', count: { min: 1, max: 1 }, options: [{ id: 'move' }, { id: 'lock_movement' }, { id: 'free_play_reward' }] },
      { id: 'bound_player', type: 'player', count: { min: 1, max: 1 }, constraints: [{ type: 'bound_by_controller_ruler_seal' }] },
    ],
    effects: [{ type: 'use_ruler_seal', target: 'bound_player', option: 'ruler_seal_option', moveDestinations: ['miyama_town', 'shinto'], rewardVp: 2 }],
    cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {},
    limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function archive() {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: 'fixture.ruler.archive', name: 'Ruler fixture', cards: [
      {
        id: PARENT, name: 'Ruler Parent', cardType: 'servant_skill', cardFace: { cost: 0, basePower: 0, attributes: [] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [parentAbility()],
      },
      {
        id: USE, name: 'Ruler Seal', cardType: 'servant_skill', cardFace: { cost: 0, basePower: 0, attributes: [] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [useAbility()],
      },
      {
        id: FREE, name: 'Expensive Free Play', cardType: 'basic_attack', cardFace: { cost: 7, basePower: 1, attributes: [] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
      {
        id: BLOCKED, name: 'Requirement Blocked', cardType: 'basic_attack', cardFace: { cost: 0, basePower: 1, attributes: [] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [{ type: 'controller_mana_at_least', value: 8 }], abilities: [],
      },
    ],
  } as any;
}

function addInstance(state: GameState, instanceId: string, definitionId: string, playerId: string, zone: string) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: playerId, controllerPlayerId: playerId, zone,
    visibility: zone === 'field' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: playerId } } as any);
}

function setup() {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.cards = [];
  state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  state.players[0]!.locationId = 'recon'; state.players[1]!.locationId = 'recon'; state.players[2]!.locationId = 'shinto'; state.players[3]!.locationId = 'miyama_town';
  addInstance(state, PARENT_INSTANCE, PARENT, 'p1', 'skill');
  addInstance(state, USE_INSTANCE, USE, 'p1', 'skill');
  addInstance(state, OTHER_USE_INSTANCE, USE, 'p3', 'skill');
  addInstance(state, FREE_INSTANCE, FREE, 'p2', 'hand');
  addInstance(state, BLOCKED_INSTANCE, BLOCKED, 'p2', 'hand');
  rules.initializeAbilityRuntime(state, pack, { seed: 20260919 });
  for (const id of [PARENT_INSTANCE, USE_INSTANCE, OTHER_USE_INSTANCE]) {
    state.abilityRuntime!.cardState[id] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  }
  return state;
}

function activate(state: GameState, playerId: string, cardInstanceId: string, abilityId: string) {
  const result = rules.dispatchAbilityCommand(state, playerId, { type: 'activate_ability', cardInstanceId, abilityId });
  expect(result.ok).toBe(true);
  return state.abilityRuntime!.pendingDecision!;
}
function choose(state: GameState, playerId: string, selectedIds: string[]) {
  const pending = state.abilityRuntime!.pendingDecision!;
  const result = rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: pending.id, selectedIds });
  return result;
}
function grantToP2P3(state: GameState) {
  const pending = activate(state, 'p1', PARENT_INSTANCE, PARENT_ABILITY);
  expect(pending.candidates).toEqual(expect.arrayContaining(['p2', 'p3']));
  expect(choose(state, 'p1', ['p2', 'p3']).ok).toBe(true);
  expect(state.abilityRuntime!.rulerSealBindings).toHaveLength(2);
}
function openUse(state: GameState, branch: 'move' | 'lock_movement' | 'free_play_reward', expectedBoundIds: string[] = ['p2', 'p3']) {
  const first = activate(state, 'p1', USE_INSTANCE, USE_ABILITY);
  expect(first.candidates).toEqual(['move', 'lock_movement', 'free_play_reward']);
  expect(choose(state, 'p1', [branch]).ok).toBe(true);
  const second = state.abilityRuntime!.pendingDecision!;
  expect(second.candidates).toEqual(expect.arrayContaining(expectedBoundIds));
  return second;
}

describe('P3-FB2-27 Ruler seal relationship subsystem', () => {
  it('recognizes only the exact identity-free structural contracts and fails closed on near-matches', () => {
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report).toEqual([]);
    expect(rules.isRulerSealBindingSemantic(loaded.cards[PARENT]!.abilities[0]!)).toBe(true);
    expect(rules.isRulerSealUseSemantic(loaded.cards[USE]!.abilities[0]!)).toBe(true);

    const badCount = archive();
    badCount.cards[0].abilities[0].targets[0].count.max = 3;
    expect(rules.loadAuthoringJson(badCount).report).toContainEqual(expect.objectContaining({ path: 'rulerSeal.gateway', status: 'unsupported' }));

    const badGuard = archive();
    badGuard.cards[0].abilities[0].effects[1].policy = 'allow';
    expect(rules.loadAuthoringJson(badGuard).report).toContainEqual(expect.objectContaining({ path: 'rulerSeal.gateway', status: 'unsupported' }));

    const badReward = archive();
    badReward.cards[1].abilities[0].effects[0].rewardVp = 3;
    expect(rules.loadAuthoringJson(badReward).report).toContainEqual(expect.objectContaining({ path: 'rulerSeal.gateway', status: 'unsupported' }));

    const replacedUseEffect = archive();
    replacedUseEffect.cards[1].abilities[0].effects[0] = { type: 'noop' };
    expect(rules.loadAuthoringJson(replacedUseEffect).report).toContainEqual(expect.objectContaining({ path: 'rulerSeal.gateway', status: 'unsupported' }));

    const replacedBindingEffects = archive();
    replacedBindingEffects.cards[0].abilities[0].effects = [{ type: 'noop' }];
    expect(rules.loadAuthoringJson(replacedBindingEffects).report).toContainEqual(expect.objectContaining({ path: 'rulerSeal.gateway', status: 'unsupported' }));

    const badDestination = archive();
    badDestination.cards[1].abilities[0].effects[0].moveDestinations = ['miyama_town'];
    expect(rules.loadAuthoringJson(badDestination).report).toContainEqual(expect.objectContaining({ path: 'rulerSeal.gateway', status: 'unsupported' }));

    const badActiveRequirement = archive();
    badActiveRequirement.cards[0].abilities[0].activation.requiresSourceState = 'active';
    expect(rules.loadAuthoringJson(badActiveRequirement).report).toContainEqual(expect.objectContaining({ path: 'rulerSeal.gateway', status: 'unsupported' }));

    const badGenericUseLimit = archive();
    badGenericUseLimit.cards[1].abilities[0].limit = { type: 'per_game', uses: 1, scope: 'this_card' };
    expect(rules.loadAuthoringJson(badGenericUseLimit).report).toContainEqual(expect.objectContaining({ path: 'rulerSeal.gateway', status: 'unsupported' }));
  });

  it('requires an exact two-player least-bound selection and preserves game-long binding history after spending', () => {
    const state = setup();
    state.abilityRuntime!.rulerSealBindingHistory = { p1: { p2: 0, p3: 1, p4: 1 } };
    const pending = activate(state, 'p1', PARENT_INSTANCE, PARENT_ABILITY);
    expect(pending.candidates).toEqual(expect.arrayContaining(['p2', 'p3', 'p4']));

    const before = structuredClone(state);
    const rejected = choose(state, 'p1', ['p3', 'p4']);
    expect(rejected.ok).toBe(false);
    expect(rejected.rejection?.code).toBe('illegal_target');
    expect(state).toEqual(before);

    expect(choose(state, 'p1', ['p2', 'p3']).ok).toBe(true);
    expect(state.abilityRuntime!.rulerSealBindingHistory.p1).toMatchObject({ p2: 1, p3: 2, p4: 1 });

    const useChoice = activate(state, 'p1', USE_INSTANCE, USE_ABILITY);
    expect(choose(state, 'p1', ['lock_movement']).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision!.candidates).toContain('p2');
    expect(choose(state, 'p1', ['p2']).ok).toBe(true);
    expect(state.abilityRuntime!.rulerSealBindings.find((entry) => entry.boundPlayerId === 'p2')?.spent).toBe(true);
    expect(state.abilityRuntime!.rulerSealBindingHistory.p1!.p2).toBe(1);
    expect(useChoice).toBeTruthy();
  });

  it('matches the Reference sequential least-bound rule when the first binding still leaves the same player uniquely least-bound', () => {
    const state = setup();
    state.abilityRuntime!.rulerSealBindingHistory = { p1: { p2: 0, p3: 2, p4: 2 } };
    expect(rules.legalRulerSealBindingPairs(state, 'p1')).toEqual([]);
    expect(rules.eligibleLeastBoundPlayerIds(state, 'p1', 2)).toEqual([]);
    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual({ type: 'activate_ability', cardInstanceId: PARENT_INSTANCE, abilityId: PARENT_ABILITY });

    state.abilityRuntime!.rulerSealBindingHistory = { p1: { p2: 0, p3: 1, p4: 1 } };
    expect(rules.legalRulerSealBindingPairs(state, 'p1')).toEqual(expect.arrayContaining([['p2', 'p3'], ['p2', 'p4']]));
    const pending = activate(state, 'p1', PARENT_INSTANCE, PARENT_ABILITY);
    expect(pending.candidates).toEqual(expect.arrayContaining(['p2', 'p3', 'p4']));
    expect(choose(state, 'p1', ['p3', 'p4']).ok).toBe(false);
    expect(choose(state, 'p1', ['p2', 'p4']).ok).toBe(true);
  });

  it('scopes least-bound history per Ruler issuer so one controller never pollutes another controller selection', () => {
    const state = setup();
    state.abilityRuntime!.rulerSealBindingHistory = { p1: { p2: 3, p3: 0, p4: 0 }, p3: { p1: 0, p2: 0, p4: 4 } };

    expect(rules.eligibleLeastBoundPlayerIds(state, 'p1', 2)).toEqual(expect.arrayContaining(['p3', 'p4']));
    expect(rules.eligibleLeastBoundPlayerIds(state, 'p1', 2)).not.toContain('p2');
    expect(rules.eligibleLeastBoundPlayerIds(state, 'p3', 2)).toEqual(expect.arrayContaining(['p1', 'p2']));
    expect(rules.eligibleLeastBoundPlayerIds(state, 'p3', 2)).not.toContain('p4');
  });

  it('only lets the issuer spend its seal and consumes a seal exactly once', () => {
    const state = setup(); grantToP2P3(state);
    expect(rules.getLegalActions(state, 'p3')).not.toContainEqual({ type: 'activate_ability', cardInstanceId: OTHER_USE_INSTANCE, abilityId: USE_ABILITY });

    openUse(state, 'lock_movement');
    expect(choose(state, 'p1', ['p2']).ok).toBe(true);
    const p2Binding = state.abilityRuntime!.rulerSealBindings.find((entry) => entry.boundPlayerId === 'p2')!;
    expect(p2Binding.spent).toBe(true);
    expect(rules.unspentRulerSealBindings(state, 'p1', 'p2')).toHaveLength(0);
    expect(state.abilityRuntime!.events.filter((event) => event.type === 'ruler_seal_spent' && event.playerId === 'p2')).toHaveLength(1);
  });

  it('can consume multiple distinct Ruler seals in the same round while each physical seal remains once-only', () => {
    const state = setup(); grantToP2P3(state);

    openUse(state, 'lock_movement');
    expect(choose(state, 'p1', ['p2']).ok).toBe(true);
    expect(rules.unspentRulerSealBindings(state, 'p1', 'p2')).toHaveLength(0);
    expect(rules.getLegalActions(state, 'p1')).toContainEqual({ type: 'activate_ability', cardInstanceId: USE_INSTANCE, abilityId: USE_ABILITY });

    openUse(state, 'move', ['p3']);
    expect(choose(state, 'p1', ['p3']).ok).toBe(true);
    expect(choose(state, 'p1', ['miyama_town']).ok).toBe(true);
    expect(rules.unspentRulerSealBindings(state, 'p1')).toHaveLength(0);
    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual({ type: 'activate_ability', cardInstanceId: USE_INSTANCE, abilityId: USE_ABILITY });
  });

  it('moves only to the structurally declared destinations', () => {
    const state = setup(); grantToP2P3(state);
    openUse(state, 'move');
    expect(choose(state, 'p1', ['p2']).ok).toBe(true);
    const destination = state.abilityRuntime!.pendingDecision!;
    expect(destination.candidates).toEqual(['miyama_town', 'shinto']);
    expect(choose(state, 'p1', ['miyama_town']).ok).toBe(true);
    expect(state.players[1]!.locationId).toBe('miyama_town');
  });

  it('fails the Ruler move continuation transactionally when the selected destination becomes non-occupiable', () => {
    const state = setup(); grantToP2P3(state);
    openUse(state, 'move');
    expect(choose(state, 'p1', ['p2']).ok).toBe(true);
    state.ruleOverrides ??= {};
    state.ruleOverrides.occupancyLimitByLocation = { ...(state.ruleOverrides.occupancyLimitByLocation ?? {}), miyama_town: 1 };
    state.players[3]!.locationId = 'miyama_town';
    const before = structuredClone(state);
    const rejected = choose(state, 'p1', ['miyama_town']);
    expect(rejected.ok).toBe(false);
    expect(state).toEqual(before);
    expect(choose(state, 'p1', ['shinto']).ok).toBe(true);
    expect(state.players[1]!.locationId).toBe('shinto');
  });

  it('locks movement for the current round, expires next round, and the product MatchSession deployment boundary honors the lock', () => {
    const state = setup(); grantToP2P3(state);
    openUse(state, 'lock_movement');
    expect(choose(state, 'p1', ['p2']).ok).toBe(true);
    expect(rules.rulerSealMovementLocked(state, 'p2')).toBe(true);
    const blockedCoreMove = rules.movePlayer(state, { playerId: 'p2', to: 'shinto', movementKind: 'effect' });
    expect(blockedCoreMove.moved).toBe(false);
    expect(blockedCoreMove.reason).toBe('movement_locked');
    rules.advanceAbilityPhase(state, 'action', state.round.roundNumber + 1);
    expect(rules.rulerSealMovementLocked(state, 'p2')).toBe(false);

    const session = new MatchSession({ seed: 20260919, humanPlayerId: 'p1', humanPlayerIds: ['p1'] });
    session.state.round.activePhase = 'advance'; session.state.round.prioritySeat = 1;
    delete session.state.players[0]!.locationId;
    session.state.ruleOverrides ??= {};
    session.state.ruleOverrides.rulerSealMovementLockRoundByPlayer = { p1: session.state.round.roundNumber };
    expect(session.legalDeploymentActions('p1')).toEqual([]);
    expect(session.dispatchPlayerCommand('p1', { type: 'deploy_player', locationId: 'miyama_town' }).ok).toBe(false);
  });

  it('lets the bound player optionally play one hand card for zero mana and rewards the issuer exactly once on that player winning', () => {
    const state = setup(); grantToP2P3(state);
    state.players[1]!.mana = 0;
    const issuerVp = state.players[0]!.vp;
    openUse(state, 'free_play_reward');
    expect(choose(state, 'p1', ['p2']).ok).toBe(true);

    const freePlay = state.abilityRuntime!.pendingDecision!;
    expect(freePlay.controllerId).toBe('p2');
    expect(freePlay.candidates).toContain(FREE_INSTANCE);
    expect(freePlay.candidates).not.toContain(BLOCKED_INSTANCE);
    expect(choose(state, 'p2', [FREE_INSTANCE]).ok).toBe(true);
    expect(state.players[1]!.mana).toBe(0);
    expect(state.cards.find((card) => card.instanceId === FREE_INSTANCE)!.zone).toBe('attack_area');

    const battle = { id: 'ruler-battle-win', type: 'after_battle_result_determined', battleParticipantIds: ['p2', 'p3'], battleResult: { winners: ['p2'], loserIds: ['p3'] } } as any;
    rules.processAbilityEvent(state, battle);
    expect(state.players[0]!.vp).toBe(issuerVp + 2);
    expect(state.abilityRuntime!.pendingRulerSealRewards).toEqual([]);
    const rewardEvents = state.abilityRuntime!.events.filter((event) => event.type === 'victory_points_adjusted' && event.triggerEventId === battle.id);
    expect(rewardEvents).toHaveLength(1);

    rules.processAbilityEvent(state, battle);
    expect(state.players[0]!.vp).toBe(issuerVp + 2);
    expect(state.abilityRuntime!.events.filter((event) => event.type === 'victory_points_adjusted' && event.triggerEventId === battle.id)).toHaveLength(1);

    const after = structuredClone(state);
    const replayedChoice = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: freePlay.id, selectedIds: [FREE_INSTANCE] });
    expect(replayedChoice.ok).toBe(false);
    expect(state).toEqual(after);
  });

  it('fails closed mutation-free when a Ruler private continuation is stale or corrupt', () => {
    const state = setup(); grantToP2P3(state);
    openUse(state, 'free_play_reward');
    expect(choose(state, 'p1', ['p2']).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.interaction?.kind).toBe('ruler_seal_free_play_v1');
    (pending.interaction as any).createdRevision += 1;
    const before = structuredClone(state);
    const result = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: pending.id, selectedIds: [] });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('resolution_failed');
    expect(state).toEqual(before);
  });

  it('arms the same delayed reward even when the bound player declines the free play, then consumes it on the relevant loss without VP', () => {
    const state = setup(); grantToP2P3(state);
    const issuerVp = state.players[0]!.vp;
    openUse(state, 'free_play_reward');
    expect(choose(state, 'p1', ['p2']).ok).toBe(true);
    expect(choose(state, 'p2', []).ok).toBe(true);
    expect(state.abilityRuntime!.pendingRulerSealRewards).toHaveLength(1);

    rules.processAbilityEvent(state, { id: 'ruler-battle-loss', type: 'after_battle_result_determined', battleParticipantIds: ['p2', 'p3'], battleResult: { winners: ['p3'], loserIds: ['p2'] } } as any);
    expect(state.players[0]!.vp).toBe(issuerVp);
    expect(state.abilityRuntime!.pendingRulerSealRewards).toEqual([]);
  });
});
