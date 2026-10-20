import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadAuthoringJson } from '../../src/ability/loader';

const path = 'data/authoring/masters/master.tiamat.json';
const raw = JSON.parse(readFileSync(path, 'utf8'));
const loaded = loadAuthoringJson(raw);
const ids = ['master.tiamat.skill.ascension', 'master.tiamat.skill.s1', 'master.tiamat.skill.s1a'];

describe('P3 Tiamat owner-complete migration', () => {
  it('materializes exactly the frozen three-identity scope', () => {
    expect(raw.id).toBe('master.tiamat');
    expect(raw.name).toBe('提亚马特');
    expect(raw.publicInformation.initialMana).toBe(4);
    expect(raw.cards.map((card: any) => card.id).sort()).toEqual([...ids].sort());
    expect(Object.keys(loaded.cards).sort()).toEqual([...ids].sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported').map((entry) => entry.cardId).sort()).toEqual([...ids].sort());
  });

  it('preserves frozen printed text, placement, and host-adjudicated boundary', () => {
    expect(raw.cards.map((card: any) => [card.id, card.name, card.printedText])).toEqual([
      ['master.tiamat.skill.s1', '万物之母', '你没有令咒。将【生命之海】加入你的技能区。当你获得令咒时，改为将一张【魔兽】加入攻击。'],
      ['master.tiamat.skill.s1a', '人类恶', '你的魔力初始值为8点。战胜你的玩家获得1点战果。'],
      ['master.tiamat.skill.ascension', '泰坦模式', '你不能进入魔术工房。无视阻碍你打出牌的卡牌效果。你的基础攻击费用+3且威力+5。你可以选择暗置打出2张牌作为攻击，若如此，将【生命之海】加入你的攻击。'],
    ]);
    expect(raw.cards.find((card: any) => card.id.endsWith('ascension')).initialPlacement).toBe('outside_game');
    for (const card of raw.cards) {
      expect(card.abilities[0].effects).toEqual([{ type: 'record_master_directive', directive: expect.any(String) }]);
      expect(card.abilities[0].execution.mode).toBe('host_adjudicated');
    }
  });

  it('registers Tiamat exactly once in the production pack', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === path)).toHaveLength(1);
  });

  it('does not add Tiamat identity routing to production runtime source', () => {
    const files = ['packages/rules/src/ability/interpreter.ts', 'packages/rules/src/ability/loader.ts'];
    const production = files.map((file) => readFileSync(file, 'utf8')).join('\n');
    for (const needle of ['master.tiamat', '提亚马特', '泰坦模式', '万物之母', '人类恶', 'core.tiamat-']) expect(production).not.toContain(needle);
  });
});
