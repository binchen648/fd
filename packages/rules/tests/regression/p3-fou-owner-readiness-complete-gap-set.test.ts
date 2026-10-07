import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'fixture.fou-readiness-owner';
const MARK = ROOT + '.skill.mark';
const RESCUE = ROOT + '.skill.rescue';
const TARGET = ROOT + '.skill.target';

const automatic = { mode: 'automatic', allowedOperations: [] as string[] };

function archive() {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'master_skill_card_archive',
    id: ROOT,
    name: 'Fixture Fou Readiness Owner',
    class: 'Master',
    publicInformation: { type: 'master_package', initialMana: 4 },
    cards: [
      {
        id: MARK,
        name: 'Permanent returned-skill tuning fixture',
        cardType: 'master_skill',
        owner: { type: 'master', id: ROOT },
        printedText: 'round-end permanent physical skill tuning',
        cardFace: { typeLabel: '被动', attributes: [], cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [{
          id: 'fixture.fou-readiness.mark',
          kind: 'forced_trigger',
          printedClause: 'mark one returned skill after a real Command Seal spend',
          activation: { trigger: 'round_end' },
          conditions: [{ type: 'controller_spent_command_seal_this_round' }],
          targets: [{
            id: 'returned_skill',
            type: 'card_instance',
            scope: { zone: 'skill', owner: 'controller', controller: 'self' },
            count: { min: 1, max: 1 },
            constraints: [{ type: 'returned_to_skill_this_round' }],
          }],
          effects: [{
            type: 'permanent_returned_skill_tuning',
            target: 'returned_skill',
            powerDelta: 1,
            costDelta: -1,
            minPrintedFraction: 0.5,
          }],
          cost: [],
          ruleModifiers: [],
          creates: [],
          lifecycle: {},
          responseWindow: {},
          limit: { type: 'per_round', uses: 1, scope: 'this_card' },
          visibility: {},
          execution: automatic,
        }],
        verification: { implementationStatus: 'complete' },
      },
      {
        id: RESCUE,
        name: 'Elimination rescue fixture',
        cardType: 'master_skill',
        owner: { type: 'master', id: ROOT },
        printedText: 'optional once-per-game elimination rescue / VP swap / shared victory',
        cardFace: { typeLabel: '升华技', attributes: [], cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [{
          id: 'fixture.fou-readiness.rescue',
          kind: 'passive',
          printedClause: 'rescue one imminent elimination',
          activation: { trigger: 'while_active' },
          conditions: [],
          targets: [],
          effects: [{
            type: 'once_per_game_elimination_rescue_shared_victory',
            preventElimination: true,
            swapVictoryPointsWithOpponent: true,
            shareVictory: true,
          }],
          cost: [],
          ruleModifiers: [],
          creates: [],
          lifecycle: {},
          responseWindow: {},
          limit: { type: 'per_game', uses: 1, scope: 'this_card' },
          visibility: {},
          execution: automatic,
        }],
        verification: { implementationStatus: 'complete' },
      },
      {
        id: TARGET,
        name: 'Physical skill target',
        cardType: 'master_skill',
        owner: { type: 'master', id: ROOT },
        printedText: 'cost five target',
        cardFace: { typeLabel: '魔术', attributes: ['魔术'], cost: 5, basePower: 2 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [],
        verification: { implementationStatus: 'complete' },
      },
    ],
  };
}

const loaded = rules.loadAuthoringJson(archive());

function setup(): GameState {
  for (const definition of Object.values(loaded.cards) as any[]) definition.ownerId = ROOT;
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.players[0]!.masterCardId = ROOT;
  state.players[0]!.mana = 12;
  state.players[0]!.vp = 2;
  state.players[1]!.vp = 7;
  state.players[2]!.vp = 1;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261008 });
  return state;
}

function add(state: GameState, definitionId: string, zone = 'skill'): string {
  const instanceId = 'fou-ready:' + definitionId.split('.').at(-1) + ':' + state.cards.length;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone,
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  state.abilityRuntime!.cardState[instanceId] = {
    active: zone === 'attack_area',
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return instanceId;
}

function markContext(sourceCardId: string, targetId: string) {
  return {
    controllerId: 'p1',
    sourceCardId,
    abilityId: 'fixture.fou-readiness.mark',
    variables: {},
    selections: { returned_skill: [targetId] },
  };
}

function eliminationBattle(targetPlayerId: string) {
  return {
    battlefieldId: 'miyama_town',
    winnerPlayerIds: ['p1'],
    winnerPlayerId: 'p1',
    tied: false,
    margin: 1,
    vpReward: 0,
    militaryAdjustments: [{ playerId: targetPlayerId, delta: -1 }],
    participantBreakdowns: [],
  } as any;
}

describe('P3 Fou owner readiness complete gap set', () => {
  it('accepts only the bounded identity-free semantic shapes and keeps production authority Fou-free', () => {
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    expect(rules.isAcceptedPermanentReturnedSkillTuningAbility(loaded.cards[MARK]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedEliminationRescueSharedVictoryAbility(loaded.cards[RESCUE]!.abilities[0]!)).toBe(true);

    const production = [
      'packages/rules/src/ability/permanent-skill-tuning-capability.ts',
      'packages/rules/src/ability/elimination-rescue-link-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/core/scoring-resolver.ts',
      'packages/rules/src/match-session.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n').toLowerCase();

    for (const needle of ['master.fou', '芙芙', '兽之印记', '苍天之力', 'core.fou-']) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });

  it('requires a real same-round Seal spend and exact physical skill return before applying a permanent mark', () => {
    const state = setup();
    state.round.roundNumber = 3;
    const source = add(state, MARK);
    const target = add(state, TARGET);
    const ability = loaded.cards[MARK]!.abilities[0]!;

    rules.recordSkillReturnedToSkillZone(state, target, 'attack_area');
    expect(rules.cardReturnedToSkillThisRound(state, target, 'p1')).toBe(true);
    expect(rules.applyPermanentReturnedSkillTuning(state, markContext(source, target), ability)).toBe(false);

    rules.markCommandSealSpent(state, 'p1', 3, 2, { sourceCardId: source, abilityId: ability.id });
    expect(rules.controllerSpentCommandSealThisRound(state, 'p1')).toBe(true);
    expect(rules.applyPermanentReturnedSkillTuning(state, markContext(source, target), ability)).toBe(true);
    expect(rules.calculateCardPower(state, target).value).toBe(3);
    expect(rules.effectiveCardPlayCost(state, 'p1', target)).toBe(4);

    state.round.roundNumber = 4;
    rules.markCommandSealSpent(state, 'p1', 2, 1, { sourceCardId: source, abilityId: ability.id });
    rules.recordSkillReturnedToSkillZone(state, target, 'attack_area');
    expect(rules.applyPermanentReturnedSkillTuning(state, markContext(source, target), ability)).toBe(true);
    expect(rules.calculateCardPower(state, target).value).toBe(4);
    expect(rules.effectiveCardPlayCost(state, 'p1', target)).toBe(3);

    state.round.roundNumber = 5;
    rules.markCommandSealSpent(state, 'p1', 1, 0, { sourceCardId: source, abilityId: ability.id });
    rules.recordSkillReturnedToSkillZone(state, target, 'attack_area');
    expect(rules.applyPermanentReturnedSkillTuning(state, markContext(source, target), ability)).toBe(true);
    expect(rules.calculateCardPower(state, target).value).toBe(5);
    expect(rules.effectiveCardPlayCost(state, 'p1', target)).toBe(3);
  });

  it('keeps permanent mark provenance restore-safe and rejects forged modifier pairs', () => {
    const state = setup();
    state.round.roundNumber = 3;
    const source = add(state, MARK);
    const target = add(state, TARGET);
    const ability = loaded.cards[MARK]!.abilities[0]!;

    rules.markCommandSealSpent(state, 'p1', 3, 2, { sourceCardId: source, abilityId: ability.id });
    rules.recordSkillReturnedToSkillZone(state, target, 'attack_area');
    expect(rules.applyPermanentReturnedSkillTuning(state, markContext(source, target), ability)).toBe(true);
    expect(rules.isPermanentSkillTuningRuntimeProvenanceValidForRestore(structuredClone(state))).toBe(true);

    const forged = structuredClone(state);
    forged.cards.find((card) => card.instanceId === target)!.costModifiers![0]!.value = -2;
    expect(rules.isPermanentSkillTuningRuntimeProvenanceValidForRestore(forged)).toBe(false);
  });

  it('opens rescue only in rounds 8/9/10, prevents the exact elimination, swaps VP once, and shares victory', () => {
    const state = setup();
    const source = add(state, RESCUE);
    state.players[1]!.militaryResult = -7;

    state.round.roundNumber = 7;
    expect(rules.stageEliminationRescueChoice(state, ['p2'])).toBe(false);

    state.round.roundNumber = 8;
    expect(rules.stageEliminationRescueChoice(state, ['p2'])).toBe(true);
    const decision = structuredClone(state.abilityRuntime!.pendingDecision!);
    expect(decision.candidates).toEqual(['p2']);
    expect(rules.resolveEliminationRescueDecision(state, decision, ['p2'])).toBe(true);
    expect(state.abilityRuntime!.eliminationRescueRecords).toHaveLength(1);
    expect(state.abilityRuntime!.sharedVictoryLinks).toHaveLength(1);

    state.battleResults = [eliminationBattle('p2')];
    const scored = rules.applyBattleScoring(state).nextState;
    expect(scored.players[1]!.status).toBe('active');

    const beforeController = scored.players[0]!.vp;
    const beforeTarget = scored.players[1]!.vp;
    const changes = rules.settleEliminationRescueAfterScoring(scored);
    expect(changes).toHaveLength(2);
    expect(scored.players[0]!.vp).toBe(beforeTarget);
    expect(scored.players[1]!.vp).toBe(beforeController);
    expect(rules.settleEliminationRescueAfterScoring(scored)).toEqual([]);

    const ranking = rules.expandSharedVictoryRanking(scored, [
      { playerId: 'p1', rank: 1 },
      { playerId: 'p2', rank: 2 },
      { playerId: 'p3', rank: 3 },
    ]);
    expect(ranking.find((entry) => entry.playerId === 'p2')?.rank).toBe(1);
    expect(rules.isEliminationRescueRuntimeProvenanceValidForRestore(structuredClone(scored))).toBe(true);

    const replay = structuredClone(scored);
    replay.abilityRuntime!.eliminationRescueRecords![0]!.vpSwapped = false;
    expect(rules.isEliminationRescueRuntimeProvenanceValidForRestore(replay)).toBe(false);
    expect(state.cards.find((card) => card.instanceId === source)).toBeDefined();
  });

  it('self-rescue creates no VP swap or shared-victory link and the physical source is once per game', () => {
    const state = setup();
    add(state, RESCUE);
    state.round.roundNumber = 9;
    state.players[0]!.militaryResult = -7;

    expect(rules.stageEliminationRescueChoice(state, ['p1'])).toBe(true);
    const decision = structuredClone(state.abilityRuntime!.pendingDecision!);
    expect(rules.resolveEliminationRescueDecision(state, decision, ['p1'])).toBe(true);
    expect(state.abilityRuntime!.sharedVictoryLinks ?? []).toEqual([]);

    state.battleResults = [eliminationBattle('p1')];
    const scored = rules.applyBattleScoring(state).nextState;
    expect(scored.players[0]!.status).toBe('active');
    expect(rules.settleEliminationRescueAfterScoring(scored)).toEqual([]);
    expect(rules.stageEliminationRescueChoice(scored, ['p2'])).toBe(false);
  });
});
