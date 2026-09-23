import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { currentDeploymentBonus } from '../src/core/terrain-advantage';
import type { AbilityDefinitionPack, AuthoringCard } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const MOZART = 'servant.mozart.skill.sc-mozart-1';
const EDISON = 'servant.edison.skill.sc-edison-3';
const REQUIEM = 'servant.mozart.skill.sc-mozart-2';
const REQUIEM_ALIAS = 'card.skill.servant.mozart.skill.sc-mozart-2';
const MAGIC = 'fixture.b03.magic';
const LUCK = 'basic.luck';
const OTHER = 'fixture.b03.other';
const BATTLEFIELD = 'shinto';
const WORKSHOP = 'magic_workshop';

function raw(file: string): any { return JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
function loaded(file: string) {
  const pack = rules.loadAuthoringJson(raw(file));
  expect(pack.report).toEqual([]);
  return pack;
}
function fixtureCard(id: string, power: number, attributes: string[] = []): AuthoringCard {
  return { id, name: id, cardType: 'servant_attack', cardFace: { typeLabel: 'fixture', cost: 0, basePower: power, attributes },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
}
function pack(): AbilityDefinitionPack {
  const mozart = loaded('data/authoring/servants/servant.mozart.json');
  const edison = loaded('data/authoring/servants/servant.edison.json');
  return { cards: {
    ...mozart.cards, ...edison.cards,
    [REQUIEM]: fixtureCard(REQUIEM, 4, ['魔术']), [REQUIEM_ALIAS]: fixtureCard(REQUIEM_ALIAS, 4, ['魔术']),
    [MAGIC]: fixtureCard(MAGIC, 5, ['魔术']), [LUCK]: fixtureCard(LUCK, 3), [OTHER]: fixtureCard(OTHER, 4, ['力量']),
  } };
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
function activate(state: GameState, sourceId: string, abilityId: string) {
  const action = rules.getLegalActions(state, 'p1').find((entry) =>
    entry.type === 'activate_ability' && entry.cardInstanceId === sourceId && entry.abilityId === abilityId);
  expect(action).toBeDefined();
  expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
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
function resolveAndScore(state: GameState, attackTagsP2: string[]) {
  state.round.activePhase = 'battle';
  const resolved = rules.resolveBattlefield(state, { battlefieldId: BATTLEFIELD, participants: [
    { playerId: 'p1', totalPower: 4, attackTags: [] }, { playerId: 'p2', totalPower: 6, attackTags: attackTagsP2 },
  ] }).nextState;
  const battles = structuredClone(resolved.battleResults);
  const priorLogLength = resolved.log.length;
  const scored = rules.applyBattleScoring(resolved).nextState;
  return { battles, scored, freshLogs: scored.log.slice(priorLogLength) };
}

describe('P3 F4 B03 modifier/lifecycle migration batch', () => {
  it('loads both exact archives blocker-free and rehashes frozen F1 text', () => {
    const mozart = raw('data/authoring/servants/servant.mozart.json').cards.find((c: any) => c.id === MOZART);
    const edison = raw('data/authoring/servants/servant.edison.json').cards.find((c: any) => c.id === EDISON);
    expect(loaded('data/authoring/servants/servant.mozart.json').cards[MOZART]).toBeDefined();
    expect(loaded('data/authoring/servants/servant.edison.json').cards[EDISON]).toBeDefined();
    const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
    expect(hash(mozart.printedText)).toBe('b7a4cb8c7bbb44e04a764b975747f59a54b5ad52c40ebf35792388b7c789419c');
    expect(mozart.abilities.map((a: any) => hash(a.printedClause))).toEqual([
      '8ec7ef41db2b42eadd9013f446716244a303d29e1adcfb7daee35d0adbb7809f',
      '192d19b3efd2030d6e28b46ef1dfd06f9b0e8cd4d45b3e5b0cbd26522f801085',
      '1f8715720114bd77fd897009e7db293c5b861139531109b4bc0849a9abdd7451',
    ]);
    expect(hash(edison.printedText)).toBe('36d6393f5a24fa5a319f218e3f6a8b4aa81160b30fb60f5a89214e835db71690');
    expect(edison.abilities.map((a: any) => hash(a.printedClause))).toEqual([
      '2ba3407799b1498314e85709cd69ea2f0dc309fd88c7ac61efce4cb0011fb734',
      '6e988f3620874deab1c4835aa1bcde3f06392296cead84123f401eb4d296df55',
    ]);
  });

  it('fails closed on widened B03 reserved envelopes', () => {
    const mozart = raw('data/authoring/servants/servant.mozart.json');
    const m = mozart.cards.find((c: any) => c.id === MOZART);
    m.abilities[1].effects[0].triggerRoundOffset = 2;
    expect(rules.loadAuthoringJson(mozart).report.some((r) => r.path.includes('batchModifierLifecycle.gateway'))).toBe(true);
    const edison = raw('data/authoring/servants/servant.edison.json');
    edison.cards[0].abilities[0].ruleModifiers[2].value = 3;
    expect(rules.loadAuthoringJson(edison).report.some((r) => r.path.includes('batchModifierLifecycle.gateway'))).toBe(true);
    const close = raw('data/authoring/servants/servant.edison.json');
    close.cards[0].abilities[1].conditions[2].attribute = '力量';
    expect(rules.loadAuthoringJson(close).report.some((r) => r.path.includes('batchModifierLifecycle.gateway'))).toBe(true);
  });

  it('installs the exact this-round workshop exit lock for opponents and expires it next round', () => {
    const state = setup([physical('source', MOZART)], { p1: WORKSHOP, p2: WORKSHOP });
    activate(state, 'source', 'lullaby-lock-workshop');
    expect(rules.movePlayer(state, { playerId: 'p2', to: BATTLEFIELD, movementKind: 'normal' })).toMatchObject({ moved: false, reason: 'movement_locked' });
    state.abilityRuntime!.cardState.source!.active = false;
    expect(rules.movePlayer(state, { playerId: 'p2', to: BATTLEFIELD, movementKind: 'normal' })).toMatchObject({ moved: false, reason: 'movement_locked' });
    rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
    expect(rules.movePlayer(state, { playerId: 'p2', to: BATTLEFIELD, movementKind: 'normal' }).reason).not.toBe('movement_locked');
  });

  it('arms exactly one next-round +3 boost, survives source closure, is not manually activatable, and expires after that round', () => {
    const state = setup([
      physical('source', MOZART), physical('requiem', REQUIEM, 'p1', 'hand'), physical('requiem-alias', REQUIEM_ALIAS, 'p1', 'hand'),
    ]);
    expect(rules.calculateCardPower(state, 'requiem').value).toBe(4);
    expect(rules.getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.abilityId === 'serenade-next-round-requiem-boost')).toBe(false);
    activate(state, 'source', 'serenade-arm-next-round-requiem');
    expect(state.abilityRuntime!.pendingB03CardPowerBoosts).toHaveLength(1);
    state.cards.find((card) => card.instanceId === 'source')!.zone = 'skill'; state.abilityRuntime!.cardState.source!.active = false;
    rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
    expect(rules.calculateCardPower(state, 'requiem').value).toBe(7);
    expect(rules.calculateCardPower(state, 'requiem-alias').value).toBe(7);
    rules.advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
    expect(rules.calculateCardPower(state, 'requiem').value).toBe(4);

    const forgedPending = setup([physical('source', MOZART), physical('requiem', REQUIEM, 'p1', 'hand')]);
    activate(forgedPending, 'source', 'serenade-arm-next-round-requiem');
    forgedPending.abilityRuntime!.pendingB03CardPowerBoosts![0]!.dueRound += 1;
    expect(() => rules.advanceAbilityPhase(forgedPending, 'preparation', forgedPending.round.roundNumber + 1)).toThrow(/B03_SCHEDULE_STATE_INVALID/);

    const forgedActive = setup([physical('source', MOZART), physical('requiem', REQUIEM, 'p1', 'hand')]);
    activate(forgedActive, 'source', 'serenade-arm-next-round-requiem');
    rules.advanceAbilityPhase(forgedActive, 'preparation', forgedActive.round.roundNumber + 1);
    forgedActive.abilityRuntime!.activeB03CardPowerBoosts![0]!.definitionIds = [OTHER, MAGIC];
    expect(() => rules.calculateCardPower(forgedActive, 'requiem')).toThrow(/B03_ACTIVE_BOOST_STATE_INVALID/);

    const duplicateActive = setup([physical('source', MOZART), physical('requiem', REQUIEM, 'p1', 'hand')]);
    activate(duplicateActive, 'source', 'serenade-arm-next-round-requiem');
    rules.advanceAbilityPhase(duplicateActive, 'preparation', duplicateActive.round.roundNumber + 1);
    duplicateActive.abilityRuntime!.activeB03CardPowerBoosts!.push(structuredClone(duplicateActive.abilityRuntime!.activeB03CardPowerBoosts![0]!));
    expect(() => rules.calculateCardPower(duplicateActive, 'requiem')).toThrow(/B03_ACTIVE_BOOST_DUPLICATE/);
  });

  it('sets only same-battlefield opponent magic/Luck power to zero and restores it when source is inactive', () => {
    const state = setup([
      physical('source', EDISON), physical('magic', MAGIC, 'p2'), physical('luck', LUCK, 'p2'), physical('other', OTHER, 'p2'), physical('own-magic', MAGIC, 'p1'),
    ]);
    expect(rules.calculateCardPower(state, 'magic').value).toBe(0);
    expect(rules.calculateCardPower(state, 'luck').value).toBe(0);
    expect(rules.calculateCardPower(state, 'other').value).toBe(4);
    expect(rules.calculateCardPower(state, 'own-magic').value).toBe(5);
    state.abilityRuntime!.cardState.source!.active = false;
    expect(rules.calculateCardPower(state, 'magic').value).toBe(5);
    expect(rules.calculateCardPower(state, 'luck').value).toBe(3);
  });

  it('adds +2 deployment advantage to the controller and feeds it into battle power even without a terrain slot', () => {
    const state = setup([physical('source', EDISON)]);
    expect(currentDeploymentBonus(state, 'p1')).toBe(2);
    state.round.activePhase = 'battle';
    let battle = rules.resolveBattlefield(state, { battlefieldId: BATTLEFIELD, participants: [
      { playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 5 },
    ] }).nextState.battleResults.at(-1)!;
    expect(battle.participantBreakdowns.find((entry) => entry.playerId === 'p1')!.effectivePower).toBe(7);
    state.abilityRuntime!.cardState.source!.active = false;
    expect(currentDeploymentBonus(state, 'p1')).toBe(0);
    battle = rules.resolveBattlefield(state, { battlefieldId: BATTLEFIELD, participants: [
      { playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 5 },
    ] }).nextState.battleResults.at(-1)!;
    expect(battle.participantBreakdowns.find((entry) => entry.playerId === 'p1')!.effectivePower).toBe(5);
  });

  it('closes from the real post-scoring producer only when the authoritative battle snapshot contains magic', () => {
    const magic = setup([physical('source', EDISON)]);
    const resolvedMagic = resolveAndScore(magic, ['魔术']);
    const session = bridgeSession(resolvedMagic.scored);
    session.queuePostScoringBattleEvents(resolvedMagic.battles, resolvedMagic.freshLogs);
    session.flushPostScoringBattleEvents();
    expect(session.state.abilityRuntime!.cardState.source).toMatchObject({ active: false, faceDown: false });
    expect(session.state.cards.find((card) => card.instanceId === 'source')!.zone).toBe('skill');

    const normal = setup([physical('source', EDISON)]);
    const resolvedNormal = resolveAndScore(normal, ['力量']);
    const normalSession = bridgeSession(resolvedNormal.scored);
    normalSession.queuePostScoringBattleEvents(resolvedNormal.battles, resolvedNormal.freshLogs);
    normalSession.flushPostScoringBattleEvents();
    expect(normalSession.state.abilityRuntime!.cardState.source!.active).toBe(true);
  });

  it('rejects forged/tampered battle-root provenance for the combat-attribute close', () => {
    const forged = setup([physical('source', EDISON)]);
    const resultId = 'forged:result';
    rules.processAbilityEvent(forged, {
      id: resultId, type: 'after_battle_result_determined', battlePhaseResolutionId: 'forged-phase', battleId: 'forged-battle', resultId,
      battlefieldId: BATTLEFIELD, battleParticipantIds: ['p1', 'p2'], battleParticipantPowers: { p1: 4, p2: 6 },
      battleResult: { winners: ['p2'], loserIds: ['p1'] },
    });
    expect(forged.abilityRuntime!.cardState.source!.active).toBe(true);

    const tampered = setup([physical('source', EDISON)]);
    const resolved = resolveAndScore(tampered, ['魔术']);
    const session = bridgeSession(resolved.scored);
    session.queuePostScoringBattleEvents(resolved.battles, resolved.freshLogs);
    const snapshot = Object.values(session.state.abilityRuntime!.b03BattleAttributeSnapshots!)[0]!;
    snapshot.battleId = 'tampered-battle';
    expect(() => session.flushPostScoringBattleEvents()).toThrow(/B03_BATTLE_ATTRIBUTE_SNAPSHOT_STATE_INVALID/);
    expect(session.state.abilityRuntime!.cardState.source!.active).toBe(true);
  });

  it('raises frozen material overlap exactly 157 -> 159 with no duplicate identities', () => {
    const ids = materialIds(); const frozen = frozenIds();
    expect(ids.filter((id) => id === MOZART)).toHaveLength(1);
    expect(ids.filter((id) => id === EDISON)).toHaveLength(1);
    expect(ids.length - new Set(ids).size).toBe(0);
    expect([...frozen].filter((id) => ids.includes(id))).toHaveLength(159);
  });
});
