import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import { dispatchAbilityCommand, getLegalActions, initializeAbilityRuntime, isCanonicalGenericPendingDecisionForRestore } from '../../src/ability/interpreter';
import type { GameState } from '../../src/schema/game';
import { projectCurrentPlayerTotalPower } from '../../src/core/combat-resolver';

const ROOT = 'servant.fixture-cross-phase-redeployment';
const SOURCE = `${ROOT}.skill.source`;
const PROVIDER = 'fixture.cross-phase-provider';
const REUSE = 'fixture.one-shot-reuse';
const TARGET_DEF = 'fixture.reusable-attack';
const TARGET_ABILITY = 'fixture.reusable-action';
const TARGET_ABILITY_2 = 'fixture.reusable-combat';
const REDEPLOY = 'fixture.strict-power-redeploy';

function commonAbility(id: string, kind: 'passive' | 'phase_action') {
  return {
    id, kind, printedClause: id,
    activation: {}, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}
function archive() {
  const provider = commonAbility(PROVIDER, 'passive');
  provider.activation = { trigger: 'while_active', requiresSourceState: 'active' };
  provider.effects = [{ type: 'grant_controller_action_abilities_in_combat_while_source_active' }];
  provider.lifecycle = {
    starts: 'immediate', duration: 'while_card_active', cleanup: 'when_card_leaves_active_area',
    sourceValidity: { kind: 'accepted_source_state_policy', owner: 'card_zone_source_state', policyId: 'fd.card-zone.active-card-source.v1' },
  };
  const reuse = commonAbility(REUSE, 'phase_action');
  reuse.activation = { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' };
  reuse.targets = [{ id: 'reused_attack_ability_source', type: 'card_instance', scope: { zone: 'attack_area', controller: 'self', owner: 'controller' },
    count: { min: 1, max: 1 }, visibility: 'public', constraints: [{ type: 'is_attack' }] }];
  reuse.effects = [{ type: 'grant_one_extra_used_attack_ability_activation_this_round', target: 'reused_attack_ability_source' }];
  reuse.limit = { type: 'unique', scope: 'unique_keyword_group', groupId: 'fixture-unique-reuse', window: 'controller_combat_action_window',
    conflictPolicy: 'only_one_effect_may_activate_per_window' };
  const redeploy = commonAbility(REDEPLOY, 'phase_action');
  redeploy.activation = { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' };
  redeploy.targets = [{ id: 'power_comparison_opponent', type: 'player', count: { min: 1, max: 1 }, visibility: 'public',
    constraints: [{ type: 'not_controller' }] }];
  redeploy.effects = [{ type: 'compare_current_total_power_and_swap_locations_if_strictly_higher', target: 'power_comparison_opponent' }];
  return {
    schemaVersion: 'fd-card-authoring-v1', id: ROOT,
    cards: [{ id: SOURCE, name: SOURCE, cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
      cardFace: { attributes: ['特殊'], cost: 0, basePower: 0 }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [], abilities: [provider, reuse, redeploy], verification: { implementationStatus: 'complete' } }],
  } as any;
}
function addTargetDefinition(state: GameState) {
  state.abilityRuntime!.pack.cards[TARGET_DEF] = {
    id: TARGET_DEF, name: TARGET_DEF, cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower: 3 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], playKind: 'attack', destinationZone: 'attack_area',
    abilities: [{ id: TARGET_ABILITY, kind: 'phase_action', printedClause: 'gain one mana',
      activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' }, conditions: [], targets: [],
      effects: [{ type: 'adjust_mana', player: 'controller', amount: 1 }], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
      responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] } }], mode: 'automatic',
  } as any;
}
function addCard(state: GameState, definitionId: string, zone: 'field' | 'attack_area', owner = 'p1') {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone, visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState[instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function addPowerAttack(state: GameState, id: string, owner: string, basePower: number) {
  state.abilityRuntime!.pack.cards[id] = {
    id, name: id, cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
    mode: 'automatic', playKind: 'attack', destinationZone: 'attack_area',
  } as any;
  const instanceId = `${id}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId: id, ownerPlayerId: owner, controllerPlayerId: owner, zone: 'attack_area', visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState[instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const pack = loadAuthoringJson(archive());
  expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState(); state.cards = []; state.players[0]!.servantCardId = ROOT; state.players[0]!.mana = 5;
  initializeAbilityRuntime(state, pack, { seed: 20260930 }); addTargetDefinition(state);
  const source = addCard(state, SOURCE, 'field'); const target = addCard(state, TARGET_DEF, 'attack_area');
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  return { state, source, target };
}
function activate(state: GameState, cardInstanceId: string, abilityId: string) {
  return dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId, abilityId });
}
function legalAbility(state: GameState, cardInstanceId: string, abilityId: string) {
  return getLegalActions(state, 'p1').some((action) => action.type === 'activate_ability' &&
    action.cardInstanceId === cardInstanceId && action.abilityId === abilityId);
}

describe('P3 Ushiwakamaru owner-readiness cross-phase/reuse capability', () => {
  it('fails closed at the loader gateway for a widened privileged provider shape', () => {
    const bad = archive(); bad.cards[0].abilities[0].effects[0].extra = true;
    const pack = loadAuthoringJson(bad);
    expect(pack.cards[SOURCE]!.abilities[0]!.execution.mode).toBe('unsupported');
    expect(pack.report.some((entry) => entry.path === 'crossPhaseRedeployment.gateway')).toBe(true);
  });

  it('keeps an action ability legal in action and additionally permits it in combat only while a live provider remains', () => {
    const { state, source, target } = setup();
    expect(legalAbility(state, target, TARGET_ABILITY)).toBe(true);
    expect(activate(state, target, TARGET_ABILITY).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(6);
    state.round.activePhase = 'battle';
    // Ordinary once-per-round usage still blocks the already-used target before a reuse grant exists.
    expect(legalAbility(state, target, TARGET_ABILITY)).toBe(false);
    // A fresh otherwise-action ability proves the provider supplies the combat phase bridge.
    state.abilityRuntime!.usedAbilities[`${target}:${TARGET_ABILITY}`] = state.round.roundNumber - 1;
    state.abilityRuntime!.abilityUsage[`${target}:${TARGET_ABILITY}:round:${state.round.roundNumber}`] = 0;
    expect(legalAbility(state, target, TARGET_ABILITY)).toBe(true);
    state.abilityRuntime!.cardState[source]!.active = false;
    expect(legalAbility(state, target, TARGET_ABILITY)).toBe(false);
  });

  it('grants exactly one extra activation of the exact already-used attack ability without changing its original usage count', () => {
    const { state, source, target } = setup();
    expect(activate(state, target, TARGET_ABILITY).ok).toBe(true);
    const usageKey = `${target}:${TARGET_ABILITY}:round:${state.round.roundNumber}`;
    expect(state.abilityRuntime!.abilityUsage[usageKey]).toBe(1);
    state.round.activePhase = 'battle';
    expect(activate(state, source, REUSE).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.candidates).toEqual([target]);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [target] }).ok).toBe(true);
    expect(state.abilityRuntime!.oneShotAbilityReuseGrants).toEqual([expect.objectContaining({ targetCardId: target, targetAbilityId: TARGET_ABILITY, consumed: false })]);
    expect(legalAbility(state, target, TARGET_ABILITY)).toBe(true);
    expect(activate(state, target, TARGET_ABILITY).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(7);
    expect(state.abilityRuntime!.abilityUsage[usageKey]).toBe(1);
    expect(state.abilityRuntime!.oneShotAbilityReuseGrants![0]!.consumed).toBe(true);
    expect(legalAbility(state, target, TARGET_ABILITY)).toBe(false);
  });

  it('lets the controller choose exactly one already-used ability when one attack has multiple eligible abilities', () => {
    const { state, source, target } = setup();
    const def = state.abilityRuntime!.pack.cards[TARGET_DEF]!;
    def.abilities.push({
      id: TARGET_ABILITY_2, kind: 'phase_action', printedClause: 'combat reusable',
      activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
      conditions: [], targets: [], effects: [{ type: 'adjust_mana', player: 'controller', amount: 2 }], cost: [], ruleModifiers: [], creates: [],
      lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
      limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
    } as any);
    expect(activate(state, target, TARGET_ABILITY).ok).toBe(true);
    state.round.activePhase = 'battle';
    expect(activate(state, target, TARGET_ABILITY_2).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(8);
    expect(activate(state, source, REUSE).ok).toBe(true);
    const cardDecision = state.abilityRuntime!.pendingDecision!;
    expect(cardDecision.candidates).toEqual([target]);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: cardDecision.id, selectedIds: [target] }).ok).toBe(true);
    const abilityDecision = state.abilityRuntime!.pendingDecision!;
    expect(abilityDecision.interaction?.kind).toBe('one_shot_ability_reuse_choice_v1');
    expect(abilityDecision.candidates).toEqual([TARGET_ABILITY, TARGET_ABILITY_2]);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: abilityDecision.id, selectedIds: [TARGET_ABILITY_2] }).ok).toBe(true);
    expect(state.abilityRuntime!.oneShotAbilityReuseGrants).toEqual([
      expect.objectContaining({ targetCardId: target, targetAbilityId: TARGET_ABILITY_2, consumed: false }),
    ]);
    expect(activate(state, target, TARGET_ABILITY_2).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(10);
    expect(legalAbility(state, target, TARGET_ABILITY_2)).toBe(false);
    expect(legalAbility(state, target, TARGET_ABILITY)).toBe(false);
  });

  it('restore-validates the exact second-stage reuse choice and rejects forged candidate authority', () => {
    const { state, source, target } = setup();
    const def = state.abilityRuntime!.pack.cards[TARGET_DEF]!;
    def.abilities.push({
      id: TARGET_ABILITY_2, kind: 'phase_action', printedClause: 'combat reusable',
      activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
      conditions: [], targets: [], effects: [{ type: 'adjust_mana', player: 'controller', amount: 2 }], cost: [], ruleModifiers: [], creates: [],
      lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
      limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
    } as any);
    expect(activate(state, target, TARGET_ABILITY).ok).toBe(true);
    state.round.activePhase = 'battle';
    expect(activate(state, target, TARGET_ABILITY_2).ok).toBe(true);
    expect(activate(state, source, REUSE).ok).toBe(true);
    const cardDecision = state.abilityRuntime!.pendingDecision!;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: cardDecision.id, selectedIds: [target] }).ok).toBe(true);
    const abilityDecision = state.abilityRuntime!.pendingDecision!;
    expect(isCanonicalGenericPendingDecisionForRestore(state, abilityDecision)).toBe(true);
    const forged = structuredClone(abilityDecision);
    forged.candidates = [TARGET_ABILITY, 'forged.ability'];
    expect(isCanonicalGenericPendingDecisionForRestore(state, forged)).toBe(false);
  });

  it('fails closed for an unused/foreign/inactive target rather than staging a widened reuse choice', () => {
    const { state, source, target } = setup(); state.round.activePhase = 'battle';
    expect(legalAbility(state, source, REUSE)).toBe(false);
    state.abilityRuntime!.usedAbilities[`${target}:${TARGET_ABILITY}`] = state.round.roundNumber;
    state.abilityRuntime!.abilityUsage[`${target}:${TARGET_ABILITY}:round:${state.round.roundNumber}`] = 1;
    state.cards.find((card) => card.instanceId === target)!.controllerPlayerId = 'p2';
    expect(legalAbility(state, source, REUSE)).toBe(false);
    state.cards.find((card) => card.instanceId === target)!.controllerPlayerId = 'p1';
    state.abilityRuntime!.cardState[target]!.active = false;
    expect(legalAbility(state, source, REUSE)).toBe(false);
  });

  it('invalidates an unconsumed reuse grant on provider control loss', () => {
    const { state, source, target } = setup();
    expect(activate(state, target, TARGET_ABILITY).ok).toBe(true); state.round.activePhase = 'battle';
    expect(activate(state, source, REUSE).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [target] }).ok).toBe(true);
    state.cards.find((card) => card.instanceId === source)!.controllerPlayerId = 'p2';
    expect(legalAbility(state, target, TARGET_ABILITY)).toBe(false);
  });


  it('fails closed at the loader gateway for a widened strict-power redeployment shape', () => {
    const bad = archive();
    bad.cards[0].abilities.find((ability: any) => ability.id === REDEPLOY).effects[0].allowTie = true;
    const pack = loadAuthoringJson(bad);
    const ability = pack.cards[SOURCE]!.abilities.find((candidate) => candidate.id === REDEPLOY)!;
    expect(ability.execution.mode).toBe('unsupported');
    expect(pack.report.some((entry) => entry.path === 'crossPhaseRedeployment.gateway')).toBe(true);
  });

  it('uses current authoritative Power without firing battle triggers and atomically swaps only the chosen pair on a strict win', () => {
    const { state, source } = setup();
    state.players[0]!.locationId = 'shinto';
    state.players[1]!.locationId = 'miyama_town';
    state.players[2]!.locationId = 'recon';
    state.eventPlacements = [];
    addPowerAttack(state, 'fixture.power.high', 'p1', 20);
    addPowerAttack(state, 'fixture.power.low', 'p2', 1);
    const beforeProcessed = [...state.abilityRuntime!.processedEvents];
    const p1Power = projectCurrentPlayerTotalPower(state, 'p1')!;
    const p2Power = projectCurrentPlayerTotalPower(state, 'p2')!;
    expect(p1Power.effectivePower).toBeGreaterThan(p2Power.effectivePower);
    // The comparison projection itself is read-only and must not fire battle/deployment triggers.
    expect(state.abilityRuntime!.processedEvents).toEqual(beforeProcessed);
    expect(activate(state, source, REDEPLOY).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.candidates).toContain('p2');
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: ['p2'] }).ok).toBe(true);
    expect(state.players[0]!.locationId).toBe('miyama_town');
    expect(state.players[1]!.locationId).toBe('shinto');
    expect(state.players[2]!.locationId).toBe('recon');
    expect(state.abilityRuntime!.processedEvents.length).toBeGreaterThan(beforeProcessed.length);
    expect(state.abilityRuntime!.events.some((event) => event.type === 'players_redeployed_by_power_comparison')).toBe(true);
  });

  it('applies ordinary destination deployment reward after a successful atomic swap', () => {
    const { state, source } = setup();
    state.players[0]!.locationId = 'shinto'; state.players[0]!.mana = 0;
    state.players[1]!.locationId = 'magic_workshop'; state.players[1]!.mana = 0;
    state.eventPlacements = [];
    addPowerAttack(state, 'fixture.power.reward.high', 'p1', 30); addPowerAttack(state, 'fixture.power.reward.low', 'p2', 1);
    expect(activate(state, source, REDEPLOY).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: ['p2'] }).ok).toBe(true);
    expect(state.players[0]!.locationId).toBe('magic_workshop');
    expect(state.players[0]!.mana).toBe(2);
    expect(state.abilityRuntime!.events.some((event) => event.type === 'deployment_location_mana_awarded' && event.playerId === 'p1')).toBe(true);
  });

  it('keeps all deployment state unchanged when controller Power is not strictly higher', () => {
    const { state, source } = setup();
    state.players[0]!.locationId = 'shinto'; state.players[1]!.locationId = 'miyama_town';
    state.eventPlacements = [];
    addPowerAttack(state, 'fixture.power.weak', 'p1', 0); addPowerAttack(state, 'fixture.power.strong', 'p2', 30);
    const before = state.players.map((player) => [player.id, player.locationId]);
    expect(activate(state, source, REDEPLOY).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: ['p2'] }).ok).toBe(true);
    expect(state.players.map((player) => [player.id, player.locationId])).toEqual(before);
    expect(state.abilityRuntime!.events.some((event) => event.type === 'players_redeployed_by_power_comparison')).toBe(false);
  });

  it('fails the whole swap atomically when either destination is illegal and leaks no deployment reward/event', () => {
    const { state, source } = setup();
    state.players[0]!.locationId = 'shinto'; state.players[1]!.locationId = 'miyama_town';
    state.eventPlacements = [];
    addPowerAttack(state, 'fixture.power.blocked.high', 'p1', 30); addPowerAttack(state, 'fixture.power.blocked.low', 'p2', 1);
    (state as any).ruleOverrides ??= {};
    (state.ruleOverrides as any).occupancyLimitByLocation = { ...(state.ruleOverrides as any).occupancyLimitByLocation, miyama_town: 0 };
    const beforePlayers = state.players.map((player) => ({ id: player.id, locationId: player.locationId, mana: player.mana, vp: player.vp }));
    const beforeEvents = structuredClone(state.abilityRuntime!.events);
    expect(activate(state, source, REDEPLOY).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    const result = dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: ['p2'] });
    expect(result.ok).toBe(false);
    expect(state.players.map((player) => ({ id: player.id, locationId: player.locationId, mana: player.mana, vp: player.vp }))).toEqual(beforePlayers);
    expect(state.abilityRuntime!.events).toEqual(beforeEvents);
  });

  it('treats same-location strict-win comparison as a no-op and does not fabricate a redeployment event', () => {
    const { state, source } = setup();
    state.players[0]!.locationId = 'shinto'; state.players[1]!.locationId = 'shinto'; state.eventPlacements = [];
    addPowerAttack(state, 'fixture.power.same.high', 'p1', 20); addPowerAttack(state, 'fixture.power.same.low', 'p2', 1);
    expect(projectCurrentPlayerTotalPower(state, 'p1')!.effectivePower).toBeGreaterThan(projectCurrentPlayerTotalPower(state, 'p2')!.effectivePower);
    expect(activate(state, source, REDEPLOY).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: ['p2'] }).ok).toBe(true);
    expect(state.players[0]!.locationId).toBe('shinto'); expect(state.players[1]!.locationId).toBe('shinto');
    expect(state.abilityRuntime!.events.some((event) => event.type === 'players_redeployed_by_power_comparison')).toBe(false);
  });

  it('swaps durable terrain occupants while preserving each physical location slot and leaves a third player untouched', () => {
    const { state, source } = setup();
    state.players[0]!.locationId = 'shinto'; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'recon';
    state.eventPlacements = [];
    addPowerAttack(state, 'fixture.power.terrain.high', 'p1', 30); addPowerAttack(state, 'fixture.power.terrain.low', 'p2', 1);
    (state as any).modeState = {
      terrainAssignments: { shinto: ['p1'], miyama_town: ['p2'] },
      terrainAssignmentSlots: { shinto: { p1: 1 }, miyama_town: { p2: 0 } },
    };
    expect(activate(state, source, REDEPLOY).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: ['p2'] }).ok).toBe(true);
    expect((state as any).modeState.terrainAssignments).toEqual({ shinto: ['p2'], miyama_town: ['p1'] });
    expect((state as any).modeState.terrainAssignmentSlots).toEqual({ shinto: { p2: 1 }, miyama_town: { p1: 0 } });
    expect(state.players[2]!.locationId).toBe('recon');
  });
});
