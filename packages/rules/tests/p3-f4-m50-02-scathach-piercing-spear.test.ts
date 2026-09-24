import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SOURCE_DEF = 'servant.fixture.scathach.skill.s2';
const SOURCE = 'scathach-source';
const CLOSE = 'piercing-spear-close';
const OMEN = 'death-omen';
const NORMAL = 'fixture.attack.normal';
const RESIDUAL = 'fixture.attack.residual';

function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.fixture.scathach', name: 'fixture', class: 'Lancer',
    cards: [
      {
        id: SOURCE_DEF, name: 'Piercing Spear', cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.fixture.scathach' },
        cardFace: { typeLabel: 'Quick/Noble Phantasm', cost: 5, basePower: 9, attributes: ['迅捷', '宝具'] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [
          {
            id: CLOSE, kind: 'phase_action', printedClause: 'close one opponent non-residual attack', markers: ['m50_structured_v1'],
            activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
            conditions: [
              { type: 'phase_is', phase: 'combat' },
              { type: 'target_count_equals', scope: 'same_battlefield_opponents', count: 1 },
            ],
            targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
            effects: [{ type: 'opponent_close_one_non_residual' }],
            execution: { mode: 'automatic', allowedOperations: [] },
          },
          {
            id: OMEN, kind: 'passive', printedClause: 'gain 1 VP per engaged opponent on win', markers: ['m50_structured_v1'],
            activation: { phase: 'combat', trigger: 'after_battle_result_determined', requiresSourceState: 'active' },
            conditions: [{ type: 'source_active' }, { type: 'event_player_won_combat' }],
            targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
            effects: [{ type: 'gain_victory_points_per_target', target: 'controller', countTarget: { scope: 'same_battlefield_opponents' }, amountPerTarget: 1 }],
            execution: { mode: 'automatic', allowedOperations: [] },
          },
        ],
      },
      {
        id: NORMAL, name: 'normal attack', cardType: 'basic_attack', owner: { type: 'master', id: 'fixture' },
        cardFace: { typeLabel: 'attack', cost: 0, basePower: 1, attributes: [] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
      {
        id: RESIDUAL, name: 'residual attack', cardType: 'basic_attack', owner: { type: 'master', id: 'fixture' },
        cardFace: { typeLabel: 'attack', cost: 0, basePower: 1, attributes: [] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [{
          id: 'residual-fixture', kind: 'residual', printedClause: 'fixture residual', activation: {}, conditions: [], targets: [], cost: [], effects: [], creates: [], ruleModifiers: [],
          lifecycle: { duration: 'while_active', cleanup: 'remain_active' }, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
        }], residual: true,
      },
    ],
  };
}

function setup(twoOpponents = false): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.round.activePhase = 'battle';
  state.round.prioritySeat = state.players.find((player) => player.id === 'p1')!.seat;
  state.players.find((player) => player.id === 'p1')!.locationId = 'miyama_town';
  state.players.find((player) => player.id === 'p2')!.locationId = 'miyama_town';
  state.players.find((player) => player.id === 'p3')!.locationId = twoOpponents ? 'miyama_town' : 'shinto';
  state.players.find((player) => player.id === 'p1')!.vp = 5;
  state.cards = [
    { instanceId: SOURCE, definitionId: SOURCE_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } },
  ];
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  state.abilityRuntime!.cardState[SOURCE] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function addAttack(state: GameState, id: string, playerId: string, definitionId = NORMAL, patch: { active?: boolean; faceDown?: boolean } = {}) {
  state.cards.push({ instanceId: id, definitionId, ownerPlayerId: playerId, controllerPlayerId: playerId, zone: 'attack_area', visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState[id] = { active: patch.active ?? true, faceDown: patch.faceDown ?? false, playedRound: state.round.roundNumber };
}

function closeAction(state: GameState) {
  return rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'activate_ability' && candidate.cardInstanceId === SOURCE && candidate.abilityId === CLOSE);
}

function emitBattleResult(state: GameState, winners: string[], participants = ['p1', 'p2', 'p3']) {
  const id = `battle-phase:${state.round.roundNumber}:battle:miyama_town:1:result`;
  rules.processAbilityEvent(state, {
    id,
    type: 'after_battle_result_determined',
    playerId: 'p1',
    battlePhaseResolutionId: `battle-phase:${state.round.roundNumber}`,
    battleId: `battle-phase:${state.round.roundNumber}:battle:miyama_town:1`,
    resultId: id,
    battlefieldId: 'miyama_town',
    battleParticipantIds: [...participants],
    battleResult: { winners: [...winners], loserIds: participants.filter((playerId) => !winners.includes(playerId)) },
  });
}

describe('P3 F4 M50-02 Scathach Piercing Spear', () => {
  it('loads the exact close-one and death-omen abilities blocker-free', () => {
    const pack = rules.loadAuthoringJson(archive());
    expect(pack.report).toEqual([]);
    expect(rules.isAcceptedOpponentCloseOneNonResidualAbility(pack.cards[SOURCE_DEF]!.abilities[0]!, 'compiled')).toBe(true);
    expect(pack.cards[SOURCE_DEF]!.abilities.map((ability) => ability.id)).toEqual([CLOSE, OMEN]);
  });

  it('with exactly one opponent, lets that opponent close exactly one active face-up non-residual attack', () => {
    const state = setup(false);
    addAttack(state, 'normal-a', 'p2');
    addAttack(state, 'normal-b', 'p2');
    addAttack(state, 'residual', 'p2', RESIDUAL);
    addAttack(state, 'facedown', 'p2', NORMAL, { faceDown: true });
    addAttack(state, 'inactive', 'p2', NORMAL, { active: false });

    const action = closeAction(state); expect(action).toBeTruthy();
    const opened = rules.dispatchAbilityCommand(state, 'p1', action!);
    expect(opened).toMatchObject({ ok: true });
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p2' });
    expect(state.abilityRuntime!.pendingDecision!.candidates.sort()).toEqual(['normal-a', 'normal-b'].sort());
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: decision.id, selectedIds: ['normal-b'] })).toMatchObject({ ok: true });
    expect(state.abilityRuntime!.cardState['normal-b']).toMatchObject({ active: false, faceDown: true });
    expect(state.abilityRuntime!.cardState['normal-a']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.cardState['residual']).toMatchObject({ active: true, faceDown: false });
  });

  it('does not expose the close action when two opponents share the battlefield', () => {
    const state = setup(true);
    addAttack(state, 'p2-a', 'p2');
    addAttack(state, 'p3-a', 'p3');
    expect(closeAction(state)).toBeUndefined();
  });

  it('does not expose the close action when the sole opponent has no active face-up non-residual attack', () => {
    const state = setup(false);
    addAttack(state, 'residual-only', 'p2', RESIDUAL);
    addAttack(state, 'facedown-only', 'p2', NORMAL, { faceDown: true });
    addAttack(state, 'inactive-only', 'p2', NORMAL, { active: false });
    expect(closeAction(state)).toBeUndefined();
  });

  it('fails closed if the frozen card candidate becomes stale before the opponent answers', () => {
    const state = setup(false);
    addAttack(state, 'normal-a', 'p2');
    addAttack(state, 'normal-b', 'p2');
    expect(rules.dispatchAbilityCommand(state, 'p1', closeAction(state)!).ok).toBe(true);
    const decision = state.abilityRuntime!.pendingDecision!;
    state.cards.find((card) => card.instanceId === 'normal-b')!.zone = 'discard';
    const denied = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: decision.id, selectedIds: ['normal-a'] });
    expect(denied.ok).toBe(false);
    expect(state.abilityRuntime!.cardState['normal-a']).toMatchObject({ active: true, faceDown: false });
  });

  it('fails closed if source validity or the sole-opponent battlefield relation changes while the decision is pending', () => {
    const sourceStale = setup(false);
    addAttack(sourceStale, 'normal-a', 'p2');
    expect(rules.dispatchAbilityCommand(sourceStale, 'p1', closeAction(sourceStale)!).ok).toBe(true);
    const sourceDecision = sourceStale.abilityRuntime!.pendingDecision!;
    sourceStale.abilityRuntime!.cardState[SOURCE]!.active = false;
    expect(rules.dispatchAbilityCommand(sourceStale, 'p2', { type: 'choose_target', decisionId: sourceDecision.id, selectedIds: ['normal-a'] }).ok).toBe(false);
    expect(sourceStale.abilityRuntime!.cardState['normal-a']).toMatchObject({ active: true, faceDown: false });

    const opponentMoved = setup(false);
    addAttack(opponentMoved, 'normal-b', 'p2');
    expect(rules.dispatchAbilityCommand(opponentMoved, 'p1', closeAction(opponentMoved)!).ok).toBe(true);
    const moveDecision = opponentMoved.abilityRuntime!.pendingDecision!;
    opponentMoved.players.find((player) => player.id === 'p2')!.locationId = 'shinto';
    expect(rules.dispatchAbilityCommand(opponentMoved, 'p2', { type: 'choose_target', decisionId: moveDecision.id, selectedIds: ['normal-b'] }).ok).toBe(false);
    expect(opponentMoved.abilityRuntime!.cardState['normal-b']).toMatchObject({ active: true, faceDown: false });
  });

  it('death omen gains exactly one VP per same-battlefield opponent after an authoritative combat win', () => {
    const state = setup(true);
    const before = state.players.find((player) => player.id === 'p1')!.vp;
    emitBattleResult(state, ['p1']);
    expect(state.players.find((player) => player.id === 'p1')!.vp).toBe(before + 2);
  });

  it('death omen does not trigger when the source is inactive or controller loses', () => {
    const inactive = setup(true);
    inactive.abilityRuntime!.cardState[SOURCE]!.active = false;
    const inactiveBefore = inactive.players.find((player) => player.id === 'p1')!.vp;
    emitBattleResult(inactive, ['p1']);
    expect(inactive.players.find((player) => player.id === 'p1')!.vp).toBe(inactiveBefore);

    const loss = setup(true);
    const lossBefore = loss.players.find((player) => player.id === 'p1')!.vp;
    emitBattleResult(loss, ['p2']);
    expect(loss.players.find((player) => player.id === 'p1')!.vp).toBe(lossBefore);
  });
});
