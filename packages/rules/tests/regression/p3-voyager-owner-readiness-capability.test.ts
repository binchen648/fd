import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import {
  calculateCardPower, dispatchAbilityCommand, getLegalActions, initializeAbilityRuntime,
  isCanonicalGenericPendingDecisionForRestore, isDeferredAbilityRuntimeProvenanceValidForRestore,
  playAbilityCardBatch, processAbilityEvent,
} from '../../src/ability/interpreter';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-matching-definition';
const S1 = `${ROOT}.skill.s1`; const S2 = `${ROOT}.skill.s2`; const S3 = `${ROOT}.skill.s3`; const FOREIGN = `${ROOT}.skill.foreign`;
const PROVISION = 'fixture.provision'; const REVEAL = 'fixture.reveal'; const EXTRA = 'fixture.extra'; const ZERO = 'fixture.zero';
const DISCARD = 'fixture.discard'; const POWER = 'fixture.power'; const RETURN = 'fixture.return'; const OTHER = 'fixture.other-attack';
function baseAbility(id: string) { return { id, kind: 'phase_action', printedClause: id, activation: {}, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] } } as any; }
function archive() {
  const provision = baseAbility(PROVISION); provision.kind = 'forced_trigger'; provision.activation = { trigger: 'after_controller_enters_location', eventLocationId: 'recon' }; provision.conditions = [{ type: 'source_owned' }]; provision.responseWindow = {}; provision.effects = [{ type: 'create_event_player_definition_copies', definitionId: FOREIGN, target: 'event_player', toZone: 'hand', count: 2, provenance: 'source_card' }];
  const reveal = baseAbility(REVEAL); reveal.activation = { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' }; reveal.conditions = [{ type: 'source_active' }]; reveal.effects = [{ type: 'global_optional_definition_reveal_reward', definitionId: FOREIGN, rewardVp: 2, revealMax: 1 }];
  const extra = baseAbility(EXTRA); extra.activation = { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' }; extra.conditions = [{ type: 'source_active' }]; extra.targets = [
    { id: 'matching', type: 'card_instance', scope: { zone: 'hand', owner: 'controller', controller: 'self' }, count: { min: 0, max: 2 }, constraints: [{ type: 'has_card_id', cardId: FOREIGN }] },
    { id: 'hidden', type: 'card_instance', scope: { zone: 'hand', owner: 'controller', controller: 'self' }, count: { min: 0, max: 2 }, constraints: [] },
  ]; extra.effects = [{ type: 'play_selected_cards', target: 'matching', face: 'face_up' }, { type: 'play_selected_cards', target: 'hidden', face: 'face_down' }];
  const zero = baseAbility(ZERO); zero.activation = { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' }; zero.conditions = [{ type: 'source_active' }]; zero.effects = [{ type: 'reveal_all_hands_zero_matching_attacks', definitionId: FOREIGN, power: 0, duration: 'this_round' }];
  const discard = baseAbility(DISCARD); discard.activation = { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' }; discard.conditions = [{ type: 'source_active' }]; discard.targets = [{ id: 'opponent', type: 'player', count: { min: 1, max: 1 }, constraints: [{ type: 'not_controller' }] }]; discard.effects = [{ type: 'opponent_discard_free_play_all_matching', target: 'opponent', definitionId: FOREIGN, transferVp: 2, playCost: 0, mode: 'all_or_none' }];
  const power = baseAbility(POWER); power.kind = 'forced_trigger'; power.activation = { trigger: 'on_card_played', requiresSourceState: 'active' }; power.conditions = [{ type: 'source_active' }]; power.responseWindow = {}; power.effects = [{ type: 'link_generated_card_round_power', amount: 6, duration: 'this_round', generator: 'generated_by_source_card', dedupeSamePlayer: true }];
  const ret = baseAbility(RETURN); ret.kind = 'forced_trigger'; ret.activation = { trigger: 'after_battle_ended', requiresSourceState: 'active' }; ret.conditions = [{ type: 'source_active' }]; ret.responseWindow = {}; ret.effects = [{ type: 'return_linked_generated_card_after_battle', destination: 'generator_owner_discard', generator: 'generated_by_source_card' }];
  const card = (id: string, abilities: any[], cardType = 'servant_skill', cost = 0, basePower = 0) => ({ id, name: id, cardType, owner: { type: 'servant', id: ROOT }, cardFace: { attributes: ['特殊'], cost, basePower }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities, verification: { implementationStatus: 'complete' } });
  return { schemaVersion: 'fd-card-authoring-v1', id: ROOT, cards: [card(S1, [provision, reveal]), card(S2, [extra, zero]), card(S3, [discard]), card(FOREIGN, [power, ret], 'servant_attack', 2, 3), card(OTHER, [], 'servant_attack', 1, 5)] } as any;
}
function add(state: GameState, definitionId: string, owner: string, zone: string, active = false, generatedBy?: string) {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`; state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone, visibility: ['attack_area','field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner }, ...(generatedBy ? { generatedBy } : {}) } as any); state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber }; return instanceId;
}
function setup() {
  const pack = loadAuthoringJson(archive()); expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] }); state.cards = []; initializeAbilityRuntime(state, pack, { seed: 20260930 });
  const s1 = add(state, S1, 'p1', 'attack_area', true); const s2 = add(state, S2, 'p1', 'attack_area', true); const s3 = add(state, S3, 'p1', 'attack_area', true);
  state.players.forEach((p) => { p.mana = 20; p.vp = 5; }); state.round.prioritySeat = state.players[0]!.seat;
  return { state, s1, s2, s3 };
}
function activate(state: GameState, source: string, id: string, player = 'p1') { return dispatchAbilityCommand(state, player, { type: 'activate_ability', cardInstanceId: source, abilityId: id }); }
function choose(state: GameState, player: string, selectedIds: string[]) { const d = state.abilityRuntime!.pendingDecision!; return dispatchAbilityCommand(state, player, { type: 'choose_target', decisionId: d.id, selectedIds }); }

describe('P3 Voyager owner-readiness matching-definition generic capability', () => {
  it('fails closed for widened privileged shapes', () => {
    const bad = archive(); bad.cards[0].abilities[0].effects[0].count = 3; const pack = loadAuthoringJson(bad);
    expect(pack.cards[S1]!.abilities[0]!.execution.mode).toBe('unsupported');
    expect(pack.report.some((entry) => entry.reason.includes('matching-definition'))).toBe(true);
  });
  it('provisions two outside-game definition copies for the exact entering player with source provenance', () => {
    const { state, s1 } = setup(); processAbilityEvent(state, { id: 'move-p2-recon', type: 'after_controller_enters_location', playerId: 'p2', previousLocationId: 'shinto', locationId: 'recon', movementKind: 'normal' });
    const copies = state.cards.filter((c) => c.ownerPlayerId === 'p2' && c.definitionId === FOREIGN && c.zone === 'hand'); expect(copies).toHaveLength(2); expect(copies.every((c) => c.generatedBy === s1)).toBe(true);
  });
  it('sequentially offers private optional reveal and rewards only a player who reveals a live matching card', () => {
    const { state, s1 } = setup(); const matching = add(state, FOREIGN, 'p2', 'hand', false, s1); state.round.activePhase = 'action'; const before = state.players[1]!.vp;
    expect(activate(state, s1, REVEAL).ok).toBe(true); expect(state.abilityRuntime!.pendingDecision!.controllerId).toBe('p2'); expect(isCanonicalGenericPendingDecisionForRestore(state, state.abilityRuntime!.pendingDecision!)).toBe(true);
    expect(choose(state, 'p2', [matching]).ok).toBe(true); expect(state.players[1]!.vp).toBe(before + 2); expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });
  it('plays up to two matching cards face-up and two other hand cards face-down through normal effect-play semantics', () => {
    const { state, s2 } = setup(); state.round.activePhase = 'action'; const m1 = add(state, FOREIGN, 'p1', 'hand', false, s2); const m2 = add(state, FOREIGN, 'p1', 'hand', false, s2); const o1 = add(state, OTHER, 'p1', 'hand'); const o2 = add(state, OTHER, 'p1', 'hand');
    expect(activate(state, s2, EXTRA).ok).toBe(true); expect(choose(state, 'p1', [m1,m2]).ok).toBe(true); expect(state.abilityRuntime!.pendingDecision!.candidates.sort()).toEqual([o1,o2].sort()); expect(choose(state, 'p1', [o1,o2]).ok).toBe(true);
    expect(state.cards.find((c) => c.instanceId === m1)!.zone).toBe('attack_area'); expect(state.abilityRuntime!.cardState[m1]!.active).toBe(true); expect(state.abilityRuntime!.cardState[o1]!.faceDown).toBe(true); expect(state.abilityRuntime!.cardPlayCountByInstance?.[m1]).toBe(1);
  });
  it('reveals all hands and sets active attacks of matching-hand players to zero for the round', () => {
    const { state, s2 } = setup(); state.round.activePhase = 'combat'; add(state, FOREIGN, 'p2', 'hand', false, s2); const attack = add(state, OTHER, 'p2', 'attack_area', true); expect(calculateCardPower(state, attack).value).toBe(5);
    expect(activate(state, s2, ZERO).ok).toBe(true); expect(calculateCardPower(state, attack).value).toBe(0); expect(state.abilityRuntime!.events.some((event) => event.type === 'hand_revealed_for_matching_definition_check' && event.playerId === 'p2')).toBe(true);
  });
  it('reveals one opponent discard then transactionally free-plays all matching cards and transfers up to two VP', () => {
    const { state, s1, s3 } = setup(); state.round.activePhase = 'action'; const a = add(state, FOREIGN, 'p2', 'discard', false, s1); const b = add(state, FOREIGN, 'p2', 'discard', false, s1); add(state, OTHER, 'p2', 'discard'); const before1 = state.players[0]!.vp; const before2 = state.players[1]!.vp;
    expect(activate(state, s3, DISCARD).ok).toBe(true); expect(choose(state, 'p1', ['p2']).ok).toBe(true); expect(isCanonicalGenericPendingDecisionForRestore(state, state.abilityRuntime!.pendingDecision!)).toBe(true); expect(choose(state, 'p1', ['play_all']).ok).toBe(true);
    expect(state.cards.find((c) => c.instanceId === a)!.controllerPlayerId).toBe('p1'); expect(state.cards.find((c) => c.instanceId === b)!.zone).toBe('attack_area'); expect(state.players[0]!.vp).toBe(before1 + 2); expect(state.players[1]!.vp).toBe(before2 - 2); expect(state.abilityRuntime!.cardPlayCountByInstance?.[a]).toBe(1);
  });
  it('links a generated card to exact generator provenance, grants +6 without self double-count, survives restore validation, then returns after battle', () => {
    const { state, s1 } = setup(); const generated = add(state, FOREIGN, 'p2', 'hand', false, s1); state.round.activePhase = 'action'; state.round.prioritySeat = state.players[1]!.seat; expect(playAbilityCardBatch(state, 'p2', [{ cardInstanceId: generated }])).toBeUndefined();
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: 'p2', amount: 6, sourceCardId: generated, abilityId: POWER }), expect.objectContaining({ playerId: 'p1', amount: 6, sourceCardId: generated, abilityId: POWER }),
    ])); expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    processAbilityEvent(state, { id: 'battle-end-voyager-fixture', type: 'after_battle_ended', battleParticipantIds: ['p1','p2'] });
    const physical = state.cards.find((c) => c.instanceId === generated)!; expect(physical.zone).toBe('discard'); expect(physical.ownerPlayerId).toBe('p1'); expect(physical.controllerPlayerId).toBe('p1'); expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
  });
  it('dedupes +6 when generated-card controller is also the exact generator owner and rejects forged restore provenance', () => {
    const { state, s1 } = setup(); const generated = add(state, FOREIGN, 'p1', 'hand', false, s1); state.round.activePhase = 'action'; playAbilityCardBatch(state, 'p1', [{ cardInstanceId: generated }]);
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments!.filter((entry) => entry.sourceCardId === generated)).toHaveLength(1); expect(state.abilityRuntime!.roundPlayerPowerAdjustments![0]!.amount).toBe(6); expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    state.cards.find((c) => c.instanceId === generated)!.generatedBy = 'forged-generator'; expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(false);
  });
});
