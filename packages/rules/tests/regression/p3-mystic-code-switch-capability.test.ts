import { describe, expect, it } from 'vitest';
import { planExclusiveOutsideSkillSwitch as plan, halfUpPrintedAttackRecovery, codeAscensionModifiers, applyExclusiveOutsideSkillSwitch, chooseRandomOwnedHandCard } from '../../src/ability/mystic-code-switch-capability';
const ids = ['link','ccc','extella','extra'];
const cards = ids.map((id,i) => ({
  instanceId: 'code-'+i, definitionId: 'code.'+id,
  ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: id==='link' ? 'skill' : 'removed_from_game',
}));
const offers = ids.map(id=>'code.'+id);
describe('mode-controlled basic ascension and combat recovery primitives', () => {
  it('maps the four modes without stacking their exclusive effects', () => {
    expect(codeAscensionModifiers('extella')).toEqual({ power: 5, terrainOverride: 0, basicAttackBonus: 0, ignoreEightManaGate: false });
    expect(codeAscensionModifiers('link').basicAttackBonus).toBe(1);
    expect(codeAscensionModifiers('extra').ignoreEightManaGate).toBe(true);
    expect(codeAscensionModifiers('ccc').power).toBe(0);
    expect(codeAscensionModifiers(undefined).ignoreEightManaGate).toBe(false);
  });
  it('uses rounded-up printed cost only on authenticated eligible battle loss', () => {
    expect([0,1,2,3,4,5].map(x=>halfUpPrintedAttackRecovery(x,true,true))).toEqual([0,1,1,2,2,3]);
    expect(halfUpPrintedAttackRecovery(5,false,true)).toBeUndefined();
    expect(halfUpPrintedAttackRecovery(5,true,false)).toBeUndefined();
    expect(halfUpPrintedAttackRecovery(-1,true,true)).toBeUndefined();
  });
});

describe('server random physical hand discard selection', () => {
  const hand = [{instanceId:'h1',ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'hand'},
    {instanceId:'h2',ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'hand'},
    {instanceId:'h3',ownerPlayerId:'p2',controllerPlayerId:'p2',zone:'hand'}];
  it('chooses only the controller-owned hand via a bounded RNG draw',()=>{
    expect(chooseRandomOwnedHandCard(hand,'p1',0)).toBe('h1');
    expect(chooseRandomOwnedHandCard(hand,'p1',0.99)).toBe('h2');
    expect(chooseRandomOwnedHandCard(hand,'p2',0.4)).toBe('h3');
  });
  it('fails closed on invalid random draw or duplicate physical identity',()=>{
    expect(chooseRandomOwnedHandCard(hand,'p1',1)).toBeUndefined();
    expect(chooseRandomOwnedHandCard(hand,'p1',Number.NaN)).toBeUndefined();
    expect(chooseRandomOwnedHandCard([...hand,hand[0]!],'p1',0.5)).toBeUndefined();
  });
});

describe('lifecycle-aware exclusive switch execution', () => {
  it('retires the prior physical code before installing its replacement', () => {
    const actual = cards.map(c => ({ ...c }));
    const moves: string[] = [];
    const move = (id: string, zone: string) => {
      moves.push(id+':'+zone);
      const card = actual.find(c=>c.instanceId===id)!;
      card.zone = zone;
      return 1;
    };
    expect(applyExclusiveOutsideSkillSwitch({ cards: actual } as never,'p1',offers,'code.ccc',move)).toBe(true);
    expect(moves).toEqual(['code-0:removed_from_game','code-1:skill']);
    expect(actual.filter(c=>c.zone==='skill')).toHaveLength(1);
  });
  it('rejects duplicate global instance identifiers even outside the code pool', () => {
    const polluted = [...cards, { ...cards[0]!, definitionId:'unrelated',zone:'deck' }];
    let writes = 0;
    expect(applyExclusiveOutsideSkillSwitch({cards:polluted} as never,'p1',offers,'code.extra',()=>{writes++;return 1;})).toBe(false);
    expect(writes).toBe(0);
  });
  it('rejects invalid choices before any lifecycle mutation', () => {
    let writes=0;
    expect(applyExclusiveOutsideSkillSwitch({cards} as never,'p1',offers,'fake',()=>{writes++;return 1;})).toBe(false);
    expect(writes).toBe(0);
  });
});

describe('exclusive owned out-of-game skill swap', () => {
  it('selects one code and retires the old one without touching state', () => {
    const before = cards.map(c=>c.zone);
    expect(plan({cards} as never,'p1', offers,'code.ccc')).toEqual([
      {instanceId:'code-0',zone:'removed_from_game'}, {instanceId:'code-1',zone:'skill'},
      {instanceId:'code-2',zone:'removed_from_game'}, {instanceId:'code-3',zone:'removed_from_game'}
    ]);
    expect(cards.map(c=>c.zone)).toEqual(before);
  });
  it('supports selecting the existing code and empty skill area', () => {
    expect(plan({cards} as never, 'p1',offers,'code.link')?.filter(c=>c.zone==='skill')).toHaveLength(1);
    const absent = cards.map(c=>({...c,zone:'removed_from_game'}));
    expect(plan({cards:absent} as never,'p1',offers,'code.extra')?.filter(c=>c.zone==='skill')).toHaveLength(1);
  });
  it('rejects ambiguous ownership, duplicate physical cards or illicit extra active codes', () => {
    expect(plan({cards:[...cards, {...cards[1]!,instanceId:'duplicate'}]} as never,'p1',offers,'code.extra')).toBeUndefined();
    expect(plan({cards:cards.map(c=>c.definitionId==='code.ccc'?{...c,ownerPlayerId:'p2'}:c)} as never,'p1',offers,'code.ccc')).toBeUndefined();
    expect(plan({cards:cards.map(c=>c.definitionId==='code.ccc'?{...c,zone:'skill'}:c)} as never,'p1',offers,'code.extra')).toBeUndefined();
    expect(plan({cards} as never,'p1',offers,'forged')).toBeUndefined();
  });
});
