import type { MatchRoom } from '@fd/rules';

export const olgaHostClientId = 'host-olga-activate';
export const olgaPlayerId = 'p4';
export const trismegistusDefinitionId = 'master.olga-marie.skill.trismegistus-grief';
export const trismegistusInstanceId = `${olgaPlayerId}-${trismegistusDefinitionId}`;

export function prepareOlgaFirstLossRoom(room: MatchRoom): void {
  room.selectSeat(olgaHostClientId, 4);
  room.startMatch(olgaHostClientId);
  const session = room.session;
  if (!session) throw new Error('Olga B17 E2E requires a started session');
  const state = session.state;
  state.round = { roundNumber: 1, activePhase: 'action', prioritySeat: 4 };
  session.stopReason = undefined; session.battleHistory = []; session.logs = [];
  state.battleResults = []; state.eventPlacements = []; state.currentSituationModifiers = [];
  state.abilityRuntime.hostRequests = []; state.abilityRuntime.responseWindows = [];
  state.abilityRuntime.pendingDelayedActivations = [];
  delete state.abilityRuntime.pendingDecision; state.modeState ??= {}; state.modeState.stagedAttacks = {};
  for (const player of state.players) {
    player.status = ['p1', olgaPlayerId].includes(player.id) ? 'active' : 'eliminated';
    if (player.status === 'active') player.locationId = 'miyama_town'; else delete player.locationId;
    player.vp = 0; player.militaryResult = 0;
  }
  const p1Cards = state.cards.filter((card) => card.ownerPlayerId === 'p1');
  const attack = p1Cards.map((card) => ({ card, definition: state.abilityRuntime.pack.cards[card.definitionId] }))
    .filter((entry) => Number(entry.definition?.cardFace?.basePower ?? 0) > 0)
    .sort((left, right) => Number(right.definition?.cardFace?.basePower ?? 0) - Number(left.definition?.cardFace?.basePower ?? 0))[0]?.card;
  if (!attack) throw new Error('Olga B17 E2E requires a p1 attack');
  for (const card of p1Cards) { card.zone = 'discard'; card.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' }; if (state.abilityRuntime.cardState[card.instanceId]) state.abilityRuntime.cardState[card.instanceId].active = false; }
  attack.zone = 'attack_area'; attack.visibility = { scope: 'public' }; state.abilityRuntime.cardState[attack.instanceId] = { active: true, faceDown: false, playedRound: 1 };
  for (const card of state.cards.filter((candidate) => candidate.ownerPlayerId === olgaPlayerId)) {
    if (card.definitionId === 'master.olga-marie.skill.astronomical-science' || card.definitionId === trismegistusDefinitionId || card.definitionId === 'master.olga-marie.skill.chaldeas') {
      card.zone = 'skill'; card.visibility = { scope: 'owner_only', ownerPlayerId: olgaPlayerId }; state.abilityRuntime.cardState[card.instanceId] = { active: false, faceDown: false, playedRound: 0 };
    } else if (card.zone === 'attack_area' || card.zone === 'field') { card.zone = 'discard'; card.visibility = { scope: 'owner_only', ownerPlayerId: olgaPlayerId }; if (state.abilityRuntime.cardState[card.instanceId]) state.abilityRuntime.cardState[card.instanceId].active = false; }
  }
}
