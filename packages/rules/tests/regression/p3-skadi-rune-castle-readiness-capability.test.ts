import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import {
  calculateCardPower,
  dispatchAbilityCommand,
  getLegalActions,
  initializeAbilityRuntime,
  resolveEffect,
} from '../../src/ability/interpreter';
import {
  controllerHasCurrentRoundBasicAttackAttributePair,
} from '../../src/ability/source-location-rune-capability';
import { isManaGainSuppressed } from '../../src/ability/timed-resource-suppression';
import { grantMana } from '../../src/core/rule-overrides';
import { createMatchSession, restoreMatchSession } from '../../src/match-session';
import type { AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-source-location-rune';
const SHUFFLE = `${ROOT}.skill.shuffle`;
const RUNE = `${ROOT}.skill.rune`;
const DEFEAT = `${ROOT}.skill.defeat`;
const AURA = `${ROOT}.skill.aura`;
const POWER = `${ROOT}.skill.power`;
const ISAN_FLAG = 'fixture.isan.round';
const TEIWAZ_FLAG = 'fixture.teiwaz.round';

function baseAbility(id: string, phase: 'action' | 'advance' | 'combat' = 'action') {
  return {
    id,
    kind: 'phase_action',
    printedClause: id,
    activation: { phase, opens: phase === 'combat' ? 'controller_combat_action_window' : 'controller_action_window' },
    conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}

function archive() {
  const shuffle = baseAbility('fixture.post-draw-shuffle', 'advance');
  shuffle.cost = [{ type: 'pay_mana', amount: 1 }];
  shuffle.effects = [{ type: 'draw_then_shuffle_two_hand_cards_into_deck' }];

  const isan = baseAbility('fixture.isan', 'action');
  isan.conditions = [
    { type: 'controller_current_round_basic_attack_attribute_pair', firstAttribute: '魔术', secondAttribute: '魔术', distinctCards: true },
    { type: 'player_flag_number_not_current_round', key: ISAN_FLAG },
  ];
  isan.cost = [{ type: 'pay_mana', amount: 3 }];
  isan.effects = [
    { type: 'adjust_other_active_players_at_source_location_mana' },
    { type: 'set_player_flag', target: 'controller', key: ISAN_FLAG, value: { type: 'current_round' }, lifecycle: { duration: 'this_round' } },
  ];

  const arm = baseAbility('fixture.arm-teiwaz', 'action');
  arm.effects = [
    { type: 'set_player_flag', target: 'controller', key: TEIWAZ_FLAG, value: { type: 'current_round' }, lifecycle: { duration: 'this_round' } },
  ];

  const defeat = baseAbility('fixture.teiwaz-defeat', 'combat');
  defeat.conditions = [
    { type: 'player_flag_number_current_round', key: TEIWAZ_FLAG },
    { type: 'controller_at_battlefield_with_exactly_one_opponent' },
  ];
  defeat.effects = [
    { type: 'defeat_single_active_opponent_at_controller_battlefield' },
    { type: 'clear_player_flag', target: 'controller', key: TEIWAZ_FLAG },
  ];

  const aura = baseAbility('fixture.castle-aura');
  aura.kind = 'residual';
  aura.activation = { trigger: 'while_active', requiresSourceState: 'active' };
  aura.effects = [{ type: 'forbid_other_players_at_active_source_location_mana_gain' }];

  const power = baseAbility('fixture.castle-power', 'advance');
  power.activation = { phase: 'advance', opens: 'controller_action_window', requiresSourceState: 'active' };
  power.targets = [{
    id: 'attribute', type: 'choice', count: { min: 1, max: 1 },
    options: ['力量', '迅捷', '魔术', '特殊'].map((id) => ({ id, label: id })),
  }];
  power.effects = [{ type: 'set_source_location_basic_base_power_multiplier_from_choice', target: 'attribute' }];

  const card = (id: string, abilities: any[]) => ({
    id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
    cardFace: { attributes: ['特殊'], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities,
    verification: { implementationStatus: 'complete' },
  });
  return {
    schemaVersion: 'fd-card-authoring-v1', id: ROOT,
    cards: [card(SHUFFLE, [shuffle]), card(RUNE, [isan, arm]), card(DEFEAT, [defeat]), card(AURA, [aura]), card(POWER, [power])],
  } as any;
}

function setup() {
  const pack = loadAuthoringJson(archive());
  const state = createSeededGameState();
  state.cards = [];
  state.players[0]!.servantCardId = ROOT;
  state.players[0]!.mana = 10;
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'recon';
  initializeAbilityRuntime(state, pack, { seed: 20260927 });
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  return { state, pack };
}

function add(state: GameState, definitionId: string, zone = 'skill', active = false, owner = 'p1') {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['attack_area', 'field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner },
  });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return state.cards[state.cards.length - 1]!;
}

function addBasic(state: GameState, id: string, attributes: string[], zone = 'attack_area', owner = 'p1', playedRound = state.round.roundNumber) {
  const def: AuthoringCard = {
    id, name: id, cardType: 'basic_attack', cardFace: { attributes, cost: 0, basePower: 2 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
  };
  state.abilityRuntime!.pack.cards[id] = def;
  const card = add(state, id, zone, zone === 'attack_area', owner);
  state.abilityRuntime!.cardState[card.instanceId]!.playedRound = playedRound;
  return card;
}

function addSecret(state: GameState, id: string, zone: 'hand' | 'deck') {
  const def: AuthoringCard = {
    id, name: id, cardType: 'basic_attack', cardFace: { attributes: ['特殊'], cost: 0, basePower: 1 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
  };
  state.abilityRuntime!.pack.cards[id] = def;
  return add(state, id, zone, false);
}

function abilityAction(state: GameState, sourceId: string, abilityId: string) {
  return getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === sourceId && entry.abilityId === abilityId);
}

function pair(firstAttribute: string, secondAttribute: string) {
  return { type: 'controller_current_round_basic_attack_attribute_pair', firstAttribute, secondAttribute, distinctCards: true };
}

describe('P3 bounded Skadi source-location/rune/castle readiness capability', () => {
  it('accepts only exact whole-ability privileged shells and fails closed on widened or nested near matches', () => {
    expect(loadAuthoringJson(archive()).report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const mutations = [
      (raw: any) => { raw.cards[0].abilities[0].effects[0].extra = true; },
      (raw: any) => { raw.cards[1].abilities[0].conditions[0].extra = true; },
      (raw: any) => { raw.cards[2].abilities[0].activation.opens = 'controller_action_window'; },
      (raw: any) => { raw.cards[3].abilities[0].kind = 'phase_action'; },
      (raw: any) => { raw.cards[4].abilities[0].targets[0].options.pop(); },
      (raw: any) => { raw.cards[1].abilities[0].effects = [{ type: 'branch', branches: [{ if: { type: 'can_adjust_mana', player: 'controller', amount: 1 }, then: [{ type: 'adjust_other_active_players_at_source_location_mana' }] }] }]; },
    ];
    for (const mutate of mutations) {
      const raw = archive(); mutate(raw);
      expect(loadAuthoringJson(raw).report.some((entry) => entry.status === 'unsupported')).toBe(true);
    }
  });

  it('derives rune pairs only from two distinct current-round basic attacks', () => {
    const { state } = setup();
    addBasic(state, 'basic.magic-a', ['魔术']);
    addBasic(state, 'basic.magic-b', ['魔术']);
    expect(controllerHasCurrentRoundBasicAttackAttributePair(state, 'p1', pair('魔术', '魔术'))).toBe(true);
    const prior = addBasic(state, 'basic.quick-prior', ['迅捷'], 'attack_area', 'p1', state.round.roundNumber - 1);
    expect(controllerHasCurrentRoundBasicAttackAttributePair(state, 'p1', pair('迅捷', '魔术'))).toBe(false);
    state.abilityRuntime!.cardState[prior.instanceId]!.playedRound = state.round.roundNumber;
    expect(controllerHasCurrentRoundBasicAttackAttributePair(state, 'p1', pair('迅捷', '魔术'))).toBe(true);
    const dual = setup(); addBasic(dual.state, 'basic.dual', ['迅捷', '魔术']);
    expect(controllerHasCurrentRoundBasicAttackAttributePair(dual.state, 'p1', pair('迅捷', '魔术'))).toBe(false);
  });

  it('pays 1 mana, draws one, then requires exactly two private hand cards to be shuffled into deck', () => {
    const { state } = setup();
    state.round.activePhase = 'advance';
    const source = add(state, SHUFFLE, 'skill', false);
    addSecret(state, 'secret.hand-a', 'hand');
    addSecret(state, 'secret.hand-b', 'hand');
    addSecret(state, 'secret.deck-draw', 'deck');
    const beforeMana = state.players[0]!.mana;
    const legal = abilityAction(state, source.instanceId, 'fixture.post-draw-shuffle');
    expect(legal).toBeTruthy();
    expect(dispatchAbilityCommand(state, 'p1', legal!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(beforeMana - 1);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision).toMatchObject({ controllerId: 'p1', min: 2, max: 2 });
    expect(decision.candidates).toHaveLength(3);
    expect(decision.interaction).toMatchObject({ kind: 'post_draw_hand_shuffle_v1', visibility: 'owner_only', cancelPolicy: 'forbidden' });
    const beforeWrong = structuredClone(state);
    expect(dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: decision.id, selectedIds: decision.candidates.slice(0, 2) }).ok).toBe(false);
    expect(state).toEqual(beforeWrong);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: decision.candidates.slice(0, 2) }).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'hand')).toHaveLength(1);
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'deck')).toHaveLength(2);
  });

  it('does not advertise or execute post-draw shuffle without both fixed mana and a nonempty deck', () => {
    const emptyDeck = setup();
    emptyDeck.state.round.activePhase = 'advance';
    const emptySource = add(emptyDeck.state, SHUFFLE, 'skill', false);
    addSecret(emptyDeck.state, 'secret.empty-hand-a', 'hand');
    addSecret(emptyDeck.state, 'secret.empty-hand-b', 'hand');
    const reshufflable = addSecret(emptyDeck.state, 'secret.empty-discard', 'deck');
    reshufflable.zone = 'discard';
    expect(abilityAction(emptyDeck.state, emptySource.instanceId, 'fixture.post-draw-shuffle')).toBeFalsy();
    const emptyBefore = structuredClone(emptyDeck.state);
    expect(dispatchAbilityCommand(emptyDeck.state, 'p1', {
      type: 'activate_ability', cardInstanceId: emptySource.instanceId, abilityId: 'fixture.post-draw-shuffle',
    }).ok).toBe(false);
    expect(emptyDeck.state).toEqual(emptyBefore);

    const noMana = setup();
    noMana.state.round.activePhase = 'advance';
    noMana.state.players[0]!.mana = 0;
    const noManaSource = add(noMana.state, SHUFFLE, 'skill', false);
    addSecret(noMana.state, 'secret.no-mana-deck', 'deck');
    expect(abilityAction(noMana.state, noManaSource.instanceId, 'fixture.post-draw-shuffle')).toBeFalsy();
    const noManaBefore = structuredClone(noMana.state);
    expect(dispatchAbilityCommand(noMana.state, 'p1', {
      type: 'activate_ability', cardInstanceId: noManaSource.instanceId, abilityId: 'fixture.post-draw-shuffle',
    }).ok).toBe(false);
    expect(noMana.state).toEqual(noManaBefore);
  });

  it('applies same-location mana loss once per round and authenticates its exact rune pair shell', () => {
    const { state } = setup();
    const source = add(state, RUNE, 'skill', false);
    addBasic(state, 'basic.isan-a', ['魔术']);
    addBasic(state, 'basic.isan-b', ['魔术']);
    state.players[1]!.mana = 5;
    state.players[2]!.mana = 5;
    const beforeController = state.players[0]!.mana;
    const legal = abilityAction(state, source.instanceId, 'fixture.isan');
    expect(legal).toBeTruthy();
    expect(dispatchAbilityCommand(state, 'p1', legal!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(beforeController - 3);
    expect(state.players[1]!.mana).toBe(3);
    expect(state.players[2]!.mana).toBe(5);
    expect(abilityAction(state, source.instanceId, 'fixture.isan')).toBeFalsy();
  });

  it('does not advertise or execute the fixed-3-mana same-location rune when mana is insufficient', () => {
    const { state } = setup();
    const source = add(state, RUNE, 'skill', false);
    addBasic(state, 'basic.isan-low-a', ['魔术']);
    addBasic(state, 'basic.isan-low-b', ['魔术']);
    state.players[0]!.mana = 2;
    expect(abilityAction(state, source.instanceId, 'fixture.isan')).toBeFalsy();
    const before = structuredClone(state);
    expect(dispatchAbilityCommand(state, 'p1', {
      type: 'activate_ability', cardInstanceId: source.instanceId, abilityId: 'fixture.isan',
    }).ok).toBe(false);
    expect(state).toEqual(before);
  });

  it('consumes a current-round armed flag to defeat exactly one active battlefield opponent', () => {
    const { state } = setup();
    const arm = add(state, RUNE, 'skill', false);
    const source = add(state, DEFEAT, 'skill', false);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: arm.instanceId, abilityId: 'fixture.arm-teiwaz' }).ok).toBe(true);
    state.round.activePhase = 'combat';
    const legal = abilityAction(state, source.instanceId, 'fixture.teiwaz-defeat');
    expect(legal).toBeTruthy();
    expect(dispatchAbilityCommand(state, 'p1', legal!).ok).toBe(true);
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBe(state.round.roundNumber);
    expect(abilityAction(state, source.instanceId, 'fixture.teiwaz-defeat')).toBeFalsy();
  });

  it('blocks positive mana gain only for other active players at the live source location', () => {
    const { state } = setup();
    add(state, AURA, 'attack_area', true);
    state.players[1]!.mana = 0;
    state.players[2]!.mana = 0;
    expect(isManaGainSuppressed(state, 'p1')).toBe(false);
    expect(isManaGainSuppressed(state, 'p2')).toBe(true);
    expect(isManaGainSuppressed(state, 'p3')).toBe(false);
    expect(grantMana(state, 'p2', 4).actualAmount).toBe(0);
    expect(grantMana(state, 'p3', 4).actualAmount).toBe(4);
  });

  it('chooses one supported attribute and doubles matching same-location basic base power only for the current round', () => {
    const { state } = setup();
    state.round.activePhase = 'advance';
    const source = add(state, POWER, 'attack_area', true);
    const same = addBasic(state, 'basic.power-magic', ['魔术']);
    const other = addBasic(state, 'basic.power-quick', ['迅捷']);
    const legal = abilityAction(state, source.instanceId, 'fixture.castle-power');
    expect(legal).toBeTruthy();
    expect(dispatchAbilityCommand(state, 'p1', legal!).ok).toBe(true);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toEqual(expect.arrayContaining(['力量', '迅捷', '魔术', '特殊']));
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['魔术'] }).ok).toBe(true);
    expect(calculateCardPower(state, same.instanceId).value).toBe(4);
    expect(calculateCardPower(state, other.instanceId).value).toBe(2);
    state.round.roundNumber += 1;
    expect(calculateCardPower(state, same.instanceId).value).toBe(2);
  });

  it('rejects stale/corrupt private continuation state and invalid persisted multiplier shapes', () => {
    const { state } = setup();
    state.round.activePhase = 'advance';
    const source = add(state, SHUFFLE, 'skill', false);
    addSecret(state, 'secret.tamper-a', 'hand'); addSecret(state, 'secret.tamper-b', 'hand'); addSecret(state, 'secret.tamper-draw', 'deck');
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source.instanceId, abilityId: 'fixture.post-draw-shuffle' }).ok).toBe(true);
    const decisionId = state.abilityRuntime!.pendingDecision!.id;
    (state.abilityRuntime!.pendingDecision!.interaction as any).constraints.max = 3;
    const before = structuredClone(state);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId, selectedIds: state.abilityRuntime!.pendingDecision!.candidates.slice(0, 2) }).ok).toBe(false);
    expect(state).toEqual(before);

    const persisted = setup();
    persisted.state.round.activePhase = 'advance';
    const persistedSource = add(persisted.state, POWER, 'attack_area', true);
    expect(dispatchAbilityCommand(persisted.state, 'p1', {
      type: 'activate_ability', cardInstanceId: persistedSource.instanceId, abilityId: 'fixture.castle-power',
    }).ok).toBe(true);
    const persistedDecision = persisted.state.abilityRuntime!.pendingDecision!;
    expect(dispatchAbilityCommand(persisted.state, 'p1', {
      type: 'choose_target', decisionId: persistedDecision.id, selectedIds: ['魔术'],
    }).ok).toBe(true);
    const session = createMatchSession({ seed: 20260927, humanPlayerId: 'p1' });
    session.state = persisted.state;
    const durable = session.serializeSession();
    expect(() => restoreMatchSession(durable, { restorePackKind: 'trusted_authoring_fixture' })).not.toThrow();
    const forgedMultiplier: any = structuredClone(durable);
    forgedMultiplier.state.abilityRuntime.cardState[persistedSource.instanceId].sourceLocationBasicBasePowerMultiplier.multiplier = 3;
    expect(() => restoreMatchSession(forgedMultiplier, { restorePackKind: 'trusted_authoring_fixture' })).toThrow('Invalid MatchSession state container');
    const forgedAbility: any = structuredClone(durable);
    forgedAbility.state.abilityRuntime.pack.cards[POWER].abilities[0].kind = 'forced_trigger';
    expect(() => restoreMatchSession(forgedAbility, { restorePackKind: 'trusted_authoring_fixture' })).toThrow('Invalid MatchSession state container');
  });

  it('rechecks privileged whole-ability semantics at runtime after compiled-pack corruption', () => {
    const { state } = setup();
    const source = add(state, AURA, 'attack_area', true);
    const ability = state.abilityRuntime!.pack.cards[AURA]!.abilities.find((entry) => entry.id === 'fixture.castle-aura')!;
    ability.kind = 'phase_action';
    expect(() => resolveEffect(state, { sourceCardId: source.instanceId, abilityId: ability.id, controllerId: 'p1', variables: {}, selections: {} }, ability.effects[0]!)).toThrow('Unsupported active source-location mana-gain forbid effect');
  });
});
