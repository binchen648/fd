import type { CombatModifierRule, EffectDescriptor } from "./effect";
import type { VisibilityState } from "./visibility";

export const cardTypes = [
  "master_identity",
  "master_skill",
  "command_spell",
  "servant_attack",
  "servant_skill",
  "situation",
  "event",
  "status",
  "generated",
] as const;

export type CardType = (typeof cardTypes)[number];

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  subtype?: string;
  cost?: number;
  basePower?: number;
  tags: string[];
  effects: EffectDescriptor[];
  combatModifiers?: CombatModifierRule[];
}

export interface CardInstance {
  instanceId: string;
  definitionId: string;
  ownerPlayerId: string;
  controllerPlayerId: string;
  zone: string;
  visibility: VisibilityState;
  generatedBy?: string;
  /** Player that created this derived physical card instance, distinct from source-instance provenance. */
  createdByPlayerId?: string;
  /** Physical card instance copied to derive this card, when applicable. */
  derivedFromInstanceId?: string;
}
