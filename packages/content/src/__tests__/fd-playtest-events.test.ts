import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type {
  EventSetDefinition,
  NamedCardDefinition,
} from '../playtest-content-pack';

interface PackManifest {
  eventSetFiles: string[];
  eventCardFiles: string[];
}

interface EventCard extends NamedCardDefinition {
  printedReward: number;
  applicableLocations: Array<'deep_mountain' | 'new_capital'>;
}

function readJson<T>(workspaceRelativePath: string): T {
  return JSON.parse(readFileSync(resolve(workspaceRelativePath), 'utf8')) as T;
}

const manifest = readJson<PackManifest>('data/packs/fd-playtest-v1/pack.json');
const eventSets = manifest.eventSetFiles.map((path) => readJson<EventSetDefinition>(path));
const eventCards = manifest.eventCardFiles.map((path) => readJson<EventCard>(path));

function findEvent(id: string): EventCard {
  const card = eventCards.find((candidate) => candidate.id === id);
  expect(card, `Missing event ${id}`).toBeDefined();
  return card!;
}

describe('Waxing Moon Ritual event set', () => {
  it('contains one normal twenty-slot event set with eighteen unique reviewed cards', () => {
    expect(eventSets).toHaveLength(1);
    expect(eventSets[0]!.id).toBe('event-set.waxing_moon_ritual');
    expect(eventSets[0]!.name).toBe('盈月之仪');
    expect(eventSets[0]!.cardIds).toHaveLength(20);
    expect(eventCards).toHaveLength(18);

    const slotCounts = eventSets[0]!.cardIds.reduce<Record<string, number>>((counts, id) => {
      counts[id] = (counts[id] ?? 0) + 1;
      return counts;
    }, {});

    expect(slotCounts['event.waxing_moon_ritual.ritual']).toBe(2);
    expect(slotCounts['event.waxing_moon_ritual.vengeful_spirit_barrier']).toBe(2);
    expect(Object.values(slotCounts).reduce((sum, count) => sum + count, 0)).toBe(20);
    expect(new Set(eventSets[0]!.cardIds)).toEqual(new Set(eventCards.map((card) => card.id)));
  });

  it('preserves each event reward and source-image occurrence from the HTM page', () => {
    expect(findEvent('event.waxing_moon_ritual.ritual')).toMatchObject({
      printedReward: 4,
      source: {
        htmPath: 'chm-extract/盈月之仪.htm',
        imagePath: 'chm-extract/图包/ScreenShot_2025-10-27_211319_640.png',
        imageIndex: 0,
        reviewedAgainstImage: true,
      },
    });
    expect(findEvent('event.waxing_moon_ritual.vengeful_spirit_barrier')).toMatchObject({
      printedReward: 2,
      source: {
        imagePath: 'chm-extract/图包/ScreenShot_2025-10-27_211226_007.png',
        imageIndex: 13,
      },
    });
    expect(findEvent('event.waxing_moon_ritual.keian_ceremony')).toMatchObject({
      printedReward: 1,
      source: {
        imagePath: 'chm-extract/图包/ScreenShot_2025-10-27_211220_295.png',
        imageIndex: 19,
      },
    });
  });

  it('requires every reviewed event card to include printed text, timing, interactions and effects', () => {
    for (const card of eventCards) {
      expect(card.cardType, card.id).toBe('event');
      const printedText = card.printedText;
      expect(printedText, card.id).toEqual(expect.any(String));
      expect(printedText?.trim().length, card.id).toBeGreaterThan(0);
      expect(card.timing?.length, card.id).toBeGreaterThan(0);
      expect(card.interactions?.length, card.id).toBeGreaterThan(0);
      expect(card.effects?.length, card.id).toBeGreaterThan(0);
      expect(card.applicableLocations, card.id).toEqual(['deep_mountain', 'new_capital']);
    }
  });

  it('captures representative Waxing Moon Ritual mechanics as stable primitives', () => {
    expect(findEvent('event.waxing_moon_ritual.resistance').effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'grant_masterless_servant', servantName: '阿周那' }),
        expect.objectContaining({ type: 'battle_participation_choice_at_action_end' }),
      ]),
    );
    expect(findEvent('event.waxing_moon_ritual.banquet').effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'grant_masterless_servant', servantName: '暗耳刻' }),
        expect.objectContaining({ type: 'grant_terrain_to_first_entry_each_other_player' }),
      ]),
    );
    expect(findEvent('event.waxing_moon_ritual.narrow_path_encounter').effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'block_entry_for_other_players' }),
        expect.objectContaining({ type: 'winner_only_strips_other_participants_round_rewards' }),
      ]),
    );
    expect(findEvent('event.waxing_moon_ritual.keian_ceremony').effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'draw_and_place_another_event_here' }),
        expect.objectContaining({ type: 'return_to_event_deck_instead_of_discard_or_removal' }),
      ]),
    );
  });

  it('uses reviewed workspace-relative source image metadata', () => {
    for (const entity of [...eventSets, ...eventCards]) {
      expect(entity.source.reviewedAgainstImage).toBe(true);
      expect(entity.source.htmPath).toMatch(/^chm-extract\//);
      expect(entity.source.imagePath).toMatch(/^chm-extract\/图包\/ScreenShot_/);
    }
  });
});
