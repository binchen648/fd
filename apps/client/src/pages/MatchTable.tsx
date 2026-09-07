import { useEffect, useMemo, useState } from 'react';

import { CardInspectionOverlay } from '../components/CardInspectionOverlay';
import { CardSurface } from '../components/CardSurface';
import { PlayerWorkbench } from '../components/PlayerWorkbench';
import { PlayerPublicDrawer } from '../components/PlayerPublicDrawer';
import {
  loadPlaytestClientFixture,
  type ClientAvailableAction,
  type ClientInteractionWindow,
  type InspectableCard,
  type PlaytestClientFixture,
} from '../state/playtest-fixture-loader';
import './MatchTable.css';

export interface MatchTableProps {
  fixture?: PlaytestClientFixture;
  onAction?: (action: ClientAvailableAction) => void;
  onConsumeDirective?: (directiveId: string) => void;
  onPauseForFix?: (directiveId: string) => void;
  onRestoreReplay?: (checkpointId: string) => void;
  onEndTurn?: () => void;
  canAdjudicate?: boolean;
}

export default function MatchTable({
  fixture = loadPlaytestClientFixture(),
  onAction = () => undefined,
  onConsumeDirective = () => undefined,
  onPauseForFix = () => undefined,
  onRestoreReplay = () => undefined,
  onEndTurn = () => undefined,
  canAdjudicate = false,
}: MatchTableProps) {
  const [inspectedCard, setInspectedCard] = useState<InspectableCard | null>(null);
  const [workbenchCollapsed, setWorkbenchCollapsed] = useState(false);
  const [manualWorkbenchFocus, setManualWorkbenchFocus] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [usingNonPriorityView, setUsingNonPriorityView] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedTargetsByWindow, setSelectedTargetsByWindow] = useState<Record<string, string[]>>({});
  const [paymentByWindow, setPaymentByWindow] = useState<Record<string, number>>({});
  const [dismissedAbilityPrompts, setDismissedAbilityPrompts] = useState<Record<string, true>>({});
  const [abilityPaymentsByAction, setAbilityPaymentsByAction] = useState<Record<string, Record<string, number>>>({});
  const cardsById = useMemo(() => new Map(fixture.cards.map((card) => [card.instanceId, card])), [fixture.cards]);
  const situationCard = fixture.situation ? cardsById.get(fixture.situation.cardId) : undefined;
  const activeServerView = usingNonPriorityView && fixture.nonPriorityView
    ? fixture.nonPriorityView
    : { priorityPlayerId: fixture.match.priorityPlayerId, availableActions: fixture.availableActions };
  const selectedActions = inspectedCard
    ? activeServerView.availableActions.filter(
        (action) => action.sourceCardInstanceId === inspectedCard.instanceId || action.targetId === inspectedCard.instanceId,
      )
    : [];
  const isWorkbenchFocusWanted = !usingNonPriorityView && (
    activeServerView.availableActions.length > 0 ||
    (fixture.interactionWindows?.length ?? 0) > 0 ||
    manualWorkbenchFocus ||
    inspectedCard !== null
  );
  const currentPlayer = fixture.players.find((player) => player.id === activeServerView.priorityPlayerId);
  const selectedPlayer = fixture.players.find((player) => player.id === selectedPlayerId);
  const selectedPlayerMasterCard = selectedPlayer?.publicMasterCardId
    ? cardsById.get(selectedPlayer.publicMasterCardId)
    : undefined;
  const interactionWindows = useMemo(() => {
    const projectedWindows = fixture.interactionWindows ?? [];
    if (projectedWindows.some((window) => window.kind === 'target')) return projectedWindows;
    const targetActions = activeServerView.availableActions.filter((action) => action.backendCommand?.type === 'choose_target');
    if (!targetActions.length) return projectedWindows;
    const firstAction = targetActions[0]!;
    const first = firstAction.backendCommand;
    if (!first || first.type !== 'choose_target') return projectedWindows;
    const labelCandidate = (id: string) => {
      const card = cardsById.get(id);
      if (card) return { id, label: card.name, kind: 'card' as const, zone: card.cardType };
      const player = fixture.players.find((candidate) => candidate.id === id);
      if (player) return { id, label: `席位 ${player.seat} · ${player.name}`, kind: 'player' as const };
      const location = fixture.locations.find((candidate) => candidate.id === id);
      if (location) return { id, label: location.name, kind: 'location' as const };
      return { id, label: id, kind: 'option' as const };
    };
    return [
      ...projectedWindows,
      {
        id: first.decisionId,
        kind: 'target' as const,
        title: '选择目标',
        controllerId: activeServerView.priorityPlayerId,
        min: firstAction.minTargets ?? 1,
        max: firstAction.maxTargets ?? 1,
        candidates: (firstAction.targetCandidates ?? []).map(labelCandidate),
        actions: targetActions,
      },
    ];
  }, [activeServerView.availableActions, activeServerView.priorityPlayerId, cardsById, fixture.interactionWindows, fixture.locations, fixture.players]);
  const directives = fixture.directives ?? [];
  const zones = fixture.zones ?? [];
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId);
  const selectedZoneCards = (selectedZone?.cardIds ?? [])
    .map((id) => cardsById.get(id))
    .filter((card): card is InspectableCard => Boolean(card));
  const selectedZoneUnknownIds = (selectedZone?.cardIds ?? []).filter((id) => !cardsById.has(id));
  const logs = fixture.logs ?? [];
  const replay = fixture.replay ?? [];
  const finalRanking = fixture.finalRanking ?? [];
  const abilityPromptActions = activeServerView.availableActions.filter((action) =>
    action.backendCommand?.type === 'activate_ability' && !dismissedAbilityPrompts[action.actionId],
  );
  const eventDeckCount = zones.find((zone) => zone.id === 'event_deck')?.count ?? 0;
  const situationDeckCount = zones.find((zone) => zone.id === 'situation_deck')?.count ?? 0;
  const selectedPlayerMasterSkills = (selectedPlayer?.publicMasterSkillIds ?? [])
    .map((id) => cardsById.get(id))
    .filter((card): card is InspectableCard => Boolean(card));
  const selectedPlayerAscensionSkills = (selectedPlayer?.publicAscensionSkillIds ?? [])
    .map((id) => cardsById.get(id))
    .filter((card): card is InspectableCard => Boolean(card));
  const selectedPlayerRevealedCards = (selectedPlayer?.publicRevealedCardIds ?? [])
    .map((id) => cardsById.get(id))
    .filter((card): card is InspectableCard => Boolean(card));
  const workshop = fixture.locations.find((location) => location.id === 'magic_workshop');
  const miyama = fixture.locations.find((location) => location.id === 'miyama_town');
  const shinto = fixture.locations.find((location) => location.id === 'shinto');
  const recon = fixture.locations.find((location) => location.id === 'recon');
  const decisionPhaseLabel = fixture.match.phase.includes('准备')
    ? '准备'
    : fixture.match.phase.includes('前哨')
      ? '前哨'
      : fixture.match.phase.includes('战斗')
        ? '战斗'
        : '行动';
  const decisionTitle = `完成本次${decisionPhaseLabel}`;
  const endDecisionLabel = decisionPhaseLabel === '行动' ? '结束行动' : `完成${decisionPhaseLabel}`;
  const renderOccupantToken = (playerId: string, className?: string) => {
    const player = fixture.players.find((candidate) => candidate.id === playerId);
    return (
      <button
        type='button'
        key={playerId}
        className={className}
        title={player ? `席位 ${player.seat} · ${player.name} · ${player.servantName}` : playerId}
        aria-label={`查看玩家 ${player?.seat ?? playerId}`}
        onClick={() => setSelectedPlayerId(playerId)}
      >
        {player?.servantImageUrl ? <img src={player.servantImageUrl} alt='' /> : player?.seat ?? playerId}
      </button>
    );
  };
  const renderSlotBoard = (
    label: string,
    slots: number[] | undefined,
    occupants: string[],
    className: string,
  ) => slots?.length ? (
    <div className={`location-node__slot-board ${className}`} aria-label={label}>
      <b>{label}</b>
      {slots.map((slot, index) => {
        const occupantId = occupants[index];
        return (
          <span key={`${label}-${slot}-${index}`} className={occupantId ? 'is-occupied' : undefined}>
            <small>+{slot}</small>
            {occupantId ? renderOccupantToken(occupantId, 'location-node__slot-player') : <em>空</em>}
          </span>
        );
      })}
    </div>
  ) : null;
  const renderLocationEvents = (locationId: string, locationName: string) => {
    const events = (fixture.battleEvents ?? [])
      .filter((event) => event.locationId === locationId)
      .map((event) => ({ ...event, card: cardsById.get(event.cardId) }))
      .filter((event): event is typeof event & { card: InspectableCard } => Boolean(event.card));
    if (!events.length) return null;
    return (
      <div className='location-node__events' aria-label={`${locationName}事件牌`}>
        {events.map((event, index) => (
          <article key={event.id} className={`location-node__event${index > 0 ? ' location-node__event--sideways' : ''}`}>
            <span>{event.label}</span>
            <CardSurface card={event.card} onInspect={setInspectedCard} compact />
          </article>
        ))}
      </div>
    );
  };
  const renderLocation = (location: PlaytestClientFixture['locations'][number]) => (
    <article key={location.id} aria-label={location.name} className={`location-node location-node--${location.id}`}>
      {location.imageUrl ? <img className='location-node__image' src={location.imageUrl} alt='' /> : null}
      <span className='location-node__shade' aria-hidden='true' />
      <div className='location-node__copy'>
        <span className='location-node__area'>{location.mapArea}</span>
        <h2>{location.name}</h2>
        <p>{location.subtitle}</p>
        {location.capacityLabel ? <span className='location-node__rule'>容量 {location.capacityLabel}</span> : null}
        {location.contestVp !== undefined ? <span className='location-node__vp'>F 竞争战果 {location.contestVp}</span> : null}
        {location.reconVp !== undefined ? <span className='location-node__vp'>G 侦察 +{location.reconVp} VP</span> : null}
        {location.moveCostToNext !== undefined ? <span className='location-node__route'>E 移动成本 {location.moveCostToNext}</span> : null}
      </div>
      {renderSlotBoard('D 地利位', location.terrainSlots, location.occupants, 'location-node__slot-board--terrain')}
      {renderSlotBoard('C 工房位', location.workshopManaSlots, location.occupants, 'location-node__slot-board--workshop')}
      {renderLocationEvents(location.id, location.name)}
      <div className='location-node__occupants' aria-label={`${location.name}部署玩家`}>
        {location.occupants.slice(location.terrainSlots?.length ?? location.workshopManaSlots?.length ?? 0).map((id) => renderOccupantToken(id))}
      </div>
    </article>
  );
  const toggleTarget = (windowId: string, candidateId: string, max = 1) => {
    setSelectedTargetsByWindow((current) => {
      const selected = current[windowId] ?? [];
      const next = selected.includes(candidateId)
        ? selected.filter((id) => id !== candidateId)
        : max <= 1
          ? [candidateId]
          : [...selected, candidateId].slice(0, max);
      return { ...current, [windowId]: next };
    });
  };
  const dispatchPayment = (action: ClientAvailableAction, window: ClientInteractionWindow) => {
    if (!action.backendCommand || action.backendCommand.type !== 'activate_ability' || !window.variableCosts?.length) {
      onAction(action);
      return;
    }
    const payment = paymentByWindow[window.id] ?? window.variableCosts[0]!.min;
    onAction({
      ...action,
      backendCommand: {
        ...action.backendCommand,
        variables: Object.fromEntries(window.variableCosts.map((cost) => [
          cost.name,
          Math.min(cost.max, Math.max(cost.min, payment)),
        ])),
      },
    });
  };
  const dispatchTargetChoice = (action: ClientAvailableAction, window: ClientInteractionWindow) => {
    if (!action.backendCommand || action.backendCommand.type !== 'choose_target') {
      onAction(action);
      return;
    }
    onAction({
      ...action,
      backendCommand: {
        ...action.backendCommand,
        selectedIds: selectedTargetsByWindow[window.id] ?? [],
      },
    });
  };
  const dispatchAbilityPromptAction = (action: ClientAvailableAction) => {
    if (!action.backendCommand || action.backendCommand.type !== 'activate_ability') {
      onAction(action);
      return;
    }
    const variableCosts = action.backendCommand.variableCosts ?? [];
    if (!variableCosts.length) {
      onAction(action);
      return;
    }
    const selectedPayments = abilityPaymentsByAction[action.actionId] ?? {};
    onAction({
      ...action,
      backendCommand: {
        ...action.backendCommand,
        variables: Object.fromEntries(variableCosts.map((cost) => [
          cost.name,
          Math.min(cost.max, Math.max(cost.min, selectedPayments[cost.name] ?? cost.min)),
        ])),
      },
    });
  };
  const endTurn = () => {
    if (fixture.optionalAbilityReminder) {
      setShowReminder(true);
      return;
    }
    setManualWorkbenchFocus(false);
    setWorkbenchCollapsed(true);
    onEndTurn();
  };

  useEffect(() => {
    setDismissedAbilityPrompts({});
    setAbilityPaymentsByAction({});
    setManualWorkbenchFocus(false);
  }, [fixture.match.round, fixture.match.phase, fixture.match.priorityPlayerId]);

  useEffect(() => {
    setWorkbenchCollapsed(!isWorkbenchFocusWanted);
  }, [fixture.match.phase, fixture.match.priorityPlayerId, fixture.match.round, isWorkbenchFocusWanted]);

  const isWorkbenchFocused = isWorkbenchFocusWanted && !workbenchCollapsed;

  return (
    <main className={`match-table${isWorkbenchFocused ? ' match-table--workbench-focused' : ''}`}>
      <header className='phase-rail'>
        <div><span>ROUND</span><strong>{String(fixture.match.round).padStart(2, '0')}</strong></div>
        <div className='phase-rail__phase'><small>当前阶段</small><strong>{fixture.match.phase}</strong></div>
        <div><small>行动者</small><strong>{currentPlayer?.name ?? '—'} · {currentPlayer?.servantName ?? '—'}</strong></div>
        <nav aria-label='演示状态'>
          <span className='view-mode-label'>{usingNonPriorityView ? '非优先视角' : '本人优先视角'}</span>
          {fixture.nonPriorityView ? (
            <button type='button' onClick={() => setUsingNonPriorityView((value) => !value)}>
              {usingNonPriorityView ? '切换至本人优先视角' : '切换至非优先视角'}
            </button>
          ) : null}
          <button type='button' className='is-active'>总览</button><button type='button'>移动</button><button type='button'>出牌</button><button type='button'>战斗</button>
        </nav>
      </header>

      {fixture.phaseTrack?.length ? (
        <section className='phase-track' aria-label='实战阶段流程'>
          {fixture.phaseTrack.map((phase) => (
            <span key={phase.id} className={`phase-track__step is-${phase.status}`}>
              {phase.label}
            </span>
          ))}
        </section>
      ) : null}

      <section className='seat-rail' aria-label='七人席位'>
          <div className='rail-title'><span>SEVEN CONTRACTS</span><strong>点击席位查看公开区</strong></div>
          {fixture.players.map((player) => (
            <button key={player.id} type='button' aria-label={`查看玩家 ${player.seat}：${player.name}`} onClick={() => setSelectedPlayerId(player.id)} className={`seat-card${player.id === activeServerView.priorityPlayerId ? ' is-priority' : ''}`}>
              <span className='seat-card__portrait'>{player.servantImageUrl ? <img src={player.servantImageUrl} alt='' /> : null}</span>
              <span className='seat-card__number'>{player.seat}</span>
              <span><strong>{player.name}</strong><small>{player.masterName} / {player.servantName}</small></span>
              <span className='seat-card__stats'><b>{player.vp} VP</b><small>◇ {player.mana} · 令咒 {player.commandSpells}</small></span>
            </button>
          ))}
      </section>

      <div className='match-table__layout'>

        <section className='battlefield' aria-label='中央地图'>
          <div className='battlefield__halo' aria-hidden='true' />
          <header><span>FATE / DOMINATION</span><strong>冬木灵脉战域</strong><small>移动费用 1 · 工房容量 4 · 战场人数不限</small></header>
          <div className='location-grid'>
            <section className='map-deck-cell map-deck-cell--situation' aria-label='局势牌库区'>
              <span>A1</span><strong>局势牌库</strong><b>{situationDeckCount}</b>
            </section>
            {workshop ? (
              <article aria-label={workshop.name} className={`location-node location-node--${workshop.id}`}>
                {workshop.imageUrl ? <img className='location-node__image' src={workshop.imageUrl} alt='' /> : null}
                <span className='location-node__shade' aria-hidden='true' />
                {fixture.situation && situationCard ? (
                  <section className='situation-strip' aria-label='当前局势牌'>
                    <CardSurface card={situationCard} onInspect={setInspectedCard} compact />
                    <div>
                      <span>A2 激活局势</span>
                      <strong>{situationCard.name}</strong>
                      <p>{fixture.situation.effectText}</p>
                    </div>
                    <b>回蓝 {fixture.situation.manaRecovery}</b>
                  </section>
                ) : null}
                <div className='location-node__copy location-node__copy--workshop'>
                  <span className='location-node__area'>{workshop.mapArea}</span>
                  <h2>{workshop.name}</h2>
                  <p>{workshop.subtitle}</p>
                  <span className='location-node__rule'>容量 {workshop.capacityLabel}</span>
                  {workshop.moveCostToNext !== undefined ? <span className='location-node__route'>E 移动成本 {workshop.moveCostToNext}</span> : null}
                </div>
                {renderSlotBoard('C 工房位', workshop.workshopManaSlots, workshop.occupants, 'location-node__slot-board--workshop')}
                <div className='location-node__occupants' aria-label='魔术工房部署玩家'>{workshop.occupants.slice(workshop.workshopManaSlots?.length ?? 0).map((id) => renderOccupantToken(id))}</div>
              </article>
            ) : null}
            <section className='map-deck-cell map-deck-cell--event' aria-label='事件牌库区'>
              <span>B1</span><strong>事件牌库</strong><small>盈月之仪</small><b>{eventDeckCount}</b>
            </section>
            {miyama ? renderLocation(miyama) : null}
            {recon ? renderLocation(recon) : null}
            {shinto ? renderLocation(shinto) : null}
          </div>
        </section>

        <aside className='decision-panel'>
          <span className='decision-panel__eyebrow'>CURRENT DECISION</span>
          <h2>{decisionTitle}</h2>
          <p>检查手牌与技能区。只有规则端返回的操作会出现在卡牌检视层。</p>
          <div className='decision-panel__metric'><span>可用操作</span><strong>{activeServerView.availableActions.length}</strong></div>
          <div className='decision-panel__metric'><span>优先席位</span><strong>SEAT {currentPlayer?.seat ?? '—'}</strong></div>
          {activeServerView.availableActions.some((action) => action.kind === 'deploy' || !action.sourceCardInstanceId) ? (
            <section className='decision-actions' aria-label='当前可用操作'>
              {activeServerView.availableActions
                .filter((action) => action.kind === 'deploy' || !action.sourceCardInstanceId)
                .map((action) => (
                  <button
                    type='button'
                    key={action.actionId}
                    className={`decision-actions__button is-${action.kind}`}
                    onClick={() => onAction(action)}
                  >
                    {action.label}
                  </button>
                ))}
            </section>
          ) : null}
          {abilityPromptActions.length ? (
            <section className='ability-prompt-stack' aria-label='技能发动窗口'>
              <header><span>ABILITY WINDOWS</span><strong>可选择发动 / 不发动</strong></header>
              {abilityPromptActions.map((action) => {
                const sourceCard = action.sourceCardInstanceId ? cardsById.get(action.sourceCardInstanceId) : undefined;
                const variableCosts = action.backendCommand?.type === 'activate_ability' ? action.backendCommand.variableCosts ?? [] : [];
                return (
                  <article key={action.actionId} className='ability-prompt'>
                    <button type='button' className='ability-prompt__source' onClick={() => sourceCard && setInspectedCard(sourceCard)} disabled={!sourceCard}>
                      <b>{action.sourceCardName ?? sourceCard?.name ?? '技能能力'}</b>
                      <span>{action.sourceCardType ?? sourceCard?.cardType ?? '技能'}{action.effectTiming ? ` · ${action.effectTiming}` : ''}</span>
                    </button>
                    <p>{action.abilityLabel ?? action.abilityId ?? action.label}</p>
                    {variableCosts.length ? (
                      <div className='ability-prompt__costs'>
                        {variableCosts.map((cost) => {
                          const value = abilityPaymentsByAction[action.actionId]?.[cost.name] ?? cost.min;
                          return (
                            <label key={cost.name}>
                              <span>{cost.name}</span>
                              <input
                                type='number'
                                min={cost.min}
                                max={cost.max}
                                value={value}
                                onChange={(event) => {
                                  const nextValue = Number(event.currentTarget.value);
                                  setAbilityPaymentsByAction((current) => ({
                                    ...current,
                                    [action.actionId]: {
                                      ...(current[action.actionId] ?? {}),
                                      [cost.name]: nextValue,
                                    },
                                  }));
                                }}
                              />
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                    <div className='ability-prompt__actions'>
                      <button type='button' onClick={() => dispatchAbilityPromptAction(action)}>发动</button>
                      <button type='button' onClick={() => setDismissedAbilityPrompts((current) => ({ ...current, [action.actionId]: true }))}>不发动</button>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : null}
          {fixture.powerPreview ? (
            <section className='power-preview' aria-label='威力计算预览'>
              <header><span>{fixture.powerPreview.title}</span><strong>最终 {fixture.powerPreview.total}</strong></header>
              <dl>
                {fixture.powerPreview.terms.map((term) => (
                  <div key={`${term.label}-${term.value}`}>
                    <dt>{term.label}</dt>
                    <dd>{term.value >= 0 ? `+${term.value}` : term.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          <div className='decision-panel__notice'><b>合法性由规则端验证</b><span>公共牌与非本人牌始终只可检视。</span></div>
          {fixture.backendRejection ? <div role='alert' className='decision-panel__rejection'>{fixture.backendRejection}</div> : null}
          {interactionWindows.length ? (
            <section className='interaction-stack' aria-label='交互窗口'>
              {interactionWindows.map((window) => (
                <article key={window.id} className={`interaction-window interaction-window--${window.kind}`}>
                  <header>
                    <span>{window.kind.toUpperCase()}</span>
                    <strong>{window.title}</strong>
                  </header>
                  <dl>
                    <div><dt>等待玩家</dt><dd>{fixture.players.find((player) => player.id === window.controllerId)?.name ?? window.controllerId}</dd></div>
                    {window.sourceLabel ? <div><dt>来源</dt><dd>{window.sourceLabel}</dd></div> : null}
                    {window.sourceCardInstanceId ? <div><dt>来源牌</dt><dd>{cardsById.get(window.sourceCardInstanceId)?.name ?? window.sourceCardInstanceId}</dd></div> : null}
                    {window.min !== undefined ? <div><dt>最小</dt><dd>{window.min}</dd></div> : null}
                    {window.max !== undefined ? <div><dt>最大</dt><dd>{window.max}</dd></div> : null}
                    {window.currentMana !== undefined ? <div><dt>当前魔力</dt><dd>{window.currentMana}</dd></div> : null}
                    {window.currentMana !== undefined && window.min !== undefined ? <div><dt>支付后</dt><dd>{Math.max(0, window.currentMana - (paymentByWindow[window.id] ?? window.min))}</dd></div> : null}
                  </dl>
                  {window.kind === 'payment' && window.variableCosts?.length ? (
                    <div className='interaction-window__payment'>
                      {window.variableCosts.map((cost) => {
                        const value = paymentByWindow[window.id] ?? cost.min;
                        return (
                          <label key={cost.name}>
                            <span>{cost.name}</span>
                            <input
                              type='number'
                              min={cost.min}
                              max={cost.max}
                              value={value}
                              onChange={(event) => {
                                const nextValue = Number(event.currentTarget.value);
                                setPaymentByWindow((current) => ({ ...current, [window.id]: nextValue }));
                              }}
                            />
                          </label>
                        );
                      })}
                    </div>
                  ) : null}
                  {(window.kind === 'mode' || window.kind === 'variable') && window.candidates?.length ? (
                    <div className='interaction-window__mode-options' aria-label={`${window.title}选项`}>
                      {window.candidates.map((candidate) => (
                        <span key={candidate.id}>
                          <b>{candidate.label}</b>
                          <small>{candidate.kind}{candidate.zone ? ` · ${candidate.zone}` : ''}</small>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {window.candidates?.length ? (
                    <div className='interaction-window__candidates'>
                      {window.candidates.map((candidate) => (
                        <button
                          type='button'
                          key={candidate.id}
                          className={(selectedTargetsByWindow[window.id] ?? []).includes(candidate.id) ? 'is-selected' : ''}
                          onClick={() => toggleTarget(window.id, candidate.id, window.max)}
                          onDoubleClick={() => {
                            const candidateCard = cardsById.get(candidate.id);
                            if (candidateCard) setInspectedCard(candidateCard);
                          }}
                        >
                          <b>{candidate.label}</b>
                          <span>{candidate.kind}{candidate.zone ? ` · ${candidate.zone}` : ''}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className='interaction-window__actions'>
                    {window.actions.map((action) => {
                      const selectedCount = selectedTargetsByWindow[window.id]?.length ?? 0;
                      const targetTooSmall = window.kind === 'target' && selectedCount < (window.min ?? 0);
                      const targetTooLarge = window.kind === 'target' && selectedCount > (window.max ?? Number.POSITIVE_INFINITY);
                      return (
                        <button
                          type='button'
                          key={action.actionId}
                          disabled={targetTooSmall || targetTooLarge}
                          onClick={() => {
                            if (window.kind === 'target') dispatchTargetChoice(action, window);
                            else if (window.kind === 'payment') dispatchPayment(action, window);
                            else onAction(action);
                          }}
                        >
                          {action.label}
                        </button>
                      );
                    })}
                    {window.kind === 'payment' ? <button type='button'>取消</button> : null}
                  </div>
                </article>
              ))}
            </section>
          ) : null}
          {directives.length ? (
            <section className='directive-panel' aria-label='directive 面板'>
              <header><span>DIRECTIVES</span><strong>待处理 / 已记录</strong></header>
              {directives.map((directive) => (
                <article key={directive.id} className={`directive-panel__item is-${directive.status}`}>
                  <b>{directive.label}</b>
                  <span>{directive.kind} · {directive.status}</span>
                  {directive.payload ? (
                    <small>{JSON.stringify(directive.payload)}</small>
                  ) : null}
                  {canAdjudicate && directive.status === 'pending' ? (
                    <div className='directive-panel__actions'>
                      <button type='button' onClick={() => onConsumeDirective(directive.id)}>人工确认继续</button>
                      <button type='button' onClick={() => onPauseForFix(directive.id)}>暂停并保存现场</button>
                    </div>
                  ) : null}
                </article>
              ))}
            </section>
          ) : null}
          {zones.length ? (
            <section className='zone-ledger' aria-label='游戏区域投影'>
              <header><span>ZONES</span><strong>完整区域</strong></header>
              <div>
                {zones.map((zone) => (
                  <button
                    type='button'
                    key={zone.id}
                    title={zone.cardIds.join(', ')}
                    className={selectedZone?.id === zone.id ? 'is-selected' : ''}
                    onClick={() => setSelectedZoneId(zone.id)}
                  >
                    <b>{zone.label}</b><small>{zone.status ?? 'enabled'} · {zone.count}</small>
                  </button>
                ))}
              </div>
              {selectedZone ? (
                <section className='zone-detail' aria-label={`${selectedZone.label}区域详情`}>
                  <header><span>{selectedZone.label}</span><strong>{selectedZone.count} 张</strong></header>
                  {selectedZoneCards.length ? (
                    <div className='card-row card-row--zone'>
                      {selectedZoneCards.map((card) => <CardSurface key={card.instanceId} card={card} onInspect={setInspectedCard} compact />)}
                    </div>
                  ) : selectedZoneUnknownIds.length ? (
                    <ul>
                      {selectedZoneUnknownIds.slice(0, 12).map((id) => <li key={id}>{id}</li>)}
                    </ul>
                  ) : (
                    <p>当前没有可检视卡牌</p>
                  )}
                </section>
              ) : null}
            </section>
          ) : null}
          {logs.length || replay.length ? (
            <section className='session-log' aria-label='日志与回放'>
              <header><span>REPLAY</span><strong>{replay[replay.length - 1]?.label ?? 'checkpoint'}</strong></header>
              {logs.slice(-4).map((entry) => <p key={entry.id}><b>{entry.type}</b>{entry.message}</p>)}
              <div className='session-log__checkpoints'>
                {replay.slice(-5).map((entry) => (
                  <button type='button' key={entry.id} onClick={() => onRestoreReplay(entry.id)}>
                    {entry.round}.{entry.revision} {entry.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          {finalRanking.length ? (
            <section className='final-ranking' aria-label='最终排名'>
              <header><span>RANKING</span><strong>最终结算</strong></header>
              {finalRanking.slice(0, 7).map((entry) => {
                const rankedPlayer = fixture.players.find((player) => player.id === entry.playerId);
                return (
                  <p key={entry.playerId}>
                    <b>#{entry.rank}</b>
                    <span>{rankedPlayer?.name ?? entry.playerId}</span>
                    <small>{entry.vp} VP / 军功 {entry.militaryResult}</small>
                  </p>
                );
              })}
            </section>
          ) : null}
          {usingNonPriorityView ? <p className='decision-panel__waiting'>等待当前玩家完成{decisionPhaseLabel}</p> : <button className='decision-panel__confirm' type='button' onClick={endTurn}>{endDecisionLabel}</button>}
        </aside>
      </div>

      <PlayerWorkbench
        self={fixture.self}
        cards={fixture.cards}
        collapsed={workbenchCollapsed}
        focused={isWorkbenchFocused}
        onRequestFocus={() => {
          if (!usingNonPriorityView) {
            setManualWorkbenchFocus(true);
            setWorkbenchCollapsed(false);
          }
        }}
        onToggle={() => {
          setWorkbenchCollapsed((value) => {
            const next = !value;
            setManualWorkbenchFocus(!next);
            return next;
          });
        }}
        onInspect={setInspectedCard}
      />

      {isWorkbenchFocused && !usingNonPriorityView ? (
        <button className='workbench-confirm' type='button' onClick={endTurn}>
          <span>CONFIRM</span>
          <strong>{endDecisionLabel}</strong>
        </button>
      ) : null}

      {inspectedCard ? <CardInspectionOverlay card={inspectedCard} actions={selectedActions} onClose={() => setInspectedCard(null)} onAction={onAction} /> : null}
      {selectedPlayer ? <PlayerPublicDrawer player={selectedPlayer} masterCard={selectedPlayerMasterCard} masterSkills={selectedPlayerMasterSkills} ascensionSkills={selectedPlayerAscensionSkills} publicCards={selectedPlayerRevealedCards} onClose={() => setSelectedPlayerId(null)} onInspect={(card) => { setSelectedPlayerId(null); setInspectedCard(card); }} /> : null}
      {showReminder ? (
        <div className='reminder-backdrop'>
          <section role='alertdialog' aria-modal='true' aria-label='可选能力提醒' className='reminder-dialog'>
            <span>OPTIONAL WINDOW</span><h2>可选能力提醒</h2><p>{fixture.optionalAbilityReminder}</p>
            <div>
              <button type='button' onClick={() => setShowReminder(false)}>返回检查</button>
              <button type='button' onClick={() => { setShowReminder(false); onEndTurn(); }}>仍然结束</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
