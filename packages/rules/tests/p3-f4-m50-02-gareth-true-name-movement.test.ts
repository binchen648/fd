import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.fixture.gareth', name: 'fixture', class: 'Lancer',
    cards: [{
      id: 'servant.fixture.gareth.skill', name: 'fixture', cardType: 'servant_skill', owner: { type: 'servant', id: 'servant.fixture.gareth' },
      cardFace: { typeLabel: 'fixture', cost: 1, basePower: 2, attributes: [] }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [
        { id: 'crown', kind: 'passive', printedClause: 'fixture', activation: { phase: 'combat', trigger: 'after_battle_result_determined' },
          conditions: [{ type: 'source_active' }, { type: 'event_player_won_combat' }], targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          effects: [{ type: 'branch', branches: [
            { if: { type: 'not', condition: { type: 'controller_servant_revealed' } }, then: [{ type: 'reveal_information', scope: 'servant_package', subject: 'controller.servant' }, { type: 'gain_victory_points', target: 'controller', amount: 1 }] },
            { else: [] },
          ] }], execution: { mode: 'automatic', allowedOperations: [] } },
        { id: 'disguise', kind: 'forced_trigger', printedClause: 'fixture', activation: { trigger: 'on_card_played' },
          conditions: [{ type: 'event_player_is_controller' }, { type: 'event_definition_is_self' }, { type: 'event_face_is', face: 'face_up' }], targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          effects: [{ type: 'hide_servant_true_name', target: 'controller' }], execution: { mode: 'automatic', allowedOperations: [] } },
        { id: 'move-hidden', kind: 'phase_action', printedClause: 'fixture', activation: { phase: 'action', opens: 'controller_action_window' },
          conditions: [{ type: 'phase_is', phase: 'action' }, { type: 'not', condition: { type: 'controller_servant_revealed' } }], targets: [], cost: [{ type: 'pay_mana', amount: 2 }], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          effects: [{ type: 'choose_locations', adjacentOnly: true, minCount: 1, maxCount: 1, payloadKey: 'targetLocationId', then: [{ type: 'move_player', target: 'controller', to: 'targetLocationId' }] }], execution: { mode: 'automatic', allowedOperations: [] } },
      ],
    }],
  };
}

function setup() {
  const pack: any = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town'; state.players[0]!.mana = 10;
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  state.cards = [{ instanceId: 'source', definitionId: 'servant.fixture.gareth.skill', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  rules.initializeAbilityRuntime(state, pack, { seed: 5202 });
  state.abilityRuntime!.cardState.source = { active: false, faceDown: false, playedRound: 0 };
  state.abilityRuntime!.revealedServants = ['p1'];
  return state;
}

function winEvent(id: string, battlefieldId: string) {
  return { id, type: 'after_battle_result_determined' as const, playerId: 'p1', battlePhaseResolutionId: `bp-${id}`, battleId: `b-${id}`, resultId: id,
    battlefieldId, battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p1'], loserIds: ['p2'] } };
}

describe('P3 F4 M50-02 structural true-name and adjacent movement', () => {
  it('hides on trusted face-up play, pays two for adjacent movement, and rewards only the first later reveal', () => {
    const state = setup();
    const play = rules.getLegalActions(state, 'p1').find((a) => a.type === 'play_card' && a.cardInstanceId === 'source' && !a.faceDown)!;
    expect(rules.dispatchAbilityCommand(state, 'p1', play).ok).toBe(true);
    expect(state.abilityRuntime!.revealedServants).not.toContain('p1');
    expect(state.cards[0]).toMatchObject({ zone: 'attack_area' });

    const beforeMana = state.players[0]!.mana;
    const move = rules.getLegalActions(state, 'p1').find((a) => a.type === 'activate_ability' && a.cardInstanceId === 'source' && a.abilityId === 'move-hidden')!;
    expect(rules.dispatchAbilityCommand(state, 'p1', move).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision?.candidates).toEqual(['shinto']);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['shinto'] }).ok).toBe(true);
    expect(state.players[0]!.locationId).toBe('shinto');
    expect(state.players[0]!.mana).toBe(beforeMana - 2);

    state.round.activePhase = 'battle';
    const vp = state.players[0]!.vp;
    rules.processAbilityEvent(state, winEvent('win-1', 'shinto'));
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(state.players[0]!.vp).toBe(vp + 1);
    rules.processAbilityEvent(state, winEvent('win-2', 'shinto'));
    expect(state.players[0]!.vp).toBe(vp + 1);
  });
});
