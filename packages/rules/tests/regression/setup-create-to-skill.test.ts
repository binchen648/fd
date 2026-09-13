import { describe, expect, it } from 'vitest';

import {
  executeResolution,
  normalizeResolutionDataFlowNodes,
  ResolutionRuntimeError,
} from '../../src/ability/resolution-dataflow';
import {
  isSetupCreateToSkillTrigger,
  processAbilityEvent,
} from '../../src/ability/interpreter';
import type { AuthoringAbility } from '../../src/ability/types';
import { createMatchSession } from '../../src/match-session';

const humanPlayerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];

function session() {
  return createMatchSession({ seed: 20260914, humanPlayerIds });
}

function sourceFor(s: ReturnType<typeof session>, definitionId: string) {
  const source = s.state.cards.find((card) => card.definitionId === definitionId)!;
  expect(source).toBeTruthy();
  return source;
}

function generatedFor(s: ReturnType<typeof session>, definitionId: string) {
  const card = s.state.cards.find((candidate) => candidate.definitionId === definitionId)!;
  expect(card).toBeTruthy();
  return card;
}

function setupAbility(cardId: string, zone: 'skill' | 'deck'): AuthoringAbility {
  return {
    id: 'renamed-setup-create',
    kind: 'forced_trigger',
    printedClause: '',
    activation: { trigger: 'game_start' },
    conditions: [],
    targets: [],
    effects: [{ type: 'create_card', cardId, to: { zone, owner: 'controller' } }],
    cost: [],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

describe('SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL recovery', () => {
  it('creates all three canonical game-start cards in skill with source provenance', () => {
    const s = session();
    const cases = [
      ['master.maiya.skill.military', 'master.maiya.deck.support-shot', 'military.has-support-shot'],
      ['master.olga-marie.skill.astronomical-science', 'master.olga-marie.skill.chaldeas', 'astronomical-science.has-chaldeas'],
      ['master.shinji.skill.useless-person', 'master.shinji.skill.false-attendant-book', 'useless-person.setup'],
    ] as const;

    for (const [sourceDefinitionId, createdDefinitionId, abilityId] of cases) {
      const source = sourceFor(s, sourceDefinitionId);
      const created = generatedFor(s, createdDefinitionId);
      expect(created).toMatchObject({
        ownerPlayerId: source.controllerPlayerId,
        controllerPlayerId: source.controllerPlayerId,
        zone: 'skill',
        visibility: { scope: 'owner_only', ownerPlayerId: source.controllerPlayerId },
        generatedBy: source.instanceId,
      });
      expect(s.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
        type: 'card_created',
        playerId: source.controllerPlayerId,
        sourceCardId: source.instanceId,
        abilityId,
      }));
      expect(s.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
        type: 'effect_resolved',
        sourceCardId: source.instanceId,
        abilityId,
      }));
    }
  });

  it('routes an arbitrary compiled card id with the same legal semantic shape', () => {
    const s = session();
    const military = sourceFor(s, 'master.maiya.skill.military');
    const runtime = s.state.abilityRuntime!;
    const sourceDefinition = runtime.pack.cards[military.definitionId]!;
    const ability = sourceDefinition.abilities.find((candidate) => candidate.id === 'military.has-support-shot')!;
    const supportDefinition = runtime.pack.cards['master.maiya.deck.support-shot']!;
    const arbitraryId = 'fixture.b10-arbitrary-created';
    (runtime.pack.cards as Record<string, typeof supportDefinition>)[arbitraryId] = {
      ...structuredClone(supportDefinition),
      id: arbitraryId,
    };
    ability.effects[0]!.cardId = arbitraryId;

    processAbilityEvent(s.state, { id: 'b10-arbitrary-game-start', type: 'game_start' });

    expect(s.state.cards).toContainEqual(expect.objectContaining({
      definitionId: arbitraryId,
      ownerPlayerId: military.controllerPlayerId,
      controllerPlayerId: military.controllerPlayerId,
      zone: 'skill',
      generatedBy: military.instanceId,
    }));
    expect(s.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'card_created',
      sourceCardId: military.instanceId,
      abilityId: 'military.has-support-shot',
    }));
  });

  it('classifies by semantic axes: card.luck can route to skill while the Artoria Caster deck form stays excluded', () => {
    const createLuckToSkill = setupAbility('card.luck', 'skill');
    const createLuckToDeck = setupAbility('card.luck', 'deck');
    const arbitraryToSkill = setupAbility('fixture.any-valid-card', 'skill');
    const wrongTrigger = structuredClone(arbitraryToSkill);
    wrongTrigger.activation.trigger = 'after_controller_wins_battle';

    expect(isSetupCreateToSkillTrigger(createLuckToSkill)).toBe(true);
    expect(isSetupCreateToSkillTrigger(arbitraryToSkill)).toBe(true);
    expect(isSetupCreateToSkillTrigger(createLuckToDeck)).toBe(false);
    expect(isSetupCreateToSkillTrigger(wrongTrigger)).toBe(false);
  });

  it('treats a same-source duplicate as an idempotent no-op', () => {
    const s = session();
    const military = sourceFor(s, 'master.maiya.skill.military');
    const before = s.state.cards.filter((card) => card.definitionId === 'master.maiya.deck.support-shot');
    expect(before).toHaveLength(1);
    expect(before[0]!.generatedBy).toBe(military.instanceId);
    const createdEventsBefore = s.state.abilityRuntime!.events.filter((event) =>
      event.type === 'card_created' && event.sourceCardId === military.instanceId).length;

    processAbilityEvent(s.state, { id: 'b10-idempotent-game-start', type: 'game_start' });

    expect(s.state.cards.filter((card) => card.definitionId === 'master.maiya.deck.support-shot')).toHaveLength(1);
    expect(s.state.abilityRuntime!.events.filter((event) =>
      event.type === 'card_created' && event.sourceCardId === military.instanceId)).toHaveLength(createdEventsBefore);
  });

  it.each([
    ['missing provenance', undefined],
    ['different provenance', 'other-source-card'],
  ] as const)('returns duplicate_created_card internally for %s without mutating the input state', (_label, generatedBy) => {
    const s = session();
    const military = sourceFor(s, 'master.maiya.skill.military');
    const support = generatedFor(s, 'master.maiya.deck.support-shot');
    support.generatedBy = generatedBy;
    const ability = s.state.abilityRuntime!.pack.cards[military.definitionId]!.abilities
      .find((candidate) => candidate.id === 'military.has-support-shot')!;
    const effects = normalizeResolutionDataFlowNodes(ability.effects, 'b10.duplicate.effects');
    const snapshot = structuredClone(s.state);

    let thrown: unknown;
    try {
      executeResolution({
        state: s.state,
        controllerId: military.controllerPlayerId,
        sourceCardId: military.instanceId,
        abilityId: ability.id,
        effects,
        resolutionId: 'b10-duplicate-resolution',
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ResolutionRuntimeError);
    expect((thrown as ResolutionRuntimeError).code).toBe('duplicate_created_card');
    expect(s.state).toEqual(snapshot);
  });

  it.each([
    ['missing provenance', undefined],
    ['different provenance', 'other-source-card'],
  ] as const)('fails the trusted game-start transaction atomically for %s', (_label, generatedBy) => {
    const s = session();
    const support = generatedFor(s, 'master.maiya.deck.support-shot');
    support.generatedBy = generatedBy;
    const snapshot = structuredClone(s.state);

    expect(() => processAbilityEvent(s.state, {
      id: `b10-fail-closed-${_label}`,
      type: 'game_start',
    })).toThrow(/incompatible creation provenance/);

    expect(s.state).toEqual(snapshot);
  });
});
