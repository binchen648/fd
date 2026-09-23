import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { createMatchSession } from '../src/match-session';
import { stepGameLoop } from '../src/core/game-loop';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityEvent, AuthoringAbility, GameState } from '../src/index';

const SOURCE_DEF = 'fixture.fb2-54.source';
const SOURCE_ID = 'fb2-54-source';
const OTHER_DEF = 'fixture.fb2-54.other';
const OTHER_ID = 'fb2-54-other';
const BATTLEFIELD = 'shinto';

function powerAbility(trigger: 'after_controller_enters_location' | 'after_player_deployed_to_battlefield' = 'after_controller_enters_location'): AuthoringAbility {
  return {
    id: `entry-power-${trigger}`,
    kind: 'forced_trigger',
    printedClause: 'opponent enters: source +2 power',
    activation: { trigger },
    conditions: [
      { type: 'source_active' },
      { type: 'event_player_is_opponent' },
      { type: 'event_location_equals_controller' },
    ],
    targets: [],
    effects: [{ type: rules.SOURCE_CARD_COMBAT_POWER_BONUS_EFFECT, amount: 2 }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function winAbility(): AuthoringAbility {
  return {
    id: 'uncontested-win-reward',
    kind: 'forced_trigger',
    printedClause: 'win without an opponent: +4 VP',
    activation: { trigger: 'after_controller_wins_battle' },
    conditions: [
      { type: 'source_active' },
      { type: 'event_location_equals_controller' },
      { type: rules.EVENT_BATTLE_OPPONENT_COUNT_EQUALS_CONDITION, count: 0 },
    ],
    targets: [],
    effects: [{ type: 'adjust_victory_points', player: 'controller', amount: 4 }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function archive(abilities: AuthoringAbility[]) {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: 'fixture.fb2-54', name: 'FB2-54 fixture', cards: [{
      id: SOURCE_DEF, name: SOURCE_DEF, cardType: 'servant_skill',
      cardFace: { typeLabel: 'fixture', cost: 0, basePower: 5, attributes: [] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [], abilities,
    }],
  } as any;
}

function compiledPack(abilities: AuthoringAbility[]) {
  const pack = rules.loadAuthoringJson(archive(abilities));
  expect(pack.report).toEqual([]);
  return pack;
}

function setup(abilities: AuthoringAbility[] = [powerAbility(), powerAbility('after_player_deployed_to_battlefield'), winAbility()]) {
  const pack = compiledPack(abilities);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [
    {
      instanceId: SOURCE_ID, definitionId: SOURCE_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area',
      visibility: { scope: 'public' },
    },
    {
      instanceId: OTHER_ID, definitionId: OTHER_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area',
      visibility: { scope: 'public' },
    },
  ];
  for (const player of state.players) player.locationId = BATTLEFIELD;
  rules.initializeAbilityRuntime(state, {
    cards: {
      ...pack.cards,
      [OTHER_DEF]: {
        id: OTHER_DEF, name: OTHER_DEF, cardType: 'servant_skill', ownerId: 'servant.fixture',
        cardFace: { typeLabel: 'fixture', cost: 0, basePower: 3, attributes: [] },
        playTiming: {}, playRequirements: [], abilities: [], mode: 'automatic', playKind: 'support', destinationZone: 'field',
      },
    },
  }, { seed: 20260923 });
  state.abilityRuntime!.cardState[SOURCE_ID] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  state.abilityRuntime!.cardState[OTHER_ID] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function entryEvent(id: string, playerId = 'p2', locationId = BATTLEFIELD, type: 'after_controller_enters_location' | 'after_player_deployed_to_battlefield' = 'after_controller_enters_location'): AbilityEvent {
  return { id, type, playerId, locationId };
}

function battleRoot(overrides: Partial<AbilityEvent> = {}): AbilityEvent {
  const resultId = 'phase-1:battle:shinto:1:result';
  return {
    id: resultId,
    type: 'after_battle_result_determined',
    battlePhaseResolutionId: 'phase-1',
    battleId: 'phase-1:battle:shinto:1',
    resultId,
    battleParticipantIds: ['p1'],
    battleParticipantPowers: { p1: 5 },
    battlefieldId: BATTLEFIELD,
    battleResult: { winners: ['p1'], loserIds: [] },
    ...overrides,
  };
}

function sourcePower(state: GameState): number {
  return rules.calculateCardPower(state, SOURCE_ID).value;
}

function otherPower(state: GameState): number {
  return rules.calculateCardPower(state, OTHER_ID).value;
}

describe('P3-FB2-54 event power / uncontested-win reward family', () => {
  it('accepts exactly both entry roots and the uncontested-win whole envelope in authoring and compiled forms', () => {
    for (const ability of [powerAbility(), powerAbility('after_player_deployed_to_battlefield'), winAbility()]) {
      expect(rules.isEventPowerUncontestedWinRewardCandidate(ability)).toBe(true);
      expect(rules.isAcceptedEventPowerUncontestedWinRewardAbility(ability, 'authoring')).toBe(true);
      const pack = rules.loadAuthoringJson(archive([ability]));
      expect(pack.report).toEqual([]);
      expect(rules.isAcceptedEventPowerUncontestedWinRewardAbility(pack.cards[SOURCE_DEF]!.abilities[0]!, 'compiled')).toBe(true);
    }
  });

  it('reserves both new vocabulary nodes to exact literal shape, slot, order, trigger, and parent envelope', () => {
    const wrongAmount: any = powerAbility(); wrongAmount.effects[0].amount = 3;
    const wrongEntryTrigger: any = powerAbility(); wrongEntryTrigger.activation = { trigger: 'after_controller_wins_battle' };
    const wrongOrder: any = powerAbility(); wrongOrder.conditions = [wrongOrder.conditions[1], wrongOrder.conditions[0], wrongOrder.conditions[2]];
    const wrongCount: any = winAbility(); wrongCount.conditions[2].count = 1;
    const wrongWinTrigger: any = winAbility(); wrongWinTrigger.activation = { trigger: 'after_battle_result_determined' };
    const wrongPosition: any = powerAbility(); wrongPosition.effects = [{ type: 'noop' }, { type: rules.SOURCE_CARD_COMBAT_POWER_BONUS_EFFECT, amount: 2 }];
    for (const ability of [wrongAmount, wrongEntryTrigger, wrongOrder, wrongCount, wrongWinTrigger, wrongPosition]) {
      const loaded = rules.loadAuthoringJson(archive([ability]));
      expect(loaded.report.some((entry) => entry.status === 'unsupported')).toBe(true);
      expect(loaded.report.some((entry) => entry.path === 'eventPowerUncontestedWinReward.gateway')).toBe(true);
      expect(loaded.cards[SOURCE_DEF]!.abilities[0]!.execution.mode).toBe('unsupported');
    }
  });

  it('stacks +2 on the exact physical active source for distinct trusted ordinary-entry events and dedupes duplicate ids', () => {
    const state = setup([powerAbility()]);
    expect(sourcePower(state)).toBe(5);
    expect(otherPower(state)).toBe(3);
    rules.processAuthoritativeEntryAbilityEvent(state, entryEvent('enter-1'));
    expect(sourcePower(state)).toBe(7);
    rules.processAuthoritativeEntryAbilityEvent(state, entryEvent('enter-2'));
    expect(sourcePower(state)).toBe(9);
    rules.processAuthoritativeEntryAbilityEvent(state, entryEvent('enter-2'));
    expect(sourcePower(state)).toBe(9);
    expect(otherPower(state)).toBe(3);
    expect(state.abilityRuntime!.ongoingEffects.filter((entry) => entry.policyKey === rules.EVENT_POWER_SOURCE_BONUS_POLICY)).toHaveLength(2);
  });

  it('accepts the clarified authoritative deployment entry root with the same exact +2 behavior', () => {
    const state = setup([powerAbility('after_player_deployed_to_battlefield')]);
    rules.processAuthoritativeEntryAbilityEvent(state, entryEvent('deploy:1:p2', 'p2', BATTLEFIELD, 'after_player_deployed_to_battlefield'));
    expect(sourcePower(state)).toBe(7);
  });

  it('rejects exact-shaped direct entry events and persisted trust residue outside the authoritative producer transaction', () => {
    const state = setup([powerAbility()]);
    state.abilityRuntime!.trustedEntryEventSnapshots = {
      'forged-exact': { type: 'after_controller_enters_location', playerId: 'p2', locationId: BATTLEFIELD },
    };
    rules.processAbilityEvent(state, entryEvent('forged-exact'));
    expect(sourcePower(state)).toBe(5);
    expect(state.abilityRuntime!.ongoingEffects).toEqual([]);
    expect(state.abilityRuntime!.trustedEntryEventSnapshots).toBeUndefined();
  });

  it('exercises the real ordinary-movement producer and grants +2 only after the server move settles', () => {
    const state = setup([powerAbility()]);
    state.round.activePhase = 'action';
    state.players[0]!.locationId = BATTLEFIELD;
    state.players[1]!.locationId = 'miyama_town';
    state.players[2]!.locationId = 'magic_workshop';
    state.players[2]!.mana = 7;
    const result = stepGameLoop(state, {
      action: { type: 'move', playerId: 'p3', to: BATTLEFIELD, movementKind: 'normal' },
    });
    expect(result.nextState.players[2]!.locationId).toBe(BATTLEFIELD);
    expect(rules.calculateCardPower(result.nextState, SOURCE_ID).value).toBe(7);
    expect(result.nextState.abilityRuntime!.trustedEntryEventSnapshots).toBeUndefined();
  });

  it('fails closed for self, other-location, stale affected location, unknown player, extra-field event, and inactive source', () => {
    const cases: Array<(state: GameState) => AbilityEvent> = [
      () => entryEvent('self', 'p1'),
      (state) => { state.players[1]!.locationId = 'miyama_town'; return entryEvent('other-location', 'p2', 'miyama_town'); },
      () => entryEvent('stale', 'p2', 'miyama_town'),
      () => entryEvent('unknown', 'missing'),
      () => ({ ...entryEvent('extra'), forged: true } as AbilityEvent),
    ];
    for (const makeEvent of cases) {
      const state = setup([powerAbility()]);
      const event = makeEvent(state);
      if (Object.keys(event).some((key) => key === 'forged')) {
        const before = structuredClone(state);
        expect(() => rules.processAuthoritativeEntryAbilityEvent(state, event)).toThrow(/exact event shape/);
        expect(state).toEqual(before);
      } else {
        rules.processAuthoritativeEntryAbilityEvent(state, event);
      }
      expect(sourcePower(state)).toBe(5);
      expect(state.abilityRuntime!.ongoingEffects).toEqual([]);
    }
    const inactive = setup([powerAbility()]);
    inactive.abilityRuntime!.cardState[SOURCE_ID]!.active = false;
    rules.processAuthoritativeEntryAbilityEvent(inactive, entryEvent('inactive'));
    expect(sourcePower(inactive)).toBe(5);
    expect(inactive.abilityRuntime!.ongoingEffects).toEqual([]);
  });

  it('stops accumulated contribution when the physical source becomes inactive or leaves an active area', () => {
    const state = setup([powerAbility()]);
    rules.processAuthoritativeEntryAbilityEvent(state, entryEvent('enter-live'));
    expect(sourcePower(state)).toBe(7);
    state.abilityRuntime!.cardState[SOURCE_ID]!.active = false;
    expect(sourcePower(state)).toBe(5);
    state.abilityRuntime!.cardState[SOURCE_ID]!.active = true;
    state.cards.find((card) => card.instanceId === SOURCE_ID)!.zone = 'skill';
    expect(sourcePower(state)).toBe(5);
    expect(otherPower(state)).toBe(3);
  });

  it('fails closed on malformed serialized FB2-54 ongoing state before power calculation', () => {
    const state = setup([powerAbility()]);
    rules.processAuthoritativeEntryAbilityEvent(state, entryEvent('enter-state'));
    const ongoing = state.abilityRuntime!.ongoingEffects.find((entry) => entry.policyKey === rules.EVENT_POWER_SOURCE_BONUS_POLICY)!;
    ongoing.ruleModifiers[0]!.definition.value = 99;
    expect(() => sourcePower(state)).toThrow(/Malformed FB2-54/);
  });

  it('rewards exactly +4 through the authoritative VP path when the controller is the sole trusted battle participant and winner', () => {
    const state = setup([winAbility()]);
    state.players[0]!.vp = 2;
    rules.processAbilityEvent(state, battleRoot());
    expect(state.players[0]!.vp).toBe(6);
    const changes = Object.values(state.abilityRuntime!.trustedVictoryPointChanges ?? {});
    expect(changes).toContainEqual(expect.objectContaining({ playerId: 'p1', delta: 4, before: 2, after: 6, resource: 'victory_points' }));
    expect(state.abilityRuntime!.trustedBattleResultSnapshots?.['phase-1:battle:shinto:1:result']).toMatchObject({
      battleParticipantIds: ['p1'], winners: ['p1'], loserIds: [], battlefieldId: BATTLEFIELD,
    });
  });

  it('does not reward a contested controller win and keeps the frozen participant snapshot authoritative', () => {
    const state = setup([winAbility()]);
    state.players[0]!.vp = 2;
    rules.processAbilityEvent(state, battleRoot({
      battleParticipantIds: ['p1', 'p2'],
      battleParticipantPowers: { p1: 5, p2: 3 },
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    }));
    expect(state.players[0]!.vp).toBe(2);
    expect(Object.values(state.abilityRuntime!.trustedVictoryPointChanges ?? {}).some((entry) => entry.playerId === 'p1' && entry.delta === 4)).toBe(false);
  });

  it('rejects forged or stale derived controller-win events without trusted exact battle provenance', () => {
    const state = setup([winAbility()]);
    state.players[0]!.vp = 2;
    const forged: AbilityEvent = {
      ...battleRoot(), id: 'phase-1:battle:shinto:1:result:win:p1', type: 'after_controller_wins_battle', playerId: 'p1',
    };
    rules.processAbilityEvent(state, forged);
    expect(state.players[0]!.vp).toBe(2);

    const trusted = setup([winAbility()]);
    trusted.players[0]!.vp = 2;
    rules.processAbilityEvent(trusted, battleRoot({ battleParticipantIds: ['p1', 'p2'], battleParticipantPowers: { p1: 5, p2: 3 }, battleResult: { winners: ['p2'], loserIds: ['p1'] } }));
    const stale: AbilityEvent = {
      ...battleRoot(), id: 'phase-1:battle:shinto:1:result:win:p1', type: 'after_controller_wins_battle', playerId: 'p1',
    };
    rules.processAbilityEvent(trusted, { ...stale, id: `${stale.id}:forged` });
    expect(trusted.players[0]!.vp).toBe(2);
  });

  it('keeps trusted snapshot mismatches and unknown frozen participants mutation-free for VP', () => {
    const run = (snapshot: any, event: AbilityEvent) => {
      const state = setup([winAbility()]);
      state.players[0]!.vp = 2;
      state.abilityRuntime!.trustedBattleResultSnapshots = { [snapshot.resultId]: snapshot };
      rules.processAbilityEvent(state, event);
      expect(state.players[0]!.vp).toBe(2);
      expect(Object.values(state.abilityRuntime!.trustedVictoryPointChanges ?? {}).some((entry) => entry.playerId === 'p1' && entry.delta === 4)).toBe(false);
    };
    const snapshot = {
      battlePhaseResolutionId: 'phase-trusted', battleId: 'battle-trusted', resultId: 'result-trusted', battlefieldId: BATTLEFIELD,
      battleParticipantIds: ['p1'], battleParticipantPowers: { p1: 5 }, winners: ['p1'], loserIds: [],
    };
    const exactDerived: AbilityEvent = {
      id: 'result-trusted:win:p1', type: 'after_controller_wins_battle', playerId: 'p1',
      battlePhaseResolutionId: 'phase-trusted', battleId: 'battle-trusted', resultId: 'result-trusted',
      battleParticipantIds: ['p1'], battleParticipantPowers: { p1: 5 }, battlefieldId: BATTLEFIELD,
      battleResult: { winners: ['p1'], loserIds: [] },
    };
    run(snapshot, { ...exactDerived, battlefieldId: 'miyama_town' });
    run(snapshot, { ...exactDerived, resultId: 'result-other', id: 'result-other:win:p1' });
    run({ ...snapshot, battleParticipantIds: ['p1', 'missing'], battleParticipantPowers: { p1: 5, missing: 0 } }, {
      ...exactDerived, battleParticipantIds: ['p1', 'missing'], battleParticipantPowers: { p1: 5, missing: 0 },
    });
  });
  it('exercises the real MatchSession deployment producer and grants +2 when an opponent deploys into the source battlefield', () => {
    const pack = compiledPack([powerAbility('after_player_deployed_to_battlefield')]);
    const session = createMatchSession({ seed: 20260923, humanPlayerId: 'p1' });
    const controller = session.state.players[0]!;
    const opponent = session.state.players[1]!;
    session.state.round.activePhase = 'advance';
    session.state.round.prioritySeat = opponent.seat;
    controller.locationId = BATTLEFIELD;
    delete opponent.locationId;
    for (const player of session.state.players.slice(2)) delete player.locationId;
    session.state.abilityRuntime!.pack.cards[SOURCE_DEF] = pack.cards[SOURCE_DEF]!;
    session.state.cards.push({
      instanceId: SOURCE_ID, definitionId: SOURCE_DEF, ownerPlayerId: controller.id, controllerPlayerId: controller.id,
      zone: 'attack_area', visibility: { scope: 'public' },
    });
    session.state.abilityRuntime!.cardState[SOURCE_ID] = { active: true, faceDown: false, playedRound: session.state.round.roundNumber };
    expect(session.legalDeploymentActions(opponent.id)).toContainEqual({ type: 'deploy_player', locationId: BATTLEFIELD });
    const result = session.dispatchPlayerCommand(opponent.id, { type: 'deploy_player', locationId: BATTLEFIELD });
    expect(result.ok).toBe(true);
    expect(session.state.players[1]!.locationId).toBe(BATTLEFIELD);
    expect(rules.calculateCardPower(session.state, SOURCE_ID).value).toBe(7);
  });
});