import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { applyTerrainAdvantageOverride } from '../../src/ability/terrain-advantage-override';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ARCHIVE = 'data/authoring/servants/servant.taisui.json';
const ROOT = 'servant.taisui';
const SC1 = `${ROOT}.skill.sc-taisui-1`;
const SC2 = `${ROOT}.skill.sc-taisui-2`;
const SC3 = `${ROOT}.skill.sc-taisui-3`;
const MARKER = 'servant.taisui:flesh';
const SC1_OBJECT_SHA = 'a7fdd47c7d30259afd960a26b1534d2c9e11d30c4262c3fe2040a5059bd2f9ed';
const SC1_TEXT_SHA = 'b6c74ac37a50b671ded913dbc6ae6736f2057904fe4c02924d79f84971cebbdf';
const SC2_TEXT_SHA = 'b1f695d9bbad243bac35ccecf3112ec8c47af6c3ec4235a97725dcb1499fc95e';
const SC3_TEXT_SHA = '82fd31ad1aae9fd200fdff14e6430df94a3d283195f71bc47d097aa69e2ca0a5';

const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
function rawArchive(): any { return JSON.parse(readFileSync(ARCHIVE, 'utf8')); }
function pack() {
  const loaded = rules.loadAuthoringJson(rawArchive());
  expect(loaded.report).toEqual([]);
  return loaded;
}
function add(state: GameState, definitionId: string, owner: string, zone: string, instanceId: string) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active: ['field', 'attack_area'].includes(zone), faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const loaded = pack();
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.mana = 30;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'recon';
  state.players[0]!.vp = 0; state.players[1]!.vp = 3; state.players[2]!.vp = 2;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260929 });
  return { state, loaded };
}
function playSkill(state: GameState, cardId: string, instanceId: string) {
  const source = add(state, cardId, 'p1', 'skill', instanceId);
  const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'play_card' && entry.cardInstanceId === source);
  expect(action).toBeDefined();
  const result = rules.dispatchAbilityCommand(state, 'p1', action!);
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
  return source;
}
function activate(state: GameState, source: string, abilityId: string) {
  const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === abilityId);
  expect(action).toBeDefined();
  const result = rules.dispatchAbilityCommand(state, 'p1', action!);
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
}
function sessionFor(state: GameState) {
  const session = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2', 'p3'], restorePackKind: 'trusted_authoring_fixture' });
  session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
  return session;
}

describe('P3 owner-complete Taisui migration', () => {
  it('materializes preserved sc1 + new sc2 + sc3 with exact frozen text/static metadata and accepted generic seams', () => {
    const raw = rawArchive(); const loaded = pack();
    expect(raw).toMatchObject({ id: ROOT, name: '太岁星君', class: 'Alterego' });
    expect(raw.cards.map((card: any) => card.id)).toEqual([SC1, SC2, SC3]);
    expect(sha(JSON.stringify(raw.cards[0]))).toBe(SC1_OBJECT_SHA);
    expect(raw.cards.map((card: any) => sha(card.printedText))).toEqual([SC1_TEXT_SHA, SC2_TEXT_SHA, SC3_TEXT_SHA]);
    expect(raw.cards.map((card: any) => [card.cardFace.typeLabel, card.cardFace.attributes, card.cardFace.cost, card.cardFace.basePower])).toEqual([
      ['被动', [], 2, 3], ['魔术', ['魔术'], 2, 5], ['魔术/宝具', ['魔术', '宝具'], 7, 11],
    ]);
    expect(raw.cards.map((card: any) => card.playRequirements)).toEqual([
      [{ type: 'skill_zone_mana_at_least', value: 8 }],
      [{ type: 'skill_zone_mana_at_least', value: 8 }],
      [{ type: 'skill_zone_mana_at_least', value: 8 }],
    ]);
    expect(loaded.cards[SC2]!.abilities.some(rules.isAcceptedLocationMarkerFollowAbility)).toBe(true);
    expect(loaded.cards[SC2]!.abilities.some(rules.isAcceptedLocationMarkerCombatAbility)).toBe(true);
    expect(loaded.cards[SC3]!.abilities.some(rules.isAcceptedLocationMarkerPlaceAbility)).toBe(true);
    expect(loaded.cards[SC3]!.abilities.some(rules.isAcceptedLocationMarkerMidpointDefeatAbility)).toBe(true);
  });

  it('enforces the final 8-mana skill-zone gate and exact printed costs for new sc2/sc3', () => {
    for (const [cardId, printedCost] of [[SC2, 2], [SC3, 7]] as const) {
      const low = setup(); low.state.players[0]!.mana = 7; const lowId = add(low.state, cardId, 'p1', 'skill', `${cardId}:low`);
      expect(rules.getLegalActions(low.state, 'p1').some((entry) => entry.type === 'play_card' && entry.cardInstanceId === lowId)).toBe(false);
      const exact = setup(); exact.state.players[0]!.mana = 8; const id = add(exact.state, cardId, 'p1', 'skill', `${cardId}:exact`);
      const action = rules.getLegalActions(exact.state, 'p1').find((entry) => entry.type === 'play_card' && entry.cardInstanceId === id);
      expect(action).toBeDefined(); expect(rules.dispatchAbilityCommand(exact.state, 'p1', action!).ok).toBe(true);
      expect(exact.state.players[0]!.mana).toBe(8 - printedCost);
    }
  });

  it('runs real sc3 placement, real sc2 opponent-follow, and the normal +3 marker-bound combat branch', () => {
    const { state } = setup();
    const sc2 = playSkill(state, SC2, 'taisui-sc2');
    const sc3 = playSkill(state, SC3, 'taisui-sc3');
    state.round.activePhase = 'advance'; state.round.prioritySeat = 1;
    activate(state, sc3, 'sc-taisui-3.flesh-place');
    expect(state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]).toMatchObject({ controllerId: 'p1', providerSourceCardId: sc3, locationId: 'miyama_town' });

    state.players[1]!.locationId = 'shinto';
    rules.processAbilityEvent(state, { id: 'taisui-opponent-move', type: 'after_controller_enters_location', playerId: 'p2', previousLocationId: 'miyama_town', locationId: 'shinto', movementKind: 'normal' });
    expect(state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]?.locationId).toBe('shinto');

    state.players[0]!.locationId = 'shinto'; state.round.activePhase = 'combat'; state.round.prioritySeat = 1;
    activate(state, sc2, 'sc-taisui-2.calamity-combat');
    expect(applyTerrainAdvantageOverride(state, 'p1', 'shinto', 0)).toBe(3);
    expect(applyTerrainAdvantageOverride(state, 'p1', 'miyama_town', 0)).toBe(0);
  });

  it('runs real reversed sc2 VP transfer only away from marker and clamps each target by current VP', () => {
    const { state } = setup();
    const sc2 = playSkill(state, SC2, 'taisui-sc2');
    const sc3 = playSkill(state, SC3, 'taisui-sc3');
    state.round.activePhase = 'advance'; state.round.prioritySeat = 1; activate(state, sc3, 'sc-taisui-3.flesh-place');
    state.abilityRuntime!.cardState[sc2]!.reversed = true;
    state.players[0]!.locationId = 'shinto'; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'miyama_town';
    state.players[1]!.vp = 1; state.players[2]!.vp = 0; const before = state.players[0]!.vp;
    state.round.activePhase = 'combat'; state.round.prioritySeat = 1; activate(state, sc2, 'sc-taisui-2.calamity-combat');
    expect(state.players[0]!.vp).toBe(before + 1); expect(state.players[1]!.vp).toBe(0); expect(state.players[2]!.vp).toBe(0);
  });

  it('runs real reversed sc3 midpoint convergence, reveals true name, and honors ordinary defeat-ignore semantics', () => {
    const { state } = setup();
    const sc3 = playSkill(state, SC3, 'taisui-sc3');
    state.players[0]!.locationId = 'recon'; state.round.activePhase = 'advance'; state.round.prioritySeat = 1;
    activate(state, sc3, 'sc-taisui-3.flesh-place');
    state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'shinto'; state.players[2]!.locationId = 'shinto';
    state.abilityRuntime!.cardState[sc3]!.reversed = true;
    state.abilityRuntime!.battleLossIgnoreRoundByPlayer = { p2: state.round.roundNumber };
    state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    activate(state, sc3, 'sc-taisui-3.midpoint-defeat');
    expect(state.players[0]!.locationId).toBe('shinto');
    expect(state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]?.locationId).toBe('shinto');
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBeUndefined();
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p3).toBe(state.round.roundNumber);
  });

  it('round-trips real Taisui marker state and keeps production runtime free of Taisui identity routing', () => {
    const { state } = setup();
    const sc3 = playSkill(state, SC3, 'taisui-sc3');
    state.round.activePhase = 'advance'; state.round.prioritySeat = 1; activate(state, sc3, 'sc-taisui-3.flesh-place');
    const restored = rules.restoreMatchSession(JSON.parse(JSON.stringify(sessionFor(state).serializeSession())), { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]).toMatchObject({ providerSourceCardId: sc3, locationId: 'miyama_town' });

    const production = ['packages/rules/src/ability/location-marker-capability.ts', 'packages/rules/src/ability/interpreter.ts', 'packages/rules/src/ability/loader.ts', 'packages/rules/src/match-session.ts']
      .map((path) => readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.taisui', 'sc-taisui', '太岁', '视肉', 'core.taisui-calamity', 'core.taisui-awaken', 'SkillLib']) expect(production).not.toContain(needle);
  });
});
