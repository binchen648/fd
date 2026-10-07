import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'fixture.injury-warp-owner';
const RULESET = ROOT + '.ruleset';
const DRAW = ROOT + '.draw';
const ACTION_DISCARD = ROOT + '.action-discard';
const PAIN = ROOT + '.pain';
const DISTORTION = ROOT + '.distortion';
const WARP = ROOT + '.warp';
const REPAIR_ACTION = 'fixture.injury-warp.repair.action';
const REPAIR_PREPARATION = 'fixture.injury-warp.repair.preparation';
const REPAIR_ADVANCE = 'fixture.injury-warp.repair.advance';
const REPAIR_COMBAT = 'fixture.injury-warp.repair.combat';
const ASCENSION = ROOT + '.ascension';
const BASIC = ROOT + '.basic';

const STATE_KEY = 'fixture-injury-state';
const INJURIES = ['head','shoulder','stomach','wrist','leg','spinal'];
const automatic = { mode: 'automatic', allowedOperations: [] as string[] };

function ability(id: string, kind: string, activation: Record<string, unknown>, effect: Record<string, unknown>) {
  return {
    id, kind, printedClause: id, activation,
    conditions: [], targets: [], effects: [effect], cost: [], ruleModifiers: [], creates: [],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: automatic,
  } as any;
}

function skill(id: string, abilities: any[], cost = 0) {
  return {
    id, name: id, cardType: 'master_skill',
    owner: { type: 'master', id: ROOT },
    printedText: id,
    cardFace: { typeLabel: 'fixture', attributes: [], cost, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities,
    verification: { implementationStatus: 'complete' },
  } as any;
}

function archive() {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'master_skill_card_archive',
    id: ROOT,
    name: 'Fixture Injury Warp Owner',
    class: 'Master',
    publicInformation: { type: 'master_package', initialMana: 4 },
    cards: [
      skill(RULESET, [ability(
        'fixture.injury-warp.ruleset',
        'passive',
        { trigger: 'while_active' },
        {
          type: 'injury_warp_ruleset',
          stateKey: STATE_KEY,
          injuryKeys: [...INJURIES],
          immediateRandomDiscardKey: 'head',
          recurringRandomDiscardKey: 'head',
          basicPowerPenaltyKey: 'shoulder',
          basicPowerDelta: -1,
          forbiddenTerrainKey: 'stomach',
          forbiddenTerrainValues: [2, 3],
          sealVpLossKey: 'wrist',
          vpLossPerSeal: 1,
          movementManaLossKey: 'leg',
          manaLossPerOwnTurnMove: 1,
          conversionKey: 'spinal',
          linkedAttackDefinitionId: DISTORTION,
          painSkillCostDelta: -1,
          painDiscardPerBattleEnd: 1,
          ascensionPainRewardVp: 4,
        },
      )]),
      skill(DRAW, [ability(
        'fixture.injury-warp.draw',
        'forced_trigger',
        { trigger: 'controller_combat_action_window' },
        {
          type: 'injury_warp_draw_choice',
          stateKey: STATE_KEY,
          allowedLocationIds: ['miyama_town', 'shinto'],
          drawCount: 2,
          chooseCount: 1,
        },
      )]),
      skill(ACTION_DISCARD, [ability(
        'fixture.injury-warp.action-discard',
        'forced_trigger',
        { trigger: 'controller_action_window' },
        { type: 'injury_warp_action_discard', stateKey: STATE_KEY },
      )]),
      skill(PAIN, [ability(
        'fixture.injury-warp.pain',
        'forced_trigger',
        { trigger: 'after_battle_ended' },
        { type: 'injury_warp_battle_end_pain', stateKey: STATE_KEY },
      )]),
      skill(DISTORTION, [ability(
        'fixture.injury-warp.distortion',
        'phase_action',
        { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
        {
          type: 'activate_movement_topology_override',
          stateKey: STATE_KEY,
          linkedOverrideDefinitionId: WARP,
          replacements: [
            { from: 'magic_workshop', to: 'shinto' },
            { from: 'shinto', to: 'miyama_town' },
            { from: 'miyama_town', to: 'recon' },
          ],
        },
      )]),
      skill(WARP, [
        ability(
          REPAIR_ACTION,
          'phase_action',
          { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
          { type: 'repair_movement_topology_override', stateKey: STATE_KEY },
        ),
        ability(
          REPAIR_PREPARATION,
          'phase_action',
          { phase: 'preparation', opens: 'controller_action_window', requiresSourceState: 'active' },
          { type: 'repair_movement_topology_override', stateKey: STATE_KEY },
        ),
        ability(
          REPAIR_ADVANCE,
          'phase_action',
          { phase: 'advance', opens: 'controller_action_window', requiresSourceState: 'active' },
          { type: 'repair_movement_topology_override', stateKey: STATE_KEY },
        ),
        ability(
          REPAIR_COMBAT,
          'phase_action',
          { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
          { type: 'repair_movement_topology_override', stateKey: STATE_KEY },
        ),
      ], 3),
      skill(ASCENSION, [ability(
        'fixture.injury-warp.ascension',
        'forced_trigger',
        { trigger: 'after_master_ascension_unlocked' },
        {
          type: 'ascension_copy_linked_skill',
          stateKey: STATE_KEY,
          linkedDefinitionId: DISTORTION,
          maxCopies: 2,
          destination: 'skill',
        },
      )]),
    ],
  } as any;
}

const loaded = rules.loadAuthoringJson(archive());
(loaded.cards as any)[BASIC] = {
  id: BASIC, name: BASIC, cardType: 'basic_attack',
  cardFace: { typeLabel: 'basic', attributes: ['力量'], cost: 0, basePower: 5 },
  playTiming: { phase: 'action', window: 'controller_play_card_window' },
  playRequirements: [], abilities: [], mode: 'automatic',
};

function setup(): GameState {
  for (const definition of Object.values(loaded.cards) as any[]) definition.ownerId = ROOT;
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.players[0]!.masterCardId = ROOT;
  state.players[0]!.locationId = 'miyama_town';
  state.players[0]!.mana = 12;
  state.players[0]!.vp = 8;
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'magic_workshop';
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261008 });
  return state;
}

function add(state: GameState, definitionId: string, zone = 'skill', active = false): string {
  const instanceId = 'injury-ready:' + definitionId.split('.').at(-1) + ':' + state.cards.length;
  state.cards.push({
    instanceId, definitionId,
    ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
    visibility: { scope: zone === 'attack_area' ? 'public' : 'owner_only', ...(zone === 'attack_area' ? {} : { ownerPlayerId: 'p1' }) } as any,
  });
  state.abilityRuntime!.cardState[instanceId] = {
    active, faceDown: false, playedRound: state.round.roundNumber,
  };
  return instanceId;
}

function ctx(sourceCardId: string, abilityId: string, event?: Record<string, unknown>) {
  return {
    controllerId: 'p1', sourceCardId, abilityId,
    variables: {}, selections: {},
    ...(event ? { event: { id: 'fixture-event', ...event } } : {}),
  } as any;
}

function abilityOf(definitionId: string) {
  return loaded.cards[definitionId]!.abilities[0]!;
}
function abilityById(definitionId: string, abilityId: string) {
  return loaded.cards[definitionId]!.abilities.find((entry) => entry.id === abilityId)!;
}

function initializeInjuryState(state: GameState) {
  const source = add(state, RULESET);
  expect(rules.resolveInjuryWarpEffect(state, ctx(source, abilityOf(RULESET).id), abilityOf(RULESET))).toBe(true);
  return state.abilityRuntime!.injuryWarpStates!['p1:' + STATE_KEY]!;
}

describe('P3 Fujino owner readiness complete gap set', () => {
  it('accepts only the bounded identity-free Injury/Warp shapes and keeps production authority identity-free', () => {
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    for (const id of [RULESET, DRAW, ACTION_DISCARD, PAIN, DISTORTION, WARP, ASCENSION]) {
      expect(rules.isAcceptedInjuryWarpAbility(abilityOf(id))).toBe(true);
    }
    for (const repair of loaded.cards[WARP]!.abilities) {
      expect(rules.isAcceptedInjuryWarpAbility(repair)).toBe(true);
      expect(rules.isAcceptedInjuryWarpRepairAbility(repair)).toBe(true);
    }

    const production = [
      'packages/rules/src/ability/injury-warp-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/core/movement.ts',
      'packages/rules/src/match-session.ts',
      'packages/rules/src/ability/permanent-skill-tuning-capability.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n').toLowerCase();

    for (const needle of ['master.fujino', '浅上藤乃', '痛觉残留', '无痛症', '扭曲空间', '歪曲之魔眼', '创伤', 'core.fujino-']) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });

  it('stages a private two-injury choice, applies the selected injury, and rejects forged pending provenance', () => {
    const state = setup();
    const iw = initializeInjuryState(state);
    const drawSource = add(state, DRAW);
    const hand = add(state, BASIC, 'hand');
    iw.deck = ['head', 'shoulder'];

    expect(rules.resolveInjuryWarpEffect(state, ctx(drawSource, abilityOf(DRAW).id), abilityOf(DRAW))).toBe(true);
    // Direct resolver invocation bypasses dispatchAbilityCommand's transaction commit.
    // Advance the revision exactly once to model the committed interaction state.
    state.abilityRuntime!.revision++;
    const pending = structuredClone(state.abilityRuntime!.pendingDecision!);
    expect(new Set(pending.candidates)).toEqual(new Set(['head', 'shoulder']));
    expect(rules.isInjuryWarpPendingDecisionLiveValid(state, pending)).toBe(true);

    const forged = structuredClone(state);
    (forged.abilityRuntime!.pendingDecision!.interaction as any).candidateInjuryKeys[0] = 'forged';
    expect(rules.isInjuryWarpRuntimeProvenanceValidForRestore(forged)).toBe(false);

    expect(rules.resolveInjuryWarpDecision(state, pending, ['head'])).toBe(true);
    expect(state.cards.find((card) => card.instanceId === hand)!.zone).toBe('discard');
    expect(iw.activeInjuries).toEqual(['head']);
    expect(iw.deck).toEqual(['shoulder']);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });

  it('applies shoulder, stomach, wrist, leg and recurring-head consequences through generic runtime hooks', () => {
    const state = setup();
    const iw = initializeInjuryState(state);
    const basic = add(state, BASIC, 'attack_area', true);
    const actionSource = add(state, ACTION_DISCARD);
    const hand = add(state, BASIC, 'hand');
    iw.deck = ['spinal'];
    iw.activeInjuries = ['head', 'shoulder', 'stomach', 'wrist', 'leg'];

    expect(rules.calculateCardPower(state, basic).value).toBe(4);
    expect(rules.injuryWarpForbiddenDeploymentTerrainValues(state, 'p1')).toEqual([2, 3]);

    const vpBefore = state.players[0]!.vp;
    rules.markCommandSealSpent(state, 'p1', 3, 2, { sourceCardId: actionSource, abilityId: abilityOf(ACTION_DISCARD).id });
    expect(state.players[0]!.vp).toBe(vpBefore - 1);

    const manaBefore = state.players[0]!.mana;
    expect(rules.settleInjuryWarpMovementPenalty(state, 'p1')).toBe(1);
    expect(state.players[0]!.mana).toBe(manaBefore - 1);

    expect(rules.resolveInjuryWarpEffect(state, ctx(actionSource, abilityOf(ACTION_DISCARD).id), abilityOf(ACTION_DISCARD))).toBe(true);
    expect(state.cards.find((card) => card.instanceId === hand)!.zone).toBe('discard');

    state.round.prioritySeat = state.players[1]!.seat;
    const noOwnTurnLoss = state.players[0]!.mana;
    expect(rules.settleInjuryWarpMovementPenalty(state, 'p1')).toBe(0);
    expect(state.players[0]!.mana).toBe(noOwnTurnLoss);
  });

  it('converts spinal injury to pain, reduces skill cost, grants the ascension copy, and awards 4 VP exactly once when pain clears', () => {
    const state = setup();
    const iw = initializeInjuryState(state);
    const drawSource = add(state, DRAW);
    const distortion = add(state, DISTORTION);
    const warp = add(state, WARP);
    const ascension = add(state, ASCENSION);
    const pain = add(state, PAIN);
    iw.activeInjuries = ['shoulder'];
    iw.deck = ['spinal'];

    expect(rules.resolveInjuryWarpEffect(state, ctx(drawSource, abilityOf(DRAW).id), abilityOf(DRAW))).toBe(true);
    expect(iw.spinalOccurred).toBe(true);
    expect(iw.painCount).toBe(2);
    expect(iw.activeInjuries).toEqual([]);
    expect(iw.deck).toEqual([]);
    expect(state.cards.find((card) => card.instanceId === distortion)!.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[distortion]!.active).toBe(true);
    expect(rules.effectiveCardPlayCost(state, 'p1', warp)).toBe(2);

    expect(rules.resolveInjuryWarpEffect(
      state,
      ctx(ascension, abilityOf(ASCENSION).id, { type: 'after_master_ascension_unlocked', playerId: 'p1' }),
      abilityOf(ASCENSION),
    )).toBe(true);
    expect(iw.ascensionUnlocked).toBe(true);
    expect(state.cards.filter((card) => card.definitionId === DISTORTION)).toHaveLength(2);

    const before = state.players[0]!.vp;
    expect(rules.resolveInjuryWarpEffect(state, ctx(pain, abilityOf(PAIN).id), abilityOf(PAIN))).toBe(true);
    expect(iw.painCount).toBe(1);
    expect(state.players[0]!.vp).toBe(before);
    expect(rules.resolveInjuryWarpEffect(state, ctx(pain, abilityOf(PAIN).id), abilityOf(PAIN))).toBe(true);
    expect(iw.painCount).toBe(0);
    expect(iw.rewardGranted).toBe(true);
    expect(state.players[0]!.vp).toBe(before + 4);
    expect(rules.resolveInjuryWarpEffect(state, ctx(pain, abilityOf(PAIN).id), abilityOf(PAIN))).toBe(false);
    expect(state.players[0]!.vp).toBe(before + 4);
  });

  it('activates and repairs the movement topology override and the normal movement reducer consumes the overridden graph', () => {
    const state = setup();
    initializeInjuryState(state);
    const distortion = add(state, DISTORTION, 'attack_area', true);
    const warp = add(state, WARP);
    state.players[0]!.locationId = 'miyama_town';
    state.players[1]!.locationId = 'shinto';
    state.players[2]!.locationId = 'magic_workshop';
    state.players[0]!.mana = 10;

    expect(rules.resolveInjuryWarpEffect(state, ctx(distortion, abilityOf(DISTORTION).id), abilityOf(DISTORTION))).toBe(true);
    expect(rules.effectiveInjuryWarpMovementLinks(state, 'miyama_town', ['shinto'] as const)).toEqual(['recon']);
    expect(state.abilityRuntime!.cardState[warp]!.active).toBe(true);

    const moved = rules.movePlayer(state, { playerId: 'p1', to: 'recon', movementKind: 'normal' });
    expect(moved.moved).toBe(true);
    expect(moved.manaSpent).toBe(1);
    expect(moved.nextState.players[0]!.locationId).toBe('recon');

    expect(rules.resolveInjuryWarpEffect(state, ctx(warp, abilityOf(WARP).id), abilityOf(WARP))).toBe(true);
    expect(rules.effectiveInjuryWarpMovementLinks(state, 'miyama_town', ['shinto'] as const)).toEqual(['shinto']);
    expect(state.abilityRuntime!.cardState[warp]!.active).toBe(false);
  });

  it('exposes Repair in preparation, advance, action and combat even when another player has priority', () => {
    const cases = [
      ['preparation', REPAIR_PREPARATION],
      ['advance', REPAIR_ADVANCE],
      ['action', REPAIR_ACTION],
      ['battle', REPAIR_COMBAT],
    ] as const;

    for (const [phase, repairAbilityId] of cases) {
      const state = setup();
      initializeInjuryState(state);
      const distortion = add(state, DISTORTION, 'attack_area', true);
      const warp = add(state, WARP);
      expect(rules.resolveInjuryWarpEffect(state, ctx(distortion, abilityOf(DISTORTION).id), abilityOf(DISTORTION))).toBe(true);
      expect(state.abilityRuntime!.cardState[warp]!.active).toBe(true);

      state.round.activePhase = phase;
      state.round.prioritySeat = state.players[1]!.seat;
      const repair = abilityById(WARP, repairAbilityId);
      expect(rules.isAcceptedInjuryWarpRepairAbility(repair)).toBe(true);
      expect(rules.getLegalActions(state, 'p1')).toContainEqual({
        type: 'activate_ability',
        cardInstanceId: warp,
        abilityId: repairAbilityId,
      });

      const result = rules.dispatchAbilityCommand(state, 'p1', {
        type: 'activate_ability',
        cardInstanceId: warp,
        abilityId: repairAbilityId,
      });
      expect(result.ok).toBe(true);
      expect(state.abilityRuntime!.cardState[warp]!.active).toBe(false);
      expect(rules.effectiveInjuryWarpMovementLinks(state, 'miyama_town', ['shinto'] as const)).toEqual(['shinto']);
    }
  });

  it('makes stomach terrain restrictions affect MatchSession deployment legality rather than only exposing a helper', () => {
    const state = setup();
    const iw = initializeInjuryState(state);
    iw.activeInjuries = ['stomach'];
    iw.deck = INJURIES.filter((key) => key !== 'stomach');
    state.players[0]!.locationId = undefined;
    state.players[1]!.locationId = 'shinto';
    state.players[2]!.locationId = 'magic_workshop';
    state.round.activePhase = 'advance';
    state.round.prioritySeat = state.players[0]!.seat;
    const miyama = state.map.locations.find((location) => location.id === 'miyama_town')!;
    (miyama as any).terrainBonuses = [3];

    const session = new rules.MatchSession({
      humanPlayerId: 'p1',
      humanPlayerIds: ['p1','p2','p3'],
      restorePackKind: 'trusted_authoring_fixture',
    }, false);
    session.state = state;
    const locations = session.legalDeploymentActions('p1')
      .filter((action): action is any => action.type === 'deploy_player')
      .map((action: any) => action.locationId);
    expect(locations).not.toContain('miyama_town');
  });

  it('keeps runtime restore provenance fail-closed for provider, pain and topology state', () => {
    const state = setup();
    const iw = initializeInjuryState(state);
    const distortion = add(state, DISTORTION, 'attack_area', true);
    add(state, WARP);
    expect(rules.resolveInjuryWarpEffect(state, ctx(distortion, abilityOf(DISTORTION).id), abilityOf(DISTORTION))).toBe(true);
    expect(rules.isInjuryWarpRuntimeProvenanceValidForRestore(state)).toBe(true);

    const forgedProvider = structuredClone(state);
    forgedProvider.abilityRuntime!.injuryWarpStates!['p1:' + STATE_KEY]!.providerSourceCardId = 'forged';
    expect(rules.isInjuryWarpRuntimeProvenanceValidForRestore(forgedProvider)).toBe(false);

    const forgedPain = structuredClone(state);
    forgedPain.abilityRuntime!.injuryWarpStates!['p1:' + STATE_KEY]!.painCount = 2;
    expect(rules.isInjuryWarpRuntimeProvenanceValidForRestore(forgedPain)).toBe(false);

    const spinalState = setup();
    const spinalIw = initializeInjuryState(spinalState);
    const spinalDraw = add(spinalState, DRAW);
    add(spinalState, DISTORTION);
    spinalIw.activeInjuries = ['head', 'shoulder', 'stomach', 'wrist', 'leg'];
    spinalIw.deck = ['spinal'];
    expect(rules.resolveInjuryWarpEffect(spinalState, ctx(spinalDraw, abilityOf(DRAW).id), abilityOf(DRAW))).toBe(true);
    expect(spinalIw.spinalOccurred).toBe(true);
    expect(spinalIw.painCount).toBe(INJURIES.length);
    expect(rules.isInjuryWarpRuntimeProvenanceValidForRestore(spinalState)).toBe(true);
    const forgedPostSpinalPain = structuredClone(spinalState);
    forgedPostSpinalPain.abilityRuntime!.injuryWarpStates!['p1:' + STATE_KEY]!.painCount = 999;
    expect(rules.isInjuryWarpRuntimeProvenanceValidForRestore(forgedPostSpinalPain)).toBe(false);

    const forgedTopology = structuredClone(state);
    forgedTopology.abilityRuntime!.injuryWarpStates!['p1:' + STATE_KEY]!.movementOverride!.replacements.miyama_town = 'magic_workshop';
    expect(rules.isInjuryWarpRuntimeProvenanceValidForRestore(forgedTopology)).toBe(false);

    const wrong = structuredClone(archive());
    const ruleset = wrong.cards.find((card: any) => card.id === RULESET)!.abilities[0];
    ruleset.effects[0].vpLossPerSeal = 2;
    const rejected = rules.loadAuthoringJson(wrong);
    expect(rejected.report.some((entry) => entry.status === 'unsupported' && entry.path === 'injuryWarp.gateway')).toBe(true);
  });
});
