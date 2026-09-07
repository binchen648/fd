import type { GameState as RulesGameState, VisibilityState as RulesVisibilityState } from '@fd/rules/client';

import type { CombatModifierRule, EventPlacementState, GameState, LocationId } from '../types/props';

export function deriveClientGameState(state: RulesGameState): GameState {
  return {
    id: state.id,
    players: state.players.map((player) => ({
      id: player.id,
      seat: player.seat,
      status: player.status,
      masterCardId: player.masterCardId,
      servantCardId: player.servantCardId,
      locationId: player.locationId,
      vp: player.vp,
      militaryResult: player.militaryResult,
      mana: player.mana,
      eliminationOrder: player.eliminationOrder,
    })),
    round: {
      roundNumber: state.round.roundNumber,
      activePhase: state.round.activePhase,
      prioritySeat: state.round.prioritySeat,
    },
    map: {
      id: state.map.id,
      playerCount: state.map.playerCount,
      locations: state.map.locations.map((location) => ({
        id: location.id,
        displayName: location.displayName,
        enabledByDefault: location.enabledByDefault,
        optional: location.optional,
        occupancyMode: location.occupancyMode,
        occupancyLimit: location.occupancyLimit,
        eventPolicy: location.eventPolicy,
        customEventCardIds: location.customEventCardIds,
        movementLinks: location.movementLinks,
        tags: location.tags,
        rewardHooks: location.rewardHooks ?? [],
        visibilityHooks: location.visibilityHooks ?? [],
      })),
    },
    locationConfig: {
      enabledLocationIds: state.locationConfig.enabledLocationIds,
    },
    cards: state.cards.map((card) => ({
      id: card.instanceId,
      name: card.definitionId,
      cardType: card.zone,
      visibility: mapVisibility(card.visibility),
      revealed: card.visibility.scope === 'public',
    })),
    currentSituationCardId: state.currentSituationCardId,
    currentSituationModifiers: state.currentSituationModifiers?.map(mapCombatModifierRule),
    eventPlacements: state.eventPlacements.map(mapEventPlacement),
    contentRuntime: state.contentRuntime
      ? {
          situations: state.contentRuntime.situations.map((situation) => ({
            round: situation.round,
            cardId: situation.cardId,
            sharedManaReward: situation.sharedManaReward,
            ...(situation.battleModifiers?.length ? { modifiers: situation.battleModifiers.map(mapCombatModifierRule) } : {}),
            ...(situation.notes?.length ? { notes: [...situation.notes] } : {}),
          })),
          eventDraws: state.contentRuntime.eventDraws.map((eventDraw) => ({
            round: eventDraw.round,
            locationId: eventDraw.locationId,
            eventCardId: eventDraw.eventCardId,
            ...(eventDraw.battleModifiers?.length ? { modifiers: eventDraw.battleModifiers.map(mapCombatModifierRule) } : {}),
            ...(eventDraw.notes?.length ? { notes: [...eventDraw.notes] } : {}),
          })),
        }
      : undefined,
    battleResults: state.battleResults.map((result) => ({
      battlefieldId: result.battlefieldId,
      winnerPlayerIds: result.winnerPlayerIds ?? (result.winnerPlayerId ? [result.winnerPlayerId] : []),
      tied: result.tied ?? ((result.winnerPlayerIds?.length ?? (result.winnerPlayerId ? 1 : 0)) > 1),
      winnerPlayerId: result.winnerPlayerId,
      margin: result.margin,
      vpReward: result.vpReward,
    })),
    scoringBreakdown: state.scoringBreakdown?.map((entry) => ({
      playerId: entry.playerId,
      vpDelta: entry.vpDelta,
      militaryDelta: entry.militaryDelta,
      eliminated: entry.eliminated,
      eliminationOrder: entry.eliminationOrder,
    })),
    effectStack: state.effectStack.map((item, index) => ({
      id: item.effect.id,
      sourcePlayerId: item.controllerPlayerId,
      effectType: item.effect.handler,
      triggeredAt: index,
      resolved: false,
    })),
    log: state.log.map((entry, index) => ({
      type: entry.type,
      message: entry.message,
      payload: entry.payload,
      timestamp: index,
    })),
  };
}

export function deriveLocationOccupancy(state: Pick<RulesGameState, 'map'> & Pick<RulesGameState, 'players'>): Record<LocationId, string[]> {
  const occupancy: Record<LocationId, string[]> = {
    miyama_town: [],
    shinto: [],
    magic_workshop: [],
    recon: [],
    moon_holy_grail: [],
  };

  for (const player of state.players) {
    if (player.status !== 'active' || !player.locationId) {
      continue;
    }

    if (player.locationId in occupancy) {
      occupancy[player.locationId as LocationId].push(player.id);
    }
  }

  return occupancy;
}

function mapEventPlacement(placement: RulesGameState['eventPlacements'][number]): EventPlacementState {
  return {
    locationId: placement.locationId,
    eventCardId: placement.eventCardId,
    visibility: mapVisibility(placement.visibility),
    battleModifiers: placement.battleModifiers?.map(mapCombatModifierRule),
  };
}

function mapCombatModifierRule(rule: NonNullable<RulesGameState['currentSituationModifiers']>[number]): CombatModifierRule {
  return {
    source: rule.sourceId,
    targetTag: rule.targetTag,
    value: rule.value,
  };
}

function mapVisibility(visibility: RulesVisibilityState): EventPlacementState['visibility'] {
  switch (visibility.scope) {
    case 'public':
      return 'public';
    case 'owner_only':
      return 'owner_only';
    default:
      return 'hidden';
  }
}
