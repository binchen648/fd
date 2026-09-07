import { describe, expect, it } from 'vitest';

import type { ContentLibraryIndex } from '@fd/content/schema';
import { stepGameLoop } from '../core/game-loop';
import { createSeededGameStateFromContentLibrary } from '../tools/seeded-state';

function createContentLibrary(): ContentLibraryIndex {
  const cards: ContentLibraryIndex['cards'] = {};

  for (let seat = 1; seat <= 7; seat += 1) {
    cards[`content-master-${seat}`] = {
      id: `content-master-${seat}`,
      name: `Content Master ${seat}`,
      language: 'zh-CN',
      sourceSet: 'master',
      namespace: 'master',
      approvedAt: '2026-04-14T00:00:00.000Z',
      guardrailJobId: `job-master-${seat}`,
      tags: ['master'],
      cardType: 'master_identity',
      initialMana: 4,
      commandSpells: 3,
    };
    cards[`content-servant-${seat}`] = {
      id: `content-servant-${seat}`,
      name: `Content Servant ${seat}`,
      language: 'zh-CN',
      sourceSet: 'servant',
      namespace: 'servant',
      approvedAt: '2026-04-14T00:00:00.000Z',
      guardrailJobId: `job-servant-${seat}`,
      tags: ['servant'],
      cardType: 'servant_overview',
      classTag: 'saber',
      attackCardsCount: 12,
      skillCardsCount: 3,
    };
  }

  cards['content-situation-1'] = {
    id: 'content-situation-1',
    name: 'Content Situation',
    language: 'zh-CN',
    sourceSet: 'situation',
    namespace: 'situation',
    approvedAt: '2026-04-14T00:00:00.000Z',
    guardrailJobId: 'job-situation-1',
    tags: ['situation'],
    cardType: 'situation',
    situationType: 'regular',
    manaGrantToAll: 1,
    hasInstantEffect: true,
    hasPersistentEffect: true,
    applicableRounds: [2],
    specialNames: ['modifier:magic:+2', 'Lingering haze'],
  };

  cards['content-event-miyama'] = {
    id: 'content-event-miyama',
    name: 'Miyama Event',
    language: 'zh-CN',
    sourceSet: 'event',
    namespace: 'event',
    approvedAt: '2026-04-14T00:00:00.000Z',
    guardrailJobId: 'job-event-miyama',
    tags: ['event'],
    cardType: 'event',
    battlefield: 'deep_mountain',
    competitionReward: 2,
    display: 'revealed',
  };

  cards['content-event-shinto'] = {
    id: 'content-event-shinto',
    name: 'Shinto Event',
    language: 'zh-CN',
    sourceSet: 'event',
    namespace: 'event',
    approvedAt: '2026-04-14T00:00:00.000Z',
    guardrailJobId: 'job-event-shinto',
    tags: ['event'],
    cardType: 'event',
    battlefield: 'new_capital',
    competitionReward: 3,
    display: 'hidden',
    specialRules: ['modifier:moon:+3', 'Concealed omen'],
  };

  return {
    version: '1.0.0',
    lastUpdated: '2026-04-14T00:00:00.000Z',
    stats: {
      totalCards: Object.keys(cards).length,
      bySourceSet: { master: 7, servant: 7, situation: 1, event: 2 },
      byNamespace: { master: 7, servant: 7, situation: 1, event: 2 },
    },
    cards,
  };
}

describe('content bridge', () => {
  it('creates a seeded match from content library cards', () => {
    const state = createSeededGameStateFromContentLibrary(createContentLibrary(), {
      enabledLocationIds: ['miyama_town', 'shinto', 'magic_workshop', 'recon', 'moon_holy_grail'],
    });

    expect(state.id).toBe('seeded-match-7p-content');
    expect(state.players[0]?.masterCardId).toBe('content-master-1');
    expect(state.players[6]?.servantCardId).toBe('content-servant-7');
    expect(state.cards.some((card) => card.definitionId === 'content-situation-1')).toBe(true);
    expect(state.cards.some((card) => card.definitionId === 'content-event-miyama')).toBe(true);
    expect(state.cards).toHaveLength(17);
    expect(state.log.at(-1)).toEqual(
      expect.objectContaining({
        type: 'content_library_loaded',
      }),
    );
  });

  it('applies content situations during the round-start step', () => {
    const state = createSeededGameStateFromContentLibrary(createContentLibrary(), {
      enabledLocationIds: ['miyama_town', 'shinto', 'magic_workshop', 'recon', 'moon_holy_grail'],
    });

    const result = stepGameLoop(state);

    expect(result.transition.to).toBe('round_start');
    expect(result.nextState.currentSituationCardId).toBe('content-situation-1');
    expect(result.nextState.players.every((player) => player.mana === 5)).toBe(true);
    expect(result.nextState.currentSituationModifiers).toEqual([
      {
        sourceId: 'content-situation-1',
        targetTag: 'magic',
        value: 2,
      },
    ]);
    expect(result.nextState.log).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'situation_applied',
          message: 'situation:content-situation-1',
        }),
      ]),
    );
  });

  it('creates round-start event placements from content events', () => {
    const state = createSeededGameStateFromContentLibrary(createContentLibrary(), {
      enabledLocationIds: ['miyama_town', 'shinto', 'magic_workshop', 'recon', 'moon_holy_grail'],
    });

    const result = stepGameLoop(state);

    expect(result.nextState.eventPlacements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          locationId: 'miyama_town',
          eventCardId: 'content-event-miyama',
          visibility: { scope: 'public' },
        }),
        expect.objectContaining({
          locationId: 'shinto',
          eventCardId: 'content-event-shinto',
          visibility: { scope: 'hidden_until_trigger' },
          battleModifiers: [
            {
              sourceId: 'content-event-shinto',
              targetTag: 'moon',
              value: 3,
            },
          ],
        }),
      ]),
    );
    expect(result.nextState.log).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'event_placed',
          message: 'event:content-event-miyama@miyama_town',
        }),
        expect.objectContaining({
          type: 'event_placed',
          message: 'event:content-event-shinto@shinto',
        }),
      ]),
    );
  });
});
