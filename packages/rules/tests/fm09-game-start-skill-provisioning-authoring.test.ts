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
const targetText: Record<string, string> = {
  'master.bazett.skill.s2': '<每局游戏限一次>\n先发后至-下一次一名与你位于同一战场的对手使用宝具时，令其【败北】。',
  'master.ciel.skill.s2': '你拥有的魔力少于8点也可以打出此牌。\n驱魔-战斗阶段：若你赢得一场未进行争夺战的战斗，获得等于你地利位置数的战果。\n神职便利-战斗阶段：若你位于侦查，获得2点魔力。',
  'master.fujino.skill.s3': '此牌需追加打出。\n歪曲吧！-行动阶段：激活【扭曲空间】。',
  'master.shiki-ryougi.skill.s2': '此牌需追加打出。若此牌与【死・紧握】一同打出，其+2魔力消耗。\n战斗阶段：选择一张你战斗中的非技能攻击，若其印刷威力与其所有者牌库底部的牌相同，弃置这两张牌。',
  'master.shiki-ryougi.skill.s3': '此牌需追加打出。\n行动阶段：查看一名与你位于同一战场的玩家的手牌，你可将其中一张牌洗回其所有者的牌库。',
  'master.shiki-tohno.skill.s2': '此牌需追加打出。\n血滴-你需花费1点战果来打出此牌。\n共融-战斗阶段：随机展示一名你交战对手弃牌堆的至多3张牌，你可以选择其中的一张基础牌与你控制或手牌的一张基础牌交换。',
  'card.derived.master.shirou-emiya.ganjiang-moye': '（你的魔力需要达到8点才能打出此牌）投影-此牌需追加打出。',
};

function loaded() {
  return loadPlaytestContentPack(packPath, { workspaceRoot: '.' });
}

describe('P3-FM09 corrected shared game-start skill provisioning', () => {
  it('uses the normal plus explicit rules channels and exposes 7 sources', () => {
    const manifest = JSON.parse(readFileSync(packPath, 'utf8')) as any;
    expect(manifest.authoringMasterFiles.filter((file: string) => file.includes('.fm09.json'))).toHaveLength(3);
    expect(manifest.authoringMasterRuleFiles).toEqual([
      'data/authoring/masters/master.ciel.json',
      'data/authoring/masters/master.shiki-ryougi.json',
      'data/authoring/masters/master.shirou-emiya.json',
    ]);
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
    for (const card of archives.flatMap((archive: any) => archive.cards)) {
      if (targetText[card.id]) expect(card.printedText).toBe(targetText[card.id]);
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
