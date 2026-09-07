import type { ServantDeckView } from '../state/playtest-fixture-loader';

export interface ServantDeckSummaryProps {
  servantName: string;
  deck: ServantDeckView;
}

const attributeLabels = {
  strength: '力量',
  agility: '敏捷',
  magecraft: '魔术',
  special: '特殊',
} as const;

const namedCardLabels: Record<string, string> = {
  'servant.bb.moon_cancer': '月之癌',
  'basic.luck': '幸运',
  'basic.preparation': '远隔操作',
  'basic.surveil': '急行',
  'servant.artoriac.skill.sc-artoriac-4': "Pilgrim's Call",
  'servant.artoriac.skill.sc-artoriac-5': "Pilgrim's Respite",
  'servant.artoriac.skill.sc-artoriac-6': "Pilgrim's Destiny",
  'master.kiritsugu.deck.origin-bullet': '起源弹',
};

export function ServantDeckSummary({ servantName, deck }: ServantDeckSummaryProps) {
  const total = deck.entries.reduce((sum, entry) => sum + entry.copies, 0);
  const currentEntries = deck.currentEntries?.length ? deck.currentEntries : [];
  const currentCounts = [
    typeof deck.remaining === 'number' ? `牌库 ${deck.remaining}` : undefined,
    typeof deck.handCount === 'number' ? `手牌 ${deck.handCount}` : undefined,
    typeof deck.discardCount === 'number' ? `弃牌 ${deck.discardCount}` : undefined,
    typeof deck.removedCount === 'number' ? `移除 ${deck.removedCount}` : undefined,
  ].filter(Boolean);

  return (
    <section className='deck-summary' aria-label={`${servantName} 初始牌库`}>
      <div className='deck-summary__heading'>
        <span>初始牌库构成</span>
        <strong>{total} / {deck.size} 张</strong>
      </div>
      {currentCounts.length ? <p className='deck-summary__current'>{currentCounts.join(' · ')}</p> : null}
      <div className='deck-summary__attributes'>
        {(Object.keys(attributeLabels) as Array<keyof typeof attributeLabels>).map((attribute) => (
          <span key={attribute} data-attribute={attribute}>
            {attributeLabels[attribute]} {deck.attributeCounts[attribute]}
          </span>
        ))}
      </div>
      <ul className='deck-summary__entries'>
        {deck.entries.map((entry, index) => {
          const label = entry.cardId
            ? namedCardLabels[entry.cardId] ?? entry.cardId
            : `${attributeLabels[entry.attribute]} ${entry.printedValue ?? '—'}`;
          return <li key={`${entry.cardId ?? entry.attribute}-${entry.printedValue ?? index}`}>{label} ×{entry.copies}</li>;
        })}
      </ul>
      {currentEntries.length ? (
        <>
          <p className='deck-summary__subheading'>当前牌库/手牌构成</p>
          <ul className='deck-summary__entries deck-summary__entries--current'>
            {currentEntries.map((entry, index) => {
              const label = entry.cardId
                ? namedCardLabels[entry.cardId] ?? entry.cardId
                : `${attributeLabels[entry.attribute]} ${entry.printedValue ?? '—'}`;
              return <li key={`current-${entry.cardId ?? entry.attribute}-${entry.printedValue ?? index}`}>{label} ×{entry.copies}</li>;
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}
