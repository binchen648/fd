import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';

const cases = [
  {
    archivePath: 'data/authoring/servants/servant.achilles.json',
    htmPath: 'D:/fd/chm-extract/阿喀琉斯.htm',
    id: 'servant.achilles',
    className: 'Rider',
    cardIds: [
      'servant.achilles.skill.sc-achilles-1',
      'servant.achilles.skill.sc-achilles-2',
      'servant.achilles.skill.sc-achilles-3',
    ],
    cardNames: ['勇者的不凋花', '包围苍天的小世界', '驰骋天际星之枪尖'],
    cardImageIndexes: [1, 2, 3],
    htmImages: [
      'ScreenShot_2025-11-01_164211_781.png',
      'ScreenShot_2025-11-01_164221_598.png',
      'ScreenShot_2025-11-01_164226_270.png',
      'ScreenShot_2025-11-01_164216_582.png',
    ],
    fullySupported: true,
  },
  {
    archivePath: 'data/authoring/servants/servant.artoria-alt.json',
    htmPath: 'D:/fd/chm-extract/阿尔托莉雅·潘德拉贡[Alter.htm',
    id: 'servant.artoria-alt',
    aliases: ['servant.artoria-alter'],
    className: 'Saber',
    cardIds: [
      'servant.artoria-alt.skill.sc-artoria-alt-1',
      'servant.artoria-alt.skill.sc-artoria-alt-2',
      'servant.artoria-alt.skill.sc-artoria-alt-3',
    ],
    cardNames: ['誓约胜利之剑', '黑化诅咒', '对魔力（saber class）'],
    cardImageIndexes: [3, 1, 2],
    htmImages: [
      'ScreenShot_2025-10-31_184732_494.png',
      'ScreenShot_2025-10-31_184743_358.png',
      'ScreenShot_2025-10-31_183120_208.png',
      'ScreenShot_2025-10-31_184737_374.png',
    ],
    fullySupported: true,
  },
  {
    archivePath: 'data/authoring/servants/servant.ereshkigal.json',
    htmPath: 'D:/fd/chm-extract/埃列什基伽勒.htm',
    id: 'servant.ereshkigal',
    className: 'Lancer',
    cardIds: [
      'servant.ereshkigal.skill.sc-ereshkigal-1',
      'servant.ereshkigal.skill.sc-ereshkigal-2',
      'servant.ereshkigal.skill.sc-ereshkigal-3',
    ],
    cardNames: ['战斗续行（Lancer Class）', '冥界佑护', '灵峰踏抱冥府之鞴'],
    cardImageIndexes: [2, 1, 3],
    htmImages: [
      'ScreenShot_2025-11-01_111906_400.png',
      'ScreenShot_2025-11-01_111916_240.png',
      'ScreenShot_2025-10-30_192743_490.png',
      'ScreenShot_2025-11-01_111911_088.png',
    ],
    fullySupported: true,
  },
  {
    archivePath: 'data/authoring/servants/servant.tomoe.json',
    htmPath: 'D:/fd/chm-extract/巴御前.htm',
    id: 'servant.tomoe',
    aliases: ['servant.bae'],
    className: 'Archer',
    cardIds: [
      'servant.tomoe.skill.sc-tomoe-1',
      'servant.tomoe.skill.sc-tomoe-2',
      'servant.tomoe.skill.sc-tomoe-3',
    ],
    cardNames: ['单独行动（Archer Class）', '鬼种之魔', '真言·圣观世音菩萨'],
    cardImageIndexes: [2, 1, 3],
    htmImages: [
      'ScreenShot_2025-11-01_160023_403.png',
      'ScreenShot_2025-11-01_160032_219.png',
      'ScreenShot_2025-10-30_192733_130.png',
      'ScreenShot_2025-11-01_160027_891.png',
    ],
    fullySupported: true,
  },
  {
    archivePath: 'data/authoring/servants/servant.kintoki.json',
    htmPath: 'D:/fd/chm-extract/坂田金时.htm',
    id: 'servant.kintoki',
    className: 'Berserker',
    cardIds: [
      'servant.kintoki.skill.sc-kintoki-1',
      'servant.kintoki.skill.sc-kintoki-2',
      'servant.kintoki.skill.sc-kintoki-3',
    ],
    cardNames: ['黄金冲击', '黄金冲击', '黄金噬者'],
    cardImageIndexes: [2, 3, 1],
    htmImages: [
      'ScreenShot_2025-11-02_112043_708.png',
      'ScreenShot_2025-11-02_112048_572.png',
      'ScreenShot_2025-11-02_112053_949.png',
      'ScreenShot_2025-11-02_112053_949.png',
    ],
    fullySupported: true,
  },
] as const;

function archive(path: string) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function htmlImageNames(path: string): string[] {
  return [...readFileSync(path, 'utf8').matchAll(/ScreenShot_[^"<>]+?\.png/g)].map(m => m[0]);
}

describe('five servant authoring archives', () => {
  it.each(cases)('matches canonical identity, card order and HTM image evidence for $id', spec => {
    expect(existsSync(spec.archivePath), `${spec.archivePath} must exist`).toBe(true);
    expect(htmlImageNames(spec.htmPath)).toEqual(spec.htmImages);
    const raw = archive(spec.archivePath);
    expect(raw.id).toBe(spec.id);
    if ('aliases' in spec) expect(raw.aliases).toEqual(expect.arrayContaining(spec.aliases));
    expect(raw.class).toBe(spec.className);
    expect(raw.sources.find((s: any) => s.id === 'chm_page')).toMatchObject({ path: spec.htmPath });
    expect(raw.cards.map((c: any) => c.id)).toEqual(spec.cardIds);
    expect(raw.cards.map((c: any) => c.name)).toEqual(spec.cardNames);
    expect(raw.cards.every((c: any) => c.cardType === 'servant_skill')).toBe(true);
    for (const [index, card] of raw.cards.entries()) {
      expect(card.owner).toMatchObject({ type: 'servant', id: spec.id });
      expect(card.evidence.some((e: any) => e.type === 'original_card_image' && e.imageIndex === spec.cardImageIndexes[index] && existsSync(e.path))).toBe(true);
      expect(card.abilities.length).toBeGreaterThan(0);
      expect(card.abilities.every((a: any) => card.printedText.includes(a.printedClause))).toBe(true);
    }
  });

  it('fails closed for every target archive while unsupported mechanics remain', () => {
    for (const spec of cases) {
      const raw = archive(spec.archivePath);
      const pack = rules.loadAuthoringJson(raw);
      const report = rules.buildAuthoringAdapterReport(pack, raw, spec.archivePath);
      expect(report.summary.cards).toBe(spec.cardIds.length);
      expect(report.summary.automatic).toBeLessThanOrEqual(raw.cards.flatMap((card: any) => card.abilities).filter((ability: any) => ability.execution?.mode === 'automatic').length);
      if ('fullySupported' in spec && spec.fullySupported) {
        expect(report.summary.unsupported).toBe(0);
        expect(report.cards.every(card => card.status === 'automatic')).toBe(true);
      } else {
        expect(report.summary.unsupported).toBeGreaterThan(0);
        expect(report.cards.some(card => card.status !== 'automatic')).toBe(true);
      }
    }
  });

  it('keeps Ereshkigal deck aligned with the reviewed overview card', () => {
    const raw = archive('data/authoring/servants/servant.ereshkigal.json');
    expect(raw.deck.map((entry: any) => [entry.cardId, entry.count ?? 1])).toEqual([
      ['card.cardb2', 1],
      ['card.cardb4', 1],
      ['card.cardq2', 1],
      ['card.cardq3', 2],
      ['card.cardq4', 1],
      ['card.carda2', 1],
      ['card.carda4', 1],
      ['card.carda5', 1],
      ['card.cardluck', 1],
      ['card.cardpreparation', 2],
    ]);
  });
});
