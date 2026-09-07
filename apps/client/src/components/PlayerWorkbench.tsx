import type { InspectableCard, PlaytestClientFixture } from '../state/playtest-fixture-loader';
import { CardSurface } from './CardSurface';
import { ServantDeckSummary } from './ServantDeckSummary';

export interface PlayerWorkbenchProps {
  self: PlaytestClientFixture['self'];
  cards: InspectableCard[];
  collapsed: boolean;
  focused?: boolean;
  onRequestFocus?: () => void;
  onToggle: () => void;
  onInspect: (card: InspectableCard) => void;
}

export function PlayerWorkbench({ self, cards, collapsed, focused = false, onRequestFocus = () => undefined, onToggle, onInspect }: PlayerWorkbenchProps) {
  const byId = new Map(cards.map((card) => [card.instanceId, card]));
  const servantDeckGuide = self.servantDeckGuideCardId ? byId.get(self.servantDeckGuideCardId) : undefined;
  const stagedAttackArea = self.stagedAttackArea ?? [];
  const attackArea = self.attackArea ?? [];
  const discard = self.discard ?? [];
  const commandSpells = self.commandSpells ?? [];
  const displayedHand = self.hand.filter((id) => !stagedAttackArea.includes(id));
  const zoneSummary = [
    { label: '御主技能', count: self.masterSkills?.length ?? 0 },
    { label: '令咒', count: commandSpells.length },
    { label: '升华技', count: self.ascensionSkills?.length ?? 0 },
    { label: '从者技能', count: self.skills.length },
    { label: '待确认', count: stagedAttackArea.length },
    { label: '攻击区', count: attackArea.length },
    { label: '手牌', count: displayedHand.length },
    { label: '牌库', count: self.deck.remaining ?? self.deck.size },
    { label: '弃牌', count: discard.length },
  ];

  return (
    <section className={`workbench${collapsed ? ' workbench--collapsed' : ''}${focused ? ' workbench--focused' : ''}`} aria-label='本人操作台'>
      <button type='button' className='workbench__toggle' onClick={onToggle} aria-expanded={!collapsed}>
        <span>本人操作台 · {self.masterName} / {self.servantName}</span>
        <span>{focused && !collapsed ? '操作聚焦' : collapsed ? '展开' : '收起'}</span>
      </button>
      {collapsed ? (
        <div className='workbench__summary' aria-label='本人操作台区域概览'>
          {zoneSummary.map((zone) => (
            <span key={zone.label}><b>{zone.label}</b><strong>{zone.count}</strong></span>
          ))}
        </div>
      ) : (
        <div className='workbench__body'>
          <div className='workbench__identity'>
            <figure>{self.masterImageUrl ? <img src={self.masterImageUrl} alt='' /> : null}<figcaption><small>御主</small><strong>{self.masterName}</strong></figcaption></figure>
            <figure>{self.servantImageUrl ? <img src={self.servantImageUrl} alt='' /> : null}<figcaption><small>从者</small><strong>{self.servantName}</strong></figcaption></figure>
            <details className='workbench__deck-drawer'>
              <summary>牌库构成</summary>
              <div>
                {servantDeckGuide ? (
                  <section className='workbench__deck-guide' aria-label='从者牌库说明'>
                    <h3>从者牌库说明</h3>
                    <CardSurface card={servantDeckGuide} onInspect={onInspect} compact />
                  </section>
                ) : null}
                <ServantDeckSummary servantName={self.servantName} deck={self.deck} />
              </div>
            </details>
          </div>
          <div className='workbench__zones'>
            <section className='workbench__master-skills workbench__zone--master'>
              <h3>御主本体技能</h3>
              <div className='card-row'>{(self.masterSkills ?? []).map((id) => byId.get(id)).filter((card): card is InspectableCard => Boolean(card)).map((card) => <CardSurface key={card.instanceId} card={card} onInspect={onInspect} compact />)}</div>
              <h3>令咒区 · {commandSpells.length} 张</h3>
              <div className='card-row card-row--short'>{commandSpells.map((id) => byId.get(id)).filter((card): card is InspectableCard => Boolean(card)).map((card) => <CardSurface key={card.instanceId} card={card} onInspect={onInspect} compact />)}</div>
              <h3>升华技</h3>
              <div className='card-row card-row--short'>{(self.ascensionSkills ?? []).map((id) => byId.get(id)).filter((card): card is InspectableCard => Boolean(card)).map((card) => <CardSurface key={card.instanceId} card={card} onInspect={onInspect} compact />)}</div>
            </section>
            <section className='workbench__zone--servant-skills'><h3>从者技能 · {self.skills.length} 张</h3><div className='card-row'>{self.skills.map((id) => byId.get(id)).filter((card): card is InspectableCard => Boolean(card)).map((card) => <CardSurface key={card.instanceId} card={card} onInspect={onInspect} compact />)}</div></section>
            <section className='workbench__attack-zone'>
              <h3>待确认攻击 · {stagedAttackArea.length} 张</h3>
              <div className='card-row card-row--short'>{stagedAttackArea.map((id) => byId.get(id)).filter((card): card is InspectableCard => Boolean(card)).map((card) => <CardSurface key={card.instanceId} card={card} onInspect={onInspect} compact />)}</div>
              <h3>攻击区 · {attackArea.length} 张</h3>
              <div className='card-row card-row--short'>{attackArea.map((id) => byId.get(id)).filter((card): card is InspectableCard => Boolean(card)).map((card) => <CardSurface key={card.instanceId} card={card} onInspect={onInspect} compact />)}</div>
            </section>
            <section className='workbench__zone--hand' onMouseEnter={onRequestFocus} onFocus={onRequestFocus}><h3>手牌 · {displayedHand.length} 张</h3><div className='card-row card-row--fan'>{displayedHand.map((id) => byId.get(id)).filter((card): card is InspectableCard => Boolean(card)).map((card) => <CardSurface key={card.instanceId} card={card} onInspect={onInspect} compact />)}</div></section>
            <section className='workbench__zone--discard'><h3>弃牌堆 · {discard.length} 张</h3><div className='card-row'>{discard.map((id) => byId.get(id)).filter((card): card is InspectableCard => Boolean(card)).map((card) => <CardSurface key={card.instanceId} card={card} onInspect={onInspect} compact />)}</div></section>
          </div>
        </div>
      )}
    </section>
  );
}
