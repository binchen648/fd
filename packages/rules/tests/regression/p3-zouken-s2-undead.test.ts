import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import type { ExecutableCardDefinition } from '../../src/ability/types';
import { createSeededGameState } from '../../src/tools/seeded-state';
import contentLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';

const ARCHIVE = 'data/authoring/masters/master.zouken.json';
const SOURCE_ID = 'master.zouken.skill.s2';
const SOURCE_INSTANCE = 'p1-master.zouken.skill.s2';
const TARGETS = ['master.zouken.skill.s3', 'master.zouken.skill.s4'] as const;
const ABILITY_ID = 'zouken.five-hundred-year-undead';

function setup(): { state: GameState; pack: ReturnType<typeof rules.loadAuthoringJson> } {
  const pack = rules.loadAuthoringJson(JSON.parse(readFileSync(ARCHIVE, 'utf8')));
  expect(pack.report).toEqual([]);
  for (const definition of Object.values(pack.cards) as ExecutableCardDefinition[]) definition.ownerId = 'master.zouken';
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{ instanceId: SOURCE_INSTANCE, definitionId: SOURCE_ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }];
  state.players[0]!.masterCardId = 'master.zouken';
  rules.initializeAbilityRuntime(state, pack, { seed: 20261024 });
  return { state, pack };
}

function provisioned(state: GameState, definitionId: string) {
  return state.cards.filter((candidate) => candidate.definitionId === definitionId);
}

describe('P3 Zouken s2 owner-bound provisioning contract', () => {
  it('compiles s2 with canonical s3/s4 targets deferred from initial placement', () => {
    const source = contentLibrary.rules.cards[SOURCE_ID]!;
    expect(source.abilities.map((ability) => ability.id)).toEqual([ABILITY_ID]);
    expect(source.abilities[0]!.effects[0]).toEqual({ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: [...TARGETS] });
    expect(contentLibrary.rules.cards[TARGETS[0]]!.initialZone).toBeUndefined();
    expect(contentLibrary.rules.cards[TARGETS[1]]!.initialZone).toBeUndefined();
  });

  it('provisions exactly the same-owner canonical s3/s4 cards at game start, idempotently', () => {
    const { state, pack } = setup();
    expect(rules.isGameStartSkillProvisioningSemantic(pack.cards[SOURCE_ID]!.abilities[0]!)).toBe(true);
    expect(rules.isZoukenS2Semantic(pack.cards[SOURCE_ID]!.abilities[0]!)).toBe(true);
    rules.processAbilityEvent(state, { id: 's2-game-start', type: 'game_start' });
    for (const targetId of TARGETS) {
      const [created] = provisioned(state, targetId);
      expect(created).toMatchObject({ ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', generatedBy: SOURCE_INSTANCE,
        visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
      expect(state.abilityRuntime!.cardState[created!.instanceId]).toMatchObject({ active: false, faceDown: false });
    }
    const before = JSON.stringify(state.cards);
    rules.processAbilityEvent(state, { id: 's2-game-start-replay', type: 'game_start' });
    expect(JSON.stringify(state.cards)).toBe(before);
    expect(pack.cards[TARGETS[0]]!.ownerId).toBe('master.zouken');
  });

  it('fails closed for target reorder, cross-owner target, and inert target definitions', () => {
    const mutations: Array<(state: GameState) => void> = [
      (state) => { const effect = state.abilityRuntime!.pack.cards[SOURCE_ID]!.abilities[0]!.effects[0]!; (effect.targetDefinitionIds as string[]).reverse(); },
      (state) => { (state.abilityRuntime!.pack.cards[TARGETS[1]] as ExecutableCardDefinition).ownerId = 'other-owner'; },
      (state) => { (state.abilityRuntime!.pack.cards[TARGETS[0]] as ExecutableCardDefinition).mode = 'host_adjudicated'; },
    ];
    for (const mutate of mutations) {
      const { state } = setup(); mutate(state);
      expect(rules.processAbilityEvent(state, { id: `s2-invalid-${mutations.indexOf(mutate)}`, type: 'game_start' })).toBeUndefined();
      expect(provisioned(state, TARGETS[0])).toHaveLength(0);
      expect(provisioned(state, TARGETS[1])).toHaveLength(0);
    }
  });

  it('is present in a live seven-player MatchSession only through the source owner', () => {
    const session = rules.createMatchSession({ seed: 20260904, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    const pairing = session.pairings.find((entry) => entry.master.id === 'master.zouken');
    expect(pairing).toBeDefined();
    const ownerTargets = session.state.cards.filter((card) => TARGETS.includes(card.definitionId as typeof TARGETS[number]) && card.ownerPlayerId === pairing!.playerId);
    expect(ownerTargets.map((card) => card.definitionId).sort()).toEqual([...TARGETS].sort());
    expect(ownerTargets.every((card) => card.controllerPlayerId === pairing!.playerId && card.zone === 'skill')).toBe(true);
    expect(session.state.cards.filter((card) => TARGETS.includes(card.definitionId as typeof TARGETS[number]) && card.ownerPlayerId !== pairing!.playerId)).toHaveLength(0);
    const restored = rules.restoreMatchSession(session.serializeSession());
    expect(restored.state.cards.filter((card) => TARGETS.includes(card.definitionId as typeof TARGETS[number]) && card.ownerPlayerId === pairing!.playerId)).toHaveLength(2);
    const forged = session.serializeSession();
    const forgedTarget = forged.state.cards.find((card) => card.definitionId === TARGETS[0])!;
    forgedTarget.ownerPlayerId = pairing!.playerId === 'p1' ? 'p2' : 'p1';
    expect(() => rules.restoreMatchSession(forged)).toThrow();
  });
});
