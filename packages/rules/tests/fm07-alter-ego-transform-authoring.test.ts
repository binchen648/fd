import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';

const servants = [
  ['douman', 'servant.douman.skill.sc-douman-3'],
  ['koyanskaya', 'servant.koyanskaya.skill.sc-koyanskaya-1'],
  ['mechaeli', 'servant.mechaeli.skill.sc-mechaeli-3'],
  ['meltryllis', 'servant.meltryllis.skill.sc-meltryllis-3'],
  ['muramasa', 'servant.muramasa.skill.sc-muramasa-3'],
  ['okita-alt', 'servant.okita-alt.skill.sc-okita-alt-1'],
  ['passionlip', 'servant.passionlip.skill.sc-passionlip-1'],
  ['sitonai', 'servant.sitonai.skill.sc-sitonai-3'],
  ['taisui', 'servant.taisui.skill.sc-taisui-1'],
] as const;
const regularText = '残留：当你将一张牌放置入场时，你可以关闭【他人格】以使其获得其反转效果。若其不含有反转效果，你可以任意令其在打出后获得或失去力量/迅捷/魔术属性来达成任意组合。';

function archive(path: string): any {
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('P3-FM07 current-main Alter Ego authoring migration', () => {
  it('contains the exact nine regular servants and frozen metadata', () => {
    expect(servants).toHaveLength(9);
    for (const [name, cardId] of servants) {
      const raw = archive(`data/authoring/servants/servant.${name}.json`);
      expect(raw.class).toBe('Alterego');
      const card = raw.cards.find((candidate: { id: string }) => candidate.id === cardId)!;
      expect(card.printedText).toBe(regularText);
      expect(card.cardFace).toMatchObject({ typeLabel: '被动', attributes: [], cost: 2, basePower: 3 });
      expect(card.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
      expect(card.phase3Evidence.sourceTextSha256).toBe('b6c74ac37a50b671ded913dbc6ae6736f2057904fe4c02924d79f84971cebbdf');
      expect(card.phase3Evidence.referenceStaticMetadata.handler).toBe('core.alter-ego-transform');
    }
  });

  it('loads the regular identity-free structural route without report findings', () => {
    for (const [name, cardId] of servants) {
      const pack = rules.loadAuthoringJson(archive(`data/authoring/servants/servant.${name}.json`));
      expect(pack.report).toEqual([]);
      const ability = pack.cards[cardId]!.abilities[0]!;
      expect(rules.isAlterEgoTransformSemantic(ability)).toBe(true);
      expect(ability.effects).toEqual([{ type: 'transform_event_source_card' }, { type: 'close_source_card' }]);
      expect(ability.cost).toEqual([]);
      expect(ability.limit).toEqual({});
    }
  });

  it('preserves the separate Sion EX variant and its fixed payment/limit', () => {
    const pack = rules.loadAuthoringJson(archive('data/authoring/masters/master.sion.json'));
    expect(pack.report).toEqual([]);
    const card = pack.cards['master.sion.skill.s12']!;
    expect(card.cardFace).toMatchObject({ typeLabel: '特殊', attributes: ['特殊'], cost: 3, basePower: 3 });
    const ability = card.abilities[0]!;
    expect(rules.isAlterEgoTransformSemantic(ability)).toBe(true);
    expect(ability.cost).toEqual([{ type: 'pay_mana', player: 'controller', amount: 3 }]);
    expect(ability.effects).toEqual([{ type: 'transform_event_source_card' }]);
    expect(ability.limit).toEqual({ type: 'per_round', uses: 1, scope: 'this_card' });
  });

  it('keeps regular and EX handler evidence distinct without identity routing', () => {
    const regular = archive('data/authoring/servants/servant.douman.json').cards[0];
    const ex = archive('data/authoring/masters/master.sion.json').cards[0];
    expect(regular.phase3Evidence.referenceStaticMetadata.alterEgoCloseSource).toBeUndefined();
    expect(ex.phase3Evidence.referenceStaticMetadata.alterEgoCloseSource).toBe(false);
    expect(regular.id).not.toContain('sion');
    expect(ex.id).toBe('master.sion.skill.s12');
  });
});
