import { describe, expect, it } from 'vitest';

import { createMatchRoom, restoreMatchRoom } from '../../src/match-room';

function buildGoldenFlow2Room(roomId = 'golden-flow-2-regression') {
  const room = createMatchRoom({
    roomId,
    hostClientId: 'host-gf2',
    hostName: 'Golden Flow 2 Host',
    seed: 20260914,
  });
  room.selectSeat('host-gf2', 5);
  room.startMatch('host-gf2');

  const session = room.session!;
  const state = session.state;
  state.round.activePhase = 'action';
  state.round.prioritySeat = 5;
  state.currentSituationModifiers = [];
  const [eventOne, eventTwo] = state.eventDeck ?? [];
  if (!eventOne || !eventTwo) throw new Error('Golden Flow 2 fixture requires two canonical event definitions');
  state.eventPlacements = [
    { locationId: 'miyama_town', eventCardId: eventOne, victoryPoints: 3, visibility: { scope: 'public' } },
    { locationId: 'miyama_town', eventCardId: eventTwo, victoryPoints: 2, visibility: { scope: 'public' } },
  ];

  if (state.abilityRuntime) {
    state.abilityRuntime.hostRequests = [];
    state.abilityRuntime.responseWindows = [];
    delete state.abilityRuntime.pendingDecision;
  }

  for (const player of state.players) {
    player.status = ['p6', 'p7'].includes(player.id) ? 'eliminated' : 'active';
    player.locationId = ['p1', 'p2'].includes(player.id) ? 'miyama_town' : 'recon';
    player.vp = 0;
    player.militaryResult = 0;
  }

  for (const card of state.cards) {
    if (card.zone !== 'field' && card.zone !== 'attack_area') continue;
    card.zone = 'skill';
    card.controllerPlayerId = card.ownerPlayerId;
    if (state.abilityRuntime?.cardState[card.instanceId]) {
      state.abilityRuntime.cardState[card.instanceId]!.active = false;
    }
  }

  const p1Attack = state.cards.find((card) =>
    card.ownerPlayerId === 'p1' && ['hand', 'deck', 'skill'].includes(card.zone));
  const p2Attack = state.cards.find((card) =>
    card.ownerPlayerId === 'p2' && ['hand', 'deck', 'skill'].includes(card.zone));
  if (!p1Attack || !p2Attack) throw new Error('Golden Flow 2 fixture requires one mutable card for p1 and p2');

  const activateAttack = (card: typeof p1Attack, definitionId: string, controllerPlayerId: string) => {
    card.definitionId = definitionId;
    card.zone = 'attack_area';
    card.controllerPlayerId = controllerPlayerId;
    card.visibility = { scope: 'public' };
    if (state.abilityRuntime) {
      state.abilityRuntime.cardState[card.instanceId] = {
        active: true,
        faceDown: false,
        playedRound: state.round.roundNumber,
      };
    }
  };

  activateAttack(p1Attack, 'basic.strength.5', 'p1');
  activateAttack(p2Attack, 'basic.strength.4', 'p2');

  return room;
}

describe('Golden Flow 2 combat -> power -> winner -> VP', () => {
  it('settles from the real room end-turn path and survives serialize/restore without duplicate scoring', () => {
    const room = buildGoldenFlow2Room();
    const session = room.session!;
    const before = session.projectToClientState('p5');

    expect(before.phase).toBe('action');
    expect(before.priorityPlayerId).toBe('p5');
    expect(before.battleBreakdowns).toEqual([]);
    expect(before.view.players.find((player) => player.id === 'p1')?.vp).toBe(0);
    expect(before.view.players.find((player) => player.id === 'p2')?.vp).toBe(0);

    const result = room.endClientTurn('host-gf2');
    expect(result.ok).toBe(true);

    const settled = session.projectToClientState('p5');
    expect(settled.phase).toBe('round_end');
    expect(settled.battleBreakdowns).toHaveLength(1);
    expect(settled.battleBreakdowns[0]).toMatchObject({
      battlefieldId: 'miyama_town',
      winnerPlayerIds: ['p1'],
      tied: false,
      winnerPlayerId: 'p1',
      margin: 1,
      vpReward: 5,
      baseVpPerWinner: 7,
      eventVpPool: 5,
      competitionVpPool: 2,
      participantBreakdowns: [
        expect.objectContaining({ playerId: 'p1', basePower: 5, totalModifier: 0, effectivePower: 5 }),
        expect.objectContaining({ playerId: 'p2', basePower: 4, totalModifier: 0, effectivePower: 4 }),
      ],
      vpAdjustments: [
        expect.objectContaining({ playerId: 'p1', delta: 2, source: 'competition_vp' }),
      ],
    });
    expect(settled.view.players.find((player) => player.id === 'p1')?.vp).toBe(7);
    expect(session.state.players.find((player) => player.id === 'p1')?.militaryResult).toBe(1);
    expect(settled.view.players.find((player) => player.id === 'p2')?.vp).toBe(0);
    expect(session.state.players.find((player) => player.id === 'p2')?.militaryResult).toBe(-1);
    expect(settled.logs).toContainEqual(expect.objectContaining({ type: 'battle_resolved', message: 'miyama_town' }));
    expect(settled.logs).toContainEqual(expect.objectContaining({ type: 'round_end' }));

    const snapshot = room.serializeRoom();
    const restored = restoreMatchRoom(snapshot);
    const restoredProjection = restored.getProjection('host-gf2').match!;
    expect(restoredProjection.phase).toBe('round_end');
    expect(restoredProjection.battleBreakdowns).toEqual(settled.battleBreakdowns);
    expect(restoredProjection.view.players.find((player) => player.id === 'p1')?.vp).toBe(7);
    expect(restoredProjection.view.players.find((player) => player.id === 'p2')?.vp).toBe(0);

    const replayAttempt = restored.endClientTurn('host-gf2');
    expect(replayAttempt.ok).toBe(false);
    expect(replayAttempt.rejection?.code).toBe('wrong_phase');
    const afterReplay = restored.getProjection('host-gf2').match!;
    expect(afterReplay.battleBreakdowns).toHaveLength(1);
    expect(afterReplay.view.players.find((player) => player.id === 'p1')?.vp).toBe(7);
  });
});
