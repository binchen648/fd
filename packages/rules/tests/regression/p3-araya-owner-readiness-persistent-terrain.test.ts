import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { initializeAbilityRuntime, isDeferredAbilityRuntimeProvenanceValidForRestore, processAbilityEvent } from '../../src/ability/interpreter';
import { loadAuthoringJson } from '../../src/ability/loader';
import { persistentLocationTerrainAdvantage } from '../../src/ability/persistent-location-terrain-capability';
import { terrainAdvantageAtLocation } from '../../src/ability/terrain-advantage-override';
import type { GameState } from '../../src/schema/game';

const ROOT='master.fixture-persistent-terrain';
const SKILL=`${ROOT}.skill.s1`;
const ABILITY='fixture.persistent-terrain';

function archive(){
  return {
    schemaVersion:'fd-card-authoring-v1', archiveType:'master_skill_card_archive', id:ROOT, name:'Fixture Persistent Terrain', class:'Master',
    publicInformation:{type:'master_package',initialMana:4},
    cards:[{
      id:SKILL,name:'Persistent Terrain',cardType:'master_skill',owner:{type:'master',id:ROOT},
      cardFace:{typeLabel:'被动',attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],
      abilities:[{id:ABILITY,kind:'forced_trigger',printedClause:'fixture',activation:{trigger:'after_player_deployed_to_battlefield'},conditions:[],targets:[],
        effects:[{type:'persistent_location_terrain_replace_increment',amount:1,max:5}],cost:[],ruleModifiers:[],creates:[],lifecycle:{},
        responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}}],
      verification:{implementationStatus:'complete'},
    }],
  } as any;
}
function setup(){
  const pack=loadAuthoringJson(archive()); expect(pack.report.filter((entry)=>entry.status==='unsupported')).toEqual([]);
  for(const definition of Object.values(pack.cards))(definition as any).ownerId=ROOT;
  const state=createSeededGameState({activeSeats:[1,2,3]}); state.cards=[]; initializeAbilityRuntime(state,pack,{seed:20261001});
  const player=state.players[0]!; player.masterCardId=ROOT; player.locationId='shinto';
  state.players[1]!.locationId='miyama_town'; state.players[2]!.locationId='recon';
  const source='p1:persistent-terrain-source';
  state.cards.push({instanceId:source,definitionId:SKILL,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}} as any);
  state.abilityRuntime!.cardState[source]={active:false,faceDown:false,playedRound:state.round.roundNumber};
  const mode=(state as unknown as {modeState?:Record<string,unknown>}); mode.modeState={terrainAssignments:{shinto:['p1']},terrainAssignmentSlots:{shinto:{p1:0}}};
  return {state,source};
}
function deploy(state:GameState,id:string,locationId='shinto'){
  processAbilityEvent(state,{id,type:'after_player_deployed_to_battlefield',playerId:'p1',locationId} as any);
}
function record(state:GameState,locationId='shinto'){ return state.abilityRuntime!.persistentLocationTerrainByPlayer?.p1?.[locationId]; }

describe('P3 Araya owner-readiness identity-free persistent location terrain',()=>{
  it('accepts only the exact privileged whole-ability shape',()=>{
    expect(loadAuthoringJson(archive()).report.filter((entry)=>entry.status==='unsupported')).toEqual([]);
    for(const mutate of [
      (a:any)=>a.cards[0].abilities[0].effects[0].amount=2,
      (a:any)=>a.cards[0].abilities[0].effects[0].max=6,
      (a:any)=>a.cards[0].abilities[0].effects[0].extra=true,
      (a:any)=>a.cards[0].abilities[0].activation.trigger='after_player_deployed_to_location',
    ]){
      const bad=archive(); mutate(bad); const loaded=loadAuthoringJson(bad);
      expect(loaded.cards[SKILL]!.abilities[0]!.execution.mode).toBe('unsupported');
      expect(loaded.report.some((entry)=>entry.reason.includes('Persistent location-terrain'))).toBe(true);
    }
  });

  it('replaces printed terrain with permanent +1 layers per qualifying deployment and caps at five',()=>{
    const {state}=setup();
    expect(terrainAdvantageAtLocation(state,'p1','shinto')).toBe(3);
    deploy(state,'deploy-1');
    expect(record(state)?.value).toBe(1);
    expect(terrainAdvantageAtLocation(state,'p1','shinto')).toBe(1);
    for(let n=2;n<=7;n++) deploy(state,`deploy-${n}`);
    expect(record(state)?.value).toBe(5);
    expect(record(state)?.triggerEventIds).toHaveLength(5);
    expect(terrainAdvantageAtLocation(state,'p1','shinto')).toBe(5);
  });

  it('keeps layers per location, inactive while away, and restores them when the player returns',()=>{
    const {state}=setup(); deploy(state,'shinto-1'); deploy(state,'shinto-2');
    expect(persistentLocationTerrainAdvantage(state,'p1','shinto')).toBe(2);
    state.players[0]!.locationId='miyama_town';
    expect(persistentLocationTerrainAdvantage(state,'p1','shinto')).toBeUndefined();
    (state as any).modeState.terrainAssignments={miyama_town:['p1']}; (state as any).modeState.terrainAssignmentSlots={miyama_town:{p1:0}};
    deploy(state,'miyama-1','miyama_town');
    expect(persistentLocationTerrainAdvantage(state,'p1','miyama_town')).toBe(1);
    state.players[0]!.locationId='shinto';
    expect(persistentLocationTerrainAdvantage(state,'p1','shinto')).toBe(2);
    expect(record(state,'miyama_town')?.value).toBe(1);
  });

  it('does not create a layer when the deployed player did not receive a terrain slot',()=>{
    const {state}=setup();
    (state as any).modeState.terrainAssignments={shinto:['p2','p3']}; (state as any).modeState.terrainAssignmentSlots={shinto:{p2:0,p3:1}};
    deploy(state,'no-slot');
    expect(record(state)).toBeUndefined();
  });

  it('deduplicates an authoritative deployment event instead of double-counting it',()=>{
    const {state}=setup(); deploy(state,'same-event'); deploy(state,'same-event');
    expect(record(state)?.value).toBe(1);
    expect(record(state)?.triggerEventIds).toEqual(['same-event']);
  });

  it('fails restore closed on forged layer, event, player, location, or provider provenance',()=>{
    const {state,source}=setup(); deploy(state,'restore-deploy');
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    const forgedValue=structuredClone(state); forgedValue.abilityRuntime!.persistentLocationTerrainByPlayer!.p1!.shinto!.value=6;
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(forgedValue)).toBe(false);
    const forgedEvent=structuredClone(state); forgedEvent.abilityRuntime!.persistentLocationTerrainByPlayer!.p1!.shinto!.triggerEventIds[0]='forged-event';
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(forgedEvent)).toBe(false);
    const forgedPlayer=structuredClone(state); forgedPlayer.abilityRuntime!.persistentLocationTerrainByPlayer!.p1!.shinto!.playerId='p2';
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(forgedPlayer)).toBe(false);
    const forgedLocation=structuredClone(state); forgedLocation.abilityRuntime!.persistentLocationTerrainByPlayer!.p1!.shinto!.locationId='miyama_town';
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(forgedLocation)).toBe(false);
    const missingProvider=structuredClone(state); missingProvider.cards.find((card)=>card.instanceId===source)!.definitionId='missing.definition';
    expect(isDeferredAbilityRuntimeProvenanceValidForRestore(missingProvider)).toBe(false);
  });

  it('keeps production capability identity-free',()=>{
    const production=readFileSync('packages/rules/src/ability/persistent-location-terrain-capability.ts','utf8');
    for(const needle of ['master.araya','三重结界','矛盾螺旋','荒耶宗莲','core.araya-']) expect(production).not.toContain(needle);
  });
});