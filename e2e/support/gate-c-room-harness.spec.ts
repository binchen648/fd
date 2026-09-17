import { expect, test } from '@playwright/test';
import type { ClientRoomMessage } from '@fd/rules';
import {
  buildLifecycleSourceActiveSnapshot,
  lifecycleSourceCardId,
} from './build-lifecycle-source-active-snapshot';
import {
  expectStaleGateCRoomMessageRejected,
  latestGateCMatch,
  observeGateCRoomSocket,
  openGateCRemoteRoom,
  reloadGateCRoomAndWaitForRevision,
  restoreGateCRoomSnapshot,
  sendGateCRoomMessage,
} from './gate-c-room-harness';

test('Gate C room harness proves reconnect continuity and stale command rejection on a real room', async ({ page, request }) => {
  const roomId = `fd-gate-c-factory-${Date.now()}`;
  const snapshot = buildLifecycleSourceActiveSnapshot(roomId);
  const room = await restoreGateCRoomSnapshot(request, snapshot);
  const trace = observeGateCRoomSocket(page);

  await openGateCRemoteRoom(page, room);
  await expect.poll(() => latestGateCMatch(trace)?.phase).toBe('action');
  const initialRevision = latestGateCMatch(trace)?.view.revision;
  expect(initialRevision).toEqual(expect.any(Number));

  const playMessage: ClientRoomMessage = {
    type: 'client:dispatch_command',
    expectedRevision: initialRevision,
    command: { type: 'play_card', cardInstanceId: lifecycleSourceCardId },
  };
  await sendGateCRoomMessage(page, room, playMessage);
  await expect.poll(() => latestGateCMatch(trace)?.view.revision).toBeGreaterThan(initialRevision!);
  const committedRevision = latestGateCMatch(trace)!.view.revision;

  await reloadGateCRoomAndWaitForRevision(page, trace, committedRevision);
  expect(latestGateCMatch(trace)?.view.cards.some((card) => card.instanceId === lifecycleSourceCardId)).toBe(true);

  await expectStaleGateCRoomMessageRejected(page, room, playMessage, trace, committedRevision);
  expect(latestGateCMatch(trace)?.view.revision).toBe(committedRevision);
});
