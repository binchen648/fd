import { describe, expect, it } from 'vitest';
import { createMatchRoomHub } from '../../src/match-room-hub';
import { chooseFullMatchDecision } from '../../../../e2e/support/full-seven-player-driver';
import type { AbilityCommand } from '../../src/ability/types';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// L3 only: the original assertions and 30-second limit are unchanged.
describe('A-ACCEPT-06 complete seven-player integration baseline', () => {
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
