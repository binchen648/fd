import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';
import {
  exportOpponentCloseToOneServerAuthority,
  persistOpponentCloseToOneServerAuthority,
  restoreOpponentCloseToOneServerAuthority,
} from '../src/ability/opponent-close-to-one-authority';

const SOURCE_DEF = 'test.fb2-49.source';
const SOURCE_ID = 'fb2-49-source-p1';
const ABILITY_ID = 'test.fb2-49.close-to-one';
const NORMAL_DEF = 'test.fb2-49.normal';
const SKILL_DEF = 'test.fb2-49.skill';
const RESIDUAL_DEF = 'test.fb2-49.residual';
const PROTECTED_DEF = 'test.fb2-49.protected';

function ability(): any {
  return {
    id: ABILITY_ID,
    kind: 'phase_action',
    printedClause: 'synthetic identity-free FB2-49',
    activation: { phase: 'combat', opens: 'controller_combat_action_window' },
    conditions: [{ type: 'source_owned' }, { type: 'at_battlefield' }],
    targets: [],
    effects: [{ type: rules.OPPONENT_CLOSE_NON_RESIDUAL_TO_ONE_EFFECT }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {},
    visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
    execution: { mode: 'automatic' },
  };
}

function archive(rawAbility: any = ability()): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive',
    id: 'test.fb2-49', name: 'FB2-49 synthetic', class: 'Test',
    cards: [{
      id: SOURCE_DEF, name: 'FB2-49 source', cardType: 'servant_skill', owner: { type: 'servant', id: 'test.fb2-49' },
      cardFace: { typeLabel: '宝具', attributes: ['宝具'], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [rawAbility],
    }],
  };
}

function compiledCard(id: string, cardType = 'servant_attack', residual = false): any {
  return {
    id, name: id, cardType, cardFace: { typeLabel: 'test', attributes: ['力量'], cost: 0, basePower: 1 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], mode: 'automatic',
    abilities: residual ? [{
      id: `${id}.residual`, kind: 'residual', printedClause: 'residual', activation: { trigger: 'while_active' },
      conditions: [], targets: [], effects: [], cost: [], creates: [], ruleModifiers: [],
      lifecycle: { duration: 'while_active', cleanup: 'remain_active' }, responseWindow: {}, limit: {}, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    }] : [],
  };
}

function setup(): GameState {
  const loaded = rules.loadAuthoringJson(archive());
  expect(loaded.report).toEqual([]);
  loaded.cards[NORMAL_DEF] = compiledCard(NORMAL_DEF);
  loaded.cards[SKILL_DEF] = compiledCard(SKILL_DEF, 'servant_skill');
  loaded.cards[RESIDUAL_DEF] = compiledCard(RESIDUAL_DEF, 'servant_attack', true);
  loaded.cards[PROTECTED_DEF] = compiledCard(PROTECTED_DEF);
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.cards = [{ instanceId: SOURCE_ID, definitionId: SOURCE_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  state.round.activePhase = 'battle';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'miyama_town';
  state.players[3]!.locationId = 'shinto';
  rules.initializeAbilityRuntime(state, loaded, { seed: 4901 });
  state.abilityRuntime!.cardState[SOURCE_ID] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function add(state: GameState, instanceId: string, controllerPlayerId: string, definitionId = NORMAL_DEF,
  options: { zone?: string; active?: boolean; faceDown?: boolean; ownerPlayerId?: string } = {}): void {
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: options.ownerPlayerId ?? controllerPlayerId, controllerPlayerId,
    zone: options.zone ?? 'attack_area', visibility: options.faceDown ? { scope: 'owner_only', ownerPlayerId: options.ownerPlayerId ?? controllerPlayerId } : { scope: 'public' },
  });
  state.abilityRuntime!.cardState[instanceId] = {
    active: options.active ?? true, faceDown: options.faceDown ?? false, playedRound: state.round.roundNumber,
  };
}

function activate(state: GameState) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE_ID, abilityId: ABILITY_ID });
}
function choose(state: GameState, playerId: string, selectedIds: string[]) {
  const d = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: d.id, selectedIds });
}
function gatewayReport(rawAbility: any) { return rules.loadAuthoringJson(archive(rawAbility)).report; }

function installCloseForbid(state: GameState, controllerId: string, definitionId: string): void {
  state.abilityRuntime!.ongoingEffects.push({
    id: 'fb2-49-close-forbid', sourceCardId: SOURCE_ID, abilityId: 'fixture-close-forbid', controllerId,
    starts: 'immediate', duration: 'this_round', startRound: state.round.roundNumber, expiresAtRound: state.round.roundNumber + 1,
    cleanup: 'expire_after_duration', publicZones: [], sourceMustRemainActive: false,
    ruleModifiers: [{
      id: 'protect-one-definition', definition: {
        id: 'protect-one-definition', operation: 'forbid', rule: 'card_close',
        scope: { controller: 'self', constraints: [{ type: 'has_card_id', cardId: definitionId }] },
        lifecycle: { duration: 'this_round' },
      },
    }],
  });
}

describe('P3-FB2-49 opponent close non-residual cards to one', () => {
  it('admits only the exact raw and compiled whole-ability envelope and rejects historical generic vocabulary', () => {
    const raw = ability();
    expect(rules.isOpponentCloseToOneCandidate(raw)).toBe(true);
    expect(rules.isAcceptedOpponentCloseToOneAbility(raw, 'authoring')).toBe(true);
    const loaded = rules.loadAuthoringJson(archive(raw));
    expect(loaded.report).toEqual([]);
    expect(rules.isAcceptedOpponentCloseToOneAbility(loaded.cards[SOURCE_DEF]!.abilities[0]!, 'compiled')).toBe(true);

    const malformed: any[] = [];
    const wrongPhase = structuredClone(raw); wrongPhase.activation.phase = 'action'; malformed.push(wrongPhase);
    const wrongWindow = structuredClone(raw); wrongWindow.activation.opens = 'controller_action_window'; malformed.push(wrongWindow);
    const extraCondition = structuredClone(raw); extraCondition.conditions.push({ type: 'source_active' }); malformed.push(extraCondition);
    const wrongOrder = structuredClone(raw); wrongOrder.conditions.reverse(); malformed.push(wrongOrder);
    const payloadEffect = structuredClone(raw); payloadEffect.effects[0].minCount = 1; malformed.push(payloadEffect);
    const wrongVisibility = structuredClone(raw); wrongVisibility.visibility.revealScope = 'card_only'; malformed.push(wrongVisibility);
    const historical = structuredClone(raw); historical.effects = [{
      type: 'choose_each_player_cards', candidateTarget: { scope: 'same_battlefield_opponents' }, zone: 'attack', activeOnly: true,
      face: 'up', residual: false, minCandidateCount: 2, minCount: 1, maxCount: 1, payloadKey: 'keptInstanceIds', skipIfNoCandidates: true,
      then: [{ type: 'close_matching_cards_except_selected', target: 'decision_player', zone: 'attack', activeOnly: true, face: 'up', residual: false, payloadKey: 'keptInstanceIds' }],
    }]; malformed.push(historical);
    for (const candidate of malformed) {
      expect(gatewayReport(candidate)).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'opponentCloseToOne.gateway', status: 'unsupported' }),
      ]));
    }
  });

  it('skips zero/one-card opponents without staging a decision or mutating their card', () => {
    const zero = setup();
    expect(activate(zero).ok).toBe(true);
    expect(zero.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(zero.abilityRuntime!.pendingOpponentCloseToOne).toEqual([]);

    const one = setup(); add(one, 'p2-one', 'p2');
    one.players.find((player) => player.id === 'p3')!.status = 'eliminated';
    add(one, 'eliminated-a', 'p3'); add(one, 'eliminated-b', 'p3');
    expect(activate(one).ok).toBe(true);
    expect(one.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(one.abilityRuntime!.cardState['p2-one']).toMatchObject({ active: true, faceDown: false });
    expect(one.abilityRuntime!.cardState['eliminated-a']).toMatchObject({ active: true, faceDown: false });
    expect(one.abilityRuntime!.cardState['eliminated-b']).toMatchObject({ active: true, faceDown: false });
  });

  it('lets one opponent keep exactly one while closing all other qualifying cards and excluding residual/state mismatches', () => {
    const state = setup();
    add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2'); add(state, 'p2-skill', 'p2', SKILL_DEF);
    add(state, 'p2-residual', 'p2', RESIDUAL_DEF);
    add(state, 'p2-facedown', 'p2', NORMAL_DEF, { faceDown: true });
    add(state, 'p2-inactive', 'p2', NORMAL_DEF, { active: false });
    add(state, 'p2-hand', 'p2', NORMAL_DEF, { zone: 'hand' });
    add(state, 'p2-owned-p3-controlled', 'p3', NORMAL_DEF, { ownerPlayerId: 'p2' });
    add(state, 'remote-a', 'p4'); add(state, 'remote-b', 'p4');

    expect(activate(state).ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p1').pendingDecision).toBeUndefined();
    expect(rules.projectAbilityState(state, 'p1').waitingLabel).toBe('等待响应结算');
    expect(rules.projectAbilityState(state, 'p2').pendingDecision?.candidates).toEqual(['p2-a', 'p2-b', 'p2-skill']);
    const firstDecision = state.abilityRuntime!.pendingDecision!.id;
    expect(choose(state, 'p2', ['p2-a']).ok).toBe(true);

    expect(state.abilityRuntime!.cardState['p2-a']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: false, faceDown: true });
    expect(state.cards.find((card) => card.instanceId === 'p2-b')!.zone).toBe('attack_area');
    expect(state.cards.find((card) => card.instanceId === 'p2-skill')).toMatchObject({ zone: 'skill', controllerPlayerId: 'p2' });
    expect(state.abilityRuntime!.cardState['p2-skill']).toMatchObject({ active: false, faceDown: false });
    expect(state.abilityRuntime!.cardState['p2-residual']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.cardState['p2-facedown']!.faceDown).toBe(true);
    expect(state.abilityRuntime!.cardState['p2-inactive']!.active).toBe(false);
    expect(state.abilityRuntime!.cardState['p2-owned-p3-controlled']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.cardState['remote-a']!.active).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.abilityRuntime!.pendingOpponentCloseToOne).toEqual([]);

    const settled = structuredClone(state);
    const replay = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: firstDecision, selectedIds: ['p2-a'] });
    expect(replay.ok).toBe(false);
    expect(state).toEqual(settled);
  });

  it('serializes eligible opponents by seat without overwriting private decision ownership', () => {
    const state = setup();
    add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
    add(state, 'p3-a', 'p3'); add(state, 'p3-b', 'p3'); add(state, 'p3-c', 'p3');
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.pendingOpponentCloseToOne?.map((entry) => entry.decisionPlayerId)).toEqual(['p2', 'p3']);
    expect(state.abilityRuntime!.pendingDecision?.controllerId).toBe('p2');
    expect(rules.projectAbilityState(state, 'p3').pendingDecision).toBeUndefined();
    expect(choose(state, 'p2', ['p2-b']).ok).toBe(true);
    expect(state.abilityRuntime!.pendingOpponentCloseToOne?.map((entry) => entry.decisionPlayerId)).toEqual(['p3']);
    expect(state.abilityRuntime!.pendingDecision?.controllerId).toBe('p3');
    expect(rules.projectAbilityState(state, 'p3').pendingDecision?.candidates).toEqual(['p3-a', 'p3-b', 'p3-c']);
    expect(choose(state, 'p3', ['p3-c']).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.abilityRuntime!.pendingOpponentCloseToOne).toEqual([]);
    expect(state.abilityRuntime!.cardState['p2-a']!.faceDown).toBe(true);
    expect(state.abilityRuntime!.cardState['p2-b']!.active).toBe(true);
    expect(state.abilityRuntime!.cardState['p3-a']!.faceDown).toBe(true);
    expect(state.abilityRuntime!.cardState['p3-b']!.faceDown).toBe(true);
    expect(state.abilityRuntime!.cardState['p3-c']!.active).toBe(true);
  });

  it('rejects wrong-player, empty, duplicate, multiple and outsider selections mutation-free', () => {
    const attempts: Array<{ playerId: string; selectedIds: string[] }> = [
      { playerId: 'p1', selectedIds: ['p2-a'] },
      { playerId: 'p2', selectedIds: [] },
      { playerId: 'p2', selectedIds: ['p2-a', 'p2-a'] },
      { playerId: 'p2', selectedIds: ['p2-a', 'p2-b'] },
      { playerId: 'p2', selectedIds: ['outsider'] },
    ];
    for (const attempt of attempts) {
      const state = setup(); add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
      expect(activate(state).ok).toBe(true);
      const before = structuredClone(state);
      const result = choose(state, attempt.playerId, attempt.selectedIds);
      expect(result.ok).toBe(false);
      expect(state).toEqual(before);
    }
  });

  it('fails closed mutation-free on battlefield/source/card/metadata provenance drift', () => {
    const corruptions: Array<(state: GameState) => void> = [
      state => { state.players.find((player) => player.id === 'p2')!.locationId = 'shinto'; },
      state => { state.cards.find((card) => card.instanceId === SOURCE_ID)!.ownerPlayerId = 'p4'; },
      state => { state.abilityRuntime!.cardState['p2-b']!.faceDown = true; },
      state => { state.cards.find((card) => card.instanceId === 'p2-b')!.controllerPlayerId = 'p3'; },
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).qualifyingCardIds = ['p2-a', 'forged']; },
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).createdRevision += 1; },
    ];
    for (const corrupt of corruptions) {
      const state = setup(); add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
      expect(activate(state).ok).toBe(true);
      corrupt(state);
      const before = structuredClone(state);
      expect(choose(state, 'p2', ['p2-a']).ok).toBe(false);
      expect(state).toEqual(before);
    }
  });

  it('requires a real source runtime card-state record at activation and settlement', () => {
    {
      const state = setup(); add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
      delete state.abilityRuntime!.cardState[SOURCE_ID];
      expect(activate(state).ok).toBe(false);
      expect(state.abilityRuntime!.cardState[SOURCE_ID]).toBeUndefined();
      expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
      expect(state.abilityRuntime!.pendingOpponentCloseToOne).toBeUndefined();
      expect(state.abilityRuntime!.cardState['p2-a']).toMatchObject({ active: true, faceDown: false });
      expect(state.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: true, faceDown: false });
    }

    {
      const state = setup(); add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
      expect(activate(state).ok).toBe(true);
      const decisionId = state.abilityRuntime!.pendingDecision!.id;
      delete state.abilityRuntime!.cardState[SOURCE_ID];
      const before = structuredClone(state);
      let result: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
      expect(() => {
        result = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] });
      }).not.toThrow();
      expect(result?.ok).toBe(false);
      expect(state).toEqual(before);
      expect(state.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: true, faceDown: false });
      expect(state.abilityRuntime!.pendingDecision?.controllerId).toBe('p2');
      expect(state.abilityRuntime!.pendingOpponentCloseToOne).toHaveLength(1);
    }
  });

  it('rejects truthy malformed source runtime card-state values at activation and settlement', () => {
    const malformedStates: unknown[] = [
      'forged', [], 7, { active: false, faceDown: 'false', playedRound: 1 }, { active: false, faceDown: false },
    ];
    for (const malformed of malformedStates) {
      const activation = setup(); add(activation, 'p2-a', 'p2'); add(activation, 'p2-b', 'p2');
      (activation.abilityRuntime!.cardState as any)[SOURCE_ID] = structuredClone(malformed);
      expect(activate(activation).ok).toBe(false);
      expect(activation.abilityRuntime!.pendingDecision).toBeUndefined();
      expect(activation.abilityRuntime!.pendingOpponentCloseToOne).toBeUndefined();
      expect(activation.abilityRuntime!.cardState['p2-a']).toMatchObject({ active: true, faceDown: false });
      expect(activation.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: true, faceDown: false });

      const settlement = setup(); add(settlement, 'p2-a', 'p2'); add(settlement, 'p2-b', 'p2');
      expect(activate(settlement).ok).toBe(true);
      const decisionId = settlement.abilityRuntime!.pendingDecision!.id;
      (settlement.abilityRuntime!.cardState as any)[SOURCE_ID] = structuredClone(malformed);
      const before = structuredClone(settlement);
      let result: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
      expect(() => {
        result = rules.dispatchAbilityCommand(settlement, 'p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] });
      }).not.toThrow();
      expect(result?.ok).toBe(false);
      expect(settlement).toEqual(before);
      expect(settlement.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: true, faceDown: false });
      expect(settlement.abilityRuntime!.pendingDecision?.controllerId).toBe('p2');
      expect(settlement.abilityRuntime!.pendingOpponentCloseToOne).toHaveLength(1);
    }
  });


  it('fails closed mutation-free when only frozen qualifying-card ownership provenance drifts', () => {
    const state = setup(); add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
    expect(activate(state).ok).toBe(true);
    const interaction = state.abilityRuntime!.pendingDecision!.interaction as any;
    expect(interaction.qualifyingCardOwners).toEqual({ 'p2-a': 'p2', 'p2-b': 'p2' });
    expect(state.abilityRuntime!.pendingOpponentCloseToOne?.[0]?.qualifyingCardOwners).toEqual({ 'p2-a': 'p2', 'p2-b': 'p2' });
    const drifted = state.cards.find((card) => card.instanceId === 'p2-b')!;
    drifted.ownerPlayerId = 'p3';
    expect(drifted.controllerPlayerId).toBe('p2');
    expect(drifted.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: true, faceDown: false });
    const before = structuredClone(state);
    expect(choose(state, 'p2', ['p2-a']).ok).toBe(false);
    expect(state).toEqual(before);
    expect(state.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: true, faceDown: false });
  });

  it('fails closed through the DTO boundary when frozen owner provenance metadata is missing or malformed', () => {
    const corruptions: Array<(state: GameState) => void> = [
      state => { delete (state.abilityRuntime!.pendingDecision!.interaction as any).qualifyingCardOwners; },
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).qualifyingCardOwners = null; },
      state => { (state.abilityRuntime!.pendingOpponentCloseToOne![0] as any).qualifyingCardOwners = null; },
      state => { (state.abilityRuntime!.pendingOpponentCloseToOne![0] as any).qualifyingCardOwners = []; },
    ];
    for (const corrupt of corruptions) {
      const state = setup(); add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
      expect(activate(state).ok).toBe(true);
      corrupt(state);
      const before = structuredClone(state);
      let result: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
      expect(() => {
        result = rules.dispatchAbilityCommand(state, 'p2', {
          type: 'choose_target', decisionId: state.abilityRuntime!.pendingDecision!.id, selectedIds: ['p2-a'],
        });
      }).not.toThrow();
      expect(result?.ok).toBe(false);
      expect(state).toEqual(before);
    }
  });

  it('fails closed through the DTO boundary when frozen candidate-list or constraint metadata is malformed', () => {
    const corruptions: Array<(state: GameState) => void> = [
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).qualifyingCardIds = null; },
      state => { (state.abilityRuntime!.pendingOpponentCloseToOne![0] as any).qualifyingCardIds = null; },
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).qualifyingCardIds = ['p2-a', 'p2-a']; },
      state => { (state.abilityRuntime!.pendingOpponentCloseToOne![0] as any).qualifyingCardIds = ['p2-a', 7]; },
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).constraints = null; },
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).constraints = []; },
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).constraints = { kind: 'target', targetKind: 'card', min: 1, max: 2, distinct: true }; },
    ];
    for (const corrupt of corruptions) {
      const state = setup(); add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
      expect(activate(state).ok).toBe(true);
      corrupt(state);
      const before = structuredClone(state);
      const decisionId = state.abilityRuntime!.pendingDecision!.id;
      let result: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
      expect(() => {
        result = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] });
      }).not.toThrow();
      expect(result?.ok).toBe(false);
      expect(state).toEqual(before);
    }
  });

  it('fails closed through the DTO boundary when FB2-49 target or context metadata is malformed', () => {
    const corruptions: Array<(state: GameState) => void> = [
      state => { (state.abilityRuntime!.pendingDecision as any).target = null; },
      state => { (state.abilityRuntime!.pendingDecision as any).target = []; },
      state => { (state.abilityRuntime!.pendingDecision as any).target = { id: 'frozen_non_residual_attack_to_keep', type: 'card_instance', count: null }; },
      state => { (state.abilityRuntime!.pendingDecision as any).target = { id: 'frozen_non_residual_attack_to_keep', type: 'card_instance', count: { min: 1, max: 1 }, forged: true }; },
      state => { (state.abilityRuntime!.pendingDecision as any).context = null; },
      state => { (state.abilityRuntime!.pendingDecision as any).context = []; },
      state => { (state.abilityRuntime!.pendingDecision as any).context = { controllerId: 'p1', sourceCardId: SOURCE_ID, abilityId: ABILITY_ID, variables: null, selections: {} }; },
      state => { (state.abilityRuntime!.pendingDecision as any).context = { controllerId: 'p1', sourceCardId: SOURCE_ID, abilityId: ABILITY_ID, variables: {}, selections: {}, forged: true }; },
    ];
    for (const corrupt of corruptions) {
      const state = setup(); add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
      expect(activate(state).ok).toBe(true);
      const decisionId = state.abilityRuntime!.pendingDecision!.id;
      corrupt(state);
      const before = structuredClone(state);
      let result: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
      expect(() => {
        result = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] });
      }).not.toThrow();
      expect(result?.ok).toBe(false);
      expect(state).toEqual(before);
    }
  });

  it('fails closed atomically when the serialized FB2-49 queue container or tail is malformed', () => {
    {
      const state = setup(); add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
      expect(activate(state).ok).toBe(true);
      const validHead = structuredClone(state.abilityRuntime!.pendingOpponentCloseToOne![0]!);
      (state.abilityRuntime as any).pendingOpponentCloseToOne = { 0: validHead };
      const decisionId = state.abilityRuntime!.pendingDecision!.id;
      const before = structuredClone(state);
      let result: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
      expect(() => {
        result = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] });
      }).not.toThrow();
      expect(result?.ok).toBe(false);
      expect(state).toEqual(before);
    }

    const tailCorruptions: Array<(state: GameState) => void> = [
      state => { (state.abilityRuntime!.pendingOpponentCloseToOne as any[])[1] = null; },
      state => { (state.abilityRuntime!.pendingOpponentCloseToOne as any[])[1] = { ...state.abilityRuntime!.pendingOpponentCloseToOne![1], qualifyingCardIds: null }; },
      state => { (state.abilityRuntime!.pendingOpponentCloseToOne as any[])[1] = { ...state.abilityRuntime!.pendingOpponentCloseToOne![1], battlefieldId: 'shinto' }; },
    ];
    for (const corrupt of tailCorruptions) {
      const state = setup();
      add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2'); add(state, 'p3-a', 'p3'); add(state, 'p3-b', 'p3');
      expect(activate(state).ok).toBe(true);
      expect(state.abilityRuntime!.pendingOpponentCloseToOne?.map((entry) => entry.decisionPlayerId)).toEqual(['p2', 'p3']);
      const decisionId = state.abilityRuntime!.pendingDecision!.id;
      corrupt(state);
      const before = structuredClone(state);
      let result: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
      expect(() => {
        result = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] });
      }).not.toThrow();
      expect(result?.ok).toBe(false);
      expect(state).toEqual(before);
      expect(state.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: true, faceDown: false });
      expect(state.abilityRuntime!.pendingDecision?.controllerId).toBe('p2');
    }
  });

  it('fails closed atomically when a valid serialized FB2-49 tail is truncated', () => {
    const state = setup();
    add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2'); add(state, 'p3-a', 'p3'); add(state, 'p3-b', 'p3');
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.pendingOpponentCloseToOne?.map((entry) => entry.decisionPlayerId)).toEqual(['p2', 'p3']);
    expect(state.abilityRuntime!.pendingOpponentCloseToOne?.[0]?.remainingDecisionPlayerIds).toEqual(['p2', 'p3']);
    expect(state.abilityRuntime!.pendingOpponentCloseToOne?.[1]?.remainingDecisionPlayerIds).toEqual(['p3']);
    expect((state.abilityRuntime!.pendingDecision!.interaction as any).remainingDecisionPlayerIds).toEqual(['p2', 'p3']);
    state.abilityRuntime!.pendingOpponentCloseToOne!.splice(1, 1);
    const before = structuredClone(state);
    const decisionId = state.abilityRuntime!.pendingDecision!.id;
    let result: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
    expect(() => {
      result = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] });
    }).not.toThrow();
    expect(result?.ok).toBe(false);
    expect(state).toEqual(before);
    expect(state.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.cardState['p3-a']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.cardState['p3-b']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.pendingDecision?.controllerId).toBe('p2');
  });

  it('rejects coherent queue truncation even when every serialized continuation mirror is rewritten', () => {
    const state = setup();
    add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2'); add(state, 'p3-a', 'p3'); add(state, 'p3-b', 'p3');
    expect(activate(state).ok).toBe(true);
    state.abilityRuntime!.pendingOpponentCloseToOne!.splice(1, 1);
    state.abilityRuntime!.pendingOpponentCloseToOne![0]!.remainingDecisionPlayerIds = ['p2'];
    (state.abilityRuntime!.pendingDecision!.interaction as any).remainingDecisionPlayerIds = ['p2'];
    (state.abilityRuntime as any).trustedOpponentCloseToOneCommitment = {
      initiatingControllerId: 'p1', sourceCardId: SOURCE_ID, abilityId: ABILITY_ID, battlefieldId: 'fuyuki-bridge', decisionPlayerIds: ['p2'],
    };
    const before = structuredClone(state);
    const decisionId = state.abilityRuntime!.pendingDecision!.id;
    let result: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
    expect(() => {
      result = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] });
    }).not.toThrow();
    expect(result?.ok).toBe(false);
    expect(state).toEqual(before);
    expect(state.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.cardState['p3-a']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.cardState['p3-b']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.pendingDecision?.controllerId).toBe('p2');
  });

  it('fails closed atomically when FB2-49 synthetic continuation metadata is malformed', () => {
    const corruptions: Array<(state: GameState) => void> = [
      state => { (state.abilityRuntime!.pendingDecision as any).remainingEffects = null; },
      state => { (state.abilityRuntime!.pendingDecision as any).remainingEffects = {}; },
      state => { (state.abilityRuntime!.pendingDecision as any).remainingEffects = [{ id: 'forged', type: 'draw', count: 1 }]; },
    ];
    for (const corrupt of corruptions) {
      const state = setup(); add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
      expect(activate(state).ok).toBe(true);
      const decisionId = state.abilityRuntime!.pendingDecision!.id;
      corrupt(state);
      const before = structuredClone(state);
      let result: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
      expect(() => {
        result = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] });
      }).not.toThrow();
      expect(result?.ok).toBe(false);
      expect(state).toEqual(before);
      expect(state.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: true, faceDown: false });
      expect(state.abilityRuntime!.pendingDecision?.controllerId).toBe('p2');
    }
  });
  it('fails closed atomically when FB2-49 root envelopes contain forged extra metadata', () => {
    const corruptions: Array<(state: GameState) => void> = [
      state => { (state.abilityRuntime!.pendingDecision as any).forgedExtra = 'x'; },
      state => { (state.abilityRuntime!.pendingDecision!.interaction as any).forgedExtra = 'x'; },
    ];
    for (const corrupt of corruptions) {
      const state = setup();
      add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
      expect(activate(state).ok).toBe(true);
      const decisionId = state.abilityRuntime!.pendingDecision!.id;
      corrupt(state);
      const before = structuredClone(state);
      let result: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
      expect(() => {
        result = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] });
      }).not.toThrow();
      expect(result?.ok).toBe(false);
      expect(state).toEqual(before);
      expect(state.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: true, faceDown: false });
      expect(state.abilityRuntime!.pendingDecision?.controllerId).toBe('p2');
    }
  });

  it('rejects malformed qualifying opponent card runtime states at activation and settlement', () => {
    const malformedStates: unknown[] = [
      'forged', [], 7,
      { active: true, faceDown: 'false', playedRound: 1 },
      { active: true, faceDown: false },
      { active: 'true', faceDown: false, playedRound: 1 },
      { active: true, faceDown: false, playedRound: '1' },
    ];
    for (const malformed of malformedStates) {
      const activation = setup(); add(activation, 'p2-a', 'p2'); add(activation, 'p2-b', 'p2');
      (activation.abilityRuntime!.cardState as any)['p2-b'] = structuredClone(malformed);
      const activationBefore = structuredClone(activation);
      let activationResult: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
      expect(() => { activationResult = activate(activation); }).not.toThrow();
      expect(activationResult?.ok).toBe(false);
      expect(activation).toEqual(activationBefore);
      expect(activation.abilityRuntime!.pendingDecision).toBeUndefined();
      expect(activation.abilityRuntime!.pendingOpponentCloseToOne).toBeUndefined();

      const settlement = setup(); add(settlement, 'p2-a', 'p2'); add(settlement, 'p2-b', 'p2');
      expect(activate(settlement).ok).toBe(true);
      const decisionId = settlement.abilityRuntime!.pendingDecision!.id;
      (settlement.abilityRuntime!.cardState as any)['p2-b'] = structuredClone(malformed);
      const settlementBefore = structuredClone(settlement);
      let settlementResult: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
      expect(() => {
        settlementResult = rules.dispatchAbilityCommand(settlement, 'p2', {
          type: 'choose_target', decisionId, selectedIds: ['p2-a'],
        });
      }).not.toThrow();
      expect(settlementResult?.ok).toBe(false);
      expect(settlement).toEqual(settlementBefore);
      expect(settlement.abilityRuntime!.pendingDecision?.controllerId).toBe('p2');
      expect(settlement.abilityRuntime!.pendingOpponentCloseToOne).toHaveLength(1);
    }
  });

  it('rejects future frozen-card drift even when the serialized future queue and suffixes are coherently truncated', () => {
    const state = setup();
    add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2'); add(state, 'p3-a', 'p3'); add(state, 'p3-b', 'p3');
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.pendingOpponentCloseToOne?.map((entry) => entry.decisionPlayerId)).toEqual(['p2', 'p3']);

    state.abilityRuntime!.cardState['p3-b']!.faceDown = true;
    state.abilityRuntime!.pendingOpponentCloseToOne!.splice(1, 1);
    state.abilityRuntime!.pendingOpponentCloseToOne![0]!.remainingDecisionPlayerIds = ['p2'];
    (state.abilityRuntime!.pendingDecision!.interaction as any).remainingDecisionPlayerIds = ['p2'];

    const before = structuredClone(state);
    const decisionId = state.abilityRuntime!.pendingDecision!.id;
    let result: ReturnType<typeof rules.dispatchAbilityCommand> | undefined;
    expect(() => {
      result = rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] });
    }).not.toThrow();
    expect(result?.ok).toBe(false);
    expect(state).toEqual(before);
    expect(state.abilityRuntime!.cardState['p2-b']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.cardState['p3-b']).toMatchObject({ active: true, faceDown: true });
    expect(state.abilityRuntime!.pendingDecision?.controllerId).toBe('p2');
    expect(state.abilityRuntime!.pendingOpponentCloseToOne?.map((entry) => entry.decisionPlayerId)).toEqual(['p2']);
  });

  it('restores FB2-49 authority through an opaque server-issued handle instead of serialized authority contents', () => {
    const state = setup();
    add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2'); add(state, 'p3-a', 'p3'); add(state, 'p3-b', 'p3');
    expect(activate(state).ok).toBe(true);
    const authority = exportOpponentCloseToOneServerAuthority(state);
    expect(authority?.entries.map((entry) => entry.decisionPlayerId)).toEqual(['p2', 'p3']);
    const handle = persistOpponentCloseToOneServerAuthority(state);
    expect(handle).toEqual({ token: expect.stringMatching(/^fb2-49-authority:[0-9a-f]{48}$/) });

    const restored = structuredClone(state);
    expect(restoreOpponentCloseToOneServerAuthority(restored, handle)).toBe(true);
    expect(choose(restored, 'p2', ['p2-a']).ok).toBe(true);
    expect(restored.abilityRuntime!.pendingDecision?.controllerId).toBe('p3');
    expect(restored.abilityRuntime!.pendingOpponentCloseToOne?.map((entry) => entry.decisionPlayerId)).toEqual(['p3']);
  });

  it('rejects coherent queue plus persisted-authority forgery after MatchSession restore', () => {
    const state = setup();
    add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2'); add(state, 'p3-a', 'p3'); add(state, 'p3-b', 'p3');
    expect(activate(state).ok).toBe(true);
    const decisionId = state.abilityRuntime!.pendingDecision!.id;
    const handle = persistOpponentCloseToOneServerAuthority(state)!;
    const baseSnapshot = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2', 'p3'] }).serializeSession();
    const snapshot: any = { ...baseSnapshot, state: structuredClone(state), opponentCloseToOneServerAuthority: structuredClone(handle) };

    snapshot.state.abilityRuntime.cardState['p3-b'].faceDown = true;
    snapshot.state.abilityRuntime.pendingOpponentCloseToOne.splice(1, 1);
    snapshot.state.abilityRuntime.pendingOpponentCloseToOne[0].remainingDecisionPlayerIds = ['p2'];
    snapshot.state.abilityRuntime.pendingDecision.interaction.remainingDecisionPlayerIds = ['p2'];
    // The same untrusted input may try to restore the old raw-authority shape too.
    snapshot.opponentCloseToOneServerAuthority = { nextIndex: 0, entries: structuredClone(snapshot.state.abilityRuntime.pendingOpponentCloseToOne) };

    const restored = rules.restoreMatchSession(snapshot);
    const before = structuredClone(restored.state);
    let result: ReturnType<typeof restored.dispatchPlayerAction> | undefined;
    expect(() => { result = restored.dispatchPlayerAction('p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] }); }).not.toThrow();
    expect(result?.ok).toBe(false);
    expect(restored.state).toEqual(before);
    expect(restored.state.abilityRuntime!.pendingOpponentCloseToOne?.map((entry) => entry.decisionPlayerId)).toEqual(['p2']);
    expect(restored.state.abilityRuntime!.cardState['p3-b']).toMatchObject({ active: true, faceDown: true });
  });

  it('rejects transplanting a valid authority capability from a different serialized transaction', () => {
    const donor = setup();
    add(donor, 'p2-a', 'p2'); add(donor, 'p2-b', 'p2');
    expect(activate(donor).ok).toBe(true);
    const donorHandle = persistOpponentCloseToOneServerAuthority(donor)!;

    const target = setup();
    add(target, 'p2-a', 'p2'); add(target, 'p2-b', 'p2'); add(target, 'p3-a', 'p3'); add(target, 'p3-b', 'p3');
    expect(activate(target).ok).toBe(true);
    const decisionId = target.abilityRuntime!.pendingDecision!.id;
    target.abilityRuntime!.pendingOpponentCloseToOne!.splice(1, 1);
    target.abilityRuntime!.pendingOpponentCloseToOne![0].remainingDecisionPlayerIds = ['p2'];
    target.abilityRuntime!.pendingDecision!.interaction!.remainingDecisionPlayerIds = ['p2'];

    const baseSnapshot = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2', 'p3'] }).serializeSession();
    const restored = rules.restoreMatchSession({
      ...baseSnapshot,
      state: structuredClone(target),
      opponentCloseToOneServerAuthority: structuredClone(donorHandle),
    } as any);
    const before = structuredClone(restored.state);
    let result: ReturnType<typeof restored.dispatchPlayerAction> | undefined;
    expect(() => { result = restored.dispatchPlayerAction('p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] }); }).not.toThrow();
    expect(result?.ok).toBe(false);
    expect(restored.state).toEqual(before);
  });

  it('fails closed without raw exceptions for malformed persisted authority handles', () => {
    const malformedAuthorityValues: unknown[] = [
      null, [], 'forged', 7, true, {}, { nextIndex: 0 },
      { token: 7 }, { token: 'fb2-49-authority:not-hex' },
      { token: 'fb2-49-authority:' + 'a'.repeat(48), extra: true },
    ];
    for (const malformed of malformedAuthorityValues) {
      const state = setup(); add(state, 'p2-a', 'p2'); add(state, 'p2-b', 'p2');
      expect(activate(state).ok).toBe(true);
      const decisionId = state.abilityRuntime!.pendingDecision!.id;
      const baseSnapshot = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2', 'p3'] }).serializeSession();
      const snapshot: any = { ...baseSnapshot, state: structuredClone(state), opponentCloseToOneServerAuthority: structuredClone(malformed) };
      const restored = rules.restoreMatchSession(snapshot);
      const before = structuredClone(restored.state);
      let result: ReturnType<typeof restored.dispatchPlayerAction> | undefined;
      expect(() => { result = restored.dispatchPlayerAction('p2', { type: 'choose_target', decisionId, selectedIds: ['p2-a'] }); }).not.toThrow();
      expect(result?.ok).toBe(false);
      expect(restored.state).toEqual(before);
    }
  });

  it('treats a live close-forbid as an atomic failure instead of partially closing the frozen set', () => {
    const state = setup();
    add(state, 'p2-keep', 'p2'); add(state, 'p2-protected', 'p2', PROTECTED_DEF); add(state, 'p2-other', 'p2');
    expect(activate(state).ok).toBe(true);
    installCloseForbid(state, 'p2', PROTECTED_DEF);
    const before = structuredClone(state);
    expect(choose(state, 'p2', ['p2-keep']).ok).toBe(false);
    expect(state).toEqual(before);
    expect(state.abilityRuntime!.cardState['p2-protected']).toMatchObject({ active: true, faceDown: false });
    expect(state.abilityRuntime!.cardState['p2-other']).toMatchObject({ active: true, faceDown: false });
  });
});
