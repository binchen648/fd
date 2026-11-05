import {describe,it,expect} from 'vitest';
import {fixture,activate,choose,active,player,rejectAtomically} from './helpers';
import {projectCurrentPlayerPowers} from '../../../src/core/combat-resolver';
import {restoreMatchSession} from '../../../src/match-session';
import {advanceAbilityPhase,calculateCardPower} from '../../../src/ability/interpreter';
const masters=['kayneth','shinji','kiritsugu','maiya','irisviel'];
function seal(master:string){const f=fixture(`master.${master}.command-spell`);f.session.state.round.activePhase=master==='irisviel'?'advance':'action';return f;}
describe('RC01 typed fallback seals real Session',()=>{
 it.each(masters)('%s moves battlefield to workshop through a private restorable choice',master=>{
  const f=seal(master);for(const p of f.session.state.players)if(p.id!==f.playerId)p.locationId='shinto';const mana=player(f.session,f.playerId).mana;
  activate(f.session,f.playerId,f.sourceId,'command-spell.free-move');
  const pending=f.session.getPlayerView(f.playerId).pendingDecision;expect(pending).toBeDefined();expect(pending!.candidates).toContain('magic_workshop');
  const other=f.session.state.players.find(p=>p.id!==f.playerId)!.id;expect(f.session.getPlayerView(other).pendingDecision).toBeUndefined();
  const restored=restoreMatchSession(f.session.serializeSession());choose(restored,f.playerId,['magic_workshop']);
  expect(player(restored,f.playerId).locationId).toBe('magic_workshop');expect(player(restored,f.playerId).mana).toBe(mana);
  rejectAtomically(restored,f.playerId,{type:'choose_target',decisionId:pending!.id,selectedIds:['shinto']});
 });
 it.each(masters)('%s rejects workshop origin with no seal lost',master=>{const f=seal(master);player(f.session,f.playerId).locationId='magic_workshop';rejectAtomically(f.session,f.playerId,{type:'activate_ability',cardInstanceId:f.sourceId,abilityId:'command-spell.free-move'});});
 it('revalidates selected destination and rejects a forged target atomically',()=>{const f=seal('kayneth');activate(f.session,f.playerId,f.sourceId,'command-spell.free-move');const d=f.session.getPlayerView(f.playerId).pendingDecision!;rejectAtomically(f.session,f.playerId,{type:'choose_target',decisionId:d.id,selectedIds:['not-a-location']});choose(f.session,f.playerId,['shinto']);});
});
describe('RC03 aggregate power seals',()=>{
 it.each([...masters,'gatou','olga-marie'])('%s adds two once to total and preserves printed attacks',master=>{const f=seal(master);const attacks=f.session.state.cards.filter(c=>c.controllerPlayerId===f.playerId&&c.zone==='hand').slice(0,2);attacks.forEach(c=>active(f.session,c.instanceId));const powers=attacks.map(c=>calculateCardPower(f.session.state,c.instanceId).value);const before=projectCurrentPlayerPowers(f.session.state,[f.playerId])[f.playerId]!;activate(f.session,f.playerId,f.sourceId,'command-spell.power-victory');expect(projectCurrentPlayerPowers(f.session.state,[f.playerId])[f.playerId]!-before).toBe(2);expect(attacks.map(c=>calculateCardPower(f.session.state,c.instanceId).value)).toEqual(powers);const restored=restoreMatchSession(f.session.serializeSession());expect(projectCurrentPlayerPowers(restored.state,[f.playerId])[f.playerId]).toBe(before+2);advanceAbilityPhase(restored.state,'action',2);expect(projectCurrentPlayerPowers(restored.state,[f.playerId])[f.playerId]).toBe(before);});
 it('two consumed fallback seals stack +4 once per aggregate',()=>{const f=seal('kayneth');const before=projectCurrentPlayerPowers(f.session.state,[f.playerId])[f.playerId]!;activate(f.session,f.playerId,f.sourceId,'command-spell.power-victory');activate(f.session,f.playerId,f.sourceId,'command-spell.power-victory');expect(projectCurrentPlayerPowers(f.session.state,[f.playerId])[f.playerId]).toBe(before+4);});
});

describe('Seal typed boundaries',()=>{
 it.each(['controller','seals','origin'] as const)('pending movement rejects changed %s atomically',change=>{const f=seal('kayneth');activate(f.session,f.playerId,f.sourceId,'command-spell.free-move');const d=f.session.getPlayerView(f.playerId).pendingDecision!;if(change==='controller')f.session.state.cards.find(c=>c.instanceId===f.sourceId)!.controllerPlayerId='p99';if(change==='seals')(player(f.session,f.playerId) as any).commandSpells=0;if(change==='origin')player(f.session,f.playerId).locationId='magic_workshop';rejectAtomically(f.session,f.playerId,{type:'choose_target',decisionId:d.id,selectedIds:['shinto']});});
});
