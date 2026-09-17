import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { isPrivateOptionalHandPlayInteractionCandidate, isPrivateOptionalHandPlayInteractionSemantic } from '../../src/ability/interaction-gateway';
import { MatchSession, restoreMatchSession } from '../../src/match-session';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const archivePath = 'data/authoring/servants/servant.drake.json';
const ridingDefinitionId = 'servant.drake.skill.sc-drake-1';
const mountSummonAbilityId = 'sc-drake-1.mount-summon';

function archive() { return JSON.parse(readFileSync(archivePath, 'utf8')); }

function setup() {
  const raw = archive();
  raw.cards.push(...[2, 3, 4].map((power) => ({
    id: `fixture.interaction-basic-${power}`,
    name: `Interaction Basic ${power}`,
    cardType: 'basic_attack',
    cardFace: { cost: power, basePower: power },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    abilities: [],
  })));
  const pack = rules.loadAuthoringJson(raw);
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.mana = 12;
  state.players[0]!.servantCardId = 'servant.drake';
  rules.initializeAbilityRuntime(state, pack, { seed: 42 });
  return state;
}

function add(state: GameState, definitionId: string, zone = 'hand', owner = 'p1') {
  const instanceId = `interaction-card-${state.cards.length}`;
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

function openInteraction(state: GameState, extraDefinitions: string[] = []) {
  const riding = add(state, ridingDefinitionId, 'skill');
  const low2 = add(state, 'fixture.interaction-basic-2');
  const low3 = add(state, 'fixture.interaction-basic-3');
  const extras = extraDefinitions.map((definitionId) => add(state, definitionId));
  const high4 = add(state, 'fixture.interaction-basic-4');
  const enemyLow = add(state, 'fixture.interaction-basic-2', 'hand', 'p2');
  expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: riding }).ok).toBe(true);
  const opened = rules.dispatchAbilityCommand(state, 'p1', {
    type: 'activate_ability',
    cardInstanceId: riding,
    abilityId: mountSummonAbilityId,
  });
  expect(opened.ok).toBe(true);
  return { riding, low2, low3, extras, high4, enemyLow };
}

describe('P3-TO-13 private optional target interaction gateway', () => {
  it('classifies the semantic shape independently from card and ability identity', () => {
    const pack = rules.loadAuthoringJson(archive());
    const ability = pack.cards[ridingDefinitionId]!.abilities.find((candidate) => candidate.id === mountSummonAbilityId)!;
    expect(isPrivateOptionalHandPlayInteractionCandidate(ability)).toBe(true);
    expect(isPrivateOptionalHandPlayInteractionSemantic(ability)).toBe(true);

    const renamed = structuredClone(ability);
    renamed.id = 'renamed-private-optional-hand-play';
    expect(isPrivateOptionalHandPlayInteractionSemantic(renamed)).toBe(true);

    const malformed = structuredClone(ability);
    malformed.targets[0]!.visibility = 'public';
    expect(isPrivateOptionalHandPlayInteractionCandidate(malformed)).toBe(true);
    expect(isPrivateOptionalHandPlayInteractionSemantic(malformed)).toBe(false);
  });

  it('projects only the owner candidate snapshot and safe interaction metadata', () => {
    const state = setup();
    const { riding, low2, low3, high4, enemyLow } = openInteraction(state);
    const owner = rules.projectAbilityState(state, 'p1');
    const observer = rules.projectAbilityState(state, 'p2');

    expect(owner.pendingDecision).toMatchObject({
      candidates: [low2, low3],
      min: 0,
      max: 3,
      template: 'target',
      sourceCardInstanceId: riding,
      abilityId: mountSummonAbilityId,
      createdRevision: owner.revision,
      visibility: 'owner_only',
      cancelPolicy: 'forbidden',
    });
    expect(owner.pendingDecision!.candidates).not.toContain(high4);
    expect(owner.pendingDecision!.candidates).not.toContain(enemyLow);
    expect(JSON.stringify(owner)).not.toContain('continuationRef');
    expect(observer.pendingDecision).toBeUndefined();
    expect(observer.waitingLabel).toBeTruthy();
    expect(JSON.stringify(observer)).not.toContain(low2);
    expect(JSON.stringify(observer)).not.toContain(low3);
  });

  it('keeps the interaction identity and snapshot stable through MatchSession serialize/restore', () => {
    const state = setup();
    openInteraction(state);
    const ownerBefore = rules.projectAbilityState(state, 'p1').pendingDecision!;
    const session = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2'] });
    session.state = structuredClone(state);
    const restored = restoreMatchSession(session.serializeSession());
    const ownerAfter = restored.getClientProjection('p1');
    const observerAfter = restored.getClientProjection('p2');

    expect(ownerAfter.view.pendingDecision).toEqual(ownerBefore);
    expect(ownerAfter.interactionWindows).toContainEqual(expect.objectContaining({
      id: ownerBefore.id,
      kind: 'target',
      controllerId: 'p1',
      template: 'target',
      createdRevision: ownerBefore.createdRevision,
      visibility: 'owner_only',
      cancelPolicy: 'forbidden',
      abilityId: mountSummonAbilityId,
    }));
    expect(observerAfter.view.pendingDecision).toBeUndefined();
    expect(observerAfter.interactionWindows.some((window) => window.id === ownerBefore.id)).toBe(false);
    expect(JSON.stringify(ownerAfter)).not.toContain('continuationRef');
    expect(JSON.stringify(observerAfter)).not.toContain('continuationRef');
  });

  it('revalidates against both the server snapshot and current state before settlement', () => {
    const state = setup();
    const { low2 } = openInteraction(state);
    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;

    const late = add(state, 'fixture.interaction-basic-2');
    let before = JSON.stringify(state);
    let result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [late],
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('illegal_target');
    expect(JSON.stringify(state)).toBe(before);

    state.cards.find((card) => card.instanceId === low2)!.zone = 'discard';
    before = JSON.stringify(state);
    result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [low2],
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('illegal_target');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('rejects wrong owner, duplicate targets, corrupt continuation state, and terminal replay mutation-free', () => {
    const state = setup();
    const { low2 } = openInteraction(state);
    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;

    let before = JSON.stringify(state);
    let result = rules.dispatchAbilityCommand(state, 'p2', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [],
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('illegal_decision');
    expect(JSON.stringify(state)).toBe(before);

    before = JSON.stringify(state);
    result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [low2, low2],
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('illegal_target');
    expect(JSON.stringify(state)).toBe(before);

    state.abilityRuntime!.pendingDecision!.interaction!.continuationRef = 'forged-continuation';
    before = JSON.stringify(state);
    result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [],
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('resolution_failed');
    expect(JSON.stringify(state)).toBe(before);

    state.abilityRuntime!.pendingDecision!.interaction!.continuationRef = `${decision.id}:continuation`;
    state.abilityRuntime!.pendingDecision!.interaction!.createdRevision += 1;
    before = JSON.stringify(state);
    result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [],
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('resolution_failed');
    expect(JSON.stringify(state)).toBe(before);

    state.abilityRuntime!.pendingDecision!.interaction!.createdRevision = state.abilityRuntime!.revision;
    result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [],
    });
    expect(result.ok).toBe(true);
    const afterCommit = JSON.stringify(state);
    result = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [],
    });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('illegal_decision');
    expect(JSON.stringify(state)).toBe(afterCommit);
  });

  it('preserves the pending interaction when downstream aggregate payment fails and allows zero selection', () => {
    const state = setup();
    const { low3, extras } = openInteraction(state, ['fixture.interaction-basic-3']);
    const another3 = extras[0]!;
    state.players[0]!.mana = 5;
    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    const before = JSON.stringify(state);

    const failed = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [low3, another3],
    });
    expect(failed.ok).toBe(false);
    expect(JSON.stringify(state)).toBe(before);

    const declinedByZero = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: [],
    });
    expect(declinedByZero.ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });
});
