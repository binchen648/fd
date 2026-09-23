import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const IDS = [
  'servant.amakusa.skill.sc-amakusa-3',
  'servant.amor.skill.sc-amor-1',
  'servant.jeanne.skill.sc-jeanne-1',
  'servant.morgan.skill.sc-morgan-3',
  'servant.oberon.skill.sc-oberon-3',
  'servant.oberon.skill.sc-oberon-4',
] as const;
const PARENT_SHA = '8340a2b1e14bdf601bebf9f0a5a1dbb67c326c0bafbc596d689110ea3cc51137';
const USE_SHA = '125082e75869375ea276d98ddfe24549144efbc1525a5e7a54acac179e1beb3c';
const PARENT = 'servant.oberon.skill.sc-oberon-3';
const USE = 'servant.oberon.skill.sc-oberon-4';
const PARENT_ABILITY = 'sc-oberon-3.ruler-binding';
const USE_ABILITY = 'sc-oberon-4.ruler-seal-use';
const FREE = 'fixture.ruler.consumer.free';
const FREE_INSTANCE = `${FREE}.instance`;

function readArchive(ownerId: string) {
  return JSON.parse(readFileSync(resolve(ROOT, `data/authoring/servants/${ownerId}.json`), 'utf8'));
}
function sha(text: string) { return createHash('sha256').update(text, 'utf8').digest('hex'); }
function loadOberonWithHelperCard() {
  const loaded = rules.loadAuthoringJson(readArchive('servant.oberon'));
  expect(loaded.report).toEqual([]);
  const helper = rules.loadAuthoringJson({
    schemaVersion: 'fd-card-authoring-v1', id: 'fixture.ruler.consumer.helpers', name: 'helpers', cards: [{
      id: FREE, name: 'free card', cardType: 'basic_attack', cardFace: { cost: 7, basePower: 1, attributes: [] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
    }],
  });
  expect(helper.report).toEqual([]);
  Object.assign(loaded.cards, helper.cards);
  return loaded;
}
function addInstance(state: GameState, instanceId: string, definitionId: string, playerId: string, zone: string) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: playerId, controllerPlayerId: playerId, zone,
    visibility: zone === 'field' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: playerId } } as any);
}
function setup() {
  const pack = loadOberonWithHelperCard();
  const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
  state.cards = [];
  state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  state.players[0]!.locationId = 'recon'; state.players[1]!.locationId = 'recon'; state.players[2]!.locationId = 'shinto'; state.players[3]!.locationId = 'miyama_town';
  addInstance(state, 'parent.instance', PARENT, 'p1', 'skill');
  addInstance(state, 'use.instance', USE, 'p1', 'skill');
  addInstance(state, FREE_INSTANCE, FREE, 'p2', 'hand');
  rules.initializeAbilityRuntime(state, pack, { seed: 20260919 });
  state.abilityRuntime!.cardState['parent.instance'] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  state.abilityRuntime!.cardState['use.instance'] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}
function activate(state: GameState, instanceId: string, abilityId: string) {
  const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: instanceId, abilityId });
  expect(result.ok).toBe(true);
  return state.abilityRuntime!.pendingDecision!;
}
function choose(state: GameState, playerId: string, selectedIds: string[]) {
  const pending = state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: pending.id, selectedIds });
}
function grant(state: GameState) {
  activate(state, 'parent.instance', PARENT_ABILITY);
  expect(choose(state, 'p1', ['p2', 'p3']).ok).toBe(true);
}
function chooseUse(state: GameState, branch: 'move' | 'lock_movement' | 'free_play_reward', bound = 'p2') {
  activate(state, 'use.instance', USE_ABILITY);
  expect(choose(state, 'p1', [branch]).ok).toBe(true);
  expect(choose(state, 'p1', [bound]).ok).toBe(true);
}

describe('P3 Ruler consumer migration', () => {
  it('contains exactly six source-grounded frozen identities and matches accepted FB2-27 classifiers', () => {
    const owners = ['servant.amakusa','servant.amor','servant.jeanne','servant.morgan','servant.oberon'];
    const cards: any[] = [];
    for (const owner of owners) {
      const archive = readArchive(owner);
      const loaded = rules.loadAuthoringJson(archive);
      expect(loaded.report).toEqual([]);
      cards.push(...archive.cards.filter((card: any) => (IDS as readonly string[]).includes(String(card.id))));
    }
    expect(cards.map(card => card.id).sort()).toEqual([...IDS].sort());
    for (const card of cards.filter(card => card.id !== USE)) {
      expect(sha(card.printedText)).toBe(PARENT_SHA);
      expect(card.phase3Evidence.sourceTextSha256).toBe(PARENT_SHA);
      expect(rules.isRulerSealBindingSemantic(rules.loadAuthoringJson({ schemaVersion:'fd-card-authoring-v1', id:`probe.${card.id}`, name:'probe', cards:[card] }).cards[card.id]!.abilities[0]!)).toBe(true);
    }
    const use = cards.find(card => card.id === USE)!;
    expect(sha(use.printedText)).toBe(USE_SHA);
    expect(use.phase3Evidence.sourceTextSha256).toBe(USE_SHA);
    expect(rules.isRulerSealUseSemantic(rules.loadAuthoringJson(readArchive('servant.oberon')).cards[USE]!.abilities[0]!)).toBe(true);
  });

  it('preserves ordered least-bound selection with the real migrated Oberon Ruler definition', () => {
    const state = setup();
    state.abilityRuntime!.rulerSealBindingHistory = { p1: { p2: 0, p3: 1, p4: 1 } };
    activate(state, 'parent.instance', PARENT_ABILITY);
    const before = structuredClone(state);
    const reversed = choose(state, 'p1', ['p3', 'p2']);
    expect(reversed.ok).toBe(false);
    expect(reversed.rejection?.code).toBe('illegal_target');
    expect(state).toEqual(before);
    expect(choose(state, 'p1', ['p2', 'p3']).ok).toBe(true);
    expect(state.abilityRuntime!.rulerSealBindings).toHaveLength(2);
  });

  it('executes move and round-lock branches through the real migrated seal definition', () => {
    const move = setup(); grant(move); chooseUse(move, 'move');
    expect(move.abilityRuntime!.pendingDecision!.candidates).toEqual(['miyama_town', 'shinto']);
    expect(choose(move, 'p1', ['miyama_town']).ok).toBe(true);
    expect(move.players[1]!.locationId).toBe('miyama_town');

    const lock = setup(); grant(lock); chooseUse(lock, 'lock_movement');
    expect(rules.rulerSealMovementLocked(lock, 'p2')).toBe(true);
    const blocked = rules.movePlayer(lock, { playerId: 'p2', to: 'shinto', movementKind: 'effect' });
    expect(blocked.moved).toBe(false);
    expect(blocked.reason).toBe('movement_locked');
  });

  it('executes free play and delayed +2 VP reward through the real migrated seal definition', () => {
    const state = setup(); grant(state); state.players[1]!.mana = 0;
    const beforeVp = state.players[0]!.vp;
    chooseUse(state, 'free_play_reward');
    const free = state.abilityRuntime!.pendingDecision!;
    expect(free.controllerId).toBe('p2');
    expect(free.candidates).toContain(FREE_INSTANCE);
    expect(choose(state, 'p2', [FREE_INSTANCE]).ok).toBe(true);
    expect(state.players[1]!.mana).toBe(0);
    const battle = { id: 'ruler-consumer-win', type: 'after_battle_result_determined', battleParticipantIds: ['p2','p3'], battleResult: { winners: ['p2'], loserIds: ['p3'] } } as any;
    rules.processAbilityEvent(state, battle);
    expect(state.players[0]!.vp).toBe(beforeVp + 2);
    rules.processAbilityEvent(state, battle);
    expect(state.players[0]!.vp).toBe(beforeVp + 2);
  });

  it('keeps the migrated standalone archives outside the production playtest pack', () => {
    const manifest = readFileSync(resolve(ROOT, 'data/packs/fd-playtest-v1/pack.json'), 'utf8');
    for (const owner of ['servant.amakusa','servant.amor','servant.jeanne','servant.morgan','servant.oberon']) expect(manifest).not.toContain(`data/authoring/servants/${owner}.json`);
    const generated = readFileSync(resolve(ROOT, 'data/generated/fd-playtest-v1.content-library.json'), 'utf8');
    for (const id of IDS) expect(generated).not.toContain(id);
  });
});
