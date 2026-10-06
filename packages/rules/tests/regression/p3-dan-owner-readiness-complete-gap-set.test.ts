import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const S1 = 'master.synthetic.skill.s1';
const S1A = 'master.synthetic.skill.s1a';
const ASC = 'master.synthetic.skill.ascension';
const PREP = 'basic.preparation';
const DASH = 'basic.surveil';

function response() {
  return { order: 'turn_order', passBehavior: 'decline_this_window' };
}
function forced(id: string, trigger: string, effect: RuleNode): AuthoringAbility {
  return {
    id, kind: 'forced_trigger', printedClause: id, activation: { trigger },
    conditions: [], targets: [], effects: [effect], cost: [], ruleModifiers: [], creates: [],
    lifecycle: {}, responseWindow: response(), limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}
function action(id: string, effect: RuleNode): AuthoringAbility {
  return {
    id, kind: 'phase_action', printedClause: id,
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [], targets: [], effects: [effect], cost: [], ruleModifiers: [], creates: [],
    lifecycle: {}, responseWindow: response(), limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}
function card(id: string, abilities: AuthoringAbility[]): ExecutableCardDefinition {
  return {
    id, name: id, cardType: 'master_skill', ownerId: 'master.synthetic',
    cardFace: { typeLabel: '被动', cost: 0, basePower: 0, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities, mode: 'automatic', playKind: 'support', destinationZone: 'field',
  };
}
function basic(id: string, name: string, power: number): ExecutableCardDefinition {
  return {
    id, name, cardType: 'basic_attack',
    cardFace: { typeLabel: '特殊', cost: 1, basePower: power, attributes: ['特殊'] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities: [], mode: 'automatic', playKind: 'attack', destinationZone: 'attack_area',
  };
}

const terrainAbility = forced('synthetic.terrain', 'after_player_deployed_to_location', {
  type: rules.ROUND_LOCATION_TERRAIN_REPLACEMENTS_EFFECT,
  triggerLocationId: 'magic_workshop',
  replacements: [
    { locationId: 'miyama_town', value: 3 },
    { locationId: 'shinto', value: 5 },
  ],
});
const honorAbility = forced('synthetic.honor', 'after_controller_enters_location', {
  type: rules.ARM_MOVEMENT_COMPETITION_SUPPRESSION_EFFECT,
  opponentCount: 2,
  suppresses: 'competition_vp',
});
const seedAbility = forced('synthetic.seed', 'after_master_ascension_unlocked', {
  type: rules.SEED_ATTACHED_SUPPLY_EFFECT,
  cards: [
    { definitionId: PREP, count: 3 },
    { definitionId: DASH, count: 2 },
  ],
});
const playPrep = action('synthetic.play-prep', {
  type: rules.PLAY_ATTACHED_SUPPLY_DEFINITION_EFFECT,
  definitionId: PREP, drawAfterPlay: 1, maxPerRound: 1,
});
const playDash = action('synthetic.play-dash', {
  type: rules.PLAY_ATTACHED_SUPPLY_DEFINITION_EFFECT,
  definitionId: DASH, drawAfterPlay: 1, maxPerRound: 1,
});

function setup(): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.players[0]!.masterCardId = 'master.synthetic';
  state.cards = [
    { instanceId: 's1', definitionId: S1, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 's1a', definitionId: S1A, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'asc', definitionId: ASC, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'draw-me', definitionId: PREP, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'deck', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
  ];
  rules.initializeAbilityRuntime(state, {
    cards: {
      [S1]: card(S1, [terrainAbility]),
      [S1A]: card(S1A, [honorAbility]),
      [ASC]: card(ASC, [seedAbility, playPrep, playDash]),
      [PREP]: basic(PREP, '远隔操作', 2),
      [DASH]: basic(DASH, '急行', 3),
    },
  }, { seed: 20261007 });
  return state;
}

function archive(abilities: AuthoringAbility[]) {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    id: 'master.synthetic',
    name: 'synthetic',
    cards: [{
      id: 'master.synthetic.skill.probe',
      name: 'probe',
      cardType: 'master_skill',
      owner: { type: 'master', id: 'master.synthetic' },
      cardFace: { typeLabel: '被动', cost: 0, basePower: 0, attributes: [] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities,
    }],
  };
}

describe('P3 Dan owner readiness complete gap set', () => {
  it('admits only the exact identity-free whole-ability envelopes', () => {
    for (const ability of [terrainAbility, honorAbility, seedAbility, playPrep, playDash]) {
      expect(rules.isAcceptedRoundLocationSupplyAbility(ability)).toBe(true);
      expect(rules.loadAuthoringJson(archive([ability])).report).toEqual([]);
    }

    const malformed = structuredClone(terrainAbility);
    (malformed.effects[0]!.replacements as RuleNode[])[0]!.value = 4;
    expect(rules.isAcceptedRoundLocationSupplyAbility(malformed)).toBe(false);
    expect(rules.loadAuthoringJson(archive([malformed])).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'roundLocationSupply.gateway', status: 'unsupported' }),
    ]));

    const widened = structuredClone(honorAbility);
    widened.effects[0]!.opponentCount = 3;
    expect(rules.isAcceptedRoundLocationSupplyAbility(widened)).toBe(false);
  });

  it('turns a workshop deployment into exact round terrain 3/5, including ordinary remote-operation doubling', () => {
    const state = setup();
    state.players[0]!.locationId = 'magic_workshop';
    rules.processAbilityEvent(state, {
      id: 'deploy-workshop',
      type: 'after_player_deployed_to_location',
      playerId: 'p1',
      locationId: 'magic_workshop',
    });
    state.players[0]!.locationId = 'miyama_town';
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(3);
    state.players[0]!.locationId = 'shinto';
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(5);

    const prep = state.cards.find((entry) => entry.instanceId === 'draw-me')!;
    prep.zone = 'attack_area'; prep.visibility = { scope: 'public' };
    state.abilityRuntime!.cardState[prep.instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(10);

    state.round.roundNumber += 1;
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(0);
  });

  it('arms only an actual move into exactly two opponents and suppresses only that battle competition VP', () => {
    const state = setup();
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'miyama_town';
    state.players[2]!.locationId = 'miyama_town';
    state.players[3]!.locationId = 'shinto';
    rules.processAbilityEvent(state, {
      id: 'move-two-opponents',
      type: 'after_controller_enters_location',
      playerId: 'p1',
      previousLocationId: 'magic_workshop',
      locationId: 'miyama_town',
      movementKind: 'normal',
    });
    expect(rules.movementCompetitionRewardSuppressed(state, 'p1', 'miyama_town')).toBe(true);

    const location = state.map.locations.find((entry) => entry.id === 'miyama_town')!;
    location.rewardHooks = ['battle_rewards', 'competition_rewards', 'location_rewards'];
    location.vpRewardRules = { battle: 2, competition: 3, location: 4 };
    const resolved = rules.resolveBattlefield(state, {
      battlefieldId: 'miyama_town',
      participants: [
        { playerId: 'p1', totalPower: 9 },
        { playerId: 'p2', totalPower: 4 },
        { playerId: 'p3', totalPower: 3 },
      ],
    }).nextState;
    const result = resolved.battleResults.at(-1)!;
    expect(result.winnerPlayerIds).toEqual(['p1']);
    expect(result.vpAdjustments?.some((entry) => entry.playerId === 'p1' && entry.source === 'competition_vp')).toBe(false);
    expect(result.vpAdjustments).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: 'p1', source: 'location_vp', delta: 4 }),
    ]));
  });

  it('does not arm Honor for deployment, non-battlefield co-occupancy, or the wrong opponent count', () => {
    const deployment = setup();
    deployment.players[0]!.locationId = 'miyama_town';
    deployment.players[1]!.locationId = 'miyama_town';
    deployment.players[2]!.locationId = 'miyama_town';
    rules.processAbilityEvent(deployment, {
      id: 'deployment-not-move', type: 'after_player_deployed_to_location', playerId: 'p1', locationId: 'miyama_town',
    });
    expect(rules.movementCompetitionRewardSuppressed(deployment, 'p1', 'miyama_town')).toBe(false);

    const nonBattlefield = setup();
    nonBattlefield.players[0]!.locationId = 'recon';
    nonBattlefield.players[1]!.locationId = 'recon';
    nonBattlefield.players[2]!.locationId = 'recon';
    rules.processAbilityEvent(nonBattlefield, {
      id: 'move-recon', type: 'after_controller_enters_location', playerId: 'p1',
      previousLocationId: 'miyama_town', locationId: 'recon', movementKind: 'normal',
    });
    expect(nonBattlefield.abilityRuntime!.movementCompetitionSuppressions?.p1).toBeUndefined();

    const one = setup();
    one.players[0]!.locationId = 'miyama_town'; one.players[1]!.locationId = 'miyama_town'; one.players[2]!.locationId = 'shinto';
    rules.processAbilityEvent(one, {
      id: 'move-one', type: 'after_controller_enters_location', playerId: 'p1',
      previousLocationId: 'shinto', locationId: 'miyama_town', movementKind: 'effect',
    });
    expect(one.abilityRuntime!.movementCompetitionSuppressions?.p1).toBeUndefined();
  });

  it('seeds exactly 3 remote-operation plus 2 dash cards and permits only one attached supply play per round', () => {
    const state = setup();
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    state.players[0]!.mana = 3;
    rules.processAbilityEvent(state, {
      id: 'ascension-unlocked',
      type: 'after_master_ascension_unlocked',
      playerId: 'p1',
      sourceCardId: 'asc',
    });
    const supply = rules.attachedSupplyStateForPlayer(state, 'p1')!;
    expect(supply.definitionIds.filter((id) => id === PREP)).toHaveLength(3);
    expect(supply.definitionIds.filter((id) => id === DASH)).toHaveLength(2);
    expect(supply.cardInstanceIds.map((id) => state.cards.find((card) => card.instanceId === id)?.zone))
      .toEqual(['attached_supply', 'attached_supply', 'attached_supply', 'attached_supply', 'attached_supply']);

    const legal = rules.getLegalActions(state, 'p1').filter((entry) => entry.type === 'activate_ability');
    expect(legal).toEqual(expect.arrayContaining([
      expect.objectContaining({ cardInstanceId: 'asc', abilityId: 'synthetic.play-prep' }),
      expect.objectContaining({ cardInstanceId: 'asc', abilityId: 'synthetic.play-dash' }),
    ]));

    const beforeHand = state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'hand').length;
    const result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'activate_ability', cardInstanceId: 'asc', abilityId: 'synthetic.play-prep',
    });
    expect(result.ok).toBe(true);
    expect(state.players[0]!.mana).toBe(2);
    expect(state.cards.filter((card) => supply.cardInstanceIds.includes(card.instanceId) && card.definitionId === PREP && card.zone === 'attack_area')).toHaveLength(1);
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'hand')).toHaveLength(beforeHand + 1);
    expect(state.abilityRuntime!.playCounters.attacksDeclaredByPlayer.p1 ?? 0).toBe(0);
    expect(rules.getLegalActions(state, 'p1').some((entry) =>
      entry.type === 'activate_ability' && entry.cardInstanceId === 'asc' &&
      ['synthetic.play-prep', 'synthetic.play-dash'].includes(entry.abilityId))).toBe(false);

    state.round.roundNumber += 1;
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    expect(rules.getLegalActions(state, 'p1')).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'activate_ability', cardInstanceId: 'asc', abilityId: 'synthetic.play-dash' }),
    ]));
  });

  it('accepts exact attached-supply restore authority and rejects physical provenance tampering', () => {
    const state = setup();
    rules.processAbilityEvent(state, {
      id: 'ascension-unlocked-restore',
      type: 'after_master_ascension_unlocked',
      playerId: 'p1',
      sourceCardId: 'asc',
    });
    expect(rules.isRoundLocationSupplyRuntimeProvenanceValidForRestore(state)).toBe(true);

    const tampered = structuredClone(state);
    const supply = tampered.abilityRuntime!.attachedSupplyByPlayer!.p1!;
    tampered.cards.find((card) => card.instanceId === supply.cardInstanceIds[0])!.generatedBy = 'forged-source';
    expect(rules.isRoundLocationSupplyRuntimeProvenanceValidForRestore(tampered)).toBe(false);
  });

  it('keeps all production readiness authority identity-free', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const production = [
      'packages/rules/src/ability/round-location-supply-capability.ts',
      'packages/rules/src/core/terrain-advantage.ts',
      'packages/rules/src/core/combat-resolver.ts',
      'packages/rules/src/ability/interpreter.ts',
    ].map((file) => fs.readFileSync(file, 'utf8')).join('\n').toLowerCase();
    for (const needle of ['master.dan', '丹·布拉克莫尔', '五朔节骑士', '可敬的狙击手', '荣誉', 'core.dan-']) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });
});
