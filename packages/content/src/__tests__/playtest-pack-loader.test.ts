import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

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

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function createMinimalWorkspace(
  includeSourceAsset: boolean,
  options: { declareSourceImage?: boolean; includeHtmSource?: boolean } = {},
): { root: string; packPath: string } {
  const declareSourceImage = options.declareSourceImage ?? true;
  const includeHtmSource = options.includeHtmSource ?? true;
  const root = mkdtempSync(join(tmpdir(), `fd-pack-${includeSourceAsset ? 'assets' : 'clean'}-`));
  const packPath = join(root, 'data/packs/minimal/pack.json');
  writeJson(join(root, 'data/packs/minimal/dictionaries/basic-attacks.json'), {});
  writeJson(packPath, {
    id: 'minimal-pack',
    name: 'Minimal Pack',
    version: 1,
    dictionaries: { basicAttacks: 'data/packs/minimal/dictionaries/basic-attacks.json' },
    servantFiles: [],
    servantCardFiles: [],
    masterFiles: [],
    masterCardFiles: [],
    authoringServantFiles: [],
    authoringMasterFiles: ['data/authoring/masters/master.test.json'],
    eventSetFiles: [],
    eventCardFiles: [],
  });
  writeJson(join(root, 'data/authoring/masters/master.test.json'), {
    schemaVersion: 'fd-card-authoring-v1',
    id: 'master.test',
    name: 'Test Master',
    sources: [
      ...(includeHtmSource ? [{ type: 'chm_html', path: 'D:/fd/chm-extract/Test Master.htm' }] : []),
      ...(declareSourceImage ? [{ type: 'original_card_image', path: 'D:/fd/chm-extract/图包/declared.png' }] : []),
    ],
    ...(declareSourceImage ? { publicInformation: {
      sourceImage: 'D:/fd/chm-extract/图包/declared.png',
    } } : {}),
    cards: [
      {
        id: 'master.test.skill.one',
        name: 'One',
        cardType: 'master_skill',
        printedText: '行动阶段：获得1点魔力。',
        cardFace: { cost: 0, basePower: 0 },
        playTiming: { phase: 'action' },
        abilities: [],
        evidence: declareSourceImage ? [
          {
            type: 'original_card_image',
            path: 'D:/fd/chm-extract/图包/declared.png',
            imageIndex: 0,
            htmPath: 'D:/fd/chm-extract/Test Master.htm',
          },
        ] : [
          {
            type: 'chm_html',
            path: 'D:/fd/chm-extract/Test Master.htm',
          },
        ],
      },
    ],
  });
  const htmPath = join(root, 'chm-extract/Test Master.htm');
  mkdirSync(dirname(htmPath), { recursive: true });
  writeFileSync(htmPath, '<img src="图包/ScreenShot_should_not_be_inferred.png">', 'utf8');
  if (includeSourceAsset) {
    const imagePath = join(root, 'chm-extract/图包/declared.png');
    mkdirSync(dirname(imagePath), { recursive: true });
    writeFileSync(imagePath, 'not-a-real-image-but-present-for-validation', 'utf8');
  }
  return { root, packPath };
}

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
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'SOURCE_ASSET_UNVERIFIED',
      blocking: false,
    }));
  });

  it('produces deterministic compiled output', () => {
    const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });

    expect(compileLoadedPlaytestPack(loaded)).toEqual(
      compileLoadedPlaytestPack(loaded),
    );
  });

  it('compiles identical source metadata and definition hash with source assets present or absent', () => {
    const withAssets = createMinimalWorkspace(true);
    const withoutAssets = createMinimalWorkspace(false);
    try {
      const loadedWithAssets = loadPlaytestContentPack(withAssets.packPath, { workspaceRoot: withAssets.root });
      const loadedWithoutAssets = loadPlaytestContentPack(withoutAssets.packPath, { workspaceRoot: withoutAssets.root });
      const compiledWithAssets = compileLoadedPlaytestPack(loadedWithAssets).library;
      const compiledWithoutAssets = compileLoadedPlaytestPack(loadedWithoutAssets).library;

      expect(compiledWithAssets.masters[0]!.source).toEqual({
        htmPath: 'chm-extract/Test Master.htm',
        imagePath: 'chm-extract/图包/declared.png',
        imageIndex: 0,
        reviewedAgainstImage: true,
      });
      expect(compiledWithoutAssets.masters[0]!.source).toEqual(compiledWithAssets.masters[0]!.source);
      expect(compiledWithoutAssets.cards).toEqual(compiledWithAssets.cards);
      expect(compiledWithoutAssets.rules.definitionHash).toBe(compiledWithAssets.rules.definitionHash);
    } finally {
      rmSync(withAssets.root, { recursive: true, force: true });
      rmSync(withoutAssets.root, { recursive: true, force: true });
    }
  });

  it('requires explicit source image declarations instead of inferring from local HTM', () => {
    const workspace = createMinimalWorkspace(false, { declareSourceImage: false });
    try {
      const loaded = loadPlaytestContentPack(workspace.packPath, { workspaceRoot: workspace.root });
      const compiled = compileLoadedPlaytestPack(loaded).library;

      expect(compiled.masters[0]!.source).toEqual({
        htmPath: 'chm-extract/Test Master.htm',
        imagePath: '',
        imageIndex: 0,
        reviewedAgainstImage: false,
      });
      expect(JSON.stringify(compiled)).not.toContain('ScreenShot_should_not_be_inferred.png');
      expect(validateLoadedPlaytestPack(loaded, { workspaceRoot: workspace.root })).toContainEqual(
        expect.objectContaining({
          code: 'SOURCE_EVIDENCE_REQUIRED',
          entityId: 'master.test',
          field: 'source.imagePath',
          blocking: true,
        }),
      );
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
    }
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

    expect(validateLoadedPlaytestPack(loaded, { workspaceRoot, sourceAssetValidation: 'required' })).toContainEqual(
      expect.objectContaining({
        code: 'MISSING_IMAGE',
        entityId: loaded.servants[0]!.id,
        blocking: true,
      }),
    );
  });

  it('keeps clean-checkout source asset validation nonblocking in metadata-only mode', () => {
    const workspace = createMinimalWorkspace(false);
    try {
      const loaded = loadPlaytestContentPack(workspace.packPath, { workspaceRoot: workspace.root });
      expect(validateLoadedPlaytestPack(loaded, { workspaceRoot: workspace.root })).toContainEqual(
        expect.objectContaining({
          code: 'SOURCE_ASSET_UNVERIFIED',
          entityId: 'master.test',
          blocking: false,
        }),
      );
      expect(validateLoadedPlaytestPack(loaded, {
        workspaceRoot: workspace.root,
        sourceAssetValidation: 'required',
      })).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_IMAGE',
          entityId: 'master.test',
          blocking: true,
        }),
      );
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
    }
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
