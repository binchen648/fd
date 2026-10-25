import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';

const members = [
  ['corday', 'Assassin', 'servant.corday.skill.sc-corday-1'],
  ['danzou', 'Assassin', 'servant.danzou.skill.sc-danzou-3'],
  ['hassan', 'Assassin', 'servant.hassan.skill.sc-hassan-1'],
  ['hassanhf', 'Assassin', 'servant.hassanhf.skill.sc-hassanhf-3'],
  ['hassanser', 'Assassin', 'servant.hassanser.skill.sc-hassanser-1'],
  ['izou', 'Assassin', 'servant.izou.skill.sc-izou-3'],
  ['jekyll', 'Assassin', 'servant.jekyll.skill.sc-jekyll-3'],
  ['kama', 'Assassin', 'servant.kama.skill.sc-kama-3'],
  ['kiritsugu', 'Master', 'servant.kiritsugu.skill.sc-kiritsugu-1'],
  ['kotarou', 'Assassin', 'servant.kotarou.skill.sc-kotarou-1'],
  ['semiramis', 'Assassin', 'servant.semiramis.skill.sc-semiramis-1'],
  ['stheno', 'Assassin', 'servant.stheno.skill.sc-stheno-1'],
] as const;

const text = '刺杀-战斗阶段：战力结算后，如果你满足以下条件，令战力最高的所有交战对手【败北】：\n1.你的战力低于战力最高的所有交战对手。\n2.没有除战力最高的交战对手外其他战力高于你的交战对手。\n3.此战斗有3名及以上的参与者。';
const sourceHash = '29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f';

function archive(name: string): any {
  return JSON.parse(readFileSync(`data/authoring/servants/servant.${name}.json`, 'utf8'));
}

describe('P3-FM06 current-main Presence Concealment authoring migration', () => {
  it('contains exactly the twelve authorized frozen IDs and metadata', () => {
    expect(members).toHaveLength(12);
    for (const [name, className, cardId] of members) {
      const raw = archive(name);
      const card = raw.cards.find((candidate: { id: string }) => candidate.id === cardId);
      expect(raw.class).toBe(className);
      expect(card).toBeDefined();
      expect(card.printedText).toBe(text);
      expect(card.cardFace).toMatchObject({ typeLabel: '迅捷', attributes: ['迅捷'], cost: 3, basePower: 4 });
      expect(card.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
      expect(card.phase3Evidence.sourceTextSha256).toBe(sourceHash);
      expect(card.phase3Evidence.referenceStaticMetadata.handler).toBe('core.presence-concealment');
      expect(card.phase3Evidence.referenceStaticMetadata.historicalRequirement).toBe(3);
    }
  });

  it('uses only the accepted identity-free response shape and canonical loader', () => {
    for (const [name, , cardId] of members) {
      const pack = rules.loadAuthoringJson(archive(name));
      expect(pack.report).toEqual([]);
      const ability = pack.cards[cardId]!.abilities[0]!;
      expect(rules.isPresenceConcealmentAssassinationSemantic(ability)).toBe(true);
      expect(ability.activation).toEqual({ phase: 'combat', trigger: 'after_battle_power_calculated', requiresSourceState: 'active' });
      expect(ability.conditions).toEqual([{ type: 'controller_strict_second_battle_power' }]);
      expect(ability.effects).toEqual([{ type: 'defeat_highest_power_opponents' }]);
      expect(ability.responseWindow).toEqual({ opens: 'post_power_response', order: 'turn_order', passBehavior: 'decline_this_window' });
      expect(ability.limit).toEqual({ type: 'per_round', uses: 1, scope: 'this_card' });
    }
  });

  it('preserves the accepted FM05 Semiramis card while adding Presence Concealment', () => {
    const cards = archive('semiramis').cards;
    expect(cards).toHaveLength(2);
    const territory = cards.find((card: { id: string }) => card.id === 'servant.semiramis.skill.sc-semiramis-2')!;
    expect(territory.cardFace.basePower.formula).toEqual({ op: 'add', args: [16, { op: 'multiply', args: [-2, { var: 'game.round_number' }] }] });
    expect(cards.some((card: { id: string }) => card.id === 'servant.semiramis.skill.sc-semiramis-1')).toBe(true);
  });

  it('keeps the special owner class boundary explicit', () => {
    expect(archive('kiritsugu').class).toBe('Master');
    for (const name of ['corday', 'danzou', 'hassan', 'hassanhf', 'hassanser', 'izou', 'jekyll', 'kama', 'kotarou', 'semiramis', 'stheno']) {
      expect(archive(name).class).toBe('Assassin');
    }
  });
});
