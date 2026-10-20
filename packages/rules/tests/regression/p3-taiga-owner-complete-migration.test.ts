import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const archive = JSON.parse(readFileSync('data/authoring/masters/master.taiga.json', 'utf8'));
function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] }); state.cards = [];
  state.players[0]!.masterCardId = 'master.taiga'; state.players[0]!.mana = 9; state.players[1]!.mana = 4; state.players[2]!.mana = 4;
  rules.initializeAbilityRuntime(state, pack, { seed: 3 });
  return state;
}
describe('P3 Taiga owner-complete migration', () => {
  it('loads exactly the frozen three cards and starts controller mana at three', () => {
    const state = setup(); state.cards.push({ instanceId: 'taiga-s1', definitionId: 'master.taiga.skill.s1', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
    rules.processAbilityEvent(state, { id: 'taiga-start', type: 'game_start' });
    expect(state.players[0]!.mana).toBe(3); expect(state.players[1]!.mana).toBe(4);
  });
  it('distributes tiger stamps and capped power to battle losers', () => {
    const state = setup(); state.players.forEach(p => p.locationId = 'miyama_town');
    state.cards.push({ instanceId: 'taiga-guide', definitionId: 'master.taiga.skill.s1a', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['taiga-guide'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    for (let i = 0; i < 5; i++) rules.processAbilityEvent(state, { id: `taiga-win-${i}`, type: 'after_controller_wins_battle', playerId: 'p1', sourceCardId: 'battle' + i, battleResult: { winners: ['p1'], loserIds: ['p2', 'p3'] } } as any);
    expect(state.players[0]!.vp).toBe(10); expect(rules.taigaPowerBonus(state, 'p2')).toBe(3);
  });
});
