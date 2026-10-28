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

function addCommandSpell(state: GameState): string {
  const commandSource = 'p1-master.zouken.command-spell';
  state.cards.push({
    instanceId: commandSource,
    definitionId: 'master.zouken.command-spell',
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  state.abilityRuntime!.cardState[commandSource] = { active: true, faceDown: false, playedRound: 1 };
  return commandSource;
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

  it('replaces the real generated command-spell gain-mana sequence atomically', () => {
    const state = setup();
    const commandSource = addCommandSpell(state);
    state.players[0]!.mana = 6;
    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;
    rules.executeAbility(state, {
      controllerId: 'p1', sourceCardId: commandSource, abilityId: 'command-spell.gain-mana', variables: {}, selections: {},
    });
    expect(state.players[0]!.mana).toBe(6);
    expect((state.players[0] as unknown as { commandSpells: number }).commandSpells).toBe(3);
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'zouken_s3_command_seal_replaced', delta: -4 }),
    ]));
    expect(state.abilityRuntime!.events).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'command_seals_adjusted' }),
    ]));

    for (const blockedBy of ['insufficient', 'cap', 'full-cap'] as const) {
      const blocked = setup();
      const blockedSource = addCommandSpell(blocked);
      blocked.players[0]!.mana = blockedBy === 'insufficient' ? 3 : blockedBy === 'full-cap' ? 12 : 6;
      if (blockedBy === 'cap') blocked.abilityRuntime!.manaGainBlocked.push('p1');
      const before = structuredClone(blocked);
      expect(() => rules.executeAbility(blocked, {
        controllerId: 'p1', sourceCardId: blockedSource, abilityId: 'command-spell.gain-mana', variables: {}, selections: {},
      })).toThrow();
      expect(blocked).toEqual(before);
    }
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
    const battleResult = battle.battleResults.at(-1)!;
    const canonicalReceipt = {
      battlePhaseResolutionId: 'battle-phase:1',
      battleId: 'battle-phase:1:battle:miyama_town:1',
      resultId: 'battle-phase:1:battle:miyama_town:1:result',
      battlefieldId: 'miyama_town',
      battleParticipantIds: battleResult.participantBreakdowns.map((entry) => entry.playerId),
      winnerPlayerIds: [...battleResult.winnerPlayerIds],
      loserIds: battleResult.participantBreakdowns.map((entry) => entry.playerId).filter((id) => !battleResult.winnerPlayerIds.includes(id)),
      battleOrdinal: 1,
    };
    state.abilityRuntime!.canonicalBattleScoringReceipts = { [canonicalReceipt.resultId]: canonicalReceipt };
    state.log.push({
      type: 'battle_scored_canonical',
      message: 'battle-phase:1:battle:miyama_town:1:result',
      payload: canonicalReceipt,
    });
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

  it('settles through the real MatchSession scoring barrier after battleResults are cleared', () => {
    const session = rules.createMatchSession({ seed: 20261029, humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2'] });
    const state = session.state;
    state.players.forEach((entry) => {
      entry.locationId = entry.id === 'p1' || entry.id === 'p2' ? 'miyama_town' : 'recon';
      entry.vp = 0;
      entry.militaryResult = 0;
    });
    state.players[0]!.masterCardId = 'master.zouken';
    state.players[0]!.mana = 8;
    state.cards = [{
      instanceId: SOURCE,
      definitionId: S3,
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'field',
      visibility: { scope: 'public' },
    }];
    state.abilityRuntime!.cardState[SOURCE] = { active: true, faceDown: false, playedRound: 1 };
    state.round.activePhase = 'action';
    state.round.prioritySeat = 1;
    rules.executeAbility(state, context(ACTION, { X: 1 }));
    state.round.activePhase = 'battle';
    (session as unknown as { resolveBattlePhase: () => void }).resolveBattlePhase();
    expect(state.battleResults).toEqual([]);
    expect(state.log.some((entry) => entry.type === 'battle_scored')).toBe(true);
    expect(state.log.some((entry) => entry.type === 'battle_scored_canonical')).toBe(true);
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'zouken_s3_victory_points_settled', delta: 1 }),
    ]));
    expect(state.ruleOverrides!.zoukenFounderVictorySettledBySource?.[SOURCE]).toBe(1);
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
    const isolatedVictory = setup();
    isolatedVictory.ruleOverrides = { zoukenFounderVictorySettledBySource: { [SOURCE]: 1 } };
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(isolatedVictory)).toBe(false);

    const forgedReceipt = setup();
    forgedReceipt.round.activePhase = 'action';
    forgedReceipt.round.prioritySeat = 1;
    rules.executeAbility(forgedReceipt, context(ACTION, { X: 1 }));
    const forgedReceiptPayload = {
      battlePhaseResolutionId: 'battle-phase:1', battleId: 'battle-phase:1:battle:miyama_town:1',
      resultId: 'battle-phase:1:battle:miyama_town:1:result', battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1', 'p2'], winnerPlayerIds: ['p1'], loserIds: ['p2'], battleOrdinal: 1,
    };
    forgedReceipt.log.push({ type: 'battle_scored_canonical', message: forgedReceiptPayload.resultId, payload: forgedReceiptPayload });
    expect(() => rules.processAbilityEvent(forgedReceipt, {
      id: 'forged-result', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:1',
      battleId: forgedReceiptPayload.battleId, resultId: forgedReceiptPayload.resultId, battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p1'], loserIds: ['p2'] },
    })).toThrow(/authoritative scoring receipt/);
    expect(forgedReceipt.players[0]!.vp).toBe(0);
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(forgedReceipt)).toBe(false);
  });
});
