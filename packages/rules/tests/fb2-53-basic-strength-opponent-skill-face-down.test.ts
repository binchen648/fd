import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { AuthoringAbility, ExecutableCardDefinition } from '../src/ability/types';

const SOURCE='source';
const ABILITY='helena-shaped';

function ability(): AuthoringAbility {
  return {
    id: ABILITY, kind: 'phase_action', printedClause: 'structural FB2-53 proof',
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [],
    targets: [
      { id: 'strength_basic_attack', type: 'card_instance', scope: { zone: 'hand', controller: 'self' },
        constraints: [{ type: rules.BASIC_STRENGTH_ATTACK_CONSTRAINT }], count: { min: 1, max: 1 } },
      { id: 'opponent_servant_skill', type: 'card_instance', scope: { zone: 'skill', controller: 'any' },
        constraints: [{ type: rules.SAME_LOCATION_OPPONENT_FACE_UP_SERVANT_SKILL_CONSTRAINT }], count: { min: 1, max: 1 } },
    ],
    effects: [
      { type: 'play_selected_cards', target: 'strength_basic_attack' },
      { type: rules.SET_SELECTED_CARD_FACE_DOWN_EFFECT, target: 'opponent_servant_skill' },
    ],
    cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic' },
  };
}

function archive(a: AuthoringAbility=ability()) {
  return { schemaVersion:'fd-card-authoring-v1', id:'servant.synthetic', name:'synthetic', cards:[{
    id:'skill.source', name:'source', cardType:'servant_skill',
    cardFace:{typeLabel:'被动',cost:0,basePower:0,attributes:[]},
    playTiming:{phase:'action',window:'controller_play_card_window'}, playRequirements:[], abilities:[a],
  }] };
}

function def(id:string, cardType:string, attrs:string[]=[], cost=0): ExecutableCardDefinition {
  return {
    id, name:id, cardType, cardFace:{typeLabel:'test',cost,basePower: cardType.includes('attack') ? 1 : 0,attributes:attrs},
    playTiming:{phase:'action',window:'controller_play_card_window'}, playRequirements:[], abilities:[], mode:'automatic',
    playKind: cardType.includes('attack') ? 'attack' : 'support', destinationZone: cardType.includes('attack') ? 'attack_area' : 'field',
  };
}

function setup() {
  const loaded=rules.loadAuthoringJson(archive());
  expect(loaded.report).toEqual([]);
  const source=loaded.cards['skill.source'] as unknown as ExecutableCardDefinition;
  const definitions=[
    def('basic.strength','basic_attack',['力量'],2),
    def('basic.magic','basic_attack',['魔术'],1),
    def('servant.strength','servant_attack',['力量'],1),
    def('basic.expensive','basic_attack',['力量'],9),
    def('servant.skill.target','servant_skill'),
    def('servant.skill.remote','servant_skill'),
    def('servant.skill.self','servant_skill'),
    def('servant.skill.down','servant_skill'),
    def('servant.skill.foreign','servant_skill'),
    def('servant.skill.wrong-zone','servant_skill'),
    def('master.skill.target','master_skill'),
  ];
  const pack={cards:{[source.id]:source,...Object.fromEntries(definitions.map((definition)=>[definition.id,definition]))}};
  const state=createSeededGameState({activeSeats:[1,2,3,4]});
  state.round.activePhase='action'; state.round.prioritySeat=state.players[0]!.seat;
  state.players[0]!.mana=5;
  state.players[0]!.locationId='miyama_town';
  state.players[1]!.locationId='miyama_town';
  state.players[2]!.locationId='shinto';
  state.players[3]!.locationId='miyama_town';
  state.cards=[
    {instanceId:SOURCE,definitionId:'skill.source',ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}},
    {instanceId:'eligible',definitionId:'basic.strength',ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'hand',visibility:{scope:'owner_only',ownerPlayerId:'p1'}},
    {instanceId:'magic',definitionId:'basic.magic',ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'hand',visibility:{scope:'owner_only',ownerPlayerId:'p1'}},
    {instanceId:'servant-attack',definitionId:'servant.strength',ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'hand',visibility:{scope:'owner_only',ownerPlayerId:'p1'}},
    {instanceId:'expensive',definitionId:'basic.expensive',ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'hand',visibility:{scope:'owner_only',ownerPlayerId:'p1'}},
    {instanceId:'opponent-basic',definitionId:'basic.strength',ownerPlayerId:'p2',controllerPlayerId:'p2',zone:'hand',visibility:{scope:'owner_only',ownerPlayerId:'p2'}},
    {instanceId:'target',definitionId:'servant.skill.target',ownerPlayerId:'p2',controllerPlayerId:'p2',zone:'skill',visibility:{scope:'public'}},
    {instanceId:'remote',definitionId:'servant.skill.remote',ownerPlayerId:'p3',controllerPlayerId:'p3',zone:'skill',visibility:{scope:'public'}},
    {instanceId:'self',definitionId:'servant.skill.self',ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'public'}},
    {instanceId:'down',definitionId:'servant.skill.down',ownerPlayerId:'p2',controllerPlayerId:'p2',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p2'}},
    {instanceId:'foreign',definitionId:'servant.skill.foreign',ownerPlayerId:'p3',controllerPlayerId:'p2',zone:'skill',visibility:{scope:'public'}},
    {instanceId:'wrong-zone',definitionId:'servant.skill.wrong-zone',ownerPlayerId:'p2',controllerPlayerId:'p2',zone:'field',visibility:{scope:'public'}},
    {instanceId:'master',definitionId:'master.skill.target',ownerPlayerId:'p2',controllerPlayerId:'p2',zone:'skill',visibility:{scope:'public'}},
  ];
  rules.initializeAbilityRuntime(state,pack,{seed:5301,playRulesVersion:'explicit-v1'});
  for(const id of ['source','target','remote','self','foreign','wrong-zone','master']) state.abilityRuntime!.cardState[id]={active:true,faceDown:false,playedRound:0};
  state.abilityRuntime!.cardState.down={active:false,faceDown:true,playedRound:0};
  return state;
}

function activate(state:ReturnType<typeof setup>) {
  return rules.dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:ABILITY});
}
function choose(state:ReturnType<typeof setup>, selectedIds:string[]) {
  const pending=state.abilityRuntime!.pendingDecision!;
  return rules.dispatchAbilityCommand(state,'p1',{type:'choose_target',decisionId:pending.id,selectedIds});
}

function pendingCandidates(state:ReturnType<typeof setup>): string[] {
  const action=rules.getLegalActions(state,'p1').find(x=>x.type==='choose_target');
  return action && action.type==='choose_target' ? action.candidates : [];
}

describe('P3-FB2-53 basic Strength play -> opponent servant-skill face-down',()=>{
  it('admits only the exact raw and compiled whole envelope',()=>{
    expect(rules.isAcceptedBasicStrengthOpponentSkillFaceDownAbility(ability(),'authoring')).toBe(true);
    const loaded=rules.loadAuthoringJson(archive()); expect(loaded.report).toEqual([]);
    const compiled=loaded.cards['skill.source']!.abilities[0]!;
    expect(rules.isAcceptedBasicStrengthOpponentSkillFaceDownAbility(compiled,'compiled')).toBe(true);
  });

  it('fails closed for wrong-slot, widened, reordered, and extra-key near matches',()=>{
    const variants:Array<(a:AuthoringAbility)=>void>=[
      a=>{a.targets.reverse();},
      a=>{a.targets[0]!.constraints=[{type:'has_attribute',attribute:'力量'}];},
      a=>{a.targets[0]!.count={min:0,max:1};},
      a=>{a.targets[1]!.scope={zone:'skill',controller:'self'};},
      a=>{a.effects.reverse();},
      a=>{a.effects[1]!.extra='widened';},
      a=>{a.creates=[{type:rules.SET_SELECTED_CARD_FACE_DOWN_EFFECT,target:'opponent_servant_skill'}];},
    ];
    for(const mutate of variants){const a=ability();mutate(a);expect(rules.isBasicStrengthOpponentSkillFaceDownCandidate(a)).toBe(true);expect(rules.isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a,'authoring')).toBe(false);const loaded=rules.loadAuthoringJson(archive(a));expect(loaded.report).toEqual(expect.arrayContaining([expect.objectContaining({path:'basicStrengthOpponentSkillFaceDown.gateway',status:'unsupported'})]));}
  });

  it('offers only a currently playable controller-hand basic Strength attack as stage one',()=>{
    const state=setup(); expect(activate(state).ok).toBe(true);
    expect(pendingCandidates(state)).toEqual(['eligible']);
  });

  it('keeps stage one selection mutation-free and offers only the exact same-location opponent face-up servant skill at stage two',()=>{
    const state=setup(); expect(activate(state).ok).toBe(true);
    const before=structuredClone(state);
    expect(choose(state,['eligible']).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(before.players[0]!.mana);
    expect(state.cards.find(c=>c.instanceId==='eligible')!.zone).toBe('hand');
    expect(pendingCandidates(state)).toEqual(['target']);
  });

  it('executes both effects transactionally: normal cost/play provenance then physical face-down mutation',()=>{
    const state=setup(); expect(activate(state).ok).toBe(true); expect(choose(state,['eligible']).ok).toBe(true);
    const targetBefore={...state.cards.find(c=>c.instanceId==='target')!};
    const result=choose(state,['target']); expect(result.ok).toBe(true);
    expect(state.players[0]!.mana).toBe(3);
    expect(state.cards.find(c=>c.instanceId==='eligible')).toMatchObject({zone:'attack_area',ownerPlayerId:'p1',controllerPlayerId:'p1'});
    expect(state.abilityRuntime!.cardState.eligible).toMatchObject({active:true,faceDown:false,paidManaOnPlay:2,playedRound:state.round.roundNumber});
    expect(state.abilityRuntime!.processedEvents.some((id)=>id.startsWith('declare-'))).toBe(true);
    expect(state.abilityRuntime!.processedEvents.some((id)=>id.startsWith('play-'))).toBe(true);
    expect(state.abilityRuntime!.playCounters).toMatchObject({
      cardsPlayedByPlayer:{p1:1}, faceUpCardsPlayedByPlayer:{p1:1}, attacksDeclaredByPlayer:{},
    });
    expect(state.abilityRuntime!.events).toEqual(expect.arrayContaining([
      expect.objectContaining({type:'card_set_face_down',controllerId:'p1',playerId:'p2',sourceCardId:SOURCE,abilityId:ABILITY,cardInstanceId:'target'}),
    ]));
    expect(state.cards.find(c=>c.instanceId==='target')).toMatchObject({
      instanceId:targetBefore.instanceId,definitionId:targetBefore.definitionId,ownerPlayerId:targetBefore.ownerPlayerId,
      controllerPlayerId:targetBefore.controllerPlayerId,zone:targetBefore.zone,visibility:{scope:'owner_only',ownerPlayerId:'p2'},
    });
    expect(state.abilityRuntime!.cardState.target).toMatchObject({active:false,faceDown:true});
  });

  it('revalidates a stale first-stage decision before mutation',()=>{
    const state=setup(); expect(activate(state).ok).toBe(true);
    state.cards.find(c=>c.instanceId==='eligible')!.zone='discard';
    const before=structuredClone(state); const result=choose(state,['eligible']);
    expect(result.ok).toBe(false); expect(state).toEqual(before);
  });

  it('revalidates a stale second-stage target and never leaves a half-played attack behind',()=>{
    const state=setup(); expect(activate(state).ok).toBe(true); expect(choose(state,['eligible']).ok).toBe(true);
    state.players[1]!.locationId='shinto';
    const before=structuredClone(state); const result=choose(state,['target']);
    expect(result.ok).toBe(false); expect(state).toEqual(before);
    expect(state.cards.find(c=>c.instanceId==='eligible')!.zone).toBe('hand'); expect(state.players[0]!.mana).toBe(5);
  });

  it('requires both mandatory target classes before offering activation',()=>{
    const noAttack=setup(); noAttack.cards.find(c=>c.instanceId==='eligible')!.zone='discard';
    expect(rules.getLegalActions(noAttack,'p1').some(a=>a.type==='activate_ability'&&a.cardInstanceId===SOURCE&&a.abilityId===ABILITY)).toBe(false);
    const noSkill=setup(); noSkill.players[1]!.locationId='shinto';
    expect(rules.getLegalActions(noSkill,'p1').some(a=>a.type==='activate_ability'&&a.cardInstanceId===SOURCE&&a.abilityId===ABILITY)).toBe(false);
  });
});
