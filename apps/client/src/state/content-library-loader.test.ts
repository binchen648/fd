import { describe, expect, it } from 'vitest';

import { buildRulesStateFromContentLibraryText } from './content-library-loader';

function createContentLibraryText(): string {
  const cards: Record<string, unknown> = {};

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
      classTag: 'lancer',
      attackCardsCount: 12,
      skillCardsCount: 3,
    };
  }

  return JSON.stringify({
    version: '1.0.0',
    lastUpdated: '2026-04-14T00:00:00.000Z',
    stats: {
      totalCards: 14,
      bySourceSet: { master: 7, servant: 7 },
      byNamespace: { master: 7, servant: 7 },
    },
    cards,
  });
}

describe('content library loader', () => {
  it('builds rules state from content library json text', () => {
    const state = buildRulesStateFromContentLibraryText(createContentLibraryText(), {
      enabledLocationIds: ['miyama_town', 'shinto', 'magic_workshop', 'recon', 'moon_holy_grail'],
    });

    expect(state.players[0]?.masterCardId).toBe('content-master-1');
    expect(state.cards).toHaveLength(14);
  });

  it('rejects invalid content library json text', () => {
    expect(() => buildRulesStateFromContentLibraryText('{"version":"broken"}')).toThrow();
  });
});
