import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const HEAD='8789fcad58867b999a9d713b83342f602fa3f775',BASE='508050bb701d2dd2fe425dc323eca2a970ec95c1';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:30000000}).trim();
assert.equal(git('rev-parse','HEAD'),HEAD);
const mod=p=>import(pathToFileURL(resolve(p)).href);
const rules=await mod('packages/rules/src/ability/interpreter.ts');
const {loadAuthoringJson}=await mod('packages/rules/src/ability/loader.ts');
const {createSeededGameState}=await mod('packages/rules/src/tools/seeded-state.ts');
const timed=await mod('packages/rules/src/ability/timed-resource-suppression.ts');
const {playerIgnoresAbilityFromController}=await mod('packages/rules/src/ability/player-ability-immunity.ts');
const {grantMana}=await mod('packages/rules/src/core/rule-overrides.ts');
const {drawCard}=await mod('packages/rules/src/core/card-play.ts');
const {executeResolution}=await mod('packages/rules/src/ability/resolution-dataflow.ts');
const content=await mod('packages/content/src/playtest-pack-loader.ts');
const cloak=JSON.parse(readFileSync('data/authoring/servants/servant.siegfried.json','utf8'));
const ID='fixture.timed-block';
function ab(resource){return {id:resource,kind:'phase_action',printedClause:'Independent supported timed suppression fixture',activation:{phase:'action',opens:'controller_action_window',requiresSourceState:'active'},conditions:[resource==='mana_gain'?{type:'source_reversed'}:{type:'source_reversed',negated:true}],targets:[],effects:[{type:'suppress_all_active_players_resource_through_round',resource,roundsAfterCurrent:1}],cost:[],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}};}
function archive(){return {...cloak,cards:[...cloak.cards,{id:ID,name:ID,cardType:'master_skill',cardFace:{cost:0,basePower:0,attributes:[]},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[ab('normal_card_draw'),ab('mana_gain')]}]};}
function setup(){const s=createSeededGameState();s.cards=[];s.players[0].servantCardId='servant.siegfried';s.players[0].locationId=s.players[1].locationId='shinto';s.players[0].mana=1;s.round.activePhase='action';s.round.prioritySeat=1;const pack=loadAuthoringJson(archive());assert.deepEqual(pack.report,[]);rules.initializeAbilityRuntime(s,pack,{seed:463});return s;}
function card(s,id,owner='p1',zone='attack_area'){const c={instanceId:`${id}:${s.cards.length}`,definitionId:id,ownerPlayerId:owner,controllerPlayerId:owner,zone,visibility:{scope:'public'}};s.cards.push(c);s.abilityRuntime.cardState[c.instanceId]={active:zone==='attack_area',faceDown:false,playedRound:s.round.roundNumber};return c;}
function basic(s,id,attrs=['力量'],owner='p1',zone='attack_area'){s.abilityRuntime.pack.cards[id]={id,name:id,cardType:'basic_attack',cardFace:{cost:0,basePower:2,attributes:attrs},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[],mode:'automatic'};return card(s,id,owner,zone);}
function activate(s,owner,c,id){s.round.prioritySeat=s.players.find(p=>p.id===owner).seat;assert.equal(rules.dispatchAbilityCommand(s,owner,{type:'activate_ability',cardInstanceId:c.instanceId,abilityId:id}).ok,true);}
function block(s,resource){const c=card(s,ID,'p2');s.abilityRuntime.cardState[c.instanceId].reversed=resource==='mana_gain';activate(s,'p2',c,resource);return c;}
const results=[];function check(name,fn){try{results.push({name,pass:true,observations:fn()});}catch(e){results.push({name,pass:false,detail:String(e)});}}
check('Exact task/lineage and unchanged material/generated content',()=>{assert.equal(git('merge-base',BASE,HEAD),BASE);assert.equal(git('rev-list','--count',`${BASE}..${HEAD}`),'2');assert.equal(git('rev-parse',`${HEAD}^`),'f2e2c8e727e2606d7d753c8ee6b164a2328cc39d');assert.equal(git('diff','--name-only',BASE,HEAD,'data'),'');assert.ok(readFileSync('docs/agents/PHASE3-TASK-INDEX.md','utf8').includes('## TASK P3-B-SITONAI-COMBINATION-FIMBUL-CAPABILITY'));return {commits:2,materialDelta:0,credit:0};});
check('F1 same-location actual cloak is still subjected to new global mana/draw suppression',()=>{
  for(const resource of ['mana_gain','normal_card_draw']){const s=setup(),c=card(s,'servant.siegfried.skill.sc-siegfried-1');activate(s,'p1',c,'sc-siegfried-1.invisibility-cloak');assert.equal(playerIgnoresAbilityFromController(s,'p1','p2'),true);const deck=basic(s,'fixture.deck',[],'p1','deck');block(s,resource);
    if(resource==='mana_gain'){assert.equal(grantMana(s,'p1',2).actualAmount,0);assert.equal(s.players[0].mana,1);}else{assert.deepEqual(drawCard(s,'p1').playedCardIds,[]);assert.equal(s.cards.find(c=>c.instanceId===deck.instanceId).zone,'deck');}}
  return {actualCloak:true,immunityPredicate:true,manaStillBlocked:true,drawStillBlocked:true,formalConsumer:false};
});
check('Away-controller/no-cloak global suppression works and expires after inclusive next round',()=>{
  for(const protectedSameLocation of [false,true]){const s=setup();if(protectedSameLocation){const c=card(s,'servant.siegfried.skill.sc-siegfried-1');activate(s,'p1',c,'sc-siegfried-1.invisibility-cloak');s.players[1].locationId='miyama_town';}block(s,'mana_gain');assert.equal(grantMana(s,'p1',2).actualAmount,0);s.round.roundNumber=2;assert.equal(grantMana(s,'p1',2).actualAmount,0);s.round.roundNumber=3;assert.equal(grantMana(s,'p1',2).actualAmount,2);timed.expireTimedResourceSuppressions(s);assert.deepEqual(s.abilityRuntime.manaGainBlockedThroughRoundByPlayer,{});}
  return {controls:2,round2Blocked:true,round3Expired:true};
});
check('Exact distinct attribute pair rejects dual card/duplicates but permits neutral third',()=>{const c={type:timed.EXACT_ACTIVE_ATTACK_ATTRIBUTE_PAIR_CONDITION,firstAttribute:'力量',secondAttribute:'魔术',distinctCards:true};const s=setup();basic(s,'fixture.strength');basic(s,'fixture.magic',['魔术']);assert.equal(timed.controllerHasExactDistinctActiveAttackAttributePair(s,'p1',c),true);basic(s,'fixture.neutral',['特殊']);assert.equal(timed.controllerHasExactDistinctActiveAttackAttributePair(s,'p1',c),true);basic(s,'fixture.duplicate');assert.equal(timed.controllerHasExactDistinctActiveAttackAttributePair(s,'p1',c),false);const dual=setup();basic(dual,'fixture.dual',['力量','魔术']);assert.equal(timed.controllerHasExactDistinctActiveAttackAttributePair(dual,'p1',c),false);return {positive:2,negative:2};});
check('R1 nested/wrong-shell/malformed count controls and typed no-op',()=>{
  for(const mutate of [a=>{a.effects=[{type:'branch',branches:[{if:{type:'can_adjust_mana',player:'controller',amount:1},then:a.effects}]}];},a=>{a.kind='forced_trigger';a.activation={trigger:'round_start'};},a=>{a.effects[0].extra=true;}]){const input=archive(),a=input.cards.at(-1).abilities[0];mutate(a);assert.ok(loadAuthoringJson(input).report.some(r=>r.abilityId===a.id&&r.status==='unsupported'));}
  const s=setup(),source=block(s,'normal_card_draw');const draw={...ab('draw'),id:'fixture.draw',conditions:[],effects:[{type:'draw_cards',count:-1}]};s.abilityRuntime.pack.cards[ID].abilities.push(draw);assert.throws(()=>rules.resolveEffect(s,{sourceCardId:source.instanceId,abilityId:draw.id,controllerId:'p2',variables:{},selections:{}},draw.effects[0]),/Invalid draw count/);
  const out=executeResolution({state:s,controllerId:'p1',sourceCardId:source.instanceId,abilityId:'fixture.typed',resolutionId:'fixture.typed',effects:[{id:'draw',type:'draw_cards',player:'controller',count:1}]});assert.equal(out.results[0].status,'no_op');return {gatewayVariants:3,invalidCountRejected:true,typedDrawNoOp:true};
});
check('Generated evidence mismatch inherited absent images only',()=>{const loaded=content.loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'),{workspaceRoot:resolve('.')});const fresh=content.compileLoadedPlaytestPack(loaded,content.validateLoadedPlaytestPack(loaded,{workspaceRoot:resolve('.')})).evidenceReport,old=JSON.parse(readFileSync('data/generated/fd-playtest-v1.evidence-report.json','utf8'));const missing=fresh.issues.filter(i=>!old.issues.some(j=>j.entityId===i.entityId&&j.code===i.code));assert.ok(missing.every(i=>i.code==='SOURCE_ASSET_UNVERIFIED'&&!i.blocking));const norm=structuredClone(fresh);norm.issues=norm.issues.filter(i=>!missing.some(m=>m.entityId===i.entityId&&m.code===i.code));for(const row of norm.entities)if(missing.some(m=>m.entityId===row.entityId))row.issueCodes=row.issueCodes.filter(c=>c!=='SOURCE_ASSET_UNVERIFIED');assert.deepEqual(norm,old);return {local:fresh.issues.length,checkedIn:old.issues.length,missing:missing.length,strictVerifierPassed:false};});
process.stdout.write(`${JSON.stringify({pr:463,targetSha:HEAD,results},null,2)}\n`);process.exitCode=results.some(r=>!r.pass)?1:0;
