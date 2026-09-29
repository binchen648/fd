import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { resolveExtendedEffect } from '../../src/ability/extended-effects';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-sealed-magic';
const CASCADE = `${ROOT}.skill.cascade`;
const HEX = `${ROOT}.skill.hex`;
const HOST = `${ROOT}.skill.host`;
const LUCK = 'fixture.basic.luck';
const PREP = 'fixture.basic.preparation';
const MAGIC = 'fixture.basic.magic';
const PLAIN = 'fixture.basic.plain';
const SEAL = 'fixture:sealed-attacks';

const baseAbility = (id: string) => ({ id, printedClause: 'fixture', conditions: [], targets: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
  responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] } });
function replacementAbility() { return { ...baseAbility('fixture.replace'), kind: 'phase_action', activation: { phase: 'action', opens: 'controller_action_window' },
  effects: [{ type: rules.ROUND_DEFINITION_ATTRIBUTE_REPLACEMENT_EFFECT, targetDefinitionIds: [LUCK, PREP], replaceAttributes: ['魔术'], duration: 'this_round' }] } as any; }
function protectionAbility() { return { ...baseAbility('fixture.protect'), kind: 'passive', activation: {},
  effects: [{ type: rules.ATTACK_ATTRIBUTE_OTHER_PLAYER_PROTECTION_EFFECT, attribute: '魔术', sourcePlayers: 'other_players', prevent: ['deactivation','power_reduction'], duration: 'while_source_present' }] } as any; }
function sealAbility() { return { ...baseAbility('fixture.seal'), kind: 'phase_action', activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
  effects: [{ type: rules.ARM_AFTER_BATTLE_SEAL_EFFECT, sealKey: SEAL, cardKind: 'basic_attack', eligibleAttribute: '魔术', eligibleDefinitionIds: [LUCK, PREP], sameLocation: true, trigger: 'after_battle_ended' }],
  visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' } } as any; }
function cascadeAbility() { return { ...baseAbility('fixture.cascade'), kind: 'phase_action', activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
  effects: [{ type: rules.PLAY_SEALED_ATTACKS_EFFECT, sealKey: SEAL, payCardCosts: true, resealMana: 1, discardDestination: 'controller_discard', dispositionTrigger: 'after_battle_ended' }],
  visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' } } as any; }
function skill(id: string, abilities: any[]) { return { id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: ROOT }, printedText: id,
  cardFace: { typeLabel: 'fixture', attributes: [], cost: 0, basePower: 0 }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
  playRequirements: [], abilities, verification: { implementationStatus: 'complete' } } as any; }
function basic(id: string, attributes: string[], cost: number, basePower: number) { return { id, name: id, cardType: 'basic_attack', printedText: id,
  cardFace: { typeLabel: '基础攻击', attributes, cost, basePower }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
  playRequirements: [], abilities: [], verification: { implementationStatus: 'complete' } } as any; }
function archive(overrides: Partial<{ replacement: any; protection: any; seal: any; cascade: any }> = {}) { return { schemaVersion: 'fd-card-authoring-v1', id: ROOT, name: 'Fixture', class: 'Caster', cards: [
  skill(CASCADE, [overrides.cascade ?? cascadeAbility()]), skill(HEX, [overrides.replacement ?? replacementAbility(), overrides.protection ?? protectionAbility()]), skill(HOST, [overrides.seal ?? sealAbility()]),
  basic(LUCK, ['特殊'], 2, 1), basic(PREP, ['特殊'], 1, 1), basic(MAGIC, ['魔术'], 2, 5), basic(PLAIN, ['近战'], 1, 4),
] } as any; }
function add(state: GameState, definitionId: string, owner: string, instanceId: string, zone = 'attack_area', active = true) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone, visibility: { scope: zone === 'hand' || zone === 'skill' ? 'owner_only' : 'public', ...(zone === 'hand' || zone === 'skill' ? { ownerPlayerId: owner } : {}) } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1,2,3] }); state.cards = []; state.round.prioritySeat = 1;
  state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'shinto';
  state.players[0]!.mana = 12; state.players[1]!.mana = 12;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260929 });
  const cascade = add(state, CASCADE, 'p1', 'fixture-cascade');
  const hex = add(state, HEX, 'p1', 'fixture-hex', 'skill', false);
  const host = add(state, HOST, 'p1', 'fixture-host');
  return { state, pack, cascade, hex, host };
}
function activate(state: GameState, source: string, abilityId: string) {
  const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === abilityId);
  expect(action).toBeDefined(); const out = rules.dispatchAbilityCommand(state, 'p1', action!); expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function resolvePending(state: GameState, selectedIds: string[]) {
  const pending = state.abilityRuntime!.pendingDecision!;
  const out = rules.dispatchAbilityCommand(state, pending.controllerId, { type: 'choose_target', decisionId: pending.id, selectedIds });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function battleEnded(state: GameState, id: string) {
  rules.processAbilityEvent(state, { id, type: 'after_battle_ended', battlePhaseResolutionId: `phase-${id}` });
}
function sessionFor(state: GameState) { const session = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1','p2','p3'], restorePackKind: 'trusted_authoring_fixture' });
  session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = []; return session; }

describe('P3 Tamamo owner-readiness generic sealed-card/Magic capability', () => {
  it('accepts only exact identity-free whole-ability shells and rejects widened near-matches', () => {
    const loaded = rules.loadAuthoringJson(archive()); expect(loaded.report.some((entry) => entry.status === 'unsupported')).toBe(false);
    expect(rules.isAcceptedRoundDefinitionAttributeReplacementAbility(loaded.cards[HEX]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedAttackAttributeOtherPlayerProtectionAbility(loaded.cards[HEX]!.abilities[1]!)).toBe(true);
    expect(rules.isAcceptedAfterBattleSealAbility(loaded.cards[HOST]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedPlaySealedAttacksAbility(loaded.cards[CASCADE]!.abilities[0]!)).toBe(true);
    const badReplacement = replacementAbility(); badReplacement.effects[0].targetDefinitionIds = [LUCK];
    const badProtection = protectionAbility(); badProtection.effects[0].prevent = ['deactivation'];
    const badSeal = sealAbility(); badSeal.effects[0].sameLocation = false;
    const badCascade = cascadeAbility(); badCascade.effects[0].resealMana = 2;
    for (const input of [archive({ replacement: badReplacement }), archive({ protection: badProtection }), archive({ seal: badSeal }), archive({ cascade: badCascade })]) {
      expect(rules.loadAuthoringJson(input).report.some((entry) => entry.status === 'unsupported')).toBe(true);
    }
  });

  it('replaces only the authored controller definitions for this round and expires by round identity', () => {
    const { state, hex } = setup(); const luck = add(state, LUCK, 'p1', 'luck-hand', 'hand', false); const plain = add(state, PLAIN, 'p1', 'plain-hand', 'hand', false);
    state.round.activePhase = 'action'; activate(state, hex, 'fixture.replace');
    expect(rules.getEffectiveCardAttributes(state, luck)).toEqual(['魔术']);
    expect(rules.getEffectiveCardAttributes(state, plain)).toEqual(['近战']);
    state.round.roundNumber++;
    expect(rules.getEffectiveCardAttributes(state, luck)).toEqual(['特殊']);
  });

  it('protects effective Magic attacks only from other-player close/deactivation and power reduction while source is present', () => {
    const { state, hex } = setup(); const attack = add(state, MAGIC, 'p1', 'magic-attack'); const enemySource = add(state, PLAIN, 'p2', 'enemy-source');
    const carrier = state.cards.find((entry) => entry.instanceId === attack) as any;
    carrier.powerModifiers = [{ kind: 'add', value: -3, sourceId: enemySource, id: 'enemy-debuff', lifecycle: 'until_leaves_active_area', round: state.round.roundNumber }];
    expect(rules.calculateCardPower(state, attack).value).toBe(5);
    expect(rules.isCardCloseForbidden(state, attack, 'p2')).toBe(true);
    expect(rules.isCardCloseForbidden(state, attack, 'p1')).toBe(false);
    state.cards.find((entry) => entry.instanceId === hex)!.zone = 'discard';
    expect(rules.calculateCardPower(state, attack).value).toBe(2);
    expect(rules.isCardCloseForbidden(state, attack, 'p2')).toBe(false);
  });

  it('preserves production extended-effect controller provenance for opponent Power reducers while self-origin reductions remain unprotected', () => {
    const { state } = setup();
    const attack = add(state, MAGIC, 'p1', 'magic-production-target');
    const enemySource = add(state, PLAIN, 'p2', 'enemy-production-source');
    const carrier = state.cards.find((entry) => entry.instanceId === attack) as any;

    resolveExtendedEffect(state, 'p2', { type: 'reduce_opponents_power', amount: 3, condition: 'opponent_has_no_terrain', scope: 'same_battlefield' },
      { sourceCardId: enemySource, abilityId: 'fixture.enemy-reduce' });
    expect(carrier.powerModifiers).toContainEqual(expect.objectContaining({
      sourceId: enemySource, controllerId: 'p2', kind: 'add', value: -3,
    }));
    expect(rules.calculateCardPower(state, attack).value).toBe(5);

    carrier.powerModifiers = [];
    resolveExtendedEffect(state, 'p2', { type: 'set_opponent_power_to_zero', condition: 'not_luck_or_agility' },
      { sourceCardId: enemySource, abilityId: 'fixture.enemy-zero' });
    expect(carrier.powerModifiers).toContainEqual(expect.objectContaining({
      sourceId: enemySource, controllerId: 'p2', kind: 'set', value: 0,
    }));
    expect(rules.calculateCardPower(state, attack).value).toBe(5);

    carrier.powerModifiers = [{
      id: 'self-reduction', sourceId: 'fixture-hex', controllerId: 'p1', kind: 'add', value: -2, duration: 'round',
    }];
    expect(rules.calculateCardPower(state, attack).value).toBe(3);
  });
  it('arms in combat and after battle seals one qualifying same-location active basic attack under the authored host', () => {
    const { state, host } = setup(); const magic = add(state, MAGIC, 'p2', 'opponent-magic'); const luck = add(state, LUCK, 'p1', 'controller-luck');
    state.round.activePhase = 'battle'; activate(state, host, 'fixture.seal');
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    battleEnded(state, 'battle-one');
    expect(state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('sealed_card_choice_v1');
    expect(new Set(state.abilityRuntime!.pendingDecision!.candidates)).toEqual(new Set([magic, luck]));
    resolvePending(state, [magic]);
    expect(state.cards.find((entry) => entry.instanceId === magic)).toMatchObject({ zone: 'sealed', ownerPlayerId: 'p2' });
    expect(state.abilityRuntime!.sealedCardBindings?.[magic]).toMatchObject({ sealKey: SEAL, controllerId: 'p1', hostSourceCardId: host, originalOwnerPlayerId: 'p2' });
  });

  it('Cascade atomically replays every sealed physical card at normal aggregate cost, preserves borrowed ownership, then can pay 1 each to reseal', () => {
    const { state, cascade, host } = setup(); const magic = add(state, MAGIC, 'p2', 'borrowed-magic');
    state.round.activePhase = 'battle'; activate(state, host, 'fixture.seal'); battleEnded(state, 'battle-auto-seal');
    expect(state.cards.find((entry) => entry.instanceId === magic)?.zone).toBe('sealed');
    const beforeMana = state.players[0]!.mana; state.round.activePhase = 'action'; state.round.prioritySeat = 1; activate(state, cascade, 'fixture.cascade');
    expect(state.players[0]!.mana).toBe(beforeMana - 2);
    expect(state.cards.find((entry) => entry.instanceId === magic)).toMatchObject({ zone: 'attack_area', ownerPlayerId: 'p2', controllerPlayerId: 'p1' });
    expect(state.abilityRuntime!.sealedCardReplays?.[magic]).toMatchObject({ originalOwnerPlayerId: 'p2', hostSourceCardId: host });
    state.round.activePhase = 'battle'; battleEnded(state, 'battle-reseal');
    expect(state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('sealed_card_disposition_v1');
    const manaBeforeReseal = state.players[0]!.mana; resolvePending(state, [magic]);
    expect(state.players[0]!.mana).toBe(manaBeforeReseal - 1);
    expect(state.cards.find((entry) => entry.instanceId === magic)).toMatchObject({ zone: 'sealed', ownerPlayerId: 'p2', controllerPlayerId: 'p1' });
    expect(state.abilityRuntime!.sealedCardBindings?.[magic]).toBeDefined();
  });

  it('Cascade discard disposition transfers borrowed physical ownership into the controller discard and fails atomically when aggregate cost is unaffordable', () => {
    const { state, cascade, host } = setup(); const magic = add(state, MAGIC, 'p2', 'borrowed-cost-two'); const prep = add(state, PREP, 'p2', 'borrowed-cost-one');
    state.round.activePhase = 'battle'; activate(state, host, 'fixture.seal'); battleEnded(state, 'battle-pick-first'); resolvePending(state, [magic]);
    state.round.roundNumber++; state.abilityRuntime!.cardState[host]!.playedRound = state.round.roundNumber; state.abilityRuntime!.cardState[cascade]!.playedRound = state.round.roundNumber;
    // Seal the second physical card in the new round under the same host.
    state.round.activePhase = 'battle'; state.round.prioritySeat = 1; activate(state, host, 'fixture.seal'); battleEnded(state, 'battle-pick-second');
    if (state.abilityRuntime!.pendingDecision) resolvePending(state, [prep]);
    expect(Object.keys(state.abilityRuntime!.sealedCardBindings ?? {}).sort()).toEqual([magic, prep].sort());
    state.round.activePhase = 'action'; state.round.prioritySeat = 1; state.players[0]!.mana = 2;
    const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === cascade && entry.abilityId === 'fixture.cascade');
    expect(action).toBeDefined();
    const failed = rules.dispatchAbilityCommand(state, 'p1', action!); expect(failed.ok).toBe(false);
    expect(state.cards.find((entry) => entry.instanceId === magic)?.zone).toBe('sealed'); expect(state.cards.find((entry) => entry.instanceId === prep)?.zone).toBe('sealed');
    state.players[0]!.mana = 12; activate(state, cascade, 'fixture.cascade'); state.round.activePhase = 'battle'; battleEnded(state, 'battle-discard');
    resolvePending(state, []);
    for (const id of [magic, prep]) expect(state.cards.find((entry) => entry.instanceId === id)).toMatchObject({ zone: 'discard', ownerPlayerId: 'p1', controllerPlayerId: 'p1' });
  });

  it('round-trips sealed provenance and pending private decisions, rejecting forged host/key provenance', () => {
    const { state, host } = setup(); const magic = add(state, MAGIC, 'p2', 'restore-magic'); const luck = add(state, LUCK, 'p1', 'restore-luck');
    state.round.activePhase = 'battle'; activate(state, host, 'fixture.seal'); battleEnded(state, 'battle-pending-restore');
    expect(state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('sealed_card_choice_v1');
    const pendingSnapshot: any = JSON.parse(JSON.stringify(sessionFor(state).serializeSession()));
    expect(rules.restoreMatchSession(pendingSnapshot, { restorePackKind: 'trusted_authoring_fixture' }).state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('sealed_card_choice_v1');
    const forgedPending = structuredClone(pendingSnapshot); forgedPending.state.abilityRuntime.pendingDecision.interaction.sealKey = 'forged:key';
    expect(() => rules.restoreMatchSession(forgedPending, { restorePackKind: 'trusted_authoring_fixture' })).toThrow();
    resolvePending(state, [magic]);
    const snapshot: any = JSON.parse(JSON.stringify(sessionFor(state).serializeSession()));
    expect(rules.restoreMatchSession(snapshot, { restorePackKind: 'trusted_authoring_fixture' }).state.abilityRuntime!.sealedCardBindings?.[magic]?.hostSourceCardId).toBe(host);
    const wrongHost = structuredClone(snapshot); wrongHost.state.abilityRuntime.sealedCardBindings[magic].hostSourceCardId = 'fixture-cascade';
    expect(() => rules.restoreMatchSession(wrongHost, { restorePackKind: 'trusted_authoring_fixture' })).toThrow();
    const wrongKey = structuredClone(snapshot); wrongKey.state.abilityRuntime.sealedCardBindings[magic].sealKey = 'forged:key';
    expect(() => rules.restoreMatchSession(wrongKey, { restorePackKind: 'trusted_authoring_fixture' })).toThrow();
    expect(luck).toBeTruthy();
  });

  it('contains no Tamamo/card-name/printed-text/legacy-handler identity route in production runtime', () => {
    const production = ['packages/rules/src/ability/sealed-card-magic-capability.ts','packages/rules/src/ability/card-instance-state.ts','packages/rules/src/ability/card-close-forbid.ts','packages/rules/src/ability/interpreter.ts','packages/rules/src/ability/loader.ts','packages/rules/src/match-session.ts']
      .map((path) => readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.tamamo','sc-tamamo','玉藻','水天日光天照八野镇石','荼枳尼天法','core.tamamo-cascade','core.tamamo-witchcraft','core.tamamo-transcendence','SkillLib']) expect(production).not.toContain(needle);
  });
});
