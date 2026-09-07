/**
 * CHM Base Game Card Type Definitions
 * Based on FD-Game-Rules-Final.md
 *
 * Defines all card types, their constraints, and metadata structures
 * for the FD content library system.
 */

export interface CardMetadata {
  id: string;
  name: string;
  language: 'zh-CN' | 'en-US' | 'ja-JP';
  sourceSet: 'master' | 'servant' | 'situation' | 'event' | 'command_spell';
  namespace: string;
  approvedAt: string;
  guardrailJobId: string;
  tags: string[];
}

export interface MasterIdentityCard extends CardMetadata {
  sourceSet: 'master';
  initialMana: number;
  commandSpells: number;
  passiveAbility?: string;
  cardType: 'master_identity';
}

export interface MasterSkillCard extends CardMetadata {
  sourceSet: 'master';
  abilityType: 'passive' | 'phase_ability' | 'ex_skill';
  triggerPhase?: 'preparation' | 'sentinel' | 'action' | 'battle' | 'end_of_turn';
  cardType: 'master_skill';
}

export interface ServantOverviewCard extends CardMetadata {
  sourceSet: 'servant';
  classTag: string;
  attackCardsCount: number;
  skillCardsCount: number;
  cardType: 'servant_overview';
}

export interface ServantAttackCard extends CardMetadata {
  sourceSet: 'servant';
  magicCost: number;
  basePower: number;
  attribute?: 'strength' | 'agility' | 'magic' | 'special' | 'noble_phantasm';
  cardType: 'servant_attack';
}

export interface ServantSkillCard extends CardMetadata {
  sourceSet: 'servant';
  magicCostRequired: number;
  basePower?: number;
  abilityText: string;
  cardType: 'servant_skill';
}

export interface SituationCard extends CardMetadata {
  sourceSet: 'situation';
  situationType: 'regular' | 'climax';
  manaGrantToAll: number;
  hasInstantEffect: boolean;
  hasPersistentEffect: boolean;
  applicableRounds?: number[];
  specialNames?: string[];
  cardType: 'situation';
}

export interface EventCard extends CardMetadata {
  sourceSet: 'event';
  battlefield: 'deep_mountain' | 'new_capital';
  competitionReward: number;
  display: 'revealed' | 'hidden';
  specialRules?: string[];
  cardType: 'event';
}

export interface CommandSpellCard extends CardMetadata {
  sourceSet: 'command_spell';
  usage: 'deep_mountain_move' | 'new_capital_move' | 'gain_mana_4' | 'battle_power_bonus_2';
  limitPerPlayer: number;
  cardType: 'command_spell';
}

export type GameCard =
  | MasterIdentityCard
  | MasterSkillCard
  | ServantOverviewCard
  | ServantAttackCard
  | ServantSkillCard
  | SituationCard
  | EventCard
  | CommandSpellCard;

export const CHM_CONSTRAINTS = {
  master: {
    initialMana: 4,
    commandSpells: 3,
  },
  servant: {
    attackCardsCount: 12,
    skillCardsCount: 3,
    skillCardMinManaRequired: 8,
  },
  situation: {
    regularCount: 8,
    climaxCount: 3,
    climaxRounds: [9, 10, 11],
    climaxNames: ['ming yun zhi ye', 'shen chu di yu zhi men', 'tian zhi bei'],
  },
  event: {
    deepMountainCompetitionReward: 2,
    newCapitalCompetitionReward: 3,
  },
  commandSpell: {
    perPlayer: 3,
    usageTypes: ['deep_mountain_move', 'new_capital_move', 'gain_mana_4', 'battle_power_bonus_2'],
    gainManaAmount: 4,
    battlePowerBonus: 2,
    extraVPOnWin: 2,
  },
  general: {
    playerCount: { min: 3, max: 7 },
    totalRounds: 11,
    handCardLimit: 3,
    workshopCapacity: 4,
    investigationCapacity: 1,
    investigationReward: 2,
  },
  board: {
    workshop: {
      magicValues: [2, 1, 1, 1],
    },
    deepMountain: {
      geographyValues: [3, 1],
      movementCost: 2,
    },
    newCapital: {
      geographyValues: [3, 1],
      movementCost: 2,
    },
    startMovement: 1,
  },
} as const;

function hasCardIdentity(value: unknown): value is { sourceSet: string; cardType: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sourceSet' in value &&
    typeof value.sourceSet === 'string' &&
    'cardType' in value &&
    typeof value.cardType === 'string'
  );
}

export function isMasterIdentityCard(card: unknown): card is MasterIdentityCard {
  return hasCardIdentity(card) && card.sourceSet === 'master' && card.cardType === 'master_identity';
}

export function isMasterSkillCard(card: unknown): card is MasterSkillCard {
  return hasCardIdentity(card) && card.sourceSet === 'master' && card.cardType === 'master_skill';
}

export function isServantOverviewCard(card: unknown): card is ServantOverviewCard {
  return hasCardIdentity(card) && card.sourceSet === 'servant' && card.cardType === 'servant_overview';
}

export function isServantAttackCard(card: unknown): card is ServantAttackCard {
  return hasCardIdentity(card) && card.sourceSet === 'servant' && card.cardType === 'servant_attack';
}

export function isServantSkillCard(card: unknown): card is ServantSkillCard {
  return hasCardIdentity(card) && card.sourceSet === 'servant' && card.cardType === 'servant_skill';
}

export function isSituationCard(card: unknown): card is SituationCard {
  return hasCardIdentity(card) && card.sourceSet === 'situation' && card.cardType === 'situation';
}

export function isEventCard(card: unknown): card is EventCard {
  return hasCardIdentity(card) && card.sourceSet === 'event' && card.cardType === 'event';
}

export function isCommandSpellCard(card: unknown): card is CommandSpellCard {
  return hasCardIdentity(card) && card.sourceSet === 'command_spell' && card.cardType === 'command_spell';
}
