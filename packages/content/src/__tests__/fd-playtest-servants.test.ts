import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { loadPlaytestContentPack, validateLoadedPlaytestPack } from '../playtest-pack-loader';

const pack = loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'), {
  workspaceRoot: resolve('.'),
});

describe('fd-playtest-v1 servant content', () => {
  it('loads the approved seven authoring servants through the playtest pack', () => {
    expect(pack.servants.map((servant) => servant.id)).toEqual([
      'servant.artoriac',
      'servant.drake',
      'servant.achilles',
      'servant.artoria-alt',
      'servant.ereshkigal',
      'servant.tomoe',
      'servant.kintoki',
    ]);
  });

  it('gives every servant a valid twelve-card starting deck and three skills', () => {
    const cardIds = new Set(pack.cards.map((card) => card.id));
    const resolvableCardIds = new Set([
      ...cardIds,
      ...Object.values(pack.dictionaries.basicAttacks).map((entry) => entry.id),
    ]);
    for (const servant of pack.servants) {
      const total = servant.startingDeck.entries.reduce((sum, entry) => sum + entry.copies, 0);
      expect(total, servant.id).toBe(12);
      expect(servant.startingDeck.size).toBe(12);
      expect(servant.skillCardIds).toHaveLength(3);
      expect(cardIds.has(servant.overviewCardId), servant.id).toBe(true);
      for (const cardId of [
        ...servant.skillCardIds,
        ...(servant.linkedCards.generated ?? []),
      ]) {
        expect(cardIds.has(cardId), `${servant.id} -> ${cardId}`).toBe(true);
      }
      for (const entry of servant.startingDeck.entries) {
        if (entry.entryType === 'named') expect(resolvableCardIds.has(entry.cardId!), entry.cardId).toBe(true);
      }
    }
  });

  it('preserves card text, timing, cost, power and original source evidence for product display', () => {
    const cards = pack.cards.filter((card) => card.id.startsWith('servant.'));

    expect(cards.length).toBeGreaterThan(25);
    expect(cards.some((card) => card.printedText?.length)).toBe(true);
    expect(cards.some((card) => card.timing?.includes('action'))).toBe(true);
    expect(cards.some((card) => card.printedCost !== undefined)).toBe(true);
    expect(cards.some((card) => card.printedValue !== undefined || card.printedValueExpression)).toBe(true);

    for (const card of cards) {
      expect(card.source.htmPath).toMatch(/^chm-extract\//);
      expect(card.source.imagePath).toMatch(/^chm-extract\/图包\//);
      expect(existsSync(resolve(card.source.imagePath)), card.id).toBe(true);
    }
  });

  it('validates without blocking issues', () => {
    expect(validateLoadedPlaytestPack(pack, { workspaceRoot: resolve('.') }).filter((issue) => issue.blocking)).toEqual([]);
  });
});
