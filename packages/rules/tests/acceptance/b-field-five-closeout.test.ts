import { describe, expect, it } from 'vitest';
import { advanceAbilityPhase, calculateCardPower } from '../../src/ability/interpreter';
import { currentDeploymentBonus } from '../../src/core/terrain-advantage';
import { restoreMatchSession } from '../../src/match-session';
import { fixture, player, playPair, dispatch, rejectAtomically, activate, active, choose } from './seven-roster-test-helpers';

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

function borrowedSupport(vp: number) {
  const f = fixture('master.maiya.skill.military');
  player(f.session, f.playerId).locationId = 'recon';
  f.session.state.round.activePhase = 'advance';
  const borrower = f.session.state.players.find(p => p.id !== f.playerId)!.id;
  activate(f.session, f.playerId, f.sourceId, 'military.attach-support-shot');
  choose(f.session, f.playerId, [borrower]);
  const source = f.session.state.cards.find(c => c.definitionId === 'master.maiya.deck.support-shot')!;
  f.session.state.round.activePhase = 'action';
  f.session.state.round.prioritySeat = player(f.session, borrower).seat;
  player(f.session, borrower).locationId = 'miyama_town';
  player(f.session, borrower).vp = vp;
  dispatch(f.session, borrower, { type: 'skip_normal_move' });
  return { ...f, borrower, support: source.instanceId };
}

describe('Exact VP cost and base terrain, actual Session', () => {
  it.each([0, 1])('balance %i is omitted from projection and atomically refused', vp => {
    const f = borrowedSupport(vp);
    expect(f.session.getPlayerView(f.borrower).legalActions.some(a => a.type === 'activate_ability' && a.cardInstanceId === f.support && a.abilityId === 'support-shot.suppress')).toBe(false);
    rejectAtomically(f.session, f.borrower, { type: 'activate_ability', cardInstanceId: f.support, abilityId: 'support-shot.suppress' });
  });
  it.each([0, 3])('pays exactly once and computes (base %i +1)*2 through restore and expiry', base => {
    const f = borrowedSupport(2);
    const ownerVP = player(f.session, f.playerId).vp;
    f.session.state.map.locations.find(l => l.id === 'miyama_town')!.terrainBonuses = [base];
    (f.session.state as any).modeState.terrainAssignments = { miyama_town: [f.borrower] };
    activate(f.session, f.borrower, f.support, 'support-shot.suppress');
    expect(player(f.session, f.borrower).vp).toBe(0);
    expect(player(f.session, f.playerId).vp).toBe(ownerVP + 2);
    expect(currentDeploymentBonus(f.session.state, f.borrower)).toBe((base + 1) * 2);
    const restored = restoreMatchSession(f.session.serializeSession());
    expect(currentDeploymentBonus(restored.state, f.borrower)).toBe((base + 1) * 2);
    rejectAtomically(restored, f.borrower, { type: 'activate_ability', cardInstanceId: f.support, abilityId: 'support-shot.suppress' });
    advanceAbilityPhase(restored.state, 'action', restored.state.round.roundNumber + 1);
    expect(currentDeploymentBonus(restored.state, f.borrower)).toBe(base);
  });
  it('self-use is exempt but a missing or changed recipient is never replaced by source ownership', () => {
    const f = fixture('master.maiya.deck.support-shot');
    active(f.session, f.sourceId);
    player(f.session, f.playerId).vp = 0;
    activate(f.session, f.playerId, f.sourceId, 'support-shot.suppress');
    expect(player(f.session, f.playerId).vp).toBe(0);
    const g = borrowedSupport(2);
    player(g.session, g.playerId).masterCardId = 'master.shinji';
    rejectAtomically(g.session, g.borrower, { type: 'activate_ability', cardInstanceId: g.support, abilityId: 'support-shot.suppress' });
  });
  it('base terrain bonus works without allocating a terrain slot and ends when its source closes', () => {
    const f = borrowedSupport(2);
    (f.session.state as any).modeState.terrainAssignments = { miyama_town: [] };
    activate(f.session, f.borrower, f.support, 'support-shot.suppress');
    expect(currentDeploymentBonus(f.session.state, f.borrower)).toBe(2);
    expect((f.session.state as any).modeState.terrainAssignments.miyama_town).toEqual([]);
    f.session.state.abilityRuntime!.cardState[f.support]!.active = false;
    expect(currentDeploymentBonus(f.session.state, f.borrower)).toBe(0);
  });
});
