import {restoreMatchSession} from '../../src/match-session';
import {describe,it,expect} from 'vitest';
import {fixture,active,player,activate,choose} from './runtime-convergence/helpers';
import {advanceAbilityPhase,calculateCardPower,processAbilityEvent} from '../../src/ability/interpreter';
import {projectCurrentPlayerPowers} from '../../src/core/combat-resolver';
function gatou(used:boolean,next=false){
 const f=fixture('master.gatou.skill.seeker'),s=f.session;
 if(used){const seal=s.state.cards.find(c=>c.controllerPlayerId===f.playerId&&c.definitionId==='master.gatou.command-spell')!;activate(s,f.playerId,seal.instanceId,'command-spell.gain-mana');}
 if(next)advanceAbilityPhase(s.state,'battle',2);
 s.state.round.activePhase='battle';
 const opponent=s.state.players.find(p=>p.id!==f.playerId&&p.masterCardId==='master.kiritsugu')!;
 opponent.locationId=player(s,f.playerId).locationId='miyama_town';player(s,f.playerId).mana=9;s.state.round.prioritySeat=opponent.seat;
 const id='bounded-real-origin';s.state.cards.push({instanceId:id,definitionId:'master.kiritsugu.deck.origin-bullet',ownerPlayerId:opponent.id,controllerPlayerId:opponent.id,zone:'attack_area',visibility:{scope:'public'}});active(s,id);
 activate(s,opponent.id,id,'origin-bullet.cut-bind');choose(s,opponent.id,[f.playerId]);
 return {...f,bulletId:id};
}
describe('Actual-effect combinations: immunity, settled result binding and aggregate power',()=>{
 it.each([[false,false,6],[true,false,9],[true,true,6]])('Gatou actual opponent mana effect used=%s next=%s', (used,next,expected)=>{const f=gatou(Boolean(used),Boolean(next));expect(player(f.session,f.playerId).mana).toBe(expected);});
 it('Origin Bullet bonus uses actual lost mana when meditation prevents the loss',()=>{const f=gatou(true);expect(player(f.session,f.playerId).mana).toBe(9);expect(calculateCardPower(f.session.state,f.bulletId).value).toBe(2);});
 it('Olga soul-drag adds one activation-round aggregate bonus across two physical attacks',()=>{const f=fixture('master.olga-marie.skill.trismegistus-grief');const cards=f.session.state.cards.filter(c=>c.controllerPlayerId===f.playerId&&c.zone==='hand').slice(0,2);expect(cards).toHaveLength(2);for(const c of cards)active(f.session,c.instanceId);active(f.session,f.sourceId);const before=projectCurrentPlayerPowers(f.session.state,[f.playerId])[f.playerId]!;processAbilityEvent(f.session.state,{id:'bounded-live-soul',type:'while_active'});expect(projectCurrentPlayerPowers(f.session.state,[f.playerId])[f.playerId]!-before).toBe(Math.ceil(f.session.state.round.roundNumber/2));});
});


describe('Soul Drag activation snapshot and lifecycle',()=>{
 it('snapshots activation round, does not stack on repeated refresh, and restores the same aggregate',()=>{
  const f=fixture('master.olga-marie.skill.trismegistus-grief');
  advanceAbilityPhase(f.session.state,'action',3);
  const attacks=f.session.state.cards.filter(c=>c.controllerPlayerId===f.playerId&&c.zone==='hand').slice(0,2);
  for(const c of attacks)active(f.session,c.instanceId);
  active(f.session,f.sourceId);f.session.state.cards.find(c=>c.instanceId===f.sourceId)!.zone='field';
  const before=projectCurrentPlayerPowers(f.session.state,[f.playerId])[f.playerId]!;
  processAbilityEvent(f.session.state,{id:'activation-round3',type:'while_active'});
  expect(projectCurrentPlayerPowers(f.session.state,[f.playerId])[f.playerId]!-before).toBe(2);
  advanceAbilityPhase(f.session.state,'battle',5);
  processAbilityEvent(f.session.state,{id:'refresh-round5',type:'while_active'});
  expect(projectCurrentPlayerPowers(f.session.state,[f.playerId])[f.playerId]!-before).toBe(2);
  expect(f.session.state.abilityRuntime!.ongoingEffects.filter(o=>o.sourceCardId===f.sourceId&&o.abilityId==='trismegistus.soul-drag')).toHaveLength(1);
  const restored=restoreMatchSession(f.session.serializeSession());
  expect(projectCurrentPlayerPowers(restored.state,[f.playerId])[f.playerId]!-before).toBe(2);
  restored.state.cards.find(c=>c.instanceId===f.sourceId)!.zone='skill';restored.state.abilityRuntime!.cardState[f.sourceId]!.active=false;
  expect(projectCurrentPlayerPowers(restored.state,[f.playerId])[f.playerId]!).toBe(before);
 });
 it('does not install the bonus before its real source is activated',()=>{
  const f=fixture('master.olga-marie.skill.trismegistus-grief');
  processAbilityEvent(f.session.state,{id:'inactive-soul',type:'while_active'});
  expect(f.session.state.abilityRuntime!.ongoingEffects.filter(o=>o.sourceCardId===f.sourceId&&o.abilityId==='trismegistus.soul-drag')).toEqual([]);
 });
});
