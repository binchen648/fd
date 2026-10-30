import { describe, expect, it } from 'vitest';

import { createMatchSession } from '../../src/match-session';

const sourceDefinition = 'master.kiritsugu.skill.time-alter';
const abilityId = 'time-alter.action';
type Session = ReturnType<typeof createMatchSession>;

function pass(session: Session, preservedCardId?: string): void {
  const priority = session.state.players.find((player) => player.seat === session.state.round.prioritySeat)!;
  if (session.state.round.activePhase === 'action') {
    for (let step = 0; step < 10 && session.getPlayerView(priority.id).actionTurn?.regularPlay !== 'complete'; step++) {
      const actions = session.getPlayerView(priority.id).legalActions;
      const next = actions.find(action => action.type === 'skip_normal_move')
        ?? actions.find(action => action.type === 'confirm_staged_attack')
        ?? actions.find(action => action.type === 'complete_empty_regular_play')
        ?? actions.find(action => action.type === 'stage_attack_card' && action.cardInstanceId !== preservedCardId && !action.faceDown)
        ?? actions.find(action => action.type === 'stage_attack_card' && action.cardInstanceId !== preservedCardId);
      expect(next).toBeDefined();
      expect(session.dispatchPlayerAction(priority.id, next!).ok).toBe(true);
    }
  }
  expect(session.passPriority(priority.id).ok).toBe(true);
}

function reach(session: Session, playerId: string, phase: string): void {
  const seat = session.state.players.find((player) => player.id === playerId)!.seat;
  for (let step = 0; step < 30; step++) {
    if (session.state.round.activePhase === phase && session.state.round.prioritySeat === seat) return;
    pass(session);
  }
  throw new Error('Production phase progression did not reach the requested window');
}

function choose(session: Session, playerId: string, selectedIds: string[]) {
  const action = session.getPlayerView(playerId).legalActions.find((entry) => entry.type === 'choose_target')!;
  expect(action).toBeDefined();
  return session.dispatchPlayerAction(playerId, { type: 'choose_target', decisionId: action.decisionId, selectedIds });
}

function fixture() {
  const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
  const playerId = session.pairings.find((pairing) => pairing.master.id === 'master.kiritsugu')!.playerId;
  const sourceId = `${playerId}-${sourceDefinition}`;
  reach(session, playerId, 'preparation');
  const replacement = session.state.cards.find((card) => card.ownerPlayerId === playerId && card.zone === 'deck')!;
  expect(session.dispatchPlayerAction(playerId, {
    type: 'activate_ability', cardInstanceId: `${playerId}-master.kiritsugu.skill.magus-killer`, abilityId: 'magus-killer.setup',
  }).ok).toBe(true);
  expect(choose(session, playerId, [replacement.instanceId]).ok).toBe(true);
  expect(session.state.cards.find((card) => card.instanceId === replacement.instanceId)!.definitionId).toBe('master.kiritsugu.deck.origin-bullet');
  reach(session, playerId, 'action');
  expect(session.dispatchPlayerAction(playerId, { type: 'activate_ability', cardInstanceId: sourceId, abilityId }).ok).toBe(true);
  const ordinary = session.getPlayerView(playerId).legalActions.find((entry) => entry.type === 'choose_target')!.candidates[0]!;
  expect(choose(session, playerId, [ordinary]).ok).toBe(true);
  expect(session.state.cards.find((card) => card.instanceId === replacement.instanceId)!.zone).toBe('hand');
  for (let step = 0; step < 30 && session.state.round.activePhase !== 'round_end'; step++) pass(session, replacement.instanceId);
  expect(session.state.round.activePhase).toBe('round_end');
  session.runFullMatch({ maxRounds: 2 });
  expect(session.state.round.roundNumber).toBe(2);
  reach(session, playerId, 'action');
  return { session, playerId, sourceId, targetId: replacement.instanceId };
}

function activate(f: ReturnType<typeof fixture>) {
  return f.session.dispatchPlayerAction(f.playerId, { type: 'activate_ability', cardInstanceId: f.sourceId, abilityId });
}

describe('Time Alter user-ruling production path', () => {
  it('replaces and draws Origin Bullet through real setup before face-down effect play and one draw', () => {
    const f = fixture();
    const { session, playerId, sourceId, targetId } = f;
    const mana = session.state.players.find((player) => player.id === playerId)!.mana;
    const hand = session.state.cards.filter((card) => card.ownerPlayerId === playerId && card.zone === 'hand').length;
    const deck = session.state.cards.filter((card) => card.ownerPlayerId === playerId && card.zone === 'deck');
    const next = deck[0]!.instanceId;
    expect(activate(f).ok).toBe(true);
    const action = session.getPlayerView(playerId).legalActions.find((entry) => entry.type === 'choose_target')!;
    expect(action.candidates).toContain(targetId);
    expect(choose(session, playerId, [targetId]).ok).toBe(true);
    expect(session.state.cards.find((card) => card.instanceId === sourceId)!.zone).toBe('skill');
    expect(session.state.cards.find((card) => card.instanceId === targetId)).toMatchObject({
      zone: 'attack_area', visibility: { scope: 'owner_only', ownerPlayerId: playerId },
    });
    expect(session.state.abilityRuntime!.cardState[targetId]).toMatchObject({ active: false, faceDown: true, playedRound: 2 });
    expect(session.state.players.find((player) => player.id === playerId)!.mana).toBe(mana);
    expect(session.state.cards.find((card) => card.instanceId === next)!.zone).toBe('hand');
    expect(session.state.cards.filter((card) => card.ownerPlayerId === playerId && card.zone === 'deck')).toHaveLength(deck.length - 1);
    expect(session.state.cards.filter((card) => card.ownerPlayerId === playerId && card.zone === 'hand')).toHaveLength(hand);
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved', sourceCardId: sourceId, abilityId, resultId: expect.any(String),
    }));
    const other = session.getPlayerView(playerId === 'p1' ? 'p2' : 'p1');
    expect(JSON.stringify(other)).not.toContain('master.kiritsugu.deck.origin-bullet');
    expect(other.legalActions.some((entry) => entry.type === 'choose_target')).toBe(false);
  });

  it.each(['servant_skill', 'master_skill'])('excludes a fabricated %s hand target from projection and rejects it atomically', (type) => {
    const f = fixture();
    const card = f.session.state.cards.find((entry) => entry.controllerPlayerId === f.playerId &&
      entry.instanceId !== f.sourceId && f.session.state.abilityRuntime!.pack.cards[entry.definitionId]?.cardType === type)!;
    card.zone = 'hand'; // Corrupt-zone negative, not a production reachability claim.
    expect(activate(f).ok).toBe(true);
    expect(f.session.getPlayerView(f.playerId).legalActions.find((entry) => entry.type === 'choose_target')!.candidates).not.toContain(card.instanceId);
    const before = structuredClone(f.session.state);
    expect(choose(f.session, f.playerId, [card.instanceId]).ok).toBe(false);
    expect(f.session.state).toEqual(before);
  });

  it.each(['owner', 'controller', 'zone', 'moved', 'empty', 'source', 'stale'])('rejects %s target drift without state/event/revision mutation', (kind) => {
    const f = fixture();
    expect(activate(f).ok).toBe(true);
    const target = f.session.state.cards.find((card) => card.instanceId === f.targetId)!;
    if (kind === 'owner') target.ownerPlayerId = 'p1';
    if (kind === 'controller') target.controllerPlayerId = 'p1';
    if (kind === 'zone' || kind === 'moved') target.zone = kind === 'zone' ? 'deck' : 'discard';
    const before = structuredClone(f.session.state);
    const result = kind === 'stale' ? f.session.dispatchPlayerAction(f.playerId, {
      type: 'choose_target', decisionId: 'expired-decision', selectedIds: [f.targetId],
    }) : choose(f.session, f.playerId, kind === 'empty' ? [] : [kind === 'source' ? f.sourceId : f.targetId]);
    expect(result.ok).toBe(false);
    expect(f.session.state).toEqual(before);
  });

  it('does not offer or accept activation outside the action phase', () => {
    const f = fixture();
    f.session.state.round.activePhase = 'advance';
    const before = structuredClone(f.session.state);
    expect(activate(f).ok).toBe(false);
    expect(f.session.state).toEqual(before);
  });

  it('hides forbidden targets and revalidates a prohibition added after the offer', () => {
    const f = fixture();
    expect(activate(f).ok).toBe(true);
    const state = f.session.state as typeof f.session.state & { modeState: Record<string, unknown> };
    state.modeState.cardPlayForbids = [{ sourceType: 'test', attribute: '迅捷', rule: 'play_card_attribute' }];
    const before = structuredClone(state);
    expect(f.session.getPlayerView(f.playerId).legalActions.find((entry) => entry.type === 'choose_target')!.candidates).not.toContain(f.targetId);
    expect(choose(f.session, f.playerId, [f.targetId]).ok).toBe(false);
    expect(f.session.state).toEqual(before);
  });

  it.each(['target', 'draw'])('rejects a corrupt pending %s graph with resolution_failed and rolls back play and draw', (kind) => {
    const f = fixture();
    expect(activate(f).ok).toBe(true);
    const pending = f.session.state.abilityRuntime!.pendingDecision!;
    if (kind === 'target') pending.remainingEffects[0]!.target = 'undeclared_target';
    else pending.remainingEffects[1]!.count = -1;
    const before = structuredClone(f.session.state);
    const result = choose(f.session, f.playerId, [f.targetId]);
    expect(result.rejection?.code).toBe('resolution_failed');
    expect(f.session.state).toEqual(before);
  });
});
