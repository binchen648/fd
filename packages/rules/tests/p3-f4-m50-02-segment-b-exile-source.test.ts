import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD='servant.fixture.skill.exile';
const SOURCE='exile-source';
const ABILITY='exile-self';
function archive(extra:any={}) { return { schemaVersion:'fd-card-authoring-v1', archiveType:'servant_skill_card_archive', id:'servant.fixture', name:'fixture', class:'Servant', cards:[{ id:CARD, name:'fixture', cardType:'servant_skill', owner:{type:'servant',id:'servant.fixture'}, cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0}, playTiming:{phase:'action',window:'controller_play_card_window'}, playRequirements:[], abilities:[{ id:ABILITY, kind:'phase_action', printedClause:'fixture', markers:['m50_structured_v1'], activation:{phase:'action',opens:'controller_action_window'}, conditions:[], targets:[], cost:[], effects:[{type:'exile_source_card',...extra}], ruleModifiers:[], creates:[], lifecycle:{}, responseWindow:{}, limit:{}, visibility:{}, execution:{mode:'automatic',allowedOperations:[]} }] }] }; }
function setup():GameState { const pack=rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]); const s=createSeededGameState({activeSeats:[1,2]}); s.cards=[{instanceId:SOURCE,definitionId:CARD,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'attack_area',visibility:{scope:'public'}}]; s.round.activePhase='action'; s.round.prioritySeat=s.players[0]!.seat; rules.initializeAbilityRuntime(s,pack,{seed:20260924}); (s.abilityRuntime!.cardState as any)[SOURCE]={active:true,faceDown:false}; return s; }
describe('P3 F4 M50-02 Segment B exile source card',()=>{
  it('moves the authoritative source to removed_from_game and deactivates it',()=>{ const s=setup(); expect(rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:ABILITY}).ok).toBe(true); expect(s.cards[0]!.zone).toBe('removed_from_game'); expect(s.cards[0]!.visibility).toEqual({scope:'public'}); expect((s.abilityRuntime!.cardState as any)[SOURCE]).toMatchObject({active:false,faceDown:false}); });
  it('rejects widened exile-source authoring',()=>{ const pack=rules.loadAuthoringJson(archive({target:'controller'})); expect(pack.report).toEqual(expect.arrayContaining([expect.objectContaining({abilityId:ABILITY,path:'effects[0]',reason:'Structured exile-source-card effect must contain only type'})])); });
});
