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

describe('P3-B setup create-to-skill current-lineage repair', () => {
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
    expect(current.getPlayerView(playerId).cards).toContainEqual(expect.objectContaining({
      instanceId: created[0]!.instanceId,
      definitionId: targetDefinitionId,
      zone: 'skill',
    }));
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
