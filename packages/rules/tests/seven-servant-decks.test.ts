import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { createMatchSession } from '../src/match-session';

const expectedDecks: Record<string, string[]> = {
  'servant.achilles': [
    'basic.strength.2',
    'basic.strength.3',
    'basic.strength.4',
    'basic.strength.5',
    'basic.agility.2',
    'basic.agility.3',
    'basic.agility.4',
    'basic.agility.4',
    'basic.agility.5',
    'basic.luck',
    'basic.surveil',
    'basic.surveil',
  ],
  'servant.artoria-alt': [
    'basic.strength.2',
    'basic.strength.3',
    'basic.strength.4',
    'basic.strength.5',
    'basic.strength.5',
    'basic.strength.5',
    'basic.agility.2',
    'basic.magecraft.2',
    'basic.magecraft.2',
    'basic.magecraft.3',
    'basic.luck',
    'basic.surveil',
  ],
  'servant.artoriac': [
    'basic.agility.2',
    'basic.agility.2',
    'basic.agility.3',
    'basic.magecraft.2',
    'basic.magecraft.3',
    'basic.magecraft.3',
    'basic.magecraft.4',
    'basic.magecraft.4',
    'basic.magecraft.5',
    'servant.artoriac.skill.sc-artoriac-4',
    'servant.artoriac.skill.sc-artoriac-5',
    'servant.artoriac.skill.sc-artoriac-6',
  ],
  'servant.drake': [
    'basic.strength.2',
    'basic.strength.3',
    'basic.strength.3',
    'basic.agility.2',
    'basic.agility.3',
    'basic.agility.3',
    'basic.agility.4',
    'basic.agility.5',
    'basic.luck',
    'basic.surveil',
    'basic.surveil',
    'basic.surveil',
  ],
  'servant.ereshkigal': [
    'basic.strength.2',
    'basic.strength.4',
    'basic.agility.2',
    'basic.agility.3',
    'basic.agility.3',
    'basic.agility.4',
    'basic.magecraft.2',
    'basic.magecraft.4',
    'basic.magecraft.5',
    'basic.luck',
    'basic.preparation',
    'basic.preparation',
  ],
  'servant.kintoki': [
    'basic.strength.2',
    'basic.strength.3',
    'basic.strength.5',
    'basic.strength.5',
    'basic.strength.5',
    'basic.strength.5',
    'basic.agility.2',
    'basic.agility.2',
    'basic.agility.4',
    'basic.agility.5',
    'basic.luck',
    'basic.luck',
  ],
  'servant.tomoe': [
    'basic.strength.3',
    'basic.strength.4',
    'basic.strength.5',
    'basic.strength.5',
    'basic.agility.2',
    'basic.agility.2',
    'basic.agility.3',
    'basic.agility.3',
    'basic.agility.4',
    'basic.luck',
    'basic.surveil',
    'basic.preparation',
  ],
};

const archivePaths: Record<string, string> = {
  'servant.achilles': 'data/authoring/servants/servant.achilles.json',
  'servant.artoria-alt': 'data/authoring/servants/servant.artoria-alt.json',
  'servant.artoriac': 'data/authoring/servants/servant.artoriac.json',
  'servant.drake': 'data/authoring/servants/servant.drake.json',
  'servant.ereshkigal': 'data/authoring/servants/servant.ereshkigal.json',
  'servant.kintoki': 'data/authoring/servants/servant.kintoki.json',
  'servant.tomoe': 'data/authoring/servants/servant.tomoe.json',
};

function deckEntryToDefinitionIds(entry: { cardId: string; count?: number }): string[] {
  const lower = entry.cardId.toLowerCase();
  const count = entry.count ?? 1;
  let definitionId = 'basic.strength.2';
  if (lower === 'card.x-pilgrimcall') definitionId = 'servant.artoriac.skill.sc-artoriac-4';
  else if (lower === 'card.x-pilgrimrespite') definitionId = 'servant.artoriac.skill.sc-artoriac-5';
  else if (lower === 'card.x-pilgrimdestiny') definitionId = 'servant.artoriac.skill.sc-artoriac-6';
  else if (lower.includes('cardluck')) definitionId = 'basic.luck';
  else if (lower.includes('cardsurveil')) definitionId = 'basic.surveil';
  else if (lower.includes('cardpreparation')) definitionId = 'basic.preparation';
  else {
    const power = Number(lower.match(/card[abq](\d+)/)?.[1] ?? 2);
    const attribute = lower.includes('cardq') ? 'agility' : lower.includes('carda') ? 'magecraft' : 'strength';
    definitionId = `basic.${attribute}.${power}`;
  }
  return Array.from({ length: count }, () => definitionId);
}

function expectedFromArchiveDeck(servantId: string): string[] {
  const raw = JSON.parse(readFileSync(archivePaths[servantId]!, 'utf8'));
  return raw.deck.flatMap(deckEntryToDefinitionIds).sort();
}

describe('seven servant overview deck projections', () => {
  it('keeps every servant authoring deck aligned with the reviewed overview card', () => {
    for (const [servantId, expected] of Object.entries(expectedDecks)) {
      expect(expectedFromArchiveDeck(servantId), servantId).toEqual([...expected].sort());
    }
  });

  it('instantiates every servant starting deck into the match session without legacy fallback drift', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerId: 'p1' });
    for (const pairing of session.pairings) {
      const expected = expectedDecks[pairing.servant.id];
      expect(expected, pairing.servant.id).toBeTruthy();
      const actual = session.state.cards
        .filter((card) => card.ownerPlayerId === pairing.playerId && ['hand', 'deck'].includes(card.zone))
        .map((card) => card.definitionId)
        .sort();
      expect(actual, pairing.servant.id).toEqual([...expected!].sort());
    }
  });
});
