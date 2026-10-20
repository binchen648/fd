import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const archivePath = 'data/authoring/masters/master.wodime.json';
const expectedIds = ['ascension', 's1', 's1a', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];

describe('Wodime frozen authoring archive', () => {
  it('preserves all eleven source-grounded cards and bounded runtime status', () => {
    expect(existsSync(archivePath)).toBe(true);
    const raw = JSON.parse(readFileSync(archivePath, 'utf8'));
    expect(raw.id).toBe('master.wodime');
    expect(raw.cards.map((card: any) => card.legacyId)).toEqual(expectedIds);
    expect(raw.cards).toHaveLength(11);
    expect(raw.cards.filter((card: any) => card.verification.implementationStatus === 'complete').map((card: any) => card.legacyId)).toEqual(['s1a']);
    expect(raw.cards.filter((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toHaveLength(10);
    expect(raw.cards.every((card: any) => card.abilities.length === 1 && card.printedText.includes(card.abilities[0].printedClause))).toBe(true);
    const loaded = rules.loadAuthoringJson(raw);
    const report = rules.buildAuthoringAdapterReport(loaded, raw, archivePath);
    expect(report.summary.cards).toBe(11);
    // The archive verification boundary is preserved in raw cards; the adapter
    // report describes interpreter nodes (record_master_directive remains a
    // routable audit marker rather than a completed runtime implementation).
    expect(report.summary.hostAdjudicated).toBe(0);
    expect(report.summary.unsupported).toBe(10);
    expect(report.summary.textUnconfirmed).toBe(0);
  });

  it('executes the shared game-start provisioning contract for 天体学', () => {
    const raw = JSON.parse(readFileSync(archivePath, 'utf8'));
    const loaded = rules.loadAuthoringJson(raw);
    const astrology = loaded.cards['master.wodime.skill.s1a']!;
    expect(astrology.abilities[0]?.effects[0]).toMatchObject({
      type: 'provision_skill_cards',
      player: 'controller',
      targetDefinitionIds: ['master.wodime.skill.s2'],
    });

    // Use the shared interpreter seam, with the Wodime source card in the
    // same owner/skill zone shape used by the generic provisioning contract.
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.players[0]!.masterCardId = 'master.wodime';
    for (const definition of Object.values(loaded.cards)) definition.ownerId = 'master.wodime';
    loaded.cards['master.wodime.skill.s1a']!.initialZone = 'skill';
    rules.initializeAbilityRuntime(state, loaded, { seed: 42 });
    state.cards.push({
      instanceId: 'wodime-astrology-source',
      definitionId: 'master.wodime.skill.s1a',
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });

    rules.processAbilityEvent(state, { id: 'wodime-game-start', type: 'game_start' });

    expect(state.cards.filter((card) => card.definitionId === 'master.wodime.skill.s2')).toHaveLength(1);
    expect(state.cards.find((card) => card.definitionId === 'master.wodime.skill.s2')).toMatchObject({
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
      generatedBy: 'wodime-astrology-source',
    });
  });
});
