import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildEvidenceReport,
  compileLoadedPlaytestPack,
  loadPlaytestContentPack,
  validateLoadedPlaytestPack,
} from '../playtest-pack-loader';

import artoriaAlterArchive from '../../../../data/authoring/servants/servant.artoria-alt.json';
import artoriacArchive from '../../../../data/authoring/servants/servant.artoriac.json';
import ereshkigalArchive from '../../../../data/authoring/servants/servant.ereshkigal.json';

const workspaceRoot = resolve('.');
const packPath = resolve('data/packs/fd-playtest-v1/pack.json');

describe('playtest pack loader', () => {
  it('loads the complete approved roster with no blocking issues', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const issues = validateLoadedPlaytestPack(loaded, { workspaceRoot });

    expect(loaded.servants).toHaveLength(
      loaded.manifest.servantFiles.length + (loaded.manifest.authoringServantFiles?.length ?? 0),
    );
    expect(loaded.masters).toHaveLength(7);
    expect(loaded.eventSets).toHaveLength(1);
    expect(loaded.eventSets[0]!.cardIds).toHaveLength(20);
    expect(loaded.eventCards).toHaveLength(18);
    expect(issues.filter((issue) => issue.blocking)).toEqual([]);
  });

  it('produces deterministic compiled output', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });

    expect(compileLoadedPlaytestPack(loaded)).toEqual(
      compileLoadedPlaytestPack(loaded),
    );
  });

  it('preserves executable rule fields for the three Phase 2 golden cards', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const compiled = compileLoadedPlaytestPack(loaded);
    const goldenSources = [
      {
        archive: artoriacArchive,
        cardId: 'servant.artoriac.skill.sc-artoriac-1',
      },
      {
        archive: ereshkigalArchive,
        cardId: 'servant.ereshkigal.skill.sc-ereshkigal-2',
      },
      {
        archive: artoriaAlterArchive,
        cardId: 'servant.artoria-alt.skill.sc-artoria-alt-2',
      },
    ] as const;

    expect(compiled.library.rules.schemaVersion).toBe('fd-card-rule-content-v1');
    expect(compiled.library.rules.definitionHash).toMatch(/^[a-f0-9]{64}$/);

    for (const golden of goldenSources) {
      const sourceCard = golden.archive.cards.find((card) => card.id === golden.cardId)!;
      const compiledArchive = compiled.library.rules.archives.find((archive) => archive.id === golden.archive.id)!;
      const compiledCard = compiledArchive.cards.find((card) => card.id === golden.cardId)!;

      expect(compiledCard.playRequirements).toEqual(sourceCard.playRequirements);
      expect(compiledCard.abilities).toEqual(sourceCard.abilities);
    }
  });

  it('reports missing image references', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    loaded.servants[0]!.source.imagePath = 'chm-extract/图包/does-not-exist.png';

    expect(validateLoadedPlaytestPack(loaded, { workspaceRoot })).toContainEqual(
      expect.objectContaining({
        code: 'MISSING_IMAGE',
        entityId: loaded.servants[0]!.id,
        blocking: true,
      }),
    );
  });

  it('reports duplicate IDs across entity kinds', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    loaded.cards.push(structuredClone(loaded.cards[0]!));

    expect(validateLoadedPlaytestPack(loaded, { workspaceRoot })).toContainEqual(
      expect.objectContaining({
        code: 'DUPLICATE_ENTITY_ID',
        entityId: loaded.cards[0]!.id,
        blocking: true,
      }),
    );
  });

  it('reports unresolved card links', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    loaded.servants[0]!.skillCardIds[0] = 'servant.missing.skill';

    expect(validateLoadedPlaytestPack(loaded, { workspaceRoot })).toContainEqual(
      expect.objectContaining({
        code: 'UNRESOLVED_CARD_REFERENCE',
        entityId: loaded.servants[0]!.id,
        referenceId: 'servant.missing.skill',
        blocking: true,
      }),
    );
  });

  it('reports servant attribute-count drift', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    loaded.servants[0]!.startingDeck.attributeCounts.strength += 1;

    expect(validateLoadedPlaytestPack(loaded, { workspaceRoot })).toContainEqual(
      expect.objectContaining({
        code: 'SERVANT_ATTRIBUTE_COUNTS',
        entityId: loaded.servants[0]!.id,
        blocking: true,
      }),
    );
  });

  it('reports source-backed ambiguities as non-blocking confirmation requests', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const event = loaded.eventCards.find(
      (card) => card.id === 'event.waxing_moon_ritual.keian_ceremony',
    )!;
    event.ambiguities = [
      {
        field: 'effects.draw_and_place_another_event_here.deck_order',
        description: 'Tie handling requires confirmation.',
        source: event.source,
        requiresConfirmation: true,
      },
    ];

    expect(validateLoadedPlaytestPack(loaded, { workspaceRoot })).toContainEqual(
      expect.objectContaining({
        code: 'REQUIRES_CONFIRMATION',
        entityId: event.id,
        field: 'effects.draw_and_place_another_event_here.deck_order',
        blocking: false,
      }),
    );
  });

  it('builds evidence rows with exact character and source image', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
    const report = buildEvidenceReport(loaded, []);

    expect(report.entities).toContainEqual(
      expect.objectContaining({
        entityId: 'event.waxing_moon_ritual.ritual',
        displayName: '盈月之仪',
        imagePath: 'chm-extract/图包/ScreenShot_2025-10-27_211319_640.png',
      }),
    );
  });
});
