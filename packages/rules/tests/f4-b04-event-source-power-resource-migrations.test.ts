import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { AbilityDefinitionPack, AuthoringCard } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ALBION = 'servant.albion.skill.sc-albion-2';
const OZY = 'servant.ozymandias.skill.sc-ozymandias-2';
const BATTLEFIELD = 'shinto';
const WORKSHOP = 'magic_workshop';
const RECON = 'recon';
const MIYAMA = 'miyama_town';

function raw(file: string): any { return JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
function loaded(file: string) {
  const pack = rules.loadAuthoringJson(raw(file));
  expect(pack.report).toEqual([]);
  return pack;
}
function fixtureCard(id: string, power = 1, attributes: string[] = []): AuthoringCard {
  return { id, name: id, cardType: 'basic_attack', cardFace: { typeLabel: 'fixture', cost: 0, basePower: power, attributes },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
}
function pack(): AbilityDefinitionPack {
  const albion = loaded('data/authoring/servants/servant.albion.json');
  const ozy = loaded('data/authoring/servants/servant.ozymandias.json');
  return { cards: { ...albion.cards, ...ozy.cards, 'basic.luck': fixtureCard('basic.luck', 1, []) } };
}
function physical(instanceId: string, definitionId: string, controller = 'p1', zone = 'attack_area') {
  return { instanceId, definitionId, ownerPlayerId: controller, controllerPlayerId: controller, zone,
    visibility: { scope: zone === 'hand' || zone === 'skill' ? 'owner_only' as const : 'public' as const,
      ...(zone === 'hand' || zone === 'skill' ? { ownerPlayerId: controller } : {}) } };
}
function setup(cards: GameState['cards'], locations: Record<string, string> = { p1: BATTLEFIELD, p2: BATTLEFIELD }) {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  state.cards = cards;
  for (const player of state.players) { player.mana = 20; player.locationId = (locations[player.id] ?? BATTLEFIELD) as any; }
  rules.initializeAbilityRuntime(state, pack(), { seed: 20260923 });
  for (const card of cards) state.abilityRuntime!.cardState[card.instanceId] = {
    active: card.zone === 'attack_area' || card.zone === 'field', faceDown: false, playedRound: state.round.roundNumber,
  };
  return state;
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
function bridgeSession(state: GameState) {
  const session = rules.createMatchSession({ seed: 20260923, humanPlayerIds: ['p1', 'p2'] });
  session.state = state;
  return session as unknown as typeof session & {
    queuePostScoringBattleEvents(battles: GameState['battleResults'], logs: GameState['log']): void;
    flushPostScoringBattleEvents(): void;
  };
}
function realBattleAndPostScore(state: GameState, luckSuppressed = false) {
  if (luckSuppressed) {
    state.cards.push(physical('p1-luck', 'basic.luck', 'p1', 'attack_area'));
    state.abilityRuntime!.cardState['p1-luck'] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  }
  state.round.activePhase = 'battle';
  const resolved = rules.resolveBattlefield(state, { battlefieldId: BATTLEFIELD, participants: [
    { playerId: 'p1', totalPower: 1 }, { playerId: 'p2', totalPower: 9 },
  ] }).nextState;
  const battles = structuredClone(resolved.battleResults);
  const priorLogLength = resolved.log.length;
  const scored = rules.applyBattleScoring(resolved).nextState;
  const session = bridgeSession(scored);
  session.queuePostScoringBattleEvents(battles, scored.log.slice(priorLogLength));
  session.flushPostScoringBattleEvents();
  return { state: session.state, battle: battles.at(-1)! };
}

describe('P3 F4 B04 event/source-power/resource migration batch', () => {
  it('loads both exact archives blocker-free and rehashes frozen F1 text/clauses', () => {
    const albion = raw('data/authoring/servants/servant.albion.json').cards.find((c: any) => c.id === ALBION);
    const ozy = raw('data/authoring/servants/servant.ozymandias.json').cards.find((c: any) => c.id === OZY);
    expect(loaded('data/authoring/servants/servant.albion.json').cards[ALBION]).toBeDefined();
    expect(loaded('data/authoring/servants/servant.ozymandias.json').cards[OZY]).toBeDefined();
    const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
    expect(hash(albion.printedText)).toBe('a64b134a212cc775dea9bc836f5ccd354886407f92e737c1174e3ad100d22871');
    expect(hash(albion.abilities.find((a: any) => a.id === 'flame-disaster').printedClause)).toBe('7cf0bf703fad6229c071b8598c684111a5e16965050226fe1825e3451ba08258');
    expect(hash(ozy.printedText)).toBe('318e8317de8d7d285d5d97b0fe25a7d9856e403ef4f94ad15cebb4ed1aa88ae3');
    expect(ozy.abilities.map((a: any) => hash(a.printedClause))).toEqual([
      '34d0686e0a3e32928564917e173f901363e57039d02d16fb7d63a4003209ab4c',
      '1b14785de73052a9cff04c57cd3bd1256d2b917d4fb291f60e7610d08042625c',
      '92f2c2ad689d60bb527067f3c498c88da208c7e78ec128259eabe265fadf3fef',
      '6db56f1692adfadcb4a81aa840af8bdea39039a0b101aaff2bd33fda633cf0a1',
    ]);
  });

  it('fails closed on widened B04 reserved envelopes', () => {
    const albion = raw('data/authoring/servants/servant.albion.json');
    albion.cards[0].abilities[1].effects[0].amount = 99;
    expect(rules.loadAuthoringJson(albion).report.some((entry) => entry.path.includes('batchEventSourcePower.gateway'))).toBe(true);
    const ozy = raw('data/authoring/servants/servant.ozymandias.json');
    ozy.cards[0].abilities[2].effects[0].amount = -3;
    expect(rules.loadAuthoringJson(ozy).report.some((entry) => entry.path.includes('batchEventSourcePower.gateway'))).toBe(true);
    const defeat = raw('data/authoring/servants/servant.ozymandias.json');
    defeat.cards[0].abilities[3].effects[0].amount = 4;
    expect(rules.loadAuthoringJson(defeat).report.some((entry) => entry.path.includes('batchEventSourcePower.gateway'))).toBe(true);
  });

  it('Albion records real normal movement, grants only the first movement distance each round, and accumulates permanently', () => {
    let state = setup([physical('albion-source', ALBION)], { p1: WORKSHOP, p2: RECON });
    delete state.players.find((player) => player.id === 'p2')!.locationId;
    expect(rules.calculateCardPower(state, 'albion-source').value).toBe(7);
    let stepped = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p1', to: MIYAMA, movementKind: 'normal' } });
    state = stepped.nextState;
    expect(state.abilityRuntime!.movementDistanceThisRound.p1).toBe(1);
    expect(rules.calculateCardPower(state, 'albion-source').value).toBe(8);
    expect(state.abilityRuntime!.b04FirstMovementSourcePowerReceipts).toHaveLength(1);

    state.round.activePhase = 'action';
    state.players.find((player) => player.id === 'p1')!.mana = 20;
    stepped = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p1', to: BATTLEFIELD, movementKind: 'normal' } });
    state = stepped.nextState;
    expect(state.abilityRuntime!.movementDistanceThisRound.p1).toBe(2);
    expect(rules.calculateCardPower(state, 'albion-source').value).toBe(8);
    expect(state.abilityRuntime!.b04FirstMovementSourcePowerReceipts).toHaveLength(1);

    rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
    state.round.activePhase = 'action'; state.players.find((player) => player.id === 'p1')!.mana = 20;
    stepped = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p1', to: RECON, movementKind: 'normal' } });
    state = stepped.nextState;
    expect(state.abilityRuntime!.movementDistanceThisRound.p1).toBe(1);
    expect(rules.calculateCardPower(state, 'albion-source').value).toBe(9);
    expect(state.abilityRuntime!.b04FirstMovementSourcePowerReceipts).toHaveLength(2);
  });

  it('Albion uses frozen cumulative round movement distance when its source becomes active after an earlier move', () => {
    let state = setup([physical('albion-source', ALBION)], { p1: WORKSHOP, p2: RECON });
    state.abilityRuntime!.cardState['albion-source']!.active = false;
    state = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p1', to: MIYAMA, movementKind: 'normal' } }).nextState;
    expect(state.abilityRuntime!.movementDistanceThisRound.p1).toBe(1);
    expect(state.abilityRuntime!.b04FirstMovementSourcePowerReceipts ?? []).toHaveLength(0);
    state.abilityRuntime!.cardState['albion-source']!.active = true;
    state.round.activePhase = 'action'; state.players.find((player) => player.id === 'p1')!.mana = 20;
    state = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p1', to: BATTLEFIELD, movementKind: 'normal' } }).nextState;
    expect(state.abilityRuntime!.movementDistanceThisRound.p1).toBe(2);
    expect(state.abilityRuntime!.b04FirstMovementSourcePowerReceipts![0]!.amount).toBe(2);
    expect(rules.calculateCardPower(state, 'albion-source').value).toBe(9);
  });

  it('rejects an authoritative-movement handoff unless it matches the just-applied movement receipt', () => {
    const forged = setup([physical('albion-source', ALBION)], { p1: WORKSHOP, p2: RECON });
    expect(() => rules.processAuthoritativeMovementAbilityEvent(forged, {
      type: 'after_controller_enters_location', playerId: 'p1', locationId: MIYAMA,
    }, WORKSHOP, MIYAMA, 'normal')).toThrow(/exact applied movement receipt/);
    expect(forged.abilityRuntime!.b04MovementEventReceipts ?? {}).toEqual({});
    expect(rules.calculateCardPower(forged, 'albion-source').value).toBe(7);
  });
  it('Albion ignores forged public entry events and fails closed on tampered persisted movement/power state', () => {
    const forged = setup([physical('albion-source', ALBION)], { p1: WORKSHOP, p2: BATTLEFIELD });
    rules.processAbilityEvent(forged, { id: 'forged-entry', type: 'after_controller_enters_location', playerId: 'p1', locationId: RECON });
    expect(rules.calculateCardPower(forged, 'albion-source').value).toBe(7);

    let state = setup([physical('albion-source', ALBION)], { p1: WORKSHOP, p2: BATTLEFIELD });
    state = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p1', to: RECON, movementKind: 'normal' } }).nextState;
    const root = state.abilityRuntime!.b04FirstMovementSourcePowerReceipts![0]!.rootEventId;
    state.abilityRuntime!.b04MovementEventReceipts![root]!.distance += 1;
    expect(() => rules.calculateCardPower(state, 'albion-source')).toThrow(/B04_(?:MOVEMENT_RECEIPT|ALBION_POWER)_STATE_INVALID/);
  });

  it('Albion persisted movement provenance rejects unrelated processed ids and duplicate log bindings', () => {
    let state = setup([physical('albion-source', ALBION)], { p1: WORKSHOP, p2: BATTLEFIELD });
    state = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p1', to: RECON, movementKind: 'normal' } }).nextState;
    rules.processAbilityEvent(state, { id: 'unrelated-root', type: 'phase_changed' });
    const originalId = state.abilityRuntime!.b04FirstMovementSourcePowerReceipts![0]!.rootEventId;
    const original = state.abilityRuntime!.b04MovementEventReceipts![originalId]!;
    state.abilityRuntime!.b04MovementEventReceipts!['unrelated-root'] = { ...structuredClone(original), eventId: 'unrelated-root' };
    state.abilityRuntime!.b04FirstMovementSourcePowerReceipts![0]!.rootEventId = 'unrelated-root';
    expect(() => rules.calculateCardPower(state, 'albion-source')).toThrow(/B04_MOVEMENT_RECEIPT_STATE_INVALID|B04_FIRST_MOVEMENT_SOURCE_POWER_STATE_INVALID/);
  });

  it('Albion rejects coordinated persisted movement/source-power inflation', () => {
    let state = setup([physical('albion-source', ALBION)], { p1: WORKSHOP, p2: BATTLEFIELD });
    state = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p1', to: RECON, movementKind: 'normal' } }).nextState;
    const before = rules.calculateCardPower(state, 'albion-source').value;
    expect(before).toBeGreaterThan(7);
    const receipt = state.abilityRuntime!.b04FirstMovementSourcePowerReceipts![0]!;
    const movement = state.abilityRuntime!.b04MovementEventReceipts![receipt.rootEventId]!;
    movement.distance += 5; movement.cumulativeDistance += 5; receipt.amount += 5;
    expect(() => rules.calculateCardPower(state, 'albion-source')).toThrow(/B04_MOVEMENT_RECEIPT_STATE_INVALID/);
  });

  it('Albion physical skill is playable only once per game', () => {
    const state = setup([physical('albion-source', ALBION, 'p1', 'skill')]);
    state.players[0]!.mana = 20;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'albion-source' }]);
    expect(state.cards.find((card) => card.instanceId === 'albion-source')!.zone).toBe('attack_area');
    state.cards.find((card) => card.instanceId === 'albion-source')!.zone = 'skill';
    state.abilityRuntime!.cardState['albion-source'] = { ...state.abilityRuntime!.cardState['albion-source']!, active: false, faceDown: false };
    expect(rules.getLegalActions(state, 'p1').some((action) => action.type === 'play_card' && action.cardInstanceId === 'albion-source')).toBe(false);
    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'albion-source' }])).toThrow(/Card cannot be played/);
  });

  it('Ozymandias doubles its own source power for the play round only', () => {
    const state = setup([physical('ozy-source', OZY, 'p1', 'skill')]);
    state.players[0]!.mana = 20;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'ozy-source' }]);
    expect(rules.calculateCardPower(state, 'ozy-source').value).toBe(8);
    expect(state.abilityRuntime!.b04RoundSourcePowerBonuses).toHaveLength(1);
    rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
    expect(rules.calculateCardPower(state, 'ozy-source').value).toBe(4);
    state.abilityRuntime!.b04RoundSourcePowerBonuses![0]!.amount = 5;
    expect(() => rules.calculateCardPower(state, 'ozy-source')).toThrow(/B04_ROUND_POWER_STATE_INVALID/);
  });

  it('Ozymandias persisted round bonus cannot be retimed after expiration', () => {
    const state = setup([physical('ozy-source', OZY, 'p1', 'skill')]);
    state.players[0]!.mana = 20;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'ozy-source' }]);
    expect(rules.calculateCardPower(state, 'ozy-source').value).toBe(8);
    const originalRound = state.round.roundNumber;
    rules.advanceAbilityPhase(state, 'preparation', originalRound + 1);
    expect(rules.calculateCardPower(state, 'ozy-source').value).toBe(4);
    state.abilityRuntime!.b04RoundSourcePowerBonuses![0]!.round = state.round.roundNumber;
    expect(() => rules.calculateCardPower(state, 'ozy-source')).toThrow(/B04_ROUND_POWER_STATE_INVALID/);
  });

  it('Ozymandias drains exactly 2 mana from a trusted opponent entering its battlefield, but not from forged entry', () => {
    let state = setup([physical('ozy-source', OZY)], { p1: BATTLEFIELD, p2: MIYAMA });
    state.players.find((player) => player.id === 'p2')!.mana = 20;
    const baseline = rules.movePlayer(structuredClone(state), { playerId: 'p2', to: BATTLEFIELD, movementKind: 'normal' });
    expect(baseline.moved).toBe(true);
    const before = state.players.find((player) => player.id === 'p2')!.mana;
    state = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p2', to: BATTLEFIELD, movementKind: 'normal' } }).nextState;
    expect(state.players.find((player) => player.id === 'p2')!.mana).toBe(Math.max(0, before - baseline.manaSpent - 2));

    const forged = setup([physical('ozy-source', OZY)], { p1: BATTLEFIELD, p2: BATTLEFIELD });
    const mana = forged.players.find((player) => player.id === 'p2')!.mana;
    rules.processAbilityEvent(forged, { id: 'forged-entry', type: 'after_controller_enters_location', playerId: 'p2', locationId: BATTLEFIELD });
    expect(forged.players.find((player) => player.id === 'p2')!.mana).toBe(mana);
  });

  it('Ozymandias drains deployment entry through the real MatchSession authoritative deployment path', () => {
    const makeSession = (sourceActive: boolean) => {
      const state = setup([physical('ozy-source', OZY)], { p1: BATTLEFIELD, p2: BATTLEFIELD });
      const opponent = state.players.find((player) => player.id === 'p2')!;
      delete opponent.locationId; state.round.activePhase = 'advance'; state.round.prioritySeat = opponent.seat;
      if (!sourceActive) state.abilityRuntime!.cardState['ozy-source']!.active = false;
      return bridgeSession(state);
    };
    const active = makeSession(true); const inactive = makeSession(false);
    expect(active.legalDeploymentActions('p2')).toContainEqual({ type: 'deploy_player', locationId: BATTLEFIELD });
    expect(inactive.legalDeploymentActions('p2')).toContainEqual({ type: 'deploy_player', locationId: BATTLEFIELD });
    expect(active.dispatchPlayerCommand('p2', { type: 'deploy_player', locationId: BATTLEFIELD }).ok).toBe(true);
    expect(inactive.dispatchPlayerCommand('p2', { type: 'deploy_player', locationId: BATTLEFIELD }).ok).toBe(true);
    expect(inactive.state.players.find((player) => player.id === 'p2')!.mana - active.state.players.find((player) => player.id === 'p2')!.mana).toBe(2);
    expect(active.state.abilityRuntime!.processedEvents).toContain('deploy:1:p2');
  });

  it('Ozymandias entry drain rejects a generic trusted entry that has no exact applied movement receipt', () => {
    const state = setup([physical('ozy-source', OZY)], { p1: BATTLEFIELD, p2: BATTLEFIELD });
    const before = state.players.find((player) => player.id === 'p2')!.mana;
    expect(() => rules.processAbilitySystemEvent(state, 'generic-entry', {
      type: 'after_controller_enters_location', playerId: 'p2', locationId: BATTLEFIELD,
    })).toThrow(/authoritative provenance/);
    expect(state.players.find((player) => player.id === 'p2')!.mana).toBe(before);
  });

  it('Ozymandias real defeat grants +3 to active same-location players through mana caps, then closes the source', () => {
    const state = setup([physical('ozy-source', OZY)]);
    state.players[0]!.mana = 10; state.players[1]!.mana = 11;
    const result = realBattleAndPostScore(state);
    expect(result.battle.winnerPlayerIds).toEqual(['p2']);
    expect(result.battle.lossEffectSuppressedPlayerIds ?? []).not.toContain('p1');
    expect(result.state.players.find((player) => player.id === 'p1')!.status).toBe('eliminated');
    expect(result.state.players.find((player) => player.id === 'p1')!.mana).toBe(12);
    expect(result.state.players.find((player) => player.id === 'p2')!.mana).toBe(12);
    expect(result.state.abilityRuntime!.cardState['ozy-source']).toMatchObject({ active: false, faceDown: false });
    expect(result.state.cards.find((card) => card.instanceId === 'ozy-source')!.zone).toBe('skill');
  });

  it('Ozymandias defeat release does not fire when battle-loss effects are suppressed', () => {
    const state = setup([physical('ozy-source', OZY)]);
    state.players[0]!.mana = 5; state.players[1]!.mana = 5;
    const result = realBattleAndPostScore(state, true);
    expect(result.battle.lossEffectSuppressedPlayerIds ?? []).toContain('p1');
    expect(result.state.players.find((player) => player.id === 'p1')!.mana).toBe(5);
    expect(result.state.players.find((player) => player.id === 'p2')!.mana).toBe(5);
    expect(result.state.abilityRuntime!.cardState['ozy-source']!.active).toBe(true);
    expect(result.state.cards.find((card) => card.instanceId === 'ozy-source')!.zone).toBe('attack_area');
  });

  it('raises frozen material overlap exactly 159 -> 161 with no duplicate identities', () => {
    const frozen = frozenIds(); const ids = materialIds().filter((id) => frozen.has(id));
    const counts = new Map<string, number>(); for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
    expect(counts.get(ALBION)).toBe(1); expect(counts.get(OZY)).toBe(1);
    expect(ids.length).toBe(161); expect([...counts.values()].filter((count) => count > 1)).toEqual([]);
  });
});
