import { describe, expect, it } from 'vitest';

import { isSetupCreateToSkillSemantic, processAbilityEvent } from '../../src/ability/interpreter';
import type { AuthoringAbility } from '../../src/ability/types';
import { createMatchSession } from '../../src/match-session';

const ELIGIBLE = [
  ['master.maiya', 'master.maiya.skill.military', 'military.has-support-shot', 'master.maiya.deck.support-shot'],
  ['master.olga-marie', 'master.olga-marie.skill.astronomical-science', 'astronomical-science.has-chaldeas', 'master.olga-marie.skill.chaldeas'],
  ['master.shinji', 'master.shinji.skill.useless-person', 'useless-person.setup', 'master.shinji.skill.false-attendant-book'],
] as const;

function session() {
  return createMatchSession({ seed: 20260922, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
}

function setupSource(current: ReturnType<typeof session>, masterId: string, definitionId: string) {
  const pairing = current.pairings.find((candidate) => candidate.master.id === masterId)!;
  const source = current.state.cards.find((card) => card.ownerPlayerId === pairing.playerId && card.definitionId === definitionId)!;
  return { playerId: pairing.playerId, source };
}

function exactAbility(cardId = 'master.maiya.deck.support-shot'): AuthoringAbility {
  return {
    id: 'renamed.setup', kind: 'forced_trigger', printedClause: '', activation: { trigger: 'game_start' },
    conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [],
    effects: [{ type: 'create_card', cardId, to: { zone: 'skill' } }],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

describe('P3 setup create-to-skill current-lineage alignment', () => {
  it.each(ELIGIBLE)('uses typed setup creation for %s / %s', (masterId, sourceDefinitionId, abilityId, targetDefinitionId) => {
    const current = session();
    const { playerId, source } = setupSource(current, masterId, sourceDefinitionId);
    const created = current.state.cards.filter((card) => card.ownerPlayerId === playerId && card.definitionId === targetDefinitionId);

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      controllerPlayerId: playerId,
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: playerId },
      generatedBy: source.instanceId,
    });
    expect(current.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'card_created', sourceCardId: source.instanceId, abilityId, cardInstanceId: created[0]!.instanceId,
      resultId: expect.any(String),
    }));
  });

  it('routes by exact semantic shape and not card or ability identity', () => {
    const exact = exactAbility('card.luck');
    expect(isSetupCreateToSkillSemantic(exact)).toBe(true);

    const variants: AuthoringAbility[] = [
      { ...structuredClone(exact), kind: 'optional_trigger' },
      { ...structuredClone(exact), activation: { trigger: 'after_controller_wins_battle' } },
      { ...structuredClone(exact), conditions: [{ type: 'controller_at_battlefield' }] },
      { ...structuredClone(exact), targets: [{ id: 'target', type: 'player' }] },
      { ...structuredClone(exact), cost: [{ type: 'pay_mana', amount: 1 }] },
      { ...structuredClone(exact), creates: [{ type: 'create_card', cardId: 'card.luck', to: { zone: 'deck' } }] },
      { ...structuredClone(exact), effects: [...exact.effects, { type: 'shuffle_deck' }] },
      { ...structuredClone(exact), execution: { mode: 'host_adjudicated', allowedOperations: [] } },
    ];
    const wrongZone = structuredClone(exact);
    wrongZone.effects[0]!.to = { zone: 'deck' };
    const nested = structuredClone(exact);
    nested.effects[0]!.then = [{ type: 'draw_cards', count: 1 }];
    variants.push(wrongZone, nested);

    for (const ability of variants) expect(isSetupCreateToSkillSemantic(ability)).toBe(false);
  });

  it('replaying the authoritative game-start occurrence is a mutation-free no-op', () => {
    const current = session();
    const before = JSON.stringify(current.state);
    processAbilityEvent(current.state, { id: 'match-session-game-start', type: 'game_start' });
    expect(JSON.stringify(current.state)).toBe(before);
  });

  it('treats a distinct repeated setup occurrence as a provenance-bound creation no-op', () => {
    const current = session();
    const targetIds = new Set<string>(ELIGIBLE.map((entry) => entry[3]));
    const abilityIds = new Set<string>(ELIGIBLE.map((entry) => entry[2]));
    const beforeCards = current.state.cards.filter((card) => targetIds.has(card.definitionId)).map((card) => card.instanceId);
    const beforeCreatedEvents = current.state.abilityRuntime!.events.filter((event) =>
      event.type === 'card_created' && abilityIds.has(event.abilityId ?? ''));

    processAbilityEvent(current.state, { id: 'distinct-repeated-game-start', type: 'game_start' });

    expect(current.state.cards.filter((card) => targetIds.has(card.definitionId)).map((card) => card.instanceId)).toEqual(beforeCards);
    expect(current.state.abilityRuntime!.events.filter((event) =>
      event.type === 'card_created' && abilityIds.has(event.abilityId ?? ''))).toEqual(beforeCreatedEvents);
  });

  it.each([undefined, 'wrong-source'])('rejects duplicate material with non-matching provenance atomically', (generatedBy) => {
    const current = session();
    const { playerId } = setupSource(current, 'master.shinji', 'master.shinji.skill.useless-person');
    const created = current.state.cards.find((card) => card.ownerPlayerId === playerId && card.definitionId === 'master.shinji.skill.false-attendant-book')!;
    if (generatedBy === undefined) delete created.generatedBy;
    else created.generatedBy = generatedBy;
    const before = JSON.stringify(current.state);

    expect(() => processAbilityEvent(current.state, { id: `duplicate-provenance-${generatedBy ?? 'missing'}`, type: 'game_start' }))
      .toThrow(/duplicate_created_card|matching provenance/i);
    expect(JSON.stringify(current.state)).toBe(before);
  });

  it.each(['duplicate', 'wrong-owner', 'coordinated-identity', 'public', 'active', 'face-down', 'future-round', 'missing-card-state'] as const)('rejects non-canonical existing setup material (%s) atomically', (variant) => {
    const current = session();
    const { playerId } = setupSource(current, 'master.shinji', 'master.shinji.skill.useless-person');
    const created = current.state.cards.find((card) => card.ownerPlayerId === playerId && card.definitionId === 'master.shinji.skill.false-attendant-book')!;
    if (variant === 'duplicate') {
      const duplicate = { ...structuredClone(created), instanceId: `${created.instanceId}.duplicate` };
      current.state.cards.push(duplicate);
      current.state.abilityRuntime!.cardState[duplicate.instanceId] = structuredClone(current.state.abilityRuntime!.cardState[created.instanceId]!);
    } else if (variant === 'wrong-owner') {
      created.ownerPlayerId = 'p7' === playerId ? 'p6' : 'p7';
    } else if (variant === 'coordinated-identity') {
      const foreignPlayerId = 'p7' === playerId ? 'p6' : 'p7';
      created.ownerPlayerId = foreignPlayerId;
      created.controllerPlayerId = foreignPlayerId;
      created.generatedBy = 'unrelated-source';
    } else if (variant === 'public') {
      created.visibility = { scope: 'public' };
    } else if (variant === 'active') {
      current.state.abilityRuntime!.cardState[created.instanceId]!.active = true;
    } else if (variant === 'face-down') {
      current.state.abilityRuntime!.cardState[created.instanceId]!.faceDown = true;
    } else if (variant === 'future-round') {
      current.state.abilityRuntime!.cardState[created.instanceId]!.playedRound = current.state.round.roundNumber + 99;
    } else {
      delete current.state.abilityRuntime!.cardState[created.instanceId];
    }
    const before = JSON.stringify(current.state);

    expect(() => processAbilityEvent(current.state, { id: `non-canonical-${variant}`, type: 'game_start' }))
      .toThrow(/duplicate_created_card|matching provenance/i);
    expect(JSON.stringify(current.state)).toBe(before);
  });

  it('rejects a non-master-skill target definition before any card is created', () => {
    const current = session();
    const definition = current.state.abilityRuntime!.pack.cards['master.maiya.skill.military']!;
    const ability = definition.abilities.find((candidate) => candidate.id === 'military.has-support-shot')!;
    ability.effects[0]!.cardId = 'basic.strength.1';
    const before = JSON.stringify(current.state);

    expect(() => processAbilityEvent(current.state, { id: 'invalid-setup-target-definition', type: 'game_start' }))
      .toThrow(/invalid_setup_source|resolution_failed|canonical/i);
    expect(JSON.stringify(current.state)).toBe(before);
  });

  it.each(['source-hand', 'source-wrong-owner', 'source-wrong-controller', 'source-definition-owner', 'source-missing-card-state'] as const)(
    'rejects a non-canonical setup source (%s) atomically',
    (variant) => {
      const current = session();
      const { playerId, source } = setupSource(current, 'master.maiya', 'master.maiya.skill.military');
      const targetId = 'master.maiya.deck.support-shot';
      current.state.cards = current.state.cards.filter((card) => card.definitionId !== targetId);
      if (variant === 'source-hand') {
        source.zone = 'hand';
      } else if (variant === 'source-wrong-owner') {
        const foreignPlayerId = playerId === 'p7' ? 'p6' : 'p7';
        source.ownerPlayerId = foreignPlayerId;
      } else if (variant === 'source-wrong-controller') {
        const foreignPlayerId = playerId === 'p7' ? 'p6' : 'p7';
        source.controllerPlayerId = foreignPlayerId;
      } else if (variant === 'source-definition-owner') {
        current.state.abilityRuntime!.pack.cards[source.definitionId]!.ownerId = 'master.other';
      } else {
        delete current.state.abilityRuntime!.cardState[source.instanceId];
      }
      const before = JSON.stringify(current.state);

      expect(() => processAbilityEvent(current.state, { id: `invalid-setup-source-${variant}`, type: 'game_start' }))
        .toThrow(/invalid_setup_source|resolution_failed|canonical/i);
      expect(JSON.stringify(current.state)).toBe(before);
      expect(current.state.cards.some((card) => card.definitionId === targetId)).toBe(false);
    },
  );

  it('rejects a corrupted routed graph without legacy fallback or partial mutation', () => {
    const current = session();
    const { playerId } = setupSource(current, 'master.maiya', 'master.maiya.skill.military');
    const definition = current.state.abilityRuntime!.pack.cards['master.maiya.skill.military']!;
    const ability = definition.abilities.find((candidate) => candidate.id === 'military.has-support-shot')!;
    ability.effects[0]!.then = [{ type: 'draw_cards', count: 1 }];
    current.state.cards = current.state.cards.filter((card) => card.definitionId !== 'master.maiya.deck.support-shot');
    const before = JSON.stringify(current.state);

    expect(() => processAbilityEvent(current.state, { id: 'corrupt-setup-route', type: 'game_start' })).toThrow(/resolution_failed|unsupported/i);
    expect(JSON.stringify(current.state)).toBe(before);
    expect(current.state.cards.some((card) => card.ownerPlayerId === playerId && card.definitionId === 'master.maiya.deck.support-shot')).toBe(false);
  });

  it('rejects create_card moved to creates without legacy fallback or mutation', () => {
    const current = session();
    const definition = current.state.abilityRuntime!.pack.cards['master.maiya.skill.military']!;
    const ability = definition.abilities.find((candidate) => candidate.id === 'military.has-support-shot')!;
    ability.creates = ability.effects.splice(0);
    current.state.cards = current.state.cards.filter((card) => card.definitionId !== 'master.maiya.deck.support-shot');
    const beforeCards = structuredClone(current.state.cards);
    const beforeEvents = structuredClone(current.state.abilityRuntime!.events);
    const beforeRevision = current.state.abilityRuntime!.revision;
    const before = JSON.stringify(current.state);

    expect(() => processAbilityEvent(current.state, { id: 'create-card-in-creates', type: 'game_start' }))
      .toThrow(/resolution_failed|unsupported/i);
    expect(current.state.cards).toEqual(beforeCards);
    expect(current.state.abilityRuntime!.events).toEqual(beforeEvents);
    expect(current.state.abilityRuntime!.revision).toBe(beforeRevision);
    expect(JSON.stringify(current.state)).toBe(before);
  });

  it('rejects creates plus a non-skill destination without legacy fallback or mutation', () => {
    const current = session();
    const definition = current.state.abilityRuntime!.pack.cards['master.maiya.skill.military']!;
    const ability = definition.abilities.find((candidate) => candidate.id === 'military.has-support-shot')!;
    ability.creates = ability.effects.splice(0);
    ability.creates[0]!.to = { zone: 'deck' };
    current.state.cards = current.state.cards.filter((card) => card.definitionId !== 'master.maiya.deck.support-shot');
    const before = JSON.stringify(current.state);

    expect(() => processAbilityEvent(current.state, { id: 'create-card-in-creates-deck', type: 'game_start' }))
      .toThrow(/resolution_failed|unsupported/i);
    expect(JSON.stringify(current.state)).toBe(before);
  });

  it('rejects a nested branch create_card without legacy fallback or mutation', () => {
    const current = session();
    const definition = current.state.abilityRuntime!.pack.cards['master.maiya.skill.military']!;
    const ability = definition.abilities.find((candidate) => candidate.id === 'military.has-support-shot')!;
    ability.effects = [{
      type: 'branch',
      branches: [{ else: [{ type: 'create_card', cardId: 'master.maiya.deck.support-shot', to: { zone: 'deck' } }] }],
    }];
    current.state.cards = current.state.cards.filter((card) => card.definitionId !== 'master.maiya.deck.support-shot');
    const beforeCards = structuredClone(current.state.cards);
    const beforeEvents = structuredClone(current.state.abilityRuntime!.events);
    const beforeRevision = current.state.abilityRuntime!.revision;
    const before = JSON.stringify(current.state);

    expect(() => processAbilityEvent(current.state, { id: 'nested-create-card-branch', type: 'game_start' }))
      .toThrow(/resolution_failed|unsupported/i);
    expect(current.state.cards).toEqual(beforeCards);
    expect(current.state.abilityRuntime!.events).toEqual(beforeEvents);
    expect(current.state.abilityRuntime!.revision).toBe(beforeRevision);
    expect(JSON.stringify(current.state)).toBe(before);
  });

  it('rejects an unknown target definition before creation and preserves the transaction', () => {
    const current = session();
    const definition = current.state.abilityRuntime!.pack.cards['master.olga-marie.skill.astronomical-science']!;
    const ability = definition.abilities.find((candidate) => candidate.id === 'astronomical-science.has-chaldeas')!;
    ability.effects[0]!.cardId = 'missing.setup.definition';
    current.state.cards = current.state.cards.filter((card) => card.definitionId !== 'master.olga-marie.skill.chaldeas');
    const before = JSON.stringify(current.state);

    expect(() => processAbilityEvent(current.state, { id: 'missing-setup-definition', type: 'game_start' })).toThrow(/resolution_failed|missing.*definition/i);
    expect(JSON.stringify(current.state)).toBe(before);
  });
});
