import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '../../../content/src/index';
import * as rules from '../../src/index';
import { compileExecutableCardPack } from '../../src/ability/executable-card-pack';
import { createSeededGameState } from '../../src/tools/seeded-state';

const EVENT_ID = 'event.synthetic.static-battle-rule';

function compiledPack() {
  const loaded = loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: resolve('.') });
  const input: any = compileLoadedPlaytestPack(loaded).library;
  input.rules.archives.push({
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'event_rule_definition_archive',
    id: 'event.synthetic.static-battle-rules',
    name: 'Synthetic Static Battle Rules',
    cards: [{
      id: EVENT_ID,
      name: 'Synthetic Static Battle Event',
      cardType: 'event',
      printedText: 'static event modifier fixture',
      cardFace: {
        eventTags: ['synthetic', 'lostbelt'],
        printedReward: 4,
        battleModifiers: [
          { attribute: 'strength', condition: 'has_attribute', value: 4 },
          { attribute: 'agility', condition: 'has_attribute', value: -2 },
        ],
      },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [],
    }],
  });
  return compileExecutableCardPack(input);
}

describe('FB2-29 rules-only event static battle metadata', () => {
  it('compiles, applies only at the authoritative battlefield, and survives lifecycle round-trip', () => {
    const pack = compiledPack();
    const expected = [
      { sourceId: EVENT_ID, targetTag: '力量', value: 4, condition: 'has_attribute' },
      { sourceId: EVENT_ID, targetTag: '敏捷', value: -2, condition: 'has_attribute' },
    ];
    expect(pack.eventCatalog?.[EVENT_ID]?.battleModifiers).toEqual(expected);
    expect(pack.cards[EVENT_ID]).toBeUndefined();

    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.eventOutsideGame = [EVENT_ID];
    rules.initializeAbilityRuntime(state, pack, { seed: 20260919 });

    const [outside] = rules.listEventRuleCandidates(state, pack, ['event_outside_game']);
    expect(outside?.eventCardId).toBe(EVENT_ID);
    rules.moveEventRuleCandidate(state, pack, outside!.token, 'event_battlefield', { locationId: 'miyama_town' });
    expect(state.eventPlacements).toContainEqual(expect.objectContaining({
      eventCardId: EVENT_ID,
      locationId: 'miyama_town',
      victoryPoints: 4,
      battleModifiers: expected,
    }));

    const atSource = rules.resolveBattlefield(structuredClone(state), {
      battlefieldId: 'miyama_town',
      participants: [
        { playerId: 'p1', totalPower: 10, attackTags: ['力量'] },
        { playerId: 'p2', totalPower: 10, attackTags: ['敏捷'] },
      ],
    }).nextState.battleResults.at(-1)!;
    expect(atSource.participantBreakdowns.find((entry) => entry.playerId === 'p1')?.modifiers)
      .toContainEqual(expect.objectContaining({ source: 'event', value: 4, payload: expect.objectContaining({ sourceId: EVENT_ID, targetTag: '力量' }) }));
    expect(atSource.participantBreakdowns.find((entry) => entry.playerId === 'p2')?.modifiers)
      .toContainEqual(expect.objectContaining({ source: 'event', value: -2, payload: expect.objectContaining({ sourceId: EVENT_ID, targetTag: '敏捷' }) }));

    const elsewhere = rules.resolveBattlefield(structuredClone(state), {
      battlefieldId: 'shinto',
      participants: [{ playerId: 'p1', totalPower: 10, attackTags: ['力量'] }],
    }).nextState.battleResults.at(-1)!;
    expect(elsewhere.participantBreakdowns[0]?.modifiers.some((entry) => entry.payload.sourceId === EVENT_ID)).toBe(false);

    const [placed] = rules.listEventRuleCandidates(state, pack, ['event_battlefield']);
    rules.moveEventRuleCandidate(state, pack, placed!.token, 'event_discard');
    expect(state.eventDiscardPile[0]).toMatchObject({ eventCardId: EVENT_ID, locationId: 'miyama_town', battleModifiers: expected });
    const [discarded] = rules.listEventRuleCandidates(state, pack, ['event_discard']);
    rules.moveEventRuleCandidate(state, pack, discarded!.token, 'event_battlefield');
    expect(state.eventPlacements[0]).toMatchObject({ eventCardId: EVENT_ID, locationId: 'miyama_town', battleModifiers: expected });
  });
});
