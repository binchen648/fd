import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityDefinitionPack, AbilityEvent, AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../src/ability/types';

const effect: RuleNode = { type: 'return_card_by_definition', target: 'controller', definitionId: 'skill.target', destination: 'master-skills', createIfMissing: true, face: 'up', active: false };

function ability(): AuthoringAbility {
  return {
    id: 'threshold', kind: 'forced_trigger', printedClause: 'synthetic structural proof',
    activation: { trigger: 'player.victory-points.changed' },
    conditions: [{ type: 'event_player_is_opponent' }, { type: 'event_round_victory_points_gain_crosses', threshold: 7 }],
    targets: [], effects: [{ ...effect }], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function definition(id: string, ownerId: string, abilities: AuthoringAbility[] = []): ExecutableCardDefinition {
  return { id, name: id, cardType: 'master_skill', ownerId, cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] },
    playTiming: {}, playRequirements: [], abilities, mode: 'automatic', playKind: 'support', destinationZone: 'field' };
}

function setup() {
  const state = createSeededGameState();
  state.players[0]!.masterCardId = 'master.synthetic';
  state.cards = [{ instanceId: 'source', definitionId: 'skill.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  const source = definition('skill.source', 'master.synthetic', [ability()]);
  const target = definition('skill.target', 'master.synthetic');
  const pack: AbilityDefinitionPack = { cards: { [source.id]: source, [target.id]: target } };
  rules.initializeAbilityRuntime(state, pack, { seed: 20260922 });
  return state;
}

function archive(a: AuthoringAbility = ability()) {
  const raw = structuredClone(a) as AuthoringAbility;
  if (raw.execution && typeof raw.execution === 'object') delete (raw.execution as unknown as { allowedOperations?: unknown }).allowedOperations;
  return { schemaVersion: 'fd-card-authoring-v1', id: 'master.synthetic', name: 'synthetic', cards: [{
    id: 'skill.source', name: 'source', cardType: 'master_skill', cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [], requirement: { type: 'none' } },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [raw],
  }] };
}

function acceptedEvent(state: ReturnType<typeof setup>, id: string): AbilityEvent {
  const trusted = state.abilityRuntime!.trustedVictoryPointChanges![id]!;
  return { id, type: 'player.victory-points.changed', ...trusted };
}

describe('P3-FB2-51 opponent current-round positive VP gain crossing 7', () => {
  it('admits only the exact raw and compiled whole envelope', () => {
    expect(rules.isAcceptedOpponentRoundVpGainThresholdAbility(ability(), 'compiled')).toBe(true);
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);
    const loaded = rules.loadAuthoringJson(archive()).cards['skill.source']!.abilities[0]!;
    expect(rules.isAcceptedOpponentRoundVpGainThresholdAbility(loaded, 'compiled')).toBe(true);

    const mutations: Array<(value: AuthoringAbility) => void> = [
      (value) => { value.activation.trigger = 'after_controller_gains_victory'; },
      (value) => { value.conditions.reverse(); },
      (value) => { value.conditions[1]!.threshold = 6; },
      (value) => { value.conditions[1]!.resource = 'victory_points'; },
      (value) => { value.effects.push({ type: 'adjust_mana', amount: 1 }); },
      (value) => { value.effects[0]!.destination = 'hand'; },
    ];
    for (const mutate of mutations) {
      const near = ability(); mutate(near);
      expect(rules.isAcceptedOpponentRoundVpGainThresholdAbility(near, 'compiled')).toBe(false);
      expect(rules.loadAuthoringJson(archive(near)).report.length).toBeGreaterThan(0);
    }
  });

  it('fails closed with loader issues for malformed exact-trigger envelopes', () => {
    const malformed: AuthoringAbility[] = ['conditions', 'effects', 'execution'].map((field) => {
      const value = ability() as unknown as Record<string, unknown>;
      delete value[field];
      return value as unknown as AuthoringAbility;
    });
    malformed.push(Object.assign(ability(), { conditions: {} }) as unknown as AuthoringAbility);
    for (const value of malformed) {
      expect(() => rules.isAcceptedOpponentRoundVpGainThresholdAbility(value, 'authoring')).not.toThrow();
      expect(rules.isAcceptedOpponentRoundVpGainThresholdAbility(value, 'authoring')).toBe(false);
      expect(() => rules.loadAuthoringJson(archive(value))).not.toThrow();
      expect(rules.loadAuthoringJson(archive(value)).report).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'opponentRoundVpGainThreshold.gateway' }),
      ]));
    }
  });

  it('observes a real generic phase-action adjust_victory_points gain', () => {
    const state = setup();
    state.round.activePhase = 'action';
    state.round.prioritySeat = 2;
    const gain: AuthoringAbility = {
      id: 'generic-gain', kind: 'phase_action', printedClause: 'gain 7 VP',
      activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
      conditions: [{ type: 'source_active' }], targets: [], effects: [{ type: 'adjust_victory_points', player: 'controller', amount: 7 }],
      cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    };
    state.abilityRuntime!.pack.cards['skill.gain'] = definition('skill.gain', 'master-2', [gain]);
    state.cards.push({ instanceId: 'gain-source', definitionId: 'skill.gain', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'field', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['gain-source'] = { active: true, faceDown: false };
    const result = rules.dispatchAbilityCommand(state, 'p2', { type: 'activate_ability', cardInstanceId: 'gain-source', abilityId: 'generic-gain' });
    expect(result.ok).toBe(true);
    expect(state.players.find((player) => player.id === 'p2')!.vp).toBe(7);
    expect(state.abilityRuntime!.roundPositiveVictoryPointGain).toEqual({ round: state.round.roundNumber, byPlayer: { p2: 7 } });
  });

  it('observes a real game-loop location reward gain', () => {
    const state = setup();
    state.players[1]!.locationId = 'magic_workshop';
    state.map.locations = state.map.locations.map((location) => location.id === 'magic_workshop'
      ? { ...location, rewardHooks: ['location_rewards'], vpRewardRules: { location: 7 } }
      : location);
    const next = rules.stepGameLoop(state).nextState;
    expect(next.players.find((player) => player.id === 'p2')!.vp).toBe(7);
    expect(next.cards.some((card) => card.definitionId === 'skill.target')).toBe(true);
  });

  it('crosses on direct +7 exactly once and creates the exact FB2-30 target', () => {
    const state = setup();
    rules.adjustVictoryPointsAuthoritatively(state, 'p2', 7);
    expect(state.cards.filter((card) => card.definitionId === 'skill.target')).toHaveLength(1);
    expect(state.cards.find((card) => card.definitionId === 'skill.target')).toMatchObject({ ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill' });
    rules.adjustVictoryPointsAuthoritatively(state, 'p2', 2);
    expect(state.cards.filter((card) => card.definitionId === 'skill.target')).toHaveLength(1);
    expect(state.abilityRuntime!.roundPositiveVictoryPointGain).toEqual({ round: state.round.roundNumber, byPlayer: { p2: 9 } });
  });

  it('crosses split 3+4 only on the second event, while +6 does not cross', () => {
    const split = setup();
    rules.adjustVictoryPointsAuthoritatively(split, 'p2', 3);
    expect(split.cards.some((card) => card.definitionId === 'skill.target')).toBe(false);
    rules.adjustVictoryPointsAuthoritatively(split, 'p2', 4);
    expect(split.cards.some((card) => card.definitionId === 'skill.target')).toBe(true);
    const six = setup(); rules.adjustVictoryPointsAuthoritatively(six, 'p2', 6);
    expect(six.cards.some((card) => card.definitionId === 'skill.target')).toBe(false);
  });

  it('does not qualify controller gain, zero, loss, or a non-VP event', () => {
    for (const delta of [0, -3]) {
      const state = setup(); state.players[1]!.vp = 5;
      rules.adjustVictoryPointsAuthoritatively(state, 'p2', delta);
      expect(state.cards.some((card) => card.definitionId === 'skill.target')).toBe(false);
      expect(state.abilityRuntime!.roundPositiveVictoryPointGain!.byPlayer.p2 ?? 0).toBe(0);
    }
    const own = setup(); rules.adjustVictoryPointsAuthoritatively(own, 'p1', 7);
    expect(own.cards.some((card) => card.definitionId === 'skill.target')).toBe(false);
    const nonVp = setup(); const before = structuredClone(nonVp);
    rules.processAbilityEvent(nonVp, { id: 'mana', type: 'mana.changed', playerId: 'p2' });
    expect(nonVp.cards).toEqual(before.cards);
    expect(nonVp.abilityRuntime!.roundPositiveVictoryPointGain).toEqual(before.abilityRuntime!.roundPositiveVictoryPointGain);
  });

  it('resets on round advance and permits a fresh crossing', () => {
    const state = setup(); rules.adjustVictoryPointsAuthoritatively(state, 'p2', 7);
    const first = state.cards.find((card) => card.definitionId === 'skill.target')!;
    first.zone = 'removed_from_game';
    rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
    expect(state.abilityRuntime!.roundPositiveVictoryPointGain).toEqual({ round: state.round.roundNumber, byPlayer: {} });
    rules.adjustVictoryPointsAuthoritatively(state, 'p2', 7);
    expect(state.cards.find((card) => card.instanceId === first.instanceId)?.zone).toBe('skill');
  });

  it('is idempotent for duplicate event ids', () => {
    const state = setup(); const id = rules.adjustVictoryPointsAuthoritatively(state, 'p2', 3);
    const duplicate = acceptedEvent(state, id); const before = structuredClone(state);
    rules.processAbilityEvent(state, duplicate);
    expect(state).toEqual(before);
  });

  it('rejects unknown player and malformed adjustments before mutation', () => {
    const state = setup(); const before = structuredClone(state);
    expect(() => rules.adjustVictoryPointsAuthoritatively(state, 'unknown', 7)).toThrow(/unknown player/i);
    expect(() => rules.adjustVictoryPointsAuthoritatively(state, 'p2', Number.NaN)).toThrow(/safe integer/i);
    expect(state).toEqual(before);
  });

  it('fails closed on forged, stale, malformed, or inconsistent provenance', () => {
    const variants: Array<(state: ReturnType<typeof setup>, event: AbilityEvent) => void> = [
      (_state, event) => { event.id = 'forged'; },
      (_state, event) => { event.roundNumber! += 1; },
      (_state, event) => { event.after! += 1; },
      (_state, event) => { event.delta! += 1; },
      (_state, event) => { delete event.before; },
      (_state, event) => { event.resource = 'not-vp' as 'victory_points'; },
      (state, event) => { event.playerId = 'unknown'; state.abilityRuntime!.trustedVictoryPointChanges![event.id]!.playerId = 'unknown'; },
    ];
    for (const mutate of variants) {
      const state = setup();
      const event: AbilityEvent = { id: 'trusted-probe', type: 'player.victory-points.changed', playerId: 'p2', resource: 'victory_points', delta: 7, before: 0, after: 7, roundNumber: state.round.roundNumber };
      state.players[1]!.vp = 7;
      state.abilityRuntime!.trustedVictoryPointChanges![event.id] = { playerId: 'p2', resource: 'victory_points', delta: 7, before: 0, after: 7, roundNumber: state.round.roundNumber };
      mutate(state, event); const before = structuredClone(state);
      expect(() => rules.processAbilityEvent(state, event)).toThrow(/authoritative provenance/i);
      expect(state).toEqual(before);
    }
  });

  it('returns the same physical FB2-30 target and preserves duplicate/wrong-definition failures transactionally', () => {
    const returned = setup();
    returned.cards.push({ instanceId: 'target', definitionId: 'skill.target', ownerPlayerId: 'p1', controllerPlayerId: 'p2', zone: 'discard', visibility: { scope: 'public' } });
    rules.adjustVictoryPointsAuthoritatively(returned, 'p2', 7);
    expect(returned.cards.find((card) => card.instanceId === 'target')).toMatchObject({ controllerPlayerId: 'p1', zone: 'skill' });

    const duplicate = setup();
    duplicate.cards.push(
      { instanceId: 'a', definitionId: 'skill.target', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'discard', visibility: { scope: 'public' } },
      { instanceId: 'b', definitionId: 'skill.target', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'discard', visibility: { scope: 'public' } },
    );
    const duplicateBefore = structuredClone(duplicate);
    expect(() => rules.adjustVictoryPointsAuthoritatively(duplicate, 'p2', 7)).toThrow(/duplicate controller-owned physical instances/i);
    expect(duplicate).toEqual(duplicateBefore);

    const wrong = setup(); (wrong.abilityRuntime!.pack.cards['skill.target'] as ExecutableCardDefinition).ownerId = 'master.other';
    const wrongBefore = structuredClone(wrong);
    expect(() => rules.adjustVictoryPointsAuthoritatively(wrong, 'p2', 7)).toThrow(/controller-owned master_skill definition/i);
    expect(wrong).toEqual(wrongBefore);
  });
});
