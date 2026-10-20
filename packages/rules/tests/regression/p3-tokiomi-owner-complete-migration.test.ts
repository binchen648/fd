import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { resolveTokiomiEffect } from '../../src/ability/tokiomi-capability';

const archive = JSON.parse(readFileSync('data/authoring/masters/master.tokiomi.json', 'utf8'));
function setup() {
  const pack = rules.loadAuthoringJson(archive); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] }); state.cards = [];
  state.players[0]!.masterCardId = 'master.tokiomi';
  rules.initializeAbilityRuntime(state, pack, { seed: 20261020 });
  return state;
}
function add(state: ReturnType<typeof setup>, definitionId: string, zone: 'skill' | 'field' = 'skill') {
  const id = `${definitionId}:source`;
  state.cards.push({ instanceId: id, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone, visibility: { scope: zone === 'field' ? 'public' : 'owner_only', ...(zone === 'skill' ? { ownerPlayerId: 'p1' } : {}) } as any });
  state.abilityRuntime!.cardState[id] = { active: zone === 'field', faceDown: false, playedRound: state.round.roundNumber };
  return id;
}
describe('P3 Tokiomi owner-complete migration', () => {
  it('materializes exactly the frozen three canonical identities with preserved text and hashes', () => {
    expect(archive.cards.filter((card: any) => card.id.startsWith('master.tokiomi.skill.'))).toHaveLength(3);
    expect(archive.cards.find((card: any) => card.id.endsWith('.ascension')).printedText).toBe('【火炎弹】+2魔力消耗与威力。\n【燃烧】印记更改为-3合计威力且移除时需额外花费2点魔力。');
    expect(archive.sourcePolicy.sourceLocators.generated['master.tokiomi.skill.s2']).toContain('4dcdbe858fe81e809aa7718fcce90844e4c3b122c04f3a745d982217e379d1d2');
  });
  it('runs the real game-start production paths for Elementalist and Careless Tutor', () => {
    const state = setup(); add(state, 'master.tokiomi.skill.s1'); add(state, 'master.tokiomi.skill.s2');
    rules.processAbilityEvent(state, { id: 'tokiomi-game-start', type: 'game_start', playerId: 'p1' });
    expect(state.cards.filter((card) => card.definitionId === 'master.tokiomi.generated.fireball' && card.ownerPlayerId === 'p1')).toHaveLength(1);
    expect(state.cards.filter((card) => card.definitionId === 'master.tokiomi.generated.item' && card.ownerPlayerId === 'p1')).toHaveLength(4);
  });
  it('resolves the ascension through the authenticated Tokiomi gateway', () => {
    const state = setup(); const source = add(state, 'master.tokiomi.skill.ascension', 'field');
    const ability = state.abilityRuntime!.pack.cards['master.tokiomi.skill.ascension']!.abilities[0]!;
    expect(resolveTokiomiEffect(state, { controllerId: 'p1', sourceCardId: source, abilityId: ability.id }, ability, ability.effects[0]!)).toBe(true);
    expect((state.abilityRuntime as any).tokiomi.crestByPlayer.p1).toBe(source);
  });
});
