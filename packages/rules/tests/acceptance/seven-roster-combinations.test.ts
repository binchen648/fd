import { describe, expect, it } from 'vitest';
import { advanceAbilityPhase } from '../../src/ability/interpreter';
import { restoreMatchSession } from '../../src/match-session';
import { resolveBattlefield } from '../../src/core/combat-resolver';
import { currentDeploymentBonus } from '../../src/core/terrain-advantage';
import { active, activate, card, choose, dispatch, fixture, playPair, player, rejectAtomically } from './seven-roster-test-helpers';

describe('A-ACCEPT-06 bounded cross-effect and lifecycle witnesses', () => {
  it.each([1, 2, 3])('Tomoe Inferno withholds unpaid positive terrain only next round: round %i', round => {
    const { session, playerId, sourceId } = fixture('servant.tomoe.skill.sc-tomoe-2');
    playPair(session, playerId, sourceId);
    activate(session, playerId, sourceId, 'sc-tomoe-2.inferno-fire');
    const opponent = session.state.players.find(p => p.id !== playerId && p.masterCardId !== 'master.kayneth')!;
    // Rules 3.1/8.2: battlefield population is unlimited. Inferno restricts
    // terrain slots, not entrance to the battlefield itself.
    session.state.map.locations.find(l => l.id === 'miyama_town')!.terrainBonuses = [1, 2, 3];
    for (const p of session.state.players) delete p.locationId;
    advanceAbilityPhase(session.state, 'advance', round);
    session.state.round.prioritySeat = opponent.seat;
    player(session, opponent.id).vp = 0;
    const offered = session.getPlayerView(opponent.id).legalActions.some(a => a.type === 'deploy_player' && a.locationId === 'miyama_town');
    expect(offered).toBe(true);
    dispatch(session, opponent.id, { type: 'deploy_player', locationId: 'miyama_town' });
    // Final rules §8: ordinary deployment takes highest available printed slot.
    expect(currentDeploymentBonus(session.state, opponent.id)).toBe(round === 2 ? 0 : Math.max(...session.state.map.locations.find(l => l.id === 'miyama_town')!.terrainBonuses!));
  });

  it.each([0, 1, 2])('Maiya borrowed Support Shot requires the full two VP, payer starts with %i', vp => {
    const { session, playerId, sourceId } = fixture('master.maiya.skill.military');
    player(session, playerId).locationId = 'recon';
    session.state.round.activePhase = 'advance';
    const recipient = session.state.players.find(p => p.id !== playerId)!.id;
    activate(session, playerId, sourceId, 'military.attach-support-shot');
    choose(session, playerId, [recipient]);
    const support = session.state.cards.find(c => c.definitionId === 'master.maiya.deck.support-shot')!;
    expect(support.controllerPlayerId).toBe(recipient);
    session.state.round.activePhase = 'action';
    session.state.round.prioritySeat = player(session, recipient).seat;
    player(session, recipient).locationId = 'miyama_town';
    player(session, recipient).vp = vp;
    const ownerVp = player(session, playerId).vp;
    dispatch(session, recipient, { type: 'skip_normal_move' });
    const command = { type: 'activate_ability' as const, cardInstanceId: support.instanceId, abilityId: 'support-shot.suppress' };
    if (vp < 2) rejectAtomically(session, recipient, command);
    else {
      dispatch(session, recipient, command);
      expect(player(session, recipient).vp).toBe(0);
      expect(player(session, playerId).vp).toBe(ownerVp + 2);
      session.state.map.locations.find(l => l.id === 'miyama_town')!.terrainBonuses = [3];
      const result = resolveBattlefield(session.state, {
        battlefieldId: 'miyama_town',
        participants: [{ playerId: recipient, totalPower: 0, attackTags: ['特殊'], terrainSlotIndex: 0 }],
      }).nextState.battleResults.at(-1)!;
      expect(result.participantBreakdowns[0]!.modifiers.find(m => m.source === 'location')?.value).toBe(8);
    }
  });

  it('Caster private looked-card continuation survives restore and rejects another player choosing it', () => {
    const { session, playerId, sourceId } = fixture('servant.artoriac.skill.sc-artoriac-2');
    playPair(session, playerId, sourceId);
    dispatch(session, playerId, { type: 'activate_ability', cardInstanceId: sourceId, abilityId: 'sc-artoriac-2.pay-x-look-x-plus-two', variables: { X: 2 } });
    const pending = session.getPlayerView(playerId).pendingDecision!;
    expect(pending.candidates).toHaveLength(4);
    const other = session.state.players.find(p => p.id !== playerId)!.id;
    expect(session.getPlayerView(other).pendingDecision).toBeUndefined();
    const restored = restoreMatchSession(session.serializeSession());
    expect(restored.getPlayerView(playerId).pendingDecision).toEqual(pending);
    rejectAtomically(restored, other, { type: 'choose_target', decisionId: pending.id, selectedIds: [pending.candidates[0]!] });
    choose(restored, playerId, [pending.candidates[0]!]);
    expect(card(restored, pending.candidates[0]!).zone).toBe('hand');
    expect(restored.getPlayerView(playerId).pendingDecision).toBeUndefined();
  });

  it('Maiya cannot be offered an attachment when she cannot pay its mandatory two mana', () => {
    const { session, playerId, sourceId } = fixture('master.maiya.skill.military');
    session.state.round.activePhase = 'advance';
    player(session, playerId).locationId = 'recon';
    player(session, playerId).mana = 1;
    const offered = session.getPlayerView(playerId).legalActions.some(a => a.type === 'activate_ability' && a.cardInstanceId === sourceId && a.abilityId === 'military.attach-support-shot');
    expect(offered).toBe(false);
  });

  it('Caster return window excludes old-round attacks, face-up skills and another controller cards', () => {
    const { session, playerId, sourceId } = fixture('servant.artoriac.skill.sc-artoriac-1');
    playPair(session, playerId, sourceId);
    const current = session.state.cards.find(c => c.definitionId === 'servant.artoriac.skill.sc-artoriac-4')!;
    const old = session.state.cards.find(c => c.definitionId === 'servant.artoriac.skill.sc-artoriac-5')!;
    const skill = session.state.cards.find(c => c.definitionId === 'servant.artoriac.skill.sc-artoriac-2')!;
    const alien = session.state.cards.find(c => c.controllerPlayerId !== playerId && c.zone === 'hand')!;
    for (const c of [current, old, skill, alien]) active(session, c.instanceId);
    session.state.abilityRuntime!.cardState[old.instanceId]!.playedRound = 0;
    session.state.round.activePhase = 'battle';
    activate(session, playerId, sourceId, 'sc-artoriac-1.return-current-round-attack');
    const targets = session.getPlayerView(playerId).pendingDecision!.candidates;
    expect(targets).toContain(current.instanceId);
    for (const excluded of [sourceId, old.instanceId, skill.instanceId, alien.instanceId]) expect(targets).not.toContain(excluded);
    choose(session, playerId, [current.instanceId]);
    expect(card(session, current.instanceId).zone).toBe('hand');
  });


});
