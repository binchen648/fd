import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.synthetic-round-commitment';
const IRON = ROOT + '.skill.iron';
const RESOLVE = ROOT + '.skill.resolve';
const ASC = ROOT + '.skill.ascension';
const FIST = 'fixture.round-commitment.fist';
const BASIC_A = 'fixture.round-commitment.basic-a';
const BASIC_B = 'fixture.round-commitment.basic-b';
const BASIC_C = 'fixture.round-commitment.basic-c';
const BASIC_D = 'fixture.round-commitment.basic-d';
const STATE_KEY = 'synthetic.round-commitment';

function ability(
  id: string,
  kind: string,
  activation: Record<string, unknown>,
  effect: Record<string, unknown>,
  responseWindow: Record<string, unknown> = {},
) {
  return {
    id,
    kind,
    printedClause: id,
    activation,
    conditions: [],
    targets: [],
    effects: [effect],
    cost: [],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow,
    limit: {},
    visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function card(id: string, abilities: any[], cardType = 'master_skill', power = 0) {
  return {
    id,
    name: id,
    cardType,
    owner: { type: 'master', id: ROOT },
    cardFace: { typeLabel: '', attributes: [], cost: 0, basePower: power },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [],
    abilities,
    verification: { implementationStatus: 'complete' },
  };
}

const replace = ability('iron.replace', 'forced_trigger', { trigger: 'game_start' }, {
  type: 'replace_highest_basic_attacks_with_definition',
  definitionId: FIST,
  count: 2,
  ranking: 'printed_base_power_desc_deck_order',
});
const activate = ability('resolve.activate', 'phase_action', { phase: 'advance', opens: 'controller_action_window' }, {
  type: 'activate_round_commitment',
  stateKey: STATE_KEY,
  powerBonus: 2,
  mustDeployToBattlefield: true,
  lockMovement: true,
}, { order: 'turn_order', passBehavior: 'decline_this_window' });
const lose = ability('resolve.loss', 'forced_trigger', { trigger: 'after_controller_loses_battle' }, {
  type: 'round_commitment_loss_vp_penalty',
  stateKey: STATE_KEY,
  amount: 2,
});
const fistPower = ability('asc.fist-power', 'passive', { trigger: 'while_active' }, {
  type: 'round_commitment_definition_power_bonus',
  definitionId: FIST,
  amount: 6,
});
const winLosers = ability('asc.win-losers', 'forced_trigger', { trigger: 'after_controller_wins_battle' }, {
  type: 'round_commitment_win_losers_vp_penalty',
  stateKey: STATE_KEY,
  amount: 2,
});

const archive = {
  schemaVersion: 'fd-card-authoring-v1',
  archiveType: 'master_skill_card_archive',
  id: ROOT,
  name: ROOT,
  class: 'Master',
  publicInformation: { type: 'master_package', initialMana: 4 },
  cards: [
    card(IRON, [replace]),
    card(RESOLVE, [activate, lose]),
    card(ASC, [fistPower, winLosers]),
    card(FIST, [], 'basic_attack', 5),
    card(BASIC_A, [], 'basic_attack', 5),
    card(BASIC_B, [], 'basic_attack', 5),
    card(BASIC_C, [], 'basic_attack', 3),
    card(BASIC_D, [], 'basic_attack', 1),
  ],
  sources: [],
};

const loaded = rules.loadAuthoringJson(archive as any);

function add(state: GameState, definitionId: string, zone: any = 'skill') {
  const instanceId = 'round-commitment:' + definitionId.split('.').at(-1) + ':' + state.cards.length;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone,
    visibility: zone === 'attack_area' || zone === 'field'
      ? { scope: 'public' }
      : { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = {
    active: zone === 'attack_area' || zone === 'field',
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return instanceId;
}

function state() {
  expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const value = createSeededGameState({ activeSeats: [1, 2, 3] });
  value.cards = [];
  value.players[0]!.masterCardId = ROOT;
  value.players[0]!.vp = 5;
  value.players[0]!.locationId = 'miyama_town';
  value.players[1]!.vp = 5;
  value.players[1]!.locationId = 'shinto';
  value.players[2]!.vp = 4;
  value.players[2]!.locationId = 'magic_workshop';
  value.round.activePhase = 'advance';
  value.round.prioritySeat = 1;
  rules.initializeAbilityRuntime(value, loaded, { seed: 20261008 });
  return value;
}

function activationAction(s: GameState, sourceCardId: string) {
  return rules.getLegalActions(s, 'p1').find((action) =>
    action.type === 'activate_ability' &&
    action.cardInstanceId === sourceCardId &&
    action.abilityId === 'resolve.activate');
}

function battleResult(id: string, winners: string[], participants = ['p1', 'p2', 'p3']) {
  return {
    id,
    type: 'after_battle_result_determined' as const,
    battlePhaseResolutionId: 'battle-phase:1',
    battleId: 'battle-phase:1:battle:miyama_town:1',
    resultId: id,
    battleParticipantIds: participants,
    battlefieldId: 'miyama_town',
    battleResult: { winners, loserIds: participants.filter((playerId) => !winners.includes(playerId)) },
  };
}

describe('P3 Goredolf owner readiness complete gap set', () => {
  it('accepts only the exact identity-free semantic shapes and rejects widened replacement semantics', () => {
    expect(rules.isAcceptedRoundCommitmentAbility(loaded.cards[IRON]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedRoundCommitmentAbility(loaded.cards[RESOLVE]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedRoundCommitmentAbility(loaded.cards[RESOLVE]!.abilities[1]!)).toBe(true);
    expect(rules.isAcceptedRoundCommitmentAbility(loaded.cards[ASC]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedRoundCommitmentAbility(loaded.cards[ASC]!.abilities[1]!)).toBe(true);

    const malformed = structuredClone(archive);
    (malformed.cards[0]!.abilities[0]!.effects[0] as any).count = 3;
    const rejected = rules.loadAuthoringJson(malformed as any);
    expect(rejected.report.some((entry) =>
      entry.status === 'unsupported' && entry.path === 'roundCommitment.gateway')).toBe(true);
  });

  it('replaces exactly the two highest-Power basic attacks at game start with deck-order tie breaking', () => {
    const s = state();
    add(s, IRON);
    const a = add(s, BASIC_A, 'deck');
    const b = add(s, BASIC_B, 'deck');
    const c = add(s, BASIC_C, 'deck');
    const d = add(s, BASIC_D, 'deck');

    rules.processAbilityEvent(s, { id: 'round-commitment-game-start', type: 'game_start' });

    expect(s.cards.find((entry) => entry.instanceId === a)?.definitionId).toBe(FIST);
    expect(s.cards.find((entry) => entry.instanceId === b)?.definitionId).toBe(FIST);
    expect(s.cards.find((entry) => entry.instanceId === c)?.definitionId).toBe(BASIC_C);
    expect(s.cards.find((entry) => entry.instanceId === d)?.definitionId).toBe(BASIC_D);
  });

  it('activates one exact current-round commitment through the public command path and enforces deployment plus movement authority', () => {
    const s = state();
    const resolve = add(s, RESOLVE);
    expect(activationAction(s, resolve)).toBeDefined();
    expect(rules.dispatchAbilityCommand(s, 'p1', activationAction(s, resolve)!).ok).toBe(true);

    expect(s.abilityRuntime!.roundPlayerPowerAdjustments).toContainEqual(expect.objectContaining({
      playerId: 'p1',
      amount: 2,
      round: s.round.roundNumber,
      sourceCardId: resolve,
      abilityId: 'resolve.activate',
    }));
    expect(rules.roundCommitmentMustDeployToBattlefield(s, 'p1')).toBe(true);
    expect(rules.roundCommitmentMovementLocked(s, 'p1')).toBe(true);
    expect(activationAction(s, resolve)).toBeUndefined();

    const moved = rules.movePlayer(s, { playerId: 'p1', to: 'shinto', movementKind: 'effect' });
    expect(moved.moved).toBe(false);
    expect(moved.reason).toBe('movement_locked');

    delete s.players[0]!.locationId;
    const session = new rules.MatchSession({
      humanPlayerId: 'p1',
      humanPlayerIds: ['p1', 'p2', 'p3'],
      restorePackKind: 'trusted_authoring_fixture',
    }, false);
    session.state = s;
    const deployments = session.legalDeploymentActions('p1');
    expect(deployments.length).toBeGreaterThan(0);
    const battlefieldIds = new Set(s.map.locations.filter((location) => location.tags.includes('battlefield')).map((location) => location.id));
    expect(deployments.every((action) => battlefieldIds.has(action.locationId))).toBe(true);

    const adjustment = s.abilityRuntime!.roundPlayerPowerAdjustments![0]!;
    expect(rules.isRoundCommitmentPowerAdjustmentValidForRestore(s, adjustment)).toBe(true);
    const forged = { ...adjustment, amount: 3 };
    expect(rules.isRoundCommitmentPowerAdjustmentValidForRestore(s, forged)).toBe(false);
  });

  it('applies the exact trusted battle-loss penalty only after the commitment is active', () => {
    const s = state();
    const resolve = add(s, RESOLVE);
    expect(rules.dispatchAbilityCommand(s, 'p1', activationAction(s, resolve)!).ok).toBe(true);

    rules.processAbilityEvent(s, battleResult('round-commitment-loss-result', ['p2']));
    expect(s.players[0]!.vp).toBe(3);
    expect(s.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'victory_points_adjusted',
      playerId: 'p1',
      abilityId: 'resolve.loss',
      delta: -2,
    }));
  });

  it('keeps the fixed-definition +6 behind a live ascension provider and penalizes every trusted loser on a committed win', () => {
    const s = state();
    const resolve = add(s, RESOLVE);
    const asc = add(s, ASC, 'outside_game');
    const fist = add(s, FIST, 'hand');

    expect(rules.calculateCardPower(s, fist).value).toBe(5);
    s.cards.find((entry) => entry.instanceId === asc)!.zone = 'skill';
    expect(rules.calculateCardPower(s, fist).value).toBe(11);

    expect(rules.dispatchAbilityCommand(s, 'p1', activationAction(s, resolve)!).ok).toBe(true);
    rules.processAbilityEvent(s, battleResult('round-commitment-win-result', ['p1']));

    expect(s.players[1]!.vp).toBe(3);
    expect(s.players[2]!.vp).toBe(2);
    expect(s.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'victory_points_adjusted', playerId: 'p2', abilityId: 'asc.win-losers', delta: -2 }),
      expect.objectContaining({ type: 'victory_points_adjusted', playerId: 'p3', abilityId: 'asc.win-losers', delta: -2 }),
    ]));
  });
});
