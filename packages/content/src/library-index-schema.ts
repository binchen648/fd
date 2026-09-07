import type { GameCard } from './chm-card-types';
export interface ContentLibraryIndex {
  version: string;
  lastUpdated: string;
  stats: {
    totalCards: number;
    bySourceSet: Record<string, number>;
    byNamespace: Record<string, number>;
  };
  cards: Record<string, GameCard>;
}

export const CONTENT_LIBRARY_INDEX_VERSION = '1.0.0';
const SUPPORTED_LIBRARY_INDEX_VERSIONS = new Set([CONTENT_LIBRARY_INDEX_VERSION]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'number');
}

function isGameCard(value: unknown): value is GameCard {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.sourceSet === 'string' &&
    typeof value.namespace === 'string' &&
    typeof value.language === 'string' &&
    typeof value.approvedAt === 'string' &&
    typeof value.guardrailJobId === 'string' &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string') &&
    typeof value.cardType === 'string'
  );
}

function isGameCardRecord(value: unknown): value is Record<string, GameCard> {
  return isRecord(value) && Object.values(value).every((entry) => isGameCard(entry));
}

export function isContentLibraryIndex(value: unknown): value is ContentLibraryIndex {
  if (!isRecord(value)) {
    return false;
  }

  const stats = value.stats;
  if (!isRecord(stats)) {
    return false;
  }

  return (
    typeof value.version === 'string' &&
    SUPPORTED_LIBRARY_INDEX_VERSIONS.has(value.version) &&
    typeof value.lastUpdated === 'string' &&
    !Number.isNaN(Date.parse(value.lastUpdated)) &&
    typeof stats.totalCards === 'number' &&
    isNumberRecord(stats.bySourceSet) &&
    isNumberRecord(stats.byNamespace) &&
    isGameCardRecord(value.cards)
  );
}

export function assertContentLibraryIndex(
  value: unknown,
  label = 'content library index'
): asserts value is ContentLibraryIndex {
  if (!isContentLibraryIndex(value)) {
    throw new Error(`Invalid ${label} structure`);
  }
}

export function cloneContentLibraryIndex(index: ContentLibraryIndex): ContentLibraryIndex {
  return structuredClone(index);
}

export function createEmptyContentLibraryIndex(): ContentLibraryIndex {
  return {
    version: CONTENT_LIBRARY_INDEX_VERSION,
    lastUpdated: new Date().toISOString(),
    stats: {
      totalCards: 0,
      bySourceSet: {},
      byNamespace: {},
    },
    cards: {},
  };
}
