import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { GameState } from '../src/schema/game';

const SOURCE_DEF = 'fixture.prebattle-defeat';
const SOURCE_ID = 'prebattle-source';
const ABILITY_ID = 'prebattle-defeat-action';
const SWIFT_DEF = 'fixture.swift-attack';
const POWER_DEF = 'fixture.power-attack';

function exactAbility() {
  return {
    id: ABILITY_ID,
    kind: 'phase_action',
    printedClause: 'Defeat engaged opponents without a swift attack this round.',
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [{ type: 'source_active' }],
    targets: [],
    effects: [{
      type: 'defeat_player',
      target: {
        scope: 'engaged_opponents',
        where: [{ type: 'no_attack_played_this_round_with_attribute', attribute: '迅捷' }],
      },
    }],
    cost: [],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic' },
  };
}

function archive(abilityPatch: Record<string, unknown> = {}) {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    id: 'fixture.prebattle-owner',
    name: 'Pre-battle Defeat Fixture',
    class: 'Rider',
    cards: [
      {
        id: SOURCE_DEF,
        name: 'Pre-battle Defeat',
        cardType: 'servant_skill',
        cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [{ ...exactAbility(), ...abilityPatch }],
      },
      {
        id: SWIFT_DEF,
        name: 'Swift Attack',
        cardType: 'servant_attack',
        cardFace: { typeLabel: '迅捷', attributes: ['迅捷'], cost: 0, basePower: 4 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [],
      },
      {
        id: POWER_DEF,
        name: 'Power Attack',
        cardType: 'servant_attack',
        cardFace: { typeLabel: '力量', attributes: ['力量'], cost: 0, basePower: 4 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [],
      },
    ],
  };
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'miyama_town';
  rules.initializeAbilityRuntime(state, pack, { seed: 45 });
  state.cards.push({
    instanceId: SOURCE_ID,
    definitionId: SOURCE_DEF,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'attack_area',
    visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState[SOURCE_ID] = {
    active: true,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return state;
}

function activate(state: GameState) {
  const action = rules.getLegalActions(state, 'p1').find((candidate) =>
    candidate.type === 'activate_ability' && candidate.cardInstanceId === SOURCE_ID && candidate.abilityId === ABILITY_ID);
  expect(action).toBeDefined();
  expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
}

function addAttack(state: GameState, playerId: string, definitionId: string, playedRound: number, faceDown = false) {
  const id = `${playerId}-${definitionId}-${state.cards.length}`;
  state.cards.push({
    instanceId: id,
    definitionId,
    ownerPlayerId: playerId,
    controllerPlayerId: playerId,
    zone: 'attack_area',
    visibility: faceDown ? { scope: 'owner_only', ownerPlayerId: playerId } : { scope: 'public' },
  });
  state.abilityRuntime!.cardState[id] = { active: true, faceDown, playedRound };
  return id;
}

function settle(state: GameState) {
  state.round.activePhase = 'battle';
  return rules.resolveBattlefield(state, {
    battlefieldId: 'shinto',
    participants: [
      { playerId: 'p1', totalPower: 5 },
      { playerId: 'p2', totalPower: 10 },
    ],
  }).nextState;
}

describe('P3-FB2-45 pre-battle defeat by current-round attack attribute', () => {
  it('accepts only the exact identity-free authoring shape and rejects nearby widened shapes', () => {
    const accepted = rules.loadAuthoringJson(archive());
    expect(accepted.report).toEqual([]);
    expect(rules.isAcceptedPreBattleDefeatAbility(accepted.cards[SOURCE_DEF]!.abilities[0]!)).toBe(true);

    const patches = [
      { activation: { phase: 'advance', opens: 'controller_action_window' } },
      { conditions: [{ type: 'source_active' }, { type: 'controller_at_battlefield' }] },
      { effects: [{ type: 'defeat_player', target: { scope: 'same_battlefield_opponents', where: [{ type: 'no_attack_played_this_round_with_attribute', attribute: '迅捷' }] } }] },
      { effects: [{ type: 'defeat_player', target: 'controller' }] },
      { effects: [{ type: 'defeat_player', target: { scope: 'engaged_opponents', where: [{ type: 'face_up_cards_played_this_round_at_least', count: 1 }] } }] },
      { effects: [{ type: 'defeat_player', target: { scope: 'engaged_opponents', where: [{ type: 'no_attack_played_this_round_with_attribute', attribute: '迅捷', extra: true }] } }] },
      { effects: [exactAbility().effects[0], { type: 'adjust_mana', player: 'controller', amount: 1 }] },
    ];
    for (const patch of patches) {
      expect(rules.loadAuthoringJson(archive(patch)).report).toEqual(expect.arrayContaining([
        expect.objectContaining({ abilityId: ABILITY_ID, status: 'unsupported', path: 'preBattleDefeat.gateway' }),
      ]));
    }
  });

  it('fails closed when either FB2-45 token appears outside the exact effects envelope', () => {
    const defeatInCreates = archive({
      effects: [],
      creates: [exactAbility().effects[0]],
    });
    expect(rules.loadAuthoringJson(defeatInCreates).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ abilityId: ABILITY_ID, status: 'unsupported', path: 'preBattleDefeat.gateway' }),
    ]));

    const predicateInConditions = archive({
      conditions: [
        { type: 'source_active' },
        { type: 'no_attack_played_this_round_with_attribute', attribute: '迅捷' },
      ],
      effects: [{ type: 'adjust_mana', player: 'controller', amount: 1 }],
    });
    expect(rules.loadAuthoringJson(predicateInConditions).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ abilityId: ABILITY_ID, status: 'unsupported', path: 'preBattleDefeat.gateway' }),
    ]));

    const predicateInTargetConstraint = archive({
      targets: [{
        id: 'misused-predicate-target',
        type: 'player',
        constraints: [{ type: 'no_attack_played_this_round_with_attribute', attribute: '迅捷' }],
      }],
      effects: [{ type: 'adjust_mana', player: 'controller', amount: 1 }],
    });
    expect(rules.loadAuthoringJson(predicateInTargetConstraint).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ abilityId: ABILITY_ID, status: 'unsupported', path: 'preBattleDefeat.gateway' }),
    ]));
  });

  it('fails closed on non-array forbidden FB2-45 containers before loader normalization', () => {
    const malformedForbiddenFields: Array<[string, unknown]> = [
      ['targets', {}],
      ['targets', 'controller'],
      ['cost', { type: 'pay_mana', amount: 1 }],
      ['cost', 1],
      ['creates', {}],
      ['creates', 'token'],
      ['ruleModifiers', {}],
      ['ruleModifiers', 'modifier'],
    ];

    for (const [field, value] of malformedForbiddenFields) {
      const loaded = rules.loadAuthoringJson(archive({ [field]: value }));
      expect(loaded.report, field).toEqual(expect.arrayContaining([
        expect.objectContaining({ abilityId: ABILITY_ID, status: 'unsupported', path: 'preBattleDefeat.gateway' }),
      ]));
    }
  });

  it('stages same-battlefield defeat and settlement excludes the stronger opponent, then consumes the intent', () => {
    const state = setup();
    activate(state);
    expect(state.abilityRuntime!.pendingPreBattleDefeats).toEqual([
      expect.objectContaining({ round: state.round.roundNumber, battlefieldId: 'shinto', targetPlayerIds: ['p2'] }),
    ]);
    const settled = settle(state);
    expect(settled.battleResults.at(-1)!.winnerPlayerIds).toEqual(['p1']);
    expect(settled.battleResults.at(-1)!.excludedPlayerIds).toContain('p2');
    expect(settled.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
    expect(settled.log).toContainEqual(expect.objectContaining({ type: 'prebattle_defeat_applied' }));
  });

  it('a current-round swift attack protects the opponent, including when it is face-down', () => {
    for (const faceDown of [false, true]) {
      const state = setup();
      addAttack(state, 'p2', SWIFT_DEF, state.round.roundNumber, faceDown);
      activate(state);
      expect(state.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
      expect(settle(state).battleResults.at(-1)!.winnerPlayerIds).toEqual(['p2']);
    }
  });

  it('the accepted add-to-attack gateway writes current-round swift provenance for the recipient', () => {
    const state = setup();
    const maiyaRaw = JSON.parse(readFileSync(resolve(process.cwd(), 'data/authoring/masters/master.maiya.json'), 'utf8'));
    const maiyaPack = rules.loadAuthoringJson(maiyaRaw);
    expect(maiyaPack.report).toEqual([]);
    Object.assign(state.abilityRuntime!.pack.cards, maiyaPack.cards);

    state.players[2]!.locationId = 'recon';
    state.players[2]!.mana = 4;
    state.cards.push(
      {
        instanceId: 'maiya-source', definitionId: 'master.maiya.skill.military', ownerPlayerId: 'p3', controllerPlayerId: 'p3',
        zone: 'skill', visibility: { scope: 'public' },
      },
      {
        instanceId: 'maiya-support', definitionId: 'master.maiya.deck.support-shot', ownerPlayerId: 'p3', controllerPlayerId: 'p3',
        zone: 'skill', visibility: { scope: 'public' },
      },
    );
    state.abilityRuntime!.cardState['maiya-source'] = { active: true, faceDown: false };
    state.abilityRuntime!.cardState['maiya-support'] = { active: false, faceDown: false };
    state.round.activePhase = 'advance';
    rules.executeAbility(state, {
      controllerId: 'p3', sourceCardId: 'maiya-source', abilityId: 'military.attach-support-shot',
      selections: { supported_player: ['p2'] }, variables: {},
    });
    expect(state.cards.find((card) => card.instanceId === 'maiya-support')).toMatchObject({
      controllerPlayerId: 'p2', zone: 'attack_area',
    });
    expect(state.abilityRuntime!.cardState['maiya-support']).toMatchObject({ playedRound: state.round.roundNumber });

    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    activate(state);
    expect(state.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
  });

  it('a non-swift or previous-round attack does not protect, and a player at another battlefield is untouched', () => {
    const state = setup();
    addAttack(state, 'p2', POWER_DEF, state.round.roundNumber);
    addAttack(state, 'p2', SWIFT_DEF, state.round.roundNumber - 1);
    activate(state);
    expect(state.abilityRuntime!.pendingPreBattleDefeats![0]!.targetPlayerIds).toEqual(['p2']);
    expect(state.abilityRuntime!.pendingPreBattleDefeats![0]!.targetPlayerIds).not.toContain('p3');
  });

  it('inactive opponents are not targeted and an intent cannot affect or be consumed by another battlefield', () => {
    const inactive = setup();
    inactive.players[1]!.status = 'eliminated';
    activate(inactive);
    expect(inactive.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);

    const state = setup();
    activate(state);
    const unrelated = rules.resolveBattlefield(state, {
      battlefieldId: 'miyama_town',
      participants: [{ playerId: 'p3', totalPower: 9 }],
    }).nextState;
    expect(unrelated.battleResults.at(-1)!.winnerPlayerIds).toEqual(['p3']);
    expect(unrelated.battleResults.at(-1)!.excludedPlayerIds ?? []).not.toContain('p2');
    expect(unrelated.abilityRuntime!.pendingPreBattleDefeats).toHaveLength(1);
    const settled = settle(unrelated);
    expect(settled.battleResults.at(-1)!.winnerPlayerIds).toEqual(['p1']);
    expect(settled.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
  });

  it('existing battle-loss immunity cancels the defeat consequence without leaking the intent', () => {
    const state = setup();
    state.cards.push({
      instanceId: 'p2-luck', definitionId: 'basic.luck', ownerPlayerId: 'p2', controllerPlayerId: 'p2',
      zone: 'attack_area', visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState['p2-luck'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    activate(state);
    const settled = settle(state);
    expect(settled.battleResults.at(-1)!.winnerPlayerIds).toEqual(['p2']);
    expect(settled.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
    expect(settled.log).toContainEqual(expect.objectContaining({ type: 'prebattle_defeat_ignored' }));
  });

  it('applies and consumes a matching intent before Return Silence early settlement, including Luck immunity', () => {
    const olgaRaw = JSON.parse(readFileSync(resolve(process.cwd(), 'data/authoring/masters/master.olga-marie.json'), 'utf8'));
    const olgaPack = rules.loadAuthoringJson(olgaRaw);
    expect(olgaPack.report).toEqual([]);

    for (const immune of [false, true]) {
      const state = createSeededGameState({ activeSeats: [1, 2] });
      state.cards = [];
      state.eventPlacements = [];
      state.round.activePhase = 'battle';
      state.players[0]!.locationId = 'miyama_town';
      state.players[1]!.locationId = 'miyama_town';
      rules.initializeAbilityRuntime(state, olgaPack, { seed: 4501 });
      state.cards.push({
        instanceId: 'return-silence-source',
        definitionId: 'master.olga-marie.skill.trismegistus-grief',
        ownerPlayerId: 'p1',
        controllerPlayerId: 'p1',
        zone: 'field',
        visibility: { scope: 'public' },
      });
      state.abilityRuntime!.cardState['return-silence-source'] = {
        active: true,
        faceDown: false,
        playedRound: state.round.roundNumber,
      };
      state.abilityRuntime!.transformedReturnSilenceSourceCardIds = ['return-silence-source'];
      state.abilityRuntime!.pendingPreBattleDefeats = [{
        round: state.round.roundNumber,
        battlefieldId: 'miyama_town',
        controllerId: 'p2',
        sourceCardId: 'reviewer-prebattle-source',
        abilityId: 'reviewer-prebattle-ability',
        targetPlayerIds: ['p1'],
      }];
      if (immune) {
        state.cards.push({
          instanceId: 'p1-luck',
          definitionId: 'basic.luck',
          ownerPlayerId: 'p1',
          controllerPlayerId: 'p1',
          zone: 'attack_area',
          visibility: { scope: 'public' },
        });
        state.abilityRuntime!.cardState['p1-luck'] = {
          active: true,
          faceDown: false,
          playedRound: state.round.roundNumber,
        };
      }

      const settled = rules.resolveBattlefield(state, {
        battlefieldId: 'miyama_town',
        participants: [
          { playerId: 'p1', totalPower: 1 },
          { playerId: 'p2', totalPower: 99 },
        ],
      }).nextState;

      expect(settled.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
      if (immune) {
        expect(settled.battleResults.at(-1)!.winnerPlayerIds).toEqual(['p1']);
        expect(settled.battleResults.at(-1)!.excludedPlayerIds ?? []).not.toContain('p1');
        expect(settled.log).toContainEqual(expect.objectContaining({ type: 'prebattle_defeat_ignored' }));
      } else {
        expect(settled.battleResults.at(-1)!.winnerPlayerIds).not.toContain('p1');
        expect(settled.battleResults.at(-1)!.excludedPlayerIds).toContain('p1');
        expect(settled.log).toContainEqual(expect.objectContaining({ type: 'prebattle_defeat_applied' }));
      }
    }
  });

  it('repeated resolution is idempotent and round advance clears stale intents', () => {
    const state = setup();
    activate(state);
    const first = structuredClone(state.abilityRuntime!.pendingPreBattleDefeats);
    rules.executeAbility(state, { controllerId: 'p1', sourceCardId: SOURCE_ID, abilityId: ABILITY_ID, selections: {}, variables: {} });
    expect(state.abilityRuntime!.pendingPreBattleDefeats).toEqual(first);
    rules.advanceAbilityPhase(state, 'action', state.round.roundNumber + 1);
    expect(state.abilityRuntime!.pendingPreBattleDefeats).toEqual([]);
  });
});
