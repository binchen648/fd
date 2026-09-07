import { describe, expect, it } from 'vitest';
import { createSeededGameStateFromContentLibrary, stepGameLoop } from '@fd/rules/client';

describe('real content library integration', () => {
  it('processes a real CHM content library end-to-end', () => {
    const realLibrary = {
      version: '1.0.0',
      lastUpdated: '2025-10-30T00:00:00.000Z',
      stats: {
        totalCards: 4,
        bySourceSet: { master: 1, servant: 1, event: 1, situation: 1 },
        byNamespace: { matou: 1, nanaya: 1, event_set: 1, situation_set: 1 },
      },
      cards: {
        'master-1': {
          id: 'master-1',
          name: 'Matou Shinji',
          language: 'zh-CN',
          sourceSet: 'master',
          namespace: 'matou',
          approvedAt: '2025-10-30T00:00:00.000Z',
          guardrailJobId: 'job-001',
          tags: ['master'],
          cardType: 'master_identity',
          initialMana: 4,
          commandSpells: 3,
        },
        'servant.nanaya_shiki.skill': {
          id: 'servant.nanaya_shiki.skill',
          name: '七夜志贵',
          language: 'zh-CN',
          sourceSet: 'servant',
          namespace: 'nanaya',
          approvedAt: '2025-10-30T00:00:00.000Z',
          guardrailJobId: 'job-002',
          tags: ['servant', 'skill'],
          cardType: 'servant_skill',
          classTag: 'shiki',
          attackCardsCount: 12,
          skillCardsCount: 3,
          magicCostRequired: 3,
          basePower: 2,
          abilityText: '净眼',
        },
        'event-test-1': {
          id: 'event-test-1',
          name: '深山町事件',
          language: 'zh-CN',
          sourceSet: 'event',
          namespace: 'event_set',
          approvedAt: '2025-10-30T00:00:00.000Z',
          guardrailJobId: 'job-003',
          tags: ['event'],
          cardType: 'event',
          battlefield: 'deep_mountain',
          competitionReward: 2,
          display: 'revealed',
        },
        'situation-test-1': {
          id: 'situation-test-1',
          name: '常规局势',
          language: 'zh-CN',
          sourceSet: 'situation',
          namespace: 'situation_set',
          approvedAt: '2025-10-30T00:00:00.000Z',
          guardrailJobId: 'job-004',
          tags: ['situation'],
          cardType: 'situation',
          situationType: 'regular',
          manaGrantToAll: 1,
          hasInstantEffect: true,
          hasPersistentEffect: false,
          applicableRounds: [2],
        },
      },
    };

    const state = createSeededGameStateFromContentLibrary(realLibrary as any, {
      enabledLocationIds: ['miyama_town', 'shinto', 'magic_workshop', 'recon', 'moon_holy_grail'],
    });

    expect(state.id).toBe('seeded-match-7p-content');
    expect(state.cards).toHaveLength(4);
    expect(state.contentRuntime?.situations).toHaveLength(1);
    expect(state.contentRuntime?.eventDraws).toHaveLength(1);
    
    // Test round-start triggers the scheduled content
    const stepped = stepGameLoop(state);
    expect(stepped.nextState.currentSituationCardId).toBe('situation-test-1');
    expect(stepped.nextState.eventPlacements).toHaveLength(1);
    expect(stepped.nextState.players[0]?.mana).toBeGreaterThan(4);
  });
});
