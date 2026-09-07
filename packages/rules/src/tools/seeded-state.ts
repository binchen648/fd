import defaultMap from '../data/maps/default-7p-map.json';
import starterPack from '../data/cards/starter-pack.json';
import type { ContentLibraryIndex } from '@fd/content/rules';
import type { CardInstance } from '../schema/card';
import type { GameState, PlayerState } from '../schema/game';
import type { MapDefinition } from '../schema/location';
import { applyContentLibraryToGameState } from './content-bridge';

export interface SeededStateOptions {
  enabledLocationIds?: GameState['locationConfig']['enabledLocationIds'];
  activeSeats?: number[];
  contentLibrary?: ContentLibraryIndex;
}

export function createSeededPlayers(activeSeats?: number[]): PlayerState[] {
  return Array.from({ length: 7 }, (_, index) => {
    const seat = index + 1;
    const isActive = activeSeats ? activeSeats.includes(seat) : true;

    return {
      id: `p${seat}`,
      seat,
      status: isActive ? 'active' : 'eliminated',
      masterCardId: `master-${seat}`,
      servantCardId: `servant-${seat}`,
      vp: 0,
      militaryResult: 0,
      mana: 4,
    };
  });
}

export function createSeededGameState(options?: SeededStateOptions): GameState {
  const players = createSeededPlayers(options?.activeSeats);

  const cards: CardInstance[] = [
    ...starterPack.cards.map((cardDef) => ({
      instanceId: `${cardDef.id}-instance`,
      definitionId: cardDef.id,
      ownerPlayerId: players.find((p) => p.masterCardId === cardDef.id)?.id ?? '',
      controllerPlayerId: players.find((p) => p.masterCardId === cardDef.id)?.id ?? '',
      zone: 'master',
      visibility: { scope: 'public' as const },
    })),
    ...starterPack.servants.map((cardDef) => ({
      instanceId: `${cardDef.id}-instance`,
      definitionId: cardDef.id,
      ownerPlayerId: cardDef.id.startsWith('servant-1')
        ? 'p1'
        : cardDef.id.startsWith('servant-2')
        ? 'p2'
        : cardDef.id.startsWith('servant-3')
        ? 'p3'
        : cardDef.id.startsWith('servant-4')
        ? 'p4'
        : cardDef.id.startsWith('servant-5')
        ? 'p5'
        : cardDef.id.startsWith('servant-6')
        ? 'p6'
        : 'p7',
      controllerPlayerId: cardDef.id.startsWith('servant-1')
        ? 'p1'
        : cardDef.id.startsWith('servant-2')
        ? 'p2'
        : cardDef.id.startsWith('servant-3')
        ? 'p3'
        : cardDef.id.startsWith('servant-4')
        ? 'p4'
        : cardDef.id.startsWith('servant-5')
        ? 'p5'
        : cardDef.id.startsWith('servant-6')
        ? 'p6'
        : 'p7',
      zone: 'hand',
      visibility: { scope: 'owner_only' as const, ownerPlayerId: '' },
    })),
  ];

  const baseState: GameState = {
    id: 'seeded-match-7p',
    players,
    round: {
      roundNumber: 1,
      activePhase: 'round_end',
      prioritySeat: 1,
    },
    map: defaultMap as MapDefinition,
    locationConfig: {
      enabledLocationIds: options?.enabledLocationIds ?? [],
    },
    cards,
    eventPlacements: [],
    battleResults: [],
    effectStack: [],
    log: [],
  };

  if (options?.contentLibrary) {
    return applyContentLibraryToGameState(baseState, options.contentLibrary);
  }

  return baseState;
}

export function createSeededGameStateFromContentLibrary(
  contentLibrary: ContentLibraryIndex,
  options?: Omit<SeededStateOptions, 'contentLibrary'>,
): GameState {
  return createSeededGameState({ ...options, contentLibrary });
}
