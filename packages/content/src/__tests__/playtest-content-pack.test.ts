import { describe, expect, it } from 'vitest';

import {
  computeAttributeCounts,
  type ContentPack,
  type DeckEntry,
  type NamedCardDefinition,
  type ServantDefinition,
  validateContentPack,
  validateNamedCardDefinition,
  validateServantDefinition,
} from '../playtest-content-pack';

const source = {
  htmPath: 'chm-extract/从者/B.B..htm',
  imagePath: 'chm-extract/从者/B.B./overview.png',
  imageIndex: 0,
  reviewedAgainstImage: true,
};

const bbStartingDeck = {
  entries: [
    { entryType: 'basic', attribute: 'strength', printedValue: 3, copies: 3 },
    { entryType: 'basic', attribute: 'agility', printedValue: 2, copies: 2 },
    { entryType: 'basic', attribute: 'magecraft', printedValue: 4, copies: 4 },
    {
      entryType: 'named',
      attribute: 'magecraft',
      cardId: 'servant.bb.moon_cancer',
      copies: 1,
    },
    {
      entryType: 'named',
      attribute: 'special',
      cardId: 'servant.bb.cursed_cupid_cleanser',
      copies: 2,
    },
  ] satisfies DeckEntry[],
};

function makeValidServant(): ServantDefinition {
  return {
    id: 'servant.bb',
    name: 'B.B.',
    classTag: 'MoonCancer',
    overviewCardId: 'servant.bb.overview',
    startingDeck: {
      size: 12,
      entries: structuredClone(bbStartingDeck.entries),
      attributeCounts: {
        strength: 3,
        agility: 2,
        magecraft: 5,
        special: 2,
      },
    },
    skillCardIds: [
      'servant.bb.skill.domina_cornam',
      'servant.bb.skill.aurea_porc_pocua',
      'servant.bb.skill.cursed_cupid_cleanser',
    ],
    linkedCards: {},
    capability: { status: 'HOST_ADJUDICATED' },
    source: structuredClone(source),
  };
}

function makeValidPack(): ContentPack {
  return {
    id: 'fd-playtest-v1',
    name: 'FD Playtest V1',
    version: 1,
    servants: [makeValidServant()],
    masters: [],
    cards: [],
    eventSets: [],
  };
}

describe('playtest content pack contract', () => {
  it('accepts a servant whose physical deck count is exactly twelve', () => {
    expect(validateServantDefinition(makeValidServant())).toEqual([]);
  });

  it('rejects a servant deck whose copies do not total twelve', () => {
    const servant = makeValidServant();
    servant.startingDeck.entries[0]!.copies += 1;

    expect(validateServantDefinition(servant)).toContainEqual(
      expect.objectContaining({ code: 'SERVANT_DECK_SIZE' }),
    );
  });

  it('counts a named magecraft card as magecraft rather than special', () => {
    expect(computeAttributeCounts(bbStartingDeck.entries)).toEqual({
      strength: 3,
      agility: 2,
      magecraft: 5,
      special: 2,
    });
  });

  it('requires exactly three unique servant skill IDs', () => {
    const servant = makeValidServant();
    servant.skillCardIds = [
      'servant.bb.skill.domina_cornam',
      'servant.bb.skill.domina_cornam',
      'servant.bb.skill.cursed_cupid_cleanser',
    ];

    expect(validateServantDefinition(servant)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SERVANT_SKILL_IDS_UNIQUE' }),
      ]),
    );
  });

  it('rejects duplicate entity IDs across the pack', () => {
    const pack = makeValidPack();
    pack.cards.push({
      id: pack.servants[0]!.id,
      name: 'Duplicate ID',
      cardType: 'servant_overview',
      capability: { status: 'FULL' },
      source: structuredClone(source),
    });

    expect(validateContentPack(pack)).toContainEqual(
      expect.objectContaining({ code: 'DUPLICATE_ENTITY_ID' }),
    );
  });

  it('rejects capability statuses outside the supported vocabulary', () => {
    const servant = makeValidServant();
    servant.capability.status = 'UNKNOWN' as 'FULL';

    expect(validateServantDefinition(servant)).toContainEqual(
      expect.objectContaining({ code: 'CAPABILITY_STATUS' }),
    );
  });

  it.each(['htmPath', 'imagePath'] as const)(
    'requires source %s to be a non-empty path',
    (field) => {
      const servant = makeValidServant();
      servant.source[field] = '   ';

      expect(validateServantDefinition(servant)).toContainEqual(
        expect.objectContaining({ code: 'SOURCE_PATH' }),
      );
    },
  );

  it('accepts a reviewed situation card with an explicit timing and public interaction', () => {
    const card: NamedCardDefinition = {
      id: 'situation.sample',
      name: '示例局势',
      cardType: 'situation',
      printedText: '回合开始时，所有玩家获得1点魔力。',
      timing: ['round_start'],
      interactions: [{ kind: 'automatic', visibility: 'public' }],
      effects: [{ type: 'shared_mana_reward', amount: 1 }],
      capability: { status: 'FULL' },
      source: structuredClone(source),
    };

    expect(validateNamedCardDefinition(card)).toEqual([]);
  });

  it('rejects an effect-bearing card whose operation timing is missing', () => {
    const card: NamedCardDefinition = {
      id: 'event.missing_timing',
      name: '缺少时点',
      cardType: 'event',
      printedText: '玩家移动至此战场时，获得+1合计威力。',
      interactions: [{ kind: 'triggered', visibility: 'public' }],
      effects: [{ type: 'presence_bonus', amount: 1 }],
      capability: { status: 'FULL' },
      source: structuredClone(source),
    };

    expect(validateNamedCardDefinition(card)).toContainEqual(
      expect.objectContaining({ code: 'CARD_TIMING_REQUIRED' }),
    );
  });

  it('rejects unsupported interaction kinds instead of silently guessing', () => {
    const card: NamedCardDefinition = {
      id: 'servant.sample.skill',
      name: '示例技能',
      cardType: 'servant_skill',
      printedText: '行动阶段：选择一名玩家。',
      timing: ['action'],
      interactions: [{ kind: 'guess' as 'activated', visibility: 'private' }],
      effects: [{ type: 'choose_player' }],
      capability: { status: 'PARTIAL' },
      source,
    };

    expect(validateNamedCardDefinition(card)).toContainEqual(
      expect.objectContaining({ code: 'CARD_INTERACTION_KIND' }),
    );
  });
});
