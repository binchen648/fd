import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import { createMatchSession, restoreMatchSession } from '../src/match-session';
import type { AbilityDefinitionPack, AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../src/ability/types';

const SOURCE = 'flag-source';
const DEF = 'skill.flag-source';

function ability(id: string, conditions: RuleNode[] = [], effects: RuleNode[] = [], triggered = false): AuthoringAbility {
  return {
    id, kind: triggered ? 'forced_trigger' : 'phase_action', printedClause: 'synthetic flag proof',
    activation: triggered ? { trigger: 'after_battle_result_determined' } : { phase: 'action', opens: 'controller_action_window' },
    conditions, targets: [], effects, cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function setup(probeCondition: RuleNode = { type: 'player_flag_equals', key: 'ready', value: true }) {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{ instanceId: SOURCE, definitionId: DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field',
    visibility: { scope: 'public' } }];
  const setter = ability('setter');
  const probe = ability('probe', [probeCondition], [], true);
  const card: ExecutableCardDefinition = {
    id: DEF, name: 'flag source', cardType: 'master_skill', ownerId: 'master.synthetic',
    cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] }, playTiming: {}, playRequirements: [],
    abilities: [setter, probe], mode: 'automatic', playKind: 'support', destinationZone: 'field',
  };
  const pack: AbilityDefinitionPack = { cards: { [DEF]: card } };
  rules.initializeAbilityRuntime(state, pack, { seed: 20260926 });
  state.abilityRuntime!.cardState[SOURCE] = { active: true, faceDown: false } as any;
  return state;
}

function ctx() {
  return { controllerId: 'p1', sourceCardId: SOURCE, abilityId: 'setter', variables: {}, selections: {} };
}
function event(id = 'flag-probe') {
  return { id, type: 'after_battle_result_determined', playerId: 'p1', battleResult: { winners: ['p1'], loserIds: ['p2'] } };
}

function archive(condition: RuleNode | null, effects: RuleNode[]) {
  return { schemaVersion: 'fd-card-authoring-v1', id: 'master.synthetic', name: 'synthetic', cards: [{
    id: DEF, name: 'flag source', cardType: 'master_skill',
    cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [], requirement: { type: 'none' } },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: [ability('fixture', condition ? [condition] : [], effects, true)],
  }] };
}

describe('P3 current-main M50 player-flag/state core replay', () => {
  it('loader admits only direct exact flag conditions/effects and controller-only mutations', () => {
    const cond = { type: 'player_flag_equals', key: 'ready', value: true };
    const set = { type: 'set_player_flag', target: 'controller', key: 'ready', value: true };
    expect(rules.loadAuthoringJson(archive(cond, [set])).report).toEqual([]);

    const nested = archive({ type: 'and', conditions: [cond] }, []);
    expect(rules.loadAuthoringJson(nested).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Structured player-flag condition is supported only as a direct ability condition' }),
    ]));
    const wrongTarget = rules.loadAuthoringJson(archive(null, [{ ...set, target: 'opponents' }]));
    expect(wrongTarget.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Structured player-flag mutation requires controller target and nonempty key' }),
    ]));
    expect(wrongTarget.cards[DEF]!.abilities[0]!.execution.mode).toBe('unsupported');

    const badCurrentRound = rules.loadAuthoringJson(archive(null, [{ type: 'set_player_flag', target: 'controller', key: 'round', value: { type: 'current_round', extra: true } }]));
    expect(badCurrentRound.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: expect.stringMatching(/set_player_flag requires a primitive or exact current_round value|current_round is supported only/) }),
    ]));
  });

  it('stores boolean, string, and safe-integer controller flags and evaluates exact conditions', () => {
    const state = setup({ type: 'player_flag_equals', key: 'ready', value: true });
    rules.resolveEffect(state, ctx(), { type: 'set_player_flag', target: 'controller', key: 'ready', value: true });
    rules.resolveEffect(state, ctx(), { type: 'set_player_flag', target: 'controller', key: 'region', value: 'india' });
    rules.resolveEffect(state, ctx(), { type: 'set_player_flag', target: 'controller', key: 'uses', value: 2 });
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1).toEqual({ ready: true, region: 'india', uses: 2 });
    expect(rules.collectTriggeredAbilities(state, event())).toHaveLength(1);

    const numeric = setup({ type: 'player_flag_number_at_least', key: 'uses', value: 2 });
    rules.resolveEffect(numeric, ctx(), { type: 'set_player_flag', target: 'controller', key: 'uses', value: 2 });
    expect(rules.collectTriggeredAbilities(numeric, event('numeric'))).toHaveLength(1);
  });

  it('records current_round exactly, distinguishes current/not-current, and expires this_round flags deterministically', () => {
    const state = setup({ type: 'player_flag_number_current_round', key: 'armedRound' });
    const round = state.round.roundNumber;
    rules.resolveEffect(state, ctx(), {
      type: 'set_player_flag', target: 'controller', key: 'armedRound', value: { type: 'current_round' }, lifecycle: { duration: 'this_round' },
    });
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1!.armedRound).toBe(round);
    expect(state.abilityRuntime!.structuredRoundFlagKeysByPlayer!.p1!.armedRound).toBe(round);
    expect(rules.collectTriggeredAbilities(state, event('current'))).toHaveLength(1);

    state.round.roundNumber = round + 1;
    expect(rules.collectTriggeredAbilities(state, event('expired'))).toEqual([]);
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1!.armedRound).toBeUndefined();
    expect(state.abilityRuntime!.structuredRoundFlagKeysByPlayer!.p1!.armedRound).toBeUndefined();

    const notCurrent = setup({ type: 'player_flag_number_not_current_round', key: 'combatLossRound' });
    rules.resolveEffect(notCurrent, ctx(), { type: 'set_player_flag', target: 'controller', key: 'combatLossRound', value: notCurrent.round.roundNumber - 1 });
    expect(rules.collectTriggeredAbilities(notCurrent, event('not-current'))).toHaveLength(1);
  });

  it('adds and clears numeric flags and fails closed for malformed prior state or safe-integer overflow', () => {
    const state = setup();
    rules.resolveEffect(state, ctx(), { type: 'add_player_flag_number', target: 'controller', key: 'count', amount: 2 });
    rules.resolveEffect(state, ctx(), { type: 'add_player_flag_number', target: 'controller', key: 'count', amount: -1 });
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1!.count).toBe(1);
    rules.resolveEffect(state, ctx(), { type: 'clear_player_flag', target: 'controller', key: 'count' });
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1!.count).toBeUndefined();

    const malformed = setup();
    (malformed.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1 ??= {}).count = 'not-a-number';
    expect(() => rules.resolveEffect(malformed, ctx(), { type: 'add_player_flag_number', target: 'controller', key: 'count', amount: 1 }))
      .toThrow(/not a safe integer|corrupt structured player flag/i);

    const overflow = setup();
    (overflow.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1 ??= {}).count = Number.MAX_SAFE_INTEGER;
    expect(() => rules.resolveEffect(overflow, ctx(), { type: 'add_player_flag_number', target: 'controller', key: 'count', amount: 1 }))
      .toThrow(/exceed safe integer range/i);
  });

  it('rejects widened lifecycles, non-safe values, nested current_round, and wrong effect routes in the loader', () => {
    const badLifecycle = rules.loadAuthoringJson(archive(null, [{ type: 'set_player_flag', target: 'controller', key: 'x', value: true, lifecycle: { duration: 'per_game' } }]));
    expect(badLifecycle.report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Structured player-flag lifecycle must be exactly this_round' })]));
    const unsafe = rules.loadAuthoringJson(archive(null, [{ type: 'set_player_flag', target: 'controller', key: 'x', value: Number.MAX_SAFE_INTEGER + 1 }]));
    expect(unsafe.report.length).toBeGreaterThan(0);
    const targetRoute: any = archive(null, []);
    targetRoute.cards[0].abilities[0].targets = [{ id: 'who', type: 'player', conditions: [{ type: 'player_flag_equals', key: 'x', value: true }], constraints: [], count: { min: 0, max: 1 } }];
    expect(rules.loadAuthoringJson(targetRoute).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Structured player-flag condition is supported only as a direct ability condition' }),
    ]));
  });

  it('round-trips valid structured flag state and rejects host-signed malformed flag payloads', () => {
    const session = createMatchSession({ seed: 20260926, humanPlayerId: 'p1', humanPlayerIds: ['p1'] });
    const round = session.state.round.roundNumber;
    session.state.abilityRuntime!.structuredPlayerFlagsByPlayer = { p1: { ready: true, label: 'ok', round } };
    session.state.abilityRuntime!.structuredRoundFlagKeysByPlayer = { p1: { round } };
    const durable = session.serializeSession();
    const restored = restoreMatchSession(durable);
    expect(restored.state.abilityRuntime!.structuredPlayerFlagsByPlayer).toEqual(session.state.abilityRuntime!.structuredPlayerFlagsByPlayer);
    expect(restored.state.abilityRuntime!.structuredRoundFlagKeysByPlayer).toEqual(session.state.abilityRuntime!.structuredRoundFlagKeysByPlayer);

    const invalidValue = createMatchSession({ seed: 20260927, humanPlayerId: 'p1', humanPlayerIds: ['p1'] });
    (invalidValue.state.abilityRuntime as any).structuredPlayerFlagsByPlayer = { p1: { forged: { nested: true } } };
    const signedInvalidValue = invalidValue.serializeSession();
    expect(() => restoreMatchSession(signedInvalidValue)).toThrow(/Invalid MatchSession state container/);

    const invalidOwner = createMatchSession({ seed: 20260928, humanPlayerId: 'p1', humanPlayerIds: ['p1'] });
    invalidOwner.state.abilityRuntime!.structuredPlayerFlagsByPlayer = { forged_player: { ready: true } };
    const signedInvalidOwner = invalidOwner.serializeSession();
    expect(() => restoreMatchSession(signedInvalidOwner)).toThrow(/Invalid MatchSession state container/);
  });
});
