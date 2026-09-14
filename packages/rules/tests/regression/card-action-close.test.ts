import { describe, expect, it } from 'vitest';

import { createMatchSession } from '../../src/match-session';
import { isCloseSourceCardOnPlayedTrigger, processAbilityEvent } from '../../src/ability/interpreter';
import type { AuthoringAbility } from '../../src/ability/types';

function prepareCurse() {
  const session = createMatchSession({ seed: 20260907, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
  const curse = session.state.cards.find((candidate) => candidate.definitionId === 'servant.artoria-alt.skill.sc-artoria-alt-2')!;
  expect(curse).toBeTruthy();
  const player = session.state.players.find((candidate) => candidate.id === curse.controllerPlayerId)!;
  session.state.round.activePhase = 'action';
  session.state.round.prioritySeat = player.seat;
  player.mana = 0;
  player.locationId = 'miyama_town';
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;
  expect(session.dispatchPlayerAction(player.id, { type: 'play_card', cardInstanceId: curse.instanceId }).ok).toBe(true);
  return { session, playerId: player.id, curseId: curse.instanceId };
}

function nobleCard(session: ReturnType<typeof createMatchSession>, playerId: string) {
  return session.state.cards.find((candidate) =>
    candidate.controllerPlayerId === playerId &&
    candidate.definitionId === 'servant.artoria-alt.skill.sc-artoria-alt-1')!;
}

describe('CARD_ACTION_SEMANTICS_MINIMAL_CLOSE recovery', () => {
  it('closes active Artoria Alter source through typed data-flow after a real noble-phantasm play', () => {
    const { session, playerId, curseId } = prepareCurse();
    const noble = nobleCard(session, playerId);
    session.state.players.find((candidate) => candidate.id === playerId)!.mana = 12;

    const result = session.dispatchPlayerAction(playerId, { type: 'play_card', cardInstanceId: noble.instanceId });

    expect(result.ok).toBe(true);
    expect(session.state.cards.find((candidate) => candidate.instanceId === curseId)).toMatchObject({
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: playerId },
    });
    expect(session.state.abilityRuntime!.cardState[curseId]).toMatchObject({ active: false, faceDown: false });
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'source_card_closed',
      playerId,
      sourceCardId: curseId,
      abilityId: 'sc-artoria-alt-2.angra-mainyu-embrace',
    }));
    expect(session.state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'effect_resolved',
      playerId,
      sourceCardId: curseId,
      abilityId: 'sc-artoria-alt-2.angra-mainyu-embrace',
      resultId: expect.any(String),
    }));
  });

  it('does not close the source for a visible controller-owned non-noble play event', () => {
    const { session, playerId, curseId } = prepareCurse();
    const nonNoble = session.state.cards.find((candidate) => {
      if (candidate.controllerPlayerId !== playerId || candidate.instanceId === curseId) return false;
      const definition = session.state.abilityRuntime!.pack.cards[candidate.definitionId];
      return !!definition && !(definition.cardFace.attributes ?? []).includes('宝具');
    })!;
    expect(nonNoble).toBeTruthy();
    const definition = session.state.abilityRuntime!.pack.cards[nonNoble.definitionId]!;
    const eventCount = session.state.abilityRuntime!.events.length;

    processAbilityEvent(session.state, {
      id: 'fixture-non-noble-play',
      type: 'on_card_played',
      playerId,
      sourceCardId: nonNoble.instanceId,
      playedCards: [{
        instanceId: nonNoble.instanceId,
        controllerId: playerId,
        cardType: definition.cardType,
        faceDown: false,
      }],
    });

    expect(session.state.cards.find((candidate) => candidate.instanceId === curseId)?.zone).toBe('attack_area');
    expect(session.state.abilityRuntime!.events.slice(eventCount)).not.toContainEqual(expect.objectContaining({ type: 'source_card_closed' }));
  });

  it.each([
    ['inactive', (runtime: ReturnType<typeof createMatchSession>['state']['abilityRuntime'], curseId: string) => { runtime!.cardState[curseId]!.active = false; }],
    ['face-down', (runtime: ReturnType<typeof createMatchSession>['state']['abilityRuntime'], curseId: string) => { runtime!.cardState[curseId]!.faceDown = true; }],
  ] as const)('does not mutate an invalid %s source when the noble play event arrives', (_label, corrupt) => {
    const { session, playerId, curseId } = prepareCurse();
    const noble = nobleCard(session, playerId);
    corrupt(session.state.abilityRuntime, curseId);
    const definition = session.state.abilityRuntime!.pack.cards[noble.definitionId]!;
    const eventCount = session.state.abilityRuntime!.events.length;

    processAbilityEvent(session.state, {
      id: `fixture-invalid-close-${_label}`,
      type: 'on_card_played',
      playerId,
      sourceCardId: noble.instanceId,
      playedCards: [{ instanceId: noble.instanceId, controllerId: playerId, cardType: definition.cardType, faceDown: false }],
    });

    expect(session.state.cards.find((candidate) => candidate.instanceId === curseId)?.zone).toBe('attack_area');
    expect(session.state.abilityRuntime!.events.slice(eventCount)).not.toContainEqual(expect.objectContaining({ type: 'source_card_closed' }));
  });

  it('classifies the exact CLOSE semantic form without card or ability ids', () => {
    const close: AuthoringAbility = {
      id: 'renamed-close-source',
      kind: 'residual',
      printedClause: '',
      activation: { trigger: 'on_card_played', opens: 'immediate' },
      conditions: [
        { type: 'source_card_in_zone', zone: 'field' },
        { type: 'event_played_card_has_attribute', attribute: '宝具' },
      ],
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
    };
    const wrongTrigger = structuredClone(close);
    wrongTrigger.activation.trigger = 'round_end';
    const wrongAttribute = structuredClone(close);
    wrongAttribute.conditions[1]!.attribute = '特殊';
    const withTarget = structuredClone(close);
    withTarget.targets = [{ id: 'target', type: 'player' }];
    const extraEffect = structuredClone(close);
    extraEffect.effects.push({ type: 'noop', reason: 'extra' });

    expect(isCloseSourceCardOnPlayedTrigger(close)).toBe(true);
    expect(isCloseSourceCardOnPlayedTrigger(wrongTrigger)).toBe(false);
    expect(isCloseSourceCardOnPlayedTrigger(wrongAttribute)).toBe(false);
    expect(isCloseSourceCardOnPlayedTrigger(withTarget)).toBe(false);
    expect(isCloseSourceCardOnPlayedTrigger(extraEffect)).toBe(false);
  });
});
