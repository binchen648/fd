import compiledLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';
import compiledFixture from '../../../../data/generated/fd-playtest-v1.fixture.json';
import type { AbilityCommand } from '@fd/rules/ability-client';
import { resolveCardImageUrl, resolveEntityImageUrl } from './fd-asset-registry';

export interface DeckEntryView {
  entryType: 'basic' | 'named';
  attribute: 'strength' | 'agility' | 'magecraft' | 'special';
  printedValue?: number | string;
  cardId?: string;
  copies: number;
}

export interface ServantDeckView {
  size: number;
  remaining?: number;
  handCount?: number;
  discardCount?: number;
  removedCount?: number;
  attributeCounts: {
    strength: number;
    agility: number;
    magecraft: number;
    special: number;
  };
  entries: DeckEntryView[];
  currentEntries?: DeckEntryView[];
}

export interface InspectableCard {
  instanceId: string;
  definitionId: string;
  name: string;
  cardType: string;
  cardRole?: 'combat_card' | 'skill_effect' | 'public_state';
  ownerLabel: string;
  visibility: string;
  rulesSummaryZh: string;
  imageUrl?: string;
  cost?: number | string;
  power?: number | string;
  effectTiming?: string;
  revealPolicy?: string;
  masterSkillKind?: 'native' | 'ascension';
  allowedPhases?: string[];
  keywords?: string[];
  sourceLabel?: string;
}

export interface ClientAvailableAction {
  actionId: string;
  kind: 'play_card' | 'deploy' | 'move' | 'respond' | 'pass';
  ownerPlayerId: string;
  label: string;
  sourceCardInstanceId?: string;
  sourceCardName?: string;
  sourceCardType?: string;
  abilityId?: string;
  abilityLabel?: string;
  effectTiming?: string;
  targetId?: string;
  targetCandidates?: string[];
  minTargets?: number;
  maxTargets?: number;
  responseWindowId?: string;
  backendCommand?: AbilityCommand;
}

export interface ClientInteractionWindow {
  id: string;
  kind: 'payment' | 'target' | 'response' | 'mode' | 'variable';
  title: string;
  controllerId: string;
  sourceCardInstanceId?: string;
  sourceLabel?: string;
  min?: number;
  max?: number;
  currentMana?: number;
  variableCosts?: Array<{ name: string; min: number; max: number }>;
  candidates?: Array<{ id: string; label: string; kind: 'card' | 'player' | 'location' | 'option'; zone?: string }>;
  actions: ClientAvailableAction[];
}

export interface ClientDirectiveView {
  id: string;
  controllerId?: string;
  kind: 'display' | 'player_confirmation' | 'host_adjudicated' | 'persistent_rule' | 'resource_deck';
  status: 'pending' | 'consumed';
  label: string;
  payload?: Record<string, unknown>;
}

export interface ClientZoneGroup {
  id: string;
  label: string;
  cardIds: string[];
  count: number;
  status?: 'enabled' | 'empty' | 'disabled' | 'host_adjudicated';
}

export interface ClientReplayCheckpoint {
  id: string;
  round: number;
  phase: string;
  revision: number;
  label: string;
}

export interface ClientPhaseStep {
  id: string;
  label: string;
  status: 'done' | 'current' | 'upcoming';
}

export interface PlaytestClientFixture {
  match: { round: number; phase: string; priorityPlayerId: string };
  phaseTrack?: ClientPhaseStep[];
  players: Array<{
    id: string;
    seat: number;
    name: string;
    masterName: string;
    servantName: string;
    location: string;
    vp: number;
    mana: number;
    commandSpells: number;
    isSelf: boolean;
    masterImageUrl?: string;
    servantImageUrl?: string;
    publicMasterCardId?: string;
    publicMasterSkillIds?: string[];
    publicAscensionSkillIds?: string[];
    publicRevealedCardIds?: string[];
  }>;
  locations: Array<{
    id: string;
    name: string;
    subtitle: string;
    occupants: string[];
    imageUrl?: string;
    mapArea?: string;
    capacityLabel?: string;
    workshopManaSlots?: number[];
    terrainSlots?: number[];
    contestVp?: number;
    reconVp?: number;
    moveCostToNext?: number;
  }>;
  situation?: {
    cardId: string;
    effectText: string;
    manaRecovery: number;
  };
  battleEvents?: Array<{
    id: string;
    locationId: string;
    label: string;
    cardId: string;
  }>;
  self: {
    masterName: string;
    servantName: string;
    deck: ServantDeckView;
    hand: string[];
    stagedAttackArea?: string[];
    attackArea?: string[];
    discard?: string[];
    skills: string[];
    masterSkills?: string[];
    commandSpells?: string[];
    ascensionSkills?: string[];
    masterImageUrl?: string;
    servantImageUrl?: string;
    servantDeckGuideCardId?: string;
  };
  cards: InspectableCard[];
  publicCardIds: string[];
  powerPreview?: {
    title: string;
    total: number;
    terms: Array<{ label: string; value: number; sourceCardId?: string }>;
  };
  availableActions: ClientAvailableAction[];
  interactionWindows?: ClientInteractionWindow[];
  directives?: ClientDirectiveView[];
  zones?: ClientZoneGroup[];
  logs?: Array<{ id: string; type: string; message: string }>;
  replay?: ClientReplayCheckpoint[];
  finalRanking?: Array<{ playerId: string; seat: number; vp: number; militaryResult: number; rank: number }>;
  backendRejection?: string;
  nonPriorityView?: {
    priorityPlayerId: string;
    availableActions: ClientAvailableAction[];
  };
  optionalAbilityReminder?: string;
}

interface LibraryCard {
  id: string;
  name: string;
  cardType: string;
  printedValue?: number;
  printedCost?: number;
  printedText?: string;
  timing?: string[];
  traits?: string[];
  source?: { imagePath?: string };
  capability?: { status?: string; hostRulingReason?: string };
}

type ClientContentLibrary = {
  servants: Array<{
    id: string;
    name: string;
    startingDeck: ServantDeckView;
    skillCardIds: [string, string, string];
  }>;
  masters: Array<{
    id: string;
    name: string;
    overviewCardId: string;
    skillCardIds: string[];
  }>;
  cards: LibraryCard[];
};

const generatedLibrary = compiledLibrary as unknown as ClientContentLibrary;
const library: ClientContentLibrary = generatedLibrary;

const generatedFixture = compiledFixture as unknown as {
  seats: Array<{ seat: number; playerId: string; masterId: string; servantId: string }>;
};
const fixture = generatedFixture;

const cardTypeLabels: Record<string, string> = {
  event: '事件牌',
  servant_skill: '从者技能',
  named_attack: '具名攻击牌',
  master_skill: '御主技能',
  master_overview: '御主主卡',
  command_spell: '令咒',
};

const timingLabels: Record<string, string> = {
  round_start: '回合开始',
  preparation: '准备',
  advance: '移动',
  action: '行动',
  battle: '战斗',
  after_battle: '战斗后',
  cleanup: '清理',
  round_end: '回合结束',
};

const rulesSummaryOverrides: Record<string, string> = {
  'master.dan_blackmore.skill.may_day_knight': '从游戏外将 3 张远隔操作和 2 张急行放置于此牌上。每回合至多一次，可将其中一张追加打出；回合结束时该牌进入弃牌堆。若如此，抽 1 张牌并将该牌移除。',
  'servant.francis_drake.skill.riding': '打出时：若此牌与一张基础攻击牌一同打出，抽 1 张牌。行动阶段可打出至多 3 张基础威力为 3 或更低的手牌。',
  'servant.francis_drake.skill.golden_hind_and_stormy_night': '【真名解放】战斗阶段：若无人与你对战，获得你所处战场上的所有事件牌战果并弃置它们；若你在侦察，立即获得 2 点战果。无视花费移动至任一地点。',
  'servant.francis_drake.skill.stormy_voyager': '行动阶段：本回合你的移动无视地图路径且不消耗魔力。战斗阶段：此牌追加打出时威力 +X，X 为本回合移动距离的 4 倍。',
  'event.waxing_moon_ritual.ritual': '盈月之仪事件牌：此战场战斗结束时，玩家可按事件文字恢复魔力并处理竞争奖励。',
};

function cardFromDefinition(
  definitionId: string,
  instanceId: string,
  ownerLabel: string,
  visibility: string,
): InspectableCard {
  const definition = library.cards.find((card) => card.id === definitionId);
  if (!definition) {
    throw new Error(`Missing compiled card definition: ${definitionId}`);
  }

  return {
    instanceId,
    definitionId,
    name: definition.name,
    cardType: cardTypeLabels[definition.cardType] ?? definition.cardType,
    ...(definition.cardType.includes('skill') ? { cardRole: 'skill_effect' as const } : {}),
    ...(definition.cardType === 'master_overview' ? { cardRole: 'public_state' as const } : {}),
    ownerLabel,
    visibility,
    rulesSummaryZh: (definition.cardType === 'master_overview'
      ? '御主主卡的卡面能力、初始魔力与令咒信息均为公开信息；点击可放大阅读原始卡面。'
      : rulesSummaryOverrides[definitionId]) ??
      definition.printedText ??
      definition.capability?.hostRulingReason ??
      '规则说明待录入；需要时进入房主裁定。',
    imageUrl: resolveCardImageUrl({ definitionId, cardType: definition.cardType }),
    ...(definition.printedCost !== undefined ? { cost: definition.printedCost } : {}),
    ...(typeof definition.printedValue === 'number' ? { power: definition.printedValue } : {}),
    ...(definition.timing?.length ? { effectTiming: definition.timing.map((timing) => timingLabels[timing] ?? timing).join(' / ') } : {}),
    ...(definitionId === 'servant.francis_drake.skill.stormy_voyager' ? {
      effectTiming: '行动阶段／战斗阶段',
      revealPolicy: '发动时公开',
    } : {}),
    ...(definitionId === 'master.dan_blackmore.skill.may_day_knight' ? {
      effectTiming: '行动阶段',
      revealPolicy: '公开御主技能',
      masterSkillKind: 'native' as const,
    } : {}),
    ...(definition.cardType === 'master_overview' ? {
      revealPolicy: '始终公开',
    } : {}),
    ...(definition.traits?.length ? { keywords: definition.traits } : {}),
    ...(definition.source?.imagePath ? { sourceLabel: definition.source.imagePath } : {}),
  };
}

export function loadPlaytestClientFixture(): PlaytestClientFixture {
  const selectedSeat = fixture.seats[0]!;
  const selectedServant = library.servants.find((servant) => servant.id === selectedSeat.servantId)!;
  const selectedMaster = library.masters.find((master) => master.id === selectedSeat.masterId)!;
  const skillCards = selectedServant.skillCardIds.map((definitionId, index) =>
    cardFromDefinition(definitionId, `self-card-${index + 1}`, `你 · ${selectedServant.name}`, '仅本人'),
  );
  const handCards: InspectableCard[] = [
    {
      instanceId: 'self-hand-1', definitionId: 'basic.strength.2', name: '力量 2', cardType: '基础攻击牌',
      ownerLabel: `你 · ${selectedServant.name}`, visibility: '仅本人', rulesSummaryZh: '力量属性攻击牌，印刷数值 2。',
      power: 2, keywords: ['力量'], imageUrl: resolveCardImageUrl({ definitionId: 'basic.strength.2', cardType: 'basic_attack' }),
    },
    {
      instanceId: 'self-hand-2', definitionId: 'basic.agility.3', name: '敏捷 3', cardType: '基础攻击牌',
      ownerLabel: `你 · ${selectedServant.name}`, visibility: '仅本人', rulesSummaryZh: '敏捷属性攻击牌，印刷数值 3。',
      power: 3, keywords: ['敏捷'], imageUrl: resolveCardImageUrl({ definitionId: 'basic.agility.3', cardType: 'basic_attack' }),
    },
    {
      instanceId: 'self-hand-3', definitionId: 'basic.preparation', name: '远隔操作', cardType: '特殊牌',
      ownerLabel: `你 · ${selectedServant.name}`, visibility: '仅本人', rulesSummaryZh: '远隔（Preparation）：按卡牌与当前响应窗口的规则处理。',
      keywords: ['远隔'], imageUrl: resolveCardImageUrl({ definitionId: 'basic.preparation', cardType: 'special' }),
    },
  ];
  const publicMasterBundles = fixture.seats.map((seat) => {
    const master = library.masters.find((candidate) => candidate.id === seat.masterId)!;
    const ownerLabel = seat.playerId === selectedSeat.playerId ? `你 · ${master.name}` : `玩家 ${seat.seat} · ${master.name}`;
    return {
      playerId: seat.playerId,
      overview: cardFromDefinition(master.overviewCardId, `public-master-card-${seat.seat}`, ownerLabel, '公开'),
      skills: master.skillCardIds.map((definitionId, index) =>
        cardFromDefinition(definitionId, `public-master-skill-${seat.seat}-${index + 1}`, ownerLabel, '公开'),
      ),
    };
  });
  const selectedMasterBundle = publicMasterBundles.find((bundle) => bundle.playerId === selectedSeat.playerId)!;
  const masterSkillCards = selectedMasterBundle.skills;
  const publicServantSeat = fixture.seats.find((seat) => seat.playerId !== selectedSeat.playerId) ?? selectedSeat;
  const publicServant = library.servants.find((candidate) => candidate.id === publicServantSeat.servantId)!;
  const publicServantSkillId = publicServant.skillCardIds[0];
  const ascensionCards: InspectableCard[] = [
    {
      instanceId: 'self-ascension-skill-1',
      definitionId: 'master.ascension.demo.tactical_release',
      name: '升华技占位',
      cardType: '升华技',
      cardRole: 'skill_effect',
      masterSkillKind: 'ascension',
      effectTiming: '特定阶段',
      revealPolicy: '发动时公开',
      ownerLabel: `你 · ${selectedMaster.name}`,
      visibility: '公开',
      rulesSummaryZh: '升华技结构占位；后续以御主源卡文本替换。',
      imageUrl: resolveCardImageUrl({ definitionId: 'master.ascension.demo.tactical_release', cardType: 'master_skill' }),
    },
  ];
  const ownCards = [...skillCards, ...handCards, ...ascensionCards];
  const publicCards = [
    ...publicMasterBundles.flatMap((bundle) => [bundle.overview, ...bundle.skills]),
    cardFromDefinition(
      'event.waxing_moon_ritual.ritual',
      'public-event-1',
      '深山町',
      '公开',
    ),
    cardFromDefinition(
      publicServantSkillId,
      'public-skill-1',
      `对手 · ${publicServant.name}`,
      '公开',
    ),
    {
      instanceId: 'public-situation-1',
      definitionId: 'situation.perfect_flow',
      name: '完美的流动',
      cardType: '局势牌',
      cardRole: 'public_state' as const,
      ownerLabel: '公共区域',
      visibility: '公开',
      rulesSummaryZh: '魔术攻击于所有战场（深山町与新都）获得威力 +2。回合开始时，所有玩家立即获得 2 点魔力。',
      imageUrl: resolveCardImageUrl({ definitionId: 'situation.perfect_flow', cardType: 'situation' }),
    },
    {
      instanceId: 'public-location-effect-1',
      definitionId: 'location.shinto.effect.demo',
      name: '新都地利',
      cardType: '地点效果牌',
      cardRole: 'public_state' as const,
      ownerLabel: '新都',
      visibility: '公开',
      rulesSummaryZh: '代表性地点效果；规则说明待录入。',
      imageUrl: '/assets/fd/locations/shinto.png',
    },
  ];

  const players = fixture.seats.map((seat) => {
    const master = library.masters.find((candidate) => candidate.id === seat.masterId)!;
    const servant = library.servants.find((candidate) => candidate.id === seat.servantId)!;
    const isSelf = seat.playerId === selectedSeat.playerId;
    const masterBundle = publicMasterBundles.find((bundle) => bundle.playerId === seat.playerId)!;
    return {
      id: seat.playerId,
      seat: seat.seat,
      name: isSelf ? '你' : `玩家 ${seat.seat}`,
      masterName: master.name,
      servantName: servant.name,
      location: seat.seat % 2 === 0 ? '深山町' : '新都',
      vp: Math.max(0, 4 - Math.floor(seat.seat / 2)),
      mana: 4,
      commandSpells: 3,
      isSelf,
      masterImageUrl: resolveEntityImageUrl('master', seat.masterId),
      servantImageUrl: resolveEntityImageUrl('servant', seat.servantId),
      publicMasterCardId: masterBundle.overview.instanceId,
      publicMasterSkillIds: masterBundle.skills.map((card) => card.instanceId),
      publicAscensionSkillIds: isSelf ? ascensionCards.map((card) => card.instanceId) : [],
      publicRevealedCardIds: seat.playerId === publicServantSeat.playerId ? ['public-skill-1'] : [],
    };
  });

  return {
    match: { round: 4, phase: '行动阶段', priorityPlayerId: selectedSeat.playerId },
    players,
    locations: [
      {
        id: 'magic_workshop',
        name: '魔术工房',
        subtitle: '非战场 · 通常容量 4',
        occupants: [],
        imageUrl: '/assets/fd/locations/workshop.png',
        mapArea: 'A2',
        capacityLabel: '通常 4',
        workshopManaSlots: [2, 1, 1, 1],
        moveCostToNext: 1,
      },
      {
        id: 'miyama_town',
        name: '深山町',
        subtitle: '战场 · 明置事件',
        occupants: players.filter((player) => player.location === '深山町').map((player) => player.id),
        imageUrl: '/assets/fd/locations/miyama.png',
        mapArea: 'B2',
        terrainSlots: [3, 1],
        contestVp: 2,
        moveCostToNext: 2,
      },
      {
        id: 'shinto',
        name: '新都',
        subtitle: '战场 · 暗置后展示',
        occupants: players.filter((player) => player.location === '新都').map((player) => player.id),
        imageUrl: '/assets/fd/locations/shinto.png',
        mapArea: 'B3',
        terrainSlots: [3, 1],
        contestVp: 3,
        moveCostToNext: 2,
      },
      {
        id: 'recon',
        name: '侦察',
        subtitle: '非战场 · 容量 1',
        occupants: [],
        imageUrl: '/assets/fd/locations/recon.png',
        mapArea: 'G',
        capacityLabel: '1',
        reconVp: 2,
      },
    ],
    situation: {
      cardId: 'public-situation-1',
      effectText: '魔术攻击于所有战场（深山町与新都）获得威力 +2。',
      manaRecovery: 2,
    },
    battleEvents: [
      { id: 'battle-event-miyama', locationId: 'miyama_town', label: '深山町事件', cardId: 'public-event-1' },
      { id: 'battle-event-shinto', locationId: 'shinto', label: '新都事件', cardId: 'public-location-effect-1' },
    ],
    self: {
      masterName: selectedMaster.name,
      servantName: selectedServant.name,
      deck: selectedServant.startingDeck,
      hand: handCards.map((card) => card.instanceId),
      skills: skillCards.map((card) => card.instanceId),
      masterSkills: masterSkillCards.map((card) => card.instanceId),
      ascensionSkills: ascensionCards.map((card) => card.instanceId),
      masterImageUrl: resolveEntityImageUrl('master', selectedSeat.masterId),
      servantImageUrl: resolveEntityImageUrl('servant', selectedSeat.servantId),
    },
    cards: [...ownCards, ...publicCards],
    publicCardIds: publicCards.map((card) => card.instanceId),
    powerPreview: {
      title: '当前出牌威力预览',
      total: 9,
      terms: [
        { label: '基础威力', value: 2, sourceCardId: 'self-hand-2' },
        { label: '新都地利', value: 3 },
        { label: '完美的流动（魔术）', value: 2, sourceCardId: 'public-situation-1' },
        { label: '事件牌', value: 2, sourceCardId: 'public-location-effect-1' },
      ],
    },
    availableActions: [...handCards, ...skillCards].map((card) => ({
      actionId: `play:${card.instanceId}`,
      kind: 'play_card',
      ownerPlayerId: selectedSeat.playerId,
      label: '加入常规出牌',
      sourceCardInstanceId: card.instanceId,
    })),
    nonPriorityView: {
      priorityPlayerId: fixture.seats.find((seat) => seat.playerId !== selectedSeat.playerId)!.playerId,
      availableActions: [],
    },
    optionalAbilityReminder: '仍有可选能力尚未处理；可以继续结束行动。',
  };
}
