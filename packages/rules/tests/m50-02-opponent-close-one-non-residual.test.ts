import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { MatchSession, restoreMatchSession } from '../src/match-session';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SOURCE_DEF = 'servant.fixture.scathach.skill.s2';
const SOURCE = 'scathach-source';
const CLOSE = 'piercing-spear-close';
const NORMAL = 'fixture.attack.normal';
const NORMAL_ALT = 'fixture.attack.normal-alt';
const RESIDUAL = 'fixture.attack.residual';

function closeAbility(): any {
  return {
    id: CLOSE, kind: 'phase_action', printedClause: 'close one opponent non-residual attack', markers: ['m50_structured_v1'],
    activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
    conditions: [{ type: 'target_count_equals', scope: 'same_battlefield_opponents', count: 1 }],
    targets: [], effects: [{ type: 'opponent_close_one_non_residual' }], cost: [], creates: [], ruleModifiers: [],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}
function attack(id: string, residual = false): any {
  return {
    id, name: id, cardType: 'basic_attack', owner: { type: 'master', id: 'fixture' },
    cardFace: { typeLabel: 'attack', cost: 0, basePower: 1, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: residual ? [{
      id: 'residual-fixture', kind: 'residual', printedClause: 'fixture residual', activation: {}, conditions: [], targets: [],
      cost: [], effects: [], creates: [], ruleModifiers: [], lifecycle: { duration: 'while_active', cleanup: 'remain_active' },
      responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
    }] : [],
  };
}
function archive(ability = closeAbility()): any {
  return { schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.fixture.scathach', name: 'fixture', class: 'Lancer', cards: [
    { id: SOURCE_DEF, name: 'Piercing Spear', cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.fixture.scathach' },
      cardFace: { typeLabel: 'Quick/Noble Phantasm', cost: 5, basePower: 9, attributes: [] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [ability] },
    attack(NORMAL), attack(NORMAL_ALT), attack(RESIDUAL, true),
  ] };
}
function setup(twoOpponents = false): GameState {
  const pack = rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.round.activePhase = 'battle'; state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = twoOpponents ? 'miyama_town' : 'shinto';
  state.cards = [{ instanceId: SOURCE, definitionId: SOURCE_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } }];
  rules.initializeAbilityRuntime(state, pack, { seed: 20260926 });
  state.abilityRuntime!.cardState[SOURCE] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}
function addAttack(state: GameState, id: string, controller = 'p2', definitionId = NORMAL, patch: { active?: boolean; faceDown?: boolean; owner?: string } = {}): void {
  const owner = patch.owner ?? controller;
  state.cards.push({ instanceId: id, definitionId, ownerPlayerId: owner, controllerPlayerId: controller, zone: 'attack_area', visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState[id] = { active: patch.active ?? true, faceDown: patch.faceDown ?? false, playedRound: state.round.roundNumber };
}
function protectDefinition(state: GameState, definitionId = NORMAL): void {
  const round = state.round.roundNumber;
  state.abilityRuntime!.ongoingEffects.push({
    id: 'ward', sourceCardId: 'ward-source', abilityId: 'ward', controllerId: 'p2', starts: 'immediate', duration: 'this_round',
    startRound: round, expiresAtRound: round + 1, cleanup: 'none', sourceMustRemainActive: false, publicZones: [],
    ruleModifiers: [{ sourceCardId: 'ward-source', controllerId: 'p2', definition: {
      id: 'ward-rule', operation: 'forbid', rule: 'card_close', scope: { controller: 'self', constraints: [{ type: 'has_card_id', cardId: definitionId }] },
      lifecycle: { duration: 'this_round' },
    } }],
  });
}
function closeAction(state: GameState) {
  return rules.getLegalActions(state, 'p1').find((action) => action.type === 'activate_ability' && action.cardInstanceId === SOURCE && action.abilityId === CLOSE);
}
function open(state: GameState) {
  const action = closeAction(state); expect(action).toBeTruthy();
  expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
  return state.abilityRuntime!.pendingDecision!;
}

describe('P3 current-main M50-02 opponent_close_one_non_residual replay', () => {
  it('admits only the normalized exact current-main envelope', () => {
    const pack = rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]);
    expect(rules.isAcceptedOpponentCloseOneNonResidualAbility(pack.cards[SOURCE_DEF]!.abilities[0]!, 'compiled')).toBe(true);
    const widened = closeAbility(); widened.effects[0].extra = true;
    expect(rules.loadAuthoringJson(archive(widened)).cards[SOURCE_DEF]!.abilities[0]!.execution.mode).toBe('unsupported');
  });

  it('lets the unique opponent choose exactly one eligible owned active face-up non-residual attack to close', () => {
    const state = setup();
    addAttack(state, 'normal-a', 'p2', NORMAL_ALT); addAttack(state, 'normal-b'); addAttack(state, 'residual', 'p2', RESIDUAL);
    addAttack(state, 'face-down', 'p2', NORMAL_ALT, { faceDown: true }); addAttack(state, 'inactive', 'p2', NORMAL_ALT, { active: false });
    addAttack(state, 'borrowed', 'p2', NORMAL_ALT, { owner: 'p1' }); protectDefinition(state, NORMAL);
    const decision = open(state); expect(decision.controllerId).toBe('p2'); expect(decision.candidates).toEqual(['normal-a']);
    expect(rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: decision.id, selectedIds: ['normal-a'] }).ok).toBe(true);
    expect(state.abilityRuntime!.cardState['normal-a']).toMatchObject({ active: false, faceDown: true });
    expect(state.abilityRuntime!.cardState['normal-b']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'opponent_card_closed_selected_one', playerId: 'p2', controllerId: 'p1', cardInstanceId: 'normal-a' }));
  });

  it('does not expose the action with two opponents or with no legally closable owned card', () => {
    const crowded = setup(true); addAttack(crowded, 'p2-a'); addAttack(crowded, 'p3-a', 'p3'); expect(closeAction(crowded)).toBeUndefined();
    const none = setup(); addAttack(none, 'residual', 'p2', RESIDUAL); addAttack(none, 'face-down', 'p2', NORMAL_ALT, { faceDown: true });
    addAttack(none, 'inactive', 'p2', NORMAL_ALT, { active: false }); addAttack(none, 'borrowed', 'p2', NORMAL_ALT, { owner: 'p1' }); expect(closeAction(none)).toBeUndefined();
    const protectedState = setup(); addAttack(protectedState, 'protected'); protectDefinition(protectedState, NORMAL); expect(closeAction(protectedState)).toBeUndefined();
  });
  it('fails closed when candidate ownership, battlefield relation, or source validity changes while pending', () => {
    const staleOwner = setup(); addAttack(staleOwner, 'a', 'p2', NORMAL_ALT); addAttack(staleOwner, 'b', 'p2', NORMAL_ALT);
    const d1 = open(staleOwner); staleOwner.cards.find((card) => card.instanceId === 'b')!.ownerPlayerId = 'p1';
    expect(rules.dispatchAbilityCommand(staleOwner, 'p2', { type: 'choose_target', decisionId: d1.id, selectedIds: ['a'] }).ok).toBe(false);
    expect(staleOwner.abilityRuntime!.cardState['a']!.active).toBe(true);

    const moved = setup(); addAttack(moved, 'a', 'p2', NORMAL_ALT); const d2 = open(moved); moved.players[1]!.locationId = 'shinto';
    expect(rules.dispatchAbilityCommand(moved, 'p2', { type: 'choose_target', decisionId: d2.id, selectedIds: ['a'] }).ok).toBe(false);

    const sourceStale = setup(); addAttack(sourceStale, 'a', 'p2', NORMAL_ALT); const d3 = open(sourceStale); sourceStale.abilityRuntime!.cardState[SOURCE]!.active = false;
    expect(rules.dispatchAbilityCommand(sourceStale, 'p2', { type: 'choose_target', decisionId: d3.id, selectedIds: ['a'] }).ok).toBe(false);

  });

  it('fails closed when the source leaves the canonical active-source zones while the decision is pending', () => {
    const state = setup(); addAttack(state, 'a', 'p2', NORMAL_ALT); const decision = open(state);
    state.cards.find((card) => card.instanceId === SOURCE)!.zone = 'skill';
    const denied = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: decision.id, selectedIds: ['a'] });
    expect(denied.ok).toBe(false);
    expect(state.abilityRuntime!.cardState['a']).toMatchObject({ active: true, faceDown: false });
  });

  it('rejects wrong chooser, forged selection, and newly protected frozen candidates without mutation', () => {
    const wrong = setup(); addAttack(wrong, 'a', 'p2', NORMAL_ALT); const d1 = open(wrong);
    expect(rules.dispatchAbilityCommand(wrong, 'p1', { type: 'choose_target', decisionId: d1.id, selectedIds: ['a'] }).ok).toBe(false);
    expect(rules.dispatchAbilityCommand(wrong, 'p2', { type: 'choose_target', decisionId: d1.id, selectedIds: ['forged'] }).ok).toBe(false);
    expect(wrong.abilityRuntime!.cardState['a']!.active).toBe(true);

    const protectedState = setup(); addAttack(protectedState, 'a'); const d2 = open(protectedState); protectDefinition(protectedState, NORMAL);
    expect(rules.dispatchAbilityCommand(protectedState, 'p2', { type: 'choose_target', decisionId: d2.id, selectedIds: ['a'] }).ok).toBe(false);
    expect(protectedState.abilityRuntime!.cardState['a']!.active).toBe(true);
  });

  it('round-trips valid pending metadata and rejects host-signed widened restore metadata', () => {
    const state = setup(); addAttack(state, 'a', 'p2', NORMAL_ALT); open(state);
    const session = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1'], restorePackKind: 'trusted_authoring_fixture' }, false);
    session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
    const durable = session.serializeSession();
    const restored = restoreMatchSession(durable, { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.pendingDecision).toEqual(state.abilityRuntime!.pendingDecision);

    const corrupt = structuredClone(state);
    (corrupt.abilityRuntime!.pendingDecision!.interaction as any).extra = 'forged';
    const signer = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1'], restorePackKind: 'trusted_authoring_fixture' }, false);
    signer.state = corrupt; signer.logs = []; signer.replay = []; signer.replaySnapshots = []; signer.battleHistory = [];
    const signedBad = signer.serializeSession();
    expect(() => restoreMatchSession(signedBad, { restorePackKind: 'trusted_authoring_fixture' })).toThrow(/Invalid MatchSession state container/);
  });
});