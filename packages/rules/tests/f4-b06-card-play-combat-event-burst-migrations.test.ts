import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { AbilityDefinitionPack } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const MOZART = 'servant.mozart.skill.sc-mozart-2';
const AMAKUSA = 'servant.amakusa.skill.sc-amakusa-1';
const RETURN_SILENCE = 'master.olga-marie.skill.trismegistus-grief';
const SHINTO = 'shinto';
const MIYAMA = 'miyama_town';
const E1 = 'event.b06.one';
const E2 = 'event.b06.two';
const E3 = 'event.b06.hidden';

function raw(file: string): any { return JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
function loaded(file: string) {
  const p = rules.loadAuthoringJson(raw(file));
  expect(p.report).toEqual([]);
  return p;
}
function pack(): AbilityDefinitionPack {
  const mozart = loaded('data/authoring/servants/servant.mozart.json');
  const amakusa = loaded('data/authoring/servants/servant.amakusa.json');
  const olga = loaded('data/authoring/masters/master.olga-marie.json');
  return {
    cards: { ...mozart.cards, ...amakusa.cards, ...olga.cards },
    eventCatalog: {
      [E1]: { id: E1, tags: [], eventSetIds: ['b06'], printedReward: 2 },
      [E2]: { id: E2, tags: [], eventSetIds: ['b06'], printedReward: 6 },
      [E3]: { id: E3, tags: [], eventSetIds: ['b06'], printedReward: 4 },
    },
  };
}
function physical(instanceId: string, definitionId: string, controller = 'p1', zone = 'skill') {
  return { instanceId, definitionId, ownerPlayerId: controller, controllerPlayerId: controller, zone,
    visibility: { scope: zone === 'skill' || zone === 'hand' ? 'owner_only' as const : 'public' as const,
      ...(zone === 'skill' || zone === 'hand' ? { ownerPlayerId: controller } : {}) } };
}
function setup(cards: GameState['cards'], placements: GameState['eventPlacements'] = []) {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  state.cards = cards; state.eventPlacements = structuredClone(placements); state.eventOutsideGame = []; state.eventDiscardPile = [];
  for (const player of state.players) { player.mana = 30; player.vp = 10; player.military = 20; player.locationId = SHINTO as any; }
  rules.initializeAbilityRuntime(state, pack(), { seed: 20260923 });
  for (const card of cards) state.abilityRuntime!.cardState[card.instanceId] = {
    active: card.zone === 'attack_area' || card.zone === 'field', faceDown: false, playedRound: state.round.roundNumber,
  };
  return state;
}
function bridgeSession(state: GameState) {
  const session = rules.createMatchSession({ seed: 20260923, humanPlayerIds: ['p1', 'p2'] });
  session.state = state;
  return session as unknown as typeof session & {
    queuePostScoringBattleEvents(battles: GameState['battleResults'], logs: GameState['log']): void;
    flushPostScoringBattleEvents(): void;
  };
}
function queueRealBattle(state: GameState, battlefieldId = MIYAMA) {
  state.round.activePhase = 'battle';
  const resolved = rules.resolveBattlefield(state, { battlefieldId: battlefieldId as any, participants: [
    { playerId: 'p2', totalPower: 9 }, { playerId: 'p3', totalPower: 2 },
  ] }).nextState;
  const battles = structuredClone(resolved.battleResults);
  const priorLogLength = resolved.log.length;
  const scored = rules.applyBattleScoring(resolved).nextState;
  const session = bridgeSession(scored);
  session.queuePostScoringBattleEvents(battles, scored.log.slice(priorLogLength));
  return { session, battle: battles.at(-1)! };
}
function authoringFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name); return entry.isDirectory() ? authoringFiles(full) : entry.name.endsWith('.json') ? [full] : [];
  });
}
function materialIds(): string[] {
  return [...authoringFiles('data/authoring/masters'), ...authoringFiles('data/authoring/servants')]
    .flatMap((file) => (raw(file).cards ?? []).map((card: any) => String(card.id)));
}
function frozenIds(): Set<string> {
  const root = raw('data/phase3/full-roster-ability-inventory.json'); const ids = new Set<string>();
  const walk = (value: any): void => {
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (!value || typeof value !== 'object') return;
    if (typeof value.canonicalAbilityId === 'string') ids.add(value.canonicalAbilityId);
    Object.values(value).forEach(walk);
  };
  walk(root); return ids;
}

describe('P3 F4 B06 card-play/combat/event-burst migration batch', () => {
  it('loads both exact archives blocker-free and rehashes frozen F1 text/clauses', () => {
    const mozart = raw('data/authoring/servants/servant.mozart.json').cards.find((c: any) => c.id === MOZART);
    const amakusa = raw('data/authoring/servants/servant.amakusa.json').cards.find((c: any) => c.id === AMAKUSA);
    expect(loaded('data/authoring/servants/servant.mozart.json').cards[MOZART]).toBeDefined();
    expect(loaded('data/authoring/servants/servant.amakusa.json').cards[AMAKUSA]).toBeDefined();
    const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
    expect(hash(mozart.printedText)).toBe('b1b18ffc80d9a85914f9fc90b95469b1372a31322218fc778851b0779ac4b12a');
    expect(mozart.abilities.map((a: any) => hash(a.printedClause))).toEqual([
      'a1af22a53734a6842fe1576f82f9d7cb6ad102f6398e07bb119d859eadb29e06',
      '8e60f41d9c1a4e92cd5ae6f3d12e6382da4461256d667d39e70cd49106cb4325',
    ]);
    expect(hash(amakusa.printedText)).toBe('0433a725f2387014fcf77515757e539e1718da23952014515e7f2bd3ba7d4b88');
    expect(hash(amakusa.abilities[0].printedClause)).toBe('40ca176f770bc55f453580c51729752eebcab51af6377ac7ca893764bb7027af');
  });

  it('fails closed on widened B06 reserved envelopes', () => {
    const mozart = raw('data/authoring/servants/servant.mozart.json');
    mozart.cards.find((c: any) => c.id === MOZART).abilities[0].effects[0].amount = 1;
    expect(rules.loadAuthoringJson(mozart).report.some((entry) => entry.path.includes('batchCardPlayCombatEventBurst.gateway'))).toBe(true);
    const amakusa = raw('data/authoring/servants/servant.amakusa.json');
    amakusa.cards.find((c: any) => c.id === AMAKUSA).abilities[0].limit.uses = 2;
    expect(rules.loadAuthoringJson(amakusa).report.some((entry) => entry.path.includes('batchCardPlayCombatEventBurst.gateway'))).toBe(true);
  });

  it('Amakusa removes every public event, preserves hidden events, and gains exactly twice removed printed VP for this round', () => {
    const state = setup([physical('amakusa-source', AMAKUSA)], [
      { locationId: SHINTO as any, eventCardId: E1, victoryPoints: 2, visibility: { scope: 'public' } },
      { locationId: MIYAMA as any, eventCardId: E2, victoryPoints: 6, visibility: { scope: 'public' } },
      { locationId: MIYAMA as any, eventCardId: E3, victoryPoints: 4, visibility: { scope: 'hidden_until_trigger' } },
    ]);
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'amakusa-source' }]);
    expect(state.eventPlacements.map((entry) => entry.eventCardId)).toEqual([E3]);
    expect(state.eventOutsideGame).toEqual(expect.arrayContaining([E1, E2]));
    expect(state.eventOutsideGame).not.toContain(E3);
    expect(state.abilityRuntime!.b06EventBurstBonuses).toHaveLength(1);
    expect(state.abilityRuntime!.b06EventBurstBonuses![0]!.amount).toBe(16);
    expect(rules.calculateCardPower(state, 'amakusa-source').value).toBe(16);
    rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
    expect(rules.calculateCardPower(state, 'amakusa-source').value).toBe(0);
  });

  it('Amakusa keeps its round X even if a removed event later returns to the battlefield', () => {
    const state = setup([physical('amakusa-source', AMAKUSA)], [
      { locationId: SHINTO as any, eventCardId: E1, victoryPoints: 2, visibility: { scope: 'public' } },
      { locationId: MIYAMA as any, eventCardId: E2, victoryPoints: 6, visibility: { scope: 'public' } },
    ]);
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'amakusa-source' }]);
    expect(rules.calculateCardPower(state, 'amakusa-source').value).toBe(16);
    const candidate = rules.listEventRuleCandidates(state, state.abilityRuntime!.pack, ['event_outside_game']).find((entry) => entry.eventCardId === E1)!;
    rules.moveEventRuleCandidates(state, state.abilityRuntime!.pack, [candidate.token], 'event_battlefield', { locationId: MIYAMA, visibility: 'public' });
    expect(state.eventPlacements.some((entry) => entry.eventCardId === E1)).toBe(true);
    expect(rules.calculateCardPower(state, 'amakusa-source').value).toBe(16);
  });

  it('Amakusa supports a zero-public-event burst and remains once-per-game', () => {
    const state = setup([physical('amakusa-source', AMAKUSA)], [
      { locationId: SHINTO as any, eventCardId: E3, victoryPoints: 4, visibility: { scope: 'hidden_until_trigger' } },
    ]);
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'amakusa-source' }]);
    expect(rules.calculateCardPower(state, 'amakusa-source').value).toBe(0);
    expect(state.eventPlacements.map((entry) => entry.eventCardId)).toEqual([E3]);
    state.cards.find((card) => card.instanceId === 'amakusa-source')!.zone = 'skill';
    state.abilityRuntime!.cardState['amakusa-source'] = { ...state.abilityRuntime!.cardState['amakusa-source']!, active: false, faceDown: false };
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
    expect(rules.getLegalActions(state, 'p1').some((action) => action.type === 'play_card' && action.cardInstanceId === 'amakusa-source')).toBe(false);
    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'amakusa-source' }])).toThrow(/Card cannot be played/);
  });

  it('Amakusa persisted burst rejects coordinated amount/log inflation', () => {
    const state = setup([physical('amakusa-source', AMAKUSA)], [
      { locationId: SHINTO as any, eventCardId: E1, victoryPoints: 2, visibility: { scope: 'public' } },
    ]);
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'amakusa-source' }]);
    const receipt = state.abilityRuntime!.b06EventBurstBonuses![0]!;
    receipt.amount += 2;
    state.log[receipt.logIndex]!.payload!.amount = receipt.amount;
    expect(() => rules.calculateCardPower(state, 'amakusa-source')).toThrow(/B06_EVENT_BURST_STATE_INVALID/);
  });

  it('Amakusa rejects coordinated moved-event, amount, token, and log inflation against the server-owned burst root', () => {
    const state = setup([physical('amakusa-source', AMAKUSA)], [
      { locationId: SHINTO as any, eventCardId: E1, victoryPoints: 2, visibility: { scope: 'public' } },
    ]);
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'amakusa-source' }]);
    const receipt = state.abilityRuntime!.b06EventBurstBonuses![0]!;
    const fakeToken = `event_battlefield:${receipt.eventRuleZoneRevisionBefore}:9:${E2}:`;
    receipt.sourceTokens.push(fakeToken);
    receipt.movedEvents.push({ eventCardId: E2, locationId: MIYAMA, victoryPoints: 6 });
    receipt.amount += 12;
    const payload = state.log[receipt.logIndex]!.payload!;
    payload.sourceTokens = structuredClone(receipt.sourceTokens);
    payload.movedEvents = structuredClone(receipt.movedEvents);
    payload.amount = receipt.amount;
    expect(() => rules.calculateCardPower(state, 'amakusa-source')).toThrow(/B06_EVENT_BURST_STATE_INVALID/);
  });

  it('Mozart arms from its real face-up play and punishes losers in a different battlefield by exact printed event VP', () => {
    const state = setup([physical('mozart-source', MOZART)], [
      { locationId: MIYAMA as any, eventCardId: E1, victoryPoints: 2, visibility: { scope: 'public' } },
      { locationId: MIYAMA as any, eventCardId: E3, victoryPoints: 4, visibility: { scope: 'hidden_until_trigger' } },
    ]);
    state.players.find((p) => p.id === 'p1')!.locationId = SHINTO as any;
    state.players.find((p) => p.id === 'p2')!.locationId = MIYAMA as any;
    state.players.find((p) => p.id === 'p3')!.locationId = MIYAMA as any;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'mozart-source' }]);
    expect(state.abilityRuntime!.b06RoundPunishmentArms).toHaveLength(1);
    const queued = queueRealBattle(state, MIYAMA);
    expect(queued.battle.printedEventVpTotal).toBe(6);
    const before = queued.session.state.players.find((p) => p.id === 'p3')!.vp;
    queued.session.flushPostScoringBattleEvents();
    expect(queued.session.state.players.find((p) => p.id === 'p3')!.vp).toBe(Math.max(0, before - 6));
    expect(Object.values(queued.session.state.abilityRuntime!.trustedVictoryPointChanges ?? {})).toContainEqual(expect.objectContaining({
      playerId: 'p3', delta: -Math.min(before, 6), before, after: Math.max(0, before - 6),
    }));
  });

  it('Mozart still punishes a frozen combat loser whose ordinary loss effects are suppressed by Basic Luck', () => {
    const state = setup([
      physical('mozart-source', MOZART),
      physical('p3-luck', 'basic.luck', 'p3', 'attack_area'),
    ], [{ locationId: MIYAMA as any, eventCardId: E1, victoryPoints: 2, visibility: { scope: 'public' } }]);
    state.players.find((p) => p.id === 'p1')!.locationId = SHINTO as any;
    state.players.find((p) => p.id === 'p2')!.locationId = MIYAMA as any;
    state.players.find((p) => p.id === 'p3')!.locationId = MIYAMA as any;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'mozart-source' }]);
    const queued = queueRealBattle(state, MIYAMA);
    expect(queued.battle.lossEffectSuppressedPlayerIds).toContain('p3');
    const before = queued.session.state.players.find((p) => p.id === 'p3')!.vp;
    queued.session.flushPostScoringBattleEvents();
    expect(queued.session.state.players.find((p) => p.id === 'p3')!.vp).toBe(Math.max(0, before - 2));
  });


  it('Mozart accepts authoritative Return Silence through the MatchSession post-scoring producer', () => {
    const state = setup([
      physical('mozart-source', MOZART),
      physical('return-silence-source', RETURN_SILENCE, 'p2', 'field'),
    ], [{ locationId: MIYAMA as any, eventCardId: E1, victoryPoints: 2, visibility: { scope: 'public' } }]);
    state.players.find((p) => p.id === 'p1')!.locationId = SHINTO as any;
    state.players.find((p) => p.id === 'p2')!.locationId = MIYAMA as any;
    state.players.find((p) => p.id === 'p3')!.locationId = MIYAMA as any;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'mozart-source' }]);
    state.abilityRuntime!.transformedReturnSilenceSourceCardIds = ['return-silence-source'];
    state.round.activePhase = 'battle';
    const resolved = rules.resolveBattlefield(state, { battlefieldId: MIYAMA as any, participants: [
      { playerId: 'p2', totalPower: 1 }, { playerId: 'p3', totalPower: 99 },
    ] }).nextState;
    expect(resolved.log.findLast((entry) => entry.type === 'battle_resolved')?.message).toBe(`return_silence:${MIYAMA}`);
    const battles = structuredClone(resolved.battleResults);
    const priorLogLength = resolved.log.length;
    const scored = rules.applyBattleScoring(resolved).nextState;
    const session = bridgeSession(scored);
    expect(() => session.queuePostScoringBattleEvents(battles, scored.log.slice(priorLogLength))).not.toThrow();
    const snapshot = Object.values(session.state.abilityRuntime!.b06BattleEventVpSnapshots ?? {})[0]!;
    expect(snapshot).toMatchObject({ battleLogKind: 'return_silence', returnSilenceSourceCardId: 'return-silence-source', eventVpTotal: 2 });
    const before = session.state.players.find((p) => p.id === 'p3')!.vp;
    session.flushPostScoringBattleEvents();
    expect(session.state.players.find((p) => p.id === 'p3')!.vp).toBe(Math.max(0, before - 2));
  });

  it('Mozart accepts authoritative Return Silence through the core game-loop producer', () => {
    const state = setup([
      physical('mozart-source', MOZART),
      physical('return-silence-source', RETURN_SILENCE, 'p2', 'field'),
    ], [{ locationId: MIYAMA as any, eventCardId: E1, victoryPoints: 2, visibility: { scope: 'public' } }]);
    state.players.find((p) => p.id === 'p1')!.locationId = SHINTO as any;
    state.players.find((p) => p.id === 'p2')!.locationId = MIYAMA as any;
    state.players.find((p) => p.id === 'p3')!.locationId = MIYAMA as any;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'mozart-source' }]);
    state.abilityRuntime!.transformedReturnSilenceSourceCardIds = ['return-silence-source'];
    state.round.activePhase = 'battle';
    const before = state.players.find((p) => p.id === 'p3')!.vp;
    const next = rules.stepGameLoop(state).nextState;
    expect(next.log.some((entry) => entry.type === 'battle_resolved' && entry.message === `return_silence:${MIYAMA}`)).toBe(true);
    expect(Object.values(next.abilityRuntime!.b06BattleEventVpSnapshots ?? {})).toContainEqual(expect.objectContaining({
      battleLogKind: 'return_silence', returnSilenceSourceCardId: 'return-silence-source', eventVpTotal: 2,
    }));
    expect(next.players.find((p) => p.id === 'p3')!.vp).toBe(Math.max(0, before - 2));
  });
  it('Mozart does not leak its play-round arm into the next round', () => {
    const state = setup([physical('mozart-source', MOZART)], [
      { locationId: MIYAMA as any, eventCardId: E1, victoryPoints: 2, visibility: { scope: 'public' } },
    ]);
    state.players.find((p) => p.id === 'p2')!.locationId = MIYAMA as any;
    state.players.find((p) => p.id === 'p3')!.locationId = MIYAMA as any;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'mozart-source' }]);
    rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
    const queued = queueRealBattle(state, MIYAMA);
    const before = queued.session.state.players.find((p) => p.id === 'p3')!.vp;
    queued.session.flushPostScoringBattleEvents();
    expect(queued.session.state.players.find((p) => p.id === 'p3')!.vp).toBe(before);
  });

  it('Mozart battle snapshot rejects coordinated placement/snapshot/snapshot-log/battle-log inflation before any loser VP mutation', () => {
    const state = setup([physical('mozart-source', MOZART)], [
      { locationId: MIYAMA as any, eventCardId: E1, victoryPoints: 2, visibility: { scope: 'public' } },
    ]);
    state.players.find((p) => p.id === 'p2')!.locationId = MIYAMA as any;
    state.players.find((p) => p.id === 'p3')!.locationId = MIYAMA as any;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'mozart-source' }]);
    const queued = queueRealBattle(state, MIYAMA);
    const snapshot = Object.values(queued.session.state.abilityRuntime!.b06BattleEventVpSnapshots!)[0]!;
    const before = queued.session.state.players.find((p) => p.id === 'p3')!.vp;
    snapshot.placementFacts.push({ eventCardId: E2, locationId: MIYAMA, victoryPoints: 6 });
    snapshot.eventVpTotal += 6;
    const snapshotPayload = queued.session.state.log[snapshot.snapshotLogIndex]!.payload!;
    snapshotPayload.placementFacts = structuredClone(snapshot.placementFacts);
    snapshotPayload.eventVpTotal = snapshot.eventVpTotal;
    queued.session.state.log[snapshot.battleLogIndex]!.payload!.printedEventVpTotal = snapshot.eventVpTotal;
    expect(() => queued.session.flushPostScoringBattleEvents()).toThrow(/B06_BATTLE_EVENT_VP_STATE_INVALID/);
    expect(queued.session.state.players.find((p) => p.id === 'p3')!.vp).toBe(before);
  });

  it('Mozart standard snapshot rejects a fabricated non-participant loser before any VP mutation', () => {
    const state = setup([physical('mozart-source', MOZART)], [
      { locationId: MIYAMA as any, eventCardId: E1, victoryPoints: 2, visibility: { scope: 'public' } },
    ]);
    state.players.find((p) => p.id === 'p1')!.locationId = SHINTO as any;
    state.players.find((p) => p.id === 'p2')!.locationId = MIYAMA as any;
    state.players.find((p) => p.id === 'p3')!.locationId = MIYAMA as any;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'mozart-source' }]);
    const queued = queueRealBattle(state, MIYAMA);
    const snapshot = Object.values(queued.session.state.abilityRuntime!.b06BattleEventVpSnapshots!)[0]!;
    expect(snapshot.battleLogKind).toBe('standard');
    expect(snapshot.battleParticipantIds).toEqual(['p2', 'p3']);
    expect(snapshot.loserIds).toEqual(['p3']);
    const p1Before = queued.session.state.players.find((p) => p.id === 'p1')!.vp;
    const p3Before = queued.session.state.players.find((p) => p.id === 'p3')!.vp;
    snapshot.battleParticipantIds.push('p1');
    snapshot.loserIds.push('p1');
    const snapshotPayload = queued.session.state.log[snapshot.snapshotLogIndex]!.payload!;
    snapshotPayload.battleParticipantIds = structuredClone(snapshot.battleParticipantIds);
    snapshotPayload.loserIds = structuredClone(snapshot.loserIds);
    expect(() => queued.session.flushPostScoringBattleEvents()).toThrow(/B06_BATTLE_EVENT_VP_STATE_INVALID/);
    expect(queued.session.state.players.find((p) => p.id === 'p1')!.vp).toBe(p1Before);
    expect(queued.session.state.players.find((p) => p.id === 'p3')!.vp).toBe(p3Before);
    const battlePayload = queued.session.state.log[snapshot.battleLogIndex]!.payload!;
    expect((battlePayload.participantBreakdowns as Array<{ playerId: string }>).map((entry) => entry.playerId)).toEqual(['p2', 'p3']);
  });

  it('Mozart persisted arm rejects retiming away from its trusted source-play round', () => {
    const state = setup([physical('mozart-source', MOZART)]);
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'mozart-source' }]);
    state.abilityRuntime!.b06RoundPunishmentArms![0]!.round += 1;
    expect(() => rules.processAbilityEvent(state, {
      id: 'synthetic-battle-result', type: 'after_battle_result_determined', battlePhaseResolutionId: 'bp', battleId: 'b', resultId: 'synthetic-battle-result',
      battlefieldId: MIYAMA, battleParticipantIds: ['p2', 'p3'], battleResult: { winners: ['p2'], loserIds: ['p3'] },
    })).toThrow(/B06_ROUND_PUNISHMENT_ARM_STATE_INVALID/);
  });

  it('raises frozen material overlap exactly 163 -> 165 with both B06 identities exact-once', () => {
    const frozen = frozenIds(); const ids = materialIds().filter((id) => frozen.has(id));
    const counts = new Map<string, number>(); for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
    expect(counts.get(MOZART)).toBe(1); expect(counts.get(AMAKUSA)).toBe(1);
    expect(ids.length).toBe(165); expect([...counts.values()].filter((count) => count > 1)).toEqual([]);
  });
});
