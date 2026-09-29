import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ARCHIVE = 'data/authoring/servants/servant.teach.json';
const ROOT = 'servant.teach';
const SC1 = `${ROOT}.skill.sc-teach-1`;
const SC2 = `${ROOT}.skill.sc-teach-2`;
const SC3 = `${ROOT}.skill.sc-teach-3`;
const RECORD = 'servant.teach:gentleman-love';
const BASIC1 = 'fixture.teach.basic.one';
const BASIC2 = 'fixture.teach.basic.two';
const BASIC3 = 'fixture.teach.basic.three';
const BASIC4 = 'fixture.teach.basic.four';

function rawArchive(): any { return JSON.parse(readFileSync(ARCHIVE, 'utf8')); }
function basic(id: string, cost: number, basePower: number) {
  return { id, name: id, cardType: 'basic_attack', printedText: id,
    cardFace: { typeLabel: '基础攻击', attributes: ['力量'], cost, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], verification: { implementationStatus: 'complete' } } as any;
}
function pack() {
  const loaded = rules.loadAuthoringJson(rawArchive());
  expect(loaded.report).toEqual([]);
  (loaded.cards as any)[BASIC1] = basic(BASIC1, 0, 1);
  (loaded.cards as any)[BASIC2] = basic(BASIC2, 1, 6);
  (loaded.cards as any)[BASIC3] = basic(BASIC3, 3, 3);
  (loaded.cards as any)[BASIC4] = basic(BASIC4, 2, 2);
  return loaded;
}
function add(state: GameState, definitionId: string, owner: string, instanceId: string, zone: string, active = false) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['attack_area', 'removed_from_game'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const loaded = pack(); const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = []; state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  state.players[0]!.mana = 20; state.players[0]!.vp = 0; state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.mana = 20; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'shinto';
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260929 });
  const sc1 = add(state, SC1, 'p1', 'teach-sc1', 'skill', false);
  const cards = [
    add(state, BASIC1, 'p2', 'teach-p2-top-1', 'deck'), add(state, BASIC2, 'p2', 'teach-p2-top-2', 'deck'),
    add(state, BASIC3, 'p2', 'teach-p2-top-3', 'deck'), add(state, BASIC4, 'p2', 'teach-p2-top-4', 'deck'),
  ];
  return { state, loaded, sc1, cards };
}
function battleResult(state: GameState, resultId = 'teach-result-1') {
  rules.processAbilityEvent(state, {
    id: resultId, type: 'after_battle_result_determined', battlePhaseResolutionId: `battle-phase:${resultId}`,
    battleId: `battle:${resultId}`, resultId, battlefieldId: 'miyama_town', battleParticipantIds: ['p1', 'p2'],
    battleParticipantPowers: { p1: 6, p2: 3 }, battleResult: { winners: ['p1'], loserIds: ['p2'] },
  });
}
function choose(state: GameState, selectedIds: string[]) {
  const pending = state.abilityRuntime!.pendingDecision!;
  const out = rules.dispatchAbilityCommand(state, pending.controllerId, { type: 'choose_target', decisionId: pending.id, selectedIds });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}

describe('P3 owner-complete Teach migration', () => {
  it('materializes the exact three-card owner set with frozen text/static metadata and accepted generic seams', () => {
    const raw = rawArchive(); const loaded = pack();
    expect(raw).toMatchObject({ id: ROOT, name: '爱德华·蒂奇', class: 'Rider' });
    expect(raw.cards.map((card: any) => card.id)).toEqual([SC1, SC2, SC3]);
    expect(raw.cards.map((card: any) => card.printedText)).toEqual([
      '被动：当你赢得一场争夺战时，你不获得竞争战果，而是选择一名该场战斗的败者并抽取其牌库顶的三张牌，然后将其中一张移除并将剩余的牌以任意顺序放回其牌堆顶。你获得X点战果，X为因此效果被移除的卡的印刷基本威力且至多为5。',
      '【真名解放】\n行动阶段：打出一张你以【绅士之爱】移除的牌（若该牌魔力消耗低于2，将其增加至2）。并于战斗阶段结束后将此牌移除游戏。',
      '打出时：若此牌与一张基础攻击一同打出，抽一张牌。\n坐骑召唤-行动阶段：打出至多3张基本威力为3或更低的手牌。',
    ]);
    expect(raw.cards.map((card: any) => [card.cardFace.typeLabel, card.cardFace.attributes, card.cardFace.cost, card.cardFace.basePower])).toEqual([
      ['被动', [], 0, 0], ['力量/宝具', ['力量', '宝具'], 4, 8], ['特殊', ['特殊'], 3, 0],
    ]);
    expect(raw.cards.map((card: any) => card.playRequirements)).toEqual([
      [], [{ type: 'skill_zone_mana_at_least', value: 8 }], [{ type: 'skill_zone_mana_at_least', value: 8 }],
    ]);
    expect(loaded.cards[SC1]!.abilities.some(rules.isAcceptedBattleCompetitionPlunderAbility)).toBe(true);
    expect(loaded.cards[SC2]!.abilities.some(rules.isAcceptedPlayRecordedRemovedCardAbility)).toBe(true);
    expect(loaded.cards[SC3]!.abilities.map((ability) => ability.id)).toEqual(['sc-teach-3.draw', 'sc-teach-3.mount-summon']);
    expect(raw.cards[0].phase3Evidence.f1ClauseSources).toEqual([
      { document: 'src/content/generated/legacy-content.json', locator: 'servants[93].skills[0].text#line=1', sha256: 'c7c5ab7dddc31990dc68a5088b4f159e949791232ee8213a6f313d9b93324cb3' },
    ]);
    expect(raw.cards[1].phase3Evidence.f1ClauseSources.map((entry: any) => entry.sha256)).toEqual([
      '34d0686e0a3e32928564917e173f901363e57039d02d16fb7d63a4003209ab4c',
      '2872e3857b9629aad26a9bbad7a0a43b00812bf914a0684ed70ffca1f2b861cf',
    ]);
  });

  it('keeps sc1 passive in the skill zone and enforces the final 8-mana play gate on sc2/sc3', () => {
    const low = setup(); low.state.players[0]!.mana = 7;
    const lowSc2 = add(low.state, SC2, 'p1', 'teach-sc2-low', 'skill', false);
    const lowSc3 = add(low.state, SC3, 'p1', 'teach-sc3-low', 'skill', false);
    expect(rules.getLegalActions(low.state, 'p1').some((entry) => entry.type === 'play_card' && entry.cardInstanceId === lowSc2)).toBe(false);
    expect(rules.getLegalActions(low.state, 'p1').some((entry) => entry.type === 'play_card' && entry.cardInstanceId === lowSc3)).toBe(false);
    expect(rules.controllerHasCompetitionRewardPlunderReplacement(low.state, 'p1')).toBe(true);

    const exact = setup(); exact.state.players[0]!.mana = 8;
    const sc2 = add(exact.state, SC2, 'p1', 'teach-sc2-exact', 'skill', false);
    const action = rules.getLegalActions(exact.state, 'p1').find((entry) => entry.type === 'play_card' && entry.cardInstanceId === sc2);
    expect(action).toBeDefined(); expect(rules.dispatchAbilityCommand(exact.state, 'p1', action!).ok).toBe(true);
    expect(exact.state.players[0]!.mana).toBe(4);
  });

  it('runs real sc1 through competition replacement, exact physical top-three removal, VP cap and arbitrary reorder', () => {
    const { state, cards } = setup(); state.round.activePhase = 'battle';
    const location = state.map.locations.find((entry) => entry.id === 'miyama_town')! as any;
    location.rewardHooks = ['battle_rewards', 'competition_rewards', 'location_rewards']; location.vpRewardRules = { battle: 2, competition: 3, location: 4 };
    const resolved = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town', participants: [
      { playerId: 'p1', totalPower: 6 }, { playerId: 'p2', totalPower: 3 },
    ] }).nextState;
    const result = resolved.battleResults.at(-1)!;
    expect(result.vpAdjustments?.find((entry) => entry.playerId === 'p1' && entry.source === 'competition_vp')).toBeUndefined();
    battleResult(resolved);
    expect(resolved.abilityRuntime!.pendingDecision?.interaction).toMatchObject({ kind: 'battle_plunder_choice_v1', stage: 'loser', loserIds: ['p2'] });
    choose(resolved, ['p2']);
    expect(resolved.abilityRuntime!.pendingDecision?.interaction).toMatchObject({ kind: 'battle_plunder_choice_v1', stage: 'remove', topCardIds: cards.slice(0, 3) });
    choose(resolved, [cards[1]!]);
    expect(resolved.players[0]!.vp).toBe(5);
    expect(resolved.cards.find((card) => card.instanceId === cards[1])!.zone).toBe('removed_from_game');
    expect(resolved.abilityRuntime!.recordedRemovedCards?.[cards[1]!]).toMatchObject({ recordKey: RECORD, controllerId: 'p1', originalOwnerPlayerId: 'p2' });
    choose(resolved, [cards[2]!, cards[0]!]);
    expect(resolved.cards.filter((card) => card.ownerPlayerId === 'p2' && card.zone === 'deck').map((card) => card.instanceId)).toEqual([cards[2], cards[0], cards[3]]);
  });

  it('runs real sc2 replay at normal cost floored to 2, preserves original ownership, reveals true name, and removes sc2 after battle', () => {
    const { state, sc1, cards } = setup(); battleResult(state); choose(state, ['p2']); choose(state, [cards[1]!]); choose(state, [cards[0]!, cards[2]!]);
    state.cards.find((card) => card.instanceId === sc1)!.zone = 'discard';
    state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    const sc2 = add(state, SC2, 'p1', 'teach-sc2', 'attack_area', true);
    const beforeMana = state.players[0]!.mana;
    const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === sc2 && entry.abilityId === 'sc-teach-2.queen-anne-revenge');
    expect(action).toBeDefined(); expect(rules.dispatchAbilityCommand(state, 'p1', action!)).toMatchObject({ ok: true });
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(state.abilityRuntime!.pendingDecision?.candidates).toEqual([cards[1]]);
    choose(state, [cards[1]!]);
    expect(state.cards.find((card) => card.instanceId === cards[1])).toMatchObject({ ownerPlayerId: 'p2', controllerPlayerId: 'p1', zone: 'attack_area' });
    expect(state.players[0]!.mana).toBe(beforeMana - 2);
    expect(state.abilityRuntime!.cardState[cards[1]!]!.paidManaOnPlay).toBe(2);
    const terminal = `battle-phase:${state.round.roundNumber}`;
    rules.processAbilityEvent(state, { id: `${terminal}:after_battle_ended`, type: 'after_battle_ended', battlePhaseResolutionId: terminal });
    expect(state.cards.find((card) => card.instanceId === sc2)!.zone).toBe('removed_from_game');
  });

  it('keeps accepted loser semantics when every non-winner is loss-suppressed', () => {
    const { state } = setup(); state.round.activePhase = 'battle';
    state.abilityRuntime!.battleLossIgnoreRoundByPlayer = { p2: state.round.roundNumber };
    const location = state.map.locations.find((entry) => entry.id === 'miyama_town')! as any;
    location.rewardHooks = ['battle_rewards', 'competition_rewards', 'location_rewards']; location.vpRewardRules = { battle: 2, competition: 3, location: 4 };
    const resolved = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town', participants: [
      { playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 1 },
    ] }).nextState;
    const result = resolved.battleResults.at(-1)!;
    expect(result.lossEffectSuppressedPlayerIds).toEqual(['p2']);
    expect(result.vpAdjustments?.find((entry) => entry.playerId === 'p1' && entry.source === 'competition_vp')?.delta).toBeGreaterThan(0);
    rules.processAbilityEvent(resolved, {
      id: 'teach-suppressed-result', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:suppressed',
      battleId: 'battle-suppressed', resultId: 'teach-suppressed-result', battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1', 'p2'], battleParticipantPowers: { p1: 5, p2: 1 }, battleResult: { winners: ['p1'], loserIds: [] },
    });
    expect(resolved.abilityRuntime!.pendingDecision).toBeUndefined();
  });

  it('preserves historical sc3 semantics and keeps production runtime free of Teach identity routing', () => {
    const raw = rawArchive(); const sc3 = raw.cards.find((card: any) => card.id === SC3)!;
    expect(sc3).toMatchObject({
      aliases: ['sc_teach_3'], name: '骑乘（Rider Class）',
      cardFace: { typeLabel: '特殊', attributes: ['特殊'], cost: 3, basePower: 0 },
      playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }],
    });
    expect(sc3.abilities.map((ability: any) => [ability.id, ability.kind])).toEqual([
      ['sc-teach-3.draw', 'forced_trigger'], ['sc-teach-3.mount-summon', 'phase_action'],
    ]);
    expect(sc3.phase3Evidence).toMatchObject({
      f1Commit: '59f145434695d29bdd17e4cb3adc887e84182377',
      referenceStaticMetadata: { legacySkillId: 'sc_teach_3', cost: 3, basePower: 0, legacyRequirement: 3 },
      canonicalSkillZoneManaRequirement: { value: 8, authority: 'final_rules_9.4' },
    });
    const production = [
      'packages/rules/src/ability/battle-plunder-replay-capability.ts', 'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts', 'packages/rules/src/core/combat-resolver.ts', 'packages/rules/src/match-session.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.teach', 'sc-teach', '爱德华', '绅士之爱', '安妮女王', 'core.teach-', 'SkillLib']) expect(production).not.toContain(needle);
  });
});
