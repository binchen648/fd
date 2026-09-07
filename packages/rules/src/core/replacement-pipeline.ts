import type { EffectStackItem, IdentityReplacementPayload } from "../schema/effect";
import type { GameState } from "../schema/game";

export function applyReplacementEffect(state: GameState, item: EffectStackItem): GameState {
  switch (item.effect.handler) {
    case "swap_master_identity":
      return applyIdentityReplacement(state, item, "master");
    case "swap_servant_identity":
      return applyIdentityReplacement(state, item, "servant");
    default:
      return state;
  }
}

function applyIdentityReplacement(
  state: GameState,
  item: EffectStackItem,
  role: "master" | "servant",
): GameState {
  const payload = readIdentityReplacementPayload(item.effect.payload);

  if (!payload) {
    return state;
  }

  let previousCardId: string | null = null;
  const players = state.players.map((player) => {
    if (player.id !== payload.targetPlayerId) {
      return player;
    }

    previousCardId = role === "master" ? player.masterCardId : player.servantCardId;

    return role === "master"
      ? { ...player, masterCardId: payload.newCardId }
      : { ...player, servantCardId: payload.newCardId };
  });

  if (previousCardId === null) {
    return state;
  }

  const carriedGeneratedCardInstanceIds: string[] = [];
  const cards = state.cards.map((card) => {
    if (card.generatedBy !== previousCardId) {
      return card;
    }

    carriedGeneratedCardInstanceIds.push(card.instanceId);

    return {
      ...card,
      generatedBy: payload.newCardId,
      visibility:
        card.visibility.scope === "owner_only"
          ? {
              ...card.visibility,
              ownerPlayerId: card.ownerPlayerId,
            }
          : card.visibility,
    };
  });

  return {
    ...state,
    players,
    cards,
    log: state.log.concat({
      type: "identity_replaced",
      message: `player:${payload.targetPlayerId}:${role}->${payload.newCardId}`,
      payload: {
        playerId: payload.targetPlayerId,
        role,
        previousCardId,
        newCardId: payload.newCardId,
        effectId: item.effect.id,
        carriedGeneratedCardInstanceIds,
      },
    }),
  };
}

function readIdentityReplacementPayload(
  payload: Record<string, unknown> | undefined,
): IdentityReplacementPayload | null {
  if (!payload) {
    return null;
  }

  const { targetPlayerId, newCardId } = payload;

  if (typeof targetPlayerId !== "string" || typeof newCardId !== "string") {
    return null;
  }

  return {
    targetPlayerId,
    newCardId,
  };
}
