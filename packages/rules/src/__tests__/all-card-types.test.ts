import { describe, expect, it } from 'vitest';
import { createSeededGameStateFromContentLibrary, stepGameLoop } from '@fd/rules/client';

describe('all card types in content library', () => {
  it('processes all 8 card types end-to-end', () => {
    const fullLibrary = {
      version: '1.0.0',
      lastUpdated: '2025-10-30T00:00:00.000Z',
      stats: {
        totalCards: 8,
        bySourceSet: { master: 2, servant: 3, event: 1, situation: 1, command_spell: 1 },
        byNamespace: { matou: 2, nanaya: 3, event_set: 1, situation_set: 1, command: 1 },
      },
      cards: {
        // master (2 types)
        'master-identity-1': {
          id: 'master-identity-1',
          name: 'Master Card',
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
        'master-skill-1': {
          id: 'master-skill-1',
          name: 'Master Skill',
          language: 'zh-CN',
          sourceSet: 'master',
          namespace: 'matou',
          approvedAt: '2025-10-30T00:00:00.000Z',
          guardrailJobId: 'job-002',
          tags: ['master', 'skill'],
          cardType: 'master_skill',
          abilityType: 'passive',
          triggerPhase: 'preparation',
        },
        // servant (3 types)
        'servant-overview-1': {
          id: 'servant-overview-1',
          name: 'Servant Overview',
          language: 'zh-CN',
          sourceSet: 'servant',
          namespace: 'nanaya',
          approvedAt: '2025-10-30T00:00:00.000Z',
          guardrailJobId: 'job-003',
          tags: ['servant'],
          cardType: 'servant_overview',
          classTag: 'shiki',
          attackCardsCount: 12,
          skillCardsCount: 3,
        },
        'servant-attack-1': {
          id: 'servant-attack-1',
          name: 'Servant Attack',
          language: 'zh-CN',
          sourceSet: 'servant',
          namespace: 'nanaya',
          approvedAt: '2025-10-30T00:00:00.000Z',
          guardrailJobId: 'job-004',
          tags: ['servant', 'attack'],
          cardType: 'servant_attack',
          magicCost: 2,
          basePower: 3,
          attribute: 'strength',
        },
        'servant-skill-1': {
          id: 'servant-skill-1',
          name: 'Servant Skill',
          language: 'zh-CN',
          sourceSet: 'servant',
          namespace: 'nanaya',
          approvedAt: '2025-10-30T00:00:00.000Z',
          guardrailJobId: 'job-005',
          tags: ['servant', 'skill'],
          cardType: 'servant_skill',
          magicCostRequired: 3,
          basePower: 2,
          abilityText: '净眼',
        },
        // event
        'event-1': {
          id: 'event-1',
          name: 'Event Card',
          language: 'zh-CN',
          sourceSet: 'event',
          namespace: 'event_set',
          approvedAt: '2025-10-30T00:00:00.000Z',
          guardrailJobId: 'job-006',
          tags: ['event'],
          cardType: 'event',
          battlefield: 'deep_mountain',
          competitionReward: 2,
          display: 'revealed',
        },
        // situation
        'situation-1': {
          id: 'situation-1',
          name: 'Situation Card',
          language: 'zh-CN',
          sourceSet: 'situation',
          namespace: 'situation_set',
          approvedAt: '2025-10-30T00:00:00.000Z',
          guardrailJobId: 'job-007',
          tags: ['situation'],
          cardType: 'situation',
          situationType: 'regular',
          manaGrantToAll: 1,
          hasInstantEffect: true,
          hasPersistentEffect: false,
          applicableRounds: [2],
        },
        // command spell
        'command-spell-1': {
          id: 'command-spell-1',
          name: 'Command Spell',
          language: 'zh-CN',
          sourceSet: 'command_spell',
          namespace: 'command',
          approvedAt: '2025-10-30T00:00:00.000Z',
          guardrailJobId: 'job-008',
          tags: ['command'],
          cardType: 'command_spell',
          usage: 'gain_mana_4',
          limitPerPlayer: 3,
        },
      },
    };

    const state = createSeededGameStateFromContentLibrary(fullLibrary as any, {
      enabledLocationIds: ['miyama_town', 'shinto', 'magic_workshop', 'recon', 'moon_holy_grail'],
    });

    // All 8 cards should be included
    expect(state.cards).toHaveLength(8);
    
    // Verify each card type is present
    const cardTypes = state.cards.map(c => c.definitionId);
    expect(cardTypes).toContain('master-identity-1');
    expect(cardTypes).toContain('master-skill-1');
    expect(cardTypes).toContain('servant-overview-1');
    expect(cardTypes).toContain('servant-attack-1');
    expect(cardTypes).toContain('servant-skill-1');
    expect(cardTypes).toContain('event-1');
    expect(cardTypes).toContain('situation-1');
    expect(cardTypes).toContain('command-spell-1');
    
    // Verify situation triggers at round_start
    const stepped = stepGameLoop(state);
    expect(stepped.nextState.currentSituationCardId).toBe('situation-1');
    expect(stepped.nextState.eventPlacements).toHaveLength(1);
    
    // Check zones are assigned correctly
    const zones = state.cards.map(c => c.zone);
    expect(zones).toContain('master');      // master_identity
    expect(zones).toContain('master_spell'); // master_skill
    expect(zones).toContain('command_spell');// command_spell
    expect(zones).toContain('event_deck');   // event
    expect(zones).toContain('situation_deck');// situation
    
    console.log('All 8 card types processed successfully!');
    console.log('Card IDs:', cardTypes);
    console.log('Zones:', zones);
  });
});
