import { execFileSync } from 'node:child_process';
import type { MatchRoomSnapshot } from '@fd/rules';

export type GoldenEaterSnapshotStage = 'ready' | 'second_pending_low_mana';

export function buildGoldenEaterSnapshot(roomId: string, stage: GoldenEaterSnapshotStage = 'ready'): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom } from '@fd/rules';
    const room = createMatchRoom({ roomId: ${JSON.stringify(roomId)}, hostClientId: 'host-golden-eater', hostName: '房主', seed: 20260914 });
    room.selectSeat('host-golden-eater', 4);
    room.startMatch('host-golden-eater');
    const session = room.session;
    const player = session.state.players.find((candidate) => candidate.id === 'p4');
    const eater = session.state.cards.find((card) => card.controllerPlayerId === 'p4' && card.definitionId === 'servant.kintoki.skill.sc-kintoki-3');
    const firstImpact = session.state.cards.find((card) => card.controllerPlayerId === 'p4' && card.definitionId === 'servant.kintoki.skill.sc-kintoki-1');
    const secondImpact = session.state.cards.find((card) => card.controllerPlayerId === 'p4' && card.definitionId === 'servant.kintoki.skill.sc-kintoki-2');
    if (!player || !eater || !firstImpact || !secondImpact) throw new Error('Golden Eater E2E fixture cards not found');

    player.mana = 14;
    player.locationId = 'miyama_town';
    session.state.round.activePhase = 'action';
    session.state.round.prioritySeat = player.seat;
    session.state.abilityRuntime.hostRequests = [];
    session.state.abilityRuntime.responseWindows = [];
    delete session.state.abilityRuntime.pendingDecision;

    const played = session.dispatchPlayerAction('p4', { type: 'play_card', cardInstanceId: eater.instanceId });
    if (!played.ok) throw new Error('Golden Eater fixture could not play source card');

    session.state.abilityRuntime.hostRequests = [];
    session.state.abilityRuntime.responseWindows = [];
    delete session.state.abilityRuntime.pendingDecision;
    for (const impact of [firstImpact.instanceId, secondImpact.instanceId]) {
      const card = session.state.cards.find((candidate) => candidate.instanceId === impact);
      card.zone = 'removed_from_game';
      card.visibility = { scope: 'public' };
    }
    session.state.round.activePhase = 'battle';
    session.state.round.prioritySeat = player.seat;

    if (${JSON.stringify(stage)} === 'second_pending_low_mana') {
      const activated = session.dispatchPlayerAction('p4', {
        type: 'activate_ability',
        cardInstanceId: eater.instanceId,
        abilityId: 'sc-kintoki-3.golden-eater',
      });
      if (!activated.ok) throw new Error('Golden Eater fixture could not activate');
      const firstDecision = session.getPlayerView('p4').pendingDecision;
      if (!firstDecision) throw new Error('Golden Eater fixture did not open first target');
      const selected = session.dispatchPlayerAction('p4', {
        type: 'choose_target',
        decisionId: firstDecision.id,
        selectedIds: [firstImpact.instanceId],
      });
      if (!selected.ok) throw new Error('Golden Eater fixture could not commit first target');
      session.state.players.find((candidate) => candidate.id === 'p4').mana = 6;
      // Simulate a server-side race after the optional target was already staged.
      // Keep the staged candidate available so the production dispatch reaches the
      // typed pay_mana primitive and proves second-dispatch rollback.
      session.state.abilityRuntime.pendingDecision.target.conditions = [];
    }

    process.stdout.write(JSON.stringify(room.serializeRoom()));
  `;

  return JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '--eval', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })) as MatchRoomSnapshot;
}
