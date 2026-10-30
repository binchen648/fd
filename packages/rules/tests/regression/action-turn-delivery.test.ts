import { describe, expect, it } from 'vitest';
import { createMatchSession, restoreMatchSession } from '../../src/match-session';
import type { AbilityCommand } from '../../src/ability/types';

function actionSession() {
  const session = createMatchSession({ seed: 20260904, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
  session.state.round.activePhase = 'action';
  session.state.round.prioritySeat = 1;
  session.state.eventPlacements = [];
  session.state.currentSituationModifiers = [];
  // Neutral authoritative fixture; dedicated tests below install and assert explicit restrictions.
  (session.state as any).modeState.cardPlayForbids = [];
  (session.state as any).modeState.closedLocations = [];
  for (const player of session.state.players) player.locationId = 'magic_workshop';
  session.state.players[0]!.mana = 10;
  return session;
}

function command(session: ReturnType<typeof actionSession>, action: unknown, playerId = 'p1') {
  return session.dispatchPlayerCommand(playerId, action as AbilityCommand);
}
function rejectAtomically(session: ReturnType<typeof actionSession>, action: unknown, playerId = 'p1') {
  session.getPlayerView(playerId);
  const before = session.getState();
  const result = command(session, action, playerId);
  expect(result.ok).toBe(false);
  expect(result.events).toEqual([]);
  expect(session.getState()).toEqual(before);
}
function playPair(session: ReturnType<typeof actionSession>, faceDown = false) {
  for (let index = 0; index < 2; index++) {
    const action = session.getPlayerView('p1').legalActions.find(a => a.type === 'stage_attack_card' && !!a.faceDown === faceDown);
    expect(action).toBeDefined();
    expect(command(session, action).ok).toBe(true);
  }
  expect(command(session, { type: 'confirm_staged_attack' }).ok).toBe(true);
}

describe('DR-P01 authoritative action turn', () => {
  it('requires movement or skip before a simultaneous regular attack, then allows ending the turn', () => {
    const session = actionSession();
    expect(session.getPlayerView('p1').legalActions).toContainEqual({ type: 'skip_normal_move' });
    expect(session.getPlayerView('p1').legalActions).toContainEqual({ type: 'normal_move', locationId: 'recon', manaCost: 5 });
    expect(session.passPriority('p1').ok).toBe(false);
    expect(session.dispatchPlayerCommand('p1', { type: 'normal_move', locationId: 'recon' } as AbilityCommand).ok).toBe(true);
    expect(session.state.players[0]!.mana).toBe(5);
    expect(session.passPriority('p1').ok).toBe(false);
    const attacks = session.getPlayerView('p1').legalActions.filter(action => action.type === 'stage_attack_card' && action.faceDown);
    expect(attacks.length).toBeGreaterThanOrEqual(2);
    expect(session.dispatchPlayerCommand('p1', attacks[0]!).ok).toBe(true);
    expect(session.dispatchPlayerCommand('p1', { type: 'confirm_staged_attack' }).ok).toBe(false);
    expect(session.dispatchPlayerCommand('p1', attacks[1]!).ok).toBe(true);
    expect(session.dispatchPlayerCommand('p1', { type: 'confirm_staged_attack' }).ok).toBe(true);
    expect(session.passPriority('p1').ok).toBe(true);
    expect(session.state.round.prioritySeat).toBe(2);
  });

  it.each(['preparation', 'advance', 'battle', 'round_end'] as const)('rejects normal move in %s atomically', phase => {
    const session = actionSession();
    session.state.round.activePhase = phase;
    rejectAtomically(session, { type: 'normal_move', locationId: 'recon' });
    rejectAtomically(session, { type: 'skip_normal_move' });
  });

  it('rejects wrong priority, same place, reverse, invented destination and unaffordable route', () => {
    const session = actionSession();
    rejectAtomically(session, { type: 'normal_move', locationId: 'recon' }, 'p2');
    rejectAtomically(session, { type: 'normal_move', locationId: 'magic_workshop' });
    rejectAtomically(session, { type: 'normal_move', locationId: 'forged' });
    session.state.players[0]!.mana = 4;
    rejectAtomically(session, { type: 'normal_move', locationId: 'recon', manaCost: 0 });
    session.state.players[0]!.locationId = 'shinto';
    rejectAtomically(session, { type: 'normal_move', locationId: 'miyama_town' });
  });

  it('uses destination capacity, automatic engagement, closed locations and already resolved battlefield guards', () => {
    const session = actionSession();
    session.state.players[1]!.locationId = 'recon';
    rejectAtomically(session, { type: 'normal_move', locationId: 'recon' });
    session.state.players[0]!.locationId = 'miyama_town';
    session.state.players[1]!.locationId = 'miyama_town';
    rejectAtomically(session, { type: 'normal_move', locationId: 'shinto' });
    session.state.players[0]!.locationId = 'magic_workshop';
    (session.state as any).modeState.closedLocations = ['shinto'];
    rejectAtomically(session, { type: 'normal_move', locationId: 'shinto' });
    (session.state as any).modeState.closedLocations = [];
    session.state.battleResults.push({ battlefieldId: 'miyama_town' } as any);
    rejectAtomically(session, { type: 'normal_move', locationId: 'miyama_town' });
  });

  it('charges the entire route once, emits only destination entry and never grants deployment reward', () => {
    const session = actionSession();
    const beforeEvents = session.state.abilityRuntime!.events.length;
    expect(command(session, { type: 'normal_move', locationId: 'shinto', manaCost: 0 }).ok).toBe(true);
    expect(session.state.players[0]!.mana).toBe(7);
    expect(session.state.players[0]!.locationId).toBe('shinto');
    const moves = session.state.log.filter(e => e.type === 'movement');
    expect(moves).toHaveLength(1);
    expect(moves[0]?.payload).toMatchObject({ from: 'magic_workshop', to: 'shinto', movementKind: 'normal', manaSpent: 3 });
    expect(session.logs.filter(e => e.type === 'workshop_deployment_mana_awarded')).toHaveLength(0);
    expect(session.state.abilityRuntime!.events.slice(beforeEvents).filter(e => e.type === 'after_player_deployed_to_battlefield')).toHaveLength(0);
    rejectAtomically(session, { type: 'normal_move', locationId: 'recon' });
  });

  it('rejects early play, repeated skip/move and second regular batch; keeps opponent staging private', () => {
    const session = actionSession();
    const hand = session.state.cards.find(card => card.ownerPlayerId === 'p1' && card.zone === 'hand')!;
    rejectAtomically(session, { type: 'play_card', cardInstanceId: hand.instanceId });
    rejectAtomically(session, { type: 'stage_attack_card', cardInstanceId: hand.instanceId });
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    rejectAtomically(session, { type: 'skip_normal_move' });
    const stage = session.getPlayerView('p1').legalActions.find(a => a.type === 'stage_attack_card' && !a.faceDown)!;
    expect(command(session, stage).ok).toBe(true);
    expect(session.getPlayerView('p2').stagedAttacks).toBeUndefined();
    expect(JSON.stringify(session.getPlayerView('p2'))).not.toContain(hand.instanceId);
    expect(command(session, { type: 'cancel_staged_attack' }).ok).toBe(true);
    playPair(session, true);
    expect(session.getPlayerView('p1').actionTurn).toEqual({ movement: 'skipped', regularPlay: 'complete' });
    rejectAtomically(session, { type: 'normal_move', locationId: 'recon' });
    rejectAtomically(session, { type: 'stage_attack_card', cardInstanceId: hand.instanceId });
  });

  it('requires all remaining hand cards when hand has one or two, and supports only-one or empty batches', () => {
    for (const count of [0, 1, 2]) {
      const session = actionSession();
      const hand = session.state.cards.filter(c => c.ownerPlayerId === 'p1' && c.zone === 'hand');
      hand.slice(count).forEach(c => { c.zone = 'deck'; });
      session.state.players[0]!.mana = 0;
      expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
      if (count === 0) expect(command(session, { type: 'complete_empty_regular_play' }).ok).toBe(true);
      else {
        for (const card of hand.slice(0, count)) expect(command(session, { type: 'stage_attack_card', cardInstanceId: card.instanceId, faceDown: true }).ok).toBe(true);
        expect(command(session, { type: 'confirm_staged_attack' }).ok).toBe(true);
      }
      expect(session.getPlayerView('p1').playSummary?.attacksDeclaredThisRound).toBe(count);
      expect(session.passPriority('p1').ok).toBe(true);
    }
  });

  it('requires a face-up attack at a battlefield, and validates aggregate payment before any trigger', () => {
    const session = actionSession();
    session.state.players[0]!.locationId = 'miyama_town';
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    const downs = session.getPlayerView('p1').legalActions.filter(a => a.type === 'stage_attack_card' && a.faceDown);
    expect(command(session, downs[0]).ok).toBe(true);
    rejectAtomically(session, downs[1]);
    rejectAtomically(session, { type: 'confirm_staged_attack' });
    expect(command(session, { type: 'cancel_staged_attack' }).ok).toBe(true);
    playPair(session);
    expect(session.getPlayerView('p1').players.find(p => p.id === 'p1')?.totalPower).toEqual(expect.any(Number));
  });

  it.each([1, 2])('completes an empty batch when %i remaining hand cards cannot fund any legal battlefield batch', count => {
    const session = actionSession();
    const hand = session.state.cards.filter(card => card.ownerPlayerId === 'p1' && card.zone === 'hand');
    hand.forEach((card, index) => { card.definitionId = 'basic.preparation'; if (index >= count) card.zone = 'deck'; });
    session.state.players[0]!.mana = 0;
    session.state.players[0]!.locationId = 'miyama_town';
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    const actions = session.getPlayerView('p1').legalActions;
    expect(actions).toContainEqual({ type: 'complete_empty_regular_play' });
    expect(actions.some(action => action.type === 'stage_attack_card')).toBe(false);
    expect(command(session, { type: 'complete_empty_regular_play' }).ok).toBe(true);
    expect(session.state.players[0]!.mana).toBe(0);
    expect(session.state.cards.filter(card => card.ownerPlayerId === 'p1' && card.zone === 'hand')).toHaveLength(count);
    expect(session.state.abilityRuntime!.events.some(event => event.type === 'hand_revealed_for_regular_play')).toBe(false);
    for (const card of hand.slice(0, count)) expect(JSON.stringify(session.projectToClientState('p2'))).not.toContain(card.instanceId);
    expect(session.passPriority('p1').ok).toBe(true);
  });

  it('plays the largest affordable hand subset when individually affordable mandatory cards cost too much together', () => {
    const session = actionSession();
    const hand = session.state.cards.filter(card => card.ownerPlayerId === 'p1' && card.zone === 'hand');
    hand[0]!.definitionId = 'servant.tomoe.skill.sc-tomoe-2';
    hand[1]!.definitionId = 'servant.tomoe.skill.sc-tomoe-3';
    hand.slice(2).forEach(card => { card.zone = 'deck'; });
    session.state.players[0]!.mana = 5;
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    rejectAtomically(session, { type: 'complete_empty_regular_play' });
    expect(session.getPlayerView('p1').legalActions).toContainEqual({ type: 'stage_attack_card', cardInstanceId: hand[0]!.instanceId });
    expect(command(session, { type: 'stage_attack_card', cardInstanceId: hand[0]!.instanceId }).ok).toBe(true);
    rejectAtomically(session, { type: 'stage_attack_card', cardInstanceId: hand[1]!.instanceId });
    expect(command(session, { type: 'confirm_staged_attack' }).ok).toBe(true);
    expect(session.state.players[0]!.mana).toBe(2);
    expect(session.state.cards.find(card => card.instanceId === hand[1]!.instanceId)?.zone).toBe('hand');
    expect(session.state.abilityRuntime!.events.some(event => event.type === 'hand_revealed_for_regular_play')).toBe(false);
    expect(JSON.stringify(session.projectToClientState('p2'))).not.toContain(hand[1]!.instanceId);
    expect(session.passPriority('p1').ok).toBe(true);
  });

  it('leaves an individually unaffordable skill hand card private while playing the affordable basic hand card', () => {
    const session = actionSession();
    const hand = session.state.cards.filter(card => card.ownerPlayerId === 'p1' && card.zone === 'hand');
    hand[0]!.definitionId = 'servant.tomoe.skill.sc-tomoe-3';
    hand[1]!.definitionId = 'basic.magecraft.2';
    hand.slice(2).forEach(card => { card.zone = 'deck'; });
    session.state.players[0]!.mana = 1;
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    rejectAtomically(session, { type: 'complete_empty_regular_play' });
    rejectAtomically(session, { type: 'stage_attack_card', cardInstanceId: hand[0]!.instanceId, faceDown: true });
    expect(command(session, { type: 'stage_attack_card', cardInstanceId: hand[1]!.instanceId }).ok).toBe(true);
    expect(command(session, { type: 'confirm_staged_attack' }).ok).toBe(true);
    expect(session.state.players[0]!.mana).toBe(1);
    expect(session.state.cards.find(card => card.instanceId === hand[0]!.instanceId)?.zone).toBe('hand');
    expect(JSON.stringify(session.projectToClientState('p2'))).not.toContain(hand[0]!.instanceId);
    expect(session.passPriority('p1').ok).toBe(true);
  });

  it('uses affordable skill sources only behind the unchanged eight-mana gate when the mandatory hand batch is too expensive', () => {
    const session = actionSession();
    const hand = session.state.cards.filter(card => card.ownerPlayerId === 'p1' && card.zone === 'hand');
    hand.forEach((card, index) => { card.definitionId = 'servant.ereshkigal.skill.sc-ereshkigal-3'; if (index > 1) card.zone = 'deck'; });
    session.state.players[0]!.mana = 8;
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    rejectAtomically(session, { type: 'complete_empty_regular_play' });
    for (const id of ['p1-servant.tomoe.skill.sc-tomoe-2', 'p1-servant.tomoe.skill.sc-tomoe-3']) {
      expect(command(session, { type: 'stage_attack_card', cardInstanceId: id }).ok).toBe(true);
    }
    expect(command(session, { type: 'confirm_staged_attack' }).ok).toBe(true);
    expect(session.state.players[0]!.mana).toBe(1);
    expect(session.state.cards.filter(card => card.ownerPlayerId === 'p1' && card.zone === 'hand')).toHaveLength(2);
    expect(session.state.abilityRuntime!.events.some(event => event.type === 'hand_revealed_for_regular_play')).toBe(false);
    const belowGate = actionSession();
    belowGate.state.players[0]!.mana = 7;
    expect(command(belowGate, { type: 'skip_normal_move' }).ok).toBe(true);
    rejectAtomically(belowGate, { type: 'stage_attack_card', cardInstanceId: 'p1-servant.tomoe.skill.sc-tomoe-2' });
  });

  it('restores an affordable reduced batch and revalidates changed mana before confirmation', () => {
    let session = actionSession();
    const hand = session.state.cards.filter(card => card.ownerPlayerId === 'p1' && card.zone === 'hand');
    hand[0]!.definitionId = 'servant.tomoe.skill.sc-tomoe-2';
    hand[1]!.definitionId = 'servant.tomoe.skill.sc-tomoe-3';
    hand.slice(2).forEach(card => { card.zone = 'deck'; });
    session.state.players[0]!.mana = 5;
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    expect(command(session, { type: 'stage_attack_card', cardInstanceId: hand[0]!.instanceId }).ok).toBe(true);
    const before = session.getPlayerView('p1');
    session = restoreMatchSession(session.serializeSession());
    expect(session.getPlayerView('p1')).toEqual(before);
    session.state.players[0]!.mana = 2;
    rejectAtomically(session, { type: 'confirm_staged_attack' });
    session.state.players[0]!.mana = 5;
    expect(command(session, { type: 'confirm_staged_attack' }).ok).toBe(true);
    expect(session.state.players[0]!.mana).toBe(2);
    expect(session.passPriority('p1').ok).toBe(true);
  });

  it('restores exactly before move, after move, while staged and after regular play; rejects erased or forged continuation', () => {
    let session = actionSession();
    for (const step of ['before', 'moved', 'staged', 'complete']) {
      if (step === 'moved') expect(command(session, { type: 'normal_move', locationId: 'recon' }).ok).toBe(true);
      if (step === 'staged') {
        const stage = session.getPlayerView('p1').legalActions.find(a => a.type === 'stage_attack_card' && a.faceDown)!;
        expect(command(session, stage).ok).toBe(true);
      }
      if (step === 'complete') {
        const stage = session.getPlayerView('p1').legalActions.find(a => a.type === 'stage_attack_card' && a.faceDown)!;
        expect(command(session, stage).ok).toBe(true);
        expect(command(session, { type: 'confirm_staged_attack' }).ok).toBe(true);
      }
      const expected = session.getPlayerView('p1');
      const durable = session.serializeSession();
      session = restoreMatchSession(durable);
      expect(session.getPlayerView('p1')).toEqual(expected);
      for (const corrupt of [(s: any) => { delete s.state.modeState.actionTurns; }, (s: any) => { s.state.modeState.actionTurns.byPlayer.p1 = { movement: 'pending', regularPlay: 'pending' }; }]) {
        const forged = structuredClone(durable);
        corrupt(forged);
        expect(() => restoreMatchSession(forged)).toThrow();
      }
    }
  });

  it('rejects malformed and unknown commands atomically', () => {
    const session = actionSession();
    for (const invalid of [null, {}, { type: 'forged_action' }, { type: 'normal_move' }, { type: 'normal_move', locationId: {} }]) rejectAtomically(session, invalid);
  });

  it('allows phase abilities before movement, between steps and after the complete batch, but not inside staging', () => {
    const session = actionSession();
    const manaAbility = { type: 'activate_ability', cardInstanceId: 'p1-master.shinji.command-spell', abilityId: 'command-spell.gain-mana' };
    expect(command(session, manaAbility).ok).toBe(true);
    expect(session.getPlayerView('p1').actionTurn?.movement).toBe('pending');
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    expect(command(session, manaAbility).ok).toBe(true);
    const stage = session.getPlayerView('p1').legalActions.find(a => a.type === 'stage_attack_card' && !a.faceDown)!;
    expect(command(session, stage).ok).toBe(true);
    rejectAtomically(session, manaAbility);
    expect(command(session, { type: 'cancel_staged_attack' }).ok).toBe(true);
    playPair(session);
    expect(command(session, manaAbility).ok).toBe(true);
    expect(session.getPlayerView('p1').actionTurn).toEqual({ movement: 'skipped', regularPlay: 'complete' });
  });

  it('keeps effect movement and Time Alter effect play separate from both ordinary action quotas', () => {
    const session = actionSession();
    session.state.players[0]!.locationId = 'miyama_town';
    session.state.players[1]!.locationId = 'miyama_town';
    const surveil = session.state.cards.find(c => c.ownerPlayerId === 'p1' && c.definitionId === 'basic.surveil')!;
    surveil.zone = 'attack_area'; surveil.visibility = { scope: 'public' };
    session.state.abilityRuntime!.cardState[surveil.instanceId] = { active: true, faceDown: false, playedRound: 1 };
    expect(command(session, { type: 'activate_ability', cardInstanceId: surveil.instanceId, abilityId: 'basic.surveil.battle-dash' }).ok).toBe(true);
    const moveTarget = session.getPlayerView('p1').legalActions.find(a => a.type === 'choose_target')!;
    expect(moveTarget.type).toBe('choose_target');
    if (moveTarget.type !== 'choose_target') throw new Error('Expected target');
    expect(command(session, { type: 'choose_target', decisionId: moveTarget.decisionId, selectedIds: ['shinto'] }).ok).toBe(true);
    expect(session.state.players[0]!.mana).toBe(10);
    expect(session.getPlayerView('p1').actionTurn?.movement).toBe('pending');
    expect(command(session, { type: 'normal_move', locationId: 'recon' }).ok).toBe(true);
    expect(session.state.players[0]!.mana).toBe(8);

    const altered = actionSession();
    altered.state.round.prioritySeat = 6;
    expect(command(altered, { type: 'activate_ability', cardInstanceId: 'p6-master.kiritsugu.skill.time-alter', abilityId: 'time-alter.action' }, 'p6').ok).toBe(true);
    const decision = altered.getPlayerView('p6').legalActions.find(a => a.type === 'choose_target')!;
    if (decision.type !== 'choose_target') throw new Error('Expected Time Alter target');
    expect(command(altered, { type: 'choose_target', decisionId: decision.decisionId, selectedIds: [decision.candidates[0]!] }, 'p6').ok).toBe(true);
    expect(altered.getPlayerView('p6').actionTurn).toEqual({ movement: 'pending', regularPlay: 'pending' });
    expect(altered.getPlayerView('p6').playSummary?.attacksDeclaredThisRound).toBe(0);
    expect(altered.state.cards.some(c => c.controllerPlayerId === 'p6' && c.zone === 'attack_area')).toBe(true);
  });

  it('uses pre-batch eight-mana eligibility and aggregate costs without interleaved gains', () => {
    const session = actionSession();
    session.state.players[0]!.mana = 8;
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    for (const id of ['p1-servant.tomoe.skill.sc-tomoe-2', 'p1-servant.tomoe.skill.sc-tomoe-3']) {
      expect(command(session, { type: 'stage_attack_card', cardInstanceId: id }).ok).toBe(true);
    }
    expect(session.state.players[0]!.mana).toBe(8);
    expect(command(session, { type: 'confirm_staged_attack' }).ok).toBe(true);
    expect(session.state.players[0]!.mana).toBe(1);
    const unavailable = actionSession();
    unavailable.state.players[0]!.mana = 7;
    expect(command(unavailable, { type: 'skip_normal_move' }).ok).toBe(true);
    rejectAtomically(unavailable, { type: 'stage_attack_card', cardInstanceId: 'p1-servant.tomoe.skill.sc-tomoe-2' });
    const costly = actionSession();
    costly.state.players[0]!.mana = 8;
    costly.state.cards.find(c => c.instanceId === 'p1-servant.tomoe.skill.sc-tomoe-2')!.definitionId = 'servant.ereshkigal.skill.sc-ereshkigal-3';
    expect(command(costly, { type: 'skip_normal_move' }).ok).toBe(true);
    expect(command(costly, { type: 'stage_attack_card', cardInstanceId: 'p1-servant.tomoe.skill.sc-tomoe-2' }).ok).toBe(true);
    rejectAtomically(costly, { type: 'stage_attack_card', cardInstanceId: 'p1-servant.tomoe.skill.sc-tomoe-3' });
  });

  it('forces the only hand card into a two-source batch', () => {
    const session = actionSession();
    session.state.cards.filter(c => c.ownerPlayerId === 'p1' && c.zone === 'hand').slice(1).forEach(c => { c.zone = 'deck'; });
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    expect(command(session, { type: 'stage_attack_card', cardInstanceId: 'p1-servant.tomoe.skill.sc-tomoe-1' }).ok).toBe(true);
    rejectAtomically(session, { type: 'stage_attack_card', cardInstanceId: 'p1-servant.tomoe.skill.sc-tomoe-2' });
    expect(session.getPlayerView('p1').legalActions.filter(a => a.type === 'stage_attack_card').every(a => a.type === 'stage_attack_card' && session.state.cards.find(c => c.instanceId === a.cardInstanceId)?.zone === 'hand')).toBe(true);
  });

  it('reveals the hand only for the explicit all-face-up-forbidden fallback, then completes face-down', () => {
    const session = actionSession();
    session.state.players[0]!.locationId = 'miyama_town';
    const hand = session.state.cards.filter(c => c.ownerPlayerId === 'p1' && c.zone === 'hand');
    const attributes = [...new Set(hand.flatMap(c => session.rawCards.get(c.definitionId)?.cardFace.attributes ?? []))];
    (session.state as any).modeState.cardPlayForbids = attributes.map(attribute => ({ sourceType: 'situation', attribute, rule: 'situation_play_forbid' }));
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    expect(JSON.stringify(session.projectToClientState('p2'))).not.toContain(hand[0]!.instanceId);
    playPair(session, true);
    expect(session.state.abilityRuntime!.events).toContainEqual({ type: 'hand_revealed_for_regular_play', playerId: 'p1', revealedCards: hand.map(c => ({ instanceId: c.instanceId, definitionId: c.definitionId })) });
    expect(JSON.stringify(session.projectToClientState('p2').logs)).toContain('hand_revealed_for_regular_play');
    const ordinary = actionSession();
    expect(command(ordinary, { type: 'skip_normal_move' }).ok).toBe(true);
    playPair(ordinary, true);
    expect(ordinary.state.abilityRuntime!.events.some(e => e.type === 'hand_revealed_for_regular_play')).toBe(false);
  });

  it('keeps unplayed hand cards private when ordinary mana shortage leads to voluntary face-down play', () => {
    const session = actionSession();
    session.state.players[0]!.mana = 0;
    const hand = session.state.cards.filter(c => c.ownerPlayerId === 'p1' && c.zone === 'hand');
    hand.forEach(card => { card.definitionId = 'basic.preparation'; });
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    playPair(session, true);
    expect(session.state.abilityRuntime!.events.some(e => e.type === 'hand_revealed_for_regular_play')).toBe(false);
    const remaining = session.state.cards.find(c => c.ownerPlayerId === 'p1' && c.zone === 'hand')!;
    expect(JSON.stringify(session.projectToClientState('p2'))).not.toContain(remaining.instanceId);
  });

  it('does not bypass a partial attribute prohibition by voluntarily turning the prohibited attack face-down', () => {
    const session = actionSession();
    const hand = session.state.cards.filter(c => c.ownerPlayerId === 'p1' && c.zone === 'hand');
    hand[0]!.definitionId = 'basic.preparation';
    hand[1]!.definitionId = 'basic.magecraft.2';
    hand[2]!.zone = 'deck';
    (session.state as any).modeState.cardPlayForbids = [{ sourceType: 'situation', attribute: '特殊', rule: 'situation_play_forbid' }];
    expect(command(session, { type: 'skip_normal_move' }).ok).toBe(true);
    rejectAtomically(session, { type: 'stage_attack_card', cardInstanceId: hand[0]!.instanceId, faceDown: true });
    expect(session.state.abilityRuntime!.events.some(e => e.type === 'hand_revealed_for_regular_play')).toBe(false);
  });

  it('keeps hidden Shinto event identity, reward and modifiers out of every player and spectator projection until revelation', () => {
    const session = createMatchSession({ seed: 20260904, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const hidden = session.state.eventPlacements.find(event => event.locationId === 'shinto')!;
    expect(hidden.visibility.scope).toBe('hidden_until_trigger');
    for (const viewerId of ['p2', 'spectator:observer']) {
      expect(JSON.stringify(session.projectToClientState(viewerId))).not.toContain(hidden.eventCardId);
      const placementLog = session.projectToClientState(viewerId).logs.find(entry => entry.type === 'event_placed' && entry.message.includes('shinto'))!;
      expect(placementLog.payload?.placement).not.toHaveProperty('victoryPoints');
      expect(placementLog.payload?.placement).not.toHaveProperty('battleModifiers');
    }
    session.state.ruleOverrides ??= {};
    session.state.ruleOverrides.viewFaceDownEventsPlayerIds = ['p2'];
    expect(JSON.stringify(session.projectToClientState('p2'))).toContain(hidden.eventCardId);
    expect(JSON.stringify(session.projectToClientState('spectator:observer'))).not.toContain(hidden.eventCardId);
    session.state.ruleOverrides.viewFaceDownEventsPlayerIds = [];
    for (let index = 0; index < 14; index++) session.advanceToNextDecision();
    expect(session.state.round.activePhase).toBe('action');
    for (const viewerId of ['p2', 'spectator:observer']) expect(JSON.stringify(session.projectToClientState(viewerId))).toContain(hidden.eventCardId);
  });

  it('clears current staging after a triggered draw replaces the transaction state, then permits the next phase ability', () => {
    const session = actionSession();
    session.state.round.prioritySeat = 2;
    session.state.players[1]!.mana = 12;
    expect(command(session, { type: 'skip_normal_move' }, 'p2').ok).toBe(true);
    expect(command(session, { type: 'stage_attack_card', cardInstanceId: 'p2-servant.drake.skill.sc-drake-1' }, 'p2').ok).toBe(true);
    const basic = session.getPlayerView('p2').legalActions.find(action => action.type === 'stage_attack_card' && !action.faceDown && session.state.cards.find(card => card.instanceId === action.cardInstanceId)?.zone === 'hand')!;
    expect(command(session, basic, 'p2').ok).toBe(true);
    expect(command(session, { type: 'confirm_staged_attack' }, 'p2').ok).toBe(true);
    expect(session.getPlayerView('p2').stagedAttacks).toBeUndefined();
    expect(command(session, { type: 'activate_ability', cardInstanceId: 'p2-servant.drake.skill.sc-drake-1', abilityId: 'sc-drake-1.mount-summon' }, 'p2').ok).toBe(true);
  });

  it('fails closed on legacy action snapshots, and safely enables the contract before legacy preparation resumes', () => {
    const session = actionSession();
    delete (session.state as any).modeState.actionTurns;
    expect(() => restoreMatchSession(session.serializeSession())).toThrow('Legacy action snapshot');
    session.state.round.activePhase = 'preparation';
    const restored = restoreMatchSession(session.serializeSession());
    restored.state.round.activePhase = 'action';
    expect(restored.getPlayerView('p1').legalActions).toContainEqual({ type: 'skip_normal_move' });
    expect(restored.passPriority('p1').ok).toBe(false);
  });

  it('finishes all seven action turns before seven battle decisions, and settles only once', () => {
    const session = actionSession();
    session.state.players.forEach(player => { player.locationId = player.seat <= 2 ? 'miyama_town' : 'shinto'; });
    for (const player of session.state.players) {
      expect(session.state.round).toMatchObject({ activePhase: 'action', prioritySeat: player.seat });
      expect(command(session, { type: 'skip_normal_move' }, player.id).ok).toBe(true);
      for (let step = 0; step < 5 && session.getPlayerView(player.id).actionTurn?.regularPlay !== 'complete'; step++) {
        const actions = session.getPlayerView(player.id).legalActions;
        const next = actions.find(a => a.type === 'confirm_staged_attack') ?? actions.find(a => a.type === 'complete_empty_regular_play') ?? actions.find(a => a.type === 'stage_attack_card' && !a.faceDown)!;
        expect(command(session, next, player.id).ok).toBe(true);
      }
      expect(session.passPriority(player.id).ok).toBe(true);
    }
    expect(session.state.round).toMatchObject({ activePhase: 'battle', prioritySeat: 1 });
    expect(session.battleHistory).toHaveLength(0);
    for (const player of session.state.players) {
      expect(session.state.round).toMatchObject({ activePhase: 'battle', prioritySeat: player.seat });
      expect(session.passPriority(player.id).ok).toBe(true);
    }
    expect(session.state.round.activePhase).toBe('round_end');
    const history = structuredClone(session.battleHistory);
    expect(history.length).toBeGreaterThan(0);
    expect(session.runUntilHumanInputOrRoundEnd()).toBe('round_end');
    expect(session.battleHistory).toEqual(history);
  });

  it('resumes a signed post-scoring response after durable restore without reopening any completed battle decision', () => {
    let session = actionSession();
    for (const player of session.state.players) {
      player.locationId = ['p1', 'p7'].includes(player.id) ? 'miyama_town' : 'shinto';
      player.mana = 12;
    }
    session.state.cards.filter(card => card.controllerPlayerId === 'p1' && card.zone === 'hand').forEach(card => { card.definitionId = 'basic.magecraft.2'; });
    for (const player of session.state.players) {
      expect(command(session, { type: 'skip_normal_move' }, player.id).ok).toBe(true);
      if (player.id === 'p7') expect(command(session, { type: 'stage_attack_card', cardInstanceId: 'p7-servant.artoria-alt.skill.sc-artoria-alt-3' }, player.id).ok).toBe(true);
      for (let step = 0; step < 5 && session.getPlayerView(player.id).actionTurn?.regularPlay !== 'complete'; step++) {
        const actions = session.getPlayerView(player.id).legalActions;
        const next = actions.find(a => a.type === 'confirm_staged_attack') ?? actions.find(a => a.type === 'complete_empty_regular_play') ?? actions.find(a => a.type === 'stage_attack_card' && !a.faceDown)!;
        expect(command(session, next, player.id).ok).toBe(true);
      }
      expect(session.passPriority(player.id).ok).toBe(true);
    }
    for (const player of session.state.players) expect(session.passPriority(player.id).ok).toBe(true);
    expect(session.state.abilityRuntime!.responseWindows.length).toBeGreaterThan(0);
    const durable = session.serializeSession();
    session = restoreMatchSession(durable);
    const settledHistory = structuredClone(session.battleHistory);
    const settledVp = session.state.players.map(player => player.vp);
    for (let guard = 0; guard < 10 && session.state.abilityRuntime!.responseWindows.length; guard++) {
      const owner = session.state.abilityRuntime!.responseWindows[0]!.controllerId;
      const decline = session.getPlayerView(owner).legalActions.find(action => action.type === 'decline_this_window')!;
      const result = command(session, decline, owner);
      expect(result.ok).toBe(true);
      expect(result.view.legalActions.some(action => action.type === 'activate_ability')).toBe(false);
    }
    expect(session.getPlayerView('p7').legalActions.some(action => action.type === 'activate_ability')).toBe(false);
    rejectAtomically(session, { type: 'activate_ability', cardInstanceId: 'p7-servant.artoria-alt.skill.sc-artoria-alt-3', abilityId: 'sc-artoria-alt-3.magic-resistance' }, 'p7');
    expect(session.runUntilHumanInputOrRoundEnd()).toBe('round_end');
    expect(session.battleHistory).toEqual(settledHistory);
    expect(session.state.players.map(player => player.vp)).toEqual(settledVp);
    const corrupted = structuredClone(durable);
    corrupted.logs = corrupted.logs.filter(log => log.type !== 'battle_decisions_completed');
    expect(() => restoreMatchSession(corrupted)).toThrow();
    expect(session.runUntilHumanInputOrRoundEnd()).toBe('round_end');
    expect(session.battleHistory).toEqual(settledHistory);
  });
});
