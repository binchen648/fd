import type { TimingWindow } from "../schema/effect";
import type { GameState, PhaseName } from "../schema/game";
import type { LocationId } from "../schema/location";

import type { SituationCardRuntime } from "../core/situation-engine";

import { resolveBattlefield } from "../core/combat-resolver";
import { resolveEffectsForWindow } from "../core/effect-resolver";
import { stepGameLoop } from "../core/game-loop";
import { applyBattleScoring, applyEliminationAndThresholdLog, countActivePlayers } from "../core/scoring-resolver";
import { applySituationAtRoundStart } from "../core/situation-engine";

export type SimulationStep =
  | { type: "step_phase" }
  | { type: "apply_situation"; card: SituationCardRuntime }
  | { type: "resolve_effects"; window: TimingWindow }
  | {
      type: "resolve_battle";
      battlefieldId: LocationId;
      revealHiddenEvents?: boolean;
      participants?: Array<{ playerId: string; totalPower: number; attackTags?: string[] }>;
    }
  | { type: "apply_scoring" };

export interface SimulationFrame {
  index: number;
  step: SimulationStep;
  roundNumber: number;
  activePhase: PhaseName;
  activePlayers: number;
  appliedLogEntries: string[];
}

export interface SimulationInput {
  seed: string;
  initialState: GameState;
  steps: SimulationStep[];
}

export interface SimulationResult {
  seed: string;
  finalState: GameState;
  frames: SimulationFrame[];
}

export function simulateSeededMatch(input: SimulationInput): SimulationResult {
  let state = input.initialState;
  const frames: SimulationFrame[] = [];

  input.steps.forEach((step, index) => {
    const result = applySimulationStep(state, step);
    state = result.nextState;
    frames.push({
      index,
      step,
      roundNumber: state.round.roundNumber,
      activePhase: state.round.activePhase,
      activePlayers: countActivePlayers(state),
      appliedLogEntries: result.appliedLogEntries,
    });
  });

  return {
    seed: input.seed,
    finalState: state,
    frames,
  };
}

export function applySimulationStep(
  state: GameState,
  step: SimulationStep,
): { nextState: GameState; appliedLogEntries: string[] } {
  switch (step.type) {
    case "step_phase": {
      const result = stepGameLoop(state);
      return {
        nextState: result.nextState,
        appliedLogEntries: [`phase:${result.transition.from}->${result.transition.to}`],
      };
    }
    case "apply_situation":
      return applySituationAtRoundStart(state, step.card);
    case "resolve_effects":
      return resolveEffectsForWindow(state, step.window);
    case "resolve_battle": {
      const input = step.revealHiddenEvents === undefined
        ? step.participants === undefined
          ? {
              battlefieldId: step.battlefieldId,
            }
          : {
              battlefieldId: step.battlefieldId,
              participants: step.participants,
            }
        : step.participants === undefined
          ? {
              battlefieldId: step.battlefieldId,
              revealHiddenEvents: step.revealHiddenEvents,
            }
          : {
              battlefieldId: step.battlefieldId,
              revealHiddenEvents: step.revealHiddenEvents,
              participants: step.participants,
            };

      return resolveBattlefield(state, input);
    }
    case "apply_scoring":
      return state.battleResults.length > 0
        ? applyBattleScoring(state)
        : applyEliminationAndThresholdLog(state);
  }
}
