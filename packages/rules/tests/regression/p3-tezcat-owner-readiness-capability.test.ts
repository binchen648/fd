import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const OWNER = 'servant.fixture-joint-battlefield';
const SC1 = `${OWNER}.skill.joint-attack`;
const SC2 = `${OWNER}.skill.battlefield-offer`;
const SC3 = `${OWNER}.skill.seal-defeat`;
const BASIC = 'fixture.joint.basic';

function automatic() { return { mode: 'automatic', allowedOperations: [] }; }
function requiredAdditionalAbility() {
  return { id: 'required-additional', kind: 'passive', printedClause: 'fixture', activation: { trigger: 'while_active' }, conditions: [], targets: [],
    effects: [{ type: 'append_only_rule' }], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: automatic() } as any;
}
function jointModifierAbility() {
  return { id: 'joint-other-modifier', kind: 'passive', printedClause: 'fixture', activation: { trigger: 'while_active' }, conditions: [], targets: [],
    effects: [{ type: 'joint_play_other_attacks_cost_power_modifier', manaCostIncrease: 2, powerBonus: 1 }], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
    responseWindow: {}, limit: {}, visibility: {}, execution: automatic() } as any;
}
function battlefieldOfferAbility() {
  return { id: 'battlefield-offer', kind: 'phase_action', printedClause: 'fixture', activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
    conditions: [], targets: [], effects: [{ type: 'same_battlefield_turn_order_optional_attack_with_loss_vp', lossVp: 2, rewardVp: 2 }], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
    responseWindow: {}, limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {}, execution: automatic() } as any;
}
function sealPlayCostAbility() {
  return { id: 'seal-play-cost', kind: 'passive', printedClause: 'fixture', activation: { trigger: 'while_active' }, conditions: [], targets: [],
    effects: [{ type: 'card_play_command_seal_cost', amount: 1 }], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {},
    limit: { type: 'per_game', uses: 1, scope: 'this_card' }, visibility: {}, execution: automatic() } as any;
}
function defeatAbility() {
  return { id: 'defeat-engaged', kind: 'phase_action', printedClause: 'fixture', activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
    conditions: [], targets: [], effects: [{ type: 'defeat_all_engaged_opponents' }], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: automatic() } as any;
}
function card(id: string, abilities: any[], cost: number, basePower: number) {
  return { id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: OWNER }, printedText: 'fixture',
    cardFace: { typeLabel: 'fixture', attributes: ['特殊'], cost, basePower }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities, verification: { implementationStatus: 'complete' } } as any;
}
function archive(overrides?: { sc1?: any[]; sc2?: any[]; sc3?: any[] }) {
  return { schemaVersion: 'fd-card-authoring-v1', id: OWNER, name: 'Fixture', class: 'Assassin', cards: [
    card(SC1, overrides?.sc1 ?? [requiredAdditionalAbility(), jointModifierAbility()], 1, 1),
    card(SC2, overrides?.sc2 ?? [battlefieldOfferAbility()], 0, 0),
    card(SC3, overrides?.sc3 ?? [sealPlayCostAbility(), defeatAbility()], 1, 5),
  ] } as any;
}
function basic() {
  return { id: BASIC, name: BASIC, cardType: 'basic_attack', printedText: 'fixture', cardFace: { typeLabel: '基础攻击', attributes: ['力量'], cost: 2, basePower: 2 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], verification: { implementationStatus: 'complete' } } as any;
}
function pack(raw = archive()) {
  const loaded = rules.loadAuthoringJson(raw); (loaded.cards as any)[BASIC] = basic(); return loaded;
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
  state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'shinto';
  for (const player of state.players) { player.mana = 12; player.vp = 4; (player as any).commandSpells = 3; }
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260929 }); state.abilityRuntime!.playRulesVersion = 'explicit-v1';
  return { state, loaded };
}
function activate(state: GameState, playerId: string, source: string, abilityId: string) {
  const action = rules.getLegalActions(state, playerId).find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === abilityId);
  expect(action).toBeDefined(); const out = rules.dispatchAbilityCommand(state, playerId, action!); expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function choose(state: GameState, playerId: string, selectedIds: string[]) {
  const decision = state.abilityRuntime!.pendingDecision; expect(decision).toBeDefined();
  const out = rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: decision!.id, selectedIds });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function sessionFor(state: GameState) {
  const session = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2', 'p3'], restorePackKind: 'trusted_authoring_fixture' });
  session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
  return session;
}

describe('P3 Tezcat owner-readiness generic joint/battlefield attack capability', () => {
  it('accepts only exact privileged whole-ability shapes and fails closed on widened near matches', () => {
    const loaded = rules.loadAuthoringJson(archive()); expect(loaded.report).toEqual([]);
    expect(loaded.cards[SC1]!.abilities.some(rules.isAcceptedJointOtherAttackModifierAbility)).toBe(true);
    expect(loaded.cards[SC2]!.abilities.some(rules.isAcceptedSameBattlefieldTurnOrderAttackAbility)).toBe(true);
    expect(loaded.cards[SC3]!.abilities.some(rules.isAcceptedCardPlayCommandSealCostAbility)).toBe(true);
    expect(loaded.cards[SC3]!.abilities.some(rules.isAcceptedDefeatAllEngagedOpponentsAbility)).toBe(true);
    const mutations = [
      () => { const a = jointModifierAbility(); a.effects[0].powerBonus = 2; return archive({ sc1: [requiredAdditionalAbility(), a] }); },
      () => { const a = battlefieldOfferAbility(); a.effects[0].rewardVp = 3; return archive({ sc2: [a] }); },
      () => { const a = sealPlayCostAbility(); a.effects[0].amount = 2; return archive({ sc3: [a, defeatAbility()] }); },
      () => { const a = defeatAbility(); a.effects[0].extra = true; return archive({ sc3: [sealPlayCostAbility(), a] }); },
    ];
    for (const mutate of mutations) expect(rules.loadAuthoringJson(mutate()).report.some((entry) => entry.status === 'unsupported')).toBe(true);
  });

  it('requires the joint source as an additional play and applies +2 paid cost and +1 current-round Power to every other jointly played attack only', () => {
    const { state } = setup(); const sc1 = add(state, SC1, 'p1', 'joint-source', 'skill', false);
    add(state, BASIC, 'p1', 'joint-basic-a', 'hand', false); add(state, BASIC, 'p1', 'joint-basic-b', 'hand', false);
    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: sc1 }])).toThrow();
    state.players[0]!.mana = 12;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: sc1 }, { cardInstanceId: 'joint-basic-a' }, { cardInstanceId: 'joint-basic-b' }]);
    expect(state.players[0]!.mana).toBe(3);
    expect(state.abilityRuntime!.cardState[sc1]!.paidManaOnPlay).toBe(1);
    expect(state.abilityRuntime!.cardState['joint-basic-a']!.paidManaOnPlay).toBe(4);
    expect(state.abilityRuntime!.cardState['joint-basic-b']!.paidManaOnPlay).toBe(4);
    expect(rules.calculateCardPower(state, sc1).value).toBe(1);
    expect(rules.calculateCardPower(state, 'joint-basic-a').value).toBe(3);
    expect(rules.calculateCardPower(state, 'joint-basic-b').value).toBe(3);
    state.round.roundNumber++;
    expect(rules.calculateCardPower(state, 'joint-basic-a').value).toBe(2);
  });

  it('offers one real paid attack in round order, records only actual participants, and settles loser VP plus controller reward exactly once', () => {
    const { state } = setup(); const sc2 = add(state, SC2, 'p1', 'offer-source', 'attack_area', true);
    add(state, BASIC, 'p1', 'offer-p1-basic', 'hand', false); add(state, BASIC, 'p2', 'offer-p2-basic', 'hand', false); add(state, BASIC, 'p3', 'offer-p3-basic', 'hand', false);
    state.players[0]!.mana = 8; state.players[1]!.mana = 8; state.players[0]!.vp = 1; state.players[1]!.vp = 5;
    activate(state, 'p1', sc2, 'battlefield-offer');
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p1', min: 0, max: 1 });
    choose(state, 'p1', []);
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p2' });
    choose(state, 'p2', ['offer-p2-basic']);
    expect(state.cards.find((entry) => entry.instanceId === 'offer-p2-basic')?.zone).toBe('attack_area');
    expect(state.players[1]!.mana).toBe(6);
    expect(state.abilityRuntime!.pendingBattlefieldAttackOfferTransaction).toBeUndefined();
    expect(state.abilityRuntime!.battlefieldAttackOfferSettlements).toEqual([{ controllerId: 'p1', sourceCardId: sc2, abilityId: 'battlefield-offer', round: state.round.roundNumber, battlefieldId: 'miyama_town', playedPlayerIds: ['p2'] }]);
    rules.processAbilityEvent(state, { id: 'fixture-battle-result', type: 'after_battle_result_determined', battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p1'], loserIds: ['p2'] } } as any);
    expect(state.players[1]!.vp).toBe(3); expect(state.players[0]!.vp).toBe(3);
    expect(state.abilityRuntime!.battlefieldAttackOfferSettlements).toEqual([]);
    expect(rules.getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === sc2 && entry.abilityId === 'battlefield-offer')).toBe(false);
  });

  it('round-trips a live battlefield attack-offer decision and rejects forged serialized candidate authority', () => {
    const { state } = setup(); const sc2 = add(state, SC2, 'p1', 'restore-offer-source', 'attack_area', true);
    add(state, BASIC, 'p1', 'restore-offer-basic', 'hand', false);
    activate(state, 'p1', sc2, 'battlefield-offer');
    const serialized = JSON.parse(JSON.stringify(sessionFor(state).serializeSession()));
    const restored = rules.restoreMatchSession(serialized, { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.pendingDecision?.interaction).toMatchObject({ kind: 'battlefield_attack_offer_choice_v1', decisionPlayerId: 'p1' });
    const forged = JSON.parse(JSON.stringify(serialized));
    forged.state.abilityRuntime.pendingDecision.candidates.push('forged-card');
    forged.state.abilityRuntime.pendingDecision.interaction.candidateIds.push('forged-card');
    expect(() => rules.restoreMatchSession(forged, { restorePackKind: 'trusted_authoring_fixture' })).toThrow();
  });

  it('charges exactly one ordinary Command Seal as a card-play cost without recording a Command Seal ability use and enforces the physical card per-game limit', () => {
    const { state } = setup(); const sc3 = add(state, SC3, 'p1', 'seal-source', 'skill', false);
    (state.players[0] as any).commandSpells = 1; state.players[0]!.mana = 5;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: sc3 }]);
    expect((state.players[0] as any).commandSpells).toBe(0); expect(state.players[0]!.mana).toBe(4);
    expect(state.abilityRuntime!.normalCommandSealUseHistory ?? []).toEqual([]);
    expect(state.abilityRuntime!.abilityUsage[`play:${sc3}:seal-play-cost`]).toBe(1);
    const physical = state.cards.find((entry) => entry.instanceId === sc3)!; physical.zone = 'skill'; state.abilityRuntime!.cardState[sc3]!.active = false;
    (state.players[0] as any).commandSpells = 1;
    expect(rules.getLegalActions(state, 'p1').some((entry) => entry.type === 'play_card' && entry.cardInstanceId === sc3)).toBe(false);
  });

  it('defeats every eligible active same-battlefield opponent in combat, respects generic loss immunity, and cannot repeat in the round', () => {
    const { state } = setup(); const sc3 = add(state, SC3, 'p1', 'defeat-source', 'attack_area', true);
    state.round.activePhase = 'combat'; state.round.prioritySeat = 1; state.players[2]!.locationId = 'miyama_town';
    state.abilityRuntime!.battleLossIgnoreRoundByPlayer = { p3: state.round.roundNumber };
    activate(state, 'p1', sc3, 'defeat-engaged');
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBe(state.round.roundNumber);
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p3).toBeUndefined();
    expect(rules.getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === sc3 && entry.abilityId === 'defeat-engaged')).toBe(false);
  });

  it('keeps the readiness runtime identity-free', () => {
    const production = [
      'packages/rules/src/ability/joint-battlefield-attack-capability.ts', 'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts', 'packages/rules/src/ability/types.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.tezcat', 'sc-tezcat', '泰兹卡特里波卡', '群豹之王', '战士之司', '第一太阳纪', 'core.tezcat-', 'SkillLib']) expect(production).not.toContain(needle);
  });
});
