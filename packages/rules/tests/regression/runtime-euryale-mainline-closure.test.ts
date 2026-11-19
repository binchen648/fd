import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createMatchSession } from '../../src/match-session';
import { advanceAbilityPhase, executeAbility, initializeAbilityRuntime, initializeActionTurns } from '../../src/ability/interpreter';
import { resolveBattlefield } from '../../src/core/combat-resolver';
import { applyDefeatStatus } from '../../src/phases/battle-phase';
import { restoreTrustedAuthoringFixtureSession } from '../trusted-authoring-fixture';
import { loadAuthoringJson } from '../../src/ability/loader';

const archive = JSON.parse(readFileSync('packages/rules/tests/fixtures/b-euryale-771ae323.json', 'utf8'));
const testDefeatProducer = {
  id: 'fixture.euryale-defeat-producer',
  name: 'test-only prebattle defeat producer',
  cardType: 'servant_skill',
  cardFace: { cost: 0, basePower: 0, attributes: [] },
  playTiming: { phase: 'action', window: 'controller_play_card_window' },
  playRequirements: [],
  abilities: [{
    id: 'assign-prebattle-defeat', kind: 'phase_action',
    printedClause: '赋予没有打出迅捷攻击的交战对手【败北】。',
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [{ type: 'source_active' }],
    targets: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    effects: [{ type: 'defeat_player', target: { scope: 'engaged_opponents', where: [{ type: 'no_attack_played_this_round_with_attribute', attribute: '迅捷' }] } }],
    execution: { mode: 'automatic' },
  }],
};

function setupEuryaleRuntime(withTestProducer = false) {
  const session = createMatchSession({ seed: 20260907, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
  const state = session.state;
  const canonical = state.abilityRuntime!.pack;
  const divineCore = archive.cards.find((card: { id: string }) => card.id === 'card.x-divine-core');
  const loaded = loadAuthoringJson({ ...archive, cards: withTestProducer ? [divineCore, testDefeatProducer] : [divineCore] });
  expect(loaded.report).toEqual([]);
  state.cards = [];
  state.modeState = {};
  delete state.abilityRuntime;
  initializeAbilityRuntime(state, {
    ...canonical,
    cards: {
      ...canonical.cards,
      ...loaded.cards,
      'card.x-divine-core': { ...loaded.cards['card.x-divine-core']!, playKind: 'attack', destinationZone: 'attack_area' },
      ...(withTestProducer ? { [testDefeatProducer.id]: { ...loaded.cards[testDefeatProducer.id]!, playKind: 'support', destinationZone: 'field' } } : {}),
    },
  });
  initializeActionTurns(state);
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.eventPlacements = [];
  state.currentSituationModifiers = [];
  for (const player of state.players) {
    player.locationId = ['p1', 'p2'].includes(player.id) ? 'shinto' : undefined;
    player.mana = 10;
    player.vp = 0;
  }
  state.cards.push({
    instanceId: 'euryale-core', definitionId: 'card.x-divine-core', ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone: 'attack_area', visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState['euryale-core'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  if (withTestProducer) {
    state.cards.push({
      instanceId: 'defeat-producer', definitionId: testDefeatProducer.id, ownerPlayerId: 'p2', controllerPlayerId: 'p2',
      zone: 'field', visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState['defeat-producer'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  }
  return session;
}

describe('pinned Euryale candidate Runtime closure on Main Base 2fdfaee5', () => {
  it('fixture preflight: identities, owners, zones, playedRound, phase, resources, locations and event state are complete', () => {
    const session = setupEuryaleRuntime(true), state = session.state, playerIds = new Set(state.players.map(player => player.id));
    expect(state.round.activePhase).toBe('action');
    expect(state.round.prioritySeat).toBe(1);
    expect(state.eventPlacements).toEqual([]);
    expect(state.currentSituationModifiers).toEqual([]);
    for (const instance of state.cards) {
      expect(playerIds.has(instance.ownerPlayerId)).toBe(true);
      expect(playerIds.has(instance.controllerPlayerId)).toBe(true);
      expect(['hand', 'skill', 'field', 'attack_area', 'deck', 'discard', 'removed_from_game']).toContain(instance.zone);
      expect(Number.isSafeInteger(state.abilityRuntime!.cardState[instance.instanceId]?.playedRound)).toBe(true);
    }
    expect(state.players.filter(player => ['p1', 'p2'].includes(player.id)).every(player => player.locationId === 'shinto' && player.mana === 10)).toBe(true);
    expect(state.cards.some(instance => instance.instanceId === 'euryale-core' && instance.definitionId === 'card.x-divine-core')).toBe(true);
    expect(state.cards.some(instance => instance.instanceId === 'defeat-producer' && instance.controllerPlayerId === 'p2')).toBe(true);
  });

  it('loads the exact reviewed B archive without unsupported Runtime field diagnostics', () => {
    const loaded = loadAuthoringJson(archive);
    expect(loaded.report).toEqual([]);
    expect(Object.keys(loaded.cards)).toEqual(expect.arrayContaining([
      'servant.euryale.skill.sc-euryale-1',
      'servant.euryale.skill.sc-euryale-2',
      'servant.euryale.skill.sc-euryale-3',
      'card.x-divine-core',
    ]));
  });

  it('applies Divine Core victory reward only after activation, across restore, and expires it at round end', () => {
    const session = setupEuryaleRuntime();
    const input = { battlefieldId: 'shinto' as const, participants: [{ playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 1 }] };
    const bonus = (state: typeof session.state) => resolveBattlefield(state, input).nextState.battleResults.at(-1)?.vpAdjustments
      ?.filter((entry) => entry.playerId === 'p1' && entry.label === 'basic.preparation.win_bonus') ?? [];
    expect(bonus(session.state)).toEqual([]);
    advanceAbilityPhase(session.state, 'battle');
    expect(session.dispatchPlayerAction('p1', { type: 'activate_ability', cardInstanceId: 'euryale-core', abilityId: 'divine-core.victory' }).ok).toBe(true);
    expect(bonus(session.state)).toEqual([expect.objectContaining({ delta: 2 })]);

    const restored = restoreTrustedAuthoringFixtureSession(session.serializeSession());
    expect(bonus(restored.state)).toEqual([expect.objectContaining({ delta: 2 })]);
    advanceAbilityPhase(restored.state, 'round_start', 2);
    expect(bonus(restored.state)).toEqual([]);
  });

  it('does not ignore a real prebattle defeat before Luck activation, then ignores it after activation and restore', () => {
    const session = setupEuryaleRuntime(true);
    executeAbility(session.state, {
      controllerId: 'p2', sourceCardId: 'defeat-producer', abilityId: 'assign-prebattle-defeat', variables: {}, selections: {},
    });
    expect(session.state.abilityRuntime!.pendingPreBattleDefeats?.[0]?.targetPlayerIds).toEqual(['p1']);
    const input = { battlefieldId: 'shinto' as const, participants: [{ playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 1 }] };
    const beforeActivation = resolveBattlefield(session.state, input).nextState.battleResults.at(-1)!;
    expect(beforeActivation.winnerPlayerIds).toEqual(['p2']);
    expect(beforeActivation.excludedPlayerIds).toContain('p1');
    expect(applyDefeatStatus(session.state, 'p1').players.find((player) => player.id === 'p1')!.statusEffects).toContain('defeated');

    advanceAbilityPhase(session.state, 'battle');
    session.state.round.prioritySeat = 1;
    expect(session.dispatchPlayerAction('p1', { type: 'activate_ability', cardInstanceId: 'euryale-core', abilityId: 'divine-core.luck' }).ok).toBe(true);
    const restored = restoreTrustedAuthoringFixtureSession(session.serializeSession());
    const afterActivation = resolveBattlefield(restored.state, input).nextState.battleResults.at(-1)!;
    expect(afterActivation.winnerPlayerIds).toEqual(['p1']);
    expect(afterActivation.excludedPlayerIds ?? []).not.toContain('p1');
    expect(applyDefeatStatus(restored.state, 'p1').players.find((player) => player.id === 'p1')!.statusEffects ?? []).not.toContain('defeated');
    advanceAbilityPhase(restored.state, 'round_start', 2);
    expect(applyDefeatStatus(restored.state, 'p1').players.find((player) => player.id === 'p1')!.statusEffects).toContain('defeated');
  });
});
