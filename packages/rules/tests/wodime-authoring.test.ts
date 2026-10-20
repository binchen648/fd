import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';

const archivePath = 'data/authoring/masters/master.wodime.json';
const expectedIds = ['ascension', 's1', 's1a', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];

describe('Wodime frozen authoring archive', () => {
  it('preserves all eleven source-grounded cards and bounded runtime status', () => {
    expect(existsSync(archivePath)).toBe(true);
    const raw = JSON.parse(readFileSync(archivePath, 'utf8'));
    expect(raw.id).toBe('master.wodime');
    expect(raw.cards.map((card: any) => card.legacyId)).toEqual(expectedIds);
    expect(raw.cards).toHaveLength(11);
    expect(raw.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(raw.cards.every((card: any) => card.abilities.length === 1 && card.printedText.includes(card.abilities[0].printedClause))).toBe(true);
    const loaded = rules.loadAuthoringJson(raw);
    const report = rules.buildAuthoringAdapterReport(loaded, raw, archivePath);
    expect(report.summary.cards).toBe(11);
    // The archive verification boundary is preserved in raw cards; the adapter
    // report describes interpreter nodes (record_master_directive remains a
    // routable audit marker rather than a completed runtime implementation).
    expect(report.summary.hostAdjudicated).toBe(0);
    expect(report.summary.unsupported).toBe(11);
    expect(report.summary.textUnconfirmed).toBe(0);
  });
});
