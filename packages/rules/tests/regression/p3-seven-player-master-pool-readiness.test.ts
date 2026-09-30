import { describe, expect, it } from 'vitest';
import { buildSevenPlayerCharacterPairings } from '../../src/match-session';
import type { ExecutableCharacterDefinition } from '../../src/ability/types';

function character(id: string, kind: 'master' | 'servant'): ExecutableCharacterDefinition {
  return { id, kind, name: id, cardIds: [] } as ExecutableCharacterDefinition;
}

describe('P3 identity-free seven-player character-pool readiness', () => {
  it('samples exactly seven deterministic master/servant pairings from larger playable pools', () => {
    const masters = Array.from({ length: 9 }, (_, index) => character(`master.fixture-${index + 1}`, 'master'));
    const servants = Array.from({ length: 11 }, (_, index) => character(`servant.fixture-${index + 1}`, 'servant'));
    const first = buildSevenPlayerCharacterPairings(masters, servants, 20261001);
    const replay = buildSevenPlayerCharacterPairings(masters, servants, 20261001);

    expect(first).toEqual(replay);
    expect(first).toHaveLength(7);
    expect(first.map((entry) => entry.playerId)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']);
    expect(first.map((entry) => entry.seat)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(first.map((entry) => entry.master.id))).toHaveLength(7);
    expect(new Set(first.map((entry) => entry.servant.id))).toHaveLength(7);
    expect(first.some((entry) => entry.playerId === 'p8')).toBe(false);
  });

  it('does not mutate caller pools while selecting the seven seats', () => {
    const masters = Array.from({ length: 8 }, (_, index) => character(`master.fixture-${index + 1}`, 'master'));
    const servants = Array.from({ length: 8 }, (_, index) => character(`servant.fixture-${index + 1}`, 'servant'));
    const mastersBefore = masters.map((entry) => entry.id);
    const servantsBefore = servants.map((entry) => entry.id);
    buildSevenPlayerCharacterPairings(masters, servants, 7);
    expect(masters.map((entry) => entry.id)).toEqual(mastersBefore);
    expect(servants.map((entry) => entry.id)).toEqual(servantsBefore);
  });

  it('fails closed when either playable pool cannot fill all seven seats', () => {
    const sevenMasters = Array.from({ length: 7 }, (_, index) => character(`master.fixture-${index + 1}`, 'master'));
    const sevenServants = Array.from({ length: 7 }, (_, index) => character(`servant.fixture-${index + 1}`, 'servant'));
    expect(() => buildSevenPlayerCharacterPairings(sevenMasters.slice(0, 6), sevenServants, 1)).toThrow(/at least 7 masters and 7 servants/);
    expect(() => buildSevenPlayerCharacterPairings(sevenMasters, sevenServants.slice(0, 6), 1)).toThrow(/at least 7 masters and 7 servants/);
  });
});
