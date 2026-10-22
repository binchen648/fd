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
const reviewerCommit = '35c9c275294ef2a3730dcbf48957a785416c5033';
const cardIds = [
  'servant.altera.skill.sc-altera-1',
  'servant.altera.skill.sc-altera-2',
  'servant.altera.skill.sc-altera-3',
] as const;

describe('Altera S3 scoped Candidate metadata', () => {
  it('keeps Altera outside the playable roster and executable archives', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const compiled = compileLoadedPlaytestPack(loaded);

    expect(loaded.metadataArchives.map((archive) => archive.id)).toEqual(['servant.albion', 'servant.altera', 'servant.amakusa']);
    expect(loaded.servants.some((servant) => servant.id === 'servant.altera')).toBe(false);
    expect(loaded.cards.some((card) => card.id.startsWith('servant.altera.'))).toBe(false);
    expect(compiled.library.rules.archives.some((archive) => archive.id === 'servant.altera')).toBe(false);
    expect(compiled.library.metadata.archives.find((archive) => archive.id === 'servant.altera')!.scopedContract).toMatchObject({
      reviewerAcceptedCommit: reviewerCommit,
      status: 'CONTRACT_ACCEPTED_FOR_SCOPED_SUBSET',
      metadataOnly: true,
    });
  });

  it('preserves exact S3 text, three clause hashes, F1/Reference provenance, and S1/S2 blocks', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const archive = loaded.metadataArchives.find((candidate) => candidate.id === 'servant.altera')!;

    expect(archive.sourceEvidence).toMatchObject({
      inventoryPath: 'data/phase3/full-roster-ability-inventory.json',
      inventorySha256,
      sourceAuthority: 'frozen_inventory_only',
    });
    expect(archive.cards.map((card) => card.id)).toEqual(cardIds);
    expect(archive.cards[0]).toMatchObject({
      status: 'SOURCE_EVIDENCE_REQUIRED',
      mappingStatus: 'EXPLICIT_BLOCK',
      blockedBy: ['SEMANTIC_SOURCE_REQUIRED'],
    });
    expect(archive.cards[1]).toMatchObject({
      status: 'SOURCE_EVIDENCE_REQUIRED',
      mappingStatus: 'EXPLICIT_BLOCK',
      blockedBy: ['SEMANTIC_SOURCE_REQUIRED'],
    });
    expect(archive.cards[2]).toMatchObject({
      status: 'PARTIAL_SOURCE_BOUND',
      mappingStatus: 'CONTRACT_MAPPED',
      blockedBy: ['OWNER_BLOCKED_S1_S2'],
      clauseSha256: [
        '1cef15482dd584d9d18b4e9016476b7bffb31cb0331efd38b4025a26611c84c2',
        'f0631437ce658c07be75426fc0394d6f32c6fafc10805bcb359ff17d4de97f85',
        'bd7530459d6ccd00217d1192b06509e322d48bafd44f037c383470ecbba55229',
      ],
    });
    expect(archive.cards.every((card) => card.automaticExecution === false)).toBe(true);
    expect(JSON.stringify(archive)).not.toMatch(/"(?:abilities|effects|targets|activation|ruleModifiers)"/);
    expect(validateLoadedPlaytestPack(loaded, { workspaceRoot }).filter((issue) => issue.blocking)).toEqual([]);
  });

  it('emits only metadata sourceMap/evidence for Altera', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const compiled = compileLoadedPlaytestPack(loaded);
    const sourceMap = compiled.library.metadata.sourceMap;

    expect(Object.keys(sourceMap)).toEqual([
      'servant.albion.skill.sc-albion-1',
      'servant.albion.skill.sc-albion-2',
      'servant.albion.skill.sc-albion-3',
      ...cardIds,
      'servant.amakusa.skill.sc-amakusa-1',
      'servant.amakusa.skill.sc-amakusa-2',
      'servant.amakusa.skill.sc-amakusa-3',
    ]);
    for (const cardId of cardIds) {
      expect(sourceMap[cardId]).toMatchObject({
        archiveId: 'servant.altera',
        cardId,
        canonicalId: cardId,
        inventorySha256,
        sourceAuthority: 'frozen_inventory_only',
        automaticExecution: false,
      });
    }
    expect(compiled.evidenceReport.metadataArchives).toEqual([
      expect.objectContaining({ archiveId: 'servant.albion' }),
      {
        archiveId: 'servant.altera',
        capabilityStatus: 'HOST_ADJUDICATED',
        cardIds: [...cardIds],
        sourceBound: true,
        metadataOnly: true,
        sourceAuthority: 'frozen_inventory_only',
      },
      expect.objectContaining({ archiveId: 'servant.amakusa' }),
    ]);
  });

  it('matches the checked-in generated metadata without adding executable Altera cards', () => {
    const generated = JSON.parse(readFileSync(resolve('data/generated/fd-playtest-v1.content-library.json'), 'utf8')) as {
      metadata: { archives: Array<{ id: string }>; sourceMap: Record<string, unknown> };
      rules: { cards: Record<string, unknown>; sourceMap?: Record<string, unknown> };
    };
    expect(generated.metadata.archives.map((archive) => archive.id)).toEqual(['servant.albion', 'servant.altera', 'servant.amakusa']);
    expect(Object.keys(generated.metadata.sourceMap)).toEqual([
      'servant.albion.skill.sc-albion-1',
      'servant.albion.skill.sc-albion-2',
      'servant.albion.skill.sc-albion-3',
      ...cardIds,
      'servant.amakusa.skill.sc-amakusa-1',
      'servant.amakusa.skill.sc-amakusa-2',
      'servant.amakusa.skill.sc-amakusa-3',
    ]);
    expect(Object.keys(generated.rules.cards).some((cardId) => cardId.startsWith('servant.altera.'))).toBe(false);
    expect(JSON.stringify(generated.metadata)).not.toMatch(/"(?:abilities|effects|targets|activation|ruleModifiers)"/);
  });
});
