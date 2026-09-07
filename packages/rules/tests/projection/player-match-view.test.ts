import { describe, expect, it } from 'vitest';

import {
  createHostRulingRequestForCapability,
  projectPlayerMatchView,
} from '../../src/projection/player-match-view';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { CardInstance } from '../../src/schema/card';

function createProjectionState() {
  const state = createSeededGameState();
  const cards: CardInstance[] = [
    ...['servant.francis_drake.attack.strength_4', 'servant.francis_drake.attack.agility_3', 'servant.francis_drake.attack.luck_2'].map((definitionId, index) => ({
      instanceId: `p1-hand-${index + 1}`,
      definitionId,
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'hand',
      visibility: { scope: 'owner_only' as const, ownerPlayerId: 'p1' },
    })),
    {
      instanceId: 'p1-skill-1',
      definitionId: 'servant.francis_drake.skill.stormy_voyager',
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    },
    {
      instanceId: 'public-event-1',
      definitionId: 'event.waxing_moon_ritual.ritual',
      ownerPlayerId: '',
      controllerPlayerId: '',
      zone: 'event',
      visibility: { scope: 'public' },
    },
  ];

  return {
    ...state,
    round: { ...state.round, activePhase: 'action' as const, prioritySeat: 1 },
    cards,
  };
}

describe('player-specific match projection', () => {
  it('reveals private card identities only to their owner', () => {
    const state = createProjectionState();
    const ownerView = projectPlayerMatchView(state, { kind: 'player', playerId: 'p1' }, { revision: 8 });
    const opponentView = projectPlayerMatchView(state, { kind: 'player', playerId: 'p2' }, { revision: 8 });
    const spectatorView = projectPlayerMatchView(state, { kind: 'spectator' }, { revision: 8 });

    expect(ownerView.self?.hand).toHaveLength(3);
    expect(ownerView.self?.hand.every((card) => card.definitionId)).toBe(true);
    expect(ownerView.self?.faceDownSkills[0]?.definitionId).toBe('servant.francis_drake.skill.stormy_voyager');

    expect(opponentView.players.find((player) => player.id === 'p1')?.hand).toEqual({ count: 3 });
    expect(opponentView.players.find((player) => player.id === 'p1')?.faceDownSkills).toEqual({ count: 1 });
    expect(spectatorView.self).toBeNull();
    expect(spectatorView.players.find((player) => player.id === 'p1')?.hand).toEqual({ count: 3 });
    expect(JSON.stringify(opponentView)).not.toContain('servant.francis_drake.skill.stormy_voyager');
  });

  it('offers commands only to the priority player, except during an eligible response window', () => {
    const state = createProjectionState();
    const ownerView = projectPlayerMatchView(state, { kind: 'player', playerId: 'p1' }, { revision: 8 });
    const opponentView = projectPlayerMatchView(state, { kind: 'player', playerId: 'p2' }, { revision: 8 });

    expect(ownerView.availableActions).toContainEqual(
      expect.objectContaining({ ownerPlayerId: 'p1', kind: 'play_card' }),
    );
    expect(opponentView.availableActions).not.toContainEqual(
      expect.objectContaining({ ownerPlayerId: 'p1', kind: 'play_card' }),
    );
    expect(opponentView.availableActions).toEqual([]);

    const responseView = projectPlayerMatchView(
      state,
      { kind: 'player', playerId: 'p2' },
      {
        revision: 8,
        responseWindow: {
          id: 'response-1',
          reason: 'battle_skill',
          eligiblePlayerIds: ['p2'],
        },
      },
    );

    expect(responseView.availableActions).toContainEqual(
      expect.objectContaining({ ownerPlayerId: 'p2', kind: 'respond' }),
    );
  });

  it('creates a pending host ruling for an uncovered Kayneth PARTIAL dimension', () => {
    const request = createHostRulingRequestForCapability({
      matchId: 'fd-playtest-v1-7p',
      playerId: 'player-3',
      sourceDefinitionId: 'master.kayneth_archibald.skill.fluid_mechanics',
      capability: {
        status: 'PARTIAL',
        supportedDimensions: ['skill_mana_eligibility'],
      },
      requestedDimension: 'independent_deck_draw',
    });

    expect(request).toEqual(
      expect.objectContaining({
        matchId: 'fd-playtest-v1-7p',
        requestingPlayerId: 'player-3',
        sourceDefinitionId: 'master.kayneth_archibald.skill.fluid_mechanics',
        status: 'pending',
      }),
    );
    expect(request?.prompt).toContain('independent_deck_draw');
  });
});
