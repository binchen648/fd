import { beforeEach, describe, expect, it } from 'vitest';
import { ContentLibraryManager } from '../index';
import type { EventCard, GameCard, MasterIdentityCard, SituationCard } from '../chm-card-types';

function baseCard() {
  return {
    language: 'zh-CN' as const,
    approvedAt: '2026-04-14T00:00:00.000Z',
    guardrailJobId: 'job-001',
    tags: ['sample'],
  };
}

function makeMasterCard(overrides: Partial<MasterIdentityCard> = {}): MasterIdentityCard {
  return {
    ...baseCard(),
    id: 'master-001',
    name: 'Master',
    sourceSet: 'master',
    namespace: 'master',
    cardType: 'master_identity',
    initialMana: 4,
    commandSpells: 3,
    ...overrides,
  };
}

function makeSituationCard(overrides: Partial<SituationCard> = {}): SituationCard {
  return {
    ...baseCard(),
    id: 'situation-001',
    name: 'Climax',
    sourceSet: 'situation',
    namespace: 'situation',
    cardType: 'situation',
    situationType: 'climax',
    manaGrantToAll: 1,
    hasInstantEffect: true,
    hasPersistentEffect: true,
    applicableRounds: [9, 10, 11],
    ...overrides,
  };
}

function makeEventCard(overrides: Partial<EventCard> = {}): EventCard {
  return {
    ...baseCard(),
    id: 'event-001',
    name: 'Event',
    sourceSet: 'event',
    namespace: 'event',
    cardType: 'event',
    battlefield: 'deep_mountain',
    competitionReward: 2,
    display: 'revealed',
    ...overrides,
  };
}

describe('ContentLibraryManager', () => {
  let manager: ContentLibraryManager;

  beforeEach(() => {
    manager = new ContentLibraryManager();
  });

  it('imports valid cards and updates aggregate stats', () => {
    const cards: GameCard[] = [makeMasterCard(), makeSituationCard(), makeEventCard()];

    const result = manager.importApprovedCards(cards);

    expect(result).toEqual({ imported: 3, rejected: 0, errors: [] });
    expect(manager.getStats()).toEqual({
      totalCards: 3,
      bySourceSet: {
        master: 1,
        situation: 1,
        event: 1,
      },
      byNamespace: {
        master: 1,
        situation: 1,
        event: 1,
      },
    });
  });

  it('rejects duplicate card ids without mutating stats twice', () => {
    manager.importApprovedCards([makeMasterCard()]);

    const result = manager.importApprovedCards([makeMasterCard()]);

    expect(result.imported).toBe(0);
    expect(result.rejected).toBe(1);
    expect(result.errors[0]).toEqual({
      cardId: 'master-001',
      reason: 'Duplicate card ID',
    });
    expect(manager.getStats().totalCards).toBe(1);
  });

  it('rejects cards that violate CHM constraints', () => {
    const result = manager.importApprovedCards([
      makeMasterCard({ id: 'master-bad', initialMana: 5 }),
      makeSituationCard({ id: 'situation-bad', applicableRounds: [9, 10] }),
    ]);

    expect(result.imported).toBe(0);
    expect(result.rejected).toBe(2);
    expect(result.errors).toEqual([
      {
        cardId: 'master-bad',
        reason: 'Master card initial mana must be 4',
      },
      {
        cardId: 'situation-bad',
        reason: 'Situation climax rounds must be 9, 10, 11',
      },
    ]);
  });

  it('queries cards by id, namespace, and source set', () => {
    manager.importApprovedCards([makeMasterCard(), makeSituationCard(), makeEventCard()]);

    expect(manager.getCard('master-001')?.name).toBe('Master');
    expect(manager.getCard('missing')).toBeNull();
    expect(manager.getCardsByNamespace('situation').map((card) => card.id)).toEqual(['situation-001']);
    expect(manager.getCardsBySourceSet('event').map((card) => card.id)).toEqual(['event-001']);
  });

  it('exports and imports the library index as an isolated clone', () => {
    manager.importApprovedCards([makeMasterCard()]);

    const exported = manager.exportIndex();
    const exportedCard = exported.cards['master-001'];
    expect(exportedCard).toBeDefined();
    if (!exportedCard) {
      throw new Error('Expected exported card');
    }
    exportedCard.name = 'Mutated Outside';

    expect(manager.getCard('master-001')?.name).toBe('Master');

    const importedManager = new ContentLibraryManager(exported);
    expect(importedManager.getCard('master-001')?.name).toBe('Mutated Outside');
    expect(importedManager.exportIndex().version).toBe('1.0.0');
  });
});
