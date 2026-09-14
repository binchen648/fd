import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type {
  FullRosterAbilityInventory,
  FullRosterStaticSkillEntry,
} from '../phase3-reference/inventory-schema';
import {
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
      sourceGroundedCount: 72,
      blockedCount: 872,
      unclassifiedCount: 0,
      structuredAbilityCount: 117,
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
