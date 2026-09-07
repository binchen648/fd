import { describe, expect, it } from 'vitest';

import scenario from '../../src/data/scenarios/fd-playtest-v1-7p.json';
import { createFdPlaytestV1FivePlayerState } from '../../src/projection/player-match-view';

describe('FD first playable five-seat normal scenario', () => {
  it('pairs each approved master and servant exactly once without changing character definitions', () => {
    expect(scenario.id).toBe('fd-playtest-v1-5p');
    expect(scenario.seats).toHaveLength(5);
    expect(new Set(scenario.seats.map((seat) => seat.masterId)).size).toBe(5);
    expect(new Set(scenario.seats.map((seat) => seat.servantId)).size).toBe(5);
    expect(scenario.seats.map((seat) => seat.servantId)).not.toContain('servant.babbage');
    expect(scenario.seats.map((seat) => seat.servantId)).not.toContain('servant.bb');

    const first = createFdPlaytestV1FivePlayerState();
    const second = createFdPlaytestV1FivePlayerState();

    expect(first).toEqual(second);
    expect(first.id).toBe('fd-playtest-v1-5p');
    expect(first.players).toHaveLength(5);
    expect(first.players.map(({ seat, masterCardId, servantCardId }) => ({
      seat,
      masterId: masterCardId,
      servantId: servantCardId,
    }))).toEqual(
      scenario.seats.map(({ seat, masterId, servantId }) => ({ seat, masterId, servantId })),
    );
  });
});
