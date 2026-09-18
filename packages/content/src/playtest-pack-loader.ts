import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import {
  type CapabilityStatus,
  type ContentPack,
  type EventSetDefinition,
  type MasterDefinition,
  type NamedCardDefinition,
  type ServantDefinition,
  type SourceEvidence,
  computeAttributeCounts,
  validateContentPack,
} from './playtest-content-pack';

export interface BasicAttackDictionaryEntry {
  id: string;
  canonicalKey: string;
  displayName: string;
  rulesName: string;
  attribute: 'special';
}

export type BasicAttackDictionary = Record<string, BasicAttackDictionaryEntry>;

export interface PlaytestPackManifest {
  id: string;
  name: string;
  version: number;
  dictionaries: {
    basicAttacks: string;
  };
  servantFiles: string[];
  servantCardFiles: string[];
  masterFiles: string[];
  masterCardFiles: string[];
  authoringServantFiles?: string[];
  authoringMasterFiles?: string[];
  authoringMasterSupportFiles?: string[];
  authoringMasterRuleFiles?: string[];
  eventSetFiles: string[];
  eventCardFiles: string[];
}

export interface LoadedPlaytestContentPack extends ContentPack {
  manifest: PlaytestPackManifest;
  dictionaries: {
    basicAttacks: BasicAttackDictionary;
  };
  eventCards: NamedCardDefinition[];
  authoringArchives: AuthoringArchive[];
}

export interface PackValidationIssue {
  code: string;
  message: string;
  blocking: boolean;
  entityId?: string;
  referenceId?: string;
  field?: string;
}

export interface CompiledPlaytestContentLibrary {
  schemaVersion: 'fd-playtest-content-library-v1';
  pack: {
    id: string;
    name: string;
    version: number;
  };
  dictionaries: {
    basicAttacks: BasicAttackDictionary;
  };
  masters: MasterDefinition[];
  servants: ServantDefinition[];
  cards: NamedCardDefinition[];
  eventSets: EventSetDefinition[];
  rules: {
    schemaVersion: 'fd-card-rule-content-v1' | 'fd-executable-card-pack-v1';
    definitionHash: string;
    archives: AuthoringArchive[];
    cards?: Record<string, unknown>;
    decks?: Record<string, string[]>;
    fallbackCommandSpells?: Record<string, string>;
    sourceMap?: Record<string, unknown>;
  };
}

export interface PlaytestFixture {
  id: string;
  contentPackId: string;
  seats: Array<{
    seat: number;
    playerId: string;
    masterId: string;
    servantId: string;
  }>;
}

export interface EvidenceEntityRow {
  entityId: string;
  displayName: string;
  entityKind: string;
  capabilityStatus: CapabilityStatus;
  htmPath: string;
  imagePath: string;
  imageIndex: number;
  reviewedAgainstImage: boolean;
  issueCodes: string[];
}

export interface EvidenceReport {
  schemaVersion: 'fd-playtest-evidence-report-v1';
  packId: string;
  summary: {
    masters: number;
    servants: number;
    events: number;
    blockingIssues: number;
  };
  entities: EvidenceEntityRow[];
  issues: PackValidationIssue[];
}

export interface CompiledPlaytestPack {
  library: CompiledPlaytestContentLibrary;
  fixture: PlaytestFixture;
  evidenceReport: EvidenceReport;
}

interface LoaderOptions {
  workspaceRoot: string;
}

export type SourceAssetValidation = 'required' | 'metadata_only';

interface ValidationOptions extends LoaderOptions {
  sourceAssetValidation?: SourceAssetValidation;
  sourceAssetRoot?: string;
}

export interface AuthoringCard {
  id: string;
  name: string;
  cardType: string;
  printedText?: string;
  cardFace?: {
    cost?: number;
    basePower?: number | { printedExpression?: string };
    attributes?: string[];
  };
  playTiming?: { phase?: string };
  playRequirements?: Array<Record<string, unknown>>;
  abilities?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface AuthoringArchive {
  schemaVersion: 'fd-card-authoring-v1';
  id: string;
  name: string;
  class?: string;
  deck?: Array<{ cardId: string; count?: number }>;
  cards: AuthoringCard[];
  [key: string]: unknown;
}

const MASTER_SUPPORT_ARCHIVE_TYPE = 'master_support_definition_archive';
const MASTER_RULE_ARCHIVE_TYPE = 'master_rule_definition_archive';

function isMasterSupportArchive(archive: AuthoringArchive): boolean {
  return archive.archiveType === MASTER_SUPPORT_ARCHIVE_TYPE;
}

function isMasterRuleArchive(archive: AuthoringArchive): boolean {
  return archive.archiveType === MASTER_RULE_ARCHIVE_TYPE;
}

function hasMasterSupportArchiveShape(archive: AuthoringArchive): boolean {
  return Array.isArray(archive.cards) && archive.cards.length > 0 &&
    archive.cards.every((card) => card.cardType === 'master_skill' && card.initialPlacement === 'outside_game') &&
    !Object.prototype.hasOwnProperty.call(archive, 'deck') &&
    !Object.prototype.hasOwnProperty.call(archive, 'publicInformation');
}

function hasMasterRuleArchiveShape(archive: AuthoringArchive): boolean {
  if (!Array.isArray(archive.cards) || archive.cards.length < 2 ||
    Object.prototype.hasOwnProperty.call(archive, 'deck') ||
    Object.prototype.hasOwnProperty.call(archive, 'publicInformation') ||
    !archive.cards.every((card) => card.cardType === 'master_skill' &&
      (card.initialPlacement === undefined || card.initialPlacement === 'outside_game'))) return false;
  return archive.cards.some((card) => card.initialPlacement === 'outside_game') &&
    archive.cards.some((card) => card.initialPlacement === undefined);
}

function assertMasterSupportArchive(archive: AuthoringArchive): void {
  if (!isMasterSupportArchive(archive)) {
    throw new Error(`Master support archive requires archiveType=${MASTER_SUPPORT_ARCHIVE_TYPE}: ${archive.id || '<missing-id>'}`);
  }
  if (typeof archive.id !== 'string' || !archive.id.startsWith('master.')) {
    throw new Error(`Master support archive id must start with master.: ${String(archive.id)}`);
  }
  if (!Array.isArray(archive.cards) || archive.cards.length === 0) {
    throw new Error(`Master support archive must contain at least one card: ${archive.id}`);
  }
  if (Object.prototype.hasOwnProperty.call(archive, 'deck')) {
    throw new Error(`Master support archive cannot define a deck: ${archive.id}`);
  }
  if (Object.prototype.hasOwnProperty.call(archive, 'publicInformation')) {
    throw new Error(`Master support archive cannot define playable master publicInformation: ${archive.id}`);
  }
  for (const card of archive.cards) {
    if (card.cardType !== 'master_skill') {
      throw new Error(`Master support archive may contain only master_skill cards: ${archive.id}:${card.id}`);
    }
    if (card.initialPlacement !== 'outside_game') {
      throw new Error(`Master support archive card requires initialPlacement=outside_game: ${archive.id}:${card.id}`);
    }
  }
}

function assertMasterRuleArchive(archive: AuthoringArchive): void {
  if (!isMasterRuleArchive(archive)) {
    throw new Error(`Master rule archive requires archiveType=${MASTER_RULE_ARCHIVE_TYPE}: ${archive.id || '<missing-id>'}`);
  }
  if (typeof archive.id !== 'string' || !archive.id.startsWith('master.')) {
    throw new Error(`Master rule archive id must start with master.: ${String(archive.id)}`);
  }
  if (!Array.isArray(archive.cards) || archive.cards.length < 2) {
    throw new Error(`Master rule archive must contain at least two cards: ${archive.id}`);
  }
  if (Object.prototype.hasOwnProperty.call(archive, 'deck')) {
    throw new Error(`Master rule archive cannot define a deck: ${archive.id}`);
  }
  if (Object.prototype.hasOwnProperty.call(archive, 'publicInformation')) {
    throw new Error(`Master rule archive cannot define playable master publicInformation: ${archive.id}`);
  }
  let outsideGame = 0;
  let ordinary = 0;
  for (const card of archive.cards) {
    if (card.cardType !== 'master_skill') {
      throw new Error(`Master rule archive may contain only master_skill cards: ${archive.id}:${card.id}`);
    }
    const owner = card.owner as Record<string, unknown> | undefined;
    if (owner?.type !== 'master' || owner.id !== archive.id) {
      throw new Error(`Master rule archive card owner must match archive id: ${archive.id}:${card.id}`);
    }
    if (card.initialPlacement === 'outside_game') outsideGame += 1;
    else if (card.initialPlacement === undefined) ordinary += 1;
    else throw new Error(`Master rule archive card has unsupported initialPlacement: ${archive.id}:${card.id}`);
  }
  if (outsideGame === 0) {
    throw new Error(`Master rule archive requires at least one initialPlacement=outside_game card: ${archive.id}`);
  }
  if (ordinary === 0) {
    throw new Error(`Master rule archive requires at least one ordinary non-deferred master_skill: ${archive.id}`);
  }
}

function assertNormalAuthoringArchive(archive: AuthoringArchive): void {
  if (isMasterSupportArchive(archive)) {
    throw new Error(`Master support archive must be registered through authoringMasterSupportFiles: ${archive.id}`);
  }
  if (isMasterRuleArchive(archive)) {
    throw new Error(`Master rule archive must be registered through authoringMasterRuleFiles: ${archive.id}`);
  }
  if (hasMasterSupportArchiveShape(archive)) {
    throw new Error(`Master support-shaped archive requires archiveType=${MASTER_SUPPORT_ARCHIVE_TYPE} and authoringMasterSupportFiles registration: ${archive.id}`);
  }
  if (hasMasterRuleArchiveShape(archive)) {
    throw new Error(`Master rule-shaped archive requires archiveType=${MASTER_RULE_ARCHIVE_TYPE} and authoringMasterRuleFiles registration: ${archive.id}`);
  }
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function readWorkspaceJson<T>(workspaceRoot: string, workspaceRelativePath: string): T {
  return readJson<T>(resolve(workspaceRoot, workspaceRelativePath));
}

function sortById<T extends { id: string }>(values: T[]): T[] {
  return structuredClone(values).sort((left, right) => left.id.localeCompare(right.id));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)]),
  );
}

function definitionHash(archives: AuthoringArchive[]): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(archives)))
    .digest('hex');
}

function workspaceRelative(pathValue: string, workspaceRoot: string): string {
  const normalized = pathValue.replaceAll('\\', '/');
  const root = workspaceRoot.replaceAll('\\', '/').replace(/\/$/, '');
  return normalized.startsWith(`${root}/`) ? normalized.slice(root.length + 1) : normalized;
}

function sourceRelative(pathValue: string, workspaceRoot: string): string {
  const relative = workspaceRelative(pathValue, workspaceRoot);
  const chmIndex = relative.indexOf('chm-extract/');
  if (chmIndex >= 0) return relative.slice(chmIndex);
  return relative.replace(/^\.\//, '');
}

function firstRegexMatch(value: unknown, pattern: RegExp): string | undefined {
  return JSON.stringify(value).match(pattern)?.[1];
}

function isSourceImagePath(value: unknown): value is string {
  return typeof value === 'string' && /\.(?:png|jpg|jpeg|webp)$/i.test(value);
}

function htmPathForArchive(archive: AuthoringArchive, workspaceRoot: string): string {
  const nested = firstRegexMatch(archive, /"htmPath"\s*:\s*"([^"]+)"/)
    ?? firstRegexMatch(archive, /"([^"]+\.htm)"/);
  return sourceRelative(nested ?? `chm-extract/${archive.name}.htm`, workspaceRoot);
}

function declaredImagesForArchive(archive: AuthoringArchive, workspaceRoot: string): string[] {
  const images: string[] = [];

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== 'object') return;

    const record = value as Record<string, unknown>;
    if (Array.isArray(record.imageOrder)) {
      record.imageOrder.filter(isSourceImagePath).forEach((image) => images.push(image));
    }
    for (const key of ['sourceImage', 'overviewImage', 'imagePath']) {
      if (isSourceImagePath(record[key])) images.push(record[key]);
    }
    if (record.type === 'original_card_image' && isSourceImagePath(record.path)) {
      images.push(record.path);
    }
    for (const [key, child] of Object.entries(record)) {
      if (['imageOrder', 'sourceImage', 'overviewImage', 'imagePath', 'path'].includes(key)) continue;
      visit(child);
    }
  };

  visit(archive);
  return images.map((image) => sourceRelative(image, workspaceRoot));
}

function sourceForArchive(
  archive: AuthoringArchive,
  workspaceRoot: string,
  imageIndex = 0,
): SourceEvidence {
  const images = declaredImagesForArchive(archive, workspaceRoot);
  return {
    htmPath: htmPathForArchive(archive, workspaceRoot),
    imagePath: images.length > 0 ? images[Math.min(imageIndex, images.length - 1)]! : '',
    imageIndex,
    reviewedAgainstImage: images.length > 0,
  };
}

function toTiming(phase?: string): NamedCardDefinition['timing'] {
  if (!phase) return undefined;
  const normalized = phase === 'movement' ? 'advance' : phase;
  return ['round_start', 'preparation', 'advance', 'action', 'battle', 'after_battle', 'cleanup', 'round_end'].includes(normalized)
    ? [normalized as NonNullable<NamedCardDefinition['timing']>[number]]
    : undefined;
}

function toAttribute(value?: string): NamedCardDefinition['attribute'] {
  if (value === '力量' || value === 'strength') return 'strength';
  if (value === '敏捷' || value === 'agility') return 'agility';
  if (value === '魔术' || value === 'magecraft') return 'magecraft';
  if (value === '特殊' || value === 'special' || value === '宝具') return 'special';
  return undefined;
}

function toCardType(cardType: string): NamedCardDefinition['cardType'] {
  if (cardType === 'servant_deck_card' || cardType === 'master_deck_card') return 'generated';
  if (cardType === 'servant_attack' || cardType === 'basic_attack') return 'named_attack';
  if (cardType === 'master_skill' || cardType === 'servant_skill' || cardType === 'command_spell') return cardType;
  return 'generated';
}

function toNamedCard(
  card: AuthoringCard,
  archive: AuthoringArchive,
  workspaceRoot: string,
  imageIndex: number,
): NamedCardDefinition {
  const attributes = card.cardFace?.attributes
    ?.map(toAttribute)
    .filter((attribute): attribute is NonNullable<NamedCardDefinition['attribute']> => Boolean(attribute));
  const timing = toTiming(card.playTiming?.phase);
  return {
    id: card.id,
    name: card.name,
    cardType: toCardType(card.cardType),
    ...(attributes?.[0] ? { attribute: attributes[0], attributes } : {}),
    ...(typeof card.cardFace?.basePower === 'number' ? { printedValue: card.cardFace.basePower } : {}),
    ...(card.cardFace?.basePower !== undefined && typeof card.cardFace.basePower !== 'number'
      ? { printedValueExpression: String((card.cardFace.basePower as { printedExpression?: unknown }).printedExpression ?? 'X') }
      : {}),
    ...(card.cardFace?.cost !== undefined ? { printedCost: card.cardFace.cost } : {}),
    ...(card.printedText ? { printedText: card.printedText } : {}),
    ...(timing ? { timing } : {}),
    capability: {
      status: 'HOST_ADJUDICATED',
      hostRulingReason: 'Compiled from authoring archive for product playtest display; detailed automation remains in the rules interpreter.',
    },
    source: sourceForArchive(archive, workspaceRoot, imageIndex),
  };
}

function mapDeckCard(cardId: string, copies: number): ServantDefinition['startingDeck']['entries'][number] {
  const lower = cardId.toLowerCase();
  if (lower === 'card.x-pilgrimcall') return { entryType: 'named', attribute: 'special', cardId: 'servant.artoriac.skill.sc-artoriac-4', copies };
  if (lower === 'card.x-pilgrimrespite') return { entryType: 'named', attribute: 'special', cardId: 'servant.artoriac.skill.sc-artoriac-5', copies };
  if (lower === 'card.x-pilgrimdestiny') return { entryType: 'named', attribute: 'special', cardId: 'servant.artoriac.skill.sc-artoriac-6', copies };
  if (lower === 'card.cardluck') return { entryType: 'named', attribute: 'special', cardId: 'basic.luck', copies };
  if (lower === 'card.cardsurveil') return { entryType: 'named', attribute: 'special', cardId: 'basic.surveil', copies };
  if (lower === 'card.cardpreparation') return { entryType: 'named', attribute: 'special', cardId: 'basic.preparation', copies };
  const match = /^card\.card([abq])([1-5])$/.exec(lower);
  if (!match) throw new Error(`Unknown deck entry: ${cardId}`);
  const printedValue = Number(match[2]);
  const attribute = match[1] === 'q' ? 'agility' : match[1] === 'a' ? 'magecraft' : 'strength';
  return { entryType: 'basic', attribute, printedValue, copies };
}

function startingDeckFromAuthoring(archive: AuthoringArchive): ServantDefinition['startingDeck'] {
  const entries = (archive.deck ?? []).map((entry) => mapDeckCard(entry.cardId, entry.count ?? 1));
  const total = entries.reduce((sum, entry) => sum + entry.copies, 0);
  if (total !== 12) throw new Error(`${archive.id} deck must contain exactly 12 cards; found ${total}`);

  const combined = entries.reduce<ServantDefinition['startingDeck']['entries']>((result, entry) => {
    const existing = result.find((candidate) =>
      candidate.entryType === entry.entryType &&
      candidate.attribute === entry.attribute &&
      candidate.printedValue === entry.printedValue &&
      candidate.cardId === entry.cardId,
    );
    if (existing) existing.copies += entry.copies;
    else result.push({ ...entry });
    return result;
  }, []);

  return {
    size: 12,
    entries: combined,
    attributeCounts: computeAttributeCounts(combined),
  };
}

function overviewCardId(archive: AuthoringArchive): string {
  return `${archive.id}.overview`;
}

function convertAuthoringServant(
  archive: AuthoringArchive,
  workspaceRoot: string,
): { servant: ServantDefinition; cards: NamedCardDefinition[] } {
  const skillCardIds = archive.cards
    .filter((card) => card.cardType === 'servant_skill')
    .map((card) => card.id);
  if (skillCardIds.length !== 3) throw new Error(`${archive.id} must define exactly 3 servant skill cards; found ${skillCardIds.length}`);
  const generatedCardIds = archive.cards
    .filter((card) => card.cardType === 'servant_deck_card')
    .map((card) => card.id);
  return {
    servant: {
      id: archive.id,
      name: archive.name,
      classTag: archive.class ?? 'Unknown',
      overviewCardId: overviewCardId(archive),
      startingDeck: startingDeckFromAuthoring(archive),
      skillCardIds: skillCardIds as [string, string, string],
      linkedCards: { generated: generatedCardIds },
      capability: {
        status: 'HOST_ADJUDICATED',
        hostRulingReason: 'Authoring servant converted for seven-player product playtest.',
      },
      source: sourceForArchive(archive, workspaceRoot),
    },
    cards: [
      {
        id: overviewCardId(archive),
        name: archive.name,
        cardType: 'servant_overview',
        capability: { status: 'FULL' },
        source: sourceForArchive(archive, workspaceRoot),
      },
      ...archive.cards.map((card, index) => toNamedCard(card, archive, workspaceRoot, index + 1)),
    ],
  };
}

function convertAuthoringMaster(
  archive: AuthoringArchive,
  workspaceRoot: string,
): { master: MasterDefinition; cards: NamedCardDefinition[] } {
  const skillCardIds = archive.cards
    .filter((card) => card.cardType === 'master_skill')
    .map((card) => card.id);
  const commandSpellCardIds = archive.cards
    .filter((card) => card.cardType === 'command_spell')
    .map((card) => card.id);
  const generatedCardIds = archive.cards
    .filter((card) => card.cardType === 'master_deck_card')
    .map((card) => card.id);
  return {
    master: {
      id: archive.id,
      name: archive.name,
      overviewCardId: overviewCardId(archive),
      initialMana: 4,
      commandSpellCardIds,
      skillCardIds,
      linkedCards: { generated: generatedCardIds },
      ...(generatedCardIds.length
        ? { independentDeck: { entries: generatedCardIds.map((cardId) => ({ cardId, copies: 1 })) } }
        : {}),
      capability: {
        status: 'HOST_ADJUDICATED',
        hostRulingReason: 'Authoring master converted for seven-player product playtest.',
      },
      source: sourceForArchive(archive, workspaceRoot),
    },
    cards: [
      {
        id: overviewCardId(archive),
        name: archive.name,
        cardType: 'master_overview',
        printedText: archive.cards.map((card) => `${card.name}: ${card.printedText ?? ''}`).join('\n'),
        capability: { status: 'FULL' },
        source: sourceForArchive(archive, workspaceRoot),
      },
      ...archive.cards.map((card, index) => toNamedCard(card, archive, workspaceRoot, index + 1)),
    ],
  };
}

export function loadPlaytestContentPack(
  manifestPath: string,
  options: LoaderOptions,
): LoadedPlaytestContentPack {
  const manifest = readJson<PlaytestPackManifest>(manifestPath);
  const authoringServantArchives = (manifest.authoringServantFiles ?? [])
    .map((path) => readWorkspaceJson<AuthoringArchive>(options.workspaceRoot, path));
  const authoringMasterArchives = (manifest.authoringMasterFiles ?? [])
    .map((path) => readWorkspaceJson<AuthoringArchive>(options.workspaceRoot, path));
  const authoringMasterSupportArchives = (manifest.authoringMasterSupportFiles ?? [])
    .map((path) => readWorkspaceJson<AuthoringArchive>(options.workspaceRoot, path));
  const authoringMasterRuleArchives = (manifest.authoringMasterRuleFiles ?? [])
    .map((path) => readWorkspaceJson<AuthoringArchive>(options.workspaceRoot, path));
  authoringServantArchives.forEach(assertNormalAuthoringArchive);
  authoringMasterArchives.forEach(assertNormalAuthoringArchive);
  authoringMasterSupportArchives.forEach(assertMasterSupportArchive);
  authoringMasterRuleArchives.forEach(assertMasterRuleArchive);
  const authoringServants = authoringServantArchives
    .map((archive) => convertAuthoringServant(archive, options.workspaceRoot));
  const authoringMasters = authoringMasterArchives
    .map((archive) => convertAuthoringMaster(archive, options.workspaceRoot));
  const servantCards = manifest.servantCardFiles.flatMap((path) =>
    readWorkspaceJson<NamedCardDefinition[]>(options.workspaceRoot, path),
  );
  const masterCards = manifest.masterCardFiles.flatMap((path) =>
    readWorkspaceJson<NamedCardDefinition[]>(options.workspaceRoot, path),
  );
  const eventCards = manifest.eventCardFiles.map((path) =>
    readWorkspaceJson<NamedCardDefinition>(options.workspaceRoot, path),
  );

  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    manifest,
    authoringArchives: [...authoringMasterArchives, ...authoringServantArchives, ...authoringMasterSupportArchives, ...authoringMasterRuleArchives],
    dictionaries: {
      basicAttacks: readWorkspaceJson<BasicAttackDictionary>(
        options.workspaceRoot,
        manifest.dictionaries.basicAttacks,
      ),
    },
    servants: [
      ...manifest.servantFiles.map((path) =>
        readWorkspaceJson<ServantDefinition>(options.workspaceRoot, path),
      ),
      ...authoringServants.map((entry) => entry.servant),
    ],
    masters: [
      ...manifest.masterFiles.map((path) =>
        readWorkspaceJson<MasterDefinition>(options.workspaceRoot, path),
      ),
      ...authoringMasters.map((entry) => entry.master),
    ],
    eventSets: manifest.eventSetFiles.map((path) =>
      readWorkspaceJson<EventSetDefinition>(options.workspaceRoot, path),
    ),
    eventCards,
    cards: [
      ...servantCards,
      ...masterCards,
      ...authoringServants.flatMap((entry) => entry.cards),
      ...authoringMasters.flatMap((entry) => entry.cards),
      ...eventCards,
    ],
  };
}

function entitySources(pack: LoadedPlaytestContentPack): Array<{
  id: string;
  source: SourceEvidence;
}> {
  return [
    ...pack.servants,
    ...pack.masters,
    ...pack.cards,
    ...pack.eventSets,
  ];
}

function referenceIssue(entityId: string, referenceId: string): PackValidationIssue {
  return {
    code: 'UNRESOLVED_CARD_REFERENCE',
    message: `${entityId} references missing card ${referenceId}`,
    entityId,
    referenceId,
    blocking: true,
  };
}

export function validateLoadedPlaytestPack(
  pack: LoadedPlaytestContentPack,
  options: ValidationOptions,
): PackValidationIssue[] {
  const sourceAssetValidation = options.sourceAssetValidation ?? 'metadata_only';
  const sourceAssetRoot = options.sourceAssetRoot ?? options.workspaceRoot;
  const issues: PackValidationIssue[] = validateContentPack(pack).map((issue) => ({
    ...issue,
    blocking: true,
  }));

  for (const entity of [
    ...pack.servants,
    ...pack.masters,
    ...pack.cards,
    ...pack.eventSets,
  ]) {
    for (const ambiguity of entity.ambiguities ?? []) {
      issues.push({
        code: 'REQUIRES_CONFIRMATION',
        message: `${entity.id} requires confirmation for ${ambiguity.field}: ${ambiguity.description} (source: ${ambiguity.source.imagePath})`,
        entityId: entity.id,
        field: ambiguity.field,
        blocking: false,
      });
    }
  }

  for (const entity of entitySources(pack)) {
    if (!entity.source.reviewedAgainstImage) {
      issues.push({
        code: 'SOURCE_EVIDENCE_REQUIRED',
        message: `${entity.id} requires an explicit source image declaration in authoring content`,
        entityId: entity.id,
        field: 'source.imagePath',
        blocking: true,
      });
      continue;
    }

    if (isAbsolute(entity.source.imagePath)) {
      issues.push({
        code: 'SOURCE_PATH_ABSOLUTE',
        message: `${entity.id} references absolute source image path ${entity.source.imagePath}`,
        entityId: entity.id,
        field: 'source.imagePath',
        blocking: true,
      });
      continue;
    }

    const imageExists = existsSync(resolve(sourceAssetRoot, entity.source.imagePath));
    if (sourceAssetValidation === 'required') {
      if (!imageExists) {
        issues.push({
          code: 'MISSING_IMAGE',
          message: `${entity.id} references missing image ${entity.source.imagePath}`,
          entityId: entity.id,
          field: 'source.imagePath',
          blocking: true,
        });
      }
    } else if (!imageExists) {
      issues.push({
        code: 'SOURCE_ASSET_UNVERIFIED',
        message: `${entity.id} source image was not verified in this checkout: ${entity.source.imagePath}`,
        entityId: entity.id,
        field: 'source.imagePath',
        blocking: false,
      });
    }
  }

  const cardIds = new Set(pack.cards.map((card) => card.id));
  const basicAttackIds = new Set(
    Object.values(pack.dictionaries.basicAttacks).map((entry) => entry.id),
  );
  const availableCardIds = new Set([...cardIds, ...basicAttackIds]);

  const verifyCardReference = (entityId: string, referenceId: string): void => {
    if (!availableCardIds.has(referenceId)) {
      issues.push(referenceIssue(entityId, referenceId));
    }
  };

  for (const servant of pack.servants) {
    verifyCardReference(servant.id, servant.overviewCardId);
    servant.skillCardIds.forEach((id) => verifyCardReference(servant.id, id));
    Object.values(servant.linkedCards).forEach((group) =>
      group?.forEach((id: string) => verifyCardReference(servant.id, id)),
    );
    servant.startingDeck.entries.forEach((entry) => {
      if (entry.entryType === 'named' && entry.cardId) {
        verifyCardReference(servant.id, entry.cardId);
      }
    });
  }

  for (const master of pack.masters) {
    verifyCardReference(master.id, master.overviewCardId);
    [...master.skillCardIds, ...master.commandSpellCardIds].forEach((id) =>
      verifyCardReference(master.id, id),
    );
    Object.values(master.linkedCards).forEach((group) =>
      group?.forEach((id: string) => verifyCardReference(master.id, id)),
    );
    master.independentDeck?.entries.forEach((entry) =>
      verifyCardReference(master.id, entry.cardId),
    );
  }

  for (const eventSet of pack.eventSets) {
    eventSet.cardIds.forEach((id) => verifyCardReference(eventSet.id, id));
  }

  const eventSetIds = new Set(pack.eventSets.map((eventSet) => eventSet.id));
  for (const card of pack.cards) {
    for (const eventSetId of card.relatedEventSetIds ?? []) {
      if (!eventSetIds.has(eventSetId)) {
        issues.push({
          code: 'UNRESOLVED_EVENT_SET_REFERENCE',
          message: `${card.id} references missing event set ${eventSetId}`,
          entityId: card.id,
          referenceId: eventSetId,
          blocking: true,
        });
      }
    }
  }

  return issues;
}

function buildFixture(pack: LoadedPlaytestContentPack): PlaytestFixture {
  const seatCount = Math.min(7, pack.masters.length, pack.servants.length);
  const masterIds = pack.masters.slice(0, seatCount).map((master) => master.id);
  const servantIds = pack.servants.slice(0, seatCount).map((servant) => servant.id);

  return {
    id: `${pack.id}-${seatCount}p`,
    contentPackId: pack.id,
    seats: masterIds.map((masterId, index) => ({
      seat: index + 1,
      playerId: `player-${index + 1}`,
      masterId,
      servantId: servantIds[index]!,
    })),
  };
}

function evidenceRows(
  pack: LoadedPlaytestContentPack,
  issues: PackValidationIssue[],
): EvidenceEntityRow[] {
  const toRow = (
    entity: { id: string; name: string; capability: { status: CapabilityStatus }; source: SourceEvidence },
    entityKind: string,
  ): EvidenceEntityRow => ({
    entityId: entity.id,
    displayName: entity.name,
    entityKind,
    capabilityStatus: entity.capability.status,
    htmPath: entity.source.htmPath,
    imagePath: entity.source.imagePath,
    imageIndex: entity.source.imageIndex,
    reviewedAgainstImage: entity.source.reviewedAgainstImage,
    issueCodes: issues
      .filter((issue) => issue.entityId === entity.id)
      .map((issue) => issue.code)
      .sort(),
  });

  return [
    ...pack.masters.map((entity) => toRow(entity, 'master')),
    ...pack.servants.map((entity) => toRow(entity, 'servant')),
    ...pack.cards.map((entity) => toRow(entity, entity.cardType)),
    ...pack.eventSets.map((entity) => toRow(entity, 'event_set')),
  ].sort((left, right) => left.entityId.localeCompare(right.entityId));
}

function countEventSlots(pack: LoadedPlaytestContentPack): number {
  return pack.eventSets.reduce((total, eventSet) => total + eventSet.cardIds.length, 0);
}

export function buildEvidenceReport(
  pack: LoadedPlaytestContentPack,
  issues: PackValidationIssue[],
): EvidenceReport {
  return {
    schemaVersion: 'fd-playtest-evidence-report-v1',
    packId: pack.id,
    summary: {
      masters: pack.masters.length,
      servants: pack.servants.length,
      events: countEventSlots(pack),
      blockingIssues: issues.filter((issue) => issue.blocking).length,
    },
    entities: evidenceRows(pack, issues),
    issues: structuredClone(issues).sort((left, right) =>
      `${left.entityId ?? ''}:${left.code}`.localeCompare(`${right.entityId ?? ''}:${right.code}`),
    ),
  };
}

export function compileLoadedPlaytestPack(
  pack: LoadedPlaytestContentPack,
  issues: PackValidationIssue[] = [],
): CompiledPlaytestPack {
  const ruleArchives = structuredClone(pack.authoringArchives);
  return {
    library: {
      schemaVersion: 'fd-playtest-content-library-v1',
      pack: { id: pack.id, name: pack.name, version: pack.version },
      dictionaries: structuredClone(pack.dictionaries),
      masters: sortById(pack.masters),
      servants: sortById(pack.servants),
      cards: sortById(pack.cards),
      eventSets: sortById(pack.eventSets),
      rules: {
        schemaVersion: 'fd-card-rule-content-v1',
        definitionHash: definitionHash(ruleArchives),
        archives: ruleArchives,
      },
    },
    fixture: buildFixture(pack),
    evidenceReport: buildEvidenceReport(pack, issues),
  };
}
