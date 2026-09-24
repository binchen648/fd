import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SKILL = 'servant.fixture.kagekiyo.s3';
const SOURCE = 'kagekiyo-source';
const BASIC = 'fixture.kagekiyo.basic';
const ACTION = 'vengeful-grudge-facedown';
const CLOSE = 'vengeful-grudge-permanent__round-end-close';

function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.fixture.kagekiyo', name: 'fixture', class: 'Avenger',
    cards: [
      {
        id: SKILL, name: 'Never Dies', cardType: 'servant_skill', cardFace: { typeLabel: 'skill', attributes: ['宝具'], cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [
          {
            id: 'vengeful-grudge-zero-power', kind: 'passive', printedClause: 'hidden printed base power is zero', markers: ['m50_structured_v1'],
            activation: {}, conditions: [{ type: 'source_owned' }], targets: [], effects: [], cost: [], creates: [],
            ruleModifiers: [{ id: 'hidden-zero', operation: 'set', rule: 'card_base_power', scope: { subject: 'controller', cards: { zones: ['attack_area'], face: 'down' } }, value: 0, lifecycle: { duration: 'permanent' } }],
            lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
          },
          {
            id: 'vengeful-grudge-permanent', kind: 'passive', printedClause: 'hidden attacks gain residual', markers: ['m50_structured_v1'],
            activation: {}, conditions: [{ type: 'source_owned' }], targets: [], effects: [], cost: [], creates: [],
            ruleModifiers: [{ id: 'hidden-residual', operation: 'allow', rule: 'card_residual', scope: { subject: 'controller', cards: { zones: ['attack_area'], face: 'down' } }, value: 1, lifecycle: { duration: 'permanent' } }],
            lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
          },
          {
            id: CLOSE, kind: 'optional_trigger', printedClause: 'may close hidden attacks at round end', markers: ['m50_structured_v1'],
            activation: { trigger: 'round_end' }, conditions: [{ type: 'source_owned' }],
            targets: [{ id: 'face_down_attacks', type: 'card_instance', scope: { zone: 'attack_area' }, count: { min: 1, max: 50 }, constraints: [{ type: 'is_attack', face: 'face_down' }] }],
            cost: [], effects: [{ type: 'close_selected_face_down_attacks', target: 'face_down_attacks' }], creates: [], ruleModifiers: [], lifecycle: {},
            responseWindow: { opens: 'round_end', order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
            execution: { mode: 'automatic', allowedOperations: [] },
          },
          {
            id: ACTION, kind: 'phase_action', printedClause: 'pay 3, draw two and play them face-down', markers: ['m50_structured_v1'],
            activation: { phase: 'advance', opens: 'controller_action_window' },
            conditions: [{ type: 'not', condition: { type: 'card_count_at_least', target: 'controller', zone: 'attack_area', face: 'down', value: 1 } }],
            targets: [], cost: [{ type: 'pay_mana', amount: 3 }], effects: [{ type: 'draw_and_play_face_down_attacks', target: 'controller', count: 2 }],
            creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
          },
        ],
      },
      {
        id: BASIC, name: 'Basic', cardType: 'basic_attack', cardFace: { typeLabel: 'attack', attributes: ['力量'], cost: 1, basePower: 3 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
    ],
  };
}

function setup(options: { sourceFaceDown?: boolean; deckCount?: number; hiddenCount?: number } = {}): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{ instanceId: SOURCE, definitionId: SKILL, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  const deckCount = options.deckCount ?? 2;
  for (let index = 0; index < deckCount; index += 1) {
    state.cards.push({ instanceId: `deck-${index + 1}`, definitionId: BASIC, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'deck', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
  }
  const hiddenCount = options.hiddenCount ?? 0;
  for (let index = 0; index < hiddenCount; index += 1) {
    state.cards.push({ instanceId: `hidden-${index + 1}`, definitionId: BASIC, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
  }
  state.players[0]!.mana = 5;
  state.round.activePhase = 'advance';
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  state.abilityRuntime!.cardState[SOURCE] = { active: false, faceDown: options.sourceFaceDown ?? true, playedRound: state.round.roundNumber };
  for (let index = 0; index < hiddenCount; index += 1) {
    state.abilityRuntime!.cardState[`hidden-${index + 1}`] = { active: false, faceDown: true, playedRound: state.round.roundNumber };
  }
  return state;
}

function action(state: GameState) {
  return rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'activate_ability' && candidate.cardInstanceId === SOURCE && candidate.abilityId === ACTION);
}

describe('P3 F4 M50-02 Kagekiyo Never Dies', () => {
  it('admits only the exact face-down modifier/action/close envelopes', () => {
    const raw = archive();
    expect(rules.loadAuthoringJson(raw).report).toEqual([]);
    expect(rules.isAcceptedM50FaceDownAttackRuleAbility(raw.cards[0].abilities[0])).toBe(true);
    expect(rules.isAcceptedM50FaceDownAttackRuleAbility(raw.cards[0].abilities[1])).toBe(true);
    expect(rules.isAcceptedM50FaceDownAttackCloseAbility(raw.cards[0].abilities[2])).toBe(true);
    expect(rules.isAcceptedM50DrawAndPlayFaceDownAttackAbility(raw.cards[0].abilities[3])).toBe(true);

    const widened = archive();
    widened.cards[0].abilities[0].ruleModifiers[0].scope.cards.zones.push('hand');
    expect(rules.loadAuthoringJson(widened).report.length).toBeGreaterThan(0);
    const widenedAction = archive();
    widenedAction.cards[0].abilities[3].effects[0].count = 3;
    expect(rules.isAcceptedM50DrawAndPlayFaceDownAttackAbility(widenedAction.cards[0].abilities[3])).toBe(false);
    expect(rules.loadAuthoringJson(widenedAction).report.length).toBeGreaterThan(0);
  });

  it('sets only hidden printed/base power to zero while allowing later power effects to modify it', () => {
    const state = setup({ hiddenCount: 1 });
    const hidden = state.cards.find((candidate) => candidate.instanceId === 'hidden-1')!;
    expect(rules.calculateCardPower(state, hidden.instanceId).value).toBe(0);
    (hidden as unknown as { powerModifiers: Array<Record<string, unknown>> }).powerModifiers = [{ kind: 'add', value: 2, sourceId: 'fixture-effect' }];
    expect(rules.calculateCardPower(state, hidden.instanceId).value).toBe(2);

    hidden.zone = 'hand';
    expect(rules.m50FaceDownAttackPrintedBasePowerOverride(state, hidden.instanceId)).toBeUndefined();
  });

  it('pays 3 mana, draws up to two cards, plays them face-down for free, and records authoritative play count', () => {
    const state = setup({ deckCount: 2 });
    expect(action(state)).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state)!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(2);
    for (const id of ['deck-1', 'deck-2']) {
      expect(state.cards.find((candidate) => candidate.instanceId === id)).toMatchObject({ zone: 'attack_area', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
      expect(state.abilityRuntime!.cardState[id]).toMatchObject({ active: false, faceDown: true, paidManaOnPlay: 0 });
    }
    expect(state.abilityRuntime!.playCounters.cardsPlayedByPlayer.p1).toBe(2);
    expect(state.abilityRuntime!.processedEvents.filter((id) => /^play-/.test(id))).toHaveLength(2);
  });

  it('does not offer the advance action while the controller already has a face-down attack', () => {
    const state = setup({ hiddenCount: 1 });
    expect(action(state)).toBeUndefined();
    const before = state.players[0]!.mana;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ACTION }).ok).toBe(false);
    expect(state.players[0]!.mana).toBe(before);
  });

  it('reveals the residual source at round end and lets the controller close any selected subset of hidden attacks', () => {
    const state = setup({ hiddenCount: 2, sourceFaceDown: true });
    expect(rules.m50FaceDownAttackResidual(state, 'hidden-1')).toBe(true);
    rules.advanceAbilityPhase(state, 'round_end');
    expect(state.abilityRuntime!.cardState[SOURCE]!.faceDown).toBe(false);
    expect(state.cards.find((candidate) => candidate.instanceId === SOURCE)!.visibility).toEqual({ scope: 'public' });
    const response = rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'resolve_response' && candidate.cardInstanceId === SOURCE && candidate.abilityId === CLOSE);
    expect(response).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', response!).ok).toBe(true);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toEqual(expect.arrayContaining(['hidden-1', 'hidden-2']));
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['hidden-1'] }).ok).toBe(true);
    expect(state.cards.find((candidate) => candidate.instanceId === 'hidden-1')!.zone).toBe('discard');
    expect(state.cards.find((candidate) => candidate.instanceId === 'hidden-2')!.zone).toBe('attack_area');
  });

  it('declining the round-end response preserves the hidden attack and removing the source disables both continuous rules', () => {
    const state = setup({ hiddenCount: 1, sourceFaceDown: true });
    rules.advanceAbilityPhase(state, 'round_end');
    const decline = rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'decline_this_window');
    expect(decline).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', decline!).ok).toBe(true);
    expect(state.cards.find((candidate) => candidate.instanceId === 'hidden-1')!.zone).toBe('attack_area');

    const source = state.cards.find((candidate) => candidate.instanceId === SOURCE)!;
    source.zone = 'removed_from_game';
    expect(rules.m50FaceDownAttackResidual(state, 'hidden-1')).toBe(false);
    expect(rules.m50FaceDownAttackPrintedBasePowerOverride(state, 'hidden-1')).toBeUndefined();
  });
});
