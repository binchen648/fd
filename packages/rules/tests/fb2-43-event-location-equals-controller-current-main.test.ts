import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { stepGameLoop } from '../src/core/game-loop';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityDefinitionPack, AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../src/ability/types';

const exact = (): RuleNode => ({ type: 'event_location_equals_controller' });

function relationAbility(conditions: RuleNode[] = [exact()]): AuthoringAbility {
  return {
    id: 'location-relation-check',
    kind: 'forced_trigger',
    printedClause: 'synthetic event-location relation proof',
    activation: { trigger: 'after_controller_enters_location' },
    conditions,
    targets: [],
    effects: [],
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

function executableCard(ability: AuthoringAbility): ExecutableCardDefinition {
  return {
    id: 'skill.synthetic.location-relation',
    name: 'synthetic location relation',
    cardType: 'servant_skill',
    ownerId: 'servant.synthetic',
    cardFace: { typeLabel: 'skill', cost: 0, basePower: 0, attributes: [] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [],
    abilities: [ability],
    mode: 'automatic',
    playKind: 'support',
    destinationZone: 'field',
  };
}

function setup(conditions: RuleNode[] = [exact()], trigger = 'after_controller_enters_location') {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{
    instanceId: 'source',
    definitionId: 'skill.synthetic.location-relation',
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  }];
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'magic_workshop';
  const ability = relationAbility(conditions);
  ability.activation = { trigger };
  const card = executableCard(ability);
  const pack: AbilityDefinitionPack = { cards: { [card.id]: card } };
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  state.abilityRuntime!.cardState.source = { active: true, faceDown: false };
  return state;
}

function archive(condition: RuleNode, options: { inEffects?: boolean; trigger?: string } = {}) {
  const ability: any = relationAbility([condition]);
  ability.activation = { trigger: options.trigger ?? 'after_controller_enters_location' };
  if (options.inEffects) {
    ability.conditions = [];
    ability.effects = [condition];
  }
  return {
    schemaVersion: 'fd-card-authoring-v1',
    id: 'servant.synthetic',
    name: 'synthetic',
    cards: [{
      id: 'skill.synthetic.location-relation',
      name: 'source',
      cardType: 'servant_skill',
      cardFace: { typeLabel: 'skill', cost: 0, basePower: 0, attributes: [], requirement: { type: 'none' } },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [ability],
    }],
  };
}

function enterEvent(locationId?: string, playerId = 'p2') {
  return {
    id: `enter-${locationId ?? 'missing'}`,
    type: 'after_controller_enters_location',
    playerId,
    ...(locationId === undefined ? {} : { locationId }),
  };
}

function fullCompositionAbility(): AuthoringAbility {
  const ability = relationAbility([
    { type: 'source_active' },
    { type: 'controller_servant_revealed' },
    { type: 'at_battlefield' },
    { type: 'event_player_is_opponent' },
    exact(),
  ]);
  ability.id = 'full-composition';
  ability.effects = [{ type: 'close_source_card' }];
  return ability;
}

function setupFullComposition() {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{
    instanceId: 'source',
    definitionId: 'skill.synthetic.location-relation',
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  }];
  state.round.activePhase = 'action';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'magic_workshop';
  state.players[1]!.mana = 5;
  const card = executableCard(fullCompositionAbility());
  const pack: AbilityDefinitionPack = { cards: { [card.id]: card } };
  rules.initializeAbilityRuntime(state, pack, { seed: 20260920 });
  state.abilityRuntime!.cardState.source = { active: true, faceDown: false };
  state.abilityRuntime!.revealedServants.push('p1');
  return state;
}

function sourceIsClosed(state: ReturnType<typeof setupFullComposition>): boolean {
  return state.cards.find((card) => card.instanceId === 'source')?.zone === 'skill' &&
    state.abilityRuntime!.cardState.source?.active === false;
}

describe('P3-FB2-43 event-location equals controller', () => {
  it('classifies only the exact identity-free type-only shape', () => {
    expect(rules.isAcceptedEventLocationEqualsControllerCondition(exact())).toBe(true);
    expect(rules.isAcceptedEventLocationEqualsControllerCondition({ ...exact(), location: 'controller' })).toBe(false);
    expect(rules.isAcceptedEventLocationEqualsControllerCondition({ type: 'event_player_is_opponent' })).toBe(false);
  });

  it('compares only a valid authoritative movement-event location to the current controller location without mutation', () => {
    const state = setup();
    const before = structuredClone(state);

    expect(rules.eventLocationEqualsController(state, 'p1', enterEvent('miyama_town'))).toBe(true);
    expect(rules.eventLocationEqualsController(state, 'p1', enterEvent('shinto'))).toBe(false);
    expect(rules.eventLocationEqualsController(state, 'p1', enterEvent())).toBe(false);
    expect(rules.eventLocationEqualsController(state, 'p1', enterEvent(''))).toBe(false);
    expect(rules.eventLocationEqualsController(state, 'p1', enterEvent('not-a-location'))).toBe(false);
    expect(rules.eventLocationEqualsController(state, 'missing-controller', enterEvent('miyama_town'))).toBe(false);
    expect(rules.eventLocationEqualsController(state, 'p1', { ...enterEvent('miyama_town'), type: 'after_battle_ended' })).toBe(false);
    expect(state).toEqual(before);
  });

  it('does not absorb player-relationship semantics into the location relation itself', () => {
    const state = setup();
    expect(rules.eventLocationEqualsController(state, 'p1', enterEvent('miyama_town', 'p1'))).toBe(true);
    expect(rules.eventLocationEqualsController(state, 'p1', {
      id: 'enter-without-player', type: 'after_controller_enters_location', locationId: 'miyama_town',
    })).toBe(true);
  });

  it('rejects malformed runtime siblings rather than silently accepting their payload', () => {
    const state = setup([{ type: 'event_location_equals_controller', location: 'controller' }]);
    const before = structuredClone(state);
    expect(() => rules.collectTriggeredAbilities(state, enterEvent('miyama_town')))
      .toThrow(/event-location relation condition shape/i);
    expect(state).toEqual(before);
  });

  it('loader accepts the exact node only under conditions and rejects extra payload', () => {
    expect(rules.loadAuthoringJson(archive(exact())).report).toEqual([]);

    expect(rules.loadAuthoringJson(archive({ ...exact(), extra: true })).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Event-location relation condition must contain only type' }),
    ]));

    const outsideConditions = rules.loadAuthoringJson(archive(exact(), { inEffects: true }));
    expect(outsideConditions.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Event-location relation condition is supported only as a direct ability condition' }),
    ]));
    expect(outsideConditions.cards['skill.synthetic.location-relation']!.abilities[0]!.execution.mode).toBe('unsupported');
  });

  it('does not make an unrelated unaccepted trigger loadable', () => {
    const report = rules.loadAuthoringJson(archive(exact(), { trigger: 'future_unaccepted_trigger' })).report;
    expect(report).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'Unmapped trigger' })]));
  });

  it('preserves implicit controller-entry scoping unless an exact opponent relation condition opts in', () => {
    const state = setup();
    expect(rules.collectTriggeredAbilities(state, enterEvent('miyama_town', 'p2'))).toEqual([]);
    expect(rules.collectTriggeredAbilities(state, enterEvent('miyama_town', 'p1'))).toEqual([
      { cardInstanceId: 'source', abilityId: 'location-relation-check', controllerId: 'p1' },
    ]);
  });

  it('does not widen opponent opt-in to unrelated after_controller triggers', () => {
    const state = setup([{ type: 'event_player_is_opponent' }], 'after_controller_loses_all_command_seals');
    expect(rules.collectTriggeredAbilities(state, {
      id: 'unrelated-opponent-controller-event',
      type: 'after_controller_loses_all_command_seals',
      playerId: 'p2',
    })).toEqual([]);
  });

  it('closes the synthetic source through the real movement producer only when an opponent enters the revealed controller battlefield', () => {
    const state = setupFullComposition();
    const result = stepGameLoop(state, {
      action: { type: 'move', playerId: 'p2', to: 'miyama_town', movementKind: 'normal' },
    });

    expect(result.nextState.players.find((player) => player.id === 'p2')?.locationId).toBe('miyama_town');
    expect(result.nextState.abilityRuntime!.processedEvents.some((eventId) => eventId.startsWith('enter-location-'))).toBe(true);
    expect(sourceIsClosed(result.nextState)).toBe(true);
  });

  it('composition fails closed for self movement, another location, unrevealed controller, non-battlefield controller, or inactive source', () => {
    const selfMove = setupFullComposition();
    selfMove.players[0]!.locationId = 'magic_workshop';
    expect(rules.collectTriggeredAbilities(selfMove, enterEvent('miyama_town', 'p1'))).toEqual([]);

    const elsewhere = setupFullComposition();
    expect(rules.collectTriggeredAbilities(elsewhere, enterEvent('shinto', 'p2'))).toEqual([]);

    const unrevealed = setupFullComposition();
    unrevealed.abilityRuntime!.revealedServants = [];
    expect(rules.collectTriggeredAbilities(unrevealed, enterEvent('miyama_town', 'p2'))).toEqual([]);

    const nonBattlefield = setupFullComposition();
    nonBattlefield.players[0]!.locationId = 'magic_workshop';
    expect(rules.collectTriggeredAbilities(nonBattlefield, enterEvent('magic_workshop', 'p2'))).toEqual([]);

    const inactive = setupFullComposition();
    inactive.abilityRuntime!.cardState.source = { active: false, faceDown: false };
    expect(rules.collectTriggeredAbilities(inactive, enterEvent('miyama_town', 'p2'))).toEqual([]);
  });
  it('keeps nested logical, target.conditions, and ruleModifiers.conditions carriers unsupported', () => {
    const nested: any = archive({ type: 'and', conditions: [exact()] });
    const nestedPack = rules.loadAuthoringJson(nested);
    expect(nestedPack.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Event-location relation condition is supported only as a direct ability condition' }),
    ]));
    expect(nestedPack.cards['skill.synthetic.location-relation']!.abilities[0]!.execution.mode).toBe('unsupported');

    const target: any = archive({ type: 'event_player_is_controller' });
    target.cards[0].abilities[0].conditions = [];
    target.cards[0].abilities[0].targets = [{ id: 't', type: 'player', conditions: [exact()] }];
    const targetPack = rules.loadAuthoringJson(target);
    expect(targetPack.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Event-location relation condition is supported only as a direct ability condition' }),
    ]));
    expect(targetPack.cards['skill.synthetic.location-relation']!.abilities[0]!.execution.mode).toBe('unsupported');

    const modifier: any = archive({ type: 'event_player_is_controller' });
    modifier.cards[0].abilities[0].conditions = [];
    modifier.cards[0].abilities[0].ruleModifiers = [{
      type: 'combat_power_modifier', operation: 'add', rule: 'attack.currentPower', value: 1,
      scope: { object: 'source_card' }, lifecycle: { duration: 'this_round' }, conditions: [exact()],
    }];
    const modifierPack = rules.loadAuthoringJson(modifier);
    expect(modifierPack.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'Event-location relation condition is supported only as a direct ability condition' }),
    ]));
    expect(modifierPack.cards['skill.synthetic.location-relation']!.abilities[0]!.execution.mode).toBe('unsupported');
  });
});
