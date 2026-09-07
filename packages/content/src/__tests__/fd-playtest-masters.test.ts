import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { loadPlaytestContentPack, validateLoadedPlaytestPack } from '../playtest-pack-loader';

const pack = loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'), {
  workspaceRoot: resolve('.'),
});

describe('fd-playtest-v1 master content', () => {
  it('loads the approved seven authoring masters through the playtest pack', () => {
    expect(pack.masters.map((master) => master.id)).toEqual([
      'master.kayneth',
      'master.shinji',
      'master.kiritsugu',
      'master.maiya',
      'master.gatou',
      'master.irisviel',
      'master.olga-marie',
    ]);
  });

  it('keeps every master overview, skill, command spell and generated card resolvable', () => {
    const cardIds = new Set(pack.cards.map((card) => card.id));

    for (const master of pack.masters) {
      expect(cardIds.has(master.overviewCardId), master.id).toBe(true);
      for (const cardId of [
        ...master.skillCardIds,
        ...master.commandSpellCardIds,
        ...(master.linkedCards.generated ?? []),
      ]) {
        expect(cardIds.has(cardId), `${master.id} -> ${cardId}`).toBe(true);
      }
    }
  });

  it('preserves card text, timing, cost, power and original source evidence for product display', () => {
    const cards = pack.cards.filter((card) => card.id.startsWith('master.'));

    expect(cards.length).toBeGreaterThan(20);
    expect(cards.some((card) => card.printedText?.length)).toBe(true);
    expect(cards.some((card) => card.timing?.includes('action'))).toBe(true);
    expect(cards.some((card) => card.printedCost !== undefined)).toBe(true);
    expect(cards.some((card) => card.printedValue !== undefined)).toBe(true);

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
