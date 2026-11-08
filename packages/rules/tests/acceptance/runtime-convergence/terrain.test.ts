import {releaseTerrain} from '../../../src/ability/terrain-state';
import {movePlayer} from '../../../src/core/movement';
import {describe,it,expect} from 'vitest';
import {fixture,playPair,activate,player} from './helpers';
import {advanceAbilityPhase} from '../../../src/ability/interpreter';
import {restoreMatchSession} from '../../../src/match-session';
import {currentDeploymentBonus} from '../../../src/core/terrain-advantage';
function inferno(round=2,own=false){
 const f=fixture('servant.tomoe.skill.sc-tomoe-2');playPair(f.session,f.playerId,f.sourceId);activate(f.session,f.playerId,f.sourceId,'sc-tomoe-2.inferno-fire');
 advanceAbilityPhase(f.session.state,'advance',round);
 for(const p of f.session.state.players)delete p.locationId;
 const actor=own?f.playerId:f.session.state.players.find(p=>p.id!==f.playerId&&p.masterCardId!=='master.kayneth')!.id;
 f.session.state.round.prioritySeat=player(f.session,actor).seat;player(f.session,actor).vp=8;
 (f.session.state.modeState as any).terrainAssignments={};
 return {...f,actor};
}
describe('Current integrated candidate boundary witnesses using actual terrainBid protocol',()=>{
 it('next-round Inferno does not require payment during the activation round',()=>{
  const f=inferno(1);const r=f.session.dispatchPlayerCommand(f.actor,{type:'deploy_player',locationId:'miyama_town',terrainBid:0});expect(r.ok,JSON.stringify(r.rejection)).toBe(true);expect(player(f.session,f.actor).vp).toBe(8);
 });
 it('zero-VP choice permits battlefield entry without a positive terrain slot',()=>{
  const f=inferno();player(f.session,f.actor).vp=0;const r=f.session.dispatchPlayerCommand(f.actor,{type:'deploy_player',locationId:'miyama_town',terrainBid:0});expect(r.ok,JSON.stringify(r.rejection)).toBe(true);expect(player(f.session,f.actor).locationId).toBe('miyama_town');expect(currentDeploymentBonus(f.session.state,f.actor)).toBe(0);
 });
 it('Inferno never charges the player who created it',()=>{
  const f=inferno(2,true);const r=f.session.dispatchPlayerCommand(f.actor,{type:'deploy_player',locationId:'miyama_town',terrainBid:0});expect(r.ok,JSON.stringify(r.rejection)).toBe(true);expect(player(f.session,f.actor).vp).toBe(8);
 });
 it('payment1 can only award map terrain whose actual basic bonus is at most1',()=>{
  const f=inferno();const bonuses=f.session.state.map.locations.find(l=>l.id==='miyama_town')!.terrainBonuses!;expect(bonuses.some(b=>b>1)).toBe(true);
  const r=f.session.dispatchPlayerCommand(f.actor,{type:'deploy_player',locationId:'miyama_town',terrainBid:1});expect(r.ok,JSON.stringify(r.rejection)).toBe(true);expect(currentDeploymentBonus(f.session.state,f.actor)).toBeLessThanOrEqual(1);
 });
 it('a full terrain area does not cap battlefield player capacity',()=>{
  const f=inferno();const others=f.session.state.players.filter(p=>p.id!==f.actor).slice(0,2);for(const p of others)p.locationId='miyama_town';(f.session.state.modeState as any).terrainAssignments={miyama_town:others.map(p=>p.id)};
  const r=f.session.dispatchPlayerCommand(f.actor,{type:'deploy_player',locationId:'miyama_town',terrainBid:0});expect(r.ok,JSON.stringify(r.rejection)).toBe(true);expect(currentDeploymentBonus(f.session.state,f.actor)).toBe(0);
 });
 it('Inferno expires before round3 and ordinary deployment is free again',()=>{
  const f=inferno(3);const r=f.session.dispatchPlayerCommand(f.actor,{type:'deploy_player',locationId:'miyama_town',terrainBid:0});expect(r.ok,JSON.stringify(r.rejection)).toBe(true);expect(player(f.session,f.actor).vp).toBe(8);
 });
 it.each([-1,1.5,'1',null,NaN,Infinity])('malformed deployment terrainBid %s rejects before state mutation',bid=>{
  const f=inferno();const before=JSON.stringify(f.session.state);const r=f.session.dispatchPlayerCommand(f.actor,{type:'deploy_player',locationId:'miyama_town',terrainBid:bid} as any);expect(r.ok).toBe(false);expect(JSON.stringify(f.session.state)).toBe(before);
 });
 it('paid slot and VP remain identical after signed Session restore',()=>{
  const f=inferno();expect(f.session.dispatchPlayerCommand(f.actor,{type:'deploy_player',locationId:'miyama_town',terrainBid:1}).ok).toBe(true);const restored=restoreMatchSession(f.session.serializeSession());expect(restored.getPlayerView(f.actor)).toEqual(f.session.getPlayerView(f.actor));expect(restored.state.players.find(p=>p.id===f.actor)!.vp).toBe(player(f.session,f.actor).vp);
 });
});

describe('RC04 stable terrain identity and refusal boundaries',()=>{
 it('leaving the high slot never promotes the low-slot player, including after restore',()=>{const f=inferno();const high=f.session.state.players.find(p=>p.id!==f.actor)!.id;player(f.session,high).locationId='miyama_town';player(f.session,f.actor).locationId='miyama_town';(f.session.state.modeState as any).terrainAssignments={miyama_town:[high,f.actor]};expect(currentDeploymentBonus(f.session.state,f.actor)).toBe(1);releaseTerrain(f.session.state,high);expect((f.session.state.modeState as any).terrainAssignments.miyama_town).toEqual([null,f.actor]);expect(currentDeploymentBonus(f.session.state,f.actor)).toBe(1);const restored=restoreMatchSession(f.session.serializeSession());expect(currentDeploymentBonus(restored.state,f.actor)).toBe(1);});
 it('pure core movement releases terrain in its returned state only',()=>{const f=inferno();player(f.session,f.actor).locationId='miyama_town';(f.session.state.modeState as any).terrainAssignments={miyama_town:[f.actor,null]};const before=structuredClone(f.session.state);const moved=movePlayer(f.session.state,{playerId:f.actor,to:'shinto',movementKind:'effect'});expect(moved.moved).toBe(true);expect((moved.nextState.modeState as any).terrainAssignments.miyama_town).toEqual([null,null]);expect(f.session.state).toEqual(before);});
 it.each([6,9])('bid %i exceeds max5 or actual VP and changes nothing',bid=>{const f=inferno();const before=JSON.stringify(f.session.state);expect(f.session.dispatchPlayerCommand(f.actor,{type:'deploy_player',locationId:'miyama_town',terrainBid:bid}).ok).toBe(false);expect(JSON.stringify(f.session.state)).toBe(before);});
});
