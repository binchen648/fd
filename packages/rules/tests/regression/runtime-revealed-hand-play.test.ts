import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createMatchSession } from '../../src/match-session';
import { initializeAbilityRuntime, initializeActionTurns, advanceAbilityPhase, calculateCardPower, isCanonicalGenericPendingDecisionForRestore, executeAbility } from '../../src/ability/interpreter';
import { loadAuthoringJson } from '../../src/ability/loader';
import { restoreTrustedAuthoringFixtureSession } from '../trusted-authoring-fixture';

const frozen = JSON.parse(readFileSync('packages/rules/tests/fixtures/b-euryale-771ae323.json', 'utf8'));
const hostId = 'fixture.revealed-hand-reader';
const sourceId = 'reveal-source';
const chosenId = 'borrowed-core';
const abilityId = 'sc-euryale-3.gaze';
function raw() {
  const host = structuredClone(frozen.cards.find((c: {id: string}) => c.id.endsWith('sc-euryale-3')));
  host.id = hostId;
  // A component input preserving the exact B gaze/release abilities, not a complete Euryale Candidate.
  return {schemaVersion: 'fd-card-authoring-v1', id: 'fixture.revealed-hand', name: 'reveal component', cards: [
    host, structuredClone(frozen.cards.find((c: {id: string}) => c.id === 'card.x-divine-core')),
  ]};
}
function setup(options: {protectedTarget?: boolean; failTail?: boolean; pendingTail?: boolean} = {}) {
  const session = createMatchSession({seed: 20260907}), s = session.state;
  const canonical = s.abilityRuntime!.pack, pack = raw();
  if (options.failTail) pack.cards[0].abilities.find((a: {id: string}) => a.id === abilityId).effects.push({type: 'pay_mana', amount: 99});
  if (options.pendingTail) {
    const ability = pack.cards[0].abilities.find((a: {id: string}) => a.id === abilityId);
    ability.targets.push({id: 'after', type: 'player', selector: 'all_opponents', count: {min: 1, max: 1}});
    ability.effects.push({type: 'adjust_mana', amount: 0}, {type: 'adjust_victory_points', targetRef: 'after', amount: 1});
  }
  if (options.protectedTarget) {
    const ward = structuredClone(pack.cards[0]); ward.id = 'fixture.hand-ward';
    ward.abilities = [{conditions: [], targets: [], cost: [], effects: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: {mode: 'automatic', allowedOperations: []},
      id: 'ward', kind: 'passive', printedClause: 'test-only opponent protection', activation: {trigger: 'while_active', requiresSourceState: 'active'},
      ruleModifiers: [{operation: 'ignore', rule: 'opponent_ability_effects', scope: {subject: 'controller'}}]}];
    pack.cards.push(ward);
  }
  const loaded = loadAuthoringJson(pack);
  expect(loaded.report).toEqual([]);
  delete s.abilityRuntime;
  initializeAbilityRuntime(s, {...canonical, cards: {...canonical.cards, ...loaded.cards}});
  advanceAbilityPhase(s, 'action'); s.round.prioritySeat = 1;
  initializeActionTurns(s);
  s.eventPlacements = []; s.currentSituationModifiers = [];
  for (const p of s.players) { p.locationId = ['p1', 'p2'].includes(p.id) ? 'shinto' : 'magic_workshop'; p.mana = 10; }
  for (const c of s.cards) if (c.zone === 'hand') c.zone = 'deck';
  s.cards.push(
    {instanceId: sourceId, definitionId: hostId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: {scope: 'public'}},
    {instanceId: chosenId, definitionId: 'card.x-divine-core', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand', visibility: {scope: 'owner_only', ownerPlayerId: 'p2'}},
    {instanceId: 'shown-other', definitionId: 'basic.strength.3', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand', visibility: {scope: 'owner_only', ownerPlayerId: 'p2'}},
    {instanceId: 'elsewhere', definitionId: 'card.x-divine-core', ownerPlayerId: 'p3', controllerPlayerId: 'p3', zone: 'hand', visibility: {scope: 'owner_only', ownerPlayerId: 'p3'}},
  );
  s.abilityRuntime!.cardState[sourceId] = {active: true, faceDown: false, playedRound: 1};
  if (options.protectedTarget) {
    s.cards.push({instanceId: 'ward', definitionId: 'fixture.hand-ward', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'field', visibility: {scope: 'public'}});
    s.abilityRuntime!.cardState.ward = {active: true, faceDown: false, playedRound: 1};
  }
  return session;
}
const activate = (s: ReturnType<typeof setup>) => s.dispatchPlayerAction('p1', {type: 'activate_ability', cardInstanceId: sourceId, abilityId});
function choose(s: ReturnType<typeof setup>, ids: string[]) {
  const d = s.getPlayerView('p1').pendingDecision!;
  return s.dispatchPlayerAction('p1', {type: 'choose_target', decisionId: d.id, selectedIds: ids});
}
const publicHand = (s: ReturnType<typeof setup>, viewer = 'observer') => s.getPlayerView(viewer).cards.filter(c => c.zone === 'hand' && c.ownerPlayerId === 'p2');

describe('native snapshot hand reveal and bound borrowed play', () => {
  it('fixture preflight: source, revealed owners, zones, playedRound, phase, resources and target locations are complete', () => {
    const session = setup(), state = session.state, players = new Set(state.players.map(player => player.id));
    expect(state.round.activePhase).toBe('action');
    expect(state.eventPlacements).toEqual([]);
    expect(state.currentSituationModifiers).toEqual([]);
    for (const instance of state.cards) {
      expect(players.has(instance.ownerPlayerId)).toBe(true);
      expect(players.has(instance.controllerPlayerId)).toBe(true);
    }
    expect(state.abilityRuntime!.cardState[sourceId]).toMatchObject({ active: true, faceDown: false, playedRound: state.round.roundNumber });
    expect(state.cards.find(instance => instance.instanceId === chosenId)).toMatchObject({ ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand' });
    expect(state.players.filter(player => ['p1', 'p2'].includes(player.id)).every(player => player.locationId === 'shinto' && player.mana === 10)).toBe(true);
  });

  it('admits the frozen gaze component without declaring the complete servant supported', () => {
    expect(loadAuthoringJson(raw()).report).toEqual([]);
  });

  it.each(['missing-producer', 'later-producer', 'wrong-binding', 'wrong-count', 'wrong-zone', 'nested-effect', 'unsafe-bind'] as const)('rejects %s borrowed-play authorization at Loader', variant => {
    const pack = raw(), a = pack.cards[0].abilities.find((a: {id: string}) => a.id === abilityId);
    if (variant === 'missing-producer') a.effects.shift();
    if (variant === 'later-producer') a.effects.reverse();
    if (variant === 'wrong-binding') a.effects[1].binding = 'not-shown';
    if (variant === 'wrong-count') a.targets[1].count.max = 2;
    if (variant === 'wrong-zone') a.targets[1].scope.zone = 'deck';
    if (variant === 'nested-effect') a.effects = [{type: 'branch', branches: [{else: true, then: a.effects}]}];
    if (variant === 'unsafe-bind') { a.effects[0].bind = '__proto__'; a.effects[1].binding = '__proto__'; a.targets[1].targetsFromBinding = '__proto__'; }
    expect(loadAuthoringJson(pack).report.length).toBeGreaterThan(0);
  });

  it('snapshots all co-located hands once, projects them publicly and keeps unrelated zones private', () => {
    const session = setup();
    expect(publicHand(session)).toEqual([]);
    expect(activate(session).ok).toBe(true);
    const pending = session.state.abilityRuntime!.pendingDecision!;
    expect(pending.target.id).toBe('lucky');
    expect(pending.candidates).toEqual([chosenId]);
    expect(session.getPlayerView('p1').pendingDecision!.playBudget).toEqual({mana: 10, costs: {[chosenId]: 3}});
    expect(session.getPlayerView('p2').pendingDecision).toBeUndefined();
    expect(pending.context.selections.players).toEqual(['p1', 'p2']);
    for (const viewer of ['p1', 'p2', 'p3', 'observer']) {
      expect(publicHand(session, viewer).map(c => c.instanceId)).toEqual([chosenId, 'shown-other']);
      expect(session.getPlayerView(viewer).cards.some(c => c.instanceId === 'elsewhere')).toBe(viewer === 'p3');
    }
    session.state.cards.push({instanceId: 'later', definitionId: 'card.x-divine-core', ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand', visibility: {scope: 'owner_only', ownerPlayerId: 'p2'}});
    expect(publicHand(session).map(c => c.instanceId)).not.toContain('later');
    expect(session.getPlayerView('p1').pendingDecision!.candidates).toEqual([chosenId]);
    expect(session.state.cards.find(c => c.instanceId === chosenId)!.visibility.scope).toBe('owner_only');
    const before = session.getState();
    session.getPlayerView('p1'); session.getPlayerView('observer'); session.getClientProjection('p2');
    expect(session.getState()).toEqual(before);
  });

  it('uses the native paid effect-play ledger, preserves the owner and assigns the attack to its controller', () => {
    const session = setup(); expect(activate(session).ok).toBe(true);
    const turn = structuredClone(session.getPlayerView('p1').actionTurn);
    expect(choose(session, [chosenId]).ok).toBe(true);
    const card = session.state.cards.find(c => c.instanceId === chosenId)!;
    expect(card).toMatchObject({zone: 'attack_area', ownerPlayerId: 'p2', controllerPlayerId: 'p1'});
    expect(session.state.players.find(p => p.id === 'p1')!.mana).toBe(7);
    expect(session.state.players.find(p => p.id === 'p2')!.mana).toBe(10);
    expect(session.state.abilityRuntime!.cardState[chosenId]!.paidManaOnPlay).toBe(3);
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({type: 'revealed_card_played', cardInstanceId: chosenId, playerId: 'p1'}));
    expect(session.getPlayerView('p1').actionTurn).toEqual(turn);
    expect(calculateCardPower(session.state, chosenId).value).toBeGreaterThan(0);
    expect(session.getClientProjection('p1').zones.find(z => z.id === 'attack_area')!.cardIds).toContain(chosenId);
    expect(session.getClientProjection('p2').zones.find(z => z.id === 'attack_area')!.cardIds).not.toContain(chosenId);
    expect(publicHand(session)).toEqual([]);
    const history = (session.getPlayerView('observer') as any).lastHandReveal;
    expect(history.cards.map((c: {cardId: string}) => c.cardId)).toContain(chosenId);
    expect(history.cards.map((c: {cardId: string}) => c.cardId)).toContain('shown-other');
  });

  it('allows declining, revokes live visibility and retains only the public historical snapshot', () => {
    const session = setup(); expect(activate(session).ok).toBe(true);
    expect(choose(session, []).ok).toBe(true);
    expect(session.state.cards.find(c => c.instanceId === chosenId)!.zone).toBe('hand');
    expect(publicHand(session)).toEqual([]);
    expect(session.getPlayerView('observer')).toHaveProperty('lastHandReveal');
    const before = session.getState();
    expect(session.dispatchPlayerAction('p1', {type: 'play_card', cardInstanceId: chosenId}).ok).toBe(false);
    expect(session.getState()).toEqual(before);
  });

  it('cannot select unseen, non-Luck, multi-card or repeated choices, with no state or resource mutation', () => {
    const session = setup(); expect(activate(session).ok).toBe(true);
    for (const selected of [['elsewhere'], ['shown-other'], [chosenId, 'shown-other']]) {
      const before = session.getState(); expect(choose(session, selected).ok).toBe(false); expect(session.getState()).toEqual(before);
    }
    const id = session.getPlayerView('p1').pendingDecision!.id;
    expect(choose(session, [chosenId]).ok).toBe(true);
    const before = session.getState();
    expect(session.dispatchPlayerAction('p1', {type: 'choose_target', decisionId: id, selectedIds: [chosenId]}).ok).toBe(false);
    expect(session.getState()).toEqual(before);
  });

  it.each(['mana', 'zone', 'controller', 'priority', 'phase'] as const)('rechecks %s at selection instead of trusting the opened window', changed => {
    const session = setup(); expect(activate(session).ok).toBe(true);
    const state = session.state, card = state.cards.find(c => c.instanceId === chosenId)!;
    if (changed === 'mana') state.players.find(p => p.id === 'p1')!.mana = 2;
    if (changed === 'zone') card.zone = 'discard';
    if (changed === 'controller') card.controllerPlayerId = 'p3';
    if (changed === 'priority') state.round.prioritySeat = 2;
    if (changed === 'phase') state.round.activePhase = 'advance';
    const before = session.getState(); expect(choose(session, [chosenId]).ok).toBe(false); expect(session.getState()).toEqual(before);
    expect(choose(session, []).ok).toBe(true);
  });

  it('restores the exact pending snapshot and refuses fabricated owner/binding authority', () => {
    const session = setup(); expect(activate(session).ok).toBe(true);
    const snapshot = session.serializeSession();
    expect(isCanonicalGenericPendingDecisionForRestore(snapshot.state, snapshot.state.abilityRuntime!.pendingDecision!), 'current pending canonical').toBe(true);
    for (const replay of snapshot.replaySnapshots) if (replay.state.abilityRuntime?.pendingDecision) {
      expect(isCanonicalGenericPendingDecisionForRestore(replay.state, replay.state.abilityRuntime.pendingDecision), `replay ${replay.checkpointId} pending canonical`).toBe(true);
    }
    const restored = restoreTrustedAuthoringFixtureSession(snapshot);
    expect(restored.getPlayerView('p1').pendingDecision).toEqual(session.getPlayerView('p1').pendingDecision);
    expect(choose(restored, [chosenId]).ok).toBe(true);
    const bad = structuredClone(snapshot) as any;
    bad.state.abilityRuntime.pendingDecision.context.bindings.shown.revealedCards[0].ownerPlayerId = 'p3';
    expect(() => restoreTrustedAuthoringFixtureSession(bad)).toThrow();
  });

  it('returns a borrowed attack to the original owner through real battle and round cleanup', () => {
    const session = setup(); expect(activate(session).ok).toBe(true); expect(choose(session, [chosenId]).ok).toBe(true);
    advanceAbilityPhase(session.state, 'battle');
    for (let i = 0; i < 10 && session.state.round.activePhase === 'battle'; i++) {
      const id = session.state.players.find(p => p.seat === session.state.round.prioritySeat)!.id;
      expect(session.passPriority(id).ok).toBe(true);
    }
    expect(session.state.round.activePhase).toBe('round_end');
    expect(session.state.cards.find(c => c.instanceId === chosenId)).toMatchObject({zone: 'discard', ownerPlayerId: 'p2', controllerPlayerId: 'p2'});
  });

  it('does not reveal protected hands or manufacture a legal target when the reveal is empty', () => {
    const session = setup({protectedTarget: true}); expect(activate(session).ok).toBe(true);
    expect(publicHand(session)).toEqual([]);
    expect(session.getPlayerView('p1').pendingDecision!.candidates).toEqual([]);
    expect((session.getPlayerView('observer') as any).lastHandReveal.cards).toEqual([]);
    expect(choose(session, []).ok).toBe(true);
  });

  it('retains a non-Luck public snapshot when no hand card may be played', () => {
    const session = setup(); session.state.cards.find(c => c.instanceId === chosenId)!.zone = 'deck';
    expect(activate(session).ok).toBe(true);
    expect(session.getPlayerView('p1').pendingDecision!.candidates).toEqual([]);
    expect(publicHand(session).map(c => c.instanceId)).toEqual(['shown-other']);
    expect(choose(session, []).ok).toBe(true);
    expect((session.getPlayerView('observer') as any).lastHandReveal.cards.map((c: {cardId: string}) => c.cardId)).toEqual(['shown-other']);
  });

  it('revokes live hand projection after the source closes without erasing already public history', () => {
    const session = setup(); expect(activate(session).ok).toBe(true);
    session.state.abilityRuntime!.cardState[sourceId]!.active = false;
    expect(publicHand(session)).toEqual([]);
    expect(session.getPlayerView('p1').pendingDecision!.candidates).toEqual([]);
    expect(choose(session, []).ok).toBe(true);
    expect((session.getPlayerView('observer') as any).lastHandReveal.cards).toHaveLength(2);
  });

  it('rolls back borrowed control, mana and play events when the native suffix fails', () => {
    const session = setup({failTail: true}); expect(activate(session).ok).toBe(true);
    const before = session.getState();
    expect(choose(session, [chosenId]).ok).toBe(false);
    expect(session.getState()).toEqual(before);
    expect(session.state.cards.find(c => c.instanceId === chosenId)).toMatchObject({zone: 'hand', controllerPlayerId: 'p2'});
  });

  it('rechecks the ordinary attribute forbid after opening the choice', () => {
    const session = setup(); expect(activate(session).ok).toBe(true);
    const state = session.state as any;
    state.modeState.cardPlayForbids = [{attribute: '特殊', sourceType: 'situation'}];
    const before = session.getState();
    expect(choose(session, [chosenId]).ok).toBe(false);
    expect(session.getState()).toEqual(before);
    expect(choose(session, []).ok).toBe(true);
  });

  it('keeps server-trigger execution atomic when a preselected borrowed play has a failing suffix', () => {
    const session = setup({failTail: true});
    const before = session.getState();
    expect(() => executeAbility(session.state, {controllerId: 'p1', sourceCardId: sourceId, abilityId, variables: {}, selections: {players: ['p1', 'p2'], lucky: [chosenId]}})).toThrow();
    expect(session.getState()).toEqual(before);
  });

  it('restores a later native target after the revealed card was already legally borrowed', () => {
    const session = setup({pendingTail: true}); expect(activate(session).ok).toBe(true); expect(choose(session, [chosenId]).ok).toBe(true);
    expect(session.getPlayerView('p1').pendingDecision).toBeDefined();
    expect(session.state.abilityRuntime!.pendingDecision!.target.id).toBe('after');
    const restored = restoreTrustedAuthoringFixtureSession(session.serializeSession());
    expect(restored.state.cards.find(c => c.instanceId === chosenId)).toMatchObject({zone: 'attack_area', controllerPlayerId: 'p1', ownerPlayerId: 'p2'});
    expect(choose(restored, ['p2']).ok).toBe(true);
    expect(restored.state.players.find(p => p.id === 'p1')!.mana).toBe(7);
  });
});
