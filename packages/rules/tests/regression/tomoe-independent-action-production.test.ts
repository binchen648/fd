import { describe, expect, it } from 'vitest';
import { dispatchAbilityCommand, getLegalActions, processAbilityEvent } from '../../src/ability/interpreter';
import { createMatchSession } from '../../src/match-session';

const cardId = 'servant.tomoe.skill.sc-tomoe-1';

function setup(seed: number) {
  const { state } = createMatchSession({ seed });
  const player = state.players.find(player => player.servantCardId === 'servant.tomoe')!;
  const source = state.cards.find(card => card.definitionId === cardId && card.controllerPlayerId === player.id)!;
  const opponent = state.players.find(candidate => candidate.id !== player.id)!;
  player.mana = 8;
  player.vp = 10;
  player.locationId = opponent.locationId = 'miyama_town';
  state.eventPlacements = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = player.seat;
  expect(dispatchAbilityCommand(state, player.id, { type: 'skip_normal_move' }).ok).toBe(true);
  const stage = { type: 'stage_attack_card', cardInstanceId: source.instanceId } as const;
  const play = () => {
    expect(dispatchAbilityCommand(state, player.id, stage).ok).toBe(true);
    const actions = getLegalActions(state, player.id);
    if (!actions.some(action => action.type === 'confirm_staged_attack')) {
      const companion = actions.find(action => action.type === 'stage_attack_card');
      expect(companion).toBeDefined();
      expect(dispatchAbilityCommand(state, player.id, companion!).ok).toBe(true);
    }
    expect(dispatchAbilityCommand(state, player.id, { type: 'confirm_staged_attack' }).ok).toBe(true);
  };
  const lose = (id: string) => {
    state.round.activePhase = 'battle';
    processAbilityEvent(state, {
      id,
      type: 'after_battle_result_determined',
      locationId: 'miyama_town',
      battleResult: { winners: [opponent.id], loserIds: [player.id] },
    });
  };
  const vp = () => state.players.find(candidate => candidate.id === player.id)!.vp;
  return { state, player, source, stage, play, lose, vp };
}

describe('production Tomoe Independent Action', () => {
  it('rejects playing from the latter half of the seven-player order', () => {
    const { state, player, source, stage } = setup(1);
    expect(player.seat).toBe(6);
    expect(getLegalActions(state, player.id)).not.toContainEqual(stage);
    expect(dispatchAbilityCommand(state, player.id, stage).ok).toBe(false);
    expect(state.cards.find(card => card.instanceId === source.instanceId)?.zone).toBe('skill');
  });

  it('keeps the +3 action available after an eligible play', () => {
    const { state, player, source, play, vp } = setup(394);
    expect(player.seat).toBe(2);
    play();
    expect(dispatchAbilityCommand(state, player.id, {
      type: 'activate_ability', cardInstanceId: source.instanceId, abilityId: 'sc-tomoe-1.independent-action',
    }).ok).toBe(true);
    expect(vp()).toBe(13);
  });

  it('keeps VP on defeat when the skill has never been played', () => {
    const { lose, vp } = setup(394);
    lose('unused');
    expect(vp()).toBe(10);
  });

  it('charges an unpreventable penalty once after play, even if the card has left the attack area', () => {
    const { state, player, source, play, lose, vp } = setup(394);
    play();
    state.cards.find(card => card.instanceId === source.instanceId)!.zone = 'removed_from_game';
    state.abilityRuntime!.cardState[source.instanceId]!.active = false;
    state.abilityRuntime!.preventEffects = true;
    lose('played');
    expect(vp()).toBe(5);
    lose('duplicate');
    expect(vp()).toBe(5);
    state.round.roundNumber++;
    lose('next-round');
    expect(vp()).toBe(5);
  });
});
