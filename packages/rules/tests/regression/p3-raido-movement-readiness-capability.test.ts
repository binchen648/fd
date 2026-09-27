import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import { dispatchAbilityCommand, getLegalActions, initializeAbilityRuntime } from '../../src/ability/interpreter';
import {
  isAcceptedLegacyAnyLocationExceptWorkshopMovementAbility,
  isAcceptedRuneAnyEnabledLocationMovementAbility,
  isRuneAnyEnabledLocationMovementCandidate,
} from '../../src/ability/source-location-rune-capability';
import type { AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-rune-movement';
const SOURCE = `${ROOT}.skill.source`;

function archive() {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: ROOT,
    cards: [{
      id: SOURCE, name: SOURCE, cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
      cardFace: { attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [{
        id: 'fixture.rune-move', kind: 'phase_action', printedClause: 'fixture',
        activation: { phase: 'action', opens: 'controller_action_window' },
        conditions: [{ type: 'controller_current_round_basic_attack_attribute_pair', firstAttribute: '迅捷', secondAttribute: '迅捷', distinctCards: true }],
        targets: [{ id: 'destination', type: 'location', count: { min: 1, max: 1 }, constraints: [{ type: 'any_enabled_location' }] }],
        effects: [{ type: 'move_player', player: 'controller', to: 'destination' }],
        cost: [{ type: 'pay_mana', amount: 3 }], ruleModifiers: [], creates: [], lifecycle: {},
        responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
        execution: { mode: 'automatic', allowedOperations: [] },
      }], verification: { implementationStatus: 'complete' },
    }],
  } as any;
}

function setup() {
  const pack = loadAuthoringJson(archive());
  const state = createSeededGameState();
  state.cards = [];
  state.players[0]!.servantCardId = ROOT;
  state.players[0]!.mana = 3;
  state.players[0]!.locationId = 'shinto';
  initializeAbilityRuntime(state, pack, { seed: 20260927 });
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  const source = add(state, SOURCE, 'skill', false);
  addBasic(state, 'fixture.quick-a');
  addBasic(state, 'fixture.quick-b');
  return { state, pack, source };
}

function add(state: GameState, definitionId: string, zone: string, active: boolean) {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
    visibility: zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' } });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return state.cards[state.cards.length - 1]!;
}

function addBasic(state: GameState, id: string) {
  const def: AuthoringCard = {
    id, name: id, cardType: 'basic_attack', cardFace: { attributes: ['迅捷'], cost: 0, basePower: 2 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
  };
  state.abilityRuntime!.pack.cards[id] = def;
  return add(state, id, 'attack_area', true);
}

function action(state: GameState, sourceId: string) {
  return getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === sourceId && entry.abilityId === 'fixture.rune-move');
}

describe('P3 bounded rune any-location movement readiness capability', () => {
  it('accepts only the exact Quick/Quick pay-3 whole-ability shell', () => {
    expect(loadAuthoringJson(archive()).report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const mutations: Array<[string, (raw: any) => void]> = [
      ['wrong-cost', (raw) => { raw.cards[0].abilities[0].cost[0].amount = 2; }],
      ['extra-condition', (raw) => { raw.cards[0].abilities[0].conditions.push({ type: 'source_active' }); }],
      ['missing-any-enabled-target-constraint', (raw) => { raw.cards[0].abilities[0].targets[0].constraints = []; }],
      ['replaced-any-enabled-target-constraint', (raw) => { raw.cards[0].abilities[0].targets[0].constraints = [{ type: 'not_location_kind', locationKind: 'workshop' }]; }],
      ['extra-target-constraint', (raw) => { raw.cards[0].abilities[0].targets[0].constraints.push({ type: 'not_location_kind', locationKind: 'workshop' }); }],
      ['widened-effect', (raw) => { raw.cards[0].abilities[0].effects[0].extra = true; }],
      ['wrong-rune-pair', (raw) => { raw.cards[0].abilities[0].conditions[0].firstAttribute = '魔术'; }],
    ];
    for (const [name, mutate] of mutations) {
      const raw = archive(); mutate(raw);
      const loaded = loadAuthoringJson(raw);
      const compiled = loaded.cards[SOURCE]!.abilities[0]!;
      const diagnostic = `candidate=${isRuneAnyEnabledLocationMovementCandidate(compiled)} legacy=${isAcceptedLegacyAnyLocationExceptWorkshopMovementAbility(compiled)} accepted=${isAcceptedRuneAnyEnabledLocationMovementAbility(compiled)} report=${JSON.stringify(loaded.report)} compiled=${JSON.stringify(compiled)}`;
      expect(loaded.report.some((entry) => entry.abilityId === 'fixture.rune-move' && entry.status === 'unsupported'), `${name}: ${diagnostic}`).toBe(true);
    }
  });

  it('advertises at exactly 3 mana, excludes the current location, pays 3, and moves to the chosen enabled destination', () => {
    const { state, source } = setup();
    const legal = action(state, source.instanceId);
    expect(legal).toBeTruthy();
    expect(dispatchAbilityCommand(state, 'p1', legal!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(0);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates.length).toBeGreaterThan(0);
    expect(decision.candidates).not.toContain('shinto');
    const destination = decision.candidates[0]!;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [destination] }).ok).toBe(true);
    expect(state.players[0]!.locationId).toBe(destination);
  });

  it('does not advertise or execute the fixed-3-mana movement at 2 mana', () => {
    const { state, source } = setup();
    state.players[0]!.mana = 2;
    expect(action(state, source.instanceId)).toBeFalsy();
    const beforeMana = state.players[0]!.mana;
    const beforeLocation = state.players[0]!.locationId;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source.instanceId, abilityId: 'fixture.rune-move' }).ok).toBe(false);
    expect(state.players[0]!.mana).toBe(beforeMana);
    expect(state.players[0]!.locationId).toBe(beforeLocation);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });

  it('fails closed after compiled-pack corruption', () => {
    const { state, source } = setup();
    const ability = state.abilityRuntime!.pack.cards[SOURCE]!.abilities[0]!;
    ability.cost[0]!.amount = 2;
    expect(action(state, source.instanceId)).toBeFalsy();
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source.instanceId, abilityId: 'fixture.rune-move' }).ok).toBe(false);

    const widened = setup();
    const widenedAbility = widened.state.abilityRuntime!.pack.cards[SOURCE]!.abilities[0]!;
    widenedAbility.targets[0]!.constraints = [];
    const beforeMana = widened.state.players[0]!.mana;
    const beforeLocation = widened.state.players[0]!.locationId;
    expect(dispatchAbilityCommand(widened.state, 'p1', {
      type: 'activate_ability', cardInstanceId: widened.source.instanceId, abilityId: 'fixture.rune-move',
    }).ok).toBe(false);
    expect(widened.state.players[0]!.mana).toBe(beforeMana);
    expect(widened.state.players[0]!.locationId).toBe(beforeLocation);
    expect(widened.state.abilityRuntime!.pendingDecision).toBeUndefined();
  });
});
