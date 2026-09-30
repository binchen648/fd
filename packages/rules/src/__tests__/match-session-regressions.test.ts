import { describe, expect, it } from 'vitest';
import { createMatchSession, resolveBattlefield, restoreMatchSession, type GameState } from '../index';
import type { ActivateAbilityAction } from '../ability/types';

function mutableState(session: ReturnType<typeof createMatchSession>): GameState {
  return (session as unknown as { state: GameState }).state;
}

function setPriority(state: GameState, playerId: string, phase: GameState['round']['activePhase']): void {
  const player = state.players.find((candidate) => candidate.id === playerId);
  expect(player).toBeDefined();
  state.round.activePhase = phase;
  state.round.prioritySeat = player!.seat;
}

function moveDeckCardsToHand(state: GameState, playerId: string, count: number): string[] {
  const cards = state.cards.filter((card) => card.ownerPlayerId === playerId && card.zone === 'deck').slice(0, count);
  expect(cards).toHaveLength(count);
  for (const card of cards) {
    card.zone = 'hand';
    card.visibility = { scope: 'owner_only', ownerPlayerId: playerId };
  }
  return cards.map((card) => card.instanceId);
}

describe('match session gameplay regressions', () => {
  it('drops eliminated players from durable terrain assignment authority after scoring', () => {
    const session = createMatchSession({ seed: 20207105, humanPlayerId: 'p1', maxActionsPerPlayer: 2 });
    expect(session.runFullMatch({ maxRounds: 1 })).toBe('match_complete');
    const durable = session.serializeSession();
    const mode = (durable.state as unknown as { modeState?: { terrainAssignments?: Record<string, string[]>; terrainAssignmentSlots?: Record<string, Record<string, number>> } }).modeState;
    const active = new Set(durable.state.players.filter((player) => player.status === 'active').map((player) => player.id));
    for (const [locationId, assigned] of Object.entries(mode?.terrainAssignments ?? {})) {
      for (const playerId of assigned) {
        expect(active.has(playerId)).toBe(true);
        expect(durable.state.players.find((player) => player.id === playerId)?.locationId).toBe(locationId);
      }
      expect(Object.keys(mode?.terrainAssignmentSlots?.[locationId] ?? {}).every((playerId) => assigned.includes(playerId))).toBe(true);
    }
    expect(() => restoreMatchSession(durable)).not.toThrow();
  });

  it('projects correct basic special attack costs and power', () => {
    const session = createMatchSession({ seed: 20260906 });
    const pack = mutableState(session).abilityRuntime!.pack.cards;

    expect(pack['basic.preparation']?.cardFace).toMatchObject({ cost: 1, basePower: 2 });
    expect(pack['basic.surveil']?.cardFace).toMatchObject({ cost: 1, basePower: 3 });
    expect(pack['basic.luck']?.cardFace).toMatchObject({ cost: 0, basePower: 4 });
  });

  it('does not offer ordinary advance deployment to recon', () => {
    const session = createMatchSession({ seed: 20260906, humanPlayerId: 'p1' });
    const state = mutableState(session);
    setPriority(state, 'p1', 'advance');
    delete state.players.find((player) => player.id === 'p1')!.locationId;

    const actions = session.getPlayerView('p1').legalActions;
    expect(actions).not.toContainEqual({ type: 'deploy_player', locationId: 'recon' });
    expect(actions).toContainEqual({ type: 'deploy_player', locationId: 'magic_workshop' });

    const result = session.dispatchPlayerAction('p1', { type: 'deploy_player', locationId: 'recon' });
    expect(result.ok).toBe(false);
    expect(result.rejection?.code).toBe('illegal_deployment');
  });

  it('keeps command spell effects reusable while seals remain', () => {
    const session = createMatchSession({ seed: 20260906, humanPlayerId: 'p1' });
    const state = mutableState(session);
    setPriority(state, 'p1', 'action');
    const commandSpell = state.cards.find((card) =>
      card.controllerPlayerId === 'p1' &&
      state.abilityRuntime?.pack.cards[card.definitionId]?.cardType === 'command_spell');
    expect(commandSpell).toBeDefined();

    const before = session.getPlayerView('p1').legalActions
      .filter((action): action is ActivateAbilityAction =>
        action.type === 'activate_ability' && action.cardInstanceId === commandSpell!.instanceId)
      .map((action) => action.abilityId)
      .sort();
    expect(before).toEqual(['command-spell.free-move', 'command-spell.gain-mana', 'command-spell.power-victory']);

    const result = session.dispatchPlayerAction('p1', {
      type: 'activate_ability',
      cardInstanceId: commandSpell!.instanceId,
      abilityId: 'command-spell.gain-mana',
    });
    expect(result.ok).toBe(true);
    expect((state.players.find((player) => player.id === 'p1') as { commandSpells?: number }).commandSpells).toBe(2);

    const after = session.getPlayerView('p1').legalActions
      .filter((action): action is ActivateAbilityAction =>
        action.type === 'activate_ability' && action.cardInstanceId === commandSpell!.instanceId)
      .map((action) => action.abilityId)
      .sort();
    expect(after).toEqual(['command-spell.free-move', 'command-spell.gain-mana', 'command-spell.power-victory']);
  });

  it('allows the normal two-card attack batch and rejects a third attack in the round', () => {
    const session = createMatchSession({ seed: 20260906, humanPlayerId: 'p1' });
    const state = mutableState(session);
    setPriority(state, 'p1', 'action');
    state.players.find((player) => player.id === 'p1')!.mana = 10;
    const [first, second, third] = moveDeckCardsToHand(state, 'p1', 3);

    const staged = session.dispatchPlayerAction('p1', { type: 'stage_attack_card', cardInstanceId: first! });
    expect(staged.ok).toBe(true);
    expect(session.getPlayerView('p1').legalActions).toContainEqual({ type: 'stage_attack_card', cardInstanceId: second });
    expect(session.dispatchPlayerAction('p1', { type: 'stage_attack_card', cardInstanceId: second! }).ok).toBe(true);

    const confirmed = session.dispatchPlayerAction('p1', { type: 'confirm_staged_attack' });
    expect(confirmed.ok).toBe(true);

    const thirdResult = session.dispatchPlayerAction('p1', { type: 'play_card', cardInstanceId: third! });
    expect(thirdResult.ok).toBe(false);
    expect(thirdResult.rejection?.code).toBe('attack_play_limit_reached');
  });

  it('resolves next-round battlefield deployment VP choices into exact terrain slots', () => {
    const session = createMatchSession({ seed: 20205889, humanPlayerId: 'p2' });
    const state = mutableState(session);
    state.round.roundNumber = 2;
    setPriority(state, 'p2', 'advance');
    const p1 = state.players.find((player) => player.id === 'p1')!;
    const p2 = state.players.find((player) => player.id === 'p2')!;
    p1.locationId = 'miyama_town';
    delete p2.locationId;
    p2.vp = 5;
    state.cards.push({
      instanceId: 'tomoe-inferno-source', definitionId: 'servant.tomoe.skill.sc-tomoe-2',
      ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'public' },
    });
    (state as unknown as { activeStatuses?: Array<Record<string, unknown>> }).activeStatuses = [{
      id: 'inferno_fire', sourceControllerId: 'p1', sourceCardInstanceId: 'tomoe-inferno-source', abilityId: 'sc-tomoe-2.inferno-fire',
      duration: 'next_round', scope: 'opponents_deploying_to_this_battlefield', locationId: 'miyama_town', createdRound: 1,
    }];

    const staged = session.dispatchPlayerAction('p2', { type: 'deploy_player', locationId: 'miyama_town' });
    expect(staged.ok).toBe(true);
    expect(p2.locationId).toBeUndefined();
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toEqual(['vp:0', 'vp:1', 'vp:2', 'vp:3', 'vp:4', 'vp:5']);

    const paid = session.dispatchPlayerAction('p2', { type: 'choose_target', decisionId: decision.id, selectedIds: ['vp:1'] });
    expect(paid.ok).toBe(true);
    expect(p2.vp).toBe(4);
    expect(p2.locationId).toBe('miyama_town');
    expect((state as unknown as { modeState?: { terrainAssignments?: Record<string, string[]>; terrainAssignmentSlots?: Record<string, Record<string, number>> } }).modeState?.terrainAssignments?.miyama_town).toContain('p2');
    expect((state as unknown as { modeState?: { terrainAssignmentSlots?: Record<string, Record<string, number>> } }).modeState?.terrainAssignmentSlots?.miyama_town?.p2).toBe(1);

    const p3 = state.players.find((player) => player.id === 'p3')!;
    delete p3.locationId;
    p3.vp = 5;
    setPriority(state, 'p3', 'advance');
    expect(session.dispatchPlayerAction('p3', { type: 'deploy_player', locationId: 'miyama_town' }).ok).toBe(true);
    const p3Decision = state.abilityRuntime!.pendingDecision!;
    expect(session.dispatchPlayerAction('p3', { type: 'choose_target', decisionId: p3Decision.id, selectedIds: ['vp:3'] }).ok).toBe(true);
    expect((state as unknown as { modeState?: { terrainAssignmentSlots?: Record<string, Record<string, number>> } }).modeState?.terrainAssignmentSlots?.miyama_town?.p3).toBe(0);

    const durable = session.serializeSession();
    expect(restoreMatchSession(durable).getState().players.find((player) => player.id === 'p2')!.locationId).toBe('miyama_town');
    const forgedSlots: any = structuredClone(durable);
    forgedSlots.state.modeState.terrainAssignmentSlots.miyama_town.p2 = 0;
    expect(() => restoreMatchSession(forgedSlots)).toThrow('Invalid MatchSession state container');

    const result = resolveBattlefield(state, { battlefieldId: 'miyama_town' }).nextState.battleResults.at(-1)!;
    expect(result.participantBreakdowns.find((entry) => entry.playerId === 'p2')?.modifiers)
      .toContainEqual(expect.objectContaining({ source: 'location', value: 1 }));
    expect(result.participantBreakdowns.find((entry) => entry.playerId === 'p3')?.modifiers)
      .toContainEqual(expect.objectContaining({ source: 'location', value: 3 }));
  });

  it('keeps a zero-VP deployment paused until the mandatory vp:0 choice resolves', () => {
    const session = createMatchSession({ seed: 20260906, humanPlayerId: 'p2' });
    const state = mutableState(session);
    state.round.roundNumber = 2;
    setPriority(state, 'p2', 'advance');
    const p1 = state.players.find((player) => player.id === 'p1')!;
    const p2 = state.players.find((player) => player.id === 'p2')!;
    p1.locationId = 'miyama_town';
    delete p2.locationId;
    p2.vp = 0;
    state.cards.push({
      instanceId: 'tomoe-zero-vp-inferno-source', definitionId: 'servant.tomoe.skill.sc-tomoe-2',
      ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'public' },
    });
    (state as unknown as { activeStatuses?: Array<Record<string, unknown>> }).activeStatuses = [{
      id: 'inferno_fire', sourceControllerId: 'p1', sourceCardInstanceId: 'tomoe-zero-vp-inferno-source', abilityId: 'sc-tomoe-2.inferno-fire',
      duration: 'next_round', scope: 'opponents_deploying_to_this_battlefield', locationId: 'miyama_town', createdRound: 1,
    }];

    const staged = session.dispatchPlayerAction('p2', { type: 'deploy_player', locationId: 'miyama_town' });
    expect(staged.ok).toBe(true);
    expect(p2.locationId).toBeUndefined();
    expect(p2.vp).toBe(0);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.interaction?.kind).toBe('deployment_terrain_vp_choice_v1');
    expect(decision.candidates).toEqual(['vp:0']);

    const resolved = session.dispatchPlayerAction('p2', { type: 'choose_target', decisionId: decision.id, selectedIds: ['vp:0'] });
    expect(resolved.ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(p2.vp).toBe(0);
    expect(p2.locationId).toBe('miyama_town');
    expect((state as unknown as { modeState?: { terrainAssignments?: Record<string, string[]>; terrainAssignmentSlots?: Record<string, Record<string, number>> } }).modeState?.terrainAssignments?.miyama_town ?? []).not.toContain('p2');
    expect((state as unknown as { modeState?: { terrainAssignmentSlots?: Record<string, Record<string, number>> } }).modeState?.terrainAssignmentSlots?.miyama_town?.p2).toBeUndefined();
  });

  it('expires the deployment terrain-payment status after its exact next round', () => {
    const session = createMatchSession({ seed: 20260906, humanPlayerId: 'p2' });
    const state = mutableState(session);
    state.round.roundNumber = 3;
    setPriority(state, 'p2', 'advance');
    delete state.players.find((player) => player.id === 'p2')!.locationId;
    state.cards.push({
      instanceId: 'tomoe-expired-inferno-source', definitionId: 'servant.tomoe.skill.sc-tomoe-2',
      ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'public' },
    });
    (state as unknown as { activeStatuses?: Array<Record<string, unknown>> }).activeStatuses = [{
      id: 'inferno_fire', sourceControllerId: 'p1', sourceCardInstanceId: 'tomoe-expired-inferno-source', abilityId: 'sc-tomoe-2.inferno-fire',
      duration: 'next_round', scope: 'opponents_deploying_to_this_battlefield', locationId: 'miyama_town', createdRound: 1,
    }];
    const result = session.dispatchPlayerAction('p2', { type: 'deploy_player', locationId: 'miyama_town' });
    expect(result.ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.players.find((player) => player.id === 'p2')!.locationId).toBe('miyama_town');
  });

  it('preserves deployment terrain slots when another player later moves into the battlefield', () => {
    const session = createMatchSession({ seed: 20205889, humanPlayerId: 'p1' });
    const state = mutableState(session);
    for (const playerId of ['p3', 'p4']) {
      setPriority(state, playerId, 'advance');
      delete state.players.find((player) => player.id === playerId)!.locationId;
      expect(session.dispatchPlayerAction(playerId, { type: 'deploy_player', locationId: 'miyama_town' }).ok).toBe(true);
    }
    state.players.find((player) => player.id === 'p1')!.locationId = 'miyama_town';

    const result = resolveBattlefield(state, { battlefieldId: 'miyama_town' }).nextState.battleResults.at(-1);
    expect(result?.participantBreakdowns.find((entry) => entry.playerId === 'p3')?.modifiers)
      .toContainEqual(expect.objectContaining({ source: 'location', value: 3 }));
    expect(result?.participantBreakdowns.find((entry) => entry.playerId === 'p4')?.modifiers)
      .toContainEqual(expect.objectContaining({ source: 'location', value: 1 }));
    expect(result?.participantBreakdowns.find((entry) => entry.playerId === 'p1')?.modifiers ?? [])
      .not.toContainEqual(expect.objectContaining({ source: 'location' }));
  });

  it('applies remote operation terrain doubling and win bonus from the real special card', () => {
    const session = createMatchSession({ seed: 20205889, humanPlayerId: 'p1' });
    const state = mutableState(session);
    setPriority(state, 'p3', 'advance');
    expect(session.dispatchPlayerAction('p3', { type: 'deploy_player', locationId: 'miyama_town' }).ok).toBe(true);
    state.cards.push({
      instanceId: 'test-p3-basic-preparation',
      definitionId: 'basic.preparation',
      ownerPlayerId: 'p3',
      controllerPlayerId: 'p3',
      zone: 'attack_area',
      visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState['test-p3-basic-preparation'] = {
      active: true,
      faceDown: false,
      playedRound: state.round.roundNumber,
    };

    const result = resolveBattlefield(state, { battlefieldId: 'miyama_town' }).nextState.battleResults.at(-1);
    expect(result?.winnerPlayerId).toBe('p3');
    expect(result?.participantBreakdowns.find((entry) => entry.playerId === 'p3')?.modifiers)
      .toContainEqual(expect.objectContaining({ source: 'location', value: 6 }));
    expect(result?.vpAdjustments).toContainEqual(expect.objectContaining({
      playerId: 'p3',
      delta: 2,
      label: 'basic.preparation.win_bonus',
    }));
  });

  it('offers dash movement in action phase only after the special card is active', () => {
    const session = createMatchSession({ seed: 20260908, humanPlayerId: 'p1' });
    const state = mutableState(session);
    setPriority(state, 'p1', 'action');
    (state as unknown as { modeState?: { cardPlayForbids?: unknown[] } }).modeState ??= {};
    (state as unknown as { modeState: { cardPlayForbids?: unknown[] } }).modeState.cardPlayForbids = [];
    const player = state.players.find((candidate) => candidate.id === 'p1')!;
    player.locationId = 'miyama_town';
    player.mana = 10;
    const dash = state.cards.find((card) => card.ownerPlayerId === 'p1' && card.definitionId === 'basic.surveil');
    expect(dash).toBeDefined();
    dash!.zone = 'hand';
    dash!.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };

    expect(session.getPlayerView('p1').legalActions).not.toContainEqual(expect.objectContaining({
      type: 'activate_ability',
      cardInstanceId: dash!.instanceId,
      abilityId: 'basic.surveil.battle-dash',
    }));

    expect(session.dispatchPlayerAction('p1', { type: 'play_card', cardInstanceId: dash!.instanceId }).ok).toBe(true);
    const action = session.getPlayerView('p1').legalActions.find((candidate) =>
      candidate.type === 'activate_ability' &&
      candidate.cardInstanceId === dash!.instanceId &&
      candidate.abilityId === 'basic.surveil.battle-dash') as ActivateAbilityAction | undefined;
    expect(action).toBeDefined();
  });
});
