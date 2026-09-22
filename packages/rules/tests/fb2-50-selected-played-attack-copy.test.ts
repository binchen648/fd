import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SOURCE_DEF = 'test.fb2-50.source';
const SOURCE_ID = 'fb2-50-source-p1';
const ABILITY_ID = 'test.fb2-50.selected-copy';
const ATTACK_DEF = 'test.fb2-50.attack';
const OTHER_ATTACK_DEF = 'test.fb2-50.other-attack';
const MASTER_ATTACK_DEF = 'test.fb2-50.master-attack';
const NON_ATTACK_DEF = 'test.fb2-50.non-attack';

function ability(): any {
  return {
    id: ABILITY_ID,
    kind: 'phase_action',
    printedClause: 'synthetic identity-free FB2-50',
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [
      { type: 'source_active' },
      { type: 'gt', left: { var: 'controller.deployment_bonus' }, right: 0 },
    ],
    targets: [{
      id: 'selected_attack',
      type: 'card_instance',
      scope: { zone: 'attack_area', owner: 'controller', controller: 'self' },
      constraints: [{ type: 'is_attack' }, { type: 'played_this_round' }, { type: 'not_source_card' }],
      count: { min: 1, max: 1 },
    }],
    effects: [{ type: rules.SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_EFFECT, target: 'selected_attack' }],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {},
    visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
    execution: { mode: 'automatic' },
  };
}

function archive(rawAbility: any = ability()): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive',
    id: 'test.fb2-50', name: 'FB2-50 synthetic', class: 'Test',
    cards: [{
      id: SOURCE_DEF, name: 'FB2-50 source', cardType: 'servant_skill', owner: { type: 'servant', id: 'test.fb2-50' },
      cardFace: { typeLabel: 'noble', attributes: ['noble'], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [rawAbility],
    }],
  };
}

function compiledCard(id: string, cardType = 'servant_attack'): any {
  return {
    id, name: id, cardType, cardFace: { typeLabel: 'test', attributes: ['agility'], cost: 3, basePower: 5 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], mode: 'automatic', abilities: [],
  };
}

function setup(): GameState {
  const loaded = rules.loadAuthoringJson(archive());
  expect(loaded.report).toEqual([]);
  loaded.cards[ATTACK_DEF] = compiledCard(ATTACK_DEF);
  loaded.cards[OTHER_ATTACK_DEF] = compiledCard(OTHER_ATTACK_DEF);
  loaded.cards[MASTER_ATTACK_DEF] = compiledCard(MASTER_ATTACK_DEF, 'master_deck_card');
  loaded.cards[NON_ATTACK_DEF] = compiledCard(NON_ATTACK_DEF, 'master_skill');
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{
    instanceId: SOURCE_ID, definitionId: SOURCE_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1',
    zone: 'attack_area', visibility: { scope: 'public' },
  }];
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'shinto';
  (state as any).modeState = { terrainAssignments: { miyama_town: ['p1'] } };
  rules.initializeAbilityRuntime(state, loaded, { seed: 5001 });
  state.abilityRuntime!.cardState[SOURCE_ID] = { active: true, faceDown: false, playedRound: 0 };
  return state;
}

function addAttack(
  state: GameState,
  instanceId: string,
  options: { definitionId?: string; owner?: string; controller?: string; zone?: string; playedRound?: number; active?: boolean; faceDown?: boolean } = {},
): void {
  const owner = options.owner ?? 'p1';
  const controller = options.controller ?? owner;
  state.cards.push({
    instanceId,
    definitionId: options.definitionId ?? ATTACK_DEF,
    ownerPlayerId: owner,
    controllerPlayerId: controller,
    zone: options.zone ?? 'attack_area',
    visibility: { scope: 'public' },
  });
  state.abilityRuntime!.cardState[instanceId] = {
    active: options.active ?? true,
    faceDown: options.faceDown ?? false,
    playedRound: options.playedRound ?? state.round.roundNumber,
  };
}

function activate(state: GameState) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE_ID, abilityId: ABILITY_ID });
}
function choose(state: GameState, selectedIds: string[]) {
  const decision = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds });
}
function gatewayReport(rawAbility: any) { return rules.loadAuthoringJson(archive(rawAbility)).report; }

function generatedCopy(state: GameState) {
  return state.cards.find((card) => card.generatedBy === SOURCE_ID && card.instanceId !== SOURCE_ID);
}

describe('P3-FB2-50 selected played attack temporary copy', () => {
  it('admits only the exact identity-free whole-ability envelope', () => {
    const raw = ability();
    expect(rules.isSelectedPlayedAttackTemporaryCopyCandidate(raw)).toBe(true);
    expect(rules.isAcceptedSelectedPlayedAttackTemporaryCopyAbility(raw, 'authoring')).toBe(true);
    const loaded = rules.loadAuthoringJson(archive(raw));
    expect(loaded.report).toEqual([]);
    expect(rules.isAcceptedSelectedPlayedAttackTemporaryCopyAbility(loaded.cards[SOURCE_DEF]!.abilities[0]!, 'compiled')).toBe(true);

    const malformed: any[] = [];
    const wrongPhase = structuredClone(raw); wrongPhase.activation.phase = 'combat'; malformed.push(wrongPhase);
    const wrongWindow = structuredClone(raw); wrongWindow.activation.opens = 'controller_combat_action_window'; malformed.push(wrongWindow);
    const missingSource = structuredClone(raw); missingSource.conditions.shift(); malformed.push(missingSource);
    const wrongMetric = structuredClone(raw); wrongMetric.conditions[1].left.var = 'game.round_number'; malformed.push(wrongMetric);
    const genericTarget = structuredClone(raw); genericTarget.targets[0].scope.owner = 'any'; malformed.push(genericTarget);
    const wrongConstraint = structuredClone(raw); wrongConstraint.targets[0].constraints[1] = { type: 'source_active' }; malformed.push(wrongConstraint);
    const payload = structuredClone(raw); payload.effects[0].destination = 'hand'; malformed.push(payload);
    const genericClone = structuredClone(raw); genericClone.effects[0] = { type: 'create_card', cardId: 'anything', to: { zone: 'attack_area' } }; malformed.push(genericClone);
    for (const candidate of malformed.slice(0, -1)) {
      expect(gatewayReport(candidate)).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'selectedPlayedAttackTemporaryCopy.gateway', status: 'unsupported' }),
      ]));
    }
    expect(rules.isSelectedPlayedAttackTemporaryCopyCandidate(genericClone)).toBe(false);
  });

  it('offers only current-round controller attacks other than the source', () => {
    const state = setup();
    addAttack(state, 'eligible');
    addAttack(state, 'master-attack', { definitionId: MASTER_ATTACK_DEF });
    addAttack(state, 'previous', { playedRound: state.round.roundNumber - 1 });
    addAttack(state, 'hand', { zone: 'hand' });
    addAttack(state, 'opponent-owned', { owner: 'p2', controller: 'p2' });
    addAttack(state, 'foreign-controlled', { owner: 'p1', controller: 'p2' });
    addAttack(state, 'non-attack', { definitionId: NON_ATTACK_DEF });
    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision?.candidates).toEqual(['eligible', 'master-attack']);
    expect(state.abilityRuntime!.pendingDecision?.min).toBe(1);
    expect(state.abilityRuntime!.pendingDecision?.max).toBe(1);
  });

  it('copies exactly one selected definition into a free active face-up temporary attack without play semantics', () => {
    const state = setup();
    state.players[0]!.mana = 9;
    addAttack(state, 'chosen', { definitionId: OTHER_ATTACK_DEF });
    const manaBefore = state.players[0]!.mana;
    const countersBefore = structuredClone(state.abilityRuntime!.playCounters);
    const playedEventsBefore = state.abilityRuntime!.events.filter((event) => event.type === 'on_card_played').length;

    expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    const decisionId = state.abilityRuntime!.pendingDecision!.id;
    expect(choose(state, ['chosen']).ok).toBe(true);

    const copy = generatedCopy(state);
    expect(copy).toMatchObject({
      definitionId: OTHER_ATTACK_DEF, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area',
      visibility: { scope: 'public' }, generatedBy: SOURCE_ID,
    });
    expect(copy?.instanceId).not.toBe('chosen');
    expect(state.abilityRuntime!.cardState[copy!.instanceId]).toEqual({ active: true, faceDown: false, playedRound: 0 });
    expect(state.players[0]!.mana).toBe(manaBefore);
    expect(state.abilityRuntime!.playCounters).toEqual(countersBefore);
    expect(state.abilityRuntime!.events.filter((event) => event.type === 'on_card_played')).toHaveLength(playedEventsBefore);
    expect(state.abilityRuntime!.ongoingEffects).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceCardId: copy!.instanceId, policyKey: rules.SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_POLICY, expiresAtRound: state.round.roundNumber + 1 }),
    ]));

    const replay = rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId, selectedIds: ['chosen'] });
    expect(replay.ok).toBe(false);
    expect(state.cards.filter((card) => card.generatedBy === SOURCE_ID)).toHaveLength(1);
  });

  it('removes the temporary copy at the next round even if it was already closed', () => {
    const state = setup(); addAttack(state, 'chosen');
    expect(activate(state).ok).toBe(true); expect(choose(state, ['chosen']).ok).toBe(true);
    const copy = generatedCopy(state)!;
    state.abilityRuntime!.cardState[copy.instanceId]!.active = false;
    state.abilityRuntime!.cardState[copy.instanceId]!.faceDown = true;
    const nextRound = state.round.roundNumber + 1;
    rules.advanceAbilityPhase(state, 'preparation', nextRound);
    expect(state.cards.find((card) => card.instanceId === copy.instanceId)?.zone).toBe('removed_from_game');
    expect(state.abilityRuntime!.cardState[copy.instanceId]?.active).toBe(false);
    expect(state.abilityRuntime!.ongoingEffects.some((entry) => entry.sourceCardId === copy.instanceId)).toBe(false);
  });

  it('fails closed mutation-free when selection or authoritative target provenance drifts', () => {
    const corruptions: Array<(state: GameState) => void> = [
      state => { state.cards.find((card) => card.instanceId === 'chosen')!.zone = 'hand'; },
      state => { state.cards.find((card) => card.instanceId === 'chosen')!.controllerPlayerId = 'p2'; },
      state => { state.cards.find((card) => card.instanceId === 'chosen')!.ownerPlayerId = 'p2'; },
      state => { state.abilityRuntime!.cardState['chosen']!.playedRound = state.round.roundNumber - 1; },
      state => { state.cards.find((card) => card.instanceId === 'chosen')!.definitionId = NON_ATTACK_DEF; },
    ];
    for (const corrupt of corruptions) {
      const state = setup(); addAttack(state, 'chosen');
      expect(activate(state).ok).toBe(true);
      corrupt(state);
      const before = structuredClone(state);
      expect(choose(state, ['chosen']).ok).toBe(false);
      expect(state).toEqual(before);
    }
  });

  it('revalidates source/deployment conditions at settlement and rejects forged decisions atomically', () => {
    {
      const state = setup(); addAttack(state, 'chosen'); expect(activate(state).ok).toBe(true);
      state.abilityRuntime!.cardState[SOURCE_ID]!.active = false;
      const before = structuredClone(state);
      expect(choose(state, ['chosen']).ok).toBe(false);
      expect(state).toEqual(before);
    }
    {
      const state = setup(); addAttack(state, 'chosen'); expect(activate(state).ok).toBe(true);
      (state as any).modeState.terrainAssignments.miyama_town = [];
      const before = structuredClone(state);
      expect(choose(state, ['chosen']).ok).toBe(false);
      expect(state).toEqual(before);
    }
    {
      const state = setup(); addAttack(state, 'chosen'); addAttack(state, 'other'); expect(activate(state).ok).toBe(true);
      const before = structuredClone(state);
      expect(choose(state, ['forged']).ok).toBe(false);
      expect(state).toEqual(before);
    }
  });

  it('survives structured-clone persistence and settles exactly once', () => {
    const state = setup(); addAttack(state, 'chosen');
    expect(activate(state).ok).toBe(true);
    const restored = structuredClone(state);
    const decisionId = restored.abilityRuntime!.pendingDecision!.id;
    expect(rules.dispatchAbilityCommand(restored, 'p1', { type: 'choose_target', decisionId, selectedIds: ['chosen'] }).ok).toBe(true);
    expect(restored.cards.filter((card) => card.generatedBy === SOURCE_ID)).toHaveLength(1);
    const settled = structuredClone(restored);
    expect(rules.dispatchAbilityCommand(restored, 'p1', { type: 'choose_target', decisionId, selectedIds: ['chosen'] }).ok).toBe(false);
    expect(restored).toEqual(settled);
  });

  it('rejects forged persisted pending payloads before executing them', () => {
    const state = setup(); addAttack(state, 'chosen');
    expect(activate(state).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    pending.remainingEffects = [{ type: 'adjust_victory_points', player: 'controller', amount: 99 }];
    const before = structuredClone(state);
    expect(choose(state, ['chosen']).ok).toBe(false);
    expect(state).toEqual(before);
  });

  it('fails closed transactionally on corrupted persisted temporary-copy lifecycle state', () => {
    const state = setup(); addAttack(state, 'chosen');
    expect(activate(state).ok).toBe(true); expect(choose(state, ['chosen']).ok).toBe(true);
    const copy = generatedCopy(state)!;
    copy.generatedBy = 'forged-generator';
    const before = structuredClone(state);
    expect(() => rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1)).toThrow(/Corrupt temporary attack-copy card state/);
    expect(state).toEqual(before);
  });
});