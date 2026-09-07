export const timingWindows = [
  "round_start",
  "preparation",
  "advance",
  "action",
  "battle",
  "after_battle",
  "cleanup",
  "round_end",
] as const;

export type TimingWindow = (typeof timingWindows)[number];

export const battleEffectConditions = [
  "same_battlefield",
  "requires_public_attack",
  "requires_declared_battle",
] as const;

export type BattleEffectCondition = (typeof battleEffectConditions)[number];

export interface EffectDescriptor {
  id: string;
  timing: TimingWindow;
  handler: string;
  conditions?: BattleEffectCondition[];
  payload?: Record<string, unknown>;
}

export interface IdentityReplacementPayload {
  targetPlayerId: string;
  newCardId: string;
}

export interface CombatModifierRule {
  sourceId: string;
  targetTag: string;
  value: number;
  condition?: "has_attribute" | "lacks_attribute" | "has_repeated_attribute";
}

export interface EffectStackItem {
  sourceCardId: string;
  controllerPlayerId: string;
  effect: EffectDescriptor;
}

export interface EffectResolverInput {
  window: TimingWindow;
  stack: EffectStackItem[];
}
