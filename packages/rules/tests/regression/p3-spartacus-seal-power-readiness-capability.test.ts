import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { MatchSession, restoreMatchSession } from '../../src/match-session';
import { playerCombatTotalPowerAdjustment } from '../../src/ability/owner-self-mechanics';
import { deriveBattleParticipantsFromState } from '../../src/core/combat-resolver';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-seal-power';
const POWER = `${ROOT}.skill.power`;
const FORMULA = `${ROOT}.skill.formula`;
const RULER_USE = `${ROOT}.skill.ruler-use`;
const RULER_GRANT = `${ROOT}.skill.ruler-grant`;
const NORMAL_ID = 'fixture.normal-seal-power';
const RULER_ID = 'fixture.ruler-seal-power';
const AURA_ID = 'fixture.unused-seal-aura';
const FORMULA_ID = 'fixture.engaged-seal-user-formula';
const RULER_USE_ID = 'fixture.ruler-use';
const RULER_GRANT_ID = 'fixture.ruler-grant';
const COMMAND = 'master.fixture.command-spell';

function baseAbility(id: string, phase: 'action' | 'combat' = 'action') {
  return {
    id, kind: 'phase_action', printedClause: id,
    activation: phase === 'combat'
      ? { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' }
      : { phase: 'action', opens: 'controller_action_window' },
    conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}

function normalAbility() {
  const a = baseAbility(NORMAL_ID);
  a.effects = [{ type: 'spend_controller_normal_command_seal_for_round_power', amount: 4, duration: 'this_round' }];
  return a;
}
function rulerPowerAbility() {
  const a = baseAbility(RULER_ID);
  a.effects = [{ type: 'spend_controller_owned_ruler_seal_for_round_power', amount: 4, duration: 'this_round' }];
  return a;
}
function auraAbility() {
  const a = baseAbility(AURA_ID);
  a.effects = [{ type: 'enable_engaged_opponent_unused_owned_seal_round_power', perSeal: 1, duration: 'this_round' }];
  a.limit = { type: 'per_round', uses: 1, scope: 'this_card' };
  return a;
}
function formulaAbility() {
  const a = baseAbility(FORMULA_ID, 'combat');
  a.conditions = [{ type: 'controller_has_engaged_opponent_command_or_ruler_seal_user_this_round', includeRulerSeals: true }];
  a.effects = [{
    type: 'add_controller_round_power_from_engaged_seal_users', basePerOpponent: 6,
    ownNormalSealMultiplier: -2, includeRulerSeals: true, duration: 'this_round',
  }];
  return a;
}
function rulerUseAbility() {
  return {
    id: RULER_USE_ID, kind: 'phase_action', printedClause: RULER_USE_ID,
    activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [],
    targets: [
      { id: 'ruler_seal_option', type: 'choice', count: { min: 1, max: 1 }, options: [{ id: 'move' }, { id: 'lock_movement' }, { id: 'free_play_reward' }] },
      { id: 'bound_player', type: 'player', count: { min: 1, max: 1 }, constraints: [{ type: 'bound_by_controller_ruler_seal' }] },
    ],
    effects: [{ type: 'use_ruler_seal', target: 'bound_player', option: 'ruler_seal_option', moveDestinations: ['miyama_town', 'shinto'], rewardVp: 2 }],
    cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  } as any;
}

function rulerGrantAbility() {
  const a = baseAbility(RULER_GRANT_ID);
  a.targets = [{
    id: 'bound_players', type: 'player', count: { min: 2, max: 2 },
    constraints: [{ type: 'not_controller' }, { type: 'least_ruler_binding_count' }],
  }];
  a.effects = [
    { type: 'grant_ruler_seals', target: 'bound_players' },
    { type: 'ruler_copy_steal_guard', policy: 'forbid_source_and_effects' },
  ];
  a.limit = { type: 'per_game', uses: 3, scope: 'this_card' };
  return a;
}

function archive() {
  const card = (id: string, abilities: any[]) => ({
    id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
    cardFace: { attributes: ['特殊'], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities,
    verification: { implementationStatus: 'complete' },
  });
  return {
    schemaVersion: 'fd-card-authoring-v1', id: ROOT,
    cards: [
      card(POWER, [normalAbility(), rulerPowerAbility(), auraAbility()]),
      card(FORMULA, [formulaAbility()]),
      card(RULER_USE, [rulerUseAbility()]),
      card(RULER_GRANT, [rulerGrantAbility()]),
    ],
  } as any;
}

function commandSpellDefinition(): AuthoringCard {
  const ability = (id: string, effects: any[]) => ({
    id, kind: 'phase_action', printedClause: id, activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [], targets: [], effects, cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  });
  return {
    id: COMMAND, name: 'fixture command', cardType: 'command_spell', cardFace: { cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], mode: 'automatic',
    abilities: [ability('command-spell.gain-mana', [
      { type: 'adjust_mana', amount: 4 }, { type: 'adjust_command_seals', amount: -1, directive: 'spend_command_spell' },
    ])],
  } as any;
}

function setup() {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.cards = [];
  state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  state.players[0]!.locationId = 'shinto'; state.players[1]!.locationId = 'shinto'; state.players[2]!.locationId = 'shinto'; state.players[3]!.locationId = 'recon';
  for (const player of state.players) (player as any).commandSpells = 3;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260928 });
  state.abilityRuntime!.pack.cards[COMMAND] = commandSpellDefinition();
  return state;
}

function add(state: GameState, definitionId: string, owner = 'p1', zone = 'skill', active = false) {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function binding(state: GameState, id: string, issuer: string, bound: string, sourceCardId = 'fixture.ruler-parent', abilityId = 'fixture.ruler-bind') {
  state.abilityRuntime!.rulerSealBindings.push({
    id, issuerPlayerId: issuer, boundPlayerId: bound, sourceCardId, abilityId,
    grantedRound: state.round.roundNumber, spent: false,
  });
  const history = state.abilityRuntime!.rulerSealBindingHistory[issuer] ??= {};
  history[bound] = (history[bound] ?? 0) + 1;
}
function action(state: GameState, playerId: string, source: string, abilityId: string) {
  return rules.getLegalActions(state, playerId).find((entry) =>
    entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === abilityId);
}
function activate(state: GameState, playerId: string, source: string, abilityId: string) {
  return rules.dispatchAbilityCommand(state, playerId, { type: 'activate_ability', cardInstanceId: source, abilityId });
}

describe('P3 Spartacus seal-power readiness capability', () => {
  it('accepts the four exact privileged shells and rejects widened near matches at the loader gateway', () => {
    expect(rules.loadAuthoringJson(archive()).report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const mutations = [
      (raw: any) => { raw.cards[0].abilities[0].effects[0].amount = 5; },
      (raw: any) => { raw.cards[0].abilities[1].effects.push({ type: 'noop' }); },
      (raw: any) => { raw.cards[0].abilities[2].limit.uses = 2; },
      (raw: any) => { raw.cards[1].abilities[0].conditions[0].includeRulerSeals = false; },
      (raw: any) => { raw.cards[1].abilities[0].effects[0].ownNormalSealMultiplier = -1; },
      (raw: any) => { raw.cards[0].abilities[0].conditions.push({ type: 'can_adjust_mana' }); },
    ];
    for (const mutate of mutations) {
      const raw = archive(); mutate(raw);
      expect(rules.loadAuthoringJson(raw).report.some((entry) => entry.status === 'unsupported')).toBe(true);
    }
  });

  it('replaces ordinary Command Seal actions, spends physical seals repeatably, and expires +4 bonuses next round', () => {
    const state = setup();
    const source = add(state, POWER);
    const command = add(state, COMMAND);
    expect(action(state, 'p1', command, 'command-spell.gain-mana')).toBeFalsy();
    expect(action(state, 'p1', source, NORMAL_ID)).toBeTruthy();
    expect(activate(state, 'p1', source, NORMAL_ID).ok).toBe(true);
    expect((state.players[0] as any).commandSpells).toBe(2);
    expect(state.abilityRuntime!.normalCommandSealUseRoundByPlayer?.p1).toBe(state.round.roundNumber);
    expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(4);
    expect(activate(state, 'p1', source, NORMAL_ID).ok).toBe(true);
    expect((state.players[0] as any).commandSpells).toBe(1);
    expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(8);
    state.round.roundNumber += 1;
    expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(0);
  });

  it('preserves legacy ordinary Command Seal behavior when no replacement provider exists and records real usage', () => {
    const state = setup();
    const command = add(state, COMMAND);
    const legal = action(state, 'p1', command, 'command-spell.gain-mana');
    expect(legal).toBeTruthy();
    const before = (state.players[0] as any).commandSpells;
    expect(rules.dispatchAbilityCommand(state, 'p1', legal!).ok).toBe(true);
    expect((state.players[0] as any).commandSpells).toBe(before - 1);
    expect(state.abilityRuntime!.normalCommandSealUseRoundByPlayer?.p1).toBe(state.round.roundNumber);
  });

  it('replaces standard issuer Ruler-seal actions and selects one exact owned seal when multiple remain', () => {
    const state = setup();
    const source = add(state, POWER);
    const legacy = add(state, RULER_USE);
    binding(state, 'seal-b', 'p1', 'p3'); binding(state, 'seal-a', 'p1', 'p2');
    expect(action(state, 'p1', legacy, RULER_USE_ID)).toBeFalsy();
    expect(action(state, 'p1', source, RULER_ID)).toBeTruthy();
    expect(activate(state, 'p1', source, RULER_ID).ok).toBe(true);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toEqual(['seal-a', 'seal-b']);
    expect(decision.interaction).toMatchObject({ kind: 'owned_ruler_seal_power_v1', issuerPlayerId: 'p1', amount: 4, visibility: 'owner_only', cancelPolicy: 'forbidden' });
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['seal-b'] }).ok).toBe(true);
    expect(state.abilityRuntime!.rulerSealBindings.find((entry) => entry.id === 'seal-b')?.spent).toBe(true);
    expect(state.abilityRuntime!.rulerSealBindings.find((entry) => entry.id === 'seal-a')?.spent).toBe(false);
    expect(state.abilityRuntime!.rulerCommandSealUseRoundByPlayer?.p1).toBe(state.round.roundNumber);
    expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(4);
  });

  it('keeps standard Ruler-seal actions available without a replacement provider', () => {
    const state = setup();
    const legacy = add(state, RULER_USE);
    binding(state, 'legacy-seal', 'p1', 'p2');
    expect(action(state, 'p1', legacy, RULER_USE_ID)).toBeTruthy();
  });

  it('records standard Ruler-seal usage and spentRound so the combat formula sees non-replacement use', () => {
    const state = setup();
    const legacy = add(state, RULER_USE);
    binding(state, 'legacy-seal', 'p1', 'p2');
    expect(activate(state, 'p1', legacy, RULER_USE_ID).ok).toBe(true);
    const option = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: option.id, selectedIds: ['lock_movement'] }).ok).toBe(true);
    const bound = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: bound.id, selectedIds: ['p2'] }).ok).toBe(true);
    const seal = state.abilityRuntime!.rulerSealBindings.find((entry) => entry.id === 'legacy-seal')!;
    expect(seal.spent).toBe(true);
    expect(seal.spentRound).toBe(state.round.roundNumber);
    expect(state.abilityRuntime!.rulerCommandSealUseRoundByPlayer?.p1).toBe(state.round.roundNumber);
  });

  it('auto-spends the only owned Ruler seal for +4 without staging a choice', () => {
    const state = setup(); const source = add(state, POWER);
    binding(state, 'only-seal', 'p1', 'p2');
    expect(activate(state, 'p1', source, RULER_ID).ok).toBe(true);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    const seal = state.abilityRuntime!.rulerSealBindings.find((entry) => entry.id === 'only-seal')!;
    expect(seal.spent).toBe(true);
    expect(seal.spentRound).toBe(state.round.roundNumber);
    expect(state.abilityRuntime!.rulerCommandSealUseRoundByPlayer?.p1).toBe(state.round.roundNumber);
    expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(4);
  });

  it('fails a corrupt owned-Ruler continuation transactionally before seal spend, usage mark, or Power mutation', () => {
    const state = setup(); const source = add(state, POWER);
    binding(state, 'seal-a', 'p1', 'p2'); binding(state, 'seal-b', 'p1', 'p3');
    expect(activate(state, 'p1', source, RULER_ID).ok).toBe(true);
    const decision = state.abilityRuntime!.pendingDecision!;
    (decision.interaction as any).amount = 5;
    const before = structuredClone(state);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['seal-a'] }).ok).toBe(false);
    expect(state).toEqual(before);
  });

  it('round-trips an exact owned-Ruler choice and rejects host-signed widened restore metadata', () => {
    const state = setup(); const source = add(state, POWER); const grantSource = add(state, RULER_GRANT);
    binding(state, 'seal-a', 'p1', 'p2', grantSource, RULER_GRANT_ID); binding(state, 'seal-b', 'p1', 'p3', grantSource, RULER_GRANT_ID);
    expect(activate(state, 'p1', source, RULER_ID).ok).toBe(true);
    const session = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1'], restorePackKind: 'trusted_authoring_fixture' }, false);
    session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
    const durable = session.serializeSession();
    const restored = restoreMatchSession(durable, { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.pendingDecision).toEqual(state.abilityRuntime!.pendingDecision);

    const corrupt = structuredClone(state);
    (corrupt.abilityRuntime!.pendingDecision!.interaction as any).extra = 'forged';
    const signer = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1'], restorePackKind: 'trusted_authoring_fixture' }, false);
    signer.state = corrupt; signer.logs = []; signer.replay = []; signer.replaySnapshots = []; signer.battleHistory = [];
    expect(() => restoreMatchSession(signer.serializeSession(), { restorePackKind: 'trusted_authoring_fixture' })).toThrow(/Invalid MatchSession state container/);
  });

  it('rejects a host-signed forged Ruler binding whose named source ability is not an accepted grant semantic', () => {
    const state = setup();
    const powerSource = add(state, POWER);
    const unrelatedSource = add(state, RULER_USE);
    binding(state, 'forged-seal', 'p1', 'p2', unrelatedSource, RULER_USE_ID);
    expect(rules.unspentOwnedRulerSealBindings(state, 'p1').map((entry) => entry.id)).toEqual(['forged-seal']);
    expect(action(state, 'p1', powerSource, RULER_ID)).toBeTruthy();

    const signer = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1'], restorePackKind: 'trusted_authoring_fixture' }, false);
    signer.state = state; signer.logs = []; signer.replay = []; signer.replaySnapshots = []; signer.battleHistory = [];
    expect(() => restoreMatchSession(signer.serializeSession(), { restorePackKind: 'trusted_authoring_fixture' })).toThrow(/Invalid MatchSession state container/);
  });

  it('rejects host-signed widened Command Seal values outside the physical 0..3 integer domain', () => {
    for (const value of ['999', 999, 4, -1, 1.5]) {
      const state = setup();
      (state.players[0] as any).commandSpells = value;
      const signer = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1'], restorePackKind: 'trusted_authoring_fixture' }, false);
      signer.state = state; signer.logs = []; signer.replay = []; signer.replaySnapshots = []; signer.battleHistory = [];
      expect(() => restoreMatchSession(signer.serializeSession(), { restorePackKind: 'trusted_authoring_fixture' })).toThrow(/Invalid MatchSession state container/);
    }
    for (const value of [0, 3]) {
      const state = setup();
      (state.players[0] as any).commandSpells = value;
      const signer = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1'], restorePackKind: 'trusted_authoring_fixture' }, false);
      signer.state = state; signer.logs = []; signer.replay = []; signer.replaySnapshots = []; signer.battleHistory = [];
      expect(restoreMatchSession(signer.serializeSession(), { restorePackKind: 'trusted_authoring_fixture' }).state.players[0]).toMatchObject({ commandSpells: value });
    }
  });

  it('computes the combat formula from distinct engaged seal users only and ignores prior-round/far usage', () => {
    const state = setup();
    const source = add(state, FORMULA, 'p1', 'attack_area', true);
    (state.players[0] as any).commandSpells = 2;
    rules.markNormalCommandSealUsedThisRound(state, 'p2');
    rules.markRulerCommandSealUsedThisRound(state, 'p2');
    rules.markRulerCommandSealUsedThisRound(state, 'p3');
    rules.markNormalCommandSealUsedThisRound(state, 'p4');
    expect(rules.engagedSealUserIdsThisRound(state, 'p1')).toEqual(['p2', 'p3']);
    state.round.activePhase = 'combat';
    expect(action(state, 'p1', source, FORMULA_ID)).toBeTruthy();
    expect(activate(state, 'p1', source, FORMULA_ID).ok).toBe(true);
    expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(4);
    state.round.roundNumber += 1;
    expect(rules.engagedSealUserIdsThisRound(state, 'p1')).toEqual([]);
  });

  it('keeps the unused-seal aura live as engaged opponents spend normal or issuer-owned Ruler seals and expires next round', () => {
    const state = setup(); const source = add(state, POWER);
    (state.players[1] as any).commandSpells = 2; (state.players[2] as any).commandSpells = 1; (state.players[3] as any).commandSpells = 3;
    binding(state, 'p2-owned', 'p2', 'p1'); binding(state, 'p3-owned', 'p3', 'p1'); binding(state, 'far-owned', 'p4', 'p1');
    expect(activate(state, 'p1', source, AURA_ID).ok).toBe(true);
    expect(rules.dynamicUnusedEngagedSealPowerAdjustment(state, 'p1')).toBe(5);
    (state.players[1] as any).commandSpells = 1;
    expect(rules.dynamicUnusedEngagedSealPowerAdjustment(state, 'p1')).toBe(4);
    state.abilityRuntime!.rulerSealBindings.find((entry) => entry.id === 'p3-owned')!.spent = true;
    state.abilityRuntime!.rulerSealBindings.find((entry) => entry.id === 'p3-owned')!.spentRound = state.round.roundNumber;
    expect(rules.dynamicUnusedEngagedSealPowerAdjustment(state, 'p1')).toBe(3);
    state.round.roundNumber += 1;
    expect(rules.dynamicUnusedEngagedSealPowerAdjustment(state, 'p1')).toBe(0);
  });

  it('feeds the live unused-seal aura into the authoritative derived battle totalPower', () => {
    const state = setup(); const source = add(state, POWER);
    (state.players[1] as any).commandSpells = 3; (state.players[2] as any).commandSpells = 3;
    expect(activate(state, 'p1', source, AURA_ID).ok).toBe(true);
    const first = deriveBattleParticipantsFromState(state, 'shinto').find((entry) => entry.playerId === 'p1')!;
    expect(first.totalPower).toBe(6);
    (state.players[1] as any).commandSpells = 2;
    const second = deriveBattleParticipantsFromState(state, 'shinto').find((entry) => entry.playerId === 'p1')!;
    expect(second.totalPower).toBe(5);
  });

  it('fails compiled-pack privileged corruption before consuming seals or staging a decision', () => {
    const state = setup(); const source = add(state, POWER);
    binding(state, 'seal-a', 'p1', 'p2'); binding(state, 'seal-b', 'p1', 'p3');
    const ability = state.abilityRuntime!.pack.cards[POWER]!.abilities.find((entry) => entry.id === RULER_ID)!;
    (ability.effects[0] as any).amount = 5;
    const before = structuredClone(state);
    expect(activate(state, 'p1', source, RULER_ID).ok).toBe(false);
    expect(state).toEqual(before);
  });
});
