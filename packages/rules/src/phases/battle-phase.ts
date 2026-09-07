import type { GameState, PlayerState, LocationId } from "../schema/game";

export interface BattlePhaseResult {
  winnerId: string;
  winnerVP: number;
  eventCardReward: number;
  competitionReward: number;
}

export interface CombatPowerCalculation {
  playerId: string;
  basePower: number;
  terrainBonus: number;
  weatherModifier: number;
  totalPower: number;
  hasDefeat: boolean;
}

/**
 * 战斗阶段执行器
 * 
 * 规则来源：FD基础规则 第13章《战斗阶段与战力结算》
 * 
 * 执行顺序：
 * 1. 玩家可在自己的战斗阶段任意时刻使用【战斗阶段】能力
 * 2. 当所有玩家的战斗阶段都结束后，进行统一的战力结算
 * 
 * 战力结算顺序：
 * 1. 位于【侦查】的玩家一同获得2点战果
 * 2. 计算每名玩家的合计威力（激活攻击+地利+能力+局势天气）
 * 3. 分别对每个战场结算胜利者
 * 4. 胜利者获得事件牌战果和竞争战果
 * 5. 处理并列胜利（战果平分，向上取整）
 */
export function executeBattlePhase(state: GameState): GameState {
  let nextState = state;

  // 所有玩家战斗阶段完成后，进行统一战力结算
  nextState = performCombatPowerSettlement(nextState);

  return nextState;
}

/**
 * 战力结算核心逻辑
 */
function performCombatPowerSettlement(state: GameState): GameState {
  let nextState = state;

  // 第1步：处理侦查位置的战果
  nextState = processReconVictory(nextState);

  // 第2步：计算每名玩家的合计威力
  const powerCalculations = calculateCombatPowers(nextState);

  // 第3步：对每个战场进行结算
  const battleLocations: LocationId[] = ["miyama_town", "shinto"];
  for (const location of battleLocations) {
    nextState = settleBattleAtLocation(nextState, location, powerCalculations);
  }

  // 记录战力结算完成
  nextState = {
    ...nextState,
    log: nextState.log.concat({
      type: "battle_phase_power_settlement_completed",
      message: "battle_phase:settlement:complete",
    }),
  };

  return nextState;
}

/**
 * 处理侦查位置的战果
 * 
 * 规则：位于【侦查】的玩家一同获得2点战果
 */
function processReconVictory(state: GameState): GameState {
  const RECON_REWARD = 2;

  let nextState = state;
  const reconPlayers = state.players.filter(
    (p) => p.status === "active" && p.locationId === "recon"
  );

  for (const player of reconPlayers) {
    nextState = {
      ...nextState,
      players: nextState.players.map((p) =>
        p.id === player.id
          ? { ...p, vp: p.vp + RECON_REWARD }
          : p
      ),
      log: nextState.log.concat({
        type: "recon_victory_awarded",
        message: `player:${player.id}:recon:vp:+${RECON_REWARD}`,
        payload: {
          playerId: player.id,
          reward: RECON_REWARD,
        },
      }),
    };
  }

  return nextState;
}

/**
 * 计算所有活跃玩家的合计威力
 * 
 * 合计威力 = 激活攻击威力 + 地利数 + 自身能力 + 局势/天气修正
 */
function calculateCombatPowers(state: GameState): CombatPowerCalculation[] {
  return state.players
    .filter((p) => p.status === "active")
    .map((player) => {
      const basePower = calculateBaseCombatPower(state, player);
      const terrainBonus = getTerrainBonus(state, player);
      const weatherModifier = getWeatherModifier(state, player);
      const hasDefeat = player.statusEffects?.includes("defeated") ?? false;

      return {
        playerId: player.id,
        basePower,
        terrainBonus,
        weatherModifier,
        totalPower: basePower + terrainBonus + weatherModifier,
        hasDefeat,
      };
    });
}

/**
 * 计算玩家的基础战力（激活攻击牌的威力总和）
 */
function calculateBaseCombatPower(state: GameState, player: PlayerState): number {
  // 注：实际的攻击牌威力计算需要从卡牌系统获取
  // 这里为简化起见，返回占位值
  // 实际实现应遍历player.activeCards并求和其威力
  return player.combatPower || 0;
}

/**
 * 获取玩家此回合的地利奖励
 * 
 * 规则：仅"部署到该位置"才能获得地利奖励，之后移动到则不能
 */
function getTerrainBonus(state: GameState, player: PlayerState): number {
  // 查找玩家本轮的部署记录
  const deploymentLog = state.log.find(
    (log) =>
      log.type === "player_deployment_recorded" &&
      log.payload?.playerId === player.id &&
      log.payload?.roundNumber === state.round.roundNumber
  );

  if (!deploymentLog) {
    return 0;
  }

  const deployedLocation = deploymentLog.payload?.locationId as LocationId;
  const currentLocation = player.locationId;

  // 仅当玩家仍在部署位置时，才获得地利奖励
  if (deployedLocation !== currentLocation) {
    return 0;
  }

  // 地利值定义
  const TERRAIN_BONUSES: Record<LocationId, number[]> = {
    miyama_town: [3, 1],
    shinto: [3, 1],
    magic_workshop: [],
    recon: [],
    moon_holy_grail: [],
  };

  const terrainValues = TERRAIN_BONUSES[currentLocation] || [];
  
  // 获取该位置的玩家数量排序，确定玩家的地利位置索引
  const playersAtLocation = state.players.filter(
    (p) => p.status === "active" && p.locationId === currentLocation
  );
  
  const positionIndex = playersAtLocation.findIndex((p) => p.id === player.id);
  
  return positionIndex >= 0 && positionIndex < terrainValues.length
    ? terrainValues[positionIndex]
    : 0;
}

/**
 * 获取玩家当前回合的天气/局势修正
 * 
 * 注：具体修正值由当前激活的局势牌决定
 */
function getWeatherModifier(state: GameState, player: PlayerState): number {
  // 从激活的局势牌获取修正值
  // 这里为简化起见返回0
  // 实际实现应查询当前激活的局势牌的修正列表
  return 0;
}

/**
 * 对指定战场进行战力结算
 * 
 * 规则：
 * 1. 战场中合计威力最高的玩家为胜利者
 * 2. 胜利者获得事件牌战果
 * 3. 若至少存在1名对手与其进行战斗，获得竞争战果
 * 4. 若多人并列胜利，战果平分（向上取整）
 * 5. 被【败北】的玩家不能赢得战斗
 */
function settleBattleAtLocation(
  state: GameState,
  location: LocationId,
  powerCalculations: CombatPowerCalculation[],
): GameState {
  let nextState = state;

  // 获取该战场的所有参与者
  const battleParticipants = powerCalculations.filter(
    (calc) =>
      state.players.find((p) => p.id === calc.playerId)?.locationId === location
  );

  if (battleParticipants.length === 0) {
    return nextState;
  }

  // 排除被【败北】的玩家
  const eligibleParticipants = battleParticipants.filter((calc) => !calc.hasDefeat);

  if (eligibleParticipants.length === 0) {
    return nextState;
  }

  // 找出最高威力
  const maxPower = Math.max(...eligibleParticipants.map((calc) => calc.totalPower));

  // 找出所有并列胜利者
  const winners = eligibleParticipants.filter((calc) => calc.totalPower === maxPower);

  if (winners.length === 0) {
    return nextState;
  }

  // 计算事件牌战果
  const eventCardReward = getEventCardReward(nextState, location);

  // 计算竞争战果（至少有1名对手与胜利者进行战斗）
  const competitionReward = eligibleParticipants.length > 1 
    ? getCompetitionReward(location)
    : 0;

  // 平分战果（向上取整）
  const rewardPerWinner = Math.ceil((eventCardReward + competitionReward) / winners.length);

  // 分配战果给每名胜利者
  for (const winner of winners) {
    nextState = {
      ...nextState,
      players: nextState.players.map((p) =>
        p.id === winner.playerId
          ? { ...p, vp: p.vp + rewardPerWinner }
          : p
      ),
      log: nextState.log.concat({
        type: "battle_victory_awarded",
        message: `player:${winner.playerId}:location:${location}:vp:+${rewardPerWinner}`,
        payload: {
          playerId: winner.playerId,
          location,
          reward: rewardPerWinner,
          totalWinners: winners.length,
          eventCardReward,
          competitionReward,
        },
      }),
    };
  }

  return nextState;
}

/**
 * 获取指定战场的事件牌战果
 * 
 * 规则：事件牌上记载的战果点数
 */
function getEventCardReward(state: GameState, location: LocationId): number {
  // 从事件牌系统获取当前激活的事件牌的战果值
  // 这里为简化起见返回默认值
  // 实际实现应查询event card repository
  return location === "miyama_town" ? 2 : 3;
}

/**
 * 获取指定战场的竞争战果
 * 
 * 规则：F区的竞争战果
 * 深山町：2点，新都：3点
 */
function getCompetitionReward(location: LocationId): number {
  const COMPETITION_REWARDS: Record<LocationId, number> = {
    miyama_town: 2,
    shinto: 3,
    magic_workshop: 0,
    recon: 0,
    moon_holy_grail: 0,
  };

  return COMPETITION_REWARDS[location] || 0;
}

/**
 * 判断玩家是否处于战斗中（与至少1名对手同处一个会发生战斗的战场）
 * 
 * 规则：若玩家与至少1名对手同处一处会发生交战的战场，
 * 则处于"交战状态"，此时不能进行常规移动
 */
export function isPlayerInCombat(state: GameState, playerId: string): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.status !== "active") {
    return false;
  }

  const battleLocations: LocationId[] = ["miyama_town", "shinto"];
  if (!battleLocations.includes(player.locationId)) {
    return false;
  }

  // 检查是否存在至少1名对手（status为active的其他玩家）在同一位置
  const opponentsAtLocation = state.players.filter(
    (p) =>
      p.id !== playerId &&
      p.status === "active" &&
      p.locationId === player.locationId
  );

  return opponentsAtLocation.length > 0;
}

/**
 * 应用【败北】状态给玩家
 * 
 * 规则：
 * - 不能赢得战斗
 * - 不能以"本场合计威力最高者"的身份阻止其他玩家赢得战斗
 * - 战力结算时被忽略
 * - 无法打出牌，但不影响使用能力或已激活牌
 * - 可以同时具有多层【败北】状态
 */
export function applyDefeatStatus(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            statusEffects: [...(p.statusEffects || []), "defeated"],
          }
        : p
    ),
    log: state.log.concat({
      type: "defeat_status_applied",
      message: `player:${playerId}:defeated`,
      payload: {
        playerId,
      },
    }),
  };
}

/**
 * 移除玩家的【败北】状态
 * 
 * 注：【败北】在回合结束时自动移除
 */
export function removeDefeatStatus(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            statusEffects: (p.statusEffects || []).filter((s) => s !== "defeated"),
          }
        : p
    ),
    log: state.log.concat({
      type: "defeat_status_removed",
      message: `player:${playerId}:defeat_removed`,
      payload: {
        playerId,
      },
    }),
  };
}
