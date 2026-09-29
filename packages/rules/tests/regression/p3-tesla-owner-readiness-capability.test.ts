import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { playerCombatTotalPowerAdjustment } from '../../src/ability/owner-self-mechanics';
import { playServantCardPair } from '../../src/core/card-play';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const OWNER = 'servant.fixture-resource-overflow';
const SC1 = `${OWNER}.skill.resource-engine`;
const SC2 = `${OWNER}.skill.overload-engine`;
const SC3 = `${OWNER}.skill.forced-grant`;
const BASIC = 'fixture.resource.basic';

function emptyResponse() { return {}; }
function standardResponse() { return { order: 'turn_order', passBehavior: 'decline_this_window' }; }
function automatic() { return { mode: 'automatic', allowedOperations: [] }; }
function spendRewardAbility() {
  return { id: 'resource-spend-reward', kind: 'residual', printedClause: 'fixture', activation: { trigger: 'after_player_spends_mana', requiresSourceState: 'active' },
    conditions: [], targets: [], effects: [{ type: 'same_location_other_player_mana_spend_reward', minimumSpent: 2, rewardMana: 2 }], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: emptyResponse(), limit: {}, visibility: {}, execution: automatic() } as any;
}
function selfOverflowAbility() {
  return { id: 'resource-self-overflow', kind: 'residual', printedClause: 'fixture', activation: { trigger: 'after_controller_mana_overflow', requiresSourceState: 'active' },
    conditions: [], targets: [], effects: [{ type: 'self_mana_overflow_round_power_close', powerBonus: 5, closeAfterBattle: true }], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: emptyResponse(), limit: {}, visibility: {}, execution: automatic() } as any;
}
function opponentOverflowAbility() {
  return { id: 'resource-opponent-overflow', kind: 'passive', printedClause: 'fixture', activation: { trigger: 'after_player_mana_overflow', requiresSourceState: 'active' },
    conditions: [], targets: [], effects: [{ type: 'opponent_mana_overflow_defeat', sameBattlefield: true }], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: emptyResponse(), limit: {}, visibility: {}, execution: automatic() } as any;
}
function loseAllAbility() {
  return { id: 'resource-lose-all', kind: 'forced_trigger', printedClause: 'fixture', activation: { trigger: 'on_card_played', requiresSourceState: 'active' },
    conditions: [], targets: [], effects: [{ type: 'lose_all_controller_mana_add_round_power', powerPerMana: 1, duration: 'this_round' }], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: emptyResponse(), limit: {}, visibility: {}, execution: automatic() } as any;
}
function onPlayGrantAbility() {
  return { id: 'resource-grant-on-play', kind: 'forced_trigger', printedClause: 'fixture', activation: { trigger: 'on_card_played', requiresSourceState: 'active' },
    conditions: [], targets: [], effects: [{ type: 'grant_same_location_opponents_mana', amount: 2, mandatory: true }], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: emptyResponse(), limit: {}, visibility: {}, execution: automatic() } as any;
}
function combatGrantAbility() {
  return { id: 'resource-grant-combat', kind: 'phase_action', printedClause: 'fixture', activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
    conditions: [], targets: [], effects: [{ type: 'grant_same_location_opponents_mana', amount: 2, mandatory: true }], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: standardResponse(), limit: {},
    visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' }, execution: automatic() } as any;
}
function archive(overrides?: { sc1?: any[]; sc2?: any[]; sc3?: any[] }) {
  const card = (id: string, abilities: any[], cost: number, basePower: number) => ({ id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: OWNER }, printedText: 'fixture',
    cardFace: { typeLabel: 'fixture', attributes: ['特殊'], cost, basePower }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities, verification: { implementationStatus: 'complete' } });
  return { schemaVersion: 'fd-card-authoring-v1', id: OWNER, name: 'Fixture', class: 'Archer', cards: [
    card(SC1, overrides?.sc1 ?? [spendRewardAbility(), selfOverflowAbility()], 0, 0),
    card(SC2, overrides?.sc2 ?? [opponentOverflowAbility(), loseAllAbility()], 0, 3),
    card(SC3, overrides?.sc3 ?? [onPlayGrantAbility(), combatGrantAbility()], 0, 12),
  ] } as any;
}
function basic() {
  return { id: BASIC, name: BASIC, cardType: 'basic_attack', printedText: 'fixture', cardFace: { typeLabel: '基础攻击', attributes: ['力量'], cost: 2, basePower: 2 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], verification: { implementationStatus: 'complete' } } as any;
}
function pack(raw = archive()) {
  const loaded = rules.loadAuthoringJson(raw);
  (loaded.cards as any)[BASIC] = basic();
  return loaded;
}
function add(state: GameState, definitionId: string, owner: string, instanceId: string, zone: string, active: boolean) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['attack_area', 'field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const loaded = pack(); const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = []; state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  for (const player of state.players) player.mana = 10;
  state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'shinto';
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260929 });
  return { state, loaded };
}
function activate(state: GameState, playerId: string, source: string, abilityId: string) {
  const action = rules.getLegalActions(state, playerId).find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === abilityId);
  expect(action).toBeDefined(); const out = rules.dispatchAbilityCommand(state, playerId, action!); expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function sessionFor(state: GameState) {
  const session = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2', 'p3'], restorePackKind: 'trusted_authoring_fixture' });
  session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
  return session;
}

describe('P3 Tesla owner-readiness generic mana-transaction capability', () => {
  it('accepts only the exact privileged whole-ability shapes and rejects widened near matches', () => {
    const loaded = rules.loadAuthoringJson(archive()); expect(loaded.report).toEqual([]);
    const cards = loaded.cards;
    expect(cards[SC1]!.abilities.every(rules.isAcceptedManaTransactionAbility)).toBe(true);
    expect(cards[SC2]!.abilities.every(rules.isAcceptedManaTransactionAbility)).toBe(true);
    expect(cards[SC3]!.abilities.every(rules.isAcceptedManaTransactionAbility)).toBe(true);
    const mutations = [
      () => { const a = spendRewardAbility(); a.effects[0].minimumSpent = 1; return archive({ sc1: [a, selfOverflowAbility()] }); },
      () => { const a = selfOverflowAbility(); a.effects[0].powerBonus = 6; return archive({ sc1: [spendRewardAbility(), a] }); },
      () => { const a = opponentOverflowAbility(); a.effects[0].sameBattlefield = false; return archive({ sc2: [a, loseAllAbility()] }); },
      () => { const a = loseAllAbility(); a.effects[0].duration = 'battle'; return archive({ sc2: [opponentOverflowAbility(), a] }); },
      () => { const a = combatGrantAbility(); a.effects[0].mandatory = false; return archive({ sc3: [onPlayGrantAbility(), a] }); },
    ];
    for (const mutate of mutations) expect(rules.loadAuthoringJson(mutate()).report.some((entry) => entry.status === 'unsupported')).toBe(true);
  });

  it('observes real paid card cost and rewards only another active player at the same location after spending at least 2', () => {
    const { state } = setup(); const sc1 = add(state, SC1, 'p1', 'resource-sc1', 'attack_area', true);
    add(state, BASIC, 'p2', 'p2-basic', 'hand', false); add(state, BASIC, 'p2', 'p2-basic-2', 'hand', false);
    state.players[0]!.mana = 4; state.players[1]!.mana = 10;
    rules.playAbilityCardBatch(state, 'p2', [{ cardInstanceId: 'p2-basic' }, { cardInstanceId: 'p2-basic-2' }]);
    expect(state.players[1]!.mana).toBe(6); expect(state.players[0]!.mana).toBe(6);
    expect(state.abilityRuntime!.events.some((event) => event.type === 'same_location_mana_spend_reward' && event.sourceCardId === sc1)).toBe(true);
    const before = state.players[0]!.mana; rules.spendMana(state, 'p2', 1); expect(state.players[0]!.mana).toBe(before);
    state.players[1]!.locationId = 'shinto'; rules.spendMana(state, 'p2', 2); expect(state.players[0]!.mana).toBe(before);
  });

  it('observes normal movement cost at the authoritative pre-move origin location without mutating the reducer input', () => {
    const { state } = setup(); add(state, SC1, 'p1', 'movement-sc1', 'attack_area', true);
    state.players[0]!.locationId = 'magic_workshop'; state.players[0]!.mana = 4;
    state.players[2]!.locationId = 'magic_workshop'; state.players[2]!.mana = 10;
    const originalRuntime = structuredClone(state.abilityRuntime!);
    const moved = rules.movePlayer(state, { playerId: 'p3', to: 'recon', movementKind: 'normal' });
    expect(moved).toMatchObject({ moved: true, manaSpent: 5 });
    expect(moved.nextState.players.find((player) => player.id === 'p3')).toMatchObject({ locationId: 'recon', mana: 5 });
    expect(moved.nextState.players.find((player) => player.id === 'p1')?.mana).toBe(6);
    expect(state.players[0]).toMatchObject({ locationId: 'magic_workshop', mana: 4 });
    expect(state.players[2]).toMatchObject({ locationId: 'magic_workshop', mana: 10 });
    expect(state.abilityRuntime).toEqual(originalRuntime);
    expect(moved.nextState.abilityRuntime).not.toBe(state.abilityRuntime);
    expect(moved.nextState.players.find((player) => player.id === 'p1')).not.toBe(state.players[0]);
  });

  it('keeps legacy pair-play spend observation on the returned state without mutating the reducer input', () => {
    const loaded = pack();
    const state = createSeededGameState({ activeSeats: [1, 2, 3] });
    state.round.activePhase = 'action';
    state.players[0]!.locationId = 'magic_workshop'; state.players[0]!.mana = 4;
    state.players[1]!.locationId = 'magic_workshop'; state.players[1]!.mana = 10;
    rules.initializeAbilityRuntime(state, loaded, { seed: 20260929 });
    add(state, SC1, 'p1', 'legacy-pair-sc1', 'attack_area', true);
    const originalRuntime = structuredClone(state.abilityRuntime!);
    const originalCards = structuredClone(state.cards);

    const played = playServantCardPair(state, {
      playerId: 'p2',
      cardInstanceIds: ['servant-2a-instance', 'servant-2b-instance'],
    });

    expect(played.playedCardIds).toEqual(['servant-2a-instance', 'servant-2b-instance']);
    expect(state.players[0]!.mana).toBe(4);
    expect(state.players[1]!.mana).toBe(10);
    expect(state.cards).toEqual(originalCards);
    expect(state.abilityRuntime).toEqual(originalRuntime);
    expect(played.nextState.players[0]!.mana).toBe(6);
    expect(played.nextState.players[1]!.mana).toBe(7);
    expect(played.nextState.abilityRuntime).not.toBe(state.abilityRuntime);
    expect(played.nextState.players[0]).not.toBe(state.players[0]);
    expect(played.nextState.abilityRuntime!.events.some((event) => event.type === 'same_location_mana_spend_reward' && event.sourceCardId === 'legacy-pair-sc1')).toBe(true);
  });

  it('turns only storage-cap overflow into stacking +5 round Power and closes the armed source at the canonical battle terminal', () => {
    const { state } = setup(); const sc1 = add(state, SC1, 'p1', 'overflow-sc1', 'attack_area', true);
    state.players[0]!.mana = 12;
    rules.grantMana(state, 'p1', 2, { source: 'generic' }); rules.grantMana(state, 'p1', 1, { source: 'generic' });
    expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(10);
    expect(state.abilityRuntime!.cardState[sc1]!.manaOverflowCloseAfterBattle).toMatchObject({ round: state.round.roundNumber, sourceAbilityId: 'resource-self-overflow' });
    const terminal = `battle-phase:${state.round.roundNumber}`;
    rules.processAbilityEvent(state, { id: `${terminal}:after_battle_ended`, type: 'after_battle_ended', battlePhaseResolutionId: terminal });
    expect(state.cards.find((card) => card.instanceId === sc1)).toMatchObject({ zone: 'skill', controllerPlayerId: 'p1' });
    expect(state.abilityRuntime!.cardState[sc1]).toMatchObject({ active: false, faceDown: false });
  });

  it('does not mistake round-gain-cap clipping or mana-gain suppression for storage overflow', () => {
    const { state } = setup(); add(state, SC1, 'p1', 'cap-sc1', 'attack_area', true); state.players[0]!.mana = 5;
    state.ruleOverrides = { roundTotalManaGainCapByPlayer: { p1: { regular: 0, climax: 0 } } };
    const clipped = rules.grantMana(state, 'p1', 2, { source: 'generic' });
    expect(clipped.overflowAmount).toBe(2); expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(0);
    state.ruleOverrides = undefined; state.abilityRuntime!.manaGainBlocked = ['p1'];
    const blocked = rules.grantMana(state, 'p1', 2, { source: 'generic' });
    expect(blocked.actualAmount).toBe(0); expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(0);
  });

  it('defeats only an unsuppressed opponent whose storage overflow occurs at the source controller battlefield', () => {
    const { state } = setup(); add(state, SC2, 'p1', 'overload-sc2', 'attack_area', true); state.players[1]!.mana = 12;
    rules.grantMana(state, 'p2', 2, { source: 'generic' });
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBe(state.round.roundNumber);
    delete state.abilityRuntime!.battleDefeatRoundByPlayer!.p2; state.abilityRuntime!.battleLossIgnoreRoundByPlayer = { p2: state.round.roundNumber };
    rules.grantMana(state, 'p2', 1, { source: 'generic' }); expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBeUndefined();
    state.abilityRuntime!.battleLossIgnoreRoundByPlayer = {}; state.players[1]!.locationId = 'shinto';
    rules.grantMana(state, 'p2', 1, { source: 'generic' }); expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBeUndefined();
  });

  it('loses all remaining mana on the source play, adds exactly that loss to round total Power, and does not misclassify the loss as a spend', () => {
    const { state } = setup(); add(state, SC1, 'p2', 'observer-sc1', 'attack_area', true);
    const sc2 = add(state, SC2, 'p1', 'play-sc2', 'skill', false); state.players[0]!.mana = 7; state.players[1]!.mana = 1;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: sc2 }]);
    expect(state.players[0]!.mana).toBe(0); expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(7);
    expect(state.players[1]!.mana).toBe(1);
  });

  it('grants every active same-location opponent 2 mana on play and on the mandatory combat action, allowing real overflow reactions', () => {
    const { state } = setup(); add(state, SC2, 'p1', 'active-overload', 'attack_area', true);
    const sc3 = add(state, SC3, 'p1', 'grant-sc3', 'skill', false); state.players[1]!.mana = 11; state.players[2]!.mana = 7;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: sc3 }]);
    expect(state.players[1]!.mana).toBe(12); expect(state.players[2]!.mana).toBe(7);
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBe(state.round.roundNumber);
    delete state.abilityRuntime!.battleDefeatRoundByPlayer!.p2; state.players[1]!.mana = 10;
    state.round.activePhase = 'battle'; state.round.prioritySeat = 1; activate(state, 'p1', sc3, 'resource-grant-combat');
    expect(state.players[1]!.mana).toBe(12); expect(state.abilityRuntime!.revealedServants).toContain('p1');
  });

  it('round-trips armed overflow-close provenance and rejects a forged source ability id', () => {
    const { state } = setup(); const sc1 = add(state, SC1, 'p1', 'restore-sc1', 'attack_area', true); state.players[0]!.mana = 12;
    rules.grantMana(state, 'p1', 1, { source: 'generic' });
    const restored = rules.restoreMatchSession(JSON.parse(JSON.stringify(sessionFor(state).serializeSession())), { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.cardState[sc1]!.manaOverflowCloseAfterBattle).toMatchObject({ sourceAbilityId: 'resource-self-overflow' });
    const forged = JSON.parse(JSON.stringify(sessionFor(state).serializeSession()));
    forged.state.abilityRuntime.cardState[sc1].manaOverflowCloseAfterBattle.sourceAbilityId = 'forged-overflow';
    expect(() => rules.restoreMatchSession(forged, { restorePackKind: 'trusted_authoring_fixture' })).toThrow();
    const forgedRound = JSON.parse(JSON.stringify(sessionFor(state).serializeSession()));
    forgedRound.state.abilityRuntime.cardState[sc1].manaOverflowCloseAfterBattle.round = state.round.roundNumber + 1;
    expect(() => rules.restoreMatchSession(forgedRound, { restorePackKind: 'trusted_authoring_fixture' })).toThrow();
  });

  it('keeps production mana-transaction runtime identity-free', () => {
    const production = [
      'packages/rules/src/ability/mana-transaction-capability.ts', 'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts', 'packages/rules/src/core/rule-overrides.ts', 'packages/rules/src/core/card-play.ts',
      'packages/rules/src/core/movement.ts', 'packages/rules/src/match-session.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.tesla', 'sc-tesla', '尼古拉', '雷电之手', '人类神话', 'core.tesla-', 'SkillLib']) expect(production).not.toContain(needle);
  });
});
