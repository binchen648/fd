import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SOURCE_DEF = 'servant.fixture.napoleon.skill.s1';
const SOURCE = 'napoleon-source';
const LUCK_DEF = 'card.cardluck';
const LUCK = 'napoleon-luck';
const ABILITY = 'hidden-trump-combat';

function modifiers(): any[] {
  return [
    {
      id: 'hidden-trump-ignore-defeat', printedClause: 'ignore defeat', installation: 'effect', operation: 'ignore', rule: 'defeat',
      scope: { subject: 'controller' }, lifecycle: { duration: 'this_round', cleanup: 'remain_active' },
    },
    {
      id: 'hidden-trump-co-win', printedClause: 'co-win', installation: 'effect', operation: 'allow', rule: 'combat_winner_inclusion',
      scope: { subject: 'controller' }, lifecycle: { duration: 'this_round', cleanup: 'remain_active' },
    },
    {
      id: 'hidden-trump-full-reward', printedClause: 'full reward', installation: 'effect', operation: 'replace', rule: 'combat_reward_distribution',
      scope: { subject: 'controller', whenControllerWins: true, mode: 'full_reward_each' }, lifecycle: { duration: 'this_round', cleanup: 'remain_active' },
    },
  ];
}

function ability(): any {
  return {
    id: ABILITY, kind: 'phase_action', printedClause: 'fixture hidden trump', markers: ['m50_structured_v1'],
    activation: { phase: 'combat', opens: 'controller_combat_action_window' },
    conditions: [
      { type: 'source_owned' }, { type: 'at_battlefield' },
      { type: 'card_count_at_least', zone: 'hand', value: 1, definitionId: LUCK_DEF },
    ],
    targets: [], cost: [], creates: [],
    effects: [{
      type: 'choose_cards', zone: 'hand', minCount: 1, maxCount: 1, payloadKey: 'selectedInstanceIds', definitionId: LUCK_DEF,
      then: [
        { type: 'remove_selected_cards', zone: 'hand', payloadKey: 'selectedInstanceIds', minCount: 1, maxCount: 1 },
        { type: 'install_ability_rule_modifier', abilityId: ABILITY, modifierId: 'hidden-trump-ignore-defeat', target: 'controller' },
        { type: 'install_ability_rule_modifier', abilityId: ABILITY, modifierId: 'hidden-trump-co-win', target: 'controller' },
        { type: 'install_ability_rule_modifier', abilityId: ABILITY, modifierId: 'hidden-trump-full-reward', target: 'controller' },
      ],
    }],
    ruleModifiers: modifiers(), lifecycle: {}, responseWindow: {},
    limit: { type: 'per_game', uses: 1, scope: 'this_card' },
    visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function archive(customAbility: any = ability()): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.fixture.napoleon', name: 'fixture', class: 'Archer',
    cards: [
      {
        id: SOURCE_DEF, name: 'Hidden Trump', cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.fixture.napoleon' },
        cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [customAbility],
      },
      {
        id: LUCK_DEF, name: 'Luck', cardType: 'basic_attack', owner: { type: 'master', id: 'fixture' },
        cardFace: { typeLabel: 'Luck', cost: 0, basePower: 0, attributes: ['幸运'] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
    ],
  };
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.round.activePhase = 'battle';
  for (const player of state.players.filter((candidate) => ['p1', 'p2', 'p3'].includes(candidate.id))) player.locationId = 'miyama_town';
  state.round.prioritySeat = state.players.find((player) => player.id === 'p1')!.seat;
  const location = state.map.locations.find((entry) => entry.id === 'miyama_town')!;
  location.vpRewardRules = { ...(location.vpRewardRules ?? {}), battle: 1, competition: 2, location: 6 };
  state.eventPlacements = [{ eventCardId: 'event.napoleon.reward', locationId: 'miyama_town', victoryPoints: 4, visibility: { scope: 'public' } }];
  state.cards = [
    { instanceId: SOURCE, definitionId: SOURCE_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: LUCK, definitionId: LUCK_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
  ];
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  state.abilityRuntime!.cardState[SOURCE] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  state.abilityRuntime!.cardState[LUCK] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function action(state: GameState) {
  return rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'activate_ability' && candidate.cardInstanceId === SOURCE && candidate.abilityId === ABILITY);
}
function activateAndChooseLuck(state: GameState) {
  const a = action(state); expect(a).toBeTruthy();
  expect(rules.dispatchAbilityCommand(state, 'p1', a!).ok).toBe(true);
  const pending = state.abilityRuntime!.pendingDecision!;
  expect(pending).toMatchObject({ controllerId: 'p1', candidates: [LUCK], min: 1, max: 1 });
  expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [LUCK] })).toMatchObject({ ok: true });
}

function resolve(state: GameState) {
  return rules.resolveBattlefield(state, {
    battlefieldId: 'miyama_town',
    participants: [
      { playerId: 'p1', totalPower: 1 },
      { playerId: 'p2', totalPower: 10 },
      { playerId: 'p3', totalPower: 5 },
    ],
  }).nextState;
}

describe('P3 F4 M50-02 Napoleon Hidden Trump', () => {
  it('accepts only the exact three-rule effect-installed combat-settlement bundle', () => {
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report).toEqual([]);
    expect(rules.isAcceptedEffectInstalledCombatSettlementBundle(loaded.cards[SOURCE_DEF]!.abilities[0]!.ruleModifiers)).toBe(true);
    const widened = ability(); widened.ruleModifiers[1].scope = { subject: 'all_players' };
    expect(rules.loadAuthoringJson(archive(widened)).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ abilityId: ABILITY, status: 'unsupported' }),
    ]));
    const wrongLife = ability(); wrongLife.ruleModifiers[2].lifecycle.cleanup = 'expire_after_duration';
    expect(rules.loadAuthoringJson(archive(wrongLife)).report.length).toBeGreaterThan(0);
  });

  it('exiles exactly one Luck, installs all three round rules, reveals true name, and exhausts the per-game use', () => {
    const state = setup(); activateAndChooseLuck(state);
    expect(state.cards.find((card) => card.instanceId === LUCK)?.zone).toBe('removed_from_game');
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(rules.m50EffectInstalledCombatDefeatIgnored(state, 'p1')).toBe(true);
    expect(rules.m50EffectInstalledCombatWinnerIncluded(state, 'p1')).toBe(true);
    expect(rules.m50EffectInstalledFullRewardEach(state, ['p1'])).toBe(true);
    expect(state.abilityRuntime!.ongoingEffects.filter((entry) => entry.policyKey === rules.M50_EFFECT_INSTALLED_COMBAT_SETTLEMENT_POLICY)).toHaveLength(1);
    expect(action(state)).toBeUndefined();
  });

  it('ignores defeat, co-wins despite lower power, and grants every winner the full combat reward', () => {
    const state = setup(); activateAndChooseLuck(state);
    state.abilityRuntime!.structuredDefeatRoundByPlayer = { p1: state.round.roundNumber };
    state.cards.find((card) => card.instanceId === SOURCE)!.zone = 'removed_from_game';
    state.abilityRuntime!.cardState[SOURCE]!.active = false;
    const resolved = resolve(state);
    const battle = resolved.battleResults.at(-1)!;
    expect(battle.winnerPlayerIds).toEqual(expect.arrayContaining(['p1', 'p2']));
    expect(battle.winnerPlayerIds).toHaveLength(2);
    expect(battle.excludedPlayerIds ?? []).not.toContain('p1');
    expect(battle).toMatchObject({ vpReward: 4, baseVpPerWinner: 6, eventVpPool: 4, competitionVpPool: 2 });
    expect(battle.vpAdjustments).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: 'p1', delta: 2, source: 'competition_vp' }),
      expect.objectContaining({ playerId: 'p2', delta: 2, source: 'competition_vp' }),
      expect.objectContaining({ playerId: 'p1', delta: 6, source: 'location_vp' }),
      expect.objectContaining({ playerId: 'p2', delta: 6, source: 'location_vp' }),
    ]));
  });

  it('survives source removal for the current round and expires cleanly on the next round', () => {
    const state = setup(); activateAndChooseLuck(state);
    state.cards.find((card) => card.instanceId === SOURCE)!.zone = 'removed_from_game';
    state.abilityRuntime!.cardState[SOURCE]!.active = false;
    expect(rules.m50EffectInstalledCombatWinnerIncluded(state, 'p1')).toBe(true);
    rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
    expect(rules.m50EffectInstalledCombatDefeatIgnored(state, 'p1')).toBe(false);
    expect(rules.m50EffectInstalledCombatWinnerIncluded(state, 'p1')).toBe(false);
    expect(rules.m50EffectInstalledFullRewardEach(state, ['p1'])).toBe(false);
  });

  it('fails closed if the selected Luck leaves hand before the pending choice resolves', () => {
    const state = setup();
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state)!).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    state.cards.find((card) => card.instanceId === LUCK)!.zone = 'discard';
    const denied = rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [LUCK] });
    expect(denied.ok).toBe(false);
    expect(state.cards.find((card) => card.instanceId === LUCK)?.zone).toBe('discard');
    expect(state.abilityRuntime!.ongoingEffects.some((entry) => entry.policyKey === rules.M50_EFFECT_INSTALLED_COMBAT_SETTLEMENT_POLICY)).toBe(false);
  });
});
