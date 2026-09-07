import type { GameState } from "../schema/game";
import type { TimingWindow } from "../schema/effect";

export interface ResolverResult {
  nextState: GameState;
  appliedLogEntries: string[];
}

export interface EffectResolverContract {
  resolve(state: GameState, window: TimingWindow): ResolverResult;
}

export interface CombatResolverContract {
  resolveBattle(state: GameState, battlefieldId: string): ResolverResult;
}

export interface ScoringResolverContract {
  applyRoundScoring(state: GameState): ResolverResult;
}
