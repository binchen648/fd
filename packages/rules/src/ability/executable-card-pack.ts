import type {
  BasicAttackDictionary,
  CompiledPlaytestContentLibrary,
} from '@fd/content';

import { loadAuthoringJson, node, nodes, str } from './loader';
import { sha256Hex } from './portable-sha256';
import {
  DataFlowValidationError,
  hasResolutionDataFlowSyntax,
  validateResolutionDataFlowNodes,
} from './resolution-dataflow';
import type {
  AuthoringAbility,
  AuthoringCard,
  ExecutableCardDefinition,
  ExecutableCharacterDefinition,
  RuleNode,
} from './types';

export interface ExecutableSourceMapEntry {
  archiveId: string;
  archiveIndex: number;
  cardIndex: number;
  abilityIndex?: number;
  path: string;
}

export interface ExecutableCardPack {
  schemaVersion: 'fd-executable-card-pack-v1';
  definitionHash: string;
  contentIdentity: { packId: string; version: number; definitionHash: string };
  cards: Record<string, ExecutableCardDefinition>;
  characters: Record<string, ExecutableCharacterDefinition>;
  decks: Record<string, string[]>;
  fallbackCommandSpells: Record<string, string>;
  sourceMap: Record<string, ExecutableSourceMapEntry>;
}

type CompileInput = CompiledPlaytestContentLibrary;
type ContentIdentityInput = Pick<CompiledPlaytestContentLibrary, 'pack' | 'dictionaries' | 'masters' | 'servants' | 'cards' | 'eventSets'>;

const basicAttributes = {
  b: { id: 'strength', label: '力量' },
  q: { id: 'agility', label: '敏捷' },
  a: { id: 'magecraft', label: '魔术' },
} as const;

const namedLegacyDeckIds: Record<string, string> = {
  'card.cardluck': 'basic.luck',
  'card.cardsurveil': 'basic.surveil',
  'card.cardpreparation': 'basic.preparation',
  'card.x-pilgrimcall': 'servant.artoriac.skill.sc-artoriac-4',
  'card.x-pilgrimrespite': 'servant.artoriac.skill.sc-artoriac-5',
  'card.x-pilgrimdestiny': 'servant.artoriac.skill.sc-artoriac-6',
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => [key, canonicalize(child)]));
}

function hashDefinitions(value: unknown): string {
  return sha256Hex(JSON.stringify(canonicalize(value)));
}

function identityPayload(content: ContentIdentityInput, executable: Pick<ExecutableCardPack, 'schemaVersion' | 'cards' | 'characters' | 'decks' | 'fallbackCommandSpells'>): unknown {
  return {
    schemaVersion: executable.schemaVersion,
    pack: content.pack,
    presentation: {
      dictionaries: content.dictionaries,
      masters: content.masters,
      servants: content.servants,
      cards: content.cards,
      eventSets: content.eventSets,
    },
    cards: executable.cards,
    characters: executable.characters,
    decks: executable.decks,
    fallbackCommandSpells: executable.fallbackCommandSpells,
  };
}

export function assertExecutableCardPack(value: unknown, content: ContentIdentityInput): asserts value is ExecutableCardPack {
  if (!value || typeof value !== 'object') throw new Error('Executable card pack is missing');
  if ('archives' in value) throw new Error('Executable card pack must not contain authoring archives');
  const executable = value as Partial<ExecutableCardPack>;
  if (executable.schemaVersion !== 'fd-executable-card-pack-v1' ||
    !executable.contentIdentity || !executable.cards || !executable.characters || !executable.decks ||
    !executable.fallbackCommandSpells || !executable.sourceMap ||
    typeof executable.definitionHash !== 'string') {
    throw new Error('Invalid executable card pack schema');
  }
  for (const [archiveId, deck] of Object.entries(executable.decks)) {
    if (!Array.isArray(deck) || deck.length !== 12) throw new Error(`Invalid compiled deck for ${archiveId}`);
    for (const cardId of deck) if (!executable.cards[cardId]) throw new Error(`${archiveId} references missing card ${cardId}`);
  }
  for (const character of Object.values(executable.characters)) {
    for (const cardId of character.cardIds) {
      if (!executable.cards[cardId]) throw new Error(`${character.id} references missing card ${cardId}`);
    }
  }
  const actualHash = hashDefinitions(identityPayload(content, {
    schemaVersion: executable.schemaVersion,
    cards: executable.cards,
    characters: executable.characters,
    decks: executable.decks,
    fallbackCommandSpells: executable.fallbackCommandSpells,
  }));
  if (actualHash !== executable.definitionHash) throw new Error('Executable card pack hash mismatch');
  if (executable.contentIdentity.packId !== content.pack.id ||
    executable.contentIdentity.version !== content.pack.version ||
    executable.contentIdentity.definitionHash !== executable.definitionHash) {
    throw new Error('Executable card pack identity mismatch');
  }
}

function classifyCard(cardType: string): Pick<ExecutableCardDefinition, 'playKind' | 'destinationZone'> {
  const attack = ['servant_skill', 'servant_deck_card', 'servant_attack', 'basic_attack', 'master_deck_card'].includes(cardType);
  return attack
    ? { playKind: 'attack', destinationZone: 'attack_area' }
    : { playKind: 'support', destinationZone: 'field' };
}

function executableDefinition(card: AuthoringCard, ownerId?: string): ExecutableCardDefinition {
  return { ...card, ...(ownerId ? { ownerId } : {}), ...classifyCard(card.cardType) };
}

function assertSemanticSubset(source: unknown, compiled: unknown, path: string): void {
  if (Array.isArray(source)) {
    if (!Array.isArray(compiled) || source.length !== compiled.length) {
      throw new Error(`Semantic loss at ${path}: array cardinality changed`);
    }
    source.forEach((child, index) => assertSemanticSubset(child, compiled[index], `${path}[${index}]`));
    return;
  }
  if (source && typeof source === 'object') {
    if (!compiled || typeof compiled !== 'object' || Array.isArray(compiled)) {
      throw new Error(`Semantic loss at ${path}: object was removed`);
    }
    for (const [key, child] of Object.entries(source as Record<string, unknown>)) {
      if (!(key in (compiled as Record<string, unknown>))) throw new Error(`Semantic loss at ${path}.${key}`);
      assertSemanticSubset(child, (compiled as Record<string, unknown>)[key], `${path}.${key}`);
    }
    return;
  }
  if (!Object.is(source, compiled)) throw new Error(`Semantic loss at ${path}`);
}

function validateSemanticSurvival(rawCard: Record<string, unknown>, compiledCard: AuthoringCard, path: string): void {
  for (const field of ['cardFace', 'playTiming', 'playRequirements'] as const) {
    assertSemanticSubset(rawCard[field] ?? (field === 'playRequirements' ? [] : {}), compiledCard[field], `${path}.${field}`);
  }
  const rawAbilities = nodes(rawCard.abilities);
  if (rawAbilities.length !== compiledCard.abilities.length) throw new Error(`Semantic loss at ${path}.abilities`);
  rawAbilities.forEach((rawAbility, abilityIndex) => {
    const compiledAbility = compiledCard.abilities[abilityIndex]!;
    const abilityPath = `${path}.abilities[${abilityIndex}]`;
    for (const field of [
      'id', 'kind', 'printedClause', 'activation', 'conditions', 'targets', 'effects', 'ruleModifiers',
      'creates', 'lifecycle', 'responseWindow', 'limit', 'visibility',
    ] as const) {
      const empty = ['conditions', 'targets', 'effects', 'ruleModifiers', 'creates'].includes(field) ? [] : {};
      assertSemanticSubset(rawAbility[field] ?? empty, compiledAbility[field as keyof AuthoringAbility], `${abilityPath}.${field}`);
    }
    const rawCost = Array.isArray(rawAbility.cost) ? rawAbility.cost : rawAbility.cost ? [rawAbility.cost] : [];
    assertSemanticSubset(rawCost, compiledAbility.cost, `${abilityPath}.cost`);
    const execution = node(rawAbility.execution);
    assertSemanticSubset(execution.mode ?? 'automatic', compiledAbility.execution.mode, `${abilityPath}.execution.mode`);
  });
}

function specialBasicDefinitions(dictionary: BasicAttackDictionary): AuthoringCard[] {
  const byId = new Map(Object.values(dictionary).map((entry) => [entry.id, entry as typeof entry & { cost?: number; power?: number }]));
  return ['basic.preparation', 'basic.surveil', 'basic.luck'].map((id) => {
    const entry = byId.get(id);
    if (!entry || !Number.isFinite(entry.cost) || !Number.isFinite(entry.power)) {
      throw new Error(`Missing strict basic attack dictionary entry: ${id}`);
    }
    const abilities: AuthoringAbility[] = id === 'basic.surveil' ? [{
      id: 'basic.surveil.battle-dash', kind: 'phase_action', printedClause: '行动阶段：无视交战状态，沿箭头移动至下一地点。',
      activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' }, conditions: [],
      targets: [{ id: 'destination', type: 'location', count: { min: 1, max: 1 }, constraints: [{ type: 'reachable_along_arrows', maxSteps: 1 }] }],
      effects: [{ type: 'move_player', to: 'destination' }], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {},
      limit: { type: 'per_round', uses: 1 }, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
    }] : id === 'basic.luck' ? [{
      id: 'basic.luck.ignore-defeat', kind: 'residual', printedClause: '战斗阶段：无视本次败北效果。',
      activation: { trigger: 'while_active' }, conditions: [], targets: [], effects: [{ type: 'append_only_rule', rule: 'ignore_battle_loss_effects' }],
      cost: [], ruleModifiers: [], creates: [], lifecycle: { cleanup: 'discard_at_round_end' }, responseWindow: {}, limit: {}, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    }] : [];
    return {
      id, name: entry.rulesName, cardType: 'basic_attack',
      cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: entry.cost, basePower: entry.power },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities, mode: 'automatic',
    };
  });
}

function basicAttackDefinitions(dictionary: BasicAttackDictionary): AuthoringCard[] {
  const ordinary = Object.values(basicAttributes).flatMap((attribute) => [1, 2, 3, 4, 5].map((power): AuthoringCard => ({
    id: `basic.${attribute.id}.${power}`, name: `${attribute.label}攻击 ${power}`, cardType: 'basic_attack',
    cardFace: { typeLabel: attribute.label, attributes: [attribute.label], cost: 0, basePower: power },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
  })));
  const special = specialBasicDefinitions(dictionary);
  const generatedLuck = { ...structuredClone(special.find((card) => card.id === 'basic.luck')!), id: 'card.luck' };
  return [...ordinary, ...special, generatedLuck];
}

function defaultCommandSpellCard(masterId: string): AuthoringCard {
  const ability = (id: string, printedClause: string, effects: AuthoringAbility['effects'], creates: AuthoringAbility['creates'] = []): AuthoringAbility => ({
    id, kind: 'phase_action', printedClause, activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [], targets: [],
    effects, cost: [], ruleModifiers: [], creates, lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  });
  return {
    id: `${masterId}.command-spell`, name: '令咒', cardType: 'command_spell', cardFace: { cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], mode: 'automatic',
    abilities: [
      ability('command-spell.gain-mana', '行动阶段：获得4点魔力。', [
        { type: 'adjust_mana', amount: 4 }, { type: 'adjust_command_seals', amount: -1, directive: 'spend_command_spell' },
      ]),
      ability('command-spell.power-victory', '行动阶段：总威力+2，如果你本回合赢得战斗，获得2点战果。', [
        { type: 'record_master_directive', directive: 'gain_2_vp_if_win_this_round' },
        { type: 'adjust_command_seals', amount: -1, directive: 'spend_command_spell' },
      ], [{ type: 'create_modifier', modifier: { type: 'power_bonus', target: 'controller', amount: 2, duration: 'this_round' } }]),
      ability('command-spell.free-move', '行动阶段：无视交战状态，从深山町或新都移动至任意地点。', [
        { type: 'record_master_directive', directive: 'move_from_shinto_or_miyama_to_any_location_ignore_engagement' },
        { type: 'adjust_command_seals', amount: -1, directive: 'spend_command_spell' },
      ]),
    ],
  };
}

function mapDeckEntry(cardId: string): string {
  const lower = cardId.toLowerCase();
  const named = namedLegacyDeckIds[lower];
  if (named) return named;
  const match = /^card\.card([abq])([1-5])$/.exec(lower);
  if (!match) throw new Error(`Unknown deck entry: ${cardId}`);
  const attribute = basicAttributes[match[1] as keyof typeof basicAttributes];
  return `basic.${attribute.id}.${match[2]}`;
}

function validateCardReferences(value: unknown, cards: Record<string, AuthoringCard>, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((child, index) => validateCardReferences(child, cards, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if ((key === 'cardId' || key === 'definitionId') && typeof child === 'string' && !cards[child]) {
      throw new Error(`${path}.${key} references missing card ${child}`);
    }
    validateCardReferences(child, cards, `${path}.${key}`);
  }
}

function validateAbilityTargetReferences(card: ExecutableCardDefinition, cards: Record<string, ExecutableCardDefinition>): void {
  for (const ability of card.abilities) {
    const targetIds = new Set(ability.targets.map((target) => str(target.id)).filter(Boolean));
    const visit = (value: unknown, path: string): void => {
      if (Array.isArray(value)) {
        value.forEach((child, index) => visit(child, `${path}[${index}]`));
        return;
      }
      if (!value || typeof value !== 'object') return;
      const current = value as Record<string, unknown>;
      const type = str(current.type);
      const references: Array<{ key: string; value: unknown; allowCardDefinition?: boolean }> = [];
      if (current.targetRef !== undefined) references.push({ key: 'targetRef', value: current.targetRef });
      if (['play_selected_cards', 'replace_card_in_deck', 'attach_card_to_player_attack', 'transfer_vp_to_owner'].includes(type)) {
        references.push({ key: 'target', value: current.target });
      } else if (type === 'move_card') {
        references.push({ key: 'target', value: current.target, allowCardDefinition: true });
      }
      if (type === 'move_player') references.push({ key: 'to', value: current.to });
      for (const reference of references) {
        if (typeof reference.value !== 'string' || ['controller', 'this_card', 'source_card'].includes(reference.value)) continue;
        const matchesCard = reference.allowCardDefinition && Object.keys(cards).some((cardId) =>
          cardId === reference.value || cardId.endsWith(`.${reference.value}`) || cardId.endsWith(`.skill.${reference.value}`));
        if (!targetIds.has(reference.value) && !matchesCard) {
          throw new Error(`${path}.${reference.key} references missing target ${reference.value}`);
        }
      }
      for (const [key, child] of Object.entries(current)) visit(child, `${path}.${key}`);
    };
    visit([...ability.conditions, ...ability.effects, ...ability.cost, ...ability.creates], `cards.${card.id}.abilities.${ability.id}`);
  }
}

function validateAbilityResolutionDataFlow(card: ExecutableCardDefinition): void {
  for (const ability of card.abilities) {
    const effects = [...ability.effects, ...ability.creates];
    if (!hasResolutionDataFlowSyntax(effects) && !isResourceNumericDirectActionSemantic(ability) && !isCardZoneCoreDirectActionRouteCandidate(ability) && !isAddToAttackRouteCandidate(ability) && !isActivateCardByIdTrigger(ability) && !isCloseSourceCardOnPlayedTrigger(ability)) continue;
    const path = `cards.${card.id}.abilities.${ability.id}.effects`;
    try {
      validateResolutionDataFlowNodes(effects, path);
    } catch (error) {
      if (!(error instanceof DataFlowValidationError)) throw error;
      const detail = error.issues.map((issue) => `${issue.path}: ${issue.code}: ${issue.message}`).join('\n');
      throw new Error(`Resolution data-flow validation failed at ${path}:\n${detail}`);
    }
  }
}

const directResourcePrimitiveTypes = new Set(['adjust_mana', 'adjust_command_seals', 'adjust_victory_points']);

function isResourceNumericDirectActionSemantic(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' &&
    str(ability.activation.phase) === 'action' &&
    str(ability.activation.opens) === 'controller_action_window' &&
    ability.targets.length === 0 &&
    ability.cost.length === 0 &&
    ability.creates.length === 0 &&
    ability.effects.length > 0 &&
    ability.effects.every((effect) => directResourcePrimitiveTypes.has(str(effect.type)));
}

function isCardZoneCoreDirectActionSemantic(ability: AuthoringAbility): boolean {
  return isMoveAllRemainingManaBindingSemantic(ability);
}

function isCardZoneCoreDirectActionRouteCandidate(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || str(ability.activation.phase) !== 'advance' || str(ability.activation.opens) !== 'controller_action_window') return false;
  if (ability.targets.length || ability.cost.length || ability.creates.length || ability.effects.length !== 2) return false;
  const [move, mana] = ability.effects;
  const binding = str(move?.resultVar ?? move?.bind);
  return str(move?.type) === 'move_all_remaining' &&
    !!binding &&
    str(mana?.type) === 'adjust_mana' &&
    referencesMovedCountBinding(mana?.amount, binding);
}

function isActivateCardByIdTrigger(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'forced_trigger' || str(ability.activation.trigger) !== 'after_controller_first_loses_battle') return false;
  if (ability.conditions.length || ability.targets.length || ability.cost.length || ability.creates.length || ability.effects.length !== 1) return false;
  const [effect] = ability.effects;
  return str(effect?.type) === 'activate_card_by_id' && typeof effect?.definitionId === 'string' && effect.definitionId.length > 0;
}

function isCloseSourceCardOnPlayedTrigger(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'residual' || str(ability.activation.trigger) !== 'on_card_played' || str(ability.activation.opens) !== 'immediate') return false;
  if (ability.conditions.length !== 2 || ability.targets.length || ability.cost.length || ability.creates.length || ability.effects.length !== 1) return false;
  if (str(ability.effects[0]?.type) !== 'close_source_card') return false;
  const sourceZone = ability.conditions.some((condition) => str(condition.type) === 'source_card_in_zone' && str(condition.zone) === 'field');
  const noblePlay = ability.conditions.some((condition) => str(condition.type) === 'event_played_card_has_attribute' && str(condition.attribute) === '宝具');
  return sourceZone && noblePlay;
}

function isAddToAttackRouteCandidate(ability: AuthoringAbility): boolean {
  return isAddToAttackStructuralCandidate(ability) &&
    ability.conditions.some((condition) => str(condition.type) === 'not' && str(node(condition.condition).type) === 'controller_at_battlefield');
}

function isAddToAttackStructuralCandidate(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || str(ability.activation.phase) !== 'advance' || str(ability.activation.opens) !== 'controller_action_window') return false;
  if (ability.targets.length !== 1 || ability.cost.length !== 1 || ability.creates.length || ability.effects.length !== 1) return false;
  const [effect] = ability.effects;
  return str(effect?.type) === 'attach_card_to_player_attack' &&
    typeof effect?.cardId === 'string' &&
    typeof effect?.target === 'string' &&
    hasFixedManaCost(ability.cost, 2) &&
    hasSingleNonControllerPlayerTarget(ability.targets, str(effect.target));
}

function isMoveAllRemainingManaBindingSemantic(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || str(ability.activation.phase) !== 'advance' || str(ability.activation.opens) !== 'controller_action_window') return false;
  if (ability.targets.length || ability.cost.length || ability.creates.length || ability.effects.length !== 2) return false;
  const [move, mana] = ability.effects;
  const binding = str(move?.resultVar ?? move?.bind);
  return str(move?.type) === 'move_all_remaining' &&
    str(move?.from) === 'hand' &&
    str(node(move?.to).zone) === 'discard' &&
    !!binding &&
    str(mana?.type) === 'adjust_mana' &&
    referencesMovedCountBinding(mana?.amount, binding);
}

function hasFixedManaCost(costs: RuleNode[], amount: number): boolean {
  if (costs.length !== 1 || str(costs[0]?.type) !== 'pay_mana') return false;
  const amountNode = node(costs[0]?.amount);
  return Number(costs[0]?.amount) === amount ||
    ((str(amountNode.expr) === 'literal' || str(amountNode.op) === 'literal' || str(amountNode.op) === 'const') && Number(amountNode.value) === amount);
}

function hasSingleNonControllerPlayerTarget(targets: RuleNode[], targetId: string): boolean {
  const target = targets.find((candidate) => str(candidate.id) === targetId);
  if (!target || str(target.type) !== 'player') return false;
  const count = node(target.count);
  return Number(count.min ?? 1) === 1 &&
    Number(count.max ?? 1) === 1 &&
    nodes(target.constraints).some((constraint) => str(constraint.type) === 'not_controller');
}

function referencesMovedCountBinding(value: unknown, binding: string): boolean {
  const current = node(value);
  return str(current.var) === binding ||
    (str(current.expr) === 'binding_field' && str(current.binding) === binding && str(current.field) === 'movedCount' && str(current.valueType) === 'number');
}

function validatePresentationReferences(input: CompileInput, cards: Record<string, ExecutableCardDefinition>): void {
  for (const character of [...input.masters, ...input.servants]) {
    for (const cardId of character.skillCardIds) {
      if (!cards[cardId]) throw new Error(`${character.id} references missing skill card ${cardId}`);
    }
  }
}

function deferredCardIds(cards: Record<string, ExecutableCardDefinition>): Set<string> {
  const deferred = new Set<string>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== 'object') return;
    const current = value as Record<string, unknown>;
    if (['create_card', 'attach_card_to_player_attack'].includes(str(current.type)) && typeof current.cardId === 'string') deferred.add(current.cardId);
    if (['create_independent_deck', 'replace_card_in_deck'].includes(str(current.type)) && typeof current.definitionId === 'string') deferred.add(current.definitionId);
    Object.values(current).forEach(visit);
  };
  Object.values(cards).forEach((card) => card.abilities.forEach(visit));
  return deferred;
}

export function compileExecutableCardPack(input: CompileInput): ExecutableCardPack {
  if (input.rules.schemaVersion !== 'fd-card-rule-content-v1') throw new Error('Expected fd-card-rule-content-v1 source');
  const archives = structuredClone(input.rules.archives);
  const cards: Record<string, ExecutableCardDefinition> = Object.create(null) as Record<string, ExecutableCardDefinition>;
  const characters: Record<string, ExecutableCharacterDefinition> = {};
  const decks: Record<string, string[]> = {};
  const fallbackCommandSpells: Record<string, string> = {};
  const sourceMap: Record<string, ExecutableSourceMapEntry> = {};
  const archiveIds = new Set<string>();

  archives.forEach((archive, archiveIndex) => {
    if (archiveIds.has(archive.id)) throw new Error(`Duplicate archive definition: ${archive.id}`);
    archiveIds.add(archive.id);
    const compiled = loadAuthoringJson(archive);
    if (compiled.report.length) {
      const detail = compiled.report.map((issue) => `${issue.cardId}:${issue.abilityId ?? 'card'}:${issue.path}: ${issue.reason}`).join('\n');
      throw new Error(`Executable compilation rejected unsupported semantics:\n${detail}`);
    }
    archive.cards.forEach((rawCard, cardIndex) => {
      if (cards[rawCard.id]) throw new Error(`Duplicate card definition: ${rawCard.id}`);
      const card = compiled.cards[rawCard.id];
      if (!card) throw new Error(`Missing compiled card definition: ${rawCard.id}`);
      validateSemanticSurvival(rawCard, card, `archives[${archiveIndex}].cards[${cardIndex}]`);
      cards[card.id] = executableDefinition(card, archive.id);
      sourceMap[card.id] = { archiveId: archive.id, archiveIndex, cardIndex, path: `archives[${archiveIndex}].cards[${cardIndex}]` };
      card.abilities.forEach((ability, abilityIndex) => {
        sourceMap[`${card.id}#${ability.id}`] = {
          archiveId: archive.id,
          archiveIndex,
          cardIndex,
          abilityIndex,
          path: `archives[${archiveIndex}].cards[${cardIndex}].abilities[${abilityIndex}]`,
        };
      });
    });
    const excludedCards = nodes(archive.excludedCards).map((card) => ({
      id: str(card.id),
      name: str(card.name),
      ...(str(card.reason) ? { reason: str(card.reason) } : {}),
    }));
    characters[archive.id] = {
      id: archive.id,
      name: archive.name,
      ...(archive.class ? { class: archive.class } : {}),
      kind: archive.id.startsWith('master.') ? 'master' : 'servant',
      cardIds: archive.cards.map((card) => card.id),
      publicInformation: node(structuredClone(archive.publicInformation ?? {})),
      ...(excludedCards.length ? { excludedCards } : {}),
    };
  });

  for (const definition of basicAttackDefinitions(input.dictionaries.basicAttacks)) {
    if (cards[definition.id]) throw new Error(`Duplicate generated card definition: ${definition.id}`);
    cards[definition.id] = executableDefinition(definition);
  }

  for (const archive of archives.filter((candidate) => candidate.id.startsWith('master.'))) {
    if (archive.cards.some((card) => card.cardType === 'command_spell')) continue;
    const definition = defaultCommandSpellCard(archive.id);
    if (cards[definition.id]) throw new Error(`Duplicate generated card definition: ${definition.id}`);
    cards[definition.id] = executableDefinition(definition, archive.id);
    fallbackCommandSpells[archive.id] = definition.id;
  }

  validatePresentationReferences(input, cards);

  for (const archive of archives.filter((candidate) => candidate.id.startsWith('servant.'))) {
    const skillCount = archive.cards.filter((card) => card.cardType === 'servant_skill').length;
    if (skillCount !== 3) throw new Error(`${archive.id} must define exactly 3 servant skill cards; found ${skillCount}`);
    const deck = (archive.deck ?? []).flatMap((entry) => {
      if (!Number.isSafeInteger(entry.count ?? 1) || (entry.count ?? 1) < 1) throw new Error(`Invalid deck count for ${archive.id}:${entry.cardId}`);
      return Array.from({ length: entry.count ?? 1 }, () => mapDeckEntry(entry.cardId));
    });
    if (deck.length !== 12) throw new Error(`${archive.id} deck must contain exactly 12 cards; found ${deck.length}`);
    for (const cardId of deck) if (!cards[cardId]) throw new Error(`${archive.id} references missing card ${cardId}`);
    decks[archive.id] = deck;
  }

  const deferred = deferredCardIds(cards);
  for (const card of Object.values(cards)) {
    if (['servant_skill', 'master_skill', 'command_spell'].includes(card.cardType) && !deferred.has(card.id)) card.initialZone = 'skill';
    validateCardReferences(card.abilities, cards, `cards.${card.id}.abilities`);
    validateAbilityTargetReferences(card, cards);
    validateAbilityResolutionDataFlow(card);
  }

  const executableWithoutHash = {
    schemaVersion: 'fd-executable-card-pack-v1',
    cards,
    characters,
    decks,
    fallbackCommandSpells,
  } as const;
  const definitionHash = hashDefinitions(identityPayload(input, executableWithoutHash));
  return {
    ...executableWithoutHash,
    definitionHash,
    contentIdentity: { packId: input.pack.id, version: input.pack.version, definitionHash },
    sourceMap,
  };
}
