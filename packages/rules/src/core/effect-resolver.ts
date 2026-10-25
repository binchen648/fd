import type { GameState } from "../schema/game";
import type { EffectStackItem, TimingWindow } from "../schema/effect";

import type { ResolverResult } from "./resolver-contracts";
import { applyReplacementEffect } from "./replacement-pipeline";
import { grantMana } from "./rule-overrides";

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
  if (!state.players.some((player) => player.id === item.controllerPlayerId)) {
    return state;
  }

  const nextState = structuredClone(state);
  const result = amount > 0
    ? grantMana(nextState, item.controllerPlayerId, amount, { source: 'generic' })
    : (() => {
        const player = nextState.players.find((candidate) => candidate.id === item.controllerPlayerId)!;
        const before = player.mana;
        player.mana = Math.max(0, before + amount);
        return { actualAmount: player.mana - before };
      })();

  return {
    ...nextState,
    log: nextState.log.concat({
      type: "mana_gained",
      message: `player:${item.controllerPlayerId}:mana+${result.actualAmount}`,
      payload: {
        playerId: item.controllerPlayerId,
        amount: result.actualAmount,
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
