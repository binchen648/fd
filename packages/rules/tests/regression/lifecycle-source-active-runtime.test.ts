import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID } from '../../src/core/card-source-state';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.artoriac.json', 'utf8'));
const STAR_ID = 'servant.artoriac.skill.sc-artoriac-3';
const LIFECYCLE_ABILITY_ID = 'sc-artoriac-3.discard-public-and-power-formula';

function archiveWithCloseAction() {
  const cloned = structuredClone(raw);
  const star = cloned.cards.find((card: { id: string }) => card.id === STAR_ID)!;
  star.abilities.push({
    id: 'test-close-active-source',
    kind: 'phase_action',
    printedClause: 'test-only external Card Zone close owner',
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
    conditions: [],
    targets: [],
    effects: [{ type: 'close_source_card' }],
    cost: [],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic' },
  });
  return cloned;
}

function setup(source = raw) {
  const pack = rules.loadAuthoringJson(source);
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.mana = 12;
  state.players[0]!.servantCardId = source.id;
  rules.initializeAbilityRuntime(state, pack, { seed: 42 });
  return state;
}

function add(state: GameState, definitionId: string, zone = 'skill', owner = 'p1') {
  const instanceId = `lifecycle-card-${state.cards.length}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: owner,
    controllerPlayerId: owner,
    zone,
    visibility: { scope: 'owner_only', ownerPlayerId: owner },
  });
  return instanceId;
}

function play(state: GameState, cardInstanceId: string) {
  const action = rules.getLegalActions(state, 'p1').find(
    (candidate) => candidate.type === 'play_card' && candidate.cardInstanceId === cardInstanceId && !candidate.faceDown,
  );
  expect(action).toBeTruthy();
  const result = rules.dispatchAbilityCommand(state, 'p1', action!);
  expect(result.ok).toBe(true);
}

function closeSource(state: GameState, sourceCardId: string) {
  const action = rules.getLegalActions(state, 'p1').find(
    (candidate) => candidate.type === 'activate_ability' &&
      candidate.cardInstanceId === sourceCardId && candidate.abilityId === 'test-close-active-source',
  );
  expect(action).toBeTruthy();
  return rules.dispatchAbilityCommand(state, 'p1', action!);
}

describe('P3-TO-12 source-active lifecycle runtime', () => {
  it('installs a server-owned source-validity policy and stable lifecycle transition for the SC3 semantic shape', () => {
    const state = setup();
    const star = add(state, STAR_ID);
    const privateDiscard = add(state, 'test.private-discard', 'discard');

    play(state, star);

    const ongoing = state.abilityRuntime!.ongoingEffects.find(
      (entry) => entry.sourceCardId === star && entry.abilityId === LIFECYCLE_ABILITY_ID,
    );
    expect(ongoing).toMatchObject({
      sourceCardId: star,
      abilityId: LIFECYCLE_ABILITY_ID,
      duration: 'while_card_active',
      cleanup: 'when_card_leaves_active_area',
      sourceMustRemainActive: true,
      sourceDefinitionIdAtInstall: STAR_ID,
      sourceValidityPolicyId: ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID,
      policyKey: `while_card_active:when_card_leaves_active_area:${ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID}`,
    });
    expect(state.abilityRuntime!.lifecycleTransitions).toEqual([
      expect.objectContaining({ lifecycleId: ongoing!.id, kind: 'install', roundId: 1 }),
    ]);
    expect(rules.projectAbilityState(state, 'p2').cards).toContainEqual(
      expect.objectContaining({ instanceId: privateDiscard, definitionId: 'test.private-discard', zone: 'discard' }),
    );
  });

  it('keeps the source-bound lifecycle live across round identity changes while the source remains active', () => {
    const state = setup();
    const star = add(state, STAR_ID);
    play(state, star);
    const lifecycleId = state.abilityRuntime!.ongoingEffects.find((entry) => entry.sourceCardId === star)!.id;

    rules.advanceAbilityPhase(state, 'action', 2);

    expect(state.cards.find((card) => card.instanceId === star)).toMatchObject({ zone: 'attack_area' });
    expect(state.abilityRuntime!.ongoingEffects).toContainEqual(expect.objectContaining({ id: lifecycleId }));
    expect(state.abilityRuntime!.lifecycleTransitions!.filter((entry) => entry.lifecycleId === lifecycleId)).toHaveLength(1);
  });

  it('lets an external Card Zone close move the source, then tears down lifecycle state and visibility in the same dispatch', () => {
    const source = archiveWithCloseAction();
    const state = setup(source);
    const star = add(state, STAR_ID);
    const privateDiscard = add(state, 'test.private-discard', 'discard');
    play(state, star);
    const lifecycleId = state.abilityRuntime!.ongoingEffects.find(
      (entry) => entry.sourceCardId === star && entry.abilityId === LIFECYCLE_ABILITY_ID,
    )!.id;
    expect(rules.projectAbilityState(state, 'p2').cards.some((card) => card.instanceId === privateDiscard)).toBe(true);

    const result = closeSource(state, star);

    expect(result.ok).toBe(true);
    expect(state.cards.find((card) => card.instanceId === star)).toMatchObject({ zone: 'skill' });
    expect(state.abilityRuntime!.ongoingEffects.some((entry) => entry.id === lifecycleId)).toBe(false);
    expect(state.abilityRuntime!.lifecycleTransitions).toContainEqual(expect.objectContaining({
      lifecycleId,
      kind: 'source_invalidated',
    }));
    expect(rules.projectAbilityState(state, 'p2').cards.some((card) => card.instanceId === privateDiscard)).toBe(false);

    const restored = structuredClone(state);
    const transitionCount = restored.abilityRuntime!.lifecycleTransitions!.length;
    rules.projectAbilityState(restored, 'p1');
    rules.projectAbilityState(restored, 'p2');
    expect(restored.abilityRuntime!.lifecycleTransitions).toHaveLength(transitionCount);
    expect(restored.abilityRuntime!.ongoingEffects.some((entry) => entry.id === lifecycleId)).toBe(false);
  });

  it('assigns a fresh lifecycle incarnation when the same source is legitimately reinstalled in a later round', () => {
    const state = setup(archiveWithCloseAction());
    const star = add(state, STAR_ID);

    play(state, star);
    const firstLifecycleId = state.abilityRuntime!.ongoingEffects.find(
      (entry) => entry.sourceCardId === star && entry.abilityId === LIFECYCLE_ABILITY_ID,
    )!.id;
    expect(closeSource(state, star).ok).toBe(true);

    rules.advanceAbilityPhase(state, 'action', 2);
    state.round.prioritySeat = 1;
    state.players[0]!.mana = 12;
    play(state, star);
    const secondLifecycleId = state.abilityRuntime!.ongoingEffects.find(
      (entry) => entry.sourceCardId === star && entry.abilityId === LIFECYCLE_ABILITY_ID,
    )!.id;
    expect(secondLifecycleId).not.toBe(firstLifecycleId);
    expect(closeSource(state, star).ok).toBe(true);

    const firstTransitions = state.abilityRuntime!.lifecycleTransitions!.filter(
      (entry) => entry.lifecycleId === firstLifecycleId,
    );
    const secondTransitions = state.abilityRuntime!.lifecycleTransitions!.filter(
      (entry) => entry.lifecycleId === secondLifecycleId,
    );
    expect(firstTransitions.filter((entry) => entry.kind === 'install')).toHaveLength(1);
    expect(firstTransitions.filter((entry) => entry.kind === 'source_invalidated')).toHaveLength(1);
    expect(secondTransitions.filter((entry) => entry.kind === 'install')).toHaveLength(1);
    expect(secondTransitions.filter((entry) => entry.kind === 'source_invalidated')).toHaveLength(1);
  });

  it('rolls back an external close when mandatory lifecycle cleanup encounters a corrupt source-state policy', () => {
    const state = setup(archiveWithCloseAction());
    const star = add(state, STAR_ID);
    play(state, star);
    const ongoing = state.abilityRuntime!.ongoingEffects.find(
      (entry) => entry.sourceCardId === star && entry.abilityId === LIFECYCLE_ABILITY_ID,
    )!;
    ongoing.sourceValidityPolicyId = 'corrupt-policy';
    const before = JSON.stringify(state);

    expect(() => rules.dispatchAbilityCommand(state, 'p1', {
      type: 'activate_ability',
      cardInstanceId: star,
      abilityId: 'test-close-active-source',
    })).toThrow(/Unknown lifecycle source-validity policy/);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('fails closed when a restored source-bound lifecycle record loses its install transition identity', () => {
    const state = setup();
    const star = add(state, STAR_ID);
    play(state, star);
    const ongoing = state.abilityRuntime!.ongoingEffects.find(
      (entry) => entry.sourceCardId === star && entry.abilityId === LIFECYCLE_ABILITY_ID,
    )!;
    state.abilityRuntime!.lifecycleTransitions = state.abilityRuntime!.lifecycleTransitions!.filter(
      (entry) => entry.lifecycleId !== ongoing.id || entry.kind !== 'install',
    );

    expect(() => rules.projectAbilityState(structuredClone(state), 'p1')).toThrow(/install transition is missing/);
  });

  it('admits the lifecycle by semantic policy shape rather than the canonical ability id', () => {
    const renamed = structuredClone(raw);
    const starDefinition = renamed.cards.find((card: { id: string }) => card.id === STAR_ID)!;
    const lifecycleAbility = starDefinition.abilities.find((ability: { id: string }) => ability.id === LIFECYCLE_ABILITY_ID)!;
    lifecycleAbility.id = 'renamed-source-active-lifecycle';
    const state = setup(renamed);
    const star = add(state, STAR_ID);

    play(state, star);

    expect(state.abilityRuntime!.ongoingEffects).toContainEqual(expect.objectContaining({
      sourceCardId: star,
      abilityId: 'renamed-source-active-lifecycle',
      sourceValidityPolicyId: ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID,
    }));
  });

  it('fails loader admission for an unknown or malformed source-validity policy instead of guessing active zones', () => {
    const malformed = structuredClone(raw);
    const starDefinition = malformed.cards.find((card: { id: string }) => card.id === STAR_ID)!;
    const lifecycleAbility = starDefinition.abilities.find((ability: { id: string }) => ability.id === LIFECYCLE_ABILITY_ID)!;
    lifecycleAbility.lifecycle.sourceValidity.policyId = 'unknown-policy';

    const loaded = rules.loadAuthoringJson(malformed);

    expect(loaded.report).toContainEqual(expect.objectContaining({
      abilityId: LIFECYCLE_ABILITY_ID,
      path: 'lifecycle.sourceValidity',
      status: 'unsupported',
      reason: 'Unsupported Card Zone source-validity policy',
    }));
  });
});
