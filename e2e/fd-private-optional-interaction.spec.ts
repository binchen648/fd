import { expect, test } from '@playwright/test';
import type { ClientRoomMessage } from '@fd/rules';
import {
  buildPrivateOptionalInteractionSnapshot,
  interactionAbilityId,
  interactionHighCardId,
  interactionHostClientId,
  interactionLowThreeCardId,
  interactionLowTwoCardId,
  interactionObserverClientId,
  interactionSourceCardId,
} from './support/build-private-optional-interaction-snapshot';
import {
  expectStaleGateCRoomMessageRejected,
  gateCClientFromSnapshot,
  latestGateCMatch,
  observeGateCRoomSocket,
  openGateCRemoteRoom,
  reloadGateCRoomAndWaitForRevision,
  restoreGateCRoomSnapshot,
  sendGateCRoomMessage,
} from './support/gate-c-room-harness';

function targetWindow(match: ReturnType<typeof latestGateCMatch>) {
  return match?.interactionWindows.find((window) => window.kind === 'target' && window.abilityId === interactionAbilityId);
}

function playerMana(match: ReturnType<typeof latestGateCMatch>, playerId: string) {
  return match?.view.players.find((player) => player.id === playerId)?.mana;
}

test('TO13 keeps private optional candidates owner-only across reconnect and settles by server interaction identity', async ({ browser, request }) => {
  const roomId = `fd-interaction-${Date.now()}`;
  const snapshot = buildPrivateOptionalInteractionSnapshot(roomId);
  const host = await restoreGateCRoomSnapshot(request, snapshot);
  expect(host.clientId).toBe(interactionHostClientId);
  const observer = gateCClientFromSnapshot(snapshot, interactionObserverClientId);
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const observerPage = await context.newPage();
  const hostTrace = observeGateCRoomSocket(hostPage);
  const observerTrace = observeGateCRoomSocket(observerPage);

  await openGateCRemoteRoom(hostPage, host);
  await openGateCRemoteRoom(observerPage, observer);
  await expect.poll(() => latestGateCMatch(hostTrace)?.phase).toBe('action');
  await expect.poll(() => latestGateCMatch(observerTrace)?.phase).toBe('action');

  const playRevision = latestGateCMatch(hostTrace)!.view.revision;
  const playMessage: ClientRoomMessage = {
    type: 'client:dispatch_command',
    expectedRevision: playRevision,
    command: { type: 'play_card', cardInstanceId: interactionSourceCardId },
  };
  await sendGateCRoomMessage(hostPage, host, playMessage);
  await expect.poll(() => latestGateCMatch(hostTrace)!.view.revision).toBeGreaterThan(playRevision);

  const activateRevision = latestGateCMatch(hostTrace)!.view.revision;
  const activateMessage: ClientRoomMessage = {
    type: 'client:dispatch_command',
    expectedRevision: activateRevision,
    command: { type: 'activate_ability', cardInstanceId: interactionSourceCardId, abilityId: interactionAbilityId },
  };
  await sendGateCRoomMessage(hostPage, host, activateMessage);
  await expect.poll(() => targetWindow(latestGateCMatch(hostTrace))?.template).toBe('target');

  const ownerWindow = targetWindow(latestGateCMatch(hostTrace))!;
  expect(ownerWindow).toMatchObject({
    kind: 'target',
    controllerId: 'p1',
    sourceCardInstanceId: interactionSourceCardId,
    abilityId: interactionAbilityId,
    min: 0,
    max: 3,
    template: 'target',
    visibility: 'owner_only',
    cancelPolicy: 'forbidden',
  });
  expect(ownerWindow.createdRevision).toBe(latestGateCMatch(hostTrace)!.view.revision);
  expect(ownerWindow.candidates?.map((candidate) => candidate.id)).toEqual([
    interactionLowTwoCardId,
    interactionLowThreeCardId,
  ]);
  expect(ownerWindow.candidates?.some((candidate) => candidate.id === interactionHighCardId)).toBe(false);
  expect(JSON.stringify(latestGateCMatch(hostTrace))).not.toContain('continuationRef');

  const interactionRevision = latestGateCMatch(hostTrace)!.view.revision;
  await expect.poll(() => latestGateCMatch(observerTrace)?.view.revision).toBe(interactionRevision);
  expect(targetWindow(latestGateCMatch(observerTrace))).toBeUndefined();
  let observerJson = JSON.stringify(latestGateCMatch(observerTrace));
  expect(observerJson).not.toContain(interactionLowTwoCardId);
  expect(observerJson).not.toContain(interactionLowThreeCardId);
  expect(observerJson).not.toContain('continuationRef');

  const interactionId = ownerWindow.id;
  const logsBeforeRejected = latestGateCMatch(hostTrace)!.logs.length;
  const replayBeforeRejected = latestGateCMatch(hostTrace)!.replay.length;

  const missingRevisionErrors = hostTrace.errors.length;
  const missingRevisionMessage = {
    type: 'client:dispatch_command',
    requestId: 'missing-interaction-revision',
    command: { type: 'choose_target', decisionId: interactionId, selectedIds: [interactionLowTwoCardId] },
  } as unknown as ClientRoomMessage;
  await sendGateCRoomMessage(hostPage, host, missingRevisionMessage);
  await expect.poll(() => hostTrace.errors.length).toBeGreaterThan(missingRevisionErrors);
  expect(hostTrace.errors.at(-1)?.message).toContain('missing_expected_revision');
  expect(latestGateCMatch(hostTrace)!.view.revision).toBe(interactionRevision);
  expect(latestGateCMatch(hostTrace)!.logs).toHaveLength(logsBeforeRejected);
  expect(latestGateCMatch(hostTrace)!.replay).toHaveLength(replayBeforeRejected);
  expect(targetWindow(latestGateCMatch(hostTrace))?.id).toBe(interactionId);

  const hostProjectionCountBeforeInvalid = hostTrace.projections.length;
  const observerProjectionCountBeforeInvalid = observerTrace.projections.length;
  const invalidPrivateMessage: ClientRoomMessage = {
    type: 'client:dispatch_command',
    requestId: 'invalid-private-target',
    expectedRevision: interactionRevision,
    command: { type: 'choose_target', decisionId: interactionId, selectedIds: [interactionHighCardId] },
  };
  await sendGateCRoomMessage(hostPage, host, invalidPrivateMessage);
  await expect.poll(() => hostTrace.projections.length).toBeGreaterThan(hostProjectionCountBeforeInvalid);
  await expect.poll(() => observerTrace.projections.length).toBeGreaterThan(observerProjectionCountBeforeInvalid);
  expect(latestGateCMatch(hostTrace)!.view.revision).toBe(interactionRevision);
  expect(latestGateCMatch(hostTrace)!.logs).toHaveLength(logsBeforeRejected);
  expect(latestGateCMatch(hostTrace)!.replay).toHaveLength(replayBeforeRejected);
  expect(targetWindow(latestGateCMatch(hostTrace))?.id).toBe(interactionId);
  observerJson = JSON.stringify(latestGateCMatch(observerTrace));
  expect(observerJson).not.toContain(interactionHighCardId);

  await reloadGateCRoomAndWaitForRevision(hostPage, hostTrace, interactionRevision);
  const restoredWindow = targetWindow(latestGateCMatch(hostTrace));
  expect(restoredWindow?.id).toBe(interactionId);
  expect(restoredWindow?.candidates?.map((candidate) => candidate.id)).toEqual([
    interactionLowTwoCardId,
    interactionLowThreeCardId,
  ]);

  const chooseMessage: ClientRoomMessage = {
    type: 'client:dispatch_command',
    expectedRevision: interactionRevision,
    command: { type: 'choose_target', decisionId: interactionId, selectedIds: [interactionLowTwoCardId] },
  };
  await sendGateCRoomMessage(hostPage, host, chooseMessage);
  await expect.poll(() => latestGateCMatch(hostTrace)!.view.revision).toBeGreaterThan(interactionRevision);
  const settledRevision = latestGateCMatch(hostTrace)!.view.revision;
  await expect.poll(() => targetWindow(latestGateCMatch(hostTrace))).toBeUndefined();
  expect(playerMana(latestGateCMatch(hostTrace), 'p1')).toBe(8);
  expect(latestGateCMatch(hostTrace)?.view.cards).toContainEqual(expect.objectContaining({
    instanceId: interactionLowTwoCardId,
    zone: 'attack_area',
  }));
  await expect.poll(() => latestGateCMatch(observerTrace)?.view.revision).toBe(settledRevision);
  expect(JSON.stringify(latestGateCMatch(observerTrace)?.logs)).not.toContain(interactionLowTwoCardId);
  expect(JSON.stringify(latestGateCMatch(observerTrace)?.replay)).not.toContain(interactionLowTwoCardId);

  await reloadGateCRoomAndWaitForRevision(hostPage, hostTrace, settledRevision);
  expect(targetWindow(latestGateCMatch(hostTrace))).toBeUndefined();

  await expectStaleGateCRoomMessageRejected(hostPage, host, chooseMessage, hostTrace, settledRevision);
  expect(targetWindow(latestGateCMatch(hostTrace))).toBeUndefined();
  expect(playerMana(latestGateCMatch(hostTrace), 'p1')).toBe(8);

  await context.close();
});
