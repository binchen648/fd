import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityDefinitionPack, AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../src/ability/types';

const validEffect: RuleNode = {
  type: 'return_card_by_definition',
  target: 'controller',
  definitionId: 'skill.returned',
  destination: 'master-skills',
  createIfMissing: true,
  face: 'up',
  active: false,
};

function ability(effect: RuleNode = validEffect, kind = 'forced_trigger'): AuthoringAbility {
  return {
    id: 'restore', kind, printedClause: 'synthetic structural proof', activation: kind === 'phase_action' ? { phase: 'action' } : {},
    conditions: [], targets: [], effects: [effect], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function card(id: string, ownerId: string, abilities: AuthoringAbility[]): ExecutableCardDefinition {
  return {
    id, name: id, cardType: 'master_skill', ownerId, cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [] },
    playTiming: {}, playRequirements: [], abilities, mode: 'automatic', playKind: 'support', destinationZone: 'field',
  };
}

function setup(effect: RuleNode = validEffect, kind = 'forced_trigger') {
  const state = createSeededGameState();
  state.cards = [{
    instanceId: 'source', definitionId: 'skill.source', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  state.players[0]!.masterCardId = 'master.synthetic';
  const source = card('skill.source', 'master.synthetic', [ability(effect, kind)]);
  const target = card('skill.returned', 'master.synthetic', []);
  const pack: AbilityDefinitionPack = { cards: { [source.id]: source, [target.id]: target } };
  rules.initializeAbilityRuntime(state, pack, { seed: 20260919 });
  return { state, pack };
}

function context(): rules.EffectContext {
  return { controllerId: 'p1', sourceCardId: 'source', abilityId: 'restore', variables: {}, selections: {} };
}

describe('P3-FB2-30 controller master-skill definition return component', () => {
  it('recognizes only the exact identity-free structural shape', () => {
    expect(rules.isControllerMasterSkillDefinitionReturnComponent(validEffect)).toBe(true);
    expect(rules.isControllerMasterSkillDefinitionReturnComponent({ ...validEffect, definitionId: undefined, linkedSkillId: 'skill.returned' })).toBe(true);
    expect(rules.isControllerMasterSkillDefinitionReturnComponent({ ...validEffect, target: 'opponent' })).toBe(false);
    expect(rules.isControllerMasterSkillDefinitionReturnComponent({ ...validEffect, destination: 'hand' })).toBe(false);
    expect(rules.isControllerMasterSkillDefinitionReturnComponent({ ...validEffect, active: true })).toBe(false);
    expect(rules.isControllerMasterSkillDefinitionReturnComponent({ ...validEffect, linkedSkillId: 'skill.returned' })).toBe(false);
    expect(rules.isControllerMasterSkillDefinitionReturnComponent({ ...validEffect, ownerName: 'forbidden-identity' })).toBe(false);
  });

  it('returns the same physical target to skill and normalizes owner/controller/visibility/state', () => {
    const { state } = setup();
    state.cards.push({
      instanceId: 'target-physical', definitionId: 'skill.returned', ownerPlayerId: 'p1', controllerPlayerId: 'p2',
      zone: 'removed_from_game', visibility: { scope: 'public' },
    });
    state.abilityRuntime!.cardState['target-physical'] = { active: true, faceDown: true, playedRound: 1, reversed: true, attributeOverrides: ['x'] };
    rules.resolveEffect(state, context(), validEffect);
    expect(state.cards.filter((entry) => entry.definitionId === 'skill.returned')).toHaveLength(1);
    expect(state.cards.find((entry) => entry.instanceId === 'target-physical')).toMatchObject({
      ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    expect(state.abilityRuntime!.cardState['target-physical']).toMatchObject({ active: false, faceDown: false });
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'card_returned_by_definition', cardInstanceId: 'target-physical', fromZone: 'removed_from_game', toZone: 'skill', movedCount: 1,
    }));
  });

  it('materializes exactly one physical target when missing and supports linkedSkillId structurally', () => {
    const effect = { ...validEffect } as Record<string, unknown>;
    delete effect.definitionId;
    effect.linkedSkillId = 'skill.returned';
    const { state } = setup(effect);
    rules.resolveEffect(state, context(), effect);
    const targets = state.cards.filter((entry) => entry.definitionId === 'skill.returned');
    expect(targets).toHaveLength(1);
    expect(targets[0]).toMatchObject({ ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', generatedBy: 'source' });
    expect(state.abilityRuntime!.cardState[targets[0]!.instanceId]).toMatchObject({ active: false, faceDown: false });
  });

  it('fails closed before mutation on duplicates, wrong owner/type, or malformed near-matches', () => {
    const { state } = setup();
    state.cards.push(
      { instanceId: 'target-a', definitionId: 'skill.returned', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'removed_from_game', visibility: { scope: 'public' } },
      { instanceId: 'target-b', definitionId: 'skill.returned', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'discard', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    );
    const before = structuredClone(state);
    expect(() => rules.resolveEffect(state, context(), validEffect)).toThrow(/duplicate controller-owned physical instances/i);
    expect(state).toEqual(before);

    const wrong = setup();
    (wrong.state.abilityRuntime!.pack.cards['skill.returned'] as ExecutableCardDefinition).ownerId = 'master.other';
    const wrongBefore = structuredClone(wrong.state);
    expect(() => rules.resolveEffect(wrong.state, context(), validEffect)).toThrow(/controller-owned master_skill/i);
    expect(wrong.state).toEqual(wrongBefore);

    const malformed = setup({ ...validEffect, createIfMissing: false });
    const malformedBefore = structuredClone(malformed.state);
    expect(() => rules.resolveEffect(malformed.state, context(), { ...validEffect, createIfMissing: false })).toThrow(/component shape/i);
    expect(malformed.state).toEqual(malformedBefore);
  });

  it('rejects stale or invalid source context transactionally before target mutation', () => {
    const cases: Array<{ label: string; mutate: (state: ReturnType<typeof setup>['state']) => void }> = [
      {
        label: 'wrong source definition owner',
        mutate: (state) => { (state.abilityRuntime!.pack.cards['skill.source'] as ExecutableCardDefinition).ownerId = 'master.other'; },
      },
      {
        label: 'wrong source definition type',
        mutate: (state) => { (state.abilityRuntime!.pack.cards['skill.source'] as ExecutableCardDefinition).cardType = 'servant_skill'; },
      },
      {
        label: 'stale source zone',
        mutate: (state) => { state.cards.find((entry) => entry.instanceId === 'source')!.zone = 'discard'; },
      },
    ];

    for (const testCase of cases) {
      const { state } = setup();
      testCase.mutate(state);
      const before = structuredClone(state);
      expect(() => rules.resolveEffect(state, context(), validEffect), testCase.label).toThrow(/current controller-owned master_skill in the skill zone/i);
      expect(state, testCase.label).toEqual(before);
      expect(state.cards.filter((entry) => entry.definitionId === 'skill.returned'), testCase.label).toHaveLength(0);
    }
  });

  it('does not expose an unsupported parent route merely because the component exists', () => {
    const { state } = setup(validEffect, 'phase_action');
    state.round.activePhase = 'action';
    expect(rules.getLegalActions(state, 'p1')).not.toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: 'source', abilityId: 'restore' }));
    expect(() => rules.executeAbility(state, context())).toThrow(/independently accepted parent route/i);
  });

  it('recursively blocks nested and creates placements from trigger discovery and direct execution', () => {
    const placements: Array<{ label: string; effects: RuleNode[]; creates: RuleNode[] }> = [
      {
        label: 'branch descendant',
        effects: [{ type: 'branch', branches: [{ else: [validEffect] }] }],
        creates: [],
      },
      {
        label: 'creates container',
        effects: [],
        creates: [validEffect],
      },
    ];

    for (const placement of placements) {
      const { state } = setup();
      const sourceDefinition = state.abilityRuntime!.pack.cards['skill.source'] as ExecutableCardDefinition;
      const authored = sourceDefinition.abilities[0]!;
      authored.kind = 'forced_trigger';
      authored.activation = { trigger: 'game_start' };
      authored.effects = placement.effects;
      authored.creates = placement.creates;

      expect(rules.collectTriggeredAbilities(state, { id: `probe-${placement.label}`, type: 'game_start' }), placement.label).toEqual([]);
      const before = structuredClone(state);
      expect(() => rules.executeAbility(state, context()), placement.label).toThrow(/independently accepted parent route/i);
      expect(state, placement.label).toEqual(before);
      expect(state.cards.filter((entry) => entry.definitionId === 'skill.returned'), placement.label).toHaveLength(0);
    }
  });

  it('loader accepts the exact shape and rejects malformed sibling shapes', () => {
    const archive = {
      schemaVersion: 'fd-card-authoring-v1', id: 'master.synthetic', name: 'synthetic', cards: [{
        id: 'skill.source', name: 'source', cardType: 'master_skill', cardFace: { typeLabel: 'passive', cost: 0, basePower: 0, attributes: [], requirement: { type: 'none' } },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [ability()],
      }],
    };
    expect(rules.loadAuthoringJson(archive).report).toEqual([]);
    const malformed = structuredClone(archive);
    malformed.cards[0]!.abilities[0]!.effects[0]!.destination = 'hand';
    expect(rules.loadAuthoringJson(malformed).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Unsupported controller master-skill definition-return shape' }),
    ]));
  });
});