import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.shirou-emiya';
const PATH = 'data/authoring/masters/master.shirou-emiya.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;
const IDS = ['ascension', 's1', 's2', 's3'].map((skill) => `${ROOT}.skill.${skill}`);

function setup(): { state: GameState; loaded: ReturnType<typeof rules.loadAuthoringJson> } {
  const loaded = rules.loadAuthoringJson(archive);
  expect(loaded.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.masterCardId = ROOT;
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  for (const definition of Object.values(loaded.cards) as Array<any>) definition.ownerId = ROOT;
  for (const [id, attribute] of [['basic.力量.3', '力量'], ['basic.特殊.3', '特殊']] as const) {
    (loaded.cards as any)[id] = { id, name: id, cardType: 'basic_attack', cardFace: { attributes: [attribute], cost: 0, basePower: 3 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic', playKind: 'attack', destinationZone: 'attack_area' };
  }
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261020 });
  return { state, loaded };
}
function addCard(state: GameState, definitionId: string, zone = 'skill'): string {
  const instanceId = `shirou:${definitionId.split('.').at(-1)}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone, visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
  state.abilityRuntime!.cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

describe('P3 Shirou-Emiya owner migration boundary', () => {
  it('keeps the four frozen identities, canonical text, clause evidence, and support registration', () => {
    const { loaded } = setup();
    expect(archive.cards.map((card: any) => card.id)).toEqual([...IDS, 'card.derived.master.shirou-emiya.ganjiang-moye']);
    expect(Object.keys(loaded.cards).filter((id) => id.startsWith(ROOT) || id.startsWith('card.derived.master.shirou-emiya')).sort()).toEqual([...IDS, 'card.derived.master.shirou-emiya.ganjiang-moye'].sort());
    expect(archive.cards.slice(0, 4).map((card: any) => card.printedText)).toEqual([
      '（升华技，将此牌加入你的技能区）\n被动：你的力量和迅捷属性的基本牌威力+2。\n战斗阶段：此攻击在高潮回合威力+4。',
      '你的魔力初始值为2。', '将【干将·莫邪】加入你的技能区。', '当你首次被淘汰时你将失去所有的魔力来继续游戏。',
    ]);
    expect(archive.cards[0].phase3Evidence.f1ClauseSources.map((entry: any) => entry.sha256)).toEqual([
      '764186a6e18e6809aae2fac1606962feda161ba0f7e5a91e9d5a2a4575f2d0f2',
      'f80414966e618722d387d23acd74860813968a84cea28b632589c8e7e9434a98',
      'dbfd83c5781d8d3dc7d8ada3e9b01566125e147dc6ef7580d6d247e23c75fa65',
    ]);
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterSupportFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    expect(loaded.cards[`${ROOT}.skill.ascension`]!.mode).toBe('automatic');
  });

  it('applies S1 and projection game-start contracts exactly once', () => {
    const { state } = setup();
    const s1 = addCard(state, `${ROOT}.skill.s1`);
    const s2 = addCard(state, `${ROOT}.skill.s2`);
    state.players[0]!.mana = 7;
    rules.processAbilityEvent(state, { id: 'shirou-game-start', type: 'game_start', playerId: 'p1' });
    expect(state.players[0]!.mana).toBe(2);
    expect(state.cards.filter((card) => card.definitionId === 'card.derived.master.shirou-emiya.ganjiang-moye')).toHaveLength(1);
    expect(state.cards.find((card) => card.definitionId === 'card.derived.master.shirou-emiya.ganjiang-moye')).toMatchObject({ zone: 'skill', generatedBy: s2 });
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'mana_adjusted', sourceCardId: s1 }));
    rules.processAbilityEvent(state, { id: 'shirou-game-start-replay', type: 'game_start', playerId: 'p1' });
    expect(state.cards.filter((card) => card.definitionId === 'card.derived.master.shirou-emiya.ganjiang-moye')).toHaveLength(1);
  });

  it('applies ascension power bonuses from the live skill source and climax state', () => {
    const { state } = setup();
    addCard(state, `${ROOT}.skill.ascension`);
    const attack = addCard(state, 'basic.力量.3', 'attack_area');
    expect(rules.calculateCardPower(state, attack).value).toBe(5);
    (state as any).modeState = { currentSituationIsClimax: true };
    expect(rules.calculateCardPower(state, attack).value).toBe(9);
    const special = addCard(state, 'basic.特殊.3', 'attack_area');
    expect(rules.calculateCardPower(state, special).value).toBe(7);
  });

  it('clears mana and restores play on the first authoritative elimination only', () => {
    const { state } = setup();
    const source = addCard(state, `${ROOT}.skill.s3`);
    state.players[0]!.status = 'eliminated';
    state.players[0]!.mana = 6;
    state.players[0]!.militaryResult = -9;
    const event = { id: 'shirou-result-1', type: 'after_battle_result_determined', battlePhaseResolutionId: 'phase-1', battleId: 'battle-1', resultId: 'shirou-result-1', battlefieldId: 'loc-1', battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p2'], loserIds: ['p1'] } } as const;
    rules.processAbilityEvent(state, event);
    expect(state.players[0]).toMatchObject({ status: 'active', mana: 0, militaryResult: -8 });
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'shirou_emiya_avalon_continued', sourceCardId: source, delta: -6 }));
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer?.p1?.['shirou_emiya.avalon.first_elimination_used']).toBe(true);
    state.players[0]!.status = 'eliminated';
    state.players[0]!.mana = 4;
    rules.processAbilityEvent(state, { ...event, id: 'shirou-result-2', resultId: 'shirou-result-2' });
    expect(state.players[0]!.mana).toBe(4);
  });

  it('publishes automatic generated rule/source-map evidence for all four skills', () => {
    const library = JSON.parse(readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8')) as any;
    for (const id of IDS) {
      expect(library.rules.cards[id].mode).toBe('automatic');
      expect(library.rules.sourceMap[id]).toBeDefined();
    }
    expect(library.rules.cards[`${ROOT}.skill.s2`].abilities[0].effects[0].type).toBe('provision_skill_cards');
  });
});
