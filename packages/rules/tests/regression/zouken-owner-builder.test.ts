import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '@fd/content';
import * as rules from '../../src/index';
import { compileExecutableCardPack } from '../../src/ability/executable-card-pack';

const SOURCE_ARCHIVE_PATH = 'data/authoring/masters/master.zouken-source-candidates.json';
const ACTIVE_ARCHIVE_PATH = 'data/authoring/masters/master.zouken.json';
const PACK_PATH = 'data/packs/fd-playtest-v1/pack.json';
const IDs = [
  'master.zouken.skill.ascension',
  'master.zouken.skill.s1',
  'master.zouken.skill.s2',
  'master.zouken.skill.s3',
  'master.zouken.skill.s4',
  'master.zouken.skill.s5',
] as const;
const TEXT_SHA: Record<string, string> = {
  ascension: '6bec5e2443f416546ea830907c255e87b2ad2d9cad9ddb12dfd8436c0b0ee7b7',
  s1: '2d006d8244b028397a5c341b2a37dd634616152d15afcd708aea3163e2b88945',
  s2: '8b8f4b24424a8600807fd42c0965fad94bd6f9dcdc9917efe10f1bff8b17f3e3',
  s3: 'cea95dc5010d588158e85f29d23cbbfa92f4a3211825312a12d0f641b7648b44',
  s4: '3b66cc0b2d7c1e95bdd02b34e62de54f5383e53b20a736b69cb023f3388f2f49',
  s5: '1bfe9fda4911dd95b0e6ef1462140b1d7e20cdacdd03df524fae374509bc668f',
};

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('Zouken Builder owner provenance and runtime boundary', () => {
  it('binds exactly six source-grounded cards with stable text hashes and art provenance', () => {
    const archive = readJson(SOURCE_ARCHIVE_PATH);
    expect(archive.id).toBe('master.zouken');
    expect(archive.cards.map((card: any) => card.id)).toEqual(IDs);
    expect(archive.sourcePolicy.textSource.sha256).toBe('C596AF5730846EF9092375F18C4200B84F032028DC2E8F5483377D8DDCC22825');
    expect(archive.sourcePolicy.artSource.sha256).toBe('4E4F3F5607D7B39BC16F4ACB01831976E4036F38EBC180514C4E6BC28F75C6B9');
    for (const card of archive.cards) {
      expect(createHash('sha256').update(card.printedText, 'utf8').digest('hex')).toBe(TEXT_SHA[card.legacyId]);
      expect(card.phase3Evidence.sourceReferences).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: 'development-text', sha256: archive.sourcePolicy.textSource.sha256 }),
        expect.objectContaining({ kind: 'development-image', sha256: archive.sourcePolicy.artSource.sha256 }),
      ]));
      expect(card.phase3Evidence.sourceTextSha256).toBe(TEXT_SHA[card.legacyId]);
      if (card.legacyId === 's5') {
        expect(card.phase3Evidence.f1Commit).toBe('59f145434695d29bdd17e4cb3adc887e84182377');
      }
    }
  });

  it('keeps unsupported mechanics explicit while retaining the accepted s5 automatic contract', () => {
    const sourceArchive = readJson(SOURCE_ARCHIVE_PATH);
    const activeArchive = readJson(ACTIVE_ARCHIVE_PATH);
    const pack = rules.loadAuthoringJson(activeArchive);
    expect(pack.cards['master.zouken.skill.s5']!.abilities[0]!.execution.mode).toBe('automatic');
    expect(rules.isGameStartRuleOverrideSemantic(pack.cards['master.zouken.skill.s5']!.abilities[0]!)).toBe(true);
    expect(activeArchive.cards[0].verification.implementationStatus).toBe('complete');
    expect(sourceArchive.cards.filter((card: any) => card.id !== 'master.zouken.skill.s5')
      .every((card: any) => card.abilities[0].execution.mode === 'host_adjudicated')).toBe(true);
    expect(pack.report).toEqual([]);
    const compiled = compileExecutableCardPack(compileLoadedPlaytestPack(loadPlaytestContentPack(
      resolve(PACK_PATH),
      { workspaceRoot: resolve('.') },
    )).library);
    expect(compiled.cards['master.zouken.skill.s5']).toMatchObject({
      ownerId: 'master.zouken',
      cardType: 'master_skill',
    });
    const manifest = readJson(PACK_PATH);
    expect(manifest.authoringMasterFiles).toContain(ACTIVE_ARCHIVE_PATH);
  });
});
