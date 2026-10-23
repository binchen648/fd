import type { MatchRoom } from '@fd/rules';
import { processAbilityEvent } from '@fd/rules';

export const artoriaCasterLuckHostClientId = 'host-b20-artoriac-luck';
const sources = [
  ['b20-pilgrim-4', 'servant.artoriac.skill.sc-artoriac-4'],
  ['b20-pilgrim-5', 'servant.artoriac.skill.sc-artoriac-5'],
  ['b20-pilgrim-6', 'servant.artoriac.skill.sc-artoriac-6'],
] as const;

export function prepareArtoriaCasterLuckOnWinRoom(room: MatchRoom): void {
  room.selectSeat(artoriaCasterLuckHostClientId, 1);
  room.startMatch(artoriaCasterLuckHostClientId);
  const session = room.session;
  if (!session) throw new Error('B20 E2E requires a started session');
  const state = session.state;
  state.round = { roundNumber: 1, activePhase: 'battle', prioritySeat: 1 };
  session.stopReason = undefined;
  session.logs = [];
  state.abilityRuntime.hostRequests = [];
  state.abilityRuntime.responseWindows = [];
  state.abilityRuntime.pendingPostBattleEvents = [];
  delete state.abilityRuntime.pendingDecision;
  const player = state.players.find((candidate) => candidate.id === 'p1');
  if (!player) throw new Error('B20 E2E requires p1');
  player.servantCardId = 'servant.artoriac';
  for (const [instanceId, definitionId] of sources) {
    state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
    state.abilityRuntime.cardState[instanceId] = { active: false, faceDown: false, playedRound: 0 };
  }
  processAbilityEvent(state, {
    id: 'b20-browser-win', type: 'after_battle_result_determined',
    battlePhaseResolutionId: 'battle-phase:20', battleId: 'battle-phase:20:battle:shinto:1', resultId: 'b20-browser-result',
    battleParticipantIds: ['p1', 'p2'], battlefieldId: 'shinto',
    battleResult: { winners: ['p1'], loserIds: ['p2'] },
  });
}
