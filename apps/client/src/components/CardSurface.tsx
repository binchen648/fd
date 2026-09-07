import { useState } from 'react';

import type { InspectableCard } from '../state/playtest-fixture-loader';

export interface CardSurfaceProps {
  card: InspectableCard;
  onInspect: (card: InspectableCard) => void;
  compact?: boolean;
}

function cardValueText(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  if (typeof value === 'object') {
    const printedExpression = (value as { printedExpression?: unknown }).printedExpression;
    if (typeof printedExpression === 'number' || typeof printedExpression === 'string') return String(printedExpression);
    const formula = (value as { formula?: unknown }).formula;
    if (typeof formula === 'number' || typeof formula === 'string') return String(formula);
  }
  return String(value);
}

export function CardSurface({ card, onInspect, compact = false }: CardSurfaceProps) {
  const [previewed, setPreviewed] = useState(false);
  const hasMeta = card.cost !== undefined || card.power !== undefined || card.effectTiming || card.sourceLabel;
  const costText = cardValueText(card.cost);
  const powerText = cardValueText(card.power);

  return (
    <div className={`card-surface-wrap${compact ? ' card-surface-wrap--compact' : ''}`}>
      <button
        type='button'
        className='card-surface'
        aria-label={`检视 ${card.name}`}
        onMouseEnter={() => setPreviewed(true)}
        onMouseLeave={() => setPreviewed(false)}
        onFocus={() => setPreviewed(true)}
        onBlur={() => setPreviewed(false)}
        onClick={() => onInspect(card)}
      >
        {card.imageUrl ? <img className='card-surface__image' src={card.imageUrl} alt={`${card.name}卡图`} /> : <span className='card-surface__sigil' aria-hidden='true'>✦</span>}
        <span className='card-surface__shade' aria-hidden='true' />
        {hasMeta ? (
          <span className='card-surface__badges' aria-hidden='true'>
            {card.cost !== undefined ? <b title='费用'>费 {costText}</b> : null}
            {card.power !== undefined ? <b title='威力'>威 {powerText}</b> : null}
            {card.effectTiming ? <b title={`时机：${card.effectTiming}`}>时</b> : null}
            {card.sourceLabel ? <b title={`来源：${card.sourceLabel}`}>源</b> : null}
          </span>
        ) : null}
        <span className='card-surface__caption'>
            <span className='card-surface__type'>{card.cardType}</span>
            <strong>{card.name}</strong>
            <small>{card.effectTiming ?? card.visibility}</small>
          </span>
      </button>
      {previewed ? (
        <aside className='card-preview' role='tooltip'>
          {card.imageUrl ? <img src={card.imageUrl} alt='' /> : null}
          <div>
            <span>{card.cardType} · {card.effectTiming ?? card.visibility}</span>
            <strong>{card.name}</strong>
            {card.revealPolicy ? <em>{card.revealPolicy}</em> : null}
            {hasMeta ? (
              <span className='card-preview__badges'>
                {card.cost !== undefined ? <b>费用 {costText}</b> : null}
                {card.power !== undefined ? <b>威力 {powerText}</b> : null}
                {card.effectTiming ? <b>时机 {card.effectTiming}</b> : null}
                {card.sourceLabel ? <b>来源已标记</b> : null}
              </span>
            ) : null}
            <p>{card.rulesSummaryZh}</p>
            <small>单击打开完整卡牌检视</small>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
