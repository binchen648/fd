import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import {
  advanceAbilityPhase,
  calculateCardPower,
  dispatchAbilityCommand,
  getLegalActions,
  initializeAbilityRuntime,
  processAbilityEvent,
} from '../../src/ability/interpreter';
import { getEffectiveCardAttributes } from '../../src/ability/card-instance-state';
import { GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID } from '../../src/ability/revealed-card-mechanics';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-revealed-source';
const SOURCE = `${ROOT}.skill.source`;
const OTHER = `${ROOT}.skill.other`;
const CONDITIONAL = `${ROOT}.skill.conditional`;
const BASIC = 'basic.fixture-revealed-source';

function abilityBase(id: string, kind: string, activation: Record<string, unknown> = {}) {
  return {
    id, kind, printedClause: id, activation, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function archive() {
  const curse = abilityBase('fixture.curse', 'forced_trigger', { trigger: 'round_start' });
  curse.conditions = [{ type: 'source_revealed' }];
  curse.effects = [{ type: 'adjust_victory_points', player: 'controller', amount: -1 }];
  const grant = abilityBase('fixture.grant-basic-action', 'passive');
  grant.effects = [{
    type: 'grant_controller_basic_attack_double_base_remove_action_while_source_revealed',
    manaCost: 2, basePowerMultiplier: 2, removeAfter: 'after_battle_ended',
  }];
  const refund = abilityBase('fixture.refund', 'residual', { trigger: 'after_battle_ended' });
  refund.conditions = [{ type: 'source_revealed' }];
  refund.targets = [{
    id: 'refund-attack', type: 'card_instance', count: { min: 1, max: 1 },
    scope: { zone: 'attack_area', owner: 'any', controller: 'any' },
    constraints: [
      { type: 'is_attack' },
      { type: 'played_this_round' },
      { type: 'controlled_by_event_battle_opponent_at_controller_location' },
    ],
  }];
  refund.effects = [{ type: 'gain_mana_equal_selected_card_paid_cost', target: 'refund-attack' }];
  const conditional = abilityBase('fixture.conditional-attributes', 'passive');
  conditional.effects = [
    { type: 'gain_attribute_if_owned_definition_revealed', definitionId: SOURCE, attribute: '迅捷' },
    { type: 'gain_attribute_if_owned_definition_revealed', definitionId: OTHER, attribute: '魔术' },
  ];
  return {
    schemaVersion: 'fd-card-authoring-v1', id: ROOT, displayName: 'Fixture Revealed Source', owner: { type: 'servant', id: ROOT },
    sources: [], deck: [],
    cards: [
      {
        id: SOURCE, name: 'Source', cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
        cardFace: { cost: 0, basePower: 1, attributes: ['力量'] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [curse, grant, refund], verification: { implementationStatus: 'complete' },
      },
      {
        id: OTHER, name: 'Other Source', cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
        cardFace: { cost: 0, basePower: 1, attributes: ['力量'] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [], verification: { implementationStatus: 'complete' },
      },
      {
        id: CONDITIONAL, name: 'Conditional', cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
        cardFace: { cost: 0, basePower: 5, attributes: ['力量'] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [conditional], verification: { implementationStatus: 'complete' },
      },
      {
        id: BASIC, name: 'Basic', cardType: 'basic_attack',
        cardFace: { cost: 0, basePower: 4, attributes: ['力量'] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [], verification: { implementationStatus: 'complete' },
      },
    ],
  } as any;
}

function setup() {
  const pack = loadAuthoringJson(archive());
  const state = createSeededGameState(); state.cards = [];
  state.players[0]!.servantCardId = ROOT; state.players[0]!.locationId = 'shinto'; state.players[0]!.mana = 10; state.players[0]!.vp = 10;
  state.players[1]!.locationId = 'shinto'; state.players[2]!.locationId = 'miyama_town';
  initializeAbilityRuntime(state, pack, { seed: 20260927 });
  return { state, pack };
}
function add(state: GameState, definitionId: string, owner='p1', zone='skill', active=false, faceDown=false) {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone, visibility: ['field','attack_area','removed_from_game'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown, playedRound: state.round.roundNumber };
  return state.cards[state.cards.length - 1]!;
}
function markRevealed(state: GameState, instanceId: string) {
  state.abilityRuntime!.cardPlayCountByInstance![instanceId] = 1;
  state.abilityRuntime!.cardState[instanceId]!.faceDown = false;
}

describe('P3 bounded revealed-source capability', () => {
  it('loads exact generic shapes and fails closed on widened near matches', () => {
    const good = loadAuthoringJson(archive());
    expect(good.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const mutations = [
      (raw: any) => { raw.cards[0].abilities[0].conditions[0].extra = true; },
      (raw: any) => { raw.cards[0].abilities[1].effects[0].extra = true; },
      (raw: any) => { raw.cards[0].abilities[2].targets[0].constraints[2].extra = true; },
      (raw: any) => { raw.cards[0].abilities[2].effects[0].extra = true; },
      (raw: any) => { raw.cards[2].abilities[0].effects[0].extra = true; },
    ];
    for (const mutate of mutations) {
      const raw = archive(); mutate(raw); const loaded = loadAuthoringJson(raw);
      expect(loaded.report.some((entry) => entry.status === 'unsupported')).toBe(true);
    }
  });

  it('treats source reveal as a physical play fact and emits a trusted round-start trigger', () => {
    const { state } = setup(); const source = add(state, SOURCE, 'p1', 'discard', false); markRevealed(state, source.instanceId);
    advanceAbilityPhase(state, 'preparation', 2);
    expect(state.players[0]!.vp).toBe(9);
    expect(state.abilityRuntime!.processedEvents.some((id) => id.includes('round-start'))).toBe(true);
  });

  it('grants each controller basic attack the 2-mana double-base action only after the source physical card was revealed', () => {
    const { state } = setup(); const source = add(state, SOURCE, 'p1', 'discard', false); const basic = add(state, BASIC, 'p1', 'attack_area', true);
    state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    expect(getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === basic.instanceId && entry.abilityId === GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID)).toBe(false);
    markRevealed(state, source.instanceId);
    expect(getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === basic.instanceId && entry.abilityId === GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID)).toBe(true);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: basic.instanceId, abilityId: GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(8);
    expect(calculateCardPower(state, basic.instanceId).value).toBe(8);
    processAbilityEvent(state, { id: 'not-a-terminal', type: 'after_battle_ended' });
    expect(state.cards.find((card) => card.instanceId === basic.instanceId)?.zone).toBe('attack_area');
    processAbilityEvent(state, { id: 'battle-phase:1:after_battle_ended', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:1', battleParticipantIds: ['p1','p2'] });
    expect(state.cards.find((card) => card.instanceId === basic.instanceId)?.zone).toBe('removed_from_game');
  });

  it('adds conditional attributes only while the referenced owned physical source has been revealed', () => {
    const { state } = setup(); const one = add(state, SOURCE); const two = add(state, OTHER); const target = add(state, CONDITIONAL);
    expect(getEffectiveCardAttributes(state, target.instanceId)).toEqual(['力量']);
    markRevealed(state, one.instanceId);
    expect(getEffectiveCardAttributes(state, target.instanceId)).toEqual(['力量','迅捷']);
    markRevealed(state, two.instanceId);
    expect(getEffectiveCardAttributes(state, target.instanceId)).toEqual(['力量','迅捷','魔术']);
  });

  it('does not derive revealed-source capabilities from unsupported or disabled authored abilities', () => {
    const raw = archive();
    raw.cards[0].abilities[1].execution = { mode: 'unsupported', reason: 'fixture disabled' };
    raw.cards[2].abilities[0].execution = { mode: 'unsupported', reason: 'fixture disabled' };
    const pack = loadAuthoringJson(raw);
    expect(pack.report.some((entry) => entry.abilityId === 'fixture.grant-basic-action' && entry.status === 'unsupported')).toBe(true);
    expect(pack.report.some((entry) => entry.abilityId === 'fixture.conditional-attributes' && entry.status === 'unsupported')).toBe(true);

    const state = createSeededGameState(); state.cards = [];
    state.players[0]!.servantCardId = ROOT; state.players[0]!.locationId = 'shinto'; state.players[0]!.mana = 10;
    initializeAbilityRuntime(state, pack, { seed: 20260927 });
    const source = add(state, SOURCE, 'p1', 'discard', false);
    const basic = add(state, BASIC, 'p1', 'attack_area', true);
    const target = add(state, CONDITIONAL);
    state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    markRevealed(state, source.instanceId);

    expect(getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === basic.instanceId && entry.abilityId === GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID)).toBe(false);
    expect(getEffectiveCardAttributes(state, target.instanceId)).toHaveLength(1);
  });

  it('offers exactly one same-battle opponent attack and refunds its trusted paid mana cost', () => {
    const { state } = setup(); const source = add(state, SOURCE, 'p1', 'discard', false); markRevealed(state, source.instanceId);
    const opponent = add(state, BASIC, 'p2', 'attack_area', true); state.abilityRuntime!.cardState[opponent.instanceId]!.paidManaOnPlay = 5;
    state.abilityRuntime!.cardState[opponent.instanceId]!.playedRound = state.round.roundNumber;
    const otherBattle = add(state, BASIC, 'p3', 'attack_area', true); state.abilityRuntime!.cardState[otherBattle.instanceId]!.paidManaOnPlay = 9;
    state.players[0]!.mana = 1;
    processAbilityEvent(state, { id: 'battle-terminal:refund', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:1', battleParticipantIds: ['p1','p2','p3'] });
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.candidates).toEqual([opponent.instanceId]);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [opponent.instanceId] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(6);
  });
});
