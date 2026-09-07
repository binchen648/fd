import starterPack from "../data/cards/starter-pack.json";
import type { BattleDeclarationState, GameState, PhaseName } from "../schema/game";
import { createRoundStartEventPlacements, type RoundStartEventDraw } from "./event-engine";
import { buildTransition } from "./phase-machine";
import { battleEffectConditions, type BattleEffectCondition, type EffectDescriptor, type EffectStackItem } from "../schema/effect";
import {
  applyBattleScoring,
  applyEliminationAndThresholdLog,
  applyOccupiedLocationRewards,
} from "./scoring-resolver";
import {
  applySituationAtRoundStart,
  canUseSituationForRemainingPlayers,
  type SituationCardRuntime,
} from "./situation-engine";
import { playServantCardPair } from "./card-play";
import { assignInitialPlayerLocations, movePlayer } from "./movement";
import { resolveBattlefield } from "./combat-resolver";
import { resolveEffectsForWindow } from "./effect-resolver";
import { getEnabledLocations } from "./map-engine";
import { advanceAbilityPhase } from '../ability/interpreter';

function hasPendingAbilityResolution(state: GameState): boolean {
  return !!state.abilityRuntime && (!!state.abilityRuntime.pendingDecision || state.abilityRuntime.responseWindows.length > 0 || state.abilityRuntime.hostRequests.length > 0);
}

export interface GameLoopResult {
  nextState: GameState;
  transition: {
    from: PhaseName;
    to: PhaseName;
  };
}

export interface ActionMovementInput {
  type: "move";
  playerId: string;
  to: "miyama_town" | "shinto" | "magic_workshop" | "recon" | "moon_holy_grail";
  movementKind: "normal" | "effect";
}

export interface ActionPlayInput {
  type: "play";
  playerId: string;
  cardInstanceIds: string[];
  revealedCardInstanceIds: string[];
}

export interface GameLoopInput {
  situationCard?: SituationCardRuntime;
  eventDraws?: RoundStartEventDraw[];
  action?: ActionMovementInput | ActionPlayInput;
}

interface StarterPackEffectCandidate {
  id?: unknown;
  timing?: unknown;
  handler?: unknown;
  conditions?: unknown;
  payload?: unknown;
}

function isBattleEffectDescriptor(effect: StarterPackEffectCandidate): effect is EffectDescriptor {
  return (
    typeof effect.id === 'string' &&
    effect.timing === 'battle' &&
    typeof effect.handler === 'string' &&
    (effect.conditions === undefined || Array.isArray(effect.conditions)) &&
    (effect.payload === undefined || typeof effect.payload === 'object')
  );
}

function normalizeBattleEffectDescriptor(
  effect: StarterPackEffectCandidate,
): EffectDescriptor {
  const normalizedConditions = Array.isArray(effect.conditions)
    ? effect.conditions.filter(
        (condition): condition is BattleEffectCondition =>
          typeof condition === 'string' && battleEffectConditions.includes(condition as BattleEffectCondition),
      )
    : undefined;

  return {
    id: String(effect.id),
    timing: 'battle',
    handler: String(effect.handler),
    ...(normalizedConditions ? { conditions: normalizedConditions } : {}),
    ...(effect.payload && typeof effect.payload === 'object' ? { payload: effect.payload as Record<string, unknown> } : {}),
  };
}

interface BattleEffectContext {
  battlefieldId: GameState["map"]["locations"][number]["id"];
  controllerPlayerId: string;
  declaredBattlefieldIds: GameState["map"]["locations"][number]["id"][];
  controllerAtBattlefield: boolean;
  hasPublicAttackCardAtBattlefield: boolean;
}

function getDeclaredBattlefieldIds(state: GameState): GameState["map"]["locations"][number]["id"][] {
  return (state.battleDeclarations ?? []).map((declaration) => declaration.battlefieldId);
}

function hasCondition(effect: EffectDescriptor, condition: BattleEffectCondition): boolean {
  return effect.conditions?.includes(condition) ?? false;
}

function evaluateBattleEffectConditions(
  effect: EffectDescriptor,
  context: BattleEffectContext,
): boolean {
  if (hasCondition(effect, "same_battlefield") && !context.controllerAtBattlefield) {
    return false;
  }

  if (hasCondition(effect, "requires_public_attack") && !context.hasPublicAttackCardAtBattlefield) {
    return false;
  }

  if (
    hasCondition(effect, "requires_declared_battle") &&
    !context.declaredBattlefieldIds.includes(context.battlefieldId)
  ) {
    return false;
  }

  return true;
}

function buildBattleEffectContext(
  state: GameState,
  battlefieldId: GameState["map"]["locations"][number]["id"],
  controllerPlayerId: string,
): BattleEffectContext {
  const controller = state.players.find((player) => player.id === controllerPlayerId);
  const controllerAtBattlefield = controller?.locationId === battlefieldId;
  const hasPublicAttackCardAtBattlefield = state.cards.some((candidate) => {
    if (
      candidate.controllerPlayerId !== controllerPlayerId ||
      candidate.zone !== "field" ||
      candidate.visibility.scope !== "public"
    ) {
      return false;
    }

    const definition = starterPack.servants.find((entry) => entry.id === candidate.definitionId);
    return definition?.type === "servant_attack" && controllerAtBattlefield;
  });

  return {
    battlefieldId,
    controllerPlayerId,
    declaredBattlefieldIds: getDeclaredBattlefieldIds(state),
    controllerAtBattlefield,
    hasPublicAttackCardAtBattlefield,
  };
}

function shouldResolveBattlefield(
  locationId: GameState["map"]["locations"][number]["id"],
  declarations?: BattleDeclarationState[],
): boolean {
  if (!declarations?.length) {
    return true;
  }

  return declarations.some((declaration) => declaration.battlefieldId === locationId);
}

function buildBattleEffectStack(
  state: GameState,
  battlefieldId: GameState["map"]["locations"][number]["id"],
): EffectStackItem[] {
  const publicSkillCards = state.cards.filter((card) => card.zone === "field" && card.visibility.scope === "public");

  return publicSkillCards.flatMap((card) => {
    const definition = starterPack.servants.find((entry) => entry.id === card.definitionId);
    if (definition?.type !== "servant_skill") {
      return [];
    }

    const context = buildBattleEffectContext(state, battlefieldId, card.controllerPlayerId);

    return definition.effects
      .filter(isBattleEffectDescriptor)
      .map(normalizeBattleEffectDescriptor)
      .filter((effect) => evaluateBattleEffectConditions(effect, context))
      .map((effect) => ({
        sourceCardId: card.instanceId,
        controllerPlayerId: card.controllerPlayerId,
        effect: {
          ...effect,
          timing: "battle",
          payload: {
            ...effect.payload,
            targetPlayerId: card.controllerPlayerId,
            sourceCardDefinitionId: definition.id,
            skillId: definition.id,
          },
        },
      }));
  });
}

function getScheduledSituationForRound(state: GameState): SituationCardRuntime | undefined {
  const scheduledSituation = state.contentRuntime?.situations.find(
    (candidate) => candidate.round === state.round.roundNumber,
  );

  if (!scheduledSituation) {
    return undefined;
  }

  return {
    cardId: scheduledSituation.cardId,
    ...(scheduledSituation.minimumRemainingPlayers !== undefined
      ? { minimumRemainingPlayers: scheduledSituation.minimumRemainingPlayers }
      : {}),
    ...(scheduledSituation.sharedManaReward !== undefined
      ? { sharedManaReward: scheduledSituation.sharedManaReward }
      : {}),
    ...(scheduledSituation.battleModifiers?.length
      ? { battleModifiers: scheduledSituation.battleModifiers }
      : {}),
  };
}

function getScheduledEventDrawsForRound(state: GameState): RoundStartEventDraw[] {
  return (state.contentRuntime?.eventDraws ?? [])
    .filter((candidate) => candidate.round === state.round.roundNumber)
    .map((candidate) => ({
      locationId: candidate.locationId,
      eventCardId: candidate.eventCardId,
      ...(candidate.victoryPoints !== undefined ? { victoryPoints: candidate.victoryPoints } : {}),
      ...(candidate.battleModifiers?.length ? { battleModifiers: candidate.battleModifiers } : {}),
    }));
}

function runRoundStartSystems(
  state: GameState,
  input?: GameLoopInput,
): GameState {
  let nextState = applyEliminationAndThresholdLog(state).nextState;
  nextState = applyOccupiedLocationRewards(nextState).nextState;
  const activePlayers = nextState.players.filter((player) => player.status === "active").length;
  const situationCard = input?.situationCard ?? getScheduledSituationForRound(nextState);

  if (situationCard && canUseSituationForRemainingPlayers(activePlayers, situationCard)) {
    nextState = applySituationAtRoundStart(nextState, situationCard).nextState;
  }

  const eventDraws = input?.eventDraws ?? getScheduledEventDrawsForRound(nextState);
  if (eventDraws.length) {
    const placements = createRoundStartEventPlacements(nextState, eventDraws);

    nextState = {
      ...nextState,
      eventPlacements: nextState.eventPlacements.concat(placements),
      log: nextState.log.concat(
        placements.map((placement) => ({
          type: "event_placed",
          message: `event:${placement.eventCardId}@${placement.locationId}`,
        })),
      ),
    };
  }

  return nextState;
}

function runBattlePhase(state: GameState): GameState {
  const enabledLocations = getEnabledLocations(state.map, state.locationConfig);
  const contestedBattlefields = enabledLocations.filter((location) => {
    const supportsBattle =
      location.rewardHooks.includes("battle_rewards") || location.tags.includes("battlefield");

    if (!supportsBattle || !shouldResolveBattlefield(location.id, state.battleDeclarations)) {
      return false;
    }

    const activeOccupants = state.players.filter(
      (player) => player.status === "active" && player.locationId === location.id,
    );

    return activeOccupants.length >= 2;
  });

  const resolvedState = contestedBattlefields.reduce((nextState, location) => {
    if (hasPendingAbilityResolution(nextState) || nextState.abilityRuntime?.processedEvents.includes(`battle:${nextState.round.roundNumber}:${location.id}`)) return nextState;
    const applicableBattleEffects = nextState.effectStack.filter((item) => {
      if (item.effect.timing !== "battle") {
        return false;
      }

      const context = buildBattleEffectContext(nextState, location.id, item.controllerPlayerId);
      return evaluateBattleEffectConditions(item.effect, context);
    });
    const deferredEffects = nextState.effectStack.filter((item) => !applicableBattleEffects.includes(item));
    const nonBattleDeferredEffects = deferredEffects.filter((item) => item.effect.timing !== "battle");
    const battleEffectStack = buildBattleEffectStack(nextState, location.id);
    const stateWithBattleEffects = {
      ...nextState,
      effectStack: nonBattleDeferredEffects.concat(applicableBattleEffects, battleEffectStack),
    };
    const afterEffects = resolveEffectsForWindow(stateWithBattleEffects, "battle").nextState;

    return resolveBattlefield(afterEffects, {
      battlefieldId: location.id,
      revealHiddenEvents: true,
    }).nextState;
  }, state);

  return {
    ...resolvedState,
    battleDeclarations: hasPendingAbilityResolution(resolvedState) ? resolvedState.battleDeclarations ?? [] : [],
    effectStack: resolvedState.effectStack.filter((item) => item.effect.timing !== "battle"),
  };
}

function runCleanupPhase(state: GameState): GameState {
  const scoredState = applyBattleScoring(state).nextState;
  return {
    ...scoredState,
    battleSkillEffects: [],
  };
}

export function stepGameLoop(
  state: GameState,
  input?: GameLoopInput,
): GameLoopResult {
  if (hasPendingAbilityResolution(state)) return { nextState: state, transition: { from: state.round.activePhase, to: state.round.activePhase } };
  const transition = buildTransition(state.round.activePhase);
  const roundNumber =
    transition.to === "round_start"
      ? state.round.roundNumber + 1
      : state.round.roundNumber;

  let nextState: GameState = {
    ...state,
    round: {
      ...state.round,
      roundNumber,
      activePhase: transition.to,
    },
    log: state.log.concat({
      type: "phase_transition",
      message: `${transition.from} -> ${transition.to}`,
    }),
  };

  if (transition.to === "round_start") {
    nextState = runRoundStartSystems(nextState, input);
    const { nextState: afterPlacement } = assignInitialPlayerLocations(nextState);
    nextState = afterPlacement;
  }

  if (state.round.activePhase === "action" && input?.action?.type === "move") {
    nextState = movePlayer(state, {
      playerId: input.action.playerId,
      to: input.action.to,
      movementKind: input.action.movementKind,
    }).nextState;
    nextState = {
      ...nextState,
      round: {
        ...nextState.round,
        roundNumber,
        activePhase: transition.to,
      },
      log: nextState.log.concat({
        type: "phase_transition",
        message: `${transition.from} -> ${transition.to}`,
      }),
    };
  }

  if (state.round.activePhase === "action" && input?.action?.type === "play") {
    nextState = playServantCardPair(state, {
      playerId: input.action.playerId,
      cardInstanceIds: input.action.cardInstanceIds,
      revealedCardInstanceIds: input.action.revealedCardInstanceIds,
    }).nextState;
    nextState = {
      ...nextState,
      round: {
        ...nextState.round,
        roundNumber,
        activePhase: transition.to,
      },
      log: nextState.log.concat({
        type: "phase_transition",
        message: `${transition.from} -> ${transition.to}`,
      }),
    };
  }

  if (state.round.activePhase === "battle") {
    nextState = runBattlePhase(state);
    if (hasPendingAbilityResolution(nextState)) return { nextState, transition: { from: 'battle', to: 'battle' } };
    nextState = {
      ...nextState,
      round: {
        ...nextState.round,
        roundNumber,
        activePhase: transition.to,
      },
      log: nextState.log.concat({
        type: "phase_transition",
        message: `${transition.from} -> ${transition.to}`,
      }),
    };
  }

  if (state.round.activePhase === "cleanup") {
    nextState = runCleanupPhase(state);
    nextState = {
      ...nextState,
      round: {
        ...nextState.round,
        roundNumber,
        activePhase: transition.to,
      },
      log: nextState.log.concat({
        type: "phase_transition",
        message: `${transition.from} -> ${transition.to}`,
      }),
    };
  }

  if (nextState.abilityRuntime) advanceAbilityPhase(nextState, nextState.round.activePhase, nextState.round.roundNumber);
  return {
    nextState,
    transition,
  };
}
