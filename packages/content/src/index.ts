/**
 * CHM Content Library Index
 * Manages approved cards imported from Guardrail validation results.
 */

import type { GameCard } from './chm-card-types';
import { CHM_CONSTRAINTS } from './chm-card-types';
import {
  assertContentLibraryIndex,
  cloneContentLibraryIndex,
  CONTENT_LIBRARY_INDEX_VERSION,
  createEmptyContentLibraryIndex,
  type ContentLibraryIndex,
} from './library-index-schema';

export interface ImportResult {
  imported: number;
  rejected: number;
  errors: Array<{
    cardId: string;
    reason: string;
  }>;
}

export class ContentLibraryManager {
  private index: ContentLibraryIndex;

  constructor(initialIndex?: ContentLibraryIndex) {
    this.index = createEmptyContentLibraryIndex();
    if (initialIndex) {
      this.importIndex(initialIndex);
    }
  }

  importApprovedCards(cards: GameCard[]): ImportResult {
    const result: ImportResult = {
      imported: 0,
      rejected: 0,
      errors: [],
    };

    for (const card of cards) {
      if (this.index.cards[card.id]) {
        result.rejected++;
        result.errors.push({
          cardId: card.id,
          reason: 'Duplicate card ID',
        });
        continue;
      }

      const validationError = this.validateCard(card);
      if (validationError) {
        result.rejected++;
        result.errors.push({
          cardId: card.id,
          reason: validationError,
        });
        continue;
      }

      this.index.cards[card.id] = card;
      result.imported++;
      this.updateStats(card);
    }

    this.index.lastUpdated = new Date().toISOString();
    return result;
  }

  private validateCard(card: GameCard): string | null {
    if (!card.id || !card.name || !card.namespace) {
      return 'Missing required metadata fields';
    }

    switch (card.sourceSet) {
      case 'master':
        if ('initialMana' in card && card.initialMana !== CHM_CONSTRAINTS.master.initialMana) {
          return `Master card initial mana must be ${CHM_CONSTRAINTS.master.initialMana}`;
        }
        if ('commandSpells' in card && card.commandSpells !== CHM_CONSTRAINTS.master.commandSpells) {
          return `Master card command spells must be ${CHM_CONSTRAINTS.master.commandSpells}`;
        }
        break;

      case 'servant':
        if ('attackCardsCount' in card && card.attackCardsCount !== CHM_CONSTRAINTS.servant.attackCardsCount) {
          return `Servant must have exactly ${CHM_CONSTRAINTS.servant.attackCardsCount} attack cards`;
        }
        if ('skillCardsCount' in card && card.skillCardsCount !== CHM_CONSTRAINTS.servant.skillCardsCount) {
          return `Servant must have exactly ${CHM_CONSTRAINTS.servant.skillCardsCount} skill cards`;
        }
        break;

      case 'situation':
        if ('applicableRounds' in card && card.applicableRounds) {
          const climaxRounds = CHM_CONSTRAINTS.situation.climaxRounds;
          if (!climaxRounds.every((round) => card.applicableRounds?.includes(round))) {
            return `Situation climax rounds must be ${climaxRounds.join(', ')}`;
          }
        }
        break;

      case 'event':
        if ('battlefield' in card) {
          const expectedReward =
            card.battlefield === 'deep_mountain'
              ? CHM_CONSTRAINTS.event.deepMountainCompetitionReward
              : CHM_CONSTRAINTS.event.newCapitalCompetitionReward;
          if ('competitionReward' in card && card.competitionReward !== expectedReward) {
            return `Event competition reward for ${card.battlefield} must be ${expectedReward}`;
          }
        }
        break;

      case 'command_spell':
        if ('usage' in card && !CHM_CONSTRAINTS.commandSpell.usageTypes.includes(card.usage)) {
          return 'Invalid command spell usage type';
        }
        break;

      default:
        return 'Unsupported card source set';
    }

    return null;
  }

  private updateStats(card: GameCard): void {
    this.index.stats.totalCards++;
    this.index.stats.bySourceSet[card.sourceSet] =
      (this.index.stats.bySourceSet[card.sourceSet] ?? 0) + 1;
    this.index.stats.byNamespace[card.namespace] =
      (this.index.stats.byNamespace[card.namespace] ?? 0) + 1;
  }

  getCard(id: string): GameCard | null {
    return this.index.cards[id] ?? null;
  }

  getCardsByNamespace(namespace: string): GameCard[] {
    return Object.values(this.index.cards).filter((card) => card.namespace === namespace);
  }

  getCardsBySourceSet(sourceSet: string): GameCard[] {
    return Object.values(this.index.cards).filter((card) => card.sourceSet === sourceSet);
  }

  getStats(): ContentLibraryIndex['stats'] {
    return structuredClone(this.index.stats);
  }

  exportIndex(): ContentLibraryIndex {
    return cloneContentLibraryIndex(this.index);
  }

  importIndex(index: ContentLibraryIndex): void {
    assertContentLibraryIndex(index, 'content library index');
    this.index = cloneContentLibraryIndex(index);
    this.index.version = CONTENT_LIBRARY_INDEX_VERSION;
    this.index.lastUpdated = new Date().toISOString();
  }
}

export * from './chm-card-types';
export * from './guardrail-integration';
export * from './library-index-schema';
export * from './persistence';
export * from './review-draft-schema';
export * from './playtest-content-pack';
export * from './playtest-pack-loader';
