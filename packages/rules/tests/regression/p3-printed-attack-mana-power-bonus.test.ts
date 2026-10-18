import { describe, expect, it } from 'vitest';
import { printedAttackManaPowerBonus as bonus, trustedPrintedAttackManaPowerBonus as trusted } from '../../src/ability/printed-attack-mana-power-bonus';

describe('trusted printed-cost extraction from an active attack', () => {
  const cards = [{ instanceId: 'attack-1', definitionId: 'attack.definition', controllerPlayerId: 'p1', zone: 'attack_area' }];
  const definitions = { 'attack.definition': { cardType: 'basic_attack', cardFace: { cost: 5 } } };
  it('uses the trusted face cost with a hard plus-three cap', () => {
    expect(trusted('attack-1', 'p1', cards, definitions)).toBe(3);
  });
  it('includes played servant skill and master deck attacks, not only basic attack cards',()=>{
    for (const cardType of ['servant_skill','servant_deck_card','servant_attack','master_deck_card']) {
      expect(trusted('attack-1','p1',cards,{'attack.definition':{cardType,cardFace:{cost:2}}})).toBe(2);
    }
  });
  it('rejects foreign, off-area, duplicate and non-attack instances', () => {
    expect(trusted('attack-1', 'p2', cards, definitions)).toBeUndefined();
    expect(trusted('attack-1', 'p1', [{ ...cards[0]!, zone: 'hand' }], definitions)).toBeUndefined();
    expect(trusted('attack-1', 'p1', [...cards, ...cards], definitions)).toBeUndefined();
    expect(trusted('attack-1', 'p1', cards, { 'attack.definition': { cardType: 'master_skill', cardFace: { cost: 5 } } })).toBeUndefined();
  });
});

describe('generic printed mana attack Power bonus', () => {
  it('caps the attack bonus at three', () => {
    expect([0,1,2,3,4,8].map(value => bonus(value,3))).toEqual([0,1,2,3,3,3]);
  });
  it('only accepts trusted nonnegative safe integers', () => {
    for (const invalid of [-1,1.5,NaN,Infinity,'3',null,Number.MAX_SAFE_INTEGER + 1]) {
      expect(bonus(invalid,3)).toBeUndefined();
    }
  });
  it('rejects malformed cap rather than silently changing policy', () => {
    expect(bonus(3,-1)).toBeUndefined();
    expect(bonus(3,1.2)).toBeUndefined();
    expect(bonus(3,undefined)).toBeUndefined();
  });
  it('does not mutate printed cost or derive anything from current paid mana', () => {
    const card = Object.freeze({ printedManaCost: 5, manaActuallyPaid: 0 });
    expect(bonus(card.printedManaCost,3)).toBe(3);
    expect(card.manaActuallyPaid).toBe(0);
  });
});
