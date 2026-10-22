import { processAbilityEvent, type MatchRoom } from '@fd/rules';

export const artoriaAltHostClientId = 'host-b18-noble-bloom';
export const artoriaAltPlayerId = 'p1';
export const artoriaAltSourceInstanceId = 'b18-artoria-alt-resistance';
export const artoriaAltSourceDefinitionId = 'servant.artoria-alt.skill.sc-artoria-alt-3';
export const artoriaAltAbilityId = 'sc-artoria-alt-3.noble-bloom';

export function prepareArtoriaAltNobleBloomRoom(room: MatchRoom): void {
  room.selectSeat(artoriaAltHostClientId, 1);
  room.startMatch(artoriaAltHostClientId);
  const session = room.session;
  if (!session) throw new Error('Artoria Alter B18 E2E requires a started session');
  const state = session.state;
  state.round = { roundNumber: 1, activePhase: 'battle', prioritySeat: 1 };
  session.stopReason = undefined;
  session.logs = [];
  state.abilityRuntime.hostRequests = [];
  state.abilityRuntime.responseWindows = [];
  state.abilityRuntime.pendingPostBattleEvents = [];
  delete state.abilityRuntime.pendingDecision;
  const player = state.players.find((candidate) => candidate.id === artoriaAltPlayerId);
  if (!player) throw new Error('Artoria Alter B18 E2E requires p1');
  player.servantCardId = 'servant.artoria-alt';
  player.vp = 2;
  const existing = state.cards.find((card) => card.instanceId === artoriaAltSourceInstanceId);
  const source = existing ?? {
    instanceId: artoriaAltSourceInstanceId,
    definitionId: artoriaAltSourceDefinitionId,
    ownerPlayerId: artoriaAltPlayerId,
    controllerPlayerId: artoriaAltPlayerId,
    zone: 'skill' as const,
    visibility: { scope: 'owner_only' as const, ownerPlayerId: artoriaAltPlayerId },
  };
  source.definitionId = artoriaAltSourceDefinitionId;
  source.ownerPlayerId = artoriaAltPlayerId;
  source.controllerPlayerId = artoriaAltPlayerId;
  source.zone = 'skill';
  source.visibility = { scope: 'owner_only', ownerPlayerId: artoriaAltPlayerId };
  if (!existing) state.cards.push(source);
  state.abilityRuntime.cardState[artoriaAltSourceInstanceId] = { active: false, faceDown: false, playedRound: 0 };
  state.abilityRuntime.noblePhantasmCostsThisRound[artoriaAltPlayerId] = [{ cardId: 'b18-browser-np', cost: 3 }];
  processAbilityEvent(state, {
    id: 'b18-browser-result',
    type: 'after_battle_result_determined',
    battlePhaseResolutionId: 'battle-phase:1',
    battleId: 'battle-phase:1:battle:shinto:1',
    resultId: 'b18-browser-result',
    battleParticipantIds: ['p1', 'p2'],
    battlefieldId: 'shinto',
    battleResult: { winners: ['p1'], loserIds: ['p2'] },
  });
}
