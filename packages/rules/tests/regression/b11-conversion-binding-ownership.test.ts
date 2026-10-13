import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '@fd/content';
import { describe, expect, it } from 'vitest';
import { compileExecutableCardPack } from '../../src/ability/executable-card-pack';
import { isCardZoneCoreDirectActionRouteCandidate, isCardZoneCoreDirectActionSemantic } from '../../src/ability/interpreter';
import type { RuleNode } from '../../src/ability/types';
import { createMatchSession } from '../../src/match-session';

const sourceId = 'master.irisviel.skill.conversion-magic';
const abilityId = 'conversion-magic.preparation';
const vectors = JSON.parse(readFileSync(resolve('docs/agents/manifests/vectors/B11_CONVERSION_BINDING_OWNERSHIP_REPAIR.json'), 'utf8'));
const corruptions: [string, (effects: RuleNode[]) => void][] = [
  ['unknown legacy binding', effects => { effects[1]!.amount = { var: 'missingBinding' }; }],
  ['unknown typed binding', effects => { effects[1]!.amount = { expr: 'binding_field', binding: 'missingBinding', field: 'movedCount', valueType: 'number' }; }],
  ['missing binding declaration', effects => { delete effects[0]!.resultVar; }],
  ['wrong result field', effects => { effects[1]!.amount = { expr: 'binding_field', binding: 'discarded_cards', field: 'unknownCount', valueType: 'number' }; }],
  ['wrong result type', effects => { effects[1]!.amount = { expr: 'binding_field', binding: 'discarded_cards', field: 'movedCount', valueType: 'card_ids' }; }],
  ['scalar instead of result binding', effects => { effects[1]!.amount = 1; }],
  ['missing binding use', effects => { delete effects[1]!.amount; }],
];

describe('B11 Conversion binding ownership fail-closed', () => {
  it('executes every declared contract vector', () => {
    expect(vectors.vectors.map((vector: { id: string }) => vector.id).sort()).toEqual(corruptions.map(([name]) => name).sort());
  });
  for (const [name, corrupt] of corruptions) {
    const vector = vectors.vectors.find((value: { id: string }) => value.id === name)!;
    it(`owns and atomically rejects ${name} in real MatchSession dispatch`, () => {
      const session = createMatchSession({ seed: 20260909, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
      const pairing = session.pairings.find(value => value.master.id === 'master.irisviel')!;
      const player = session.state.players.find(value => value.id === pairing.playerId)!;
      session.state.round.activePhase = 'advance';
      session.state.round.prioritySeat = player.seat;
      session.state.abilityRuntime!.hostRequests = [];
      session.state.abilityRuntime!.responseWindows = [];
      session.state.abilityRuntime!.pendingDecision = undefined;
      const source = session.state.cards.find(card => card.controllerPlayerId === player.id && card.definitionId === sourceId)!;
      const hand = session.state.cards.find(card => card.controllerPlayerId === player.id && card.instanceId !== source.instanceId)!;
      hand.zone = 'hand';
      hand.visibility = { scope: 'owner_only', ownerPlayerId: player.id };
      const ability = session.state.abilityRuntime!.pack.cards[sourceId]!.abilities.find(value => value.id === abilityId)!;
      corrupt(ability.effects);
      expect(isCardZoneCoreDirectActionRouteCandidate(ability)).toBe(vector.routeCandidate);
      expect(isCardZoneCoreDirectActionSemantic(ability)).toBe(vector.exactEligible);
      const before = structuredClone(session.state);
      const logs = structuredClone(session.logs);
      const result = session.dispatchPlayerAction(player.id, { type: 'activate_ability', cardInstanceId: source.instanceId, abilityId });
      expect(result).toMatchObject({ ok: false, rejection: { code: vector.rejectionCode } });
      expect(result.events).toEqual([]);
      expect(session.state).toEqual(before);
      expect(session.logs.slice(0, logs.length)).toEqual(logs);
      expect(session.logs.slice(logs.length)).toEqual([expect.objectContaining({ type: 'dispatch_rejected' })]);
    });

    it(`rejects ${name} through the production compiler`, () => {
      const loaded = loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: resolve('.') });
      const library = compileLoadedPlaytestPack(loaded).library;
      const card = library.rules.archives.find(value => value.id === 'master.irisviel')!.cards.find(value => value.id === sourceId)!;
      const ability = card.abilities!.find(value => value.id === abilityId)!;
      corrupt(ability.effects! as RuleNode[]);
      const before = structuredClone(library);
      expect(vector.compileOutcome).toBe('REJECT');
      expect(() => compileExecutableCardPack(library)).toThrow();
      expect(library).toEqual(before);
    });
  }
});
