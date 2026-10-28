import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AbilityDefinitionPack, EffectContext } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const S3 = 'master.zouken.skill.s3';
const PASSIVE = 'zouken.founder';
const ACTION = 'zouken.founder.power-conversion';
const WIN = 'zouken.founder.after-win';
const SOURCE = 'p1-master.zouken.skill.s3';

function generatedPack(): AbilityDefinitionPack {
  return JSON.parse(readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8')).rules;
}

function setup(): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.players[0]!.masterCardId = 'master.zouken';
  state.players[0]!.mana = 12;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  (state.players[0] as unknown as { commandSpells: number }).commandSpells = 3;
  state.cards = [{
    instanceId: SOURCE,
    definitionId: S3,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'field',
    visibility: { scope: 'public' },
  }];
  rules.initializeAbilityRuntime(state, generatedPack(), { seed: 20261029 });
  state.abilityRuntime!.cardState[SOURCE] = { active: true, faceDown: false, playedRound: 1 };
  return state;
}

function context(abilityId: string, variables: Record<string, number> = {}): EffectContext {
  return { controllerId: 'p1', sourceCardId: SOURCE, abilityId, variables, selections: {} };
}

describe('P3 Zouken s3 creator', () => {
  it('loads the exact three real-pack abilities and projects no command seals', () => {
    const state = setup();
    const abilities = state.abilityRuntime!.pack.cards[S3]!.abilities;
    expect(abilities.map((ability) => ability.id)).toEqual([PASSIVE, ACTION, WIN]);
    expect(abilities.every((ability) => rules.isZoukenS3Semantic(ability))).toBe(true);
    expect(rules.projectAbilityState(state, 'p1').players.find((player) => player.id === 'p1')!.commandSpells).toBe(0);
  });

  it('replaces controller command-seal transactions with atomic four-mana payments', () => {
    const state = setup();
    rules.resolveEffect(state, context(PASSIVE), { type: 'adjust_command_seals', player: 'controller', amount: -1 });
    expect(state.players[0]!.mana).toBe(8);
    expect((state.players[0] as unknown as { commandSpells: number }).commandSpells).toBe(3);
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'zouken_s3_command_seal_replaced', delta: -4 })]));

    state.players[0]!.mana = 4;
    rules.resolveEffect(state, context(PASSIVE), { type: 'adjust_command_seals', player: 'controller', amount: 1 });
    expect(state.players[0]!.mana).toBe(8);
    expect((state.players[0] as unknown as { commandSpells: number }).commandSpells).toBe(3);

    state.players[0]!.mana = 3;
    const before = structuredClone(state);
    expect(() => rules.resolveEffect(state, context(PASSIVE), { type: 'adjust_command_seals', player: 'controller', amount: -1 })).toThrow(/four mana/);
    expect(state.players[0]!.mana).toBe(before.players[0]!.mana);
    expect(state.abilityRuntime!.events).toHaveLength(before.abilityRuntime!.events.length);
  });

  it('pays exactly 2X, records source-bound power, and rejects duplicate or forged variables', () => {
    const state = setup();
    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;
    rules.executeAbility(state, context(ACTION, { X: 3 }));
    expect(state.players[0]!.mana).toBe(6);
    expect(state.ruleOverrides!.zoukenFounderPowerByPlayer!.p1).toEqual({ sourceCardId: SOURCE, abilityId: ACTION, round: 1, amount: 3 });
    expect(() => rules.executeAbility(state, context(ACTION, { X: 1 }))).toThrow(/already used/);

    const invalid = setup();
    invalid.round.activePhase = 'action';
    const rejected = rules.dispatchAbilityCommand(invalid, 'p1', {
      type: 'activate_ability', cardInstanceId: SOURCE, abilityId: ACTION, variables: { X: 7 },
    });
    expect(rejected.ok).toBe(false);
    expect(invalid.players[0]!.mana).toBe(12);
    expect(invalid.ruleOverrides).toBeUndefined();
  });

  it('applies X to authoritative combat power and settles one VP payout on the canonical win event', () => {
    const state = setup();
    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;
    rules.executeAbility(state, context(ACTION, { X: 2 }));
    const battle = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town' }).nextState;
    Object.assign(state, battle);
    expect(battle.battleResults.at(-1)!.winnerPlayerIds).toContain('p1');
    expect(battle.battleResults.at(-1)!.participantBreakdowns.find((entry) => entry.playerId === 'p1')!.basePower).toBe(2);
    rules.processAbilityEvent(state, {
      id: 's3-result', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:miyama_town:1', resultId: 'battle-phase:1:battle:miyama_town:1:result',
      battlefieldId: 'miyama_town', battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
    expect(state.players[0]!.vp).toBe(2);
    const events = structuredClone(state.abilityRuntime!.events);
    rules.processAbilityEvent(state, {
      id: 's3-result', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:miyama_town:1', resultId: 'battle-phase:1:battle:miyama_town:1:result',
      battlefieldId: 'miyama_town', battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
    expect(state.players[0]!.vp).toBe(2);
    expect(state.abilityRuntime!.events).toEqual(events);
  });

  it('fails closed for inactive/foreign sources and forged restore ledgers', () => {
    const state = setup();
    state.abilityRuntime!.cardState[SOURCE]!.active = false;
    expect(rules.projectAbilityState(state, 'p1').players.find((player) => player.id === 'p1')!.commandSpells).toBe(3);
    expect(() => rules.executeAbility(state, context(ACTION, { X: 1 }))).toThrow();

    const valid = setup();
    valid.round.activePhase = 'action';
    rules.executeAbility(valid, context(ACTION, { X: 1 }));
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(valid)).toBe(true);
    const forged = structuredClone(valid);
    forged.ruleOverrides!.zoukenFounderPowerByPlayer!.p1!.sourceCardId = 'foreign-source';
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(forged)).toBe(false);
    const missing = structuredClone(valid);
    delete missing.ruleOverrides!.zoukenFounderPowerByPlayer!.p1!.abilityId;
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(missing)).toBe(false);
  });
});
