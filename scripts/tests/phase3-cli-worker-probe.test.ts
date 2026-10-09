import { describe, expect, it } from 'vitest';
import { verifyWorkerAck } from '../phase3-cli-worker-probe';

describe('CLI worker ACK correlation', () => {
  const completion = { threadId: 'thread-1', turn: { id: 'turn-1', status: 'completed' } };
  const items = [{ type: 'agentMessage', text: 'ACK:d1' }];

  it('requires exact assistant text and completed status for the same thread and turn', () => {
    expect(verifyWorkerAck('thread-1', 'turn-1', 'd1', completion, items)).toBe(true);
    expect(verifyWorkerAck('other-thread', 'turn-1', 'd1', completion, items)).toBe(false);
    expect(verifyWorkerAck('thread-1', 'other-turn', 'd1', completion, items)).toBe(false);
    expect(verifyWorkerAck('thread-1', 'turn-1', 'd1',
      { ...completion, turn: { id: 'turn-1', status: 'failed' } }, items)).toBe(false);
  });

  it('does not accept ACK prefixes, user echoes, or extra assistant output', () => {
    for (const invalid of [
      [{ type: 'agentMessage', text: 'ACK:d10' }],
      [{ type: 'userMessage', text: 'ACK:d1' }],
      [{ type: 'agentMessage', text: 'ACK:d1 extra' }],
      [...items, { type: 'agentMessage', text: 'extra' }],
    ]) expect(verifyWorkerAck('thread-1', 'turn-1', 'd1', completion, invalid)).toBe(false);
  });
});
