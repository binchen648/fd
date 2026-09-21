import { createHash, createHmac } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { hmacSha256Hex, sha256Hex } from '../src/ability/portable-sha256';

describe('portable SHA-256', () => {
  it.each(['', 'abc', 'FD executable card pack', '规则引擎'])('matches Node SHA-256 for %j', (input) => {
    expect(sha256Hex(input)).toBe(createHash('sha256').update(input).digest('hex'));
  });
  it.each([
    ['key', 'message'],
    ['fd-secret', 'sealed-authority'],
    ['规则密钥', '冻结事务'],
  ])('matches Node HMAC-SHA-256 for %j / %j', (key, message) => {
    expect(hmacSha256Hex(key, message)).toBe(createHmac('sha256', key).update(message).digest('hex'));
  });});
