import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { applyTerrainAdvantageOverride } from '../../src/ability/terrain-advantage-override';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-location-marker';
const CALAMITY = `${ROOT}.skill.calamity`;
const AWAKEN = `${ROOT}.skill.awaken`;
const MARKER = 'fixture:flesh';

const baseAbility = (id: string) => ({ id, printedClause: 'fixture', conditions: [], targets: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
  responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] } });
function followAbility() { return { ...baseAbility('fixture.marker-follow'), kind: 'forced_trigger', activation: { trigger: 'after_controller_enters_location', requiresSourceState: 'active' },
  conditions: [{ type: 'event_player_is_opponent' }], effects: [{ type: rules.LOCATION_MARKER_FOLLOW_EFFECT, markerKey: MARKER }] } as any; }
function combatAbility() { return { ...baseAbility('fixture.marker-combat'), kind: 'phase_action', activation: { phase: 'combat', opens: 'controller_combat_action_window', requiresSourceState: 'active' },
  effects: [{ type: rules.LOCATION_MARKER_COMBAT_BRANCH_EFFECT, markerKey: MARKER, terrainAmount: 3, vpTransferAmount: 1 }] } as any; }
function placeAbility() { return { ...baseAbility('fixture.marker-place'), kind: 'phase_action', activation: { phase: 'advance', opens: 'controller_action_window', requiresSourceState: 'active' },
  effects: [{ type: rules.LOCATION_MARKER_PLACE_EFFECT, markerKey: MARKER }] } as any; }
function midpointAbility() { return { ...baseAbility('fixture.marker-midpoint'), kind: 'phase_action', activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
  effects: [{ type: rules.LOCATION_MARKER_MIDPOINT_DEFEAT_EFFECT, markerKey: MARKER, distance: 2 }],
  visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' } } as any; }
function card(id: string, abilities: any[]) { return { id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: ROOT }, printedText: id,
  cardFace: { typeLabel: 'fixture', attributes: [], cost: 0, basePower: 0 }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
  playRequirements: [], abilities, verification: { implementationStatus: 'complete' } } as any; }
function archive(overrides?: { follow?: any; combat?: any; place?: any; midpoint?: any }) { return { schemaVersion: 'fd-card-authoring-v1', id: ROOT, name: 'Fixture', class: 'Alterego', cards: [
  card(CALAMITY, [overrides?.follow ?? followAbility(), overrides?.combat ?? combatAbility()]),
  card(AWAKEN, [overrides?.place ?? placeAbility(), overrides?.midpoint ?? midpointAbility()]),
] } as any; }
function add(state: GameState, definitionId: string, owner: string, instanceId: string) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone: 'attack_area', visibility: { scope: 'public' } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const pack = rules.loadAuthoringJson(archive()); expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1,2,3] }); state.cards = []; state.round.prioritySeat = 1;
  state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'shinto'; state.players[2]!.locationId = 'recon';
  state.players[0]!.vp = 0; state.players[1]!.vp = 3; state.players[2]!.vp = 2;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260929 });
  const calamity = add(state, CALAMITY, 'p1', 'marker-calamity'); const awaken = add(state, AWAKEN, 'p1', 'marker-awaken');
  return { state, pack, calamity, awaken };
}
function activate(state: GameState, source: string, abilityId: string) {
  const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === abilityId);
  expect(action).toBeDefined(); const out = rules.dispatchAbilityCommand(state, 'p1', action!); expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function place(state: GameState, awaken: string) { state.round.activePhase = 'advance'; state.round.prioritySeat = 1; activate(state, awaken, 'fixture.marker-place'); }
function sessionFor(state: GameState) { const session = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1','p2','p3'], restorePackKind: 'trusted_authoring_fixture' });
  session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = []; return session; }

describe('P3 Taisui location-marker owner-readiness capability', () => {
  it('accepts only exact identity-free whole-ability shells and rejects widened near-matches', () => {
    const loaded = rules.loadAuthoringJson(archive()); expect(loaded.report.some((entry) => entry.status === 'unsupported')).toBe(false);
    expect(rules.isAcceptedLocationMarkerFollowAbility(loaded.cards[CALAMITY]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedLocationMarkerCombatAbility(loaded.cards[CALAMITY]!.abilities[1]!)).toBe(true);
    expect(rules.isAcceptedLocationMarkerPlaceAbility(loaded.cards[AWAKEN]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedLocationMarkerMidpointDefeatAbility(loaded.cards[AWAKEN]!.abilities[1]!)).toBe(true);
    const badCombat = combatAbility(); badCombat.effects[0].terrainAmount = 4;
    const badPlace = placeAbility(); badPlace.effects[0].extra = true;
    const badMid = midpointAbility(); badMid.effects[0].distance = 3;
    const badFollow = followAbility(); badFollow.conditions = [];
    for (const value of [archive({ combat: badCombat }), archive({ place: badPlace }), archive({ midpoint: badMid }), archive({ follow: badFollow })]) {
      expect(rules.loadAuthoringJson(value).report.some((entry) => entry.status === 'unsupported')).toBe(true);
    }
  });

  it('places a persistent controller marker in advance and follows only a trusted opponent departure from its exact location', () => {
    const { state, awaken } = setup(); place(state, awaken);
    expect(state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]).toMatchObject({ markerKey: MARKER, controllerId: 'p1', providerSourceCardId: awaken, locationId: 'miyama_town' });
    state.players[1]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'shinto';
    rules.processAbilityEvent(state, { id: 'opponent-move', type: 'after_controller_enters_location', playerId: 'p2', previousLocationId: 'miyama_town', locationId: 'shinto', movementKind: 'normal' });
    expect(state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]?.locationId).toBe('shinto');
    rules.processAbilityEvent(state, { id: 'controller-move', type: 'after_controller_enters_location', playerId: 'p1', previousLocationId: 'shinto', locationId: 'recon', movementKind: 'normal' });
    expect(state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]?.locationId).toBe('shinto');
  });

  it('uses the normal combat branch only at the marker and installs exactly +3 current-round terrain advantage', () => {
    const { state, calamity, awaken } = setup(); place(state, awaken); state.round.activePhase = 'combat'; state.round.prioritySeat = 1;
    activate(state, calamity, 'fixture.marker-combat');
    expect(applyTerrainAdvantageOverride(state, 'p1', 'miyama_town', 0)).toBe(3);
    expect(applyTerrainAdvantageOverride(state, 'p1', 'shinto', 0)).toBe(0);
  });

  it('uses the reversed combat branch only away from marker and transfers one VP from each active player at marker', () => {
    const { state, calamity, awaken } = setup(); place(state, awaken);
    state.abilityRuntime!.cardState[calamity]!.reversed = true; state.players[0]!.locationId = 'shinto'; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'miyama_town';
    const before = state.players[0]!.vp; state.round.activePhase = 'combat'; state.round.prioritySeat = 1; activate(state, calamity, 'fixture.marker-combat');
    expect(state.players[0]!.vp).toBe(before + 2); expect(state.players[1]!.vp).toBe(2); expect(state.players[2]!.vp).toBe(1);
  });

  it('reversed action converges controller+marker to the unique middle, reveals true name, and defeats all eligible opponents there', () => {
    const { state, awaken } = setup();
    state.players[0]!.locationId = 'recon'; place(state, awaken); // marker at recon
    state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'shinto'; state.players[2]!.locationId = 'shinto';
    state.abilityRuntime!.cardState[awaken]!.reversed = true; state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    activate(state, awaken, 'fixture.marker-midpoint');
    expect(state.players[0]!.locationId).toBe('shinto'); expect(state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]?.locationId).toBe('shinto');
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer).toMatchObject({ p2: state.round.roundNumber, p3: state.round.roundNumber });
  });

  it('honors existing generic defeat-ignore state during midpoint Defeat without blocking other eligible opponents', () => {
    const { state, awaken } = setup();
    state.players[0]!.locationId = 'recon'; place(state, awaken);
    state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'shinto'; state.players[2]!.locationId = 'shinto';
    state.abilityRuntime!.battleLossIgnoreRoundByPlayer = { p2: state.round.roundNumber };
    state.abilityRuntime!.cardState[awaken]!.reversed = true; state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    activate(state, awaken, 'fixture.marker-midpoint');
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBeUndefined();
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p3).toBe(state.round.roundNumber);
  });

  it('dedupes repeated movement event ids, rejects stale departure provenance, and requires a live owned source', () => {
    const { state, calamity, awaken } = setup(); place(state, awaken);
    state.players[1]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'shinto';
    const first = { id: 'same-move', type: 'after_controller_enters_location', playerId: 'p2', previousLocationId: 'miyama_town', locationId: 'shinto', movementKind: 'normal' } as const;
    rules.processAbilityEvent(state, first);
    expect(state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]?.locationId).toBe('shinto');
    rules.processAbilityEvent(state, first);
    expect(state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]?.locationId).toBe('shinto');
    rules.processAbilityEvent(state, { ...first, id: 'stale-move', locationId: 'recon' });
    expect(state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]?.locationId).toBe('shinto');
    state.abilityRuntime!.cardState[calamity]!.active = false;
    rules.processAbilityEvent(state, { ...first, id: 'inactive-source', previousLocationId: 'shinto', locationId: 'recon' });
    expect(state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]?.locationId).toBe('shinto');
    state.abilityRuntime!.cardState[calamity]!.active = true; state.cards.find((card) => card.instanceId === calamity)!.ownerPlayerId = 'p2';
    rules.processAbilityEvent(state, { ...first, id: 'owner-diverged', previousLocationId: 'shinto', locationId: 'recon' });
    expect(state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]?.locationId).toBe('shinto');
  });

  it('fails closed without a marker, on the wrong reversal/location relation, and leaves defaults unchanged', () => {
    const { state, calamity, awaken } = setup();
    state.round.activePhase = 'combat'; state.round.prioritySeat = 1;
    expect(rules.getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === calamity && entry.abilityId === 'fixture.marker-combat')).toBe(false);
    state.round.activePhase = 'advance'; state.abilityRuntime!.cardState[awaken]!.reversed = true;
    expect(rules.getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === awaken && entry.abilityId === 'fixture.marker-place')).toBe(false);
    expect(state.abilityRuntime!.locationMarkers).toEqual({});
  });

  it('round-trips an authoritative marker and rejects forged location/provider provenance', () => {
    const { state, awaken } = setup(); place(state, awaken);
    const snapshot: any = JSON.parse(JSON.stringify(sessionFor(state).serializeSession()));
    const restored = rules.restoreMatchSession(snapshot, { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.locationMarkers?.[`p1:${MARKER}`]?.locationId).toBe('miyama_town');
    const wrongLocation = structuredClone(snapshot); wrongLocation.state.abilityRuntime.locationMarkers[`p1:${MARKER}`].locationId = 'forged';
    expect(() => rules.restoreMatchSession(wrongLocation, { restorePackKind: 'trusted_authoring_fixture' })).toThrow();
    const wrongProvider = structuredClone(snapshot); wrongProvider.state.abilityRuntime.locationMarkers[`p1:${MARKER}`].providerSourceCardId = 'marker-calamity';
    expect(() => rules.restoreMatchSession(wrongProvider, { restorePackKind: 'trusted_authoring_fixture' })).toThrow();
  });

  it('contains no Taisui/Flesh identity route or legacy-handler fallback in production runtime', () => {
    const production = ['packages/rules/src/ability/location-marker-capability.ts','packages/rules/src/ability/interpreter.ts','packages/rules/src/ability/loader.ts','packages/rules/src/match-session.ts']
      .map((path) => readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.taisui','sc-taisui','太岁','视肉','core.taisui-calamity','core.taisui-awaken','SkillLib']) expect(production).not.toContain(needle);
  });
});
