import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '@fd/content';
import { compileExecutableCardPack } from '../../src/ability/executable-card-pack';
import { isBattleEndResidualCloseCandidate, isBattleEndResidualCloseSemantic } from '../../src/ability/triggered-residual-close';
import { executeAbility, processAbilityEvent, projectAbilityState } from '../../src/ability/interpreter';
import { createMatchSession } from '../../src/match-session';
import { hostOperations, type AuthoringAbility } from '../../src/ability/types';

const SOURCE_ID = 'b2-r81-close-source';
const CARD_ID = 'synthetic.residual-close';

function ability(): AuthoringAbility {
  return {
    id: 'synthetic.close-after-battle', kind: 'residual', printedClause: 'synthetic',
    activation: { phase: 'combat', trigger: 'after_battle_ended', requiresSourceState: 'active' },
    conditions: [{ type: 'source_active' }, { type: 'player_flag_number_not_current_round', key: 'combatLossRound' }],
    targets: [], effects: [{ type: 'close_source_card' }], cost: [], creates: [], ruleModifiers: [],
    lifecycle: { duration: 'while_active', starts: 'immediate', cleanup: 'remain_active' },
    responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function sessionWithClose(opponentPower = 2) {
  const session = createMatchSession({ seed: 20260920, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
  const state = session.state;
  state.round.activePhase = 'battle';
  state.eventPlacements = [];
  state.currentSituationModifiers = [];
  state.battleResults = [];
  state.abilityRuntime!.hostRequests = [];
  state.abilityRuntime!.responseWindows = [];
  state.abilityRuntime!.pendingPostBattleEvents = [];
  delete state.abilityRuntime!.pendingDecision;
  for (const player of state.players) {
    player.status = ['p1', 'p2'].includes(player.id) ? 'active' : 'eliminated';
    player.vp = 0;
    player.militaryResult = 0;
    if (player.status === 'active') player.locationId = 'miyama_town';
    else delete player.locationId;
  }
  for (const card of state.cards) {
    if (card.zone !== 'field' && card.zone !== 'attack_area') continue;
    card.zone = 'discard';
    card.visibility = { scope: 'owner_only', ownerPlayerId: card.ownerPlayerId };
    if (state.abilityRuntime!.cardState[card.instanceId]) state.abilityRuntime!.cardState[card.instanceId]!.active = false;
  }
  state.abilityRuntime!.pack.cards[CARD_ID] = {
    id: CARD_ID, name: 'Synthetic residual', cardType: 'servant_skill',
    cardFace: { typeLabel: 'skill', cost: 0, basePower: 5, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [ability()], mode: 'automatic', playKind: 'attack', destinationZone: 'attack_area',
  };
  state.cards.push({ instanceId: SOURCE_ID, definitionId: CARD_ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState[SOURCE_ID] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  state.cards.push({ instanceId: 'b2-r81-opponent', definitionId: `basic.strength.${opponentPower}`, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState['b2-r81-opponent'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return session;
}

function resolveBattle(session: ReturnType<typeof createMatchSession>) {
  (session as unknown as { resolveBattlePhase: () => void }).resolveBattlePhase();
}

describe('P3-B2-R81 shared battle-end residual CLOSE integration', () => {
  it('classifies by semantic shape, not ability or card identity', () => {
    const exact = ability();
    exact.id = 'renamed.close';
    expect(isBattleEndResidualCloseCandidate(exact)).toBe(true);
    expect(isBattleEndResidualCloseSemantic(exact)).toBe(true);
    const loaderDefault = structuredClone(exact);
    loaderDefault.execution.allowedOperations = [...hostOperations];
    expect(isBattleEndResidualCloseSemantic(loaderDefault)).toBe(true);
    const onPlay = structuredClone(exact);
    onPlay.activation.trigger = 'on_card_played';
    expect(isBattleEndResidualCloseCandidate(onPlay)).toBe(true);
    expect(isBattleEndResidualCloseSemantic(onPlay)).toBe(false);
    const externalClose = structuredClone(exact);
    externalClose.kind = 'phase_action';
    externalClose.activation = { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' };
    externalClose.conditions = [];
    externalClose.lifecycle = {};
    expect(isBattleEndResidualCloseCandidate(externalClose)).toBe(false);
    const roundEndClose = structuredClone(externalClose);
    roundEndClose.kind = 'residual';
    roundEndClose.activation = { trigger: 'round_end', requiresSourceState: 'active' };
    expect(isBattleEndResidualCloseCandidate(roundEndClose)).toBe(false);
    roundEndClose.conditions = [
      { type: 'source_active' },
      { type: 'player_flag_number_not_current_round', key: 'combatWinRound' },
    ];
    expect(isBattleEndResidualCloseCandidate(roundEndClose)).toBe(false);
    for (const mutate of [
      (a: AuthoringAbility) => { a.activation.trigger = 'round_end'; },
      (a: AuthoringAbility) => { a.kind = 'forced_trigger'; },
      (a: AuthoringAbility) => { a.activation.trigger = 'on_card_played'; },
      (a: AuthoringAbility) => { a.activation.phase = 'action'; },
      (a: AuthoringAbility) => { a.conditions[1]!.key = 'other'; },
      (a: AuthoringAbility) => { a.conditions.push({ type: 'controller_won_battle' }); },
      (a: AuthoringAbility) => { a.targets.push({ id: 'target', type: 'player' }); },
      (a: AuthoringAbility) => { a.cost.push({ type: 'pay_mana', amount: 1 }); },
      (a: AuthoringAbility) => { a.creates.push({ type: 'create_card', cardId: 'card.luck' }); },
      (a: AuthoringAbility) => { a.effects = []; },
      (a: AuthoringAbility) => { a.effects.push({ type: 'noop' }); },
      (a: AuthoringAbility) => { a.execution.mode = 'host_adjudicated'; },
    ]) {
      const invalid = ability();
      mutate(invalid);
      expect(isBattleEndResidualCloseCandidate(invalid)).toBe(true);
      expect(isBattleEndResidualCloseSemantic(invalid)).toBe(false);
    }
  });

  it('compiler rejects a drifted residual CLOSE before it can reach legacy', () => {
    const loaded = loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: resolve('.') });
    const input = compileLoadedPlaytestPack(loaded).library;
    const archive = input.rules.archives.find((item) => item.id === 'servant.ereshkigal')!;
    archive.cards[0]!.abilities!.push(ability() as any);
    expect(compileExecutableCardPack(input).cards[archive.cards[0]!.id]!.abilities.some((item) => item.id === 'synthetic.close-after-battle')).toBe(true);
    for (const mutate of [
      (a: AuthoringAbility) => { a.activation.trigger = 'round_end'; },
      (a: AuthoringAbility) => { a.kind = 'forced_trigger'; },
      (a: AuthoringAbility) => { a.conditions.pop(); },
      (a: AuthoringAbility) => { a.conditions.push({ type: 'controller_won_battle' }); },
      (a: AuthoringAbility) => { a.effects = []; },
      (a: AuthoringAbility) => { a.effects.push({ type: 'noop' }); },
    ]) {
      const invalid = ability();
      mutate(invalid);
      archive.cards[0]!.abilities![archive.cards[0]!.abilities!.length - 1] = invalid as any;
      expect(() => compileExecutableCardPack(input)).toThrow(/Unsupported battle-end residual CLOSE semantic shape/);
    }
  });

  it('closes once after real MatchSession battle scoring and projects owner-only skill state', () => {
    const session = sessionWithClose();
    resolveBattle(session);
    expect(session.logs.filter((entry) => entry.type === 'battle_terminal_event_dispatched')).toHaveLength(1);
    expect(session.state.cards.find((card) => card.instanceId === SOURCE_ID)).toMatchObject({ zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
    expect(session.state.abilityRuntime!.cardState[SOURCE_ID]).toMatchObject({ active: false, faceDown: false });
    expect(session.state.abilityRuntime!.events.filter((event) => event.type === 'source_card_closed' && event.sourceCardId === SOURCE_ID)).toHaveLength(1);
    expect(projectAbilityState(session.state, 'p1').cards).toContainEqual(expect.objectContaining({ instanceId: SOURCE_ID, definitionId: CARD_ID, zone: 'skill' }));
    expect(projectAbilityState(session.state, 'p2').cards.some((card) => card.instanceId === SOURCE_ID)).toBe(false);
    const snapshot = JSON.stringify(session.state);
    processAbilityEvent(session.state, {
      id: `battle-phase:${session.state.round.roundNumber}:after_battle_ended`, type: 'after_battle_ended',
    });
    expect(JSON.stringify(session.state)).toBe(snapshot);
  });

  it('preserves the source after a real battle loss', () => {
    const session = sessionWithClose(5);
    session.state.abilityRuntime!.pack.cards[CARD_ID]!.cardFace.basePower = 1;
    resolveBattle(session);
    expect(session.state.cards.find((card) => card.instanceId === SOURCE_ID)?.zone).not.toBe('skill');
    expect(session.state.abilityRuntime!.events.filter((event) => event.type === 'source_card_closed' && event.sourceCardId === SOURCE_ID)).toHaveLength(0);
  });

  it('treats nonparticipation as non-loss in the real terminal phase', () => {
    const session = sessionWithClose();
    const state = session.state;
    state.players.find((player) => player.id === 'p1')!.locationId = 'shinto';
    const third = state.players.find((player) => player.id === 'p3')!;
    third.status = 'active';
    third.locationId = 'miyama_town';
    state.cards.push({ instanceId: 'b2-r81-third', definitionId: 'basic.strength.2', ownerPlayerId: 'p3', controllerPlayerId: 'p3', zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['b2-r81-third'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    resolveBattle(session);
    expect(state.abilityRuntime!.events.filter((event) => event.type === 'source_card_closed' && event.sourceCardId === SOURCE_ID)).toHaveLength(1);
  });

  it('rejects stale and non-terminal provenance without mutation', () => {
    for (const event of [
      { id: 'battle-phase:999:after_battle_ended', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:999' },
      { id: 'battle-phase:1:after_battle_ended', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:1' },
      { id: 'battle-phase:1:after_battle_ended', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:1',
        battleIds: ['broken'], resultIds: [], scoringReceiptIds: [], battleParticipantIds: [], battleOutcomes: [] },
    ] as const) {
      const session = sessionWithClose();
      const before = JSON.stringify(session.state);
      expect(() => executeAbility(session.state, {
        controllerId: 'p1', sourceCardId: SOURCE_ID, abilityId: 'synthetic.close-after-battle', variables: {}, selections: {}, event,
      })).toThrow(/terminal non-loss provenance/);
      expect(JSON.stringify(session.state)).toBe(before);
    }
  });

  it('rolls back typed CLOSE when subsequent lifecycle cleanup fails', () => {
    const session = sessionWithClose();
    const state = session.state;
    state.abilityRuntime!.ongoingEffects.push({
      id: 'corrupt-lifecycle', sourceCardId: SOURCE_ID, abilityId: 'synthetic.close-after-battle', controllerId: 'p1',
      starts: 'immediate', duration: 'while_card_active', startRound: 1, cleanup: 'remain_active',
      ruleModifiers: [], publicZones: [], sourceValidityPolicyId: 'invalid',
    });
    const before = JSON.stringify(state);
    expect(() => processAbilityEvent(state, {
      id: 'battle-phase:1:after_battle_ended', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:1',
      battleIds: [], resultIds: [], scoringReceiptIds: [], battleParticipantIds: [], battleOutcomes: [],
    })).toThrow(/Corrupt source-bound lifecycle state/);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('rejects a mutated would-be route without changing caller state', () => {
    const session = sessionWithClose();
    session.state.abilityRuntime!.pack.cards[CARD_ID]!.abilities[0]!.cost.push({ type: 'pay_mana', amount: 1 });
    const before = JSON.stringify(session.state);
    expect(() => executeAbility(session.state, {
      controllerId: 'p1', sourceCardId: SOURCE_ID, abilityId: 'synthetic.close-after-battle', variables: {}, selections: {},
    })).toThrow(/Unsupported battle-end residual CLOSE semantic shape/);
    expect(JSON.stringify(session.state)).toBe(before);
  });

  it('rejects a missing source identity before any state write', () => {
    const session = sessionWithClose();
    session.state.cards = session.state.cards.filter((card) => card.instanceId !== SOURCE_ID);
    const before = JSON.stringify(session.state);
    expect(() => executeAbility(session.state, {
      controllerId: 'p1', sourceCardId: SOURCE_ID, abilityId: 'synthetic.close-after-battle', variables: {}, selections: {},
    })).toThrow(/Ability is not available/);
    expect(JSON.stringify(session.state)).toBe(before);
  });

  it('does not fall back to legacy CLOSE for a forced-trigger near match', () => {
    const session = sessionWithClose();
    session.state.abilityRuntime!.pack.cards[CARD_ID]!.abilities[0]!.kind = 'forced_trigger';
    const source = session.state.cards.find((card) => card.instanceId === SOURCE_ID)!;
    const before = JSON.stringify(session.state);
    expect(() => processAbilityEvent(session.state, {
      id: 'battle-phase:1:after_battle_ended', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:1',
      battleIds: [], resultIds: [], scoringReceiptIds: [], battleParticipantIds: [], battleOutcomes: [],
    })).toThrow(/Unsupported battle-end residual CLOSE semantic shape/);
    expect(JSON.stringify(session.state)).toBe(before);
    expect(source).toMatchObject({ zone: 'attack_area', visibility: { scope: 'public' } });
    expect(session.state.abilityRuntime!.events.filter((event) => event.type === 'source_card_closed' && event.sourceCardId === SOURCE_ID)).toHaveLength(0);
  });

  it.each([
    ['wrong controller', (session: ReturnType<typeof createMatchSession>) => { session.state.cards.find((card) => card.instanceId === SOURCE_ID)!.controllerPlayerId = 'p2'; }],
    ['wrong zone', (session: ReturnType<typeof createMatchSession>) => { session.state.cards.find((card) => card.instanceId === SOURCE_ID)!.zone = 'discard'; }],
    ['inactive', (session: ReturnType<typeof createMatchSession>) => { session.state.abilityRuntime!.cardState[SOURCE_ID]!.active = false; }],
    ['face down', (session: ReturnType<typeof createMatchSession>) => { session.state.abilityRuntime!.cardState[SOURCE_ID]!.faceDown = true; }],
  ] as const)('rejects %s source before lifecycle or event mutation', (_label, corrupt) => {
    const session = sessionWithClose();
    corrupt(session);
    const before = JSON.stringify(session.state);
    expect(() => executeAbility(session.state, {
      controllerId: 'p1', sourceCardId: SOURCE_ID, abilityId: 'synthetic.close-after-battle', variables: {}, selections: {},
      event: { id: 'battle-phase:1:after_battle_ended', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:1',
        battleIds: [], resultIds: [], scoringReceiptIds: [], battleParticipantIds: [], battleOutcomes: [] },
    })).toThrow();
    expect(JSON.stringify(session.state)).toBe(before);
  });
});
