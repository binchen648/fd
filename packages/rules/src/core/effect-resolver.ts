import type { GameState } from "../schema/game";
import type { EffectStackItem, TimingWindow } from "../schema/effect";

import type { ResolverResult } from "./resolver-contracts";
import { applyReplacementEffect } from "./replacement-pipeline";

export function resolveEffectsForWindow(
  state: GameState,
  window: TimingWindow,
): ResolverResult {
  const remainingStack = [];
  const appliedLogEntries: string[] = [];
  let nextState = state;

  for (const item of state.effectStack) {
    if (item.effect.timing === window) {
      nextState = applyEffectHandler(nextState, item);
      appliedLogEntries.push(`${item.effect.id}@${window}`);
      continue;
    }

    remainingStack.push(item);
  }

  return {
    nextState: {
      ...nextState,
      effectStack: remainingStack,
      log: nextState.log.concat(
        appliedLogEntries.map((entry) => ({
          type: "effect_resolved",
          message: entry,
        })),
      ),
    },
    appliedLogEntries,
  };
}

function applyEffectHandler(state: GameState, item: EffectStackItem): GameState {
  switch (item.effect.handler) {
    case "gain_mana":
      return applyGainManaEffect(state, item);
    case "grant_combat_modifier":
      return applyGrantCombatModifierEffect(state, item);
    default:
      return applyReplacementEffect(state, item);
  }
}

function applyGainManaEffect(state: GameState, item: EffectStackItem): GameState {
  const amount = readGainManaAmount(item.effect.payload);

  if (amount === null) {
    return state;
  }

  let applied = false;
  const players = state.players.map((player) => {
    if (player.id !== item.controllerPlayerId) {
      return player;
    }

    applied = true;
    return {
      ...player,
      mana: player.mana + amount,
    };
  });

  if (!applied) {
    return state;
  }

  return {
    ...state,
    players,
    log: state.log.concat({
      type: "mana_gained",
      message: `player:${item.controllerPlayerId}:mana+${amount}`,
      payload: {
        playerId: item.controllerPlayerId,
        amount,
        effectId: item.effect.id,
      },
    }),
  };
}

function applyGrantCombatModifierEffect(state: GameState, item: EffectStackItem): GameState {
  const modifier = readCombatModifierPayload(item);

  if (!modifier) {
    return state;
  }

  const battleSkillEffects = (state.battleSkillEffects ?? []).concat({
    ownerPlayerId: modifier.targetPlayerId,
    sourceCardDefinitionId: modifier.sourceCardDefinitionId,
    skillId: modifier.skillId,
    combatModifiers: [
      {
        sourceId: modifier.sourceId,
        targetTag: modifier.targetTag,
        value: modifier.value,
      },
    ],
  });

  return {
    ...state,
    battleSkillEffects,
    log: state.log.concat({
      type: "combat_modifier_granted",
      message: `player:${modifier.targetPlayerId}:combat_modifier:${modifier.skillId}`,
      payload: {
        playerId: modifier.targetPlayerId,
        sourceCardDefinitionId: modifier.sourceCardDefinitionId,
        skillId: modifier.skillId,
        targetTag: modifier.targetTag,
        value: modifier.value,
        effectId: item.effect.id,
      },
    }),
  };
}

function readCombatModifierPayload(item: EffectStackItem): {
  targetPlayerId: string;
  sourceCardDefinitionId: string;
  skillId: string;
  sourceId: string;
  targetTag: string;
  value: number;
} | null {
  const payload = item.effect.payload;
  if (!payload) {
    return null;
  }

  if (typeof payload.targetPlayerId !== "string" || payload.targetPlayerId.length === 0) {
    return null;
  }

  if (typeof payload.sourceCardDefinitionId !== "string" || payload.sourceCardDefinitionId.length === 0) {
    return null;
  }

  if (typeof payload.skillId !== "string" || payload.skillId.length === 0) {
    return null;
  }

  if (typeof payload.targetTag !== "string" || payload.targetTag.length === 0) {
    return null;
  }

  if (typeof payload.value !== "number" || !Number.isFinite(payload.value)) {
    return null;
  }

  return {
    targetPlayerId: payload.targetPlayerId,
    sourceCardDefinitionId: payload.sourceCardDefinitionId,
    skillId: payload.skillId,
    sourceId:
      typeof payload.sourceId === "string" && payload.sourceId.length > 0
        ? payload.sourceId
        : payload.skillId,
    targetTag: payload.targetTag,
    value: payload.value,
  };
}

function readGainManaAmount(payload: Record<string, unknown> | undefined): number | null {
  if (!payload || typeof payload.amount !== "number" || !Number.isFinite(payload.amount)) {
    return null;
  }

  return payload.amount;
}
