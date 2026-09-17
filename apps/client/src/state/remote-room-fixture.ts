import type { MatchRoomProjection } from '@fd/rules/match-room';
import type { InspectableCard, PlaytestClientFixture } from './playtest-fixture-loader';

const locationLabels: Record<string, string> = {
  magic_workshop: '魔术工房',
  miyama_town: '深山町',
  shinto: '新都',
  recon: '侦察',
  moon_holy_grail: '盈月大圣杯',
};

const phaseLabels: Record<string, string> = {
  round_start: '回合开始',
  preparation: '准备阶段',
  advance: '移动阶段',
  action: '行动阶段',
  battle: '战斗阶段',
  cleanup: '清理阶段',
  round_end: '回合结束',
};

const phaseOrder = ['round_start', 'preparation', 'advance', 'action', 'battle', 'cleanup', 'round_end'];

function cardTypeLabel(zone: string): string {
  if (zone === 'hand') return '手牌';
  if (zone === 'skill') return '技能牌';
  if (zone === 'field') return '场上牌';
  if (zone === 'attack_area') return '攻击区';
  if (zone === 'discard') return '弃牌';
  return zone;
}

function inspectableFromProjection(card: NonNullable<MatchRoomProjection['match']>['view']['cards'][number], viewerId?: string): InspectableCard {
  const visible = card.ownerPlayerId === viewerId || !card.faceDown;
  return {
    instanceId: card.instanceId,
    definitionId: card.definitionId ?? card.instanceId,
    name: visible ? card.definitionId ?? card.instanceId : '暗置卡',
    cardType: cardTypeLabel(card.zone),
    cardRole: card.zone === 'hand' || card.zone === 'field' || card.zone === 'attack_area' ? 'combat_card' : 'skill_effect',
    ownerLabel: card.ownerPlayerId === viewerId ? '你' : card.ownerPlayerId,
    visibility: card.ownerPlayerId === viewerId ? '仅本人' : '公开',
    rulesSummaryZh: visible ? '远程房间 projection 卡牌。完整规则文本由后端合法 action 与结算日志提供。' : '暗置信息，仅后端持有。',
    revealPolicy: card.ownerPlayerId === viewerId ? '仅本人可见' : '公开或暗置投影',
  };
}

export function projectRemoteRoomFixture(projection: MatchRoomProjection): PlaytestClientFixture | null {
  const match = projection.match;
  if (!match) return null;
  const viewerId = projection.viewer.playerId;
  const cards = match.view.cards.map((card) => inspectableFromProjection(card, viewerId));
  const publicCardIds = cards
    .filter((card) => card.visibility !== '仅本人')
    .map((card) => card.instanceId);
  const playerLocations = new Map(match.view.players.map((player) => [player.id, player.locationId]));
  const activePhaseIndex = phaseOrder.indexOf(match.phase);

  return {
    match: {
      round: match.round,
      phase: `${phaseLabels[match.phase] ?? match.phase} · 远程同步`,
      priorityPlayerId: match.priorityPlayerId,
    },
    phaseTrack: phaseOrder.map((phaseId, index) => ({
      id: phaseId,
      label: phaseLabels[phaseId] ?? phaseId,
      status: index < activePhaseIndex ? 'done' : index === activePhaseIndex ? 'current' : 'upcoming',
    })),
    players: match.view.players.map((player) => {
      const seat = projection.seats.find((candidate) => candidate.playerId === player.id);
      return {
        id: player.id,
        seat: player.seat,
        name: player.id === viewerId ? '你' : seat?.displayName ?? `玩家 ${player.seat}`,
        masterName: player.masterCardId,
        servantName: player.servantPackage?.name ?? player.masterCardId,
        location: player.locationId ? locationLabels[player.locationId] ?? player.locationId : '未部署',
        vp: player.vp,
        mana: player.mana,
        commandSpells: player.commandSpells ?? 3,
        isSelf: player.id === viewerId,
        publicMasterCardId: undefined,
        publicMasterSkillIds: [],
        publicAscensionSkillIds: [],
        publicRevealedCardIds: match.view.cards.filter((card) => card.ownerPlayerId === player.id && (card.zone === 'field' || card.zone === 'attack_area')).map((card) => card.instanceId),
      };
    }),
    locations: [
      { id: 'magic_workshop', name: '魔术工房', subtitle: '远程同步', occupants: occupants(playerLocations, 'magic_workshop'), mapArea: 'A2', capacityLabel: '1', workshopManaSlots: [2, 1, 1, 1], moveCostToNext: 1 },
      { id: 'miyama_town', name: '深山町', subtitle: '远程同步', occupants: occupants(playerLocations, 'miyama_town'), mapArea: 'B2', terrainSlots: [3, 1], contestVp: 2, moveCostToNext: 2 },
      { id: 'recon', name: '侦察', subtitle: '远程同步', occupants: occupants(playerLocations, 'recon'), mapArea: 'G', capacityLabel: '1', reconVp: 2 },
      { id: 'shinto', name: '新都', subtitle: '远程同步', occupants: occupants(playerLocations, 'shinto'), mapArea: 'B3', terrainSlots: [3, 1], contestVp: 3, moveCostToNext: 2 },
    ],
    self: {
      masterName: match.view.players.find((player) => player.id === viewerId)?.masterCardId ?? '观战',
      servantName: match.view.players.find((player) => player.id === viewerId)?.servantPackage?.name ?? '远程房间',
      deck: { size: 0, attributeCounts: { strength: 0, agility: 0, magecraft: 0, special: 0 }, entries: [] },
      hand: match.view.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'hand').map((card) => card.instanceId),
      stagedAttackArea: match.view.stagedAttacks?.find((entry) => entry.playerId === viewerId)?.cards.map((card) => card.cardInstanceId) ?? [],
      attackArea: match.view.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'attack_area').map((card) => card.instanceId),
      discard: match.view.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'discard').map((card) => card.instanceId),
      skills: match.view.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'skill' && !(card.definitionId ?? '').includes('command-spell')).map((card) => card.instanceId),
      masterSkills: [],
      commandSpells: match.view.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'skill' && (card.definitionId ?? '').includes('command-spell')).map((card) => card.instanceId),
      ascensionSkills: [],
    },
    cards,
    publicCardIds,
    availableActions: match.view.legalActions.map((action, index) => ({
      actionId: `${action.type}:${index}`,
      kind: action.type === 'play_card' || action.type === 'stage_attack_card' || action.type === 'activate_ability' ? 'play_card'
        : action.type === 'confirm_staged_attack' || action.type === 'cancel_staged_attack' ? 'pass'
          : 'respond',
      ownerPlayerId: viewerId ?? '',
      label: action.type === 'stage_attack_card' ? '加入待确认攻击'
        : action.type === 'confirm_staged_attack' ? '确认打出攻击区'
          : action.type === 'cancel_staged_attack' ? '取消待确认攻击'
            : action.type === 'activate_ability' ? `发动能力 ${action.abilityId}`
            : action.type,
      sourceCardInstanceId: 'cardInstanceId' in action ? action.cardInstanceId : undefined,
      targetId: 'candidates' in action ? action.candidates[0] : undefined,
      targetCandidates: 'candidates' in action ? action.candidates : undefined,
      minTargets: 'min' in action ? action.min : undefined,
      maxTargets: 'max' in action ? action.max : undefined,
      backendCommand: action.type === 'choose_target'
        ? { type: 'choose_target', decisionId: action.decisionId, selectedIds: action.candidates.slice(0, action.min) }
        : action,
    })),
    interactionWindows: match.interactionWindows.map((window) => ({
      id: window.id,
      kind: window.kind,
      title: window.title,
      controllerId: window.controllerId,
      sourceCardInstanceId: window.sourceCardInstanceId,
      sourceLabel: window.sourceLabel,
      min: window.min,
      max: window.max,
      currentMana: window.currentMana,
      variableCosts: window.variableCosts,
      candidates: window.candidates,
      actions: window.legalActions.map((action, index) => ({
        actionId: `${window.id}:${index}`,
        kind: action.type === 'play_card' || action.type === 'stage_attack_card' || action.type === 'activate_ability' ? 'play_card'
          : action.type === 'confirm_staged_attack' || action.type === 'cancel_staged_attack' ? 'pass'
            : 'respond',
        ownerPlayerId: window.controllerId,
        label: action.type === 'stage_attack_card' ? '加入待确认攻击'
          : action.type === 'confirm_staged_attack' ? '确认打出攻击区'
            : action.type === 'cancel_staged_attack' ? '取消待确认攻击'
              : action.type === 'activate_ability' ? `发动能力 ${action.abilityId}`
              : action.type,
        targetId: 'candidates' in action ? action.candidates[0] : undefined,
        targetCandidates: 'candidates' in action ? action.candidates : undefined,
        minTargets: 'min' in action ? action.min : undefined,
        maxTargets: 'max' in action ? action.max : undefined,
        backendCommand: action.type === 'choose_target'
          ? { type: 'choose_target', decisionId: action.decisionId, selectedIds: action.candidates.slice(0, action.min) }
          : action,
      })),
    })),
    directives: match.directives,
    zones: match.zones,
    logs: match.logs.map((entry) => ({ id: entry.id, type: entry.type, message: entry.message })),
    replay: match.replay.map((entry) => ({
      id: entry.id,
      round: entry.round,
      phase: phaseLabels[entry.phase] ?? entry.phase,
      revision: entry.revision,
      label: entry.label,
    })),
    battleEvents: [],
    finalRanking: match.finalRanking,
    backendRejection: match.rejection ? `${match.rejection.code}: ${match.rejection.message}` : undefined,
  };
}

function occupants(playerLocations: Map<string, string | undefined>, locationId: string): string[] {
  return [...playerLocations.entries()]
    .filter(([, playerLocation]) => playerLocation === locationId)
    .map(([playerId]) => playerId);
}
