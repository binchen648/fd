import { describe, expect, it } from 'vitest';

import { createMatchRoomHub } from '../../src/match-room-hub';

const roomId = 'to13-room-boundary';
const hostClientId = 'host-interaction-boundary';
const observerClientId = 'observer-interaction-boundary';
const sourceCardId = 'p1-drake-riding-boundary';
const lowCardId = 'p1-private-preparation-boundary';
const highCardId = 'p1-private-luck-boundary';
const abilityId = 'sc-drake-1.mount-summon';

function setupHub() {
  const hub = createMatchRoomHub();
  hub.createRoom({ roomId, hostClientId, hostName: 'Interaction Host', seed: 20260914 });
  hub.joinRoom(roomId, { clientId: observerClientId, displayName: 'Interaction Observer', role: 'player' });
  hub.selectSeat(roomId, hostClientId, 1);
  hub.selectSeat(roomId, observerClientId, 2);
  hub.startMatch(roomId, hostClientId);

  const room = hub.getRoom(roomId);
  const state = room.session!.state;
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.abilityRuntime!.hostRequests = [];
  state.abilityRuntime!.responseWindows = [];
  delete state.abilityRuntime!.pendingDecision;
  const p1 = state.players.find((player) => player.id === 'p1')!;
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
      if (state.abilityRuntime!.cardState[card.instanceId]) state.abilityRuntime!.cardState[card.instanceId]!.active = false;
    }
  }
  const add = (instanceId: string, definitionId: string, zone: string) => state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone,
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  add(sourceCardId, 'servant.drake.skill.sc-drake-1', 'skill');
  add(lowCardId, 'basic.preparation', 'hand');
  add(highCardId, 'basic.luck', 'hand');

  let revision = hub.project(roomId, hostClientId).match!.view.revision;
  expect(hub.dispatchCommand(roomId, hostClientId, { type: 'play_card', cardInstanceId: sourceCardId }, revision).result.ok).toBe(true);
  revision = hub.project(roomId, hostClientId).match!.view.revision;
  expect(hub.dispatchCommand(roomId, hostClientId, {
    type: 'activate_ability', cardInstanceId: sourceCardId, abilityId,
  }, revision).result.ok).toBe(true);
  const owner = hub.project(roomId, hostClientId).match!;
  const interaction = owner.interactionWindows.find((window) => window.kind === 'target' && window.abilityId === abilityId)!;
  return { hub, interaction };
}

function counts(hub: ReturnType<typeof createMatchRoomHub>) {
  const room = hub.getRoom(roomId);
  const projection = hub.project(roomId, hostClientId).match!;
  return {
    revision: projection.view.revision,
    logs: projection.logs.length,
    replay: projection.replay.length,
    replaySnapshots: room.session!.replaySnapshots.length,
    roomVersion: hub.version(roomId),
    pendingId: projection.interactionWindows.find((window) => window.kind === 'target')?.id,
  };
}

describe('P3-TO-13 production interaction boundary', () => {
  it('requires expectedRevision for a server-owned interaction and rejects missing/stale CAS mutation-free', () => {
    const { hub, interaction } = setupHub();
    const before = counts(hub);

    expect(() => hub.dispatchCommand(roomId, hostClientId, {
      type: 'choose_target', decisionId: interaction.id, selectedIds: [lowCardId],
    })).toThrow(/missing_expected_revision/);
    expect(counts(hub)).toEqual(before);

    expect(() => hub.dispatchCommand(roomId, hostClientId, {
      type: 'choose_target', decisionId: interaction.id, selectedIds: [lowCardId],
    }, before.revision - 1)).toThrow(/Stale command revision/);
    expect(counts(hub)).toEqual(before);
  });

  it('keeps rejected private selection out of logs/replay/projection and preserves all boundary counters', () => {
    const { hub, interaction } = setupHub();
    const before = counts(hub);
    const result = hub.dispatchCommand(roomId, hostClientId, {
      type: 'choose_target', decisionId: interaction.id, selectedIds: [highCardId],
    }, before.revision);

    expect(result.result.ok).toBe(false);
    expect(result.result.rejection?.code).toBe('illegal_target');
    expect(counts(hub)).toEqual(before);
    const observer = hub.project(roomId, observerClientId);
    expect(JSON.stringify(observer)).not.toContain(highCardId);
  });

  it('redacts successful owner-only selection payload from shared logs', () => {
    const { hub, interaction } = setupHub();
    const before = counts(hub);
    const result = hub.dispatchCommand(roomId, hostClientId, {
      type: 'choose_target', decisionId: interaction.id, selectedIds: [lowCardId],
    }, before.revision);

    expect(result.result.ok).toBe(true);
    const owner = hub.project(roomId, hostClientId).match!;
    const observer = hub.project(roomId, observerClientId).match!;
    const ownerDispatchLog = owner.logs.findLast((entry) => entry.type === 'dispatch_ok' && entry.message === 'p1:choose_target');
    const observerDispatchLog = observer.logs.findLast((entry) => entry.type === 'dispatch_ok' && entry.message === 'p1:choose_target');
    expect(ownerDispatchLog).toMatchObject({
      type: 'dispatch_ok',
      payload: { command: { type: 'choose_target', privateSelection: 'redacted' } },
    });
    expect(observerDispatchLog).toEqual(ownerDispatchLog);
    expect(JSON.stringify(observerDispatchLog)).not.toContain(lowCardId);
    expect(JSON.stringify(owner.replay)).not.toContain(lowCardId);
    expect(JSON.stringify(observer.replay)).not.toContain(lowCardId);
  });
});
