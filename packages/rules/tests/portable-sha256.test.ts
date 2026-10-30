import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transpileModule, ModuleKind, ScriptTarget } from 'typescript';

import { afterEach, describe, expect, it, vi } from 'vitest';

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
  });
});

describe('large snapshot SHA acceleration with portable parity', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.resetModules(); });

  it('uses the Node builtin for a large SHA input while keeping short SHA and HMAC portable', async () => {
    const crypto = process.getBuiltinModule('node:crypto');
    const actualGetBuiltin = process.getBuiltinModule.bind(process);
    const nativeHash = vi.fn(crypto.createHash);
    vi.spyOn(process, 'getBuiltinModule').mockImplementation(name => name === 'node:crypto'
      ? { ...crypto, createHash: nativeHash } : actualGetBuiltin(name));
    vi.resetModules();
    const accelerated = await import('../src/ability/portable-sha256');
    expect(accelerated.sha256Hex('abc')).toBe(createHash('sha256').update('abc').digest('hex'));
    expect(accelerated.hmacSha256Hex('key', 'message')).toBe(createHmac('sha256', 'key').update('message').digest('hex'));
    expect(nativeHash).not.toHaveBeenCalled();
    for (const input of ['a'.repeat(4096), '规则😀\ud800'.repeat(2000), 'long snapshot'.repeat(10000)]) {
      expect(accelerated.sha256Hex(input)).toBe(createHash('sha256').update(input).digest('hex'));
    }
    expect(nativeHash).toHaveBeenCalledTimes(3);
    expect(nativeHash).toHaveBeenCalledWith('sha256');
  });

  it('preserves the real browser fallback without process and when builtin loading is unavailable', async () => {
    const input = '冻结事务😀\ud800'.repeat(2000);
    const source = readFileSync(new URL('../src/ability/portable-sha256.ts', import.meta.url), 'utf8');
    const js = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 } }).outputText;
    const browser = { exports: {} as typeof import('../src/ability/portable-sha256'), TextEncoder };
    runInNewContext(js, browser);
    expect(browser.exports.sha256Hex(input)).toBe(createHash('sha256').update(input).digest('hex'));
    expect(browser.exports.hmacSha256Hex('密钥\udfff'.repeat(100), input)).toBe(createHmac('sha256', '密钥\udfff'.repeat(100)).update(input).digest('hex'));
    vi.spyOn(process, 'getBuiltinModule').mockImplementation(() => undefined);
    vi.resetModules();
    const unsupportedNode = await import('../src/ability/portable-sha256');
    expect(unsupportedNode.sha256Hex(input)).toBe(browser.exports.sha256Hex(input));
  });

  it('keeps published SHA-256 and RFC4231 HMAC vectors byte-identical', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(hmacSha256Hex('\x0b'.repeat(20), 'Hi There')).toBe('b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');
  });
});
