import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { AuthoringAbility } from '../../src/ability/types';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.artoria-alt.json', 'utf8'));
const SOURCE_ID = 'b19-artoria-alt-resistance';
const BASE_ID = 'sc-artoria-alt-3.noble-bloom';
const EXTRA_ID = 'sc-artoria-alt-3.noble-bloom-extra-vp';

function synthetic(): AuthoringAbility {
  return {
    id: 'synthetic.optional-post-result-extra-vp',
    kind: 'optional_trigger',
    printedClause: 'synthetic',
    activation: { phase: 'combat', trigger: 'after_battle_result_determined' },
    conditions: [
      { type: 'controller_played_highest_cost_noble_phantasm_in_battle_this_round' },
      { type: 'highest_cost_noble_phantasm_cost_at_least', value: 4 },
    ],
    targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {},
    responseWindow: { opens: 'after_battle_result_determined' }, limit: {}, visibility: {},
    effects: [{ type: 'adjust_victory_points', player: 'controller', amount: 1 }],
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function setup(cost: number, archive = raw) {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.round.activePhase = 'battle';
  state.players[0]!.servantCardId = archive.id;
  state.players[0]!.vp = 4;
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(archive), { seed: 1919 });
  state.cards.push({
    instanceId: SOURCE_ID,
    definitionId: 'servant.artoria-alt.skill.sc-artoria-alt-3',
    ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  state.abilityRuntime!.noblePhantasmCostsThisRound.p1 = cost > 0 ? [{ cardId: 'b19-np', cost }] : [];
  return state;
}

function event(id = 'b19-result', participants = ['p1', 'p2']) {
  return {
    id,
    type: 'after_battle_result_determined' as const,
    battlePhaseResolutionId: 'battle-phase:1',
    battleId: 'battle-phase:1:battle:shinto:1',
    resultId: id,
    battleParticipantIds: participants,
    battlefieldId: 'shinto',
    battleResult: { winners: [participants[0]!], loserIds: [participants[1]!] },
  };
}

function action(state: ReturnType<typeof setup>, abilityId: string) {
  return rules.getLegalActions(state, 'p1').find((candidate) =>
    candidate.type === 'resolve_response' && candidate.abilityId === abilityId);
}

function decline(state: ReturnType<typeof setup>) {
  return rules.getLegalActions(state, 'p1').find((candidate) => candidate.type === 'decline_this_window');
}

describe('P3-B19 optional post-result extra +1 VP trigger', () => {
  it('classifies only the exact identity-free two-condition threshold semantic', () => {
    const ability = synthetic();
    expect(rules.isOptionalBattleResultExtraVpTriggerSemantic(ability)).toBe(true);
    const renamed = structuredClone(ability); renamed.id = 'renamed.extra-vp';
    expect(rules.isOptionalBattleResultExtraVpTriggerSemantic(renamed)).toBe(true);

    const threshold = structuredClone(ability); threshold.conditions[1]!.value = 3;
    expect(rules.isOptionalBattleResultExtraVpTriggerSemantic(threshold)).toBe(false);
    const amount = structuredClone(ability); amount.effects[0]!.amount = 2;
    expect(rules.isOptionalBattleResultExtraVpTriggerSemantic(amount)).toBe(false);
    const extra = structuredClone(ability); extra.conditions.push({ type: 'controller_won_battle' });
    expect(rules.isOptionalBattleResultExtraVpTriggerSemantic(extra)).toBe(false);
    const trigger = structuredClone(ability); trigger.activation.trigger = 'after_controller_wins_battle';
    expect(rules.isOptionalBattleResultExtraVpTriggerSemantic(trigger)).toBe(false);
  });

  it('keeps base and extra VP as two independent optional +1 responses for cost 4+', () => {
    const state = setup(4);
    const result = event();
    rules.processAbilityEvent(state, result);

    expect(action(state, BASE_ID)).toBeTruthy();
    expect(state.players[0]!.vp).toBe(4);
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state, BASE_ID)!).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(5);

    expect(action(state, EXTRA_ID)).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state, EXTRA_ID)!).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(6);

    const typed = state.abilityRuntime!.events.filter((entry) => entry.type === 'victory_points_adjusted');
    expect(typed).toEqual(expect.arrayContaining([
      expect.objectContaining({ abilityId: BASE_ID, playerId: 'p1', delta: 1 }),
      expect.objectContaining({ abilityId: EXTRA_ID, playerId: 'p1', delta: 1 }),
    ]));

    rules.processAbilityEvent(state, result);
    expect(action(state, BASE_ID)).toBeUndefined();
    expect(action(state, EXTRA_ID)).toBeUndefined();
    expect(state.players[0]!.vp).toBe(6);
  });

  it('allows declining the extra response without undoing the independently accepted base +1', () => {
    const state = setup(4);
    rules.processAbilityEvent(state, event('b19-decline-extra'));
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state, BASE_ID)!).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(5);
    expect(action(state, EXTRA_ID)).toBeTruthy();
    expect(decline(state)).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', decline(state)!).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(5);
    expect(state.abilityRuntime!.events.some((entry) =>
      entry.type === 'victory_points_adjusted' && entry.abilityId === EXTRA_ID)).toBe(false);
  });

  it('does not expose the extra response below threshold, without removing valid base B18 behavior', () => {
    const state = setup(3);
    rules.processAbilityEvent(state, event('b19-below-threshold'));
    expect(action(state, BASE_ID)).toBeTruthy();
    expect(action(state, EXTRA_ID)).toBeUndefined();
  });

  it('does not expose B19 for an unrelated battlefield and fails closed for malformed same-family threshold', () => {
    const unrelated = setup(4);
    rules.processAbilityEvent(unrelated, event('b19-unrelated', ['p5', 'p6']));
    expect(action(unrelated, BASE_ID)).toBeUndefined();
    expect(action(unrelated, EXTRA_ID)).toBeUndefined();

    const malformed = structuredClone(raw);
    const source = malformed.cards.find((card: { id: string }) => card.id === 'servant.artoria-alt.skill.sc-artoria-alt-3');
    const ability = source.abilities.find((candidate: { id: string }) => candidate.id === EXTRA_ID);
    ability.conditions[1].value = 5;
    const state = setup(5, malformed);
    rules.processAbilityEvent(state, event('b19-malformed'));
    expect(action(state, BASE_ID)).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', action(state, BASE_ID)!).ok).toBe(true);
    expect(action(state, EXTRA_ID)).toBeTruthy();
    rules.projectAbilityState(state, 'p1');
    const before = JSON.stringify(state);
    const result = rules.dispatchAbilityCommand(state, 'p1', action(state, EXTRA_ID)!);
    expect(result.ok).toBe(false);
    expect(result.rejection).toMatchObject({ code: 'resolution_failed', message: 'Unsupported optional battle-result VP semantic shape' });
    expect(JSON.stringify(state)).toBe(before);
    expect(state.players[0]!.vp).toBe(5);
  });
});
