import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { MatchSession, restoreMatchSession } from '../src/match-session';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const DEF = 'master.fixture.scalar-flag';
const SOURCE = 'fixture-scalar-flag-source';

function ability(effects: any[]): any {
  return {
    id: 'game-start-player-flags', kind: 'forced_trigger', printedClause: 'fixture',
    activation: { trigger: 'game_start' }, conditions: [], targets: [], effects, cost: [], creates: [], ruleModifiers: [],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}
function archive(effects: any[]): any {
  return { schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: 'master.fixture.scalar-flags', name: 'fixture', class: 'Master', cards: [{
    id: DEF, name: 'Scalar Flag', cardType: 'master_skill', owner: { type: 'master', id: 'master.fixture' },
    cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [ability(effects)],
  }] };
}
function setup(effects: any[]): GameState {
  const pack = rules.loadAuthoringJson(archive(effects));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{ instanceId: SOURCE, definitionId: DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  rules.initializeAbilityRuntime(state, pack, { seed: 20260926 });
  state.abilityRuntime!.cardState[SOURCE] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}
function flag(key: string, value: unknown): any { return { type: 'set_player_flag', target: 'controller', key, value }; }

describe('P3 current-main scalar controller set_player_flag replay', () => {
  it('accepts only the direct exact controller scalar shape for all historical immediate value kinds', () => {
    for (const value of [1, 2, 'india', true, 16]) {
      const pack = rules.loadAuthoringJson(archive([flag('fixtureFlag', value)]));
      expect(pack.report).toEqual([]);
      expect(pack.cards[DEF]!.abilities[0]!.execution.mode).toBe('automatic');
    }
  });

  it('accepts the R2 exact current_round value and exact this_round lifecycle without widening other shapes', () => {
    const effects = [
      { type: 'set_player_flag', target: 'controller', key: 'round', value: { type: 'current_round' } },
      { type: 'set_player_flag', target: 'controller', key: 'temporary', value: 1, lifecycle: { duration: 'this_round' } },
    ];
    const pack = rules.loadAuthoringJson(archive(effects));
    expect(pack.report).toEqual([]);
    expect(pack.cards[DEF]!.abilities[0]!.execution.mode).toBe('automatic');

    const state = setup(effects);
    const round = state.round.roundNumber;
    rules.processAbilityEvent(state, { id: 'r2-compatible-player-flags', type: 'game_start' });
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1).toEqual({ round, temporary: 1 });
    expect(state.abilityRuntime!.structuredRoundFlagKeysByPlayer!.p1!.temporary).toBe(round);
  });

  it('executes trusted game_start scalar flags without identity routing', () => {
    const effects = [flag('one', 1), flag('two', 2), flag('place', 'india'), flag('ready', true), flag('cap', 16)];
    const state = setup(effects);
    rules.processAbilityEvent(state, { id: 'scalar-flags-game-start', type: 'game_start' });
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer).toEqual({ p1: { one: 1, two: 2, place: 'india', ready: true, cap: 16 } });
    expect(state.abilityRuntime!.processedEvents).toContain('scalar-flags-game-start');
  });

  it('fails loader-closed for widened target, missing/object value, lifecycle, extra field, and nested placement', () => {
    const cases: any[] = [
      { type: 'set_player_flag', target: 'p2', key: 'x', value: 1 },
      { type: 'set_player_flag', target: 'controller', key: 'x' },
      { type: 'set_player_flag', target: 'controller', key: 'x', value: { type: 'current_round', extra: true } },
      { type: 'set_player_flag', target: 'controller', key: 'x', value: { type: 'current_round', offset: 1.5 } },
      { type: 'set_player_flag', target: 'controller', key: 'x', value: 1, lifecycle: { duration: 'per_game' } },
      { type: 'set_player_flag', target: 'controller', key: 'x', value: 1, extra: true },
    ];
    for (const effect of cases) {
      const pack = rules.loadAuthoringJson(archive([effect]));
      expect(pack.cards[DEF]!.abilities[0]!.execution.mode).toBe('unsupported');
      expect(pack.report.some((entry) => entry.cardId === DEF)).toBe(true);
    }
    const nested = rules.loadAuthoringJson(archive([{ type: 'branch', if: { type: 'integer', value: 1 }, then: [flag('x', 1)], else: [] }]));
    expect(nested.cards[DEF]!.abilities[0]!.execution.mode).toBe('unsupported');
  });

  it('runtime rejects a still-unauthorized malformed current_round shape below the loader boundary without mutating flags', () => {
    const state = setup([flag('ok', 1)]);
    const before = structuredClone(state.abilityRuntime!.structuredPlayerFlagsByPlayer ?? {});
    expect(() => rules.resolveEffect(state, { sourceCardId: SOURCE, abilityId: 'game-start-player-flags', controllerId: 'p1', variables: {}, selections: {} },
      { type: 'set_player_flag', target: 'controller', key: 'bad', value: { type: 'current_round', extra: true } } as never)).toThrow(/Structured player flag value is unsupported/);
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer ?? {}).toEqual(before);
  });

  it('round-trips bounded scalar flag state through MatchSession persistence', () => {
    const state = setup([flag('ready', true), flag('place', 'india'), flag('cap', 16)]);
    rules.processAbilityEvent(state, { id: 'persist-flags', type: 'game_start' });
    const session = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1'], restorePackKind: 'trusted_authoring_fixture' }, false);
    session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
    const restored = restoreMatchSession(session.serializeSession(), { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.structuredPlayerFlagsByPlayer).toEqual({ p1: { ready: true, place: 'india', cap: 16 } });
  });

  it('rejects host-signed restore state with unknown-player or non-scalar flag content', () => {
    const makeSigned = (state: GameState) => {
      const session = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1'], restorePackKind: 'trusted_authoring_fixture' }, false);
      session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
      return session.serializeSession();
    };
    const unknown = setup([flag('ready', true)]); rules.processAbilityEvent(unknown, { id: 'unknown-player-flags', type: 'game_start' });
    unknown.abilityRuntime!.structuredPlayerFlagsByPlayer!.ghost = { ready: true };
    expect(() => restoreMatchSession(makeSigned(unknown), { restorePackKind: 'trusted_authoring_fixture' })).toThrow(/Invalid MatchSession state container/);

    const objectValue = setup([flag('ready', true)]); rules.processAbilityEvent(objectValue, { id: 'object-flags', type: 'game_start' });
    (objectValue.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1 as any).bad = { nested: true };
    expect(() => restoreMatchSession(makeSigned(objectValue), { restorePackKind: 'trusted_authoring_fixture' })).toThrow(/Invalid MatchSession state container/);
  });
});