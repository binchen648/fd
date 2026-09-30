import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import {
  calculateCardPower,
  dispatchAbilityCommand,
  initializeAbilityRuntime,
  processAbilityEvent,
  resolveEffect,
  resolveMandatoryCombatPhaseActionsForPlayer,
} from '../../src/ability/interpreter';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-battle-discard-binding';
const LAMENT = `${ROOT}.skill.lament`;
const LOVE = `${ROOT}.skill.love`;

function baseAbility(id: string, kind: 'phase_action' | 'residual') {
  return {
    id, kind, printedClause: id,
    activation: kind === 'phase_action'
      ? { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' }
      : { trigger: 'on_card_played', opens: 'immediate', requiresSourceState: 'active' },
    conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}

function archive() {
  const lament = baseAbility('fixture.duplicate-base-close', 'phase_action');
  lament.effects = [{ type: 'close_duplicate_base_power_non_residual_or_discard_top', scope: 'controller_battlefield', excludeSource: true, discardTop: 3 }];
  const love = baseAbility('fixture.discard-shuffle-x', 'residual');
  love.effects = [{ type: 'discard_shuffle_source_x_binding', base: 2, selectionZone: 'discard', shuffleInto: 'deck', upkeep: 'controller_battle' }];
  const card = (id: string, abilities: any[]) => ({
    id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
    cardFace: { attributes: ['特殊'], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities,
    verification: { implementationStatus: 'complete' },
  });
  return { schemaVersion: 'fd-card-authoring-v1', id: ROOT, cards: [card(LAMENT, [lament]), card(LOVE, [love])] } as any;
}

function setup() {
  const pack = loadAuthoringJson(archive());
  const state = createSeededGameState();
  state.cards = [];
  state.players[0]!.servantCardId = ROOT;
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'shinto';
  state.players[3]!.locationId = 'miyama_town';
  state.players[0]!.mana = 10;
  initializeAbilityRuntime(state, pack, { seed: 20260930 });
  state.round.activePhase = 'battle';
  state.round.prioritySeat = state.players[0]!.seat;
  return state;
}

function addDefinition(state: GameState, id: string, basePower: number, residual = false) {
  state.abilityRuntime!.pack.cards[id] = {
    id, name: id, cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: residual ? [{
      id: `${id}.residual`, kind: 'residual', printedClause: 'residual', activation: { trigger: 'while_active' }, conditions: [], targets: [],
      effects: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    } as any] : [], mode: 'automatic', playKind: 'attack', destinationZone: 'attack_area',
  } as any;
}

function add(state: GameState, definitionId: string, owner = 'p1', zone = 'attack_area', active = true) {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['attack_area', 'field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return state.cards[state.cards.length - 1]!;
}

function addSkill(state: GameState, definitionId: string, zone = 'field') { return add(state, definitionId, 'p1', zone, true); }

function ctx(sourceId: string, abilityId: string, event?: any) {
  return { controllerId: 'p1', sourceCardId: sourceId, abilityId, variables: {}, selections: {}, ...(event ? { event } : {}) };
}

function resolveChoice(state: GameState, selectedIds: string[]) {
  const d = state.abilityRuntime!.pendingDecision!;
  return dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds });
}

describe('P3 Tristan owner-readiness generic battle/discard binding capability', () => {
  it('closes the frozen set of same-battlefield non-residual attacks sharing base Power and excludes source/residuals', () => {
    const state = setup(); const source = addSkill(state, LAMENT, 'attack_area');
    addDefinition(state, 'fixture.a', 4); addDefinition(state, 'fixture.b', 4); addDefinition(state, 'fixture.residual', 4, true); addDefinition(state, 'fixture.other', 5);
    const a = add(state, 'fixture.a', 'p1'); const b = add(state, 'fixture.b', 'p2'); const residual = add(state, 'fixture.residual', 'p3'); const other = add(state, 'fixture.other', 'p2');
    // Effective totals intentionally differ; duplicate grouping must remain on the base-Power axis.
    (a as any).powerModifiers = [{ kind: 'add', value: 5, sourceId: 'fixture.mod' }];
    resolveEffect(state, ctx(source.instanceId, 'fixture.duplicate-base-close'), { type: 'close_duplicate_base_power_non_residual_or_discard_top', scope: 'controller_battlefield', excludeSource: true, discardTop: 3 });
    expect(state.abilityRuntime!.cardState[a.instanceId]!.active).toBe(false);
    expect(state.abilityRuntime!.cardState[b.instanceId]!.active).toBe(false);
    expect(state.abilityRuntime!.cardState[residual.instanceId]!.active).toBe(true);
    expect(state.abilityRuntime!.cardState[other.instanceId]!.active).toBe(true);
    expect(state.abilityRuntime!.cardState[source.instanceId]!.active).toBe(true);
  });

  it.each([0, 1, 2, 4])('falls back to discarding min(3, deck size) when no duplicate group exists (deck=%i)', (deckSize) => {
    const state = setup(); const source = addSkill(state, LAMENT, 'attack_area'); addDefinition(state, 'fixture.unique', 3); add(state, 'fixture.unique', 'p2');
    for (let i = 0; i < deckSize; i++) { addDefinition(state, `fixture.deck.${i}`, i + 6); add(state, `fixture.deck.${i}`, 'p1', 'deck', false); }
    resolveEffect(state, ctx(source.instanceId, 'fixture.duplicate-base-close'), { type: 'close_duplicate_base_power_non_residual_or_discard_top', scope: 'controller_battlefield', excludeSource: true, discardTop: 3 });
    expect(state.cards.filter((c) => c.ownerPlayerId === 'p1' && c.zone === 'discard')).toHaveLength(Math.min(3, deckSize));
  });

  it('stages a private 0..N discard choice and binds X=N+2 only after exact current discard resolution', () => {
    const state = setup(); state.round.activePhase = 'action'; const source = addSkill(state, LOVE, 'field');
    addDefinition(state, 'fixture.discard.a', 1); addDefinition(state, 'fixture.discard.b', 2); addDefinition(state, 'fixture.discard.c', 3);
    const a = add(state, 'fixture.discard.a', 'p1', 'discard', false); const b = add(state, 'fixture.discard.b', 'p1', 'discard', false); add(state, 'fixture.discard.c', 'p1', 'discard', false);
    processAbilityEvent(state, { id: 'play-love', type: 'on_card_played', playerId: 'p1', sourceCardId: source.instanceId });
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p1', min: 0, max: 3 });
    expect(state.abilityRuntime!.pendingDecision!.interaction).toMatchObject({ kind: 'discard_shuffle_source_x_v1', visibility: 'owner_only', base: 2 });
    expect(resolveChoice(state, [a.instanceId, b.instanceId]).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.abilityRuntime!.cardState[source.instanceId]!.sourceBoundX).toEqual({ value: 4, controllerId: 'p1', sourceAbilityId: 'fixture.discard-shuffle-x' });
    expect(calculateCardPower(state, source.instanceId).value).toBe(4);
    expect([state.cards.find((card) => card.instanceId === a.instanceId)!.zone,
      state.cards.find((card) => card.instanceId === b.instanceId)!.zone]).toEqual(['deck', 'deck']);
  });

  it('supports the zero-selection boundary as X=2 without moving discard cards', () => {
    const state = setup(); state.round.activePhase = 'action'; const source = addSkill(state, LOVE, 'field'); addDefinition(state, 'fixture.discard.zero', 1); const d = add(state, 'fixture.discard.zero', 'p1', 'discard', false);
    processAbilityEvent(state, { id: 'play-love-zero', type: 'on_card_played', playerId: 'p1', sourceCardId: source.instanceId });
    expect(resolveChoice(state, []).ok).toBe(true);
    expect(state.abilityRuntime!.cardState[source.instanceId]!.sourceBoundX?.value).toBe(2);
    expect(state.cards.find((card) => card.instanceId === d.instanceId)!.zone).toBe('discard');
  });

  it('rejects a stale discard choice atomically when a candidate moved after staging', () => {
    const state = setup(); state.round.activePhase = 'action'; const source = addSkill(state, LOVE, 'field'); addDefinition(state, 'fixture.stale', 1); const d = add(state, 'fixture.stale', 'p1', 'discard', false);
    processAbilityEvent(state, { id: 'play-love-stale', type: 'on_card_played', playerId: 'p1', sourceCardId: source.instanceId });
    state.cards.find((card) => card.instanceId === d.instanceId)!.zone = 'hand'; const before = structuredClone(state);
    expect(resolveChoice(state, [d.instanceId]).ok).toBe(false);
    expect(state).toEqual(before);
  });

  it('charges X once per participating battle round and closes the source instead of making mana negative when insufficient', () => {
    const paid = setup(); const source = addSkill(paid, LOVE, 'field'); addDefinition(paid, 'fixture.attack', 3); add(paid, 'fixture.attack', 'p1');
    paid.abilityRuntime!.cardState[source.instanceId]!.sourceBoundX = { value: 4, controllerId: 'p1', sourceAbilityId: 'fixture.discard-shuffle-x' };
    paid.players[0]!.mana = 6; resolveMandatoryCombatPhaseActionsForPlayer(paid, 'p1'); expect(paid.players[0]!.mana).toBe(2);
    resolveMandatoryCombatPhaseActionsForPlayer(paid, 'p1'); expect(paid.players[0]!.mana).toBe(2);
    expect(paid.abilityRuntime!.cardState[source.instanceId]!.sourceBoundXBattleUpkeepRound).toBe(paid.round.roundNumber);

    const closed = setup(); const source2 = addSkill(closed, LOVE, 'field'); addDefinition(closed, 'fixture.attack2', 3); add(closed, 'fixture.attack2', 'p1');
    closed.abilityRuntime!.cardState[source2.instanceId]!.sourceBoundX = { value: 4, controllerId: 'p1', sourceAbilityId: 'fixture.discard-shuffle-x' };
    closed.players[0]!.mana = 3; resolveMandatoryCombatPhaseActionsForPlayer(closed, 'p1');
    expect(closed.players[0]!.mana).toBe(3); expect(source2.zone).toBe('skill');
    expect(closed.abilityRuntime!.cardState[source2.instanceId]!.sourceBoundX).toBeUndefined();
  });

  it('does not charge source-X upkeep without actual controller battle participation', () => {
    const state = setup(); const source = addSkill(state, LOVE, 'field'); state.abilityRuntime!.cardState[source.instanceId]!.sourceBoundX = { value: 5, controllerId: 'p1', sourceAbilityId: 'fixture.discard-shuffle-x' };
    state.players[0]!.mana = 8; resolveMandatoryCombatPhaseActionsForPlayer(state, 'p1'); expect(state.players[0]!.mana).toBe(8); expect(source.zone).toBe('field');
  });

  it('fails closed at loader gateway for widened privileged mechanics', () => {
    const bad = archive(); bad.cards[0].abilities[0].effects[0].discardTop = 4;
    const badPack = loadAuthoringJson(bad);
    expect(badPack.cards[LAMENT]!.abilities[0]!.execution.mode).toBe('unsupported');
    expect(badPack.report.some((entry) => entry.path === 'battleDiscardBinding.gateway')).toBe(true);
    const bad2 = archive(); bad2.cards[1].abilities[0].effects[0].base = 3;
    const badPack2 = loadAuthoringJson(bad2);
    expect(badPack2.cards[LOVE]!.abilities[0]!.execution.mode).toBe('unsupported');
    expect(badPack2.report.some((entry) => entry.path === 'battleDiscardBinding.gateway')).toBe(true);
  });
});
