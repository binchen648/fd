import { execFileSync } from 'node:child_process';
import type { MatchRoomSnapshot } from '@fd/rules';

export function buildGoldenFlow2Snapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom } from '@fd/rules';
    const room = createMatchRoom({
      roomId: ${JSON.stringify(roomId)},
      hostClientId: 'host-gf2',
      hostName: 'Golden Flow 2 Host',
      seed: 20260914,
    });
    room.selectSeat('host-gf2', 5);
    room.startMatch('host-gf2');
    const session = room.session;
    const state = session.state;
    state.round.activePhase = 'action';
    state.round.prioritySeat = 5;
    state.currentSituationModifiers = [];
    state.eventPlacements = [
      { locationId: 'miyama_town', eventCardId: 'event.gf2.one', victoryPoints: 3, visibility: { scope: 'public' } },
      { locationId: 'miyama_town', eventCardId: 'event.gf2.two', victoryPoints: 2, visibility: { scope: 'public' } },
    ];
    state.abilityRuntime.hostRequests = [];
    state.abilityRuntime.responseWindows = [];
    delete state.abilityRuntime.pendingDecision;
    for (const player of state.players) {
      player.status = ['p6', 'p7'].includes(player.id) ? 'eliminated' : 'active';
      player.locationId = ['p1', 'p2'].includes(player.id) ? 'miyama_town' : 'recon';
      player.vp = 0;
      player.militaryResult = 0;
    }
    for (const card of state.cards) {
      if (!['field', 'attack_area'].includes(card.zone)) continue;
      card.zone = 'skill';
      card.controllerPlayerId = card.ownerPlayerId;
      if (state.abilityRuntime.cardState[card.instanceId]) state.abilityRuntime.cardState[card.instanceId].active = false;
    }
    const p1Attack = state.cards.find((card) => card.ownerPlayerId === 'p1' && ['hand', 'deck', 'skill'].includes(card.zone));
    const p2Attack = state.cards.find((card) => card.ownerPlayerId === 'p2' && ['hand', 'deck', 'skill'].includes(card.zone));
    if (!p1Attack || !p2Attack) throw new Error('Golden Flow 2 fixture requires attack cards');
    const activate = (card, definitionId, playerId) => {
      card.definitionId = definitionId;
      card.zone = 'attack_area';
      card.controllerPlayerId = playerId;
      card.visibility = { scope: 'public' };
      state.abilityRuntime.cardState[card.instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
    };
    activate(p1Attack, 'basic.strength.5', 'p1');
    activate(p2Attack, 'basic.strength.4', 'p2');
    process.stdout.write(JSON.stringify(room.serializeRoom()));
  `;
  return JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '--eval', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })) as MatchRoomSnapshot;
}
