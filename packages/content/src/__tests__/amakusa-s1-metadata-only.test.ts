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
const sourcePacketCommit = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';
const sourceFileSha256 = 'bdaf76fc082d2c9152918dcda2a8700aa155c4b65cb596c7e9b28be8f264b803';
const inventoryInputDigest = '5a38c668211b196a74e65dffba096b8ba650b495f90d5f11d733e98aecad1211';
const reviewerCommit = '053bcb8537d1861cd5c81721c4760529ca87f145';
const cardIds = [
  'servant.amakusa.skill.sc-amakusa-1',
  'servant.amakusa.skill.sc-amakusa-2',
  'servant.amakusa.skill.sc-amakusa-3',
] as const;

describe('Amakusa S1 metadata-only Candidate', () => {
  it('keeps Amakusa outside the playable roster and executable archives', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const compiled = compileLoadedPlaytestPack(loaded);

    expect(loaded.metadataArchives.map((archive) => archive.id)).toEqual([
      'servant.albion',
      'servant.altera',
      'servant.amakusa',
    ]);
    expect(loaded.servants.some((servant) => servant.id === 'servant.amakusa')).toBe(false);
    expect(loaded.cards.some((card) => card.id.startsWith('servant.amakusa.'))).toBe(false);
    expect(compiled.library.rules.archives.some((archive) => archive.id === 'servant.amakusa')).toBe(false);
  });

  it('preserves exact S1 source identity, text, hashes, provenance warning, and S2/S3 blocks', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const archive = loaded.metadataArchives.find((candidate) => candidate.id === 'servant.amakusa')!;

    expect(archive.scopedContract).toMatchObject({
      decisionId: 'amakusa-s1-metadata-only-2026-10-22',
      reviewerAcceptedCommit: reviewerCommit,
      baseCommit: '0e0e0977caf96b179912250bcd486dccadfbff14',
      status: 'CONTRACT_ACCEPTED_FOR_METADATA_ONLY',
      metadataOnly: true,
    });
    expect(archive.sourceEvidence).toMatchObject({
      inventoryPath: 'data/phase3/full-roster-ability-inventory.json',
      inventorySha256,
      sourceAuthority: 'frozen_inventory_only',
    });
    expect(archive.cards.map((card) => card.id)).toEqual(cardIds);
    expect(archive.cards[0]).toMatchObject({
      id: cardIds[0],
      legacyId: 'sc_amakusa_1',
      printedText: '【真名解放】<每局游戏限一次>X=以此牌效果移除的事件牌的印刷战果数总和的2倍。\n打出时：将所有正面向上的事件牌移除游戏。',
      clauseSha256: ['40ca176f770bc55f453580c51729752eebcab51af6377ac7ca893764bb7027af'],
      status: 'PARTIAL_SOURCE_BOUND',
      mappingStatus: 'CONTRACT_MAPPED',
      automaticExecution: false,
      metadataOnly: true,
    });
    expect(archive.cards[0]!.sourceMap).toMatchObject({
      sourcePacketCommit,
      sourcePacketPath: 'src/content/authoring/cards.json',
      sourceFileSha256,
      inventoryInputDigest,
      provenanceWarning: 'inventoryInputDigest differs from historical raw sourceFileSha256; mismatch retained',
    });
    expect(archive.cards[1]).toMatchObject({
      status: 'SOURCE_EVIDENCE_REQUIRED',
      mappingStatus: 'EXPLICIT_BLOCK',
      blockedBy: ['SEMANTIC_SOURCE_REQUIRED'],
      automaticExecution: false,
    });
    expect(archive.cards[2]).toMatchObject({
      status: 'SOURCE_EVIDENCE_REQUIRED',
      mappingStatus: 'EXPLICIT_BLOCK',
      blockedBy: ['SEMANTIC_SOURCE_REQUIRED'],
      automaticExecution: false,
    });
    expect(archive.cards.every((card) => card.capability.status === 'HOST_ADJUDICATED')).toBe(true);
    expect(JSON.stringify(archive)).not.toMatch(/"(?:abilities|effects|targets|activation|ruleModifiers)"/);
    expect(validateLoadedPlaytestPack(loaded, { workspaceRoot }).filter((issue) => issue.blocking)).toEqual([]);
  });

  it('compiles deterministically to metadata-only sourceMap/evidence', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const first = compileLoadedPlaytestPack(loaded);
    const second = compileLoadedPlaytestPack(loadPlaytestContentPack(packPath, { workspaceRoot }));

    expect(JSON.stringify(first.library.metadata)).toBe(JSON.stringify(second.library.metadata));
    expect(Object.keys(first.library.metadata.sourceMap)).toEqual([
      'servant.albion.skill.sc-albion-1',
      'servant.albion.skill.sc-albion-2',
      'servant.albion.skill.sc-albion-3',
      'servant.altera.skill.sc-altera-1',
      'servant.altera.skill.sc-altera-2',
      'servant.altera.skill.sc-altera-3',
      ...cardIds,
    ]);
    expect(first.library.metadata.sourceMap[cardIds[0]]).toMatchObject({
      archiveId: 'servant.amakusa',
      cardId: cardIds[0],
      canonicalId: cardIds[0],
      legacyId: 'sc_amakusa_1',
      inventorySha256,
      sourceAuthority: 'frozen_inventory_only',
      automaticExecution: false,
    });
    expect(first.evidenceReport.metadataArchives).toEqual([
      expect.objectContaining({ archiveId: 'servant.albion' }),
      expect.objectContaining({ archiveId: 'servant.altera' }),
      {
        archiveId: 'servant.amakusa',
        capabilityStatus: 'HOST_ADJUDICATED',
        cardIds: [...cardIds],
        sourceBound: true,
        metadataOnly: true,
        sourceAuthority: 'frozen_inventory_only',
      },
    ]);
  });

  it('matches checked-in generated metadata without executable Amakusa cards', () => {
    const generated = JSON.parse(readFileSync(resolve('data/generated/fd-playtest-v1.content-library.json'), 'utf8')) as {
      metadata: { archives: Array<{ id: string }>; sourceMap: Record<string, unknown> };
      rules: { cards: Record<string, unknown>; sourceMap?: Record<string, unknown> };
    };
    expect(generated.metadata.archives.map((archive) => archive.id)).toEqual([
      'servant.albion',
      'servant.altera',
      'servant.amakusa',
    ]);
    expect(Object.keys(generated.metadata.sourceMap)).toEqual([
      'servant.albion.skill.sc-albion-1',
      'servant.albion.skill.sc-albion-2',
      'servant.albion.skill.sc-albion-3',
      'servant.altera.skill.sc-altera-1',
      'servant.altera.skill.sc-altera-2',
      'servant.altera.skill.sc-altera-3',
      ...cardIds,
    ]);
    expect(Object.keys(generated.rules.cards).some((cardId) => cardId.startsWith('servant.amakusa.'))).toBe(false);
    expect(JSON.stringify(generated.metadata)).not.toMatch(/"(?:abilities|effects|targets|activation|ruleModifiers)"/);
  });
});
