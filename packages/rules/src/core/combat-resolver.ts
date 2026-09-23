import starterPack from "../data/cards/starter-pack.json";
import type {
  BattleModifierBreakdown,
  BattleModifierPayload,
  BattleParticipantBreakdown,
  ExternalSkillEffect,
  GameState,
  VpAdjustment,
} from "../schema/game";
import type { CombatModifierRule } from "../schema/effect";
import type { LocationDefinition } from "../schema/location";
import type { VisibilityState } from "../schema/visibility";
import type { ResolverResult } from "./resolver-contracts";
import { getLocationById } from "./map-engine";
import { calculateCardPower, classifyCardPlay, processAbilityEvent } from '../ability/interpreter';
import { isAcceptedRoundActiveAttackPaidCostCombatPowerAbility, isAcceptedStaticCombatRewardDistributionAbility } from '../ability/loader';
import { roundTotalPowerAdjustment } from '../ability/outer-god-life';
import { clearTransientCardTransformState, getEffectiveCardAttributes } from '../ability/card-instance-state';
import { logicalDayForPlayer } from './rule-overrides';
import { situationBenefitsSuppressedForPlayer } from '../ability/next-round-situation-benefit-suppression';
import { controllerHasActiveDefeatIgnore } from '../ability/batch-passive-card-rules';
import { b02LowestVictoryCombatPowerAdjustment } from '../ability/batch-owned-passive-rules';
import { assignedTerrainSlotIndex, currentDeploymentBonus, hasRemoteOperationBonus, terrainBonusAt } from './terrain-advantage';

export interface CombatParticipantInput {
  playerId: string;
  totalPower: number;
  attackTags?: string[];
  externalSkillEffects?: ExternalSkillEffect[];
  terrainSlotIndex?: number;
}

export interface CombatResolutionInput {
  battlefieldId: "miyama_town" | "shinto" | "magic_workshop" | "recon" | "moon_holy_grail";
  revealHiddenEvents?: boolean;
  participants?: CombatParticipantInput[];
}

function getPrintedEventVpTotal(state: GameState, battlefieldId: CombatResolutionInput["battlefieldId"]): number {
  return state.eventPlacements
    .filter((placement) => placement.locationId === battlefieldId)
    .reduce((sum, placement) => sum + (placement.victoryPoints ?? 0), 0);
}
function getBattleVpReward(
  state: GameState,
  battlefieldId: CombatResolutionInput["battlefieldId"],
  location: LocationDefinition | undefined,
): number {
  const eventVp = getPrintedEventVpTotal(state, battlefieldId);
  if (eventVp) return eventVp;
  return location?.vpRewardRules?.battle ?? (battlefieldId === "moon_holy_grail" ? 2 : 1);
}

function createModifierBreakdown(
  source: BattleModifierBreakdown["source"],
  rule: CombatModifierRule,
): BattleModifierBreakdown {
  const payload: BattleModifierPayload = {
    kind: "modifier",
    sourceType: source,
    sourceId: rule.sourceId,
    targetTag: rule.targetTag,
  };

  return {
    source,
    label: `${rule.sourceId}.${rule.targetTag}`,
    value: rule.value,
    payload,
  };
}

function createTerrainBreakdown(
  battlefieldId: CombatResolutionInput["battlefieldId"],
  terrainSlotIndex: number,
  value: number,
): BattleModifierBreakdown {
  return {
    source: "location",
    label: `${battlefieldId}.terrain_${terrainSlotIndex + 1}`,
    value,
    payload: {
      kind: "modifier",
      sourceType: "location",
      sourceId: `${battlefieldId}.terrain.${terrainSlotIndex + 1}`,
      targetTag: "terrain",
    },
  };
}

function getRuleBreakdowns(
  source: BattleModifierBreakdown["source"],
  rules: CombatModifierRule[] | undefined,
  participant: CombatParticipantInput,
): BattleModifierBreakdown[] {
  if (!rules?.length || !participant.attackTags?.length) {
    return [];
  }

  return rules
    .filter((rule) => {
      const attackTags = participant.attackTags ?? [];
      if (rule.condition === "lacks_attribute") return !attackTags.includes(rule.targetTag);
      if (rule.condition === "has_repeated_attribute") {
        return attackTags.some((tag, index) => attackTags.indexOf(tag) !== index);
      }
      return attackTags.includes(rule.targetTag);
    })
    .map((rule) => createModifierBreakdown(source, rule));
}

function getSituationBreakdowns(
  state: GameState,
  participant: CombatParticipantInput,
): BattleModifierBreakdown[] {
  if (situationBenefitsSuppressedForPlayer(state, participant.playerId)) return [];
  return getRuleBreakdowns("situation", state.currentSituationModifiers, participant);
}

function getEventBreakdowns(
  state: GameState,
  battlefieldId: CombatResolutionInput["battlefieldId"],
  participant: CombatParticipantInput,
): BattleModifierBreakdown[] {
  const placements = state.eventPlacements.filter((placement) => placement.locationId === battlefieldId);

  const modifiers: BattleModifierBreakdown[] = [];
  for (const placement of placements) {
    modifiers.push(...getRuleBreakdowns("event", placement.battleModifiers, participant));
  }

  return modifiers;
}

function getLocationBreakdowns(
  state: GameState,
  battlefieldId: CombatResolutionInput["battlefieldId"],
  participant: CombatParticipantInput,
): BattleModifierBreakdown[] {
  const location = getLocationById(state.map, state.locationConfig, battlefieldId);

  if (!location) {
    return [];
  }

  return getRuleBreakdowns("location", location.battleModifiers, participant);
}

function getExternalSkillBreakdowns(
  participant: CombatParticipantInput,
): BattleModifierBreakdown[] {
  if (!participant.attackTags?.length || !participant.externalSkillEffects?.length) {
    return [];
  }

  return participant.externalSkillEffects.flatMap((effect) =>
    (effect.combatModifiers ?? [])
      .filter((rule) => participant.attackTags?.includes(rule.targetTag))
      .map((rule) => createModifierBreakdown("skill", rule)),
  );
}

function getTerrainBreakdowns(
  state: GameState,
  battlefieldId: CombatResolutionInput["battlefieldId"],
  participant: CombatParticipantInput,
): BattleModifierBreakdown[] {
  if (participant.terrainSlotIndex === undefined) {
    const value = currentDeploymentBonus(state, participant.playerId);
    if (value === 0) return [];
    return [{
      source: 'skill', label: 'f4_b03_deployment_advantage', value,
      payload: { kind: 'modifier', sourceType: 'skill', sourceId: 'f4_b03_deployment_advantage', targetTag: 'terrain' },
    }];
  }
  const value = terrainBonusAt(state, battlefieldId, participant.playerId, participant.terrainSlotIndex);
  if (value === undefined) {
    return [];
  }

  return [createTerrainBreakdown(battlefieldId, participant.terrainSlotIndex, value)];
}

function modeState(state: GameState): Record<string, unknown> {
  return (state as unknown as { modeState?: Record<string, unknown> }).modeState ?? {};
}

function cannotWinBattleThisRound(state: GameState, playerId: string): boolean {
  const statuses = (state as unknown as { activeStatuses?: Array<Record<string, unknown>> }).activeStatuses ?? [];
  return statuses.some((status) =>
    status.id === "maiya_cannot_win_battle_this_round" &&
    status.sourceControllerId === playerId);
}

function hasActiveBasicCardAtBattlefield(
  state: GameState,
  playerId: string,
  battlefieldId: CombatResolutionInput["battlefieldId"],
  definitionId: string,
): boolean {
  return state.cards.some((card) =>
    card.controllerPlayerId === playerId &&
    card.definitionId === definitionId &&
    card.zone === "attack_area" &&
    state.players.some((player) => player.id === playerId && player.locationId === battlefieldId) &&
    state.abilityRuntime?.cardState[card.instanceId]?.active === true &&
    state.abilityRuntime.cardState[card.instanceId]?.faceDown !== true);
}

function ignoresBattleLossEffects(state: GameState, playerId: string, battlefieldId: CombatResolutionInput["battlefieldId"]): boolean {
  return hasActiveBasicCardAtBattlefield(state, playerId, battlefieldId, "basic.luck") ||
    controllerHasActiveDefeatIgnore(state, playerId);
}

function returnSilenceSources(state: GameState): Array<{ sourceCardId: string; playerId: string }> {
  const runtime = state.abilityRuntime;
  if (!runtime) return [];
  return (runtime.transformedReturnSilenceSourceCardIds ?? []).flatMap((sourceCardId) => {
    const card = state.cards.find((candidate) => candidate.instanceId === sourceCardId);
    const sourceState = runtime.cardState[sourceCardId];
    if (!card || !["field", "attack_area"].includes(card.zone) || sourceState?.active !== true || sourceState.faceDown) return [];
    const hasReturnSilenceSemantic = runtime.pack.cards[card.definitionId]?.abilities.some((ability) =>
      ability.effects.some((effect) => effect.type === "return_silence_battle_start"));
    return hasReturnSilenceSemantic ? [{ sourceCardId, playerId: card.controllerPlayerId }] : [];
  });
}

function isLegacyCombatCard(state: GameState, card: GameState["cards"][number]): boolean {
  if (card.zone !== "field") return false;
  const legacyDefinition = starterPack.servants.find((entry) => entry.id === card.definitionId);
  if (legacyDefinition) return legacyDefinition.type === "servant_attack";
  return isAuthoredLegacyAttack(state, card);
}

function isAuthoredLegacyAttack(state: GameState, card: GameState["cards"][number]): boolean {
  const definition = state.abilityRuntime?.pack.cards[card.definitionId];
  if (!definition) return false;
  const attributes = definition.cardFace.attributes;
  const hasPowerFormula = typeof definition.cardFace.basePower === "object" && definition.cardFace.basePower !== null;
  return ["servant_deck_card", "servant_attack", "basic_attack", "master_deck_card"].includes(definition.cardType) ||
    ((Number(definition.cardFace.basePower ?? 0) > 0 || hasPowerFormula) && Array.isArray(attributes) && attributes.length > 0);
}

function isCombatCardZone(state: GameState, card: GameState["cards"][number]): boolean {
  return card.zone === "attack_area" || isLegacyCombatCard(state, card);
}

function reverseSituationAndEventIfNeeded(
  state: GameState,
  battlefieldId: CombatResolutionInput["battlefieldId"],
  participant: CombatParticipantInput,
  breakdowns: BattleModifierBreakdown[],
): BattleModifierBreakdown[] {
  const entries = modeState(state).reversedModifierLocations;
  if (!Array.isArray(entries)) return breakdowns;
  const reversed = entries.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const candidate = entry as { locationId?: string; exemptPlayers?: string[] };
    return candidate.locationId === battlefieldId && !candidate.exemptPlayers?.includes(participant.playerId);
  });
  if (!reversed) return breakdowns;
  return breakdowns.map((breakdown) => {
    if (breakdown.source !== "event" && breakdown.source !== "situation") return breakdown;
    return {
      ...breakdown,
      value: -breakdown.value,
      label: `${breakdown.label}.reversed`,
    };
  });
}

function buildParticipantBreakdown(
  state: GameState,
  battlefieldId: CombatResolutionInput["battlefieldId"],
  participant: CombatParticipantInput,
): BattleParticipantBreakdown {
  const modifiers = getSituationBreakdowns(state, participant)
    .concat(getEventBreakdowns(state, battlefieldId, participant))
    .concat(getLocationBreakdowns(state, battlefieldId, participant))
    .concat(getExternalSkillBreakdowns(participant))
    .concat(getTerrainBreakdowns(state, battlefieldId, participant));
  const resolvedModifiers = reverseSituationAndEventIfNeeded(state, battlefieldId, participant, modifiers);
  const totalModifier = resolvedModifiers.reduce((sum, modifier) => sum + modifier.value, 0);

  return {
    playerId: participant.playerId,
    basePower: participant.totalPower,
    totalModifier,
    effectivePower: participant.totalPower + totalModifier,
    modifiers: resolvedModifiers,
  };
}

export function deriveBattleParticipantsFromState(
  state: GameState,
  battlefieldId: CombatResolutionInput["battlefieldId"],
): CombatParticipantInput[] {
  return state.players
    .filter((player) => player.status === "active" && player.locationId === battlefieldId)
    .map((player) => {
      const publicAttackCards = state.cards.filter((card) => {
        if (card.controllerPlayerId !== player.id || !isCombatCardZone(state, card)) {
          return false;
        }

        if (card.visibility.scope !== "public") {
          return false;
        }

        const definition = starterPack.servants.find((entry) => entry.id === card.definitionId);
        return definition?.type === "servant_attack";
      });

      const definitions = publicAttackCards
        .map((card) => starterPack.servants.find((entry) => entry.id === card.definitionId))
        .filter((entry): entry is NonNullable<typeof starterPack.servants[number]> => entry !== undefined);

      const publicSkillEffects = state.cards
        .filter((card) => {
          if (card.controllerPlayerId !== player.id || card.zone !== "field") {
            return false;
          }

          if (card.visibility.scope !== "public") {
            return false;
          }

          const definition = starterPack.servants.find((entry) => entry.id === card.definitionId);
          return definition?.type === "servant_skill";
        })
        .map((card) => {
          const definition = starterPack.servants.find((entry) => entry.id === card.definitionId);
          return {
            sourceCardDefinitionId: card.definitionId,
            ownerPlayerId: player.id,
            skillId: card.definitionId,
            ...(definition?.combatModifiers ? { combatModifiers: definition.combatModifiers } : {}),
          };
        });
      const temporaryBattleSkillEffects = (state.battleSkillEffects ?? []).filter(
        (effect) => effect.ownerPlayerId === player.id,
      );
      const externalSkillEffects = publicSkillEffects.concat(temporaryBattleSkillEffects);
      const authoredAttacks = state.abilityRuntime ? state.cards.filter(card =>
        card.controllerPlayerId === player.id && isCombatCardZone(state, card) &&
        state.abilityRuntime!.cardState[card.instanceId]?.active &&
        state.abilityRuntime!.pack.cards[card.definitionId]) : [];
      const authoredPower = authoredAttacks.reduce((sum, card) => sum + calculateCardPower(state, card.instanceId).value, 0);

      const terrainSlotIndex = assignedTerrainSlotIndex(state, battlefieldId, player.id);
      let persistentPowerAdjustment = roundTotalPowerAdjustment(state, player.id);
      persistentPowerAdjustment += roundActiveAttackPaidCostCombatPowerAdjustment(state, battlefieldId, player.id);
      persistentPowerAdjustment += b02LowestVictoryCombatPowerAdjustment(state, player.id);
      if (logicalDayForPlayer(state, player.id) === 1) {
        persistentPowerAdjustment += state.ruleOverrides?.firstLogicalDayTotalPowerAdjustmentByPlayer?.[player.id] ?? 0;
      }
      const lowerVpAdjustment = state.ruleOverrides?.lowerVpBattleTotalPowerAdjustmentByPlayer?.[player.id];
      if (typeof lowerVpAdjustment === 'number' && state.players.some((other) =>
        other.id !== player.id && other.status === 'active' && other.locationId === battlefieldId && other.vp < player.vp)) {
        persistentPowerAdjustment += lowerVpAdjustment;
      }
      const participant = {
        playerId: player.id,
        totalPower: definitions.filter(entry => !state.abilityRuntime?.pack.cards[entry.id]).reduce((sum, entry) => sum + (entry.basePower ?? 0), 0) + authoredPower + persistentPowerAdjustment,
        attackTags: definitions.flatMap((entry) => entry.tags).concat(authoredAttacks.flatMap(card =>
          getEffectiveCardAttributes(state, card.instanceId))),
        externalSkillEffects,
      };
      return terrainSlotIndex === undefined ? participant : { ...participant, terrainSlotIndex };
    });
}

function buildDefaultVpAdjustments(
  location: LocationDefinition | undefined,
  battlefieldId: CombatResolutionInput["battlefieldId"],
  winnerPlayerIds: string[],
  competitionVpPerWinner: number,
  locationVpPerWinner: number,
): VpAdjustment[] | undefined {
  if (!location || winnerPlayerIds.length === 0) {
    return undefined;
  }

  const adjustments: VpAdjustment[] = [];
  const hooks = new Set(location.rewardHooks);

  if (competitionVpPerWinner > 0 && hooks.has("competition_rewards")) {
    for (const playerId of winnerPlayerIds) {
      adjustments.push({
        playerId,
        delta: competitionVpPerWinner,
        source: "competition_vp",
        label: `${battlefieldId}.competition`,
      });
    }
  }

  if (locationVpPerWinner > 0 && hooks.has("location_rewards")) {
    for (const playerId of winnerPlayerIds) {
      adjustments.push({
        playerId,
        delta: locationVpPerWinner,
        source: "location_vp",
        label: `${battlefieldId}.location`,
      });
    }
  }

  return adjustments.length > 0 ? adjustments : undefined;
}

function splitVpPoolPerWinner(pool: number, winnerCount: number): number {
  return winnerCount > 0 && pool > 0 ? Math.ceil(pool / winnerCount) : 0;
}

function currentRoundActiveAttackPaidCost(state: GameState, playerId: string): { hasAttack: boolean; total: number } {
  const runtime = state.abilityRuntime;
  if (!runtime) return { hasAttack: false, total: 0 };
  let hasAttack = false;
  let total = 0;
  for (const attack of state.cards) {
    if (attack.controllerPlayerId !== playerId || attack.zone !== 'attack_area') continue;
    const sourceState = runtime.cardState[attack.instanceId];
    if (!sourceState || sourceState.active !== true || sourceState.faceDown === true || sourceState.playedRound !== state.round.roundNumber) continue;
    const definition = runtime.pack.cards[attack.definitionId];
    const playClassification = classifyCardPlay(definition);
    if (!definition || playClassification.playKind !== 'attack' || playClassification.destinationZone !== 'attack_area') continue;
    const paid = sourceState.paidManaOnPlay;
    if (!Number.isSafeInteger(paid) || paid! < 0) continue;
    hasAttack = true;
    total += paid!;
  }
  return { hasAttack, total };
}

function roundActiveAttackPaidCostCombatPowerAdjustment(state: GameState, battlefieldId: string, playerId: string): number {
  const runtime = state.abilityRuntime;
  if (!runtime) return 0;
  const battlefieldPlayers = state.players.filter((candidate) => candidate.status === 'active' && candidate.locationId === battlefieldId);
  if (!battlefieldPlayers.some((candidate) => candidate.id === playerId)) return 0;
  const paid = battlefieldPlayers.map((candidate) => ({ playerId: candidate.id, ...currentRoundActiveAttackPaidCost(state, candidate.id) }))
    .filter((entry) => entry.hasAttack);
  if (!paid.length) return 0;
  const highest = Math.max(...paid.map((entry) => entry.total));
  if (!paid.some((entry) => entry.playerId === playerId && entry.total === highest)) return 0;
  const sources = state.cards.filter((source) => {
    if (source.ownerPlayerId !== source.controllerPlayerId) return false;
    const sourceController = state.players.find((candidate) => candidate.id === source.controllerPlayerId);
    if (!sourceController || sourceController.status !== 'active' || sourceController.locationId !== battlefieldId) return false;
    const definition = runtime.pack.cards[source.definitionId];
    return definition?.abilities.some((ability) =>
      isAcceptedRoundActiveAttackPaidCostCombatPowerAbility(ability as unknown as Record<string, unknown>, 'compiled')) === true;
  });
  // The accepted seam is one exact modifier source; ambiguous duplicate sources fail closed rather than stack implicitly.
  return sources.length === 1 ? 6 : 0;
}

function hasWinningFullRewardEachModifier(state: GameState, winnerPlayerIds: string[]): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime || winnerPlayerIds.length === 0) return false;
  const winners = new Set(winnerPlayerIds);
  return state.cards.some((source) => {
    if (!winners.has(source.controllerPlayerId) || !['field', 'attack_area'].includes(source.zone)) return false;
    const sourceState = runtime.cardState[source.instanceId];
    if (sourceState?.active !== true || sourceState.faceDown === true) return false;
    const definition = runtime.pack.cards[source.definitionId];
    return definition?.abilities.some((ability) => isAcceptedStaticCombatRewardDistributionAbility(ability as unknown as Record<string, unknown>, 'compiled')) === true;
  });
}

function buildBattleResultFromRanked(
  state: GameState,
  battlefieldId: CombatResolutionInput["battlefieldId"],
  ranked: BattleParticipantBreakdown[],
  presenceConcealmentDefeatedPlayerIds: string[] = [],
  preBattleDefeatedPlayerIds: string[] = [],
  participantAttackAttributes: Record<string, string[]> = {},
): GameState["battleResults"][number] | null {
  if (!ranked.length) return null;
  const location = getLocationById(state.map, state.locationConfig, battlefieldId);
  const excludedPlayerIds = [...new Set([
    ...ranked.filter((participant) => cannotWinBattleThisRound(state, participant.playerId)).map((participant) => participant.playerId),
    ...presenceConcealmentDefeatedPlayerIds.filter((playerId) => ranked.some((participant) => participant.playerId === playerId)),
    ...preBattleDefeatedPlayerIds.filter((playerId) => ranked.some((participant) => participant.playerId === playerId)),
  ])];
  const eligible = ranked.filter((participant) => !excludedPlayerIds.includes(participant.playerId));
  const highestEligiblePower = eligible[0]?.effectivePower;
  if (highestEligiblePower === undefined) return null;

  const winners = eligible.filter((participant) => participant.effectivePower === highestEligiblePower);
  const winnerPlayerIds = winners.map((participant) => participant.playerId);
  const tied = winnerPlayerIds.length > 1;
  const runnerUp = eligible.find((participant) => participant.effectivePower < highestEligiblePower);
  const margin = tied ? 0 : highestEligiblePower - (runnerUp?.effectivePower ?? 0);
  const eventVpPool = getBattleVpReward(state, battlefieldId, location);
  const hasCompetitionReward = ranked.length > 1 &&
    location?.rewardHooks.includes("competition_rewards") === true &&
    typeof location.vpRewardRules?.competition === "number";
  const competitionVpPool = hasCompetitionReward ? location!.vpRewardRules!.competition! : 0;
  const hasLocationReward = location?.rewardHooks.includes("location_rewards") === true &&
    typeof location.vpRewardRules?.location === "number";
  const locationVpPool = hasLocationReward ? location!.vpRewardRules!.location! : 0;
  const fullRewardEach = hasWinningFullRewardEachModifier(state, winnerPlayerIds);
  const baseVpPerWinner = fullRewardEach
    ? eventVpPool + competitionVpPool
    : splitVpPoolPerWinner(eventVpPool + competitionVpPool, winnerPlayerIds.length);
  const vpReward = fullRewardEach
    ? eventVpPool
    : Math.min(splitVpPoolPerWinner(eventVpPool, winnerPlayerIds.length), baseVpPerWinner);
  const competitionVpPerWinner = fullRewardEach
    ? competitionVpPool
    : Math.max(0, baseVpPerWinner - vpReward);
  const locationVpPerWinner = fullRewardEach
    ? locationVpPool
    : splitVpPoolPerWinner(locationVpPool, winnerPlayerIds.length);
  const defaultVpAdjustments = buildDefaultVpAdjustments(
    location, battlefieldId, winnerPlayerIds, competitionVpPerWinner, locationVpPerWinner,
  );
  const remoteOperationVpAdjustment = winnerPlayerIds
    .filter((playerId) => hasRemoteOperationBonus(state, playerId, battlefieldId))
    .map((playerId) => ({
      playerId, delta: 2, source: "battle_vp" as const, label: "basic.preparation.win_bonus",
    }));
  const vpAdjustments = [...(defaultVpAdjustments ?? []), ...remoteOperationVpAdjustment];
  const lossEffectSuppressedPlayerIds = ranked
    .filter((participant) => !winnerPlayerIds.includes(participant.playerId))
    .filter((participant) => ignoresBattleLossEffects(state, participant.playerId, battlefieldId))
    .map((participant) => participant.playerId);

  return {
    battlefieldId, winnerPlayerIds, tied,
    ...(excludedPlayerIds.length ? { excludedPlayerIds } : {}),
    ...(presenceConcealmentDefeatedPlayerIds.length ? { presenceConcealmentDefeatedPlayerIds: [...new Set(presenceConcealmentDefeatedPlayerIds)] } : {}),
    ...(lossEffectSuppressedPlayerIds.length ? { lossEffectSuppressedPlayerIds } : {}),
    winnerPlayerId: winnerPlayerIds.length === 1 ? winnerPlayerIds[0]! : null,
    margin, vpReward, baseVpPerWinner, eventVpPool, printedEventVpTotal: getPrintedEventVpTotal(state, battlefieldId), competitionVpPool,
    ...(vpAdjustments.length ? { vpAdjustments } : {}),
    militaryAdjustments: ranked.map((participant) => {
      const delta = winnerPlayerIds.includes(participant.playerId)
        ? margin
        : ignoresBattleLossEffects(state, participant.playerId, battlefieldId) ? 0 : -margin;
      return { playerId: participant.playerId, delta: Object.is(delta, -0) ? 0 : delta };
    }),
    participantBreakdowns: ranked,
    participantAttackAttributes: Object.fromEntries(ranked.map((participant) => [participant.playerId, [...new Set(participantAttackAttributes[participant.playerId] ?? [])]])),
  };
}

export function resolveBattlefield(
  state: GameState,
  input: CombatResolutionInput,
): ResolverResult {
  const abilityEventId = `battle:${state.round.roundNumber}:${input.battlefieldId}`;
  if (state.abilityRuntime?.processedEvents.includes(abilityEventId)) return { nextState: state, appliedLogEntries: [] };
  if (
    input.battlefieldId === "moon_holy_grail" &&
    state.map.locations.some((location) => location.id === "moon_holy_grail") &&
    getLocationById(state.map, state.locationConfig, "moon_holy_grail") === undefined
  ) {
    const skippedLogEntry = {
      type: "battle_skipped",
      message: "battlefield_skipped:moon_holy_grail",
    } satisfies GameState["log"][number];

    return {
      nextState: {
        ...state,
        log: state.log.concat(skippedLogEntry),
      },
      appliedLogEntries: ["battlefield_skipped:moon_holy_grail"],
    };
  }

  const nextPlacements = state.eventPlacements.map((placement) => {
    if (placement.locationId !== input.battlefieldId || !input.revealHiddenEvents) {
      return placement;
    }

    if (placement.visibility.scope !== "hidden_until_trigger") {
      return placement;
    }

    const visibility: VisibilityState = {
      scope: "public",
      revealReason: `battle:${input.battlefieldId}`,
    };

    return {
      ...placement,
      visibility,
    };
  });

  const participants = input.participants ?? deriveBattleParticipantsFromState(state, input.battlefieldId);
  const returnSilenceSource = returnSilenceSources(state).find(({ playerId }) =>
    state.players.some((player) => player.id === playerId && player.status === "active" && player.locationId === input.battlefieldId));
  if (returnSilenceSource && participants.length > 1) {
    const { playerId: returnSilenceController, sourceCardId } = returnSilenceSource;
    const ranked = [...participants]
      .map((participant) => buildParticipantBreakdown(state, input.battlefieldId, participant))
      .sort((left, right) => right.effectivePower - left.effectivePower);
    const allPendingPreBattle = state.abilityRuntime?.pendingPreBattleDefeats ?? [];
    const matchingPendingPreBattle = allPendingPreBattle.filter((entry) =>
      entry.round === state.round.roundNumber && entry.battlefieldId === input.battlefieldId);
    const participantIds = new Set(participants.map((participant) => participant.playerId));
    const preBattleTargets = [...new Set(matchingPendingPreBattle.flatMap((entry) => entry.targetPlayerIds))]
      .filter((playerId) => participantIds.has(playerId));
    const ignoredPreBattleTargets = preBattleTargets.filter((playerId) =>
      ignoresBattleLossEffects(state, playerId, input.battlefieldId));
    const defeatedPreBattleTargets = preBattleTargets.filter((playerId) => !ignoredPreBattleTargets.includes(playerId));
    const returnSilenceControllerDefeated = defeatedPreBattleTargets.includes(returnSilenceController);
    const winnerPlayerIds = returnSilenceControllerDefeated ? [] : [returnSilenceController];
    const loserIds = participants.map((participant) => participant.playerId)
      .filter((playerId) => returnSilenceControllerDefeated || playerId !== returnSilenceController);
    const battleResult: GameState["battleResults"][number] = {
      battlefieldId: input.battlefieldId,
      winnerPlayerIds,
      tied: false,
      ...(defeatedPreBattleTargets.length ? { excludedPlayerIds: defeatedPreBattleTargets } : {}),
      winnerPlayerId: winnerPlayerIds.length === 1 ? winnerPlayerIds[0]! : null,
      margin: 8,
      vpReward: 0,
      baseVpPerWinner: 0,
      eventVpPool: 0,
      printedEventVpTotal: getPrintedEventVpTotal(state, input.battlefieldId),
      competitionVpPool: 0,
      militaryAdjustments: loserIds.map((playerId) => ({ playerId, delta: -8 })),
      participantBreakdowns: ranked,
      participantAttackAttributes: Object.fromEntries(participants.map((participant) => [participant.playerId, [...new Set(participant.attackTags ?? [])]])),
    };
    const nextState: GameState = {
      ...state,
      eventPlacements: nextPlacements,
      battleResults: state.battleResults.concat(battleResult),
      log: state.log.concat({
        type: "battle_resolved",
        message: `return_silence:${input.battlefieldId}`,
        payload: { winnerPlayerIds, tied: false, winnerPlayerId: battleResult.winnerPlayerId, loserIds, sourceCardId },
      }),
    };
    if (nextState.abilityRuntime && matchingPendingPreBattle.length) {
      const consumed = new Set(matchingPendingPreBattle.map((entry) =>
        `${entry.round}:${entry.battlefieldId}:${entry.controllerId}:${entry.sourceCardId}:${entry.abilityId}`));
      nextState.abilityRuntime.pendingPreBattleDefeats = allPendingPreBattle.filter((entry) =>
        !consumed.has(`${entry.round}:${entry.battlefieldId}:${entry.controllerId}:${entry.sourceCardId}:${entry.abilityId}`));
    }
    for (const playerId of defeatedPreBattleTargets) {
      nextState.log.push({
        type: 'prebattle_defeat_applied',
        message: `${input.battlefieldId}:${playerId}`,
        payload: { playerId, battlefieldId: input.battlefieldId, roundNumber: state.round.roundNumber },
      });
    }
    for (const playerId of ignoredPreBattleTargets) {
      nextState.log.push({
        type: 'prebattle_defeat_ignored',
        message: `${input.battlefieldId}:${playerId}`,
        payload: { playerId, battlefieldId: input.battlefieldId, roundNumber: state.round.roundNumber, sourceCardDefinitionId: 'basic.luck' },
      });
    }
    const source = nextState.cards.find((card) => card.instanceId === sourceCardId);
    if (source) source.zone = "removed_from_game";
    if (nextState.abilityRuntime?.cardState[sourceCardId]) nextState.abilityRuntime.cardState[sourceCardId]!.active = false;
    clearTransientCardTransformState(nextState, sourceCardId);
    if (nextState.abilityRuntime?.transformedReturnSilenceSourceCardIds) {
      nextState.abilityRuntime.transformedReturnSilenceSourceCardIds = nextState.abilityRuntime.transformedReturnSilenceSourceCardIds
        .filter((id) => id !== sourceCardId);
    }
    const hasOtherLiveTransformedSource = returnSilenceSources(nextState)
      .some((candidate) => candidate.playerId === returnSilenceController);
    if (!hasOtherLiveTransformedSource && nextState.ruleOverrides?.mustDeployToBattlefieldPlayerIds) {
      nextState.ruleOverrides.mustDeployToBattlefieldPlayerIds = nextState.ruleOverrides.mustDeployToBattlefieldPlayerIds
        .filter((id) => id !== returnSilenceController);
    }
    if (nextState.abilityRuntime && !nextState.abilityRuntime.processedEvents.includes(abilityEventId)) {
      nextState.abilityRuntime.processedEvents.push(abilityEventId);
    }
    return { nextState, appliedLogEntries: [`return_silence:${input.battlefieldId}`] };
  }
  const ranked = [...participants]
    .map((participant) => buildParticipantBreakdown(state, input.battlefieldId, participant))
    .sort((left, right) => right.effectivePower - left.effectivePower);
  const resultId = `battle-result:${state.round.roundNumber}:${input.battlefieldId}`;
  const powerEventId = `battle-power:${state.round.roundNumber}:${input.battlefieldId}`;
  let settlementState = state;

  if (settlementState.abilityRuntime && !settlementState.abilityRuntime.processedEvents.includes(powerEventId)) {
    const eventState = structuredClone(settlementState);
    eventState.eventPlacements = nextPlacements;
    processAbilityEvent(eventState, {
      id: powerEventId,
      type: 'after_battle_power_calculated',
      battleId: abilityEventId,
      resultId,
      battlefieldId: input.battlefieldId,
      battleParticipantIds: ranked.map((participant) => participant.playerId),
      battleParticipantPowers: Object.fromEntries(ranked.map((participant) => [participant.playerId, participant.effectivePower])),
    });
    settlementState = eventState;
  }

  if (settlementState.abilityRuntime && (
    settlementState.abilityRuntime.pendingDecision ||
    settlementState.abilityRuntime.responseWindows.length ||
    settlementState.abilityRuntime.hostRequests.length
  )) {
    return {
      nextState: settlementState,
      appliedLogEntries: [`battle_power_response_pending:${input.battlefieldId}`],
    };
  }

  const currentParticipantIds = ranked.map((participant) => participant.playerId);
  const currentParticipantPowers = Object.fromEntries(ranked.map((participant) => [participant.playerId, participant.effectivePower]));
  const allPendingPresence = settlementState.abilityRuntime?.pendingPresenceConcealmentDefeats ?? [];
  const matchingPendingPresence = allPendingPresence.filter((entry) =>
    entry.resultId === resultId && entry.battlefieldId === input.battlefieldId);
  for (const entry of matchingPendingPresence) {
    if (entry.participantIds.length !== currentParticipantIds.length ||
      entry.participantIds.some((playerId, index) => currentParticipantIds[index] !== playerId) ||
      currentParticipantIds.some((playerId) => entry.participantPowers[playerId] !== currentParticipantPowers[playerId])) {
      throw new Error('Presence Concealment frozen battle Power snapshot changed before settlement');
    }
  }
  const presenceTargets = [...new Set(matchingPendingPresence.flatMap((entry) => entry.targetPlayerIds))];
  const ignoredPresenceTargets = presenceTargets.filter((playerId) =>
    ignoresBattleLossEffects(settlementState, playerId, input.battlefieldId));
  const defeatedPresenceTargets = presenceTargets.filter((playerId) => !ignoredPresenceTargets.includes(playerId));

  const allPendingPreBattle = settlementState.abilityRuntime?.pendingPreBattleDefeats ?? [];
  const matchingPendingPreBattle = allPendingPreBattle.filter((entry) =>
    entry.round === settlementState.round.roundNumber && entry.battlefieldId === input.battlefieldId);
  const participantIds = new Set(ranked.map((participant) => participant.playerId));
  const preBattleTargets = [...new Set(matchingPendingPreBattle.flatMap((entry) => entry.targetPlayerIds))]
    .filter((playerId) => participantIds.has(playerId));
  const ignoredPreBattleTargets = preBattleTargets.filter((playerId) =>
    ignoresBattleLossEffects(settlementState, playerId, input.battlefieldId));
  const defeatedPreBattleTargets = preBattleTargets.filter((playerId) => !ignoredPreBattleTargets.includes(playerId));

  const battleResult = buildBattleResultFromRanked(
    settlementState, input.battlefieldId, ranked, defeatedPresenceTargets, defeatedPreBattleTargets,
    Object.fromEntries(participants.map((participant) => [participant.playerId, [...new Set(participant.attackTags ?? [])]])));
  const nextBattleResults = battleResult
    ? settlementState.battleResults.concat(battleResult)
    : settlementState.battleResults;
  const logEntry = battleResult
    ? ({
        type: "battle_resolved",
        message: `battlefield:${input.battlefieldId}`,
        payload: {
          winnerPlayerIds: battleResult.winnerPlayerIds,
          tied: battleResult.tied,
          excludedPlayerIds: battleResult.excludedPlayerIds,
          presenceConcealmentDefeatedPlayerIds: battleResult.presenceConcealmentDefeatedPlayerIds,
          winnerPlayerId: battleResult.winnerPlayerId,
          margin: battleResult.margin,
          participantBreakdowns: battleResult.participantBreakdowns,
          vpAdjustments: battleResult.vpAdjustments,
          baseVpPerWinner: battleResult.baseVpPerWinner,
          eventVpPool: battleResult.eventVpPool,
          printedEventVpTotal: battleResult.printedEventVpTotal,
          competitionVpPool: battleResult.competitionVpPool,
        },
      } satisfies GameState["log"][number])
    : ({
        type: "battle_resolved",
        message: `battlefield:${input.battlefieldId}`,
      } satisfies GameState["log"][number]);

  const nextState: GameState = {
      ...settlementState,
      eventPlacements: nextPlacements,
      battleResults: nextBattleResults,
      log: settlementState.log.concat(logEntry),
  };
  if (nextState.abilityRuntime && matchingPendingPresence.length) {
    const consumed = new Set(matchingPendingPresence.map((entry) =>
      `${entry.triggerEventId}:${entry.sourceCardId}:${entry.abilityId}`));
    nextState.abilityRuntime.pendingPresenceConcealmentDefeats = allPendingPresence.filter((entry) =>
      !consumed.has(`${entry.triggerEventId}:${entry.sourceCardId}:${entry.abilityId}`));
  }
  for (const playerId of defeatedPresenceTargets) {
    nextState.log.push({
      type: 'presence_concealment_defeat_applied',
      message: `${input.battlefieldId}:${playerId}`,
      payload: { playerId, battlefieldId: input.battlefieldId, resultId },
    });
  }
  for (const playerId of ignoredPresenceTargets) {
    nextState.log.push({
      type: 'presence_concealment_defeat_ignored',
      message: `${input.battlefieldId}:${playerId}`,
      payload: { playerId, battlefieldId: input.battlefieldId, resultId, sourceCardDefinitionId: 'basic.luck' },
    });
  }
  if (nextState.abilityRuntime && matchingPendingPreBattle.length) {
    const consumed = new Set(matchingPendingPreBattle.map((entry) =>
      `${entry.round}:${entry.battlefieldId}:${entry.controllerId}:${entry.sourceCardId}:${entry.abilityId}`));
    nextState.abilityRuntime.pendingPreBattleDefeats = allPendingPreBattle.filter((entry) =>
      !consumed.has(`${entry.round}:${entry.battlefieldId}:${entry.controllerId}:${entry.sourceCardId}:${entry.abilityId}`));
  }
  for (const playerId of defeatedPreBattleTargets) {
    nextState.log.push({
      type: 'prebattle_defeat_applied',
      message: `${input.battlefieldId}:${playerId}`,
      payload: { playerId, battlefieldId: input.battlefieldId, roundNumber: settlementState.round.roundNumber },
    });
  }
  for (const playerId of ignoredPreBattleTargets) {
    nextState.log.push({
      type: 'prebattle_defeat_ignored',
      message: `${input.battlefieldId}:${playerId}`,
      payload: { playerId, battlefieldId: input.battlefieldId, roundNumber: settlementState.round.roundNumber, sourceCardDefinitionId: 'basic.luck' },
    });
  }
  if (settlementState.abilityRuntime && battleResult) {
    const winners = battleResult.winnerPlayerIds;
    const immuneLosers = participants
      .filter((participant) => !winners.includes(participant.playerId))
      .filter((participant) => ignoresBattleLossEffects(nextState, participant.playerId, input.battlefieldId))
      .map((participant) => participant.playerId);
    for (const playerId of immuneLosers) {
      nextState.log.push({
        type: "battle_loss_effect_ignored",
        message: `player:${playerId}:basic_luck_ignore_loss:${input.battlefieldId}`,
        payload: { playerId, battlefieldId: input.battlefieldId, sourceCardDefinitionId: "basic.luck" },
      });
    }
    const runtime = nextState.abilityRuntime;
    if (runtime && !runtime.processedEvents.includes(abilityEventId)) {
      runtime.processedEvents.push(abilityEventId);
    }
  }
  return {
    nextState,
    appliedLogEntries: [`battlefield:${input.battlefieldId}`],
  };
}
