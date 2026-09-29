import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { playerCombatTotalPowerAdjustment } from '../../src/ability/owner-self-mechanics';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ARCHIVE = 'data/authoring/servants/servant.tesla.json';
const ROOT = 'servant.tesla';
const SC1 = `${ROOT}.skill.sc-tesla-1`;
const SC2 = `${ROOT}.skill.sc-tesla-2`;
const SC3 = `${ROOT}.skill.sc-tesla-3`;
const TEXT_SHA = [
  '194e48dddeeca6572784bf75bf20031e29c74f5158eb3cfbcfa2c6413b4d0e62',
  '9cf778b4ccd6aba23d1262e8e5e1b7d36bd3a4588891f1b3259703d4f672ec12',
  'b20d1e984e508c838673d2b5bd596be6ff7620e93dd9bc694e3ca8f6468478f9',
];

const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
function rawArchive(): any { return JSON.parse(readFileSync(ARCHIVE, 'utf8')); }
function pack() {
  const loaded = rules.loadAuthoringJson(rawArchive());
  expect(loaded.report).toEqual([]);
  return loaded;
}
function add(state: GameState, definitionId: string, owner: string, instanceId: string, zone = 'attack_area', active = true) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const loaded = pack();
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  for (const player of state.players) player.mana = 10;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'shinto';
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260929 });
  return { state, loaded };
}
function playFromSkill(state: GameState, definitionId: string, instanceId: string) {
  add(state, definitionId, 'p1', instanceId, 'skill', false);
  const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'play_card' && entry.cardInstanceId === instanceId);
  expect(action).toBeDefined();
  const out = rules.dispatchAbilityCommand(state, 'p1', action!);
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
  return instanceId;
}
function sessionFor(state: GameState) {
  const session = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2', 'p3'], restorePackKind: 'trusted_authoring_fixture' });
  session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
  return session;
}

describe('P3 owner-complete Tesla migration', () => {
  it('materializes all three frozen Tesla skills with exact F1 text/static metadata and only accepted mana-transaction seams', () => {
    const raw = rawArchive(); const loaded = pack();
    expect(raw).toMatchObject({ id: ROOT, name: '尼古拉·特斯拉', class: 'Archer' });
    expect(raw.cards.map((card: any) => card.id)).toEqual([SC1, SC2, SC3]);
    expect(raw.cards.map((card: any) => sha(card.printedText))).toEqual(TEXT_SHA);
    expect(raw.cards.map((card: any) => [card.cardFace.typeLabel, card.cardFace.attributes, card.cardFace.cost, card.cardFace.basePower])).toEqual([
      ['特殊', ['特殊'], 6, 0], ['宝具', ['宝具'], 0, 3], ['魔术/宝具', ['魔术', '宝具'], 5, 12],
    ]);
    expect(raw.cards.map((card: any) => card.playRequirements)).toEqual([
      [{ type: 'skill_zone_mana_at_least', value: 8 }],
      [{ type: 'skill_zone_mana_at_least', value: 8 }],
      [{ type: 'skill_zone_mana_at_least', value: 8 }],
    ]);
    const privileged = Object.values(loaded.cards).flatMap((card: any) => card.abilities)
      .filter((ability: any) => ability.effects.some((effect: any) => [
        'same_location_other_player_mana_spend_reward', 'self_mana_overflow_round_power_close',
        'opponent_mana_overflow_defeat', 'lose_all_controller_mana_add_round_power', 'grant_same_location_opponents_mana',
      ].includes(effect.type)));
    expect(privileged).toHaveLength(6);
    expect(privileged.every(rules.isAcceptedManaTransactionAbility)).toBe(true);
    expect(loaded.cards[SC2]!.abilities.some((ability) => ability.id === 'sc-tesla-2.true-name-release')).toBe(true);
    expect(loaded.cards[SC3]!.abilities.some((ability) => ability.id === 'sc-tesla-3.true-name-release')).toBe(true);
  });

  it('enforces the final 8-mana skill-zone gate for all three cards and pays their printed costs', () => {
    for (const [cardId, printedCost] of [[SC1, 6], [SC2, 0], [SC3, 5]] as const) {
      const low = setup(); low.state.players[0]!.mana = 7; const lowId = add(low.state, cardId, 'p1', `${cardId}:low`, 'skill', false);
      expect(rules.getLegalActions(low.state, 'p1').some((entry) => entry.type === 'play_card' && entry.cardInstanceId === lowId)).toBe(false);
      const exact = setup(); exact.state.players[0]!.mana = 8; const id = add(exact.state, cardId, 'p1', `${cardId}:exact`, 'skill', false);
      const action = rules.getLegalActions(exact.state, 'p1').find((entry) => entry.type === 'play_card' && entry.cardInstanceId === id);
      expect(action).toBeDefined();
      expect(rules.dispatchAbilityCommand(exact.state, 'p1', action!).ok).toBe(true);
      const expectedMana = cardId === SC2 ? 0 : 8 - printedCost;
      expect(exact.state.players[0]!.mana).toBe(expectedMana);
    }
  });

  it('runs real sc1 spend reward, storage-overflow Power stacking, and canonical battle-terminal close', () => {
    const spend = setup(); const sc1 = add(spend.state, SC1, 'p1', 'tesla-sc1-spend');
    spend.state.players[0]!.mana = 4; spend.state.players[1]!.mana = 10;
    rules.spendMana(spend.state, 'p2', 2);
    expect(spend.state.players[0]!.mana).toBe(6);
    expect(spend.state.abilityRuntime!.events.some((event) => event.type === 'same_location_mana_spend_reward' && event.sourceCardId === sc1)).toBe(true);

    const overflow = setup(); const overflowSc1 = add(overflow.state, SC1, 'p1', 'tesla-sc1-overflow');
    overflow.state.players[0]!.mana = 12;
    rules.grantMana(overflow.state, 'p1', 1, { source: 'generic' });
    rules.grantMana(overflow.state, 'p1', 2, { source: 'generic' });
    expect(playerCombatTotalPowerAdjustment(overflow.state, 'p1')).toBe(10);
    expect(overflow.state.abilityRuntime!.cardState[overflowSc1]!.manaOverflowCloseAfterBattle).toMatchObject({ round: overflow.state.round.roundNumber });
    const terminal = `battle-phase:${overflow.state.round.roundNumber}`;
    rules.processAbilityEvent(overflow.state, { id: `${terminal}:after_battle_ended`, type: 'after_battle_ended', battlePhaseResolutionId: terminal });
    expect(overflow.state.cards.find((card) => card.instanceId === overflowSc1)).toMatchObject({ zone: 'skill', controllerPlayerId: 'p1' });
    expect(overflow.state.abilityRuntime!.cardState[overflowSc1]).toMatchObject({ active: false, faceDown: false });
  });

  it('runs real sc2 overflow defeat and on-play lose-all-mana Power conversion with true-name reveal', () => {
    const passive = setup(); add(passive.state, SC2, 'p1', 'tesla-sc2-passive'); passive.state.players[1]!.mana = 12;
    rules.grantMana(passive.state, 'p2', 1, { source: 'generic' });
    expect(passive.state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBe(passive.state.round.roundNumber);

    const play = setup(); play.state.players[0]!.mana = 8;
    playFromSkill(play.state, SC2, 'tesla-sc2-play');
    expect(play.state.players[0]!.mana).toBe(0);
    expect(playerCombatTotalPowerAdjustment(play.state, 'p1')).toBe(8);
    expect(play.state.abilityRuntime!.revealedServants).toContain('p1');
    expect(play.state.abilityRuntime!.events.filter((event) => event.type === 'same_location_mana_spend_reward')).toHaveLength(0);
  });

  it('runs real sc3 on-play grant, true-name reveal, and mandatory once-per-round combat grant through normal mana gain', () => {
    const { state } = setup(); state.players[0]!.mana = 8; state.players[1]!.mana = 8;
    const sc3 = playFromSkill(state, SC3, 'tesla-sc3-play');
    expect(state.players[0]!.mana).toBe(3);
    expect(state.players[1]!.mana).toBe(10);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');

    state.round.prioritySeat = 1;
    rules.advanceAbilityPhase(state, 'battle', state.round.roundNumber);
    expect(state.players[1]!.mana).toBe(12);
    expect(state.abilityRuntime!.usedAbilities[`${sc3}:sc-tesla-3.combat-grant`]).toBe(state.round.roundNumber);
    const grants = state.abilityRuntime!.events.filter((event) => event.type === 'mana_granted' && event.playerId === 'p2').length;
    rules.advanceAbilityPhase(state, 'battle', state.round.roundNumber);
    expect(state.players[1]!.mana).toBe(12);
    expect(state.abilityRuntime!.events.filter((event) => event.type === 'mana_granted' && event.playerId === 'p2')).toHaveLength(grants);
  });

  it('round-trips accepted sc1 overflow-close provenance through MatchSession restore', () => {
    const { state } = setup(); const sc1 = add(state, SC1, 'p1', 'tesla-sc1-restore'); state.players[0]!.mana = 12;
    rules.grantMana(state, 'p1', 1, { source: 'generic' });
    const restored = rules.restoreMatchSession(JSON.parse(JSON.stringify(sessionFor(state).serializeSession())), { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.cardState[sc1]!.manaOverflowCloseAfterBattle).toMatchObject({
      round: state.round.roundNumber,
      sourceAbilityId: 'sc-tesla-1.overflow-power-close',
    });
  });

  it('keeps formal migration runtime-free and production free of Tesla identity routing', () => {
    const production = [
      'packages/rules/src/ability/mana-transaction-capability.ts', 'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts', 'packages/rules/src/ability/resolution-dataflow.ts',
      'packages/rules/src/core/card-play.ts', 'packages/rules/src/core/movement.ts', 'packages/rules/src/core/rule-overrides.ts',
      'packages/rules/src/match-session.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.tesla', 'sc-tesla', '尼古拉', '雷电之手', '人类神话', 'core.tesla-', 'SkillLib']) expect(production).not.toContain(needle);
  });
});
