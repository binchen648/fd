import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';
import { terrainAdvantageAtLocation } from '../../src/ability/terrain-advantage-override';

const OWNER = 'servant.vlad';
const SC1 = `${OWNER}.skill.sc-vlad-1`;
const SC2 = `${OWNER}.skill.sc-vlad-2`;
const SC3 = `${OWNER}.skill.sc-vlad-3`;
const ATTACK_A = 'fixture.vlad.attack.a';
const ATTACK_B = 'fixture.vlad.attack.b';
function archive() { return JSON.parse(readFileSync('data/authoring/servants/servant.vlad.json','utf8')); }
function loadedPack() { return rules.loadAuthoringJson(archive()); }
function add(state: GameState, definitionId: string, instanceId: string, zone: string, active = false) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId:'p1', controllerPlayerId:'p1', zone,
    visibility: zone === 'attack_area' ? { scope:'public' } : { scope:'owner_only', ownerPlayerId:'p1' } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown:false, playedRound:state.round.roundNumber };
  return instanceId;
}
function setup() {
  const loaded = loadedPack();
  const state = createSeededGameState({ activeSeats:[1,2,3] });
  state.cards = []; state.round.prioritySeat = 1; state.players[0]!.servantCardId = OWNER; state.players[0]!.mana = 12;
  rules.initializeAbilityRuntime(state, loaded, { seed:20260930 });
  for (const [id,cost] of [[ATTACK_A,1],[ATTACK_B,2]] as const) {
    state.abilityRuntime!.pack.cards[id] = { id, name:id, cardType:'servant_attack', cardFace:{attributes:['力量'],cost,basePower:2},
      playTiming:{phase:'action',window:'controller_play_card_window'}, playRequirements:[], playKind:'attack', destinationZone:'attack_area', abilities:[], mode:'automatic' } as any;
  }
  state.players[0]!.locationId = 'miyama_town';
  (state as any).modeState = { terrainAssignments:{ miyama_town:['p1'] }, terrainAssignmentSlots:{ miyama_town:{p1:0} } };
  return state;
}
function activate(state: GameState, source: string, abilityId: string) {
  const action = rules.getLegalActions(state,'p1').find((a) => a.type === 'activate_ability' && a.cardInstanceId === source && a.abilityId === abilityId);
  expect(action).toBeDefined(); const out = rules.dispatchAbilityCommand(state,'p1',action!); expect(out,JSON.stringify(out)).toMatchObject({ok:true});
}
function choose(state: GameState, selectedIds: string[]) {
  const d=state.abilityRuntime!.pendingDecision!; expect(d).toBeDefined();
  const out=rules.dispatchAbilityCommand(state,'p1',{type:'choose_target',decisionId:d.id,selectedIds}); expect(out,JSON.stringify(out)).toMatchObject({ok:true});
}

describe('P3 Vlad owner-complete migration', () => {
  it('loads exact frozen sc1+sc2+sc3 archive and 12-card deck with only sc1/sc2 newly materialized', () => {
    const raw=archive(); const loaded=rules.loadAuthoringJson(raw);
    expect(loaded.report.filter((e) => e.status === 'unsupported')).toEqual([]);
    expect(Object.values(loaded.cards).filter((c) => c.cardType === 'servant_skill').map((c) => c.id)).toEqual([SC1,SC2,SC3]);
    expect(raw.deck).toEqual([
      {cardId:'card.cardb1',count:2},{cardId:'card.cardb2'},{cardId:'card.cardq1',count:2},{cardId:'card.cardq2'},
      {cardId:'card.cardq3'},{cardId:'card.cardq4'},{cardId:'card.cardluck'},{cardId:'card.cardsurveil'},
      {cardId:'card.cardpreparation',count:2},
    ]);
    for (const id of [SC1,SC2,SC3]) expect(loaded.cards[id]!.playRequirements).toEqual([{type:'skill_zone_mana_at_least',value:8}]);
  });

  it('executes sc1 action terrain doubling and combat fortification through accepted generic readiness seams', () => {
    const state=setup(); const source=add(state,SC1,'vlad-sc1','skill');
    state.round.activePhase='action'; const before=terrainAdvantageAtLocation(state,'p1','miyama_town'); const mana=state.players[0]!.mana;
    activate(state,source,'sc-vlad-1.terrain-doubling');
    expect(state.players[0]!.mana).toBe(mana-1); expect(terrainAdvantageAtLocation(state,'p1','miyama_town')).toBe(before*2);
    state.round.activePhase='combat'; state.players[1]!.locationId='miyama_town';
    rules.processAbilityEvent(state,{id:'formal-vlad-move',type:'after_controller_enters_location',playerId:'p2',previousLocationId:'shinto',locationId:'miyama_town',movementKind:'normal'});
    activate(state,source,'sc-vlad-1.fortification');
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments).toMatchObject([{playerId:'p2',amount:-4,round:state.round.roundNumber}]);
    expect(state.abilityRuntime!.pendingBattlefieldFortifications).toMatchObject([{controllerId:'p1',battlefieldId:'miyama_town',round:state.round.roundNumber}]);
  });

  it('executes sc2 one/two-card hand effect-play with terrain-gated paid second through ordinary play semantics', () => {
    const state=setup(); const source=add(state,SC2,'vlad-sc2','attack_area',true); const a=add(state,ATTACK_A,'a','hand'); const b=add(state,ATTACK_B,'b','hand');
    state.round.activePhase='action'; const mana=state.players[0]!.mana;
    activate(state,source,'sc-vlad-2.kazikli-bey'); choose(state,[a]); expect(state.abilityRuntime!.pendingDecision!.candidates).toEqual([b]); choose(state,[b]);
    expect(state.players[0]!.mana).toBe(mana-5);
    expect(state.cards.find((c)=>c.instanceId===a)!.zone).toBe('attack_area'); expect(state.cards.find((c)=>c.instanceId===b)!.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardPlayCountByInstance).toMatchObject({a:1,b:1}); expect(archive().cards.find((c: any)=>c.id===SC2).phase3Evidence.referenceStaticMetadata.revealsTrueNameOnPlay).toBe(true);
  });

  it('preserves existing canonical sc3 movement contract unchanged', () => {
    const state=setup(); const source=add(state,SC3,'vlad-sc3','attack_area',true); state.round.activePhase='action';
    const action=rules.getLegalActions(state,'p1').find((a)=>a.type==='activate_ability' && a.cardInstanceId===source && a.abilityId==='sc-vlad-3.move');
    expect(action).toBeDefined(); expect(rules.dispatchAbilityCommand(state,'p1',action!).ok).toBe(true);
    const d=state.abilityRuntime!.pendingDecision!; expect(d.candidates.length).toBeGreaterThan(0); expect(d.candidates).not.toContain('workshop');
  });

  it('integrates Vlad immediately after Valkyrie and keeps production runtime free of Vlad identity routing', () => {
    const manifest=JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json','utf8'));
    const i=manifest.authoringServantFiles.indexOf('data/authoring/servants/servant.valkyrie.json'); expect(i).toBeGreaterThanOrEqual(0);
    expect(manifest.authoringServantFiles[i+1]).toBe('data/authoring/servants/servant.vlad.json');
    const prod=['packages/rules/src/ability/interpreter.ts','packages/rules/src/ability/loader.ts','packages/rules/src/ability/terrain-fortification-extra-play-capability.ts','packages/rules/src/match-session.ts'].map((p)=>readFileSync(p,'utf8')).join('\n');
    for (const needle of ['servant.vlad','sc-vlad','护国鬼将','极刑王','战斗续行','core.vlad-']) expect(prod).not.toContain(needle);
  });
});
