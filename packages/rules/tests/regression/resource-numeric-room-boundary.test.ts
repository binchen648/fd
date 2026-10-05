import { describe, expect, it } from 'vitest';

import contentLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';
import { createMatchRoomHub } from '../../src/match-room-hub';
import { buildSevenPlayerCharacterPairings } from '../../src/match-session';

const roomId = 'resource-numeric-room-boundary';
const hostClientId = 'host-resource-numeric';
const commandSpellCardId = 'p5-master.gatou.command-spell';
const gainManaAbilityId = 'command-spell.gain-mana';

function seedWithGatouAtSeatFive() {
  const characters = Object.values(contentLibrary.rules.characters);
  const masters = characters.filter((character) => character.kind === 'master');
  const servants = characters.filter((character) => character.kind === 'servant');
  for (let seed = 1; seed <= 65_536; seed += 1) {
    if (buildSevenPlayerCharacterPairings(masters, servants, seed).some((pairing) => pairing.playerId === 'p5' && pairing.master.id === 'master.gatou')) return seed;
  }
  throw new Error('Unable to build deterministic fixture with master.gatou at seat five');
}

const GATOU_SEAT_FIVE_SEED = seedWithGatouAtSeatFive();

function setupHub() {
  const hub = createMatchRoomHub();
  hub.createRoom({ roomId, seed: GATOU_SEAT_FIVE_SEED, hostClientId, hostName: 'Host' });
  hub.selectSeat(roomId, hostClientId, 5);
  hub.startMatch(roomId, hostClientId);

  const room = hub.getRoom(roomId);
  const state = room.session!.state;
  state.round.activePhase = 'action';
  state.round.prioritySeat = 5;
  state.abilityRuntime!.hostRequests = [];
  state.abilityRuntime!.responseWindows = [];
  delete state.abilityRuntime!.pendingDecision;
  const controller = state.players.find((player) => player.id === 'p5')!;
  controller.mana = 8;
  controller.commandSpells = 3;
  return hub;
}

function snapshot(hub: ReturnType<typeof createMatchRoomHub>) {
  const room = hub.getRoom(roomId);
  const projection = hub.project(roomId, hostClientId).match!;
  const controller = projection.view.players.find((player) => player.id === 'p5')!;
  return {
    revision: projection.view.revision,
    mana: controller.mana,
    commandSpells: controller.commandSpells,
    logs: projection.logs.length,
    replay: projection.replay.length,
    replaySnapshots: room.session!.replaySnapshots.length,
    roomVersion: hub.version(roomId),
  };
}

const command = {
  type: 'activate_ability' as const,
  cardInstanceId: commandSpellCardId,
  abilityId: gainManaAbilityId,
};

describe('P3-TO-08 Resource Numeric production room revision boundary', () => {
  it('rejects missing and stale revisions mutation-free before accepting the current authoritative revision', () => {
    const hub = setupHub();
    const before = snapshot(hub);

    expect(() => hub.dispatchCommand(roomId, hostClientId, command)).toThrow(/missing_expected_revision/);
    expect(snapshot(hub)).toEqual(before);

    expect(() => hub.dispatchCommand(roomId, hostClientId, command, before.revision - 1)).toThrow(/Stale command revision/);
    expect(snapshot(hub)).toEqual(before);

    const accepted = hub.dispatchCommand(roomId, hostClientId, command, before.revision);
    expect(accepted.result.ok).toBe(true);
    const after = snapshot(hub);
    expect(after.revision).toBeGreaterThan(before.revision);
    expect(after.mana).toBe(12);
    expect(after.commandSpells).toBe(2);
    expect(after.roomVersion).toBe(before.roomVersion + 1);
  });
});
