import {
  type LegalAction,
} from '@fd/rules/ability-client';
import {
  createMatchSession,
  type MatchSession,
} from '@fd/rules/match-session';
import type { GameState as RulesGameState } from '@fd/rules/schema/game';

import contentLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';

import type {
  ClientAvailableAction,
  InspectableCard,
  PlaytestClientFixture,
  ServantDeckView,
} from './playtest-fixture-loader';
import { resolveCardImageUrl, resolveEntityImageUrl } from './fd-asset-registry';

type ExecutableCard = {
  id: string;
  name: string;
  cardType: string;
  printedText?: string;
  cardFace?: {
    cost?: unknown;
    basePower?: unknown;
    attributes?: string[];
  };
  playTiming?: { phase?: string };
  abilities?: Array<{
    printedClause?: string;
    effects?: Array<{ type?: string; rule?: string; face?: string }>;
    targets?: Array<{
      id?: string;
      type?: string;
      scope?: { zone?: string };
      count?: { min?: number; max?: number };
      constraints?: Array<{ type?: string; locationKind?: string }>;
    }>;
  }>;
};

type ExecutableCharacter = {
  id: string;
  name: string;
  class?: string;
  kind: 'master' | 'servant';
  cardIds: string[];
  excludedCards?: Array<{
    id: string;
    name: string;
    reason?: string;
  }>;
};

const executableRules = (contentLibrary as unknown as {
  rules: {
    cards: Record<string, ExecutableCard>;
    characters: Record<string, ExecutableCharacter>;
    decks: Record<string, string[]>;
  };
}).rules;

function executableCard(cardId: string): ExecutableCard {
  const card = executableRules.cards[cardId];
  if (!card) throw new Error(`Executable pack is missing client-visible card ${cardId}`);
  return card;
}

type ContentCard = { id: string; name: string; cardType: string; printedReward?: number; printedText?: string; effects?: Array<{ attribute?: string }> };

const attributeLabels: Record<string, string> = {
  strength: '力量',
  agility: '敏捷',
  magecraft: '魔术',
  magic: '魔术',
  special: '特殊',
  noble_phantasm: '宝具',
};

const namedBasicAttackIds = new Set([
  'basic.preparation',
  'basic.surveil',
  'basic.luck',
]);

const eventCards = Object.fromEntries(
  ((contentLibrary as { cards?: ContentCard[] }).cards ?? [])
    .filter((card) => card.cardType === 'event')
    .map((card) => [card.id, {
      name: card.name,
      cardType: '事件牌',
      rulesSummaryZh: `${card.printedReward !== undefined ? `战果 ${card.printedReward}。` : ''}${card.printedText ?? '事件牌规则说明待录入。'}`,
      keywords: [...new Set((card.effects ?? []).map((effect) => attributeLabels[String(effect.attribute ?? '')]).filter((value): value is string => Boolean(value)))],
    } satisfies Pick<InspectableCard, 'name' | 'cardType' | 'rulesSummaryZh' | 'keywords'>]),
);

const situationCards: Record<string, Pick<InspectableCard, 'name' | 'rulesSummaryZh' | 'keywords'> & { manaRecovery: number }> = {
  'situation.turning_point': { name: '转机', manaRecovery: 2, rulesSummaryZh: '于深山町和新都各增加一张正面事件牌。恢复2点魔力。', keywords: ['事件'] },
  'situation.battle_of_shinto': { name: '新都之战', manaRecovery: 2, rulesSummaryZh: '于新都增加一张正面事件牌。恢复2点魔力。', keywords: ['事件'] },
  'situation.miyama_murderer': { name: '深山町的杀人魔', manaRecovery: 2, rulesSummaryZh: '于深山町增加一张正面事件牌。恢复2点魔力。', keywords: ['事件'] },
  'situation.furious': { name: '怒不可遏', manaRecovery: 2, rulesSummaryZh: '力量攻击于深山町和新都获得威力+2。恢复2点魔力。', keywords: ['力量'] },
  'situation.calm_before_storm': { name: '暴风雨前的宁静', manaRecovery: 2, rulesSummaryZh: '敏捷攻击于深山町和新都获得威力+2。恢复2点魔力。', keywords: ['敏捷'] },
  'situation.perfect_flow': { name: '完美的流动', manaRecovery: 2, rulesSummaryZh: '魔术攻击于深山町和新都获得威力+2。恢复2点魔力。', keywords: ['魔术'] },
  'situation.angra_mainyu_substance': { name: '安哥拉·曼纽的实质', manaRecovery: 0, rulesSummaryZh: '魔术攻击于深山町和新都获得威力+1。宝具禁止使用。', keywords: ['魔术', '宝具'] },
  'situation.angra_mainyu_shadow': { name: '安哥拉·曼纽的阴影', manaRecovery: 0, rulesSummaryZh: '敏捷攻击于深山町和新都获得威力+1。宝具禁止使用。', keywords: ['敏捷', '宝具'] },
  'situation.angra_mainyu_curse': { name: '安哥拉·曼纽的诅咒', manaRecovery: 0, rulesSummaryZh: '力量攻击于深山町和新都获得威力+1。宝具禁止使用。', keywords: ['力量', '宝具'] },
  'situation.longing_for_future': { name: '对未来的憧憬', manaRecovery: 0, rulesSummaryZh: '位于深山町和新都的玩家，若其所有攻击至少有一种属性相同，则合计威力+3。', keywords: ['同属性'] },
  'situation.fate_night': { name: '命运之夜', manaRecovery: 4, rulesSummaryZh: '高潮：剩余4+人。高潮前两回合每个战场共放置两张事件牌。恢复4点魔力。', keywords: ['高潮', '事件'] },
  'situation.gate_of_hell': { name: '身处地狱之门', manaRecovery: 4, rulesSummaryZh: '高潮：剩余3+人。无法部署/进入新都与侦察，魔术工房仅限一人部署。恢复4点魔力。', keywords: ['高潮', '限制'] },
  'situation.heavens_cup': { name: '天之杯', manaRecovery: 6, rulesSummaryZh: '高潮：剩余2+人。关闭新都，深山町放置三张事件牌，魔术工房仅限一人部署。恢复6点魔力。', keywords: ['高潮', '事件'] },
};

const locationLabels = {
  miyama_town: '深山町',
  shinto: '新都',
  magic_workshop: '魔术工房',
  recon: '侦察',
  moon_holy_grail: '盈月大圣杯',
} as const;

const phaseLabels: Record<string, string> = {
  round_start: '回合开始',
  preparation: '准备阶段',
  advance: '前哨阶段',
  action: '行动阶段',
  battle: '战斗阶段',
  cleanup: '清理阶段',
  round_end: '回合结束',
};

const phaseOrder = ['round_start', 'preparation', 'advance', 'action', 'battle', 'cleanup', 'round_end'];

function cardTypeLabel(cardType: string): string {
  return {
    servant_skill: '从者技能',
    master_skill: '御主技能',
    command_spell: '令咒',
    servant_attack: '从者攻击牌',
    basic_attack: '基础攻击牌',
    master_deck_card: '御主牌库牌',
    servant_deck_card: '从者牌库牌',
  }[cardType] ?? cardType;
}

function formatPrintedScalar(value: unknown): number | string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (typeof value === 'object') {
    const printedExpression = (value as { printedExpression?: unknown }).printedExpression;
    if (typeof printedExpression === 'number' || typeof printedExpression === 'string') return printedExpression;
    const formula = (value as { formula?: unknown }).formula;
    if (typeof formula === 'number' || typeof formula === 'string') return formula;
  }
  return String(value);
}

function systemTargetNotes(card: ExecutableCard): string[] {
  const notes: string[] = [];
  for (const ability of card.abilities ?? []) {
    for (const target of ability.targets ?? []) {
      if (target.type === 'location') {
        const constraints = target.constraints ?? [];
        const anyLocation = constraints.some((constraint) => constraint.type === 'any_enabled_location');
        const excludesWorkshop = constraints.some((constraint) =>
          constraint.type === 'not_location_kind' && constraint.locationKind === 'workshop',
        );
        if (anyLocation && excludesWorkshop) {
          notes.push('系统目标窗口：可选择除魔术工房外的地点；“移动至”不会包含当前所在地。');
        }
      }
      if (target.type === 'card_instance' && target.scope?.zone === 'deck') {
        const min = target.count?.min ?? 1;
        const max = target.count?.max ?? min;
        notes.push(`系统目标窗口：从自己的牌库中选择 ${min === max ? min : `${min}-${max}`} 张牌。`);
      }
    }
  }
  return [...new Set(notes)];
}

function inspectableFromRaw(
  card: ExecutableCard,
  instanceId: string,
  ownerLabel: string,
  visibility: string,
): InspectableCard {
  const compiledCard = executableCard(card.id);
  const targetNotes = systemTargetNotes(compiledCard);
  const printedText = compiledCard.abilities
    ?.map((ability) => ability.printedClause)
    .filter((clause): clause is string => Boolean(clause))
    .join('\n');
  return {
    instanceId,
    definitionId: compiledCard.id,
    name: compiledCard.name,
    cardType: cardTypeLabel(compiledCard.cardType),
    cardRole: compiledCard.cardType.includes('skill') || compiledCard.cardType === 'command_spell' ? 'skill_effect' : 'combat_card',
    ownerLabel,
    visibility,
    rulesSummaryZh: [printedText || compiledCard.printedText || '规则说明待录入。', ...targetNotes].join('\n'),
    imageUrl: resolveCardImageUrl({ definitionId: compiledCard.id, cardType: compiledCard.cardType }),
    cost: formatPrintedScalar(compiledCard.cardFace?.cost),
    power: formatPrintedScalar(compiledCard.cardFace?.basePower),
    effectTiming: compiledCard.playTiming?.phase ? phaseLabels[compiledCard.playTiming.phase] ?? compiledCard.playTiming.phase : undefined,
    revealPolicy: visibility === '公开' ? '公开' : '仅本人可见',
    keywords: compiledCard.cardFace?.attributes,
  };
}

function inspectableMainCard(
  archive: ExecutableCharacter,
  instanceId: string,
  ownerLabel: string,
  cardType: string,
): InspectableCard {
  return {
    instanceId,
    definitionId: archive.id,
    name: archive.name,
    cardType,
    cardRole: 'public_state',
    ownerLabel,
    visibility: '公开',
    rulesSummaryZh: `${archive.name} 的主卡公开信息。技能牌由后端可执行内容包生成并投影。`,
    imageUrl: resolveCardImageUrl({ definitionId: archive.id, cardType: cardType.includes('御主') ? 'master_overview' : 'servant_overview' }),
    revealPolicy: '始终公开',
  };
}

function inspectableServantDeckGuide(
  archive: ExecutableCharacter,
  deck: ServantDeckView,
  instanceId: string,
  ownerLabel: string,
): InspectableCard {
  const entries = deck.entries.map((entry) => {
    const label = entry.cardId
      ? ({
          'basic.preparation': '远隔操作',
          'basic.surveil': '急行',
          'basic.luck': '幸运',
          'servant.artoriac.skill.sc-artoriac-4': "Pilgrim's Call",
          'servant.artoriac.skill.sc-artoriac-5': "Pilgrim's Respite",
          'servant.artoriac.skill.sc-artoriac-6': "Pilgrim's Destiny",
          'master.kiritsugu.deck.origin-bullet': '起源弹',
        }[entry.cardId] ?? entry.cardId)
      : `${entry.attribute === 'strength' ? '力量' : entry.attribute === 'agility' ? '敏捷' : entry.attribute === 'magecraft' ? '魔术' : '特殊'} ${entry.printedValue ?? ''}`.trim();
    return `${label}×${entry.copies}`;
  });
  return {
    instanceId,
    definitionId: `${archive.id}.overview`,
    name: `${archive.name}牌库构成`,
    cardType: '从者牌库说明',
    cardRole: 'public_state',
    ownerLabel,
    visibility: '仅本人',
    rulesSummaryZh: `从者卡牌组第一张图。初始牌库构成：${entries.join('、')}。`,
    imageUrl: resolveCardImageUrl({ definitionId: `${archive.id}.overview`, cardType: 'servant_overview' }),
    revealPolicy: '本人可见',
    keywords: ['牌库构成'],
  };
}

function inspectableAscensionCard(
  card: NonNullable<ExecutableCharacter['excludedCards']>[number],
  instanceId: string,
  ownerLabel: string,
): InspectableCard {
  return {
    instanceId,
    definitionId: card.id,
    name: card.name,
    cardType: '升华技',
    cardRole: 'skill_effect',
    ownerLabel,
    visibility: '公开',
    rulesSummaryZh: '升华技已从御主本体技能中分离；第一版实战测试中作为独立展示/裁定区投影。',
    imageUrl: resolveCardImageUrl({ definitionId: card.id, cardType: 'master_ascension' }),
    revealPolicy: '独立升华技区域',
    masterSkillKind: 'ascension',
    keywords: ['升华技'],
  };
}

function inspectableEvent(
  eventCardId: string,
  instanceId: string,
  ownerLabel: string,
  visibility: string,
): InspectableCard {
  if (visibility !== '公开') {
    return {
      instanceId,
      definitionId: 'hidden-event',
      name: '暗置事件',
      cardType: '事件牌',
      cardRole: 'public_state',
      ownerLabel,
      visibility,
      rulesSummaryZh: '暗置事件尚未展示。',
      imageUrl: resolveCardImageUrl({ definitionId: 'hidden-event', cardType: 'event' }),
      revealPolicy: '暗置，触发后公开',
    };
  }
  const card = eventCards[eventCardId];
  return {
    instanceId,
    definitionId: eventCardId,
    name: card?.name ?? eventCardId,
    cardType: card?.cardType ?? '事件牌',
    cardRole: 'public_state',
    ownerLabel,
    visibility,
    rulesSummaryZh: card?.rulesSummaryZh ?? '事件牌规则说明待录入。',
    imageUrl: resolveCardImageUrl({ definitionId: eventCardId, cardType: 'event' }),
    revealPolicy: visibility === '公开' ? '公开' : '暗置，触发后公开',
    keywords: card?.keywords,
  };
}

function normalizeDeckAttribute(attribute: string | undefined): keyof ServantDeckView['attributeCounts'] | undefined {
  if (!attribute) return undefined;
  if (attribute === '力量' || attribute === 'strength') return 'strength';
  if (attribute === '敏捷' || attribute === 'agility') return 'agility';
  if (attribute === '魔术' || attribute === 'magic' || attribute === 'magecraft') return 'magecraft';
  if (attribute === '特殊' || attribute === 'special') return 'special';
  return undefined;
}

function addDeckEntry(
  grouped: Map<string, { entryType: 'basic' | 'named'; attribute: keyof ServantDeckView['attributeCounts']; printedValue?: number | string; cardId?: string; copies: number }>,
  attributeCounts: ServantDeckView['attributeCounts'],
  entry: { entryType: 'basic' | 'named'; attribute: keyof ServantDeckView['attributeCounts']; printedValue?: number | string; cardId?: string; copies: number },
): void {
  attributeCounts[entry.attribute] += entry.copies;
  const key = entry.entryType === 'named' ? entry.cardId! : `${entry.attribute}:${entry.printedValue ?? ''}`;
  const existing = grouped.get(key);
  if (existing) existing.copies += entry.copies;
  else grouped.set(key, { ...entry });
}

function buildStartingServantDeckView(character: ExecutableCharacter): ServantDeckView {
  const definitionIds = executableRules.decks[character.id];
  if (!definitionIds || definitionIds.length !== 12) {
    throw new Error(`Executable pack deck ${character.id} must contain exactly 12 cards`);
  }
  const attributeCounts: ServantDeckView['attributeCounts'] = { strength: 0, agility: 0, magecraft: 0, special: 0 };
  const grouped = new Map<string, { entryType: 'basic' | 'named'; attribute: keyof ServantDeckView['attributeCounts']; printedValue?: number | string; cardId?: string; copies: number }>();
  for (const definitionId of definitionIds) {
    const card = executableCard(definitionId);
    const isNamedBasic = namedBasicAttackIds.has(card.id);
    const isSpecialDeckCard = card.cardType === 'servant_deck_card' || card.cardType === 'master_deck_card';
    const attribute = isSpecialDeckCard ? 'special' : normalizeDeckAttribute(card.cardFace?.attributes?.[0]);
    if (!attribute) throw new Error(`Executable deck card ${definitionId} has no supported attack attribute`);
    addDeckEntry(grouped, attributeCounts, {
      entryType: isNamedBasic || isSpecialDeckCard ? 'named' : 'basic',
      attribute,
      printedValue: isNamedBasic || isSpecialDeckCard ? undefined : formatPrintedScalar(card.cardFace?.basePower),
      cardId: isNamedBasic || isSpecialDeckCard ? definitionId : undefined,
      copies: 1,
    });
  }
  return {
    size: definitionIds.length,
    attributeCounts,
    entries: [...grouped.values()],
  };
}

function buildServantDeckView(
  state: RulesGameState,
  rawCards: MatchSession['rawCards'],
  playerId: string,
): ServantDeckView {
  const deckCards = state.cards.filter((card) => {
    const cardType = rawCards.get(card.definitionId)?.cardType;
    return card.ownerPlayerId === playerId && (card.zone === 'deck' || card.zone === 'hand') && (cardType === 'basic_attack' || cardType === 'servant_deck_card' || cardType === 'master_deck_card');
  });
  const attributeCounts: ServantDeckView['attributeCounts'] = { strength: 0, agility: 0, magecraft: 0, special: 0 };
  const grouped = new Map<string, { entryType: 'basic' | 'named'; attribute: keyof ServantDeckView['attributeCounts']; printedValue?: number | string; cardId?: string; copies: number }>();
  for (const card of deckCards) {
    const raw = rawCards.get(card.definitionId);
    const isNamedBasic = namedBasicAttackIds.has(card.definitionId);
    const isSpecialDeckCard = raw?.cardType === 'servant_deck_card' || raw?.cardType === 'master_deck_card';
    const attribute = isSpecialDeckCard ? 'special' : normalizeDeckAttribute(raw?.cardFace?.attributes?.[0]);
    if (!attribute) continue;
    const printedValue = formatPrintedScalar(raw?.cardFace?.basePower);
    addDeckEntry(grouped, attributeCounts, {
      entryType: isNamedBasic || isSpecialDeckCard ? 'named' : 'basic',
      attribute,
      printedValue: isNamedBasic || isSpecialDeckCard ? undefined : printedValue,
      cardId: isNamedBasic || isSpecialDeckCard ? card.definitionId : undefined,
      copies: 1,
    });
  }
  return {
    size: deckCards.length,
    attributeCounts,
    entries: [...grouped.values()],
  };
}

function actionLabel(action: LegalAction, rawCards?: MatchSession['rawCards'], state?: RulesGameState): string {
  if (action.type === 'deploy_player') return `部署到 ${locationLabels[action.locationId as keyof typeof locationLabels] ?? action.locationId}`;
  if (action.type === 'stage_attack_card') return action.faceDown ? '加入待确认盖放' : '加入待确认攻击';
  if (action.type === 'confirm_staged_attack') return '确认打出攻击区';
  if (action.type === 'cancel_staged_attack') return '取消待确认攻击';
  if (action.type === 'play_card') return action.faceDown ? '盖放此牌' : '打出此牌';
  if (action.type === 'activate_ability') return `发动能力 ${action.abilityId}`;
  if (action.type === 'choose_target') return '选择目标';
  if (action.type === 'resolve_response') {
    const cardName = rawCards?.get(state?.cards.find((card) => card.instanceId === action.cardInstanceId)?.definitionId ?? '')?.name;
    return cardName ? `发动响应：${cardName}` : `发动响应：${action.abilityId}`;
  }
  return '放弃响应';
}

function mapLegalAction(action: LegalAction, index: number, ownerPlayerId: string, rawCards?: MatchSession['rawCards'], state?: RulesGameState): ClientAvailableAction {
  const backendCommand = action.type === 'choose_target'
    ? { type: 'choose_target' as const, decisionId: action.decisionId, selectedIds: action.candidates.slice(0, action.min) }
    : action;
  const sourceCard = 'cardInstanceId' in action
    ? state?.cards.find((card) => card.instanceId === action.cardInstanceId)
    : undefined;
  const sourceDefinition = sourceCard ? rawCards?.get(sourceCard.definitionId) : undefined;
  const ability = action.type === 'activate_ability' && state
    ? state.abilityRuntime?.pack.cards[sourceCard?.definitionId ?? '']?.abilities.find((candidate) => candidate.id === action.abilityId)
    : undefined;
  return {
    actionId: `${action.type}:${index}`,
    kind: action.type === 'deploy_player'
      ? 'deploy'
      : action.type === 'confirm_staged_attack' || action.type === 'cancel_staged_attack'
        ? 'pass'
      : action.type === 'play_card' || action.type === 'stage_attack_card' || action.type === 'activate_ability'
        ? 'play_card'
        : 'respond',
    ownerPlayerId,
    label: actionLabel(action, rawCards, state),
    sourceCardInstanceId: 'cardInstanceId' in action ? action.cardInstanceId : undefined,
    sourceCardName: sourceDefinition?.name,
    sourceCardType: sourceDefinition ? cardTypeLabel(sourceDefinition.cardType) : undefined,
    abilityId: action.type === 'activate_ability' ? action.abilityId : undefined,
    abilityLabel: ability?.printedClause,
    effectTiming: sourceDefinition?.playTiming?.phase ? phaseLabels[sourceDefinition.playTiming.phase] ?? sourceDefinition.playTiming.phase : undefined,
    targetId: 'candidates' in action ? action.candidates[0] : undefined,
    targetCandidates: 'candidates' in action ? action.candidates : undefined,
    minTargets: 'min' in action ? action.min : undefined,
    maxTargets: 'max' in action ? action.max : undefined,
    responseWindowId: 'windowId' in action ? action.windowId : undefined,
    backendCommand,
  };
}

export function createSevenAuthoringMatchSession(): MatchSession {
  const session = createMatchSession({ humanPlayerId: 'p1' });
  session.runUntilHumanInputOrRoundEnd();
  return session;
}

export function projectSevenAuthoringSessionFixture(session: MatchSession, viewerId = 'p1'): PlaytestClientFixture {
  const projected = session.projectToClientState(viewerId);
  const { state, pairings, rawCards } = session;
  const currentPlayerId = projected.priorityPlayerId;
  const currentView = projected.view;
  const cards: InspectableCard[] = [];
  const publicCardIds: string[] = [];
  const currentSituation = state.currentSituationCardId ? situationCards[state.currentSituationCardId] : undefined;

  for (const pairing of pairings) {
    const ownerLabel = `玩家 ${pairing.seat}`;
    const masterMainId = `public-${pairing.playerId}-master`;
    cards.push(inspectableMainCard(pairing.master, masterMainId, ownerLabel, '御主主卡'));
    publicCardIds.push(masterMainId);

    const masterCards = pairing.master.cardIds.map(executableCard);
    for (const masterCard of masterCards.filter((card) => card.cardType === 'master_skill' || card.cardType === 'command_spell')) {
      const publicSkillId = `public-${pairing.playerId}-${masterCard.id}`;
      cards.push(inspectableFromRaw(masterCard, publicSkillId, `${ownerLabel} · ${pairing.master.name}`, '公开'));
      publicCardIds.push(publicSkillId);
    }
    for (const ascensionCard of pairing.master.excludedCards ?? []) {
      const publicAscensionId = `public-${pairing.playerId}-${ascensionCard.id}`;
      cards.push(inspectableAscensionCard(ascensionCard, publicAscensionId, `${ownerLabel} · ${pairing.master.name}`));
      publicCardIds.push(publicAscensionId);
    }
  }

  for (const cardState of state.cards) {
    const rawCard = rawCards.get(cardState.definitionId);
    if (!rawCard) continue;
    const pairing = pairings.find((candidate) => candidate.playerId === cardState.ownerPlayerId);
    const ownerLabel = cardState.ownerPlayerId === viewerId
      ? `你 · ${pairing?.servant.name ?? pairing?.master.name ?? cardState.ownerPlayerId}`
      : `玩家 ${pairing?.seat ?? '?'} · ${pairing?.servant.name ?? pairing?.master.name ?? cardState.ownerPlayerId}`;
    const visible = cardState.visibility.scope === 'public' || cardState.ownerPlayerId === viewerId;
    if (!visible) continue;
    cards.push(inspectableFromRaw(
      rawCard,
      cardState.instanceId,
      ownerLabel,
      cardState.visibility.scope === 'public' ? '公开' : '仅本人',
    ));
    if (cardState.visibility.scope === 'public') publicCardIds.push(cardState.instanceId);
  }

  const battleEvents = state.eventPlacements.map((placement, index) => {
    const instanceId = `event-${index + 1}-${placement.eventCardId}`;
    const visibility = placement.visibility.scope === 'public' ? '公开' : '暗置';
    const wasHiddenRevealed = placement.visibility.scope === 'public'
      && (placement.visibility as { revealReason?: string }).revealReason === 'action_start';
    cards.push(inspectableEvent(
      placement.eventCardId,
      instanceId,
      locationLabels[placement.locationId],
      visibility,
    ));
    publicCardIds.push(instanceId);
    return {
      id: `battle-event-${index + 1}`,
      locationId: placement.locationId,
      label: wasHiddenRevealed
        ? `${locationLabels[placement.locationId]}暗置揭示事件`
        : visibility === '公开'
        ? `${locationLabels[placement.locationId]}明置事件`
        : `${locationLabels[placement.locationId]}暗置事件`,
      cardId: instanceId,
    };
  });

  if (state.currentSituationCardId) {
    const situationId = `situation-${state.currentSituationCardId}`;
    cards.push({
      instanceId: situationId,
      definitionId: state.currentSituationCardId,
      name: currentSituation?.name ?? state.currentSituationCardId,
      cardType: '局势牌',
      cardRole: 'public_state',
      ownerLabel: '公共区域',
      visibility: '公开',
      rulesSummaryZh: currentSituation?.rulesSummaryZh ?? '当前局势由 MatchSession 在回合开始投影；具体修正由后端战斗 breakdown 展示。',
      imageUrl: resolveCardImageUrl({ definitionId: state.currentSituationCardId, cardType: 'situation' }),
      revealPolicy: '回合开始公开',
      keywords: currentSituation?.keywords,
    });
    publicCardIds.push(situationId);
  }

  const players = state.players.map((player) => {
    const pairing = pairings.find((candidate) => candidate.playerId === player.id)!;
    const publicMasterSkillIds = pairing.master.cardIds
      .map(executableCard)
      .filter((card) => card.cardType === 'master_skill' || card.cardType === 'command_spell')
      .map((card) => `public-${player.id}-${card.id}`);
    const publicAscensionSkillIds = (pairing.master.excludedCards ?? [])
      .map((card) => `public-${player.id}-${card.id}`);
    const publicRevealedCardIds = state.cards
      .filter((card) => card.ownerPlayerId === player.id && card.visibility.scope === 'public')
      .map((card) => card.instanceId);
    return {
      id: player.id,
      seat: player.seat,
      name: player.id === viewerId ? '你' : `玩家 ${player.seat}`,
      masterName: pairing.master.name,
      servantName: pairing.servant.name,
      location: player.locationId ? locationLabels[player.locationId] : '未部署',
      vp: player.vp,
      mana: player.mana,
      commandSpells: (player as { commandSpells?: number }).commandSpells ?? 3,
      isSelf: player.id === viewerId,
      masterImageUrl: resolveEntityImageUrl('master', pairing.master.id),
      servantImageUrl: resolveEntityImageUrl('servant', pairing.servant.id),
      publicMasterCardId: `public-${player.id}-master`,
      publicMasterSkillIds,
      publicAscensionSkillIds,
      publicRevealedCardIds,
    };
  });

  const modeState = (state as unknown as {
    modeState?: {
      closedLocations?: string[];
      deploymentLimitOnly?: Record<string, number>;
      terrainAssignments?: Partial<Record<keyof typeof locationLabels, string[]>>;
    };
  }).modeState;
  const occupants = (locationId: keyof typeof locationLabels) => {
    const assigned = (modeState?.terrainAssignments?.[locationId] ?? [])
      .filter((playerId) => state.players.some((player) => player.id === playerId && player.locationId === locationId));
    const assignedSet = new Set(assigned);
    return assigned.concat(state.players
      .filter((player) => player.locationId === locationId && !assignedSet.has(player.id))
      .map((player) => player.id));
  };
  const latestBattle = projected.battleBreakdowns[projected.battleBreakdowns.length - 1];
  const latestWinnerIds = latestBattle?.winnerPlayerIds ?? (latestBattle?.winnerPlayerId ? [latestBattle.winnerPlayerId] : []);
  const latestWinnerNames = latestWinnerIds
    .map((playerId) => players.find((player) => player.id === playerId)?.name)
    .filter((name): name is string => typeof name === 'string');
  const latestEventHits = latestBattle?.participantBreakdowns.flatMap((participant) =>
    participant.modifiers
      .filter((modifier) => modifier.source === 'event')
      .map((modifier) => ({ label: modifier.label, value: modifier.value })),
  ) ?? [];
  const closedLocations = new Set(modeState?.closedLocations ?? []);
  const workshopDeployLimit = modeState?.deploymentLimitOnly?.magic_workshop;
  const selfPairing = pairings.find((pairing) => pairing.playerId === viewerId) ?? pairings[0]!;
  const selfDeckView = buildStartingServantDeckView(selfPairing.servant);
  const currentDeckView = buildServantDeckView(state, rawCards, viewerId);
  selfDeckView.remaining = state.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'deck').length;
  selfDeckView.handCount = state.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'hand').length;
  selfDeckView.discardCount = state.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'discard').length;
  selfDeckView.removedCount = state.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'removed_from_game').length;
  selfDeckView.currentEntries = currentDeckView.entries;
  const servantDeckGuideCardId = `self-${viewerId}-${selfPairing.servant.id}-deck-guide`;
  cards.push(inspectableServantDeckGuide(
    selfPairing.servant,
    selfDeckView,
    servantDeckGuideCardId,
    `你 · ${selfPairing.servant.name}`,
  ));

  return {
    match: {
      round: state.round.roundNumber,
      phase: phaseLabels[state.round.activePhase] ?? state.round.activePhase,
      priorityPlayerId: currentPlayerId,
    },
    phaseTrack: phaseOrder.map((phaseId) => {
      const currentIndex = phaseOrder.indexOf(state.round.activePhase);
      const stepIndex = phaseOrder.indexOf(phaseId);
      return {
        id: phaseId,
        label: phaseLabels[phaseId] ?? phaseId,
        status: stepIndex < currentIndex ? 'done' as const : stepIndex === currentIndex ? 'current' as const : 'upcoming' as const,
      };
    }),
    players,
    locations: [
      {
        id: 'magic_workshop',
        name: '魔术工房',
        subtitle: workshopDeployLimit === 1 ? '非战场 · 仅限一人部署' : '非战场 · 后端状态',
        occupants: occupants('magic_workshop'),
        imageUrl: '/assets/fd/locations/workshop.png',
        mapArea: 'A2',
        capacityLabel: workshopDeployLimit === 1 ? '部署 1' : '4',
        workshopManaSlots: [2, 1, 1, 1],
        moveCostToNext: 1,
      },
      {
        id: 'miyama_town',
        name: '深山町',
        subtitle: '战场 · 公开事件',
        occupants: occupants('miyama_town'),
        imageUrl: '/assets/fd/locations/miyama.png',
        mapArea: 'B2',
        terrainSlots: [3, 1],
        contestVp: 2,
        moveCostToNext: 2,
      },
      {
        id: 'recon',
        name: '侦察',
        subtitle: closedLocations.has('recon') ? '非战场 · 当前局势禁止进入' : '非战场 · 容量 1',
        occupants: occupants('recon'),
        imageUrl: '/assets/fd/locations/recon.png',
        mapArea: 'G',
        capacityLabel: '1',
        reconVp: 2,
      },
      {
        id: 'shinto',
        name: '新都',
        subtitle: closedLocations.has('shinto') ? '战场 · 当前局势关闭' : '战场 · 暗置后展示',
        occupants: occupants('shinto'),
        imageUrl: '/assets/fd/locations/shinto.png',
        mapArea: 'B3',
        terrainSlots: [3, 1],
        contestVp: 3,
        moveCostToNext: 2,
      },
    ],
    battleEvents,
    situation: state.currentSituationCardId
      ? {
          cardId: `situation-${state.currentSituationCardId}`,
          effectText: currentSituation?.rulesSummaryZh ?? '当前局势效果由后端参与战斗结算。',
          manaRecovery: currentSituation?.manaRecovery ?? 0,
        }
      : undefined,
    self: {
      masterName: selfPairing.master.name,
      servantName: selfPairing.servant.name,
      deck: selfDeckView,
      hand: state.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'hand').map((card) => card.instanceId),
      stagedAttackArea: projected.view.stagedAttacks?.find((entry) => entry.playerId === viewerId)?.cards.map((card) => card.cardInstanceId) ?? [],
      attackArea: state.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'attack_area').map((card) => card.instanceId),
      discard: state.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'discard').map((card) => card.instanceId),
      skills: state.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'skill' && rawCards.get(card.definitionId)?.cardType === 'servant_skill').map((card) => card.instanceId),
      masterSkills: state.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'skill' && rawCards.get(card.definitionId)?.cardType === 'master_skill').map((card) => card.instanceId),
      commandSpells: state.cards.filter((card) => card.ownerPlayerId === viewerId && card.zone === 'skill' && rawCards.get(card.definitionId)?.cardType === 'command_spell').map((card) => card.instanceId),
      ascensionSkills: (selfPairing.master.excludedCards ?? []).map((card) => `public-${viewerId}-${card.id}`),
      masterImageUrl: resolveEntityImageUrl('master', selfPairing.master.id),
      servantImageUrl: resolveEntityImageUrl('servant', selfPairing.servant.id),
      servantDeckGuideCardId,
    },
    cards,
    publicCardIds,
    powerPreview: latestBattle
      ? {
          title: `最近战斗：${locationLabels[latestBattle.battlefieldId]}`,
          total: latestBattle.margin,
          terms: [
            { label: latestWinnerNames.length ? `${latestWinnerNames.join(' / ')}胜出` : '无胜者', value: latestBattle.margin },
            ...latestEventHits,
          ],
        }
      : undefined,
    availableActions: currentView.legalActions.map((action, index) => mapLegalAction(action, index, currentPlayerId, rawCards, state)),
    interactionWindows: projected.interactionWindows.map((window) => ({
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
      actions: window.legalActions.map((action, index) => mapLegalAction(action, index, window.controllerId, rawCards, state)),
    })),
    directives: projected.directives.map((directive) => ({
      id: directive.id,
      controllerId: directive.controllerId,
      kind: directive.kind,
      status: directive.status,
      label: directive.label,
      payload: directive.payload,
    })),
    zones: projected.zones.map((zone) => ({
      id: zone.id,
      label: zone.label,
      cardIds: zone.cardIds,
      count: zone.count,
      status: zone.status,
    })),
    logs: projected.logs.map((entry) => ({ id: entry.id, type: entry.type, message: entry.message })),
    replay: projected.replay.map((entry) => ({
      id: entry.id,
      round: entry.round,
      phase: phaseLabels[entry.phase] ?? entry.phase,
      revision: entry.revision,
      label: entry.label,
    })),
    finalRanking: projected.finalRanking,
    backendRejection: projected.rejection ? `${projected.rejection.code}: ${projected.rejection.message}` : undefined,
    optionalAbilityReminder: currentView.responseWindow
      ? `存在响应窗口：${currentView.responseWindow.id}`
      : currentView.pendingDecision
        ? `存在待选目标：${currentView.pendingDecision.id}`
        : '当前桌面连接本地 MatchSession；点击动作会提交后端并继续半自动推进。',
  };
}

export function loadSevenAuthoringSmokeFixture(): PlaytestClientFixture {
  return projectSevenAuthoringSessionFixture(createSevenAuthoringMatchSession());
}
