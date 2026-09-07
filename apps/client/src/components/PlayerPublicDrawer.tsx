import { useEffect } from 'react';

import type { InspectableCard, PlaytestClientFixture } from '../state/playtest-fixture-loader';
import { CardSurface } from './CardSurface';

type Player = PlaytestClientFixture['players'][number];

export interface PlayerPublicDrawerProps {
  player: Player;
  masterCard?: InspectableCard;
  masterSkills: InspectableCard[];
  ascensionSkills: InspectableCard[];
  publicCards: InspectableCard[];
  onClose: () => void;
  onInspect: (card: InspectableCard) => void;
}

export function PlayerPublicDrawer({ player, masterCard, masterSkills, ascensionSkills, publicCards, onClose, onInspect }: PlayerPublicDrawerProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className='dossier-backdrop' onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className='player-dossier' role='dialog' aria-modal='true' aria-label={`${player.name}公开情报`}>
        <button type='button' className='player-dossier__close' onClick={onClose} aria-label='关闭玩家公开情报'>×</button>
        <header>
          <span>SEAT {player.seat} · PUBLIC DOSSIER</span>
          <h2>{player.name}公开情报</h2>
          <p>仅展示公开信息；手牌、未公开技能和暗置牌不会出现在这里。</p>
        </header>
        <div className='player-dossier__portraits'>
          <figure>{player.masterImageUrl ? <img src={player.masterImageUrl} alt='' /> : null}<figcaption><small>御主</small><strong>{player.masterName}</strong></figcaption></figure>
          <figure>{player.servantImageUrl ? <img src={player.servantImageUrl} alt='' /> : null}<figcaption><small>从者</small><strong>{player.servantName}</strong></figcaption></figure>
        </div>
        <dl className='player-dossier__stats'>
          <div><dt>地点</dt><dd>{player.location}</dd></div><div><dt>胜利点</dt><dd>{player.vp}</dd></div>
          <div><dt>魔力</dt><dd>{player.mana}</dd></div><div><dt>令咒</dt><dd>{player.commandSpells}</dd></div>
        </dl>
        <section className='player-dossier__public-cards'>
          <h3>御主主卡 · 始终公开</h3>
          <div className='card-row card-row--master-overview'>{masterCard ? <CardSurface card={masterCard} onInspect={onInspect} compact /> : <p>御主主卡数据待接入</p>}</div>
          <h3>御主本体技能</h3>
          <div className='card-row'>{masterSkills.length ? masterSkills.map((card) => <CardSurface key={card.instanceId} card={card} onInspect={onInspect} compact />) : <p>暂无公开御主技能</p>}</div>
          <h3>升华技</h3>
          <div className='card-row'>{ascensionSkills.length ? ascensionSkills.map((card) => <CardSurface key={card.instanceId} card={card} onInspect={onInspect} compact />) : <p>暂无公开升华技</p>}</div>
          <h3>已公开卡牌</h3>
          <div className='card-row'>{publicCards.length ? publicCards.map((card) => <CardSurface key={card.instanceId} card={card} onInspect={onInspect} compact />) : <p>暂无已公开卡牌</p>}</div>
        </section>
      </aside>
    </div>
  );
}
