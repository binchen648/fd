import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  approvedAuthoringMasterIds,
  approvedAuthoringServantIds,
  resolveCardImageUrl,
  resolveEntityImageUrl,
  resolvePublicAssetPath,
} from './fd-asset-registry';
import { fdRealAssetManifest } from './fd-asset-manifest';
import { loadPlaytestClientFixture } from './playtest-fixture-loader';
import { createSevenAuthoringMatchSession, loadSevenAuthoringSmokeFixture, projectSevenAuthoringSessionFixture } from './seven-authoring-smoke-fixture';

function publicAssetFile(url: string): string {
  const publicPath = resolvePublicAssetPath(url);
  if (!publicPath) throw new Error(`Expected public asset URL, got ${url}`);
  return resolve(__dirname, '../../public', publicPath);
}

function expectAssetExists(url: string): void {
  expect(existsSync(publicAssetFile(url)), url).toBe(true);
}

const expectedServantDeckEntries: Record<string, string[]> = {
  'servant.achilles': [
    'basic:strength:2:1',
    'basic:strength:3:1',
    'basic:strength:4:1',
    'basic:strength:5:1',
    'basic:agility:2:1',
    'basic:agility:3:1',
    'basic:agility:4:2',
    'basic:agility:5:1',
    'named:basic.luck:1',
    'named:basic.surveil:2',
  ],
  'servant.artoria-alt': [
    'basic:strength:2:1',
    'basic:strength:3:1',
    'basic:strength:4:1',
    'basic:strength:5:3',
    'basic:agility:2:1',
    'basic:magecraft:2:2',
    'basic:magecraft:3:1',
    'named:basic.luck:1',
    'named:basic.surveil:1',
  ],
  'servant.artoriac': [
    'basic:agility:2:2',
    'basic:agility:3:1',
    'basic:magecraft:2:1',
    'basic:magecraft:3:2',
    'basic:magecraft:4:2',
    'basic:magecraft:5:1',
    'named:servant.artoriac.skill.sc-artoriac-4:1',
    'named:servant.artoriac.skill.sc-artoriac-5:1',
    'named:servant.artoriac.skill.sc-artoriac-6:1',
  ],
  'servant.drake': [
    'basic:strength:2:1',
    'basic:strength:3:2',
    'basic:agility:2:1',
    'basic:agility:3:2',
    'basic:agility:4:1',
    'basic:agility:5:1',
    'named:basic.luck:1',
    'named:basic.surveil:3',
  ],
  'servant.ereshkigal': [
    'basic:strength:2:1',
    'basic:strength:4:1',
    'basic:agility:2:1',
    'basic:agility:3:2',
    'basic:agility:4:1',
    'basic:magecraft:2:1',
    'basic:magecraft:4:1',
    'basic:magecraft:5:1',
    'named:basic.luck:1',
    'named:basic.preparation:2',
  ],
  'servant.kintoki': [
    'basic:strength:2:1',
    'basic:strength:3:1',
    'basic:strength:5:4',
    'basic:agility:2:2',
    'basic:agility:4:1',
    'basic:agility:5:1',
    'named:basic.luck:2',
  ],
  'servant.tomoe': [
    'basic:strength:3:1',
    'basic:strength:4:1',
    'basic:strength:5:2',
    'basic:agility:2:2',
    'basic:agility:3:2',
    'basic:agility:4:1',
    'named:basic.luck:1',
    'named:basic.surveil:1',
    'named:basic.preparation:1',
  ],
};

function deckEntryKey(entry: { entryType: string; attribute: string; printedValue?: number | string; cardId?: string; copies: number }): string {
  return entry.entryType === 'named'
    ? `named:${entry.cardId}:${entry.copies}`
    : `basic:${entry.attribute}:${entry.printedValue}:${entry.copies}`;
}

function readAuthoringArchives(kind: 'masters' | 'servants'): Array<{
  id: string;
  cards: Array<{ id: string; cardType: string }>;
}> {
  const directory = resolve(__dirname, '../../../../data/authoring', kind);
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(resolve(directory, name), 'utf8')));
}

describe('FD asset registry', () => {
  it('covers the approved seven authoring masters and seven authoring servants', () => {
    expect(approvedAuthoringMasterIds).toHaveLength(7);
    expect(approvedAuthoringServantIds).toHaveLength(7);

    for (const id of approvedAuthoringMasterIds) {
      expectAssetExists(resolveEntityImageUrl('master', id));
      expectAssetExists(resolveCardImageUrl({ definitionId: id, cardType: 'master_overview' }));
    }

    for (const id of approvedAuthoringServantIds) {
      expectAssetExists(resolveEntityImageUrl('servant', id));
      expectAssetExists(resolveCardImageUrl({ definitionId: id, cardType: 'servant_overview' }));
    }
  });

  it('keeps the imported CHM real-asset manifest loadable', () => {
    expect(Object.keys(fdRealAssetManifest.entities)).toHaveLength(14);
    expect(Object.keys(fdRealAssetManifest.cards).length).toBeGreaterThanOrEqual(50);

    for (const url of [
      ...Object.values(fdRealAssetManifest.entities),
      ...Object.values(fdRealAssetManifest.cards),
    ]) {
      expectAssetExists(url);
    }
  });

  it('gives every seven-authoring projected card either a loadable image URL or a public event text face', () => {
    const fixture = loadSevenAuthoringSmokeFixture();

    expect(fixture.players).toHaveLength(7);
    for (const player of fixture.players) {
      expect(player.masterImageUrl, player.masterName).toBeTruthy();
      expect(player.servantImageUrl, player.servantName).toBeTruthy();
      expectAssetExists(player.masterImageUrl!);
      expectAssetExists(player.servantImageUrl!);
    }

    const missing = fixture.cards.filter((card) => !card.imageUrl);
    expect(missing.every((card) => card.cardType === '事件牌' && card.visibility === '公开')).toBe(true);
    for (const card of fixture.cards.filter((card) => card.imageUrl)) expectAssetExists(card.imageUrl!);

    expect(fixture.self.servantDeckGuideCardId).toBeTruthy();
    const servantDeckGuide = fixture.cards.find((card) => card.instanceId === fixture.self.servantDeckGuideCardId);
    expect(servantDeckGuide).toMatchObject({
      cardType: '从者牌库说明',
      visibility: '仅本人',
    });
    expectAssetExists(servantDeckGuide!.imageUrl!);

    for (const id of ['basic.preparation', 'basic.surveil', 'basic.luck']) {
      expectAssetExists(resolveCardImageUrl({ definitionId: id, cardType: 'basic_attack' }));
    }
    expect(fixture.self.deck.entries.reduce((sum, entry) => sum + entry.copies, 0)).toBe(12);
  });

  it('projects every servant starting deck from the reviewed overview cards', () => {
    const session = createSevenAuthoringMatchSession();
    for (const pairing of session.pairings) {
      const fixture = projectSevenAuthoringSessionFixture(session, pairing.playerId);
      const servantDeckGuide = fixture.cards.find((card) => card.instanceId === fixture.self.servantDeckGuideCardId);

      expect(fixture.self.deck.entries.map(deckEntryKey).sort(), pairing.servant.id).toEqual([...expectedServantDeckEntries[pairing.servant.id]!].sort());
      expect(servantDeckGuide?.rulesSummaryZh, pairing.servant.id).toContain('初始牌库构成');
    }
  });

  it('projects Maiya Support Shot as a master skill card in her player workbench', () => {
    const session = createSevenAuthoringMatchSession();
    const maiyaPairing = session.pairings.find((pairing) => pairing.master.id === 'master.maiya')!;
    const fixture = projectSevenAuthoringSessionFixture(session, maiyaPairing.playerId);
    const supportShot = fixture.self.masterSkills
      ?.map((id) => fixture.cards.find((card) => card.instanceId === id))
      .find((card) => card?.definitionId === 'master.maiya.deck.support-shot');

    expect(supportShot).toMatchObject({
      name: '援护射击',
      cardType: '御主技能',
      visibility: '仅本人',
    });
  });

  it('shows backend target-window notes in inspectable skill descriptions', () => {
    const session = createSevenAuthoringMatchSession();
    const ereshPairing = session.pairings.find((pairing) => pairing.servant.id === 'servant.ereshkigal')!;
    const fixture = projectSevenAuthoringSessionFixture(session, ereshPairing.playerId);
    const battleContinuation = fixture.cards.find((card) => card.definitionId === 'servant.ereshkigal.skill.sc-ereshkigal-1');

    expect(battleContinuation?.rulesSummaryZh).toContain('移动至除魔术工房外');
    expect(battleContinuation?.rulesSummaryZh).toContain('系统目标窗口：可选择除魔术工房外的地点');
    expect(battleContinuation?.rulesSummaryZh).toContain('不会包含当前所在地');
  });

  it('resolves every card in the approved authoring archives', () => {
    const archives = [...readAuthoringArchives('masters'), ...readAuthoringArchives('servants')];

    expect(archives.map((archive) => archive.id).sort()).toEqual([
      ...approvedAuthoringMasterIds,
      ...approvedAuthoringServantIds,
    ].sort());

    for (const archive of archives) {
      expectAssetExists(resolveCardImageUrl({
        definitionId: archive.id,
        cardType: archive.id.startsWith('master.') ? 'master_overview' : 'servant_overview',
      }));
      for (const card of archive.cards) {
        expectAssetExists(resolveCardImageUrl({ definitionId: card.id, cardType: card.cardType }));
      }
    }
  });

  it('keeps the generated playtest fixture free of broken card art URLs', () => {
    const fixture = loadPlaytestClientFixture();

    for (const player of fixture.players) {
      expectAssetExists(player.masterImageUrl!);
      expectAssetExists(player.servantImageUrl!);
    }
    for (const card of fixture.cards) expectAssetExists(card.imageUrl!);
  });
});
