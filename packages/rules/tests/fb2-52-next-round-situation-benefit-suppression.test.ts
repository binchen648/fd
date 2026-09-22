import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AuthoringAbility, RuleNode } from '../src/ability/types';
import type { GameState } from '../src/schema/game';

const SOURCE_DEF = 'test.fb2-52.source';
const SOURCE_ID = 'fb2-52-source';
const ABILITY_ID = 'fb2-52-suppress-next-situation';

function target(): RuleNode {
  return {
    scope: 'same_battlefield_opponents',
    where: [{
      type: rules.SITUATION_SUPPRESSION_LUCK_PREDICATE,
      definitionIds: [rules.SITUATION_SUPPRESSION_AUTHORING_LUCK_ID], zones: ['attack'], activeOnly: true, face: 'up',
    }],
  };
}

function ability(): AuthoringAbility {
  return {
    id: ABILITY_ID, kind: 'phase_action', printedClause: 'synthetic identity-free FB2-52',
    activation: { phase: 'combat', opens: 'controller_combat_action_window' },
    conditions: [{ type: 'source_active' }, { type: 'at_battlefield' }], targets: [],
    effects: [{
      type: rules.NEXT_ROUND_SITUATION_BENEFIT_SUPPRESSION_EFFECT,
      target: target(), roundOffset: 1, benefits: ['situation_mana_gain', 'situation_power_bonus'],
    }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic' },
  };
}

function archive(rawAbility: AuthoringAbility = ability()) {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: 'test.fb2-52', name: 'FB2-52 synthetic',
    cards: [{
      id: SOURCE_DEF, name: 'source', cardType: 'master_skill', owner: { type: 'master', id: 'test.master' },
      cardFace: { typeLabel: 'attack', cost: 0, basePower: 0, attributes: [] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [rawAbility],
    }],
  };
}

function setup(): GameState {
  const loaded = rules.loadAuthoringJson(archive());
  expect(loaded.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.players[0]!.masterCardId = 'test.master';
  state.cards = [{
    instanceId: SOURCE_ID, definitionId: SOURCE_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area',
    visibility: { scope: 'public' },
  }];
  state.round.activePhase = 'battle';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'miyama_town';
  state.players[3]!.locationId = 'shinto';
  rules.initializeAbilityRuntime(state, loaded, { seed: 5201 });
  state.abilityRuntime!.cardState[SOURCE_ID] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function addLuck(state: GameState, playerId: string, instanceId: string, options: { zone?: string; active?: boolean; faceDown?: boolean } = {}): void {
  const faceDown = options.faceDown ?? false;
  state.cards.push({
    instanceId, definitionId: rules.SITUATION_SUPPRESSION_RUNTIME_LUCK_ID, ownerPlayerId: playerId, controllerPlayerId: playerId,
    zone: options.zone ?? 'attack_area', visibility: faceDown ? { scope: 'owner_only', ownerPlayerId: playerId } : { scope: 'public' },
  });
  state.abilityRuntime!.cardState[instanceId] = { active: options.active ?? true, faceDown, playedRound: state.round.roundNumber };
}

function activate(state: GameState) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE_ID, abilityId: ABILITY_ID });
}

function gateway(rawAbility: AuthoringAbility) { return rules.loadAuthoringJson(archive(rawAbility)).report; }

function modifierSources(state: GameState, playerId: string): string[] {
  const resolved = rules.resolveBattlefield(state, {
    battlefieldId: 'miyama_town',
    participants: [
      { playerId, totalPower: 4, attackTags: ['力量'] },
      { playerId: 'p1', totalPower: 1, attackTags: [] },
    ],
  }).nextState;
  return resolved.battleResults.at(-1)!.participantBreakdowns.find((entry) => entry.playerId === playerId)!.modifiers.map((entry) => entry.source);
}

describe('P3-FB2-52 next-round situation-benefit suppression', () => {
  it('admits only the exact raw and compiled bounded whole envelope', () => {
    const raw = ability();
    expect(rules.isNextRoundSituationBenefitSuppressionCandidate(raw)).toBe(true);
    expect(rules.isAcceptedNextRoundSituationBenefitSuppressionAbility(raw, 'authoring')).toBe(true);
    const loaded = rules.loadAuthoringJson(archive(raw));
    expect(loaded.report).toEqual([]);
    expect(rules.isAcceptedNextRoundSituationBenefitSuppressionAbility(loaded.cards[SOURCE_DEF]!.abilities[0]!, 'compiled')).toBe(true);

    const mutations: Array<(value: AuthoringAbility) => void> = [
      (value) => { value.activation.phase = 'action'; },
      (value) => { value.conditions.reverse(); },
      (value) => { (value.effects[0]!.target as RuleNode).scope = 'all_opponents'; },
      (value) => { ((value.effects[0]!.target as RuleNode).where as RuleNode[])[0]!.definitionIds = ['basic.luck']; },
      (value) => { ((value.effects[0]!.target as RuleNode).where as RuleNode[])[0]!.zones = ['attack_area']; },
      (value) => { ((value.effects[0]!.target as RuleNode).where as RuleNode[])[0]!.activeOnly = false; },
      (value) => { ((value.effects[0]!.target as RuleNode).where as RuleNode[])[0]!.face = 'down'; },
      (value) => { value.effects[0]!.roundOffset = 2; },
      (value) => { value.effects[0]!.benefits = ['situation_power_bonus', 'situation_mana_gain']; },
      (value) => { value.effects[0]!.key = 'arbitrary_flag'; },
      (value) => { value.ruleModifiers.push({ operation: 'forbid', rule: 'situation_mana_gain' }); },
    ];
    for (const mutate of mutations) {
      const near = ability(); mutate(near);
      expect(rules.isAcceptedNextRoundSituationBenefitSuppressionAbility(near, 'authoring')).toBe(false);
      expect(gateway(near)).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'nextRoundSituationBenefitSuppression.gateway', status: 'unsupported' }),
      ]));
    }

    const misplaced = ability();
    misplaced.creates = [misplaced.effects[0]!]; misplaced.effects = [];
    expect(gateway(misplaced)).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'nextRoundSituationBenefitSuppression.gateway', status: 'unsupported' }),
    ]));
  });

  it('requires at least one qualifying same-battlefield opponent before activation', () => {
    const state = setup();
    addLuck(state, 'p2', 'luck-p2'); addLuck(state, 'p3', 'luck-p3');
    expect(rules.nextRoundSituationSuppressionQualifyingOpponentIds(state, 'p1')).toEqual([]);
    const before = structuredClone(state);
    const result = activate(state);
    expect(result.ok).toBe(false);
    expect(state).toEqual(before);
  });

  it('marks all and only qualifying opponents for exactly the next round', () => {
    const state = setup();
    expect(rules.nextRoundSituationSuppressionQualifyingOpponentIds(state, 'p1')).toEqual(['p2', 'p3']);
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.situationBenefitsSuppressedRoundByPlayer).toEqual({ p2: 2, p3: 2 });
    expect(state.abilityRuntime!.situationBenefitsSuppressedRoundByPlayer?.p1).toBeUndefined();
    expect(state.abilityRuntime!.situationBenefitsSuppressedRoundByPlayer?.p4).toBeUndefined();
    expect(rules.situationBenefitsSuppressedForPlayer(state, 'p2')).toBe(false);
    state.round.roundNumber = 2;
    expect(rules.situationBenefitsSuppressedForPlayer(state, 'p2')).toBe(true);
    state.round.roundNumber = 3;
    expect(rules.situationBenefitsSuppressedForPlayer(state, 'p2')).toBe(false);
  });

  it('excludes only active face-up runtime Luck in attack_area', () => {
    const protectedState = setup(); addLuck(protectedState, 'p2', 'luck');
    expect(rules.nextRoundSituationSuppressionQualifyingOpponentIds(protectedState, 'p1')).toEqual(['p3']);

    for (const options of [{ faceDown: true }, { active: false }, { zone: 'hand' }]) {
      const state = setup(); addLuck(state, 'p2', 'luck', options);
      expect(rules.nextRoundSituationSuppressionQualifyingOpponentIds(state, 'p1')).toContain('p2');
    }
  });

  it('revalidates malformed server marker state transactionally', () => {
    const state = setup();
    state.abilityRuntime!.situationBenefitsSuppressedRoundByPlayer = { p2: Number.NaN };
    const before = structuredClone(state);
    const result = activate(state);
    expect(result.ok).toBe(false);
    expect(state).toEqual(before);
    expect(result.rejection?.message).toMatch(/corrupt next-round/i);

    const unknown = setup();
    unknown.abilityRuntime!.situationBenefitsSuppressedRoundByPlayer = { ghost: 2 };
    const unknownBefore = structuredClone(unknown);
    expect(activate(unknown).ok).toBe(false);
    expect(unknown).toEqual(unknownBefore);
  });

  it('suppresses only situation mana during the marked round and restores it afterwards', () => {
    const state = setup();
    expect(activate(state).ok).toBe(true);
    const p2 = state.players.find((player) => player.id === 'p2')!;
    p2.mana = 0;
    expect(rules.grantMana(state, 'p2', 2, { source: 'situation' }).actualAmount).toBe(2);

    state.round.roundNumber = 2; p2.mana = 0;
    expect(rules.grantMana(state, 'p2', 4, { source: 'situation' })).toMatchObject({ cappedRequestAmount: 0, actualAmount: 0, after: 0 });
    expect(rules.grantMana(state, 'p2', 1, { source: 'generic' }).actualAmount).toBe(1);
    expect(rules.grantMana(state, 'p2', 1, { source: 'deployment' }).actualAmount).toBe(1);
    expect(rules.grantMana(state, 'p2', 1, { source: 'event' }).actualAmount).toBe(1);

    state.round.roundNumber = 3; p2.mana = 0;
    expect(rules.grantMana(state, 'p2', 2, { source: 'situation' }).actualAmount).toBe(2);
  });

  it('suppresses only situation combat modifiers during the marked round', () => {
    const state = setup();
    expect(activate(state).ok).toBe(true);
    state.currentSituationModifiers = [{ sourceId: 'situation.test', targetTag: '力量', value: 4 }];
    state.eventPlacements = [{
      locationId: 'miyama_town', eventCardId: 'event.test', victoryPoints: 1,
      battleModifiers: [{ sourceId: 'event.test', targetTag: '力量', value: 2 }], visibility: { scope: 'public' },
    }];

    expect(modifierSources(state, 'p2')).toEqual(expect.arrayContaining(['situation', 'event']));
    state.round.roundNumber = 2;
    const marked = modifierSources(state, 'p2');
    expect(marked).toContain('event');
    expect(marked).not.toContain('situation');

    state.round.roundNumber = 3;
    expect(modifierSources(state, 'p2')).toEqual(expect.arrayContaining(['situation', 'event']));
  });

  it('does not let a remote or eliminated player become a qualifier', () => {
    const state = setup();
    state.players.find((player) => player.id === 'p3')!.status = 'eliminated';
    expect(rules.nextRoundSituationSuppressionQualifyingOpponentIds(state, 'p1')).toEqual(['p2']);
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.situationBenefitsSuppressedRoundByPlayer).toEqual({ p2: 2 });
  });
});
