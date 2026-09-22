import { describe, expect, it } from 'vitest';

import contentLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';
import * as rules from '../../src/index';
import type { AuthoringAbility, RuleNode } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { createMatchSession, restoreMatchSession } from '../../src/match-session';
import { restoreTrustedAuthoringFixtureSession } from '../trusted-authoring-fixture';

const SETUP_DEF = 'fixture.game-start-rules';
const SETUP_ID = 'fixture-game-start-rules';
const COMMAND_DEF = 'fixture.command-spell';
const COMMAND_ID = 'fixture-command-spell';
const MOVE_DEF = 'fixture.move';
const MOVE_ID = 'fixture-move';
const MASTER_POWER_DEF = 'fixture.master-power';
const MASTER_POWER_ID = 'fixture-master-power';
const NP_DEF = 'fixture.np';
const NP_ID = 'fixture-np';

const exactEffects: RuleNode[] = [
  { type: 'install_rule_override', player: 'controller', rule: 'first_logical_day_total_power_adjustment', value: -2 },
  { type: 'install_rule_override', player: 'controller', rule: 'non_climax_situation_mana_gain_cap', value: 1 },
  { type: 'install_rule_override', player: 'controller', rule: 'lock_controller_movement_in_own_action_and_combat', enabled: true },
  { type: 'install_rule_override', player: 'controller', rule: 'round_total_mana_gain_cap', regular: 2, climax: 4 },
  { type: 'install_rule_override', player: 'controller', rule: 'total_power_adjustment_if_other_battle_participant_lower_vp', value: -2 },
  { type: 'install_rule_override', player: 'controller', rule: 'controller_master_skill_power_lock_if_situation_forbids', attribute: '宝具', value: 0 },
  { type: 'install_rule_override', player: 'controller', rule: 'command_spell_phase_override', phase: 'advance' },
  { type: 'install_rule_override', player: 'controller', rule: 'view_opponent_discard', enabled: true },
  { type: 'install_rule_override', player: 'controller', rule: 'extra_attack_play_allowance_if_mana_at_least', threshold: 11, amount: 1 },
  { type: 'install_rule_override', player: 'controller', rule: 'view_face_down_events', enabled: true },
  { type: 'install_rule_override', player: 'controller', rule: 'ignore_situation_play_forbid_attribute', attribute: '宝具' },
];

function setupAbility(effects: RuleNode[] = exactEffects): AuthoringAbility {
  return {
    id: 'renamed.synthetic.game-start-rules',
    kind: 'forced_trigger',
    printedClause: 'synthetic game-start persistent rules',
    activation: { trigger: 'game_start' },
    conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    effects: structuredClone(effects),
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function phaseAction(id: string, phase: 'action' | 'advance', effects: RuleNode[], extra: Partial<AuthoringAbility> = {}): Record<string, unknown> {
  return {
    id,
    kind: 'phase_action',
    printedClause: id,
    activation: { phase, opens: phase === 'action' ? 'controller_action_window' : 'controller_advance_window', ...(extra.activation ?? {}) },
    conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    effects,
    execution: { mode: 'automatic' },
    ...extra,
  };
}

function archive() {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    id: 'fixture.game-start-owner', name: 'Synthetic Master', class: 'Master',
    cards: [
      {
        id: SETUP_DEF, name: 'Persistent setup', cardType: 'master_skill',
        cardFace: { typeLabel: '特殊', attributes: [], cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [setupAbility()],
      },
      {
        id: COMMAND_DEF, name: 'Command', cardType: 'command_spell',
        cardFace: { typeLabel: '令咒', attributes: [], cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [phaseAction('fixture.command.action', 'action', [{ type: 'noop' }])],
      },
      {
        id: MOVE_DEF, name: 'Move', cardType: 'master_skill',
        cardFace: { typeLabel: '特殊', attributes: [], cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [{
          id: 'fixture.move.action', kind: 'phase_action', printedClause: 'move',
          activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
          conditions: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          targets: [{ id: 'destination', type: 'location', count: { min: 1, max: 1 }, constraints: [{ type: 'any_enabled_location' }, { type: 'not_location_kind', locationKind: 'workshop' }] }],
          effects: [{ type: 'move_player', player: 'controller', to: 'destination' }], execution: { mode: 'automatic' },
        }],
      },
      {
        id: MASTER_POWER_DEF, name: 'Power probe', cardType: 'master_skill',
        cardFace: { typeLabel: '特殊', attributes: ['宝具'], cost: 0, basePower: 7 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
      {
        id: NP_DEF, name: 'NP probe', cardType: 'servant_deck_card',
        cardFace: { typeLabel: '攻击', attributes: ['宝具'], cost: 0, basePower: 3 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
    ],
  };
}

function addCard(state: GameState, instanceId: string, definitionId: string, zone: string, active = false) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone, visibility: zone === 'attack_area' || zone === 'field' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' } });
  if (active) state.abilityRuntime!.cardState[instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
}

function stateWithPack(): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.masterCardId = 'fixture.game-start-owner';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[0]!.mana = 8;
  state.players[1]!.mana = 8;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260916 });
  addCard(state, SETUP_ID, SETUP_DEF, 'skill');
  addCard(state, COMMAND_ID, COMMAND_DEF, 'skill');
  addCard(state, MOVE_ID, MOVE_DEF, 'field', true);
  addCard(state, MASTER_POWER_ID, MASTER_POWER_DEF, 'attack_area', true);
  addCard(state, NP_ID, NP_DEF, 'hand');
  return state;
}

function installAll(state: GameState, eventId = 'game-start-fixture') {
  rules.processAbilityEvent(state, { id: eventId, type: 'game_start' });
}

describe('P3-FB2-14 identity-free game-start RuleOverride runtime', () => {
  it('accepts every exact whitelisted override shape under a renamed synthetic source and rejects near matches', () => {
    for (const effect of exactEffects) {
      expect(rules.isExactGameStartRuleOverrideEffect(effect)).toBe(true);
      expect(rules.isGameStartRuleOverrideSemantic(setupAbility([effect]))).toBe(true);
    }
    const wrongValue = structuredClone(exactEffects[0]!); wrongValue.value = -1;
    const extraField = { ...structuredClone(exactEffects[1]!), extra: true } as RuleNode;
    const wrongPlayer = structuredClone(exactEffects[2]!); wrongPlayer.player = 'target';
    expect(rules.isExactGameStartRuleOverrideEffect(wrongValue)).toBe(false);
    expect(rules.isExactGameStartRuleOverrideEffect(extraField)).toBe(false);
    expect(rules.isExactGameStartRuleOverrideEffect(wrongPlayer)).toBe(false);
    const malformed = setupAbility([exactEffects[0]!]); malformed.activation.phase = 'action';
    expect(rules.isGameStartRuleOverrideSemantic(malformed)).toBe(false);
    const duplicate = setupAbility([exactEffects[0]!, exactEffects[0]!]);
    expect(rules.isGameStartRuleOverrideSemantic(duplicate)).toBe(false);

    const absentOperationsArchive = archive();
    const absentExecution = absentOperationsArchive.cards[0]!.abilities[0]!.execution as Record<string, unknown>;
    delete absentExecution.allowedOperations;
    const absentOperations = rules.loadAuthoringJson(absentOperationsArchive).cards[SETUP_DEF]!.abilities[0]!;
    expect(absentOperations.execution.allowedOperations).toEqual([]);
    expect(rules.isGameStartRuleOverrideSemantic(absentOperations)).toBe(true);

    for (const operationsKey of ['hostOps', 'allowedOperations'] as const) {
      const emptyAuthorityArchive = archive();
      emptyAuthorityArchive.cards[0]!.abilities[0]!.execution = {
        mode: 'automatic',
        [operationsKey]: [],
      } as never;
      const emptyAuthority = rules.loadAuthoringJson(emptyAuthorityArchive);
      expect(emptyAuthority.report).toEqual([]);
      expect(rules.isGameStartRuleOverrideSemantic(emptyAuthority.cards[SETUP_DEF]!.abilities[0]!)).toBe(true);

      const authorityArchive = archive();
      authorityArchive.cards[0]!.abilities[0]!.execution = {
        mode: 'automatic',
        [operationsKey]: ['adjust-mana'],
      } as never;
      const withAuthorityPack = rules.loadAuthoringJson(authorityArchive);
      const withAuthority = withAuthorityPack.cards[SETUP_DEF]!.abilities[0]!;
      expect(withAuthorityPack.report).toContainEqual(expect.objectContaining({
        abilityId: withAuthority.id,
        path: `execution.${operationsKey}`,
        status: 'unsupported',
      }));
      expect(withAuthority.execution.allowedOperations).toEqual(['adjust-mana']);
      expect(withAuthority.execution.mode).toBe('unsupported');
      expect(rules.isGameStartRuleOverrideSemantic(withAuthority)).toBe(false);
    }
  });

  it('fails closed before raw execution authority can be erased by loader normalization', () => {
    const cases = [
      {
        execution: { mode: 'automatic', unknownExecutionAuthority: true },
        reportPath: 'execution.unknownExecutionAuthority',
      },
      {
        execution: { mode: 'automatic', hostOps: [], allowedOperations: ['adjust-mana'] },
        reportPath: 'execution',
      },
      {
        execution: { mode: 'automatic', hostOps: [], allowedOperations: [] },
        reportPath: 'execution',
      },
    ];

    for (const testCase of cases) {
      const rawArchive = archive();
      rawArchive.cards[0]!.abilities[0]!.execution = testCase.execution as never;
      const loaded = rules.loadAuthoringJson(rawArchive);
      const ability = loaded.cards[SETUP_DEF]!.abilities[0]!;

      expect(loaded.report).toContainEqual(expect.objectContaining({
        abilityId: ability.id,
        path: testCase.reportPath,
        status: 'unsupported',
      }));
      expect(ability.execution.mode).toBe('unsupported');
      expect(rules.isGameStartRuleOverrideSemantic(ability)).toBe(false);
    }
  });

  it('installs game-start overrides before MatchSession applies the first-round Situation mana grant', () => {
    const library = contentLibrary as unknown as {
      rules: { cards: Record<string, { abilities: AuthoringAbility[] }> };
    };
    const setupCard = library.rules.cards['master.kayneth.skill.double-master']!;
    const originalAbilities = setupCard.abilities;
    setupCard.abilities = [
      ...originalAbilities,
      setupAbility([exactEffects[1]!, exactEffects[3]!]),
    ];

    let session: ReturnType<typeof createMatchSession>;
    try {
      session = createMatchSession({ seed: 1, humanPlayerId: 'p1' });
    } finally {
      setupCard.abilities = originalAbilities;
    }

    const kayneth = session.pairings.find((pairing) => pairing.master.id === 'master.kayneth')!;
    const controller = session.state.players.find((player) => player.id === kayneth.playerId)!;
    expect(session.state.currentSituationCardId).toBe('situation.turning_point');
    expect(controller.mana).toBe(5);
    expect(session.state.abilityRuntime!.manaGainedThisRound.byPlayer[controller.id]).toBe(1);
    expect(rules.grantMana(session.state, controller.id, 2, { source: 'generic' })).toMatchObject({
      requestedAmount: 2,
      actualAmount: 1,
      overflowAmount: 1,
      before: 5,
      after: 6,
    });
    expect(session.state.abilityRuntime!.manaGainedThisRound.byPlayer[controller.id]).toBe(2);
    expect(session.state.abilityRuntime!.processedEvents.filter((id) => id === 'match-session-game-start')).toHaveLength(1);

    const restored = restoreTrustedAuthoringFixtureSession(session.serializeSession());
    expect(restored.state.players.find((player) => player.id === controller.id)?.mana).toBe(6);
    expect(restored.state.abilityRuntime!.manaGainedThisRound.byPlayer[controller.id]).toBe(2);
    expect(restored.state.abilityRuntime!.processedEvents.filter((id) => id === 'match-session-game-start')).toHaveLength(1);
  });

  it('installs all typed overrides on game_start exactly once and duplicate event replay is idempotent', () => {
    const state = stateWithPack();
    installAll(state);
    expect(state.ruleOverrides).toMatchObject({
      firstLogicalDayTotalPowerAdjustmentByPlayer: { p1: -2 },
      nonClimaxSituationManaGainCapByPlayer: { p1: 1 },
      roundTotalManaGainCapByPlayer: { p1: { regular: 2, climax: 4 } },
      commandSpellPhaseOverrideByPlayer: { p1: 'advance' },
      extraAttackPlayAllowanceByManaByPlayer: { p1: { threshold: 11, amount: 1 } },
    });
    expect(state.ruleOverrides!.movementLockedOwnActionCombatPlayerIds).toEqual(['p1']);
    expect(state.ruleOverrides!.viewOpponentDiscardPlayerIds).toEqual(['p1']);
    expect(state.ruleOverrides!.viewFaceDownEventsPlayerIds).toEqual(['p1']);
    const snapshot = JSON.stringify(state.ruleOverrides);
    installAll(state);
    expect(JSON.stringify(state.ruleOverrides)).toBe(snapshot);
    expect(state.abilityRuntime!.processedEvents.filter((id) => id === 'game-start-fixture')).toHaveLength(1);
  });

  it('enforces non-climax Situation cap and successful-positive round budget without counting set/loss semantics', () => {
    const state = stateWithPack();
    state.players[0]!.mana = 4;
    state.ruleOverrides = {
      nonClimaxSituationManaGainCapByPlayer: { p1: 1 },
      roundTotalManaGainCapByPlayer: { p1: { regular: 2, climax: 4 } },
    };
    const situation = rules.grantMana(state, 'p1', 4, { source: 'situation', isClimaxSituation: false });
    expect(situation).toMatchObject({ requestedAmount: 4, cappedRequestAmount: 1, actualAmount: 1, overflowAmount: 3, before: 4, after: 5 });
    const generic = rules.grantMana(state, 'p1', 4, { source: 'generic' });
    expect(generic).toMatchObject({ requestedAmount: 4, cappedRequestAmount: 1, actualAmount: 1, overflowAmount: 3, after: 6 });
    const exhausted = rules.grantMana(state, 'p1', 1, { source: 'deployment' });
    expect(exhausted.actualAmount).toBe(0);
    expect(state.abilityRuntime!.manaGainedThisRound.byPlayer.p1).toBe(2);
    state.players[0]!.mana = 1; // direct set/loss is not a positive gain and must not add budget usage.
    expect(state.abilityRuntime!.manaGainedThisRound.byPlayer.p1).toBe(2);
    rules.resetManaGainLedgerForRound(state, 2);
    state.round.roundNumber = 2;
    const nextRound = rules.grantMana(state, 'p1', 4, { source: 'generic', isClimaxSituation: true });
    expect(nextRound.actualAmount).toBe(4);
  });

  it('applies first-logical-day and lower-VP combat adjustments only through typed state', () => {
    const state = stateWithPack();
    state.players[0]!.vp = 3;
    state.players[1]!.vp = 1;
    state.ruleOverrides = {
      firstLogicalDayTotalPowerAdjustmentByPlayer: { p1: -2 },
      lowerVpBattleTotalPowerAdjustmentByPlayer: { p1: -2 },
    };
    const adjusted = rules.deriveBattleParticipantsFromState(state, 'miyama_town').find((participant) => participant.playerId === 'p1')!;
    const baseline = structuredClone(state); baseline.ruleOverrides = {};
    const normal = rules.deriveBattleParticipantsFromState(baseline, 'miyama_town').find((participant) => participant.playerId === 'p1')!;
    expect(adjusted.totalPower).toBe(normal.totalPower - 4);
    state.ruleOverrides!.logicalDayByPlayer = { p1: 2 };
    const dayTwo = rules.deriveBattleParticipantsFromState(state, 'miyama_town').find((participant) => participant.playerId === 'p1')!;
    expect(dayTwo.totalPower).toBe(normal.totalPower - 2);
    state.players[1]!.vp = 3;
    const noLowerVp = rules.deriveBattleParticipantsFromState(state, 'miyama_town').find((participant) => participant.playerId === 'p1')!;
    expect(noLowerVp.totalPower).toBe(normal.totalPower);
  });

  it('locks controller master-skill Power to zero only while an active Situation forbids the matching attribute', () => {
    const state = stateWithPack();
    state.ruleOverrides = { masterSkillPowerLockIfSituationForbidsByPlayer: { p1: { attribute: '宝具', value: 0 } } };
    expect(rules.calculateCardPower(state, MASTER_POWER_ID).value).toBe(7);
    (state as unknown as { modeState: Record<string, unknown> }).modeState = {
      cardPlayForbids: [{ sourceType: 'situation', attribute: '宝具', rule: 'situation_play_forbid' }],
    };
    expect(rules.calculateCardPower(state, MASTER_POWER_ID).value).toBe(0);
    (state as unknown as { modeState: Record<string, unknown> }).modeState = {
      cardPlayForbids: [{ sourceType: 'event', attribute: '宝具', rule: 'play_card_attribute' }],
    };
    expect(rules.calculateCardPower(state, MASTER_POWER_ID).value).toBe(7);
  });

  it('replaces command-spell action timing with advance, adds Sieg allowance prospectively, and ignores only Situation NP forbids', () => {
    const state = stateWithPack();
    state.round.activePhase = 'advance';
    state.round.prioritySeat = 1;
    state.ruleOverrides = {
      commandSpellPhaseOverrideByPlayer: { p1: 'advance' },
      extraAttackPlayAllowanceByManaByPlayer: { p1: { threshold: 11, amount: 1 } },
      ignoreSituationPlayForbidAttributesByPlayer: { p1: ['宝具'] },
    };
    expect(rules.getLegalActions(state, 'p1')).toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: COMMAND_ID, abilityId: 'fixture.command.action' }));
    state.round.activePhase = 'action';
    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: COMMAND_ID, abilityId: 'fixture.command.action' }));
    state.players[0]!.mana = 10;
    expect(rules.projectAbilityState(state, 'p1').playSummary!.attackAllowance).toBe(2);
    state.players[0]!.mana = 11;
    expect(rules.projectAbilityState(state, 'p1').playSummary!.attackAllowance).toBe(3);
    (state as unknown as { modeState: Record<string, unknown> }).modeState = { cardPlayForbids: [{ sourceType: 'situation', attribute: '宝具', rule: 'situation_play_forbid' }] };
    expect(rules.getLegalActions(state, 'p1')).toContainEqual(expect.objectContaining({ type: 'play_card', cardInstanceId: NP_ID }));
    (state as unknown as { modeState: Record<string, unknown> }).modeState = { cardPlayForbids: [{ sourceType: 'event', attribute: '宝具', rule: 'play_card_attribute' }] };
    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual(expect.objectContaining({ type: 'play_card', cardInstanceId: NP_ID }));
  });

  it('locks normal and ordinary effect movement in Action/Combat while preserving an explicit trusted bypass', () => {
    const state = stateWithPack();
    state.round.activePhase = 'action';
    state.ruleOverrides = { movementLockedOwnActionCombatPlayerIds: ['p1'] };
    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: MOVE_ID }));
    expect(rules.movePlayer(state, { playerId: 'p1', to: 'shinto', movementKind: 'normal' })).toMatchObject({ moved: false, reason: 'movement_locked' });
    expect(rules.movePlayer(state, { playerId: 'p1', to: 'shinto', movementKind: 'effect' })).toMatchObject({ moved: false, reason: 'movement_locked' });
    const bypass = rules.movePlayer(state, { playerId: 'p1', to: 'shinto', movementKind: 'effect', ignoreCardMovementRestrictions: true });
    expect(bypass.moved).toBe(true);
    state.round.activePhase = 'advance';
    state.players[0]!.locationId = 'miyama_town';
    expect(rules.movePlayer(state, { playerId: 'p1', to: 'shinto', movementKind: 'effect' }).moved).toBe(true);
  });

  it('projects hidden event IDs and opponent discard IDs only to authorized viewers', () => {
    const session = createMatchSession({ seed: 20260916, humanPlayerId: 'p1' });
    session.state.eventPlacements = [
      { locationId: 'miyama_town', eventCardId: 'event-public', visibility: { scope: 'public' } },
      { locationId: 'shinto', eventCardId: 'event-secret', visibility: { scope: 'hidden_until_trigger' } },
    ];
    session.state.cards.push(
      { instanceId: 'p2-discard-secret', definitionId: 'x', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'discard', visibility: { scope: 'public' } },
      { instanceId: 'p2-hand-secret', definitionId: 'y', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } },
    );
    const ordinary = session.projectToClientState('p1');
    expect(ordinary.zones.find((zone) => zone.id === 'event_placements')?.cardIds).toEqual(['event-public']);
    expect(ordinary.zones.find((zone) => zone.id === 'event_placements')?.count).toBe(2);
    expect(ordinary.zones.find((zone) => zone.id === 'opponent_discard')).toBeUndefined();

    session.state.ruleOverrides = { viewFaceDownEventsPlayerIds: ['p1'], viewOpponentDiscardPlayerIds: ['p1'] };
    const privileged = session.projectToClientState('p1');
    expect(privileged.zones.find((zone) => zone.id === 'event_placements')?.cardIds).toEqual(['event-public', 'event-secret']);
    expect(privileged.zones.find((zone) => zone.id === 'opponent_discard')?.cardIds).toEqual(['p2-discard-secret']);
    expect(privileged.zones.find((zone) => zone.id === 'opponent_discard')?.cardIds).not.toContain('p2-hand-secret');
  });

  it('serializes and restores typed overrides plus the round gain ledger without widening authority', () => {
    const session = createMatchSession({ seed: 20260916, humanPlayerId: 'p1' });
    session.state.ruleOverrides = { roundTotalManaGainCapByPlayer: { p1: { regular: 2, climax: 4 } }, viewFaceDownEventsPlayerIds: ['p1'] };
    session.state.abilityRuntime!.manaGainedThisRound = { round: 3, byPlayer: { p1: 2 } };
    const restored = restoreMatchSession(session.serializeSession());
    expect(restored.state.ruleOverrides).toEqual(session.state.ruleOverrides);
    expect(restored.state.abilityRuntime!.manaGainedThisRound).toEqual({ round: 3, byPlayer: { p1: 2 } });
  });
});
