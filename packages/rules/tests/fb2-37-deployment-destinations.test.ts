import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { createMatchSession } from '../src/match-session';

const SOURCE = 'fixture.fb2-37.deployment-source';

function modifier(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lower-vp-lone-battlefield-only',
    operation: 'replace',
    rule: 'deployment_destinations',
    scope: {
      subject: 'controller',
      destinationFilter: {
        locationKind: 'battlefield',
        opponentCountEquals: 1,
        opponentVictoryPoints: 'less_than_controller',
      },
    },
    lifecycle: { duration: 'permanent' },
    priority: { tier: 'card_text', specificity: 'explicit_exception' },
    conflictPolicy: 'explicit_exception_over_general',
    ...overrides,
  };
}

function ability(m: any = modifier()) {
  return {
    id: 'deployment-replacement', kind: 'passive', printedClause: 'fixture', activation: {},
    conditions: [{ type: 'source_owned' }], targets: [], effects: [], cost: [], creates: [],
    ruleModifiers: [m], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function archive(a: any = ability()) {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: 'fixture.fb2-37', name: 'FB2-37 fixture', cards: [{
      id: SOURCE, name: SOURCE, cardType: 'master_skill',
      cardFace: { cost: 0, basePower: 0, attributes: [] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [], abilities: [a],
    }],
  } as any;
}

function installStructuralSource(zone: string = 'skill') {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const session = createMatchSession({ seed: 20260920, humanPlayerId: 'p1' });
  const actor = session.state.players[0]!;
  const opponent = session.state.players[1]!;
  session.state.round.activePhase = 'advance';
  session.state.round.prioritySeat = actor.seat;
  for (const player of session.state.players) {
    delete player.locationId;
    player.vp = 0;
  }
  actor.vp = 5;
  opponent.vp = 2;
  opponent.locationId = 'shinto';
  session.state.abilityRuntime!.pack.cards[SOURCE] = pack.cards[SOURCE]!;
  session.state.cards.push({
    instanceId: 'fixture-fb2-37-source', definitionId: SOURCE,
    ownerPlayerId: actor.id, controllerPlayerId: actor.id, zone,
    visibility: { scope: 'owner_only', ownerPlayerId: actor.id },
  });
  return { session, actor, opponent };
}

describe('P3-FB2-37 exact deployment-destination replacement', () => {
  it('accepts only the exact structural modifier and ability envelope', () => {
    expect(rules.isAcceptedLowerVpLoneBattlefieldDeploymentModifier(modifier() as any)).toBe(true);
    expect(rules.isAcceptedLowerVpLoneBattlefieldDeploymentAbility(ability() as any)).toBe(true);

    const stringCount = modifier();
    (stringCount.scope.destinationFilter as any).opponentCountEquals = '1';
    const broadCount = modifier();
    (broadCount.scope.destinationFilter as any).opponentCountEquals = 2;
    const extraFilter = modifier();
    (extraFilter.scope.destinationFilter as any).extra = true;
    const wrongLifecycle = modifier({ lifecycle: { duration: 'this_round' } });
    const wrongPriority = modifier({ priority: { tier: 'card_text', specificity: 'general' } });
    const wrongConflict = modifier({ conflictPolicy: 'last_write_wins' });
    const wrongRule = modifier({ rule: 'movement_destinations' });

    for (const near of [stringCount, broadCount, extraFilter, wrongLifecycle, wrongPriority, wrongConflict, wrongRule]) {
      expect(rules.isAcceptedLowerVpLoneBattlefieldDeploymentModifier(near as any)).toBe(false);
    }
  });

  it('loads the exact shape automatically and fails closed for a recognized near match', () => {
    const exact = rules.loadAuthoringJson(archive());
    expect(exact.report).toEqual([]);
    expect(exact.cards[SOURCE]!.abilities[0]!.execution.mode).toBe('automatic');

    const near = modifier();
    (near.scope.destinationFilter as any).opponentCountEquals = '1';
    const rejected = rules.loadAuthoringJson(archive(ability(near)));
    expect(rejected.report.some((entry) => entry.status === 'unsupported')).toBe(true);
    expect(rejected.cards[SOURCE]!.abilities[0]!.execution.mode).toBe('unsupported');
  });

  it('replaces legal deployment choices with exactly the current lower-VP lone battlefield', () => {
    const { session, actor } = installStructuralSource();
    expect(session.legalDeploymentActions(actor.id)).toEqual([
      { type: 'deploy_player', locationId: 'shinto' },
    ]);
    const rejected = session.dispatchPlayerCommand(actor.id, { type: 'deploy_player', locationId: 'magic_workshop' });
    expect(rejected.ok).toBe(false);
    expect(rejected.rejection?.code).toBe('illegal_deployment');
  });

  it('keeps ordinary legal choices when no qualifying destination currently exists', () => {
    const { session, actor, opponent } = installStructuralSource();
    opponent.vp = 8;
    const actions = session.legalDeploymentActions(actor.id);
    expect(actions.length).toBeGreaterThan(1);
    expect(actions).toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });
  });

  it('uses current occupancy and requires exactly one active opponent at the destination', () => {
    const { session, actor, opponent } = installStructuralSource();
    const second = session.state.players[2]!;
    second.locationId = opponent.locationId;
    second.vp = 1;
    expect(session.legalDeploymentActions(actor.id)).toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });
    second.status = 'eliminated';
    expect(session.legalDeploymentActions(actor.id)).toEqual([{ type: 'deploy_player', locationId: 'shinto' }]);
  });

  it('does not apply when the structural source is outside an eligible source zone', () => {
    const { session, actor } = installStructuralSource('hand');
    expect(session.legalDeploymentActions(actor.id)).toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });
  });

  it('requires the structural source to be owned by its controller', () => {
    const { session, actor, opponent } = installStructuralSource();
    const source = session.state.cards.find((card) => card.instanceId === 'fixture-fb2-37-source')!;
    source.ownerPlayerId = opponent.id;
    expect(session.legalDeploymentActions(actor.id)).toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });
  });

  it('preserves the existing generic legacy product bridge behavior', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    const pairing = session.pairings.find((candidate) => candidate.master.id === 'master.kayneth')!;
    session.state.round.activePhase = 'advance';
    session.state.round.prioritySeat = pairing.seat;
    for (const player of session.state.players) {
      delete player.locationId;
      player.vp = 0;
    }
    const actor = session.state.players.find((candidate) => candidate.id === pairing.playerId)!;
    const opponent = session.state.players.find((candidate) => candidate.id !== pairing.playerId)!;
    actor.vp = 5;
    opponent.vp = 2;
    opponent.locationId = 'shinto';
    expect(session.legalDeploymentActions(actor.id)).toEqual([{ type: 'deploy_player', locationId: 'shinto' }]);
  });
});