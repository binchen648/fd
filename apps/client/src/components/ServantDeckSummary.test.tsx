import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ServantDeckSummary } from './ServantDeckSummary';

describe('ServantDeckSummary', () => {
  it('shows all four attribute counts and the exact twelve-card composition', () => {
    render(
      <ServantDeckSummary
        servantName='弗朗西斯·德雷克'
        deck={{
          size: 12,
          attributeCounts: { strength: 3, agility: 5, magecraft: 0, special: 4 },
          entries: [
            { entryType: 'basic', attribute: 'strength', printedValue: 2, copies: 1 },
            { entryType: 'basic', attribute: 'strength', printedValue: 3, copies: 2 },
            { entryType: 'basic', attribute: 'agility', printedValue: 2, copies: 1 },
            { entryType: 'basic', attribute: 'agility', printedValue: 3, copies: 2 },
            { entryType: 'basic', attribute: 'agility', printedValue: 4, copies: 1 },
            { entryType: 'basic', attribute: 'agility', printedValue: 5, copies: 1 },
            { entryType: 'named', attribute: 'special', cardId: 'basic.luck', copies: 1 },
            { entryType: 'named', attribute: 'special', cardId: 'basic.preparation', copies: 1 },
            { entryType: 'named', attribute: 'special', cardId: 'basic.surveil', copies: 2 },
          ],
        }}
      />,
    );

    expect(screen.getByText('力量 3')).toBeInTheDocument();
    expect(screen.getByText('敏捷 5')).toBeInTheDocument();
    expect(screen.getByText('魔术 0')).toBeInTheDocument();
    expect(screen.getByText('特殊 4')).toBeInTheDocument();
    expect(screen.getByText('12 / 12 张')).toBeInTheDocument();
    expect(screen.getByText(/幸运 ×1/)).toBeInTheDocument();
    expect(screen.getByText(/远隔操作 ×1/)).toBeInTheDocument();
    expect(screen.getByText(/急行 ×2/)).toBeInTheDocument();
  });

  it('shows replaced current deck entries such as Kiritsugu Origin Bullet', () => {
    render(
      <ServantDeckSummary
        servantName='阿尔托莉雅'
        deck={{
          size: 12,
          remaining: 9,
          handCount: 3,
          discardCount: 0,
          removedCount: 0,
          attributeCounts: { strength: 4, agility: 2, magecraft: 3, special: 3 },
          entries: [
            { entryType: 'basic', attribute: 'strength', printedValue: 2, copies: 2 },
            { entryType: 'basic', attribute: 'strength', printedValue: 3, copies: 2 },
          ],
          currentEntries: [
            { entryType: 'basic', attribute: 'strength', printedValue: 2, copies: 1 },
            { entryType: 'named', attribute: 'special', cardId: 'master.kiritsugu.deck.origin-bullet', copies: 1 },
          ],
        }}
      />,
    );

    expect(screen.getByText('当前牌库/手牌构成')).toBeInTheDocument();
    expect(screen.getByText(/起源弹 ×1/)).toBeInTheDocument();
  });
});
