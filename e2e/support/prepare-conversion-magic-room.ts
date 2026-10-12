import type { MatchRoom } from '@fd/rules';

export const conversionMagicHostClientId = 'host-conversion-magic';
export const conversionMagicSourceInstanceId = 'p2-master.irisviel.skill.conversion-magic';
export const conversionMagicFirstMovedInstanceId = 'p2-basic.agility.5-1';
export const conversionMagicSecondMovedInstanceId = 'p2-basic.luck-1';
export const conversionMagicDecoyInstanceId = 'p2-basic.agility.2-1';

export function prepareConversionMagicRoom(room: MatchRoom): void {
  room.selectSeat(conversionMagicHostClientId, 2);
  room.startMatch(conversionMagicHostClientId);
  const session = room.session;
  if (!session) throw new Error('Conversion Magic E2E requires a started session');
  const state = session.state;
  state.round.activePhase = 'advance';
  state.round.prioritySeat = 2;
  state.abilityRuntime.hostRequests = [];
  state.abilityRuntime.responseWindows = [];
  delete state.abilityRuntime.pendingDecision;

  const player = state.players.find((candidate) => candidate.id === 'p2');
  if (!player) throw new Error('Conversion Magic E2E requires p2');
  player.mana = 4;

  const source = state.cards.find((card) => card.instanceId === conversionMagicSourceInstanceId);
  if (!source || source.controllerPlayerId !== 'p2' || source.definitionId !== 'master.irisviel.skill.conversion-magic') {
    throw new Error('Conversion Magic E2E fixture source not found');
  }
  const candidates = state.cards.filter((card) => card.controllerPlayerId === 'p2' && card.instanceId !== source.instanceId);
  for (const card of candidates) {
    card.zone = 'deck';
    card.visibility = { scope: 'owner_only', ownerPlayerId: 'p2' };
  }

  const movable = [conversionMagicFirstMovedInstanceId, conversionMagicSecondMovedInstanceId]
    .map((instanceId) => candidates.find((card) => card.instanceId === instanceId));
  const decoy = candidates.find((card) => card.instanceId === conversionMagicDecoyInstanceId);
  if (movable.some((card) => !card) || !decoy) throw new Error('Conversion Magic E2E fixture cards not found');
  for (const card of movable) {
    card!.zone = 'hand';
    card!.visibility = { scope: 'owner_only', ownerPlayerId: 'p2' };
  }
  decoy.zone = 'field';
  decoy.visibility = { scope: 'public' };
}
