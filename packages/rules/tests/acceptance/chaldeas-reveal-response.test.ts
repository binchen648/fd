import { describe, expect, it } from 'vitest';
import { createMatchSession, restoreMatchSession } from '../../src/match-session';
import { createMatchRoom, restoreMatchRoom } from '../../src/match-room';
import { humans } from './seven-roster-test-helpers';

type Session = ReturnType<typeof createMatchSession>;
const abilityId = 'chaldeas.swap-before-resolve';
const climax = new Set(['situation.fate_night', 'situation.gate_of_hell', 'situation.heavens_cup']);

function begin() {
  const session = createMatchSession({ seed: 20260907, humanPlayerIds: humans });
  const owner = session.state.players.find(p => p.masterCardId === 'master.olga-marie')!.id;
  return { session, owner, other: humans.find(id => id !== owner)! };
}

function accept(session: Session, id: string) {
  const command = session.getPlayerView(id).legalActions.find(a => a.type === 'resolve_response' && a.abilityId === abilityId);
  expect(command).toBeDefined();
  return command!;
}

function decline(session: Session, id: string) {
  const command = session.getPlayerView(id).legalActions.find(a => a.type === 'decline_this_window');
  expect(command).toBeDefined();
  expect(session.dispatchPlayerAction(id, command!).ok).toBe(true);
}

describe('Chaldeas authentic reveal-before-effect windows', () => {
  it('holds the original situation and applies the actual ordinary bottom after restore', () => {
    const { session, owner, other } = begin();
    const revealed = session.projectToClientState(other).pendingReveal!;
    expect(revealed).toMatchObject({ kind: 'situation', id: 'situation.turning_point' });
    expect(session.logs.some(l => l.type === 'situation_applied')).toBe(false);
    expect(session.state.players.map(p => p.mana)).toEqual([4, 4, 4, 4, 4, 4, 4]);
    expect(session.state.eventPlacements).toEqual([]);
    const command = accept(session, owner);
    const before = structuredClone(session.state);
    expect(session.dispatchPlayerAction(other, command).ok).toBe(false);
    expect(session.state).toEqual(before);
    const restored = restoreMatchSession(session.serializeSession());
    expect(accept(restored, owner)).toEqual(command);
    const bottom = restored.projectToClientState(owner).zones.find(z => z.id === 'situation_deck')!.bottomCard!.id;
    expect(restored.dispatchPlayerAction(owner, command).ok).toBe(true);
    expect(restored.state.currentSituationCardId).toBe(bottom);
    expect(bottom).toBe('situation.perfect_flow');
    expect(restored.state.players.map(p => p.mana)).toEqual([6, 6, 6, 6, 6, 6, 6]);
    expect(restored.state.currentSituationModifiers).toEqual([{ sourceId: bottom, targetTag: '魔术', value: 2 }]);
    expect(restored.state.eventPlacements).toHaveLength(2);
    expect(restored.state.situationDeck!.filter(id => !climax.has(id)).at(-1)).toBe(revealed.id);
    expect(restored.state.situationDeck!.filter(id => climax.has(id))).toEqual([...climax]);
    expect(restored.logs.filter(l => l.type === 'situation_applied').map(l => l.message)).toEqual([bottom]);
    expect(restored.projectToClientState(owner).pendingReveal).toBeUndefined();
    expect(restored.dispatchPlayerAction(owner, command).ok).toBe(false);
  });

  it('declines the situation without spending the use, then exchanges a public event before its placement', () => {
    const { session, owner, other } = begin();
    const situation = session.projectToClientState(owner).pendingReveal!.id;
    decline(session, owner);
    expect(session.state.currentSituationCardId).toBe(situation);
    expect(session.logs.filter(l => l.type === 'situation_applied')).toHaveLength(1);
    const reveal = session.projectToClientState(other).pendingReveal!;
    expect(reveal).toMatchObject({ kind: 'event', locationId: 'miyama_town' });
    expect(session.state.eventPlacements.some(p => p.eventCardId === reveal.id)).toBe(false);
    const command = accept(session, owner);
    const bottom = session.state.eventDeck!.at(-1)!;
    const before = [...session.state.eventDeck!];
    expect(session.dispatchPlayerAction(owner, { ...command, windowId: 'stale' }).ok).toBe(false);
    expect(session.state.eventDeck).toEqual(before);
    expect(session.dispatchPlayerAction(owner, command).ok).toBe(true);
    expect(session.state.eventPlacements[0]).toMatchObject({ eventCardId: bottom, locationId: reveal.locationId, visibility: { scope: 'public' } });
    expect(session.state.eventDeck).toContain(reveal.id);
    expect(session.projectToClientState(owner).pendingReveal).toBeUndefined();
  });

  it('refuses to swap if the previewed bottom changes, and can still decline', () => {
    const { session, owner } = begin();
    const command = accept(session, owner);
    const deck = session.state.situationDeck!;
    const index = deck.findLastIndex(id => !climax.has(id));
    [deck[0], deck[index]] = [deck[index]!, deck[0]!];
    const before = structuredClone(session.state);
    expect(session.dispatchPlayerAction(owner, command).ok).toBe(false);
    expect(session.state).toEqual(before);
    decline(session, owner);
    expect(session.state.currentSituationCardId).toBe('situation.turning_point');
  });

  it('opens a hidden Shinto event only at its action reveal and rebuilds the replacement metadata', () => {
    const { session, owner, other } = begin();
    while (session.state.round.activePhase === 'round_start') decline(session, owner);
    const hidden = session.state.eventPlacements.find(p => p.locationId === 'shinto' && p.visibility.scope === 'hidden_until_trigger')!;
    expect(hidden).toBeDefined();
    expect(session.projectToClientState(other).pendingReveal).toBeUndefined();
    expect(JSON.stringify(session.projectToClientState(other))).not.toContain(hidden.eventCardId);
    const deck = session.state.eventDeck!;
    const bonusIndex = deck.indexOf('event.waxing_moon_ritual.akasaka');
    expect(bonusIndex).toBeGreaterThanOrEqual(0);
    [deck[bonusIndex], deck[deck.length - 1]] = [deck[deck.length - 1]!, deck[bonusIndex]!];
    // Bounded entry into the real end-of-advance transition, no whole match.
    session.state.round.activePhase = 'advance';
    session.state.round.prioritySeat = 7;
    session.advanceToNextDecision();
    const reveal = session.projectToClientState(other).pendingReveal!;
    expect(reveal).toMatchObject({ kind: 'event', id: hidden.eventCardId, locationId: 'shinto' });
    expect(session.state.eventPlacements.find(p => p.eventCardId === reveal.id)?.visibility.scope).toBe('hidden_until_trigger');
    const replacement = session.state.eventDeck!.at(-1)!;
    const restored = restoreMatchSession(session.serializeSession());
    expect(restored.dispatchPlayerAction(owner, accept(restored, owner)).ok).toBe(true);
    const placed = restored.state.eventPlacements.find(p => p.locationId === 'shinto' && p.eventCardId === replacement)!;
    expect(placed.visibility).toMatchObject({ scope: 'public', revealReason: 'action_start' });
    expect(placed.battleModifiers.every(modifier => modifier.sourceId === replacement)).toBe(true);
    expect(placed.victoryPoints).toBe(2);
    expect(placed.battleModifiers).toEqual([
      { sourceId: replacement, targetTag: '力量', value: 1, condition: 'has_attribute' },
      { sourceId: replacement, targetTag: '力量', value: -1, condition: 'lacks_attribute' },
    ]);
    expect(restored.state.eventDeck!.at(-1)).toBe(reveal.id);
    expect(restored.projectToClientState(owner).pendingReveal).toBeUndefined();
    expect(restored.getPlayerView(other).legalActions.some(action => action.type === 'resolve_response' && action.abilityId === abilityId)).toBe(false);
  });

  it.each(['swap', 'keep'] as const)('restores legacy hidden event notices and only shows current public events after %s', choice => {
    const { session, owner, other } = begin();
    while (session.state.round.activePhase === 'round_start') decline(session, owner);
    const original = 'event.waxing_moon_ritual.keian_ceremony';
    const replacement = 'event.waxing_moon_ritual.akasaka';
    // Legacy save shape: notices were stored immediately even for hidden placements.
    session.state.eventPlacements = [
      { locationId: 'shinto', eventCardId: original, visibility: { scope: 'public' }, battleModifiers: [] },
      { locationId: 'shinto', eventCardId: original, visibility: { scope: 'hidden_until_trigger' }, battleModifiers: [] },
    ];
    session.state.eventDeck = [replacement];
    (session.state as Session['state'] & { modeState: Record<string, unknown> }).modeState.masterDirectives = [0, 1].map(() => ({
      directive: 'event_effect_host_review', eventCardId: original, locationId: 'shinto',
      timing: 'on_event_placed_or_revealed', consumed: true,
    }));
    session.state.round.activePhase = 'advance';
    session.state.round.prioritySeat = 7;
    const restored = restoreMatchSession(session.serializeSession());
    const notices = () => restored.projectToClientState(other).directives
      .filter(d => d.label === 'event_effect_host_review');
    expect(notices()).toHaveLength(1);
    restored.advanceToNextDecision();
    expect(restored.projectToClientState(other).pendingReveal?.id).toBe(original);
    if (choice === 'swap') expect(restored.dispatchPlayerAction(owner, accept(restored, owner)).ok).toBe(true);
    else decline(restored, owner);
    expect(restored.state.eventPlacements.map(p => p.eventCardId)).toEqual([original, choice === 'swap' ? replacement : original]);
    expect(notices()).toHaveLength(choice === 'swap' ? 1 : 2);
    expect(notices().every(notice => notice.payload?.eventCardId === original)).toBe(true);
  });

  it.each(['inactive', 'face-down', 'removed', 'controller-changed'] as const)(
    'revalidates a %s source without spending a use or trapping the decline', boundary => {
      const { session, owner, other } = begin();
      const command = accept(session, owner);
      const source = session.state.cards.find(c => c.instanceId === command.cardInstanceId)!;
      const runtime = session.state.abilityRuntime!;
      if (boundary === 'inactive') { source.zone = 'field'; runtime.cardState[source.instanceId]!.active = false; }
      if (boundary === 'face-down') runtime.cardState[source.instanceId]!.faceDown = true;
      if (boundary === 'removed') source.zone = 'removed_from_game';
      if (boundary === 'controller-changed') source.controllerPlayerId = other;
      const before = structuredClone(session.state);
      expect(session.getPlayerView(owner).legalActions.some(a => a.type === 'resolve_response' && a.abilityId === abilityId)).toBe(false);
      expect(session.dispatchPlayerAction(owner, command).ok).toBe(false);
      expect(session.state).toEqual(before);
      decline(session, owner);
      expect(session.state.currentSituationCardId).toBe('situation.turning_point');
      expect(session.state.abilityRuntime!.abilityUsage[`${source.instanceId}:${abilityId}:round:1`] ?? 0).toBe(0);
    },
  );

  it('restores the next round use and never offers a climax situation or an empty-deck swap', () => {
    const { session, owner } = begin();
    expect(session.dispatchPlayerAction(owner, accept(session, owner)).ok).toBe(true);
    expect(session.state.abilityRuntime!.responseWindows).toEqual([]);
    // Bounded lifecycle entry; whole-match acceptance remains a separate L3 gate.
    (session as any).startRound(2);
    expect(session.projectToClientState(owner).pendingReveal?.kind).toBe('situation');
    expect(session.dispatchPlayerAction(owner, accept(session, owner)).ok).toBe(true);
    session.state.eventDeck = [];
    session.state.eventDiscardPile = [];
    (session as any).startRound(9);
    expect(session.state.currentSituationCardId).toBe('situation.fate_night');
    expect(session.projectToClientState(owner).pendingReveal).toBeUndefined();
    expect(session.state.abilityRuntime!.responseWindows).toEqual([]);
    expect(session.state.round.activePhase).toBe('preparation');
  });

  it('preserves the actual Room response owner through persistence and authenticated reconnect', () => {
    const room = createMatchRoom({ roomId: 'chaldeas-response-reconnect', seed: 20260907, hostClientId: 'seat-1' });
    for (let seat = 1; seat <= 7; seat++) {
      const clientId = `seat-${seat}`;
      if (seat > 1) room.joinRoom({ clientId, displayName: clientId });
      room.selectSeat(clientId, seat);
    }
    room.joinRoom({ clientId: 'watcher', displayName: 'Watcher', role: 'spectator' });
    room.startMatch('seat-1');
    const owner = room.session!.state.players.find(p => p.masterCardId === 'master.olga-marie')!;
    const clientId = `seat-${owner.seat}`;
    const initial = room.getProjection(clientId).match!;
    const command = initial.view.legalActions.find(a => a.type === 'resolve_response' && a.abilityId === abilityId)!;
    expect(command).toBeDefined();
    expect(initial.priorityPlayerId).toBe(owner.id);
    const restored = restoreMatchRoom(room.serializeRoom());
    restored.disconnect(clientId);
    restored.reconnect(restored.getIssuedCredential(clientId));
    expect(restored.getProjection(clientId).match!.pendingReveal).toEqual(initial.pendingReveal);
    expect(restored.getProjection('watcher').match!.view.legalActions).toEqual([]);
    expect(restored.getProjection('watcher').match!.zones.every(zone => !zone.bottomCard)).toBe(true);
    const other = owner.seat === 1 ? 'seat-2' : 'seat-1';
    const before = structuredClone(restored.session!.state);
    expect(restored.dispatchClientCommand(other, command).ok).toBe(false);
    expect(restored.session!.state).toEqual(before);
    const bottom = initial.zones.find(z => z.id === 'situation_deck')!.bottomCard!.id;
    expect(restored.dispatchClientCommand(clientId, command).ok).toBe(true);
    expect(restored.session!.state.currentSituationCardId).toBe(bottom);
    expect(restored.dispatchClientCommand(clientId, command).ok).toBe(false);
    expect(restored.session!.logs.filter(log => log.type === 'situation_applied')).toHaveLength(1);
  });

});
