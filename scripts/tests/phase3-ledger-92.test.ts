import { describe, expect, it } from 'vitest';
import { buildLedger, validateLedger } from '../phase3-ledger-92';

describe('P3-A-LEDGER-92-RECALC', () => {
  it('recalculates the exact pack-manifest denominator and required per-ability fields', () => {
    const ledger = buildLedger(process.cwd());
    expect(ledger.denominator).toMatchObject({ archives: 14, cards: 46, abilities: 92 });
    expect(ledger.abilities).toHaveLength(92);
    expect(new Set(ledger.abilities.map((row) => row.abilityKey)).size).toBe(92);
    expect(ledger.summary.totalAbilities).toBe(92);

    for (const row of ledger.abilities) {
      expect(row).toEqual(expect.objectContaining({
        archiveId: expect.any(String),
        cardId: expect.any(String),
        abilityId: expect.any(String),
        source: expect.any(Object),
        runtimeOwner: expect.any(Object),
        route: expect.any(Object),
        tests: expect.any(Object),
        gate: expect.any(Object),
        r: expect.any(Object),
        main: expect.any(Object),
        missingContract: expect.any(Array),
        nextOwner: expect.stringMatching(/^(B|R)$/),
      }));
      expect(row.gate).toMatchObject({
        gateA: { status: 'NOT_VERIFIED' },
        gateB: { status: 'NOT_VERIFIED' },
        gateC: { status: 'NOT_VERIFIED' },
      });
      expect(row.r).toMatchObject({ status: 'NOT_MACHINE_VERIFIED' });
    }
  }, 15_000);

  it('rejects stale or modified machine evidence', () => {
    const expected = buildLedger(process.cwd());
    const modified = structuredClone(expected);
    modified.abilities[0]!.nextOwner = modified.abilities[0]!.nextOwner === 'R' ? 'B' : 'R';
    expect(() => validateLedger(modified, expected)).toThrow('Ledger differs from a fresh source recalculation.');

    const stale = structuredClone(expected);
    stale.sourceFingerprint = 'stale';
    expect(() => validateLedger(stale, expected)).toThrow('Ledger sourceFingerprint is stale.');
  }, 15_000);
});
