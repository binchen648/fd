import { processAbilityEvent, type MatchRoom } from '@fd/rules';

export const artoriaAltExtraHostClientId = 'host-b19-noble-bloom-extra';
export const artoriaAltExtraSourceInstanceId = 'b19-artoria-alt-resistance';

export function prepareArtoriaAltNobleBloomExtraRoom(room: MatchRoom): void {
  room.selectSeat(artoriaAltExtraHostClientId, 1);
  room.startMatch(artoriaAltExtraHostClientId);
  const session = room.session;
  if (!session) throw new Error('Artoria Alter B19 E2E requires a started session');
  const state = session.state;
  state.round = { roundNumber: 1, activePhase: 'battle', prioritySeat: 1 };
  session.stopReason = undefined; session.logs = [];
  state.abilityRuntime.hostRequests = []; state.abilityRuntime.responseWindows = []; state.abilityRuntime.pendingPostBattleEvents = [];
  delete state.abilityRuntime.pendingDecision;
  const player = state.players.find((candidate) => candidate.id === 'p1');
  if (!player) throw new Error('Artoria Alter B19 E2E requires p1');
  player.servantCardId = 'servant.artoria-alt'; player.vp = 2;
  const existing = state.cards.find((card) => card.instanceId === artoriaAltExtraSourceInstanceId);
  const source = existing ?? {
    instanceId: artoriaAltExtraSourceInstanceId,
    definitionId: 'servant.artoria-alt.skill.sc-artoria-alt-3',
    ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill' as const,
    visibility: { scope: 'owner_only' as const, ownerPlayerId: 'p1' },
  };
  source.definitionId = 'servant.artoria-alt.skill.sc-artoria-alt-3'; source.ownerPlayerId = 'p1'; source.controllerPlayerId = 'p1'; source.zone = 'skill'; source.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
  if (!existing) state.cards.push(source);
  state.abilityRuntime.cardState[artoriaAltExtraSourceInstanceId] = { active: false, faceDown: false, playedRound: 0 };
  state.abilityRuntime.noblePhantasmCostsThisRound.p1 = [{ cardId: 'b19-browser-np', cost: 4 }];
  processAbilityEvent(state, {
    id: 'b19-browser-result', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:1',
    battleId: 'battle-phase:1:battle:shinto:1', resultId: 'b19-browser-result', battleParticipantIds: ['p1', 'p2'], battlefieldId: 'shinto',
    battleResult: { winners: ['p1'], loserIds: ['p2'] },
  });
}
