import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import { installMasterSupportOwnerCards } from '../src/match-session';

const archivePath = 'data/authoring/masters/master.wodime.json';
const expectedIds = ['ascension', 's1', 's1a', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];

describe('Wodime frozen authoring archive', () => {
  it('preserves all eleven source-grounded cards and bounded runtime status', () => {
    expect(existsSync(archivePath)).toBe(true);
    const raw = JSON.parse(readFileSync(archivePath, 'utf8'));
    expect(raw.id).toBe('master.wodime');
    expect(raw.cards.map((card: any) => card.legacyId)).toEqual(expectedIds);
    expect(raw.cards).toHaveLength(11);
    expect(raw.cards.filter((card: any) => card.verification.implementationStatus === 'complete').map((card: any) => card.legacyId)).toEqual(['ascension', 's1a']);
    expect(raw.cards.filter((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toHaveLength(9);
    expect(raw.cards.every((card: any) => card.abilities.every((ability: any) => card.printedText.includes(ability.printedClause)))).toBe(true);
    const loaded = rules.loadAuthoringJson(raw);
    const report = rules.buildAuthoringAdapterReport(loaded, raw, archivePath);
    expect(report.summary.cards).toBe(11);
    // The archive verification boundary is preserved in raw cards; the adapter
    // report describes interpreter nodes (record_master_directive remains a
    // routable audit marker rather than a completed runtime implementation).
    expect(report.summary.hostAdjudicated).toBe(0);
    expect(report.summary.unsupported).toBe(9);
    expect(report.summary.textUnconfirmed).toBe(0);
  });

  it('opens a private two-round game-start decision and provisions the orb', () => {
    const raw = JSON.parse(readFileSync(archivePath, 'utf8'));
    const loaded = rules.loadAuthoringJson(raw);
    for (const definition of Object.values(loaded.cards)) {
      definition.ownerId = 'master.wodime';
      if (definition.id !== 'master.wodime.skill.s2') definition.initialPlacement = 'outside_game';
    }
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.players[0]!.masterCardId = 'master.wodime';
    rules.initializeAbilityRuntime(state, loaded, { seed: 42 });
    installMasterSupportOwnerCards(state, loaded as any, { ownerId: 'master.wodime', playerId: 'p1' });
    rules.processAbilityEvent(state, { id: 'wodime-game-start', type: 'game_start' });
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.controllerId).toBe('p1');
    expect(decision.min).toBe(2);
    expect(decision.max).toBe(2);
    expect(decision.candidates).toEqual(Array.from({ length: 11 }, (_, i) => `round:${i + 1}`));
    expect(decision.interaction?.kind).toBe('wodime_astrology_rounds_v1');
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: ['round:2'],
    }).ok).toBe(false);
    expect(state.abilityRuntime!.pendingDecision?.id).toBe(decision.id);
    const validResult = rules.dispatchAbilityCommand(state, 'p1', {
      type: 'choose_target', decisionId: decision.id, selectedIds: ['round:2', 'round:7'],
    });
    expect(validResult.ok).toBe(true);
    expect(validResult.events).toContainEqual(expect.objectContaining({ type: 'wodime_astrology_rounds_recorded' }));
    expect(validResult.events.some((event: any) => 'roundNumbers' in event)).toBe(false);
    expect((state.abilityRuntime as any).wodimeAstrologyRoundsByPlayer.p1).toEqual([2, 7]);
    expect(state.cards.filter((card) => card.definitionId === 'master.wodime.skill.s2')).toHaveLength(1);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'wodime_astrology_rounds_recorded', sourceCardId: expect.stringContaining('master.wodime.skill.s1a'), visibility: 'p1' }));
    expect(state.abilityRuntime!.events.find((event: any) => event.type === 'wodime_astrology_rounds_recorded')).not.toHaveProperty('roundNumbers');
    expect(rules.projectAbilityState(state, 'p2').pendingDecision).toBeUndefined();
    state.round.roundNumber = 3;
    rules.processAbilityEvent(state, { id: 'wodime-ascension-win', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:1', battleId: 'battle-1', resultId: 'result-1', battlefieldId: 'shinto', battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p1'], loserIds: ['p2'] } });
    expect((state.abilityRuntime as any).wodimeAstrologyRoundsByPlayer.p1).toEqual([2, 4, 7]);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'wodime_astrology_ascension_round_recorded', visibility: 'p1' }));
    expect(state.abilityRuntime!.events.find((event: any) => event.type === 'wodime_astrology_ascension_round_recorded')).not.toHaveProperty('roundNumber');
    rules.processAbilityEvent(state, { id: 'wodime-ascension-win-repeat', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:1', battleId: 'battle-2', resultId: 'result-2', battlefieldId: 'shinto', battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p1'], loserIds: ['p2'] } });
    expect((state.abilityRuntime as any).wodimeAstrologyRoundsByPlayer.p1).toEqual([2, 4, 7]);
  });
});
