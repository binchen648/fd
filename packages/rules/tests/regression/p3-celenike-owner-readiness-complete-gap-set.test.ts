import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.fixture-battle-wither';
const S1 = `${ROOT}.skill.s1`;
const S1A = `${ROOT}.skill.s1a`;
const ASC = `${ROOT}.skill.ascension`;
const S1B = `${ROOT}.skill.s1b`;
const ASCB = `${ROOT}.skill.ascension-b`;
const STATUS = 'fixture.wither';
const STATUS_B = 'fixture.wither-b';

function base(id: string, kind = 'forced_trigger'): AuthoringAbility {
  return {
    id, kind, printedClause: id, activation: {}, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [],
    lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}
function forced(id: string, trigger: string, effect: any): AuthoringAbility {
  const ability = base(id); ability.activation = { trigger }; ability.effects = [effect]; return ability;
}
function action(id: string, effect: any): AuthoringAbility {
  const ability = base(id, 'phase_action'); ability.activation = { phase: 'action', opens: 'controller_action_window' }; ability.effects = [effect]; return ability;
}
function card(id: string, abilities: AuthoringAbility[]) {
  return {
    id, name: id, cardType: 'master_skill', owner: { type: 'master', id: ROOT },
    cardFace: { typeLabel: '被动', attributes: [], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities,
    verification: { implementationStatus: 'complete' },
  };
}
function archive() {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: ROOT,
    cards: [
      card(S1, [
        forced('fixture.wither.apply', 'after_controller_loses_battle', {
          type: 'battle_wither_apply_to_winners', statusKey: STATUS, clearRoundVpGainThreshold: 4,
        }),
        forced('fixture.wither.steal', 'after_controller_wins_battle', {
          type: 'battle_wither_steal_from_participants', statusKey: STATUS, amount: 2,
        }),
      ]),
      card(S1A, [forced('fixture.wither.indulgence', 'after_battle_ended', {
        type: 'location_battle_end_resource_adjustment', locationId: 'magic_workshop', manaGain: 2, vpLoss: 1,
      })]),
      card(ASC, [action('fixture.wither.pain', {
        type: 'wither_pain_stake_action', statusKey: STATUS, manaCost: 2, discardPolicy: 'all_hand',
      })]),
      card(S1B, [
        forced('fixture.wither-b.apply', 'after_controller_loses_battle', {
          type: 'battle_wither_apply_to_winners', statusKey: STATUS_B, clearRoundVpGainThreshold: 4,
        }),
        forced('fixture.wither-b.steal', 'after_controller_wins_battle', {
          type: 'battle_wither_steal_from_participants', statusKey: STATUS_B, amount: 2,
        }),
      ]),
      card(ASCB, [action('fixture.wither-b.pain', {
        type: 'wither_pain_stake_action', statusKey: STATUS_B, manaCost: 2, discardPolicy: 'all_hand',
      })]),
    ],
  } as any;
}
function add(state: GameState, definitionId: string, owner = 'p1', zone = 'skill') {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: zone === 'skill' || zone === 'hand' ? { scope: 'owner_only', ownerPlayerId: owner } : { scope: 'public' } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] }); state.cards = [];
  rules.initializeAbilityRuntime(state, pack, { seed: 20261006 });
  const [p1, p2, p3] = state.players;
  p1!.masterCardId = ROOT; p1!.mana = 8; p1!.vp = 0; p1!.locationId = 'magic_workshop';
  p2!.mana = 8; p2!.vp = 5; p2!.locationId = 'magic_workshop';
  p3!.mana = 8; p3!.vp = 1; p3!.locationId = 'miyama_town';
  state.round.roundNumber = 3; state.round.activePhase = 'action'; state.round.prioritySeat = p1!.seat;
  const s1 = add(state, S1); const s1a = add(state, S1A); const asc = add(state, ASC);
  return { state, s1, s1a, asc };
}
function battleResult(state: GameState, winners: string[], loserIds: string[], battlefieldId = 'battlefield_a') {
  const resultId = `result-${state.abilityRuntime!.revision}-${battlefieldId}`;
  rules.processAbilityEvent(state, {
    id: resultId, type: 'after_battle_result_determined', battlePhaseResolutionId: `battle-phase:${state.round.roundNumber}`,
    battleId: `battle-${state.abilityRuntime!.revision}`, resultId, battlefieldId,
    battleResult: { winners, loserIds }, battleParticipantIds: [...new Set([...winners, ...loserIds])],
  });
}
function loss(state: GameState, winners = ['p2', 'p3']) { battleResult(state, winners, ['p1']); }

describe('P3 Celenike owner-readiness complete identity-free gap set', () => {
  it('accepts only the exact privileged whole-ability shapes and rejects widening', () => {
    expect(rules.loadAuthoringJson(archive()).report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const bad = archive();
    bad.cards[0].abilities[0].effects[0].clearRoundVpGainThreshold = 5;
    const loaded = rules.loadAuthoringJson(bad);
    expect(loaded.cards[S1]!.abilities.find((ability) => ability.id === 'fixture.wither.apply')!.execution.mode).toBe('unsupported');
    expect(loaded.report.some((entry) => entry.reason.includes('Battle-wither'))).toBe(true);
  });

  it('marks every winner on loss and steals the actual up-to-two VP from withered battle participants on a later win', () => {
    const { state } = setup();
    loss(state);
    expect(rules.isPlayerBattleWithered(state, 'p2', STATUS)).toBe(true);
    expect(rules.isPlayerBattleWithered(state, 'p3', STATUS)).toBe(true);
    battleResult(state, ['p1'], ['p2', 'p3']);
    expect(state.players.slice(0, 3).map((player) => player.vp)).toEqual([3, 3, 0]);
    expect(state.abilityRuntime!.events.filter((event) => event.type === 'victory_points_adjusted')).toHaveLength(4);
  });

  it('clears only this source controller wither after four gross VP gained in one round and resets the threshold next round', () => {
    const { state } = setup();
    loss(state, ['p2']);
    const otherS1 = add(state, S1, 'p3');
    battleResult(state, ['p2'], ['p3'], 'battlefield_b');
    expect(rules.isPlayerBattleWithered(state, 'p2', STATUS)).toBe(true);
    state.players[0]!.vp += 3; rules.processAbilityEvent(state, { id: 'vp-check-3', type: 'phase_changed' });
    expect(rules.isPlayerBattleWithered(state, 'p2', STATUS)).toBe(true);
    state.players[0]!.vp += 1; rules.processAbilityEvent(state, { id: 'vp-check-4', type: 'phase_changed' });
    expect(rules.isPlayerBattleWithered(state, 'p2', STATUS)).toBe(true); // p3's independent source remains
    const p2Flags = state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p2!;
    expect(Object.keys(p2Flags).some((key) => key.endsWith(':from:p1'))).toBe(false);
    expect(Object.keys(p2Flags).some((key) => key.endsWith(':from:p3'))).toBe(true);
    state.round.roundNumber++;
    state.players[0]!.vp += 3; rules.processAbilityEvent(state, { id: 'next-round-3', type: 'phase_changed' });
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p2![`__fd_battle_wither:${STATUS}:from:p3`]).toBe(true);
    expect(otherS1).toBeTruthy();
  });

  it('isolates distinct statusKey families while preserving multiple sources of the same family', () => {
    const { state, asc } = setup();
    const bSource = add(state, S1B, 'p3');

    // p3's B-family source loses to p2, so p2 carries only STATUS_B.
    battleResult(state, ['p2'], ['p3'], 'battlefield_b');
    expect(rules.isPlayerBattleWithered(state, 'p2', STATUS_B)).toBe(true);
    expect(rules.isPlayerBattleWithered(state, 'p2', STATUS)).toBe(false);

    // A-family VP steal must not consume B-family Wither.
    const before = state.players[1]!.vp;
    battleResult(state, ['p1'], ['p2'], 'battlefield_c');
    expect(state.players[1]!.vp).toBe(before);

    // A-family Pain Stake must not target a player carrying only B-family Wither.
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'activate_ability', cardInstanceId: asc, abilityId: 'fixture.wither.pain',
    }).ok).toBe(false);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();

    // Two independent A-family sources remain compatible and are both preserved.
    loss(state, ['p2']);
    const aSource2 = add(state, S1, 'p3');
    battleResult(state, ['p2'], ['p3'], 'battlefield_d');
    expect(rules.isPlayerBattleWithered(state, 'p2', STATUS)).toBe(true);
    const flags = state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p2!;
    expect(flags[`__fd_battle_wither:${STATUS}:from:p1`]).toBe(true);
    expect(flags[`__fd_battle_wither:${STATUS}:from:p3`]).toBe(true);
    expect(flags[`__fd_battle_wither:${STATUS_B}:from:p3`]).toBe(true);
    expect(bSource).toBeTruthy();
    expect(aSource2).toBeTruthy();
  });

  it('serializes pain-stake choices to each withered player: pay two mana or discard the entire hand', () => {
    const { state, asc } = setup();
    loss(state);
    state.players[1]!.mana = 5; state.players[2]!.mana = 1;
    const h1 = add(state, 'fixture.hand-a', 'p3', 'hand'); const h2 = add(state, 'fixture.hand-b', 'p3', 'hand');
    state.abilityRuntime!.pack.cards['fixture.hand-a'] = card('fixture.hand-a', []) as any;
    state.abilityRuntime!.pack.cards['fixture.hand-b'] = card('fixture.hand-b', []) as any;
    const activated = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: asc, abilityId: 'fixture.wither.pain' });
    expect(activated.ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p1').pendingDecision).toBeUndefined();
    const p2Decision = rules.projectAbilityState(state, 'p2').pendingDecision!;
    expect(p2Decision.candidates).toEqual(['pay_mana', 'discard_all']);
    expect(rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: p2Decision.id, selectedIds: ['pay_mana'] }).ok).toBe(true);
    expect(state.players[1]!.mana).toBe(3);
    const p3Decision = rules.projectAbilityState(state, 'p3').pendingDecision!;
    expect(p3Decision.candidates).toEqual(['discard_all']);
    expect(rules.dispatchAbilityCommand(state, 'p3', { type: 'choose_target', decisionId: p3Decision.id, selectedIds: ['discard_all'] }).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.cards.find((entry) => entry.instanceId === h1)!.zone).toBe('discard');
    expect(state.cards.find((entry) => entry.instanceId === h2)!.zone).toBe('discard');
    expect(state.cards.find((entry) => entry.instanceId === h1)!.visibility).toEqual({ scope: 'owner_only', ownerPlayerId: 'p3' });
  });

  it('settles battle-end workshop +2 mana and -1 VP with the canonical mana cap and VP floor', () => {
    const { state } = setup();
    state.players[0]!.mana = 11; state.players[0]!.vp = 1;
    rules.processAbilityEvent(state, { id: 'battle-phase:3:after_battle_ended', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:3' });
    expect([state.players[0]!.mana, state.players[0]!.vp]).toEqual([12, 0]);
    const elsewhere = setup(); elsewhere.state.players[0]!.locationId = 'miyama_town'; elsewhere.state.players[0]!.mana = 5; elsewhere.state.players[0]!.vp = 3;
    rules.processAbilityEvent(elsewhere.state, { id: 'battle-phase:3:after_battle_ended', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:3' });
    expect([elsewhere.state.players[0]!.mana, elsewhere.state.players[0]!.vp]).toEqual([5, 3]);
  });

  it('fails closed on forged wither provenance and forged serialized pain interaction state', () => {
    const { state, asc } = setup(); loss(state);
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    const forged = structuredClone(state);
    forged.abilityRuntime!.structuredPlayerFlagsByPlayer!.p2![`__fd_battle_wither:${STATUS}:from:missing`] = true;
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(forged)).toBe(false);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: asc, abilityId: 'fixture.wither.pain' }).ok).toBe(true);
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    const corrupt = structuredClone(state);
    (corrupt.abilityRuntime!.pendingDecision!.interaction as any).statusKey = 'forged.status';
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(corrupt)).toBe(false);
  });

  it('keeps the readiness runtime identity/text-free and leaves canonical authoring untouched', () => {
    for (const file of ['packages/rules/src/ability/battle-wither-capability.ts', 'packages/rules/src/ability/interpreter.ts']) {
      const source = readFileSync(file, 'utf8');
      for (const forbidden of ['master.celenike', '塞蕾妮凯', '宵泣之铁桩', '诅咒师', '纵欲', 'core.celenike-']) expect(source).not.toContain(forbidden);
    }
  });
});
