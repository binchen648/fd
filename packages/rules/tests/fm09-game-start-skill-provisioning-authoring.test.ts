import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { loadPlaytestContentPack } from '@fd/content';
import * as rules from '../src/index';

const packPath = 'data/packs/fd-playtest-v1/pack.json';
const sourceIds = [
  'master.bazett.skill.s1', 'master.ciel.skill.s1a', 'master.fujino.skill.s1',
  'master.shiki-ryougi.skill.s1', 'master.shiki-ryougi.skill.s1a',
  'master.shiki-tohno.skill.s1', 'master.shirou-emiya.skill.s2',
];
const frozenTargetIds = [
  'master.bazett.skill.s2', 'master.ciel.skill.s2', 'master.fujino.skill.s3',
  'master.shiki-ryougi.skill.s2', 'master.shiki-ryougi.skill.s3', 'master.shiki-tohno.skill.s2',
];
const derivedTargetId = 'card.derived.master.shirou-emiya.ganjiang-moye';
const locators: Record<string, string> = {
  'master.bazett.skill.s1': 'masters[16].skills[0].text#line=1',
  'master.ciel.skill.s1a': 'masters[24].skills[1].text#line=1',
  'master.fujino.skill.s1': 'masters[65].skills[0].text#line=1',
  'master.shiki-ryougi.skill.s1': 'masters[64].skills[0].text#line=1',
  'master.shiki-ryougi.skill.s1a': 'masters[64].skills[1].text#line=1',
  'master.shiki-tohno.skill.s1': 'masters[27].skills[0].text#line=1',
  'master.shirou-emiya.skill.s2': 'masters[2].skills[1].text#line=1',
};
const sourceText: Record<string, string> = {
  'master.bazett.skill.s1': '将【佛拉格拉克】加入你的技能区。',
  'master.ciel.skill.s1a': '将【火葬式典】加入你的技能区。',
  'master.fujino.skill.s1': '将一张【歪曲之魔眼】加入你的技能区。',
  'master.shiki-ryougi.skill.s1': '游戏开始时，将【生・切断】加入你的技能区。',
  'master.shiki-ryougi.skill.s1a': '游戏开始时，将【死・紧握】加入你的技能区。',
  'master.shiki-tohno.skill.s1': '将【侵蚀】加入你的技能区。',
  'master.shirou-emiya.skill.s2': '将【干将·莫邪】加入你的技能区。',
};

function loaded() {
  return loadPlaytestContentPack(packPath, { workspaceRoot: '.' });
}

describe('P3-FM09 corrected shared game-start skill provisioning', () => {
  it('uses the formal authoringMasterFiles loader path and exposes 7 sources', () => {
    const manifest = JSON.parse(readFileSync(packPath, 'utf8')) as any;
    expect(manifest.authoringMasterRuleFiles).toBeUndefined();
    expect(manifest.authoringMasterFiles.filter((file: string) => file.includes('.fm09.json'))).toHaveLength(6);
    const pack = loaded();
    const ids = new Set(pack.authoringArchives.flatMap((archive: any) => archive.cards).map((card: any) => card.id));
    expect(sourceIds.every((id) => ids.has(id))).toBe(true);
    expect(frozenTargetIds.every((id) => ids.has(id))).toBe(true);
    expect(ids.has(derivedTargetId)).toBe(true);
  });

  it('keeps only six frozen targets in the 944 denominator; derived Shirou is separate', () => {
    expect(frozenTargetIds).toHaveLength(6);
    const pack = loaded();
    const archives = pack.authoringArchives;
    const sources = archives.flatMap((archive: any) => archive.cards).filter((card: any) => sourceIds.includes(card.id));
    expect(sources).toHaveLength(7);
    for (const source of sources) {
      const archive = archives.find((entry: any) => entry.cards.some((card: any) => card.id === source.id))!;
      expect(rules.isGameStartSkillProvisioningSemantic(rules.loadAuthoringJson(archive).cards[source.id]!.abilities[0])).toBe(true);
      expect(source.phase3Evidence.f1ClauseSources[0].locator).toBe(locators[source.id]);
      expect(source.printedText).toBe(sourceText[source.id]);
      expect(source.phase3Evidence.referenceStaticMetadata).toMatchObject({ cost: null, basePower: null, legacyRequirement: null, typeLabel: '被动' });
      expect(source.phase3Evidence.f1SourceReferences).toHaveLength(2);
      expect(source.phase3Evidence.f1SourceReferences[0].kind).toBe('development-image');
      expect(source.phase3Evidence.f1SourceReferences[1].kind).toBe('legacy');
    }
  });

  it('does not reclassify Caules/Nanaya/Zouken or Fujino s2 as shared provisioning', () => {
    const ids = new Set(loaded().authoringArchives.flatMap((archive: any) => archive.cards).map((card: any) => card.id));
    expect(ids.has('master.caules.skill.s1')).toBe(false);
    expect(ids.has('master.shiki-nanaya.skill.s1')).toBe(false);
    expect(ids.has('master.zouken.skill.s2')).toBe(false);
    expect(ids.has('master.fujino.skill.s2')).toBe(false);
  });
});
