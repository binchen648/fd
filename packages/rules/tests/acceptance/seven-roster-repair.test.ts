import { describe, expect, it } from 'vitest';
import { processAbilityEvent } from '../../src/ability/interpreter';
import { activate, active, card, dispatch, fixture, playPair, player, rejectAtomically } from './seven-roster-test-helpers';

describe('A-ACCEPT-06 repair permission and payment boundaries', () => {
  it('Kayneth bypasses only the eight-mana threshold and still pays the complete printed cost', () => {
    const { session, playerId, sourceId } = fixture('master.kayneth.skill.double-master');
    const skill = session.state.cards.find(c => c.controllerPlayerId === playerId && c.definitionId === 'servant.artoria-alt.skill.sc-artoria-alt-1')!;
    expect(skill).toBeDefined();
    const cost = Number(session.state.abilityRuntime!.pack.cards[skill.definitionId]!.cardFace.cost);
    player(session, playerId).mana = cost - 1;
    rejectAtomically(session, playerId, { type: 'stage_attack_card', cardInstanceId: skill.instanceId });
    player(session, playerId).mana = cost;
    playPair(session, playerId, skill.instanceId);
    expect(player(session, playerId).mana).toBe(0);
    expect(card(session, sourceId).zone).toBe('skill');
  });

  it.each(['source-in-hand', 'controller-changed', 'master-changed'] as const)('Kayneth exception does not survive %s', boundary => {
    const { session, playerId, sourceId } = fixture('master.kayneth.skill.double-master');
    const skill = session.state.cards.find(c => c.controllerPlayerId === playerId && c.definitionId === 'servant.artoria-alt.skill.sc-artoria-alt-1')!;
    if (boundary === 'source-in-hand') card(session, sourceId).zone = 'hand';
    if (boundary === 'controller-changed') card(session, sourceId).controllerPlayerId = session.state.players.find(p => p.id !== playerId)!.id;
    if (boundary === 'master-changed') player(session, playerId).masterCardId = 'master.shinji';
    player(session, playerId).mana = 7;
    rejectAtomically(session, playerId, { type: 'stage_attack_card', cardInstanceId: skill.instanceId });
  });

  it('an installed Alter prohibition follows current mana across seven/eight instead of latching its initial condition', () => {
    const { session, playerId, sourceId } = fixture('servant.artoria-alt.skill.sc-artoria-alt-2');
    player(session, playerId).mana = 7;
    playPair(session, playerId, sourceId);
    processAbilityEvent(session.state, { id: 'a06-install-conditional-aura', type: 'while_active', playerId });
    const noble = session.state.cards.find(c => c.definitionId === 'servant.ereshkigal.skill.sc-ereshkigal-3')!;
    const opponent = noble.controllerPlayerId;
    player(session, opponent).locationId = 'miyama_town';
    session.state.round.prioritySeat = player(session, opponent).seat;
    dispatch(session, opponent, { type: 'skip_normal_move' });
    const offered = () => session.getPlayerView(opponent).legalActions.some(a => a.type === 'stage_attack_card' && a.cardInstanceId === noble.instanceId);
    expect(offered()).toBe(false);
    player(session, playerId).mana = 8;
    expect(offered()).toBe(true);
    player(session, playerId).mana = 7;
    expect(offered()).toBe(false);
    rejectAtomically(session, opponent, { type: 'stage_attack_card', cardInstanceId: noble.instanceId });
  });

  it('Maiya can use her own active Support Shot without paying herself VP', () => {
    const { session, playerId, sourceId } = fixture('master.maiya.deck.support-shot');
    active(session, sourceId);
    player(session, playerId).vp = 0;
    activate(session, playerId, sourceId, 'support-shot.suppress');
    expect(player(session, playerId).vp).toBe(0);
  });

  it('Maiya cannot forge an unaffordable attachment activation even if she bypasses its projection', () => {
    const { session, playerId, sourceId } = fixture('master.maiya.skill.military');
    session.state.round.activePhase = 'advance';
    player(session, playerId).locationId = 'recon';
    player(session, playerId).mana = 1;
    rejectAtomically(session, playerId, { type: 'activate_ability', cardInstanceId: sourceId, abilityId: 'military.attach-support-shot' });
  });
});
