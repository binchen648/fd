import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import {
  dispatchAbilityCommand,
  getLegalActions,
  initializeAbilityRuntime,
  processAbilityEvent,
} from '../../src/ability/interpreter';
import {
  isManaGainSuppressed,
  isNormalCardDrawSuppressed,
} from '../../src/ability/timed-resource-suppression';
import { grantMana } from '../../src/core/rule-overrides';
import type { AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';

const archivePath = 'data/authoring/servants/servant.sitonai.json';
const ROOT = 'servant.sitonai';
const SC1 = `${ROOT}.skill.sc-sitonai-1`;
const SC2 = `${ROOT}.skill.sc-sitonai-2`;
const SC3 = `${ROOT}.skill.sc-sitonai-3`;

function rawArchive() { return JSON.parse(readFileSync(archivePath, 'utf8')); }
function setup() {
  const raw = rawArchive();
  const pack = loadAuthoringJson(raw);
  const state = createSeededGameState();
  state.cards = [];
  state.players[0]!.servantCardId = ROOT;
  state.players[0]!.mana = 30;
  state.players[0]!.vp = 10;
  initializeAbilityRuntime(state, pack, { seed: 20260927 });
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  return { raw, pack, state };
}

function addCard(state: GameState, definitionId: string, zone = 'skill', active = false, owner = 'p1') {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field', 'attack_area', 'removed_from_game'].includes(zone)
      ? { scope: 'public' }
      : { scope: 'owner_only', ownerPlayerId: owner },
  });
  state.abilityRuntime!.cardState[instanceId] = {
    active,
    faceDown: false,
    playedRound: Math.max(0, state.round.roundNumber - 1),
  };
  return state.cards[state.cards.length - 1]!;
}

function addAttack(state: GameState, id: string, attributes: string[]) {
  const def: AuthoringCard = {
    id, name: id, cardType: 'basic_attack',
    cardFace: { attributes, cost: 0, basePower: 2 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities: [], mode: 'automatic',
  };
  state.abilityRuntime!.pack.cards[id] = def;
  return addCard(state, id, 'attack_area', true);
}

function action(state: GameState, cardInstanceId: string, abilityId: string) {
  return getLegalActions(state, 'p1').find((entry) =>
    entry.type === 'activate_ability' && entry.cardInstanceId === cardInstanceId && entry.abilityId === abilityId);
}

describe('P3 owner-complete Sitonai migration', () => {
  it('loads both remaining frozen consumers with exact static metadata while preserving accepted sc-sitonai-3', () => {
    const { raw, pack } = setup();
    expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    expect(raw.cards.map((card: any) => card.id)).toEqual([SC1, SC2, SC3]);
    expect(raw.cards.map((card: any) => [card.name, card.cardFace.typeLabel, card.cardFace.cost, card.cardFace.basePower, card.playRequirements[0]?.value])).toEqual([
      ['连携打击', '力量/魔术', 1, 5, 8],
      ['冻结吧，天上的诸力', '魔术/宝具', 5, 7, 8],
      ['他人格（Alter Ego Class）', '被动', 2, 3, 8],
    ]);
    expect(pack.cards[SC3]?.abilities.map((ability) => ability.id)).toContain('sc-sitonai-3.alter-ego-transform');
  });

  it('fails closed when either accepted privileged consumer shell is widened', () => {
    const join = rawArchive();
    join.cards[0].abilities[1].effects[0].extra = 'near-match';
    expect(loadAuthoringJson(join).report.some((entry) => entry.abilityId === 'sc-sitonai-1.combination-join' && entry.status === 'unsupported')).toBe(true);

    const suppress = rawArchive();
    suppress.cards[1].abilities[1].effects[0].extra = 'near-match';
    expect(loadAuthoringJson(suppress).report.some((entry) => entry.abilityId === 'sc-sitonai-2.freeze-draw' && entry.status === 'unsupported')).toBe(true);
  });

  it('joins sc-sitonai-1 only for the exact distinct Strength/Magic pair and pays ability mana without becoming a card play', () => {
    const { state } = setup();
    const source = addCard(state, SC1, 'skill', false);
    addAttack(state, 'basic.sitonai-strength', ['力量']);
    addAttack(state, 'basic.sitonai-magic', ['魔术']);
    const beforeMana = state.players[0]!.mana;
    const beforePlayCount = state.abilityRuntime!.cardPlayCountByInstance?.[source.instanceId] ?? 0;
    const beforePlayedRound = state.abilityRuntime!.cardState[source.instanceId]!.playedRound;
    const legal = action(state, source.instanceId, 'sc-sitonai-1.combination-join');
    expect(legal).toBeTruthy();
    expect(dispatchAbilityCommand(state, 'p1', legal!).ok).toBe(true);
    const live = state.cards.find((card) => card.instanceId === source.instanceId)!;
    const liveState = state.abilityRuntime!.cardState[source.instanceId]!;
    expect(state.players[0]!.mana).toBe(beforeMana - 3);
    expect(live.zone).toBe('attack_area');
    expect(live.visibility.scope).toBe('public');
    expect(liveState.active).toBe(true);
    expect(liveState.faceDown).toBe(false);
    expect(liveState.paidManaOnPlay).toBe(0);
    expect(liveState.playedRound).toBe(beforePlayedRound);
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[source.instanceId] ?? 0).toBe(beforePlayCount);

    const dual = setup();
    const dualSource = addCard(dual.state, SC1, 'skill', false);
    addAttack(dual.state, 'basic.sitonai-dual', ['力量', '魔术']);
    expect(action(dual.state, dualSource.instanceId, 'sc-sitonai-1.combination-join')).toBeFalsy();
  });

  it('grants exactly 4 VP on a reversed active sc-sitonai-1 win and not while unreversed', () => {
    const reversed = setup();
    const source = addCard(reversed.state, SC1, 'attack_area', true);
    reversed.state.abilityRuntime!.cardState[source.instanceId]!.reversed = true;
    processAbilityEvent(reversed.state, { id: 'sitonai-win-reversed', type: 'after_controller_wins_battle', playerId: 'p1' });
    expect(reversed.state.players[0]!.vp).toBe(14);

    const normal = setup();
    addCard(normal.state, SC1, 'attack_area', true);
    processAbilityEvent(normal.state, { id: 'sitonai-win-normal', type: 'after_controller_wins_battle', playerId: 'p1' });
    expect(normal.state.players[0]!.vp).toBe(10);
  });

  it('reveals Sitonai when sc-sitonai-2 is declared', () => {
    const { state } = setup();
    const source = addCard(state, SC2, 'skill', false);
    expect(state.abilityRuntime!.revealedServants).not.toContain('p1');
    expect(dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: source.instanceId }).ok).toBe(true);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
  });

  it('branches sc-sitonai-2 suppression from physical reversal state and expires after the next round', () => {
    const normal = setup();
    const normalSource = addCard(normal.state, SC2, 'attack_area', true);
    const drawAction = action(normal.state, normalSource.instanceId, 'sc-sitonai-2.freeze-draw');
    expect(drawAction).toBeTruthy();
    expect(action(normal.state, normalSource.instanceId, 'sc-sitonai-2.freeze-mana-gain')).toBeFalsy();
    expect(dispatchAbilityCommand(normal.state, 'p1', drawAction!).ok).toBe(true);
    for (const player of normal.state.players.filter((entry) => entry.status === 'active')) {
      expect(isNormalCardDrawSuppressed(normal.state, player.id)).toBe(true);
      expect(isManaGainSuppressed(normal.state, player.id)).toBe(false);
    }
    normal.state.round.roundNumber += 1;
    expect(isNormalCardDrawSuppressed(normal.state, 'p1')).toBe(true);
    normal.state.round.roundNumber += 1;
    expect(isNormalCardDrawSuppressed(normal.state, 'p1')).toBe(false);

    const reversed = setup();
    const reversedSource = addCard(reversed.state, SC2, 'attack_area', true);
    reversed.state.abilityRuntime!.cardState[reversedSource.instanceId]!.reversed = true;
    const manaAction = action(reversed.state, reversedSource.instanceId, 'sc-sitonai-2.freeze-mana-gain');
    expect(action(reversed.state, reversedSource.instanceId, 'sc-sitonai-2.freeze-draw')).toBeFalsy();
    expect(manaAction).toBeTruthy();
    expect(dispatchAbilityCommand(reversed.state, 'p1', manaAction!).ok).toBe(true);
    for (const player of reversed.state.players.filter((entry) => entry.status === 'active')) {
      expect(isManaGainSuppressed(reversed.state, player.id)).toBe(true);
      expect(isNormalCardDrawSuppressed(reversed.state, player.id)).toBe(false);
    }
    reversed.state.players[0]!.mana = 0;
    expect(grantMana(reversed.state, 'p1', 4).actualAmount).toBe(0);
    reversed.state.round.roundNumber += 1;
    expect(grantMana(reversed.state, 'p1', 4).actualAmount).toBe(0);
    reversed.state.round.roundNumber += 1;
    expect(grantMana(reversed.state, 'p1', 4).actualAmount).toBe(4);
  });
});
