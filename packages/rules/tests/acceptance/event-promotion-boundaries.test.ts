import { describe, expect, it } from 'vitest';
import { AUTOMATIC_EVENT_EFFECTS, createMatchSession, restoreMatchSession } from '../../src/match-session';
import { calculateCardPower } from '../../src/ability/interpreter';
import { projectCurrentPlayerPowers, resolveBattlefield } from '../../src/core/combat-resolver';
import { movePlayer } from '../../src/core/movement';
import { humans, rejectAtomically } from './seven-roster-test-helpers';

// L1: bounded real Session states, unmodified production event definitions.
const resistanceId = 'event.waxing_moon_ritual.resistance';
const barrier = 'event.waxing_moon_ritual.vengeful_spirit_barrier';
function movementFixture(from = 'magic_workshop') {
  const session = createMatchSession({ seed: 20260907, humanPlayerIds: humans });
  session.state.round.activePhase = 'action';
  session.state.round.prioritySeat = session.state.players[0]!.seat;
  session.state.eventPlacements = [];
  session.state.currentSituationModifiers = [];
  session.state.abilityRuntime!.responseWindows = [];
  session.state.abilityRuntime!.hostRequests = [];
  delete session.state.abilityRuntime!.pendingDecision;
  Object.assign((session.state as any).modeState, { movementLocks: [], cardPlayForbids: [], closedLocations: [] });
  for (const p of session.state.players) { p.locationId = 'magic_workshop'; p.mana = 12; }
  session.state.players[0]!.locationId = from as any;
  return session;
}
function placeBarrier(session: ReturnType<typeof movementFixture>, visibility: 'public' | 'hidden_until_trigger' = 'public') {
  session.state.eventPlacements = [{ locationId: 'miyama_town', eventCardId: barrier, visibility: { scope: visibility }, battleModifiers: [] }];
  (session as any).refreshEventForbids(session.state);
}

describe('L1 event movement locks share ordinary projection and execution', () => {
  it.each([
    ['magic_workshop', 'miyama_town'],
    ['miyama_town', 'shinto'],
  ])('blocks ordinary movement %s -> %s atomically', (from, to) => {
    const session = movementFixture(from);
    placeBarrier(session);
    expect(session.getPlayerView('p1').legalActions.some(a => a.type === 'normal_move' && a.locationId === to)).toBe(false);
    rejectAtomically(session, 'p1', { type: 'normal_move', locationId: to });
    expect(session.state.players[0]!.mana).toBe(12);
    expect(session.getPlayerView('p1').players.find(p => p.id === 'p1')!.locationId).toBe(from);
  });

  it('rejects a previously projected move after the public event changes', () => {
    const session = movementFixture();
    const command = session.getPlayerView('p1').legalActions.find(a => a.type === 'normal_move' && a.locationId === 'miyama_town');
    expect(command).toBeDefined();
    placeBarrier(session);
    rejectAtomically(session, 'p1', command!);
  });

  it('does not activate a hidden barrier; an ordinary move pays once and updates projection', () => {
    const session = movementFixture();
    placeBarrier(session, 'hidden_until_trigger');
    const command = session.getPlayerView('p1').legalActions.find(a => a.type === 'normal_move' && a.locationId === 'miyama_town');
    expect(command).toBeDefined();
    expect(session.dispatchPlayerAction('p1', command!).ok).toBe(true);
    expect(session.state.players[0]!.locationId).toBe('miyama_town');
    expect(session.state.players[0]!.mana).toBe(11);
    expect(session.getPlayerView('p1').players.find(p => p.id === 'p1')!.locationId).toBe('miyama_town');
    rejectAtomically(session, 'p1', command!);
  });

  it('core effect movement also refuses the lock, except for an explicit trusted override', () => {
    const session = movementFixture();
    placeBarrier(session);
    const before = structuredClone(session.state);
    const refused = movePlayer(session.state, { playerId: 'p1', to: 'miyama_town', movementKind: 'effect' });
    expect(refused).toMatchObject({ moved: false, manaSpent: 0, reason: 'movement_locked' });
    expect(session.state).toEqual(before);
    expect(movePlayer(session.state, { playerId: 'p1', to: 'miyama_town', movementKind: 'effect', ignoreCardMovementRestrictions: true }).moved).toBe(true);
  });
});

describe('L1 unaccepted D5 automation remains on the established host notice path', () => {
  it.each(['gain_mana', 'gain_battle_result', 'recover_command_spell', 'gain_total_power', 'set_attack_base_power_range_to_value', 'draw_and_place_another_event_here'])(
    'does not advertise %s as automatically enforced', effect => expect(AUTOMATIC_EVENT_EFFECTS.has(effect)).toBe(false),
  );
  it('hidden Keian places one event with no nested-draw identity leak', () => {
    const session = movementFixture();
    const eventId = 'event.waxing_moon_ritual.keian_ceremony';
    session.state.eventDeck = [eventId, barrier];
    (session as any).placeEvent(session.state, 'shinto', 'hidden');
    expect(session.state.eventPlacements).toHaveLength(1);
    expect(session.state.eventDeck).toEqual([barrier]);
    expect(session.state.log.some(e => e.type === 'event_place_nested')).toBe(false);
    const notices = ((session.state as any).modeState.masterDirectives as any[]).filter(e => e.eventCardId === eventId);
    expect(notices).toContainEqual(expect.objectContaining({ directive: 'event_effect_host_review' }));
    const otherView = JSON.stringify(session.getPlayerView('p2'));
    expect(otherView).not.toContain(eventId);
    expect(otherView).not.toContain('event_place_nested');
  });
});

// L2: only the affected movement/power and battle settlement phases.
describe('L2 deferred event consumers cannot leak into actual settlement', () => {
  it.each(['gentle_hometown', 'beautiful_thing', 'rage_rising', 'white_night_walk'])(
    'places %s with a host notice without claiming automatic acceptance', name => {
      const session = movementFixture();
      const eventId = `event.waxing_moon_ritual.${name}`;
      session.state.eventDeck = [eventId];
      (session as any).placeEvent(session.state, 'miyama_town', 'public');
      (session as any).refreshEventForbids(session.state);
      expect(((session.state as any).modeState.masterDirectives as any[])).toContainEqual(expect.objectContaining({ directive: 'event_effect_host_review', eventCardId: eventId }));
      expect((session.state as any).modeState.eventEntryEffects).toBeUndefined();
      expect((session.state as any).modeState.basePowerOverrides).toBeUndefined();
    },
  );

  it('movement under Rage does not install an unaccepted bonus; stale checkpoint power stores are inert', () => {
    const session = movementFixture();
    session.state.eventPlacements = [{ locationId: 'miyama_town', eventCardId: 'event.waxing_moon_ritual.rage_rising', visibility: { scope: 'public' }, battleModifiers: [] }];
    (session as any).refreshEventForbids(session.state);
    const move = session.getPlayerView('p1').legalActions.find(a => a.type === 'normal_move' && a.locationId === 'miyama_town');
    expect(move).toBeDefined();
    expect(session.dispatchPlayerAction('p1', move!).ok).toBe(true);
    expect((session.state as any).modeState.entryTotalPowerBonuses).toBeUndefined();
    const source = session.state.cards.find(c => c.controllerPlayerId === 'p1' && typeof session.state.abilityRuntime!.pack.cards[c.definitionId]?.cardFace.basePower === 'number' && Number(session.state.abilityRuntime!.pack.cards[c.definitionId]?.cardFace.basePower) > 0)!;
    expect(source).toBeDefined();
    source.zone = 'attack_area';
    source.visibility = { scope: 'public' };
    session.state.abilityRuntime!.cardState[source.instanceId] = { active: true, faceDown: false };
    const power = calculateCardPower(session.state, source.instanceId);
    const totals = projectCurrentPlayerPowers(session.state, ['p1']);
    Object.assign((session.state as any).modeState, {
      entryTotalPowerBonuses: [{ playerId: 'p1', amount: 500, expiresAtRound: session.state.round.roundNumber + 1 }],
      basePowerOverrides: [{ locationId: 'miyama_town', min: 0, max: 100, value: 1000 }],
    });
    expect(calculateCardPower(session.state, source.instanceId)).toEqual(power);
    expect(projectCurrentPlayerPowers(session.state, ['p1'])).toEqual(totals);
  });

  it.each(['gentle_hometown', 'beautiful_thing'])('battle under %s does not grant the withdrawn resources automatically', name => {
    const session = movementFixture('miyama_town');
    session.state.players[1]!.locationId = 'miyama_town';
    session.state.round.activePhase = 'battle';
    session.state.eventPlacements = [{ locationId: 'miyama_town', eventCardId: `event.waxing_moon_ritual.${name}`, visibility: { scope: 'public' }, battleModifiers: [] }];
    // Isolate event settlement from unrelated card triggers; keep the actual Session/battle consumers.
    for (const c of session.state.cards) c.zone = 'deck';
    session.state.abilityRuntime!.cardState = {};
    session.state.abilityRuntime!.manaSpentThisRound = { p1: 5, p2: 5 };
    const seals = Number((session.state.players[0] as any).commandSpells);
    (session as any).resolveBattlePhase();
    // Round cleanup clears battleResults; assert its retained settlement receipt.
    expect(session.state.log).toContainEqual(expect.objectContaining({ type: 'battle_resolved', message: 'battlefield:miyama_town', payload: expect.objectContaining({ participantBreakdowns: expect.arrayContaining([expect.objectContaining({ playerId: 'p1' }), expect.objectContaining({ playerId: 'p2' })]) }) }));
    expect(session.state.round.activePhase).toBe('round_end');
    expect(session.state.players[0]!.mana).toBe(12);
    expect(Number((session.state.players[0] as any).commandSpells)).toBe(seals);
    expect(session.state.log.some(e => e.type === 'event_after_battle_applied')).toBe(false);
  });
});

describe('L2 movement-lock event lifecycle uses current authoritative placements', () => {
  it.each(['removed', 'replaced'] as const)('releases a cached barrier when its placement is %s', change => {
    const session = movementFixture();
    placeBarrier(session);
    expect(movePlayer(session.state, { playerId: 'p1', to: 'miyama_town', movementKind: 'effect' }).moved).toBe(false);
    if (change === 'removed') session.state.eventPlacements = [];
    else session.state.eventPlacements[0]!.eventCardId = resistanceId;
    expect(session.getPlayerView('p1').legalActions).toContainEqual(expect.objectContaining({ type: 'normal_move', locationId: 'miyama_town' }));
    expect(movePlayer(session.state, { playerId: 'p1', to: 'miyama_town', movementKind: 'effect' }).moved).toBe(true);
  });

  it('honors a hidden barrier revealed by the actual battle resolver without a cache refresh', () => {
    const session = movementFixture();
    placeBarrier(session, 'hidden_until_trigger');
    expect(movePlayer(session.state, { playerId: 'p1', to: 'miyama_town', movementKind: 'effect' }).moved).toBe(true);
    Object.assign(session.state, resolveBattlefield(session.state, { battlefieldId: 'miyama_town', revealHiddenEvents: true }).nextState);
    expect(session.state.eventPlacements[0]!.visibility.scope).toBe('public');
    expect(movePlayer(session.state, { playerId: 'p1', to: 'miyama_town', movementKind: 'effect' })).toMatchObject({ moved: false, reason: 'movement_locked', manaSpent: 0 });
  });

  it('restores the public barrier and ignores stale lock caches when the source is absent', () => {
    const session = movementFixture();
    placeBarrier(session);
    const restored = restoreMatchSession(session.serializeSession());
    rejectAtomically(restored, 'p1', { type: 'normal_move', locationId: 'miyama_town' });
    restored.state.eventPlacements = [];
    const unlocked = restoreMatchSession(restored.serializeSession());
    expect(unlocked.getPlayerView('p1').legalActions).toContainEqual(expect.objectContaining({ type: 'normal_move', locationId: 'miyama_town' }));
  });
});
