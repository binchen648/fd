import { describe, expect, it } from 'vitest';
import { createMatchRoom, restoreMatchRoom } from '../../src/match-room';
import { createMatchSession } from '../../src/match-session';
import { humans } from './seven-roster-test-helpers';

const chaldeas = 'master.olga-marie.skill.chaldeas';
const climax = new Set(['situation.fate_night', 'situation.gate_of_hell', 'situation.heavens_cup']);
const deckIds = ['event_deck', 'situation_deck'] as const;
function roomFixture() {
  const room = createMatchRoom({ roomId: 'chaldeas-privacy', seed: 20260907, hostClientId: 'host' });
  const seats = humans.map((id, index) => {
    const client = room.joinRoom({ clientId: `client-${id}`, displayName: id });
    room.selectSeat(client.id, index + 1);
    return client;
  });
  room.joinRoom({ clientId: 'watcher', displayName: 'Watcher', role: 'spectator' });
  room.startMatch('host');
  const session = room.session!;
  const owner = session.state.players.find(p => p.masterCardId === 'master.olga-marie')!;
  const ownerClient = seats[owner.seat - 1]!;
  const opponentClient = seats.find(client => client.id !== ownerClient.id)!;
  return { room, session, owner, ownerClient, opponentClient };
}

function getDecks(match: ReturnType<ReturnType<typeof createMatchSession>['projectToClientState']>) {
  return deckIds.map(id => match.zones.find(z => z.id === id)!);
}

describe('Chaldeas live deck privacy', () => {
  it('shows current deck bottoms to the holder and only counts to everyone else', () => {
    const { room, session, ownerClient, opponentClient } = roomFixture();
    const authoritative = [session.state.eventDeck!, session.state.situationDeck!.filter(id => !climax.has(id))];
    expect(authoritative[1]).toHaveLength(7);
    for (const [index, zone] of getDecks(room.getProjection(ownerClient.id).match!).entries()) {
      expect(zone).toMatchObject({ count: authoritative[index]!.length, cardIds: [],
        bottomCard: { id: authoritative[index]!.at(-1), name: expect.any(String) } });
    }
    for (const clientId of [opponentClient.id, 'host', 'watcher']) {
      const match = room.getProjection(clientId).match!;
      for (const [index, zone] of getDecks(match).entries()) {
        expect(zone).toMatchObject({ cardIds: [], count: authoritative[index]!.length });
        expect(zone).not.toHaveProperty('bottomCard');
      }
      expect(match).not.toHaveProperty('seed');
      expect(match.logs.find(log => log.type === 'session_start')?.payload).not.toHaveProperty('seed');
      expect(JSON.stringify(match)).not.toContain(authoritative[0]!.at(-1));
      expect(JSON.stringify(match)).not.toContain(authoritative[1]!.at(-1));
    }
  });

  it('never reveals the two face-down burned situations even to the Chaldeas holder', () => {
    const { room, session, ownerClient, opponentClient } = roomFixture();
    const burned = session.state.burnedSituationCardIds!;
    expect(burned).toHaveLength(2);
    for (const clientId of [ownerClient.id, opponentClient.id, 'watcher']) {
      const match = room.getProjection(clientId).match!;
      for (const id of burned) expect(JSON.stringify(match)).not.toContain(id);
      expect(match.logs.find(log => log.type === 'situation_pre_discard')?.payload).toEqual({ count: 2 });
    }
  });

  it.each(['discard', 'controller', 'faceDown', 'removed', 'identity'] as const)('revokes the private projection when source %s changes', change => {
    const { session, owner } = roomFixture();
    const source = session.state.cards.find(c => c.definitionId === chaldeas)!;
    expect(source).toBeDefined();
    const prior = getDecks(session.projectToClientState(owner.id));
    expect(prior[0]!.bottomCard?.id).toBe(session.state.eventDeck!.at(-1));
    if (change === 'discard') source.zone = 'discard';
    if (change === 'controller') source.controllerPlayerId = session.state.players.find(p => p.id !== owner.id)!.id;
    if (change === 'faceDown') session.state.abilityRuntime!.cardState[source.instanceId]!.faceDown = true;
    if (change === 'removed') session.state.cards = session.state.cards.filter(c => c !== source);
    if (change === 'identity') owner.masterCardId = 'master.shinji';
    for (const zone of getDecks(session.projectToClientState(owner.id))) {
      expect(zone.cardIds).toEqual([]);
      expect(zone).not.toHaveProperty('bottomCard');
    }
  });

  it('reads only the current bottom after a deck change and an authenticated reconnect', () => {
    const { room, session, ownerClient, opponentClient } = roomFixture();
    const initialBottom = session.state.eventDeck!.at(-1);
    const initialProjection = room.getProjection(ownerClient.id).match!;
    const moved = session.state.eventDeck!.shift()!;
    session.state.eventDeck!.push(moved);
    expect(moved).not.toBe(initialBottom);
    expect(getDecks(room.getProjection(ownerClient.id).match!)[0]!.bottomCard?.id).toBe(moved);
    expect(getDecks(initialProjection)[0]!.bottomCard?.id).toBe(initialBottom);

    // Sign a legacy-style startup log in the authoritative session before serializing.
    const startup = session.logs.find(log => log.type === 'session_start')!;
    startup.payload = { ...startup.payload, seed: session.seed };
    session.logs.find(log => log.type === 'situation_pre_discard')!.payload = { burned: [...session.state.burnedSituationCardIds!] };
    const restored = restoreMatchRoom(room.serializeRoom());
    restored.disconnect(ownerClient.id);
    restored.reconnect(ownerClient.reconnectToken);
    expect(getDecks(restored.getProjection(ownerClient.id).match!)[0]!.bottomCard?.id).toBe(moved);
    expect(getDecks(restored.getProjection(opponentClient.id).match!)[0]).not.toHaveProperty('bottomCard');
    const watcher = restored.getProjection('watcher').match!;
    expect(getDecks(watcher)[0]!.cardIds).toEqual([]);
    expect(watcher.logs.find(log => log.type === 'session_start')?.payload).not.toHaveProperty('seed');
    expect(watcher.logs.find(log => log.type === 'situation_pre_discard')?.payload).toEqual({ count: 2 });
    for (const id of session.state.burnedSituationCardIds!) expect(JSON.stringify(watcher)).not.toContain(id);
  });
});
