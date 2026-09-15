import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const rawDrake = JSON.parse(readFileSync('data/authoring/servants/servant.drake.json', 'utf8'));
const ridingDefinitionId = 'servant.drake.skill.sc-drake-1';
const drawAbilityId = 'sc-drake-1.draw';

function archive() {
  const raw = structuredClone(rawDrake);
  raw.cards.push({
    id: 'fixture.basic-2', name: 'fixture-basic-2', cardType: 'basic_attack',
    cardFace: { cost: 2, basePower: 2 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities: [],
  });
  return raw;
}

function setup(raw = archive()): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.mana = 12;
  state.players[0]!.servantCardId = 'servant.drake';
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(raw), { seed: 20260916 });
  return state;
}

function add(state: GameState, definitionId: string, zone: 'hand' | 'skill' | 'deck' | 'discard' | 'attack_area' = 'hand', owner = 'p1'): string {
  const instanceId = `fb2-08-${state.cards.length}-${owner}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner },
  });
  return instanceId;
}

function drawAbility(): AuthoringAbility {
  return structuredClone(rules.loadAuthoringJson(archive()).cards[ridingDefinitionId]!.abilities
    .find((ability) => ability.id === drawAbilityId)!);
}

function activateSourceWithoutCompanion(state: GameState): { riding: string; basic: string } {
  const riding = add(state, ridingDefinitionId, 'skill');
  const basic = add(state, 'fixture.basic-2', 'hand');
  rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: riding }]);
  expect(state.abilityRuntime!.cardState[riding]).toMatchObject({ active: true, faceDown: false });
  return { riding, basic };
}

describe('P3-FB2-08 source-play basic-attack draw trigger', () => {
  it('classifies the exact semantic shape without card or ability identity', () => {
    const exact = drawAbility();
    const renamed = structuredClone(exact);
    renamed.id = 'totally-renamed-source-play-draw';
    expect(rules.isSourcePlayBasicAttackDrawTriggerSemantic(exact)).toBe(true);
    expect(rules.isSourcePlayBasicAttackDrawTriggerSemantic(renamed)).toBe(true);

    const wrongCondition = structuredClone(exact);
    wrongCondition.conditions = [{ type: 'controller_at_battlefield' }];
    const extraCondition = structuredClone(exact);
    extraCondition.conditions.push({ type: 'controller_at_battlefield' });
    const wrongCount = structuredClone(exact);
    wrongCount.effects[0]!.count = 2;
    const wrongOwner = structuredClone(exact);
    wrongOwner.effects[0]!.owner = 'target';
    const extraEffect = structuredClone(exact);
    extraEffect.effects.push({ type: 'draw_cards', owner: 'controller', count: 1 });
    const extraActivation = structuredClone(exact);
    extraActivation.activation.phase = 'action';
    for (const rejected of [wrongCondition, extraCondition, wrongCount, wrongOwner, extraEffect, extraActivation]) {
      expect(rules.isSourcePlayBasicAttackDrawTriggerSemantic(rejected)).toBe(false);
    }
  });

  it('draws exactly one through typed evidence when source and a face-up basic attack share the real batch', () => {
    const state = setup();
    const riding = add(state, ridingDefinitionId, 'skill');
    const basic = add(state, 'fixture.basic-2', 'hand');
    const deckCard = add(state, 'fixture.basic-2', 'deck');
    const eventCount = state.abilityRuntime!.events.length;

    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: riding }, { cardInstanceId: basic }]);

    expect(state.cards.find((card) => card.instanceId === deckCard)?.zone).toBe('hand');
    const events = state.abilityRuntime!.events.slice(eventCount);
    expect(events).toContainEqual(expect.objectContaining({
      type: 'cards_drawn', playerId: 'p1', sourceCardId: riding, abilityId: drawAbilityId,
    }));
    expect(events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved', playerId: 'p1', sourceCardId: riding, abilityId: drawAbilityId,
    }));
  });

  it('does not trigger for separate plays, a face-down basic companion, or another controller basic', () => {
    const separate = setup();
    const separateRiding = add(separate, ridingDefinitionId, 'skill');
    const separateBasic = add(separate, 'fixture.basic-2', 'hand');
    const separateDeck = add(separate, 'fixture.basic-2', 'deck');
    rules.playAbilityCardBatch(separate, 'p1', [{ cardInstanceId: separateBasic }]);
    rules.playAbilityCardBatch(separate, 'p1', [{ cardInstanceId: separateRiding }]);
    expect(separate.cards.find((card) => card.instanceId === separateDeck)?.zone).toBe('deck');

    const hidden = setup();
    const hiddenRiding = add(hidden, ridingDefinitionId, 'skill');
    const hiddenBasic = add(hidden, 'fixture.basic-2', 'hand');
    const hiddenDeck = add(hidden, 'fixture.basic-2', 'deck');
    rules.playAbilityCardBatch(hidden, 'p1', [{ cardInstanceId: hiddenRiding }, { cardInstanceId: hiddenBasic, faceDown: true }]);
    expect(hidden.cards.find((card) => card.instanceId === hiddenDeck)?.zone).toBe('deck');

    const other = setup();
    const { riding: otherRiding } = activateSourceWithoutCompanion(other);
    const enemyBasic = add(other, 'fixture.basic-2', 'attack_area', 'p2');
    const otherDeck = add(other, 'fixture.basic-2', 'deck');
    rules.processAbilityEvent(other, {
      id: 'fb2-08-other-controller-basic', type: 'on_card_played', playerId: 'p1', sourceCardId: otherRiding,
      playedCards: [
        { instanceId: otherRiding, controllerId: 'p1', cardType: 'servant_skill', faceDown: false },
        { instanceId: enemyBasic, controllerId: 'p2', cardType: 'basic_attack', faceDown: false },
      ],
    });
    expect(other.cards.find((card) => card.instanceId === otherDeck)?.zone).toBe('deck');
  });

  it('requires trusted event source and player provenance', () => {
    for (const mode of ['wrong-player', 'wrong-source', 'missing-source-entry'] as const) {
      const state = setup();
      const { riding, basic } = activateSourceWithoutCompanion(state);
      const deckCard = add(state, 'fixture.basic-2', 'deck');
      rules.processAbilityEvent(state, {
        id: `fb2-08-${mode}`, type: 'on_card_played',
        playerId: mode === 'wrong-player' ? 'p2' : 'p1',
        sourceCardId: mode === 'wrong-source' ? basic : riding,
        playedCards: mode === 'missing-source-entry'
          ? [{ instanceId: basic, controllerId: 'p1', cardType: 'basic_attack', faceDown: false }]
          : [
            { instanceId: riding, controllerId: 'p1', cardType: 'servant_skill', faceDown: false },
            { instanceId: basic, controllerId: 'p1', cardType: 'basic_attack', faceDown: false },
          ],
      });
      expect(state.cards.find((card) => card.instanceId === deckCard)?.zone).toBe('deck');
    }
  });

  it('dedupes the same trusted event id and reuses typed discard recycling', () => {
    const state = setup();
    const { riding, basic } = activateSourceWithoutCompanion(state);
    const first = add(state, 'fixture.basic-2', 'discard');
    const second = add(state, 'fixture.basic-2', 'discard');
    const event = {
      id: 'fb2-08-dedupe', type: 'on_card_played' as const, playerId: 'p1', sourceCardId: riding,
      playedCards: [
        { instanceId: riding, controllerId: 'p1', cardType: 'servant_skill', faceDown: false },
        { instanceId: basic, controllerId: 'p1', cardType: 'basic_attack', faceDown: false },
      ],
    };
    const revision = state.abilityRuntime!.revision;
    rules.processAbilityEvent(state, event);
    const handAfterFirst = state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'hand').length;
    expect([first, second].filter((id) => state.cards.find((card) => card.instanceId === id)?.zone === 'hand')).toHaveLength(1);
    expect(state.abilityRuntime!.revision).toBe(revision + 1);

    rules.processAbilityEvent(state, structuredClone(event));
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p1' && card.zone === 'hand')).toHaveLength(handAfterFirst);
    expect(state.abilityRuntime!.revision).toBe(revision + 1);
  });

  it('fails a malformed recognized candidate atomically instead of falling through to legacy draw', () => {
    const malformed = archive();
    const draw = malformed.cards.find((card: { id: string }) => card.id === ridingDefinitionId)
      .abilities.find((ability: { id: string }) => ability.id === drawAbilityId);
    draw.effects[0].count = 2;
    const state = setup(malformed);
    const riding = add(state, ridingDefinitionId, 'skill');
    const basic = add(state, 'fixture.basic-2', 'hand');
    const deckCard = add(state, 'fixture.basic-2', 'deck');
    const before = JSON.stringify(state);

    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: riding }, { cardInstanceId: basic }]))
      .toThrow('Unsupported source-play basic-attack draw trigger semantic shape');
    expect(JSON.stringify(state)).toBe(before);
    expect(state.cards.find((card) => card.instanceId === deckCard)?.zone).toBe('deck');
  });
});
