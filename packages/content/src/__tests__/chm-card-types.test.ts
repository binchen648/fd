import { describe, expect, it } from 'vitest';
import {
  isCommandSpellCard,
  isEventCard,
  isMasterIdentityCard,
  isServantOverviewCard,
  isSituationCard,
  type CommandSpellCard,
  type EventCard,
  type MasterIdentityCard,
  type ServantOverviewCard,
  type SituationCard,
} from '../chm-card-types';

function baseCard() {
  return {
    id: 'card-001',
    name: 'Test Card',
    language: 'zh-CN' as const,
    namespace: 'master',
    approvedAt: '2026-04-14T00:00:00.000Z',
    guardrailJobId: 'job-001',
    tags: ['test'],
  };
}

describe('chm-card-types', () => {
  it('identifies master identity cards', () => {
    const card: MasterIdentityCard = {
      ...baseCard(),
      sourceSet: 'master',
      cardType: 'master_identity',
      initialMana: 4,
      commandSpells: 3,
    };

    expect(isMasterIdentityCard(card)).toBe(true);
    expect(isServantOverviewCard(card)).toBe(false);
  });

  it('identifies servant overview cards', () => {
    const card: ServantOverviewCard = {
      ...baseCard(),
      sourceSet: 'servant',
      namespace: 'servant',
      cardType: 'servant_overview',
      classTag: 'assassin',
      attackCardsCount: 12,
      skillCardsCount: 3,
    };

    expect(isServantOverviewCard(card)).toBe(true);
    expect(isEventCard(card)).toBe(false);
  });

  it('identifies event and situation cards without throwing on mismatches', () => {
    const eventCard: EventCard = {
      ...baseCard(),
      sourceSet: 'event',
      namespace: 'event',
      cardType: 'event',
      battlefield: 'deep_mountain',
      competitionReward: 2,
      display: 'revealed',
    };
    const situationCard: SituationCard = {
      ...baseCard(),
      sourceSet: 'situation',
      namespace: 'situation',
      cardType: 'situation',
      situationType: 'climax',
      manaGrantToAll: 1,
      hasInstantEffect: true,
      hasPersistentEffect: false,
      applicableRounds: [9, 10, 11],
    };

    expect(isEventCard(eventCard)).toBe(true);
    expect(isSituationCard(situationCard)).toBe(true);
    expect(isSituationCard(eventCard)).toBe(false);
  });

  it('returns false for nullish or malformed values', () => {
    const malformed = { sourceSet: 'command_spell', cardType: 42 };
    const commandSpell: CommandSpellCard = {
      ...baseCard(),
      sourceSet: 'command_spell',
      namespace: 'master',
      cardType: 'command_spell',
      usage: 'gain_mana_4',
      limitPerPlayer: 3,
    };

    expect(isCommandSpellCard(commandSpell)).toBe(true);
    expect(isCommandSpellCard(null)).toBe(false);
    expect(isCommandSpellCard(undefined)).toBe(false);
    expect(isCommandSpellCard(malformed)).toBe(false);
  });
});
