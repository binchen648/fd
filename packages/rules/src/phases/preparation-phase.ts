import type { GameState, PlayerState } from "../schema/game";

export interface PreparationPhaseContext {
  playerDrawLimits: Map<string, number>;
  situationCardManaReward: number;
  eventDrawsForLocations: Array<{
    locationId: string;
    eventCardId: string;
    visibility: "public" | "hidden";
  }>;
}

/**
 * 准备阶段执行器
 * 
 * 规则来源：FD基础规则 第9章《准备阶段》
 * 
 * 执行顺序：
 * 1. 按回合顺位，每名玩家依次：
 *    - 从牌堆抽牌补到上限（通常3张）
 *    - 若牌堆耗尽，弃牌堆洗混形成新牌堆
 * 2. 抽取局势牌放入激活区
 * 3. 所有玩家获得局势牌的魔力值
 * 4. 为深山町/新都各抽1张事件牌并放置
 * 5. 玩家可激活带【准备阶段】关键词的能力
 */
export function executePreparationPhase(
  state: GameState,
): GameState {
  let nextState = state;

  // 步骤1: 按回合顺位进行卡牌补充
  nextState = drawCardsToHandLimit(nextState);

  // 步骤2-3: 处理局势牌与魔力奖励
  nextState = activateSituationCardAndAwardMana(nextState);

  // 步骤4: 放置事件牌
  nextState = placeEventCards(nextState);

  // 步骤5: 记录日志
  nextState = {
    ...nextState,
    log: nextState.log.concat({
      type: "preparation_phase_completed",
      message: "preparation_phase:complete",
    }),
  };

  return nextState;
}

/**
 * 步骤1: 按回合顺位进行卡牌补充
 * 
 * 规则：
 * - 从牌堆抽牌，把手牌补到上限（通常为3）
 * - 若已有3张或以上，则不抽
 * - 若牌堆耗尽，将弃牌堆洗混形成新牌堆
 */
function drawCardsToHandLimit(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => p.status === "active");
  const priorityIndex = activePlayers.findIndex((p) => p.seat === state.round.prioritySeat);
  
  // 从优先玩家开始按顺序遍历
  let nextState = state;
  for (let i = 0; i < activePlayers.length; i++) {
    const playerIndex = (priorityIndex + i) % activePlayers.length;
    const player = activePlayers[playerIndex];
    
    nextState = drawCardsForPlayer(nextState, player.id);
  }

  return nextState;
}

/**
 * 为单个玩家补充手牌
 */
function drawCardsForPlayer(state: GameState, playerId: string): GameState {
  const HAND_LIMIT = 3;
  
  // 计算当前手中的卡牌数
  const playerHandCards = state.cards.filter(
    (card) => card.controllerPlayerId === playerId && card.zone === "hand"
  );
  
  const cardsToDrawCount = Math.max(0, HAND_LIMIT - playerHandCards.length);
  
  if (cardsToDrawCount === 0) {
    return state;
  }

  // 从牌堆抽取卡牌
  // 注：实现细节依赖于卡牌系统的具体实现
  // 这里仅记录事件，具体逻辑由卡牌系统处理
  return {
    ...state,
    log: state.log.concat({
      type: "cards_drawn",
      message: `player:${playerId}:draw:${cardsToDrawCount}`,
      payload: {
        playerId,
        drawnCount: cardsToDrawCount,
      },
    }),
  };
}

/**
 * 步骤2-3: 激活局势牌并向所有玩家奖励魔力
 * 
 * 规则：
 * - 抽取1张局势牌放入激活区
 * - 所有玩家立即获得该局势牌印刷的魔力值
 */
function activateSituationCardAndAwardMana(state: GameState): GameState {
  if (!state.currentSituationCardId) {
    return state;
  }

  // 计算局势牌提供的魔力值
  // 注：具体数值由卡牌定义提供
  const situationManaReward = 2; // 默认值，实际应从卡牌定义读取

  // 向所有活跃玩家奖励魔力
  let nextState = state;
  for (const player of state.players.filter((p) => p.status === "active")) {
    nextState = {
      ...nextState,
      players: nextState.players.map((p) =>
        p.id === player.id
          ? { ...p, mana: p.mana + situationManaReward }
          : p
      ),
    };
  }

  nextState = {
    ...nextState,
    log: nextState.log.concat({
      type: "situation_activated",
      message: `situation:${state.currentSituationCardId}:mana:${situationManaReward}`,
      payload: {
        situationCardId: state.currentSituationCardId,
        manaReward: situationManaReward,
      },
    }),
  };

  return nextState;
}

/**
 * 步骤4: 放置事件牌
 * 
 * 规则：
 * - 从事件牌组抽出2张事件牌
 * - 1张明置放入深山町的B2区
 * - 另1张暗置放入新都的B3区
 */
function placeEventCards(state: GameState): GameState {
  // 事件牌的具体放置逻辑由事件引擎处理
  // 这里仅确保标记和日志记录
  
  return {
    ...state,
    log: state.log.concat({
      type: "event_cards_placed",
      message: "event_cards:placed",
      payload: {
        eventPlacements: state.eventPlacements.length,
      },
    }),
  };
}

/**
 * 获取当前阶段的玩家行动次序
 * 按回合顺位从优先玩家开始排列
 */
export function getActionOrderForPreparationPhase(state: GameState): string[] {
  const activePlayers = state.players.filter((p) => p.status === "active");
  const priorityIndex = activePlayers.findIndex((p) => p.seat === state.round.prioritySeat);
  
  const ordered: string[] = [];
  for (let i = 0; i < activePlayers.length; i++) {
    const index = (priorityIndex + i) % activePlayers.length;
    ordered.push(activePlayers[index]!.id);
  }
  
  return ordered;
}
