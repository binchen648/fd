import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadAuthoringJson } from '../../src/ability/loader';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { dispatchAbilityCommand, initializeAbilityRuntime } from '../../src/ability/interpreter';
import { getPlayerExtraPresences, getPlayerIdsPresentAtLocation, multiPresenceTerrainAdvantageAtLocation } from '../../src/ability/multi-presence-player-capability';
import type { GameState } from '../../src/schema/game';

const ROOT='master.alice';
const PRESENCE='alice.phantom';
const S1='master.alice.skill.s1';
const S2='master.alice.skill.s2';
const ASC='master.alice.skill.ascension';
const IDS=[ASC,S1,S2];
const path='data/authoring/masters/master.alice.json';
const raw=JSON.parse(readFileSync(path,'utf8'));
const loaded=loadAuthoringJson(raw);
for(const def of Object.values(loaded.cards)) (def as any).ownerId=ROOT;
const card=(id:string)=>loaded.cards[id]!;
const effectTypes=(id:string)=>card(id).abilities.flatMap(a=>a.effects.map(e=>e.type));
function add(state:GameState,definitionId:string,zone='skill',active=false){const instanceId=`alice:${definitionId}:${state.cards.length}`;state.cards.push({instanceId,definitionId,ownerPlayerId:'p1',controllerPlayerId:'p1',zone,visibility:['field','attack_area'].includes(zone)?{scope:'public'}:{scope:'owner_only',ownerPlayerId:'p1'}} as any);state.abilityRuntime!.cardState[instanceId]={active,faceDown:false,playedRound:state.round.roundNumber};return instanceId;}
function setup(){const state=createSeededGameState({activeSeats:[1,2,3]});state.cards=[];state.players[0]!.masterCardId=ROOT;state.players[0]!.locationId='magic_workshop';state.players[1]!.locationId='miyama_town';state.players[2]!.locationId='shinto';state.players.forEach(p=>{p.mana=10;p.vp=0;});initializeAbilityRuntime(state,loaded,{seed:20261001});const ids={s1:add(state,S1),s2:add(state,S2),asc:add(state,ASC)};return{state,ids};}
function deploy(state:GameState,source:string,locationId='miyama_town'){state.round.activePhase='preparation';state.round.prioritySeat=state.players[0]!.seat;const start=dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:source,abilityId:'alice.s1.deploy'});expect(start.ok).toBe(true);const d=state.abilityRuntime!.pendingDecision!;expect(d.candidates).toContain(locationId);const done=dispatchAbilityCommand(state,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[locationId]});expect(done.ok).toBe(true);}

describe('P3 Alice owner-complete migration',()=>{
  it('materializes exactly the complete frozen three-identity owner scope',()=>{expect(raw.id).toBe(ROOT);expect(raw.name).toBe('爱丽丝');expect(raw.publicInformation.initialMana).toBe(4);expect(raw.cards.map((x:any)=>x.id).sort()).toEqual([...IDS].sort());expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());expect(loaded.report.filter(x=>x.status==='unsupported')).toEqual([]);});
  it('preserves frozen names and exact Queenside Castle static metadata',()=>{expect(raw.cards.map((x:any)=>[x.id,x.name])).toEqual([[S1,'赛博幽灵'],[S2,'幻影爱丽丝'],[ASC,'Queenside Castle']]);const asc=raw.cards.find((x:any)=>x.id===ASC);expect(asc.initialPlacement).toBe('outside_game');expect(card(ASC).cardFace).toMatchObject({typeLabel:'魔术',cost:5,basePower:1});expect(card(ASC).playRequirements).toEqual([{type:'skill_zone_mana_at_least',value:5}]);});
  it('consumes only the accepted multi-presence whole-ability family',()=>{expect(effectTypes(S1)).toEqual(['multi_presence_record_battle_loss','multi_presence_deploy','multi_presence_mirror_move','multi_presence_post_play_mana_loss']);expect(effectTypes(S2)).toEqual(['multi_presence_shared_player_rule']);expect(effectTypes(ASC)).toEqual(['multi_presence_share_terrain','multi_presence_sacrifice_defeat']);});
  it('integrates Alice exactly once immediately after Akiha',()=>{const pack=JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json','utf8'));expect(pack.authoringMasterFiles.filter((x:string)=>x===path)).toHaveLength(1);expect(pack.authoringMasterFiles.slice(-2)).toEqual(['data/authoring/masters/master.akiha.json',path]);});
  it('drives canonical Cyber Ghost and Phantom Alice through real definitions',()=>{const {state,ids}=setup();deploy(state,ids.s1);const extra=getPlayerExtraPresences(state,'p1');expect(extra).toHaveLength(1);expect(extra[0]).toMatchObject({presenceKey:PRESENCE,locationId:'miyama_town'});expect(getPlayerIdsPresentAtLocation(state,'miyama_town').filter(x=>x==='p1')).toHaveLength(1);});
  it('drives canonical Queenside Castle terrain sharing and sacrifice',()=>{const {state,ids}=setup();deploy(state,ids.s1);(state as any).modeState={...(state as any).modeState,terrainAssignments:{magic_workshop:['p1'],miyama_town:['p2']},terrainAssignmentSlots:{magic_workshop:{p1:0},miyama_town:{p2:1}}};expect(multiPresenceTerrainAdvantageAtLocation(state,'p1','magic_workshop')).toBeGreaterThan(0);expect(multiPresenceTerrainAdvantageAtLocation(state,'p1','miyama_town')).toBeGreaterThan(0);state.round.activePhase='action';state.round.prioritySeat=state.players[0]!.seat;const r=dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:ids.asc,abilityId:'alice.ascension.sacrifice'});expect(r.ok).toBe(true);expect(getPlayerExtraPresences(state,'p1')).toHaveLength(0);expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBe(state.round.roundNumber);expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p1).toBeUndefined();});
  it('adds no Alice identity routing to production runtime',()=>{const files=['packages/rules/src/ability/multi-presence-player-capability.ts','packages/rules/src/ability/interpreter.ts','packages/rules/src/match-session.ts'];const production=files.map(f=>readFileSync(f,'utf8')).join('\n');for(const n of ['master.alice','爱丽丝','Queenside Castle','赛博幽灵','幻影爱丽丝','core.alice-'])expect(production).not.toContain(n);});
});
