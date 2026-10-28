import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AbilityDefinitionPack } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const GENERATED_PATH = 'data/generated/fd-playtest-v1.content-library.json';
const S1 = 'master.zouken.skill.s1';
const S1_ABILITY = 'zouken.dead-in-great-cavern';
const SOURCE_INSTANCE = 'p1-master.zouken.skill.s1';

function generatedPack(): AbilityDefinitionPack {
  const library = JSON.parse(readFileSync(GENERATED_PATH, 'utf8')) as { rules: AbilityDefinitionPack };
  return library.rules;
}

function setup(): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{
    instanceId: SOURCE_INSTANCE,
    definitionId: S1,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  }];
  state.players[0]!.masterCardId = 'master.zouken';
  state.players[0]!.mana = 4;
  state.players[1]!.mana = 7;
  rules.initializeAbilityRuntime(state, generatedPack(), { seed: 20261029 });
  return state;
}

function start(state: GameState, eventId = 'zouken-s1-game-start'): void {
  rules.processAbilityEvent(state, { id: eventId, type: 'game_start' });
}

describe('P3 Zouken s1 game-start mana bootstrap', () => {
  it('uses the real generated pack and applies mana 10 plus cap 16 transactionally', () => {
    const state = setup();
    const ability = state.abilityRuntime!.pack.cards[S1]!.abilities[0]!;
    expect(ability.id).toBe(S1_ABILITY);
    expect(rules.isZoukenManaBootstrapSemantic(ability)).toBe(true);
    expect(rules.listResolutionPrimitiveTypes()).toContain('set_mana_cap');
    expect(rules.resultSchemas.set_mana_cap).toEqual(expect.objectContaining({
      before: 'number', after: 'number', targetCap: 'number', actualDelta: 'number', status: 'status',
    }));

    start(state);
    expect(state.players[0]!.mana).toBe(10);
    expect(state.players[1]!.mana).toBe(7);
    expect(state.abilityRuntime!.manaCaps.p1).toBe(16);
    expect(state.abilityRuntime!.manaCapProvenance?.p1).toEqual({
      sourceCardId: SOURCE_INSTANCE, sourceDefinitionId: S1, abilityId: S1_ABILITY, cap: 16,
    });
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'mana_adjusted', playerId: 'p1', before: 4, after: 10 }),
      expect.objectContaining({ type: 'mana_cap_set', playerId: 'p1', before: 12, after: 16, delta: 4 }),
    ]));
    expect(rules.grantMana(state, 'p1', 20, { source: 'generic' }).after).toBe(16);
  });

  it('is idempotent for duplicate event replay and survives session/checkpoint restore', () => {
    const state = setup();
    start(state);
    const revision = state.abilityRuntime!.revision;
    const events = structuredClone(state.abilityRuntime!.events);
    const provenance = structuredClone(state.abilityRuntime!.manaCapProvenance);
    start(state);
    expect(state.abilityRuntime!.revision).toBe(revision);
    expect(state.abilityRuntime!.events).toEqual(events);
    expect(state.abilityRuntime!.manaCapProvenance).toEqual(provenance);

    const host = rules.createMatchSession({ seed: 20261029 });
    const snapshot = host.serializeSession();
    snapshot.state = structuredClone(state);
    snapshot.replaySnapshots = [{
      checkpointId: 's1-checkpoint', state: structuredClone(state), logs: [], battleHistory: [], consumedDirectiveCount: 0,
    }];
    const restored = rules.restoreMatchSession(snapshot);
    expect(restored.getState().abilityRuntime!.manaCaps.p1).toBe(16);
    expect(restored.restoreToCheckpoint('s1-checkpoint')).toBe(true);
    expect(restored.getState().abilityRuntime!.manaCapProvenance?.p1?.sourceCardId).toBe(SOURCE_INSTANCE);
  });

  it('fails closed for malformed source shapes and forged restore cap/provenance', () => {
    const state = setup();
    const ability = state.abilityRuntime!.pack.cards[S1]!.abilities[0]!;
    ability.effects[1]!.amount = 15;
    expect(rules.isZoukenManaBootstrapSemantic(ability)).toBe(false);
    const before = structuredClone(state);
    expect(() => rules.executeAbility(state, {
      controllerId: 'p1', sourceCardId: SOURCE_INSTANCE, abilityId: S1_ABILITY, variables: {}, selections: {},
    })).toThrow(/Unsupported Zouken game-start mana bootstrap semantic shape/);
    expect(state.players[0]!.mana).toBe(before.players[0]!.mana);
    expect(state.abilityRuntime!.manaCaps).toEqual(before.abilityRuntime!.manaCaps);
    expect(state.abilityRuntime!.processedEvents).toEqual(before.abilityRuntime!.processedEvents);

    const valid = setup();
    start(valid);
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(valid)).toBe(true);
    const forgedCap = structuredClone(valid);
    forgedCap.abilityRuntime!.manaCaps.p1 = 99;
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(forgedCap)).toBe(false);
    const forgedSource = structuredClone(valid);
    forgedSource.cards[0]!.zone = 'field';
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(forgedSource)).toBe(false);
    const forgedProvenance = structuredClone(valid);
    delete forgedProvenance.abilityRuntime!.manaCapProvenance!.p1;
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(forgedProvenance)).toBe(false);
  });

  it('rolls back an earlier set-mana when the typed cap primitive fails', () => {
    const state = setup();
    expect(() => rules.executeResolution({
      state,
      controllerId: 'p1',
      sourceCardId: SOURCE_INSTANCE,
      abilityId: S1_ABILITY,
      effects: [
        { id: 'set-controller-mana', type: 'set_mana', player: 'controller', amount: 10 },
        { id: 'set-controller-mana-cap', type: 'set_mana_cap', player: 'controller', amount: 5 },
      ],
    })).toThrow(/Mana cap cannot be below/);
    expect(state.players[0]!.mana).toBe(4);
    expect(state.abilityRuntime!.manaCaps).toEqual({});
    expect(state.abilityRuntime!.events).toEqual([]);
  });
});
