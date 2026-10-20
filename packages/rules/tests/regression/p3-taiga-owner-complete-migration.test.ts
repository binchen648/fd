import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const archive = JSON.parse(readFileSync('data/authoring/masters/master.taiga.json', 'utf8'));
function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3], enabledLocationIds: ['miyama_town', 'shinto', 'magic_workshop', 'recon', 'moon_holy_grail'] }); state.cards = [];
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
    state.abilityRuntime!.pack.cards['fixture.power8'] = { id: 'fixture.power8', name: 'power8', cardType: 'basic_attack', cardFace: { attributes: ['力量'], basePower: 8, cost: 0 }, playTiming: { phase: 'battle', window: 'controller_combat_action_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any;
    state.abilityRuntime!.pack.cards['fixture.power2'] = { id: 'fixture.power2', name: 'power2', cardType: 'basic_attack', cardFace: { attributes: ['力量'], basePower: 2, cost: 0 }, playTiming: { phase: 'battle', window: 'controller_combat_action_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any;
    state.cards.push({ instanceId: 'p1-attack', definitionId: 'fixture.power8', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } }, { instanceId: 'p2-attack', definitionId: 'fixture.power2', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } }, { instanceId: 'p3-attack', definitionId: 'fixture.power2', ownerPlayerId: 'p3', controllerPlayerId: 'p3', zone: 'attack_area', visibility: { scope: 'public' } });
    for (const id of ['p1-attack', 'p2-attack', 'p3-attack']) state.abilityRuntime!.cardState[id] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    state.round.activePhase = 'battle';
    const stepped = rules.stepGameLoop(state).nextState;
    expect(stepped.players[0]!.vp).toBe(5); expect(rules.taigaPowerBonus(stepped, 'p2')).toBe(1); expect(rules.taigaPowerBonus(stepped, 'p3')).toBe(1);
    expect(stepped.log.find(entry => entry.type === 'battle_resolved' && entry.message === 'battlefield:miyama_town')).toBeDefined();
  });
  it('includes an active Taiga workshop in the real battle-phase enumeration and uses situation mana without events', () => {
    const state = setup(); state.currentSituationCardId = 'situation.fate_night'; state.currentSituationMana = 4;
    state.players[0]!.locationId = 'magic_workshop'; state.players[1]!.locationId = 'magic_workshop';
    state.cards.push({ instanceId: 'taiga-asc', definitionId: 'master.taiga.skill.ascension', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['taiga-asc'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    state.abilityRuntime!.pack.cards['fixture.workshop8'] = { id: 'fixture.workshop8', name: 'workshop8', cardType: 'basic_attack', cardFace: { attributes: ['力量'], basePower: 8, cost: 0 }, playTiming: { phase: 'battle', window: 'controller_combat_action_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any;
    state.abilityRuntime!.pack.cards['fixture.workshop2'] = { id: 'fixture.workshop2', name: 'workshop2', cardType: 'basic_attack', cardFace: { attributes: ['力量'], basePower: 2, cost: 0 }, playTiming: { phase: 'battle', window: 'controller_combat_action_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any;
    state.cards.push({ instanceId: 'workshop-p1-attack', definitionId: 'fixture.workshop8', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } }, { instanceId: 'workshop-p2-attack', definitionId: 'fixture.workshop2', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['workshop-p1-attack'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    state.abilityRuntime!.cardState['workshop-p2-attack'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    state.round.activePhase = 'battle';
    const stepped = rules.stepGameLoop(state).nextState;
    const workshopBattle = stepped.log.find(entry => entry.type === 'battle_resolved' && entry.message === 'battlefield:magic_workshop');
    expect(workshopBattle).toBeDefined();
    expect((workshopBattle as any).payload.competitionVpPool).toBe(4); expect((workshopBattle as any).payload.eventVpPool).toBe(1);
    expect(stepped.eventPlacements).toEqual([]);
  });
});
