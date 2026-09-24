import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD = 'master.fixture.skill.choose-player';
const SOURCE = 'choose-player-source';
const ABILITY = 'choose-one-opponent';

function archive(minCount = 1, maxCount = 1): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: 'master.fixture', name: 'fixture', class: 'Master',
    cards: [{
      id: CARD, name: 'fixture', cardType: 'master_skill', owner: { type: 'master', id: 'master.fixture' },
      cardFace: { typeLabel: 'fixture', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [{
        id: ABILITY, kind: 'phase_action', printedClause: 'fixture', markers: ['m50_structured_v1'],
        activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [], targets: [], cost: [],
        effects: [{ type: 'choose_players', candidateTarget: 'same_location_opponents', minCount, maxCount, payloadKey: 'targetPlayerId', then: [
          { type: 'gain_mana', target: 'targetPlayerId', amount: 2 },
        ] }], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
        execution: { mode: 'automatic', allowedOperations: [] },
      }],
    }],
  };
}

function setup(): GameState {
  const pack = rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [{ instanceId: SOURCE, definitionId: CARD, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'shinto';
  state.players[0]!.mana = 4; state.players[1]!.mana = 3; state.players[2]!.mana = 5;
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 }); return state;
}

function activate(state: GameState) { return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ABILITY }); }
function choose(state: GameState, id: string) { const d=state.abilityRuntime!.pendingDecision!; return rules.dispatchAbilityCommand(state,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[id]}); }

describe('P3 F4 M50-02 bounded structured player choice', () => {
  it('offers exactly active same-location opponents and resumes via targetPlayerId', () => {
    const state=setup(); expect(activate(state).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({controllerId:'p1',candidates:['p2'],min:1,max:1});
    expect(choose(state,'p2').ok).toBe(true); expect(state.players[1]!.mana).toBe(5); expect(state.players[0]!.mana).toBe(4); expect(state.players[2]!.mana).toBe(5);
  });
  it('fails closed for a stale or illegal selected player', () => {
    const state=setup(); expect(activate(state).ok).toBe(true); state.players[1]!.locationId='shinto';
    expect(choose(state,'p2').ok).toBe(false); expect(state.players[1]!.mana).toBe(3);
  });
  it('rejects widened multi-player authoring at load time', () => {
    const pack=rules.loadAuthoringJson(archive(1,2));
    expect(pack.report).toEqual(expect.arrayContaining([expect.objectContaining({abilityId:ABILITY,path:'effects[0]',reason:'Unsupported structured single-player choice shape'})]));
  });
});
