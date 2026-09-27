import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { playerCombatTotalPowerAdjustment } from '../../src/ability/owner-self-mechanics';
import { deriveBattleParticipantsFromState } from '../../src/core/combat-resolver';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { AbilityEvent } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';

const ARCHIVE = 'data/authoring/servants/servant.spartacus.json';
const ROOT = 'servant.spartacus';
const SC1 = `${ROOT}.skill.sc-spartacus-1`;
const SC2 = `${ROOT}.skill.sc-spartacus-2`;
const SC3 = `${ROOT}.skill.sc-spartacus-3`;
const SC1_TEXT = '【真名解放】发起叛逆-战斗阶段：每有一名于本回合使用了令咒或【裁决者令咒】的交战对手，你获得（6-2X）合计威力。X为你拥有的令咒数量。';
const SC2_TEXT = '受虐之荣光-战斗阶段：战斗后获得X点战果，X为与你交战的任意一名对手的合计威力的五分之一（向下取整）。';
const SC3_TEXT = '被动：你的令咒，以及你拥有或由你分发的【裁决者令咒】的效果均更改为：“斯巴达克斯获得+4合计威力”。被动/行动阶段：你的所有交战对手每拥有一枚未被使用的令咒或【裁决者令咒】，你便获得+1合计威力（【裁决者令咒】为分发者拥有）。';
const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');

function rawArchive(): any { return JSON.parse(readFileSync(ARCHIVE, 'utf8')); }
function setup(mana = 20) {
  const raw = rawArchive();
  const pack = rules.loadAuthoringJson(raw);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.players[0]!.servantCardId = ROOT;
  state.players[0]!.mana = mana;
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'recon';
  for (const player of state.players) (player as any).commandSpells = 3;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260928 });
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  return { raw, pack, state };
}
function add(state: GameState, definitionId: string, zone = 'skill', active = false, owner = 'p1') {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['attack_area', 'field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner },
  });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function action(state: GameState, source: string, abilityId: string) {
  return rules.getLegalActions(state, 'p1').find((entry) =>
    entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === abilityId);
}
function activate(state: GameState, source: string, abilityId: string) {
  const legal = action(state, source, abilityId);
  expect(legal).toBeTruthy();
  const out = rules.dispatchAbilityCommand(state, 'p1', legal!);
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
  return out;
}
function rootEvent(state: GameState, powers: Record<string, number> = { p1: 7, p2: 14, p3: 24 }): AbilityEvent {
  const phaseId = `battle-phase:${state.round.roundNumber}`;
  const battleId = `${phaseId}:battle:shinto:1`;
  const resultId = `${battleId}:result`;
  return {
    id: resultId, type: 'after_battle_result_determined', battlePhaseResolutionId: phaseId, battleId, resultId,
    battlefieldId: 'shinto', battleParticipantIds: ['p1', 'p2', 'p3'], battleParticipantPowers: { ...powers },
    battleResult: { winners: ['p3'], loserIds: ['p1', 'p2'] },
  };
}
function bind(state: GameState, id: string, issuer: string, bound: string) {
  state.abilityRuntime!.rulerSealBindings.push({
    id, issuerPlayerId: issuer, boundPlayerId: bound,
    sourceCardId: 'formal-fixture-ruler-source', abilityId: 'formal-fixture-ruler-grant',
    grantedRound: state.round.roundNumber, spent: false,
  });
  const history = state.abilityRuntime!.rulerSealBindingHistory[issuer] ??= {};
  history[bound] = (history[bound] ?? 0) + 1;
}

describe('P3 owner-complete Spartacus migration', () => {
  it('loads exactly sc1 + preservation sc2 + sc3 with locked static metadata, source hashes, and 12-card deck', () => {
    const { raw, pack } = setup();
    expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    expect(raw).toMatchObject({ id: ROOT, name: '斯巴达克斯', class: 'Berserker' });
    expect(raw.cards.map((card: any) => card.id)).toEqual([SC1, SC2, SC3]);
    expect(raw.cards.map((card: any) => [card.name, card.cardFace.typeLabel, card.cardFace.cost, card.cardFace.basePower])).toEqual([
      ['反叛', '力量', 4, 6], ['伤兽的咆哮', '宝具', 3, 4], ['不屈的意志', '被动', 0, 0],
    ]);
    expect(raw.cards.map((card: any) => card.playRequirements)).toEqual([
      [{ type: 'skill_zone_mana_at_least', value: 4 }],
      [{ type: 'skill_zone_mana_at_least', value: 8 }],
      [],
    ]);
    const deck = raw.deck.flatMap((entry: any) => Array(entry.count ?? 1).fill(entry.cardId));
    expect(deck).toEqual([
      'card.cardb1','card.cardb2','card.cardb4','card.cardb4','card.cardb4','card.cardb5','card.cardb5','card.cardb6',
      'card.cardq1','card.cardq1','card.cardq2','card.cardluck',
    ]);
    expect(raw.cards[0].printedText).toBe(SC1_TEXT);
    expect(raw.cards[1].printedText).toBe(SC2_TEXT);
    expect(raw.cards[2].printedText).toBe(SC3_TEXT);
    expect(sha(raw.cards[0].printedText)).toBe('c86e6d655017cfdf5d852c81720de191cd2be88c5c43d99c519cdcf39d196416');
    expect(sha(raw.cards[1].printedText)).toBe('cc5be3d123f96a8199e6c07bdae9161b93829c7b52cab2e838cb2a19b592996e');
    expect(sha(raw.cards[2].printedText)).toBe('9029821ed97e10ed2a58a64b308bf1b835a6dfef0057d864a90c795576195df7');
  });

  it('binds sc1/sc3 only through accepted seal-power shells and preserves the accepted FB2-48 sc2 whole ability', () => {
    const { pack } = setup();
    const sc1 = pack.cards[SC1]!;
    const sc2 = pack.cards[SC2]!;
    const sc3 = pack.cards[SC3]!;
    expect(sc1.abilities.find((ability) => ability.id === 'sc-spartacus-1.rebellion-combat')).toSatisfy(rules.isAcceptedEngagedSealUserFormulaPowerAbility);
    expect(rules.isAcceptedCombatOpponentPowerVpRewardAbility(sc2.abilities.find((ability) => ability.id === 'wounded-beast-roar-reward')!, 'compiled')).toBe(true);
    expect(sc3.abilities.find((ability) => ability.id === 'free-spirit-use-command-seal')).toSatisfy(rules.isAcceptedNormalSealPowerReplacementAbility);
    expect(sc3.abilities.find((ability) => ability.id === 'free-spirit-use-ruler-seal')).toSatisfy(rules.isAcceptedRulerSealPowerReplacementAbility);
    expect(sc3.abilities.find((ability) => ability.id === 'free-spirit-unused-seal-aura')).toSatisfy(rules.isAcceptedUnusedEngagedSealPowerAbility);
  });

  it('plays sc1 only at the locked 4-mana threshold/cost, reveals true name, and wires the engaged seal-user formula', () => {
    const low = setup(3); const lowSource = add(low.state, SC1);
    expect(rules.dispatchAbilityCommand(low.state, 'p1', { type: 'play_card', cardInstanceId: lowSource }).ok).toBe(false);
    expect(low.state.players[0]!.mana).toBe(3);

    const { state } = setup(4); const source = add(state, SC1);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: source }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(0);
    expect(state.cards.find((card) => card.instanceId === source)!.zone).toBe('attack_area');
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    (state.players[0] as any).commandSpells = 2;
    rules.markNormalCommandSealUsedThisRound(state, 'p2');
    state.round.activePhase = 'combat';
    activate(state, source, 'sc-spartacus-1.rebellion-combat');
    expect(rules.engagedSealUserIdsThisRound(state, 'p1')).toEqual(['p2']);
    expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(2);
  });

  it('preserves historical sc2 play threshold/cost and frozen-opponent floor(power/5) settlement', () => {
    const low = setup(7); const lowSource = add(low.state, SC2);
    expect(rules.dispatchAbilityCommand(low.state, 'p1', { type: 'play_card', cardInstanceId: lowSource }).ok).toBe(false);
    expect(low.state.players[0]!.mana).toBe(7);

    const { state } = setup(8); const source = add(state, SC2);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: source }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(5);
    state.round.activePhase = 'battle';
    state.players[2]!.locationId = 'shinto';
    state.players[0]!.vp = 1;
    rules.processAbilityEvent(state, rootEvent(state));
    const pending = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(pending).toMatchObject({ min: 1, max: 1, candidates: ['p2', 'p3'], visibility: 'owner_only', cancelPolicy: 'forbidden' });
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: ['p3'] }).ok).toBe(true);
    expect(state.players[0]!.vp).toBe(5);
  });

  it('wires sc3 normal-seal replacement as a repeatable physical +4 current-round resource', () => {
    const { state } = setup(); const source = add(state, SC3);
    activate(state, source, 'free-spirit-use-command-seal');
    expect((state.players[0] as any).commandSpells).toBe(2);
    expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(4);
    activate(state, source, 'free-spirit-use-command-seal');
    expect((state.players[0] as any).commandSpells).toBe(1);
    expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(8);
    state.round.roundNumber += 1;
    expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(0);
  });

  it('wires sc3 issuer-owned Ruler replacement to exact private selection when multiple seals remain', () => {
    const { state } = setup(); const source = add(state, SC3);
    bind(state, 'seal-b', 'p1', 'p3'); bind(state, 'seal-a', 'p1', 'p2');
    activate(state, source, 'free-spirit-use-ruler-seal');
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.candidates).toEqual(['seal-a', 'seal-b']);
    expect(pending.interaction).toMatchObject({ kind: 'owned_ruler_seal_power_v1', issuerPlayerId: 'p1', amount: 4, visibility: 'owner_only', cancelPolicy: 'forbidden' });
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: ['seal-b'] }).ok).toBe(true);
    expect(state.abilityRuntime!.rulerSealBindings.find((entry) => entry.id === 'seal-b')?.spent).toBe(true);
    expect(state.abilityRuntime!.rulerSealBindings.find((entry) => entry.id === 'seal-a')?.spent).toBe(false);
    expect(playerCombatTotalPowerAdjustment(state, 'p1')).toBe(4);
  });

  it('wires sc3 live unused-seal aura into authoritative battle total and excludes a far opponent', () => {
    const { state } = setup(); const source = add(state, SC3);
    (state.players[1] as any).commandSpells = 2;
    (state.players[2] as any).commandSpells = 3;
    bind(state, 'p2-owned', 'p2', 'p1');
    bind(state, 'p3-far-owned', 'p3', 'p1');
    activate(state, source, 'free-spirit-unused-seal-aura');
    expect(rules.dynamicUnusedEngagedSealPowerAdjustment(state, 'p1')).toBe(3);
    const participant = deriveBattleParticipantsFromState(state, 'shinto').find((entry) => entry.playerId === 'p1')!;
    expect(participant.totalPower).toBe(3);
    (state.players[1] as any).commandSpells = 1;
    expect(rules.dynamicUnusedEngagedSealPowerAdjustment(state, 'p1')).toBe(2);
  });

  it('keeps owner-complete material exactly once and outside product/generated outputs', () => {
    const manifest = readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8');
    const generated = readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8');
    for (const id of [SC1, SC2, SC3]) {
      expect(manifest).not.toContain(id);
      expect(generated).not.toContain(id);
    }
    const raw = rawArchive();
    expect(raw.cards.filter((card: any) => [SC1, SC2, SC3].includes(card.id)).map((card: any) => card.id)).toEqual([SC1, SC2, SC3]);
    expect(new Set(raw.cards.map((card: any) => card.id)).size).toBe(3);
  });
});