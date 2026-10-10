import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const HEAD='20f7c6d3262b00ca072554fc07be5fc2ba89e7ab',BASE='fe37f27e17007af77573ab99e02b40870d62d532';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:30000000}).trim();
assert.equal(git('rev-parse','HEAD'),HEAD);
const mod=p=>import(pathToFileURL(resolve(p)).href);
const rules=await mod('packages/rules/src/ability/interpreter.ts');
const {loadAuthoringJson}=await mod('packages/rules/src/ability/loader.ts');
const {createSeededGameState}=await mod('packages/rules/src/tools/seeded-state.ts');
const {createMatchSession}=await mod('packages/rules/src/match-session.ts');
const mechanics=await mod('packages/rules/src/ability/revealed-card-mechanics.ts');
const {getEffectiveCardAttributes}=await mod('packages/rules/src/ability/card-instance-state.ts');
const content=await mod('packages/content/src/playtest-pack-loader.ts');
const GRANT=mechanics.GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID,ROOT='servant.review-fixture',SOURCE=`${ROOT}.source`,BASIC='basic.review-fixture',ATTR=`${ROOT}.attribute`;
function ability(id,kind='passive',activation={}){return {id,kind,printedClause:'Independent supported capability fixture',activation,conditions:[],targets:[],effects:[],cost:[],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}};}
function archive(){const grant=ability('grant');grant.effects=[{type:'grant_controller_basic_attack_double_base_remove_action_while_source_revealed',manaCost:2,basePowerMultiplier:2,removeAfter:'after_battle_ended'}];
  const curse=ability('curse','forced_trigger',{trigger:'round_start'});curse.conditions=[{type:'source_revealed'}];curse.effects=[{type:'adjust_victory_points',player:'controller',amount:-1}];
  const refund=ability('refund','residual',{trigger:'after_battle_ended'});refund.conditions=[{type:'source_revealed'}];refund.targets=[{id:'victim',type:'card_instance',scope:{zone:'attack_area',owner:'any',controller:'any'},count:{min:1,max:1},constraints:[{type:'is_attack'},{type:'played_this_round'},{type:'controlled_by_event_battle_opponent_at_controller_location'}]}];refund.effects=[{type:'gain_mana_equal_selected_card_paid_cost',target:'victim'}];
  const attr=ability('attribute');attr.effects=[{type:'gain_attribute_if_owned_definition_revealed',definitionId:SOURCE,attribute:'迅捷'}];
  const def=(id,cardType,abilities)=>({id,name:id,cardType,...(cardType==='servant_skill'?{owner:{type:'servant',id:ROOT}}:{}),cardFace:{cost:0,basePower:4,attributes:['力量']},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities,verification:{implementationStatus:'complete'}});
  return {schemaVersion:'fd-card-authoring-v1',id:ROOT,cards:[def(SOURCE,'servant_skill',[grant,curse,refund]),def(BASIC,'basic_attack',[]),def(ATTR,'servant_skill',[attr])]};
}
function setup(s=createSeededGameState(),input=archive()){s.cards=[];s.players[0].servantCardId=s.players[1].servantCardId=ROOT;s.players[0].locationId=s.players[1].locationId='shinto';s.players[0].mana=s.players[1].mana=10;s.players[0].vp=10;s.round.activePhase='action';s.round.prioritySeat=1;
  const pack=loadAuthoringJson(input);delete s.abilityRuntime;rules.initializeAbilityRuntime(s,pack,{seed:461});return s;}
function card(s,id,owner='p1',zone='skill'){const c={instanceId:`${id}:${s.cards.length}`,definitionId:id,ownerPlayerId:owner,controllerPlayerId:owner,zone,visibility:{scope:'public'}};s.cards.push(c);s.abilityRuntime.cardState[c.instanceId]={active:zone==='attack_area',faceDown:false,playedRound:s.round.roundNumber};return c;}
function play(s,owner,c){s.round.prioritySeat=s.players.find(p=>p.id===owner).seat;const out=rules.dispatchAbilityCommand(s,owner,{type:'play_card',cardInstanceId:c.instanceId});assert.equal(out.ok,true,JSON.stringify(out));}
function grant(s,owner,c){s.round.prioritySeat=s.players.find(p=>p.id===owner).seat;assert.equal(rules.dispatchAbilityCommand(s,owner,{type:'activate_ability',cardInstanceId:c.instanceId,abilityId:GRANT}).ok,true);}
const terminal={id:'battle-phase:1:after_battle_ended',type:'after_battle_ended',battlePhaseResolutionId:'battle-phase:1',battleParticipantIds:['p1','p2']};
const results=[];function check(name,fn){try{results.push({name,pass:true,observations:fn()});}catch(e){results.push({name,pass:false,detail:String(e)});}}
check('Exact task/lineage/no authoring or generated delta',()=>{assert.equal(git('merge-base',BASE,HEAD),BASE);assert.equal(git('rev-list','--count',`${BASE}..${HEAD}`),'3');assert.equal(git('rev-parse',`${HEAD}^`),'022fd9faa818feb1d4da56212f13adc7ee14d063');
  assert.equal(git('diff','--name-only',BASE,HEAD,'data'),'');assert.ok(readFileSync('docs/agents/PHASE3-TASK-INDEX.md','utf8').includes('## TASK P3-B-SIGURD-REVEALED-SOURCE-CAPABILITY'));assert.deepEqual(loadAuthoringJson(archive()).report,[]);return {commits:3,zeroMaterialDelta:true,credit:0};});
check('F1 reproduce:real MatchSession round starter skips newly added round_start ability event',()=>{
  const session=createMatchSession({seed:461,humanPlayerIds:['p1']}),s=setup(session.state),source=card(s,SOURCE);play(s,'p1',source);assert.ok(mechanics.physicalCardWasRevealed(s,source.instanceId));
  session.startRound(2);assert.equal(session.state.round.roundNumber,2);assert.equal(session.state.players[0].vp,10);assert.ok(!session.state.abilityRuntime.processedEvents.some(id=>id.includes('round-start')));
  const direct=setup(),c=card(direct,SOURCE);play(direct,'p1',c);rules.advanceAbilityPhase(direct,'preparation',2);assert.equal(direct.players[0].vp,9);
  return {realSessionVp:10,directPhaseApiVp:9,realProductionStarterCalled:true};
});
check('F2 reproduce:canonical terminal removes refund target before mandatory continuation',()=>{
  const input=archive();input.cards[1].cardFace.cost=3;const s=setup(undefined,input),one=card(s,SOURCE),two=card(s,SOURCE,'p2');play(s,'p1',one);play(s,'p2',two);
  // Seed the supported closed-source state after recording real physical plays.
  for(const c of [one,two]){s.cards.find(x=>x.instanceId===c.instanceId).zone='discard';s.abilityRuntime.cardState[c.instanceId].active=false;}
  const target=card(s,BASIC,'p2','hand');play(s,'p2',target);grant(s,'p2',target);assert.equal(s.abilityRuntime.cardState[target.instanceId].paidManaOnPlay,3);
  s.players[0].mana=1;rules.processAbilityEvent(s,terminal);const d=s.abilityRuntime.pendingDecision;assert.ok(d);assert.equal(d.controllerId,'p1');assert.deepEqual(d.candidates,[target.instanceId]);assert.equal(s.cards.find(c=>c.instanceId===target.instanceId).zone,'removed_from_game');
  const before=structuredClone(s),out=rules.dispatchAbilityCommand(s,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[target.instanceId]});assert.equal(out.ok,false);assert.deepEqual(s,before);assert.ok(s.abilityRuntime.pendingDecision);
  assert.throws(()=>rules.advanceAbilityPhase(s,'cleanup'),/Resolve the current decision/);return {removedBeforeChoice:true,choiceRejected:true,pendingBlocksAdvance:true,paidCost:3,manaRemains:1};
});
check('Ordinary canonical removal doubles/pays2 and rejects noncanonical event',()=>{
  const input=archive();input.cards[0].abilities=input.cards[0].abilities.filter(a=>a.id!=='refund');const s=setup(undefined,input),source=card(s,SOURCE);play(s,'p1',source);const basic=card(s,BASIC,'p1','hand');play(s,'p1',basic);grant(s,'p1',basic);assert.equal(s.players[0].mana,8);assert.equal(rules.calculateCardPower(s,basic.instanceId).value,8);
  rules.processAbilityEvent(s,{id:'fake',type:'after_battle_ended'});assert.equal(s.cards.find(c=>c.instanceId===basic.instanceId).zone,'attack_area');rules.processAbilityEvent(s,terminal);assert.equal(s.cards.find(c=>c.instanceId===basic.instanceId).zone,'removed_from_game');return {paid:2,power:8,canonicalRemoved:true};
});
check('Whole-ability gateway rejects wrong-kind,false-condition and disabled markers',()=>{
  for(const change of [a=>{a.kind='forced_trigger';a.activation={trigger:'round_start'};},a=>{a.conditions=[{type:'controller_mana_at_least',amount:999}];},a=>{a.execution={mode:'unsupported',allowedOperations:[]};}]){
    const input=archive();change(input.cards[0].abilities[0]);const pack=loadAuthoringJson(input);assert.ok(pack.report.some(r=>r.abilityId==='grant'&&r.status==='unsupported'));const s=setup(undefined,input),source=card(s,SOURCE,'p1','discard'),basic=card(s,BASIC,'p1','attack_area');s.abilityRuntime.cardPlayCountByInstance[source.instanceId]=1;assert.equal(mechanics.grantedBasicDoubleRemoveAbility(s,basic.instanceId),undefined);}
  return {variants:3,derivedGrants:0};
});
check('Conditional owned revealed definition uses real play and rejects false enclosing condition',()=>{
  const s=setup(),source=card(s,SOURCE),target=card(s,ATTR);assert.deepEqual(getEffectiveCardAttributes(s,target.instanceId),['力量']);play(s,'p1',source);assert.deepEqual(getEffectiveCardAttributes(s,target.instanceId),['力量','迅捷']);
  const input=archive();input.cards[2].abilities[0].conditions=[{type:'controller_mana_at_least',amount:999}];const bad=setup(undefined,input),c=card(bad,SOURCE),t=card(bad,ATTR);play(bad,'p1',c);assert.deepEqual(getEffectiveCardAttributes(bad,t.instanceId),['力量']);return {realReveal:true,invalidMarkerRejected:true};
});
check('Generated evidence mismatch is inherited absent external images only',()=>{
  const loaded=content.loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'),{workspaceRoot:resolve('.')});const fresh=content.compileLoadedPlaytestPack(loaded,content.validateLoadedPlaytestPack(loaded,{workspaceRoot:resolve('.')})).evidenceReport,old=JSON.parse(readFileSync('data/generated/fd-playtest-v1.evidence-report.json','utf8'));
  const missing=fresh.issues.filter(i=>!old.issues.some(j=>j.entityId===i.entityId&&j.code===i.code));assert.ok(missing.every(i=>i.code==='SOURCE_ASSET_UNVERIFIED'&&!i.blocking));const norm=structuredClone(fresh);norm.issues=norm.issues.filter(i=>!missing.some(m=>m.entityId===i.entityId&&m.code===i.code));for(const row of norm.entities)if(missing.some(m=>m.entityId===row.entityId))row.issueCodes=row.issueCodes.filter(c=>c!=='SOURCE_ASSET_UNVERIFIED');assert.deepEqual(norm,old);return {local:fresh.issues.length,checkedIn:old.issues.length,missing:missing.length,strictVerifierPassed:false};
});
process.stdout.write(`${JSON.stringify({pr:461,targetSha:HEAD,results},null,2)}\n`);process.exitCode=results.some(r=>!r.pass)?1:0;
