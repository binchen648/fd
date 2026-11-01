import { describe, expect, it } from 'vitest';
import { processAbilityEvent } from '../../src/ability/interpreter';
import { resolveBattlefield, projectCurrentPlayerPowers } from '../../src/core/combat-resolver';
import { advanceAbilityPhase } from '../../src/ability/interpreter';
import { restoreMatchSession } from '../../src/match-session';
import { activate, active, card, dispatch, fixture, playPair, player, rejectAtomically } from './seven-roster-test-helpers';

describe('A-ACCEPT-06 repair permission and payment boundaries', () => {
  it('Eresh absent Protection placement activates its fixed field effect without pretending that it was played', () => {
    const { session, playerId, sourceId } = fixture('servant.ereshkigal.skill.sc-ereshkigal-3');
    active(session, sourceId);
    const protection = session.state.cards.find(c => c.definitionId === 'servant.ereshkigal.skill.sc-ereshkigal-2')!;
    const before = session.state.abilityRuntime!.events.length;
    activate(session, playerId, sourceId, 'sc-ereshkigal-3.blooming-netherworld');
    expect(card(session, protection.instanceId).zone).toBe('field');
    expect(session.state.abilityRuntime!.cardState[protection.instanceId]).toMatchObject({ active: true, faceDown: false, boardLocationId: 'miyama_town' });
    const events = session.state.abilityRuntime!.events.slice(before);
    expect(events).toContainEqual(expect.objectContaining({ type: 'card_placed', cardInstanceId: protection.instanceId }));
    expect(events.some(e => e.type === 'card_played')).toBe(false);
    session.state.currentSituationModifiers = [{ sourceId: 'a06-situation', targetTag: '特殊', value: 2 }];
    const opponent = session.state.players.find(p => p.id !== playerId)!.id;
    player(session, opponent).locationId = 'miyama_town';
    const result = resolveBattlefield(session.state, { battlefieldId: 'miyama_town', participants: [{ playerId: opponent, totalPower: 4, attackTags: ['特殊'] }] }).nextState.battleResults.at(-1)!;
    expect(result.participantBreakdowns[0]!.modifiers.filter(m => m.source === 'situation').reduce((n,m) => n+m.value,0)).toBe(-2);
  });

  it.each(['phase', 'scope'] as const)('rejects battlefield placement whose field contract has an unaccepted %s', boundary => {
    const { session, playerId, sourceId } = fixture('servant.ereshkigal.skill.sc-ereshkigal-3');
    active(session, sourceId);
    const rule = session.state.abilityRuntime!.pack.cards['servant.ereshkigal.skill.sc-ereshkigal-2']!.abilities[0]!;
    if (boundary === 'phase') rule.activation.phase = 'combat';
    if (boundary === 'scope') rule.effects[0]!.scope = 'only_a_different_battlefield';
    rejectAtomically(session, playerId, { type: 'activate_ability', cardInstanceId: sourceId, abilityId: 'sc-ereshkigal-3.blooming-netherworld' });
  });

  it('a total-power seal survives serialization state and expires next round without changing individual attacks', () => {
    const { session, playerId, sourceId } = fixture('master.gatou.command-spell');
    const hand = session.state.cards.filter(c => c.controllerPlayerId === playerId && c.zone === 'hand').slice(0, 2);
    for (const c of hand) active(session, c.instanceId);
    const before = projectCurrentPlayerPowers(session.state, [playerId])[playerId]!;
    activate(session, playerId, sourceId, 'command-spell.power-victory');
    expect(projectCurrentPlayerPowers(session.state, [playerId])[playerId]! - before).toBe(2);
    const restored = restoreMatchSession(session.serializeSession());
    expect(projectCurrentPlayerPowers(restored.state, [playerId])[playerId]! - before).toBe(2);
    advanceAbilityPhase(restored.state, 'action', 2);
    expect(projectCurrentPlayerPowers(restored.state, [playerId])[playerId]!).toBe(before);
  });
  it('does not widen a controller mana exception carrying an unaccepted extra selector', () => {
    const { session, playerId, sourceId } = fixture('master.kayneth.skill.double-master');
    const d = session.state.abilityRuntime!.pack.cards[card(session, sourceId).definitionId]!;
    (d.abilities[0]!.ruleModifiers[0]!.scope as Record<string, unknown>).onlyDefinitionId = 'different.skill';
    const skill = session.state.cards.find(c => c.controllerPlayerId === playerId && c.definitionId === 'servant.artoria-alt.skill.sc-artoria-alt-1')!;
    player(session, playerId).mana = 7;
    rejectAtomically(session, playerId, { type: 'stage_attack_card', cardInstanceId: skill.instanceId });
  });

  it('does not ignore an unaccepted lifecycle on a controller mana exception', () => {
    const { session, playerId, sourceId } = fixture('master.kayneth.skill.double-master');
    const d = session.state.abilityRuntime!.pack.cards[card(session, sourceId).definitionId]!;
    d.abilities[0]!.lifecycle = { expiresAtRound: 0 };
    const skill = session.state.cards.find(c => c.controllerPlayerId === playerId && c.definitionId === 'servant.artoria-alt.skill.sc-artoria-alt-1')!;
    player(session, playerId).mana = 7;
    rejectAtomically(session, playerId, { type: 'stage_attack_card', cardInstanceId: skill.instanceId });
  });

  it.each(['phase', 'cost', 'selector'] as const)('does not treat an unsupported %s-limited aura as an unconditional prohibition', boundary => {
    const { session, playerId, sourceId } = fixture('servant.artoria-alt.skill.sc-artoria-alt-2');
    player(session, playerId).mana = 7;
    playPair(session, playerId, sourceId);
    const d = session.state.abilityRuntime!.pack.cards[card(session, sourceId).definitionId]!;
    const aura = d.abilities.find(a => a.id === 'sc-artoria-alt-2.forbid-noble-phantasm-when-low-mana')!;
    if (boundary === 'phase') aura.activation.phase = 'combat';
    if (boundary === 'cost') aura.cost = [{ type: 'pay_mana', amount: 2 }];
    if (boundary === 'selector') (aura.ruleModifiers[0]!.scope as Record<string, unknown>).onlyDefinitionId = 'different.skill';
    const noble = session.state.cards.find(c => c.definitionId === 'servant.ereshkigal.skill.sc-ereshkigal-3')!;
    player(session, noble.controllerPlayerId).locationId = 'miyama_town';
    session.state.round.prioritySeat = player(session, noble.controllerPlayerId).seat;
    dispatch(session, noble.controllerPlayerId, { type: 'skip_normal_move' });
    dispatch(session, noble.controllerPlayerId, { type: 'stage_attack_card', cardInstanceId: noble.instanceId });
  });

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
