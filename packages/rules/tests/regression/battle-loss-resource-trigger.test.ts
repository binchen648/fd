import { describe, expect, it } from 'vitest';

import type { AuthoringAbility } from '../../src/ability/types';
import { createMatchSession } from '../../src/match-session';
import {
  isBattleLossResourceTriggerSemantic,
  processAbilityEvent,
  resolveBattlefield,
} from '../../src/index';

function commandSpells(session: ReturnType<typeof createMatchSession>, playerId = 'p1'): number {
  return Number((session.state.players.find((player) => player.id === playerId) as unknown as { commandSpells?: number }).commandSpells ?? 3);
}

function setCommandSpells(session: ReturnType<typeof createMatchSession>, value: number, playerId = 'p1'): void {
  (session.state.players.find((player) => player.id === playerId) as unknown as { commandSpells: number }).commandSpells = value;
}

function activateAttack(session: ReturnType<typeof createMatchSession>, ownerPlayerId: string, definitionId = 'basic.strength.5'): void {
  const card = session.state.cards.find((candidate) =>
    candidate.ownerPlayerId === ownerPlayerId && ['hand', 'deck'].includes(candidate.zone));
  if (!card) throw new Error(`Missing attack fixture card for ${ownerPlayerId}`);
  card.definitionId = definitionId;
  card.zone = 'attack_area';
  card.visibility = { scope: 'public' };
  session.state.abilityRuntime!.cardState[card.instanceId] = {
    active: true,
    faceDown: false,
    playedRound: session.state.round.roundNumber,
  };
}

function twoBattlefieldSession(): ReturnType<typeof createMatchSession> {
  const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1', humanPlayerIds: ['p1'] });
  expect(session.pairings.find((pairing) => pairing.playerId === 'p1')?.master.id).toBe('master.shinji');
  session.state.round.activePhase = 'battle';
  session.state.eventPlacements = [];
  session.state.currentSituationModifiers = [];
  for (const player of session.state.players) {
    player.militaryResult = 0;
    player.vp = 0;
    player.locationId = 'recon';
    (player as unknown as { commandSpells: number }).commandSpells = 3;
  }
  session.state.players.find((player) => player.id === 'p1')!.locationId = 'miyama_town';
  session.state.players.find((player) => player.id === 'p2')!.locationId = 'miyama_town';
  session.state.players.find((player) => player.id === 'p3')!.locationId = 'shinto';
  session.state.players.find((player) => player.id === 'p4')!.locationId = 'shinto';
  activateAttack(session, 'p2');
  activateAttack(session, 'p4');
  return session;
}

function resolveBattlePhase(session: ReturnType<typeof createMatchSession>): void {
  (session as unknown as { resolveBattlePhase: () => void }).resolveBattlePhase();
}

function syntheticBattleLossAbility(): AuthoringAbility {
  return {
    id: 'synthetic.battle-loss-resource',
    kind: 'forced_trigger',
    printedClause: 'synthetic',
    activation: { trigger: 'after_controller_loses_battle' },
    conditions: [],
    targets: [],
    effects: [{ type: 'adjust_command_seals', amount: -1, directive: 'synthetic_loss' }],
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

describe('P3-B13 battle loss resource trigger', () => {
  it('classifies the exact battle-loss resource semantic shape without identity routing', () => {
    const ability = syntheticBattleLossAbility();
    expect(isBattleLossResourceTriggerSemantic(ability)).toBe(true);

    const renamed = structuredClone(ability);
    renamed.id = 'completely-unrelated-id';
    expect(isBattleLossResourceTriggerSemantic(renamed)).toBe(true);

    const wrongTrigger = structuredClone(ability);
    wrongTrigger.activation.trigger = 'after_controller_wins_battle';
    expect(isBattleLossResourceTriggerSemantic(wrongTrigger)).toBe(false);

    const extraEffect = structuredClone(ability);
    extraEffect.effects.push({ type: 'adjust_victory_points', amount: 1 });
    expect(isBattleLossResourceTriggerSemantic(extraEffect)).toBe(false);

    const fractional = structuredClone(ability);
    fractional.effects[0]!.amount = -0.5;
    expect(isBattleLossResourceTriggerSemantic(fractional)).toBe(false);
  });

  it('does not settle a battle-result trigger inside the standalone battlefield resolver before scoring', () => {
    const session = twoBattlefieldSession();
    setCommandSpells(session, 3);

    const result = resolveBattlefield(session.state, { battlefieldId: 'miyama_town', revealHiddenEvents: true });

    expect(Number((result.nextState.players.find((player) => player.id === 'p1') as unknown as { commandSpells?: number }).commandSpells ?? 3)).toBe(3);
    expect(result.nextState.abilityRuntime!.processedEvents).toContain('battle:1:miyama_town');
    expect(result.nextState.abilityRuntime!.processedEvents.some((id) => id.includes(':lose:p1'))).toBe(false);
  });

  it('opens the post-scoring barrier only after both battlefield scoring results exist, then settles Shinji through typed Resource', () => {
    const session = twoBattlefieldSession();
    resolveBattlePhase(session);

    expect(commandSpells(session)).toBe(2);
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'command_seals_adjusted',
      playerId: 'p1',
      resource: 'command_seals',
      delta: -1,
      before: 3,
      after: 2,
      abilityId: 'clown.lose-command-seal',
    }));

    const barrierIndex = session.logs.findIndex((entry) => entry.type === 'battle_post_scoring_barrier_open');
    const resultDispatchIndex = session.logs.findIndex((entry) =>
      entry.type === 'battle_result_event_dispatched' && entry.payload?.battlefieldId === 'miyama_town');
    expect(barrierIndex).toBeGreaterThanOrEqual(0);
    expect(resultDispatchIndex).toBeGreaterThan(barrierIndex);
    expect(session.logs[barrierIndex]?.payload).toMatchObject({
      battlePhaseResolutionId: 'battle-phase:1',
      scoredBattlefieldIds: expect.arrayContaining(['miyama_town', 'shinto']),
    });
    expect(session.logs[resultDispatchIndex]?.payload).toMatchObject({
      battlePhaseResolutionId: 'battle-phase:1',
      battlefieldId: 'miyama_town',
      battleId: 'battle-phase:1:battle:miyama_town:1',
      resultId: 'battle-phase:1:battle:miyama_town:1:result',
    });
  });

  it('preserves the frozen battle-trigger eligibility when scoring eliminates the losing controller', () => {
    const session = twoBattlefieldSession();
    session.state.players.find((player) => player.id === 'p1')!.militaryResult = -7;

    resolveBattlePhase(session);

    expect(session.state.players.find((player) => player.id === 'p1')?.status).toBe('eliminated');
    expect(commandSpells(session)).toBe(2);
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'command_seals_adjusted',
      playerId: 'p1',
      abilityId: 'clown.lose-command-seal',
      before: 3,
      after: 2,
    }));
  });
  it('does not mutate command seals when Shinji wins instead of losing', () => {
    const session = twoBattlefieldSession();
    activateAttack(session, 'p1', 'basic.strength.5');
    const p2Attack = session.state.cards.find((card) => card.ownerPlayerId === 'p2' && card.zone === 'attack_area')!;
    p2Attack.definitionId = 'basic.strength.2';
    resolveBattlePhase(session);

    expect(commandSpells(session)).toBe(3);
    expect(session.state.abilityRuntime!.events.some((event) =>
      event.type === 'command_seals_adjusted' && event.abilityId === 'clown.lose-command-seal')).toBe(false);
  });

  it('treats a forced battle-loss command-seal effect as a no-op when no seals remain', () => {
    const session = twoBattlefieldSession();
    setCommandSpells(session, 0);
    const event = {
      id: 'battle-phase:1:battle:miyama_town:1:zero-seal-result',
      type: 'after_battle_result_determined',
      battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:miyama_town:1',
      resultId: 'battle-phase:1:battle:miyama_town:1:zero-seal-result',
      battleParticipantIds: ['p1', 'p2'],
      battlefieldId: 'miyama_town',
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    } as const;

    expect(() => processAbilityEvent(session.state, event)).not.toThrow();
    expect(commandSpells(session)).toBe(0);
    expect(session.state.abilityRuntime!.events.some((entry) =>
      entry.type === 'command_seals_adjusted' && entry.abilityId === 'clown.lose-command-seal')).toBe(false);
    expect(session.state.abilityRuntime!.processedEvents).toContain(`${event.id}:lose:p1`);
  });

  it('dedupes a stable post-scoring loss event and refuses to spend the command seal twice', () => {
    const session = twoBattlefieldSession();
    setCommandSpells(session, 3);
    const event = {
      id: 'battle-phase:1:battle:miyama_town:1:result',
      type: 'after_battle_result_determined',
      battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:miyama_town:1',
      resultId: 'battle-phase:1:battle:miyama_town:1:result',
      battlefieldId: 'miyama_town',
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    } as const;

    processAbilityEvent(session.state, event);
    expect(commandSpells(session)).toBe(2);
    const afterFirst = JSON.stringify(session.state);
    processAbilityEvent(session.state, event);
    expect(JSON.stringify(session.state)).toBe(afterFirst);
  });

  it('does not duplicate the real loss mutation when the same round battle phase is re-entered', () => {
    const session = twoBattlefieldSession();
    resolveBattlePhase(session);
    expect(commandSpells(session)).toBe(2);

    session.state.round.activePhase = 'battle';
    resolveBattlePhase(session);
    expect(commandSpells(session)).toBe(2);
  });
});
