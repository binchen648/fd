import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import {
  calculateCardPower,
  dispatchAbilityCommand,
  getLegalActions,
  initializeAbilityRuntime,
} from '../../src/ability/interpreter';
import { isManaGainSuppressed } from '../../src/ability/timed-resource-suppression';
import { grantMana } from '../../src/core/rule-overrides';
import type { AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';

const archivePath = 'data/authoring/servants/servant.skadi.json';
const ROOT = 'servant.skadi';
const SC1 = `${ROOT}.skill.sc-skadi-1`;
const SC2 = `${ROOT}.skill.sc-skadi-2`;
const SC3 = `${ROOT}.skill.sc-skadi-3`;

function rawArchive() { return JSON.parse(readFileSync(archivePath, 'utf8')); }
function setup() {
  const raw = rawArchive();
  const pack = loadAuthoringJson(raw);
  const state = createSeededGameState();
  state.cards = [];
  state.players[0]!.servantCardId = ROOT;
  state.players[0]!.mana = 30;
  state.players[0]!.vp = 10;
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'recon';
  initializeAbilityRuntime(state, pack, { seed: 20260927 });
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  return { raw, pack, state };
}

function add(state: GameState, definitionId: string, zone = 'skill', active = false, owner = 'p1') {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['attack_area', 'field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner },
  });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return state.cards[state.cards.length - 1]!;
}

function addBasic(state: GameState, id: string, attributes: string[], owner = 'p1', basePower = 2) {
  const def: AuthoringCard = {
    id, name: id, cardType: 'basic_attack', cardFace: { attributes, cost: 0, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
  };
  state.abilityRuntime!.pack.cards[id] = def;
  return add(state, id, 'attack_area', true, owner);
}

function addHandAttack(state: GameState, id: string, cost = 2) {
  const def: AuthoringCard = {
    id, name: id, cardType: 'basic_attack', cardFace: { attributes: ['特殊'], cost, basePower: 2 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
  };
  state.abilityRuntime!.pack.cards[id] = def;
  return add(state, id, 'hand', false, 'p1');
}

function action(state: GameState, cardInstanceId: string, abilityId: string) {
  return getLegalActions(state, 'p1').find((entry) =>
    entry.type === 'activate_ability' && entry.cardInstanceId === cardInstanceId && entry.abilityId === abilityId);
}

function activate(state: GameState, sourceId: string, abilityId: string) {
  const legal = action(state, sourceId, abilityId);
  expect(legal).toBeTruthy();
  expect(dispatchAbilityCommand(state, 'p1', legal!).ok).toBe(true);
}

describe('P3 owner-complete Skadi migration', () => {
  it('loads the exact three-card owner archive, static metadata, and 12-card deck with no unsupported ability', () => {
    const { raw, pack } = setup();
    expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    expect(raw.cards.map((card: any) => card.id)).toEqual([SC1, SC2, SC3]);
    expect(raw.cards.map((card: any) => [card.name, card.cardFace.typeLabel, card.cardFace.cost, card.cardFace.basePower])).toEqual([
      ['大神的睿智', '被动', 0, 0],
      ['原初之卢恩', '被动', 0, 0],
      ['通往死亡满溢的魔境之门', '魔术/宝具', 10, 0],
    ]);
    const deck = raw.deck.flatMap((entry: any) => Array(entry.count ?? 1).fill(entry.cardId));
    expect(deck).toEqual([
      'card.cardq1', 'card.cardq2', 'card.cardq2', 'card.cardq4', 'card.carda2', 'card.carda2',
      'card.carda3', 'card.carda4', 'card.carda4', 'card.cardluck', 'card.cardluck', 'card.cardpreparation',
    ]);
  });

  it('keeps accepted privileged Skadi consumer shells fail closed when widened', () => {
    const postDraw = rawArchive();
    postDraw.cards[0].abilities[0].effects[0].extra = true;
    expect(loadAuthoringJson(postDraw).report.some((entry) => entry.abilityId === 'sc-skadi-1.wisdom-outpost' && entry.status === 'unsupported')).toBe(true);

    const isan = rawArchive();
    isan.cards[0].abilities.find((a: any) => a.id === 'sc-skadi-1.isan').conditions[0].extra = true;
    expect(loadAuthoringJson(isan).report.some((entry) => entry.abilityId === 'sc-skadi-1.isan' && entry.status === 'unsupported')).toBe(true);

    const castle = rawArchive();
    castle.cards[2].abilities.find((a: any) => a.id === 'sc-skadi-3.castle-power').targets[0].options.pop();
    expect(loadAuthoringJson(castle).report.some((entry) => entry.abilityId === 'sc-skadi-3.castle-power' && entry.status === 'unsupported')).toBe(true);
  });

  it('resolves the outpost wisdom boundary from exactly 1 mana into the private exact-two shuffle continuation', () => {
    const { state } = setup();
    state.round.activePhase = 'advance';
    state.players[0]!.mana = 1;
    const source = add(state, SC1, 'skill', false);
    addHandAttack(state, 'skadi.hand-a', 0);
    addHandAttack(state, 'skadi.hand-b', 0);
    const deckCard = addHandAttack(state, 'skadi.deck-draw', 0); deckCard.zone = 'deck';
    activate(state, source.instanceId, 'sc-skadi-1.wisdom-outpost');
    expect(state.players[0]!.mana).toBe(0);
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p1', min: 2, max: 2 });
    expect(state.abilityRuntime!.pendingDecision!.interaction).toMatchObject({ kind: 'post_draw_hand_shuffle_v1', visibility: 'owner_only', cancelPolicy: 'forbidden' });
  });

  it('maps Raido to the source-defined Quick/Quick rune pair', () => {
    const raido = setup();
    const raidoSource = add(raido.state, SC1, 'skill', false);
    addBasic(raido.state, 'skadi.quick-a', ['迅捷']); addBasic(raido.state, 'skadi.quick-b', ['迅捷']);
    activate(raido.state, raidoSource.instanceId, 'sc-skadi-1.raido');
    const moveDecision = raido.state.abilityRuntime!.pendingDecision!;
    expect(moveDecision.candidates.length).toBeGreaterThan(0);
    const destination = moveDecision.candidates[0]!;
    expect(destination).not.toBe('shinto');
    expect(dispatchAbilityCommand(raido.state, 'p1', { type: 'choose_target', decisionId: moveDecision.id, selectedIds: [destination] }).ok).toBe(true);
    expect(raido.state.players[0]!.locationId).toBe(destination);
  });

  it('maps Haglaz to the source-defined Quick/Magic rune pair', () => {
    const haglaz = setup();
    const haglazSource = add(haglaz.state, SC1, 'skill', false);
    addBasic(haglaz.state, 'skadi.quick', ['迅捷']); addBasic(haglaz.state, 'skadi.magic', ['魔术']);
    const handAttack = addHandAttack(haglaz.state, 'skadi.haglaz-hand', 2);
    const beforeMana = haglaz.state.players[0]!.mana;
    activate(haglaz.state, haglazSource.instanceId, 'sc-skadi-1.haglaz');
    const playDecision = haglaz.state.abilityRuntime!.pendingDecision!;
    expect(playDecision.candidates).toContain(handAttack.instanceId);
    expect(dispatchAbilityCommand(haglaz.state, 'p1', { type: 'choose_target', decisionId: playDecision.id, selectedIds: [handAttack.instanceId] }).ok).toBe(true);
    expect(haglaz.state.cards.find((card) => card.instanceId === handAttack.instanceId)!.zone).toBe('attack_area');
    expect(haglaz.state.players[0]!.mana).toBe(beforeMana - 5);
  });

  it('maps Teiwaz arm to the cross-card combat defeat continuation and consumes the arm', () => {
    const { state } = setup();
    const wisdom = add(state, SC1, 'skill', false);
    const runes = add(state, SC2, 'skill', false);
    addBasic(state, 'skadi.special', ['特殊']); addBasic(state, 'skadi.quick', ['迅捷']);
    activate(state, wisdom.instanceId, 'sc-skadi-1.teiwaz-arm');
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer?.p1?.['skadi.teiwaz.round']).toBe(state.round.roundNumber);
    state.round.activePhase = 'combat';
    activate(state, runes.instanceId, 'sc-skadi-2.teiwaz-combat');
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBe(state.round.roundNumber);
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer?.p1?.['skadi.teiwaz.round']).toBeUndefined();
  });

  it('maps Isan, Peorth, and Ansuz to mana loss, x3 terrain, and +4 VP', () => {
    const isan = setup();
    const isanSource = add(isan.state, SC1, 'skill', false);
    addBasic(isan.state, 'skadi.magic-a', ['魔术']); addBasic(isan.state, 'skadi.magic-b', ['魔术']);
    isan.state.players[1]!.mana = 5; isan.state.players[2]!.mana = 5;
    activate(isan.state, isanSource.instanceId, 'sc-skadi-1.isan');
    expect(isan.state.players[1]!.mana).toBe(3);
    expect(isan.state.players[2]!.mana).toBe(5);

    const peorth = setup();
    const peorthSource = add(peorth.state, SC1, 'skill', false);
    addBasic(peorth.state, 'skadi.special-peorth', ['特殊']); addBasic(peorth.state, 'skadi.magic-peorth', ['魔术']);
    activate(peorth.state, peorthSource.instanceId, 'sc-skadi-1.peorth');
    const terrain = (peorth.state as any).modeState?.terrainMultipliers ?? [];
    expect(terrain.some((entry: any) => entry.playerId === 'p1' && entry.multiplier === 3 && entry.duration === 'this_round')).toBe(true);

    const ansuz = setup();
    const ansuzSource = add(ansuz.state, SC1, 'skill', false);
    addBasic(ansuz.state, 'skadi.special-a', ['特殊']); addBasic(ansuz.state, 'skadi.special-b', ['特殊']);
    activate(ansuz.state, ansuzSource.instanceId, 'sc-skadi-1.ansuz');
    expect(ansuz.state.players[0]!.vp).toBe(14);
  });

  it('reveals true name when sc-skadi-3 is played and applies its live same-location mana-gain aura', () => {
    const { state } = setup();
    state.players[0]!.mana = 20;
    const source = add(state, SC3, 'skill', false);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: source.instanceId }).ok).toBe(true);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(state.cards.find((card) => card.instanceId === source.instanceId)!.zone).toBe('attack_area');
    expect(isManaGainSuppressed(state, 'p2')).toBe(true);
    expect(isManaGainSuppressed(state, 'p3')).toBe(false);
    state.players[1]!.mana = 0; state.players[2]!.mana = 0;
    expect(grantMana(state, 'p2', 4).actualAmount).toBe(0);
    expect(grantMana(state, 'p3', 4).actualAmount).toBe(4);
  });

  it('chooses one castle attribute and doubles matching same-location basic base power only for the current round', () => {
    const { state } = setup();
    state.round.activePhase = 'advance';
    const source = add(state, SC3, 'attack_area', true);
    const magic = addBasic(state, 'skadi.castle-magic', ['魔术']);
    const quick = addBasic(state, 'skadi.castle-quick', ['迅捷']);
    activate(state, source.instanceId, 'sc-skadi-3.castle-power');
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toEqual(expect.arrayContaining(['力量', '迅捷', '魔术', '特殊']));
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['魔术'] }).ok).toBe(true);
    expect(calculateCardPower(state, magic.instanceId).value).toBe(4);
    expect(calculateCardPower(state, quick.instanceId).value).toBe(2);
    state.round.roundNumber += 1;
    expect(calculateCardPower(state, magic.instanceId).value).toBe(2);
  });
});
