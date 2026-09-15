import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type {
  FullRosterAbilityInventory,
  FullRosterStaticSkillEntry,
} from '../phase3-reference/inventory-schema';
import {
  loadSourceEvidenceOverlayCards,
  normalizeFullRosterSemantics,
  normalizeStructuredAbility,
  renderSemanticAxisMatrix,
  type StructuredAuthoringCard,
} from '../phase3-reference/normalize-semantic-axes';

function makeStaticEntry(index: number): FullRosterStaticSkillEntry {
  const suffix = String(index + 1).padStart(3, '0');
  const id = `master.fixture.skill.s${suffix}`;
  return {
    canonicalAbilityId: id,
    canonicalCardId: id,
    ownerId: 'master.fixture',
    ownerType: 'master',
    ownerName: 'Fixture Master',
    skillName: `Fixture ${suffix}`,
    printedText: `Fixture text ${suffix}`,
    clauses: [
      {
        text: `Fixture text ${suffix}`,
        classification: 'DISCOVERED',
        derivation: 'mechanical_line_split',
        source: {
          document: 'src/content/generated/legacy-content.json',
          locator: `fixture[${index}]`,
          sha256: 'a'.repeat(64),
        },
      },
    ],
    sources: [],
    reference: {
      skillId: id,
      ...(index === 1 ? { handlerId: 'core.battle-choice-looking-handler' } : {}),
      executionRoute: index === 1 ? 'specific_handler' : 'deterministic',
      hasAuthoringCard: index === 0,
      hasConfirmedOverride: true,
      dynamic: false,
    },
    classification: 'DISCOVERED',
    blockedBy: [],
  };
}

function makeInventory(): FullRosterAbilityInventory {
  const staticSkills = Array.from({ length: 943 }, (_, index) => makeStaticEntry(index));
  return {
    schemaVersion: 1,
    kind: 'phase3-full-roster-ability-inventory',
    provenance: {
      repository: 'https://github.com/example/reference.git',
      commit: '1'.repeat(40),
      inputDigests: {
        'src/content/authoring/cards.json': 'b'.repeat(64),
      },
    },
    summary: {
      staticSkillCount: 943,
      dynamicSkillCount: 1,
      totalIdentityCount: 944,
      authoringSkillCount: 1,
      confirmedOverrideSkillCount: 943,
    },
    staticSkills,
    dynamicSkills: [
      {
        canonicalAbilityId: 'master.fixture.card.dynamic',
        canonicalCardId: 'master.fixture.card.dynamic',
        ownerId: 'master.fixture',
        ownerType: 'master',
        ownerName: 'Fixture Master',
        skillName: null,
        printedText: null,
        clauses: [],
        sources: [],
        reference: {
          skillId: 'master.fixture.card.dynamic',
          executionRoute: null,
          hasAuthoringCard: false,
          hasConfirmedOverride: false,
          dynamic: true,
        },
        classification: 'DISCOVERED',
        blockedBy: ['SOURCE_EVIDENCE_REQUIRED'],
      },
    ],
  };
}

const structuredCard: StructuredAuthoringCard = {
  id: 'master.fixture.skill.s001',
  printedText: 'Fixture text 001',
  abilities: [
    {
      id: 'fixture-structured',
      printedClause: '行动阶段：结算战斗后，选择一名玩家并支付1点魔力。',
      kind: 'phase_action',
      activation: { phase: 'action' },
      conditions: [
        { type: 'event_type_is', eventType: 'combat.resolved' },
        { type: 'source_active' },
      ],
      effects: [
        {
          type: 'choose_players',
          minCount: 1,
          maxCount: 1,
          payloadKey: 'selectedPlayerIds',
        },
        { type: 'pay_mana', amount: 1 },
        { type: 'gain_victory_points', amount: 1 },
      ],
      lifecycle: { duration: 'this_round' },
      ruleModifiers: [
        { id: 'fixture-rule', operation: 'ignore', rule: 'defeat' },
      ],
      visibility: {
        revealsTrueName: true,
        revealTiming: 'on_use_declared',
        revealScope: 'servant_package',
      },
      execution: { mode: 'automatic' },
    },
    {
      id: 'printed-choice-only',
      printedClause: '选择一个选项，但结构化字段没有玩家交互。',
      kind: 'passive',
      conditions: [{ type: 'source_active' }],
      effects: [{ type: 'gain_mana', amount: 1 }],
      execution: { mode: 'automatic' },
    },
  ],
};

describe('Phase 3 full-roster semantic normalization', () => {
  it('keeps timing, domain trigger, condition, cost, target, interaction, lifecycle, modifier, visibility, binding, and battle semantics orthogonal', () => {
    const semantic = normalizeStructuredAbility(structuredCard.abilities[0]);

    expect(semantic.timing).toEqual(['ACTION']);
    expect(semantic.trigger).toEqual(['combat.resolved']);
    expect(semantic.condition).toContain('SOURCE_ACTIVE');
    expect(semantic.condition).not.toContain('EVENT_TYPE_IS');
    expect(semantic.cost).toContain('MANA');
    expect(semantic.target).toContain('CHOOSE_ONE_PLAYER');
    expect(semantic.interaction).toContain('CHOOSE_ONE_PLAYER');
    expect(semantic.effect).toContain('GAIN_VICTORY_POINTS');
    expect(semantic.lifecycle).toContain('duration:this_round');
    expect(semantic.modifier).toContain('rule:defeat:ignore');
    expect(semantic.visibility).toContain('REVEALS_TRUE_NAME');
    expect(semantic.binding).toContain('payload:selectedPlayerIds');
    expect(semantic.battle).toContain('COMBAT_EVENT');
  });

  it('does not infer Interaction merely from printed timing or choice words', () => {
    const semantic = normalizeStructuredAbility(structuredCard.abilities[1]);

    expect(semantic.interaction).toEqual([]);
    expect(semantic.target).toEqual([]);
  });

  it('surfaces structural conditions nested inside effects without an identity branch', () => {
    const semantic = normalizeStructuredAbility({
      id: 'nested-condition-fixture',
      printedClause: 'fixture',
      kind: 'passive',
      effects: [{
        type: 'combat_power_bonus',
        amount: 5,
        conditions: [
          { type: 'player_face_up_attacks_played_this_round_equals', value: 1 },
          { type: 'player_used_declaration_reveal_this_round' },
        ],
      }],
    });

    expect(semantic.condition).toEqual(
      expect.arrayContaining([
        'PLAYER_FACE_UP_ATTACKS_PLAYED_THIS_ROUND_EQUALS',
        'PLAYER_USED_DECLARATION_REVEAL_THIS_ROUND',
      ]),
    );
    expect(semantic.battle).toContain('COMBAT_EFFECT');
  });

  it('surfaces structural inspect-zone visibility without an identity branch', () => {
    const semantic = normalizeStructuredAbility({
      id: 'inspect-zone-fixture',
      printedClause: 'fixture',
      kind: 'passive',
      visibility: { inspectZones: ['opponent_discard'] },
    });

    expect(semantic.visibility).toContain('inspectZone:opponent_discard');
  });

  it('classifies source-aligned structured authoring and explicitly blocks every identity without semantic source', () => {
    const normalized = normalizeFullRosterSemantics(makeInventory(), [structuredCard]);
    const grounded = normalized.staticSkills[0].semanticNormalization;
    const handlerOnly = normalized.staticSkills[1].semanticNormalization;
    const dynamic = normalized.dynamicSkills[0].semanticNormalization;

    expect(grounded.status).toBe('SOURCE_GROUNDED');
    expect(grounded.abilities).toHaveLength(2);
    expect(handlerOnly.status).toBe('BLOCKED');
    expect(handlerOnly.blocks).toContain('SEMANTIC_SOURCE_REQUIRED');
    expect(handlerOnly.observedBehavior.handlerId).toBe('core.battle-choice-looking-handler');
    expect(handlerOnly.axes.battle).toEqual([]);
    expect(dynamic.status).toBe('BLOCKED');
    expect(dynamic.blocks).toContain('SOURCE_EVIDENCE_REQUIRED');
    expect(normalized.semanticSummary.unclassifiedCount).toBe(0);
    expect(normalized.semanticSummary.sourceGroundedCount).toBe(1);
    expect(normalized.semanticSummary.blockedCount).toBe(943);
  });

  it('turns printed-text conflicts into explicit source blocks instead of guessing semantics', () => {
    const inventory = makeInventory();
    const conflicting = { ...structuredCard, printedText: 'Different source text' };
    const normalized = normalizeFullRosterSemantics(inventory, [conflicting]);

    expect(normalized.staticSkills[0].semanticNormalization.status).toBe('BLOCKED');
    expect(normalized.staticSkills[0].semanticNormalization.blocks).toContain('SEMANTIC_SOURCE_CONFLICT');
  });

  it('renders Markdown counts from the same normalized JSON summary', () => {
    const normalized = normalizeFullRosterSemantics(makeInventory(), [structuredCard]);
    const markdown = renderSemanticAxisMatrix(normalized);

    expect(markdown).toContain('totalIdentityCount=944');
    expect(markdown).toContain('sourceGroundedCount=1');
    expect(markdown).toContain('blockedCount=943');
    expect(markdown).toContain('unclassifiedCount=0');
  });

  it('accepts the allowed Fate/Domination Wiki overlay plus the locked development-text Chaos Scrambled Seals card', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const chaos = overlays.filter((card) => card.id.startsWith('master.chaos.skill.'));
    const ids = chaos.map((card) => card.id);
    expect(chaos).toHaveLength(18);
    expect(ids).toContain('master.chaos.skill.s1');
    expect(ids).toContain('master.chaos.skill.s16');
    expect(ids).toContain('master.chaos.skill.ascension');
    expect(ids).toContain('master.chaos.skill.s17');
    expect(
      chaos.every((card) => card.source?.authority === 'FATE_DOMINATION_WIKI' ? card.source.url.startsWith('https://fatedomination.fandom.com/wiki/') : card.source?.authority === 'DEVELOPMENT_TEXT'),
    ).toBe(true);

    const breaker = chaos.find((card) => card.id === 'master.chaos.skill.s12');
    const chooseX = breaker?.abilities[0].effects?.find(
      (effect: any) => effect?.type === 'choose_number',
    ) as any;
    expect(chooseX).toMatchObject({ min: 1, max: 3, payloadKey: 'x' });

    const the666 = chaos.find((card) => card.id === 'master.chaos.skill.s1');
    const manaGain = the666?.abilities.find((ability) => ability.id === 'chaos.the-666.mana-gain-draw');
    expect(manaGain?.conditions).toContainEqual({ type: 'event_type_is', eventType: 'player.mana.changed' });
    expect(manaGain?.effects).toContainEqual(
      expect.objectContaining({ type: 'draw_cards', countFormula: 'floor(event.delta / 2)', aggregation: 'per_gain_event' }),
    );
  });

  it('grounds the ten-ID Bazett day-cycle slice without inventing Day 2 cost removal', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const bazett = overlays.filter((card) => card.id.startsWith('master.bazett.skill.'));
    expect(bazett).toHaveLength(10);
    expect(bazett.map((card) => card.id).sort()).toEqual([
      'master.bazett.skill.ascension',
      'master.bazett.skill.s1',
      'master.bazett.skill.s1a',
      'master.bazett.skill.s1b',
      'master.bazett.skill.s1c',
      'master.bazett.skill.s1d',
      'master.bazett.skill.s2',
      'master.bazett.skill.s3',
      'master.bazett.skill.s4',
      'master.bazett.skill.s5',
    ]);
    expect(
      bazett.every((card) => card.source?.url === 'https://fatedomination.fandom.com/wiki/Bazett_Fraga_McRemitz'),
    ).toBe(true);

    const day2 = bazett.find((card) => card.id === 'master.bazett.skill.s1c');
    const day2Modifiers = day2?.abilities[0].ruleModifiers ?? [];
    expect(day2Modifiers).toContainEqual(
      expect.objectContaining({ rule: 'card_play_mana_requirement', operation: 'ignore', threshold: 8 }),
    );
    expect(day2Modifiers).toContainEqual(
      expect.objectContaining({ rule: 'card_play_limit', operation: 'ignore_once_per_game' }),
    );
    expect(day2Modifiers).not.toContainEqual(expect.objectContaining({ rule: 'card_play_cost' }));

    const awake = bazett.find((card) => card.id === 'master.bazett.skill.s4');
    expect(awake?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'adjust_command_seals', operation: 'restore_all', scope: 'controller' }),
    );

    const lostInTime = bazett.find((card) => card.id === 'master.bazett.skill.s1a');
    expect(lostInTime?.abilities[0].effects).toContainEqual(
      expect.objectContaining({
        type: 'cycle_state_transition',
        operation: 'initialize',
        activeDefinitionId: 'master.bazett.skill.s1b',
      }),
    );

    const day4 = bazett.find((card) => card.id === 'master.bazett.skill.s1d');
    expect(day4?.abilities[0].effects).toContainEqual(
      expect.objectContaining({
        type: 'cycle_state_transition',
        operation: 'awaken',
        resolveDefinitionId: 'master.bazett.skill.s4',
      }),
    );

    const day3 = bazett.find((card) => card.id === 'master.bazett.skill.s5');
    expect(day3?.abilities[0].effects).toContainEqual(
      expect.objectContaining({
        type: 'cycle_state_transition',
        operation: 'enter_stage',
        destination: 'skill',
      }),
    );

    const fragarach = bazett.find((card) => card.id === 'master.bazett.skill.s2');
    expect(fragarach?.abilities[0].conditions).toContainEqual(
      expect.objectContaining({ type: 'event_type_is', eventType: 'card_or_ability.used' }),
    );

    const ascension = bazett.find((card) => card.id === 'master.bazett.skill.ascension');
    expect(ascension?.abilities).toHaveLength(1);
  });

  it('accepts only locked development-text snapshots from the allowlisted source files', () => {
    const root = mkdtempSync(join(tmpdir(), 'fd-phase3-dev-evidence-'));
    const overlayPath = join(root, 'overlay.json');
    const sourceText = '行动阶段：执行来源文本中的规则。';
    const card = {
      id: 'master.fixture.skill.s1',
      printedText: sourceText,
      source: {
        authority: 'DEVELOPMENT_TEXT',
        document: 'Fate_Domination-开发版/data_masters.js',
        locator: 'm_fixture.skills[s1]#line=1',
        sourceFileSha256: 'a'.repeat(64),
        sourceText,
        sourceTextSha256: createHash('sha256').update(sourceText, 'utf8').digest('hex'),
      },
      abilities: [{
        id: 'fixture.development-source',
        printedClause: sourceText,
        kind: 'phase_action',
        activation: { phase: 'action' },
        effects: [{ type: 'gain_mana', amount: 1 }],
      }],
      referencePrintedTextSha256: createHash('sha256').update(sourceText, 'utf8').digest('hex'),
    };

    try {
      writeFileSync(overlayPath, JSON.stringify({
        schemaVersion: 1,
        kind: 'phase3-full-roster-source-evidence-overlays',
        cards: [card],
      }), 'utf8');
      expect(loadSourceEvidenceOverlayCards(root, 'overlay.json')).toHaveLength(1);

      const badHash = structuredClone(card);
      badHash.source.sourceTextSha256 = '0'.repeat(64);
      writeFileSync(overlayPath, JSON.stringify({
        schemaVersion: 1,
        kind: 'phase3-full-roster-source-evidence-overlays',
        cards: [badHash],
      }), 'utf8');
      expect(() => loadSourceEvidenceOverlayCards(root, 'overlay.json')).toThrow(/locked development-text snapshot/);

      const badDocument = structuredClone(card) as any;
      badDocument.source.document = 'Fate_Domination-开发版/SkillLib.js';
      writeFileSync(overlayPath, JSON.stringify({
        schemaVersion: 1,
        kind: 'phase3-full-roster-source-evidence-overlays',
        cards: [badDocument],
      }), 'utf8');
      expect(() => loadSourceEvidenceOverlayCards(root, 'overlay.json')).toThrow(/locked development-text snapshot/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('grounds the eleven-ID Wodime slice from the locked development-text snapshot', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const wodime = overlays.filter((card) => card.id.startsWith('master.wodime.skill.'));
    expect(wodime).toHaveLength(11);
    expect(wodime.map((card) => card.id).sort()).toEqual([
      'master.wodime.skill.ascension',
      'master.wodime.skill.s1',
      'master.wodime.skill.s1a',
      'master.wodime.skill.s2',
      'master.wodime.skill.s3',
      'master.wodime.skill.s4',
      'master.wodime.skill.s5',
      'master.wodime.skill.s6',
      'master.wodime.skill.s7',
      'master.wodime.skill.s8',
      'master.wodime.skill.s9',
    ]);
    expect(
      wodime.every((card) =>
        card.source?.authority === 'DEVELOPMENT_TEXT' &&
        card.source.document === 'Fate_Domination-开发版/data_masters.js' &&
        card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
        createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256
      ),
    ).toBe(true);

    const leader = wodime.find((card) => card.id === 'master.wodime.skill.s1');
    expect(leader?.abilities).toContainEqual(
      expect.objectContaining({ id: 'wodime.cryptic-leader.atlantis-start' }),
    );
    const sphere = wodime.find((card) => card.id === 'master.wodime.skill.s2');
    expect(sphere?.abilities[0].kind).toBe('passive');
    expect(sphere?.abilities[0].ruleModifiers).toContainEqual(
      expect.objectContaining({ rule: 'card_play_mana_requirement', threshold: 8 }),
    );
    expect(sphere?.abilities[0].ruleModifiers).toContainEqual(
      expect.objectContaining({ rule: 'combat_power_resolution', operation: 'ignore_other_controller_attacks' }),
    );
    expect(sphere?.abilities[0].ruleModifiers).toContainEqual(
      expect.objectContaining({ rule: 'card_entry_method', operation: 'restrict_to_this_ability' }),
    );
    const legacy = wodime.find((card) => card.id === 'master.wodime.skill.s3');
    expect(legacy?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'location_token_rule', survivesOwnerElimination: true }),
    );
    const grandOrder = wodime.find((card) => card.id === 'master.wodime.skill.ascension');
    expect(grandOrder?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'secret_round_binding', operation: 'record_additional_secret_round', optional: true }),
    );

    const olympus = wodime.find((card) => card.id === 'master.wodime.skill.s5');
    expect(olympus?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'lostbelt_expansion', drawCount: 2, revealDrawnEvents: true }),
    );

    const zeus = wodime.find((card) => card.id === 'master.wodime.skill.s7');
    expect(zeus?.abilities).toHaveLength(3);
    expect(zeus?.abilities[1].ruleModifiers).toContainEqual(
      expect.objectContaining({ rule: 'defeat_immunity', operation: 'disable' }),
    );
    expect(zeus?.abilities[2].conditions).toContainEqual(
      expect.objectContaining({ type: 'event_type_is', eventType: 'combat.power-calculated' }),
    );
    expect(zeus?.abilities[2].effects).toContainEqual(
      expect.objectContaining({ type: 'defeat_player' }),
    );

    for (const id of ['master.wodime.skill.s8', 'master.wodime.skill.s9']) {
      const eventCard = wodime.find((card) => card.id === id);
      expect(eventCard?.abilities[1].conditions).toContainEqual(
        expect.objectContaining({ type: 'event_type_is', eventType: 'combat.power-calculated' }),
      );
      expect(eventCard?.abilities[1].effects).toContainEqual(
        expect.objectContaining({ type: 'defeat_player' }),
      );
    }
  });

  it('grounds the ten-ID Ophelia Nordic Lostbelt slice without hiding battle and power rules', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ophelia = overlays.filter((card) => card.id.startsWith('master.ophelia.skill.'));
    expect(ophelia).toHaveLength(10);
    expect(ophelia.map((card) => card.id).sort()).toEqual([
      'master.ophelia.skill.ascension',
      'master.ophelia.skill.s1',
      'master.ophelia.skill.s1a',
      'master.ophelia.skill.s1b',
      'master.ophelia.skill.s2',
      'master.ophelia.skill.s3',
      'master.ophelia.skill.s4',
      'master.ophelia.skill.s5',
      'master.ophelia.skill.s6',
      'master.ophelia.skill.s7',
    ]);
    expect(
      ophelia.every((card) =>
        card.source?.authority === 'DEVELOPMENT_TEXT' &&
        card.source.document === 'Fate_Domination-开发版/data_masters.js' &&
        card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
        createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256
      ),
    ).toBe(true);

    const mysticEye = ophelia.find((card) => card.id === 'master.ophelia.skill.s2');
    expect(mysticEye?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'pay_mana', amount: 2 }),
    );
    expect(mysticEye?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'combat_power_lock', operation: 'prohibit_increase_from_other_cards' }),
    );
    expect(mysticEye?.abilities[0].limit).toMatchObject({ period: 'game', maxUses: 2 });

    const lostbelt = ophelia.find((card) => card.id === 'master.ophelia.skill.s3');
    expect(lostbelt?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'lostbelt_expansion', drawCount: 2, revealDrawnEvents: true }),
    );

    const peaceDay = ophelia.find((card) => card.id === 'master.ophelia.skill.s4');
    expect(peaceDay?.abilities[1].conditions).toContainEqual(
      expect.objectContaining({ type: 'event_type_is', eventType: 'combat.ending' }),
    );
    expect(peaceDay?.abilities[1].effects).toContainEqual(
      expect.objectContaining({ type: 'event_card_rule', excludeFromExpansion: true }),
    );

    for (const id of ['master.ophelia.skill.s5', 'master.ophelia.skill.s6', 'master.ophelia.skill.s7']) {
      const eventCard = ophelia.find((card) => card.id === id);
      expect(eventCard?.abilities[1].effects).toHaveLength(2);
      expect(eventCard?.abilities[1].effects).toEqual(
        expect.arrayContaining([expect.objectContaining({ type: 'combat_power_bonus', scope: 'attacks_at_source_event_battlefield' })]),
      );
    }

    const ragnarok = ophelia.find((card) => card.id === 'master.ophelia.skill.ascension');
    expect(ragnarok?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'move_source_card', destination: 'skill' }),
    );
    expect(ragnarok?.abilities[1].effects).toContainEqual(
      expect.objectContaining({ type: 'event_card_rule', resultVar: 'removedEventCount', excludeFromExpansion: true }),
    );
    expect(ragnarok?.abilities[1].effects).toContainEqual(
      expect.objectContaining({ type: 'source_card_power_bonus', bindingField: 'removedEventCount', permanence: 'permanent' }),
    );
  });

  it('grounds the nine-ID Fiore transcend slice from the locked development-text snapshot', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const fiore = overlays.filter((card) => card.id.startsWith('master.fiore.skill.'));
    expect(fiore).toHaveLength(9);
    expect(fiore.map((card) => card.id).sort()).toEqual([
      'master.fiore.skill.ascension',
      'master.fiore.skill.s1',
      'master.fiore.skill.s1a',
      'master.fiore.skill.s2',
      'master.fiore.skill.s3',
      'master.fiore.skill.s4',
      'master.fiore.skill.s5',
      'master.fiore.skill.s6',
      'master.fiore.skill.s7',
    ]);
    expect(
      fiore.every((card) =>
        card.source?.authority === 'DEVELOPMENT_TEXT' &&
        card.source.document === 'Fate_Domination-开发版/data_masters.js' &&
        card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
        createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256
      ),
    ).toBe(true);

    const owner = fiore.find((card) => card.id === 'master.fiore.skill.s1');
    expect(owner?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'cycle_state_transition', operation: 'initialize_pairs' }),
    );

    const transcend = fiore.find((card) => card.id === 'master.fiore.skill.s1a');
    expect(transcend?.abilities).toHaveLength(3);
    expect(transcend?.abilities[2].conditions).toContainEqual(
      expect.objectContaining({ type: 'event_type_is', eventType: 'combat.ending' }),
    );
    expect(transcend?.abilities[2].effects).toContainEqual(
      expect.objectContaining({ type: 'lose_mana', amount: 4 }),
    );

    const paralysis = fiore.find((card) => card.id === 'master.fiore.skill.s2');
    expect(paralysis?.abilities[0].ruleModifiers).toContainEqual(
      expect.objectContaining({ rule: 'movement_permission', operation: 'prohibit' }),
    );

    const circuits = fiore.find((card) => card.id === 'master.fiore.skill.s3');
    expect(circuits?.abilities[0].ruleModifiers).toContainEqual(
      expect.objectContaining({ rule: 'round_mana_gain_cap', normalRoundCap: 2, climaxRoundCap: 4 }),
    );

    const docility = fiore.find((card) => card.id === 'master.fiore.skill.s4');
    expect(docility?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'combat_power_bonus', amount: -2 }),
    );
    expect(docility?.abilities[1].ruleModifiers).toContainEqual(
      expect.objectContaining({ rule: 'controller_master_skill_power', operation: 'set_and_lock', value: 0 }),
    );

    const neuromechanics = fiore.find((card) => card.id === 'master.fiore.skill.s5');
    expect(neuromechanics?.abilities[0].conditions).toContainEqual(
      expect.objectContaining({ type: 'event_type_is', eventType: 'cycle_state.entered' }),
    );
    expect(neuromechanics?.abilities[3].effects).toContainEqual(
      expect.objectContaining({ type: 'terrain_position_adjustment', operation: 'gain', amount: 2 }),
    );

    const determination = fiore.find((card) => card.id === 'master.fiore.skill.s6');
    expect(determination?.abilities[0].kind).toBe('triggered');
    expect(determination?.abilities[0].conditions).toContainEqual(
      expect.objectContaining({ type: 'event_type_is', eventType: 'cycle_state.entered' }),
    );
    expect(determination?.abilities[0].conditions).toContainEqual(
      expect.objectContaining({ type: 'event_definition_is', definitionId: 'master.fiore.skill.s6' }),
    );
    expect(determination?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'choose_players', minCount: 1, maxCount: 1, payloadKey: 'targetPlayerId' }),
    );
    expect(determination?.abilities[1].conditions).toContainEqual(
      expect.objectContaining({ type: 'event_type_is', eventType: 'combat.resolved' }),
    );
    expect(determination?.abilities[1].effects).toContainEqual(
      expect.objectContaining({ type: 'gain_victory_points', amount: 2 }),
    );

    const cleverMind = fiore.find((card) => card.id === 'master.fiore.skill.s7');
    expect(cleverMind?.abilities[2].ruleModifiers).toContainEqual(
      expect.objectContaining({ rule: 'combat_skill_card_power', operation: 'increase', amount: 1 }),
    );

    const ascension = fiore.find((card) => card.id === 'master.fiore.skill.ascension');
    expect(ascension?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'cycle_state_transition' }),
    );
    expect(ascension?.abilities[1].effects).toContainEqual(
      expect.objectContaining({ type: 'lose_victory_points', amount: 2 }),
    );
  });

  it('grounds the thirteen-ID Kadoc and Hinako Crypter slice without inventing China event counts or hiding card limits', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const crypters = overlays.filter((card) =>
      card.id.startsWith('master.kadoc.skill.') || card.id.startsWith('master.hinako.skill.'),
    );
    expect(crypters).toHaveLength(13);
    expect(
      crypters.every((card) =>
        card.source?.authority === 'DEVELOPMENT_TEXT' &&
        card.source.document === 'Fate_Domination-开发版/data_masters.js' &&
        card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
        createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256
      ),
    ).toBe(true);

    const frozenSoil = crypters.find((card) => card.id === 'master.kadoc.skill.s3');
    expect(frozenSoil?.abilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'kadoc.frozen-soil.deploy-mana-loss' }),
        expect.objectContaining({ id: 'kadoc.frozen-soil.enter-mana-loss' }),
      ]),
    );

    const bloodCurse = crypters.find((card) => card.id === 'master.hinako.skill.s2');
    expect(bloodCurse?.abilities[0]).toMatchObject({
      id: 'hinako.blood-curse.once-per-game',
      activation: { trigger: 'when_play_requirements_checked' },
      limit: { type: 'per_game', uses: 1, scope: 'this_card' },
    });
    expect(bloodCurse?.abilities[2].ruleModifiers).toContainEqual(
      expect.objectContaining({ rule: 'combat_card_power', operation: 'add', amount: -2 }),
    );

    const qin = crypters.find((card) => card.id === 'master.hinako.skill.s3');
    const offBoardVp = qin?.abilities.find((ability) => ability.id === 'hinako.qin.off-board-vp');
    expect(offBoardVp).toBeDefined();
    expect(offBoardVp).not.toHaveProperty('limit');

    const rapidExpansion = crypters.find((card) => card.id === 'master.kadoc.skill.ascension');
    const rapidExpansionAction = rapidExpansion?.abilities.find(
      (ability) => ability.id === 'kadoc.rapid-expansion.action',
    );
    expect(rapidExpansionAction?.effects).toContainEqual(
      expect.objectContaining({
        type: 'choose_events',
        minCount: 1,
        maxCount: 1,
        requiredWhenEligible: true,
        fallbackWhenNoEligible: true,
      }),
    );

    const china = crypters.find((card) => card.id === 'master.hinako.skill.s4');
    const chinaMetadata = china?.abilities.flatMap((ability) => ability.effects ?? []).filter(
      (effect) => effect.type === 'event_card_rule' && effect.operation === 'define_event_card',
    ) ?? [];
    expect(chinaMetadata.length).toBeGreaterThan(0);
    expect(chinaMetadata.every((effect) => !('copyCount' in effect))).toBe(true);
    expect(china?.abilities).toContainEqual(
      expect.objectContaining({
        id: 'hinako.china.storm-capital.cleanup',
        conditions: expect.arrayContaining([
          expect.objectContaining({ type: 'event_type_is', eventType: 'combat.ending' }),
        ]),
      }),
    );

    const generatedInventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as FullRosterAbilityInventory;
    const chinaEntry = generatedInventory.staticSkills.find(
      (entry) => entry.canonicalAbilityId === 'master.hinako.skill.s4',
    );
    expect(chinaEntry?.semanticNormalization.axes.condition).toEqual(
      expect.arrayContaining([
        'PLAYER_FACE_UP_ATTACKS_PLAYED_THIS_ROUND_EQUALS',
        'PLAYER_USED_DECLARATION_REVEAL_THIS_ROUND',
        'PLAYER_ALL_ATTACKS_PRINTED_POWER_EVEN',
      ]),
    );

    const trueAncestor = crypters.find((card) => card.id === 'master.hinako.skill.ascension');
    expect(trueAncestor?.abilities[0].effects).toContainEqual(
      expect.objectContaining({ type: 'servant_ownership_rule', operation: 'remove_controller_servant_ownership' }),
    );
    expect(trueAncestor?.abilities[1].transforms).toHaveLength(1);
  });

  it('grounds the ten-ID Goredolf and Peperoncino slice with explicit timing, visibility, movement, and Lostbelt semantics', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const slice = overlays.filter((card) =>
      card.id.startsWith('master.goredolf.skill.') || card.id.startsWith('master.peperoncino.skill.'),
    );
    expect(slice).toHaveLength(10);
    expect(
      slice.every((card) =>
        card.source?.authority === 'DEVELOPMENT_TEXT' &&
        card.source.document === 'Fate_Domination-开发版/data_masters.js' &&
        card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
        createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256
      ),
    ).toBe(true);

    const ironGentleman = slice.find((card) => card.id === 'master.goredolf.skill.s1');
    expect(ironGentleman?.abilities[0].transforms).toContainEqual(
      expect.objectContaining({ intoDefinitionId: 'card.card-gof-fist' }),
    );

    const foolsResolve = slice.find((card) => card.id === 'master.goredolf.skill.s1a');
    expect(foolsResolve?.abilities[0].ruleModifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'deployment_requirement', operation: 'require_battlefield' }),
        expect.objectContaining({ rule: 'movement_permission', operation: 'prohibit' }),
      ]),
    );
    expect(foolsResolve?.abilities[2].ruleModifiers).toContainEqual(
      expect.objectContaining({ rule: 'card_play_permission', definitionId: 'card.card-gof-fist', phase: 'combat' }),
    );
    expect(foolsResolve?.abilities[1].limit).toMatchObject({
      scope: 'controller',
      period: 'round',
      maxUses: 1,
    });

    const mentalTheory = slice.find((card) => card.id === 'master.peperoncino.skill.s1a');
    expect(mentalTheory?.abilities[0].visibility).toMatchObject({ inspectZones: ['opponent_discard'] });

    const bodyTheory = slice.find((card) => card.id === 'master.peperoncino.skill.s1b');
    expect(bodyTheory?.abilities[0].effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'pay_mana', amount: 2 }),
        expect.objectContaining({ type: 'combat_power_bonus', amount: 3 }),
        expect.objectContaining({ type: 'move_player', maxSteps: 1, requiredIfPossible: true }),
      ]),
    );

    const yuga = slice.find((card) => card.id === 'master.peperoncino.skill.s3');
    const setEra = yuga?.abilities.find((ability) => ability.id === 'peperoncino.yuga.set-era');
    expect(setEra?.activation).toMatchObject({
      phase: 'preparation',
    });
    expect(setEra?.conditions ?? []).not.toContainEqual(
      expect.objectContaining({ type: 'event_type_is', eventType: 'round.started' }),
    );
    expect(yuga?.abilities.find((ability) => ability.id === 'peperoncino.yuga.divine-judgment-expand')?.limit).toMatchObject({
      period: 'round',
      maxUses: 1,
    });
    expect(yuga?.abilities.find((ability) => ability.id === 'peperoncino.yuga.judgment-place-event')?.effects).toContainEqual(
      expect.objectContaining({ type: 'choose_events', minCount: 1, maxCount: 1 }),
    );

    const indiaObjectives = slice.find((card) => card.id === 'master.peperoncino.skill.s4');
    const matchingBonus = indiaObjectives?.abilities[0].effects?.find((effect) => effect.type === 'combat_power_bonus');
    expect(matchingBonus?.conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'attack_played_from_hand_this_round' }),
        expect.objectContaining({ type: 'attack_attribute_matches_source_event' }),
        expect.objectContaining({ type: 'attack_not_played_by_effect' }),
      ]),
    );
    expect(matchingBonus?.lifecycle).toMatchObject({ duration: 'this_round' });
    expect(indiaObjectives?.abilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'peperoncino.india.objective-basic-three.non-expansion-entry' }),
        expect.objectContaining({ id: 'peperoncino.india.divine-sky-boulder.expansion-entry' }),
        expect.objectContaining({ id: 'peperoncino.india.divine-sky-boulder.before-yuga-change' }),
        expect.objectContaining({ id: 'peperoncino.india.withering-plain.other-battle-win' }),
        expect.objectContaining({ id: 'peperoncino.india.withering-plain.recon-round-end' }),
        expect.objectContaining({ id: 'peperoncino.india.ocean-of-milk.defeat' }),
      ]),
    );
  });

  it('grounds the two-ID Artoira charge slice without importing handler-only target state', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const slice = overlays.filter((card) => card.id.startsWith('master.artoira.skill.'));
    expect(slice).toHaveLength(2);
    expect(
      slice.every((card) =>
        card.source?.authority === 'DEVELOPMENT_TEXT' &&
        card.source.document === 'Fate_Domination-开发版/data_masters.js' &&
        card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
        createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256
      ),
    ).toBe(true);

    const whiteSteel = slice.find((card) => card.id === 'master.artoira.skill.s1');
    const charge = whiteSteel?.abilities.find((ability) => ability.id === 'artoira.white-steel.charge');
    expect(charge?.activation).toMatchObject({ phase: 'outpost' });
    expect(charge?.effects).toContainEqual(
      expect.objectContaining({
        type: 'choose_cards',
        zone: 'servant_skills',
        face: 'up',
        owner: 'controller_servant',
        minCount: 1,
        maxCount: 1,
        payloadKey: 'selectedSkillAttackIds',
      }),
    );
    expect(charge?.effects.find((effect) => effect.type === 'choose_cards')).not.toHaveProperty('active');
    expect(charge?.effects).toContainEqual(
      expect.objectContaining({
        type: 'charge_selected_skill_attack',
        destination: 'deck',
        deckPositionFormula: 'selected_card_printed_mana_cost + 1',
        requireDeckCapacity: true,
      }),
    );
    expect(whiteSteel?.abilities).toContainEqual(
      expect.objectContaining({
        id: 'artoira.white-steel.leave-deck-add-to-attack',
        conditions: expect.arrayContaining([
          expect.objectContaining({ type: 'event_type_is', eventType: 'card.left-deck' }),
          expect.objectContaining({ type: 'event_card_has_linkage', linkage: 'charged_by_controller' }),
        ]),
        effects: expect.arrayContaining([
          expect.objectContaining({ type: 'move_card', destination: 'attack', costOverride: 0 }),
        ]),
      }),
    );

    const woodenSword = slice.find((card) => card.id === 'master.artoira.skill.ascension');
    expect(woodenSword?.abilities).toContainEqual(
      expect.objectContaining({
        id: 'artoira.wooden-sword.ascension-setup',
        effects: [expect.objectContaining({ type: 'move_source_card', destination: 'skill' })],
      }),
    );
    expect(woodenSword?.abilities).toContainEqual(
      expect.objectContaining({
        id: 'artoira.wooden-sword.charge-eligibility',
        ruleModifiers: [expect.objectContaining({ rule: 'charge_eligibility', operation: 'allow_source_card' })],
      }),
    );
    expect(woodenSword?.abilities).toContainEqual(
      expect.objectContaining({
        id: 'artoira.wooden-sword.instant-victory',
        activation: { phase: 'combat' },
        conditions: expect.arrayContaining([
          expect.objectContaining({ type: 'event_type_is', eventType: 'combat.resolved' }),
          expect.objectContaining({ type: 'event_player_won_combat' }),
          expect.objectContaining({ type: 'source_card_entered_attack_from_deck_this_round' }),
        ]),
        effects: [expect.objectContaining({ type: 'finish_game', winner: 'controller', timing: 'immediate' })],
      }),
    );
  });

  it('grounds the eight-ID Arcueid/Darnic/Amakusa/Fou batch with exact development text and explicit special boundaries', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.arcueid.skill.s2',
      'master.arcueid.skill.ascension',
      'master.darnic.skill.s1',
      'master.darnic.skill.ascension',
      'master.amakusa.skill.s3',
      'master.amakusa.skill.ascension',
      'master.fou.skill.s1',
      'master.fou.skill.ascension',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(8);
    expect(
      slice.every((card) =>
        card.source?.authority === 'DEVELOPMENT_TEXT' &&
        card.source.document === 'Fate_Domination-开发版/data_masters.js' &&
        card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
        createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256 &&
        card.source.sourceTextSha256 === card.referencePrintedTextSha256
      ),
    ).toBe(true);

    const materialization = slice.find((card) => card.id === 'master.arcueid.skill.s2');
    expect(materialization?.abilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'arcueid.materialization.prepare', activation: { phase: 'action' } }),
        expect.objectContaining({
          id: 'arcueid.materialization.replace-basic-attack',
          activation: { phase: 'combat' },
          effects: expect.arrayContaining([
            expect.objectContaining({ type: 'choose_cards', zone: 'current_combat_attack', basic: true }),
            expect.objectContaining({ type: 'close_selected_cards' }),
            expect.objectContaining({ type: 'draw_cards', until: { cardType: 'basic_attack' } }),
            expect.objectContaining({ type: 'move_selected_cards', destination: 'attack' }),
            expect.objectContaining({ type: 'repeat_replacement_window', maxAdditionalUses: 1 }),
          ]),
        }),
      ]),
    );

    const darnic = slice.find((card) => card.id === 'master.darnic.skill.ascension');
    expect(darnic?.abilities).toContainEqual(
      expect.objectContaining({
        id: 'darnic.old-acquaintances.scorched-earth',
        effects: [expect.objectContaining({ type: 'choose_one' })],
      }),
    );

    const vassal = slice.find((card) => card.id === 'master.amakusa.skill.s3');
    expect(vassal?.abilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'amakusa.vassal.entry-seal-cost' }),
        expect.objectContaining({ id: 'amakusa.vassal.linked-mana-contribution' }),
        expect.objectContaining({ id: 'amakusa.vassal.different-combat-shared-vp' }),
      ]),
    );

    const fou = slice.find((card) => card.id === 'master.fou.skill.ascension');
    expect(fou?.abilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'fou.force-of-providence.prevent-elimination' }),
        expect.objectContaining({ id: 'fou.force-of-providence.swap-vp' }),
        expect.objectContaining({ id: 'fou.force-of-providence.shared-victory' }),
      ]),
    );
  });

  it('grounds the nine-ID Ciel/Celenike/Dan batch with exact development text and source-first semantics', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.ciel.skill.ascension',
      'master.ciel.skill.s1',
      'master.ciel.skill.s1a',
      'master.celenike.skill.ascension',
      'master.celenike.skill.s1',
      'master.celenike.skill.s1a',
      'master.dan.skill.ascension',
      'master.dan.skill.s1',
      'master.dan.skill.s1a',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(9);
    expect(slice.every((card) =>
      card.source?.authority === 'DEVELOPMENT_TEXT' &&
      card.source.document === 'Fate_Domination-开发版/data_masters.js' &&
      card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
      createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256 &&
      card.source.sourceTextSha256 === card.referencePrintedTextSha256
    )).toBe(true);

    const cielAsc = slice.find((card) => card.id === 'master.ciel.skill.ascension');
    expect(cielAsc?.abilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'ciel.seventh-scripture-form.strength-power' }),
      expect.objectContaining({ id: 'ciel.seventh-scripture-form.grant-soul-crush', effects: [expect.objectContaining({ type: 'grant_linked_ability_to_attribute_attacks', attribute: 'strength', linkedDefinitionId: 'master.ciel.skill.s3' })] }),
      expect.objectContaining({ id: 'ciel.seventh-scripture-form.append-cremation', conditions: [expect.objectContaining({ type: 'controller_mana_at_least', value: 8 })] }),
    ]));

    const celenike = slice.find((card) => card.id === 'master.celenike.skill.s1');
    expect(celenike?.abilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'celenike.curse.apply-wither', effects: [expect.objectContaining({ type: 'add_linked_status', statusId: 'withered' })] }),
      expect.objectContaining({ id: 'celenike.curse.clear-wither', effects: [expect.objectContaining({ type: 'remove_linked_status', statusId: 'withered' })] }),
      expect.objectContaining({ id: 'celenike.curse.steal-on-win', effects: [expect.objectContaining({ type: 'transfer_victory_points', amount: 2, perTarget: true })] }),
    ]));

    const stake = slice.find((card) => card.id === 'master.celenike.skill.ascension');
    const pain = stake?.abilities.find((ability) => ability.id === 'celenike.iron-stake.pain-stake');
    expect(pain?.effects).toContainEqual(expect.objectContaining({ type: 'choose_one', chooser: 'each_target', iteration: 'turn_order' }));
    const choice = pain?.effects.find((effect) => effect.type === 'choose_one') as any;
    expect(choice?.options).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'pay-mana', effects: [expect.objectContaining({ type: 'pay_mana', amount: 2 })] }),
      expect.objectContaining({ id: 'discard-all', effects: [expect.objectContaining({ type: 'move_matching_cards', source: 'hand', destination: 'discard' })] }),
    ]));

    const danAsc = slice.find((card) => card.id === 'master.dan.skill.ascension');
    expect(danAsc?.abilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'dan.may-knight.seed-supply', effects: [expect.objectContaining({ type: 'seed_attached_supply' })] }),
      expect.objectContaining({
        id: 'dan.may-knight.append-supply',
        effects: expect.arrayContaining([
          expect.objectContaining({ type: 'pay_mana', amountFormula: 'selected_card_printed_mana_cost' }),
          expect.objectContaining({ type: 'move_selected_cards', source: 'attached', destination: 'attack', endRoundDestination: 'discard' }),
          expect.objectContaining({ type: 'draw_cards', count: 1, resultVar: 'drawnCardIds' }),
          expect.objectContaining({ type: 'remove_selected_cards', sourceBinding: 'drawnCardIds', destination: 'removed' }),
        ]),
      }),
    ]));
  });

  it('grounds the nine-ID Goetia/Magical Ruby/Irisviel batch with exact development snapshots and explicit composite semantics', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.goetia.skill.s1', 'master.goetia.skill.s2', 'master.goetia.skill.ascension',
      'master.illya-mahou.skill.s1', 'master.illya-mahou.skill.s1a', 'master.illya-mahou.skill.ascension',
      'master.irisviel.skill.s1', 'master.irisviel.skill.s2', 'master.irisviel.skill.ascension',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(9);
    expect(slice.every((card) =>
      card.source?.authority === 'DEVELOPMENT_TEXT' &&
      card.source.document === 'Fate_Domination-开发版/data_masters.js' &&
      card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
      createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256 &&
      card.source.sourceTextSha256 === card.referencePrintedTextSha256
    )).toBe(true);

    const goetia = slice.find((card) => card.id === 'master.goetia.skill.s2');
    expect(goetia?.abilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'goetia.demon-gods.phenex-regeneration' }),
      expect.objectContaining({ id: 'goetia.demon-gods.forneus-invocation', effects: expect.arrayContaining([expect.objectContaining({ type: 'retrigger_card_play_effects' })]) }),
      expect.objectContaining({ id: 'goetia.demon-gods.raum-dream-flight', effects: expect.arrayContaining([expect.objectContaining({ type: 'move_player', destination: 'any_location' })]) }),
    ]));
    const ruby = slice.find((card) => card.id === 'master.illya-mahou.skill.s1a');
    expect(ruby?.abilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'illya-ruby.kaleidostick.draw-any' }),
      expect.objectContaining({ id: 'illya-ruby.kaleidostick.shuffle-discard', effects: expect.arrayContaining([expect.objectContaining({ type: 'pay_mana', amountFormula: '2 * controller_hand_count' })]) }),
    ]));
    const conversion = slice.find((card) => card.id === 'master.irisviel.skill.s2');
    expect(conversion?.abilities).toContainEqual(expect.objectContaining({
      id: 'conversion-magic.preparation',
      effects: expect.arrayContaining([expect.objectContaining({ type: 'move_matching_cards', resultVar: 'discardedCount' }), expect.objectContaining({ type: 'gain_mana', amountBinding: 'discardedCount' })]),
    }));
  });

  it('grounds the fourteen-ID Araya/Kayneth/Leonardo/Taiga/Tokiomi batch with exact development evidence and explicit special boundaries', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.araya.skill.s1', 'master.araya.skill.ascension',
      'master.kayneth.skill.s1', 'master.kayneth.skill.s2', 'master.kayneth.skill.ascension',
      'master.leonardo.skill.s1', 'master.leonardo.skill.s1a', 'master.leonardo.skill.ascension',
      'master.taiga.skill.s1', 'master.taiga.skill.s1a', 'master.taiga.skill.ascension',
      'master.tokiomi.skill.s1', 'master.tokiomi.skill.s2', 'master.tokiomi.skill.ascension',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(14);
    expect(slice.every((card) =>
      card.source?.authority === 'DEVELOPMENT_TEXT' &&
      card.source.document.endsWith('/data_masters.js') &&
      card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
      createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256 &&
      card.source.sourceTextSha256 === card.referencePrintedTextSha256
    )).toBe(true);

    expect(slice.find((card) => card.id === 'master.araya.skill.s1')?.abilities).toContainEqual(expect.objectContaining({
      id: 'araya.triple-boundary.persistent-terrain',
      effects: expect.arrayContaining([expect.objectContaining({ type: 'terrain_position_adjustment', operation: 'replace_deployment_terrain_with_persistent_location_advantage', max: 5 })]),
    }));
    expect(slice.find((card) => card.id === 'master.kayneth.skill.s2')?.abilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'kayneth.alchemist.independent-deck', effects: expect.arrayContaining([expect.objectContaining({ type: 'independent_deck_rule', operation: 'create_and_shuffle', count: 6 })]) }),
      expect.objectContaining({ id: 'kayneth.alchemist.draw-volumen', effects: expect.arrayContaining([expect.objectContaining({ type: 'independent_deck_rule', operation: 'draw', count: 1 })]) }),
    ]));
    expect(slice.find((card) => card.id === 'master.taiga.skill.ascension')?.abilities).toContainEqual(expect.objectContaining({
      id: 'taiga.domestic-carnage.workshop-battlefield',
      effects: expect.arrayContaining([expect.objectContaining({ type: 'location_token_rule', operation: 'treat_location_as_battlefield', location: 'workshop' })]),
    }));
    expect(slice.find((card) => card.id === 'master.tokiomi.skill.s2')?.abilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'tokiomi.careless-mentor.add-items', effects: expect.arrayContaining([expect.objectContaining({ type: 'item_rule', operation: 'add_four_items_to_game', count: 4 })]) }),
      expect.objectContaining({ id: 'tokiomi.careless-mentor.item-permission', effects: expect.arrayContaining([expect.objectContaining({ type: 'item_rule', operation: 'grant_use_permission', maxUsesPerPlayerPerRound: 1 })]) }),
    ]));
  });

  it('grounds the nineteen-ID Julius/Kuzuki/Waver/Sieg/Illya slice without hiding bespoke cross-subsystem mechanics', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.julius.skill.s1','master.julius.skill.s1a','master.julius.skill.ascension',
      'master.kuzuki.skill.s1','master.kuzuki.skill.s3','master.kuzuki.skill.ascension',
      'master.waver.skill.s1','master.waver.skill.s2','master.waver.skill.s3','master.waver.skill.ascension',
      'master.sieg.skill.s1','master.sieg.skill.s1a','master.sieg.skill.s2','master.sieg.skill.ascension',
      'master.iliya.skill.s1','master.iliya.skill.s2','master.iliya.skill.s3','master.iliya.skill.s4','master.iliya.skill.ascension',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(19);
    expect(slice.every((card) =>
      card.source?.authority === 'DEVELOPMENT_TEXT' &&
      card.source.document.endsWith('/data_masters.js') &&
      card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
      createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256 &&
      card.source.sourceTextSha256 === card.referencePrintedTextSha256
    )).toBe(true);

    expect(slice.find((card) => card.id === 'master.julius.skill.s1')?.abilities).toContainEqual(expect.objectContaining({
      effects: expect.arrayContaining([expect.objectContaining({ type: 'deferred_deployment_rule', operation: 'skip_outpost_then_deploy' })]),
    }));
    expect(slice.find((card) => card.id === 'master.kuzuki.skill.ascension')?.abilities).toContainEqual(expect.objectContaining({
      effects: expect.arrayContaining([expect.objectContaining({ type: 'grant_linked_ability_to_definition', definitionId: 'master.kuzuki.skill.s3' })]),
    }));
    expect(slice.find((card) => card.id === 'master.waver.skill.ascension')?.abilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type: 'winner_prediction_rule' })]) }),
      expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type: 'schedule_phase_effect', timing: 'outpost_phase_end' })]) }),
    ]));
    expect(slice.find((card) => card.id === 'master.sieg.skill.s2')?.abilities).toContainEqual(expect.objectContaining({
      effects: expect.arrayContaining([expect.objectContaining({ type: 'choose_one' })]),
    }));
    expect(slice.find((card) => card.id === 'master.iliya.skill.ascension')?.abilities).toContainEqual(expect.objectContaining({
      effects: expect.arrayContaining([expect.objectContaining({ type: 'finish_game', winners: 'all_non_eliminated_players' })]),
    }));
  });

  it('grounds the nineteen-ID Rin/Sakura/Shinji/Kirei Fuyuki slice with explicit replacement and role-state boundaries', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.rin.skill.s1','master.rin.skill.s2','master.rin.skill.s3','master.rin.skill.s4','master.rin.skill.ascension',
      'master.sakura.skill.s1','master.sakura.skill.s2','master.sakura.skill.s3','master.sakura.skill.s4','master.sakura.skill.ascension',
      'master.shinji.skill.s1','master.shinji.skill.s2','master.shinji.skill.s3','master.shinji.skill.s4','master.shinji.skill.ascension',
      'master.kirei.skill.s1','master.kirei.skill.s2','master.kirei.skill.s3','master.kirei.skill.ascension',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(19);
    expect(slice.every((card) =>
      card.source?.authority === 'DEVELOPMENT_TEXT' &&
      card.source.document.endsWith('/data_masters.js') &&
      card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
      createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256 &&
      card.source.sourceTextSha256 === card.referencePrintedTextSha256
    )).toBe(true);

    expect(slice.find((card) => card.id === 'master.rin.skill.s1')?.abilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type: 'gem_resource_rule', operation: 'initialize', amount: 10 })]) }),
      expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type: 'gem_resource_rule', operation: 'climax_option_repeat_override', perOptionMaxUses: 3 })]) }),
    ]));
    expect(slice.find((card) => card.id === 'master.rin.skill.s3')?.abilities).toContainEqual(expect.objectContaining({
      effects: expect.arrayContaining([expect.objectContaining({ type: 'gem_resource_rule', operation: 'spend_one_and_choose_option' })]),
    }));
    expect(slice.find((card) => card.id === 'master.sakura.skill.s4')?.abilities).toContainEqual(expect.objectContaining({
      effects: expect.arrayContaining([expect.objectContaining({ type: 'infinite_mana_rule', operation: 'lock_infinite_no_gain_or_loss' })]),
    }));
    expect(slice.find((card) => card.id === 'master.shinji.skill.s4')?.abilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type: 'roster_replacement_rule', operation: 'replace_servant_random_unused' })]) }),
      expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type: 'roster_replacement_rule', operation: 'replace_master', definitionId: 'master.sakura' })]) }),
    ]));
    expect(slice.find((card) => card.id === 'master.shinji.skill.ascension')?.abilities).toContainEqual(expect.objectContaining({
      effects: expect.arrayContaining([expect.objectContaining({ type: 'servant_ownership_rule', operation: 'shinji_holy_grail_core' })]),
    }));
    expect(slice.find((card) => card.id === 'master.kirei.skill.ascension')?.abilities).toContainEqual(expect.objectContaining({
      effects: expect.arrayContaining([expect.objectContaining({ type: 'defeat_player', subject: 'selected_player' })]),
    }));
  });
  it('grounds the twenty-ID Kariya/Kiritsugu/Shirou/Maiya/Ryuunosuke Fuyuki slice with explicit bespoke boundaries', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.kariya.skill.s1','master.kariya.skill.s2','master.kariya.skill.s3','master.kariya.skill.s4','master.kariya.skill.ascension',
      'master.kiritsugu.skill.s1','master.kiritsugu.skill.s2','master.kiritsugu.skill.s3','master.kiritsugu.skill.s4','master.kiritsugu.skill.ascension',
      'master.shirou-emiya.skill.s1','master.shirou-emiya.skill.s2','master.shirou-emiya.skill.s3','master.shirou-emiya.skill.ascension',
      'master.maiya.skill.s1','master.maiya.skill.s2','master.maiya.skill.ascension',
      'master.ryuunosuke.skill.s1','master.ryuunosuke.skill.s2','master.ryuunosuke.skill.ascension',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(20);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find((c) => c.id === 'master.kariya.skill.s2')?.abilities).toContainEqual(expect.objectContaining({effects: expect.arrayContaining([expect.objectContaining({type:'nemesis_rule',operation:'assign_player_to_right'})])}));
    expect(slice.find((c) => c.id === 'master.kiritsugu.skill.s2')?.abilities).toContainEqual(expect.objectContaining({id:'time-alter.action'}));
    expect(slice.find((c) => c.id === 'master.maiya.skill.s1')?.abilities).toContainEqual(expect.objectContaining({id:'military.attach-support-shot'}));
    expect(slice.find((c) => c.id === 'master.ryuunosuke.skill.ascension')?.abilities).toContainEqual(expect.objectContaining({effects: expect.arrayContaining([expect.objectContaining({type:'event_battlefield_penalty'})])}));
  });
  it('grounds the eighteen-ID Zouken/Caren/Miyu/Shirou Meal slice with explicit cross-subsystem boundaries', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.zouken.skill.s1','master.zouken.skill.s2','master.zouken.skill.s3','master.zouken.skill.s4','master.zouken.skill.s5','master.zouken.skill.ascension',
      'master.caren.skill.s1','master.caren.skill.s1a','master.caren.skill.s2','master.caren.skill.s3','master.caren.skill.ascension',
      'master.miyu.skill.s1','master.miyu.skill.s2','master.miyu.skill.s3','master.miyu.skill.ascension',
      'master.shirou-meal.skill.s1','master.shirou-meal.skill.s2','master.shirou-meal.skill.ascension',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(18);
    expect(slice.every((card) =>
      card.source?.authority === 'DEVELOPMENT_TEXT' &&
      card.source.sourceText === card.printedText &&
      card.source.sourceFileSha256 === 'c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825' &&
      createHash('sha256').update(card.source.sourceText, 'utf8').digest('hex') === card.source.sourceTextSha256 &&
      card.source.sourceTextSha256 === card.referencePrintedTextSha256
    )).toBe(true);
    expect(slice.find((c) => c.id === 'master.zouken.skill.s3')?.abilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ruleModifiers: expect.arrayContaining([expect.objectContaining({rule:'command_seal_transaction',operation:'replace_with_mana',manaPerSeal:4})])}),
      expect.objectContaining({effects: expect.arrayContaining([expect.objectContaining({type:'linked_player_battle_reward'})])}),
    ]));
    expect(slice.find((c) => c.id === 'master.caren.skill.s2')?.abilities).toContainEqual(expect.objectContaining({effects: expect.arrayContaining([expect.objectContaining({type:'reactive_resource_rule'})])}));
    expect(slice.find((c) => c.id === 'master.caren.skill.s3')?.abilities).toContainEqual(expect.objectContaining({effects: expect.arrayContaining([expect.objectContaining({type:'bound_opponent_rule'})])}));
    expect(slice.find((c) => c.id === 'master.miyu.skill.s1')?.abilities).toContainEqual(expect.objectContaining({effects: expect.arrayContaining([expect.objectContaining({type:'roster_skill_draft_rule'})])}));
    expect(slice.find((c) => c.id === 'master.miyu.skill.s3')?.abilities).toContainEqual(expect.objectContaining({effects: expect.arrayContaining([expect.objectContaining({type:'dream_summon_rule'})])}));
    expect(slice.find((c) => c.id === 'master.shirou-meal.skill.s1')?.abilities).toContainEqual(expect.objectContaining({effects: expect.arrayContaining([expect.objectContaining({type:'food_resource_rule',operation:'gain_food_from_current_location_event_and_active_situation_attributes'})])}));
  });

  it('grounds the twenty-ID Reines/Caules/Shishigou slice with explicit subsystem boundaries', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.reines.skill.s1','master.reines.skill.s1a','master.reines.skill.s2','master.reines.skill.s3','master.reines.skill.s4','master.reines.skill.ascension',
      'master.caules.skill.s1','master.caules.skill.s1a','master.caules.skill.s2','master.caules.skill.s3','master.caules.skill.ascension',
      'master.caules-yggdmillennia.skill.s1','master.caules-yggdmillennia.skill.s1a','master.caules-yggdmillennia.skill.s2','master.caules-yggdmillennia.skill.s3','master.caules-yggdmillennia.skill.ascension',
      'master.shishigou.skill.s1','master.shishigou.skill.s2','master.shishigou.skill.s3','master.shishigou.skill.ascension',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(20);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find((c) => c.id === 'master.reines.skill.ascension')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type: 'trimmau_growth_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.caules.skill.s2')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type: 'crafted_tree_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.caules-yggdmillennia.skill.ascension')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type: 'scheduled_deck_rebuild_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.shishigou.skill.s1')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type: 'necromancy_rite_rule' })]) }));
  });

  it('grounds the twenty-ID Extra Hakuno/Rani/Jinako/Alice slice with explicit special boundaries', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.hakuno-f.skill.s1','master.hakuno-f.skill.s2','master.hakuno-f.skill.s3','master.hakuno-f.skill.s4','master.hakuno-f.skill.s5','master.hakuno-f.skill.ascension',
      'master.hakuno-m.skill.s1','master.hakuno-m.skill.s2','master.hakuno-m.skill.s3','master.hakuno-m.skill.ascension',
      'master.rani.skill.s1','master.rani.skill.s2','master.rani.skill.s3','master.rani.skill.ascension',
      'master.jinako.skill.s1','master.jinako.skill.s2','master.jinako.skill.ascension',
      'master.alice.skill.s1','master.alice.skill.s2','master.alice.skill.ascension',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(20);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find((c) => c.id === 'master.hakuno-f.skill.s4')?.abilities).toContainEqual(expect.objectContaining({ id:'hakuno-f.extella.recovery', effects: expect.arrayContaining([expect.objectContaining({ type:'gain_mana', timing:'on_controller_loss_when_current_combat_resolves' })]) }));
    expect(slice.find((c) => c.id === 'master.hakuno-m.skill.s1')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'choose_effect' })]) }));
    expect(slice.find((c) => c.id === 'master.rani.skill.ascension')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'event_card_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.jinako.skill.s1')?.abilities).toContainEqual(expect.objectContaining({ id:'jinako.gamer.leave-workshop', effects: expect.arrayContaining([expect.objectContaining({ type:'lose_mana', amount:3 })]) }));
    expect(slice.find((c) => c.id === 'master.alice.skill.s2')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'phantom_player_rule' })]) }));
  });

  it('grounds the nineteen-ID Ritsuka/Roche/Tiamat/Kohaku/Chaos slice including dynamic Life Sea evidence', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.ritsuka-f.skill.s1','master.ritsuka-f.skill.s1a','master.ritsuka-f.skill.ascension',
      'master.ritsuka-m.skill.s1','master.ritsuka-m.skill.s2','master.ritsuka-m.skill.ascension',
      'master.roche.skill.s1','master.roche.skill.s1a','master.roche.skill.s2','master.roche.skill.ascension',
      'master.tiamat.skill.s1','master.tiamat.skill.s1a','master.tiamat.skill.ascension','master.tiamat.card.life-sea',
      'master.kohaku.skill.s1','master.kohaku.skill.s1a','master.kohaku.skill.s3','master.kohaku.skill.ascension',
      'master.chaos.skill.s17',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(19);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find((c) => c.id === 'master.ritsuka-f.skill.s1')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'dual_servant_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.roche.skill.s1a')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'gain_mana', amount:1 }), expect.objectContaining({ type:'gain_victory_points', amount:1 })]) }));
    expect(slice.find((c) => c.id === 'master.tiamat.card.life-sea')?.source?.document).toBe('Fate_Domination-开发版/index.html');
    expect(slice.find((c) => c.id === 'master.tiamat.card.life-sea')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'beast_resource_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.kohaku.skill.s1a')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'gain_mana', amount:1 })]) }));
    expect(slice.find((c) => c.id === 'master.chaos.skill.s17')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'choose_effect' })]) }));
  });
  it('grounds the nineteen-ID Akiha/Kiara/Fujino slice with exact development snapshots and explicit bespoke boundaries', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.akiha.skill.s1','master.akiha.skill.s1a','master.akiha.skill.s2','master.akiha.skill.s3','master.akiha.skill.ascension',
      'master.kiara.skill.s1','master.kiara.skill.s1a','master.kiara.skill.s2','master.kiara.skill.s3','master.kiara.skill.s4','master.kiara.skill.s5','master.kiara.skill.s6','master.kiara.skill.ascension',
      'master.fujino.skill.s1','master.fujino.skill.s1a','master.fujino.skill.s2','master.fujino.skill.s3','master.fujino.skill.s4','master.fujino.skill.ascension',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(19);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.document === 'Fate_Domination-开发版/data_masters.js' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find((c) => c.id === 'master.akiha.skill.s3')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'murder_impulse_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.kiara.skill.s2')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'secret_garden_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.kiara.skill.s6')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'defeat_player' })]) }));
    expect(slice.find((c) => c.id === 'master.fujino.skill.s1')?.abilities).toContainEqual(expect.objectContaining({ creates: expect.arrayContaining([expect.objectContaining({ type:'card', definitionId:'master.fujino.skill.s3' })]) }));
    expect(slice.find((c) => c.id === 'master.fujino.skill.s4')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'trauma_state_rule' })]) }));
  });

  it('grounds the seventeen-ID Shiki trio slice with exact development snapshots and explicit deck/form boundaries', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.shiki-nanaya.skill.s1','master.shiki-nanaya.skill.s1a','master.shiki-nanaya.skill.s1b','master.shiki-nanaya.skill.s2','master.shiki-nanaya.skill.ascension',
      'master.shiki-ryougi.skill.s1','master.shiki-ryougi.skill.s1a','master.shiki-ryougi.skill.s1b','master.shiki-ryougi.skill.s2','master.shiki-ryougi.skill.s3','master.shiki-ryougi.skill.ascension',
      'master.shiki-tohno.skill.s1','master.shiki-tohno.skill.s1a','master.shiki-tohno.skill.s2','master.shiki-tohno.skill.s3','master.shiki-tohno.skill.s4','master.shiki-tohno.skill.ascension',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(17);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.document === 'Fate_Domination-开发版/data_masters.js' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find((c) => c.id === 'master.shiki-nanaya.skill.s2')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'deck_top_manipulation_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.shiki-ryougi.skill.s2')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'deck_bottom_match_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.shiki-ryougi.skill.s3')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'move_selected_cards' })]) }));
    expect(slice.find((c) => c.id === 'master.shiki-tohno.skill.s1a')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'control_resource_transform_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.shiki-tohno.skill.ascension')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'schedule_phase_effect' })]) }));
  });

  it('grounds the twenty-one-ID Akasha/Hisui Detective/Wallachia slice with exact development snapshots and explicit state-machine boundaries', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set([
      'master.akasha.skill.ascension','master.akasha.skill.s1a','master.akasha.skill.s2','master.akasha.skill.s3','master.akasha.skill.s4','master.akasha.skill.s5','master.akasha.skill.s6',
      'master.hisui-detective.skill.ascension','master.hisui-detective.skill.s1','master.hisui-detective.skill.s1a','master.hisui-detective.skill.s2','master.hisui-detective.skill.s3',
      'master.wallachia.skill.ascension','master.wallachia.skill.s1','master.wallachia.skill.s2','master.wallachia.skill.s3','master.wallachia.skill.s4','master.wallachia.skill.s5','master.wallachia.skill.s6','master.wallachia.skill.s7','master.wallachia.skill.s8',
    ]);
    const slice = overlays.filter((card) => ids.has(card.id));
    expect(slice).toHaveLength(21);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.document.endsWith('/data_masters.js') && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find((c) => c.id === 'master.akasha.skill.s2')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'reincarnation_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.akasha.skill.s5')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'overload_card_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.hisui-detective.skill.s3')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'detective_accusation_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.wallachia.skill.s2')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'fear_attribute_rule' })]) }));
    expect(slice.find((c) => c.id === 'master.wallachia.skill.s8')?.abilities).toContainEqual(expect.objectContaining({ effects: expect.arrayContaining([expect.objectContaining({ type:'tatari_deterioration_rule' })]) }));
  });

  it('grounds the seventeen-ID Sion source-evidence slice with exact development snapshots and explicit training/EX boundaries', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = new Set(['master.sion.skill.ascension','master.sion.skill.s1','master.sion.skill.s10','master.sion.skill.s11','master.sion.skill.s12','master.sion.skill.s14','master.sion.skill.s15','master.sion.skill.s16','master.sion.skill.s17','master.sion.skill.s2','master.sion.skill.s3','master.sion.skill.s4','master.sion.skill.s5','master.sion.skill.s6','master.sion.skill.s7','master.sion.skill.s8','master.sion.skill.s9']);
    const slice=overlays.filter((card)=>ids.has(card.id)); expect(slice).toHaveLength(17);
    expect(slice.every((card)=>card.source?.authority==='DEVELOPMENT_TEXT' && card.source.document.endsWith('/data_masters.js') && card.source.sourceText===card.printedText && card.source.sourceTextSha256===card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='master.sion.skill.s1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'training_skill_overlay_rule'})])}));
    expect(slice.find(c=>c.id==='master.sion.skill.s7')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'unpreventable_result_rule'})])}));
    expect(slice.find(c=>c.id==='master.sion.skill.s15')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'moon_holy_grail_reset_rule'})])}));
    expect(slice.find(c=>c.id==='master.sion.skill.s16')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'remove_cards_in_zone'})])}));
    expect(slice.find(c=>c.id==='master.sion.skill.s17')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'luck_reveal_defeat_rule'})])}));
  });

  it('grounds the seventeen-ID Da Vinci slice from the exact clean caster/assassin development snapshot', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const slice = overlays.filter((card) => card.id.startsWith('servant.davinci.skill.'));
    expect(slice).toHaveLength(17);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.document === 'Fate_Domination-开发版/batch_caster_assassin.js' && card.source.sourceFileSha256 === 'd6f1b5d4173f437d6592904a73def7006065d8e8ac8ed333e1cbec733f3a5bc0' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.davinci.skill.sc-davinci-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'temporary_card_copy_rule'})])}));
    expect(slice.find(c=>c.id==='servant.davinci.skill.sc-davinci-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'shop_auction_rule'})])}));
    expect(slice.find(c=>c.id==='servant.davinci.skill.sc-davinci-14')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'draw_cards'}),expect.objectContaining({type:'move_selected_cards'})])}));
    expect(slice.find(c=>c.id==='servant.davinci.skill.sc-davinci-17')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'upgrade_attachment_rule'})])}));
  });

  it('grounds the twenty-seven-ID Illya/Artoria Caster/Koyanskaya/Avicebron slice from the exact caster/assassin development snapshot', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const prefixes = ['servant.illya.skill.','servant.artoriac.skill.','servant.koyanskaya.skill.','servant.avicebron.skill.'];
    const slice = overlays.filter((card) => prefixes.some((prefix) => card.id.startsWith(prefix)));
    expect(slice).toHaveLength(27);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.document === 'Fate_Domination-开发版/batch_caster_assassin.js' && card.source.sourceFileSha256 === 'd6f1b5d4173f437d6592904a73def7006065d8e8ac8ed333e1cbec733f3a5bc0' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.avicebron.skill.sc-avicebron-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'golem_rule'})])}));
    expect(slice.find(c=>c.id==='servant.illya.skill.sc-illya-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'card_case_attachment_rule'})])}));
    expect(slice.find(c=>c.id==='servant.illya.skill.sc-illya-2')?.abilities).toContainEqual(expect.objectContaining({ruleModifiers:expect.arrayContaining([expect.objectContaining({rule:'card_play_permission'})])}));
    expect(slice.find(c=>c.id==='servant.artoriac.skill.sc-artoriac-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'discard_luck_state_rule'})])}));
    expect(slice.find(c=>c.id==='servant.koyanskaya.skill.sc-koyanskaya-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'cargo_box_rule'})])}));
  });

  it('grounds the seven-ID Sherlock slice from the exact berserker/extra development snapshot', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const slice = overlays.filter((card) => card.id.startsWith('servant.sherlock.skill.'));
    expect(slice).toHaveLength(7);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.document === 'Fate_Domination-开发版/batch_berserker_extra.js' && card.source.sourceFileSha256 === '6bf26e40ff08ff632ac5dcee88a9cda4684e60ca71c39adadbb239d1f3723fdc' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.every((card) => card.abilities.some((ability) => ability.effects?.some((effect:any) => effect.type === 'deduction_rule')))).toBe(true);
  });

  it('grounds the sixteen-ID Abigail/BB/Bikuni/Hokusai slice from the exact berserker/extra development snapshot', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const prefixes = ['servant.abigail.skill.','servant.bb.skill.','servant.bikuni.skill.','servant.hokusai.skill.'];
    const slice = overlays.filter((card) => prefixes.some((prefix) => card.id.startsWith(prefix)));
    expect(slice).toHaveLength(16);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.document === 'Fate_Domination-开发版/batch_berserker_extra.js' && card.source.sourceFileSha256 === '6bf26e40ff08ff632ac5dcee88a9cda4684e60ca71c39adadbb239d1f3723fdc' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.bb.skill.sc-bb-4')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'moon_holy_grail_rule'})])}));
    expect(slice.find(c=>c.id==='servant.abigail.skill.sc-abigail-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'foreign_life_rule'})])}));
    expect(slice.find(c=>c.id==='servant.hokusai.skill.sc-hokusai-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'color_marker_rule'})])}));
  });

  it('grounds the twelve-ID Mash/Oberon/Voyager slice from the exact berserker/extra development snapshot', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const prefixes = ['servant.mash.skill.','servant.oberon.skill.','servant.voyager.skill.'];
    const slice = overlays.filter((card) => prefixes.some((prefix) => card.id.startsWith(prefix)));
    expect(slice).toHaveLength(12);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.document === 'Fate_Domination-开发版/batch_berserker_extra.js' && card.source.sourceFileSha256 === '6bf26e40ff08ff632ac5dcee88a9cda4684e60ca71c39adadbb239d1f3723fdc' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.mash.skill.sc-mash-4')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'guard_rule'})])}));
    expect(slice.find(c=>c.id==='servant.oberon.skill.sc-oberon-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'ruler_seal_rule'})])}));
    expect(slice.find(c=>c.id==='servant.voyager.skill.sc-voyager-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'visitor_card_rule'})])}));
    expect(slice.find(c=>c.id==='servant.voyager.skill.sc-voyager-4')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'foreign_life_rule'})])}));
  });

  it('grounds the eight-ID Kagetora/Martha slice from the exact lancer/rider development snapshot', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const prefixes = ['servant.kagetora.skill.','servant.martha.skill.'];
    const slice = overlays.filter((card) => prefixes.some((prefix) => card.id.startsWith(prefix)));
    expect(slice).toHaveLength(8);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.document === 'Fate_Domination-开发版/batch_lancer_rider.js' && card.source.sourceFileSha256 === '4123b4e5f01a099eb7e0bb04a3aaf5366bdcd6aa6f4eb02d6dd498b6b65a7f0f' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.kagetora.skill.sc-kagetora-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'opponent_mana_borrow_rule'})])}));
    expect(slice.find(c=>c.id==='servant.kagetora.skill.sc-kagetora-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'move_player'})])}));
    expect(slice.find(c=>c.id==='servant.martha.skill.sc-martha-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'deferred_deployment_rule'})])}));
    expect(slice.find(c=>c.id==='servant.martha.skill.sc-martha-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'draw_cards'}),expect.objectContaining({type:'play_selected_cards'})])}));
  });

  it('grounds the twelve-ID Okita/Molay/Lakshmibai slice from the exact saber/archer development snapshot', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const prefixes = ['servant.okita.skill.','servant.molay.skill.','servant.lakshmibai.skill.'];
    const slice = overlays.filter((card) => prefixes.some((prefix) => card.id.startsWith(prefix)));
    expect(slice).toHaveLength(12);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.document === 'Fate_Domination-开发版/batch_saber_archer.js' && card.source.sourceFileSha256 === 'b2d01ee53abbd6cade232d5ea8252ea74bd7fe1fc22619116a19c1148b234ea4' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.lakshmibai.skill.sc-lakshmibai-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'prevent_elimination'}),expect.objectContaining({type:'event_card_rule'})])}));
    expect(slice.find(c=>c.id==='servant.molay.skill.sc-molay-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'form_state_rule'}),expect.objectContaining({type:'foreign_life_rule'})])}));
    expect(slice.find(c=>c.id==='servant.okita.skill.sc-okita-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'play_selected_cards'}),expect.objectContaining({type:'draw_cards'})])}));
    expect(slice.find(c=>c.id==='servant.okita.skill.sc-okita-4')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'weak_constitution_rule'})])}));
  });

  it('grounds the fifteen-ID Saber five slice from the locked saber/archer development snapshot', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const prefixes = ['servant.altera.skill.','servant.gawain.skill.','servant.bedivere.skill.','servant.arthur.skill.','servant.artoria-alt.skill.'];
    const slice = overlays.filter((card) => prefixes.some((prefix) => card.id.startsWith(prefix)));
    expect(slice).toHaveLength(15);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.document === 'Fate_Domination-开发版/batch_saber_archer.js' && card.source.sourceFileSha256 === 'b2d01ee53abbd6cade232d5ea8252ea74bd7fe1fc22619116a19c1148b234ea4' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    for (const id of ['servant.altera.skill.sc-altera-3','servant.gawain.skill.sc-gawain-3','servant.bedivere.skill.sc-bedivere-1','servant.arthur.skill.sc-arthur-3','servant.artoria-alt.skill.sc-artoria-alt-3']) {
      expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'gain_victory_points'}),expect.objectContaining({type:'set_opponent_attribute_power'})])}));
    }
    expect(slice.find(c=>c.id==='servant.altera.skill.sc-altera-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'delayed_attack_event_replacement_rule'})])}));
    expect(slice.find(c=>c.id==='servant.bedivere.skill.sc-bedivere-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'zone_immunity_rule'})])}));
    expect(slice.find(c=>c.id==='servant.artoria-alt.skill.sc-artoria-alt-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'noble_phantasm_suppression_rule'})])}));
  });

  it('grounds the twelve newly blocked Nero/Mordred/Sigurd/Siegfried/Muramasa identities from the locked saber/archer snapshot', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const ids = [
      'servant.mordred.skill.sc-mordred-1','servant.mordred.skill.sc-mordred-2','servant.mordred.skill.sc-mordred-3',
      'servant.muramasa.skill.sc-muramasa-1','servant.muramasa.skill.sc-muramasa-2','servant.muramasa.skill.sc-muramasa-3',
      'servant.nero.skill.sc-nero-3','servant.siegfried.skill.sc-siegfried-1','servant.siegfried.skill.sc-siegfried-3',
      'servant.sigurd.skill.sc-sigurd-1','servant.sigurd.skill.sc-sigurd-2','servant.sigurd.skill.sc-sigurd-3'
    ];
    const slice = overlays.filter((card) => ids.includes(card.id));
    expect(slice).toHaveLength(12);
    expect(slice.every((card) => card.source?.authority === 'DEVELOPMENT_TEXT' && card.source.document === 'Fate_Domination-开发版/batch_saber_archer.js' && card.source.sourceFileSha256 === 'b2d01ee53abbd6cade232d5ea8252ea74bd7fe1fc22619116a19c1148b234ea4' && card.source.sourceText === card.printedText && card.source.sourceTextSha256 === card.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.mordred.skill.sc-mordred-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'mana_burst_refund_rule'})])}));
    expect(slice.find(c=>c.id==='servant.muramasa.skill.sc-muramasa-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'reverse_effect_rule'}),expect.objectContaining({type:'attribute_chain_rule'})])}));
    expect(slice.find(c=>c.id==='servant.nero.skill.sc-nero-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'turn_order_reposition_rule'})])}));
    expect(slice.find(c=>c.id==='servant.sigurd.skill.sc-sigurd-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'curse_basic_card_modifier_rule'})])}));
  });

  it('grounds the fifteen-ID Charlemagne/Deon/Musashi/Robin/Chiron slice from the locked saber/archer snapshot', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const prefixes=['servant.charlemagne.skill.','servant.deon.skill.','servant.musashi.skill.','servant.robin.skill.','servant.chiron.skill.'];
    const slice=overlays.filter((card)=>prefixes.some((prefix)=>card.id.startsWith(prefix)));
    expect(slice).toHaveLength(15);
    expect(slice.every((card)=>card.source?.authority==='DEVELOPMENT_TEXT' && card.source.document==='Fate_Domination-开发版/batch_saber_archer.js' && card.source.sourceFileSha256==='b2d01ee53abbd6cade232d5ea8252ea74bd7fe1fc22619116a19c1148b234ea4' && card.source.sourceText===card.printedText && card.source.sourceTextSha256===card.referencePrintedTextSha256)).toBe(true);
    for(const id of ['servant.chiron.skill.sc-chiron-1','servant.robin.skill.sc-robin-1']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'independent_action_rule'})])}));
    expect(slice.find(c=>c.id==='servant.deon.skill.sc-deon-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'block_counter_rule'})])}));
    expect(slice.find(c=>c.id==='servant.musashi.skill.sc-musashi-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'growth_counter_rule'})])}));
    expect(slice.find(c=>c.id==='servant.robin.skill.sc-robin-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'poison_defeat_rule'})])}));
  });

  it('grounds the fifteen-ID Arjuna/EMIYA Alter/Euryale/Ishtar/Jason slice from the locked saber/archer snapshot', () => {
    const overlays=loadSourceEvidenceOverlayCards(); const prefixes=['servant.arjuna-archer.skill.','servant.emiya-alt.skill.','servant.euryale.skill.','servant.ishtar.skill.','servant.jason.skill.']; const slice=overlays.filter((card)=>prefixes.some((p)=>card.id.startsWith(p))); expect(slice).toHaveLength(15);
    expect(slice.every((card)=>card.source?.authority==='DEVELOPMENT_TEXT' && card.source.document==='Fate_Domination-开发版/batch_saber_archer.js' && card.source.sourceFileSha256==='b2d01ee53abbd6cade232d5ea8252ea74bd7fe1fc22619116a19c1148b234ea4' && card.source.sourceText===card.printedText && card.source.sourceTextSha256===card.referencePrintedTextSha256)).toBe(true);
    for(const id of ['servant.emiya-alt.skill.sc-emiya-alt-1','servant.euryale.skill.sc-euryale-1','servant.ishtar.skill.sc-ishtar-3']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'independent_action_rule'})])}));
    for(const id of ['servant.jason.skill.sc-jason-1','servant.jason.skill.sc-jason-2','servant.jason.skill.sc-jason-3']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'dispatch_quest_rule'})])}));
    expect(slice.find(c=>c.id==='servant.arjuna-archer.skill.sc-arjuna-archer-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'prophecy_hand_sum_defeat_rule'})])}));
    expect(slice.find(c=>c.id==='servant.ishtar.skill.sc-ishtar-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'offboard_battle_takeover_rule'})])}));
  });

  it('grounds the fourteen-ID Achilles/Albion/Amakusa/Amor/Anastasia/Andersen slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards(); const ids=["servant.achilles.skill.sc-achilles-1","servant.achilles.skill.sc-achilles-2","servant.achilles.skill.sc-achilles-3","servant.albion.skill.sc-albion-3","servant.amakusa.skill.sc-amakusa-2","servant.amakusa.skill.sc-amakusa-3","servant.amor.skill.sc-amor-1","servant.amor.skill.sc-amor-2","servant.amor.skill.sc-amor-3","servant.anastasia.skill.sc-anastasia-2","servant.anastasia.skill.sc-anastasia-3","servant.andersen.skill.sc-andersen-3","servant.anastasia.skill.sc-anastasia-1","servant.andersen.skill.sc-andersen-1"]; const slice=overlays.filter((card)=>ids.includes(card.id)); expect(slice).toHaveLength(14);
    expect(slice.every((card)=>card.source?.authority==='DEVELOPMENT_TEXT' && card.source.sourceText===card.printedText && card.source.sourceTextSha256===card.referencePrintedTextSha256)).toBe(true);
    for(const id of ['servant.amakusa.skill.sc-amakusa-3','servant.amor.skill.sc-amor-1']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'ruler_seal_rule'})])}));
    for(const id of ['servant.anastasia.skill.sc-anastasia-1','servant.andersen.skill.sc-andersen-1']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'gain_mana',amount:1}),expect.objectContaining({type:'gain_victory_points',amount:2})])}));
    expect(slice.find(c=>c.id==='servant.achilles.skill.sc-achilles-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'achilles_heel_gale_rule'})])}));
    expect(slice.find(c=>c.id==='servant.anastasia.skill.sc-anastasia-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'viy_power_protection_rule'})])}));
  });

  it('grounds the thirteen-ID Arash/Arcueid/ArjunaAlter/Ashva/Astolfo slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards(); const prefixes=['servant.arash.skill.','servant.arcueid.skill.','servant.arjuna.skill.','servant.ashva.skill.','servant.astolfo.skill.']; const wanted=new Set(['servant.arash.skill.sc-arash-1','servant.arash.skill.sc-arash-2','servant.arash.skill.sc-arash-3','servant.arcueid.skill.sc-arcueid-1','servant.arcueid.skill.sc-arcueid-2','servant.arcueid.skill.sc-arcueid-3','servant.arjuna.skill.sc-arjuna-2','servant.arjuna.skill.sc-arjuna-3','servant.ashva.skill.sc-ashva-1','servant.ashva.skill.sc-ashva-2','servant.ashva.skill.sc-ashva-3','servant.astolfo.skill.sc-astolfo-2','servant.astolfo.skill.sc-astolfo-3']); const slice=overlays.filter(c=>wanted.has(c.id)); expect(slice).toHaveLength(13);
    expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256)).toBe(true);
    expect(slice.filter(c=>c.source?.document==='Fate_Domination-开发版/batch_saber_archer.js')).toHaveLength(6); expect(slice.filter(c=>c.source?.document==='Fate_Domination-开发版/batch_berserker_extra.js')).toHaveLength(5); expect(slice.filter(c=>c.source?.document==='Fate_Domination-开发版/batch_lancer_rider.js')).toHaveLength(2);
    expect(slice.find(c=>c.id==='servant.arash.skill.sc-arash-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'stella_servant_death_rule'})])})); expect(slice.find(c=>c.id==='servant.arcueid.skill.sc-arcueid-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'marble_phantasm_defeat_rule'})])})); expect(slice.find(c=>c.id==='servant.astolfo.skill.sc-astolfo-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'cooperative_skill_close_rule'})])}));
  });

  it('grounds the thirteen-ID Angra/Astraea/Atalanta/Baobhan/Barghest slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards(); const ids=new Set(["servant.angra.skill.sc-angra-1","servant.angra.skill.sc-angra-2","servant.angra.skill.sc-angra-3","servant.astraea.skill.sc-astraea-1","servant.astraea.skill.sc-astraea-2","servant.astraea.skill.sc-astraea-3","servant.atalanta.skill.sc-atalanta-3","servant.baobhan.skill.sc-baobhan-1","servant.baobhan.skill.sc-baobhan-2","servant.baobhan.skill.sc-baobhan-3","servant.barghest.skill.sc-barghest-1","servant.barghest.skill.sc-barghest-2","servant.barghest.skill.sc-barghest-3"]); const slice=overlays.filter(c=>ids.has(c.id)); expect(slice).toHaveLength(13); expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256)).toBe(true);
    expect(slice.filter(c=>c.source?.document==='Fate_Domination-开发版/data_servants.js')).toHaveLength(3); expect(slice.filter(c=>c.source?.document==='Fate_Domination-开发版/batch_berserker_extra.js')).toHaveLength(3); expect(slice.filter(c=>c.source?.document==='Fate_Domination-开发版/batch_saber_archer.js')).toHaveLength(7);
    for(const id of ['servant.atalanta.skill.sc-atalanta-3','servant.baobhan.skill.sc-baobhan-3']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'independent_action_rule'})])}));
    expect(slice.find(c=>c.id==='servant.astraea.skill.sc-astraea-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'restraint_condemnation_rule'})])})); expect(slice.find(c=>c.id==='servant.barghest.skill.sc-barghest-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'drawn_cards_play_lock_rule'})])}));
  });

  it('grounds the fifteen-ID Benkei/Billy/Boudica/Bradamante/Brynhildr slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards(); const ids=new Set(["servant.benkei.skill.sc-benkei-1","servant.benkei.skill.sc-benkei-2","servant.benkei.skill.sc-benkei-3","servant.billy.skill.sc-billy-1","servant.billy.skill.sc-billy-2","servant.billy.skill.sc-billy-3","servant.boudica.skill.sc-boudica-1","servant.boudica.skill.sc-boudica-2","servant.boudica.skill.sc-boudica-3","servant.bradamante.skill.sc-bradamante-1","servant.bradamante.skill.sc-bradamante-2","servant.bradamante.skill.sc-bradamante-3","servant.brynhildr.skill.sc-brynhildr-1","servant.brynhildr.skill.sc-brynhildr-2","servant.brynhildr.skill.sc-brynhildr-3"]); const slice=overlays.filter(c=>ids.has(c.id)); expect(slice).toHaveLength(15); expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256)).toBe(true);
    for(const id of ['servant.benkei.skill.sc-benkei-1','servant.bradamante.skill.sc-bradamante-1','servant.brynhildr.skill.sc-brynhildr-1']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'move_player',destinationRule:'any_location_except_workshop'})])}));
    expect(slice.find(c=>c.id==='servant.boudica.skill.sc-boudica-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'draw_cards'}),expect.objectContaining({type:'play_selected_cards'})])}));
    expect(slice.find(c=>c.id==='servant.benkei.skill.sc-benkei-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'skill_copy_lifecycle_rule'})])})); expect(slice.find(c=>c.id==='servant.brynhildr.skill.sc-brynhildr-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'love_bond_vp_rule'})])}));
  });

  it('grounds the thirteen-ID Caenis/Caligula/Carmilla/Chloe/Clytie slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards();
    const ids=new Set([
      'servant.caenis.skill.sc-caenis-1','servant.caenis.skill.sc-caenis-2','servant.caenis.skill.sc-caenis-3',
      'servant.caligula.skill.sc-caligula-2','servant.caligula.skill.sc-caligula-3',
      'servant.carmilla.skill.sc-carmilla-1','servant.carmilla.skill.sc-carmilla-2','servant.carmilla.skill.sc-carmilla-3',
      'servant.chloe.skill.sc-chloe-2','servant.chloe.skill.sc-chloe-3',
      'servant.clytie.skill.sc-clytie-1','servant.clytie.skill.sc-clytie-2','servant.clytie.skill.sc-clytie-4',
    ]);
    const slice=overlays.filter(c=>ids.has(c.id));
    expect(slice).toHaveLength(13);
    expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.caenis.skill.sc-caenis-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'caenis_poseidon_favor_rule'})])}));
    expect(slice.find(c=>c.id==='servant.caligula.skill.sc-caligula-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'caligula_madness_spread_rule'})])}));
    expect(slice.find(c=>c.id==='servant.carmilla.skill.sc-carmilla-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'carmilla_torture_rule'})])}));
    expect(slice.find(c=>c.id==='servant.chloe.skill.sc-chloe-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'chloe_kanshou_bakuya_rule'})])}));
    for(const id of ['servant.clytie.skill.sc-clytie-1','servant.clytie.skill.sc-clytie-2','servant.clytie.skill.sc-clytie-4']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'foreign_life_rule'})])}));
  });

  it('grounds the fifteen-ID Constantine/Corday/Cu/Cu Alter/Dantes slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards();
    const ids=new Set([
      'servant.constantine.skill.sc-constantine-1','servant.constantine.skill.sc-constantine-2','servant.constantine.skill.sc-constantine-3',
      'servant.corday.skill.sc-corday-1','servant.corday.skill.sc-corday-2','servant.corday.skill.sc-corday-3',
      'servant.cu-alter.skill.sc-cu-alter-1','servant.cu-alter.skill.sc-cu-alter-2','servant.cu-alter.skill.sc-cu-alter-3',
      'servant.cu.skill.sc-cu-1','servant.cu.skill.sc-cu-2','servant.cu.skill.sc-cu-np',
      'servant.dantes.skill.sc-dantes-1','servant.dantes.skill.sc-dantes-2','servant.dantes.skill.sc-dantes-3',
    ]);
    const slice=overlays.filter(c=>ids.has(c.id));
    expect(slice).toHaveLength(15);
    expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.constantine.skill.sc-constantine-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'draw_cards'}),expect.objectContaining({type:'play_selected_cards'})])}));
    expect(slice.find(c=>c.id==='servant.cu.skill.sc-cu-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'move_player',destinationRule:'any_location_except_workshop'})])}));
    expect(slice.find(c=>c.id==='servant.corday.skill.sc-corday-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'presence_concealment_assassination_rule'})])}));
    expect(slice.find(c=>c.id==='servant.cu-alter.skill.sc-cu-alter-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'cu_alter_curruid_residual_rule'})])}));
    expect(slice.find(c=>c.id==='servant.dantes.skill.sc-dantes-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'dantes_enfer_reveal_rule'})])}));
  });

  it('grounds the fifteen-ID Danzou/Darius/Diarmuid/Dioscuri/DonQuixote/Douman slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards(); const ids=new Set(["servant.danzou.skill.sc-danzou-1","servant.danzou.skill.sc-danzou-2","servant.danzou.skill.sc-danzou-3","servant.darius.skill.sc-darius-4","servant.diarmuid.skill.sc-diarmuid-2","servant.diarmuid.skill.sc-diarmuid-3","servant.dioscuri.skill.sc-dioscuri-1","servant.dioscuri.skill.sc-dioscuri-2","servant.dioscuri.skill.sc-dioscuri-3","servant.donquixote.skill.sc-donquixote-1","servant.donquixote.skill.sc-donquixote-2","servant.donquixote.skill.sc-donquixote-3","servant.douman.skill.sc-douman-1","servant.douman.skill.sc-douman-2","servant.douman.skill.sc-douman-3"]); const slice=overlays.filter(c=>ids.has(c.id)); expect(slice).toHaveLength(15);
    expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.danzou.skill.sc-danzou-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'presence_concealment_assassination_rule'})])}));
    for(const id of ['servant.diarmuid.skill.sc-diarmuid-3','servant.donquixote.skill.sc-donquixote-3']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'move_player',destinationRule:'any_location_except_workshop'})])}));
    for(const id of ['servant.dioscuri.skill.sc-dioscuri-1','servant.dioscuri.skill.sc-dioscuri-2','servant.dioscuri.skill.sc-dioscuri-3']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'dual_servant_rule'})])}));
    for(const id of ['servant.douman.skill.sc-douman-1','servant.douman.skill.sc-douman-2','servant.douman.skill.sc-douman-3']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'reverse_effect_rule'})])}));
    expect(slice.find(c=>c.id==='servant.darius.skill.sc-darius-4')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'undead_army_half_close_rule'})])}));
  });

  it('grounds the sixteen-ID Drake/Edison/Elizabeth/EMIYA/Enkidu/Ereshkigal/Frank slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards();
    const ids=new Set(["servant.drake.skill.sc-drake-1","servant.edison.skill.sc-edison-1","servant.elizabeth.skill.sc-elizabeth-1","servant.elizabeth.skill.sc-elizabeth-2","servant.elizabeth.skill.sc-elizabeth-3","servant.emiya.skill.sc-emiya-1","servant.emiya.skill.sc-emiya-2","servant.enkidu.skill.sc-enkidu-1","servant.enkidu.skill.sc-enkidu-2","servant.enkidu.skill.sc-enkidu-3","servant.ereshkigal.skill.sc-ereshkigal-1","servant.ereshkigal.skill.sc-ereshkigal-2","servant.ereshkigal.skill.sc-ereshkigal-3","servant.frank.skill.sc-frank-1","servant.frank.skill.sc-frank-2","servant.frank.skill.sc-frank-3"]);
    const slice=overlays.filter(c=>ids.has(c.id));
    expect(slice).toHaveLength(16);
    expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.drake.skill.sc-drake-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'draw_cards'}),expect.objectContaining({type:'play_selected_cards'})])}));
    for(const id of ['servant.enkidu.skill.sc-enkidu-3','servant.ereshkigal.skill.sc-ereshkigal-1']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'move_player',destinationRule:'any_location_except_workshop'})])}));
    for(const id of ['servant.elizabeth.skill.sc-elizabeth-1','servant.elizabeth.skill.sc-elizabeth-2','servant.elizabeth.skill.sc-elizabeth-3']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'volume_counter_rule'})])}));
    expect(slice.find(c=>c.id==='servant.frank.skill.sc-frank-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'prevent_elimination'}),expect.objectContaining({type:'schedule_phase_effect'})])}));
  });

  it('grounds the sixteen-ID Gareth/Georgios/Gil/Gilles/Gorgon/Hassan slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards();
    const ids=new Set(["servant.gareth.skill.sc-gareth-1","servant.gareth.skill.sc-gareth-2","servant.gareth.skill.sc-gareth-3","servant.georgios.skill.sc-georgios-1","servant.georgios.skill.sc-georgios-2","servant.georgios.skill.sc-georgios-3","servant.gil.skill.sc-gil-1","servant.gil.skill.sc-gil-2","servant.gil.skill.sc-gil-np","servant.gilles.skill.sc-gilles-1","servant.gilles.skill.sc-gilles-2","servant.gilles.skill.sc-gilles-np","servant.gorgon.skill.sc-gorgon-1","servant.hassan.skill.sc-hassan-1","servant.hassan.skill.sc-hassan-2","servant.hassan.skill.sc-hassan-np"]);
    const slice=overlays.filter(c=>ids.has(c.id));
    expect(slice).toHaveLength(16);
    expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.gil.skill.sc-gil-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'gate_of_babylon_rule',operation:'true_name_reveal_on_play_choose_x_as_mana_cost_source_gains_x_controller_chosen_non_special_attributes_action_double_controller_terrain'})])}));
    expect(slice.find(c=>c.id==='servant.hassan.skill.sc-hassan-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'presence_concealment_assassination_rule'})])}));
    expect(slice.find(c=>c.id==='servant.georgios.skill.sc-georgios-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'dragon_designation_rule'})])}));
    expect(slice.find(c=>c.id==='servant.gilles.skill.sc-gilles-np')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'placed_noble_phantasm_field_rule'})])}));
  });

  it('grounds the sixteen-ID HassanHF/HassanSer/Helena/Hephaistion/Herc/Hijikata slice from locked development snapshots and preserves the Domination Wheel ruling', () => {
    const overlays=loadSourceEvidenceOverlayCards(); const ids=new Set(["servant.hassanhf.skill.sc-hassanhf-1","servant.hassanhf.skill.sc-hassanhf-2","servant.hassanhf.skill.sc-hassanhf-3","servant.hassanser.skill.sc-hassanser-1","servant.hassanser.skill.sc-hassanser-2","servant.hassanser.skill.sc-hassanser-3","servant.helena.skill.sc-helena-2","servant.hephaistion.skill.sc-hephaistion-1","servant.hephaistion.skill.sc-hephaistion-2","servant.hephaistion.skill.sc-hephaistion-3","servant.herc.skill.sc-herc-1","servant.herc.skill.sc-herc-2","servant.herc.skill.sc-herc-3","servant.hijikata.skill.sc-hijikata-1","servant.hijikata.skill.sc-hijikata-2","servant.hijikata.skill.sc-hijikata-3"]); const slice=overlays.filter(c=>ids.has(c.id));
    expect(slice).toHaveLength(16); expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256)).toBe(true);
    for(const id of ['servant.hassanhf.skill.sc-hassanhf-3','servant.hassanser.skill.sc-hassanser-1']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'presence_concealment_assassination_rule'})])}));
    expect(slice.find(c=>c.id==='servant.hephaistion.skill.sc-hephaistion-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'draw_cards'}),expect.objectContaining({type:'play_selected_cards'})])}));
    expect(slice.find(c=>c.id==='servant.hephaistion.skill.sc-hephaistion-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'domination_wheel_command_spell_rule',operation:'true_name_reveal_combat_each_engaged_opponent_chooses_command_spell_use_and_at_least_1_command_spell_must_be_spent_unused_command_spell_use_is_allowed_then_each_engaged_opponent_who_has_not_spent_or_used_at_least_1_command_spell_this_round_closes_half_activated_attacks_rounded_up'})])}));
    for(const id of ['servant.herc.skill.sc-herc-1','servant.herc.skill.sc-herc-2','servant.herc.skill.sc-herc-3']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'twelve_labors_rule'})])}));
  });

  it('grounds the sixteen-ID Himiko/Ibaraki/Iskandar/Ivan/Izou/Jack slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards();
    const ids=new Set(["servant.himiko.skill.sc-himiko-1","servant.himiko.skill.sc-himiko-2","servant.himiko.skill.sc-himiko-3","servant.ibaraki.skill.sc-ibaraki-2","servant.ibaraki.skill.sc-ibaraki-3","servant.iskandar.skill.sc-iskandar-1","servant.iskandar.skill.sc-iskandar-np","servant.ivan.skill.sc-ivan-1","servant.ivan.skill.sc-ivan-2","servant.ivan.skill.sc-ivan-3","servant.izou.skill.sc-izou-1","servant.izou.skill.sc-izou-2","servant.izou.skill.sc-izou-3","servant.jack.skill.sc-jack-1","servant.jack.skill.sc-jack-2","servant.jack.skill.sc-jack-3"]);
    const slice=overlays.filter(c=>ids.has(c.id)); expect(slice).toHaveLength(16);
    expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256)).toBe(true);
    for(const id of ['servant.iskandar.skill.sc-iskandar-1','servant.ivan.skill.sc-ivan-3']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'draw_cards'}),expect.objectContaining({type:'play_selected_cards'})])}));
    expect(slice.find(c=>c.id==='servant.izou.skill.sc-izou-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'presence_concealment_assassination_rule'})])}));
    expect(slice.find(c=>c.id==='servant.iskandar.skill.sc-iskandar-np')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'temporary_attack_creation_rule'})])}));
    expect(slice.find(c=>c.id==='servant.himiko.skill.sc-himiko-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'oracle_choice_rule'})])}));
    expect(slice.find(c=>c.id==='servant.jack.skill.sc-jack-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'maria_the_ripper_rule'})])}));
  });

  it('grounds the fifteen-ID Jaguarman/Jeanne/JeanneAlter/Jekyll/Kagekiyo/Kama slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards(); const ids=new Set(["servant.jaguarman.skill.sc-jaguarman-1","servant.jaguarman.skill.sc-jaguarman-2","servant.jaguarman.skill.sc-jaguarman-3","servant.jeanne.skill.sc-jeanne-1","servant.jeanne.skill.sc-jeanne-2","servant.jeanne.skill.sc-jeanne-3","servant.jeanne-alter.skill.sc-jeanne-alter-1","servant.jeanne-alter.skill.sc-jeanne-alter-2","servant.jeanne-alter.skill.sc-jeanne-alter-3","servant.jekyll.skill.sc-jekyll-1","servant.jekyll.skill.sc-jekyll-2","servant.jekyll.skill.sc-jekyll-3","servant.kagekiyo.skill.sc-kagekiyo-1","servant.kagekiyo.skill.sc-kagekiyo-3","servant.kama.skill.sc-kama-3"]); const slice=overlays.filter(c=>ids.has(c.id)); expect(slice).toHaveLength(15);
    expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256 && c.source.sourceFileSha256.length===64)).toBe(true);
    expect(slice.find(c=>c.id==='servant.jaguarman.skill.sc-jaguarman-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'move_player',destinationRule:'any_location_except_workshop'})])}));
    for(const id of ['servant.jekyll.skill.sc-jekyll-3','servant.kama.skill.sc-kama-3']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'presence_concealment_assassination_rule'})])}));
    expect(slice.find(c=>c.id==='servant.jeanne.skill.sc-jeanne-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'ruler_command_spell_binding_rule'})])}));
    expect(slice.find(c=>c.id==='servant.jeanne-alter.skill.sc-jeanne-alter-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'avenger_movement_vp_rule'})])}));
    expect(slice.find(c=>c.id==='servant.kagekiyo.skill.sc-kagekiyo-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'kagekiyo_hidden_attack_noble_phantasm_rule'})])}));
  });

  it('grounds the sixteen-ID Karna/KingGil/KingHassan/Kingprotea/Kintoki/Kiritsugu slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards(); const ids=new Set(["servant.karna.skill.sc-karna-1","servant.karna.skill.sc-karna-2","servant.karna.skill.sc-karna-3","servant.kinggil.skill.sc-kinggil-1","servant.kinggil.skill.sc-kinggil-2","servant.kinggil.skill.sc-kinggil-3","servant.kinghassan.skill.sc-kinghassan-1","servant.kinghassan.skill.sc-kinghassan-2","servant.kinghassan.skill.sc-kinghassan-3","servant.kingprotea.skill.sc-kingprotea-1","servant.kingprotea.skill.sc-kingprotea-2","servant.kingprotea.skill.sc-kingprotea-3","servant.kintoki.skill.sc-kintoki-1","servant.kintoki.skill.sc-kintoki-2","servant.kintoki.skill.sc-kintoki-3","servant.kiritsugu.skill.sc-kiritsugu-1"]); const slice=overlays.filter(c=>ids.has(c.id)); expect(slice).toHaveLength(16);
    expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256 && c.source.sourceFileSha256.length===64)).toBe(true);
    expect(slice.find(c=>c.id==='servant.kiritsugu.skill.sc-kiritsugu-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'presence_concealment_assassination_rule'})])}));
    for(const id of ['servant.kinghassan.skill.sc-kinghassan-1','servant.kinghassan.skill.sc-kinghassan-2','servant.kinghassan.skill.sc-kinghassan-3']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'azrael_rule'})])}));
    for(const id of ['servant.kingprotea.skill.sc-kingprotea-1','servant.kingprotea.skill.sc-kingprotea-2','servant.kingprotea.skill.sc-kingprotea-3']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'kingprotea_growth_rule'})])}));
    for(const id of ['servant.kintoki.skill.sc-kintoki-1','servant.kintoki.skill.sc-kintoki-2']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'kintoki_golden_spark_rule'})])}));
  });

  it('grounds the fifteen-ID Kiyohime/Kotarou/Koyo/Kriemhild/LadyAvalon slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards(); const ids=new Set(["servant.kiyohime.skill.sc-kiyohime-1","servant.kiyohime.skill.sc-kiyohime-2","servant.kiyohime.skill.sc-kiyohime-3","servant.kotarou.skill.sc-kotarou-1","servant.kotarou.skill.sc-kotarou-2","servant.kotarou.skill.sc-kotarou-3","servant.koyo.skill.sc-koyo-1","servant.koyo.skill.sc-koyo-2","servant.koyo.skill.sc-koyo-3","servant.kriemhild.skill.sc-kriemhild-1","servant.kriemhild.skill.sc-kriemhild-2","servant.kriemhild.skill.sc-kriemhild-3","servant.ladyavalon.skill.sc-ladyavalon-1","servant.ladyavalon.skill.sc-ladyavalon-2","servant.ladyavalon.skill.sc-ladyavalon-3"]); const slice=overlays.filter(c=>ids.has(c.id));
    expect(slice).toHaveLength(15); expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256)).toBe(true);
    expect(slice.find(c=>c.id==='servant.kotarou.skill.sc-kotarou-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'presence_concealment_assassination_rule'})])}));
    expect(slice.find(c=>c.id==='servant.ladyavalon.skill.sc-ladyavalon-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'territory_construction_scaling_rule'})])}));
    expect(slice.find(c=>c.id==='servant.kriemhild.skill.sc-kriemhild-1')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'kriemhild_rhine_gold_rule'})])}));
  });

  it('grounds the sixteen-ID Lance/Leonidas/LionKing/LiShuwen/Lobo/LuBu slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards();
    const ids=new Set(["servant.lance.skill.sc-lance-1","servant.lance.skill.sc-lance-2","servant.lance.skill.sc-lance-3","servant.leonidas.skill.sc-leonidas-2","servant.leonidas.skill.sc-leonidas-3","servant.lionking.skill.sc-lionking-1","servant.lionking.skill.sc-lionking-2","servant.lishuwen.skill.sc-lishuwen-1","servant.lishuwen.skill.sc-lishuwen-2","servant.lishuwen.skill.sc-lishuwen-3","servant.lobo.skill.sc-lobo-1","servant.lobo.skill.sc-lobo-2","servant.lobo.skill.sc-lobo-3","servant.lubu.skill.sc-lubu-1","servant.lubu.skill.sc-lubu-2","servant.lubu.skill.sc-lubu-3"]);
    const slice=overlays.filter(c=>ids.has(c.id)); expect(slice).toHaveLength(16);
    expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256 && c.source.sourceFileSha256.length===64)).toBe(true);
    expect(slice.find(c=>c.id==='servant.lishuwen.skill.sc-lishuwen-3')?.abilities).toContainEqual(expect.objectContaining({activation:{phase:'action'},effects:expect.arrayContaining([expect.objectContaining({type:'move_player',scope:'controller',destinationRule:'any_location_except_workshop'})])}));
    expect(slice.find(c=>c.id==='servant.lance.skill.sc-lance-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'temporary_card_copy_rule'})])}));
    expect(slice.find(c=>c.id==='servant.lionking.skill.sc-lionking-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'alternate_vp_cost_mount_rule'})])}));
    expect(slice.find(c=>c.id==='servant.lobo.skill.sc-lobo-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'death_entangle_forced_move_rule'})])}));
    expect(slice.find(c=>c.id==='servant.lubu.skill.sc-lubu-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'noble_weapon_power_transform_rule'})])}));
  });

  it('grounds the fifteen-ID Mandricardo/Maxwell/MechaEli/Medb/Medea/Medusa slice from locked development snapshots', () => {
    const overlays=loadSourceEvidenceOverlayCards(); const ids=new Set(["servant.mandricardo.skill.sc-mandricardo-1","servant.mandricardo.skill.sc-mandricardo-2","servant.mandricardo.skill.sc-mandricardo-3","servant.maxwell.skill.sc-maxwell-1","servant.maxwell.skill.sc-maxwell-2","servant.maxwell.skill.sc-maxwell-3","servant.mechaeli.skill.sc-mechaeli-1","servant.mechaeli.skill.sc-mechaeli-3","servant.medb.skill.sc-medb-1","servant.medb.skill.sc-medb-2","servant.medb.skill.sc-medb-3","servant.medea.skill.sc-medea-1","servant.medea.skill.sc-medea-2","servant.medea.skill.sc-medea-np","servant.medusa.skill.sc-medusa-1"]); const slice=overlays.filter(c=>ids.has(c.id)); expect(slice).toHaveLength(15);
    expect(slice.every(c=>c.source?.authority==='DEVELOPMENT_TEXT' && c.source.sourceText===c.printedText && c.source.sourceTextSha256===c.referencePrintedTextSha256 && c.source.sourceFileSha256.length===64)).toBe(true);
    for(const id of ['servant.mandricardo.skill.sc-mandricardo-3','servant.medb.skill.sc-medb-1','servant.medusa.skill.sc-medusa-1']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'draw_cards'}),expect.objectContaining({type:'play_selected_cards'})])}));
    expect(slice.find(c=>c.id==='servant.mandricardo.skill.sc-mandricardo-2')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'noop'})])}));
    for(const id of ['servant.maxwell.skill.sc-maxwell-1','servant.medea.skill.sc-medea-2']) expect(slice.find(c=>c.id===id)?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'territory_construction_scaling_rule'})])}));
    expect(slice.find(c=>c.id==='servant.medb.skill.sc-medb-3')?.abilities).toContainEqual(expect.objectContaining({effects:expect.arrayContaining([expect.objectContaining({type:'medb_submission_deployment_rule'})])}));
  });

  it('fails closed when external evidence no longer binds to the exact locked Reference printed text', () => {
    const inventory = makeInventory();
    const entry = inventory.staticSkills[0];
    const external: StructuredAuthoringCard = {
      id: entry.canonicalAbilityId,
      printedText: 'Authoritative English rule text.',
      referencePrintedTextSha256: createHash('sha256').update(entry.printedText, 'utf8').digest('hex'),
      source: {
        authority: 'FATE_DOMINATION_WIKI',
        document: 'Fate/Domination Wiki',
        locator: 'Fixture#Cards/Test',
        url: 'https://fatedomination.fandom.com/wiki/Fixture',
      },
      abilities: [{
        id: 'fixture.external',
        printedClause: 'Action: Gain 1 mana.',
        kind: 'phase_action',
        activation: { phase: 'action' },
        effects: [{ type: 'gain_mana', amount: 1 }],
      }],
    };

    expect(
      normalizeFullRosterSemantics(inventory, [external]).staticSkills[0].semanticNormalization.status,
    ).toBe('SOURCE_GROUNDED');

    external.referencePrintedTextSha256 = '0'.repeat(64);
    const rejected = normalizeFullRosterSemantics(inventory, [external]).staticSkills[0].semanticNormalization;
    expect(rejected.status).toBe('BLOCKED');
    expect(rejected.blocks).toContain('SEMANTIC_SOURCE_CONFLICT');
  });

  it('keeps the checked-in full-roster JSON and Markdown matrix count-identical with zero unclassified identities', () => {
    const inventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as {
      semanticSummary: {
        totalIdentityCount: number;
        sourceGroundedCount: number;
        blockedCount: number;
        unclassifiedCount: number;
        structuredAbilityCount: number;
      };
      staticSkills: Array<{ semanticNormalization?: { status?: string } }>;
      dynamicSkills: Array<{ semanticNormalization?: { status?: string } }>;
    };
    const markdown = readFileSync(
      resolve('docs/audits/fd-full-roster-semantic-axis-matrix.md'),
      'utf8',
    );

    expect(inventory.semanticSummary).toEqual({
      totalIdentityCount: 944,
      sourceGroundedCount: 798,
      blockedCount: 146,
      unclassifiedCount: 0,
      structuredAbilityCount: 1076,
    });
    expect([...inventory.staticSkills, ...inventory.dynamicSkills]).toHaveLength(944);
    expect(
      [...inventory.staticSkills, ...inventory.dynamicSkills].every(
        (entry) =>
          entry.semanticNormalization?.status === 'SOURCE_GROUNDED' ||
          entry.semanticNormalization?.status === 'BLOCKED',
      ),
    ).toBe(true);
    for (const [key, value] of Object.entries(inventory.semanticSummary)) {
      expect(markdown).toContain(`${key}=${value}`);
    }
  });
});
