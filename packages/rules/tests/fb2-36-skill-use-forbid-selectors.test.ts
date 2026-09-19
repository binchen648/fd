import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const STATIC_SOURCE = 'fixture.fb2-36.static-source';
const PHASE_SOURCE = 'fixture.fb2-36.phase-source';
const TRUE_NAME_SKILL = 'fixture.fb2-36.true-name-skill';
const ORDINARY_SKILL = 'fixture.fb2-36.ordinary-skill';
const MASTER_SKILL = 'fixture.fb2-36.master-skill';
const EVENT_CARD = 'fixture.fb2-36.event';

function staticModifier(overrides: Record<string, unknown> = {}) {
  return {
    id: 'same-location-true-name-off-attack',
    operation: 'forbid',
    rule: 'skill_use',
    scope: { subject: 'players_at_source_location', skillCard: { notInAttack: true, trueNameRelease: true } },
    lifecycle: { duration: 'while_active' },
    ...overrides,
  };
}

function phaseModifier(overrides: Record<string, unknown> = {}) {
  return {
    id: 'same-location-opponent-facedown-skill',
    operation: 'forbid',
    rule: 'skill_use',
    scope: {
      subject: 'opponents_at_source_location',
      skillCard: { zones: ['master-skills', 'servant-skills'], face: 'down' },
    },
    lifecycle: { duration: 'this_round' },
    ...overrides,
  };
}

function staticAbility(modifier: any = staticModifier()) {
  return {
    id: 'static-forbid', kind: 'passive', printedClause: 'fixture', activation: {},
    conditions: [{ type: 'source_active' }], targets: [], effects: [], cost: [], creates: [],
    ruleModifiers: [modifier], lifecycle: { duration: 'while_active' }, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function phaseAbility(modifier: any = phaseModifier()) {
  return {
    id: 'phase-forbid', kind: 'phase_action', printedClause: 'fixture',
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
    conditions: [{ type: 'source_active' }], targets: [], effects: [], cost: [], creates: [],
    ruleModifiers: [modifier], lifecycle: { duration: 'this_round' }, responseWindow: {}, limit: {},
    visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function trueNameMarker() {
  return { id: 'true-name-release', kind: 'passive', printedClause: 'fixture', markers: ['真名解放'], execution: { mode: 'automatic' } };
}

function card(id: string, cardType: string, abilities: any[] = []) {
  return {
    id, name: id, cardType,
    cardFace: { cost: 0, basePower: cardType === 'servant_skill' ? 1 : 0, attributes: cardType === 'servant_skill' ? ['fixture'] : [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities,
  };
}

function archive(staticOverride?: any, phaseOverride?: any) {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: 'fixture.fb2-36', name: 'FB2-36 fixture', cards: [
      card(STATIC_SOURCE, 'servant_skill', [staticOverride ?? staticAbility()]),
      card(PHASE_SOURCE, 'servant_skill', [phaseOverride ?? phaseAbility()]),
      card(TRUE_NAME_SKILL, 'servant_skill', [trueNameMarker()]),
      card(ORDINARY_SKILL, 'servant_skill'),
      card(MASTER_SKILL, 'master_skill'),
      card(EVENT_CARD, 'event'),
    ],
  } as any;
}

function add(state: GameState, instanceId: string, definitionId: string, playerId: string, zone: 'skill' | 'attack_area', active = false, faceDown = false) {
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: playerId, controllerPlayerId: playerId, zone,
    visibility: zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: playerId },
  });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown, playedRound: state.round.roundNumber };
}

function setup() {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action';
  for (const player of state.players.slice(0, 3)) {
    player.locationId = 'miyama_town';
    player.mana = 20;
  }
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  return state;
}

function dispatchPlay(state: GameState, playerId: string, cardInstanceId: string) {
  state.round.prioritySeat = state.players.find((candidate) => candidate.id === playerId)!.seat;
  return rules.dispatchAbilityCommand(state, playerId, { type: 'play_card', cardInstanceId });
}

function activatePhaseForbid(state: GameState) {
  add(state, 'phase-source', PHASE_SOURCE, 'p1', 'attack_area', true, false);
  state.round.prioritySeat = state.players[0]!.seat;
  const action = rules.getLegalActions(state, 'p1').find((candidate) =>
    candidate.type === 'activate_ability' && candidate.cardInstanceId === 'phase-source' && candidate.abilityId === 'phase-forbid');
  expect(action).toBeDefined();
  expect(rules.dispatchAbilityCommand(state, 'p1', action!)).toEqual(expect.objectContaining({ ok: true }));
  expect(state.abilityRuntime!.ongoingEffects.some((entry) => entry.sourceCardId === 'phase-source' && entry.abilityId === 'phase-forbid')).toBe(true);
}

describe('P3-FB2-36 skill-use forbid selectors', () => {
  it('accepts only the two exact identity-free modifier shapes', () => {
    expect(rules.classifyAcceptedSkillUseForbidModifier(staticModifier())).toBe('same_location_true_name_off_attack');
    expect(rules.classifyAcceptedSkillUseForbidModifier(phaseModifier())).toBe('same_location_opponent_facedown_skill');

    const nearMatches = [
      staticModifier({ operation: 'ignore' }),
      staticModifier({ rule: 'use_skill_card' }),
      staticModifier({ scope: { subject: 'controller', skillCard: { notInAttack: true, trueNameRelease: true } } }),
      staticModifier({ scope: { subject: 'players_at_source_location', skillCard: { notInAttack: false, trueNameRelease: true } } }),
      staticModifier({ scope: { subject: 'players_at_source_location', skillCard: { notInAttack: true, trueNameRelease: true, extra: true } } }),
      staticModifier({ lifecycle: { duration: 'this_round' } }),
      phaseModifier({ scope: { subject: 'players_at_source_location', skillCard: { zones: ['master-skills', 'servant-skills'], face: 'down' } } }),
      phaseModifier({ scope: { subject: 'opponents_at_source_location', skillCard: { zones: ['master-skills'], face: 'down' } } }),
      phaseModifier({ scope: { subject: 'opponents_at_source_location', skillCard: { zones: ['master-skills', 'servant-skills'], face: 'up' } } }),
      phaseModifier({ lifecycle: { duration: 'while_active' } }),
    ];
    for (const modifier of nearMatches) expect(rules.classifyAcceptedSkillUseForbidModifier(modifier)).toBeUndefined();
  });

  it('loader admits the exact selectors and fails closed on near matches', () => {
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);
    expect(rules.loadAuthoringJson(archive(staticAbility(staticModifier({ operation: 'ignore' })))).report)
      .toContainEqual(expect.objectContaining({ status: 'unsupported', path: expect.stringContaining('ruleModifiers') }));
    expect(rules.loadAuthoringJson(archive(undefined, phaseAbility(phaseModifier({
      scope: { subject: 'opponents_at_source_location', skillCard: { zones: ['servant-skills'], face: 'down' } },
    })))).report).toContainEqual(expect.objectContaining({ status: 'unsupported', path: expect.stringContaining('ruleModifiers') }));
  });

  it('while-active passive blocks same-location structural true-name skill use and no other text-like card', () => {
    const blocked = setup();
    add(blocked, 'static-source', STATIC_SOURCE, 'p1', 'attack_area', true, false);
    add(blocked, 'true-name', TRUE_NAME_SKILL, 'p2', 'skill', false, false);
    expect(rules.definitionHasStructuralTrueNameRelease(blocked.abilityRuntime!.pack.cards[TRUE_NAME_SKILL])).toBe(true);
    expect(dispatchPlay(blocked, 'p2', 'true-name')).toEqual(expect.objectContaining({
      ok: false, rejection: expect.objectContaining({ code: 'play_forbidden' }),
    }));
    expect(blocked.cards.find((entry) => entry.instanceId === 'true-name')!.zone).toBe('skill');

    const ordinary = setup();
    add(ordinary, 'static-source', STATIC_SOURCE, 'p1', 'attack_area', true, false);
    add(ordinary, 'ordinary', ORDINARY_SKILL, 'p2', 'skill', false, false);
    expect(rules.definitionHasStructuralTrueNameRelease(ordinary.abilityRuntime!.pack.cards[ORDINARY_SKILL])).toBe(false);
    expect(dispatchPlay(ordinary, 'p2', 'ordinary').ok).toBe(true);
  });

  it('while-active relation is live-state based, includes the source controller, and stops when the source is inactive', () => {
    const away = setup();
    add(away, 'static-source', STATIC_SOURCE, 'p1', 'attack_area', true, false);
    add(away, 'true-name', TRUE_NAME_SKILL, 'p2', 'skill', false, false);
    away.players[1]!.locationId = 'recon';
    expect(dispatchPlay(away, 'p2', 'true-name').ok).toBe(true);

    const self = setup();
    add(self, 'static-source', STATIC_SOURCE, 'p1', 'attack_area', true, false);
    add(self, 'self-true-name', TRUE_NAME_SKILL, 'p1', 'skill', false, false);
    expect(dispatchPlay(self, 'p1', 'self-true-name').rejection?.code).toBe('play_forbidden');

    const inactive = setup();
    add(inactive, 'static-source', STATIC_SOURCE, 'p1', 'attack_area', false, false);
    add(inactive, 'true-name', TRUE_NAME_SKILL, 'p2', 'skill', false, false);
    expect(dispatchPlay(inactive, 'p2', 'true-name').ok).toBe(true);
  });

  it('this-round phase selector blocks only same-location opponent face-down skill-zone cards', () => {
    const blocked = setup();
    activatePhaseForbid(blocked);
    add(blocked, 'facedown-master', MASTER_SKILL, 'p2', 'skill', false, true);
    expect(dispatchPlay(blocked, 'p2', 'facedown-master').rejection?.code).toBe('play_forbidden');

    const faceUp = setup();
    activatePhaseForbid(faceUp);
    add(faceUp, 'faceup-master', MASTER_SKILL, 'p2', 'skill', false, false);
    expect(dispatchPlay(faceUp, 'p2', 'faceup-master').ok).toBe(true);

    const away = setup();
    activatePhaseForbid(away);
    add(away, 'facedown-master', MASTER_SKILL, 'p2', 'skill', false, true);
    away.players[1]!.locationId = 'recon';
    expect(dispatchPlay(away, 'p2', 'facedown-master').ok).toBe(true);

    const self = setup();
    activatePhaseForbid(self);
    add(self, 'self-facedown-master', MASTER_SKILL, 'p1', 'skill', false, true);
    expect(dispatchPlay(self, 'p1', 'self-facedown-master').ok).toBe(true);
  });

  it('this-round selector ignores non-skill cards and expires at the next round', () => {
    const nonSkill = setup();
    activatePhaseForbid(nonSkill);
    add(nonSkill, 'facedown-event', EVENT_CARD, 'p2', 'skill', false, true);
    expect(dispatchPlay(nonSkill, 'p2', 'facedown-event').ok).toBe(true);

    const expired = setup();
    activatePhaseForbid(expired);
    add(expired, 'facedown-master', MASTER_SKILL, 'p2', 'skill', false, true);
    expired.round.roundNumber += 1;
    expect(dispatchPlay(expired, 'p2', 'facedown-master').ok).toBe(true);
  });

  it('trusted batch play shares the same fail-closed play eligibility without mutation', () => {
    const state = setup();
    add(state, 'static-source', STATIC_SOURCE, 'p1', 'attack_area', true, false);
    add(state, 'true-name', TRUE_NAME_SKILL, 'p2', 'skill', false, false);
    const before = structuredClone(state);
    expect(() => rules.playAbilityCardBatch(state, 'p2', [{ cardInstanceId: 'true-name' }])).toThrow(/cannot be played/i);
    expect(state).toEqual(before);
  });
});