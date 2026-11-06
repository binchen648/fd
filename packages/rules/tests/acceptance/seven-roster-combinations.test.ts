import { describe, expect, it } from 'vitest';
import { advanceAbilityPhase } from '../../src/ability/interpreter';
import { restoreMatchSession } from '../../src/match-session';
import { resolveBattlefield } from '../../src/core/combat-resolver';
import { createMatchRoomHub } from '../../src/match-room-hub';
import { chooseFullMatchDecision } from '../../../../e2e/support/full-seven-player-driver';
import type { AbilityCommand } from '../../src/ability/types';
import { currentDeploymentBonus } from '../../src/core/terrain-advantage';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

  it('runs seven human seats with a resource-aware active policy and accepted responses through round eleven', () => {
    const hub = createMatchRoomHub();
    const roomId = 'a-accept-06-active-policy';
    hub.createRoom({ roomId, seed: 20260907, hostClientId: 'seat-1' });
    for (let seat = 1; seat <= 7; seat++) {
      const id = `seat-${seat}`;
      if (seat > 1) hub.joinRoom(roomId, { clientId: id, displayName: id, role: 'player' });
      hub.selectSeat(roomId, id, seat);
    }
    hub.startMatch(roomId, 'seat-1');
    const issued: Array<{ round: number; phase: string; playerId: string; command?: AbilityCommand }> = [];
    const abilityIds = new Set<string>();
    let restores = 0;
    for (let step = 0; step < 1600; step++) {
      const projections = Array.from({ length: 7 }, (_, i) => hub.project(roomId, `seat-${i + 1}`));
      const first = projections[0]!.match!;
      if (first.outcome) break;
      expect(first.directives.filter(d => d.status === 'pending'), JSON.stringify(issued.slice(-5))).toEqual([]);
      let { projection, command } = chooseFullMatchDecision(projections);
      const actions = projection.match!.view.legalActions;
      const decision = actions.find(a => a.type === 'choose_target');
      const response = actions.find(a => a.type === 'resolve_response');
      const actor = projection.match!.view.players.find(p => p.id === projection.viewer.playerId)!;
      // This player policy reads only its public/owner projection and printed
      // costs. The separate mandatory-cost test above retains the faulty offer.
      // Completing this game does NOT certify that every offered action works.
      const activeAction = actions.find(a => a.type === 'activate_ability' &&
        !a.abilityId.startsWith('command-spell.') && a.abilityId !== 'false-attendant-book.first-empty-seals' &&
        !(a.abilityId === 'military.attach-support-shot' && actor.mana < 2) &&
        !(a.abilityId === 'support-shot.suppress' && actor.masterCardId !== 'master.maiya' && actor.vp < 2) &&
        // A player may choose to use deck replacement only once; this is not
        // evidence accepting/rejecting the historical timing clarification.
        !(a.abilityId === 'magus-killer.setup' && issued.some(e => e.command && 'abilityId' in e.command && e.command.abilityId === a.abilityId)));
      // Keep Shinji out of battle so the excluded master-change trigger is not
      // deliberately driven by this policy. His other effects have bounded tests.
      const isShinji = actor.masterCardId === 'master.shinji';
      if (decision?.type === 'choose_target') {
        command = { type: 'choose_target', decisionId: decision.decisionId,
          selectedIds: decision.candidates.includes('discard_hand') ? ['discard_hand'] : decision.candidates.slice(0, decision.min) };
      } else if (response) command = response as AbilityCommand;
      else if (activeAction?.type === 'activate_ability') command = {
        type: 'activate_ability', cardInstanceId: activeAction.cardInstanceId, abilityId: activeAction.abilityId,
        ...(activeAction.variableCosts?.length ? { variables: Object.fromEntries(activeAction.variableCosts.map(v => [v.name, Math.min(v.max, Math.max(v.min, 1))])) } : {}),
      };
      else if (first.phase === 'advance' && isShinji) command = actions.find(a => a.type === 'deploy_player' && a.locationId === 'magic_workshop') as AbilityCommand | undefined ?? command;
      else if (first.phase === 'action') {
        const movement = actions.find(a => a.type === 'skip_normal_move');
        const skill = actions.find(a => a.type === 'stage_attack_card' && !a.faceDown && a.cardInstanceId.includes('skill'));
        command = movement as AbilityCommand | undefined ?? skill as AbilityCommand | undefined ?? command;
      }
      const entry = { round: first.round, phase: first.phase, playerId: projection.viewer.playerId!, command };
      issued.push(entry);
      const revision = projection.match!.view.revision;
      const result = command ? hub.dispatchCommand(roomId, projection.viewer.clientId, command, revision) : hub.endTurn(roomId, projection.viewer.clientId, revision);
      if (!result.result.ok && process.env.FD_ACCEPT_EVIDENCE) writeFileSync(join(process.env.FD_ACCEPT_EVIDENCE, `active-seven-game-blocked-r${first.round}-${issued.length}.json`), JSON.stringify({
        seed: 20260907, stateInjected: false, steps: issued.length, abilityIds: [...abilityIds], restores,
        round: first.round, phase: first.phase, rejection: result.result.rejection,
        commandWasProjected: command ? actions.some(a => a.type === command!.type && (!('abilityId' in a) || ('abilityId' in command! && a.abilityId === command!.abilityId))) : true,
        commands: issued,
      }, null, 2));
      expect(result.result.ok, JSON.stringify({ ...entry, rejection: result.result.rejection, previous: issued.slice(-4) })).toBe(true);
      if (command && 'abilityId' in command) abilityIds.add(command.abilityId);
      if (command?.type === 'choose_target' && restores === 0) {
        const room = hub.getRoom(roomId);
        const snapshot = room.serializeRoom();
        hub.restoreRoom(roomId, snapshot);
        restores++;
      }
    }
    const final = hub.project(roomId, 'seat-1').match!;
    if (process.env.FD_ACCEPT_EVIDENCE) writeFileSync(join(process.env.FD_ACCEPT_EVIDENCE, 'active-seven-game.json'), JSON.stringify({
      seed: 20260907, stateInjected: false, steps: issued.length, abilityIds: [...abilityIds], restores,
      round: final.round, stopReason: final.stopReason, outcome: final.outcome, commands: issued,
    }, null, 2));
    expect(final.stopReason, JSON.stringify({ last: issued.slice(-5), abilityIds: [...abilityIds] })).toBe('match_complete');
    expect(final.round).toBe(11);
    expect(abilityIds.size, JSON.stringify([...abilityIds])).toBeGreaterThan(3);
    expect(restores).toBe(1);
    expect(hub.getRoom(roomId).session!.state.players.find(p => p.masterCardId === 'master.shinji')).toBeDefined();
  }, 30_000);
});
