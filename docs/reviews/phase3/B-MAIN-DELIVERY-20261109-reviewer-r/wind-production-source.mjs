import assert from 'node:assert/strict';
import {createMatchSession} from './packages/rules/src/match-session.ts';
import {advanceAbilityPhase,calculateCardPower} from './packages/rules/src/ability/interpreter.ts';
const session=createMatchSession({seed:394});
const state=session.state;
const player=state.players.find(p=>p.servantCardId==='servant.artoria-alt');
const sourceId=state.cards.find(c=>c.controllerPlayerId===player.id&&c.definitionId==='servant.artoria-alt.skill.sc-artoria-alt-1').instanceId;
const play = (command) => {
  const result=session.dispatchPlayerCommand(player.id,command);
  assert.equal(result.ok,true,JSON.stringify({command,rejection:result.rejection}));
};
state.eventPlacements=[];
state.currentSituationModifiers=[];
for(const [round,bonus] of [[1,3],[2,6],[3,9],[5,3]]){
  advanceAbilityPhase(state,'action',round);
  state.round.prioritySeat=player.seat;
  state.players.find(p=>p.id===player.id).mana=12;
  state.players.find(p=>p.id===player.id).locationId='miyama_town';
  state.cards.find(c=>c.instanceId===sourceId).zone='skill';
  const handAttacks = () => state.cards.filter(c => c.ownerPlayerId === player.id && c.zone === 'hand' &&
    state.abilityRuntime.pack.cards[c.definitionId]?.cardType === 'basic_attack');
  for (const card of state.cards.filter(c => c.ownerPlayerId === player.id && c.zone === 'deck' &&
    state.abilityRuntime.pack.cards[c.definitionId]?.cardType === 'basic_attack')) {
    if (handAttacks().length >= 3) break;
    card.zone = 'hand';
  }
  assert(handAttacks().length >= 3);
  play({type:'skip_normal_move'});
  play({type:'stage_attack_card',cardInstanceId:sourceId});
  const actions=session.getPlayerView(player.id).legalActions;
  if(!actions.some(a=>a.type==='confirm_staged_attack')){
    const companion=actions.find(a=>a.type==='stage_attack_card'&&a.faceDown) ?? actions.find(a=>a.type==='stage_attack_card');
    assert(companion,'no legal companion');
    play(companion);
  }
  play({type:'confirm_staged_attack'});
  const before=calculateCardPower(state,sourceId).value;
  const command={type:'activate_ability',cardInstanceId:sourceId,abilityId:'sc-artoria-alt-1.chain-of-wind-king'};
  assert(session.getClientProjection(player.id).view.legalActions.some(a=>a.type===command.type&&a.abilityId===command.abilityId));
  const beforeMana=state.players.find(p=>p.id===player.id).mana;
  play(command);
  const after=calculateCardPower(state,sourceId).value;
  const paid=beforeMana-state.players.find(p=>p.id===player.id).mana;
  assert.equal(after-before,bonus);
  assert.equal(paid,4);
  console.log(JSON.stringify({round,before,after,bonus,paid}));
  session.discardRoundAttackAreaCards();
}
