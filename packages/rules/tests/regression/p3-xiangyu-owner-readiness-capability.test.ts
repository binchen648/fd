import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import {
  calculateCardPower, dispatchAbilityCommand, initializeAbilityRuntime,
  isCanonicalGenericPendingDecisionForRestore, playAbilityCardBatch, processAbilityEvent,
} from '../../src/ability/interpreter';
import { markNormalCommandSealUsedThisRound, markRulerCommandSealUsedThisRound } from '../../src/ability/command-seal-power-capability';
import { reactionCounterValue, setReactionCounterValue } from '../../src/ability/reaction-counter-capability';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-reaction-counter';
const MATRIX = `${ROOT}.skill.matrix`; const MARTIAL = `${ROOT}.skill.martial`; const MIGHT = `${ROOT}.skill.might`;
const ATTACK = `${ROOT}.attack`; const SEAL_ATTACK = `${ROOT}.seal-attack`; const SKILL = `${ROOT}.skill.other`;
const ARM = 'fixture.arm'; const HALVE = 'fixture.halve';
const BACK = 'fixture.back'; const FORWARD = 'fixture.forward'; const TOP = 'fixture.top'; const HAND = 'fixture.hand';
const GAIN = 'fixture.gain'; const DOUBLE = 'fixture.double'; const KEY = 'fixture.reaction';
function baseAbility(id: string) { return { id, kind: 'phase_action', printedClause: id, activation: {}, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] } } as any; }
function archive() {
  const arm = baseAbility(ARM); arm.activation = { phase: 'action', opens: 'controller_action_window' }; arm.effects = [{ type: 'arm_opponent_action_reaction_counter', counterKey: KEY, skillPlayGain: 1, commandSealUseGain: 1, moveToControllerBattlefieldGain: 1, moveAwardOncePerPlayerPerRound: true }];
  const halve = baseAbility(HALVE); halve.kind = 'forced_trigger'; halve.activation = { trigger: 'after_battle_ended' }; halve.effects = [{ type: 'halve_reaction_counter_after_battle', counterKey: KEY, rounding: 'ceil_loss' }];
  const back = baseAbility(BACK); back.activation = { phase: 'combat', opens: 'controller_combat_action_window' }; back.effects = [{ type: 'spend_reaction_counter_move_one', counterKey: KEY, amount: 1, direction: 'backward' }];
  const forward = baseAbility(FORWARD); forward.activation = { phase: 'combat', opens: 'controller_combat_action_window' }; forward.effects = [{ type: 'spend_reaction_counter_move_one', counterKey: KEY, amount: 2, direction: 'forward' }];
  const top = baseAbility(TOP); top.activation = { phase: 'combat', opens: 'controller_combat_action_window' }; top.effects = [{ type: 'spend_reaction_counter_play_top', counterKey: KEY, amount: 4, sourceZone: 'deck', payCardCosts: true }];
  const hand = baseAbility(HAND); hand.activation = { phase: 'combat', opens: 'controller_combat_action_window' }; hand.targets = [{ id: 'hand_card', type: 'card_instance', scope: { zone: 'hand', owner: 'controller' }, count: { min: 1, max: 1 }, constraints: [{ type: 'effect_playable_face_up' }] }]; hand.effects = [{ type: 'spend_reaction_counter_play_hand_free', counterKey: KEY, amount: 7, sourceZone: 'hand', payCardCosts: false, target: 'hand_card' }];
  const gain = baseAbility(GAIN); gain.activation = { phase: 'action', opens: 'controller_action_window' }; gain.effects = [{ type: 'pay_mana_gain_reaction_counter', counterKey: KEY, manaCost: 1, gain: 2 }];
  const double = baseAbility(DOUBLE); double.activation = { phase: 'combat', opens: 'controller_combat_action_window' }; double.effects = [{ type: 'double_source_base_power_if_moved_at_least', minimumMovementDistance: 3, multiplier: 2, duration: 'while_source_active' }];
  const sealCost = baseAbility('fixture.seal-play-cost'); sealCost.kind = 'passive'; sealCost.activation = { trigger: 'while_active' }; sealCost.responseWindow = {}; sealCost.limit = { type: 'per_game', uses: 1, scope: 'this_card' }; sealCost.effects = [{ type: 'card_play_command_seal_cost', amount: 1 }];
  const card = (id: string, abilities: any[], cardType = 'servant_skill', cost = 0, basePower = 0) => ({ id, name: id, cardType, owner: { type: 'servant', id: ROOT }, cardFace: { attributes: ['特殊'], cost, basePower }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities, verification: { implementationStatus: 'complete' } });
  return { schemaVersion: 'fd-card-authoring-v1', id: ROOT, cards: [card(MATRIX, [arm, halve]), card(MARTIAL, [back, forward, top, hand]), card(MIGHT, [gain, double], 'servant_skill', 0, 5), card(ATTACK, [], 'servant_attack', 2, 4), card(SEAL_ATTACK, [sealCost], 'servant_attack', 1, 2), card(SKILL, [], 'servant_skill', 1, 0)] } as any;
}
function add(state: GameState, definitionId: string, owner: string, zone: string, active = false) {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone, visibility: ['attack_area','field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const pack = loadAuthoringJson(archive()); expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1,2,3] }); state.cards = []; initializeAbilityRuntime(state, pack, { seed: 20260930 });
  const matrix = add(state, MATRIX, 'p1', 'skill'); const martial = add(state, MARTIAL, 'p1', 'skill'); const might = add(state, MIGHT, 'p1', 'skill');
  state.players.forEach((p) => { p.mana = 20; p.vp = 5; (p as any).commandSpells = 3; }); state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  return { state, matrix, martial, might };
}
function activate(state: GameState, source: string, id: string, player='p1') { return dispatchAbilityCommand(state, player, { type: 'activate_ability', cardInstanceId: source, abilityId: id }); }
function choose(state: GameState, player: string, ids: string[]) { const d=state.abilityRuntime!.pendingDecision!; return dispatchAbilityCommand(state, player, { type: 'choose_target', decisionId: d.id, selectedIds: ids }); }
function priority(state: GameState, playerId: string) { state.round.prioritySeat = state.players.find((p) => p.id === playerId)!.seat; }

describe('P3 Xiang Yu owner-readiness reaction-counter generic capability', () => {
  it('accepts exact identity-free shapes and fails closed for widened privileged shapes', () => {
    const exact = loadAuthoringJson(archive()); expect(exact.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const bad = archive(); bad.cards[0].abilities[0].effects[0].skillPlayGain = 2; const rejected = loadAuthoringJson(bad);
    expect(rejected.cards[MATRIX]!.abilities[0]!.execution.mode).toBe('unsupported');
    expect(rejected.report.some((entry) => entry.reason.includes('Reaction-counter'))).toBe(true);
  });

  it('arms one round and gains only from an opponent own action-turn skill play', () => {
    const { state, matrix } = setup(); expect(activate(state, matrix, ARM).ok).toBe(true); priority(state, 'p2');
    const played = add(state, SKILL, 'p2', 'attack_area', true); processAbilityEvent(state, { id: 'p2-skill-own-turn', type: 'on_card_played', playerId: 'p2', sourceCardId: played, playedCards: [{ instanceId: played, controllerId: 'p2', cardType: 'servant_skill', faceDown: false }] });
    expect(reactionCounterValue(state, 'p1', KEY)).toBe(1);
    const played2 = add(state, SKILL, 'p2', 'attack_area', true); processAbilityEvent(state, { id: 'p2-skill-own-turn-2', type: 'on_card_played', playerId: 'p2', sourceCardId: played2, playedCards: [{ instanceId: played, controllerId: 'p2', cardType: 'servant_skill', faceDown: false }, { instanceId: played2, controllerId: 'p2', cardType: 'servant_skill', faceDown: false }] });
    expect(reactionCounterValue(state, 'p1', KEY)).toBe(2);
    priority(state, 'p1'); const forced = add(state, SKILL, 'p2', 'attack_area', true); processAbilityEvent(state, { id: 'p2-skill-other-turn', type: 'on_card_played', playerId: 'p2', sourceCardId: forced, playedCards: [{ instanceId: forced, controllerId: 'p2', cardType: 'servant_skill', faceDown: false }] });
    expect(reactionCounterValue(state, 'p1', KEY)).toBe(2);
  });

  it('credits authoritative ordinary and Ruler seal uses during that opponent action turn', () => {
    const { state, matrix } = setup(); expect(activate(state, matrix, ARM).ok).toBe(true); priority(state, 'p2');
    markNormalCommandSealUsedThisRound(state, 'p2', { sourceCardId: 'fixture-seal', abilityId: 'fixture-use', before: 3, after: 2 });
    markRulerCommandSealUsedThisRound(state, 'p2'); expect(reactionCounterValue(state, 'p1', KEY)).toBe(2);
    priority(state, 'p1'); markNormalCommandSealUsedThisRound(state, 'p2', { sourceCardId: 'fixture-seal', abilityId: 'fixture-use-2', before: 2, after: 1 });
    expect(reactionCounterValue(state, 'p1', KEY)).toBe(2);
  });


  it('does not count a Command Seal paid only as a card-play cost as a seal ability use', () => {
    const { state, matrix } = setup(); expect(activate(state, matrix, ARM).ok).toBe(true); priority(state, 'p2');
    const paid = add(state, SEAL_ATTACK, 'p2', 'hand'); (state.players.find((p) => p.id === 'p2') as any).commandSpells = 1;
    playAbilityCardBatch(state, 'p2', [{ cardInstanceId: paid }]);
    expect((state.players.find((p) => p.id === 'p2') as any).commandSpells).toBe(0);
    expect(state.abilityRuntime!.normalCommandSealUseHistory ?? []).toEqual([]);
    expect(reactionCounterValue(state, 'p1', KEY)).toBe(0);
  });

  it('credits movement into the exact watcher battlefield once per opponent per round and ignores deployment/other locations', () => {
    const { state, matrix } = setup(); state.players.find((p) => p.id === 'p1')!.locationId = 'miyama_town'; expect(activate(state, matrix, ARM).ok).toBe(true); priority(state, 'p2');
    processAbilityEvent(state, { id: 'p2-enter-1', type: 'after_controller_enters_location', playerId: 'p2', previousLocationId: 'magic_workshop', locationId: 'miyama_town', movementKind: 'normal' });
    processAbilityEvent(state, { id: 'p2-enter-2', type: 'after_controller_enters_location', playerId: 'p2', previousLocationId: 'shinto', locationId: 'miyama_town', movementKind: 'effect' });
    processAbilityEvent(state, { id: 'p2-other', type: 'after_controller_enters_location', playerId: 'p2', previousLocationId: 'miyama_town', locationId: 'shinto', movementKind: 'normal' });
    expect(reactionCounterValue(state, 'p1', KEY)).toBe(1);
  });

  it('battle-end halving loses ceil half exactly once per event', () => {
    const { state, matrix } = setup(); setReactionCounterValue(state, 'p1', KEY, 5); state.round.activePhase = 'combat';
    processAbilityEvent(state, { id: 'battle-terminal-fixture', type: 'after_battle_ended', battleParticipantIds: ['p1','p2'] });
    expect(reactionCounterValue(state, 'p1', KEY)).toBe(2);
    processAbilityEvent(state, { id: 'battle-terminal-fixture', type: 'after_battle_ended', battleParticipantIds: ['p1','p2'] });
    expect(reactionCounterValue(state, 'p1', KEY)).toBe(2);
  });

  it('supports repeatable backward/forward one-step purchases and records movement distance', () => {
    const { state, martial } = setup(); state.round.activePhase = 'combat'; state.players.find((p) => p.id === 'p1')!.locationId = 'shinto'; setReactionCounterValue(state, 'p1', KEY, 5);
    expect(activate(state, martial, BACK).ok).toBe(true); expect(state.players.find((p) => p.id === 'p1')!.locationId).toBe('miyama_town'); expect(reactionCounterValue(state,'p1',KEY)).toBe(4);
    expect(activate(state, martial, BACK).ok).toBe(true); expect(state.players.find((p) => p.id === 'p1')!.locationId).toBe('magic_workshop'); expect(reactionCounterValue(state,'p1',KEY)).toBe(3);
    expect(activate(state, martial, FORWARD).ok).toBe(true); expect(state.players.find((p) => p.id === 'p1')!.locationId).toBe('miyama_town'); expect(reactionCounterValue(state,'p1',KEY)).toBe(1);
    expect(state.abilityRuntime!.movementDistanceThisRound.p1).toBe(3);
  });

  it('spends four to play deck top with normal mana cost and seven to free-play a chosen hand card', () => {
    const { state, martial } = setup(); state.round.activePhase = 'combat'; setReactionCounterValue(state,'p1',KEY,11); const top=add(state,ATTACK,'p1','deck'); const hand=add(state,ATTACK,'p1','hand'); const mana=state.players[0]!.mana;
    expect(activate(state,martial,TOP).ok).toBe(true); expect(state.cards.find((c)=>c.instanceId===top)!.zone).toBe('attack_area'); expect(state.players[0]!.mana).toBe(mana-2); expect(reactionCounterValue(state,'p1',KEY)).toBe(7);
    expect(activate(state,martial,HAND).ok).toBe(true); expect(state.abilityRuntime!.pendingDecision).toBeDefined(); expect(isCanonicalGenericPendingDecisionForRestore(state,state.abilityRuntime!.pendingDecision!)).toBe(true);
    const manaAfterTop=state.players[0]!.mana; expect(choose(state,'p1',[hand]).ok).toBe(true); expect(state.cards.find((c)=>c.instanceId===hand)!.zone).toBe('attack_area'); expect(state.players[0]!.mana).toBe(manaAfterTop); expect(reactionCounterValue(state,'p1',KEY)).toBe(0);
  });

  it('pays one mana for two reaction repeatedly without generic once-per-round lockout', () => {
    const { state, might } = setup(); const mana=state.players[0]!.mana; expect(activate(state,might,GAIN).ok).toBe(true); expect(activate(state,might,GAIN).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(mana-2); expect(reactionCounterValue(state,'p1',KEY)).toBe(4);
  });

  it('requires three movement segments before doubling only the active physical source base power', () => {
    const { state, might }=setup(); state.round.activePhase='combat'; const physical=state.cards.find((c)=>c.instanceId===might)!; physical.zone='attack_area'; state.abilityRuntime!.cardState[might]!.active=true; state.abilityRuntime!.movementDistanceThisRound.p1=2;
    expect(activate(state,might,DOUBLE).ok).toBe(false); state.abilityRuntime!.movementDistanceThisRound.p1=3; expect(calculateCardPower(state,might).value).toBe(5); expect(activate(state,might,DOUBLE).ok).toBe(true); expect(calculateCardPower(state,might).value).toBe(10);
    state.abilityRuntime!.cardState[might]!.active=false; expect(calculateCardPower(state,might).value).toBe(5);
  });

  it('fails closed when the armed provider source/controller provenance is forged', () => {
    const { state, matrix }=setup(); expect(activate(state,matrix,ARM).ok).toBe(true); state.cards.find((c)=>c.instanceId===matrix)!.controllerPlayerId='p3'; priority(state,'p2'); const skill=add(state,SKILL,'p2','hand'); playAbilityCardBatch(state,'p2',[{cardInstanceId:skill}]);
    expect(reactionCounterValue(state,'p1',KEY)).toBe(0);
  });
});
