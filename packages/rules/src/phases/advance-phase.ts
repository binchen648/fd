import type { GameState, PlayerState, LocationId } from "../schema/game";
import { grantMana } from "../core/rule-overrides";
import { m50DeploymentManaGainForbidden } from "../ability/m50-structural-card-modifiers";

export interface AdvancePhaseContext {
  deploymentOrder: string[];
  locationTerrainBonuses: Record<LocationId, number>;
}

/**
 * 前哨阶段执行器（白天）
 * 
 * 规则来源：FD基础规则 第10章《前哨阶段》
 * 
 * 执行顺序：
 * 按回合顺位，所有玩家依次执行部署：
 * 1. 御主立牌只能部署于【魔术工房】或战场（深山町/新都）
 * 2. 若部署于【魔术工房】，立即获得部署位置C标注的魔力值
 * 3. 若部署于战场并位于地利位置D，则在之后战力结算时获得等同地利数的合计威力
 *    - 只有"部署到该位置"才能获得效果；之后移动到则不能
 * 4. 玩家可在部署前后任意时点使用【前哨阶段】能力
 */
export function executeAdvancePhase(state: GameState): GameState {
  let nextState = state;

  // 获取按回合顺位排列的活跃玩家
  const actionOrder = getActionOrderForAdvancePhase(nextState);

  // 对每名玩家依次执行部署逻辑
  for (const playerId of actionOrder) {
    nextState = processPlayerDeployment(nextState, playerId);
  }

  // 记录阶段完成
  nextState = {
    ...nextState,
    log: nextState.log.concat({
      type: "advance_phase_completed",
      message: "advance_phase:complete",
    }),
  };

  return nextState;
}

/**
 * 为单个玩家处理部署
 * 
 * 注：实际的部署位置由玩家行动系统决定，
 * 这里仅处理部署时的魔力奖励和地利记录
 */
function processPlayerDeployment(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return state;
  }

  let nextState = state;
  const locationId = player.locationId;

  if (!locationId) {
    return nextState;
  }

  // 根据部署位置类型进行不同处理
  if (locationId === "magic_workshop") {
    nextState = awardManaForWorkshopDeployment(nextState, playerId);
  } else if (locationId === "miyama_town" || locationId === "shinto") {
    nextState = recordTerrainBonusForBattlefieldDeployment(nextState, playerId, locationId);
  }

  return nextState;
}

/**
 * 工房部署魔力奖励
 * 
 * 规则：部署于魔术工房时，立即获得部署位置C标注的魔力值
 * 棋盘数据：工房位为 +2、+1、+1、+1（共4个位置）
 */
function awardManaForWorkshopDeployment(
  state: GameState,
  playerId: string,
): GameState {
  // 工房部署位置的魔力奖励
  // 注：实际位置由玩家当前战场配置决定
  // 这里假设为默认值，实际应从地图配置读取
  const WORKSHOP_MANA_VALUES = [2, 1, 1, 1];
  
  // 计算这个玩家在工房中的位置
  // 通常按部署顺序从高到低分配
  const workshopPlayers = state.players.filter(
    (p) => p.status === "active" && p.locationId === "magic_workshop"
  );
  
  const positionIndex = workshopPlayers.findIndex((p) => p.id === playerId);
  const manaReward = positionIndex >= 0 && positionIndex < WORKSHOP_MANA_VALUES.length
    ? WORKSHOP_MANA_VALUES[positionIndex]
    : 0;

  const nextState = structuredClone(state);
  const appliedReward = m50DeploymentManaGainForbidden(nextState, playerId, 'magic_workshop') ? 0 : manaReward;
  const result = grantMana(nextState, playerId, appliedReward, { source: 'deployment' });
  nextState.log = state.log.concat({
    type: "workshop_deployment_mana_awarded",
    message: `player:${playerId}:workshop:mana:+${result.actualAmount}`,
    payload: {
      playerId,
      manaReward,
      appliedManaReward: result.actualAmount,
      overflowManaReward: result.overflowAmount,
      positionIndex,
    },
  });

  return nextState;
}

/**
 * 战场地利记录
 * 
 * 规则：若部署于战场并位于地利位置D，则在之后战力结算时，
 * 若该玩家仍位于该位置，获得等同于该地利数的合计威力
 */
function recordTerrainBonusForBattlefieldDeployment(
  state: GameState,
  playerId: string,
  locationId: LocationId,
): GameState {
  // 地利值：
  // 深山町地利(D1)为 +3、+1
  // 新都地利(D2)为 +3、+1
  const TERRAIN_BONUSES: Record<LocationId, number[]> = {
    miyama_town: [3, 1],
    shinto: [3, 1],
    magic_workshop: [],
    recon: [],
    moon_holy_grail: [],
  };

  const terrainValues = TERRAIN_BONUSES[locationId] || [];
  const battlefieldPlayers = state.players.filter(
    (p) => p.status === "active" && p.locationId === locationId
  );
  
  const positionIndex = battlefieldPlayers.findIndex((p) => p.id === playerId);
  const terrainBonus = positionIndex >= 0 && positionIndex < terrainValues.length
    ? terrainValues[positionIndex]
    : 0;

  // 记录玩家此次部署的地利奖励
  // 这个信息会在战力结算时被使用
  let nextState = state;
  
  if (terrainBonus > 0) {
    nextState = {
      ...nextState,
      log: nextState.log.concat({
        type: "battlefield_terrain_deployment_recorded",
        message: `player:${playerId}:location:${locationId}:terrain:+${terrainBonus}`,
        payload: {
          playerId,
          locationId,
          terrainBonus,
          positionIndex,
        },
      }),
    };
  }

  return nextState;
}

/**
 * 获取前哨阶段的玩家行动次序
 * 按回合顺位从优先玩家开始排列
 */
export function getActionOrderForAdvancePhase(state: GameState): string[] {
  const activePlayers = state.players.filter((p) => p.status === "active");
  const priorityIndex = activePlayers.findIndex((p) => p.seat === state.round.prioritySeat);
  
  const ordered: string[] = [];
  for (let i = 0; i < activePlayers.length; i++) {
    const index = (priorityIndex + i) % activePlayers.length;
    ordered.push(activePlayers[index]!.id);
  }
  
  return ordered;
}

/**
 * 验证玩家是否可以部署到指定位置
 */
export function canDeployToLocation(
  state: GameState,
  playerId: string,
  targetLocation: LocationId,
): boolean {
  // 规则：御主立牌只能部署于魔术工房或战场，不能部署于侦查
  if (targetLocation === "recon") {
    return false;
  }

  // 工房人数上限：通常4人，高潮后最后两天改为1人
  if (targetLocation === "magic_workshop") {
    const currentRound = state.round.roundNumber;
    const isClimax = currentRound >= 9;
    const workshopLimit = isClimax ? 1 : 4;
    
    const currentWorkshopCount = state.players.filter(
      (p) => p.status === "active" && p.locationId === "magic_workshop"
    ).length;
    
    return currentWorkshopCount < workshopLimit;
  }

  // 侦查人数上限：1人
  if (targetLocation === "recon") {
    const currentReconCount = state.players.filter(
      (p) => p.status === "active" && p.locationId === "recon"
    ).length;
    
    return currentReconCount < 1;
  }

  // 战场空间无限
  return true;
}

/**
 * 记录玩家本回合的地利部署信息
 * 用于之后战力结算时查询
 */
export function recordPlayerDeploymentInfo(
  state: GameState,
  playerId: string,
  locationId: LocationId,
): GameState {
  return {
    ...state,
    log: state.log.concat({
      type: "player_deployment_recorded",
      message: `player:${playerId}:deployed:to:${locationId}`,
      payload: {
        playerId,
        locationId,
        roundNumber: state.round.roundNumber,
      },
    }),
  };
}
