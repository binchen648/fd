import { execFileSync } from 'node:child_process';
import type { MatchRoomSnapshot } from '@fd/rules';

export const interactionHostClientId = 'host-interaction';
export const interactionObserverClientId = 'observer-interaction';
export const interactionSourceCardId = 'p1-drake-riding';
export const interactionLowTwoCardId = 'p1-private-preparation';
export const interactionLowThreeCardId = 'p1-private-surveil';
export const interactionHighCardId = 'p1-private-luck';
export const interactionAbilityId = 'sc-drake-1.mount-summon';

export function buildPrivateOptionalInteractionSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom } from '@fd/rules';
    const room = createMatchRoom({
      roomId: ${JSON.stringify(roomId)},
      hostClientId: ${JSON.stringify(interactionHostClientId)},
      hostName: 'Interaction Host',
      seed: 20260914,
    });
    room.joinRoom({ clientId: ${JSON.stringify(interactionObserverClientId)}, displayName: 'Interaction Observer', role: 'player' });
    room.selectSeat(${JSON.stringify(interactionHostClientId)}, 1);
    room.selectSeat(${JSON.stringify(interactionObserverClientId)}, 2);
    room.startMatch(${JSON.stringify(interactionHostClientId)});
    const session = room.session;
    const state = session.state;
    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;
    state.abilityRuntime.hostRequests = [];
    state.abilityRuntime.responseWindows = [];
    delete state.abilityRuntime.pendingDecision;
    const p1 = state.players.find((player) => player.id === 'p1');
    if (!p1) throw new Error('TO13 E2E requires p1');
    p1.mana = 12;
    p1.servantCardId = 'servant.drake';
    for (const card of state.cards) {
      if (card.ownerPlayerId !== 'p1') continue;
      if (card.zone === 'hand') {
        card.zone = 'deck';
        card.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
      }
      if (['field', 'attack_area'].includes(card.zone)) {
        card.zone = 'skill';
        card.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
        if (state.abilityRuntime.cardState[card.instanceId]) state.abilityRuntime.cardState[card.instanceId].active = false;
      }
    }
    const add = (instanceId, definitionId, zone) => state.cards.push({
      instanceId,
      definitionId,
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone,
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    add(${JSON.stringify(interactionSourceCardId)}, 'servant.drake.skill.sc-drake-1', 'skill');
    add(${JSON.stringify(interactionLowTwoCardId)}, 'basic.preparation', 'hand');
    add(${JSON.stringify(interactionLowThreeCardId)}, 'basic.surveil', 'hand');
    add(${JSON.stringify(interactionHighCardId)}, 'basic.luck', 'hand');
    process.stdout.write(JSON.stringify(room.serializeRoom()));
  `;
  return JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '--eval', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })) as MatchRoomSnapshot;
}
