import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.celenike';
const S1 = `${ROOT}.skill.s1`;
const S1A = `${ROOT}.skill.s1a`;
const ASC = `${ROOT}.skill.ascension`;
const IDS = [ASC, S1, S1A];
const STATUS = 'celenike.wither';
const PATH = 'data/authoring/masters/master.celenike.json';

const raw = JSON.parse(readFileSync(PATH, 'utf8'));
const loaded = rules.loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;

function add(state: GameState, definitionId: string, owner = 'p1', zone = 'skill') {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: owner,
    controllerPlayerId: owner,
    zone,
    visibility: zone === 'skill' || zone === 'hand'
      ? { scope: 'owner_only', ownerPlayerId: owner }
      : { scope: 'public' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

function setup() {
  expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261006 });
  const [p1, p2, p3] = state.players;
  p1!.masterCardId = ROOT; p1!.mana = 8; p1!.vp = 0; p1!.locationId = 'magic_workshop';
  p2!.mana = 8; p2!.vp = 5; p2!.locationId = 'magic_workshop';
  p3!.mana = 8; p3!.vp = 1; p3!.locationId = 'miyama_town';
  state.round.roundNumber = 3; state.round.activePhase = 'action'; state.round.prioritySeat = p1!.seat;
  return { state, s1: add(state, S1), s1a: add(state, S1A), asc: add(state, ASC) };
}

function battleResult(state: GameState, winners: string[], loserIds: string[], battlefieldId = 'battlefield_a') {
  const resultId = `result-${state.abilityRuntime!.revision}-${battlefieldId}`;
  rules.processAbilityEvent(state, {
    id: resultId,
    type: 'after_battle_result_determined',
    battlePhaseResolutionId: `battle-phase:${state.round.roundNumber}`,
    battleId: `battle-${state.abilityRuntime!.revision}`,
    resultId,
    battlefieldId,
    battleResult: { winners, loserIds },
    battleParticipantIds: [...new Set([...winners, ...loserIds])],
  });
}

function loss(state: GameState, winners = ['p2', 'p3']) {
  battleResult(state, winners, ['p1']);
}

describe('P3 Celenike owner-complete migration', () => {
  it('materializes exactly the frozen three-identity owner scope with locked static metadata', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('赛蕾妮可·艾斯科');
    expect(raw.publicInformation).toEqual({ type: 'master_package', initialMana: 4 });
    expect(raw.cards.map((entry: any) => entry.id).sort()).toEqual([...IDS].sort());
    expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());
    expect(card(S1).cardFace).toMatchObject({ typeLabel: '被动', cost: 0, basePower: 0 });
    expect(card(S1A).cardFace).toMatchObject({ typeLabel: '被动', cost: 0, basePower: 0 });
    expect(card(ASC).cardFace).toMatchObject({ typeLabel: '魔术', attributes: ['魔术'], cost: 6, basePower: 9 });
    expect(card(ASC).playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 6 }]);
    expect(raw.cards.find((entry: any) => entry.id === ASC).initialPlacement).toBe('outside_game');
  });

  it('consumes only the accepted battle-wither readiness family and one shared exact statusKey', () => {
    const effects = IDS.flatMap((id) => card(id).abilities.flatMap((ability) => ability.effects));
    expect(effects.map((effect) => effect.type).sort()).toEqual([
      'battle_wither_apply_to_winners',
      'battle_wither_steal_from_participants',
      'location_battle_end_resource_adjustment',
      'wither_pain_stake_action',
    ].sort());
    const statusKeys = effects.filter((effect: any) => 'statusKey' in effect).map((effect: any) => effect.statusKey);
    expect(statusKeys).toEqual([STATUS, STATUS, STATUS]);
  });

  it('integrates Celenike exactly once after Caules in the canonical playtest master sequence', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    const index = pack.authoringMasterFiles.indexOf(PATH);
    expect(pack.authoringMasterFiles[index - 1]).toBe('data/authoring/masters/master.caules.json');
  });

  it('applies canonical Wither on loss and steals actual up-to-two VP from matching participants on a later win', () => {
    const { state } = setup();
    loss(state);
    expect(rules.isPlayerBattleWithered(state, 'p2', STATUS)).toBe(true);
    expect(rules.isPlayerBattleWithered(state, 'p3', STATUS)).toBe(true);
    battleResult(state, ['p1'], ['p2', 'p3']);
    expect(state.players.slice(0, 3).map((player) => player.vp)).toEqual([3, 3, 0]);
  });

  it('runs canonical Pain Stake sequentially with target-owned mandatory choices', () => {
    const { state, asc } = setup();
    loss(state);
    state.players[1]!.mana = 5;
    state.players[2]!.mana = 1;
    const h1 = add(state, 'fixture.celenike.hand-a', 'p3', 'hand');
    const h2 = add(state, 'fixture.celenike.hand-b', 'p3', 'hand');
    state.abilityRuntime!.pack.cards['fixture.celenike.hand-a'] = { ...structuredClone(card(S1)), id: 'fixture.celenike.hand-a', abilities: [] } as any;
    state.abilityRuntime!.pack.cards['fixture.celenike.hand-b'] = { ...structuredClone(card(S1)), id: 'fixture.celenike.hand-b', abilities: [] } as any;

    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'activate_ability', cardInstanceId: asc, abilityId: 'celenike.ascension.pain-stake',
    }).ok).toBe(true);
    const p2 = rules.projectAbilityState(state, 'p2').pendingDecision!;
    expect(p2.candidates).toEqual(['pay_mana', 'discard_all']);
    expect(rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: p2.id, selectedIds: ['pay_mana'] }).ok).toBe(true);
    expect(state.players[1]!.mana).toBe(3);
    const p3 = rules.projectAbilityState(state, 'p3').pendingDecision!;
    expect(p3.candidates).toEqual(['discard_all']);
    expect(rules.dispatchAbilityCommand(state, 'p3', { type: 'choose_target', decisionId: p3.id, selectedIds: ['discard_all'] }).ok).toBe(true);
    expect(state.cards.find((entry) => entry.instanceId === h1)!.zone).toBe('discard');
    expect(state.cards.find((entry) => entry.instanceId === h2)!.zone).toBe('discard');
  });

  it('settles canonical indulgence only at Magic Workshop with mana cap and VP floor', () => {
    const { state } = setup();
    state.players[0]!.mana = 11; state.players[0]!.vp = 1;
    rules.processAbilityEvent(state, { id: 'battle-phase:3:end', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:3' });
    expect([state.players[0]!.mana, state.players[0]!.vp]).toEqual([12, 0]);

    const elsewhere = setup();
    elsewhere.state.players[0]!.locationId = 'miyama_town'; elsewhere.state.players[0]!.mana = 5; elsewhere.state.players[0]!.vp = 3;
    rules.processAbilityEvent(elsewhere.state, { id: 'battle-phase:3:end', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:3' });
    expect([elsewhere.state.players[0]!.mana, elsewhere.state.players[0]!.vp]).toEqual([5, 3]);
  });

  it('keeps production runtime authority identity/text-free', () => {
    const production = [
      'packages/rules/src/ability/battle-wither-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
    ].map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();
    for (const needle of ['master.celenike', '赛蕾妮可', '宵泣之铁桩', '诅咒师', '纵欲', 'core.celenike-']) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });
});
