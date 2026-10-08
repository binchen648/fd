import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.synthetic-linked-suite';
const PROVIDER = ROOT + '.skill.provider';
const ASC = ROOT + '.skill.ascension';
const STATE_KEY = 'synthetic.linked-suite';
const MEMBERS = [
  'fixture.linked.baal',
  'fixture.linked.phenex',
  'fixture.linked.forneus',
  'fixture.linked.flauros',
  'fixture.linked.zepar',
  'fixture.linked.raum',
  'fixture.linked.barbatos',
] as const;

function ability(
  id: string,
  kind: string,
  activation: Record<string, unknown>,
  effect: Record<string, unknown>,
  responseWindow: Record<string, unknown> = {},
) {
  return {
    id,
    kind,
    printedClause: id,
    activation,
    conditions: [],
    targets: [],
    effects: [effect],
    cost: [],
    ruleModifiers: [],
    creates: [],
    lifecycle: {},
    responseWindow,
    limit: {},
    visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function card(id: string, abilities: any[], cardType = 'basic_attack', power = 0) {
  return {
    id,
    name: id,
    cardType,
    owner: { type: 'master', id: ROOT },
    cardFace: { typeLabel: '', attributes: [], cost: 0, basePower: power },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [],
    abilities,
    verification: { implementationStatus: 'complete' },
  };
}

const setup = ability('suite.setup', 'forced_trigger', { trigger: 'game_start' }, {
  type: 'linked_auxiliary_suite',
  op: 'setup',
  stateKey: STATE_KEY,
  definitionIds: [...MEMBERS],
  destination: 'attack_area',
  zeroCommandSeals: true,
});
const markWin = ability('suite.mark-win', 'forced_trigger', { trigger: 'after_controller_wins_battle' }, {
  type: 'linked_auxiliary_suite', op: 'mark_win', stateKey: STATE_KEY,
});
const upkeep = ability('suite.upkeep', 'forced_trigger', { trigger: 'round_end' }, {
  type: 'linked_auxiliary_suite', op: 'round_end_upkeep', stateKey: STATE_KEY,
});
const append = ability('baal.append', 'passive', { trigger: 'while_active' }, {
  type: 'linked_auxiliary_suite', op: 'append_cost_rule', stateKey: STATE_KEY,
});
const immutable = ability('baal.immutable', 'passive', { trigger: 'while_active' }, {
  type: 'linked_auxiliary_suite', op: 'power_immutable', stateKey: STATE_KEY,
});
const phenex = ability('phenex.remove', 'phase_action', { phase: 'action', opens: 'controller_action_window' }, {
  type: 'linked_auxiliary_suite', op: 'remove_other_for_mana', stateKey: STATE_KEY, manaGain: 6,
}, { order: 'turn_order', passBehavior: 'decline_this_window' });
const forneus = ability('forneus.play', 'phase_action', { phase: 'combat', opens: 'controller_combat_action_window' }, {
  type: 'linked_auxiliary_suite', op: 'shuffle_close_play', stateKey: STATE_KEY,
}, { order: 'turn_order', passBehavior: 'decline_this_window' });
const flauros = ability('flauros.power', 'phase_action', { phase: 'preparation', opens: 'controller_action_window' }, {
  type: 'linked_auxiliary_suite', op: 'shuffle_round_power', stateKey: STATE_KEY, amount: 5,
}, { order: 'turn_order', passBehavior: 'decline_this_window' });
const zepar = ability('zepar.loss', 'response', { trigger: 'after_controller_loses_battle' }, {
  type: 'linked_auxiliary_suite', op: 'loss_reward', stateKey: STATE_KEY, vpGain: 2,
}, { opens: 'after_controller_loses_battle', order: 'turn_order', passBehavior: 'decline_this_window' });
const raumReturn = ability('raum.return', 'response', { trigger: 'after_battle_ended' }, {
  type: 'linked_auxiliary_suite', op: 'battle_end_return', stateKey: STATE_KEY, requiredLocationId: 'recon',
}, { opens: 'after_battle_ended', order: 'turn_order', passBehavior: 'decline_this_window' });
const raumMove = ability('raum.move', 'phase_action', { phase: 'action', opens: 'controller_action_window' }, {
  type: 'linked_auxiliary_suite', op: 'discard_move', stateKey: STATE_KEY,
}, { order: 'turn_order', passBehavior: 'decline_this_window' });
const seal = ability('barbatos.seal', 'passive', { trigger: 'while_active' }, {
  type: 'linked_auxiliary_suite', op: 'seal_mana_substitution', stateKey: STATE_KEY, manaPerSeal: 4,
});
const exception = ability('barbatos.exception', 'phase_action', { phase: 'action', opens: 'controller_action_window' }, {
  type: 'linked_auxiliary_suite', op: 'round_play_exceptions', stateKey: STATE_KEY,
  waiveRequirementType: 'skill_zone_mana_at_least',
  ignoreNoblePhantasmSituationForbid: true,
}, { order: 'turn_order', passBehavior: 'decline_this_window' });
const ascActivate = ability('temple.activate', 'forced_trigger', { trigger: 'after_master_ascension_unlocked' }, {
  type: 'linked_auxiliary_suite', op: 'ascension_activate', stateKey: STATE_KEY,
});
const ascPower = ability('temple.power', 'passive', { trigger: 'while_active' }, {
  type: 'linked_auxiliary_suite', op: 'ascension_play_power', stateKey: STATE_KEY, amount: 4,
});
const ascRedraw = ability('temple.redraw', 'phase_action', { phase: 'preparation', opens: 'controller_action_window' }, {
  type: 'linked_auxiliary_suite', op: 'ascension_redraw', stateKey: STATE_KEY, manaCost: 1, drawCount: 3,
}, { order: 'turn_order', passBehavior: 'decline_this_window' });

const archive = {
  schemaVersion: 'fd-card-authoring-v1',
  archiveType: 'master_skill_card_archive',
  id: ROOT,
  name: ROOT,
  class: 'Master',
  publicInformation: { type: 'master_package', initialMana: 4 },
  cards: [
    card(PROVIDER, [setup, markWin, upkeep], 'master_skill'),
    card(MEMBERS[0], [append, immutable], 'basic_attack', 1),
    card(MEMBERS[1], [immutable, phenex], 'basic_attack', 1),
    card(MEMBERS[2], [forneus]),
    card(MEMBERS[3], [flauros]),
    card(MEMBERS[4], [zepar]),
    card(MEMBERS[5], [raumReturn, raumMove]),
    card(MEMBERS[6], [seal, exception]),
    card(ASC, [ascActivate, ascPower, ascRedraw], 'master_skill'),
  ],
  sources: [],
};

const loaded = rules.loadAuthoringJson(archive as any);
const get = (id: string, abilityId: string) => loaded.cards[id]!.abilities.find((entry) => entry.id === abilityId)!;

function add(state: GameState, definitionId: string, zone = 'skill', active = false) {
  const instanceId = 'linked-suite:' + definitionId.split('.').at(-1) + ':' + state.cards.length;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone,
    visibility: zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

function state() {
  expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const value = createSeededGameState({ activeSeats: [1, 2, 3] });
  value.cards = [];
  value.players[0]!.masterCardId = ROOT;
  value.players[0]!.mana = 10;
  value.players[0]!.vp = 0;
  value.players[0]!.locationId = 'recon';
  (value.players[0] as any).commandSpells = 3;
  rules.initializeAbilityRuntime(value, loaded, { seed: 20261008 });
  return value;
}

function testOps(s: GameState): rules.LinkedAuxiliarySuiteOps {
  return {
    moveCard(instanceId, zone) {
      const c = s.cards.find((entry) => entry.instanceId === instanceId)!;
      c.zone = zone as any;
      c.visibility = zone === 'attack_area' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: c.ownerPlayerId };
      const cs = s.abilityRuntime!.cardState[instanceId]!;
      cs.active = zone === 'attack_area';
    },
    shuffleDeck() {},
    grantMana(playerId, amount) { s.players.find((p) => p.id === playerId)!.mana += amount; },
    spendMana(playerId, amount) {
      const p = s.players.find((entry) => entry.id === playerId)!;
      if (p.mana < amount) return false;
      p.mana -= amount;
      return true;
    },
    closeControlledActiveCard() { return true; },
    closableControlledCardIds() { return []; },
    playableHandCardIds() { return []; },
    playHandCardDuringCombat() { return false; },
    movePlayer(playerId, locationId) {
      s.players.find((entry) => entry.id === playerId)!.locationId = locationId;
      return true;
    },
    drawCards() { return true; },
  };
}

describe('P3 Goetia owner readiness linked-auxiliary suite capability', () => {
  it('accepts the exact Goetia-shaped generic op matrix and keeps phase/response boundaries exact', () => {
    for (const def of Object.values(loaded.cards)) {
      for (const candidate of def.abilities) {
        expect(rules.isAcceptedLinkedAuxiliarySuiteAbility(candidate), candidate.id).toBe(true);
      }
    }

    const wrongBarbatos = structuredClone(get(MEMBERS[6], 'barbatos.exception'));
    (wrongBarbatos.activation as any).phase = 'preparation';
    expect(rules.isAcceptedLinkedAuxiliarySuiteAbility(wrongBarbatos)).toBe(false);

    const wrongFlauros = structuredClone(get(MEMBERS[3], 'flauros.power'));
    (wrongFlauros.activation as any).phase = 'action';
    expect(rules.isAcceptedLinkedAuxiliarySuiteAbility(wrongFlauros)).toBe(false);

    const wrongResponse = structuredClone(get(MEMBERS[4], 'zepar.loss'));
    (wrongResponse.responseWindow as any).opens = 'after_battle_ended';
    expect(rules.isAcceptedLinkedAuxiliarySuiteAbility(wrongResponse)).toBe(false);
  });

  it('initializes seven physical auxiliaries, zeroes seals, exposes Baal/Barbatos authority, and rejects forged restore state', () => {
    const s = state();
    const provider = add(s, PROVIDER);
    const asc = add(s, ASC);
    const ctx = { controllerId: 'p1', sourceCardId: provider, abilityId: 'suite.setup', variables: {}, selections: {} } as any;
    expect(rules.resolveLinkedAuxiliarySuiteEffect(s, ctx, get(PROVIDER, 'suite.setup'), testOps(s))).toBe(true);

    const suite = rules.linkedAuxiliarySuiteState(s, 'p1', STATE_KEY)!;
    expect(suite.cardInstanceIds).toHaveLength(7);
    expect(new Set(suite.definitionIds)).toEqual(new Set(MEMBERS));
    expect((s.players[0] as any).commandSpells).toBe(0);

    const baal = s.cards.find((entry) => entry.definitionId === MEMBERS[0])!;
    expect(rules.linkedAuxiliaryRequiresAdditionalPlay(s, baal.instanceId)).toBe(true);
    expect(rules.linkedAuxiliaryPowerImmutable(s, baal.instanceId)).toBe(true);
    expect(rules.linkedAuxiliarySealManaSubstitution(s, 'p1')).toBe(4);

    const ascCtx = {
      controllerId: 'p1',
      sourceCardId: asc,
      abilityId: 'temple.activate',
      variables: {},
      selections: {},
      event: { id: 'asc', type: 'after_master_ascension_unlocked', playerId: 'p1', sourceCardId: asc },
    } as any;
    expect(rules.resolveLinkedAuxiliarySuiteEffect(s, ascCtx, get(ASC, 'temple.activate'), testOps(s))).toBe(true);
    const forneusCard = s.cards.find((entry) => entry.definitionId === MEMBERS[2])!;
    expect(rules.linkedAuxiliaryOnPlayPowerBonus(s, forneusCard.instanceId)).toBe(4);

    expect(rules.isLinkedAuxiliarySuiteRuntimeProvenanceValidForRestore(structuredClone(s))).toBe(true);
    const forged = structuredClone(s);
    forged.abilityRuntime!.linkedAuxiliarySuites!['p1:' + STATE_KEY]!.cardInstanceIds.push('forged-instance');
    expect(rules.isLinkedAuxiliarySuiteRuntimeProvenanceValidForRestore(forged)).toBe(false);
  });

  it('resolves Phenex remove-for-mana and action-phase Barbatos round exceptions without broadening other windows', () => {
    const s = state();
    const provider = add(s, PROVIDER);
    expect(rules.resolveLinkedAuxiliarySuiteEffect(
      s,
      { controllerId: 'p1', sourceCardId: provider, abilityId: 'suite.setup', variables: {}, selections: {} } as any,
      get(PROVIDER, 'suite.setup'),
      testOps(s),
    )).toBe(true);

    const phenexCard = s.cards.find((entry) => entry.definitionId === MEMBERS[1])!;
    const beforeMana = s.players[0]!.mana;
    expect(rules.resolveLinkedAuxiliarySuiteEffect(
      s,
      { controllerId: 'p1', sourceCardId: phenexCard.instanceId, abilityId: 'phenex.remove', variables: {}, selections: {} } as any,
      get(MEMBERS[1], 'phenex.remove'),
      testOps(s),
    )).toBe(true);
    const pending = s.abilityRuntime!.pendingDecision!;
    expect(pending.candidates).not.toContain(phenexCard.instanceId);
    const selected = pending.candidates[0]!;
    // Direct resolver call bypasses dispatchAbilityCommand's revision commit boundary.
    pending.interaction!.createdRevision = s.abilityRuntime!.revision;
    expect(rules.resolveLinkedAuxiliarySuiteDecision(s, 'p1', pending, [selected], testOps(s))).toBe(true);
    expect(s.cards.find((entry) => entry.instanceId === selected)!.zone).toBe('removed_from_game');
    expect(s.players[0]!.mana).toBe(beforeMana + 6);

    const barbatos = s.cards.find((entry) => entry.definitionId === MEMBERS[6])!;
    s.round.activePhase = 'action';
    expect(rules.resolveLinkedAuxiliarySuiteEffect(
      s,
      { controllerId: 'p1', sourceCardId: barbatos.instanceId, abilityId: 'barbatos.exception', variables: {}, selections: {} } as any,
      get(MEMBERS[6], 'barbatos.exception'),
      testOps(s),
    )).toBe(true);
    expect(rules.linkedAuxiliaryRoundPlayExceptionsActive(s, 'p1')).toBe(true);
  });

  it('marks a battle win to skip upkeep and eliminates only when upkeep has no active auxiliaries', () => {
    const s = state();
    const provider = add(s, PROVIDER);
    const ops = testOps(s);
    expect(rules.resolveLinkedAuxiliarySuiteEffect(
      s,
      { controllerId: 'p1', sourceCardId: provider, abilityId: 'suite.setup', variables: {}, selections: {} } as any,
      get(PROVIDER, 'suite.setup'),
      ops,
    )).toBe(true);

    expect(rules.resolveLinkedAuxiliarySuiteEffect(
      s,
      {
        controllerId: 'p1', sourceCardId: provider, abilityId: 'suite.mark-win', variables: {}, selections: {},
        event: { id: 'win', type: 'after_controller_wins_battle', playerId: 'p1' },
      } as any,
      get(PROVIDER, 'suite.mark-win'),
      ops,
    )).toBe(true);

    const before = rules.linkedAuxiliarySuiteState(s, 'p1', STATE_KEY)!.cardInstanceIds
      .filter((id) => s.cards.find((entry) => entry.instanceId === id)!.zone === 'attack_area').length;
    expect(rules.resolveLinkedAuxiliarySuiteEffect(
      s,
      { controllerId: 'p1', sourceCardId: provider, abilityId: 'suite.upkeep', variables: {}, selections: {}, event: { id: 'end', type: 'round_end' } } as any,
      get(PROVIDER, 'suite.upkeep'),
      ops,
    )).toBe(true);
    const after = rules.linkedAuxiliarySuiteState(s, 'p1', STATE_KEY)!.cardInstanceIds
      .filter((id) => s.cards.find((entry) => entry.instanceId === id)!.zone === 'attack_area').length;
    expect(after).toBe(before);

    const suite = rules.linkedAuxiliarySuiteState(s, 'p1', STATE_KEY)!;
    suite.wonRound = undefined;
    for (const id of suite.cardInstanceIds) ops.moveCard(id, 'removed_from_game');
    expect(rules.resolveLinkedAuxiliarySuiteEffect(
      s,
      { controllerId: 'p1', sourceCardId: provider, abilityId: 'suite.upkeep', variables: {}, selections: {}, event: { id: 'end2', type: 'round_end' } } as any,
      get(PROVIDER, 'suite.upkeep'),
      ops,
    )).toBe(true);
    expect(s.players[0]!.status).toBe('eliminated');
  });
});
