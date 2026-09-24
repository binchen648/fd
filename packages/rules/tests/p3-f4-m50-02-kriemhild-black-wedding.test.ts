import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const WEDDING = 'servant.fixture.kriemhild.black-wedding';
const BALMUNG = 'servant.kriemhild.skill.sc-kriemhild-3';
const SOURCE = 'black-wedding-source';
const BALMUNG_SOURCE = 'balmung-source';

function weddingAbilities(): any[] {
  return [
    {
      id: 'widow-shared-victory', kind: 'passive', printedClause: 'fixture', markers: ['m50_structured_v1'], activation: {},
      conditions: [{ type: 'source_active' }], targets: [], effects: [], cost: [], creates: [],
      ruleModifiers: [{
        id: 'black-wedding-winner', operation: 'allow', rule: 'combat_winner_inclusion',
        scope: { subject: 'controller', whenOtherWinnerControlsOrHasSkillDefinitionId: BALMUNG }, lifecycle: { duration: 'while_active' },
      }],
      lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
    },
    {
      id: 'widows-invitation', kind: 'forced_trigger', printedClause: 'fixture', markers: ['m50_structured_v1'], activation: { trigger: 'on_card_played' },
      conditions: [{ type: 'event_definition_is_self' }, { type: 'event_face_is', face: 'face_up' }], targets: [], cost: [], creates: [], ruleModifiers: [],
      effects: [{
        type: 'choose_each_player_option', candidateTarget: { scope: 'all_opponents' },
        candidateConditions: [{ type: 'can_effect_move_to_controller_location' }], skipIfNoCandidates: true,
        options: [
          { id: 'move', label: 'move', effects: [{ type: 'move_player', target: 'decision_player', to: 'controller_location', movementKind: 'effect' }] },
          { id: 'stay', label: 'stay', effects: [] },
        ],
      }],
      lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
    },
  ];
}

function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.fixture.kriemhild', name: 'fixture', class: 'Berserker',
    cards: [
      {
        id: WEDDING, name: 'Black Wedding', cardType: 'servant_skill', cardFace: { typeLabel: 'skill', attributes: ['特殊'], cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: weddingAbilities(),
      },
      {
        id: BALMUNG, name: 'physical Balmung identity only', cardType: 'servant_skill', cardFace: { typeLabel: 'skill', attributes: ['力量'], cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
    ],
  };
}

function setup(sourceZone: 'hand' | 'attack_area' = 'hand'): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.cards = [{
    instanceId: SOURCE, definitionId: WEDDING, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: sourceZone,
    visibility: sourceZone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'magic_workshop';
  state.players[3]!.locationId = 'miyama_town';
  for (const player of state.players) player.mana = 12;
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  if (sourceZone === 'attack_area') state.abilityRuntime!.cardState[SOURCE] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function choose(state: GameState, playerId: string, optionId: 'move' | 'stay') {
  const pending = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: pending.id, selectedIds: [optionId] });
}

function addBalmung(state: GameState, holder = 'p2', zone: 'skill' | 'attack_area' | 'hand' = 'skill'): void {
  state.cards.push({
    instanceId: BALMUNG_SOURCE, definitionId: BALMUNG, ownerPlayerId: holder, controllerPlayerId: holder, zone,
    visibility: zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: holder },
  });
  if (zone === 'attack_area') state.abilityRuntime!.cardState[BALMUNG_SOURCE] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
}

function battle(state: GameState, options: { preDefeatP1?: boolean } = {}) {
  state.round.activePhase = 'battle';
  if (options.preDefeatP1) {
    state.abilityRuntime!.pendingPreBattleDefeats = [{
      round: state.round.roundNumber, battlefieldId: 'miyama_town', controllerId: 'p2', sourceCardId: 'fixture-defeat-source', abilityId: 'fixture-defeat', targetPlayerIds: ['p1'],
    }];
  }
  return rules.resolveBattlefield(state, {
    battlefieldId: 'miyama_town',
    participants: [{ playerId: 'p1', totalPower: 1 }, { playerId: 'p2', totalPower: 6 }],
  }).nextState;
}

describe('P3 F4 M50-02 Kriemhild Black Wedding', () => {
  it('accepts only the exact conditional winner-inclusion and invitation envelopes', () => {
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);
    const widenedWinner = archive();
    widenedWinner.cards[0].abilities[0].ruleModifiers[0].scope.extra = true;
    expect(rules.loadAuthoringJson(widenedWinner).report.length).toBeGreaterThan(0);
    const widenedMove = archive();
    widenedMove.cards[0].abilities[1].effects[0].options[0].effects[0].movementKind = 'normal';
    expect(rules.loadAuthoringJson(widenedMove).report.length).toBeGreaterThan(0);
  });

  it('on a real face-up play asks movable opponents in seat order and applies stay/move only to each chooser', () => {
    const state = setup('hand');
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: SOURCE }).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p2', candidates: ['move', 'stay'] });
    expect(choose(state, 'p2', 'stay').ok).toBe(true);
    expect(state.players[1]!.locationId).toBe('shinto');
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p3', candidates: ['move', 'stay'] });
    const p3Mana = state.players[2]!.mana;
    expect(choose(state, 'p3', 'move').ok).toBe(true);
    expect(state.players[2]!.locationId).toBe('miyama_town');
    expect(state.players[2]!.mana).toBe(p3Mana);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.abilityRuntime!.pendingStructuredEachPlayerOption).toBeUndefined();
  });

  it('fails closed when an invited move becomes illegal before that player resolves move', () => {
    const state = setup('hand');
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: SOURCE }).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.controllerId).toBe('p2');
    const before = state.players[1]!.locationId;
    state.players[1]!.status = 'eliminated';
    const result = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: pending.id, selectedIds: ['move'] });
    expect(result.ok).toBe(false);
    expect(state.players[1]!.locationId).toBe(before);
  });

  it('adds the controller to the winner set only when another primary winner physically holds the referenced skill, and splits reward', () => {
    const state = setup('attack_area');
    addBalmung(state, 'p2', 'skill');
    const next = battle(state);
    const result = next.battleResults.at(-1)!;
    expect(result.winnerPlayerIds).toEqual(['p2', 'p1']);
    expect(result.baseVpPerWinner).toBe(Math.ceil((result.eventVpPool + result.competitionVpPool) / 2));

    const wrongZone = setup('attack_area'); addBalmung(wrongZone, 'p2', 'hand');
    expect(battle(wrongZone).battleResults.at(-1)!.winnerPlayerIds).toEqual(['p2']);

    const inactiveSource = setup('attack_area'); addBalmung(inactiveSource, 'p2', 'skill');
    inactiveSource.abilityRuntime!.cardState[SOURCE]!.active = false;
    expect(battle(inactiveSource).battleResults.at(-1)!.winnerPlayerIds).toEqual(['p2']);
  });

  it('rescues this combat from a staged Defeat only when the conditional shared victory actually applies', () => {
    const state = setup('attack_area'); addBalmung(state, 'p2', 'skill');
    const rescued = battle(state, { preDefeatP1: true });
    const result = rescued.battleResults.at(-1)!;
    expect(result.winnerPlayerIds).toContain('p1');
    expect(result.excludedPlayerIds ?? []).not.toContain('p1');
    expect(rescued.log).not.toContainEqual(expect.objectContaining({ type: 'prebattle_defeat_applied', payload: expect.objectContaining({ playerId: 'p1' }) }));

    const closed = setup('attack_area'); addBalmung(closed, 'p2', 'skill');
    closed.abilityRuntime!.cardState[SOURCE]!.active = false;
    const defeated = battle(closed, { preDefeatP1: true });
    expect(defeated.battleResults.at(-1)!.winnerPlayerIds).toEqual(['p2']);
    expect(defeated.battleResults.at(-1)!.excludedPlayerIds).toContain('p1');
  });
});
