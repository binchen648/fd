import { expect } from 'vitest';
import { createMatchSession } from '../../src/match-session';
import type { AbilityCommand } from '../../src/ability/types';

export const humans = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
export type Session = ReturnType<typeof createMatchSession>;

/** Bounded Gate B fixture, NOT a naturally reached seven-player match. Definitions
 * are the unmodified production pack. Only starting phase/resources/zones change. */
export function fixture(definitionId: string) {
  const session = createMatchSession({ seed: 20260907, humanPlayerIds: humans });
  const source = session.state.cards.find(c => c.definitionId === definitionId)!;
  expect(source, definitionId).toBeDefined();
  const playerId = source.controllerPlayerId;
  const runtime = session.state.abilityRuntime!;
  session.state.round.activePhase = 'action';
  session.state.round.prioritySeat = session.state.players.find(p => p.id === playerId)!.seat;
  session.state.eventPlacements = [];
  session.state.currentSituationModifiers = [];
  Object.assign((session.state as any).modeState, { cardPlayForbids: [], closedLocations: [] });
  runtime.hostRequests = [];
  runtime.responseWindows = [];
  delete runtime.pendingDecision;
  for (const p of session.state.players) { p.mana = 12; p.locationId = 'magic_workshop'; }
  session.state.players.find(p => p.id === playerId)!.locationId = 'miyama_town';
  expect(session.dispatchPlayerAction(playerId, { type: 'skip_normal_move' }).ok).toBe(true);
  return { session, playerId, sourceId: source.instanceId };
}

export function player(session: Session, id: string) { return session.state.players.find(p => p.id === id)!; }
export function card(session: Session, id: string) { return session.state.cards.find(c => c.instanceId === id)!; }
export function active(session: Session, id: string) {
  card(session, id).zone = 'attack_area';
  card(session, id).visibility = { scope: 'public' };
  session.state.abilityRuntime!.cardState[id] = { active: true, faceDown: false, playedRound: session.state.round.roundNumber };
}
export function dispatch(session: Session, id: string, command: AbilityCommand) {
  const result = session.dispatchPlayerAction(id, command);
  expect(result.ok, JSON.stringify(result.rejection)).toBe(true);
  return result;
}
export function activate(session: Session, id: string, sourceId: string, abilityId: string) {
  return dispatch(session, id, { type: 'activate_ability', cardInstanceId: sourceId, abilityId });
}
export function choose(session: Session, id: string, selectedIds: string[]) {
  const decision = session.getPlayerView(id).pendingDecision!;
  expect(decision).toBeDefined();
  return dispatch(session, id, { type: 'choose_target', decisionId: decision.id, selectedIds });
}
export function playPair(session: Session, id: string, sourceId: string) {
  dispatch(session, id, { type: 'stage_attack_card', cardInstanceId: sourceId });
  const supplement = session.getPlayerView(id).legalActions.find(a => a.type === 'stage_attack_card' && a.faceDown);
  expect(supplement).toBeDefined();
  dispatch(session, id, supplement! as AbilityCommand);
  dispatch(session, id, { type: 'confirm_staged_attack' });
}
export function rejectAtomically(session: Session, id: string, command: AbilityCommand) {
  session.getPlayerView(id);
  const before = structuredClone(session.state);
  const result = session.dispatchPlayerAction(id, command);
  expect(result.ok).toBe(false);
  expect(result.events).toEqual([]);
  expect(session.state).toEqual(before);
}
