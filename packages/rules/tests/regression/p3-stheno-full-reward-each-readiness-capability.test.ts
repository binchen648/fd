import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const OWNER = 'servant.fixture-full-reward';
const SOURCE = `${OWNER}.skill.reward`;
const ABILITY = 'fixture.full-reward-each';

function exactAbility() {
  return {
    id: ABILITY,
    kind: 'passive',
    printedClause: 'fixture',
    activation: {},
    conditions: [],
    targets: [],
    effects: [],
    cost: [],
    ruleModifiers: [{
      id: 'fixture.reward-distribution',
      printedClause: 'fixture',
      operation: 'replace',
      rule: 'combat_reward_distribution',
      scope: { subject: 'controller', whenControllerWins: true, mode: 'full_reward_each' },
    }],
    creates: [],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}

function archive(ability = exactAbility()) {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    id: OWNER,
    name: 'Fixture',
    class: 'Assassin',
    cards: [{
      id: SOURCE,
      name: 'Fixture Reward',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: OWNER },
      cardFace: { typeLabel: 'Passive', attributes: ['Passive'], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [ability],
      verification: { implementationStatus: 'complete' },
    }],
  } as any;
}

function setup(sourceController = 'p1', sourceZone = 'skill') {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.round.activePhase = 'battle';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'miyama_town';
  state.cards = [{
    instanceId: 'fixture-reward-source', definitionId: SOURCE,
    ownerPlayerId: sourceController, controllerPlayerId: sourceController, zone: sourceZone,
    visibility: sourceZone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: sourceController },
  } as any];
  const location = state.map.locations.find((entry) => entry.id === 'miyama_town')! as any;
  location.rewardHooks = ['battle_rewards', 'competition_rewards', 'location_rewards'];
  location.vpRewardRules = { battle: 2, competition: 3, location: 4 };
  state.eventPlacements = [{ locationId: 'miyama_town', eventCardId: 'fixture-event', victoryPoints: 2, visibility: { scope: 'public' } }];
  state.battleResults = [];
  rules.initializeAbilityRuntime(state, pack, { seed: 20260928 });
  return state;
}

function resolveTie(state: GameState) {
  return rules.resolveBattlefield(state, {
    battlefieldId: 'miyama_town',
    participants: [
      { playerId: 'p1', totalPower: 5 },
      { playerId: 'p2', totalPower: 5 },
      { playerId: 'p3', totalPower: 1 },
    ],
  }).nextState.battleResults.at(-1)!;
}

function adjustment(result: GameState['battleResults'][number], playerId: string, source: string): number {
  return result.vpAdjustments?.find((entry) => entry.playerId === playerId && entry.source === source)?.delta ?? 0;
}

describe('P3 Stheno full-reward-each readiness capability', () => {
  it('accepts only the exact identity-free whole-ability replacement shell', () => {
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report.some((entry) => entry.status === 'unsupported')).toBe(false);
    expect(rules.isAcceptedFullRewardEachAbility(loaded.cards[SOURCE]!.abilities[0]!)).toBe(true);

    const minimalReferenceShape = {
      id: ABILITY,
      printedClause: 'fixture',
      kind: 'passive',
      ruleModifiers: structuredClone(exactAbility().ruleModifiers),
      execution: { mode: 'automatic' },
    } as any;
    expect(rules.loadAuthoringJson(archive(minimalReferenceShape)).report.some((entry) => entry.status === 'unsupported')).toBe(false);

    const mutations: Array<(ability: any) => void> = [
      (ability) => { ability.ruleModifiers[0].operation = 'set'; },
      (ability) => { ability.ruleModifiers[0].rule = 'battle_reward_distribution'; },
      (ability) => { ability.ruleModifiers[0].scope.subject = 'all_players'; },
      (ability) => { ability.ruleModifiers[0].scope.whenControllerWins = false; },
      (ability) => { ability.ruleModifiers[0].scope.mode = 'split'; },
      (ability) => { ability.ruleModifiers[0].scope.extra = true; },
      (ability) => { delete ability.ruleModifiers[0].id; },
      (ability) => { ability.execution.extra = true; },
      (ability) => { ability.execution.allowedOperations = ['adjust-mana']; },
      (ability) => { ability.conditions.push({ type: 'controller_won_battle' }); },
      (ability) => { ability.effects.push({ type: 'adjust_victory_points', amount: 1 }); },
      (ability) => { ability.kind = 'residual'; },
    ];
    for (const mutate of mutations) {
      const ability = structuredClone(exactAbility());
      mutate(ability);
      expect(rules.loadAuthoringJson(archive(ability)).report.some((entry) => entry.status === 'unsupported')).toBe(true);
    }
  });

  it('replaces normal tie splitting with full event, competition, and location rewards for every winner', () => {
    const result = resolveTie(setup());
    expect(result.winnerPlayerIds).toEqual(['p1', 'p2']);
    expect(result.vpReward).toBe(2);
    expect(result.baseVpPerWinner).toBe(5);
    expect(adjustment(result, 'p1', 'competition_vp')).toBe(3);
    expect(adjustment(result, 'p2', 'competition_vp')).toBe(3);
    expect(adjustment(result, 'p1', 'location_vp')).toBe(4);
    expect(adjustment(result, 'p2', 'location_vp')).toBe(4);
  });

  it('leaves the default authoritative split unchanged when no provider exists', () => {
    const state = setup();
    state.cards[0]!.zone = 'discard';
    const result = resolveTie(state);
    expect(result.vpReward).toBe(1);
    expect(result.baseVpPerWinner).toBe(3);
    expect(adjustment(result, 'p1', 'competition_vp')).toBe(2);
    expect(adjustment(result, 'p1', 'location_vp')).toBe(2);
  });

  it('requires the provider controller to be one of the actual battle winners', () => {
    const result = resolveTie(setup('p3'));
    expect(result.vpReward).toBe(1);
    expect(result.baseVpPerWinner).toBe(3);
    expect(adjustment(result, 'p1', 'competition_vp')).toBe(2);
    expect(adjustment(result, 'p1', 'location_vp')).toBe(2);
  });

  it('keeps passive skill/hand sources live and requires attack-area sources to be active and face-up', () => {
    expect(resolveTie(setup('p1', 'hand')).baseVpPerWinner).toBe(5);

    const faceDownSkill = setup('p1', 'skill');
    faceDownSkill.abilityRuntime!.cardState['fixture-reward-source'] = { active: false, faceDown: true } as any;
    expect(resolveTie(faceDownSkill).baseVpPerWinner).toBe(3);

    const inactive = setup('p1', 'attack_area');
    expect(resolveTie(inactive).baseVpPerWinner).toBe(3);

    const active = setup('p1', 'attack_area');
    active.abilityRuntime!.cardState['fixture-reward-source'] = { active: true, faceDown: false } as any;
    expect(resolveTie(active).baseVpPerWinner).toBe(5);

    const faceDown = setup('p1', 'attack_area');
    faceDown.abilityRuntime!.cardState['fixture-reward-source'] = { active: true, faceDown: true } as any;
    expect(resolveTie(faceDown).baseVpPerWinner).toBe(3);
  });

  it('preserves downstream VP adjustments after full-reward replacement instead of bypassing reductions', () => {
    const state = setup();
    const resolved = rules.resolveBattlefield(state, {
      battlefieldId: 'miyama_town',
      participants: [
        { playerId: 'p1', totalPower: 5 },
        { playerId: 'p2', totalPower: 5 },
        { playerId: 'p3', totalPower: 1 },
      ],
    }).nextState;
    const result = resolved.battleResults.at(-1)!;
    result.vpAdjustments ??= [];
    result.vpAdjustments.push({ playerId: 'p1', delta: -1, source: 'battle_vp', label: 'fixture.reward-reduction' });
    const scored = rules.applyBattleScoring(resolved).nextState;
    expect(scored.players.find((player) => player.id === 'p1')!.vp).toBe(8);
    expect(scored.players.find((player) => player.id === 'p2')!.vp).toBe(9);
  });

  it('does not route by Stheno identity and remains driven entirely by the authored semantic shape', () => {
    const state = setup();
    expect(SOURCE.includes('stheno')).toBe(false);
    expect(rules.shouldEachBattleWinnerReceiveFullReward(state, ['p1', 'p2'])).toBe(true);
    expect(rules.shouldEachBattleWinnerReceiveFullReward(state, ['p2'])).toBe(false);
  });
});
