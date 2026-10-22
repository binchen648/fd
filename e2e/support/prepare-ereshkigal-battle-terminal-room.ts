import type { MatchRoom } from '@fd/rules';

export const ereshkigalHostClientId = 'host-b15-eresh-terminal';
export const ereshPlayerId = 'p1';
export const ereshDefinitionId = 'servant.ereshkigal.skill.sc-ereshkigal-2';
export const ereshInstanceId = 'b15-eresh-netherworld';

export function prepareEreshkigalBattleTerminalRoom(room: MatchRoom): void {
  room.selectSeat(ereshkigalHostClientId, 1);
  room.startMatch(ereshkigalHostClientId);
  const session = room.session;
  if (!session) throw new Error('Ereshkigal B15 E2E requires a started session');
  const state = session.state;
  state.round = { roundNumber: 1, activePhase: 'action', prioritySeat: 1 };
  session.stopReason = undefined; session.logs = []; session.battleHistory = [];
  state.battleResults = []; state.eventPlacements = []; state.currentSituationModifiers = [];
  state.abilityRuntime.hostRequests = []; state.abilityRuntime.responseWindows = [];
  state.abilityRuntime.pendingPostBattleEvents = [];
  delete state.abilityRuntime.pendingBattleTerminalEvent; delete state.abilityRuntime.pendingDecision;
  state.modeState ??= {}; state.modeState.stagedAttacks = {};
  const active = new Set(['p1', 'p2', 'p5', 'p6']);
  for (const player of state.players) {
    player.status = active.has(player.id) ? 'active' : 'eliminated'; player.vp = 0; player.militaryResult = 0;
    if (player.id === 'p1' || player.id === 'p2') player.locationId = 'miyama_town';
    else if (player.id === 'p5' || player.id === 'p6') player.locationId = 'shinto'; else delete player.locationId;
  }
  const eresh = state.players.find((player) => player.id === ereshPlayerId);
  if (!eresh) throw new Error('Ereshkigal B15 E2E requires p1');
  eresh.servantCardId = 'servant.ereshkigal';
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
  addAttack(ereshInstanceId, ereshDefinitionId, ereshPlayerId);
  addAttack('b15-opponent-2', 'basic.strength.5', 'p2');
  addAttack('b15-second-5', 'basic.strength.2', 'p5');
  addAttack('b15-second-6', 'basic.strength.5', 'p6');
}
