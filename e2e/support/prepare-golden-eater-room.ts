import type { MatchRoom } from '@fd/rules';

export const goldenEaterHostClientId = 'host-golden-eater';
export const goldenEaterSourceInstanceId = 'p1-golden-eater-b11-e2e';
export const goldenEaterFirstTargetInstanceId = 'p1-golden-impact-1-removed-e2e';
export const goldenEaterSecondTargetInstanceId = 'p1-golden-impact-2-removed-e2e';

export function prepareGoldenEaterRoom(room: MatchRoom): void {
  room.selectSeat(goldenEaterHostClientId, 1);
  room.startMatch(goldenEaterHostClientId);
  const session = room.session;
  if (!session) throw new Error('Golden Eater E2E requires a started session');
  const state = session.state;
  state.round = { roundNumber: 4, activePhase: 'battle', prioritySeat: 1 };
  state.abilityRuntime.hostRequests = [];
  state.abilityRuntime.responseWindows = [];
  delete state.abilityRuntime.pendingDecision;
  const p1 = state.players.find((player) => player.id === 'p1');
  if (!p1) throw new Error('Golden Eater E2E requires p1');
  p1.servantCardId = 'servant.kintoki';
  p1.locationId = 'miyama_town';
  p1.mana = 12;
  p1.vp = 0;

  const add = (instanceId: string, definitionId: string, zone: 'attack_area' | 'removed_from_game'): void => {
    state.cards = state.cards.filter((card) => card.instanceId !== instanceId);
    state.cards.push({
      instanceId,
      definitionId,
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone,
      visibility: { scope: 'public' },
    });
    state.abilityRuntime.cardState[instanceId] = {
      active: zone === 'attack_area',
      faceDown: false,
      playedRound: zone === 'attack_area' ? 4 : 1,
    };
  };
  add(goldenEaterSourceInstanceId, 'servant.kintoki.skill.sc-kintoki-3', 'attack_area');
  add(goldenEaterFirstTargetInstanceId, 'servant.kintoki.skill.sc-kintoki-1', 'removed_from_game');
  add(goldenEaterSecondTargetInstanceId, 'servant.kintoki.skill.sc-kintoki-2', 'removed_from_game');
}
