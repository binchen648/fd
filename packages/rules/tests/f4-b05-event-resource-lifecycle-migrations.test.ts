import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { AbilityDefinitionPack } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const EDISON = 'servant.edison.skill.sc-edison-2';
const KAMA = 'servant.kama.skill.sc-kama-2';
const WORKSHOP = 'magic_workshop';
const SHINTO = 'shinto';
const MIYAMA = 'miyama_town';

function raw(file: string): any { return JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
function loaded(file: string) {
  const pack = rules.loadAuthoringJson(raw(file));
  expect(pack.report).toEqual([]);
  return pack;
}
function pack(): AbilityDefinitionPack {
  const edison = loaded('data/authoring/servants/servant.edison.json');
  const kama = loaded('data/authoring/servants/servant.kama.json');
  return { cards: { ...edison.cards, ...kama.cards } };
}
function physical(instanceId: string, definitionId: string, controller = 'p1', zone = 'attack_area') {
  return { instanceId, definitionId, ownerPlayerId: controller, controllerPlayerId: controller, zone,
    visibility: { scope: zone === 'skill' || zone === 'hand' ? 'owner_only' as const : 'public' as const,
      ...(zone === 'skill' || zone === 'hand' ? { ownerPlayerId: controller } : {}) } };
}
function setup(cards: GameState['cards'], locations: Record<string,string> = { p1: SHINTO, p2: WORKSHOP }) {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'action';
  state.cards = cards;
  for (const player of state.players) {
    player.mana = 20; player.vp = 3;
    player.locationId = (locations[player.id] ?? SHINTO) as any;
  }
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

describe('P3 F4 B05 event/resource/lifecycle migration batch', () => {
  it('loads both exact archives blocker-free and rehashes frozen F1 text/clauses', () => {
    const edison = raw('data/authoring/servants/servant.edison.json').cards.find((c: any) => c.id === EDISON);
    const kama = raw('data/authoring/servants/servant.kama.json').cards.find((c: any) => c.id === KAMA);
    expect(loaded('data/authoring/servants/servant.edison.json').cards[EDISON]).toBeDefined();
    expect(loaded('data/authoring/servants/servant.kama.json').cards[KAMA]).toBeDefined();
    const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
    expect(hash(edison.printedText)).toBe('6e4857cd833d06617518b36d6e0a4b2acad3a5683736331e2b2269ab3945062b');
    expect(edison.abilities.map((a: any) => hash(a.printedClause))).toEqual([
      'dd3e704dcc5e93424c0773825826c8b35fc2ea92b0b3a66b3033f4b84e9b71a4',
      '9ce3c9b19f9b277448bbcfcbedde59763b38f93967b0a82648d5a7df8faed1c1',
    ]);
    expect(hash(kama.printedText)).toBe('212ba26db3d5f5cc2759a34e5092f0a8a055a4d20c93bd444daa79335c845fb2');
    expect(kama.abilities.map((a: any) => hash(a.printedClause))).toEqual([
      '782e71fe3cae3f40624522ff57548bfa6aaaf76a102a7eb2ef373cd4798101b6',
      '67573e24324b0de9620585e15aa69bcde199b1653bcd4e49c498a811417d8162',
    ]);
  });

  it('fails closed on widened B05 reserved envelopes', () => {
    const edison = raw('data/authoring/servants/servant.edison.json');
    edison.cards.find((c: any) => c.id === EDISON).abilities[1].effects[0].amount = 99;
    expect(rules.loadAuthoringJson(edison).report.some((r) => r.path.includes('batchEventResourceLifecycle.gateway'))).toBe(true);
    const kama = raw('data/authoring/servants/servant.kama.json');
    kama.cards.find((c: any) => c.id === KAMA).abilities[0].effects[0].amount = 2;
    expect(rules.loadAuthoringJson(kama).report.some((r) => r.path.includes('batchEventResourceLifecycle.gateway'))).toBe(true);
  });

  it('Edison closes immediately through the real play command when active with mana below 2', () => {
    const state = setup([physical('edison-source', EDISON, 'p1', 'skill')]);
    state.players[0]!.mana = 1;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'edison-source' }]);
    expect(state.cards.find((c) => c.instanceId === 'edison-source')!.zone).toBe('skill');
    expect(state.abilityRuntime!.cardState['edison-source']).toMatchObject({ active: false, faceDown: false });
  });

  it('Edison resolves trusted opponent workshop deployment in printed order', () => {
    const state = setup([physical('edison-source', EDISON)], { p1: SHINTO, p2: WORKSHOP });
    state.players[0]!.mana = 10; state.players[0]!.vp = 4; state.players[1]!.mana = 5;
    rules.processAuthoritativeEntryAbilityEvent(state, {
      id: `deploy:${state.round.roundNumber}:p2`, type: 'after_player_deployed_to_battlefield', playerId: 'p2', locationId: WORKSHOP,
    });
    expect(state.players[1]!.mana).toBe(6);
    expect(state.players[0]!.vp).toBe(6);
    expect(state.players[0]!.mana).toBe(7);
  });

  it('Kama steals on a real opponent move to another non-workshop battlefield, arms once, and closes at round end', () => {
    let state = setup([physical('kama-source', KAMA)], { p1: SHINTO, p2: WORKSHOP });
    state.round.prioritySeat = state.players.find((p) => p.id === 'p2')!.seat;
    state.players[0]!.vp = 2; state.players[1]!.vp = 3; state.players[1]!.mana = 20;
    state = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p2', to: MIYAMA, movementKind: 'normal' } }).nextState;
    expect(state.players[0]!.vp).toBe(3);
    expect(state.players[1]!.vp).toBe(2);
    expect(state.abilityRuntime!.b05RoundCloseArms).toHaveLength(1);
    rules.advanceAbilityPhase(state, 'round_end', state.round.roundNumber);
    expect(state.cards.find((c) => c.instanceId === 'kama-source')!.zone).toBe('skill');
    expect(state.abilityRuntime!.cardState['kama-source']).toMatchObject({ active: false, faceDown: false });
    expect(state.abilityRuntime!.b05RoundCloseArms ?? []).toEqual([]);
  });

  it('Kama valid trusted deployment arm survives transient entry cleanup and closes at round end', () => {
    const state = setup([physical('kama-source', KAMA)], { p1: SHINTO, p2: MIYAMA });
    state.players[0]!.vp = 2; state.players[1]!.vp = 3;
    const rootId = `deploy:${state.round.roundNumber}:p2`;
    rules.processAuthoritativeEntryAbilityEvent(state, {
      id: rootId, type: 'after_player_deployed_to_battlefield', playerId: 'p2', locationId: MIYAMA,
    });
    expect(state.players[0]!.vp).toBe(3);
    expect(state.players[1]!.vp).toBe(2);
    expect(state.abilityRuntime!.trustedEntryEventSnapshots?.[rootId]).toBeUndefined();
    expect(state.abilityRuntime!.b05TrustedDeploymentEntryRoots?.[rootId]).toMatchObject({
      eventId: rootId, eventType: 'after_player_deployed_to_battlefield', playerId: 'p2', locationId: MIYAMA, round: state.round.roundNumber,
    });
    expect(state.abilityRuntime!.b05RoundCloseArms).toHaveLength(1);
    rules.advanceAbilityPhase(state, 'round_end', state.round.roundNumber);
    expect(state.cards.find((c) => c.instanceId === 'kama-source')!.zone).toBe('skill');
    expect(state.abilityRuntime!.cardState['kama-source']).toMatchObject({ active: false, faceDown: false });
    expect(state.abilityRuntime!.b05RoundCloseArms ?? []).toEqual([]);
  });

  it('Kama can arm from a trusted deployment root and binds that arm to the trusted entry snapshot', () => {
    const state = setup([physical('kama-source', KAMA)], { p1: SHINTO, p2: MIYAMA });
    state.players[0]!.vp = 2; state.players[1]!.vp = 3;
    rules.processAuthoritativeEntryAbilityEvent(state, {
      id: `deploy:${state.round.roundNumber}:p2`, type: 'after_player_deployed_to_battlefield', playerId: 'p2', locationId: MIYAMA,
    });
    expect(state.players[0]!.vp).toBe(3);
    expect(state.players[1]!.vp).toBe(2);
    expect(state.abilityRuntime!.b05RoundCloseArms).toHaveLength(1);
    const arm = state.abilityRuntime!.b05RoundCloseArms![0]!;
    state.abilityRuntime!.b05DeploymentEntryReceipts![arm.rootEventId]!.locationId = SHINTO;
    arm.eventLocationId = SHINTO;
    expect(() => rules.advanceAbilityPhase(state, 'round_end', state.round.roundNumber)).toThrow(/B05_DEPLOYMENT_RECEIPT_STATE_INVALID|B05_ROUND_CLOSE_ARM_STATE_INVALID/);
  });

  it('Kama persisted arm rejects duplicate and unrelated processed-root substitution', () => {
    let state = setup([physical('kama-source', KAMA)], { p1: SHINTO, p2: WORKSHOP });
    state.round.prioritySeat = state.players.find((p) => p.id === 'p2')!.seat;
    state.players[1]!.mana = 20;
    state = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p2', to: MIYAMA, movementKind: 'normal' } }).nextState;
    state.abilityRuntime!.b05RoundCloseArms!.push(structuredClone(state.abilityRuntime!.b05RoundCloseArms![0]!));
    expect(() => rules.advanceAbilityPhase(state, 'round_end', state.round.roundNumber)).toThrow(/B05_ROUND_CLOSE_ARM_DUPLICATE/);
  });

  it('Kama movement arm rejects a substituted processed root whose receipt still names the original event', () => {
    let state = setup([physical('kama-source', KAMA)], { p1: SHINTO, p2: WORKSHOP });
    state.round.prioritySeat = state.players.find((p) => p.id === 'p2')!.seat;
    state.players[1]!.mana = 20;
    state = rules.stepGameLoop(state, { action: { type: 'move', playerId: 'p2', to: MIYAMA, movementKind: 'normal' } }).nextState;
    const arm = state.abilityRuntime!.b05RoundCloseArms![0]!;
    const originalRoot = arm.rootEventId;
    const substitutedRoot = 'enter-location-999999';
    state.abilityRuntime!.b04MovementEventReceipts![substitutedRoot] = structuredClone(state.abilityRuntime!.b04MovementEventReceipts![originalRoot]!);
    state.abilityRuntime!.processedEvents.push(substitutedRoot);
    arm.rootEventId = substitutedRoot;
    expect(() => rules.advanceAbilityPhase(state, 'round_end', state.round.roundNumber)).toThrow(/B05_ROUND_CLOSE_ARM_STATE_INVALID/);
    expect(state.abilityRuntime!.cardState['kama-source']).toMatchObject({ active: true, faceDown: false });
  });

  it('raises frozen material overlap exactly 161 -> 163 with both B05 identities exact-once', () => {
    const frozen = frozenIds(); const ids = materialIds().filter((id) => frozen.has(id));
    const counts = new Map<string, number>(); for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
    expect(counts.get(EDISON)).toBe(1); expect(counts.get(KAMA)).toBe(1);
    expect(ids.length).toBe(163); expect([...counts.values()].filter((count) => count > 1)).toEqual([]);
  });
});