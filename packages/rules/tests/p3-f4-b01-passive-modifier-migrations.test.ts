import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AbilityDefinitionPack, AbilityEvent, ExecutableCardDefinition, GameState } from '../src/ability/types';

const SHINTO = 'shinto';
const TARGETS = [
  'servant.mechaeli.skill.sc-mechaeli-2',
  'servant.atalanta.skill.sc-atalanta-1',
  'servant.gorgon.skill.sc-gorgon-2',
  'servant.ibaraki.skill.sc-ibaraki-1',
] as const;

function loadBatchPack(): AbilityDefinitionPack {
  const cards: Record<string, ExecutableCardDefinition> = {};
  for (const file of [
    'data/authoring/servants/servant.mechaeli.json',
    'data/authoring/servants/servant.atalanta.json',
    'data/authoring/servants/servant.gorgon.json',
    'data/authoring/servants/servant.ibaraki.json',
  ]) {
    const archive = JSON.parse(readFileSync(file, 'utf8'));
    const loaded = rules.loadAuthoringJson(archive);
    expect(loaded.report).toEqual([]);
    for (const card of Object.values(loaded.cards)) {
      cards[card.id] = {
        ...card,
        ownerId: archive.id,
        playKind: ['servant_skill', 'servant_deck_card', 'servant_attack', 'basic_attack', 'master_deck_card'].includes(card.cardType) ? 'attack' : 'support',
        destinationZone: ['servant_skill', 'servant_deck_card', 'servant_attack', 'basic_attack', 'master_deck_card'].includes(card.cardType) ? 'attack_area' : 'field',
      } as ExecutableCardDefinition;
    }
  }
  cards['fixture.other.attack'] = {
    id: 'fixture.other.attack', name: 'Other', cardType: 'basic_attack', ownerId: 'servant.other',
    cardFace: { typeLabel: 'fixture', cost: 1, basePower: 2, attributes: ['力量'] },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
    mode: 'automatic', playKind: 'attack', destinationZone: 'attack_area',
  } as ExecutableCardDefinition;
  return { cards };
}

function stateWith(cards: GameState['cards']): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = cards;
  for (const player of state.players) player.locationId = SHINTO;
  state.round.activePhase = 'action';
  rules.initializeAbilityRuntime(state, loadBatchPack());
  for (const card of cards) {
    state.abilityRuntime!.cardState[card.instanceId] = {
      active: ['attack_area', 'field'].includes(card.zone), faceDown: false,
    };
  }
  return state;
}

function physical(instanceId: string, definitionId: string, controller = 'p1', zone: GameState['cards'][number]['zone'] = 'attack_area') {
  return { instanceId, definitionId, ownerPlayerId: controller, controllerPlayerId: controller, zone, visibility: { scope: 'public' as const } };
}

function trustedBattleResult(participants: string[], winners: string[], loserIds: string[]): AbilityEvent {
  const id = 'battle-phase:1:battle:shinto:1:result';
  return {
    id, type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:1',
    battleId: 'battle-phase:1:battle:shinto:1', resultId: id, battlefieldId: SHINTO,
    battleParticipantIds: participants,
    battleParticipantPowers: Object.fromEntries(participants.map((playerId, index) => [playerId, index + 1])),
    battleResult: { winners, loserIds },
  };
}

describe('P3 F4 B01 passive/modifier migration batch', () => {
  it('loads all four real migrated definitions with zero adapter issues', () => {
    const pack = loadBatchPack();
    for (const id of TARGETS) expect(pack.cards[id]).toBeDefined();
    expect(rules.isAcceptedRoundActiveAttackPaidCostCombatPowerAbility(pack.cards[TARGETS[3]]!.abilities[0] as any, 'compiled')).toBe(true);
  });

  it('executes Mechaeli s2 through the accepted FB2-54 entry and uncontested-win routes', () => {
    const sourceId = 'mechaeli-s2';
    const state = stateWith([physical(sourceId, TARGETS[0])]);
    expect(rules.calculateCardPower(state, sourceId).value).toBe(13);
    rules.processAuthoritativeEntryAbilityEvent(state, {
      id: 'enter-p2', type: 'after_controller_enters_location', playerId: 'p2', locationId: SHINTO,
    });
    expect(rules.calculateCardPower(state, sourceId).value).toBe(15);
    state.players[0]!.vp = 1;
    rules.processAbilityEvent(state, trustedBattleResult(['p1'], ['p1'], []));
    expect(state.players[0]!.vp).toBe(5);
  });

  it('applies Atalanta s1 +4 power, printed-power mana surcharge, and s3 skill-use forbid only while the source is active', () => {
    const boar = 'atalanta-s1'; const appeal = 'atalanta-s2'; const independent = 'atalanta-s3';
    const state = stateWith([
      physical(boar, TARGETS[1]),
      physical(appeal, 'servant.atalanta.skill.sc-atalanta-2', 'p1', 'hand'),
      physical(independent, 'servant.atalanta.skill.sc-atalanta-3'),
      physical('unrelated', 'fixture.other.attack', 'p1', 'hand'),
    ]);
    state.players[0]!.mana = 8;
    expect(rules.calculateCardPower(state, appeal).value).toBe(8); // printed 4 +4
    expect(rules.calculateCardPower(state, 'unrelated').value).toBe(2);
    expect(rules.getLegalActions(state, 'p1').some((action) => action.type === 'activate_ability' && action.cardInstanceId === independent)).toBe(false);
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: appeal }]);
    expect(state.players[0]!.mana).toBe(2); // printed cost 2 + printed Power 4
    expect(state.abilityRuntime!.cardState[appeal]!.paidManaOnPlay).toBe(6);

    const inactive = stateWith([
      physical(boar, TARGETS[1]),
      physical(appeal, 'servant.atalanta.skill.sc-atalanta-2', 'p1', 'hand'),
      physical(independent, 'servant.atalanta.skill.sc-atalanta-3'),
    ]);
    inactive.abilityRuntime!.cardState[boar]!.active = false;
    expect(rules.calculateCardPower(inactive, appeal).value).toBe(4);
    expect(rules.getLegalActions(inactive, 'p1').some((action) => action.type === 'activate_ability' && action.cardInstanceId === independent)).toBe(true);
  });

  it('enforces Gorgon s2 solo play and ignores real battle-loss effects while active', () => {
    const gorgon = 'gorgon-s2';
    const play = stateWith([
      physical(gorgon, TARGETS[2], 'p1', 'hand'),
      physical('other-hand', 'fixture.other.attack', 'p1', 'hand'),
    ]);
    play.players[0]!.mana = 10;
    expect(() => rules.playAbilityCardBatch(play, 'p1', [{ cardInstanceId: gorgon }, { cardInstanceId: 'other-hand' }])).toThrow(/played alone/);
    expect(play.players[0]!.mana).toBe(10);
    rules.playAbilityCardBatch(play, 'p1', [{ cardInstanceId: gorgon }]);
    expect(play.cards.find((card) => card.instanceId === gorgon)!.zone).toBe('attack_area');

    const battle = rules.resolveBattlefield(play, {
      battlefieldId: SHINTO,
      participants: [
        { playerId: 'p1', totalPower: 1 },
        { playerId: 'p2', totalPower: 7 },
      ],
    }).nextState;
    const result = battle.battleResults.at(-1)!;
    expect(result.winnerPlayerIds).toEqual(['p2']);
    expect(result.lossEffectSuppressedPlayerIds).toContain('p1');
    expect(result.militaryAdjustments.find((entry) => entry.playerId === 'p1')?.delta).toBe(0);
  });

  it('closes active Gorgon s2 after a trusted battle against at least two opponents, but not for one opponent', () => {
    const one = stateWith([physical('gorgon-one', TARGETS[2])]);
    rules.processAbilityEvent(one, trustedBattleResult(['p1', 'p2'], ['p2'], ['p1']));
    expect(one.abilityRuntime!.cardState['gorgon-one']!.active).toBe(true);

    const crowded = stateWith([physical('gorgon-crowded', TARGETS[2])]);
    rules.processAbilityEvent(crowded, trustedBattleResult(['p1', 'p2', 'p3'], ['p3'], ['p1', 'p2']));
    expect(crowded.abilityRuntime!.cardState['gorgon-crowded']!.active).toBe(false);
  });

  it('fails closed on widened reserved batch vocabulary instead of silently enabling it', () => {
    const raw = JSON.parse(readFileSync('data/authoring/servants/servant.gorgon.json', 'utf8'));
    raw.cards[0].abilities[2].conditions[2].count = 1;
    expect(rules.loadAuthoringJson(raw).report.some((entry) => entry.path.includes('batchPassive.gateway') || entry.reason.includes('literal count 2'))).toBe(true);

    const atalanta = JSON.parse(readFileSync('data/authoring/servants/servant.atalanta.json', 'utf8'));
    const s1 = atalanta.cards.find((card: any) => card.id === TARGETS[1]);
    s1.abilities[0].ruleModifiers[2].value = { type: 'target_printed_base_power', widened: true };
    expect(rules.loadAuthoringJson(atalanta).report.some((entry) => entry.cardId === TARGETS[1])).toBe(true);
  });
});
