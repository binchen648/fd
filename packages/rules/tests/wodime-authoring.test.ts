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
    expect(raw.cards.filter((card: any) => card.verification.implementationStatus === 'complete').map((card: any) => card.legacyId)).toEqual(['ascension', 's1', 's1a', 's2']);
    expect(raw.cards.filter((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toHaveLength(7);
    expect(raw.cards.every((card: any) => card.abilities.every((ability: any) => card.printedText.includes(ability.printedClause)))).toBe(true);
    const loaded = rules.loadAuthoringJson(raw);
    const report = rules.buildAuthoringAdapterReport(loaded, raw, archivePath);
    expect(report.summary.cards).toBe(11);
    // The archive verification boundary is preserved in raw cards; the adapter
    // report describes interpreter nodes (record_master_directive remains a
    // routable audit marker rather than a completed runtime implementation).
    expect(report.summary.hostAdjudicated).toBe(0);
    expect(report.summary.unsupported).toBe(7);
    expect(report.summary.textUnconfirmed).toBe(0);
  });

  it('expands Atlantis at game start and pays exactly five God Legacy for Olympus in the action window', () => {
    const raw = JSON.parse(readFileSync(archivePath, 'utf8'));
    const loaded = rules.loadAuthoringJson(raw);
    for (const definition of Object.values(loaded.cards)) {
      definition.ownerId = 'master.wodime';
      if (definition.id !== 'master.wodime.skill.s2') definition.initialPlacement = 'outside_game';
    }
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.players[0]!.masterCardId = 'master.wodime';
    rules.initializeAbilityRuntime(state, loaded, { seed: 44 });
    installMasterSupportOwnerCards(state, loaded as any, { ownerId: 'master.wodime', playerId: 'p1' });
    rules.processAbilityEvent(state, { id: 'wodime-s1-game-start', type: 'game_start' });
    expect((state as any).modeState.wodimeAtlantisExpandedSkillIds).toEqual(['master.wodime.skill.s6']);
    expect((state as any).modeState.wodimeLocationLegacy).toEqual({ mountain: 3, city: 3 });
    const astrology = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: astrology.id, selectedIds: ['round:1', 'round:2'] }).ok).toBe(true);
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    (state.abilityRuntime as any).structuredPlayerFlagsByPlayer = { p1: { 'wodime.god_legacy': 6 } };
    const s1 = state.cards.find((card) => card.definitionId === 'master.wodime.skill.s1')!;
    const legal = rules.projectAbilityState(state, 'p1').legalActions;
    expect(legal).toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: s1.instanceId, abilityId: 'wodime.crypter.olympus' }));
    const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: s1.instanceId, abilityId: 'wodime.crypter.olympus' });
    expect(result.ok).toBe(true);
    expect((state as any).modeState.wodimeOlympusExpandedSkillIds).toEqual(['master.wodime.skill.s7', 'master.wodime.skill.s8', 'master.wodime.skill.s9']);
    expect((state.abilityRuntime as any).structuredPlayerFlagsByPlayer.p1['wodime.god_legacy']).toBe(1);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'wodime_olympus_expanded', visibility: 'public' }));
    expect(rules.projectAbilityState(state, 'p1').legalActions.some((action: any) => action.abilityId === 'wodime.crypter.olympus')).toBe(false);
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

  it('plays the generated orb in combat under the private round and zeros only other owned attacks', () => {
    const raw = JSON.parse(readFileSync(archivePath, 'utf8'));
    const loaded = rules.loadAuthoringJson(raw);
    (loaded.cards as any)['test.basic_attack'] = {
      id: 'test.basic_attack', name: 'Test Attack', cardType: 'basic_attack', ownerId: 'test',
      cardFace: { typeLabel: '攻击', attributes: ['力量'], cost: 0, basePower: 5 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
    };
    for (const definition of Object.values(loaded.cards)) {
      definition.ownerId = 'master.wodime';
      if (definition.id !== 'master.wodime.skill.s2') definition.initialPlacement = 'outside_game';
    }
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.players[0]!.masterCardId = 'master.wodime';
    rules.initializeAbilityRuntime(state, loaded, { seed: 43 });
    installMasterSupportOwnerCards(state, loaded as any, { ownerId: 'master.wodime', playerId: 'p1' });
    rules.processAbilityEvent(state, { id: 'wodime-game-start-play', type: 'game_start' });
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['round:2', 'round:7'] }).ok).toBe(true);
    const attackDefinition = loaded.cards['test.basic_attack'] as any;
    state.cards.push({ instanceId: 'wodime-other-attack', definitionId: attackDefinition.id, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
    state.cards.push({ instanceId: 'wodime-opponent-attack', definitionId: attackDefinition.id, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['wodime-other-attack'] = { active: true, faceDown: false, playedRound: 2, paidManaOnPlay: 0 };
    state.abilityRuntime!.cardState['wodime-opponent-attack'] = { active: true, faceDown: false, playedRound: 2, paidManaOnPlay: 0 };
    state.round.roundNumber = 3;
    state.round.activePhase = 'battle';
    state.round.prioritySeat = state.players[0]!.seat;
    const orb = state.cards.find((card) => card.definitionId === 'master.wodime.skill.s2')!;
    expect(rules.projectAbilityState(state, 'p1').legalActions.some((action: any) => action.type === 'play_card' && action.cardInstanceId === orb.instanceId)).toBe(false);
    state.round.roundNumber = 2;
    const beforePower = rules.calculateCardPower(state, 'wodime-other-attack').value;
    const legal = rules.projectAbilityState(state, 'p1').legalActions;
    expect(legal).toContainEqual({ type: 'play_card', cardInstanceId: orb.instanceId });
    expect(state.players[0]!.mana).toBeLessThan(8);
    const playResult = rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: orb.instanceId });
    expect(playResult.ok).toBe(true);
    expect(orb.zone).toBe('skill');
    expect(rules.calculateCardPower(state, 'wodime-other-attack').value).toBe(0);
    expect(rules.calculateCardPower(state, 'wodime-opponent-attack').value).toBeGreaterThan(0);
    expect(beforePower).toBeGreaterThan(0);
    state.cards.push({ instanceId: 'wodime-late-attack', definitionId: attackDefinition.id, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState['wodime-late-attack'] = { active: true, faceDown: false, playedRound: 2, paidManaOnPlay: 0 };
    expect(rules.calculateCardPower(state, 'wodime-late-attack').value).toBe(0);
    state.abilityRuntime!.cardState[orb.instanceId]!.active = false;
    expect(rules.calculateCardPower(state, 'wodime-other-attack').value).toBeGreaterThan(0);
    expect(rules.calculateCardPower(state, 'wodime-late-attack').value).toBeGreaterThan(0);
    state.abilityRuntime!.cardState[orb.instanceId]!.active = true;
    state.round.roundNumber = 3;
    expect(rules.calculateCardPower(state, 'wodime-late-attack').value).toBeGreaterThan(0);
    state.round.roundNumber = 2;
    const forged = { instanceId: 'wodime-forged-orb', definitionId: 'master.wodime.skill.s2', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } } as any;
    state.cards.push(forged);
    state.abilityRuntime!.cardState[forged.instanceId] = { active: false, faceDown: false, playedRound: 2 };
    expect(rules.projectAbilityState(state, 'p1').legalActions.some((action: any) => action.type === 'play_card' && action.cardInstanceId === forged.instanceId)).toBe(false);
  });
});
