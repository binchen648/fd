import { describe, expect, it } from 'vitest';
import library from '../../../../data/generated/fd-playtest-v1.content-library.json';
import { createMatchSession, restoreMatchSession } from '../../src/match-session';
import { referenceSevenServants } from '../acceptance/seven-roster-test-helpers';

const kinggil = 'servant.kinggil';

describe('Kinggil in the generated production roster', () => {
  it('can be drawn and initializes all three skills and the printed deck', () => {
    const drawn = Array.from({ length: 8 }, (_, index) =>
      createMatchSession({ seed: 20261126 + index }).state.players.map(player => player.servantCardId));
    expect(drawn.some(roster => roster.includes(kinggil))).toBe(true);
    expect(drawn.every(roster => new Set(roster).size === 7)).toBe(true);

    const session = createMatchSession({
      seed: 20261126,
      startingServantIds: referenceSevenServants.map(id => id === 'servant.artoria-alt' ? kinggil : id),
    });
    const owner = session.state.players.find(player => player.servantCardId === kinggil)!;
    const cards = session.state.cards.filter(card => card.ownerPlayerId === owner.id);
    const skillIds = [1, 2, 3].map(index => `${kinggil}.skill.sc-kinggil-${index}`);
    expect(cards.filter(card => card.zone === 'skill').map(card => card.definitionId)).toEqual(expect.arrayContaining(skillIds));
    const deck = library.rules.decks[kinggil];
    expect(deck).toHaveLength(12);
    expect(cards.filter(card => ['hand', 'deck'].includes(card.zone)).map(card => card.definitionId).sort()).toEqual([...deck].sort());
    const restored = restoreMatchSession(session.serializeSession());
    expect(restored.state.players.find(player => player.id === owner.id)?.servantCardId).toBe(kinggil);
  });
});
