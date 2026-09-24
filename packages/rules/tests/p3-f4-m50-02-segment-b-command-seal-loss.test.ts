import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD='servant.fixture.skill.command-seal-loss';
const SOURCE='command-seal-loss-source';
const ABILITY='lose-and-branch';

function archive(target:any='controller', amount:any=2):any { return {
  schemaVersion:'fd-card-authoring-v1', archiveType:'servant_skill_card_archive', id:'servant.fixture', name:'fixture', class:'Servant',
  cards:[{ id:CARD, name:'fixture', cardType:'servant_skill', owner:{type:'servant',id:'servant.fixture'},
    cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0}, playTiming:{phase:'action',window:'controller_play_card_window'}, playRequirements:[],
    abilities:[{ id:ABILITY, kind:'phase_action', printedClause:'fixture', markers:['m50_structured_v1'], activation:{phase:'action',opens:'controller_action_window'},
      conditions:[], targets:[], cost:[], effects:[{ type:'lose_command_seals', target, amount, then:[
        { type:'if_condition', conditions:[{type:'target_command_seals_at_most',target,value:1}], then:[{type:'gain_mana',target:'controller',amount:1}] },
        { type:'if_condition', conditions:[{type:'target_command_seals_equals',target,value:0}], then:[{type:'gain_mana',target:'controller',amount:10}] },
      ]}], ruleModifiers:[], creates:[], lifecycle:{}, responseWindow:{}, limit:{}, visibility:{}, execution:{mode:'automatic',allowedOperations:[]} }]
  }]
}; }
function setup(seals:number, target:any='controller', amount:any=2){ const pack=rules.loadAuthoringJson(archive(target,amount)); expect(pack.report).toEqual([]); const s=createSeededGameState({activeSeats:[1,2]}); s.cards=[{instanceId:SOURCE,definitionId:CARD,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}}]; s.round.activePhase='action'; s.round.prioritySeat=s.players[0]!.seat; s.players[0]!.mana=0; (s.players[0] as any).commandSpells=seals; rules.initializeAbilityRuntime(s,pack,{seed:20260924}); return s; }

describe('P3 F4 M50-02 Segment B command-seal loss provenance',()=>{
  it('clamps loss at zero and evaluates nested predicates against PRE-loss count',()=>{ const s=setup(1); expect(rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:ABILITY}).ok).toBe(true); expect((s.players[0] as any).commandSpells).toBe(0); expect(s.players[0]!.mana).toBe(1); expect(s.abilityRuntime!.processedEvents.some((id)=>id.includes('empty-seals'))).toBe(true); });
  it('distinguishes a true pre-loss zero from a post-loss zero',()=>{ const s=setup(0); expect(rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:ABILITY}).ok).toBe(true); expect((s.players[0] as any).commandSpells).toBe(0); expect(s.players[0]!.mana).toBe(11); });
  it('does not match <=1 after reducing a larger PRE-loss count',()=>{ const s=setup(3); expect(rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:ABILITY}).ok).toBe(true); expect((s.players[0] as any).commandSpells).toBe(1); expect(s.players[0]!.mana).toBe(0); });
  it('clamps losses larger than the available seal count',()=>{ const s=setup(2,'controller',5); expect(rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:ABILITY}).ok).toBe(true); expect((s.players[0] as any).commandSpells).toBe(0); });
  it('rejects malformed pre-loss predicates at load time',()=>{ const bad=archive(); bad.cards[0].abilities[0].effects[0].then[0].conditions[0].value=-1; const pack=rules.loadAuthoringJson(bad); expect(pack.report).toEqual(expect.arrayContaining([expect.objectContaining({abilityId:ABILITY,reason:'Pre-loss command-seal condition requires exact shape'})])); });
});
