import type { MatchRoom } from '@fd/rules';

export const artoriaCasterHostClientId = 'host-b14-shared-victory';

export function prepareArtoriaCasterSharedVictoryRoom(room: MatchRoom): void {
  room.selectSeat(artoriaCasterHostClientId, 6);
  room.startMatch(artoriaCasterHostClientId);
  const session = room.session;
  if (!session) throw new Error('Artoria Caster B14 E2E requires a started session');
  const state = session.state;
  state.round = { roundNumber: 1, activePhase: 'action', prioritySeat: 6 };
  session.stopReason = undefined;
  session.logs = [];
  session.battleHistory = [];
  state.battleResults = [];
  state.eventPlacements = [];
  state.currentSituationModifiers = [];
  state.abilityRuntime.hostRequests = [];
  state.abilityRuntime.responseWindows = [];
  state.abilityRuntime.pendingPostBattleEvents = [];
  state.abilityRuntime.pendingDelayedActivations = [];
  delete state.abilityRuntime.pendingDecision;
  state.modeState ??= {};
  state.modeState.stagedAttacks = {};
  const active = new Set(['p1', 'p2', 'p5', 'p6']);
  for (const player of state.players) {
    player.status = active.has(player.id) ? 'active' : 'eliminated';
    player.vp = 0;
    player.militaryResult = 0;
    if (player.id === 'p1' || player.id === 'p2') player.locationId = 'shinto';
    else if (player.id === 'p5' || player.id === 'p6') player.locationId = 'miyama_town';
    else delete player.locationId;
  }
  const caster = state.players.find((player) => player.id === 'p1');
  if (!caster) throw new Error('Artoria Caster B14 E2E requires p1');
  caster.servantCardId = 'servant.artoriac';
  for (const card of state.cards) {
    if (card.zone === 'field' || card.zone === 'attack_area') {
      card.zone = 'discard';
      card.visibility = { scope: 'owner_only', ownerPlayerId: card.ownerPlayerId };
      if (state.abilityRuntime.cardState[card.instanceId]) state.abilityRuntime.cardState[card.instanceId].active = false;
    }
  }
  const addAttack = (instanceId: string, definitionId: string, ownerPlayerId: string): void => {
    state.cards.push({ instanceId, definitionId, ownerPlayerId, controllerPlayerId: ownerPlayerId, zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime.cardState[instanceId] = { active: true, faceDown: false, playedRound: 1 };
  };
  addAttack('b14-caster-destiny', 'servant.artoriac.skill.sc-artoriac-6', 'p1');
  addAttack('b14-shared-tomoe', 'servant.tomoe.skill.sc-tomoe-1', 'p2');
  addAttack('b14-second-5', 'basic.strength.2', 'p5');
  addAttack('b14-second-6', 'basic.strength.5', 'p6');
}
