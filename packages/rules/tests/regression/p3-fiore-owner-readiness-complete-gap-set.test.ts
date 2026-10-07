import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'fixture.fiore-profile-owner';
const BASE = 'fixture.fiore-profile-owner.skill.base';
const TRANSCEND = 'fixture.fiore-profile-owner.skill.transcend';
const PARALYSIS = 'fixture.fiore-profile-owner.skill.paralysis';
const CIRCUIT = 'fixture.fiore-profile-owner.skill.circuit';
const GENTLE = 'fixture.fiore-profile-owner.skill.gentle';
const NEURO = 'fixture.fiore-profile-owner.skill.neuro';
const DETERMINATION = 'fixture.fiore-profile-owner.skill.determination';
const CLEVER = 'fixture.fiore-profile-owner.skill.clever';
const ASC = 'fixture.fiore-profile-owner.skill.ascension';
const SERVANT_PROBE = 'fixture.fiore-profile-owner.servant-skill';
const BASIC = 'fixture.fiore-profile-owner.basic';

const std = {
  conditions: [],
  targets: [],
  cost: [],
  ruleModifiers: [],
  creates: [],
  lifecycle: {},
  responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
  limit: {},
  visibility: {},
  execution: { mode: 'automatic', allowedOperations: [] },
};

function appendOnly(id: string) {
  return {
    id,
    kind: 'passive',
    printedClause: '此牌需追加打出。',
    activation: { trigger: 'while_active' },
    conditions: [],
    targets: [],
    effects: [{ type: 'append_only_rule' }],
    cost: [],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function switchAbility(
  id: string,
  phase: 'advance' | 'action',
  profileKey: 'paralysis' | 'gentle' | 'circuit',
  enhancedDefinitionId: string,
  suppress: 'movement_lock' | 'gentle_penalties' | 'round_mana_cap',
  extra: Record<string, unknown> = {},
) {
  const targetRequired = profileKey === 'gentle';
  return {
    id,
    kind: 'phase_action',
    printedClause: id,
    activation: {
      phase,
      opens: 'controller_action_window',
    },
    conditions: [],
    targets: targetRequired ? [{
      id: 'higher_target',
      type: 'player',
      count: { min: 1, max: 1 },
      constraints: [
        { type: 'not_controller' },
        { type: 'victory_points_greater_than_controller' },
      ],
    }] : [],
    effects: [{
      type: rules.SWITCH_ROUND_SKILL_PROFILE_EFFECT,
      stateKey: 'fiore',
      profileKey,
      enhancedDefinitionId,
      suppress,
      mode: phase,
      ...(targetRequired ? { target: 'higher_target', requireHigherVictoryPointTarget: true } : {}),
      ...extra,
    }],
    cost: [],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
    limit: {},
    visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function ascensionSwitch(
  id: string,
  profileKey: 'paralysis' | 'gentle' | 'circuit',
  enhancedDefinitionId: string,
  suppress: 'movement_lock' | 'gentle_penalties' | 'round_mana_cap',
) {
  const targetRequired = profileKey === 'gentle';
  return {
    id,
    kind: 'phase_action',
    printedClause: id,
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [],
    targets: targetRequired ? [{
      id: 'higher_target',
      type: 'player',
      count: { min: 1, max: 1 },
      constraints: [
        { type: 'not_controller' },
        { type: 'victory_points_greater_than_controller' },
      ],
    }] : [],
    effects: [{
      type: rules.SWITCH_ROUND_SKILL_PROFILE_EFFECT,
      stateKey: 'fiore',
      profileKey,
      enhancedDefinitionId,
      suppress,
      mode: 'ascension',
      onBattleLossVictoryPointLoss: 2,
      ...(targetRequired ? { target: 'higher_target', requireHigherVictoryPointTarget: true } : {}),
    }],
    cost: [],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
    limit: {},
    visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function card(id: string, name: string, abilities: any[], options: {
  cardType?: string;
  attributes?: string[];
  cost?: number;
  basePower?: number;
  initialPlacement?: string;
} = {}) {
  return {
    id,
    name,
    cardType: options.cardType ?? 'master_skill',
    ...(options.initialPlacement ? { initialPlacement: options.initialPlacement } : {}),
    owner: { type: 'master', id: ROOT },
    printedText: name,
    cardFace: {
      typeLabel: options.attributes?.[0] ?? '被动',
      attributes: options.attributes ?? [],
      cost: options.cost ?? 0,
      basePower: options.basePower ?? 0,
    },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: options.cost && options.cost > 0 ? [{ type: 'skill_zone_mana_at_least', value: options.cost }] : [],
    abilities,
    verification: { implementationStatus: 'complete' },
  };
}

function archive() {
  const switchAbilities = [
    switchAbility('fixture.transcend.advance.paralysis', 'advance', 'paralysis', NEURO, 'movement_lock'),
    switchAbility('fixture.transcend.advance.gentle', 'advance', 'gentle', DETERMINATION, 'gentle_penalties'),
    switchAbility('fixture.transcend.advance.circuit', 'advance', 'circuit', CLEVER, 'round_mana_cap'),
    switchAbility('fixture.transcend.action.paralysis', 'action', 'paralysis', NEURO, 'movement_lock', { afterBattleManaLoss: 4 }),
    switchAbility('fixture.transcend.action.gentle', 'action', 'gentle', DETERMINATION, 'gentle_penalties', { afterBattleManaLoss: 4 }),
    switchAbility('fixture.transcend.action.circuit', 'action', 'circuit', CLEVER, 'round_mana_cap', { afterBattleManaLoss: 4 }),
  ];

  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'master_skill_card_archive',
    id: ROOT,
    name: 'Fixture Fiore Profile Owner',
    class: 'Master',
    publicInformation: { type: 'master_package', initialMana: 4 },
    cards: [
      card(BASE, 'Base provisioning', [{
        id: 'fixture.base.provision',
        kind: 'forced_trigger',
        printedClause: 'provision',
        activation: { trigger: 'game_start' },
        conditions: [],
        targets: [],
        effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: [PARALYSIS, CIRCUIT, GENTLE] }],
        cost: [],
        ruleModifiers: [],
        creates: [],
        lifecycle: {},
        responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
        limit: {},
        visibility: {},
        execution: { mode: 'automatic', allowedOperations: [] },
      }]),
      card(TRANSCEND, 'Transcend', switchAbilities),
      card(PARALYSIS, 'Paralysis', []),
      card(CIRCUIT, 'Circuit', []),
      card(GENTLE, 'Gentle', []),
      card(NEURO, 'Neuromechanics', [
        appendOnly('fixture.neuro.append-only'),
        {
          id: 'fixture.neuro.move',
          kind: 'phase_action',
          printedClause: 'pay 1 mana and move one arrow',
          activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
          conditions: [],
          targets: [{
            id: 'destination',
            type: 'location',
            count: { min: 1, max: 1 },
            constraints: [{ type: 'reachable_along_arrows', maxSteps: 1 }],
          }],
          effects: [{ type: 'move_player', player: 'controller', to: 'destination' }],
          cost: [{ type: 'pay_mana', amount: 1 }],
          ruleModifiers: [],
          creates: [],
          lifecycle: {},
          responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
          limit: {},
          visibility: {},
          execution: { mode: 'automatic', allowedOperations: [] },
        },
        {
          id: 'fixture.neuro.terrain',
          kind: 'phase_action',
          printedClause: 'gain 2 terrain',
          activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
          conditions: [],
          targets: [],
          effects: [{
            type: rules.ROUND_CURRENT_LOCATION_TERRAIN_BONUS_EFFECT,
            stateKey: 'fiore-neuro',
            amount: 2,
            requireBattlefield: true,
            requireNoAssignedTerrain: true,
          }],
          cost: [],
          ruleModifiers: [],
          creates: [],
          lifecycle: {},
          responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
          limit: {},
          visibility: {},
          execution: { mode: 'automatic', allowedOperations: [] },
        },
      ], { attributes: ['力量', '特殊'], cost: 1, basePower: 3 }),
      card(DETERMINATION, 'Determination', [{
        id: 'fixture.determination.reward',
        kind: 'passive',
        printedClause: 'reward if target defeated',
        activation: {},
        conditions: [],
        targets: [],
        effects: [{
          type: rules.ROUND_PROFILE_DETERMINATION_REWARD_EFFECT,
          stateKey: 'fiore',
          profileKey: 'gentle',
          amount: 2,
        }],
        cost: [],
        ruleModifiers: [],
        creates: [],
        lifecycle: {},
        responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
        limit: {},
        visibility: {},
        execution: { mode: 'automatic', allowedOperations: [] },
      }]),
      card(CLEVER, 'Clever Mind', [
        appendOnly('fixture.clever.append-only'),
        {
          id: 'fixture.clever.link',
          kind: 'phase_action',
          printedClause: 'pay 1 mana, skills gain +1',
          activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
          conditions: [],
          targets: [],
          effects: [{
            type: rules.ROUND_SKILL_CARD_POWER_BONUS_EFFECT,
            stateKey: 'fiore-clever',
            amount: 1,
            duration: 'this_round',
            cardTypes: ['master_skill', 'servant_skill'],
          }],
          cost: [{ type: 'pay_mana', amount: 1 }],
          ruleModifiers: [],
          creates: [],
          lifecycle: {},
          responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
          limit: {},
          visibility: {},
          execution: { mode: 'automatic', allowedOperations: [] },
        },
      ], { attributes: ['魔术'], cost: 0, basePower: 1 }),
      card(ASC, 'Full Recovery', [
        ascensionSwitch('fixture.asc.paralysis', 'paralysis', NEURO, 'movement_lock'),
        ascensionSwitch('fixture.asc.gentle', 'gentle', DETERMINATION, 'gentle_penalties'),
        ascensionSwitch('fixture.asc.circuit', 'circuit', CLEVER, 'round_mana_cap'),
      ]),
      card(SERVANT_PROBE, 'Servant Probe', [], { cardType: 'servant_skill', attributes: ['力量'], basePower: 2 }),
      card(BASIC, 'Basic', [], { cardType: 'basic_attack', attributes: ['力量'], basePower: 1 }),
    ],
    sources: [],
  } as any;
}

function setup(activeSeats = [1, 2, 3]): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  for (const definition of Object.values(pack.cards) as any[]) definition.ownerId = ROOT;
  const state = createSeededGameState({ activeSeats });
  state.cards = [];
  state.players[0]!.masterCardId = ROOT;
  state.players[0]!.locationId = 'miyama_town';
  state.players[0]!.mana = 12;
  state.players[0]!.vp = 2;
  state.players[1]!.locationId = 'miyama_town';
  state.players[1]!.vp = 5;
  if (state.players[2]) {
    state.players[2]!.locationId = 'shinto';
    state.players[2]!.vp = 1;
  }
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20261007 });
  return state;
}

function add(state: GameState, definitionId: string, zone: string = 'skill', active = false, owner = 'p1'): string {
  const instanceId = `fiore:${definitionId.split('.').at(-1)}:${state.cards.length}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: owner,
    controllerPlayerId: owner,
    zone,
    visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

function action(state: GameState, cardInstanceId: string, abilityId: string) {
  return rules.getLegalActions(state, 'p1').find((entry) =>
    entry.type === 'activate_ability' && entry.cardInstanceId === cardInstanceId && entry.abilityId === abilityId);
}

function choose(state: GameState, selectedIds: string[]) {
  const d = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds });
}

function generated(state: GameState, definitionId: string): string {
  return state.cards.find((entry) => entry.definitionId === definitionId && entry.ownerPlayerId === 'p1')!.instanceId;
}

function installFiorePersistentDrawbacks(state: GameState) {
  state.ruleOverrides = {
    ...state.ruleOverrides,
    movementLockedOwnActionCombatPlayerIds: ['p1'],
    roundTotalManaGainCapByPlayer: { p1: { regular: 2, climax: 4 } },
    lowerVpBattleTotalPowerAdjustmentByPlayer: { p1: -2 },
    masterSkillPowerLockIfSituationForbidsByPlayer: { p1: { attribute: '宝具', value: 0 } },
  };
}

describe('P3 Fiore owner readiness complete gap set', () => {
  it('preserves the accepted 3/9 FM08 authoring and proves exact privileged gateways', () => {
    const current = JSON.parse(readFileSync('data/authoring/masters/master.fiore.json', 'utf8'));
    expect(current.cards.map((entry: any) => entry.id)).toEqual([
      'master.fiore.skill.s2',
      'master.fiore.skill.s3',
      'master.fiore.skill.s4',
    ]);
    const pack = rules.loadAuthoringJson(archive());
    expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);

    const exact = pack.cards[TRANSCEND]!.abilities[0]!;
    expect(rules.isAcceptedRoundSkillProfileAbility(exact)).toBe(true);
    const malformed = structuredClone(exact);
    (malformed.effects[0] as any).suppress = 'forged';
    expect(rules.containsRoundSkillProfilePrivilegedNode(malformed)).toBe(true);
    expect(rules.isAcceptedRoundSkillProfileAbility(malformed)).toBe(false);
  });

  it('uses the existing game-start provisioning seam for the three preserved baseline skills', () => {
    const state = setup();
    const base = add(state, BASE);
    rules.processAbilityEvent(state, { id: 'fiore-game-start', type: 'game_start' });
    for (const id of [PARALYSIS, CIRCUIT, GENTLE]) {
      expect(state.cards.filter((entry) => entry.definitionId === id)).toHaveLength(1);
      expect(state.cards.find((entry) => entry.definitionId === id)).toMatchObject({ zone: 'skill', generatedBy: base });
    }
  });

  it('switches Paralysis in advance, suppresses movement lock, enforces one switch per mode/pair and cleans at round end', () => {
    const state = setup();
    installFiorePersistentDrawbacks(state);
    const source = add(state, TRANSCEND);
    state.round.activePhase = 'action';
    expect(rules.movementLockedByPersistentRule(state, 'p1')).toBe(true);
    state.round.activePhase = 'advance';

    const first = action(state, source, 'fixture.transcend.advance.paralysis');
    expect(first).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', first!).ok).toBe(true);
    expect(rules.roundSkillProfileSuppressed(state, 'p1', 'movement_lock')).toBe(true);
    expect(state.cards.find((entry) => entry.definitionId === NEURO)).toMatchObject({ zone: 'skill', generatedBy: source });

    expect(action(state, source, 'fixture.transcend.advance.paralysis')).toBeUndefined();
    expect(action(state, source, 'fixture.transcend.advance.circuit')).toBeUndefined();

    state.round.activePhase = 'action';
    expect(rules.movementLockedByPersistentRule(state, 'p1')).toBe(false);
    const restored = structuredClone(state);
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(restored)).toBe(true);

    rules.processAbilityEvent(state, { id: 'fiore-round-end-1', type: 'round_end' });
    expect(state.cards.some((entry) => entry.definitionId === NEURO)).toBe(false);
    state.round.roundNumber += 1;
    expect(rules.roundSkillProfileSuppressed(state, 'p1', 'movement_lock')).toBe(false);
    expect(rules.movementLockedByPersistentRule(state, 'p1')).toBe(true);
  });

  it('switches Circuit and removes only the current-round mana-gain cap', () => {
    const state = setup();
    installFiorePersistentDrawbacks(state);
    const source = add(state, TRANSCEND);
    state.round.activePhase = 'advance';
    const first = action(state, source, 'fixture.transcend.advance.circuit');
    expect(first).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', first!).ok).toBe(true);

    state.players[0]!.mana = 0;
    expect(rules.grantMana(state, 'p1', 5, { source: 'generic' }).actualAmount).toBe(5);

    rules.processAbilityEvent(state, { id: 'fiore-round-end-circuit', type: 'round_end' });
    state.round.roundNumber += 1;
    rules.resetManaGainLedgerForRound(state, state.round.roundNumber);
    state.players[0]!.mana = 0;
    expect(rules.grantMana(state, 'p1', 5, { source: 'generic' }).actualAmount).toBe(2);
  });

  it('switches Gentle only against a higher-VP opponent, suppresses both accepted penalties and rewards exact victory once', () => {
    const state = setup([1, 2, 3]);
    installFiorePersistentDrawbacks(state);
    const source = add(state, TRANSCEND);
    const powerProbe = add(state, CLEVER, 'attack_area', true);
    (state as any).modeState = { cardPlayForbids: [{ sourceType: 'situation', attribute: '宝具' }] };
    state.abilityRuntime!.pack.cards[CLEVER]!.cardFace.attributes = ['宝具'];
    state.abilityRuntime!.pack.cards[CLEVER]!.cardFace.basePower = 7;

    expect(rules.calculateCardPower(state, powerProbe).value).toBe(0);
    state.round.activePhase = 'advance';
    const activate = action(state, source, 'fixture.transcend.advance.gentle');
    expect(activate).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', activate!).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision?.candidates).toEqual(['p2']);
    expect(choose(state, ['p2']).ok).toBe(true);
    expect(rules.roundSkillProfileSuppressed(state, 'p1', 'gentle_penalties')).toBe(true);
    expect(rules.calculateCardPower(state, powerProbe).value).toBe(7);

    const vp = state.players[0]!.vp;
    rules.processAbilityEvent(state, {
      id: 'fiore-gentle-win',
      type: 'after_battle_result_determined',
      playerId: 'p1',
      battlefieldId: 'miyama_town',
      resultId: 'fiore-gentle-result',
      battlePhaseResolutionId: 'fiore-gentle-phase',
      battleParticipantIds: ['p1', 'p2'],
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    } as any);
    expect(state.players[0]!.vp).toBe(vp + 2);
    rules.processAbilityEvent(state, {
      id: 'fiore-gentle-win-replay-different-event',
      type: 'after_battle_result_determined',
      playerId: 'p1',
      battlefieldId: 'miyama_town',
      resultId: 'fiore-gentle-result-2',
      battlePhaseResolutionId: 'fiore-gentle-phase-2',
      battleParticipantIds: ['p1', 'p2'],
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    } as any);
    expect(state.players[0]!.vp).toBe(vp + 2);
  });

  it('plays generated Neuromechanics as required-additional, moves one arrow for 1 mana, and gains +2 current-location terrain', () => {
    const state = setup([1, 2]);
    const source = add(state, TRANSCEND);
    const basic = add(state, BASIC, 'hand');
    state.round.activePhase = 'advance';
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state, source, 'fixture.transcend.advance.paralysis')!).ok).toBe(true);
    const neuro = generated(state, NEURO);

    state.round.activePhase = 'action';
    expect(() => rules.playAbilityCardBatch(state, 'p1', [
      { cardInstanceId: basic },
      { cardInstanceId: neuro },
    ])).not.toThrow();
    expect(state.abilityRuntime!.cardState[neuro]!.active).toBe(true);

    state.players[0]!.locationId = 'recon';
    state.map.locations.find((entry) => entry.id === 'recon')!.movementLinks = ['magic_workshop'];
    const mana = state.players[0]!.mana;
    const move = action(state, neuro, 'fixture.neuro.move');
    expect(move).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', move!).ok).toBe(true);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toContain('magic_workshop');
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['magic_workshop'] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(mana - 1);
    expect(state.players[0]!.locationId).toBe('magic_workshop');

    state.players[0]!.locationId = 'miyama_town';
    (state as any).modeState = {};
    const terrain = action(state, neuro, 'fixture.neuro.terrain');
    expect(terrain).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', terrain!).ok).toBe(true);
    expect(rules.roundCurrentLocationTerrainBonus(state, 'p1', 'miyama_town')).toBe(2);
    expect(rules.currentDeploymentBonus(state, 'p1')).toBe(2);
  });

  it('plays generated Clever Mind and applies cumulative +1 to Master and Servant skill power for the round', () => {
    const state = setup([1, 2]);
    const source = add(state, TRANSCEND);
    const basic = add(state, BASIC, 'hand');
    state.round.activePhase = 'advance';
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state, source, 'fixture.transcend.advance.circuit')!).ok).toBe(true);
    const clever = generated(state, CLEVER);

    state.round.activePhase = 'action';
    expect(() => rules.playAbilityCardBatch(state, 'p1', [
      { cardInstanceId: basic },
      { cardInstanceId: clever },
    ])).not.toThrow();

    const servant = add(state, SERVANT_PROBE, 'attack_area', true);
    expect(rules.calculateCardPower(state, clever).value).toBe(1);
    expect(rules.calculateCardPower(state, servant).value).toBe(2);

    const mana = state.players[0]!.mana;
    const link = action(state, clever, 'fixture.clever.link');
    expect(link).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', link!).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(mana - 1);
    expect(rules.calculateCardPower(state, clever).value).toBe(2);
    expect(rules.calculateCardPower(state, servant).value).toBe(3);
  });

  it('applies the action-mode -4 mana penalty after battle and ascension-mode -2 VP only on loss', () => {
    const actionState = setup([1, 2]);
    const source = add(actionState, TRANSCEND);
    actionState.round.activePhase = 'action';
    const mana = actionState.players[0]!.mana;
    expect(rules.dispatchAbilityCommand(actionState, 'p1', action(actionState, source, 'fixture.transcend.action.paralysis')!).ok).toBe(true);
    rules.processAbilityEvent(actionState, { id: 'fiore-battle-ended', type: 'after_battle_ended', playerId: 'p1' });
    expect(actionState.players[0]!.mana).toBe(mana - 4);

    const ascState = setup([1, 2]);
    const asc = add(ascState, ASC);
    ascState.round.activePhase = 'action';
    const vp = ascState.players[0]!.vp;
    expect(rules.dispatchAbilityCommand(ascState, 'p1', action(ascState, asc, 'fixture.asc.paralysis')!).ok).toBe(true);
    rules.processAbilityEvent(ascState, {
      id: 'fiore-asc-win',
      type: 'after_battle_result_determined',
      playerId: 'p1',
      battlefieldId: 'miyama_town',
      resultId: 'fiore-asc-win-result',
      battlePhaseResolutionId: 'fiore-asc-win-phase',
      battleParticipantIds: ['p1', 'p2'],
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    } as any);
    expect(ascState.players[0]!.vp).toBe(vp);
    expect(rules.isRoundSkillProfileRuntimeProvenanceValidForRestore(structuredClone(ascState))).toBe(true);

    rules.processAbilityEvent(ascState, {
      id: 'fiore-asc-loss',
      type: 'after_battle_result_determined',
      playerId: 'p1',
      battlefieldId: 'miyama_town',
      resultId: 'fiore-asc-result',
      battlePhaseResolutionId: 'fiore-asc-phase',
      battleParticipantIds: ['p1', 'p2'],
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    } as any);
    expect(ascState.players[0]!.vp).toBe(Math.max(0, vp - 2));

    rules.processAbilityEvent(ascState, {
      id: 'fiore-asc-loss-replay',
      type: 'after_battle_result_determined',
      playerId: 'p1',
      battlefieldId: 'miyama_town',
      resultId: 'fiore-asc-loss-replay-result',
      battlePhaseResolutionId: 'fiore-asc-loss-replay-phase',
      battleParticipantIds: ['p1', 'p2'],
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    } as any);
    expect(ascState.players[0]!.vp).toBe(Math.max(0, vp - 2));
  });

  it('keeps production authority identity-free and leaves Fiore consumer authoring untouched in readiness', () => {
    const production = [
      'packages/rules/src/ability/round-skill-profile-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/core/rule-overrides.ts',
      'packages/rules/src/core/terrain-advantage.ts',
      'packages/rules/src/core/combat-resolver.ts',
    ].map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();

    for (const needle of ['master.fiore', '菲奥蕾', '神经机械学', '决意', '聪慧头脑', 'core.fiore-']) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });
});
