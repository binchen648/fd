import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { sha256Hex } from '../src/ability/portable-sha256';

describe('portable SHA-256', () => {
  it.each(['', 'abc', 'FD executable card pack', '规则引擎'])('matches Node SHA-256 for %j', (input) => {
    expect(sha256Hex(input)).toBe(createHash('sha256').update(input).digest('hex'));
  });
});
