import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import {
  dispatchAbilityCommand, forcedDeploymentLocationForPlayer, getLegalActions, initializeAbilityRuntime,
  isCanonicalGenericPendingDecisionForRestore, isDeferredAbilityRuntimeProvenanceValidForRestore, processAbilityEvent,
} from '../../src/ability/interpreter';
import { terrainAdvantageAtLocation } from '../../src/ability/terrain-advantage-override';
import type { GameState } from '../../src/schema/game';
import { createMatchSession } from '../../src/match-session';

const ROOT = 'servant.fixture-terrain-fortification';
const TERRAIN_SOURCE = `${ROOT}.skill.terrain`;
const PLAY_SOURCE = `${ROOT}.skill.play`;
const DOUBLE = 'fixture.double-terrain';
const FORTIFY = 'fixture.fortify';
const EXTRA = 'fixture.extra-play';
const ATTACK_A = 'fixture.attack.a';
const ATTACK_B = 'fixture.attack.b';

function baseAbility(id: string) {
  return { id, kind: 'phase_action', printedClause: id, activation: {}, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [],
    lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] } } as any;
}
function archive() {
  const double = baseAbility(DOUBLE); double.activation = { phase: 'action', opens: 'controller_action_window' };
  double.conditions = [{ type: 'source_owned' }]; double.cost = [{ type: 'pay_mana', amount: 1 }];
  double.effects = [{ type: 'double_controller_terrain_this_round', multiplier: 2, duration: 'this_round' }];
  const fortify = baseAbility(FORTIFY); fortify.activation = { phase: 'combat', opens: 'controller_combat_action_window' };
  fortify.conditions = [{ type: 'source_owned' }]; fortify.cost = [{ type: 'pay_mana', amount: 1 }];
  fortify.effects = [{ type: 'fortify_moved_in_battlefield_and_arm_next_round_deployment', movedPlayerPowerAdjustment: -4, winDeployment: 'same_battlefield_next_round' }];
  const extra = baseAbility(EXTRA); extra.activation = { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' };
  extra.conditions = [{ type: 'source_owned' }];
  const handScope = { zone: 'hand', owner: 'controller', controller: 'self' };
  extra.targets = [
    { id: 'first_hand_card', type: 'card_instance', scope: handScope, count: { min: 1, max: 1 }, visibility: 'owner_only', constraints: [{ type: 'effect_playable_face_up' }] },
    { id: 'second_hand_card', type: 'card_instance', scope: handScope, count: { min: 0, max: 1 }, visibility: 'owner_only', constraints: [{ type: 'effect_playable_face_up' }], conditions: [{ type: 'controller_has_positive_terrain' }] },
  ];
  extra.effects = [{ type: 'play_hand_cards_with_terrain_optional_second', firstTarget: 'first_hand_card', secondTarget: 'second_hand_card', extraSecondMana: 2 }];
  const card = (id: string, abilities: any[]) => ({ id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
    cardFace: { attributes: ['特殊'], cost: 1, basePower: 1 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities,
    verification: { implementationStatus: 'complete' } });
  return { schemaVersion: 'fd-card-authoring-v1', id: ROOT, cards: [card(TERRAIN_SOURCE, [double, fortify]), card(PLAY_SOURCE, [extra])] } as any;
}
function addAttackDefinitions(state: GameState) {
  for (const [id, cost] of [[ATTACK_A, 1], [ATTACK_B, 2]] as const) {
    state.abilityRuntime!.pack.cards[id] = { id, name: id, cardType: 'servant_attack', cardFace: { attributes: ['力量'], cost, basePower: 2 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], playKind: 'attack', destinationZone: 'attack_area', abilities: [], mode: 'automatic' } as any;
  }
}
function addPhysical(state: GameState, definitionId: string, zone: string, active = false) {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
    visibility: zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const pack = loadAuthoringJson(archive()); expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] }); state.cards = []; state.players[0]!.servantCardId = ROOT;
  initializeAbilityRuntime(state, pack, { seed: 20260930 }); addAttackDefinitions(state);
  const terrainSource = addPhysical(state, TERRAIN_SOURCE, 'skill', false); const playSource = addPhysical(state, PLAY_SOURCE, 'attack_area', true);
  state.players[0]!.mana = 10; state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'miyama_town';
  state.round.prioritySeat = state.players[0]!.seat;
  (state as any).modeState = { terrainAssignments: { miyama_town: ['p1'] }, terrainAssignmentSlots: { miyama_town: { p1: 0 } } };
  return { state, terrainSource, playSource };
}
function activate(state: GameState, source: string, abilityId: string) { return dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId }); }
function choose(state: GameState, selectedIds: string[]) { const d = state.abilityRuntime!.pendingDecision!; return dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds }); }
function legal(state: GameState, source: string, abilityId: string) { return getLegalActions(state, 'p1').some((a) => a.type === 'activate_ability' && a.cardInstanceId === source && a.abilityId === abilityId); }

describe('P3 owner-readiness terrain fortification + extra hand-play capability', () => {
  it('fails closed at the loader gateway for widened privileged terrain shape', () => {
    const bad = archive(); bad.cards[0].abilities[0].effects[0].multiplier = 3;
    const pack = loadAuthoringJson(bad); expect(pack.cards[TERRAIN_SOURCE]!.abilities[0]!.execution.mode).toBe('unsupported');
    expect(pack.report.some((entry) => entry.path === 'terrainFortification.gateway')).toBe(true);
  });

  it('pays one mana and doubles only positive controller terrain for this round', () => {
    const { state, terrainSource } = setup(); state.round.activePhase = 'action';
    const before = terrainAdvantageAtLocation(state, 'p1', 'miyama_town'); expect(before).toBeGreaterThan(0); expect(legal(state, terrainSource, DOUBLE)).toBe(true);
    expect(activate(state, terrainSource, DOUBLE).ok).toBe(true); expect(state.players[0]!.mana).toBe(9);
    expect(terrainAdvantageAtLocation(state, 'p1', 'miyama_town')).toBe(before * 2);
  });

  it('does not expose terrain doubling without positive terrain and does not spend mana', () => {
    const { state, terrainSource } = setup(); (state as any).modeState.terrainAssignments = {}; (state as any).modeState.terrainAssignmentSlots = {};
    state.round.activePhase = 'action'; const before = state.players[0]!.mana;
    expect(legal(state, terrainSource, DOUBLE)).toBe(false); expect(activate(state, terrainSource, DOUBLE).ok).toBe(false); expect(state.players[0]!.mana).toBe(before);
  });

  it('penalizes only players who actually moved into the current battlefield this round', () => {
    const { state, terrainSource } = setup();
    processAbilityEvent(state, { id: 'move-p2', type: 'after_controller_enters_location', playerId: 'p2', previousLocationId: 'shinto', locationId: 'miyama_town', movementKind: 'normal' });
    state.round.activePhase = 'combat'; expect(legal(state, terrainSource, FORTIFY)).toBe(true); expect(activate(state, terrainSource, FORTIFY).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(9);
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments).toEqual([{ playerId: 'p2', amount: -4, round: state.round.roundNumber, sourceCardId: terrainSource, abilityId: FORTIFY }]);
  });

  it('arms an exact next-round battlefield deployment only after an authoritative win and preserves restore provenance', () => {
    const { state, terrainSource } = setup(); state.round.activePhase = 'combat'; expect(activate(state, terrainSource, FORTIFY).ok).toBe(true);
    const round = state.round.roundNumber;
    processAbilityEvent(state, { id: `battle-phase:${round}:battle:miyama_town:1:result`, type: 'after_battle_result_determined', battlePhaseResolutionId: `battle-phase:${round}`,
      battleId: `battle-phase:${round}:battle:miyama_town:1`, resultId: `battle-phase:${round}:battle:miyama_town:1:result`, battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1','p2'], battleParticipantPowers: { p1: 8, p2: 4 }, battleResult: { winners: ['p1'], loserIds: ['p2'] } });
    expect(state.abilityRuntime!.forcedDeploymentLocations).toMatchObject([{ playerId: 'p1', locationId: 'miyama_town', round: round + 1, sourceCardId: terrainSource, abilityId: FORTIFY }]);
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    state.round.roundNumber = round + 1; state.round.activePhase = 'advance'; expect(forcedDeploymentLocationForPlayer(state, 'p1')).toBe('miyama_town');
  });

  it('does not arm next-round deployment on a loss', () => {
    const { state, terrainSource } = setup(); state.round.activePhase = 'combat'; expect(activate(state, terrainSource, FORTIFY).ok).toBe(true); const round = state.round.roundNumber;
    processAbilityEvent(state, { id: `battle-phase:${round}:battle:miyama_town:1:result`, type: 'after_battle_result_determined', battlePhaseResolutionId: `battle-phase:${round}`,
      battleId: `battle-phase:${round}:battle:miyama_town:1`, resultId: `battle-phase:${round}:battle:miyama_town:1:result`, battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1','p2'], battleParticipantPowers: { p1: 4, p2: 8 }, battleResult: { winners: ['p2'], loserIds: ['p1'] } });
    expect(state.abilityRuntime!.forcedDeploymentLocations ?? []).toEqual([]);
  });

  it('effect-plays one hand card normally and offers the optional second only with terrain', () => {
    const { state, playSource } = setup(); const a = addPhysical(state, ATTACK_A, 'hand'); const b = addPhysical(state, ATTACK_B, 'hand'); state.round.activePhase = 'action';
    expect(legal(state, playSource, EXTRA)).toBe(true); expect(activate(state, playSource, EXTRA).ok).toBe(true); expect(state.abilityRuntime!.pendingDecision!.candidates.sort()).toEqual([a,b].sort());
    expect(choose(state, [a]).ok).toBe(true); expect(state.abilityRuntime!.pendingDecision!.candidates).toEqual([b]); expect(choose(state, [b]).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(5); expect(state.cards.find((c) => c.instanceId === a)!.zone).toBe('attack_area'); expect(state.cards.find((c) => c.instanceId === b)!.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[a]).toBe(1); expect(state.abilityRuntime!.cardPlayCountByInstance?.[b]).toBe(1);
  });

  it('without terrain the second target has no candidates and the first play still resolves through normal play semantics', () => {
    const { state, playSource } = setup(); (state as any).modeState.terrainAssignments = {}; (state as any).modeState.terrainAssignmentSlots = {};
    const a = addPhysical(state, ATTACK_A, 'hand'); addPhysical(state, ATTACK_B, 'hand'); state.round.activePhase = 'action';
    expect(activate(state, playSource, EXTRA).ok).toBe(true); expect(choose(state, [a]).ok).toBe(true); expect(state.abilityRuntime!.pendingDecision!.candidates).toEqual([]);
    expect(choose(state, []).ok).toBe(true); expect(state.players[0]!.mana).toBe(9); expect(state.abilityRuntime!.cardPlayCountByInstance?.[a]).toBe(1);
  });

  it('revalidates pending card candidates on restore and fails an unaffordable two-card transaction atomically', () => {
    const { state, playSource } = setup(); const a = addPhysical(state, ATTACK_A, 'hand'); const b = addPhysical(state, ATTACK_B, 'hand'); state.round.activePhase = 'action';
    expect(activate(state, playSource, EXTRA).ok).toBe(true); expect(isCanonicalGenericPendingDecisionForRestore(state, state.abilityRuntime!.pendingDecision!)).toBe(true);
    expect(choose(state, [a]).ok).toBe(true); expect(isCanonicalGenericPendingDecisionForRestore(state, state.abilityRuntime!.pendingDecision!)).toBe(true);
    state.players[0]!.mana = 4; const before = structuredClone({ mana: state.players[0]!.mana, a: state.cards.find((c) => c.instanceId === a)!.zone, b: state.cards.find((c) => c.instanceId === b)!.zone });
    expect(choose(state, [b]).ok).toBe(false); expect({ mana: state.players[0]!.mana, a: state.cards.find((c) => c.instanceId === a)!.zone, b: state.cards.find((c) => c.instanceId === b)!.zone }).toEqual(before);
  });

  it('enforces and consumes exact next-round deployment through the ordinary MatchSession deployment path', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const state = session.state; const player = state.players.find((candidate) => candidate.id === 'p1')!; player.vp = 0; delete player.locationId;
    state.round.activePhase = 'advance'; state.round.prioritySeat = player.seat;
    const definitionId = 'fixture.fortification.provider'; const instanceId = 'fixture-fortification-provider';
    const ability = baseAbility(FORTIFY); ability.activation = { phase: 'combat', opens: 'controller_combat_action_window' };
    ability.conditions = [{ type: 'source_owned' }]; ability.cost = [{ type: 'pay_mana', amount: 1 }];
    ability.effects = [{ type: 'fortify_moved_in_battlefield_and_arm_next_round_deployment', movedPlayerPowerAdjustment: -4, winDeployment: 'same_battlefield_next_round' }];
    state.abilityRuntime!.pack.cards[definitionId] = { id: definitionId, name: definitionId, cardType: 'servant_skill', cardFace: { attributes: ['特殊'], cost: 1, basePower: 1 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [ability], mode: 'automatic' } as any;
    state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } } as any);
    state.abilityRuntime!.cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
    state.abilityRuntime!.forcedDeploymentLocations = [{ playerId: 'p1', locationId: 'miyama_town', round: state.round.roundNumber, sourceCardId: instanceId, abilityId: FORTIFY }];
    expect(session.legalDeploymentActions('p1')).toEqual([{ type: 'deploy_player', locationId: 'miyama_town' }]);
    expect(session.dispatchPlayerAction('p1', { type: 'deploy_player', locationId: 'miyama_town' }).ok).toBe(true);
    expect(player.locationId).toBe('miyama_town');
    expect(state.abilityRuntime!.forcedDeploymentLocations ?? []).toEqual([]);
    expect(state.abilityRuntime!.processedEvents).toContain(`deploy-battlefield:${state.round.roundNumber}:p1`);
    expect(state.abilityRuntime!.processedEvents).toContain(`deploy-location:${state.round.roundNumber}:p1`);
  });
  it('keeps the existing canonical third frozen skill automatic and generic', () => {
    const existing = loadAuthoringJson(JSON.parse(require('node:fs').readFileSync('data/authoring/servants/servant.vlad.json', 'utf8')));
    expect(existing.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    expect(existing.cards['servant.vlad.skill.sc-vlad-3']?.abilities.every((ability) => ability.execution.mode === 'automatic')).toBe(true);
  });
});