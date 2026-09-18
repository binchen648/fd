import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    authoringMasterSupportFiles: [],
    authoringMasterRuleFiles: [],
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

function addMasterSupportArchive(
  workspace: { root: string; packPath: string },
  mutate?: (archive: Record<string, any>) => void,
  registerAs: 'support' | 'master' = 'support',
): Record<string, any> {
  const archive: Record<string, any> = {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'master_support_definition_archive',
    id: 'master.support-owner',
    name: 'Support Owner',
    cards: [{
      id: 'card.support.only',
      name: 'Support Only',
      cardType: 'master_skill',
      initialPlacement: 'outside_game',
      printedText: 'support only',
      cardFace: { cost: 1, basePower: 1 },
      playTiming: { phase: 'action' },
      playRequirements: [],
      abilities: [],
    }],
  };
  mutate?.(archive);
  const relativePath = 'data/authoring/support/master.support-owner.json';
  writeJson(join(workspace.root, relativePath), archive);
  const manifest = JSON.parse(readFileSync(workspace.packPath, 'utf8')) as Record<string, any>;
  if (registerAs === 'support') manifest.authoringMasterSupportFiles = [relativePath];
  else manifest.authoringMasterFiles = [...(manifest.authoringMasterFiles ?? []), relativePath];
  writeJson(workspace.packPath, manifest);
  return archive;
}

function addMasterRuleArchive(
  workspace: { root: string; packPath: string },
  mutate?: (archive: Record<string, any>) => void,
  registerAs: 'rule' | 'support' | 'master' = 'rule',
): Record<string, any> {
  const archive: Record<string, any> = {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'master_rule_definition_archive',
    id: 'master.rule-owner',
    name: 'Rule Owner',
    cards: [
      {
        id: 'master.rule-owner.skill.source',
        name: 'Rule Source',
        cardType: 'master_skill',
        owner: { type: 'master', id: 'master.rule-owner' },
        printedText: 'provision target',
        cardFace: { typeLabel: '被动', attributes: [] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [{
          id: 'source.game-start-provision', kind: 'forced_trigger', printedClause: 'provision target',
          activation: { trigger: 'game_start' }, conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [],
          lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: ['master.rule-owner.skill.target'] }],
          execution: { mode: 'automatic', allowedOperations: [] },
        }],
      },
      {
        id: 'master.rule-owner.skill.target',
        name: 'Rule Target',
        cardType: 'master_skill',
        owner: { type: 'master', id: 'master.rule-owner' },
        initialPlacement: 'outside_game',
        printedText: 'outside game target',
        cardFace: { cost: 1, basePower: 1 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [],
      },
    ],
  };
  mutate?.(archive);
  const relativePath = 'data/authoring/rules/master.rule-owner.json';
  writeJson(join(workspace.root, relativePath), archive);
  const manifest = JSON.parse(readFileSync(workspace.packPath, 'utf8')) as Record<string, any>;
  if (registerAs === 'rule') manifest.authoringMasterRuleFiles = [relativePath];
  else if (registerAs === 'support') manifest.authoringMasterSupportFiles = [relativePath];
  else manifest.authoringMasterFiles = [...(manifest.authoringMasterFiles ?? []), relativePath];
  writeJson(workspace.packPath, manifest);
  return archive;
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

  it('loads master support archives into rules only without widening the playable roster', () => {
    const workspace = createMinimalWorkspace(false);
    try {
      const support = addMasterSupportArchive(workspace);
      const loaded = loadPlaytestContentPack(workspace.packPath, { workspaceRoot: workspace.root });
      const compiled = compileLoadedPlaytestPack(loaded);

      expect(loaded.masters.map((master) => master.id)).toEqual(['master.test']);
      expect(loaded.cards.some((card) => card.id === support.cards[0].id)).toBe(false);
      expect(loaded.authoringArchives.map((archive) => archive.id)).toEqual(['master.test', support.id]);
      expect(compiled.library.masters.map((master) => master.id)).toEqual(['master.test']);
      expect(compiled.library.cards.some((card) => card.id === support.cards[0].id)).toBe(false);
      expect(compiled.library.rules.archives.map((archive) => archive.id)).toEqual(['master.test', support.id]);
      expect(compiled.library.rules.archives[1]).toMatchObject({
        archiveType: 'master_support_definition_archive',
        id: support.id,
      });
      expect(compiled.fixture.seats.every((seat) => seat.masterId !== support.id)).toBe(true);
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
    }
  });

  it.each([
    ['missing discriminator', (archive: Record<string, any>) => { delete archive.archiveType; }, /requires archiveType=master_support_definition_archive/],
    ['wrong owner family', (archive: Record<string, any>) => { archive.id = 'servant.support-owner'; }, /id must start with master\./],
    ['empty archive', (archive: Record<string, any>) => { archive.cards = []; }, /must contain at least one card/],
    ['non-master-skill card', (archive: Record<string, any>) => { archive.cards[0].cardType = 'command_spell'; }, /only master_skill cards/],
    ['missing outside-game placement', (archive: Record<string, any>) => { delete archive.cards[0].initialPlacement; }, /requires initialPlacement=outside_game/],
    ['deck surface', (archive: Record<string, any>) => { archive.deck = []; }, /cannot define a deck/],
    ['playable public information', (archive: Record<string, any>) => { archive.publicInformation = { initialMana: 4 }; }, /cannot define playable master publicInformation/],
  ])('fails closed for malformed master support archive: %s', (_name, mutate, expected) => {
    const workspace = createMinimalWorkspace(false);
    try {
      addMasterSupportArchive(workspace, mutate);
      expect(() => loadPlaytestContentPack(workspace.packPath, { workspaceRoot: workspace.root })).toThrow(expected);
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
    }
  });

  it('rejects support archives registered through the normal master channel', () => {
    const workspace = createMinimalWorkspace(false);
    try {
      addMasterSupportArchive(workspace, undefined, 'master');
      expect(() => loadPlaytestContentPack(workspace.packPath, { workspaceRoot: workspace.root }))
        .toThrow(/must be registered through authoringMasterSupportFiles/);
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
    }
  });

  it('loads mixed master rule archives into rules only without widening the playable roster', () => {
    const workspace = createMinimalWorkspace(false);
    try {
      const ruleArchive = addMasterRuleArchive(workspace);
      const loaded = loadPlaytestContentPack(workspace.packPath, { workspaceRoot: workspace.root });
      const compiled = compileLoadedPlaytestPack(loaded);

      expect(loaded.masters.map((master) => master.id)).toEqual(['master.test']);
      expect(loaded.cards.some((card) => ruleArchive.cards.some((ruleCard: any) => ruleCard.id === card.id))).toBe(false);
      expect(loaded.authoringArchives.map((archive) => archive.id)).toEqual(['master.test', ruleArchive.id]);
      expect(compiled.library.masters.map((master) => master.id)).toEqual(['master.test']);
      expect(compiled.library.cards.some((card) => ruleArchive.cards.some((ruleCard: any) => ruleCard.id === card.id))).toBe(false);
      expect(compiled.library.rules.archives[1]).toMatchObject({
        archiveType: 'master_rule_definition_archive',
        id: ruleArchive.id,
      });
      expect(compiled.fixture.seats.every((seat) => seat.masterId !== ruleArchive.id)).toBe(true);
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
    }
  });

  it.each([
    ['missing discriminator', (archive: Record<string, any>) => { delete archive.archiveType; }, /requires archiveType=master_rule_definition_archive/],
    ['support discriminator', (archive: Record<string, any>) => { archive.archiveType = 'master_support_definition_archive'; }, /requires archiveType=master_rule_definition_archive/],
    ['normal-master discriminator', (archive: Record<string, any>) => { archive.archiveType = 'master_skill_card_archive'; }, /requires archiveType=master_rule_definition_archive/],
    ['near-match discriminator', (archive: Record<string, any>) => { archive.archiveType = 'master_rule_definition_archive_x'; }, /requires archiveType=master_rule_definition_archive/],
    ['wrong owner family', (archive: Record<string, any>) => { archive.id = 'servant.rule-owner'; }, /id must start with master\./],
    ['one-card archive', (archive: Record<string, any>) => { archive.cards = [archive.cards[0]]; }, /at least two cards/],
    ['non-master-skill card', (archive: Record<string, any>) => { archive.cards[0].cardType = 'command_spell'; }, /only master_skill cards/],
    ['missing outside-game card', (archive: Record<string, any>) => { delete archive.cards[1].initialPlacement; }, /requires at least one initialPlacement=outside_game/],
    ['missing ordinary card', (archive: Record<string, any>) => { archive.cards[0].initialPlacement = 'outside_game'; }, /requires at least one ordinary non-deferred master_skill/],
    ['mismatched card owner', (archive: Record<string, any>) => { archive.cards[0].owner.id = 'master.other'; }, /card owner must match archive id/],
    ['unsupported placement', (archive: Record<string, any>) => { archive.cards[0].initialPlacement = 'skill'; }, /unsupported initialPlacement/],
    ['deck surface', (archive: Record<string, any>) => { archive.deck = []; }, /cannot define a deck/],
    ['playable public information', (archive: Record<string, any>) => { archive.publicInformation = { initialMana: 4 }; }, /cannot define playable master publicInformation/],
  ])('fails closed for malformed mixed master rule archive: %s', (_name, mutate, expected) => {
    const workspace = createMinimalWorkspace(false);
    try {
      addMasterRuleArchive(workspace, mutate);
      expect(() => loadPlaytestContentPack(workspace.packPath, { workspaceRoot: workspace.root })).toThrow(expected);
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
    }
  });

  it.each([
    ['missing discriminator', (archive: Record<string, any>) => { delete archive.archiveType; }],
    ['normal-master discriminator', (archive: Record<string, any>) => { archive.archiveType = 'master_skill_card_archive'; }],
    ['near-match discriminator', (archive: Record<string, any>) => { archive.archiveType = 'master_rule_definition_archive_x'; }],
    ['missing discriminator + deck', (archive: Record<string, any>) => { delete archive.archiveType; archive.deck = []; }],
    ['normal-master discriminator + deck', (archive: Record<string, any>) => { archive.archiveType = 'master_skill_card_archive'; archive.deck = []; }],
    ['near-match discriminator + deck', (archive: Record<string, any>) => { archive.archiveType = 'master_rule_definition_archive_x'; archive.deck = []; }],
    ['missing discriminator + publicInformation', (archive: Record<string, any>) => { delete archive.archiveType; archive.publicInformation = { initialMana: 4 }; }],
    ['normal-master discriminator + publicInformation', (archive: Record<string, any>) => { archive.archiveType = 'master_skill_card_archive'; archive.publicInformation = { initialMana: 4 }; }],
    ['near-match discriminator + publicInformation', (archive: Record<string, any>) => { archive.archiveType = 'master_rule_definition_archive_x'; archive.publicInformation = { initialMana: 4 }; }],
  ])('rejects mixed rule-shaped archives that try to fall through the normal master channel: %s', (_name, mutate) => {
    const workspace = createMinimalWorkspace(false);
    try {
      addMasterRuleArchive(workspace, mutate, 'master');
      expect(() => loadPlaytestContentPack(workspace.packPath, { workspaceRoot: workspace.root }))
        .toThrow(/Master rule-shaped archive requires archiveType=master_rule_definition_archive and authoringMasterRuleFiles registration/);
    } finally {
      rmSync(workspace.root, { recursive: true, force: true });
    }
  });

  it('keeps master rule and support channels exact and separate from the normal master channel', () => {
    const normalWorkspace = createMinimalWorkspace(false);
    const supportWorkspace = createMinimalWorkspace(false);
    const supportThroughRuleWorkspace = createMinimalWorkspace(false);
    try {
      addMasterRuleArchive(normalWorkspace, undefined, 'master');
      expect(() => loadPlaytestContentPack(normalWorkspace.packPath, { workspaceRoot: normalWorkspace.root }))
        .toThrow(/must be registered through authoringMasterRuleFiles/);

      addMasterRuleArchive(supportWorkspace, undefined, 'support');
      expect(() => loadPlaytestContentPack(supportWorkspace.packPath, { workspaceRoot: supportWorkspace.root }))
        .toThrow(/requires archiveType=master_support_definition_archive/);

      const support = addMasterSupportArchive(supportThroughRuleWorkspace);
      const manifest = JSON.parse(readFileSync(supportThroughRuleWorkspace.packPath, 'utf8')) as Record<string, any>;
      manifest.authoringMasterRuleFiles = manifest.authoringMasterSupportFiles;
      manifest.authoringMasterSupportFiles = [];
      writeJson(supportThroughRuleWorkspace.packPath, manifest);
      expect(() => loadPlaytestContentPack(supportThroughRuleWorkspace.packPath, { workspaceRoot: supportThroughRuleWorkspace.root }))
        .toThrow(/requires archiveType=master_rule_definition_archive/);
      expect(support.archiveType).toBe('master_support_definition_archive');
    } finally {
      rmSync(normalWorkspace.root, { recursive: true, force: true });
      rmSync(supportWorkspace.root, { recursive: true, force: true });
      rmSync(supportThroughRuleWorkspace.root, { recursive: true, force: true });
    }
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
