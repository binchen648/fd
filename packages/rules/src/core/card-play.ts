import starterPack from "../data/cards/starter-pack.json";
import type { GameState } from "../schema/game";

import { getLocationById } from "./map-engine";

export interface PlayCardInput {
  playerId: string;
  cardInstanceId: string;
  targetLocationId?: string;
  revealed?: boolean;
}

export interface CardPlayResult {
  nextState: GameState;
  playedCardIds: string[];
}

export interface PlayCardPairInput {
  playerId: string;
  cardInstanceIds: string[];
  revealedCardInstanceIds?: string[];
}

export function playServantCardPair(
  state: GameState,
  input: PlayCardPairInput,
): CardPlayResult {
  if (input.cardInstanceIds.length !== 2) {
    return { nextState: state, playedCardIds: [] };
  }

  const player = state.players.find((entry) => entry.id === input.playerId);
  const location = player?.locationId
    ? getLocationById(state.map, state.locationConfig, player.locationId)
    : undefined;
  const isBattlefield = location?.tags.includes("battlefield") === true;
  const revealedCardInstanceIds = new Set(input.revealedCardInstanceIds ?? []);

  if (isBattlefield && revealedCardInstanceIds.size === 0) {
    return { nextState: state, playedCardIds: [] };
  }

  const cardDefinitions = input.cardInstanceIds
    .map((cardInstanceId) => {
      const instance = state.cards.find((entry) => entry.instanceId === cardInstanceId);
      if (!instance) {
        return undefined;
      }

      return getCardDefinition(instance.definitionId);
    })
    .filter((entry): entry is NonNullable<ReturnType<typeof getCardDefinition>> => entry !== undefined);
  const cardTypes = cardDefinitions.map((entry) => entry.type);
  const totalCost = cardDefinitions.reduce((sum, entry) => sum + (entry.cost ?? 0), 0);

  if (cardDefinitions.length !== input.cardInstanceIds.length) {
    return { nextState: state, playedCardIds: [] };
  }

  if (cardTypes.some((entry) => entry === "servant_skill") && (player?.mana ?? 0) < 8) {
    return { nextState: state, playedCardIds: [] };
  }

  if ((player?.mana ?? 0) < totalCost) {
    return { nextState: state, playedCardIds: [] };
  }

  let nextState = state;
  const playedCardIds: string[] = [];

  for (const cardInstanceId of input.cardInstanceIds) {
    const result = playServantCard(nextState, {
      playerId: input.playerId,
      cardInstanceId,
      revealed: revealedCardInstanceIds.has(cardInstanceId),
    });

    if (result.playedCardIds.length !== 1) {
      return { nextState: state, playedCardIds: [] };
    }

    nextState = result.nextState;
    playedCardIds.push(...result.playedCardIds);
  }

  nextState = {
    ...nextState,
    players: nextState.players.map((entry) =>
      entry.id === input.playerId
        ? { ...entry, mana: entry.mana - totalCost }
        : entry,
    ),
    log: nextState.log.concat(
      {
        type: "mana_spent",
        message: `player:${input.playerId}:mana-${totalCost}`,
        payload: { playerId: input.playerId, amount: totalCost },
      },
      {
        type: "card_played",
        message: `player:${input.playerId}:played_pair:${input.cardInstanceIds.join(",")}`,
      },
    ),
  };

  return {
    nextState,
    playedCardIds,
  };
}

export function playServantCard(
  state: GameState,
  input: PlayCardInput,
): CardPlayResult {
  const { playerId, cardInstanceId, targetLocationId } = input;

  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.status !== "active") {
    return { nextState: state, playedCardIds: [] };
  }

  const card = state.cards.find(
    (c) => c.instanceId === cardInstanceId && c.ownerPlayerId === playerId,
  );
  if (!card || card.zone !== "hand") {
    return { nextState: state, playedCardIds: [] };
  }

  const cardDef = state.cards.find((c) => c.instanceId === cardInstanceId);
  if (!cardDef || cardDef.zone !== "hand") {
    return { nextState: state, playedCardIds: [] };
  }

  const nextState: GameState = {
    ...state,
    cards: state.cards.map((c) =>
      c.instanceId === cardInstanceId
        ? {
            ...c,
            zone: "field",
            controllerPlayerId: playerId,
            visibility: input.revealed
              ? { scope: "public" }
              : { scope: "owner_only", ownerPlayerId: playerId },
          }
        : c,
    ),
    log: state.log.concat({
      type: "card_played",
      message: `player:${playerId}:played:${cardInstanceId}`,
      payload: { targetLocationId },
    }),
  };

  return {
    nextState,
    playedCardIds: [cardInstanceId],
  };
}

export function drawCard(
  state: GameState,
  playerId: string,
  count: number = 1,
): CardPlayResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.status !== "active") {
    return { nextState: state, playedCardIds: [] };
  }

  const deckCards = state.cards.filter(
    (c) => c.zone === "deck" && c.ownerPlayerId === playerId,
  );

  const drawnCards = deckCards.slice(0, count);
  const drawnIds = drawnCards.map((c) => c.instanceId);

  const nextState: GameState = {
    ...state,
    cards: state.cards.map((c) =>
      drawnIds.includes(c.instanceId) ? { ...c, zone: "hand" as const } : c,
    ),
    log: state.log.concat({
      type: "draw",
      message: `player:${playerId}:drew:${count}`,
    }),
  };

  return {
    nextState,
    playedCardIds: drawnIds,
  };
}

function getCardDefinition(definitionId: string) {
  return starterPack.servants.find((entry) => entry.id === definitionId);
}
