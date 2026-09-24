import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SOURCE_DEF = 'servant.fixture.lubu.skill.s2';
const SOURCE = 'lubu-source';
const ABILITY = 'lapse-of-loyalty';

function ability(): any {
  return {
    id: ABILITY,
    kind: 'passive',
    printedClause: 'fixture source-specific victory point gain',
    markers: ['m50_structured_v1'],
    activation: {},
    conditions: [{ type: 'source_owned' }],
    targets: [],
    cost: [],
    effects: [],
    creates: [],
    ruleModifiers: [
      {
        id: 'defiance-objective-zero',
        operation: 'set',
        rule: 'victory_point_gain',
        scope: { subject: 'controller', sources: ['objective'] },
        value: 0,
        lifecycle: { duration: 'permanent' },
      },
      {
        id: 'defiance-command-competition-double',
        operation: 'multiply',
        rule: 'victory_point_gain',
        scope: { subject: 'controller', sources: ['command_seal', 'competition'] },
        value: 2,
        lifecycle: { duration: 'permanent' },
      },
    ],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function archive(customAbility: any = ability()): any {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'servant_skill_card_archive',
    id: 'servant.fixture.lubu',
    name: 'fixture',
    class: 'Berserker',
    cards: [{
      id: SOURCE_DEF,
      name: 'Defiance',
      cardType: 'servant_skill',
      owner: { type: 'servant', id: 'servant.fixture.lubu' },
      cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [customAbility],
    }],
  };
}

function setup(withObjective = true): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'battle';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  const location = state.map.locations.find((entry) => entry.id === 'miyama_town')!;
  location.vpRewardRules = { ...(location.vpRewardRules ?? {}), battle: 1, competition: 2, location: 6 };
  state.eventPlacements = withObjective ? [{
    eventCardId: 'event.lubu.objective',
    locationId: 'miyama_town',
    victoryPoints: 4,
    visibility: { scope: 'public' },
  }] : [];
  state.cards = [{
    instanceId: SOURCE,
    definitionId: SOURCE_DEF,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  state.abilityRuntime!.cardState[SOURCE] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function resolveAndScore(state: GameState) {
  const resolved = rules.resolveBattlefield(state, {
    battlefieldId: 'miyama_town',
    participants: [
      { playerId: 'p1', totalPower: 10 },
      { playerId: 'p2', totalPower: 5 },
    ],
  }).nextState;
  const battle = resolved.battleResults.at(-1)!;
  const scored = rules.applyBattleScoring(resolved).nextState;
  const breakdown = scored.scoringBreakdown?.find((entry) => entry.playerId === 'p1');
  return { battle, scored, breakdown };
}

describe('P3 F4 M50-02 Lu Bu Defiance', () => {
  it('accepts only the exact source-owned objective-zero / command+competition-double bundle', () => {
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report).toEqual([]);
    const compiled = loaded.cards[SOURCE_DEF]!.abilities[0]!;
    expect(rules.isAcceptedM50SourceSpecificVictoryPointGainAbility(compiled)).toBe(true);

    const widened = ability();
    widened.ruleModifiers[1].scope.sources = ['command_seal', 'competition', 'scouting'];
    expect(rules.loadAuthoringJson(archive(widened)).report.length).toBeGreaterThan(0);

    const wrong = ability();
    wrong.ruleModifiers[0].operation = 'multiply';
    expect(rules.loadAuthoringJson(archive(wrong)).report.length).toBeGreaterThan(0);
  });

  it('sets objective VP to zero, doubles competition VP, and leaves location VP unchanged', () => {
    const state = setup(true);
    const { battle, scored, breakdown } = resolveAndScore(state);
    expect(battle).toMatchObject({ vpReward: 4, eventVpPool: 4, competitionVpPool: 2, printedEventVpTotal: 4 });
    expect(breakdown?.reasons).not.toContainEqual(expect.objectContaining({ source: 'battle_vp' }));
    expect(breakdown?.reasons).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'competition_vp', value: 4 }),
      expect.objectContaining({ source: 'location_vp', value: 6 }),
    ]));
    expect(breakdown?.vpDelta).toBe(10);
    expect(scored.players.find((player) => player.id === 'p1')!.vp).toBe(10);
  });

  it('does not erase the baseline battle reward when no objective/event is present', () => {
    const state = setup(false);
    const { battle, breakdown } = resolveAndScore(state);
    expect(battle.printedEventVpTotal).toBe(0);
    expect(battle.vpReward).toBe(1);
    expect(breakdown?.reasons).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'battle_vp', value: 1 }),
      expect.objectContaining({ source: 'competition_vp', value: 4 }),
      expect.objectContaining({ source: 'location_vp', value: 6 }),
    ]));
    expect(breakdown?.vpDelta).toBe(11);
  });

  it('exposes the same source-specific query for host-adjudicated command-seal VP and does not alter scouting', () => {
    const state = setup(true);
    expect(rules.m50VictoryPointGainForSource(state, 'p1', 'command_seal', 2)).toBe(4);
    expect(rules.m50VictoryPointGainForSource(state, 'p1', 'competition', 3)).toBe(6);
    expect(rules.m50VictoryPointGainForSource(state, 'p1', 'objective', 5)).toBe(0);
    expect(rules.m50VictoryPointGainForSource(state, 'p1', 'scouting', 2)).toBe(2);
  });

  it('stops applying immediately after the source leaves every owned live zone', () => {
    const state = setup(true);
    state.cards.find((card) => card.instanceId === SOURCE)!.zone = 'removed_from_game';
    expect(rules.m50VictoryPointGainForSource(state, 'p1', 'objective', 4)).toBe(4);
    expect(rules.m50VictoryPointGainForSource(state, 'p1', 'competition', 2)).toBe(2);
    expect(rules.m50VictoryPointGainForSource(state, 'p1', 'command_seal', 2)).toBe(2);
  });
});
