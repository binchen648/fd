import type { AbilityCommand, LegalAction } from '../../packages/rules/src/ability/types';
import type { MatchRoomProjection } from '../../packages/rules/src/match-room';

/** Deterministic player policy over public/owner projections, never mutable GameState. */
export function chooseFullMatchDecision(projections: MatchRoomProjection[]): {projection:MatchRoomProjection;command?:AbilityCommand} {
  const first=projections.find(p=>p.match)!.match!;
  if(first.directives.some(d=>d.status==='pending')) throw new Error('Unresolved host directive: '+JSON.stringify(first.directives.filter(d=>d.status==='pending')));
  const projection=projections.find(p=>p.match?.view.legalActions.some(a=>['choose_target','decline_this_window','resolve_response'].includes(a.type)))
    ??projections.find(p=>p.viewer.playerId===first.priorityPlayerId);
  if(!projection?.match)throw new Error('No projected decision owner');
  const m=projection.match,actions=m.view.legalActions,seat=Number(projection.viewer.playerId!.slice(1));
  let action:LegalAction|undefined=actions.find(a=>a.type==='choose_target')??actions.find(a=>a.type==='decline_this_window');
  if(!action&&m.phase==='advance')action=actions.find(a=>a.type==='deploy_player'&&a.locationId===(seat<=2?'magic_workshop':seat%2?'miyama_town':'shinto'))??actions.find(a=>a.type==='deploy_player');
  if(!action&&m.phase==='action')action=actions.find(a=>a.type==='normal_move'&&a.locationId==='recon')??actions.find(a=>a.type==='skip_normal_move')??actions.find(a=>a.type==='confirm_staged_attack')??actions.find(a=>a.type==='complete_empty_regular_play')??actions.find(a=>a.type==='stage_attack_card'&&!a.faceDown)??actions.find(a=>a.type==='stage_attack_card');
  if(action?.type==='choose_target')return {projection,command:{type:'choose_target',decisionId:action.decisionId,selectedIds:action.candidates.slice(0,action.min)}};
  return {projection,...(action?{command:action as AbilityCommand}:{})};
}
