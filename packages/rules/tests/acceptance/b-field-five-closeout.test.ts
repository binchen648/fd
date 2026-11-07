import { describe, expect, it } from 'vitest';
import { calculateCardPower } from '../../src/ability/interpreter';
import { restoreMatchSession } from '../../src/match-session';
import { fixture, player, playPair, dispatch, rejectAtomically } from './seven-roster-test-helpers';

describe('B field closeout: actual Session authoring consumers', () => {
  it.each(['basic.luck', 'card.luck', 'mixed'])('Caster counts %s once per owned discard instance and recomputes after restore', kind => {
    const { session, playerId, sourceId } = fixture('servant.artoriac.skill.sc-artoriac-3');
    const other = session.state.players.find(p => p.id !== playerId)!.id;
    session.state.cards.push({ instanceId: 'other-luck', definitionId: 'basic.luck', ownerPlayerId: other,
      controllerPlayerId: other, zone: 'discard', visibility: { scope: 'public' } });
    playPair(session, playerId, sourceId);
    expect(calculateCardPower(session.state, sourceId).value).toBe(0);
    for (let i = 0; i < 4; i++) {
      session.state.cards.push({ instanceId: `counted-luck-${i}`, definitionId: kind === 'mixed' ? (i % 2 ? 'card.luck' : 'basic.luck') : kind,
        ownerPlayerId: playerId, controllerPlayerId: playerId, zone: 'discard', visibility: { scope: 'public' } });
      expect(calculateCardPower(session.state, sourceId).value).toBe(Math.min((i + 1) * 5, 15));
    }
    const restored = restoreMatchSession(session.serializeSession());
    expect(calculateCardPower(restored.state, sourceId).value).toBe(15);
    for (const c of restored.state.cards.filter(c => c.instanceId.startsWith('counted-luck-'))) c.zone = 'hand';
    expect(calculateCardPower(restored.state, sourceId).value).toBe(0);
  });

  it.each([1, 2, 3, 4, 5, 6, 7])('Tomoe stage projection and direct admission use rotated first half, starting seat %i', startingSeat => {
    const { session, playerId, sourceId } = fixture('servant.tomoe.skill.sc-tomoe-1');
    session.state.round.startingSeat = startingSeat;
    const order = [...session.state.players].sort((a,b) => Number(a.seat < startingSeat) - Number(b.seat < startingSeat) || a.seat-b.seat);
    const allowed = order.findIndex(p => p.id === playerId) < 3;
    const offered = session.getPlayerView(playerId).legalActions.some(a => a.type === 'stage_attack_card' && a.cardInstanceId === sourceId && !a.faceDown);
    expect(offered).toBe(allowed);
    if (allowed) dispatch(session, playerId, { type: 'stage_attack_card', cardInstanceId: sourceId });
    else rejectAtomically(session, playerId, { type: 'stage_attack_card', cardInstanceId: sourceId });
  });

  it('Tomoe confirm rechecks changed order after staging and restored state', () => {
    const { session, playerId, sourceId } = fixture('servant.tomoe.skill.sc-tomoe-1');
    const seat = player(session, playerId).seat;
    session.state.round.startingSeat = seat;
    dispatch(session, playerId, { type: 'stage_attack_card', cardInstanceId: sourceId });
    const supplement = session.getPlayerView(playerId).legalActions.find(a => a.type === 'stage_attack_card' && a.faceDown)!;
    expect(supplement).toBeDefined();
    dispatch(session, playerId, supplement);
    const restored = restoreMatchSession(session.serializeSession());
    restored.state.round.startingSeat = seat % 7 + 1;
    rejectAtomically(restored, playerId, { type: 'confirm_staged_attack' });
  });
});
