import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  compileLoadedPlaytestPack,
  loadPlaytestContentPack,
  validateLoadedPlaytestPack,
} from '../playtest-pack-loader';

const workspaceRoot = resolve('.');
const packPath = resolve('data/packs/fd-playtest-v1/pack.json');
const inventorySha256 = 'FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4';
const reviewerCommit = '52490d1120eddb81077d8b6d524edeb9df31a305';
const cardIds = [
  'servant.albion.skill.sc-albion-1',
  'servant.albion.skill.sc-albion-2',
  'servant.albion.skill.sc-albion-3',
] as const;

describe('Albion metadata-only Candidate', () => {
  it('loads the archive without widening the playable roster or executable archives', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const compiled = compileLoadedPlaytestPack(loaded);

    expect(loaded.metadataArchives.map((archive) => archive.id)).toEqual(['servant.albion', 'servant.altera']);
    expect(loaded.servants.some((servant) => servant.id === 'servant.albion')).toBe(false);
    expect(loaded.cards.some((card) => card.id.startsWith('servant.albion.'))).toBe(false);
    expect(compiled.library.rules.archives.some((archive) => archive.id === 'servant.albion')).toBe(false);
    expect(compiled.library.metadata.archives.find((archive) => archive.id === 'servant.albion')!.scopedContract).toMatchObject({
      reviewerAcceptedCommit: reviewerCommit,
      status: 'CONTRACT_ACCEPTED_FOR_METADATA_ONLY',
      metadataOnly: true,
    });
  });

  it('preserves exact identities, text hashes and blocked capability boundaries', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const archive = loaded.metadataArchives[0]!;

    expect(archive.sourceEvidence).toMatchObject({
      inventoryPath: 'data/phase3/full-roster-ability-inventory.json',
      inventorySha256,
      sourceAuthority: 'frozen_inventory_only',
    });
    expect(archive.cards.map((card) => card.id)).toEqual(cardIds);
    expect(archive.cards.map((card) => card.legacyId)).toEqual(['sc_albion_1', 'sc_albion_2', 'sc_albion_3']);
    expect(archive.cards.map((card) => card.automaticExecution)).toEqual([false, false, false]);
    expect(archive.cards.map((card) => card.capability.status)).toEqual([
      'HOST_ADJUDICATED',
      'HOST_ADJUDICATED',
      'HOST_ADJUDICATED',
    ]);
    expect(archive.cards[0]!.clauseSha256).toEqual([
      '76ce5c6080e5fa7b1cd6642ff87133617f91a07a00020721f56df4366ceba1ab',
      '679fed0d35a87156418c6a298693e00215da2b793ca03b03712f43c5b316915f',
    ]);
    expect(archive.cards[1]!.clauseSha256).toEqual([
      '7cf0bf703fad6229c071b8598c684111a5e16965050226fe1825e3451ba08258',
    ]);
    expect(archive.cards[2]).toMatchObject({
      status: 'SOURCE_EVIDENCE_REQUIRED',
      mappingStatus: 'EXPLICIT_BLOCK',
      blockedBy: ['SEMANTIC_SOURCE_REQUIRED'],
    });

    const serialized = JSON.stringify(archive);
    expect(serialized).not.toMatch(/"(?:abilities|effects|targets|activation|ruleModifiers)"/);
    expect(validateLoadedPlaytestPack(loaded, { workspaceRoot }).filter((issue) => issue.blocking)).toEqual([]);
  });

  it('emits metadata sourceMap and evidence without introducing executable Albion entries', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const compiled = compileLoadedPlaytestPack(loaded);

    expect(Object.keys(compiled.library.metadata.sourceMap)).toEqual([
      ...cardIds,
      'servant.altera.skill.sc-altera-1',
      'servant.altera.skill.sc-altera-2',
      'servant.altera.skill.sc-altera-3',
    ]);
    for (const cardId of cardIds) {
      expect(compiled.library.metadata.sourceMap[cardId]).toMatchObject({
        archiveId: 'servant.albion',
        cardId,
        canonicalId: cardId,
        inventorySha256: inventorySha256,
        sourceAuthority: 'frozen_inventory_only',
        automaticExecution: false,
      });
    }
    expect(compiled.evidenceReport.metadataArchives).toEqual([
      {
        archiveId: 'servant.albion',
        capabilityStatus: 'HOST_ADJUDICATED',
        cardIds: [...cardIds],
        sourceBound: true,
        metadataOnly: true,
        sourceAuthority: 'frozen_inventory_only',
      },
      expect.objectContaining({ archiveId: 'servant.altera' }),
    ]);
  });

  it('keeps checked-in generated metadata separate from executable card definitions', () => {
    const generated = JSON.parse(readFileSync(resolve('data/generated/fd-playtest-v1.content-library.json'), 'utf8')) as {
      metadata: { archives: Array<{ id: string }>; sourceMap: Record<string, unknown> };
      rules: { cards: Record<string, unknown>; sourceMap?: Record<string, unknown> };
    };
    expect(generated.metadata.archives.map((archive) => archive.id)).toEqual(['servant.albion', 'servant.altera']);
    expect(Object.keys(generated.metadata.sourceMap)).toEqual([
      ...cardIds,
      'servant.altera.skill.sc-altera-1',
      'servant.altera.skill.sc-altera-2',
      'servant.altera.skill.sc-altera-3',
    ]);
    expect(Object.keys(generated.rules.sourceMap ?? {})).toEqual(expect.arrayContaining([...cardIds]));
    expect(Object.keys(generated.rules.cards).some((cardId) => cardId.startsWith('servant.albion.'))).toBe(false);
    expect(JSON.stringify(generated.metadata)).not.toMatch(/"(?:abilities|effects|targets|activation|ruleModifiers)"/);
  });
});
