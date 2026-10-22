import type { MatchRoom } from '@fd/rules';

export const achillesHostClientId = 'host-b16-achilles-reveal';
export const achillesPlayerId = 'p3';

export function prepareAchillesBattleLossRevealRoom(room: MatchRoom): void {
  room.selectSeat(achillesHostClientId, 1);
  room.startMatch(achillesHostClientId);
  const session = room.session;
  if (!session) throw new Error('Achilles B16 E2E requires a started session');
  if (session.pairings.find((pairing) => pairing.playerId === achillesPlayerId)?.servant.id !== 'servant.achilles') throw new Error('Seed fixture no longer maps p3 to Achilles');
  const state = session.state;
  state.round = { roundNumber: 1, activePhase: 'action', prioritySeat: 1 };
  session.stopReason = undefined; session.logs = []; session.battleHistory = [];
  state.battleResults = []; state.eventPlacements = []; state.currentSituationModifiers = [];
  state.abilityRuntime.hostRequests = []; state.abilityRuntime.responseWindows = []; state.abilityRuntime.pendingPostBattleEvents = [];
  state.abilityRuntime.revealedServants = state.abilityRuntime.revealedServants.filter((id) => id !== achillesPlayerId);
  delete state.abilityRuntime.pendingBattleTerminalEvent; delete state.abilityRuntime.pendingDecision;
  state.modeState ??= {}; state.modeState.stagedAttacks = {};
  const active = new Set(['p1', 'p2', 'p3', 'p4']);
  for (const player of state.players) {
    player.status = active.has(player.id) ? 'active' : 'eliminated'; player.vp = 0; player.militaryResult = 0;
    if (player.id === 'p1' || player.id === 'p2') player.locationId = 'miyama_town';
    else if (player.id === 'p3' || player.id === 'p4') player.locationId = 'shinto'; else delete player.locationId;
  }
  for (const card of state.cards) {
    if (card.zone === 'field' || card.zone === 'attack_area') {
      card.zone = 'discard'; card.visibility = { scope: 'owner_only', ownerPlayerId: card.ownerPlayerId };
      if (state.abilityRuntime.cardState[card.instanceId]) state.abilityRuntime.cardState[card.instanceId].active = false;
    }
  }
  const addAttack = (instanceId: string, definitionId: string, ownerPlayerId: string): void => {
    state.cards.push({ instanceId, definitionId, ownerPlayerId, controllerPlayerId: ownerPlayerId, zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime.cardState[instanceId] = { active: true, faceDown: false, playedRound: 1 };
  };
  addAttack('b16-miyama-winner', 'basic.strength.5', 'p2');
  addAttack('b16-achilles-opponent', 'basic.strength.5', 'p4');
}
