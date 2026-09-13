import { execFileSync } from 'node:child_process';
import type { MatchRoomSnapshot } from '@fd/rules';

export const lifecycleHostClientId = 'host-lifecycle';
export const lifecycleObserverClientId = 'observer-lifecycle';
export const lifecycleSourceCardId = 'p1-artoriac-star';
export const lifecyclePrivateDiscardId = 'p1-private-luck';
export const lifecycleCloseAbilityId = 'test-close-active-source';

export function buildLifecycleSourceActiveSnapshot(roomId: string): MatchRoomSnapshot {
  const script = `
    import { createMatchRoom } from '@fd/rules';
    const room = createMatchRoom({
      roomId: ${JSON.stringify(roomId)},
      hostClientId: ${JSON.stringify(lifecycleHostClientId)},
      hostName: 'Lifecycle Host',
      seed: 20260914,
    });
    room.joinRoom({ clientId: ${JSON.stringify(lifecycleObserverClientId)}, displayName: 'Lifecycle Observer', role: 'player' });
    room.selectSeat(${JSON.stringify(lifecycleHostClientId)}, 1);
    room.selectSeat(${JSON.stringify(lifecycleObserverClientId)}, 2);
    room.startMatch(${JSON.stringify(lifecycleHostClientId)});
    const session = room.session;
    const state = session.state;
    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;
    state.abilityRuntime.hostRequests = [];
    state.abilityRuntime.responseWindows = [];
    delete state.abilityRuntime.pendingDecision;
    const p1 = state.players.find((player) => player.id === 'p1');
    if (!p1) throw new Error('Lifecycle E2E requires p1');
    p1.mana = 12;
    p1.servantCardId = 'servant.artoriac';
    for (const card of state.cards) {
      if (card.ownerPlayerId !== 'p1') continue;
      if (['field', 'attack_area'].includes(card.zone)) {
        card.zone = 'skill';
        card.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
        if (state.abilityRuntime.cardState[card.instanceId]) state.abilityRuntime.cardState[card.instanceId].active = false;
      }
    }
    state.cards.push({
      instanceId: ${JSON.stringify(lifecycleSourceCardId)},
      definitionId: 'servant.artoriac.skill.sc-artoriac-3',
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    state.cards.push({
      instanceId: ${JSON.stringify(lifecyclePrivateDiscardId)},
      definitionId: 'basic.luck',
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'discard',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    const star = state.abilityRuntime.pack.cards['servant.artoriac.skill.sc-artoriac-3'];
    if (!star) throw new Error('Lifecycle E2E requires Artoria Caster SC3 definition');
    star.abilities.push({
      id: ${JSON.stringify(lifecycleCloseAbilityId)},
      kind: 'phase_action',
      printedClause: 'test-only external Card Zone close owner',
      activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
      conditions: [],
      targets: [],
      effects: [{ type: 'close_source_card' }],
      cost: [],
      ruleModifiers: [],
      creates: [],
      lifecycle: {},
      responseWindow: {},
      limit: {},
      visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    });
    process.stdout.write(JSON.stringify(room.serializeRoom()));
  `;
  return JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '--eval', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })) as MatchRoomSnapshot;
}
