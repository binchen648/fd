import { describe, expect, it } from 'vitest';
import { advanceAbilityPhase, processAbilityEvent } from '../../src/ability/interpreter';
import { currentDeploymentBonus } from '../../src/core/terrain-advantage';
import { restoreMatchSession } from '../../src/match-session';
import { active, activate, card, choose, dispatch, fixture, playPair, player, rejectAtomically } from './seven-roster-test-helpers';

function infernoFixture() {
  const f = fixture('servant.tomoe.skill.sc-tomoe-2');
  playPair(f.session, f.playerId, f.sourceId);
  activate(f.session, f.playerId, f.sourceId, 'sc-tomoe-2.inferno-fire');
  advanceAbilityPhase(f.session.state, 'advance', 2);
  for (const p of f.session.state.players) delete p.locationId;
  f.session.state.map.locations.find(l => l.id === 'miyama_town')!.terrainBonuses = [5, 3, 1];
  const opponent = f.session.state.players.find(p => p.id !== f.playerId && p.masterCardId !== 'master.kayneth')!.id;
  f.session.state.round.prioritySeat = player(f.session, opponent).seat;
  player(f.session, opponent).vp = 8;
  return { ...f, opponent };
}

describe('A-ACCEPT-06 paid deployment, timing and movement recovery', () => {
  it.each(['gatou', 'olga-marie'])('%s power seal settles its personal victory reward after restore and never twice for one result', master => {
    const { session, playerId, sourceId } = fixture(`master.${master}.command-spell`);
    const before = player(session, playerId).vp;
    activate(session, playerId, sourceId, 'command-spell.power-victory');
    const restored = restoreMatchSession(session.serializeSession());
    const event = { id: 'a06-win-one', type: 'after_controller_wins_battle', playerId, resultId: 'a06-result-one', battleResult: { winners: [playerId], loserIds: [] } };
    processAbilityEvent(restored.state, event);
    expect(player(restored, playerId).vp).toBe(before + 2);
    processAbilityEvent(restored.state, { ...event, id: 'a06-duplicate-same-result' });
    expect(player(restored, playerId).vp).toBe(before + 2);
    processAbilityEvent(restored.state, { ...event, id: 'a06-win-two', resultId: 'a06-result-two' });
    expect(player(restored, playerId).vp).toBe(before + (master === 'gatou' ? 4 : 2));
    advanceAbilityPhase(restored.state, 'action', 2);
    const next = player(restored, playerId).vp;
    processAbilityEvent(restored.state, { ...event, id: 'a06-later-round', resultId: 'a06-result-later' });
    expect(player(restored, playerId).vp).toBe(next);
  });
  it('does not offer Wind King when its fixed four-mana ability cost cannot be paid', () => {
    const { session, playerId, sourceId } = fixture('servant.artoria-alt.skill.sc-artoria-alt-1');
    active(session, sourceId);
    player(session, playerId).mana = 3;
    expect(session.getPlayerView(playerId).legalActions.some(a => a.type === 'activate_ability' && a.cardInstanceId === sourceId && a.abilityId === 'sc-artoria-alt-1.chain-of-wind-king')).toBe(false);
    rejectAtomically(session, playerId, { type: 'activate_ability', cardInstanceId: sourceId, abilityId: 'sc-artoria-alt-1.chain-of-wind-king' });
  });
  it('does not broaden an unaccepted response window on a movement seal', () => {
    const { session, playerId, sourceId } = fixture('master.gatou.command-spell');
    const a = session.state.abilityRuntime!.pack.cards[card(session, sourceId).definitionId]!.abilities.find(a => a.id === 'command-spell.free-move')!;
    a.responseWindow.opens = 'different_phase';
    rejectAtomically(session, playerId, { type: 'activate_ability', cardInstanceId: sourceId, abilityId: 'command-spell.free-move' });
  });
  it.each([0, 1, 2, 3, 4, 5])('Inferno payment %i charges once and selects an affordable terrain slot', payment => {
    const { session, opponent } = infernoFixture();
    const options = session.getPlayerView(opponent).legalActions.filter(a => a.type === 'deploy_player' && a.locationId === 'miyama_town');
    expect(options.map(a => a.type === 'deploy_player' ? a.vpPayment ?? 0 : -1)).toEqual([0, 1, 2, 3, 4, 5]);
    dispatch(session, opponent, { type: 'deploy_player', locationId: 'miyama_town', vpPayment: payment });
    expect(player(session, opponent).vp).toBe(8 - payment);
    expect(currentDeploymentBonus(session.state, opponent)).toBe(payment === 0 ? 0 : payment < 3 ? 1 : payment < 5 ? 3 : 5);
    rejectAtomically(session, opponent, { type: 'deploy_player', locationId: 'miyama_town', vpPayment: payment });
    expect(player(session, opponent).vp).toBe(8 - payment);
  });

  it.each([-1, 6, 1.5, NaN, Infinity, '2', true, null])('rejects malformed deployment payment %s before any mutation', payment => {
    const { session, opponent } = infernoFixture();
    rejectAtomically(session, opponent, { type: 'deploy_player', locationId: 'miyama_town', vpPayment: payment } as any);
  });

  it('does not offer or accept a payment exceeding actual VP', () => {
    const { session, opponent } = infernoFixture();
    player(session, opponent).vp = 1;
    const options = session.getPlayerView(opponent).legalActions.filter(a => a.type === 'deploy_player' && a.locationId === 'miyama_town');
    expect(options).toHaveLength(2);
    rejectAtomically(session, opponent, { type: 'deploy_player', locationId: 'miyama_town', vpPayment: 2 });
  });

  it('preserves slot holes so the source controller can use an unpaid high slot', () => {
    const { session, opponent, playerId } = infernoFixture();
    dispatch(session, opponent, { type: 'deploy_player', locationId: 'miyama_town', vpPayment: 1 });
    session.state.round.prioritySeat = player(session, playerId).seat;
    dispatch(session, playerId, { type: 'deploy_player', locationId: 'miyama_town' });
    expect(currentDeploymentBonus(session.state, playerId)).toBe(5);
    expect(currentDeploymentBonus(session.state, opponent)).toBe(1);
  });

  it('restores Inferno before payment and preserves its fixed location and expiry', () => {
    const { session, opponent } = infernoFixture();
    const restored = restoreMatchSession(session.serializeSession());
    dispatch(restored, opponent, { type: 'deploy_player', locationId: 'miyama_town', vpPayment: 3 });
    expect(currentDeploymentBonus(restored.state, opponent)).toBe(3);
    expect(player(restored, opponent).vp).toBe(5);
  });

  it('does not accept an Inferno payment at an unaffected battlefield', () => {
    const { session, opponent } = infernoFixture();
    rejectAtomically(session, opponent, { type: 'deploy_player', locationId: 'shinto', vpPayment: 1 });
    dispatch(session, opponent, { type: 'deploy_player', locationId: 'shinto' });
    expect(player(session, opponent).vp).toBe(8);
  });

  it('Maiya base-terrain addition and multiplier both expire next round', () => {
    const { session, playerId, sourceId } = fixture('master.maiya.deck.support-shot');
    active(session, sourceId);
    session.state.map.locations.find(l => l.id === 'miyama_town')!.terrainBonuses = [3];
    (session.state as any).modeState.terrainAssignments = { miyama_town: [playerId] };
    activate(session, playerId, sourceId, 'support-shot.suppress');
    expect(currentDeploymentBonus(session.state, playerId)).toBe(8);
    advanceAbilityPhase(session.state, 'action', 2);
    expect(currentDeploymentBonus(session.state, playerId)).toBe(3);
  });

  it.each([false, true])('Tomoe card admission follows first-half clockwise order (last=%s)', last => {
    const { session, playerId, sourceId } = fixture('servant.tomoe.skill.sc-tomoe-1');
    const seat = player(session, playerId).seat;
    session.state.round.startingSeat = last ? seat % 7 + 1 : seat;
    const command = { type: 'stage_attack_card' as const, cardInstanceId: sourceId };
    if (last) rejectAtomically(session, playerId, command);
    else dispatch(session, playerId, command);
  });

  it.each(['magic_workshop', 'recon'] as const)('movement seal rejects its illegal origin %s without spending a seal', location => {
    const { session, playerId, sourceId } = fixture('master.gatou.command-spell');
    player(session, playerId).locationId = location;
    const before = (player(session, playerId) as any).commandSpells;
    rejectAtomically(session, playerId, { type: 'activate_ability', cardInstanceId: sourceId, abilityId: 'command-spell.free-move' });
    expect((player(session, playerId) as any).commandSpells).toBe(before);
  });

  it('movement seal restores its pending choice, respects closed destinations and never pays mana', () => {
    const { session, playerId, sourceId } = fixture('master.gatou.command-spell');
    const mana = player(session, playerId).mana;
    activate(session, playerId, sourceId, 'command-spell.free-move');
    const pending = session.getPlayerView(playerId).pendingDecision!;
    expect(pending.candidates).toContain('shinto');
    const restored = restoreMatchSession(session.serializeSession());
    (restored.state as any).modeState.closedLocations = ['shinto'];
    rejectAtomically(restored, playerId, { type: 'choose_target', decisionId: pending.id, selectedIds: ['shinto'] });
    choose(restored, playerId, ['recon']);
    expect(player(restored, playerId).locationId).toBe('recon');
    expect(player(restored, playerId).mana).toBe(mana);
    expect((player(restored, playerId) as any).commandSpells).toBe(2);
  });
});
