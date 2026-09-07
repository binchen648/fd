import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import type { ClientAvailableAction, InspectableCard } from '../state/playtest-fixture-loader';
import { AvailableActionBar } from './AvailableActionBar';

export interface CardInspectionOverlayProps {
  card: InspectableCard;
  actions: ClientAvailableAction[];
  onClose: () => void;
  onAction: (action: ClientAvailableAction) => void;
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

export function CardInspectionOverlay({ card, actions, onClose, onAction }: CardInspectionOverlayProps) {
  const hasCoreStats = card.cost !== undefined || card.power !== undefined || card.effectTiming || card.sourceLabel;
  const costText = cardValueText(card.cost);
  const powerText = cardValueText(card.power);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return createPortal(
    <div
      className='inspection-backdrop'
      data-testid='card-inspection-backdrop'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className='inspection-dialog' role='dialog' aria-modal='true' aria-label={card.name}>
        <button className='inspection-dialog__close' type='button' onClick={onClose} aria-label='关闭卡牌检视'>×</button>
        <div className='inspection-card-art' aria-label={`${card.name} 卡面`}>
          {card.imageUrl ? <img src={card.imageUrl} alt={`${card.name}完整卡图`} /> : <><span>F/D</span><strong>{card.name}</strong><small>{card.cardType}</small></>}
        </div>
        <div className='inspection-copy'>
          <p className='inspection-copy__eyebrow'>{card.cardType} · {card.visibility}</p>
          <h2>{card.name}</h2>
          {hasCoreStats ? (
            <div className='inspection-stat-frame' aria-label='卡牌核心信息'>
              {card.cost !== undefined ? <span><b>费</b><strong>{costText}</strong></span> : null}
              {card.power !== undefined ? <span><b>威</b><strong>{powerText}</strong></span> : null}
              {card.effectTiming ? <span><b>时</b><strong>{card.effectTiming}</strong></span> : null}
              {card.sourceLabel ? <span><b>源</b><strong>CHM</strong></span> : null}
            </div>
          ) : null}
          <dl>
            <div><dt>归属</dt><dd>{card.ownerLabel}</dd></div>
            {card.effectTiming ? <div><dt>时机</dt><dd>{card.effectTiming}</dd></div> : null}
            {card.revealPolicy ? <div><dt>公开</dt><dd>{card.revealPolicy}</dd></div> : null}
            {card.cost !== undefined ? <div><dt>费用</dt><dd>{costText}</dd></div> : null}
            {card.power !== undefined ? <div><dt>威力</dt><dd>{powerText}</dd></div> : null}
          </dl>
          <p className='inspection-copy__rules'>{card.rulesSummaryZh}</p>
          {card.keywords?.length ? <p className='inspection-copy__keywords'>{card.keywords.join(' · ')}</p> : null}
          {card.sourceLabel ? <small className='inspection-copy__source'>来源：{card.sourceLabel}</small> : null}
          <AvailableActionBar actions={actions} onAction={onAction} />
        </div>
      </section>
    </div>,
    document.body,
  );
}
