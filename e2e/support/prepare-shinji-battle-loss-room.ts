import type { MatchRoom } from '@fd/rules';

export const shinjiHostClientId = 'host-shinji-battle-loss';

export function prepareShinjiBattleLossRoom(room: MatchRoom): void {
  room.selectSeat(shinjiHostClientId, 6);
  room.startMatch(shinjiHostClientId);
  const session = room.session;
  if (!session) throw new Error('Shinji battle-loss E2E requires a started session');
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
  state.abilityRuntime.pendingDelayedActivations = [];
  state.abilityRuntime.pendingPostBattleEvents = [];
  delete state.abilityRuntime.pendingDecision;
  state.modeState ??= {};
  state.modeState.stagedAttacks = {};

  const active = new Set(['p1', 'p2', 'p5', 'p6']);
  for (const player of state.players) {
    player.status = active.has(player.id) ? 'active' : 'eliminated';
    player.vp = 0;
    player.militaryResult = 0;
    player.commandSpells = 3;
    if (player.id === 'p1' || player.id === 'p2') player.locationId = 'miyama_town';
    else if (player.id === 'p5' || player.id === 'p6') player.locationId = 'shinto';
    else delete player.locationId;
  }

  for (const card of state.cards) {
    if (card.zone === 'field' || card.zone === 'attack_area') {
      card.zone = 'discard';
      card.visibility = { scope: 'owner_only', ownerPlayerId: card.ownerPlayerId };
      if (state.abilityRuntime.cardState[card.instanceId]) state.abilityRuntime.cardState[card.instanceId].active = false;
    }
  }

  const equipStrongAttack = (playerId: string): void => {
    const entry = state.cards
      .filter((card) => card.ownerPlayerId === playerId)
      .map((card) => ({ card, definition: state.abilityRuntime.pack.cards[card.definitionId] }))
      .filter((candidate) => Number(candidate.definition?.cardFace?.basePower ?? 0) > 0)
      .sort((left, right) => Number(right.definition?.cardFace?.basePower ?? 0) - Number(left.definition?.cardFace?.basePower ?? 0))[0];
    if (!entry) throw new Error(`missing attack for ${playerId}`);
    entry.card.zone = 'attack_area';
    entry.card.visibility = { scope: 'public' };
    state.abilityRuntime.cardState[entry.card.instanceId] = { active: true, faceDown: false, playedRound: 1 };
  };
  equipStrongAttack('p2');
  equipStrongAttack('p6');

  const clown = state.cards.find((card) => card.ownerPlayerId === 'p1' && card.definitionId === 'master.shinji.skill.clown');
  if (!clown) throw new Error('missing Shinji clown');
  clown.zone = 'skill';
  clown.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
  state.abilityRuntime.cardState[clown.instanceId] = { active: false, faceDown: false, playedRound: 0 };
}
