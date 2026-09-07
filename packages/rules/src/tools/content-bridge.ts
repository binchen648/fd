import { CHM_CONSTRAINTS, type ContentLibraryIndex, type EventCard, type GameCard, type SituationCard } from '@fd/content/rules';
import type { CardInstance } from '../schema/card';
import type { CombatModifierRule } from '../schema/effect';
import type {
  GameState,
  PlayerState,
  ScheduledEventDrawState,
  ScheduledSituationState,
} from '../schema/game';
import type { LocationId } from '../schema/location';

const SERVANT_CARD_TYPE_PRIORITY: Record<string, number> = {
  servant_overview: 0,
  servant_attack: 1,
  servant_skill: 2,
};

const EVENT_LOCATION_BY_BATTLEFIELD: Record<EventCard['battlefield'], LocationId> = {
  deep_mountain: 'miyama_town',
  new_capital: 'shinto',
};

function sortCards(cards: GameCard[]): GameCard[] {
  return [...cards].sort((left, right) => left.id.localeCompare(right.id));
}

function pickMasterCards(cards: GameCard[]): GameCard[] {
  return sortCards(cards.filter((card) => card.cardType === 'master_identity'));
}

function pickServantCards(cards: GameCard[]): GameCard[] {
  return [...cards]
    .filter((card) => card.sourceSet === 'servant')
    .sort((left, right) => {
      const leftPriority = SERVANT_CARD_TYPE_PRIORITY[left.cardType] ?? 99;
      const rightPriority = SERVANT_CARD_TYPE_PRIORITY[right.cardType] ?? 99;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return left.id.localeCompare(right.id);
    });
}

function pickSituationCards(cards: GameCard[]): SituationCard[] {
  return cards
    .filter((card): card is SituationCard => card.cardType === 'situation')
    .sort((left, right) => {
      if (left.situationType !== right.situationType) {
        return left.situationType === 'regular' ? -1 : 1;
      }
      return left.id.localeCompare(right.id);
    });
}

function pickEventCards(cards: GameCard[]): EventCard[] {
  return cards
    .filter((card): card is EventCard => card.cardType === 'event')
    .sort((left, right) => left.id.localeCompare(right.id));
}

function zoneForCard(card: GameCard): CardInstance['zone'] {
  switch (card.cardType) {
    case 'master_identity':
      return 'master';
    case 'master_skill':
      return 'master_spell';
    case 'command_spell':
      return 'command_spell';
    case 'event':
      return 'event_deck';
    case 'situation':
      return 'situation_deck';
    case 'servant_attack':
      return 'field';
    case 'servant_skill':
      return 'hand';
    default:
      return 'hand';
  }
}

function visibilityForCard(card: GameCard, ownerPlayerId: string): CardInstance['visibility'] {
  switch (card.cardType) {
    case 'master_identity':
    case 'master_skill':
      return { scope: 'public' };
    case 'event':
    case 'situation':
      return { scope: 'hidden_until_trigger' };
    case 'servant_attack':
    case 'servant_skill':
      return { scope: 'owner_only', ownerPlayerId };
    default:
      return { scope: 'owner_only', ownerPlayerId };
  }
}

function assignPlayers(basePlayers: PlayerState[], libraryCards: GameCard[]): PlayerState[] {
  const masterCards = pickMasterCards(libraryCards);
  const servantCards = pickServantCards(libraryCards);

  return basePlayers.map((player, index) => ({
    ...player,
    masterCardId: masterCards[index]?.id ?? player.masterCardId,
    servantCardId: servantCards[index]?.id ?? player.servantCardId,
  }));
}

function buildCardInstances(players: PlayerState[], libraryCards: GameCard[]): CardInstance[] {
  const playerIds = players.map((player) => player.id);
  const playerCount = playerIds.length;
  const ownerByCardId = new Map<string, string>();

  for (const player of players) {
    ownerByCardId.set(player.masterCardId, player.id);
    ownerByCardId.set(player.servantCardId, player.id);
  }

  return sortCards(libraryCards).map((card, index) => {
    const fallbackOwnerPlayerId = playerIds[index % playerCount] ?? 'system';
    const ownerPlayerId = ownerByCardId.get(card.id) ?? fallbackOwnerPlayerId;

    return {
      instanceId: `${card.id}-instance`,
      definitionId: card.id,
      ownerPlayerId,
      controllerPlayerId: ownerPlayerId,
      zone: zoneForCard(card),
      visibility: visibilityForCard(card, ownerPlayerId),
    };
  });
}

function normalizeRounds(rounds: number[] | undefined): number[] {
  if (!rounds?.length) {
    return [];
  }

  return [...new Set(rounds)]
    .filter((round) => Number.isInteger(round) && round >= 1 && round <= CHM_CONSTRAINTS.general.totalRounds)
    .sort((left, right) => left - right);
}

function parseModifierDirective(sourceId: string, value: string): CombatModifierRule | null {
  const match = /^modifier:([a-z_]+):([+-]?\d+)$/i.exec(value.trim());
  if (!match) {
    return null;
  }

  const targetTag = match[1]?.trim().toLowerCase();
  const parsedValue = Number(match[2]);
  if (!targetTag || Number.isNaN(parsedValue)) {
    return null;
  }

  return {
    sourceId,
    targetTag,
    value: parsedValue,
  };
}

function extractSemanticContent(sourceId: string, entries: string[] | undefined): {
  modifiers: CombatModifierRule[];
  notes: string[];
} {
  const modifiers: CombatModifierRule[] = [];
  const notes: string[] = [];

  for (const entry of entries ?? []) {
    const modifier = parseModifierDirective(sourceId, entry);
    if (modifier) {
      modifiers.push(modifier);
      continue;
    }

    const note = entry.trim();
    if (note) {
      notes.push(note);
    }
  }

  return { modifiers, notes };
}

function buildSituationSchedule(cards: GameCard[]): ScheduledSituationState[] {
  const scheduledSituations: ScheduledSituationState[] = [];
  const fallbackRegularRounds = Array.from({ length: 8 }, (_, index) => index + 2);
  const fallbackClimaxRounds = [...CHM_CONSTRAINTS.situation.climaxRounds];

  for (const card of pickSituationCards(cards)) {
    const rounds = normalizeRounds(card.applicableRounds);
    const semantics = extractSemanticContent(card.id, card.specialNames);
    const effectiveRounds = rounds.length
      ? rounds
      : [
          card.situationType === 'climax'
            ? fallbackClimaxRounds.shift() ?? CHM_CONSTRAINTS.situation.climaxRounds[CHM_CONSTRAINTS.situation.climaxRounds.length - 1] ?? CHM_CONSTRAINTS.general.totalRounds
            : fallbackRegularRounds.shift() ?? 1,
        ];

    for (const round of effectiveRounds) {
      scheduledSituations.push({
        round,
        cardId: card.id,
        sharedManaReward: card.manaGrantToAll,
        ...(card.hasPersistentEffect && semantics.modifiers.length ? { battleModifiers: semantics.modifiers } : {}),
        ...(semantics.notes.length ? { notes: semantics.notes } : {}),
      });
    }
  }

  return scheduledSituations.sort((left, right) => {
    if (left.round !== right.round) {
      return left.round - right.round;
    }
    return left.cardId.localeCompare(right.cardId);
  });
}

function buildEventSchedule(cards: GameCard[]): ScheduledEventDrawState[] {
  return pickEventCards(cards)
    .map((card) => {
      const semantics = extractSemanticContent(card.id, card.specialRules);
      return {
        round: 2,
        locationId: EVENT_LOCATION_BY_BATTLEFIELD[card.battlefield],
        eventCardId: card.id,
        ...(semantics.modifiers.length ? { battleModifiers: semantics.modifiers } : {}),
        ...(semantics.notes.length ? { notes: semantics.notes } : {}),
      };
    })
    .sort((left, right) => {
      if (left.round !== right.round) {
        return left.round - right.round;
      }
      if (left.locationId !== right.locationId) {
        return left.locationId.localeCompare(right.locationId);
      }
      return left.eventCardId.localeCompare(right.eventCardId);
    });
}

export function applyContentLibraryToGameState(
  baseState: GameState,
  contentLibrary: ContentLibraryIndex,
): GameState {
  const libraryCards = Object.values(contentLibrary.cards);
  if (libraryCards.length === 0) {
    return baseState;
  }

  const players = assignPlayers(baseState.players, libraryCards);
  const cards = buildCardInstances(players, libraryCards);
  const situations = buildSituationSchedule(libraryCards);
  const eventDraws = buildEventSchedule(libraryCards);

  return {
    ...baseState,
    id: `${baseState.id}-content`,
    players,
    cards,
    ...(situations.length || eventDraws.length
      ? {
          contentRuntime: {
            situations,
            eventDraws,
          },
        }
      : {}),
    log: baseState.log.concat({
      type: 'content_library_loaded',
      message: `content-library:${contentLibrary.stats.totalCards}:cards-loaded`,
      payload: {
        totalCards: contentLibrary.stats.totalCards,
        version: contentLibrary.version,
      },
    }),
  };
}
