import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import { createMatchSession, installMasterSupportOwnerCards, restoreMatchSession } from '../src/match-session';
import { isWodimeGodLegacyRuntimeStateValid } from '../src/ability/wodime-god-legacy-capability';

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
    expect(state.eventDeck?.filter((id) => id === 'event.wodime.atlantis.hephaestus')).toHaveLength(6);
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
    expect(state.eventDeck?.filter((id) => id === 'event.wodime.olympus.zeus')).toHaveLength(2);
    expect(state.eventDeck?.filter((id) => id === 'event.wodime.olympus.aphrodite')).toHaveLength(2);
    expect(state.eventDeck?.filter((id) => id === 'event.wodime.olympus.demeter')).toHaveLength(2);
    expect((state.abilityRuntime as any).structuredPlayerFlagsByPlayer.p1['wodime.god_legacy']).toBe(1);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'wodime_olympus_expanded', visibility: 'public' }));
    expect(rules.projectAbilityState(state, 'p1').legalActions.some((action: any) => action.abilityId === 'wodime.crypter.olympus')).toBe(false);
  });

  it('draws, places, and restores a Wodime event through the canonical event directory', () => {
    const session = createMatchSession({ seed: 101, humanPlayerId: 'p1', restorePackKind: 'production_executable' });
    session.state.eventDeck = ['event.wodime.atlantis.hephaestus'];
    (session as any).startRound(2, session.state);
    expect(session.state.eventDeck).toEqual([]);
    expect(session.state.eventPlacements.find((event: any) => event.eventCardId === 'event.wodime.atlantis.hephaestus')).toMatchObject({
      eventCardId: 'event.wodime.atlantis.hephaestus',
      victoryPoints: 0,
    });
    const restored = restoreMatchSession(session.serializeSession(), { restorePackKind: 'production_executable' });
    expect(restored.state.eventDeck).toEqual([]);
    expect(restored.state.eventPlacements.map((event) => event.eventCardId)).toContain('event.wodime.atlantis.hephaestus');
  });

  it('settles Atlantis reveals through the real event placement path with idempotent replacement', () => {
    const raw = JSON.parse(readFileSync(archivePath, 'utf8'));
    const loaded = rules.loadAuthoringJson(raw);
    for (const definition of Object.values(loaded.cards)) { definition.ownerId = 'master.wodime'; definition.initialPlacement = 'outside_game'; }
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = []; state.players[0]!.masterCardId = 'master.wodime';
    rules.initializeAbilityRuntime(state, loaded, { seed: 99 });
    installMasterSupportOwnerCards(state, loaded as any, { ownerId: 'master.wodime', playerId: 'p1' });
    const battlefield = { locationId: 'shinto' as const, eventCardId: 'event.wodime.atlantis.hephaestus', ruleInstanceId: 'wodime-atlantis-battle-1', visibility: { scope: 'public' as const }, victoryPoints: 0 };
    state.eventPlacements = [battlefield];
    rules.processAbilitySystemEvent(state, 'wodime-atlantis-reveal', { type: 'event_activated', sourceCardId: battlefield.ruleInstanceId, revealedKind: 'event', revealedId: battlefield.eventCardId, locationId: battlefield.locationId });
    expect(state.eventPlacements).toHaveLength(1);
    expect((state.abilityRuntime as any).wodimeAtlantisPendingBattlefieldRemovalIds).toEqual({ [battlefield.ruleInstanceId]: true });
    rules.processAbilitySystemEvent(state, 'wodime-atlantis-close', { type: 'after_battle_ended', battlefieldId: 'shinto' });
    expect(state.eventPlacements).toHaveLength(1);
    expect(state.eventPlacements[0]!.ruleInstanceId).not.toBe(battlefield.ruleInstanceId);
    const nonBattle = { locationId: 'clock_tower' as const, eventCardId: 'event.wodime.atlantis.hephaestus', ruleInstanceId: 'wodime-atlantis-nonbattle-1', visibility: { scope: 'public' as const }, victoryPoints: 0 };
    state.eventPlacements = [nonBattle]; state.eventDeck = ['event.wodime.atlantis.hephaestus'];
    rules.processAbilitySystemEvent(state, 'wodime-atlantis-reveal-nonbattle', { type: 'event_activated', sourceCardId: nonBattle.ruleInstanceId, revealedKind: 'event', revealedId: nonBattle.eventCardId, locationId: nonBattle.locationId });
    expect(state.eventPlacements).toHaveLength(1);
    expect(state.eventPlacements[0]!.ruleInstanceId).not.toBe(nonBattle.ruleInstanceId);
    const replacementId = state.eventPlacements[0]!.ruleInstanceId;
    rules.processAbilitySystemEvent(state, 'wodime-atlantis-replay-nonbattle', { type: 'event_activated', sourceCardId: nonBattle.ruleInstanceId, revealedKind: 'event', revealedId: nonBattle.eventCardId, locationId: nonBattle.locationId });
    expect(state.eventPlacements[0]!.ruleInstanceId).toBe(replacementId);
  });

  it('activates God Legacy at the real elimination transition before the first later event reveal', () => {
    const raw = JSON.parse(readFileSync(archivePath, 'utf8'));
    const loaded = rules.loadAuthoringJson(raw);
    for (const definition of Object.values(loaded.cards)) { definition.ownerId = 'master.wodime'; definition.initialPlacement = 'outside_game'; }
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = []; state.players[0]!.masterCardId = 'master.wodime';
    rules.initializeAbilityRuntime(state, loaded, { seed: 100 });
    installMasterSupportOwnerCards(state, loaded as any, { ownerId: 'master.wodime', playerId: 'p1' });
    state.battleResults = [{ battlefieldId: 'shinto', winnerPlayerId: 'p2', winnerPlayerIds: ['p2'], margin: 1, vpReward: 0, participantBreakdowns: [], militaryAdjustments: [{ playerId: 'p1', delta: -8 }, { playerId: 'p2', delta: 8 }] }];
    const scored = rules.applyBattleScoring(state).nextState;
    expect(scored.players.find((player) => player.id === 'p1')!.status).toBe('eliminated');
    scored.eventPlacements = [{ locationId: 'shinto', eventCardId: 'event.wodime.atlantis.hephaestus', ruleInstanceId: 'wodime-atlantis-after-elimination', visibility: { scope: 'public' }, victoryPoints: 0 }];
    rules.processAbilitySystemEvent(scored, 'wodime-after-elimination-reveal', { type: 'event_activated', sourceCardId: 'wodime-atlantis-after-elimination', revealedKind: 'event', revealedId: 'event.wodime.atlantis.hephaestus', locationId: 'shinto' });
    expect((scored.abilityRuntime as any).wodimeGodLegacyActivation).toMatchObject({ controllerId: 'p1', abilityId: 'wodime.god-legacy' });
    expect((scored.abilityRuntime as any).wodimeGodLegacyByLocation.shinto.tokens).toBe(3);
  });

  it('transfers authenticated God Legacy from a placed location on a unique battle win and survives restore', () => {
    const raw = JSON.parse(readFileSync(archivePath, 'utf8'));
    const loaded = rules.loadAuthoringJson(raw);
    for (const definition of Object.values(loaded.cards)) {
      definition.ownerId = 'master.wodime';
      definition.initialPlacement = 'outside_game';
    }
    const session = createMatchSession({ seed: 77, humanPlayerId: 'p1', restorePackKind: 'production_executable' });
    const state = session.state;
    state.cards = [];
    state.players[0]!.masterCardId = 'master.wodime';
    delete state.abilityRuntime;
    rules.initializeAbilityRuntime(state, loaded, { seed: 77 });
    installMasterSupportOwnerCards(state, loaded as any, { ownerId: 'master.wodime', playerId: 'p1' });
    const wodime = state.players.find((player) => player.id === 'p1')!;
    wodime.status = 'eliminated';
    state.eventPlacements.push({ locationId: 'shinto', eventCardId: 'event.wodime.atlantis.hephaestus', victoryPoints: 0, visibility: { scope: 'public' } });
    state.eventPlacements.push({ locationId: 'shinto', eventCardId: 'event.wodime.atlantis.hephaestus', victoryPoints: 0, visibility: { scope: 'public' } });
    state.eventPlacements.push({ locationId: 'magic_workshop', eventCardId: 'event.wodime.atlantis.hephaestus', victoryPoints: 0, visibility: { scope: 'public' } });
    rules.processAbilityEvent(state, { id: 'wodime-god-legacy-win', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:1', battleId: 'battle-legacy', resultId: 'result-legacy', battlefieldId: 'shinto', battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p2'], loserIds: ['p1'] } });
    expect((state.abilityRuntime as any).wodimeGodLegacyByLocation.shinto.tokens).toBe(0);
    expect((state.abilityRuntime as any).wodimeGodLegacyByLocation.magic_workshop.tokens).toBe(3);
    expect((state.abilityRuntime as any).wodimeGodLegacyByPlayer.p2).toBe(6);
    expect((state.abilityRuntime as any).wodimeGodLegacyActivation).toMatchObject({ sourceCardId: expect.any(String), controllerId: 'p1', lifecycle: 'game' });
    const restorePack = createMatchSession({ seed: 78, humanPlayerId: 'p1', restorePackKind: 'production_executable' });
    state.abilityRuntime!.pack = restorePack.state.abilityRuntime!.pack;
    (session as any).checkpoint('wodime-god-legacy-restore');
    const serialized = session.serializeSession();
    const restored = restoreMatchSession(serialized, { restorePackKind: 'production_executable' });
    expect((restored.state.abilityRuntime as any).wodimeGodLegacyByLocation.magic_workshop.tokens).toBe(3);
    expect((restored.state.abilityRuntime as any).wodimeGodLegacyByPlayer.p2).toBe(6);
    expect((restored.state.abilityRuntime as any).wodimeGodLegacyActivation).toMatchObject({ controllerId: 'p1', abilityId: 'wodime.god-legacy', lifecycle: 'game' });
    expect(isWodimeGodLegacyRuntimeStateValid(state)).toBe(true);
    // A later Hephaestus placement is a new physical source and must add once;
    // replaying the same event must not double-count it.
    state.eventPlacements.push({ locationId: 'magic_workshop', eventCardId: 'event.wodime.atlantis.hephaestus', victoryPoints: 0, visibility: { scope: 'public' } });
    rules.processAbilityEvent(state, { id: 'wodime-god-legacy-refresh', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:2', battleId: 'battle-legacy-2', resultId: 'result-legacy-2', battlefieldId: 'magic_workshop', battleParticipantIds: ['p2'], battleResult: { winners: ['p2'], loserIds: [] } });
    rules.processAbilityEvent(state, { id: 'wodime-god-legacy-refresh-replay', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:2', battleId: 'battle-legacy-2', resultId: 'result-legacy-2', battlefieldId: 'magic_workshop', battleParticipantIds: ['p2'], battleResult: { winners: ['p2'], loserIds: [] } });
    expect((state.abilityRuntime as any).wodimeGodLegacyByPlayer.p2).toBe(12);
    expect(Object.keys((state.abilityRuntime as any).wodimeGodLegacyProcessedPlacementIds)).toHaveLength(4);
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players.find((player) => player.id === 'p2')!.seat;
    expect(rules.projectAbilityState(state, 'p2').legalActions).toContainEqual({ type: 'wodime_god_legacy_action', mode: 'power', amount: 1 });
    expect(rules.dispatchAbilityCommand(state, 'p2', { type: 'wodime_god_legacy_action', mode: 'power', amount: 1 }).ok).toBe(true);
    expect((state.abilityRuntime as any).wodimeGodLegacyByPlayer.p2).toBe(9);
    expect((state.abilityRuntime as any).roundPlayerPowerAdjustments).toContainEqual(expect.objectContaining({ playerId: 'p2', amount: 1, abilityId: 'wodime.god-legacy' }));
    state.players.find((player) => player.id === 'p2')!.mana = 11;
    state.abilityRuntime!.manaGainBlocked.push('p2');
    expect(rules.dispatchAbilityCommand(state, 'p2', { type: 'wodime_god_legacy_action', mode: 'mana', amount: 1 }).ok).toBe(true);
    expect(state.players.find((player) => player.id === 'p2')!.mana).toBe(11);
    state.abilityRuntime!.manaGainBlocked = state.abilityRuntime!.manaGainBlocked.filter((id) => id !== 'p2');
    state.eventPlacements.push({ locationId: 'shinto', eventCardId: 'event.wodime.atlantis.hephaestus', victoryPoints: 0, visibility: { scope: 'public' } });
    rules.processAbilityEvent(state, { id: 'wodime-god-legacy-refresh-2', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:3', battleId: 'battle-legacy-3', resultId: 'result-legacy-3', battlefieldId: 'shinto', battleParticipantIds: ['p2'], battleResult: { winners: ['p2'], loserIds: [] } });
    expect(rules.dispatchAbilityCommand(state, 'p2', { type: 'wodime_god_legacy_action', mode: 'mana', amount: 1 }).ok).toBe(true);
    expect(state.players.find((player) => player.id === 'p2')!.mana).toBe(12);
    expect(state.abilityRuntime!.manaGainedThisRound.byPlayer.p2).toBe(1);
    (session as any).checkpoint('wodime-god-legacy-after-payer-action');
    const payerRestored = restoreMatchSession(session.serializeSession(), { restorePackKind: 'production_executable' });
    expect((payerRestored.state.abilityRuntime as any).wodimeGodLegacyByPlayer.p2).toBe(4);
    expect(payerRestored.state.players.find((player) => player.id === 'p2')!.mana).toBe(12);
    expect((payerRestored.state.abilityRuntime as any).roundPlayerPowerAdjustments).toContainEqual(expect.objectContaining({ playerId: 'p2', amount: 1, abilityId: 'wodime.god-legacy' }));
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
