import type { GameState } from '../schema/game';
import type { PlayerId } from './types';

/**
 * D5 · `grant_masterless_servant` 的通用性判定（实现部分）。
 *
 * 8 张事件牌的 payload 完全一致（从游戏外/他人处把指定无主从者给某名玩家，可选），
 * 差异只在"谁获得"。因此把"谁获得"抽成声明式选择器，payload 保持单一原语。
 * 这里只实现纯选择（不改变从者归属），归属变更仍由后续子系统合同决定。
 */
export type RecipientMetric =
  | 'current_mana'
  | 'noble_phantasm_cost_sum_this_round'
  | 'mana_spent_this_round';

export type MasterlessRecipientSpec =
  | { kind: 'unique_metric_max'; location: string; metric: RecipientMetric; requireNoSkillUse?: boolean }
  | { kind: 'all_at_battlefield'; location: string; minTotalPower?: number; requireNoMovement?: boolean }
  | { kind: 'battle_winner'; location: string; mode: 'any' | 'contested_only' | 'uncontested_only' | 'moved_into' };

export interface RecipientResolution {
  playerIds: PlayerId[];
  reason: string;
}

export type RecipientOutcome = RecipientResolution | { blocked: string };

/** The eight shipped recipients, expressed declaratively instead of one handler per card. */
export const masterlessRecipientSpecs: Record<string, MasterlessRecipientSpec> = {
  unique_highest_mana_player_at_this_battlefield_without_skill_use: {
    kind: 'unique_metric_max', location: 'this_battlefield', metric: 'current_mana', requireNoSkillUse: true,
  },
  unique_highest_mana_spent_player_at_this_battlefield: {
    kind: 'unique_metric_max', location: 'this_battlefield', metric: 'mana_spent_this_round',
  },
  players_at_this_battlefield_with_total_power_at_least_16_and_no_movement: {
    kind: 'all_at_battlefield', location: 'this_battlefield', minTotalPower: 16, requireNoMovement: true,
  },
  unique_winner_after_battle_at_this_battlefield: { kind: 'battle_winner', location: 'this_battlefield', mode: 'any' },
  unique_contested_battle_winner_at_this_battlefield: { kind: 'battle_winner', location: 'this_battlefield', mode: 'contested_only' },
  unique_winner_who_moved_into_this_battlefield: { kind: 'battle_winner', location: 'this_battlefield', mode: 'moved_into' },
  uncontested_battle_winner_at_this_battlefield: { kind: 'battle_winner', location: 'this_battlefield', mode: 'uncontested_only' },
  unique_highest_noble_phantasm_mana_cost_sum_player_at_this_battlefield: {
    kind: 'unique_metric_max', location: 'this_battlefield', metric: 'noble_phantasm_cost_sum_this_round',
  },
};

const playersAt = (state: GameState, locationId: string): PlayerId[] => state.players
  .filter((player) => player.status === 'active' && player.locationId === locationId)
  .map((player) => player.id);

function metricValue(state: GameState, playerId: PlayerId, metric: RecipientMetric): number | 'missing' {
  const runtime = state.abilityRuntime;
  if (metric === 'current_mana') return state.players.find((player) => player.id === playerId)?.mana ?? 0;
  if (metric === 'noble_phantasm_cost_sum_this_round') {
    return (runtime?.noblePhantasmCostsThisRound?.[playerId] ?? []).reduce((sum, entry) => sum + Number(entry.cost ?? 0), 0);
  }
  if (metric === 'mana_spent_this_round') return runtime?.manaSpentThisRound?.[playerId] ?? 0;
  return 'missing';
}

function usedSkillThisRound(state: GameState, playerId: PlayerId): boolean {
  const round = state.round.roundNumber;
  const used = state.abilityRuntime?.usedAbilities ?? {};
  return state.cards.some((card) => {
    if (card.controllerPlayerId !== playerId || !['skill', 'field'].includes(card.zone)) return false;
    return Object.entries(used).some(([key, usedRound]) => key.startsWith(`${card.instanceId}:`) && Number(usedRound) === round);
  });
}

function latestBattleAt(state: GameState, locationId: string) {
  return [...state.battleResults].reverse().find((result) => result.battlefieldId === locationId);
}

/**
 * B1 裁决：EligibleServants = PackRoster ∩ UnheldServants。
 * roster 缺失时返回空集（fail-closed）——不会从内容库猜测候选。
 */
export function eligibleServantIds(state: GameState, pack: { servantRoster?: string[]; characters?: Record<string, { name?: string }> }): string[] {
  const roster = pack.servantRoster ?? [];
  if (roster.length === 0) return [];
  const held = new Set<string>();
  for (const player of state.players) {
    if (player.servantCardId) held.add(player.servantCardId);
  }
  for (const [servantId, owner] of Object.entries(state.servantOwnership ?? {})) {
    if (owner) held.add(servantId);
  }
  return roster.filter((servantId) => !held.has(servantId));
}

export interface GrantResult {
  granted: boolean;
  servantId?: string;
  reason: string;
}

/**
 * 授予无主从者：写归属 + 换持有者，**不公开真名**（B3）。
 * 候选必须来自 `eligibleServantIds`；空集时不做任何事（fail-closed）。
 */
export function grantMasterlessServant(
  state: GameState,
  recipientId: string,
  servantName: string,
  pack: { servantRoster?: string[]; characters?: Record<string, { id?: string; name?: string }> },
): GrantResult {
  const eligible = eligibleServantIds(state, pack);
  if (eligible.length === 0) return { granted: false, reason: 'no eligible servant: pack roster is empty or everything is held' };
  const characters = pack.characters ?? {};
  const named = eligible.find((servantId) => characters[servantId]?.name === servantName);
  const servantId = named ?? eligible[0]!;
  const recipient = state.players.find((player) => player.id === recipientId);
  if (!recipient) return { granted: false, reason: 'recipient not found' };

  const previous = recipient.servantCardId;
  state.servantOwnership ??= {};
  if (previous) state.servantOwnership[previous] = null;
  state.servantOwnership[servantId] = recipientId;
  recipient.servantCardId = servantId;
  return { granted: true, servantId, reason: 'granted from the pack roster' };
}

export function resolveMasterlessRecipients(
  state: GameState,
  spec: MasterlessRecipientSpec,
  battlefieldId: string,
): RecipientOutcome {
  const location = spec.location === 'this_battlefield' ? battlefieldId : spec.location;

  if (spec.kind === 'unique_metric_max') {
    const candidates = playersAt(state, location)
      .filter((playerId) => !spec.requireNoSkillUse || !usedSkillThisRound(state, playerId));
    const scored: Array<{ playerId: PlayerId; value: number }> = [];
    for (const playerId of candidates) {
      const value = metricValue(state, playerId, spec.metric);
      if (value === 'missing') return { blocked: `missing_metric:${spec.metric}` };
      scored.push({ playerId, value });
    }
    if (scored.length === 0) return { playerIds: [], reason: 'no candidate at this battlefield' };
    const best = Math.max(...scored.map((entry) => entry.value));
    const winners = scored.filter((entry) => entry.value === best).map((entry) => entry.playerId);
    return winners.length === 1
      ? { playerIds: winners, reason: `unique highest ${spec.metric}=${best}` }
      : { playerIds: [], reason: `tie on ${spec.metric}=${best} (unique required)` };
  }

  if (spec.kind === 'battle_winner') {
    const battle = latestBattleAt(state, location);
    if (!battle) return { playerIds: [], reason: 'no battle at this battlefield this round' };
    if (battle.winnerPlayerIds.length !== 1) return { playerIds: [], reason: 'battle had no unique winner' };
    const winner = battle.winnerPlayerIds[0]!;
    const participants = battle.participantBreakdowns.length;
    if (spec.mode === 'contested_only' && participants < 2) return { playerIds: [], reason: 'battle was uncontested' };
    if (spec.mode === 'uncontested_only' && participants > 1) return { playerIds: [], reason: 'battle was contested' };
    if (spec.mode === 'moved_into') {
      const movedIn = (state.abilityRuntime?.playersMovedThisRound ?? [])
        .some((entry) => entry.playerId === winner && entry.locationId === location);
      if (!movedIn) return { playerIds: [], reason: 'winner did not move into this battlefield' };
    }
    return { playerIds: [winner], reason: `unique winner (${spec.mode})` };
  }

  const battle = latestBattleAt(state, location);
  const candidates = playersAt(state, location).filter((playerId) => {
    if (spec.requireNoMovement && (state.abilityRuntime?.movementDistanceThisRound?.[playerId] ?? 0) > 0) return false;
    if (spec.minTotalPower !== undefined) {
      const power = battle?.participantBreakdowns.find((entry) => entry.playerId === playerId)?.effectivePower;
      if (power === undefined || power < spec.minTotalPower) return false;
    }
    return true;
  });
  return { playerIds: candidates, reason: 'all players at the battlefield matching the constraints' };
}
