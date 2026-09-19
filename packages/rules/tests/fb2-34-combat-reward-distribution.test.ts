import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityDefinitionPack, AuthoringAbility, RuleNode } from '../src/ability/types';

function rewardModifier(overrides: Record<string, unknown> = {}): RuleNode {
  return {
    id: 'full-reward-each', printedClause: 'synthetic full reward distribution',
    operation: 'replace', rule: 'combat_reward_distribution',
    scope: { subject: 'controller', whenControllerWins: true, mode: 'full_reward_each' },
    ...overrides,
  };
}

function rewardAbility(modifier: RuleNode = rewardModifier(), overrides: Partial<AuthoringAbility> = {}): AuthoringAbility {
  return {
    id: 'reward-distribution', kind: 'passive', printedClause: 'synthetic full reward distribution',
    activation: {}, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [modifier], creates: [],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
    ...overrides,
  };
}

function archive(ability: AuthoringAbility = rewardAbility()) {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: 'master.synthetic', name: 'synthetic', cards: [{
      id: 'skill.reward-source', name: 'reward source', cardType: 'master_skill',
      cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [], requirement: { type: 'none' } },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [ability],
    }],
  };
}

function setup(options: {
  modifierController?: 'p1' | 'p2' | 'p3';
  active?: boolean;
  faceDown?: boolean;
  duplicateWinnerModifier?: boolean;
  remoteOperation?: boolean;
  malformedAbility?: AuthoringAbility;
} = {}) {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.round.activePhase = 'battle';
  for (const player of state.players) {
    if (['p1', 'p2', 'p3'].includes(player.id)) player.locationId = 'miyama_town';
  }
  const location = state.map.locations.find((entry) => entry.id === 'miyama_town');
  if (!location) throw new Error('missing miyama_town');
  location.vpRewardRules = { ...(location.vpRewardRules ?? {}), battle: 1, competition: 2, location: 6 };
  state.eventPlacements = [{
    eventCardId: 'event.synthetic.reward', locationId: 'miyama_town', victoryPoints: 4,
    visibility: { scope: 'public' },
  }];
  state.cards = [];

  const cards: AbilityDefinitionPack['cards'] = {};
  const addModifierSource = (controllerId: string, suffix: string, ability = rewardAbility()) => {
    const definitionId = `skill.reward-${suffix}`;
    cards[definitionId] = {
      id: definitionId, name: 'reward source', cardType: 'master_skill', cardFace: { cost: 0, basePower: 0, attributes: [] },
      playTiming: {}, playRequirements: [], abilities: [ability], mode: 'automatic', playKind: 'support', destinationZone: 'field',
    } as any;
    state.cards.push({
      instanceId: `source-${suffix}`, definitionId, ownerPlayerId: controllerId, controllerPlayerId: controllerId,
      zone: 'field', visibility: { scope: 'public' },
    });
  };

  if (options.modifierController) addModifierSource(options.modifierController, 'a', options.malformedAbility ?? rewardAbility());
  if (options.duplicateWinnerModifier) addModifierSource('p2', 'b');
  if (options.remoteOperation) {
    state.cards.push({
      instanceId: 'remote-operation', definitionId: 'basic.preparation', ownerPlayerId: 'p1', controllerPlayerId: 'p1',
      zone: 'attack_area', visibility: { scope: 'public' },
    });
  }

  rules.initializeAbilityRuntime(state, { cards }, { seed: 20260920 });
  for (const card of state.cards) {
    state.abilityRuntime!.cardState[card.instanceId] = {
      active: card.instanceId.startsWith('source-') ? options.active !== false : true,
      faceDown: card.instanceId.startsWith('source-') ? options.faceDown === true : false,
      playedRound: state.round.roundNumber,
    };
  }
  return state;
}

function resolve(state: ReturnType<typeof setup>, powers: [number, number, number] = [10, 10, 5]) {
  return rules.resolveBattlefield(state, {
    battlefieldId: 'miyama_town',
    participants: [
      { playerId: 'p1', totalPower: powers[0] },
      { playerId: 'p2', totalPower: powers[1] },
      { playerId: 'p3', totalPower: powers[2] },
    ],
  }).nextState;
}

function result(state: ReturnType<typeof setup>, powers?: [number, number, number]) {
  const resolved = resolve(state, powers);
  const battle = resolved.battleResults.at(-1)!;
  const scored = rules.applyBattleScoring(resolved).nextState;
  return { battle, scored };
}

describe('P3-FB2-34 combat reward distribution', () => {
  it('loader accepts only the exact static passive full_reward_each envelope', () => {
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);

    const malformed: AuthoringAbility[] = [
      rewardAbility(rewardModifier({ operation: 'set' })),
      rewardAbility(rewardModifier({ scope: { subject: 'all_players', whenControllerWins: true, mode: 'full_reward_each' } })),
      rewardAbility(rewardModifier({ scope: { subject: 'controller', whenControllerWins: false, mode: 'full_reward_each' } })),
      rewardAbility(rewardModifier({ scope: { subject: 'controller', whenControllerWins: true, mode: 'split' } })),
      rewardAbility(rewardModifier({ scope: { subject: 'controller', whenControllerWins: true, mode: 'full_reward_each', extra: true } })),
      rewardAbility(rewardModifier({ lifecycle: { duration: 'this_round' } })),
      rewardAbility(rewardModifier({ installation: 'effect' })),
      rewardAbility(rewardModifier(), { activation: { trigger: 'while_active' } }),
      rewardAbility(rewardModifier(), { lifecycle: { duration: 'this_round' } }),
      rewardAbility(rewardModifier(), { ruleModifiers: [rewardModifier(), { operation: 'ignore', rule: 'netherworld_protection' }] }),
      rewardAbility(rewardModifier(), { kind: 'residual' }),
    ];
    for (const ability of malformed) {
      const loaded = rules.loadAuthoringJson(archive(ability));
      expect(loaded.report.length).toBeGreaterThan(0);
      expect(loaded.cards['skill.reward-source']!.abilities[0]!.execution.mode).toBe('unsupported');
    }
  });

  it('replaces winner-count splitting with full event, competition, and location rewards', () => {
    const ordinary = result(setup());
    expect(ordinary.battle.winnerPlayerIds).toEqual(['p1', 'p2']);
    expect(ordinary.battle).toMatchObject({ vpReward: 2, baseVpPerWinner: 3, eventVpPool: 4, competitionVpPool: 2 });
    expect(ordinary.battle.vpAdjustments).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: 'p1', delta: 1, source: 'competition_vp' }),
      expect.objectContaining({ playerId: 'p2', delta: 1, source: 'competition_vp' }),
      expect.objectContaining({ playerId: 'p1', delta: 3, source: 'location_vp' }),
      expect.objectContaining({ playerId: 'p2', delta: 3, source: 'location_vp' }),
    ]));

    const full = result(setup({ modifierController: 'p1' }));
    expect(full.battle.winnerPlayerIds).toEqual(ordinary.battle.winnerPlayerIds);
    expect(full.battle.militaryAdjustments).toEqual(ordinary.battle.militaryAdjustments);
    expect(full.battle.participantBreakdowns).toEqual(ordinary.battle.participantBreakdowns);
    expect(full.battle).toMatchObject({ vpReward: 4, baseVpPerWinner: 6, eventVpPool: 4, competitionVpPool: 2 });
    expect(full.battle.vpAdjustments).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: 'p1', delta: 2, source: 'competition_vp' }),
      expect.objectContaining({ playerId: 'p2', delta: 2, source: 'competition_vp' }),
      expect.objectContaining({ playerId: 'p1', delta: 6, source: 'location_vp' }),
      expect.objectContaining({ playerId: 'p2', delta: 6, source: 'location_vp' }),
    ]));
    expect(full.scored.players.find((p) => p.id === 'p1')?.vp).toBe(12);
    expect(full.scored.players.find((p) => p.id === 'p2')?.vp).toBe(12);
  });

  it('does not alter distribution for a losing, inactive, or face-down source', () => {
    for (const state of [
      setup({ modifierController: 'p3' }),
      setup({ modifierController: 'p1', active: false }),
      setup({ modifierController: 'p1', faceDown: true }),
    ]) {
      const { battle } = result(state);
      expect(battle.vpReward).toBe(2);
      expect(battle.baseVpPerWinner).toBe(3);
      expect(battle.vpAdjustments).toEqual(expect.arrayContaining([
        expect.objectContaining({ playerId: 'p1', delta: 1, source: 'competition_vp' }),
        expect.objectContaining({ playerId: 'p1', delta: 3, source: 'location_vp' }),
      ]));
    }
  });

  it('is neutral for a sole winner', () => {
    const ordinary = result(setup(), [10, 8, 5]);
    const full = result(setup({ modifierController: 'p1' }), [10, 8, 5]);
    expect(full.battle.winnerPlayerIds).toEqual(['p1']);
    expect(full.battle.vpReward).toBe(ordinary.battle.vpReward);
    expect(full.battle.baseVpPerWinner).toBe(ordinary.battle.baseVpPerWinner);
    expect(full.battle.vpAdjustments).toEqual(ordinary.battle.vpAdjustments);
  });

  it('is idempotent across duplicate winning modifiers and does not multiply Remote Operation', () => {
    const one = result(setup({ modifierController: 'p1', remoteOperation: true }));
    const duplicate = result(setup({ modifierController: 'p1', duplicateWinnerModifier: true, remoteOperation: true }));
    expect(duplicate.battle.vpReward).toBe(one.battle.vpReward);
    expect(duplicate.battle.baseVpPerWinner).toBe(one.battle.baseVpPerWinner);
    expect(duplicate.battle.vpAdjustments).toEqual(one.battle.vpAdjustments);
    expect(duplicate.battle.vpAdjustments?.filter((entry) => entry.playerId === 'p1' && entry.label === 'basic.preparation.win_bonus')).toHaveLength(1);
    expect(duplicate.battle.vpAdjustments).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: 'p1', delta: 2, label: 'basic.preparation.win_bonus' }),
    ]));
    expect(duplicate.scored.players.find((p) => p.id === 'p1')?.vp).toBe(14);
    expect(duplicate.scored.players.find((p) => p.id === 'p2')?.vp).toBe(12);
  });

  it('fails closed at runtime for a malformed near-match even if injected outside the loader', () => {
    const malformed = rewardAbility(rewardModifier({ scope: { subject: 'controller', whenControllerWins: true, mode: 'full_reward_each', extra: true } }));
    const { battle } = result(setup({ modifierController: 'p1', malformedAbility: malformed }));
    expect(battle.vpReward).toBe(2);
    expect(battle.baseVpPerWinner).toBe(3);
  });
});
