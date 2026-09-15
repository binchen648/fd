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

  it('accepts only the allowed Fate/Domination Wiki overlay and keeps Chaos Scrambled Seals unresolved', () => {
    const overlays = loadSourceEvidenceOverlayCards();
    const chaos = overlays.filter((card) => card.id.startsWith('master.chaos.skill.'));
    const ids = chaos.map((card) => card.id);
    expect(chaos).toHaveLength(17);
    expect(ids).toContain('master.chaos.skill.s1');
    expect(ids).toContain('master.chaos.skill.s16');
    expect(ids).toContain('master.chaos.skill.ascension');
    expect(ids).not.toContain('master.chaos.skill.s17');
    expect(
      chaos.every((card) => card.source?.url.startsWith('https://fatedomination.fandom.com/wiki/')),
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
      referencePrintedTextSha256: 'b'.repeat(64),
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
      badDocument.source.document = 'Fate_Domination-开发版/index.html';
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
      sourceGroundedCount: 162,
      blockedCount: 782,
      unclassifiedCount: 0,
      structuredAbilityCount: 306,
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
