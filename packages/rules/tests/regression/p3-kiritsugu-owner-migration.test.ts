import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';

const ROOT = 'master.kiritsugu';
const IDS = ['ascension', 's1', 's2', 's3', 's4'].map((skill) => `${ROOT}.skill.${skill}`);
const PATH = 'data/authoring/masters/master.kiritsugu.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

describe('P3 Kiritsugu owner migration boundary', () => {
  it('restores all five canonical identities and preserves exact inventory text/source SHA evidence', () => {
    expect(archive).not.toHaveProperty('excludedCards');
    expect(archive.cards.slice(0, 5).map((card: any) => card.id)).toEqual(IDS);
    expect(Object.keys(loaded.cards).filter((id) => id.startsWith(ROOT)).sort()).toEqual([
      ...IDS, 'master.kiritsugu.deck.origin-bullet',
    ].sort());
    const rows = [...inventory.staticSkills, ...inventory.dynamicSkills].filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(rows).toHaveLength(5);
    for (const entry of rows) {
      const card = archive.cards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.owner).toEqual({ type: 'master', id: ROOT });
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId])
        .toBe(`legacy-content.json#master/master.kiritsugu/${entry.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of entry.clauses) expect(archive.sourcePolicy.sourceLocators.generated[entry.canonicalAbilityId]).toContain(`sha256=${clause.source.sha256}`);
    }
    expect(archive.cards.find((card: any) => card.id === 'master.kiritsugu.deck.origin-bullet').printedText)
      .toBe(archive.cards.find((card: any) => card.id === `${ROOT}.skill.s4`).printedText);
  });

  it('keeps all five frozen skills host-adjudicated and never executes legacy handlers', () => {
    expect(loaded.report.filter((entry) => entry.path === 'verification.implementationStatus').map((entry) => entry.cardId).sort())
      .toEqual([...IDS, 'master.kiritsugu.deck.origin-bullet'].sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported').map((entry) => entry.cardId).sort())
      .toEqual([...IDS, 'master.kiritsugu.deck.origin-bullet'].sort());
    for (const id of [...IDS, 'master.kiritsugu.deck.origin-bullet']) expect(loaded.cards[id]!.mode).toBe('host_adjudicated');
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) =>
      ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
  });

  it('documents unsupported ascension, deck lifecycle, timing, attack-state, and mana contracts', () => {
    expect(archive.sourcePolicy.note).toMatch(/升华技弃牌堆移除与游戏外起源弹加入手牌/);
    expect(archive.sourcePolicy.note).toMatch(/牌库替换与起源弹生命周期/);
    expect(archive.sourcePolicy.note).toMatch(/暗置打出与抽牌时序/);
    expect(archive.sourcePolicy.note).toMatch(/关闭\/激活攻击状态/);
    expect(archive.sourcePolicy.note).toMatch(/交战对手失去魔力/);
    expect(archive.sourcePolicy.note).toMatch(/HOST_ADJUDICATED/);
  });

  it('keeps the existing deck evidence and registers the archive exactly once', () => {
    const deck = archive.cards.find((card: any) => card.id === 'master.kiritsugu.deck.origin-bullet');
    expect(deck.evidence).toEqual([{ type: 'legacy_generated_content', path: 'D:/fd/workspaces/fate-domination-ui-redesign/src/content/generated/legacy-content.json' }]);
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
  });
});
