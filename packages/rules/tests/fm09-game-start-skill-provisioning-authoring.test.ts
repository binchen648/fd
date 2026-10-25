import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { loadPlaytestContentPack } from '@fd/content';
import { compileLoadedPlaytestPack } from '@fd/content';
import { compileExecutableCardPack } from '../src/ability/executable-card-pack';
import * as rules from '../src/index';

const packPath = 'data/packs/fd-playtest-v1/pack.json';
const sourceIds = [
  'master.bazett.skill.s1', 'master.caules.skill.s1', 'master.ciel.skill.s1a',
  'master.fujino.skill.s1', 'master.shiki-nanaya.skill.s1',
  'master.shiki-ryougi.skill.s1', 'master.shiki-ryougi.skill.s1a',
  'master.shiki-tohno.skill.s1', 'master.shirou-emiya.skill.s2', 'master.zouken.skill.s2',
];
const targetIds = [
  'master.bazett.skill.s2', 'master.caules.skill.s2', 'master.caules.skill.s3',
  'master.ciel.skill.s2', 'master.fujino.skill.s2', 'master.fujino.skill.s3',
  'master.shiki-nanaya.skill.s2', 'master.shiki-ryougi.skill.s2',
  'master.shiki-ryougi.skill.s3', 'master.shiki-tohno.skill.s2',
  'master.zouken.skill.s3', 'master.zouken.skill.s4',
];

describe('P3-FM09 exact game-start skill provisioning authoring', () => {
  it('wires the nine rules-only archives and exact ten sources', () => {
    const manifest = JSON.parse(readFileSync(packPath, 'utf8')) as any;
    expect(manifest.authoringMasterRuleFiles).toHaveLength(9);
    const cards = manifest.authoringMasterRuleFiles.flatMap((file: string) => JSON.parse(readFileSync(file, 'utf8')).cards);
    const sources = cards.filter((card: any) => sourceIds.includes(card.id));
    expect(sources.map((card: any) => card.id).sort()).toEqual([...sourceIds].sort());
    expect(targetIds.every((id) => cards.some((card: any) => card.id === id))).toBe(true);
    expect(cards.some((card: any) => card.id === 'card.derived.master.shirou-emiya.ganjiang-moye')).toBe(true);
  });

  it('classifies every source as identity-free automatic game_start provisioning', () => {
    const manifest = JSON.parse(readFileSync(packPath, 'utf8')) as any;
    for (const file of manifest.authoringMasterRuleFiles) {
      const pack = rules.loadAuthoringJson(JSON.parse(readFileSync(file, 'utf8')));
      expect(pack.report).toEqual([]);
      for (const card of Object.values(pack.cards) as any[]) {
        if (!sourceIds.includes(card.id)) continue;
        const ability = card.abilities[0];
        expect(rules.isGameStartSkillProvisioningSemantic(ability)).toBe(true);
      }
    }
  });

  it('compiles all twelve provisioning targets as deferred owner-matched master skills', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot: '.' });
    const library = compileLoadedPlaytestPack(loaded).library;
    const executable = compileExecutableCardPack(library);
    for (const id of [...sourceIds, ...targetIds, 'card.derived.master.shirou-emiya.ganjiang-moye']) {
      expect(executable.cards[id]).toMatchObject({ cardType: 'master_skill', mode: 'automatic' });
    }
  });
});
