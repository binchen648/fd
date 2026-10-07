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
  /** Source-provenanced physical-card Power modifiers. Game-duration entries survive round cleanup. */
  powerModifiers?: Array<{
    id: string;
    sourceId: string;
    sourceAbilityId?: string;
    controllerId?: string;
    kind: 'add' | 'set' | 'reverse_situation_event';
    value?: number;
    duration?: 'round' | 'game' | 'while_active';
    lifecycle?: 'until_leaves_active_area' | 'game';
    round?: number;
    provenanceKind?: string;
  }>;
  /** Source-provenanced physical-card play-cost modifiers. */
  costModifiers?: Array<{
    id: string;
    sourceId: string;
    sourceAbilityId?: string;
    controllerId?: string;
    kind: 'add';
    value: number;
    duration: 'round' | 'game';
    minPrintedFraction?: number;
    provenanceKind?: string;
  }>;
  /** Identity-free membership in one server-owned isolated definition side deck. */
  definitionSideDeckKey?: string;
}
